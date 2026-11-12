package pharmacy

import "time"

type Medicine struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Generic    string    `json:"generic"`
	Category   string    `json:"category"`
	BatchNo    string    `json:"batchNo"`
	ExpiryDate string    `json:"expiryDate"`
	Stock      int       `json:"stock"`
	MinStock   int       `json:"minStock"`
	UnitPrice  float64   `json:"unitPrice"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
}

type PrescriptionSale struct {
	ID          string    `json:"id"`
	BillNo      string    `json:"billNo"`
	Patient     string    `json:"patient"`
	Doctor      string    `json:"doctor"`
	TotalAmount float64   `json:"totalAmount"`
	ItemsCount  int       `json:"itemsCount"`
	Date        time.Time `json:"date"`
	Status      string    `json:"status"`
}
