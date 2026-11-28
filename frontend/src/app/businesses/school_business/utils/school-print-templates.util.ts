import { buildCode128SvgMarkup } from '../../../shared/hardware/barcode.component';
import { buildQrCodeSvgMarkup } from '../../../shared/hardware/qr-code.util';

export type SchoolPrintDocumentType =
  | 'thermal_receipt'
  | 'bank_challan'
  | 'id_card'
  | 'barcode_stickers'
  | 'result_dmc'
  | 'salary_slip'
  | 'table_statement';

export type PrintSectionKey =
  | 'header'
  | 'meta'
  | 'person'
  | 'amounts'
  | 'verification'
  | 'footer';

export type PrintLogoPlacement = 'left' | 'top' | 'right';
export type PrintLogoShape = 'square' | 'circle';
export type PrintHeaderAlign = 'left' | 'center' | 'right';
export type PrintVerificationOrder = 'barcode_first' | 'qr_first' | 'side_by_side';

export const DEFAULT_PRINT_SECTION_ORDER: PrintSectionKey[] = [
  'header',
  'meta',
  'person',
  'amounts',
  'verification',
  'footer'
];

export interface PrintSectionMeta {
  key: PrintSectionKey;
  label: string;
  urduHint: string;
  locked?: boolean;
}

export const PRINT_SECTION_META: Record<PrintSectionKey, PrintSectionMeta> = {
  header: {
    key: 'header',
    label: 'School Header & Logo',
    urduHint: 'School Name, Uploaded Logo / Monogram, Reg # & Seal',
    locked: true
  },
  meta: {
    key: 'meta',
    label: 'Document Ref & Dates',
    urduHint: 'Receipt / Challan / DMC Number, Date & Month'
  },
  person: {
    key: 'person',
    label: 'Student / Record Particulars',
    urduHint: 'Holder Name, Roll / EMP Code, Class, Guardian & Row Details'
  },
  amounts: {
    key: 'amounts',
    label: 'Fee / Table Totals & Breakdown',
    urduHint: 'Payment Channel, Statement Table, Particulars & Net Total',
    locked: true
  },
  verification: {
    key: 'verification',
    label: 'Barcode & 2D QR Verification',
    urduHint: 'Code-128 Scanner Barcode & 2D QR Security Block'
  },
  footer: {
    key: 'footer',
    label: 'Signatory & Footer Notice',
    urduHint: 'Principal / Bursar Sign Line & Verification Note'
  }
};

export type SchoolCurrencyCode = 'PKR' | 'USD' | 'AED' | 'SAR' | 'GBP';

export type PrintChallanLogoCorner = 'top-right' | 'top-left' | 'top-center';

export type TablePrintDefaultFormat = 'a4' | '80mm' | '58mm';
export type TablePrintOrientation = 'landscape' | 'portrait';
export type TablePrintSlipLayout = 'voucher_grid' | 'ledger_row';

export interface TablePrintOverride {
  customHeading?: string;
  defaultFormat?: TablePrintDefaultFormat;
  a4Orientation?: TablePrintOrientation;
  slipLayout?: TablePrintSlipLayout;
  showFieldLogos?: boolean;
  showWatermark?: boolean;
  logoPlacement?: PrintLogoPlacement;
  logoShape?: PrintLogoShape;
  headerAlign?: PrintHeaderAlign;
  stampLabel?: 'PAID' | 'VERIFIED' | 'ORIGINAL' | 'NONE';
}

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
  currencySymbol: SchoolCurrencyCode;
  defaultPaperWidth: '80mm' | '58mm';
  thermalDualCopy: boolean;
  autoKickCashDrawer: boolean;
  autoCutThermal: boolean;
  stampLabel: 'PAID' | 'VERIFIED' | 'ORIGINAL' | 'NONE';
  footerNote: string;
  showLogoCrest: boolean;
  showQrVerification: boolean;
  showBarcodeVerification: boolean;
  logoDataUrl: string;
  logoPlacement: PrintLogoPlacement;
  logoShape: PrintLogoShape;
  logoSizePx: number;
  headerAlign: PrintHeaderAlign;
  sectionOrder: PrintSectionKey[];
  hiddenSections: PrintSectionKey[];
  verificationOrder: PrintVerificationOrder;
  challanLogoCorner: PrintChallanLogoCorner;
  challanRefLabel: string;
  challanDueDateLabel: string;
  challanTuitionLabel: string;
  challanLabLabel: string;
  challanExamLabel: string;
  challanActivityLabel: string;
  challanLeftSignLabel: string;
  challanRightSignLabel: string;
  idCardValidThru: string;
  idCardBadgeLabel: string;
  stickerFooterNote: string;
  dmcExamTitle: string;
  dmcSessionLabel: string;
  salaryMonthLabel: string;
  salaryPayModeLabel: string;
  tableDefaultFormat: TablePrintDefaultFormat;
  tableA4Orientation: TablePrintOrientation;
  tableSlipLayout: TablePrintSlipLayout;
  tableShowFieldLogos: boolean;
  tableShowWatermark: boolean;
  tableOverrides: Record<string, TablePrintOverride>;
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
  currencySymbol: 'PKR',
  defaultPaperWidth: '80mm',
  thermalDualCopy: false,
  autoKickCashDrawer: false,
  autoCutThermal: true,
  stampLabel: 'PAID',
  footerNote: 'Computer-generated official document. Verify barcode or 2D QR at the Campus Accounts Desk.',
  showLogoCrest: true,
  showQrVerification: true,
  showBarcodeVerification: true,
  logoDataUrl: '',
  logoPlacement: 'top',
  logoShape: 'square',
  logoSizePx: 44,
  headerAlign: 'center',
  sectionOrder: [...DEFAULT_PRINT_SECTION_ORDER],
  hiddenSections: [],
  verificationOrder: 'barcode_first',
  challanLogoCorner: 'top-right',
  challanRefLabel: 'REF: 2026-OCT',
  challanDueDateLabel: '10th Oct 2026',
  challanTuitionLabel: 'Monthly Tuition Fee',
  challanLabLabel: 'Science & IT Lab Fund',
  challanExamLabel: 'Exam & Transcripts Fee',
  challanActivityLabel: 'Sports & Activity Fund',
  challanLeftSignLabel: 'Parent / Depositor Sign',
  challanRightSignLabel: 'Bank Teller Stamp & Sign',
  idCardValidThru: 'Mar 2027',
  idCardBadgeLabel: 'Official Gate Card',
  stickerFooterNote: 'Scan with USB / Gate Scanner',
  dmcExamTitle: 'Mid-Term Examination 2026',
  dmcSessionLabel: 'Session 2026-27',
  salaryMonthLabel: 'October 2026',
  salaryPayModeLabel: 'Direct Bank IBFT',
  tableDefaultFormat: '80mm',
  tableA4Orientation: 'landscape',
  tableSlipLayout: 'voucher_grid',
  tableShowFieldLogos: false,
  tableShowWatermark: true,
  tableOverrides: {}
};

export function sanitizeBrandingLogoUrl(raw?: string): string {
  const val = String(raw || '').trim();
  if (/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(val)) {
    return val;
  }
  return '';
}

function sanitizeCardPhotoUrl(raw?: string): string {
  const val = String(raw || '').trim();
  if (!val) return '';
  if (/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(val)) {
    return val;
  }
  if (/^https?:\/\/[^\s"'<>]+$/i.test(val)) {
    return val;
  }
  return '';
}

function normalizeTableOverrides(raw: unknown): Record<string, TablePrintOverride> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, TablePrintOverride> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const cleanKey = String(k || '').trim();
    if (!cleanKey || !v || typeof v !== 'object') continue;
    const obj = v as Record<string, unknown>;
    const clean: TablePrintOverride = {};
    if (typeof obj['customHeading'] === 'string' && obj['customHeading'].trim()) {
      clean.customHeading = obj['customHeading'].trim();
    }
    if (obj['defaultFormat'] === 'a4' || obj['defaultFormat'] === '80mm' || obj['defaultFormat'] === '58mm') {
      clean.defaultFormat = obj['defaultFormat'];
    }
    if (obj['a4Orientation'] === 'landscape' || obj['a4Orientation'] === 'portrait') {
      clean.a4Orientation = obj['a4Orientation'];
    }
    if (obj['slipLayout'] === 'voucher_grid' || obj['slipLayout'] === 'ledger_row') {
      clean.slipLayout = obj['slipLayout'];
    }
    if (typeof obj['showFieldLogos'] === 'boolean') {
      clean.showFieldLogos = obj['showFieldLogos'];
    }
    if (typeof obj['showWatermark'] === 'boolean') {
      clean.showWatermark = obj['showWatermark'];
    }
    if (obj['logoPlacement'] === 'left' || obj['logoPlacement'] === 'top' || obj['logoPlacement'] === 'right') {
      clean.logoPlacement = obj['logoPlacement'];
    }
    if (obj['logoShape'] === 'square' || obj['logoShape'] === 'circle') {
      clean.logoShape = obj['logoShape'];
    }
    if (obj['headerAlign'] === 'left' || obj['headerAlign'] === 'center' || obj['headerAlign'] === 'right') {
      clean.headerAlign = obj['headerAlign'];
    }
    if (
      obj['stampLabel'] === 'PAID' ||
      obj['stampLabel'] === 'VERIFIED' ||
      obj['stampLabel'] === 'ORIGINAL' ||
      obj['stampLabel'] === 'NONE'
    ) {
      clean.stampLabel = obj['stampLabel'];
    }
    if (Object.keys(clean).length > 0) {
      result[cleanKey] = clean;
    }
  }
  return result;
}

export function normalizeSchoolPrintBranding(
  raw?: Partial<SchoolPrintBrandingConfig> | null,
  fallbackSchoolName?: string
): SchoolPrintBrandingConfig {
  const src = raw || {};
  const validKeys = new Set<PrintSectionKey>(DEFAULT_PRINT_SECTION_ORDER);
  const incomingOrder = Array.isArray(src.sectionOrder) ? src.sectionOrder : [];
  const dedupedOrder: PrintSectionKey[] = [];
  for (const k of incomingOrder) {
    if (validKeys.has(k) && !dedupedOrder.includes(k)) {
      dedupedOrder.push(k);
    }
  }
  for (const k of DEFAULT_PRINT_SECTION_ORDER) {
    if (!dedupedOrder.includes(k)) {
      dedupedOrder.push(k);
    }
  }

  const incomingHidden = Array.isArray(src.hiddenSections) ? src.hiddenSections : [];
  const hiddenSections = incomingHidden.filter(
    (k): k is PrintSectionKey => validKeys.has(k) && !PRINT_SECTION_META[k].locked
  );

  const placement: PrintLogoPlacement =
    src.logoPlacement === 'left' || src.logoPlacement === 'right' ? src.logoPlacement : 'top';
  const logoShape: PrintLogoShape =
    src.logoShape === 'circle' ? 'circle' : 'square';
  const align: PrintHeaderAlign =
    src.headerAlign === 'left' || src.headerAlign === 'right' ? src.headerAlign : 'center';
  const verOrder: PrintVerificationOrder =
    src.verificationOrder === 'qr_first' || src.verificationOrder === 'side_by_side'
      ? src.verificationOrder
      : 'barcode_first';
  const challanLogoCorner: PrintChallanLogoCorner =
    src.challanLogoCorner === 'top-left' || src.challanLogoCorner === 'top-center'
      ? src.challanLogoCorner
      : 'top-right';
  const logoSizePx = Math.min(84, Math.max(24, Number(src.logoSizePx || DEFAULT_SCHOOL_PRINT_BRANDING.logoSizePx)));
  const allowedCurrencies: SchoolCurrencyCode[] = ['PKR', 'USD', 'AED', 'SAR', 'GBP'];
  const currencySymbol: SchoolCurrencyCode = allowedCurrencies.includes(src.currencySymbol as SchoolCurrencyCode)
    ? (src.currencySymbol as SchoolCurrencyCode)
    : 'PKR';

  const tableDefaultFormat: TablePrintDefaultFormat =
    src.tableDefaultFormat === 'a4' || src.tableDefaultFormat === '58mm' ? src.tableDefaultFormat : '80mm';
  const tableA4Orientation: TablePrintOrientation =
    src.tableA4Orientation === 'portrait' ? 'portrait' : 'landscape';
  const tableSlipLayout: TablePrintSlipLayout =
    src.tableSlipLayout === 'ledger_row' ? 'ledger_row' : 'voucher_grid';

  return {
    ...DEFAULT_SCHOOL_PRINT_BRANDING,
    ...src,
    schoolName: String(src.schoolName || fallbackSchoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName),
    currencySymbol,
    defaultPaperWidth: src.defaultPaperWidth === '58mm' ? '58mm' : '80mm',
    thermalDualCopy: Boolean(src.thermalDualCopy),
    autoKickCashDrawer: Boolean(src.autoKickCashDrawer),
    autoCutThermal: src.autoCutThermal !== false,
    logoDataUrl: sanitizeBrandingLogoUrl(src.logoDataUrl),
    logoPlacement: placement,
    logoShape,
    logoSizePx,
    headerAlign: align,
    sectionOrder: dedupedOrder,
    hiddenSections,
    verificationOrder: verOrder,
    challanLogoCorner,
    challanRefLabel: String(src.challanRefLabel || DEFAULT_SCHOOL_PRINT_BRANDING.challanRefLabel),
    challanDueDateLabel: String(src.challanDueDateLabel || DEFAULT_SCHOOL_PRINT_BRANDING.challanDueDateLabel),
    challanTuitionLabel: String(src.challanTuitionLabel || DEFAULT_SCHOOL_PRINT_BRANDING.challanTuitionLabel),
    challanLabLabel: String(src.challanLabLabel || DEFAULT_SCHOOL_PRINT_BRANDING.challanLabLabel),
    challanExamLabel: String(src.challanExamLabel || DEFAULT_SCHOOL_PRINT_BRANDING.challanExamLabel),
    challanActivityLabel: String(src.challanActivityLabel || DEFAULT_SCHOOL_PRINT_BRANDING.challanActivityLabel),
    challanLeftSignLabel: String(src.challanLeftSignLabel || DEFAULT_SCHOOL_PRINT_BRANDING.challanLeftSignLabel),
    challanRightSignLabel: String(src.challanRightSignLabel || DEFAULT_SCHOOL_PRINT_BRANDING.challanRightSignLabel),
    idCardValidThru: String(src.idCardValidThru || DEFAULT_SCHOOL_PRINT_BRANDING.idCardValidThru),
    idCardBadgeLabel: String(src.idCardBadgeLabel || DEFAULT_SCHOOL_PRINT_BRANDING.idCardBadgeLabel),
    stickerFooterNote: String(src.stickerFooterNote || DEFAULT_SCHOOL_PRINT_BRANDING.stickerFooterNote),
    dmcExamTitle: String(src.dmcExamTitle || DEFAULT_SCHOOL_PRINT_BRANDING.dmcExamTitle),
    dmcSessionLabel: String(src.dmcSessionLabel || DEFAULT_SCHOOL_PRINT_BRANDING.dmcSessionLabel),
    salaryMonthLabel: String(src.salaryMonthLabel || DEFAULT_SCHOOL_PRINT_BRANDING.salaryMonthLabel),
    salaryPayModeLabel: String(src.salaryPayModeLabel || DEFAULT_SCHOOL_PRINT_BRANDING.salaryPayModeLabel),
    tableDefaultFormat,
    tableA4Orientation,
    tableSlipLayout,
    tableShowFieldLogos: Boolean(src.tableShowFieldLogos),
    tableShowWatermark: src.tableShowWatermark !== false,
    tableOverrides: normalizeTableOverrides(src.tableOverrides)
  };
}

export interface EffectiveTablePrintBranding {
  branding: SchoolPrintBrandingConfig;
  defaultFormat: TablePrintDefaultFormat;
  a4Orientation: TablePrintOrientation;
  slipLayout: TablePrintSlipLayout;
  showFieldLogos: boolean;
  showWatermark: boolean;
  customHeading: string;
  hasOverride: boolean;
}

export function resolveEffectiveTableBranding(
  rawBranding: SchoolPrintBrandingConfig | null | undefined,
  tableId?: string,
  canonicalTableId?: string
): EffectiveTablePrintBranding {
  const b = normalizeSchoolPrintBranding(rawBranding);
  const cleanId = String(tableId || '').trim().replace(/_single_record$/, '');
  const cleanCanonical = String(canonicalTableId || '').trim().replace(/_single_record$/, '');
  const overrides = b.tableOverrides || {};
  const ov =
    (cleanId && overrides[cleanId]) ||
    (cleanCanonical && overrides[cleanCanonical]) ||
    undefined;

  const merged: SchoolPrintBrandingConfig = ov
    ? {
        ...b,
        logoPlacement: ov.logoPlacement || b.logoPlacement,
        logoShape: ov.logoShape || b.logoShape,
        headerAlign: ov.headerAlign || b.headerAlign,
        stampLabel: ov.stampLabel || b.stampLabel,
        tableDefaultFormat: ov.defaultFormat || b.tableDefaultFormat,
        tableA4Orientation: ov.a4Orientation || b.tableA4Orientation,
        tableSlipLayout: ov.slipLayout || b.tableSlipLayout,
        tableShowFieldLogos: typeof ov.showFieldLogos === 'boolean' ? ov.showFieldLogos : b.tableShowFieldLogos,
        tableShowWatermark: typeof ov.showWatermark === 'boolean' ? ov.showWatermark : b.tableShowWatermark
      }
    : b;

  return {
    branding: merged,
    defaultFormat: merged.tableDefaultFormat,
    a4Orientation: merged.tableA4Orientation,
    slipLayout: merged.tableSlipLayout,
    showFieldLogos: merged.tableShowFieldLogos,
    showWatermark: merged.tableShowWatermark,
    customHeading: ov?.customHeading ? ov.customHeading : '',
    hasOverride: Boolean(ov && Object.keys(ov).length > 0)
  };
}

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
    title: 'Thermal Fee Receipt (POS Slip)',
    urduHint: '80mm / 58mm Thermal Roll',
    paperBadge: '80mm / 58mm Roll',
    machineType: 'Thermal Receipt Printer (USB / Wi-Fi / Bluetooth)',
    usedFor: 'Instant counter fee receipt when a student pays via Cash, JazzCash, EasyPaisa, or Raast.',
    printedFrom: 'Accountant Collect Fee Counter · Fee Payment Modal · Gateway Transactions',
    sampleCode: 'CH-2026-1001'
  },
  {
    id: 'bank_challan',
    title: '3-Copy Bank Fee Challan',
    urduHint: 'Bank · School · Student Copy',
    paperBadge: 'A4 Landscape',
    machineType: 'A4 Laser / Inkjet Office Printer (or Save PDF)',
    usedFor: 'For paying monthly and admission fees at partner bank counters (Meezan, HBL, 1Bill, or Raast).',
    printedFrom: 'Students Table (Printer icon) · Admissions · Fees & Finance Tab',
    sampleCode: 'CH-2026-1001'
  },
  {
    id: 'id_card',
    title: 'Student & Staff Gate ID Card',
    urduHint: 'Barcode + 2D QR Gate Badge',
    paperBadge: 'CR80 / A4 Cutout',
    machineType: 'A4 Printer (Cutout / Lamination) or PVC Card Printer',
    usedFor: 'For 1-second student and staff gate attendance scanning and campus security verification.',
    printedFrom: 'Students Dossier · Teachers/Staff Hub · Attendance Verification Hub',
    sampleCode: 'STU-1001'
  },
  {
    id: 'barcode_stickers',
    title: 'Barcode Sticker Labels Sheet',
    urduHint: '3-Column Self-Adhesive Grid',
    paperBadge: 'A4 Portrait Grid',
    machineType: 'A4 Laser / Inkjet Printer (A4 Sticker Paper)',
    usedFor: 'Self-adhesive STU-, EMP-, and CH- barcode labels for notebooks, ID cards, library books, and folders.',
    printedFrom: 'Printer & Scanner Terminal -> Student Stickers / Staff EMP Stickers',
    sampleCode: 'STU-1001'
  },
  {
    id: 'result_dmc',
    title: 'Official Exam Result Card (DMC)',
    urduHint: 'Subject Marks, GPA & Rank',
    paperBadge: 'A4 Portrait',
    machineType: 'A4 Laser / Inkjet Office Printer (or WhatsApp PDF)',
    usedFor: 'For issuing term-wise or annual official exam transcripts (DMC) to parents and academic archives.',
    printedFrom: 'Examinations & Grades Tab · Student Portal Academics · Reports',
    sampleCode: 'DMC-2026-1001'
  },
  {
    id: 'salary_slip',
    title: 'Staff & Faculty Monthly Salary Slip',
    urduHint: 'Pay, Allowances & Deductions',
    paperBadge: 'A4 Portrait',
    machineType: 'A4 Laser / Inkjet Office Printer (or Save PDF)',
    usedFor: 'For issuing monthly salary, allowances, and deduction statements to faculty and staff.',
    printedFrom: 'Teachers & Staff Payroll Tab · Finance Arrears & Salary Reports',
    sampleCode: 'PAY-2026-301'
  },
  {
    id: 'table_statement',
    title: 'School Tables & Row Action Slips',
    urduHint: '80mm / 58mm POS Rasheed · Record Card · A4',
    paperBadge: '80mm / 58mm / A4',
    machineType: 'Thermal Receipt Printer (80mm / 58mm) or A4 Office Printer',
    usedFor: 'Universal POS Rasheed & Record Card layout for all 65 school table categories — defaults to Thermal POS slip and supports per-table customization.',
    printedFrom: 'Every School Table Toolbar (Statement & Print) · Every Row Actions (Details & Print)',
    sampleCode: 'STM-2026-101'
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

function formatMoney(n: number, currency: string = 'PKR'): string {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '0';
  if (currency === 'PKR') return num.toLocaleString('en-PK');
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderLogoOrCrestHtml(
  branding: SchoolPrintBrandingConfig,
  accent: string,
  sizePx: number,
  fontPx: number,
  radiusPx = 6
): string {
  const safeLogo = sanitizeBrandingLogoUrl(branding.logoDataUrl);
  const finalRadius = branding.logoShape === 'circle' ? '9999px' : `${radiusPx}px`;
  if (safeLogo) {
    return `<img src="${safeLogo}" alt="Logo" style="width:${sizePx}px;height:${sizePx}px;object-fit:contain;border-radius:${finalRadius};overflow:hidden;flex-shrink:0;" />`;
  }
  if (!branding.showLogoCrest) return '';
  return `<div style="width:${sizePx}px;height:${sizePx}px;border-radius:${finalRadius};background:${accent};color:#fff;font-weight:900;font-size:${fontPx}px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml((branding.monogramInitials || 'SC').slice(0, 4))}</div>`;
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
  bankBranchName?: string;
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
  feeItems?: Array<{ label: string; amount: number }>;
  previousArrears?: number;
  discountAmount?: number;
  paidAmount?: number;
  balanceDue?: number;
  lateFine: number;
  statusLabel: 'PAID' | 'UNPAID' | 'PENDING' | 'PARTIAL';
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

export function buildA4BankChallanHtml(
  data: A4ChallanPrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const cur = branding.currencySymbol || 'PKR';
  const accent = safeAccent(branding.headerAccentColor);
  const feeRows: Array<{ label: string; amount: number }> =
    Array.isArray(data.feeItems) && data.feeItems.length > 0
      ? data.feeItems.map((it) => ({ label: String(it.label || 'Fee Item'), amount: Math.max(0, Number(it.amount || 0)) }))
      : [
          { label: branding.challanTuitionLabel || 'Monthly Tuition Fee', amount: Math.max(0, Number(data.tuitionFee || 0)) },
          ...(Number(data.labFee || 0) > 0 ? [{ label: branding.challanLabLabel || 'Science & IT Lab Fund', amount: Number(data.labFee) }] : []),
          ...(Number(data.examFee || 0) > 0 ? [{ label: branding.challanExamLabel || 'Exam & Transcripts Fee', amount: Number(data.examFee) }] : []),
          ...(Number(data.activityFee || 0) > 0 ? [{ label: branding.challanActivityLabel || 'Sports & Activity Fund', amount: Number(data.activityFee) }] : [])
        ];
  const baseTotal = feeRows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const arrears = Math.max(0, Number(data.previousArrears || 0));
  const discount = Math.max(0, Number(data.discountAmount || 0));
  const paidAlready = Math.max(0, Number(data.paidAmount || 0));
  const totalWithin =
    typeof data.balanceDue === 'number' && Number.isFinite(data.balanceDue)
      ? Math.max(0, data.balanceDue)
      : Math.max(0, baseTotal + arrears - discount - paidAlready);
  const lateFine = Math.max(0, Number(data.lateFine || 0));
  const totalAfter = totalWithin + lateFine;
  const barcodeSvg = branding.showBarcodeVerification
    ? buildCode128SvgMarkup(data.challanNo, 28, '#0f172a')
    : '';
  const qrPayload = (data.qrPayload && data.qrPayload.trim())
    ? data.qrPayload.trim()
    : `CHALLAN:${data.challanNo}|NAME:${data.studentName}|ROLL:${data.rollNo}|DUE:${cur} ${totalWithin}|STATUS:${data.statusLabel}`;
  const qrSvg = branding.showQrVerification
    ? buildQrCodeSvgMarkup(qrPayload, 50, accent, 2, 'M')
    : '';
  const challanLogoSize = Math.min(46, Math.max(24, Math.round(branding.logoSizePx * 0.72)));
  const badgeHtml = renderLogoOrCrestHtml(branding, accent, challanLogoSize, 10, 6);
  const hidden = new Set(branding.hiddenSections);
  const logoCorner = branding.challanLogoCorner || 'top-right';
  const refBadgeText = branding.challanRefLabel || data.issueMonth;

  const feeRowsHtml = feeRows
    .map((r) => `<tr><td>${escapeHtml(r.label)}</td><td class="right mono">${formatMoney(r.amount, cur)}</td></tr>`)
    .join('');

  const copies = ['Student Copy', 'School Copy', 'Bank Branch Copy'];
  const columnsHtml = copies
    .map((copyName) => {
      const headerHtml = logoCorner === 'top-center'
        ? `<div class="copy-top" style="border-bottom: 2px solid ${accent};">
            <div style="text-align:center;">
              ${badgeHtml ? `<div style="margin-bottom:4px;display:flex;justify-content:center;">${badgeHtml}</div>` : ''}
              <div class="school-name">${escapeHtml(branding.schoolName)}</div>
              <div class="school-meta">${escapeHtml(branding.registrationNo)} · ${escapeHtml(branding.phone)}</div>
            </div>
            <div class="copy-tag-row">
              <span class="copy-badge" style="background:${accent};">${escapeHtml(copyName)}</span>
              <span class="ref-mono">${escapeHtml(refBadgeText)}</span>
            </div>
          </div>`
        : (logoCorner === 'top-left'
          ? `<div class="copy-top" style="border-bottom: 2px solid ${accent};">
              <div class="brand-row">
                ${badgeHtml}
                <div class="brand-txt" style="flex:1;min-width:0;">
                  <div class="school-name">${escapeHtml(branding.schoolName)}</div>
                  <div class="school-meta">${escapeHtml(branding.registrationNo)}</div>
                </div>
              </div>
              <div class="copy-tag-row">
                <span class="copy-badge" style="background:${accent};">${escapeHtml(copyName)}</span>
                <span class="ref-mono">${escapeHtml(refBadgeText)}</span>
              </div>
            </div>`
          : `<div class="copy-top" style="border-bottom: 2px solid ${accent};">
              <div class="copy-tag-row" style="margin-top:0;align-items:flex-start;gap:8px;">
                <div style="flex:1;min-width:0;">
                  <span class="copy-badge" style="background:${accent};">${escapeHtml(copyName)}</span>
                  <div class="school-name" style="margin-top:5px;">${escapeHtml(branding.schoolName)}</div>
                  <div class="school-meta">${escapeHtml(branding.registrationNo)}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">
                  <span class="ref-mono">${escapeHtml(refBadgeText)}</span>
                  ${badgeHtml}
                </div>
              </div>
            </div>`);

      const blocks: Record<PrintSectionKey, string> = {
        header: headerHtml,
        meta: `
          <div class="bank-box">
            <div class="bank-title">${escapeHtml(data.bankName)}${data.bankBranchName ? ` (${escapeHtml(data.bankBranchName)})` : ''} · Code ${escapeHtml(data.branchCode)}</div>
            <div><strong>A/C Title:</strong> ${escapeHtml(data.accountTitle)}</div>
            <div class="mono"><strong>A/C #:</strong> ${escapeHtml(data.accountNumber)}</div>
            <div class="mono"><strong>IBAN:</strong> ${escapeHtml(data.iban)}</div>
            ${data.oneBillId ? `<div class="mono"><strong>1Bill ID:</strong> ${escapeHtml(data.oneBillId)}</div>` : ''}
            ${data.raastId ? `<div class="mono"><strong>Raast:</strong> ${escapeHtml(data.raastId)}</div>` : ''}
          </div>`,
        person: `
          <table class="meta-tbl">
            <tr><td>Challan #</td><td class="mono bold">${escapeHtml(data.challanNo)}</td></tr>
            <tr><td>Student</td><td class="bold">${escapeHtml(data.studentName)}</td></tr>
            <tr><td>Guardian</td><td>${escapeHtml(data.guardianName)}</td></tr>
            <tr><td>Class / Roll</td><td class="bold">${escapeHtml(data.grade)} · #${escapeHtml(data.rollNo)}</td></tr>
            <tr><td>Due Date</td><td class="bold due">${escapeHtml(data.dueDate || branding.challanDueDateLabel)}</td></tr>
          </table>`,
        amounts: `
          <div>
            <table class="fee-tbl">
              <thead><tr><th>Particulars</th><th class="right">${escapeHtml(cur)}</th></tr></thead>
              <tbody>
                ${feeRowsHtml}
                ${arrears > 0 ? `<tr><td>Previous Arrears</td><td class="right mono">+${formatMoney(arrears, cur)}</td></tr>` : ''}
                ${discount > 0 ? `<tr><td>Concession / Scholarship</td><td class="right mono">-${formatMoney(discount, cur)}</td></tr>` : ''}
                ${paidAlready > 0 ? `<tr><td>Already Paid / Credited</td><td class="right mono">-${formatMoney(paidAlready, cur)}</td></tr>` : ''}
              </tbody>
            </table>
            <div class="totals" style="border-color:${accent};">
              <div class="tot-row"><span>Payable Within Due Date</span><span class="mono bold">${escapeHtml(cur)} ${formatMoney(totalWithin, cur)}</span></div>
              <div class="tot-row late"><span>After Due Date (+${formatMoney(lateFine, cur)})</span><span class="mono bold">${escapeHtml(cur)} ${formatMoney(totalAfter, cur)}</span></div>
            </div>
            ${branding.stampLabel !== 'NONE' ? `<div class="stamp-inline">${escapeHtml(data.statusLabel === 'PAID' ? 'PAID / CLEARED' : (data.statusLabel === 'PARTIAL' ? 'PARTIAL BALANCE' : branding.stampLabel))}</div>` : ''}
          </div>`,
        verification: (() => {
          if (!barcodeSvg && !qrSvg) return '';
          if (branding.verificationOrder === 'qr_first') {
            return `<div class="codes">
              ${qrSvg ? `<div class="qr">${qrSvg}</div>` : ''}
              ${barcodeSvg ? `<div class="bar">${barcodeSvg}<div class="code-txt">${escapeHtml(data.challanNo)}</div></div>` : ''}
            </div>`;
          }
          return `<div class="codes">
            ${barcodeSvg ? `<div class="bar">${barcodeSvg}<div class="code-txt">${escapeHtml(data.challanNo)}</div></div>` : ''}
            ${qrSvg ? `<div class="qr">${qrSvg}</div>` : ''}
          </div>`;
        })(),
        footer: `
          <div class="bottom-block">
            <div class="signs">
              <div><div class="line"></div><span>${escapeHtml(branding.challanLeftSignLabel || 'Parent / Depositor Sign')}</span></div>
              <div><div class="line"></div><span>${escapeHtml(branding.challanRightSignLabel || 'Bank Teller Stamp & Sign')}</span></div>
            </div>
            <div class="foot">${escapeHtml(branding.footerNote)}</div>
          </div>`
      };

      const orderedHtml = branding.sectionOrder
        .filter((k) => !hidden.has(k))
        .map((k) => blocks[k] || '')
        .join('\n');

      return `<div class="copy-col">${orderedHtml}</div>`;
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
    .copy-col { border: 1px solid #cbd5e1; border-right: 1.5px dashed #64748b; padding: 8px 10px; display: flex; flex-direction: column; justify-content: space-between; gap: 6px; min-height: 190mm; }
    .copy-col:last-child { border-right: 1px solid #cbd5e1; }
    .copy-top { padding-bottom: 6px; }
    .brand-row { display: flex; align-items: center; gap: 7px; }
    .school-name { font-size: 11px; font-weight: 900; text-transform: uppercase; line-height: 1.15; }
    .school-meta { font-size: 8.5px; color: #475569; }
    .copy-tag-row { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
    .copy-badge { color: #fff; font-size: 8.5px; font-weight: 900; text-transform: uppercase; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.4px; }
    .ref-mono { font-family: monospace; font-size: 8.5px; font-weight: 800; color: #334155; }
    .bank-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px 7px; font-size: 9px; line-height: 1.35; }
    .bank-title { font-weight: 900; text-transform: uppercase; color: #0f172a; margin-bottom: 2px; }
    .meta-tbl, .fee-tbl { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 9.5px; }
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
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: center; font-size: 8px; color: #475569; margin-bottom: 4px; }
    .signs .line { height: 18px; border-bottom: 1px solid #64748b; margin-bottom: 2px; }
    .codes { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .bar { flex: 1; min-width: 0; text-align: left; }
    .code-txt { font-family: monospace; font-size: 8.5px; font-weight: 900; letter-spacing: 0.8px; }
    .foot { font-size: 7.5px; color: #64748b; text-align: center; }
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
  photoDataUrl?: string;
  bloodGroup?: string;
  issueDate?: string;
  cardTypeLabel?: string;
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

function buildSingleIdCardPairHtml(
  data: StudentIdCardPrintData,
  branding: SchoolPrintBrandingConfig,
  accent: string
): string {
  const barcodeSvg = branding.showBarcodeVerification !== false
    ? buildCode128SvgMarkup(data.code, 28, '#0f172a')
    : '';
  const qrSvg = branding.showQrVerification !== false
    ? buildQrCodeSvgMarkup(
        (data.qrPayload && data.qrPayload.trim())
          ? data.qrPayload.trim()
          : `ID:${data.code}|NAME:${data.holderName}|SCHOOL:${branding.schoolName}|VALID:${data.validThrough}`,
        66,
        accent,
        2,
        'M'
      )
    : '';
  const safeLogo = sanitizeBrandingLogoUrl(branding.logoDataUrl);
  const cardLogoRadius = branding.logoShape === 'circle' ? '9999px' : '4px';
  const cardCrestRadius = branding.logoShape === 'circle' ? '9999px' : '5px';
  const cardBadgeHtml = safeLogo
    ? `<img src="${safeLogo}" alt="Logo" style="width:26px;height:26px;object-fit:contain;border-radius:${cardLogoRadius};overflow:hidden;background:#fff;padding:1px;flex-shrink:0;" />`
    : (branding.showLogoCrest
      ? `<div class="crest" style="border-radius:${cardCrestRadius};">${escapeHtml((branding.monogramInitials || 'SC').slice(0, 4))}</div>`
      : '');
  const headDirection = branding.logoPlacement === 'right' ? 'row-reverse' : 'row';
  const headTextAlign = branding.logoPlacement === 'right' ? 'right' : 'left';
  const safePhoto = sanitizeCardPhotoUrl(data.photoDataUrl);
  const avatarInner = safePhoto
    ? `<img src="${escapeHtml(safePhoto)}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : escapeHtml(data.initials);

  return `
    <div class="card-pair">
      <div class="card">
        <div class="card-head" style="flex-direction:${headDirection};">
          ${cardBadgeHtml}
          <div style="flex:1;text-align:${headTextAlign};min-width:0;">
            <div class="h-title">${escapeHtml(branding.schoolName)}</div>
            <div class="h-sub">${escapeHtml(data.campusBranch)} · ${escapeHtml(data.cardTypeLabel || branding.idCardBadgeLabel || 'Official Gate Card')}</div>
          </div>
        </div>
        <div class="front-body">
          <div class="avatar">${avatarInner}</div>
          <div class="info">
            <div class="holder">${escapeHtml(data.holderName)}</div>
            <div><strong>Class / Dept:</strong> ${escapeHtml(data.roleOrGrade)}</div>
            <div><strong>ID Code:</strong> <span class="mono">${escapeHtml(data.code)}</span></div>
            <div><strong>Guardian / Unit:</strong> ${escapeHtml(data.guardianOrDept)}</div>
            <div><strong>Valid Thru:</strong> ${escapeHtml(data.validThrough || branding.idCardValidThru)}${data.bloodGroup ? ` · <strong>Blood:</strong> ${escapeHtml(data.bloodGroup)}` : ''}</div>
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
            ${data.issueDate ? `<div><strong>Issued On:</strong> ${escapeHtml(data.issueDate)}</div>` : ''}
            <div><strong>Portal:</strong> ${escapeHtml(branding.website)}</div>
            <div style="margin-top:4px; color:#475569;">Scan Code-128 or 2D QR at campus gate to mark attendance. If found, return to Campus Office.</div>
          </div>
          <div>${qrSvg}</div>
        </div>
        <div class="back-foot">${escapeHtml(branding.footerNote)}</div>
      </div>
    </div>`;
}

function getIdCardStyles(accent: string): string {
  return `
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; }
    .sheet-hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 6px; margin-bottom: 8mm; font-size: 10px; color: #475569; }
    .wrap { display: flex; flex-direction: column; gap: 8mm; }
    .card-pair { display: flex; flex-wrap: wrap; gap: 10mm; justify-content: flex-start; padding-bottom: 6mm; border-bottom: 1px dashed #cbd5e1; page-break-inside: avoid; }
    .card { width: 85.6mm; height: 54mm; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; }
    .card-head { background: ${accent}; color: #fff; padding: 6px 10px; display: flex; align-items: center; gap: 7px; }
    .crest { width: 24px; height: 24px; border-radius: 5px; background: rgba(255,255,255,0.18); font-weight: 900; font-size: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .h-title { font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .h-sub { font-size: 7.5px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .front-body { padding: 7px 10px; display: flex; align-items: center; gap: 9px; flex: 1; }
    .avatar { width: 42px; height: 48px; border-radius: 6px; border: 1.5px solid ${accent}; background: #f1f5f9; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; color: ${accent}; flex-shrink: 0; }
    .info { flex: 1; min-width: 0; font-size: 8.5px; line-height: 1.35; }
    .holder { font-size: 11px; font-weight: 900; color: #0f172a; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mono { font-family: monospace; font-weight: 800; }
    .front-foot { border-top: 1px solid #e2e8f0; padding: 4px 10px; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; }
    .bar-box { width: 52mm; }
    .sign { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: right; }
    .back-body { padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex: 1; font-size: 8px; line-height: 1.45; }
    .back-foot { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 4px 10px; font-size: 7.5px; text-align: center; color: #475569; }
  `;
}

export function buildStudentIdCardPrintHtml(
  data: StudentIdCardPrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const accent = safeAccent(branding.headerAccentColor);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Gate ID Card - ${escapeHtml(data.code)}</title>
  <style>${getIdCardStyles(accent)}</style>
</head>
<body>
  <div class="wrap">${buildSingleIdCardPairHtml(data, branding, accent)}</div>
</body>
</html>`;
}

export function buildBulkIdCardSheetHtml(
  cards: StudentIdCardPrintData[],
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const accent = safeAccent(branding.headerAccentColor);
  const pairsHtml = (cards || [])
    .map((card) => buildSingleIdCardPairHtml(card, branding, accent))
    .join('\n');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bulk CR80 Gate ID Cards - ${escapeHtml(branding.schoolName)}</title>
  <style>${getIdCardStyles(accent)}</style>
</head>
<body>
  <div class="sheet-hdr">
    <strong>${escapeHtml(branding.schoolName)} — Bulk CR80 Gate ID Card Sheet (${cards.length} Cards · Front &amp; Back)</strong>
    <span>Cut along dashed lines &amp; laminate</span>
  </div>
  <div class="wrap">${pairsHtml}</div>
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
  resultStatus?: string;
  passingPercent?: number;
  attendancePercent?: string;
  principalRemarks?: string;
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

export function buildResultDmcHtml(
  data: ResultDmcPrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const accent = safeAccent(branding.headerAccentColor);
  const totalMax = data.subjects.reduce((a, b) => a + Number(b.maxMarks || 0), 0);
  const totalObt = data.subjects.reduce((a, b) => a + Number(b.obtainedMarks || 0), 0);
  const pctNum = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
  const pct = pctNum.toFixed(1);
  const passThreshold = Number(data.passingPercent ?? 40);
  const failedSubjects = data.subjects.filter((s) => {
    const mMax = Number(s.maxMarks || 0);
    const mObt = Number(s.obtainedMarks || 0);
    const subPct = mMax > 0 ? (mObt / mMax) * 100 : 0;
    return String(s.grade || '').trim().toUpperCase() === 'F' || subPct < passThreshold;
  }).length;
  const computedResultStatus = data.resultStatus
    ? String(data.resultStatus).toUpperCase()
    : (pctNum < passThreshold || failedSubjects >= 2
      ? 'FAIL · DETAINED'
      : (failedSubjects === 1 ? 'COMPARTMENT' : 'PASS · PROMOTED'));
  const statusColor = computedResultStatus.includes('FAIL')
    ? '#b91c1c'
    : (computedResultStatus.includes('COMPARTMENT') ? '#b45309' : '#065f46');

  const qrSvg = branding.showQrVerification
    ? buildQrCodeSvgMarkup(
        (data.qrPayload && data.qrPayload.trim())
          ? data.qrPayload.trim()
          : `DMC:${data.dmcNo}|ROLL:${data.rollNo}|SCORE:${totalObt}/${totalMax}|PCT:${pct}%|RES:${computedResultStatus}`,
        68,
        accent,
        2,
        'M'
      )
    : '';
  const barcodeSvg = branding.showBarcodeVerification
    ? buildCode128SvgMarkup(data.dmcNo, 26, '#0f172a')
    : '';
  const badgeHtml = renderLogoOrCrestHtml(branding, accent, branding.logoSizePx, 15, 8);
  const hidden = new Set(branding.hiddenSections);

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

  const headerInnerHtml = branding.logoPlacement === 'top'
    ? `<div style="text-align:${branding.headerAlign};width:100%;">
        ${badgeHtml ? `<div style="margin-bottom:6px;">${badgeHtml}</div>` : ''}
        <div class="school">${escapeHtml(branding.schoolName)}</div>
        <div class="tag">${escapeHtml(branding.campusTagline)}</div>
        <div class="tag">${escapeHtml(branding.registrationNo)} · ${escapeHtml(branding.address)}</div>
      </div>`
    : `<div class="header" style="border-bottom:2px solid ${accent};">
        <div class="h-left" style="flex-direction:${branding.logoPlacement === 'right' ? 'row-reverse' : 'row'};flex:1;">
          ${badgeHtml}
          <div style="text-align:${branding.logoPlacement === 'right' ? 'right' : 'left'};flex:1;">
            <div class="school">${escapeHtml(branding.schoolName)}</div>
            <div class="tag">${escapeHtml(branding.campusTagline)}</div>
            <div class="tag">${escapeHtml(branding.registrationNo)} · ${escapeHtml(branding.address)}</div>
          </div>
        </div>
      </div>`;

  const sectionMap: Record<PrintSectionKey, string> = {
    header: `
      <div style="border-bottom:2px solid ${accent};padding-bottom:10px;">
        ${headerInnerHtml}
        <div class="doc-title">Detailed Marks Certificate (Official Academic Transcript) — ${escapeHtml(data.examTitle || branding.dmcExamTitle)}</div>
      </div>`,
    meta: `
      <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;padding:6px 12px;font-size:10px;background:#f8fafc;">
        <div class="mono bold">DMC #: ${escapeHtml(data.dmcNo)}</div>
        <div>Session: <strong>${escapeHtml(data.session || branding.dmcSessionLabel)}</strong></div>
        ${data.attendancePercent ? `<div>Attendance: <strong>${escapeHtml(data.attendancePercent)}</strong></div>` : ''}
        <div>Helpline: <strong>${escapeHtml(branding.phone)}</strong></div>
      </div>`,
    person: `
      <div class="stu-grid">
        <div class="stu-row"><span>Student Name:</span><span class="bold">${escapeHtml(data.studentName)}</span></div>
        <div class="stu-row"><span>Roll Number:</span><span class="mono bold">#${escapeHtml(data.rollNo)}</span></div>
        <div class="stu-row"><span>Father / Guardian:</span><span>${escapeHtml(data.guardianName)}</span></div>
        <div class="stu-row"><span>Class &amp; Section:</span><span class="bold">${escapeHtml(data.grade)}</span></div>
      </div>`,
    amounts: `
      <div>
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
          <div><div class="sum-lbl">Result Status</div><div class="sum-val" style="color:${statusColor};">${escapeHtml(computedResultStatus)}</div></div>
        </div>
        ${data.principalRemarks ? `<div style="margin-top:8px;border:1px dashed #cbd5e1;padding:6px 10px;font-size:10px;color:#334155;"><strong>Principal / Controller Remarks:</strong> ${escapeHtml(data.principalRemarks)}</div>` : ''}
      </div>`,
    verification: (() => {
      if (!barcodeSvg && !qrSvg) return '';
      if (branding.verificationOrder === 'qr_first') {
        return `<div style="display:flex;align-items:center;justify-content:center;gap:20px;padding:6px 0;">
          ${qrSvg ? `<div>${qrSvg}</div>` : ''}
          ${barcodeSvg ? `<div style="text-align:center;">${barcodeSvg}<div class="mono" style="font-size:9px;margin-top:2px;">${escapeHtml(data.dmcNo)}</div></div>` : ''}
        </div>`;
      }
      return `<div style="display:flex;align-items:center;justify-content:center;gap:20px;padding:6px 0;">
        ${barcodeSvg ? `<div style="text-align:center;">${barcodeSvg}<div class="mono" style="font-size:9px;margin-top:2px;">${escapeHtml(data.dmcNo)}</div></div>` : ''}
        ${qrSvg ? `<div>${qrSvg}</div>` : ''}
      </div>`;
    })(),
    footer: `
      <div>
        <div class="foot-sign">
          <div class="sig-box"><div class="sig-line"></div><strong>Class In-Charge</strong></div>
          <div class="sig-box"><div class="sig-line"></div><strong>${escapeHtml(branding.signatoryTitle)}</strong></div>
        </div>
        <div style="text-align:center; font-size:9px; color:#64748b; margin-top:10px;">${escapeHtml(branding.footerNote)}</div>
      </div>`
  };

  const renderedSections = branding.sectionOrder
    .filter((k) => !hidden.has(k))
    .map((k) => sectionMap[k] || '')
    .join('\n');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Official DMC - ${escapeHtml(data.rollNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: 11px; }
    .frame { border: 2px solid ${accent}; padding: 18px; min-height: 265mm; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .h-left { display: flex; align-items: center; gap: 12px; }
    .school { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px; }
    .tag { font-size: 10px; color: #475569; margin-top: 2px; }
    .doc-title { text-align: center; background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px; margin-top: 10px; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; }
    .stu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; border: 1px solid #e2e8f0; padding: 10px 14px; }
    .stu-row { display: flex; justify-content: space-between; font-size: 11px; }
    .marks-tbl { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .marks-tbl th { background: ${accent}; color: #fff; text-align: left; padding: 7px 8px; font-size: 10px; text-transform: uppercase; }
    .marks-tbl td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; }
    .right { text-align: right !important; }
    .center { text-align: center !important; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; }
    .bold { font-weight: 800; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; text-align: center; }
    .sum-lbl { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 800; }
    .sum-val { font-size: 15px; font-weight: 900; color: ${accent}; margin-top: 2px; }
    .foot-sign { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 16px; padding-top: 10px; border-top: 1px solid #cbd5e1; }
    .sig-box { width: 185px; text-align: center; }
    .sig-line { height: 28px; border-bottom: 1px solid #0f172a; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="frame">
    ${renderedSections}
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
  statusLabel?: string;
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

export function buildSalarySlipHtml(
  data: SalarySlipPrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const cur = branding.currencySymbol || 'PKR';
  const accent = safeAccent(branding.headerAccentColor);
  const gross = Number(data.basicPay || 0) + Number(data.houseAllowance || 0) + Number(data.medicalAllowance || 0);
  const deductions = Number(data.taxDeduction || 0) + Number(data.advanceDeduction || 0);
  const net = gross - deductions;
  const qrSvg = branding.showQrVerification
    ? buildQrCodeSvgMarkup(
        (data.qrPayload && data.qrPayload.trim())
          ? data.qrPayload.trim()
          : `PAY:${data.slipNo}|EMP:${data.empCode}|NET:${cur} ${net}|MONTH:${data.payMonth}`,
        62,
        accent,
        2,
        'M'
      )
    : '';
  const barcodeSvg = branding.showBarcodeVerification
    ? buildCode128SvgMarkup(data.empCode, 26, '#0f172a')
    : '';
  const badgeHtml = renderLogoOrCrestHtml(branding, accent, Math.min(54, branding.logoSizePx), 13, 6);
  const hidden = new Set(branding.hiddenSections);

  const headerHtml = branding.logoPlacement === 'top'
    ? `<div style="text-align:${branding.headerAlign};border-bottom:2px solid ${accent};padding-bottom:10px;">
        ${badgeHtml ? `<div style="margin-bottom:6px;">${badgeHtml}</div>` : ''}
        <div class="school">${escapeHtml(branding.schoolName)}</div>
        <div class="sub">${escapeHtml(branding.address)} · ${escapeHtml(branding.phone)}</div>
      </div>`
    : `<div class="hdr" style="flex-direction:${branding.logoPlacement === 'right' ? 'row-reverse' : 'row'};">
        ${badgeHtml}
        <div style="flex:1;text-align:${branding.logoPlacement === 'right' ? 'right' : 'left'};">
          <div class="school">${escapeHtml(branding.schoolName)}</div>
          <div class="sub">${escapeHtml(branding.address)} · ${escapeHtml(branding.phone)}</div>
        </div>
      </div>`;

  const sectionMap: Record<PrintSectionKey, string> = {
    header: `
      <div>
        ${headerHtml}
        <div class="banner">
          <span>OFFICIAL MONTHLY SALARY DISBURSEMENT SLIP</span>
          <span>${escapeHtml(data.payMonth || branding.salaryMonthLabel)}${data.statusLabel ? ` · ${escapeHtml(data.statusLabel)}` : ''}</span>
        </div>
      </div>`,
    meta: `
      <div style="display:flex;justify-content:space-between;border:1px solid #e2e8f0;background:#f8fafc;padding:6px 10px;font-size:10px;">
        <span class="mono bold">Slip #: ${escapeHtml(data.slipNo)}</span>
        <span>Pay Period: <strong>${escapeHtml(data.payMonth || branding.salaryMonthLabel)}</strong></span>
        <span>Mode: <strong>${escapeHtml(data.paymentMode || branding.salaryPayModeLabel)}</strong></span>
      </div>`,
    person: `
      <div class="grid">
        <div class="row"><span>Employee Name</span><span class="bold">${escapeHtml(data.employeeName)}</span></div>
        <div class="row"><span>EMP Gate Code</span><span class="mono bold">${escapeHtml(data.empCode)}</span></div>
        <div class="row"><span>Designation</span><span>${escapeHtml(data.designation)}</span></div>
        <div class="row"><span>Department</span><span>${escapeHtml(data.department)}</span></div>
        <div class="row"><span>Bank Account</span><span class="mono">${escapeHtml(data.bankAccount)}</span></div>
      </div>`,
    amounts: `
      <div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>Earnings</th><th class="right">${escapeHtml(cur)}</th></tr></thead>
            <tbody>
              <tr><td>Basic Monthly Salary</td><td class="right mono">${formatMoney(data.basicPay, cur)}</td></tr>
              <tr><td>House Rent Allowance</td><td class="right mono">${formatMoney(data.houseAllowance, cur)}</td></tr>
              <tr><td>Medical &amp; Conveyance</td><td class="right mono">${formatMoney(data.medicalAllowance, cur)}</td></tr>
              <tr><td class="bold">Gross Earnings</td><td class="right mono bold">${formatMoney(gross, cur)}</td></tr>
            </tbody>
          </table>
          <table>
            <thead><tr><th>Deductions</th><th class="right">${escapeHtml(cur)}</th></tr></thead>
            <tbody>
              <tr><td>Income Tax / WHT</td><td class="right mono">${formatMoney(data.taxDeduction, cur)}</td></tr>
              <tr><td>Advance / Leave Recovery</td><td class="right mono">${formatMoney(data.advanceDeduction, cur)}</td></tr>
              <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
              <tr><td class="bold">Total Deductions</td><td class="right mono bold">${formatMoney(deductions, cur)}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="net-box">
          <div><strong>NET PAYABLE SALARY DISBURSED</strong><div style="font-size:9px;color:#475569;">Verified via Campus Payroll &amp; Accounts Ledger</div></div>
          <div class="net-amt mono">${escapeHtml(cur)} ${formatMoney(net, cur)}</div>
        </div>
      </div>`,
    verification: (() => {
      if (!barcodeSvg && !qrSvg) return '';
      if (branding.verificationOrder === 'qr_first') {
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          ${qrSvg ? `<div>${qrSvg}</div>` : ''}
          ${barcodeSvg ? `<div style="text-align:center;">${barcodeSvg}</div>` : ''}
        </div>`;
      }
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        ${barcodeSvg ? `<div style="text-align:center;">${barcodeSvg}</div>` : ''}
        ${qrSvg ? `<div>${qrSvg}</div>` : ''}
      </div>`;
    })(),
    footer: `
      <div class="foot">
        <div style="font-size:9px;color:#64748b;max-width:60%;">${escapeHtml(branding.footerNote)}</div>
        <div style="text-align:right;">
          <div style="width:170px;height:24px;border-bottom:1px solid #0f172a;margin-bottom:4px;"></div>
          <strong style="font-size:10px;">${escapeHtml(branding.signatoryTitle)}</strong>
        </div>
      </div>`
  };

  const renderedSections = branding.sectionOrder
    .filter((k) => !hidden.has(k))
    .map((k) => sectionMap[k] || '')
    .join('\n');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Salary Slip - ${escapeHtml(data.slipNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: 11px; }
    .box { border: 1.5px solid #cbd5e1; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
    .hdr { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 2px solid ${accent}; padding-bottom: 10px; }
    .school { font-size: 16px; font-weight: 900; text-transform: uppercase; }
    .sub { font-size: 9.5px; color: #475569; }
    .banner { margin-top: 10px; padding: 6px 10px; background: ${accent}; color: #fff; font-weight: 900; font-size: 12px; display: flex; justify-content: space-between; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
    .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 3px 0; }
    .tbl-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 9.5px; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 6px; }
    td { padding: 6px; border-bottom: 1px solid #f1f5f9; }
    .right { text-align: right; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; }
    .bold { font-weight: 800; }
    .net-box { margin-top: 12px; border: 2px solid ${accent}; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
    .net-amt { font-size: 18px; font-weight: 900; color: ${accent}; }
    .foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="box">
    ${renderedSections}
  </div>
</body>
</html>`;
}

export interface AdmitCardPrintData {
  admitCode: string;
  studentName: string;
  guardianName: string;
  rollNo: string;
  grade: string;
  examTitle: string;
  examCenter: string;
  session: string;
  seatNo?: string;
  photoDataUrl?: string;
  initials: string;
  scheduleRows?: Array<{ subject: string; date: string; time: string }>;
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

export function buildAdmitCardPrintHtml(
  data: AdmitCardPrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const accent = safeAccent(branding.headerAccentColor);
  const badgeHtml = renderLogoOrCrestHtml(branding, accent, Math.min(54, branding.logoSizePx), 14, 7);
  const safePhoto = sanitizeCardPhotoUrl(data.photoDataUrl);
  const photoHtml = safePhoto
    ? `<img src="${escapeHtml(safePhoto)}" alt="" referrerpolicy="no-referrer" style="width:74px;height:88px;object-fit:cover;border-radius:6px;border:1.5px solid ${accent};" />`
    : `<div style="width:74px;height:88px;border-radius:6px;border:1.5px solid ${accent};background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:${accent};">${escapeHtml(data.initials)}</div>`;
  const barcodeSvg = branding.showBarcodeVerification !== false
    ? buildCode128SvgMarkup(data.admitCode, 30, '#0f172a')
    : '';
  const qrSvg = branding.showQrVerification !== false
    ? buildQrCodeSvgMarkup(
        (data.qrPayload && data.qrPayload.trim())
          ? data.qrPayload.trim()
          : `ADMIT:${data.admitCode}|ROLL:${data.rollNo}|EXAM:${data.examTitle}|NAME:${data.studentName}`,
        64,
        accent,
        2,
        'M'
      )
    : '';

  const scheduleRows = data.scheduleRows && data.scheduleRows.length > 0
    ? data.scheduleRows
    : [
        { subject: 'Core Paper I (English)', date: 'As per Date Sheet', time: '09:00 AM - 12:00 PM' },
        { subject: 'Core Paper II (Mathematics / Science)', date: 'As per Date Sheet', time: '09:00 AM - 12:00 PM' },
        { subject: 'Core Paper III (Computing / Electives)', date: 'As per Date Sheet', time: '09:00 AM - 12:00 PM' }
      ];

  const rowsHtml = scheduleRows
    .map((r, i) => `<tr><td class="mono">${i + 1}</td><td class="bold">${escapeHtml(r.subject)}</td><td>${escapeHtml(r.date)}</td><td class="mono">${escapeHtml(r.time)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Exam Admit Card - ${escapeHtml(data.rollNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: 11px; }
    .card { border: 2px solid ${accent}; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
    .hdr { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid ${accent}; padding-bottom: 10px; }
    .school { font-size: 16px; font-weight: 900; text-transform: uppercase; }
    .sub { font-size: 9.5px; color: #475569; }
    .banner { background: ${accent}; color: #fff; padding: 6px 12px; font-weight: 900; font-size: 12px; display: flex; justify-content: space-between; text-transform: uppercase; }
    .top-grid { display: flex; justify-content: space-between; gap: 14px; border: 1px solid #e2e8f0; padding: 10px 12px; background: #f8fafc; }
    .stu-fields { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
    .f-row { display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 2px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 9.5px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .bold { font-weight: 800; }
    .rules { border: 1px dashed #94a3b8; padding: 8px 12px; font-size: 9.5px; color: #334155; line-height: 1.45; }
    .ver { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .signs { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #cbd5e1; }
    .sig { width: 170px; text-align: center; font-size: 9.5px; }
    .sig-line { height: 24px; border-bottom: 1px solid #0f172a; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="hdr">
      ${badgeHtml}
      <div style="flex:1;">
        <div class="school">${escapeHtml(branding.schoolName)}</div>
        <div class="sub">${escapeHtml(branding.registrationNo)} · ${escapeHtml(branding.address)} · ${escapeHtml(branding.phone)}</div>
      </div>
    </div>
    <div class="banner">
      <span>OFFICIAL EXAMINATION ADMIT CARD / ROLL NUMBER SLIP</span>
      <span>${escapeHtml(data.session)}</span>
    </div>
    <div class="top-grid">
      <div class="stu-fields">
        <div class="f-row"><span>Admit Slip #</span><span class="mono bold">${escapeHtml(data.admitCode)}</span></div>
        <div class="f-row"><span>Roll Number</span><span class="mono bold">#${escapeHtml(data.rollNo)}</span></div>
        <div class="f-row"><span>Candidate Name</span><span class="bold">${escapeHtml(data.studentName)}</span></div>
        <div class="f-row"><span>Father / Guardian</span><span>${escapeHtml(data.guardianName)}</span></div>
        <div class="f-row"><span>Class / Grade</span><span class="bold">${escapeHtml(data.grade)}</span></div>
        <div class="f-row"><span>Exam Title</span><span class="bold">${escapeHtml(data.examTitle)}</span></div>
        <div class="f-row"><span>Exam Hall / Center</span><span>${escapeHtml(data.examCenter)}</span></div>
        <div class="f-row"><span>Desk / Seat #</span><span class="mono bold">${escapeHtml(data.seatNo || `DESK-${data.rollNo}`)}</span></div>
      </div>
      <div>${photoHtml}</div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Paper / Subject</th><th>Exam Date</th><th>Reporting &amp; Timing</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="rules">
      <strong>Examination Hall Instructions:</strong> Candidates must reach the Examination Hall 20 minutes prior with this Admit Card &amp; Student Gate ID Card. Mobile phones, smartwatches, and programmable calculators are strictly prohibited.
    </div>
    <div class="ver">
      <div>${barcodeSvg}<div class="mono" style="font-size:9px;margin-top:2px;">${escapeHtml(data.admitCode)}</div></div>
      <div>${qrSvg}</div>
    </div>
    <div class="signs">
      <div class="sig"><div class="sig-line"></div><strong>Candidate Signature</strong></div>
      <div class="sig"><div class="sig-line"></div><strong>${escapeHtml(branding.signatoryTitle)}</strong></div>
    </div>
    <div style="text-align:center;font-size:8.5px;color:#64748b;">${escapeHtml(branding.footerNote)}</div>
  </div>
</body>
</html>`;
}

export interface GatePassPrintData {
  passCode: string;
  visitorName: string;
  cnicOrId: string;
  phone: string;
  purpose: string;
  personToMeet: string;
  vehiclePlate?: string;
  checkInTime: string;
  status: string;
  issuedBy?: string;
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

export function buildGatePassPrintHtml(
  data: GatePassPrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const accent = safeAccent(branding.headerAccentColor);
  const badgeHtml = renderLogoOrCrestHtml(branding, accent, Math.min(44, branding.logoSizePx), 11, 5);
  const barcodeSvg = branding.showBarcodeVerification !== false
    ? buildCode128SvgMarkup(data.passCode, 28, '#0f172a')
    : '';
  const qrSvg = branding.showQrVerification !== false
    ? buildQrCodeSvgMarkup(
        (data.qrPayload && data.qrPayload.trim())
          ? data.qrPayload.trim()
          : `GATEPASS:${data.passCode}|VISITOR:${data.visitorName}|CNIC:${data.cnicOrId}|STATUS:${data.status}`,
        58,
        accent,
        2,
        'M'
      )
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Campus Visitor Gate Pass - ${escapeHtml(data.passCode)}</title>
  <style>
    @page { size: A5 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: 11px; }
    .pass { border: 2px solid ${accent}; border-radius: 8px; padding: 14px; max-width: 135mm; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
    .hdr { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid ${accent}; padding-bottom: 8px; }
    .school { font-size: 14px; font-weight: 900; text-transform: uppercase; }
    .sub { font-size: 9px; color: #475569; }
    .tag { background: ${accent}; color: #fff; padding: 5px 10px; font-weight: 900; font-size: 11px; display: flex; justify-content: space-between; text-transform: uppercase; border-radius: 4px; }
    .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 4px 0; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .bold { font-weight: 800; }
    .ver { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 6px; border-top: 1px dashed #cbd5e1; }
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center; font-size: 9px; margin-top: 10px; }
    .line { height: 22px; border-bottom: 1px solid #0f172a; margin-bottom: 3px; }
  </style>
</head>
<body>
  <div class="pass">
    <div class="hdr">
      ${badgeHtml}
      <div>
        <div class="school">${escapeHtml(branding.schoolName)}</div>
        <div class="sub">${escapeHtml(branding.address)} · ${escapeHtml(branding.phone)}</div>
      </div>
    </div>
    <div class="tag">
      <span>CAMPUS SECURITY VISITOR GATE PASS</span>
      <span>${escapeHtml(data.status)}</span>
    </div>
    <div>
      <div class="row"><span>Gate Pass ID</span><span class="mono bold">${escapeHtml(data.passCode)}</span></div>
      <div class="row"><span>Visitor Name</span><span class="bold">${escapeHtml(data.visitorName)}</span></div>
      <div class="row"><span>CNIC / Govt ID</span><span class="mono">${escapeHtml(data.cnicOrId)}</span></div>
      <div class="row"><span>Contact Phone</span><span class="mono">${escapeHtml(data.phone)}</span></div>
      <div class="row"><span>Person / Office to Visit</span><span class="bold">${escapeHtml(data.personToMeet)}</span></div>
      <div class="row"><span>Purpose of Visit</span><span>${escapeHtml(data.purpose)}</span></div>
      ${data.vehiclePlate ? `<div class="row"><span>Vehicle Registration</span><span class="mono bold">${escapeHtml(data.vehiclePlate)}</span></div>` : ''}
      <div class="row"><span>Entry Check-In Time</span><span class="mono">${escapeHtml(data.checkInTime)}</span></div>
      ${data.issuedBy ? `<div class="row"><span>Security Officer</span><span>${escapeHtml(data.issuedBy)}</span></div>` : ''}
    </div>
    <div class="ver">
      <div>${barcodeSvg}<div class="mono" style="font-size:8.5px;margin-top:2px;">${escapeHtml(data.passCode)}</div></div>
      <div>${qrSvg}</div>
    </div>
    <div class="signs">
      <div><div class="line"></div><strong>Security Gate Officer</strong></div>
      <div><div class="line"></div><strong>Host / ${escapeHtml(branding.signatoryTitle)}</strong></div>
    </div>
    <div style="text-align:center;font-size:8.5px;color:#64748b;">Return this pass at Main Gate upon exit. ${escapeHtml(branding.footerNote)}</div>
  </div>
</body>
</html>`;
}

export interface BorrowSlipPrintData {
  slipId: string;
  bookTitle: string;
  bookIsbn: string;
  accessionCode?: string;
  borrowerName: string;
  borrowerRole: string;
  borrowerId: string;
  issueDate: string;
  dueDate: string;
  status: string;
  fineAmount?: number;
  dailyFineRate?: number;
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

export function buildBorrowSlipPrintHtml(
  data: BorrowSlipPrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const cur = branding.currencySymbol || 'PKR';
  const accent = safeAccent(branding.headerAccentColor);
  const badgeHtml = renderLogoOrCrestHtml(branding, accent, Math.min(44, branding.logoSizePx), 11, 5);
  const barcodeSvg = branding.showBarcodeVerification !== false
    ? buildCode128SvgMarkup(data.accessionCode || data.bookIsbn || data.slipId, 28, '#0f172a')
    : '';
  const qrSvg = branding.showQrVerification !== false
    ? buildQrCodeSvgMarkup(
        (data.qrPayload && data.qrPayload.trim())
          ? data.qrPayload.trim()
          : `LIB:${data.slipId}|ISBN:${data.bookIsbn}|MEMBER:${data.borrowerId}|DUE:${data.dueDate}`,
        56,
        accent,
        2,
        'M'
      )
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Library Circulation Slip - ${escapeHtml(data.slipId)}</title>
  <style>
    @page { size: A5 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: 11px; }
    .slip { border: 2px solid ${accent}; border-radius: 8px; padding: 14px; max-width: 135mm; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
    .hdr { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid ${accent}; padding-bottom: 8px; }
    .school { font-size: 14px; font-weight: 900; text-transform: uppercase; }
    .sub { font-size: 9px; color: #475569; }
    .tag { background: ${accent}; color: #fff; padding: 5px 10px; font-weight: 900; font-size: 11px; display: flex; justify-content: space-between; text-transform: uppercase; border-radius: 4px; }
    .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 4px 0; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .bold { font-weight: 800; }
    .fine-box { border: 1px solid #cbd5e1; background: #f8fafc; padding: 6px 10px; border-radius: 4px; display: flex; justify-content: space-between; font-size: 10px; }
    .ver { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 6px; border-top: 1px dashed #cbd5e1; }
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center; font-size: 9px; margin-top: 10px; }
    .line { height: 22px; border-bottom: 1px solid #0f172a; margin-bottom: 3px; }
  </style>
</head>
<body>
  <div class="slip">
    <div class="hdr">
      ${badgeHtml}
      <div>
        <div class="school">${escapeHtml(branding.schoolName)}</div>
        <div class="sub">Central Library &amp; Learning Resource Desk · ${escapeHtml(branding.phone)}</div>
      </div>
    </div>
    <div class="tag">
      <span>LIBRARY BOOK CIRCULATION RECEIPT</span>
      <span>${escapeHtml(data.status)}</span>
    </div>
    <div>
      <div class="row"><span>Circulation Slip #</span><span class="mono bold">${escapeHtml(data.slipId)}</span></div>
      <div class="row"><span>Book Title</span><span class="bold">${escapeHtml(data.bookTitle)}</span></div>
      <div class="row"><span>ISBN / Accession</span><span class="mono">${escapeHtml(data.bookIsbn)}</span></div>
      <div class="row"><span>Borrower Name</span><span class="bold">${escapeHtml(data.borrowerName)} (${escapeHtml(data.borrowerRole)})</span></div>
      <div class="row"><span>Member / Roll ID</span><span class="mono bold">${escapeHtml(data.borrowerId)}</span></div>
      <div class="row"><span>Issue Date</span><span class="mono">${escapeHtml(data.issueDate)}</span></div>
      <div class="row"><span>Return Due Date</span><span class="mono bold" style="color:#b91c1c;">${escapeHtml(data.dueDate)}</span></div>
    </div>
    <div class="fine-box">
      <span>Overdue Fine Policy: <strong>${escapeHtml(cur)} ${formatMoney(data.dailyFineRate ?? 20, cur)}/day</strong></span>
      <span>Accrued Fine: <strong class="mono">${escapeHtml(cur)} ${formatMoney(data.fineAmount ?? 0, cur)}</strong></span>
    </div>
    <div class="ver">
      <div>${barcodeSvg}<div class="mono" style="font-size:8.5px;margin-top:2px;">${escapeHtml(data.accessionCode || data.bookIsbn || data.slipId)}</div></div>
      <div>${qrSvg}</div>
    </div>
    <div class="signs">
      <div><div class="line"></div><strong>Borrower Signature</strong></div>
      <div><div class="line"></div><strong>Campus Librarian</strong></div>
    </div>
    <div style="text-align:center;font-size:8.5px;color:#64748b;">${escapeHtml(branding.footerNote)}</div>
  </div>
</body>
</html>`;
}

export interface CashieringReceiptPrintData {
  receiptNo: string;
  timestamp: string;
  studentName: string;
  rollNo: string;
  grade: string;
  guardianName?: string;
  monthsPaid: string;
  paymentResource: string;
  resourceReference?: string;
  collectedBy: string;
  collectorRole?: string;
  amount: number;
  notes?: string;
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

export function buildCashieringReceiptA4Html(
  data: CashieringReceiptPrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const cur = branding.currencySymbol || 'PKR';
  const accent = safeAccent(branding.headerAccentColor);
  const badgeHtml = branding.showLogoCrest !== false
    ? renderLogoOrCrestHtml(branding, accent, Math.min(54, branding.logoSizePx), 12, 8)
    : '';
  const barcodeSvg = branding.showBarcodeVerification !== false
    ? buildCode128SvgMarkup(data.receiptNo, 28, '#0f172a')
    : '';
  const qrSvg = branding.showQrVerification !== false
    ? buildQrCodeSvgMarkup(
        (data.qrPayload && data.qrPayload.trim())
          ? data.qrPayload.trim()
          : `REC:${data.receiptNo}|STU:${data.studentName}|ROLL:${data.rollNo}|AMT:${cur} ${data.amount}|DATE:${data.timestamp}`,
        64,
        accent,
        2,
        'M'
      )
    : '';
  const stampText = branding.stampLabel && branding.stampLabel !== 'NONE' ? branding.stampLabel : 'PAID';
  const deskLabel = data.collectorRole === 'accountant'
    ? 'Accountant / Fee Clerk Counter'
    : 'Office of the Principal & Executive Desk';

  const alignClass = branding.logoPlacement === 'top'
    ? `flex-direction:column;align-items:${branding.headerAlign === 'left' ? 'flex-start' : (branding.headerAlign === 'right' ? 'flex-end' : 'center')};text-align:${branding.headerAlign || 'center'};`
    : (branding.logoPlacement === 'right' ? 'flex-direction:row-reverse;align-items:center;text-align:right;' : 'flex-direction:row;align-items:center;text-align:left;');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Fee Receipt - ${escapeHtml(data.receiptNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #fff; font-size: 11px; }
    .card { border: 2px solid ${accent}; border-radius: 12px; padding: 20px; max-width: 185mm; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; }
    .wm { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.04; font-size: 42px; font-weight: 900; letter-spacing: 5px; transform: rotate(-22deg); pointer-events: none; color: ${accent}; }
    .hdr { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; border-bottom: 2px solid ${accent}; padding-bottom: 12px; position: relative; z-index: 1; }
    .brand { display: flex; gap: 12px; flex: 1; min-width: 0; ${alignClass} }
    .school { font-size: 17px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; }
    .sub { font-size: 10px; color: #475569; margin-top: 2px; }
    .meta-r { text-align: right; flex-shrink: 0; }
    .badge { display: inline-block; background: ${accent}; color: #fff; padding: 4px 10px; border-radius: 5px; font-weight: 900; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; position: relative; z-index: 1; }
    .sec-title { font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: ${accent}; margin-bottom: 6px; }
    .kv { display: flex; justify-content: space-between; gap: 8px; padding: 4px 0; border-bottom: 1px dotted #e2e8f0; }
    .kv-l { color: #64748b; font-weight: 600; }
    .kv-v { font-weight: 800; color: #0f172a; text-align: right; }
    .amt-strip { background: #f8fafc; border: 1.5px solid ${accent}; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
    .amt-val { font-size: 20px; font-weight: 900; color: ${accent}; }
    .ver { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; position: relative; z-index: 1; }
    .sign { border-top: 1.5px solid #0f172a; padding-top: 4px; min-width: 180px; text-align: right; font-size: 10px; font-weight: 800; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="wm">${escapeHtml(branding.schoolName.toUpperCase())}</div>
    <div class="hdr">
      <div class="brand">
        ${badgeHtml}
        <div>
          <div class="school">${escapeHtml(branding.schoolName)}</div>
          ${branding.campusTagline ? `<div class="sub" style="font-weight:700;text-transform:uppercase;">${escapeHtml(branding.campusTagline)}</div>` : ''}
          <div class="sub">${escapeHtml(deskLabel)} · ${escapeHtml(branding.address)} · ${escapeHtml(branding.phone)}</div>
        </div>
      </div>
      <div class="meta-r">
        <span class="badge">${escapeHtml(stampText)} · CASHIER RECEIPT</span>
        <div class="mono" style="font-weight:800;margin-top:6px;">Receipt #: ${escapeHtml(data.receiptNo)}</div>
        <div class="sub">${escapeHtml(data.timestamp)}</div>
      </div>
    </div>
    <div class="grid2">
      <div>
        <div class="sec-title">Student Details</div>
        <div class="kv"><span class="kv-l">Student Name</span><span class="kv-v">${escapeHtml(data.studentName)}</span></div>
        <div class="kv"><span class="kv-l">Roll Number</span><span class="kv-v mono">${escapeHtml(data.rollNo)}</span></div>
        <div class="kv"><span class="kv-l">Class &amp; Grade</span><span class="kv-v">${escapeHtml(data.grade)}</span></div>
        <div class="kv"><span class="kv-l">Father / Guardian</span><span class="kv-v">${escapeHtml(data.guardianName || 'On File')}</span></div>
      </div>
      <div>
        <div class="sec-title">Collection Audit</div>
        <div class="kv"><span class="kv-l">Month / Term</span><span class="kv-v">${escapeHtml(data.monthsPaid)}</span></div>
        <div class="kv"><span class="kv-l">Payment Channel</span><span class="kv-v">${escapeHtml(data.paymentResource)}</span></div>
        <div class="kv"><span class="kv-l">Reference #</span><span class="kv-v mono">${escapeHtml(data.resourceReference || 'COUNTER-REF')}</span></div>
        <div class="kv"><span class="kv-l">Collected By</span><span class="kv-v">${escapeHtml(data.collectedBy)}</span></div>
      </div>
    </div>
    <div class="amt-strip">
      <div>
        <div style="font-weight:900;text-transform:uppercase;font-size:11px;">Total Net Amount Received</div>
        <div class="sub">[Copy 1: Counter Desk] · [Copy 2: Parent Voucher] · [Copy 3: Accounts Ledger]</div>
      </div>
      <div class="amt-val mono">${escapeHtml(cur)} ${formatMoney(data.amount, cur)}</div>
    </div>
    <div class="ver">
      <div style="display:flex;align-items:center;gap:12px;">
        ${qrSvg}
        <div>
          ${barcodeSvg}
          <div class="sub" style="margin-top:4px;max-width:340px;">${escapeHtml(branding.footerNote)}</div>
        </div>
      </div>
      <div class="sign">${escapeHtml(branding.signatoryTitle || 'Principal & Accounts Directorate')}</div>
    </div>
  </div>
</body>
</html>`;
}

export interface SlcCertificatePrintData {
  certificateNo: string;
  securityHash: string;
  studentName: string;
  fatherName: string;
  rollNo: string;
  grade: string;
  admissionDate: string;
  leavingDate: string;
  reasonForLeaving: string;
  conductRating: string;
  academicAchievement: string;
  issuedBy: string;
  accountsClearance?: boolean;
  libraryClearance?: boolean;
  labClearance?: boolean;
  sportsClearance?: boolean;
  qrPayload?: string;
  printId?: string;
  generatedBy?: string;
}

export function buildSlcCertificatePrintHtml(
  data: SlcCertificatePrintData,
  rawBranding: SchoolPrintBrandingConfig
): string {
  const branding = normalizeSchoolPrintBranding(rawBranding);
  const accent = safeAccent(branding.headerAccentColor);
  const badgeHtml = branding.showLogoCrest !== false
    ? renderLogoOrCrestHtml(branding, accent, Math.min(64, branding.logoSizePx + 8), 14, 10)
    : '';
  const barcodeSvg = branding.showBarcodeVerification !== false
    ? buildCode128SvgMarkup(data.certificateNo, 28, '#0f172a')
    : '';
  const qrSvg = branding.showQrVerification !== false
    ? buildQrCodeSvgMarkup(
        (data.qrPayload && data.qrPayload.trim())
          ? data.qrPayload.trim()
          : `SLC:${data.certificateNo}|HASH:${data.securityHash}|STU:${data.studentName}|ROLL:${data.rollNo}`,
        70,
        accent,
        2,
        'M'
      )
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>School Leaving Certificate - ${escapeHtml(data.certificateNo)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #fff; font-size: 12px; }
    .cert { border: 4px double ${accent}; border-radius: 14px; padding: 26px; max-width: 190mm; margin: 0 auto; position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 18px; }
    .wm { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.045; font-size: 48px; font-weight: 900; letter-spacing: 6px; transform: rotate(-25deg); pointer-events: none; color: ${accent}; text-align: center; }
    .hdr { text-align: center; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .reg { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: ${accent}; }
    .school { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; }
    .addr { font-size: 11px; color: #475569; font-style: italic; }
    .pill { display: inline-block; background: ${accent}; color: #fff; padding: 5px 16px; border-radius: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .meta { display: flex; justify-content: space-between; border-top: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1; padding: 8px 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; position: relative; z-index: 1; }
    .prose { font-family: Georgia, Cambria, "Times New Roman", serif; font-size: 13px; line-height: 1.7; position: relative; z-index: 1; }
    .u { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #64748b; padding: 0 3px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size: 11.5px; position: relative; z-index: 1; }
    .clr { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 10px; padding: 10px 14px; position: relative; z-index: 1; }
    .clr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 6px; font-size: 10.5px; font-weight: 800; color: #047857; }
    .signs { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding-top: 26px; position: relative; z-index: 1; }
    .seal { width: 84px; height: 84px; border-radius: 9999px; border: 2px solid ${accent}; color: ${accent}; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-weight: 900; font-size: 8.5px; letter-spacing: 0.6px; text-transform: uppercase; }
    .s-line { border-top: 1.5px solid #0f172a; padding-top: 4px; min-width: 165px; text-align: center; font-size: 10.5px; font-weight: 800; }
    .ver { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; position: relative; z-index: 1; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="wm">${escapeHtml(branding.schoolName.toUpperCase())}</div>
    <div class="hdr">
      ${badgeHtml}
      <div class="reg">${escapeHtml(branding.registrationNo)}</div>
      <div class="school">${escapeHtml(branding.schoolName)}</div>
      <div class="addr">${escapeHtml(branding.address)} · ${escapeHtml(branding.phone)}</div>
      <div class="pill">Official School Leaving &amp; Character Certificate</div>
    </div>
    <div class="meta">
      <div>Serial No: <strong>${escapeHtml(data.certificateNo)}</strong></div>
      <div>Security Hash: <strong style="color:${accent};">${escapeHtml(data.securityHash)}</strong></div>
      <div>Issue Date: <strong>${escapeHtml(data.leavingDate)}</strong></div>
    </div>
    <div class="prose">
      This is to certify that <span class="u">${escapeHtml(data.studentName)}</span>,
      son/daughter of <span class="u">${escapeHtml(data.fatherName)}</span>,
      bearing Institutional Roll No. <span class="u">${escapeHtml(data.rollNo)}</span>,
      was a bonafide student of this institution in <span class="u">${escapeHtml(data.grade)}</span>.
    </div>
    <div class="grid2">
      <div><span style="color:#64748b;">Date of Admission:</span> <strong>${escapeHtml(data.admissionDate)}</strong></div>
      <div><span style="color:#64748b;">Date of Leaving:</span> <strong>${escapeHtml(data.leavingDate)}</strong></div>
      <div><span style="color:#64748b;">Reason for Leaving:</span> <strong>${escapeHtml(data.reasonForLeaving)}</strong></div>
      <div><span style="color:#64748b;">Conduct &amp; Character:</span> <strong style="color:#047857;">${escapeHtml(data.conductRating)}</strong></div>
      <div style="grid-column:span 2;"><span style="color:#64748b;">Academic &amp; Co-Curricular Achievement:</span> <strong>${escapeHtml(data.academicAchievement)}</strong></div>
    </div>
    <div class="clr">
      <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.6px;">Institutional Dues &amp; Departmental Clearance</div>
      <div class="clr-grid">
        <div>${data.accountsClearance !== false ? '✓ Accounts: Cleared' : '• Accounts: Pending'}</div>
        <div>${data.libraryClearance !== false ? '✓ Library: Cleared' : '• Library: Pending'}</div>
        <div>${data.labClearance !== false ? '✓ Labs: Cleared' : '• Labs: Pending'}</div>
        <div>${data.sportsClearance !== false ? '✓ Sports: Cleared' : '• Sports: Pending'}</div>
      </div>
    </div>
    <div class="signs">
      <div><div class="s-line">Registrar / Incharge Admissions</div></div>
      <div class="seal">
        <span>★ ${escapeHtml(branding.monogramInitials || 'SEAL')} ★</span>
        <span style="font-size:10px;margin:2px 0;">SEALED</span>
        <span>${escapeHtml(branding.stampLabel === 'NONE' ? 'VERIFIED' : branding.stampLabel)}</span>
      </div>
      <div><div class="s-line">${escapeHtml(data.issuedBy)}<br/><span style="font-size:9px;color:#64748b;font-weight:600;">${escapeHtml(branding.signatoryTitle)}</span></div></div>
    </div>
    <div class="ver">
      <div>${barcodeSvg}<div style="font-size:9px;color:#64748b;margin-top:4px;">${escapeHtml(branding.footerNote)}</div></div>
      <div>${qrSvg}</div>
    </div>
  </div>
</body>
</html>`;
}


