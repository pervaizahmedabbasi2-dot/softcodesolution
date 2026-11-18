-- ===========================================================================
-- SOFTCODE SOLUTION MASTER PLATFORM, COMPANY OPERATIONS & SECURITY SCHEMA
-- ===========================================================================

-- 1. Master Registered Clients / Tenants Registry
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
  email_blind_idx TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_local_pending_sync ON local_tenants(is_synced) WHERE is_synced = 0;
CREATE INDEX IF NOT EXISTS idx_local_tenant_id ON local_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_local_email ON local_tenants(email);

-- 2. Intruder Security Vault & 5-Attempt Lockout Evidence Logs
CREATE TABLE IF NOT EXISTS local_intruder_logs (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_blind_idx TEXT,
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

-- 3. Master Auth Users Table
CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_blind_idx TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'client_admin',
  status TEXT DEFAULT 'active',
  failed_login_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3B. Per-Tenant Envelope & VIP Zero-Knowledge Encryption Key Registry
CREATE TABLE IF NOT EXISTS tenant_crypto_keys (
  tenant_id TEXT PRIMARY KEY,
  wrapped_dek TEXT,
  wrapped_dek_vip TEXT,
  vip_salt TEXT,
  argon2_params TEXT,
  encryption_mode TEXT DEFAULT 'SERVER_MANAGED_ENVELOPE',
  key_version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3C. Universal Multi-Tenant Encrypted Records Store (SuperAdmin + All 33 Businesses)
CREATE TABLE IF NOT EXISTS encrypted_domain_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-root-platform',
  domain_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  encrypted_payload TEXT NOT NULL,
  payload_hmac TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Platform RBAC Roles Registry
CREATE TABLE IF NOT EXISTS platform_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  users_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Enterprise License Keys Vault
CREATE TABLE IF NOT EXISTS platform_licenses (
  id TEXT PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  tier TEXT DEFAULT 'ENTERPRISE_UNLIMITED',
  max_devices INTEGER DEFAULT 25,
  active_devices INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  issue_date TEXT,
  expiry_date TEXT,
  hardware_fingerprint TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. SoftCodeSolution Internal Team Members
CREATE TABLE IF NOT EXISTS platform_team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  department TEXT DEFAULT 'General',
  status TEXT DEFAULT 'ACTIVE',
  mfa INTEGER DEFAULT 0,
  last_active TEXT,
  permissions_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Microservices Catalog & Orchestration Registry
CREATE TABLE IF NOT EXISTS platform_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT DEFAULT 'HEALTHY',
  latency_ms INTEGER DEFAULT 20,
  uptime TEXT DEFAULT '99.99%',
  version TEXT DEFAULT 'v1.0.0',
  rate_limit TEXT,
  description TEXT
);

-- 8. Company Billing Invoices
CREATE TABLE IF NOT EXISTS platform_invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'PENDING',
  plan_name TEXT,
  issued_date TEXT,
  due_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Payment Gateways & Checkout Transactions
CREATE TABLE IF NOT EXISTS platform_payment_gateways (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gateway_type TEXT NOT NULL,
  currency TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  test_mode INTEGER DEFAULT 1,
  config_json TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_transactions (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  software_title TEXT NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  amount TEXT NOT NULL,
  gateway_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'PAID',
  slip_reference TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Multi-Channel Notification Dispatch Logs (WhatsApp / SMS / Email)
CREATE TABLE IF NOT EXISTS platform_notification_logs (
  id TEXT PRIMARY KEY,
  batch_id TEXT,
  channel TEXT NOT NULL,
  target TEXT NOT NULL,
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'DELIVERED',
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tenant Module Entitlements & SaaS Subscriptions
CREATE TABLE IF NOT EXISTS platform_tenant_modules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  custom_price_monthly REAL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_subscriptions (
  tenant_id TEXT PRIMARY KEY,
  plan_id TEXT DEFAULT 'enterprise',
  status TEXT DEFAULT 'active',
  billing_cycle TEXT DEFAULT 'yearly',
  amount REAL DEFAULT 2990,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Enterprise Support Tickets, Client Complaints & Live Chat Threads
CREATE TABLE IF NOT EXISTS platform_support_tickets (
  id TEXT PRIMARY KEY,
  ticket_no TEXT UNIQUE NOT NULL,
  tenant_id TEXT DEFAULT 'public-visitor',
  company_name TEXT,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  subject_category TEXT NOT NULL,
  subject_title TEXT NOT NULL,
  source_channel TEXT DEFAULT 'WEB_FORM',
  priority TEXT DEFAULT 'NORMAL',
  status TEXT DEFAULT 'OPEN',
  assigned_team_id TEXT,
  assigned_team_name TEXT,
  assigned_team_role TEXT,
  last_replied_by_type TEXT DEFAULT 'CUSTOMER',
  last_replied_by_name TEXT,
  last_reply_at TEXT,
  unread_by_admin INTEGER DEFAULT 1,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON platform_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON platform_support_tickets(requester_email);

CREATE TABLE IF NOT EXISTS platform_support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_role TEXT,
  team_member_id TEXT,
  message_body TEXT NOT NULL,
  delivery_channel TEXT DEFAULT 'EMAIL_AND_PORTAL',
  email_delivery_status TEXT DEFAULT 'NONE',
  email_message_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON platform_support_messages(ticket_id);

-- 13. Support Auto-Bot Rules & SLA Configuration
CREATE TABLE IF NOT EXISTS platform_support_bot_config (
  id TEXT PRIMARY KEY,
  bot_enabled INTEGER DEFAULT 1,
  auto_ack_email INTEGER DEFAULT 1,
  auto_reply_chat INTEGER DEFAULT 1,
  bot_name TEXT DEFAULT 'SoftCode Care Bot',
  bot_signature TEXT,
  sla_minutes INTEGER DEFAULT 30,
  rules_json TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Promotional & Direct Email Dispatch Campaigns
CREATE TABLE IF NOT EXISTS platform_email_campaigns (
  id TEXT PRIMARY KEY,
  campaign_type TEXT NOT NULL,
  audience_segment TEXT NOT NULL,
  template_key TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  recipients_count INTEGER DEFAULT 1,
  recipients_json TEXT,
  delivery_mode TEXT DEFAULT 'OUTBOX_SIMULATED',
  status TEXT DEFAULT 'SENT',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Persistent SMTP Mailer Settings (Password encrypted via CryptoVault)
CREATE TABLE IF NOT EXISTS platform_smtp_settings (
  id TEXT PRIMARY KEY,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT,
  smtp_pass_enc TEXT,
  smtp_secure INTEGER DEFAULT 0,
  from_email TEXT,
  from_name TEXT,
  support_email TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
