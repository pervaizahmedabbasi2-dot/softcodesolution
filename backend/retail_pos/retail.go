package retail

import (
	"time"
)

type Product struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Category       string    `json:"category"`
	SKU            string    `json:"sku"`
	Barcode        string    `json:"barcode"`
	CostPrice      float64   `json:"costPrice"`
	SellingPrice   float64   `json:"sellingPrice"`
	Stock          int       `json:"stock"`
	AlertThreshold int       `json:"alertThreshold"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
}

type OrderItem struct {
	ProductID string  `json:"productId"`
	Name      string  `json:"name"`
	Quantity  int     `json:"qty"`
	UnitPrice float64 `json:"unitPrice"`
	Total     float64 `json:"total"`
}

type PosOrder struct {
	ID            string      `json:"id"`
	ReceiptNo     string      `json:"receiptNo"`
	CustomerName  string      `json:"customerName"`
	ItemsCount    int         `json:"itemsCount"`
	TotalAmount   float64     `json:"totalAmount"`
	PaymentMethod string      `json:"paymentMethod"`
	Cashier       string      `json:"cashier"`
	Items         []OrderItem `json:"items"`
	Date          time.Time   `json:"date"`
}
