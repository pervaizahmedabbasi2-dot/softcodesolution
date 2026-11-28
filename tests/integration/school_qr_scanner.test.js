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
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-qr-int-'));
  sqliteDbPath = path.join(tempDir, 'test_qr_scanner.db');

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

test('School QR Scanner: Signed registration, deep lookup, creator attribution, anti-fake/tamper/duplicate/revoke detection, and Owner RBAC delegation', async () => {
  const tid = 'tenant-qr-scanner-test';

  // Seed student & fee challan in live DB
  const createStudentRes = await fetch(`${baseUrl}/api/school/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      fullName: 'Zainab Tariq',
      rollNo: 'SCS-2026-901',
      grade: 'Grade 10',
      section: 'A',
      guardianName: 'Tariq Mahmood',
      phone: '+92 300 1234567',
      feeAmount: 18500,
      dueBakaya: 18500,
      feeStatus: 'PENDING'
    })
  });
  assert.equal(createStudentRes.status, 201);
  const student = (await createStudentRes.json()).student;
  assert.ok(student?.id);

  const createFeeRes = await fetch(`${baseUrl}/api/school/fees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      studentId: student.id,
      studentName: student.fullName,
      rollNo: student.rollNo,
      grade: 'Grade 10',
      challanNo: 'CHLN-901-NOV',
      month: 'November 2026',
      tuitionFee: 18500,
      total: 18500,
      status: 'PENDING'
    })
  });
  assert.equal(createFeeRes.status, 201);
  const fee = (await createFeeRes.json()).fee;
  assert.ok(fee?.id);

  // 1. Register signed authentic printout (PENDING matching live DB)
  const regRes = await fetch(`${baseUrl}/api/school/print-verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'accountant',
      'x-user-name': 'Muhammad Rizwan (Accountant)'
    },
    body: JSON.stringify({
      docType: 'bank_challan',
      docLabel: 'A4 3-Copy Bank Fee Challan',
      tableId: 'owner_finance_ledger',
      tableTitle: 'Master Cash Book & Fee Ledger',
      portalTab: 'finance',
      rowKey: fee.id,
      rowLabel: `${fee.challanNo} · ${student.fullName}`,
      subjectName: student.fullName,
      rollOrCode: fee.challanNo,
      amountPkr: 18500,
      statusSnapshot: 'PENDING',
      generatedBy: 'Muhammad Rizwan (Accountant)',
      generatedByRole: 'accountant'
    })
  });
  assert.equal(regRes.status, 201);
  const regJson = await regRes.json();
  assert.equal(regJson.ok, true);
  assert.ok(regJson.printId.startsWith('PRT-'));
  assert.ok(regJson.qrToken.startsWith(`SCS1|${regJson.printId}|`));
  assert.equal(regJson.item.generatedBy, 'Muhammad Rizwan (Accountant)');
  assert.equal(regJson.item.generatedByRole, 'accountant');

  // 2. Owner verifies authentic SCS1 QR -> AUTHENTIC + deep table/row + generator attribution
  const verifyAuthRes = await fetch(`${baseUrl}/api/school/qr-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner',
      'x-user-name': 'School Owner'
    },
    body: JSON.stringify({
      rawCode: regJson.qrToken,
      scanSource: 'camera',
      scannerName: 'School Owner',
      scannerRole: 'owner'
    })
  });
  assert.equal(verifyAuthRes.status, 200);
  const verifyAuth = await verifyAuthRes.json();
  assert.equal(verifyAuth.ok, true);
  assert.equal(verifyAuth.verdict, 'AUTHENTIC');
  assert.equal(verifyAuth.isReal, true);
  assert.equal(verifyAuth.sigValid, true);
  assert.equal(verifyAuth.duplicateWarning, false);
  assert.equal(verifyAuth.generator.generatedBy, 'Muhammad Rizwan (Accountant)');
  assert.equal(verifyAuth.generator.generatedByRole, 'accountant');
  assert.equal(verifyAuth.location.tableId, 'owner_finance_ledger');
  assert.equal(verifyAuth.location.rowKey, fee.id);

  // 3. Second scan of same bank_challan triggers duplicateWarning & increments scanCount
  const verifyDupRes = await fetch(`${baseUrl}/api/school/qr-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      rawCode: regJson.qrToken,
      scanSource: 'file',
      scannerName: 'Gate Desk',
      scannerRole: 'owner'
    })
  });
  assert.equal(verifyDupRes.status, 200);
  const verifyDup = await verifyDupRes.json();
  assert.equal(verifyDup.verdict, 'AUTHENTIC');
  assert.equal(verifyDup.duplicateWarning, true);
  assert.ok(verifyDup.generator.scanCount >= 2);

  // 4. Forged HMAC signature or unknown PRT token -> FAKE
  const forgedSigRes = await fetch(`${baseUrl}/api/school/qr-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      rawCode: `SCS1|${regJson.printId}|BADSIG000000`,
      scanSource: 'camera'
    })
  });
  assert.equal(forgedSigRes.status, 200);
  const forgedSig = await forgedSigRes.json();
  assert.equal(forgedSig.verdict, 'FAKE');
  assert.equal(forgedSig.isReal, false);
  assert.equal(forgedSig.sigValid, false);

  const unknownRes = await fetch(`${baseUrl}/api/school/qr-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      rawCode: 'SCS1|PRT-20269999-DEADBF|ABCDEF123456',
      scanSource: 'camera'
    })
  });
  assert.equal(unknownRes.status, 200);
  const unknown = await unknownRes.json();
  assert.equal(unknown.verdict, 'FAKE');
  assert.equal(unknown.isReal, false);

  // 5. Altered PAID status vs live PENDING fee row -> TAMPERED with critical mismatches
  const tamperedRegRes = await fetch(`${baseUrl}/api/school/print-verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      docType: 'bank_challan',
      docLabel: 'Tampered Challan Claiming PAID',
      tableId: 'owner_finance_ledger',
      rowKey: fee.id,
      subjectName: student.fullName,
      rollOrCode: fee.challanNo,
      amountPkr: 18500,
      statusSnapshot: 'PAID',
      generatedBy: 'Unknown Counter',
      generatedByRole: 'owner'
    })
  });
  assert.equal(tamperedRegRes.status, 201);
  const tamperedReg = await tamperedRegRes.json();

  const verifyTamperedRes = await fetch(`${baseUrl}/api/school/qr-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      rawCode: tamperedReg.qrToken,
      scanSource: 'camera'
    })
  });
  assert.equal(verifyTamperedRes.status, 200);
  const verifyTampered = await verifyTamperedRes.json();
  assert.equal(verifyTampered.verdict, 'TAMPERED');
  assert.equal(verifyTampered.isReal, false);
  assert.ok(Array.isArray(verifyTampered.mismatches) && verifyTampered.mismatches.length > 0);
  assert.equal(verifyTampered.mismatches[0].field, 'Payment Status');

  // 6. Owner revokes authentic printout -> next scan returns REVOKED
  const revokeRes = await fetch(`${baseUrl}/api/school/print-verifications/${regJson.printId}/revoke`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner',
      'x-user-name': 'School Owner'
    },
    body: JSON.stringify({
      status: 'REVOKED',
      reason: 'Cancelled challan replaced by corrected voucher'
    })
  });
  assert.equal(revokeRes.status, 200);
  const revokeJson = await revokeRes.json();
  assert.equal(revokeJson.item.status, 'REVOKED');

  const verifyRevokedRes = await fetch(`${baseUrl}/api/school/qr-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      rawCode: regJson.qrToken,
      scanSource: 'camera'
    })
  });
  assert.equal(verifyRevokedRes.status, 200);
  const verifyRevoked = await verifyRevokedRes.json();
  assert.equal(verifyRevoked.verdict, 'REVOKED');
  assert.equal(verifyRevoked.isReal, false);

  // 7. RBAC: Principal/Teacher locked by default -> Owner delegates -> Allowed
  const lockedPrincipalVerify = await fetch(`${baseUrl}/api/school/qr-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'principal',
      'x-user-name': 'Dr. Tariq'
    },
    body: JSON.stringify({
      rawCode: regJson.qrToken,
      scannerRole: 'principal',
      scannerName: 'Dr. Tariq'
    })
  });
  assert.equal(lockedPrincipalVerify.status, 403);

  const nonOwnerPolicyEdit = await fetch(`${baseUrl}/api/school/qr-scanner/access`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'principal'
    },
    body: JSON.stringify({
      roles: {
        principal: { enabled: true, canScanCamera: true, canFileScan: true, canViewLedger: true, canJumpToRecord: true, canRevokePrints: false }
      }
    })
  });
  assert.equal(nonOwnerPolicyEdit.status, 403);

  const ownerGrantRes = await fetch(`${baseUrl}/api/school/qr-scanner/access`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'owner',
      'x-user-name': 'School Owner'
    },
    body: JSON.stringify({
      roles: {
        principal: { enabled: true, canScanCamera: true, canFileScan: true, canViewLedger: true, canJumpToRecord: true, canRevokePrints: false },
        teacher: { enabled: true, canScanCamera: true, canFileScan: true, canViewLedger: false, canJumpToRecord: true, canRevokePrints: false }
      }
    })
  });
  assert.equal(ownerGrantRes.status, 200);
  const ownerGrant = await ownerGrantRes.json();
  assert.equal(ownerGrant.policy.roles.principal.enabled, true);
  assert.equal(ownerGrant.policy.roles.teacher.enabled, true);
  assert.equal(ownerGrant.policy.roles.staff.enabled, false);

  const unlockedPrincipalVerify = await fetch(`${baseUrl}/api/school/qr-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      'x-user-role': 'principal',
      'x-user-name': 'Dr. Tariq'
    },
    body: JSON.stringify({
      rawCode: regJson.qrToken,
      scannerRole: 'principal',
      scannerName: 'Dr. Tariq'
    })
  });
  assert.equal(unlockedPrincipalVerify.status, 200);

  // Ledger listing returns registered items + scan logs + stats
  const ledgerRes = await fetch(`${baseUrl}/api/school/print-verifications`, {
    headers: {
      'x-tenant-id': tid,
      'x-user-role': 'owner'
    }
  });
  assert.equal(ledgerRes.status, 200);
  const ledger = await ledgerRes.json();
  assert.equal(ledger.ok, true);
  assert.ok(ledger.items.length >= 2);
  assert.ok(ledger.scanLogs.length >= 5);
  assert.ok(ledger.stats.blockedFakeOrTampered >= 3);
});
