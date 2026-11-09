package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type businessPlanMatrixSavePayload struct {
	BusinessType string   `json:"business_type"`
	PlanID       string   `json:"plan_id"`
	MonthlyPrice float64  `json:"monthly_price"`
	YearlyPrice  float64  `json:"yearly_price"`
	Status       string   `json:"status"`
	SortOrder    int      `json:"sort_order"`
	ModuleIDs    []string `json:"module_ids"`
}

// SCS_BUSINESS_PLAN_MATRIX_SCHEMA_V1
func ensureBusinessPlanMatrixSchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS business_plan_matrix (
  business_type TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  yearly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_type, plan_id)
);

CREATE TABLE IF NOT EXISTS business_plan_modules (
  business_type TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_type, plan_id, module_id),
  FOREIGN KEY (business_type, plan_id)
    REFERENCES business_plan_matrix(business_type, plan_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_business_plan_matrix_plan
  ON business_plan_matrix(plan_id, status);

CREATE INDEX IF NOT EXISTS idx_business_plan_modules_plan
  ON business_plan_modules(plan_id, business_type);

INSERT INTO business_plan_matrix (
  business_type, plan_id, monthly_price, yearly_price,
  status, sort_order, updated_at
)
SELECT
  bt.id,
  p.id,
  0,
  0,
  'active',
  p.sort_order,
  now()
FROM business_types bt
JOIN plans p ON p.id IN ('starter','pro','enterprise','custom')
WHERE bt.status='active'
ON CONFLICT (business_type, plan_id) DO NOTHING;
`)
	return err
}

func resolveOfficialBusinessTypeID(ctx context.Context, db *sql.DB, raw string) (string, error) {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if raw == "" {
		var first string
		err := db.QueryRowContext(ctx, `
SELECT id
FROM business_types
WHERE status='active'
ORDER BY sort_order, name
LIMIT 1
`).Scan(&first)
		return first, err
	}

	var id string
	err := db.QueryRowContext(ctx, `
SELECT id
FROM business_types
WHERE id=$1 AND status='active'
UNION ALL
SELECT bta.business_type_id
FROM business_type_aliases bta
JOIN business_types bt ON bt.id=bta.business_type_id
WHERE bta.alias=$1 AND bt.status='active'
LIMIT 1
`, raw).Scan(&id)
	return id, err
}

func loadBusinessPlanMatrix(ctx context.Context, db *sql.DB, requested string) (map[string]interface{}, error) {
	selectedID, err := resolveOfficialBusinessTypeID(ctx, db, requested)
	if err != nil {
		return nil, err
	}

	businessRows, err := db.QueryContext(ctx, `
SELECT id, name, module_category, pricing_weight::float8, sort_order
FROM business_types
WHERE status='active'
ORDER BY sort_order, name
`)
	if err != nil {
		return nil, err
	}
	defer businessRows.Close()

	businesses := make([]map[string]interface{}, 0, 35)
	var selected map[string]interface{}

	for businessRows.Next() {
		var id, name, moduleCategory string
		var pricingWeight float64
		var sortOrder int

		if err := businessRows.Scan(
			&id, &name, &moduleCategory, &pricingWeight, &sortOrder,
		); err != nil {
			return nil, err
		}

		item := map[string]interface{}{
			"id":              id,
			"name":            name,
			"module_category": moduleCategory,
			"pricing_weight":  pricingWeight,
			"sort_order":      sortOrder,
		}
		businesses = append(businesses, item)

		if id == selectedID {
			selected = item
		}
	}
	if err := businessRows.Err(); err != nil {
		return nil, err
	}

	if selected == nil {
		return nil, sql.ErrNoRows
	}

	planRows, err := db.QueryContext(ctx, `
SELECT
  bpm.plan_id,
  p.name,
  bpm.monthly_price::float8,
  bpm.yearly_price::float8,
  bpm.status,
  bpm.sort_order
FROM business_plan_matrix bpm
JOIN plans p ON p.id=bpm.plan_id
WHERE bpm.business_type=$1
  AND p.id IN ('starter','pro','enterprise','custom')
ORDER BY bpm.sort_order, p.name
`, selectedID)
	if err != nil {
		return nil, err
	}
	defer planRows.Close()

	plans := make([]map[string]interface{}, 0, 4)
	for planRows.Next() {
		var planID, name, status string
		var monthlyPrice, yearlyPrice float64
		var sortOrder int

		if err := planRows.Scan(
			&planID, &name, &monthlyPrice, &yearlyPrice,
			&status, &sortOrder,
		); err != nil {
			return nil, err
		}

		moduleRows, err := db.QueryContext(ctx, `
SELECT bpm.module_id
FROM business_plan_modules bpm
JOIN modules m ON m.id=bpm.module_id
WHERE bpm.business_type=$1
  AND bpm.plan_id=$2
  AND m.status='active'
ORDER BY m.sort_order, m.name
`, selectedID, planID)
		if err != nil {
			return nil, err
		}

		moduleIDs := make([]string, 0)
		for moduleRows.Next() {
			var moduleID string
			if err := moduleRows.Scan(&moduleID); err != nil {
				_ = moduleRows.Close()
				return nil, err
			}
			moduleIDs = append(moduleIDs, moduleID)
		}
		if err := moduleRows.Err(); err != nil {
			_ = moduleRows.Close()
			return nil, err
		}
		_ = moduleRows.Close()

		plans = append(plans, map[string]interface{}{
			"id":            planID,
			"plan_id":       planID,
			"name":          name,
			"monthly_price": monthlyPrice,
			"yearly_price":  yearlyPrice,
			"status":        status,
			"sort_order":    sortOrder,
			"module_ids":    moduleIDs,
		})
	}
	if err := planRows.Err(); err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"business_types":    businesses,
		"selected_business": selected,
		"plans":             plans,
	}, nil
}

func handleSuperadminBusinessPlanMatrix(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureBusinessTypesSchemaAndSeed(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "business_types_schema_failed", err.Error())
		return
	}
	if err := ensureBusinessPlanMatrixSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "business_matrix_schema_failed", err.Error())
		return
	}

	result, err := loadBusinessPlanMatrix(
		ctx, db, r.URL.Query().Get("business_type"),
	)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "business_matrix_failed", "Business plan matrix could not load")
		return
	}

	result["ok"] = true
	result["request_id"] = requestID
	writeAPIJSON(w, http.StatusOK, result)
}

func handleSuperadminBusinessPlanMatrixSave(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureBusinessTypesSchemaAndSeed(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "business_types_schema_failed", err.Error())
		return
	}
	if err := ensureBusinessPlanMatrixSchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "business_matrix_schema_failed", err.Error())
		return
	}

	var payload businessPlanMatrixSavePayload
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20))
	if err := decoder.Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid request body")
		return
	}

	businessType, err := resolveOfficialBusinessTypeID(ctx, db, payload.BusinessType)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "business_not_found", "Business type not found")
		return
	}

	payload.PlanID = strings.ToLower(strings.TrimSpace(payload.PlanID))
	allowedPlans := map[string]bool{
		"starter":    true,
		"pro":        true,
		"enterprise": true,
		"custom":     true,
	}
	if !allowedPlans[payload.PlanID] {
		writeAPIError(w, http.StatusBadRequest, "plan_not_allowed", "Invalid plan tier")
		return
	}

	if payload.MonthlyPrice < 0 || payload.YearlyPrice < 0 {
		writeAPIError(w, http.StatusBadRequest, "invalid_price", "Plan prices cannot be negative")
		return
	}

	payload.Status = strings.ToLower(strings.TrimSpace(payload.Status))
	if payload.Status == "" {
		payload.Status = "active"
	}
	if payload.Status != "active" &&
		payload.Status != "inactive" &&
		payload.Status != "archived" {
		writeAPIError(w, http.StatusBadRequest, "invalid_status", "Invalid matrix status")
		return
	}

	var planExists bool
	err = db.QueryRowContext(ctx, `
SELECT EXISTS(SELECT 1 FROM plans WHERE id=$1 AND status='active')
`, payload.PlanID).Scan(&planExists)
	if err != nil || !planExists {
		writeAPIError(w, http.StatusBadRequest, "plan_not_found", "Plan tier not found")
		return
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tx_failed", "Could not start transaction")
		return
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
INSERT INTO business_plan_matrix (
  business_type, plan_id, monthly_price, yearly_price,
  status, sort_order, updated_at
)
VALUES ($1,$2,$3,$4,$5,$6,now())
ON CONFLICT (business_type, plan_id) DO UPDATE SET
  monthly_price=EXCLUDED.monthly_price,
  yearly_price=EXCLUDED.yearly_price,
  status=EXCLUDED.status,
  sort_order=EXCLUDED.sort_order,
  updated_at=now()
`,
		businessType,
		payload.PlanID,
		payload.MonthlyPrice,
		payload.YearlyPrice,
		payload.Status,
		payload.SortOrder,
	)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "matrix_save_failed", err.Error())
		return
	}

	_, err = tx.ExecContext(ctx, `
DELETE FROM business_plan_modules
WHERE business_type=$1 AND plan_id=$2
`, businessType, payload.PlanID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "matrix_modules_clear_failed", err.Error())
		return
	}

	seen := map[string]bool{}
	for _, rawModuleID := range payload.ModuleIDs {
		moduleID := strings.TrimSpace(rawModuleID)
		if moduleID == "" || seen[moduleID] {
			continue
		}
		seen[moduleID] = true

		_, err = tx.ExecContext(ctx, `
INSERT INTO business_plan_modules (business_type, plan_id, module_id)
SELECT $1, $2, id
FROM modules
WHERE id=$3 AND status='active'
ON CONFLICT DO NOTHING
`, businessType, payload.PlanID, moduleID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "matrix_module_save_failed", err.Error())
			return
		}
	}

	if err := tx.Commit(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "commit_failed", "Could not save business plan matrix")
		return
	}

	result, err := loadBusinessPlanMatrix(ctx, db, businessType)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "matrix_reload_failed", "Saved, but matrix could not reload")
		return
	}

	result["ok"] = true
	result["message"] = "Business plan saved"
	result["request_id"] = requestID
	writeAPIJSON(w, http.StatusOK, result)
}
