import express from 'express';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
  { id: 't-1', empCode: 'EMP-2021-01', name: 'Sir Farhan Qureshi', fatherName: 'Qureshi Abdul Jabbar', designation: 'Senior Subject Lead', department: 'Mathematics', subject: 'Mathematics & Algebra', classes: 'Grade 8, 9, 10', inchargeClass: 'Grade 10 - A', gender: 'Male', dob: '1986-03-14', bloodGroup: 'B+', cnic: '35202-1029384-1', passportNo: 'PK-9284112', nationality: 'Pakistani', phone: '+92 300 1234567', emergencyContact: '+92 300 1234500', email: 'farhan.qureshi@campus.edu', address: 'Model Town Link Road, Lahore', salary: 'PKR 125,000', basicSalary: 125000, salaryStatus: 'Paid', status: 'ACTIVE', lastSalaryMonth: 'March 2026', salaryPaid: true, joiningDate: '2021-08-15' },
  { id: 't-2', empCode: 'EMP-2020-02', name: 'Dr. Saima Noor', fatherName: 'Noor Muhammad Khan', designation: 'Head of Sciences', department: 'Sciences', subject: 'General Science & Physics', classes: 'Grade 7, 8, 9', inchargeClass: 'Grade 9 - A', gender: 'Female', dob: '1984-07-22', bloodGroup: 'O+', cnic: '35202-5647382-2', passportNo: 'PK-7741298', nationality: 'Pakistani', phone: '+92 321 9876543', emergencyContact: '+92 321 9876500', email: 'saima.noor@campus.edu', address: 'DHA Phase 5, Sector C, Lahore', salary: 'PKR 145,000', basicSalary: 145000, salaryStatus: 'Paid', status: 'ACTIVE', lastSalaryMonth: 'March 2026', salaryPaid: true, joiningDate: '2020-02-01' },
  { id: 't-3', empCode: 'EMP-2022-03', name: 'Ms. Hina Aslam', fatherName: 'Muhammad Aslam Chohan', designation: 'Senior Lecturer', department: 'Humanities', subject: 'English & Composition', classes: 'Grade 6, 7, 8', inchargeClass: 'Grade 8 - B', gender: 'Female', dob: '1990-11-05', bloodGroup: 'A+', cnic: '35202-3322110-2', passportNo: '', nationality: 'Pakistani', phone: '+92 333 4567890', emergencyContact: '+92 333 4567801', email: 'hina.aslam@campus.edu', address: 'Gulberg III, Street 9, Lahore', salary: 'PKR 110,000', basicSalary: 110000, salaryStatus: 'Paid', status: 'ACTIVE', lastSalaryMonth: 'March 2026', salaryPaid: true, joiningDate: '2022-09-10' },
  { id: 't-4', empCode: 'EMP-2023-04', name: 'Engr. Rehan Ali', fatherName: 'Shaukat Ali Gillani', designation: 'STEM Coordinator', department: 'Computer Science', subject: 'Computer Science & Coding', classes: 'Grade 8, 9, 10', inchargeClass: 'Grade 8 - A', gender: 'Male', dob: '1991-01-19', bloodGroup: 'AB+', cnic: '35202-8877665-1', passportNo: 'PK-8834210', nationality: 'Pakistani', phone: '+92 312 3456789', emergencyContact: '+92 312 3456700', email: 'rehan.ali@campus.edu', address: 'Johar Town Phase 2, Lahore', salary: 'PKR 135,000', basicSalary: 135000, salaryStatus: 'Pending', status: 'ACTIVE', lastSalaryMonth: 'February 2026', salaryPaid: false, joiningDate: '2023-01-15' },
  { id: 't-5', empCode: 'EMP-2019-05', name: 'Qari Abdul Rehman', fatherName: 'Hafiz Fazal Ur Rehman', designation: 'Senior Faculty', department: 'Languages & Islamiat', subject: 'Urdu & Islamic Studies', classes: 'Grade 6 to 10', inchargeClass: 'Grade 7 - A', gender: 'Male', dob: '1982-06-11', bloodGroup: 'B-', cnic: '35202-9911223-1', passportNo: '', nationality: 'Pakistani', phone: '+92 301 2345678', emergencyContact: '+92 301 2345600', email: 'abdul.rehman@campus.edu', address: 'Garden Town, Block H, Lahore', salary: 'PKR 95,000', basicSalary: 95000, salaryStatus: 'Paid', status: 'ACTIVE', lastSalaryMonth: 'March 2026', salaryPaid: true, joiningDate: '2019-05-20' }
];

export const SCHOOL_STAFF = [
  { id: 'STF-101', empCode: 'STF-2022-01', name: 'Muhammad Rizwan', fatherName: 'Muhammad Hanif', cnic: '35202-4455661-1', passportNo: '', nationality: 'Pakistani', gender: 'Male', dob: '1987-04-12', bloodGroup: 'B+', roleTitle: 'Accountant / Fee Clerk', department: 'Accounts & Fee Desk', phone: '+92 300 4455661', emergencyContact: '+92 300 4455660', address: 'Township Sector B-1, Lahore', shift: 'Morning (07:30 AM - 03:30 PM)', status: 'ACTIVE', attendanceStatus: 'Present', faceEnrolled: false, liteEnabled: true },
  { id: 'STF-102', empCode: 'STF-2021-02', name: 'Kamran Siddiqui', fatherName: 'Anwar Siddiqui', cnic: '35202-4401928-3', passportNo: '', nationality: 'Pakistani', gender: 'Male', dob: '1989-08-24', bloodGroup: 'O+', roleTitle: 'Admin Coordinator', department: 'Campus Administration', phone: '+92 321 4401928', emergencyContact: '+92 321 4401900', address: 'Iqbal Town, Karim Block, Lahore', shift: 'Morning (07:30 AM - 03:30 PM)', status: 'ACTIVE', attendanceStatus: 'Present', faceEnrolled: false, liteEnabled: true },
  { id: 'STF-103', empCode: 'STF-2020-03', name: 'Tariq Mehmood', fatherName: 'Ghulam Rasool', cnic: '35201-7718291-5', passportNo: '', nationality: 'Pakistani', gender: 'Male', dob: '1981-02-17', bloodGroup: 'A+', roleTitle: 'Gate Security Supervisor', department: 'Campus Security', phone: '+92 333 7718291', emergencyContact: '+92 333 7718200', address: 'Faisal Town, Block D, Lahore', shift: 'Shift A (06:30 AM - 02:30 PM)', status: 'ACTIVE', attendanceStatus: 'Present', faceEnrolled: false, liteEnabled: true },
  { id: 'STF-104', empCode: 'STF-2023-04', name: 'Nadia Parveen', fatherName: 'Bashir Ahmed', cnic: '35202-8890123-2', passportNo: '', nationality: 'Pakistani', gender: 'Female', dob: '1993-10-08', bloodGroup: 'O-', roleTitle: 'Science Lab Assistant', department: 'Physics & Chemistry Lab', phone: '+92 312 8890123', emergencyContact: '+92 312 8890100', address: 'Samanabad, Main Blvd, Lahore', shift: 'Morning (08:00 AM - 02:30 PM)', status: 'ACTIVE', attendanceStatus: 'Absent', faceEnrolled: false, liteEnabled: true },
  { id: 'STF-105', empCode: 'STF-2021-05', name: 'Rashid Ali', fatherName: 'Liaqat Ali', cnic: '35202-6612390-7', passportNo: '', nationality: 'Pakistani', gender: 'Male', dob: '1985-12-01', bloodGroup: 'AB+', roleTitle: 'Senior Library Assistant', department: 'Central Library', phone: '+92 302 6612390', emergencyContact: '+92 302 6612300', address: 'Wapda Town, Block E, Lahore', shift: 'Morning (07:45 AM - 03:00 PM)', status: 'ACTIVE', attendanceStatus: 'Absent', faceEnrolled: false, liteEnabled: true },
  { id: 'STF-106', empCode: 'STF-2022-06', name: 'Sajid Hussain', fatherName: 'Khadim Hussain', cnic: '35201-1199882-9', passportNo: '', nationality: 'Pakistani', gender: 'Male', dob: '1988-05-29', bloodGroup: 'B+', roleTitle: 'Transport & Gate Attendant', department: 'Fleet & Gate Operations', phone: '+92 345 1199882', emergencyContact: '+92 345 1199800', address: 'Green Town, Sector D-II, Lahore', shift: 'Shift A (06:30 AM - 02:30 PM)', status: 'ACTIVE', attendanceStatus: 'Absent', faceEnrolled: false, liteEnabled: true }
];

export const SCHOOL_PRINCIPALS = [
  { id: 'PRI-101', empCode: 'DIR-001', name: 'Prof. Dr. Tahir Malik', fatherName: 'Malik Sher Muhammad', cnic: '61101-9876543-1', passportNo: 'PK-DIR-44102', nationality: 'Pakistani', gender: 'Male', dob: '1974-09-14', bloodGroup: 'O+', roleTitle: 'Principal & Academic Director', department: 'Executive Directorate', phone: '+92 300 9876543', emergencyContact: '+92 300 9876500', email: 'principal@campus.edu', address: 'Executive Residence, Sector F-7/2, Islamabad', shift: 'Full Day (07:30 AM - 04:00 PM)', status: 'ACTIVE', attendanceStatus: 'Absent', faceEnrolled: false, liteEnabled: true },
  { id: 'PRI-102', empCode: 'DIR-002', name: 'Prof. Ayesha Siddiqua', fatherName: 'Brig. (R) Manzoor Ahmed', cnic: '61101-9876501-2', passportNo: 'PK-DIR-55198', nationality: 'Pakistani', gender: 'Female', dob: '1979-03-27', bloodGroup: 'A+', roleTitle: 'Vice Principal & Academics Head', department: 'Academic Administration', phone: '+92 321 9876501', emergencyContact: '+92 321 9876599', email: 'vice.principal@campus.edu', address: 'House 19, Street 12, Sector F-8/3, Islamabad', shift: 'Full Day (07:30 AM - 03:30 PM)', status: 'ACTIVE', attendanceStatus: 'Absent', faceEnrolled: false, liteEnabled: true }
];

export function getDefaultAttendancePolicy() {
  return {
    verificationMode: 'standard',
    liteModeEnabled: true,
    cameraFillLightEnabled: true,
    fillLightColor: 'neutral',
    livenessCheckEnabled: true,
    autoCaptureOnMatch: true,
    requireCameraForAllAttendance: true,
    confidenceThreshold: 76,
    liteConfidenceThreshold: 66,
    scheduledStartTime: '08:00',
    lateCutoffTime: '08:15',
    twoPunchEnabled: true,
    checkOutEnableTime: '13:30',
    categories: {
      student: { enabled: true, liteEnabled: true, cameraRequired: true, allowSelfCheckIn: false },
      teacher: { enabled: true, liteEnabled: true, cameraRequired: true, allowSelfCheckIn: true },
      staff: { enabled: true, liteEnabled: true, cameraRequired: true, allowSelfCheckIn: true },
      principal: { enabled: true, liteEnabled: true, cameraRequired: true, allowSelfCheckIn: true }
    },
    roleAccess: {
      principal: {
        enabled: true,
        canScanStudents: true,
        canScanTeachers: true,
        canScanStaff: true,
        canScanPrincipal: true,
        canEnrollFaces: true,
        liteModeAllowed: true,
        manualFallbackAllowed: true,
        canExportReports: true
      },
      teacher: {
        enabled: true,
        canScanStudents: true,
        canScanTeachers: false,
        canScanStaff: false,
        canScanPrincipal: false,
        canEnrollFaces: true,
        liteModeAllowed: true,
        manualFallbackAllowed: false,
        canExportReports: false
      },
      staff: {
        enabled: true,
        canScanStudents: true,
        canScanTeachers: false,
        canScanStaff: true,
        canScanPrincipal: false,
        canEnrollFaces: false,
        liteModeAllowed: true,
        manualFallbackAllowed: false,
        canExportReports: false
      },
      student: {
        enabled: true,
        canScanStudents: false,
        canScanTeachers: false,
        canScanStaff: false,
        canScanPrincipal: false,
        canEnrollFaces: false,
        liteModeAllowed: true,
        manualFallbackAllowed: false,
        selfCheckInEnabled: false,
        canExportReports: false
      }
    },
    operatorOverrides: {}
  };
}

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
    ['attendance_rate', "TEXT DEFAULT '96%'"],
    ['passport_no', 'TEXT'],
    ['nationality', "TEXT DEFAULT 'Pakistani'"]
  ];
  for (const [c, d] of studentCols) safeAddCol('local_school_students', c, d);

  const feeCols = [
    ['tenant_id', "TEXT DEFAULT 'tenant-root-platform'"],
    ['student_id', 'TEXT'],
    ['payment_mode', 'TEXT'],
    ['resource_reference', 'TEXT'],
    ['collected_by', 'TEXT'],
    ['collector_role', "TEXT DEFAULT 'owner'"],
    ['paid_amount', 'REAL DEFAULT 0'],
    ['notes', 'TEXT']
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
  safeAddCol('local_school_attendance', 'check_in_time', 'TEXT');
  safeAddCol('local_school_attendance', 'scheduled_start_time', "TEXT DEFAULT '08:00'");
  safeAddCol('local_school_attendance', 'late_minutes', 'INTEGER DEFAULT 0');
  safeAddCol('local_school_attendance', 'late_by_label', 'TEXT');
  safeAddCol('local_school_attendance', 'punch_type', "TEXT DEFAULT 'IN'");
  safeAddCol('local_school_attendance', 'gate_name', "TEXT DEFAULT 'Main Turnstile 01'");
  safeAddCol('local_school_attendance', 'member_category', "TEXT DEFAULT 'student'");
  safeAddCol('local_school_attendance', 'confidence_score', 'REAL DEFAULT 0');
  safeAddCol('local_school_attendance', 'verified_by', "TEXT DEFAULT 'Camera Face Verification'");
  safeAddCol('local_school_attendance', 'marked_by_role', "TEXT DEFAULT 'owner'");
  safeAddCol('local_school_attendance', 'remarks', 'TEXT');
  safeAddCol('local_school_face_profiles', 'is_synced', 'INTEGER DEFAULT 0');

  const teacherCols = [
    ['tenant_id', "TEXT DEFAULT 'tenant-root-platform'"],
    ['father_name', 'TEXT'],
    ['subject', 'TEXT'],
    ['qualification', 'TEXT'],
    ['classes', 'TEXT'],
    ['incharge_class', 'TEXT'],
    ['gender', "TEXT DEFAULT 'Male'"],
    ['dob', 'TEXT'],
    ['blood_group', "TEXT DEFAULT 'B+'"],
    ['cnic', 'TEXT'],
    ['passport_no', 'TEXT'],
    ['nationality', "TEXT DEFAULT 'Pakistani'"],
    ['emergency_contact', 'TEXT'],
    ['address', 'TEXT'],
    ['basic_salary', 'REAL DEFAULT 0'],
    ['salary_status', "TEXT DEFAULT 'Pending'"],
    ['last_salary_month', 'TEXT']
  ];
  for (const [c, d] of teacherCols) safeAddCol('local_school_teachers', c, d);

  const staffExtraCols = [
    ['father_name', 'TEXT'],
    ['cnic', 'TEXT'],
    ['passport_no', 'TEXT'],
    ['nationality', "TEXT DEFAULT 'Pakistani'"],
    ['gender', "TEXT DEFAULT 'Male'"],
    ['dob', 'TEXT'],
    ['blood_group', "TEXT DEFAULT 'B+'"],
    ['emergency_contact', 'TEXT'],
    ['address', 'TEXT']
  ];
  for (const [c, d] of staffExtraCols) safeAddCol('local_school_staff', c, d);
  for (const [c, d] of staffExtraCols) safeAddCol('local_school_principals', c, d);

  safeAddCol('local_school_exams', 'tenant_id', "TEXT DEFAULT 'tenant-root-platform'");
  safeAddCol('local_school_results', 'tenant_id', "TEXT DEFAULT 'tenant-root-platform'");

  try {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS local_school_petty_vouchers (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        voucher_no TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        paid_to TEXT,
        recorded_by TEXT,
        collector_role TEXT DEFAULT 'accountant',
        closing_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_staff (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        emp_code TEXT NOT NULL,
        name TEXT NOT NULL,
        role_title TEXT NOT NULL,
        department TEXT DEFAULT 'Administration',
        phone TEXT,
        shift TEXT DEFAULT 'Morning (07:30 AM - 03:00 PM)',
        status TEXT DEFAULT 'ACTIVE',
        attendance_status TEXT DEFAULT 'Absent',
        face_enrolled INTEGER DEFAULT 0,
        lite_enabled INTEGER DEFAULT 1,
        is_synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_principals (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        emp_code TEXT NOT NULL,
        name TEXT NOT NULL,
        role_title TEXT NOT NULL,
        department TEXT DEFAULT 'Executive Directorate',
        phone TEXT,
        email TEXT,
        shift TEXT DEFAULT 'Full Day (07:30 AM - 04:00 PM)',
        status TEXT DEFAULT 'ACTIVE',
        attendance_status TEXT DEFAULT 'Absent',
        face_enrolled INTEGER DEFAULT 0,
        lite_enabled INTEGER DEFAULT 1,
        is_synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_face_profiles (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        member_id TEXT NOT NULL,
        member_category TEXT NOT NULL,
        member_name TEXT NOT NULL,
        member_code TEXT,
        grade_or_dept TEXT,
        face_descriptor_json TEXT NOT NULL,
        face_photo_data TEXT,
        face_hash TEXT NOT NULL,
        quality_score REAL DEFAULT 92,
        lite_enabled INTEGER DEFAULT 1,
        enrolled_by TEXT DEFAULT 'owner',
        enrolled_at TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_attendance_policy (
        tenant_id TEXT PRIMARY KEY,
        policy_json TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_table_schemas (
        tenant_id TEXT NOT NULL,
        table_id TEXT NOT NULL,
        custom_title TEXT,
        hidden_columns_json TEXT DEFAULT '[]',
        hidden_column_labels_json TEXT DEFAULT '[]',
        hidden_form_fields_json TEXT DEFAULT '[]',
        renamed_headers_json TEXT DEFAULT '{}',
        renamed_headers_by_label_json TEXT DEFAULT '{}',
        custom_columns_json TEXT DEFAULT '[]',
        updated_by TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tenant_id, table_id)
      );
      CREATE TABLE IF NOT EXISTS local_school_table_rows (
        tenant_id TEXT NOT NULL,
        table_id TEXT NOT NULL,
        row_key TEXT NOT NULL,
        row_label TEXT,
        values_json TEXT NOT NULL DEFAULT '{}',
        submitted_by_name TEXT,
        submitted_by_role TEXT DEFAULT 'owner',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tenant_id, table_id, row_key)
      );
      CREATE TABLE IF NOT EXISTS local_school_table_cells (
        tenant_id TEXT NOT NULL,
        table_id TEXT NOT NULL,
        row_key TEXT NOT NULL,
        col_id TEXT NOT NULL,
        cell_value TEXT DEFAULT '',
        submitted_by_name TEXT,
        submitted_by_role TEXT DEFAULT 'owner',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tenant_id, table_id, row_key, col_id)
      );
    `);
    try {
      sqliteDb.exec("ALTER TABLE local_school_table_schemas ADD COLUMN hidden_form_fields_json TEXT DEFAULT '[]'");
    } catch {}
  } catch {}
}

export function createSchoolRouter(sqliteDb, db, getCollectionDocs, memorySeedData) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);
  ensureColumnMigrations(sqliteDb);

  const resolveTenantId = (req) =>
    String(req?.headers?.['x-tenant-id'] || req?.query?.tenantId || req?.body?.tenantId || ROOT_TENANT_ID).trim() || ROOT_TENANT_ID;

  const resolveUserRole = (req) =>
    String(req?.headers?.['x-user-role'] || req?.user?.role || '').trim().toLowerCase();

  const OWNER_ROLES = new Set(['owner', 'super_admin', 'client_admin', 'admin']);

  const requireOwnerRole = (req, res, next) => {
    const role = resolveUserRole(req);
    if (!role || !OWNER_ROLES.has(role)) {
      return res.status(403).json({
        ok: false,
        error: 'OWNER_ONLY_FORBIDDEN',
        message: 'Only School Business Owner can customize table schemas, form fields, or edit/delete submitted table records.'
      });
    }
    next();
  };

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
    passportNo: dec(r.tenant_id || tid, r.passport_no),
    nationality: r.nationality || 'Pakistani',
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
        .map((r) => vault.decryptFields(r.tenant_id || tid, r, ['fullName', 'guardianName', 'phone', 'studentBForm', 'guardianCnic', 'guardianEmail', 'emergencyContact', 'address', 'passportNo']));
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
    paidAmount: Number(r.paid_amount ?? (r.status === 'PAID' ? r.total : 0)),
    status: r.status || 'PENDING',
    paymentMode: r.payment_mode || '',
    resourceReference: r.resource_reference || '',
    collectedBy: r.collected_by || '',
    collectorRole: r.collector_role || 'owner',
    notes: r.notes || '',
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
    const body = req.body || {};
    const month = body.month || 'April 2026';
    const dueDate = body.dueDate;
    const baseTuition = Number(body.baseTuition ?? body.tuition ?? 18000);
    const labFee = Number(body.labFee ?? 1500);
    const grades = Array.isArray(body.grades)
      ? body.grades
      : (body.grade && body.grade !== 'All Classes' ? [body.grade] : undefined);
    if (Number(baseTuition) < 0 || Number(labFee) < 0) {
      return res.status(400).json({ ok: false, message: 'Base tuition and lab fee must be non-negative.' });
    }

    let targetStudents = [];
    if (sqliteDb) {
      const rows = sqliteDb.prepare('SELECT * FROM local_school_students WHERE tenant_id = ?').all(tid);
      targetStudents = rows
        .map((r) => mapStudentRow(r, tid))
        .filter((s) => !String(s.status || '').includes('ALUMNI') && (!Array.isArray(grades) || grades.length === 0 || grades.some((g) => s.grade.includes(g) || g === s.grade)));
    }
    if (targetStudents.length === 0 && tid === ROOT_TENANT_ID) {
      targetStudents = defaultStudentsSeed.filter((s) => !Array.isArray(grades) || grades.length === 0 || grades.some((g) => s.grade.includes(g) || g === s.grade));
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
          paidAmount: 0,
          status: 'PENDING',
          collectorRole: reqRole,
          dueDate: resolvedDue
        };
        const encName = enc(tid, challan.studentName);
        if (sqliteDb) {
          sqliteDb.prepare(`
            INSERT INTO local_school_fees (
              id, tenant_id, challan_no, student_id, student_name, roll_no, grade, month,
              tuition, lab_fee, discount, total, paid_amount, status, collector_role, due_date, is_synced, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?)
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
      challans: generated,
      generated
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
      collectedBy = 'Accounts Desk',
      partialPayment = false,
      notes = ''
    } = body;
    const reqRole = resolveUserRole(req);
    const collectorRole = String(body.collectorRole || reqRole || (String(collectedBy).toLowerCase().includes('principal') ? 'principal' : 'accountant')).toLowerCase();
    const paidDate = new Date().toISOString().split('T')[0];
    const numPaidNow = Number(amount || 0);

    let updatedFee = null;
    if (sqliteDb && id) {
      const row = sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(id, tid);
      if (row) {
        const totalDue = Number(row.total || 0);
        const previouslyPaid = Number(row.paid_amount || 0);
        const appliedPay = numPaidNow > 0 ? numPaidNow : Math.max(0, totalDue - previouslyPaid);
        const cumulativePaid = Math.min(totalDue > 0 ? totalDue : appliedPay, previouslyPaid + appliedPay);
        const nextStatus = (partialPayment && totalDue > 0 && cumulativePaid < totalDue) ? 'PARTIAL' : 'PAID';
        sqliteDb.prepare(`
          UPDATE local_school_fees
          SET status = ?, paid_amount = ?, paid_date = ?, payment_mode = ?, resource_reference = ?, collected_by = ?, collector_role = ?, notes = ?, is_synced = 0
          WHERE id = ? AND tenant_id = ?
        `).run(nextStatus, cumulativePaid, paidDate, paymentMode, resourceReference, collectedBy, collectorRole, String(notes || ''), id, tid);
        updatedFee = mapFeeRow(sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(id, tid), tid);
      }
    }

    if (sqliteDb && !updatedFee && studentName && numPaidNow > 0) {
      const feeId = 'FEE-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90);
      const resolvedChallanNo = String(challanNo || receiptNo || (`REC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`));
      const encStuName = enc(tid, String(studentName).trim());
      const feeStatus = partialPayment ? 'PARTIAL' : 'PAID';
      sqliteDb.prepare(`
        INSERT INTO local_school_fees (
          id, tenant_id, challan_no, student_id, student_name, roll_no, grade, month, tuition, lab_fee,
          discount, total, paid_amount, status, payment_mode, resource_reference, collected_by, collector_role, notes, due_date, paid_date, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        feeId, tid, resolvedChallanNo, String(studentId || ''), encStuName, String(rollNo), String(grade),
        String(month), numPaidNow, numPaidNow, numPaidNow, feeStatus, String(paymentMode), String(resourceReference),
        String(collectedBy), collectorRole, String(notes || ''), paidDate, paidDate, new Date().toISOString()
      );
      updatedFee = mapFeeRow(sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(feeId, tid), tid);
    }

    const targetStdId = studentId || updatedFee?.studentId;
    if (sqliteDb && targetStdId) {
      const stRow = sqliteDb.prepare('SELECT due_bakaya, fee_amount FROM local_school_students WHERE id = ? AND tenant_id = ?').get(targetStdId, tid);
      if (stRow) {
        const currentDue = Number(stRow.due_bakaya ?? stRow.fee_amount ?? 0);
        if (partialPayment && numPaidNow > 0) {
          const remaining = Math.max(0, currentDue - numPaidNow);
          const nextStudentStatus = remaining === 0 ? 'PAID' : 'PARTIAL';
          sqliteDb.prepare('UPDATE local_school_students SET fee_status = ?, due_bakaya = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?')
            .run(nextStudentStatus, remaining, targetStdId, tid);
        } else {
          sqliteDb.prepare("UPDATE local_school_students SET fee_status = 'PAID', due_bakaya = 0, is_synced = 0 WHERE id = ? AND tenant_id = ?")
            .run(targetStdId, tid);
        }
      }
    }

    if (updatedFee) {
      recordAudit(tid, {
        operatorName: collectedBy || (collectorRole === 'accountant' ? 'Accountant / Fee Clerk' : 'Principal Office'),
        operatorRole: collectorRole === 'accountant' ? 'Accountant / Fee Clerk' : (collectorRole === 'principal' ? 'Principal' : 'School Owner'),
        actionType: updatedFee.status === 'PARTIAL' ? 'Partial Fee Installment Collected' : 'Fee Receipt Collected',
        category: 'Financial',
        entityId: updatedFee.challanNo || updatedFee.id,
        entityDescription: `${updatedFee.studentName} (${updatedFee.grade})`,
        details: `Collected PKR ${numPaidNow > 0 ? numPaidNow : updatedFee.total} via ${paymentMode}${resourceReference ? ' (Ref: ' + resourceReference + ')' : ''} [${updatedFee.status} · Collector: ${collectorRole.toUpperCase()}].`,
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
    fatherName: dec(r.tenant_id || tid, r.father_name),
    designation: r.designation,
    department: r.department,
    subject: r.subject || r.department,
    qualification: r.qualification || 'Masters',
    classes: r.classes || 'All Assigned',
    inchargeClass: r.incharge_class || '',
    gender: r.gender || 'Male',
    dob: r.dob || '',
    bloodGroup: r.blood_group || 'B+',
    cnic: dec(r.tenant_id || tid, r.cnic),
    passportNo: dec(r.tenant_id || tid, r.passport_no),
    nationality: r.nationality || 'Pakistani',
    phone: dec(r.tenant_id || tid, r.phone),
    emergencyContact: dec(r.tenant_id || tid, r.emergency_contact),
    email: dec(r.tenant_id || tid, r.email),
    address: dec(r.tenant_id || tid, r.address),
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
      fatherName: String(t.fatherName || ''),
      designation: String(t.designation || 'Lecturer'),
      department: String(t.department || subject),
      subject,
      qualification: String(t.qualification || 'M.Sc / M.A.'),
      classes: String(t.classes || 'Assigned Classes'),
      inchargeClass: String(t.inchargeClass || ''),
      gender: String(t.gender || 'Male'),
      dob: String(t.dob || ''),
      bloodGroup: String(t.bloodGroup || 'B+'),
      cnic: String(t.cnic || ''),
      passportNo: String(t.passportNo || ''),
      nationality: String(t.nationality || 'Pakistani'),
      phone: String(t.phone || '+92 300 0000000'),
      emergencyContact: String(t.emergencyContact || ''),
      email: String(t.email || ''),
      address: String(t.address || ''),
      salary: typeof t.salary === 'string' && t.salary ? t.salary : `PKR ${basicSalary.toLocaleString()}`,
      basicSalary,
      salaryStatus: String(t.salaryStatus || 'Pending'),
      lastSalaryMonth: String(t.lastSalaryMonth || 'Pending Disbursement'),
      status: String(t.status || 'ACTIVE')
    };

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT INTO local_school_teachers (
          id, tenant_id, emp_code, name, father_name, designation, department, subject, qualification, classes,
          incharge_class, gender, dob, blood_group, cnic, passport_no, nationality, phone, emergency_contact, email, address,
          salary, basic_salary, salary_status, last_salary_month, status, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        teacher.id, tid, teacher.empCode, enc(tid, teacher.name), enc(tid, teacher.fatherName),
        teacher.designation, teacher.department, teacher.subject, teacher.qualification, teacher.classes,
        teacher.inchargeClass, teacher.gender, teacher.dob, teacher.bloodGroup,
        enc(tid, teacher.cnic), enc(tid, teacher.passportNo), teacher.nationality,
        enc(tid, teacher.phone), enc(tid, teacher.emergencyContact), enc(tid, teacher.email), enc(tid, teacher.address),
        enc(tid, teacher.salary), teacher.basicSalary, teacher.salaryStatus, teacher.lastSalaryMonth, teacher.status, new Date().toISOString()
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
  // CAMPUS STAFF, CAMERA FACE PROFILES, OWNER POLICY & ATTENDANCE
  // =========================================================================
  const loadTenantAttendancePolicy = (tid) => {
    const defaults = getDefaultAttendancePolicy();
    if (!sqliteDb) return defaults;
    try {
      const row = sqliteDb.prepare('SELECT policy_json FROM local_school_attendance_policy WHERE tenant_id = ?').get(tid);
      if (row?.policy_json) {
        const parsed = JSON.parse(row.policy_json);
        return {
          ...defaults,
          ...parsed,
          categories: {
            student: { ...defaults.categories.student, ...(parsed.categories?.student || {}) },
            teacher: { ...defaults.categories.teacher, ...(parsed.categories?.teacher || {}) },
            staff: { ...defaults.categories.staff, ...(parsed.categories?.staff || {}) },
            principal: { ...defaults.categories.principal, ...(parsed.categories?.principal || {}) }
          },
          roleAccess: {
            principal: { ...defaults.roleAccess.principal, ...(parsed.roleAccess?.principal || {}) },
            teacher: { ...defaults.roleAccess.teacher, ...(parsed.roleAccess?.teacher || {}) },
            staff: { ...defaults.roleAccess.staff, ...(parsed.roleAccess?.staff || {}) },
            student: { ...defaults.roleAccess.student, ...(parsed.roleAccess?.student || {}) }
          },
          operatorOverrides: parsed.operatorOverrides || {}
        };
      }
    } catch {}
    return defaults;
  };

  const getAllowedAttendanceCategoriesForRole = (policy, role) => {
    if (!role || OWNER_ROLES.has(role)) {
      return ['student', 'teacher', 'staff', 'principal'];
    }
    if (!['principal', 'teacher', 'staff', 'student'].includes(role)) {
      return [];
    }
    const rolePerms = policy?.roleAccess?.[role];
    if (!rolePerms || rolePerms.enabled === false) {
      return [];
    }
    const cats = policy?.categories || {};
    if (role === 'student') {
      if (cats.student?.enabled === false) return [];
      return (rolePerms.selfCheckInEnabled || rolePerms.canEnrollFaces) ? ['student'] : [];
    }
    const allowed = [];
    if (cats.student?.enabled !== false && rolePerms.canScanStudents) allowed.push('student');
    if (cats.teacher?.enabled !== false && rolePerms.canScanTeachers) allowed.push('teacher');
    if (cats.staff?.enabled !== false && rolePerms.canScanStaff) allowed.push('staff');
    if (cats.principal?.enabled !== false && rolePerms.canScanPrincipal) allowed.push('principal');
    return allowed;
  };

  const canRolePerformAttendanceAction = (policy, role, memberCategory, action) => {
    if (!role || OWNER_ROLES.has(role)) {
      return { allowed: true };
    }
    if (!['principal', 'teacher', 'staff', 'student'].includes(role)) {
      return {
        allowed: false,
        message: `Role '${role}' is not authorized to perform attendance ${action} actions.`
      };
    }
    const rolePerms = policy?.roleAccess?.[role];
    if (!rolePerms || rolePerms.enabled === false) {
      return {
        allowed: false,
        message: `School Owner has revoked attendance verification permission for '${role}'.`
      };
    }
    const catRule = policy?.categories?.[memberCategory];
    if (!catRule || catRule.enabled === false) {
      return {
        allowed: false,
        message: `Attendance verification for '${memberCategory}' is disabled by School Owner.`
      };
    }
    if (role === 'student') {
      if (memberCategory !== 'student') {
        return {
          allowed: false,
          message: 'Student portal is restricted to student attendance only.'
        };
      }
      if (action === 'manual') {
        return {
          allowed: false,
          message: `Role '${role}' is not authorized to mark manual attendance.`
        };
      }
      if (action === 'enroll') {
        return rolePerms.canEnrollFaces
          ? { allowed: true }
          : { allowed: false, message: 'School Owner has disabled student face enrollment.' };
      }
      return rolePerms.selfCheckInEnabled
        ? { allowed: true }
        : { allowed: false, message: 'School Owner has disabled student self camera attendance verification.' };
    }
    const categoryPermMap = {
      student: Boolean(rolePerms.canScanStudents),
      teacher: Boolean(rolePerms.canScanTeachers),
      staff: Boolean(rolePerms.canScanStaff),
      principal: Boolean(rolePerms.canScanPrincipal)
    };
    if (!categoryPermMap[memberCategory]) {
      return {
        allowed: false,
        message: `School Owner has not granted '${role}' permission to take '${memberCategory}' attendance.`
      };
    }
    if (action === 'manual' && (policy?.requireCameraForAllAttendance || !rolePerms.manualFallbackAllowed)) {
      return {
        allowed: false,
        message: `Manual attendance override is disabled for '${role}' by School Owner policy.`
      };
    }
    if (action === 'enroll' && !rolePerms.canEnrollFaces) {
      return {
        allowed: false,
        message: `Face enrollment is disabled for '${role}' by School Owner policy.`
      };
    }
    return { allowed: true };
  };

  const mapStaffRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    empCode: r.emp_code,
    name: dec(r.tenant_id || tid, r.name),
    fatherName: dec(r.tenant_id || tid, r.father_name),
    cnic: dec(r.tenant_id || tid, r.cnic),
    passportNo: dec(r.tenant_id || tid, r.passport_no),
    nationality: r.nationality || 'Pakistani',
    gender: r.gender || 'Male',
    dob: r.dob || '',
    bloodGroup: r.blood_group || 'B+',
    roleTitle: r.role_title,
    department: r.department || 'Administration',
    phone: dec(r.tenant_id || tid, r.phone),
    emergencyContact: dec(r.tenant_id || tid, r.emergency_contact),
    address: dec(r.tenant_id || tid, r.address),
    shift: r.shift || 'Morning (07:30 AM - 03:00 PM)',
    status: r.status || 'ACTIVE',
    attendanceStatus: r.attendance_status || 'Absent',
    faceEnrolled: r.face_enrolled === 1,
    liteEnabled: r.lite_enabled !== 0
  });

  router.get('/staff', (req, res) => {
    const tid = resolveTenantId(req);
    let staff = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_staff WHERE tenant_id = ? ORDER BY created_at DESC').all(tid);
        staff = rows.map((r) => mapStaffRow(r, tid));
      } catch {}
    }
    if (staff.length === 0 && tid === ROOT_TENANT_ID) {
      staff = SCHOOL_STAFF.map((s) => ({ ...s, tenantId: tid }));
    }
    res.json({ ok: true, tenantId: tid, staff });
  });

  router.post('/staff', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const roleTitle = String(b.roleTitle || b.designation || '').trim();
    if (!name || !roleTitle) {
      return res.status(400).json({ ok: false, message: 'Staff name and roleTitle are required.' });
    }
    const staffItem = {
      id: b.id || ('STF-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      empCode: String(b.empCode || `STF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`).trim(),
      name,
      fatherName: String(b.fatherName || '').trim(),
      cnic: String(b.cnic || '').trim(),
      passportNo: String(b.passportNo || '').trim(),
      nationality: String(b.nationality || 'Pakistani').trim(),
      gender: String(b.gender || 'Male').trim(),
      dob: String(b.dob || '').trim(),
      bloodGroup: String(b.bloodGroup || 'B+').trim(),
      roleTitle,
      department: String(b.department || 'Administration').trim(),
      phone: String(b.phone || '+92 300 0000000').trim(),
      emergencyContact: String(b.emergencyContact || '').trim(),
      address: String(b.address || '').trim(),
      shift: String(b.shift || 'Morning (07:30 AM - 03:00 PM)').trim(),
      status: String(b.status || 'ACTIVE').toUpperCase(),
      attendanceStatus: String(b.attendanceStatus || 'Absent'),
      faceEnrolled: Boolean(b.faceEnrolled),
      liteEnabled: b.liteEnabled !== false
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_staff
        (id, tenant_id, emp_code, name, father_name, cnic, passport_no, nationality, gender, dob, blood_group, role_title, department, phone, emergency_contact, address, shift, status, attendance_status, face_enrolled, lite_enabled, is_synced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        staffItem.id, tid, staffItem.empCode, enc(tid, staffItem.name), enc(tid, staffItem.fatherName),
        enc(tid, staffItem.cnic), enc(tid, staffItem.passportNo), staffItem.nationality, staffItem.gender,
        staffItem.dob, staffItem.bloodGroup, staffItem.roleTitle, staffItem.department,
        enc(tid, staffItem.phone), enc(tid, staffItem.emergencyContact), enc(tid, staffItem.address),
        staffItem.shift, staffItem.status, staffItem.attendanceStatus,
        staffItem.faceEnrolled ? 1 : 0, staffItem.liteEnabled ? 1 : 0, new Date().toISOString()
      );
    }
    if (db) {
      setDoc(doc(db, 'school_staff', staffItem.id), { ...staffItem, tenant_id: tid, synced_at: new Date().toISOString() }, { merge: true }).catch(() => {});
    }
    res.status(201).json({ ok: true, staff: staffItem });
  });

  router.put('/staff/:id', rejectRestrictedRole(['student', 'parent']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    const b = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_staff WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Staff record not found for this tenant' });
    sqliteDb.prepare(`
      UPDATE local_school_staff SET
        name = COALESCE(?, name),
        father_name = COALESCE(?, father_name),
        cnic = COALESCE(?, cnic),
        passport_no = COALESCE(?, passport_no),
        nationality = COALESCE(?, nationality),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        blood_group = COALESCE(?, blood_group),
        role_title = COALESCE(?, role_title),
        department = COALESCE(?, department),
        phone = COALESCE(?, phone),
        emergency_contact = COALESCE(?, emergency_contact),
        address = COALESCE(?, address),
        shift = COALESCE(?, shift),
        status = COALESCE(?, status),
        attendance_status = COALESCE(?, attendance_status),
        face_enrolled = COALESCE(?, face_enrolled),
        lite_enabled = COALESCE(?, lite_enabled)
      WHERE id = ? AND tenant_id = ?
    `).run(
      b.name ? enc(tid, b.name) : null,
      b.fatherName !== undefined ? enc(tid, b.fatherName) : null,
      b.cnic !== undefined ? enc(tid, b.cnic) : null,
      b.passportNo !== undefined ? enc(tid, b.passportNo) : null,
      b.nationality ?? null,
      b.gender ?? null,
      b.dob ?? null,
      b.bloodGroup ?? null,
      b.roleTitle ?? null,
      b.department ?? null,
      b.phone ? enc(tid, b.phone) : null,
      b.emergencyContact !== undefined ? enc(tid, b.emergencyContact) : null,
      b.address !== undefined ? enc(tid, b.address) : null,
      b.shift ?? null,
      b.status ?? null,
      b.attendanceStatus ?? null,
      b.faceEnrolled !== undefined ? (b.faceEnrolled ? 1 : 0) : null,
      b.liteEnabled !== undefined ? (b.liteEnabled ? 1 : 0) : null,
      id, tid
    );
    const updated = sqliteDb.prepare('SELECT * FROM local_school_staff WHERE id = ? AND tenant_id = ?').get(id, tid);
    res.json({ ok: true, staff: mapStaffRow(updated, tid) });
  });

  router.delete('/staff/:id', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id FROM local_school_staff WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Staff record not found for this tenant' });
    sqliteDb.prepare('DELETE FROM local_school_staff WHERE id = ? AND tenant_id = ?').run(id, tid);
    try { sqliteDb.prepare('DELETE FROM encrypted_domain_records WHERE tenant_id = ? AND domain_key = ? AND id LIKE ?').run(tid, 'school_business', `%:${id}`); } catch {}
    res.json({ ok: true, id });
  });

  const mapPrincipalRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    empCode: r.emp_code,
    name: dec(r.tenant_id || tid, r.name),
    fatherName: dec(r.tenant_id || tid, r.father_name),
    cnic: dec(r.tenant_id || tid, r.cnic),
    passportNo: dec(r.tenant_id || tid, r.passport_no),
    nationality: r.nationality || 'Pakistani',
    gender: r.gender || 'Male',
    dob: r.dob || '',
    bloodGroup: r.blood_group || 'O+',
    roleTitle: r.role_title,
    department: r.department || 'Executive Directorate',
    phone: dec(r.tenant_id || tid, r.phone),
    emergencyContact: dec(r.tenant_id || tid, r.emergency_contact),
    email: dec(r.tenant_id || tid, r.email),
    address: dec(r.tenant_id || tid, r.address),
    shift: r.shift || 'Full Day (07:30 AM - 04:00 PM)',
    status: r.status || 'ACTIVE',
    attendanceStatus: r.attendance_status || 'Absent',
    faceEnrolled: r.face_enrolled === 1,
    liteEnabled: r.lite_enabled !== 0
  });

  router.get('/principals', (req, res) => {
    const tid = resolveTenantId(req);
    let principals = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_principals WHERE tenant_id = ? ORDER BY created_at DESC').all(tid);
        principals = rows.map((r) => mapPrincipalRow(r, tid));
      } catch {}
    }
    if (principals.length === 0 && tid === ROOT_TENANT_ID) {
      principals = SCHOOL_PRINCIPALS.map((p) => ({ ...p, tenantId: tid }));
    }
    res.json({ ok: true, tenantId: tid, principals });
  });

  router.post('/principals', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const roleTitle = String(b.roleTitle || b.designation || 'Principal & Academic Director').trim();
    if (!name || !roleTitle) {
      return res.status(400).json({ ok: false, message: 'Principal name and roleTitle are required.' });
    }
    const principalItem = {
      id: b.id || ('PRI-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      empCode: String(b.empCode || `DIR-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`).trim(),
      name,
      fatherName: String(b.fatherName || '').trim(),
      cnic: String(b.cnic || '').trim(),
      passportNo: String(b.passportNo || '').trim(),
      nationality: String(b.nationality || 'Pakistani').trim(),
      gender: String(b.gender || 'Male').trim(),
      dob: String(b.dob || '').trim(),
      bloodGroup: String(b.bloodGroup || 'O+').trim(),
      roleTitle,
      department: String(b.department || 'Executive Directorate').trim(),
      phone: String(b.phone || '+92 300 0000000').trim(),
      emergencyContact: String(b.emergencyContact || '').trim(),
      email: String(b.email || 'principal@campus.edu').trim(),
      address: String(b.address || '').trim(),
      shift: String(b.shift || 'Full Day (07:30 AM - 04:00 PM)').trim(),
      status: String(b.status || 'ACTIVE').toUpperCase(),
      attendanceStatus: String(b.attendanceStatus || 'Absent'),
      faceEnrolled: Boolean(b.faceEnrolled),
      liteEnabled: b.liteEnabled !== false
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_principals
        (id, tenant_id, emp_code, name, father_name, cnic, passport_no, nationality, gender, dob, blood_group, role_title, department, phone, emergency_contact, email, address, shift, status, attendance_status, face_enrolled, lite_enabled, is_synced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        principalItem.id, tid, principalItem.empCode, enc(tid, principalItem.name), enc(tid, principalItem.fatherName),
        enc(tid, principalItem.cnic), enc(tid, principalItem.passportNo), principalItem.nationality, principalItem.gender,
        principalItem.dob, principalItem.bloodGroup, principalItem.roleTitle, principalItem.department,
        enc(tid, principalItem.phone), enc(tid, principalItem.emergencyContact), enc(tid, principalItem.email),
        enc(tid, principalItem.address), principalItem.shift, principalItem.status, principalItem.attendanceStatus,
        principalItem.faceEnrolled ? 1 : 0, principalItem.liteEnabled ? 1 : 0, new Date().toISOString()
      );
      recordAudit(tid, {
        operatorName: String(req.headers['x-user-name'] || 'School Owner'),
        operatorRole: String(req.headers['x-user-role'] || 'School Owner'),
        actionType: 'Principal / Vice Principal Registered',
        category: 'Administrative',
        entityId: principalItem.id,
        entityDescription: `${principalItem.name} (${principalItem.empCode}) · ${principalItem.roleTitle}`,
        details: `Registered in local SQLite & queued for Cloud Firestore sync under tenant ${tid}.`,
        severity: 'Normal Audit'
      });
    }
    if (db) {
      setDoc(doc(db, 'school_principals', principalItem.id), {
        id: principalItem.id,
        tenant_id: tid,
        empCode: principalItem.empCode,
        name: enc(tid, principalItem.name),
        fatherName: enc(tid, principalItem.fatherName),
        cnic: enc(tid, principalItem.cnic),
        passportNo: enc(tid, principalItem.passportNo),
        nationality: principalItem.nationality,
        gender: principalItem.gender,
        dob: principalItem.dob,
        bloodGroup: principalItem.bloodGroup,
        roleTitle: principalItem.roleTitle,
        department: principalItem.department,
        phone: enc(tid, principalItem.phone),
        emergencyContact: enc(tid, principalItem.emergencyContact),
        email: enc(tid, principalItem.email),
        address: enc(tid, principalItem.address),
        shift: principalItem.shift,
        status: principalItem.status,
        attendanceStatus: principalItem.attendanceStatus,
        faceEnrolled: principalItem.faceEnrolled,
        liteEnabled: principalItem.liteEnabled,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }, { merge: true }).then(() => {
        try {
          if (sqliteDb) sqliteDb.prepare('UPDATE local_school_principals SET is_synced = 1 WHERE id = ? AND tenant_id = ?').run(principalItem.id, tid);
        } catch {}
      }).catch(() => {});
    }
    res.status(201).json({ ok: true, principal: principalItem });
  });

  router.put('/principals/:id', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    const b = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_principals WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Principal record not found for this tenant' });
    sqliteDb.prepare(`
      UPDATE local_school_principals SET
        name = COALESCE(?, name),
        father_name = COALESCE(?, father_name),
        cnic = COALESCE(?, cnic),
        passport_no = COALESCE(?, passport_no),
        nationality = COALESCE(?, nationality),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        blood_group = COALESCE(?, blood_group),
        role_title = COALESCE(?, role_title),
        department = COALESCE(?, department),
        phone = COALESCE(?, phone),
        emergency_contact = COALESCE(?, emergency_contact),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        shift = COALESCE(?, shift),
        status = COALESCE(?, status),
        attendance_status = COALESCE(?, attendance_status),
        face_enrolled = COALESCE(?, face_enrolled),
        lite_enabled = COALESCE(?, lite_enabled),
        is_synced = 0
      WHERE id = ? AND tenant_id = ?
    `).run(
      b.name ? enc(tid, b.name) : null,
      b.fatherName !== undefined ? enc(tid, b.fatherName) : null,
      b.cnic !== undefined ? enc(tid, b.cnic) : null,
      b.passportNo !== undefined ? enc(tid, b.passportNo) : null,
      b.nationality ?? null,
      b.gender ?? null,
      b.dob ?? null,
      b.bloodGroup ?? null,
      b.roleTitle ?? null,
      b.department ?? null,
      b.phone ? enc(tid, b.phone) : null,
      b.emergencyContact !== undefined ? enc(tid, b.emergencyContact) : null,
      b.email ? enc(tid, b.email) : null,
      b.address !== undefined ? enc(tid, b.address) : null,
      b.shift ?? null,
      b.status ?? null,
      b.attendanceStatus ?? null,
      b.faceEnrolled !== undefined ? (b.faceEnrolled ? 1 : 0) : null,
      b.liteEnabled !== undefined ? (b.liteEnabled ? 1 : 0) : null,
      id, tid
    );
    const updated = sqliteDb.prepare('SELECT * FROM local_school_principals WHERE id = ? AND tenant_id = ?').get(id, tid);
    res.json({ ok: true, principal: mapPrincipalRow(updated, tid) });
  });

  router.delete('/principals/:id', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant', 'principal']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id FROM local_school_principals WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Principal record not found for this tenant' });
    sqliteDb.prepare('DELETE FROM local_school_principals WHERE id = ? AND tenant_id = ?').run(id, tid);
    try { sqliteDb.prepare('DELETE FROM encrypted_domain_records WHERE tenant_id = ? AND domain_key = ? AND id LIKE ?').run(tid, 'school_business', `%:${id}`); } catch {}
    res.json({ ok: true, id });
  });

  router.get('/attendance/policy', (req, res) => {
    const tid = resolveTenantId(req);
    const policy = loadTenantAttendancePolicy(tid);
    res.json({ ok: true, tenantId: tid, policy });
  });

  router.put('/attendance/policy', async (req, res) => {
    const tid = resolveTenantId(req);
    const role = resolveUserRole(req);
    if (role && !['owner', 'client_admin', 'super_admin', 'admin'].includes(role)) {
      return res.status(403).json({
        ok: false,
        error: 'ROLE_FORBIDDEN',
        message: 'Only School Owner can update attendance verification mode, lite controls, and access permissions.'
      });
    }
    const current = loadTenantAttendancePolicy(tid);
    const b = req.body || {};
    const merged = {
      ...current,
      ...b,
      categories: {
        student: { ...current.categories.student, ...(b.categories?.student || {}) },
        teacher: { ...current.categories.teacher, ...(b.categories?.teacher || {}) },
        staff: { ...current.categories.staff, ...(b.categories?.staff || {}) },
        principal: { ...current.categories.principal, ...(b.categories?.principal || {}) }
      },
      roleAccess: {
        principal: { ...current.roleAccess.principal, ...(b.roleAccess?.principal || {}) },
        teacher: { ...current.roleAccess.teacher, ...(b.roleAccess?.teacher || {}) },
        staff: { ...current.roleAccess.staff, ...(b.roleAccess?.staff || {}) },
        student: { ...current.roleAccess.student, ...(b.roleAccess?.student || {}) }
      },
      operatorOverrides: { ...(current.operatorOverrides || {}), ...(b.operatorOverrides || {}) }
    };
    if (b.roleAccess?.student?.selfCheckInEnabled !== undefined && b.categories?.student?.allowSelfCheckIn === undefined) {
      merged.categories.student.allowSelfCheckIn = Boolean(b.roleAccess.student.selfCheckInEnabled);
    } else if (b.categories?.student?.allowSelfCheckIn !== undefined && b.roleAccess?.student?.selfCheckInEnabled === undefined) {
      merged.roleAccess.student.selfCheckInEnabled = Boolean(b.categories.student.allowSelfCheckIn);
    }

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_attendance_policy (tenant_id, policy_json, updated_at)
        VALUES (?, ?, ?)
      `).run(tid, JSON.stringify(merged), new Date().toISOString());
      recordAudit(tid, {
        operatorName: String(req.headers['x-user-name'] || 'School Owner'),
        operatorRole: 'School Owner',
        actionType: 'Attendance Policy & Lite Access Updated',
        category: 'Security & Biometric',
        entityId: tid,
        entityDescription: `Mode: ${merged.verificationMode} | Fill-Light: ${merged.cameraFillLightEnabled ? 'ON' : 'OFF'} | Threshold: ${merged.confidenceThreshold}%`,
        details: `Principal: ${merged.roleAccess.principal.enabled}, Teacher: ${merged.roleAccess.teacher.enabled}, Staff: ${merged.roleAccess.staff.enabled}, Student Self Check-In: ${merged.roleAccess.student.selfCheckInEnabled}`,
        severity: 'Authorized Override',
        verifiedBy: 'School Owner Directorate'
      });
    }
    if (db) {
      setDoc(doc(db, 'school_attendance_policies', tid), { ...merged, tenant_id: tid, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    }
    res.json({ ok: true, tenantId: tid, policy: merged });
  });

  const isMaskedField = (v) => {
    const s = String(v || '').trim();
    return !s || s === '[ENCRYPTED_PROTECTED]' || s === '[LOCKED_VIP_VAULT]';
  };

  const buildMemberNameResolver = async (tid) => {
    const map = new Map();
    const put = (cat, id, name) => {
      const clean = String(name || '').trim();
      if (id && !isMaskedField(clean)) map.set(`${cat}:${id}`, clean);
    };
    if (sqliteDb) {
      try {
        for (const r of sqliteDb.prepare('SELECT id, full_name FROM local_school_students WHERE tenant_id = ?').all(tid)) {
          put('student', r.id, dec(tid, r.full_name));
        }
        for (const r of sqliteDb.prepare('SELECT id, name FROM local_school_teachers WHERE tenant_id = ?').all(tid)) {
          put('teacher', r.id, dec(tid, r.name));
        }
        for (const r of sqliteDb.prepare('SELECT id, name FROM local_school_staff WHERE tenant_id = ?').all(tid)) {
          put('staff', r.id, dec(tid, r.name));
        }
        for (const r of sqliteDb.prepare('SELECT id, name FROM local_school_principals WHERE tenant_id = ?').all(tid)) {
          put('principal', r.id, dec(tid, r.name));
        }
      } catch {}
    }
    if (getCollectionDocs) {
      try {
        const cloudStu = await getCollectionDocs('school_students', defaultStudentsSeed);
        for (const s of cloudStu || []) {
          if (!s.tenant_id || s.tenant_id === tid) {
            put('student', s.id, dec(s.tenant_id || tid, s.fullName || s.name || ''));
          }
        }
      } catch {}
      try {
        const cloudTch = await getCollectionDocs('school_teachers', defaultTeachersSeed);
        for (const t of cloudTch || []) {
          if (!t.tenant_id || t.tenant_id === tid) {
            put('teacher', t.id, dec(t.tenant_id || tid, t.name || ''));
          }
        }
      } catch {}
    }
    for (const s of defaultStudentsSeed || []) put('student', s.id, s.fullName || s.name);
    for (const t of defaultTeachersSeed || []) put('teacher', t.id, t.name);
    for (const st of SCHOOL_STAFF || []) put('staff', st.id, st.name);
    for (const pr of SCHOOL_PRINCIPALS || []) put('principal', pr.id, pr.name);
    return map;
  };

  router.get('/attendance/face-profiles', async (req, res) => {
    const tid = resolveTenantId(req);
    const category = String(req.query?.category || '').trim().toLowerCase();
    let profiles = [];
    if (sqliteDb) {
      try {
        const rows = category
          ? sqliteDb.prepare('SELECT * FROM local_school_face_profiles WHERE tenant_id = ? AND member_category = ? ORDER BY updated_at DESC').all(tid, category)
          : sqliteDb.prepare('SELECT * FROM local_school_face_profiles WHERE tenant_id = ? ORDER BY updated_at DESC').all(tid);
        profiles = rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || tid,
          memberId: r.member_id,
          memberCategory: r.member_category,
          memberName: dec(r.tenant_id || tid, r.member_name),
          memberCode: r.member_code || '',
          gradeOrDept: r.grade_or_dept || '',
          faceDescriptor: (() => { try { return JSON.parse(r.face_descriptor_json || '[]'); } catch { return []; } })(),
          facePhotoData: r.face_photo_data || '',
          faceHash: r.face_hash,
          qualityScore: Number(r.quality_score ?? 92),
          liteEnabled: r.lite_enabled !== 0,
          enrolledBy: r.enrolled_by || 'owner',
          enrolledAt: r.enrolled_at,
          isSynced: r.is_synced === 1
        }));
      } catch {}
    }
    if (profiles.length === 0 && getCollectionDocs) {
      try {
        const cloudProfiles = await getCollectionDocs('school_face_profiles', []);
        profiles = (cloudProfiles || [])
          .filter((p) => (!p.tenant_id || p.tenant_id === tid) && (!category || p.memberCategory === category))
          .map((p) => ({
            ...p,
            memberName: dec(p.tenant_id || tid, p.memberName || ''),
            isSynced: true
          }));
      } catch {}
    }
    if (profiles.some((p) => isMaskedField(p.memberName))) {
      const resolver = await buildMemberNameResolver(tid);
      profiles = profiles.map((p) => {
        if (!isMaskedField(p.memberName)) return p;
        const resolved = resolver.get(`${p.memberCategory}:${p.memberId}`);
        return { ...p, memberName: resolved || p.memberCode || p.memberId || 'Campus Member' };
      });
    }
    const role = resolveUserRole(req);
    if (role && !OWNER_ROLES.has(role)) {
      const policy = loadTenantAttendancePolicy(tid);
      const allowedCategories = getAllowedAttendanceCategoriesForRole(policy, role);
      profiles = profiles.filter((p) => allowedCategories.includes(String(p.memberCategory || 'student').toLowerCase()));
    }
    res.json({ ok: true, tenantId: tid, profiles });
  });

  router.post('/attendance/face-profiles', (req, res) => {
    const tid = resolveTenantId(req);
    const role = resolveUserRole(req);
    const b = req.body || {};
    const memberId = String(b.memberId || '').trim();
    const memberCategory = String(b.memberCategory || 'student').trim().toLowerCase();
    const memberName = String(b.memberName || '').trim();
    const descriptor = Array.isArray(b.faceDescriptor) ? b.faceDescriptor.map(Number) : [];
    if (!['student', 'teacher', 'staff', 'principal'].includes(memberCategory)) {
      return res.status(400).json({ ok: false, message: 'memberCategory must be student, teacher, staff, or principal.' });
    }
    const policy = loadTenantAttendancePolicy(tid);
    const permCheck = canRolePerformAttendanceAction(policy, role, memberCategory, 'enroll');
    if (!permCheck.allowed) {
      return res.status(403).json({
        ok: false,
        error: 'ROLE_FORBIDDEN',
        message: permCheck.message
      });
    }
    if (!memberId || !memberName || descriptor.length < 8) {
      return res.status(400).json({ ok: false, message: 'memberId, memberName, and valid camera faceDescriptor are required.' });
    }
    const id = b.id || `FP-${memberCategory}-${memberId}`;
    const enrolledAt = String(b.enrolledAt || new Date().toISOString());
    const profile = {
      id,
      tenantId: tid,
      memberId,
      memberCategory,
      memberName,
      memberCode: String(b.memberCode || memberId),
      gradeOrDept: String(b.gradeOrDept || ''),
      faceDescriptor: descriptor,
      facePhotoData: String(b.facePhotoData || ''),
      faceHash: String(b.faceHash || `FACE-SHA-${memberId}`),
      qualityScore: Number(b.qualityScore ?? 94),
      liteEnabled: b.liteEnabled !== false,
      enrolledBy: String(b.enrolledBy || resolveUserRole(req) || 'kiosk'),
      enrolledAt,
      isSynced: false
    };

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_face_profiles
        (id, tenant_id, member_id, member_category, member_name, member_code, grade_or_dept, face_descriptor_json, face_photo_data, face_hash, quality_score, lite_enabled, enrolled_by, enrolled_at, is_synced, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        profile.id, tid, profile.memberId, profile.memberCategory, enc(tid, profile.memberName),
        profile.memberCode, profile.gradeOrDept, JSON.stringify(profile.faceDescriptor), profile.facePhotoData,
        profile.faceHash, profile.qualityScore, profile.liteEnabled ? 1 : 0, profile.enrolledBy, profile.enrolledAt, new Date().toISOString()
      );
      if (memberCategory === 'staff') {
        try {
          sqliteDb.prepare('UPDATE local_school_staff SET face_enrolled = 1 WHERE id = ? AND tenant_id = ?').run(memberId, tid);
        } catch {}
      } else if (memberCategory === 'principal') {
        try {
          sqliteDb.prepare('UPDATE local_school_principals SET face_enrolled = 1, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(memberId, tid);
        } catch {}
      }
    }
    if (db) {
      setDoc(doc(db, 'school_face_profiles', id), {
        id: profile.id,
        tenant_id: tid,
        memberId: profile.memberId,
        memberCategory: profile.memberCategory,
        memberName: enc(tid, profile.memberName),
        memberCode: profile.memberCode,
        gradeOrDept: profile.gradeOrDept,
        faceDescriptor: profile.faceDescriptor,
        facePhotoData: profile.facePhotoData,
        faceHash: profile.faceHash,
        qualityScore: profile.qualityScore,
        liteEnabled: profile.liteEnabled,
        enrolledBy: profile.enrolledBy,
        enrolledAt: profile.enrolledAt,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }, { merge: true }).then(() => {
        try {
          if (sqliteDb) {
            sqliteDb.prepare('UPDATE local_school_face_profiles SET is_synced = 1 WHERE id = ? AND tenant_id = ?').run(id, tid);
          }
        } catch {}
      }).catch(() => {});
    }
    res.status(201).json({ ok: true, profile });
  });

  router.delete('/attendance/face-profiles/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const role = resolveUserRole(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id, member_id, member_category FROM local_school_face_profiles WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Face profile not found for this tenant' });
    const policy = loadTenantAttendancePolicy(tid);
    const permCheck = canRolePerformAttendanceAction(policy, role, String(row.member_category || 'student').toLowerCase(), 'enroll');
    if (!permCheck.allowed) {
      return res.status(403).json({
        ok: false,
        error: 'ROLE_FORBIDDEN',
        message: permCheck.message
      });
    }
    sqliteDb.prepare('DELETE FROM local_school_face_profiles WHERE id = ? AND tenant_id = ?').run(id, tid);
    if (row.member_category === 'staff') {
      try { sqliteDb.prepare('UPDATE local_school_staff SET face_enrolled = 0 WHERE id = ? AND tenant_id = ?').run(row.member_id, tid); } catch {}
    } else if (row.member_category === 'principal') {
      try { sqliteDb.prepare('UPDATE local_school_principals SET face_enrolled = 0, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(row.member_id, tid); } catch {}
    }
    try { sqliteDb.prepare('DELETE FROM encrypted_domain_records WHERE tenant_id = ? AND domain_key = ? AND id LIKE ?').run(tid, 'school_business', `%:${id}`); } catch {}
    res.json({ ok: true, id });
  });

  const parseClockToMinutes = (raw) => {
    const m = String(raw || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?$/i);
    if (!m) return null;
    let h = Number(m[1]);
    const min = Number(m[2]);
    const ap = (m[3] || '').toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  };

  const formatDelayDuration = (mins) => {
    const abs = Math.abs(Math.round(mins));
    const hrs = Math.floor(abs / 60);
    const rem = abs % 60;
    if (hrs <= 0) return `${rem}m`;
    if (rem === 0) return `${hrs}h`;
    return `${hrs}h ${rem}m`;
  };

  const computeLateTimingMeta = (checkInStr, scheduledStartStr, lateCutoffStr, statusStr) => {
    const startMins = parseClockToMinutes(scheduledStartStr || '08:00') ?? 480;
    const cutoffMins = parseClockToMinutes(lateCutoffStr || '08:15') ?? 495;
    const inMins = parseClockToMinutes(checkInStr);
    if (inMins === null) {
      return { scheduledStartTime: scheduledStartStr || '08:00', lateMinutes: 0, lateByLabel: '' };
    }
    const diff = inMins - startMins;
    if (diff < 0) {
      return { scheduledStartTime: scheduledStartStr || '08:00', lateMinutes: diff, lateByLabel: `Early ${formatDelayDuration(diff)}` };
    }
    if (diff === 0) {
      return { scheduledStartTime: scheduledStartStr || '08:00', lateMinutes: 0, lateByLabel: 'On Time' };
    }
    if (inMins <= cutoffMins && String(statusStr || '').toUpperCase() !== 'LATE') {
      return { scheduledStartTime: scheduledStartStr || '08:00', lateMinutes: diff, lateByLabel: `+${formatDelayDuration(diff)} (Grace)` };
    }
    return { scheduledStartTime: scheduledStartStr || '08:00', lateMinutes: diff, lateByLabel: `+${formatDelayDuration(diff)} late` };
  };

  router.get('/attendance', async (req, res) => {
    const tid = resolveTenantId(req);
    const categoryFilter = String(req.query?.category || '').trim().toLowerCase();
    const policy = loadTenantAttendancePolicy(tid);
    let list = [];
    if (sqliteDb) {
      try {
        const rows = categoryFilter
          ? sqliteDb.prepare('SELECT * FROM local_school_attendance WHERE tenant_id = ? AND member_category = ? ORDER BY created_at DESC LIMIT 300').all(tid, categoryFilter)
          : sqliteDb.prepare('SELECT * FROM local_school_attendance WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 300').all(tid);
        list = rows.map((r) => {
          const tsRaw = r.created_at ? new Date(r.created_at) : null;
          const derivedTime = tsRaw && !Number.isNaN(tsRaw.getTime())
            ? tsRaw.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : (r.date || '');
          const punchType = r.punch_type || (String(r.gate_name || '').includes('OUT') ? 'OUT' : 'IN');
          const checkInTime = r.check_in_time || (punchType === 'IN' ? derivedTime : '');
          const scheduledStartTime = r.scheduled_start_time || policy.scheduledStartTime || '08:00';
          const fallbackLate = punchType === 'IN' && checkInTime
            ? computeLateTimingMeta(checkInTime, scheduledStartTime, policy.lateCutoffTime || '08:15', r.status)
            : { lateMinutes: 0, lateByLabel: '' };
          return {
            id: r.id,
            tenantId: r.tenant_id || tid,
            studentId: r.student_id,
            rollNo: r.roll_no,
            studentName: dec(r.tenant_id || tid, r.student_name),
            grade: r.grade,
            memberCategory: r.member_category || 'student',
            status: r.status,
            date: r.date,
            timestamp: r.check_in_time || derivedTime,
            checkInTime,
            scheduledStartTime,
            lateMinutes: r.late_minutes !== null && r.late_minutes !== undefined && r.late_by_label ? Number(r.late_minutes) : fallbackLate.lateMinutes,
            lateByLabel: r.late_by_label || fallbackLate.lateByLabel,
            gateName: r.gate_name || 'Main Turnstile 01',
            punchType,
            verificationMode: r.verification_mode,
            confidenceScore: Number(r.confidence_score ?? 0),
            verifiedBy: r.verified_by || 'Camera Face Verification',
            markedByRole: r.marked_by_role || 'owner',
            remarks: r.remarks || '',
            isSynced: r.is_synced === 1,
            createdAt: r.created_at
          };
        });
      } catch {}
    }
    if (list.length === 0 && getCollectionDocs) {
      try {
        const cloudAtt = await getCollectionDocs('school_attendance', []);
        list = (cloudAtt || [])
          .filter((r) => (!r.tenant_id || r.tenant_id === tid) && (!categoryFilter || String(r.memberCategory || 'student').toLowerCase() === categoryFilter))
          .map((r) => ({
            ...r,
            studentName: dec(r.tenant_id || tid, r.studentName || ''),
            memberCategory: r.memberCategory || 'student',
            isSynced: true
          }));
      } catch {}
    }
    if (list.some((r) => isMaskedField(r.studentName))) {
      const resolver = await buildMemberNameResolver(tid);
      list = list.map((r) => {
        if (!isMaskedField(r.studentName)) return r;
        const resolved = resolver.get(`${r.memberCategory || 'student'}:${r.studentId}`);
        return { ...r, studentName: resolved || r.rollNo || r.studentId || 'Member' };
      });
    }
    res.json({ ok: true, tenantId: tid, attendance: list });
  });

  router.post('/attendance', async (req, res) => {
    const tid = resolveTenantId(req);
    const role = resolveUserRole(req);
    const body = req.body || {};
    const memberCategory = String(body.memberCategory || 'student').trim().toLowerCase();
    if (!['student', 'teacher', 'staff', 'principal'].includes(memberCategory)) {
      return res.status(400).json({ ok: false, message: 'memberCategory must be student, teacher, staff, or principal.' });
    }
    const mode = String(body.verificationMode || body.verification_mode || 'face_camera');
    const isCameraScan = mode.startsWith('face_camera') || mode.startsWith('face_kiosk');
    const policy = loadTenantAttendancePolicy(tid);
    const permCheck = canRolePerformAttendanceAction(policy, role, memberCategory, isCameraScan ? 'camera' : 'manual');
    if (!permCheck.allowed) {
      return res.status(403).json({
        ok: false,
        error: 'ROLE_FORBIDDEN',
        message: permCheck.message
      });
    }

    const recId = body.id || ('att-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90));
    const studentId = String(body.studentId || body.memberId || body.student_id || 'STD-GEN');
    const rollNo = String(body.rollNo || body.memberCode || body.roll_no || 'SCH-GEN');
    const studentName = String(body.studentName || body.memberName || body.student_name || '').trim();
    if (!studentName) {
      return res.status(400).json({ ok: false, message: 'studentName is required to log attendance.' });
    }
    const grade = String(body.grade || body.gradeOrDept || 'Grade 10');
    const status = String(body.status || 'PRESENT').toUpperCase();
    const date = String(body.date || new Date().toISOString().split('T')[0]);
    const punchType = String(body.punchType || 'IN').toUpperCase() === 'OUT' ? 'OUT' : 'IN';
    const gateName = String(body.gateName || `Camera Face Terminal · ${punchType}`);
    const confidenceScore = Number(body.confidenceScore ?? 0);
    const verifiedBy = String(body.verifiedBy || 'Camera Face Verification');
    const markedByRole = String(body.markedByRole || role || 'kiosk');
    const remarks = String(body.remarks || '').trim();

    const scheduledStartTime = String(body.scheduledStartTime || policy.scheduledStartTime || '08:00');
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const checkInTime = String(body.checkInTime || body.timestamp || nowTimeStr);
    const computedLate = punchType === 'IN'
      ? computeLateTimingMeta(checkInTime, scheduledStartTime, policy.lateCutoffTime || '08:15', status)
      : { scheduledStartTime, lateMinutes: 0, lateByLabel: '' };
    const lateMinutes = body.lateMinutes !== undefined ? Number(body.lateMinutes) : computedLate.lateMinutes;
    const lateByLabel = body.lateByLabel !== undefined ? String(body.lateByLabel) : computedLate.lateByLabel;

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_attendance
        (id, tenant_id, student_id, roll_no, student_name, grade, member_category, status, date, check_in_time, scheduled_start_time, late_minutes, late_by_label, punch_type, gate_name, verification_mode, confidence_score, verified_by, marked_by_role, remarks, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        recId, tid, studentId, rollNo, enc(tid, studentName), grade, memberCategory, status, date,
        checkInTime, scheduledStartTime, Number.isFinite(lateMinutes) ? lateMinutes : 0, lateByLabel,
        punchType, gateName, mode, confidenceScore, verifiedBy, markedByRole, remarks
      );
      if (memberCategory === 'principal') {
        try {
          const attLabel = status === 'LATE' ? 'Late' : status === 'ABSENT' ? 'Absent' : status === 'ON LEAVE' || status === 'ON_LEAVE' ? 'On Leave' : 'Present';
          sqliteDb.prepare('UPDATE local_school_principals SET attendance_status = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(attLabel, studentId, tid);
        } catch {}
      } else if (memberCategory === 'staff') {
        try {
          const attLabel = status === 'LATE' ? 'Late' : status === 'ABSENT' ? 'Absent' : status === 'ON LEAVE' || status === 'ON_LEAVE' ? 'On Leave' : 'Present';
          sqliteDb.prepare('UPDATE local_school_staff SET attendance_status = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(attLabel, studentId, tid);
        } catch {}
      }
    }

    const record = {
      id: recId,
      tenantId: tid,
      studentId,
      rollNo,
      studentName,
      grade,
      memberCategory,
      status,
      date,
      checkInTime,
      scheduledStartTime,
      lateMinutes: Number.isFinite(lateMinutes) ? lateMinutes : 0,
      lateByLabel,
      punchType,
      gateName,
      verificationMode: mode,
      confidenceScore,
      verifiedBy,
      markedByRole,
      remarks,
      isSynced: false
    };

    if (db) {
      setDoc(doc(db, 'school_attendance', recId), { ...record, tenant_id: tid, is_synced: 1, synced_at: new Date().toISOString() }, { merge: true })
        .then(() => {
          try {
            if (sqliteDb) {
              sqliteDb.prepare('UPDATE local_school_attendance SET is_synced = 1 WHERE id = ? AND tenant_id = ?').run(recId, tid);
            }
          } catch {}
        })
        .catch(() => {});
    }

    res.json({
      ok: true,
      message: `Attendance marked for ${studentName} (${rollNo}) as ${status} via ${mode.toUpperCase()}.`,
      record
    });
  });

  router.post('/attendance/mark-all', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const date = String(req.body?.date || new Date().toISOString().split('T')[0]);
    const gradeFilter = String(req.body?.grade || '').trim();
    const category = String(req.body?.memberCategory || 'student').trim().toLowerCase();
    let marked = 0;
    if (sqliteDb) {
      const rows = sqliteDb.prepare('SELECT * FROM local_school_students WHERE tenant_id = ?').all(tid);
      const insertStmt = sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_attendance
        (id, tenant_id, student_id, roll_no, student_name, grade, member_category, status, date, gate_name, verification_mode, confidence_score, verified_by, marked_by_role, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PRESENT', ?, 'Bulk Roster Sync', 'manual_bulk', 100, 'Owner Bulk Policy', ?, 0)
      `);
      const actorRole = resolveUserRole(req) || 'owner';
      for (const r of rows) {
        if (String(r.status || '').includes('ALUMNI')) continue;
        if (gradeFilter && r.grade !== gradeFilter) continue;
        insertStmt.run(`att-${tid}-${r.id}-${date}`, tid, r.id, r.roll_no, r.full_name, r.grade, category, date, actorRole);
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

  router.delete('/lesson-plans/:id', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const info = sqliteDb.prepare('DELETE FROM local_school_lesson_plans WHERE id = ? AND tenant_id = ?')
      .run(req.params.id, tid);
    if (!info.changes) return res.status(404).json({ ok: false, message: 'Lesson plan not found' });
    res.json({ ok: true, id: req.params.id });
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

  // =========================================================================
  // PETTY CASH VOUCHERS & OWNER REAL-TIME FINANCIAL MONITORING DASHBOARD
  // =========================================================================
  const mapPettyVoucherRow = (v) => ({
    id: v.id,
    tenantId: v.tenant_id,
    voucherNo: v.voucher_no,
    date: v.date,
    category: v.category || 'Stationery & Office',
    description: v.description,
    amount: Number(v.amount || 0),
    paidTo: v.paid_to || 'Campus Vendor',
    recordedBy: v.recorded_by || 'Accountant / Fee Clerk',
    collectorRole: v.collector_role || 'accountant',
    closingId: v.closing_id || ''
  });

  router.get('/petty-vouchers', (req, res) => {
    const tid = resolveTenantId(req);
    let vouchers = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_school_petty_vouchers WHERE tenant_id = ? ORDER BY date DESC, created_at DESC LIMIT 200').all(tid);
        vouchers = rows.map(mapPettyVoucherRow);
      } catch {}
    }
    res.json({ ok: true, tenantId: tid, vouchers });
  });

  router.post('/petty-vouchers', rejectRestrictedRole(['student', 'parent', 'teacher']), (req, res) => {
    const tid = resolveTenantId(req);
    const b = req.body || {};
    const description = String(b.description || '').trim();
    const amount = Number(b.amount || 0);
    if (!description || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, message: 'Voucher description and positive amount are required.' });
    }
    const reqRole = resolveUserRole(req) || 'accountant';
    const voucher = {
      id: b.id || ('PV-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      voucherNo: String(b.voucherNo || ('PCV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000))),
      date: String(b.date || new Date().toISOString().split('T')[0]),
      category: String(b.category || 'Stationery & Supplies'),
      description,
      amount,
      paidTo: String(b.paidTo || 'Cash Counter Vendor'),
      recordedBy: String(b.recordedBy || (reqRole === 'accountant' ? 'Muhammad Rizwan (Fee Clerk)' : 'Accounts Office')),
      collectorRole: reqRole,
      closingId: String(b.closingId || '')
    };

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_petty_vouchers
        (id, tenant_id, voucher_no, date, category, description, amount, paid_to, recorded_by, collector_role, closing_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        voucher.id, tid, voucher.voucherNo, voucher.date, voucher.category, voucher.description,
        voucher.amount, voucher.paidTo, voucher.recordedBy, voucher.collectorRole, voucher.closingId,
        new Date().toISOString()
      );
      recordAudit(tid, {
        operatorName: voucher.recordedBy,
        operatorRole: reqRole === 'accountant' ? 'Accountant / Fee Clerk' : 'Accounts Office',
        actionType: 'Petty Cash Voucher Logged',
        category: 'Financial',
        entityId: voucher.voucherNo,
        entityDescription: `${voucher.category}: ${voucher.description}`,
        details: `Disbursed PKR ${voucher.amount.toLocaleString()} to ${voucher.paidTo} (${voucher.date}).`,
        severity: 'Normal Audit',
        verifiedBy: 'Owner Daily Closing Oversight'
      });
    }
    res.status(201).json({ ok: true, voucher });
  });

  router.delete('/petty-vouchers/:id', rejectRestrictedRole(['student', 'parent', 'teacher']), (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_petty_vouchers WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Petty cash voucher not found.' });
    sqliteDb.prepare('DELETE FROM local_school_petty_vouchers WHERE id = ? AND tenant_id = ?').run(id, tid);
    res.json({ ok: true, id });
  });

  router.get('/finance/monitoring', rejectRestrictedRole(['student', 'parent']), (req, res) => {
    const tid = resolveTenantId(req);
    const daysParam = Math.min(90, Math.max(7, Number(req.query?.days || 14)));
    let fees = [];
    let students = [];
    let reconciliations = [];
    let pettyVouchers = [];
    let teachers = [];

    if (sqliteDb) {
      try {
        fees = sqliteDb.prepare('SELECT * FROM local_school_fees WHERE tenant_id = ? ORDER BY created_at DESC').all(tid).map((r) => mapFeeRow(r, tid));
        students = sqliteDb.prepare('SELECT * FROM local_school_students WHERE tenant_id = ?').all(tid).map((r) => mapStudentRow(r, tid));
        reconciliations = sqliteDb.prepare('SELECT * FROM local_school_reconciliation WHERE tenant_id = ? ORDER BY date DESC, created_at DESC LIMIT 100').all(tid).map(mapReconciliationRow);
        pettyVouchers = sqliteDb.prepare('SELECT * FROM local_school_petty_vouchers WHERE tenant_id = ? ORDER BY date DESC, created_at DESC LIMIT 200').all(tid).map(mapPettyVoucherRow);
        teachers = sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE tenant_id = ?').all(tid);
      } catch {}
    }

    if (fees.length === 0 && students.length === 0 && tid === ROOT_TENANT_ID) {
      fees = defaultFeesSeed;
      students = defaultStudentsSeed;
      reconciliations = SCHOOL_FEE_RECONCILIATION;
    }

    const paidFees = fees.filter((f) => String(f.status).toUpperCase() === 'PAID' || String(f.status).toUpperCase() === 'PARTIAL');
    let accountantCollected = 0;
    let accountantReceiptsCount = 0;
    let principalCollected = 0;
    let principalReceiptsCount = 0;
    let ownerOnlineCollected = 0;
    let ownerReceiptsCount = 0;

    let cashInflow = 0;
    let bankMeezanInflow = 0;
    let bankHblInflow = 0;
    let digitalInflow = 0;

    for (const f of paidFees) {
      const amt = Number(f.status === 'PARTIAL' ? (f.paidAmount || 0) : (f.paidAmount || f.total || 0));
      const role = String(f.collectorRole || '').toLowerCase();
      const by = String(f.collectedBy || '').toLowerCase();
      if (role === 'accountant' || by.includes('accountant') || by.includes('fee clerk')) {
        accountantCollected += amt;
        accountantReceiptsCount++;
      } else if (role === 'principal' || by.includes('principal')) {
        principalCollected += amt;
        principalReceiptsCount++;
      } else {
        ownerOnlineCollected += amt;
        ownerReceiptsCount++;
      }

      const mode = String(f.paymentMode || '').toLowerCase();
      if (mode.includes('meezan')) bankMeezanInflow += amt;
      else if (mode.includes('hbl')) bankHblInflow += amt;
      else if (mode.includes('jazz') || mode.includes('easy') || mode.includes('kuick') || mode.includes('raast') || mode.includes('online')) digitalInflow += amt;
      else cashInflow += amt;
    }

    const pettyVouchersTotal = pettyVouchers.reduce((s, v) => s + Number(v.amount || 0), 0);
    const closingPettyTotal = reconciliations.reduce((s, r) => s + Number(r.pettyExpenses || 0), 0);
    const pettyExpensesOutflow = Math.max(pettyVouchersTotal, closingPettyTotal);
    const staffPayrollOutflow = teachers.filter((t) => String(t.salary_status || '').toLowerCase() === 'paid').reduce((s, t) => s + Number(t.basic_salary || 0), 0);
    const grossRevenue = accountantCollected + principalCollected + ownerOnlineCollected;
    const latestClosing = reconciliations[0] || null;
    const openingVaultCash = Number(latestClosing?.openingVaultCash || 0);
    const netCashPosition = openingVaultCash + grossRevenue - pettyExpensesOutflow;

    const gradeDuesMap = new Map();
    let totalDueBakaya = 0;
    let defaulterStudentsCount = 0;
    for (const st of students) {
      const due = Number(st.dueBakaya || 0);
      if (due > 0 || String(st.feeStatus).toUpperCase() === 'PENDING' || String(st.feeStatus).toUpperCase() === 'OVERDUE' || String(st.feeStatus).toUpperCase() === 'PARTIAL') {
        const effectiveDue = due > 0 ? due : Number(st.feeAmount || 0);
        if (effectiveDue > 0) {
          defaulterStudentsCount++;
          totalDueBakaya += effectiveDue;
          const g = st.grade || 'Campus';
          const prev = gradeDuesMap.get(g) || { grade: g, dueAmount: 0, studentsCount: 0 };
          prev.dueAmount += effectiveDue;
          prev.studentsCount++;
          gradeDuesMap.set(g, prev);
        }
      }
    }

    const pendingChallansCount = fees.filter((f) => String(f.status).toUpperCase() === 'PENDING' || String(f.status).toUpperCase() === 'PARTIAL').length;
    const overdueChallansCount = fees.filter((f) => String(f.status).toUpperCase() === 'OVERDUE').length;
    const totalExpected = grossRevenue + totalDueBakaya;
    const recoveryRatePct = totalExpected > 0 ? Math.round((grossRevenue / totalExpected) * 100) : 100;

    // Daily revenue & cash flow series keyed by ISO YYYY-MM-DD
    const dayBucket = new Map();
    const ensureDay = (dateKey) => {
      if (!dayBucket.has(dateKey)) {
        dayBucket.set(dateKey, {
          date: dateKey,
          label: dateKey.slice(5),
          accountantRevenue: 0,
          principalRevenue: 0,
          onlineRevenue: 0,
          totalRevenue: 0,
          pettyOutflow: 0,
          netCashFlow: 0,
          receiptsCount: 0
        });
      }
      return dayBucket.get(dateKey);
    };

    for (const f of paidFees) {
      const dk = (f.paidDate && /^\d{4}-\d{2}-\d{2}/.test(f.paidDate)) ? f.paidDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const b = ensureDay(dk);
      const amt = Number(f.status === 'PARTIAL' ? (f.paidAmount || 0) : (f.paidAmount || f.total || 0));
      const role = String(f.collectorRole || '').toLowerCase();
      if (role === 'accountant') b.accountantRevenue += amt;
      else if (role === 'principal') b.principalRevenue += amt;
      else b.onlineRevenue += amt;
      b.totalRevenue += amt;
      b.receiptsCount++;
    }

    for (const r of reconciliations) {
      const dk = (r.date && /^\d{4}-\d{2}-\d{2}/.test(r.date)) ? r.date.slice(0, 10) : null;
      if (dk) {
        const b = ensureDay(dk);
        if (b.totalRevenue === 0) {
          b.accountantRevenue += Number(r.accountantCollected || r.actualCollected || 0);
          b.principalRevenue += Number(r.principalCollected || 0);
          b.onlineRevenue += Number(r.onlineCollected || 0);
          b.totalRevenue += Number(r.actualCollected || 0) + Number(r.principalCollected || 0) + Number(r.onlineCollected || 0);
        }
        b.pettyOutflow = Math.max(b.pettyOutflow, Number(r.pettyExpenses || 0));
      }
    }

    for (const pv of pettyVouchers) {
      const dk = (pv.date && /^\d{4}-\d{2}-\d{2}/.test(pv.date)) ? pv.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const b = ensureDay(dk);
      b.pettyOutflow += Number(pv.amount || 0);
    }

    const dailyRevenueSeries = Array.from(dayBucket.values())
      .map((d) => ({ ...d, netCashFlow: d.totalRevenue - d.pettyOutflow }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-daysParam);

    res.json({
      ok: true,
      tenantId: tid,
      summary: {
        cashFlow: {
          openingVaultCash,
          cashInflow,
          bankMeezanInflow,
          bankHblInflow,
          digitalInflow,
          grossRevenue,
          pettyExpensesOutflow,
          staffPayrollOutflow,
          netCashPosition
        },
        collectorBreakdown: {
          accountantCollected,
          accountantReceiptsCount,
          principalCollected,
          principalReceiptsCount,
          ownerOnlineCollected,
          ownerReceiptsCount
        },
        channelMix: {
          cash: cashInflow,
          meezan: bankMeezanInflow,
          hbl: bankHblInflow,
          digital: digitalInflow
        },
        pendingDues: {
          totalDueBakaya,
          defaulterStudentsCount,
          pendingChallansCount,
          overdueChallansCount,
          recoveryRatePct,
          byGrade: Array.from(gradeDuesMap.values()).sort((a, b) => b.dueAmount - a.dueAmount)
        },
        dailyRevenueSeries,
        closingsSummary: {
          totalClosings: reconciliations.length,
          pendingOwnerReviewCount: reconciliations.filter((r) => r.ownerApprovalStatus === 'Pending Owner Review').length,
          flaggedCount: reconciliations.filter((r) => r.ownerApprovalStatus === 'Flagged by Owner').length,
          approvedCount: reconciliations.filter((r) => !['Pending Owner Review', 'Flagged by Owner'].includes(r.ownerApprovalStatus || '')).length,
          latestClosing
        },
        pettyVouchers
      }
    });
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

  // =========================================================================
  // DYNAMIC TABLE SCHEMAS, CUSTOM FORM FIELDS & CROSS-PORTAL DATA CRUD
  // =========================================================================
  const TABLE_FAMILY_MAP = {
    // Students master
    owner_students_roster: 'students_master',
    owner_overview_students: 'students_master',
    owner_stage_wise: 'students_master',
    principal_master_students: 'students_master',
    principal_stage_wise: 'students_master',
    // Teachers master
    owner_teachers_faculty: 'teachers_master',
    owner_overview_teachers: 'teachers_master',
    principal_master_teachers: 'teachers_master',
    // Parents directory
    owner_overview_parents: 'parents_master',
    principal_master_parents: 'parents_master',
    // Fee receipts & cashiering
    owner_overview_fee_cashiering: 'fee_receipts_cashiering',
    owner_overview_recent_payments: 'fee_receipts_cashiering',
    owner_payment_gateway: 'fee_receipts_cashiering',
    principal_master_cashiering: 'fee_receipts_cashiering',
    accountant_recent_receipts: 'fee_receipts_cashiering',
    accountant_posted_receipts: 'fee_receipts_cashiering',
    // Fee defaulters
    owner_fee_defaulters: 'fee_defaulters',
    owner_overview_defaulters: 'fee_defaulters',
    accountant_defaulters: 'fee_defaulters',
    // Challans & invoices
    owner_invoices: 'fee_challans_invoices',
    accountant_challans: 'fee_challans_invoices',
    // Petty cash vouchers
    owner_petty_vouchers: 'petty_vouchers',
    accountant_petty_vouchers: 'petty_vouchers',
    // Daily closing & reconciliation
    owner_daily_closing: 'daily_closing_reconciliation',
    owner_audit_reconciliation: 'daily_closing_reconciliation',
    accountant_closings: 'daily_closing_reconciliation',
    // Campus notices & feed
    owner_feed_table: 'campus_notices_feed',
    teacher_feed_table: 'campus_notices_feed',
    student_feed_table: 'campus_notices_feed',
    parent_feed_table: 'campus_notices_feed',
    // Events calendar
    owner_events: 'events_calendar',
    teacher_events: 'events_calendar',
    // SLC
    owner_audit_slc: 'slc_certificates',
    principal_slc: 'slc_certificates',
    // Library circulation
    owner_library_circulation: 'library_circulation',
    principal_library_circulation: 'library_circulation',
    student_library_loans: 'library_circulation',
    parent_library_loans: 'library_circulation',
    // Academics & gradebook
    owner_marks_entry: 'academics_gradebook_results',
    owner_class_results: 'academics_gradebook_results',
    teacher_gradebook: 'academics_gradebook_results',
    student_academics: 'academics_gradebook_results',
    parent_academics: 'academics_gradebook_results',
    // Attendance & gate logs
    student_attendance_log: 'attendance_gate_logs',
    parent_gate_logs: 'attendance_gate_logs'
  };

  const resolveCanonicalTableId = (tableId) => {
    const clean = String(tableId || '').trim();
    return TABLE_FAMILY_MAP[clean] || clean;
  };

  const safeJsonParse = (raw, fallback) => {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const loadTenantTableSchemas = (tid) => {
    const result = {};
    if (!sqliteDb) return result;
    try {
      const schemaRows = sqliteDb
        .prepare('SELECT * FROM local_school_table_schemas WHERE tenant_id = ?')
        .all(tid);
      for (const r of schemaRows) {
        const canonical = resolveCanonicalTableId(r.table_id);
        result[canonical] = {
          tableId: canonical,
          customTitle: r.custom_title || '',
          hiddenColumns: safeJsonParse(r.hidden_columns_json, []),
          hiddenColumnLabels: safeJsonParse(r.hidden_column_labels_json, []),
          hiddenFormFields: safeJsonParse(r.hidden_form_fields_json, []),
          renamedHeaders: safeJsonParse(r.renamed_headers_json, {}),
          renamedHeadersByLabel: safeJsonParse(r.renamed_headers_by_label_json, {}),
          customColumns: safeJsonParse(r.custom_columns_json, []),
          customRows: [],
          customCells: {},
          cellMeta: {}
        };
      }

      const customRowRecords = sqliteDb
        .prepare('SELECT * FROM local_school_table_rows WHERE tenant_id = ? ORDER BY created_at DESC')
        .all(tid);
      for (const rr of customRowRecords) {
        const canonical = resolveCanonicalTableId(rr.table_id);
        if (!result[canonical]) {
          result[canonical] = {
            tableId: canonical,
            customTitle: '',
            hiddenColumns: [],
            hiddenColumnLabels: [],
            hiddenFormFields: [],
            renamedHeaders: {},
            renamedHeadersByLabel: {},
            customColumns: [],
            customRows: [],
            customCells: {},
            cellMeta: {}
          };
        }
        const rawValues = safeJsonParse(rr.values_json, {});
        const insertAfterRowKey = typeof rawValues?.__insertAfterRowKey === 'string' ? rawValues.__insertAfterRowKey.trim() : '';
        const values = { ...(rawValues && typeof rawValues === 'object' ? rawValues : {}) };
        delete values.__insertAfterRowKey;
        result[canonical].customRows.push({
          rowKey: rr.row_key,
          rowLabel: rr.row_label || '',
          ...(insertAfterRowKey ? { insertAfterRowKey } : {}),
          values,
          submittedByName: rr.submitted_by_name || '',
          submittedByRole: rr.submitted_by_role || 'owner',
          createdAt: rr.created_at || new Date().toISOString()
        });
      }

      const cellRows = sqliteDb
        .prepare('SELECT * FROM local_school_table_cells WHERE tenant_id = ?')
        .all(tid);
      for (const cr of cellRows) {
        const canonical = resolveCanonicalTableId(cr.table_id);
        if (!result[canonical]) {
          result[canonical] = {
            tableId: canonical,
            customTitle: '',
            hiddenColumns: [],
            hiddenColumnLabels: [],
            hiddenFormFields: [],
            renamedHeaders: {},
            renamedHeadersByLabel: {},
            customColumns: [],
            customRows: [],
            customCells: {},
            cellMeta: {}
          };
        }
        if (!result[canonical].customCells[cr.row_key]) {
          result[canonical].customCells[cr.row_key] = {};
        }
        result[canonical].customCells[cr.row_key][cr.col_id] = cr.cell_value ?? '';
        if (!result[canonical].cellMeta[cr.row_key]) {
          result[canonical].cellMeta[cr.row_key] = {};
        }
        result[canonical].cellMeta[cr.row_key][cr.col_id] = {
          submittedByName: cr.submitted_by_name || '',
          submittedByRole: cr.submitted_by_role || 'owner',
          updatedAt: cr.updated_at || ''
        };
      }
    } catch {}
    return result;
  };

  const syncTableSchemasToFirestore = async (tid, schemasMap) => {
    if (!db) return;
    const ref = doc(db, 'school_workspaces', tid);
    const now = new Date().toISOString();
    try {
      await updateDoc(ref, {
        tableSchemas: schemasMap,
        tenant_id: tid,
        updatedAt: now
      });
    } catch {
      try {
        await setDoc(ref, {
          tableSchemas: schemasMap,
          tenant_id: tid,
          updatedAt: now
        }, { merge: true });
      } catch {}
    }
  };

  const ensureSchemaRowExists = (tid, canonicalTableId, actorName = 'School Owner') => {
    if (!sqliteDb) return;
    const existing = sqliteDb
      .prepare('SELECT table_id FROM local_school_table_schemas WHERE tenant_id = ? AND table_id = ?')
      .get(tid, canonicalTableId);
    if (!existing) {
      sqliteDb.prepare(`
        INSERT INTO local_school_table_schemas
        (tenant_id, table_id, custom_title, hidden_columns_json, hidden_column_labels_json, hidden_form_fields_json, renamed_headers_json, renamed_headers_by_label_json, custom_columns_json, updated_by, updated_at)
        VALUES (?, ?, '', '[]', '[]', '[]', '{}', '{}', '[]', ?, ?)
      `).run(tid, canonicalTableId, actorName, new Date().toISOString());
    }
  };

  const hydrateTenantTableSchemasFromCloud = async (tid) => {
    if (!db) return {};
    try {
      const snap = await getDoc(doc(db, 'school_workspaces', tid));
      if (!snap.exists()) return {};
      const data = snap.data() || {};
      const cloudSchemas = data.tableSchemas;
      if (!cloudSchemas || typeof cloudSchemas !== 'object') return {};

      if (sqliteDb) {
        const now = new Date().toISOString();
        for (const [rawKey, rawSchema] of Object.entries(cloudSchemas)) {
          if (!rawSchema || typeof rawSchema !== 'object') continue;
          const canonical = resolveCanonicalTableId(rawSchema.tableId || rawKey);
          sqliteDb.prepare(`
            INSERT OR REPLACE INTO local_school_table_schemas
            (tenant_id, table_id, custom_title, hidden_columns_json, hidden_column_labels_json, hidden_form_fields_json, renamed_headers_json, renamed_headers_by_label_json, custom_columns_json, updated_by, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            tid,
            canonical,
            String(rawSchema.customTitle || ''),
            JSON.stringify(Array.isArray(rawSchema.hiddenColumns) ? rawSchema.hiddenColumns : []),
            JSON.stringify(Array.isArray(rawSchema.hiddenColumnLabels) ? rawSchema.hiddenColumnLabels : []),
            JSON.stringify(Array.isArray(rawSchema.hiddenFormFields) ? rawSchema.hiddenFormFields : []),
            JSON.stringify(rawSchema.renamedHeaders && typeof rawSchema.renamedHeaders === 'object' ? rawSchema.renamedHeaders : {}),
            JSON.stringify(rawSchema.renamedHeadersByLabel && typeof rawSchema.renamedHeadersByLabel === 'object' ? rawSchema.renamedHeadersByLabel : {}),
            JSON.stringify(Array.isArray(rawSchema.customColumns) ? rawSchema.customColumns : []),
            'Firestore Sync',
            now
          );

          if (Array.isArray(rawSchema.customRows)) {
            for (const cr of rawSchema.customRows) {
              if (!cr || !cr.rowKey) continue;
              const vals = { ...(cr.values && typeof cr.values === 'object' ? cr.values : {}) };
              if (cr.insertAfterRowKey) vals.__insertAfterRowKey = cr.insertAfterRowKey;
              sqliteDb.prepare(`
                INSERT OR REPLACE INTO local_school_table_rows
                (tenant_id, table_id, row_key, row_label, values_json, submitted_by_name, submitted_by_role, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                tid,
                canonical,
                String(cr.rowKey),
                String(cr.rowLabel || ''),
                JSON.stringify(vals),
                String(cr.submittedByName || ''),
                String(cr.submittedByRole || 'owner'),
                String(cr.createdAt || now),
                now
              );
            }
          }

          if (rawSchema.customCells && typeof rawSchema.customCells === 'object') {
            for (const [rKey, colsMap] of Object.entries(rawSchema.customCells)) {
              if (!colsMap || typeof colsMap !== 'object') continue;
              for (const [cId, val] of Object.entries(colsMap)) {
                const meta = rawSchema.cellMeta?.[rKey]?.[cId] || {};
                sqliteDb.prepare(`
                  INSERT OR REPLACE INTO local_school_table_cells
                  (tenant_id, table_id, row_key, col_id, cell_value, submitted_by_name, submitted_by_role, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  tid,
                  canonical,
                  String(rKey),
                  String(cId),
                  String(val ?? ''),
                  String(meta.submittedByName || ''),
                  String(meta.submittedByRole || 'owner'),
                  String(meta.updatedAt || now)
                );
              }
            }
          }
        }
        return loadTenantTableSchemas(tid);
      }
      return cloudSchemas;
    } catch {
      return {};
    }
  };

  // GET all table schemas + custom rows + custom cells (all roles read-only mirror)
  router.get('/table-schemas', async (req, res) => {
    const tid = resolveTenantId(req);
    let schemas = loadTenantTableSchemas(tid);
    if (Object.keys(schemas).length === 0) {
      const hydrated = await hydrateTenantTableSchemasFromCloud(tid);
      if (Object.keys(hydrated).length > 0) {
        schemas = hydrated;
      }
    }
    res.json({ ok: true, tenantId: tid, schemas });
  });

  // PUT full schema update for a table (School Owner ONLY)
  router.put('/table-schemas/:tableId', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const canonical = resolveCanonicalTableId(req.params.tableId);
    const body = req.body || {};
    const actorName = String(req.headers['x-user-name'] || body.updatedBy || 'School Business Owner');
    const now = new Date().toISOString();

    const customTitle = String(body.customTitle || '').trim();
    const hiddenColumns = Array.isArray(body.hiddenColumns)
      ? body.hiddenColumns.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0)
      : [];
    const hiddenColumnLabels = Array.isArray(body.hiddenColumnLabels)
      ? body.hiddenColumnLabels.map((s) => String(s)).filter(Boolean)
      : [];
    const hiddenFormFields = Array.isArray(body.hiddenFormFields)
      ? body.hiddenFormFields.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const renamedHeaders = body.renamedHeaders && typeof body.renamedHeaders === 'object' ? body.renamedHeaders : {};
    const renamedHeadersByLabel = body.renamedHeadersByLabel && typeof body.renamedHeadersByLabel === 'object' ? body.renamedHeadersByLabel : {};
    const customColumns = Array.isArray(body.customColumns)
      ? body.customColumns
          .filter((c) => c && c.id && c.label)
          .map((c) => ({
            id: String(c.id),
            label: String(c.label).trim(),
            type: ['text', 'number', 'date', 'badge', 'select'].includes(c.type) ? c.type : 'text',
            defaultValue: String(c.defaultValue ?? ''),
            options: Array.isArray(c.options) ? c.options.map((o) => String(o)).filter(Boolean) : undefined,
            required: Boolean(c.required),
            ...(c.insertAfterColumn ? { insertAfterColumn: String(c.insertAfterColumn).trim() } : {}),
            ...(c.insertAfterFormField ? { insertAfterFormField: String(c.insertAfterFormField).trim() } : {}),
            ...(c.scope && ['table', 'form', 'both'].includes(c.scope) ? { scope: c.scope } : {})
          }))
      : [];

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_table_schemas
        (tenant_id, table_id, custom_title, hidden_columns_json, hidden_column_labels_json, hidden_form_fields_json, renamed_headers_json, renamed_headers_by_label_json, custom_columns_json, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tid,
        canonical,
        customTitle,
        JSON.stringify(hiddenColumns),
        JSON.stringify(hiddenColumnLabels),
        JSON.stringify(hiddenFormFields),
        JSON.stringify(renamedHeaders),
        JSON.stringify(renamedHeadersByLabel),
        JSON.stringify(customColumns),
        actorName,
        now
      );

      // Remove any orphan cell entries for columns that are no longer in customColumns
      const validColIds = new Set(customColumns.map((c) => c.id));
      const existingCells = sqliteDb
        .prepare('SELECT row_key, col_id FROM local_school_table_cells WHERE tenant_id = ? AND table_id = ?')
        .all(tid, canonical);
      const delCellStmt = sqliteDb.prepare(
        'DELETE FROM local_school_table_cells WHERE tenant_id = ? AND table_id = ? AND row_key = ? AND col_id = ?'
      );
      for (const ec of existingCells) {
        if (!validColIds.has(ec.col_id)) {
          delCellStmt.run(tid, canonical, ec.row_key, ec.col_id);
        }
      }

      // Sync customCells if passed in payload
      if (body.customCells && typeof body.customCells === 'object') {
        const upsertCell = sqliteDb.prepare(`
          INSERT OR REPLACE INTO local_school_table_cells
          (tenant_id, table_id, row_key, col_id, cell_value, submitted_by_name, submitted_by_role, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const [rk, rowMap] of Object.entries(body.customCells)) {
          if (!rowMap || typeof rowMap !== 'object') continue;
          for (const [cid, val] of Object.entries(rowMap)) {
            if (validColIds.has(cid)) {
              upsertCell.run(tid, canonical, rk, cid, String(val ?? ''), actorName, 'owner', now);
            }
          }
        }
      }

      // Sync customRows if passed in payload
      if (Array.isArray(body.customRows)) {
        const existingRows = sqliteDb
          .prepare('SELECT row_key FROM local_school_table_rows WHERE tenant_id = ? AND table_id = ?')
          .all(tid, canonical);
        const keepRowKeys = new Set(body.customRows.map((r) => String(r?.rowKey || '')).filter(Boolean));
        const delRow = sqliteDb.prepare('DELETE FROM local_school_table_rows WHERE tenant_id = ? AND table_id = ? AND row_key = ?');
        for (const er of existingRows) {
          if (!keepRowKeys.has(er.row_key)) delRow.run(tid, canonical, er.row_key);
        }
        const upsertRow = sqliteDb.prepare(`
          INSERT OR REPLACE INTO local_school_table_rows
          (tenant_id, table_id, row_key, row_label, values_json, submitted_by_name, submitted_by_role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of body.customRows) {
          if (!r?.rowKey) continue;
          const storedValues = { ...(r.values && typeof r.values === 'object' ? r.values : {}) };
          if (r.insertAfterRowKey) {
            storedValues.__insertAfterRowKey = String(r.insertAfterRowKey).trim();
          }
          upsertRow.run(
            tid,
            canonical,
            String(r.rowKey),
            String(r.rowLabel || ''),
            JSON.stringify(storedValues),
            String(r.submittedByName || actorName),
            String(r.submittedByRole || 'owner'),
            String(r.createdAt || now),
            now
          );
        }
      }
    }

    const allSchemas = loadTenantTableSchemas(tid);
    await syncTableSchemasToFirestore(tid, allSchemas);
    res.json({ ok: true, tenantId: tid, tableId: canonical, schema: allSchemas[canonical] || null, schemas: allSchemas });
  });

  // DELETE a single custom column + purge all its cell/row values in SQLite + Firestore (School Owner ONLY)
  router.delete('/table-schemas/:tableId/columns/:colId', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const canonical = resolveCanonicalTableId(req.params.tableId);
    const colId = String(req.params.colId || '').trim();
    const now = new Date().toISOString();

    if (sqliteDb && colId) {
      const schemaRow = sqliteDb
        .prepare('SELECT * FROM local_school_table_schemas WHERE tenant_id = ? AND table_id = ?')
        .get(tid, canonical);
      if (schemaRow) {
        const cols = safeJsonParse(schemaRow.custom_columns_json, []).filter((c) => c.id !== colId);
        sqliteDb.prepare(`
          UPDATE local_school_table_schemas
          SET custom_columns_json = ?, updated_at = ?
          WHERE tenant_id = ? AND table_id = ?
        `).run(JSON.stringify(cols), now, tid, canonical);
      }

      sqliteDb.prepare(
        'DELETE FROM local_school_table_cells WHERE tenant_id = ? AND table_id = ? AND col_id = ?'
      ).run(tid, canonical, colId);

      // Strip deleted column key from any stored custom rows
      const rowRecords = sqliteDb
        .prepare('SELECT row_key, values_json FROM local_school_table_rows WHERE tenant_id = ? AND table_id = ?')
        .all(tid, canonical);
      const updRow = sqliteDb.prepare(
        'UPDATE local_school_table_rows SET values_json = ?, updated_at = ? WHERE tenant_id = ? AND table_id = ? AND row_key = ?'
      );
      for (const rr of rowRecords) {
        const vals = safeJsonParse(rr.values_json, {});
        if (colId in vals) {
          delete vals[colId];
          updRow.run(JSON.stringify(vals), now, tid, canonical, rr.row_key);
        }
      }
    }

    const allSchemas = loadTenantTableSchemas(tid);
    await syncTableSchemasToFirestore(tid, allSchemas);
    res.json({ ok: true, tenantId: tid, tableId: canonical, deletedColId: colId, schema: allSchemas[canonical] || null, schemas: allSchemas });
  });

  // DELETE entire table schema customization + custom rows/cells (School Owner ONLY)
  router.delete('/table-schemas/:tableId', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const canonical = resolveCanonicalTableId(req.params.tableId);

    if (sqliteDb) {
      sqliteDb.prepare('DELETE FROM local_school_table_schemas WHERE tenant_id = ? AND table_id = ?').run(tid, canonical);
      sqliteDb.prepare('DELETE FROM local_school_table_rows WHERE tenant_id = ? AND table_id = ?').run(tid, canonical);
      sqliteDb.prepare('DELETE FROM local_school_table_cells WHERE tenant_id = ? AND table_id = ?').run(tid, canonical);
    }

    const allSchemas = loadTenantTableSchemas(tid);
    await syncTableSchemasToFirestore(tid, allSchemas);
    res.json({ ok: true, tenantId: tid, resetTableId: canonical, schemas: allSchemas });
  });

  // POST submit custom row OR form custom field values (All Authorized Portal Roles can submit their work input!)
  router.post('/table-schemas/:tableId/rows', async (req, res) => {
    const tid = resolveTenantId(req);
    const canonical = resolveCanonicalTableId(req.params.tableId);
    const body = req.body || {};
    const callerRole = resolveUserRole(req) || String(body.submittedByRole || 'owner').toLowerCase();
    const callerName = String(req.headers['x-user-name'] || body.submittedByName || callerRole || 'Portal User').trim();
    const now = new Date().toISOString();

    const cellsList = Array.isArray(body.cells) ? body.cells : [];
    const hasExplicitRows = Array.isArray(body.rows);
    const hasSingleRowPayload = Boolean(body.rowKey) || (body.values && typeof body.values === 'object' && Object.keys(body.values).length > 0);
    const rowsToSave = hasExplicitRows
      ? body.rows
      : hasSingleRowPayload
        ? [{
            rowKey: body.rowKey || (`row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            rowLabel: body.rowLabel || '',
            insertAfterRowKey: body.insertAfterRowKey || '',
            values: body.values || {},
            isStandaloneRow: body.isStandaloneRow !== false && !body.cellsOnly
          }]
        : [];

    if (sqliteDb) {
      ensureSchemaRowExists(tid, canonical, callerName);
      const upsertRow = sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_table_rows
        (tenant_id, table_id, row_key, row_label, values_json, submitted_by_name, submitted_by_role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const upsertCell = sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_table_cells
        (tenant_id, table_id, row_key, col_id, cell_value, submitted_by_name, submitted_by_role, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const r of rowsToSave) {
        const rk = String(r.rowKey || (`row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`)).trim();
        const vals = r.values && typeof r.values === 'object' ? r.values : {};
        if (r.isStandaloneRow !== false && !body.cellsOnly) {
          const storedVals = { ...vals };
          const rowPos = String(r.insertAfterRowKey || body.insertAfterRowKey || '').trim();
          if (rowPos) storedVals.__insertAfterRowKey = rowPos;
          upsertRow.run(tid, canonical, rk, String(r.rowLabel || ''), JSON.stringify(storedVals), callerName, callerRole, now, now);
        }
        for (const [key, val] of Object.entries(vals)) {
          if (String(key).startsWith('col_') && val !== undefined && val !== null) {
            upsertCell.run(tid, canonical, rk, key, String(val), callerName, callerRole, now);
          }
        }
      }

      for (const c of cellsList) {
        if (!c || typeof c !== 'object') continue;
        const rk = String(c.rowKey || '').trim();
        const colId = String(c.colId || '').trim();
        if (rk && colId.startsWith('col_') && c.value !== undefined && c.value !== null) {
          upsertCell.run(tid, canonical, rk, colId, String(c.value), callerName, callerRole, now);
        }
      }
    }

    const allSchemas = loadTenantTableSchemas(tid);
    await syncTableSchemasToFirestore(tid, allSchemas);
    res.status(201).json({ ok: true, tenantId: tid, tableId: canonical, schema: allSchemas[canonical] || null, schemas: allSchemas });
  });

  // PUT update a custom row or its custom cell values (School Owner ONLY)
  router.put('/table-schemas/:tableId/rows/:rowKey', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const canonical = resolveCanonicalTableId(req.params.tableId);
    const rowKey = String(req.params.rowKey || '').trim();
    const body = req.body || {};
    const callerName = String(req.headers['x-user-name'] || body.updatedBy || 'School Business Owner');
    const now = new Date().toISOString();

    if (sqliteDb && rowKey) {
      ensureSchemaRowExists(tid, canonical, callerName);
      const existing = sqliteDb
        .prepare('SELECT * FROM local_school_table_rows WHERE tenant_id = ? AND table_id = ? AND row_key = ?')
        .get(tid, canonical, rowKey);
      const existingRawValues = safeJsonParse(existing?.values_json, {});
      const nextValues = body.values && typeof body.values === 'object' ? body.values : existingRawValues;
      if (existing || body.upsertRow) {
        const storedValues = { ...nextValues };
        const pos = body.insertAfterRowKey !== undefined
          ? String(body.insertAfterRowKey || '').trim()
          : String(existingRawValues?.__insertAfterRowKey || '').trim();
        if (pos) storedValues.__insertAfterRowKey = pos;
        sqliteDb.prepare(`
          INSERT OR REPLACE INTO local_school_table_rows
          (tenant_id, table_id, row_key, row_label, values_json, submitted_by_name, submitted_by_role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          tid,
          canonical,
          rowKey,
          String(body.rowLabel ?? existing?.row_label ?? ''),
          JSON.stringify(storedValues),
          String(existing?.submitted_by_name || callerName),
          String(existing?.submitted_by_role || 'owner'),
          String(existing?.created_at || now),
          now
        );
      }
      const upsertCell = sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_table_cells
        (tenant_id, table_id, row_key, col_id, cell_value, submitted_by_name, submitted_by_role, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const [cid, val] of Object.entries(nextValues)) {
        if (String(cid).startsWith('col_')) {
          upsertCell.run(tid, canonical, rowKey, cid, String(val ?? ''), callerName, 'owner', now);
        }
      }
    }

    const allSchemas = loadTenantTableSchemas(tid);
    await syncTableSchemasToFirestore(tid, allSchemas);
    res.json({ ok: true, tenantId: tid, tableId: canonical, rowKey, schema: allSchemas[canonical] || null, schemas: allSchemas });
  });

  // DELETE a custom row and/or all custom cells for that rowKey (School Owner ONLY)
  router.delete('/table-schemas/:tableId/rows/:rowKey', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const canonical = resolveCanonicalTableId(req.params.tableId);
    const rowKey = String(req.params.rowKey || '').trim();

    if (sqliteDb && rowKey) {
      sqliteDb.prepare('DELETE FROM local_school_table_rows WHERE tenant_id = ? AND table_id = ? AND row_key = ?').run(tid, canonical, rowKey);
      sqliteDb.prepare('DELETE FROM local_school_table_cells WHERE tenant_id = ? AND table_id = ? AND row_key = ?').run(tid, canonical, rowKey);
    }

    const allSchemas = loadTenantTableSchemas(tid);
    await syncTableSchemasToFirestore(tid, allSchemas);
    res.json({ ok: true, tenantId: tid, tableId: canonical, deletedRowKey: rowKey, schema: allSchemas[canonical] || null, schemas: allSchemas });
  });

  // DELETE a single custom cell value (School Owner ONLY)
  router.delete('/table-schemas/:tableId/cells/:rowKey/:colId', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const canonical = resolveCanonicalTableId(req.params.tableId);
    const rowKey = String(req.params.rowKey || '').trim();
    const colId = String(req.params.colId || '').trim();
    const now = new Date().toISOString();

    if (sqliteDb && rowKey && colId) {
      sqliteDb.prepare(
        'DELETE FROM local_school_table_cells WHERE tenant_id = ? AND table_id = ? AND row_key = ? AND col_id = ?'
      ).run(tid, canonical, rowKey, colId);

      const rr = sqliteDb
        .prepare('SELECT values_json FROM local_school_table_rows WHERE tenant_id = ? AND table_id = ? AND row_key = ?')
        .get(tid, canonical, rowKey);
      if (rr) {
        const vals = safeJsonParse(rr.values_json, {});
        if (colId in vals) {
          delete vals[colId];
          sqliteDb.prepare(
            'UPDATE local_school_table_rows SET values_json = ?, updated_at = ? WHERE tenant_id = ? AND table_id = ? AND row_key = ?'
          ).run(JSON.stringify(vals), now, tid, canonical, rowKey);
        }
      }
    }

    const allSchemas = loadTenantTableSchemas(tid);
    await syncTableSchemasToFirestore(tid, allSchemas);
    res.json({ ok: true, tenantId: tid, tableId: canonical, rowKey, deletedColId: colId, schema: allSchemas[canonical] || null, schemas: allSchemas });
  });

  // Per-tenant Workspace State Snapshot (settings, notices, classes, timetable, calendar, etc.)
  router.get('/workspace', async (req, res) => {
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
    let tableSchemas = loadTenantTableSchemas(tid);
    if ((!workspace || Object.keys(tableSchemas).length === 0) && db) {
      try {
        const snap = await getDoc(doc(db, 'school_workspaces', tid));
        if (snap.exists()) {
          const cloudData = snap.data() || {};
          if (!workspace && Object.keys(cloudData).length > 0) {
            const { tableSchemas: _ts, tenant_id: _tid, ...restCloud } = cloudData;
            workspace = { tenantId: tid, ...restCloud };
            if (sqliteDb) {
              try {
                sqliteDb.prepare(`
                  INSERT OR REPLACE INTO local_school_workspaces (tenant_id, school_name, payload_json, updated_at)
                  VALUES (?, ?, ?, ?)
                `).run(tid, String(workspace.schoolName || ''), JSON.stringify(restCloud), String(workspace.updatedAt || new Date().toISOString()));
              } catch {}
            }
          }
          if (Object.keys(tableSchemas).length === 0 && cloudData.tableSchemas) {
            const hydrated = await hydrateTenantTableSchemasFromCloud(tid);
            if (Object.keys(hydrated).length > 0) {
              tableSchemas = hydrated;
            }
          }
        }
      } catch {}
    }
    if (workspace) {
      workspace.tableSchemas = tableSchemas;
    } else if (Object.keys(tableSchemas).length > 0) {
      workspace = { tenantId: tid, tableSchemas };
    }
    res.json({ ok: true, tenantId: tid, workspace });
  });

  router.put('/workspace', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const body = req.body || {};
    const isOwner = OWNER_ROLES.has(resolveUserRole(req));
    const { tableSchemas: incomingSchemas, ...restBody } = body;
    const workspacePayload = isOwner && incomingSchemas !== undefined
      ? { ...restBody, tableSchemas: incomingSchemas }
      : restBody;
    const schoolName = String(workspacePayload.schoolName || '');
    const serialized = JSON.stringify(workspacePayload);
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_workspaces (tenant_id, school_name, payload_json, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(tid, schoolName, serialized, new Date().toISOString());
    }
    if (db) {
      try {
        const ref = doc(db, 'school_workspaces', tid);
        const now = new Date().toISOString();
        if (isOwner && incomingSchemas && typeof incomingSchemas === 'object') {
          try {
            await updateDoc(ref, {
              ...workspacePayload,
              tableSchemas: incomingSchemas,
              tenant_id: tid,
              updatedAt: now
            });
          } catch {
            await setDoc(ref, {
              ...workspacePayload,
              tenant_id: tid,
              updatedAt: now
            }, { merge: true });
          }
        } else {
          await setDoc(ref, {
            ...workspacePayload,
            tenant_id: tid,
            updatedAt: now
          }, { merge: true });
        }
      } catch {}
    }
    res.json({ ok: true, tenantId: tid });
  });

  return router;
}
