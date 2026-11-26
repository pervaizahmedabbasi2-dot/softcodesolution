package pharmacy

import (
	"database/sql"
	"sort"
	"strings"
	"time"
)

type Medicine struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Generic    string    `json:"generic"`
	Category   string    `json:"category"`
	BatchNo    string    `json:"batchNo"`
	Barcode    string    `json:"barcode"`
	ExpiryDate string    `json:"expiryDate"`
	Stock      int       `json:"stock"`
	MinStock   int       `json:"minStock"`
	UnitPrice  float64   `json:"unitPrice"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"createdAt,omitempty"`
}

type MedicineBatch struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Generic    string  `json:"generic"`
	Category   string  `json:"category"`
	BatchNo    string  `json:"batchNo"`
	Barcode    string  `json:"barcode"`
	ExpiryDate string  `json:"expiryDate"`
	Stock      int     `json:"stock"`
	MinStock   int     `json:"minStock"`
	UnitPrice  float64 `json:"unitPrice"`
	Status     string  `json:"status"`
	IsExpired  bool    `json:"isExpired"`
}

type FEFOLookupResult struct {
	Strategy         string          `json:"strategy"`
	RecommendedBatch MedicineBatch   `json:"recommendedBatch"`
	Batches          []MedicineBatch `json:"batches"`
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

// DefaultPharmacyMedicines returns canonical medicines matching pharmacy.routes.js.
func DefaultPharmacyMedicines() []Medicine {
	return []Medicine{
		{ID: "med-1", Name: "Augmentin 625mg", Generic: "Co-Amoxiclav", Category: "Antibiotic", BatchNo: "AUG-9921", Barcode: "896400112201", ExpiryDate: "2027-02-15", Stock: 140, MinStock: 25, UnitPrice: 4.80, Status: "IN_STOCK"},
		{ID: "med-1b", Name: "Augmentin 625mg", Generic: "Co-Amoxiclav", Category: "Antibiotic", BatchNo: "AUG-8402", Barcode: "896400112201", ExpiryDate: "2026-08-10", Stock: 28, MinStock: 25, UnitPrice: 4.80, Status: "NEAR_EXPIRY"},
		{ID: "med-2", Name: "Panadol Extra", Generic: "Paracetamol + Caffeine", Category: "Analgesic", BatchNo: "PAN-4410", Barcode: "896400112202", ExpiryDate: "2026-11-20", Stock: 320, MinStock: 50, UnitPrice: 1.50, Status: "IN_STOCK"},
		{ID: "med-3", Name: "Nexum 40mg", Generic: "Esomeprazole", Category: "Antacid / PPI", BatchNo: "NEX-8812", Barcode: "896400112203", ExpiryDate: "2026-10-05", Stock: 12, MinStock: 20, UnitPrice: 3.20, Status: "LOW_STOCK"},
		{ID: "med-4", Name: "Zithromax 500mg", Generic: "Azithromycin", Category: "Antibiotic", BatchNo: "ZTH-3109", Barcode: "896400112204", ExpiryDate: "2026-04-10", Stock: 45, MinStock: 15, UnitPrice: 6.50, Status: "NEAR_EXPIRY"},
		{ID: "med-5", Name: "Glucophage 1000mg", Generic: "Metformin HCl", Category: "Antidiabetic", BatchNo: "GLU-5521", Barcode: "896400112205", ExpiryDate: "2027-08-30", Stock: 210, MinStock: 30, UnitPrice: 2.90, Status: "IN_STOCK"},
	}
}

// EnsurePharmacySchema ensures local_pharmacy_medicines exists with barcode column.
func EnsurePharmacySchema(db *sql.DB) error {
	if db == nil {
		return nil
	}
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS local_pharmacy_medicines (
			id TEXT PRIMARY KEY,
			batch_no TEXT NOT NULL,
			barcode TEXT DEFAULT '',
			brand_name TEXT NOT NULL,
			generic_formula TEXT NOT NULL,
			category TEXT NOT NULL,
			expiry_date TEXT NOT NULL,
			stock_quantity INTEGER DEFAULT 0,
			min_stock_alert INTEGER DEFAULT 20,
			unit_price REAL NOT NULL,
			status TEXT DEFAULT 'IN_STOCK',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return err
	}
	_, _ = db.Exec(`ALTER TABLE local_pharmacy_medicines ADD COLUMN barcode TEXT DEFAULT '';`)
	return nil
}

// LookupMedicineFEFO resolves barcode/batch/name and orders batches ascending by expiryDate (FEFO).
func LookupMedicineFEFO(db *sql.DB, code string, asOfDate string) (*FEFOLookupResult, bool, error) {
	upper := strings.ToUpper(strings.TrimSpace(code))
	if upper == "" {
		return nil, false, nil
	}

	todayIso := strings.TrimSpace(asOfDate)
	if todayIso == "" {
		todayIso = time.Now().UTC().Format("2006-01-02")
	}

	candidates := make([]Medicine, 0, 16)
	seen := make(map[string]bool)

	if db != nil {
		_ = EnsurePharmacySchema(db)
		rows, err := db.Query(`
			SELECT id, COALESCE(brand_name, ''), COALESCE(generic_formula, ''), COALESCE(category, ''),
			       COALESCE(batch_no, ''), COALESCE(barcode, ''), COALESCE(expiry_date, '2099-12-31'),
			       COALESCE(stock_quantity, 0), COALESCE(min_stock_alert, 20), COALESCE(unit_price, 0), COALESCE(status, 'IN_STOCK')
			FROM local_pharmacy_medicines
			WHERE UPPER(TRIM(COALESCE(barcode, ''))) = ?
			   OR UPPER(TRIM(COALESCE(batch_no, ''))) = ?
			   OR UPPER(TRIM(COALESCE(brand_name, ''))) = ?
		`, upper, upper, upper)
		if err != nil {
			return nil, false, err
		}
		defer rows.Close()
		for rows.Next() {
			var m Medicine
			if scanErr := rows.Scan(
				&m.ID, &m.Name, &m.Generic, &m.Category,
				&m.BatchNo, &m.Barcode, &m.ExpiryDate,
				&m.Stock, &m.MinStock, &m.UnitPrice, &m.Status,
			); scanErr == nil {
				candidates = append(candidates, m)
				seen[m.ID] = true
			}
		}
		if rowsErr := rows.Err(); rowsErr != nil {
			return nil, false, rowsErr
		}
	}

	for _, m := range DefaultPharmacyMedicines() {
		if seen[m.ID] {
			continue
		}
		if strings.ToUpper(strings.TrimSpace(m.Barcode)) == upper ||
			strings.ToUpper(strings.TrimSpace(m.BatchNo)) == upper ||
			strings.ToUpper(strings.TrimSpace(m.Name)) == upper {
			candidates = append(candidates, m)
			seen[m.ID] = true
		}
	}

	if len(candidates) == 0 {
		return nil, false, nil
	}

	batches := make([]MedicineBatch, 0, len(candidates))
	for _, m := range candidates {
		exp := strings.TrimSpace(m.ExpiryDate)
		if exp == "" {
			exp = "2099-12-31"
		}
		batches = append(batches, MedicineBatch{
			ID:         m.ID,
			Name:       m.Name,
			Generic:    m.Generic,
			Category:   m.Category,
			BatchNo:    m.BatchNo,
			Barcode:    m.Barcode,
			ExpiryDate: exp,
			Stock:      m.Stock,
			MinStock:   m.MinStock,
			UnitPrice:  m.UnitPrice,
			Status:     m.Status,
			IsExpired:  exp < todayIso,
		})
	}

	sort.SliceStable(batches, func(i, j int) bool {
		return batches[i].ExpiryDate < batches[j].ExpiryDate
	})

	recommended := batches[0]
	for _, b := range batches {
		if !b.IsExpired && b.Stock > 0 {
			recommended = b
			break
		}
	}

	return &FEFOLookupResult{
		Strategy:         "FEFO",
		RecommendedBatch: recommended,
		Batches:          batches,
	}, true, nil
}
