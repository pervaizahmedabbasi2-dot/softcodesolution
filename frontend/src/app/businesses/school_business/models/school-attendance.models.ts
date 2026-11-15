export type AttendanceMemberCategory = 'student' | 'teacher' | 'staff';

export type AttendanceVerificationMode = 'strict' | 'standard' | 'lite';

export type AttendancePortalContext = 'owner' | 'principal' | 'teacher' | 'student' | 'staff';

export interface StaffMemberRecord {
  id: string;
  empCode: string;
  name: string;
  roleTitle: string;
  department: string;
  phone: string;
  shift: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | string;
  attendanceStatus: 'Present' | 'Late' | 'Absent' | 'On Leave';
  faceEnrolled?: boolean;
  liteEnabled?: boolean;
  image?: string;
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
}

export interface RoleAttendancePermission {
  enabled: boolean;
  canScanStudents: boolean;
  canScanTeachers: boolean;
  canScanStaff: boolean;
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
  confidenceThreshold: number;
  liteConfidenceThreshold: number;
  lateCutoffTime: string;
  twoPunchEnabled: boolean;
  checkOutEnableTime: string;
  categories: {
    student: CategoryAttendanceRule;
    teacher: CategoryAttendanceRule;
    staff: CategoryAttendanceRule;
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
  verifiedBy: string;
  markedByRole: string;
  snapshotData?: string;
}

export interface AttendanceMemberView {
  id: string;
  category: AttendanceMemberCategory;
  name: string;
  code: string;
  subLabel: string;
  sectionOrDept: string;
  phone: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  monthlyRate: string;
  image: string;
  faceProfile?: FaceProfileRecord | null;
  liteEnabled: boolean;
  isEnrolled: boolean;
  checkInTime: string;
  checkOutTime: string;
  durationLabel: string;
  punchState: 'Checked OUT' | 'Checked IN' | 'On Leave' | 'Absent' | 'Pending';
  lastConfidence: number;
  verifiedMethod: string;
  totalInCount: number;
  totalOutCount: number;
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
    confidenceThreshold: 76,
    liteConfidenceThreshold: 66,
    lateCutoffTime: '08:15',
    twoPunchEnabled: true,
    checkOutEnableTime: '13:30',
    categories: {
      student: { enabled: true, liteEnabled: true, cameraRequired: true, allowSelfCheckIn: false },
      teacher: { enabled: true, liteEnabled: true, cameraRequired: true, allowSelfCheckIn: true },
      staff: { enabled: true, liteEnabled: true, cameraRequired: true, allowSelfCheckIn: true }
    },
    roleAccess: {
      principal: {
        enabled: true,
        canScanStudents: true,
        canScanTeachers: true,
        canScanStaff: true,
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
