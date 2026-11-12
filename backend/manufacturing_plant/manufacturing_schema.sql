-- Manufacturing Plant & Production ERP Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_manufacturing_work_orders (
  id TEXT PRIMARY KEY,
  wo_number TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  bom_code TEXT,
  target_qty INTEGER NOT NULL DEFAULT 0,
  produced_qty INTEGER DEFAULT 0,
  assembly_line TEXT DEFAULT 'Line A',
  supervisor_name TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'IN_PRODUCTION',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_manufacturing_raw_materials (
  id TEXT PRIMARY KEY,
  material_code TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  unit TEXT DEFAULT 'Kg',
  stock_qty REAL DEFAULT 0,
  reorder_level REAL DEFAULT 50,
  unit_cost REAL DEFAULT 0,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_manufacturing_wo_sync ON local_manufacturing_work_orders(is_synced);
CREATE INDEX IF NOT EXISTS idx_manufacturing_rm_sync ON local_manufacturing_raw_materials(is_synced);
