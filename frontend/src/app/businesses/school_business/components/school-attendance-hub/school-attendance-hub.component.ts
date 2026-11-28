import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  ATTENDANCE_COLUMN_DEFINITIONS,
  AttendanceColumnDefinition,
  AttendanceColumnGroup,
  AttendanceColumnKey,
  AttendanceColumnPresetKey,
  AttendanceMemberCategory,
  AttendanceMemberView,
  AttendancePortalContext,
  AttendanceVerificationChannel,
  FaceProfileRecord,
  FaceVerificationLogRecord,
  FingerprintProfileRecord,
  LateSeverityKind,
  OwnerAttendancePolicy,
  PrincipalMemberRecord,
  RoleAttendancePermission,
  StaffMemberRecord,
  createDefaultColumnSelection,
  createDefaultOwnerAttendancePolicy
} from '../../models/school-attendance.models';
import {
  FaceBoxNormalized,
  FaceExtractionResult,
  FaceVerificationService
} from '../../../../services/face-verification.service';
import {
  FingerprintCaptureResult,
  FingerprintVerificationService
} from '../../../../services/fingerprint-verification.service';
import { SchoolTableDirective } from '../../directives/school-table.directive';
import { SchoolCustomFormFieldsComponent } from '../school-custom-form-fields/school-custom-form-fields.component';
import { SchoolAttendanceAnalyticsComponent } from '../school-attendance-analytics/school-attendance-analytics.component';
import { SchoolTableSchemaService } from '../../services/school-table-schema.service';
import { buildSchoolStatementA4Html } from '../../utils/school-statement-print.util';
import { printHtmlInHiddenFrame } from '../../utils/thermal-print.util';

export type AttendanceSubTab = 'terminal' | 'history' | 'students' | 'teachers' | 'staff' | 'principals' | 'enrollment' | 'setup';
export type ScannerCategoryFilter = 'all' | AttendanceMemberCategory;

@Component({
  selector: 'app-school-attendance-hub',
  imports: [CommonModule, LucideAngularModule, SchoolTableDirective, SchoolCustomFormFieldsComponent, SchoolAttendanceAnalyticsComponent],
  templateUrl: './school-attendance-hub.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
    '(document:keydown)': 'onGateKioskKeydown($event)'
  }
})
export class SchoolAttendanceHubComponent implements AfterViewInit, OnDestroy {
  private readonly faceVerifier = inject(FaceVerificationService);
  private readonly fingerprintVerifier = inject(FingerprintVerificationService);
  private readonly tableSchemaService = inject(SchoolTableSchemaService);

  @ViewChild('verifyVideoEl') verifyVideoEl?: ElementRef<HTMLVideoElement>;
  @ViewChild('enrollVideoEl') enrollVideoEl?: ElementRef<HTMLVideoElement>;
  @ViewChild('phoneVerifyInputEl') phoneVerifyInputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('phoneEnrollInputEl') phoneEnrollInputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('quickSelfieFileEl') quickSelfieFileEl?: ElementRef<HTMLInputElement>;
  @ViewChild('gateBarcodeInputEl') gateBarcodeInputEl?: ElementRef<HTMLInputElement>;

  // Inputs
  portalContext = input<AttendancePortalContext>('owner');
  schoolName = input<string>('Al-Huda International Academy');
  students = input<any[]>([]);
  teachers = input<any[]>([]);
  staff = input<StaffMemberRecord[]>([]);
  principals = input<PrincipalMemberRecord[]>([]);
  faceProfiles = input<FaceProfileRecord[]>([]);
  fingerprintProfiles = input<FingerprintProfileRecord[]>([]);
  policy = input<OwnerAttendancePolicy>(createDefaultOwnerAttendancePolicy());
  verificationLogs = input<FaceVerificationLogRecord[]>([]);
  pendingSyncCount = input<number>(0);
  currentActorName = input<string>('School Owner');
  currentStudentId = input<string>('');
  currentTeacherGrade = input<string>('All');
  activeBranchScope = input<string>('ALL');
  activeWingScope = input<string>('ALL');
  activeBranchLabel = input<string>('All Branches (Group HQ)');

  // Outputs
  policySaved = output<OwnerAttendancePolicy>();
  faceEnrolled = output<FaceProfileRecord>();
  faceRemoved = output<string>();
  fingerprintEnrolled = output<FingerprintProfileRecord>();
  fingerprintRemoved = output<string>();
  attendanceRecorded = output<{
    memberCategory: AttendanceMemberCategory;
    memberId: string;
    memberName: string;
    memberCode: string;
    gradeOrDept: string;
    status: 'Present' | 'Late' | 'Absent' | 'On Leave';
    punchType?: 'IN' | 'OUT';
    scheduledStartTime?: string;
    lateMinutes?: number;
    lateByLabel?: string;
    checkInTime?: string;
    verificationMode: string;
    confidenceScore: number;
    verifiedBy: string;
    snapshotData?: string;
  }>();
  staffCreated = output<{
    name: string;
    fatherName?: string;
    cnic?: string;
    gender?: string;
    roleTitle: string;
    department: string;
    phone: string;
    shift: string;
    liteEnabled: boolean;
    customValues?: Record<string, string>;
  }>();
  staffDeleted = output<string>();
  principalCreated = output<{
    name: string;
    fatherName?: string;
    cnic?: string;
    gender?: string;
    roleTitle: string;
    department: string;
    phone: string;
    email?: string;
    shift: string;
    liteEnabled: boolean;
    customValues?: Record<string, string>;
  }>();
  principalDeleted = output<string>();
  absentAlertRequested = output<{ category: AttendanceMemberCategory; memberId?: string }>();
  toast = output<{ message: string; type: 'success' | 'info' | 'warning' }>();
  switchToOwnerPortal = output<void>();
  syncRequested = output<void>();
  idCardRequested = output<AttendanceMemberView>();

  // Local reactive state
  activeSubTab = signal<AttendanceSubTab>('terminal');
  activeCategory = signal<ScannerCategoryFilter>('all');
  searchQuery = signal<string>('');
  selectedGradeFilter = signal<string>('All');
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  punchFilter = signal<'all' | 'checked_in' | 'checked_out' | 'pending'>('all');
  private readonly punchRevision = signal<number>(0);

  // Dynamic Roster & Export Column Selector State (Shared across View, CSV & PDF)
  columnPickerOpen = signal<boolean>(false);
  activeColumnPreset = signal<AttendanceColumnPresetKey | 'custom'>('local_official');
  selectedColumns = signal<Record<AttendanceColumnKey, boolean>>(this.loadInitialColumnSelection());
  readonly columnDefinitions: AttendanceColumnDefinition[] = ATTENDANCE_COLUMN_DEFINITIONS;
  readonly columnGroups: Array<{ group: AttendanceColumnGroup; items: AttendanceColumnDefinition[] }> = (
    ['Identity', "Local & Int'l IDs", 'Personal & Contact', 'Timing & Late Audit', 'Verification & Summary'] as AttendanceColumnGroup[]
  ).map((group) => ({
    group,
    items: ATTENDANCE_COLUMN_DEFINITIONS.filter((c) => c.group === group)
  }));
  readonly visibleColumns = computed<AttendanceColumnDefinition[]>(() =>
    ATTENDANCE_COLUMN_DEFINITIONS.filter((c) => Boolean(this.selectedColumns()[c.key]))
  );
  readonly activeTableColspan = computed<number>(() => this.visibleColumns().length + 1);

  // Network & Offline-First Telemetry
  isBrowserOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine !== false : true);
  kioskFullscreen = signal<boolean>(false);
  quickEnrollDrawerOpen = signal<boolean>(false);
  isDraggingFiles = signal<boolean>(false);

  // Camera & Verification Terminal state
  readonly isInIframe: boolean = (() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  })();
  readonly fullTabUrl: string = (() => {
    try {
      if (typeof window === 'undefined') return '/?tab=attendance&kiosk=1';
      const u = new URL(window.location.href);
      u.searchParams.set('tab', 'attendance');
      u.searchParams.set('kiosk', '1');
      return u.toString();
    } catch {
      return typeof window !== 'undefined' ? window.location.href : '/';
    }
  })();

  cameraActive = signal<boolean>(false);
  keepCameraOn = signal<boolean>(true);
  phoneContinuousSnap = signal<boolean>(false);
  cameraFacingMode = signal<'user' | 'environment'>((() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('scs_att_camera_facing') : null;
      return saved === 'environment' ? 'environment' : 'user';
    } catch {
      return 'user';
    }
  })());
  cameraError = signal<string>('');
  cameraErrorKind = signal<'none' | 'iframe_blocked' | 'permission_denied' | 'no_device' | 'in_use' | 'unsupported'>('none');
  fillLightBoost = signal<boolean>(true);
  liteVerifyActive = signal<boolean>(true);
  autoScanEnabled = signal<boolean>(true);
  autoScanActive = signal<boolean>(false);
  gateMode = signal<'auto' | 'in' | 'out'>('auto');
  readonly neuralReady = this.faceVerifier.neuralReady;
  readonly neuralLoading = this.faceVerifier.neuralLoading;
  scanScope = signal<'auto' | 'targeted'>('auto');
  selectedTargetMemberId = signal<string>('');
  isProcessingScan = signal<boolean>(false);
  capturedVerifyPreview = signal<string>('');
  detectedFaceBox = signal<FaceBoxNormalized | null>(null);
  multiFaceDetected = signal<boolean>(false);
  batchQueueStatus = signal<string>('');

  lastVerificationResult = signal<{
    matched: boolean;
    resultType?: 'success' | 'duplicate' | 'mismatch' | 'unclear';
    confidence: number;
    threshold: number;
    message: string;
    memberName: string;
    memberCode: string;
    category: AttendanceMemberCategory;
    statusMarked: string;
    lateByLabel?: string;
    enrolledPhoto?: string;
    livePhoto?: string;
    savedOffline?: boolean;
  } | null>(null);

  scanOverlay = signal<{
    kind: 'success' | 'duplicate' | 'mismatch' | 'unclear';
    title: string;
    subtitle: string;
    badgeText: string;
    punchType?: 'IN' | 'OUT';
    confidence?: number;
    memberCode?: string;
    lateByLabel?: string;
    storageLabel?: string;
  } | null>(null);

  recentVerifiedFeed = signal<
    Array<{
      id: string;
      name: string;
      category: AttendanceMemberCategory;
      punch: 'IN' | 'OUT';
      time: string;
      lateByLabel?: string;
      confidence: number;
      syncedLabel: string;
    }>
  >([]);

  // Inline Quick Selfie / Fingerprint Enrollment (right on the Scanner Platform)
  quickEnrollCategory = signal<AttendanceMemberCategory>('student');
  quickEnrollMemberId = signal<string>('');
  quickEnrollSearch = signal<string>('');
  quickEnrollPreviewUrl = signal<string>('');
  quickEnrollExtraction = signal<FaceExtractionResult | null>(null);
  quickEnrollFingerLabel = signal<string>('Right Index');
  quickEnrollFingerCapture = signal<FingerprintCaptureResult | null>(null);
  quickEnrollFingerError = signal<string>('');
  isCapturingQuickFinger = signal<boolean>(false);

  // Full Face & Biometric Fingerprint & Gate Barcode Kiosk state
  scannerChannel = signal<AttendanceVerificationChannel>('face');
  enrollChannel = signal<'face' | 'fingerprint'>('face');
  barcodeScanInput = signal<string>('');
  gateKioskClock = signal<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  gateKioskDate = signal<string>(new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
  fingerScanStatus = signal<string>('');
  fingerSensorError = signal<string>('');
  isProcessingFingerScan = signal<boolean>(false);
  fingerSensorAvailable = signal<boolean | null>(null);
  fingerSensorDeviceLabel = signal<string>('Mobile / Device Fingerprint Sensor');
  fingerScannerInsideIframe = signal<boolean>(false);

  enrollCategory = signal<AttendanceMemberCategory>('student');
  enrollTargetMemberId = signal<string>('');
  enrollCapturedDataUrl = signal<string>('');
  enrollExtraction = signal<FaceExtractionResult | null>(null);
  isCapturingEnroll = signal<boolean>(false);
  enrollLiteEnabled = signal<boolean>(true);
  enrollFingerLabel = signal<string>('Right Index');
  enrollFingerCapture = signal<FingerprintCaptureResult | null>(null);
  enrollFingerError = signal<string>('');
  isCapturingFingerEnroll = signal<boolean>(false);

  // Add Staff inline drawer state (signal-based form, no ngModel)
  showAddStaffForm = signal<boolean>(false);
  newStaffName = signal<string>('');
  newStaffFatherName = signal<string>('');
  newStaffCnic = signal<string>('');
  newStaffGender = signal<string>('Male');
  newStaffRole = signal<string>('');
  newStaffDepartment = signal<string>('Campus Operations');
  newStaffPhone = signal<string>('+92 300 ');
  newStaffShift = signal<string>('Morning (07:30 AM - 03:30 PM)');
  newStaffLiteEnabled = signal<boolean>(true);
  staffCustomValues = signal<Record<string, string>>({});

  // Add Principal / Vice Principal inline drawer state
  showAddPrincipalForm = signal<boolean>(false);
  newPrincipalName = signal<string>('');
  newPrincipalFatherName = signal<string>('');
  newPrincipalCnic = signal<string>('');
  newPrincipalGender = signal<string>('Male');
  newPrincipalRole = signal<string>('Vice Principal');
  newPrincipalDepartment = signal<string>('Executive Directorate');
  newPrincipalPhone = signal<string>('+92 300 ');
  newPrincipalShift = signal<string>('Full Day (07:30 AM - 04:00 PM)');
  newPrincipalLiteEnabled = signal<boolean>(true);
  principalCustomValues = signal<Record<string, string>>({});

  // Editable policy draft for Owner Setup tab
  policyDraft = signal<OwnerAttendancePolicy>(createDefaultOwnerAttendancePolicy());
  operatorFilterCategory = signal<'teacher' | 'staff' | 'principal'>('teacher');

  private mediaStream: MediaStream | null = null;
  private activeCameraSlot: 'verify' | 'enroll' | null = null;
  private autoScanTimerId: ReturnType<typeof setInterval> | null = null;
  private overlayTimerId: ReturnType<typeof setTimeout> | null = null;
  private gateClockTimerId: ReturnType<typeof setInterval> | null = null;
  private hidBuffer = '';
  private hidLastKeyAt = 0;
  private hidResetTimerId: ReturnType<typeof setTimeout> | null = null;
  private audioCtx: AudioContext | null = null;
  private readonly localSessionPunches = new Map<
    string,
    { inTime?: string; inAtMs?: number; outTime?: string; outAtMs?: number; scheduledStartTime?: string; lateMinutes?: number; lateByLabel?: string }
  >();
  private lastActiveFaceKey = '';
  private lastSuccessAtMs = 0;
  private lastDuplicateAlertAt = 0;
  private lastAlertBeepAt = 0;
  private stableCandidateKey = '';
  private stableCandidateHits = 0;
  private unknownConsecutiveHits = 0;
  private unknownLastFeedbackAt = 0;
  private unknownWarnedThisVisit = false;
  private unclearConsecutiveHits = 0;
  private unclearWarnedThisVisit = false;
  private noFaceStreak = 0;

  constructor() {
    effect(() => {
      const incoming = this.policy();
      this.policyDraft.set(this.clonePolicy(incoming));
      this.fillLightBoost.set(Boolean(incoming.cameraFillLightEnabled));
      this.liteVerifyActive.set(incoming.verificationMode === 'lite' || incoming.liteModeEnabled);
      this.autoScanEnabled.set(true);
      this.gateMode.set('auto');
      if (incoming.allowFingerprintAttendance === false) {
        if (this.scannerChannel() === 'fingerprint') this.scannerChannel.set('face');
        if (this.enrollChannel() === 'fingerprint') this.enrollChannel.set('face');
      }
    });

    effect(() => {
      const ctx = this.portalContext();
      const locked = this.isPortalLocked();
      const canVerify = this.canVerifyCameraCurrentPortal();
      const canEnroll = this.canEnrollCurrentPortal();
      const allowed = this.allowedCategories();
      const enrollAllowed = this.enrollAllowedCategories();

      if (ctx === 'student' && this.currentStudentId()) {
        this.selectedTargetMemberId.set(this.currentStudentId());
      }

      if (ctx !== 'owner') {
        this.columnPickerOpen.set(false);
        if (locked || (!canVerify && !canEnroll)) {
          this.stopCamera(false);
          this.quickEnrollDrawerOpen.set(false);
        }

        if (allowed.length > 0) {
          const curCat = this.activeCategory();
          if (curCat === 'all' && allowed.length === 1) {
            this.activeCategory.set(allowed[0]);
          } else if (curCat !== 'all' && !allowed.includes(curCat)) {
            this.activeCategory.set(allowed[0]);
          }
        }

        if (enrollAllowed.length > 0) {
          if (!enrollAllowed.includes(this.enrollCategory())) {
            this.enrollCategory.set(enrollAllowed[0]);
          }
          if (!enrollAllowed.includes(this.quickEnrollCategory())) {
            this.quickEnrollCategory.set(enrollAllowed[0]);
          }
        }

        const tab = this.activeSubTab();
        const isTabAllowed =
          tab !== 'setup' &&
          (tab !== 'terminal' || canVerify) &&
          (tab !== 'enrollment' || canEnroll) &&
          (tab !== 'students' || allowed.includes('student')) &&
          (tab !== 'teachers' || allowed.includes('teacher')) &&
          (tab !== 'staff' || allowed.includes('staff')) &&
          (tab !== 'principals' || allowed.includes('principal'));

        if (!isTabAllowed) {
          this.activeSubTab.set(this.resolveDefaultSubTab());
        }
      }
    });

    effect(() => {
      const list = this.quickEnrollFilteredMembers();
      if (list.length > 0 && !list.some((m) => m.id === this.quickEnrollMemberId())) {
        this.quickEnrollMemberId.set(list[0].id);
      }
    });

    effect(() => {
      const profiles = this.faceProfiles();
      if (profiles && profiles.length > 0) {
        void this.faceVerifier.upgradeLegacyProfiles(profiles);
      }
    });

    void this.faceVerifier.ensureModelsLoaded();
  }

  private readonly boundOnlineHandler = () => {
    this.isBrowserOnline.set(true);
    this.syncRequested.emit();
  };

  private readonly boundOfflineHandler = () => {
    this.isBrowserOnline.set(false);
  };

  private readonly boundVisibilityHandler = () => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible' &&
      !this.isPortalLocked() &&
      this.canVerifyCameraCurrentPortal() &&
      this.keepCameraOn() &&
      this.activeSubTab() === 'terminal' &&
      !this.cameraActive()
    ) {
      void this.startCamera('verify', true);
    }
  };

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.boundOnlineHandler);
      window.addEventListener('offline', this.boundOfflineHandler);
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('kiosk') === '1') {
          this.kioskFullscreen.set(true);
        }
        if (params.get('channel') === 'fingerprint' && this.canUseFingerprint()) {
          this.scannerChannel.set('fingerprint');
          this.enrollChannel.set('fingerprint');
        } else if (params.get('channel') === 'barcode') {
          this.scannerChannel.set('barcode');
        }
        if (params.get('subtab') === 'enrollment' && this.canEnrollCurrentPortal()) {
          this.activeSubTab.set('enrollment');
        }
      } catch {}
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    }
    this.gateClockTimerId = setInterval(() => {
      const now = new Date();
      this.gateKioskClock.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      this.gateKioskDate.set(now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    }, 1000);
    if (
      !this.isPortalLocked() &&
      this.canVerifyCameraCurrentPortal() &&
      this.activeSubTab() === 'terminal' &&
      this.scannerChannel() === 'face' &&
      this.keepCameraOn()
    ) {
      setTimeout(() => {
        if (
          !this.cameraActive() &&
          !this.isPortalLocked() &&
          this.canVerifyCameraCurrentPortal() &&
          this.activeSubTab() === 'terminal' &&
          this.scannerChannel() === 'face' &&
          this.keepCameraOn()
        ) {
          void this.startCamera('verify', true);
        }
      }, 60);
    }
    if (this.scannerChannel() === 'barcode') {
      setTimeout(() => this.focusGateBarcodeInput(), 80);
    }
    void this.refreshFingerprintCapabilities();
  }

  private async refreshFingerprintCapabilities(): Promise<void> {
    try {
      const caps = await this.fingerprintVerifier.probeSensorCapabilities();
      this.fingerSensorAvailable.set(caps.platformAvailable);
      this.fingerSensorDeviceLabel.set(caps.deviceLabel);
      this.fingerScannerInsideIframe.set(caps.insideCrossOriginIframe);
    } catch {
      this.fingerSensorAvailable.set(false);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.boundOnlineHandler);
      window.removeEventListener('offline', this.boundOfflineHandler);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    }
    if (this.gateClockTimerId !== null) {
      clearInterval(this.gateClockTimerId);
      this.gateClockTimerId = null;
    }
    if (this.hidResetTimerId !== null) {
      clearTimeout(this.hidResetTimerId);
      this.hidResetTimerId = null;
    }
    this.stopCamera(false);
  }

  // Strict Owner-Governed Portal & Category Access Computeds
  readonly isOwner = computed(() => this.portalContext() === 'owner');

  readonly rolePerms = computed<RoleAttendancePermission>(() => {
    const p = this.policy();
    const ctx = this.portalContext();
    if (ctx === 'owner') {
      return {
        enabled: true,
        canScanStudents: true,
        canScanTeachers: true,
        canScanStaff: true,
        canScanPrincipal: true,
        canEnrollFaces: true,
        liteModeAllowed: true,
        manualFallbackAllowed: true,
        canExportReports: true,
        selfCheckInEnabled: true
      };
    }
    if (ctx === 'principal') return p.roleAccess.principal;
    if (ctx === 'teacher') return p.roleAccess.teacher;
    if (ctx === 'staff') return p.roleAccess.staff;
    return p.roleAccess.student;
  });

  readonly allowedCategories = computed<AttendanceMemberCategory[]>(() => {
    if (this.isOwner()) {
      return ['student', 'teacher', 'staff', 'principal'];
    }
    const perms = this.rolePerms();
    const p = this.policy();
    if (!perms.enabled) {
      return [];
    }
    if (this.portalContext() === 'student') {
      return p.categories.student.enabled && Boolean(perms.selfCheckInEnabled) ? ['student'] : [];
    }
    const list: AttendanceMemberCategory[] = [];
    if (p.categories.student.enabled && perms.canScanStudents) list.push('student');
    if (p.categories.teacher.enabled && perms.canScanTeachers) list.push('teacher');
    if (p.categories.staff.enabled && perms.canScanStaff) list.push('staff');
    if (p.categories.principal.enabled && Boolean(perms.canScanPrincipal)) list.push('principal');
    return list;
  });

  readonly enrollAllowedCategories = computed<AttendanceMemberCategory[]>(() => {
    if (this.isOwner()) {
      return ['student', 'teacher', 'staff', 'principal'];
    }
    const perms = this.rolePerms();
    const p = this.policy();
    if (!perms.enabled || !perms.canEnrollFaces) {
      return [];
    }
    if (this.portalContext() === 'student') {
      return p.categories.student.enabled ? ['student'] : [];
    }
    return this.allowedCategories();
  });

  readonly studentSelfCheckInAllowed = computed(() => {
    if (this.isOwner()) return true;
    if (this.portalContext() !== 'student') return false;
    const perms = this.rolePerms();
    return Boolean(perms.enabled && this.policy().categories.student.enabled && perms.selfCheckInEnabled);
  });

  readonly canVerifyCameraCurrentPortal = computed(() => {
    if (this.isOwner()) return true;
    const perms = this.rolePerms();
    if (!perms.enabled) return false;
    if (this.portalContext() === 'student') {
      return this.studentSelfCheckInAllowed();
    }
    return this.allowedCategories().length > 0;
  });

  readonly canEnrollCurrentPortal = computed(() => {
    if (this.isOwner()) return true;
    const perms = this.rolePerms();
    return Boolean(perms.enabled && perms.canEnrollFaces && this.enrollAllowedCategories().length > 0);
  });

  readonly canUseManualFallback = computed(() => {
    const p = this.policy();
    if (this.isOwner()) {
      return !p.requireCameraForAllAttendance || p.roleAccess.principal.manualFallbackAllowed;
    }
    const perms = this.rolePerms();
    return !p.requireCameraForAllAttendance && perms.enabled && perms.manualFallbackAllowed && this.allowedCategories().length > 0;
  });

  readonly canExportCurrentPortal = computed(() => {
    if (this.isOwner()) return true;
    const perms = this.rolePerms();
    return Boolean(perms.enabled && perms.canExportReports && this.allowedCategories().length > 0);
  });

  readonly isPortalLocked = computed(() => {
    if (this.isOwner()) return false;
    const perms = this.rolePerms();
    if (!perms.enabled) return true;
    return (
      !this.canVerifyCameraCurrentPortal() &&
      !this.canEnrollCurrentPortal() &&
      !this.canUseManualFallback() &&
      !this.canExportCurrentPortal()
    );
  });

  private resolveDefaultSubTab(): AttendanceSubTab {
    if (this.canVerifyCameraCurrentPortal()) return 'terminal';
    const allowed = this.allowedCategories();
    if (allowed.includes('student')) return 'students';
    if (allowed.includes('teacher')) return 'teachers';
    if (allowed.includes('staff')) return 'staff';
    if (allowed.includes('principal')) return 'principals';
    if (this.canEnrollCurrentPortal()) return 'enrollment';
    return 'terminal';
  }

  readonly effectiveThreshold = computed(() => {
    const p = this.policy();
    if (this.liteVerifyActive() && p.liteModeEnabled) {
      return p.liteConfidenceThreshold;
    }
    if (p.verificationMode === 'strict') {
      return Math.max(82, p.confidenceThreshold);
    }
    return p.confidenceThreshold;
  });

  readonly canUseFingerprint = computed(() => this.policy().allowFingerprintAttendance !== false);

  readonly effectiveFingerprintThreshold = computed(() => {
    const p = this.policy();
    const base = p.fingerprintConfidenceThreshold ?? 78;
    if (this.liteVerifyActive() && p.liteModeEnabled) {
      return Math.max(60, Math.min(82, base - 8));
    }
    if (p.verificationMode === 'strict') {
      return Math.max(84, base);
    }
    return base;
  });

  private isMaskedValue(val: unknown): boolean {
    const s = String(val || '').trim();
    return !s || s === '[ENCRYPTED_PROTECTED]' || s === '[LOCKED_VIP_VAULT]';
  }

  private readonly rawMemberLookup = computed(() => {
    const map = new Map<string, { name: string; code: string; subLabel: string; fatherName: string; phone: string }>();
    for (const s of this.students() || []) {
      const id = String(s.id || '').trim();
      if (!id) continue;
      const entry = {
        name: String(s.name || s.fullName || 'Student'),
        code: String(s.rollNo || id),
        subLabel: `${s.grade || 'Class'} ${s.section ? '- ' + s.section : ''}`.trim(),
        fatherName: String(s.guardian || s.guardianName || s.fatherName || '—'),
        phone: String(s.guardianPhone || s.phone || '—')
      };
      map.set(`student:${id}`, entry);
      if (s.rollNo) map.set(`student:${String(s.rollNo).trim()}`, entry);
    }
    for (const t of this.teachers() || []) {
      const id = String(t.id || '').trim();
      if (!id) continue;
      map.set(`teacher:${id}`, {
        name: String(t.name || 'Faculty'),
        code: String(t.empCode || id),
        subLabel: String(t.designation || t.subject || 'Faculty'),
        fatherName: String(t.fatherName || '—'),
        phone: String(t.phone || '—')
      });
    }
    for (const st of this.staff() || []) {
      const id = String(st.id || '').trim();
      if (!id) continue;
      map.set(`staff:${id}`, {
        name: String(st.name || 'Staff Member'),
        code: String(st.empCode || id),
        subLabel: String(st.roleTitle || 'Staff'),
        fatherName: String(st.fatherName || '—'),
        phone: String(st.phone || '—')
      });
    }
    for (const pr of this.principals() || []) {
      const id = String(pr.id || '').trim();
      if (!id) continue;
      map.set(`principal:${id}`, {
        name: String(pr.name || 'Principal'),
        code: String(pr.empCode || id),
        subLabel: String(pr.roleTitle || 'Principal'),
        fatherName: String(pr.fatherName || '—'),
        phone: String(pr.phone || '—')
      });
    }
    return map;
  });

  readonly cleanFaceProfiles = computed<FaceProfileRecord[]>(() => {
    const lookup = this.rawMemberLookup();
    const brScope = this.activeBranchScope();
    return (this.faceProfiles() || [])
      .filter((fp) => {
        const key = `${fp.memberCategory}:${fp.memberId}`;
        if (!lookup.has(key)) return false;
        if (brScope && brScope !== 'ALL' && fp.branchId && fp.branchId !== brScope) return false;
        return true;
      })
      .map((fp) => {
        const raw = lookup.get(`${fp.memberCategory}:${fp.memberId}`);
        return {
          ...fp,
          memberName: this.isMaskedValue(fp.memberName) ? (raw?.name || fp.memberCode || 'Campus Member') : fp.memberName,
          memberCode: this.isMaskedValue(fp.memberCode) ? (raw?.code || fp.memberId) : fp.memberCode,
          gradeOrDept: this.isMaskedValue(fp.gradeOrDept) ? (raw?.subLabel || 'Campus') : fp.gradeOrDept
        };
      });
  });

  readonly profileByMemberKey = computed(() => {
    const map = new Map<string, FaceProfileRecord>();
    for (const fp of this.cleanFaceProfiles()) {
      map.set(`${fp.memberCategory}:${fp.memberId}`, fp);
    }
    return map;
  });

  readonly cleanFingerprintProfiles = computed<FingerprintProfileRecord[]>(() => {
    const lookup = this.rawMemberLookup();
    const brScope = this.activeBranchScope();
    return (this.fingerprintProfiles() || [])
      .filter((fp) => {
        const key = `${fp.memberCategory}:${fp.memberId}`;
        if (!lookup.has(key)) return false;
        if (brScope && brScope !== 'ALL' && fp.branchId && fp.branchId !== brScope) return false;
        return true;
      })
      .map((fp) => {
        const raw = lookup.get(`${fp.memberCategory}:${fp.memberId}`);
        return {
          ...fp,
          memberName: this.isMaskedValue(fp.memberName) ? (raw?.name || fp.memberCode || 'Campus Member') : fp.memberName,
          memberCode: this.isMaskedValue(fp.memberCode) ? (raw?.code || fp.memberId) : fp.memberCode,
          gradeOrDept: this.isMaskedValue(fp.gradeOrDept) ? (raw?.subLabel || 'Campus') : fp.gradeOrDept
        };
      });
  });

  readonly fingerprintByMemberKey = computed(() => {
    const map = new Map<string, FingerprintProfileRecord>();
    for (const fp of this.cleanFingerprintProfiles()) {
      map.set(`${fp.memberCategory}:${fp.memberId}`, fp);
    }
    return map;
  });

  readonly punchSummaryByMember = computed(() => {
    this.punchRevision();
    const targetDate = this.selectedDate();
    const todayIso = new Date().toISOString().split('T')[0];
    const logs = this.verificationLogs() || [];
    const defaultStart = this.policy().scheduledStartTime || '08:00';
    const perMember = new Map<
      string,
      {
        inTime: string;
        outTime: string;
        scheduledStartTime: string;
        lateMinutes: number | null;
        lateByLabel: string;
        lastConfidence: number;
        verifiedMethod: string;
        gateOrLocation: string;
        markedBy: string;
        remarks: string;
        totalInCount: number;
        totalOutCount: number;
      }
    >();

    for (const l of logs) {
      if (l.status === 'Rejected' || l.status === 'Absent') continue;
      const key = `${l.memberCategory}:${l.memberId}`;
      const cur = perMember.get(key) || {
        inTime: '',
        outTime: '',
        scheduledStartTime: defaultStart,
        lateMinutes: null,
        lateByLabel: '',
        lastConfidence: 0,
        verifiedMethod: '',
        gateOrLocation: '',
        markedBy: '',
        remarks: '',
        totalInCount: 0,
        totalOutCount: 0
      };
      const isOut = l.punchType === 'OUT' || String(l.verifiedBy || '').includes('· OUT');
      if (isOut) {
        cur.totalOutCount++;
      } else if (l.status === 'Present' || l.status === 'Late') {
        cur.totalInCount++;
      }
      if (l.date === targetDate) {
        const ts = this.formatTimeShort(l.timestamp);
        if (isOut) {
          if (!cur.outTime && ts) cur.outTime = ts;
        } else {
          if (ts) cur.inTime = ts;
          if (l.scheduledStartTime) cur.scheduledStartTime = l.scheduledStartTime;
          if (typeof l.lateMinutes === 'number' && Number.isFinite(l.lateMinutes)) {
            cur.lateMinutes = l.lateMinutes;
          }
          if (l.lateByLabel) cur.lateByLabel = l.lateByLabel;
        }
        if (!cur.lastConfidence && Number(l.confidenceScore) > 0) {
          cur.lastConfidence = Math.round(Number(l.confidenceScore));
        }
        if (!cur.verifiedMethod && l.verifiedBy) {
          cur.verifiedMethod = l.verifiedBy;
        }
        if (!cur.gateOrLocation && l.gateName) {
          cur.gateOrLocation = l.gateName;
        }
        if (!cur.markedBy && l.markedByRole) {
          cur.markedBy = l.markedByRole;
        }
        if (!cur.remarks && l.remarks) {
          cur.remarks = l.remarks;
        }
      }
      perMember.set(key, cur);
    }

    if (targetDate === todayIso) {
      for (const [key, sess] of this.localSessionPunches.entries()) {
        const cur = perMember.get(key) || {
          inTime: '',
          outTime: '',
          scheduledStartTime: sess.scheduledStartTime || defaultStart,
          lateMinutes: null,
          lateByLabel: '',
          lastConfidence: 0,
          verifiedMethod: '',
          gateOrLocation: '',
          markedBy: '',
          remarks: '',
          totalInCount: 0,
          totalOutCount: 0
        };
        if (sess.inTime && !cur.inTime) {
          cur.inTime = sess.inTime;
          cur.totalInCount = Math.max(1, cur.totalInCount);
        }
        if (sess.scheduledStartTime) cur.scheduledStartTime = sess.scheduledStartTime;
        if (typeof sess.lateMinutes === 'number') cur.lateMinutes = sess.lateMinutes;
        if (sess.lateByLabel && !cur.lateByLabel) cur.lateByLabel = sess.lateByLabel;
        if (sess.outTime && !cur.outTime) {
          cur.outTime = sess.outTime;
          cur.totalOutCount = Math.max(1, cur.totalOutCount);
        }
        perMember.set(key, cur);
      }
    }
    return perMember;
  });

  readonly studentMembers = computed<AttendanceMemberView[]>(() => {
    const map = this.profileByMemberKey();
    const fpMap = this.fingerprintByMemberKey();
    const punchMap = this.punchSummaryByMember();
    const overrides = this.policy().operatorOverrides || {};
    return (this.students() || []).map((s) => {
      const fp = map.get(`student:${s.id}`) || null;
      const fpp = fpMap.get(`student:${s.id}`) || null;
      const ov = overrides[`student:${s.id}`];
      const status = this.normalizeStatus(s.status || s.attendanceStatus);
      const punchFields = this.buildMemberPunchView(punchMap.get(`student:${s.id}`), status);
      return {
        id: String(s.id),
        category: 'student',
        name: String(s.name || s.fullName || 'Student'),
        code: String(s.rollNo || s.id),
        subLabel: `${s.grade || 'Class'} ${s.section ? '- ' + s.section : ''}`.trim(),
        sectionOrDept: String(s.grade || 'Campus'),
        fatherName: String(s.guardian || s.guardianName || s.fatherName || '—'),
        guardianRelation: String(s.guardianRelation || 'Father'),
        cnicBForm: String(s.studentBForm || s.bForm || s.cnic || '—'),
        guardianCnic: String(s.guardianCnic || '—'),
        passportNo: String(s.passportNo || '—'),
        nationality: String(s.nationality || 'Pakistani'),
        gender: String(s.gender || '—'),
        dob: String(s.dob || '—'),
        bloodGroup: String(s.bloodGroup || '—'),
        phone: String(s.guardianPhone || s.phone || ''),
        emergencyContact: String(s.emergencyContact || '—'),
        email: String(s.guardianEmail || s.email || '—'),
        address: String(s.address || '—'),
        status,
        monthlyRate: String(s.attendance || s.attendanceRate || '96%'),
        image: fp?.facePhotoData || s.image || '',
        faceProfile: fp,
        fingerprintProfile: fpp,
        liteEnabled: ov ? ov.liteEnabled : (fp ? fp.liteEnabled : true),
        isEnrolled: Boolean(fp || s.biometricEnrolled),
        isFingerprintEnrolled: Boolean(fpp || s.fingerprintEnrolled),
        ...punchFields
      };
    });
  });

  readonly teacherMembers = computed<AttendanceMemberView[]>(() => {
    const map = this.profileByMemberKey();
    const fpMap = this.fingerprintByMemberKey();
    const punchMap = this.punchSummaryByMember();
    const overrides = this.policy().operatorOverrides || {};
    return (this.teachers() || []).map((t) => {
      const fp = map.get(`teacher:${t.id}`) || null;
      const fpp = fpMap.get(`teacher:${t.id}`) || null;
      const ov = overrides[`teacher:${t.id}`];
      const status = this.normalizeStatus(t.attendanceStatus || (t.status === 'On Leave' ? 'On Leave' : 'Present'));
      const punchFields = this.buildMemberPunchView(punchMap.get(`teacher:${t.id}`), status);
      return {
        id: String(t.id),
        category: 'teacher',
        name: String(t.name || 'Faculty'),
        code: String(t.empCode || t.id),
        subLabel: String(t.designation || t.subject || 'Faculty'),
        sectionOrDept: String(t.department || t.subject || 'Academics'),
        fatherName: String(t.fatherName || '—'),
        guardianRelation: 'Father / Spouse',
        cnicBForm: String(t.cnic || '—'),
        guardianCnic: '—',
        passportNo: String(t.passportNo || '—'),
        nationality: String(t.nationality || 'Pakistani'),
        gender: String(t.gender || '—'),
        dob: String(t.dob || '—'),
        bloodGroup: String(t.bloodGroup || '—'),
        phone: String(t.phone || ''),
        emergencyContact: String(t.emergencyContact || '—'),
        email: String(t.email || '—'),
        address: String(t.address || '—'),
        status,
        monthlyRate: String(t.attendanceRate || '98%'),
        image: fp?.facePhotoData || t.image || '',
        faceProfile: fp,
        fingerprintProfile: fpp,
        liteEnabled: ov ? ov.liteEnabled : (fp ? fp.liteEnabled : true),
        isEnrolled: Boolean(fp || t.biometricEnrolled),
        isFingerprintEnrolled: Boolean(fpp || t.fingerprintEnrolled),
        ...punchFields
      };
    });
  });

  readonly staffMembers = computed<AttendanceMemberView[]>(() => {
    const map = this.profileByMemberKey();
    const fpMap = this.fingerprintByMemberKey();
    const punchMap = this.punchSummaryByMember();
    const overrides = this.policy().operatorOverrides || {};
    return (this.staff() || []).map((st) => {
      const fp = map.get(`staff:${st.id}`) || null;
      const fpp = fpMap.get(`staff:${st.id}`) || null;
      const ov = overrides[`staff:${st.id}`];
      const status = this.normalizeStatus(st.attendanceStatus);
      const punchFields = this.buildMemberPunchView(punchMap.get(`staff:${st.id}`), status);
      return {
        id: String(st.id),
        category: 'staff',
        name: String(st.name || 'Staff Member'),
        code: String(st.empCode || st.id),
        subLabel: String(st.roleTitle || 'Staff'),
        sectionOrDept: String(st.department || 'Administration'),
        fatherName: String(st.fatherName || '—'),
        guardianRelation: 'Father',
        cnicBForm: String(st.cnic || '—'),
        guardianCnic: '—',
        passportNo: String(st.passportNo || '—'),
        nationality: String(st.nationality || 'Pakistani'),
        gender: String(st.gender || '—'),
        dob: String(st.dob || '—'),
        bloodGroup: String(st.bloodGroup || '—'),
        phone: String(st.phone || ''),
        emergencyContact: String(st.emergencyContact || '—'),
        email: String(st.email || '—'),
        address: String(st.address || '—'),
        status,
        monthlyRate: st.shift || 'Morning Shift',
        image: fp?.facePhotoData || st.image || '',
        faceProfile: fp,
        fingerprintProfile: fpp,
        liteEnabled: ov ? ov.liteEnabled : (fp ? fp.liteEnabled : Boolean(st.liteEnabled ?? true)),
        isEnrolled: Boolean(fp || st.faceEnrolled),
        isFingerprintEnrolled: Boolean(fpp || st.fingerprintEnrolled),
        ...punchFields
      };
    });
  });

  readonly principalMembers = computed<AttendanceMemberView[]>(() => {
    const map = this.profileByMemberKey();
    const fpMap = this.fingerprintByMemberKey();
    const punchMap = this.punchSummaryByMember();
    const overrides = this.policy().operatorOverrides || {};
    return (this.principals() || []).map((pr) => {
      const fp = map.get(`principal:${pr.id}`) || null;
      const fpp = fpMap.get(`principal:${pr.id}`) || null;
      const ov = overrides[`principal:${pr.id}`];
      const status = this.normalizeStatus(pr.attendanceStatus);
      const punchFields = this.buildMemberPunchView(punchMap.get(`principal:${pr.id}`), status);
      return {
        id: String(pr.id),
        category: 'principal',
        name: String(pr.name || 'Principal'),
        code: String(pr.empCode || pr.id),
        subLabel: String(pr.roleTitle || 'Principal'),
        sectionOrDept: String(pr.department || 'Executive Directorate'),
        fatherName: String(pr.fatherName || '—'),
        guardianRelation: 'Father',
        cnicBForm: String(pr.cnic || '—'),
        guardianCnic: '—',
        passportNo: String(pr.passportNo || '—'),
        nationality: String(pr.nationality || 'Pakistani'),
        gender: String(pr.gender || '—'),
        dob: String(pr.dob || '—'),
        bloodGroup: String(pr.bloodGroup || '—'),
        phone: String(pr.phone || ''),
        emergencyContact: String(pr.emergencyContact || '—'),
        email: String(pr.email || '—'),
        address: String(pr.address || '—'),
        status,
        monthlyRate: pr.shift || 'Full Day Shift',
        image: fp?.facePhotoData || pr.image || '',
        faceProfile: fp,
        fingerprintProfile: fpp,
        liteEnabled: ov ? ov.liteEnabled : (fp ? fp.liteEnabled : Boolean(pr.liteEnabled ?? true)),
        isEnrolled: Boolean(fp || pr.faceEnrolled),
        isFingerprintEnrolled: Boolean(fpp || pr.fingerprintEnrolled),
        ...punchFields
      };
    });
  });

  readonly allCampusMembers = computed<AttendanceMemberView[]>(() => [
    ...this.studentMembers(),
    ...this.teacherMembers(),
    ...this.staffMembers(),
    ...this.principalMembers()
  ]);

  readonly activeCategoryMembers = computed<AttendanceMemberView[]>(() => {
    const cat = this.activeCategory();
    const allowed = this.allowedCategories();
    if (cat === 'all') {
      if (this.isOwner()) return this.allCampusMembers();
      return this.allCampusMembers().filter((m) => allowed.includes(m.category));
    }
    if (!this.isOwner() && !allowed.includes(cat)) {
      return [];
    }
    if (cat === 'teacher') return this.teacherMembers();
    if (cat === 'staff') return this.staffMembers();
    if (cat === 'principal') return this.principalMembers();
    return this.studentMembers();
  });

  readonly activeFaceProfiles = computed<FaceProfileRecord[]>(() => {
    const cat = this.activeCategory();
    const allowed = this.allowedCategories();
    const permittedProfiles = this.isOwner()
      ? this.cleanFaceProfiles()
      : this.cleanFaceProfiles().filter((fp) => allowed.includes(fp.memberCategory));
    if (cat === 'all') return permittedProfiles;
    return permittedProfiles.filter((fp) => fp.memberCategory === cat);
  });

  readonly activeFingerprintProfiles = computed<FingerprintProfileRecord[]>(() => {
    const cat = this.activeCategory();
    const allowed = this.allowedCategories();
    const permitted = this.isOwner()
      ? this.cleanFingerprintProfiles()
      : this.cleanFingerprintProfiles().filter((fp) => allowed.includes(fp.memberCategory));
    if (cat === 'all') return permitted;
    return permitted.filter((fp) => fp.memberCategory === cat);
  });

  readonly enrollCategoryMembers = computed<AttendanceMemberView[]>(() => {
    const cat = this.enrollCategory();
    if (!this.isOwner() && !this.enrollAllowedCategories().includes(cat)) {
      return [];
    }
    if (cat === 'teacher') return this.teacherMembers();
    if (cat === 'staff') return this.staffMembers();
    if (cat === 'principal') return this.principalMembers();
    return this.studentMembers();
  });

  readonly enrollSelectedMember = computed<AttendanceMemberView | null>(() => {
    const id = this.enrollTargetMemberId();
    if (!id) return null;
    return this.enrollCategoryMembers().find((m) => m.id === id) || null;
  });

  readonly quickEnrollFilteredMembers = computed<AttendanceMemberView[]>(() => {
    const cat = this.quickEnrollCategory();
    if (!this.isOwner() && !this.enrollAllowedCategories().includes(cat)) {
      return [];
    }
    const base =
      cat === 'teacher'
        ? this.teacherMembers()
        : cat === 'staff'
          ? this.staffMembers()
          : cat === 'principal'
            ? this.principalMembers()
            : this.studentMembers();
    const q = this.quickEnrollSearch().trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.subLabel.toLowerCase().includes(q)
    );
  });

  readonly quickEnrollSelectedMember = computed<AttendanceMemberView | null>(() => {
    const id = this.quickEnrollMemberId();
    if (!id) return null;
    return this.quickEnrollFilteredMembers().find((m) => m.id === id) || null;
  });

  readonly studentGrades = computed<string[]>(() => {
    const set = new Set<string>(['All']);
    for (const s of this.studentMembers()) {
      if (s.sectionOrDept) set.add(s.sectionOrDept);
    }
    return Array.from(set);
  });

  readonly currentTabMembersUnfiltered = computed<AttendanceMemberView[]>(() => {
    const tab = this.activeSubTab();
    const allowed = this.allowedCategories();
    if (tab === 'teachers') return (this.isOwner() || allowed.includes('teacher')) ? this.teacherMembers() : [];
    if (tab === 'staff') return (this.isOwner() || allowed.includes('staff')) ? this.staffMembers() : [];
    if (tab === 'principals') return (this.isOwner() || allowed.includes('principal')) ? this.principalMembers() : [];
    if (tab === 'students') return (this.isOwner() || allowed.includes('student')) ? this.studentMembers() : [];
    return this.activeCategoryMembers();
  });

  readonly rosterTabSummary = computed(() => {
    const list = this.currentTabMembersUnfiltered();
    return {
      total: list.length,
      checkedIn: list.filter((m) => m.punchState === 'Checked IN' || m.punchState === 'Checked OUT').length,
      checkedOut: list.filter((m) => m.punchState === 'Checked OUT').length,
      pending: list.filter((m) => m.punchState === 'Pending' || m.punchState === 'Absent').length,
      enrolled: list.filter((m) => m.isEnrolled).length,
      fpEnrolled: list.filter((m) => Boolean(m.isFingerprintEnrolled)).length
    };
  });

  readonly filteredRosterMembers = computed<AttendanceMemberView[]>(() => {
    const tab = this.activeSubTab();
    const list = this.currentTabMembersUnfiltered();
    const q = this.searchQuery().trim().toLowerCase();
    const grade = this.selectedGradeFilter();
    const pf = this.punchFilter();

    return list.filter((m) => {
      const matchesQ =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.subLabel.toLowerCase().includes(q) ||
        m.sectionOrDept.toLowerCase().includes(q) ||
        m.fatherName.toLowerCase().includes(q) ||
        m.cnicBForm.toLowerCase().includes(q) ||
        m.guardianCnic.toLowerCase().includes(q) ||
        m.passportNo.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);
      const matchesGrade = tab !== 'students' || grade === 'All' || m.sectionOrDept.toLowerCase().includes(grade.toLowerCase());
      const matchesPunch =
        pf === 'all' ||
        (pf === 'checked_in' && m.punchState === 'Checked IN') ||
        (pf === 'checked_out' && m.punchState === 'Checked OUT') ||
        (pf === 'pending' && (m.punchState === 'Pending' || m.punchState === 'Absent'));
      return matchesQ && matchesGrade && matchesPunch;
    });
  });

  readonly categoryStats = computed(() => {
    const summarize = (list: AttendanceMemberView[]) => ({
      total: list.length,
      enrolled: list.filter((m) => m.isEnrolled).length,
      fpEnrolled: list.filter((m) => Boolean(m.isFingerprintEnrolled)).length,
      present: list.filter((m) => m.status === 'Present').length,
      late: list.filter((m) => m.status === 'Late').length,
      absent: list.filter((m) => m.status === 'Absent').length
    });
    return {
      student: summarize(this.studentMembers()),
      teacher: summarize(this.teacherMembers()),
      staff: summarize(this.staffMembers()),
      principal: summarize(this.principalMembers())
    };
  });

  readonly totalEnrolledCount = computed(() => this.cleanFaceProfiles().length);
  readonly totalFingerprintEnrolledCount = computed(() => this.cleanFingerprintProfiles().length);

  readonly activeLogs = computed(() => {
    const cat = this.activeCategory();
    const tab = this.activeSubTab();
    const lookup = this.rawMemberLookup();
    const allowed = this.allowedCategories();
    const logs = (this.verificationLogs() || [])
      .filter((l) => this.isOwner() || allowed.includes(l.memberCategory))
      .map((l) => {
        if (!this.isMaskedValue(l.memberName)) return l;
        const raw = lookup.get(`${l.memberCategory}:${l.memberId}`);
        return {
          ...l,
          memberName: raw?.name || l.memberCode || 'Campus Member',
          memberCode: this.isMaskedValue(l.memberCode) ? (raw?.code || l.memberId) : l.memberCode,
          gradeOrDept: this.isMaskedValue(l.gradeOrDept) ? (raw?.subLabel || 'Campus') : l.gradeOrDept
        };
      });
    if (tab === 'terminal' && cat !== 'all') {
      return logs.filter((l) => l.memberCategory === cat).slice(0, 14);
    }
    return logs.slice(0, 16);
  });

  readonly markedAttendanceTableRows = computed(() => {
    this.punchRevision();
    const cat = this.activeCategory();
    const allowed = this.allowedCategories();
    const q = this.searchQuery().trim().toLowerCase();
    const membersMap = new Map<string, AttendanceMemberView>();
    for (const m of this.allCampusMembers()) {
      membersMap.set(`${m.category}:${m.id}`, m);
    }
    const profileMap = this.profileByMemberKey();
    const lookup = this.rawMemberLookup();

    const rowsMap = new Map<
      string,
      {
        key: string;
        date: string;
        memberId: string;
        category: AttendanceMemberCategory;
        code: string;
        name: string;
        subLabel: string;
        fatherName: string;
        phone: string;
        photo: string;
        checkInTime: string;
        checkOutTime: string;
        lateByLabel: string;
        lateSeverity: LateSeverityKind;
        status: string;
        confidenceScore: number;
        verifiedBy: string;
      }
    >();

    for (const l of this.verificationLogs() || []) {
      if (l.status === 'Rejected') continue;
      if (!this.isOwner() && !allowed.includes(l.memberCategory)) continue;
      if (cat !== 'all' && l.memberCategory !== cat) continue;
      const memberKey = `${l.memberCategory}:${l.memberId}`;
      const member = membersMap.get(memberKey);
      const raw = lookup.get(memberKey);
      const fp = profileMap.get(memberKey);
      const rowKey = `${l.date}:${memberKey}`;
      const isOut = l.punchType === 'OUT' || String(l.verifiedBy || '').includes('· OUT');
      const ts = this.formatTimeShort(l.timestamp) || l.timestamp || '—';

      const cleanName = !this.isMaskedValue(l.memberName)
        ? l.memberName
        : (member?.name || raw?.name || l.memberCode || 'Campus Member');
      const cleanCode = member?.code || raw?.code || l.memberCode || l.memberId;
      const cleanSub = member?.subLabel || raw?.subLabel || (!this.isMaskedValue(l.gradeOrDept) ? l.gradeOrDept : 'Campus');

      const existing = rowsMap.get(rowKey);
      if (!existing) {
        rowsMap.set(rowKey, {
          key: rowKey,
          date: l.date,
          memberId: l.memberId,
          category: l.memberCategory,
          code: cleanCode,
          name: cleanName,
          subLabel: cleanSub,
          fatherName: member?.fatherName || raw?.fatherName || '—',
          phone: member?.phone || raw?.phone || '—',
          photo: fp?.facePhotoData || l.snapshotData || member?.image || '',
          checkInTime: isOut ? '—' : ts,
          checkOutTime: isOut ? ts : '—',
          lateByLabel: l.lateByLabel || (l.status === 'Late' ? 'Late Arrival' : 'On Time'),
          lateSeverity: l.status === 'Late' ? 'late' : 'on_time',
          status: l.status,
          confidenceScore: Math.round(Number(l.confidenceScore || 0)),
          verifiedBy: l.verifiedBy || 'Face Camera'
        });
      } else {
        if (isOut && existing.checkOutTime === '—') {
          existing.checkOutTime = ts;
        } else if (!isOut && existing.checkInTime === '—') {
          existing.checkInTime = ts;
        }
        if (l.lateByLabel) existing.lateByLabel = l.lateByLabel;
        if (Number(l.confidenceScore || 0) > existing.confidenceScore) {
          existing.confidenceScore = Math.round(Number(l.confidenceScore || 0));
        }
      }
    }

    const list = Array.from(rowsMap.values());
    if (!q) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.subLabel.toLowerCase().includes(q) ||
        r.fatherName.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    );
  });

  readonly fillLightFrameClass = computed(() => {
    if (!this.fillLightBoost()) return 'ring-1 ring-slate-800';
    const color = this.policy().fillLightColor;
    if (color === 'warm') {
      return 'ring-[8px] ring-amber-100/95 shadow-[inset_0_0_55px_rgba(254,243,199,0.45)]';
    }
    if (color === 'bright') {
      return 'ring-[12px] ring-white shadow-[inset_0_0_75px_rgba(255,255,255,0.65)]';
    }
    return 'ring-[8px] ring-slate-100/95 shadow-[inset_0_0_50px_rgba(248,250,252,0.45)]';
  });

  // Navigation & Tab Controls
  setSubTab(tab: AttendanceSubTab): void {
    if (tab === 'setup' && !this.isOwner()) {
      this.emitToast('Only School Owner can modify attendance threshold & cutoff policy.', 'warning');
      return;
    }
    if (this.isPortalLocked()) {
      this.emitToast('School Owner has locked Attendance Verification for this portal.', 'warning');
      return;
    }
    if (tab === 'terminal' && !this.canVerifyCameraCurrentPortal()) {
      this.emitToast('Live camera attendance verification is not enabled for this portal by School Owner.', 'warning');
      return;
    }
    if (tab === 'enrollment' && !this.canEnrollCurrentPortal()) {
      this.emitToast('Face registry enrollment is restricted by School Owner.', 'warning');
      return;
    }
    const allowed = this.allowedCategories();
    if (!this.isOwner() && tab !== 'history') {
      if (
        (tab === 'students' && !allowed.includes('student')) ||
        (tab === 'teachers' && !allowed.includes('teacher')) ||
        (tab === 'staff' && !allowed.includes('staff')) ||
        (tab === 'principals' && !allowed.includes('principal'))
      ) {
        this.emitToast('School Owner has restricted access to that attendance category.', 'warning');
        return;
      }
    }

    this.stopCamera(false);
    this.activeSubTab.set(tab);
    if (tab === 'students') this.activeCategory.set('student');
    if (tab === 'teachers') this.activeCategory.set('teacher');
    if (tab === 'staff') this.activeCategory.set('staff');
    if (tab === 'principals') this.activeCategory.set('principal');
    if (tab === 'terminal' && this.keepCameraOn() && this.scannerChannel() === 'face' && this.canVerifyCameraCurrentPortal()) {
      setTimeout(() => void this.startCamera('verify', true), 60);
    }
    if (tab === 'enrollment') {
      const enrollAllowed = this.enrollAllowedCategories();
      const curCat = this.activeCategory();
      const cat =
        curCat !== 'all' && enrollAllowed.includes(curCat)
          ? curCat
          : (enrollAllowed[0] || 'student');
      this.enrollCategory.set(cat);
      const list = this.enrollCategoryMembers();
      if (list.length > 0 && !this.enrollTargetMemberId()) {
        this.enrollTargetMemberId.set(list[0].id);
      }
      if (this.keepCameraOn() && this.enrollChannel() === 'face' && this.canEnrollCurrentPortal()) {
        setTimeout(() => void this.startCamera('enroll', true), 60);
      }
    }
  }

  setScannerChannel(channel: AttendanceVerificationChannel): void {
    if (channel === 'fingerprint' && !this.canUseFingerprint()) {
      this.emitToast('Fingerprint biometric attendance is currently disabled by School Owner.', 'warning');
      return;
    }
    this.scannerChannel.set(channel);
    this.fingerSensorError.set('');
    this.fingerScanStatus.set('');
    this.lastVerificationResult.set(null);
    this.scanOverlay.set(null);
    if (channel === 'fingerprint') {
      this.stopCamera(false);
      void this.refreshFingerprintCapabilities();
    } else if (channel === 'barcode') {
      this.stopCamera(false);
      setTimeout(() => this.focusGateBarcodeInput(), 80);
    } else if (this.activeSubTab() === 'terminal' && this.keepCameraOn() && this.canVerifyCameraCurrentPortal()) {
      setTimeout(() => void this.startCamera('verify', true), 60);
    }
  }

  setEnrollChannel(channel: 'face' | 'fingerprint'): void {
    if (channel === 'fingerprint' && !this.canUseFingerprint()) {
      this.emitToast('Fingerprint biometric enrollment is currently disabled by School Owner.', 'warning');
      return;
    }
    this.enrollChannel.set(channel);
    this.enrollFingerCapture.set(null);
    this.enrollFingerError.set('');
    if (channel === 'fingerprint') {
      this.stopCamera(false);
      void this.refreshFingerprintCapabilities();
    } else if (this.activeSubTab() === 'enrollment' && this.keepCameraOn() && this.canEnrollCurrentPortal()) {
      setTimeout(() => void this.startCamera('enroll', true), 60);
    }
  }

  setCategory(cat: ScannerCategoryFilter): void {
    if (!this.isOwner()) {
      const allowed = this.allowedCategories();
      if (allowed.length === 0) {
        this.emitToast('School Owner has not granted attendance permissions for any category.', 'warning');
        return;
      }
      if (cat === 'all' && allowed.length === 1) {
        cat = allowed[0];
      } else if (cat !== 'all' && !allowed.includes(cat)) {
        this.emitToast(`School Owner has restricted ${this.categoryLabel(cat)} attendance for this portal.`, 'warning');
        return;
      }
    }
    this.activeCategory.set(cat);
    this.selectedTargetMemberId.set('');
    this.lastVerificationResult.set(null);
    this.capturedVerifyPreview.set('');
    this.stableCandidateKey = '';
    this.stableCandidateHits = 0;
  }

  toggleKioskFullscreen(): void {
    const next = !this.kioskFullscreen();
    if (next && !this.canVerifyCameraCurrentPortal()) {
      return;
    }
    this.kioskFullscreen.set(next);
    if (next) {
      if (this.activeSubTab() !== 'terminal') {
        this.setSubTab('terminal');
      } else if (this.scannerChannel() === 'barcode') {
        setTimeout(() => this.focusGateBarcodeInput(), 80);
      } else if (this.scannerChannel() === 'face' && !this.cameraActive()) {
        void this.startCamera('verify', true);
      }
    }
  }

  activateGateKioskBarcodeFullscreen(): void {
    if (!this.canVerifyCameraCurrentPortal()) {
      this.emitToast('Attendance kiosk access is restricted for this portal.', 'warning');
      return;
    }
    this.stopCamera(false);
    this.activeSubTab.set('terminal');
    this.scannerChannel.set('barcode');
    this.lastVerificationResult.set(null);
    this.scanOverlay.set(null);
    this.kioskFullscreen.set(true);
    setTimeout(() => this.focusGateBarcodeInput(), 80);
  }

  focusGateBarcodeInput(): void {
    try {
      this.gateBarcodeInputEl?.nativeElement?.focus();
    } catch {}
  }

  onGateKioskKeydown(event: KeyboardEvent): void {
    if (this.isPortalLocked() || this.activeSubTab() !== 'terminal' || this.scannerChannel() !== 'barcode') {
      return;
    }
    if (!event || event.ctrlKey || event.altKey || event.metaKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.getAttribute('data-kiosk-barcode-input') === 'true') return;
    const tag = (target?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(target?.isContentEditable)) return;

    const now = Date.now();
    if (now - this.hidLastKeyAt > 75) {
      this.hidBuffer = '';
    }
    this.hidLastKeyAt = now;

    if (event.key === 'Enter' || event.key === 'Tab') {
      const code = this.hidBuffer.trim();
      this.hidBuffer = '';
      if (this.hidResetTimerId !== null) {
        clearTimeout(this.hidResetTimerId);
        this.hidResetTimerId = null;
      }
      if (code.length >= 3) {
        event.preventDefault();
        this.submitBarcodeGateScan(code);
      }
      return;
    }

    if (event.key.length === 1) {
      this.hidBuffer += event.key;
      if (this.hidResetTimerId !== null) clearTimeout(this.hidResetTimerId);
      this.hidResetTimerId = setTimeout(() => {
        this.hidBuffer = '';
        this.hidResetTimerId = null;
      }, 160);
    }
  }

  submitBarcodeGateScan(overrideCode?: string): void {
    const raw = String(overrideCode ?? this.barcodeScanInput()).trim();
    this.barcodeScanInput.set('');
    if (!raw) {
      this.playAlertTone('unclear');
      this.emitToast('Scan a Student / Staff Barcode ID Card or RFID badge.', 'warning');
      this.focusGateBarcodeInput();
      return;
    }

    const norm = raw.toLowerCase();
    const isExplicitEmp = /^emp[-_]/i.test(raw);
    const strippedEmp = raw.replace(/^emp[-_]/i, '').trim().toLowerCase();
    const strippedStu = raw.replace(/^(?:ch|chln|stu|st|adm|roll|rfid)[-_]?(?:\d{4}[-_])?/i, '').trim().toLowerCase();

    const pool = this.allCampusMembers();
    const activeCat = this.activeCategory();
    const allowed = this.allowedCategories();

    const matchMember = (m: AttendanceMemberView): boolean => {
      const idLow = m.id.toLowerCase();
      const codeLow = m.code.toLowerCase();
      const isEmp = m.category !== 'student';
      if (isExplicitEmp && !isEmp) return false;
      if (codeLow === norm || idLow === norm) return true;
      if (isEmp && (strippedEmp === codeLow || strippedEmp === idLow || `emp-${codeLow}` === norm || `emp-${idLow}` === norm)) {
        return true;
      }
      if (!isEmp && strippedStu && (codeLow === strippedStu || idLow === strippedStu)) {
        return true;
      }
      return false;
    };

    const scopedPool = activeCat === 'all' ? pool : pool.filter((m) => m.category === activeCat);
    const member = scopedPool.find(matchMember) || pool.find(matchMember) || null;

    if (!member) {
      this.playAlertTone('mismatch');
      this.triggerScanOverlay(
        {
          kind: 'mismatch',
          title: `Unrecognized Card: ${raw}`,
          subtitle: 'No Student (STU-...) or Staff/Teacher/Principal (EMP-...) profile matched this ID.',
          badgeText: 'GATE ACCESS · UNRECOGNIZED ID',
          memberCode: raw
        },
        2400
      );
      this.emitToast(`Unrecognized barcode or RFID pass "${raw}".`, 'warning');
      setTimeout(() => this.focusGateBarcodeInput(), 30);
      return;
    }

    if (!this.isOwner() && !allowed.includes(member.category)) {
      this.playAlertTone('mismatch');
      this.triggerScanOverlay(
        {
          kind: 'mismatch',
          title: member.name,
          subtitle: `This portal is not permitted to log ${this.singleCategoryLabel(member.category)} gate attendance.`,
          badgeText: 'PORTAL PERMISSION RESTRICTED',
          memberCode: member.code
        },
        2200
      );
      this.emitToast(`Owner policy restricts ${this.singleCategoryLabel(member.category)} scans in this portal.`, 'warning');
      setTimeout(() => this.focusGateBarcodeInput(), 30);
      return;
    }

    this.processMatchedMemberPunch({
      memberKey: `${member.category}:${member.id}`,
      memberId: member.id,
      memberCategory: member.category,
      memberName: member.name,
      memberCode: member.code,
      gradeOrDept: member.subLabel || member.sectionOrDept,
      enrolledPhoto: member.faceProfile?.facePhotoData || member.image || '',
      snapUrl: '',
      confidence: 100,
      thresholdUsed: 100,
      modeTag: 'barcode_scanner',
      verifiedByLabel: 'Barcode / RFID Gate Kiosk',
      isAutoScan: false
    });
    setTimeout(() => this.focusGateBarcodeInput(), 30);
  }

  onEscapeKey(): void {
    if (this.kioskFullscreen()) {
      this.kioskFullscreen.set(false);
    }
  }

  openQuickEnrollPanel(prefillFromLive: boolean = false): void {
    if (!this.canEnrollCurrentPortal()) {
      this.emitToast('Face enrollment is restricted by School Owner permissions.', 'warning');
      return;
    }
    const enrollAllowed = this.enrollAllowedCategories();
    if (!this.isOwner() && enrollAllowed.length > 0 && !enrollAllowed.includes(this.quickEnrollCategory())) {
      this.quickEnrollCategory.set(enrollAllowed[0]);
    }
    this.quickEnrollDrawerOpen.set(true);
    this.quickEnrollFingerError.set('');
    const list = this.quickEnrollFilteredMembers();
    if (list.length > 0 && !this.quickEnrollMemberId()) {
      this.quickEnrollMemberId.set(list[0].id);
    }
    if (this.scannerChannel() === 'fingerprint') {
      void this.refreshFingerprintCapabilities();
      return;
    }
    if (this.cameraActive()) {
      if (prefillFromLive) {
        this.snapQuickSelfieFromLiveCamera();
      }
    } else if (this.canVerifyCameraCurrentPortal()) {
      void this.startCamera('verify', true);
    }
  }

  closeQuickEnrollPanel(): void {
    this.quickEnrollDrawerOpen.set(false);
    this.quickEnrollPreviewUrl.set('');
    this.quickEnrollExtraction.set(null);
    this.quickEnrollFingerCapture.set(null);
    this.quickEnrollFingerError.set('');
  }

  async captureQuickEnrollFingerprint(): Promise<void> {
    if (!this.canEnrollCurrentPortal() || !this.canUseFingerprint()) {
      this.emitToast('Fingerprint enrollment is disabled by School Owner permissions.', 'warning');
      return;
    }
    const member = this.quickEnrollSelectedMember();
    if (!member) {
      this.emitToast('Select a member first before scanning their fingerprint.', 'warning');
      return;
    }
    this.isCapturingQuickFinger.set(true);
    this.quickEnrollFingerError.set('');
    try {
      const capture = await this.fingerprintVerifier.enrollDeviceFingerprint(
        { id: member.id, category: member.category, name: member.name, code: member.code, sectionOrDept: member.subLabel },
        this.quickEnrollFingerLabel()
      );
      if (!capture.ok) {
        this.quickEnrollFingerError.set(capture.reason || 'Could not capture fingerprint from mobile/device sensor.');
        return;
      }
      this.quickEnrollFingerCapture.set(capture);
      this.quickEnrollFingerError.set('');
      this.playMatchChime();
      this.emitToast(`Fingerprint captured for ${member.name} (${this.quickEnrollFingerLabel()}). Tap Save Fingerprint.`, 'success');
    } finally {
      this.isCapturingQuickFinger.set(false);
    }
  }

  saveQuickFingerprintEnrollment(): void {
    if (!this.canEnrollCurrentPortal() || !this.canUseFingerprint()) {
      this.emitToast('Fingerprint enrollment is disabled by School Owner permissions.', 'warning');
      return;
    }
    const memberId = this.quickEnrollMemberId();
    const capture = this.quickEnrollFingerCapture();
    if (!memberId || !capture || !capture.ok) {
      this.emitToast('Choose a member and scan their fingerprint first.', 'warning');
      return;
    }
    const cat = this.quickEnrollCategory();
    if (!this.isOwner() && !this.enrollAllowedCategories().includes(cat)) {
      this.emitToast(`You do not have Owner permission to enroll ${this.categoryLabel(cat)} fingerprints.`, 'warning');
      return;
    }
    const list =
      cat === 'teacher'
        ? this.teacherMembers()
        : cat === 'staff'
          ? this.staffMembers()
          : cat === 'principal'
            ? this.principalMembers()
            : this.studentMembers();
    const member = list.find((m) => m.id === memberId);
    if (!member) {
      this.emitToast('Selected member could not be found.', 'warning');
      return;
    }

    const profile: FingerprintProfileRecord = {
      id: `FPP-${cat}-${member.id}`,
      memberId: member.id,
      memberCategory: cat,
      memberName: member.name,
      memberCode: member.code,
      gradeOrDept: member.subLabel,
      fingerLabel: this.quickEnrollFingerLabel() || 'Right Index',
      scannerType: capture.scannerType,
      credentialId: capture.credentialId,
      publicKeySpki: capture.publicKeySpki,
      fingerprintDescriptor: capture.descriptor,
      fingerprintPreviewData: capture.previewDataUrl,
      fingerprintHash: capture.fingerprintHash,
      qualityScore: capture.qualityScore,
      liteEnabled: true,
      enrolledBy: this.currentActorName() || 'Biometric Kiosk',
      enrolledAt: new Date().toISOString(),
      branchId: this.activeBranchScope() !== 'ALL' ? this.activeBranchScope() : undefined,
      branchName: this.activeBranchScope() !== 'ALL' ? this.activeBranchLabel() : undefined,
      wingId: this.activeWingScope() !== 'ALL' ? this.activeWingScope() : undefined
    };

    this.fingerprintEnrolled.emit(profile);
    this.playMatchChime();
    this.quickEnrollFingerCapture.set(null);
    this.quickEnrollDrawerOpen.set(false);
    this.emitToast(`${member.name} fingerprint registered! Ready for instant biometric attendance.`, 'success');
  }

  async snapQuickSelfieFromLiveCamera(): Promise<void> {
    if (!this.canEnrollCurrentPortal()) {
      this.emitToast('Face enrollment is disabled by School Owner permissions.', 'warning');
      return;
    }
    const videoEl = this.verifyVideoEl?.nativeElement;
    if (!this.cameraActive() || !videoEl || videoEl.readyState < 2) {
      this.quickSelfieFileEl?.nativeElement?.click();
      return;
    }
    const result = await this.faceVerifier.extractFromVideoAsync(videoEl, this.cameraFacingMode() === 'user', true);
    if (!result || !result.faceDetectedLikely || result.descriptor.length === 0) {
      this.emitToast(result?.reason || 'No clear face detected in camera. Look straight into the lens and tap Snap again.', 'warning');
      return;
    }
    this.quickEnrollPreviewUrl.set(result.photoDataUrl);
    this.quickEnrollExtraction.set(result);
    this.emitToast(`Face captured (${result.qualityScore}% quality · 128-D ID ready). Tap Save & Activate Face.`, 'info');
  }

  async onQuickSelfieFileSelected(event: Event): Promise<void> {
    if (!this.canEnrollCurrentPortal()) {
      return;
    }
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl?.files?.[0];
    if (!file) return;
    inputEl.value = '';
    const { result, rawDataUrl } = await this.faceVerifier.extractFromFile(file);
    if (!result) {
      this.emitToast('Could not read face signature from selfie image. Try a clear front photo.', 'warning');
      return;
    }
    this.quickEnrollPreviewUrl.set(result.photoDataUrl || rawDataUrl);
    this.quickEnrollExtraction.set(result);
    this.quickEnrollDrawerOpen.set(true);
  }

  saveQuickSelfieEnrollment(): void {
    if (!this.canEnrollCurrentPortal()) {
      this.emitToast('Face enrollment is disabled by School Owner permissions.', 'warning');
      return;
    }
    const memberId = this.quickEnrollMemberId();
    const extraction = this.quickEnrollExtraction();
    if (!memberId || !extraction) {
      this.emitToast('Choose a member and capture their selfie first.', 'warning');
      return;
    }
    const cat = this.quickEnrollCategory();
    if (!this.isOwner() && !this.enrollAllowedCategories().includes(cat)) {
      this.emitToast(`You do not have Owner permission to enroll ${this.categoryLabel(cat)} faces.`, 'warning');
      return;
    }
    const list =
      cat === 'teacher'
        ? this.teacherMembers()
        : cat === 'staff'
          ? this.staffMembers()
          : cat === 'principal'
            ? this.principalMembers()
            : this.studentMembers();
    const member = list.find((m) => m.id === memberId);
    if (!member) {
      this.emitToast('Selected member could not be found.', 'warning');
      return;
    }

    const profile: FaceProfileRecord = {
      id: `FP-${cat}-${member.id}`,
      memberId: member.id,
      memberCategory: cat,
      memberName: member.name,
      memberCode: member.code,
      gradeOrDept: member.subLabel,
      faceDescriptor: extraction.descriptor,
      facePhotoData: extraction.photoDataUrl,
      faceHash: extraction.hash,
      qualityScore: extraction.qualityScore,
      liteEnabled: true,
      enrolledBy: this.currentActorName() || 'Selfie Kiosk',
      enrolledAt: new Date().toISOString(),
      branchId: this.activeBranchScope() !== 'ALL' ? this.activeBranchScope() : undefined,
      branchName: this.activeBranchScope() !== 'ALL' ? this.activeBranchLabel() : undefined,
      wingId: this.activeWingScope() !== 'ALL' ? this.activeWingScope() : undefined
    };

    this.faceEnrolled.emit(profile);
    this.playMatchChime();
    this.quickEnrollPreviewUrl.set('');
    this.quickEnrollExtraction.set(null);
    this.quickEnrollDrawerOpen.set(false);
    this.emitToast(`${member.name} face registered! Ready for instant auto-recognition.`, 'success');
  }

  openCameraForMember(member: AttendanceMemberView): void {
    if (!this.canVerifyCameraCurrentPortal() || (!this.isOwner() && !this.allowedCategories().includes(member.category))) {
      this.emitToast(`School Owner has restricted camera verification for ${this.singleCategoryLabel(member.category)} records.`, 'warning');
      return;
    }
    this.scannerChannel.set('face');
    this.keepCameraOn.set(true);
    this.activeCategory.set(member.category);
    this.scanScope.set('targeted');
    this.selectedTargetMemberId.set(member.id);
    this.lastVerificationResult.set(null);
    this.capturedVerifyPreview.set('');
    this.activeSubTab.set('terminal');
    setTimeout(() => void this.startCamera('verify'), 60);
  }

  openFingerprintForMember(member: AttendanceMemberView): void {
    if (!this.canUseFingerprint()) {
      this.emitToast('Fingerprint biometric attendance is disabled in Owner Setup.', 'warning');
      return;
    }
    if (!this.canVerifyCameraCurrentPortal() || (!this.isOwner() && !this.allowedCategories().includes(member.category))) {
      this.emitToast(`School Owner has restricted biometric verification for ${this.singleCategoryLabel(member.category)} records.`, 'warning');
      return;
    }
    this.stopCamera(false);
    this.scannerChannel.set('fingerprint');
    this.activeCategory.set(member.category);
    this.scanScope.set('targeted');
    this.selectedTargetMemberId.set(member.id);
    this.lastVerificationResult.set(null);
    this.fingerSensorError.set('');
    this.fingerScanStatus.set(`Ready to verify ${member.name} by fingerprint.`);
    this.activeSubTab.set('terminal');
    void this.refreshFingerprintCapabilities();
  }

  openEnrollmentForMember(member: AttendanceMemberView): void {
    if (!this.canEnrollCurrentPortal() || (!this.isOwner() && !this.enrollAllowedCategories().includes(member.category))) {
      this.emitToast(`School Owner has restricted face enrollment for ${this.singleCategoryLabel(member.category)} records.`, 'warning');
      return;
    }
    this.enrollChannel.set('face');
    this.keepCameraOn.set(true);
    this.enrollCategory.set(member.category);
    this.enrollTargetMemberId.set(member.id);
    this.enrollCapturedDataUrl.set('');
    this.enrollExtraction.set(null);
    this.enrollLiteEnabled.set(member.liteEnabled);
    this.activeSubTab.set('enrollment');
    setTimeout(() => void this.startCamera('enroll'), 60);
  }

  openFingerEnrollmentForMember(member: AttendanceMemberView): void {
    if (!this.canUseFingerprint()) {
      this.emitToast('Fingerprint biometric enrollment is disabled in Owner Setup.', 'warning');
      return;
    }
    if (!this.canEnrollCurrentPortal() || (!this.isOwner() && !this.enrollAllowedCategories().includes(member.category))) {
      this.emitToast(`School Owner has restricted biometric enrollment for ${this.singleCategoryLabel(member.category)} records.`, 'warning');
      return;
    }
    this.stopCamera(false);
    this.enrollChannel.set('fingerprint');
    this.enrollCategory.set(member.category);
    this.enrollTargetMemberId.set(member.id);
    this.enrollFingerCapture.set(null);
    this.enrollFingerError.set('');
    this.enrollLiteEnabled.set(member.liteEnabled);
    this.activeSubTab.set('enrollment');
    void this.refreshFingerprintCapabilities();
  }

  setEnrollCategory(cat: AttendanceMemberCategory): void {
    if (!this.isOwner() && !this.enrollAllowedCategories().includes(cat)) {
      this.emitToast(`School Owner has restricted face enrollment for ${this.categoryLabel(cat)}.`, 'warning');
      return;
    }
    this.enrollCategory.set(cat);
    const list =
      cat === 'teacher'
        ? this.teacherMembers()
        : cat === 'staff'
          ? this.staffMembers()
          : cat === 'principal'
            ? this.principalMembers()
            : this.studentMembers();
    this.enrollTargetMemberId.set(list[0]?.id || '');
    this.enrollCapturedDataUrl.set('');
    this.enrollExtraction.set(null);
    this.enrollFingerCapture.set(null);
    this.enrollFingerError.set('');
  }

  // WebRTC Continuous Camera Engine
  async startCamera(slot: 'verify' | 'enroll', silent: boolean = false): Promise<boolean> {
    if (
      this.isPortalLocked() ||
      (slot === 'verify' && !this.canVerifyCameraCurrentPortal()) ||
      (slot === 'enroll' && !this.canEnrollCurrentPortal())
    ) {
      this.stopCamera(false);
      if (!silent) {
        this.emitToast('Camera verification access is currently locked by School Owner policy.', 'warning');
      }
      return false;
    }
    this.keepCameraOn.set(true);
    this.cameraError.set('');
    this.cameraErrorKind.set('none');
    if (!silent) {
      this.getAudioContext();
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.cameraErrorKind.set('unsupported');
      this.cameraError.set('Camera access requires HTTPS or a supported browser with a webcam.');
      if (!silent) {
        this.emitToast(this.cameraError(), 'warning');
      }
      return false;
    }

    const policyAllowsCamera = (() => {
      try {
        const docAny = document as any;
        if (docAny.permissionsPolicy?.allowsFeature) {
          return docAny.permissionsPolicy.allowsFeature('camera') !== false;
        }
        if (docAny.featurePolicy?.allowsFeature) {
          return docAny.featurePolicy.allowsFeature('camera') !== false;
        }
      } catch {}
      return true;
    })();

    if (!policyAllowsCamera) {
      this.cameraActive.set(false);
      this.cameraErrorKind.set('iframe_blocked');
      this.cameraError.set(
        'Camera access is blocked by AI Studio Preview (allow Camera access when prompted on Preview load, then tap Open Live Camera).'
      );
      if (!silent) {
        this.emitToast(this.cameraError(), 'warning');
      }
      return false;
    }

    this.stopCamera(false);
    this.activeCameraSlot = slot;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.cameraFacingMode(),
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      return this.activateMediaStream(slot, stream);
    } catch (firstErr: any) {
      const firstErrName = String(firstErr?.name || '');
      const isDirectDenial =
        firstErrName === 'NotAllowedError' ||
        firstErrName === 'PermissionDeniedError' ||
        firstErrName === 'SecurityError';

      let finalErr: any = firstErr;
      if (!isDirectDenial) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          return this.activateMediaStream(slot, fallbackStream);
        } catch (fallbackErr: any) {
          finalErr = fallbackErr;
        }
      }

      this.cameraActive.set(false);
      const errName = String(finalErr?.name || '');
      const errMsg = String(finalErr?.message || '').toLowerCase();

      let videoInputCount = -1;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoInputCount = devices.filter((d) => d.kind === 'videoinput').length;
      } catch {
        videoInputCount = -1;
      }

      if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError' || videoInputCount === 0) {
        this.cameraErrorKind.set('no_device');
        this.cameraError.set('No camera detected on this device. Connect a camera and tap Open Live Camera.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        this.cameraErrorKind.set('in_use');
        this.cameraError.set('Camera is in use by another app. Close it and tap Open Live Camera.');
      } else if (this.isInIframe || errMsg.includes('policy') || errMsg.includes('feature')) {
        this.cameraErrorKind.set('iframe_blocked');
        this.cameraError.set(
          'Camera access is blocked in AI Studio Preview — allow Camera permission for AI Studio Preview or browser settings, then tap Open Live Camera.'
        );
      } else {
        this.cameraErrorKind.set('permission_denied');
        this.cameraError.set(
          'Camera permission is denied in browser settings. Enable Camera permission for this site, then tap Open Live Camera.'
        );
      }
      if (!silent) {
        this.emitToast(this.cameraError(), 'warning');
      }
      return false;
    }
  }

  private activateMediaStream(slot: 'verify' | 'enroll', stream: MediaStream): boolean {
    this.mediaStream = stream;
    this.cameraActive.set(true);
    this.cameraErrorKind.set('none');
    this.phoneContinuousSnap.set(false);
    this.capturedVerifyPreview.set('');
    this.attachVideoStream(slot, stream, 10);
    for (const track of stream.getTracks()) {
      track.onended = () => {
        if (this.mediaStream === stream) {
          this.cameraActive.set(false);
          this.detectedFaceBox.set(null);
          if (this.keepCameraOn() && this.activeSubTab() === 'terminal') {
            setTimeout(() => void this.startCamera('verify', true), 250);
          }
        }
      };
    }
    if (slot === 'verify') {
      this.autoScanEnabled.set(true);
      this.startAutoScanLoop();
    }
    return true;
  }

  async activatePhoneCamera(slot: 'verify' | 'enroll'): Promise<void> {
    if (
      this.isPortalLocked() ||
      (slot === 'verify' && !this.canVerifyCameraCurrentPortal()) ||
      (slot === 'enroll' && !this.canEnrollCurrentPortal())
    ) {
      this.emitToast('Camera verification access is currently disabled by School Owner.', 'warning');
      return;
    }
    this.keepCameraOn.set(true);
    const liveStarted = await this.startCamera(slot, true);
    if (liveStarted) {
      this.emitToast('Live camera ON — everyone can walk up and scan automatically without extra clicks.', 'success');
      return;
    }
    this.phoneContinuousSnap.set(true);
    const inputEl = slot === 'verify' ? this.phoneVerifyInputEl?.nativeElement : this.phoneEnrollInputEl?.nativeElement;
    if (inputEl) {
      inputEl.click();
    }
  }

  copyAppUrl(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(this.fullTabUrl).then(
        () => this.emitToast('Standalone Kiosk link copied! Open on phone or tablet for continuous hands-free camera.', 'success'),
        () => this.emitToast('Use the Open Standalone Kiosk button to launch live camera in a dedicated tab.', 'info')
      );
    } else {
      this.emitToast('Use the Open Standalone Kiosk button to launch live camera in a dedicated browser tab.', 'info');
    }
  }

  private attachVideoStream(slot: 'verify' | 'enroll', stream: MediaStream, retries: number): void {
    const el = slot === 'verify' ? this.verifyVideoEl?.nativeElement : this.enrollVideoEl?.nativeElement;
    if (el) {
      el.muted = true;
      el.playsInline = true;
      el.autoplay = true;
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      el.srcObject = stream;
      el.play().catch(() => {});
      return;
    }
    if (retries > 0) {
      setTimeout(() => this.attachVideoStream(slot, stream, retries - 1), 80);
    }
  }

  switchCameraFacing(): void {
    const next = this.cameraFacingMode() === 'user' ? 'environment' : 'user';
    this.cameraFacingMode.set(next);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('scs_att_camera_facing', next);
      }
    } catch {}
    if (this.cameraActive() && this.activeCameraSlot) {
      void this.startCamera(this.activeCameraSlot, false);
    }
  }

  stopCamera(explicitUserStop: boolean = true): void {
    if (explicitUserStop) {
      this.keepCameraOn.set(false);
      this.phoneContinuousSnap.set(false);
    }
    this.stopAutoScanLoop();
    this.detectedFaceBox.set(null);
    this.multiFaceDetected.set(false);
    this.noFaceStreak = 0;
    this.unknownWarnedThisVisit = false;
    this.lastActiveFaceKey = '';
    this.lastDuplicateAlertAt = 0;
    this.stableCandidateKey = '';
    this.stableCandidateHits = 0;
    this.unknownConsecutiveHits = 0;
    this.unclearConsecutiveHits = 0;
    this.unclearWarnedThisVisit = false;
    if (this.overlayTimerId !== null) {
      clearTimeout(this.overlayTimerId);
      this.overlayTimerId = null;
    }
    this.scanOverlay.set(null);
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.onended = null;
        track.stop();
      }
      this.mediaStream = null;
    }
    this.cameraActive.set(false);
    this.activeCameraSlot = null;
  }

  toggleAutoScan(): void {
    const next = !this.autoScanEnabled();
    this.autoScanEnabled.set(next);
    if (next && this.cameraActive() && this.activeCameraSlot === 'verify') {
      this.startAutoScanLoop();
    } else {
      this.stopAutoScanLoop();
    }
  }

  private startAutoScanLoop(): void {
    this.stopAutoScanLoop();
    this.autoScanActive.set(true);
    void this.faceVerifier.ensureModelsLoaded();
    this.autoScanTimerId = setInterval(() => {
      if (!this.cameraActive() || this.activeCameraSlot !== 'verify' || !this.autoScanEnabled()) {
        this.stopAutoScanLoop();
        return;
      }
      if (this.isProcessingScan()) return;
      void this.runSingleAutoScanTick();
    }, 130);
  }

  private stopAutoScanLoop(): void {
    if (this.autoScanTimerId !== null) {
      clearInterval(this.autoScanTimerId);
      this.autoScanTimerId = null;
    }
    this.autoScanActive.set(false);
  }

  private async runSingleAutoScanTick(): Promise<void> {
    if (this.isPortalLocked() || !this.canVerifyCameraCurrentPortal()) {
      this.stopCamera(false);
      return;
    }
    const videoEl = this.verifyVideoEl?.nativeElement;
    if (!videoEl || videoEl.readyState < 2) return;

    this.isProcessingScan.set(true);
    try {
      const mirror = this.cameraFacingMode() === 'user';
      const extraction = await this.faceVerifier.extractFromVideoAsync(videoEl, mirror, false);

      if (extraction?.faceUnclear) {
        this.noFaceStreak = 0;
        this.detectedFaceBox.set(extraction.faceBox || null);
        this.multiFaceDetected.set(Boolean(extraction.detectedCount && extraction.detectedCount > 1));
        this.unclearConsecutiveHits++;
        if (!this.unclearWarnedThisVisit && this.unclearConsecutiveHits >= 3) {
          this.unclearWarnedThisVisit = true;
          const unclearMsg = extraction.reason || 'Face not clear — move closer and look straight at the camera.';
          this.lastVerificationResult.set({
            matched: false,
            resultType: 'unclear',
            confidence: 0,
            threshold: this.effectiveThreshold(),
            message: unclearMsg,
            memberName: 'Clear Face Needed',
            memberCode: '-',
            category: 'student',
            statusMarked: 'Not Clear'
          });
          this.triggerScanOverlay(
            {
              kind: 'unclear',
              title: 'Face Not Clear',
              subtitle: unclearMsg,
              badgeText: 'ADJUST FACE / LIGHTING'
            },
            1800
          );
          this.playAlertTone('unclear');
          this.emitToast(unclearMsg, 'warning');
        }
        return;
      }

      if (!extraction || !extraction.faceDetectedLikely) {
        this.noFaceStreak++;
        this.detectedFaceBox.set(null);
        this.multiFaceDetected.set(false);
        this.unclearConsecutiveHits = 0;
        this.unclearWarnedThisVisit = false;

        if (this.noFaceStreak >= 2) {
          this.lastActiveFaceKey = '';
          this.lastDuplicateAlertAt = 0;
          this.stableCandidateKey = '';
          this.stableCandidateHits = 0;
          this.unknownConsecutiveHits = 0;
          this.unknownWarnedThisVisit = false;
          const activeOv = this.scanOverlay();
          if (activeOv && (activeOv.kind === 'mismatch' || activeOv.kind === 'duplicate' || activeOv.kind === 'unclear')) {
            this.scanOverlay.set(null);
          }
        }

        // After ~1.1s with no face in front of camera, return screen to clean idle standby
        if (this.noFaceStreak >= 9) {
          if (this.overlayTimerId !== null) {
            clearTimeout(this.overlayTimerId);
            this.overlayTimerId = null;
          }
          if (this.scanOverlay()) {
            this.scanOverlay.set(null);
          }
          if (this.lastVerificationResult()) {
            this.lastVerificationResult.set(null);
          }
        }
        return;
      }

      this.noFaceStreak = 0;
      this.unclearConsecutiveHits = 0;
      this.unclearWarnedThisVisit = false;
      if (this.scanOverlay()?.kind === 'unclear') {
        this.scanOverlay.set(null);
      }
      this.multiFaceDetected.set(Boolean(extraction.detectedCount && extraction.detectedCount > 1));
      this.detectedFaceBox.set(extraction.faceBox || null);
      const profiles = this.activeFaceProfiles();
      if (profiles.length === 0) {
        this.unknownConsecutiveHits++;
        if (!this.unknownWarnedThisVisit && this.unknownConsecutiveHits >= 3) {
          this.unknownWarnedThisVisit = true;
          this.triggerScanOverlay(
            {
              kind: 'mismatch',
              title: 'Face Not Enrolled',
              subtitle: 'No faces registered yet — tap Enroll Now to register this person',
              badgeText: 'UNREGISTERED · ENROLL FIRST'
            },
            2200
          );
          this.playAlertTone('mismatch');
          this.emitToast('Face not enrolled yet — tap Enroll Now to register.', 'warning');
        }
        return;
      }

      this.completeVerificationMatch(extraction, profiles, true, videoEl, mirror);
    } finally {
      this.isProcessingScan.set(false);
    }
  }

  toggleFillLight(): void {
    this.fillLightBoost.update((v) => !v);
  }

  toggleLiteVerifyMode(): void {
    this.liteVerifyActive.update((v) => !v);
  }

  // Manual Frame Verification Button (if auto-scan paused or instant trigger)
  async verifyLiveCameraFrame(): Promise<void> {
    if (this.isPortalLocked() || !this.canVerifyCameraCurrentPortal()) {
      this.emitToast('Live camera verification is restricted by School Owner permissions.', 'warning');
      return;
    }
    if (this.isProcessingScan()) return;
    const profiles = this.activeFaceProfiles();
    if (profiles.length === 0) {
      if (this.canEnrollCurrentPortal()) {
        this.openQuickEnrollPanel(true);
        this.emitToast('No faces enrolled for permitted categories yet — snap a selfie to get started.', 'info');
      } else {
        this.emitToast('No enrolled faces found for the categories permitted to your portal.', 'warning');
      }
      return;
    }

    const videoEl = this.verifyVideoEl?.nativeElement;
    if (!this.cameraActive() || !videoEl) {
      this.emitToast('Start the live camera or drop selfie photos to verify.', 'warning');
      return;
    }

    this.isProcessingScan.set(true);
    try {
      const p = this.policy();
      if (p.verificationMode === 'strict' && p.livenessCheckEnabled && !this.liteVerifyActive()) {
        const liveness = await this.faceVerifier.checkVideoLiveness(videoEl);
        if (!liveness.passed) {
          this.lastVerificationResult.set({
            matched: false,
            confidence: 0,
            threshold: this.effectiveThreshold(),
            message: 'Liveness check failed: camera feed appears static. Blink or move slightly.',
            memberName: 'Static Frame',
            memberCode: '-',
            category: 'student',
            statusMarked: 'Rejected'
          });
          this.emitToast('Please hold a live face in front of the camera.', 'warning');
          return;
        }
      }

      const mirror = this.cameraFacingMode() === 'user';
      const extraction = await this.faceVerifier.extractFromVideoAsync(videoEl, mirror, false);
      if (!extraction) {
        this.emitToast('Unable to read camera frame. Ensure camera video feed is visible.', 'warning');
        return;
      }
      this.detectedFaceBox.set(extraction.faceBox || null);
      this.multiFaceDetected.set(Boolean(extraction.detectedCount && extraction.detectedCount > 1));
      this.completeVerificationMatch(extraction, profiles, false, videoEl, mirror);
    } finally {
      this.isProcessingScan.set(false);
    }
  }

  // Supports single or multiple selfie photos selected at once (for batch/offline scanning without webcam)
  async onVerifyPhotoFileSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const files = inputEl?.files ? Array.from(inputEl.files) : [];
    if (!files.length) return;
    inputEl.value = '';
    await this.processVerifyBatchFiles(files);
  }

  onViewportDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFiles.set(true);
  }

  onViewportDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFiles.set(false);
  }

  async onViewportDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDraggingFiles.set(false);
    if (this.scannerChannel() === 'fingerprint') return;
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith('image/')) : [];
    if (files.length === 0) return;
    await this.processVerifyBatchFiles(files);
  }

  private async processVerifyBatchFiles(files: File[]): Promise<void> {
    if (this.isPortalLocked() || !this.canVerifyCameraCurrentPortal()) {
      this.emitToast('Photo verification is restricted by School Owner permissions.', 'warning');
      return;
    }
    const profiles = this.activeFaceProfiles();
    if (profiles.length === 0) {
      if (this.canEnrollCurrentPortal()) {
        // Auto-load first photo into Quick Selfie Enroll if no profiles exist yet!
        const { result, rawDataUrl } = await this.faceVerifier.extractFromFile(files[0]);
        if (result) {
          this.quickEnrollPreviewUrl.set(result.photoDataUrl || rawDataUrl);
          this.quickEnrollExtraction.set(result);
          this.quickEnrollDrawerOpen.set(true);
          this.emitToast('No enrolled faces yet — select a member and tap Save & Activate Face!', 'info');
        }
      } else {
        this.emitToast('No enrolled faces found for your permitted categories.', 'warning');
      }
      return;
    }

    this.isProcessingScan.set(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (files.length > 1) {
          this.batchQueueStatus.set(`Scanning selfie ${i + 1} of ${files.length}...`);
        }
        const { result, rawDataUrl } = await this.faceVerifier.extractFromFile(file);
        if (!result) continue;
        this.capturedVerifyPreview.set(result.photoDataUrl || rawDataUrl);
        this.completeVerificationMatch(result, profiles, false);
        if (files.length > 1 && i < files.length - 1) {
          await new Promise((r) => setTimeout(r, 650));
        }
      }
    } finally {
      this.batchQueueStatus.set('');
      this.isProcessingScan.set(false);
    }
  }

  private completeVerificationMatch(
    extraction: FaceExtractionResult,
    profiles: FaceProfileRecord[],
    isAutoScan: boolean = false,
    videoElForLiveStream?: HTMLVideoElement,
    _mirrorForLiveStream: boolean = true
  ): void {
    // Live camera stream recognition NEVER captures or stores a snapshot photo
    const isLiveCameraScan = isAutoScan || Boolean(videoElForLiveStream);
    const resolveSnapUrl = (): string | undefined => {
      if (isLiveCameraScan) return undefined;
      return extraction.photoDataUrl || undefined;
    };

    const targetId = this.scanScope() === 'targeted' ? this.selectedTargetMemberId() : undefined;
    if (this.scanScope() === 'targeted' && targetId && !profiles.some((p) => p.memberId === targetId)) {
      if (isAutoScan) return;
      const targetMember = this.activeCategoryMembers().find((m) => m.id === targetId);
      this.lastVerificationResult.set({
        matched: false,
        confidence: 0,
        threshold: this.effectiveThreshold(),
        message: `${targetMember?.name || 'Selected member'} has no enrolled face yet.`,
        memberName: targetMember?.name || 'Unenrolled Member',
        memberCode: targetMember?.code || '-',
        category: targetMember?.category || 'student',
        statusMarked: 'Unenrolled',
        livePhoto: resolveSnapUrl()
      });
      return;
    }

    if (!extraction.faceDetectedLikely) {
      if (isAutoScan) return;
      this.lastVerificationResult.set({
        matched: false,
        confidence: 0,
        threshold: this.effectiveThreshold(),
        message: extraction.reason || 'Face not clearly centered. Turn Light ON and look straight at the camera.',
        memberName: 'Align Face',
        memberCode: '-',
        category: 'student',
        statusMarked: 'Retry',
        livePhoto: resolveSnapUrl()
      });
      return;
    }

    let threshold = this.effectiveThreshold();
    if (targetId) {
      const targetProf = profiles.find((p) => p.memberId === targetId);
      if (targetProf?.liteEnabled && this.policy().liteModeEnabled && this.liteVerifyActive()) {
        threshold = this.policy().liteConfidenceThreshold;
      }
    }

    const match = this.faceVerifier.matchAgainstProfiles(extraction.descriptor, profiles, threshold, targetId);
    const nowMs = Date.now();

    if (!match.matched || !match.profile) {
      this.stableCandidateKey = '';
      this.stableCandidateHits = 0;

      if (isAutoScan) {
        this.unknownConsecutiveHits++;
        // Wait for 3 neural frames (~390ms) with a real human face, then alert ONCE per walk-up
        if (this.unknownWarnedThisVisit || this.unknownConsecutiveHits < 3 || nowMs - this.unknownLastFeedbackAt < 2500) {
          return;
        }
        this.unknownLastFeedbackAt = nowMs;
        this.unknownWarnedThisVisit = true;
      }

      const closestName = match.candidateScores[0]?.profile?.memberName || 'Unregistered';
      const fallbackCat = match.candidateScores[0]?.profile?.memberCategory || 'student';
      this.lastVerificationResult.set({
        matched: false,
        resultType: 'mismatch',
        confidence: match.confidence,
        threshold: match.thresholdUsed,
        message: `Not enrolled / unregistered face (${match.confidence}% < ${match.thresholdUsed}% needed). Closest: ${closestName}.`,
        memberName: 'Unregistered Face',
        memberCode: '-',
        category: fallbackCat,
        statusMarked: 'Not Enrolled',
        livePhoto: isAutoScan ? undefined : resolveSnapUrl(),
        enrolledPhoto: match.candidateScores[0]?.profile?.facePhotoData
      });
      this.triggerScanOverlay(
        {
          kind: 'mismatch',
          title: 'Face Not Enrolled',
          subtitle: `Match ${match.confidence}% (min ${match.thresholdUsed}%) · Tap Enroll Now to register this person`,
          badgeText: 'UNREGISTERED · ENROLL NOW',
          confidence: match.confidence
        },
        2200
      );
      this.lastAlertBeepAt = nowMs;
      this.playAlertTone('mismatch');
      this.emitToast('Unregistered face detected — tap Enroll Now to register.', 'warning');
      return;
    }

    this.unknownConsecutiveHits = 0;
    this.unknownWarnedThisVisit = false;
    const prof = match.profile;
    if (!this.isOwner() && !this.allowedCategories().includes(prof.memberCategory)) {
      return;
    }
    const memberKey = `${prof.memberCategory}:${prof.memberId}`;
    if (!this.rawMemberLookup().has(memberKey)) {
      this.emitToast(`Cross-branch terminal guard: ${prof.memberName} does not belong to ${this.activeBranchLabel()}.`, 'warning');
      return;
    }

    // 2-frame neural stability lock (or instant 1-frame if confidence is very clear)
    if (isAutoScan) {
      if (this.stableCandidateKey === memberKey) {
        this.stableCandidateHits++;
      } else {
        this.stableCandidateKey = memberKey;
        this.stableCandidateHits = 1;
      }
      if (this.stableCandidateHits < 2 && match.confidence < threshold + 6) {
        return;
      }
    }

    const modeTag = this.liteVerifyActive() ? 'face_camera_lite' : `face_camera_${this.policy().verificationMode}`;
    const verifiedByLabel = isAutoScan
      ? (this.liteVerifyActive() ? 'Auto Kiosk (Lite)' : 'Auto Face Kiosk')
      : (this.liteVerifyActive() ? 'Face Scan (Lite)' : 'Face Camera Scan');

    this.processMatchedMemberPunch({
      memberKey,
      memberId: prof.memberId,
      memberCategory: prof.memberCategory,
      memberName: prof.memberName,
      memberCode: prof.memberCode,
      gradeOrDept: prof.gradeOrDept,
      enrolledPhoto: prof.facePhotoData,
      snapUrl: resolveSnapUrl(),
      confidence: match.confidence,
      thresholdUsed: match.thresholdUsed,
      modeTag,
      verifiedByLabel,
      isAutoScan
    });
  }

  // Biometric Fingerprint Verification (Real Mobile / Device Fingerprint Sensor 1:N / 1:1)
  async verifyFingerprintScan(): Promise<void> {
    if (this.isPortalLocked() || !this.canVerifyCameraCurrentPortal()) {
      this.emitToast('Biometric attendance verification is restricted by School Owner permissions.', 'warning');
      return;
    }
    if (!this.canUseFingerprint()) {
      this.emitToast('Fingerprint biometric attendance is disabled in Owner Setup.', 'warning');
      return;
    }
    if (this.isProcessingFingerScan()) return;

    this.getAudioContext();
    const profiles = this.activeFingerprintProfiles();
    const targetId = this.scanScope() === 'targeted' ? this.selectedTargetMemberId() : undefined;

    if (profiles.length === 0) {
      this.fingerSensorError.set('No fingerprints enrolled yet. Enroll a finger or switch to Face Camera.');
      if (this.canEnrollCurrentPortal()) {
        this.openQuickEnrollPanel(false);
      } else {
        this.emitToast('No enrolled fingerprints found for your permitted categories.', 'warning');
      }
      return;
    }

    if (this.scanScope() === 'targeted' && !targetId) {
      this.emitToast('Select a member in 1:1 Member mode before scanning fingerprint.', 'warning');
      return;
    }

    this.isProcessingFingerScan.set(true);
    this.fingerSensorError.set('');
    this.fingerScanStatus.set('Touch your mobile or device fingerprint sensor...');
    try {
      const match = await this.fingerprintVerifier.verifyDeviceFingerprint(profiles, targetId);
      if (!match.matched || !match.profile) {
        const reason = match.reason || 'Fingerprint did not match any enrolled profile.';
        this.fingerSensorError.set(reason);
        this.fingerScanStatus.set('');
        this.lastVerificationResult.set({
          matched: false,
          resultType: 'mismatch',
          confidence: match.confidence,
          threshold: this.effectiveFingerprintThreshold(),
          message: reason,
          memberName: 'Fingerprint Not Matched',
          memberCode: '-',
          category: 'student',
          statusMarked: 'Not Matched'
        });
        this.triggerScanOverlay(
          {
            kind: 'mismatch',
            title: 'Fingerprint Not Enrolled / Matched',
            subtitle: reason,
            badgeText: 'BIOMETRIC MISMATCH'
          },
          2200
        );
        this.playAlertTone('mismatch');
        return;
      }

      const prof = match.profile;
      if (!this.isOwner() && !this.allowedCategories().includes(prof.memberCategory)) {
        return;
      }
      if (!this.rawMemberLookup().has(`${prof.memberCategory}:${prof.memberId}`)) {
        this.emitToast(`Cross-branch terminal guard: ${prof.memberName} does not belong to ${this.activeBranchLabel()}.`, 'warning');
        return;
      }
      const thresholdUsed = this.effectiveFingerprintThreshold();
      if (match.confidence < thresholdUsed) {
        this.emitToast(`Fingerprint match ${match.confidence}% below threshold (${thresholdUsed}%).`, 'warning');
        return;
      }

      this.fingerScanStatus.set(`Verified: ${prof.memberName} (${prof.fingerLabel})`);
      this.processMatchedMemberPunch({
        memberKey: `${prof.memberCategory}:${prof.memberId}`,
        memberId: prof.memberId,
        memberCategory: prof.memberCategory,
        memberName: prof.memberName,
        memberCode: prof.memberCode,
        gradeOrDept: prof.gradeOrDept,
        enrolledPhoto: prof.fingerprintPreviewData,
        confidence: match.confidence,
        thresholdUsed,
        modeTag: 'fingerprint_device_webauthn',
        verifiedByLabel: `Mobile Fingerprint (${prof.fingerLabel})`,
        isAutoScan: false
      });
    } finally {
      this.isProcessingFingerScan.set(false);
    }
  }

  fallbackScanToFaceCamera(): void {
    this.stopCamera(false);
    this.fingerSensorError.set('');
    this.fingerScanStatus.set('');
    this.setScannerChannel('face');
    if (this.canVerifyCameraCurrentPortal()) {
      this.keepCameraOn.set(true);
      setTimeout(() => void this.startCamera('verify', false), 60);
    }
    this.emitToast('Switched to Face Camera Biometric.', 'info');
  }

  fallbackEnrollToFaceCamera(fromQuickDrawer: boolean = false): void {
    this.stopCamera(false);
    if (fromQuickDrawer) {
      this.quickEnrollFingerError.set('');
      this.quickEnrollFingerCapture.set(null);
      this.scannerChannel.set('face');
      this.quickEnrollDrawerOpen.set(true);
      if (this.canVerifyCameraCurrentPortal()) {
        this.keepCameraOn.set(true);
        setTimeout(() => void this.startCamera('verify', false), 60);
      }
      this.emitToast('Switched to Face Biometric Enrollment.', 'info');
      return;
    }

    this.enrollFingerError.set('');
    this.enrollFingerCapture.set(null);
    this.enrollCapturedDataUrl.set('');
    this.enrollExtraction.set(null);
    this.enrollChannel.set('face');
    if (this.canEnrollCurrentPortal()) {
      this.keepCameraOn.set(true);
      setTimeout(() => void this.startCamera('enroll', false), 60);
    }
    this.emitToast('Switched to Face Biometric Enrollment.', 'info');
  }

  // Shared Gate / Two-Punch / Anti-Duplicate / Timing / Persistence Pipeline for Face & Fingerprint
  private processMatchedMemberPunch(params: {
    memberKey: string;
    memberId: string;
    memberCategory: AttendanceMemberCategory;
    memberName: string;
    memberCode: string;
    gradeOrDept: string;
    enrolledPhoto?: string;
    snapUrl?: string;
    confidence: number;
    thresholdUsed: number;
    modeTag: string;
    verifiedByLabel: string;
    isAutoScan: boolean;
  }): void {
    const {
      memberKey,
      memberId,
      memberCategory,
      memberName,
      memberCode,
      gradeOrDept,
      enrolledPhoto,
      snapUrl,
      confidence,
      thresholdUsed,
      modeTag,
      verifiedByLabel,
      isAutoScan
    } = params;
    const nowMs = Date.now();
    const todayIso = new Date().toISOString().split('T')[0];
    const nowDate = new Date();
    const session = this.localSessionPunches.get(memberKey);

    const todayLogs = this.verificationLogs().filter(
      (l) =>
        l.memberCategory === memberCategory &&
        l.memberId === memberId &&
        l.date === todayIso &&
        (l.status === 'Present' || l.status === 'Late')
    );
    const inLog = todayLogs.find((l) => l.punchType !== 'OUT' && !String(l.verifiedBy || '').includes('· OUT'));
    const outLog = todayLogs.find((l) => l.punchType === 'OUT' || String(l.verifiedBy || '').includes('· OUT'));

    const hasIn = Boolean(session?.inTime || inLog);
    const hasOut = Boolean(session?.outTime || outLog);
    const twoPunch = Boolean(this.policy().twoPunchEnabled);
    const mode = this.gateMode();

    const nowMins = nowDate.getHours() * 60 + nowDate.getMinutes();
    const checkOutTimeStr = this.policy().checkOutEnableTime || '13:30';
    const checkOutMins = this.parseTimeMinutes(checkOutTimeStr) ?? (13 * 60 + 30);
    const minStayMs = 30 * 60 * 1000;

    let inElapsedMs = 0;
    if (session?.inAtMs) {
      inElapsedMs = Math.max(0, nowMs - session.inAtMs);
    } else if (inLog?.timestamp) {
      const parsedInMins = this.parseTimeMinutes(inLog.timestamp);
      if (parsedInMins !== null) {
        inElapsedMs = Math.max(0, (nowMins - parsedInMins) * 60 * 1000);
      }
    }

    const inTimeDisplay = session?.inTime || inLog?.timestamp || 'earlier today';
    const outTimeDisplay = session?.outTime || outLog?.timestamp || 'earlier today';

    let nextPunch: 'IN' | 'OUT' | null = null;
    let blockReason: string | null = null;

    if (mode === 'in') {
      if (!hasIn) {
        nextPunch = 'IN';
      } else {
        blockReason = `Duplicate Entry — Already Checked IN at ${inTimeDisplay}`;
      }
    } else if (mode === 'out') {
      if (!hasIn) {
        blockReason = 'No Check-IN recorded today — check IN first';
      } else if (!hasOut && inElapsedMs >= minStayMs) {
        nextPunch = 'OUT';
      } else if (hasOut) {
        blockReason = `Duplicate Entry — Already Checked OUT at ${outTimeDisplay}`;
      } else {
        const waitMins = Math.max(1, Math.ceil((minStayMs - inElapsedMs) / 60000));
        blockReason = `Duplicate Entry — Checked IN at ${inTimeDisplay} (OUT allowed after ${waitMins}m)`;
      }
    } else {
      // Real Biometric Gate Rule: 1st scan = IN; OUT only unlocks after checkOutEnableTime AND min 30m stay
      if (!hasIn) {
        nextPunch = 'IN';
      } else if (twoPunch && !hasOut && inElapsedMs >= minStayMs && nowMins >= checkOutMins) {
        nextPunch = 'OUT';
      } else if (hasOut) {
        blockReason = `Duplicate Entry — Already Checked IN (${inTimeDisplay}) & OUT (${outTimeDisplay}) today`;
      } else if (twoPunch && !hasOut) {
        if (nowMins < checkOutMins) {
          blockReason = `Duplicate Entry — Checked IN at ${inTimeDisplay} (OUT opens at ${checkOutTimeStr})`;
        } else {
          const waitMins = Math.max(1, Math.ceil((minStayMs - inElapsedMs) / 60000));
          blockReason = `Duplicate Entry — Checked IN at ${inTimeDisplay} (OUT opens in ${waitMins}m)`;
        }
      } else {
        blockReason = `Duplicate Entry — Attendance already marked IN at ${inTimeDisplay}`;
      }
    }

    if (!nextPunch) {
      if (isAutoScan && this.lastActiveFaceKey === memberKey && nowMs - this.lastSuccessAtMs < 2000) {
        return;
      }

      const isNewVisit = this.lastActiveFaceKey !== memberKey;
      this.lastActiveFaceKey = memberKey;

      const alreadySubtitle = blockReason || 'Duplicate Entry — Attendance already marked today';
      this.lastVerificationResult.set({
        matched: true,
        resultType: 'duplicate',
        confidence,
        threshold: thresholdUsed,
        message: alreadySubtitle,
        memberName,
        memberCode,
        category: memberCategory,
        statusMarked: hasOut ? 'Duplicate · Already Checked OUT' : 'Duplicate · Already Checked IN',
        enrolledPhoto,
        livePhoto: isAutoScan ? undefined : snapUrl,
        savedOffline: !this.isBrowserOnline()
      });
      this.triggerScanOverlay(
        {
          kind: 'duplicate',
          title: memberName,
          subtitle: alreadySubtitle,
          badgeText: hasOut ? 'DUPLICATE · ALREADY IN & OUT' : 'DUPLICATE · ALREADY CHECKED IN',
          confidence,
          memberCode,
          storageLabel: this.isBrowserOnline() ? 'SQLite + Cloud Synced' : 'SQLite Offline Saved'
        },
        1600
      );

      if (!isAutoScan || isNewVisit || nowMs - this.lastDuplicateAlertAt >= 4000) {
        this.lastDuplicateAlertAt = nowMs;
        this.playAlertTone('duplicate');
        this.emitToast(`${memberName} — ${alreadySubtitle}`, 'warning');
      }
      return;
    }

    // Fresh Attendance Verification -> GREEN TICK + SQLite Offline-First Save
    this.lastActiveFaceKey = memberKey;
    this.lastDuplicateAlertAt = 0;
    this.lastSuccessAtMs = nowMs;
    this.stableCandidateKey = '';
    this.stableCandidateHits = 0;

    const timeLabel = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const status = nextPunch === 'IN' ? this.computeArrivalStatus() : 'Present';
    const scheduledStartTime = this.policy().scheduledStartTime || '08:00';
    const punctuality =
      nextPunch === 'IN'
        ? this.computePunctualityFromCheckIn(timeLabel, scheduledStartTime, this.policy().lateCutoffTime || '08:15', status)
        : { lateMinutes: null as number | null, lateByLabel: '', lateSeverity: 'none' as LateSeverityKind };

    if (nextPunch === 'IN') {
      this.localSessionPunches.set(memberKey, {
        ...(session || {}),
        inTime: timeLabel,
        inAtMs: nowMs,
        scheduledStartTime,
        lateMinutes: punctuality.lateMinutes ?? 0,
        lateByLabel: punctuality.lateByLabel
      });
    } else {
      this.localSessionPunches.set(memberKey, { ...(session || {}), outTime: timeLabel, outAtMs: nowMs });
    }
    this.punchRevision.update((v) => v + 1);

    const storageLabel = this.isBrowserOnline() ? 'SQLite + Auto-Sync' : 'Saved Offline · Auto-Sync Ready';
    const overlayBadge = nextPunch === 'OUT' ? 'CHECKED OUT · VERIFIED' : 'ATTENDANCE MARKED · OK';
    const timingSuffix = punctuality.lateByLabel ? ` · ${punctuality.lateByLabel}` : '';
    const overlaySub =
      nextPunch === 'OUT'
        ? `${this.singleCategoryLabel(memberCategory)} · ${gradeOrDept} · OUT ${timeLabel}`
        : `${this.singleCategoryLabel(memberCategory)} · ${gradeOrDept} · ${status} ${timeLabel}${timingSuffix}`;

    this.recentVerifiedFeed.update((feed) =>
      [
        {
          id: `${memberKey}-${nowMs}`,
          name: memberName,
          category: memberCategory,
          punch: nextPunch as 'IN' | 'OUT',
          time: timeLabel,
          lateByLabel: punctuality.lateByLabel || undefined,
          confidence,
          syncedLabel: this.isBrowserOnline() ? 'SQLite · Synced' : 'Offline Queued'
        },
        ...feed
      ].slice(0, 6)
    );

    this.lastVerificationResult.set({
      matched: true,
      resultType: 'success',
      confidence,
      threshold: thresholdUsed,
      message: `${overlayBadge} (${confidence}% match) — ${memberName} (${nextPunch} at ${timeLabel}${timingSuffix})`,
      memberName,
      memberCode,
      category: memberCategory,
      statusMarked: nextPunch === 'OUT' ? 'Checked Out' : status,
      lateByLabel: punctuality.lateByLabel || undefined,
      enrolledPhoto,
      livePhoto: snapUrl,
      savedOffline: !this.isBrowserOnline()
    });

    this.triggerScanOverlay(
      {
        kind: 'success',
        title: memberName,
        subtitle: overlaySub,
        badgeText: overlayBadge,
        punchType: nextPunch,
        confidence,
        memberCode,
        lateByLabel: punctuality.lateByLabel || undefined,
        storageLabel
      },
      1800
    );

    this.playMatchChime();
    this.emitToast(`✔ ${memberName} — ${nextPunch} (${status}${timingSuffix}) · ${confidence}%`, 'success');

    this.attendanceRecorded.emit({
      memberCategory,
      memberId,
      memberName,
      memberCode,
      gradeOrDept,
      status,
      punchType: nextPunch,
      scheduledStartTime,
      lateMinutes: punctuality.lateMinutes ?? 0,
      lateByLabel: punctuality.lateByLabel,
      checkInTime: nextPunch === 'IN' ? timeLabel : undefined,
      verificationMode: modeTag,
      confidenceScore: confidence,
      verifiedBy: `${verifiedByLabel} · ${nextPunch}`,
      snapshotData: snapUrl
    });
  }

  private triggerScanOverlay(
    overlay: {
      kind: 'success' | 'duplicate' | 'mismatch' | 'unclear';
      title: string;
      subtitle: string;
      badgeText: string;
      punchType?: 'IN' | 'OUT';
      confidence?: number;
      memberCode?: string;
      lateByLabel?: string;
      storageLabel?: string;
    },
    durationMs: number
  ): void {
    if (this.overlayTimerId !== null) {
      clearTimeout(this.overlayTimerId);
      this.overlayTimerId = null;
    }
    this.scanOverlay.set(overlay);
    this.overlayTimerId = setTimeout(() => {
      this.scanOverlay.set(null);
      this.overlayTimerId = null;
    }, durationMs);
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new Ctx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  private playMatchChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      // Rich two-tone biometric confirmation chime (audible & crisp on mobile/desktop speakers)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(1046.5, t);
      osc1.frequency.setValueAtTime(1567.98, t + 0.09);
      osc2.frequency.setValueAtTime(1318.5, t);
      osc2.frequency.setValueAtTime(2093.0, t + 0.09);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.36, t + 0.015);
      gain.gain.setValueAtTime(0.34, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.35);
      osc2.stop(t + 0.35);
    } catch {}
  }

  private playAlertTone(kind: 'duplicate' | 'mismatch' | 'unclear'): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      if (kind === 'duplicate') {
        // Distinct Red-Caution double-beep ("already marked")
        [0, 0.16].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(idx === 0 ? 520 : 380, t + offset);
          gain.gain.setValueAtTime(0.01, t + offset);
          gain.gain.linearRampToValueAtTime(0.32, t + offset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.13);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t + offset);
          osc.stop(t + offset + 0.14);
        });
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === 'unclear' ? 'sine' : 'triangle';
      if (kind === 'unclear') {
        osc.frequency.setValueAtTime(520, t);
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      } else {
        osc.frequency.setValueAtTime(360, t);
        osc.frequency.setValueAtTime(220, t + 0.12);
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.31);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.32);
      }
    } catch {}
  }

  // Face Enrollment Tab Methods
  async captureEnrollmentFromCamera(): Promise<void> {
    if (!this.canEnrollCurrentPortal()) {
      this.emitToast('Face enrollment is restricted by School Owner permissions.', 'warning');
      return;
    }
    const videoEl = this.enrollVideoEl?.nativeElement;
    if (!this.cameraActive() || !videoEl) {
      this.emitToast('Open Live Camera or snap a Selfie to capture face.', 'warning');
      return;
    }
    this.isCapturingEnroll.set(true);
    try {
      const result = await this.faceVerifier.extractFromVideoAsync(videoEl, this.cameraFacingMode() === 'user', true);
      if (!result || !result.faceDetectedLikely || result.descriptor.length === 0) {
        this.emitToast(result?.reason || 'No clear face detected in camera. Look straight into the camera and try again.', 'warning');
        return;
      }
      this.enrollCapturedDataUrl.set(result.photoDataUrl);
      this.enrollExtraction.set(result);
      this.emitToast(`Face captured (${result.qualityScore}% quality · 128-D neural ID). Click Save Face Profile.`, 'info');
    } finally {
      this.isCapturingEnroll.set(false);
    }
  }

  async onEnrollPhotoFileSelected(event: Event): Promise<void> {
    if (!this.canEnrollCurrentPortal()) return;
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl?.files?.[0];
    if (!file) return;
    inputEl.value = '';
    await this.processEnrollFile(file);
  }

  private async processEnrollFile(file: File): Promise<void> {
    this.isCapturingEnroll.set(true);
    try {
      const { result, rawDataUrl } = await this.faceVerifier.extractFromFile(file);
      if (!result) {
        this.emitToast('Could not process selected photo for face encoding.', 'warning');
        return;
      }
      this.enrollCapturedDataUrl.set(result.photoDataUrl || rawDataUrl);
      this.enrollExtraction.set(result);
      this.emitToast(`Face photo analyzed (${result.qualityScore}% quality). Ready to save.`, 'info');
    } finally {
      this.isCapturingEnroll.set(false);
    }
  }

  saveEnrolledFaceProfile(): void {
    if (!this.canEnrollCurrentPortal()) {
      this.emitToast('Face enrollment is restricted by School Owner permissions.', 'warning');
      return;
    }
    const memberId = this.enrollTargetMemberId();
    const extraction = this.enrollExtraction();
    if (!memberId || !extraction) {
      this.emitToast('Select a member and capture their face photo before saving.', 'warning');
      return;
    }
    const cat = this.enrollCategory();
    if (!this.isOwner() && !this.enrollAllowedCategories().includes(cat)) {
      this.emitToast(`School Owner has restricted face enrollment for ${this.categoryLabel(cat)}.`, 'warning');
      return;
    }
    const member = this.enrollCategoryMembers().find((m) => m.id === memberId);
    if (!member) {
      this.emitToast('Selected member record could not be found.', 'warning');
      return;
    }

    const profile: FaceProfileRecord = {
      id: `FP-${cat}-${member.id}`,
      memberId: member.id,
      memberCategory: cat,
      memberName: member.name,
      memberCode: member.code,
      gradeOrDept: member.subLabel,
      faceDescriptor: extraction.descriptor,
      facePhotoData: extraction.photoDataUrl,
      faceHash: extraction.hash,
      qualityScore: extraction.qualityScore,
      liteEnabled: this.enrollLiteEnabled(),
      enrolledBy: this.currentActorName(),
      enrolledAt: new Date().toISOString(),
      branchId: this.activeBranchScope() !== 'ALL' ? this.activeBranchScope() : undefined,
      branchName: this.activeBranchScope() !== 'ALL' ? this.activeBranchLabel() : undefined,
      wingId: this.activeWingScope() !== 'ALL' ? this.activeWingScope() : undefined
    };

    this.faceEnrolled.emit(profile);
    this.enrollCapturedDataUrl.set('');
    this.enrollExtraction.set(null);
  }

  removeEnrolledFace(profileId: string): void {
    if (!this.canEnrollCurrentPortal()) {
      this.emitToast('Face enrollment removal is restricted by School Owner permissions.', 'warning');
      return;
    }
    this.faceRemoved.emit(profileId);
  }

  // Biometric Fingerprint Enrollment Tab Methods (Real Mobile / Device Fingerprint Sensor)
  async captureDeviceFingerprintForEnroll(): Promise<void> {
    if (!this.canEnrollCurrentPortal() || !this.canUseFingerprint()) {
      this.emitToast('Fingerprint enrollment is restricted by School Owner permissions.', 'warning');
      return;
    }
    const member = this.enrollSelectedMember();
    if (!member) {
      this.emitToast('Select an existing member before scanning their fingerprint.', 'warning');
      return;
    }
    this.isCapturingFingerEnroll.set(true);
    this.enrollFingerError.set('');
    try {
      const cap = await this.fingerprintVerifier.enrollDeviceFingerprint(
        { id: member.id, category: member.category, name: member.name, code: member.code, sectionOrDept: member.subLabel },
        this.enrollFingerLabel()
      );
      if (!cap.ok) {
        this.enrollFingerError.set(cap.reason || 'Mobile/device biometric fingerprint capture failed.');
        return;
      }
      this.enrollFingerCapture.set(cap);
      this.enrollFingerError.set('');
      this.playMatchChime();
      this.emitToast(`Fingerprint captured (${cap.qualityScore}% quality · ${this.enrollFingerLabel()}). Click Save Fingerprint Profile.`, 'success');
    } finally {
      this.isCapturingFingerEnroll.set(false);
    }
  }

  saveEnrolledFingerprintProfile(): void {
    if (!this.canEnrollCurrentPortal() || !this.canUseFingerprint()) {
      this.emitToast('Fingerprint enrollment is restricted by School Owner permissions.', 'warning');
      return;
    }
    const memberId = this.enrollTargetMemberId();
    const capture = this.enrollFingerCapture();
    if (!memberId || !capture || !capture.ok) {
      this.emitToast('Select a member and capture their fingerprint before saving.', 'warning');
      return;
    }
    const cat = this.enrollCategory();
    if (!this.isOwner() && !this.enrollAllowedCategories().includes(cat)) {
      this.emitToast(`School Owner has restricted biometric enrollment for ${this.categoryLabel(cat)}.`, 'warning');
      return;
    }
    const member = this.enrollCategoryMembers().find((m) => m.id === memberId);
    if (!member) {
      this.emitToast('Selected member record could not be found.', 'warning');
      return;
    }

    const profile: FingerprintProfileRecord = {
      id: `FPP-${cat}-${member.id}`,
      memberId: member.id,
      memberCategory: cat,
      memberName: member.name,
      memberCode: member.code,
      gradeOrDept: member.subLabel,
      fingerLabel: this.enrollFingerLabel() || 'Right Index',
      scannerType: capture.scannerType,
      credentialId: capture.credentialId,
      publicKeySpki: capture.publicKeySpki,
      fingerprintDescriptor: capture.descriptor,
      fingerprintPreviewData: capture.previewDataUrl,
      fingerprintHash: capture.fingerprintHash,
      qualityScore: capture.qualityScore,
      liteEnabled: this.enrollLiteEnabled(),
      enrolledBy: this.currentActorName(),
      enrolledAt: new Date().toISOString(),
      branchId: this.activeBranchScope() !== 'ALL' ? this.activeBranchScope() : undefined,
      branchName: this.activeBranchScope() !== 'ALL' ? this.activeBranchLabel() : undefined,
      wingId: this.activeWingScope() !== 'ALL' ? this.activeWingScope() : undefined
    };

    this.fingerprintEnrolled.emit(profile);
    this.playMatchChime();
    this.enrollFingerCapture.set(null);
    this.emitToast(`${member.name} fingerprint saved! Ready for biometric IN/OUT attendance.`, 'success');
  }

  removeEnrolledFingerprint(profileId: string): void {
    if (!this.canEnrollCurrentPortal()) {
      this.emitToast('Fingerprint removal is restricted by School Owner permissions.', 'warning');
      return;
    }
    this.fingerprintRemoved.emit(profileId);
  }

  handleRosterStatusAction(member: AttendanceMemberView, status: 'Present' | 'Late' | 'Absent' | 'On Leave'): void {
    if (!this.isOwner() && !this.allowedCategories().includes(member.category)) {
      this.emitToast(`School Owner has restricted attendance actions for ${this.singleCategoryLabel(member.category)} records.`, 'warning');
      return;
    }
    if (!this.canUseManualFallback()) {
      if (!this.canVerifyCameraCurrentPortal()) {
        this.emitToast('Camera verification is disabled for your portal by School Owner.', 'warning');
        return;
      }
      this.emitToast(`Opening Face Scanner for ${member.name}...`, 'info');
      this.openCameraForMember(member);
      return;
    }
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const scheduledStartTime = this.policy().scheduledStartTime || '08:00';
    const isPresentOrLate = status === 'Present' || status === 'Late';
    const punctuality = isPresentOrLate
      ? this.computePunctualityFromCheckIn(nowTime, scheduledStartTime, this.policy().lateCutoffTime || '08:15', status)
      : { lateMinutes: 0, lateByLabel: '' };
    this.attendanceRecorded.emit({
      memberCategory: member.category,
      memberId: member.id,
      memberName: member.name,
      memberCode: member.code,
      gradeOrDept: member.subLabel,
      status,
      punchType: 'IN',
      scheduledStartTime,
      lateMinutes: punctuality.lateMinutes ?? 0,
      lateByLabel: punctuality.lateByLabel,
      checkInTime: isPresentOrLate ? nowTime : undefined,
      verificationMode: 'manual_owner_override',
      confidenceScore: 100,
      verifiedBy: `${this.currentActorName()} (Manual Override)`
    });
  }

  submitNewStaff(): void {
    const name = this.newStaffName().trim();
    const roleTitle = this.newStaffRole().trim();
    if (!name || !roleTitle) {
      this.emitToast('Enter staff member full name and role/designation.', 'warning');
      return;
    }
    this.staffCreated.emit({
      name,
      fatherName: this.newStaffFatherName().trim() || undefined,
      cnic: this.newStaffCnic().trim() || undefined,
      gender: this.newStaffGender() || 'Male',
      roleTitle,
      department: this.newStaffDepartment().trim() || 'Campus Administration',
      phone: this.newStaffPhone().trim() || '+92 300 0000000',
      shift: this.newStaffShift().trim() || 'Morning (07:30 AM - 03:30 PM)',
      liteEnabled: this.newStaffLiteEnabled(),
      customValues: { ...this.staffCustomValues() }
    });
    this.newStaffName.set('');
    this.newStaffFatherName.set('');
    this.newStaffCnic.set('');
    this.newStaffRole.set('');
    this.staffCustomValues.set({});
    this.showAddStaffForm.set(false);
  }

  submitNewPrincipal(): void {
    const name = this.newPrincipalName().trim();
    const roleTitle = this.newPrincipalRole().trim();
    if (!name || !roleTitle) {
      this.emitToast('Enter principal / vice principal full name and title.', 'warning');
      return;
    }
    this.principalCreated.emit({
      name,
      fatherName: this.newPrincipalFatherName().trim() || undefined,
      cnic: this.newPrincipalCnic().trim() || undefined,
      gender: this.newPrincipalGender() || 'Male',
      roleTitle,
      department: this.newPrincipalDepartment().trim() || 'Executive Directorate',
      phone: this.newPrincipalPhone().trim() || '+92 300 0000000',
      shift: this.newPrincipalShift().trim() || 'Full Day (07:30 AM - 04:00 PM)',
      liteEnabled: this.newPrincipalLiteEnabled(),
      customValues: { ...this.principalCustomValues() }
    });
    this.newPrincipalName.set('');
    this.newPrincipalFatherName.set('');
    this.newPrincipalCnic.set('');
    this.newPrincipalRole.set('Vice Principal');
    this.principalCustomValues.set({});
    this.showAddPrincipalForm.set(false);
  }

  // Owner Policy Draft Mutations
  updateDraftMode(mode: 'strict' | 'standard' | 'lite'): void {
    this.policyDraft.update((d) => ({
      ...d,
      verificationMode: mode,
      livenessCheckEnabled: mode === 'strict' ? true : d.livenessCheckEnabled,
      liteModeEnabled: mode === 'lite' ? true : d.liteModeEnabled
    }));
  }

  toggleDraftField(
    field:
      | 'liteModeEnabled'
      | 'cameraFillLightEnabled'
      | 'livenessCheckEnabled'
      | 'autoCaptureOnMatch'
      | 'requireCameraForAllAttendance'
      | 'allowFingerprintAttendance'
      | 'twoPunchEnabled'
  ): void {
    this.policyDraft.update((d) => {
      const current = field === 'allowFingerprintAttendance' ? d[field] !== false : Boolean(d[field]);
      return { ...d, [field]: !current };
    });
  }

  setDraftFillLightColor(color: 'neutral' | 'warm' | 'bright'): void {
    this.policyDraft.update((d) => ({ ...d, fillLightColor: color }));
  }

  setDraftNumber(field: 'confidenceThreshold' | 'liteConfidenceThreshold' | 'fingerprintConfidenceThreshold', raw: string): void {
    const num = Math.max(50, Math.min(98, Number(raw) || 75));
    this.policyDraft.update((d) => ({ ...d, [field]: num }));
  }

  setDraftScheduledStartTime(raw: string): void {
    this.policyDraft.update((d) => ({ ...d, scheduledStartTime: raw || '08:00' }));
  }

  setDraftTime(raw: string): void {
    this.policyDraft.update((d) => ({ ...d, lateCutoffTime: raw || '08:15' }));
  }

  setDraftCheckOutTime(raw: string): void {
    this.policyDraft.update((d) => ({ ...d, checkOutEnableTime: raw || '13:30' }));
  }

  toggleCategoryRule(cat: AttendanceMemberCategory, key: 'enabled' | 'liteEnabled' | 'cameraRequired' | 'allowSelfCheckIn'): void {
    this.policyDraft.update((d) => {
      const nextVal = !d.categories[cat][key];
      const nextRoleAccess =
        cat === 'student' && key === 'allowSelfCheckIn'
          ? { ...d.roleAccess, student: { ...d.roleAccess.student, selfCheckInEnabled: nextVal } }
          : d.roleAccess;
      return {
        ...d,
        categories: {
          ...d.categories,
          [cat]: { ...d.categories[cat], [key]: nextVal }
        },
        roleAccess: nextRoleAccess
      };
    });
  }

  getCategoryRule(cat: AttendanceMemberCategory) {
    return this.policyDraft().categories[cat];
  }

  toggleRolePermission(role: 'principal' | 'teacher' | 'staff' | 'student', key: keyof RoleAttendancePermission): void {
    this.policyDraft.update((d) => {
      const nextVal = !d.roleAccess[role][key];
      const nextCategories =
        role === 'student' && key === 'selfCheckInEnabled'
          ? { ...d.categories, student: { ...d.categories.student, allowSelfCheckIn: nextVal } }
          : d.categories;
      return {
        ...d,
        categories: nextCategories,
        roleAccess: {
          ...d.roleAccess,
          [role]: { ...d.roleAccess[role], [key]: nextVal }
        }
      };
    });
  }

  toggleIndividualOperatorOverride(cat: 'teacher' | 'staff' | 'principal', memberId: string, field: 'enabled' | 'liteEnabled'): void {
    const key = `${cat}:${memberId}`;
    this.policyDraft.update((d) => {
      const current = d.operatorOverrides[key] || { enabled: true, liteEnabled: true };
      return {
        ...d,
        operatorOverrides: {
          ...d.operatorOverrides,
          [key]: { ...current, [field]: !current[field] }
        }
      };
    });
  }

  isMemberOverrideActive(cat: 'teacher' | 'staff' | 'principal', memberId: string, field: 'enabled' | 'liteEnabled'): boolean {
    const ov = this.policyDraft().operatorOverrides?.[`${cat}:${memberId}`];
    if (!ov) return true;
    return Boolean(ov[field]);
  }

  getOperatorOverrideMembers(): AttendanceMemberView[] {
    const cat = this.operatorFilterCategory();
    if (cat === 'teacher') return this.teacherMembers();
    if (cat === 'principal') return this.principalMembers();
    return this.staffMembers();
  }

  commitOwnerPolicy(): void {
    if (!this.isOwner()) {
      this.emitToast('Only School Owner can save Attendance Setup & Access Control.', 'warning');
      return;
    }
    this.policySaved.emit(this.clonePolicy(this.policyDraft()));
  }

  // Customizable Columns & Dynamic PDF / CSV Export Engine
  private loadInitialColumnSelection(): Record<AttendanceColumnKey, boolean> {
    const defaults = createDefaultColumnSelection('local_official');
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('scs_att_visible_columns_v1');
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Record<AttendanceColumnKey, boolean>>;
          const merged = { ...defaults };
          for (const col of ATTENDANCE_COLUMN_DEFINITIONS) {
            if (typeof parsed[col.key] === 'boolean') {
              merged[col.key] = Boolean(parsed[col.key]);
            }
          }
          if (Object.values(merged).some(Boolean)) {
            return merged;
          }
        }
      }
    } catch {}
    return defaults;
  }

  private persistColumnSelection(next: Record<AttendanceColumnKey, boolean>): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('scs_att_visible_columns_v1', JSON.stringify(next));
      }
    } catch {}
  }

  isColVisible(key: AttendanceColumnKey): boolean {
    return Boolean(this.selectedColumns()[key]);
  }

  toggleColumn(key: AttendanceColumnKey): void {
    if (!this.isOwner()) {
      this.emitToast('Only School Business Owner can modify table columns.', 'warning');
      return;
    }
    const cur = this.selectedColumns();
    const activeCount = Object.values(cur).filter(Boolean).length;
    if (cur[key] && activeCount <= 1) {
      this.emitToast('Keep at least 1 column selected for the roster & export report.', 'warning');
      return;
    }
    const next = { ...cur, [key]: !cur[key] };
    this.selectedColumns.set(next);
    this.activeColumnPreset.set('custom');
    this.persistColumnSelection(next);
  }

  applyColumnPreset(preset: AttendanceColumnPresetKey): void {
    if (!this.isOwner()) {
      this.emitToast('Only School Business Owner can change column presets.', 'warning');
      return;
    }
    const next = createDefaultColumnSelection(preset);
    this.selectedColumns.set(next);
    this.activeColumnPreset.set(preset);
    this.persistColumnSelection(next);
  }

  formatColumnValue(m: AttendanceMemberView, key: AttendanceColumnKey): string {
    switch (key) {
      case 'code':
        return m.code;
      case 'member':
        return m.name;
      case 'category':
        return this.singleCategoryLabel(m.category);
      case 'classDept':
        return `${m.subLabel}${m.sectionOrDept ? ' (' + m.sectionOrDept + ')' : ''}`;
      case 'fatherName':
        return m.fatherName && m.fatherName !== '—' ? `${m.fatherName}${m.guardianRelation && m.category === 'student' ? ' (' + m.guardianRelation + ')' : ''}` : '—';
      case 'cnicBForm':
        return m.cnicBForm || '—';
      case 'guardianCnic':
        return m.guardianCnic || '—';
      case 'passportNo':
        return m.passportNo || '—';
      case 'nationality':
        return m.nationality || 'Pakistani';
      case 'gender':
        return m.gender || '—';
      case 'dob':
        return m.dob || '—';
      case 'bloodGroup':
        return m.bloodGroup || '—';
      case 'phone':
        return m.phone || '—';
      case 'emergencyContact':
        return m.emergencyContact || '—';
      case 'email':
        return m.email || '—';
      case 'address':
        return m.address || '—';
      case 'scheduledStartTime':
        return m.scheduledStartTime || '08:00';
      case 'checkInTime':
        return m.checkInTime || '—';
      case 'lateByLabel':
        return m.lateByLabel || '—';
      case 'checkOutTime':
        return m.checkOutTime || '—';
      case 'durationLabel':
        return `${m.durationLabel} (${m.punchState})`;
      case 'verifyFace': {
        const badges: string[] = [];
        if (m.isEnrolled) badges.push('Face');
        if (m.isFingerprintEnrolled) badges.push('Finger');
        if (badges.length === 0) return 'Not Enrolled';
        return m.lastConfidence > 0 ? `Matched ${m.lastConfidence}% (${badges.join('+')})` : `${badges.join(' + ')} Enrolled`;
      }
      case 'verifiedMethod':
        return m.verifiedMethod || '—';
      case 'overallRate':
        return m.monthlyRate || '—';
      case 'punchCounts':
        return `IN: ${m.totalInCount} / OUT: ${m.totalOutCount}`;
      case 'gateOrLocation':
        return m.gateOrLocation || 'Campus Gate 01';
      case 'status':
        return m.status;
      case 'remarks':
        return m.remarks || '—';
      default:
        return '—';
    }
  }

  exportCurrentCategoryCSV(): void {
    if (!this.canExportCurrentPortal()) {
      this.emitToast('Export permission is restricted for this role by School Owner.', 'warning');
      return;
    }
    const list = this.filteredRosterMembers();
    if (!list.length) {
      this.emitToast('No records available to export.', 'warning');
      return;
    }
    const cols = this.visibleColumns();
    const escCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = ['Date', ...cols.map((c) => c.label)].map(escCsv);
    const rows = list.map((m) => [escCsv(this.selectedDate()), ...cols.map((c) => escCsv(this.formatColumnValue(m, c.key)))]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    if (typeof document !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${this.activeSubTab()}_${this.selectedDate()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    this.emitToast(`Exported ${list.length} records (${cols.length} ticked columns) as CSV.`, 'success');
  }

  async exportCurrentCategoryPDF(): Promise<void> {
    if (!this.canExportCurrentPortal()) {
      this.emitToast('Export permission is restricted for this role by School Owner.', 'warning');
      return;
    }
    const list = this.filteredRosterMembers();
    if (!list.length) {
      this.emitToast('No records available to export in PDF.', 'warning');
      return;
    }
    if (typeof document === 'undefined') return;
    const cols = this.visibleColumns();
    const subTab = this.activeSubTab();
    const tableId = `attendance_roster_${subTab}`;
    const canonicalTableId = this.tableSchemaService.resolveCanonicalTableId(tableId);
    const branding = this.tableSchemaService.printBranding();
    const reportTitle =
      subTab === 'students'
        ? 'Student Attendance & Compliance Register'
        : subTab === 'teachers'
          ? 'Faculty Attendance & Timing Register'
          : subTab === 'principals'
            ? 'Executive Directorate Attendance Register'
            : subTab === 'staff'
              ? 'Campus Staff Attendance Register'
              : 'Campus Master Attendance Register';

    const headers = ['#', ...cols.map((c) => c.shortLabel)];
    const rows = list.map((m, idx) => [
      String(idx + 1),
      ...cols.map((c) => this.formatColumnValue(m, c.key))
    ]);

    const html = buildSchoolStatementA4Html({
      tableId,
      canonicalTableId,
      title: reportTitle,
      subtitle: `Date: ${this.selectedDate()} · Start: ${this.policy().scheduledStartTime || '08:00'} · Cutoff: ${this.policy().lateCutoffTime || '08:15'} · Scope: ${this.activeBranchLabel()}`,
      roleLabel: this.portalContext().toUpperCase(),
      headers,
      rows,
      totalUnfilteredCount: list.length,
      criteria: {
        fromDate: this.selectedDate(),
        toDate: this.selectedDate(),
        searchQuery: this.searchQuery()
      },
      branding,
      statementRef: `ATT-${subTab.toUpperCase()}-${this.selectedDate()}`
    });

    const ok = await printHtmlInHiddenFrame(html);
    this.emitToast(
      ok
        ? `Prepared Print Studio branded PDF with ${cols.length} ticked columns (${list.length} rows).`
        : 'Print dialog blocked by browser.',
      ok ? 'success' : 'warning'
    );
  }

  private buildMemberPunchView(
    rec:
      | {
          inTime: string;
          outTime: string;
          scheduledStartTime: string;
          lateMinutes: number | null;
          lateByLabel: string;
          lastConfidence: number;
          verifiedMethod: string;
          gateOrLocation: string;
          markedBy: string;
          remarks: string;
          totalInCount: number;
          totalOutCount: number;
        }
      | undefined,
    status: 'Present' | 'Late' | 'Absent' | 'On Leave'
  ) {
    const checkInTime = rec?.inTime || '—';
    const checkOutTime = rec?.outTime || '—';
    const hasIn = checkInTime !== '—';
    const hasOut = checkOutTime !== '—';
    const scheduledStartTime = rec?.scheduledStartTime || this.policy().scheduledStartTime || '08:00';
    const cutoffTime = this.policy().lateCutoffTime || '08:15';

    const punctuality = hasIn
      ? this.computePunctualityFromCheckIn(checkInTime, scheduledStartTime, cutoffTime, status, rec?.lateMinutes, rec?.lateByLabel)
      : {
          lateMinutes: null as number | null,
          lateByLabel: status === 'On Leave' ? 'On Leave' : status === 'Absent' ? 'Not Checked In' : 'Pending',
          lateSeverity: 'none' as LateSeverityKind
        };

    let durationLabel = '—';
    if (hasIn && hasOut) {
      durationLabel = this.computeShiftDuration(checkInTime, checkOutTime);
    } else if (hasIn) {
      durationLabel = 'On Campus';
    }

    let punchState: AttendanceMemberView['punchState'] = 'Pending';
    if (hasOut) punchState = 'Checked OUT';
    else if (hasIn) punchState = 'Checked IN';
    else if (status === 'On Leave') punchState = 'On Leave';
    else if (status === 'Absent') punchState = 'Absent';

    return {
      scheduledStartTime,
      checkInTime,
      lateMinutes: punctuality.lateMinutes,
      lateByLabel: punctuality.lateByLabel,
      lateSeverity: punctuality.lateSeverity,
      checkOutTime,
      durationLabel,
      punchState,
      lastConfidence: rec?.lastConfidence || 0,
      verifiedMethod: rec?.verifiedMethod || (hasIn ? 'Face Camera' : 'Not Scanned'),
      totalInCount: rec?.totalInCount || 0,
      totalOutCount: rec?.totalOutCount || 0,
      gateOrLocation: rec?.gateOrLocation || (hasIn ? 'Campus Gate 01' : '—'),
      markedBy: rec?.markedBy || (hasIn ? 'Kiosk' : '—'),
      remarks: rec?.remarks || ''
    };
  }

  private computePunctualityFromCheckIn(
    checkInStr: string,
    scheduledStartStr: string,
    lateCutoffStr: string,
    status: string,
    storedLateMinutes?: number | null,
    storedLateLabel?: string
  ): { lateMinutes: number | null; lateByLabel: string; lateSeverity: LateSeverityKind } {
    const startMins = this.parseTimeMinutes(scheduledStartStr || '08:00') ?? 480;
    const cutoffMins = this.parseTimeMinutes(lateCutoffStr || '08:15') ?? 495;
    const inMins = this.parseTimeMinutes(checkInStr);

    if (inMins === null) {
      if (storedLateLabel) {
        const mins = typeof storedLateMinutes === 'number' ? storedLateMinutes : 0;
        const sev: LateSeverityKind =
          storedLateLabel.toLowerCase().includes('late')
            ? 'late'
            : storedLateLabel.toLowerCase().includes('grace')
              ? 'grace'
              : storedLateLabel.toLowerCase().includes('early')
                ? 'early'
                : 'on_time';
        return { lateMinutes: mins, lateByLabel: storedLateLabel, lateSeverity: sev };
      }
      return { lateMinutes: null, lateByLabel: status === 'Late' ? 'Late Arrival' : 'On Time', lateSeverity: status === 'Late' ? 'late' : 'on_time' };
    }

    const diff = inMins - startMins;
    if (diff < 0) {
      return { lateMinutes: diff, lateByLabel: `Early ${this.formatDelayDuration(diff)}`, lateSeverity: 'early' };
    }
    if (diff === 0) {
      return { lateMinutes: 0, lateByLabel: 'On Time', lateSeverity: 'on_time' };
    }
    if (inMins <= cutoffMins && status.toLowerCase() !== 'late') {
      return { lateMinutes: diff, lateByLabel: `+${this.formatDelayDuration(diff)} (Grace)`, lateSeverity: 'grace' };
    }
    return { lateMinutes: diff, lateByLabel: `+${this.formatDelayDuration(diff)} late`, lateSeverity: 'late' };
  }

  private formatDelayDuration(mins: number): string {
    const abs = Math.abs(Math.round(mins));
    const hrs = Math.floor(abs / 60);
    const rem = abs % 60;
    if (hrs <= 0) return `${rem}m`;
    if (rem === 0) return `${hrs}h`;
    return `${hrs}h ${rem}m`;
  }

  private formatTimeShort(raw: string): string {
    const s = String(raw || '').trim();
    if (!s || /^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
    const m = s.match(/^(\d{1,2}:\d{2})(?::\d{2})?(\s*[AP]M)?$/i);
    if (m) return `${m[1]}${m[2] ? m[2].toUpperCase() : ''}`;
    return s;
  }

  private parseTimeMinutes(raw: string): number | null {
    const m = String(raw || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?$/i);
    if (!m) return null;
    let h = Number(m[1]);
    const min = Number(m[2]);
    const ap = (m[3] || '').toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }

  private computeShiftDuration(inStr: string, outStr: string): string {
    const a = this.parseTimeMinutes(inStr);
    const b = this.parseTimeMinutes(outStr);
    if (a === null || b === null) return 'Completed';
    const diff = Math.max(0, b - a);
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  }

  categoryLabel(cat: ScannerCategoryFilter): string {
    if (cat === 'all') return 'All Campus';
    if (cat === 'teacher') return 'Teachers';
    if (cat === 'staff') return 'Staff';
    if (cat === 'principal') return 'Principal';
    return 'Students';
  }

  singleCategoryLabel(cat: AttendanceMemberCategory): string {
    if (cat === 'teacher') return 'Teacher';
    if (cat === 'staff') return 'Staff';
    if (cat === 'principal') return 'Principal';
    return 'Student';
  }

  memberInitials(name: string): string {
    return String(name || 'M')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0] || '')
      .join('')
      .toUpperCase();
  }

  private computeArrivalStatus(): 'Present' | 'Late' {
    const cutoff = this.policy().lateCutoffTime || '08:15';
    const [ch, cm] = cutoff.split(':').map(Number);
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const cutoffMins = (Number.isFinite(ch) ? ch : 8) * 60 + (Number.isFinite(cm) ? cm : 15);
    if (currentMins > cutoffMins && currentMins < 14 * 60 + 30) {
      return 'Late';
    }
    return 'Present';
  }

  private normalizeStatus(raw: any): 'Present' | 'Late' | 'Absent' | 'On Leave' {
    const s = String(raw || '').trim().toLowerCase();
    if (s === 'present' || s === 'active') return 'Present';
    if (s === 'late') return 'Late';
    if (s === 'on leave' || s === 'leave' || s === 'on_leave') return 'On Leave';
    return 'Absent';
  }

  private clonePolicy(p: OwnerAttendancePolicy): OwnerAttendancePolicy {
    return JSON.parse(JSON.stringify(p));
  }

  private emitToast(message: string, type: 'success' | 'info' | 'warning'): void {
    this.toast.emit({ message, type });
  }
}
