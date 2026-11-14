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
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-school-int-'));
  sqliteDbPath = path.join(tempDir, 'test_school.db');

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

test('School Business enforces strict multi-tenant isolation across students, teachers, admissions, fees, and workspaces', async () => {
  const tenantA = 'tenant-school-alpha';
  const tenantB = 'tenant-school-beta';

  const createStudentRes = await fetch(`${baseUrl}/api/school/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantA,
      'x-user-role': 'owner'
    },
    body: JSON.stringify({
      fullName: 'Amina Farooq',
      grade: 'Grade 9',
      section: 'A',
      guardianName: 'Farooq Ahmed',
      guardianCnic: '35202-1112223-1',
      guardianEmail: 'farooq.alpha@campus.test',
      phone: '+92 300 5550199',
      address: 'House 42, Gulberg, Lahore',
      feeAmount: 21000,
      dueBakaya: 21000,
      feeStatus: 'PENDING'
    })
  });
  assert.equal(createStudentRes.status, 201);
  const createdStudent = (await createStudentRes.json()).student;
  assert.ok(createdStudent?.id);

  // Tenant A sees its student
  const listARes = await fetch(`${baseUrl}/api/school/students`, {
    headers: { 'x-tenant-id': tenantA }
  });
  assert.equal(listARes.status, 200);
  const listA = (await listARes.json()).students;
  assert.ok(listA.some((s) => s.id === createdStudent.id && s.fullName === 'Amina Farooq'));

  // Tenant B does NOT see Tenant A's student
  const listBRes = await fetch(`${baseUrl}/api/school/students`, {
    headers: { 'x-tenant-id': tenantB }
  });
  assert.equal(listBRes.status, 200);
  const listB = (await listBRes.json()).students;
  assert.equal(listB.some((s) => s.id === createdStudent.id), false, 'Tenant B must never read Tenant A students');

  // Tenant B cannot update or delete Tenant A's student (404)
  const crossPut = await fetch(`${baseUrl}/api/school/students/${createdStudent.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantB, 'x-user-role': 'owner' },
    body: JSON.stringify({ grade: 'Grade 10' })
  });
  assert.equal(crossPut.status, 404);

  const crossDel = await fetch(`${baseUrl}/api/school/students/${createdStudent.id}`, {
    method: 'DELETE',
    headers: { 'x-tenant-id': tenantB, 'x-user-role': 'owner' }
  });
  assert.equal(crossDel.status, 404);

  // Workspace isolation
  const saveWsA = await fetch(`${baseUrl}/api/school/workspace`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantA, 'x-user-role': 'owner' },
    body: JSON.stringify({ schoolName: 'Alpha Collegiate Academy', academicYear: '2026-27' })
  });
  assert.equal(saveWsA.status, 200);

  const wsARes = await fetch(`${baseUrl}/api/school/workspace`, { headers: { 'x-tenant-id': tenantA } });
  const wsBRes = await fetch(`${baseUrl}/api/school/workspace`, { headers: { 'x-tenant-id': tenantB } });
  assert.equal((await wsARes.json()).workspace?.schoolName, 'Alpha Collegiate Academy');
  assert.equal((await wsBRes.json()).workspace, null);
});

test('School PII fields are AES-256-GCM encrypted at rest in SQLite and decrypted on REST read', async () => {
  const tenantId = 'tenant-crypto-school';
  const createRes = await fetch(`${baseUrl}/api/school/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-role': 'principal' },
    body: JSON.stringify({
      fullName: 'Bilal Siddiqui',
      grade: 'Grade 6',
      guardianName: 'Usman Siddiqui',
      guardianCnic: '61101-7788990-3',
      guardianEmail: 'usman.siddiqui@parent.test',
      phone: '+92 333 7788990',
      address: 'Sector G-11/2, Islamabad',
      feeAmount: 16500
    })
  });
  assert.equal(createRes.status, 201);
  const { student } = await createRes.json();

  const rawRow = runtime.sqliteDb
    .prepare('SELECT full_name, guardian_name, guardian_cnic, guardian_email, phone, address FROM local_school_students WHERE id = ? AND tenant_id = ?')
    .get(student.id, tenantId);

  assert.ok(rawRow, 'Student row must exist in SQLite');
  assert.ok(rawRow.full_name.startsWith('enc:v1:'), 'full_name must be encrypted at rest');
  assert.ok(rawRow.guardian_name.startsWith('enc:v1:'), 'guardian_name must be encrypted at rest');
  assert.ok(rawRow.guardian_cnic.startsWith('enc:v1:'), 'guardian_cnic must be encrypted at rest');
  assert.ok(rawRow.guardian_email.startsWith('enc:v1:'), 'guardian_email must be encrypted at rest');
  assert.ok(rawRow.phone.startsWith('enc:v1:'), 'phone must be encrypted at rest');
  assert.ok(rawRow.address.startsWith('enc:v1:'), 'address must be encrypted at rest');

  const getRes = await fetch(`${baseUrl}/api/school/students`, {
    headers: { 'x-tenant-id': tenantId }
  });
  const list = (await getRes.json()).students;
  const fetched = list.find((s) => s.id === student.id);
  assert.equal(fetched.fullName, 'Bilal Siddiqui');
  assert.equal(fetched.guardianName, 'Usman Siddiqui');
  assert.equal(fetched.guardianCnic, '61101-7788990-3');
  assert.equal(fetched.guardianEmail, 'usman.siddiqui@parent.test');
  assert.equal(fetched.phone, '+92 333 7788990');
  assert.equal(fetched.address, 'Sector G-11/2, Islamabad');
});

test('School API validates payloads cleanly and returns 400 for missing or negative fields', async () => {
  const tenantId = 'tenant-validation-check';
  const headers = { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-role': 'owner' };

  const badStudent = await fetch(`${baseUrl}/api/school/students`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fullName: '', grade: '' })
  });
  assert.equal(badStudent.status, 400);

  const negFeeStudent = await fetch(`${baseUrl}/api/school/students`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fullName: 'Valid Name', grade: 'Grade 5', feeAmount: -500 })
  });
  assert.equal(negFeeStudent.status, 400);

  const badFee = await fetch(`${baseUrl}/api/school/fees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ studentName: 'Valid', tuition: -100 })
  });
  assert.equal(badFee.status, 400);

  const badTeacher = await fetch(`${baseUrl}/api/school/teachers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Prof. Test', subject: 'Physics', basicSalary: -1000 })
  });
  assert.equal(badTeacher.status, 400);

  const badAdmission = await fetch(`${baseUrl}/api/school/admissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ applicant: 'No Guardian Info' })
  });
  assert.equal(badAdmission.status, 400);

  const badResult = await fetch(`${baseUrl}/api/school/results`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ marksObtained: 120, totalMarks: 100 })
  });
  assert.equal(badResult.status, 400);
});

test('School RBAC blocks student, parent, and non-executive teacher mutations with 403 ROLE_FORBIDDEN', async () => {
  const tenantId = 'tenant-rbac-check';

  const studentCreateAttempt = await fetch(`${baseUrl}/api/school/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-role': 'student' },
    body: JSON.stringify({ fullName: 'Blocked', grade: 'Grade 1' })
  });
  assert.equal(studentCreateAttempt.status, 403);
  assert.equal((await studentCreateAttempt.json()).error, 'ROLE_FORBIDDEN');

  const parentWorkspaceAttempt = await fetch(`${baseUrl}/api/school/workspace`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-role': 'parent' },
    body: JSON.stringify({ schoolName: 'Hijacked' })
  });
  assert.equal(parentWorkspaceAttempt.status, 403);

  const teacherPromoteAttempt = await fetch(`${baseUrl}/api/school/students/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-role': 'teacher' },
    body: JSON.stringify({ fromGrade: 'Grade 9', toGrade: 'Grade 10' })
  });
  assert.equal(teacherPromoteAttempt.status, 403);

  const teacherSalaryAttempt = await fetch(`${baseUrl}/api/school/teachers/salary/disburse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-role': 'teacher' },
    body: JSON.stringify({ teacherId: 't-1', month: 'April 2026' })
  });
  assert.equal(teacherSalaryAttempt.status, 403);
});

test('School workflows: Admission approve -> enrollment -> bulk challans -> fee collect -> promote -> SLC -> audit trail', async () => {
  const tenantId = 'tenant-workflow-e2e';
  const adminHeaders = { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-role': 'owner' };

  // 1. Submit online admission application
  const admRes = await fetch(`${baseUrl}/api/school/admissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({
      applicant: 'Zara Javed',
      appliedFor: 'Grade 7',
      fatherName: 'Javed Iqbal',
      phone: '+92 300 4411223',
      tuitionFee: 19500,
      discount: 1500,
      initialPaymentStatus: 'Pending'
    })
  });
  assert.equal(admRes.status, 201);
  const { admission } = await admRes.json();
  assert.equal(admission.status, 'Pending');

  // 2. Approve admission -> auto-enrolls student with pending balance
  const approveRes = await fetch(`${baseUrl}/api/school/admissions/${admission.id}/approve`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ remarks: 'Merit verified' })
  });
  assert.equal(approveRes.status, 200);
  const { student: enrolled } = await approveRes.json();
  assert.equal(enrolled.fullName, 'Zara Javed');
  assert.equal(enrolled.feeAmount, 18000);
  assert.equal(enrolled.feeStatus, 'PENDING');
  assert.equal(enrolled.dueBakaya, 18000);

  // 3. Bulk generate challans for Grade 7
  const bulkRes = await fetch(`${baseUrl}/api/school/fees/bulk-generate`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ month: 'May 2026', grades: ['Grade 7'], labFee: 1000 })
  });
  assert.equal(bulkRes.status, 200);
  const bulkJson = await bulkRes.json();
  assert.equal(bulkJson.count, 1);
  const challan = bulkJson.challans[0];
  assert.equal(challan.total, 19000);

  // 4. Collect generated challan -> settles fee & clears dueBakaya
  const collectRes = await fetch(`${baseUrl}/api/school/fees/collect`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ id: challan.id, studentId: enrolled.id, paymentMode: 'Meezan Bank Portal' })
  });
  assert.equal(collectRes.status, 200);
  const collectJson = await collectRes.json();
  assert.equal(collectJson.fee.status, 'PAID');

  const studentsAfterPay = (await (await fetch(`${baseUrl}/api/school/students`, {
    headers: { 'x-tenant-id': tenantId }
  })).json()).students;
  const refreshed = studentsAfterPay.find((s) => s.id === enrolled.id);
  assert.equal(refreshed.feeStatus, 'PAID');
  assert.equal(refreshed.dueBakaya, 0);

  // 5. Promote student to Grade 8
  const promoteRes = await fetch(`${baseUrl}/api/school/students/promote`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ studentIds: [enrolled.id], toGrade: 'Grade 8' })
  });
  assert.equal(promoteRes.status, 200);
  assert.equal((await promoteRes.json()).count, 1);

  // 6. Issue School Leaving Certificate (SLC) -> writes audit log
  const slcRes = await fetch(`${baseUrl}/api/school/students/slc`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ studentId: enrolled.id, reason: 'Family Relocation' })
  });
  assert.equal(slcRes.status, 200);
  const slcJson = await slcRes.json();
  assert.equal(slcJson.student.status, 'ALUMNI / SLC ISSUED');
  assert.ok(slcJson.student.slcSerial.startsWith('SLC-'));

  const auditRes = await fetch(`${baseUrl}/api/school/audit-logs`, {
    headers: { 'x-tenant-id': tenantId }
  });
  const auditLogs = (await auditRes.json()).logs;
  assert.ok(auditLogs.some((l) => l.entityId === slcJson.student.slcSerial));
});
