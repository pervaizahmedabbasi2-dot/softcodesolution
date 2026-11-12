-- ===========================================================================
-- SOFTCODE SOLUTION MASTER PLATFORM & SECURITY SCHEMA
-- ===========================================================================

-- Master Registered Clients / Tenants Registry
CREATE TABLE IF NOT EXISTS local_tenants (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  tenant_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  business_reg_no TEXT,
  business_type TEXT NOT NULL,
  business_size TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  address TEXT NOT NULL,
  custom_domain TEXT,
  hear_about_us TEXT,
  password_hash TEXT NOT NULL,
  enable_passkey INTEGER DEFAULT 0,
  biometric_hash TEXT,
  terms_accepted INTEGER DEFAULT 1,
  is_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  sync_error_log TEXT,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_local_pending_sync ON local_tenants(is_synced) WHERE is_synced = 0;
CREATE INDEX IF NOT EXISTS idx_local_tenant_id ON local_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_local_email ON local_tenants(email);

-- Intruder Security Vault & 5-Attempt Lockout Evidence Logs
CREATE TABLE IF NOT EXISTS local_intruder_logs (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  city TEXT,
  country TEXT,
  attempts_count INTEGER DEFAULT 1,
  tenant_id TEXT,
  company_name TEXT,
  owner_name TEXT,
  business_type TEXT,
  owner_phone TEXT,
  camera_snapshot_base64 TEXT,
  status TEXT DEFAULT 'LOCKED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Master Auth Users Table
CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'client_admin',
  status TEXT DEFAULT 'active',
  failed_login_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
