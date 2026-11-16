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
  AttendanceMemberCategory,
  AttendanceMemberView,
  AttendancePortalContext,
  FaceProfileRecord,
  FaceVerificationLogRecord,
  OwnerAttendancePolicy,
  PrincipalMemberRecord,
  RoleAttendancePermission,
  StaffMemberRecord,
  createDefaultOwnerAttendancePolicy
} from '../../models/school-attendance.models';
import {
  FaceBoxNormalized,
  FaceExtractionResult,
  FaceVerificationService
} from '../../../../services/face-verification.service';

export type AttendanceSubTab = 'terminal' | 'students' | 'teachers' | 'staff' | 'principals' | 'enrollment' | 'setup';
export type ScannerCategoryFilter = 'all' | AttendanceMemberCategory;

@Component({
  selector: 'app-school-attendance-hub',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './school-attendance-hub.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchoolAttendanceHubComponent implements AfterViewInit, OnDestroy {
  private readonly faceVerifier = inject(FaceVerificationService);

  @ViewChild('verifyVideoEl') verifyVideoEl?: ElementRef<HTMLVideoElement>;
  @ViewChild('enrollVideoEl') enrollVideoEl?: ElementRef<HTMLVideoElement>;
  @ViewChild('phoneVerifyInputEl') phoneVerifyInputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('phoneEnrollInputEl') phoneEnrollInputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('quickSelfieFileEl') quickSelfieFileEl?: ElementRef<HTMLInputElement>;

  // Inputs
  portalContext = input<AttendancePortalContext>('owner');
  schoolName = input<string>('Al-Huda International Academy');
  students = input<any[]>([]);
  teachers = input<any[]>([]);
  staff = input<StaffMemberRecord[]>([]);
  principals = input<PrincipalMemberRecord[]>([]);
  faceProfiles = input<FaceProfileRecord[]>([]);
  policy = input<OwnerAttendancePolicy>(createDefaultOwnerAttendancePolicy());
  verificationLogs = input<FaceVerificationLogRecord[]>([]);
  pendingSyncCount = input<number>(0);
  currentActorName = input<string>('School Owner');
  currentStudentId = input<string>('');
  currentTeacherGrade = input<string>('All');

  // Outputs
  policySaved = output<OwnerAttendancePolicy>();
  faceEnrolled = output<FaceProfileRecord>();
  faceRemoved = output<string>();
  attendanceRecorded = output<{
    memberCategory: AttendanceMemberCategory;
    memberId: string;
    memberName: string;
    memberCode: string;
    gradeOrDept: string;
    status: 'Present' | 'Late' | 'Absent' | 'On Leave';
    punchType?: 'IN' | 'OUT';
    verificationMode: string;
    confidenceScore: number;
    verifiedBy: string;
    snapshotData?: string;
  }>();
  staffCreated = output<{
    name: string;
    roleTitle: string;
    department: string;
    phone: string;
    shift: string;
    liteEnabled: boolean;
  }>();
  staffDeleted = output<string>();
  principalCreated = output<{
    name: string;
    roleTitle: string;
    department: string;
    phone: string;
    email?: string;
    shift: string;
    liteEnabled: boolean;
  }>();
  principalDeleted = output<string>();
  absentAlertRequested = output<{ category: AttendanceMemberCategory; memberId?: string }>();
  toast = output<{ message: string; type: 'success' | 'info' | 'warning' }>();
  switchToOwnerPortal = output<void>();
  syncRequested = output<void>();

  // Local reactive state
  activeSubTab = signal<AttendanceSubTab>('terminal');
  activeCategory = signal<ScannerCategoryFilter>('all');
  searchQuery = signal<string>('');
  selectedGradeFilter = signal<string>('All');
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  punchFilter = signal<'all' | 'checked_in' | 'checked_out' | 'pending'>('all');
  private readonly punchRevision = signal<number>(0);

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
    storageLabel?: string;
  } | null>(null);

  recentVerifiedFeed = signal<
    Array<{
      id: string;
      name: string;
      category: AttendanceMemberCategory;
      punch: 'IN' | 'OUT';
      time: string;
      confidence: number;
      syncedLabel: string;
    }>
  >([]);

  // Inline Quick Selfie Enrollment (right on the Scanner Platform)
  quickEnrollCategory = signal<AttendanceMemberCategory>('student');
  quickEnrollMemberId = signal<string>('');
  quickEnrollSearch = signal<string>('');
  quickEnrollPreviewUrl = signal<string>('');
  quickEnrollExtraction = signal<FaceExtractionResult | null>(null);

  // Full Face Enrollment tab state
  enrollCategory = signal<AttendanceMemberCategory>('student');
  enrollTargetMemberId = signal<string>('');
  enrollCapturedDataUrl = signal<string>('');
  enrollExtraction = signal<FaceExtractionResult | null>(null);
  isCapturingEnroll = signal<boolean>(false);
  enrollLiteEnabled = signal<boolean>(true);

  // Add Staff inline drawer state (signal-based form, no ngModel)
  showAddStaffForm = signal<boolean>(false);
  newStaffName = signal<string>('');
  newStaffRole = signal<string>('');
  newStaffDepartment = signal<string>('Campus Operations');
  newStaffPhone = signal<string>('+92 300 ');
  newStaffShift = signal<string>('Morning (07:30 AM - 03:30 PM)');
  newStaffLiteEnabled = signal<boolean>(true);

  // Add Principal / Vice Principal inline drawer state
  showAddPrincipalForm = signal<boolean>(false);
  newPrincipalName = signal<string>('');
  newPrincipalRole = signal<string>('Vice Principal');
  newPrincipalDepartment = signal<string>('Executive Directorate');
  newPrincipalPhone = signal<string>('+92 300 ');
  newPrincipalShift = signal<string>('Full Day (07:30 AM - 04:00 PM)');
  newPrincipalLiteEnabled = signal<boolean>(true);

  // Editable policy draft for Owner Setup tab
  policyDraft = signal<OwnerAttendancePolicy>(createDefaultOwnerAttendancePolicy());
  operatorFilterCategory = signal<'teacher' | 'staff' | 'principal'>('teacher');

  private mediaStream: MediaStream | null = null;
  private activeCameraSlot: 'verify' | 'enroll' | null = null;
  private autoScanTimerId: ReturnType<typeof setInterval> | null = null;
  private overlayTimerId: ReturnType<typeof setTimeout> | null = null;
  private audioCtx: AudioContext | null = null;
  private readonly localSessionPunches = new Map<string, { inTime?: string; inAtMs?: number; outTime?: string; outAtMs?: number }>();
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
    });

    effect(() => {
      const ctx = this.portalContext();
      if (ctx === 'student' && this.currentStudentId()) {
        this.selectedTargetMemberId.set(this.currentStudentId());
      }
      if (ctx !== 'owner' && this.activeSubTab() === 'setup') {
        this.activeSubTab.set('terminal');
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
      } catch {}
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    }
    if (this.activeSubTab() === 'terminal' && this.keepCameraOn()) {
      setTimeout(() => {
        if (!this.cameraActive() && this.activeSubTab() === 'terminal' && this.keepCameraOn()) {
          void this.startCamera('verify', true);
        }
      }, 60);
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
    this.stopCamera(false);
  }

  // Zero-Permission-Friction Access Computeds (No role lockouts on the scanning platform)
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

  // Never lock out the self-contained face scanner platform
  readonly isPortalLocked = computed(() => false);

  readonly allowedCategories = computed<AttendanceMemberCategory[]>(() => ['student', 'teacher', 'staff', 'principal']);

  readonly canUseManualFallback = computed(() => {
    const p = this.policy();
    if (this.isOwner()) {
      return !p.requireCameraForAllAttendance || p.roleAccess.principal.manualFallbackAllowed;
    }
    return !p.requireCameraForAllAttendance && this.rolePerms().manualFallbackAllowed;
  });

  readonly canEnrollCurrentPortal = computed(() => true);
  readonly canExportCurrentPortal = computed(() => this.isOwner() || this.rolePerms().canExportReports);
  readonly studentSelfCheckInAllowed = computed(() => true);

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

  readonly profileByMemberKey = computed(() => {
    const map = new Map<string, FaceProfileRecord>();
    for (const fp of this.faceProfiles()) {
      map.set(`${fp.memberCategory}:${fp.memberId}`, fp);
    }
    return map;
  });

  readonly punchSummaryByMember = computed(() => {
    this.punchRevision();
    const targetDate = this.selectedDate();
    const todayIso = new Date().toISOString().split('T')[0];
    const logs = this.verificationLogs() || [];
    const perMember = new Map<
      string,
      {
        inTime: string;
        outTime: string;
        lastConfidence: number;
        verifiedMethod: string;
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
        lastConfidence: 0,
        verifiedMethod: '',
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
        }
        if (!cur.lastConfidence && Number(l.confidenceScore) > 0) {
          cur.lastConfidence = Math.round(Number(l.confidenceScore));
        }
        if (!cur.verifiedMethod && l.verifiedBy) {
          cur.verifiedMethod = l.verifiedBy;
        }
      }
      perMember.set(key, cur);
    }

    if (targetDate === todayIso) {
      for (const [key, sess] of this.localSessionPunches.entries()) {
        const cur = perMember.get(key) || {
          inTime: '',
          outTime: '',
          lastConfidence: 0,
          verifiedMethod: '',
          totalInCount: 0,
          totalOutCount: 0
        };
        if (sess.inTime && !cur.inTime) {
          cur.inTime = sess.inTime;
          cur.totalInCount = Math.max(1, cur.totalInCount);
        }
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
    const punchMap = this.punchSummaryByMember();
    const overrides = this.policy().operatorOverrides || {};
    return (this.students() || []).map((s) => {
      const fp = map.get(`student:${s.id}`) || null;
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
        phone: String(s.guardianPhone || s.phone || ''),
        status,
        monthlyRate: String(s.attendance || '96%'),
        image: fp?.facePhotoData || s.image || '',
        faceProfile: fp,
        liteEnabled: ov ? ov.liteEnabled : (fp ? fp.liteEnabled : true),
        isEnrolled: Boolean(fp || s.biometricEnrolled),
        ...punchFields
      };
    });
  });

  readonly teacherMembers = computed<AttendanceMemberView[]>(() => {
    const map = this.profileByMemberKey();
    const punchMap = this.punchSummaryByMember();
    const overrides = this.policy().operatorOverrides || {};
    return (this.teachers() || []).map((t) => {
      const fp = map.get(`teacher:${t.id}`) || null;
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
        phone: String(t.phone || ''),
        status,
        monthlyRate: '98%',
        image: fp?.facePhotoData || t.image || '',
        faceProfile: fp,
        liteEnabled: ov ? ov.liteEnabled : (fp ? fp.liteEnabled : true),
        isEnrolled: Boolean(fp || t.biometricEnrolled),
        ...punchFields
      };
    });
  });

  readonly staffMembers = computed<AttendanceMemberView[]>(() => {
    const map = this.profileByMemberKey();
    const punchMap = this.punchSummaryByMember();
    const overrides = this.policy().operatorOverrides || {};
    return (this.staff() || []).map((st) => {
      const fp = map.get(`staff:${st.id}`) || null;
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
        phone: String(st.phone || ''),
        status,
        monthlyRate: st.shift || 'Morning Shift',
        image: fp?.facePhotoData || st.image || '',
        faceProfile: fp,
        liteEnabled: ov ? ov.liteEnabled : (fp ? fp.liteEnabled : Boolean(st.liteEnabled ?? true)),
        isEnrolled: Boolean(fp || st.faceEnrolled),
        ...punchFields
      };
    });
  });

  readonly principalMembers = computed<AttendanceMemberView[]>(() => {
    const map = this.profileByMemberKey();
    const punchMap = this.punchSummaryByMember();
    const overrides = this.policy().operatorOverrides || {};
    return (this.principals() || []).map((pr) => {
      const fp = map.get(`principal:${pr.id}`) || null;
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
        phone: String(pr.phone || ''),
        status,
        monthlyRate: pr.shift || 'Full Day Shift',
        image: fp?.facePhotoData || pr.image || '',
        faceProfile: fp,
        liteEnabled: ov ? ov.liteEnabled : (fp ? fp.liteEnabled : Boolean(pr.liteEnabled ?? true)),
        isEnrolled: Boolean(fp || pr.faceEnrolled),
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
    if (cat === 'all') return this.allCampusMembers();
    if (cat === 'teacher') return this.teacherMembers();
    if (cat === 'staff') return this.staffMembers();
    if (cat === 'principal') return this.principalMembers();
    return this.studentMembers();
  });

  readonly activeFaceProfiles = computed<FaceProfileRecord[]>(() => {
    const cat = this.activeCategory();
    const all = this.faceProfiles() || [];
    if (cat === 'all') return all;
    return all.filter((fp) => fp.memberCategory === cat);
  });

  readonly enrollCategoryMembers = computed<AttendanceMemberView[]>(() => {
    const cat = this.enrollCategory();
    if (cat === 'teacher') return this.teacherMembers();
    if (cat === 'staff') return this.staffMembers();
    if (cat === 'principal') return this.principalMembers();
    return this.studentMembers();
  });

  readonly quickEnrollFilteredMembers = computed<AttendanceMemberView[]>(() => {
    const cat = this.quickEnrollCategory();
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

  readonly studentGrades = computed<string[]>(() => {
    const set = new Set<string>(['All']);
    for (const s of this.studentMembers()) {
      if (s.sectionOrDept) set.add(s.sectionOrDept);
    }
    return Array.from(set);
  });

  readonly currentTabMembersUnfiltered = computed<AttendanceMemberView[]>(() => {
    const tab = this.activeSubTab();
    if (tab === 'teachers') return this.teacherMembers();
    if (tab === 'staff') return this.staffMembers();
    if (tab === 'principals') return this.principalMembers();
    if (tab === 'students') return this.studentMembers();
    return this.activeCategoryMembers();
  });

  readonly rosterTabSummary = computed(() => {
    const list = this.currentTabMembersUnfiltered();
    return {
      total: list.length,
      checkedIn: list.filter((m) => m.punchState === 'Checked IN' || m.punchState === 'Checked OUT').length,
      checkedOut: list.filter((m) => m.punchState === 'Checked OUT').length,
      pending: list.filter((m) => m.punchState === 'Pending' || m.punchState === 'Absent').length,
      enrolled: list.filter((m) => m.isEnrolled).length
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
        m.sectionOrDept.toLowerCase().includes(q);
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

  readonly totalEnrolledCount = computed(() => (this.faceProfiles() || []).length);

  readonly activeLogs = computed(() => {
    const cat = this.activeCategory();
    const tab = this.activeSubTab();
    const logs = this.verificationLogs() || [];
    if (tab === 'terminal' && cat !== 'all') {
      return logs.filter((l) => l.memberCategory === cat).slice(0, 14);
    }
    return logs.slice(0, 16);
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
    this.stopCamera(false);
    this.activeSubTab.set(tab);
    if (tab === 'students') this.activeCategory.set('student');
    if (tab === 'teachers') this.activeCategory.set('teacher');
    if (tab === 'staff') this.activeCategory.set('staff');
    if (tab === 'principals') this.activeCategory.set('principal');
    if (tab === 'terminal' && this.keepCameraOn()) {
      setTimeout(() => void this.startCamera('verify', true), 60);
    }
    if (tab === 'enrollment') {
      const cat = this.activeCategory() === 'all' ? 'student' : (this.activeCategory() as AttendanceMemberCategory);
      this.enrollCategory.set(cat);
      const list = this.enrollCategoryMembers();
      if (list.length > 0 && !this.enrollTargetMemberId()) {
        this.enrollTargetMemberId.set(list[0].id);
      }
      if (this.keepCameraOn()) {
        setTimeout(() => void this.startCamera('enroll', true), 60);
      }
    }
  }

  setCategory(cat: ScannerCategoryFilter): void {
    this.activeCategory.set(cat);
    this.selectedTargetMemberId.set('');
    this.lastVerificationResult.set(null);
    this.capturedVerifyPreview.set('');
    this.stableCandidateKey = '';
    this.stableCandidateHits = 0;
  }

  toggleKioskFullscreen(): void {
    this.kioskFullscreen.update((v) => !v);
  }

  openQuickEnrollPanel(prefillFromLive: boolean = false): void {
    this.quickEnrollDrawerOpen.set(true);
    const list = this.quickEnrollFilteredMembers();
    if (list.length > 0 && !this.quickEnrollMemberId()) {
      this.quickEnrollMemberId.set(list[0].id);
    }
    if (this.cameraActive()) {
      if (prefillFromLive) {
        this.snapQuickSelfieFromLiveCamera();
      }
    } else {
      void this.startCamera('verify', true);
    }
  }

  closeQuickEnrollPanel(): void {
    this.quickEnrollDrawerOpen.set(false);
    this.quickEnrollPreviewUrl.set('');
    this.quickEnrollExtraction.set(null);
  }

  async snapQuickSelfieFromLiveCamera(): Promise<void> {
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
    const memberId = this.quickEnrollMemberId();
    const extraction = this.quickEnrollExtraction();
    if (!memberId || !extraction) {
      this.emitToast('Choose a member and capture their selfie first.', 'warning');
      return;
    }
    const cat = this.quickEnrollCategory();
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
      enrolledAt: new Date().toISOString()
    };

    this.faceEnrolled.emit(profile);
    this.playMatchChime();
    this.quickEnrollPreviewUrl.set('');
    this.quickEnrollExtraction.set(null);
    this.quickEnrollDrawerOpen.set(false);
    this.emitToast(`${member.name} face registered! Ready for instant auto-recognition.`, 'success');
  }

  openCameraForMember(member: AttendanceMemberView): void {
    this.keepCameraOn.set(true);
    this.activeCategory.set(member.category);
    this.scanScope.set('targeted');
    this.selectedTargetMemberId.set(member.id);
    this.lastVerificationResult.set(null);
    this.capturedVerifyPreview.set('');
    this.activeSubTab.set('terminal');
    setTimeout(() => void this.startCamera('verify'), 60);
  }

  openEnrollmentForMember(member: AttendanceMemberView): void {
    this.keepCameraOn.set(true);
    this.enrollCategory.set(member.category);
    this.enrollTargetMemberId.set(member.id);
    this.enrollCapturedDataUrl.set('');
    this.enrollExtraction.set(null);
    this.enrollLiteEnabled.set(member.liteEnabled);
    this.activeSubTab.set('enrollment');
    setTimeout(() => void this.startCamera('enroll'), 60);
  }

  setEnrollCategory(cat: AttendanceMemberCategory): void {
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
  }

  // WebRTC Continuous Camera Engine (stays ON non-stop once started)
  async startCamera(slot: 'verify' | 'enroll', silent: boolean = false): Promise<boolean> {
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
      void this.startCamera(this.activeCameraSlot);
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
    if (this.isProcessingScan()) return;
    const profiles = this.activeFaceProfiles();
    if (profiles.length === 0) {
      this.openQuickEnrollPanel(true);
      this.emitToast('No faces enrolled yet — snap a selfie in the Quick Register panel to get started.', 'info');
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
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith('image/')) : [];
    if (files.length === 0) return;
    await this.processVerifyBatchFiles(files);
  }

  private async processVerifyBatchFiles(files: File[]): Promise<void> {
    const profiles = this.activeFaceProfiles();
    if (profiles.length === 0) {
      // Auto-load first photo into Quick Selfie Enroll if no profiles exist yet!
      const { result, rawDataUrl } = await this.faceVerifier.extractFromFile(files[0]);
      if (result) {
        this.quickEnrollPreviewUrl.set(result.photoDataUrl || rawDataUrl);
        this.quickEnrollExtraction.set(result);
        this.quickEnrollDrawerOpen.set(true);
        this.emitToast('No enrolled faces yet — select a member and tap Save & Activate Face!', 'info');
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
    const memberKey = `${prof.memberCategory}:${prof.memberId}`;

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

    const todayIso = new Date().toISOString().split('T')[0];
    const nowDate = new Date();
    const session = this.localSessionPunches.get(memberKey);

    const todayLogs = this.verificationLogs().filter(
      (l) =>
        l.memberCategory === prof.memberCategory &&
        l.memberId === prof.memberId &&
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
      // Right after marking IN/OUT, hold the Green Tick banner cleanly for 2.0s before showing Duplicate Caution
      if (isAutoScan && this.lastActiveFaceKey === memberKey && nowMs - this.lastSuccessAtMs < 2000) {
        return;
      }

      const isNewVisit = this.lastActiveFaceKey !== memberKey;
      this.lastActiveFaceKey = memberKey;

      const alreadySubtitle = blockReason || 'Duplicate Entry — Attendance already marked today';
      this.lastVerificationResult.set({
        matched: true,
        resultType: 'duplicate',
        confidence: match.confidence,
        threshold: match.thresholdUsed,
        message: alreadySubtitle,
        memberName: prof.memberName,
        memberCode: prof.memberCode,
        category: prof.memberCategory,
        statusMarked: hasOut ? 'Duplicate · Already Checked OUT' : 'Duplicate · Already Checked IN',
        enrolledPhoto: prof.facePhotoData,
        livePhoto: isAutoScan ? undefined : resolveSnapUrl(),
        savedOffline: !this.isBrowserOnline()
      });
      this.triggerScanOverlay(
        {
          kind: 'duplicate',
          title: prof.memberName,
          subtitle: alreadySubtitle,
          badgeText: hasOut ? 'DUPLICATE · ALREADY IN & OUT' : 'DUPLICATE · ALREADY CHECKED IN',
          confidence: match.confidence,
          memberCode: prof.memberCode,
          storageLabel: this.isBrowserOnline() ? 'SQLite + Cloud Synced' : 'SQLite Offline Saved'
        },
        1600
      );

      if (!isAutoScan || isNewVisit || nowMs - this.lastDuplicateAlertAt >= 4000) {
        this.lastDuplicateAlertAt = nowMs;
        this.playAlertTone('duplicate');
        this.emitToast(`${prof.memberName} — ${alreadySubtitle}`, 'warning');
      }
      return;
    }

    // Fresh Attendance Verification -> GREEN TICK + SQLite Offline-First Save
    this.lastActiveFaceKey = memberKey;
    this.lastDuplicateAlertAt = 0;
    this.lastSuccessAtMs = nowMs;
    this.stableCandidateKey = '';
    this.stableCandidateHits = 0;

    const snapUrl = resolveSnapUrl();
    const timeLabel = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (nextPunch === 'IN') {
      this.localSessionPunches.set(memberKey, { ...(session || {}), inTime: timeLabel, inAtMs: nowMs });
    } else {
      this.localSessionPunches.set(memberKey, { ...(session || {}), outTime: timeLabel, outAtMs: nowMs });
    }
    this.punchRevision.update((v) => v + 1);

    const status = nextPunch === 'IN' ? this.computeArrivalStatus() : 'Present';
    const modeTag = this.liteVerifyActive() ? 'face_camera_lite' : `face_camera_${this.policy().verificationMode}`;
    const storageLabel = this.isBrowserOnline() ? 'SQLite + Auto-Sync' : 'Saved Offline · Auto-Sync Ready';
    const overlayBadge = nextPunch === 'OUT' ? 'CHECKED OUT · VERIFIED' : 'ATTENDANCE MARKED · OK';
    const overlaySub =
      nextPunch === 'OUT'
        ? `${this.singleCategoryLabel(prof.memberCategory)} · ${prof.gradeOrDept} · OUT ${timeLabel}`
        : `${this.singleCategoryLabel(prof.memberCategory)} · ${prof.gradeOrDept} · ${status} ${timeLabel}`;

    this.recentVerifiedFeed.update((feed) =>
      [
        {
          id: `${memberKey}-${nowMs}`,
          name: prof.memberName,
          category: prof.memberCategory,
          punch: nextPunch as 'IN' | 'OUT',
          time: timeLabel,
          confidence: match.confidence,
          syncedLabel: this.isBrowserOnline() ? 'SQLite · Synced' : 'Offline Queued'
        },
        ...feed
      ].slice(0, 6)
    );

    this.lastVerificationResult.set({
      matched: true,
      resultType: 'success',
      confidence: match.confidence,
      threshold: match.thresholdUsed,
      message: `${overlayBadge} (${match.confidence}% match) — ${prof.memberName} (${nextPunch} at ${timeLabel})`,
      memberName: prof.memberName,
      memberCode: prof.memberCode,
      category: prof.memberCategory,
      statusMarked: nextPunch === 'OUT' ? 'Checked Out' : status,
      enrolledPhoto: prof.facePhotoData,
      livePhoto: snapUrl,
      savedOffline: !this.isBrowserOnline()
    });

    this.triggerScanOverlay(
      {
        kind: 'success',
        title: prof.memberName,
        subtitle: overlaySub,
        badgeText: overlayBadge,
        punchType: nextPunch,
        confidence: match.confidence,
        memberCode: prof.memberCode,
        storageLabel
      },
      1800
    );

    this.playMatchChime();
    this.emitToast(`✔ ${prof.memberName} — ${nextPunch} (${status}) · ${match.confidence}%`, 'success');

    this.attendanceRecorded.emit({
      memberCategory: prof.memberCategory,
      memberId: prof.memberId,
      memberName: prof.memberName,
      memberCode: prof.memberCode,
      gradeOrDept: prof.gradeOrDept,
      status,
      punchType: nextPunch,
      verificationMode: modeTag,
      confidenceScore: match.confidence,
      verifiedBy: isAutoScan
        ? `${this.liteVerifyActive() ? 'Auto Kiosk (Lite)' : 'Auto Face Kiosk'} · ${nextPunch}`
        : `${this.liteVerifyActive() ? 'Face Scan (Lite)' : 'Face Camera Scan'} · ${nextPunch}`,
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
    const memberId = this.enrollTargetMemberId();
    const extraction = this.enrollExtraction();
    if (!memberId || !extraction) {
      this.emitToast('Select a member and capture their face photo before saving.', 'warning');
      return;
    }
    const cat = this.enrollCategory();
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
      enrolledAt: new Date().toISOString()
    };

    this.faceEnrolled.emit(profile);
    this.enrollCapturedDataUrl.set('');
    this.enrollExtraction.set(null);
  }

  removeEnrolledFace(profileId: string): void {
    this.faceRemoved.emit(profileId);
  }

  handleRosterStatusAction(member: AttendanceMemberView, status: 'Present' | 'Late' | 'Absent' | 'On Leave'): void {
    if (!this.canUseManualFallback()) {
      this.emitToast(`Opening Face Scanner for ${member.name}...`, 'info');
      this.openCameraForMember(member);
      return;
    }
    this.attendanceRecorded.emit({
      memberCategory: member.category,
      memberId: member.id,
      memberName: member.name,
      memberCode: member.code,
      gradeOrDept: member.subLabel,
      status,
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
      roleTitle,
      department: this.newStaffDepartment().trim() || 'Campus Administration',
      phone: this.newStaffPhone().trim() || '+92 300 0000000',
      shift: this.newStaffShift().trim() || 'Morning (07:30 AM - 03:30 PM)',
      liteEnabled: this.newStaffLiteEnabled()
    });
    this.newStaffName.set('');
    this.newStaffRole.set('');
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
      roleTitle,
      department: this.newPrincipalDepartment().trim() || 'Executive Directorate',
      phone: this.newPrincipalPhone().trim() || '+92 300 0000000',
      shift: this.newPrincipalShift().trim() || 'Full Day (07:30 AM - 04:00 PM)',
      liteEnabled: this.newPrincipalLiteEnabled()
    });
    this.newPrincipalName.set('');
    this.newPrincipalRole.set('Vice Principal');
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
      | 'twoPunchEnabled'
  ): void {
    this.policyDraft.update((d) => ({ ...d, [field]: !d[field] }));
  }

  setDraftFillLightColor(color: 'neutral' | 'warm' | 'bright'): void {
    this.policyDraft.update((d) => ({ ...d, fillLightColor: color }));
  }

  setDraftNumber(field: 'confidenceThreshold' | 'liteConfidenceThreshold', raw: string): void {
    const num = Math.max(50, Math.min(98, Number(raw) || 75));
    this.policyDraft.update((d) => ({ ...d, [field]: num }));
  }

  setDraftTime(raw: string): void {
    this.policyDraft.update((d) => ({ ...d, lateCutoffTime: raw || '08:15' }));
  }

  setDraftCheckOutTime(raw: string): void {
    this.policyDraft.update((d) => ({ ...d, checkOutEnableTime: raw || '13:30' }));
  }

  toggleCategoryRule(cat: AttendanceMemberCategory, key: 'enabled' | 'liteEnabled' | 'cameraRequired' | 'allowSelfCheckIn'): void {
    this.policyDraft.update((d) => ({
      ...d,
      categories: {
        ...d.categories,
        [cat]: { ...d.categories[cat], [key]: !d.categories[cat][key] }
      }
    }));
  }

  getCategoryRule(cat: AttendanceMemberCategory) {
    return this.policyDraft().categories[cat];
  }

  toggleRolePermission(role: 'principal' | 'teacher' | 'staff' | 'student', key: keyof RoleAttendancePermission): void {
    this.policyDraft.update((d) => ({
      ...d,
      roleAccess: {
        ...d.roleAccess,
        [role]: { ...d.roleAccess[role], [key]: !d.roleAccess[role][key] }
      }
    }));
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
    const headers = [
      'Date',
      'Code',
      'Name',
      'Category',
      'Class/Role',
      'Department',
      'Status',
      'IN/OUT State',
      'Check-In Time',
      'Check-Out Time',
      'Duration',
      'Confidence %',
      'Verified Method',
      'Overall Rate / Shift',
      'Total IN Punches',
      'Total OUT Punches',
      'Face Enrolled',
      'Contact'
    ];
    const rows = list.map((m) => [
      `"${this.selectedDate()}"`,
      `"${m.code}"`,
      `"${m.name}"`,
      `"${this.categoryLabel(m.category)}"`,
      `"${m.subLabel}"`,
      `"${m.sectionOrDept}"`,
      `"${m.status}"`,
      `"${m.punchState}"`,
      `"${m.checkInTime}"`,
      `"${m.checkOutTime}"`,
      `"${m.durationLabel}"`,
      `"${m.lastConfidence > 0 ? m.lastConfidence + '%' : '—'}"`,
      `"${m.verifiedMethod}"`,
      `"${m.monthlyRate}"`,
      `"${m.totalInCount}"`,
      `"${m.totalOutCount}"`,
      `"${m.isEnrolled ? 'Yes' : 'No'}"`,
      `"${m.phone}"`
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    if (typeof document !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_in_out_${this.activeCategory()}_${this.selectedDate()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    this.emitToast(`Exported ${list.length} ${this.categoryLabel(this.activeCategory())} IN/OUT records.`, 'success');
  }

  private buildMemberPunchView(
    rec:
      | {
          inTime: string;
          outTime: string;
          lastConfidence: number;
          verifiedMethod: string;
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
      checkInTime,
      checkOutTime,
      durationLabel,
      punchState,
      lastConfidence: rec?.lastConfidence || 0,
      verifiedMethod: rec?.verifiedMethod || (hasIn ? 'Face Camera' : 'Not Scanned'),
      totalInCount: rec?.totalInCount || 0,
      totalOutCount: rec?.totalOutCount || 0
    };
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
