package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"
)

type moduleEntitlementUpdatePayload struct {
	TenantID string `json:"tenant_id"`
	ClientID string `json:"client_id"`
	Email    string `json:"email"`

	ModuleID string `json:"module_id"`
	Enabled  bool   `json:"enabled"`
	Source   string `json:"source"`
}

type tenantSubscriptionSavePayload struct {
	TenantID     string `json:"tenant_id"`
	ClientID     string `json:"client_id"`
	Email        string `json:"email"`
	PlanID       string `json:"plan_id"`
	BillingCycle string `json:"billing_cycle"`
	Status       string `json:"status"`
}

func registerModuleHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/client/modules", handleClientModules)
	mux.HandleFunc("/api/client/catalog", handleClientCatalog)
	mux.HandleFunc("/api/public/business-types", handlePublicBusinessTypes)

	mux.HandleFunc("/api/superadmin/modules", handleSuperadminModules)
	mux.HandleFunc("/api/superadmin/modules/create", handleSuperadminModuleCreate)
	mux.HandleFunc("/api/superadmin/modules/update", handleSuperadminModuleUpdate)
	mux.HandleFunc("/api/superadmin/tenant-modules", handleSuperadminTenantModules)
	mux.HandleFunc("/api/superadmin/tenant-modules/update", handleSuperadminTenantModulesUpdate)
	mux.HandleFunc("/api/superadmin/tenant-modules/price/update", handleSuperadminTenantModulePriceUpdate)
	mux.HandleFunc("/api/superadmin/subscriptions/save", handleSuperadminSubscriptionSave)
	mux.HandleFunc("/api/superadmin/plans/save", handleSuperadminPlanSave)
	// SCS_BUSINESS_PLAN_MATRIX_ROUTE_V1
	mux.HandleFunc("/api/superadmin/business-plan-matrix", handleSuperadminBusinessPlanMatrix)
	mux.HandleFunc("/api/superadmin/business-plan-matrix/save", handleSuperadminBusinessPlanMatrixSave)
	mux.HandleFunc("/api/superadmin/tenants/summary", handleSuperadminTenantsSummary)
}

func ensureModuleEntitlementSchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS modules (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	category TEXT NOT NULL,
	price_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
	price_yearly NUMERIC(12,2) NOT NULL DEFAULT 0,
	route TEXT NOT NULL DEFAULT '',
	icon TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
	sort_order INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
	yearly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
	sort_order INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_modules (
	plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
	module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (plan_id, module_id)
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
	tenant_id TEXT PRIMARY KEY,
	plan_id TEXT REFERENCES plans(id),
	status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','past_due','cancelled','expired','manual')),
	billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly','manual')),
	amount NUMERIC(12,2) NOT NULL DEFAULT 0,
	started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_modules (
	tenant_id TEXT NOT NULL,
	module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
	enabled BOOLEAN NOT NULL DEFAULT FALSE,
	source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('plan','manual','upgrade')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (tenant_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_modules_status_sort ON modules(status, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_plans_status_sort ON plans(status, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant_enabled ON tenant_modules(tenant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);

ALTER TABLE tenant_modules
  ADD COLUMN IF NOT EXISTS monthly_price_snapshot NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yearly_price_snapshot NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_override BOOLEAN DEFAULT FALSE;

ALTER TABLE tenant_subscriptions
  ADD COLUMN IF NOT EXISTS plan_base_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS module_addons_amount NUMERIC DEFAULT 0;
`)
	if err != nil {
		return err
	}

	if err := seedDefaultModulesAndPlans(ctx, db); err != nil {
		return err
	}

	if err := seedIndustryCategoryModulesAndPlans(ctx, db); err != nil {
		return err
	}
	if err := scsEnsureGlobalPlansOnly(ctx, db); err != nil {
		return err
	}
	if err := ensureBusinessTypesSchemaAndSeed(ctx, db); err != nil {
		return err
	}

	// SCS_BUSINESS_PLAN_MATRIX_SCHEMA_STARTUP_V1
	if err := ensureBusinessTypesSchemaAndSeed(ctx, db); err != nil {
		return err
	}
	if err := ensureBusinessPlanMatrixSchema(ctx, db); err != nil {
		return err
	}

	return seedEnterpriseModuleCatalogV1(ctx, db)
}

func scsEnsureGlobalPlansOnly(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
INSERT INTO plans (id, name, monthly_price, yearly_price, status, sort_order, updated_at)
VALUES
  ('starter', 'Starter', 2500, 25000, 'active', 10, now()),
  ('pro', 'Pro', 7500, 75000, 'active', 20, now()),
  ('enterprise', 'Enterprise', 15000, 150000, 'active', 30, now()),
  ('custom', 'Custom', 0, 0, 'active', 40, now())
ON CONFLICT (id) DO NOTHING;

UPDATE plans
SET status='inactive', updated_at=now()
WHERE id NOT IN ('starter','pro','enterprise','custom')
  AND status='active';
`)
	return err
}

func seedDefaultModulesAndPlans(ctx context.Context, db *sql.DB) error {
	// SCS_GLOBAL_PLANS_DEFER_AFTER_DEFAULT_SEED
	defer func() {
		_ = scsEnsureGlobalPlansOnly(ctx, db)
	}()

	_, err := db.ExecContext(ctx, `
INSERT INTO modules (id, name, category, price_monthly, price_yearly, route, icon, status, sort_order)
VALUES
('store_management','Store Management','business',2500,25000,'store','Package','active',10),
('inventory','Inventory','store',1200,12000,'inventory','Database','active',20),
('products','Products','store',800,8000,'products','Package','active',30),
('sales_orders','Sales & Orders','store',1500,15000,'sales','WalletCards','active',40),
('customers','Customers','crm',1000,10000,'customers','Users','active',50),
('suppliers','Suppliers','store',800,8000,'suppliers','Building2','active',60),
('billing','Billing & Invoices','finance',1500,15000,'billing','CreditCard','active',70),
('reports','Reports','analytics',1000,10000,'reports','BarChart3','active',80),
('restaurant_management','Restaurant Management','business',3000,30000,'restaurant','Utensils','active',90),
('clinic_management','Clinic Management','business',3500,35000,'clinic','Activity','active',100),
('crm','CRM','business',2000,20000,'crm','UserCog','active',110),
('website','Website / Landing Pages','frontend',1800,18000,'website','Globe','active',120)
ON CONFLICT (id) DO UPDATE
SET
	name = EXCLUDED.name,
	category = EXCLUDED.category,
	price_monthly = EXCLUDED.price_monthly,
	price_yearly = EXCLUDED.price_yearly,
	route = EXCLUDED.route,
	icon = EXCLUDED.icon,
	status = EXCLUDED.status,
	sort_order = EXCLUDED.sort_order,
	updated_at = NOW();

INSERT INTO plans (id, name, monthly_price, yearly_price, status, sort_order)
VALUES
('store_start','Store Start',2500,25000,'active',10),
('store_pro','Store Pro',5500,55000,'active',20),
('business_plus','Business Plus',9000,90000,'active',30),
('enterprise_manual','Enterprise Manual',0,0,'active',40)
ON CONFLICT (id) DO UPDATE
SET
	name = EXCLUDED.name,
	monthly_price = EXCLUDED.monthly_price,
	yearly_price = EXCLUDED.yearly_price,
	status = EXCLUDED.status,
	sort_order = EXCLUDED.sort_order,
	updated_at = NOW();

INSERT INTO plan_modules (plan_id, module_id)
VALUES
('store_start','store_management'),
('store_start','products'),
('store_start','sales_orders'),

('store_pro','store_management'),
('store_pro','products'),
('store_pro','inventory'),
('store_pro','sales_orders'),
('store_pro','customers'),
('store_pro','suppliers'),
('store_pro','reports'),

('business_plus','store_management'),
('business_plus','products'),
('business_plus','inventory'),
('business_plus','sales_orders'),
('business_plus','customers'),
('business_plus','suppliers'),
('business_plus','billing'),
('business_plus','reports'),
('business_plus','crm'),
('business_plus','website')
ON CONFLICT (plan_id, module_id) DO NOTHING;
`)
	return err
}

func handleClientModules(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, user, ok := requireModuleUser(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	tenantID := tenantIDFromUser(user)
	if user.Role == "super_admin" {
		tenantID = strings.TrimSpace(r.URL.Query().Get("tenant_id"))
	}

	if tenantID == "" && user.Role != "super_admin" {
		writeAPIError(w, http.StatusForbidden, "missing_tenant", "Tenant id missing")
		return
	}

	rows, err := db.QueryContext(ctx, `
SELECT
	m.id,
	m.name,
	m.category,
	COALESCE(NULLIF(tm.monthly_price_snapshot,0), m.price_monthly)::float8,
	COALESCE(NULLIF(tm.yearly_price_snapshot,0), m.price_yearly)::float8,
	m.route,
	m.icon,
	COALESCE(tm.enabled, false),
	COALESCE(tm.source, 'none')
FROM modules m
JOIN tenant_modules tm ON tm.module_id = m.id
WHERE
	tm.tenant_id = $1
	AND tm.enabled = true
	AND m.status = 'active'
ORDER BY m.sort_order, m.name;
`, tenantID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "modules_failed", "Could not load modules")
		return
	}
	defer rows.Close()

	modules, scanErr := scanModuleRows(rows)
	if scanErr != nil {
		writeAPIError(w, http.StatusInternalServerError, "modules_scan_failed", "Could not read modules")
		return
	}

	subscription := loadTenantSubscriptionSummary(ctx, db, tenantID)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":           true,
		"tenant_id":    tenantID,
		"modules":      modules,
		"subscription": subscription,
		"request_id":   requestID,
	})
}

func handleClientCatalog(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, user, ok := requireModuleUser(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	catalog, err := loadModuleCatalog(ctx, db)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "catalog_failed", "Could not load catalog")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":         true,
		"tenant_id":  tenantIDFromUser(user),
		"catalog":    catalog,
		"request_id": requestID,
	})
}

func handleSuperadminModules(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return
	}

	catalog, err := loadModuleCatalog(ctx, db)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "catalog_failed", "Could not load modules")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":         true,
		"catalog":    catalog,
		"request_id": requestID,
	})
}

type superadminModuleSavePayload struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Category     string  `json:"category"`
	PriceMonthly float64 `json:"price_monthly"`
	PriceYearly  float64 `json:"price_yearly"`
	Route        string  `json:"route"`
	Icon         string  `json:"icon"`
	Status       string  `json:"status"`
	SortOrder    int     `json:"sort_order"`
}

func scsNormalizeModuleStatus(status string) string {
	status = strings.ToLower(strings.TrimSpace(status))
	if status == "inactive" || status == "archived" {
		return status
	}
	return "active"
}

func scsModuleSlug(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	var b strings.Builder
	lastSep := false

	for _, r := range value {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			lastSep = false
			continue
		}
		if !lastSep {
			b.WriteByte('_')
			lastSep = true
		}
	}

	return strings.Trim(b.String(), "_")
}

func handleSuperadminModuleCreate(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return
	}

	var payload superadminModuleSavePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid module payload")
		return
	}

	payload.Name = strings.TrimSpace(payload.Name)
	payload.Category = scsModuleSlug(payload.Category)
	payload.ID = scsModuleSlug(payload.ID)
	payload.Route = strings.TrimSpace(payload.Route)
	payload.Icon = strings.TrimSpace(payload.Icon)
	payload.Status = scsNormalizeModuleStatus(payload.Status)

	if payload.Name == "" {
		writeAPIError(w, http.StatusBadRequest, "name_required", "Module name is required")
		return
	}
	if payload.Category == "" {
		writeAPIError(w, http.StatusBadRequest, "category_required", "Module category is required")
		return
	}
	if payload.ID == "" {
		payload.ID = scsModuleSlug(payload.Category + "_" + payload.Name)
	}
	if payload.ID == "" {
		writeAPIError(w, http.StatusBadRequest, "id_required", "Module ID is required")
		return
	}
	if payload.PriceMonthly < 0 {
		payload.PriceMonthly = 0
	}
	if payload.PriceYearly < 0 {
		payload.PriceYearly = 0
	}

	_, err := db.ExecContext(ctx, `
INSERT INTO modules (id, name, category, price_monthly, price_yearly, route, icon, status, sort_order, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
`, payload.ID, payload.Name, payload.Category, payload.PriceMonthly, payload.PriceYearly, payload.Route, payload.Icon, payload.Status, payload.SortOrder)
	if err != nil {
		msg := err.Error()
		if strings.Contains(strings.ToLower(msg), "duplicate") {
			writeAPIError(w, http.StatusConflict, "module_exists", "Module ID already exists")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "module_create_failed", msg)
		return
	}

	catalog, err := loadModuleCatalog(ctx, db)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "catalog_failed", "Module saved but catalog reload failed")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":         true,
		"message":    "Module created",
		"module_id":  payload.ID,
		"catalog":    catalog,
		"request_id": requestID,
	})
}

func handleSuperadminModuleUpdate(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return
	}

	var payload superadminModuleSavePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid module payload")
		return
	}

	payload.ID = scsModuleSlug(payload.ID)
	payload.Name = strings.TrimSpace(payload.Name)
	payload.Category = scsModuleSlug(payload.Category)
	payload.Route = strings.TrimSpace(payload.Route)
	payload.Icon = strings.TrimSpace(payload.Icon)
	payload.Status = scsNormalizeModuleStatus(payload.Status)

	if payload.ID == "" {
		writeAPIError(w, http.StatusBadRequest, "id_required", "Module ID is required")
		return
	}
	if payload.Name == "" {
		writeAPIError(w, http.StatusBadRequest, "name_required", "Module name is required")
		return
	}
	if payload.Category == "" {
		writeAPIError(w, http.StatusBadRequest, "category_required", "Module category is required")
		return
	}
	if payload.PriceMonthly < 0 {
		payload.PriceMonthly = 0
	}
	if payload.PriceYearly < 0 {
		payload.PriceYearly = 0
	}

	res, err := db.ExecContext(ctx, `
UPDATE modules
SET name=$2,
    category=$3,
    price_monthly=$4,
    price_yearly=$5,
    route=$6,
    icon=$7,
    status=$8,
    sort_order=$9,
    updated_at=now()
WHERE id=$1
`, payload.ID, payload.Name, payload.Category, payload.PriceMonthly, payload.PriceYearly, payload.Route, payload.Icon, payload.Status, payload.SortOrder)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_update_failed", err.Error())
		return
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		writeAPIError(w, http.StatusNotFound, "module_not_found", "Module not found")
		return
	}

	catalog, err := loadModuleCatalog(ctx, db)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "catalog_failed", "Module updated but catalog reload failed")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":         true,
		"message":    "Module updated",
		"module_id":  payload.ID,
		"catalog":    catalog,
		"request_id": requestID,
	})
}

func handleSuperadminTenantModules(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return
	}

	tenantID, err := resolveTenantID(ctx, db, r.URL.Query().Get("tenant_id"), r.URL.Query().Get("client_id"), r.URL.Query().Get("email"))
	if err != nil || tenantID == "" {
		writeAPIError(w, http.StatusBadRequest, "tenant_not_found", "Tenant not found")
		return
	}

	rows, err := db.QueryContext(ctx, `
SELECT
	m.id,
	m.name,
	m.category,
	COALESCE(NULLIF(tm.monthly_price_snapshot,0), m.price_monthly)::float8,
	COALESCE(NULLIF(tm.yearly_price_snapshot,0), m.price_yearly)::float8,
	m.route,
	m.icon,
	COALESCE(tm.enabled, false),
	COALESCE(tm.source, 'none')
FROM modules m
LEFT JOIN tenant_modules tm ON tm.module_id = m.id AND tm.tenant_id = $1
WHERE m.status = 'active'
ORDER BY m.sort_order, m.name;
`, tenantID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tenant_modules_failed", "Could not load tenant modules")
		return
	}
	defer rows.Close()

	modules, scanErr := scanModuleRows(rows)
	if scanErr != nil {
		writeAPIError(w, http.StatusInternalServerError, "tenant_modules_scan_failed", "Could not read tenant modules")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":           true,
		"tenant_id":    tenantID,
		"modules":      modules,
		"subscription": loadTenantSubscriptionSummary(ctx, db, tenantID),
		"request_id":   requestID,
	})
}

func handleSuperadminTenantModulesUpdate(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST is allowed")
		return
	}

	var payload moduleEntitlementUpdatePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON body")
		return
	}

	payload.ModuleID = strings.TrimSpace(payload.ModuleID)
	payload.Source = strings.TrimSpace(payload.Source)
	if payload.Source == "" {
		payload.Source = "manual"
	}
	if payload.Source != "plan" && payload.Source != "manual" && payload.Source != "upgrade" {
		payload.Source = "manual"
	}

	if payload.ModuleID == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_module", "Module id is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return
	}

	tenantID, err := resolveTenantID(ctx, db, payload.TenantID, payload.ClientID, payload.Email)
	if err != nil || tenantID == "" {
		writeAPIError(w, http.StatusBadRequest, "tenant_not_found", "Tenant not found")
		return
	}

	var exists string
	if err := db.QueryRowContext(ctx, `SELECT id FROM modules WHERE id=$1 AND status='active' LIMIT 1`, payload.ModuleID).Scan(&exists); err != nil {
		writeAPIError(w, http.StatusBadRequest, "module_not_found", "Module not found")
		return
	}

	_, err = db.ExecContext(ctx, `
INSERT INTO tenant_modules (tenant_id, module_id, enabled, source, updated_at, monthly_price_snapshot, yearly_price_snapshot)
SELECT $1, $2, $3, $4, NOW(), m.price_monthly, m.price_yearly
FROM modules m
WHERE m.id = $2
ON CONFLICT (tenant_id, module_id) DO UPDATE
SET enabled = EXCLUDED.enabled,
    source = EXCLUDED.source,
    monthly_price_snapshot = CASE
      WHEN tenant_modules.price_override THEN tenant_modules.monthly_price_snapshot
      ELSE EXCLUDED.monthly_price_snapshot
    END,
    yearly_price_snapshot = CASE
      WHEN tenant_modules.price_override THEN tenant_modules.yearly_price_snapshot
      ELSE EXCLUDED.yearly_price_snapshot
    END,
    updated_at = NOW();
`, tenantID, payload.ModuleID, payload.Enabled, payload.Source)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "update_failed", "Could not update tenant module")
		return
	}

	subscription, recalcErr := recalculateTenantSubscriptionAmount(ctx, db, tenantID)
	if recalcErr != nil {
		log.Printf("[WARN] tenant_module_updated_recalculate_failed tenant_id=%s module_id=%s err=%v", tenantID, payload.ModuleID, recalcErr)
		subscription = loadTenantSubscriptionSummary(ctx, db, tenantID)
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":                  true,
		"message":             "Tenant module updated",
		"tenant_id":           tenantID,
		"module_id":           payload.ModuleID,
		"enabled":             payload.Enabled,
		"subscription":        subscription,
		"recalculate_warning": recalcErr != nil,
		"request_id":          requestID,
	})

}

type superadminPlanSavePayload struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	MonthlyPrice float64  `json:"monthly_price"`
	YearlyPrice  float64  `json:"yearly_price"`
	Status       string   `json:"status"`
	SortOrder    int      `json:"sort_order"`
	ModuleIDs    []string `json:"module_ids"`
}

func handleSuperadminPlanSave(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return
	}

	var payload superadminPlanSavePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid plan payload")
		return
	}

	payload.ID = scsModuleSlug(payload.ID)
	payload.Name = strings.TrimSpace(payload.Name)
	payload.Status = scsNormalizeModuleStatus(payload.Status)

	if payload.ID == "" {
		payload.ID = scsModuleSlug(payload.Name)
	}
	if payload.ID == "" {
		writeAPIError(w, http.StatusBadRequest, "id_required", "Plan ID is required")
		return
	}
	if payload.Name == "" {
		writeAPIError(w, http.StatusBadRequest, "name_required", "Plan name is required")
		return
	}
	if payload.MonthlyPrice < 0 {
		payload.MonthlyPrice = 0
	}
	if payload.YearlyPrice < 0 {
		payload.YearlyPrice = 0
	}

	cleanModuleIDs := make([]string, 0, len(payload.ModuleIDs))
	seen := map[string]bool{}
	for _, raw := range payload.ModuleIDs {
		id := scsModuleSlug(raw)
		if id == "" || seen[id] {
			continue
		}
		seen[id] = true
		cleanModuleIDs = append(cleanModuleIDs, id)
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tx_failed", err.Error())
		return
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
INSERT INTO plans (id, name, monthly_price, yearly_price, status, sort_order, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = now()
`, payload.ID, payload.Name, payload.MonthlyPrice, payload.YearlyPrice, payload.Status, payload.SortOrder)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "plan_save_failed", err.Error())
		return
	}

	_, err = tx.ExecContext(ctx, `DELETE FROM plan_modules WHERE plan_id=$1`, payload.ID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "plan_modules_clear_failed", err.Error())
		return
	}

	for _, moduleID := range cleanModuleIDs {
		_, err = tx.ExecContext(ctx, `
INSERT INTO plan_modules (plan_id, module_id)
SELECT $1, id FROM modules WHERE id=$2
ON CONFLICT (plan_id, module_id) DO NOTHING
`, payload.ID, moduleID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "plan_module_attach_failed", err.Error())
			return
		}
	}

	if err := tx.Commit(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tx_commit_failed", err.Error())
		return
	}

	catalog, err := loadModuleCatalog(ctx, db)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "catalog_failed", "Plan saved but catalog reload failed")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":             true,
		"message":        "Plan saved",
		"plan_id":        payload.ID,
		"included_count": len(cleanModuleIDs),
		"catalog":        catalog,
		"request_id":     requestID,
	})
}

// SCS_BUSINESS_SUBSCRIPTION_V2_LEGACY_HANDLER
func handleSuperadminSubscriptionSaveLegacy(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST is allowed")
		return
	}

	var payload tenantSubscriptionSavePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON body")
		return
	}

	payload.PlanID = strings.TrimSpace(payload.PlanID)
	payload.BillingCycle = strings.TrimSpace(payload.BillingCycle)
	payload.Status = strings.TrimSpace(payload.Status)

	if payload.BillingCycle == "" {
		payload.BillingCycle = "monthly"
	}
	if payload.Status == "" {
		payload.Status = "active"
	}
	if payload.PlanID == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_plan", "Plan id is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return
	}

	tenantID, err := resolveTenantID(ctx, db, payload.TenantID, payload.ClientID, payload.Email)
	if err != nil || tenantID == "" {
		writeAPIError(w, http.StatusBadRequest, "tenant_not_found", "Tenant not found")
		return
	}

	var amount float64
	if payload.BillingCycle == "yearly" {
		err = db.QueryRowContext(ctx, `SELECT yearly_price::float8 FROM plans WHERE id=$1 AND status='active' LIMIT 1`, payload.PlanID).Scan(&amount)
	} else {
		payload.BillingCycle = "monthly"
		err = db.QueryRowContext(ctx, `SELECT monthly_price::float8 FROM plans WHERE id=$1 AND status='active' LIMIT 1`, payload.PlanID).Scan(&amount)
	}
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "plan_not_found", "Plan not found")
		return
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tx_failed", "Could not start transaction")
		return
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, billing_cycle, amount, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW())
ON CONFLICT (tenant_id) DO UPDATE
SET plan_id = EXCLUDED.plan_id,
	status = EXCLUDED.status,
	billing_cycle = EXCLUDED.billing_cycle,
	amount = EXCLUDED.amount,
	updated_at = NOW();
`, tenantID, payload.PlanID, payload.Status, payload.BillingCycle, amount)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "subscription_failed", "Could not save subscription")
		return
	}

	_, err = tx.ExecContext(ctx, `
INSERT INTO tenant_modules (tenant_id, module_id, enabled, source, updated_at, monthly_price_snapshot, yearly_price_snapshot)
SELECT $1, pm.module_id, true, 'plan', NOW(), m.price_monthly, m.price_yearly
FROM plan_modules pm
JOIN modules m ON m.id = pm.module_id
WHERE pm.plan_id = $2
ON CONFLICT (tenant_id, module_id) DO UPDATE
SET enabled = true,
    source = 'plan',
    monthly_price_snapshot = CASE
      WHEN tenant_modules.price_override THEN tenant_modules.monthly_price_snapshot
      ELSE EXCLUDED.monthly_price_snapshot
    END,
    yearly_price_snapshot = CASE
      WHEN tenant_modules.price_override THEN tenant_modules.yearly_price_snapshot
      ELSE EXCLUDED.yearly_price_snapshot
    END,
    updated_at = NOW();
`, tenantID, payload.PlanID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "plan_modules_failed", "Could not enable plan modules")
		return
	}

	if err := tx.Commit(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "commit_failed", "Could not save subscription")
		return
	}

	subscription, err := recalculateTenantSubscriptionAmount(ctx, db, tenantID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "amount_recalculate_failed", "Could not recalculate subscription amount")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":            true,
		"message":       "Subscription saved and plan modules enabled",
		"tenant_id":     tenantID,
		"plan_id":       payload.PlanID,
		"billing_cycle": payload.BillingCycle,
		"amount":        amount,
		"subscription":  subscription,
		"request_id":    requestID,
	})
}

func requireModuleUser(ctx context.Context, w http.ResponseWriter, r *http.Request) (*sql.DB, authUser, bool) {
	db, err := openRegisterDB(ctx)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "db_connection_failed", "Database connection failed")
		return nil, authUser{}, false
	}

	if err := ensureAuthSchemaAndSeed(ctx, db); err != nil {
		_ = db.Close()
		writeAPIError(w, http.StatusInternalServerError, "auth_schema_failed", err.Error())
		return nil, authUser{}, false
	}

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		_ = db.Close()
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return nil, authUser{}, false
	}

	user, err := userFromRequestSession(ctx, db, r)
	if err != nil {
		_ = db.Close()
		writeAPIError(w, http.StatusUnauthorized, "not_authenticated", "Not authenticated")
		return nil, authUser{}, false
	}

	return db, user, true
}

func tenantIDFromUser(user authUser) string {
	if user.TenantID.Valid {
		return strings.TrimSpace(user.TenantID.String)
	}
	return ""
}

func resolveTenantID(ctx context.Context, db *sql.DB, tenantID string, clientID string, email string) (string, error) {
	tenantID = strings.TrimSpace(tenantID)
	clientID = strings.TrimSpace(clientID)
	email = strings.ToLower(strings.TrimSpace(email))

	if tenantID != "" {
		return tenantID, nil
	}

	var resolved sql.NullString
	err := db.QueryRowContext(ctx, `
SELECT COALESCE(au.tenant_id, 'tenant_' || replace(r.id::text, '-', '')) AS tenant_id
FROM public.client_business_register r
LEFT JOIN auth_users au ON lower(au.email) = lower(r.email::text)
WHERE
	($1 <> '' AND r.id::text = $1)
	OR ($2 <> '' AND lower(r.email::text) = lower($2))
LIMIT 1;
`, clientID, email).Scan(&resolved)
	if err != nil {
		return "", err
	}
	if resolved.Valid {
		return resolved.String, nil
	}
	return "", nil
}

func scanModuleRows(rows *sql.Rows) ([]map[string]interface{}, error) {
	out := make([]map[string]interface{}, 0)
	for rows.Next() {
		var id, name, category, route, icon, source string
		var monthly, yearly float64
		var enabled bool

		if err := rows.Scan(&id, &name, &category, &monthly, &yearly, &route, &icon, &enabled, &source); err != nil {
			return nil, err
		}

		out = append(out, map[string]interface{}{
			"id":            id,
			"name":          name,
			"category":      category,
			"price_monthly": monthly,
			"price_yearly":  yearly,
			"route":         route,
			"icon":          icon,
			"enabled":       enabled,
			"source":        source,
		})
	}
	return out, rows.Err()
}

func loadModuleCatalog(ctx context.Context, db *sql.DB) (map[string]interface{}, error) {
	moduleRows, err := db.QueryContext(ctx, `
SELECT id, name, category, price_monthly::float8, price_yearly::float8, route, icon, true, 'catalog'
FROM modules
WHERE status='active'
ORDER BY sort_order, name;
`)
	if err != nil {
		return nil, err
	}
	defer moduleRows.Close()

	modules, err := scanModuleRows(moduleRows)
	if err != nil {
		return nil, err
	}

	planRows, err := db.QueryContext(ctx, `
SELECT id, name, monthly_price::float8, yearly_price::float8, status
FROM plans
WHERE status='active'
ORDER BY sort_order, name;
`)
	if err != nil {
		return nil, err
	}
	defer planRows.Close()

	plans := make([]map[string]interface{}, 0)
	for planRows.Next() {
		var id, name, status string
		var monthly, yearly float64
		if err := planRows.Scan(&id, &name, &monthly, &yearly, &status); err != nil {
			return nil, err
		}

		pmRows, err := db.QueryContext(ctx, `
SELECT m.id, m.name
FROM plan_modules pm
JOIN modules m ON m.id = pm.module_id
WHERE pm.plan_id = $1 AND m.status='active'
ORDER BY m.sort_order, m.name;
`, id)
		if err != nil {
			return nil, err
		}

		planModules := make([]map[string]interface{}, 0)
		for pmRows.Next() {
			var mid, mname string
			if err := pmRows.Scan(&mid, &mname); err != nil {
				_ = pmRows.Close()
				return nil, err
			}
			planModules = append(planModules, map[string]interface{}{"id": mid, "name": mname})
		}
		if err := pmRows.Err(); err != nil {
			_ = pmRows.Close()
			return nil, err
		}
		_ = pmRows.Close()

		plans = append(plans, map[string]interface{}{
			"id":            id,
			"name":          name,
			"monthly_price": monthly,
			"yearly_price":  yearly,
			"status":        status,
			"modules":       planModules,
		})
	}

	if err := planRows.Err(); err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"modules": modules,
		"plans":   plans,
	}, nil
}

// SCS_BUSINESS_SUBSCRIPTION_V2_LEGACY_RECALCULATE
func recalculateTenantSubscriptionAmountLegacy(ctx context.Context, db *sql.DB, tenantID string) (map[string]interface{}, error) {
	planID := ""
	status := "active"
	billingCycle := "monthly"

	err := db.QueryRowContext(ctx, `
SELECT COALESCE(plan_id,''), COALESCE(status,'active'), COALESCE(NULLIF(billing_cycle,''),'monthly')
FROM tenant_subscriptions
WHERE tenant_id=$1
LIMIT 1;
`, tenantID).Scan(&planID, &status, &billingCycle)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	var planBaseAmount float64
	if planID != "" {
		if billingCycle == "yearly" {
			_ = db.QueryRowContext(ctx, `SELECT COALESCE(yearly_price,0)::float8 FROM plans WHERE id=$1 AND status='active' LIMIT 1`, planID).Scan(&planBaseAmount)
		} else {
			billingCycle = "monthly"
			_ = db.QueryRowContext(ctx, `SELECT COALESCE(monthly_price,0)::float8 FROM plans WHERE id=$1 AND status='active' LIMIT 1`, planID).Scan(&planBaseAmount)
		}
	}

	var moduleAddonsAmount float64
	err = db.QueryRowContext(ctx, `
SELECT COALESCE(SUM(
  CASE
    WHEN $3 = 'yearly' THEN COALESCE(NULLIF(tm.yearly_price_snapshot,0), m.price_yearly, 0)
    ELSE COALESCE(NULLIF(tm.monthly_price_snapshot,0), m.price_monthly, 0)
  END
),0)::float8
FROM tenant_modules tm
JOIN modules m ON m.id = tm.module_id
WHERE tm.tenant_id = $1
  AND tm.enabled = true;
`, tenantID, planID, billingCycle).Scan(&moduleAddonsAmount)
	if err != nil {
		return nil, err
	}

	totalAmount := planBaseAmount + moduleAddonsAmount

	_, err = db.ExecContext(ctx, `
INSERT INTO tenant_subscriptions (
  tenant_id, plan_id, status, billing_cycle,
  plan_base_amount, module_addons_amount, amount, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
ON CONFLICT (tenant_id) DO UPDATE
SET plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    billing_cycle = EXCLUDED.billing_cycle,
    plan_base_amount = EXCLUDED.plan_base_amount,
    module_addons_amount = EXCLUDED.module_addons_amount,
    amount = EXCLUDED.amount,
    updated_at = NOW();
`, tenantID, planID, status, billingCycle, planBaseAmount, moduleAddonsAmount, totalAmount)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"status":               status,
		"plan_id":              planID,
		"billing_cycle":        billingCycle,
		"plan_base_amount":     planBaseAmount,
		"module_addons_amount": moduleAddonsAmount,
		"amount":               totalAmount,
	}, nil
}

func loadTenantSubscriptionSummary(ctx context.Context, db *sql.DB, tenantID string) map[string]interface{} {
	summary := map[string]interface{}{
		"status":               "none",
		"plan_id":              "",
		"billing_cycle":        "",
		"plan_base_amount":     0,
		"module_addons_amount": 0,
		"amount":               0,
	}

	if tenantID == "" {
		return summary
	}

	var planID, status, billingCycle string
	var planBaseAmount, moduleAddonsAmount, amount float64
	err := db.QueryRowContext(ctx, `
SELECT
  COALESCE(plan_id,''),
  COALESCE(status,'none'),
  COALESCE(billing_cycle,''),
  COALESCE(plan_base_amount,0)::float8,
  COALESCE(module_addons_amount,0)::float8,
  COALESCE(amount,0)::float8
FROM tenant_subscriptions
WHERE tenant_id=$1
LIMIT 1;
`, tenantID).Scan(&planID, &status, &billingCycle, &planBaseAmount, &moduleAddonsAmount, &amount)
	if err != nil {
		return summary
	}

	summary["status"] = status
	summary["plan_id"] = planID
	summary["billing_cycle"] = billingCycle
	summary["plan_base_amount"] = planBaseAmount
	summary["module_addons_amount"] = moduleAddonsAmount
	summary["amount"] = amount
	return summary
}

func seedIndustryCategoryModulesAndPlans(ctx context.Context, db *sql.DB) error {
	// SCS_GLOBAL_PLANS_DEFER_AFTER_INDUSTRY_SEED
	defer func() {
		_ = scsEnsureGlobalPlansOnly(ctx, db)
	}()

	_, err := db.ExecContext(ctx, `
INSERT INTO modules (id, name, category, price_monthly, price_yearly, route, icon, status, sort_order)
VALUES
-- Store Management
('store_management','Store Management','store',2500,25000,'store','Package','active',10),
('products','Products','store',800,8000,'products','Package','active',20),
('inventory','Inventory','store',1200,12000,'inventory','Database','active',30),
('sales_orders','Sales & Orders','store',1500,15000,'sales','WalletCards','active',40),
('customers','Customers','store',1000,10000,'customers','Users','active',50),
('suppliers','Suppliers','store',800,8000,'suppliers','Building2','active',60),
('billing','Billing & Invoices','store',1500,15000,'billing','CreditCard','active',70),
('reports','Reports','store',1000,10000,'reports','BarChart3','active',80),

-- School Management
('school_management','School Management','school',3500,35000,'school','GraduationCap','active',110),
('students','Students','school',1000,10000,'students','Users','active',120),
('teachers','Teachers','school',1000,10000,'teachers','UserCog','active',130),
('classes_sections','Classes & Sections','school',900,9000,'classes','Layers','active',140),
('attendance','Attendance','school',1200,12000,'attendance','CheckCircle','active',150),
('fees','Fees & Billing','school',1500,15000,'fees','CreditCard','active',160),
('exams_results','Exams & Results','school',1400,14000,'exams','FileText','active',170),
('timetable','Timetable','school',900,9000,'timetable','Calendar','active',180),
('parents_portal','Parents Portal','school',1200,12000,'parents','Users','active',190),
('library','Library','school',800,8000,'library','BookOpen','active',200),

-- Restaurant Management
('restaurant_management','Restaurant Management','restaurant',3000,30000,'restaurant','Utensils','active',230),
('menu_items','Menu Items','restaurant',900,9000,'menu','List','active',240),
('tables_orders','Tables & Orders','restaurant',1400,14000,'tables','LayoutGrid','active',250),
('kitchen_display','Kitchen Display','restaurant',1300,13000,'kitchen','Monitor','active',260),
('restaurant_billing','Restaurant Billing','restaurant',1500,15000,'restaurant-billing','CreditCard','active',270),

-- Clinic Management
('clinic_management','Clinic Management','clinic',3500,35000,'clinic','Activity','active',300),
('patients','Patients','clinic',1200,12000,'patients','Users','active',310),
('appointments','Appointments','clinic',1200,12000,'appointments','Calendar','active',320),
('doctors','Doctors','clinic',1000,10000,'doctors','UserCog','active',330),
('prescriptions','Prescriptions','clinic',1300,13000,'prescriptions','FileText','active',340),
('clinic_billing','Clinic Billing','clinic',1500,15000,'clinic-billing','CreditCard','active',350),

-- Enterprise / Future Ready Catalog
('pos_terminal','POS Terminal','store',1800,18000,'pos','Monitor','active',420),
('barcode_labeling','Barcode & Labeling','store',900,9000,'barcode','ScanBarcode','active',430),
('stock_transfer','Stock Transfer','store',1100,11000,'stock-transfer','ArrowRightLeft','active',440),
('purchase_orders','Purchase Orders','store',1400,14000,'purchase-orders','ShoppingCart','active',450),
('customer_loyalty','Customer Loyalty','store',1200,12000,'loyalty','BadgePercent','active',460),
('ecommerce_orders','Ecommerce Orders','ecommerce',1800,18000,'ecommerce-orders','ShoppingBag','active',470),
('online_storefront','Online Storefront','ecommerce',2500,25000,'online-store','Globe','active',480),
('shipping_delivery','Shipping & Delivery','ecommerce',1200,12000,'shipping','Truck','active',490),

('reservations','Reservations','restaurant',1200,12000,'reservations','CalendarCheck','active',500),
('delivery_orders','Delivery Orders','restaurant',1400,14000,'delivery','Bike','active',510),
('food_inventory','Food Inventory','restaurant',1300,13000,'food-inventory','Boxes','active',520),
('waiter_app','Waiter App','restaurant',1100,11000,'waiter','Smartphone','active',530),
('recipe_costing','Recipe Costing','restaurant',1200,12000,'recipe-costing','Calculator','active',540),

('admissions','Admissions','school',1200,12000,'admissions','UserPlus','active',550),
('grades','Grades','school',1000,10000,'grades','FileCheck','active',560),
('transport','Transport','school',1200,12000,'transport','Bus','active',570),
('hostel','Hostel','school',1300,13000,'hostel','Bed','active',580),
('lms','Learning Management','school',2200,22000,'lms','BookOpen','active',590),

('medical_records','Medical Records','clinic',1600,16000,'medical-records','FolderOpen','active',600),
('lab_reports','Lab Reports','clinic',1200,12000,'lab-reports','FlaskConical','active',610),
('pharmacy_stock','Pharmacy Stock','clinic',1400,14000,'pharmacy','Pill','active',620),
('patient_portal','Patient Portal','clinic',1600,16000,'patient-portal','HeartPulse','active',630),
('queue_management','Queue Management','clinic',900,9000,'queue','ListOrdered','active',640),

('dental_management','Dental Management','dental',3500,35000,'dental','Smile','active',650),
('dental_charting','Dental Charting','dental',1800,18000,'dental-charting','ClipboardList','active',660),
('treatment_plans','Treatment Plans','dental',1400,14000,'treatment-plans','FileText','active',670),
('dental_billing','Dental Billing','dental',1300,13000,'dental-billing','CreditCard','active',680),

('salon_management','Salon Management','salon',2500,25000,'salon','Scissors','active',690),
('service_menu','Service Menu','salon',900,9000,'services','List','active',700),
('staff_scheduling','Staff Scheduling','salon',1200,12000,'staff-schedule','CalendarDays','active',710),
('memberships','Memberships','salon',1000,10000,'memberships','BadgeCheck','active',720),
('commission','Staff Commission','salon',1100,11000,'commission','Percent','active',730),

('hotel_management','Hotel Management','hotel',3500,35000,'hotel','Hotel','active',740),
('room_booking','Room Booking','hotel',1600,16000,'room-booking','BedDouble','active',750),
('housekeeping','Housekeeping','hotel',1000,10000,'housekeeping','Sparkles','active',760),
('checkin_checkout','Check-in / Check-out','hotel',1200,12000,'checkin','LogIn','active',770),

('repair_management','Repair Management','services',2500,25000,'repair','Wrench','active',780),
('tickets','Tickets','services',1100,11000,'tickets','Ticket','active',790),
('job_cards','Job Cards','services',1200,12000,'job-cards','ClipboardList','active',800),
('field_staff','Field Staff','services',1300,13000,'field-staff','MapPin','active',810),
('warranty','Warranty','services',1000,10000,'warranty','ShieldCheck','active',820),

('manufacturing_management','Manufacturing Management','manufacturing',4000,40000,'manufacturing','Factory','active',830),
('bom','Bill of Materials','manufacturing',1800,18000,'bom','Layers','active',840),
('production_orders','Production Orders','manufacturing',1800,18000,'production','Cog','active',850),
('quality_control','Quality Control','manufacturing',1400,14000,'quality','BadgeCheck','active',860),

('real_estate_management','Real Estate Management','real_estate',3000,30000,'real-estate','Building','active',870),
('properties','Properties','real_estate',1400,14000,'properties','Home','active',880),
('leads_pipeline','Leads Pipeline','real_estate',1300,13000,'leads','GitBranch','active',890),
('rentals','Rentals','real_estate',1500,15000,'rentals','Key','active',900),

('gym_management','Gym Management','gym',2500,25000,'gym','Dumbbell','active',910),
('trainer_schedule','Trainer Schedule','gym',1000,10000,'trainer-schedule','Calendar','active',920),
('fitness_memberships','Fitness Memberships','gym',1200,12000,'fitness-memberships','BadgeCheck','active',930),

('accounting','Accounting','finance',2200,22000,'accounting','Calculator','active',940),
('expenses','Expenses','finance',1000,10000,'expenses','Receipt','active',950),
('ledger','Ledger','finance',1600,16000,'ledger','BookText','active',960),
('tax_management','Tax Management','finance',1200,12000,'tax','FileSpreadsheet','active',970),
('payment_records','Payment Records','payments',1500,15000,'payments','WalletCards','active',980),
('subscription_billing','Subscription Billing','payments',1800,18000,'subscriptions','Repeat','active',990),
('license_keys','License Keys','license',1800,18000,'license-keys','Key','active',1000),

('rbac_roles','RBAC Roles','security',1600,16000,'rbac','ShieldCheck','active',1010),
('audit_logs','Audit Logs','security',1400,14000,'audit','ScrollText','active',1020),
('api_keys','API Keys','integrations',1500,15000,'api-keys','KeyRound','active',1030),
('webhooks','Webhooks','integrations',1200,12000,'webhooks','Webhook','active',1040),
('email_sms','Email / SMS','communication',1200,12000,'messages','Mail','active',1050),
('whatsapp','WhatsApp','communication',1500,15000,'whatsapp','MessageCircle','active',1060),

('analytics_dashboard','Analytics Dashboard','analytics',1800,18000,'analytics','BarChart3','active',1070),
('custom_reports','Custom Reports','analytics',1600,16000,'custom-reports','FileBarChart','active',1080),
('ai_assistant','AI Assistant','ai',2500,25000,'ai-assistant','Bot','active',1090),
('ai_forecasting','AI Forecasting','ai',2200,22000,'ai-forecast','TrendingUp','active',1100),
('workflow_automation','Workflow Automation','automation',2200,22000,'automation','Workflow','active',1110),

-- Extra Business
('crm','CRM','business',2000,20000,'crm','UserCog','active',400),
('website','Website / Landing Pages','business',1800,18000,'website','Globe','active',410)
ON CONFLICT (id) DO UPDATE
SET
	name = EXCLUDED.name,
	category = EXCLUDED.category,
	price_monthly = EXCLUDED.price_monthly,
	price_yearly = EXCLUDED.price_yearly,
	route = EXCLUDED.route,
	icon = EXCLUDED.icon,
	status = EXCLUDED.status,
	sort_order = EXCLUDED.sort_order,
	updated_at = NOW();

INSERT INTO plans (id, name, monthly_price, yearly_price, status, sort_order)
VALUES
('store_start','Store Start',2500,25000,'active',10),
('store_pro','Store Pro',5500,55000,'active',20),
('school_start','School Start',4500,45000,'active',30),
('school_pro','School Pro',9500,95000,'active',40),
('restaurant_start','Restaurant Start',3500,35000,'active',50),
('restaurant_pro','Restaurant Pro',7500,75000,'active',60),
('clinic_start','Clinic Start',4500,45000,'active',70),
('clinic_pro','Clinic Pro',8500,85000,'active',80),
('business_plus','Business Plus',12000,120000,'active',90),
('enterprise_manual','Enterprise Manual',0,0,'active',100)
ON CONFLICT (id) DO UPDATE
SET
	name = EXCLUDED.name,
	monthly_price = EXCLUDED.monthly_price,
	yearly_price = EXCLUDED.yearly_price,
	status = EXCLUDED.status,
	sort_order = EXCLUDED.sort_order,
	updated_at = NOW();

INSERT INTO plan_modules (plan_id, module_id)
VALUES
-- Store Start
('store_start','store_management'),
('store_start','products'),
('store_start','sales_orders'),

-- Store Pro
('store_pro','store_management'),
('store_pro','products'),
('store_pro','inventory'),
('store_pro','sales_orders'),
('store_pro','customers'),
('store_pro','suppliers'),
('store_pro','billing'),
('store_pro','reports'),

-- School Start
('school_start','school_management'),
('school_start','students'),
('school_start','teachers'),
('school_start','classes_sections'),
('school_start','attendance'),

-- School Pro
('school_pro','school_management'),
('school_pro','students'),
('school_pro','teachers'),
('school_pro','classes_sections'),
('school_pro','attendance'),
('school_pro','fees'),
('school_pro','exams_results'),
('school_pro','timetable'),
('school_pro','parents_portal'),
('school_pro','library'),

-- Restaurant Start
('restaurant_start','restaurant_management'),
('restaurant_start','menu_items'),
('restaurant_start','tables_orders'),

-- Restaurant Pro
('restaurant_pro','restaurant_management'),
('restaurant_pro','menu_items'),
('restaurant_pro','tables_orders'),
('restaurant_pro','kitchen_display'),
('restaurant_pro','restaurant_billing'),
('restaurant_pro','reports'),

-- Clinic Start
('clinic_start','clinic_management'),
('clinic_start','patients'),
('clinic_start','appointments'),
('clinic_start','doctors'),

-- Clinic Pro
('clinic_pro','clinic_management'),
('clinic_pro','patients'),
('clinic_pro','appointments'),
('clinic_pro','doctors'),
('clinic_pro','prescriptions'),
('clinic_pro','clinic_billing'),
('clinic_pro','reports'),

-- Business Plus
('business_plus','store_management'),
('business_plus','products'),
('business_plus','inventory'),
('business_plus','sales_orders'),
('business_plus','customers'),
('business_plus','suppliers'),
('business_plus','billing'),
('business_plus','reports'),
('business_plus','crm'),
('business_plus','website')
ON CONFLICT (plan_id, module_id) DO NOTHING;
`)
	return err
}

func handleSuperadminTenantsSummary(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "module_schema_failed", err.Error())
		return
	}

	rows, err := db.QueryContext(ctx, `
SELECT
	COALESCE(au.tenant_id, 'tenant_' || replace(r.id::text, '-', '')) AS tenant_id,
	r.id::text AS client_id,
	COALESCE(NULLIF(r.company_name::text, ''), NULLIF(r.full_name::text, ''), r.email::text) AS company_name,
	r.email::text AS email,
	COALESCE(r.status::text, '') AS registration_status,
	COALESCE(ts.plan_id, '') AS plan_id,
	COALESCE(p.name, '') AS plan_name,
	COALESCE(ts.status, 'none') AS subscription_status,
	COALESCE(ts.billing_cycle, '') AS billing_cycle,
	COALESCE(ts.amount, 0)::float8 AS amount,
	COUNT(tm.module_id) FILTER (WHERE tm.enabled = true) AS enabled_count,
	COALESCE(string_agg(m.name, ', ' ORDER BY m.sort_order, m.name) FILTER (WHERE tm.enabled = true), '') AS enabled_modules
FROM public.client_business_register r
LEFT JOIN auth_users au ON lower(au.email) = lower(r.email::text)
LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = COALESCE(au.tenant_id, 'tenant_' || replace(r.id::text, '-', ''))
LEFT JOIN plans p ON p.id = ts.plan_id
LEFT JOIN tenant_modules tm ON tm.tenant_id = COALESCE(au.tenant_id, 'tenant_' || replace(r.id::text, '-', ''))
LEFT JOIN modules m ON m.id = tm.module_id
GROUP BY
	COALESCE(au.tenant_id, 'tenant_' || replace(r.id::text, '-', '')),
	r.id::text,
	COALESCE(NULLIF(r.company_name::text, ''), NULLIF(r.full_name::text, ''), r.email::text),
	r.email::text,
	COALESCE(r.status::text, ''),
	COALESCE(ts.plan_id, ''),
	COALESCE(p.name, ''),
	COALESCE(ts.status, 'none'),
	COALESCE(ts.billing_cycle, ''),
	COALESCE(ts.amount, 0)::float8
ORDER BY company_name ASC;
`)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tenant_summary_failed", err.Error())
		return
	}
	defer rows.Close()

	items := make([]map[string]interface{}, 0)
	var totalAmount float64
	var activeSubscriptions int

	for rows.Next() {
		var tenantID, clientID, companyName, email, regStatus string
		var planID, planName, subStatus, billingCycle string
		var amount float64
		var enabledCount int64
		var enabledModules string

		if err := rows.Scan(
			&tenantID,
			&clientID,
			&companyName,
			&email,
			&regStatus,
			&planID,
			&planName,
			&subStatus,
			&billingCycle,
			&amount,
			&enabledCount,
			&enabledModules,
		); err != nil {
			writeAPIError(w, http.StatusInternalServerError, "tenant_summary_scan_failed", err.Error())
			return
		}

		if subStatus == "active" {
			activeSubscriptions++
			totalAmount += amount
		}

		items = append(items, map[string]interface{}{
			"tenant_id":           tenantID,
			"client_id":           clientID,
			"company_name":        companyName,
			"email":               email,
			"registration_status": regStatus,
			"plan_id":             planID,
			"plan_name":           planName,
			"subscription_status": subStatus,
			"billing_cycle":       billingCycle,
			"amount":              amount,
			"enabled_count":       enabledCount,
			"enabled_modules":     enabledModules,
		})
	}

	if err := rows.Err(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tenant_summary_rows_failed", err.Error())
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":                   true,
		"items":                items,
		"total_clients":        len(items),
		"active_subscriptions": activeSubscriptions,
		"active_amount":        totalAmount,
		"request_id":           requestID,
	})
}
