package supermarket_grocery

type GroceryItem struct {
	ID       string  `json:"id"`
	Barcode  string  `json:"barcode"`
	Item     string  `json:"item"`
	Category string  `json:"category"`
	Price    float64 `json:"price"`
	Stock    int     `json:"stock"`
}
