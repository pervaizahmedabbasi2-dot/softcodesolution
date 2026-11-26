package logistics_courier

import (
	"database/sql"
	"strings"
)

type Shipment struct {
	ID          string  `json:"id"`
	TrackingNo  string  `json:"trackingNo"`
	Sender      string  `json:"sender"`
	Consignee   string  `json:"consignee"`
	Origin      string  `json:"origin"`
	Destination string  `json:"destination"`
	WeightKg    float64 `json:"weightKg"`
	CodAmount   float64 `json:"codAmount"`
	Driver      string  `json:"driver"`
	Status      string  `json:"status"` // IN_TRANSIT, DELIVERED, DISPATCHED
	ETA         string  `json:"eta,omitempty"`
	BookedDate  string  `json:"bookedDate"`
}

type Waybill struct {
	TrackingNo     string  `json:"trackingNo"`
	SenderName     string  `json:"senderName"`
	Origin         string  `json:"origin"`
	ConsigneeName  string  `json:"consigneeName"`
	Destination    string  `json:"destination"`
	WeightKg       float64 `json:"weightKg"`
	CodAmount      float64 `json:"codAmount"`
	RiderOrCarrier string  `json:"riderOrCarrier"`
	BookedDate     string  `json:"bookedDate"`
	Status         string  `json:"status"`
}

// DefaultCargoShipments returns canonical cargo shipments matching logistics.routes.js.
func DefaultCargoShipments() []Shipment {
	return []Shipment{
		{ID: "crg-1", TrackingNo: "EXP-PK-994102", Sender: "Karachi Wholesale Hub", Consignee: "Mustafa Electronics (Lahore)", Origin: "Karachi Port", Destination: "Lahore Central", WeightKg: 12.5, CodAmount: 420.00, Driver: "Rider Kashif (Bike 08)", Status: "IN_TRANSIT", BookedDate: "2026-03-26"},
		{ID: "crg-2", TrackingNo: "EXP-PK-994103", Sender: "Islamabad Medical Store", Consignee: "Dr. Zafar Clinic (Rawalpindi)", Origin: "Islamabad F-10", Destination: "Rawalpindi Saddar", WeightKg: 2.1, CodAmount: 85.00, Driver: "Rider Waqar (Van 02)", Status: "OUT_FOR_DELIVERY", BookedDate: "2026-03-27"},
		{ID: "crg-3", TrackingNo: "EXP-PK-994104", Sender: "Sialkot Surgical Instruments", Consignee: "Airport Cargo Terminal UK", Origin: "Sialkot S.I.E", Destination: "Heathrow London", WeightKg: 65.0, CodAmount: 0.00, Driver: "Freight Carrier Flight 701", Status: "DELIVERED", BookedDate: "2026-03-24"},
	}
}

// EnsureLogisticsSchema ensures local_logistics_shipments exists in SQLite.
func EnsureLogisticsSchema(db *sql.DB) error {
	if db == nil {
		return nil
	}
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS local_logistics_shipments (
			id TEXT PRIMARY KEY,
			tracking_no TEXT UNIQUE NOT NULL,
			sender_name TEXT NOT NULL,
			consignee_name TEXT NOT NULL,
			origin_city TEXT NOT NULL,
			destination_city TEXT NOT NULL,
			weight_kg REAL DEFAULT 1.0,
			cod_amount REAL DEFAULT 0,
			rider_assigned TEXT,
			status TEXT DEFAULT 'BOOKED',
			booked_date TEXT,
			is_synced INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
	return err
}

// LookupWaybill searches SQLite local_logistics_shipments first, then DefaultCargoShipments.
func LookupWaybill(db *sql.DB, trackingOrID string) (Waybill, bool, error) {
	upper := strings.ToUpper(strings.TrimSpace(trackingOrID))
	if upper == "" {
		return Waybill{}, false, nil
	}

	if db != nil {
		_ = EnsureLogisticsSchema(db)
		row := db.QueryRow(`
			SELECT COALESCE(tracking_no, ''), COALESCE(sender_name, ''), COALESCE(origin_city, ''),
			       COALESCE(consignee_name, ''), COALESCE(destination_city, ''), COALESCE(weight_kg, 1),
			       COALESCE(cod_amount, 0), COALESCE(rider_assigned, ''), COALESCE(booked_date, ''),
			       COALESCE(status, 'BOOKED')
			FROM local_logistics_shipments
			WHERE UPPER(TRIM(COALESCE(tracking_no, ''))) = ? OR UPPER(TRIM(COALESCE(id, ''))) = ?
			LIMIT 1
		`, upper, upper)

		var wb Waybill
		if err := row.Scan(
			&wb.TrackingNo, &wb.SenderName, &wb.Origin,
			&wb.ConsigneeName, &wb.Destination, &wb.WeightKg,
			&wb.CodAmount, &wb.RiderOrCarrier, &wb.BookedDate,
			&wb.Status,
		); err == nil {
			if wb.WeightKg <= 0 {
				wb.WeightKg = 1
			}
			return wb, true, nil
		} else if err != sql.ErrNoRows {
			return Waybill{}, false, err
		}
	}

	for _, s := range DefaultCargoShipments() {
		if strings.ToUpper(strings.TrimSpace(s.TrackingNo)) == upper || strings.ToUpper(strings.TrimSpace(s.ID)) == upper {
			weight := s.WeightKg
			if weight <= 0 {
				weight = 1
			}
			return Waybill{
				TrackingNo:     s.TrackingNo,
				SenderName:     s.Sender,
				Origin:         s.Origin,
				ConsigneeName:  s.Consignee,
				Destination:    s.Destination,
				WeightKg:       weight,
				CodAmount:      s.CodAmount,
				RiderOrCarrier: s.Driver,
				BookedDate:     s.BookedDate,
				Status:         s.Status,
			}, true, nil
		}
	}
	return Waybill{}, false, nil
}
