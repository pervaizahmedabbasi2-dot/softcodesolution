package restaurant

type Table struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Zone       string  `json:"zone"`
	Seats      int     `json:"seats"`
	Guests     int     `json:"guests"`
	Status     string  `json:"status"` // OCCUPIED, VACANT, BILL_PRINTED, RESERVED
	OrderTotal float64 `json:"orderTotal"`
	Waiter     string  `json:"waiter"`
}

type MenuItem struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Category       string  `json:"category"`
	Price          float64 `json:"price"`
	PrepTime       string  `json:"prepTime"`
	KitchenStation string  `json:"kitchenStation"`
	Available      bool    `json:"available"`
}

type KdsTicket struct {
	ID        string   `json:"id"`
	Table     string   `json:"table"`
	Items     []string `json:"items"`
	Status    string   `json:"status"` // PREPARING, READY, SERVED
	OrderTime string   `json:"orderTime"`
}
