package construction_contractor

type Project struct {
	ID         string  `json:"id"`
	Code       string  `json:"code"`
	Title      string  `json:"title"`
	Site       string  `json:"site"`
	Completion string  `json:"completion"`
	BudgetUSD  float64 `json:"budgetUsd"`
	Engineer   string  `json:"engineer"`
	Status     string  `json:"status"` // IN_PROGRESS, FINAL_FINISHING, COMPLETED
}
