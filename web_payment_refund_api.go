package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

type refundRequestPayload struct {
	TenantID      string  `json:"tenant_id"`
	InvoiceID     string  `json:"invoice_id"`
	TransactionID string  `json:"transaction_id"`
	Type          string  `json:"type"` // full or partial
	Amount        float64 `json:"amount"`
	Reason        string  `json:"reason"`
	RefundTo      string  `json:"refund_to"` // wallet, original_method, bank_transfer
}

type refundApprovePayload struct {
	RefundID string `json:"refund_id"`
}

func handleRefundRequest(w http.ResponseWriter, r *http.Request) {
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

	var payload refundRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid payload")
		return
	}

	if payload.Amount <= 0 {
		writeAPIError(w, http.StatusBadRequest, "INVALID_AMOUNT", "Amount must be greater than zero")
		return
	}

	_, err := db.ExecContext(ctx, `
		INSERT INTO refunds (tenant_id, invoice_id, transaction_id, type, amount, reason, status, refund_to, processed_by)
		VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
	`, payload.TenantID, payload.InvoiceID, payload.TransactionID, payload.Type, payload.Amount, payload.Reason, payload.RefundTo, user.ID)
	
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create refund request")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"status":  "pending",
	})
}

func handleRefundApprove(w http.ResponseWriter, r *http.Request) {
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

	var payload refundApprovePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid payload")
		return
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to start transaction")
		return
	}
	defer tx.Rollback()

	var tenantID, refundTo string
	var amount float64
	var status string
	err = tx.QueryRowContext(ctx, "SELECT tenant_id, amount, status, refund_to FROM refunds WHERE id = $1", payload.RefundID).Scan(&tenantID, &amount, &status, &refundTo)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "NOT_FOUND", "Refund request not found")
		return
	}

	if status != "pending" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_STATUS", "Refund is not in pending status")
		return
	}

	_, err = tx.ExecContext(ctx, "UPDATE refunds SET status = 'approved', approved_by = $1 WHERE id = $2", user.ID, payload.RefundID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update refund status")
		return
	}

	if refundTo == "wallet" {
		_, err = tx.ExecContext(ctx, "INSERT INTO wallet (tenant_id, balance, currency, updated_at) VALUES ($1, 0, 'USD', NOW()) ON CONFLICT (tenant_id) DO NOTHING", tenantID)
		if err == nil {
			var currentBalance float64
			tx.QueryRowContext(ctx, "SELECT balance FROM wallet WHERE tenant_id = $1", tenantID).Scan(&currentBalance)
			newBalance := currentBalance + amount
			tx.ExecContext(ctx, "UPDATE wallet SET balance = $1, updated_at = NOW() WHERE tenant_id = $2", newBalance, tenantID)
			tx.ExecContext(ctx, "INSERT INTO wallet_transactions (tenant_id, type, amount, balance_after, reference, created_by) VALUES ($1, 'refund_credit', $2, $3, $4, $5)",
				tenantID, amount, newBalance, "Refund ID: "+payload.RefundID, user.ID)
		}
	}

	if err = tx.Commit(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to commit transaction")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"status":  "approved",
	})
}

func handleRefundList(w http.ResponseWriter, r *http.Request) {
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

	query := "SELECT id, tenant_id, invoice_id, transaction_id, type, amount, reason, status, refund_to, created_at FROM refunds "
	args := []interface{}{}
	if tenantID != "" {
		query += "WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
		args = append(args, tenantID, limit, offset)
	} else {
		query += "ORDER BY created_at DESC LIMIT $1 OFFSET $2"
		args = append(args, limit, offset)
	}

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch refunds")
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id, tID, txnType, reason, status, refundTo string
		var invID, txnID sql.NullString
		var amount float64
		var createdAt time.Time

		if err := rows.Scan(&id, &tID, &invID, &txnID, &txnType, &amount, &reason, &status, &refundTo, &createdAt); err != nil {
			continue
		}
		
		results = append(results, map[string]interface{}{
			"id":             id,
			"tenant_id":      tID,
			"invoice_id":     invID.String,
			"transaction_id": txnID.String,
			"type":           txnType,
			"amount":         amount,
			"reason":         reason,
			"status":         status,
			"refund_to":      refundTo,
			"created_at":     createdAt,
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
