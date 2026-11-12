package beauty_salon

type Appointment struct {
	ID        string  `json:"id"`
	ApptNo    string  `json:"apptNo"`
	Client    string  `json:"client"`
	Service   string  `json:"service"`
	Stylist   string  `json:"stylist"`
	Chair     string  `json:"chair"`
	TimeSlot  string  `json:"timeSlot"`
	Price     float64 `json:"price"`
	Status    string  `json:"status"` // CONFIRMED, IN_SERVICE, COMPLETED
}
