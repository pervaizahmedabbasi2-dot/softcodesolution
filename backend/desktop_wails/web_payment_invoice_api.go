package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

type invoiceGeneratePayload struct {
	TenantID string `json:"tenant_id"`
	ClientID string `json:"client_id"`
	Email    string `json:"email"`
}

type invoiceCancelPayload struct {
	InvoiceID string `json:"invoice_id"`
}

func resolveCurrencyByCountry(country string) string {
	m := map[string]string{
		"Pakistan":       "PKR",
		"United States":  "USD",
		"United Kingdom": "GBP",
		"UAE":            "AED",
		"India":          "INR",
		"Canada":         "CAD",
		"Germany":        "EUR",
		"Saudi Arabia":   "SAR",
	}
	if c, ok := m[country]; ok {
		return c
	}
	return "USD"
}

func generateInvoiceNumber(ctx context.Context, db *sql.DB) (string, error) {
	var count int
	err := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM invoices").Scan(&count)
	if err != nil {
		return "", err
	}
	year := time.Now().Year()
	return fmt.Sprintf("INV-%d-%05d", year, count+1), nil
}

func generateInvoice(ctx context.Context, db *sql.DB, tenantID string, createdBy string) (map[string]interface{}, error) {
	// 1. Load tenant subscription
	var planID, billingCycle string
	var planBaseAmount float64
	err := db.QueryRowContext(ctx, `
		SELECT plan_id, billing_cycle, plan_base_amount 
		FROM tenant_subscriptions 
		WHERE tenant_id = $1`, tenantID).Scan(&planID, &billingCycle, &planBaseAmount)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to load subscription: %w", err)
	}

	// 2. Resolve business type
	businessType, err := scsResolveTenantBusinessType(
        ctx,
        db,
        tenantID,
        "",
        "",
)
if err != nil {
        businessType = ""
}

	// 3. Resolve currency
	var country string
	err = db.QueryRowContext(ctx, "SELECT country FROM client_business_register WHERE tenant_id = $1", tenantID).Scan(&country)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to load country: %w", err)
	}
	currency := resolveCurrencyByCountry(country)

	// 4. Calculate tax
	var taxRate float64
	err = db.QueryRowContext(ctx, "SELECT tax_rate FROM tax_rules WHERE country = $1", country).Scan(&taxRate)
	if err != nil && err != sql.ErrNoRows {
		taxRate = 0 // Default no tax
	}

	// 5. Generate invoice number
	invoiceNumber, err := generateInvoiceNumber(ctx, db)
	if err != nil {
		return nil, fmt.Errorf("failed to generate invoice number: %w", err)
	}

	invoiceID := invoiceNumber
	subtotal := planBaseAmount
	
	// Start transaction
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 6. Insert into invoices
	_, err = tx.ExecContext(ctx, `
		INSERT INTO invoices (
			id, tenant_id, invoice_number, currency, business_type, status, created_by, created_at, due_date
		) VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW(), NOW() + INTERVAL '14 days')
	`, invoiceID, tenantID, invoiceNumber, currency, businessType, createdBy)
	if err != nil {
		return nil, fmt.Errorf("failed to insert invoice: %w", err)
	}

	// 7. Insert plan line item
	_, err = tx.ExecContext(ctx, `
		INSERT INTO invoice_line_items (invoice_id, description, amount, type)
		VALUES ($1, $2, $3, 'plan')
	`, invoiceID, fmt.Sprintf("Subscription Plan: %s", planID), planBaseAmount)
	if err != nil {
		return nil, fmt.Errorf("failed to insert plan line item: %w", err)
	}

	// 8. Query addon modules
	rows, err := tx.QueryContext(ctx, `
		SELECT module_id, price 
		FROM tenant_modules 
		WHERE tenant_id = $1 AND source <> 'plan' AND enabled = true
	`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query modules: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var moduleID string
		var price float64
		if err := rows.Scan(&moduleID, &price); err != nil {
			return nil, err
		}
		
		_, err = tx.ExecContext(ctx, `
			INSERT INTO invoice_line_items (invoice_id, description, amount, type)
			VALUES ($1, $2, $3, 'addon')
		`, invoiceID, fmt.Sprintf("Addon Module: %s", moduleID), price)
		if err != nil {
			return nil, err
		}
		subtotal += price
	}

	taxAmount := subtotal * (taxRate / 100.0)
	total := subtotal + taxAmount
	amountDue := total

	// Update invoice totals
	_, err = tx.ExecContext(ctx, `
		UPDATE invoices 
		SET subtotal = $1, tax_amount = $2, total = $3, amount_due = $4 
		WHERE id = $5
	`, subtotal, taxAmount, total, amountDue, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice totals: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return loadInvoice(ctx, db, invoiceID)
}

func loadInvoice(ctx context.Context, db *sql.DB, invoiceID string) (map[string]interface{}, error) {
	var inv struct {
		ID            string
		TenantID      string
		InvoiceNumber string
		Status        string
		Currency      string
		Subtotal      float64
		TaxAmount     float64
		Total         float64
		AmountDue     float64
		AmountPaid    float64
		CreatedAt     time.Time
		DueDate       time.Time
	}
	
	err := db.QueryRowContext(ctx, `
		SELECT id, tenant_id, invoice_number, status, currency, subtotal, tax_amount, total, amount_due, amount_paid, created_at, due_date
		FROM invoices
		WHERE id = $1
	`, invoiceID).Scan(
		&inv.ID, &inv.TenantID, &inv.InvoiceNumber, &inv.Status, &inv.Currency,
		&inv.Subtotal, &inv.TaxAmount, &inv.Total, &inv.AmountDue, &inv.AmountPaid,
		&inv.CreatedAt, &inv.DueDate,
	)
	if err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(ctx, `
		SELECT id, description, amount, type
		FROM invoice_line_items
		WHERE invoice_id = $1
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lineItems []map[string]interface{}
	for rows.Next() {
		var itemID, desc, itemType string
		var amt float64
		if err := rows.Scan(&itemID, &desc, &amt, &itemType); err != nil {
			return nil, err
		}
		lineItems = append(lineItems, map[string]interface{}{
			"id":          itemID,
			"description": desc,
			"amount":      amt,
			"type":        itemType,
		})
	}

	return map[string]interface{}{
		"id":             inv.ID,
		"tenant_id":      inv.TenantID,
		"invoice_number": inv.InvoiceNumber,
		"status":         inv.Status,
		"currency":       inv.Currency,
		"subtotal":       inv.Subtotal,
		"tax_amount":     inv.TaxAmount,
		"total":          inv.Total,
		"amount_due":     inv.AmountDue,
		"amount_paid":    inv.AmountPaid,
		"created_at":     inv.CreatedAt,
		"due_date":       inv.DueDate,
		"line_items":     lineItems,
	}, nil
}

func loadTenantInvoices(ctx context.Context, db *sql.DB, tenantID string, limit int, offset int) ([]map[string]interface{}, int, error) {
	var totalCount int
	err := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1", tenantID).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	rows, err := db.QueryContext(ctx, `
		SELECT id, invoice_number, status, currency, total, amount_due, created_at, due_date
		FROM invoices
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var invoices []map[string]interface{}
	for rows.Next() {
		var id, invNum, status, currency string
		var total, amountDue float64
		var createdAt, dueDate time.Time
		if err := rows.Scan(&id, &invNum, &status, &currency, &total, &amountDue, &createdAt, &dueDate); err != nil {
			return nil, 0, err
		}
		invoices = append(invoices, map[string]interface{}{
			"id":             id,
			"invoice_number": invNum,
			"status":         status,
			"currency":       currency,
			"total":          total,
			"amount_due":     amountDue,
			"created_at":     createdAt,
			"due_date":       dueDate,
		})
	}

	return invoices, totalCount, nil
}

func markInvoicePaid(ctx context.Context, db *sql.DB, invoiceID string, transactionID string) error {
	_, err := db.ExecContext(ctx, `
		UPDATE invoices 
		SET status = 'paid', amount_paid = total, amount_due = 0, paid_at = NOW(), transaction_id = $1
		WHERE id = $2
	`, transactionID, invoiceID)
	return err
}

func cancelInvoice(ctx context.Context, db *sql.DB, invoiceID string, cancelledBy string) error {
	_, err := db.ExecContext(ctx, `
		UPDATE invoices 
		SET status = 'cancelled', updated_at = NOW()
		WHERE id = $1
	`, invoiceID)
	return err
}

func handleInvoiceGenerate(w http.ResponseWriter, r *http.Request) {
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

	var payload invoiceGeneratePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload")
		return
	}

	inv, err := generateInvoice(ctx, db, payload.TenantID, user.ID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "GENERATE_FAILED", "Failed to generate invoice")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"invoice": inv,
	})
}

func handleInvoiceList(w http.ResponseWriter, r *http.Request) {
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

	limit := 10
	offset := 0
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
		offset = o
	}

	invoices, total, err := loadTenantInvoices(ctx, db, tenantID, limit, offset)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "QUERY_FAILED", "Failed to load invoices")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"invoices": invoices,
		"total":    total,
	})
}

func handleInvoiceDetail(w http.ResponseWriter, r *http.Request) {
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

	// Assuming any authenticated user can view their invoice or superadmin can view any.
	// Using requireModuleUser for broad auth, checking access inside logic or assume handled.
	db, _, ok := requireModuleUser(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	invoiceID := r.URL.Query().Get("invoice_id")
	if invoiceID == "" {
		writeAPIError(w, http.StatusBadRequest, "MISSING_ID", "Missing invoice_id")
		return
	}

	inv, err := loadInvoice(ctx, db, invoiceID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "LOAD_FAILED", "Failed to load invoice")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"invoice": inv,
	})
}

func handleInvoiceCancel(w http.ResponseWriter, r *http.Request) {
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

	var payload invoiceCancelPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload")
		return
	}

	err := cancelInvoice(ctx, db, payload.InvoiceID, user.ID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "CANCEL_FAILED", "Failed to cancel invoice")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}

func handleClientBilling(w http.ResponseWriter, r *http.Request) {
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

	db, user, ok := requireModuleUser(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	tenantID := tenantIDFromUser(user)
	
	invoices, _, err := loadTenantInvoices(ctx, db, tenantID, 50, 0)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "QUERY_FAILED", "Failed to load invoices")
		return
	}

	var sub struct {
		PlanID       string  `json:"plan_id"`
		BillingCycle string  `json:"billing_cycle"`
		BaseAmount   float64 `json:"base_amount"`
	}
	_ = db.QueryRowContext(ctx, "SELECT plan_id, billing_cycle, plan_base_amount FROM tenant_subscriptions WHERE tenant_id = $1", tenantID).Scan(&sub.PlanID, &sub.BillingCycle, &sub.BaseAmount)

	var walletBalance float64
	_ = db.QueryRowContext(ctx, "SELECT balance FROM wallets WHERE tenant_id = $1", tenantID).Scan(&walletBalance)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"success":        true,
		"invoices":       invoices,
		"subscription":   sub,
		"wallet_balance": walletBalance,
	})
}
