package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
)

func setupPhase3TestServer(t *testing.T) *http.ServeMux {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "phase3_parity_test.db")
	t.Setenv("SOFTCODE_SQLITE_DB", dbPath)
	t.Setenv("SCS_VAULT_MASTER_KEY", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")

	mux := http.NewServeMux()
	registerPhase3HardwareHTTPRoutes(mux)
	registerPhase3PKGatewaysHTTPRoutes(mux)
	registerPhase3SchoolHTTPRoutes(mux)
	return mux
}

func doPhase3JSON(t *testing.T, mux *http.ServeMux, method, target string, body interface{}, headers map[string]string) (*httptest.ResponseRecorder, map[string]interface{}) {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			t.Fatalf("encode request body: %v", err)
		}
	}
	req := httptest.NewRequest(method, target, &buf)
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	var out map[string]interface{}
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	return rec, out
}

func TestPhase3HardwareLookups(t *testing.T) {
	mux := setupPhase3TestServer(t)

	// 1. Retail barcode lookup (barcode + SKU + 404)
	rec, body := doPhase3JSON(t, mux, http.MethodGet, "/api/retail/barcode-lookup?code=ELEC-9021", nil, nil)
	if rec.Code != http.StatusOK || body["ok"] != true {
		t.Fatalf("expected 200 ok for retail SKU lookup, got %d body=%v", rec.Code, body)
	}
	prd, _ := body["product"].(map[string]interface{})
	if prd["id"] != "prd-101" {
		t.Fatalf("expected prd-101, got %v", prd["id"])
	}

	rec404, body404 := doPhase3JSON(t, mux, http.MethodGet, "/api/retail/barcode-lookup?code=NO-SUCH-SKU", nil, nil)
	if rec404.Code != http.StatusNotFound || body404["error"] != "PRODUCT_NOT_FOUND" {
		t.Fatalf("expected 404 PRODUCT_NOT_FOUND, got %d body=%v", rec404.Code, body404)
	}

	// 2. Pharmacy FEFO lookup (selects earliest non-expired batch first)
	recPharm, pharmBody := doPhase3JSON(t, mux, http.MethodGet, "/api/pharmacy/barcode-lookup?code=896400112201&asOfDate=2026-03-01", nil, nil)
	if recPharm.Code != http.StatusOK || pharmBody["strategy"] != "FEFO" {
		t.Fatalf("expected FEFO 200 ok, got %d body=%v", recPharm.Code, pharmBody)
	}
	recBatch, _ := pharmBody["recommendedBatch"].(map[string]interface{})
	if recBatch["batchNo"] != "AUG-8402" {
		t.Fatalf("expected earliest non-expired batch AUG-8402, got %v", recBatch["batchNo"])
	}

	// Expired early batch should be skipped in favor of later non-expired batch
	recPharm2, pharmBody2 := doPhase3JSON(t, mux, http.MethodGet, "/api/pharmacy/barcode-lookup?code=896400112201&asOfDate=2026-09-01", nil, nil)
	if recPharm2.Code != http.StatusOK {
		t.Fatalf("expected 200 ok, got %d", recPharm2.Code)
	}
	recBatch2, _ := pharmBody2["recommendedBatch"].(map[string]interface{})
	if recBatch2["batchNo"] != "AUG-9921" {
		t.Fatalf("expected non-expired AUG-9921 after 2026-08-10 expiry, got %v", recBatch2["batchNo"])
	}

	// 3. Logistics waybill lookup
	recWb, wbBody := doPhase3JSON(t, mux, http.MethodGet, "/api/logistics/waybill/EXP-PK-994102", nil, nil)
	if recWb.Code != http.StatusOK || wbBody["ok"] != true {
		t.Fatalf("expected waybill 200, got %d body=%v", recWb.Code, wbBody)
	}
	wb, _ := wbBody["waybill"].(map[string]interface{})
	if wb["trackingNo"] != "EXP-PK-994102" {
		t.Fatalf("expected EXP-PK-994102, got %v", wb["trackingNo"])
	}
}

func TestPhase3PKGatewaysParity(t *testing.T) {
	mux := setupPhase3TestServer(t)
	headers := map[string]string{
		"X-Tenant-Id": "tenant-gym-go-01",
		"X-User-Role": "owner",
	}

	// Alias coaching_center -> coaching_academy & default seeding (6 gateways)
	rec, body := doPhase3JSON(t, mux, http.MethodGet, "/api/pk-gateways/coaching_center/gateways", nil, headers)
	if rec.Code != http.StatusOK || body["businessKey"] != "coaching_academy" {
		t.Fatalf("expected coaching_academy normalization, got %d body=%v", rec.Code, body)
	}
	gws, _ := body["gateways"].([]interface{})
	if len(gws) != 6 {
		t.Fatalf("expected 6 seeded PK gateways, got %d", len(gws))
	}

	// Secret masking check on custom gateway create
	recCreate, createBody := doPhase3JSON(t, mux, http.MethodPost, "/api/pk-gateways/gym_fitness/gateways", map[string]interface{}{
		"displayName":    "NayaPay Gym Vault",
		"category":       "mobile_wallet",
		"merchantSecret": "supersecret9876",
		"feeType":        "percent",
		"feeValue":       1.5,
	}, headers)
	if recCreate.Code != http.StatusOK {
		t.Fatalf("expected 200 on PK gateway create, got %d body=%v", recCreate.Code, createBody)
	}
	gwObj, _ := createBody["gateway"].(map[string]interface{})
	if _, leaked := gwObj["merchantSecret"]; leaked {
		t.Fatalf("merchantSecret must never be returned in JSON response")
	}
	if gwObj["hasMerchantSecret"] != true || gwObj["merchantSecretHint"] != "••••9876" {
		t.Fatalf("expected masked hint ••••9876, got %v", gwObj["merchantSecretHint"])
	}
	gwID, _ := gwObj["id"].(string)

	// Invalid screenshot mime check -> 400
	recBadImg, _ := doPhase3JSON(t, mux, http.MethodPost, "/api/pk-gateways/gym_fitness/transactions", map[string]interface{}{
		"gatewayId":       gwID,
		"payerName":       "Usman Tariq",
		"baseAmount":      5000,
		"invoiceNo":       "INV-GYM-100",
		"proofReference":  "TID-5501",
		"proofScreenshot": "data:application/pdf;base64,JVBERi0xLjQK",
	}, headers)
	if recBadImg.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for non-image screenshot, got %d", recBadImg.Code)
	}

	// Valid transaction + screenshot + 409 duplicate guard + verify RBAC
	validPNG := "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
	recTxn, txnBody := doPhase3JSON(t, mux, http.MethodPost, "/api/pk-gateways/gym_fitness/transactions", map[string]interface{}{
		"gatewayId":       gwID,
		"payerName":       "Usman Tariq",
		"payerPhone":      "03001234567",
		"baseAmount":      5000,
		"invoiceNo":       "INV-GYM-100",
		"proofReference":  "TID-5501",
		"proofScreenshot": validPNG,
	}, headers)
	if recTxn.Code != http.StatusOK {
		t.Fatalf("expected 200 for PK transaction, got %d body=%v", recTxn.Code, txnBody)
	}
	txObj, _ := txnBody["transaction"].(map[string]interface{})
	if txObj["totalAmount"] != float64(5075) || txObj["hasProofScreenshot"] != true {
		t.Fatalf("expected fee-included totalAmount 5075, got %v", txObj)
	}
	txnID, _ := txObj["id"].(string)

	// Duplicate invoice blocked with 409 PENDING_SLIP_EXISTS
	recDup, dupBody := doPhase3JSON(t, mux, http.MethodPost, "/api/pk-gateways/gym_fitness/transactions", map[string]interface{}{
		"gatewayId":      gwID,
		"payerName":      "Usman Tariq",
		"baseAmount":     5000,
		"invoiceNo":      "INV-GYM-100",
		"proofReference": "TID-5502",
	}, headers)
	if recDup.Code != http.StatusConflict || dupBody["error"] != "PENDING_SLIP_EXISTS" {
		t.Fatalf("expected 409 PENDING_SLIP_EXISTS, got %d body=%v", recDup.Code, dupBody)
	}

	// Non-manage role blocked on verify (403 ROLE_FORBIDDEN)
	recForbid, _ := doPhase3JSON(t, mux, http.MethodPut, "/api/pk-gateways/gym_fitness/transactions/"+txnID+"/verify", map[string]interface{}{
		"status": "VERIFIED",
	}, map[string]string{
		"X-Tenant-Id": "tenant-gym-go-01",
		"X-User-Role": "member",
	})
	if recForbid.Code != http.StatusForbidden {
		t.Fatalf("expected 403 ROLE_FORBIDDEN for member verify, got %d", recForbid.Code)
	}

	// Cashier verify succeeds -> subsequent duplicate blocked with INVOICE_ALREADY_PAID
	recVer, verBody := doPhase3JSON(t, mux, http.MethodPut, "/api/pk-gateways/gym_fitness/transactions/"+txnID+"/verify", map[string]interface{}{
		"status":     "VERIFIED",
		"verifiedBy": "Cashier Bilal",
	}, map[string]string{
		"X-Tenant-Id": "tenant-gym-go-01",
		"X-User-Role": "cashier",
	})
	if recVer.Code != http.StatusOK {
		t.Fatalf("expected 200 on verify, got %d body=%v", recVer.Code, verBody)
	}
	recPaidDup, paidDupBody := doPhase3JSON(t, mux, http.MethodPost, "/api/pk-gateways/gym_fitness/transactions", map[string]interface{}{
		"gatewayId":      gwID,
		"payerName":      "Usman Tariq",
		"baseAmount":     5000,
		"invoiceNo":      "INV-GYM-100",
		"proofReference": "TID-5503",
	}, headers)
	if recPaidDup.Code != http.StatusConflict || paidDupBody["error"] != "INVOICE_ALREADY_PAID" {
		t.Fatalf("expected 409 INVOICE_ALREADY_PAID, got %d body=%v", recPaidDup.Code, paidDupBody)
	}
}

func TestPhase3SchoolGatewaysTransactionsAndBarcodeParity(t *testing.T) {
	mux := setupPhase3TestServer(t)
	ownerHdrs := map[string]string{
		"X-Tenant-Id": "tenant-school-go-01",
		"X-User-Role": "owner",
	}
	parentHdrs := map[string]string{
		"X-Tenant-Id": "tenant-school-go-01",
		"X-User-Role": "parent",
	}

	// 1. Seed 8 school gateways & verify non-owner masks secret
	recOwnerCreate, ownerCreateBody := doPhase3JSON(t, mux, http.MethodPost, "/api/school/payment-gateways", map[string]interface{}{
		"displayName":    "Owner Custom School Bank",
		"providerKey":    "askari_bank",
		"merchantSecret": "topsecret4321",
		"webhookUrl":     "https://school.example.pk/webhook",
	}, ownerHdrs)
	if recOwnerCreate.Code != http.StatusCreated {
		t.Fatalf("expected 201 on school gateway create, got %d body=%v", recOwnerCreate.Code, ownerCreateBody)
	}

	recNonOwnerPost, nonOwnerPostBody := doPhase3JSON(t, mux, http.MethodPost, "/api/school/payment-gateways", map[string]interface{}{
		"displayName": "Unauthorized",
	}, parentHdrs)
	if recNonOwnerPost.Code != http.StatusForbidden || nonOwnerPostBody["error"] != "OWNER_ONLY_FORBIDDEN" {
		t.Fatalf("expected 403 OWNER_ONLY_FORBIDDEN, got %d body=%v", recNonOwnerPost.Code, nonOwnerPostBody)
	}

	recParentGet, parentGetBody := doPhase3JSON(t, mux, http.MethodGet, "/api/school/payment-gateways", nil, parentHdrs)
	if recParentGet.Code != http.StatusOK {
		t.Fatalf("expected 200 on school gateways get, got %d", recParentGet.Code)
	}
	gws, _ := parentGetBody["gateways"].([]interface{})
	if len(gws) < 9 {
		t.Fatalf("expected 8 default + 1 custom school gateways, got %d", len(gws))
	}
	for _, rawGw := range gws {
		gw, _ := rawGw.(map[string]interface{})
		if gw["webhookUrl"] != "" || gw["hasMerchantSecret"] == true {
			t.Fatalf("non-owner response leaked secret/webhook metadata: %v", gw)
		}
	}

	// 2. Parent submits payment slip -> PENDING_VERIFICATION, then Accountant verifies -> VERIFIED & settles fee
	recSubmit, submitBody := doPhase3JSON(t, mux, http.MethodPost, "/api/school/payment-transactions", map[string]interface{}{
		"studentName":    "Zainab Fatima",
		"rollNo":         "SCH-2026-99",
		"grade":          "Grade 9",
		"challanNo":      "CHLN-2026-9901",
		"baseAmount":     18500,
		"proofReference": "RAAST-998877",
	}, parentHdrs)
	if recSubmit.Code != http.StatusCreated {
		t.Fatalf("expected 201 on school payment transaction, got %d body=%v", recSubmit.Code, submitBody)
	}
	txMap, _ := submitBody["transaction"].(map[string]interface{})
	if txMap["status"] != "PENDING_VERIFICATION" {
		t.Fatalf("expected PENDING_VERIFICATION for parent slip, got %v", txMap["status"])
	}
	txID, _ := txMap["id"].(string)

	// Teacher blocked from verifying
	recTeacherVerify, _ := doPhase3JSON(t, mux, http.MethodPut, "/api/school/payment-transactions/"+txID+"/verify", map[string]interface{}{
		"status": "VERIFIED",
	}, map[string]string{
		"X-Tenant-Id": "tenant-school-go-01",
		"X-User-Role": "teacher",
	})
	if recTeacherVerify.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for teacher verifying transaction, got %d", recTeacherVerify.Code)
	}

	// Branch scope violation blocked with 403 BRANCH_SCOPE_FORBIDDEN
	recWrongBranch, wrongBranchBody := doPhase3JSON(t, mux, http.MethodGet, "/api/school/barcode-lookup?code=CHLN-2026-9901&branchId=BR-LHR-01", nil, map[string]string{
		"X-Tenant-Id": "tenant-school-go-01",
		"X-User-Role": "principal",
		"X-Branch-Id": "BR-ISB-02",
	})
	if recWrongBranch.Code != http.StatusForbidden || wrongBranchBody["error"] != "BRANCH_SCOPE_FORBIDDEN" {
		t.Fatalf("expected 403 BRANCH_SCOPE_FORBIDDEN, got %d body=%v", recWrongBranch.Code, wrongBranchBody)
	}

	// Accountant verifies transaction -> creates settled fee
	recAccVerify, accVerifyBody := doPhase3JSON(t, mux, http.MethodPut, "/api/school/payment-transactions/"+txID+"/verify", map[string]interface{}{
		"status":     "VERIFIED",
		"verifiedBy": "Accountant Hamza",
	}, map[string]string{
		"X-Tenant-Id": "tenant-school-go-01",
		"X-User-Role": "accountant",
	})
	if recAccVerify.Code != http.StatusOK || accVerifyBody["linkedFeeId"] == "" {
		t.Fatalf("expected 200 and non-empty linkedFeeId, got %d body=%v", recAccVerify.Code, accVerifyBody)
	}

	// 3. Barcode lookup finds settled challan & decrypted studentName
	recLookup, lookupBody := doPhase3JSON(t, mux, http.MethodGet, "/api/school/barcode-lookup?code=CHLN-2026-9901", nil, ownerHdrs)
	if recLookup.Code != http.StatusOK || lookupBody["matchType"] != "transaction" {
		t.Fatalf("expected matchType transaction on challan lookup, got %d body=%v", recLookup.Code, lookupBody)
	}
	paidChallan, _ := lookupBody["paidChallan"].(map[string]interface{})
	chNo, _ := paidChallan["challanNo"].(string)
	if paidChallan == nil || !strings.EqualFold(chNo, "CHLN-2026-9901") {
		t.Fatalf("expected settled paidChallan for CHLN-2026-9901, got %v", paidChallan)
	}
	if paidChallan["studentName"] != "Zainab Fatima" {
		t.Fatalf("expected decrypted studentName 'Zainab Fatima', got %v", paidChallan["studentName"])
	}
}
