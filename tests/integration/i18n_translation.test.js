import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createApp } from '../../server.js';

let server;
let baseUrl;
let tempDir;
let runtime;

before(async () => {
  process.env.ARGON2_MEMORY_KB = process.env.ARGON2_MEMORY_KB || '16384';
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-i18n-test-'));
  const sqliteDbPath = path.join(tempDir, 'test_i18n.db');

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

test('I18N API rejects unsupported target language cleanly', async () => {
  const res = await fetch(`${baseUrl}/api/i18n/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetLang: 'zz', texts: ['Hello'] })
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
});

test('I18N API translates Urdu batch, preserves SoftCodeSolution brand token, and persists SQLite cache', async () => {
  const sampleTexts = [
    'Technical Support',
    'Plug-and-Play Printers, Scanners & PWA',
    'Welcome to SoftCodeSolution enterprise cloud platform'
  ];

  const res = await fetch(`${baseUrl}/api/i18n/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetLang: 'ur', texts: sampleTexts })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.targetLang, 'ur');
  assert.ok(body.translations['Technical Support']);
  assert.ok(body.translations['Plug-and-Play Printers, Scanners & PWA']);
  assert.ok(
    body.translations['Welcome to SoftCodeSolution enterprise cloud platform'].includes('SoftCodeSolution'),
    'Brand name SoftCodeSolution must stay intact inside translated sentence'
  );

  // Second request should hit SQLite/memory cache cleanly
  const cachedRes = await fetch(`${baseUrl}/api/i18n/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetLang: 'ur', texts: ['Technical Support'] })
  });
  const cachedBody = await cachedRes.json();
  assert.equal(cachedBody.ok, true);
  assert.equal(cachedBody.translations['Technical Support'], body.translations['Technical Support']);
});

test('I18N API supports English identity pass-through and regional/global picker languages (sd, pa, ps, bal, skr, ks, ar, hi, es, fr)', async () => {
  const enRes = await fetch(`${baseUrl}/api/i18n/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetLang: 'en', texts: ['Submit Ticket'] })
  });
  const enBody = await enRes.json();
  assert.equal(enBody.ok, true);
  assert.equal(enBody.translations['Submit Ticket'], 'Submit Ticket');

  for (const lang of ['sd', 'pa', 'ps', 'bal', 'skr', 'ks', 'ar', 'fa', 'hi', 'bn', 'ko', 'th', 'vi', 'ms', 'pl', 'uk', 'he', 'ta', 'sw', 'es', 'fr']) {
    const res = await fetch(`${baseUrl}/api/i18n/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLang: lang,
        texts: ['Enterprise Support', 'Founder & CEO', 'Connected to SoftCode Ops Desk', 'Manage your SoftCodeSolution business workspace']
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(typeof body.translations['Enterprise Support'] === 'string');
    assert.ok(body.translations['Enterprise Support'].length > 0);
    assert.ok(typeof body.translations['Founder & CEO'] === 'string' && body.translations['Founder & CEO'].length > 0, `Expected Founder & CEO translation for ${lang}`);
    assert.ok(typeof body.translations['Connected to SoftCode Ops Desk'] === 'string' && body.translations['Connected to SoftCode Ops Desk'].length > 0, `Expected Ops Desk translation for ${lang}`);
    const sentence = body.translations['Manage your SoftCodeSolution business workspace'];
    assert.ok(typeof sentence === 'string' && sentence.length > 0, `Expected non-empty translation for ${lang}`);
  }
});

test('I18N API exposes hybrid offline pack summary, pack download, and pack import endpoints', async () => {
  // Import custom offline phrase into SQLite pack
  const importRes = await fetch(`${baseUrl}/api/i18n/pack/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetLang: 'ar',
      translations: { 'Offline Sync Verification': 'التحقق من المزامنة دون اتصال' }
    })
  });
  assert.equal(importRes.status, 200);
  const importBody = await importRes.json();
  assert.equal(importBody.ok, true);
  assert.ok(importBody.imported >= 1);

  // Download full offline pack for ur & ar
  const packRes = await fetch(`${baseUrl}/api/i18n/pack/ar`);
  assert.equal(packRes.status, 200);
  const packBody = await packRes.json();
  assert.equal(packBody.ok, true);
  assert.equal(packBody.targetLang, 'ar');
  assert.equal(packBody.translations['Offline Sync Verification'], 'التحقق من المزامنة دون اتصال');
  assert.ok(packBody.count >= 1);

  // Verify summary reports downloaded counts per language
  const summaryRes = await fetch(`${baseUrl}/api/i18n/packs/summary`);
  assert.equal(summaryRes.status, 200);
  const summaryBody = await summaryRes.json();
  assert.equal(summaryBody.ok, true);
  assert.ok(summaryBody.packs.ar?.count >= 1);
  assert.ok(summaryBody.packs.ur?.count >= 1);
});
