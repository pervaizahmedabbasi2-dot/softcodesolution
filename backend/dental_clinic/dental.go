package dental_clinic

type DentalProcedure struct {
	ID        string  `json:"id"`
	Patient   string  `json:"patient"`
	Procedure string  `json:"procedure"`
	ToothNo   string  `json:"toothNo"`
	FeeUSD    float64 `json:"feeUsd"`
	Status    string  `json:"status"`
}
