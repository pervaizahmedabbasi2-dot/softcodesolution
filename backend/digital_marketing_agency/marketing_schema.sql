-- Digital Marketing & Creative Agency Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_marketing_campaigns (
  id TEXT PRIMARY KEY,
  campaign_code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  channel TEXT NOT NULL,
  campaign_title TEXT NOT NULL,
  monthly_budget REAL NOT NULL DEFAULT 0,
  ad_spend REAL DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roas REAL DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_marketing_retainers (
  id TEXT PRIMARY KEY,
  retainer_no TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  deliverables TEXT NOT NULL,
  monthly_fee REAL NOT NULL DEFAULT 0,
  renewal_date TEXT,
  status TEXT DEFAULT 'PAID',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_sync ON local_marketing_campaigns(is_synced);
CREATE INDEX IF NOT EXISTS idx_marketing_retainers_sync ON local_marketing_retainers(is_synced);
