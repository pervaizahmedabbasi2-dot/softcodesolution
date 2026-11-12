package hotel_hospitality

type Room struct {
	ID        string  `json:"id"`
	RoomNo    string  `json:"roomNo"`
	Type      string  `json:"type"` // Deluxe, Executive Suite, Standard
	RatePerNight float64 `json:"ratePerNight"`
	Status    string  `json:"status"` // VACANT, OCCUPIED, CLEANING
	Floor     int     `json:"floor"`
}

type Booking struct {
	ID         string  `json:"id"`
	BookingRef string  `json:"bookingRef"`
	GuestName  string  `json:"guestName"`
	RoomNo     string  `json:"roomNo"`
	CheckIn    string  `json:"checkIn"`
	CheckOut   string  `json:"checkOut"`
	TotalBill  float64 `json:"totalBill"`
	Status     string  `json:"status"`
}
