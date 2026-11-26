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
    allowFingerprintAttendance: true,
    confidenceThreshold: 76,
    liteConfidenceThreshold: 66,
    fingerprintConfidenceThreshold: 78,
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
const DEFAULT_BRANCH_ID = 'BR-LHR-01';
const DEFAULT_WING_ID = 'WNG-LHR-SR';

export const SCHOOL_BRANCHES = [
  {
    id: 'BR-LHR-01',
    code: 'LHR-01',
    name: 'Lahore Main Campus',
    city: 'Lahore',
    address: 'Gulberg III Main Boulevard, Lahore',
    phone: '+92 42 35761201',
    principalName: 'Prof. Dr. Tahir Mahmood Malik',
    accountantName: 'Muhammad Rizwan',
    establishedYear: '2016',
    status: 'ACTIVE'
  },
  {
    id: 'BR-ISB-02',
    code: 'ISB-02',
    name: 'Islamabad F-10 Campus',
    city: 'Islamabad',
    address: 'Sector F-10/3 Markaz Road, Islamabad',
    phone: '+92 51 9283741',
    principalName: 'Ms. Ayesha Siddiqa',
    accountantName: 'Usman Tariq',
    establishedYear: '2019',
    status: 'ACTIVE'
  },
  {
    id: 'BR-KHI-03',
    code: 'KHI-03',
    name: 'Karachi Clifton Campus',
    city: 'Karachi',
    address: 'Block 4 Clifton Marine Drive, Karachi',
    phone: '+92 21 35834410',
    principalName: 'Prof. Tariq Javed',
    accountantName: 'Salman Raza',
    establishedYear: '2022',
    status: 'ACTIVE'
  }
];

export const SCHOOL_WINGS = [
  { id: 'WNG-LHR-MON', branchId: 'BR-LHR-01', code: 'LHR-MON', name: 'Montessori & Early Years Wing', type: 'Montessori', gradeRange: 'Playgroup - Prep', headName: 'Ms. Hina Naeem', status: 'ACTIVE' },
  { id: 'WNG-LHR-JNR', branchId: 'BR-LHR-01', code: 'LHR-JNR', name: 'Junior Primary Wing', type: 'Junior', gradeRange: 'Class 1 - Class 5', headName: 'Ms. Amna Tariq', status: 'ACTIVE' },
  { id: 'WNG-LHR-MID', branchId: 'BR-LHR-01', code: 'LHR-MID', name: 'Middle School Wing', type: 'Middle', gradeRange: 'Class 6 - Class 8', headName: 'Sir Farhan Iqbal', status: 'ACTIVE' },
  { id: 'WNG-LHR-SNR', branchId: 'BR-LHR-01', code: 'LHR-SNR', name: 'Senior & O-Level Wing', type: 'Senior', gradeRange: 'Class 9 - Class 10 / O-Level', headName: 'Prof. Tariq Mehmood', status: 'ACTIVE' },
  { id: 'WNG-ISB-MON', branchId: 'BR-ISB-02', code: 'ISB-MON', name: 'F-10 Montessori Wing', type: 'Montessori', gradeRange: 'Playgroup - KG', headName: 'Ms. Sana Khalid', status: 'ACTIVE' },
  { id: 'WNG-ISB-JNR', branchId: 'BR-ISB-02', code: 'ISB-JNR', name: 'F-10 Junior Wing', type: 'Junior', gradeRange: 'Class 1 - Class 5', headName: 'Ms. Zunaira Raza', status: 'ACTIVE' },
  { id: 'WNG-ISB-GRL', branchId: 'BR-ISB-02', code: 'ISB-GRL', name: 'F-10 Girls Wing', type: 'Girls', gradeRange: 'Class 6 - Class 10', headName: 'Ms. Sarah Jenkins', status: 'ACTIVE' },
  { id: 'WNG-ISB-SNR', branchId: 'BR-ISB-02', code: 'ISB-SNR', name: 'F-10 Senior Science Wing', type: 'Senior', gradeRange: 'Class 9 - Class 10', headName: 'Dr. Rehan Alvi', status: 'ACTIVE' },
  { id: 'WNG-KHI-MON', branchId: 'BR-KHI-03', code: 'KHI-MON', name: 'Clifton Early Years Wing', type: 'Montessori', gradeRange: 'Playgroup - Prep', headName: 'Ms. Mahnoor Shah', status: 'ACTIVE' },
  { id: 'WNG-KHI-JNR', branchId: 'BR-KHI-03', code: 'KHI-JNR', name: 'Clifton Junior Wing', type: 'Junior', gradeRange: 'Class 1 - Class 5', headName: 'Ms. Rabia Qureshi', status: 'ACTIVE' },
  { id: 'WNG-KHI-MID', branchId: 'BR-KHI-03', code: 'KHI-MID', name: 'Clifton Middle Wing', type: 'Middle', gradeRange: 'Class 6 - Class 8', headName: 'Engr. Bilal Hashmi', status: 'ACTIVE' },
  { id: 'WNG-KHI-SNR', branchId: 'BR-KHI-03', code: 'KHI-SNR', name: 'Clifton Senior & Cambridge Wing', type: 'Senior', gradeRange: 'Class 9 - O-Level', headName: 'Prof. Asadullah Qazi', status: 'ACTIVE' }
];

export function getDefaultSchoolGatewaySettings() {
  return {
    currency: 'PKR',
    allowOnlineStudentPayment: true,
    allowOnlineParentPayment: true,
    allowPartialOnlinePayment: false,
    requireProofReference: true,
    autoIssueReceiptOnVerify: true,
    oneBillPrefix: '10089',
    lateFeeGraceDays: 5,
    lateFeeFinePkr: 500,
    receiptFooterNote: 'Authorized by School Owner. Valid across JazzCash, Easypaisa, Raast, 1Bill & Bank Counters.',
    ownerNotifyOnPayment: true,
    customPolicyFields: []
  };
}

export function getDefaultSchoolPaymentGateways(tenantId = 'tenant-root-platform') {
  const safeTid = String(tenantId || 'tenant-root-platform').replace(/[^a-zA-Z0-9_-]/g, '_');
  return [
    {
      id: `PGW-${safeTid}-raast`,
      providerKey: 'raast',
      displayName: 'Raast Instant IBFT',
      category: 'raast_ibft',
      accountTitle: 'SoftCode International School',
      accountNumber: '0300-8451920',
      iban: 'PK36MEZN0001020105829102',
      raastId: '03008451920',
      bankName: 'State Bank Raast (Meezan Linked)',
      branchCode: '0102',
      tillId: '',
      billerCode: '',
      merchantId: 'RAAST-PK-01',
      webhookUrl: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Zero-fee instant State Bank Raast transfer from any Pakistani bank app using Raast ID or IBAN. Submit TRX ID below.',
      allowedPortals: ['owner', 'principal', 'accountant', 'student', 'parent'],
      customFields: [{ label: 'Settlement Cycle', value: 'Instant T+0 (SBP Raast)' }],
      isEnabled: true,
      isDefault: true,
      sortOrder: 10
    },
    {
      id: `PGW-${safeTid}-jazzcash`,
      providerKey: 'jazzcash',
      displayName: 'JazzCash Merchant & Wallet',
      category: 'mobile_wallet',
      accountTitle: 'SoftCode International School',
      accountNumber: '0300-8451920',
      iban: '',
      raastId: '03008451920',
      bankName: 'JazzCash Mobilink Microfinance',
      branchCode: '',
      tillId: '982140',
      billerCode: '',
      merchantId: 'JC-PK-8820',
      webhookUrl: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Open JazzCash App -> Till Pay (Till # 982140) or Send Money to 0300-8451920 -> Enter 11-digit TID below.',
      allowedPortals: ['owner', 'principal', 'accountant', 'student', 'parent'],
      customFields: [{ label: 'CNIC Tail / Helpline', value: '042-35761201' }],
      isEnabled: true,
      isDefault: false,
      sortOrder: 20
    },
    {
      id: `PGW-${safeTid}-easypaisa`,
      providerKey: 'easypaisa',
      displayName: 'Easypaisa Merchant & QR',
      category: 'mobile_wallet',
      accountTitle: 'SoftCode International School',
      accountNumber: '0345-9182736',
      iban: '',
      raastId: '03459182736',
      bankName: 'Easypaisa Telenor Microfinance',
      branchCode: '',
      tillId: '441098',
      billerCode: '',
      merchantId: 'EP-PK-4410',
      webhookUrl: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Open Easypaisa App -> Send Money / QR Pay to 0345-9182736 -> Enter TRX ID in payment form.',
      allowedPortals: ['owner', 'principal', 'accountant', 'student', 'parent'],
      customFields: [{ label: 'Merchant QR Code ID', value: 'EP-QR-441098' }],
      isEnabled: true,
      isDefault: false,
      sortOrder: 30
    },
    {
      id: `PGW-${safeTid}-onebill`,
      providerKey: 'onebill',
      displayName: '1Link / 1Bill Fee Voucher (KuickPay)',
      category: '1link_1bill',
      accountTitle: 'SoftCode Fee Collection',
      accountNumber: '10089',
      iban: '',
      raastId: '',
      bankName: '1Link / KuickPay All PK Banks',
      branchCode: '1LINK',
      tillId: '',
      billerCode: '10089',
      merchantId: 'KP-10089',
      webhookUrl: '',
      feeType: 'fixed',
      feeValue: 50,
      verificationMode: 'auto_instant',
      instructions: 'Pay from any Pakistani bank app via Bill Payment -> 1Bill Invoice / KuickPay using Biller Prefix 10089 + Challan Number.',
      allowedPortals: ['owner', 'principal', 'accountant', 'student', 'parent'],
      customFields: [{ label: '1Bill Consumer Format', value: '10089 + Roll / Challan #' }],
      isEnabled: true,
      isDefault: false,
      sortOrder: 40
    },
    {
      id: `PGW-${safeTid}-meezan`,
      providerKey: 'meezan_bank',
      displayName: 'Meezan Bank (Islamic Banking)',
      category: 'bank_challan',
      accountTitle: 'SoftCode International School',
      accountNumber: '0102-0105829102',
      iban: 'PK36MEZN0001020105829102',
      raastId: '',
      bankName: 'Meezan Bank Limited',
      branchCode: '0102',
      tillId: '',
      billerCode: '',
      merchantId: 'MEZN-0102',
      webhookUrl: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Deposit 3-Copy Bank Challan at any Meezan Bank branch counter or transfer via Meezan Mobile App and enter Bank Slip / IBFT Ref.',
      allowedPortals: ['owner', 'principal', 'accountant', 'student', 'parent'],
      customFields: [{ label: 'Branch Name', value: 'Gulberg III Main Branch, Lahore' }],
      isEnabled: true,
      isDefault: false,
      sortOrder: 50
    },
    {
      id: `PGW-${safeTid}-hbl`,
      providerKey: 'hbl_bank',
      displayName: 'HBL (Habib Bank Limited)',
      category: 'bank_challan',
      accountTitle: 'SoftCode International School',
      accountNumber: '0042-799102938',
      iban: 'PK48HABB0000427991029380',
      raastId: '',
      bankName: 'Habib Bank Limited (HBL)',
      branchCode: '0042',
      tillId: '',
      billerCode: '',
      merchantId: 'HBL-0042',
      webhookUrl: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Deposit fee challan at HBL Branch or transfer via HBL Mobile / Konnect and submit Reference #.',
      allowedPortals: ['owner', 'principal', 'accountant', 'student', 'parent'],
      customFields: [{ label: 'Branch Name', value: 'Liberty Market Branch, Lahore' }],
      isEnabled: true,
      isDefault: false,
      sortOrder: 60
    },
    {
      id: `PGW-${safeTid}-sadapay`,
      providerKey: 'sadapay_nayapay',
      displayName: 'SadaPay / NayaPay Wallet',
      category: 'mobile_wallet',
      accountTitle: 'SoftCode Accounts Desk',
      accountNumber: '0312-7744110',
      iban: 'PK22SADA0000003127744110',
      raastId: '03127744110',
      bankName: 'SadaPay / NayaPay PK',
      branchCode: '',
      tillId: '',
      billerCode: '',
      merchantId: 'SP-NP-PK',
      webhookUrl: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Send instant Raast or IBFT transfer from SadaPay / NayaPay and enter Transaction Ref #.',
      allowedPortals: ['owner', 'principal', 'accountant', 'student', 'parent'],
      customFields: [],
      isEnabled: true,
      isDefault: false,
      sortOrder: 70
    },
    {
      id: `PGW-${safeTid}-cash`,
      providerKey: 'cash_counter',
      displayName: 'Cash at School Fee Counter',
      category: 'cash_counter',
      accountTitle: 'School Bursar / Accounts Counter',
      accountNumber: 'COUNTER-DESK',
      iban: '',
      raastId: '',
      bankName: 'Campus Cash Desk',
      branchCode: 'DESK-01',
      tillId: '',
      billerCode: '',
      merchantId: 'CASH-DESK',
      webhookUrl: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'counter_cash',
      instructions: 'Pay cash directly at School Accountant or Principal Fee Desk and collect stamped official receipt.',
      allowedPortals: ['owner', 'principal', 'accountant'],
      customFields: [],
      isEnabled: true,
      isDefault: false,
      sortOrder: 80
    }
  ];
}

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
  safeAddCol('local_school_staff', 'fingerprint_enrolled', 'INTEGER DEFAULT 0');
  safeAddCol('local_school_principals', 'fingerprint_enrolled', 'INTEGER DEFAULT 0');
  safeAddCol('local_school_payment_transactions', 'proof_screenshot', "TEXT DEFAULT ''");

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
      CREATE TABLE IF NOT EXISTS local_school_fingerprint_profiles (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        member_id TEXT NOT NULL,
        member_category TEXT NOT NULL,
        member_name TEXT NOT NULL,
        member_code TEXT,
        grade_or_dept TEXT,
        finger_label TEXT DEFAULT 'Right Index',
        scanner_type TEXT DEFAULT 'device_webauthn',
        credential_id TEXT,
        public_key_spki TEXT,
        fingerprint_descriptor_json TEXT NOT NULL DEFAULT '[]',
        fingerprint_preview_data TEXT,
        fingerprint_hash TEXT NOT NULL,
        quality_score REAL DEFAULT 95,
        lite_enabled INTEGER DEFAULT 1,
        enrolled_by TEXT DEFAULT 'owner',
        enrolled_at TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0,
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
    const hwCols = [
      ['teacher_id', 'TEXT'],
      ['attachment_name', 'TEXT'],
      ['attachment_type', 'TEXT'],
      ['attachment_data', 'TEXT'],
      ['resource_kind', "TEXT DEFAULT 'Homework'"],
      ['max_marks', 'REAL DEFAULT 10'],
      ['status', "TEXT DEFAULT 'Active'"],
      ['section', "TEXT DEFAULT 'All Sections'"],
      ['chapter_topic', 'TEXT'],
      ['due_time', "TEXT DEFAULT '11:59 PM'"],
      ['submission_mode', "TEXT DEFAULT 'Online Upload + Written'"],
      ['priority', "TEXT DEFAULT 'Normal'"],
      ['estimated_minutes', 'INTEGER DEFAULT 30'],
      ['external_link', 'TEXT']
    ];
    for (const [c, d] of hwCols) safeAddCol('local_school_homework', c, d);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS local_school_homework_submissions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        homework_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        roll_no TEXT,
        student_name TEXT NOT NULL,
        grade TEXT,
        answer_text TEXT,
        attachment_name TEXT,
        attachment_type TEXT,
        attachment_data TEXT,
        external_link TEXT,
        status TEXT DEFAULT 'Submitted',
        marks_obtained REAL,
        max_marks REAL DEFAULT 10,
        teacher_remarks TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        submitted_at TEXT,
        is_synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_study_materials (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        grade TEXT NOT NULL,
        material_type TEXT DEFAULT 'Class Notes',
        description TEXT,
        attachment_name TEXT,
        attachment_type TEXT,
        attachment_data TEXT,
        external_url TEXT,
        file_size TEXT,
        uploaded_by TEXT,
        teacher_id TEXT,
        downloads_count INTEGER DEFAULT 0,
        is_synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_branches (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        city TEXT,
        address TEXT,
        phone TEXT,
        principal_name TEXT,
        accountant_name TEXT,
        established_year TEXT,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_wings (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        branch_id TEXT NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        wing_type TEXT DEFAULT 'General',
        grade_range TEXT,
        head_name TEXT,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_messages (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        branch_id TEXT DEFAULT 'BR-LHR-01',
        wing_id TEXT DEFAULT 'WNG-LHR-SR',
        sender TEXT NOT NULL,
        sender_role TEXT DEFAULT 'parent',
        recipient TEXT NOT NULL,
        child_id TEXT,
        student_name TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT,
        reply TEXT,
        reply_by TEXT,
        reply_date TEXT,
        status TEXT DEFAULT 'Open',
        is_synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_payment_gateways (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        branch_id TEXT DEFAULT 'ALL',
        wing_id TEXT DEFAULT 'ALL',
        provider_key TEXT NOT NULL,
        display_name TEXT NOT NULL,
        category TEXT DEFAULT 'mobile_wallet',
        account_title TEXT,
        account_number TEXT,
        iban TEXT,
        raast_id TEXT,
        bank_name TEXT,
        branch_code TEXT,
        till_id TEXT,
        biller_code TEXT,
        merchant_id TEXT,
        merchant_secret_enc TEXT,
        integrity_salt_enc TEXT,
        webhook_url TEXT,
        fee_type TEXT DEFAULT 'none',
        fee_value REAL DEFAULT 0,
        verification_mode TEXT DEFAULT 'slip_review',
        instructions TEXT,
        allowed_portals_json TEXT DEFAULT '["owner","principal","accountant","student","parent"]',
        custom_fields_json TEXT DEFAULT '[]',
        is_enabled INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 10,
        is_synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_gateway_settings (
        tenant_id TEXT PRIMARY KEY,
        settings_json TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS local_school_payment_transactions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'tenant-root-platform',
        branch_id TEXT DEFAULT 'BR-LHR-01',
        wing_id TEXT DEFAULT 'WNG-LHR-SR',
        txn_ref TEXT NOT NULL,
        challan_no TEXT,
        gateway_id TEXT NOT NULL,
        gateway_name TEXT NOT NULL,
        provider_key TEXT NOT NULL,
        student_id TEXT,
        student_name TEXT NOT NULL,
        roll_no TEXT,
        grade TEXT,
        guardian_name TEXT,
        payer_phone TEXT,
        payer_account_title TEXT,
        month TEXT,
        base_amount REAL NOT NULL,
        gateway_fee REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        currency TEXT DEFAULT 'PKR',
        status TEXT DEFAULT 'PENDING_VERIFICATION',
        verification_mode TEXT DEFAULT 'slip_review',
        proof_reference TEXT,
        proof_notes TEXT,
        submitted_by_name TEXT,
        submitted_by_role TEXT DEFAULT 'parent',
        verified_by TEXT,
        verified_at TEXT,
        rejection_reason TEXT,
        linked_fee_id TEXT,
        custom_fields_json TEXT DEFAULT '{}',
        is_synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_school_pg_gateways_tenant ON local_school_payment_gateways (tenant_id, sort_order);
      CREATE INDEX IF NOT EXISTS idx_school_pg_txns_tenant_status ON local_school_payment_transactions (tenant_id, status, created_at);
      CREATE INDEX IF NOT EXISTS idx_school_pg_txns_student ON local_school_payment_transactions (tenant_id, student_id);
    `);
    safeAddCol('local_school_branches', 'established_year', 'TEXT');
    const branchScopedTables = [
      'local_school_students',
      'local_school_fees',
      'local_school_attendance',
      'local_school_staff',
      'local_school_principals',
      'local_school_face_profiles',
      'local_school_fingerprint_profiles',
      'local_school_teachers',
      'local_school_exams',
      'local_school_results',
      'local_school_admissions',
      'local_school_homework',
      'local_school_homework_submissions',
      'local_school_study_materials',
      'local_school_messages',
      'local_school_leaves',
      'local_school_concessions',
      'local_school_complaints',
      'local_school_lesson_plans',
      'local_school_substitutions',
      'local_school_audit_logs',
      'local_school_reconciliation',
      'local_school_petty_vouchers'
    ];
    for (const tbl of branchScopedTables) {
      safeAddCol(tbl, 'branch_id', "TEXT DEFAULT 'BR-LHR-01'");
      safeAddCol(tbl, 'wing_id', "TEXT DEFAULT 'WNG-LHR-SR'");
    }
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

  const normalizeScopeVal = (raw) => {
    const s = String(raw || '').trim();
    if (!s || s.toUpperCase() === 'ALL') return '';
    return s;
  };

  const isWingLockedHeader = (req) => {
    const v = String(req?.headers?.['x-wing-scope-locked'] || '').trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes';
  };

  const resolveBranchWingScope = (req) => {
    const role = resolveUserRole(req);
    const isOwner = !role || OWNER_ROLES.has(role);
    const assignedBranchId = normalizeScopeVal(req?.headers?.['x-branch-id']);
    const assignedWingId = normalizeScopeVal(req?.headers?.['x-wing-id']);
    const wingLocked = isWingLockedHeader(req);
    const queryBranchId = normalizeScopeVal(req?.query?.branch_id ?? req?.query?.branchId);
    const queryWingId = normalizeScopeVal(req?.query?.wing_id ?? req?.query?.wingId);
    const bodyBranchId = normalizeScopeVal(req?.body?.branchId ?? req?.body?.branch_id);
    const bodyWingId = normalizeScopeVal(req?.body?.wingId ?? req?.body?.wing_id);

    const isBranchLocked = !isOwner && Boolean(assignedBranchId);
    const isWingLocked = isBranchLocked && wingLocked && Boolean(assignedWingId);

    if (isBranchLocked) {
      if (queryBranchId && queryBranchId !== assignedBranchId) {
        return {
          errorStatus: 403,
          errorCode: 'BRANCH_SCOPE_FORBIDDEN',
          errorMessage: `Role '${role}' is locked to branch '${assignedBranchId}' and cannot access branch '${queryBranchId}'.`
        };
      }
      if (bodyBranchId && bodyBranchId !== assignedBranchId) {
        return {
          errorStatus: 403,
          errorCode: 'BRANCH_SCOPE_FORBIDDEN',
          errorMessage: `Role '${role}' is locked to branch '${assignedBranchId}' and cannot write to branch '${bodyBranchId}'.`
        };
      }
    }

    if (isWingLocked) {
      if (queryWingId && queryWingId !== assignedWingId) {
        return {
          errorStatus: 403,
          errorCode: 'WING_SCOPE_FORBIDDEN',
          errorMessage: `Role '${role}' is locked to wing '${assignedWingId}' and cannot access wing '${queryWingId}'.`
        };
      }
      if (bodyWingId && bodyWingId !== assignedWingId) {
        return {
          errorStatus: 403,
          errorCode: 'WING_SCOPE_FORBIDDEN',
          errorMessage: `Role '${role}' is locked to wing '${assignedWingId}' and cannot write to wing '${bodyWingId}'.`
        };
      }
    }

    const branchFilter = isBranchLocked ? assignedBranchId : (queryBranchId || assignedBranchId || '');
    const wingFilter = isWingLocked ? assignedWingId : (queryWingId || (isBranchLocked ? '' : assignedWingId) || '');
    const writeBranchId = bodyBranchId || assignedBranchId || queryBranchId || DEFAULT_BRANCH_ID;
    const writeWingId = bodyWingId || (isWingLocked ? assignedWingId : (queryWingId || assignedWingId)) || DEFAULT_WING_ID;

    return {
      errorStatus: 0,
      isOwner,
      isBranchLocked,
      isWingLocked,
      assignedBranchId,
      assignedWingId,
      branchFilter,
      wingFilter,
      writeBranchId,
      writeWingId
    };
  };

  const sendScopeError = (res, scope) =>
    res.status(scope.errorStatus || 403).json({
      ok: false,
      error: scope.errorCode || 'BRANCH_SCOPE_FORBIDDEN',
      message: scope.errorMessage || 'Branch or wing access forbidden.'
    });

  const assertRecordScopeAllowed = (scope, row) => {
    if (!row || !scope) return null;
    const recBranch = String(row.branch_id || row.branchId || '').trim();
    const recWing = String(row.wing_id || row.wingId || '').trim();
    if (scope.isBranchLocked && recBranch && recBranch !== scope.assignedBranchId) {
      return {
        status: 403,
        error: 'BRANCH_SCOPE_FORBIDDEN',
        message: `Record belongs to branch '${recBranch}', outside locked branch '${scope.assignedBranchId}'.`
      };
    }
    if (scope.isWingLocked && recWing && recWing !== scope.assignedWingId) {
      return {
        status: 403,
        error: 'WING_SCOPE_FORBIDDEN',
        message: `Record belongs to wing '${recWing}', outside locked wing '${scope.assignedWingId}'.`
      };
    }
    return null;
  };

  const buildScopeSql = (scope, alias = '') => {
    const prefix = alias ? `${alias}.` : '';
    const clauses = [];
    const params = [];
    if (scope?.branchFilter) {
      clauses.push(`${prefix}branch_id = ?`);
      params.push(scope.branchFilter);
    }
    if (scope?.wingFilter) {
      clauses.push(`${prefix}wing_id = ?`);
      params.push(scope.wingFilter);
    }
    return {
      sql: clauses.length ? ` AND ${clauses.join(' AND ')}` : '',
      params
    };
  };

  const mapBranchRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    code: r.code,
    name: r.name,
    city: r.city || '',
    address: r.address || '',
    phone: r.phone || '',
    principalName: r.principal_name || '',
    accountantName: r.accountant_name || '',
    establishedYear: r.established_year || '',
    status: r.status || 'ACTIVE'
  });

  const mapWingRow = (r, tid) => ({
    id: r.id,
    tenantId: r.tenant_id || tid,
    branchId: r.branch_id,
    code: r.code,
    name: r.name,
    type: r.wing_type || 'General',
    gradeRange: r.grade_range || '',
    headName: r.head_name || '',
    status: r.status || 'ACTIVE'
  });

  const ensureTenantBranchesAndWings = (tid) => {
    if (!sqliteDb) return;
    try {
      const bCnt = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_branches WHERE tenant_id = ?').get(tid);
      if (!bCnt || Number(bCnt.cnt || 0) === 0) {
        const insBranch = sqliteDb.prepare(`
          INSERT OR IGNORE INTO local_school_branches
          (id, tenant_id, code, name, city, address, phone, principal_name, accountant_name, established_year, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const b of SCHOOL_BRANCHES) {
          const scopedId = tid === ROOT_TENANT_ID ? b.id : `${b.id}::${tid}`;
          // Keep clean canonical IDs if not yet used in table, else scope per tenant
          const existsGlobal = sqliteDb.prepare('SELECT id FROM local_school_branches WHERE id = ?').get(b.id);
          const finalId = existsGlobal ? scopedId : b.id;
          insBranch.run(finalId, tid, b.code, b.name, b.city, b.address, b.phone, b.principalName, b.accountantName || '', b.establishedYear || '', b.status || 'ACTIVE');
        }
      }
      const wCnt = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_wings WHERE tenant_id = ?').get(tid);
      if (!wCnt || Number(wCnt.cnt || 0) === 0) {
        const tenantBranches = sqliteDb.prepare('SELECT id, code FROM local_school_branches WHERE tenant_id = ?').all(tid);
        const branchIdByCode = new Map(tenantBranches.map((tb) => [tb.code, tb.id]));
        const insWing = sqliteDb.prepare(`
          INSERT OR IGNORE INTO local_school_wings
          (id, tenant_id, branch_id, code, name, wing_type, grade_range, head_name, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const w of SCHOOL_WINGS) {
          const baseCode = w.branchId.replace(/^BR-/, '');
          const mappedBranchId = branchIdByCode.get(baseCode) || w.branchId;
          const existsGlobal = sqliteDb.prepare('SELECT id FROM local_school_wings WHERE id = ?').get(w.id);
          const finalWingId = existsGlobal ? `${w.id}::${tid}` : w.id;
          insWing.run(finalWingId, tid, mappedBranchId, w.code, w.name, w.type, w.gradeRange, w.headName, w.status || 'ACTIVE');
        }
      }
    } catch {}
  };

  const getBranchWingNameMaps = (tid) => {
    const branchNames = new Map(SCHOOL_BRANCHES.map((b) => [b.id, b.name]));
    const wingNames = new Map(SCHOOL_WINGS.map((w) => [w.id, w.name]));
    if (sqliteDb) {
      try {
        for (const b of sqliteDb.prepare('SELECT id, name FROM local_school_branches WHERE tenant_id = ?').all(tid)) {
          branchNames.set(b.id, b.name);
        }
        for (const w of sqliteDb.prepare('SELECT id, name FROM local_school_wings WHERE tenant_id = ?').all(tid)) {
          wingNames.set(w.id, w.name);
        }
      } catch {}
    }
    return {
      branchName: (bid) => branchNames.get(bid) || (bid === 'ALL' ? 'All Branches' : 'Main Campus'),
      wingName: (wid) => wingNames.get(wid) || (wid === 'ALL' ? 'All Wings' : 'General Campus Wing')
    };
  };

  // =========================================================================
  // MULTI-BRANCH & MULTI-WING REGISTRY CRUD APIs
  // =========================================================================
  router.get('/branches', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    let branches = [];
    if (sqliteDb) {
      ensureTenantBranchesAndWings(tid);
      const rows = sqliteDb.prepare('SELECT * FROM local_school_branches WHERE tenant_id = ? ORDER BY created_at ASC, id ASC').all(tid);
      branches = rows.map((r) => mapBranchRow(r, tid));
    } else {
      branches = SCHOOL_BRANCHES.map((b) => ({ ...b, tenantId: tid }));
    }
    if (scope.branchFilter) {
      branches = branches.filter((b) => b.id === scope.branchFilter || b.code === scope.branchFilter);
    }
    const statusFilter = String(req.query?.status || '').trim().toUpperCase();
    if (statusFilter) {
      branches = branches.filter((b) => String(b.status || '').toUpperCase() === statusFilter);
    }
    res.json({ ok: true, tenantId: tid, branches });
  });

  router.post('/branches', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const code = String(b.code || '').trim().toUpperCase();
    if (!name || !code) {
      return res.status(400).json({ ok: false, message: 'Branch name and code are required.' });
    }
    if (sqliteDb) ensureTenantBranchesAndWings(tid);
    const branchId = String(b.id || `BR-${code.replace(/[^A-Z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`).trim();
    const branch = {
      id: branchId,
      tenantId: tid,
      code,
      name,
      city: String(b.city || '').trim(),
      address: String(b.address || '').trim(),
      phone: String(b.phone || '').trim(),
      principalName: String(b.principalName || '').trim(),
      accountantName: String(b.accountantName || '').trim(),
      establishedYear: String(b.establishedYear || new Date().getFullYear()).trim(),
      status: String(b.status || 'ACTIVE').toUpperCase()
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_branches
        (id, tenant_id, code, name, city, address, phone, principal_name, accountant_name, established_year, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        branch.id, tid, branch.code, branch.name, branch.city, branch.address, branch.phone,
        branch.principalName, branch.accountantName, branch.establishedYear, branch.status
      );
      recordAudit(tid, {
        branchId: branch.id,
        operatorName: String(req.headers['x-user-name'] || 'School Owner'),
        operatorRole: 'School Owner',
        actionType: 'Campus Branch Registered',
        category: 'Administrative',
        entityId: branch.id,
        entityDescription: `${branch.name} (${branch.code}) · ${branch.city || 'Campus'}`,
        details: `Created/updated branch ${branch.name} under tenant ${tid}.`,
        severity: 'Normal Audit'
      });
    }
    res.status(201).json({ ok: true, branch });
  });

  router.put('/branches/:id', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    const b = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    ensureTenantBranchesAndWings(tid);
    const existing = sqliteDb.prepare('SELECT * FROM local_school_branches WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Branch not found for this tenant' });
    sqliteDb.prepare(`
      UPDATE local_school_branches SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        city = COALESCE(?, city),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        principal_name = COALESCE(?, principal_name),
        accountant_name = COALESCE(?, accountant_name),
        established_year = COALESCE(?, established_year),
        status = COALESCE(?, status)
      WHERE id = ? AND tenant_id = ?
    `).run(
      b.code ? String(b.code).trim().toUpperCase() : null,
      b.name !== undefined ? String(b.name).trim() : null,
      b.city ?? null,
      b.address ?? null,
      b.phone ?? null,
      b.principalName ?? null,
      b.accountantName ?? null,
      b.establishedYear ?? null,
      b.status ? String(b.status).toUpperCase() : null,
      id, tid
    );
    const updated = sqliteDb.prepare('SELECT * FROM local_school_branches WHERE id = ? AND tenant_id = ?').get(id, tid);
    res.json({ ok: true, branch: mapBranchRow(updated, tid) });
  });

  router.delete('/branches/:id', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    ensureTenantBranchesAndWings(tid);
    const existing = sqliteDb.prepare('SELECT * FROM local_school_branches WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Branch not found for this tenant' });
    sqliteDb.prepare('DELETE FROM local_school_wings WHERE branch_id = ? AND tenant_id = ?').run(id, tid);
    sqliteDb.prepare('DELETE FROM local_school_branches WHERE id = ? AND tenant_id = ?').run(id, tid);
    res.json({ ok: true, id });
  });

  router.get('/wings', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    let wings = [];
    if (sqliteDb) {
      ensureTenantBranchesAndWings(tid);
      const rows = sqliteDb.prepare('SELECT * FROM local_school_wings WHERE tenant_id = ? ORDER BY created_at ASC, id ASC').all(tid);
      wings = rows.map((r) => mapWingRow(r, tid));
    } else {
      wings = SCHOOL_WINGS.map((w) => ({ ...w, tenantId: tid }));
    }
    if (scope.branchFilter) {
      wings = wings.filter((w) => w.branchId === scope.branchFilter);
    }
    if (scope.wingFilter) {
      wings = wings.filter((w) => w.id === scope.wingFilter);
    }
    res.json({ ok: true, tenantId: tid, wings });
  });

  router.post('/wings', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    const w = req.body || {};
    const branchId = String(w.branchId || w.branch_id || '').trim();
    const name = String(w.name || '').trim();
    if (!branchId || !name) {
      return res.status(400).json({ ok: false, message: 'branchId and wing name are required.' });
    }
    if (sqliteDb) {
      ensureTenantBranchesAndWings(tid);
      const branchExists = sqliteDb.prepare('SELECT id FROM local_school_branches WHERE id = ? AND tenant_id = ?').get(branchId, tid);
      if (!branchExists) {
        return res.status(404).json({ ok: false, message: `Parent branch '${branchId}' not found for this tenant.` });
      }
    }
    const type = String(w.type || w.wingType || 'General').trim();
    const code = String(w.code || `${branchId.replace(/^BR-/, '')}-${type.slice(0, 3).toUpperCase()}`).trim().toUpperCase();
    const wing = {
      id: String(w.id || `WNG-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`).trim(),
      tenantId: tid,
      branchId,
      code,
      name,
      type,
      gradeRange: String(w.gradeRange || '').trim(),
      headName: String(w.headName || '').trim(),
      status: String(w.status || 'ACTIVE').toUpperCase()
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_wings
        (id, tenant_id, branch_id, code, name, wing_type, grade_range, head_name, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(wing.id, tid, wing.branchId, wing.code, wing.name, wing.type, wing.gradeRange, wing.headName, wing.status);
    }
    res.status(201).json({ ok: true, wing });
  });

  router.put('/wings/:id', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    const w = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    ensureTenantBranchesAndWings(tid);
    const existing = sqliteDb.prepare('SELECT * FROM local_school_wings WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Wing not found for this tenant' });
    sqliteDb.prepare(`
      UPDATE local_school_wings SET
        branch_id = COALESCE(?, branch_id),
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        wing_type = COALESCE(?, wing_type),
        grade_range = COALESCE(?, grade_range),
        head_name = COALESCE(?, head_name),
        status = COALESCE(?, status)
      WHERE id = ? AND tenant_id = ?
    `).run(
      w.branchId ?? null,
      w.code ? String(w.code).trim().toUpperCase() : null,
      w.name !== undefined ? String(w.name).trim() : null,
      w.type ?? w.wingType ?? null,
      w.gradeRange ?? null,
      w.headName ?? null,
      w.status ? String(w.status).toUpperCase() : null,
      id, tid
    );
    const updated = sqliteDb.prepare('SELECT * FROM local_school_wings WHERE id = ? AND tenant_id = ?').get(id, tid);
    res.json({ ok: true, wing: mapWingRow(updated, tid) });
  });

  router.delete('/wings/:id', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    ensureTenantBranchesAndWings(tid);
    const info = sqliteDb.prepare('DELETE FROM local_school_wings WHERE id = ? AND tenant_id = ?').run(id, tid);
    if (!info.changes) return res.status(404).json({ ok: false, message: 'Wing not found for this tenant' });
    res.json({ ok: true, id });
  });

  const recordAudit = (tid, entry) => {
    const id = entry.id || ('AUD-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900));
    const ts = entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
    const full = {
      id,
      tenantId: tid,
      branchId: String(entry.branchId || entry.branch_id || DEFAULT_BRANCH_ID),
      wingId: String(entry.wingId || entry.wing_id || DEFAULT_WING_ID),
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
          (id, tenant_id, branch_id, wing_id, timestamp, operator_name, operator_role, action_type, category, entity_id, entity_description, details, severity, verified_by, ip_address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          full.id, tid, full.branchId, full.wingId, full.timestamp, full.operatorName, full.operatorRole, full.actionType,
          full.category, full.entityId, full.entityDescription, full.details, full.severity, full.verifiedBy, full.ipAddress
        );
      } catch {
        // non-fatal audit failure
      }
    }
    return full;
  };

  const mapStudentRow = (r, tid, nameMaps = null) => {
    const branchId = r.branch_id || DEFAULT_BRANCH_ID;
    const wingId = r.wing_id || DEFAULT_WING_ID;
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : undefined,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : undefined,
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
    };
  };

  // =========================================================================
  // STUDENTS DIRECTORY & LIFECYCLE
  // =========================================================================
  router.get('/students', async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    let list = [];
    let totalTenantRows = 0;
    if (sqliteDb) {
      try {
        const cntRow = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_students WHERE tenant_id = ?').get(tid);
        totalTenantRows = Number(cntRow?.cnt || 0);
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb
          .prepare(`SELECT * FROM local_school_students WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`)
          .all(tid, ...scopeSql.params);
        list = rows.map((r) => mapStudentRow(r, tid, nameMaps));
      } catch {}
    }
    if (totalTenantRows === 0 && list.length === 0 && tid === ROOT_TENANT_ID) {
      const rawList = getCollectionDocs ? await getCollectionDocs('school_students', defaultStudentsSeed) : defaultStudentsSeed;
      list = rawList
        .filter((r) => !r.tenant_id || r.tenant_id === tid)
        .map((r) => {
          const decRow = vault.decryptFields(r.tenant_id || tid, r, ['fullName', 'guardianName', 'phone', 'studentBForm', 'guardianCnic', 'guardianEmail', 'emergencyContact', 'address', 'passportNo']);
          const branchId = decRow.branchId || decRow.branch_id || DEFAULT_BRANCH_ID;
          const wingId = decRow.wingId || decRow.wing_id || DEFAULT_WING_ID;
          return {
            ...decRow,
            branchId,
            branchName: nameMaps.branchName(branchId),
            wingId,
            wingName: nameMaps.wingName(wingId)
          };
        })
        .filter((r) => (!scope.branchFilter || r.branchId === scope.branchFilter) && (!scope.wingFilter || r.wingId === scope.wingFilter));
    }
    res.json({ ok: true, tenantId: tid, branchId: scope.branchFilter || 'ALL', wingId: scope.wingFilter || 'ALL', students: list });
  });

  router.post('/students', rejectRestrictedRole(['student', 'parent', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
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
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;
    const newStudent = {
      id: s.id || ('STD-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      branchId,
      branchName: nameMaps.branchName(branchId),
      wingId,
      wingName: nameMaps.wingName(wingId),
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
            id, tenant_id, branch_id, wing_id, roll_no, full_name, grade, section, gender, dob, student_bform, blood_group,
            guardian_name, guardian_relation, guardian_cnic, guardian_occupation, guardian_email, phone,
            emergency_contact, address, previous_school, medical_conditions, fee_amount, due_bakaya,
            fee_status, attendance_rate, admission_date, status, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).run(
          newStudent.id, tid, newStudent.branchId, newStudent.wingId, newStudent.rollNo, encFullName, newStudent.grade, newStudent.section,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    const u = req.body || {};

    let existing = null;
    if (sqliteDb) {
      existing = sqliteDb.prepare('SELECT * FROM local_school_students WHERE id = ? AND tenant_id = ?').get(id, tid);
    }
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Student not found for this tenant' });
    }
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

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
    const reqBranchId = normalizeScopeVal(u.branchId ?? u.branch_id) || null;
    const reqWingId = normalizeScopeVal(u.wingId ?? u.wing_id) || null;

    sqliteDb.prepare(`
      UPDATE local_school_students SET
        branch_id = COALESCE(?, branch_id),
        wing_id = COALESCE(?, wing_id),
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
      reqBranchId, reqWingId,
      u.rollNo ?? null, encName, u.grade ?? null, u.section ?? null, u.gender ?? null, u.dob ?? null,
      encBForm, u.bloodGroup ?? null, encGuardian, u.guardianRelation ?? null, encCnic,
      u.guardianOccupation ?? null, encEmail, encPhone, encEmerg, encAddr,
      u.previousSchool ?? null, u.medicalConditions ?? null,
      u.feeAmount !== undefined ? Number(u.feeAmount) : null,
      u.dueBakaya !== undefined ? Number(u.dueBakaya) : null,
      u.feeStatus ?? null, u.attendanceRate ?? null, u.status ?? null, id, tid
    );

    const updatedRow = sqliteDb.prepare('SELECT * FROM local_school_students WHERE id = ? AND tenant_id = ?').get(id, tid);
    const updated = mapStudentRow(updatedRow, tid, getBranchWingNameMaps(tid));

    if (db) {
      const cloudUpdates = { ...u, tenant_id: tid, branchId: updated.branchId, wingId: updated.wingId };
      if (encName) cloudUpdates.fullName = encName;
      if (encGuardian) cloudUpdates.guardianName = encGuardian;
      if (encPhone) cloudUpdates.phone = encPhone;
      try { await updateDoc(doc(db, 'school_students', id), cloudUpdates); } catch {}
    }

    res.json({ ok: true, message: 'Student record updated', student: updated });
  });

  router.delete('/students/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id, full_name FROM local_school_students WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Student not found for this tenant' });
    }
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare('DELETE FROM local_school_students WHERE id = ? AND tenant_id = ?').run(id, tid);
    recordAudit(tid, {
      branchId: existing.branch_id || scope.writeBranchId,
      wingId: existing.wing_id || scope.writeWingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const { fromGrade, toGrade, studentIds } = req.body || {};
    if (!toGrade) {
      return res.status(400).json({ ok: false, message: 'Target grade (toGrade) is required.' });
    }
    let count = 0;
    if (sqliteDb) {
      if (Array.isArray(studentIds) && studentIds.length > 0) {
        for (const sid of studentIds) {
          const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_students WHERE id = ? AND tenant_id = ?').get(sid, tid);
          if (!existing) continue;
          const scopeErr = assertRecordScopeAllowed(scope, existing);
          if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
        }
        const stmt = sqliteDb.prepare('UPDATE local_school_students SET grade = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?');
        for (const sid of studentIds) {
          const info = stmt.run(toGrade, sid, tid);
          count += info.changes || 0;
        }
      } else if (fromGrade) {
        const scopeSql = buildScopeSql(scope);
        const info = sqliteDb
          .prepare(`UPDATE local_school_students SET grade = ?, is_synced = 0 WHERE grade = ? AND tenant_id = ?${scopeSql.sql}`)
          .run(toGrade, fromGrade, tid, ...scopeSql.params);
        count = info.changes || 0;
      }
    }
    res.json({ ok: true, message: `Successfully promoted ${count} student(s) from ${fromGrade || 'selected'} to ${toGrade}`, count });
  });

  router.post('/students/slc', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const { studentId, reason, conduct } = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_students WHERE id = ? AND tenant_id = ?').get(studentId, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Student not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

    const newStatus = 'ALUMNI / SLC ISSUED';
    const slcDate = new Date().toISOString().split('T')[0];
    const slcSerial = 'SLC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    sqliteDb.prepare('UPDATE local_school_students SET status = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(newStatus, studentId, tid);

    const updated = {
      ...mapStudentRow(row, tid, getBranchWingNameMaps(tid)),
      status: newStatus,
      slcDate,
      slcSerial,
      slcReason: reason || 'Parent Relocation / Graduated',
      slcConduct: conduct || 'Exemplary & Diligent'
    };
    recordAudit(tid, {
      branchId: updated.branchId,
      wingId: updated.wingId,
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
  const mapAdmissionRow = (r, tid, nameMaps = null) => {
    const branchId = r.branch_id || DEFAULT_BRANCH_ID;
    const wingId = r.wing_id || DEFAULT_WING_ID;
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : undefined,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : undefined,
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
    };
  };

  router.get('/admissions', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    let list = [];
    if (sqliteDb) {
      try {
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_admissions WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
        list = rows.map((r) => mapAdmissionRow(r, tid, nameMaps));
      } catch {}
    }
    res.json({ ok: true, tenantId: tid, admissions: list });
  });

  router.post('/admissions', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
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
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT INTO local_school_admissions (
          id, tenant_id, branch_id, wing_id, applicant, applied_for, section, roll_no, father_name, relation, father_cnic, student_bform,
          dob, gender, blood_group, phone, email, father_occupation, address, previous_school, emergency_contact,
          medical_notes, admission_fee, tuition_fee, discount, initial_payment_status, score, status, source, decision_remarks, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, tid, branchId, wingId, enc(tid, applicant), appliedFor, a.section || 'A', a.rollNo || '',
        enc(tid, fatherName), a.relation || 'Father', enc(tid, a.fatherCnic || ''), enc(tid, a.studentBForm || ''),
        a.dob || '', a.gender || 'Male', a.bloodGroup || 'B+', enc(tid, phone), enc(tid, a.email || ''),
        a.fatherOccupation || '', enc(tid, a.address || ''), a.previousSchool || '', enc(tid, a.emergencyContact || ''),
        a.medicalNotes || 'None', admFee, tuiFee, discount, a.initialPaymentStatus || 'Paid',
        a.score || 'Pending Assessment', a.status || 'Pending', a.source || 'School Office Direct',
        a.decisionRemarks || '', date
      );
    }

    const saved = {
      id, tenantId: tid, branchId, branchName: nameMaps.branchName(branchId), wingId, wingName: nameMaps.wingName(wingId),
      applicant, appliedFor, section: a.section || 'A', rollNo: a.rollNo || '',
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    const u = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_admissions WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Admission application not found' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

    sqliteDb.prepare(`
      UPDATE local_school_admissions SET
        branch_id = COALESCE(?, branch_id),
        wing_id = COALESCE(?, wing_id),
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
      normalizeScopeVal(u.branchId ?? u.branch_id) || null,
      normalizeScopeVal(u.wingId ?? u.wing_id) || null,
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
    res.json({ ok: true, admission: mapAdmissionRow(updated, tid, getBranchWingNameMaps(tid)) });
  });

  router.post('/admissions/:id/approve', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_admissions WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Admission application not found' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

    const adm = mapAdmissionRow(row, tid, getBranchWingNameMaps(tid));
    sqliteDb.prepare('UPDATE local_school_admissions SET status = ?, decision_remarks = ? WHERE id = ? AND tenant_id = ?')
      .run('Approved', String(req.body?.remarks || 'Approved and Enrolled into Active Student Directory'), id, tid);

    const stdId = 'STD-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90);
    const rollNo = adm.rollNo || `SCH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const feeAmount = Math.max(0, Number(adm.tuitionFee || 18000) - Number(adm.discount || 0));
    const admissionDate = new Date().toISOString().split('T')[0];

    sqliteDb.prepare(`
      INSERT INTO local_school_students (
        id, tenant_id, branch_id, wing_id, roll_no, full_name, grade, section, gender, dob, student_bform, blood_group,
        guardian_name, guardian_relation, guardian_cnic, guardian_occupation, guardian_email, phone,
        emergency_contact, address, previous_school, medical_conditions, fee_amount, due_bakaya,
        fee_status, attendance_rate, admission_date, status, is_synced, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      stdId, tid, adm.branchId, adm.wingId, rollNo, enc(tid, adm.applicant), adm.appliedFor, adm.section || 'A', adm.gender || 'Male',
      adm.dob || '', enc(tid, adm.studentBForm), adm.bloodGroup || 'B+', enc(tid, adm.fatherName),
      adm.relation || 'Father', enc(tid, adm.fatherCnic), adm.fatherOccupation || '', enc(tid, adm.email),
      enc(tid, adm.phone), enc(tid, adm.emergencyContact), enc(tid, adm.address), adm.previousSchool || '',
      adm.medicalNotes || 'None', feeAmount, adm.initialPaymentStatus === 'Paid' ? 0 : feeAmount,
      adm.initialPaymentStatus === 'Paid' ? 'PAID' : 'PENDING', '100%', admissionDate, 'ACTIVE', new Date().toISOString()
    );

    const enrolled = mapStudentRow(sqliteDb.prepare('SELECT * FROM local_school_students WHERE id = ?').get(stdId), tid, getBranchWingNameMaps(tid));
    res.json({ ok: true, message: `${adm.applicant} approved and enrolled cleanly.`, student: enrolled });
  });

  router.delete('/admissions/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_admissions WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Admission application not found' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare('DELETE FROM local_school_admissions WHERE id = ? AND tenant_id = ?').run(req.params.id, tid);
    res.json({ ok: true, id: req.params.id });
  });

  // =========================================================================
  // FEES & ACCOUNTANT BILLING LEDGER
  // =========================================================================
  const mapFeeRow = (r, tid, nameMaps = null) => {
    const branchId = r.branch_id || DEFAULT_BRANCH_ID;
    const wingId = r.wing_id || DEFAULT_WING_ID;
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : undefined,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : undefined,
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
    };
  };

  router.get('/fees', async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    let list = [];
    let totalTenantRows = 0;
    if (sqliteDb) {
      try {
        const cntRow = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_fees WHERE tenant_id = ?').get(tid);
        totalTenantRows = Number(cntRow?.cnt || 0);
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_fees WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
        list = rows.map((r) => mapFeeRow(r, tid, nameMaps));
      } catch {}
    }
    if (totalTenantRows === 0 && list.length === 0 && tid === ROOT_TENANT_ID) {
      const rawFees = getCollectionDocs ? await getCollectionDocs('school_fees', defaultFeesSeed) : defaultFeesSeed;
      list = rawFees
        .map((f) => {
          const branchId = f.branchId || f.branch_id || DEFAULT_BRANCH_ID;
          const wingId = f.wingId || f.wing_id || DEFAULT_WING_ID;
          return { ...f, branchId, branchName: nameMaps.branchName(branchId), wingId, wingName: nameMaps.wingName(wingId) };
        })
        .filter((f) => (!scope.branchFilter || f.branchId === scope.branchFilter) && (!scope.wingFilter || f.wingId === scope.wingFilter));
    }
    res.json({ ok: true, tenantId: tid, fees: list });
  });

  router.post('/fees', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
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
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;

    const newFee = {
      id: f.id || ('FEE-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      branchId,
      branchName: nameMaps.branchName(branchId),
      wingId,
      wingName: nameMaps.wingName(wingId),
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
          id, tenant_id, branch_id, wing_id, challan_no, student_id, student_name, roll_no, grade, month, tuition, lab_fee,
          discount, total, status, payment_mode, resource_reference, collected_by, collector_role, due_date, paid_date, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        newFee.id, tid, newFee.branchId, newFee.wingId, newFee.challanNo, newFee.studentId, encStudentName, newFee.rollNo, newFee.grade,
        newFee.month, newFee.tuition, newFee.labFee, newFee.discount, newFee.total, newFee.status,
        newFee.paymentMode, newFee.resourceReference, newFee.collectedBy, newFee.collectorRole, newFee.dueDate, newFee.paidDate,
        new Date().toISOString()
      );
      if (collectorRole === 'accountant') {
        recordAudit(tid, {
          branchId: newFee.branchId,
          wingId: newFee.wingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
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
    let totalTenantStudents = 0;
    if (sqliteDb) {
      const cntRow = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_students WHERE tenant_id = ?').get(tid);
      totalTenantStudents = Number(cntRow?.cnt || 0);
      const scopeSql = buildScopeSql(scope);
      const rows = sqliteDb.prepare(`SELECT * FROM local_school_students WHERE tenant_id = ?${scopeSql.sql}`).all(tid, ...scopeSql.params);
      targetStudents = rows
        .map((r) => mapStudentRow(r, tid, nameMaps))
        .filter((s) => !String(s.status || '').includes('ALUMNI') && (!Array.isArray(grades) || grades.length === 0 || grades.some((g) => s.grade.includes(g) || g === s.grade)));
    }
    if (totalTenantStudents === 0 && targetStudents.length === 0 && tid === ROOT_TENANT_ID) {
      targetStudents = defaultStudentsSeed
        .map((s) => ({ ...s, branchId: s.branchId || DEFAULT_BRANCH_ID, wingId: s.wingId || DEFAULT_WING_ID }))
        .filter((s) => (!scope.branchFilter || s.branchId === scope.branchFilter) && (!scope.wingFilter || s.wingId === scope.wingFilter))
        .filter((s) => !Array.isArray(grades) || grades.length === 0 || grades.some((g) => s.grade.includes(g) || g === s.grade));
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
        const stBranchId = st.branchId || scope.writeBranchId;
        const stWingId = st.wingId || scope.writeWingId;
        const challan = {
          id: 'FEE-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
          tenantId: tid,
          branchId: stBranchId,
          branchName: nameMaps.branchName(stBranchId),
          wingId: stWingId,
          wingName: nameMaps.wingName(stWingId),
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
              id, tenant_id, branch_id, wing_id, challan_no, student_id, student_name, roll_no, grade, month,
              tuition, lab_fee, discount, total, paid_amount, status, collector_role, due_date, is_synced, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?)
          `).run(
            challan.id, tid, challan.branchId, challan.wingId, challan.challanNo, challan.studentId, encName, challan.rollNo, challan.grade,
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
        branchId: scope.writeBranchId,
        wingId: scope.writeWingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
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
        const scopeErr = assertRecordScopeAllowed(scope, row);
        if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
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
        updatedFee = mapFeeRow(sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(id, tid), tid, nameMaps);
      }
    }

    if (sqliteDb && studentId && !updatedFee) {
      const targetStuRow = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_students WHERE id = ? AND tenant_id = ?').get(studentId, tid);
      if (targetStuRow) {
        const scopeErr = assertRecordScopeAllowed(scope, targetStuRow);
        if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
      }
    }

    if (sqliteDb && !updatedFee && studentName && numPaidNow > 0) {
      const feeId = 'FEE-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90);
      const resolvedChallanNo = String(challanNo || receiptNo || (`REC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`));
      const encStuName = enc(tid, String(studentName).trim());
      const feeStatus = partialPayment ? 'PARTIAL' : 'PAID';
      sqliteDb.prepare(`
        INSERT INTO local_school_fees (
          id, tenant_id, branch_id, wing_id, challan_no, student_id, student_name, roll_no, grade, month, tuition, lab_fee,
          discount, total, paid_amount, status, payment_mode, resource_reference, collected_by, collector_role, notes, due_date, paid_date, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        feeId, tid, scope.writeBranchId, scope.writeWingId, resolvedChallanNo, String(studentId || ''), encStuName, String(rollNo), String(grade),
        String(month), numPaidNow, numPaidNow, numPaidNow, feeStatus, String(paymentMode), String(resourceReference),
        String(collectedBy), collectorRole, String(notes || ''), paidDate, paidDate, new Date().toISOString()
      );
      updatedFee = mapFeeRow(sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(feeId, tid), tid, nameMaps);
    }

    const targetStdId = studentId || updatedFee?.studentId;
    if (sqliteDb && targetStdId) {
      const stRow = sqliteDb.prepare('SELECT due_bakaya, fee_amount, branch_id, wing_id FROM local_school_students WHERE id = ? AND tenant_id = ?').get(targetStdId, tid);
      if (stRow) {
        const scopeErr = assertRecordScopeAllowed(scope, stRow);
        if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
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
        branchId: updatedFee.branchId,
        wingId: updatedFee.wingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Fee challan not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare('DELETE FROM local_school_fees WHERE id = ? AND tenant_id = ?').run(id, tid);
    recordAudit(tid, {
      branchId: row.branch_id || scope.writeBranchId,
      wingId: row.wing_id || scope.writeWingId,
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
  const mapTeacherRow = (r, tid, nameMaps = null) => {
    const branchId = r.branch_id || DEFAULT_BRANCH_ID;
    const wingId = r.wing_id || DEFAULT_WING_ID;
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : undefined,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : undefined,
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
    };
  };

  router.get('/teachers', async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    let list = [];
    let totalTenantRows = 0;
    if (sqliteDb) {
      try {
        const cntRow = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_teachers WHERE tenant_id = ?').get(tid);
        totalTenantRows = Number(cntRow?.cnt || 0);
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_teachers WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
        list = rows.map((r) => mapTeacherRow(r, tid, nameMaps));
      } catch {}
    }
    if (totalTenantRows === 0 && list.length === 0 && tid === ROOT_TENANT_ID) {
      const rawTeachers = getCollectionDocs ? await getCollectionDocs('school_teachers', defaultTeachersSeed) : defaultTeachersSeed;
      list = rawTeachers
        .map((t) => {
          const branchId = t.branchId || t.branch_id || DEFAULT_BRANCH_ID;
          const wingId = t.wingId || t.wing_id || DEFAULT_WING_ID;
          return { ...t, branchId, branchName: nameMaps.branchName(branchId), wingId, wingName: nameMaps.wingName(wingId) };
        })
        .filter((t) => (!scope.branchFilter || t.branchId === scope.branchFilter) && (!scope.wingFilter || t.wingId === scope.wingFilter));
    }
    res.json({ ok: true, tenantId: tid, teachers: list });
  });

  router.post('/teachers', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
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
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;

    const teacher = {
      id: t.id || ('t-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      branchId,
      branchName: nameMaps.branchName(branchId),
      wingId,
      wingName: nameMaps.wingName(wingId),
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
          id, tenant_id, branch_id, wing_id, emp_code, name, father_name, designation, department, subject, qualification, classes,
          incharge_class, gender, dob, blood_group, cnic, passport_no, nationality, phone, emergency_contact, email, address,
          salary, basic_salary, salary_status, last_salary_month, status, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        teacher.id, tid, teacher.branchId, teacher.wingId, teacher.empCode, enc(tid, teacher.name), enc(tid, teacher.fatherName),
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    const u = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Teacher not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

    sqliteDb.prepare(`
      UPDATE local_school_teachers SET
        branch_id = COALESCE(?, branch_id),
        wing_id = COALESCE(?, wing_id),
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
      normalizeScopeVal(u.branchId ?? u.branch_id) || null,
      normalizeScopeVal(u.wingId ?? u.wing_id) || null,
      u.name ? enc(tid, u.name) : null, u.designation ?? null, u.department ?? null,
      u.subject ?? null, u.qualification ?? null, u.classes ?? null, u.inchargeClass ?? null,
      u.phone ? enc(tid, u.phone) : null, u.email ? enc(tid, u.email) : null,
      u.salary ? enc(tid, String(u.salary)) : null,
      u.basicSalary !== undefined ? Number(u.basicSalary) : null,
      u.salaryStatus ?? null, u.lastSalaryMonth ?? null, u.status ?? null, id, tid
    );
    const updated = sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(id, tid);
    res.json({ ok: true, teacher: mapTeacherRow(updated, tid, getBranchWingNameMaps(tid)) });
  });

  router.delete('/teachers/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Teacher not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare('DELETE FROM local_school_teachers WHERE id = ? AND tenant_id = ?').run(req.params.id, tid);
    res.json({ ok: true, id: req.params.id });
  });

  router.post('/teachers/salary/disburse', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const { teacherId, month, amount } = req.body || {};
    const targetMonth = String(month || 'March 2026');
    if (sqliteDb) {
      const row = sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(teacherId, tid);
      if (row) {
        const scopeErr = assertRecordScopeAllowed(scope, row);
        if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
        sqliteDb.prepare(`
          UPDATE local_school_teachers
          SET salary_status = 'Paid', last_salary_month = ?, is_synced = 0
          WHERE id = ? AND tenant_id = ?
        `).run(targetMonth, teacherId, tid);
        const updated = mapTeacherRow(sqliteDb.prepare('SELECT * FROM local_school_teachers WHERE id = ? AND tenant_id = ?').get(teacherId, tid), tid, getBranchWingNameMaps(tid));
        updated.lastSalaryDisbursed = new Date().toISOString().split('T')[0];
        updated.lastDisbursedAmount = amount || updated.salary;
        recordAudit(tid, {
          branchId: updated.branchId,
          wingId: updated.wingId,
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

  const mapStaffRow = (r, tid, nameMaps = null) => {
    const branchId = r.branch_id || DEFAULT_BRANCH_ID;
    const wingId = r.wing_id || DEFAULT_WING_ID;
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : undefined,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : undefined,
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
      fingerprintEnrolled: r.fingerprint_enrolled === 1,
      liteEnabled: r.lite_enabled !== 0
    };
  };

  router.get('/staff', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    let staff = [];
    let totalTenantRows = 0;
    if (sqliteDb) {
      try {
        const cntRow = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_staff WHERE tenant_id = ?').get(tid);
        totalTenantRows = Number(cntRow?.cnt || 0);
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_staff WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
        staff = rows.map((r) => mapStaffRow(r, tid, nameMaps));
      } catch {}
    }
    if (totalTenantRows === 0 && staff.length === 0 && tid === ROOT_TENANT_ID) {
      staff = SCHOOL_STAFF
        .map((s) => {
          const branchId = s.branchId || DEFAULT_BRANCH_ID;
          const wingId = s.wingId || DEFAULT_WING_ID;
          return { ...s, tenantId: tid, branchId, branchName: nameMaps.branchName(branchId), wingId, wingName: nameMaps.wingName(wingId) };
        })
        .filter((s) => (!scope.branchFilter || s.branchId === scope.branchFilter) && (!scope.wingFilter || s.wingId === scope.wingFilter));
    }
    res.json({ ok: true, tenantId: tid, staff });
  });

  router.post('/staff', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const roleTitle = String(b.roleTitle || b.designation || '').trim();
    if (!name || !roleTitle) {
      return res.status(400).json({ ok: false, message: 'Staff name and roleTitle are required.' });
    }
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;
    const staffItem = {
      id: b.id || ('STF-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      branchId,
      branchName: nameMaps.branchName(branchId),
      wingId,
      wingName: nameMaps.wingName(wingId),
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
      fingerprintEnrolled: Boolean(b.fingerprintEnrolled),
      liteEnabled: b.liteEnabled !== false
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_staff
        (id, tenant_id, branch_id, wing_id, emp_code, name, father_name, cnic, passport_no, nationality, gender, dob, blood_group, role_title, department, phone, emergency_contact, address, shift, status, attendance_status, face_enrolled, fingerprint_enrolled, lite_enabled, is_synced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        staffItem.id, tid, staffItem.branchId, staffItem.wingId, staffItem.empCode, enc(tid, staffItem.name), enc(tid, staffItem.fatherName),
        enc(tid, staffItem.cnic), enc(tid, staffItem.passportNo), staffItem.nationality, staffItem.gender,
        staffItem.dob, staffItem.bloodGroup, staffItem.roleTitle, staffItem.department,
        enc(tid, staffItem.phone), enc(tid, staffItem.emergencyContact), enc(tid, staffItem.address),
        staffItem.shift, staffItem.status, staffItem.attendanceStatus,
        staffItem.faceEnrolled ? 1 : 0, staffItem.fingerprintEnrolled ? 1 : 0, staffItem.liteEnabled ? 1 : 0, new Date().toISOString()
      );
    }
    if (db) {
      setDoc(doc(db, 'school_staff', staffItem.id), { ...staffItem, tenant_id: tid, synced_at: new Date().toISOString() }, { merge: true }).catch(() => {});
    }
    res.status(201).json({ ok: true, staff: staffItem });
  });

  router.put('/staff/:id', rejectRestrictedRole(['student', 'parent']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    const b = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_staff WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Staff record not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare(`
      UPDATE local_school_staff SET
        branch_id = COALESCE(?, branch_id),
        wing_id = COALESCE(?, wing_id),
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
      normalizeScopeVal(b.branchId ?? b.branch_id) || null,
      normalizeScopeVal(b.wingId ?? b.wing_id) || null,
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
    res.json({ ok: true, staff: mapStaffRow(updated, tid, getBranchWingNameMaps(tid)) });
  });

  router.delete('/staff/:id', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_staff WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Staff record not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare('DELETE FROM local_school_staff WHERE id = ? AND tenant_id = ?').run(id, tid);
    try { sqliteDb.prepare('DELETE FROM encrypted_domain_records WHERE tenant_id = ? AND domain_key = ? AND id LIKE ?').run(tid, 'school_business', `%:${id}`); } catch {}
    res.json({ ok: true, id });
  });

  const mapPrincipalRow = (r, tid, nameMaps = null) => {
    const branchId = r.branch_id || DEFAULT_BRANCH_ID;
    const wingId = r.wing_id || DEFAULT_WING_ID;
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : undefined,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : undefined,
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
      fingerprintEnrolled: r.fingerprint_enrolled === 1,
      liteEnabled: r.lite_enabled !== 0
    };
  };

  router.get('/principals', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    let principals = [];
    let totalTenantRows = 0;
    if (sqliteDb) {
      try {
        const cntRow = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_principals WHERE tenant_id = ?').get(tid);
        totalTenantRows = Number(cntRow?.cnt || 0);
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_principals WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
        principals = rows.map((r) => mapPrincipalRow(r, tid, nameMaps));
      } catch {}
    }
    if (totalTenantRows === 0 && principals.length === 0 && tid === ROOT_TENANT_ID) {
      principals = SCHOOL_PRINCIPALS
        .map((p) => {
          const branchId = p.branchId || DEFAULT_BRANCH_ID;
          const wingId = p.wingId || DEFAULT_WING_ID;
          return { ...p, tenantId: tid, branchId, branchName: nameMaps.branchName(branchId), wingId, wingName: nameMaps.wingName(wingId) };
        })
        .filter((p) => (!scope.branchFilter || p.branchId === scope.branchFilter) && (!scope.wingFilter || p.wingId === scope.wingFilter));
    }
    res.json({ ok: true, tenantId: tid, principals });
  });

  router.post('/principals', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const roleTitle = String(b.roleTitle || b.designation || 'Principal & Academic Director').trim();
    if (!name || !roleTitle) {
      return res.status(400).json({ ok: false, message: 'Principal name and roleTitle are required.' });
    }
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;
    const principalItem = {
      id: b.id || ('PRI-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      branchId,
      branchName: nameMaps.branchName(branchId),
      wingId,
      wingName: nameMaps.wingName(wingId),
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
      fingerprintEnrolled: Boolean(b.fingerprintEnrolled),
      liteEnabled: b.liteEnabled !== false
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_principals
        (id, tenant_id, branch_id, wing_id, emp_code, name, father_name, cnic, passport_no, nationality, gender, dob, blood_group, role_title, department, phone, emergency_contact, email, address, shift, status, attendance_status, face_enrolled, fingerprint_enrolled, lite_enabled, is_synced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        principalItem.id, tid, principalItem.branchId, principalItem.wingId, principalItem.empCode, enc(tid, principalItem.name), enc(tid, principalItem.fatherName),
        enc(tid, principalItem.cnic), enc(tid, principalItem.passportNo), principalItem.nationality, principalItem.gender,
        principalItem.dob, principalItem.bloodGroup, principalItem.roleTitle, principalItem.department,
        enc(tid, principalItem.phone), enc(tid, principalItem.emergencyContact), enc(tid, principalItem.email),
        enc(tid, principalItem.address), principalItem.shift, principalItem.status, principalItem.attendanceStatus,
        principalItem.faceEnrolled ? 1 : 0, principalItem.fingerprintEnrolled ? 1 : 0, principalItem.liteEnabled ? 1 : 0, new Date().toISOString()
      );
      recordAudit(tid, {
        branchId: principalItem.branchId,
        wingId: principalItem.wingId,
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
        branchId: principalItem.branchId,
        wingId: principalItem.wingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    const b = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_principals WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Principal record not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare(`
      UPDATE local_school_principals SET
        branch_id = COALESCE(?, branch_id),
        wing_id = COALESCE(?, wing_id),
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
      normalizeScopeVal(b.branchId ?? b.branch_id) || null,
      normalizeScopeVal(b.wingId ?? b.wing_id) || null,
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
    res.json({ ok: true, principal: mapPrincipalRow(updated, tid, getBranchWingNameMaps(tid)) });
  });

  router.delete('/principals/:id', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant', 'principal']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_principals WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Principal record not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const category = String(req.query?.category || '').trim().toLowerCase();
    let profiles = [];
    if (sqliteDb) {
      try {
        const scopeSql = buildScopeSql(scope);
        const rows = category
          ? sqliteDb.prepare(`SELECT * FROM local_school_face_profiles WHERE tenant_id = ? AND member_category = ?${scopeSql.sql} ORDER BY updated_at DESC`).all(tid, category, ...scopeSql.params)
          : sqliteDb.prepare(`SELECT * FROM local_school_face_profiles WHERE tenant_id = ?${scopeSql.sql} ORDER BY updated_at DESC`).all(tid, ...scopeSql.params);
        profiles = rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || tid,
          branchId: r.branch_id || DEFAULT_BRANCH_ID,
          wingId: r.wing_id || DEFAULT_WING_ID,
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
            branchId: p.branchId || p.branch_id || DEFAULT_BRANCH_ID,
            wingId: p.wingId || p.wing_id || DEFAULT_WING_ID,
            memberName: dec(p.tenant_id || tid, p.memberName || ''),
            isSynced: true
          }))
          .filter((p) => (!scope.branchFilter || p.branchId === scope.branchFilter) && (!scope.wingFilter || p.wingId === scope.wingFilter));
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
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
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
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
        (id, tenant_id, branch_id, wing_id, member_id, member_category, member_name, member_code, grade_or_dept, face_descriptor_json, face_photo_data, face_hash, quality_score, lite_enabled, enrolled_by, enrolled_at, is_synced, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        profile.id, tid, profile.branchId, profile.wingId, profile.memberId, profile.memberCategory, enc(tid, profile.memberName),
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
        branchId: profile.branchId,
        wingId: profile.wingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const role = resolveUserRole(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id, branch_id, wing_id, member_id, member_category FROM local_school_face_profiles WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Face profile not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
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

  // -------------------------------------------------------------------------
  // BIOMETRIC FINGERPRINT PROFILES (Students, Teachers, Staff, Principal)
  // -------------------------------------------------------------------------
  router.get('/attendance/fingerprint-profiles', async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const category = String(req.query?.category || '').trim().toLowerCase();
    let profiles = [];
    if (sqliteDb) {
      try {
        const scopeSql = buildScopeSql(scope);
        const rows = category
          ? sqliteDb.prepare(`SELECT * FROM local_school_fingerprint_profiles WHERE tenant_id = ? AND member_category = ?${scopeSql.sql} ORDER BY updated_at DESC`).all(tid, category, ...scopeSql.params)
          : sqliteDb.prepare(`SELECT * FROM local_school_fingerprint_profiles WHERE tenant_id = ?${scopeSql.sql} ORDER BY updated_at DESC`).all(tid, ...scopeSql.params);
        profiles = rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || tid,
          branchId: r.branch_id || DEFAULT_BRANCH_ID,
          wingId: r.wing_id || DEFAULT_WING_ID,
          memberId: r.member_id,
          memberCategory: r.member_category,
          memberName: dec(r.tenant_id || tid, r.member_name),
          memberCode: r.member_code || '',
          gradeOrDept: r.grade_or_dept || '',
          fingerLabel: r.finger_label || 'Right Index',
          scannerType: r.scanner_type || 'device_webauthn',
          credentialId: r.credential_id || '',
          publicKeySpki: r.public_key_spki || '',
          fingerprintDescriptor: (() => { try { return JSON.parse(r.fingerprint_descriptor_json || '[]'); } catch { return []; } })(),
          fingerprintPreviewData: r.fingerprint_preview_data || '',
          fingerprintHash: r.fingerprint_hash,
          qualityScore: Number(r.quality_score ?? 95),
          liteEnabled: r.lite_enabled !== 0,
          enrolledBy: r.enrolled_by || 'owner',
          enrolledAt: r.enrolled_at,
          isSynced: r.is_synced === 1
        }));
      } catch {}
    }
    if (profiles.length === 0 && getCollectionDocs) {
      try {
        const cloudProfiles = await getCollectionDocs('school_fingerprint_profiles', []);
        profiles = (cloudProfiles || [])
          .filter((p) => (!p.tenant_id || p.tenant_id === tid) && (!category || p.memberCategory === category))
          .map((p) => ({
            ...p,
            branchId: p.branchId || p.branch_id || DEFAULT_BRANCH_ID,
            wingId: p.wingId || p.wing_id || DEFAULT_WING_ID,
            memberName: dec(p.tenant_id || tid, p.memberName || ''),
            isSynced: true
          }))
          .filter((p) => (!scope.branchFilter || p.branchId === scope.branchFilter) && (!scope.wingFilter || p.wingId === scope.wingFilter));
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

  router.post('/attendance/fingerprint-profiles', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const role = resolveUserRole(req);
    const b = req.body || {};
    const memberId = String(b.memberId || '').trim();
    const memberCategory = String(b.memberCategory || 'student').trim().toLowerCase();
    const memberName = String(b.memberName || '').trim();
    const credentialId = String(b.credentialId || '').trim();
    const descriptor = Array.isArray(b.fingerprintDescriptor) ? b.fingerprintDescriptor.map(Number) : [];
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
    if (!memberId || !memberName || (!credentialId && descriptor.length < 8)) {
      return res.status(400).json({
        ok: false,
        message: 'memberId, memberName, and valid biometric credentialId or fingerprintDescriptor are required.'
      });
    }
    const id = b.id || `BFP-${memberCategory}-${memberId}`;
    const enrolledAt = String(b.enrolledAt || new Date().toISOString());
    const scannerType = String(b.scannerType || (credentialId ? 'device_webauthn' : 'usb_optical_template'));
    const profile = {
      id,
      tenantId: tid,
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
      memberId,
      memberCategory,
      memberName,
      memberCode: String(b.memberCode || memberId),
      gradeOrDept: String(b.gradeOrDept || ''),
      fingerLabel: String(b.fingerLabel || 'Right Index'),
      scannerType,
      credentialId,
      publicKeySpki: String(b.publicKeySpki || ''),
      fingerprintDescriptor: descriptor,
      fingerprintPreviewData: String(b.fingerprintPreviewData || ''),
      fingerprintHash: String(b.fingerprintHash || `BIO-FP-${memberId}`),
      qualityScore: Number(b.qualityScore ?? 95),
      liteEnabled: b.liteEnabled !== false,
      enrolledBy: String(b.enrolledBy || resolveUserRole(req) || 'kiosk'),
      enrolledAt,
      isSynced: false
    };

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_fingerprint_profiles
        (id, tenant_id, branch_id, wing_id, member_id, member_category, member_name, member_code, grade_or_dept, finger_label, scanner_type, credential_id, public_key_spki, fingerprint_descriptor_json, fingerprint_preview_data, fingerprint_hash, quality_score, lite_enabled, enrolled_by, enrolled_at, is_synced, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        profile.id, tid, profile.branchId, profile.wingId, profile.memberId, profile.memberCategory, enc(tid, profile.memberName),
        profile.memberCode, profile.gradeOrDept, profile.fingerLabel, profile.scannerType,
        profile.credentialId, profile.publicKeySpki, JSON.stringify(profile.fingerprintDescriptor),
        profile.fingerprintPreviewData, profile.fingerprintHash, profile.qualityScore,
        profile.liteEnabled ? 1 : 0, profile.enrolledBy, profile.enrolledAt, new Date().toISOString()
      );
      if (memberCategory === 'staff') {
        try {
          sqliteDb.prepare('UPDATE local_school_staff SET fingerprint_enrolled = 1 WHERE id = ? AND tenant_id = ?').run(memberId, tid);
        } catch {}
      } else if (memberCategory === 'principal') {
        try {
          sqliteDb.prepare('UPDATE local_school_principals SET fingerprint_enrolled = 1, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(memberId, tid);
        } catch {}
      }
    }
    if (db) {
      setDoc(doc(db, 'school_fingerprint_profiles', id), {
        id: profile.id,
        tenant_id: tid,
        branchId: profile.branchId,
        wingId: profile.wingId,
        memberId: profile.memberId,
        memberCategory: profile.memberCategory,
        memberName: enc(tid, profile.memberName),
        memberCode: profile.memberCode,
        gradeOrDept: profile.gradeOrDept,
        fingerLabel: profile.fingerLabel,
        scannerType: profile.scannerType,
        credentialId: profile.credentialId,
        publicKeySpki: profile.publicKeySpki,
        fingerprintDescriptor: profile.fingerprintDescriptor,
        fingerprintPreviewData: profile.fingerprintPreviewData,
        fingerprintHash: profile.fingerprintHash,
        qualityScore: profile.qualityScore,
        liteEnabled: profile.liteEnabled,
        enrolledBy: profile.enrolledBy,
        enrolledAt: profile.enrolledAt,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }, { merge: true }).then(() => {
        try {
          if (sqliteDb) {
            sqliteDb.prepare('UPDATE local_school_fingerprint_profiles SET is_synced = 1 WHERE id = ? AND tenant_id = ?').run(id, tid);
          }
        } catch {}
      }).catch(() => {});
    }
    res.status(201).json({ ok: true, profile });
  });

  router.delete('/attendance/fingerprint-profiles/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const role = resolveUserRole(req);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT id, branch_id, wing_id, member_id, member_category FROM local_school_fingerprint_profiles WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Fingerprint profile not found for this tenant' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    const policy = loadTenantAttendancePolicy(tid);
    const permCheck = canRolePerformAttendanceAction(policy, role, String(row.member_category || 'student').toLowerCase(), 'enroll');
    if (!permCheck.allowed) {
      return res.status(403).json({
        ok: false,
        error: 'ROLE_FORBIDDEN',
        message: permCheck.message
      });
    }
    sqliteDb.prepare('DELETE FROM local_school_fingerprint_profiles WHERE id = ? AND tenant_id = ?').run(id, tid);
    if (row.member_category === 'staff') {
      try { sqliteDb.prepare('UPDATE local_school_staff SET fingerprint_enrolled = 0 WHERE id = ? AND tenant_id = ?').run(row.member_id, tid); } catch {}
    } else if (row.member_category === 'principal') {
      try { sqliteDb.prepare('UPDATE local_school_principals SET fingerprint_enrolled = 0, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(row.member_id, tid); } catch {}
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const categoryFilter = String(req.query?.category || '').trim().toLowerCase();
    const policy = loadTenantAttendancePolicy(tid);
    let list = [];
    if (sqliteDb) {
      try {
        const scopeSql = buildScopeSql(scope);
        const rows = categoryFilter
          ? sqliteDb.prepare(`SELECT * FROM local_school_attendance WHERE tenant_id = ? AND member_category = ?${scopeSql.sql} ORDER BY created_at DESC LIMIT 300`).all(tid, categoryFilter, ...scopeSql.params)
          : sqliteDb.prepare(`SELECT * FROM local_school_attendance WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC LIMIT 300`).all(tid, ...scopeSql.params);
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
            branchId: r.branch_id || DEFAULT_BRANCH_ID,
            wingId: r.wing_id || DEFAULT_WING_ID,
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
            branchId: r.branchId || r.branch_id || DEFAULT_BRANCH_ID,
            wingId: r.wingId || r.wing_id || DEFAULT_WING_ID,
            studentName: dec(r.tenant_id || tid, r.studentName || ''),
            memberCategory: r.memberCategory || 'student',
            isSynced: true
          }))
          .filter((r) => (!scope.branchFilter || r.branchId === scope.branchFilter) && (!scope.wingFilter || r.wingId === scope.wingFilter));
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const role = resolveUserRole(req);
    const body = req.body || {};
    const memberCategory = String(body.memberCategory || 'student').trim().toLowerCase();
    if (!['student', 'teacher', 'staff', 'principal'].includes(memberCategory)) {
      return res.status(400).json({ ok: false, message: 'memberCategory must be student, teacher, staff, or principal.' });
    }
    const mode = String(body.verificationMode || body.verification_mode || 'face_camera');
    const isFingerprintScan = mode.startsWith('fingerprint') || mode.startsWith('biometric_finger');
    const isBarcodeScan = mode.startsWith('barcode') || mode.startsWith('rfid');
    const isBiometricScan =
      mode.startsWith('face_camera') ||
      mode.startsWith('face_kiosk') ||
      isFingerprintScan ||
      mode.startsWith('biometric');
    const isHardwareScan = isBiometricScan || isBarcodeScan;
    const policy = loadTenantAttendancePolicy(tid);
    const permCheck = canRolePerformAttendanceAction(policy, role, memberCategory, isHardwareScan ? 'camera' : 'manual');
    if (!permCheck.allowed) {
      return res.status(403).json({
        ok: false,
        error: 'ROLE_FORBIDDEN',
        message: permCheck.message
      });
    }
    if (isFingerprintScan && policy.allowFingerprintAttendance === false) {
      return res.status(403).json({
        ok: false,
        error: 'FINGERPRINT_DISABLED',
        message: 'Fingerprint biometric attendance is currently disabled by School Owner policy.'
      });
    }

    const recId = body.id || ('att-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90));
    const studentId = String(body.studentId || body.memberId || body.student_id || 'STD-GEN');
    const rollNo = String(body.rollNo || body.memberCode || body.roll_no || 'SCH-GEN');
    const studentName = String(body.studentName || body.memberName || body.student_name || '').trim();
    if (!studentName) {
      return res.status(400).json({ ok: false, message: 'studentName is required to log attendance.' });
    }
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;
    const grade = String(body.grade || body.gradeOrDept || 'Grade 10');
    const status = String(body.status || 'PRESENT').toUpperCase();
    const date = String(body.date || new Date().toISOString().split('T')[0]);
    const punchType = String(body.punchType || 'IN').toUpperCase() === 'OUT' ? 'OUT' : 'IN';
    const gateName = String(
      body.gateName || (isFingerprintScan ? `Biometric Fingerprint Terminal · ${punchType}` : (isBarcodeScan ? `Barcode Gate Scanner · ${punchType}` : `Camera Face Terminal · ${punchType}`))
    );
    const confidenceScore = Number(body.confidenceScore ?? (isBarcodeScan ? 100 : 0));
    const verifiedBy = String(
      body.verifiedBy || (isFingerprintScan ? 'Biometric Fingerprint Verification' : (isBarcodeScan ? `Barcode ID Card Scanner · ${punchType}` : 'Camera Face Verification'))
    );
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
        (id, tenant_id, branch_id, wing_id, student_id, roll_no, student_name, grade, member_category, status, date, check_in_time, scheduled_start_time, late_minutes, late_by_label, punch_type, gate_name, verification_mode, confidence_score, verified_by, marked_by_role, remarks, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        recId, tid, branchId, wingId, studentId, rollNo, enc(tid, studentName), grade, memberCategory, status, date,
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
      branchId,
      wingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const date = String(req.body?.date || new Date().toISOString().split('T')[0]);
    const gradeFilter = String(req.body?.grade || '').trim();
    const category = String(req.body?.memberCategory || 'student').trim().toLowerCase();
    let marked = 0;
    if (sqliteDb) {
      const scopeSql = buildScopeSql(scope);
      const rows = sqliteDb.prepare(`SELECT * FROM local_school_students WHERE tenant_id = ?${scopeSql.sql}`).all(tid, ...scopeSql.params);
      const insertStmt = sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_attendance
        (id, tenant_id, branch_id, wing_id, student_id, roll_no, student_name, grade, member_category, status, date, gate_name, verification_mode, confidence_score, verified_by, marked_by_role, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PRESENT', ?, 'Bulk Roster Sync', 'manual_bulk', 100, 'Owner Bulk Policy', ?, 0)
      `);
      const actorRole = resolveUserRole(req) || 'owner';
      for (const r of rows) {
        if (String(r.status || '').includes('ALUMNI')) continue;
        if (gradeFilter && r.grade !== gradeFilter) continue;
        insertStmt.run(`att-${tid}-${r.id}-${date}`, tid, r.branch_id || scope.writeBranchId, r.wing_id || scope.writeWingId, r.id, r.roll_no, r.full_name, r.grade, category, date, actorRole);
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    let list = [];
    if (sqliteDb) {
      try {
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_exams WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
        list = rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || tid,
          branchId: r.branch_id || DEFAULT_BRANCH_ID,
          wingId: r.wing_id || DEFAULT_WING_ID,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
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
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_exams (id, tenant_id, branch_id, wing_id, exam_code, title, grade, subject, total_marks, passing_marks, exam_date, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(examId, tid, branchId, wingId, examCode, title, grade, subject, totalMarks, passingMarks, examDate);
    }

    res.status(201).json({
      ok: true,
      message: `Exam schedule ${title} created for ${grade}`,
      exam: { id: examId, tenantId: tid, branchId, wingId, examCode, title, grade, subject, totalMarks, passingMarks, examDate }
    });
  });

  router.get('/results', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    let list = [];
    if (sqliteDb) {
      try {
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_results WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
        list = rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || tid,
          branchId: r.branch_id || DEFAULT_BRANCH_ID,
          wingId: r.wing_id || DEFAULT_WING_ID,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
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
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_results
        (id, tenant_id, branch_id, wing_id, exam_id, student_id, roll_no, student_name, grade, subject, marks_obtained, total_marks, percentage, grade_letter, remarks, is_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(resId, tid, branchId, wingId, examId, studentId, rollNo, enc(tid, studentName), grade, subject, marksObtained, totalMarks, percentage, gradeLetter, remarks);
    }

    res.status(201).json({
      ok: true,
      message: `Result & Report Card generated for ${studentName} (${rollNo}): ${gradeLetter} (${percentage}%)`,
      result: { id: resId, tenantId: tid, branchId, wingId, examId, studentId, rollNo, studentName, grade, subject, marksObtained, totalMarks, percentage, gradeLetter, remarks }
    });
  });

  const ALLOWED_ATTACHMENT_MIME = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);
  const MAX_ATTACHMENT_DATA_CHARS = 4800000; // ~3.5MB file after base64 overhead

  const sanitizeSafeExternalUrl = (raw) => {
    const val = String(raw || '').trim();
    if (!val) return '';
    try {
      const parsed = new URL(val);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
    } catch {}
    return null;
  };

  const sanitizeAttachment = (input = {}) => {
    const name = String(input.attachmentName || '').trim().replace(/[\r\n<>:"/\\|?*]/g, '_').slice(0, 140);
    const type = String(input.attachmentType || '').trim().toLowerCase();
    const data = String(input.attachmentData || '').trim();
    if (!data && !name) {
      return { ok: true, attachmentName: '', attachmentType: '', attachmentData: '' };
    }
    if (data) {
      if (data.length > MAX_ATTACHMENT_DATA_CHARS) {
        return { ok: false, message: 'Attachment size exceeds 3.5 MB limit. Please upload a smaller file.' };
      }
      const match = /^data:([a-z0-9.+/-]+);base64,[A-Za-z0-9+/=]+$/i.exec(data);
      if (!match) {
        return { ok: false, message: 'Invalid attachment payload format.' };
      }
      const detectedMime = match[1].toLowerCase();
      if (!ALLOWED_ATTACHMENT_MIME.has(detectedMime)) {
        return { ok: false, message: `Unsupported attachment type (${detectedMime}). Allowed: PDF, PNG, JPG, WEBP, TXT, DOC/DOCX.` };
      }
      return { ok: true, attachmentName: name || 'attachment', attachmentType: detectedMime, attachmentData: data };
    }
    if (type && !ALLOWED_ATTACHMENT_MIME.has(type)) {
      return { ok: false, message: `Unsupported attachment type (${type}).` };
    }
    return { ok: true, attachmentName: name, attachmentType: type, attachmentData: '' };
  };

  // =========================================================================
  // HOMEWORK, SUBMISSIONS, STUDY MATERIALS, MESSAGES, LEAVES, CONCESSIONS
  // =========================================================================
  router.get('/homework', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_homework WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params)
      : [];
    const countMap = new Map();
    if (sqliteDb) {
      try {
        const subCounts = sqliteDb.prepare(`SELECT homework_id, COUNT(*) AS cnt FROM local_school_homework_submissions WHERE tenant_id = ?${scopeSql.sql} GROUP BY homework_id`).all(tid, ...scopeSql.params);
        for (const sc of subCounts) countMap.set(sc.homework_id, Number(sc.cnt || 0));
      } catch {}
    }
    res.json({
      ok: true,
      homework: rows.map((r) => ({
        id: r.id,
        branchId: r.branch_id || DEFAULT_BRANCH_ID,
        wingId: r.wing_id || DEFAULT_WING_ID,
        title: r.title,
        subject: r.subject,
        grade: r.grade,
        section: r.section || 'All Sections',
        chapterTopic: r.chapter_topic || '',
        assignedDate: r.assigned_date,
        dueDate: r.due_date,
        dueTime: r.due_time || '11:59 PM',
        submissionMode: r.submission_mode || 'Online Upload + Written',
        priority: r.priority || 'Normal',
        estimatedMinutes: Number(r.estimated_minutes ?? 30),
        externalLink: r.external_link || '',
        description: r.description,
        teacherName: r.teacher_name,
        teacherId: r.teacher_id || '',
        attachmentName: r.attachment_name || '',
        attachmentType: r.attachment_type || '',
        attachmentData: r.attachment_data || '',
        resourceKind: r.resource_kind || 'Homework',
        maxMarks: Number(r.max_marks ?? 10),
        status: r.status || 'Active',
        submissionsCount: Math.max(Number(r.submissions_count || 0), countMap.get(r.id) || 0),
        totalCount: Number(r.total_count || 30)
      }))
    });
  });

  router.post('/homework', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const h = req.body || {};
    if (!String(h.title || '').trim() || !String(h.subject || '').trim() || !String(h.description || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Homework title, subject, and description are required.' });
    }
    const att = sanitizeAttachment(h);
    if (!att.ok) return res.status(400).json({ ok: false, message: att.message });

    const safeLink = h.externalLink ? sanitizeSafeExternalUrl(h.externalLink) : '';
    if (safeLink === null) {
      return res.status(400).json({ ok: false, message: 'Reference link must start with https:// or http://' });
    }

    const maxMarks = Number(h.maxMarks ?? 10);
    if (!Number.isFinite(maxMarks) || maxMarks <= 0 || maxMarks > 1000) {
      return res.status(400).json({ ok: false, message: 'maxMarks must be between 1 and 1000.' });
    }

    const estMinsRaw = Number(h.estimatedMinutes ?? 30);
    const estimatedMinutes = Number.isFinite(estMinsRaw) && estMinsRaw >= 5 && estMinsRaw <= 600 ? Math.round(estMinsRaw) : 30;

    const item = {
      id: h.id || ('HW-' + Date.now()),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
      title: String(h.title).trim(),
      subject: String(h.subject).trim(),
      grade: String(h.grade || 'Class 10-A').trim(),
      section: String(h.section || 'All Sections').trim(),
      chapterTopic: String(h.chapterTopic || '').trim(),
      assignedDate: String(h.assignedDate || new Date().toISOString().split('T')[0]),
      dueDate: String(h.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]),
      dueTime: String(h.dueTime || '11:59 PM').trim(),
      submissionMode: String(h.submissionMode || 'Online Upload + Written').trim(),
      priority: String(h.priority || 'Normal').trim(),
      estimatedMinutes,
      externalLink: safeLink || '',
      description: String(h.description).trim(),
      teacherName: String(h.teacherName || 'Faculty'),
      teacherId: String(h.teacherId || ''),
      attachmentName: att.attachmentName,
      attachmentType: att.attachmentType,
      attachmentData: att.attachmentData,
      resourceKind: String(h.resourceKind || 'Homework'),
      maxMarks,
      status: String(h.status || 'Active'),
      submissionsCount: Number(h.submissionsCount || 0),
      totalCount: Number(h.totalCount || 30)
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_homework
        (id, tenant_id, branch_id, wing_id, title, subject, grade, section, chapter_topic, assigned_date, due_date, due_time, submission_mode, priority, estimated_minutes, external_link, description, teacher_name, teacher_id, attachment_name, attachment_type, attachment_data, resource_kind, max_marks, status, submissions_count, total_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.id, tid, item.branchId, item.wingId, item.title, item.subject, item.grade, item.section, item.chapterTopic,
        item.assignedDate, item.dueDate, item.dueTime, item.submissionMode, item.priority, item.estimatedMinutes, item.externalLink,
        item.description, item.teacherName, item.teacherId,
        item.attachmentName, item.attachmentType, item.attachmentData,
        item.resourceKind, item.maxMarks, item.status,
        item.submissionsCount, item.totalCount
      );
    }
    res.status(201).json({ ok: true, homework: item });
  });

  router.put('/homework/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT * FROM local_school_homework WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Homework not found' });
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

    const h = req.body || {};
    const att = (h.attachmentData !== undefined || h.attachmentName !== undefined)
      ? sanitizeAttachment(h)
      : { ok: true, attachmentName: existing.attachment_name || '', attachmentType: existing.attachment_type || '', attachmentData: existing.attachment_data || '' };
    if (!att.ok) return res.status(400).json({ ok: false, message: att.message });

    const safeLink = h.externalLink !== undefined
      ? (h.externalLink ? sanitizeSafeExternalUrl(h.externalLink) : '')
      : (existing.external_link || '');
    if (safeLink === null) {
      return res.status(400).json({ ok: false, message: 'Reference link must start with https:// or http://' });
    }

    const estMinsRaw = Number(h.estimatedMinutes ?? existing.estimated_minutes ?? 30);
    const estimatedMinutes = Number.isFinite(estMinsRaw) && estMinsRaw >= 5 && estMinsRaw <= 600 ? Math.round(estMinsRaw) : 30;
    const nextBranchId = normalizeScopeVal(h.branchId ?? h.branch_id) ? scope.writeBranchId : (existing.branch_id || DEFAULT_BRANCH_ID);
    const nextWingId = normalizeScopeVal(h.wingId ?? h.wing_id) ? scope.writeWingId : (existing.wing_id || DEFAULT_WING_ID);

    const next = {
      branchId: nextBranchId,
      wingId: nextWingId,
      title: String(h.title ?? existing.title).trim(),
      subject: String(h.subject ?? existing.subject).trim(),
      grade: String(h.grade ?? existing.grade).trim(),
      section: String(h.section ?? existing.section ?? 'All Sections').trim(),
      chapterTopic: String(h.chapterTopic ?? existing.chapter_topic ?? '').trim(),
      assignedDate: String(h.assignedDate ?? existing.assigned_date ?? '').trim(),
      dueDate: String(h.dueDate ?? existing.due_date).trim(),
      dueTime: String(h.dueTime ?? existing.due_time ?? '11:59 PM').trim(),
      submissionMode: String(h.submission_mode ?? h.submissionMode ?? existing.submission_mode ?? 'Online Upload + Written').trim(),
      priority: String(h.priority ?? existing.priority ?? 'Normal').trim(),
      estimatedMinutes,
      externalLink: safeLink || '',
      description: String(h.description ?? existing.description).trim(),
      teacherName: String(h.teacherName ?? existing.teacher_name ?? 'Faculty').trim(),
      resourceKind: String(h.resourceKind ?? existing.resource_kind ?? 'Homework'),
      maxMarks: Number(h.maxMarks ?? existing.max_marks ?? 10),
      status: String(h.status ?? existing.status ?? 'Active'),
      attachmentName: att.attachmentName,
      attachmentType: att.attachmentType,
      attachmentData: att.attachmentData
    };

    sqliteDb.prepare(`
      UPDATE local_school_homework
      SET branch_id = ?, wing_id = ?, title = ?, subject = ?, grade = ?, section = ?, chapter_topic = ?, assigned_date = ?, due_date = ?, due_time = ?, submission_mode = ?, priority = ?, estimated_minutes = ?, external_link = ?, description = ?, teacher_name = ?, resource_kind = ?, max_marks = ?, status = ?, attachment_name = ?, attachment_type = ?, attachment_data = ?
      WHERE id = ? AND tenant_id = ?
    `).run(
      next.branchId, next.wingId, next.title, next.subject, next.grade, next.section, next.chapterTopic,
      next.assignedDate, next.dueDate, next.dueTime, next.submissionMode, next.priority, next.estimatedMinutes, next.externalLink,
      next.description, next.teacherName,
      next.resourceKind, next.maxMarks, next.status,
      next.attachmentName, next.attachmentType, next.attachmentData,
      req.params.id, tid
    );
    res.json({ ok: true, id: req.params.id, homework: { id: req.params.id, ...next } });
  });

  router.delete('/homework/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_homework WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (existing) {
      const scopeErr = assertRecordScopeAllowed(scope, existing);
      if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    }
    sqliteDb.prepare('DELETE FROM local_school_homework_submissions WHERE homework_id = ? AND tenant_id = ?').run(req.params.id, tid);
    sqliteDb.prepare('DELETE FROM local_school_homework WHERE id = ? AND tenant_id = ?').run(req.params.id, tid);
    res.json({ ok: true, id: req.params.id });
  });

  // Two-Way Homework Submissions (Student Submit + Teacher Review/Grading)
  const mapSubmissionRow = (r, tid) => ({
    id: r.id,
    branchId: r.branch_id || DEFAULT_BRANCH_ID,
    wingId: r.wing_id || DEFAULT_WING_ID,
    homeworkId: r.homework_id,
    studentId: r.student_id,
    rollNo: r.roll_no || '',
    studentName: dec(tid, r.student_name),
    grade: r.grade || '',
    answerText: r.answer_text || '',
    attachmentName: r.attachment_name || '',
    attachmentType: r.attachment_type || '',
    attachmentData: r.attachment_data || '',
    externalLink: r.external_link || '',
    status: r.status || 'Submitted',
    marksObtained: r.marks_obtained !== null && r.marks_obtained !== undefined ? Number(r.marks_obtained) : null,
    maxMarks: Number(r.max_marks ?? 10),
    teacherRemarks: r.teacher_remarks || '',
    reviewedBy: r.reviewed_by || '',
    reviewedAt: r.reviewed_at || '',
    submittedAt: r.submitted_at || ''
  });

  router.get('/homework-submissions', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.json({ ok: true, submissions: [] });
    const scopeSql = buildScopeSql(scope);
    const hwId = String(req.query?.homeworkId || '').trim();
    const stuId = String(req.query?.studentId || '').trim();
    let rows = [];
    if (hwId) {
      rows = sqliteDb.prepare(`SELECT * FROM local_school_homework_submissions WHERE tenant_id = ? AND homework_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, hwId, ...scopeSql.params);
    } else if (stuId) {
      rows = sqliteDb.prepare(`SELECT * FROM local_school_homework_submissions WHERE tenant_id = ? AND student_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, stuId, ...scopeSql.params);
    } else {
      rows = sqliteDb.prepare(`SELECT * FROM local_school_homework_submissions WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
    }
    res.json({ ok: true, submissions: rows.map((r) => mapSubmissionRow(r, tid)) });
  });

  router.get('/homework/:id/submissions', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_homework_submissions WHERE tenant_id = ? AND homework_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, req.params.id, ...scopeSql.params)
      : [];
    res.json({ ok: true, submissions: rows.map((r) => mapSubmissionRow(r, tid)) });
  });

  router.post('/homework/:id/submit', rejectRestrictedRole(['accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const homeworkId = String(req.params.id || '').trim();
    const b = req.body || {};
    const studentId = String(b.studentId || '').trim();
    const studentName = String(b.studentName || '').trim();
    if (!homeworkId || !studentId || !studentName) {
      return res.status(400).json({ ok: false, message: 'homeworkId, studentId, and studentName are required.' });
    }
    if (!String(b.answerText || '').trim() && !String(b.attachmentData || '').trim() && !String(b.externalLink || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Please provide homework text answer, file attachment, or submission link.' });
    }
    const att = sanitizeAttachment(b);
    if (!att.ok) return res.status(400).json({ ok: false, message: att.message });

    const safeLink = b.externalLink ? sanitizeSafeExternalUrl(b.externalLink) : '';
    if (safeLink === null) {
      return res.status(400).json({ ok: false, message: 'External link must start with https:// or http://' });
    }

    const hwRow = sqliteDb ? sqliteDb.prepare('SELECT max_marks, branch_id, wing_id FROM local_school_homework WHERE id = ? AND tenant_id = ?').get(homeworkId, tid) : null;
    if (hwRow) {
      const scopeErr = assertRecordScopeAllowed(scope, hwRow);
      if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    }

    let existingSub = null;
    if (sqliteDb) {
      existingSub = sqliteDb.prepare(
        'SELECT id FROM local_school_homework_submissions WHERE tenant_id = ? AND homework_id = ? AND student_id = ?'
      ).get(tid, homeworkId, studentId);
    }

    const subId = existingSub?.id || b.id || ('HSUB-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90));
    const submittedAt = new Date().toISOString();
    const maxMarks = Number(b.maxMarks ?? hwRow?.max_marks ?? 10);
    const branchId = hwRow?.branch_id || scope.writeBranchId;
    const wingId = hwRow?.wing_id || scope.writeWingId;

    const submission = {
      id: subId,
      branchId,
      wingId,
      homeworkId,
      studentId,
      rollNo: String(b.rollNo || '').trim(),
      studentName,
      grade: String(b.grade || '').trim(),
      answerText: String(b.answerText || '').trim(),
      attachmentName: att.attachmentName,
      attachmentType: att.attachmentType,
      attachmentData: att.attachmentData,
      externalLink: safeLink || '',
      status: 'Submitted',
      marksObtained: null,
      maxMarks,
      teacherRemarks: '',
      reviewedBy: '',
      reviewedAt: '',
      submittedAt
    };

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_homework_submissions
        (id, tenant_id, branch_id, wing_id, homework_id, student_id, roll_no, student_name, grade, answer_text, attachment_name, attachment_type, attachment_data, external_link, status, marks_obtained, max_marks, teacher_remarks, reviewed_by, reviewed_at, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', NULL, ?, '', '', '', ?)
      `).run(
        submission.id, tid, branchId, wingId, homeworkId, studentId, submission.rollNo, enc(tid, studentName),
        submission.grade, submission.answerText, submission.attachmentName, submission.attachmentType,
        submission.attachmentData, submission.externalLink, maxMarks, submittedAt
      );
      const cntRow = sqliteDb.prepare(
        'SELECT COUNT(*) AS cnt FROM local_school_homework_submissions WHERE tenant_id = ? AND homework_id = ?'
      ).get(tid, homeworkId);
      sqliteDb.prepare('UPDATE local_school_homework SET submissions_count = ? WHERE id = ? AND tenant_id = ?')
        .run(Number(cntRow?.cnt || 1), homeworkId, tid);
    }

    res.status(201).json({ ok: true, submission });
  });

  router.put('/homework/submissions/:subId/review', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT * FROM local_school_homework_submissions WHERE id = ? AND tenant_id = ?').get(req.params.subId, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Submission record not found' });
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

    const b = req.body || {};
    const status = ['Checked', 'Approved', 'Needs Revision', 'Submitted'].includes(String(b.status))
      ? String(b.status)
      : 'Checked';
    const maxMarks = Number(b.maxMarks ?? existing.max_marks ?? 10);
    let marksObtained = null;
    if (b.marksObtained !== null && b.marksObtained !== undefined && b.marksObtained !== '') {
      const m = Number(b.marksObtained);
      if (!Number.isFinite(m) || m < 0 || m > maxMarks) {
        return res.status(400).json({ ok: false, message: `marksObtained must be between 0 and ${maxMarks}.` });
      }
      marksObtained = m;
    }
    const teacherRemarks = String(b.teacherRemarks || '').trim();
    const reviewedBy = String(b.reviewedBy || req.headers['x-user-name'] || 'Subject Faculty').trim();
    const reviewedAt = new Date().toISOString();

    sqliteDb.prepare(`
      UPDATE local_school_homework_submissions
      SET status = ?, marks_obtained = ?, teacher_remarks = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ? AND tenant_id = ?
    `).run(status, marksObtained, teacherRemarks, reviewedBy, reviewedAt, req.params.subId, tid);

    res.json({
      ok: true,
      submission: {
        ...mapSubmissionRow(existing, tid),
        status,
        marksObtained,
        teacherRemarks,
        reviewedBy,
        reviewedAt
      }
    });
  });

  // Teacher Uploaded Study Notes, Worksheets & Past Papers
  router.get('/study-materials', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_study_materials WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params)
      : [];
    res.json({
      ok: true,
      materials: rows.map((r) => ({
        id: r.id,
        branchId: r.branch_id || DEFAULT_BRANCH_ID,
        wingId: r.wing_id || DEFAULT_WING_ID,
        title: r.title,
        subject: r.subject,
        grade: r.grade,
        materialType: r.material_type || 'Class Notes',
        description: r.description || '',
        attachmentName: r.attachment_name || '',
        attachmentType: r.attachment_type || '',
        attachmentData: r.attachment_data || '',
        externalUrl: r.external_url || '',
        fileSize: r.file_size || '',
        uploadedBy: r.uploaded_by || 'Faculty',
        teacherId: r.teacher_id || '',
        downloadsCount: Number(r.downloads_count || 0),
        createdAt: r.created_at || ''
      }))
    });
  });

  router.post('/study-materials', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const m = req.body || {};
    if (!String(m.title || '').trim() || !String(m.subject || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Material title and subject are required.' });
    }
    const att = sanitizeAttachment(m);
    if (!att.ok) return res.status(400).json({ ok: false, message: att.message });
    const safeUrl = m.externalUrl ? sanitizeSafeExternalUrl(m.externalUrl) : '';
    if (safeUrl === null) {
      return res.status(400).json({ ok: false, message: 'Resource URL must start with https:// or http://' });
    }
    const item = {
      id: m.id || ('MAT-' + Date.now()),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
      title: String(m.title).trim(),
      subject: String(m.subject).trim(),
      grade: String(m.grade || 'Class 10-A').trim(),
      materialType: String(m.materialType || 'Class Notes'),
      description: String(m.description || '').trim(),
      attachmentName: att.attachmentName,
      attachmentType: att.attachmentType,
      attachmentData: att.attachmentData,
      externalUrl: safeUrl || '',
      fileSize: String(m.fileSize || (att.attachmentData ? `${Math.max(1, Math.round(att.attachmentData.length * 0.75 / 1024))} KB` : 'Link')),
      uploadedBy: String(m.uploadedBy || req.headers['x-user-name'] || 'Faculty'),
      teacherId: String(m.teacherId || ''),
      downloadsCount: Number(m.downloadsCount || 0),
      createdAt: new Date().toISOString().split('T')[0]
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_study_materials
        (id, tenant_id, branch_id, wing_id, title, subject, grade, material_type, description, attachment_name, attachment_type, attachment_data, external_url, file_size, uploaded_by, teacher_id, downloads_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.id, tid, item.branchId, item.wingId, item.title, item.subject, item.grade, item.materialType, item.description,
        item.attachmentName, item.attachmentType, item.attachmentData, item.externalUrl,
        item.fileSize, item.uploadedBy, item.teacherId, item.downloadsCount
      );
    }
    res.status(201).json({ ok: true, material: item });
  });

  router.put('/study-materials/:id/download', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.json({ ok: true });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_study_materials WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (existing) {
      const scopeErr = assertRecordScopeAllowed(scope, existing);
      if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    }
    sqliteDb.prepare('UPDATE local_school_study_materials SET downloads_count = COALESCE(downloads_count, 0) + 1 WHERE id = ? AND tenant_id = ?')
      .run(req.params.id, tid);
    res.json({ ok: true, id: req.params.id });
  });

  router.delete('/study-materials/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_study_materials WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (existing) {
      const scopeErr = assertRecordScopeAllowed(scope, existing);
      if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    }
    sqliteDb.prepare('DELETE FROM local_school_study_materials WHERE id = ? AND tenant_id = ?').run(req.params.id, tid);
    res.json({ ok: true, id: req.params.id });
  });

  // Two-Way Parent <-> Teacher Messaging
  router.get('/messages', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_messages WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params)
      : [];
    res.json({
      ok: true,
      messages: rows.map((r) => ({
        id: r.id,
        branchId: r.branch_id || DEFAULT_BRANCH_ID,
        wingId: r.wing_id || DEFAULT_WING_ID,
        sender: dec(tid, r.sender),
        senderRole: r.sender_role || 'parent',
        recipient: dec(tid, r.recipient),
        childId: r.child_id || '',
        studentName: dec(tid, r.student_name),
        subject: r.subject,
        message: dec(tid, r.message),
        date: r.date || '',
        reply: r.reply ? dec(tid, r.reply) : '',
        replyBy: r.reply_by || '',
        replyDate: r.reply_date || '',
        status: r.status || 'Open'
      }))
    });
  });

  router.post('/messages', rejectRestrictedRole(['accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const b = req.body || {};
    if (!String(b.subject || '').trim() || !String(b.message || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Message subject and body are required.' });
    }
    const item = {
      id: b.id || ('MSG-' + Date.now()),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
      sender: String(b.sender || 'Portal User').trim(),
      senderRole: String(b.senderRole || resolveUserRole(req) || 'parent'),
      recipient: String(b.recipient || 'Faculty').trim(),
      childId: String(b.childId || '').trim(),
      studentName: String(b.studentName || '').trim(),
      subject: String(b.subject).trim(),
      message: String(b.message).trim(),
      date: String(b.date || new Date().toISOString().split('T')[0]),
      reply: String(b.reply || '').trim(),
      replyBy: String(b.replyBy || '').trim(),
      replyDate: String(b.replyDate || '').trim(),
      status: String(b.reply ? 'Replied' : 'Open')
    };
    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO local_school_messages
        (id, tenant_id, branch_id, wing_id, sender, sender_role, recipient, child_id, student_name, subject, message, date, reply, reply_by, reply_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.id, tid, item.branchId, item.wingId, enc(tid, item.sender), item.senderRole, enc(tid, item.recipient),
        item.childId, enc(tid, item.studentName), item.subject, enc(tid, item.message),
        item.date, item.reply ? enc(tid, item.reply) : '', item.replyBy, item.replyDate, item.status
      );
    }
    res.status(201).json({ ok: true, message: item });
  });

  router.put('/messages/:id/reply', rejectRestrictedRole(['student', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_messages WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Message not found' });
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    const reply = String(req.body?.reply || '').trim();
    if (!reply) return res.status(400).json({ ok: false, message: 'Reply text is required.' });
    const replyBy = String(req.body?.replyBy || req.headers['x-user-name'] || 'Faculty').trim();
    const replyDate = new Date().toISOString().split('T')[0];
    sqliteDb.prepare(
      'UPDATE local_school_messages SET reply = ?, reply_by = ?, reply_date = ?, status = ? WHERE id = ? AND tenant_id = ?'
    ).run(enc(tid, reply), replyBy, replyDate, 'Replied', req.params.id, tid);
    res.json({ ok: true, id: req.params.id, reply, replyBy, replyDate, status: 'Replied' });
  });

  router.get('/leaves', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_leaves WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params)
      : [];
    res.json({
      ok: true,
      leaves: rows.map((r) => ({
        id: r.id,
        branchId: r.branch_id || DEFAULT_BRANCH_ID,
        wingId: r.wing_id || DEFAULT_WING_ID,
        childId: r.child_id, childName: dec(tid, r.child_name),
        fromDate: r.from_date, toDate: r.to_date, reason: dec(tid, r.reason),
        status: r.status, submittedDate: r.submitted_date, leaveType: r.leave_type
      }))
    });
  });

  router.post('/leaves', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const l = req.body || {};
    if (!String(l.fromDate || '').trim() || !String(l.toDate || '').trim() || !String(l.reason || '').trim()) {
      return res.status(400).json({ ok: false, message: 'fromDate, toDate, and reason are required for leave requests.' });
    }
    const item = {
      id: l.id || ('LV-' + Date.now()),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
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
        (id, tenant_id, branch_id, wing_id, child_id, child_name, from_date, to_date, reason, status, submitted_date, leave_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, item.branchId, item.wingId, item.childId, enc(tid, item.childName), item.fromDate, item.toDate, enc(tid, item.reason), item.status, item.submittedDate, item.leaveType);
    }
    res.status(201).json({ ok: true, leave: item });
  });

  router.put('/leaves/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_leaves WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Leave request not found' });
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare('UPDATE local_school_leaves SET status = ? WHERE id = ? AND tenant_id = ?').run(String(req.body?.status || 'Approved'), req.params.id, tid);
    res.json({ ok: true, id: req.params.id, status: req.body?.status || 'Approved' });
  });

  router.get('/concessions', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_concessions WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params)
      : [];
    res.json({
      ok: true,
      concessions: rows.map((r) => ({
        id: r.id,
        branchId: r.branch_id || DEFAULT_BRANCH_ID,
        wingId: r.wing_id || DEFAULT_WING_ID,
        studentId: r.student_id, studentName: dec(tid, r.student_name), rollNo: r.roll_no,
        grade: r.grade, guardianName: dec(tid, r.guardian_name), guardianOccupation: r.guardian_occupation,
        guardianIncome: r.guardian_income, regularFee: r.regular_fee, revisedFee: r.revised_fee,
        requestedDiscount: r.requested_discount, category: r.category, reason: r.reason,
        status: r.status, approvedBy: r.approved_by
      }))
    });
  });

  router.post('/concessions', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const c = req.body || {};
    if (!String(c.studentName || '').trim() || !String(c.grade || '').trim()) {
      return res.status(400).json({ ok: false, message: 'studentName and grade are required.' });
    }
    const item = {
      id: c.id || ('CON-' + Date.now()),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
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
        (id, tenant_id, branch_id, wing_id, student_id, student_name, roll_no, grade, guardian_name, guardian_occupation, guardian_income, regular_fee, revised_fee, requested_discount, category, reason, status, approved_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.id, tid, item.branchId, item.wingId, item.studentId, enc(tid, item.studentName), item.rollNo, item.grade,
        enc(tid, item.guardianName), item.guardianOccupation, item.guardianIncome,
        item.regularFee, item.revisedFee, item.requestedDiscount, item.category, item.reason, item.status, item.approvedBy
      );
    }
    res.status(201).json({ ok: true, concession: item });
  });

  router.put('/concessions/:id', rejectRestrictedRole(['student', 'parent', 'teacher', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_concessions WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Concession record not found' });
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    const status = String(req.body?.status || 'Approved');
    const approvedBy = String(req.body?.approvedBy || 'Principal Office');
    sqliteDb.prepare('UPDATE local_school_concessions SET status = ?, approved_by = ? WHERE id = ? AND tenant_id = ?').run(status, approvedBy, req.params.id, tid);
    recordAudit(tid, {
      branchId: existing.branch_id || scope.writeBranchId,
      wingId: existing.wing_id || scope.writeWingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_complaints WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params)
      : [];
    res.json({
      ok: true,
      complaints: rows.map((r) => ({
        id: r.id,
        branchId: r.branch_id || DEFAULT_BRANCH_ID,
        wingId: r.wing_id || DEFAULT_WING_ID,
        parentName: dec(tid, r.parent_name), studentName: dec(tid, r.student_name),
        category: r.category, subject: r.subject, priority: r.priority,
        assignedIncharge: r.assigned_incharge, investigationNotes: r.investigation_notes,
        status: r.status, date: r.date
      }))
    });
  });

  router.post('/complaints', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const c = req.body || {};
    if (!String(c.subject || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Complaint subject is required.' });
    }
    const item = {
      id: c.id || ('CMP-' + Date.now()),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
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
        (id, tenant_id, branch_id, wing_id, parent_name, student_name, category, subject, priority, assigned_incharge, investigation_notes, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, item.branchId, item.wingId, enc(tid, item.parentName), enc(tid, item.studentName), item.category, item.subject, item.priority, item.assignedIncharge, item.investigationNotes, item.status, item.date);
    }
    res.status(201).json({ ok: true, complaint: item });
  });

  router.put('/complaints/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_complaints WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Complaint not found' });
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    const status = String(req.body?.status || 'Resolved');
    const notes = req.body?.investigationNotes;
    sqliteDb.prepare('UPDATE local_school_complaints SET status = ?, investigation_notes = COALESCE(?, investigation_notes) WHERE id = ? AND tenant_id = ?')
      .run(status, notes ?? null, req.params.id, tid);
    res.json({ ok: true, id: req.params.id, status });
  });

  router.get('/lesson-plans', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_lesson_plans WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params)
      : [];
    res.json({
      ok: true,
      lessonPlans: rows.map((r) => ({
        id: r.id,
        branchId: r.branch_id || DEFAULT_BRANCH_ID,
        wingId: r.wing_id || DEFAULT_WING_ID,
        teacherId: r.teacher_id, teacherName: r.teacher_name, subject: r.subject,
        grade: r.grade, topic: r.topic, objective: r.objective, date: r.date,
        status: r.status, moderatorNotes: r.moderator_notes
      }))
    });
  });

  router.post('/lesson-plans', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const lp = req.body || {};
    if (!String(lp.topic || '').trim() || !String(lp.subject || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Lesson plan subject and topic are required.' });
    }
    const item = {
      id: lp.id || ('LP-' + Date.now()),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
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
        (id, tenant_id, branch_id, wing_id, teacher_id, teacher_name, subject, grade, topic, objective, date, status, moderator_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, item.branchId, item.wingId, item.teacherId, item.teacherName, item.subject, item.grade, item.topic, item.objective, item.date, item.status, item.moderatorNotes);
    }
    res.status(201).json({ ok: true, lessonPlan: item });
  });

  router.put('/lesson-plans/:id', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_lesson_plans WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Lesson plan not found' });
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    const status = String(req.body?.status || 'Approved');
    sqliteDb.prepare('UPDATE local_school_lesson_plans SET status = ?, moderator_notes = COALESCE(?, moderator_notes) WHERE id = ? AND tenant_id = ?')
      .run(status, req.body?.moderatorNotes ?? null, req.params.id, tid);
    res.json({ ok: true, id: req.params.id, status });
  });

  router.delete('/lesson-plans/:id', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false });
    const existing = sqliteDb.prepare('SELECT id, branch_id, wing_id FROM local_school_lesson_plans WHERE id = ? AND tenant_id = ?').get(req.params.id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Lesson plan not found' });
    const scopeErr = assertRecordScopeAllowed(scope, existing);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare('DELETE FROM local_school_lesson_plans WHERE id = ? AND tenant_id = ?')
      .run(req.params.id, tid);
    res.json({ ok: true, id: req.params.id });
  });

  router.get('/substitutions', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const scopeSql = buildScopeSql(scope);
    const rows = sqliteDb
      ? sqliteDb.prepare(`SELECT * FROM local_school_substitutions WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params)
      : [];
    res.json({
      ok: true,
      substitutions: rows.map((r) => ({
        id: r.id,
        branchId: r.branch_id || DEFAULT_BRANCH_ID,
        wingId: r.wing_id || DEFAULT_WING_ID,
        absentTeacher: r.absent_teacher, substituteTeacher: r.substitute_teacher,
        grade: r.grade, subject: r.subject, period: r.period, date: r.date, notes: r.notes, status: r.status
      }))
    });
  });

  router.post('/substitutions', rejectRestrictedRole(['student', 'parent', 'accountant']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const s = req.body || {};
    if (!String(s.absentTeacher || '').trim() || !String(s.substituteTeacher || '').trim()) {
      return res.status(400).json({ ok: false, message: 'absentTeacher and substituteTeacher are required.' });
    }
    const item = {
      id: s.id || ('SUB-' + Date.now()),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId,
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
        (id, tenant_id, branch_id, wing_id, absent_teacher, substitute_teacher, grade, subject, period, date, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, tid, item.branchId, item.wingId, item.absentTeacher, item.substituteTeacher, item.grade, item.subject, item.period, item.date, item.notes, item.status);
    }
    res.status(201).json({ ok: true, substitution: item });
  });

  // =========================================================================
  // INSTITUTIONAL AUDIT, RECONCILIATION, COMPLIANCE SCAN & WORKSPACE STATE
  // =========================================================================
  router.get('/audit-logs', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    let logs = [];
    let totalTenantRows = 0;
    if (sqliteDb) {
      try {
        const cntRow = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_audit_logs WHERE tenant_id = ?').get(tid);
        totalTenantRows = Number(cntRow?.cnt || 0);
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_audit_logs WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC LIMIT 200`).all(tid, ...scopeSql.params);
        logs = rows.map((r) => ({
          id: r.id,
          branchId: r.branch_id || DEFAULT_BRANCH_ID,
          wingId: r.wing_id || DEFAULT_WING_ID,
          timestamp: r.timestamp, operatorName: r.operator_name, operatorRole: r.operator_role,
          actionType: r.action_type, category: r.category, entityId: r.entity_id,
          entityDescription: r.entity_description, details: r.details, severity: r.severity,
          verifiedBy: r.verified_by, ipAddress: r.ip_address
        }));
      } catch {}
    }
    if (totalTenantRows === 0 && tid === ROOT_TENANT_ID) {
      logs = SCHOOL_AUDIT_LOGS.map((l) => ({
        ...l,
        branchId: l.branchId || DEFAULT_BRANCH_ID,
        wingId: l.wingId || DEFAULT_WING_ID
      })).filter((l) => {
        if (scope.branchFilter && l.branchId !== scope.branchFilter) return false;
        if (scope.wingFilter && l.wingId !== scope.wingFilter) return false;
        return true;
      });
    }
    res.json({ ok: true, tenantId: tid, logs });
  });

  router.post('/audit-logs', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const newEntry = recordAudit(tid, {
      ...(req.body || {}),
      branchId: scope.writeBranchId,
      wingId: scope.writeWingId
    });
    res.status(201).json({ ok: true, log: newEntry });
  });

  const mapReconciliationRow = (r, nameMaps = null) => {
    const branchId = r.branch_id || DEFAULT_BRANCH_ID;
    const wingId = r.wing_id || DEFAULT_WING_ID;
    return {
      id: r.id,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : undefined,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : undefined,
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
    };
  };

  router.get('/reconciliation', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    let reconciliations = [];
    let totalTenantRows = 0;
    if (sqliteDb) {
      try {
        const cntRow = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_reconciliation WHERE tenant_id = ?').get(tid);
        totalTenantRows = Number(cntRow?.cnt || 0);
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_reconciliation WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC LIMIT 100`).all(tid, ...scopeSql.params);
        reconciliations = rows.map((r) => mapReconciliationRow(r, nameMaps));
      } catch {}
    }
    if (totalTenantRows === 0 && tid === ROOT_TENANT_ID) {
      reconciliations = SCHOOL_FEE_RECONCILIATION.map((rec) => ({
        ...rec,
        branchId: rec.branchId || DEFAULT_BRANCH_ID,
        branchName: nameMaps.branchName(rec.branchId || DEFAULT_BRANCH_ID),
        wingId: rec.wingId || DEFAULT_WING_ID,
        wingName: nameMaps.wingName(rec.wingId || DEFAULT_WING_ID),
        submittedByRole: 'accountant',
        ownerApprovalStatus: 'Verified & Approved by Owner',
        approvedBy: 'School Owner Executive'
      })).filter((rec) => {
        if (scope.branchFilter && rec.branchId !== scope.branchFilter) return false;
        if (scope.wingFilter && rec.wingId !== scope.wingFilter) return false;
        return true;
      });
    }
    res.json({ ok: true, tenantId: tid, reconciliations });
  });

  router.post('/reconciliation', rejectRestrictedRole(['student', 'parent']), async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
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
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;

    const newRec = {
      id: r.id || ('DCL-' + Date.now()),
      branchId,
      branchName: String(r.branchName || nameMaps.branchName(branchId)),
      wingId,
      wingName: String(r.wingName || nameMaps.wingName(wingId)),
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
          id, tenant_id, branch_id, wing_id, date, counter_cash, bank_meezan, bank_hbl, online_digital,
          total_billed, actual_collected, variance_amount, status, cashier_name, verified_by_auditor,
          submitted_by_role, principal_collected, accountant_collected, online_collected,
          opening_vault_cash, petty_expenses, closing_vault_cash, bank_deposit_slip_no,
          owner_approval_status, owner_remarks, approved_by, approved_at, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newRec.id, tid, branchId, wingId, newRec.date, counterCashReceived, bankDepositedMeezan, bankDepositedHBL,
        onlineDigitalKuickPay, totalSystemBilled, actualCollected, varianceAmount,
        newRec.reconciliationStatus, newRec.cashierName, newRec.verifiedByAuditor,
        newRec.submittedByRole, principalCollected, accountantCollected, onlineCollected,
        openingVaultCash, pettyExpenses, closingVaultCash, newRec.bankDepositSlipNo,
        newRec.ownerApprovalStatus, newRec.ownerRemarks, newRec.approvedBy, newRec.approvedAt, newRec.notes
      );

      recordAudit(tid, {
        branchId,
        wingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    const b = req.body || {};
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    const row = sqliteDb.prepare('SELECT * FROM local_school_reconciliation WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Daily Closing / Reconciliation record not found' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

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

    const nameMaps = getBranchWingNameMaps(tid);
    const updated = mapReconciliationRow(
      sqliteDb.prepare('SELECT * FROM local_school_reconciliation WHERE id = ? AND tenant_id = ?').get(id, tid),
      nameMaps
    );

    recordAudit(tid, {
      branchId: updated.branchId,
      wingId: updated.wingId,
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
  const mapPettyVoucherRow = (v, nameMaps = null) => {
    const branchId = v.branch_id || DEFAULT_BRANCH_ID;
    const wingId = v.wing_id || DEFAULT_WING_ID;
    return {
      id: v.id,
      tenantId: v.tenant_id,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : undefined,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : undefined,
      voucherNo: v.voucher_no,
      date: v.date,
      category: v.category || 'Stationery & Office',
      description: v.description,
      amount: Number(v.amount || 0),
      paidTo: v.paid_to || 'Campus Vendor',
      recordedBy: v.recorded_by || 'Accountant / Fee Clerk',
      collectorRole: v.collector_role || 'accountant',
      closingId: v.closing_id || ''
    };
  };

  router.get('/petty-vouchers', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    let vouchers = [];
    if (sqliteDb) {
      try {
        const scopeSql = buildScopeSql(scope);
        const rows = sqliteDb.prepare(`SELECT * FROM local_school_petty_vouchers WHERE tenant_id = ?${scopeSql.sql} ORDER BY date DESC, created_at DESC LIMIT 200`).all(tid, ...scopeSql.params);
        vouchers = rows.map((r) => mapPettyVoucherRow(r, nameMaps));
      } catch {}
    }
    res.json({ ok: true, tenantId: tid, vouchers });
  });

  router.post('/petty-vouchers', rejectRestrictedRole(['student', 'parent', 'teacher']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    const b = req.body || {};
    const description = String(b.description || '').trim();
    const amount = Number(b.amount || 0);
    if (!description || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, message: 'Voucher description and positive amount are required.' });
    }
    const reqRole = resolveUserRole(req) || 'accountant';
    const branchId = scope.writeBranchId;
    const wingId = scope.writeWingId;
    const voucher = {
      id: b.id || ('PV-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90)),
      tenantId: tid,
      branchId,
      branchName: String(b.branchName || nameMaps.branchName(branchId)),
      wingId,
      wingName: String(b.wingName || nameMaps.wingName(wingId)),
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
        (id, tenant_id, branch_id, wing_id, voucher_no, date, category, description, amount, paid_to, recorded_by, collector_role, closing_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        voucher.id, tid, branchId, wingId, voucher.voucherNo, voucher.date, voucher.category, voucher.description,
        voucher.amount, voucher.paidTo, voucher.recordedBy, voucher.collectorRole, voucher.closingId,
        new Date().toISOString()
      );
      recordAudit(tid, {
        branchId,
        wingId,
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
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const id = req.params.id;
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const row = sqliteDb.prepare('SELECT * FROM local_school_petty_vouchers WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Petty cash voucher not found.' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });
    sqliteDb.prepare('DELETE FROM local_school_petty_vouchers WHERE id = ? AND tenant_id = ?').run(id, tid);
    res.json({ ok: true, id });
  });

  router.get('/finance/monitoring', rejectRestrictedRole(['student', 'parent']), (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    const daysParam = Math.min(90, Math.max(7, Number(req.query?.days || 14)));
    let fees = [];
    let students = [];
    let reconciliations = [];
    let pettyVouchers = [];
    let teachers = [];
    let totalTenantFees = 0;
    let totalTenantStudents = 0;

    if (sqliteDb) {
      try {
        totalTenantFees = Number(sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_fees WHERE tenant_id = ?').get(tid)?.cnt || 0);
        totalTenantStudents = Number(sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_students WHERE tenant_id = ?').get(tid)?.cnt || 0);
        const scopeSql = buildScopeSql(scope);
        fees = sqliteDb.prepare(`SELECT * FROM local_school_fees WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params).map((r) => mapFeeRow(r, tid, nameMaps));
        students = sqliteDb.prepare(`SELECT * FROM local_school_students WHERE tenant_id = ?${scopeSql.sql}`).all(tid, ...scopeSql.params).map((r) => mapStudentRow(r, tid, nameMaps));
        reconciliations = sqliteDb.prepare(`SELECT * FROM local_school_reconciliation WHERE tenant_id = ?${scopeSql.sql} ORDER BY date DESC, created_at DESC LIMIT 100`).all(tid, ...scopeSql.params).map((r) => mapReconciliationRow(r, nameMaps));
        pettyVouchers = sqliteDb.prepare(`SELECT * FROM local_school_petty_vouchers WHERE tenant_id = ?${scopeSql.sql} ORDER BY date DESC, created_at DESC LIMIT 200`).all(tid, ...scopeSql.params).map((r) => mapPettyVoucherRow(r, nameMaps));
        teachers = sqliteDb.prepare(`SELECT * FROM local_school_teachers WHERE tenant_id = ?${scopeSql.sql}`).all(tid, ...scopeSql.params);
      } catch {}
    }

    if (totalTenantFees === 0 && totalTenantStudents === 0 && tid === ROOT_TENANT_ID) {
      const seedMatchesScope = (item) => {
        const bId = item.branchId || DEFAULT_BRANCH_ID;
        const wId = item.wingId || DEFAULT_WING_ID;
        if (scope.branchFilter && bId !== scope.branchFilter) return false;
        if (scope.wingFilter && wId !== scope.wingFilter) return false;
        return true;
      };
      fees = defaultFeesSeed.filter(seedMatchesScope);
      students = defaultStudentsSeed.filter(seedMatchesScope);
      reconciliations = SCHOOL_FEE_RECONCILIATION.filter(seedMatchesScope);
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
      else if (mode.includes('jazz') || mode.includes('easy') || mode.includes('kuick') || mode.includes('1bill') || mode.includes('1link') || mode.includes('raast') || mode.includes('sadapay') || mode.includes('nayapay') || mode.includes('online') || mode.includes('gateway')) digitalInflow += amt;
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
      branchId: scope.branchFilter || 'ALL',
      branchName: nameMaps.branchName(scope.branchFilter || 'ALL'),
      wingId: scope.wingFilter || 'ALL',
      wingName: nameMaps.wingName(scope.wingFilter || 'ALL'),
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
        paymentGateways: (() => {
          let pendingVerificationCount = 0;
          let pendingVerificationAmount = 0;
          let verifiedGatewayCount = 0;
          let verifiedGatewayAmount = 0;
          if (sqliteDb) {
            try {
              const scopeSql = buildScopeSql(scope);
              const pgRows = sqliteDb.prepare(`SELECT status, total_amount FROM local_school_payment_transactions WHERE tenant_id = ?${scopeSql.sql}`).all(tid, ...scopeSql.params);
              for (const r of pgRows) {
                const st = String(r.status || '').toUpperCase();
                const amt = Number(r.total_amount || 0);
                if (st === 'PENDING_VERIFICATION') {
                  pendingVerificationCount++;
                  pendingVerificationAmount += amt;
                } else if (st === 'VERIFIED' || st === 'SETTLED') {
                  verifiedGatewayCount++;
                  verifiedGatewayAmount += amt;
                }
              }
            } catch {}
          }
          return { pendingVerificationCount, pendingVerificationAmount, verifiedGatewayCount, verifiedGatewayAmount };
        })(),
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

  // =========================================================================
  // PAKISTAN-NATIVE SCHOOL PAYMENT GATEWAYS, SETTINGS & TRANSACTIONS (OWNER-CONTROLLED)
  // =========================================================================
  const validateGatewayWebhookUrl = (raw) => {
    const clean = String(raw || '').trim();
    if (!clean) return { ok: true, value: '' };
    try {
      const parsed = new URL(clean);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { ok: false, message: 'Webhook URL must use http:// or https://' };
      }
      return { ok: true, value: clean };
    } catch {
      return { ok: false, message: 'Invalid webhook URL format.' };
    }
  };

  const validateProofScreenshot = (raw) => {
    const clean = String(raw || '').trim();
    if (!clean) return { ok: true, value: '' };
    if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$/i.test(clean)) {
      return { ok: false, message: 'Payment slip screenshot must be a valid PNG, JPG, WEBP, or GIF image.' };
    }
    const normalized = clean.replace(/[\r\n]/g, '');
    if (normalized.length > 650000) {
      return { ok: false, message: 'Payment slip screenshot is too large. Please upload a smaller or compressed image.' };
    }
    return { ok: true, value: normalized };
  };

  const ensureTenantPaymentGatewaysSeeded = (tid) => {
    if (!sqliteDb) return;
    try {
      const cnt = Number(sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM local_school_payment_gateways WHERE tenant_id = ?').get(tid)?.cnt || 0);
      if (cnt === 0) {
        const defaults = getDefaultSchoolPaymentGateways(tid);
        const now = new Date().toISOString();
        const stmt = sqliteDb.prepare(`
          INSERT OR IGNORE INTO local_school_payment_gateways (
            id, tenant_id, branch_id, wing_id, provider_key, display_name, category,
            account_title, account_number, iban, raast_id, bank_name, branch_code, till_id, biller_code,
            merchant_id, merchant_secret_enc, integrity_salt_enc, webhook_url,
            fee_type, fee_value, verification_mode, instructions, allowed_portals_json, custom_fields_json,
            is_enabled, is_default, sort_order, is_synced, created_at, updated_at
          ) VALUES (?, ?, 'ALL', 'ALL', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        `);
        for (const gw of defaults) {
          stmt.run(
            gw.id, tid, gw.providerKey, gw.displayName, gw.category,
            gw.accountTitle, gw.accountNumber, gw.iban, gw.raastId, gw.bankName, gw.branchCode, gw.tillId, gw.billerCode,
            gw.merchantId, gw.webhookUrl || '', gw.feeType, Number(gw.feeValue || 0), gw.verificationMode,
            gw.instructions, JSON.stringify(gw.allowedPortals || []), JSON.stringify(gw.customFields || []),
            gw.isEnabled ? 1 : 0, gw.isDefault ? 1 : 0, Number(gw.sortOrder || 10), now, now
          );
        }
      }
      const settingsRow = sqliteDb.prepare('SELECT tenant_id FROM local_school_gateway_settings WHERE tenant_id = ?').get(tid);
      if (!settingsRow) {
        sqliteDb.prepare(`
          INSERT OR IGNORE INTO local_school_gateway_settings (tenant_id, settings_json, is_synced, updated_at)
          VALUES (?, ?, 0, ?)
        `).run(tid, JSON.stringify(getDefaultSchoolGatewaySettings()), new Date().toISOString());
      }
    } catch {}
  };

  const loadTenantGatewaySettings = (tid) => {
    const def = getDefaultSchoolGatewaySettings();
    if (!sqliteDb) return def;
    try {
      ensureTenantPaymentGatewaysSeeded(tid);
      const row = sqliteDb.prepare('SELECT settings_json FROM local_school_gateway_settings WHERE tenant_id = ?').get(tid);
      if (row && row.settings_json) {
        const parsed = JSON.parse(row.settings_json);
        return { ...def, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
      }
    } catch {}
    return def;
  };

  const mapGatewayRow = (r, tid, isOwner, nameMaps = null) => {
    let allowedPortals = ['owner', 'principal', 'accountant', 'student', 'parent'];
    try {
      const parsed = JSON.parse(r.allowed_portals_json || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) allowedPortals = parsed;
    } catch {}
    let customFields = [];
    try {
      const parsed = JSON.parse(r.custom_fields_json || '[]');
      if (Array.isArray(parsed)) customFields = parsed;
    } catch {}
    const branchId = r.branch_id || 'ALL';
    const wingId = r.wing_id || 'ALL';
    const rawSecret = r.merchant_secret_enc ? dec(tid, r.merchant_secret_enc) : '';
    const rawSalt = r.integrity_salt_enc ? dec(tid, r.integrity_salt_enc) : '';
    const hasMerchantSecret = Boolean(rawSecret);
    const hasIntegritySalt = Boolean(rawSalt);
    const maskTail = (s) => (s && s.length > 4 ? `••••${s.slice(-4)}` : (s ? '••••' : ''));
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      branchId,
      branchName: branchId === 'ALL' ? 'All Campus Branches' : (nameMaps ? nameMaps.branchName(branchId) : branchId),
      wingId,
      wingName: wingId === 'ALL' ? 'All Academic Wings' : (nameMaps ? nameMaps.wingName(wingId) : wingId),
      providerKey: r.provider_key,
      displayName: r.display_name,
      category: r.category || 'mobile_wallet',
      accountTitle: r.account_title || '',
      accountNumber: r.account_number || '',
      iban: r.iban || '',
      raastId: r.raast_id || '',
      bankName: r.bank_name || '',
      branchCode: r.branch_code || '',
      tillId: r.till_id || '',
      billerCode: r.biller_code || '',
      merchantId: r.merchant_id || '',
      hasMerchantSecret: isOwner ? hasMerchantSecret : false,
      hasIntegritySalt: isOwner ? hasIntegritySalt : false,
      merchantSecretHint: isOwner ? maskTail(rawSecret) : '',
      integritySaltHint: isOwner ? maskTail(rawSalt) : '',
      webhookUrl: isOwner ? (r.webhook_url || '') : '',
      feeType: r.fee_type || 'none',
      feeValue: Number(r.fee_value || 0),
      verificationMode: r.verification_mode || 'slip_review',
      instructions: r.instructions || '',
      allowedPortals,
      customFields,
      isEnabled: r.is_enabled !== 0,
      isDefault: r.is_default === 1,
      sortOrder: Number(r.sort_order || 10),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  };

  const mapPaymentTransactionRow = (r, tid, nameMaps = null) => {
    const branchId = r.branch_id || DEFAULT_BRANCH_ID;
    const wingId = r.wing_id || DEFAULT_WING_ID;
    let customFields = {};
    try {
      const parsed = JSON.parse(r.custom_fields_json || '{}');
      if (parsed && typeof parsed === 'object') customFields = parsed;
    } catch {}
    return {
      id: r.id,
      tenantId: r.tenant_id || tid,
      branchId,
      branchName: nameMaps ? nameMaps.branchName(branchId) : branchId,
      wingId,
      wingName: nameMaps ? nameMaps.wingName(wingId) : wingId,
      txnRef: r.txn_ref,
      challanNo: r.challan_no || '',
      gatewayId: r.gateway_id,
      gatewayName: r.gateway_name,
      providerKey: r.provider_key,
      studentId: r.student_id || '',
      studentName: dec(tid, r.student_name) || 'Student',
      rollNo: r.roll_no || '',
      grade: r.grade || '',
      guardianName: dec(tid, r.guardian_name) || '',
      payerPhone: dec(tid, r.payer_phone) || '',
      payerAccountTitle: dec(tid, r.payer_account_title) || '',
      month: r.month || 'Current Session Fee',
      baseAmount: Number(r.base_amount || 0),
      gatewayFee: Number(r.gateway_fee || 0),
      totalAmount: Number(r.total_amount || 0),
      currency: r.currency || 'PKR',
      status: r.status || 'PENDING_VERIFICATION',
      verificationMode: r.verification_mode || 'slip_review',
      proofReference: r.proof_reference || '',
      proofNotes: r.proof_notes || '',
      proofScreenshot: r.proof_screenshot || '',
      hasProofScreenshot: Boolean(r.proof_screenshot),
      submittedByName: r.submitted_by_name || '',
      submittedByRole: r.submitted_by_role || 'parent',
      verifiedBy: r.verified_by || '',
      verifiedAt: r.verified_at || '',
      rejectionReason: r.rejection_reason || '',
      linkedFeeId: r.linked_fee_id || '',
      customFields,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  };

  const settleFeeForGatewayTransaction = (tid, txRow, verifierName, verifierRole, scope) => {
    if (!sqliteDb || !txRow) return '';
    if (txRow.linked_fee_id) {
      const existingFee = sqliteDb.prepare('SELECT id FROM local_school_fees WHERE id = ? AND tenant_id = ?').get(txRow.linked_fee_id, tid);
      if (existingFee) return existingFee.id;
    }
    const stuName = dec(tid, txRow.student_name) || 'Student';
    const baseAmt = Number(txRow.base_amount || txRow.total_amount || 0);
    const totalPaid = Number(txRow.total_amount || baseAmt);
    const paidDate = new Date().toISOString().split('T')[0];
    const modeLabel = `${txRow.gateway_name} (${txRow.provider_key === 'cash_counter' ? 'Counter' : 'Gateway'})`;
    const proofRef = txRow.proof_reference || txRow.txn_ref;
    const txBranchId = txRow.branch_id || scope?.writeBranchId || DEFAULT_BRANCH_ID;
    const txWingId = txRow.wing_id || scope?.writeWingId || DEFAULT_WING_ID;

    let linkedFeeId = '';
    if (txRow.challan_no) {
      const existingChallan = sqliteDb.prepare('SELECT * FROM local_school_fees WHERE tenant_id = ? AND challan_no = ?').get(tid, txRow.challan_no);
      if (existingChallan) {
        const prevPaid = Number(existingChallan.paid_amount || 0);
        const totalDue = Number(existingChallan.total || baseAmt);
        const nextPaid = Math.min(Math.max(totalDue, baseAmt), prevPaid + baseAmt);
        const nextStatus = nextPaid >= totalDue ? 'PAID' : 'PARTIAL';
        sqliteDb.prepare(`
          UPDATE local_school_fees
          SET status = ?, paid_amount = ?, paid_date = ?, payment_mode = ?, resource_reference = ?, collected_by = ?, collector_role = ?, notes = ?, is_synced = 0
          WHERE id = ? AND tenant_id = ?
        `).run(
          nextStatus,
          nextPaid,
          paidDate,
          modeLabel,
          proofRef,
          verifierName || 'Online Gateway Verification',
          verifierRole || 'owner',
          `Verified gateway txn ${txRow.txn_ref} (Total PKR ${totalPaid})`,
          existingChallan.id,
          tid
        );
        linkedFeeId = existingChallan.id;
      }
    }

    if (!linkedFeeId && (txRow.student_id || txRow.roll_no)) {
      const openChallan = txRow.student_id
        ? sqliteDb.prepare("SELECT * FROM local_school_fees WHERE tenant_id = ? AND student_id = ? AND UPPER(status) IN ('PENDING', 'OVERDUE', 'PARTIAL') ORDER BY created_at DESC LIMIT 1").get(tid, txRow.student_id)
        : sqliteDb.prepare("SELECT * FROM local_school_fees WHERE tenant_id = ? AND roll_no = ? AND UPPER(status) IN ('PENDING', 'OVERDUE', 'PARTIAL') ORDER BY created_at DESC LIMIT 1").get(tid, txRow.roll_no);
      if (openChallan) {
        const prevPaid = Number(openChallan.paid_amount || 0);
        const totalDue = Number(openChallan.total || baseAmt);
        const nextPaid = Math.min(Math.max(totalDue, baseAmt), prevPaid + baseAmt);
        const nextStatus = nextPaid >= totalDue ? 'PAID' : 'PARTIAL';
        if (nextStatus === 'PAID') {
          sqliteDb.prepare(`
            UPDATE local_school_fees
            SET status = ?, paid_amount = ?, paid_date = ?, payment_mode = ?, resource_reference = ?, collected_by = ?, collector_role = ?, notes = ?, is_synced = 0
            WHERE id = ? AND tenant_id = ?
          `).run(
            'PAID',
            nextPaid,
            paidDate,
            modeLabel,
            proofRef,
            verifierName || 'Online Gateway Verification',
            verifierRole || 'owner',
            `Settled via gateway txn ${txRow.txn_ref} (Total PKR ${totalPaid})`,
            openChallan.id,
            tid
          );
          linkedFeeId = openChallan.id;
        }
      }
    }

    if (!linkedFeeId) {
      linkedFeeId = 'FEE-' + Date.now() + '-' + Math.floor(10 + Math.random() * 90);
      const resolvedChallanNo = txRow.challan_no || `GW-${txRow.txn_ref}`;
      sqliteDb.prepare(`
        INSERT INTO local_school_fees (
          id, tenant_id, branch_id, wing_id, challan_no, student_id, student_name, roll_no, grade, month,
          tuition, lab_fee, discount, total, paid_amount, status, payment_mode, resource_reference,
          collected_by, collector_role, notes, due_date, paid_date, is_synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'PAID', ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        linkedFeeId,
        tid,
        txBranchId,
        txWingId,
        resolvedChallanNo,
        String(txRow.student_id || ''),
        enc(tid, stuName),
        String(txRow.roll_no || 'SCH-GEN'),
        String(txRow.grade || 'Campus'),
        String(txRow.month || 'Current Session Fee'),
        baseAmt,
        baseAmt,
        baseAmt,
        modeLabel,
        proofRef,
        String(verifierName || 'Payment Gateway Desk'),
        String(verifierRole || 'owner'),
        `Online gateway payment verified (${txRow.txn_ref})`,
        paidDate,
        paidDate,
        new Date().toISOString()
      );
    }

    let stRow = txRow.student_id
      ? sqliteDb.prepare('SELECT id, due_bakaya, fee_amount FROM local_school_students WHERE id = ? AND tenant_id = ?').get(txRow.student_id, tid)
      : null;
    if (!stRow && txRow.roll_no) {
      stRow = sqliteDb.prepare('SELECT id, due_bakaya, fee_amount FROM local_school_students WHERE roll_no = ? AND tenant_id = ?').get(txRow.roll_no, tid);
    }
    if (stRow) {
      const currentDue = Number(stRow.due_bakaya ?? stRow.fee_amount ?? 0);
      const remaining = Math.max(0, currentDue - baseAmt);
      const nextStuStatus = remaining === 0 ? 'PAID' : 'PARTIAL';
      sqliteDb.prepare('UPDATE local_school_students SET fee_status = ?, due_bakaya = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?')
        .run(nextStuStatus, remaining, stRow.id, tid);
    }

    return linkedFeeId;
  };

  router.get('/payment-gateways', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    const reqRole = resolveUserRole(req);
    const isOwner = OWNER_ROLES.has(reqRole);
    const includeDisabled = String(req.query?.includeDisabled || '') === '1' || isOwner;

    ensureTenantPaymentGatewaysSeeded(tid);
    const settings = loadTenantGatewaySettings(tid);

    let gateways = [];
    if (sqliteDb) {
      let rows = sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE tenant_id = ? ORDER BY sort_order ASC, created_at ASC').all(tid);
      gateways = rows
        .filter((r) => {
          if (!includeDisabled && r.is_enabled === 0) return false;
          const bId = r.branch_id || 'ALL';
          const wId = r.wing_id || 'ALL';
          if (scope.branchFilter && bId !== 'ALL' && bId !== scope.branchFilter) return false;
          if (scope.wingFilter && wId !== 'ALL' && wId !== scope.wingFilter) return false;
          return true;
        })
        .map((r) => mapGatewayRow(r, tid, isOwner, nameMaps));
    } else {
      gateways = getDefaultSchoolPaymentGateways(tid).map((g) => ({
        ...g,
        tenantId: tid,
        branchId: 'ALL',
        branchName: 'All Campus Branches',
        wingId: 'ALL',
        wingName: 'All Academic Wings',
        hasMerchantSecret: false,
        hasIntegritySalt: false,
        merchantSecretHint: '',
        integritySaltHint: '',
        webhookUrl: isOwner ? (g.webhookUrl || '') : ''
      }));
    }

    res.json({
      ok: true,
      tenantId: tid,
      canManage: isOwner,
      gateways,
      settings
    });
  });

  router.post('/payment-gateways', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const nameMaps = getBranchWingNameMaps(tid);
    ensureTenantPaymentGatewaysSeeded(tid);

    const b = req.body || {};
    const displayName = String(b.displayName || '').trim();
    const providerKey = String(b.providerKey || 'custom').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'custom';
    if (!displayName) {
      return res.status(400).json({ ok: false, message: 'Gateway displayName is required.' });
    }
    const feeType = ['none', 'percent', 'fixed'].includes(String(b.feeType || 'none')) ? String(b.feeType || 'none') : 'none';
    const feeValue = Math.max(0, Number(b.feeValue || 0));
    if (!Number.isFinite(feeValue)) {
      return res.status(400).json({ ok: false, message: 'Fee value must be a valid non-negative number.' });
    }
    const verificationMode = ['slip_review', 'auto_instant', 'counter_cash'].includes(String(b.verificationMode || 'slip_review'))
      ? String(b.verificationMode || 'slip_review')
      : 'slip_review';
    const urlCheck = validateGatewayWebhookUrl(b.webhookUrl);
    if (!urlCheck.ok) return res.status(400).json({ ok: false, message: urlCheck.message });

    const id = 'PGW-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
    const branchId = String(b.branchId || 'ALL').trim() || 'ALL';
    const wingId = String(b.wingId || 'ALL').trim() || 'ALL';
    const isDefault = Boolean(b.isDefault);
    const isEnabled = b.isEnabled !== false;
    const allowedPortals = Array.isArray(b.allowedPortals) && b.allowedPortals.length > 0
      ? b.allowedPortals.map((p) => String(p).trim().toLowerCase()).filter(Boolean)
      : ['owner', 'principal', 'accountant', 'student', 'parent'];
    const customFields = Array.isArray(b.customFields)
      ? b.customFields
        .filter((f) => f && String(f.label || '').trim())
        .map((f) => ({ label: String(f.label).trim(), value: String(f.value || '').trim() }))
      : [];

    if (isDefault) {
      sqliteDb.prepare('UPDATE local_school_payment_gateways SET is_default = 0, is_synced = 0 WHERE tenant_id = ?').run(tid);
    }

    const now = new Date().toISOString();
    const secretEnc = b.merchantSecret ? enc(tid, String(b.merchantSecret).trim()) : '';
    const saltEnc = b.integritySalt ? enc(tid, String(b.integritySalt).trim()) : '';

    sqliteDb.prepare(`
      INSERT INTO local_school_payment_gateways (
        id, tenant_id, branch_id, wing_id, provider_key, display_name, category,
        account_title, account_number, iban, raast_id, bank_name, branch_code, till_id, biller_code,
        merchant_id, merchant_secret_enc, integrity_salt_enc, webhook_url,
        fee_type, fee_value, verification_mode, instructions, allowed_portals_json, custom_fields_json,
        is_enabled, is_default, sort_order, is_synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id, tid, branchId, wingId, providerKey, displayName, String(b.category || 'custom'),
      String(b.accountTitle || ''), String(b.accountNumber || ''), String(b.iban || ''), String(b.raastId || ''),
      String(b.bankName || ''), String(b.branchCode || ''), String(b.tillId || ''), String(b.billerCode || ''),
      String(b.merchantId || ''), secretEnc, saltEnc, urlCheck.value,
      feeType, feeValue, verificationMode, String(b.instructions || ''),
      JSON.stringify(allowedPortals), JSON.stringify(customFields),
      isEnabled ? 1 : 0, isDefault ? 1 : 0, Number(b.sortOrder || 90), now, now
    );

    const row = sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?').get(id, tid);
    const gateway = mapGatewayRow(row, tid, true, nameMaps);

    recordAudit(tid, {
      branchId: branchId === 'ALL' ? DEFAULT_BRANCH_ID : branchId,
      wingId: wingId === 'ALL' ? DEFAULT_WING_ID : wingId,
      operatorName: String(req.headers['x-user-name'] || 'School Owner'),
      operatorRole: 'School Owner',
      actionType: 'Fee Collection Receipt',
      category: 'Financial',
      entityId: id,
      entityDescription: `Added Payment Gateway: ${displayName} (${providerKey})`,
      details: `Owner configured payment gateway ${displayName} · Mode: ${verificationMode} · Scope: ${branchId}/${wingId}.`,
      severity: 'Normal Audit'
    });

    if (db) {
      try {
        await setDoc(doc(db, 'school_payment_gateways', id), { ...gateway, tenant_id: tid, is_synced: 1, synced_at: now }, { merge: true });
      } catch {}
    }

    res.status(201).json({ ok: true, gateway });
  });

  router.put('/payment-gateways/:id', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const nameMaps = getBranchWingNameMaps(tid);
    ensureTenantPaymentGatewaysSeeded(tid);

    const id = req.params.id;
    const existing = sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Payment gateway not found for this tenant.' });

    const b = req.body || {};
    const displayName = b.displayName !== undefined ? String(b.displayName).trim() : existing.display_name;
    if (!displayName) return res.status(400).json({ ok: false, message: 'Gateway displayName cannot be empty.' });

    const urlCheck = b.webhookUrl !== undefined ? validateGatewayWebhookUrl(b.webhookUrl) : { ok: true, value: existing.webhook_url || '' };
    if (!urlCheck.ok) return res.status(400).json({ ok: false, message: urlCheck.message });

    const feeType = b.feeType !== undefined
      ? (['none', 'percent', 'fixed'].includes(String(b.feeType)) ? String(b.feeType) : existing.fee_type)
      : existing.fee_type;
    const feeValue = b.feeValue !== undefined ? Math.max(0, Number(b.feeValue || 0)) : Number(existing.fee_value || 0);
    if (!Number.isFinite(feeValue)) return res.status(400).json({ ok: false, message: 'Invalid fee value.' });

    const verificationMode = b.verificationMode !== undefined
      ? (['slip_review', 'auto_instant', 'counter_cash'].includes(String(b.verificationMode)) ? String(b.verificationMode) : existing.verification_mode)
      : existing.verification_mode;

    const isDefault = b.isDefault !== undefined ? Boolean(b.isDefault) : existing.is_default === 1;
    if (isDefault) {
      sqliteDb.prepare('UPDATE local_school_payment_gateways SET is_default = 0, is_synced = 0 WHERE tenant_id = ? AND id != ?').run(tid, id);
    }

    const incomingSecret = String(b.merchantSecret || '').trim();
    const secretEnc = incomingSecret && !incomingSecret.startsWith('••••')
      ? enc(tid, incomingSecret)
      : (existing.merchant_secret_enc || '');

    const incomingSalt = String(b.integritySalt || '').trim();
    const saltEnc = incomingSalt && !incomingSalt.startsWith('••••')
      ? enc(tid, incomingSalt)
      : (existing.integrity_salt_enc || '');

    const allowedPortals = Array.isArray(b.allowedPortals)
      ? JSON.stringify(b.allowedPortals.map((p) => String(p).trim().toLowerCase()).filter(Boolean))
      : existing.allowed_portals_json;

    const customFields = Array.isArray(b.customFields)
      ? JSON.stringify(b.customFields.filter((f) => f && String(f.label || '').trim()).map((f) => ({ label: String(f.label).trim(), value: String(f.value || '').trim() })))
      : existing.custom_fields_json;

    const now = new Date().toISOString();
    sqliteDb.prepare(`
      UPDATE local_school_payment_gateways
      SET branch_id = ?, wing_id = ?, provider_key = ?, display_name = ?, category = ?,
          account_title = ?, account_number = ?, iban = ?, raast_id = ?, bank_name = ?,
          branch_code = ?, till_id = ?, biller_code = ?, merchant_id = ?,
          merchant_secret_enc = ?, integrity_salt_enc = ?, webhook_url = ?,
          fee_type = ?, fee_value = ?, verification_mode = ?, instructions = ?,
          allowed_portals_json = ?, custom_fields_json = ?, is_enabled = ?, is_default = ?, sort_order = ?,
          is_synced = 0, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).run(
      b.branchId !== undefined ? String(b.branchId || 'ALL') : existing.branch_id,
      b.wingId !== undefined ? String(b.wingId || 'ALL') : existing.wing_id,
      b.providerKey !== undefined ? String(b.providerKey).trim().toLowerCase() : existing.provider_key,
      displayName,
      b.category !== undefined ? String(b.category) : existing.category,
      b.accountTitle !== undefined ? String(b.accountTitle) : (existing.account_title || ''),
      b.accountNumber !== undefined ? String(b.accountNumber) : (existing.account_number || ''),
      b.iban !== undefined ? String(b.iban) : (existing.iban || ''),
      b.raastId !== undefined ? String(b.raastId) : (existing.raast_id || ''),
      b.bankName !== undefined ? String(b.bankName) : (existing.bank_name || ''),
      b.branchCode !== undefined ? String(b.branchCode) : (existing.branch_code || ''),
      b.tillId !== undefined ? String(b.tillId) : (existing.till_id || ''),
      b.billerCode !== undefined ? String(b.billerCode) : (existing.biller_code || ''),
      b.merchantId !== undefined ? String(b.merchantId) : (existing.merchant_id || ''),
      secretEnc,
      saltEnc,
      urlCheck.value,
      feeType,
      feeValue,
      verificationMode,
      b.instructions !== undefined ? String(b.instructions) : (existing.instructions || ''),
      allowedPortals,
      customFields,
      b.isEnabled !== undefined ? (b.isEnabled ? 1 : 0) : existing.is_enabled,
      isDefault ? 1 : 0,
      b.sortOrder !== undefined ? Number(b.sortOrder) : existing.sort_order,
      now,
      id,
      tid
    );

    const updatedRow = sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?').get(id, tid);
    const gateway = mapGatewayRow(updatedRow, tid, true, nameMaps);

    recordAudit(tid, {
      operatorName: String(req.headers['x-user-name'] || 'School Owner'),
      operatorRole: 'School Owner',
      actionType: 'Fee Collection Receipt',
      category: 'Financial',
      entityId: id,
      entityDescription: `Updated Payment Gateway: ${gateway.displayName}`,
      details: `Owner updated gateway settings/credentials (${gateway.providerKey}) · Enabled: ${gateway.isEnabled} · Default: ${gateway.isDefault}.`,
      severity: 'Authorized Override'
    });

    if (db) {
      try {
        await setDoc(doc(db, 'school_payment_gateways', id), { ...gateway, tenant_id: tid, is_synced: 1, synced_at: now }, { merge: true });
      } catch {}
    }

    res.json({ ok: true, gateway });
  });

  router.put('/payment-gateways/:id/toggle', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const nameMaps = getBranchWingNameMaps(tid);
    ensureTenantPaymentGatewaysSeeded(tid);

    const id = req.params.id;
    const existing = sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Payment gateway not found.' });

    const nextEnabled = req.body?.isEnabled !== undefined ? (req.body.isEnabled ? 1 : 0) : (existing.is_enabled === 1 ? 0 : 1);
    const now = new Date().toISOString();
    sqliteDb.prepare('UPDATE local_school_payment_gateways SET is_enabled = ?, is_synced = 0, updated_at = ? WHERE id = ? AND tenant_id = ?')
      .run(nextEnabled, now, id, tid);

    const row = sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?').get(id, tid);
    const gateway = mapGatewayRow(row, tid, true, nameMaps);
    res.json({ ok: true, gateway });
  });

  router.delete('/payment-gateways/:id', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const id = req.params.id;
    const existing = sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!existing) return res.status(404).json({ ok: false, message: 'Payment gateway not found.' });

    sqliteDb.prepare('DELETE FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?').run(id, tid);
    if (existing.is_default === 1) {
      const next = sqliteDb.prepare('SELECT id FROM local_school_payment_gateways WHERE tenant_id = ? AND is_enabled = 1 ORDER BY sort_order ASC LIMIT 1').get(tid);
      if (next) {
        sqliteDb.prepare('UPDATE local_school_payment_gateways SET is_default = 1, is_synced = 0 WHERE id = ?').run(next.id);
      }
    }

    recordAudit(tid, {
      operatorName: String(req.headers['x-user-name'] || 'School Owner'),
      operatorRole: 'School Owner',
      actionType: 'Fee Voucher Deletion',
      category: 'Financial',
      entityId: id,
      entityDescription: `Deleted Payment Gateway: ${existing.display_name}`,
      severity: 'Compliance Flag'
    });

    res.json({ ok: true, id });
  });

  router.put('/payment-gateways-settings', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const current = loadTenantGatewaySettings(tid);
    const b = req.body || {};

    const graceDays = b.lateFeeGraceDays !== undefined ? Number(b.lateFeeGraceDays) : current.lateFeeGraceDays;
    const finePkr = b.lateFeeFinePkr !== undefined ? Number(b.lateFeeFinePkr) : current.lateFeeFinePkr;
    if (!Number.isFinite(graceDays) || graceDays < 0 || !Number.isFinite(finePkr) || finePkr < 0) {
      return res.status(400).json({ ok: false, message: 'Late fee grace days and fine amount must be non-negative.' });
    }

    const next = {
      ...current,
      currency: String(b.currency || current.currency || 'PKR').slice(0, 8),
      allowOnlineStudentPayment: b.allowOnlineStudentPayment !== undefined ? Boolean(b.allowOnlineStudentPayment) : current.allowOnlineStudentPayment,
      allowOnlineParentPayment: b.allowOnlineParentPayment !== undefined ? Boolean(b.allowOnlineParentPayment) : current.allowOnlineParentPayment,
      allowPartialOnlinePayment: b.allowPartialOnlinePayment !== undefined ? Boolean(b.allowPartialOnlinePayment) : current.allowPartialOnlinePayment,
      requireProofReference: b.requireProofReference !== undefined ? Boolean(b.requireProofReference) : current.requireProofReference,
      autoIssueReceiptOnVerify: b.autoIssueReceiptOnVerify !== undefined ? Boolean(b.autoIssueReceiptOnVerify) : current.autoIssueReceiptOnVerify,
      oneBillPrefix: String(b.oneBillPrefix !== undefined ? b.oneBillPrefix : current.oneBillPrefix || '10089').trim(),
      lateFeeGraceDays: graceDays,
      lateFeeFinePkr: finePkr,
      receiptFooterNote: String(b.receiptFooterNote !== undefined ? b.receiptFooterNote : current.receiptFooterNote || '').trim(),
      ownerNotifyOnPayment: b.ownerNotifyOnPayment !== undefined ? Boolean(b.ownerNotifyOnPayment) : current.ownerNotifyOnPayment,
      customPolicyFields: Array.isArray(b.customPolicyFields)
        ? b.customPolicyFields.filter((f) => f && String(f.label || '').trim()).map((f) => ({ label: String(f.label).trim(), value: String(f.value || '').trim() }))
        : (current.customPolicyFields || [])
    };

    const now = new Date().toISOString();
    sqliteDb.prepare(`
      INSERT OR REPLACE INTO local_school_gateway_settings (tenant_id, settings_json, is_synced, updated_at)
      VALUES (?, ?, 0, ?)
    `).run(tid, JSON.stringify(next), now);

    recordAudit(tid, {
      operatorName: String(req.headers['x-user-name'] || 'School Owner'),
      operatorRole: 'School Owner',
      actionType: 'Fee Collection Receipt',
      category: 'Financial',
      entityId: `PGW-SETTINGS-${tid}`,
      entityDescription: 'Updated School Payment Gateway Policy & Settings',
      details: `StudentOnline=${next.allowOnlineStudentPayment}, ParentOnline=${next.allowOnlineParentPayment}, RequireProof=${next.requireProofReference}, 1BillPrefix=${next.oneBillPrefix}`,
      severity: 'Authorized Override'
    });

    if (db) {
      try {
        await setDoc(doc(db, 'school_gateway_settings', tid), { tenant_id: tid, ...next, is_synced: 1, synced_at: now }, { merge: true });
      } catch {}
    }

    res.json({ ok: true, settings: next });
  });

  router.get('/payment-transactions', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    const nameMaps = getBranchWingNameMaps(tid);
    const filterGatewayId = String(req.query?.gatewayId || '').trim();
    const filterStatus = String(req.query?.status || '').trim().toUpperCase();
    const filterStudentId = String(req.query?.studentId || '').trim();
    const filterQ = String(req.query?.q || '').trim().toLowerCase();

    let transactions = [];
    if (sqliteDb) {
      const scopeSql = buildScopeSql(scope);
      const rows = sqliteDb.prepare(`SELECT * FROM local_school_payment_transactions WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`).all(tid, ...scopeSql.params);
      transactions = rows.map((r) => mapPaymentTransactionRow(r, tid, nameMaps));
    }

    const filtered = transactions.filter((tx) => {
      if (filterGatewayId && tx.gatewayId !== filterGatewayId) return false;
      if (filterStatus && filterStatus !== 'ALL' && String(tx.status).toUpperCase() !== filterStatus) return false;
      if (filterStudentId && tx.studentId !== filterStudentId) return false;
      if (filterQ) {
        const hay = `${tx.txnRef} ${tx.challanNo} ${tx.studentName} ${tx.rollNo} ${tx.grade} ${tx.gatewayName} ${tx.proofReference}`.toLowerCase();
        if (!hay.includes(filterQ)) return false;
      }
      return true;
    });

    const byGateway = {};
    let totalVerifiedAmount = 0;
    let totalPendingAmount = 0;
    let pendingCount = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;

    for (const tx of transactions) {
      const st = String(tx.status || '').toUpperCase();
      if (!byGateway[tx.gatewayId]) {
        byGateway[tx.gatewayId] = {
          gatewayId: tx.gatewayId,
          gatewayName: tx.gatewayName,
          providerKey: tx.providerKey,
          verifiedAmount: 0,
          pendingAmount: 0,
          verifiedCount: 0,
          pendingCount: 0,
          totalCount: 0
        };
      }
      const bucket = byGateway[tx.gatewayId];
      bucket.totalCount += 1;
      if (st === 'VERIFIED' || st === 'SETTLED') {
        totalVerifiedAmount += Number(tx.totalAmount || 0);
        verifiedCount += 1;
        bucket.verifiedAmount += Number(tx.totalAmount || 0);
        bucket.verifiedCount += 1;
      } else if (st === 'PENDING_VERIFICATION') {
        totalPendingAmount += Number(tx.totalAmount || 0);
        pendingCount += 1;
        bucket.pendingAmount += Number(tx.totalAmount || 0);
        bucket.pendingCount += 1;
      } else if (st === 'REJECTED') {
        rejectedCount += 1;
      }
    }

    res.json({
      ok: true,
      tenantId: tid,
      transactions: filtered,
      summary: {
        totalCount: transactions.length,
        verifiedCount,
        pendingCount,
        rejectedCount,
        totalVerifiedAmount,
        totalPendingAmount,
        byGateway
      }
    });
  });

  router.post('/payment-transactions', async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const nameMaps = getBranchWingNameMaps(tid);
    ensureTenantPaymentGatewaysSeeded(tid);

    const settings = loadTenantGatewaySettings(tid);
    const reqRole = resolveUserRole(req) || 'owner';
    const isOwner = OWNER_ROLES.has(reqRole);
    const isSelfPortal = reqRole === 'student' || reqRole === 'parent';

    if (reqRole === 'student' && !settings.allowOnlineStudentPayment) {
      return res.status(403).json({ ok: false, error: 'STUDENT_ONLINE_PAY_DISABLED', message: 'Online fee payments are currently disabled for the Student Portal by the School Owner.' });
    }
    if (reqRole === 'parent' && !settings.allowOnlineParentPayment) {
      return res.status(403).json({ ok: false, error: 'PARENT_ONLINE_PAY_DISABLED', message: 'Online fee payments are currently disabled for the Parent Portal by the School Owner.' });
    }

    const b = req.body || {};
    const gatewayId = String(b.gatewayId || '').trim();
    const gwRow = gatewayId
      ? sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE id = ? AND tenant_id = ?').get(gatewayId, tid)
      : sqliteDb.prepare('SELECT * FROM local_school_payment_gateways WHERE tenant_id = ? AND is_enabled = 1 ORDER BY is_default DESC, sort_order ASC LIMIT 1').get(tid);

    if (!gwRow) return res.status(404).json({ ok: false, message: 'Selected payment gateway not found.' });
    if (gwRow.is_enabled === 0) return res.status(400).json({ ok: false, message: `${gwRow.display_name} is currently disabled by the School Owner.` });

    let allowedPortals = ['owner', 'principal', 'accountant', 'student', 'parent'];
    try {
      const parsed = JSON.parse(gwRow.allowed_portals_json || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) allowedPortals = parsed;
    } catch {}
    if (!isOwner && !allowedPortals.includes(reqRole)) {
      return res.status(403).json({ ok: false, error: 'PORTAL_GATEWAY_RESTRICTED', message: `${gwRow.display_name} is not enabled for the ${reqRole} portal.` });
    }

    const studentName = String(b.studentName || '').trim();
    const baseAmount = Number(b.baseAmount ?? b.amount ?? 0);
    if (!studentName || !Number.isFinite(baseAmount) || baseAmount <= 0) {
      return res.status(400).json({ ok: false, message: 'Valid studentName and positive baseAmount are required.' });
    }

    const proofReference = String(b.proofReference || b.resourceReference || '').trim();
    if (isSelfPortal && gwRow.verification_mode === 'slip_review' && settings.requireProofReference && !proofReference) {
      return res.status(400).json({ ok: false, message: 'Transaction / Slip Reference ID is required by School Owner policy for verification.' });
    }

    const screenshotCheck = validateProofScreenshot(b.proofScreenshot);
    if (!screenshotCheck.ok) {
      return res.status(400).json({ ok: false, message: screenshotCheck.message });
    }

    const challanNo = String(b.challanNo || `CH-2026-${b.rollNo || Date.now().toString().slice(-4)}`).trim();
    const targetStudentId = String(b.studentId || '').trim();
    const allowDuplicate = Boolean(b.allowDuplicate);

    if (!allowDuplicate) {
      if (challanNo) {
        const existingPaidTxn = sqliteDb.prepare(
          "SELECT id, txn_ref, submitted_by_role FROM local_school_payment_transactions WHERE tenant_id = ? AND challan_no = ? AND UPPER(status) IN ('VERIFIED', 'SETTLED') LIMIT 1"
        ).get(tid, challanNo);
        const existingPaidFee = sqliteDb.prepare(
          "SELECT id, challan_no FROM local_school_fees WHERE tenant_id = ? AND challan_no = ? AND UPPER(status) = 'PAID' LIMIT 1"
        ).get(tid, challanNo);
        if (existingPaidTxn || existingPaidFee) {
          return res.status(409).json({
            ok: false,
            error: 'ALREADY_PAID',
            message: `Fee challan #${challanNo} is already paid (${existingPaidTxn ? `TXN ${existingPaidTxn.txn_ref}` : 'Settled Receipt'}). Duplicate payment is blocked.`
          });
        }
        if (isSelfPortal) {
          const pendingSameChallan = sqliteDb.prepare(
            "SELECT id, txn_ref FROM local_school_payment_transactions WHERE tenant_id = ? AND challan_no = ? AND UPPER(status) = 'PENDING_VERIFICATION' AND ABS(base_amount - ?) < 0.01 LIMIT 1"
          ).get(tid, challanNo, baseAmount);
          if (pendingSameChallan) {
            return res.status(409).json({
              ok: false,
              error: 'PENDING_SLIP_EXISTS',
              message: `A payment slip (${pendingSameChallan.txn_ref}) for challan #${challanNo} is already submitted and awaiting verification.`
            });
          }
        }
      }

      if (isSelfPortal && targetStudentId) {
        const stuRow = sqliteDb.prepare('SELECT id, fee_status, due_bakaya FROM local_school_students WHERE id = ? AND tenant_id = ?').get(targetStudentId, tid);
        const openChallan = sqliteDb.prepare(
          "SELECT id FROM local_school_fees WHERE tenant_id = ? AND student_id = ? AND UPPER(status) IN ('PENDING', 'OVERDUE', 'PARTIAL') LIMIT 1"
        ).get(tid, targetStudentId);
        if (stuRow && String(stuRow.fee_status || '').toUpperCase() === 'PAID' && Number(stuRow.due_bakaya ?? 0) <= 0 && !openChallan) {
          return res.status(409).json({
            ok: false,
            error: 'STUDENT_ALREADY_PAID',
            message: `${studentName}'s fee is already marked Paid. No additional payment is required.`
          });
        }
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

    let resolvedStatus = 'PENDING_VERIFICATION';
    if (isSelfPortal) {
      resolvedStatus = gwRow.verification_mode === 'auto_instant' ? 'VERIFIED' : 'PENDING_VERIFICATION';
    } else {
      const requested = String(b.status || '').trim().toUpperCase();
      if (requested === 'VERIFIED' || requested === 'SETTLED') {
        resolvedStatus = requested;
      } else if (requested === 'PENDING_VERIFICATION') {
        resolvedStatus = 'PENDING_VERIFICATION';
      } else {
        resolvedStatus = gwRow.verification_mode === 'slip_review' && !b.markVerified ? 'PENDING_VERIFICATION' : 'VERIFIED';
      }
    }

    const id = 'PGTX-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
    const txnRef = String(b.txnRef || `${gwRow.provider_key.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`).trim();
    const branchId = String(b.branchId || scope.writeBranchId || DEFAULT_BRANCH_ID);
    const wingId = String(b.wingId || scope.writeWingId || DEFAULT_WING_ID);
    const submittedByName = String(b.submittedByName || req.headers['x-user-name'] || studentName).trim();
    const now = new Date().toISOString();
    const verifiedBy = (resolvedStatus === 'VERIFIED' || resolvedStatus === 'SETTLED') ? submittedByName : '';
    const verifiedAt = (resolvedStatus === 'VERIFIED' || resolvedStatus === 'SETTLED') ? now : '';

    sqliteDb.prepare(`
      INSERT INTO local_school_payment_transactions (
        id, tenant_id, branch_id, wing_id, txn_ref, challan_no, gateway_id, gateway_name, provider_key,
        student_id, student_name, roll_no, grade, guardian_name, payer_phone, payer_account_title,
        month, base_amount, gateway_fee, total_amount, currency, status, verification_mode,
        proof_reference, proof_notes, proof_screenshot, submitted_by_name, submitted_by_role, verified_by, verified_at,
        rejection_reason, linked_fee_id, custom_fields_json, is_synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, 0, ?, ?)
    `).run(
      id, tid, branchId, wingId, txnRef, challanNo, gwRow.id, gwRow.display_name, gwRow.provider_key,
      targetStudentId, enc(tid, studentName), String(b.rollNo || ''), String(b.grade || 'Campus'),
      enc(tid, String(b.guardianName || '')), enc(tid, String(b.payerPhone || '')), enc(tid, String(b.payerAccountTitle || '')),
      String(b.month || 'Current Session Fee'), baseAmount, gatewayFee, totalAmount, String(settings.currency || 'PKR'),
      resolvedStatus, gwRow.verification_mode, proofReference, String(b.proofNotes || ''), screenshotCheck.value,
      submittedByName, reqRole, verifiedBy, verifiedAt,
      JSON.stringify(b.customFields && typeof b.customFields === 'object' ? b.customFields : {}),
      now, now
    );

    let linkedFeeId = '';
    if (resolvedStatus === 'VERIFIED' || resolvedStatus === 'SETTLED') {
      const inserted = sqliteDb.prepare('SELECT * FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').get(id, tid);
      linkedFeeId = settleFeeForGatewayTransaction(tid, inserted, verifiedBy || submittedByName, reqRole, scope);
      if (linkedFeeId) {
        sqliteDb.prepare('UPDATE local_school_payment_transactions SET linked_fee_id = ?, is_synced = 0 WHERE id = ? AND tenant_id = ?').run(linkedFeeId, id, tid);
      }
    }

    const finalRow = sqliteDb.prepare('SELECT * FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').get(id, tid);
    const transaction = mapPaymentTransactionRow(finalRow, tid, nameMaps);

    recordAudit(tid, {
      branchId,
      wingId,
      operatorName: submittedByName,
      operatorRole: reqRole === 'accountant' ? 'Accountant / Fee Clerk' : (reqRole === 'principal' ? 'Principal' : 'School Owner'),
      actionType: 'Fee Collection Receipt',
      category: 'Financial',
      entityId: txnRef,
      entityDescription: `${studentName} (${transaction.grade}) via ${gwRow.display_name}`,
      details: `Gateway payment PKR ${totalAmount} (Base ${baseAmount} + Fee ${gatewayFee}) · Ref: ${proofReference || txnRef}${screenshotCheck.value ? ' · Slip Screenshot Attached' : ''} · Status: ${resolvedStatus}.`,
      severity: 'Normal Audit'
    });

    if (db) {
      try {
        await setDoc(doc(db, 'school_payment_transactions', id), {
          ...transaction,
          proofScreenshot: (transaction.proofScreenshot && transaction.proofScreenshot.length <= 450000) ? transaction.proofScreenshot : '',
          hasProofScreenshot: Boolean(transaction.proofScreenshot),
          tenant_id: tid,
          studentName: enc(tid, transaction.studentName),
          payerPhone: enc(tid, transaction.payerPhone),
          is_synced: 1,
          synced_at: now
        }, { merge: true });
      } catch {}
    }

    res.status(201).json({ ok: true, transaction, linkedFeeId });
  });

  router.put('/payment-transactions/:id/verify', rejectRestrictedRole(['student', 'parent', 'teacher']), async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const nameMaps = getBranchWingNameMaps(tid);

    const id = req.params.id;
    const row = sqliteDb.prepare('SELECT * FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Payment transaction not found.' });
    const scopeErr = assertRecordScopeAllowed(scope, row);
    if (scopeErr) return res.status(scopeErr.status).json({ ok: false, error: scopeErr.error, message: scopeErr.message });

    const b = req.body || {};
    const nextStatus = String(b.status || 'VERIFIED').trim().toUpperCase();
    if (!['VERIFIED', 'SETTLED', 'REJECTED', 'PENDING_VERIFICATION'].includes(nextStatus)) {
      return res.status(400).json({ ok: false, message: 'Invalid verification status.' });
    }

    const reqRole = resolveUserRole(req) || 'accountant';
    const verifierName = String(b.verifiedBy || req.headers['x-user-name'] || (reqRole === 'owner' ? 'School Owner' : (reqRole === 'principal' ? 'Principal Office' : 'Accountant Desk'))).trim();
    const rejectionReason = nextStatus === 'REJECTED' ? String(b.rejectionReason || b.notes || 'Transaction reference not matched in bank/wallet statement.').trim() : '';
    const now = new Date().toISOString();

    let linkedFeeId = row.linked_fee_id || '';
    if ((nextStatus === 'VERIFIED' || nextStatus === 'SETTLED') && !linkedFeeId) {
      const settings = loadTenantGatewaySettings(tid);
      if (settings.autoIssueReceiptOnVerify !== false) {
        linkedFeeId = settleFeeForGatewayTransaction(tid, row, verifierName, reqRole, scope);
      }
    }

    sqliteDb.prepare(`
      UPDATE local_school_payment_transactions
      SET status = ?, verified_by = ?, verified_at = ?, rejection_reason = ?, linked_fee_id = ?, is_synced = 0, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).run(nextStatus, verifierName, now, rejectionReason, linkedFeeId, now, id, tid);

    const updated = sqliteDb.prepare('SELECT * FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').get(id, tid);
    const transaction = mapPaymentTransactionRow(updated, tid, nameMaps);

    recordAudit(tid, {
      branchId: updated.branch_id || scope.writeBranchId,
      wingId: updated.wing_id || scope.writeWingId,
      operatorName: verifierName,
      operatorRole: reqRole === 'accountant' ? 'Accountant / Fee Clerk' : (reqRole === 'principal' ? 'Principal' : 'School Owner'),
      actionType: 'Fee Collection Receipt',
      category: 'Financial',
      entityId: updated.txn_ref,
      entityDescription: `Gateway Txn ${nextStatus}: ${transaction.studentName}`,
      details: `${transaction.gatewayName} PKR ${transaction.totalAmount} marked ${nextStatus} by ${verifierName}.${rejectionReason ? ' Reason: ' + rejectionReason : ''}`,
      severity: nextStatus === 'REJECTED' ? 'Compliance Flag' : 'Normal Audit'
    });

    if (db) {
      try {
        await setDoc(doc(db, 'school_payment_transactions', id), {
          ...transaction,
          proofScreenshot: (transaction.proofScreenshot && transaction.proofScreenshot.length <= 450000) ? transaction.proofScreenshot : '',
          hasProofScreenshot: Boolean(transaction.proofScreenshot),
          tenant_id: tid,
          is_synced: 1,
          synced_at: now
        }, { merge: true });
      } catch {}
    }

    res.json({ ok: true, transaction, linkedFeeId });
  });

  router.put('/payment-transactions/:id', requireOwnerRole, async (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const nameMaps = getBranchWingNameMaps(tid);

    const id = req.params.id;
    const row = sqliteDb.prepare('SELECT * FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Payment transaction not found.' });

    const b = req.body || {};
    const baseAmount = b.baseAmount !== undefined ? Number(b.baseAmount) : Number(row.base_amount);
    const gatewayFee = b.gatewayFee !== undefined ? Number(b.gatewayFee) : Number(row.gateway_fee);
    if (!Number.isFinite(baseAmount) || baseAmount <= 0 || !Number.isFinite(gatewayFee) || gatewayFee < 0) {
      return res.status(400).json({ ok: false, message: 'Invalid transaction amount values.' });
    }
    let nextScreenshot = row.proof_screenshot || '';
    if (b.proofScreenshot !== undefined) {
      const scCheck = validateProofScreenshot(b.proofScreenshot);
      if (!scCheck.ok) return res.status(400).json({ ok: false, message: scCheck.message });
      nextScreenshot = scCheck.value;
    }

    const totalAmount = baseAmount + gatewayFee;
    const nextStatus = b.status !== undefined ? String(b.status).trim().toUpperCase() : row.status;
    const now = new Date().toISOString();

    sqliteDb.prepare(`
      UPDATE local_school_payment_transactions
      SET student_name = ?, grade = ?, challan_no = ?, base_amount = ?, gateway_fee = ?, total_amount = ?,
          proof_reference = ?, proof_notes = ?, proof_screenshot = ?, status = ?, is_synced = 0, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).run(
      b.studentName !== undefined ? enc(tid, String(b.studentName)) : row.student_name,
      b.grade !== undefined ? String(b.grade) : row.grade,
      b.challanNo !== undefined ? String(b.challanNo) : row.challan_no,
      baseAmount,
      gatewayFee,
      totalAmount,
      b.proofReference !== undefined ? String(b.proofReference) : row.proof_reference,
      b.proofNotes !== undefined ? String(b.proofNotes) : row.proof_notes,
      nextScreenshot,
      nextStatus,
      now,
      id,
      tid
    );

    let updated = sqliteDb.prepare('SELECT * FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').get(id, tid);
    if ((nextStatus === 'VERIFIED' || nextStatus === 'SETTLED') && !updated.linked_fee_id) {
      const linkedFeeId = settleFeeForGatewayTransaction(tid, updated, String(req.headers['x-user-name'] || 'School Owner'), 'owner', scope);
      if (linkedFeeId) {
        sqliteDb.prepare('UPDATE local_school_payment_transactions SET linked_fee_id = ?, verified_by = COALESCE(NULLIF(verified_by, \'\'), ?), verified_at = COALESCE(NULLIF(verified_at, \'\'), ?), is_synced = 0 WHERE id = ? AND tenant_id = ?')
          .run(linkedFeeId, String(req.headers['x-user-name'] || 'School Owner'), now, id, tid);
        updated = sqliteDb.prepare('SELECT * FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').get(id, tid);
      }
    }

    const transaction = mapPaymentTransactionRow(updated, tid, nameMaps);
    res.json({ ok: true, transaction });
  });

  router.delete('/payment-transactions/:id', requireOwnerRole, (req, res) => {
    const tid = resolveTenantId(req);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });
    const id = req.params.id;
    const row = sqliteDb.prepare('SELECT * FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').get(id, tid);
    if (!row) return res.status(404).json({ ok: false, message: 'Payment transaction not found.' });

    sqliteDb.prepare('DELETE FROM local_school_payment_transactions WHERE id = ? AND tenant_id = ?').run(id, tid);
    recordAudit(tid, {
      branchId: row.branch_id || DEFAULT_BRANCH_ID,
      wingId: row.wing_id || DEFAULT_WING_ID,
      operatorName: String(req.headers['x-user-name'] || 'School Owner'),
      operatorRole: 'School Owner',
      actionType: 'Fee Voucher Deletion',
      category: 'Financial',
      entityId: row.txn_ref || id,
      entityDescription: `Deleted Payment Transaction (${dec(tid, row.student_name)})`,
      severity: 'Compliance Flag'
    });
    res.json({ ok: true, id });
  });

  // --- HARDWARE BARCODE SCANNER UNIFIED LOOKUP (Challan #, Txn Ref, Student ID / Roll #, RFID) ---
  router.get('/barcode-lookup', (req, res) => {
    const tid = resolveTenantId(req);
    const scope = resolveBranchWingScope(req);
    if (scope.errorStatus) return sendScopeError(res, scope);
    if (!sqliteDb) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    const rawCode = String(req.query.code || '').trim();
    if (!rawCode) {
      return res.status(400).json({ ok: false, message: 'code query parameter is required.' });
    }

    const norm = rawCode.toLowerCase();
    const strippedRollMatch = rawCode.match(/^(?:ch|chln|stu|st|adm|roll)[-_]?(?:\d{4}[-_])?(.+)$/i);
    const candidateRoll = strippedRollMatch ? strippedRollMatch[1].trim().toLowerCase() : '';
    const nameMaps = getBranchWingNameMaps(tid);
    const scopeSql = buildScopeSql(scope);

    let studentRow = null;
    let feeRows = [];
    let txnRows = [];

    try {
      const txCandidates = sqliteDb.prepare(
        `SELECT * FROM local_school_payment_transactions WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`
      ).all(tid, ...scopeSql.params);
      txnRows = txCandidates.filter((r) => {
        const ref = String(r.txn_ref || '').trim().toLowerCase();
        const ch = String(r.challan_no || '').trim().toLowerCase();
        const id = String(r.id || '').trim().toLowerCase();
        const roll = String(r.roll_no || '').trim().toLowerCase();
        return ref === norm || ch === norm || id === norm || (roll && (roll === norm || (candidateRoll && roll === candidateRoll)));
      });

      const feeCandidates = sqliteDb.prepare(
        `SELECT * FROM local_school_fees WHERE tenant_id = ?${scopeSql.sql} ORDER BY created_at DESC`
      ).all(tid, ...scopeSql.params);
      feeRows = feeCandidates.filter((r) => {
        const ch = String(r.challan_no || '').trim().toLowerCase();
        const id = String(r.id || '').trim().toLowerCase();
        const sid = String(r.student_id || '').trim().toLowerCase();
        const roll = String(r.roll_no || '').trim().toLowerCase();
        return ch === norm || id === norm || sid === norm ||
          (roll && (roll === norm || (candidateRoll && roll === candidateRoll)));
      });

      const stuCandidates = sqliteDb.prepare(
        `SELECT * FROM local_school_students WHERE tenant_id = ?${scopeSql.sql}`
      ).all(tid, ...scopeSql.params);
      studentRow = stuCandidates.find((s) => {
        const sid = String(s.id || '').trim().toLowerCase();
        const roll = String(s.roll_no || '').trim().toLowerCase();
        const rfid = String(s.rfid_card || '').trim().toLowerCase();
        return sid === norm || roll === norm || (rfid && rfid === norm) ||
          (candidateRoll && (roll === candidateRoll || sid === candidateRoll));
      }) || null;

      if (!studentRow && (feeRows[0] || txnRows[0])) {
        const targetSid = String((feeRows[0] || txnRows[0]).student_id || '').trim().toLowerCase();
        const targetRoll = String((feeRows[0] || txnRows[0]).roll_no || '').trim().toLowerCase();
        studentRow = stuCandidates.find((s) =>
          (targetSid && String(s.id || '').trim().toLowerCase() === targetSid) ||
          (targetRoll && String(s.roll_no || '').trim().toLowerCase() === targetRoll)
        ) || null;
      }

      if (studentRow && feeRows.length === 0) {
        const sId = String(studentRow.id || '').trim().toLowerCase();
        const sRoll = String(studentRow.roll_no || '').trim().toLowerCase();
        feeRows = feeCandidates.filter((r) =>
          (sId && String(r.student_id || '').trim().toLowerCase() === sId) ||
          (sRoll && String(r.roll_no || '').trim().toLowerCase() === sRoll)
        );
      }
      if (studentRow && txnRows.length === 0) {
        const sId = String(studentRow.id || '').trim().toLowerCase();
        const sRoll = String(studentRow.roll_no || '').trim().toLowerCase();
        txnRows = txCandidates.filter((r) =>
          (sId && String(r.student_id || '').trim().toLowerCase() === sId) ||
          (sRoll && String(r.roll_no || '').trim().toLowerCase() === sRoll)
        );
      }
    } catch {}

    const mappedFees = feeRows.map((r) => mapFeeRow(r, tid, nameMaps));
    const mappedTxns = txnRows.map((r) => mapPaymentTransactionRow(r, tid, nameMaps));
    const openChallan = mappedFees.find((f) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(String(f.status || '').toUpperCase())) || null;
    const paidChallan = mappedFees.find((f) => String(f.status || '').toUpperCase() === 'PAID') || null;
    const latestTransaction = mappedTxns[0] || null;
    const student = studentRow ? mapStudentRow(studentRow, tid, nameMaps) : null;

    let matchType = 'none';
    if (latestTransaction && (String(latestTransaction.txnRef || '').toLowerCase() === norm || String(latestTransaction.challanNo || '').toLowerCase() === norm)) {
      matchType = 'transaction';
    } else if (openChallan || paidChallan) {
      matchType = 'challan';
    } else if (student) {
      matchType = 'student';
    }

    res.json({
      ok: true,
      code: rawCode,
      normalizedCode: candidateRoll || norm,
      matchType,
      student,
      openChallan,
      paidChallan,
      latestTransaction
    });
  });

  return router;
}
