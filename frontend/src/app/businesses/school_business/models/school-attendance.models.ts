export type AttendanceMemberCategory = 'student' | 'teacher' | 'staff' | 'principal';

export type AttendanceVerificationMode = 'strict' | 'standard' | 'lite';

export type AttendanceVerificationChannel = 'face' | 'fingerprint';

export type FingerprintScannerType = 'device_webauthn' | 'optical_image';

export type AttendancePortalContext = 'owner' | 'principal' | 'teacher' | 'student' | 'staff';

export interface SchoolBranchRecord {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  principalName: string;
  accountantName?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  establishedYear?: string;
  createdAt?: string;
}

export type SchoolWingType = 'Montessori' | 'Junior' | 'Middle' | 'Senior' | 'Girls' | 'Boys' | 'Evening' | 'General';

export interface SchoolWingRecord {
  id: string;
  branchId: string;
  code?: string;
  name: string;
  type: SchoolWingType;
  wingType?: SchoolWingType;
  gradeRange: string;
  headName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface StaffMemberRecord {
  id: string;
  empCode: string;
  name: string;
  fatherName?: string;
  cnic?: string;
  passportNo?: string;
  nationality?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  roleTitle: string;
  department: string;
  phone: string;
  emergencyContact?: string;
  email?: string;
  address?: string;
  shift: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | string;
  attendanceStatus: 'Present' | 'Late' | 'Absent' | 'On Leave';
  faceEnrolled?: boolean;
  fingerprintEnrolled?: boolean;
  liteEnabled?: boolean;
  image?: string;
  branchId?: string;
  branchName?: string;
  wingId?: string;
  wingName?: string;
  wingScopeLocked?: boolean;
  portalUserId?: string;
}

export interface PrincipalMemberRecord {
  id: string;
  empCode: string;
  name: string;
  fatherName?: string;
  cnic?: string;
  passportNo?: string;
  nationality?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  roleTitle: string;
  department: string;
  phone: string;
  emergencyContact?: string;
  email?: string;
  address?: string;
  shift: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | string;
  attendanceStatus: 'Present' | 'Late' | 'Absent' | 'On Leave';
  faceEnrolled?: boolean;
  fingerprintEnrolled?: boolean;
  liteEnabled?: boolean;
  image?: string;
  branchId?: string;
  branchName?: string;
  wingId?: string;
  wingName?: string;
  wingScopeLocked?: boolean;
  portalUserId?: string;
}

export interface FaceProfileRecord {
  id: string;
  memberId: string;
  memberCategory: AttendanceMemberCategory;
  memberName: string;
  memberCode: string;
  gradeOrDept: string;
  faceDescriptor: number[];
  facePhotoData: string;
  faceHash: string;
  qualityScore: number;
  liteEnabled: boolean;
  enrolledBy: string;
  enrolledAt: string;
  branchId?: string;
  branchName?: string;
  wingId?: string;
  wingName?: string;
}

export interface FingerprintProfileRecord {
  id: string;
  memberId: string;
  memberCategory: AttendanceMemberCategory;
  memberName: string;
  memberCode: string;
  gradeOrDept: string;
  fingerLabel: string;
  scannerType: FingerprintScannerType;
  credentialId: string;
  publicKeySpki?: string;
  fingerprintDescriptor: number[];
  fingerprintPreviewData: string;
  fingerprintHash: string;
  qualityScore: number;
  liteEnabled: boolean;
  enrolledBy: string;
  enrolledAt: string;
  branchId?: string;
  branchName?: string;
  wingId?: string;
  wingName?: string;
}

export interface RoleAttendancePermission {
  enabled: boolean;
  canScanStudents: boolean;
  canScanTeachers: boolean;
  canScanStaff: boolean;
  canScanPrincipal?: boolean;
  canEnrollFaces: boolean;
  liteModeAllowed: boolean;
  manualFallbackAllowed: boolean;
  canExportReports: boolean;
  selfCheckInEnabled?: boolean;
}

export interface CategoryAttendanceRule {
  enabled: boolean;
  liteEnabled: boolean;
  cameraRequired: boolean;
  allowSelfCheckIn: boolean;
}

export interface OwnerAttendancePolicy {
  verificationMode: AttendanceVerificationMode;
  liteModeEnabled: boolean;
  cameraFillLightEnabled: boolean;
  fillLightColor: 'neutral' | 'warm' | 'bright';
  livenessCheckEnabled: boolean;
  autoCaptureOnMatch: boolean;
  requireCameraForAllAttendance: boolean;
  allowFingerprintAttendance?: boolean;
  confidenceThreshold: number;
  fingerprintConfidenceThreshold?: number;
  liteConfidenceThreshold: number;
  scheduledStartTime: string;
  lateCutoffTime: string;
  twoPunchEnabled: boolean;
  checkOutEnableTime: string;
  categories: {
    student: CategoryAttendanceRule;
    teacher: CategoryAttendanceRule;
    staff: CategoryAttendanceRule;
    principal: CategoryAttendanceRule;
  };
  roleAccess: {
    principal: RoleAttendancePermission;
    teacher: RoleAttendancePermission;
    staff: RoleAttendancePermission;
    student: RoleAttendancePermission;
  };
  operatorOverrides: Record<string, { enabled: boolean; liteEnabled: boolean; note?: string }>;
}

export interface FaceVerificationLogRecord {
  id: string;
  timestamp: string;
  date: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  memberCategory: AttendanceMemberCategory;
  gradeOrDept: string;
  verificationMode: string;
  confidenceScore: number;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Rejected';
  punchType?: 'IN' | 'OUT';
  scheduledStartTime?: string;
  lateMinutes?: number;
  lateByLabel?: string;
  gateName?: string;
  remarks?: string;
  verifiedBy: string;
  markedByRole: string;
  snapshotData?: string;
  branchId?: string;
  branchName?: string;
  wingId?: string;
  wingName?: string;
}

export type LateSeverityKind = 'early' | 'on_time' | 'grace' | 'late' | 'none';

export interface AttendanceMemberView {
  id: string;
  category: AttendanceMemberCategory;
  name: string;
  code: string;
  subLabel: string;
  sectionOrDept: string;
  fatherName: string;
  guardianRelation: string;
  cnicBForm: string;
  guardianCnic: string;
  passportNo: string;
  nationality: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  phone: string;
  emergencyContact: string;
  email: string;
  address: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  monthlyRate: string;
  image: string;
  faceProfile?: FaceProfileRecord | null;
  fingerprintProfile?: FingerprintProfileRecord | null;
  liteEnabled: boolean;
  isEnrolled: boolean;
  isFingerprintEnrolled?: boolean;
  scheduledStartTime: string;
  checkInTime: string;
  lateMinutes: number | null;
  lateByLabel: string;
  lateSeverity: LateSeverityKind;
  checkOutTime: string;
  durationLabel: string;
  punchState: 'Checked OUT' | 'Checked IN' | 'On Leave' | 'Absent' | 'Pending';
  lastConfidence: number;
  verifiedMethod: string;
  totalInCount: number;
  totalOutCount: number;
  gateOrLocation: string;
  markedBy: string;
  remarks: string;
}

export type AttendanceColumnKey =
  | 'code'
  | 'member'
  | 'category'
  | 'classDept'
  | 'fatherName'
  | 'cnicBForm'
  | 'guardianCnic'
  | 'passportNo'
  | 'nationality'
  | 'gender'
  | 'dob'
  | 'bloodGroup'
  | 'phone'
  | 'emergencyContact'
  | 'email'
  | 'address'
  | 'scheduledStartTime'
  | 'checkInTime'
  | 'lateByLabel'
  | 'checkOutTime'
  | 'durationLabel'
  | 'verifyFace'
  | 'verifiedMethod'
  | 'overallRate'
  | 'punchCounts'
  | 'gateOrLocation'
  | 'status'
  | 'remarks';

export type AttendanceColumnGroup = 'Identity' | 'Local & Int\'l IDs' | 'Personal & Contact' | 'Timing & Late Audit' | 'Verification & Summary';

export type AttendanceColumnPresetKey = 'essential' | 'local_official' | 'international' | 'all';

export interface AttendanceColumnDefinition {
  key: AttendanceColumnKey;
  label: string;
  shortLabel: string;
  group: AttendanceColumnGroup;
  description: string;
}

export const ATTENDANCE_COLUMN_DEFINITIONS: AttendanceColumnDefinition[] = [
  { key: 'code', label: 'Roll / Emp ID', shortLabel: 'ID / Roll', group: 'Identity', description: 'Unique roll number or employee code' },
  { key: 'member', label: 'Full Name & Avatar', shortLabel: 'Member Details', group: 'Identity', description: 'Candidate full name and contact subtitle' },
  { key: 'category', label: 'Role Category', shortLabel: 'Category', group: 'Identity', description: 'Student, Teacher, Staff, or Principal' },
  { key: 'classDept', label: 'Class / Role & Dept', shortLabel: 'Class / Dept', group: 'Identity', description: 'Class/Section or Designation & Department' },

  { key: 'fatherName', label: 'Father / Guardian Name', shortLabel: 'Father / Guardian', group: 'Local & Int\'l IDs', description: 'Father or legal guardian name & relation' },
  { key: 'cnicBForm', label: 'CNIC / NADRA B-Form', shortLabel: 'CNIC / B-Form', group: 'Local & Int\'l IDs', description: '13-digit national ID or student B-Form number' },
  { key: 'guardianCnic', label: 'Guardian CNIC', shortLabel: 'Guardian CNIC', group: 'Local & Int\'l IDs', description: 'Parent / guardian CNIC for student verification' },
  { key: 'passportNo', label: 'Passport / Int\'l ID', shortLabel: 'Passport / Int\'l', group: 'Local & Int\'l IDs', description: 'International passport or MOE registration ID' },
  { key: 'nationality', label: 'Nationality', shortLabel: 'Nationality', group: 'Local & Int\'l IDs', description: 'Citizenship / country for MOE compliance' },

  { key: 'gender', label: 'Gender', shortLabel: 'Gender', group: 'Personal & Contact', description: 'Male / Female demographic classification' },
  { key: 'dob', label: 'Date of Birth (DOB)', shortLabel: 'DOB', group: 'Personal & Contact', description: 'Official date of birth (YYYY-MM-DD)' },
  { key: 'bloodGroup', label: 'Blood Group', shortLabel: 'Blood', group: 'Personal & Contact', description: 'Emergency medical blood group' },
  { key: 'phone', label: 'Mobile / Phone', shortLabel: 'Phone', group: 'Personal & Contact', description: 'Primary mobile or guardian phone' },
  { key: 'emergencyContact', label: 'Emergency Contact', shortLabel: 'Emergency', group: 'Personal & Contact', description: 'Secondary emergency helpline number' },
  { key: 'email', label: 'Email Address', shortLabel: 'Email', group: 'Personal & Contact', description: 'Official or guardian email address' },
  { key: 'address', label: 'Residential Address', shortLabel: 'Address', group: 'Personal & Contact', description: 'Verified home or residential address' },

  { key: 'scheduledStartTime', label: 'Scheduled / Start Time', shortLabel: 'Start Time', group: 'Timing & Late Audit', description: 'Scheduled campus reporting start time' },
  { key: 'checkInTime', label: 'Check-In (IN)', shortLabel: 'Check-In (IN)', group: 'Timing & Late Audit', description: 'Exact arrival punch timestamp' },
  { key: 'lateByLabel', label: 'Late / Punctuality', shortLabel: 'Late / Timing', group: 'Timing & Late Audit', description: 'Exact minutes/hours early, grace, or late after scheduled start time' },
  { key: 'checkOutTime', label: 'Check-Out (OUT)', shortLabel: 'Check-Out (OUT)', group: 'Timing & Late Audit', description: 'Departure punch timestamp' },
  { key: 'durationLabel', label: 'Duration / State', shortLabel: 'Duration / State', group: 'Timing & Late Audit', description: 'Stay hours on campus and current IN/OUT state' },

  { key: 'verifyFace', label: 'Verify & Face Match', shortLabel: 'Verify & Face', group: 'Verification & Summary', description: 'Biometric enrollment & face match score (%)' },
  { key: 'verifiedMethod', label: 'Verification Method', shortLabel: 'Method', group: 'Verification & Summary', description: 'Auto Kiosk, Lite Camera, or Manual Override' },
  { key: 'overallRate', label: 'Monthly Rate / Shift', shortLabel: 'Overall Record', group: 'Verification & Summary', description: 'Cumulative attendance % or assigned shift' },
  { key: 'punchCounts', label: 'Total IN/OUT Punches', shortLabel: 'Punches', group: 'Verification & Summary', description: 'Cumulative IN and OUT scan counters' },
  { key: 'gateOrLocation', label: 'Gate / Terminal', shortLabel: 'Terminal / Gate', group: 'Verification & Summary', description: 'Camera kiosk or campus gate identifier' },
  { key: 'status', label: 'Attendance Status', shortLabel: 'Status', group: 'Verification & Summary', description: 'Present, Late, Absent, or On Leave' },
  { key: 'remarks', label: 'Audit Remarks / Notes', shortLabel: 'Remarks', group: 'Verification & Summary', description: 'Additional attendance or compliance remarks' }
];

const PRESET_KEY_SETS: Record<AttendanceColumnPresetKey, AttendanceColumnKey[]> = {
  essential: [
    'code',
    'member',
    'classDept',
    'scheduledStartTime',
    'checkInTime',
    'lateByLabel',
    'checkOutTime',
    'durationLabel',
    'verifyFace',
    'status'
  ],
  local_official: [
    'code',
    'member',
    'classDept',
    'fatherName',
    'cnicBForm',
    'scheduledStartTime',
    'checkInTime',
    'lateByLabel',
    'checkOutTime',
    'durationLabel',
    'verifyFace',
    'phone',
    'status'
  ],
  international: [
    'code',
    'member',
    'category',
    'classDept',
    'fatherName',
    'cnicBForm',
    'passportNo',
    'nationality',
    'gender',
    'dob',
    'phone',
    'email',
    'scheduledStartTime',
    'checkInTime',
    'lateByLabel',
    'checkOutTime',
    'durationLabel',
    'verifyFace',
    'gateOrLocation',
    'status'
  ],
  all: ATTENDANCE_COLUMN_DEFINITIONS.map((c) => c.key)
};

export function createDefaultColumnSelection(preset: AttendanceColumnPresetKey = 'local_official'): Record<AttendanceColumnKey, boolean> {
  const activeSet = new Set(PRESET_KEY_SETS[preset] || PRESET_KEY_SETS.local_official);
  const record = {} as Record<AttendanceColumnKey, boolean>;
  for (const col of ATTENDANCE_COLUMN_DEFINITIONS) {
    record[col.key] = activeSet.has(col.key);
  }
  return record;
}

export function createDefaultOwnerAttendancePolicy(): OwnerAttendancePolicy {
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
    fingerprintConfidenceThreshold: 78,
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

