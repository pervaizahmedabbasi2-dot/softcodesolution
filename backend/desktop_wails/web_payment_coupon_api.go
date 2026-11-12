package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type couponCreatePayload struct {
	Code            string   `json:"code"`
	Type            string   `json:"type"` // percentage or fixed
	Value           float64  `json:"value"`
	Currency        string   `json:"currency"`
	MaxUses         int      `json:"max_uses"`
	MinAmount       float64  `json:"min_amount"`
	ApplicablePlans []string `json:"applicable_plans"`
	ValidFrom       string   `json:"valid_from"`
	ValidUntil      string   `json:"valid_until"`
}

type couponValidatePayload struct {
	Code      string  `json:"code"`
	TenantID  string  `json:"tenant_id"`
	Amount    float64 `json:"amount"`
	PlanID    string  `json:"plan_id"`
}

func handleCouponCreate(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "INVALID_METHOD", "Method not allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, user, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload couponCreatePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid payload")
		return
	}

	plansStr := ""
	if len(payload.ApplicablePlans) > 0 {
		b, _ := json.Marshal(payload.ApplicablePlans)
		plansStr = string(b)
	}

	var validFrom, validUntil sql.NullTime
	if payload.ValidFrom != "" {
		t, err := time.Parse(time.RFC3339, payload.ValidFrom)
		if err == nil {
			validFrom = sql.NullTime{Time: t, Valid: true}
		}
	} else {
		validFrom = sql.NullTime{Time: time.Now(), Valid: true}
	}
	if payload.ValidUntil != "" {
		t, err := time.Parse(time.RFC3339, payload.ValidUntil)
		if err == nil {
			validUntil = sql.NullTime{Time: t, Valid: true}
		}
	}

	_, err := db.ExecContext(ctx, `
		INSERT INTO coupons (code, type, value, currency, max_uses, min_amount, applicable_plans, valid_from, valid_until, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, payload.Code, payload.Type, payload.Value, payload.Currency, payload.MaxUses, payload.MinAmount, plansStr, validFrom, validUntil, user.ID)

	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create coupon")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"code":    payload.Code,
	})
}

func handleCouponValidate(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "INVALID_METHOD", "Method not allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, _, ok := requireModuleUser(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload couponValidatePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid payload")
		return
	}

	var id, couponType, status, plansStr string
	var value, minAmount float64
	var maxUses, currentUses int
	var validFrom, validUntil sql.NullTime

	err := db.QueryRowContext(ctx, "SELECT id, type, value, max_uses, current_uses, min_amount, applicable_plans, valid_from, valid_until, status FROM coupons WHERE code = $1", payload.Code).Scan(
		&id, &couponType, &value, &maxUses, &currentUses, &minAmount, &plansStr, &validFrom, &validUntil, &status)
	if err == sql.ErrNoRows {
		writeAPIError(w, http.StatusNotFound, "NOT_FOUND", "Coupon not found")
		return
	} else if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Database error")
		return
	}

	if status != "active" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_COUPON", "Coupon is inactive")
		return
	}
	if maxUses > 0 && currentUses >= maxUses {
		writeAPIError(w, http.StatusBadRequest, "COUPON_LIMIT", "Coupon usage limit reached")
		return
	}
	if payload.Amount > 0 && payload.Amount < minAmount {
		writeAPIError(w, http.StatusBadRequest, "COUPON_MIN_AMOUNT", "Cart total is less than minimum required amount")
		return
	}
	if validFrom.Valid && time.Now().Before(validFrom.Time) {
		writeAPIError(w, http.StatusBadRequest, "COUPON_NOT_STARTED", "Coupon is not valid yet")
		return
	}
	if validUntil.Valid && time.Now().After(validUntil.Time) {
		writeAPIError(w, http.StatusBadRequest, "COUPON_EXPIRED", "Coupon has expired")
		return
	}

	// Check if already redeemed by this tenant
	var count int
	db.QueryRowContext(ctx, "SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id = $1 AND tenant_id = $2", id, payload.TenantID).Scan(&count)
	if count > 0 {
		writeAPIError(w, http.StatusBadRequest, "COUPON_ALREADY_USED", "Coupon already used by this account")
		return
	}

	var discount float64
	if couponType == "percentage" {
		discount = payload.Amount * (value / 100.0)
	} else {
		discount = value
	}
	if discount > payload.Amount {
		discount = payload.Amount
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"valid":    true,
		"discount": discount,
		"type":     couponType,
	})
}

func handleCouponList(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "INVALID_METHOD", "Method not allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	rows, err := db.QueryContext(ctx, "SELECT id, code, type, value, current_uses, max_uses, status, created_at FROM coupons ORDER BY created_at DESC LIMIT 50")
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch coupons")
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id, code, cType, status string
		var value float64
		var currentUses, maxUses int
		var createdAt time.Time
		
		if err := rows.Scan(&id, &code, &cType, &value, &currentUses, &maxUses, &status, &createdAt); err != nil {
			continue
		}
		
		results = append(results, map[string]interface{}{
			"id":           id,
			"code":         code,
			"type":         cType,
			"value":        value,
			"current_uses": currentUses,
			"max_uses":     maxUses,
			"status":       status,
			"created_at":   createdAt,
		})
	}
	if results == nil {
		results = []map[string]interface{}{}
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    results,
	})
}

func handleCouponDisable(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "INVALID_METHOD", "Method not allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid payload")
		return
	}

	_, err := db.ExecContext(ctx, "UPDATE coupons SET status = 'disabled' WHERE code = $1", payload.Code)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to disable coupon")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}
