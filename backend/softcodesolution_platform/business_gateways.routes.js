import express from 'express';
import crypto from 'crypto';
import { collection, doc, setDoc } from 'firebase/firestore';
import { getCryptoVault } from '../auth_security/crypto_vault.js';

const SUPPORTED_BUSINESSES = new Map([
  ['coaching_academy', 'Coaching & Training Center'],
  ['gym_fitness', 'Gym & Fitness Center'],
  ['hospital_clinic', 'Clinic & Healthcare Center'],
  ['real_estate', 'Property & Real Estate'],
  ['retail_pos', 'Retail & POS Storefront'],
  ['pharmacy_store', 'Pharmacy & Medical Store'],
  ['restaurant_cafe', 'Restaurant & Cafe'],
  ['bakery_confectionery', 'Bakery & Confectionery']
]);

function normalizeBusinessKey(raw) {
  const clean = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (clean === 'coaching_center') return 'coaching_academy';
  if (clean === 'clinic') return 'hospital_clinic';
  if (clean === 'property_management' || clean === 'realty') return 'real_estate';
  return clean || 'coaching_academy';
}

function getDefaultGatewaysForBusiness(businessKey) {
  const titleLabel = SUPPORTED_BUSINESSES.get(businessKey) || 'SoftCode Enterprise';
  const bTag = businessKey.toUpperCase().slice(0, 4);
  return [
    {
      providerKey: 'raast',
      displayName: 'Raast Instant IBFT (SBP 0 Fee)',
      category: 'instant_raast',
      accountTitle: `${titleLabel} Main Collection`,
      accountNumber: '03001122334',
      iban: 'PK36MEZN0002810104982112',
      raastId: '03001122334',
      bankName: 'State Bank Raast Rail',
      branchCode: '0281',
      tillId: `RST-${bTag}-01`,
      billerCode: '',
      merchantId: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Transfer via any Pakistani Banking App -> Raast P2P/IBAN (0 PKR fee) & upload screenshot.',
      isEnabled: true,
      isDefault: true,
      sortOrder: 1
    },
    {
      providerKey: 'jazzcash',
      displayName: 'JazzCash Merchant / Till',
      category: 'mobile_wallet',
      accountTitle: `${titleLabel} JazzCash`,
      accountNumber: '03018877665',
      iban: '',
      raastId: '03018877665',
      bankName: 'Mobilink Microfinance Bank',
      branchCode: '',
      tillId: `JC-${bTag}-992`,
      billerCode: '',
      merchantId: `MC-${bTag}01`,
      feeType: 'percent',
      feeValue: 1.0,
      verificationMode: 'slip_review',
      instructions: 'Send payment via JazzCash App / *786# Till ID & enter TID reference.',
      isEnabled: true,
      isDefault: false,
      sortOrder: 2
    },
    {
      providerKey: 'easypaisa',
      displayName: 'Easypaisa Merchant / Telenor',
      category: 'mobile_wallet',
      accountTitle: `${titleLabel} Easypaisa`,
      accountNumber: '03455566778',
      iban: '',
      raastId: '03455566778',
      bankName: 'Easypaisa Bank Limited',
      branchCode: '',
      tillId: `EP-${bTag}-441`,
      billerCode: '',
      merchantId: `EP-${bTag}02`,
      feeType: 'percent',
      feeValue: 1.0,
      verificationMode: 'slip_review',
      instructions: 'Pay via Easypaisa App -> Mini Apps / QR Till ID & attach confirmation slip.',
      isEnabled: true,
      isDefault: false,
      sortOrder: 3
    },
    {
      providerKey: 'onebill',
      displayName: '1Link / 1Bill / KuickPay Voucher',
      category: 'onebill_voucher',
      accountTitle: `${titleLabel} 1Bill Biller`,
      accountNumber: '10099887766',
      iban: '',
      raastId: '',
      bankName: '1LINK Guarantee Pakistan',
      branchCode: '',
      tillId: '',
      billerCode: '100294',
      merchantId: `1B-${bTag}`,
      feeType: 'fixed',
      feeValue: 35,
      verificationMode: 'auto_reference',
      instructions: 'Pay via any ATM or Mobile Banking -> Bill Payment -> 1Bill Invoice using voucher #.',
      isEnabled: true,
      isDefault: false,
      sortOrder: 4
    },
    {
      providerKey: 'meezan_bank',
      displayName: 'Meezan Bank Islamic IBAN',
      category: 'bank_transfer',
      accountTitle: `${titleLabel} Collection A/C`,
      accountNumber: '02810104982112',
      iban: 'PK36MEZN0002810104982112',
      raastId: '',
      bankName: 'Meezan Bank Limited',
      branchCode: '0281',
      tillId: '',
      billerCode: '',
      merchantId: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Deposit cash/cheque at any Meezan Bank branch or IBFT and upload deposit slip.',
      isEnabled: true,
      isDefault: false,
      sortOrder: 5
    },
    {
      providerKey: 'hbl_konnect',
      displayName: 'HBL Konnect / Counter Slip',
      category: 'bank_transfer',
      accountTitle: `${titleLabel} HBL A/C`,
      accountNumber: '00427991044201',
      iban: 'PK88HABB0000427991044201',
      raastId: '',
      bankName: 'Habib Bank Limited (HBL)',
      branchCode: '0042',
      tillId: `HBL-${bTag}`,
      billerCode: '',
      merchantId: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Deposit via HBL Mobile / Konnect Agent and enter 12-digit transaction reference.',
      isEnabled: true,
      isDefault: false,
      sortOrder: 6
    }
  ];
}

function getDefaultSettings(businessKey) {
  return {
    businessKey,
    requireProofReference: true,
    autoVerifyDigitalSlips: false,
    allowClientSelfPay: true,
    defaultCurrency: 'PKR',
    receiptFooterNote: `Verified by ${SUPPORTED_BUSINESSES.get(businessKey) || 'SoftCode Enterprise'} Pakistan Gateway`
  };
}

export function createBusinessGatewaysRouter(sqliteDb, db) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);

  const enc = (tid, val) => vault.encryptField(tid, String(val || ''));
  const dec = (tid, val) => vault.decryptField(tid, String(val || ''));

  const resolveTenantId = (req) =>
    String(req?.headers?.['x-tenant-id'] || req?.query?.tenantId || req?.body?.tenantId || 'tenant-root-platform').trim() ||
    'tenant-root-platform';

  const resolveRole = (req) =>
    String(req?.headers?.['x-user-role'] || req?.query?.role || req?.body?.userRole || 'owner').trim().toLowerCase();

  const OWNER_ROLES = new Set(['owner', 'admin', 'superadmin', 'client_admin', 'manager', 'accountant', 'cashier']);

  const requireManageRole = (req, res, next) => {
    const r = resolveRole(req);
    if (!OWNER_ROLES.has(r)) {
      return res.status(403).json({
        ok: false,
        error: 'ROLE_FORBIDDEN',
        message: 'Gateway management requires Owner, Manager, Accountant, or Cashier role.'
      });
    }
    next();
  };

  const validateProofScreenshot = (raw) => {
    const clean = String(raw || '').trim();
    if (!clean) return { ok: true, value: '' };
    if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$/i.test(clean)) {
      return { ok: false, message: 'Payment slip screenshot must be a valid PNG, JPG, WEBP, or GIF image.' };
    }
    const normalized = clean.replace(/[\r\n]/g, '');
    if (normalized.length > 650000) {
      return { ok: false, message: 'Payment slip screenshot is too large (max ~480KB compressed).' };
    }
    return { ok: true, value: normalized };
  };

  const ensureSeeded = (tid, businessKey) => {
    if (!sqliteDb) return;
    try {
      const cnt = Number(
        sqliteDb
          .prepare('SELECT COUNT(*) AS cnt FROM local_business_payment_gateways WHERE tenant_id = ? AND business_key = ?')
          .get(tid, businessKey)?.cnt || 0
      );
      const now = new Date().toISOString();
      if (cnt === 0) {
        const defaults = getDefaultGatewaysForBusiness(businessKey);
        const stmt = sqliteDb.prepare(`
          INSERT OR IGNORE INTO local_business_payment_gateways (
            id, tenant_id, business_key, provider_key, display_name, category,
            account_title, account_number, iban, raast_id, bank_name, branch_code,
            till_id, biller_code, merchant_id, merchant_secret_enc, integrity_salt_enc,
            fee_type, fee_value, verification_mode, instructions,
            is_enabled, is_default, sort_order, is_synced, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        `);
        for (const gw of defaults) {
          const gwId = `bgw-${businessKey}-${gw.providerKey}-${crypto.createHash('md5').update(tid).digest('hex').slice(0, 6)}`;
          stmt.run(
            gwId,
            tid,
            businessKey,
            gw.providerKey,
            gw.displayName,
            gw.category,
            gw.accountTitle,
            gw.accountNumber,
            gw.iban,
            gw.raastId,
            gw.bankName,
            gw.branchCode,
            gw.tillId,
            gw.billerCode,
            gw.merchantId,
            gw.feeType,
            Number(gw.feeValue || 0),
            gw.verificationMode,
            gw.instructions,
            gw.isEnabled ? 1 : 0,
            gw.isDefault ? 1 : 0,
            Number(gw.sortOrder || 10),
            now,
            now
          );
        }
      }
      const settingsId = `bset-${businessKey}-${crypto.createHash('md5').update(tid).digest('hex').slice(0, 8)}`;
      sqliteDb
        .prepare(
          `INSERT OR IGNORE INTO local_business_gateway_settings (id, tenant_id, business_key, settings_json, is_synced, updated_at)
           VALUES (?, ?, ?, ?, 0, ?)`
        )
        .run(settingsId, tid, businessKey, JSON.stringify(getDefaultSettings(businessKey)), now);
    } catch {}
  };

  const loadSettings = (tid, businessKey) => {
    const def = getDefaultSettings(businessKey);
    if (!sqliteDb) return def;
    try {
      ensureSeeded(tid, businessKey);
      const row = sqliteDb
        .prepare('SELECT settings_json FROM local_business_gateway_settings WHERE tenant_id = ? AND business_key = ?')
        .get(tid, businessKey);
      if (row && row.settings_json) {
        return { ...def, ...JSON.parse(row.settings_json) };
      }
    } catch {}
    return def;
  };

  const mapGatewayRow = (r, tid) => {
    const rawSecret = r.merchant_secret_enc ? dec(tid, r.merchant_secret_enc) : '';
    const rawSalt = r.integrity_salt_enc ? dec(tid, r.integrity_salt_enc) : '';
    const maskTail = (s) => (s && s.length > 4 ? `••••${s.slice(-4)}` : s ? '••••' : '');
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      businessKey: r.business_key,
      providerKey: r.provider_key,
      displayName: r.display_name,
      category: r.category,
      accountTitle: r.account_title || '',
      accountNumber: r.account_number || '',
      iban: r.iban || '',
      raastId: r.raast_id || '',
      bankName: r.bank_name || '',
      branchCode: r.branch_code || '',
      tillId: r.till_id || '',
      billerCode: r.biller_code || '',
      merchantId: r.merchant_id || '',
      hasMerchantSecret: Boolean(rawSecret),
      hasIntegritySalt: Boolean(rawSalt),
      merchantSecretHint: maskTail(rawSecret),
      integritySaltHint: maskTail(rawSalt),
      feeType: r.fee_type || 'none',
      feeValue: Number(r.fee_value || 0),
      verificationMode: r.verification_mode || 'slip_review',
      instructions: r.instructions || '',
      isEnabled: r.is_enabled === 1,
      isDefault: r.is_default === 1,
      sortOrder: Number(r.sort_order || 10),
      updatedAt: r.updated_at || r.created_at
    };
  };

  const mapTxnRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    businessKey: r.business_key,
    txnRef: r.txn_ref,
    invoiceNo: r.invoice_no,
    gatewayId: r.gateway_id,
    gatewayName: r.gateway_name,
    providerKey: r.provider_key,
    payerName: dec(tid, r.payer_name),
    payerRef: dec(tid, r.payer_ref),
    payerPhone: dec(tid, r.payer_phone),
    baseAmount: Number(r.base_amount || 0),
    gatewayFee: Number(r.gateway_fee || 0),
    totalAmount: Number(r.total_amount || 0),
    currency: r.currency || 'PKR',
    status: r.status || 'PENDING_VERIFICATION',
    proofReference: r.proof_reference || '',
    proofNotes: r.proof_notes || '',
    proofScreenshot: r.proof_screenshot || '',
    hasProofScreenshot: Boolean(r.proof_screenshot),
    verifiedBy: r.verified_by || '',
    verifiedAt: r.verified_at || '',
    createdAt: r.created_at
  });

  // GET gateways + settings for a business vertical
  router.get('/:businessKey/gateways', (req, res) => {
    const tid = resolveTenantId(req);
    const businessKey = normalizeBusinessKey(req.params.businessKey);
    const includeDisabled = String(req.query?.includeDisabled || '') === '1';

    ensureSeeded(tid, businessKey);
    const settings = loadSettings(tid, businessKey);

    let gateways = [];
    if (sqliteDb) {
      const rows = sqliteDb
        .prepare('SELECT * FROM local_business_payment_gateways WHERE tenant_id = ? AND business_key = ? ORDER BY sort_order ASC, created_at ASC')
        .all(tid, businessKey);
      gateways = rows.filter((r) => includeDisabled || r.is_enabled === 1).map((r) => mapGatewayRow(r, tid));
    } else {
      gateways = getDefaultGatewaysForBusiness(businessKey).map((g, idx) => ({
        id: `bgw-mem-${businessKey}-${idx}`,
        tenantId: tid,
        businessKey,
        ...g,
        hasMerchantSecret: false,
        hasIntegritySalt: false,
        merchantSecretHint: '',
        integritySaltHint: ''
      }));
    }

    res.json({ ok: true, tenantId: tid, businessKey, gateways, settings });
  });

  // POST create custom/new gateway
  router.post('/:businessKey/gateways', requireManageRole, (req, res) => {
    const tid = resolveTenantId(req);
    const businessKey = normalizeBusinessKey(req.params.businessKey);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    ensureSeeded(tid, businessKey);

    const b = req.body || {};
    const displayName = String(b.displayName || '').trim();
    if (!displayName) return res.status(400).json({ ok: false, message: 'Gateway displayName is required.' });
    const rawKey = String(b.providerKey || displayName).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const providerKey = rawKey ? `${rawKey}_${Date.now().toString(36).slice(-3)}` : `custom_${Date.now().toString(36)}`;
    const feeType = ['none', 'percent', 'fixed'].includes(String(b.feeType || 'none')) ? String(b.feeType || 'none') : 'none';
    const feeValue = Math.max(0, Number(b.feeValue || 0));
    const gwId = `bgw-${businessKey}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    if (b.isDefault) {
      sqliteDb
        .prepare('UPDATE local_business_payment_gateways SET is_default = 0 WHERE tenant_id = ? AND business_key = ?')
        .run(tid, businessKey);
    }

    sqliteDb
      .prepare(`
        INSERT INTO local_business_payment_gateways (
          id, tenant_id, business_key, provider_key, display_name, category,
          account_title, account_number, iban, raast_id, bank_name, branch_code,
          till_id, biller_code, merchant_id, merchant_secret_enc, integrity_salt_enc,
          fee_type, fee_value, verification_mode, instructions,
          is_enabled, is_default, sort_order, is_synced, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `)
      .run(
        gwId,
        tid,
        businessKey,
        providerKey,
        displayName,
        String(b.category || 'bank_transfer'),
        String(b.accountTitle || ''),
        String(b.accountNumber || ''),
        String(b.iban || ''),
        String(b.raastId || ''),
        String(b.bankName || ''),
        String(b.branchCode || ''),
        String(b.tillId || ''),
        String(b.billerCode || ''),
        String(b.merchantId || ''),
        b.merchantSecret ? enc(tid, b.merchantSecret) : '',
        b.integritySalt ? enc(tid, b.integritySalt) : '',
        feeType,
        feeValue,
        String(b.verificationMode || 'slip_review'),
        String(b.instructions || ''),
        b.isEnabled === false ? 0 : 1,
        b.isDefault ? 1 : 0,
        Number(b.sortOrder || 20),
        now,
        now
      );

    const row = sqliteDb.prepare('SELECT * FROM local_business_payment_gateways WHERE id = ?').get(gwId);
    res.json({ ok: true, gateway: mapGatewayRow(row, tid) });
  });

  // PUT update existing gateway
  router.put('/:businessKey/gateways/:id', requireManageRole, (req, res) => {
    const tid = resolveTenantId(req);
    const businessKey = normalizeBusinessKey(req.params.businessKey);
    const gwId = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    const existing = sqliteDb
      .prepare('SELECT * FROM local_business_payment_gateways WHERE id = ? AND tenant_id = ? AND business_key = ?')
      .get(gwId, tid, businessKey);
    if (!existing) return res.status(404).json({ ok: false, message: 'Gateway not found.' });

    const b = req.body || {};
    const now = new Date().toISOString();
    if (b.isDefault) {
      sqliteDb
        .prepare('UPDATE local_business_payment_gateways SET is_default = 0 WHERE tenant_id = ? AND business_key = ?')
        .run(tid, businessKey);
    }

    const secretEnc = b.merchantSecret ? enc(tid, b.merchantSecret) : existing.merchant_secret_enc;
    const saltEnc = b.integritySalt ? enc(tid, b.integritySalt) : existing.integrity_salt_enc;
    const feeType = ['none', 'percent', 'fixed'].includes(String(b.feeType ?? existing.fee_type))
      ? String(b.feeType ?? existing.fee_type)
      : 'none';
    const feeValue = Math.max(0, Number(b.feeValue ?? existing.fee_value ?? 0));

    sqliteDb
      .prepare(`
        UPDATE local_business_payment_gateways
        SET display_name = ?, category = ?, account_title = ?, account_number = ?, iban = ?,
            raast_id = ?, bank_name = ?, branch_code = ?, till_id = ?, biller_code = ?,
            merchant_id = ?, merchant_secret_enc = ?, integrity_salt_enc = ?,
            fee_type = ?, fee_value = ?, verification_mode = ?, instructions = ?,
            is_enabled = ?, is_default = ?, is_synced = 0, updated_at = ?
        WHERE id = ? AND tenant_id = ? AND business_key = ?
      `)
      .run(
        String(b.displayName ?? existing.display_name),
        String(b.category ?? existing.category),
        String(b.accountTitle ?? existing.account_title ?? ''),
        String(b.accountNumber ?? existing.account_number ?? ''),
        String(b.iban ?? existing.iban ?? ''),
        String(b.raastId ?? existing.raast_id ?? ''),
        String(b.bankName ?? existing.bank_name ?? ''),
        String(b.branchCode ?? existing.branch_code ?? ''),
        String(b.tillId ?? existing.till_id ?? ''),
        String(b.billerCode ?? existing.biller_code ?? ''),
        String(b.merchantId ?? existing.merchant_id ?? ''),
        secretEnc,
        saltEnc,
        feeType,
        feeValue,
        String(b.verificationMode ?? existing.verification_mode ?? 'slip_review'),
        String(b.instructions ?? existing.instructions ?? ''),
        b.isEnabled === undefined ? existing.is_enabled : b.isEnabled ? 1 : 0,
        b.isDefault === undefined ? existing.is_default : b.isDefault ? 1 : 0,
        now,
        gwId,
        tid,
        businessKey
      );

    const updated = sqliteDb.prepare('SELECT * FROM local_business_payment_gateways WHERE id = ?').get(gwId);
    res.json({ ok: true, gateway: mapGatewayRow(updated, tid) });
  });

  // DELETE custom gateway
  router.delete('/:businessKey/gateways/:id', requireManageRole, (req, res) => {
    const tid = resolveTenantId(req);
    const businessKey = normalizeBusinessKey(req.params.businessKey);
    const gwId = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    const r = sqliteDb
      .prepare('DELETE FROM local_business_payment_gateways WHERE id = ? AND tenant_id = ? AND business_key = ?')
      .run(gwId, tid, businessKey);
    if (r.changes === 0) return res.status(404).json({ ok: false, message: 'Gateway not found.' });
    res.json({ ok: true, deletedId: gwId });
  });

  // PUT save business gateway policy settings
  router.put('/:businessKey/settings', requireManageRole, (req, res) => {
    const tid = resolveTenantId(req);
    const businessKey = normalizeBusinessKey(req.params.businessKey);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    ensureSeeded(tid, businessKey);

    const current = loadSettings(tid, businessKey);
    const b = req.body || {};
    const next = {
      ...current,
      requireProofReference: b.requireProofReference !== undefined ? Boolean(b.requireProofReference) : current.requireProofReference,
      autoVerifyDigitalSlips: b.autoVerifyDigitalSlips !== undefined ? Boolean(b.autoVerifyDigitalSlips) : current.autoVerifyDigitalSlips,
      allowClientSelfPay: b.allowClientSelfPay !== undefined ? Boolean(b.allowClientSelfPay) : current.allowClientSelfPay,
      defaultCurrency: b.defaultCurrency ? String(b.defaultCurrency) : current.defaultCurrency,
      receiptFooterNote: b.receiptFooterNote !== undefined ? String(b.receiptFooterNote) : current.receiptFooterNote
    };

    const settingsId = `bset-${businessKey}-${crypto.createHash('md5').update(tid).digest('hex').slice(0, 8)}`;
    sqliteDb
      .prepare(`
        INSERT INTO local_business_gateway_settings (id, tenant_id, business_key, settings_json, is_synced, updated_at)
        VALUES (?, ?, ?, ?, 0, ?)
        ON CONFLICT(tenant_id, business_key) DO UPDATE SET settings_json = excluded.settings_json, is_synced = 0, updated_at = excluded.updated_at
      `)
      .run(settingsId, tid, businessKey, JSON.stringify(next), new Date().toISOString());

    res.json({ ok: true, settings: next });
  });

  // GET transactions ledger for a business
  router.get('/:businessKey/transactions', (req, res) => {
    const tid = resolveTenantId(req);
    const businessKey = normalizeBusinessKey(req.params.businessKey);
    const limit = Math.min(200, Math.max(10, Number(req.query?.limit || 80)));

    if (!sqliteDb) return res.json({ ok: true, transactions: [] });
    const rows = sqliteDb
      .prepare('SELECT * FROM local_business_payment_transactions WHERE tenant_id = ? AND business_key = ? ORDER BY created_at DESC LIMIT ?')
      .all(tid, businessKey, limit);
    const transactions = rows.map((r) => mapTxnRow(r, tid));
    res.json({ ok: true, tenantId: tid, businessKey, transactions });
  });

  // POST submit a payment & optional slip screenshot (409 duplicate invoice guard)
  router.post('/:businessKey/transactions', async (req, res) => {
    const tid = resolveTenantId(req);
    const businessKey = normalizeBusinessKey(req.params.businessKey);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    ensureSeeded(tid, businessKey);

    const settings = loadSettings(tid, businessKey);
    const b = req.body || {};
    const gatewayId = String(b.gatewayId || '').trim();
    const gwRow = gatewayId
      ? sqliteDb
          .prepare('SELECT * FROM local_business_payment_gateways WHERE id = ? AND tenant_id = ? AND business_key = ?')
          .get(gatewayId, tid, businessKey)
      : sqliteDb
          .prepare('SELECT * FROM local_business_payment_gateways WHERE tenant_id = ? AND business_key = ? AND is_enabled = 1 ORDER BY is_default DESC, sort_order ASC LIMIT 1')
          .get(tid, businessKey);

    if (!gwRow) return res.status(404).json({ ok: false, message: 'Selected gateway not found.' });
    if (gwRow.is_enabled === 0) return res.status(400).json({ ok: false, message: `${gwRow.display_name} is currently disabled.` });

    const payerName = String(b.payerName || '').trim();
    const baseAmount = Number(b.baseAmount ?? b.amount ?? 0);
    if (!payerName || !Number.isFinite(baseAmount) || baseAmount <= 0) {
      return res.status(400).json({ ok: false, message: 'Valid payerName and positive baseAmount are required.' });
    }

    const proofReference = String(b.proofReference || '').trim();
    if (settings.requireProofReference && gwRow.verification_mode === 'slip_review' && !proofReference && !b.markVerified) {
      return res.status(400).json({ ok: false, message: 'Slip / TID Reference is required by gateway policy.' });
    }

    const screenshotCheck = validateProofScreenshot(b.proofScreenshot);
    if (!screenshotCheck.ok) {
      return res.status(400).json({ ok: false, message: screenshotCheck.message });
    }

    const invoiceNo = String(b.invoiceNo || `INV-${businessKey.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`).trim();
    if (!b.allowDuplicate) {
      const paidExisting = sqliteDb
        .prepare("SELECT id, txn_ref FROM local_business_payment_transactions WHERE tenant_id = ? AND business_key = ? AND invoice_no = ? AND UPPER(status) IN ('VERIFIED', 'SETTLED') LIMIT 1")
        .get(tid, businessKey, invoiceNo);
      if (paidExisting) {
        return res.status(409).json({
          ok: false,
          error: 'INVOICE_ALREADY_PAID',
          message: `Invoice #${invoiceNo} is already verified & settled (${paidExisting.txn_ref}).`
        });
      }
      const pendingExisting = sqliteDb
        .prepare("SELECT id, txn_ref FROM local_business_payment_transactions WHERE tenant_id = ? AND business_key = ? AND invoice_no = ? AND UPPER(status) = 'PENDING_VERIFICATION' LIMIT 1")
        .get(tid, businessKey, invoiceNo);
      if (pendingExisting) {
        return res.status(409).json({
          ok: false,
          error: 'PENDING_SLIP_EXISTS',
          message: `A deposit slip (${pendingExisting.txn_ref}) for Invoice #${invoiceNo} is already awaiting verification.`
        });
      }
    }

    let gatewayFee = 0;
    const feeVal = Number(gwRow.fee_value || 0);
    if (gwRow.fee_type === 'percent' && feeVal > 0) {
      gatewayFee = Math.round((baseAmount * feeVal) / 100);
    } else if (gwRow.fee_type === 'fixed' && feeVal > 0) {
      gatewayFee = Math.round(feeVal);
    }
    const totalAmount = baseAmount + gatewayFee;

    const autoVerify = Boolean(b.markVerified) || Boolean(settings.autoVerifyDigitalSlips);
    const status = autoVerify ? 'VERIFIED' : 'PENDING_VERIFICATION';
    const txnId = `btxn-${crypto.randomBytes(5).toString('hex')}`;
    const txnRef = `PK-${businessKey.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const now = new Date().toISOString();

    sqliteDb
      .prepare(`
        INSERT INTO local_business_payment_transactions (
          id, tenant_id, business_key, txn_ref, invoice_no, gateway_id, gateway_name, provider_key,
          payer_name, payer_ref, payer_phone, base_amount, gateway_fee, total_amount, currency,
          status, proof_reference, proof_notes, proof_screenshot, verified_by, verified_at, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `)
      .run(
        txnId,
        tid,
        businessKey,
        txnRef,
        invoiceNo,
        gwRow.id,
        gwRow.display_name,
        gwRow.provider_key,
        enc(tid, payerName),
        enc(tid, b.payerRef || ''),
        enc(tid, b.payerPhone || ''),
        baseAmount,
        gatewayFee,
        totalAmount,
        settings.defaultCurrency || 'PKR',
        status,
        proofReference,
        String(b.proofNotes || ''),
        screenshotCheck.value,
        autoVerify ? String(b.verifiedBy || 'Counter Cashier') : '',
        autoVerify ? now : '',
        now
      );

    const row = sqliteDb.prepare('SELECT * FROM local_business_payment_transactions WHERE id = ?').get(txnId);
    const mapped = mapTxnRow(row, tid);

    if (db) {
      try {
        await setDoc(doc(collection(db, 'business_payment_transactions'), txnId), {
          ...mapped,
          proofScreenshot: '',
          is_synced: 1,
          synced_at: now
        });
        sqliteDb.prepare('UPDATE local_business_payment_transactions SET is_synced = 1 WHERE id = ?').run(txnId);
      } catch {}
    }

    res.json({ ok: true, transaction: mapped });
  });

  // PUT verify or reject a slip transaction
  router.put('/:businessKey/transactions/:id/verify', requireManageRole, (req, res) => {
    const tid = resolveTenantId(req);
    const businessKey = normalizeBusinessKey(req.params.businessKey);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    const existing = sqliteDb
      .prepare('SELECT * FROM local_business_payment_transactions WHERE id = ? AND tenant_id = ? AND business_key = ?')
      .get(id, tid, businessKey);
    if (!existing) return res.status(404).json({ ok: false, message: 'Transaction not found.' });

    const b = req.body || {};
    const status = ['VERIFIED', 'SETTLED', 'REJECTED'].includes(String(b.status || '').toUpperCase())
      ? String(b.status).toUpperCase()
      : 'VERIFIED';
    const verifiedBy = String(b.verifiedBy || 'Owner / Cashier Desk').trim();
    const now = new Date().toISOString();

    sqliteDb
      .prepare('UPDATE local_business_payment_transactions SET status = ?, verified_by = ?, verified_at = ?, is_synced = 0 WHERE id = ? AND tenant_id = ? AND business_key = ?')
      .run(status, verifiedBy, now, id, tid, businessKey);

    const updated = sqliteDb.prepare('SELECT * FROM local_business_payment_transactions WHERE id = ?').get(id);
    res.json({ ok: true, transaction: mapTxnRow(updated, tid) });
  });

  return router;
}
