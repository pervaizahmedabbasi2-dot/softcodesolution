import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createApp } from '../../server.js';

let server;
let baseUrl;
let tempDir;
let sqliteDbPath;
let runtime;

const SAMPLE_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

before(async () => {
  process.env.ARGON2_MEMORY_KB = process.env.ARGON2_MEMORY_KB || '16384';
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-phase2-int-'));
  sqliteDbPath = path.join(tempDir, 'test_phase2.db');

  runtime = createApp({
    sqliteDbPath,
    disableFirebase: true,
    disableBackgroundSync: true,
    disableFrontendBuild: true,
    rateLimitMaxPerMin: 2000,
    quiet: true
  });

  await new Promise((resolve) => {
    server = runtime.app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (runtime?.close) {
    runtime.close();
  }
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('PK Gateways API enforces tenant isolation, encrypts & masks merchant secrets across Coaching, Clinic, and Real Estate', async () => {
  const tenantA = 'tenant-phase2-alpha';
  const tenantB = 'tenant-phase2-beta';

  for (const businessKey of ['coaching_academy', 'hospital_clinic', 'real_estate']) {
    const seedRes = await fetch(`${baseUrl}/api/pk-gateways/${businessKey}/gateways`, {
      headers: { 'x-tenant-id': tenantA }
    });
    assert.equal(seedRes.status, 200);
    const seedBody = await seedRes.json();
    assert.equal(seedBody.ok, true);
    assert.ok(Array.isArray(seedBody.gateways) && seedBody.gateways.length >= 4, `${businessKey} should seed default PK gateways`);
    assert.ok(seedBody.gateways.some((g) => g.providerKey === 'raast' || g.category === 'raast'));
  }

  // Tenant A creates a custom gateway with a secret
  const createRes = await fetch(`${baseUrl}/api/pk-gateways/coaching_academy/gateways`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantA,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      displayName: 'Allied Bank Corporate Account',
      providerKey: 'allied_corp',
      category: 'bank_transfer',
      accountTitle: 'Apex Coaching Pvt Ltd',
      accountNumber: 'PK12ABPA0010099887766',
      merchantSecret: 'SUPER_SECRET_INTEGRITY_KEY_9876',
      isEnabled: true
    })
  });
  assert.equal(createRes.status, 200);
  const created = (await createRes.json()).gateway;
  assert.ok(created?.id);
  assert.equal(created.hasMerchantSecret, true);
  assert.equal(created.merchantSecret, undefined, 'Raw merchant secret must never be returned in API response');

  // Tenant B must NOT see Tenant A custom gateway
  const tenantBRes = await fetch(`${baseUrl}/api/pk-gateways/coaching_academy/gateways`, {
    headers: { 'x-tenant-id': tenantB }
  });
  assert.equal(tenantBRes.status, 200);
  const tenantBList = (await tenantBRes.json()).gateways || [];
  assert.equal(tenantBList.some((g) => g.id === created.id), false);
});

test('PK Gateways validates slip screenshots, blocks 409 duplicates, and supports verification', async () => {
  const tenant = 'tenant-gym-slip-01';

  // Ensure gateways exist
  const gwRes = await fetch(`${baseUrl}/api/pk-gateways/gym_fitness/gateways`, {
    headers: { 'x-tenant-id': tenant }
  });
  assert.equal(gwRes.status, 200);
  const gwList = (await gwRes.json()).gateways || [];
  const raastGw = gwList.find((g) => g.providerKey === 'raast') || gwList[0];
  assert.ok(raastGw?.id);

  // Reject invalid MIME screenshot
  const badSlipRes = await fetch(`${baseUrl}/api/pk-gateways/gym_fitness/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenant
    },
    body: JSON.stringify({
      gatewayId: raastGw.id,
      invoiceNo: 'INV-GYM-ERR',
      payerName: 'Usman Tariq',
      baseAmount: 5000,
      proofReference: 'TID-0001',
      proofScreenshot: 'data:text/plain;base64,SGVsbG8='
    })
  });
  assert.equal(badSlipRes.status, 400);

  // Valid PNG slip screenshot accepted
  const okSlipRes = await fetch(`${baseUrl}/api/pk-gateways/gym_fitness/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenant
    },
    body: JSON.stringify({
      gatewayId: raastGw.id,
      invoiceNo: 'INV-GYM-1001',
      payerName: 'Usman Tariq',
      baseAmount: 5000,
      proofReference: 'TID-RAAST-55221',
      proofScreenshot: SAMPLE_PNG_BASE64
    })
  });
  assert.equal(okSlipRes.status, 200);
  const txnBody = await okSlipRes.json();
  assert.equal(txnBody.ok, true);
  assert.equal(txnBody.transaction.status, 'PENDING_VERIFICATION');

  // Duplicate invoice submission while pending returns 409
  const dupPendingRes = await fetch(`${baseUrl}/api/pk-gateways/gym_fitness/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenant
    },
    body: JSON.stringify({
      gatewayId: raastGw.id,
      invoiceNo: 'INV-GYM-1001',
      payerName: 'Usman Tariq',
      baseAmount: 5000,
      proofReference: 'TID-RAAST-55222'
    })
  });
  assert.equal(dupPendingRes.status, 409);

  // Verify the pending transaction
  const verifyRes = await fetch(
    `${baseUrl}/api/pk-gateways/gym_fitness/transactions/${txnBody.transaction.id}/verify`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenant,
        'x-user-role': 'accountant'
      },
      body: JSON.stringify({ status: 'VERIFIED', verifiedBy: 'Gym Accountant' })
    }
  );
  assert.equal(verifyRes.status, 200);
  const verified = (await verifyRes.json()).transaction;
  assert.equal(verified.status, 'VERIFIED');

  // Duplicate submission after verification still returns 409 INVOICE_ALREADY_PAID
  const dupPaidRes = await fetch(`${baseUrl}/api/pk-gateways/gym_fitness/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenant
    },
    body: JSON.stringify({
      gatewayId: raastGw.id,
      invoiceNo: 'INV-GYM-1001',
      payerName: 'Usman Tariq',
      baseAmount: 5000,
      proofReference: 'TID-RAAST-55223'
    })
  });
  assert.equal(dupPaidRes.status, 409);
  const dupErr = await dupPaidRes.json();
  assert.equal(dupErr.error, 'INVOICE_ALREADY_PAID');
});

test('Retail barcode lookup, Pharmacy FEFO nearest-expiry lookup, and Logistics 4x6 waybill endpoints return accurate hardware payloads', async () => {
  // 1. Retail Barcode Lookup (seeded SKU ELEC-9021 / EAN 890123456789)
  const retailOk = await fetch(`${baseUrl}/api/retail/barcode-lookup?code=ELEC-9021`);
  assert.equal(retailOk.status, 200);
  const retailJson = await retailOk.json();
  assert.equal(retailJson.ok, true);
  assert.ok(retailJson.product?.name);

  const retailMiss = await fetch(`${baseUrl}/api/retail/barcode-lookup?code=NONEXISTENT-9999`);
  assert.equal(retailMiss.status, 404);

  // 2. Pharmacy FEFO Lookup (Augmentin 625mg barcode 896400112201 has two batches: med-1b 2026-08-10 and med-1 2027-02-15)
  const pharmaEarlyRes = await fetch(`${baseUrl}/api/pharmacy/barcode-lookup?code=896400112201&asOfDate=2026-04-01`);
  assert.equal(pharmaEarlyRes.status, 200);
  const pharmaEarlyJson = await pharmaEarlyRes.json();
  assert.equal(pharmaEarlyJson.ok, true);
  assert.equal(pharmaEarlyJson.strategy, 'FEFO');
  assert.ok(Array.isArray(pharmaEarlyJson.batches) && pharmaEarlyJson.batches.length >= 2);
  assert.equal(pharmaEarlyJson.recommendedBatch.id, 'med-1b', 'FEFO must auto-select nearest non-expired batch');
  assert.equal(pharmaEarlyJson.batches[0].id, 'med-1b');

  // Expired batch guard: on 2026-11-26, med-1b (2026-08-10) is expired so FEFO must skip it and pick med-1 (2027-02-15)
  const pharmaLateRes = await fetch(`${baseUrl}/api/pharmacy/barcode-lookup?code=896400112201&asOfDate=2026-11-26`);
  assert.equal(pharmaLateRes.status, 200);
  const pharmaLateJson = await pharmaLateRes.json();
  assert.equal(pharmaLateJson.batches[0].isExpired, true);
  assert.equal(pharmaLateJson.recommendedBatch.id, 'med-1');

  // 3. Logistics 4x6 Waybill Payload Lookup (seeded EXP-PK-994102)
  const waybillRes = await fetch(`${baseUrl}/api/logistics/waybill/EXP-PK-994102`);
  assert.equal(waybillRes.status, 200);
  const waybillJson = await waybillRes.json();
  assert.equal(waybillJson.ok, true);
  assert.equal(waybillJson.waybill.trackingNo, 'EXP-PK-994102');
  assert.ok(waybillJson.waybill.origin && waybillJson.waybill.destination);
});
