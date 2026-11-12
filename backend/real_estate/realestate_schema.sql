-- ===========================================================================
-- REAL ESTATE & PROPERTY AGENCY DOMAIN SCHEMA
-- ===========================================================================

-- Property Listings & Units
CREATE TABLE IF NOT EXISTS local_realestate_properties (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT NOT NULL,
  area_sqft REAL DEFAULT 0,
  monthly_rent REAL DEFAULT 0,
  sale_price REAL DEFAULT 0,
  status TEXT DEFAULT 'AVAILABLE'
);

-- Tenant Lease Agreements
CREATE TABLE IF NOT EXISTS local_realestate_agreements (
  id TEXT PRIMARY KEY,
  agreement_no TEXT UNIQUE NOT NULL,
  property_id TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  monthly_rent REAL NOT NULL,
  deposit REAL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'ACTIVE'
);
