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
  RoleAttendancePermission,
  StaffMemberRecord,
  createDefaultOwnerAttendancePolicy
} from '../../models/school-attendance.models';
import { FaceExtractionResult, FaceVerificationService } from '../../../../services/face-verification.service';

export type AttendanceSubTab = 'terminal' | 'students' | 'teachers' | 'staff' | 'enrollment' | 'setup';

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

  // Inputs
  portalContext = input<AttendancePortalContext>('owner');
  schoolName = input<string>('Al-Huda International Academy');
  students = input<any[]>([]);
  teachers = input<any[]>([]);
  staff = input<StaffMemberRecord[]>([]);
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
  absentAlertRequested = output<{ category: AttendanceMemberCategory; memberId?: string }>();
  toast = output<{ message: string; type: 'success' | 'info' | 'warning' }>();
  switchToOwnerPortal = output<void>();

  // Local reactive state
  activeSubTab = signal<AttendanceSubTab>('terminal');
  activeCategory = signal<AttendanceMemberCategory>('student');
  searchQuery = signal<string>('');
  selectedGradeFilter = signal<string>('All');
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  punchFilter = signal<'all' | 'checked_in' | 'checked_out' | 'pending'>('all');
  private readonly punchRevision = signal<number>(0);

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
      if (typeof window === 'undefined') return '/?tab=attendance';
      const u = new URL(window.location.href);
      u.searchParams.set('tab', 'attendance');
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
  liteVerifyActive = signal<boolean>(false);
  autoScanEnabled = signal<boolean>(true);
  autoScanActive = signal<boolean>(false);
  scanScope = signal<'auto' | 'targeted'>('auto');
  selectedTargetMemberId = signal<string>('');
  isProcessingScan = signal<boolean>(false);
  capturedVerifyPreview = signal<string>('');
  lastVerificationResult = signal<{
    matched: boolean;
    resultType?: 'success' | 'duplicate' | 'mismatch';
    confidence: number;
    threshold: number;
    message: string;
    memberName: string;
    memberCode: string;
    category: AttendanceMemberCategory;
    statusMarked: string;
    enrolledPhoto?: string;
    livePhoto?: string;
  } | null>(null);
  scanOverlay = signal<{
    kind: 'success' | 'duplicate' | 'mismatch';
    title: string;
    subtitle: string;
    badgeText: string;
    punchType?: 'IN' | 'OUT';
    confidence?: number;
    memberCode?: string;
  } | null>(null);
  recentVerifiedFeed = signal<Array<{ id: string; name: string; punch: 'IN' | 'OUT'; time: string }>>([]);

  // Face Enrollment state
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

  // Editable policy draft for Owner Setup tab
  policyDraft = signal<OwnerAttendancePolicy>(createDefaultOwnerAttendancePolicy());
  operatorFilterCategory = signal<'teacher' | 'staff'>('teacher');

  private mediaStream: MediaStream | null = null;
  private activeCameraSlot: 'verify' | 'enroll' | null = null;
  private autoScanTimerId: ReturnType<typeof setInterval> | null = null;
  private overlayTimerId: ReturnType<typeof setTimeout> | null = null;
  private audioCtx: AudioContext | null = null;
  private readonly localSessionPunches = new Map<string, { inTime?: string; inAtMs?: number; outTime?: string; outAtMs?: number }>();
  private lastActiveFaceKey = '';
  private lastAlertBeepAt = 0;

  constructor() {
    effect(() => {
      const incoming = this.policy();
      this.policyDraft.set(this.clonePolicy(incoming));
      this.fillLightBoost.set(Boolean(incoming.cameraFillLightEnabled));
      this.liteVerifyActive.set(incoming.verificationMode === 'lite');
      this.autoScanEnabled.set(Boolean(incoming.autoCaptureOnMatch));
    });

    effect(() => {
      const ctx = this.portalContext();
      if (ctx === 'teacher') {
        this.activeCategory.set('student');
        if (this.activeSubTab() === 'setup' || this.activeSubTab() === 'teachers' || this.activeSubTab() === 'staff') {
          this.activeSubTab.set('terminal');
        }
      } else if (ctx === 'student') {
        this.activeCategory.set('student');
        this.scanScope.set('targeted');
        if (this.currentStudentId()) {
          this.selectedTargetMemberId.set(this.currentStudentId());
        }
        if (!['terminal'].includes(this.activeSubTab())) {
          this.activeSubTab.set('terminal');
        }
      } else if (ctx === 'principal' && this.activeSubTab() === 'setup') {
        this.activeSubTab.set('terminal');
      }
    });
  }

  private readonly boundVisibilityHandler = () => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible' &&
      this.keepCameraOn() &&
      this.activeSubTab() === 'terminal' &&
      !this.cameraActive() &&
      !this.isPortalLocked()
    ) {
      void this.startCamera('verify', true);
    }
  };

  ngAfterViewInit(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    }
    if (this.activeSubTab() === 'terminal' && this.keepCameraOn() && !this.isPortalLocked()) {
      setTimeout(() => {
        if (!this.cameraActive() && this.activeSubTab() === 'terminal' && this.keepCameraOn()) {
          void this.startCamera('verify', true);
        }
      }, 80);
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    }
    this.stopCamera(false);
  }

  // Permission & Access Computeds
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

  readonly isPortalLocked = computed(() => !this.rolePerms().enabled);

  readonly allowedCategories = computed<AttendanceMemberCategory[]>(() => {
    const perms = this.rolePerms();
    const cats = this.policy().categories;
    const list: AttendanceMemberCategory[] = [];
    if (this.isOwner() || (cats.student.enabled && perms.canScanStudents)) list.push('student');
    if (this.isOwner() || (cats.teacher.enabled && perms.canScanTeachers)) list.push('teacher');
    if (this.isOwner() || (cats.staff.enabled && perms.canScanStaff)) list.push('staff');
    return list;
  });

  readonly canUseManualFallback = computed(() => {
    const p = this.policy();
    if (this.isOwner()) {
      return !p.requireCameraForAllAttendance || p.roleAccess.principal.manualFallbackAllowed;
    }
    return !p.requireCameraForAllAttendance && this.rolePerms().manualFallbackAllowed;
  });

  readonly canEnrollCurrentPortal = computed(() => this.isOwner() || this.rolePerms().canEnrollFaces);

  readonly canExportCurrentPortal = computed(() => this.isOwner() || this.rolePerms().canExportReports);

  readonly studentSelfCheckInAllowed = computed(() => {
    const p = this.policy();
    return Boolean(p.roleAccess.student.enabled && p.roleAccess.student.selfCheckInEnabled && p.categories.student.enabled);
  });

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

  readonly activeCategoryMembers = computed<AttendanceMemberView[]>(() => {
    const cat = this.activeCategory();
    if (cat === 'teacher') return this.teacherMembers();
    if (cat === 'staff') return this.staffMembers();
    return this.studentMembers();
  });

  readonly enrollCategoryMembers = computed<AttendanceMemberView[]>(() => {
    const cat = this.enrollCategory();
    if (cat === 'teacher') return this.teacherMembers();
    if (cat === 'staff') return this.staffMembers();
    return this.studentMembers();
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
    return tab === 'teachers'
      ? this.teacherMembers()
      : tab === 'staff'
        ? this.staffMembers()
        : tab === 'students'
          ? this.studentMembers()
          : this.activeCategoryMembers();
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
      staff: summarize(this.staffMembers())
    };
  });

  readonly currentStudentSelfMember = computed<AttendanceMemberView | null>(() => {
    const list = this.studentMembers();
    const id = this.currentStudentId();
    return list.find((s) => s.id === id || s.code === id) || list[0] || null;
  });

  readonly activeLogs = computed(() => {
    const cat = this.activeCategory();
    const tab = this.activeSubTab();
    const logs = this.verificationLogs() || [];
    if (tab === 'terminal') {
      return logs.filter((l) => l.memberCategory === cat).slice(0, 12);
    }
    return logs.slice(0, 15);
  });

  readonly fillLightFrameClass = computed(() => {
    if (!this.fillLightBoost()) return 'ring-1 ring-slate-800';
    const color = this.policy().fillLightColor;
    if (color === 'warm') {
      return 'ring-[10px] ring-amber-100/95 shadow-[inset_0_0_60px_rgba(254,243,199,0.55)]';
    }
    if (color === 'bright') {
      return 'ring-[14px] ring-white shadow-[inset_0_0_80px_rgba(255,255,255,0.7)]';
    }
    return 'ring-[10px] ring-slate-100/95 shadow-[inset_0_0_55px_rgba(248,250,252,0.55)]';
  });

  // Navigation & Tab Controls
  setSubTab(tab: AttendanceSubTab): void {
    if (tab === 'setup' && !this.isOwner()) {
      this.emitToast('Only School Owner can modify attendance setup and access rights.', 'warning');
      return;
    }
    if (tab === 'enrollment' && !this.canEnrollCurrentPortal()) {
      this.emitToast('Face enrollment permission is restricted for your role by School Owner.', 'warning');
      return;
    }
    this.stopCamera(false);
    this.activeSubTab.set(tab);
    if (tab === 'students') this.activeCategory.set('student');
    if (tab === 'teachers') this.activeCategory.set('teacher');
    if (tab === 'staff') this.activeCategory.set('staff');
    if (tab === 'terminal' && this.keepCameraOn() && !this.isPortalLocked()) {
      setTimeout(() => void this.startCamera('verify', true), 60);
    }
    if (tab === 'enrollment') {
      const cat = this.activeCategory();
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

  setCategory(cat: AttendanceMemberCategory): void {
    this.activeCategory.set(cat);
    this.selectedTargetMemberId.set('');
    this.lastVerificationResult.set(null);
    this.capturedVerifyPreview.set('');
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
    if (!this.canEnrollCurrentPortal()) {
      this.emitToast('Face enrollment access is locked for this role by School Owner.', 'warning');
      return;
    }
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
    const list = cat === 'teacher' ? this.teacherMembers() : cat === 'staff' ? this.staffMembers() : this.studentMembers();
    this.enrollTargetMemberId.set(list[0]?.id || '');
    this.enrollCapturedDataUrl.set('');
    this.enrollExtraction.set(null);
  }

  // WebRTC Camera Controls (Continuous Live Stream — stays ON until explicit Stop)
  async startCamera(slot: 'verify' | 'enroll', silent: boolean = false): Promise<boolean> {
    this.keepCameraOn.set(true);
    this.cameraError.set('');
    this.cameraErrorKind.set('none');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.cameraErrorKind.set('unsupported');
      this.cameraError.set('Live camera requires HTTPS or a dedicated browser tab. Open Full Tab on your phone/desktop for non-stop auto scanning.');
      return false;
    }

    this.stopCamera(false);
    this.activeCameraSlot = slot;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.cameraFacingMode(),
          width: { ideal: 720 },
          height: { ideal: 540 }
        },
        audio: false
      });
      return this.activateMediaStream(slot, stream);
    } catch {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        return this.activateMediaStream(slot, fallbackStream);
      } catch (err: any) {
        this.cameraActive.set(false);
        const errName = String(err?.name || '');
        const errMsg = String(err?.message || '');

        let videoInputCount = -1;
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          videoInputCount = devices.filter((d) => d.kind === 'videoinput').length;
        } catch {
          videoInputCount = -1;
        }

        if (this.isInIframe && (errName === 'NotAllowedError' || errName === 'SecurityError' || /permission|policy|allowed/i.test(errMsg))) {
          this.cameraErrorKind.set('iframe_blocked');
          this.cameraError.set(
            'Preview window blocks live camera stream. Click "Open Full Tab (Live Camera)" to keep your phone/PC camera ON non-stop, or use Phone Camera Snap.'
          );
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError' || videoInputCount === 0) {
          this.cameraErrorKind.set('no_device');
          this.cameraError.set(
            'No webcam detected here. Use "Open Full Tab" on a phone or tap "Phone Camera" to capture.'
          );
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          this.cameraErrorKind.set('in_use');
          this.cameraError.set(
            'Camera is currently busy in another browser tab or app. Close it and click Retry.'
          );
        } else {
          this.cameraErrorKind.set('permission_denied');
          this.cameraError.set(
            'Camera permission blocked in browser. Allow Camera in address bar or tap "Open Full Tab".'
          );
        }
        if (!silent && errName && errName !== 'NotAllowedError') {
          this.emitToast(this.cameraError(), 'warning');
        }
        return false;
      }
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
          if (this.keepCameraOn() && this.activeSubTab() === 'terminal') {
            setTimeout(() => void this.startCamera('verify', true), 250);
          }
        }
      };
    }
    if (slot === 'verify' && this.autoScanEnabled()) {
      this.startAutoScanLoop();
    }
    return true;
  }

  // Smart Phone Camera: tries live non-stop WebRTC camera first so phone stays ON continuously;
  // falls back to native OS camera snap ONLY when preview iframe restricts getUserMedia.
  async activatePhoneCamera(slot: 'verify' | 'enroll'): Promise<void> {
    this.keepCameraOn.set(true);
    const liveStarted = await this.startCamera(slot, true);
    if (liveStarted) {
      this.emitToast('Phone live camera ON — keep scanning students automatically until you tap Stop.', 'success');
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
        () => this.emitToast('Live Kiosk link copied! Open it on your phone Chrome/Safari for non-stop auto camera.', 'success'),
        () => this.emitToast('Use the Open Full Tab button to launch live camera in a dedicated tab.', 'info')
      );
    } else {
      this.emitToast('Use the Open Full Tab button to launch live camera in a dedicated browser tab.', 'info');
    }
  }

  private attachVideoStream(slot: 'verify' | 'enroll', stream: MediaStream, retries: number): void {
    const el = slot === 'verify' ? this.verifyVideoEl?.nativeElement : this.enrollVideoEl?.nativeElement;
    if (el) {
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
    this.autoScanTimerId = setInterval(() => {
      if (!this.cameraActive() || this.activeCameraSlot !== 'verify' || !this.autoScanEnabled()) {
        this.stopAutoScanLoop();
        return;
      }
      if (this.isProcessingScan()) return;
      void this.runSingleAutoScanTick();
    }, 120);
  }

  private stopAutoScanLoop(): void {
    if (this.autoScanTimerId !== null) {
      clearInterval(this.autoScanTimerId);
      this.autoScanTimerId = null;
    }
    this.autoScanActive.set(false);
  }

  private async runSingleAutoScanTick(): Promise<void> {
    const cat = this.activeCategory();
    const catProfiles = this.faceProfiles().filter((fp) => fp.memberCategory === cat);
    if (catProfiles.length === 0) return;
    if (this.portalContext() === 'student' && !this.studentSelfCheckInAllowed()) return;

    const videoEl = this.verifyVideoEl?.nativeElement;
    if (!videoEl || videoEl.readyState < 2) return;

    this.isProcessingScan.set(true);
    try {
      const mirror = this.cameraFacingMode() === 'user';
      // Descriptor-only pass (~1ms) skips JPEG compression until an identity match/alert actually fires
      const extraction = this.faceVerifier.extractFromVideo(videoEl, mirror, false);
      if (!extraction || !extraction.faceDetectedLikely) {
        this.lastActiveFaceKey = '';
        return;
      }
      this.completeVerificationMatch(extraction, cat, catProfiles, true, videoEl, mirror);
    } finally {
      this.isProcessingScan.set(false);
    }
  }

  toggleFillLight(): void {
    if (!this.isOwner() && !this.rolePerms().liteModeAllowed) {
      this.emitToast('Light / Lite controls disabled for this role by Owner.', 'warning');
      return;
    }
    this.fillLightBoost.update((v) => !v);
  }

  toggleLiteVerifyMode(): void {
    const p = this.policy();
    if (!p.liteModeEnabled || (!this.isOwner() && !this.rolePerms().liteModeAllowed)) {
      this.emitToast('Lite Mode is disabled in School Owner Attendance Setup.', 'warning');
      return;
    }
    this.liteVerifyActive.update((v) => !v);
  }

  // Real Camera Frame Capture -> Face Verification
  async verifyLiveCameraFrame(): Promise<void> {
    if (this.isProcessingScan()) return;
    const cat = this.activeCategory();
    const catProfiles = this.faceProfiles().filter((fp) => fp.memberCategory === cat);

    if (catProfiles.length === 0) {
      this.emitToast(`No ${this.categoryLabel(cat)} face profiles are enrolled yet. Enroll a face first via Camera.`, 'warning');
      return;
    }

    if (this.portalContext() === 'student' && !this.studentSelfCheckInAllowed()) {
      this.emitToast('Student self face check-in is disabled by School Owner.', 'warning');
      return;
    }

    const videoEl = this.verifyVideoEl?.nativeElement;
    if (!this.cameraActive() || !videoEl) {
      this.emitToast('Start the live camera or snap a camera photo to run face verification.', 'warning');
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
            message: 'Liveness check failed: camera feed appears static. Blink or adjust slightly.',
            memberName: 'Unverified Frame',
            memberCode: '-',
            category: cat,
            statusMarked: 'Rejected'
          });
          this.emitToast('Liveness check failed — please keep a live moving face in frame.', 'warning');
          return;
        }
      }

      const extraction = this.faceVerifier.extractFromVideo(videoEl, this.cameraFacingMode() === 'user');
      if (!extraction) {
        this.emitToast('Unable to read camera frame. Ensure camera video feed is visible.', 'warning');
        return;
      }
      this.capturedVerifyPreview.set(extraction.photoDataUrl);
      this.completeVerificationMatch(extraction, cat, catProfiles);
    } finally {
      this.isProcessingScan.set(false);
    }
  }

  async onVerifyPhotoFileSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl?.files?.[0];
    if (!file) return;
    inputEl.value = '';
    await this.processVerifyFile(file);
  }

  private async processVerifyFile(file: File): Promise<void> {
    const cat = this.activeCategory();
    const catProfiles = this.faceProfiles().filter((fp) => fp.memberCategory === cat);
    if (catProfiles.length === 0) {
      this.emitToast(`No enrolled face profiles exist for ${this.categoryLabel(cat)}. Please enroll first.`, 'warning');
      return;
    }

    this.isProcessingScan.set(true);
    try {
      const { result, rawDataUrl } = await this.faceVerifier.extractFromFile(file);
      if (!result) {
        this.emitToast('Could not extract facial signature from captured image.', 'warning');
        return;
      }
      this.capturedVerifyPreview.set(result.photoDataUrl || rawDataUrl);
      this.completeVerificationMatch(result, cat, catProfiles, false);
    } finally {
      this.isProcessingScan.set(false);
    }
  }

  private completeVerificationMatch(
    extraction: FaceExtractionResult,
    cat: AttendanceMemberCategory,
    catProfiles: FaceProfileRecord[],
    isAutoScan: boolean = false,
    videoElForLazyThumb?: HTMLVideoElement,
    mirrorForLazyThumb: boolean = true
  ): void {
    const resolveSnapUrl = () => {
      if (extraction.photoDataUrl) return extraction.photoDataUrl;
      if (videoElForLazyThumb) {
        extraction.photoDataUrl = this.faceVerifier.captureThumbnailFromVideo(videoElForLazyThumb, mirrorForLazyThumb);
      }
      return extraction.photoDataUrl;
    };

    const targetId = this.scanScope() === 'targeted' ? this.selectedTargetMemberId() : undefined;
    if (this.scanScope() === 'targeted' && targetId && !catProfiles.some((p) => p.memberId === targetId)) {
      if (isAutoScan) return;
      const targetMember = this.activeCategoryMembers().find((m) => m.id === targetId);
      this.lastVerificationResult.set({
        matched: false,
        confidence: 0,
        threshold: this.effectiveThreshold(),
        message: `${targetMember?.name || 'Selected member'} does not have a registered camera face profile yet.`,
        memberName: targetMember?.name || 'Unenrolled Member',
        memberCode: targetMember?.code || '-',
        category: cat,
        statusMarked: 'Rejected',
        livePhoto: resolveSnapUrl()
      });
      this.emitToast('Selected member has no enrolled face photo. Enroll their face first.', 'warning');
      return;
    }

    if (!extraction.faceDetectedLikely) {
      if (isAutoScan) return;
      this.lastVerificationResult.set({
        matched: false,
        confidence: 0,
        threshold: this.effectiveThreshold(),
        message: extraction.reason || 'Low light or face not centered. Turn ON Light and center your face.',
        memberName: 'Low Visibility',
        memberCode: '-',
        category: cat,
        statusMarked: 'Rejected',
        livePhoto: resolveSnapUrl()
      });
      this.emitToast(extraction.reason || 'Face visibility too low — enable Light.', 'warning');
      return;
    }

    // Apply per-member lite boost if Owner enabled lite on that member and current mode allows it
    let threshold = this.effectiveThreshold();
    if (targetId) {
      const targetProf = catProfiles.find((p) => p.memberId === targetId);
      if (targetProf?.liteEnabled && this.policy().liteModeEnabled && this.liteVerifyActive()) {
        threshold = this.policy().liteConfidenceThreshold;
      }
    }

    const match = this.faceVerifier.matchAgainstProfiles(extraction.descriptor, catProfiles, threshold, targetId);
    const nowMs = Date.now();

    if (!match.matched || !match.profile) {
      this.lastActiveFaceKey = '';
      const closestName = match.candidateScores[0]?.profile?.memberName || 'Unregistered Face';
      this.lastVerificationResult.set({
        matched: false,
        resultType: 'mismatch',
        confidence: match.confidence,
        threshold: match.thresholdUsed,
        message: `Face not matched (${match.confidence}% < ${match.thresholdUsed}% required). Closest: ${closestName}.`,
        memberName: 'Face Not Matched',
        memberCode: '-',
        category: cat,
        statusMarked: 'Not Matched',
        livePhoto: isAutoScan ? undefined : resolveSnapUrl(),
        enrolledPhoto: match.candidateScores[0]?.profile?.facePhotoData
      });
      this.triggerScanOverlay(
        {
          kind: 'mismatch',
          title: 'Face Not Matched',
          subtitle: `Match ${match.confidence}% below ${match.thresholdUsed}% — Rejected`,
          badgeText: 'NOT REGISTERED · REJECTED',
          confidence: match.confidence
        },
        1300
      );
      if (!isAutoScan || nowMs - this.lastAlertBeepAt >= 1200) {
        this.lastAlertBeepAt = nowMs;
        this.playAlertTone('mismatch');
      }
      if (!isAutoScan) {
        this.emitToast(`Face mismatch (${match.confidence}% < ${match.thresholdUsed}% threshold). Access Denied.`, 'warning');
      }
      return;
    }

    const prof = match.profile;
    const memberKey = `${prof.memberCategory}:${prof.memberId}`;
    const todayIso = new Date().toISOString().split('T')[0];
    const nowDate = new Date();
    const nowHHMM = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;
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
    const outEnableTime = this.policy().checkOutEnableTime || '13:30';

    // Determine if this matched face qualifies for IN, re-enabled OUT, or DUPLICATE REJECTED
    let nextPunch: 'IN' | 'OUT' | null = null;
    if (!hasIn) {
      nextPunch = 'IN';
    } else if (twoPunch && nowHHMM >= outEnableTime && !hasOut) {
      const inAgeOk = !session?.inAtMs || (nowMs - session.inAtMs >= 60000);
      if (inAgeOk) {
        nextPunch = 'OUT';
      }
    }

    if (!nextPunch) {
      const lastStampMs = Math.max(session?.inAtMs || 0, session?.outAtMs || 0);
      if (isAutoScan && this.lastActiveFaceKey === memberKey && lastStampMs > 0 && nowMs - lastStampMs < 650) {
        return;
      }
      this.lastActiveFaceKey = memberKey;

      const inTimeStr = session?.inTime || inLog?.timestamp || 'earlier today';
      const outTimeStr = session?.outTime || outLog?.timestamp || '';
      const rejectSubtitle = hasOut
        ? `Duplicate Rejected · Already Checked OUT (${outTimeStr})`
        : twoPunch
          ? `Duplicate Rejected · Checked IN (${inTimeStr}) · OUT enables ${outEnableTime}`
          : `Duplicate Rejected · Already Marked IN (${inTimeStr})`;

      this.lastVerificationResult.set({
        matched: false,
        resultType: 'duplicate',
        confidence: match.confidence,
        threshold: match.thresholdUsed,
        message: rejectSubtitle,
        memberName: prof.memberName,
        memberCode: prof.memberCode,
        category: prof.memberCategory,
        statusMarked: 'Duplicate',
        enrolledPhoto: prof.facePhotoData,
        livePhoto: resolveSnapUrl()
      });
      this.triggerScanOverlay(
        {
          kind: 'duplicate',
          title: prof.memberName,
          subtitle: rejectSubtitle,
          badgeText: 'DUPLICATE · REJECTED',
          confidence: match.confidence,
          memberCode: prof.memberCode
        },
        1300
      );
      if (!isAutoScan || nowMs - this.lastAlertBeepAt >= 950) {
        this.lastAlertBeepAt = nowMs;
        this.playAlertTone('duplicate');
      }
      if (!isAutoScan) {
        this.emitToast(rejectSubtitle, 'warning');
      }
      return;
    }

    this.lastActiveFaceKey = memberKey;
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
    const overlayBadge = nextPunch === 'OUT' ? 'VERIFIED · CHECKED OUT' : 'VERIFIED · ATTENDANCE MARKED';
    const overlaySub =
      nextPunch === 'OUT'
        ? `${prof.gradeOrDept} · OUT at ${timeLabel} · ${match.confidence}%`
        : `${prof.gradeOrDept} · ${status} IN at ${timeLabel} · ${match.confidence}%`;

    this.recentVerifiedFeed.update((feed) => [
      { id: `${memberKey}-${nowMs}`, name: prof.memberName, punch: nextPunch as 'IN' | 'OUT', time: timeLabel },
      ...feed
    ].slice(0, 4));

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
      livePhoto: snapUrl
    });

    this.triggerScanOverlay(
      {
        kind: 'success',
        title: prof.memberName,
        subtitle: overlaySub,
        badgeText: overlayBadge,
        punchType: nextPunch,
        confidence: match.confidence,
        memberCode: prof.memberCode
      },
      1500
    );

    this.playMatchChime();

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
        ? `${this.liteVerifyActive() ? 'Auto Camera (Lite)' : 'Auto Live Camera'} · ${nextPunch}`
        : `${this.liteVerifyActive() ? 'Camera Verify (Lite)' : 'Camera Verification'} · ${nextPunch}`,
      snapshotData: snapUrl
    });
  }

  private triggerScanOverlay(
    overlay: {
      kind: 'success' | 'duplicate' | 'mismatch';
      title: string;
      subtitle: string;
      badgeText: string;
      punchType?: 'IN' | 'OUT';
      confidence?: number;
      memberCode?: string;
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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, t);
      osc.frequency.setValueAtTime(1567.98, t + 0.055);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    } catch {}
  }

  private playAlertTone(kind: 'duplicate' | 'mismatch'): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      if (kind === 'duplicate') {
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.setValueAtTime(280, t + 0.075);
      } else {
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.setValueAtTime(210, t + 0.08);
      }
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  // Face Enrollment Methods (Real Video Frame or Phone Camera Capture)
  captureEnrollmentFromCamera(): void {
    const videoEl = this.enrollVideoEl?.nativeElement;
    if (!this.cameraActive() || !videoEl) {
      this.emitToast('Open Webcam or tap Phone Camera below to capture face.', 'warning');
      return;
    }
    this.isCapturingEnroll.set(true);
    try {
      const result = this.faceVerifier.extractFromVideo(videoEl, this.cameraFacingMode() === 'user');
      if (!result) {
        this.emitToast('Camera frame not ready yet. Wait a second and retry.', 'warning');
        return;
      }
      this.enrollCapturedDataUrl.set(result.photoDataUrl);
      this.enrollExtraction.set(result);
      this.emitToast(`Face signature captured (${result.qualityScore}% quality). Click Save Face Profile to register.`, 'info');
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
      this.emitToast(`Face photo analyzed (${result.qualityScore}% quality). Ready to register.`, 'info');
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

  // Roster Actions (Enforces Camera-First unless Owner enabled Manual Fallback)
  handleRosterStatusAction(member: AttendanceMemberView, status: 'Present' | 'Late' | 'Absent' | 'On Leave'): void {
    if (!this.canUseManualFallback()) {
      this.emitToast(`Camera Face Verification is required for ${member.name}. Opening camera terminal.`, 'info');
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

  // Owner Policy Draft Mutations
  updateDraftMode(mode: 'strict' | 'standard' | 'lite'): void {
    this.policyDraft.update((d) => ({
      ...d,
      verificationMode: mode,
      livenessCheckEnabled: mode === 'strict' ? true : d.livenessCheckEnabled,
      liteModeEnabled: mode === 'lite' ? true : d.liteModeEnabled
    }));
  }

  toggleDraftField(field: 'liteModeEnabled' | 'cameraFillLightEnabled' | 'livenessCheckEnabled' | 'autoCaptureOnMatch' | 'requireCameraForAllAttendance' | 'twoPunchEnabled'): void {
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

  toggleRolePermission(role: 'principal' | 'teacher' | 'staff' | 'student', key: keyof RoleAttendancePermission): void {
    this.policyDraft.update((d) => ({
      ...d,
      roleAccess: {
        ...d.roleAccess,
        [role]: { ...d.roleAccess[role], [key]: !d.roleAccess[role][key] }
      }
    }));
  }

  toggleIndividualOperatorOverride(cat: 'teacher' | 'staff', memberId: string, field: 'enabled' | 'liteEnabled'): void {
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

  isMemberOverrideActive(cat: 'teacher' | 'staff', memberId: string, field: 'enabled' | 'liteEnabled'): boolean {
    const ov = this.policyDraft().operatorOverrides?.[`${cat}:${memberId}`];
    if (!ov) return true;
    return Boolean(ov[field]);
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
    // Strip seconds from HH:MM:SS AM/PM if present -> HH:MM AM/PM
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

  categoryLabel(cat: AttendanceMemberCategory): string {
    if (cat === 'teacher') return 'Teachers';
    if (cat === 'staff') return 'Staff';
    return 'Students';
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
    // Keep arrival realistic: if testing past school hours (after 15:00), treat verification as Present On-Time unless between cutoff and 14:30
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
