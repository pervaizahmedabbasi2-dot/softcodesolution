import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import argon2 from 'argon2';

const CIPHER_PREFIX = 'enc:v1:';
const VAULT_KEY_FILE = path.resolve('./backend/auth_security/.vault_master.key');

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
      safeAddCol('local_school_students', "tenant_id TEXT DEFAULT 'tenant-root-platform'");
      safeAddCol('local_school_teachers', "tenant_id TEXT DEFAULT 'tenant-root-platform'");

      try {
        this.sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_local_tenants_blind_email ON local_tenants(email_blind_idx);');
        this.sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_auth_users_blind_email ON auth_users(email_blind_idx);');
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

  getVaultSummary() {
    let totalKeys = 0;
    let envelopeCount = 0;
    let vipCount = 0;
    let shreddedCount = 0;
    if (this.sqliteDb) {
      try {
        const rows = this.sqliteDb.prepare('SELECT encryption_mode, COUNT(*) as cnt FROM tenant_crypto_keys GROUP BY encryption_mode').all();
        for (const r of rows) {
          totalKeys += Number(r.cnt || 0);
          if (r.encryption_mode === 'SERVER_MANAGED_ENVELOPE') envelopeCount += Number(r.cnt || 0);
          if (r.encryption_mode === 'VIP_ZERO_KNOWLEDGE') vipCount += Number(r.cnt || 0);
          if (r.encryption_mode === 'SHREDDED') shreddedCount += Number(r.cnt || 0);
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
      metrics: {
        totalTenantKeys: totalKeys,
        serverManagedEnvelope: envelopeCount,
        vipZeroKnowledge: vipCount,
        cryptoShredded: shreddedCount,
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
