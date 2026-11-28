import { buildCode128SvgMarkup } from '../../../shared/hardware/barcode.component';
import { buildQrCodeSvgMarkup } from '../../../shared/hardware/qr-code.util';
import { ThermalPaperWidth } from '../../../shared/hardware/thermal-print.util';
import {
  DEFAULT_SCHOOL_PRINT_BRANDING,
  PrintSectionKey,
  SchoolPrintBrandingConfig,
  resolveEffectiveTableBranding,
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
      const cellStr = String(cell);
      if (/\b(?:PKR|USD|AED|SAR|GBP|RS\.?)\s*[+-]?\s*\d/i.test(cellStr) || /\d\s*(?:PKR|USD|AED|SAR|GBP|RS\.?)\b/i.test(cellStr)) {
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
  tableId?: string;
  canonicalTableId?: string;
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

function buildFieldLogoChipHtml(
  b: SchoolPrintBrandingConfig,
  safeLogo: string,
  monogram: string,
  accent: string
): string {
  if (safeLogo) {
    return `<img src="${safeLogo}" alt="" style="width:12px;height:12px;object-fit:contain;border-radius:2px;flex-shrink:0;opacity:0.85;" />`;
  }
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:3px;background:${accent};color:#fff;font-size:6.5px;font-weight:900;flex-shrink:0;">${escapeHtml(monogram.slice(0, 2))}</span>`;
}

export function buildSchoolStatementA4Html(params: BuildStatementDocumentParams): string {
  const eff = resolveEffectiveTableBranding(params.branding, params.tableId, params.canonicalTableId);
  const b = eff.branding;
  const effectiveTitle = eff.customHeading || params.title;
  const cur = String(b.currencySymbol || 'PKR').toUpperCase();
  const safeLogo = sanitizeBrandingLogoUrl(b.logoDataUrl);
  const monogram = (b.monogramInitials || 'SPA').trim().slice(0, 4);
  const logoSize = Math.min(64, Math.max(28, Number(b.logoSizePx || 42)));
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

  const accent = /^#[0-9a-fA-F]{6}$/.test(b.headerAccentColor || '') ? b.headerAccentColor : '#0f172a';
  const barcodeSvg = buildCode128SvgMarkup(stmtRef, 30, '#0f172a');
  const qrPayload = `STATEMENT:${stmtRef}|TITLE:${effectiveTitle}|RECORDS:${params.rows.length}|FROM:${params.criteria.fromDate || 'ALL'}|TO:${params.criteria.toDate || 'ALL'}|NET:${cur} ${Math.round(summary.primaryTotal)}`;
  const qrSvg = buildQrCodeSvgMarkup(qrPayload, 60, accent, 2, 'M');

  const a4Radius = b.logoShape === 'circle' ? '9999px' : '10px';
  const logoMarkup = b.showLogoCrest === false
    ? ''
    : (safeLogo
        ? `<div class="logo-box" style="border-radius:${a4Radius};overflow:hidden;"><img src="${safeLogo}" alt="School Logo" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;border-radius:${a4Radius};display:block;" /></div>`
        : `<div class="crest-box" style="border-radius:${a4Radius};">${escapeHtml(monogram)}</div>`);

  const fieldChip = eff.showFieldLogos ? buildFieldLogoChipHtml(b, safeLogo, monogram, accent) : '';

  const isSingleRecord = params.rows.length === 1;
  const stampBadge = b.stampLabel && b.stampLabel !== 'NONE' ? b.stampLabel : 'VERIFIED';
  const amountColSet = new Set(summary.amountColumns.map((c) => c.colIndex));
  const amountMap = new Map(summary.amountColumns.map((c) => [c.colIndex, c]));
  const hidden = new Set<PrintSectionKey>(b.hiddenSections || []);

  const headerPlacementClass = b.logoPlacement === 'top'
    ? `brand-col align-${b.headerAlign || 'center'}`
    : (b.logoPlacement === 'right' ? 'brand-row rev' : 'brand-row');

  const textAlignStyle = `text-align:${b.logoPlacement === 'top' ? (b.headerAlign || 'center') : (b.headerAlign || 'left')};`;
  const compactMetaLine = [b.address, b.phone ? `Tel: ${b.phone}` : ''].filter(Boolean).map(escapeHtml).join(' · ');

  const headerSectionHtml = `
    <div class="hdr">
      <div class="brand-wrap ${headerPlacementClass}">
        ${logoMarkup}
        <div style="${textAlignStyle}flex:1;min-width:0;">
          <span class="badge">${escapeHtml(stampBadge)} ${isSingleRecord ? 'RECORD SLIP' : 'STATEMENT'}</span>
          <div class="school-name">${escapeHtml(b.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName)}</div>
          ${compactMetaLine ? `<div class="contact">${compactMetaLine}</div>` : ''}
        </div>
      </div>
      <div class="hdr-right">
        <div class="ref-chip">Ref: ${escapeHtml(stmtRef)}</div>
        <div class="meta-line">${escapeHtml(issuedAt)}</div>
      </div>
    </div>`;

  const metaSectionHtml = `
    <div class="doc-head-row">
      <div class="min-w-0">
        <div class="stmt-title">${escapeHtml(effectiveTitle)}</div>
        <div class="stmt-sub">${escapeHtml(isSingleRecord ? (params.roleLabel || 'Official Campus Record') : `${criteriaLine}${params.roleLabel ? ` · ${params.roleLabel}` : ''}`)}</div>
      </div>
      <div class="orient-tag">${escapeHtml(eff.a4Orientation === 'portrait' ? 'Portrait' : 'Landscape')}</div>
    </div>`;

  const amtItemsHtml = summary.amountColumns.slice(0, 4).map((col) => `
    <div class="amt-chip">
      <span class="amt-chip-lbl">${fieldChip ? `<span class="lbl-row">${fieldChip}<span>${escapeHtml(col.label)}</span></span>` : escapeHtml(col.label)}</span>
      <span class="amt-chip-val ${col.kind === 'debit' ? 'debit' : (col.kind === 'credit' ? 'credit' : '')}">${escapeHtml(cur)} ${formatStatementMoney(col.total, cur)}</span>
    </div>`).join('');

  const amountsSectionHtml = summary.amountColumns.length > 0
    ? `<div class="amt-highlight">
        <div class="amt-main">
          <div>
            <div class="amt-main-lbl">${isSingleRecord ? 'Total Amount' : (summary.hasInflowOutflowSplit ? 'Net Statement Balance' : 'Statement Total')}</div>
            ${summary.amountColumns.length > 1 || summary.hasInflowOutflowSplit ? `<div class="amt-chips">${amtItemsHtml}</div>` : ''}
          </div>
          <div class="amt-main-val">${escapeHtml(cur)} ${formatStatementMoney(summary.primaryTotal, cur)}</div>
        </div>
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
            if (cIdx === 0) return `<td>TOTAL (${params.rows.length} Rows)</td>`;
            const hit = amountMap.get(cIdx);
            if (hit) return `<td class="num">${escapeHtml(cur)} ${formatStatementMoney(hit.total, cur)}</td>`;
            return '<td></td>';
          }).join('')}
        </tr>
      </tfoot>`
    : '';

  const singleRecordGrid = isSingleRecord
    ? `<div class="particulars-card">
        <div class="particulars-hdr">
          <span>Record Particulars</span>
          <span class="particulars-count">${params.headers.length} Field(s)</span>
        </div>
        <div class="particulars-grid">
          ${params.headers.map((h, i) => {
            const val = String(params.rows[0]?.[i] ?? '').trim() || '—';
            const isAmt = amountColSet.has(i);
            return `<div class="p-row">
              <div class="p-lbl">${fieldChip ? `<span class="lbl-row">${fieldChip}<span>${escapeHtml(h || `Field ${i + 1}`)}</span></span>` : escapeHtml(h || `Field ${i + 1}`)}</div>
              <div class="p-val ${isAmt ? 'num' : ''}">${escapeHtml(val)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`
    : '';

  const personSectionHtml = isSingleRecord && eff.slipLayout === 'voucher_grid'
    ? singleRecordGrid
    : `<div class="tbl-wrap"><table>
        <thead><tr>${thCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
        ${tfootRow}
      </table></div>`;

  const showBarcode = b.showBarcodeVerification !== false;
  const showQr = b.showQrVerification !== false;
  const verFirst = b.verificationOrder === 'qr_first'
    ? `${showQr ? `<div>${qrSvg}</div>` : ''}${showBarcode ? `<div class="bar-box">${barcodeSvg}<div class="bar-ref">${escapeHtml(stmtRef)}</div></div>` : ''}`
    : `${showBarcode ? `<div class="bar-box">${barcodeSvg}<div class="bar-ref">${escapeHtml(stmtRef)}</div></div>` : ''}${showQr ? `<div>${qrSvg}</div>` : ''}`;

  const verificationSectionHtml = (showBarcode || showQr)
    ? `<div class="ver-strip ${b.verificationOrder === 'side_by_side' ? 'side' : ''}">${verFirst}</div>`
    : '';

  const footerSectionHtml = `
    <div class="footer-grid">
      <div class="foot-note">${escapeHtml(b.footerNote || DEFAULT_SCHOOL_PRINT_BRANDING.footerNote)}</div>
      <div class="sign-block">
        <div class="sign-line">${escapeHtml(b.signatoryTitle || 'Principal & Accounts Directorate')}</div>
        ${b.website ? `<div class="foot-note">${escapeHtml(b.website)}</div>` : ''}
      </div>
    </div>`;

  const sectionMap: Record<PrintSectionKey, string> = {
    header: headerSectionHtml,
    meta: metaSectionHtml,
    person: personSectionHtml,
    amounts: amountsSectionHtml,
    verification: verificationSectionHtml,
    footer: footerSectionHtml
  };

  const renderedSections = (b.sectionOrder || DEFAULT_SCHOOL_PRINT_BRANDING.sectionOrder)
    .filter((k) => !hidden.has(k))
    .map((k) => sectionMap[k] || '')
    .filter(Boolean)
    .join('\n');

  const watermarkLayer = eff.showWatermark
    ? `<div class="wm-bg">${escapeHtml((b.schoolName || monogram).toUpperCase())}</div>`
    : '';

  const pageOrientation = eff.a4Orientation === 'portrait' ? 'portrait' : 'landscape';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(effectiveTitle)} — ${escapeHtml(stmtRef)}</title>
  <style>
    @page { size: A4 ${pageOrientation}; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; font-size: 11px; line-height: 1.45; font-variant-numeric: tabular-nums; position: relative; }
    .sheet { position: relative; z-index: 1; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; background: #fff; }
    .wm-bg { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; opacity: 0.038; font-size: 44px; font-weight: 900; letter-spacing: 6px; transform: rotate(-28deg); color: ${accent}; text-align: center; }
    .hdr { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid ${accent}; padding-bottom: 12px; margin-bottom: 12px; }
    .brand-wrap { display: flex; gap: 12px; min-width: 0; flex: 1; }
    .brand-row { flex-direction: row; align-items: center; }
    .brand-row.rev { flex-direction: row-reverse; align-items: center; }
    .brand-col { flex-direction: column; }
    .brand-col.align-center { align-items: center; }
    .brand-col.align-left { align-items: flex-start; }
    .brand-col.align-right { align-items: flex-end; }
    .logo-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; background: #fff; flex-shrink: 0; }
    .crest-box { border: 2px solid ${accent}; border-radius: 10px; padding: 7px 11px; font-size: 13px; font-weight: 900; letter-spacing: 1.4px; color: ${accent}; background: #f8fafc; flex-shrink: 0; }
    .badge { display: inline-block; background: ${accent}; color: #fff; font-size: 8.5px; font-weight: 900; letter-spacing: 0.9px; text-transform: uppercase; padding: 2px 8px; border-radius: 5px; margin-bottom: 4px; }
    .school-name { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.2px; color: #0f172a; line-height: 1.2; }
    .contact { font-size: 9.5px; color: #64748b; margin-top: 2px; font-weight: 600; }
    .hdr-right { text-align: right; flex-shrink: 0; }
    .ref-chip { display: inline-block; background: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 7px; padding: 3px 8px; font-size: 9.5px; font-weight: 800; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .meta-line { font-size: 9.5px; font-weight: 600; color: #64748b; margin-top: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .doc-head-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 12px; }
    .stmt-title { font-size: 14px; font-weight: 900; color: #0f172a; letter-spacing: -0.2px; }
    .stmt-sub { font-size: 10px; font-weight: 600; color: #64748b; margin-top: 2px; }
    .orient-tag { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px 8px; flex-shrink: 0; }
    .particulars-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 12px; background: #fff; }
    .particulars-hdr { padding: 7px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.7px; color: ${accent}; }
    .particulars-count { color: #64748b; font-weight: 700; }
    .particulars-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .p-row { padding: 8px 14px; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 2px; background: #fff; }
    .p-row:nth-child(odd) { border-right: 1px solid #f1f5f9; }
    .lbl-row { display: inline-flex; align-items: center; gap: 4px; }
    .p-lbl { font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .p-val { font-size: 11px; font-weight: 800; color: #0f172a; word-break: break-word; }
    .p-val.num { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; font-weight: 900; color: ${accent}; }
    .amt-highlight { border-radius: 12px; padding: 11px 14px; margin-bottom: 12px; background: linear-gradient(90deg, #ecfdf5 0%, #f0fdfa 55%, #eef2ff 100%); border: 1px solid #d1fae5; }
    .amt-main { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .amt-main-lbl { font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.7px; color: #0f172a; }
    .amt-main-val { font-size: 17px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #065f46; }
    .amt-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
    .amt-chip { font-size: 9.5px; color: #475569; font-weight: 700; }
    .amt-chip-val { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 900; color: #0f172a; margin-left: 3px; }
    .amt-chip-val.credit { color: #047857; }
    .amt-chip-val.debit { color: #be123c; }
    .tbl-wrap { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #f8fafc; color: #334155; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; padding: 8px 10px; border-bottom: 1.5px solid #cbd5e1; border-right: 1px solid #f1f5f9; }
    thead th:last-child { border-right: none; }
    thead th.num, tbody td.num, tfoot td.num { text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
    tbody td { padding: 7px 10px; font-size: 10.5px; color: #0f172a; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f8fafc; vertical-align: top; }
    tbody td:last-child { border-right: none; }
    tbody tr.alt { background: #fafbfc; }
    tfoot td { background: ${accent}; color: #fff; font-weight: 900; font-size: 10.5px; padding: 8px 10px; }
    .empty { text-align: center; padding: 20px; font-weight: 700; color: #64748b; }
    .ver-strip { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .ver-strip.side { justify-content: space-between; }
    .bar-box { text-align: center; }
    .bar-ref { font-size: 8.5px; font-weight: 700; color: #475569; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 2px; }
    .footer-grid { margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .sign-block { text-align: right; }
    .sign-line { border-top: 1.5px solid #0f172a; padding-top: 3px; min-width: 180px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; }
    .foot-note { font-size: 9px; color: #64748b; max-width: 440px; }
  </style>
</head>
<body>
  ${watermarkLayer}
  <div class="sheet">
    ${renderedSections}
  </div>
</body>
</html>`;
}

export function buildSchoolStatementThermalHtml(
  params: BuildStatementDocumentParams,
  paperWidth: ThermalPaperWidth = '80mm'
): string {
  const eff = resolveEffectiveTableBranding(params.branding, params.tableId, params.canonicalTableId);
  const b = eff.branding;
  const effectiveTitle = eff.customHeading || params.title;
  const effectivePaper: ThermalPaperWidth = paperWidth === '58mm' ? '58mm' : '80mm';
  const pageMm = effectivePaper;
  const cur = String(b.currencySymbol || 'PKR').toUpperCase();
  const safeLogo = sanitizeBrandingLogoUrl(b.logoDataUrl);
  const monogram = (b.monogramInitials || 'SPA').trim().slice(0, 4);
  const logoSize = Math.min(80, Math.max(46, Number(b.logoSizePx || 44) + 14));
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
  const qrPayload = `STM:${stmtRef}|${effectiveTitle}|ROWS:${params.rows.length}|NET:${cur} ${Math.round(summary.primaryTotal)}`;
  const qrSvg = buildQrCodeSvgMarkup(qrPayload, effectivePaper === '58mm' ? 40 : 48, '#000000', 2, 'M');

  const thermalFrameRadius = b.logoShape === 'circle' ? '9999px' : '7px';
  const thermalCrestRadius = b.logoShape === 'circle' ? '9999px' : '8px';
  const logoHtml = b.showLogoCrest === false
    ? ''
    : (safeLogo
        ? `<div class="logo-frame" style="border-radius:${thermalFrameRadius};overflow:hidden;"><img src="${safeLogo}" alt="Logo" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;border-radius:${thermalFrameRadius};display:block;" /></div>`
        : `<div class="crest" style="border-radius:${thermalCrestRadius};">${escapeHtml(monogram)}</div>`);

  const fieldDot = eff.showFieldLogos
    ? `<span style="display:inline-block;width:5px;height:5px;border-radius:1px;background:#000;margin-right:4px;vertical-align:middle;"></span>`
    : '';

  const isSingleRecord = params.rows.length === 1;
  const amountIdxSet = new Set(summary.amountColumns.map((c) => c.colIndex));
  const amountColList = summary.amountColumns;
  const hidden = new Set<PrintSectionKey>(b.hiddenSections || []);

  const maxThermalRows = 120;
  const displayRows = params.rows.slice(0, maxThermalRows);
  const singleRowDetailMarkup = isSingleRecord
    ? params.headers.map((h, i) => {
        const v = String(params.rows[0]?.[i] ?? '').trim();
        if (!v || v === '-' || v === '—') return '';
        if (amountIdxSet.has(i)) return '';
        const lbl = `${fieldDot}${escapeHtml(h || `Field ${i + 1}`)}`;
        if (v.length > 32) {
          return `<div class="kv-stack"><div class="lbl">${lbl}</div><div class="val-stack">${escapeHtml(v)}</div></div>`;
        }
        return `<div class="kv-row"><span class="lbl">${lbl}</span><span class="val">${escapeHtml(v)}</span></div>`;
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
              <span class="item-title">${fieldDot}${idx + 1}. ${escapeHtml(primaryTitle)}</span>
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
      <span class="lbl">${fieldDot}${escapeHtml(c.label)}</span>
      <span class="val">${escapeHtml(cur)} ${formatStatementMoney(c.total, cur)}</span>
    </div>`).join('');

  const showBar = b.showBarcodeVerification !== false;
  const showQr = b.showQrVerification !== false;

  const renderSingleCopy = (copyBadge?: string): string => {
    const subAlign = b.headerAlign || 'center';
    const headerBlock = `
      ${copyBadge ? `<div class="copy-tag">${escapeHtml(copyBadge)}</div>` : ''}
      ${logoHtml ? `<div class="hdr-logo-center">${logoHtml}</div>` : ''}
      <div class="hdr-center" style="text-align:${subAlign};">
        <div class="title">${escapeHtml(b.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName)}</div>
        ${b.campusTagline ? `<div class="tagline">${escapeHtml(b.campusTagline)}</div>` : ''}
      </div>
      <div class="sub-block" style="text-align:${subAlign};">
        ${b.registrationNo ? `<div>${escapeHtml(b.registrationNo)}</div>` : ''}
        ${b.address ? `<div>${escapeHtml(b.address)}</div>` : ''}
        ${b.phone ? `<div style="font-weight:700;color:#000;">Tel: ${escapeHtml(b.phone)}</div>` : ''}
      </div>
      <div class="doc-rule">
        <span class="doc-title">${escapeHtml(effectiveTitle)}</span>
        <span class="badge-pill">${escapeHtml(stampBadge)}</span>
      </div>`;

    const metaBlock = `
      <div class="sec-block" style="border-top:none;">
        <div class="kv-row"><span class="lbl">${isSingleRecord ? 'Slip Ref' : 'Statement Ref'}</span><span class="val">${escapeHtml(stmtRef)}</span></div>
        ${!isSingleRecord ? `<div class="kv-row"><span class="lbl">Date Range</span><span class="val">${escapeHtml((params.criteria.fromDate || 'Start') + ' → ' + (params.criteria.toDate || 'Latest'))}</span></div>` : ''}
        ${!isSingleRecord && params.criteria.searchQuery?.trim() ? `<div class="kv-row"><span class="lbl">Search Filter</span><span class="val">${escapeHtml(params.criteria.searchQuery.trim())}</span></div>` : ''}
        ${!isSingleRecord ? `<div class="kv-row"><span class="lbl">Records</span><span class="val">${params.rows.length}${totalCount > params.rows.length ? ` / ${totalCount}` : ''}</span></div>` : ''}
        <div class="kv-row"><span class="lbl">Date</span><span class="val">${escapeHtml(issuedAt)}</span></div>
      </div>`;

    const personBlock = `
      <div class="sec-block">
        <div class="sec-cap">${isSingleRecord ? 'RECORD PARTICULARS' : 'ITEMIZED ENTRIES'}</div>
        ${itemsMarkup}
        ${overflowNote}
      </div>`;

    const amountsBlock = amountColList.length > 0 ? `
      <div class="sec-block">
        <div class="amt-hdr">
          <span>PARTICULARS</span>
          <span>AMOUNT (${escapeHtml(cur)})</span>
        </div>
        ${amountSummaryRows}
        <div class="total-box">
          <div class="total-row">
            <span>${isSingleRecord ? 'TOTAL AMOUNT' : (summary.hasInflowOutflowSplit ? 'NET BALANCE' : 'STATEMENT TOTAL')}</span>
            <span>${escapeHtml(cur)} ${formatStatementMoney(summary.primaryTotal, cur)}</span>
          </div>
        </div>
      </div>` : '';

    const barMarkup = showBar ? `<div>${barcodeSvg}<div class="barcode-label">${escapeHtml(stmtRef)}</div></div>` : '';
    const qrMarkup = showQr ? `<div class="qr-wrap">${qrSvg}<div class="qr-cap">SCAN TO VERIFY</div></div>` : '';
    const verInner = (() => {
      if (b.verificationOrder === 'qr_first') {
        return `<div class="ver-stack">${qrMarkup}${barMarkup}</div>`;
      }
      if (b.verificationOrder === 'side_by_side') {
        return `<div class="ver-row">${barMarkup}${qrMarkup}</div>`;
      }
      return `<div class="ver-stack">${barMarkup}${qrMarkup}</div>`;
    })();
    const verificationBlock = (showBar || showQr) ? `
      <div class="ver-box">
        <div class="ver-cap">VERIFICATION</div>
        ${verInner}
      </div>` : '';

    const footerBlock = `
      ${b.signatoryTitle ? `<div class="sign-line">${escapeHtml(b.signatoryTitle)}</div>` : ''}
      <div class="footer">${escapeHtml(b.footerNote || DEFAULT_SCHOOL_PRINT_BRANDING.footerNote)}</div>
      <div class="pos-foot">${b.website ? `${escapeHtml(b.website)} · ` : ''}${effectivePaper.toUpperCase()} POS</div>
      ${eff.showWatermark ? `<div class="wm-foot">VERIFIED OFFICIAL COPY · ${escapeHtml((b.schoolName || monogram).toUpperCase())}</div>` : ''}`;

    const map: Record<PrintSectionKey, string> = {
      header: headerBlock,
      meta: metaBlock,
      person: personBlock,
      amounts: amountsBlock,
      verification: verificationBlock,
      footer: footerBlock
    };

    return (b.sectionOrder || DEFAULT_SCHOOL_PRINT_BRANDING.sectionOrder)
      .filter((k) => !hidden.has(k))
      .map((k) => map[k] || '')
      .filter(Boolean)
      .join('\n');
  };

  const bodyContent = b.thermalDualCopy
    ? `${renderSingleCopy('CUSTOMER / STUDENT COPY')}
       <div class="cut-line">✂ - - - - - - - - - - - - - - - - - - ✂</div>
       ${renderSingleCopy('OFFICE / ACCOUNTS COPY')}`
    : renderSingleCopy();

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(effectiveTitle)} (${effectivePaper})</title>
  <style>
    @page { size: ${pageMm} auto; margin: 2mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; padding: 14px 8px 8px; width: ${pageMm}; max-width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: ${effectivePaper === '58mm' ? '9.5px' : '10.5px'}; line-height: 1.4; color: #0f172a; background: #fff; font-variant-numeric: tabular-nums; }
    .copy-tag { display: inline-block; font-size: 8px; font-weight: 900; letter-spacing: 0.7px; padding: 2px 8px; margin-bottom: 6px; border-radius: 5px; background: linear-gradient(90deg, #059669, #0d9488); color: #fff; text-transform: uppercase; }
    .cut-line { text-align: center; font-size: 8px; font-weight: 800; letter-spacing: 0.5px; margin: 12px 0; border-top: 1px dashed #cbd5e1; color: #64748b; padding-top: 6px; }
    .hdr-logo-center { display: flex; align-items: center; justify-content: center; padding-top: 14px; margin-bottom: 12px; }
    .hdr-center { margin-top: 8px; text-align: center; }
    .logo-frame { border: 1px solid #e2e8f0; border-radius: 7px; padding: 3px; background: #fff; flex-shrink: 0; }
    .crest { display: inline-flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1; border-radius: 10px; width: ${effectivePaper === '58mm' ? '48px' : '54px'}; height: ${effectivePaper === '58mm' ? '48px' : '54px'}; font-size: ${effectivePaper === '58mm' ? '12px' : '13px'}; font-weight: 900; letter-spacing: 1px; flex-shrink: 0; background: #f8fafc; color: #0f172a; }
    .title { font-size: ${effectivePaper === '58mm' ? '11.5px' : '13px'}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.2px; color: #020617; }
    .tagline { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 1px; }
    .sub-block { margin-top: 3px; font-size: 8.5px; line-height: 1.35; color: #475569; }
    .doc-rule { margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 7px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .doc-title { font-size: 8.5px; font-weight: 900; letter-spacing: 0.4px; text-transform: uppercase; background: linear-gradient(90deg, #059669, #0d9488); color: #fff; padding: 3px 8px; border-radius: 5px; }
    .badge-pill { background: #eef2ff; color: #4338ca; padding: 2px 7px; font-size: 8px; font-weight: 800; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; border-radius: 5px; flex-shrink: 0; }
    .sec-block { margin: 8px 0; border-top: 1px solid #f1f5f9; padding-top: 7px; }
    .sec-cap { font-size: 8.5px; font-weight: 900; letter-spacing: 0.7px; text-transform: uppercase; margin-bottom: 5px; color: #94a3b8; }
    .amt-hdr { display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; padding-bottom: 4px; margin-bottom: 4px; }
    .kv-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 2.5px 0; font-size: ${effectivePaper === '58mm' ? '9px' : '10px'}; }
    .kv-row .lbl { font-weight: 700; color: #64748b; flex-shrink: 0; }
    .kv-row .val { font-weight: 800; color: #020617; text-align: right; }
    .kv-stack { margin: 4px 0; padding: 6px 8px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: ${effectivePaper === '58mm' ? '9px' : '10px'}; }
    .kv-stack .lbl { font-weight: 700; color: #64748b; font-size: 8px; text-transform: uppercase; margin-bottom: 2px; }
    .kv-stack .val-stack { font-weight: 600; color: #0f172a; line-height: 1.4; word-break: break-word; }
    .item-row { padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
    .item-row:last-child { border-bottom: none; }
    .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; font-size: ${effectivePaper === '58mm' ? '9px' : '10px'}; }
    .item-title { font-weight: 800; color: #020617; }
    .item-amt { font-weight: 900; white-space: nowrap; color: #4338ca; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .item-meta { font-size: 8.5px; color: #64748b; line-height: 1.3; margin-top: 1px; }
    .total-box { border-radius: 9px; border: 1px solid #d1fae5; background: linear-gradient(90deg, #eef2ff 0%, #ecfdf5 60%, #fff1f2 100%); margin: 8px 0 4px; overflow: hidden; }
    .total-row { display: flex; justify-content: space-between; align-items: center; color: #1e1b4b; padding: 7px 9px; font-size: ${effectivePaper === '58mm' ? '10.5px' : '11.5px'}; font-weight: 900; }
    .ver-box { border-top: 1px solid #f1f5f9; padding-top: 7px; margin-top: 7px; text-align: center; }
    .ver-cap { font-size: 8px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
    .barcode-label { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8.5px; font-weight: 800; color: #475569; margin-top: 2px; }
    .ver-stack { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .ver-row { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .qr-wrap { display: flex; flex-direction: column; align-items: center; }
    .qr-cap { font-size: 7.5px; font-weight: 800; letter-spacing: 0.5px; margin-top: 2px; color: #64748b; }
    .sign-line { margin-top: 18px; border-top: 1px solid #cbd5e1; padding-top: 3px; font-size: 8px; font-weight: 800; color: #475569; text-align: center; text-transform: uppercase; }
    .footer { font-size: 8px; text-align: center; margin-top: 6px; color: #64748b; }
    .pos-foot { font-size: 7.5px; font-weight: 800; letter-spacing: 0.9px; text-align: center; color: #94a3b8; text-transform: uppercase; margin-top: 3px; }
    .wm-foot { font-size: 7px; text-align: center; font-weight: 900; letter-spacing: 0.8px; color: #cbd5e1; margin-top: 4px; }
    .empty { text-align: center; padding: 10px 4px; font-weight: 700; color: #64748b; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

export function buildSchoolStatementWhatsAppText(params: BuildStatementDocumentParams): string {
  const eff = resolveEffectiveTableBranding(params.branding, params.tableId, params.canonicalTableId);
  const b = eff.branding;
  const effectiveTitle = eff.customHeading || params.title;
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
    `📄 *${effectiveTitle}*`,
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
  const eff = resolveEffectiveTableBranding(params.branding, params.tableId, params.canonicalTableId);
  const b = eff.branding;
  const effectiveTitle = eff.customHeading || params.title;
  const cur = String(b.currencySymbol || 'PKR').toUpperCase();
  const safeLogo = sanitizeBrandingLogoUrl(b.logoDataUrl);
  const monogram = (b.monogramInitials || 'SPA').trim().slice(0, 4);
  const logoSize = Math.min(56, Math.max(28, Number(b.logoSizePx || 40)));
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
  const qrPayload = `CARD:${stmtRef}|${effectiveTitle}|NET:${cur} ${Math.round(summary.primaryTotal)}`;
  const qrSvg = buildQrCodeSvgMarkup(qrPayload, 88, accent, 2, 'M');
  const barcodeSvg = buildCode128SvgMarkup(stmtRef, 28, '#0f172a');

  const cardRadius = b.logoShape === 'circle' ? '9999px' : '10px';
  const logoMarkup = b.showLogoCrest === false
    ? ''
    : (safeLogo
        ? `<div class="logo-box" style="border-radius:${cardRadius};overflow:hidden;"><img src="${safeLogo}" alt="School Logo" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;border-radius:${cardRadius};display:block;" /></div>`
        : `<div class="crest-box" style="border-radius:${cardRadius};">${escapeHtml(monogram)}</div>`);

  const fieldChip = eff.showFieldLogos ? buildFieldLogoChipHtml(b, safeLogo, monogram, accent) : '';

  const fieldsHtml = params.headers.map((h, i) => {
    const val = String(row[i] ?? '').trim() || '—';
    return `<div class="f-box">
      <div class="f-lbl">${fieldChip ? `<span class="lbl-row">${fieldChip}<span>${escapeHtml(h || `Field ${i + 1}`)}</span></span>` : escapeHtml(h || `Field ${i + 1}`)}</div>
      <div class="f-val">${escapeHtml(val)}</div>
    </div>`;
  }).join('');

  const topBrandClass = b.logoPlacement === 'right' ? 'brand rev' : (b.logoPlacement === 'top' ? 'brand col' : 'brand');
  const hidden = new Set<PrintSectionKey>(b.hiddenSections || []);
  const showQr = b.showQrVerification !== false;
  const showBarcode = b.showBarcodeVerification !== false;

  const headerSec = `
    <div class="card-top">
      <div class="${topBrandClass}">
        ${logoMarkup}
        <div style="text-align:${b.headerAlign || 'left'};">
          <div class="s-name">${escapeHtml(b.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName)}</div>
          ${b.phone ? `<div class="s-tag">Tel: ${escapeHtml(b.phone)}</div>` : ''}
        </div>
      </div>
      <div class="badge">${escapeHtml(stampBadge)} PASS</div>
    </div>`;

  const metaSec = `
    <div class="hero">
      <div>
        <div class="doc-title">${escapeHtml(effectiveTitle)}</div>
        <div class="doc-sub">Ref: ${escapeHtml(stmtRef)} · ${escapeHtml(issuedAt)}</div>
        ${params.roleLabel ? `<div class="doc-sub">${escapeHtml(params.roleLabel)}</div>` : ''}
      </div>
      ${showQr ? `<div class="qr-panel">${qrSvg}<div class="qr-cap">SCAN TO VERIFY</div></div>` : ''}
    </div>`;

  const personSec = params.rows.length > 0
    ? `<div class="grid">${fieldsHtml}</div>`
    : `<div class="doc-sub">Records Included: ${params.rows.length}</div>`;

  const amountsSec = summary.amountColumns.length > 0
    ? `<div class="amt-highlight">
        <div class="amt-row">
          <span class="amt-lbl">Verified Total</span>
          <span class="amt-val">${escapeHtml(cur)} ${formatStatementMoney(summary.primaryTotal, cur)}</span>
        </div>
      </div>`
    : '';

  const verSec = showBarcode
    ? `<div class="ver-row">${barcodeSvg}<div class="doc-sub" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(stmtRef)}</div></div>`
    : '';

  const footerSec = `
    <div class="card-foot">
      <div class="foot-note">${escapeHtml(b.footerNote || DEFAULT_SCHOOL_PRINT_BRANDING.footerNote)}</div>
      <div class="sign">${escapeHtml(b.signatoryTitle || 'Principal & Accounts Directorate')}</div>
    </div>`;

  const bodyBlocks: PrintSectionKey[] = ['meta', 'person', 'amounts', 'verification', 'footer'];
  const orderedAll = (b.sectionOrder || DEFAULT_SCHOOL_PRINT_BRANDING.sectionOrder).filter((k) => !hidden.has(k));
  const cardBodyParts: Record<Exclude<PrintSectionKey, 'header'>, string> = {
    meta: metaSec,
    person: personSec,
    amounts: amountsSec,
    verification: verSec,
    footer: footerSec
  };
  const bodyContent = orderedAll
    .filter((k): k is Exclude<PrintSectionKey, 'header'> => k !== 'header' && bodyBlocks.includes(k))
    .map((k) => cardBodyParts[k])
    .filter(Boolean)
    .join('\n');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(effectiveTitle)} — QR Card (${escapeHtml(stmtRef)})</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; font-variant-numeric: tabular-nums; }
    .card { max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-top: 4px solid ${accent}; border-radius: 16px; overflow: hidden; position: relative; background: #fff; }
    .wm-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; opacity: 0.035; font-size: 36px; font-weight: 900; letter-spacing: 5px; transform: rotate(-25deg); color: ${accent}; }
    .card-top { background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #0f172a; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; position: relative; z-index: 1; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand.rev { flex-direction: row-reverse; }
    .brand.col { flex-direction: column; align-items: flex-start; }
    .logo-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; flex-shrink: 0; }
    .crest-box { background: ${accent}; color: #fff; border-radius: 10px; padding: 7px 11px; font-weight: 900; font-size: 13px; letter-spacing: 1.4px; flex-shrink: 0; }
    .s-name { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.2px; color: #0f172a; }
    .s-tag { font-size: 9.5px; color: #64748b; font-weight: 700; margin-top: 2px; }
    .badge { background: ${accent}; color: #fff; padding: 4px 10px; border-radius: 7px; font-size: 9px; font-weight: 900; letter-spacing: 0.9px; text-transform: uppercase; white-space: nowrap; }
    .card-body { padding: 16px 18px; position: relative; z-index: 1; }
    .hero { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; margin-bottom: 12px; }
    .doc-title { font-size: 14.5px; font-weight: 900; color: #0f172a; }
    .doc-sub { font-size: 10.5px; color: #64748b; margin-top: 3px; font-weight: 600; }
    .qr-panel { text-align: center; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; background: #f8fafc; flex-shrink: 0; }
    .qr-cap { font-size: 7.5px; font-weight: 900; letter-spacing: 0.7px; text-transform: uppercase; color: #475569; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
    .lbl-row { display: inline-flex; align-items: center; gap: 4px; }
    .f-box { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 2px; background: #fff; }
    .f-box:nth-child(odd) { border-right: 1px solid #f1f5f9; }
    .f-lbl { font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .f-val { font-size: 10.5px; font-weight: 800; color: #0f172a; word-break: break-word; }
    .amt-highlight { margin-top: 12px; border-radius: 12px; padding: 10px 14px; background: linear-gradient(90deg, #ecfdf5 0%, #f0fdfa 55%, #eef2ff 100%); border: 1px solid #d1fae5; }
    .amt-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .amt-lbl { font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.7px; color: #0f172a; }
    .amt-val { font-size: 15px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #065f46; }
    .ver-row { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .card-foot { margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
    .foot-note { font-size: 9px; color: #64748b; }
    .sign { border-top: 1.5px solid #0f172a; padding-top: 4px; min-width: 170px; text-align: right; font-size: 9.5px; font-weight: 800; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    ${eff.showWatermark ? `<div class="wm-bg">${escapeHtml((b.schoolName || monogram).toUpperCase())}</div>` : ''}
    ${!hidden.has('header') ? headerSec : ''}
    <div class="card-body">
      ${bodyContent}
    </div>
  </div>
</body>
</html>`;
}

