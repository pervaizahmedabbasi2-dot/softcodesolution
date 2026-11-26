package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"regexp"
	"strings"
	"time"

	school "scs-backend/backend/school_business"
)

func registerPhase3SchoolHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/school/payment-gateways", handleSchoolPaymentGatewaysCollection)
	mux.HandleFunc("/api/school/payment-gateways/", handleSchoolPaymentGatewayItem)
	mux.HandleFunc("/api/school/payment-gateways-settings", handleSchoolPaymentGatewaySettings)
	mux.HandleFunc("/api/school/payment-transactions", handleSchoolPaymentTransactionsCollection)
	mux.HandleFunc("/api/school/payment-transactions/", handleSchoolPaymentTransactionItem)
	mux.HandleFunc("/api/school/barcode-lookup", handleSchoolBarcodeLookup)
}

var schoolOwnerRoles = map[string]bool{
	"owner":        true,
	"super_admin":  true,
	"client_admin": true,
	"admin":        true,
}

var (
	schoolStrippedRollRe = regexp.MustCompile(`(?i)^(?:ch|chln|stu|st|adm|roll)[-_]?(?:\d{4}[-_])?(.+)$`)
	schoolExplicitEmpRe  = regexp.MustCompile(`(?i)^emp[-_]`)
)

type schoolScope struct {
	ErrorStatus    int
	ErrorCode      string
	ErrorMessage   string
	IsOwner        bool
	IsBranchLocked bool
	IsWingLocked   bool
	AssignedBranch string
	AssignedWing   string
	BranchFilter   string
	WingFilter     string
	WriteBranchID  string
	WriteWingID    string
}

func resolveSchoolUserRole(r *http.Request) string {
	return strings.ToLower(strings.TrimSpace(r.Header.Get("X-User-Role")))
}

func resolveSchoolTenantID(r *http.Request, bodyTenantID string) string {
	candidates := []string{
		r.Header.Get("X-Tenant-Id"),
		r.URL.Query().Get("tenantId"),
		bodyTenantID,
	}
	for _, c := range candidates {
		if t := strings.TrimSpace(c); t != "" {
			return t
		}
	}
	return school.RootTenantID
}

func normalizeSchoolScopeVal(raw string) string {
	s := strings.TrimSpace(raw)
	if s == "" || strings.EqualFold(s, "ALL") {
		return ""
	}
	return s
}

func isSchoolWingLockedHeader(r *http.Request) bool {
	v := strings.ToLower(strings.TrimSpace(r.Header.Get("X-Wing-Scope-Locked")))
	return v == "true" || v == "1" || v == "yes"
}

func resolveSchoolScope(r *http.Request, bodyBranch, bodyWing string) schoolScope {
	role := resolveSchoolUserRole(r)
	isOwner := role == "" || schoolOwnerRoles[role]
	assignedBranch := normalizeSchoolScopeVal(r.Header.Get("X-Branch-Id"))
	assignedWing := normalizeSchoolScopeVal(r.Header.Get("X-Wing-Id"))
	wingLocked := isSchoolWingLockedHeader(r)

	qBranch := r.URL.Query().Get("branch_id")
	if qBranch == "" {
		qBranch = r.URL.Query().Get("branchId")
	}
	queryBranch := normalizeSchoolScopeVal(qBranch)

	qWing := r.URL.Query().Get("wing_id")
	if qWing == "" {
		qWing = r.URL.Query().Get("wingId")
	}
	queryWing := normalizeSchoolScopeVal(qWing)

	bBranch := normalizeSchoolScopeVal(bodyBranch)
	bWing := normalizeSchoolScopeVal(bodyWing)

	isBranchLocked := !isOwner && assignedBranch != ""
	isWingLocked := isBranchLocked && wingLocked && assignedWing != ""

	if isBranchLocked {
		if queryBranch != "" && queryBranch != assignedBranch {
			return schoolScope{
				ErrorStatus:  http.StatusForbidden,
				ErrorCode:    "BRANCH_SCOPE_FORBIDDEN",
				ErrorMessage: fmt.Sprintf("Role '%s' is locked to branch '%s' and cannot access branch '%s'.", role, assignedBranch, queryBranch),
			}
		}
		if bBranch != "" && bBranch != assignedBranch {
			return schoolScope{
				ErrorStatus:  http.StatusForbidden,
				ErrorCode:    "BRANCH_SCOPE_FORBIDDEN",
				ErrorMessage: fmt.Sprintf("Role '%s' is locked to branch '%s' and cannot write to branch '%s'.", role, assignedBranch, bBranch),
			}
		}
	}

	if isWingLocked {
		if queryWing != "" && queryWing != assignedWing {
			return schoolScope{
				ErrorStatus:  http.StatusForbidden,
				ErrorCode:    "WING_SCOPE_FORBIDDEN",
				ErrorMessage: fmt.Sprintf("Role '%s' is locked to wing '%s' and cannot access wing '%s'.", role, assignedWing, queryWing),
			}
		}
		if bWing != "" && bWing != assignedWing {
			return schoolScope{
				ErrorStatus:  http.StatusForbidden,
				ErrorCode:    "WING_SCOPE_FORBIDDEN",
				ErrorMessage: fmt.Sprintf("Role '%s' is locked to wing '%s' and cannot write to wing '%s'.", role, assignedWing, bWing),
			}
		}
	}

	branchFilter := ""
	if isBranchLocked {
		branchFilter = assignedBranch
	} else if queryBranch != "" {
		branchFilter = queryBranch
	} else {
		branchFilter = assignedBranch
	}

	wingFilter := ""
	if isWingLocked {
		wingFilter = assignedWing
	} else if queryWing != "" {
		wingFilter = queryWing
	} else if !isBranchLocked {
		wingFilter = assignedWing
	}

	writeBranch := firstNonEmpty(bBranch, assignedBranch, queryBranch, school.DefaultBranchID)
	writeWing := school.DefaultWingID
	if bWing != "" {
		writeWing = bWing
	} else if isWingLocked {
		writeWing = assignedWing
	} else if queryWing != "" {
		writeWing = queryWing
	} else if assignedWing != "" {
		writeWing = assignedWing
	}

	return schoolScope{
		IsOwner:        isOwner,
		IsBranchLocked: isBranchLocked,
		IsWingLocked:   isWingLocked,
		AssignedBranch: assignedBranch,
		AssignedWing:   assignedWing,
		BranchFilter:   branchFilter,
		WingFilter:     wingFilter,
		WriteBranchID:  writeBranch,
		WriteWingID:    writeWing,
	}
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func buildSchoolScopeSQL(scope schoolScope) (string, []interface{}) {
	var clauses []string
	var params []interface{}
	if scope.BranchFilter != "" {
		clauses = append(clauses, "branch_id = ?")
		params = append(params, scope.BranchFilter)
	}
	if scope.WingFilter != "" {
		clauses = append(clauses, "wing_id = ?")
		params = append(params, scope.WingFilter)
	}
	if len(clauses) == 0 {
		return "", nil
	}
	return " AND " + strings.Join(clauses, " AND "), params
}

func assertSchoolRecordScope(scope schoolScope, recBranch, recWing string) (int, string, string) {
	b := strings.TrimSpace(recBranch)
	w := strings.TrimSpace(recWing)
	if scope.IsBranchLocked && b != "" && b != scope.AssignedBranch {
		return http.StatusForbidden, "BRANCH_SCOPE_FORBIDDEN", fmt.Sprintf("Record belongs to branch '%s', outside locked branch '%s'.", b, scope.AssignedBranch)
	}
	if scope.IsWingLocked && w != "" && w != scope.AssignedWing {
		return http.StatusForbidden, "WING_SCOPE_FORBIDDEN", fmt.Sprintf("Record belongs to wing '%s', outside locked wing '%s'.", w, scope.AssignedWing)
	}
	return 0, "", ""
}

func requireSchoolOwnerRole(w http.ResponseWriter, r *http.Request) bool {
	role := resolveSchoolUserRole(r)
	if role == "" || !schoolOwnerRoles[role] {
		writePhase3Error(
			w,
			http.StatusForbidden,
			"OWNER_ONLY_FORBIDDEN",
			"Only School Business Owner can customize table schemas, form fields, or edit/delete submitted table records.",
		)
		return false
	}
	return true
}

type schoolNameMaps struct {
	branches map[string]string
	wings    map[string]string
}

func getSchoolBranchWingMaps(db *sql.DB, tid string) schoolNameMaps {
	m := schoolNameMaps{
		branches: make(map[string]string),
		wings:    make(map[string]string),
	}
	for _, b := range school.DefaultBranches() {
		m.branches[b.ID] = b.Name
	}
	for _, w := range school.DefaultWings() {
		m.wings[w.ID] = w.Name
	}
	if db != nil {
		if rows, err := db.Query(`SELECT id, name FROM local_school_branches WHERE tenant_id = ?`, tid); err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, name string
				if rows.Scan(&id, &name) == nil {
					m.branches[id] = name
				}
			}
		}
		if rows, err := db.Query(`SELECT id, name FROM local_school_wings WHERE tenant_id = ?`, tid); err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, name string
				if rows.Scan(&id, &name) == nil {
					m.wings[id] = name
				}
			}
		}
	}
	return m
}

func (m schoolNameMaps) branchName(id string) string {
	if id == "ALL" {
		return "All Branches"
	}
	if n, ok := m.branches[id]; ok && n != "" {
		return n
	}
	return "Main Campus"
}

func (m schoolNameMaps) wingName(id string) string {
	if id == "ALL" {
		return "All Wings"
	}
	if n, ok := m.wings[id]; ok && n != "" {
		return n
	}
	return "General Campus Wing"
}

func ensureSchoolPaymentGatewaysSeeded(db *sql.DB, tid string) {
	if db == nil {
		return
	}
	_ = school.EnsureSchoolPhase3Schema(db)

	var cnt int
	_ = db.QueryRow(`SELECT COUNT(*) FROM local_school_payment_gateways WHERE tenant_id = ?`, tid).Scan(&cnt)
	now := time.Now().UTC().Format(time.RFC3339)

	if cnt == 0 {
		for _, gw := range school.DefaultSchoolPaymentGateways(tid) {
			portalsBytes, _ := json.Marshal(gw.AllowedPortals)
			fieldsBytes, _ := json.Marshal(gw.CustomFields)
			_, _ = db.Exec(`
				INSERT OR IGNORE INTO local_school_payment_gateways (
					id, tenant_id, branch_id, wing_id, provider_key, display_name, category,
					account_title, account_number, iban, raast_id, bank_name, branch_code, till_id, biller_code,
					merchant_id, merchant_secret_enc, integrity_salt_enc, webhook_url,
					fee_type, fee_value, verification_mode, instructions, allowed_portals_json, custom_fields_json,
					is_enabled, is_default, sort_order, is_synced, created_at, updated_at
				) VALUES (?, ?, 'ALL', 'ALL', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
			`,
				gw.ID, tid, gw.ProviderKey, gw.DisplayName, gw.Category,
				gw.AccountTitle, gw.AccountNumber, gw.IBAN, gw.RaastID, gw.BankName, gw.BranchCode, gw.TillID, gw.BillerCode,
				gw.MerchantID, gw.WebhookURL, gw.FeeType, gw.FeeValue, gw.VerificationMode,
				gw.Instructions, string(portalsBytes), string(fieldsBytes),
				boolToInt(gw.IsEnabled), boolToInt(gw.IsDefault), gw.SortOrder, now, now,
			)
		}
	}

	var existingTid string
	if db.QueryRow(`SELECT tenant_id FROM local_school_gateway_settings WHERE tenant_id = ?`, tid).Scan(&existingTid) == sql.ErrNoRows {
		defBytes, _ := json.Marshal(school.DefaultSchoolGatewaySettings())
		_, _ = db.Exec(`
			INSERT OR IGNORE INTO local_school_gateway_settings (tenant_id, settings_json, is_synced, updated_at)
			VALUES (?, ?, 0, ?)
		`, tid, string(defBytes), now)
	}
}

func loadSchoolGatewaySettings(db *sql.DB, tid string) school.SchoolGatewaySettings {
	def := school.DefaultSchoolGatewaySettings()
	if db == nil {
		return def
	}
	ensureSchoolPaymentGatewaysSeeded(db, tid)
	var settingsJSON sql.NullString
	if err := db.QueryRow(`SELECT settings_json FROM local_school_gateway_settings WHERE tenant_id = ?`, tid).Scan(&settingsJSON); err == nil && settingsJSON.Valid && settingsJSON.String != "" {
		_ = json.Unmarshal([]byte(settingsJSON.String), &def)
	}
	if def.CustomPolicyFields == nil {
		def.CustomPolicyFields = []school.CustomFieldKV{}
	}
	return def
}

func recordSchoolAudit(db *sql.DB, tid, branchID, wingID, operatorName, operatorRole, actionType, category, entityID, entityDesc, details, severity string) {
	if db == nil {
		return
	}
	if branchID == "" || branchID == "ALL" {
		branchID = school.DefaultBranchID
	}
	if wingID == "" || wingID == "ALL" {
		wingID = school.DefaultWingID
	}
	now := time.Now().UTC().Format("2006-01-02 15:04:05")
	audID := "AUD-" + randomHexToken(4)
	_, _ = db.Exec(`
		INSERT INTO local_school_audit_logs (
			id, tenant_id, branch_id, wing_id, timestamp, operator_name, operator_role,
			action_type, category, entity_id, entity_description, details, severity, verified_by, ip_address
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'System Verified', '127.0.0.1')
	`, audID, tid, branchID, wingID, now, operatorName, operatorRole, actionType, category, entityID, entityDesc, details, severity)
}

const schoolGatewaySelectCols = `
	id, tenant_id, branch_id, wing_id, provider_key, display_name, category,
	account_title, account_number, iban, raast_id, bank_name, branch_code, till_id, biller_code,
	merchant_id, merchant_secret_enc, integrity_salt_enc, webhook_url,
	fee_type, fee_value, verification_mode, instructions, allowed_portals_json, custom_fields_json,
	is_enabled, is_default, sort_order, created_at, updated_at
`

type schoolGatewayDBRow struct {
	id, tenantID, branchID, wingID, providerKey, displayName, category sql.NullString
	accountTitle, accountNumber, iban, raastID, bankName, branchCode   sql.NullString
	tillID, billerCode, merchantID, secretEnc, saltEnc, webhookURL     sql.NullString
	feeType, verificationMode, instructions, allowedPortals, custFlds  sql.NullString
	createdAt, updatedAt                                               sql.NullString
	feeValue                                                           sql.NullFloat64
	isEnabled, isDefault, sortOrder                                    sql.NullInt64
}

func scanSchoolGatewayRow(scanner interface{ Scan(...interface{}) error }) (schoolGatewayDBRow, error) {
	var r schoolGatewayDBRow
	err := scanner.Scan(
		&r.id, &r.tenantID, &r.branchID, &r.wingID, &r.providerKey, &r.displayName, &r.category,
		&r.accountTitle, &r.accountNumber, &r.iban, &r.raastID, &r.bankName, &r.branchCode, &r.tillID, &r.billerCode,
		&r.merchantID, &r.secretEnc, &r.saltEnc, &r.webhookURL,
		&r.feeType, &r.feeValue, &r.verificationMode, &r.instructions, &r.allowedPortals, &r.custFlds,
		&r.isEnabled, &r.isDefault, &r.sortOrder, &r.createdAt, &r.updatedAt,
	)
	return r, err
}

func mapSchoolGatewayRow(db *sql.DB, r schoolGatewayDBRow, tid string, isOwner bool, maps schoolNameMaps) school.SchoolPaymentGateway {
	allowedPortals := []string{"owner", "principal", "accountant", "student", "parent"}
	if raw := strings.TrimSpace(nullStrVal(r.allowedPortals)); raw != "" {
		var parsed []string
		if json.Unmarshal([]byte(raw), &parsed) == nil && len(parsed) > 0 {
			allowedPortals = parsed
		}
	}
	customFields := []school.CustomFieldKV{}
	if raw := strings.TrimSpace(nullStrVal(r.custFlds)); raw != "" {
		var parsed []school.CustomFieldKV
		if json.Unmarshal([]byte(raw), &parsed) == nil && parsed != nil {
			customFields = parsed
		}
	}
	branchID := firstNonEmpty(nullStrVal(r.branchID), "ALL")
	wingID := firstNonEmpty(nullStrVal(r.wingID), "ALL")
	branchName := maps.branchName(branchID)
	if branchID == "ALL" {
		branchName = "All Campus Branches"
	}
	wingName := maps.wingName(wingID)
	if wingID == "ALL" {
		wingName = "All Academic Wings"
	}

	rawSecret := ""
	if nullStrVal(r.secretEnc) != "" {
		rawSecret = vaultDecryptField(db, tid, nullStrVal(r.secretEnc))
	}
	rawSalt := ""
	if nullStrVal(r.saltEnc) != "" {
		rawSalt = vaultDecryptField(db, tid, nullStrVal(r.saltEnc))
	}

	webhookOut := ""
	secretHint := ""
	saltHint := ""
	hasSecret := false
	hasSalt := false
	if isOwner {
		hasSecret = rawSecret != ""
		hasSalt = rawSalt != ""
		secretHint = maskSecretTail(rawSecret)
		saltHint = maskSecretTail(rawSalt)
		webhookOut = nullStrVal(r.webhookURL)
	}

	return school.SchoolPaymentGateway{
		ID:                 nullStrVal(r.id),
		TenantID:           firstNonEmpty(nullStrVal(r.tenantID), tid),
		BranchID:           branchID,
		BranchName:         branchName,
		WingID:             wingID,
		WingName:           wingName,
		ProviderKey:        nullStrVal(r.providerKey),
		DisplayName:        nullStrVal(r.displayName),
		Category:           firstNonEmpty(nullStrVal(r.category), "mobile_wallet"),
		AccountTitle:       nullStrVal(r.accountTitle),
		AccountNumber:      nullStrVal(r.accountNumber),
		IBAN:               nullStrVal(r.iban),
		RaastID:            nullStrVal(r.raastID),
		BankName:           nullStrVal(r.bankName),
		BranchCode:         nullStrVal(r.branchCode),
		TillID:             nullStrVal(r.tillID),
		BillerCode:         nullStrVal(r.billerCode),
		MerchantID:         nullStrVal(r.merchantID),
		HasMerchantSecret:  hasSecret,
		HasIntegritySalt:   hasSalt,
		MerchantSecretHint: secretHint,
		IntegritySaltHint:  saltHint,
		WebhookURL:         webhookOut,
		FeeType:            firstNonEmpty(nullStrVal(r.feeType), "none"),
		FeeValue:           nullFloatVal(r.feeValue, 0),
		VerificationMode:   firstNonEmpty(nullStrVal(r.verificationMode), "slip_review"),
		Instructions:       nullStrVal(r.instructions),
		AllowedPortals:     allowedPortals,
		CustomFields:       customFields,
		IsEnabled:          nullIntVal(r.isEnabled, 1) != 0,
		IsDefault:          nullIntVal(r.isDefault, 0) == 1,
		SortOrder:          int(nullIntVal(r.sortOrder, 10)),
		CreatedAt:          nullStrVal(r.createdAt),
		UpdatedAt:          nullStrVal(r.updatedAt),
	}
}

const schoolTxnSelectCols = `
	id, tenant_id, branch_id, wing_id, txn_ref, challan_no, gateway_id, gateway_name, provider_key,
	student_id, student_name, roll_no, grade, guardian_name, payer_phone, payer_account_title,
	month, base_amount, gateway_fee, total_amount, currency, status, verification_mode,
	proof_reference, proof_notes, proof_screenshot, submitted_by_name, submitted_by_role, verified_by, verified_at,
	rejection_reason, linked_fee_id, custom_fields_json, created_at, updated_at
`

type schoolTxnDBRow struct {
	id, tenantID, branchID, wingID, txnRef, challanNo, gatewayID, gatewayName, providerKey sql.NullString
	studentID, studentName, rollNo, grade, guardianName, payerPhone, payerAccountTitle     sql.NullString
	month, currency, status, verificationMode, proofReference, proofNotes, proofScreenshot sql.NullString
	submittedByName, submittedByRole, verifiedBy, verifiedAt, rejectionReason, linkedFeeID sql.NullString
	customFieldsJSON, createdAt, updatedAt                                                 sql.NullString
	baseAmount, gatewayFee, totalAmount                                                    sql.NullFloat64
}

func scanSchoolTxnRow(scanner interface{ Scan(...interface{}) error }) (schoolTxnDBRow, error) {
	var r schoolTxnDBRow
	err := scanner.Scan(
		&r.id, &r.tenantID, &r.branchID, &r.wingID, &r.txnRef, &r.challanNo, &r.gatewayID, &r.gatewayName, &r.providerKey,
		&r.studentID, &r.studentName, &r.rollNo, &r.grade, &r.guardianName, &r.payerPhone, &r.payerAccountTitle,
		&r.month, &r.baseAmount, &r.gatewayFee, &r.totalAmount, &r.currency, &r.status, &r.verificationMode,
		&r.proofReference, &r.proofNotes, &r.proofScreenshot, &r.submittedByName, &r.submittedByRole, &r.verifiedBy, &r.verifiedAt,
		&r.rejectionReason, &r.linkedFeeID, &r.customFieldsJSON, &r.createdAt, &r.updatedAt,
	)
	return r, err
}

func mapSchoolTxnRow(db *sql.DB, r schoolTxnDBRow, tid string, maps schoolNameMaps) school.SchoolPaymentTransaction {
	branchID := firstNonEmpty(nullStrVal(r.branchID), school.DefaultBranchID)
	wingID := firstNonEmpty(nullStrVal(r.wingID), school.DefaultWingID)
	customFields := map[string]interface{}{}
	if raw := strings.TrimSpace(nullStrVal(r.customFieldsJSON)); raw != "" {
		_ = json.Unmarshal([]byte(raw), &customFields)
	}
	stuName := vaultDecryptField(db, tid, nullStrVal(r.studentName))
	if stuName == "" {
		stuName = "Student"
	}
	shot := nullStrVal(r.proofScreenshot)
	return school.SchoolPaymentTransaction{
		ID:                 nullStrVal(r.id),
		TenantID:           firstNonEmpty(nullStrVal(r.tenantID), tid),
		BranchID:           branchID,
		BranchName:         maps.branchName(branchID),
		WingID:             wingID,
		WingName:           maps.wingName(wingID),
		TxnRef:             nullStrVal(r.txnRef),
		ChallanNo:          nullStrVal(r.challanNo),
		GatewayID:          nullStrVal(r.gatewayID),
		GatewayName:        nullStrVal(r.gatewayName),
		ProviderKey:        nullStrVal(r.providerKey),
		StudentID:          nullStrVal(r.studentID),
		StudentName:        stuName,
		RollNo:             nullStrVal(r.rollNo),
		Grade:              nullStrVal(r.grade),
		GuardianName:       vaultDecryptField(db, tid, nullStrVal(r.guardianName)),
		PayerPhone:         vaultDecryptField(db, tid, nullStrVal(r.payerPhone)),
		PayerAccountTitle:  vaultDecryptField(db, tid, nullStrVal(r.payerAccountTitle)),
		Month:              firstNonEmpty(nullStrVal(r.month), "Current Session Fee"),
		BaseAmount:         nullFloatVal(r.baseAmount, 0),
		GatewayFee:         nullFloatVal(r.gatewayFee, 0),
		TotalAmount:        nullFloatVal(r.totalAmount, 0),
		Currency:           firstNonEmpty(nullStrVal(r.currency), "PKR"),
		Status:             firstNonEmpty(nullStrVal(r.status), "PENDING_VERIFICATION"),
		VerificationMode:   firstNonEmpty(nullStrVal(r.verificationMode), "slip_review"),
		ProofReference:     nullStrVal(r.proofReference),
		ProofNotes:         nullStrVal(r.proofNotes),
		ProofScreenshot:    shot,
		HasProofScreenshot: shot != "",
		SubmittedByName:    nullStrVal(r.submittedByName),
		SubmittedByRole:    firstNonEmpty(nullStrVal(r.submittedByRole), "parent"),
		VerifiedBy:         nullStrVal(r.verifiedBy),
		VerifiedAt:         nullStrVal(r.verifiedAt),
		RejectionReason:    nullStrVal(r.rejectionReason),
		LinkedFeeID:        nullStrVal(r.linkedFeeID),
		CustomFields:       customFields,
		CreatedAt:          nullStrVal(r.createdAt),
		UpdatedAt:          nullStrVal(r.updatedAt),
	}
}

func settleSchoolFeeForGatewayTransaction(db *sql.DB, tid string, txRow schoolTxnDBRow, verifierName, verifierRole string, scope schoolScope) string {
	if db == nil {
		return ""
	}
	if linked := strings.TrimSpace(nullStrVal(txRow.linkedFeeID)); linked != "" {
		var existingID string
		if db.QueryRow(`SELECT id FROM local_school_fees WHERE id = ? AND tenant_id = ?`, linked, tid).Scan(&existingID) == nil {
			return existingID
		}
	}

	stuName := vaultDecryptField(db, tid, nullStrVal(txRow.studentName))
	if stuName == "" {
		stuName = "Student"
	}
	baseAmt := nullFloatVal(txRow.baseAmount, 0)
	if baseAmt <= 0 {
		baseAmt = nullFloatVal(txRow.totalAmount, 0)
	}
	totalPaid := nullFloatVal(txRow.totalAmount, baseAmt)
	paidDate := time.Now().UTC().Format("2006-01-02")
	suffixMode := "Gateway"
	if nullStrVal(txRow.providerKey) == "cash_counter" {
		suffixMode = "Counter"
	}
	modeLabel := fmt.Sprintf("%s (%s)", nullStrVal(txRow.gatewayName), suffixMode)
	proofRef := firstNonEmpty(nullStrVal(txRow.proofReference), nullStrVal(txRow.txnRef))
	txBranch := firstNonEmpty(nullStrVal(txRow.branchID), scope.WriteBranchID, school.DefaultBranchID)
	txWing := firstNonEmpty(nullStrVal(txRow.wingID), scope.WriteWingID, school.DefaultWingID)

	linkedFeeID := ""
	challanNo := strings.TrimSpace(nullStrVal(txRow.challanNo))
	if challanNo != "" {
		var fID string
		var paidAmt, totalDue sql.NullFloat64
		err := db.QueryRow(`SELECT id, paid_amount, total FROM local_school_fees WHERE tenant_id = ? AND challan_no = ? LIMIT 1`, tid, challanNo).Scan(&fID, &paidAmt, &totalDue)
		if err == nil {
			tDue := nullFloatVal(totalDue, baseAmt)
			nextPaid := math.Min(math.Max(tDue, baseAmt), nullFloatVal(paidAmt, 0)+baseAmt)
			nextStatus := "PARTIAL"
			if nextPaid >= tDue {
				nextStatus = "PAID"
			}
			_, _ = db.Exec(`
				UPDATE local_school_fees
				SET status = ?, paid_amount = ?, paid_date = ?, payment_mode = ?, resource_reference = ?, collected_by = ?, collector_role = ?, notes = ?, is_synced = 0
				WHERE id = ? AND tenant_id = ?
			`,
				nextStatus, nextPaid, paidDate, modeLabel, proofRef,
				firstNonEmpty(verifierName, "Online Gateway Verification"),
				firstNonEmpty(verifierRole, "owner"),
				fmt.Sprintf("Verified gateway txn %s (Total PKR %.0f)", nullStrVal(txRow.txnRef), totalPaid),
				fID, tid,
			)
			linkedFeeID = fID
		}
	}

	studentID := strings.TrimSpace(nullStrVal(txRow.studentID))
	rollNo := strings.TrimSpace(nullStrVal(txRow.rollNo))
	if linkedFeeID == "" && (studentID != "" || rollNo != "") {
		var fID string
		var paidAmt, totalDue sql.NullFloat64
		var err error
		if studentID != "" {
			err = db.QueryRow(`SELECT id, paid_amount, total FROM local_school_fees WHERE tenant_id = ? AND student_id = ? AND UPPER(status) IN ('PENDING', 'OVERDUE', 'PARTIAL') ORDER BY created_at DESC LIMIT 1`, tid, studentID).Scan(&fID, &paidAmt, &totalDue)
		} else {
			err = db.QueryRow(`SELECT id, paid_amount, total FROM local_school_fees WHERE tenant_id = ? AND roll_no = ? AND UPPER(status) IN ('PENDING', 'OVERDUE', 'PARTIAL') ORDER BY created_at DESC LIMIT 1`, tid, rollNo).Scan(&fID, &paidAmt, &totalDue)
		}
		if err == nil {
			tDue := nullFloatVal(totalDue, baseAmt)
			nextPaid := math.Min(math.Max(tDue, baseAmt), nullFloatVal(paidAmt, 0)+baseAmt)
			if nextPaid >= tDue {
				_, _ = db.Exec(`
					UPDATE local_school_fees
					SET status = 'PAID', paid_amount = ?, paid_date = ?, payment_mode = ?, resource_reference = ?, collected_by = ?, collector_role = ?, notes = ?, is_synced = 0
					WHERE id = ? AND tenant_id = ?
				`,
					nextPaid, paidDate, modeLabel, proofRef,
					firstNonEmpty(verifierName, "Online Gateway Verification"),
					firstNonEmpty(verifierRole, "owner"),
					fmt.Sprintf("Settled via gateway txn %s (Total PKR %.0f)", nullStrVal(txRow.txnRef), totalPaid),
					fID, tid,
				)
				linkedFeeID = fID
			}
		}
	}

	if linkedFeeID == "" {
		linkedFeeID = fmt.Sprintf("FEE-%d-%s", time.Now().UnixMilli(), randomHexToken(2))
		resolvedChallan := firstNonEmpty(challanNo, "GW-"+nullStrVal(txRow.txnRef))
		_, _ = db.Exec(`
			INSERT INTO local_school_fees (
				id, tenant_id, branch_id, wing_id, challan_no, student_id, student_name, roll_no, grade, month,
				tuition, lab_fee, discount, total, paid_amount, status, payment_mode, resource_reference,
				collected_by, collector_role, notes, due_date, paid_date, is_synced, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'PAID', ?, ?, ?, ?, ?, ?, ?, 0, ?)
		`,
			linkedFeeID, tid, txBranch, txWing, resolvedChallan, studentID,
			vaultEncryptField(db, tid, stuName),
			firstNonEmpty(rollNo, "SCH-GEN"),
			firstNonEmpty(nullStrVal(txRow.grade), "Campus"),
			firstNonEmpty(nullStrVal(txRow.month), "Current Session Fee"),
			baseAmt, baseAmt, baseAmt, modeLabel, proofRef,
			firstNonEmpty(verifierName, "Payment Gateway Desk"),
			firstNonEmpty(verifierRole, "owner"),
			fmt.Sprintf("Online gateway payment verified (%s)", nullStrVal(txRow.txnRef)),
			paidDate, paidDate, time.Now().UTC().Format(time.RFC3339),
		)
	}

	var stID string
	var dueBakaya, feeAmount sql.NullFloat64
	var stErr error
	if studentID != "" {
		stErr = db.QueryRow(`SELECT id, due_bakaya, fee_amount FROM local_school_students WHERE id = ? AND tenant_id = ?`, studentID, tid).Scan(&stID, &dueBakaya, &feeAmount)
	} else if rollNo != "" {
		stErr = db.QueryRow(`SELECT id, due_bakaya, fee_amount FROM local_school_students WHERE roll_no = ? AND tenant_id = ?`, rollNo, tid).Scan(&stID, &dueBakaya, &feeAmount)
	}
	if stErr == nil && stID != "" {
		currentDue := 0.0
		if dueBakaya.Valid {
			currentDue = dueBakaya.Float64
		} else if feeAmount.Valid {
			currentDue = feeAmount.Float64
		}
		remaining := math.Max(0, currentDue-baseAmt)
		nextStuStatus := "PARTIAL"
		if remaining == 0 {
			nextStuStatus = "PAID"
		}
		_, _ = db.Exec(`UPDATE local_school_students SET fee_status = ?, due_bakaya = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?`, nextStuStatus, remaining, stID, tid)
	}

	return linkedFeeID
}

// --- /api/school/payment-gateways ---
func handleSchoolPaymentGatewaysCollection(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		handleSchoolGetGateways(w, r)
	case http.MethodPost:
		handleSchoolCreateGateway(w, r)
	default:
		writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed.")
	}
}

func handleSchoolGetGateways(w http.ResponseWriter, r *http.Request) {
	tid := resolveSchoolTenantID(r, "")
	scope := resolveSchoolScope(r, "", "")
	if scope.ErrorStatus != 0 {
		writePhase3Error(w, scope.ErrorStatus, scope.ErrorCode, scope.ErrorMessage)
		return
	}
	reqRole := resolveSchoolUserRole(r)
	isOwner := schoolOwnerRoles[reqRole]
	includeDisabled := r.URL.Query().Get("includeDisabled") == "1" || isOwner

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		defaults := school.DefaultSchoolPaymentGateways(tid)
		if !isOwner {
			for i := range defaults {
				defaults[i].WebhookURL = ""
				defaults[i].HasMerchantSecret = false
				defaults[i].HasIntegritySalt = false
				defaults[i].MerchantSecretHint = ""
				defaults[i].IntegritySaltHint = ""
			}
		}
		writeAPIJSON(w, http.StatusOK, map[string]interface{}{
			"ok":        true,
			"tenantId":  tid,
			"canManage": isOwner,
			"gateways":  defaults,
			"settings":  school.DefaultSchoolGatewaySettings(),
		})
		return
	}
	defer db.Close()

	ensureSchoolPaymentGatewaysSeeded(db, tid)
	settings := loadSchoolGatewaySettings(db, tid)
	maps := getSchoolBranchWingMaps(db, tid)

	rows, err := db.Query(`SELECT `+schoolGatewaySelectCols+` FROM local_school_payment_gateways WHERE tenant_id = ? ORDER BY sort_order ASC, created_at ASC`, tid)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load school payment gateways.")
		return
	}
	defer rows.Close()

	gateways := make([]school.SchoolPaymentGateway, 0)
	for rows.Next() {
		rRow, scanErr := scanSchoolGatewayRow(rows)
		if scanErr != nil {
			continue
		}
		if !includeDisabled && nullIntVal(rRow.isEnabled, 1) == 0 {
			continue
		}
		bID := firstNonEmpty(nullStrVal(rRow.branchID), "ALL")
		wID := firstNonEmpty(nullStrVal(rRow.wingID), "ALL")
		if scope.BranchFilter != "" && bID != "ALL" && bID != scope.BranchFilter {
			continue
		}
		if scope.WingFilter != "" && wID != "ALL" && wID != scope.WingFilter {
			continue
		}
		gateways = append(gateways, mapSchoolGatewayRow(db, rRow, tid, isOwner, maps))
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":        true,
		"tenantId":  tid,
		"canManage": isOwner,
		"gateways":  gateways,
		"settings":  settings,
	})
}

type schoolCreateGatewayReq struct {
	TenantID         string                 `json:"tenantId"`
	BranchID         string                 `json:"branchId"`
	WingID           string                 `json:"wingId"`
	ProviderKey      string                 `json:"providerKey"`
	DisplayName      string                 `json:"displayName"`
	Category         string                 `json:"category"`
	AccountTitle     string                 `json:"accountTitle"`
	AccountNumber    string                 `json:"accountNumber"`
	IBAN             string                 `json:"iban"`
	RaastID          string                 `json:"raastId"`
	BankName         string                 `json:"bankName"`
	BranchCode       string                 `json:"branchCode"`
	TillID           string                 `json:"tillId"`
	BillerCode       string                 `json:"billerCode"`
	MerchantID       string                 `json:"merchantId"`
	MerchantSecret   string                 `json:"merchantSecret"`
	IntegritySalt    string                 `json:"integritySalt"`
	WebhookURL       string                 `json:"webhookUrl"`
	FeeType          string                 `json:"feeType"`
	FeeValue         float64                `json:"feeValue"`
	VerificationMode string                 `json:"verificationMode"`
	Instructions     string                 `json:"instructions"`
	AllowedPortals   []string               `json:"allowedPortals"`
	CustomFields     []school.CustomFieldKV `json:"customFields"`
	IsEnabled        *bool                  `json:"isEnabled"`
	IsDefault        bool                   `json:"isDefault"`
	SortOrder        *int                   `json:"sortOrder"`
}

func handleSchoolCreateGateway(w http.ResponseWriter, r *http.Request) {
	if !requireSchoolOwnerRole(w, r) {
		return
	}
	var body schoolCreateGatewayReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	tid := resolveSchoolTenantID(r, body.TenantID)
	scope := resolveSchoolScope(r, body.BranchID, body.WingID)
	if scope.ErrorStatus != 0 {
		writePhase3Error(w, scope.ErrorStatus, scope.ErrorCode, scope.ErrorMessage)
		return
	}

	displayName := strings.TrimSpace(body.DisplayName)
	if displayName == "" {
		writePhase3Error(w, http.StatusBadRequest, "", "Gateway displayName is required.")
		return
	}
	if math.IsNaN(body.FeeValue) || math.IsInf(body.FeeValue, 0) {
		writePhase3Error(w, http.StatusBadRequest, "", "Fee value must be a valid non-negative number.")
		return
	}
	feeValue := math.Max(0, body.FeeValue)
	feeType := "none"
	if body.FeeType == "percent" || body.FeeType == "fixed" {
		feeType = body.FeeType
	}
	verMode := "slip_review"
	if body.VerificationMode == "auto_instant" || body.VerificationMode == "counter_cash" {
		verMode = body.VerificationMode
	}
	webhookURL, urlErr := school.ValidateGatewayWebhookURL(body.WebhookURL)
	if urlErr != "" {
		writePhase3Error(w, http.StatusBadRequest, "", urlErr)
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

	ensureSchoolPaymentGatewaysSeeded(db, tid)
	maps := getSchoolBranchWingMaps(db, tid)

	id := fmt.Sprintf("PGW-%d-%s", time.Now().UnixMilli(), randomHexToken(2))
	branchID := firstNonEmpty(strings.TrimSpace(body.BranchID), "ALL")
	wingID := firstNonEmpty(strings.TrimSpace(body.WingID), "ALL")
	providerKey := school.SanitizeProviderKey(body.ProviderKey)
	isEnabled := true
	if body.IsEnabled != nil {
		isEnabled = *body.IsEnabled
	}
	sortOrder := 90
	if body.SortOrder != nil && *body.SortOrder != 0 {
		sortOrder = *body.SortOrder
	}

	allowedPortals := []string{"owner", "principal", "accountant", "student", "parent"}
	if len(body.AllowedPortals) > 0 {
		cleaned := make([]string, 0, len(body.AllowedPortals))
		for _, p := range body.AllowedPortals {
			if cp := strings.ToLower(strings.TrimSpace(p)); cp != "" {
				cleaned = append(cleaned, cp)
			}
		}
		if len(cleaned) > 0 {
			allowedPortals = cleaned
		}
	}
	customFields := make([]school.CustomFieldKV, 0)
	for _, f := range body.CustomFields {
		if lbl := strings.TrimSpace(f.Label); lbl != "" {
			customFields = append(customFields, school.CustomFieldKV{Label: lbl, Value: strings.TrimSpace(f.Value)})
		}
	}
	portalsJSON, _ := json.Marshal(allowedPortals)
	fieldsJSON, _ := json.Marshal(customFields)

	if body.IsDefault {
		_, _ = db.Exec(`UPDATE local_school_payment_gateways SET is_default = 0, is_synced = 0 WHERE tenant_id = ?`, tid)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	secretEnc := ""
	if s := strings.TrimSpace(body.MerchantSecret); s != "" {
		secretEnc = vaultEncryptField(db, tid, s)
	}
	saltEnc := ""
	if s := strings.TrimSpace(body.IntegritySalt); s != "" {
		saltEnc = vaultEncryptField(db, tid, s)
	}

	_, err = db.Exec(`
		INSERT INTO local_school_payment_gateways (
			id, tenant_id, branch_id, wing_id, provider_key, display_name, category,
			account_title, account_number, iban, raast_id, bank_name, branch_code, till_id, biller_code,
			merchant_id, merchant_secret_enc, integrity_salt_enc, webhook_url,
			fee_type, fee_value, verification_mode, instructions, allowed_portals_json, custom_fields_json,
			is_enabled, is_default, sort_order, is_synced, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
	`,
		id, tid, branchID, wingID, providerKey, displayName, firstNonEmpty(body.Category, "custom"),
		body.AccountTitle, body.AccountNumber, body.IBAN, body.RaastID, body.BankName, body.BranchCode, body.TillID, body.BillerCode,
		body.MerchantID, secretEnc, saltEnc, webhookURL,
		feeType, feeValue, verMode, body.Instructions, string(portalsJSON), string(fieldsJSON),
		boolToInt(isEnabled), boolToInt(body.IsDefault), sortOrder, now, now,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create school payment gateway.")
		return
	}

	row, scanErr := scanSchoolGatewayRow(db.QueryRow(`SELECT `+schoolGatewaySelectCols+` FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?`, id, tid))
	if scanErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load created gateway.")
		return
	}
	gw := mapSchoolGatewayRow(db, row, tid, true, maps)
	recordSchoolAudit(
		db, tid, branchID, wingID,
		firstNonEmpty(r.Header.Get("X-User-Name"), "School Owner"), "School Owner",
		"Fee Collection Receipt", "Financial", id,
		fmt.Sprintf("Added Payment Gateway: %s (%s)", displayName, providerKey),
		fmt.Sprintf("Owner configured payment gateway %s · Mode: %s · Scope: %s/%s.", displayName, verMode, branchID, wingID),
		"Normal Audit",
	)

	writeAPIJSON(w, http.StatusCreated, map[string]interface{}{
		"ok":      true,
		"gateway": gw,
	})
}

func handleSchoolPaymentGatewayItem(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	rel := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/school/payment-gateways/"), "/")
	if rel == "" {
		writePhase3Error(w, http.StatusNotFound, "NOT_FOUND", "Gateway ID required.")
		return
	}
	parts := strings.Split(rel, "/")

	if len(parts) == 2 && parts[1] == "toggle" {
		if r.Method != http.MethodPut {
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only PUT is allowed.")
			return
		}
		handleSchoolToggleGateway(w, r, parts[0])
		return
	}

	if len(parts) == 1 {
		gwID := parts[0]
		switch r.Method {
		case http.MethodPut:
			handleSchoolUpdateGateway(w, r, gwID)
		case http.MethodDelete:
			handleSchoolDeleteGateway(w, r, gwID)
		default:
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed.")
		}
		return
	}

	writePhase3Error(w, http.StatusNotFound, "NOT_FOUND", "Unknown gateway endpoint.")
}

type schoolUpdateGatewayReq struct {
	TenantID         string                 `json:"tenantId"`
	BranchID         *string                `json:"branchId"`
	WingID           *string                `json:"wingId"`
	ProviderKey      *string                `json:"providerKey"`
	DisplayName      *string                `json:"displayName"`
	Category         *string                `json:"category"`
	AccountTitle     *string                `json:"accountTitle"`
	AccountNumber    *string                `json:"accountNumber"`
	IBAN             *string                `json:"iban"`
	RaastID          *string                `json:"raastId"`
	BankName         *string                `json:"bankName"`
	BranchCode       *string                `json:"branchCode"`
	TillID           *string                `json:"tillId"`
	BillerCode       *string                `json:"billerCode"`
	MerchantID       *string                `json:"merchantId"`
	MerchantSecret   string                 `json:"merchantSecret"`
	IntegritySalt    string                 `json:"integritySalt"`
	WebhookURL       *string                `json:"webhookUrl"`
	FeeType          *string                `json:"feeType"`
	FeeValue         *float64               `json:"feeValue"`
	VerificationMode *string                `json:"verificationMode"`
	Instructions     *string                `json:"instructions"`
	AllowedPortals   []string               `json:"allowedPortals"`
	HasAllowedPortals bool                  `json:"-"`
	CustomFields     []school.CustomFieldKV `json:"customFields"`
	HasCustomFields  bool                   `json:"-"`
	IsEnabled        *bool                  `json:"isEnabled"`
	IsDefault        *bool                  `json:"isDefault"`
	SortOrder        *int                   `json:"sortOrder"`
}

func handleSchoolUpdateGateway(w http.ResponseWriter, r *http.Request, id string) {
	if !requireSchoolOwnerRole(w, r) {
		return
	}
	var rawMap map[string]json.RawMessage
	var body schoolUpdateGatewayReq
	decoder := json.NewDecoder(r.Body)
	var buf json.RawMessage
	if err := decoder.Decode(&buf); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	if err := json.Unmarshal(buf, &body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	_ = json.Unmarshal(buf, &rawMap)
	if _, ok := rawMap["allowedPortals"]; ok {
		body.HasAllowedPortals = true
	}
	if _, ok := rawMap["customFields"]; ok {
		body.HasCustomFields = true
	}

	tid := resolveSchoolTenantID(r, body.TenantID)

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()

	ensureSchoolPaymentGatewaysSeeded(db, tid)
	maps := getSchoolBranchWingMaps(db, tid)

	existing, scanErr := scanSchoolGatewayRow(db.QueryRow(`SELECT `+schoolGatewaySelectCols+` FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?`, id, tid))
	if scanErr == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Payment gateway not found for this tenant.")
		return
	}
	if scanErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load gateway.")
		return
	}

	displayName := nullStrVal(existing.displayName)
	if body.DisplayName != nil {
		displayName = strings.TrimSpace(*body.DisplayName)
	}
	if displayName == "" {
		writePhase3Error(w, http.StatusBadRequest, "", "Gateway displayName cannot be empty.")
		return
	}

	webhookURL := nullStrVal(existing.webhookURL)
	if body.WebhookURL != nil {
		cleaned, uErr := school.ValidateGatewayWebhookURL(*body.WebhookURL)
		if uErr != "" {
			writePhase3Error(w, http.StatusBadRequest, "", uErr)
			return
		}
		webhookURL = cleaned
	}

	feeType := nullStrVal(existing.feeType)
	if body.FeeType != nil && (*body.FeeType == "none" || *body.FeeType == "percent" || *body.FeeType == "fixed") {
		feeType = *body.FeeType
	}
	feeValue := nullFloatVal(existing.feeValue, 0)
	if body.FeeValue != nil {
		if math.IsNaN(*body.FeeValue) || math.IsInf(*body.FeeValue, 0) {
			writePhase3Error(w, http.StatusBadRequest, "", "Invalid fee value.")
			return
		}
		feeValue = math.Max(0, *body.FeeValue)
	}
	verMode := nullStrVal(existing.verificationMode)
	if body.VerificationMode != nil && (*body.VerificationMode == "slip_review" || *body.VerificationMode == "auto_instant" || *body.VerificationMode == "counter_cash") {
		verMode = *body.VerificationMode
	}

	isDefault := nullIntVal(existing.isDefault, 0) == 1
	if body.IsDefault != nil {
		isDefault = *body.IsDefault
	}
	if isDefault {
		_, _ = db.Exec(`UPDATE local_school_payment_gateways SET is_default = 0, is_synced = 0 WHERE tenant_id = ? AND id != ?`, tid, id)
	}

	secretEnc := nullStrVal(existing.secretEnc)
	if s := strings.TrimSpace(body.MerchantSecret); s != "" && !strings.HasPrefix(s, "••••") {
		secretEnc = vaultEncryptField(db, tid, s)
	}
	saltEnc := nullStrVal(existing.saltEnc)
	if s := strings.TrimSpace(body.IntegritySalt); s != "" && !strings.HasPrefix(s, "••••") {
		saltEnc = vaultEncryptField(db, tid, s)
	}

	allowedPortalsJSON := nullStrVal(existing.allowedPortals)
	if body.HasAllowedPortals && body.AllowedPortals != nil {
		cleaned := make([]string, 0, len(body.AllowedPortals))
		for _, p := range body.AllowedPortals {
			if cp := strings.ToLower(strings.TrimSpace(p)); cp != "" {
				cleaned = append(cleaned, cp)
			}
		}
		b, _ := json.Marshal(cleaned)
		allowedPortalsJSON = string(b)
	}

	customFieldsJSON := nullStrVal(existing.custFlds)
	if body.HasCustomFields && body.CustomFields != nil {
		cleaned := make([]school.CustomFieldKV, 0)
		for _, f := range body.CustomFields {
			if lbl := strings.TrimSpace(f.Label); lbl != "" {
				cleaned = append(cleaned, school.CustomFieldKV{Label: lbl, Value: strings.TrimSpace(f.Value)})
			}
		}
		b, _ := json.Marshal(cleaned)
		customFieldsJSON = string(b)
	}

	pickStr := func(p *string, def string) string {
		if p != nil {
			return *p
		}
		return def
	}

	isEnabled := nullIntVal(existing.isEnabled, 1)
	if body.IsEnabled != nil {
		isEnabled = int64(boolToInt(*body.IsEnabled))
	}
	sortOrder := nullIntVal(existing.sortOrder, 10)
	if body.SortOrder != nil {
		sortOrder = int64(*body.SortOrder)
	}
	provKey := nullStrVal(existing.providerKey)
	if body.ProviderKey != nil {
		provKey = strings.ToLower(strings.TrimSpace(*body.ProviderKey))
	}
	now := time.Now().UTC().Format(time.RFC3339)

	_, err = db.Exec(`
		UPDATE local_school_payment_gateways
		SET branch_id = ?, wing_id = ?, provider_key = ?, display_name = ?, category = ?,
		    account_title = ?, account_number = ?, iban = ?, raast_id = ?, bank_name = ?,
		    branch_code = ?, till_id = ?, biller_code = ?, merchant_id = ?,
		    merchant_secret_enc = ?, integrity_salt_enc = ?, webhook_url = ?,
		    fee_type = ?, fee_value = ?, verification_mode = ?, instructions = ?,
		    allowed_portals_json = ?, custom_fields_json = ?, is_enabled = ?, is_default = ?, sort_order = ?,
		    is_synced = 0, updated_at = ?
		WHERE id = ? AND tenant_id = ?
	`,
		firstNonEmpty(pickStr(body.BranchID, nullStrVal(existing.branchID)), "ALL"),
		firstNonEmpty(pickStr(body.WingID, nullStrVal(existing.wingID)), "ALL"),
		provKey, displayName, pickStr(body.Category, nullStrVal(existing.category)),
		pickStr(body.AccountTitle, nullStrVal(existing.accountTitle)),
		pickStr(body.AccountNumber, nullStrVal(existing.accountNumber)),
		pickStr(body.IBAN, nullStrVal(existing.iban)),
		pickStr(body.RaastID, nullStrVal(existing.raastID)),
		pickStr(body.BankName, nullStrVal(existing.bankName)),
		pickStr(body.BranchCode, nullStrVal(existing.branchCode)),
		pickStr(body.TillID, nullStrVal(existing.tillID)),
		pickStr(body.BillerCode, nullStrVal(existing.billerCode)),
		pickStr(body.MerchantID, nullStrVal(existing.merchantID)),
		secretEnc, saltEnc, webhookURL, feeType, feeValue, verMode,
		pickStr(body.Instructions, nullStrVal(existing.instructions)),
		allowedPortalsJSON, customFieldsJSON, isEnabled, boolToInt(isDefault), sortOrder, now, id, tid,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update payment gateway.")
		return
	}

	updatedRow, err := scanSchoolGatewayRow(db.QueryRow(`SELECT `+schoolGatewaySelectCols+` FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?`, id, tid))
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to reload gateway.")
		return
	}
	gw := mapSchoolGatewayRow(db, updatedRow, tid, true, maps)
	recordSchoolAudit(
		db, tid, gw.BranchID, gw.WingID,
		firstNonEmpty(r.Header.Get("X-User-Name"), "School Owner"), "School Owner",
		"Fee Collection Receipt", "Financial", id,
		fmt.Sprintf("Updated Payment Gateway: %s", gw.DisplayName),
		fmt.Sprintf("Owner updated gateway settings/credentials (%s) · Enabled: %t · Default: %t.", gw.ProviderKey, gw.IsEnabled, gw.IsDefault),
		"Authorized Override",
	)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"gateway": gw,
	})
}

func handleSchoolToggleGateway(w http.ResponseWriter, r *http.Request, id string) {
	if !requireSchoolOwnerRole(w, r) {
		return
	}
	var body struct {
		TenantID  string `json:"tenantId"`
		IsEnabled *bool  `json:"isEnabled"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	tid := resolveSchoolTenantID(r, body.TenantID)

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()
	ensureSchoolPaymentGatewaysSeeded(db, tid)
	maps := getSchoolBranchWingMaps(db, tid)

	existing, scanErr := scanSchoolGatewayRow(db.QueryRow(`SELECT `+schoolGatewaySelectCols+` FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?`, id, tid))
	if scanErr == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Payment gateway not found.")
		return
	}
	if scanErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to lookup gateway.")
		return
	}

	nextEnabled := 1
	if body.IsEnabled != nil {
		nextEnabled = boolToInt(*body.IsEnabled)
	} else if nullIntVal(existing.isEnabled, 1) == 1 {
		nextEnabled = 0
	}
	now := time.Now().UTC().Format(time.RFC3339)
	_, _ = db.Exec(`UPDATE local_school_payment_gateways SET is_enabled = ?, is_synced = 0, updated_at = ? WHERE id = ? AND tenant_id = ?`, nextEnabled, now, id, tid)

	updated, err := scanSchoolGatewayRow(db.QueryRow(`SELECT `+schoolGatewaySelectCols+` FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?`, id, tid))
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to reload gateway.")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"gateway": mapSchoolGatewayRow(db, updated, tid, true, maps),
	})
}

func handleSchoolDeleteGateway(w http.ResponseWriter, r *http.Request, id string) {
	if !requireSchoolOwnerRole(w, r) {
		return
	}
	tid := resolveSchoolTenantID(r, "")

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()
	_ = school.EnsureSchoolPhase3Schema(db)

	var displayName sql.NullString
	var isDefault sql.NullInt64
	err = db.QueryRow(`SELECT display_name, is_default FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?`, id, tid).Scan(&displayName, &isDefault)
	if err == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Payment gateway not found.")
		return
	}
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to lookup gateway.")
		return
	}

	_, _ = db.Exec(`DELETE FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?`, id, tid)
	if nullIntVal(isDefault, 0) == 1 {
		var nextID string
		if db.QueryRow(`SELECT id FROM local_school_payment_gateways WHERE tenant_id = ? AND is_enabled = 1 ORDER BY sort_order ASC LIMIT 1`, tid).Scan(&nextID) == nil && nextID != "" {
			_, _ = db.Exec(`UPDATE local_school_payment_gateways SET is_default = 1, is_synced = 0 WHERE id = ?`, nextID)
		}
	}

	recordSchoolAudit(
		db, tid, school.DefaultBranchID, school.DefaultWingID,
		firstNonEmpty(r.Header.Get("X-User-Name"), "School Owner"), "School Owner",
		"Fee Voucher Deletion", "Financial", id,
		fmt.Sprintf("Deleted Payment Gateway: %s", nullStrVal(displayName)),
		"", "Compliance Flag",
	)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok": true,
		"id": id,
	})
}

type schoolGatewaySettingsReq struct {
	TenantID                  string                 `json:"tenantId"`
	Currency                  *string                `json:"currency"`
	AllowOnlineStudentPayment *bool                  `json:"allowOnlineStudentPayment"`
	AllowOnlineParentPayment  *bool                  `json:"allowOnlineParentPayment"`
	AllowPartialOnlinePayment *bool                  `json:"allowPartialOnlinePayment"`
	RequireProofReference     *bool                  `json:"requireProofReference"`
	AutoIssueReceiptOnVerify  *bool                  `json:"autoIssueReceiptOnVerify"`
	OneBillPrefix             *string                `json:"oneBillPrefix"`
	LateFeeGraceDays          *float64               `json:"lateFeeGraceDays"`
	LateFeeFinePkr            *float64               `json:"lateFeeFinePkr"`
	ReceiptFooterNote         *string                `json:"receiptFooterNote"`
	OwnerNotifyOnPayment      *bool                  `json:"ownerNotifyOnPayment"`
	CustomPolicyFields        []school.CustomFieldKV `json:"customPolicyFields"`
	HasCustomPolicyFields     bool                   `json:"-"`
}

func handleSchoolPaymentGatewaySettings(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	if r.Method != http.MethodPut {
		writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only PUT is allowed.")
		return
	}
	if !requireSchoolOwnerRole(w, r) {
		return
	}

	var buf json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&buf); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	var body schoolGatewaySettingsReq
	if err := json.Unmarshal(buf, &body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	var rawMap map[string]json.RawMessage
	_ = json.Unmarshal(buf, &rawMap)
	if _, ok := rawMap["customPolicyFields"]; ok {
		body.HasCustomPolicyFields = true
	}

	tid := resolveSchoolTenantID(r, body.TenantID)
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()

	current := loadSchoolGatewaySettings(db, tid)
	if body.LateFeeGraceDays != nil {
		if math.IsNaN(*body.LateFeeGraceDays) || *body.LateFeeGraceDays < 0 {
			writePhase3Error(w, http.StatusBadRequest, "", "Late fee grace days and fine amount must be non-negative.")
			return
		}
		current.LateFeeGraceDays = *body.LateFeeGraceDays
	}
	if body.LateFeeFinePkr != nil {
		if math.IsNaN(*body.LateFeeFinePkr) || *body.LateFeeFinePkr < 0 {
			writePhase3Error(w, http.StatusBadRequest, "", "Late fee grace days and fine amount must be non-negative.")
			return
		}
		current.LateFeeFinePkr = *body.LateFeeFinePkr
	}
	if body.Currency != nil && strings.TrimSpace(*body.Currency) != "" {
		c := strings.TrimSpace(*body.Currency)
		if len(c) > 8 {
			c = c[:8]
		}
		current.Currency = c
	}
	if body.AllowOnlineStudentPayment != nil {
		current.AllowOnlineStudentPayment = *body.AllowOnlineStudentPayment
	}
	if body.AllowOnlineParentPayment != nil {
		current.AllowOnlineParentPayment = *body.AllowOnlineParentPayment
	}
	if body.AllowPartialOnlinePayment != nil {
		current.AllowPartialOnlinePayment = *body.AllowPartialOnlinePayment
	}
	if body.RequireProofReference != nil {
		current.RequireProofReference = *body.RequireProofReference
	}
	if body.AutoIssueReceiptOnVerify != nil {
		current.AutoIssueReceiptOnVerify = *body.AutoIssueReceiptOnVerify
	}
	if body.OneBillPrefix != nil {
		current.OneBillPrefix = strings.TrimSpace(*body.OneBillPrefix)
	}
	if body.ReceiptFooterNote != nil {
		current.ReceiptFooterNote = strings.TrimSpace(*body.ReceiptFooterNote)
	}
	if body.OwnerNotifyOnPayment != nil {
		current.OwnerNotifyOnPayment = *body.OwnerNotifyOnPayment
	}
	if body.HasCustomPolicyFields && body.CustomPolicyFields != nil {
		cleaned := make([]school.CustomFieldKV, 0)
		for _, f := range body.CustomPolicyFields {
			if lbl := strings.TrimSpace(f.Label); lbl != "" {
				cleaned = append(cleaned, school.CustomFieldKV{Label: lbl, Value: strings.TrimSpace(f.Value)})
			}
		}
		current.CustomPolicyFields = cleaned
	}

	encoded, _ := json.Marshal(current)
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = db.Exec(`
		INSERT OR REPLACE INTO local_school_gateway_settings (tenant_id, settings_json, is_synced, updated_at)
		VALUES (?, ?, 0, ?)
	`, tid, string(encoded), now)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to save gateway settings.")
		return
	}

	recordSchoolAudit(
		db, tid, school.DefaultBranchID, school.DefaultWingID,
		firstNonEmpty(r.Header.Get("X-User-Name"), "School Owner"), "School Owner",
		"Fee Collection Receipt", "Financial", "PGW-SETTINGS-"+tid,
		"Updated School Payment Gateway Policy & Settings",
		fmt.Sprintf("StudentOnline=%t, ParentOnline=%t, RequireProof=%t, 1BillPrefix=%s", current.AllowOnlineStudentPayment, current.AllowOnlineParentPayment, current.RequireProofReference, current.OneBillPrefix),
		"Authorized Override",
	)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":       true,
		"settings": current,
	})
}

// --- /api/school/payment-transactions ---
func handleSchoolPaymentTransactionsCollection(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		handleSchoolGetTransactions(w, r)
	case http.MethodPost:
		handleSchoolCreateTransaction(w, r)
	default:
		writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed.")
	}
}

func handleSchoolGetTransactions(w http.ResponseWriter, r *http.Request) {
	tid := resolveSchoolTenantID(r, "")
	scope := resolveSchoolScope(r, "", "")
	if scope.ErrorStatus != 0 {
		writePhase3Error(w, scope.ErrorStatus, scope.ErrorCode, scope.ErrorMessage)
		return
	}
	filterGatewayID := strings.TrimSpace(r.URL.Query().Get("gatewayId"))
	filterStatus := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("status")))
	filterStudentID := strings.TrimSpace(r.URL.Query().Get("studentId"))
	filterQ := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)

	transactions := make([]school.SchoolPaymentTransaction, 0)
	if err == nil {
		defer db.Close()
		_ = school.EnsureSchoolPhase3Schema(db)
		maps := getSchoolBranchWingMaps(db, tid)
		scopeClause, scopeParams := buildSchoolScopeSQL(scope)
		args := append([]interface{}{tid}, scopeParams...)
		rows, qErr := db.Query(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE tenant_id = ?`+scopeClause+` ORDER BY created_at DESC`, args...)
		if qErr == nil {
			defer rows.Close()
			for rows.Next() {
				if row, scanErr := scanSchoolTxnRow(rows); scanErr == nil {
					transactions = append(transactions, mapSchoolTxnRow(db, row, tid, maps))
				}
			}
		}
	}

	filtered := make([]school.SchoolPaymentTransaction, 0, len(transactions))
	byGateway := make(map[string]*school.SchoolGatewayBucket)
	var totalVerified, totalPending float64
	var verifiedCnt, pendingCnt, rejectedCnt int

	for _, tx := range transactions {
		st := strings.ToUpper(strings.TrimSpace(tx.Status))
		bucket := byGateway[tx.GatewayID]
		if bucket == nil {
			bucket = &school.SchoolGatewayBucket{
				GatewayID:   tx.GatewayID,
				GatewayName: tx.GatewayName,
				ProviderKey: tx.ProviderKey,
			}
			byGateway[tx.GatewayID] = bucket
		}
		bucket.TotalCount++
		switch st {
		case "VERIFIED", "SETTLED":
			totalVerified += tx.TotalAmount
			verifiedCnt++
			bucket.VerifiedAmount += tx.TotalAmount
			bucket.VerifiedCount++
		case "PENDING_VERIFICATION":
			totalPending += tx.TotalAmount
			pendingCnt++
			bucket.PendingAmount += tx.TotalAmount
			bucket.PendingCount++
		case "REJECTED":
			rejectedCnt++
		}

		if filterGatewayID != "" && tx.GatewayID != filterGatewayID {
			continue
		}
		if filterStatus != "" && filterStatus != "ALL" && st != filterStatus {
			continue
		}
		if filterStudentID != "" && tx.StudentID != filterStudentID {
			continue
		}
		if filterQ != "" {
			hay := strings.ToLower(strings.Join([]string{
				tx.TxnRef, tx.ChallanNo, tx.StudentName, tx.RollNo, tx.Grade, tx.GatewayName, tx.ProofReference,
			}, " "))
			if !strings.Contains(hay, filterQ) {
				continue
			}
		}
		filtered = append(filtered, tx)
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":           true,
		"tenantId":     tid,
		"transactions": filtered,
		"summary": school.SchoolTransactionSummary{
			TotalCount:          len(transactions),
			VerifiedCount:       verifiedCnt,
			PendingCount:        pendingCnt,
			RejectedCount:       rejectedCnt,
			TotalVerifiedAmount: totalVerified,
			TotalPendingAmount:  totalPending,
			ByGateway:           byGateway,
		},
	})
}

type schoolCreateTxnReq struct {
	TenantID          string                 `json:"tenantId"`
	BranchID          string                 `json:"branchId"`
	WingID            string                 `json:"wingId"`
	GatewayID         string                 `json:"gatewayId"`
	StudentID         string                 `json:"studentId"`
	StudentName       string                 `json:"studentName"`
	RollNo            string                 `json:"rollNo"`
	Grade             string                 `json:"grade"`
	GuardianName      string                 `json:"guardianName"`
	PayerPhone        string                 `json:"payerPhone"`
	PayerAccountTitle string                 `json:"payerAccountTitle"`
	Month             string                 `json:"month"`
	ChallanNo         string                 `json:"challanNo"`
	TxnRef            string                 `json:"txnRef"`
	BaseAmount        *float64               `json:"baseAmount"`
	Amount            *float64               `json:"amount"`
	ProofReference    string                 `json:"proofReference"`
	ResourceReference string                 `json:"resourceReference"`
	ProofNotes        string                 `json:"proofNotes"`
	ProofScreenshot   string                 `json:"proofScreenshot"`
	SubmittedByName   string                 `json:"submittedByName"`
	Status            string                 `json:"status"`
	AllowDuplicate    bool                   `json:"allowDuplicate"`
	MarkVerified      bool                   `json:"markVerified"`
	CustomFields      map[string]interface{} `json:"customFields"`
}

func handleSchoolCreateTransaction(w http.ResponseWriter, r *http.Request) {
	var body schoolCreateTxnReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}

	tid := resolveSchoolTenantID(r, body.TenantID)
	scope := resolveSchoolScope(r, body.BranchID, body.WingID)
	if scope.ErrorStatus != 0 {
		writePhase3Error(w, scope.ErrorStatus, scope.ErrorCode, scope.ErrorMessage)
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

	ensureSchoolPaymentGatewaysSeeded(db, tid)
	maps := getSchoolBranchWingMaps(db, tid)
	settings := loadSchoolGatewaySettings(db, tid)

	reqRole := resolveSchoolUserRole(r)
	if reqRole == "" {
		reqRole = "owner"
	}
	isOwner := schoolOwnerRoles[reqRole]
	isSelfPortal := reqRole == "student" || reqRole == "parent"

	if reqRole == "student" && !settings.AllowOnlineStudentPayment {
		writePhase3Error(w, http.StatusForbidden, "STUDENT_ONLINE_PAY_DISABLED", "Online fee payments are currently disabled for the Student Portal by the School Owner.")
		return
	}
	if reqRole == "parent" && !settings.AllowOnlineParentPayment {
		writePhase3Error(w, http.StatusForbidden, "PARENT_ONLINE_PAY_DISABLED", "Online fee payments are currently disabled for the Parent Portal by the School Owner.")
		return
	}

	gwID := strings.TrimSpace(body.GatewayID)
	var gwRow schoolGatewayDBRow
	var gwErr error
	if gwID != "" {
		gwRow, gwErr = scanSchoolGatewayRow(db.QueryRow(`SELECT `+schoolGatewaySelectCols+` FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ? LIMIT 1`, gwID, tid))
	} else {
		gwRow, gwErr = scanSchoolGatewayRow(db.QueryRow(`SELECT `+schoolGatewaySelectCols+` FROM local_school_payment_gateways WHERE tenant_id = ? AND is_enabled = 1 ORDER BY is_default DESC, sort_order ASC LIMIT 1`, tid))
	}
	if gwErr == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Selected payment gateway not found.")
		return
	}
	if gwErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load selected payment gateway.")
		return
	}
	if nullIntVal(gwRow.isEnabled, 1) == 0 {
		writePhase3Error(w, http.StatusBadRequest, "", fmt.Sprintf("%s is currently disabled by the School Owner.", nullStrVal(gwRow.displayName)))
		return
	}

	allowedPortals := []string{"owner", "principal", "accountant", "student", "parent"}
	if raw := strings.TrimSpace(nullStrVal(gwRow.allowedPortals)); raw != "" {
		var parsed []string
		if json.Unmarshal([]byte(raw), &parsed) == nil && len(parsed) > 0 {
			allowedPortals = parsed
		}
	}
	if !isOwner {
		allowed := false
		for _, p := range allowedPortals {
			if p == reqRole {
				allowed = true
				break
			}
		}
		if !allowed {
			writePhase3Error(w, http.StatusForbidden, "PORTAL_GATEWAY_RESTRICTED", fmt.Sprintf("%s is not enabled for the %s portal.", nullStrVal(gwRow.displayName), reqRole))
			return
		}
	}

	studentName := strings.TrimSpace(body.StudentName)
	baseAmount := 0.0
	if body.BaseAmount != nil {
		baseAmount = *body.BaseAmount
	} else if body.Amount != nil {
		baseAmount = *body.Amount
	}
	if studentName == "" || math.IsNaN(baseAmount) || math.IsInf(baseAmount, 0) || baseAmount <= 0 {
		writePhase3Error(w, http.StatusBadRequest, "", "Valid studentName and positive baseAmount are required.")
		return
	}

	proofRef := firstNonEmpty(strings.TrimSpace(body.ProofReference), strings.TrimSpace(body.ResourceReference))
	if isSelfPortal && nullStrVal(gwRow.verificationMode) == "slip_review" && settings.RequireProofReference && proofRef == "" {
		writePhase3Error(w, http.StatusBadRequest, "", "Transaction / Slip Reference ID is required by School Owner policy for verification.")
		return
	}

	shot, shotErr := school.ValidateProofScreenshot(body.ProofScreenshot)
	if shotErr != "" {
		writePhase3Error(w, http.StatusBadRequest, "", shotErr)
		return
	}

	challanNo := strings.TrimSpace(body.ChallanNo)
	if challanNo == "" {
		suffix := strings.TrimSpace(body.RollNo)
		if suffix == "" {
			ts := fmt.Sprintf("%d", time.Now().UnixMilli())
			if len(ts) > 4 {
				suffix = ts[len(ts)-4:]
			} else {
				suffix = ts
			}
		}
		challanNo = "CH-2026-" + suffix
	}
	targetStudentID := strings.TrimSpace(body.StudentID)

	if !body.AllowDuplicate {
		if challanNo != "" {
			var paidTxnRef string
			hasPaidTxn := db.QueryRow(
				`SELECT txn_ref FROM local_school_payment_transactions WHERE tenant_id = ? AND challan_no = ? AND UPPER(status) IN ('VERIFIED', 'SETTLED') LIMIT 1`,
				tid, challanNo,
			).Scan(&paidTxnRef) == nil

			var paidFeeID string
			hasPaidFee := db.QueryRow(
				`SELECT id FROM local_school_fees WHERE tenant_id = ? AND challan_no = ? AND UPPER(status) = 'PAID' LIMIT 1`,
				tid, challanNo,
			).Scan(&paidFeeID) == nil

			if hasPaidTxn || hasPaidFee {
				desc := "Settled Receipt"
				if hasPaidTxn {
					desc = "TXN " + paidTxnRef
				}
				writePhase3Error(w, http.StatusConflict, "ALREADY_PAID", fmt.Sprintf("Fee challan #%s is already paid (%s). Duplicate payment is blocked.", challanNo, desc))
				return
			}

			if isSelfPortal {
				var pendRef string
				if db.QueryRow(
					`SELECT txn_ref FROM local_school_payment_transactions WHERE tenant_id = ? AND challan_no = ? AND UPPER(status) = 'PENDING_VERIFICATION' AND ABS(base_amount - ?) < 0.01 LIMIT 1`,
					tid, challanNo, baseAmount,
				).Scan(&pendRef) == nil {
					writePhase3Error(w, http.StatusConflict, "PENDING_SLIP_EXISTS", fmt.Sprintf("A payment slip (%s) for challan #%s is already submitted and awaiting verification.", pendRef, challanNo))
					return
				}
			}
		}

		if isSelfPortal && targetStudentID != "" {
			var feeStatus sql.NullString
			var dueBakaya sql.NullFloat64
			hasStu := db.QueryRow(`SELECT fee_status, due_bakaya FROM local_school_students WHERE id = ? AND tenant_id = ? LIMIT 1`, targetStudentID, tid).Scan(&feeStatus, &dueBakaya) == nil
			var openFeeID string
			hasOpen := db.QueryRow(`SELECT id FROM local_school_fees WHERE tenant_id = ? AND student_id = ? AND UPPER(status) IN ('PENDING', 'OVERDUE', 'PARTIAL') LIMIT 1`, tid, targetStudentID).Scan(&openFeeID) == nil
			if hasStu && strings.EqualFold(nullStrVal(feeStatus), "PAID") && nullFloatVal(dueBakaya, 0) <= 0 && !hasOpen {
				writePhase3Error(w, http.StatusConflict, "STUDENT_ALREADY_PAID", fmt.Sprintf("%s's fee is already marked Paid. No additional payment is required.", studentName))
				return
			}
		}
	}

	gwFee := school.CalculateGatewayFee(nullStrVal(gwRow.feeType), nullFloatVal(gwRow.feeValue, 0), baseAmount)
	totalAmount := baseAmount + gwFee

	verMode := firstNonEmpty(nullStrVal(gwRow.verificationMode), "slip_review")
	resolvedStatus := "PENDING_VERIFICATION"
	if isSelfPortal {
		if verMode == "auto_instant" {
			resolvedStatus = "VERIFIED"
		}
	} else {
		requested := strings.ToUpper(strings.TrimSpace(body.Status))
		if requested == "VERIFIED" || requested == "SETTLED" || requested == "PENDING_VERIFICATION" {
			resolvedStatus = requested
		} else if verMode == "slip_review" && !body.MarkVerified {
			resolvedStatus = "PENDING_VERIFICATION"
		} else {
			resolvedStatus = "VERIFIED"
		}
	}

	id := fmt.Sprintf("PGTX-%d-%s", time.Now().UnixMilli(), randomHexToken(2))
	provUpper := strings.ToUpper(nullStrVal(gwRow.providerKey))
	if len(provUpper) > 4 {
		provUpper = provUpper[:4]
	}
	txnRef := strings.TrimSpace(body.TxnRef)
	if txnRef == "" {
		txnRef = fmt.Sprintf("%s-%s", provUpper, strings.ToUpper(randomHexToken(3)))
	}
	branchID := firstNonEmpty(strings.TrimSpace(body.BranchID), scope.WriteBranchID, school.DefaultBranchID)
	wingID := firstNonEmpty(strings.TrimSpace(body.WingID), scope.WriteWingID, school.DefaultWingID)
	submittedBy := firstNonEmpty(strings.TrimSpace(body.SubmittedByName), strings.TrimSpace(r.Header.Get("X-User-Name")), studentName)
	now := time.Now().UTC().Format(time.RFC3339)

	verifiedBy := ""
	verifiedAt := ""
	if resolvedStatus == "VERIFIED" || resolvedStatus == "SETTLED" {
		verifiedBy = submittedBy
		verifiedAt = now
	}
	customFieldsJSON := "{}"
	if body.CustomFields != nil {
		if b, mErr := json.Marshal(body.CustomFields); mErr == nil {
			customFieldsJSON = string(b)
		}
	}

	_, err = db.Exec(`
		INSERT INTO local_school_payment_transactions (
			id, tenant_id, branch_id, wing_id, txn_ref, challan_no, gateway_id, gateway_name, provider_key,
			student_id, student_name, roll_no, grade, guardian_name, payer_phone, payer_account_title,
			month, base_amount, gateway_fee, total_amount, currency, status, verification_mode,
			proof_reference, proof_notes, proof_screenshot, submitted_by_name, submitted_by_role, verified_by, verified_at,
			rejection_reason, linked_fee_id, custom_fields_json, is_synced, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, 0, ?, ?)
	`,
		id, tid, branchID, wingID, txnRef, challanNo, nullStrVal(gwRow.id), nullStrVal(gwRow.displayName), nullStrVal(gwRow.providerKey),
		targetStudentID, vaultEncryptField(db, tid, studentName), body.RollNo, firstNonEmpty(body.Grade, "Campus"),
		vaultEncryptField(db, tid, body.GuardianName), vaultEncryptField(db, tid, body.PayerPhone), vaultEncryptField(db, tid, body.PayerAccountTitle),
		firstNonEmpty(body.Month, "Current Session Fee"), baseAmount, gwFee, totalAmount, firstNonEmpty(settings.Currency, "PKR"),
		resolvedStatus, verMode, proofRef, body.ProofNotes, shot, submittedBy, reqRole, verifiedBy, verifiedAt,
		customFieldsJSON, now, now,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to save payment transaction.")
		return
	}

	linkedFeeID := ""
	if resolvedStatus == "VERIFIED" || resolvedStatus == "SETTLED" {
		if insRow, qErr := scanSchoolTxnRow(db.QueryRow(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid)); qErr == nil {
			linkedFeeID = settleSchoolFeeForGatewayTransaction(db, tid, insRow, firstNonEmpty(verifiedBy, submittedBy), reqRole, scope)
			if linkedFeeID != "" {
				_, _ = db.Exec(`UPDATE local_school_payment_transactions SET linked_fee_id = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?`, linkedFeeID, id, tid)
			}
		}
	}

	finalRow, err := scanSchoolTxnRow(db.QueryRow(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid))
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load recorded payment transaction.")
		return
	}
	tx := mapSchoolTxnRow(db, finalRow, tid, maps)
	opRole := "School Owner"
	if reqRole == "accountant" {
		opRole = "Accountant / Fee Clerk"
	} else if reqRole == "principal" {
		opRole = "Principal"
	}
	shotNote := ""
	if shot != "" {
		shotNote = " · Slip Screenshot Attached"
	}
	recordSchoolAudit(
		db, tid, branchID, wingID, submittedBy, opRole,
		"Fee Collection Receipt", "Financial", txnRef,
		fmt.Sprintf("%s (%s) via %s", studentName, tx.Grade, nullStrVal(gwRow.displayName)),
		fmt.Sprintf("Gateway payment PKR %.0f (Base %.0f + Fee %.0f) · Ref: %s%s · Status: %s.", totalAmount, baseAmount, gwFee, firstNonEmpty(proofRef, txnRef), shotNote, resolvedStatus),
		"Normal Audit",
	)

	writeAPIJSON(w, http.StatusCreated, map[string]interface{}{
		"ok":          true,
		"transaction": tx,
		"linkedFeeId": linkedFeeID,
	})
}

func handleSchoolPaymentTransactionItem(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	rel := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/school/payment-transactions/"), "/")
	if rel == "" {
		writePhase3Error(w, http.StatusNotFound, "NOT_FOUND", "Transaction ID required.")
		return
	}
	parts := strings.Split(rel, "/")

	if len(parts) == 2 && parts[1] == "verify" {
		if r.Method != http.MethodPut {
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only PUT is allowed.")
			return
		}
		handleSchoolVerifyTransaction(w, r, parts[0])
		return
	}

	if len(parts) == 1 {
		id := parts[0]
		switch r.Method {
		case http.MethodPut:
			handleSchoolUpdateTransaction(w, r, id)
		case http.MethodDelete:
			handleSchoolDeleteTransaction(w, r, id)
		default:
			writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed.")
		}
		return
	}

	writePhase3Error(w, http.StatusNotFound, "NOT_FOUND", "Unknown payment transaction endpoint.")
}

func handleSchoolVerifyTransaction(w http.ResponseWriter, r *http.Request, id string) {
	role := resolveSchoolUserRole(r)
	if role == "student" || role == "parent" || role == "teacher" {
		writePhase3Error(w, http.StatusForbidden, "ROLE_FORBIDDEN", fmt.Sprintf("Role '%s' is not authorized to perform this administrative action.", role))
		return
	}

	var body struct {
		TenantID        string `json:"tenantId"`
		Status          string `json:"status"`
		VerifiedBy      string `json:"verifiedBy"`
		RejectionReason string `json:"rejectionReason"`
		Notes           string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil && err.Error() != "EOF" {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}

	tid := resolveSchoolTenantID(r, body.TenantID)
	scope := resolveSchoolScope(r, "", "")
	if scope.ErrorStatus != 0 {
		writePhase3Error(w, scope.ErrorStatus, scope.ErrorCode, scope.ErrorMessage)
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
	_ = school.EnsureSchoolPhase3Schema(db)
	maps := getSchoolBranchWingMaps(db, tid)

	row, scanErr := scanSchoolTxnRow(db.QueryRow(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid))
	if scanErr == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Payment transaction not found.")
		return
	}
	if scanErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load transaction.")
		return
	}
	if sCode, sErr, sMsg := assertSchoolRecordScope(scope, nullStrVal(row.branchID), nullStrVal(row.wingID)); sCode != 0 {
		writePhase3Error(w, sCode, sErr, sMsg)
		return
	}

	nextStatus := strings.ToUpper(strings.TrimSpace(body.Status))
	if nextStatus == "" {
		nextStatus = "VERIFIED"
	}
	if nextStatus != "VERIFIED" && nextStatus != "SETTLED" && nextStatus != "REJECTED" && nextStatus != "PENDING_VERIFICATION" {
		writePhase3Error(w, http.StatusBadRequest, "", "Invalid verification status.")
		return
	}

	reqRole := firstNonEmpty(role, "accountant")
	defaultVerifier := "Accountant Desk"
	if reqRole == "owner" {
		defaultVerifier = "School Owner"
	} else if reqRole == "principal" {
		defaultVerifier = "Principal Office"
	}
	verifierName := firstNonEmpty(strings.TrimSpace(body.VerifiedBy), strings.TrimSpace(r.Header.Get("X-User-Name")), defaultVerifier)
	rejectionReason := ""
	if nextStatus == "REJECTED" {
		rejectionReason = firstNonEmpty(strings.TrimSpace(body.RejectionReason), strings.TrimSpace(body.Notes), "Transaction reference not matched in bank/wallet statement.")
	}
	now := time.Now().UTC().Format(time.RFC3339)

	linkedFeeID := nullStrVal(row.linkedFeeID)
	if (nextStatus == "VERIFIED" || nextStatus == "SETTLED") && linkedFeeID == "" {
		settings := loadSchoolGatewaySettings(db, tid)
		if settings.AutoIssueReceiptOnVerify {
			linkedFeeID = settleSchoolFeeForGatewayTransaction(db, tid, row, verifierName, reqRole, scope)
		}
	}

	_, err = db.Exec(`
		UPDATE local_school_payment_transactions
		SET status = ?, verified_by = ?, verified_at = ?, rejection_reason = ?, linked_fee_id = ?, is_synced = 0, updated_at = ?
		WHERE id = ? AND tenant_id = ?
	`, nextStatus, verifierName, now, rejectionReason, linkedFeeID, now, id, tid)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update verification status.")
		return
	}

	updated, err := scanSchoolTxnRow(db.QueryRow(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid))
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to reload transaction.")
		return
	}
	tx := mapSchoolTxnRow(db, updated, tid, maps)
	severity := "Normal Audit"
	if nextStatus == "REJECTED" {
		severity = "Compliance Flag"
	}
	opRole := "School Owner"
	if reqRole == "accountant" {
		opRole = "Accountant / Fee Clerk"
	} else if reqRole == "principal" {
		opRole = "Principal"
	}
	details := fmt.Sprintf("%s PKR %.0f marked %s by %s.", tx.GatewayName, tx.TotalAmount, nextStatus, verifierName)
	if rejectionReason != "" {
		details += " Reason: " + rejectionReason
	}
	recordSchoolAudit(db, tid, firstNonEmpty(nullStrVal(updated.branchID), scope.WriteBranchID), firstNonEmpty(nullStrVal(updated.wingID), scope.WriteWingID), verifierName, opRole, "Fee Collection Receipt", "Financial", nullStrVal(updated.txnRef), fmt.Sprintf("Gateway Txn %s: %s", nextStatus, tx.StudentName), details, severity)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":          true,
		"transaction": tx,
		"linkedFeeId": linkedFeeID,
	})
}

func handleSchoolUpdateTransaction(w http.ResponseWriter, r *http.Request, id string) {
	if !requireSchoolOwnerRole(w, r) {
		return
	}
	var body struct {
		TenantID        string   `json:"tenantId"`
		StudentName     *string  `json:"studentName"`
		Grade           *string  `json:"grade"`
		ChallanNo       *string  `json:"challanNo"`
		BaseAmount      *float64 `json:"baseAmount"`
		GatewayFee      *float64 `json:"gatewayFee"`
		ProofReference  *string  `json:"proofReference"`
		ProofNotes      *string  `json:"proofNotes"`
		ProofScreenshot *string  `json:"proofScreenshot"`
		Status          *string  `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writePhase3Error(w, http.StatusBadRequest, "BAD_JSON", "Invalid JSON body.")
		return
	}
	tid := resolveSchoolTenantID(r, body.TenantID)
	scope := resolveSchoolScope(r, "", "")
	if scope.ErrorStatus != 0 {
		writePhase3Error(w, scope.ErrorStatus, scope.ErrorCode, scope.ErrorMessage)
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
	_ = school.EnsureSchoolPhase3Schema(db)
	maps := getSchoolBranchWingMaps(db, tid)

	row, scanErr := scanSchoolTxnRow(db.QueryRow(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid))
	if scanErr == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Payment transaction not found.")
		return
	}
	if scanErr != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load transaction.")
		return
	}

	baseAmount := nullFloatVal(row.baseAmount, 0)
	if body.BaseAmount != nil {
		baseAmount = *body.BaseAmount
	}
	gatewayFee := nullFloatVal(row.gatewayFee, 0)
	if body.GatewayFee != nil {
		gatewayFee = *body.GatewayFee
	}
	if math.IsNaN(baseAmount) || baseAmount <= 0 || math.IsNaN(gatewayFee) || gatewayFee < 0 {
		writePhase3Error(w, http.StatusBadRequest, "", "Invalid transaction amount values.")
		return
	}

	nextScreenshot := nullStrVal(row.proofScreenshot)
	if body.ProofScreenshot != nil {
		cleaned, sErr := school.ValidateProofScreenshot(*body.ProofScreenshot)
		if sErr != "" {
			writePhase3Error(w, http.StatusBadRequest, "", sErr)
			return
		}
		nextScreenshot = cleaned
	}

	stuEnc := nullStrVal(row.studentName)
	if body.StudentName != nil {
		stuEnc = vaultEncryptField(db, tid, *body.StudentName)
	}
	pickStr := func(p *string, def string) string {
		if p != nil {
			return *p
		}
		return def
	}
	nextStatus := nullStrVal(row.status)
	if body.Status != nil {
		nextStatus = strings.ToUpper(strings.TrimSpace(*body.Status))
	}
	totalAmount := baseAmount + gatewayFee
	now := time.Now().UTC().Format(time.RFC3339)

	_, err = db.Exec(`
		UPDATE local_school_payment_transactions
		SET student_name = ?, grade = ?, challan_no = ?, base_amount = ?, gateway_fee = ?, total_amount = ?,
		    proof_reference = ?, proof_notes = ?, proof_screenshot = ?, status = ?, is_synced = 0, updated_at = ?
		WHERE id = ? AND tenant_id = ?
	`,
		stuEnc,
		pickStr(body.Grade, nullStrVal(row.grade)),
		pickStr(body.ChallanNo, nullStrVal(row.challanNo)),
		baseAmount, gatewayFee, totalAmount,
		pickStr(body.ProofReference, nullStrVal(row.proofReference)),
		pickStr(body.ProofNotes, nullStrVal(row.proofNotes)),
		nextScreenshot, nextStatus, now, id, tid,
	)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update transaction.")
		return
	}

	updated, err := scanSchoolTxnRow(db.QueryRow(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid))
	if err == nil && (nextStatus == "VERIFIED" || nextStatus == "SETTLED") && nullStrVal(updated.linkedFeeID) == "" {
		verifier := firstNonEmpty(r.Header.Get("X-User-Name"), "School Owner")
		if linked := settleSchoolFeeForGatewayTransaction(db, tid, updated, verifier, "owner", scope); linked != "" {
			_, _ = db.Exec(`UPDATE local_school_payment_transactions SET linked_fee_id = ?, verified_by = COALESCE(NULLIF(verified_by, ''), ?), verified_at = COALESCE(NULLIF(verified_at, ''), ?), is_synced = 0 WHERE id = ? AND tenant_id = ?`, linked, verifier, now, id, tid)
			updated, _ = scanSchoolTxnRow(db.QueryRow(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid))
		}
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":          true,
		"transaction": mapSchoolTxnRow(db, updated, tid, maps),
	})
}

func handleSchoolDeleteTransaction(w http.ResponseWriter, r *http.Request, id string) {
	if !requireSchoolOwnerRole(w, r) {
		return
	}
	tid := resolveSchoolTenantID(r, "")
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	db, err := openRegisterDB(ctx)
	if err != nil {
		writePhase3Error(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "Database unavailable")
		return
	}
	defer db.Close()
	_ = school.EnsureSchoolPhase3Schema(db)

	var branchID, wingID, txnRef, studentName sql.NullString
	err = db.QueryRow(`SELECT branch_id, wing_id, txn_ref, student_name FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid).Scan(&branchID, &wingID, &txnRef, &studentName)
	if err == sql.ErrNoRows {
		writePhase3Error(w, http.StatusNotFound, "", "Payment transaction not found.")
		return
	}
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to lookup transaction.")
		return
	}

	_, _ = db.Exec(`DELETE FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?`, id, tid)
	recordSchoolAudit(
		db, tid, firstNonEmpty(nullStrVal(branchID), school.DefaultBranchID), firstNonEmpty(nullStrVal(wingID), school.DefaultWingID),
		firstNonEmpty(r.Header.Get("X-User-Name"), "School Owner"), "School Owner",
		"Fee Voucher Deletion", "Financial", firstNonEmpty(nullStrVal(txnRef), id),
		fmt.Sprintf("Deleted Payment Transaction (%s)", vaultDecryptField(db, tid, nullStrVal(studentName))),
		"", "Compliance Flag",
	)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok": true,
		"id": id,
	})
}

// --- /api/school/barcode-lookup ---
func handleSchoolBarcodeLookup(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is allowed.")
		return
	}
	tid := resolveSchoolTenantID(r, "")
	scope := resolveSchoolScope(r, "", "")
	if scope.ErrorStatus != 0 {
		writePhase3Error(w, scope.ErrorStatus, scope.ErrorCode, scope.ErrorMessage)
		return
	}

	rawCode := strings.TrimSpace(r.URL.Query().Get("code"))
	if rawCode == "" {
		writePhase3Error(w, http.StatusBadRequest, "", "code query parameter is required.")
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
	_ = school.EnsureSchoolPhase3Schema(db)
	maps := getSchoolBranchWingMaps(db, tid)
	scopeClause, scopeParams := buildSchoolScopeSQL(scope)
	args := append([]interface{}{tid}, scopeParams...)

	norm := strings.ToLower(rawCode)
	candidateRoll := ""
	if m := schoolStrippedRollRe.FindStringSubmatch(rawCode); len(m) > 1 {
		candidateRoll = strings.ToLower(strings.TrimSpace(m[1]))
	}
	isExplicitEmp := schoolExplicitEmpRe.MatchString(rawCode)
	strippedEmp := strings.ToLower(strings.TrimSpace(schoolExplicitEmpRe.ReplaceAllString(rawCode, "")))

	// 1. Transactions
	allTxRows := make([]schoolTxnDBRow, 0)
	matchedTxns := make([]school.SchoolPaymentTransaction, 0)
	if rows, qErr := db.Query(`SELECT `+schoolTxnSelectCols+` FROM local_school_payment_transactions WHERE tenant_id = ?`+scopeClause+` ORDER BY created_at DESC`, args...); qErr == nil {
		defer rows.Close()
		for rows.Next() {
			if row, sErr := scanSchoolTxnRow(rows); sErr == nil {
				allTxRows = append(allTxRows, row)
				ref := strings.ToLower(strings.TrimSpace(nullStrVal(row.txnRef)))
				ch := strings.ToLower(strings.TrimSpace(nullStrVal(row.challanNo)))
				id := strings.ToLower(strings.TrimSpace(nullStrVal(row.id)))
				roll := strings.ToLower(strings.TrimSpace(nullStrVal(row.rollNo)))
				if ref == norm || ch == norm || id == norm || (roll != "" && (roll == norm || (candidateRoll != "" && roll == candidateRoll))) {
					matchedTxns = append(matchedTxns, mapSchoolTxnRow(db, row, tid, maps))
				}
			}
		}
	}

	// 2. Fees
	type schoolFeeObj map[string]interface{}
	type feeRec struct {
		id, challanNo, studentID, rollNo, status string
		mapped                                   schoolFeeObj
	}
	allFeeRecs := make([]feeRec, 0)
	matchedFees := make([]feeRec, 0)
	if rows, qErr := db.Query(`
		SELECT id, tenant_id, branch_id, wing_id, challan_no, student_id, student_name, roll_no, grade, month,
		       tuition, lab_fee, discount, total, paid_amount, status, payment_mode, resource_reference,
		       collected_by, collector_role, notes, due_date, paid_date, is_synced
		FROM local_school_fees WHERE tenant_id = ?`+scopeClause+` ORDER BY created_at DESC`, args...); qErr == nil {
		defer rows.Close()
		for rows.Next() {
			var (
				id, rTid, bID, wID, challanNo, sID, sName, rollNo, grade, month sql.NullString
				status, pMode, resRef, colBy, colRole, notes, dueDate, paidDate sql.NullString
				tuition, labFee, discount, total, paidAmt                       sql.NullFloat64
				isSynced                                                        sql.NullInt64
			)
			if rows.Scan(
				&id, &rTid, &bID, &wID, &challanNo, &sID, &sName, &rollNo, &grade, &month,
				&tuition, &labFee, &discount, &total, &paidAmt, &status, &pMode, &resRef,
				&colBy, &colRole, &notes, &dueDate, &paidDate, &isSynced,
			) == nil {
				rowTid := firstNonEmpty(nullStrVal(rTid), tid)
				branchID := firstNonEmpty(nullStrVal(bID), school.DefaultBranchID)
				wingID := firstNonEmpty(nullStrVal(wID), school.DefaultWingID)
				st := firstNonEmpty(nullStrVal(status), "PENDING")
				tot := nullFloatVal(total, 0)
				paidVal := tot
				if paidAmt.Valid {
					paidVal = paidAmt.Float64
				} else if !strings.EqualFold(st, "PAID") {
					paidVal = 0
				}
				obj := schoolFeeObj{
					"id":                nullStrVal(id),
					"tenantId":          rowTid,
					"branchId":          branchID,
					"branchName":        maps.branchName(branchID),
					"wingId":            wingID,
					"wingName":          maps.wingName(wingID),
					"challanNo":         nullStrVal(challanNo),
					"studentId":         nullStrVal(sID),
					"studentName":       vaultDecryptField(db, rowTid, nullStrVal(sName)),
					"rollNo":            nullStrVal(rollNo),
					"grade":             nullStrVal(grade),
					"month":             nullStrVal(month),
					"tuition":           nullFloatVal(tuition, 0),
					"labFee":            nullFloatVal(labFee, 0),
					"discount":          nullFloatVal(discount, 0),
					"total":             tot,
					"paidAmount":        paidVal,
					"status":            st,
					"paymentMode":       nullStrVal(pMode),
					"resourceReference": nullStrVal(resRef),
					"collectedBy":       nullStrVal(colBy),
					"collectorRole":     firstNonEmpty(nullStrVal(colRole), "owner"),
					"notes":             nullStrVal(notes),
					"dueDate":           nullStrVal(dueDate),
					"paidDate":          nullStrVal(paidDate),
					"isSynced":          nullIntVal(isSynced, 0) == 1,
				}
				rec := feeRec{
					id:        strings.ToLower(strings.TrimSpace(nullStrVal(id))),
					challanNo: strings.ToLower(strings.TrimSpace(nullStrVal(challanNo))),
					studentID: strings.ToLower(strings.TrimSpace(nullStrVal(sID))),
					rollNo:    strings.ToLower(strings.TrimSpace(nullStrVal(rollNo))),
					status:    strings.ToUpper(st),
					mapped:    obj,
				}
				allFeeRecs = append(allFeeRecs, rec)
				if rec.challanNo == norm || rec.id == norm || rec.studentID == norm ||
					(rec.rollNo != "" && (rec.rollNo == norm || (candidateRoll != "" && rec.rollNo == candidateRoll))) {
					matchedFees = append(matchedFees, rec)
				}
			}
		}
	}

	// 3. Students
	var studentObj map[string]interface{}
	var studentIDLower, studentRollLower string
	if !isExplicitEmp {
		type stuRec struct {
			idLower, rollLower, rfidLower string
			mapped                        map[string]interface{}
		}
		allStu := make([]stuRec, 0)
		if rows, qErr := db.Query(`
			SELECT id, tenant_id, branch_id, wing_id, roll_no, full_name, grade, section, gender, dob,
			       student_bform, passport_no, nationality, blood_group, guardian_name, guardian_relation,
			       guardian_cnic, guardian_occupation, guardian_email, phone, emergency_contact, address,
			       previous_school, medical_conditions, fee_amount, due_bakaya, fee_status, attendance_rate,
			       admission_date, status, rfid_card, is_synced
			FROM local_school_students WHERE tenant_id = ?`+scopeClause, args...); qErr == nil {
			defer rows.Close()
			for rows.Next() {
				var (
					id, rTid, bID, wID, rollNo, fullName, grade, section, gender, dob      sql.NullString
					bform, passport, nat, bg, gName, gRel, gCnic, gOcc, gEmail, phone      sql.NullString
					emerg, addr, prevSch, med, feeStatus, attRate, admDate, status, rfid   sql.NullString
					feeAmt, dueBak                                                         sql.NullFloat64
					isSynced                                                               sql.NullInt64
				)
				if rows.Scan(
					&id, &rTid, &bID, &wID, &rollNo, &fullName, &grade, &section, &gender, &dob,
					&bform, &passport, &nat, &bg, &gName, &gRel,
					&gCnic, &gOcc, &gEmail, &phone, &emerg, &addr,
					&prevSch, &med, &feeAmt, &dueBak, &feeStatus, &attRate,
					&admDate, &status, &rfid, &isSynced,
				) == nil {
					rowTid := firstNonEmpty(nullStrVal(rTid), tid)
					branchID := firstNonEmpty(nullStrVal(bID), school.DefaultBranchID)
					wingID := firstNonEmpty(nullStrVal(wID), school.DefaultWingID)
					obj := map[string]interface{}{
						"id":                 nullStrVal(id),
						"tenantId":           rowTid,
						"branchId":           branchID,
						"branchName":         maps.branchName(branchID),
						"wingId":             wingID,
						"wingName":           maps.wingName(wingID),
						"rollNo":             nullStrVal(rollNo),
						"fullName":           vaultDecryptField(db, rowTid, nullStrVal(fullName)),
						"grade":              nullStrVal(grade),
						"section":            firstNonEmpty(nullStrVal(section), "A"),
						"gender":             firstNonEmpty(nullStrVal(gender), "Male"),
						"dob":                nullStrVal(dob),
						"studentBForm":       vaultDecryptField(db, rowTid, nullStrVal(bform)),
						"passportNo":         vaultDecryptField(db, rowTid, nullStrVal(passport)),
						"nationality":        firstNonEmpty(nullStrVal(nat), "Pakistani"),
						"bloodGroup":         firstNonEmpty(nullStrVal(bg), "B+"),
						"guardianName":       vaultDecryptField(db, rowTid, nullStrVal(gName)),
						"guardianRelation":   firstNonEmpty(nullStrVal(gRel), "Father"),
						"guardianCnic":       vaultDecryptField(db, rowTid, nullStrVal(gCnic)),
						"guardianOccupation": nullStrVal(gOcc),
						"guardianEmail":      vaultDecryptField(db, rowTid, nullStrVal(gEmail)),
						"phone":              vaultDecryptField(db, rowTid, nullStrVal(phone)),
						"emergencyContact":   vaultDecryptField(db, rowTid, nullStrVal(emerg)),
						"address":            vaultDecryptField(db, rowTid, nullStrVal(addr)),
						"previousSchool":     nullStrVal(prevSch),
						"medicalConditions":  firstNonEmpty(nullStrVal(med), "None"),
						"feeAmount":          nullFloatVal(feeAmt, 18000),
						"dueBakaya":          nullFloatVal(dueBak, 0),
						"feeStatus":          firstNonEmpty(nullStrVal(feeStatus), "PENDING"),
						"attendanceRate":     firstNonEmpty(nullStrVal(attRate), "96%"),
						"admissionDate":      nullStrVal(admDate),
						"status":             firstNonEmpty(nullStrVal(status), "ACTIVE"),
						"isSynced":           nullIntVal(isSynced, 0) == 1,
					}
					rec := stuRec{
						idLower:   strings.ToLower(strings.TrimSpace(nullStrVal(id))),
						rollLower: strings.ToLower(strings.TrimSpace(nullStrVal(rollNo))),
						rfidLower: strings.ToLower(strings.TrimSpace(nullStrVal(rfid))),
						mapped:    obj,
					}
					allStu = append(allStu, rec)
					if studentObj == nil {
						if rec.idLower == norm || rec.rollLower == norm || (rec.rfidLower != "" && rec.rfidLower == norm) ||
							(candidateRoll != "" && (rec.rollLower == candidateRoll || rec.idLower == candidateRoll)) {
							studentObj = obj
							studentIDLower = rec.idLower
							studentRollLower = rec.rollLower
						}
					}
				}
			}
		}

		if studentObj == nil && (len(matchedFees) > 0 || len(matchedTxns) > 0) {
			var tSid, tRoll string
			if len(matchedFees) > 0 {
				tSid = matchedFees[0].studentID
				tRoll = matchedFees[0].rollNo
			} else {
				tSid = strings.ToLower(strings.TrimSpace(matchedTxns[0].StudentID))
				tRoll = strings.ToLower(strings.TrimSpace(matchedTxns[0].RollNo))
			}
			for _, st := range allStu {
				if (tSid != "" && st.idLower == tSid) || (tRoll != "" && st.rollLower == tRoll) {
					studentObj = st.mapped
					studentIDLower = st.idLower
					studentRollLower = st.rollLower
					break
				}
			}
		}
	}

	if studentObj != nil && len(matchedFees) == 0 {
		for _, f := range allFeeRecs {
			if (studentIDLower != "" && f.studentID == studentIDLower) || (studentRollLower != "" && f.rollNo == studentRollLower) {
				matchedFees = append(matchedFees, f)
			}
		}
	}
	if studentObj != nil && len(matchedTxns) == 0 {
		for _, row := range allTxRows {
			sID := strings.ToLower(strings.TrimSpace(nullStrVal(row.studentID)))
			sRoll := strings.ToLower(strings.TrimSpace(nullStrVal(row.rollNo)))
			if (studentIDLower != "" && sID == studentIDLower) || (studentRollLower != "" && sRoll == studentRollLower) {
				matchedTxns = append(matchedTxns, mapSchoolTxnRow(db, row, tid, maps))
			}
		}
	}

	// 4. Personnel lookup (principals -> teachers -> staff)
	var employeeObj map[string]interface{}
	var empCodeMatched string
	if studentObj == nil && len(matchedFees) == 0 && len(matchedTxns) == 0 {
		matchesEmp := func(eid, ecode string) bool {
			idL := strings.ToLower(strings.TrimSpace(eid))
			ecL := strings.ToLower(strings.TrimSpace(ecode))
			if ecL != "" && (ecL == norm || "emp-"+ecL == norm || (strippedEmp != "" && ecL == strippedEmp)) {
				return true
			}
			if idL != "" && (idL == norm || "emp-"+idL == norm || (strippedEmp != "" && idL == strippedEmp)) {
				return true
			}
			return false
		}

		// Principals
		if rows, qErr := db.Query(`
			SELECT id, tenant_id, branch_id, wing_id, emp_code, name, father_name, cnic, passport_no,
			       nationality, gender, dob, blood_group, role_title, department, phone, emergency_contact,
			       email, address, shift, status, attendance_status, face_enrolled, fingerprint_enrolled, lite_enabled
			FROM local_school_principals WHERE tenant_id = ?`+scopeClause, args...); qErr == nil {
			defer rows.Close()
			for rows.Next() {
				var (
					id, rTid, bID, wID, eCode, name, fName, cnic, pass, nat, gen, dob, bg sql.NullString
					rTitle, dept, phone, emerg, email, addr, shift, status, attStatus     sql.NullString
					faceEnr, fpEnr, liteEn                                                sql.NullInt64
				)
				if rows.Scan(
					&id, &rTid, &bID, &wID, &eCode, &name, &fName, &cnic, &pass, &nat, &gen, &dob, &bg,
					&rTitle, &dept, &phone, &emerg, &email, &addr, &shift, &status, &attStatus,
					&faceEnr, &fpEnr, &liteEn,
				) == nil {
					if matchesEmp(nullStrVal(id), nullStrVal(eCode)) {
						rowTid := firstNonEmpty(nullStrVal(rTid), tid)
						branchID := firstNonEmpty(nullStrVal(bID), school.DefaultBranchID)
						wingID := firstNonEmpty(nullStrVal(wID), school.DefaultWingID)
						dpt := firstNonEmpty(nullStrVal(dept), "Executive Directorate")
						empCodeMatched = nullStrVal(eCode)
						employeeObj = map[string]interface{}{
							"id":                  nullStrVal(id),
							"tenantId":            rowTid,
							"branchId":            branchID,
							"branchName":          maps.branchName(branchID),
							"wingId":              wingID,
							"wingName":            maps.wingName(wingID),
							"empCode":             empCodeMatched,
							"name":                vaultDecryptField(db, rowTid, nullStrVal(name)),
							"fatherName":          vaultDecryptField(db, rowTid, nullStrVal(fName)),
							"cnic":                vaultDecryptField(db, rowTid, nullStrVal(cnic)),
							"passportNo":          vaultDecryptField(db, rowTid, nullStrVal(pass)),
							"nationality":         firstNonEmpty(nullStrVal(nat), "Pakistani"),
							"gender":              firstNonEmpty(nullStrVal(gen), "Male"),
							"dob":                 nullStrVal(dob),
							"bloodGroup":          firstNonEmpty(nullStrVal(bg), "O+"),
							"roleTitle":           nullStrVal(rTitle),
							"department":          dpt,
							"phone":               vaultDecryptField(db, rowTid, nullStrVal(phone)),
							"emergencyContact":    vaultDecryptField(db, rowTid, nullStrVal(emerg)),
							"email":               vaultDecryptField(db, rowTid, nullStrVal(email)),
							"address":             vaultDecryptField(db, rowTid, nullStrVal(addr)),
							"shift":               firstNonEmpty(nullStrVal(shift), "Full Day (07:30 AM - 04:00 PM)"),
							"status":              firstNonEmpty(nullStrVal(status), "ACTIVE"),
							"attendanceStatus":    firstNonEmpty(nullStrVal(attStatus), "Absent"),
							"faceEnrolled":        nullIntVal(faceEnr, 0) == 1,
							"fingerprintEnrolled": nullIntVal(fpEnr, 0) == 1,
							"liteEnabled":         nullIntVal(liteEn, 1) != 0,
							"memberCategory":      "principal",
							"gradeOrDept":         firstNonEmpty(dpt, nullStrVal(rTitle), "Executive Directorate"),
						}
						break
					}
				}
			}
		}

		// Teachers
		if employeeObj == nil {
			if rows, qErr := db.Query(`
				SELECT id, tenant_id, branch_id, wing_id, emp_code, name, father_name, designation, department,
				       subject, qualification, classes, incharge_class, gender, dob, blood_group, cnic, passport_no,
				       nationality, phone, emergency_contact, email, address, salary, basic_salary, salary_status,
				       last_salary_month, status, is_synced
				FROM local_school_teachers WHERE tenant_id = ?`+scopeClause, args...); qErr == nil {
				defer rows.Close()
				for rows.Next() {
					var (
						id, rTid, bID, wID, eCode, name, fName, desig, dept, subj, qual, cls, inch sql.NullString
						gen, dob, bg, cnic, pass, nat, phone, emerg, email, addr, sal, salSt, lsm   sql.NullString
						status                                                                      sql.NullString
						basicSal                                                                    sql.NullFloat64
						isSynced                                                                    sql.NullInt64
					)
					if rows.Scan(
						&id, &rTid, &bID, &wID, &eCode, &name, &fName, &desig, &dept,
						&subj, &qual, &cls, &inch, &gen, &dob, &bg, &cnic, &pass,
						&nat, &phone, &emerg, &email, &addr, &sal, &basicSal, &salSt,
						&lsm, &status, &isSynced,
					) == nil {
						if matchesEmp(nullStrVal(id), nullStrVal(eCode)) {
							rowTid := firstNonEmpty(nullStrVal(rTid), tid)
							branchID := firstNonEmpty(nullStrVal(bID), school.DefaultBranchID)
							wingID := firstNonEmpty(nullStrVal(wID), school.DefaultWingID)
							empCodeMatched = nullStrVal(eCode)
							dpt := nullStrVal(dept)
							sb := firstNonEmpty(nullStrVal(subj), dpt)
							empRole := firstNonEmpty(nullStrVal(desig), "Faculty Teacher")
							employeeObj = map[string]interface{}{
								"id":               nullStrVal(id),
								"tenantId":         rowTid,
								"branchId":         branchID,
								"branchName":       maps.branchName(branchID),
								"wingId":           wingID,
								"wingName":         maps.wingName(wingID),
								"empCode":          empCodeMatched,
								"name":             vaultDecryptField(db, rowTid, nullStrVal(name)),
								"fatherName":       vaultDecryptField(db, rowTid, nullStrVal(fName)),
								"designation":      nullStrVal(desig),
								"department":       dpt,
								"subject":          sb,
								"qualification":    firstNonEmpty(nullStrVal(qual), "Masters"),
								"classes":          firstNonEmpty(nullStrVal(cls), "All Assigned"),
								"inchargeClass":    nullStrVal(inch),
								"gender":           firstNonEmpty(nullStrVal(gen), "Male"),
								"dob":              nullStrVal(dob),
								"bloodGroup":       firstNonEmpty(nullStrVal(bg), "B+"),
								"cnic":             vaultDecryptField(db, rowTid, nullStrVal(cnic)),
								"passportNo":       vaultDecryptField(db, rowTid, nullStrVal(pass)),
								"nationality":      firstNonEmpty(nullStrVal(nat), "Pakistani"),
								"phone":            vaultDecryptField(db, rowTid, nullStrVal(phone)),
								"emergencyContact": vaultDecryptField(db, rowTid, nullStrVal(emerg)),
								"email":            vaultDecryptField(db, rowTid, nullStrVal(email)),
								"address":          vaultDecryptField(db, rowTid, nullStrVal(addr)),
								"salary":           vaultDecryptField(db, rowTid, nullStrVal(sal)),
								"basicSalary":      nullFloatVal(basicSal, 0),
								"salaryStatus":     firstNonEmpty(nullStrVal(salSt), "Pending"),
								"lastSalaryMonth":  firstNonEmpty(nullStrVal(lsm), "Current"),
								"salaryPaid":       strings.EqualFold(nullStrVal(salSt), "paid"),
								"status":           firstNonEmpty(nullStrVal(status), "ACTIVE"),
								"isSynced":         nullIntVal(isSynced, 0) == 1,
								"memberCategory":   "teacher",
								"roleTitle":        empRole,
								"gradeOrDept":      firstNonEmpty(dpt, sb, "Academics"),
							}
							break
						}
					}
				}
			}
		}

		// Staff
		if employeeObj == nil {
			if rows, qErr := db.Query(`
				SELECT id, tenant_id, branch_id, wing_id, emp_code, name, father_name, cnic, passport_no,
				       nationality, gender, dob, blood_group, role_title, department, phone, emergency_contact,
				       address, shift, status, attendance_status, face_enrolled, fingerprint_enrolled, lite_enabled
				FROM local_school_staff WHERE tenant_id = ?`+scopeClause, args...); qErr == nil {
				defer rows.Close()
				for rows.Next() {
					var (
						id, rTid, bID, wID, eCode, name, fName, cnic, pass, nat, gen, dob, bg sql.NullString
						rTitle, dept, phone, emerg, addr, shift, status, attStatus            sql.NullString
						faceEnr, fpEnr, liteEn                                                sql.NullInt64
					)
					if rows.Scan(
						&id, &rTid, &bID, &wID, &eCode, &name, &fName, &cnic, &pass, &nat, &gen, &dob, &bg,
						&rTitle, &dept, &phone, &emerg, &addr, &shift, &status, &attStatus,
						&faceEnr, &fpEnr, &liteEn,
					) == nil {
						if matchesEmp(nullStrVal(id), nullStrVal(eCode)) {
							rowTid := firstNonEmpty(nullStrVal(rTid), tid)
							branchID := firstNonEmpty(nullStrVal(bID), school.DefaultBranchID)
							wingID := firstNonEmpty(nullStrVal(wID), school.DefaultWingID)
							dpt := firstNonEmpty(nullStrVal(dept), "Administration")
							empCodeMatched = nullStrVal(eCode)
							employeeObj = map[string]interface{}{
								"id":                  nullStrVal(id),
								"tenantId":            rowTid,
								"branchId":            branchID,
								"branchName":          maps.branchName(branchID),
								"wingId":              wingID,
								"wingName":            maps.wingName(wingID),
								"empCode":             empCodeMatched,
								"name":                vaultDecryptField(db, rowTid, nullStrVal(name)),
								"fatherName":          vaultDecryptField(db, rowTid, nullStrVal(fName)),
								"cnic":                vaultDecryptField(db, rowTid, nullStrVal(cnic)),
								"passportNo":          vaultDecryptField(db, rowTid, nullStrVal(pass)),
								"nationality":         firstNonEmpty(nullStrVal(nat), "Pakistani"),
								"gender":              firstNonEmpty(nullStrVal(gen), "Male"),
								"dob":                 nullStrVal(dob),
								"bloodGroup":          firstNonEmpty(nullStrVal(bg), "B+"),
								"roleTitle":           nullStrVal(rTitle),
								"department":          dpt,
								"phone":               vaultDecryptField(db, rowTid, nullStrVal(phone)),
								"emergencyContact":    vaultDecryptField(db, rowTid, nullStrVal(emerg)),
								"address":             vaultDecryptField(db, rowTid, nullStrVal(addr)),
								"shift":               firstNonEmpty(nullStrVal(shift), "Morning (07:30 AM - 03:00 PM)"),
								"status":              firstNonEmpty(nullStrVal(status), "ACTIVE"),
								"attendanceStatus":    firstNonEmpty(nullStrVal(attStatus), "Absent"),
								"faceEnrolled":        nullIntVal(faceEnr, 0) == 1,
								"fingerprintEnrolled": nullIntVal(fpEnr, 0) == 1,
								"liteEnabled":         nullIntVal(liteEn, 1) != 0,
								"memberCategory":      "staff",
								"gradeOrDept":         firstNonEmpty(dpt, nullStrVal(rTitle), "Administration"),
							}
							break
						}
					}
				}
			}
		}
	}

	var openChallan, paidChallan map[string]interface{}
	for _, f := range matchedFees {
		if openChallan == nil && (f.status == "PENDING" || f.status == "OVERDUE" || f.status == "PARTIAL") {
			openChallan = f.mapped
		}
		if paidChallan == nil && f.status == "PAID" {
			paidChallan = f.mapped
		}
	}

	var latestTxn interface{} = nil
	if len(matchedTxns) > 0 {
		latestTxn = matchedTxns[0]
	}

	matchType := "none"
	if len(matchedTxns) > 0 && (strings.EqualFold(matchedTxns[0].TxnRef, norm) || strings.EqualFold(matchedTxns[0].ChallanNo, norm)) {
		matchType = "transaction"
	} else if openChallan != nil || paidChallan != nil {
		matchType = "challan"
	} else if studentObj != nil {
		matchType = "student"
	} else if employeeObj != nil {
		matchType = "employee"
	}

	normalizedCode := firstNonEmpty(candidateRoll, norm)
	if employeeObj != nil {
		normalizedCode = firstNonEmpty(empCodeMatched, strippedEmp, norm)
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":                true,
		"code":              rawCode,
		"normalizedCode":    normalizedCode,
		"matchType":         matchType,
		"student":           studentObj,
		"employee":          employeeObj,
		"openChallan":       openChallan,
		"paidChallan":       paidChallan,
		"latestTransaction": latestTxn,
	})
}
