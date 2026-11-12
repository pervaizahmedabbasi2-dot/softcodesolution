package wholesale_distribution

type WholesaleOrder struct {
	ID         string  `json:"id"`
	InvoiceNo  string  `json:"invoiceNo"`
	Retailer   string  `json:"retailer"`
	ItemsCount int     `json:"itemsCount"`
	TotalUSD   float64 `json:"totalUsd"`
	Status     string  `json:"status"`
}
