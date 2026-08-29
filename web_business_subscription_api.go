package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

// SCS_BUSINESS_SUBSCRIPTION_ASSIGNMENT_V2

func scsResolveTenantBusinessType(
	ctx context.Context,
	db *sql.DB,
	tenantID string,
	clientID string,
	email string,
) (string, error) {
	tenantID = strings.TrimSpace(tenantID)
	clientID = strings.TrimSpace(clientID)
	email = strings.TrimSpace(email)

	var officialBusiness string

	err := db.QueryRowContext(ctx, `
WITH matched_client AS (
	SELECT
		COALESCE(
			NULLIF(TRIM(r.business_type), ''),
			'other_business'
		) AS raw_business
	FROM client_business_register r
	LEFT JOIN auth_users au
		ON LOWER(au.email) = LOWER(r.email::text)
	WHERE
		   ($1 <> '' AND r.id::text = $1)
		OR ($2 <> '' AND LOWER(r.email::text) = LOWER($2))
		OR (
			$3 <> ''
			AND COALESCE(
				NULLIF(au.tenant_id, ''),
				'tenant_' || REPLACE(r.id::text, '-', '')
			) = $3
		)
	ORDER BY
		CASE
			WHEN $1 <> '' AND r.id::text = $1 THEN 0
			WHEN $2 <> '' AND LOWER(r.email::text) = LOWER($2) THEN 1
			ELSE 2
		END
	LIMIT 1
)
SELECT COALESCE(bt.id, alias_bt.id)
FROM matched_client mc
LEFT JOIN business_types bt
	ON bt.id = mc.raw_business
LEFT JOIN business_type_aliases bta
	ON bta.alias = mc.raw_business
LEFT JOIN business_types alias_bt
	ON alias_bt.id = bta.business_type_id
WHERE bt.id IS NOT NULL
   OR alias_bt.id IS NOT NULL
LIMIT 1;
`, clientID, email, tenantID).Scan(&officialBusiness)

	if err != nil {
		return "", err
	}

	return strings.TrimSpace(officialBusiness), nil
}

func scsBusinessPlanPrice(
	ctx context.Context,
	db *sql.DB,
	businessType string,
	planID string,
	billingCycle string,
) (float64, error) {
	var amount float64

	err := db.QueryRowContext(ctx, `
SELECT
	CASE
		WHEN $3 = 'yearly'
			THEN yearly_price
		ELSE monthly_price
	END::float8
FROM business_plan_matrix
WHERE business_type = $1
  AND plan_id = $2
  AND status = 'active'
LIMIT 1;
`, businessType, planID, billingCycle).Scan(&amount)

	return amount, err
}

// loadTenantSubscriptionSummary is a READ-ONLY lookup.
// Unlike recalculateTenantSubscriptionAmount, it never writes
// to tenant_subscriptions. Viewing a client must never create
// a phantom subscription row for them.
func loadTenantSubscriptionSummary(
	ctx context.Context,
	db *sql.DB,
	tenantID string,
) (map[string]interface{}, error) {
	planID := ""
	status := "none"
	billingCycle := "monthly"
	var planBaseAmount float64
	var moduleAddonsAmount float64
	var amount float64

	err := db.QueryRowContext(ctx, `
SELECT
	COALESCE(plan_id, ''),
	COALESCE(status, 'none'),
	COALESCE(NULLIF(billing_cycle, ''), 'monthly'),
	COALESCE(plan_base_amount, 0)::float8,
	COALESCE(module_addons_amount, 0)::float8,
	COALESCE(amount, 0)::float8
FROM tenant_subscriptions
WHERE tenant_id = $1
LIMIT 1;
`, tenantID).Scan(
		&planID,
		&status,
		&billingCycle,
		&planBaseAmount,
		&moduleAddonsAmount,
		&amount,
	)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	businessType := ""
	resolvedBusiness, resolveErr := scsResolveTenantBusinessType(
		ctx,
		db,
		tenantID,
		"",
		"",
	)
	if resolveErr == nil {
		businessType = resolvedBusiness
	}

	return map[string]interface{}{
		"status":               status,
		"business_type":        businessType,
		"plan_id":              planID,
		"billing_cycle":        billingCycle,
		"plan_base_amount":     planBaseAmount,
		"module_addons_amount": moduleAddonsAmount,
		"amount":               amount,
	}, nil
}

func handleSuperadminSubscriptionLoad(
	w http.ResponseWriter,
	r *http.Request,
) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet {
		writeAPIError(
			w,
			http.StatusMethodNotAllowed,
			"method_not_allowed",
			"Only GET is allowed",
		)
		return
	}

	query := r.URL.Query()
	tenantIDParam := strings.TrimSpace(query.Get("tenant_id"))
	clientIDParam := strings.TrimSpace(query.Get("client_id"))
	emailParam := strings.TrimSpace(query.Get("email"))

	if tenantIDParam == "" && clientIDParam == "" && emailParam == "" {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"missing_identifier",
			"tenant_id, client_id ya email chahiye",
		)
		return
	}

	ctx, cancel := context.WithTimeout(
		r.Context(),
		25*time.Second,
	)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	tenantID, err := resolveTenantID(
		ctx,
		db,
		tenantIDParam,
		clientIDParam,
		emailParam,
	)
	if err != nil || tenantID == "" {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"tenant_not_found",
			"Tenant not found",
		)
		return
	}

	subscription, err := loadTenantSubscriptionSummary(
		ctx,
		db,
		tenantID,
	)
	if err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"subscription_load_failed",
			"Subscription load nahi hui",
		)
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":           true,
		"tenant_id":    tenantID,
		"subscription": subscription,
		"request_id":   requestID,
	})
}

func handleSuperadminSubscriptionSave(
	w http.ResponseWriter,
	r *http.Request,
) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodPost {
		writeAPIError(
			w,
			http.StatusMethodNotAllowed,
			"method_not_allowed",
			"Only POST is allowed",
		)
		return
	}

	var payload tenantSubscriptionSavePayload

	decoder := json.NewDecoder(
		http.MaxBytesReader(w, r.Body, 1<<20),
	)

	if err := decoder.Decode(&payload); err != nil {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"bad_json",
			"Invalid JSON body",
		)
		return
	}

	payload.PlanID = strings.ToLower(
		strings.TrimSpace(payload.PlanID),
	)

	payload.BillingCycle = strings.ToLower(
		strings.TrimSpace(payload.BillingCycle),
	)

	payload.Status = strings.ToLower(
		strings.TrimSpace(payload.Status),
	)

	if payload.BillingCycle != "yearly" {
		payload.BillingCycle = "monthly"
	}

	if payload.Status == "" {
		payload.Status = "active"
	}

	allowedStatuses := map[string]bool{
		"trial":     true,
		"active":    true,
		"past_due":  true,
		"cancelled": true,
		"expired":   true,
		"manual":    true,
	}

	if !allowedStatuses[payload.Status] {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"invalid_status",
			"Invalid subscription status",
		)
		return
	}

	if payload.PlanID == "custom" {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"custom_client_level",
			"Custom plan client-specific phase mein save hoga",
		)
		return
	}

	allowedPlans := map[string]bool{
		"starter":    true,
		"pro":        true,
		"enterprise": true,
	}

	if !allowedPlans[payload.PlanID] {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"invalid_plan",
			"Starter, Pro ya Enterprise plan select karo",
		)
		return
	}

	ctx, cancel := context.WithTimeout(
		r.Context(),
		25*time.Second,
	)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureModuleEntitlementSchema(ctx, db); err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"module_schema_failed",
			err.Error(),
		)
		return
	}

	tenantID, err := resolveTenantID(
		ctx,
		db,
		payload.TenantID,
		payload.ClientID,
		payload.Email,
	)
	if err != nil || tenantID == "" {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"tenant_not_found",
			"Tenant not found",
		)
		return
	}

	businessType, err := scsResolveTenantBusinessType(
		ctx,
		db,
		tenantID,
		payload.ClientID,
		payload.Email,
	)
	if err != nil || businessType == "" {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"business_not_found",
			"Client business type could not be resolved",
		)
		return
	}

	planBaseAmount, err := scsBusinessPlanPrice(
		ctx,
		db,
		businessType,
		payload.PlanID,
		payload.BillingCycle,
	)
	if err != nil {
		writeAPIError(
			w,
			http.StatusBadRequest,
			"business_plan_not_found",
			"Selected plan is not active for this business",
		)
		return
	}

	var includedModules int

	err = db.QueryRowContext(ctx, `
SELECT COUNT(*)
FROM business_plan_modules bpm
JOIN modules m
	ON m.id = bpm.module_id
	AND m.status = 'active'
WHERE bpm.business_type = $1
  AND bpm.plan_id = $2;
`, businessType, payload.PlanID).Scan(&includedModules)

	if err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"matrix_module_count_failed",
			"Could not read included modules",
		)
		return
	}

	tx, err := db.BeginTx(
		ctx,
		&sql.TxOptions{},
	)
	if err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"tx_failed",
			"Could not start transaction",
		)
		return
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
INSERT INTO tenant_subscriptions (
	tenant_id,
	plan_id,
	status,
	billing_cycle,
	amount,
	plan_base_amount,
	module_addons_amount,
	updated_at
)
VALUES (
	$1,
	$2,
	$3,
	$4,
	$5,
	$5,
	0,
	NOW()
)
ON CONFLICT (tenant_id) DO UPDATE
SET plan_id = EXCLUDED.plan_id,
	status = EXCLUDED.status,
	billing_cycle = EXCLUDED.billing_cycle,
	amount = EXCLUDED.amount,
	plan_base_amount = EXCLUDED.plan_base_amount,
	updated_at = NOW();
`,
		tenantID,
		payload.PlanID,
		payload.Status,
		payload.BillingCycle,
		planBaseAmount,
	)
	if err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"subscription_failed",
			"Could not save business subscription",
		)
		return
	}

	// Only previous plan-owned modules are disabled.
	// Manual and upgrade modules remain untouched.
	_, err = tx.ExecContext(ctx, `
UPDATE tenant_modules
SET enabled = false,
	updated_at = NOW()
WHERE tenant_id = $1
  AND source = 'plan';
`, tenantID)

	if err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"old_plan_modules_disable_failed",
			"Could not disable previous plan modules",
		)
		return
	}

	_, err = tx.ExecContext(ctx, `
INSERT INTO tenant_modules (
	tenant_id,
	module_id,
	enabled,
	source,
	updated_at,
	monthly_price_snapshot,
	yearly_price_snapshot
)
SELECT
	$1,
	bpm.module_id,
	true,
	'plan',
	NOW(),
	m.price_monthly,
	m.price_yearly
FROM business_plan_modules bpm
JOIN modules m
	ON m.id = bpm.module_id
	AND m.status = 'active'
WHERE bpm.business_type = $2
  AND bpm.plan_id = $3
ON CONFLICT (tenant_id, module_id) DO UPDATE
SET enabled = true,
	source = CASE
		WHEN tenant_modules.source IN ('manual', 'upgrade')
			THEN tenant_modules.source
		ELSE 'plan'
	END,
	monthly_price_snapshot = CASE
		WHEN tenant_modules.price_override
			THEN tenant_modules.monthly_price_snapshot
		ELSE EXCLUDED.monthly_price_snapshot
	END,
	yearly_price_snapshot = CASE
		WHEN tenant_modules.price_override
			THEN tenant_modules.yearly_price_snapshot
		ELSE EXCLUDED.yearly_price_snapshot
	END,
	updated_at = NOW();
`, tenantID, businessType, payload.PlanID)

	if err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"business_plan_modules_failed",
			"Could not enable business plan modules",
		)
		return
	}

	if err := tx.Commit(); err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"commit_failed",
			"Could not save business subscription",
		)
		return
	}

	subscription, err := recalculateTenantSubscriptionAmount(
		ctx,
		db,
		tenantID,
	)
	if err != nil {
		writeAPIError(
			w,
			http.StatusInternalServerError,
			"amount_recalculate_failed",
			"Plan saved, but totals could not be recalculated",
		)
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":               true,
		"message":          "Business plan and modules assigned",
		"tenant_id":        tenantID,
		"business_type":    businessType,
		"plan_id":          payload.PlanID,
		"billing_cycle":    payload.BillingCycle,
		"included_modules": includedModules,
		"subscription":     subscription,
		"request_id":       requestID,
	})
}

func recalculateTenantSubscriptionAmount(
	ctx context.Context,
	db *sql.DB,
	tenantID string,
) (map[string]interface{}, error) {
	planID := ""
	status := "active"
	billingCycle := "monthly"

	err := db.QueryRowContext(ctx, `
SELECT
	COALESCE(plan_id, ''),
	COALESCE(status, 'active'),
	COALESCE(NULLIF(billing_cycle, ''), 'monthly')
FROM tenant_subscriptions
WHERE tenant_id = $1
LIMIT 1;
`, tenantID).Scan(
		&planID,
		&status,
		&billingCycle,
	)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	if billingCycle != "yearly" {
		billingCycle = "monthly"
	}

	businessType := ""

	resolvedBusiness, resolveErr := scsResolveTenantBusinessType(
		ctx,
		db,
		tenantID,
		"",
		"",
	)
	if resolveErr == nil {
		businessType = resolvedBusiness
	}

	var planBaseAmount float64

	if planID != "" {
		priceErr := sql.ErrNoRows

		if businessType != "" {
			planBaseAmount, priceErr = scsBusinessPlanPrice(
				ctx,
				db,
				businessType,
				planID,
				billingCycle,
			)
		}

		// Legacy fallback keeps old store_start subscriptions readable
		// until Superadmin intentionally reassigns them.
		if priceErr == sql.ErrNoRows {
			if billingCycle == "yearly" {
				priceErr = db.QueryRowContext(ctx, `
SELECT COALESCE(yearly_price, 0)::float8
FROM plans
WHERE id = $1
  AND status = 'active'
LIMIT 1;
`, planID).Scan(&planBaseAmount)
			} else {
				priceErr = db.QueryRowContext(ctx, `
SELECT COALESCE(monthly_price, 0)::float8
FROM plans
WHERE id = $1
  AND status = 'active'
LIMIT 1;
`, planID).Scan(&planBaseAmount)
			}
		}

		if priceErr != nil && priceErr != sql.ErrNoRows {
			return nil, priceErr
		}
	}

	var moduleAddonsAmount float64

	err = db.QueryRowContext(ctx, `
SELECT COALESCE(
	SUM(
		CASE
			WHEN $4 = 'yearly'
				THEN COALESCE(
					NULLIF(tm.yearly_price_snapshot, 0),
					m.price_yearly,
					0
				)
			ELSE COALESCE(
				NULLIF(tm.monthly_price_snapshot, 0),
				m.price_monthly,
				0
			)
		END
	),
	0
)::float8
FROM tenant_modules tm
JOIN modules m
	ON m.id = tm.module_id
WHERE tm.tenant_id = $1
  AND tm.enabled = true
  AND tm.source <> 'plan'
  AND (
	$2 = ''
	OR $3 = ''
	OR NOT EXISTS (
		SELECT 1
		FROM business_plan_modules bpm
		WHERE bpm.business_type = $2
		  AND bpm.plan_id = $3
		  AND bpm.module_id = tm.module_id
	)
  );
`,
		tenantID,
		businessType,
		planID,
		billingCycle,
	).Scan(&moduleAddonsAmount)

	if err != nil {
		return nil, err
	}

	totalAmount := planBaseAmount + moduleAddonsAmount

	_, err = db.ExecContext(ctx, `
INSERT INTO tenant_subscriptions (
	tenant_id,
	plan_id,
	status,
	billing_cycle,
	plan_base_amount,
	module_addons_amount,
	amount,
	updated_at
)
VALUES (
	$1,
	$2,
	$3,
	$4,
	$5,
	$6,
	$7,
	NOW()
)
ON CONFLICT (tenant_id) DO UPDATE
SET plan_id = EXCLUDED.plan_id,
	status = EXCLUDED.status,
	billing_cycle = EXCLUDED.billing_cycle,
	plan_base_amount = EXCLUDED.plan_base_amount,
	module_addons_amount = EXCLUDED.module_addons_amount,
	amount = EXCLUDED.amount,
	updated_at = NOW();
`,
		tenantID,
		planID,
		status,
		billingCycle,
		planBaseAmount,
		moduleAddonsAmount,
		totalAmount,
	)

	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"status":               status,
		"business_type":        businessType,
		"plan_id":              planID,
		"billing_cycle":        billingCycle,
		"plan_base_amount":     planBaseAmount,
		"module_addons_amount": moduleAddonsAmount,
		"amount":               totalAmount,
	}, nil
}
