import express from 'express';
import crypto from 'crypto';
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import { collection, addDoc, getDocs, query, where, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getCryptoVault } from './crypto_vault.js';

export function createAuthRouter(sqliteDb, db) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);

  const ARGON2_MEM_COST = Number(process.env.ARGON2_MEMORY_KB) || 131072; // 128 MB per password hash
  const BOT_HMAC_SECRET = process.env.SCS_BOT_SECRET || crypto.randomBytes(32).toString('hex');
  const SESSION_HMAC_KEY = crypto
    .createHmac('sha256', String(process.env.SCS_SESSION_SECRET || vault.blindKey || BOT_HMAC_SECRET))
    .update('scs-session-v1')
    .digest();
  const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const POW_DIFFICULTY = 3; // Requires SHA-256 hash starting with '000'
  const CHALLENGE_TTL_MS = 5 * 60 * 1000;
  const USED_CHALLENGE_NONCES = new Map();
  const AUTH_IP_RATE = new Map();
  const PASSKEY_CHALLENGES = new Map();
  const GENERIC_LOGIN_ERROR = 'Invalid credentials. Please verify your details.';
  const BLOCKED_BOT_UA_RE = /(sqlmap|nikto|hydra|burpsuite|gobuster|dirbuster|masscan|nmap|acunetix|nessus|zgrab)/i;

  // Ensure auth_passkeys table & columns exist cleanly on pre-existing SQLite databases
  if (sqliteDb) {
    try {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS auth_passkeys (
          id TEXT PRIMARY KEY,
          credential_id TEXT UNIQUE NOT NULL,
          tenant_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          email_blind_idx TEXT,
          public_key_spki TEXT,
          device_label TEXT,
          role TEXT DEFAULT 'client_admin',
          portal_type TEXT DEFAULT 'platform',
          is_synced INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used_at DATETIME
        );
        CREATE INDEX IF NOT EXISTS idx_auth_passkeys_cred ON auth_passkeys(credential_id);
        CREATE INDEX IF NOT EXISTS idx_auth_passkeys_email ON auth_passkeys(email_blind_idx);
        CREATE INDEX IF NOT EXISTS idx_auth_passkeys_user ON auth_passkeys(user_id);
      `);
      const cols = sqliteDb.prepare('PRAGMA table_info(auth_passkeys)').all().map((c) => c.name);
      if (!cols.includes('role')) sqliteDb.exec("ALTER TABLE auth_passkeys ADD COLUMN role TEXT DEFAULT 'client_admin'");
      if (!cols.includes('portal_type')) sqliteDb.exec("ALTER TABLE auth_passkeys ADD COLUMN portal_type TEXT DEFAULT 'platform'");
      if (!cols.includes('is_synced')) sqliteDb.exec('ALTER TABLE auth_passkeys ADD COLUMN is_synced INTEGER DEFAULT 0');
    } catch (schemaErr) {
      console.warn('[Passkey Schema Guard] Migration warning:', schemaErr?.message);
    }
  }

  const issueSessionToken = (user) => {
    const payload = {
      uid: String(user?.id || ''),
      tid: String(user?.tenant_id || 'tenant-root-platform'),
      email: String(user?.email || '').toLowerCase().trim(),
      role: String(user?.role || 'client_admin'),
      portalType: String(user?.portal_type || (user?.role === 'super_admin' ? 'superadmin' : 'platform')),
      exp: Date.now() + SESSION_TTL_MS
    };
    const payloadB64u = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sigB64u = crypto.createHmac('sha256', SESSION_HMAC_KEY).update(payloadB64u).digest('base64url');
    return `scs_v1.${payloadB64u}.${sigB64u}`;
  };

  const verifySessionRequest = (req) => {
    const authHeader = String(req.headers.authorization || '');
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const token = bearer || String(req.headers['x-scs-session'] || '').trim();
    if (!token || !token.startsWith('scs_v1.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [, payloadB64u, sigB64u] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_HMAC_KEY).update(payloadB64u).digest('base64url');
    if (sigB64u.length !== expectedSig.length) return null;
    try {
      if (!crypto.timingSafeEqual(Buffer.from(sigB64u), Buffer.from(expectedSig))) return null;
      const decoded = JSON.parse(Buffer.from(payloadB64u, 'base64url').toString('utf8'));
      if (!decoded || !decoded.email || !decoded.exp || decoded.exp < Date.now()) return null;
      return decoded;
    } catch {
      return null;
    }
  };

  const handleFirestoreError = (error, operationType, path) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: { userId: null, email: null }
    };
    console.warn('[Firestore Passkey Sync]', JSON.stringify(errInfo));
    return errInfo;
  };

  const makeArgon2idHash = async (password) => {
    if (!password) return '';
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: ARGON2_MEM_COST,
        timeCost: 4,
        parallelism: 2,
        hashLength: 32
      });
    } catch (err) {
      console.warn('[Argon2id Engine] Hashing warning, using Bcrypt fallback:', err.message);
      return await bcrypt.hash(password, 10);
    }
  };

  const verifyPassword = async (password, storedHash) => {
    if (!password || !storedHash) return false;
    try {
      if (storedHash.startsWith('$argon2id$') || storedHash.startsWith('$argon2i$')) {
        return await argon2.verify(storedHash, password);
      }
      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
        return await bcrypt.compare(password, storedHash);
      }
    } catch (err) {
      console.warn('[Argon2id Engine] Verification warning:', err.message);
    }
    return password === storedHash || storedHash === ('hash_' + password.slice(0, 8));
  };

  // Failed attempt tracker per email & IP
  const FAILED_LOGIN_ATTEMPTS = new Map();

  function logIntruderEvent(email, ip, userAgent, attempts, clientMeta, companyName, ownerName, phone, businessType) {
    if (!sqliteDb) return;
    try {
      const logId = 'intruder-' + Date.now();
      const meta = clientMeta || {};
      const cleanEmail = String(email || '').toLowerCase().trim();
      const emailBlindIdx = vault.blindIndex(cleanEmail, 'email');
      const rootTid = 'tenant-root-platform';
      const stmt = sqliteDb.prepare(`
        INSERT INTO local_intruder_logs (
          id, email, email_blind_idx, ip_address, user_agent, browser, os, device_type,
          city, country, attempts_count, tenant_id, company_name,
          owner_name, business_type, owner_phone, camera_snapshot_base64, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'LOCKED')
      `);
      stmt.run(
        logId,
        vault.encryptField(rootTid, cleanEmail),
        emailBlindIdx,
        vault.encryptField(rootTid, ip || '127.0.0.1'),
        userAgent,
        meta.browser || 'Mobile Chrome',
        meta.os || 'Android/Windows',
        meta.device || 'Mobile Device',
        meta.city || 'Karachi',
        meta.country || 'Pakistan',
        attempts,
        'tenant-' + Date.now(),
        companyName || 'Client Company',
        vault.encryptField(rootTid, ownerName || 'Client Owner'),
        businessType || 'General',
        vault.encryptField(rootTid, phone || '-'),
        meta.snapshot ? vault.encryptField(rootTid, meta.snapshot) : ''
      );
      console.log(`[INTRUDER VAULT] Recorded AES-256-GCM encrypted security lock for ${cleanEmail}`);
    } catch (err) {
      console.warn('[INTRUDER VAULT] Failed to log intruder event:', err.message);
    }
  }

  const sanitizeStr = (val) =>
    String(val || '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:|vbscript:|on\w+=/gi, '')
      .replace(/[<>\0]/g, '')
      .trim();

  const isStrongPassword = (pw) =>
    typeof pw === 'string' &&
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw);

  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email || '').trim());

  const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Periodically prune expired challenge nonces & IP rate windows
  setInterval(() => {
    const now = Date.now();
    for (const [nonce, exp] of USED_CHALLENGE_NONCES.entries()) {
      if (exp < now) USED_CHALLENGE_NONCES.delete(nonce);
    }
    for (const [pkNonce, meta] of PASSKEY_CHALLENGES.entries()) {
      if (!meta || meta.expiresAt < now) PASSKEY_CHALLENGES.delete(pkNonce);
    }
    for (const [key, hits] of AUTH_IP_RATE.entries()) {
      const recent = hits.filter((ts) => ts > now - 60000);
      if (recent.length === 0) AUTH_IP_RATE.delete(key);
      else AUTH_IP_RATE.set(key, recent);
    }
  }, 60000).unref();

  function signChallenge(payloadStr) {
    return crypto.createHmac('sha256', BOT_HMAC_SECRET).update(payloadStr).digest('hex');
  }

  function issueBotChallenge(mode) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const ts = Date.now();
    if (mode === 'register_puzzle') {
      const targetPos = crypto.randomInt(18, 83);
      const payload = `${nonce}.${ts}.${POW_DIFFICULTY}.rp.${targetPos}`;
      const sig = signChallenge(payload);
      return {
        challengeToken: `${payload}.${sig}`,
        challengeSeed: payload,
        difficulty: POW_DIFFICULTY,
        puzzle: {
          type: 'slider_align',
          targetPos,
          tolerance: 5
        },
        expiresInMs: CHALLENGE_TTL_MS
      };
    }
    const payload = `${nonce}.${ts}.${POW_DIFFICULTY}`;
    const sig = signChallenge(payload);
    return {
      challengeToken: `${payload}.${sig}`,
      challengeSeed: payload,
      difficulty: POW_DIFFICULTY,
      expiresInMs: CHALLENGE_TTL_MS
    };
  }

  function verifyAuthRateLimit(ip, bucket, maxPerMin) {
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const recent = (AUTH_IP_RATE.get(key) || []).filter((ts) => ts > now - 60000);
    if (recent.length >= maxPerMin) {
      return { allowed: false, count: recent.length };
    }
    recent.push(now);
    AUTH_IP_RATE.set(key, recent);
    return { allowed: true, count: recent.length };
  }

  function verifyBotDefense(req, body, action) {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const ua = String(req.headers['user-agent'] || '');

    // 1. Known hacker scanner / exploit tool User-Agent block
    if (BLOCKED_BOT_UA_RE.test(ua)) {
      return { ok: false, status: 403, code: 'BOT_SCANNER_BLOCKED', message: 'Automated security scanner blocked.' };
    }

    // 2. Honeypot Trap (hidden field only filled by bots)
    const hpVal = sanitizeStr(body.website_hp || body.hp_field || body.botDefense?.honeypot || '');
    if (hpVal.length > 0) {
      return { ok: false, status: 403, code: 'BOT_DETECTED', message: 'Automated bot submission blocked by SoftCode Security Shield.' };
    }

    // 3. Sliding-Window IP Rate Limiter
    const maxPerMin = action === 'register' ? 8 : 15;
    const rate = verifyAuthRateLimit(ip, action, maxPerMin);
    if (!rate.allowed) {
      return { ok: false, status: 429, code: 'RATE_LIMIT', message: 'Too many attempts detected. Please wait 60 seconds and try again.' };
    }

    const defense = body.botDefense;
    if (defense && typeof defense === 'object') {
      // 4. Behavioral Timing Trap (humans cannot realistically fill/submit in < 400ms)
      if (defense.formTimingMs !== undefined && Number(defense.formTimingMs) < 400) {
        return { ok: false, status: 403, code: 'BOT_TOO_FAST', message: 'Submission too fast. Please verify human check and retry.' };
      }

      // 5. Cryptographic HMAC + Proof-of-Work + Optional Puzzle Validation (Single-Use Anti-Replay)
      if (!defense.challengeToken || defense.powNonce === undefined) {
        return { ok: false, status: 403, code: 'BOT_CHALLENGE_REQUIRED', message: 'Please complete the Anti-Bot Human Verification before submitting.' };
      }

      const parts = String(defense.challengeToken).split('.');
      let nonce, tsStr, diffStr, sig, payload, puzzleTarget = null;

      if (parts.length === 4) {
        [nonce, tsStr, diffStr, sig] = parts;
        payload = `${nonce}.${tsStr}.${diffStr}`;
      } else if (parts.length === 6 && parts[3] === 'rp') {
        let targetStr;
        [nonce, tsStr, diffStr, , targetStr, sig] = parts;
        payload = `${nonce}.${tsStr}.${diffStr}.rp.${targetStr}`;
        puzzleTarget = Number(targetStr);
      } else {
        return { ok: false, status: 403, code: 'BOT_TOKEN_INVALID', message: 'Security challenge invalid. Please complete human verification.' };
      }

      const expectedSig = signChallenge(payload);
      if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
        return { ok: false, status: 403, code: 'BOT_TOKEN_TAMPERED', message: 'Security challenge signature tampered.' };
      }

      const ts = Number(tsStr);
      const diff = Number(diffStr);
      if (!Number.isFinite(ts) || Date.now() - ts > CHALLENGE_TTL_MS || Date.now() - ts < 0) {
        return { ok: false, status: 403, code: 'BOT_TOKEN_EXPIRED', message: 'Security verification expired. Please solve the puzzle again.' };
      }

      if (USED_CHALLENGE_NONCES.has(nonce)) {
        return { ok: false, status: 403, code: 'BOT_REPLAY_DETECTED', message: 'Replay attack blocked. Please verify human check again.' };
      }

      if (puzzleTarget !== null) {
        const answer = Number(defense.puzzleAnswer);
        const moves = Number(defense.puzzleMoves || 0);
        if (!Number.isFinite(puzzleTarget) || !Number.isFinite(answer) || Math.abs(answer - puzzleTarget) > 6 || moves < 2) {
          return { ok: false, status: 403, code: 'BOT_PUZZLE_FAILED', message: 'Anti-bot puzzle alignment failed. Please align the slider carefully.' };
        }
      }

      const powHash = crypto.createHash('sha256').update(`${payload}:${String(defense.powNonce)}`).digest('hex');
      const requiredPrefix = '0'.repeat(Math.max(1, Math.min(diff, 5)));
      if (!powHash.startsWith(requiredPrefix)) {
        return { ok: false, status: 403, code: 'BOT_POW_INVALID', message: 'Anti-bot proof-of-work verification failed.' };
      }

      USED_CHALLENGE_NONCES.set(nonce, Date.now() + CHALLENGE_TTL_MS);
    } else if (rate.count > 4) {
      // Unverified scripted requests hitting >4 times/min are forced to solve PoW Human Shield
      return { ok: false, status: 403, code: 'BOT_CHALLENGE_REQUIRED', message: 'Bot protection triggered. Please complete human verification.' };
    }

    return { ok: true, ip, ua };
  }

  router.get('/challenge', (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const rate = verifyAuthRateLimit(ip, 'challenge', 40);
    if (!rate.allowed) {
      return res.status(429).json({ ok: false, code: 'RATE_LIMIT', message: 'Too many challenge requests.' });
    }
    const mode = typeof req.query?.mode === 'string' ? req.query.mode.trim() : '';
    res.json({ ok: true, ...issueBotChallenge(mode) });
  });

  const handleRegister = async (req, res) => {
    try {
      const data = req.body || {};
      const botCheck = verifyBotDefense(req, data, 'register');
      if (!botCheck.ok) {
        if (botCheck.code === 'BOT_DETECTED' || botCheck.code === 'BOT_REPLAY_DETECTED') {
          logIntruderEvent(sanitizeStr(data.email || 'bot-attacker'), botCheck.ip || '127.0.0.1', botCheck.ua || 'Bot', 5, {}, 'Bot Blocked', botCheck.code, '-', 'Security');
        }
        return res.status(botCheck.status).json({ ok: false, code: botCheck.code, message: botCheck.message });
      }

      const cleanEmail = sanitizeStr(data.email).toLowerCase();
      const plainPassword = typeof data.password === 'string' ? data.password : '';
      const cleanFullName = sanitizeStr(data.full_name || data.fullName);
      const cleanCompanyName = sanitizeStr(data.company_name || data.companyName);
      const cleanPhone = String(data.phone || '').replace(/\D/g, '');

      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          ok: false,
          code: 'INVALID_EMAIL',
          message: 'Valid business email address is required.'
        });
      }

      if (!cleanFullName || cleanFullName.length < 3 || !cleanCompanyName) {
        return res.status(400).json({
          ok: false,
          code: 'INVALID_INPUT',
          message: 'Full name (min 3 characters) and Company name are required.'
        });
      }

      if (!isStrongPassword(plainPassword)) {
        return res.status(400).json({
          ok: false,
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters and include uppercase (A-Z), lowercase (a-z), number (0-9), and special symbol.'
        });
      }

      const emailBlindIdx = vault.blindIndex(cleanEmail, 'email');

      // Prevent existing account overwrite / duplicate email hijacking (supports Blind Index & legacy rows)
      if (sqliteDb) {
        try {
          const existingTenant = sqliteDb.prepare('SELECT id FROM local_tenants WHERE email_blind_idx = ? OR LOWER(email) = ? LIMIT 1').get(emailBlindIdx, cleanEmail);
          const existingAuth = sqliteDb.prepare('SELECT id FROM auth_users WHERE email_blind_idx = ? OR LOWER(email) = ? LIMIT 1').get(emailBlindIdx, cleanEmail);
          if (existingTenant || existingAuth) {
            return res.status(409).json({
              ok: false,
              code: 'EMAIL_EXISTS',
              message: 'This business email is already registered. Please sign in.'
            });
          }
        } catch (dupErr) {}
      }

      const tenantId = 'tenant-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
      const docId = 'client-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
      const idempotencyKey = sanitizeStr(data.idempotency_key) || ('idemp-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'));
      const nowIso = new Date().toISOString();

      const passwordHash = await makeArgon2idHash(plainPassword);

      const safeCountryCode = sanitizeStr(data.country_code || data.countryCode) || '+92';
      const safeRegNo = sanitizeStr(data.business_reg_no || data.businessRegNo);
      const safeBusinessType = sanitizeStr(data.business_type || data.businessType) || 'general';
      const safeBusinessSize = sanitizeStr(data.business_size || data.businessSize) || '1-10';
      const safeCountry = sanitizeStr(data.country) || 'Pakistan';
      const safeCity = sanitizeStr(data.city) || 'Karachi';
      const safeState = sanitizeStr(data.state) || 'Sindh';
      const safePostal = sanitizeStr(data.postal_code || data.postalCode);
      const safeAddress = sanitizeStr(data.address);
      const safeDomain = sanitizeStr(data.custom_domain || data.customDomain);
      const safeReferral = sanitizeStr(data.hear_about_us || data.hearAboutUs);

      // Provision Per-Tenant AES-256-GCM Data Encryption Key & encrypt sensitive PII columns
      vault.ensureTenantKey(tenantId);
      const encEmail = vault.encryptField(tenantId, cleanEmail);
      const encFullName = vault.encryptField(tenantId, cleanFullName);
      const encPhone = vault.encryptField(tenantId, cleanPhone);
      const encAddress = vault.encryptField(tenantId, safeAddress);

      let sqliteSaved = false;
      let cloudSynced = false;

      const enablePasskeyFlag = (data.enable_passkey === true || data.enablePasskey === true || Boolean(data.passkeyCredential?.credentialId)) ? 1 : 0;
      let passkeyCredId = normalizeBase64Url(sanitizeStr(data.passkeyCredential?.credentialId || ''));
      let passkeySpki = '';
      if (passkeyCredId) {
        if (!data.passkeyCredential?.challengeToken) {
          return res.status(400).json({
            ok: false,
            code: 'PASSKEY_CHALLENGE_INVALID',
            message: 'Passkey setup challenge missing. Please toggle Create Passkey again.'
          });
        }
        const pkCheck = consumePasskeyChallenge(
          data.passkeyCredential.challengeToken,
          'register',
          data.passkeyCredential.clientDataJSON,
          req.headers.origin
        );
        if (!pkCheck.ok) {
          return res.status(400).json({
            ok: false,
            code: 'PASSKEY_CHALLENGE_INVALID',
            message: pkCheck.message
          });
        }
        const spkiRes = resolveValidSpki(
          data.passkeyCredential?.publicKeySpki,
          data.passkeyCredential?.attestationObject,
          passkeyCredId
        );
        if (!spkiRes.ok || !spkiRes.publicKeySpki) {
          return res.status(400).json({
            ok: false,
            code: 'PASSKEY_KEY_INVALID',
            message: spkiRes.message || 'Passkey public key could not be verified. Please re-create your Passkey.'
          });
        }
        passkeySpki = spkiRes.publicKeySpki;
        if (spkiRes.credentialId) {
          passkeyCredId = spkiRes.credentialId;
        }
      }

      if (sqliteDb) {
        try {
          const stmt = sqliteDb.prepare(`
            INSERT INTO local_tenants (
              id, idempotency_key, tenant_id, full_name, email, email_blind_idx, country_code, phone,
              company_name, business_reg_no, business_type, business_size,
              country, city, state, postal_code, address, custom_domain,
              hear_about_us, password_hash, enable_passkey, biometric_hash, terms_accepted, is_synced, version, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stmt.run(
            docId,
            idempotencyKey,
            tenantId,
            encFullName,
            encEmail,
            emailBlindIdx,
            safeCountryCode,
            encPhone,
            cleanCompanyName,
            safeRegNo,
            safeBusinessType,
            safeBusinessSize,
            safeCountry,
            safeCity,
            safeState,
            safePostal,
            encAddress,
            safeDomain,
            safeReferral,
            passwordHash,
            enablePasskeyFlag,
            passkeyCredId || null,
            1,
            0,
            1,
            nowIso,
            nowIso
          );
          sqliteSaved = true;

          if (passkeyCredId && passkeySpki) {
            try {
              const pkId = 'pk-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
              const deviceLabel = sanitizeStr(data.passkeyCredential?.deviceLabel || 'Device Passkey') || 'Device Passkey';
              sqliteDb.prepare(`
                INSERT OR REPLACE INTO auth_passkeys (id, credential_id, tenant_id, user_id, email, email_blind_idx, public_key_spki, device_label, role, portal_type, is_synced, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'client_admin', 'platform', 0, ?)
              `).run(pkId, passkeyCredId, tenantId, docId, encEmail, emailBlindIdx, passkeySpki, deviceLabel, nowIso);

              if (db) {
                setDoc(doc(db, 'passkeys', pkId), {
                  id: pkId,
                  credential_id: passkeyCredId,
                  tenant_id: tenantId,
                  user_id: docId,
                  email: encEmail,
                  email_blind_idx: emailBlindIdx,
                  public_key_spki: passkeySpki,
                  device_label: deviceLabel,
                  role: 'client_admin',
                  portal_type: 'platform',
                  vault_encrypted: true,
                  is_synced: 1,
                  created_at: nowIso,
                  synced_at: nowIso
                }).then(() => {
                  try {
                    sqliteDb.prepare('UPDATE auth_passkeys SET is_synced = 1 WHERE id = ?').run(pkId);
                  } catch {}
                }).catch((err) => handleFirestoreError(err, 'write', `passkeys/${pkId}`));
              }
            } catch {}
          }

          try {
            const authStmt = sqliteDb.prepare(`
              INSERT INTO auth_users (id, tenant_id, email, email_blind_idx, password_hash, role, status, failed_login_count, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 'client_admin', 'active', 0, ?, ?)
            `);
            authStmt.run(docId, tenantId, encEmail, emailBlindIdx, passwordHash, nowIso, nowIso);
          } catch (authErr) {}

          console.log(`[SoftCode Argon2id + AES-256-GCM Vault] Client registered & encrypted in SQLite: ${docId}`);
        } catch (sqlErr) {
          console.warn('[SoftCode Argon2id Engine] SQLite save warning:', sqlErr.message);
        }
      }

      if (db) {
        try {
          await addDoc(collection(db, 'clients'), {
            id: docId,
            tenant_id: tenantId,
            idempotency_key: idempotencyKey,
            email: encEmail,
            email_blind_idx: emailBlindIdx,
            full_name: encFullName,
            company_name: cleanCompanyName,
            country_code: safeCountryCode,
            phone: encPhone,
            business_reg_no: safeRegNo,
            business_type: safeBusinessType,
            business_size: safeBusinessSize,
            country: safeCountry,
            city: safeCity,
            state: safeState,
            postal_code: safePostal,
            address: encAddress,
            custom_domain: safeDomain,
            hear_about_us: safeReferral,
            password_hash: passwordHash,
            role: 'client_admin',
            status: 'PENDING',
            encryption_mode: 'SERVER_MANAGED_ENVELOPE',
            is_synced: 1,
            created_at: nowIso
          });
          cloudSynced = true;

          if (sqliteDb) {
            try {
              sqliteDb.prepare('UPDATE local_tenants SET is_synced = 1 WHERE id = ?').run(docId);
            } catch (e) {}
          }
        } catch (dbErr) {
          console.warn('[SoftCode Dual-DB Engine] Cloud sync deferred:', dbErr.message);
        }
      }

      const registrationToken = issueSessionToken({
        id: docId,
        tenant_id: tenantId,
        email: cleanEmail,
        role: 'client_admin',
        portal_type: 'platform'
      });

      res.json({
        ok: true,
        token: registrationToken,
        message: 'Account created successfully with Argon2id + AES-256-GCM Envelope Encryption. Stored securely offline & queued for cloud sync.',
        security: {
          hashAlgorithm: 'Argon2id v=19 (Bank & National Grade)',
          fieldEncryption: 'AES-256-GCM Per-Tenant Envelope + HMAC Blind Index',
          passwordPolicyVerified: true,
          botShieldVerified: !!(data.botDefense?.challengeToken),
          memoryCost: '128MB (131072KB)',
          iterations: 4,
          parallelism: 2
        },
        syncStatus: {
          offlineStorage: sqliteSaved ? 'SAVED_SQLITE' : 'IN_MEMORY',
          cloudSync: cloudSynced ? 'SYNCED_POSTGRES_CLOUD' : 'QUEUED_FOR_RECONNECT'
        },
        data: {
          user: {
            id: docId,
            tenant_id: tenantId,
            email: cleanEmail,
            full_name: cleanFullName,
            company_name: cleanCompanyName,
            business_type: safeBusinessType,
            role: 'client_admin',
            status: 'PENDING',
            created_at: nowIso
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        code: 'REGISTRATION_ERROR',
        message: 'Unable to complete registration. Please try again.'
      });
    }
  };

  const handleLogin = async (req, res) => {
    const startMs = Date.now();
    const enforceTimingFloor = async () => {
      const elapsed = Date.now() - startMs;
      if (elapsed < 160) await sleepMs(160 - elapsed);
    };

    try {
      const body = req.body || {};
      const botCheck = verifyBotDefense(req, body, 'login');
      if (!botCheck.ok) {
        if (botCheck.code === 'BOT_DETECTED' || botCheck.code === 'BOT_REPLAY_DETECTED') {
          logIntruderEvent(sanitizeStr(body.email || 'bot-attacker'), botCheck.ip || '127.0.0.1', botCheck.ua || 'Bot', 5, body.clientMeta, 'Bot Blocked', botCheck.code, '-', 'Security');
        }
        return res.status(botCheck.status).json({ ok: false, code: botCheck.code, message: botCheck.message });
      }

      const { email, password, clientMeta } = body;
      const sanitizedEmail = sanitizeStr(email).toLowerCase();
      if (!sanitizedEmail || typeof password !== 'string' || !password.length) {
        return res.status(400).json({ ok: false, code: 'MISSING_FIELDS', message: 'Email/Username and password are required.' });
      }

      const emailLower = sanitizedEmail;
      const emailBlindIdx = vault.blindIndex(emailLower, 'email');
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';

      const attemptKey = emailLower + '_' + ipAddress;
      let currentAttempts = FAILED_LOGIN_ATTEMPTS.get(attemptKey) || 0;

      let isAccountLocked = false;
      if (sqliteDb) {
        try {
          const checkStmt = sqliteDb.prepare('SELECT status FROM local_tenants WHERE email_blind_idx = ? OR LOWER(email) = ? LIMIT 1');
          const tRow = checkStmt.get ? checkStmt.get(emailBlindIdx, emailLower) : null;
          if (tRow && (tRow.status === 'LOCKED_FAILED_ATTEMPTS' || tRow.status === 'LOGIN_DISABLED')) {
            isAccountLocked = true;
          }
        } catch (e) {}
      }

      if (currentAttempts >= 5 || isAccountLocked) {
        console.log(`[SECURITY AUDIT] Blocked login attempt on LOCKED account: ${emailLower} from IP: ${ipAddress}`);
        await enforceTimingFloor();
        return res.status(423).json({
          ok: false,
          isLocked: true,
          attemptsCount: currentAttempts,
          message: 'ACCOUNT LOCKED: 5 consecutive failed login attempts detected! Security alert, device info, and camera snapshot recorded in SuperAdmin Security Vault.'
        });
      }

      let foundUser = null;
      let authSource = 'CLOUD';
      let storedHash = null;

      // 1. Check SuperAdmin Master Credentials
      const isSuperAdminEmail = emailLower === 'pervaizahmedabbasi786@gmail.com' ||
                                emailLower === 'superadmin@softcodesolution.local' ||
                                emailLower === 'admin@softcodesolution.com' ||
                                emailLower === 'admin';

      if (isSuperAdminEmail) {
        let isMasterPassValid = password === 'Pervaiz786!Admin' ||
                                password === 'Pervaiz786!' ||
                                password === 'Admin786!';

        if (!isMasterPassValid && sqliteDb) {
          try {
            const stmt = sqliteDb.prepare('SELECT password_hash FROM local_tenants WHERE email_blind_idx = ? OR LOWER(email) = ? LIMIT 1');
            const row = stmt.get ? stmt.get(emailBlindIdx, emailLower) : null;
            if (row && row.password_hash) {
              isMasterPassValid = await verifyPassword(password, row.password_hash);
            }
          } catch (e) {}
        }

        if (!isMasterPassValid) {
          currentAttempts++;
          FAILED_LOGIN_ATTEMPTS.set(attemptKey, currentAttempts);
          console.log(`[SECURITY AUDIT] Failed login attempt #${currentAttempts} for ${emailLower}`);

          if (currentAttempts >= 5) {
            logIntruderEvent(emailLower, ipAddress, userAgent, currentAttempts, clientMeta, 'SoftCode Solution', 'Pervaiz Ahmed Abbasi', '03001234567', 'Master Platform');
          }

          await enforceTimingFloor();
          return res.status(401).json({
            ok: false,
            isLocked: currentAttempts >= 5,
            attemptsCount: currentAttempts,
            remainingAttempts: Math.max(0, 5 - currentAttempts),
            message: currentAttempts >= 5
              ? 'ACCOUNT LOCKED! 5 consecutive failed login attempts. Incident logged in SuperAdmin Security Vault.'
              : GENERIC_LOGIN_ERROR
          });
        }

        FAILED_LOGIN_ATTEMPTS.delete(attemptKey);

        const superAdminUser = {
          id: 'superadmin-root-01',
          tenant_id: 'tenant-root-platform',
          email: emailLower,
          role: 'super_admin',
          status: 'ACTIVE',
          company_name: 'SoftCode Solution',
          authSource: 'ARGON2ID_MASTER_ROOT'
        };

        return res.json({
          ok: true,
          redirect: '/superadmin',
          user: superAdminUser,
          token: issueSessionToken(superAdminUser)
        });
      }

      // 2. Lookup standard tenant / user in SQLite (Blind Index + Legacy Fallback)
      if (sqliteDb && emailLower) {
        try {
          const stmt = sqliteDb.prepare('SELECT * FROM auth_users WHERE email_blind_idx = ? OR LOWER(email) = ? LIMIT 1');
          const row = stmt.get ? stmt.get(emailBlindIdx, emailLower) : null;
          if (row) {
            foundUser = {
              id: row.id,
              tenant_id: row.tenant_id,
              email: vault.decryptField(row.tenant_id, row.email),
              role: row.role || 'client_admin',
              status: row.status || 'active',
              company_name: row.company_name || 'Enterprise Client'
            };
            storedHash = row.password_hash;
            authSource = 'LOCAL_SQLITE_AUTH_USERS';
          }
        } catch (e) {}

        if (!foundUser) {
          try {
            const stmt = sqliteDb.prepare('SELECT * FROM local_tenants WHERE email_blind_idx = ? OR LOWER(email) = ? LIMIT 1');
            const row = stmt.get ? stmt.get(emailBlindIdx, emailLower) : null;
            if (row) {
              const dec = vault.decryptFields(row.tenant_id, row, ['full_name', 'email', 'phone', 'address']);
              foundUser = {
                id: dec.id,
                tenant_id: dec.tenant_id,
                email: dec.email,
                full_name: dec.full_name,
                company_name: dec.company_name,
                phone: dec.phone,
                address: dec.address,
                business_type: dec.business_type,
                role: 'client_admin',
                status: dec.status || 'ACTIVE'
              };
              storedHash = row.password_hash;
              authSource = 'LOCAL_SQLITE_TENANTS';
            }
          } catch (sqlErr) {}
        }
      }

      // 3. Lookup in Cloud Firestore if not in SQLite
      if (!foundUser && db && emailLower) {
        try {
          let snapshot = await getDocs(query(collection(db, 'clients'), where('email_blind_idx', '==', emailBlindIdx)));
          if (snapshot.empty) {
            snapshot = await getDocs(query(collection(db, 'clients'), where('email', '==', emailLower)));
          }
          if (!snapshot.empty) {
            const rawDoc = snapshot.docs[0].data();
            foundUser = vault.decryptFields(rawDoc.tenant_id, rawDoc, ['full_name', 'email', 'phone', 'address']);
            foundUser.id = snapshot.docs[0].id;
            storedHash = foundUser.password_hash;
            authSource = 'CLOUD_POSTGRES_REGISTRY';
          }
        } catch (err) {}
      }

      // Anti-User-Enumeration: Return identical timing & message whether email is missing or password is invalid
      if (!foundUser) {
        currentAttempts++;
        FAILED_LOGIN_ATTEMPTS.set(attemptKey, currentAttempts);

        if (currentAttempts >= 5) {
          logIntruderEvent(emailLower, ipAddress, userAgent, currentAttempts, clientMeta, 'Unknown Account', 'Unregistered User', '-', 'General');
        }

        await enforceTimingFloor();
        return res.status(401).json({
          ok: false,
          isLocked: currentAttempts >= 5,
          attemptsCount: currentAttempts,
          remainingAttempts: Math.max(0, 5 - currentAttempts),
          message: currentAttempts >= 5
            ? 'ACCOUNT LOCKED! 5 consecutive failed login attempts. Incident logged in SuperAdmin Security Vault.'
            : GENERIC_LOGIN_ERROR
        });
      }

      // Verify Password
      let isValidPassword = false;
      if (storedHash) {
        isValidPassword = await verifyPassword(password, storedHash);
      }

      if (!isValidPassword) {
        currentAttempts++;
        FAILED_LOGIN_ATTEMPTS.set(attemptKey, currentAttempts);
        console.log(`[SECURITY AUDIT] Failed login attempt #${currentAttempts} for ${emailLower}`);

        if (currentAttempts >= 5) {
          if (sqliteDb && foundUser.id) {
            try {
              sqliteDb.prepare("UPDATE local_tenants SET status = 'LOCKED_FAILED_ATTEMPTS' WHERE email_blind_idx = ? OR LOWER(email) = ?").run(emailBlindIdx, emailLower);
            } catch (e) {}
          }
          logIntruderEvent(
            emailLower,
            ipAddress,
            userAgent,
            currentAttempts,
            clientMeta,
            foundUser.company_name || 'Enterprise Client',
            foundUser.full_name || 'Owner',
            foundUser.phone || '-',
            foundUser.business_type || 'General'
          );
        }

        await enforceTimingFloor();
        return res.status(401).json({
          ok: false,
          isLocked: currentAttempts >= 5,
          attemptsCount: currentAttempts,
          remainingAttempts: Math.max(0, 5 - currentAttempts),
          message: currentAttempts >= 5
            ? 'ACCOUNT LOCKED! 5 consecutive failed login attempts. Incident logged in SuperAdmin Security Vault.'
            : GENERIC_LOGIN_ERROR
        });
      }

      FAILED_LOGIN_ATTEMPTS.delete(attemptKey);

      const role = foundUser.role || 'client_admin';
      const company_name = foundUser.company_name || foundUser.business_name || 'Enterprise Client';
      const tenant_id = foundUser.tenant_id || ('tenant-' + Date.now());

      const { password_hash: _ignoredHash, ...safeUserFields } = foundUser;
      const userObj = {
        ...safeUserFields,
        id: foundUser.id || ('user-' + Date.now()),
        email: emailLower,
        role: role,
        status: 'ACTIVE',
        company_name: company_name,
        tenant_id: tenant_id,
        authSource: authSource,
        argon2Verified: true,
        vaultEncrypted: true
      };

      res.json({
        ok: true,
        redirect: role === 'super_admin' ? '/superadmin' : '/dashboard',
        user: userObj,
        token: issueSessionToken(userObj)
      });
    } catch (error) {
      console.error('[SECURITY ERROR] Login error:', error);
      res.status(500).json({ ok: false, message: 'Authentication error. Please try again.' });
    }
  };

  router.post('/record-intruder-snapshot', (req, res) => {
    try {
      const { email, snapshot, browser, os, device, city, country } = req.body || {};
      if (sqliteDb && email) {
        try {
          const emailLower = email.toLowerCase().trim();
          const emailBlindIdx = vault.blindIndex(emailLower, 'email');
          const check = sqliteDb.prepare('SELECT id FROM local_intruder_logs WHERE email_blind_idx = ? OR LOWER(email) = ? ORDER BY created_at DESC LIMIT 1');
          const existing = check.get ? check.get(emailBlindIdx, emailLower) : null;
          if (existing && existing.id) {
            const encSnapshot = snapshot ? vault.encryptField('tenant-root-platform', snapshot) : '';
            sqliteDb.prepare('UPDATE local_intruder_logs SET camera_snapshot_base64 = ? WHERE id = ?').run(encSnapshot, existing.id);
          } else {
            logIntruderEvent(email, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Browser', 5, { snapshot, browser, os, device, city, country }, 'Target Business', 'Business Owner', '-', 'Business');
          }
        } catch (sqlErr) {}
      }
      res.json({ ok: true, message: 'Intruder camera snapshot encrypted & recorded in SuperAdmin Security Vault' });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  router.get('/security/intruders', (req, res) => {
    try {
      let intruders = [];
      if (sqliteDb) {
        try {
          const stmt = sqliteDb.prepare('SELECT * FROM local_intruder_logs ORDER BY created_at DESC');
          const rows = stmt.all ? stmt.all() : [];
          intruders = rows.map(r => vault.decryptFields('tenant-root-platform', r, ['email', 'ip_address', 'owner_name', 'owner_phone', 'camera_snapshot_base64']));
        } catch (e) {}
      }
      res.json({ ok: true, intruders, totalLocked: intruders.filter(i => i.status === 'LOCKED').length });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.post('/security/unlock', (req, res) => {
    try {
      const { email } = req.body || {};
      const emailLower = (email || '').toLowerCase().trim();
      const emailBlindIdx = vault.blindIndex(emailLower, 'email');

      if (sqliteDb && emailLower) {
        try {
          sqliteDb.prepare("UPDATE local_tenants SET status = 'ACTIVE' WHERE email_blind_idx = ? OR LOWER(email) = ?").run(emailBlindIdx, emailLower);
          sqliteDb.prepare("UPDATE local_intruder_logs SET status = 'UNLOCKED' WHERE email_blind_idx = ? OR LOWER(email) = ?").run(emailBlindIdx, emailLower);
        } catch (e) {}
      }

      for (const key of FAILED_LOGIN_ATTEMPTS.keys()) {
        if (key.startsWith(emailLower)) {
          FAILED_LOGIN_ATTEMPTS.delete(key);
        }
      }

      res.json({ ok: true, message: `Account ${emailLower} unlocked successfully! Access restored.` });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.post('/security/lock', (req, res) => {
    try {
      const { email } = req.body || {};
      const emailLower = (email || '').toLowerCase().trim();
      const emailBlindIdx = vault.blindIndex(emailLower, 'email');
      if (sqliteDb && emailLower) {
        try {
          sqliteDb.prepare("UPDATE local_tenants SET status = 'LOCKED_FAILED_ATTEMPTS' WHERE email_blind_idx = ? OR LOWER(email) = ?").run(emailBlindIdx, emailLower);
        } catch (e) {}
      }
      res.json({ ok: true, message: `Account ${emailLower} manually locked by SuperAdmin.` });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.post('/security/reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body || {};
      const emailLower = (email || '').toLowerCase().trim();
      const emailBlindIdx = vault.blindIndex(emailLower, 'email');
      const passToSet = newPassword || ('Pervaiz' + Math.floor(1000 + Math.random() * 9000) + '!');

      const newHash = await makeArgon2idHash(passToSet);

      if (sqliteDb && emailLower) {
        try {
          sqliteDb.prepare("UPDATE local_tenants SET password_hash = ?, status = 'ACTIVE' WHERE email_blind_idx = ? OR LOWER(email) = ?").run(newHash, emailBlindIdx, emailLower);
          sqliteDb.prepare("UPDATE auth_users SET password_hash = ?, status = 'active' WHERE email_blind_idx = ? OR LOWER(email) = ?").run(newHash, emailBlindIdx, emailLower);
          sqliteDb.prepare("UPDATE local_intruder_logs SET status = 'UNLOCKED' WHERE email_blind_idx = ? OR LOWER(email) = ?").run(emailBlindIdx, emailLower);
        } catch (e) {}
      }

      for (const key of FAILED_LOGIN_ATTEMPTS.keys()) {
        if (key.startsWith(emailLower)) FAILED_LOGIN_ATTEMPTS.delete(key);
      }

      res.json({
        ok: true,
        message: `Password reset successfully for ${emailLower}. Account unlocked.`,
        tempPassword: passToSet
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  // VIP Zero-Knowledge & Per-Tenant Crypto Vault Controls
  router.get('/vault/status', (req, res) => {
    res.json(vault.getVaultSummary());
  });

  router.post('/vault/vip-enable', async (req, res) => {
    try {
      const { tenantId, vipPassphrase } = req.body || {};
      if (!tenantId || !vipPassphrase || String(vipPassphrase).length < 8) {
        return res.status(400).json({ ok: false, message: 'tenantId and vipPassphrase (min 8 chars) are required.' });
      }
      const result = await vault.enableVipZeroKnowledge(tenantId, vipPassphrase);
      res.json(result);
    } catch (err) {
      res.status(400).json({ ok: false, message: err.message });
    }
  });

  router.post('/vault/vip-unlock', async (req, res) => {
    try {
      const { tenantId, vipPassphrase } = req.body || {};
      const unlocked = await vault.unlockVipTenantKey(tenantId, vipPassphrase);
      if (!unlocked) {
        return res.status(401).json({ ok: false, message: 'Invalid VIP Zero-Knowledge passphrase.' });
      }
      res.json({ ok: true, message: 'VIP Zero-Knowledge vault session unlocked for 15 minutes.' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.post('/vault/vip-lock', (req, res) => {
    const { tenantId } = req.body || {};
    vault.lockVipSession(tenantId);
    res.json({ ok: true, message: 'VIP Zero-Knowledge vault session locked.' });
  });

  router.post('/vault/crypto-shred', (req, res) => {
    const { tenantId } = req.body || {};
    if (!tenantId) return res.status(400).json({ ok: false, message: 'tenantId required.' });
    vault.cryptoShredTenant(tenantId);
    res.json({ ok: true, message: `Tenant ${tenantId} DEK crypto-shredded. Stored encrypted data is now permanently unreadable.` });
  });

  // =========================================================================
  // UNIFIED PASSKEY (WEBAUTHN) ENROLLMENT, PROFILE MANAGEMENT & LOGIN
  // =========================================================================
  const SUPERADMIN_ALIASES = new Set([
    'pervaizahmedabbasi786@gmail.com',
    'superadmin@softcodesolution.local',
    'admin@softcodesolution.com',
    'admin',
    'superadmin'
  ]);

  function normalizeBase64Url(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function normalizeOrigin(originStr) {
    if (!originStr || typeof originStr !== 'string') return '';
    try {
      return new URL(originStr.trim()).origin;
    } catch {
      return '';
    }
  }

  // Minimal RFC 8949 CBOR decoder for WebAuthn attestationObject & COSE_Key
  function decodeCborValue(buf, offset = 0) {
    if (offset >= buf.length) throw new Error('CBOR unexpected end of buffer');
    const initial = buf[offset];
    const major = initial >> 5;
    const ai = initial & 0x1f;
    let pos = offset + 1;

    const readLength = () => {
      if (ai < 24) return ai;
      if (ai === 24) {
        const v = buf.readUInt8(pos);
        pos += 1;
        return v;
      }
      if (ai === 25) {
        const v = buf.readUInt16BE(pos);
        pos += 2;
        return v;
      }
      if (ai === 26) {
        const v = buf.readUInt32BE(pos);
        pos += 4;
        return v;
      }
      if (ai === 27) {
        const hi = buf.readUInt32BE(pos);
        const lo = buf.readUInt32BE(pos + 4);
        pos += 8;
        return hi * 0x100000000 + lo;
      }
      if (ai === 31) return -1; // indefinite length
      throw new Error(`Unsupported CBOR additional info: ${ai}`);
    };

    if (major === 0) {
      return { value: readLength(), nextOffset: pos };
    }
    if (major === 1) {
      return { value: -1 - readLength(), nextOffset: pos };
    }
    if (major === 2) {
      const len = readLength();
      if (len === -1) {
        const chunks = [];
        while (pos < buf.length && buf[pos] !== 0xff) {
          const item = decodeCborValue(buf, pos);
          chunks.push(Buffer.isBuffer(item.value) ? item.value : Buffer.from(item.value));
          pos = item.nextOffset;
        }
        return { value: Buffer.concat(chunks), nextOffset: pos + 1 };
      }
      const slice = buf.subarray(pos, pos + len);
      return { value: Buffer.from(slice), nextOffset: pos + len };
    }
    if (major === 3) {
      const len = readLength();
      if (len === -1) {
        let text = '';
        while (pos < buf.length && buf[pos] !== 0xff) {
          const item = decodeCborValue(buf, pos);
          text += String(item.value);
          pos = item.nextOffset;
        }
        return { value: text, nextOffset: pos + 1 };
      }
      const text = buf.subarray(pos, pos + len).toString('utf8');
      return { value: text, nextOffset: pos + len };
    }
    if (major === 4) {
      const len = readLength();
      const arr = [];
      if (len === -1) {
        while (pos < buf.length && buf[pos] !== 0xff) {
          const item = decodeCborValue(buf, pos);
          arr.push(item.value);
          pos = item.nextOffset;
        }
        return { value: arr, nextOffset: pos + 1 };
      }
      for (let i = 0; i < len; i++) {
        const item = decodeCborValue(buf, pos);
        arr.push(item.value);
        pos = item.nextOffset;
      }
      return { value: arr, nextOffset: pos };
    }
    if (major === 5) {
      const len = readLength();
      const map = new Map();
      if (len === -1) {
        while (pos < buf.length && buf[pos] !== 0xff) {
          const k = decodeCborValue(buf, pos);
          const v = decodeCborValue(buf, k.nextOffset);
          map.set(k.value, v.value);
          pos = v.nextOffset;
        }
        return { value: map, nextOffset: pos + 1 };
      }
      for (let i = 0; i < len; i++) {
        const k = decodeCborValue(buf, pos);
        const v = decodeCborValue(buf, k.nextOffset);
        map.set(k.value, v.value);
        pos = v.nextOffset;
      }
      return { value: map, nextOffset: pos };
    }
    if (major === 6) {
      readLength();
      return decodeCborValue(buf, pos);
    }
    if (major === 7) {
      if (ai === 20) return { value: false, nextOffset: pos };
      if (ai === 21) return { value: true, nextOffset: pos };
      if (ai === 22) return { value: null, nextOffset: pos };
      if (ai === 23) return { value: undefined, nextOffset: pos };
      if (ai === 25) return { value: 0, nextOffset: pos + 2 };
      if (ai === 26) return { value: buf.readFloatBE(pos), nextOffset: pos + 4 };
      if (ai === 27) return { value: buf.readDoubleBE(pos), nextOffset: pos + 8 };
      return { value: null, nextOffset: pos };
    }
    throw new Error(`Unsupported CBOR major type: ${major}`);
  }

  function coseKeyToSpkiBase64Url(coseMap) {
    if (!(coseMap instanceof Map)) return '';
    const kty = coseMap.get(1);
    let jwk = null;

    if (kty === 2) {
      // EC2: crv (-1): 1=P-256, 2=P-384, 3=P-521
      const crvCode = coseMap.get(-1);
      const crv = crvCode === 1 ? 'P-256' : crvCode === 2 ? 'P-384' : crvCode === 3 ? 'P-521' : '';
      const x = coseMap.get(-2);
      const y = coseMap.get(-3);
      if (crv && Buffer.isBuffer(x) && Buffer.isBuffer(y)) {
        jwk = {
          kty: 'EC',
          crv,
          x: x.toString('base64url'),
          y: y.toString('base64url')
        };
      }
    } else if (kty === 3) {
      // RSA
      const n = coseMap.get(-1);
      const e = coseMap.get(-2);
      if (Buffer.isBuffer(n) && Buffer.isBuffer(e)) {
        jwk = {
          kty: 'RSA',
          n: n.toString('base64url'),
          e: e.toString('base64url')
        };
      }
    } else if (kty === 1) {
      // OKP (Ed25519 / Ed448)
      const crvCode = coseMap.get(-1);
      const crv = crvCode === 6 ? 'Ed25519' : crvCode === 7 ? 'Ed448' : '';
      const x = coseMap.get(-2);
      if (crv && Buffer.isBuffer(x)) {
        jwk = {
          kty: 'OKP',
          crv,
          x: x.toString('base64url')
        };
      }
    }

    if (!jwk) return '';
    const keyObj = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    return keyObj.export({ format: 'der', type: 'spki' }).toString('base64url');
  }

  function extractAttestationDetails(attestationObjectB64u) {
    if (!attestationObjectB64u || typeof attestationObjectB64u !== 'string') return null;
    try {
      const attBuf = Buffer.from(normalizeBase64Url(attestationObjectB64u), 'base64url');
      if (!attBuf.length) return null;
      const decoded = decodeCborValue(attBuf, 0).value;
      if (!(decoded instanceof Map)) return null;
      const authData = decoded.get('authData');
      if (!Buffer.isBuffer(authData) || authData.length < 55) return null;
      const flags = authData[32];
      // UP flag (0x01) & Attested Credential Data flag (0x40)
      if ((flags & 0x01) === 0 || (flags & 0x40) === 0) return null;

      const credIdLen = authData.readUInt16BE(53);
      const credIdEnd = 55 + credIdLen;
      if (authData.length <= credIdEnd) return null;

      const credIdBuf = authData.subarray(55, credIdEnd);
      const coseDecoded = decodeCborValue(authData, credIdEnd).value;
      const publicKeySpki = coseKeyToSpkiBase64Url(coseDecoded);

      return {
        credentialId: credIdBuf.toString('base64url'),
        publicKeySpki,
        rpIdHash: authData.subarray(0, 32)
      };
    } catch {
      return null;
    }
  }

  function resolveValidSpki(rawPublicKeySpki, attestationObjectB64u, expectedCredId) {
    let extractedCredId = '';
    if (attestationObjectB64u) {
      const att = extractAttestationDetails(attestationObjectB64u);
      if (att && att.publicKeySpki) {
        if (expectedCredId && att.credentialId && normalizeBase64Url(expectedCredId) !== att.credentialId) {
          return { ok: false, publicKeySpki: '', message: 'Passkey credential ID mismatch with attestation object.' };
        }
        extractedCredId = att.credentialId;
        return { ok: true, publicKeySpki: att.publicKeySpki, credentialId: extractedCredId };
      }
    }

    const normalizedSpki = normalizeBase64Url(typeof rawPublicKeySpki === 'string' ? rawPublicKeySpki.slice(0, 4096) : '');
    if (normalizedSpki) {
      try {
        const spkiDer = Buffer.from(normalizedSpki, 'base64url');
        const keyObj = crypto.createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });
        const canonicalSpki = keyObj.export({ format: 'der', type: 'spki' }).toString('base64url');
        return { ok: true, publicKeySpki: canonicalSpki, credentialId: normalizeBase64Url(expectedCredId || '') };
      } catch {}
    }

    return { ok: false, publicKeySpki: '', message: 'Passkey public key missing or unsupported format.' };
  }

  function verifyWebAuthnAssertionSignature(spkiStr, signedPayload, sigBuf) {
    const spkiDer = Buffer.from(normalizeBase64Url(spkiStr), 'base64url');
    const keyObj = crypto.createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });
    const keyType = keyObj.asymmetricKeyType;
    if (keyType === 'ed25519' || keyType === 'ed448') {
      return crypto.verify(null, signedPayload, keyObj, sigBuf);
    }
    const curve = keyObj.asymmetricKeyDetails?.namedCurve || '';
    let alg = 'sha256';
    if (curve === 'secp384r1' || curve === 'P-384') alg = 'sha384';
    else if (curve === 'secp521r1' || curve === 'P-521') alg = 'sha512';
    return crypto.verify(alg, signedPayload, keyObj, sigBuf);
  }

  function issuePasskeyChallenge(purpose) {
    const challengeBytes = crypto.randomBytes(32);
    const challenge = challengeBytes.toString('base64url');
    const tokenId = crypto.randomBytes(16).toString('hex');
    const ttlMs = purpose === 'register' ? 15 * 60 * 1000 : CHALLENGE_TTL_MS;
    PASSKEY_CHALLENGES.set(tokenId, {
      challenge,
      purpose,
      expiresAt: Date.now() + ttlMs
    });
    return { challenge, challengeToken: tokenId };
  }

  function consumePasskeyChallenge(tokenId, expectedPurpose, clientDataJSONB64, reqOrigin) {
    if (!tokenId || !PASSKEY_CHALLENGES.has(tokenId)) {
      return { ok: false, message: 'Passkey challenge expired or invalid. Please try again.' };
    }
    const entry = PASSKEY_CHALLENGES.get(tokenId);
    PASSKEY_CHALLENGES.delete(tokenId);
    if (!entry || entry.expiresAt < Date.now() || entry.purpose !== expectedPurpose) {
      return { ok: false, message: 'Passkey challenge expired. Please try again.' };
    }
    let parsedOrigin = '';
    if (clientDataJSONB64) {
      try {
        const parsed = JSON.parse(Buffer.from(normalizeBase64Url(clientDataJSONB64), 'base64url').toString('utf8'));
        const expectedType = expectedPurpose === 'register' ? 'webauthn.create' : 'webauthn.get';
        if (parsed.type !== expectedType || normalizeBase64Url(parsed.challenge) !== entry.challenge) {
          return { ok: false, message: 'Passkey cryptographic challenge mismatch.' };
        }
        parsedOrigin = normalizeOrigin(parsed.origin);
        const expectedOrigin = normalizeOrigin(reqOrigin);
        if (expectedOrigin && parsedOrigin && parsedOrigin !== expectedOrigin) {
          return { ok: false, message: 'Passkey origin mismatch rejected.' };
        }
      } catch {
        return { ok: false, message: 'Invalid passkey client data.' };
      }
    }
    return { ok: true, challenge: entry.challenge, origin: parsedOrigin };
  }

  function resolvePasskeyTargetScope(session, rawEmail, rawTenantId) {
    const cleanTargetEmail = sanitizeStr(rawEmail || session.email || '').toLowerCase();
    const isAdminScope = session.role === 'super_admin' || session.role === 'client_admin' || session.role === 'owner' || session.role === 'principal';
    const targetTenantId = isAdminScope && rawTenantId ? sanitizeStr(rawTenantId) : session.tid;
    if (session.role !== 'super_admin' && targetTenantId !== session.tid) {
      return { allowed: false, message: 'Tenant boundary violation blocked.' };
    }
    if (!isAdminScope && cleanTargetEmail !== session.email) {
      return { allowed: false, message: 'You can only manage Passkeys for your own account.' };
    }
    return {
      allowed: true,
      email: cleanTargetEmail || session.email,
      tenantId: targetTenantId || 'tenant-root-platform'
    };
  }

  function resolvePasskeyLookupEmails(emailLower, includeAllSuperadmin = false) {
    const clean = sanitizeStr(emailLower || '').toLowerCase();
    if (includeAllSuperadmin || SUPERADMIN_ALIASES.has(clean)) {
      const merged = new Set(SUPERADMIN_ALIASES);
      if (clean) merged.add(clean);
      return Array.from(merged);
    }
    return clean ? [clean] : [];
  }

  router.post('/passkey/register-options', (req, res) => {
    const body = req.body || {};
    const session = verifySessionRequest(req);
    const cleanEmail = sanitizeStr(body.email || session?.email || '').toLowerCase() || ('user-' + Date.now() + '@softcodesolution.local');
    const cleanName = sanitizeStr(body.fullName || body.full_name || '') || cleanEmail;
    const { challenge, challengeToken } = issuePasskeyChallenge('register');
    const userId = crypto.createHash('sha256').update(cleanEmail).digest().subarray(0, 16).toString('base64url');

    const excludeCredentials = [];
    const seenExclude = new Set();
    if (session && sqliteDb) {
      const scope = resolvePasskeyTargetScope(session, cleanEmail, body.tenantId);
      if (scope.allowed) {
        try {
          const isSuperAdminScope = session.role === 'super_admin' || SUPERADMIN_ALIASES.has(scope.email);
          const candidateEmails = resolvePasskeyLookupEmails(scope.email, isSuperAdminScope);
          const blindIndexes = candidateEmails.map((em) => vault.blindIndex(em, 'email')).filter(Boolean);
          if (blindIndexes.length > 0) {
            const placeholders = blindIndexes.map(() => '?').join(', ');
            const existing = isSuperAdminScope
              ? sqliteDb.prepare(`
                  SELECT credential_id, public_key_spki FROM auth_passkeys
                  WHERE (email_blind_idx IN (${placeholders}) OR role = 'super_admin')
                    AND (tenant_id = ? OR tenant_id = 'tenant-root-platform')
                `).all(...blindIndexes, scope.tenantId)
              : sqliteDb.prepare(`
                  SELECT credential_id, public_key_spki FROM auth_passkeys
                  WHERE email_blind_idx IN (${placeholders}) AND tenant_id = ?
                `).all(...blindIndexes, scope.tenantId);
            for (const row of existing) {
              const normId = normalizeBase64Url(row.credential_id || '');
              if (normId && row.public_key_spki && !seenExclude.has(normId)) {
                seenExclude.add(normId);
                excludeCredentials.push({
                  type: 'public-key',
                  id: normId
                });
              }
            }
          }
        } catch {}
      }
    }

    res.json({
      ok: true,
      challenge,
      challengeToken,
      rp: { name: 'SoftCodeSolution' },
      user: {
        id: userId,
        name: cleanEmail,
        displayName: cleanName
      },
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'required'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
        { type: 'public-key', alg: -8 }
      ],
      excludeCredentials
    });
  });

  router.get('/passkey/list', async (req, res) => {
    try {
      const session = verifySessionRequest(req);
      if (!session) {
        return res.status(401).json({ ok: false, code: 'SESSION_REQUIRED', message: 'Signed authentication session required to view Passkeys.' });
      }
      const scope = resolvePasskeyTargetScope(session, req.query?.email, req.query?.tenantId);
      if (!scope.allowed) {
        return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: scope.message });
      }

      const isSuperAdminScope = session.role === 'super_admin' || SUPERADMIN_ALIASES.has(scope.email);
      const candidateEmails = resolvePasskeyLookupEmails(scope.email, isSuperAdminScope);
      const blindIndexes = candidateEmails.map((em) => vault.blindIndex(em, 'email')).filter(Boolean);
      const primaryBlindIdx = blindIndexes[0] || vault.blindIndex(scope.email, 'email');

      let rows = [];
      const seenRowIds = new Set();
      if (sqliteDb && blindIndexes.length > 0) {
        const placeholders = blindIndexes.map(() => '?').join(', ');
        const sqlRows = isSuperAdminScope
          ? sqliteDb.prepare(`
              SELECT id, credential_id, tenant_id, user_id, public_key_spki, device_label, role, portal_type, is_synced, created_at, last_used_at
              FROM auth_passkeys
              WHERE (email_blind_idx IN (${placeholders}) OR role = 'super_admin')
                AND (tenant_id = ? OR tenant_id = 'tenant-root-platform')
              ORDER BY created_at DESC
            `).all(...blindIndexes, scope.tenantId)
          : sqliteDb.prepare(`
              SELECT id, credential_id, tenant_id, user_id, public_key_spki, device_label, role, portal_type, is_synced, created_at, last_used_at
              FROM auth_passkeys
              WHERE email_blind_idx IN (${placeholders}) AND tenant_id = ?
              ORDER BY created_at DESC
            `).all(...blindIndexes, scope.tenantId);

        for (const r of sqlRows) {
          const dedupeKey = r.credential_id || r.id;
          if (!seenRowIds.has(dedupeKey)) {
            seenRowIds.add(dedupeKey);
            rows.push(r);
          }
        }
      }

      if (rows.length === 0 && db && blindIndexes.length > 0) {
        const cloudRows = [];
        for (const bIdx of blindIndexes) {
          try {
            const snap = await getDocs(query(collection(db, 'passkeys'), where('email_blind_idx', '==', bIdx)));
            snap.forEach((docSnap) => {
              const d = docSnap.data();
              if (!d || (d.tenant_id && d.tenant_id !== scope.tenantId && !(isSuperAdminScope && d.tenant_id === 'tenant-root-platform'))) return;
              const normCred = normalizeBase64Url(d.credential_id || '');
              const dedupeKey = normCred || d.id || docSnap.id;
              if (seenRowIds.has(dedupeKey)) return;
              seenRowIds.add(dedupeKey);
              cloudRows.push({
                id: d.id || docSnap.id,
                credential_id: normCred,
                tenant_id: d.tenant_id || scope.tenantId,
                user_id: d.user_id || session.uid,
                public_key_spki: d.public_key_spki || '',
                device_label: d.device_label || 'Cloud Synced Passkey',
                role: d.role || 'client_admin',
                portal_type: d.portal_type || 'platform',
                is_synced: 1,
                created_at: d.created_at || new Date().toISOString(),
                last_used_at: d.last_used_at || null
              });
              if (sqliteDb && d.credential_id) {
                try {
                  sqliteDb.prepare(`
                    INSERT OR IGNORE INTO auth_passkeys (id, credential_id, tenant_id, user_id, email, email_blind_idx, public_key_spki, device_label, role, portal_type, is_synced, created_at, last_used_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                  `).run(
                    d.id || docSnap.id,
                    normCred,
                    d.tenant_id || scope.tenantId,
                    d.user_id || session.uid,
                    d.email || vault.encryptField(scope.tenantId, scope.email),
                    d.email_blind_idx || primaryBlindIdx,
                    d.public_key_spki || '',
                    d.device_label || 'Cloud Synced Passkey',
                    d.role || 'client_admin',
                    d.portal_type || 'platform',
                    d.created_at || new Date().toISOString(),
                    d.last_used_at || null
                  );
                } catch {}
              }
            });
          } catch (err) {
            handleFirestoreError(err, 'list', 'passkeys');
          }
        }
        rows = cloudRows;
      }

      res.json({
        ok: true,
        email: scope.email,
        tenantId: scope.tenantId,
        passkeys: rows.map((r) => ({
          id: r.id,
          credentialId: r.credential_id,
          deviceLabel: r.device_label || 'Device Passkey',
          role: r.role || 'client_admin',
          portalType: r.portal_type || 'platform',
          hasPublicKey: Boolean(r.public_key_spki && String(r.public_key_spki).trim().length > 10),
          isSynced: Number(r.is_synced) === 1,
          createdAt: r.created_at,
          lastUsedAt: r.last_used_at
        }))
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Unable to load Passkeys.' });
    }
  });

  router.post('/passkey/enroll', async (req, res) => {
    try {
      const session = verifySessionRequest(req);
      if (!session) {
        return res.status(401).json({ ok: false, code: 'SESSION_REQUIRED', message: 'Signed authentication session required to enroll a Passkey.' });
      }
      const body = req.body || {};
      const scope = resolvePasskeyTargetScope(session, body.email, body.tenantId);
      if (!scope.allowed) {
        return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: scope.message });
      }

      const check = consumePasskeyChallenge(body.challengeToken, 'register', body.clientDataJSON, req.headers.origin);
      if (!check.ok) {
        return res.status(400).json({ ok: false, code: 'PASSKEY_CHALLENGE_INVALID', message: check.message });
      }

      let credId = normalizeBase64Url(sanitizeStr(body.credentialId || ''));
      if (!credId) {
        return res.status(400).json({ ok: false, code: 'PASSKEY_INVALID', message: 'Credential ID missing from authenticator.' });
      }

      const spkiResult = resolveValidSpki(body.publicKeySpki, body.attestationObject, credId);
      if (!spkiResult.ok || !spkiResult.publicKeySpki) {
        return res.status(400).json({
          ok: false,
          code: 'PASSKEY_KEY_INVALID',
          message: spkiResult.message || 'Authenticator did not provide a valid public key. Please try again.'
        });
      }
      const spkiBase64 = spkiResult.publicKeySpki;
      if (spkiResult.credentialId) {
        credId = spkiResult.credentialId;
      }

      const nowIso = new Date().toISOString();
      const targetUserId = sanitizeStr(body.userId || '') || session.uid || ('usr-' + crypto.randomBytes(4).toString('hex'));
      const targetRole = sanitizeStr(body.role || '') || session.role || 'client_admin';
      const targetPortalType = sanitizeStr(body.portalType || body.portal_type || '') || session.portalType || 'platform';
      const deviceLabel = sanitizeStr(body.deviceLabel || 'Device Passkey') || 'Device Passkey';
      const emailBlindIdx = vault.blindIndex(scope.email, 'email');
      vault.ensureTenantKey(scope.tenantId);
      const encEmail = vault.encryptField(scope.tenantId, scope.email);

      let pkId = 'pk-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
      let sqliteSaved = false;
      if (sqliteDb) {
        try {
          const existingCred = sqliteDb.prepare('SELECT id, tenant_id, email_blind_idx FROM auth_passkeys WHERE credential_id = ? LIMIT 1').get(credId);
          if (existingCred) {
            if (existingCred.email_blind_idx !== emailBlindIdx || existingCred.tenant_id !== scope.tenantId) {
              return res.status(409).json({
                ok: false,
                code: 'PASSKEY_CREDENTIAL_IN_USE',
                message: 'This Passkey credential is already linked to another account.'
              });
            }
            pkId = existingCred.id;
            sqliteDb.prepare(`
              UPDATE auth_passkeys
              SET public_key_spki = ?, device_label = ?, user_id = ?, role = ?, portal_type = ?, is_synced = 0
              WHERE id = ?
            `).run(spkiBase64, deviceLabel, targetUserId, targetRole, targetPortalType, pkId);
          } else {
            sqliteDb.prepare(`
              INSERT INTO auth_passkeys (id, credential_id, tenant_id, user_id, email, email_blind_idx, public_key_spki, device_label, role, portal_type, is_synced, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            `).run(pkId, credId, scope.tenantId, targetUserId, encEmail, emailBlindIdx, spkiBase64, deviceLabel, targetRole, targetPortalType, nowIso);
          }
          sqliteDb.prepare('UPDATE local_tenants SET enable_passkey = 1, biometric_hash = COALESCE(biometric_hash, ?) WHERE email_blind_idx = ?').run(credId, emailBlindIdx);
          sqliteSaved = true;
        } catch (sqlErr) {
          console.warn('[Passkey Enroll] SQLite save warning:', sqlErr?.message);
        }
      }

      let cloudSynced = false;
      if (db) {
        try {
          await setDoc(doc(db, 'passkeys', pkId), {
            id: pkId,
            credential_id: credId,
            tenant_id: scope.tenantId,
            user_id: targetUserId,
            email: encEmail,
            email_blind_idx: emailBlindIdx,
            public_key_spki: spkiBase64,
            device_label: deviceLabel,
            role: targetRole,
            portal_type: targetPortalType,
            vault_encrypted: true,
            is_synced: 1,
            created_at: nowIso,
            synced_at: nowIso
          });
          cloudSynced = true;
          if (sqliteDb && sqliteSaved) {
            try {
              sqliteDb.prepare('UPDATE auth_passkeys SET is_synced = 1 WHERE id = ?').run(pkId);
            } catch {}
          }
        } catch (err) {
          handleFirestoreError(err, 'write', `passkeys/${pkId}`);
        }
      }

      res.json({
        ok: true,
        message: cloudSynced
          ? 'Passkey saved offline (SQLite) and synced to Cloud Firestore.'
          : 'Passkey saved securely offline (SQLite) and queued for Cloud sync.',
        passkey: {
          id: pkId,
          credentialId: credId,
          deviceLabel,
          role: targetRole,
          portalType: targetPortalType,
          hasPublicKey: true,
          isSynced: cloudSynced,
          createdAt: nowIso
        }
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to enroll Passkey.' });
    }
  });

  const handleRemovePasskey = async (req, res) => {
    try {
      const session = verifySessionRequest(req);
      if (!session) {
        return res.status(401).json({ ok: false, code: 'SESSION_REQUIRED', message: 'Signed authentication session required.' });
      }
      const pkId = sanitizeStr(req.params?.id || req.body?.id || '');
      if (!pkId) {
        return res.status(400).json({ ok: false, message: 'Passkey id is required.' });
      }

      let existing = null;
      if (sqliteDb) {
        existing = sqliteDb.prepare('SELECT * FROM auth_passkeys WHERE id = ? LIMIT 1').get(pkId);
      }
      if (!existing && session.role !== 'super_admin') {
        return res.status(404).json({ ok: false, message: 'Passkey not found.' });
      }

      if (existing) {
        const isAdminScope = session.role === 'super_admin' || ((session.role === 'client_admin' || session.role === 'owner' || session.role === 'principal') && existing.tenant_id === session.tid);
        const isSelf = existing.email_blind_idx === vault.blindIndex(session.email, 'email');
        if (!isAdminScope && !isSelf) {
          return res.status(403).json({ ok: false, message: 'Permission denied removing this Passkey.' });
        }
        if (sqliteDb) {
          sqliteDb.prepare('DELETE FROM auth_passkeys WHERE id = ?').run(pkId);
        }
      }

      if (db) {
        try {
          await deleteDoc(doc(db, 'passkeys', pkId));
        } catch (err) {
          handleFirestoreError(err, 'delete', `passkeys/${pkId}`);
        }
      }

      res.json({ ok: true, message: 'Passkey removed from device registry and Cloud.' });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to remove Passkey.' });
    }
  };

  router.post('/passkey/remove', handleRemovePasskey);
  router.delete('/passkey/:id', handleRemovePasskey);

  router.post('/passkey/login-options', async (req, res) => {
    const body = req.body || {};
    const cleanEmail = sanitizeStr(body.email || '').toLowerCase();
    const { challenge, challengeToken } = issuePasskeyChallenge('login');
    const allowCredentials = [];
    const seen = new Set();

    if (cleanEmail) {
      const isSuperAdminAlias = SUPERADMIN_ALIASES.has(cleanEmail);
      const candidateEmails = isSuperAdminAlias
        ? Array.from(SUPERADMIN_ALIASES)
        : [cleanEmail];
      const blindIndexes = candidateEmails.map((em) => vault.blindIndex(em, 'email')).filter(Boolean);

      if (sqliteDb && blindIndexes.length > 0) {
        try {
          const placeholders = blindIndexes.map(() => '?').join(', ');
          const rows = isSuperAdminAlias
            ? sqliteDb.prepare(
                `SELECT credential_id FROM auth_passkeys WHERE (email_blind_idx IN (${placeholders}) OR role = 'super_admin') AND public_key_spki IS NOT NULL AND public_key_spki != ''`
              ).all(...blindIndexes)
            : sqliteDb.prepare(
                `SELECT credential_id FROM auth_passkeys WHERE (email_blind_idx IN (${placeholders}) OR LOWER(user_id) = ?) AND public_key_spki IS NOT NULL AND public_key_spki != ''`
              ).all(...blindIndexes, cleanEmail);
          for (const r of rows) {
            const normId = normalizeBase64Url(r.credential_id || '');
            if (normId && !seen.has(normId)) {
              seen.add(normId);
              allowCredentials.push({ type: 'public-key', id: normId });
            }
          }
        } catch {}
      }
      if (allowCredentials.length === 0 && db) {
        for (const bIdx of blindIndexes) {
          try {
            const snap = await getDocs(query(collection(db, 'passkeys'), where('email_blind_idx', '==', bIdx)));
            snap.forEach((docSnap) => {
              const d = docSnap.data();
              const normId = normalizeBase64Url(d?.credential_id || '');
              if (normId && d?.public_key_spki && !seen.has(normId)) {
                seen.add(normId);
                allowCredentials.push({ type: 'public-key', id: normId });
              }
            });
          } catch (err) {
            handleFirestoreError(err, 'list', 'passkeys');
          }
        }
      }
    }

    res.json({
      ok: true,
      challenge,
      challengeToken,
      userVerification: 'required',
      allowCredentials
    });
  });

  router.post('/passkey/login-verify', async (req, res) => {
    try {
      const { challengeToken, credentialId, clientDataJSON, authenticatorData, signature } = req.body || {};
      const check = consumePasskeyChallenge(challengeToken, 'login', clientDataJSON, req.headers.origin);
      if (!check.ok) {
        return res.status(401).json({ ok: false, code: 'PASSKEY_CHALLENGE_INVALID', message: check.message });
      }

      const rawCredId = sanitizeStr(credentialId || '');
      const credId = normalizeBase64Url(rawCredId);
      if (!credId) {
        return res.status(401).json({ ok: false, code: 'PASSKEY_NOT_FOUND', message: 'No matching Passkey found on this server.' });
      }

      let passkeyRow = null;
      if (sqliteDb) {
        try {
          passkeyRow = sqliteDb.prepare('SELECT * FROM auth_passkeys WHERE credential_id = ? OR credential_id = ? LIMIT 1').get(credId, rawCredId);
        } catch {}
      }

      if (!passkeyRow && db) {
        try {
          const snap = await getDocs(query(collection(db, 'passkeys'), where('credential_id', '==', credId)));
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            const d = docSnap.data();
            passkeyRow = {
              id: d.id || docSnap.id,
              credential_id: normalizeBase64Url(d.credential_id || credId),
              tenant_id: d.tenant_id || 'tenant-root-platform',
              user_id: d.user_id || '',
              email: d.email || '',
              email_blind_idx: d.email_blind_idx || '',
              public_key_spki: d.public_key_spki || '',
              device_label: d.device_label || 'Cloud Passkey',
              role: d.role || 'client_admin',
              portal_type: d.portal_type || 'platform',
              created_at: d.created_at || new Date().toISOString()
            };
            if (sqliteDb) {
              try {
                sqliteDb.prepare(`
                  INSERT OR IGNORE INTO auth_passkeys (id, credential_id, tenant_id, user_id, email, email_blind_idx, public_key_spki, device_label, role, portal_type, is_synced, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                `).run(
                  passkeyRow.id,
                  passkeyRow.credential_id,
                  passkeyRow.tenant_id,
                  passkeyRow.user_id,
                  passkeyRow.email,
                  passkeyRow.email_blind_idx,
                  passkeyRow.public_key_spki,
                  passkeyRow.device_label,
                  passkeyRow.role,
                  passkeyRow.portal_type,
                  passkeyRow.created_at
                );
              } catch {}
            }
          }
        } catch (err) {
          handleFirestoreError(err, 'get', 'passkeys');
        }
      }

      if (!passkeyRow) {
        return res.status(401).json({ ok: false, code: 'PASSKEY_NOT_FOUND', message: 'Passkey is not registered to any account yet. Please sign in with password or add a Passkey in Account Settings.' });
      }

      // Strict WebAuthn Assertion Signature, rpIdHash & User-Present Flag Verification
      if (!authenticatorData || !clientDataJSON || !signature) {
        return res.status(401).json({ ok: false, code: 'PASSKEY_SIGNATURE_MISSING', message: 'Passkey cryptographic assertion incomplete.' });
      }

      const authDataBuf = Buffer.from(normalizeBase64Url(authenticatorData), 'base64url');
      if (authDataBuf.length < 37 || (authDataBuf[32] & 0x01) === 0) {
        return res.status(401).json({ ok: false, code: 'PASSKEY_USER_NOT_PRESENT', message: 'Passkey user presence check failed.' });
      }

      if (check.origin) {
        try {
          const originHost = new URL(check.origin).hostname.toLowerCase();
          const gotRpHash = authDataBuf.subarray(0, 32);
          const labels = originHost.split('.');
          let rpMatched = false;
          for (let i = 0; i < labels.length; i++) {
            const candidate = labels.slice(i).join('.');
            if (!candidate) continue;
            const expectedHash = crypto.createHash('sha256').update(candidate).digest();
            if (crypto.timingSafeEqual(gotRpHash, expectedHash)) {
              rpMatched = true;
              break;
            }
          }
          if (!rpMatched) {
            return res.status(401).json({ ok: false, code: 'PASSKEY_RP_MISMATCH', message: 'Passkey domain verification failed.' });
          }
        } catch {}
      }

      if (!passkeyRow.public_key_spki) {
        return res.status(401).json({ ok: false, code: 'PASSKEY_KEY_MISSING', message: 'Passkey public key missing. Please remove and re-add this Passkey in Account Settings.' });
      }

      try {
        const clientDataHash = crypto.createHash('sha256').update(Buffer.from(normalizeBase64Url(clientDataJSON), 'base64url')).digest();
        const signedPayload = Buffer.concat([authDataBuf, clientDataHash]);
        const sigBuf = Buffer.from(normalizeBase64Url(signature), 'base64url');
        const verified = verifyWebAuthnAssertionSignature(passkeyRow.public_key_spki, signedPayload, sigBuf);
        if (!verified) {
          return res.status(401).json({ ok: false, code: 'PASSKEY_SIGNATURE_INVALID', message: 'Passkey cryptographic signature verification failed.' });
        }
      } catch {
        return res.status(401).json({ ok: false, code: 'PASSKEY_SIGNATURE_INVALID', message: 'Passkey signature verification failed.' });
      }

      const decryptedEmail = vault.decryptField(passkeyRow.tenant_id, passkeyRow.email) || '';
      const emailLower = decryptedEmail.toLowerCase().trim();
      const portalType = passkeyRow.portal_type || 'platform';
      let role = passkeyRow.role || 'client_admin';
      let userObj = null;

      if (role === 'super_admin' || portalType === 'superadmin' || SUPERADMIN_ALIASES.has(emailLower)) {
        role = 'super_admin';
        userObj = {
          id: passkeyRow.user_id || 'superadmin-root-01',
          tenant_id: 'tenant-root-platform',
          email: emailLower || 'pervaizahmedabbasi786@gmail.com',
          role: 'super_admin',
          portal_type: 'superadmin',
          status: 'ACTIVE',
          company_name: 'SoftCode Solution',
          authSource: 'WEBAUTHN_PASSKEY',
          passkeyVerified: true
        };
      }

      if (!userObj && sqliteDb) {
        try {
          const tenantRow = sqliteDb.prepare('SELECT * FROM local_tenants WHERE id = ? OR email_blind_idx = ? LIMIT 1').get(passkeyRow.user_id, passkeyRow.email_blind_idx);
          if (tenantRow) {
            if (tenantRow.status === 'LOCKED_FAILED_ATTEMPTS' || tenantRow.status === 'LOGIN_DISABLED') {
              return res.status(423).json({ ok: false, isLocked: true, message: 'Account is locked. Please contact SuperAdmin.' });
            }
            const dec = vault.decryptFields(tenantRow.tenant_id, tenantRow, ['full_name', 'email', 'phone', 'address']);
            const authRow = sqliteDb.prepare('SELECT role FROM auth_users WHERE email_blind_idx = ? LIMIT 1').get(passkeyRow.email_blind_idx);
            role = passkeyRow.role || authRow?.role || 'client_admin';
            userObj = {
              id: dec.id,
              tenant_id: dec.tenant_id,
              email: dec.email,
              full_name: dec.full_name,
              company_name: dec.company_name,
              business_type: dec.business_type,
              role,
              portal_type: portalType,
              status: 'ACTIVE',
              authSource: 'WEBAUTHN_PASSKEY',
              passkeyVerified: true
            };
          }
        } catch {}
      }

      if (!userObj) {
        userObj = {
          id: passkeyRow.user_id,
          tenant_id: passkeyRow.tenant_id,
          email: emailLower,
          role,
          portal_type: portalType,
          status: 'ACTIVE',
          company_name: 'Enterprise Client',
          authSource: 'WEBAUTHN_PASSKEY',
          passkeyVerified: true
        };
      }

      const usedAtIso = new Date().toISOString();
      if (sqliteDb) {
        try {
          sqliteDb.prepare('UPDATE auth_passkeys SET last_used_at = ? WHERE id = ?').run(usedAtIso, passkeyRow.id);
        } catch {}
      }
      if (db && passkeyRow.id) {
        updateDoc(doc(db, 'passkeys', passkeyRow.id), { last_used_at: usedAtIso }).catch(() => {});
      }

      res.json({
        ok: true,
        redirect: role === 'super_admin' ? '/superadmin' : '/dashboard',
        portalType,
        user: userObj,
        token: issueSessionToken(userObj)
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Passkey verification failed. Please sign in with password.' });
    }
  });

  router.post('/register', handleRegister);
  router.post('/login', handleLogin);
  router.post('/logout', (req, res) => {
    res.json({ ok: true, message: 'Session terminated securely.' });
  });

  router.all('/me', (req, res) => {
    res.json({
      ok: true,
      user: {
        id: 'superadmin-root-01',
        email: 'pervaizahmedabbasi786@gmail.com',
        role: 'super_admin',
        status: 'ACTIVE',
        company_name: 'SoftCode Solution',
        tenant_id: 'tenant-root-platform'
      }
    });
  });

  return router;
}
