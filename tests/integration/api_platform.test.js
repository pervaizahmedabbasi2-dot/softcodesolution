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

before(async () => {
  process.env.ARGON2_MEMORY_KB = process.env.ARGON2_MEMORY_KB || '16384';
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-integration-'));
  sqliteDbPath = path.join(tempDir, 'test_softcode.db');

  runtime = createApp({
    sqliteDbPath,
    disableFirebase: true,
    disableBackgroundSync: true,
    disableFrontendBuild: true,
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

test('Health, readiness, WAL journal mode, and observability metrics endpoints respond cleanly', async () => {
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, 'HEALTHY');
  assert.ok(healthRes.headers.get('x-request-id'));
  assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(healthRes.headers.get('x-frame-options'), 'SAMEORIGIN');

  const readyRes = await fetch(`${baseUrl}/readyz`);
  assert.equal(readyRes.status, 200);
  const ready = await readyRes.json();
  assert.equal(ready.status, 'READY');
  assert.equal(ready.sqlite, 'UP');

  const metricsRes = await fetch(`${baseUrl}/api/metrics`);
  assert.equal(metricsRes.status, 200);
  const metrics = await metricsRes.json();
  assert.equal(metrics.ok, true);
  assert.equal(metrics.sqlite.connected, true);
  assert.equal(String(metrics.sqlite.journalMode).toLowerCase(), 'wal');

  const promRes = await fetch(`${baseUrl}/api/metrics/prometheus`);
  assert.equal(promRes.status, 200);
  const promText = await promRes.text();
  assert.match(promText, /softcode_http_requests_total/);
});

test('Auth bot shield blocks honeypot submissions and validates registration with encrypted SQLite PII', async () => {
  const challengeRes = await fetch(`${baseUrl}/api/auth/challenge?mode=register_puzzle`);
  assert.equal(challengeRes.status, 200);
  const challenge = await challengeRes.json();
  assert.equal(challenge.ok, true);
  assert.ok(challenge.challengeToken);

  // Honeypot bot attack check
  const botRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'bot@spam.test',
      full_name: 'Spam Bot',
      company_name: 'Bot Corp',
      password: 'StrongPass#2026',
      website_hp: 'http://spam-link.example'
    })
  });
  assert.equal(botRes.status, 403);
  const botJson = await botRes.json();
  assert.equal(botJson.code, 'BOT_DETECTED');

  // Weak password check
  const weakRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@karachistore.pk',
      full_name: 'Hamza Tariq',
      company_name: 'Karachi Mega Store',
      password: '123'
    })
  });
  assert.equal(weakRes.status, 400);
  const weakJson = await weakRes.json();
  assert.equal(weakJson.code, 'WEAK_PASSWORD');

  // Valid business registration (encrypts email/name/phone in SQLite + hashes password)
  const regPayload = {
    email: 'owner@karachistore.pk',
    full_name: 'Hamza Tariq',
    company_name: 'Karachi Mega Store',
    phone: '03001234567',
    business_type: 'retail_pos',
    city: 'Karachi',
    country: 'Pakistan',
    password: 'StrongPass#2026'
  };
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  assert.equal(regRes.status, 200);
  const regJson = await regRes.json();
  assert.equal(regJson.ok, true);
  const createdTenantId = regJson.data?.user?.tenant_id;
  assert.ok(createdTenantId);

  const storedRow = runtime.sqliteDb
    .prepare('SELECT email, full_name, password_hash FROM local_tenants WHERE tenant_id = ?')
    .get(createdTenantId);
  assert.ok(storedRow, 'Tenant row must exist in SQLite');
  assert.ok(storedRow.email.startsWith('enc:v1:'), 'Email must be encrypted at rest in SQLite');
  assert.ok(storedRow.full_name.startsWith('enc:v1:'), 'Full name must be encrypted at rest in SQLite');
  assert.ok(
    storedRow.password_hash.startsWith('$argon2id$') || storedRow.password_hash.startsWith('$2'),
    'Password must be hashed via Argon2id or bcrypt fallback'
  );

  // Duplicate email prevention
  const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  assert.equal(dupRes.status, 409);
  const dupJson = await dupRes.json();
  assert.equal(dupJson.code, 'EMAIL_EXISTS');
});

test('Retail POS enforces strict cross-tenant isolation across SQLite and API responses', async () => {
  const tenantA = 'tenant-isolated-a';
  const tenantB = 'tenant-isolated-b';

  const checkoutRes = await fetch(`${baseUrl}/api/retail/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantA
    },
    body: JSON.stringify({
      customerName: 'Tenant A Confidential Buyer',
      cashier: 'Cashier A',
      total: 4250,
      paymentMethod: 'Card',
      items: [{ id: 'prd-101', qty: 1 }]
    })
  });
  assert.equal(checkoutRes.status, 200);
  const checkoutJson = await checkoutRes.json();
  assert.equal(checkoutJson.ok, true);

  const ordersARes = await fetch(`${baseUrl}/api/retail/orders`, {
    headers: { 'x-tenant-id': tenantA }
  });
  assert.equal(ordersARes.status, 200);
  const ordersA = await ordersARes.json();
  assert.ok(
    ordersA.orders.some((o) => o.id === checkoutJson.orderId && o.customerName === 'Tenant A Confidential Buyer'),
    'Tenant A must read its own decrypted checkout order'
  );

  const ordersBRes = await fetch(`${baseUrl}/api/retail/orders`, {
    headers: { 'x-tenant-id': tenantB }
  });
  assert.equal(ordersBRes.status, 200);
  const ordersB = await ordersBRes.json();
  assert.equal(
    ordersB.orders.some((o) => o.id === checkoutJson.orderId),
    false,
    'Tenant B must NEVER see Tenant A orders'
  );
});

test('Platform catalog exposes 221-module catalog and scrubs prototype pollution keys', async () => {
  const modulesRes = await fetch(`${baseUrl}/api/modules`);
  assert.equal(modulesRes.status, 200);
  const modulesJson = await modulesRes.json();
  assert.equal(modulesJson.ok, true);
  assert.ok(Array.isArray(modulesJson.modules) && modulesJson.modules.length >= 200);

  // Send JSON containing escaped null byte & __proto__ key safely to verify sanitizer strips both
  const rawPayload = '{"customerName":"Safe\\u0000Name","__proto__":{"polluted":true},"total":100}';
  const checkoutRes = await fetch(`${baseUrl}/api/retail/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': 'tenant-sanitize-check'
    },
    body: rawPayload
  });
  assert.equal(checkoutRes.status, 200);
  const checkoutJson = await checkoutRes.json();
  assert.equal(checkoutJson.order.customerName, 'SafeName', 'Null bytes must be scrubbed');
  assert.equal(({}).polluted, undefined, 'Object.prototype must never be polluted');
});
