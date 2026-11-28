import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule } from 'lucide-angular';
import {
  AttendanceMemberCategory,
  AttendancePortalContext,
  FaceVerificationLogRecord,
  OwnerAttendancePolicy,
  PrincipalMemberRecord,
  StaffMemberRecord,
  createDefaultOwnerAttendancePolicy
} from '../../models/school-attendance.models';
import {
  AttendanceDailyLogEntry,
  AttendanceMemberAnalytics,
  AttendanceMonthSummary,
  AttendanceNormalizedMember,
  AttendanceRangeBreakdown,
  AttendanceVerificationChannelKind,
  AttendanceYearSummary,
  ExtraDailyGateLogInput,
  buildMemberAttendanceAnalytics,
  computeAttendanceRangeBreakdown,
  formatDisplayDate,
  parsePercentageValue
} from '../../utils/school-attendance-history.util';
import { SchoolTableDirective } from '../../directives/school-table.directive';
import { SchoolTableSchemaService } from '../../services/school-table-schema.service';
import { buildSchoolStatementA4Html } from '../../utils/school-statement-print.util';
import { printHtmlInHiddenFrame } from '../../utils/thermal-print.util';

export type AttendanceAnalyticsPortalContext = AttendancePortalContext | 'parent';
export type AttendanceAnalyticsViewTab = 'daily' | 'monthly' | 'six_months' | 'yearly' | 'members';
export type AnalyticsCategoryFilter = 'all' | AttendanceMemberCategory;
export type VerificationMethodFilter = 'ALL' | AttendanceVerificationChannelKind;
export type RangePresetKind = 'all' | 'this_month' | 'last_6m' | 'this_year' | 'last_year' | 'prev_2_year' | 'custom';
export type PageToken = { kind: 'page'; page: number; label: string } | { kind: 'ellipsis'; id: string };

@Component({
  selector: 'app-school-attendance-analytics',
  imports: [CommonModule, MatIconModule, LucideAngularModule, SchoolTableDirective],
  templateUrl: './school-attendance-analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchoolAttendanceAnalyticsComponent {
  private readonly tableSchemaService = inject(SchoolTableSchemaService);

  // Inputs
  portalContext = input<AttendanceAnalyticsPortalContext>('owner');
  schoolName = input<string>('Al-Huda International Academy');
  students = input<any[]>([]);
  teachers = input<any[]>([]);
  staff = input<StaffMemberRecord[]>([]);
  principals = input<PrincipalMemberRecord[]>([]);
  policy = input<OwnerAttendancePolicy>(createDefaultOwnerAttendancePolicy());
  verificationLogs = input<FaceVerificationLogRecord[]>([]);
  extraDailyLogs = input<ExtraDailyGateLogInput[]>([]);
  focusedStudentId = input<string>('');
  focusedStudentSummary = input<any>(null);
  currentTeacherGrade = input<string>('All');
  currentActorName = input<string>('Campus Member');
  activeBranchLabel = input<string>('All Branches (Group HQ)');
  titleOverride = input<string>('');

  readonly currentYearNum = new Date().getFullYear();
  readonly lastYearNum = this.currentYearNum - 1;
  readonly prevTwoYearNum = this.currentYearNum - 2;
  readonly earliestSelectableDate = `${this.prevTwoYearNum}-01-01`;
  readonly latestSelectableDate = new Date().toISOString().split('T')[0];

  // Local filter & navigation signals
  activeView = signal<AttendanceAnalyticsViewTab>('monthly');
  categoryFilter = signal<AnalyticsCategoryFilter>('all');
  selectedMemberKey = signal<string>('aggregate');
  selectedYearFilter = signal<string>('ALL');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  rangePreset = signal<RangePresetKind>('all');
  dailyStatusFilter = signal<'ALL' | 'Present' | 'Late' | 'Absent' | 'On Leave'>('ALL');
  methodFilter = signal<VerificationMethodFilter>('ALL');
  searchQuery = signal<string>('');
  gradeFilter = signal<string>('All');
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);

  constructor() {
    effect(() => {
      const ctx = this.portalContext();
      const focusedId = this.focusedStudentId();
      if (ctx === 'parent' || ctx === 'student') {
        this.categoryFilter.set('student');
        if (focusedId) {
          this.selectedMemberKey.set(`student:${focusedId}`);
        }
        if (this.activeView() === 'members') {
          this.activeView.set('daily');
        }
      } else if (ctx === 'teacher') {
        this.categoryFilter.set('all');
        this.selectedMemberKey.set('aggregate');
      } else {
        // Owner or Principal
        const allowed = this.allowedCategories();
        const curCat = this.categoryFilter();
        if (ctx !== 'owner' && curCat !== 'all' && !allowed.includes(curCat)) {
          this.categoryFilter.set(allowed.length === 1 ? allowed[0] : 'all');
        }
      }
    });
  }

  readonly isOwner = computed<boolean>(() => this.portalContext() === 'owner');
  readonly isSinglePersonPortal = computed<boolean>(
    () => this.portalContext() === 'parent' || this.portalContext() === 'student'
  );

  readonly allowedCategories = computed<AttendanceMemberCategory[]>(() => {
    const ctx = this.portalContext();
    if (ctx === 'owner') return ['student', 'teacher', 'staff', 'principal'];
    if (ctx === 'parent' || ctx === 'student') return ['student'];
    if (ctx === 'teacher') {
      const rule = this.policy().roleAccess.teacher;
      const cats: AttendanceMemberCategory[] = [];
      if (rule?.canScanStudents !== false) cats.push('student');
      if (rule?.canScanTeachers !== false) cats.push('teacher');
      if (cats.length === 0) cats.push('student');
      return cats;
    }
    // Principal
    const pRule = this.policy().roleAccess.principal;
    const cats: AttendanceMemberCategory[] = [];
    if (pRule?.canScanStudents) cats.push('student');
    if (pRule?.canScanTeachers) cats.push('teacher');
    if (pRule?.canScanStaff) cats.push('staff');
    if (pRule?.canScanPrincipal) cats.push('principal');
    return cats.length > 0 ? cats : ['student', 'teacher', 'staff'];
  });

  readonly canExportReports = computed<boolean>(() => {
    const ctx = this.portalContext();
    if (ctx === 'owner') return true;
    if (ctx === 'parent' || ctx === 'student') return true;
    if (ctx === 'principal') return Boolean(this.policy().roleAccess.principal.canExportReports);
    if (ctx === 'teacher') return Boolean(this.policy().roleAccess.teacher.canExportReports);
    return false;
  });

  // Normalize all accessible members strictly according to portal role
  readonly normalizedMembers = computed<AttendanceNormalizedMember[]>(() => {
    const ctx = this.portalContext();
    const allowed = this.allowedCategories();
    const out: AttendanceNormalizedMember[] = [];

    if (ctx === 'parent' || ctx === 'student') {
      const summary = this.focusedStudentSummary();
      const targetId = String(this.focusedStudentId() || summary?.id || '').trim().toLowerCase();
      const matched = (this.students() || []).find(
        (s) =>
          (targetId && String(s.id || '').toLowerCase() === targetId) ||
          (summary?.rollNo && String(s.rollNo || '').toLowerCase() === String(summary.rollNo).toLowerCase()) ||
          (summary?.name && String(s.name || '').toLowerCase() === String(summary.name).toLowerCase())
      );
      const src = matched || summary || (this.students() || [])[0];
      if (src) {
        const logs = this.extraDailyLogs() || [];
        const latestExtra = logs[0];
        out.push({
          id: String(src.id || targetId || 'ST-1001'),
          code: String(src.rollNo || src.id || '1001'),
          name: String(src.name || summary?.name || this.currentActorName() || 'Student'),
          category: 'student',
          subLabel: String(src.grade || summary?.grade || 'Class 10-A'),
          sectionOrDept: String(src.section || summary?.section || 'General'),
          rfidOrTag: String(summary?.rfidCard || src.rfidCard || `RFID-${src.rollNo || '88219'}`),
          baselineRatePct: parsePercentageValue(summary?.attendanceRate || src.attendance, 97.5),
          todayStatus: this.mapRawStatus(latestExtra?.status || src.status || summary?.status),
          todayCheckIn: String(summary?.checkInTime || latestExtra?.checkIn || '07:48 AM'),
          todayCheckOut: String(latestExtra?.checkOut || ''),
          todayGate: String(latestExtra?.gate || 'Main North Gate (RFID-01)')
        });
      }
      return out;
    }

    // Multi-member portals: Owner, Principal, Teacher
    if (allowed.includes('student')) {
      const teacherGrade = String(this.currentTeacherGrade() || 'All').trim().toLowerCase();
      const filterByTeacherClass = ctx === 'teacher' && teacherGrade && teacherGrade !== 'all';
      for (const s of this.students() || []) {
        const g = String(s.grade || 'Class 10-A');
        if (filterByTeacherClass && !g.toLowerCase().includes(teacherGrade)) {
          continue;
        }
        out.push({
          id: String(s.id),
          code: String(s.rollNo || s.id),
          name: String(s.name || 'Student'),
          category: 'student',
          subLabel: g,
          sectionOrDept: String(s.section || 'General'),
          rfidOrTag: String(s.rfidCard || `RFID-${s.rollNo || s.id}`),
          baselineRatePct: parsePercentageValue(s.attendance, 95.4),
          todayStatus: this.mapRawStatus(s.status)
        });
      }
    }

    if (allowed.includes('teacher')) {
      const actor = String(this.currentActorName() || '').trim().toLowerCase();
      for (const t of this.teachers() || []) {
        if (ctx === 'teacher' && actor && !String(t.name || '').toLowerCase().includes(actor)) {
          // Teachers only see their own teacher attendance record, not other faculty private logs
          continue;
        }
        out.push({
          id: String(t.id),
          code: String(t.empCode || t.id),
          name: String(t.name || 'Faculty'),
          category: 'teacher',
          subLabel: String(t.designation || t.subject || 'Faculty'),
          sectionOrDept: String(t.assignedGrade && t.assignedGrade !== 'All' ? t.assignedGrade : 'Academic Faculty'),
          rfidOrTag: String(t.empCode || t.id),
          baselineRatePct: parsePercentageValue(t.attendanceRate, 96.8),
          todayStatus: this.mapRawStatus(t.attendanceStatus)
        });
      }
    }

    if (allowed.includes('staff') && (ctx === 'owner' || ctx === 'principal')) {
      for (const sf of this.staff() || []) {
        out.push({
          id: String(sf.id),
          code: String(sf.empCode || sf.id),
          name: String(sf.name || 'Staff Member'),
          category: 'staff',
          subLabel: String(sf.roleTitle || 'Staff'),
          sectionOrDept: String(sf.department || 'Campus Operations'),
          rfidOrTag: String(sf.empCode || sf.id),
          baselineRatePct: 95.8,
          todayStatus: this.mapRawStatus(sf.attendanceStatus)
        });
      }
    }

    if (allowed.includes('principal') && (ctx === 'owner' || ctx === 'principal')) {
      for (const pr of this.principals() || []) {
        out.push({
          id: String(pr.id),
          code: String(pr.empCode || pr.id),
          name: String(pr.name || 'Principal'),
          category: 'principal',
          subLabel: String(pr.roleTitle || 'Principal'),
          sectionOrDept: String(pr.department || 'Executive Directorate'),
          rfidOrTag: String(pr.empCode || pr.id),
          baselineRatePct: 98.4,
          todayStatus: this.mapRawStatus(pr.attendanceStatus)
        });
      }
    }

    return out;
  });

  readonly gradeOptions = computed<string[]>(() => {
    const set = new Set<string>(['All']);
    for (const m of this.normalizedMembers()) {
      if (m.category === 'student' && m.subLabel) {
        set.add(m.subLabel);
      }
    }
    return Array.from(set);
  });

  readonly filteredMembers = computed<AttendanceNormalizedMember[]>(() => {
    const cat = this.categoryFilter();
    const grade = this.gradeFilter();
    return this.normalizedMembers().filter((m) => {
      if (cat !== 'all' && m.category !== cat) return false;
      if (cat === 'student' && grade !== 'All' && !m.subLabel.toLowerCase().includes(grade.toLowerCase())) {
        return false;
      }
      return true;
    });
  });

  // Compute full analytics per filtered member
  readonly memberAnalyticsList = computed<AttendanceMemberAnalytics[]>(() => {
    const logs = this.verificationLogs() || [];
    const extra = this.isSinglePersonPortal() ? (this.extraDailyLogs() || []) : [];
    const pol = this.policy();
    return this.filteredMembers().map((m) =>
      buildMemberAttendanceAnalytics(m, logs, extra, pol)
    );
  });

  // Determine active analytics scope (single member or aggregate across filtered members)
  readonly selectedMemberAnalytics = computed<AttendanceMemberAnalytics | null>(() => {
    const list = this.memberAnalyticsList();
    if (list.length === 0) return null;
    if (this.isSinglePersonPortal()) return list[0];
    const key = this.selectedMemberKey();
    if (key === 'aggregate') return null;
    return list.find((a) => `${a.member.category}:${a.member.id}` === key) || null;
  });

  readonly effectiveFromIso = computed<string>(() => {
    const a = this.dateFrom().trim();
    const b = this.dateTo().trim();
    if (a && b && a > b) return b;
    return a;
  });

  readonly effectiveToIso = computed<string>(() => {
    const a = this.dateFrom().trim();
    const b = this.dateTo().trim();
    if (a && b && a > b) return a;
    return b;
  });

  readonly hasCustomDateRange = computed<boolean>(() =>
    Boolean(this.effectiveFromIso() || this.effectiveToIso())
  );

  readonly activeRangeDisplayLabel = computed<string>(() => {
    const from = this.effectiveFromIso();
    const to = this.effectiveToIso();
    if (from && to) return `${formatDisplayDate(from)} → ${formatDisplayDate(to)}`;
    if (from) return `${formatDisplayDate(from)} → Today`;
    if (to) return `Start → ${formatDisplayDate(to)}`;
    const yr = this.selectedYearFilter();
    if (yr !== 'ALL') return `Year ${yr} Full Record`;
    return 'All 3 Academic Years';
  });

  readonly availableYears = computed<string[]>(() => {
    const years = new Set<number>();
    for (const a of this.memberAnalyticsList()) {
      for (const y of a.yearlySummaries) years.add(y.year);
    }
    return ['ALL', ...Array.from(years).sort((a, b) => b - a).map(String)];
  });

  readonly memberRangeBreakdownMap = computed<Map<string, AttendanceRangeBreakdown>>(() => {
    const map = new Map<string, AttendanceRangeBreakdown>();
    const from = this.effectiveFromIso();
    const to = this.effectiveToIso();
    if (!from && !to) return map;
    for (const a of this.memberAnalyticsList()) {
      const key = `${a.member.category}:${a.member.id}`;
      map.set(key, computeAttendanceRangeBreakdown(a.dailyLogs, `range-${a.member.id}`, from, to));
    }
    return map;
  });

  // Unified summary KPIs (works for single child/student, selected member, or campus/class aggregate)
  // Automatically scopes Total / Selected Period / Min / Max when Start-to-End Date Range is active
  readonly activeSummary = computed(() => {
    const single = this.selectedMemberAnalytics();
    const yearFilter = this.selectedYearFilter();
    const customRange = this.hasCustomDateRange();
    const rangeMap = this.memberRangeBreakdownMap();

    if (single) {
      const rb = customRange ? rangeMap.get(`${single.member.category}:${single.member.id}`) || null : null;
      const baseMonths = rb ? rb.monthlySummaries : single.monthlySummaries;
      const yearMonths = yearFilter === 'ALL'
        ? baseMonths
        : baseMonths.filter((m) => String(m.year) === yearFilter);

      let minM: AttendanceMonthSummary | null = null;
      let maxM: AttendanceMonthSummary | null = null;
      for (const m of yearMonths) {
        if (!minM || m.attendancePct < minM.attendancePct) minM = m;
        if (!maxM || m.attendancePct > maxM.attendancePct) maxM = m;
      }

      const yearWorking = yearMonths.reduce((s, m) => s + m.workingDays, 0);
      const yearAttended = yearMonths.reduce((s, m) => s + m.attendedDays, 0);
      const yearPresent = yearMonths.reduce((s, m) => s + m.presentDays, 0);
      const yearLate = yearMonths.reduce((s, m) => s + m.lateDays, 0);
      const yearAbsent = yearMonths.reduce((s, m) => s + m.absentDays, 0);
      const yearLeave = yearMonths.reduce((s, m) => s + m.leaveDays, 0);
      const yearPct = yearWorking > 0 ? Number(((yearAttended / yearWorking) * 100).toFixed(1)) : 0;

      const useYearFiltered = !customRange && yearFilter !== 'ALL';
      const totalWorkingDays = rb ? rb.workingDays : (useYearFiltered ? yearWorking : single.totalWorkingDays);
      const totalPresent = rb ? rb.presentDays : (useYearFiltered ? yearPresent : single.totalPresent);
      const totalLate = rb ? rb.lateDays : (useYearFiltered ? yearLate : single.totalLate);
      const totalAbsent = rb ? rb.absentDays : (useYearFiltered ? yearAbsent : single.totalAbsent);
      const totalLeave = rb ? rb.leaveDays : (useYearFiltered ? yearLeave : single.totalLeave);
      const totalAttended = rb ? rb.attendedDays : (useYearFiltered ? yearAttended : single.totalAttended);
      const overallPct = rb ? rb.attendancePct : (useYearFiltered ? yearPct : single.overallPct);
      const presentPct = totalWorkingDays > 0 ? Number(((totalAttended / totalWorkingDays) * 100).toFixed(1)) : 0;
      const absentPct = totalWorkingDays > 0 ? Number(((totalAbsent / totalWorkingDays) * 100).toFixed(1)) : 0;
      const leavePct = totalWorkingDays > 0 ? Number(((totalLeave / totalWorkingDays) * 100).toFixed(1)) : 0;

      return {
        isAggregate: false,
        title: single.member.name,
        code: single.member.code,
        category: single.member.category,
        subLabel: single.member.subLabel,
        sectionOrDept: single.member.sectionOrDept,
        rfidOrTag: single.member.rfidOrTag,
        memberCount: 1,
        totalWorkingDays,
        totalPresent,
        totalLate,
        totalAbsent,
        totalLeave,
        totalAttended,
        overallPct,
        presentPct,
        absentPct,
        leavePct,
        sixMonthWorkingDays: single.sixMonthWorkingDays,
        sixMonthAttended: single.sixMonthAttended,
        sixMonthPresent: single.sixMonthPresent,
        sixMonthLate: single.sixMonthLate,
        sixMonthAbsent: single.sixMonthAbsent,
        sixMonthLeave: single.sixMonthLeave,
        sixMonthPct: single.sixMonthPct,
        sixMonthTrendDelta: single.sixMonthTrendDelta,
        yearWorking,
        yearAttended,
        yearPresent,
        yearLate,
        yearAbsent,
        yearLeave,
        yearPct,
        minMonth: minM || (rb ? rb.minMonth : single.minMonth),
        maxMonth: maxM || (rb ? rb.maxMonth : single.maxMonth),
        longestStreakDays: rb ? rb.longestStreakDays : single.longestStreakDays,
        avgCheckInTime: rb ? rb.avgCheckInTime : single.avgCheckInTime,
        todayLiveEntry: single.todayLiveEntry
      };
    }

    // Aggregate across all filtered members (Owner / Principal / Teacher)
    const list = this.memberAnalyticsList();
    if (list.length === 0) {
      return null;
    }

    const monthBucket = new Map<string, {
      year: number;
      monthIndex: number;
      monthKey: string;
      monthLabel: string;
      shortLabel: string;
      workingDays: number;
      presentDays: number;
      lateDays: number;
      absentDays: number;
      leaveDays: number;
      attendedDays: number;
      avgCheckInTime: string;
      earliestCheckIn: string;
      latestCheckIn: string;
    }>();

    let aggWorkingRange = 0;
    let aggPresentRange = 0;
    let aggLateRange = 0;
    let aggAbsentRange = 0;
    let aggLeaveRange = 0;
    let aggAttendedRange = 0;
    let maxRangeStreak = 0;

    for (const a of list) {
      const rb = customRange ? rangeMap.get(`${a.member.category}:${a.member.id}`) || null : null;
      const sourceMonths = rb ? rb.monthlySummaries : a.monthlySummaries;
      if (rb) {
        aggWorkingRange += rb.workingDays;
        aggPresentRange += rb.presentDays;
        aggLateRange += rb.lateDays;
        aggAbsentRange += rb.absentDays;
        aggLeaveRange += rb.leaveDays;
        aggAttendedRange += rb.attendedDays;
        if (rb.longestStreakDays > maxRangeStreak) maxRangeStreak = rb.longestStreakDays;
      }
      for (const m of sourceMonths) {
        const cur = monthBucket.get(m.monthKey);
        if (!cur) {
          monthBucket.set(m.monthKey, { ...m });
        } else {
          cur.workingDays += m.workingDays;
          cur.presentDays += m.presentDays;
          cur.lateDays += m.lateDays;
          cur.absentDays += m.absentDays;
          cur.leaveDays += m.leaveDays;
          cur.attendedDays += m.attendedDays;
        }
      }
    }

    const allAggMonths: AttendanceMonthSummary[] = Array.from(monthBucket.values())
      .map((b) => {
        const pct = b.workingDays > 0 ? Number(((b.attendedDays / b.workingDays) * 100).toFixed(1)) : 0;
        const statusBand: AttendanceMonthSummary['statusBand'] =
          pct >= 95 ? 'Exemplary' : (pct >= 88 ? 'Good' : (pct >= 78 ? 'Watch' : 'Low'));
        return {
          key: `agg-${b.monthKey}`,
          year: b.year,
          monthIndex: b.monthIndex,
          monthKey: b.monthKey,
          monthLabel: b.monthLabel,
          shortLabel: b.shortLabel,
          workingDays: b.workingDays,
          presentDays: b.presentDays,
          lateDays: b.lateDays,
          absentDays: b.absentDays,
          leaveDays: b.leaveDays,
          attendedDays: b.attendedDays,
          attendancePct: pct,
          avgCheckInTime: b.avgCheckInTime,
          earliestCheckIn: b.earliestCheckIn,
          latestCheckIn: b.latestCheckIn,
          statusBand
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    const yearMonths = yearFilter === 'ALL'
      ? allAggMonths
      : allAggMonths.filter((m) => String(m.year) === yearFilter);

    let minM: AttendanceMonthSummary | null = null;
    let maxM: AttendanceMonthSummary | null = null;
    for (const m of yearMonths) {
      if (!minM || m.attendancePct < minM.attendancePct) minM = m;
      if (!maxM || m.attendancePct > maxM.attendancePct) maxM = m;
    }

    // 6-Month Rolling KPIs always come from full history for consistent 6M comparison
    const fullBucket = new Map<string, { workingDays: number; presentDays: number; lateDays: number; absentDays: number; leaveDays: number; attendedDays: number }>();
    for (const a of list) {
      for (const m of a.monthlySummaries) {
        const cur = fullBucket.get(m.monthKey) || { workingDays: 0, presentDays: 0, lateDays: 0, absentDays: 0, leaveDays: 0, attendedDays: 0 };
        cur.workingDays += m.workingDays;
        cur.presentDays += m.presentDays;
        cur.lateDays += m.lateDays;
        cur.absentDays += m.absentDays;
        cur.leaveDays += m.leaveDays;
        cur.attendedDays += m.attendedDays;
        fullBucket.set(m.monthKey, cur);
      }
    }
    const sortedFullKeys = Array.from(fullBucket.keys()).sort((a, b) => b.localeCompare(a));
    const sixKeys = sortedFullKeys.slice(0, 6);
    const prevSixKeys = sortedFullKeys.slice(6, 12);
    const sixMonthWorkingDays = sixKeys.reduce((s, k) => s + (fullBucket.get(k)?.workingDays || 0), 0);
    const sixMonthAttended = sixKeys.reduce((s, k) => s + (fullBucket.get(k)?.attendedDays || 0), 0);
    const sixMonthPresent = sixKeys.reduce((s, k) => s + (fullBucket.get(k)?.presentDays || 0), 0);
    const sixMonthLate = sixKeys.reduce((s, k) => s + (fullBucket.get(k)?.lateDays || 0), 0);
    const sixMonthAbsent = sixKeys.reduce((s, k) => s + (fullBucket.get(k)?.absentDays || 0), 0);
    const sixMonthLeave = sixKeys.reduce((s, k) => s + (fullBucket.get(k)?.leaveDays || 0), 0);
    const sixMonthPct = sixMonthWorkingDays > 0 ? Number(((sixMonthAttended / sixMonthWorkingDays) * 100).toFixed(1)) : 0;
    const prevSixW = prevSixKeys.reduce((s, k) => s + (fullBucket.get(k)?.workingDays || 0), 0);
    const prevSixA = prevSixKeys.reduce((s, k) => s + (fullBucket.get(k)?.attendedDays || 0), 0);
    const prevSixPct = prevSixW > 0 ? (prevSixA / prevSixW) * 100 : sixMonthPct;

    const yearWorking = yearMonths.reduce((s, m) => s + m.workingDays, 0);
    const yearAttended = yearMonths.reduce((s, m) => s + m.attendedDays, 0);
    const yearPresent = yearMonths.reduce((s, m) => s + m.presentDays, 0);
    const yearLate = yearMonths.reduce((s, m) => s + m.lateDays, 0);
    const yearAbsent = yearMonths.reduce((s, m) => s + m.absentDays, 0);
    const yearLeave = yearMonths.reduce((s, m) => s + m.leaveDays, 0);
    const yearPct = yearWorking > 0 ? Number(((yearAttended / yearWorking) * 100).toFixed(1)) : 0;

    const useYearFiltered = !customRange && yearFilter !== 'ALL';
    const totalWorkingDays = customRange ? aggWorkingRange : (useYearFiltered ? yearWorking : allAggMonths.reduce((s, m) => s + m.workingDays, 0));
    const totalAttended = customRange ? aggAttendedRange : (useYearFiltered ? yearAttended : allAggMonths.reduce((s, m) => s + m.attendedDays, 0));
    const totalPresent = customRange ? aggPresentRange : (useYearFiltered ? yearPresent : allAggMonths.reduce((s, m) => s + m.presentDays, 0));
    const totalLate = customRange ? aggLateRange : (useYearFiltered ? yearLate : allAggMonths.reduce((s, m) => s + m.lateDays, 0));
    const totalAbsent = customRange ? aggAbsentRange : (useYearFiltered ? yearAbsent : allAggMonths.reduce((s, m) => s + m.absentDays, 0));
    const totalLeave = customRange ? aggLeaveRange : (useYearFiltered ? yearLeave : allAggMonths.reduce((s, m) => s + m.leaveDays, 0));
    const overallPct = totalWorkingDays > 0 ? Number(((totalAttended / totalWorkingDays) * 100).toFixed(1)) : 0;
    const presentPct = totalWorkingDays > 0 ? Number(((totalAttended / totalWorkingDays) * 100).toFixed(1)) : 0;
    const absentPct = totalWorkingDays > 0 ? Number(((totalAbsent / totalWorkingDays) * 100).toFixed(1)) : 0;
    const leavePct = totalWorkingDays > 0 ? Number(((totalLeave / totalWorkingDays) * 100).toFixed(1)) : 0;

    const presentTodayCount = list.filter((a) => a.todayLiveEntry?.status === 'Present' || a.todayLiveEntry?.status === 'Late').length;

    return {
      isAggregate: true,
      title: this.categoryLabel(this.categoryFilter()),
      code: `${list.length} Members`,
      category: 'student' as AttendanceMemberCategory,
      subLabel: this.activeBranchLabel(),
      sectionOrDept: `${presentTodayCount}/${list.length} checked in today`,
      rfidOrTag: `${list.length} Active Profiles`,
      memberCount: list.length,
      totalWorkingDays,
      totalPresent,
      totalLate,
      totalAbsent,
      totalLeave,
      totalAttended,
      overallPct,
      presentPct,
      absentPct,
      leavePct,
      sixMonthWorkingDays,
      sixMonthAttended,
      sixMonthPresent,
      sixMonthLate,
      sixMonthAbsent,
      sixMonthLeave,
      sixMonthPct,
      sixMonthTrendDelta: Number((sixMonthPct - prevSixPct).toFixed(1)),
      yearWorking,
      yearAttended,
      yearPresent,
      yearLate,
      yearAbsent,
      yearLeave,
      yearPct,
      minMonth: minM,
      maxMonth: maxM,
      longestStreakDays: customRange ? maxRangeStreak : Math.max(...list.map((a) => a.longestStreakDays), 0),
      avgCheckInTime: list[0]?.avgCheckInTime || '07:52 AM',
      todayLiveEntry: list[0]?.todayLiveEntry || null
    };
  });

  readonly monthlyRowsAllYears = computed<AttendanceMonthSummary[]>(() => {
    const single = this.selectedMemberAnalytics();
    const customRange = this.hasCustomDateRange();
    const rangeMap = this.memberRangeBreakdownMap();

    if (single) {
      const rb = customRange ? rangeMap.get(`${single.member.category}:${single.member.id}`) || null : null;
      return rb ? rb.monthlySummaries : single.monthlySummaries;
    }

    const bucket = new Map<string, AttendanceMonthSummary>();
    for (const a of this.memberAnalyticsList()) {
      const rb = customRange ? rangeMap.get(`${a.member.category}:${a.member.id}`) || null : null;
      const sourceMonths = rb ? rb.monthlySummaries : a.monthlySummaries;
      for (const m of sourceMonths) {
        const cur = bucket.get(m.monthKey);
        if (!cur) {
          bucket.set(m.monthKey, { ...m, key: `agg-${m.monthKey}` });
        } else {
          cur.workingDays += m.workingDays;
          cur.presentDays += m.presentDays;
          cur.lateDays += m.lateDays;
          cur.absentDays += m.absentDays;
          cur.leaveDays += m.leaveDays;
          cur.attendedDays += m.attendedDays;
        }
      }
    }
    return Array.from(bucket.values())
      .map((b) => {
        const pct = b.workingDays > 0 ? Number(((b.attendedDays / b.workingDays) * 100).toFixed(1)) : 0;
        const statusBand: AttendanceMonthSummary['statusBand'] =
          pct >= 95 ? 'Exemplary' : (pct >= 88 ? 'Good' : (pct >= 78 ? 'Watch' : 'Low'));
        return { ...b, attendancePct: pct, statusBand };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  });

  readonly monthlyRows = computed<AttendanceMonthSummary[]>(() => {
    const yearFilter = this.selectedYearFilter();
    let list = this.monthlyRowsAllYears();

    if (this.activeView() === 'six_months') {
      list = list.slice(0, 6);
    } else if (yearFilter !== 'ALL') {
      list = list.filter((m) => String(m.year) === yearFilter);
    }

    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.monthLabel.toLowerCase().includes(q) ||
        m.statusBand.toLowerCase().includes(q) ||
        String(m.year).includes(q)
    );
  });

  readonly yearlyRows = computed<AttendanceYearSummary[]>(() => {
    const single = this.selectedMemberAnalytics();
    const customRange = this.hasCustomDateRange();
    if (single && !customRange) return single.yearlySummaries;

    const bucket = new Map<number, { workingDays: number; presentDays: number; lateDays: number; absentDays: number; leaveDays: number; attendedDays: number }>();
    const monthByYear = new Map<number, AttendanceMonthSummary[]>();

    for (const m of this.monthlyRowsAllYears()) {
      const arr = monthByYear.get(m.year) || [];
      arr.push(m);
      monthByYear.set(m.year, arr);
      const cur = bucket.get(m.year) || { workingDays: 0, presentDays: 0, lateDays: 0, absentDays: 0, leaveDays: 0, attendedDays: 0 };
      cur.workingDays += m.workingDays;
      cur.presentDays += m.presentDays;
      cur.lateDays += m.lateDays;
      cur.absentDays += m.absentDays;
      cur.leaveDays += m.leaveDays;
      cur.attendedDays += m.attendedDays;
      bucket.set(m.year, cur);
    }

    return Array.from(bucket.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, sums]) => {
        const ms = monthByYear.get(year) || [];
        let best = ms[0] || null;
        let worst = ms[0] || null;
        for (const m of ms) {
          if (best && m.attendancePct > best.attendancePct) best = m;
          if (worst && m.attendancePct < worst.attendancePct) worst = m;
        }
        return {
          year,
          workingDays: sums.workingDays,
          presentDays: sums.presentDays,
          lateDays: sums.lateDays,
          absentDays: sums.absentDays,
          leaveDays: sums.leaveDays,
          attendedDays: sums.attendedDays,
          attendancePct: sums.workingDays > 0 ? Number(((sums.attendedDays / sums.workingDays) * 100).toFixed(1)) : 0,
          bestMonthLabel: best ? best.monthLabel : String(year),
          bestMonthPct: best ? best.attendancePct : 0,
          worstMonthLabel: worst ? worst.monthLabel : String(year),
          worstMonthPct: worst ? worst.attendancePct : 0
        };
      });
  });

  readonly dailyLogBaseRows = computed<AttendanceDailyLogEntry[]>(() => {
    const single = this.selectedMemberAnalytics();
    const statusFilter = this.dailyStatusFilter();
    const yearFilter = this.selectedYearFilter();
    const from = this.effectiveFromIso();
    const to = this.effectiveToIso();
    const q = this.searchQuery().trim().toLowerCase();

    const matchesQueryAndStatus = (r: AttendanceDailyLogEntry) => {
      if (yearFilter !== 'ALL' && String(r.year) !== yearFilter) return false;
      if (from && r.dateIso < from) return false;
      if (to && r.dateIso > to) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.displayDate.toLowerCase().includes(q) ||
        r.dayName.toLowerCase().includes(q) ||
        r.memberName.toLowerCase().includes(q) ||
        r.memberCode.toLowerCase().includes(q) ||
        r.gateTerminal.toLowerCase().includes(q) ||
        r.verificationMethod.toLowerCase().includes(q) ||
        r.verifiedBy.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    };

    if (single) {
      // Allow browsing the full multi-year range statement in single-member mode
      return single.dailyLogs.filter(matchesQueryAndStatus).slice(0, 1000);
    }

    // Aggregate mode: filter by date range & criteria BEFORE slicing per member so past years / custom ranges never return empty!
    const combined: AttendanceDailyLogEntry[] = [];
    for (const a of this.memberAnalyticsList()) {
      let addedForMember = 0;
      for (const r of a.dailyLogs) {
        if (!matchesQueryAndStatus(r)) continue;
        combined.push(r);
        addedForMember++;
        if (addedForMember >= 25) break;
      }
    }
    return combined
      .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
      .slice(0, 500);
  });

  readonly methodBreakdown = computed(() => {
    const base = this.dailyLogBaseRows();
    let face = 0;
    let fingerprint = 0;
    let card = 0;
    let manual = 0;
    for (const r of base) {
      if (r.methodChannel === 'face') face++;
      else if (r.methodChannel === 'fingerprint') fingerprint++;
      else if (r.methodChannel === 'card') card++;
      else manual++;
    }
    return {
      total: base.length,
      face,
      fingerprint,
      card,
      manual
    };
  });

  readonly dailyLogRows = computed<AttendanceDailyLogEntry[]>(() => {
    const mf = this.methodFilter();
    const base = this.dailyLogBaseRows();
    if (mf === 'ALL') return base;
    return base.filter((r) => r.methodChannel === mf);
  });

  readonly filteredMemberMatrix = computed<AttendanceMemberAnalytics[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.memberAnalyticsList().filter((a) => {
      if (!q) return true;
      return (
        a.member.name.toLowerCase().includes(q) ||
        a.member.code.toLowerCase().includes(q) ||
        a.member.subLabel.toLowerCase().includes(q) ||
        a.member.category.toLowerCase().includes(q)
      );
    });
  });

  // Pagination Computeds
  readonly totalRowsCount = computed<number>(() => {
    const v = this.activeView();
    if (v === 'daily') return this.dailyLogRows().length;
    if (v === 'yearly') return this.yearlyRows().length;
    if (v === 'members') return this.filteredMemberMatrix().length;
    return this.monthlyRows().length;
  });

  readonly totalPages = computed<number>(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.totalRowsCount() / size));
  });

  readonly safeCurrentPage = computed<number>(() => {
    return Math.min(Math.max(1, this.currentPage()), this.totalPages());
  });

  readonly pageStartItem = computed<number>(() => {
    const total = this.totalRowsCount();
    if (total === 0) return 0;
    return (this.safeCurrentPage() - 1) * this.pageSize() + 1;
  });

  readonly pageEndItem = computed<number>(() => {
    return Math.min(this.totalRowsCount(), this.safeCurrentPage() * this.pageSize());
  });

  readonly visiblePageTokens = computed<PageToken[]>(() => {
    const total = this.totalPages();
    const cur = this.safeCurrentPage();
    const tokens: PageToken[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        tokens.push({ kind: 'page', page: i, label: String(i) });
      }
      return tokens;
    }

    tokens.push({ kind: 'page', page: 1, label: '1' });
    if (cur > 3) {
      tokens.push({ kind: 'ellipsis', id: 'left' });
    }
    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);
    for (let i = start; i <= end; i++) {
      tokens.push({ kind: 'page', page: i, label: String(i) });
    }
    if (cur < total - 2) {
      tokens.push({ kind: 'ellipsis', id: 'right' });
    }
    tokens.push({ kind: 'page', page: total, label: String(total) });
    return tokens;
  });

  readonly pagedDailyLogRows = computed<AttendanceDailyLogEntry[]>(() => {
    const start = (this.safeCurrentPage() - 1) * this.pageSize();
    return this.dailyLogRows().slice(start, start + this.pageSize());
  });

  readonly pagedMonthlyRows = computed<AttendanceMonthSummary[]>(() => {
    const start = (this.safeCurrentPage() - 1) * this.pageSize();
    return this.monthlyRows().slice(start, start + this.pageSize());
  });

  readonly pagedYearlyRows = computed<AttendanceYearSummary[]>(() => {
    const start = (this.safeCurrentPage() - 1) * this.pageSize();
    return this.yearlyRows().slice(start, start + this.pageSize());
  });

  readonly pagedMemberMatrix = computed<AttendanceMemberAnalytics[]>(() => {
    const start = (this.safeCurrentPage() - 1) * this.pageSize();
    return this.filteredMemberMatrix().slice(start, start + this.pageSize());
  });

  setView(view: AttendanceAnalyticsViewTab): void {
    this.activeView.set(view);
    this.currentPage.set(1);
  }

  setYearFilter(year: string): void {
    this.selectedYearFilter.set(year);
    if (year !== 'ALL') {
      this.dateFrom.set('');
      this.dateTo.set('');
      this.rangePreset.set('all');
    }
    this.currentPage.set(1);
  }

  setDateFrom(val: string): void {
    this.dateFrom.set(String(val || '').trim());
    this.selectedYearFilter.set('ALL');
    this.rangePreset.set(this.dateFrom() || this.dateTo() ? 'custom' : 'all');
    this.currentPage.set(1);
  }

  setDateTo(val: string): void {
    this.dateTo.set(String(val || '').trim());
    this.selectedYearFilter.set('ALL');
    this.rangePreset.set(this.dateFrom() || this.dateTo() ? 'custom' : 'all');
    this.currentPage.set(1);
  }

  applyRangePreset(preset: Exclude<RangePresetKind, 'custom'>): void {
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    this.rangePreset.set(preset);
    this.selectedYearFilter.set('ALL');

    if (preset === 'all') {
      this.dateFrom.set('');
      this.dateTo.set('');
    } else if (preset === 'this_month') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      this.dateFrom.set(`${y}-${m}-01`);
      this.dateTo.set(todayIso);
    } else if (preset === 'last_6m') {
      const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      this.dateFrom.set(`${y}-${m}-01`);
      this.dateTo.set(todayIso);
    } else if (preset === 'this_year') {
      this.dateFrom.set(`${this.currentYearNum}-01-01`);
      this.dateTo.set(todayIso);
    } else if (preset === 'last_year') {
      this.dateFrom.set(`${this.lastYearNum}-01-01`);
      this.dateTo.set(`${this.lastYearNum}-12-31`);
    } else if (preset === 'prev_2_year') {
      this.dateFrom.set(`${this.prevTwoYearNum}-01-01`);
      this.dateTo.set(`${this.prevTwoYearNum}-12-31`);
    }
    this.currentPage.set(1);
  }

  clearDateRange(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.rangePreset.set('all');
    this.currentPage.set(1);
  }

  memberEffectiveStats(a: AttendanceMemberAnalytics) {
    if (this.hasCustomDateRange()) {
      const rb = this.memberRangeBreakdownMap().get(`${a.member.category}:${a.member.id}`);
      if (rb) {
        return {
          overallPct: rb.attendancePct,
          attendedDays: rb.attendedDays,
          workingDays: rb.workingDays,
          minMonth: rb.minMonth,
          maxMonth: rb.maxMonth
        };
      }
    }
    return {
      overallPct: a.overallPct,
      attendedDays: a.totalAttended,
      workingDays: a.totalWorkingDays,
      minMonth: a.minMonth,
      maxMonth: a.maxMonth
    };
  }

  setStatusFilter(status: 'ALL' | 'Present' | 'Late' | 'Absent' | 'On Leave'): void {
    this.dailyStatusFilter.set(status);
    this.currentPage.set(1);
  }

  setMethodFilter(method: VerificationMethodFilter): void {
    this.methodFilter.set(method);
    this.currentPage.set(1);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  setPageSize(raw: unknown): void {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      this.pageSize.set(n);
      this.currentPage.set(1);
    }
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    this.currentPage.set(clamped);
  }

  prevPage(): void {
    if (this.safeCurrentPage() > 1) {
      this.currentPage.set(this.safeCurrentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.safeCurrentPage() < this.totalPages()) {
      this.currentPage.set(this.safeCurrentPage() + 1);
    }
  }

  resetTableFilters(): void {
    this.searchQuery.set('');
    this.selectedYearFilter.set('ALL');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.rangePreset.set('all');
    this.dailyStatusFilter.set('ALL');
    this.methodFilter.set('ALL');
    this.currentPage.set(1);
  }

  setCategory(cat: AnalyticsCategoryFilter): void {
    this.categoryFilter.set(cat);
    this.selectedMemberKey.set('aggregate');
    this.currentPage.set(1);
  }

  setGradeFilter(grade: string): void {
    this.gradeFilter.set(grade);
    this.currentPage.set(1);
  }

  setSelectedMember(key: string): void {
    this.selectedMemberKey.set(key);
    this.currentPage.set(1);
  }

  inspectMember(a: AttendanceMemberAnalytics): void {
    this.selectedMemberKey.set(`${a.member.category}:${a.member.id}`);
    this.activeView.set('daily');
    this.currentPage.set(1);
  }

  clearSelectedMember(): void {
    if (!this.isSinglePersonPortal()) {
      this.selectedMemberKey.set('aggregate');
      this.currentPage.set(1);
    }
  }

  methodIconName(channel: AttendanceVerificationChannelKind): string {
    if (channel === 'fingerprint') return 'fingerprint';
    if (channel === 'card') return 'credit-card';
    if (channel === 'manual') return 'clipboard-check';
    return 'scan-face';
  }

  methodBadgeClass(channel: AttendanceVerificationChannelKind): string {
    if (channel === 'fingerprint') return 'bg-violet-50 text-violet-700 border-violet-200';
    if (channel === 'card') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (channel === 'manual') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  categoryLabel(cat: AnalyticsCategoryFilter): string {
    if (cat === 'all') return 'All Campus Roles';
    if (cat === 'teacher') return 'Teachers';
    if (cat === 'staff') return 'Campus Staff';
    if (cat === 'principal') return 'Principals';
    return 'Students';
  }

  singleCategoryBadge(cat: AttendanceMemberCategory): string {
    if (cat === 'teacher') return 'Teacher';
    if (cat === 'staff') return 'Staff';
    if (cat === 'principal') return 'Principal';
    return 'Student';
  }

  exportCurrentViewCsv(): void {
    if (!this.canExportReports() || typeof document === 'undefined') return;
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const view = this.activeView();
    let headers: string[] = [];
    let rows: string[][] = [];

    if (view === 'daily') {
      headers = ['Date', 'Day', 'Member', 'ID / Roll', 'Class / Dept', 'Check-In', 'Check-Out', 'Late Audit', 'Verification Method', 'Gate & Verified By', 'Status'];
      rows = this.dailyLogRows().map((r) => [
        r.displayDate, r.dayName, r.memberName, r.memberCode, r.gradeOrDept,
        r.checkInTime, r.checkOutTime, r.lateByLabel, `${r.verificationMethod} (${r.confidenceScore}%)`, `${r.gateTerminal} · ${r.verifiedBy}`, r.status
      ]);
    } else if (view === 'yearly') {
      headers = ['Year', 'Working Days', 'Present', 'Late', 'Absent', 'Approved Leaves', 'Peak Month (Max)', 'Lowest Month (Min)', 'Overall %'];
      rows = this.yearlyRows().map((y) => [
        String(y.year), String(y.workingDays), String(y.presentDays), String(y.lateDays),
        String(y.absentDays), String(y.leaveDays),
        `${y.bestMonthLabel} (${y.bestMonthPct}%)`, `${y.worstMonthLabel} (${y.worstMonthPct}%)`, `${y.attendancePct}%`
      ]);
    } else if (view === 'members') {
      const rangeHeader = this.hasCustomDateRange() ? 'Range Total %' : 'Total %';
      headers = ['ID / Roll', 'Member Name', 'Role', 'Class / Dept', rangeHeader, '6-Month %', 'Min Month', 'Max Month', 'Present / Working'];
      rows = this.filteredMemberMatrix().map((a) => {
        const eff = this.memberEffectiveStats(a);
        return [
          a.member.code, a.member.name, this.singleCategoryBadge(a.member.category), a.member.subLabel,
          `${eff.overallPct}%`, `${a.sixMonthPct}%`,
          eff.minMonth ? `${eff.minMonth.shortLabel} (${eff.minMonth.attendancePct}%)` : '—',
          eff.maxMonth ? `${eff.maxMonth.shortLabel} (${eff.maxMonth.attendancePct}%)` : '—',
          `${eff.attendedDays} / ${eff.workingDays}`
        ];
      });
    } else {
      headers = ['Month & Year', 'Working Days', 'Present', 'Late', 'Absent', 'Approved Leaves', 'Avg Check-In', 'Attendance %', 'Standing'];
      rows = this.monthlyRows().map((m) => [
        m.monthLabel, String(m.workingDays), String(m.presentDays), String(m.lateDays),
        String(m.absentDays), String(m.leaveDays), m.avgCheckInTime, `${m.attendancePct}%`, m.statusBand
      ]);
    }

    const csv = '\uFEFF' + [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = this.hasCustomDateRange()
      ? `${this.effectiveFromIso() || 'start'}_to_${this.effectiveToIso() || 'today'}`
      : this.selectedYearFilter().toLowerCase();
    a.download = `attendance_record_${view}_${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async printCurrentStatement(): Promise<void> {
    if (!this.canExportReports() || typeof document === 'undefined') return;
    const view = this.activeView();
    const summary = this.activeSummary();
    const rangeLabel = this.activeRangeDisplayLabel();
    const tableId =
      view === 'daily'
        ? 'attendance_history_daily_log'
        : view === 'yearly'
          ? 'attendance_history_yearly'
          : view === 'members'
            ? 'attendance_history_members'
            : 'attendance_history_monthly';
    const canonicalTableId = this.tableSchemaService.resolveCanonicalTableId(tableId);
    const branding = this.tableSchemaService.printBranding();

    let headers: string[] = [];
    let rows: string[][] = [];
    let title = `Attendance Record Statement (${rangeLabel})`;

    if (view === 'daily') {
      title = `Daily Attendance Statement (${rangeLabel}) — ${summary?.title || this.schoolName()}`;
      headers = ['Date', 'Member', 'Check-In', 'Check-Out', 'Punctuality', 'Method & Source', 'Gate Terminal', 'Status'];
      rows = this.dailyLogRows().slice(0, 120).map((r) => [
        `${r.displayDate} (${r.dayName.slice(0, 3)})`,
        `${r.memberName} (${r.memberCode})`,
        r.checkInTime,
        r.checkOutTime,
        r.lateByLabel,
        `${r.verificationMethod} (${r.confidenceScore}%)`,
        `${r.gateTerminal} · ${r.verifiedBy}`,
        r.status
      ]);
    } else if (view === 'yearly') {
      title = `Multi-Year Attendance History (${rangeLabel}) — ${summary?.title || this.schoolName()}`;
      headers = ['Year', 'Working', 'Present', 'Late', 'Absent', 'Leave', 'Best Month (Max)', 'Lowest Month (Min)', 'Overall %'];
      rows = this.yearlyRows().map((y) => [
        String(y.year), String(y.workingDays), String(y.presentDays), String(y.lateDays),
        String(y.absentDays), String(y.leaveDays),
        `${y.bestMonthLabel} (${y.bestMonthPct}%)`, `${y.worstMonthLabel} (${y.worstMonthPct}%)`, `${y.attendancePct}%`
      ]);
    } else if (view === 'members') {
      title = `Campus Attendance Record Matrix (${rangeLabel}) — ${this.activeBranchLabel()}`;
      headers = ['ID', 'Member Name', 'Role', this.hasCustomDateRange() ? 'Range %' : 'Total %', '6M %', 'Min Month', 'Max Month', 'Attended / Days'];
      rows = this.filteredMemberMatrix().map((a) => {
        const eff = this.memberEffectiveStats(a);
        return [
          a.member.code, a.member.name, this.singleCategoryBadge(a.member.category),
          `${eff.overallPct}%`, `${a.sixMonthPct}%`,
          eff.minMonth ? `${eff.minMonth.shortLabel} (${eff.minMonth.attendancePct}%)` : '—',
          eff.maxMonth ? `${eff.maxMonth.shortLabel} (${eff.maxMonth.attendancePct}%)` : '—',
          `${eff.attendedDays}/${eff.workingDays}`
        ];
      });
    } else {
      title = `${view === 'six_months' ? '6-Month' : 'Attendance Record'} Statement (${rangeLabel}) — ${summary?.title || this.schoolName()}`;
      headers = ['Month & Year', 'Working', 'Present', 'Late', 'Absent', 'Leave', 'Avg In', 'Rate %', 'Standing'];
      rows = this.monthlyRows().map((m) => [
        m.monthLabel, String(m.workingDays), String(m.presentDays), String(m.lateDays),
        String(m.absentDays), String(m.leaveDays), m.avgCheckInTime, `${m.attendancePct}%`, m.statusBand
      ]);
    }

    const html = buildSchoolStatementA4Html({
      tableId,
      canonicalTableId,
      title,
      subtitle: `Period: ${rangeLabel} · Statement Total: ${summary?.overallPct ?? 0}% (${summary?.totalAttended ?? 0}/${summary?.totalWorkingDays ?? 0}d) · Min: ${summary?.minMonth?.shortLabel || '—'} (${summary?.minMonth?.attendancePct ?? 0}%) · Max: ${summary?.maxMonth?.shortLabel || '—'} (${summary?.maxMonth?.attendancePct ?? 0}%)`,
      roleLabel: this.portalContext().toUpperCase(),
      headers,
      rows,
      totalUnfilteredCount: rows.length,
      criteria: {
        searchQuery: this.searchQuery(),
        fromDate: this.effectiveFromIso() || this.selectedYearFilter(),
        toDate: this.effectiveToIso() || undefined
      },
      branding,
      statementRef: `ATT-STMT-${this.portalContext().toUpperCase()}-${new Date().toISOString().slice(0, 10)}`
    });

    await printHtmlInHiddenFrame(html);
  }

  private mapRawStatus(raw: unknown): 'Present' | 'Late' | 'Absent' | 'On Leave' {
    const s = String(raw || '').trim().toLowerCase();
    if (s.includes('leave')) return 'On Leave';
    if (s === 'late') return 'Late';
    if (s === 'absent') return 'Absent';
    return 'Present';
  }
}
