import { buildCode128SvgMarkup } from '../../../shared/hardware/barcode.component';
import { buildQrCodeSvgMarkup } from '../../../shared/hardware/qr-code.util';

export type SchoolPrintDocumentType =
  | 'thermal_receipt'
  | 'bank_challan'
  | 'id_card'
  | 'barcode_stickers'
  | 'result_dmc'
  | 'salary_slip';

export interface SchoolPrintBrandingConfig {
  schoolName: string;
  campusTagline: string;
  registrationNo: string;
  address: string;
  phone: string;
  website: string;
  signatoryTitle: string;
  monogramInitials: string;
  headerAccentColor: string;
  defaultPaperWidth: '80mm' | '58mm';
  stampLabel: 'PAID' | 'VERIFIED' | 'ORIGINAL' | 'NONE';
  footerNote: string;
  showLogoCrest: boolean;
  showQrVerification: boolean;
  showBarcodeVerification: boolean;
}

export const DEFAULT_SCHOOL_PRINT_BRANDING: SchoolPrintBrandingConfig = {
  schoolName: 'SoftCode Premier Academy',
  campusTagline: 'Excellence in Science, Technology & Character Building',
  registrationNo: 'BISE-REG-2026-4410 · Chartered Campus',
  address: 'Plot 14, Main Margalla Road, Sector F-10/3, Islamabad',
  phone: '+92 51 9283741',
  website: 'www.softcodeacademy.edu.pk',
  signatoryTitle: 'Principal & Controller of Examinations',
  monogramInitials: 'SPA',
  headerAccentColor: '#0f172a',
  defaultPaperWidth: '80mm',
  stampLabel: 'VERIFIED',
  footerNote: 'Computer-generated official document. Verify barcode or 2D QR at the Campus Accounts Desk.',
  showLogoCrest: true,
  showQrVerification: true,
  showBarcodeVerification: true
};

export interface SchoolDocumentFormatMeta {
  id: SchoolPrintDocumentType;
  title: string;
  urduHint: string;
  paperBadge: string;
  machineType: string;
  usedFor: string;
  printedFrom: string;
  sampleCode: string;
}

export const SCHOOL_DOCUMENT_CATALOG: SchoolDocumentFormatMeta[] = [
  {
    id: 'thermal_receipt',
    title: 'Choti Billing Raseed (Fee Receipt)',
    urduHint: '80mm / 58mm Thermal Roll',
    paperBadge: '80mm / 58mm Roll',
    machineType: 'Thermal Receipt Printer (USB / Wi-Fi / Bluetooth)',
    usedFor: 'Instant counter fee raseed jab student cash, JazzCash, Easypaisa, ya Raast se fee jama karaye.',
    printedFrom: 'Accountant Collect Fee Counter · Fee Payment Modal · Gateway Transactions',
    sampleCode: 'CH-2026-1001'
  },
  {
    id: 'bank_challan',
    title: '3-Copy Bank Fee Challan',
    urduHint: 'Bank · School · Student Copy',
    paperBadge: 'A4 Landscape',
    machineType: 'A4 Laser / Inkjet Office Printer (ya Save PDF)',
    usedFor: 'Monthly aur admission fee bank counter (Meezan/HBL/1Bill/Raast) mein jama karane ke liye.',
    printedFrom: 'Students Table (Printer icon) · Admissions · Fees & Finance Tab',
    sampleCode: 'CH-2026-1001'
  },
  {
    id: 'id_card',
    title: 'Student & Staff Gate ID Card',
    urduHint: 'Barcode + 2D QR Gate Badge',
    paperBadge: 'CR80 / A4 Cutout',
    machineType: 'A4 Printer (Laminate/Cutout) ya PVC Card Printer',
    usedFor: 'Subah school gate par USB barcode scanner se 1-second Student/Teacher attendance aur Gate Security ke liye.',
    printedFrom: 'Students Dossier · Teachers/Staff Hub · Attendance Verification Hub',
    sampleCode: 'STU-1001'
  },
  {
    id: 'barcode_stickers',
    title: 'Barcode Sticker Labels Sheet',
    urduHint: '3-Column Self-Adhesive Grid',
    paperBadge: 'A4 Portrait Grid',
    machineType: 'A4 Laser / Inkjet Printer (A4 Sticker Paper)',
    usedFor: 'Notebooks, old ID cards, library books, ya fee folders par STU-/EMP-/CH- barcode sticker chipkane ke liye.',
    printedFrom: 'Printer & Scanner Terminal -> Student Stickers / Staff EMP Stickers',
    sampleCode: 'STU-1001'
  },
  {
    id: 'result_dmc',
    title: 'Official Exam Result Card (DMC)',
    urduHint: 'Subject Marks, GPA & Rank',
    paperBadge: 'A4 Portrait',
    machineType: 'A4 Laser / Inkjet Office Printer (ya WhatsApp PDF)',
    usedFor: 'Term-wise / Annual result parents ko dene aur official board record file rakhne ke liye.',
    printedFrom: 'Examinations & Grades Tab · Student Portal Academics · Reports',
    sampleCode: 'DMC-2026-1001'
  },
  {
    id: 'salary_slip',
    title: 'Staff & Faculty Monthly Salary Slip',
    urduHint: 'Pay, Allowances & Deductions',
    paperBadge: 'A4 Portrait',
    machineType: 'A4 Laser / Inkjet Office Printer (ya Save PDF)',
    usedFor: 'Teachers, Principals aur Support Staff ko mahana tankhwah aur deductions ka signed record dene ke liye.',
    printedFrom: 'Teachers & Staff Payroll Tab · Finance Arrears & Salary Reports',
    sampleCode: 'PAY-2026-301'
  }
];

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeAccent(color?: string): string {
  const c = String(color || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#0f172a';
}

function formatPkr(n: number): string {
  return Number(n || 0).toLocaleString('en-PK');
}

export interface A4ChallanPrintData {
  challanNo: string;
  issueMonth: string;
  dueDate: string;
  studentName: string;
  rollNo: string;
  grade: string;
  guardianName: string;
  bankName: string;
  branchCode: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  oneBillId?: string;
  raastId?: string;
  tuitionFee: number;
  labFee: number;
  examFee: number;
  activityFee: number;
  lateFine: number;
  statusLabel: 'PAID' | 'UNPAID' | 'PENDING';
}

export function buildA4BankChallanHtml(
  data: A4ChallanPrintData,
  branding: SchoolPrintBrandingConfig
): string {
  const accent = safeAccent(branding.headerAccentColor);
  const totalWithin = Number(data.tuitionFee || 0) + Number(data.labFee || 0) + Number(data.examFee || 0) + Number(data.activityFee || 0);
  const totalAfter = totalWithin + Number(data.lateFine || 0);
  const barcodeSvg = branding.showBarcodeVerification
    ? buildCode128SvgMarkup(data.challanNo, 30, '#0f172a')
    : '';
  const qrPayload = `CHALLAN:${data.challanNo}|NAME:${data.studentName}|ROLL:${data.rollNo}|DUE:PKR ${totalWithin}|STATUS:${data.statusLabel}`;
  const qrSvg = branding.showQrVerification
    ? buildQrCodeSvgMarkup(qrPayload, 54, accent, 2, 'M')
    : '';

  const copies = ['Student Copy', 'School Copy', 'Bank Branch Copy'];
  const columnsHtml = copies
    .map((copyName) => {
      return `
      <div class="copy-col">
        <div>
          <div class="copy-top" style="border-bottom: 2px solid ${accent};">
            <div class="brand-row">
              ${branding.showLogoCrest ? `<div class="crest" style="background:${accent};">${escapeHtml((branding.monogramInitials || 'SC').slice(0, 4))}</div>` : ''}
              <div class="brand-txt">
                <div class="school-name">${escapeHtml(branding.schoolName)}</div>
                <div class="school-meta">${escapeHtml(branding.registrationNo)}</div>
                <div class="school-meta">${escapeHtml(branding.phone)}</div>
              </div>
            </div>
            <div class="copy-tag-row">
              <span class="copy-badge" style="background:${accent};">${escapeHtml(copyName)}</span>
              <span class="ref-mono">${escapeHtml(data.issueMonth)}</span>
            </div>
          </div>

          <div class="bank-box">
            <div class="bank-title">${escapeHtml(data.bankName)} · Code ${escapeHtml(data.branchCode)}</div>
            <div><strong>A/C Title:</strong> ${escapeHtml(data.accountTitle)}</div>
            <div class="mono"><strong>A/C #:</strong> ${escapeHtml(data.accountNumber)}</div>
            <div class="mono"><strong>IBAN:</strong> ${escapeHtml(data.iban)}</div>
            ${data.oneBillId ? `<div class="mono"><strong>1Bill ID:</strong> ${escapeHtml(data.oneBillId)}</div>` : ''}
            ${data.raastId ? `<div class="mono"><strong>Raast:</strong> ${escapeHtml(data.raastId)}</div>` : ''}
          </div>

          <table class="meta-tbl">
            <tr><td>Challan #</td><td class="mono bold">${escapeHtml(data.challanNo)}</td></tr>
            <tr><td>Student</td><td class="bold">${escapeHtml(data.studentName)}</td></tr>
            <tr><td>Guardian</td><td>${escapeHtml(data.guardianName)}</td></tr>
            <tr><td>Class / Roll</td><td class="bold">${escapeHtml(data.grade)} · #${escapeHtml(data.rollNo)}</td></tr>
            <tr><td>Due Date</td><td class="bold due">${escapeHtml(data.dueDate)}</td></tr>
          </table>

          <table class="fee-tbl">
            <thead><tr><th>Particulars</th><th class="right">PKR</th></tr></thead>
            <tbody>
              <tr><td>Monthly Tuition Fee</td><td class="right mono">${formatPkr(data.tuitionFee)}</td></tr>
              <tr><td>Science &amp; IT Lab Fund</td><td class="right mono">${formatPkr(data.labFee)}</td></tr>
              <tr><td>Examination &amp; Stationery</td><td class="right mono">${formatPkr(data.examFee)}</td></tr>
              <tr><td>Sports &amp; Activity Fund</td><td class="right mono">${formatPkr(data.activityFee)}</td></tr>
            </tbody>
          </table>

          <div class="totals" style="border-color:${accent};">
            <div class="tot-row"><span>Payable Within Due Date</span><span class="mono bold">PKR ${formatPkr(totalWithin)}</span></div>
            <div class="tot-row late"><span>After Due Date (+${formatPkr(data.lateFine)})</span><span class="mono bold">PKR ${formatPkr(totalAfter)}</span></div>
          </div>
          ${branding.stampLabel !== 'NONE' ? `<div class="stamp-inline">${escapeHtml(data.statusLabel === 'PAID' ? 'PAID / CLEARED' : branding.stampLabel)}</div>` : ''}
        </div>

        <div class="bottom-block">
          <div class="signs">
            <div><div class="line"></div><span>Depositor Sign</span></div>
            <div><div class="line"></div><span>Bank / Bursar Stamp</span></div>
          </div>
          <div class="codes">
            <div class="bar">${barcodeSvg}<div class="code-txt">${escapeHtml(data.challanNo)}</div></div>
            ${qrSvg ? `<div class="qr">${qrSvg}</div>` : ''}
          </div>
          <div class="foot">${escapeHtml(branding.footerNote)}</div>
        </div>
      </div>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>3-Copy Bank Fee Challan - ${escapeHtml(data.challanNo)}</title>
  <style>
    @page { size: A4 landscape; margin: 7mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #fff; font-size: 10px; }
    .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; width: 100%; }
    .copy-col { border: 1px solid #cbd5e1; border-right: 1.5px dashed #64748b; padding: 8px 10px; display: flex; flex-direction: column; justify-content: space-between; min-height: 190mm; }
    .copy-col:last-child { border-right: 1px solid #cbd5e1; }
    .copy-top { padding-bottom: 6px; margin-bottom: 6px; }
    .brand-row { display: flex; align-items: center; gap: 7px; }
    .crest { width: 30px; height: 30px; border-radius: 6px; color: #fff; font-weight: 900; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .school-name { font-size: 11px; font-weight: 900; text-transform: uppercase; line-height: 1.15; }
    .school-meta { font-size: 8.5px; color: #475569; }
    .copy-tag-row { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
    .copy-badge { color: #fff; font-size: 8.5px; font-weight: 900; text-transform: uppercase; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.4px; }
    .ref-mono { font-family: monospace; font-size: 8.5px; font-weight: 800; color: #334155; }
    .bank-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px 7px; margin-bottom: 6px; font-size: 9px; line-height: 1.35; }
    .bank-title { font-weight: 900; text-transform: uppercase; color: #0f172a; margin-bottom: 2px; }
    .meta-tbl, .fee-tbl { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 9.5px; }
    .meta-tbl td { padding: 2px 0; border-bottom: 1px dotted #e2e8f0; }
    .meta-tbl td:last-child { text-align: right; }
    .fee-tbl th { text-align: left; font-size: 8.5px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1; padding: 3px 0; }
    .fee-tbl td { padding: 3px 0; border-bottom: 1px solid #f1f5f9; }
    .right { text-align: right !important; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; }
    .bold { font-weight: 800; }
    .due { color: #b91c1c; }
    .totals { border: 1.5px solid #0f172a; border-radius: 4px; padding: 5px 7px; background: #f8fafc; }
    .tot-row { display: flex; justify-content: space-between; font-size: 10px; }
    .tot-row.late { color: #b91c1c; font-size: 9px; margin-top: 2px; }
    .stamp-inline { margin-top: 5px; display: inline-block; border: 1px solid #0f172a; padding: 1px 6px; font-size: 8px; font-weight: 900; letter-spacing: 0.8px; }
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: center; font-size: 8px; color: #475569; margin-bottom: 6px; }
    .signs .line { height: 18px; border-bottom: 1px solid #64748b; margin-bottom: 2px; }
    .codes { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .bar { flex: 1; min-width: 0; text-align: left; }
    .code-txt { font-family: monospace; font-size: 8.5px; font-weight: 900; letter-spacing: 0.8px; }
    .foot { font-size: 7.5px; color: #64748b; margin-top: 4px; text-align: center; }
  </style>
</head>
<body>
  <div class="sheet">${columnsHtml}</div>
</body>
</html>`;
}

export interface StudentIdCardPrintData {
  holderName: string;
  roleOrGrade: string;
  code: string;
  guardianOrDept: string;
  phone: string;
  validThrough: string;
  campusBranch: string;
  initials: string;
}

export function buildStudentIdCardPrintHtml(
  data: StudentIdCardPrintData,
  branding: SchoolPrintBrandingConfig
): string {
  const accent = safeAccent(branding.headerAccentColor);
  const barcodeSvg = buildCode128SvgMarkup(data.code, 28, '#0f172a');
  const qrSvg = buildQrCodeSvgMarkup(
    `ID:${data.code}|NAME:${data.holderName}|SCHOOL:${branding.schoolName}|VALID:${data.validThrough}`,
    66,
    accent,
    2,
    'M'
  );

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Gate ID Card - ${escapeHtml(data.code)}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; }
    .wrap { display: flex; flex-wrap: wrap; gap: 12mm; justify-content: flex-start; }
    .card { width: 85.6mm; height: 54mm; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; }
    .card-head { background: ${accent}; color: #fff; padding: 6px 10px; display: flex; align-items: center; gap: 7px; }
    .crest { width: 24px; height: 24px; border-radius: 5px; background: rgba(255,255,255,0.18); font-weight: 900; font-size: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .h-title { font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; }
    .h-sub { font-size: 7.5px; opacity: 0.85; }
    .front-body { padding: 7px 10px; display: flex; align-items: center; gap: 9px; flex: 1; }
    .avatar { width: 42px; height: 48px; border-radius: 6px; border: 1.5px solid ${accent}; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; color: ${accent}; flex-shrink: 0; }
    .info { flex: 1; min-width: 0; font-size: 8.5px; line-height: 1.35; }
    .holder { font-size: 11px; font-weight: 900; color: #0f172a; margin-bottom: 2px; }
    .mono { font-family: monospace; font-weight: 800; }
    .front-foot { border-top: 1px solid #e2e8f0; padding: 4px 10px; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; }
    .bar-box { width: 52mm; }
    .sign { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: right; }
    .back-body { padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex: 1; font-size: 8px; line-height: 1.45; }
    .back-foot { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 4px 10px; font-size: 7.5px; text-align: center; color: #475569; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="card-head">
        ${branding.showLogoCrest ? `<div class="crest">${escapeHtml((branding.monogramInitials || 'SC').slice(0, 4))}</div>` : ''}
        <div>
          <div class="h-title">${escapeHtml(branding.schoolName)}</div>
          <div class="h-sub">${escapeHtml(data.campusBranch)} · OFFICIAL GATE CARD</div>
        </div>
      </div>
      <div class="front-body">
        <div class="avatar">${escapeHtml(data.initials)}</div>
        <div class="info">
          <div class="holder">${escapeHtml(data.holderName)}</div>
          <div><strong>Class / Dept:</strong> ${escapeHtml(data.roleOrGrade)}</div>
          <div><strong>ID Code:</strong> <span class="mono">${escapeHtml(data.code)}</span></div>
          <div><strong>Guardian / Unit:</strong> ${escapeHtml(data.guardianOrDept)}</div>
          <div><strong>Valid Thru:</strong> ${escapeHtml(data.validThrough)}</div>
        </div>
      </div>
      <div class="front-foot">
        <div class="bar-box">${barcodeSvg}</div>
        <div class="sign">${escapeHtml(branding.signatoryTitle)}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <div class="h-title">EMERGENCY &amp; VERIFICATION DETAILS</div>
          <div class="h-sub">${escapeHtml(branding.registrationNo)}</div>
        </div>
      </div>
      <div class="back-body">
        <div>
          <div><strong>Campus Address:</strong> ${escapeHtml(branding.address)}</div>
          <div><strong>Emergency Helpline:</strong> ${escapeHtml(data.phone || branding.phone)}</div>
          <div><strong>Portal:</strong> ${escapeHtml(branding.website)}</div>
          <div style="margin-top:4px; color:#475569;">Scan Code-128 or 2D QR at campus gate to mark attendance. If found, return to Campus Office.</div>
        </div>
        <div>${qrSvg}</div>
      </div>
      <div class="back-foot">${escapeHtml(branding.footerNote)}</div>
    </div>
  </div>
</body>
</html>`;
}

export interface ResultDmcSubject {
  subject: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks: string;
}

export interface ResultDmcPrintData {
  dmcNo: string;
  examTitle: string;
  session: string;
  studentName: string;
  guardianName: string;
  rollNo: string;
  grade: string;
  subjects: ResultDmcSubject[];
  classRank: string;
}

export function buildResultDmcHtml(
  data: ResultDmcPrintData,
  branding: SchoolPrintBrandingConfig
): string {
  const accent = safeAccent(branding.headerAccentColor);
  const totalMax = data.subjects.reduce((a, b) => a + Number(b.maxMarks || 0), 0);
  const totalObt = data.subjects.reduce((a, b) => a + Number(b.obtainedMarks || 0), 0);
  const pct = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(1) : '0.0';
  const qrSvg = branding.showQrVerification
    ? buildQrCodeSvgMarkup(`DMC:${data.dmcNo}|ROLL:${data.rollNo}|SCORE:${totalObt}/${totalMax}|PCT:${pct}%`, 68, accent, 2, 'M')
    : '';
  const rowsHtml = data.subjects
    .map(
      (s, i) => `
      <tr>
        <td class="mono">${i + 1}</td>
        <td class="bold">${escapeHtml(s.subject)}</td>
        <td class="right mono">${s.maxMarks}</td>
        <td class="right mono bold">${s.obtainedMarks}</td>
        <td class="center bold">${escapeHtml(s.grade)}</td>
        <td>${escapeHtml(s.remarks)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Official DMC - ${escapeHtml(data.rollNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: 11px; }
    .frame { border: 2px solid ${accent}; padding: 18px; min-height: 265mm; display: flex; flex-direction: column; justify-content: space-between; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${accent}; padding-bottom: 12px; }
    .h-left { display: flex; align-items: center; gap: 12px; }
    .crest { width: 48px; height: 48px; border-radius: 8px; background: ${accent}; color: #fff; font-weight: 900; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .school { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px; }
    .tag { font-size: 10px; color: #475569; margin-top: 2px; }
    .doc-title { text-align: center; background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px; margin: 14px 0; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; }
    .stu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; border: 1px solid #e2e8f0; padding: 10px 14px; margin-bottom: 14px; }
    .stu-row { display: flex; justify-content: space-between; font-size: 11px; }
    .marks-tbl { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .marks-tbl th { background: ${accent}; color: #fff; text-align: left; padding: 7px 8px; font-size: 10px; text-transform: uppercase; }
    .marks-tbl td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; }
    .right { text-align: right !important; }
    .center { text-align: center !important; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; }
    .bold { font-weight: 800; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; text-align: center; }
    .sum-lbl { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 800; }
    .sum-val { font-size: 15px; font-weight: 900; color: ${accent}; margin-top: 2px; }
    .foot-sign { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; padding-top: 12px; border-top: 1px solid #cbd5e1; }
    .sig-box { width: 170px; text-align: center; }
    .sig-line { height: 28px; border-bottom: 1px solid #0f172a; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="frame">
    <div>
      <div class="header">
        <div class="h-left">
          ${branding.showLogoCrest ? `<div class="crest">${escapeHtml((branding.monogramInitials || 'SC').slice(0, 4))}</div>` : ''}
          <div>
            <div class="school">${escapeHtml(branding.schoolName)}</div>
            <div class="tag">${escapeHtml(branding.campusTagline)}</div>
            <div class="tag">${escapeHtml(branding.registrationNo)} · ${escapeHtml(branding.address)}</div>
          </div>
        </div>
        <div style="text-align:right; font-size:10px;">
          <div class="mono bold">DMC #: ${escapeHtml(data.dmcNo)}</div>
          <div>Session: ${escapeHtml(data.session)}</div>
          <div>${escapeHtml(branding.phone)}</div>
        </div>
      </div>

      <div class="doc-title">Detailed Marks Certificate (Official Academic Transcript) — ${escapeHtml(data.examTitle)}</div>

      <div class="stu-grid">
        <div class="stu-row"><span>Student Name:</span><span class="bold">${escapeHtml(data.studentName)}</span></div>
        <div class="stu-row"><span>Roll Number:</span><span class="mono bold">#${escapeHtml(data.rollNo)}</span></div>
        <div class="stu-row"><span>Father / Guardian:</span><span>${escapeHtml(data.guardianName)}</span></div>
        <div class="stu-row"><span>Class &amp; Section:</span><span class="bold">${escapeHtml(data.grade)}</span></div>
      </div>

      <table class="marks-tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Subject Title</th>
            <th class="right">Max Marks</th>
            <th class="right">Obtained</th>
            <th class="center">Grade</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="summary">
        <div><div class="sum-lbl">Total Marks</div><div class="sum-val mono">${totalObt} / ${totalMax}</div></div>
        <div><div class="sum-lbl">Percentage</div><div class="sum-val mono">${pct}%</div></div>
        <div><div class="sum-lbl">Class Rank</div><div class="sum-val">${escapeHtml(data.classRank)}</div></div>
        <div><div class="sum-lbl">Result Status</div><div class="sum-val">PASS · PROMOTED</div></div>
      </div>
    </div>

    <div>
      <div class="foot-sign">
        <div class="sig-box"><div class="sig-line"></div><strong>Class In-Charge</strong></div>
        <div>${qrSvg}</div>
        <div class="sig-box"><div class="sig-line"></div><strong>${escapeHtml(branding.signatoryTitle)}</strong></div>
      </div>
      <div style="text-align:center; font-size:9px; color:#64748b; margin-top:10px;">${escapeHtml(branding.footerNote)}</div>
    </div>
  </div>
</body>
</html>`;
}

export interface SalarySlipPrintData {
  slipNo: string;
  payMonth: string;
  empCode: string;
  employeeName: string;
  designation: string;
  department: string;
  bankAccount: string;
  basicPay: number;
  houseAllowance: number;
  medicalAllowance: number;
  taxDeduction: number;
  advanceDeduction: number;
  paymentMode: string;
}

export function buildSalarySlipHtml(
  data: SalarySlipPrintData,
  branding: SchoolPrintBrandingConfig
): string {
  const accent = safeAccent(branding.headerAccentColor);
  const gross = Number(data.basicPay || 0) + Number(data.houseAllowance || 0) + Number(data.medicalAllowance || 0);
  const deductions = Number(data.taxDeduction || 0) + Number(data.advanceDeduction || 0);
  const net = gross - deductions;
  const qrSvg = branding.showQrVerification
    ? buildQrCodeSvgMarkup(`PAY:${data.slipNo}|EMP:${data.empCode}|NET:PKR ${net}|MONTH:${data.payMonth}`, 62, accent, 2, 'M')
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Salary Slip - ${escapeHtml(data.slipNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: 11px; }
    .box { border: 1.5px solid #cbd5e1; padding: 18px; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${accent}; padding-bottom: 10px; }
    .school { font-size: 16px; font-weight: 900; text-transform: uppercase; }
    .sub { font-size: 9.5px; color: #475569; }
    .banner { margin: 12px 0; padding: 6px 10px; background: ${accent}; color: #fff; font-weight: 900; font-size: 12px; display: flex; justify-content: space-between; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 3px 0; }
    .tbl-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 9.5px; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 6px; }
    td { padding: 6px; border-bottom: 1px solid #f1f5f9; }
    .right { text-align: right; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; }
    .bold { font-weight: 800; }
    .net-box { margin-top: 14px; border: 2px solid ${accent}; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
    .net-amt { font-size: 18px; font-weight: 900; color: ${accent}; }
    .foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 22px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="hdr">
      <div>
        <div class="school">${escapeHtml(branding.schoolName)}</div>
        <div class="sub">${escapeHtml(branding.address)} · ${escapeHtml(branding.phone)}</div>
      </div>
      <div class="mono bold">Slip #: ${escapeHtml(data.slipNo)}</div>
    </div>
    <div class="banner">
      <span>OFFICIAL MONTHLY SALARY DISBURSEMENT SLIP</span>
      <span>${escapeHtml(data.payMonth)}</span>
    </div>
    <div class="grid">
      <div class="row"><span>Employee Name</span><span class="bold">${escapeHtml(data.employeeName)}</span></div>
      <div class="row"><span>EMP Gate Code</span><span class="mono bold">${escapeHtml(data.empCode)}</span></div>
      <div class="row"><span>Designation</span><span>${escapeHtml(data.designation)}</span></div>
      <div class="row"><span>Department</span><span>${escapeHtml(data.department)}</span></div>
      <div class="row"><span>Disbursement Mode</span><span>${escapeHtml(data.paymentMode)}</span></div>
      <div class="row"><span>Bank Account</span><span class="mono">${escapeHtml(data.bankAccount)}</span></div>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Earnings</th><th class="right">PKR</th></tr></thead>
        <tbody>
          <tr><td>Basic Monthly Salary</td><td class="right mono">${formatPkr(data.basicPay)}</td></tr>
          <tr><td>House Rent Allowance</td><td class="right mono">${formatPkr(data.houseAllowance)}</td></tr>
          <tr><td>Medical &amp; Conveyance</td><td class="right mono">${formatPkr(data.medicalAllowance)}</td></tr>
          <tr><td class="bold">Gross Earnings</td><td class="right mono bold">${formatPkr(gross)}</td></tr>
        </tbody>
      </table>
      <table>
        <thead><tr><th>Deductions</th><th class="right">PKR</th></tr></thead>
        <tbody>
          <tr><td>Income Tax / WHT</td><td class="right mono">${formatPkr(data.taxDeduction)}</td></tr>
          <tr><td>Advance / Leave Recovery</td><td class="right mono">${formatPkr(data.advanceDeduction)}</td></tr>
          <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
          <tr><td class="bold">Total Deductions</td><td class="right mono bold">${formatPkr(deductions)}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="net-box">
      <div><strong>NET PAYABLE SALARY DISBURSED</strong><div style="font-size:9px;color:#475569;">Verified via Campus Payroll &amp; Accounts Ledger</div></div>
      <div class="net-amt mono">PKR ${formatPkr(net)}</div>
    </div>
    <div class="foot">
      <div>${qrSvg}</div>
      <div style="text-align:right;">
        <div style="width:170px;height:24px;border-bottom:1px solid #0f172a;margin-bottom:4px;"></div>
        <strong style="font-size:10px;">${escapeHtml(branding.signatoryTitle)}</strong>
      </div>
    </div>
  </div>
</body>
</html>`;
}
