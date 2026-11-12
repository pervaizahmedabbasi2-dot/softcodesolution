package car_rental

type CarRentalAgreement struct {
	ID         string  `json:"id"`
	Vehicle    string  `json:"vehicle"`
	PlateNo    string  `json:"plateNo"`
	Hirer      string  `json:"hirer"`
	PerDayUSD  float64 `json:"perDayUsd"`
	ReturnDate string  `json:"returnDate"`
	Status     string  `json:"status"`
}
