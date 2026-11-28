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
  AttendanceYearSummary,
  ExtraDailyGateLogInput,
  buildMemberAttendanceAnalytics,
  parsePercentageValue
} from '../../utils/school-attendance-history.util';
import { SchoolTableDirective } from '../../directives/school-table.directive';
import { SchoolTableSchemaService } from '../../services/school-table-schema.service';
import { buildSchoolStatementA4Html } from '../../utils/school-statement-print.util';
import { printHtmlInHiddenFrame } from '../../utils/thermal-print.util';

export type AttendanceAnalyticsPortalContext = AttendancePortalContext | 'parent';
export type AttendanceAnalyticsViewTab = 'daily' | 'monthly' | 'six_months' | 'yearly' | 'members';
export type AnalyticsCategoryFilter = 'all' | AttendanceMemberCategory;

@Component({
  selector: 'app-school-attendance-analytics',
  imports: [CommonModule, LucideAngularModule, SchoolTableDirective],
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

  // Local filter & navigation signals
  activeView = signal<AttendanceAnalyticsViewTab>('monthly');
  categoryFilter = signal<AnalyticsCategoryFilter>('all');
  selectedMemberKey = signal<string>('aggregate');
  selectedYearFilter = signal<string>('ALL');
  dailyStatusFilter = signal<'ALL' | 'Present' | 'Late' | 'Absent' | 'On Leave'>('ALL');
  searchQuery = signal<string>('');
  gradeFilter = signal<string>('All');

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

  readonly availableYears = computed<string[]>(() => {
    const years = new Set<number>();
    for (const a of this.memberAnalyticsList()) {
      for (const y of a.yearlySummaries) years.add(y.year);
    }
    return ['ALL', ...Array.from(years).sort((a, b) => b - a).map(String)];
  });

  // Unified summary KPIs (works for single child/student, selected member, or campus/class aggregate)
  readonly activeSummary = computed(() => {
    const single = this.selectedMemberAnalytics();
    const yearFilter = this.selectedYearFilter();

    if (single) {
      const yearMonths = yearFilter === 'ALL'
        ? single.monthlySummaries
        : single.monthlySummaries.filter((m) => String(m.year) === yearFilter);

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

      return {
        isAggregate: false,
        title: single.member.name,
        code: single.member.code,
        category: single.member.category,
        subLabel: single.member.subLabel,
        sectionOrDept: single.member.sectionOrDept,
        rfidOrTag: single.member.rfidOrTag,
        memberCount: 1,
        totalWorkingDays: single.totalWorkingDays,
        totalPresent: single.totalPresent,
        totalLate: single.totalLate,
        totalAbsent: single.totalAbsent,
        totalLeave: single.totalLeave,
        totalAttended: single.totalAttended,
        overallPct: single.overallPct,
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
        minMonth: minM || single.minMonth,
        maxMonth: maxM || single.maxMonth,
        longestStreakDays: single.longestStreakDays,
        avgCheckInTime: single.avgCheckInTime,
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

    for (const a of list) {
      for (const m of a.monthlySummaries) {
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

    const totalWorkingDays = allAggMonths.reduce((s, m) => s + m.workingDays, 0);
    const totalAttended = allAggMonths.reduce((s, m) => s + m.attendedDays, 0);
    const totalPresent = allAggMonths.reduce((s, m) => s + m.presentDays, 0);
    const totalLate = allAggMonths.reduce((s, m) => s + m.lateDays, 0);
    const totalAbsent = allAggMonths.reduce((s, m) => s + m.absentDays, 0);
    const totalLeave = allAggMonths.reduce((s, m) => s + m.leaveDays, 0);
    const overallPct = totalWorkingDays > 0 ? Number(((totalAttended / totalWorkingDays) * 100).toFixed(1)) : 0;

    const sixM = allAggMonths.slice(0, 6);
    const prevSixM = allAggMonths.slice(6, 12);
    const sixMonthWorkingDays = sixM.reduce((s, m) => s + m.workingDays, 0);
    const sixMonthAttended = sixM.reduce((s, m) => s + m.attendedDays, 0);
    const sixMonthPresent = sixM.reduce((s, m) => s + m.presentDays, 0);
    const sixMonthLate = sixM.reduce((s, m) => s + m.lateDays, 0);
    const sixMonthAbsent = sixM.reduce((s, m) => s + m.absentDays, 0);
    const sixMonthLeave = sixM.reduce((s, m) => s + m.leaveDays, 0);
    const sixMonthPct = sixMonthWorkingDays > 0 ? Number(((sixMonthAttended / sixMonthWorkingDays) * 100).toFixed(1)) : 0;
    const prevSixW = prevSixM.reduce((s, m) => s + m.workingDays, 0);
    const prevSixA = prevSixM.reduce((s, m) => s + m.attendedDays, 0);
    const prevSixPct = prevSixW > 0 ? (prevSixA / prevSixW) * 100 : sixMonthPct;

    const yearWorking = yearMonths.reduce((s, m) => s + m.workingDays, 0);
    const yearAttended = yearMonths.reduce((s, m) => s + m.attendedDays, 0);
    const yearPresent = yearMonths.reduce((s, m) => s + m.presentDays, 0);
    const yearLate = yearMonths.reduce((s, m) => s + m.lateDays, 0);
    const yearAbsent = yearMonths.reduce((s, m) => s + m.absentDays, 0);
    const yearLeave = yearMonths.reduce((s, m) => s + m.leaveDays, 0);
    const yearPct = yearWorking > 0 ? Number(((yearAttended / yearWorking) * 100).toFixed(1)) : 0;

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
      longestStreakDays: Math.max(...list.map((a) => a.longestStreakDays), 0),
      avgCheckInTime: list[0]?.avgCheckInTime || '07:52 AM',
      todayLiveEntry: list[0]?.todayLiveEntry || null
    };
  });

  readonly monthlyRows = computed<AttendanceMonthSummary[]>(() => {
    const single = this.selectedMemberAnalytics();
    const yearFilter = this.selectedYearFilter();
    let list: AttendanceMonthSummary[] = [];

    if (single) {
      list = single.monthlySummaries;
    } else {
      const bucket = new Map<string, AttendanceMonthSummary>();
      for (const a of this.memberAnalyticsList()) {
        for (const m of a.monthlySummaries) {
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
      list = Array.from(bucket.values())
        .map((b) => {
          const pct = b.workingDays > 0 ? Number(((b.attendedDays / b.workingDays) * 100).toFixed(1)) : 0;
          const statusBand: AttendanceMonthSummary['statusBand'] =
            pct >= 95 ? 'Exemplary' : (pct >= 88 ? 'Good' : (pct >= 78 ? 'Watch' : 'Low'));
          return { ...b, attendancePct: pct, statusBand };
        })
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    }

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

  readonly chartMonthlyBars = computed<AttendanceMonthSummary[]>(() => {
    return [...this.monthlyRows()].slice(0, 12).reverse();
  });

  readonly yearlyRows = computed<AttendanceYearSummary[]>(() => {
    const single = this.selectedMemberAnalytics();
    if (single) return single.yearlySummaries;

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

  readonly monthlyRowsAllYears = computed<AttendanceMonthSummary[]>(() => {
    const single = this.selectedMemberAnalytics();
    if (single) return single.monthlySummaries;
    const bucket = new Map<string, AttendanceMonthSummary>();
    for (const a of this.memberAnalyticsList()) {
      for (const m of a.monthlySummaries) {
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
      .map((b) => ({
        ...b,
        attendancePct: b.workingDays > 0 ? Number(((b.attendedDays / b.workingDays) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  });

  readonly dailyLogRows = computed<AttendanceDailyLogEntry[]>(() => {
    const single = this.selectedMemberAnalytics();
    const statusFilter = this.dailyStatusFilter();
    const yearFilter = this.selectedYearFilter();
    const q = this.searchQuery().trim().toLowerCase();

    let allRows: AttendanceDailyLogEntry[] = [];
    if (single) {
      allRows = single.dailyLogs;
    } else {
      // Aggregate mode: combine recent gate punches across members
      allRows = this.memberAnalyticsList()
        .flatMap((a) => a.dailyLogs.slice(0, 10))
        .sort((a, b) => b.dateIso.localeCompare(a.dateIso));
    }

    return allRows
      .filter((r) => {
        if (yearFilter !== 'ALL' && String(r.year) !== yearFilter) return false;
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
        if (!q) return true;
        return (
          r.displayDate.toLowerCase().includes(q) ||
          r.dayName.toLowerCase().includes(q) ||
          r.memberName.toLowerCase().includes(q) ||
          r.memberCode.toLowerCase().includes(q) ||
          r.gateTerminal.toLowerCase().includes(q) ||
          r.verificationMethod.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      })
      .slice(0, 120);
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

  setCategory(cat: AnalyticsCategoryFilter): void {
    this.categoryFilter.set(cat);
    this.selectedMemberKey.set('aggregate');
  }

  inspectMember(a: AttendanceMemberAnalytics): void {
    this.selectedMemberKey.set(`${a.member.category}:${a.member.id}`);
    this.activeView.set('monthly');
  }

  clearSelectedMember(): void {
    if (!this.isSinglePersonPortal()) {
      this.selectedMemberKey.set('aggregate');
    }
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
      headers = ['Date', 'Day', 'Member', 'ID / Roll', 'Class / Dept', 'Check-In', 'Check-Out', 'Late Audit', 'Gate & Method', 'Status'];
      rows = this.dailyLogRows().map((r) => [
        r.displayDate, r.dayName, r.memberName, r.memberCode, r.gradeOrDept,
        r.checkInTime, r.checkOutTime, r.lateByLabel, `${r.gateTerminal} (${r.verificationMethod})`, r.status
      ]);
    } else if (view === 'yearly') {
      headers = ['Year', 'Working Days', 'Present', 'Late', 'Absent', 'Approved Leaves', 'Peak Month (Max)', 'Lowest Month (Min)', 'Overall %'];
      rows = this.yearlyRows().map((y) => [
        String(y.year), String(y.workingDays), String(y.presentDays), String(y.lateDays),
        String(y.absentDays), String(y.leaveDays),
        `${y.bestMonthLabel} (${y.bestMonthPct}%)`, `${y.worstMonthLabel} (${y.worstMonthPct}%)`, `${y.attendancePct}%`
      ]);
    } else if (view === 'members') {
      headers = ['ID / Roll', 'Member Name', 'Role', 'Class / Dept', 'Total %', '6-Month %', 'Min Month', 'Max Month', 'Present / Working'];
      rows = this.filteredMemberMatrix().map((a) => [
        a.member.code, a.member.name, this.singleCategoryBadge(a.member.category), a.member.subLabel,
        `${a.overallPct}%`, `${a.sixMonthPct}%`,
        a.minMonth ? `${a.minMonth.shortLabel} (${a.minMonth.attendancePct}%)` : '—',
        a.maxMonth ? `${a.maxMonth.shortLabel} (${a.maxMonth.attendancePct}%)` : '—',
        `${a.totalAttended} / ${a.totalWorkingDays}`
      ]);
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
    a.download = `attendance_${view}_${this.selectedYearFilter().toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async printCurrentStatement(): Promise<void> {
    if (!this.canExportReports() || typeof document === 'undefined') return;
    const view = this.activeView();
    const summary = this.activeSummary();
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
    let title = 'Monthly Attendance Record & Historical Statement';

    if (view === 'daily') {
      title = `Daily Gate Attendance Log — ${summary?.title || this.schoolName()}`;
      headers = ['Date', 'Member', 'Check-In', 'Check-Out', 'Punctuality', 'Gate Terminal', 'Status'];
      rows = this.dailyLogRows().slice(0, 60).map((r) => [
        `${r.displayDate} (${r.dayName.slice(0, 3)})`,
        `${r.memberName} (${r.memberCode})`,
        r.checkInTime,
        r.checkOutTime,
        r.lateByLabel,
        r.gateTerminal,
        r.status
      ]);
    } else if (view === 'yearly') {
      title = `Multi-Year Attendance History — ${summary?.title || this.schoolName()}`;
      headers = ['Year', 'Working', 'Present', 'Late', 'Absent', 'Leave', 'Best Month (Max)', 'Lowest Month (Min)', 'Overall %'];
      rows = this.yearlyRows().map((y) => [
        String(y.year), String(y.workingDays), String(y.presentDays), String(y.lateDays),
        String(y.absentDays), String(y.leaveDays),
        `${y.bestMonthLabel} (${y.bestMonthPct}%)`, `${y.worstMonthLabel} (${y.worstMonthPct}%)`, `${y.attendancePct}%`
      ]);
    } else if (view === 'members') {
      title = `Campus Attendance Analytics Matrix — ${this.activeBranchLabel()}`;
      headers = ['ID', 'Member Name', 'Role', 'Total %', '6M %', 'Min Month', 'Max Month', 'Attended / Days'];
      rows = this.filteredMemberMatrix().map((a) => [
        a.member.code, a.member.name, this.singleCategoryBadge(a.member.category),
        `${a.overallPct}%`, `${a.sixMonthPct}%`,
        a.minMonth ? `${a.minMonth.shortLabel} (${a.minMonth.attendancePct}%)` : '—',
        a.maxMonth ? `${a.maxMonth.shortLabel} (${a.maxMonth.attendancePct}%)` : '—',
        `${a.totalAttended}/${a.totalWorkingDays}`
      ]);
    } else {
      title = `${view === 'six_months' ? '6-Month' : 'Monthly'} Attendance Record — ${summary?.title || this.schoolName()}`;
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
      subtitle: `Total: ${summary?.overallPct ?? 0}% · 6-Month: ${summary?.sixMonthPct ?? 0}% · Min: ${summary?.minMonth?.shortLabel || '—'} (${summary?.minMonth?.attendancePct ?? 0}%) · Max: ${summary?.maxMonth?.shortLabel || '—'} (${summary?.maxMonth?.attendancePct ?? 0}%)`,
      roleLabel: this.portalContext().toUpperCase(),
      headers,
      rows,
      totalUnfilteredCount: rows.length,
      criteria: {
        searchQuery: this.searchQuery(),
        fromDate: this.selectedYearFilter()
      },
      branding,
      statementRef: `ATT-HIST-${this.portalContext().toUpperCase()}-${new Date().toISOString().slice(0, 10)}`
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
