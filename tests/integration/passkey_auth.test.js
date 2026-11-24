import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../../server.js';

let server;
let baseUrl;
let tempDir;
let sqliteDbPath;
let runtime;

function cborHead(major, n) {
  const m = major << 5;
  if (n < 24) return Buffer.from([m | n]);
  if (n < 256) return Buffer.from([m | 24, n]);
  if (n < 65536) {
    const b = Buffer.alloc(3);
    b[0] = m | 25;
    b.writeUInt16BE(n, 1);
    return b;
  }
  const b = Buffer.alloc(5);
  b[0] = m | 26;
  b.writeUInt32BE(n, 1);
  return b;
}

function cborInt(v) {
  if (v >= 0) return cborHead(0, v);
  return cborHead(1, -1 - v);
}

function cborBytes(buf) {
  return Buffer.concat([cborHead(2, buf.length), buf]);
}

function cborText(str) {
  const b = Buffer.from(str, 'utf8');
  return Buffer.concat([cborHead(3, b.length), b]);
}

function cborMap(entries) {
  const parts = [cborHead(5, entries.length)];
  for (const [k, v] of entries) {
    parts.push(typeof k === 'number' ? cborInt(k) : cborText(k));
    parts.push(v);
  }
  return Buffer.concat(parts);
}

function createWebAuthnKeyMaterial(rpId = 'localhost') {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const x = Buffer.from(jwk.x, 'base64url');
  const y = Buffer.from(jwk.y, 'base64url');

  // COSE_Key map for ES256 (P-256)
  const coseKey = cborMap([
    [1, cborInt(2)],   // kty: EC2
    [3, cborInt(-7)],  // alg: ES256
    [-1, cborInt(1)],  // crv: P-256
    [-2, cborBytes(x)],
    [-3, cborBytes(y)]
  ]);

  const rpIdHash = crypto.createHash('sha256').update(rpId).digest();
  const flags = Buffer.from([0x41]); // UP (0x01) + AT (0x40)
  const signCount = Buffer.alloc(4);
  const aaguid = Buffer.alloc(16);
  const credIdBuf = crypto.randomBytes(32);
  const credIdLen = Buffer.alloc(2);
  credIdLen.writeUInt16BE(credIdBuf.length, 0);

  const authData = Buffer.concat([rpIdHash, flags, signCount, aaguid, credIdLen, credIdBuf, coseKey]);
  const attestationObject = cborMap([
    ['fmt', cborText('none')],
    ['attStmt', cborMap([])],
    ['authData', cborBytes(authData)]
  ]);

  return {
    publicKey,
    privateKey,
    credentialId: credIdBuf.toString('base64url'),
    attestationObject: attestationObject.toString('base64url'),
    rpIdHash
  };
}

function buildAssertion({ challenge, origin = 'http://localhost:3000', rpId = 'localhost', privateKey }) {
  const clientDataObj = {
    type: 'webauthn.get',
    challenge,
    origin,
    crossOrigin: false
  };
  const clientDataBuf = Buffer.from(JSON.stringify(clientDataObj), 'utf8');
  const clientDataHash = crypto.createHash('sha256').update(clientDataBuf).digest();

  const rpIdHash = crypto.createHash('sha256').update(rpId).digest();
  const flags = Buffer.from([0x05]); // UP (0x01) + UV (0x04)
  const signCount = Buffer.from([0, 0, 0, 1]);
  const authenticatorData = Buffer.concat([rpIdHash, flags, signCount]);

  const signedPayload = Buffer.concat([authenticatorData, clientDataHash]);
  const signature = crypto.sign('sha256', signedPayload, privateKey);

  return {
    clientDataJSON: clientDataBuf.toString('base64url'),
    authenticatorData: authenticatorData.toString('base64url'),
    signature: signature.toString('base64url')
  };
}

before(async () => {
  process.env.ARGON2_MEMORY_KB = process.env.ARGON2_MEMORY_KB || '16384';
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-passkey-int-'));
  sqliteDbPath = path.join(tempDir, 'test_passkey.db');

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

test('WebAuthn Passkey enroll extracts SPKI from CBOR attestationObject, supports SuperAdmin alias login-options, and verifies ES256 assertion', async () => {
  // 1. Login as SuperAdmin using master alias
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'pervaizahmedabbasi786@gmail.com',
      password: 'Pervaiz786!Admin'
    })
  });
  assert.equal(loginRes.status, 200);
  const loginJson = await loginRes.json();
  assert.equal(loginJson.ok, true);
  assert.ok(loginJson.token?.startsWith('scs_v1.'));
  const adminToken = loginJson.token;

  // 2. Request register-options
  const regOptsRes = await fetch(`${baseUrl}/api/auth/passkey/register-options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: 'pervaizahmedabbasi786@gmail.com',
      fullName: 'Pervaiz Ahmed Abbasi',
      tenantId: 'tenant-root-platform'
    })
  });
  assert.equal(regOptsRes.status, 200);
  const regOpts = await regOptsRes.json();
  assert.equal(regOpts.ok, true);
  assert.ok(regOpts.challenge);
  assert.ok(regOpts.challengeToken);
  assert.equal(regOpts.authenticatorSelection?.authenticatorAttachment, 'platform');
  assert.equal(regOpts.authenticatorSelection?.userVerification, 'required');
  assert.ok(Array.isArray(regOpts.pubKeyCredParams) && regOpts.pubKeyCredParams.length >= 2);

  // 3. Reject enroll when neither attestationObject nor publicKeySpki is valid
  const badClientData = Buffer.from(JSON.stringify({
    type: 'webauthn.create',
    challenge: regOpts.challenge,
    origin: 'http://localhost:3000'
  })).toString('base64url');

  const badEnrollRes = await fetch(`${baseUrl}/api/auth/passkey/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      Origin: 'http://localhost:3000'
    },
    body: JSON.stringify({
      email: 'pervaizahmedabbasi786@gmail.com',
      tenantId: 'tenant-root-platform',
      challengeToken: regOpts.challengeToken,
      credentialId: 'missing-key-cred-id',
      clientDataJSON: badClientData,
      publicKeySpki: ''
    })
  });
  assert.equal(badEnrollRes.status, 400);
  const badEnrollJson = await badEnrollRes.json();
  assert.equal(badEnrollJson.code, 'PASSKEY_KEY_INVALID');

  // 4. Re-issue challenge & enroll with ONLY CBOR attestationObject (simulating WebView without resp.getPublicKey())
  const regOpts2Res = await fetch(`${baseUrl}/api/auth/passkey/register-options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: 'pervaizahmedabbasi786@gmail.com',
      tenantId: 'tenant-root-platform'
    })
  });
  const regOpts2 = await regOpts2Res.json();
  const keyMat = createWebAuthnKeyMaterial('localhost');
  const createClientData = Buffer.from(JSON.stringify({
    type: 'webauthn.create',
    challenge: regOpts2.challenge,
    origin: 'http://localhost:3000'
  })).toString('base64url');

  const enrollRes = await fetch(`${baseUrl}/api/auth/passkey/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      Origin: 'http://localhost:3000'
    },
    body: JSON.stringify({
      email: 'pervaizahmedabbasi786@gmail.com',
      tenantId: 'tenant-root-platform',
      role: 'super_admin',
      portalType: 'superadmin',
      deviceLabel: 'Pixel Biometric Sensor',
      challengeToken: regOpts2.challengeToken,
      credentialId: keyMat.credentialId,
      clientDataJSON: createClientData,
      attestationObject: keyMat.attestationObject,
      publicKeySpki: ''
    })
  });
  assert.equal(enrollRes.status, 200);
  const enrollJson = await enrollRes.json();
  assert.equal(enrollJson.ok, true);
  assert.equal(enrollJson.passkey.hasPublicKey, true);

  // 5. Verify /passkey/list returns key with hasPublicKey=true across SuperAdmin aliases and register-options adds it to excludeCredentials
  const listRes = await fetch(`${baseUrl}/api/auth/passkey/list?email=pervaizahmedabbasi786@gmail.com&tenantId=tenant-root-platform`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(listRes.status, 200);
  const listJson = await listRes.json();
  assert.equal(listJson.passkeys.length, 1);
  assert.equal(listJson.passkeys[0].hasPublicKey, true);

  const aliasListRes = await fetch(`${baseUrl}/api/auth/passkey/list?email=admin&tenantId=tenant-root-platform`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(aliasListRes.status, 200);
  const aliasListJson = await aliasListRes.json();
  assert.equal(aliasListJson.passkeys.length, 1);
  assert.equal(aliasListJson.passkeys[0].credentialId, keyMat.credentialId);

  const regOpts3Res = await fetch(`${baseUrl}/api/auth/passkey/register-options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: 'pervaizahmedabbasi786@gmail.com',
      tenantId: 'tenant-root-platform'
    })
  });
  const regOpts3 = await regOpts3Res.json();
  assert.ok(regOpts3.excludeCredentials.some((c) => c.id === keyMat.credentialId));

  // 6. Verify /passkey/login-options resolves 'admin' alias to SuperAdmin's enrolled credential with required UV
  const loginOptsRes = await fetch(`${baseUrl}/api/auth/passkey/login-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin' })
  });
  assert.equal(loginOptsRes.status, 200);
  const loginOpts = await loginOptsRes.json();
  assert.equal(loginOpts.userVerification, 'required');
  assert.ok(loginOpts.allowCredentials.some((c) => c.id === keyMat.credentialId));

  // 7. Tampered signature must fail with 401 PASSKEY_SIGNATURE_INVALID
  const goodAssertion = buildAssertion({
    challenge: loginOpts.challenge,
    origin: 'http://localhost:3000',
    rpId: 'localhost',
    privateKey: keyMat.privateKey
  });
  const tamperedSig = Buffer.from(goodAssertion.signature, 'base64url');
  tamperedSig[tamperedSig.length - 1] ^= 0xff;

  const tamperedVerifyRes = await fetch(`${baseUrl}/api/auth/passkey/login-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000'
    },
    body: JSON.stringify({
      challengeToken: loginOpts.challengeToken,
      credentialId: keyMat.credentialId,
      clientDataJSON: goodAssertion.clientDataJSON,
      authenticatorData: goodAssertion.authenticatorData,
      signature: tamperedSig.toString('base64url')
    })
  });
  assert.equal(tamperedVerifyRes.status, 401);
  const tamperedJson = await tamperedVerifyRes.json();
  assert.equal(tamperedJson.code, 'PASSKEY_SIGNATURE_INVALID');

  // 8. Fresh passwordless /passkey/login-options (empty email) + valid signature succeeds
  const pwdlessOptsRes = await fetch(`${baseUrl}/api/auth/passkey/login-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '' })
  });
  const pwdlessOpts = await pwdlessOptsRes.json();
  assert.deepEqual(pwdlessOpts.allowCredentials, []);

  const validAssertion = buildAssertion({
    challenge: pwdlessOpts.challenge,
    origin: 'http://localhost:3000',
    rpId: 'localhost',
    privateKey: keyMat.privateKey
  });

  const verifyRes = await fetch(`${baseUrl}/api/auth/passkey/login-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000'
    },
    body: JSON.stringify({
      challengeToken: pwdlessOpts.challengeToken,
      credentialId: keyMat.credentialId,
      clientDataJSON: validAssertion.clientDataJSON,
      authenticatorData: validAssertion.authenticatorData,
      signature: validAssertion.signature
    })
  });
  assert.equal(verifyRes.status, 200);
  const verifyJson = await verifyRes.json();
  assert.equal(verifyJson.ok, true);
  assert.equal(verifyJson.redirect, '/superadmin');
  assert.equal(verifyJson.user.role, 'super_admin');
  assert.ok(verifyJson.token?.startsWith('scs_v1.'));
});

test('Passkey cross-tenant credential hijack is blocked and registration with Passkey saves valid SPKI', async () => {
  // Register a client tenant WITH a passkey attached
  const regOptsRes = await fetch(`${baseUrl}/api/auth/passkey/register-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'clinic-owner@lahore.pk', fullName: 'Dr. Ayesha' })
  });
  const regOpts = await regOptsRes.json();
  const keyMat = createWebAuthnKeyMaterial('localhost');
  const createClientData = Buffer.from(JSON.stringify({
    type: 'webauthn.create',
    challenge: regOpts.challenge,
    origin: 'http://localhost:3000'
  })).toString('base64url');

  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000'
    },
    body: JSON.stringify({
      email: 'clinic-owner@lahore.pk',
      full_name: 'Dr. Ayesha',
      company_name: 'Lahore Care Clinic',
      password: 'ClinicPass#2026',
      enable_passkey: true,
      passkeyCredential: {
        credentialId: keyMat.credentialId,
        challengeToken: regOpts.challengeToken,
        clientDataJSON: createClientData,
        attestationObject: keyMat.attestationObject,
        publicKeySpki: '',
        deviceLabel: 'Clinic Biometric Key'
      }
    })
  });
  assert.equal(regRes.status, 200);
  const regJson = await regRes.json();
  assert.equal(regJson.ok, true);
  assert.ok(regJson.token?.startsWith('scs_v1.'));

  // Register a second tenant and try to enroll the first tenant's credentialId -> must return 409 PASSKEY_CREDENTIAL_IN_USE
  const reg2Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'attacker@other.pk',
      full_name: 'Other User',
      company_name: 'Other Corp',
      password: 'OtherPass#2026'
    })
  });
  assert.equal(reg2Res.status, 200);
  const reg2Json = await reg2Res.json();

  const opts2Res = await fetch(`${baseUrl}/api/auth/passkey/register-options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${reg2Json.token}`
    },
    body: JSON.stringify({ email: 'attacker@other.pk' })
  });
  const opts2 = await opts2Res.json();
  const stealClientData = Buffer.from(JSON.stringify({
    type: 'webauthn.create',
    challenge: opts2.challenge,
    origin: 'http://localhost:3000'
  })).toString('base64url');

  const hijackRes = await fetch(`${baseUrl}/api/auth/passkey/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${reg2Json.token}`,
      Origin: 'http://localhost:3000'
    },
    body: JSON.stringify({
      email: 'attacker@other.pk',
      challengeToken: opts2.challengeToken,
      credentialId: keyMat.credentialId,
      clientDataJSON: stealClientData,
      attestationObject: keyMat.attestationObject
    })
  });
  assert.equal(hijackRes.status, 409);
  const hijackJson = await hijackRes.json();
  assert.equal(hijackJson.code, 'PASSKEY_CREDENTIAL_IN_USE');
});
