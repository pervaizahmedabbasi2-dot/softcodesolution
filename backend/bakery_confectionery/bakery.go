package bakery_confectionery

type BakeryBatch struct {
	ID            string `json:"id"`
	Product       string `json:"product"`
	QuantityBaked int    `json:"quantityBaked"`
	Oven          string `json:"oven"`
	BakedAt       string `json:"bakedAt"`
	Status        string `json:"status"` // FRESH, PACKED, SOLD_OUT
}
