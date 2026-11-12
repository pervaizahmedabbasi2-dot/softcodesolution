package real_estate

type Property struct {
	ID          string   `json:"id"`
	Code        string   `json:"code"`
	Title       string   `json:"title"`
	Type        string   `json:"type"` // Residential, Commercial, Industrial
	Address     string   `json:"address"`
	AreaSqFt    float64  `json:"areaSqFt"`
	Bedrooms    int      `json:"bedrooms"`
	Bathrooms   int      `json:"bathrooms"`
	MonthlyRent float64  `json:"monthlyRent"`
	SalePrice   float64  `json:"salePrice"`
	Status      string   `json:"status"` // AVAILABLE, RENTED, SOLD
	Tenant      string   `json:"tenant,omitempty"`
	Amenities   []string `json:"amenities"`
}

type LeaseAgreement struct {
	ID          string  `json:"id"`
	AgreementNo string  `json:"agreementNo"`
	PropertyID  string  `json:"propertyId"`
	TenantName  string  `json:"tenantName"`
	MonthlyRent float64 `json:"monthlyRent"`
	Deposit     float64 `json:"deposit"`
	StartDate   string  `json:"startDate"`
	EndDate     string  `json:"endDate"`
	Status      string  `json:"status"`
}
