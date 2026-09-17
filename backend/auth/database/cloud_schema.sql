CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    tenant_id VARCHAR(255) UNIQUE NOT NULL, -- UNIQUE kiya taake duplicates na banen
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    business_reg_no VARCHAR(100),
    business_type VARCHAR(100) NOT NULL,
    business_size VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(50),
    address TEXT NOT NULL,
    custom_domain VARCHAR(255),
    hear_about_us VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    
    -- SECURITY & BIOMETRICS
    enable_passkey BOOLEAN DEFAULT FALSE,
    biometric_hash TEXT,
    
    -- METADATA, SYNC & CRDT
    terms_accepted BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1, -- ADDED: SQLite ke sath CRDT sync ke liye zaroori hai
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise Scaling Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cloud_tenant_id ON tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cloud_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_cloud_idempotency ON tenants(idempotency_key);

-- ZERO-TRUST SECURITY: Enable RLS (Master Prompt Rule)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS isolate_tenant_data ON tenants;

CREATE POLICY isolate_tenant_data ON tenants 
    USING (tenant_id = current_setting('app.current_tenant_id', true));