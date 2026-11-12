package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type tenantModulePriceUpdatePayload struct {
	TenantID     string  `json:"tenant_id"`
	ClientID     string  `json:"client_id"`
	Email        string  `json:"email"`
	ModuleID     string  `json:"module_id"`
	MonthlyPrice float64 `json:"monthly_price"`
	YearlyPrice  float64 `json:"yearly_price"`
}

func handleSuperadminTenantModulePriceUpdate(w http.ResponseWriter, r *http.Request) {
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

	var payload tenantModulePriceUpdatePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON body")
		return
	}

	payload.ModuleID = strings.TrimSpace(payload.ModuleID)
	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))

	if payload.ModuleID == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_module", "Module id is required")
		return
	}
	if payload.MonthlyPrice < 0 || payload.YearlyPrice < 0 {
		writeAPIError(w, http.StatusBadRequest, "invalid_price", "Price cannot be negative")
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
INSERT INTO tenant_modules (
	tenant_id, module_id, enabled, source,
	monthly_price_snapshot, yearly_price_snapshot, price_override,
	updated_at
)
VALUES ($1, $2, false, 'manual', $3, $4, true, NOW())
ON CONFLICT (tenant_id, module_id) DO UPDATE
SET monthly_price_snapshot = EXCLUDED.monthly_price_snapshot,
	yearly_price_snapshot = EXCLUDED.yearly_price_snapshot,
	price_override = true,
	updated_at = NOW();
`, tenantID, payload.ModuleID, payload.MonthlyPrice, payload.YearlyPrice)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "price_update_failed", "Could not update module price")
		return
	}

	subscriptionSummary, err := recalculateTenantSubscriptionAmount(ctx, db, tenantID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "amount_recalculate_failed", "Could not recalculate subscription amount")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":           true,
		"message":      "Module price updated",
		"tenant_id":    tenantID,
		"module_id":    payload.ModuleID,
		"subscription": subscriptionSummary,
		"request_id":   requestID,
	})
}
