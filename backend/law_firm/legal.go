package law_firm

type LegalCase struct {
	ID         string  `json:"id"`
	CaseNo     string  `json:"caseNo"`
	Client     string  `json:"client"`
	Court      string  `json:"court"`
	Judge      string  `json:"judge"`
	Advocate   string  `json:"advocate"`
	HearingDate string `json:"hearingDate"`
	RetainerFee float64 `json:"retainerFee"`
	Status     string  `json:"status"` // ACTIVE, HEARING_SCHEDULED, WON, CLOSED
}
