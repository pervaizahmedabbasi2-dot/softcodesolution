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
    
    -- SECURITY
    enable_passkey INTEGER DEFAULT 0,
    biometric_hash TEXT,
    terms_accepted INTEGER DEFAULT 1,
    
    -- SYNC ENGINE FIELDS (CRDT Ready)
    is_synced INTEGER DEFAULT 0,
    sync_error_log TEXT,
    version INTEGER DEFAULT 1,
    
    -- TIMESTAMPS
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_local_pending_sync ON local_tenants(is_synced) WHERE is_synced = 0;
CREATE INDEX IF NOT EXISTS idx_local_tenant_id ON local_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_local_email ON local_tenants(email);