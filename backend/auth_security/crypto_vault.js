import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import argon2 from 'argon2';
import { doc, setDoc } from 'firebase/firestore';

const CIPHER_PREFIX = 'enc:v1:';
const VAULT_KEY_FILE = path.resolve('./backend/auth_security/.vault_master.key');

export const PROTECTED_DOMAIN_CATALOG = [
  'superadmin_core',
  'softcodesolution_platform',
  'accounting_tax',
  'auto_workshop',
  'bakery_confectionery',
  'beauty_salon',
  'car_rental',
  'catering_services',
  'cleaning_janitorial',
  'coaching_academy',
  'construction_contractor',
  'dental_clinic',
  'diagnostic_lab',
  'digital_marketing_agency',
  'ecommerce_fulfillment',
  'event_management',
  'gym_fitness',
  'hospital_clinic',
  'hotel_hospitality',
  'law_firm',
  'logistics_courier',
  'manufacturing_plant',
  'ngo_charity',
  'pharmacy_store',
  'photography_studio',
  'real_estate',
  'restaurant_cafe',
  'retail_pos',
  'school_business',
  'solar_energy',
  'supermarket_grocery',
  'travel_agency',
  'veterinary_clinic',
  'vocational_training',
  'wholesale_distribution'
];

const SENSITIVE_FIELD_SET = new Set([
  'name', 'fullName', 'full_name', 'email', 'customerEmail', 'customer_email',
  'phone', 'customerPhone', 'customer_phone', 'owner_phone', 'owner_name',
  'address', 'guardianName', 'guardian_name', 'studentName', 'student_name',
  'patient', 'patientName', 'patient_name', 'doctor', 'doctor_name',
  'customerName', 'customer_name', 'cashier', 'guestName', 'currentGuest',
  'client', 'clientName', 'recipient', 'recipientName', 'recipient_name',
  'advocate', 'judge', 'title', 'nar', 'diagnosis', 'chronic', 'notes',
  'details', 'passport', 'cnic', 'iban', 'slipReference', 'slip_reference',
  'camera_snapshot_base64', 'attendant', 'driver', 'beneficiary', 'donor',
  'vendor', 'contractor', 'owner', 'tenantName', 'contactDesk', 'memberName'
]);

const SKIP_OBJECT_KEYS = new Set(['security', 'syncStatus', 'vaultProtection', 'totals', 'algorithms', 'metrics']);

export class SoftCodeCryptoVault {
  constructor(sqliteDb) {
    this.sqliteDb = sqliteDb;
    this.dekCache = new Map(); // tenantId -> { dek: Buffer, mode: string, expiresAt: number }
    const { masterKek, blindKey } = this._loadOrCreateMasterKeys();
    this.masterKek = masterKek;
    this.blindKey = blindKey;
    this._ensureSchema();
  }

  _loadOrCreateMasterKeys() {
    let rawMaster = process.env.SCS_VAULT_MASTER_KEY;
    let rawBlind = process.env.SCS_BLIND_INDEX_KEY;

    if (!rawMaster || !rawBlind) {
      try {
        const dir = path.dirname(VAULT_KEY_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (fs.existsSync(VAULT_KEY_FILE)) {
          const parsed = JSON.parse(fs.readFileSync(VAULT_KEY_FILE, 'utf8'));
          rawMaster = rawMaster || parsed.masterKey;
          rawBlind = rawBlind || parsed.blindKey;
        } else {
          rawMaster = rawMaster || crypto.randomBytes(32).toString('hex');
          rawBlind = rawBlind || crypto.randomBytes(32).toString('hex');
          fs.writeFileSync(
            VAULT_KEY_FILE,
            JSON.stringify({ masterKey: rawMaster, blindKey: rawBlind, createdAt: new Date().toISOString() }, null, 2),
            { mode: 0o600 }
          );
        }
      } catch (err) {
        console.warn('[CryptoVault] Using ephemeral master key fallback:', err.message);
        rawMaster = rawMaster || crypto.randomBytes(32).toString('hex');
        rawBlind = rawBlind || crypto.randomBytes(32).toString('hex');
      }
    }

    const masterKek = Buffer.from(
      crypto.hkdfSync('sha256', Buffer.from(rawMaster, 'utf8'), Buffer.from('softcode-envelope-kek-v1'), Buffer.from('aes-256-gcm'), 32)
    );
    const blindKey = Buffer.from(
      crypto.hkdfSync('sha256', Buffer.from(rawBlind, 'utf8'), Buffer.from('softcode-blind-index-v1'), Buffer.from('hmac-sha256'), 32)
    );
    return { masterKek, blindKey };
  }

  _ensureSchema() {
    if (!this.sqliteDb) return;
    try {
      this.sqliteDb.exec(`
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
      `);

      const safeAddCol = (table, colDef) => {
        try {
          this.sqliteDb.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`);
        } catch {
          // Column already exists
        }
      };

      safeAddCol('local_tenants', 'email_blind_idx TEXT');
      safeAddCol('auth_users', 'email_blind_idx TEXT');
      safeAddCol('local_intruder_logs', 'email_blind_idx TEXT');
      safeAddCol('local_school_students', "tenant_id TEXT DEFAULT 'tenant-root-platform'");
      safeAddCol('local_school_teachers', "tenant_id TEXT DEFAULT 'tenant-root-platform'");
      safeAddCol('local_pos_orders', "tenant_id TEXT DEFAULT 'tenant-root-platform'");
      safeAddCol('local_pharmacy_sales', "tenant_id TEXT DEFAULT 'tenant-root-platform'");

      try {
        this.sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_local_tenants_blind_email ON local_tenants(email_blind_idx);');
        this.sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_auth_users_blind_email ON auth_users(email_blind_idx);');
        this.sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_intruder_blind_email ON local_intruder_logs(email_blind_idx);');
        this.sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_enc_domain_lookup ON encrypted_domain_records(tenant_id, domain_key, entity_type);');
      } catch {}
    } catch (err) {
      console.warn('[CryptoVault] Schema initialization notice:', err.message);
    }
  }

  _wrapWithKey(kekBuffer, dekBuffer, aad = 'softcode-dek') {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', kekBuffer, iv);
    cipher.setAAD(Buffer.from(String(aad), 'utf8'));
    const encrypted = Buffer.concat([cipher.update(dekBuffer), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${CIPHER_PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
  }

  _unwrapWithKey(kekBuffer, wrappedStr, aad = 'softcode-dek') {
    if (!wrappedStr || !String(wrappedStr).startsWith(CIPHER_PREFIX)) return null;
    const raw = String(wrappedStr).slice(CIPHER_PREFIX.length);
    const [ivB64, tagB64, encB64] = raw.split(':');
    if (!ivB64 || !tagB64 || !encB64) return null;
    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const enc = Buffer.from(encB64, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', kekBuffer, iv);
    decipher.setAAD(Buffer.from(String(aad), 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]);
  }

  blindIndex(value, purpose = 'email') {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';
    return crypto
      .createHmac('sha256', this.blindKey)
      .update(`${purpose}:${normalized}`)
      .digest('hex');
  }

  getTenantMode(tenantId = 'tenant-root-platform') {
    const tid = String(tenantId || 'tenant-root-platform').trim();
    const cached = this.dekCache.get(tid);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.mode || 'SERVER_MANAGED_ENVELOPE';
    }
    if (this.sqliteDb) {
      try {
        const row = this.sqliteDb.prepare('SELECT encryption_mode FROM tenant_crypto_keys WHERE tenant_id = ? LIMIT 1').get(tid);
        if (row?.encryption_mode) return row.encryption_mode;
      } catch {}
    }
    return 'SERVER_MANAGED_ENVELOPE';
  }

  isTenantLocked(tenantId = 'tenant-root-platform') {
    const tid = String(tenantId || 'tenant-root-platform').trim();
    const cached = this.dekCache.get(tid);
    if (cached && cached.expiresAt > Date.now()) {
      return false;
    }
    if (this.sqliteDb) {
      try {
        const row = this.sqliteDb.prepare('SELECT encryption_mode FROM tenant_crypto_keys WHERE tenant_id = ? LIMIT 1').get(tid);
        if (row && (row.encryption_mode === 'VIP_ZERO_KNOWLEDGE' || row.encryption_mode === 'SHREDDED')) {
          return true;
        }
      } catch {}
    }
    return false;
  }

  ensureTenantKey(tenantId = 'tenant-root-platform') {
    const tid = String(tenantId || 'tenant-root-platform').trim();
    const cached = this.dekCache.get(tid);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.dek;
    }

    if (this.sqliteDb) {
      try {
        const row = this.sqliteDb.prepare('SELECT * FROM tenant_crypto_keys WHERE tenant_id = ? LIMIT 1').get(tid);
        if (row) {
          if (row.encryption_mode === 'SHREDDED') return null;
          if (row.encryption_mode === 'VIP_ZERO_KNOWLEDGE') {
            return null; // Requires explicit VIP passphrase unlock via unlockVipTenantKey
          }
          if (row.wrapped_dek) {
            const dek = this._unwrapWithKey(this.masterKek, row.wrapped_dek, tid);
            if (dek) {
              this.dekCache.set(tid, { dek, mode: row.encryption_mode, expiresAt: Date.now() + 15 * 60 * 1000 });
              return dek;
            }
          }
        }
      } catch (err) {
        console.warn('[CryptoVault] Key lookup warning:', err.message);
      }
    }

    // Provision fresh 256-bit DEK for this tenant
    const freshDek = crypto.randomBytes(32);
    const wrappedDek = this._wrapWithKey(this.masterKek, freshDek, tid);

    if (this.sqliteDb) {
      try {
        this.sqliteDb.prepare(`
          INSERT OR IGNORE INTO tenant_crypto_keys (tenant_id, wrapped_dek, encryption_mode, key_version)
          VALUES (?, ?, 'SERVER_MANAGED_ENVELOPE', 1)
        `).run(tid, wrappedDek);
      } catch (err) {
        console.warn('[CryptoVault] Key insert warning:', err.message);
      }
    }

    this.dekCache.set(tid, { dek: freshDek, mode: 'SERVER_MANAGED_ENVELOPE', expiresAt: Date.now() + 15 * 60 * 1000 });
    return freshDek;
  }

  async enableVipZeroKnowledge(tenantId, vipPassphrase) {
    const tid = String(tenantId || '').trim();
    if (!tid || !vipPassphrase || vipPassphrase.length < 8) {
      throw new Error('VIP passphrase must be at least 8 characters.');
    }

    const dek = this.ensureTenantKey(tid) || crypto.randomBytes(32);
    const salt = crypto.randomBytes(16);
    const vipKek = await argon2.hash(vipPassphrase, {
      type: argon2.argon2id,
      raw: true,
      salt,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 2,
      hashLength: 32
    });

    const wrappedVip = this._wrapWithKey(vipKek, dek, `vip:${tid}`);
    const paramsMeta = JSON.stringify({ algorithm: 'argon2id', memoryCost: 65536, timeCost: 3, parallelism: 2 });

    if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO tenant_crypto_keys (tenant_id, wrapped_dek, wrapped_dek_vip, vip_salt, argon2_params, encryption_mode, key_version, updated_at)
        VALUES (?, NULL, ?, ?, ?, 'VIP_ZERO_KNOWLEDGE', 2, CURRENT_TIMESTAMP)
        ON CONFLICT(tenant_id) DO UPDATE SET
          wrapped_dek = NULL,
          wrapped_dek_vip = excluded.wrapped_dek_vip,
          vip_salt = excluded.vip_salt,
          argon2_params = excluded.argon2_params,
          encryption_mode = 'VIP_ZERO_KNOWLEDGE',
          key_version = key_version + 1,
          updated_at = CURRENT_TIMESTAMP
      `).run(tid, wrappedVip, salt.toString('base64url'), paramsMeta);
    }

    // Unlock in short-lived session cache (15 min TTL)
    this.dekCache.set(tid, { dek, mode: 'VIP_ZERO_KNOWLEDGE', expiresAt: Date.now() + 15 * 60 * 1000 });
    return { ok: true, tenantId: tid, mode: 'VIP_ZERO_KNOWLEDGE', kdf: 'Argon2id (64MB) -> AES-256-GCM' };
  }

  async unlockVipTenantKey(tenantId, vipPassphrase) {
    const tid = String(tenantId || '').trim();
    if (!this.sqliteDb || !tid || !vipPassphrase) return false;

    const row = this.sqliteDb.prepare('SELECT * FROM tenant_crypto_keys WHERE tenant_id = ? LIMIT 1').get(tid);
    if (!row || !row.wrapped_dek_vip || !row.vip_salt) return false;

    const salt = Buffer.from(row.vip_salt, 'base64url');
    const vipKek = await argon2.hash(vipPassphrase, {
      type: argon2.argon2id,
      raw: true,
      salt,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 2,
      hashLength: 32
    });

    try {
      const dek = this._unwrapWithKey(vipKek, row.wrapped_dek_vip, `vip:${tid}`);
      if (!dek) return false;
      this.dekCache.set(tid, { dek, mode: 'VIP_ZERO_KNOWLEDGE', expiresAt: Date.now() + 15 * 60 * 1000 });
      return true;
    } catch {
      return false;
    }
  }

  lockVipSession(tenantId) {
    this.dekCache.delete(String(tenantId || '').trim());
  }

  cryptoShredTenant(tenantId) {
    const tid = String(tenantId || '').trim();
    this.dekCache.delete(tid);
    if (this.sqliteDb && tid) {
      this.sqliteDb.prepare(`
        UPDATE tenant_crypto_keys
        SET wrapped_dek = NULL, wrapped_dek_vip = NULL, vip_salt = NULL, encryption_mode = 'SHREDDED', updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = ?
      `).run(tid);
    }
  }

  encryptField(tenantId, plaintext) {
    if (plaintext === null || plaintext === undefined || plaintext === '') return plaintext;
    const str = String(plaintext);
    if (str.startsWith(CIPHER_PREFIX)) return str; // Already encrypted

    const tid = String(tenantId || 'tenant-root-platform').trim();
    const dek = this.ensureTenantKey(tid);
    if (!dek) return str;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    cipher.setAAD(Buffer.from(tid, 'utf8'));
    const encrypted = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${CIPHER_PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
  }

  decryptField(tenantId, storedValue) {
    if (storedValue === null || storedValue === undefined) return storedValue;
    const str = String(storedValue);
    if (!str.startsWith(CIPHER_PREFIX)) return storedValue; // Backward-compatible plaintext

    const tid = String(tenantId || 'tenant-root-platform').trim();
    const dek = this.ensureTenantKey(tid);
    if (!dek) return '[LOCKED_VIP_VAULT]';

    try {
      const raw = str.slice(CIPHER_PREFIX.length);
      const [ivB64, tagB64, encB64] = raw.split(':');
      if (!ivB64 || !tagB64 || !encB64) return storedValue;
      const iv = Buffer.from(ivB64, 'base64url');
      const tag = Buffer.from(tagB64, 'base64url');
      const enc = Buffer.from(encB64, 'base64url');
      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
      decipher.setAAD(Buffer.from(tid, 'utf8'));
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    } catch {
      return '[ENCRYPTED_PROTECTED]';
    }
  }

  encryptFields(tenantId, record, fieldNames) {
    if (!record || typeof record !== 'object') return record;
    const copy = { ...record };
    for (const field of fieldNames) {
      if (copy[field] !== undefined && copy[field] !== null && copy[field] !== '') {
        copy[field] = this.encryptField(tenantId, copy[field]);
      }
    }
    return copy;
  }

  decryptFields(tenantId, record, fieldNames) {
    if (!record || typeof record !== 'object') return record;
    const copy = { ...record };
    for (const field of fieldNames) {
      if (typeof copy[field] === 'string' && copy[field].startsWith(CIPHER_PREFIX)) {
        copy[field] = this.decryptField(tenantId, copy[field]);
      }
    }
    return copy;
  }

  maskSensitiveObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.maskSensitiveObject(item));
    const masked = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_FIELD_SET.has(k) && v !== undefined && v !== null && v !== '') {
        masked[k] = '[LOCKED_VIP_VAULT]';
      } else if (v && typeof v === 'object') {
        masked[k] = this.maskSensitiveObject(v);
      } else {
        masked[k] = v;
      }
    }
    return masked;
  }

  saveEncryptedDomainRecord(domainKey, entityType, tenantId, record, db = null) {
    if (!this.sqliteDb || !record || typeof record !== 'object') return null;
    const tid = String(tenantId || 'tenant-root-platform').trim();
    const recId = String(record.id || `${domainKey}-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`);
    const compositeId = `${tid}::${domainKey}::${entityType}::${recId}`;
    const serialized = JSON.stringify(record);
    const encryptedPayload = this.encryptField(tid, serialized);
    if (!String(encryptedPayload).startsWith(CIPHER_PREFIX)) return null;

    const payloadHmac = this.blindIndex(`${tid}:${domainKey}:${recId}`, 'record');
    const nowIso = new Date().toISOString();

    try {
      this.sqliteDb.prepare(`
        INSERT INTO encrypted_domain_records (id, tenant_id, domain_key, entity_type, encrypted_payload, payload_hmac, is_synced, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          encrypted_payload = excluded.encrypted_payload,
          payload_hmac = excluded.payload_hmac,
          is_synced = 0,
          updated_at = excluded.updated_at
      `).run(compositeId, tid, domainKey, entityType, encryptedPayload, payloadHmac, nowIso, nowIso);

      if (db) {
        setDoc(doc(db, 'encrypted_domain_records', compositeId.replace(/[:/]/g, '_')), {
          id: compositeId,
          tenant_id: tid,
          domain_key: domainKey,
          entity_type: entityType,
          encrypted_payload: encryptedPayload,
          payload_hmac: payloadHmac,
          is_synced: 1,
          synced_at: nowIso
        }).then(() => {
          try {
            this.sqliteDb.prepare('UPDATE encrypted_domain_records SET is_synced = 1 WHERE id = ?').run(compositeId);
          } catch {}
        }).catch(() => {});
      }
      return compositeId;
    } catch (err) {
      console.warn(`[CryptoVault:${domainKey}] Save warning:`, err.message);
      return null;
    }
  }

  loadDecryptedDomainRecords(domainKey, entityType, tenantId) {
    if (!this.sqliteDb) return [];
    const tid = String(tenantId || 'tenant-root-platform').trim();
    try {
      const rows = this.sqliteDb.prepare(`
        SELECT * FROM encrypted_domain_records
        WHERE tenant_id = ? AND domain_key = ? AND entity_type = ?
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 200
      `).all(tid, domainKey, entityType);

      const locked = this.isTenantLocked(tid);
      return rows.map((row) => {
        if (locked) {
          return {
            id: row.id.split('::').pop(),
            tenant_id: tid,
            status: 'LOCKED_VIP_VAULT',
            title: '[LOCKED_VIP_VAULT]',
            name: '[LOCKED_VIP_VAULT]',
            fullName: '[LOCKED_VIP_VAULT]',
            vault_encrypted: true
          };
        }
        const dec = this.decryptField(tid, row.encrypted_payload);
        if (dec === '[LOCKED_VIP_VAULT]' || dec === '[ENCRYPTED_PROTECTED]') {
          return { id: row.id.split('::').pop(), status: dec, vault_encrypted: true };
        }
        try {
          return JSON.parse(dec);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch {
      return [];
    }
  }

  createDomainVaultMiddleware(domainKey, db = null) {
    const vault = this;
    return (req, res, next) => {
      const tid = String(req?.headers?.['x-tenant-id'] || req?.query?.tenantId || req?.body?.tenantId || 'tenant-root-platform').trim();
      if (!vault.isTenantLocked(tid)) {
        vault.ensureTenantKey(tid);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        try {
          if (body && typeof body === 'object' && body.ok === true) {
            const method = String(req.method || 'GET').toUpperCase();
            const locked = vault.isTenantLocked(tid);

            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
              for (const [k, v] of Object.entries(body)) {
                if (SKIP_OBJECT_KEYS.has(k)) continue;
                if (v && typeof v === 'object' && !Array.isArray(v) && v.id) {
                  const entityGuess = k === 'legalCase' ? 'cases' : (k.endsWith('s') ? k : k + 's');
                  vault.saveEncryptedDomainRecord(domainKey, entityGuess, tid, v, db);
                } else if (Array.isArray(v)) {
                  for (const item of v) {
                    if (item && typeof item === 'object' && item.id) {
                      vault.saveEncryptedDomainRecord(domainKey, k, tid, item, db);
                    }
                  }
                }
              }
            } else if (method === 'GET') {
              for (const [k, v] of Object.entries(body)) {
                if (!Array.isArray(v) || SKIP_OBJECT_KEYS.has(k)) continue;
                const persisted = vault.loadDecryptedDomainRecords(domainKey, k, tid);
                const merged = [...v];
                const seen = new Set(merged.map((item) => item?.id).filter(Boolean));
                for (const pRec of persisted) {
                  if (pRec?.id && !seen.has(pRec.id)) {
                    merged.unshift(pRec);
                    seen.add(pRec.id);
                  }
                }
                body[k] = locked ? merged.map((item) => vault.maskSensitiveObject(item)) : merged;
              }
            }

            if (!body.vaultProtection) {
              body.vaultProtection = {
                domain: domainKey,
                tenantId: tid,
                algorithm: 'AES-256-GCM',
                mode: vault.getTenantMode(tid),
                blindIndex: 'HMAC-SHA256',
                passwordKdf: 'Argon2id'
              };
            }
          }
        } catch (err) {
          console.warn(`[CryptoVault:${domainKey}] Middleware notice:`, err.message);
        }
        return originalJson(body);
      };
      next();
    };
  }

  getVaultSummary() {
    let totalKeys = 0;
    let envelopeCount = 0;
    let vipCount = 0;
    let shreddedCount = 0;
    let encryptedDomainRecordsCount = 0;
    const domainCounts = {};

    if (this.sqliteDb) {
      try {
        const rows = this.sqliteDb.prepare('SELECT encryption_mode, COUNT(*) as cnt FROM tenant_crypto_keys GROUP BY encryption_mode').all();
        for (const r of rows) {
          totalKeys += Number(r.cnt || 0);
          if (r.encryption_mode === 'SERVER_MANAGED_ENVELOPE') envelopeCount += Number(r.cnt || 0);
          if (r.encryption_mode === 'VIP_ZERO_KNOWLEDGE') vipCount += Number(r.cnt || 0);
          if (r.encryption_mode === 'SHREDDED') shreddedCount += Number(r.cnt || 0);
        }

        const domRows = this.sqliteDb.prepare('SELECT domain_key, COUNT(*) as cnt FROM encrypted_domain_records GROUP BY domain_key').all();
        for (const d of domRows) {
          const count = Number(d.cnt || 0);
          encryptedDomainRecordsCount += count;
          domainCounts[d.domain_key] = count;
        }
      } catch {}
    }

    return {
      ok: true,
      architecture: 'Hybrid Argon2id + AES-256-GCM Envelope + HMAC Blind Index Vault',
      algorithms: {
        passwordsAndKdf: 'Argon2id v=19 (128MB auth / 64MB VIP KDF)',
        fieldEncryption: 'AES-256-GCM (Authenticated + Per-Tenant AAD)',
        keyDerivation: 'HKDF-SHA256 Master Key Separation',
        searchableLookup: 'HMAC-SHA256 Deterministic Blind Index'
      },
      masterKeyLocation: fs.existsSync(VAULT_KEY_FILE) ? 'Isolated External Keyfile (Outside SQLite DB)' : 'Environment KMS',
      coverage: {
        superAdminCore: true,
        clientsRegistry: true,
        platformModules: true,
        allBusinessDomainsProtected: PROTECTED_DOMAIN_CATALOG.length,
        protectedDomains: PROTECTED_DOMAIN_CATALOG
      },
      metrics: {
        totalTenantKeys: totalKeys,
        serverManagedEnvelope: envelopeCount,
        vipZeroKnowledge: vipCount,
        cryptoShredded: shreddedCount,
        encryptedDomainRecords: encryptedDomainRecordsCount,
        domainRecordBreakdown: domainCounts,
        cachedActiveSessions: this.dekCache.size
      }
    };
  }
}

let sharedVault = null;
export function getCryptoVault(sqliteDb) {
  if (!sharedVault) {
    sharedVault = new SoftCodeCryptoVault(sqliteDb);
  }
  return sharedVault;
}
