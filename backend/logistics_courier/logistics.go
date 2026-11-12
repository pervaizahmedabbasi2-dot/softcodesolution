package logistics_courier

type Shipment struct {
	ID          string `json:"id"`
	TrackingNo  string `json:"trackingNo"`
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	Driver      string `json:"driver"`
	Status      string `json:"status"` // IN_TRANSIT, DELIVERED, DISPATCHED
	ETA         string `json:"eta"`
}
