package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

type paymentLogManualPayload struct {
	TenantID  string  `json:"tenant_id"`
	ClientID  string  `json:"client_id"`
	Email     string  `json:"email"`
	InvoiceID string  `json:"invoice_id"`
	Amount    float64 `json:"amount"`
	Method    string  `json:"method"`
	Gateway   string  `json:"gateway"`
	ProofURL  string  `json:"proof_url"`
	ProofNote string  `json:"proof_note"`
}

type paymentApprovePayload struct {
	TransactionID string `json:"transaction_id"`
}

type paymentRejectPayload struct {
	TransactionID string `json:"transaction_id"`
	Reason        string `json:"reason"`
}

func handlePaymentLogManual(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, user, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload paymentLogManualPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON payload")
		return
	}

	tenantID, err := resolveTenantID(ctx, db, payload.TenantID, payload.ClientID, payload.Email)
	if err != nil || tenantID == "" {
		writeAPIError(w, http.StatusBadRequest, "MISSING_TENANT", "Could not resolve tenant identity")
		return
	}

	if payload.Amount <= 0 {
		writeAPIError(w, http.StatusBadRequest, "INVALID_AMOUNT", "Amount must be greater than zero")
		return
	}

	validMethods := map[string]bool{
		"cash":          true,
		"bank_transfer": true,
		"cheque":        true,
		"mobile_wallet": true,
		"stripe":        true,
		"paypal":        true,
	}
	if !validMethods[payload.Method] {
		writeAPIError(w, http.StatusBadRequest, "INVALID_METHOD", "Invalid payment method")
		return
	}

	txID := "txn_" + strconv.FormatInt(time.Now().UnixNano(), 10)
	status := "pending_approval"
	if payload.Gateway == "" {
		payload.Gateway = "local"
	}

	query := `
		INSERT INTO transactions (id, tenant_id, invoice_id, amount, currency, status, method, gateway, created_at, collected_by, proof_url, proof_note)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, status, created_at
	`
	var retID, retStatus string
	var retCreatedAt time.Time

	err = db.QueryRowContext(ctx, query,
		txID, tenantID, payload.InvoiceID, payload.Amount, "USD", status, payload.Method, payload.Gateway, time.Now(), user.ID, payload.ProofURL, payload.ProofNote,
	).Scan(&retID, &retStatus, &retCreatedAt)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to log payment transaction")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"id":         retID,
		"status":     retStatus,
		"created_at": retCreatedAt,
	})
}

func handlePaymentApprove(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, user, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload paymentApprovePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON payload")
		return
	}
	if payload.TransactionID == "" {
		writeAPIError(w, http.StatusBadRequest, "MISSING_TRANSACTION_ID", "Transaction ID is required")
		return
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to begin transaction")
		return
	}
	defer tx.Rollback()

	var currentStatus, tenantID string
	var invoiceID sql.NullString
	var amount float64
	err = tx.QueryRowContext(ctx, "SELECT status, tenant_id, invoice_id, amount FROM transactions WHERE id = $1", payload.TransactionID).Scan(&currentStatus, &tenantID, &invoiceID, &amount)
	if err == sql.ErrNoRows {
		writeAPIError(w, http.StatusNotFound, "NOT_FOUND", "Transaction not found")
		return
	} else if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to query transaction")
		return
	}

	if currentStatus != "pending_approval" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_STATUS", "Transaction is not pending approval")
		return
	}

	_, err = tx.ExecContext(ctx, "UPDATE transactions SET status = 'completed', approved_by = $1, approved_at = $2 WHERE id = $3", user.ID, time.Now(), payload.TransactionID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update transaction")
		return
	}

	if invoiceID.Valid && invoiceID.String != "" {
		_, err = tx.ExecContext(ctx, "UPDATE invoices SET status = 'paid', amount_paid = amount_due, amount_due = 0, paid_at = $1 WHERE id = $2", time.Now(), invoiceID.String)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update invoice")
			return
		}
	}

	_, err = tx.ExecContext(ctx, "UPDATE tenant_subscriptions SET status = 'active' WHERE tenant_id = $1", tenantID)
	if err != nil {
		// Log it, but let it proceed
	}

	if err = tx.Commit(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to commit transaction")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"id":      payload.TransactionID,
		"status":  "completed",
	})
}

func handlePaymentReject(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload paymentRejectPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON payload")
		return
	}
	if payload.TransactionID == "" {
		writeAPIError(w, http.StatusBadRequest, "MISSING_TRANSACTION_ID", "Transaction ID is required")
		return
	}

	var currentStatus string
	err := db.QueryRowContext(ctx, "SELECT status FROM transactions WHERE id = $1", payload.TransactionID).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		writeAPIError(w, http.StatusNotFound, "NOT_FOUND", "Transaction not found")
		return
	} else if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to query transaction")
		return
	}

	if currentStatus != "pending_approval" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_STATUS", "Transaction is not pending approval")
		return
	}

	_, err = db.ExecContext(ctx, "UPDATE transactions SET status = 'failed', rejection_reason = $1 WHERE id = $2", payload.Reason, payload.TransactionID)
	if err != nil {
		// fallback if column doesn't exist
		_, err = db.ExecContext(ctx, "UPDATE transactions SET status = 'failed' WHERE id = $1", payload.TransactionID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update transaction")
			return
		}
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"status":  "failed",
	})
}

func handlePendingApprovals(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	query := `
		SELECT t.id, t.tenant_id, t.invoice_id, t.amount, t.method, t.gateway, t.proof_url, t.proof_note, t.created_at,
		       c.company_name, c.email
		FROM transactions t
		LEFT JOIN client_business_register c ON t.tenant_id = c.tenant_id
		WHERE t.status = 'pending_approval'
		ORDER BY t.created_at DESC
	`
	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to query pending approvals")
		return
	}
	defer rows.Close()

	type pendingTx struct {
		ID          string    `json:"id"`
		TenantID    string    `json:"tenant_id"`
		InvoiceID   string    `json:"invoice_id"`
		Amount      float64   `json:"amount"`
		Method      string    `json:"method"`
		Gateway     string    `json:"gateway"`
		ProofURL    string    `json:"proof_url"`
		ProofNote   string    `json:"proof_note"`
		CreatedAt   time.Time `json:"created_at"`
		CompanyName string    `json:"company_name"`
		Email       string    `json:"email"`
	}

	var results []pendingTx
	for rows.Next() {
		var tx pendingTx
		var invID, proofURL, proofNote, companyName, email sql.NullString
		if err := rows.Scan(&tx.ID, &tx.TenantID, &invID, &tx.Amount, &tx.Method, &tx.Gateway, &proofURL, &proofNote, &tx.CreatedAt, &companyName, &email); err != nil {
			writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to scan row")
			return
		}
		tx.InvoiceID = invID.String
		tx.ProofURL = proofURL.String
		tx.ProofNote = proofNote.String
		tx.CompanyName = companyName.String
		tx.Email = email.String
		results = append(results, tx)
	}

	// returning empty array instead of null
	if results == nil {
		results = []pendingTx{}
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"data": results,
	})
}

func handlePaymentHistory(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
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

	var totalCount int
	var err error
	if tenantID != "" {
		err = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM transactions WHERE tenant_id = $1", tenantID).Scan(&totalCount)
	} else {
		err = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM transactions").Scan(&totalCount)
	}

	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to count transactions")
		return
	}

	var rows *sql.Rows
	if tenantID != "" {
		rows, err = db.QueryContext(ctx, "SELECT id, tenant_id, invoice_id, amount, status, method, created_at FROM transactions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", tenantID, limit, offset)
	} else {
		rows, err = db.QueryContext(ctx, "SELECT id, tenant_id, invoice_id, amount, status, method, created_at FROM transactions ORDER BY created_at DESC LIMIT $1 OFFSET $2", limit, offset)
	}

	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to query history")
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id, tID, status, method string
		var invID sql.NullString
		var amt float64
		var createdAt time.Time

		if err := rows.Scan(&id, &tID, &invID, &amt, &status, &method, &createdAt); err != nil {
			writeAPIError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to scan history row")
			return
		}

		results = append(results, map[string]interface{}{
			"id":         id,
			"tenant_id":  tID,
			"invoice_id": invID.String,
			"amount":     amt,
			"status":     status,
			"method":     method,
			"created_at": createdAt,
		})
	}

	if results == nil {
		results = []map[string]interface{}{}
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"data":  results,
		"total": totalCount,
	})
}

func registerPaymentHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/payment/log-manual", handlePaymentLogManual)
	mux.HandleFunc("/api/payment/approve", handlePaymentApprove)
	mux.HandleFunc("/api/payment/reject", handlePaymentReject)
	mux.HandleFunc("/api/payment/pending-approvals", handlePendingApprovals)
	mux.HandleFunc("/api/payment/history", handlePaymentHistory)

	mux.HandleFunc("/api/invoices/generate", handleInvoiceGenerate)
	mux.HandleFunc("/api/invoices", handleInvoiceList)
	mux.HandleFunc("/api/invoices/detail", handleInvoiceDetail)
	mux.HandleFunc("/api/invoices/cancel", handleInvoiceCancel)
	
	mux.HandleFunc("/api/client/billing", handleClientBilling)
}
