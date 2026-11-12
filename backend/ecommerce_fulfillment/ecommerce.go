package ecommerce_fulfillment

type FulfillmentParcel struct {
	ID           string `json:"id"`
	ParcelNo     string `json:"parcelNo"`
	Store        string `json:"store"`
	Recipient    string `json:"recipient"`
	WarehouseBin string `json:"warehouseBin"`
	Status       string `json:"status"`
}
