package softcodesolution_platform

import (
	"database/sql"
	"fmt"
	"math"
	"regexp"
	"strings"
)

var SupportedBusinesses = map[string]string{
	"coaching_academy":     "Coaching & Training Center",
	"gym_fitness":          "Gym & Fitness Center",
	"hospital_clinic":      "Clinic & Healthcare Center",
	"real_estate":          "Property & Real Estate",
	"retail_pos":           "Retail & POS Storefront",
	"pharmacy_store":       "Pharmacy & Medical Store",
	"restaurant_cafe":      "Restaurant & Cafe",
	"bakery_confectionery": "Bakery & Confectionery",
}

type BusinessGateway struct {
	ID                 string  `json:"id"`
	TenantID           string  `json:"tenantId"`
	BusinessKey        string  `json:"businessKey"`
	ProviderKey        string  `json:"providerKey"`
	DisplayName        string  `json:"displayName"`
	Category           string  `json:"category"`
	AccountTitle       string  `json:"accountTitle"`
	AccountNumber      string  `json:"accountNumber"`
	IBAN               string  `json:"iban"`
	RaastID            string  `json:"raastId"`
	BankName           string  `json:"bankName"`
	BranchCode         string  `json:"branchCode"`
	TillID             string  `json:"tillId"`
	BillerCode         string  `json:"billerCode"`
	MerchantID         string  `json:"merchantId"`
	HasMerchantSecret  bool    `json:"hasMerchantSecret"`
	HasIntegritySalt   bool    `json:"hasIntegritySalt"`
	MerchantSecretHint string  `json:"merchantSecretHint"`
	IntegritySaltHint  string  `json:"integritySaltHint"`
	FeeType            string  `json:"feeType"`
	FeeValue           float64 `json:"feeValue"`
	VerificationMode   string  `json:"verificationMode"`
	Instructions       string  `json:"instructions"`
	IsEnabled          bool    `json:"isEnabled"`
	IsDefault          bool    `json:"isDefault"`
	SortOrder          int     `json:"sortOrder"`
	UpdatedAt          string  `json:"updatedAt,omitempty"`
}

type BusinessGatewaySettings struct {
	BusinessKey            string `json:"businessKey"`
	RequireProofReference  bool   `json:"requireProofReference"`
	AutoVerifyDigitalSlips bool   `json:"autoVerifyDigitalSlips"`
	AllowClientSelfPay     bool   `json:"allowClientSelfPay"`
	DefaultCurrency        string `json:"defaultCurrency"`
	ReceiptFooterNote      string `json:"receiptFooterNote"`
}

type BusinessGatewayTransaction struct {
	ID                string  `json:"id"`
	TenantID          string  `json:"tenantId"`
	BusinessKey       string  `json:"businessKey"`
	TxnRef            string  `json:"txnRef"`
	InvoiceNo         string  `json:"invoiceNo"`
	GatewayID         string  `json:"gatewayId"`
	GatewayName       string  `json:"gatewayName"`
	ProviderKey       string  `json:"providerKey"`
	PayerName         string  `json:"payerName"`
	PayerRef          string  `json:"payerRef"`
	PayerPhone        string  `json:"payerPhone"`
	BaseAmount        float64 `json:"baseAmount"`
	GatewayFee        float64 `json:"gatewayFee"`
	TotalAmount       float64 `json:"totalAmount"`
	Currency          string  `json:"currency"`
	Status            string  `json:"status"`
	ProofReference    string  `json:"proofReference"`
	ProofNotes        string  `json:"proofNotes"`
	ProofScreenshot   string  `json:"proofScreenshot"`
	HasProofScreenshot bool   `json:"hasProofScreenshot"`
	VerifiedBy        string  `json:"verifiedBy"`
	VerifiedAt        string  `json:"verifiedAt"`
	CreatedAt         string  `json:"createdAt"`
}

var nonKeyCharsRe = regexp.MustCompile(`[^a-z0-9_-]`)

// NormalizeBusinessKey maps business aliases identically to business_gateways.routes.js.
func NormalizeBusinessKey(raw string) string {
	clean := nonKeyCharsRe.ReplaceAllString(strings.ToLower(strings.TrimSpace(raw)), "_")
	switch clean {
	case "coaching_center":
		return "coaching_academy"
	case "clinic":
		return "hospital_clinic"
	case "property_management", "realty":
		return "real_estate"
	case "":
		return "coaching_academy"
	default:
		return clean
	}
}

// SanitizeProviderKey cleans custom provider keys matching Node behavior.
func SanitizeProviderKey(raw string) string {
	return nonKeyCharsRe.ReplaceAllString(strings.ToLower(strings.TrimSpace(raw)), "_")
}

func DefaultBusinessGatewaySettings(businessKey string) BusinessGatewaySettings {
	title := SupportedBusinesses[businessKey]
	if title == "" {
		title = "SoftCode Enterprise"
	}
	return BusinessGatewaySettings{
		BusinessKey:            businessKey,
		RequireProofReference:  true,
		AutoVerifyDigitalSlips: false,
		AllowClientSelfPay:     true,
		DefaultCurrency:        "PKR",
		ReceiptFooterNote:      fmt.Sprintf("Verified by %s Pakistan Gateway", title),
	}
}

func DefaultGatewaysForBusiness(businessKey string) []BusinessGateway {
	titleLabel := SupportedBusinesses[businessKey]
	if titleLabel == "" {
		titleLabel = "SoftCode Enterprise"
	}
	upper := strings.ToUpper(businessKey)
	bTag := upper
	if len(bTag) > 4 {
		bTag = bTag[:4]
	}
	return []BusinessGateway{
		{
			ProviderKey:      "raast",
			DisplayName:      "Raast Instant IBFT (SBP 0 Fee)",
			Category:         "instant_raast",
			AccountTitle:     titleLabel + " Main Collection",
			AccountNumber:    "03001122334",
			IBAN:             "PK36MEZN0002810104982112",
			RaastID:          "03001122334",
			BankName:         "State Bank Raast Rail",
			BranchCode:       "0281",
			TillID:           fmt.Sprintf("RST-%s-01", bTag),
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Transfer via any Pakistani Banking App -> Raast P2P/IBAN (0 PKR fee) & upload screenshot.",
			IsEnabled:        true,
			IsDefault:        true,
			SortOrder:        1,
		},
		{
			ProviderKey:      "jazzcash",
			DisplayName:      "JazzCash Merchant / Till",
			Category:         "mobile_wallet",
			AccountTitle:     titleLabel + " JazzCash",
			AccountNumber:    "03018877665",
			RaastID:          "03018877665",
			BankName:         "Mobilink Microfinance Bank",
			TillID:           fmt.Sprintf("JC-%s-992", bTag),
			MerchantID:       fmt.Sprintf("MC-%s01", bTag),
			FeeType:          "percent",
			FeeValue:         1.0,
			VerificationMode: "slip_review",
			Instructions:     "Send payment via JazzCash App / *786# Till ID & enter TID reference.",
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        2,
		},
		{
			ProviderKey:      "easypaisa",
			DisplayName:      "Easypaisa Merchant / Telenor",
			Category:         "mobile_wallet",
			AccountTitle:     titleLabel + " Easypaisa",
			AccountNumber:    "03455566778",
			RaastID:          "03455566778",
			BankName:         "Easypaisa Bank Limited",
			TillID:           fmt.Sprintf("EP-%s-441", bTag),
			MerchantID:       fmt.Sprintf("EP-%s02", bTag),
			FeeType:          "percent",
			FeeValue:         1.0,
			VerificationMode: "slip_review",
			Instructions:     "Pay via Easypaisa App -> Mini Apps / QR Till ID & attach confirmation slip.",
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        3,
		},
		{
			ProviderKey:      "onebill",
			DisplayName:      "1Link / 1Bill / KuickPay Voucher",
			Category:         "onebill_voucher",
			AccountTitle:     titleLabel + " 1Bill Biller",
			AccountNumber:    "10099887766",
			BankName:         "1LINK Guarantee Pakistan",
			BillerCode:       "100294",
			MerchantID:       fmt.Sprintf("1B-%s", bTag),
			FeeType:          "fixed",
			FeeValue:         35,
			VerificationMode: "auto_reference",
			Instructions:     "Pay via any ATM or Mobile Banking -> Bill Payment -> 1Bill Invoice using voucher #.",
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        4,
		},
		{
			ProviderKey:      "meezan_bank",
			DisplayName:      "Meezan Bank Islamic IBAN",
			Category:         "bank_transfer",
			AccountTitle:     titleLabel + " Collection A/C",
			AccountNumber:    "02810104982112",
			IBAN:             "PK36MEZN0002810104982112",
			BankName:         "Meezan Bank Limited",
			BranchCode:       "0281",
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Deposit cash/cheque at any Meezan Bank branch or IBFT and upload deposit slip.",
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        5,
		},
		{
			ProviderKey:      "hbl_konnect",
			DisplayName:      "HBL Konnect / Counter Slip",
			Category:         "bank_transfer",
			AccountTitle:     titleLabel + " HBL A/C",
			AccountNumber:    "00427991044201",
			IBAN:             "PK88HABB0000427991044201",
			BankName:         "Habib Bank Limited (HBL)",
			BranchCode:       "0042",
			TillID:           fmt.Sprintf("HBL-%s", bTag),
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Deposit via HBL Mobile / Konnect Agent and enter 12-digit transaction reference.",
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        6,
		},
	}
}

func CalculateBusinessGatewayFee(feeType string, feeValue float64, baseAmount float64) float64 {
	if feeValue <= 0 {
		return 0
	}
	switch feeType {
	case "percent":
		return math.Round((baseAmount * feeValue) / 100.0)
	case "fixed":
		return math.Round(feeValue)
	default:
		return 0
	}
}

func EnsureBusinessGatewaysSchema(db *sql.DB) error {
	if db == nil {
		return nil
	}
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS local_business_payment_gateways (
			id TEXT PRIMARY KEY,
			tenant_id TEXT NOT NULL DEFAULT 'tenant-root-platform',
			business_key TEXT NOT NULL,
			provider_key TEXT NOT NULL,
			display_name TEXT NOT NULL,
			category TEXT NOT NULL,
			account_title TEXT,
			account_number TEXT,
			iban TEXT,
			raast_id TEXT,
			bank_name TEXT,
			branch_code TEXT,
			till_id TEXT,
			biller_code TEXT,
			merchant_id TEXT,
			merchant_secret_enc TEXT,
			integrity_salt_enc TEXT,
			fee_type TEXT DEFAULT 'none',
			fee_value REAL DEFAULT 0,
			verification_mode TEXT DEFAULT 'slip_review',
			instructions TEXT,
			is_enabled INTEGER DEFAULT 1,
			is_default INTEGER DEFAULT 0,
			sort_order INTEGER DEFAULT 10,
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(tenant_id, business_key, provider_key)
		);
		CREATE INDEX IF NOT EXISTS idx_biz_gw_tenant_biz ON local_business_payment_gateways(tenant_id, business_key);

		CREATE TABLE IF NOT EXISTS local_business_gateway_settings (
			id TEXT PRIMARY KEY,
			tenant_id TEXT NOT NULL DEFAULT 'tenant-root-platform',
			business_key TEXT NOT NULL,
			settings_json TEXT NOT NULL,
			is_synced INTEGER DEFAULT 0,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(tenant_id, business_key)
		);

		CREATE TABLE IF NOT EXISTS local_business_payment_transactions (
			id TEXT PRIMARY KEY,
			tenant_id TEXT NOT NULL DEFAULT 'tenant-root-platform',
			business_key TEXT NOT NULL,
			txn_ref TEXT NOT NULL,
			invoice_no TEXT NOT NULL,
			gateway_id TEXT NOT NULL,
			gateway_name TEXT NOT NULL,
			provider_key TEXT NOT NULL,
			payer_name TEXT NOT NULL,
			payer_ref TEXT,
			payer_phone TEXT,
			base_amount REAL NOT NULL,
			gateway_fee REAL DEFAULT 0,
			total_amount REAL NOT NULL,
			currency TEXT DEFAULT 'PKR',
			status TEXT DEFAULT 'PENDING_VERIFICATION',
			proof_reference TEXT,
			proof_notes TEXT,
			proof_screenshot TEXT,
			verified_by TEXT,
			verified_at TEXT,
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(tenant_id, business_key, txn_ref)
		);
		CREATE INDEX IF NOT EXISTS idx_biz_txn_tenant_biz ON local_business_payment_transactions(tenant_id, business_key, created_at);
		CREATE INDEX IF NOT EXISTS idx_biz_txn_invoice ON local_business_payment_transactions(tenant_id, business_key, invoice_no);
	`)
	return err
}
