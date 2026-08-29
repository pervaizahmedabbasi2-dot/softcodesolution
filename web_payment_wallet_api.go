package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

type walletDepositPayload struct {
	TenantID string  `json:"tenant_id"`
	Amount   float64 `json:"amount"`
	Method   string  `json:"method"`
}

func handleWalletBalance(w http.ResponseWriter, r *http.Request) {
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

	db, _, ok := requireModuleUser(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	tenantID := r.URL.Query().Get("tenant_id")
	if tenantID == "" {
		writeAPIError(w, http.StatusBadRequest, "MISSING_TENANT", "Tenant ID is required")
		return
	}

	var balance float64
	var currency string
	err := db.QueryRowContext(ctx, "SELECT balance, currency FROM wallet WHERE tenant_id = $1", tenantID).Scan(&balance, &currency)
	if err == sql.ErrNoRows {
		// No wallet yet, defaults to 0
		balance = 0.0
		currency = "USD"
	} else if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch wallet balance")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"balance":  balance,
		"currency": currency,
	})
}

func handleWalletDeposit(w http.ResponseWriter, r *http.Request) {
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

	var payload walletDepositPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid payload")
		return
	}

	if payload.Amount <= 0 {
		writeAPIError(w, http.StatusBadRequest, "INVALID_AMOUNT", "Amount must be greater than zero")
		return
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to start transaction")
		return
	}
	defer tx.Rollback()

	// Ensure wallet exists
	_, err = tx.ExecContext(ctx, "INSERT INTO wallet (tenant_id, balance, currency, updated_at) VALUES ($1, 0, 'USD', NOW()) ON CONFLICT (tenant_id) DO NOTHING", payload.TenantID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to initialize wallet")
		return
	}

	var currentBalance float64
	err = tx.QueryRowContext(ctx, "SELECT balance FROM wallet WHERE tenant_id = $1", payload.TenantID).Scan(&currentBalance)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch current balance")
		return
	}

	newBalance := currentBalance + payload.Amount

	_, err = tx.ExecContext(ctx, "UPDATE wallet SET balance = $1, updated_at = NOW() WHERE tenant_id = $2", newBalance, payload.TenantID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update balance")
		return
	}

	_, err = tx.ExecContext(ctx, "INSERT INTO wallet_transactions (tenant_id, type, amount, balance_after, reference, created_by) VALUES ($1, 'deposit', $2, $3, $4, $5)",
		payload.TenantID, payload.Amount, newBalance, "Manual deposit via "+payload.Method, user.ID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to record wallet transaction")
		return
	}

	if err = tx.Commit(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to commit transaction")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"balance": newBalance,
	})
}

func handleWalletHistory(w http.ResponseWriter, r *http.Request) {
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

	db, _, ok := requireModuleUser(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	tenantID := r.URL.Query().Get("tenant_id")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50
	offset := 0
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
		offset = o
	}

	rows, err := db.QueryContext(ctx, "SELECT id, type, amount, balance_after, reference, created_at FROM wallet_transactions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", tenantID, limit, offset)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch wallet history")
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id, txnType string
		var amount, balanceAfter float64
		var createdAt time.Time
		var ref sql.NullString

		if err := rows.Scan(&id, &txnType, &amount, &balanceAfter, &ref, &createdAt); err != nil {
			writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to scan row")
			return
		}
		
		results = append(results, map[string]interface{}{
			"id":            id,
			"type":          txnType,
			"amount":        amount,
			"balance_after": balanceAfter,
			"reference":     ref.String,
			"created_at":    createdAt,
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
