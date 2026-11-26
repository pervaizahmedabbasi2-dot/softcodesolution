package school

import (
	"database/sql"
	"math"
	"net/url"
	"regexp"
	"strings"
)

const (
	RootTenantID    = "tenant-root-platform"
	DefaultBranchID = "BR-LHR-01"
	DefaultWingID   = "WNG-LHR-SR"
)

type CustomFieldKV struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type SchoolBranch struct {
	ID              string `json:"id"`
	Code            string `json:"code"`
	Name            string `json:"name"`
	City            string `json:"city"`
	Address         string `json:"address"`
	Phone           string `json:"phone"`
	PrincipalName   string `json:"principalName"`
	AccountantName  string `json:"accountantName"`
	EstablishedYear string `json:"establishedYear"`
	Status          string `json:"status"`
}

type SchoolWing struct {
	ID         string `json:"id"`
	BranchID   string `json:"branchId"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	GradeRange string `json:"gradeRange"`
	HeadName   string `json:"headName"`
	Status     string `json:"status"`
}

type SchoolPaymentGateway struct {
	ID                 string          `json:"id"`
	TenantID           string          `json:"tenantId"`
	BranchID           string          `json:"branchId"`
	BranchName         string          `json:"branchName"`
	WingID             string          `json:"wingId"`
	WingName           string          `json:"wingName"`
	ProviderKey        string          `json:"providerKey"`
	DisplayName        string          `json:"displayName"`
	Category           string          `json:"category"`
	AccountTitle       string          `json:"accountTitle"`
	AccountNumber      string          `json:"accountNumber"`
	IBAN               string          `json:"iban"`
	RaastID            string          `json:"raastId"`
	BankName           string          `json:"bankName"`
	BranchCode         string          `json:"branchCode"`
	TillID             string          `json:"tillId"`
	BillerCode         string          `json:"billerCode"`
	MerchantID         string          `json:"merchantId"`
	HasMerchantSecret  bool            `json:"hasMerchantSecret"`
	HasIntegritySalt   bool            `json:"hasIntegritySalt"`
	MerchantSecretHint string          `json:"merchantSecretHint"`
	IntegritySaltHint  string          `json:"integritySaltHint"`
	WebhookURL         string          `json:"webhookUrl"`
	FeeType            string          `json:"feeType"`
	FeeValue           float64         `json:"feeValue"`
	VerificationMode   string          `json:"verificationMode"`
	Instructions       string          `json:"instructions"`
	AllowedPortals     []string        `json:"allowedPortals"`
	CustomFields       []CustomFieldKV `json:"customFields"`
	IsEnabled          bool            `json:"isEnabled"`
	IsDefault          bool            `json:"isDefault"`
	SortOrder          int             `json:"sortOrder"`
	CreatedAt          string          `json:"createdAt,omitempty"`
	UpdatedAt          string          `json:"updatedAt,omitempty"`
}

type SchoolGatewaySettings struct {
	Currency                  string          `json:"currency"`
	AllowOnlineStudentPayment bool            `json:"allowOnlineStudentPayment"`
	AllowOnlineParentPayment  bool            `json:"allowOnlineParentPayment"`
	AllowPartialOnlinePayment bool            `json:"allowPartialOnlinePayment"`
	RequireProofReference     bool            `json:"requireProofReference"`
	AutoIssueReceiptOnVerify  bool            `json:"autoIssueReceiptOnVerify"`
	OneBillPrefix             string          `json:"oneBillPrefix"`
	LateFeeGraceDays          float64         `json:"lateFeeGraceDays"`
	LateFeeFinePkr            float64         `json:"lateFeeFinePkr"`
	ReceiptFooterNote         string          `json:"receiptFooterNote"`
	OwnerNotifyOnPayment      bool            `json:"ownerNotifyOnPayment"`
	CustomPolicyFields        []CustomFieldKV `json:"customPolicyFields"`
}

type SchoolPaymentTransaction struct {
	ID                 string                 `json:"id"`
	TenantID           string                 `json:"tenantId"`
	BranchID           string                 `json:"branchId"`
	BranchName         string                 `json:"branchName"`
	WingID             string                 `json:"wingId"`
	WingName           string                 `json:"wingName"`
	TxnRef             string                 `json:"txnRef"`
	ChallanNo          string                 `json:"challanNo"`
	GatewayID          string                 `json:"gatewayId"`
	GatewayName        string                 `json:"gatewayName"`
	ProviderKey        string                 `json:"providerKey"`
	StudentID          string                 `json:"studentId"`
	StudentName        string                 `json:"studentName"`
	RollNo             string                 `json:"rollNo"`
	Grade              string                 `json:"grade"`
	GuardianName       string                 `json:"guardianName"`
	PayerPhone         string                 `json:"payerPhone"`
	PayerAccountTitle  string                 `json:"payerAccountTitle"`
	Month              string                 `json:"month"`
	BaseAmount         float64                `json:"baseAmount"`
	GatewayFee         float64                `json:"gatewayFee"`
	TotalAmount        float64                `json:"totalAmount"`
	Currency           string                 `json:"currency"`
	Status             string                 `json:"status"`
	VerificationMode   string                 `json:"verificationMode"`
	ProofReference     string                 `json:"proofReference"`
	ProofNotes         string                 `json:"proofNotes"`
	ProofScreenshot    string                 `json:"proofScreenshot"`
	HasProofScreenshot bool                   `json:"hasProofScreenshot"`
	SubmittedByName    string                 `json:"submittedByName"`
	SubmittedByRole    string                 `json:"submittedByRole"`
	VerifiedBy         string                 `json:"verifiedBy"`
	VerifiedAt         string                 `json:"verifiedAt"`
	RejectionReason    string                 `json:"rejectionReason"`
	LinkedFeeID        string                 `json:"linkedFeeId"`
	CustomFields       map[string]interface{} `json:"customFields"`
	CreatedAt          string                 `json:"createdAt,omitempty"`
	UpdatedAt          string                 `json:"updatedAt,omitempty"`
}

type SchoolGatewayBucket struct {
	GatewayID      string  `json:"gatewayId"`
	GatewayName    string  `json:"gatewayName"`
	ProviderKey    string  `json:"providerKey"`
	VerifiedAmount float64 `json:"verifiedAmount"`
	PendingAmount  float64 `json:"pendingAmount"`
	VerifiedCount  int     `json:"verifiedCount"`
	PendingCount   int     `json:"pendingCount"`
	TotalCount     int     `json:"totalCount"`
}

type SchoolTransactionSummary struct {
	TotalCount          int                             `json:"totalCount"`
	VerifiedCount       int                             `json:"verifiedCount"`
	PendingCount        int                             `json:"pendingCount"`
	RejectedCount       int                             `json:"rejectedCount"`
	TotalVerifiedAmount float64                         `json:"totalVerifiedAmount"`
	TotalPendingAmount  float64                         `json:"totalPendingAmount"`
	ByGateway           map[string]*SchoolGatewayBucket `json:"byGateway"`
}

var (
	safeTidRe         = regexp.MustCompile(`[^a-zA-Z0-9_-]`)
	proofImageDataRe  = regexp.MustCompile(`(?i)^data:image/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$`)
	stripNewlinesRe   = regexp.MustCompile(`[\r\n]`)
	safeProviderKeyRe = regexp.MustCompile(`[^a-z0-9_-]`)
)

func SanitizeTenantSlug(tenantID string) string {
	tid := strings.TrimSpace(tenantID)
	if tid == "" {
		tid = RootTenantID
	}
	return safeTidRe.ReplaceAllString(tid, "_")
}

func SanitizeProviderKey(raw string) string {
	clean := safeProviderKeyRe.ReplaceAllString(strings.ToLower(strings.TrimSpace(raw)), "_")
	if clean == "" {
		return "custom"
	}
	return clean
}

func ValidateGatewayWebhookURL(raw string) (string, string) {
	clean := strings.TrimSpace(raw)
	if clean == "" {
		return "", ""
	}
	parsed, err := url.ParseRequestURI(clean)
	if err != nil {
		return "", "Invalid webhook URL format."
	}
	scheme := strings.ToLower(parsed.Scheme)
	if scheme != "http" && scheme != "https" {
		return "", "Webhook URL must use http:// or https://"
	}
	return clean, ""
}

func ValidateProofScreenshot(raw string) (string, string) {
	clean := strings.TrimSpace(raw)
	if clean == "" {
		return "", ""
	}
	if !proofImageDataRe.MatchString(clean) {
		return "", "Payment slip screenshot must be a valid PNG, JPG, WEBP, or GIF image."
	}
	normalized := stripNewlinesRe.ReplaceAllString(clean, "")
	if len(normalized) > 650000 {
		return "", "Payment slip screenshot is too large. Please upload a smaller or compressed image."
	}
	return normalized, ""
}

func CalculateGatewayFee(feeType string, feeValue float64, baseAmount float64) float64 {
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

func DefaultBranches() []SchoolBranch {
	return []SchoolBranch{
		{ID: "BR-LHR-01", Code: "LHR-01", Name: "Lahore Main Campus", City: "Lahore", Address: "Gulberg III Main Boulevard, Lahore", Phone: "+92 42 35761201", PrincipalName: "Prof. Dr. Tahir Mahmood Malik", AccountantName: "Muhammad Rizwan", EstablishedYear: "2016", Status: "ACTIVE"},
		{ID: "BR-ISB-02", Code: "ISB-02", Name: "Islamabad F-10 Campus", City: "Islamabad", Address: "Sector F-10/3 Markaz Road, Islamabad", Phone: "+92 51 9283741", PrincipalName: "Ms. Ayesha Siddiqa", AccountantName: "Usman Tariq", EstablishedYear: "2019", Status: "ACTIVE"},
		{ID: "BR-KHI-03", Code: "KHI-03", Name: "Karachi Clifton Campus", City: "Karachi", Address: "Block 4 Clifton Marine Drive, Karachi", Phone: "+92 21 35834410", PrincipalName: "Prof. Tariq Javed", AccountantName: "Salman Raza", EstablishedYear: "2022", Status: "ACTIVE"},
	}
}

func DefaultWings() []SchoolWing {
	return []SchoolWing{
		{ID: "WNG-LHR-MON", BranchID: "BR-LHR-01", Code: "LHR-MON", Name: "Montessori & Early Years Wing", Type: "Montessori", GradeRange: "Playgroup - Prep", HeadName: "Ms. Hina Naeem", Status: "ACTIVE"},
		{ID: "WNG-LHR-JNR", BranchID: "BR-LHR-01", Code: "LHR-JNR", Name: "Junior Primary Wing", Type: "Junior", GradeRange: "Class 1 - Class 5", HeadName: "Ms. Amna Tariq", Status: "ACTIVE"},
		{ID: "WNG-LHR-MID", BranchID: "BR-LHR-01", Code: "LHR-MID", Name: "Middle School Wing", Type: "Middle", GradeRange: "Class 6 - Class 8", HeadName: "Sir Farhan Iqbal", Status: "ACTIVE"},
		{ID: "WNG-LHR-SNR", BranchID: "BR-LHR-01", Code: "LHR-SNR", Name: "Senior & O-Level Wing", Type: "Senior", GradeRange: "Class 9 - Class 10 / O-Level", HeadName: "Prof. Tariq Mehmood", Status: "ACTIVE"},
		{ID: "WNG-ISB-MON", BranchID: "BR-ISB-02", Code: "ISB-MON", Name: "F-10 Montessori Wing", Type: "Montessori", GradeRange: "Playgroup - KG", HeadName: "Ms. Sana Khalid", Status: "ACTIVE"},
		{ID: "WNG-ISB-JNR", BranchID: "BR-ISB-02", Code: "ISB-JNR", Name: "F-10 Junior Wing", Type: "Junior", GradeRange: "Class 1 - Class 5", HeadName: "Ms. Zunaira Raza", Status: "ACTIVE"},
		{ID: "WNG-ISB-GRL", BranchID: "BR-ISB-02", Code: "ISB-GRL", Name: "F-10 Girls Wing", Type: "Girls", GradeRange: "Class 6 - Class 10", HeadName: "Ms. Sarah Jenkins", Status: "ACTIVE"},
		{ID: "WNG-ISB-SNR", BranchID: "BR-ISB-02", Code: "ISB-SNR", Name: "F-10 Senior Science Wing", Type: "Senior", GradeRange: "Class 9 - Class 10", HeadName: "Dr. Rehan Alvi", Status: "ACTIVE"},
		{ID: "WNG-KHI-MON", BranchID: "BR-KHI-03", Code: "KHI-MON", Name: "Clifton Early Years Wing", Type: "Montessori", GradeRange: "Playgroup - Prep", HeadName: "Ms. Mahnoor Shah", Status: "ACTIVE"},
		{ID: "WNG-KHI-JNR", BranchID: "BR-KHI-03", Code: "KHI-JNR", Name: "Clifton Junior Wing", Type: "Junior", GradeRange: "Class 1 - Class 5", HeadName: "Ms. Rabia Qureshi", Status: "ACTIVE"},
		{ID: "WNG-KHI-MID", BranchID: "BR-KHI-03", Code: "KHI-MID", Name: "Clifton Middle Wing", Type: "Middle", GradeRange: "Class 6 - Class 8", HeadName: "Engr. Bilal Hashmi", Status: "ACTIVE"},
		{ID: "WNG-KHI-SNR", BranchID: "BR-KHI-03", Code: "KHI-SNR", Name: "Clifton Senior & Cambridge Wing", Type: "Senior", GradeRange: "Class 9 - O-Level", HeadName: "Prof. Asadullah Qazi", Status: "ACTIVE"},
	}
}

func DefaultSchoolGatewaySettings() SchoolGatewaySettings {
	return SchoolGatewaySettings{
		Currency:                  "PKR",
		AllowOnlineStudentPayment: true,
		AllowOnlineParentPayment:  true,
		AllowPartialOnlinePayment: false,
		RequireProofReference:     true,
		AutoIssueReceiptOnVerify:  true,
		OneBillPrefix:             "10089",
		LateFeeGraceDays:          5,
		LateFeeFinePkr:            500,
		ReceiptFooterNote:         "Authorized by School Owner. Valid across JazzCash, Easypaisa, Raast, 1Bill & Bank Counters.",
		OwnerNotifyOnPayment:      true,
		CustomPolicyFields:        []CustomFieldKV{},
	}
}

func DefaultSchoolPaymentGateways(tenantID string) []SchoolPaymentGateway {
	safeTid := SanitizeTenantSlug(tenantID)
	allPortals := []string{"owner", "principal", "accountant", "student", "parent"}
	staffPortals := []string{"owner", "principal", "accountant"}

	return []SchoolPaymentGateway{
		{
			ID:               "PGW-" + safeTid + "-raast",
			TenantID:         tenantID,
			BranchID:         "ALL",
			BranchName:       "All Campus Branches",
			WingID:           "ALL",
			WingName:         "All Academic Wings",
			ProviderKey:      "raast",
			DisplayName:      "Raast Instant IBFT",
			Category:         "raast_ibft",
			AccountTitle:     "SoftCode International School",
			AccountNumber:    "0300-8451920",
			IBAN:             "PK36MEZN0001020105829102",
			RaastID:          "03008451920",
			BankName:         "State Bank Raast (Meezan Linked)",
			BranchCode:       "0102",
			MerchantID:       "RAAST-PK-01",
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Zero-fee instant State Bank Raast transfer from any Pakistani bank app using Raast ID or IBAN. Submit TRX ID below.",
			AllowedPortals:   allPortals,
			CustomFields:     []CustomFieldKV{{Label: "Settlement Cycle", Value: "Instant T+0 (SBP Raast)"}},
			IsEnabled:        true,
			IsDefault:        true,
			SortOrder:        10,
		},
		{
			ID:               "PGW-" + safeTid + "-jazzcash",
			TenantID:         tenantID,
			BranchID:         "ALL",
			BranchName:       "All Campus Branches",
			WingID:           "ALL",
			WingName:         "All Academic Wings",
			ProviderKey:      "jazzcash",
			DisplayName:      "JazzCash Merchant & Wallet",
			Category:         "mobile_wallet",
			AccountTitle:     "SoftCode International School",
			AccountNumber:    "0300-8451920",
			RaastID:          "03008451920",
			BankName:         "JazzCash Mobilink Microfinance",
			TillID:           "982140",
			MerchantID:       "JC-PK-8820",
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Open JazzCash App -> Till Pay (Till # 982140) or Send Money to 0300-8451920 -> Enter 11-digit TID below.",
			AllowedPortals:   allPortals,
			CustomFields:     []CustomFieldKV{{Label: "CNIC Tail / Helpline", Value: "042-35761201"}},
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        20,
		},
		{
			ID:               "PGW-" + safeTid + "-easypaisa",
			TenantID:         tenantID,
			BranchID:         "ALL",
			BranchName:       "All Campus Branches",
			WingID:           "ALL",
			WingName:         "All Academic Wings",
			ProviderKey:      "easypaisa",
			DisplayName:      "Easypaisa Merchant & QR",
			Category:         "mobile_wallet",
			AccountTitle:     "SoftCode International School",
			AccountNumber:    "0345-9182736",
			RaastID:          "03459182736",
			BankName:         "Easypaisa Telenor Microfinance",
			TillID:           "441098",
			MerchantID:       "EP-PK-4410",
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Open Easypaisa App -> Send Money / QR Pay to 0345-9182736 -> Enter TRX ID in payment form.",
			AllowedPortals:   allPortals,
			CustomFields:     []CustomFieldKV{{Label: "Merchant QR Code ID", Value: "EP-QR-441098"}},
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        30,
		},
		{
			ID:               "PGW-" + safeTid + "-onebill",
			TenantID:         tenantID,
			BranchID:         "ALL",
			BranchName:       "All Campus Branches",
			WingID:           "ALL",
			WingName:         "All Academic Wings",
			ProviderKey:      "onebill",
			DisplayName:      "1Link / 1Bill Fee Voucher (KuickPay)",
			Category:         "1link_1bill",
			AccountTitle:     "SoftCode Fee Collection",
			AccountNumber:    "10089",
			BankName:         "1Link / KuickPay All PK Banks",
			BranchCode:       "1LINK",
			BillerCode:       "10089",
			MerchantID:       "KP-10089",
			FeeType:          "fixed",
			FeeValue:         50,
			VerificationMode: "auto_instant",
			Instructions:     "Pay from any Pakistani bank app via Bill Payment -> 1Bill Invoice / KuickPay using Biller Prefix 10089 + Challan Number.",
			AllowedPortals:   allPortals,
			CustomFields:     []CustomFieldKV{{Label: "1Bill Consumer Format", Value: "10089 + Roll / Challan #"}},
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        40,
		},
		{
			ID:               "PGW-" + safeTid + "-meezan",
			TenantID:         tenantID,
			BranchID:         "ALL",
			BranchName:       "All Campus Branches",
			WingID:           "ALL",
			WingName:         "All Academic Wings",
			ProviderKey:      "meezan_bank",
			DisplayName:      "Meezan Bank (Islamic Banking)",
			Category:         "bank_challan",
			AccountTitle:     "SoftCode International School",
			AccountNumber:    "0102-0105829102",
			IBAN:             "PK36MEZN0001020105829102",
			BankName:         "Meezan Bank Limited",
			BranchCode:       "0102",
			MerchantID:       "MEZN-0102",
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Deposit 3-Copy Bank Challan at any Meezan Bank branch counter or transfer via Meezan Mobile App and enter Bank Slip / IBFT Ref.",
			AllowedPortals:   allPortals,
			CustomFields:     []CustomFieldKV{{Label: "Branch Name", Value: "Gulberg III Main Branch, Lahore"}},
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        50,
		},
		{
			ID:               "PGW-" + safeTid + "-hbl",
			TenantID:         tenantID,
			BranchID:         "ALL",
			BranchName:       "All Campus Branches",
			WingID:           "ALL",
			WingName:         "All Academic Wings",
			ProviderKey:      "hbl_bank",
			DisplayName:      "HBL (Habib Bank Limited)",
			Category:         "bank_challan",
			AccountTitle:     "SoftCode International School",
			AccountNumber:    "0042-799102938",
			IBAN:             "PK48HABB0000427991029380",
			BankName:         "Habib Bank Limited (HBL)",
			BranchCode:       "0042",
			MerchantID:       "HBL-0042",
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Deposit fee challan at HBL Branch or transfer via HBL Mobile / Konnect and submit Reference #.",
			AllowedPortals:   allPortals,
			CustomFields:     []CustomFieldKV{{Label: "Branch Name", Value: "Liberty Market Branch, Lahore"}},
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        60,
		},
		{
			ID:               "PGW-" + safeTid + "-sadapay",
			TenantID:         tenantID,
			BranchID:         "ALL",
			BranchName:       "All Campus Branches",
			WingID:           "ALL",
			WingName:         "All Academic Wings",
			ProviderKey:      "sadapay_nayapay",
			DisplayName:      "SadaPay / NayaPay Wallet",
			Category:         "mobile_wallet",
			AccountTitle:     "SoftCode Accounts Desk",
			AccountNumber:    "0312-7744110",
			IBAN:             "PK22SADA0000003127744110",
			RaastID:          "03127744110",
			BankName:         "SadaPay / NayaPay PK",
			MerchantID:       "SP-NP-PK",
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "slip_review",
			Instructions:     "Send instant Raast or IBFT transfer from SadaPay / NayaPay and enter Transaction Ref #.",
			AllowedPortals:   allPortals,
			CustomFields:     []CustomFieldKV{},
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        70,
		},
		{
			ID:               "PGW-" + safeTid + "-cash",
			TenantID:         tenantID,
			BranchID:         "ALL",
			BranchName:       "All Campus Branches",
			WingID:           "ALL",
			WingName:         "All Academic Wings",
			ProviderKey:      "cash_counter",
			DisplayName:      "Cash at School Fee Counter",
			Category:         "cash_counter",
			AccountTitle:     "School Bursar / Accounts Counter",
			AccountNumber:    "COUNTER-DESK",
			BankName:         "Campus Cash Desk",
			BranchCode:       "DESK-01",
			MerchantID:       "CASH-DESK",
			FeeType:          "none",
			FeeValue:         0,
			VerificationMode: "counter_cash",
			Instructions:     "Pay cash directly at School Accountant or Principal Fee Desk and collect stamped official receipt.",
			AllowedPortals:   staffPortals,
			CustomFields:     []CustomFieldKV{},
			IsEnabled:        true,
			IsDefault:        false,
			SortOrder:        80,
		},
	}
}

// EnsureSchoolPhase3Schema ensures all tables & migration columns used by school Phase 3 routes exist.
func EnsureSchoolPhase3Schema(db *sql.DB) error {
	if db == nil {
		return nil
	}
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS local_school_branches (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			code TEXT NOT NULL,
			name TEXT NOT NULL,
			city TEXT,
			address TEXT,
			phone TEXT,
			principal_name TEXT,
			accountant_name TEXT,
			established_year TEXT,
			status TEXT DEFAULT 'ACTIVE',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_wings (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT NOT NULL,
			code TEXT NOT NULL,
			name TEXT NOT NULL,
			wing_type TEXT DEFAULT 'General',
			grade_range TEXT,
			head_name TEXT,
			status TEXT DEFAULT 'ACTIVE',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_students (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT DEFAULT 'BR-LHR-01',
			wing_id TEXT DEFAULT 'WNG-LHR-SR',
			roll_no TEXT NOT NULL,
			full_name TEXT NOT NULL,
			grade TEXT NOT NULL,
			section TEXT DEFAULT 'A',
			gender TEXT DEFAULT 'Male',
			dob TEXT,
			student_bform TEXT,
			passport_no TEXT,
			nationality TEXT DEFAULT 'Pakistani',
			blood_group TEXT DEFAULT 'B+',
			guardian_name TEXT,
			guardian_relation TEXT DEFAULT 'Father',
			guardian_cnic TEXT,
			guardian_occupation TEXT,
			guardian_email TEXT,
			phone TEXT,
			emergency_contact TEXT,
			address TEXT,
			previous_school TEXT,
			medical_conditions TEXT,
			fee_amount REAL DEFAULT 18000,
			due_bakaya REAL DEFAULT 0,
			fee_status TEXT DEFAULT 'PENDING',
			attendance_rate TEXT DEFAULT '96%',
			admission_date TEXT,
			rfid_card TEXT,
			status TEXT DEFAULT 'ACTIVE',
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_fees (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT DEFAULT 'BR-LHR-01',
			wing_id TEXT DEFAULT 'WNG-LHR-SR',
			challan_no TEXT NOT NULL,
			student_id TEXT,
			student_name TEXT NOT NULL,
			roll_no TEXT NOT NULL,
			grade TEXT NOT NULL,
			month TEXT NOT NULL,
			tuition REAL DEFAULT 0,
			lab_fee REAL DEFAULT 0,
			discount REAL DEFAULT 0,
			total REAL NOT NULL,
			paid_amount REAL DEFAULT 0,
			status TEXT DEFAULT 'PENDING',
			payment_mode TEXT,
			resource_reference TEXT,
			collected_by TEXT,
			collector_role TEXT DEFAULT 'owner',
			notes TEXT,
			due_date TEXT,
			paid_date TEXT,
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_teachers (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT DEFAULT 'BR-LHR-01',
			wing_id TEXT DEFAULT 'WNG-LHR-SR',
			emp_code TEXT NOT NULL,
			name TEXT NOT NULL,
			father_name TEXT,
			designation TEXT NOT NULL,
			department TEXT NOT NULL,
			subject TEXT,
			qualification TEXT,
			classes TEXT,
			incharge_class TEXT,
			gender TEXT DEFAULT 'Male',
			dob TEXT,
			blood_group TEXT DEFAULT 'B+',
			cnic TEXT,
			passport_no TEXT,
			nationality TEXT DEFAULT 'Pakistani',
			phone TEXT NOT NULL,
			emergency_contact TEXT,
			email TEXT,
			address TEXT,
			salary TEXT NOT NULL,
			basic_salary REAL DEFAULT 0,
			salary_status TEXT DEFAULT 'Pending',
			last_salary_month TEXT,
			status TEXT DEFAULT 'ACTIVE',
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_staff (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT DEFAULT 'BR-LHR-01',
			wing_id TEXT DEFAULT 'WNG-LHR-SR',
			emp_code TEXT NOT NULL,
			name TEXT NOT NULL,
			father_name TEXT,
			cnic TEXT,
			passport_no TEXT,
			nationality TEXT DEFAULT 'Pakistani',
			gender TEXT DEFAULT 'Male',
			dob TEXT,
			blood_group TEXT DEFAULT 'B+',
			role_title TEXT NOT NULL,
			department TEXT DEFAULT 'Administration',
			phone TEXT,
			emergency_contact TEXT,
			address TEXT,
			shift TEXT DEFAULT 'Morning (07:30 AM - 03:00 PM)',
			status TEXT DEFAULT 'ACTIVE',
			attendance_status TEXT DEFAULT 'Absent',
			face_enrolled INTEGER DEFAULT 0,
			fingerprint_enrolled INTEGER DEFAULT 0,
			lite_enabled INTEGER DEFAULT 1,
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_principals (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT DEFAULT 'BR-LHR-01',
			wing_id TEXT DEFAULT 'WNG-LHR-SR',
			emp_code TEXT NOT NULL,
			name TEXT NOT NULL,
			father_name TEXT,
			cnic TEXT,
			passport_no TEXT,
			nationality TEXT DEFAULT 'Pakistani',
			gender TEXT DEFAULT 'Male',
			dob TEXT,
			blood_group TEXT DEFAULT 'O+',
			role_title TEXT NOT NULL,
			department TEXT DEFAULT 'Executive Directorate',
			phone TEXT,
			emergency_contact TEXT,
			email TEXT,
			address TEXT,
			shift TEXT DEFAULT 'Full Day (07:30 AM - 04:00 PM)',
			status TEXT DEFAULT 'ACTIVE',
			attendance_status TEXT DEFAULT 'Absent',
			face_enrolled INTEGER DEFAULT 0,
			fingerprint_enrolled INTEGER DEFAULT 0,
			lite_enabled INTEGER DEFAULT 1,
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_audit_logs (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT DEFAULT 'BR-LHR-01',
			wing_id TEXT DEFAULT 'WNG-LHR-SR',
			timestamp TEXT NOT NULL,
			operator_name TEXT NOT NULL,
			operator_role TEXT NOT NULL,
			action_type TEXT NOT NULL,
			category TEXT NOT NULL,
			entity_id TEXT NOT NULL,
			entity_description TEXT,
			details TEXT,
			severity TEXT DEFAULT 'Normal Audit',
			verified_by TEXT,
			ip_address TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_payment_gateways (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT DEFAULT 'ALL',
			wing_id TEXT DEFAULT 'ALL',
			provider_key TEXT NOT NULL,
			display_name TEXT NOT NULL,
			category TEXT DEFAULT 'mobile_wallet',
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
			webhook_url TEXT,
			fee_type TEXT DEFAULT 'none',
			fee_value REAL DEFAULT 0,
			verification_mode TEXT DEFAULT 'slip_review',
			instructions TEXT,
			allowed_portals_json TEXT DEFAULT '["owner","principal","accountant","student","parent"]',
			custom_fields_json TEXT DEFAULT '[]',
			is_enabled INTEGER DEFAULT 1,
			is_default INTEGER DEFAULT 0,
			sort_order INTEGER DEFAULT 10,
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_gateway_settings (
			tenant_id TEXT PRIMARY KEY,
			settings_json TEXT NOT NULL,
			is_synced INTEGER DEFAULT 0,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS local_school_payment_transactions (
			id TEXT PRIMARY KEY,
			tenant_id TEXT DEFAULT 'tenant-root-platform',
			branch_id TEXT DEFAULT 'BR-LHR-01',
			wing_id TEXT DEFAULT 'WNG-LHR-SR',
			txn_ref TEXT NOT NULL,
			challan_no TEXT,
			gateway_id TEXT NOT NULL,
			gateway_name TEXT NOT NULL,
			provider_key TEXT NOT NULL,
			student_id TEXT,
			student_name TEXT NOT NULL,
			roll_no TEXT,
			grade TEXT,
			guardian_name TEXT,
			payer_phone TEXT,
			payer_account_title TEXT,
			month TEXT,
			base_amount REAL NOT NULL,
			gateway_fee REAL DEFAULT 0,
			total_amount REAL NOT NULL,
			currency TEXT DEFAULT 'PKR',
			status TEXT DEFAULT 'PENDING_VERIFICATION',
			verification_mode TEXT DEFAULT 'slip_review',
			proof_reference TEXT,
			proof_notes TEXT,
			proof_screenshot TEXT DEFAULT '',
			submitted_by_name TEXT,
			submitted_by_role TEXT DEFAULT 'parent',
			verified_by TEXT,
			verified_at TEXT,
			rejection_reason TEXT,
			linked_fee_id TEXT,
			custom_fields_json TEXT DEFAULT '{}',
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_school_pg_gateways_tenant ON local_school_payment_gateways (tenant_id, sort_order);
		CREATE INDEX IF NOT EXISTS idx_school_pg_txns_tenant_status ON local_school_payment_transactions (tenant_id, status, created_at);
		CREATE INDEX IF NOT EXISTS idx_school_pg_txns_student ON local_school_payment_transactions (tenant_id, student_id);
	`)
	if err != nil {
		return err
	}

	// Safe column migrations for pre-existing databases created from older schemas.
	_, _ = db.Exec(`ALTER TABLE local_school_payment_transactions ADD COLUMN proof_screenshot TEXT DEFAULT '';`)
	_, _ = db.Exec(`ALTER TABLE local_school_fees ADD COLUMN paid_amount REAL DEFAULT 0;`)
	_, _ = db.Exec(`ALTER TABLE local_school_fees ADD COLUMN notes TEXT;`)
	_, _ = db.Exec(`ALTER TABLE local_school_students ADD COLUMN rfid_card TEXT;`)
	_, _ = db.Exec(`ALTER TABLE local_school_students ADD COLUMN due_bakaya REAL DEFAULT 0;`)
	_, _ = db.Exec(`ALTER TABLE local_school_staff ADD COLUMN fingerprint_enrolled INTEGER DEFAULT 0;`)
	_, _ = db.Exec(`ALTER TABLE local_school_principals ADD COLUMN fingerprint_enrolled INTEGER DEFAULT 0;`)
	return nil
}
