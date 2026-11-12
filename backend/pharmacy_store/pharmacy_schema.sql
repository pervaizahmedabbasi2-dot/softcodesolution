-- ===========================================================================
-- PHARMACY & DRUGSTORE DOMAIN SCHEMA
-- ===========================================================================

-- Prescription Dispensing Sales
CREATE TABLE IF NOT EXISTS local_pharmacy_sales (
  id TEXT PRIMARY KEY,
  bill_no TEXT UNIQUE NOT NULL,
  patient_name TEXT,
  doctor_name TEXT,
  total_amount REAL NOT NULL,
  items_count INTEGER DEFAULT 1,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medicine Batch & Expiry Stock
CREATE TABLE IF NOT EXISTS local_pharmacy_medicines (
  id TEXT PRIMARY KEY,
  batch_no TEXT NOT NULL,
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
