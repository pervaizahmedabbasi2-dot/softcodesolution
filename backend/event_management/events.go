package event_management

type EventBooking struct {
	ID        string  `json:"id"`
	Code      string  `json:"code"`
	Title     string  `json:"title"`
	Venue     string  `json:"venue"`
	Guests    int     `json:"guests"`
	Date      string  `json:"date"`
	BudgetUSD float64 `json:"budgetUsd"`
	Status    string  `json:"status"` // PLANNING, CONFIRMED, EXECUTED
}
