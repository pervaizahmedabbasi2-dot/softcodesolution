import {
  AttendanceMemberCategory,
  FaceVerificationLogRecord,
  OwnerAttendancePolicy
} from '../models/school-attendance.models';

export interface AttendanceDailyLogEntry {
  key: string;
  dateIso: string;
  displayDate: string;
  dayName: string;
  year: number;
  monthKey: string;
  monthLabel: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  memberCategory: AttendanceMemberCategory;
  gradeOrDept: string;
  checkInTime: string;
  checkOutTime: string;
  scheduledStartTime: string;
  durationLabel: string;
  lateByLabel: string;
  gateTerminal: string;
  verificationMethod: string;
  confidenceScore: number;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  isLiveLog: boolean;
}

export interface AttendanceMonthSummary {
  key: string;
  year: number;
  monthIndex: number; // 0-11
  monthKey: string; // YYYY-MM
  monthLabel: string;
  shortLabel: string;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  attendedDays: number;
  attendancePct: number;
  avgCheckInTime: string;
  earliestCheckIn: string;
  latestCheckIn: string;
  statusBand: 'Exemplary' | 'Good' | 'Watch' | 'Low';
}

export interface AttendanceYearSummary {
  year: number;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  attendedDays: number;
  attendancePct: number;
  bestMonthLabel: string;
  bestMonthPct: number;
  worstMonthLabel: string;
  worstMonthPct: number;
}

export interface AttendanceNormalizedMember {
  id: string;
  code: string;
  name: string;
  category: AttendanceMemberCategory;
  subLabel: string;
  sectionOrDept: string;
  rfidOrTag: string;
  baselineRatePct: number;
  todayStatus: 'Present' | 'Late' | 'Absent' | 'On Leave';
  todayCheckIn?: string;
  todayCheckOut?: string;
  todayGate?: string;
}

export interface AttendanceMemberAnalytics {
  member: AttendanceNormalizedMember;
  totalWorkingDays: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalLeave: number;
  totalAttended: number;
  overallPct: number;
  sixMonthWorkingDays: number;
  sixMonthAttended: number;
  sixMonthPresent: number;
  sixMonthLate: number;
  sixMonthAbsent: number;
  sixMonthLeave: number;
  sixMonthPct: number;
  sixMonthTrendDelta: number;
  minMonth: AttendanceMonthSummary | null;
  maxMonth: AttendanceMonthSummary | null;
  longestStreakDays: number;
  avgCheckInTime: string;
  todayLiveEntry: AttendanceDailyLogEntry | null;
  dailyLogs: AttendanceDailyLogEntry[];
  monthlySummaries: AttendanceMonthSummary[];
  sixMonthList: AttendanceMonthSummary[];
  yearlySummaries: AttendanceYearSummary[];
}

export interface ExtraDailyGateLogInput {
  date: string;
  day?: string;
  checkIn?: string;
  checkOut?: string;
  gate?: string;
  status?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function seededUnit(seed: number, salt: number): number {
  const x = Math.sin(seed * 0.001 + salt * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function parsePercentageValue(raw: unknown, fallback = 95.5): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.min(100, Math.max(0, raw));
  }
  const num = Number(String(raw ?? '').replace(/[^0-9.]/g, ''));
  if (Number.isFinite(num) && num > 0) {
    return Math.min(100, Math.max(0, num));
  }
  return fallback;
}

export function normalizeDateIso(rawDate: string): string {
  const s = String(rawDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString().split('T')[0];
}

export function formatDisplayDate(dateIso: string): string {
  const parts = dateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateIso;
  const [y, m, d] = parts;
  return `${SHORT_MONTHS[(m - 1 + 12) % 12]} ${String(d).padStart(2, '0')}, ${y}`;
}

export function getWeekdayName(dateIso: string): string {
  const parts = dateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 'School Day';
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return WEEKDAY_NAMES[dt.getDay()] || 'School Day';
}

function parseMinutesFromTimeString(raw: string): number | null {
  const m = String(raw || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function formatMinutesAs12h(totalMins: number): string {
  const clamped = ((Math.round(totalMins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const ap = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
}

function formatDurationMinutes(startMins: number | null, endMins: number | null): string {
  if (startMins === null || endMins === null) return '—';
  const diff = Math.max(0, endMins - startMins);
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function normalizeStatusValue(raw: unknown): 'Present' | 'Late' | 'Absent' | 'On Leave' {
  const s = String(raw || '').trim().toLowerCase();
  if (s.includes('leave')) return 'On Leave';
  if (s === 'late') return 'Late';
  if (s === 'absent') return 'Absent';
  if (s === 'present' || s === 'active' || s.includes('campus') || s.includes('checked')) return 'Present';
  return 'Present';
}

function computeStatusBand(pct: number): 'Exemplary' | 'Good' | 'Watch' | 'Low' {
  if (pct >= 95) return 'Exemplary';
  if (pct >= 88) return 'Good';
  if (pct >= 78) return 'Watch';
  return 'Low';
}

export function buildMemberAttendanceAnalytics(
  member: AttendanceNormalizedMember,
  verificationLogs: FaceVerificationLogRecord[],
  extraDailyLogs: ExtraDailyGateLogInput[],
  policy: OwnerAttendancePolicy,
  anchorDateIso?: string
): AttendanceMemberAnalytics {
  const now = anchorDateIso ? new Date(`${anchorDateIso}T10:00:00`) : new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const scheduledStart = policy.scheduledStartTime || '08:00';
  const startMins = parseMinutesFromTimeString(scheduledStart) ?? 480;
  const seed = hashSeed(`${member.category}:${member.id}:${member.code}`);

  // 1. Collect live logs belonging to this member
  const memberLiveMap = new Map<string, AttendanceDailyLogEntry>();
  for (const log of verificationLogs || []) {
    if (log.status === 'Rejected') continue;
    if (log.memberCategory !== member.category) continue;
    const idMatch = log.memberId === member.id || (member.code && log.memberCode === member.code);
    if (!idMatch) continue;
    const dateIso = normalizeDateIso(log.date);
    const key = `${dateIso}:${member.category}:${member.id}`;
    const isOut = log.punchType === 'OUT' || String(log.verifiedBy || '').includes('· OUT');
    const timeFormatted = log.timestamp || '08:00 AM';
    const existing = memberLiveMap.get(key);
    const year = Number(dateIso.slice(0, 4)) || currentYear;
    const monthIdx = Math.max(0, Math.min(11, (Number(dateIso.slice(5, 7)) || (currentMonth + 1)) - 1));
    const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

    if (!existing) {
      const checkInTime = isOut ? '07:50 AM' : timeFormatted;
      const checkOutTime = isOut ? timeFormatted : 'In Campus';
      const inMins = parseMinutesFromTimeString(checkInTime);
      const outMins = isOut ? parseMinutesFromTimeString(checkOutTime) : null;
      memberLiveMap.set(key, {
        key,
        dateIso,
        displayDate: formatDisplayDate(dateIso),
        dayName: getWeekdayName(dateIso),
        year,
        monthKey,
        monthLabel: `${MONTH_NAMES[monthIdx]} ${year}`,
        memberId: member.id,
        memberCode: member.code,
        memberName: member.name,
        memberCategory: member.category,
        gradeOrDept: member.subLabel,
        checkInTime,
        checkOutTime,
        scheduledStartTime: scheduledStart,
        durationLabel: outMins !== null ? formatDurationMinutes(inMins, outMins) : 'On Campus',
        lateByLabel: log.lateByLabel || (log.status === 'Late' ? 'Late Arrival' : 'On Time'),
        gateTerminal: log.gateName || 'Campus Gate 01',
        verificationMethod: log.verificationMode || 'Biometric Camera',
        confidenceScore: Math.round(Number(log.confidenceScore || 98)),
        status: normalizeStatusValue(log.status),
        isLiveLog: true
      });
    } else {
      if (isOut) {
        existing.checkOutTime = timeFormatted;
        existing.durationLabel = formatDurationMinutes(
          parseMinutesFromTimeString(existing.checkInTime),
          parseMinutesFromTimeString(timeFormatted)
        );
      } else {
        existing.checkInTime = timeFormatted;
        if (log.lateByLabel) existing.lateByLabel = log.lateByLabel;
      }
      if (Number(log.confidenceScore || 0) > existing.confidenceScore) {
        existing.confidenceScore = Math.round(Number(log.confidenceScore || 0));
      }
    }
  }

  // Merge extra daily gate logs (used for Student / Parent child gate logs)
  for (const ex of extraDailyLogs || []) {
    const dateIso = normalizeDateIso(ex.date);
    const key = `${dateIso}:${member.category}:${member.id}`;
    if (memberLiveMap.has(key)) continue;
    const year = Number(dateIso.slice(0, 4)) || currentYear;
    const monthIdx = Math.max(0, Math.min(11, (Number(dateIso.slice(5, 7)) || (currentMonth + 1)) - 1));
    const inStr = ex.checkIn || '07:48 AM';
    const outStr = ex.checkOut || '02:15 PM';
    const status = normalizeStatusValue(ex.status || 'Present');
    const inMins = parseMinutesFromTimeString(inStr);
    const outMins = parseMinutesFromTimeString(outStr);
    const diff = inMins !== null ? inMins - startMins : -10;
    const lateByLabel = status === 'Late'
      ? `+${Math.max(1, diff)}m late`
      : (diff < 0 ? `Early ${Math.abs(diff)}m` : 'On Time');

    memberLiveMap.set(key, {
      key,
      dateIso,
      displayDate: formatDisplayDate(dateIso),
      dayName: ex.day || getWeekdayName(dateIso),
      year,
      monthKey: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
      monthLabel: `${MONTH_NAMES[monthIdx]} ${year}`,
      memberId: member.id,
      memberCode: member.code,
      memberName: member.name,
      memberCategory: member.category,
      gradeOrDept: member.subLabel,
      checkInTime: inStr,
      checkOutTime: outStr,
      scheduledStartTime: scheduledStart,
      durationLabel: outMins !== null ? formatDurationMinutes(inMins, outMins) : 'On Campus',
      lateByLabel,
      gateTerminal: ex.gate || member.todayGate || 'Main North Gate (RFID-01)',
      verificationMethod: String(ex.gate || '').toLowerCase().includes('rfid') ? 'RFID Turnstile' : 'Biometric Gate',
      confidenceScore: 99,
      status,
      isLiveLog: true
    });
  }

  // 2. Build 3 academic years of historical monthly summaries (currentYear - 2 .. currentYear)
  const years = [currentYear - 2, currentYear - 1, currentYear];
  const baseTarget = Math.min(99.2, Math.max(76, member.baselineRatePct || 95.5));
  const monthlySummaries: AttendanceMonthSummary[] = [];

  let saltCounter = 1;
  for (const y of years) {
    const maxM = y === currentYear ? currentMonth : 11;
    for (let mIdx = 0; mIdx <= maxM; mIdx++) {
      saltCounter++;
      const monthKey = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
      // Skip summer break peak variations nicely (June/July lighter working days)
      const isSummer = mIdx === 5 || mIdx === 6;
      const workingDays = isSummer
        ? 14 + Math.floor(seededUnit(seed, saltCounter * 3) * 4)
        : 21 + Math.floor(seededUnit(seed, saltCounter * 3) * 3);

      // Realistic month-to-month fluctuation around baseTarget so Min/Max are clearly distinct
      const wave = (seededUnit(seed, saltCounter * 7) - 0.45) * 10.5;
      const seasonalDip = mIdx === 1 || mIdx === 11 ? -2.6 : (mIdx === 9 ? 1.8 : 0);
      const rawPct = Math.min(100, Math.max(72, baseTarget + wave + seasonalDip));

      let attendedDays = Math.min(workingDays, Math.max(0, Math.round((rawPct / 100) * workingDays)));
      const nonAttended = Math.max(0, workingDays - attendedDays);
      const leaveDays = nonAttended > 0 ? Math.min(nonAttended, Math.ceil(nonAttended * 0.55)) : 0;
      const absentDays = Math.max(0, nonAttended - leaveDays);
      const lateShare = seededUnit(seed, saltCounter * 11) * 0.14;
      const lateDays = attendedDays > 0 ? Math.min(attendedDays, Math.round(attendedDays * lateShare)) : 0;
      const presentDays = Math.max(0, attendedDays - lateDays);

      // Re-count any live logs inside this month to make live punches visible
      let liveAdjust = 0;
      for (const entry of memberLiveMap.values()) {
        if (entry.monthKey === monthKey && entry.dateIso === todayIso) {
          liveAdjust = 1;
        }
      }
      if (liveAdjust > 0 && attendedDays === 0) {
        attendedDays = 1;
      }

      const attendancePct = workingDays > 0
        ? Number(((attendedDays / workingDays) * 100).toFixed(1))
        : 100;

      const avgInOffset = Math.round((seededUnit(seed, saltCounter * 17) * 24) - 18); // -18m early to +6m
      const avgCheckInTime = formatMinutesAs12h(startMins + avgInOffset);
      const earliestCheckIn = formatMinutesAs12h(startMins - 22 - Math.floor(seededUnit(seed, saltCounter * 19) * 8));
      const latestCheckIn = formatMinutesAs12h(startMins + (lateDays > 0 ? 18 + Math.floor(seededUnit(seed, saltCounter * 23) * 20) : 6));

      monthlySummaries.push({
        key: `${member.id}-${monthKey}`,
        year: y,
        monthIndex: mIdx,
        monthKey,
        monthLabel: `${MONTH_NAMES[mIdx]} ${y}`,
        shortLabel: `${SHORT_MONTHS[mIdx]} ${String(y).slice(-2)}`,
        workingDays,
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        attendedDays,
        attendancePct,
        avgCheckInTime,
        earliestCheckIn,
        latestCheckIn,
        statusBand: computeStatusBand(attendancePct)
      });
    }
  }

  // Sort monthly summaries newest first for table display
  const monthlyDesc = [...monthlySummaries].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const sixMonthList = monthlyDesc.slice(0, 6);
  const prevSixList = monthlyDesc.slice(6, 12);

  // 3. Compute Yearly Summaries
  const yearlySummaries: AttendanceYearSummary[] = [...years].reverse().map((y) => {
    const monthsInYear = monthlySummaries.filter((m) => m.year === y);
    const workingDays = monthsInYear.reduce((s, m) => s + m.workingDays, 0);
    const presentDays = monthsInYear.reduce((s, m) => s + m.presentDays, 0);
    const lateDays = monthsInYear.reduce((s, m) => s + m.lateDays, 0);
    const absentDays = monthsInYear.reduce((s, m) => s + m.absentDays, 0);
    const leaveDays = monthsInYear.reduce((s, m) => s + m.leaveDays, 0);
    const attendedDays = monthsInYear.reduce((s, m) => s + m.attendedDays, 0);
    const attendancePct = workingDays > 0 ? Number(((attendedDays / workingDays) * 100).toFixed(1)) : 0;

    let best = monthsInYear[0] || null;
    let worst = monthsInYear[0] || null;
    for (const m of monthsInYear) {
      if (best && m.attendancePct > best.attendancePct) best = m;
      if (worst && m.attendancePct < worst.attendancePct) worst = m;
    }

    return {
      year: y,
      workingDays,
      presentDays,
      lateDays,
      absentDays,
      leaveDays,
      attendedDays,
      attendancePct,
      bestMonthLabel: best ? best.monthLabel : `${y}`,
      bestMonthPct: best ? best.attendancePct : 0,
      worstMonthLabel: worst ? worst.monthLabel : `${y}`,
      worstMonthPct: worst ? worst.attendancePct : 0
    };
  });

  // 4. Generate Daily Gate Logs covering recent 45 school days + merged live entries
  const dailyMap = new Map<string, AttendanceDailyLogEntry>(memberLiveMap);
  const gates = [
    member.todayGate || 'Main North Gate (RFID-01)',
    'Junior Wing Gate (RFID-02)',
    'Biometric Camera Kiosk 01'
  ];

  // Walk backwards 75 calendar days (~54 school days) so Daily Gate Log is rich and matches month filters
  for (let offset = 0; offset < 75; offset++) {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const dow = dt.getDay();
    if (dow === 0) continue; // Sunday holiday

    const y = dt.getFullYear();
    const mIdx = dt.getMonth();
    const dNum = dt.getDate();
    const dateIso = `${y}-${String(mIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    const key = `${dateIso}:${member.category}:${member.id}`;
    if (dailyMap.has(key)) continue;

    let status: 'Present' | 'Late' | 'Absent' | 'On Leave';
    if (offset === 0) {
      status = member.todayStatus;
    } else {
      const r = seededUnit(seed, offset * 31 + y + mIdx);
      const absentThresh = Math.max(0.015, (100 - baseTarget) / 100);
      if (r < absentThresh * 0.45) status = 'Absent';
      else if (r < absentThresh) status = 'On Leave';
      else if (r < absentThresh + 0.085) status = 'Late';
      else status = 'Present';
    }

    const inDelta = status === 'Late'
      ? 16 + Math.floor(seededUnit(seed, offset * 13) * 18)
      : -18 + Math.floor(seededUnit(seed, offset * 13) * 18);
    const inMins = startMins + inDelta;
    const isFriday = dow === 5;
    const outMins = isFriday ? (12 * 60 + 35 + Math.floor(seededUnit(seed, offset * 7) * 15)) : (14 * 60 + 10 + Math.floor(seededUnit(seed, offset * 7) * 15));

    const hasPunch = status === 'Present' || status === 'Late';
    const checkInTime = hasPunch
      ? (offset === 0 && member.todayCheckIn ? member.todayCheckIn : formatMinutesAs12h(inMins))
      : '—';
    const checkOutTime = hasPunch
      ? (offset === 0 ? (member.todayCheckOut || 'Active in Campus') : formatMinutesAs12h(outMins))
      : '—';

    const lateByLabel = !hasPunch
      ? (status === 'On Leave' ? 'Approved Leave' : 'Absent')
      : (inDelta <= 0 ? `Early ${Math.abs(inDelta)}m` : (status === 'Late' ? `+${inDelta}m late` : `+${inDelta}m (Grace)`));

    const gateTerminal = gates[Math.floor(seededUnit(seed, offset * 5) * gates.length)];
    const method = gateTerminal.includes('Camera') ? 'Face Camera' : (gateTerminal.includes('RFID') ? 'RFID Turnstile' : 'Fingerprint');

    dailyMap.set(key, {
      key,
      dateIso,
      displayDate: formatDisplayDate(dateIso),
      dayName: WEEKDAY_NAMES[dow] || 'School Day',
      year: y,
      monthKey: `${y}-${String(mIdx + 1).padStart(2, '0')}`,
      monthLabel: `${MONTH_NAMES[mIdx]} ${y}`,
      memberId: member.id,
      memberCode: member.code,
      memberName: member.name,
      memberCategory: member.category,
      gradeOrDept: member.subLabel,
      checkInTime,
      checkOutTime,
      scheduledStartTime: scheduledStart,
      durationLabel: hasPunch ? (offset === 0 && !member.todayCheckOut ? 'On Campus' : formatDurationMinutes(inMins, outMins)) : '—',
      lateByLabel,
      gateTerminal,
      verificationMethod: hasPunch ? method : '—',
      confidenceScore: hasPunch ? 97 + Math.floor(seededUnit(seed, offset * 3) * 3) : 0,
      status,
      isLiveLog: offset === 0 && Boolean(member.todayCheckIn)
    });
  }

  const dailyLogs = Array.from(dailyMap.values()).sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  const todayLiveEntry = dailyLogs.find((d) => d.dateIso === todayIso) || dailyLogs[0] || null;

  // 5. Overall, 6-Month, Min, Max, Streak
  const totalWorkingDays = monthlySummaries.reduce((s, m) => s + m.workingDays, 0);
  const totalPresent = monthlySummaries.reduce((s, m) => s + m.presentDays, 0);
  const totalLate = monthlySummaries.reduce((s, m) => s + m.lateDays, 0);
  const totalAbsent = monthlySummaries.reduce((s, m) => s + m.absentDays, 0);
  const totalLeave = monthlySummaries.reduce((s, m) => s + m.leaveDays, 0);
  const totalAttended = monthlySummaries.reduce((s, m) => s + m.attendedDays, 0);
  const overallPct = totalWorkingDays > 0 ? Number(((totalAttended / totalWorkingDays) * 100).toFixed(1)) : 0;

  const sixMonthWorkingDays = sixMonthList.reduce((s, m) => s + m.workingDays, 0);
  const sixMonthAttended = sixMonthList.reduce((s, m) => s + m.attendedDays, 0);
  const sixMonthPresent = sixMonthList.reduce((s, m) => s + m.presentDays, 0);
  const sixMonthLate = sixMonthList.reduce((s, m) => s + m.lateDays, 0);
  const sixMonthAbsent = sixMonthList.reduce((s, m) => s + m.absentDays, 0);
  const sixMonthLeave = sixMonthList.reduce((s, m) => s + m.leaveDays, 0);
  const sixMonthPct = sixMonthWorkingDays > 0 ? Number(((sixMonthAttended / sixMonthWorkingDays) * 100).toFixed(1)) : 0;

  const prevSixWorking = prevSixList.reduce((s, m) => s + m.workingDays, 0);
  const prevSixAttended = prevSixList.reduce((s, m) => s + m.attendedDays, 0);
  const prevSixPct = prevSixWorking > 0 ? (prevSixAttended / prevSixWorking) * 100 : sixMonthPct;
  const sixMonthTrendDelta = Number((sixMonthPct - prevSixPct).toFixed(1));

  let minMonth: AttendanceMonthSummary | null = null;
  let maxMonth: AttendanceMonthSummary | null = null;
  for (const m of monthlySummaries) {
    if (!minMonth || m.attendancePct < minMonth.attendancePct) minMonth = m;
    if (!maxMonth || m.attendancePct > maxMonth.attendancePct) maxMonth = m;
  }

  let longestStreakDays = 0;
  let curStreak = 0;
  for (const d of dailyLogs) {
    if (d.status === 'Present' || d.status === 'Late') {
      curStreak++;
      if (curStreak > longestStreakDays) longestStreakDays = curStreak;
    } else {
      curStreak = 0;
    }
  }

  const avgInSum = monthlySummaries.reduce((s, m) => {
    const mins = parseMinutesFromTimeString(m.avgCheckInTime);
    return s + (mins ?? startMins - 8);
  }, 0);
  const avgCheckInTime = formatMinutesAs12h(
    monthlySummaries.length > 0 ? avgInSum / monthlySummaries.length : startMins - 8
  );

  return {
    member,
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
    sixMonthTrendDelta,
    minMonth,
    maxMonth,
    longestStreakDays,
    avgCheckInTime,
    todayLiveEntry,
    dailyLogs,
    monthlySummaries: monthlyDesc,
    sixMonthList,
    yearlySummaries
  };
}
