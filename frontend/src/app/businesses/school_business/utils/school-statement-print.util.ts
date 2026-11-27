import { buildCode128SvgMarkup } from '../../../shared/hardware/barcode.component';
import { buildQrCodeSvgMarkup } from '../../../shared/hardware/qr-code.util';
import { ThermalPaperWidth } from '../../../shared/hardware/thermal-print.util';
import {
  DEFAULT_SCHOOL_PRINT_BRANDING,
  SchoolPrintBrandingConfig,
  sanitizeBrandingLogoUrl
} from './school-print-templates.util';

export interface StatementDataset {
  tableId: string;
  title: string;
  subtitle?: string;
  roleLabel?: string;
  headers: string[];
  rows: string[][];
  dateColHint?: number;
}

export interface StatementAmountColumnTotal {
  colIndex: number;
  label: string;
  total: number;
  kind: 'credit' | 'debit' | 'neutral';
}

export interface StatementSummaryMetrics {
  amountColumns: StatementAmountColumnTotal[];
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  primaryTotal: number;
  hasInflowOutflowSplit: boolean;
  currency: string;
}

export interface StatementFilterCriteria {
  searchQuery?: string;
  fromDate?: string;
  toDate?: string;
}

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11
};

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toDayStartMs(year: number, monthZeroIdx: number, day: number): number | null {
  if (!Number.isFinite(year) || !Number.isFinite(monthZeroIdx) || !Number.isFinite(day)) return null;
  if (year < 1990 || year > 2100 || monthZeroIdx < 0 || monthZeroIdx > 11 || day < 1 || day > 31) return null;
  const d = new Date(year, monthZeroIdx, day, 0, 0, 0, 0);
  return Number.isFinite(d.getTime()) ? d.getTime() : null;
}

/**
 * Parses common date representations across School Business ledgers:
 * - YYYY-MM-DD / ISO timestamps
 * - DD MMM YYYY (e.g. "26 Nov 2026, 10:15 AM" or "10th Oct 2026")
 * - MMM DD, YYYY (e.g. "Oct 28, 2026")
 * - DD/MM/YYYY or DD-MM-YYYY
 * - Month YYYY (e.g. "November 2026" -> maps to 1st of month)
 */
export function parseStatementDateMs(raw: unknown): number | null {
  const str = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!str || str === '-' || str === '—') return null;

  // 1. ISO YYYY-MM-DD (at start or embedded in timestamp)
  const isoMatch = str.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    return toDayStartMs(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmySlash = str.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (dmySlash) {
    const first = Number(dmySlash[1]);
    const second = Number(dmySlash[2]);
    const yr = Number(dmySlash[3]);
    if (second <= 12) return toDayStartMs(yr, second - 1, first);
    if (first <= 12) return toDayStartMs(yr, first - 1, second);
  }

  // 3. "26 Nov 2026" or "10th Oct 2026"
  const dMonY = str.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9}),?\s+(\d{4})\b/);
  if (dMonY) {
    const mIdx = MONTH_NAME_MAP[dMonY[2].toLowerCase()];
    if (mIdx !== undefined) {
      return toDayStartMs(Number(dMonY[3]), mIdx, Number(dMonY[1]));
    }
  }

  // 4. "Nov 26, 2026" or "November 7 2026"
  const monDY = str.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
  if (monDY) {
    const mIdx = MONTH_NAME_MAP[monDY[1].toLowerCase()];
    if (mIdx !== undefined) {
      return toDayStartMs(Number(monDY[3]), mIdx, Number(monDY[2]));
    }
  }

  // 5. "November 2026" / "Oct 2026"
  const monY = str.match(/\b([A-Za-z]{3,9})\s+(\d{4})\b/);
  if (monY) {
    const mIdx = MONTH_NAME_MAP[monY[1].toLowerCase()];
    if (mIdx !== undefined) {
      return toDayStartMs(Number(monY[2]), mIdx, 1);
    }
  }

  return null;
}

export function extractRowDateMs(headers: string[], row: string[], dateColHint?: number): number | null {
  if (typeof dateColHint === 'number' && dateColHint >= 0 && dateColHint < row.length) {
    const direct = parseStatementDateMs(row[dateColHint]);
    if (direct !== null) return direct;
  }

  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toLowerCase();
    if (/date|time|month|session|issued|due|sent|created|appointment|period/.test(h)) {
      const hit = parseStatementDateMs(row[i]);
      if (hit !== null) return hit;
    }
  }

  for (let i = 0; i < row.length; i++) {
    const hit = parseStatementDateMs(row[i]);
    if (hit !== null) return hit;
  }

  return null;
}

export function filterStatementRows(
  headers: string[],
  rows: string[][],
  criteria: StatementFilterCriteria,
  dateColHint?: number
): {
  filteredRows: string[][];
  datedRowCount: number;
} {
  const q = String(criteria.searchQuery || '').trim().toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const fromMs = criteria.fromDate ? parseStatementDateMs(criteria.fromDate) : null;
  const toMsRaw = criteria.toDate ? parseStatementDateMs(criteria.toDate) : null;
  const toMs = toMsRaw !== null ? toMsRaw + 86399999 : null;

  let datedRowCount = 0;
  const filteredRows = rows.filter((row) => {
    if (terms.length > 0) {
      const joined = row.join(' ').toLowerCase();
      for (const term of terms) {
        if (!joined.includes(term)) return false;
      }
    }

    const rowDateMs = extractRowDateMs(headers, row, dateColHint);
    if (rowDateMs !== null) datedRowCount++;

    if (fromMs !== null || toMs !== null) {
      if (rowDateMs === null) return false;
      if (fromMs !== null && rowDateMs < fromMs) return false;
      if (toMs !== null && rowDateMs > toMs) return false;
    }

    return true;
  });

  return { filteredRows, datedRowCount };
}

export function parseAmountNumber(raw: unknown): number | null {
  const str = String(raw ?? '').trim();
  if (!str || str === '-' || str === '—') return null;
  // Reject phone numbers, dates, CNICs, percentages, or roll identifiers with multiple dashes
  if (/^\+?\d{2,4}[\s-]\d{3}[\s-]\d{4,}/.test(str)) return null;
  if (/%/.test(str)) return null;
  if (/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/.test(str)) return null;

  // Match PKR / currency prefixed or pure formatted numbers (supporting optional leading minus)
  const currencyMatch = str.match(/(?:PKR|USD|AED|SAR|GBP|RS\.?)\s*([+-]?\s*[\d,]+(?:\.\d+)?)/i);
  if (currencyMatch) {
    const cleaned = currencyMatch[1].replace(/[\s,]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  if (/^[+-]?\s*[\d,]+(?:\.\d+)?$/.test(str)) {
    const n = Number(str.replace(/[\s,]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

export function formatStatementMoney(amount: number, currency = 'PKR'): string {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return '0';
  const cur = String(currency || 'PKR').toUpperCase();
  if (cur === 'PKR') return Math.round(n).toLocaleString('en-PK');
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function computeStatementAmounts(
  headers: string[],
  rows: string[][],
  currency = 'PKR'
): StatementSummaryMetrics {
  const cur = String(currency || 'PKR').toUpperCase();
  const amountColumns: StatementAmountColumnTotal[] = [];

  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    const h = String(headers[colIdx] || '').trim();
    const hl = h.toLowerCase();
    // Skip non-additive identifier / count columns
    if (/roll|phone|cnic|ref|slip|challan|receipt|voucher|code|id\b|count|students|months|rate\b|%/i.test(hl) &&
        !/amount|pkr|bakaya|arrears|salary|billed|collected|debit|credit|inflow|outflow|fee|balance|fine|margin|expense|income|deposit|total/i.test(hl)) {
      continue;
    }

    const headerLooksFinancial = /amount|pkr|debit|credit|aamdani|kharcha|inflow|outflow|fee|bakaya|arrears|salary|billed|collected|balance|margin|nafa|expense|income|fine|total|variance|deposit|cash|meezan|hbl|digital|petty|pay/i.test(hl);
    let numericHits = 0;
    let currencyTokenHits = 0;
    let sum = 0;

    for (const row of rows) {
      const cell = row[colIdx] ?? '';
      if (/(?:PKR|USD|AED|SAR|GBP|RS\.?)/i.test(String(cell))) {
        currencyTokenHits++;
      }
      const n = parseAmountNumber(cell);
      if (n !== null) {
        numericHits++;
        sum += n;
      }
    }

    if ((headerLooksFinancial && numericHits > 0) || currencyTokenHits > 0) {
      const isDebit = /debit|kharcha|outflow|expense|petty|bakaya|arrears|fine/.test(hl);
      const isCredit = /credit|aamdani|inflow|income|collected|receipt|deposit|salary|billed|fee|cash|meezan|hbl|digital|margin|nafa/.test(hl);
      amountColumns.push({
        colIndex: colIdx,
        label: h,
        total: sum,
        kind: isDebit && !isCredit ? 'debit' : (isCredit && !isDebit ? 'credit' : 'neutral')
      });
    }
  }

  let totalCredit = 0;
  let totalDebit = 0;
  for (const col of amountColumns) {
    if (col.kind === 'credit') totalCredit += col.total;
    else if (col.kind === 'debit') totalDebit += col.total;
  }

  const hasInflowOutflowSplit = totalCredit > 0 && totalDebit > 0;
  const netBalance = hasInflowOutflowSplit
    ? totalCredit - totalDebit
    : (amountColumns[0]?.total ?? 0);

  const primaryTotal = hasInflowOutflowSplit
    ? netBalance
    : (amountColumns.find((c) => /net|total|amount|collected|bakaya|arrears|balance/i.test(c.label))?.total ??
       amountColumns[0]?.total ??
       0);

  return {
    amountColumns,
    totalCredit,
    totalDebit,
    netBalance,
    primaryTotal,
    hasInflowOutflowSplit,
    currency: cur
  };
}

export function buildStatementCriteriaSubtitle(
  criteria: StatementFilterCriteria,
  filteredCount: number,
  totalCount: number
): string {
  const parts: string[] = [];
  if (criteria.fromDate && criteria.toDate) {
    parts.push(`Period: ${criteria.fromDate} to ${criteria.toDate}`);
  } else if (criteria.fromDate) {
    parts.push(`From: ${criteria.fromDate}`);
  } else if (criteria.toDate) {
    parts.push(`Up to: ${criteria.toDate}`);
  } else {
    parts.push('Period: All Dates');
  }
  if (criteria.searchQuery?.trim()) {
    parts.push(`Filter: "${criteria.searchQuery.trim()}"`);
  }
  parts.push(`Records: ${filteredCount}${totalCount > filteredCount ? ` of ${totalCount}` : ''}`);
  return parts.join(' · ');
}

export interface BuildStatementDocumentParams {
  title: string;
  subtitle?: string;
  roleLabel?: string;
  headers: string[];
  rows: string[][];
  totalUnfilteredCount?: number;
  criteria: StatementFilterCriteria;
  branding?: SchoolPrintBrandingConfig;
  statementRef?: string;
}

export function buildSchoolStatementA4Html(params: BuildStatementDocumentParams): string {
  const b = params.branding || DEFAULT_SCHOOL_PRINT_BRANDING;
  const cur = String(b.currencySymbol || 'PKR').toUpperCase();
  const safeLogo = sanitizeBrandingLogoUrl(b.logoDataUrl);
  const monogram = (b.monogramInitials || 'SPA').trim().slice(0, 4);
  const logoSize = Math.min(72, Math.max(30, Number(b.logoSizePx || 44)));
  const summary = computeStatementAmounts(params.headers, params.rows, cur);
  const totalCount = params.totalUnfilteredCount ?? params.rows.length;
  const criteriaLine = buildStatementCriteriaSubtitle(params.criteria, params.rows.length, totalCount);
  const stmtRef = params.statementRef || `STM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const issuedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const barcodeSvg = buildCode128SvgMarkup(stmtRef, 32, '#0f172a');
  const qrPayload = `STATEMENT:${stmtRef}|TITLE:${params.title}|RECORDS:${params.rows.length}|FROM:${params.criteria.fromDate || 'ALL'}|TO:${params.criteria.toDate || 'ALL'}|NET:${cur} ${Math.round(summary.primaryTotal)}`;
  const qrSvg = buildQrCodeSvgMarkup(qrPayload, 64, '#0f172a', 2, 'M');

  const logoMarkup = b.showLogoCrest === false
    ? ''
    : (safeLogo
        ? `<div class="logo-box"><img src="${safeLogo}" alt="School Logo" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;display:block;" /></div>`
        : `<div class="crest-box">${escapeHtml(monogram)}</div>`);

  const isSingleRecord = params.rows.length === 1;
  const stampBadge = b.stampLabel && b.stampLabel !== 'NONE' ? b.stampLabel : 'VERIFIED';
  const amountColSet = new Set(summary.amountColumns.map((c) => c.colIndex));
  const amountMap = new Map(summary.amountColumns.map((c) => [c.colIndex, c]));

  const summaryBoxes = summary.amountColumns.slice(0, 4).map((col) => `
    <div class="sum-card">
      <div class="sum-lbl">${escapeHtml(col.label)}</div>
      <div class="sum-val ${col.kind === 'debit' ? 'debit' : (col.kind === 'credit' ? 'credit' : '')}">${escapeHtml(cur)} ${formatStatementMoney(col.total, cur)}</div>
    </div>`).join('');

  const netBox = summary.hasInflowOutflowSplit
    ? `<div class="sum-card net">
        <div class="sum-lbl">Net Statement Balance</div>
        <div class="sum-val">${escapeHtml(cur)} ${formatStatementMoney(summary.netBalance, cur)}</div>
      </div>`
    : '';

  const singleRecordGrid = isSingleRecord
    ? `<div class="voucher-grid">
        ${params.headers.map((h, i) => {
          const val = String(params.rows[0]?.[i] ?? '').trim() || '—';
          const isAmt = amountColSet.has(i);
          return `<div class="v-field ${isAmt ? 'v-amt' : ''}">
            <div class="v-lbl">${escapeHtml(h || `Field ${i + 1}`)}</div>
            <div class="v-val ${isAmt ? 'num' : ''}">${escapeHtml(val)}</div>
          </div>`;
        }).join('')}
      </div>`
    : '';

  const thCells = params.headers.map((h, i) =>
    `<th class="${amountColSet.has(i) ? 'num' : ''}">${escapeHtml(h)}</th>`
  ).join('');

  const bodyRows = params.rows.length === 0
    ? `<tr><td colspan="${Math.max(1, params.headers.length)}" class="empty">No records matched the selected search or date range.</td></tr>`
    : params.rows.map((r, idx) => `
      <tr class="${idx % 2 === 1 ? 'alt' : ''}">
        ${params.headers.map((_, cIdx) => {
          const val = r[cIdx] ?? '-';
          return `<td class="${amountColSet.has(cIdx) ? 'num' : ''}">${escapeHtml(val || '-')}</td>`;
        }).join('')}
      </tr>`).join('');

  const tfootRow = summary.amountColumns.length > 0 && params.rows.length > 0
    ? `<tfoot>
        <tr>
          ${params.headers.map((_, cIdx) => {
            if (cIdx === 0) return `<td>STATEMENT TOTAL (${params.rows.length} Rows)</td>`;
            const hit = amountMap.get(cIdx);
            if (hit) return `<td class="num">${escapeHtml(cur)} ${formatStatementMoney(hit.total, cur)}</td>`;
            return '<td></td>';
          }).join('')}
        </tr>
      </tfoot>`
    : '';

  const accent = /^#[0-9a-fA-F]{6}$/.test(b.headerAccentColor || '') ? b.headerAccentColor : '#0f172a';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.title)} — ${escapeHtml(stmtRef)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; font-size: 11px; line-height: 1.4; font-variant-numeric: tabular-nums; }
    .hdr { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2.5px solid ${accent}; padding-bottom: 10px; margin-bottom: 10px; }
    .brand-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .logo-box { border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #fff; flex-shrink: 0; }
    .crest-box { border: 2px solid ${accent}; border-radius: 8px; padding: 8px 13px; font-size: 15px; font-weight: 900; letter-spacing: 1.5px; color: ${accent}; background: #f8fafc; flex-shrink: 0; }
    .school-name { font-size: 17px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; color: #0f172a; }
    .tagline { font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 1px; }
    .contact { font-size: 9.5px; color: #475569; margin-top: 3px; }
    .hdr-right { text-align: right; flex-shrink: 0; }
    .badge { display: inline-block; background: ${accent}; color: #fff; font-size: 9px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; padding: 3px 9px; border-radius: 4px; }
    .meta-line { font-size: 10px; font-weight: 700; color: #334155; margin-top: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .title-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; }
    .stmt-title { font-size: 13.5px; font-weight: 900; color: #0f172a; }
    .stmt-sub { font-size: 10.5px; font-weight: 600; color: #475569; margin-top: 2px; }
    .sum-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .sum-card { flex: 1 1 150px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 10px; background: #fff; }
    .sum-card.net { background: ${accent}; border-color: ${accent}; color: #fff; }
    .sum-card.net .sum-lbl { color: #cbd5e1; }
    .sum-card.net .sum-val { color: #fff; }
    .sum-lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; }
    .sum-val { font-size: 13.5px; font-weight: 900; margin-top: 2px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #0f172a; }
    .sum-val.credit { color: #047857; }
    .sum-val.debit { color: #be123c; }
    .voucher-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
    .v-field { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; background: #fff; }
    .v-field.v-amt { background: #f8fafc; border-color: #94a3b8; }
    .v-lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 2px; }
    .v-val { font-size: 11.5px; font-weight: 800; color: #0f172a; word-break: break-word; }
    .v-val.num { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; font-weight: 900; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; }
    thead th { background: #f1f5f9; color: #1e293b; font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px; text-align: left; padding: 7px 8px; border-bottom: 1.5px solid #94a3b8; border-right: 1px solid #e2e8f0; }
    thead th.num, tbody td.num, tfoot td.num { text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
    tbody td { padding: 6px 8px; font-size: 10.5px; color: #0f172a; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; vertical-align: top; }
    tbody tr.alt { background: #f8fafc; }
    tfoot td { background: ${accent}; color: #fff; font-weight: 900; font-size: 10.5px; padding: 7px 8px; }
    .empty { text-align: center; padding: 20px; font-weight: 700; color: #64748b; }
    .footer-grid { margin-top: 14px; padding-top: 10px; border-top: 1.5px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .verif-block { display: flex; align-items: center; gap: 12px; }
    .sign-block { text-align: right; }
    .sign-line { border-top: 1.5px solid #0f172a; padding-top: 4px; min-width: 190px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; }
    .foot-note { font-size: 9px; color: #64748b; margin-top: 5px; max-width: 440px; }
  </style>
</head>
<body>
  <div class="hdr">
    <div class="brand-left">
      ${b.logoPlacement === 'right' ? '' : logoMarkup}
      <div>
        <div class="school-name">${escapeHtml(b.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName)}</div>
        ${b.campusTagline ? `<div class="tagline">${escapeHtml(b.campusTagline)}</div>` : ''}
        <div class="contact">
          ${[b.registrationNo, b.address, b.phone ? `Tel: ${b.phone}` : ''].filter(Boolean).map(escapeHtml).join(' · ')}
        </div>
      </div>
      ${b.logoPlacement === 'right' ? logoMarkup : ''}
    </div>
    <div class="hdr-right">
      <span class="badge">${escapeHtml(stampBadge)} ${isSingleRecord ? 'RECORD SLIP' : 'STATEMENT'}</span>
      <div class="meta-line">Ref: ${escapeHtml(stmtRef)}</div>
      <div class="meta-line">Issued: ${escapeHtml(issuedAt)}</div>
    </div>
  </div>

  <div class="title-bar">
    <div>
      <div class="stmt-title">${escapeHtml(params.title)}</div>
      <div class="stmt-sub">${escapeHtml(isSingleRecord ? `Official Individual Record Voucher${params.roleLabel ? ` · ${params.roleLabel}` : ''}` : `${criteriaLine}${params.roleLabel ? ` · ${params.roleLabel}` : ''}`)}</div>
    </div>
  </div>

  ${(summaryBoxes || netBox) ? `<div class="sum-grid">${summaryBoxes}${netBox}</div>` : ''}

  ${isSingleRecord ? singleRecordGrid : `<table>
    <thead><tr>${thCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
    ${tfootRow}
  </table>`}

  <div class="footer-grid">
    <div class="verif-block">
      ${b.showQrVerification !== false ? `<div>${qrSvg}</div>` : ''}
      <div>
        ${b.showBarcodeVerification !== false ? `<div>${barcodeSvg}</div>` : ''}
        <div class="foot-note">${escapeHtml(b.footerNote || DEFAULT_SCHOOL_PRINT_BRANDING.footerNote)}</div>
      </div>
    </div>
    <div class="sign-block">
      <div class="sign-line">${escapeHtml(b.signatoryTitle || 'Principal & Accounts Directorate')}</div>
      ${b.website ? `<div class="foot-note">${escapeHtml(b.website)}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

export function buildSchoolStatementThermalHtml(
  params: BuildStatementDocumentParams,
  paperWidth: ThermalPaperWidth = '80mm'
): string {
  const b = params.branding || DEFAULT_SCHOOL_PRINT_BRANDING;
  const effectivePaper: ThermalPaperWidth = paperWidth === '58mm' ? '58mm' : '80mm';
  const pageMm = effectivePaper;
  const cur = String(b.currencySymbol || 'PKR').toUpperCase();
  const safeLogo = sanitizeBrandingLogoUrl(b.logoDataUrl);
  const monogram = (b.monogramInitials || 'SPA').trim().slice(0, 4);
  const logoSize = Math.min(64, Math.max(24, Number(b.logoSizePx || 40)));
  const summary = computeStatementAmounts(params.headers, params.rows, cur);
  const totalCount = params.totalUnfilteredCount ?? params.rows.length;
  const stmtRef = params.statementRef || `STM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const issuedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const stampBadge = b.stampLabel && b.stampLabel !== 'NONE' ? b.stampLabel : 'VERIFIED';

  const barcodeSvg = buildCode128SvgMarkup(stmtRef, effectivePaper === '58mm' ? 26 : 32, '#000000');
  const qrPayload = `STM:${stmtRef}|${params.title}|ROWS:${params.rows.length}|NET:${cur} ${Math.round(summary.primaryTotal)}`;
  const qrSvg = buildQrCodeSvgMarkup(qrPayload, effectivePaper === '58mm' ? 56 : 68, '#000000', 2, 'M');

  const logoHtml = b.showLogoCrest === false
    ? ''
    : (safeLogo
        ? `<div class="logo-frame"><img src="${safeLogo}" alt="Logo" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;display:block;" /></div>`
        : `<div class="crest">${escapeHtml(monogram)}</div>`);

  const isSingleRecord = params.rows.length === 1;
  const amountIdxSet = new Set(summary.amountColumns.map((c) => c.colIndex));
  const amountColList = summary.amountColumns;

  // Compact itemized thermal receipt entries (multi-row) or full record fields (single-row slip)
  const maxThermalRows = 120;
  const displayRows = params.rows.slice(0, maxThermalRows);
  const singleRowDetailMarkup = isSingleRecord
    ? params.headers.map((h, i) => {
        const v = String(params.rows[0]?.[i] ?? '').trim();
        if (!v || v === '-' || v === '—') return '';
        if (amountIdxSet.has(i)) return '';
        return `<div class="kv-row"><span class="lbl">${escapeHtml(h || `Field ${i + 1}`)}</span><span class="val">${escapeHtml(v)}</span></div>`;
      }).filter(Boolean).join('')
    : '';

  const itemsMarkup = isSingleRecord
    ? (singleRowDetailMarkup || `<div class="empty">No details available.</div>`)
    : (displayRows.length === 0
      ? `<div class="empty">No matching records found.</div>`
      : displayRows.map((r, idx) => {
          const textCols: string[] = [];
          const amtCols: string[] = [];
          for (let i = 0; i < params.headers.length; i++) {
            const v = String(r[i] ?? '').trim();
            if (!v || v === '-' || v === '—') continue;
            if (amountIdxSet.has(i)) {
              amtCols.push(`${params.headers[i]}: ${v}`);
            } else {
              textCols.push(v);
            }
          }
          const primaryTitle = textCols[0] || `Entry #${idx + 1}`;
          const secondaryMeta = textCols.slice(1, 4).join(' · ');
          const primaryAmt = amtCols.length > 0 ? amtCols[amtCols.length - 1] : '';
          return `<div class="item-row">
            <div class="item-top">
              <span class="item-title">${idx + 1}. ${escapeHtml(primaryTitle)}</span>
              ${primaryAmt ? `<span class="item-amt">${escapeHtml(primaryAmt.replace(/^[^:]+:\s*/, ''))}</span>` : ''}
            </div>
            ${secondaryMeta ? `<div class="item-meta">${escapeHtml(secondaryMeta)}</div>` : ''}
            ${amtCols.length > 1 ? `<div class="item-meta">${escapeHtml(amtCols.slice(0, -1).join(' | '))}</div>` : ''}
          </div>`;
        }).join(''));

  const overflowNote = !isSingleRecord && params.rows.length > maxThermalRows
    ? `<div class="item-meta" style="text-align:center;margin-top:4px;">+ ${params.rows.length - maxThermalRows} more rows in A4 / PDF export</div>`
    : '';

  const amountSummaryRows = summary.amountColumns.map((c) => `
    <div class="kv-row">
      <span class="lbl">${escapeHtml(c.label)}</span>
      <span class="val">${escapeHtml(cur)} ${formatStatementMoney(c.total, cur)}</span>
    </div>`).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.title)} (${effectivePaper})</title>
  <style>
    @page { size: ${pageMm} auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 6px; width: ${pageMm}; max-width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: ${effectivePaper === '58mm' ? '9.5px' : '10.5px'}; line-height: 1.36; color: #000; background: #fff; font-variant-numeric: tabular-nums; }
    .hdr-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
    .logo-frame { border: 1px solid #000; border-radius: 4px; padding: 2px; background: #fff; }
    .crest { display: inline-flex; align-items: center; justify-content: center; border: 2px solid #000; border-radius: 5px; padding: 4px 9px; font-size: 12px; font-weight: 900; letter-spacing: 1.4px; }
    .title { font-size: ${effectivePaper === '58mm' ? '11.5px' : '13px'}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; }
    .tagline { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #222; }
    .sub-muted { font-size: 8.5px; color: #222; }
    .doc-rule { margin-top: 6px; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 4px 2px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .doc-title { font-size: 9px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase; }
    .badge-pill { background: #000; color: #fff; padding: 1px 6px; font-size: 8px; font-weight: 900; text-transform: uppercase; border-radius: 2px; }
    .sec-block { margin: 6px 0; border-top: 1px dashed #000; padding-top: 5px; }
    .sec-cap { font-size: 8.5px; font-weight: 900; letter-spacing: 0.7px; text-transform: uppercase; margin-bottom: 3px; }
    .kv-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 2px 0; border-bottom: 1px dotted #d4d4d8; font-size: ${effectivePaper === '58mm' ? '9px' : '10px'}; }
    .kv-row:last-child { border-bottom: none; }
    .kv-row .lbl { font-weight: 600; color: #27272a; }
    .kv-row .val { font-weight: 700; color: #000; text-align: right; }
    .item-row { padding: 3.5px 0; border-bottom: 1px dotted #cbd5e1; }
    .item-row:last-child { border-bottom: none; }
    .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; font-size: ${effectivePaper === '58mm' ? '9px' : '10px'}; }
    .item-title { font-weight: 800; color: #000; }
    .item-amt { font-weight: 900; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .item-meta { font-size: 8.5px; color: #3f3f46; line-height: 1.25; }
    .total-box { border-top: 2px solid #000; border-bottom: 2px solid #000; margin: 7px 0 4px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; background: #000; color: #fff; padding: 5px 7px; font-size: ${effectivePaper === '58mm' ? '10.5px' : '11.5px'}; font-weight: 900; }
    .ver-box { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; text-align: center; }
    .ver-cap { font-size: 8px; font-weight: 900; letter-spacing: 0.9px; text-transform: uppercase; margin-bottom: 4px; }
    .barcode-label { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8.5px; font-weight: 800; margin-top: 2px; }
    .qr-wrap { margin-top: 5px; display: flex; flex-direction: column; align-items: center; }
    .sign-line { margin-top: 18px; border-top: 1px solid #000; padding-top: 3px; font-size: 8px; font-weight: 800; text-align: center; text-transform: uppercase; }
    .footer { font-size: 8px; text-align: center; margin-top: 5px; }
    .empty { text-align: center; padding: 10px 4px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="hdr-wrap">
    ${logoHtml}
    <div class="title">${escapeHtml(b.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName)}</div>
    ${b.campusTagline ? `<div class="tagline">${escapeHtml(b.campusTagline)}</div>` : ''}
    ${b.address ? `<div class="sub-muted">${escapeHtml(b.address)}</div>` : ''}
    ${b.phone ? `<div class="sub-muted">Tel: ${escapeHtml(b.phone)}</div>` : ''}
  </div>

  <div class="doc-rule">
    <span class="doc-title">${escapeHtml(params.title)}</span>
    <span class="badge-pill">${escapeHtml(stampBadge)}</span>
  </div>

  <div class="sec-block" style="border-top:none;">
    <div class="kv-row"><span class="lbl">${isSingleRecord ? 'Slip Ref' : 'Statement Ref'}</span><span class="val">${escapeHtml(stmtRef)}</span></div>
    ${!isSingleRecord ? `<div class="kv-row"><span class="lbl">Date Range</span><span class="val">${escapeHtml((params.criteria.fromDate || 'Start') + ' → ' + (params.criteria.toDate || 'Latest'))}</span></div>` : ''}
    ${!isSingleRecord && params.criteria.searchQuery?.trim() ? `<div class="kv-row"><span class="lbl">Search Filter</span><span class="val">${escapeHtml(params.criteria.searchQuery.trim())}</span></div>` : ''}
    ${!isSingleRecord ? `<div class="kv-row"><span class="lbl">Records</span><span class="val">${params.rows.length}${totalCount > params.rows.length ? ` / ${totalCount}` : ''}</span></div>` : ''}
    <div class="kv-row"><span class="lbl">Printed At</span><span class="val">${escapeHtml(issuedAt)}</span></div>
  </div>

  <div class="sec-block">
    <div class="sec-cap">${isSingleRecord ? 'RECORD PARTICULARS' : 'ITEMIZED ENTRIES'}</div>
    ${itemsMarkup}
    ${overflowNote}
  </div>

  ${amountColList.length > 0 ? `
  <div class="sec-block">
    <div class="sec-cap">AMOUNT SUMMARY</div>
    ${amountSummaryRows}
    <div class="total-box">
      <div class="total-row">
        <span>${isSingleRecord ? 'TOTAL AMOUNT' : (summary.hasInflowOutflowSplit ? 'NET BALANCE' : 'STATEMENT TOTAL')}</span>
        <span>${escapeHtml(cur)} ${formatStatementMoney(summary.primaryTotal, cur)}</span>
      </div>
    </div>
  </div>` : ''}

  ${(b.showBarcodeVerification !== false || b.showQrVerification !== false) ? `
  <div class="ver-box">
    <div class="ver-cap">VERIFICATION</div>
    ${b.showBarcodeVerification !== false ? `<div>${barcodeSvg}<div class="barcode-label">${escapeHtml(stmtRef)}</div></div>` : ''}
    ${b.showQrVerification !== false ? `<div class="qr-wrap">${qrSvg}</div>` : ''}
  </div>` : ''}

  ${b.signatoryTitle ? `<div class="sign-line">${escapeHtml(b.signatoryTitle)}</div>` : ''}
  <div class="footer">${escapeHtml(b.footerNote || DEFAULT_SCHOOL_PRINT_BRANDING.footerNote)} (${effectivePaper.toUpperCase()})</div>
</body>
</html>`;
}

export function buildSchoolStatementWhatsAppText(params: BuildStatementDocumentParams): string {
  const b = params.branding || DEFAULT_SCHOOL_PRINT_BRANDING;
  const cur = String(b.currencySymbol || 'PKR').toUpperCase();
  const summary = computeStatementAmounts(params.headers, params.rows, cur);
  const totalCount = params.totalUnfilteredCount ?? params.rows.length;
  const stmtRef = params.statementRef || `STM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const periodLabel = params.criteria.fromDate || params.criteria.toDate
    ? `${params.criteria.fromDate || 'Beginning'} to ${params.criteria.toDate || 'Today'}`
    : 'All Dates';

  const isSingleRecord = params.rows.length === 1;
  const lines: string[] = [
    `*${(b.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName).toUpperCase()}*`,
    `📄 *${params.title}*`,
    isSingleRecord ? `Slip Ref: ${stmtRef}` : `Ref: ${stmtRef} | Period: ${periodLabel}`,
    ...(!isSingleRecord && params.criteria.searchQuery?.trim() ? [`Search Filter: "${params.criteria.searchQuery.trim()}"`] : []),
    ...(!isSingleRecord ? [`Records Matched: ${params.rows.length}${totalCount > params.rows.length ? ` of ${totalCount}` : ''}`] : []),
    `--------------------------------`
  ];

  const maxLines = 35;
  const slice = params.rows.slice(0, maxLines);
  if (slice.length === 0) {
    lines.push('_No records matched the selected filter._');
  } else if (isSingleRecord) {
    const row = slice[0];
    params.headers.forEach((hdr, cIdx) => {
      const val = String(row[cIdx] ?? '').trim();
      if (!val || val === '-' || val === '—') return;
      lines.push(`• *${hdr || `Field ${cIdx + 1}`}:* ${val}`);
    });
  } else {
    slice.forEach((r, idx) => {
      const compact = r
        .map((cell, cIdx) => {
          const val = String(cell ?? '').trim();
          if (!val || val === '-' || val === '—') return '';
          return `${params.headers[cIdx] || `F${cIdx + 1}`}: ${val}`;
        })
        .filter(Boolean)
        .slice(0, 5)
        .join(' | ');
      lines.push(`${idx + 1}. ${compact}`);
    });
    if (params.rows.length > maxLines) {
      lines.push(`... +${params.rows.length - maxLines} more records (see attached PDF/Print).`);
    }
  }

  if (summary.amountColumns.length > 0) {
    lines.push(`--------------------------------`);
    lines.push(`*AMOUNT SUMMARY*`);
    for (const col of summary.amountColumns) {
      lines.push(`• ${col.label}: *${cur} ${formatStatementMoney(col.total, cur)}*`);
    }
    if (summary.hasInflowOutflowSplit) {
      lines.push(`• *Net Balance: ${cur} ${formatStatementMoney(summary.netBalance, cur)}*`);
    }
  }

  lines.push(`--------------------------------`);
  lines.push(`${b.address || ''}${b.phone ? ` · Tel: ${b.phone}` : ''}`);
  return lines.filter((l) => l.trim() !== '').join('\n');
}

export function buildSchoolStatementCardHtml(params: BuildStatementDocumentParams): string {
  const b = params.branding || DEFAULT_SCHOOL_PRINT_BRANDING;
  const cur = String(b.currencySymbol || 'PKR').toUpperCase();
  const safeLogo = sanitizeBrandingLogoUrl(b.logoDataUrl);
  const monogram = (b.monogramInitials || 'SPA').trim().slice(0, 4);
  const logoSize = Math.min(64, Math.max(32, Number(b.logoSizePx || 44)));
  const summary = computeStatementAmounts(params.headers, params.rows, cur);
  const stmtRef = params.statementRef || `CRD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const issuedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const stampBadge = b.stampLabel && b.stampLabel !== 'NONE' ? b.stampLabel : 'VERIFIED';
  const accent = /^#[0-9a-fA-F]{6}$/.test(b.headerAccentColor || '') ? b.headerAccentColor : '#0f172a';
  const row = params.rows[0] || [];
  const qrPayload = `CARD:${stmtRef}|${params.title}|NET:${cur} ${Math.round(summary.primaryTotal)}`;
  const qrSvg = buildQrCodeSvgMarkup(qrPayload, 96, '#0f172a', 2, 'M');
  const barcodeSvg = buildCode128SvgMarkup(stmtRef, 30, '#0f172a');

  const logoMarkup = b.showLogoCrest === false
    ? ''
    : (safeLogo
        ? `<div class="logo-box"><img src="${safeLogo}" alt="School Logo" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;display:block;" /></div>`
        : `<div class="crest-box">${escapeHtml(monogram)}</div>`);

  const fieldsHtml = params.headers.map((h, i) => {
    const val = String(row[i] ?? '').trim() || '—';
    return `<div class="f-box">
      <div class="f-lbl">${escapeHtml(h || `Field ${i + 1}`)}</div>
      <div class="f-val">${escapeHtml(val)}</div>
    </div>`;
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.title)} — QR Card (${escapeHtml(stmtRef)})</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; font-variant-numeric: tabular-nums; }
    .card { max-width: 640px; margin: 0 auto; border: 2px solid ${accent}; border-radius: 16px; overflow: hidden; }
    .card-top { background: ${accent}; color: #fff; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-box { background: #fff; border-radius: 8px; padding: 4px; flex-shrink: 0; }
    .crest-box { background: rgba(255,255,255,0.16); border: 1.5px solid rgba(255,255,255,0.55); border-radius: 8px; padding: 7px 11px; font-weight: 900; font-size: 14px; letter-spacing: 1.4px; flex-shrink: 0; }
    .s-name { font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; }
    .s-tag { font-size: 9px; opacity: 0.85; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
    .badge { background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.45); padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; letter-spacing: 0.9px; text-transform: uppercase; white-space: nowrap; }
    .card-body { padding: 16px 18px; }
    .hero { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 1.5px dashed #cbd5e1; margin-bottom: 14px; }
    .doc-title { font-size: 14px; font-weight: 900; color: #0f172a; }
    .doc-sub { font-size: 10.5px; color: #475569; margin-top: 3px; font-weight: 600; }
    .qr-panel { text-align: center; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px; background: #f8fafc; flex-shrink: 0; }
    .qr-cap { font-size: 8px; font-weight: 900; letter-spacing: 0.7px; text-transform: uppercase; color: #475569; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .f-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; background: #f8fafc; }
    .f-lbl { font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .f-val { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px; word-break: break-word; }
    .card-foot { margin-top: 14px; padding-top: 12px; border-top: 1.5px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
    .foot-note { font-size: 9px; color: #64748b; margin-top: 4px; }
    .sign { border-top: 1.5px solid #0f172a; padding-top: 4px; min-width: 170px; text-align: right; font-size: 9.5px; font-weight: 800; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-top">
      <div class="brand">
        ${logoMarkup}
        <div>
          <div class="s-name">${escapeHtml(b.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName)}</div>
          ${b.campusTagline ? `<div class="s-tag">${escapeHtml(b.campusTagline)}</div>` : ''}
        </div>
      </div>
      <div class="badge">${escapeHtml(stampBadge)} PASS</div>
    </div>
    <div class="card-body">
      <div class="hero">
        <div>
          <div class="doc-title">${escapeHtml(params.title)}</div>
          <div class="doc-sub">Ref: ${escapeHtml(stmtRef)} · Issued: ${escapeHtml(issuedAt)}</div>
          ${params.roleLabel ? `<div class="doc-sub">${escapeHtml(params.roleLabel)}</div>` : ''}
        </div>
        ${b.showQrVerification !== false ? `<div class="qr-panel">${qrSvg}<div class="qr-cap">SCAN TO VERIFY</div></div>` : ''}
      </div>
      ${params.rows.length > 0 ? `<div class="grid">${fieldsHtml}</div>` : `<div class="doc-sub">Records Included: ${params.rows.length}</div>`}
      <div class="card-foot">
        <div>
          ${b.showBarcodeVerification !== false ? barcodeSvg : ''}
          <div class="foot-note">${escapeHtml(b.footerNote || DEFAULT_SCHOOL_PRINT_BRANDING.footerNote)}</div>
        </div>
        <div class="sign">${escapeHtml(b.signatoryTitle || 'Principal & Accounts Directorate')}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

