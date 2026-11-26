package retail

import (
	"database/sql"
	"strings"
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
	CreatedAt      time.Time `json:"createdAt,omitempty"`
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

// DefaultRetailProducts returns canonical default catalog matching Node retail.routes.js.
func DefaultRetailProducts() []Product {
	return []Product{
		{ID: "prd-101", Name: "Ultra Wireless Noise-Cancelling Headphones", Category: "Electronics", SKU: "ELEC-9021", Barcode: "890123456789", CostPrice: 45.00, SellingPrice: 89.99, Stock: 42, AlertThreshold: 10, Status: "In Stock"},
		{ID: "prd-102", Name: "Organic Arabica Espresso Roast 500g", Category: "Groceries", SKU: "GROC-4412", Barcode: "890987654321", CostPrice: 6.50, SellingPrice: 14.50, Stock: 110, AlertThreshold: 20, Status: "In Stock"},
		{ID: "prd-103", Name: "Mechanical RGB Gaming Keyboard (Blue Switch)", Category: "Electronics", SKU: "ELEC-3382", Barcode: "890334455667", CostPrice: 32.00, SellingPrice: 64.99, Stock: 18, AlertThreshold: 5, Status: "In Stock"},
		{ID: "prd-104", Name: "Stainless Steel Insulated Thermal Flask 1L", Category: "Home & Living", SKU: "HOME-1109", Barcode: "890778899001", CostPrice: 8.00, SellingPrice: 19.99, Stock: 65, AlertThreshold: 15, Status: "In Stock"},
		{ID: "prd-105", Name: "Cotton Crew Neck Minimalist Tee (Navy/L)", Category: "Fashion", SKU: "FASH-8820", Barcode: "890556677889", CostPrice: 7.20, SellingPrice: 22.00, Stock: 4, AlertThreshold: 10, Status: "Low Stock"},
		{ID: "prd-106", Name: "Ergonomic Memory Foam Lumbar Cushion", Category: "Office", SKU: "OFF-6651", Barcode: "890223344556", CostPrice: 11.50, SellingPrice: 28.50, Stock: 0, AlertThreshold: 8, Status: "Out of Stock"},
	}
}

// EnsureRetailSchema ensures local_retail_products exists in SQLite.
func EnsureRetailSchema(db *sql.DB) error {
	if db == nil {
		return nil
	}
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS local_retail_products (
			id TEXT PRIMARY KEY,
			sku TEXT UNIQUE NOT NULL,
			barcode TEXT UNIQUE,
			name TEXT NOT NULL,
			category TEXT NOT NULL,
			cost_price REAL DEFAULT 0,
			selling_price REAL NOT NULL,
			stock_quantity INTEGER DEFAULT 0,
			min_stock_alert INTEGER DEFAULT 10,
			status TEXT DEFAULT 'IN_STOCK',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
	return err
}

// LookupProductByBarcodeOrSKU searches SQLite local_retail_products first, then DefaultRetailProducts.
func LookupProductByBarcodeOrSKU(db *sql.DB, code string) (Product, bool, error) {
	upper := strings.ToUpper(strings.TrimSpace(code))
	if upper == "" {
		return Product{}, false, nil
	}

	if db != nil {
		_ = EnsureRetailSchema(db)
		row := db.QueryRow(`
			SELECT id, COALESCE(name, ''), COALESCE(category, 'General'), COALESCE(sku, ''),
			       COALESCE(barcode, ''), COALESCE(cost_price, 0), COALESCE(selling_price, 0),
			       COALESCE(stock_quantity, 0), COALESCE(min_stock_alert, 10), COALESCE(status, 'In Stock')
			FROM local_retail_products
			WHERE UPPER(TRIM(COALESCE(barcode, ''))) = ? OR UPPER(TRIM(COALESCE(sku, ''))) = ?
			LIMIT 1
		`, upper, upper)

		var p Product
		if err := row.Scan(
			&p.ID, &p.Name, &p.Category, &p.SKU,
			&p.Barcode, &p.CostPrice, &p.SellingPrice,
			&p.Stock, &p.AlertThreshold, &p.Status,
		); err == nil {
			return p, true, nil
		} else if err != sql.ErrNoRows {
			return Product{}, false, err
		}
	}

	for _, p := range DefaultRetailProducts() {
		if strings.ToUpper(strings.TrimSpace(p.Barcode)) == upper || strings.ToUpper(strings.TrimSpace(p.SKU)) == upper {
			return p, true, nil
		}
	}
	return Product{}, false, nil
}
