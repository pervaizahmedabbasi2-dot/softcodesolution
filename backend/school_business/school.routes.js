import express from 'express';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { getCryptoVault } from '../auth_security/crypto_vault.js';

export const SCHOOL_STUDENTS = [
  { id: 'STD-1001', rollNo: 'SCH-2026-01', fullName: 'Muhammad Daniyal', grade: 'Grade 8', section: 'A', gender: 'Male', dob: '2012-04-12', studentBForm: '35202-1122334-1', bloodGroup: 'B+', guardianName: 'Farhan Tariq', guardianRelation: 'Father', guardianCnic: '35202-9988776-1', guardianOccupation: 'Software Architect', guardianEmail: 'farhan.tariq@parent.pk', phone: '+92 300 1234567', emergencyContact: '+92 300 1234568', address: 'House 14-B, Model Town, Lahore', previousSchool: 'Beaconhouse Primary', medicalConditions: 'None', feeAmount: 18500, dueBakaya: 0, feeStatus: 'PAID', attendanceRate: '96%', admissionDate: '2025-08-15', status: 'ACTIVE' },
  { id: 'STD-1002', rollNo: 'SCH-2026-02', fullName: 'Fatima Noor', grade: 'Grade 10', section: 'B', gender: 'Female', dob: '2010-09-21', studentBForm: '35202-4455667-2', bloodGroup: 'O+', guardianName: 'Shahid Mehmood', guardianRelation: 'Father', guardianCnic: '35202-7766554-3', guardianOccupation: 'Civil Engineer', guardianEmail: 'shahid.mehmood@parent.pk', phone: '+92 321 7654321', emergencyContact: '+92 321 7654329', address: 'Street 8, DHA Phase 4, Lahore', previousSchool: 'City Grammar School', medicalConditions: 'Mild Peanut Allergy', feeAmount: 22000, dueBakaya: 22000, feeStatus: 'PENDING', attendanceRate: '92%', admissionDate: '2024-08-10', status: 'ACTIVE' },
  { id: 'STD-1003', rollNo: 'SCH-2026-03', fullName: 'Ayaan Ahmed Abbasi', grade: 'Grade 5', section: 'A', gender: 'Male', dob: '2015-02-05', studentBForm: '61101-8899001-1', bloodGroup: 'A+', guardianName: 'Ahmed Abbasi', guardianRelation: 'Father', guardianCnic: '61101-2233445-1', guardianOccupation: 'Medical Specialist', guardianEmail: 'ahmed.abbasi@parent.pk', phone: '+92 333 9988776', emergencyContact: '+92 333 9988770', address: 'Sector F-10/3, Islamabad', previousSchool: 'Froebel Early Years', medicalConditions: 'None', feeAmount: 15000, dueBakaya: 0, feeStatus: 'PAID', attendanceRate: '98%', admissionDate: '2026-01-10', status: 'ACTIVE' },
  { id: 'STD-1004', rollNo: 'SCH-2026-04', fullName: 'Zoya Khan', grade: 'Grade 7', section: 'C', gender: 'Female', dob: '2013-06-18', studentBForm: '35201-5566778-2', bloodGroup: 'AB+', guardianName: 'Imran Khan', guardianRelation: 'Father', guardianCnic: '35201-3344556-7', guardianOccupation: 'Business Owner', guardianEmail: 'imran.khan@parent.pk', phone: '+92 345 5544332', emergencyContact: '+92 345 5544339', address: 'Johar Town Block G, Lahore', previousSchool: 'Crescent Model School', medicalConditions: 'Asthma Inhaler', feeAmount: 18000, dueBakaya: 18000, feeStatus: 'OVERDUE', attendanceRate: '88%', admissionDate: '2025-09-01', status: 'ACTIVE' },
  { id: 'STD-1005', rollNo: 'SCH-2026-05', fullName: 'Hamza Bilal', grade: 'Grade 9', section: 'A', gender: 'Male', dob: '2011-11-30', studentBForm: '35202-6677889-1', bloodGroup: 'B-', guardianName: 'Bilal Arshad', guardianRelation: 'Father', guardianCnic: '35202-1199887-5', guardianOccupation: 'Chartered Accountant', guardianEmail: 'bilal.arshad@parent.pk', phone: '+92 312 4433221', emergencyContact: '+92 312 4433220', address: 'Gulberg III, Lahore', previousSchool: 'Aitchison Prep', medicalConditions: 'None', feeAmount: 20500, dueBakaya: 0, feeStatus: 'PAID', attendanceRate: '94%', admissionDate: '2024-08-15', status: 'ACTIVE' }
];

export const SCHOOL_FEES = [
  { id: 'FEE-8801', challanNo: 'CHLN-2026-8801', studentId: 'STD-1001', studentName: 'Muhammad Daniyal', rollNo: 'SCH-2026-01', grade: 'Grade 8', month: 'March 2026', tuition: 16000, labFee: 2500, discount: 0, total: 18500, status: 'PAID', paymentMode: 'Bank Transfer (Meezan)', resourceReference: 'TXN-88401', collectedBy: 'Accounts Desk', paidDate: '2026-03-05', dueDate: '2026-03-10' },
  { id: 'FEE-8802', challanNo: 'CHLN-2026-8802', studentId: 'STD-1002', studentName: 'Fatima Noor', rollNo: 'SCH-2026-02', grade: 'Grade 10', month: 'March 2026', tuition: 19000, labFee: 3000, discount: 0, total: 22000, status: 'PENDING', paymentMode: 'Pending', resourceReference: '', collectedBy: '', dueDate: '2026-03-25' },
  { id: 'FEE-8803', challanNo: 'CHLN-2026-8803', studentId: 'STD-1003', studentName: 'Ayaan Ahmed Abbasi', rollNo: 'SCH-2026-03', grade: 'Grade 5', month: 'March 2026', tuition: 13500, labFee: 1500, discount: 0, total: 15000, status: 'PAID', paymentMode: 'JazzCash / KuickPay', resourceReference: 'KP-90211', collectedBy: 'Online Portal', paidDate: '2026-03-02', dueDate: '2026-03-10' },
  { id: 'FEE-8804', challanNo: 'CHLN-2026-8804', studentId: 'STD-1004', studentName: 'Zoya Khan', rollNo: 'SCH-2026-04', grade: 'Grade 7', month: 'March 2026', tuition: 16000, labFee: 2000, discount: 0, total: 18000, status: 'OVERDUE', paymentMode: 'Pending', resourceReference: '', collectedBy: '', dueDate: '2026-03-10' }
];

export const SCHOOL_TEACHERS = [
  { id: 't-1', empCode: 'EMP-2021-01', name: 'Sir Farhan Qureshi', designation: 'Senior Subject Lead', department: 'Mathematics', qualification: 'M.Sc. Pure Mathematics', subject: 'Mathematics & Algebra', classes: 'Grade 8, 9, 10', inchargeClass: 'Grade 10 - A', gender: 'Male', cnic: '35202-1029384-1', phone: '+92 300 1234567', email: 'farhan.qureshi@campus.edu', salary: 'PKR 125,000', basicSalary: 125000, salaryStatus: 'Paid', status: 'ACTIVE', lastSalaryMonth: 'March 2026', salaryPaid: true, joiningDate: '2021-08-15' },
  { id: 't-2', empCode: 'EMP-2020-02', name: 'Dr. Saima Noor', designation: 'Head of Sciences', department: 'Sciences', qualification: 'Ph.D. Chemistry', subject: 'General Science & Physics', classes: 'Grade 7, 8, 9', inchargeClass: 'Grade 9 - A', gender: 'Female', cnic: '35202-5647382-2', phone: '+92 321 9876543', email: 'saima.noor@campus.edu', salary: 'PKR 145,000', basicSalary: 145000, salaryStatus: 'Paid', status: 'ACTIVE', lastSalaryMonth: 'March 2026', salaryPaid: true, joiningDate: '2020-02-01' },
  { id: 't-3', empCode: 'EMP-2022-03', name: 'Ms. Hina Aslam', designation: 'Senior Lecturer', department: 'Humanities', qualification: 'M.A. English Literature', subject: 'English & Composition', classes: 'Grade 6, 7, 8', inchargeClass: 'Grade 8 - B', gender: 'Female', cnic: '35202-3322110-2', phone: '+92 333 4567890', email: 'hina.aslam@campus.edu', salary: 'PKR 110,000', basicSalary: 110000, salaryStatus: 'Paid', status: 'ACTIVE', lastSalaryMonth: 'March 2026', salaryPaid: true, joiningDate: '2022-09-10' },
  { id: 't-4', empCode: 'EMP-2023-04', name: 'Engr. Rehan Ali', designation: 'STEM Coordinator', department: 'Computer Science', qualification: 'BS Computer Science', subject: 'Computer Science & Coding', classes: 'Grade 8, 9, 10', inchargeClass: 'Grade 8 - A', gender: 'Male', cnic: '35202-8877665-1', phone: '+92 312 3456789', email: 'rehan.ali@campus.edu', salary: 'PKR 135,000', basicSalary: 135000, salaryStatus: 'Pending', status: 'ACTIVE', lastSalaryMonth: 'February 2026', salaryPaid: false, joiningDate: '2023-01-15' },
  { id: 't-5', empCode: 'EMP-2019-05', name: 'Qari Abdul Rehman', designation: 'Senior Faculty', department: 'Languages & Islamiat', qualification: 'Shahadat-ul-Almiya', subject: 'Urdu & Islamic Studies', classes: 'Grade 6 to 10', inchargeClass: 'Grade 7 - A', gender: 'Male', cnic: '35202-9911223-1', phone: '+92 301 2345678', email: 'abdul.rehman@campus.edu', salary: 'PKR 95,000', basicSalary: 95000, salaryStatus: 'Paid', status: 'ACTIVE', lastSalaryMonth: 'March 2026', salaryPaid: true, joiningDate: '2019-05-20' }
];

export const SCHOOL_AUDIT_LOGS = [
  {
    id: 'AUD-2026-901',
    timestamp: '2026-10-24 11:45:20',
    operatorName: 'Dr. Tahir Malik',
    operatorRole: 'Principal',
    actionType: 'Fee Waiver / Concession',
    category: 'Financial',
    entityId: 'ST-1008',
    entityDescription: 'Mustafa Ali Shah (Class 10-A, Roll #1008)',
    details: 'Authorized 20% sibling hardship concession on monthly tuition (PKR 28,500 to PKR 22,800). Justification: Verified legal court affidavit.',
    severity: 'Authorized Override',
    verifiedBy: 'Board of Governors Audit Committee',
    ipAddress: '192.168.10.4 (Principal Office)'
  },
  {
    id: 'AUD-2026-902',
    timestamp: '2026-10-24 10:15:00',
    operatorName: 'Prof. Tariq Mehmood',
    operatorRole: 'Examination Dean',
    actionType: 'Mark Moderation Lock',
    category: 'Academic',
    entityId: 'EXM-MAT-10A',
    entityDescription: 'Terminal Mathematics Assessment Class 10-A',
    details: 'Moderation applied for Question 4 grading curve (+2 marks standard error). Gradebook tamper-lock activated.',
    severity: 'Normal Audit',
    verifiedBy: 'Controller of Examinations',
    ipAddress: '192.168.10.15 (Faculty Lab)'
  },
  {
    id: 'AUD-2026-903',
    timestamp: '2026-10-23 16:30:12',
    operatorName: 'Ch. Aslam Javed',
    operatorRole: 'Accounts Controller',
    actionType: 'Fee Voucher Deletion',
    category: 'Financial',
    entityId: 'CH-2026-8809',
    entityDescription: 'Duplicate Challan generated for Hamza Bilal (Roll #1003)',
    details: 'Voided duplicate tuition voucher #CH-2026-8809. Original voucher #CH-2026-8801 retained and marked Paid via JazzCash.',
    severity: 'Compliance Flag',
    verifiedBy: 'External Chartered Auditor',
    ipAddress: '192.168.10.22 (Bursar Counter)'
  }
];

export const SCHOOL_FEE_RECONCILIATION = [
  {
    id: 'REC-2026-W42',
    date: '2026-10-24',
    counterCashReceived: 342000,
    bankDepositedMeezan: 855000,
    bankDepositedHBL: 620000,
    onlineDigitalKuickPay: 418000,
    totalSystemBilled: 2235000,
    actualCollected: 2235000,
    varianceAmount: 0,
    reconciliationStatus: 'Balanced & Cleared',
    cashierName: 'Muhammad Rizwan (Senior Bursar)',
    verifiedByAuditor: 'External Audit Partner',
    notes: 'All counter receipts matched Meezan & HBL bank deposits 100%. No discrepancy.'
  }
];

export const SCHOOL_COMPLIANCE_ITEMS = [
  { id: 'CMP-1', area: 'Board Affiliation', title: 'Federal Board (FBISE) / Cambridge Affiliation Code', standard: 'Valid Session 2026-27 (Code: FBISE-ISB-8921)', status: 'Compliant & Verified', responsiblePerson: 'Registrar Academic', lastCheckedDate: '2026-09-01', nextRenewalDate: '2027-08-31', notes: 'Renewed for all Science and Computer groups.' },
  { id: 'CMP-2', area: 'Safety & Emergency', title: 'Campus Fire Hydrant & Evacuation Drill Audit', standard: 'Civil Defence Regulation NFPA-101', status: 'Compliant & Verified', responsiblePerson: 'Campus Security Incharge', lastCheckedDate: '2026-10-10', nextRenewalDate: '2026-12-10', notes: '48 fire extinguishers inspected; pressure green.' },
  { id: 'CMP-3', area: 'Financial Integrity', title: 'Bilingual Fee Vouchers & GST Exemption Registry', standard: 'FBR SRO 1145(I)/2022 Educational Exemption', status: 'Compliant & Verified', responsiblePerson: 'Head of Accounts', lastCheckedDate: '2026-10-01', nextRenewalDate: '2027-06-30', notes: 'Exemption certificates filed with tax authority.' },
  { id: 'CMP-4', area: 'Student Documentation', title: 'NADRA B-Form & Father CNIC Verification', standard: 'Ministry of Education Enrolment Mandate', status: 'Action Required', responsiblePerson: 'Admissions Office', lastCheckedDate: '2026-10-20', nextRenewalDate: '2026-11-05', notes: 'Pending B-Form copies from recently admitted primary students.' },
  { id: 'CMP-5', area: 'Transport Fleet', title: 'School Bus Fitness & Speed Governor Inspection', standard: 'Motorway Police & Traffic Safety Rules', status: 'Compliant & Verified', responsiblePerson: 'Transport Supervisor', lastCheckedDate: '2026-10-15', nextRenewalDate: '2026-11-15', notes: 'All buses equipped with active GPS and first-aid kits.' }
];

const ROOT_TENANT_ID = 'tenant-root-platform';

function ensureColumnMigrations(sqliteDb) {
  if (!sqliteDb) return;
  const safeAddCol = (table, col, def) => {
    try {
      const cols = sqliteDb.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
      if (!cols.includes(col)) {
        sqliteDb.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
      }
    } catch {
      // Table may not exist yet or SQLite locked; handled gracefully
    }
  };

  const studentCols = [
    ['tenant_id', "TEXT DEFAULT 'tenant-root-platform'"],
    ['gender', "TEXT DEFAULT 'Male'"],
    ['dob', 'TEXT'],
    ['student_bform', 'TEXT'],
    ['blood_group', "TEXT DEFAULT 'B+'"],
    ['guardian_relation', "TEXT DEFAULT 'Father'"],
    ['guardian_cnic', 'TEXT'],
    ['guardian_occupation', 'TEXT'],
    ['guardian_email', 'TEXT'],
    ['emergency_contact', 'TEXT'],
    ['address', 'TEXT'],
    ['previous_school', 'TEXT'],
    ['medical_conditions', 'TEXT'],
    ['fee_amount', 'REAL DEFAULT 18000'],
    ['due_bakaya', 'REAL DEFAULT 0'],
    ['attendance_rate', "TEXT DEFAULT '96%'"]
  ];
  for (const [c, d] of studentCols) safeAddCol('local_school_students', c, d);

  const feeCols = [
    ['tenant_id', "TEXT DEFAULT 'tenant-root-platform'"],
    ['student_id', 'TEXT'],
    ['payment_mode', 'TEXT'],
    ['resource_reference', 'TEXT'],
    ['collected_by', 'TEXT'],
    ['collector_role', "TEXT DEFAULT 'owner'"]
  ];
  for (const [c, d] of feeCols) safeAddCol('local_school_fees', c, d);

  const reconciliationCols = [
    ['submitted_by_role', "TEXT DEFAULT 'accountant'"],
    ['principal_collected', 'REAL DEFAULT 0'],
    ['accountant_collected', 'REAL DEFAULT 0'],
    ['online_collected', 'REAL DEFAULT 0'],
    ['opening_vault_cash', 'REAL DEFAULT 0'],
    ['petty_expenses', 'REAL DEFAULT 0'],
    ['closing_vault_cash', 'REAL DEFAULT 0'],
    ['bank_deposit_slip_no', 'TEXT'],
    ['owner_approval_status', "TEXT DEFAULT 'Pending Owner Review'"],
    ['owner_remarks', 'TEXT'],
    ['approved_by', 'TEXT'],
    ['approved_at', 'TEXT']
  ];
  for (const [c, d] of reconciliationCols) safeAddCol('local_school_reconciliation', c, d);

  safeAddCol('local_school_attendance', 'tenant_id', "TEXT DEFAULT 'tenant-root-platform'");
  safeAddCol('local_school_attendance', 'gate_name', "TEXT DEFAULT 'Main Turnstile 01'");

  const teacherCols = [
    ['tenant_id', "TEXT DEFAULT 'tenant-root-platform'"],
    ['subject', 'TEXT'],
    ['qualification', 'TEXT'],
    ['classes', 'TEXT'],
    ['incharge_class', 'TEXT'],
    ['gender', "TEXT DEFAULT 'Male'"],
    ['cnic', 'TEXT'],
    ['basic_salary', 'REAL DEFAULT 0'],
    ['salary_status', "TEXT DEFAULT 'Pending'"],
    ['last_salary_month', 'TEXT']
  ];
  for (const [c, d] of teacherCols) safeAddCol('local_school_teachers', c, d);

  safeAddCol('local_school_exams', 'tenant_id', "TEXT DEFAULT 'tenant-root-platform'");
  safeAddCol('local_school_results', 'tenant_id', "TEXT DEFAULT 'tenant-root-platform'");
}

export function createSchoolRouter(sqliteDb, db, getCollectionDocs, memorySeedData) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);
  ensureColumnMigrations(sqliteDb);

  const resolveTenantId = (req) =>
    String(req?.headers?.['x-tenant-id'] || req?.query?.tenantId || req?.body?.tenantId || ROOT_TENANT_ID).trim() || ROOT_TENANT_ID;

  const resolveUserRole = (req) =>
    String(req?.headers?.['x-user-role'] || req?.user?.role || '').trim().toLowerCase();

  const rejectRestrictedRole = (blockedRoles = ['student', 'parent']) => (req, res, next) => {
    const role = resolveUserRole(req);
    if (role && blockedRoles.includes(role)) {
      return res.status(403).json({
        ok: false,
        error: 'ROLE_FORBIDDEN',
        message: `Role '${role}' is not authorized to perform this administrative action.`
      });
    }
    next();
  };

  const defaultStudentsSeed = (memorySeedData?.SCHOOL_STUDENTS?.length ? memorySeedData.SCHOOL_STUDENTS : SCHOOL_STUDENTS);
  const defaultFeesSeed = (memorySeedData?.SCHOOL_FEES?.length ? memorySeedData.SCHOOL_FEES : SCHOOL_FEES);
  const defaultTeachersSeed = (memorySeedData?.SCHOOL_TEACHERS?.length ? memorySeedData.SCHOOL_TEACHERS : SCHOOL_TEACHERS);

  const dec = (tid, v) => (v == null ? '' : vault.decryptField(tid, v));
  const enc = (tid, v) => (v == null || v === '' ? '' : vault.encryptField(tid, String(v)));

  const recordAudit = (tid, entry) => {
    const id = entry.id || ('AUD-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900));
    const ts = entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
    const full = {
      id,
      tenantId: tid,
      timestamp: ts,
      operatorName: String(entry.operatorName || 'Authorized Admin'),
      operatorRole: String(entry.operatorRole || 'Principal'),
      actionType: String(entry.actionType || 'General Audit Action'),
      category: String(entry.category || 'Administrative'),
      entityId: String(entry.entityId || 'ENTITY-001'),
      entityDescription: String(entry.entityDescription || 'Campus Registry Record'),
      details: String(entry.details || 'Action verified and committed.'),
      severity: String(entry.severity || 'Normal Audit'),
      verifiedBy: String(entry.verifiedBy || 'System Audit Trail'),
      ipAddress: String(entry.ipAddress || 'Campus Node')
    };
    if (sqliteDb) {
      try {
        sqliteDb.prepare(`
          INSERT OR REPLACE INTO local_school_audit_logs
          (id, tenant_id, timestamp, operator_name, operator_role, action_type, category, entity_id, entity_description, details, severity, verified_by, ip_address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          full.id, tid, full.timestamp, full.operatorName, full.operatorRole, full.actionType,
          full.category, full.entityId, full.entityDescription, full.details, full.severity, full.verifiedBy, full.ipAddress
        );
      } catch {
        // non-fatal audit failure
      }
    }
    return full;
  };

  const mapStudentRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    rollNo: r.roll_no,
    fullName: dec(r.tenant_id || tid, r.full_name),
    grade: r.grade,
    section: r.section || 'A',
    gender: r.gender || 'Male',
    dob: r.dob || '',
    studentBForm: dec(r.tenant_id || tid, r.student_bform),
    bloodGroup: r.blood_group || 'B+',
    guardianName: dec(r.tenant_id || tid, r.guardian_name),
    guardianRelation: r.guardian_relation || 'Father',
    guardianCnic: dec(r.tenant_id || tid, r.guardian_cnic),
    guardianOccupation: r.guardian_occupation || '',
    guardianEmail: dec(r.tenant_id || tid, r.guardian_email),
    phone: dec(r.tenant_id || tid, r.phone),
    emergencyContact: dec(r.tenant_id || tid, r.emergency_contact),
    address: dec(r.tenant_id || tid, r.address),
    previousSchool: r.previous_school || '',
    medicalConditions: r.medical_conditions || 'None',
    feeAmount: Number(r.fee_amount ?? 18000),
    dueBakaya: Number(r.due_bakaya ?? 0),
    feeStatus: r.fee_status || 'PENDING',
    attendanceRate: r.attendance_rate || '96%',
    admissionDate: r.admission_date || '',
    status: r.status || 'ACTIVE',
    isSynced: r.is_synced === 1
  });

  // =========================================================================
  // STUDENTS DIRECTORY & LIFECYCLE
  // =========================================================================
  router.get('/students', async (req, res) => {
    const tid = resolveTenantId(req);
    let list = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb
          .prepare('SELECT * FROM local_school_students WHERE tenant_id = ? ORDER BY created_at DESC')
          .all(tid);
        list = rows.map((r) => mapStudentRow(r, tid));
      } catch {}
    }
    if (list.length === 0 && tid === ROOT_TENANT_ID) {
      const rawList = getCollectionDocs ? await getCollectionDocs('school_students', defaultStudentsSeed) : defaultStudentsSeed;
      list = rawList
        .filter((r) => !r.tenant_id || r.tenant_id === tid)
        .map((r) => vault.decryptFields(r.tenant_id || tid, r, ['fullName', 'guardianName', 'phone']));
    }
    res.json({ ok: true, tenantId: tid, students: list });
  });

  router.post('/students', rejectRestrictedRole(['student', 'parent', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const s = req.body || {};
    const fullName = String(s.fullName || s.name || '').trim();
    const grade = String(s.grade || s.classGrade || '').trim();
    if (!fullName || !grade) {
      return res.status(400).json({ ok: false, message: 'Student fullName and grade are required.' });
    }
    const feeAmount = Number(s.feeAmount ?? s.monthlyFee ?? 18000);
    const dueBakaya = Number(s.dueBakaya ?? 0);
    if (!Number.isFinite(feeAmount) || feeAmount < 0 || !Number.isFinite(dueBakaya) || dueBakaya < 0) {
      return res.status(400).json({ ok: false, message: 'Fee amounts must be non-negative numbers.' });
    }

    const uniqSuffix = `${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;
    const newStudent = {
      id: s.id || ('STD-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      rollNo: String(s.rollNo || `SCH-${new Date().getFullYear()}-${uniqSuffix}`).trim(),
      fullName,
      grade,
      section: String(s.section || 'A').trim(),
      gender: String(s.gender || 'Male').trim(),
      dob: String(s.dob || '').trim(),
      studentBForm: String(s.studentBForm || '').trim(),
      bloodGroup: String(s.bloodGroup || 'B+').trim(),
      guardianName: String(s.guardianName || s.guardian || 'Guardian').trim(),
      guardianRelation: String(s.guardianRelation || 'Father').trim(),
      guardianCnic: String(s.guardianCnic || '').trim(),
      guardianOccupation: String(s.guardianOccupation || '').trim(),
      guardianEmail: String(s.guardianEmail || '').trim(),
      phone: String(s.phone || s.guardianPhone || '+92 300 0000000').trim(),
      emergencyContact: String(s.emergencyContact || '').trim(),
      address: String(s.address || '').trim(),
      previousSchool: String(s.previousSchool || '').trim(),
      medicalConditions: String(s.medicalConditions || 'None').trim(),
      feeAmount,
      dueBakaya,
      feeStatus: String(s.feeStatus || (dueBakaya > 0 ? 'PENDING' : 'PAID')).toUpperCase(),
      attendanceRate: String(s.attendanceRate || '100%'),
      admissionDate: String(s.admissionDate || new Date().toISOString().split('T')[0]),
      status: String(s.status || 'ACTIVE').toUpperCase()
    };

    const encFullName = enc(tid, newStudent.fullName);
    const encGuardian = enc(tid, newStudent.guardianName);
    const encPhone = enc(tid, newStudent.phone);
    const encBForm = enc(tid, newStudent.studentBForm);
    const encCnic = enc(tid, newStudent.guardianCnic);
    const encEmail = enc(tid, newStudent.guardianEmail);
    const encEmerg = enc(tid, newStudent.emergencyContact);
    const encAddr = enc(tid, newStudent.address);

    if (sqliteDb) {
      try {
        sqliteDb.prepare(`
          INSERT INTO local_school_students (
            id, tenant_id, roll_no, full_name, grade, section, gender, dob, student_bform, blood_group,
            guardian_name, guardian_relation, guardian_cnic, guardian_occupation, guardian_email, phone,
            emergency_contact, address, previous_school, medical_conditions, fee_amount, due_bakaya,
            fee_status, attendance_rate, admission_date, status, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).run(
          newStudent.id, tid, newStudent.rollNo, encFullName, newStudent.grade, newStudent.section,
          newStudent.gender, newStudent.dob, encBForm, newStudent.bloodGroup, encGuardian,
          newStudent.guardianRelation, encCnic, newStudent.guardianOccupation, encEmail, encPhone,
          encEmerg, encAddr, newStudent.previousSchool, newStudent.medicalConditions,
          newStudent.feeAmount, newStudent.dueBakaya, newStudent.feeStatus, newStudent.attendanceRate,
          newStudent.admissionDate, newStudent.status, new Date().toISOString()
        );
      } catch (e) {
        return res.status(409).json({ ok: false, message: `Could not store student record: ${e.message}` });
      }
    }

    if (db) {
      setDoc(doc(db, 'school_students', newStudent.id), {
        ...newStudent,
        tenant_id: tid,
        fullName: encFullName,
        guardianName: encGuardian,
        phone: encPhone,
        studentBForm: encBForm,
        guardianCnic: encCnic,
        guardianEmail: encEmail,
        emergencyContact: encEmerg,
        address: encAddr,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }).then(() => {
        if (sqliteDb) {
          try { sqliteDb.prepare('UPDATE local_school_students SET is_synced = 1 WHERE id = ? AND tenant_id = ?').run(newStudent.id, tid); } catch {}
        }
      }).catch(() => {});
    }

    res.status(201).json({
      ok: true,
      message: 'Student admitted and encrypted in SQLite campus database (AES-256-GCM)',
      student: newStudent
    });
  });

  router.put('/students/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    const u = req.body || {};

    let existing = null;
    if (sqliteDb) {
      existing = sqliteDb.prepare('SELECT * FROM local_school_students WHERE id = ? AND tenant_id = ?').get(id, tid);
    }
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Student not found for this tenant' });
    }

    const fullName = u.fullName ?? u.name;
    const guardianName = u.guardianName ?? u.guardian;
    const phone = u.phone ?? u.guardianPhone;
    const encName = fullName ? enc(tid, fullName) : null;
    const encGuardian = guardianName ? enc(tid, guardianName) : null;
    const encPhone = phone ? enc(tid, phone) : null;
    const encBForm = u.studentBForm !== undefined ? enc(tid, u.studentBForm) : null;
    const encCnic = u.guardianCnic !== undefined ? enc(tid, u.guardianCnic) : null;
    const encEmail = u.guardianEmail !== undefined ? enc(tid, u.guardianEmail) : null;
    const encEmerg = u.emergencyContact !== undefined ? enc(tid, u.emergencyContact) : null;
    const encAddr = u.address !== undefined ? enc(tid, u.address) : null;

    sqliteDb.prepare(`
      UPDATE local_school_students SET
        roll_no = COALESCE(?, roll_no),
        full_name = COALESCE(?, full_name),
        grade = COALESCE(?, grade),
        section = COALESCE(?, section),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        student_bform = COALESCE(?, student_bform),
        blood_group = COALESCE(?, blood_group),
        guardian_name = COALESCE(?, guardian_name),
        guardian_relation = COALESCE(?, guardian_relation),
        guardian_cnic = COALESCE(?, guardian_cnic),
        guardian_occupation = COALESCE(?, guardian_occupation),
        guardian_email = COALESCE(?, guardian_email),
        phone = COALESCE(?, phone),
        emergency_contact = COALESCE(?, emergency_contact),
        address = COALESCE(?, address),
        previous_school = COALESCE(?, previous_school),
        medical_conditions = COALESCE(?, medical_conditions),
        fee_amount = COALESCE(?, fee_amount),
        due_bakaya = COALESCE(?, due_bakaya),
        fee_status = COALESCE(?, fee_status),
        attendance_rate = COALESCE(?, attendance_rate),
        status = COALESCE(?, status),
        is_synced = 0
      WHERE id = ? AND tenant_id = ?
    `).run(
      u.rollNo ?? null, encName, u.grade ?? null, u.section ?? null, u.gender ?? null, u.dob ?? null,
      encBForm, u.bloodGroup ?? null, encGuardian, u.guardianRelation ?? null, encCnic,
      u.guardianOccupation ?? null, encEmail, encPhone, encEmerg, encAddr,
      u.previousSchool ?? null, u.medicalConditions ?? null,
      u.feeAmount !== undefined ? Number(u.feeAmount) : null,
      u.dueBakaya !== undefined ? Number(u.dueBakaya) : null,
      u.feeStatus ?? null, u.attendanceRate ?? null, u.status ?? null, id, tid
    );

    const updatedRow = sqliteDb.prepare('SELECT * FROM local_school_students WHERE id = ? AND tenant_id = ?').get(id, tid);
    const updated = mapStudentRow(updatedRow, tid);

    if (db) {
      const cloudUpdates = { ...u, tenant_id: tid };
      if (encName) cloudUpdates.fullName = encName;
      if (encGuardian) cloudUpdates.guardianName = encGuardian;
      if (encPhone) cloudUpdates.phone = encPhone;
      try { await updateDoc(doc(db, 'school_students', id), cloudUpdates); } catch {}
    }

    res.json({ ok: true, message: 'Student record updated', student: updated });
  });

  router.delete('/students/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const existing = sqliteDb.prepare('SELECT id, full_name FROM local_school_students WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Student not found for this tenant' });
    }
    sqliteDb.prepare('DELETE FROM local_school_students WHERE id = ? AND tenant_id = ?').run(id, tid);
    recordAudit(tid, {
      operatorName: String(req.headers['x-user-name'] || 'Campus Admin'),
      operatorRole: String(req.headers['x-user-role'] || 'Principal'),
      actionType: 'Student Registry Deletion',
      category: 'Administrative',
      entityId: id,
      entityDescription: `Deleted student profile ${dec(tid, existing.full_name)}`,
      severity: 'Compliance Flag'
    });
    res.json({ ok: true, message: 'Student removed from tenant registry', id });
  });

  router.post('/students/promote', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const { fromGrade, toGrade, studentIds } = req.body || {};
    if (!toGrade) {
      return res.status(400).json({ ok: false, message: 'Target grade (toGrade) is required.' });
    }
    let count = 0;
    if (sqliteDb) {
      if (Array.isArray(studentIds) && studentIds.length > 0) {
        const stmt = sqliteDb.prepare('UPDATE local_school_students SET grade = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?');
        for (const sid of studentIds) {
          const info = stmt.run(toGrade, sid, tid);
          count += info.changes || 0;
        }
      } else if (fromGrade) {
        const info = sqliteDb.prepare('UPDATE local_school_students SET grade = ?, is_synced = 0 WHERE grade = ? AND tenant_id = ?').run(toGrade, fromGrade, tid);
        count = info.changes || 0;
      }
    }
    res.json({ ok: true, message: `Successfully promoted ${count} student(s) from ${fromGrade || 'selected'} to ${toGrade}`, count });
  });

  router.post('/students/slc', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const { studentId, reason, conduct } = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_students WHERE id = ? AND tenant_id = ?').get(studentId, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Student not found for this tenant' });

    const newStatus = 'ALUMNI / SLC ISSUED';
    const slcDate = new Date().toISOString().split('T')[0];
    const slcSerial = 'SLC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    sqliteDb.prepare('UPDATE local_school_students SET status = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(newStatus, studentId, tid);

    const updated = {
      ...mapStudentRow(row, tid),
      status: newStatus,
      slcDate,
      slcSerial,
      slcReason: reason || 'Parent Relocation / Graduated',
      slcConduct: conduct || 'Exemplary & Diligent'
    };
    recordAudit(tid, {
      actionType: 'Student Leaving Certificate (SLC)',
      category: 'Administrative',
      entityId: slcSerial,
      entityDescription: `${updated.fullName} (${updated.rollNo})`,
      details: `Issued SLC ${slcSerial}. Reason: ${updated.slcReason}. Conduct: ${updated.slcConduct}.`,
      severity: 'Normal Audit'
    });
    if (db) {
      try { await updateDoc(doc(db, 'school_students', studentId), { status: newStatus, slcSerial, slcDate }); } catch {}
    }
    res.json({ ok: true, message: `School Leaving Certificate generated for ${updated.fullName}`, student: updated });
  });

  // =========================================================================
  // ADMISSIONS APPLICATIONS PIPELINE
  // =========================================================================
  const mapAdmissionRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    applicant: dec(r.tenant_id || tid, r.applicant),
    appliedFor: r.applied_for,
    section: r.section || 'A',
    rollNo: r.roll_no || '',
    fatherName: dec(r.tenant_id || tid, r.father_name),
    relation: r.relation || 'Father',
    fatherCnic: dec(r.tenant_id || tid, r.father_cnic),
    studentBForm: dec(r.tenant_id || tid, r.student_bform),
    dob: r.dob || '',
    gender: r.gender || 'Male',
    bloodGroup: r.blood_group || 'B+',
    phone: dec(r.tenant_id || tid, r.phone),
    email: dec(r.tenant_id || tid, r.email),
    fatherOccupation: r.father_occupation || '',
    address: dec(r.tenant_id || tid, r.address),
    previousSchool: r.previous_school || '',
    medicalNotes: r.medical_notes || 'None',
    emergencyContact: dec(r.tenant_id || tid, r.emergency_contact),
    admissionFee: Number(r.admission_fee ?? 25000),
    tuitionFee: Number(r.tuition_fee ?? 18000),
    discount: Number(r.discount ?? 0),
    initialPaymentStatus: r.initial_payment_status || 'Paid',
    score: r.score || 'Pending Assessment',
    status: r.status || 'Pending',
    source: r.source || 'School Office Direct',
    decisionRemarks: r.decision_remarks || '',
    date: r.date || ''
  });

  router.get('/admissions', (req, res) => {
    const tid = resolveTenantId(req);
    let list = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_admissions WHERE tenant_id = ? ORDER BY created_at DESC').all(tid);
        list = rows.map((r) => mapAdmissionRow(r, tid));
      } catch {}
    }
    res.json({ ok: true, tenantId: tid, admissions: list });
  });

  router.post('/admissions', (req, res) => {
    const tid = resolveTenantId(req);
    const a = req.body || {};
    const applicant = String(a.applicant || a.fullName || '').trim();
    const appliedFor = String(a.appliedFor || a.grade || '').trim();
    const fatherName = String(a.fatherName || a.guardianName || '').trim();
    const phone = String(a.phone || '').trim();
    if (!applicant || !appliedFor || !fatherName || !phone) {
      return res.status(400).json({ ok: false, message: 'Applicant name, class appliedFor, fatherName, and phone are required.' });
    }
    const id = a.id || ('ADM-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90));
    const date = String(a.date || new Date().toISOString().split('T')[0]);
    const admFee = Number(a.admissionFee ?? 25000);
    const tuiFee = Number(a.tuitionFee ?? 18000);
    const discount = Number(a.discount ?? 0);
    if (admFee < 0 || tuiFee < 0 || discount < 0) {
      return res.status(400).json({ ok: false, message: 'Fee values cannot be negative.' });
    }

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT INTO local_school_admissions (
          id, tenant_id, applicant, applied_for, section, roll_no, father_name, relation, father_cnic, student_bform,
          dob, gender, blood_group, phone, email, father_occupation, address, previous_school, emergency_contact,
          medical_notes, admission_fee, tuition_fee, discount, initial_payment_status, score, status, source, decision_remarks, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, tid, enc(tid, applicant), appliedFor, a.section || 'A', a.rollNo || '',
        enc(tid, fatherName), a.relation || 'Father', enc(tid, a.fatherCnic || ''), enc(tid, a.studentBForm || ''),
        a.dob || '', a.gender || 'Male', a.bloodGroup || 'B+', enc(tid, phone), enc(tid, a.email || ''),
        a.fatherOccupation || '', enc(tid, a.address || ''), a.previousSchool || '', enc(tid, a.emergencyContact || ''),
        a.medicalNotes || 'None', admFee, tuiFee, discount, a.initialPaymentStatus || 'Paid',
        a.score || 'Pending Assessment', a.status || 'Pending', a.source || 'School Office Direct',
        a.decisionRemarks || '', date
      );
    }

    const saved = {
      id, tenantId: tid, applicant, appliedFor, section: a.section || 'A', rollNo: a.rollNo || '',
      fatherName, relation: a.relation || 'Father', fatherCnic: a.fatherCnic || '', studentBForm: a.studentBForm || '',
      dob: a.dob || '', gender: a.gender || 'Male', bloodGroup: a.bloodGroup || 'B+', phone, email: a.email || '',
      fatherOccupation: a.fatherOccupation || '', address: a.address || '', previousSchool: a.previousSchool || '',
      emergencyContact: a.emergencyContact || '', medicalNotes: a.medicalNotes || 'None',
      admissionFee: admFee, tuitionFee: tuiFee, discount, initialPaymentStatus: a.initialPaymentStatus || 'Paid',
      score: a.score || 'Pending Assessment', status: a.status || 'Pending',
      source: a.source || 'School Office Direct', decisionRemarks: a.decisionRemarks || '', date
    };
    res.status(201).json({ ok: true, admission: saved });
  });

  router.put('/admissions/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    const u = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_admissions WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Admission application not found' });

    sqliteDb.prepare(`
      UPDATE local_school_admissions SET
        applicant = COALESCE(?, applicant),
        applied_for = COALESCE(?, applied_for),
        section = COALESCE(?, section),
        father_name = COALESCE(?, father_name),
        phone = COALESCE(?, phone),
        status = COALESCE(?, status),
        score = COALESCE(?, score),
        decision_remarks = COALESCE(?, decision_remarks)
      WHERE id = ? AND tenant_id = ?
    `).run(
      u.applicant ? enc(tid, u.applicant) : null,
      u.appliedFor ?? null,
      u.section ?? null,
      u.fatherName ? enc(tid, u.fatherName) : null,
      u.phone ? enc(tid, u.phone) : null,
      u.status ?? null,
      u.score ?? null,
      u.decisionRemarks ?? null,
      id, tid
    );
    const updated = sqliteDb.prepare('SELECT * FROM local_school_admissions WHERE id = ? AND tenant_id = ?').get(id, tid);
    res.json({ ok: true, admission: mapAdmissionRow(updated, tid) });
  });

  router.post('/admissions/:id/approve', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_admissions WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Admission application not found' });

    const adm = mapAdmissionRow(row, tid);
    sqliteDb.prepare('UPDATE local_school_admissions SET status = ?, decision_remarks = ? WHERE id = ? AND tenant_id = ?')
      .run('Approved', String(req.body?.remarks || 'Approved and Enrolled into Active Student Directory'), id, tid);

    const stdId = 'STD-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90);
    const rollNo = adm.rollNo || `SCH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const feeAmount = Math.max(0, Number(adm.tuitionFee || 18000) - Number(adm.discount || 0));
    const admissionDate = new Date().toISOString().split('T')[0];

    sqliteDb.prepare(`
      INSERT INTO local_school_students (
        id, tenant_id, roll_no, full_name, grade, section, gender, dob, student_bform, blood_group,
        guardian_name, guardian_relation, guardian_cnic, guardian_occupation, guardian_email, phone,
        emergency_contact, address, previous_school, medical_conditions, fee_amount, due_bakaya,
        fee_status, attendance_rate, admission_date, status, is_synced, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      stdId, tid, rollNo, enc(tid, adm.applicant), adm.appliedFor, adm.section || 'A', adm.gender || 'Male',
      adm.dob || '', enc(tid, adm.studentBForm), adm.bloodGroup || 'B+', enc(tid, adm.fatherName),
      adm.relation || 'Father', enc(tid, adm.fatherCnic), adm.fatherOccupation || '', enc(tid, adm.email),
      enc(tid, adm.phone), enc(tid, adm.emergencyContact), enc(tid, adm.address), adm.previousSchool || '',
      adm.medicalNotes || 'None', feeAmount, adm.initialPaymentStatus === 'Paid' ? 0 : feeAmount,
      adm.initialPaymentStatus === 'Paid' ? 'PAID' : 'PENDING', '100%', admissionDate, 'ACTIVE', new Date().toISOString()
    );

    const enrolled = mapStudentRow(sqliteDb.prepare('SELECT * FROM local_school_students WHERE id = ?').get(stdId), tid);
    res.json({ ok: true, message: `${adm.applicant} approved and enrolled cleanly.`, student: enrolled });
  });

  router.delete('/admissions/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const info = sqliteDb.prepare('DELETE FROM local_school_admissions WHERE id = ? AND tenant_id = ?').run(req.params.id, tid);
    if (!info.changes) return res.status(404).json({ ok: false, message: 'Admission application not found' });
    res.json({ ok: true, id: req.params.id });
  });

  // =========================================================================
  // FEES & ACCOUNTANT BILLING LEDGER
  // =========================================================================
  const mapFeeRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    challanNo: r.challan_no,
    studentId: r.student_id || '',
    studentName: dec(r.tenant_id || tid, r.student_name),
    rollNo: r.roll_no,
    grade: r.grade,
    month: r.month,
    tuition: Number(r.tuition || 0),
    labFee: Number(r.lab_fee || 0),
    discount: Number(r.discount || 0),
    total: Number(r.total || 0),
    status: r.status || 'PENDING',
    paymentMode: r.payment_mode || '',
    resourceReference: r.resource_reference || '',
    collectedBy: r.collected_by || '',
    collectorRole: r.collector_role || 'owner',
    dueDate: r.due_date || '',
    paidDate: r.paid_date || '',
    isSynced: r.is_synced === 1
  });

  router.get('/fees', async (req, res) => {
    const tid = resolveTenantId(req);
    let list = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_fees WHERE tenant_id = ? ORDER BY created_at DESC').all(tid);
        list = rows.map((r) => mapFeeRow(r, tid));
      } catch {}
    }
    if (list.length === 0 && tid === ROOT_TENANT_ID) {
      list = getCollectionDocs ? await getCollectionDocs('school_fees', defaultFeesSeed) : defaultFeesSeed;
    }
    res.json({ ok: true, tenantId: tid, fees: list });
  });

  router.post('/fees', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const f = req.body || {};
    const studentName = String(f.studentName || '').trim();
    if (!studentName) {
      return res.status(400).json({ ok: false, message: 'studentName is required to generate a fee challan.' });
    }
    const tuition = Number(f.tuition ?? 12000);
    const labFee = Number(f.labFee ?? 1500);
    const discount = Number(f.discount ?? 0);
    const computedTotal = (tuition + labFee) - discount;
    const total = f.total !== undefined ? Number(f.total) : computedTotal;
    if (!Number.isFinite(tuition) || tuition < 0 || !Number.isFinite(labFee) || labFee < 0 || !Number.isFinite(discount) || discount < 0 || !Number.isFinite(total) || total < 0) {
      return res.status(400).json({ ok: false, message: 'Fee amounts must be valid non-negative numbers.' });
    }

    const reqRole = resolveUserRole(req);
    const collectorRole = String(f.collectorRole || reqRole || 'owner').toLowerCase();

    const newFee = {
      id: f.id || ('FEE-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      challanNo: f.challanNo || (`CHLN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`),
      studentId: String(f.studentId || ''),
      studentName,
      rollNo: String(f.rollNo || 'SCH-GEN'),
      grade: String(f.grade || 'Grade 8'),
      month: String(f.month || 'Current Month'),
      tuition,
      labFee,
      discount,
      total,
      status: String(f.status || 'PENDING').toUpperCase(),
      paymentMode: String(f.paymentMode || ''),
      resourceReference: String(f.resourceReference || ''),
      collectedBy: String(f.collectedBy || (collectorRole === 'accountant' ? 'Accountant / Fee Desk' : '')),
      collectorRole,
      dueDate: String(f.dueDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]),
      paidDate: String(f.paidDate || '')
    };

    const encStudentName = enc(tid, newFee.studentName);
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT INTO local_school_fees (
          id, tenant_id, challan_no, student_id, student_name, roll_no, grade, month, tuition, lab_fee,
          discount, total, status, payment_mode, resource_reference, collected_by, collector_role, due_date, paid_date, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        newFee.id, tid, newFee.challanNo, newFee.studentId, encStudentName, newFee.rollNo, newFee.grade,
        newFee.month, newFee.tuition, newFee.labFee, newFee.discount, newFee.total, newFee.status,
        newFee.paymentMode, newFee.resourceReference, newFee.collectedBy, newFee.collectorRole, newFee.dueDate, newFee.paidDate,
        new Date().toISOString()
      );
      if (collectorRole === 'accountant') {
        recordAudit(tid, {
          operatorName: newFee.collectedBy || 'Accountant / Fee Clerk',
          operatorRole: 'Accountant / Fee Clerk',
          actionType: 'Fee Challan Generated',
          category: 'Financial',
          entityId: newFee.challanNo,
          entityDescription: `${newFee.studentName} (${newFee.grade}) — ${newFee.month}`,
          details: `Fee challan #${newFee.challanNo} generated for PKR ${newFee.total}. Due: ${newFee.dueDate}.`,
          severity: 'Normal Audit',
          verifiedBy: 'Pending Collection / Owner Oversight'
        });
      }
    }

    if (db) {
      setDoc(doc(db, 'school_fees', newFee.id), {
        ...newFee,
        tenant_id: tid,
        studentName: encStudentName,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }).then(() => {
        if (sqliteDb) {
          try { sqliteDb.prepare('UPDATE local_school_fees SET is_synced = 1 WHERE id = ? AND tenant_id = ?').run(newFee.id, tid); } catch {}
        }
      }).catch(() => {});
    }

    res.status(201).json({ ok: true, message: 'Fee challan recorded in SQLite & synced to Cloud', fee: newFee });
  });

  router.post('/fees/bulk-generate', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const { month = 'April 2026', dueDate, baseTuition = 18000, labFee = 1500, grades } = req.body || {};
    if (Number(baseTuition) < 0 || Number(labFee) < 0) {
      return res.status(400).json({ ok: false, message: 'Base tuition and lab fee must be non-negative.' });
    }

    let targetStudents = [];
    if (sqliteDb) {
      const rows = sqliteDb.prepare('SELECT * FROM local_school_students WHERE tenant_id = ?').all(tid);
      targetStudents = rows
        .map((r) => mapStudentRow(r, tid))
        .filter((s) => !String(s.status || '').includes('ALUMNI') && (!Array.isArray(grades) || grades.length === 0 || grades.includes(s.grade)));
    }
    if (targetStudents.length === 0 && tid === ROOT_TENANT_ID) {
      targetStudents = defaultStudentsSeed.filter((s) => !Array.isArray(grades) || grades.length === 0 || grades.includes(s.grade));
    }

    const resolvedDue = dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    const generated = [];
    const reqRole = resolveUserRole(req) || 'accountant';

    for (const st of targetStudents) {
      const exists = sqliteDb
        ? sqliteDb.prepare('SELECT id FROM local_school_fees WHERE tenant_id = ? AND roll_no = ? AND month = ?').get(tid, st.rollNo, month)
        : null;
      if (!exists) {
        const tuitionAmt = Number(st.feeAmount || baseTuition);
        const labAmt = Number(labFee);
        const total = tuitionAmt + labAmt;
        const challan = {
          id: 'FEE-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
          tenantId: tid,
          challanNo: 'CHLN-' + month.replace(/\s+/g, '').substring(0, 4).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000),
          studentId: st.id,
          studentName: st.fullName,
          rollNo: st.rollNo,
          grade: st.grade,
          month,
          tuition: tuitionAmt,
          labFee: labAmt,
          discount: 0,
          total,
          status: 'PENDING',
          collectorRole: reqRole,
          dueDate: resolvedDue
        };
        const encName = enc(tid, challan.studentName);
        if (sqliteDb) {
          sqliteDb.prepare(`
            INSERT INTO local_school_fees (
              id, tenant_id, challan_no, student_id, student_name, roll_no, grade, month,
              tuition, lab_fee, discount, total, status, collector_role, due_date, is_synced, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
          `).run(
            challan.id, tid, challan.challanNo, challan.studentId, encName, challan.rollNo, challan.grade,
            challan.month, challan.tuition, challan.labFee, 0, challan.total, 'PENDING', challan.collectorRole, resolvedDue,
            new Date().toISOString()
          );
        }
        generated.push(challan);
        if (db) {
          try { setDoc(doc(db, 'school_fees', challan.id), { ...challan, tenant_id: tid, studentName: encName }); } catch {}
        }
      }
    }

    if (generated.length > 0) {
      recordAudit(tid, {
        operatorName: reqRole === 'accountant' ? 'Accountant / Fee Clerk' : 'Admin Desk',
        operatorRole: reqRole === 'accountant' ? 'Accountant / Fee Clerk' : 'Principal',
        actionType: 'Bulk Challan Generation',
        category: 'Financial',
        entityId: month,
        entityDescription: `Generated ${generated.length} bulk challans for ${month}`,
        details: `Bulk challans issued for grades: ${Array.isArray(grades) && grades.length ? grades.join(', ') : 'All Grades'}.`,
        severity: 'Normal Audit'
      });
    }

    res.json({
      ok: true,
      message: `Bulk generation complete: ${generated.length} fee challan(s) created for ${month}.`,
      count: generated.length,
      challans: generated
    });
  });

  router.post('/fees/collect', async (req, res) => {
    const tid = resolveTenantId(req);
    const body = req.body || {};
    const {
      id,
      studentId,
      studentName,
      rollNo = 'SCH-GEN',
      grade = 'Campus',
      month = 'Current Session Fee',
      amount,
      receiptNo,
      challanNo,
      paymentMode = body.paymentMethod || 'Cash Counter',
      resourceReference = '',
      collectedBy = 'Accounts Desk'
    } = body;
    const reqRole = resolveUserRole(req);
    const collectorRole = String(body.collectorRole || reqRole || (String(collectedBy).toLowerCase().includes('principal') ? 'principal' : 'accountant')).toLowerCase();
    const paidDate = new Date().toISOString().split('T')[0];

    let updatedFee = null;
    if (sqliteDb && id) {
      const row = sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(id, tid);
      if (row) {
        sqliteDb.prepare(`
          UPDATE local_school_fees
          SET status = 'PAID', paid_date = ?, payment_mode = ?, resource_reference = ?, collected_by = ?, collector_role = ?, is_synced = 0
          WHERE id = ? AND tenant_id = ?
        `).run(paidDate, paymentMode, resourceReference, collectedBy, collectorRole, id, tid);
        updatedFee = mapFeeRow(sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(id, tid), tid);
      }
    }

    if (sqliteDb && !updatedFee && studentName && Number(amount) > 0) {
      const feeId = 'FEE-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90);
      const resolvedChallanNo = String(challanNo || receiptNo || (`REC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`));
      const numAmount = Number(amount);
      const encStuName = enc(tid, String(studentName).trim());
      sqliteDb.prepare(`
        INSERT INTO local_school_fees (
          id, tenant_id, challan_no, student_id, student_name, roll_no, grade, month, tuition, lab_fee,
          discount, total, status, payment_mode, resource_reference, collected_by, collector_role, due_date, paid_date, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'PAID', ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        feeId, tid, resolvedChallanNo, String(studentId || ''), encStuName, String(rollNo), String(grade),
        String(month), numAmount, numAmount, String(paymentMode), String(resourceReference),
        String(collectedBy), collectorRole, paidDate, paidDate, new Date().toISOString()
      );
      updatedFee = mapFeeRow(sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(feeId, tid), tid);
    }

    const targetStdId = studentId || updatedFee?.studentId;
    if (sqliteDb && targetStdId) {
      sqliteDb.prepare("UPDATE local_school_students SET fee_status = 'PAID', due_bakaya = 0, is_synced = 0 WHERE id = ? AND tenant_id = ?")
        .run(targetStdId, tid);
    }

    if (updatedFee) {
      recordAudit(tid, {
        operatorName: collectedBy || (collectorRole === 'accountant' ? 'Accountant / Fee Clerk' : 'Principal Office'),
        operatorRole: collectorRole === 'accountant' ? 'Accountant / Fee Clerk' : (collectorRole === 'principal' ? 'Principal' : 'School Owner'),
        actionType: 'Fee Receipt Collected',
        category: 'Financial',
        entityId: updatedFee.challanNo || updatedFee.id,
        entityDescription: `${updatedFee.studentName} (${updatedFee.grade})`,
        details: `Collected PKR ${updatedFee.total} via ${paymentMode}${resourceReference ? ' (Ref: ' + resourceReference + ')' : ''} [Collector: ${collectorRole.toUpperCase()}].`,
        severity: 'Normal Audit',
        verifiedBy: collectorRole === 'accountant' ? 'Pending Owner Daily Closing' : 'Principal / Owner Desk'
      });
    }

    if (updatedFee && db) {
      try {
        await setDoc(doc(db, 'school_fees', updatedFee.id), {
          ...updatedFee,
          tenant_id: tid,
          studentName: enc(tid, updatedFee.studentName),
          is_synced: 1,
          synced_at: new Date().toISOString()
        }, { merge: true });
      } catch {}
    }

    res.json({
      ok: true,
      message: updatedFee ? `Fee collected for ${updatedFee.studentName}` : 'Fee status updated to PAID',
      fee: updatedFee
    });
  });

  router.delete('/fees/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Fee challan not found for this tenant' });
    sqliteDb.prepare('DELETE FROM local_school_fees WHERE id = ? AND tenant_id = ?').run(id, tid);
    recordAudit(tid, {
      actionType: 'Fee Voucher Deletion',
      category: 'Financial',
      entityId: row.challan_no || id,
      entityDescription: `Voided fee voucher for ${dec(tid, row.student_name)}`,
      severity: 'Compliance Flag'
    });
    res.json({ ok: true, id });
  });

  // =========================================================================
  // TEACHERS & FACULTY PAYROLL
  // =========================================================================
  const mapTeacherRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    empCode: r.emp_code,
    name: dec(r.tenant_id || tid, r.name),
    designation: r.designation,
    department: r.department,
    subject: r.subject || r.department,
    qualification: r.qualification || 'Masters',
    classes: r.classes || 'All Assigned',
    inchargeClass: r.incharge_class || '',
    gender: r.gender || 'Male',
    cnic: dec(r.tenant_id || tid, r.cnic),
    phone: dec(r.tenant_id || tid, r.phone),
    email: dec(r.tenant_id || tid, r.email),
    salary: dec(r.tenant_id || tid, r.salary),
    basicSalary: Number(r.basic_salary || 0),
    salaryStatus: r.salary_status || 'Pending',
    lastSalaryMonth: r.last_salary_month || 'Current',
    salaryPaid: String(r.salary_status || '').toLowerCase() === 'paid',
    status: r.status || 'ACTIVE',
    isSynced: r.is_synced === 1
  });

  router.get('/teachers', async (req, res) => {
    const tid = resolveTenantId(req);
    let list = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE tenant_id = ? ORDER BY created_at DESC').all(tid);
        list = rows.map((r) => mapTeacherRow(r, tid));
      } catch {}
    }
    if (list.length === 0 && tid === ROOT_TENANT_ID) {
      list = getCollectionDocs ? await getCollectionDocs('school_teachers', defaultTeachersSeed) : defaultTeachersSeed;
    }
    res.json({ ok: true, tenantId: tid, teachers: list });
  });

  router.post('/teachers', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const t = req.body || {};
    const name = String(t.name || '').trim();
    const subject = String(t.subject || t.department || '').trim();
    if (!name || !subject) {
      return res.status(400).json({ ok: false, message: 'Teacher name and subject/department are required.' });
    }
    const basicSalary = Number(t.basicSalary ?? t.salary ?? 85000);
    if (!Number.isFinite(basicSalary) || basicSalary < 0) {
      return res.status(400).json({ ok: false, message: 'basicSalary must be a valid non-negative number.' });
    }

    const teacher = {
      id: t.id || ('t-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      empCode: String(t.empCode || `EMP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`),
      name,
      designation: String(t.designation || 'Lecturer'),
      department: String(t.department || subject),
      subject,
      qualification: String(t.qualification || 'M.Sc / M.A.'),
      classes: String(t.classes || 'Assigned Classes'),
      inchargeClass: String(t.inchargeClass || ''),
      gender: String(t.gender || 'Male'),
      cnic: String(t.cnic || ''),
      phone: String(t.phone || '+92 300 0000000'),
      email: String(t.email || ''),
      salary: typeof t.salary === 'string' && t.salary ? t.salary : `PKR ${basicSalary.toLocaleString()}`,
      basicSalary,
      salaryStatus: String(t.salaryStatus || 'Pending'),
      lastSalaryMonth: String(t.lastSalaryMonth || 'Pending Disbursement'),
      status: String(t.status || 'ACTIVE')
    };

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT INTO local_school_teachers (
          id, tenant_id, emp_code, name, designation, department, subject, qualification, classes,
          incharge_class, gender, cnic, phone, email, salary, basic_salary, salary_status,
          last_salary_month, status, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        teacher.id, tid, teacher.empCode, enc(tid, teacher.name), teacher.designation, teacher.department,
        teacher.subject, teacher.qualification, teacher.classes, teacher.inchargeClass, teacher.gender,
        enc(tid, teacher.cnic), enc(tid, teacher.phone), enc(tid, teacher.email), enc(tid, teacher.salary),
        teacher.basicSalary, teacher.salaryStatus, teacher.lastSalaryMonth, teacher.status, new Date().toISOString()
      );
    }

    res.status(201).json({ ok: true, teacher });
  });

  router.put('/teachers/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    const u = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Teacher not found for this tenant' });

    sqliteDb.prepare(`
      UPDATE local_school_teachers SET
        name = COALESCE(?, name),
        designation = COALESCE(?, designation),
        department = COALESCE(?, department),
        subject = COALESCE(?, subject),
        qualification = COALESCE(?, qualification),
        classes = COALESCE(?, classes),
        incharge_class = COALESCE(?, incharge_class),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        salary = COALESCE(?, salary),
        basic_salary = COALESCE(?, basic_salary),
        salary_status = COALESCE(?, salary_status),
        last_salary_month = COALESCE(?, last_salary_month),
        status = COALESCE(?, status),
        is_synced = 0
      WHERE id = ? AND tenant_id = ?
    `).run(
      u.name ? enc(tid, u.name) : null, u.designation ?? null, u.department ?? null,
      u.subject ?? null, u.qualification ?? null, u.classes ?? null, u.inchargeClass ?? null,
      u.phone ? enc(tid, u.phone) : null, u.email ? enc(tid, u.email) : null,
      u.salary ? enc(tid, String(u.salary)) : null,
      u.basicSalary !== undefined ? Number(u.basicSalary) : null,
      u.salaryStatus ?? null, u.lastSalaryMonth ?? null, u.status ?? null, id, tid
    );
    const updated = sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(id, tid);
    res.json({ ok: true, teacher: mapTeacherRow(updated, tid) });
  });

  router.delete('/teachers/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const info = sqliteDb.prepare('DELETE FROM local_school_teachers WHERE id = ? AND tenant_id = ?').run(req.params.id, tid);
    if (!info.changes) return res.status(404).json({ ok: false, message: 'Teacher not found for this tenant' });
    res.json({ ok: true, id: req.params.id });
  });

  router.post('/teachers/salary/disburse', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const { teacherId, month, amount } = req.body || {};
    const targetMonth = String(month || 'March 2026');
    if (sqliteDb) {
      const row = sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(teacherId, tid);
      if (row) {
        sqliteDb.prepare(`
          UPDATE local_school_teachers
          SET salary_status = 'Paid', last_salary_month = ?, is_synced = 0
          WHERE id = ? AND tenant_id = ?
        `).run(targetMonth, teacherId, tid);
        const updated = mapTeacherRow(sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(teacherId, tid), tid);
        updated.lastSalaryDisbursed = new Date().toISOString().split('T')[0];
        updated.lastDisbursedAmount = amount || updated.salary;
        recordAudit(tid, {
          actionType: 'Faculty Payroll Disbursement',
          category: 'Financial',
          entityId: updated.id,
          entityDescription: `${updated.name} (${targetMonth})`,
          details: `Disbursed faculty salary ${updated.lastDisbursedAmount} for ${targetMonth}.`,
          severity: 'Normal Audit'
        });
        return res.json({ ok: true, message: `Salary voucher disbursed for ${updated.name} (${targetMonth})`, teacher: updated });
      }
    }
    if (tid === ROOT_TENANT_ID) {
      const seedTeacher = defaultTeachersSeed.find((t) => t.id === teacherId);
      if (seedTeacher) {
        return res.json({
          ok: true,
          message: `Salary voucher disbursed for ${seedTeacher.name} (${targetMonth})`,
          teacher: { ...seedTeacher, lastSalaryMonth: targetMonth, salaryPaid: true, salaryStatus: 'Paid' }
        });
      }
    }
    res.status(404).json({ ok: false, message: 'Teacher record not found for this tenant' });
  });

  // =========================================================================
  // BIOMETRIC & RFID ATTENDANCE
  // =========================================================================
  router.get('/attendance', (req, res) => {
    const tid = resolveTenantId(req);
    let list = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb
          .prepare('SELECT * FROM local_school_attendance WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 200')
          .all(tid);
        list = rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || tid,
          studentId: r.student_id,
          rollNo: r.roll_no,
          studentName: dec(r.tenant_id || tid, r.student_name),
          grade: r.grade,
          status: r.status,
          date: r.date,
          gateName: r.gate_name || 'Main Turnstile 01',
          verificationMode: r.verification_mode,
          isSynced: r.is_synced === 1,
          createdAt: r.created_at
        }));
      } catch {}
    }
    res.json({ ok: true, tenantId: tid, attendance: list });
  });

  router.post('/attendance', rejectRestrictedRole(['student', 'parent', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const body = req.body || {};
    const recId = body.id || ('att-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90));
    const studentId = String(body.studentId || body.student_id || 'STD-GEN');
    const rollNo = String(body.rollNo || body.roll_no || 'SCH-GEN');
    const studentName = String(body.studentName || body.student_name || '').trim();
    if (!studentName) {
      return res.status(400).json({ ok: false, message: 'studentName is required to log attendance.' });
    }
    const grade = String(body.grade || 'Grade 10');
    const status = String(body.status || 'PRESENT').toUpperCase();
    const date = String(body.date || new Date().toISOString().split('T')[0]);
    const gateName = String(body.gateName || 'Main Turnstile 01');
    const mode = String(body.verificationMode || body.verification_mode || 'rfid');

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_attendance
        (id, tenant_id, student_id, roll_no, student_name, grade, status, date, gate_name, verification_mode, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(recId, tid, studentId, rollNo, enc(tid, studentName), grade, status, date, gateName, mode);
    }

    res.json({
      ok: true,
      message: `Attendance marked for ${studentName} (${rollNo}) as ${status} via ${mode.toUpperCase()}.`,
      record: { id: recId, tenantId: tid, studentId, rollNo, studentName, grade, status, date, gateName, verificationMode: mode, isSynced: false }
    });
  });

  router.post('/attendance/mark-all', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const date = String(req.body?.date || new Date().toISOString().split('T')[0]);
    const gradeFilter = String(req.body?.grade || '').trim();
    let marked = 0;
    if (sqliteDb) {
      const rows = sqliteDb.prepare('SELECT * FROM local_school_students WHERE tenant_id = ?').all(tid);
      const insertStmt = sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_attendance
        (id, tenant_id, student_id, roll_no, student_name, grade, status, date, gate_name, verification_mode, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, 'PRESENT', ?, 'Bulk Roster Sync', 'manual_bulk', 0)
      `);
      for (const r of rows) {
        if (String(r.status || '').includes('ALUMNI')) continue;
        if (gradeFilter && r.grade !== gradeFilter) continue;
        insertStmt.run(`att-${tid}-${r.id}-${date}`, tid, r.id, r.roll_no, r.full_name, r.grade, date);
        marked++;
      }
    }
    res.json({ ok: true, markedCount: marked, date });
  });

  router.post('/attendance/alert-parents', (req, res) => {
    const { studentName, phone, date } = req.body || {};
    res.json({
      ok: true,
      message: `Absence alert notification logged for guardian of ${studentName || 'Student'} (${phone || 'on file'}) for date ${date || new Date().toISOString().split('T')[0]}.`
    });
  });

  // =========================================================================
  // EXAMINATIONS & REPORT CARDS
  // =========================================================================
  router.get('/exams', (req, res) => {
    const tid = resolveTenantId(req);
    let list = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_exams WHERE tenant_id = ? ORDER BY created_at DESC').all(tid);
        list = rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || tid,
          examCode: r.exam_code,
          title: r.title,
          grade: r.grade,
          subject: r.subject,
          totalMarks: r.total_marks,
          passingMarks: r.passing_marks,
          examDate: r.exam_date,
          isSynced: r.is_synced === 1
        }));
      } catch {}
    }
    res.json({ ok: true, tenantId: tid, exams: list });
  });

  router.post('/exams', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const b = req.body || {};
    const totalMarks = Number(b.totalMarks ?? 100);
    const passingMarks = Number(b.passingMarks ?? 40);
    if (!Number.isFinite(totalMarks) || totalMarks <= 0 || !Number.isFinite(passingMarks) || passingMarks < 0 || passingMarks > totalMarks) {
      return res.status(400).json({ ok: false, message: 'Invalid totalMarks or passingMarks values.' });
    }
    const examId = b.id || ('EXM-' + Date.now());
    const examCode = b.examCode || (`EXM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
    const title = String(b.title || 'Term Examination');
    const grade = String(b.grade || 'Grade 10');
    const subject = String(b.subject || 'General Science');
    const examDate = String(b.examDate || new Date().toISOString().split('T')[0]);

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_exams (id, tenant_id, exam_code, title, grade, subject, total_marks, passing_marks, exam_date, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(examId, tid, examCode, title, grade, subject, totalMarks, passingMarks, examDate);
    }

    res.status(201).json({
      ok: true,
      message: `Exam schedule ${title} created for ${grade}`,
      exam: { id: examId, tenantId: tid, examCode, title, grade, subject, totalMarks, passingMarks, examDate }
    });
  });

  router.get('/results', (req, res) => {
    const tid = resolveTenantId(req);
    let list = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_results WHERE tenant_id = ? ORDER BY created_at DESC').all(tid);
        list = rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || tid,
          examId: r.exam_id,
          studentId: r.student_id,
          rollNo: r.roll_no,
          studentName: dec(r.tenant_id || tid, r.student_name),
          grade: r.grade,
          subject: r.subject,
          marksObtained: r.marks_obtained,
          totalMarks: r.total_marks,
          percentage: r.percentage,
          gradeLetter: r.grade_letter,
          remarks: r.remarks,
          isSynced: r.is_synced === 1
        }));
      } catch {}
    }
    res.json({ ok: true, tenantId: tid, results: list });
  });

  router.post('/results', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const b = req.body || {};
    const marksObtained = Number(b.marksObtained);
    const totalMarks = Number(b.totalMarks ?? 100);
    if (!Number.isFinite(totalMarks) || totalMarks <= 0 || !Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > totalMarks) {
      return res.status(400).json({ ok: false, message: 'marksObtained must be between 0 and totalMarks.' });
    }
    const resId = b.id || ('RES-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90));
    const examId = String(b.examId || 'EXM-101');
    const studentId = String(b.studentId || 'STD-1001');
    const rollNo = String(b.rollNo || 'SCH-2026-01');
    const studentName = String(b.studentName || '').trim() || 'Student';
    const grade = String(b.grade || 'Grade 10');
    const subject = String(b.subject || 'Mathematics');
    const percentage = Math.round((marksObtained / totalMarks) * 100);
    const gradeLetter = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 40 ? 'D' : 'F';
    const remarks = String(b.remarks || (percentage >= 80 ? 'Exemplary Result' : percentage >= 50 ? 'Satisfactory Performance' : 'Requires Extra Coaching'));

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_results
        (id, tenant_id, exam_id, student_id, roll_no, student_name, grade, subject, marks_obtained, total_marks, percentage, grade_letter, remarks, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(resId, tid, examId, studentId, rollNo, enc(tid, studentName), grade, subject, marksObtained, totalMarks, percentage, gradeLetter, remarks);
    }

    res.status(201).json({
      ok: true,
      message: `Result & Report Card generated for ${studentName} (${rollNo}): ${gradeLetter} (${percentage}%)`,
      result: { id: resId, tenantId: tid, examId, studentId, rollNo, studentName, grade, subject, marksObtained, totalMarks, percentage, gradeLetter, remarks }
    });
  });

  // =========================================================================
  // HOMEWORK, LEAVES, CONCESSIONS, COMPLAINTS, LESSON PLANS, SUBSTITUTIONS
  // =========================================================================
  router.get('/homework', (req, res) => {
    const tid = resolveTenantId(req);
    const rows = sqliteDb ? sqliteDb.prepare('SELECT * FROM local_school_homework WHERE tenant_id = ? ORDER BY created_at DESC').all(tid) : [];
    res.json({
      ok: true,
      homework: rows.map((r) => ({
        id: r.id, title: r.title, subject: r.subject, grade: r.grade,
        assignedDate: r.assigned_date, dueDate: r.due_date, description: r.description,
        teacherName: r.teacher_name, submissionsCount: r.submissions_count, totalCount: r.total_count
      }))
    });
  });

  router.post('/homework', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const h = req.body || {};
    if (!String(h.title || '').trim() || !String(h.subject || '').trim() || !String(h.description || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Homework title, subject, and description are required.' });
    }
    const item = {
      id: h.id || ('HW-' + Date.now()),
      title: String(h.title).trim(),
      subject: String(h.subject).trim(),
      grade: String(h.grade || 'Grade 10'),
      assignedDate: String(h.assignedDate || new Date().toISOString().split('T')[0]),
      dueDate: String(h.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]),
      description: String(h.description).trim(),
      teacherName: String(h.teacherName || 'Faculty'),
      submissionsCount: Number(h.submissionsCount || 0),
      totalCount: Number(h.totalCount || 30)
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_homework
        (id, tenant_id, title, subject, grade, assigned_date, due_date, description, teacher_name, submissions_count, total_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, item.title, item.subject, item.grade, item.assignedDate, item.dueDate, item.description, item.teacherName, item.submissionsCount, item.totalCount);
    }
    res.status(201).json({ ok: true, homework: item });
  });

  router.delete('/homework/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    sqliteDb.prepare('DELETE FROM local_school_homework WHERE id = ? AND tenant_id = ?').run(req.params.id, tid);
    res.json({ ok: true, id: req.params.id });
  });

  router.get('/leaves', (req, res) => {
    const tid = resolveTenantId(req);
    const rows = sqliteDb ? sqliteDb.prepare('SELECT * FROM local_school_leaves WHERE tenant_id = ? ORDER BY created_at DESC').all(tid) : [];
    res.json({
      ok: true,
      leaves: rows.map((r) => ({
        id: r.id, childId: r.child_id, childName: dec(tid, r.child_name),
        fromDate: r.from_date, toDate: r.to_date, reason: dec(tid, r.reason),
        status: r.status, submittedDate: r.submitted_date, leaveType: r.leave_type
      }))
    });
  });

  router.post('/leaves', (req, res) => {
    const tid = resolveTenantId(req);
    const l = req.body || {};
    if (!String(l.fromDate || '').trim() || !String(l.toDate || '').trim() || !String(l.reason || '').trim()) {
      return res.status(400).json({ ok: false, message: 'fromDate, toDate, and reason are required for leave requests.' });
    }
    const item = {
      id: l.id || ('LV-' + Date.now()),
      childId: String(l.childId || 'STD-1'),
      childName: String(l.childName || 'Student'),
      fromDate: String(l.fromDate),
      toDate: String(l.toDate),
      reason: String(l.reason).trim(),
      status: String(l.status || 'Pending Review'),
      submittedDate: String(l.submittedDate || new Date().toISOString().split('T')[0]),
      leaveType: String(l.leaveType || 'Student Leave')
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_leaves
        (id, tenant_id, child_id, child_name, from_date, to_date, reason, status, submitted_date, leave_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, item.childId, enc(tid, item.childName), item.fromDate, item.toDate, enc(tid, item.reason), item.status, item.submittedDate, item.leaveType);
    }
    res.status(201).json({ ok: true, leave: item });
  });

  router.put('/leaves/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const info = sqliteDb.prepare('UPDATE local_school_leaves SET status = ? WHERE id = ? AND tenant_id = ?').run(String(req.body?.status || 'Approved'), req.params.id, tid);
    if (!info.changes) return res.status(404).json({ ok: false, message: 'Leave request not found' });
    res.json({ ok: true, id: req.params.id, status: req.body?.status || 'Approved' });
  });

  router.get('/concessions', (req, res) => {
    const tid = resolveTenantId(req);
    const rows = sqliteDb ? sqliteDb.prepare('SELECT * FROM local_school_concessions WHERE tenant_id = ? ORDER BY created_at DESC').all(tid) : [];
    res.json({
      ok: true,
      concessions: rows.map((r) => ({
        id: r.id, studentId: r.student_id, studentName: dec(tid, r.student_name), rollNo: r.roll_no,
        grade: r.grade, guardianName: dec(tid, r.guardian_name), guardianOccupation: r.guardian_occupation,
        guardianIncome: r.guardian_income, regularFee: r.regular_fee, revisedFee: r.revised_fee,
        requestedDiscount: r.requested_discount, category: r.category, reason: r.reason,
        status: r.status, approvedBy: r.approved_by
      }))
    });
  });

  router.post('/concessions', (req, res) => {
    const tid = resolveTenantId(req);
    const c = req.body || {};
    if (!String(c.studentName || '').trim() || !String(c.grade || '').trim()) {
      return res.status(400).json({ ok: false, message: 'studentName and grade are required.' });
    }
    const item = {
      id: c.id || ('CON-' + Date.now()),
      studentId: String(c.studentId || ''),
      studentName: String(c.studentName).trim(),
      rollNo: String(c.rollNo || ''),
      grade: String(c.grade).trim(),
      guardianName: String(c.guardianName || ''),
      guardianOccupation: String(c.guardianOccupation || ''),
      guardianIncome: String(c.guardianIncome || ''),
      regularFee: Number(c.regularFee || 0),
      revisedFee: Number(c.revisedFee || 0),
      requestedDiscount: String(c.requestedDiscount || '10%'),
      category: String(c.category || 'Sibling Discount'),
      reason: String(c.reason || ''),
      status: String(c.status || 'Pending Review'),
      approvedBy: String(c.approvedBy || '')
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_concessions
        (id, tenant_id, student_id, student_name, roll_no, grade, guardian_name, guardian_occupation, guardian_income, regular_fee, revised_fee, requested_discount, category, reason, status, approved_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.id, tid, item.studentId, enc(tid, item.studentName), item.rollNo, item.grade,
        enc(tid, item.guardianName), item.guardianOccupation, item.guardianIncome,
        item.regularFee, item.revisedFee, item.requestedDiscount, item.category, item.reason, item.status, item.approvedBy
      );
    }
    res.status(201).json({ ok: true, concession: item });
  });

  router.put('/concessions/:id', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const status = String(req.body?.status || 'Approved');
    const approvedBy = String(req.body?.approvedBy || 'Principal Office');
    const info = sqliteDb.prepare('UPDATE local_school_concessions SET status = ?, approved_by = ? WHERE id = ? AND tenant_id = ?').run(status, approvedBy, req.params.id, tid);
    if (!info.changes) return res.status(404).json({ ok: false, message: 'Concession record not found' });
    recordAudit(tid, {
      actionType: 'Fee Waiver / Concession',
      category: 'Financial',
      entityId: req.params.id,
      entityDescription: `Concession ${status} by ${approvedBy}`,
      severity: 'Authorized Override'
    });
    res.json({ ok: true, id: req.params.id, status, approvedBy });
  });

  router.get('/complaints', (req, res) => {
    const tid = resolveTenantId(req);
    const rows = sqliteDb ? sqliteDb.prepare('SELECT * FROM local_school_complaints WHERE tenant_id = ? ORDER BY created_at DESC').all(tid) : [];
    res.json({
      ok: true,
      complaints: rows.map((r) => ({
        id: r.id, parentName: dec(tid, r.parent_name), studentName: dec(tid, r.student_name),
        category: r.category, subject: r.subject, priority: r.priority,
        assignedIncharge: r.assigned_incharge, investigationNotes: r.investigation_notes,
        status: r.status, date: r.date
      }))
    });
  });

  router.post('/complaints', (req, res) => {
    const tid = resolveTenantId(req);
    const c = req.body || {};
    if (!String(c.subject || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Complaint subject is required.' });
    }
    const item = {
      id: c.id || ('CMP-' + Date.now()),
      parentName: String(c.parentName || 'Parent / Guardian'),
      studentName: String(c.studentName || 'Student'),
      category: String(c.category || 'General'),
      subject: String(c.subject).trim(),
      priority: String(c.priority || 'Routine'),
      assignedIncharge: String(c.assignedIncharge || 'Coordinator'),
      investigationNotes: String(c.investigationNotes || ''),
      status: String(c.status || 'In Progress'),
      date: String(c.date || new Date().toISOString().split('T')[0])
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_complaints
        (id, tenant_id, parent_name, student_name, category, subject, priority, assigned_incharge, investigation_notes, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, enc(tid, item.parentName), enc(tid, item.studentName), item.category, item.subject, item.priority, item.assignedIncharge, item.investigationNotes, item.status, item.date);
    }
    res.status(201).json({ ok: true, complaint: item });
  });

  router.put('/complaints/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const status = String(req.body?.status || 'Resolved');
    const notes = req.body?.investigationNotes;
    const info = sqliteDb.prepare('UPDATE local_school_complaints SET status = ?, investigation_notes = COALESCE(?, investigation_notes) WHERE id = ? AND tenant_id = ?')
      .run(status, notes ?? null, req.params.id, tid);
    if (!info.changes) return res.status(404).json({ ok: false, message: 'Complaint not found' });
    res.json({ ok: true, id: req.params.id, status });
  });

  router.get('/lesson-plans', (req, res) => {
    const tid = resolveTenantId(req);
    const rows = sqliteDb ? sqliteDb.prepare('SELECT * FROM local_school_lesson_plans WHERE tenant_id = ? ORDER BY created_at DESC').all(tid) : [];
    res.json({
      ok: true,
      lessonPlans: rows.map((r) => ({
        id: r.id, teacherId: r.teacher_id, teacherName: r.teacher_name, subject: r.subject,
        grade: r.grade, topic: r.topic, objective: r.objective, date: r.date,
        status: r.status, moderatorNotes: r.moderator_notes
      }))
    });
  });

  router.post('/lesson-plans', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const lp = req.body || {};
    if (!String(lp.topic || '').trim() || !String(lp.subject || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Lesson plan subject and topic are required.' });
    }
    const item = {
      id: lp.id || ('LP-' + Date.now()),
      teacherId: String(lp.teacherId || ''),
      teacherName: String(lp.teacherName || 'Faculty'),
      subject: String(lp.subject).trim(),
      grade: String(lp.grade || 'Grade 10'),
      topic: String(lp.topic).trim(),
      objective: String(lp.objective || ''),
      date: String(lp.date || new Date().toISOString().split('T')[0]),
      status: String(lp.status || 'Planned'),
      moderatorNotes: String(lp.moderatorNotes || '')
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_lesson_plans
        (id, tenant_id, teacher_id, teacher_name, subject, grade, topic, objective, date, status, moderator_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, item.teacherId, item.teacherName, item.subject, item.grade, item.topic, item.objective, item.date, item.status, item.moderatorNotes);
    }
    res.status(201).json({ ok: true, lessonPlan: item });
  });

  router.put('/lesson-plans/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const status = String(req.body?.status || 'Approved');
    const info = sqliteDb.prepare('UPDATE local_school_lesson_plans SET status = ?, moderator_notes = COALESCE(?, moderator_notes) WHERE id = ? AND tenant_id = ?')
      .run(status, req.body?.moderatorNotes ?? null, req.params.id, tid);
    if (!info.changes) return res.status(404).json({ ok: false, message: 'Lesson plan not found' });
    res.json({ ok: true, id: req.params.id, status });
  });

  router.get('/substitutions', (req, res) => {
    const tid = resolveTenantId(req);
    const rows = sqliteDb ? sqliteDb.prepare('SELECT * FROM local_school_substitutions WHERE tenant_id = ? ORDER BY created_at DESC').all(tid) : [];
    res.json({
      ok: true,
      substitutions: rows.map((r) => ({
        id: r.id, absentTeacher: r.absent_teacher, substituteTeacher: r.substitute_teacher,
        grade: r.grade, subject: r.subject, period: r.period, date: r.date, notes: r.notes, status: r.status
      }))
    });
  });

  router.post('/substitutions', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const s = req.body || {};
    if (!String(s.absentTeacher || '').trim() || !String(s.substituteTeacher || '').trim()) {
      return res.status(400).json({ ok: false, message: 'absentTeacher and substituteTeacher are required.' });
    }
    const item = {
      id: s.id || ('SUB-' + Date.now()),
      absentTeacher: String(s.absentTeacher).trim(),
      substituteTeacher: String(s.substituteTeacher).trim(),
      grade: String(s.grade || 'Grade 10'),
      subject: String(s.subject || 'Assigned Cover'),
      period: String(s.period || 'Period 1'),
      date: String(s.date || new Date().toISOString().split('T')[0]),
      notes: String(s.notes || ''),
      status: String(s.status || 'Confirmed Cover')
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_substitutions
        (id, tenant_id, absent_teacher, substitute_teacher, grade, subject, period, date, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, item.absentTeacher, item.substituteTeacher, item.grade, item.subject, item.period, item.date, item.notes, item.status);
    }
    res.status(201).json({ ok: true, substitution: item });
  });

  // =========================================================================
  // INSTITUTIONAL AUDIT, RECONCILIATION, COMPLIANCE SCAN & WORKSPACE STATE
  // =========================================================================
  router.get('/audit-logs', (req, res) => {
    const tid = resolveTenantId(req);
    let logs = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 200').all(tid);
        logs = rows.map((r) => ({
          id: r.id, timestamp: r.timestamp, operatorName: r.operator_name, operatorRole: r.operator_role,
          actionType: r.action_type, category: r.category, entityId: r.entity_id,
          entityDescription: r.entity_description, details: r.details, severity: r.severity,
          verifiedBy: r.verified_by, ipAddress: r.ip_address
        }));
      } catch {}
    }
    if (logs.length === 0 && tid === ROOT_TENANT_ID) {
      logs = SCHOOL_AUDIT_LOGS;
    }
    res.json({ ok: true, tenantId: tid, logs });
  });

  router.post('/audit-logs', (req, res) => {
    const tid = resolveTenantId(req);
    const newEntry = recordAudit(tid, req.body || {});
    res.status(201).json({ ok: true, log: newEntry });
  });

  const mapReconciliationRow = (r) => ({
    id: r.id,
    date: r.date,
    counterCashReceived: Number(r.counter_cash || 0),
    bankDepositedMeezan: Number(r.bank_meezan || 0),
    bankDepositedHBL: Number(r.bank_hbl || 0),
    onlineDigitalKuickPay: Number(r.online_digital || 0),
    totalSystemBilled: Number(r.total_billed || 0),
    actualCollected: Number(r.actual_collected || 0),
    varianceAmount: Number(r.variance_amount || 0),
    reconciliationStatus: r.status || 'Balanced & Cleared',
    cashierName: r.cashier_name || 'Accountant / Fee Clerk',
    verifiedByAuditor: r.verified_by_auditor || 'Pending Owner Review',
    submittedByRole: r.submitted_by_role || 'accountant',
    principalCollected: Number(r.principal_collected || 0),
    accountantCollected: Number(r.accountant_collected || 0),
    onlineCollected: Number(r.online_collected || 0),
    openingVaultCash: Number(r.opening_vault_cash || 0),
    pettyExpenses: Number(r.petty_expenses || 0),
    closingVaultCash: Number(r.closing_vault_cash || 0),
    bankDepositSlipNo: r.bank_deposit_slip_no || '',
    ownerApprovalStatus: r.owner_approval_status || 'Pending Owner Review',
    ownerRemarks: r.owner_remarks || '',
    approvedBy: r.approved_by || '',
    approvedAt: r.approved_at || '',
    notes: r.notes || ''
  });

  router.get('/reconciliation', (req, res) => {
    const tid = resolveTenantId(req);
    let reconciliations = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_reconciliation WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100').all(tid);
        reconciliations = rows.map(mapReconciliationRow);
      } catch {}
    }
    if (reconciliations.length === 0 && tid === ROOT_TENANT_ID) {
      reconciliations = SCHOOL_FEE_RECONCILIATION.map((rec) => ({
        ...rec,
        submittedByRole: 'accountant',
        ownerApprovalStatus: 'Verified & Approved by Owner',
        approvedBy: 'School Owner Executive'
      }));
    }
    res.json({ ok: true, tenantId: tid, reconciliations });
  });

  router.post('/reconciliation', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const r = req.body || {};
    const counterCashReceived = Number(r.counterCashReceived || 0);
    const bankDepositedMeezan = Number(r.bankDepositedMeezan || 0);
    const bankDepositedHBL = Number(r.bankDepositedHBL || 0);
    const onlineDigitalKuickPay = Number(r.onlineDigitalKuickPay || 0);
    const openingVaultCash = Number(r.openingVaultCash || 0);
    const pettyExpenses = Number(r.pettyExpenses || 0);
    const principalCollected = Number(r.principalCollected || 0);
    const onlineCollected = Number(r.onlineCollected || 0);
    const totalSystemBilled = Number(r.totalSystemBilled ?? (counterCashReceived + bankDepositedMeezan + bankDepositedHBL + onlineDigitalKuickPay));
    if ([counterCashReceived, bankDepositedMeezan, bankDepositedHBL, onlineDigitalKuickPay, totalSystemBilled, openingVaultCash, pettyExpenses].some((v) => !Number.isFinite(v) || v < 0)) {
      return res.status(400).json({ ok: false, message: 'Reconciliation amounts must be non-negative.' });
    }
    const actualCollected = counterCashReceived + bankDepositedMeezan + bankDepositedHBL + onlineDigitalKuickPay;
    const varianceAmount = actualCollected - totalSystemBilled;
    const accountantCollected = Number(r.accountantCollected ?? actualCollected);
    const closingVaultCash = Number(r.closingVaultCash ?? Math.max(0, openingVaultCash + counterCashReceived - pettyExpenses));
    const reqRole = resolveUserRole(req);
    const submittedByRole = String(r.submittedByRole || reqRole || 'accountant').toLowerCase();
    const isAccountantSubmission = submittedByRole === 'accountant';
    const ownerApprovalStatus = String(
      r.ownerApprovalStatus || (isAccountantSubmission ? 'Pending Owner Review' : 'Verified & Approved by Owner')
    );

    const newRec = {
      id: r.id || ('DCL-' + Date.now()),
      date: String(r.date || new Date().toISOString().split('T')[0]),
      counterCashReceived,
      bankDepositedMeezan,
      bankDepositedHBL,
      onlineDigitalKuickPay,
      totalSystemBilled,
      actualCollected,
      varianceAmount,
      reconciliationStatus: varianceAmount === 0 ? 'Balanced & Cleared' : (varianceAmount > 0 ? 'Surplus Recorded' : 'Audit Deficit Flagged'),
      cashierName: String(r.cashierName || (isAccountantSubmission ? 'Muhammad Rizwan (Accountant / Fee Clerk)' : 'Accounts Desk')),
      verifiedByAuditor: String(r.verifiedByAuditor || (isAccountantSubmission ? 'Pending School Owner Review' : 'School Owner Executive')),
      submittedByRole,
      principalCollected,
      accountantCollected,
      onlineCollected,
      openingVaultCash,
      pettyExpenses,
      closingVaultCash,
      bankDepositSlipNo: String(r.bankDepositSlipNo || ''),
      ownerApprovalStatus,
      ownerRemarks: String(r.ownerRemarks || ''),
      approvedBy: isAccountantSubmission ? '' : String(r.approvedBy || 'School Owner Executive'),
      approvedAt: isAccountantSubmission ? '' : new Date().toISOString(),
      notes: String(r.notes || 'Daily Cash & Bank Closing submitted for Owner review.')
    };

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_reconciliation
        (
          id, tenant_id, date, counter_cash, bank_meezan, bank_hbl, online_digital,
          total_billed, actual_collected, variance_amount, status, cashier_name, verified_by_auditor,
          submitted_by_role, principal_collected, accountant_collected, online_collected,
          opening_vault_cash, petty_expenses, closing_vault_cash, bank_deposit_slip_no,
          owner_approval_status, owner_remarks, approved_by, approved_at, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newRec.id, tid, newRec.date, counterCashReceived, bankDepositedMeezan, bankDepositedHBL,
        onlineDigitalKuickPay, totalSystemBilled, actualCollected, varianceAmount,
        newRec.reconciliationStatus, newRec.cashierName, newRec.verifiedByAuditor,
        newRec.submittedByRole, principalCollected, accountantCollected, onlineCollected,
        openingVaultCash, pettyExpenses, closingVaultCash, newRec.bankDepositSlipNo,
        newRec.ownerApprovalStatus, newRec.ownerRemarks, newRec.approvedBy, newRec.approvedAt, newRec.notes
      );

      recordAudit(tid, {
        operatorName: newRec.cashierName,
        operatorRole: isAccountantSubmission ? 'Accountant / Fee Clerk' : 'Accounts Controller',
        actionType: 'Daily Closing Submission',
        category: 'Financial',
        entityId: newRec.id,
        entityDescription: `Daily Closing (${newRec.date}) — PKR ${actualCollected.toLocaleString()}`,
        details: `Cash: PKR ${counterCashReceived.toLocaleString()}, Meezan: PKR ${bankDepositedMeezan.toLocaleString()}, HBL: PKR ${bankDepositedHBL.toLocaleString()}, Digital: PKR ${onlineDigitalKuickPay.toLocaleString()}. Principal Desk: PKR ${principalCollected.toLocaleString()}. Status: ${newRec.ownerApprovalStatus}.`,
        severity: varianceAmount === 0 ? 'Normal Audit' : 'Compliance Flag',
        verifiedBy: newRec.verifiedByAuditor
      });
    }

    if (db) {
      try {
        await setDoc(doc(db, 'school_reconciliations', newRec.id), {
          ...newRec,
          tenant_id: tid,
          synced_at: new Date().toISOString()
        }, { merge: true });
      } catch {}
    }

    res.status(201).json({ ok: true, reconciliation: newRec });
  });

  router.put('/reconciliation/:id/verify', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    const b = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    const row = sqliteDb.prepare('SELECT * FROM local_school_reconciliation WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Daily Closing / Reconciliation record not found' });

    const ownerApprovalStatus = String(b.ownerApprovalStatus || 'Verified & Approved by Owner');
    const ownerRemarks = String(b.ownerRemarks || (ownerApprovalStatus.includes('Flag') ? 'Flagged by School Owner for counter review.' : 'Verified and approved by School Owner.'));
    const approvedBy = String(b.approvedBy || 'School Owner Executive');
    const approvedAt = new Date().toISOString();
    const verifiedByAuditor = ownerApprovalStatus.includes('Flag')
      ? `Flagged by ${approvedBy}`
      : `${approvedBy} (Verified)`;

    sqliteDb.prepare(`
      UPDATE local_school_reconciliation
      SET owner_approval_status = ?, owner_remarks = ?, approved_by = ?, approved_at = ?, verified_by_auditor = ?
      WHERE id = ? AND tenant_id = ?
    `).run(ownerApprovalStatus, ownerRemarks, approvedBy, approvedAt, verifiedByAuditor, id, tid);

    const updated = mapReconciliationRow(
      sqliteDb.prepare('SELECT * FROM local_school_reconciliation WHERE id = ? AND tenant_id = ?').get(id, tid)
    );

    recordAudit(tid, {
      operatorName: approvedBy,
      operatorRole: 'School Owner',
      actionType: 'Owner Daily Closing Oversight',
      category: 'Financial',
      entityId: updated.id,
      entityDescription: `${ownerApprovalStatus} — ${updated.date}`,
      details: `Owner reviewed Accountant Daily Closing (${updated.cashierName}) totaling PKR ${updated.actualCollected.toLocaleString()}. Remarks: ${ownerRemarks}`,
      severity: ownerApprovalStatus.includes('Flag') ? 'Compliance Flag' : 'Normal Audit',
      verifiedBy: approvedBy
    });

    if (db) {
      try {
        await setDoc(doc(db, 'school_reconciliations', updated.id), {
          ...updated,
          tenant_id: tid,
          synced_at: approvedAt
        }, { merge: true });
      } catch {}
    }

    res.json({ ok: true, reconciliation: updated });
  });

  router.get('/compliance-scan', (req, res) => {
    const tid = resolveTenantId(req);
    res.json({
      ok: true,
      tenantId: tid,
      complianceScore: 98.4,
      totalAuditItems: SCHOOL_COMPLIANCE_ITEMS.length,
      compliantCount: SCHOOL_COMPLIANCE_ITEMS.filter((c) => c.status === 'Compliant & Verified').length,
      actionRequiredCount: SCHOOL_COMPLIANCE_ITEMS.filter((c) => c.status !== 'Compliant & Verified').length,
      complianceItems: SCHOOL_COMPLIANCE_ITEMS
    });
  });

  // Per-tenant Workspace State Snapshot (settings, notices, classes, timetable, calendar, etc.)
  router.get('/workspace', (req, res) => {
    const tid = resolveTenantId(req);
    let workspace = null;
    if (sqliteDb) {
      try {
        const row = sqliteDb.prepare('SELECT * FROM local_school_workspaces WHERE tenant_id = ?').get(tid);
        if (row && row.payload_json) {
          workspace = {
            tenantId: tid,
            schoolName: row.school_name || '',
            updatedAt: row.updated_at,
            ...JSON.parse(row.payload_json)
          };
        }
      } catch {}
    }
    res.json({ ok: true, tenantId: tid, workspace });
  });

  router.put('/workspace', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const body = req.body || {};
    const schoolName = String(body.schoolName || '');
    const serialized = JSON.stringify(body);
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_workspaces (tenant_id, school_name, payload_json, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(tid, schoolName, serialized, new Date().toISOString());
    }
    if (db) {
      try {
        await setDoc(doc(db, 'school_workspaces', tid), {
          ...body,
          tenant_id: tid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch {}
    }
    res.json({ ok: true, tenantId: tid });
  });

  return router;
}
