package auto_workshop

type RepairJob struct {
	ID        string  `json:"id"`
	JobNo     string  `json:"jobNo"`
	Vehicle   string  `json:"vehicle"`
	Customer  string  `json:"customer"`
	Mechanic  string  `json:"mechanic"`
	Service   string  `json:"service"`
	Estimate  float64 `json:"estimate"`
	Status    string  `json:"status"` // QUEUED, IN_PROGRESS, READY_DELIVERY
	Date      string  `json:"date"`
}

type RentalVehicle struct {
	ID         string  `json:"id"`
	Vehicle    string  `json:"vehicle"`
	Plate      string  `json:"plate"`
	RatePerDay float64 `json:"ratePerDay"`
	Status     string  `json:"status"` // AVAILABLE, ON_RENT
	Hirer      string  `json:"hirer"`
	ReturnDate string  `json:"returnDate"`
}
