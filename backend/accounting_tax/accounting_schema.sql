-- Accounting, Bookkeeping & Tax Practice Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_accounting_vouchers (
  id TEXT PRIMARY KEY,
  voucher_no TEXT UNIQUE NOT NULL,
  voucher_type TEXT DEFAULT 'JOURNAL',
  account_name TEXT NOT NULL,
  debit_amount REAL DEFAULT 0,
  credit_amount REAL DEFAULT 0,
  narration TEXT,
  fiscal_period TEXT,
  entry_date TEXT NOT NULL,
  status TEXT DEFAULT 'POSTED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_accounting_tax_filings (
  id TEXT PRIMARY KEY,
  filing_ref TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  tax_authority TEXT NOT NULL,
  tax_period TEXT NOT NULL,
  taxable_income REAL DEFAULT 0,
  tax_payable REAL DEFAULT 0,
  due_date TEXT,
  status TEXT DEFAULT 'PENDING',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounting_vouchers_sync ON local_accounting_vouchers(is_synced);
CREATE INDEX IF NOT EXISTS idx_accounting_tax_sync ON local_accounting_tax_filings(is_synced);
