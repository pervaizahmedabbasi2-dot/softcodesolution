package travel_agency

type TourPackage struct {
	ID        string  `json:"id"`
	Code      string  `json:"code"`
	Title     string  `json:"title"`
	DestCity  string  `json:"destCity"`
	Duration  string  `json:"duration"`
	PriceUSD  float64 `json:"priceUsd"`
	Status    string  `json:"status"` // AVAILABLE, FULL
}

type VisaTracker struct {
	ID        string `json:"id"`
	Applicant string `json:"applicant"`
	Country   string `json:"country"`
	Passport  string `json:"passport"`
	Embassy   string `json:"embassy"`
	Status    string `json:"status"` // APPLIED, UNDER_REVIEW, APPROVED
}
