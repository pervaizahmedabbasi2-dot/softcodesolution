package main

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	platform "scs-backend/backend/softcodesolution_platform"
	school "scs-backend/backend/school_business"
)

func registerPhase3PKGatewaysHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/pk-gateways/", handlePKGatewaysRouter)
}

var pkManageRoles = map[string]bool{
	"owner":        true,
	"admin":        true,
	"superadmin":   true,
	"client_admin": true,
	"manager":      true,
	"accountant":   true,
	"cashier":      true,
}

func md5Prefix(input string, length int) string {
	sum := md5.Sum([]byte(input))
	h := hex.EncodeToString(sum[:])
	if length > 0 && length < len(h) {
		return h[:length]
	}
	return h
}

func requirePKManageRole(w http.ResponseWriter, r *http.Request, bodyRole string) bool {
	role := resolveRoleFromReq(r, bodyRole, "owner")
	if !pkManageRoles[role] {
		writePhase3Error(w, http.StatusForbidden, "ROLE_FORBIDDEN", "Gateway management requires Owner, Manager, Accountant, or Cashier role.")
		return false
	}
	return true
}

func ensurePKGatewaysSeeded(db *sql.DB, tid string, businessKey string) {
	if db == nil {
		return
	}
	_ = platform.EnsureBusinessGatewaysSchema(db)

	var cnt int
	_ = db.QueryRow(
		`SELECT COUNT(*) FROM local_business_payment_gateways WHERE tenant_id = ? AND business_key = ?`,
		tid, businessKey,
	).Scan(&cnt)

	now := time.Now().UTC().Format(time.RFC3339)
	tidHash6 := md5Prefix(tid, 6)
	if cnt == 0 {
		defaults := platform.DefaultGatewaysForBusiness(businessKey)
		for _, gw := range defaults {
			gwID := fmt.Sprintf("bgw-%s-%s-%s", businessKey, gw.ProviderKey, tidHash6)
			_, _ = db.Exec(`
				INSERT OR IGNORE INTO local_business_payment_gateways (
					id, tenant_id, business_key, provider_key, display_name, category,
					account_title, account_number, iban, raast_id, bank_name, branch_code,
					till_id, biller_code, merchant_id, merchant_secret_enc, integrity_salt_enc,
					fee_type, fee_value, verification_mode, instructions,
					is_enabled, is_default, sort_order, is_synced, created_at, updated_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
			`,
				gwID, tid, businessKey, gw.ProviderKey, gw.DisplayName, gw.Category,
				gw.AccountTitle, gw.AccountNumber, gw.IBAN, gw.RaastID, gw.BankName, gw.BranchCode,
				gw.TillID, gw.BillerCode, gw.MerchantID, gw.FeeType, gw.FeeValue,
				gw.VerificationMode, gw.Instructions, boolToInt(gw.IsEnabled), boolToInt(gw.IsDefault),
				gw.SortOrder, now, now,
			)
		}
	}

	settingsID := fmt.Sprintf("bset-%s-%s", businessKey, md5Prefix(tid, 8))
	defBytes, _ := json.Marshal(platform.DefaultBusinessGatewaySettings(businessKey))
	_, _ = db.Exec(`
		INSERT OR IGNORE INTO local_business_gateway_settings (id, tenant_id, business_key, settings_json, is_synced, updated_at)
		VALUES (?, ?, ?, ?, 0, ?)
	`, settingsID, tid, businessKey, string(defBytes), now)
}

func loadPKGatewaySettings(db *sql.DB, tid string, businessKey string) platform.BusinessGatewaySettings {
	def := platform.DefaultBusinessGatewaySettings(businessKey)
	if db == nil {
		return def
	}
	ensurePKGatewaysSeeded(db, tid, businessKey)
	var settingsJSON sql.NullString
	err := db.QueryRow(
		`SELECT settings_json FROM local_business_gateway_settings WHERE tenant_id = ? AND business_key = ? LIMIT 1`,
		tid, businessKey,
	).Scan(&settingsJSON)
	if err == nil && settingsJSON.Valid && settingsJSON.String != "" {
		_ = json.Unmarshal([]byte(settingsJSON.String), &def)
		def.BusinessKey = businessKey
	}
	return def
}

type pkGatewayDBRow struct {
	id                string
	tenantID          sql.NullString
	businessKey       string
	providerKey       string
	displayName       string
	category          string
	accountTitle      sql.NullString
	accountNumber     sql.NullString
	iban              sql.NullString
	raastID           sql.NullString
	bankName          sql.NullString
	branchCode        sql.NullString
	tillID            sql.NullString
	billerCode        sql.NullString
	merchantID        sql.NullString
	merchantSecretEnc sql.NullString
	integritySaltEnc  sql.NullString
	feeType           sql.NullString
	feeValue          sql.NullFloat64
	verificationMode  sql.NullString
	instructions      sql.NullString
	isEnabled         sql.NullInt64
	isDefault         sql.NullInt64
	sortOrder         sql.NullInt64
	createdAt         sql.NullString
	updatedAt         sql.NullString
}

func scanPKGatewayRow(scanner interface{ Scan(...interface{}) error }) (pkGatewayDBRow, error) {
	var r pkGatewayDBRow
	err := scanner.Scan(
		&r.id, &r.tenantID, &r.businessKey, &r.providerKey, &r.displayName, &r.category,
		&r.accountTitle, &r.accountNumber, &r.iban, &r.raastID, &r.bankName, &r.branchCode,
		&r.tillID, &r.billerCode, &r.merchantID, &r.merchantSecretEnc, &r.integritySaltEnc,
		&r.feeType, &r.feeValue, &r.verificationMode, &r.instructions,
		&r.isEnabled, &r.isDefault, &r.sortOrder, &r.createdAt, &r.updatedAt,
	)
	return r, err
}

const pkGatewaySelectCols = `
	id, tenant_id, business_key, provider_key, display_name, category,
	account_title, account_number, iban, raast_id, bank_name, branch_code,
	till_id, biller_code, merchant_id, merchant_secret_enc, integrity_salt_enc,
	fee_type, fee_value, verification_mode, instructions,
	is_enabled, is_default, sort_order, created_at, updated_at
`

func mapPKGatewayRow(db *sql.DB, r pkGatewayDBRow, tid string) platform.BusinessGateway {
	rawSecret := ""
	if nullStrVal(r.merchantSecretEnc) != "" {
		rawSecret = vaultDecryptField(db, tid, nullStrVal(r.merchantSecretEnc))
	}
	rawSalt := ""
	if nullStrVal(r.integritySaltEnc) != "" {
		rawSalt = vaultDecryptField(db, tid, nullStrVal(r.integritySaltEnc))
	}
	feeType := nullStrVal(r.feeType)
	if feeType == "" {
		feeType = "none"
	}
	verMode := nullStrVal(r.verificationMode)
	if verMode == "" {
		verMode = "slip_review"
	}
	rowTid := nullStrVal(r.tenantID)
	if rowTid == "" {
		rowTid = tid
	}
	updatedAt := nullStrVal(r.updatedAt)
	if updatedAt == "" {
		updatedAt = nullStrVal(r.createdAt)
	}
	return platform.BusinessGateway{
		ID:                 r.id,
		TenantID:           rowTid,
		BusinessKey:        r.businessKey,
		ProviderKey:        r.providerKey,
		DisplayName:        r.displayName,
		Category:           r.category,
		AccountTitle:       nullStrVal(r.accountTitle),
		AccountNumber:      nullStrVal(r.accountNumber),
		IBAN:               nullStrVal(r.iban),
		RaastID:            nullStrVal(r.raastID),
		BankName:           nullStrVal(r.bankName),
		BranchCode:         nullStrVal(r.branchCode),
		TillID:             nullStrVal(r.tillID),
		BillerCode:         nullStrVal(r.billerCode),
		MerchantID:         nullStrVal(r.merchantID),
		HasMerchantSecret:  rawSecret != "",
		HasIntegritySalt:   rawSalt != "",
		MerchantSecretHint: maskSecretTail(rawSecret),
		IntegritySaltHint:  maskSecretTail(rawSalt),
		FeeType:            feeType,
		FeeValue:           nullFloatVal(r.feeValue, 0),
		VerificationMode:   verMode,
		Instructions:       nullStrVal(r.instructions),
		IsEnabled:          nullIntVal(r.isEnabled, 1) == 1,
		IsDefault:          nullIntVal(r.isDefault, 0) == 1,
		SortOrder:          int(nullIntVal(r.sortOrder, 10)),
		UpdatedAt:          updatedAt,
	}
}

const pkTxnSelectCols = `
	id, tenant_id, business_key, txn_ref, invoice_no, gateway_id, gateway_name, provider_key,
	payer_name, payer_ref, payer_phone, base_amount, gateway_fee, total_amount, currency,
	status, proof_reference, proof_notes, proof_screenshot, verified_by, verified_at, created_at
`

func scanAndMapPKTxn(db *sql.DB, scanner interface{ Scan(...interface{}) error }, tid string) (platform.BusinessGatewayTransaction, error) {
	var (
		id, rowTid, bizKey, txnRef, invoiceNo, gwID, gwName, provKey sql.NullString
		payerName, payerRef, payerPhone, currency, status            sql.NullString
		proofRef, proofNotes, proofShot, verifiedBy, verifiedAt, cat sql.NullString
		baseAmt, gwFee, totalAmt                                     sql.NullFloat64
	)
	err := scanner.Scan(
		&id, &rowTid, &bizKey, &txnRef, &invoiceNo, &gwID, &gwName, &provKey,
		&payerName, &payerRef, &payerPhone, &baseAmt, &gwFee, &totalAmt, &currency,
		&status, &proofRef, &proofNotes, &proofShot, &verifiedBy, &verifiedAt, &cat,
	)
	if err != nil {
		return platform.BusinessGatewayTransaction{}, err
	}
	resolvedTid := nullStrVal(rowTid)
	if resolvedTid == "" {
		resolvedTid = tid
	}
	cur := nullStrVal(currency)
	if cur == "" {
		cur = "PKR"
	}
	st := nullStrVal(status)
	if st == "" {
		st = "PENDING_VERIFICATION"
	}
	shot := nullStrVal(proofShot)
	return platform.BusinessGatewayTransaction{
		ID:                 nullStrVal(id),
		TenantID:           resolvedTid,
		BusinessKey:        nullStrVal(bizKey),
		TxnRef:             nullStrVal(txnRef),
		InvoiceNo:          nullStrVal(invoiceNo),
		GatewayID:          nullStrVal(gwID),
		GatewayName:        nullStrVal(gwName),
		ProviderKey:        nullStrVal(provKey),
		PayerName:          vaultDecryptField(db, tid, nullStrVal(payerName)),
		PayerRef:           vaultDecryptField(db, tid, nullStrVal(payerRef)),
		PayerPhone:         vaultDecryptField(db, tid, nullStrVal(payerPhone)),
		BaseAmount:         nullFloatVal(baseAmt, 0),
		GatewayFee:         nullFloatVal(gwFee, 0),
		TotalAmount:        nullFloatVal(totalAmt, 0),
		Currency:           cur,
		Status:             st,
		ProofReference:     nullStrVal(proofRef),
		ProofNotes:         nullStrVal(proofNotes),
		ProofScreenshot:    shot,
		HasProofScreenshot: shot != "",
		VerifiedBy:         nullStrVal(verifiedBy),
		VerifiedAt:         nullStrVal(verifiedAt),
		CreatedAt:          nullStrVal(cat),
	}, nil
}

func handlePKGatewaysRouter(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}

	rel := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/pk-gateways/"), "/")
	if rel == "" {
		writePhase3Error(w, http.StatusNotFound, "NOT_FOUND", "Business key is required.")
		return
	}
	parts := strings.Split(rel, "/")
	businessKey := platform.NormalizeBusinessKey(parts[0])
	sub := parts[1:]

	if len(sub) == 1 && sub[0] == "gateways" {
		switch r.Method {
		case http.MethodGet:
			handlePKGetGateways(w, r, businessKey)
		case http.MethodPost:
			handlePKCreateGateway(w, r, businessKey)
		default:
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed.")
		}
		return
	}

	if len(sub) == 2 && sub[0] == "gateways" {
		gwID := sub[1]
		switch r.Method {
		case http.MethodPut:
			handlePKUpdateGateway(w, r, businessKey, gwID)
		case http.MethodDelete:
			handlePKDeleteGateway(w, r, businessKey, gwID)
		default:
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed.")
		}
		return
	}

	if len(sub) == 1 && sub[0] == "settings" {
		if r.Method != http.MethodPut {
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only PUT is allowed.")
			return
		}
		handlePKUpdateSettings(w, r, businessKey)
		return
	}

	if len(sub) == 1 && sub[0] == "transactions" {
		switch r.Method {
		case http.MethodGet:
			handlePKGetTransactions(w, r, businessKey)
		case http.MethodPost:
			handlePKCreateTransaction(w, r, businessKey)
		default:
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed.")
		}
		return
	}

	if len(sub) == 3 && sub[0] == "transactions" && sub[2] == "verify" {
		if r.Method != http.MethodPut {
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only PUT is allowed.")
			return
		}
		handlePKVerifyTransaction(w, r, businessKey, sub[1])
		return
	}

	writePhase3Error(w, http.StatusNotFound, "NOT_FOUND", "Unknown PK gateway endpoint.")
}

func handlePKGetGateways(w http.ResponseWriter, r *http.Request, businessKey string) {
	tid := resolveTenantIDFromReq(r, "")
	includeDisabled := r.URL.Query().Get("includeDisabled") == "1"

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		settings := platform.DefaultBusinessGatewaySettings(businessKey)
		defaults := platform.DefaultGatewaysForBusiness(businessKey)
		for i := range defaults {
			defaults[i].ID = fmt.Sprintf("bgw-mem-%s-%d", businessKey, i)
			defaults[i].TenantID = tid
			defaults[i].BusinessKey = businessKey
		}
		writeAPIJSON(w, http.StatusOK, map[string]interface{}{
			"ok":          true,
			"tenantId":    tid,
			"businessKey": businessKey,
			"gateways":    defaults,
			"settings":    settings,
		})
		return
	}
	defer db.Close()

	ensurePKGatewaysSeeded(db, tid, businessKey)
	settings := loadPKGatewaySettings(db, tid, businessKey)

	rows, err := db.Query(
		`SELECT `+pkGatewaySelectCols+` FROM local_business_payment_gateways WHERE tenant_id = ? AND business_key = ? ORDER BY sort_order ASC, created_at ASC`,
		tid, businessKey,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load gateways.")
		return
	}
	defer rows.Close()

	gateways := make([]platform.BusinessGateway, 0)
	for rows.Next() {
		rRow, scanErr := scanPKGatewayRow(rows)
		if scanErr != nil {
			continue
		}
		if !includeDisabled && nullIntVal(rRow.isEnabled, 1) == 0 {
			continue
		}
		gateways = append(gateways, mapPKGatewayRow(db, rRow, tid))
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":          true,
		"tenantId":    tid,
		"businessKey": businessKey,
		"gateways":    gateways,
		"settings":    settings,
	})
}

type pkCreateGatewayReq struct {
	TenantID         string   `json:"tenantId"`
	UserRole         string   `json:"userRole"`
	DisplayName      string   `json:"displayName"`
	ProviderKey      string   `json:"providerKey"`
	Category         string   `json:"category"`
	AccountTitle     string   `json:"accountTitle"`
	AccountNumber    string   `json:"accountNumber"`
	IBAN             string   `json:"iban"`
	RaastID          string   `json:"raastId"`
	BankName         string   `json:"bankName"`
	BranchCode       string   `json:"branchCode"`
	TillID           string   `json:"tillId"`
	BillerCode       string   `json:"billerCode"`
	MerchantID       string   `json:"merchantId"`
	MerchantSecret   string   `json:"merchantSecret"`
	IntegritySalt    string   `json:"integritySalt"`
	FeeType          string   `json:"feeType"`
	FeeValue         float64  `json:"feeValue"`
	VerificationMode string   `json:"verificationMode"`
	Instructions     string   `json:"instructions"`
	IsEnabled        *bool    `json:"isEnabled"`
	IsDefault        bool     `json:"isDefault"`
	SortOrder        *int     `json:"sortOrder"`
}

func handlePKCreateGateway(w http.ResponseWriter, r *http.Request, businessKey string) {
	var body pkCreateGatewayReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	if !requirePKManageRole(w, r, body.UserRole) {
		return
	}
	tid := resolveTenantIDFromReq(r, body.TenantID)

	displayName := strings.TrimSpace(body.DisplayName)
	if displayName == "" {
		writePhase3Error(w, http.StatusBadRequest, "", "Gateway displayName is required.")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()

	ensurePKGatewaysSeeded(db, tid, businessKey)

	rawKey := platform.SanitizeProviderKey(body.ProviderKey)
	if rawKey == "" {
		rawKey = platform.SanitizeProviderKey(displayName)
	}
	suffix36 := strconv.FormatInt(time.Now().UnixMilli(), 36)
	if len(suffix36) > 3 {
		suffix36 = suffix36[len(suffix36)-3:]
	}
	providerKey := "custom_" + suffix36
	if rawKey != "" {
		providerKey = rawKey + "_" + suffix36
	}

	feeType := "none"
	if body.FeeType == "percent" || body.FeeType == "fixed" {
		feeType = body.FeeType
	}
	if math.IsNaN(body.FeeValue) || math.IsInf(body.FeeValue, 0) {
		writePhase3Error(w, http.StatusBadRequest, "", "Fee value must be a valid non-negative number.")
		return
	}
	feeValue := math.Max(0, body.FeeValue)
	category := strings.TrimSpace(body.Category)
	if category == "" {
		category = "bank_transfer"
	}
	verMode := strings.TrimSpace(body.VerificationMode)
	if verMode == "" {
		verMode = "slip_review"
	}
	isEnabled := true
	if body.IsEnabled != nil {
		isEnabled = *body.IsEnabled
	}
	sortOrder := 20
	if body.SortOrder != nil && *body.SortOrder != 0 {
		sortOrder = *body.SortOrder
	}

	gwID := fmt.Sprintf("bgw-%s-%s", businessKey, randomHexToken(4))
	now := time.Now().UTC().Format(time.RFC3339)

	if body.IsDefault {
		_, _ = db.Exec(`UPDATE local_business_payment_gateways SET is_default = 0 WHERE tenant_id = ? AND business_key = ?`, tid, businessKey)
	}

	secretEnc := ""
	if body.MerchantSecret != "" {
		secretEnc = vaultEncryptField(db, tid, body.MerchantSecret)
	}
	saltEnc := ""
	if body.IntegritySalt != "" {
		saltEnc = vaultEncryptField(db, tid, body.IntegritySalt)
	}

	_, err = db.Exec(`
		INSERT INTO local_business_payment_gateways (
			id, tenant_id, business_key, provider_key, display_name, category,
			account_title, account_number, iban, raast_id, bank_name, branch_code,
			till_id, biller_code, merchant_id, merchant_secret_enc, integrity_salt_enc,
			fee_type, fee_value, verification_mode, instructions,
			is_enabled, is_default, sort_order, is_synced, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
	`,
		gwID, tid, businessKey, providerKey, displayName, category,
		body.AccountTitle, body.AccountNumber, body.IBAN, body.RaastID, body.BankName, body.BranchCode,
		body.TillID, body.BillerCode, body.MerchantID, secretEnc, saltEnc,
		feeType, feeValue, verMode, body.Instructions,
		boolToInt(isEnabled), boolToInt(body.IsDefault), sortOrder, now, now,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create gateway.")
		return
	}

	row, scanErr := scanPKGatewayRow(db.QueryRow(`SELECT `+pkGatewaySelectCols+` FROM local_business_payment_gateways WHERE id = ?`, gwID))
	if scanErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load created gateway.")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"gateway": mapPKGatewayRow(db, row, tid),
	})
}

type pkUpdateGatewayReq struct {
	TenantID         string   `json:"tenantId"`
	UserRole         string   `json:"userRole"`
	DisplayName      *string  `json:"displayName"`
	Category         *string  `json:"category"`
	AccountTitle     *string  `json:"accountTitle"`
	AccountNumber    *string  `json:"accountNumber"`
	IBAN             *string  `json:"iban"`
	RaastID          *string  `json:"raastId"`
	BankName         *string  `json:"bankName"`
	BranchCode       *string  `json:"branchCode"`
	TillID           *string  `json:"tillId"`
	BillerCode       *string  `json:"billerCode"`
	MerchantID       *string  `json:"merchantId"`
	MerchantSecret   string   `json:"merchantSecret"`
	IntegritySalt    string   `json:"integritySalt"`
	FeeType          *string  `json:"feeType"`
	FeeValue         *float64 `json:"feeValue"`
	VerificationMode *string  `json:"verificationMode"`
	Instructions     *string  `json:"instructions"`
	IsEnabled        *bool    `json:"isEnabled"`
	IsDefault        *bool    `json:"isDefault"`
}

func handlePKUpdateGateway(w http.ResponseWriter, r *http.Request, businessKey string, gwID string) {
	var body pkUpdateGatewayReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	if !requirePKManageRole(w, r, body.UserRole) {
		return
	}
	tid := resolveTenantIDFromReq(r, body.TenantID)

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()
	ensurePKGatewaysSeeded(db, tid, businessKey)

	existing, scanErr := scanPKGatewayRow(db.QueryRow(
		`SELECT `+pkGatewaySelectCols+` FROM local_business_payment_gateways WHERE id = ? AND tenant_id = ? AND business_key = ?`,
		gwID, tid, businessKey,
	))
	if scanErr == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Gateway not found.")
		return
	}
	if scanErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load gateway.")
		return
	}

	if body.IsDefault != nil && *body.IsDefault {
		_, _ = db.Exec(`UPDATE local_business_payment_gateways SET is_default = 0 WHERE tenant_id = ? AND business_key = ?`, tid, businessKey)
	}

	pickStr := func(p *string, fallback string) string {
		if p != nil {
			return *p
		}
		return fallback
	}

	secretEnc := nullStrVal(existing.merchantSecretEnc)
	if s := strings.TrimSpace(body.MerchantSecret); s != "" && !strings.HasPrefix(s, "••••") {
		secretEnc = vaultEncryptField(db, tid, s)
	}
	saltEnc := nullStrVal(existing.integritySaltEnc)
	if s := strings.TrimSpace(body.IntegritySalt); s != "" && !strings.HasPrefix(s, "••••") {
		saltEnc = vaultEncryptField(db, tid, s)
	}

	feeType := nullStrVal(existing.feeType)
	if body.FeeType != nil {
		feeType = *body.FeeType
	}
	if feeType != "none" && feeType != "percent" && feeType != "fixed" {
		feeType = "none"
	}
	feeValue := nullFloatVal(existing.feeValue, 0)
	if body.FeeValue != nil {
		if math.IsNaN(*body.FeeValue) || math.IsInf(*body.FeeValue, 0) {
			writePhase3Error(w, http.StatusBadRequest, "", "Fee value must be a valid non-negative number.")
			return
		}
		feeValue = math.Max(0, *body.FeeValue)
	}

	isEnabled := nullIntVal(existing.isEnabled, 1)
	if body.IsEnabled != nil {
		isEnabled = int64(boolToInt(*body.IsEnabled))
	}
	isDefault := nullIntVal(existing.isDefault, 0)
	if body.IsDefault != nil {
		isDefault = int64(boolToInt(*body.IsDefault))
	}
	now := time.Now().UTC().Format(time.RFC3339)

	_, err = db.Exec(`
		UPDATE local_business_payment_gateways
		SET display_name = ?, category = ?, account_title = ?, account_number = ?, iban = ?,
		    raast_id = ?, bank_name = ?, branch_code = ?, till_id = ?, biller_code = ?,
		    merchant_id = ?, merchant_secret_enc = ?, integrity_salt_enc = ?,
		    fee_type = ?, fee_value = ?, verification_mode = ?, instructions = ?,
		    is_enabled = ?, is_default = ?, is_synced = 0, updated_at = ?
		WHERE id = ? AND tenant_id = ? AND business_key = ?
	`,
		pickStr(body.DisplayName, existing.displayName),
		pickStr(body.Category, existing.category),
		pickStr(body.AccountTitle, nullStrVal(existing.accountTitle)),
		pickStr(body.AccountNumber, nullStrVal(existing.accountNumber)),
		pickStr(body.IBAN, nullStrVal(existing.iban)),
		pickStr(body.RaastID, nullStrVal(existing.raastID)),
		pickStr(body.BankName, nullStrVal(existing.bankName)),
		pickStr(body.BranchCode, nullStrVal(existing.branchCode)),
		pickStr(body.TillID, nullStrVal(existing.tillID)),
		pickStr(body.BillerCode, nullStrVal(existing.billerCode)),
		pickStr(body.MerchantID, nullStrVal(existing.merchantID)),
		secretEnc, saltEnc, feeType, feeValue,
		pickStr(body.VerificationMode, nullStrVal(existing.verificationMode)),
		pickStr(body.Instructions, nullStrVal(existing.instructions)),
		isEnabled, isDefault, now, gwID, tid, businessKey,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update gateway.")
		return
	}

	updated, err := scanPKGatewayRow(db.QueryRow(`SELECT `+pkGatewaySelectCols+` FROM local_business_payment_gateways WHERE id = ?`, gwID))
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to reload gateway.")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"gateway": mapPKGatewayRow(db, updated, tid),
	})
}

func handlePKDeleteGateway(w http.ResponseWriter, r *http.Request, businessKey string, gwID string) {
	if !requirePKManageRole(w, r, "") {
		return
	}
	tid := resolveTenantIDFromReq(r, "")

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()
	ensurePKGatewaysSeeded(db, tid, businessKey)

	res, err := db.Exec(`DELETE FROM local_business_payment_gateways WHERE id = ? AND tenant_id = ? AND business_key = ?`, gwID, tid, businessKey)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to delete gateway.")
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		writePhase3Error(w, http.StatusNotFound, "", "Gateway not found.")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":        true,
		"deletedId": gwID,
	})
}

type pkUpdateSettingsReq struct {
	TenantID               string  `json:"tenantId"`
	UserRole               string  `json:"userRole"`
	RequireProofReference  *bool   `json:"requireProofReference"`
	AutoVerifyDigitalSlips *bool   `json:"autoVerifyDigitalSlips"`
	AllowClientSelfPay     *bool   `json:"allowClientSelfPay"`
	DefaultCurrency        *string `json:"defaultCurrency"`
	ReceiptFooterNote      *string `json:"receiptFooterNote"`
}

func handlePKUpdateSettings(w http.ResponseWriter, r *http.Request, businessKey string) {
	var body pkUpdateSettingsReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	if !requirePKManageRole(w, r, body.UserRole) {
		return
	}
	tid := resolveTenantIDFromReq(r, body.TenantID)

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()

	current := loadPKGatewaySettings(db, tid, businessKey)
	if body.RequireProofReference != nil {
		current.RequireProofReference = *body.RequireProofReference
	}
	if body.AutoVerifyDigitalSlips != nil {
		current.AutoVerifyDigitalSlips = *body.AutoVerifyDigitalSlips
	}
	if body.AllowClientSelfPay != nil {
		current.AllowClientSelfPay = *body.AllowClientSelfPay
	}
	if body.DefaultCurrency != nil && strings.TrimSpace(*body.DefaultCurrency) != "" {
		current.DefaultCurrency = strings.TrimSpace(*body.DefaultCurrency)
	}
	if body.ReceiptFooterNote != nil {
		current.ReceiptFooterNote = *body.ReceiptFooterNote
	}

	encoded, _ := json.Marshal(current)
	settingsID := fmt.Sprintf("bset-%s-%s", businessKey, md5Prefix(tid, 8))
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = db.Exec(`
		INSERT INTO local_business_gateway_settings (id, tenant_id, business_key, settings_json, is_synced, updated_at)
		VALUES (?, ?, ?, ?, 0, ?)
		ON CONFLICT(tenant_id, business_key) DO UPDATE SET
			settings_json = excluded.settings_json,
			is_synced = 0,
			updated_at = excluded.updated_at
	`, settingsID, tid, businessKey, string(encoded), now)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to save settings.")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":       true,
		"settings": current,
	})
}

func handlePKGetTransactions(w http.ResponseWriter, r *http.Request, businessKey string) {
	tid := resolveTenantIDFromReq(r, "")
	limit := 80
	if rawLim := strings.TrimSpace(r.URL.Query().Get("limit")); rawLim != "" {
		if parsed, err := strconv.Atoi(rawLim); err == nil {
			if parsed < 10 {
				parsed = 10
			} else if parsed > 200 {
				parsed = 200
			}
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writeAPIJSON(w, http.StatusOK, map[string]interface{}{
			"ok":           true,
			"transactions": []platform.BusinessGatewayTransaction{},
		})
		return
	}
	defer db.Close()
	_ = platform.EnsureBusinessGatewaysSchema(db)

	rows, err := db.Query(
		`SELECT `+pkTxnSelectCols+` FROM local_business_payment_transactions WHERE tenant_id = ? AND business_key = ? ORDER BY created_at DESC LIMIT ?`,
		tid, businessKey, limit,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load transactions.")
		return
	}
	defer rows.Close()

	txns := make([]platform.BusinessGatewayTransaction, 0)
	for rows.Next() {
		if t, scanErr := scanAndMapPKTxn(db, rows, tid); scanErr == nil {
			txns = append(txns, t)
		}
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":           true,
		"tenantId":     tid,
		"businessKey":  businessKey,
		"transactions": txns,
	})
}

type pkCreateTxnReq struct {
	TenantID        string   `json:"tenantId"`
	GatewayID       string   `json:"gatewayId"`
	PayerName       string   `json:"payerName"`
	PayerRef        string   `json:"payerRef"`
	PayerPhone      string   `json:"payerPhone"`
	BaseAmount      *float64 `json:"baseAmount"`
	Amount          *float64 `json:"amount"`
	InvoiceNo       string   `json:"invoiceNo"`
	ProofReference  string   `json:"proofReference"`
	ProofNotes      string   `json:"proofNotes"`
	ProofScreenshot string   `json:"proofScreenshot"`
	AllowDuplicate  bool     `json:"allowDuplicate"`
	MarkVerified    bool     `json:"markVerified"`
	VerifiedBy      string   `json:"verifiedBy"`
}

func handlePKCreateTransaction(w http.ResponseWriter, r *http.Request, businessKey string) {
	var body pkCreateTxnReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	tid := resolveTenantIDFromReq(r, body.TenantID)

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()

	ensurePKGatewaysSeeded(db, tid, businessKey)
	settings := loadPKGatewaySettings(db, tid, businessKey)

	gwID := strings.TrimSpace(body.GatewayID)
	var gwRow pkGatewayDBRow
	var gwErr error
	if gwID != "" {
		gwErr = func() error {
			var scanErr error
			gwRow, scanErr = scanPKGatewayRow(db.QueryRow(
				`SELECT `+pkGatewaySelectCols+` FROM local_business_payment_gateways WHERE id = ? AND tenant_id = ? AND business_key = ? LIMIT 1`,
				gwID, tid, businessKey,
			))
			return scanErr
		}()
	} else {
		gwErr = func() error {
			var scanErr error
			gwRow, scanErr = scanPKGatewayRow(db.QueryRow(
				`SELECT `+pkGatewaySelectCols+` FROM local_business_payment_gateways WHERE tenant_id = ? AND business_key = ? AND is_enabled = 1 ORDER BY is_default DESC, sort_order ASC LIMIT 1`,
				tid, businessKey,
			))
			return scanErr
		}()
	}
	if gwErr == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Selected gateway not found.")
		return
	}
	if gwErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load selected gateway.")
		return
	}
	if nullIntVal(gwRow.isEnabled, 1) == 0 {
		writePhase3Error(w, http.StatusBadRequest, "", fmt.Sprintf("%s is currently disabled.", gwRow.displayName))
		return
	}

	payerName := strings.TrimSpace(body.PayerName)
	baseAmount := 0.0
	if body.BaseAmount != nil {
		baseAmount = *body.BaseAmount
	} else if body.Amount != nil {
		baseAmount = *body.Amount
	}
	if payerName == "" || math.IsNaN(baseAmount) || math.IsInf(baseAmount, 0) || baseAmount <= 0 {
		writePhase3Error(w, http.StatusBadRequest, "", "Valid payerName and positive baseAmount are required.")
		return
	}

	proofRef := strings.TrimSpace(body.ProofReference)
	if settings.RequireProofReference && nullStrVal(gwRow.verificationMode) == "slip_review" && proofRef == "" && !body.MarkVerified {
		writePhase3Error(w, http.StatusBadRequest, "", "Slip / TID Reference is required by gateway policy.")
		return
	}

	normalizedShot, shotErr := school.ValidateProofScreenshot(body.ProofScreenshot)
	if shotErr != "" {
		msg := shotErr
		if strings.Contains(shotErr, "too large") {
			msg = "Payment slip screenshot is too large (max ~480KB compressed)."
		}
		writePhase3Error(w, http.StatusBadRequest, "", msg)
		return
	}

	bPrefix := strings.ToUpper(businessKey)
	if len(bPrefix) > 3 {
		bPrefix = bPrefix[:3]
	}
	invoiceNo := strings.TrimSpace(body.InvoiceNo)
	if invoiceNo == "" {
		ts := fmt.Sprintf("%d", time.Now().UnixMilli())
		if len(ts) > 5 {
			ts = ts[len(ts)-5:]
		}
		invoiceNo = fmt.Sprintf("INV-%s-%s", bPrefix, ts)
	}

	if !body.AllowDuplicate {
		var paidRef string
		errPaid := db.QueryRow(`
			SELECT txn_ref FROM local_business_payment_transactions
			WHERE tenant_id = ? AND business_key = ? AND invoice_no = ? AND UPPER(status) IN ('VERIFIED', 'SETTLED')
			LIMIT 1
		`, tid, businessKey, invoiceNo).Scan(&paidRef)
		if errPaid == nil {
			writePhase3Error(w, http.StatusConflict, "INVOICE_ALREADY_PAID", fmt.Sprintf("Invoice #%s is already verified & settled (%s).", invoiceNo, paidRef))
			return
		}

		var pendRef string
		errPend := db.QueryRow(`
			SELECT txn_ref FROM local_business_payment_transactions
			WHERE tenant_id = ? AND business_key = ? AND invoice_no = ? AND UPPER(status) = 'PENDING_VERIFICATION'
			LIMIT 1
		`, tid, businessKey, invoiceNo).Scan(&pendRef)
		if errPend == nil {
			writePhase3Error(w, http.StatusConflict, "PENDING_SLIP_EXISTS", fmt.Sprintf("A deposit slip (%s) for Invoice #%s is already awaiting verification.", pendRef, invoiceNo))
			return
		}
	}

	gatewayFee := platform.CalculateBusinessGatewayFee(nullStrVal(gwRow.feeType), nullFloatVal(gwRow.feeValue, 0), baseAmount)
	totalAmount := baseAmount + gatewayFee

	autoVerify := body.MarkVerified || settings.AutoVerifyDigitalSlips
	status := "PENDING_VERIFICATION"
	verifiedBy := ""
	verifiedAt := ""
	now := time.Now().UTC().Format(time.RFC3339)
	if autoVerify {
		status = "VERIFIED"
		verifiedBy = strings.TrimSpace(body.VerifiedBy)
		if verifiedBy == "" {
			verifiedBy = "Counter Cashier"
		}
		verifiedAt = now
	}

	txnID := "btxn-" + randomHexToken(5)
	txnRef := fmt.Sprintf("PK-%s-%s", bPrefix, strings.ToUpper(randomHexToken(3)))
	currency := settings.DefaultCurrency
	if currency == "" {
		currency = "PKR"
	}

	_, err = db.Exec(`
		INSERT INTO local_business_payment_transactions (
			id, tenant_id, business_key, txn_ref, invoice_no, gateway_id, gateway_name, provider_key,
			payer_name, payer_ref, payer_phone, base_amount, gateway_fee, total_amount, currency,
			status, proof_reference, proof_notes, proof_screenshot, verified_by, verified_at, is_synced, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
	`,
		txnID, tid, businessKey, txnRef, invoiceNo, gwRow.id, gwRow.displayName, gwRow.providerKey,
		vaultEncryptField(db, tid, payerName),
		vaultEncryptField(db, tid, body.PayerRef),
		vaultEncryptField(db, tid, body.PayerPhone),
		baseAmount, gatewayFee, totalAmount, currency,
		status, proofRef, body.ProofNotes, normalizedShot, verifiedBy, verifiedAt, now,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to record transaction.")
		return
	}

	mapped, err := scanAndMapPKTxn(db, db.QueryRow(`SELECT `+pkTxnSelectCols+` FROM local_business_payment_transactions WHERE id = ?`, txnID), tid)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load recorded transaction.")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":          true,
		"transaction": mapped,
	})
}

type pkVerifyTxnReq struct {
	TenantID   string `json:"tenantId"`
	UserRole   string `json:"userRole"`
	Status     string `json:"status"`
	VerifiedBy string `json:"verifiedBy"`
}

func handlePKVerifyTransaction(w http.ResponseWriter, r *http.Request, businessKey string, txnID string) {
	var body pkVerifyTxnReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil && err.Error() != "EOF" {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	if !requirePKManageRole(w, r, body.UserRole) {
		return
	}
	tid := resolveTenantIDFromReq(r, body.TenantID)

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()
	_ = platform.EnsureBusinessGatewaysSchema(db)

	var existsID string
	err = db.QueryRow(
		`SELECT id FROM local_business_payment_transactions WHERE id = ? AND tenant_id = ? AND business_key = ? LIMIT 1`,
		txnID, tid, businessKey,
	).Scan(&existsID)
	if err == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Transaction not found.")
		return
	}
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to lookup transaction.")
		return
	}

	nextStatus := strings.ToUpper(strings.TrimSpace(body.Status))
	if nextStatus != "VERIFIED" && nextStatus != "SETTLED" && nextStatus != "REJECTED" {
		nextStatus = "VERIFIED"
	}
	verifiedBy := strings.TrimSpace(body.VerifiedBy)
	if verifiedBy == "" {
		verifiedBy = "Owner / Cashier Desk"
	}
	now := time.Now().UTC().Format(time.RFC3339)

	_, err = db.Exec(`
		UPDATE local_business_payment_transactions
		SET status = ?, verified_by = ?, verified_at = ?, is_synced = 0
		WHERE id = ? AND tenant_id = ? AND business_key = ?
	`, nextStatus, verifiedBy, now, txnID, tid, businessKey)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to verify transaction.")
		return
	}

	mapped, err := scanAndMapPKTxn(db, db.QueryRow(`SELECT `+pkTxnSelectCols+` FROM local_business_payment_transactions WHERE id = ?`, txnID), tid)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load updated transaction.")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":          true,
		"transaction": mapped,
	})
}
