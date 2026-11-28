import {
  AttendanceMemberCategory,
  FaceVerificationLogRecord,
  OwnerAttendancePolicy
} from '../models/school-attendance.models';

export type AttendanceVerificationChannelKind = 'face' | 'fingerprint' | 'card' | 'manual';

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
  methodChannel: AttendanceVerificationChannelKind;
  verifiedBy: string;
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
  verificationMode?: string;
  confidenceScore?: number;
  verifiedBy?: string;
}

export function classifyVerificationChannel(
  verificationMode?: string,
  gateTerminal?: string,
  verifiedBy?: string
): { channel: AttendanceVerificationChannelKind; label: string } {
  const modeRaw = String(verificationMode || '').trim();
  const gateRaw = String(gateTerminal || '').trim();
  const byRaw = String(verifiedBy || '').trim();
  const combined = `${modeRaw} ${gateRaw} ${byRaw}`.toLowerCase();

  if (
    combined.includes('fingerprint') ||
    combined.includes('webauthn') ||
    combined.includes('optical') ||
    combined.includes('finger')
  ) {
    return {
      channel: 'fingerprint',
      label: modeRaw.toLowerCase().includes('webauthn')
        ? 'Biometric Fingerprint (Device)'
        : 'Biometric Fingerprint'
    };
  }

  if (
    combined.includes('barcode') ||
    combined.includes('rfid') ||
    combined.includes('turnstile') ||
    combined.includes('card') ||
    combined.includes('qr')
  ) {
    return {
      channel: 'card',
      label: modeRaw.toLowerCase().includes('barcode')
        ? 'Barcode / ID Card Scan'
        : 'RFID / Card Scan'
    };
  }

  if (
    combined.includes('manual') ||
    combined.includes('roll_call') ||
    combined.includes('roll-call') ||
    combined.includes('roll call') ||
    combined.includes('override') ||
    combined.includes('register')
  ) {
    return {
      channel: 'manual',
      label: 'Manual Roll Call'
    };
  }

  return {
    channel: 'face',
    label: modeRaw.toLowerCase().includes('lite')
      ? 'Face Camera (Lite)'
      : (modeRaw.toLowerCase().includes('strict')
        ? 'Face Camera (Strict)'
        : (modeRaw.toLowerCase().includes('iris')
          ? 'Iris / Face Biometric'
          : 'Face Recognition'))
  };
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
  const normId = member.id.trim().toLowerCase();
  const normCode = member.code.trim().toLowerCase();
  const normName = member.name.trim().toLowerCase();

  for (const log of verificationLogs || []) {
    if (log.status === 'Rejected') continue;
    if (log.memberCategory !== member.category) continue;
    const logId = String(log.memberId || '').trim().toLowerCase();
    const logCode = String(log.memberCode || '').trim().toLowerCase();
    const logName = String(log.memberName || '').trim().toLowerCase();
    const idMatch =
      (normId && (logId === normId || logCode === normId)) ||
      (normCode && (logCode === normCode || logId === normCode)) ||
      (normName && logName && logName === normName);
    if (!idMatch) continue;
    const dateIso = normalizeDateIso(log.date);
    const key = `${dateIso}:${member.category}:${member.id}`;
    const isOut = log.punchType === 'OUT' || String(log.verifiedBy || '').includes('· OUT');
    const timeFormatted = log.timestamp || '08:00 AM';
    const existing = memberLiveMap.get(key);
    const year = Number(dateIso.slice(0, 4)) || currentYear;
    const monthIdx = Math.max(0, Math.min(11, (Number(dateIso.slice(5, 7)) || (currentMonth + 1)) - 1));
    const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const gateName = log.gateName || 'Campus Gate 01';
    const verifiedByText = String(log.verifiedBy || log.markedByRole || 'Campus Terminal')
      .replace(/\s*·\s*(IN|OUT)$/i, '')
      .trim();
    const classified = classifyVerificationChannel(log.verificationMode, gateName, verifiedByText);
    const logStatus = normalizeStatusValue(log.status);

    if (!existing) {
      const hasPunch = logStatus === 'Present' || logStatus === 'Late';
      const checkInTime = !hasPunch ? '—' : (isOut ? '07:50 AM' : timeFormatted);
      const checkOutTime = !hasPunch ? '—' : (isOut ? timeFormatted : 'In Campus');
      const inMins = hasPunch ? parseMinutesFromTimeString(checkInTime) : null;
      const outMins = hasPunch && isOut ? parseMinutesFromTimeString(checkOutTime) : null;
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
        durationLabel: !hasPunch ? '—' : (outMins !== null ? formatDurationMinutes(inMins, outMins) : 'On Campus'),
        lateByLabel: !hasPunch
          ? (logStatus === 'On Leave' ? 'Approved Leave' : 'Absent')
          : (log.lateByLabel || (logStatus === 'Late' ? 'Late Arrival' : 'On Time')),
        gateTerminal: gateName,
        verificationMethod: classified.label,
        methodChannel: classified.channel,
        verifiedBy: verifiedByText,
        confidenceScore: Math.round(Number(log.confidenceScore || 98)),
        status: logStatus,
        isLiveLog: true
      });
    } else {
      // verificationLogs is newest-first: preserve newest method & status while keeping earliest checkIn/latest checkOut
      if (isOut) {
        if (existing.checkOutTime === 'In Campus' || existing.checkOutTime === '—') {
          existing.checkOutTime = timeFormatted;
        }
        existing.durationLabel = formatDurationMinutes(
          parseMinutesFromTimeString(existing.checkInTime),
          parseMinutesFromTimeString(existing.checkOutTime)
        );
      } else {
        if (logStatus === 'Present' || logStatus === 'Late') {
          existing.checkInTime = timeFormatted;
          if (log.lateByLabel) existing.lateByLabel = log.lateByLabel;
        }
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
    const gateTerminal = ex.gate || member.todayGate || 'Main North Gate (RFID-01)';
    const classified = classifyVerificationChannel(ex.verificationMode, gateTerminal, ex.verifiedBy);

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
      gateTerminal,
      verificationMethod: classified.label,
      methodChannel: classified.channel,
      verifiedBy: ex.verifiedBy || gateTerminal,
      confidenceScore: Math.round(Number(ex.confidenceScore || 99)),
      status,
      isLiveLog: true
    });
  }

  // 2. Build full 3-year daily + monthly + yearly history (currentYear - 2 .. currentYear)
  const years = [currentYear - 2, currentYear - 1, currentYear];
  const baseTarget = Math.min(99.2, Math.max(76, member.baselineRatePct || 95.5));
  const dailyMap = new Map<string, AttendanceDailyLogEntry>(memberLiveMap);

  const terminalCatalog: Array<{
    gate: string;
    method: string;
    channel: AttendanceVerificationChannelKind;
    verifiedBy: string;
  }> = [
    {
      gate: member.todayGate || 'Main North Gate (RFID-01)',
      method: 'RFID / Card Scan',
      channel: 'card',
      verifiedBy: 'Automated Gate Turnstile'
    },
    {
      gate: 'Face Recognition Camera Kiosk 01',
      method: 'Face Recognition',
      channel: 'face',
      verifiedBy: 'AI Face Kiosk'
    },
    {
      gate: 'Biometric Fingerprint Scanner 02',
      method: 'Biometric Fingerprint',
      channel: 'fingerprint',
      verifiedBy: 'Fingerprint Sensor Terminal'
    },
    {
      gate: 'Barcode ID Scanner Desk',
      method: 'Barcode / ID Card Scan',
      channel: 'card',
      verifiedBy: 'Gate Barcode Reader'
    },
    {
      gate: 'Morning Assembly Roll Call',
      method: 'Manual Roll Call',
      channel: 'manual',
      verifiedBy: 'Class Teacher Register'
    }
  ];

  const monthlySummaries: AttendanceMonthSummary[] = [];
  let saltCounter = 1;
  let globalDaySeq = 0;

  for (const y of years) {
    const maxM = y === currentYear ? currentMonth : 11;
    for (let mIdx = 0; mIdx <= maxM; mIdx++) {
      saltCounter++;
      const monthKey = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
      const monthLabel = `${MONTH_NAMES[mIdx]} ${y}`;
      const shortLabel = `${SHORT_MONTHS[mIdx]} ${String(y).slice(-2)}`;
      const daysInCalendarMonth = new Date(y, mIdx + 1, 0).getDate();
      const maxDay = (y === currentYear && mIdx === currentMonth) ? now.getDate() : daysInCalendarMonth;

      // Subtle month-level variation so Min/Max extremes are realistic and distinct
      const wave = (seededUnit(seed, saltCounter * 7) - 0.45) * 10.5;
      const seasonalDip = mIdx === 1 || mIdx === 11 ? -2.6 : (mIdx === 9 ? 1.8 : 0);
      const monthTargetPct = Math.min(100, Math.max(72, baseTarget + wave + seasonalDip));
      const nonAttendedProb = Math.max(0.008, (100 - monthTargetPct) / 100);

      let workingDays = 0;
      let presentDays = 0;
      let lateDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let inMinsSum = 0;
      let inMinsCount = 0;
      let earliestMins = 24 * 60;
      let latestMins = 0;

      for (let dNum = 1; dNum <= maxDay; dNum++) {
        const dow = new Date(y, mIdx, dNum).getDay();
        if (dow === 0) continue; // Sunday holiday

        globalDaySeq++;
        const dateIso = `${monthKey}-${String(dNum).padStart(2, '0')}`;
        const key = `${dateIso}:${member.category}:${member.id}`;
        let entry = dailyMap.get(key);

        if (!entry) {
          const isToday = dateIso === todayIso;
          let status: 'Present' | 'Late' | 'Absent' | 'On Leave';
          if (isToday) {
            status = member.todayStatus;
          } else {
            const r = seededUnit(seed, y * 400 + mIdx * 32 + dNum);
            if (r < nonAttendedProb * 0.45) status = 'Absent';
            else if (r < nonAttendedProb) status = 'On Leave';
            else if (r < nonAttendedProb + 0.085) status = 'Late';
            else status = 'Present';
          }

          const inDelta = status === 'Late'
            ? 16 + Math.floor(seededUnit(seed, globalDaySeq * 13) * 18)
            : -18 + Math.floor(seededUnit(seed, globalDaySeq * 13) * 18);
          const inMins = startMins + inDelta;
          const isFriday = dow === 5;
          const outMins = isFriday
            ? (12 * 60 + 35 + Math.floor(seededUnit(seed, globalDaySeq * 7) * 15))
            : (14 * 60 + 10 + Math.floor(seededUnit(seed, globalDaySeq * 7) * 15));

          const hasPunch = status === 'Present' || status === 'Late';
          const checkInTime = hasPunch
            ? (isToday && member.todayCheckIn ? member.todayCheckIn : formatMinutesAs12h(inMins))
            : '—';
          const checkOutTime = hasPunch
            ? (isToday ? (member.todayCheckOut || 'Active in Campus') : formatMinutesAs12h(outMins))
            : '—';

          const lateByLabel = !hasPunch
            ? (status === 'On Leave' ? 'Approved Leave' : 'Absent')
            : (inDelta <= 0 ? `Early ${Math.abs(inDelta)}m` : (status === 'Late' ? `+${inDelta}m late` : `+${inDelta}m (Grace)`));

          const pickedTerminal = terminalCatalog[Math.floor(seededUnit(seed, globalDaySeq * 5 + dNum) * terminalCatalog.length)];

          entry = {
            key,
            dateIso,
            displayDate: `${SHORT_MONTHS[mIdx]} ${String(dNum).padStart(2, '0')}, ${y}`,
            dayName: WEEKDAY_NAMES[dow] || 'School Day',
            year: y,
            monthKey,
            monthLabel,
            memberId: member.id,
            memberCode: member.code,
            memberName: member.name,
            memberCategory: member.category,
            gradeOrDept: member.subLabel,
            checkInTime,
            checkOutTime,
            scheduledStartTime: scheduledStart,
            durationLabel: hasPunch ? (isToday && !member.todayCheckOut ? 'On Campus' : formatDurationMinutes(inMins, outMins)) : '—',
            lateByLabel,
            gateTerminal: hasPunch ? pickedTerminal.gate : 'Class Attendance Register',
            verificationMethod: hasPunch ? pickedTerminal.method : 'Manual Roll Call',
            methodChannel: hasPunch ? pickedTerminal.channel : 'manual',
            verifiedBy: hasPunch ? pickedTerminal.verifiedBy : 'Class Teacher Register',
            confidenceScore: hasPunch ? (pickedTerminal.channel === 'manual' ? 100 : 97 + Math.floor(seededUnit(seed, globalDaySeq * 3) * 3)) : 100,
            status,
            isLiveLog: isToday && Boolean(member.todayCheckIn)
          };
          dailyMap.set(key, entry);
        }

        workingDays++;
        if (entry.status === 'Present') presentDays++;
        else if (entry.status === 'Late') lateDays++;
        else if (entry.status === 'On Leave') leaveDays++;
        else absentDays++;

        const parsedIn = parseMinutesFromTimeString(entry.checkInTime);
        if (parsedIn !== null) {
          inMinsSum += parsedIn;
          inMinsCount++;
          if (parsedIn < earliestMins) earliestMins = parsedIn;
          if (parsedIn > latestMins) latestMins = parsedIn;
        }
      }

      const attendedDays = presentDays + lateDays;
      const attendancePct = workingDays > 0
        ? Number(((attendedDays / workingDays) * 100).toFixed(1))
        : 100;

      monthlySummaries.push({
        key: `${member.id}-${monthKey}`,
        year: y,
        monthIndex: mIdx,
        monthKey,
        monthLabel,
        shortLabel,
        workingDays,
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        attendedDays,
        attendancePct,
        avgCheckInTime: inMinsCount > 0 ? formatMinutesAs12h(inMinsSum / inMinsCount) : formatMinutesAs12h(startMins - 8),
        earliestCheckIn: earliestMins < 24 * 60 ? formatMinutesAs12h(earliestMins) : formatMinutesAs12h(startMins - 15),
        latestCheckIn: latestMins > 0 ? formatMinutesAs12h(latestMins) : formatMinutesAs12h(startMins + 5),
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

  const dailyLogs = Array.from(dailyMap.values()).sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  const todayLiveEntry = dailyLogs.find((d) => d.dateIso === todayIso) || dailyLogs[0] || null;

  // 4. Overall, 6-Month, Min, Max, Streak
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

export interface AttendanceRangeBreakdown {
  workingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  attendedDays: number;
  attendancePct: number;
  avgCheckInTime: string;
  longestStreakDays: number;
  minMonth: AttendanceMonthSummary | null;
  maxMonth: AttendanceMonthSummary | null;
  monthlySummaries: AttendanceMonthSummary[];
  yearlySummaries: AttendanceYearSummary[];
}

export function computeAttendanceRangeBreakdown(
  logs: AttendanceDailyLogEntry[],
  keyPrefix = 'range',
  fromIso?: string,
  toIso?: string
): AttendanceRangeBreakdown {
  const from = String(fromIso || '').trim();
  const to = String(toIso || '').trim();
  const filtered = (logs || []).filter((r) => {
    if (from && r.dateIso < from) return false;
    if (to && r.dateIso > to) return false;
    return true;
  });

  const monthBuckets = new Map<string, {
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
    inMinsSum: number;
    inMinsCount: number;
    earliestMins: number;
    latestMins: number;
  }>();

  let workingDays = 0;
  let presentDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let totalInSum = 0;
  let totalInCount = 0;
  let longestStreakDays = 0;
  let curStreak = 0;

  const sortedAsc = [...filtered].sort((a, b) => a.dateIso.localeCompare(b.dateIso));
  for (const r of sortedAsc) {
    workingDays++;
    if (r.status === 'Present') {
      presentDays++;
      curStreak++;
    } else if (r.status === 'Late') {
      lateDays++;
      curStreak++;
    } else if (r.status === 'On Leave') {
      leaveDays++;
      curStreak = 0;
    } else {
      absentDays++;
      curStreak = 0;
    }
    if (curStreak > longestStreakDays) longestStreakDays = curStreak;

    const mIdx = Math.max(0, Math.min(11, (Number(r.monthKey.slice(5, 7)) || 1) - 1));
    let mb = monthBuckets.get(r.monthKey);
    if (!mb) {
      mb = {
        year: r.year,
        monthIndex: mIdx,
        monthKey: r.monthKey,
        monthLabel: r.monthLabel || `${MONTH_NAMES[mIdx]} ${r.year}`,
        shortLabel: `${SHORT_MONTHS[mIdx]} ${String(r.year).slice(-2)}`,
        workingDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        leaveDays: 0,
        inMinsSum: 0,
        inMinsCount: 0,
        earliestMins: 24 * 60,
        latestMins: 0
      };
      monthBuckets.set(r.monthKey, mb);
    }

    mb.workingDays++;
    if (r.status === 'Present') mb.presentDays++;
    else if (r.status === 'Late') mb.lateDays++;
    else if (r.status === 'On Leave') mb.leaveDays++;
    else mb.absentDays++;

    const inM = parseMinutesFromTimeString(r.checkInTime);
    if (inM !== null) {
      totalInSum += inM;
      totalInCount++;
      mb.inMinsSum += inM;
      mb.inMinsCount++;
      if (inM < mb.earliestMins) mb.earliestMins = inM;
      if (inM > mb.latestMins) mb.latestMins = inM;
    }
  }

  const monthlySummaries: AttendanceMonthSummary[] = Array.from(monthBuckets.values())
    .map((b) => {
      const attendedDays = b.presentDays + b.lateDays;
      const pct = b.workingDays > 0 ? Number(((attendedDays / b.workingDays) * 100).toFixed(1)) : 0;
      return {
        key: `${keyPrefix}-${b.monthKey}`,
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
        attendedDays,
        attendancePct: pct,
        avgCheckInTime: b.inMinsCount > 0 ? formatMinutesAs12h(b.inMinsSum / b.inMinsCount) : '07:50 AM',
        earliestCheckIn: b.earliestMins < 24 * 60 ? formatMinutesAs12h(b.earliestMins) : '07:40 AM',
        latestCheckIn: b.latestMins > 0 ? formatMinutesAs12h(b.latestMins) : '08:05 AM',
        statusBand: computeStatusBand(pct)
      };
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  let minMonth: AttendanceMonthSummary | null = null;
  let maxMonth: AttendanceMonthSummary | null = null;
  for (const m of monthlySummaries) {
    if (!minMonth || m.attendancePct < minMonth.attendancePct) minMonth = m;
    if (!maxMonth || m.attendancePct > maxMonth.attendancePct) maxMonth = m;
  }

  const yearMap = new Map<number, AttendanceMonthSummary[]>();
  for (const m of monthlySummaries) {
    const arr = yearMap.get(m.year) || [];
    arr.push(m);
    yearMap.set(m.year, arr);
  }

  const yearlySummaries: AttendanceYearSummary[] = Array.from(yearMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, ms]) => {
      const yWorking = ms.reduce((s, m) => s + m.workingDays, 0);
      const yPresent = ms.reduce((s, m) => s + m.presentDays, 0);
      const yLate = ms.reduce((s, m) => s + m.lateDays, 0);
      const yAbsent = ms.reduce((s, m) => s + m.absentDays, 0);
      const yLeave = ms.reduce((s, m) => s + m.leaveDays, 0);
      const yAttended = ms.reduce((s, m) => s + m.attendedDays, 0);
      const yPct = yWorking > 0 ? Number(((yAttended / yWorking) * 100).toFixed(1)) : 0;
      let best = ms[0] || null;
      let worst = ms[0] || null;
      for (const m of ms) {
        if (best && m.attendancePct > best.attendancePct) best = m;
        if (worst && m.attendancePct < worst.attendancePct) worst = m;
      }
      return {
        year,
        workingDays: yWorking,
        presentDays: yPresent,
        lateDays: yLate,
        absentDays: yAbsent,
        leaveDays: yLeave,
        attendedDays: yAttended,
        attendancePct: yPct,
        bestMonthLabel: best ? best.monthLabel : String(year),
        bestMonthPct: best ? best.attendancePct : 0,
        worstMonthLabel: worst ? worst.monthLabel : String(year),
        worstMonthPct: worst ? worst.attendancePct : 0
      };
    });

  const attendedDays = presentDays + lateDays;
  const attendancePct = workingDays > 0 ? Number(((attendedDays / workingDays) * 100).toFixed(1)) : 0;
  const avgCheckInTime = totalInCount > 0 ? formatMinutesAs12h(totalInSum / totalInCount) : '07:50 AM';

  return {
    workingDays,
    presentDays,
    lateDays,
    absentDays,
    leaveDays,
    attendedDays,
    attendancePct,
    avgCheckInTime,
    longestStreakDays,
    minMonth,
    maxMonth,
    monthlySummaries,
    yearlySummaries
  };
}

