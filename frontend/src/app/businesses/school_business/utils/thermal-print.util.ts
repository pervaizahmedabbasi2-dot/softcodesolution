import { buildCode128SvgMarkup } from '../components/school-barcode/school-barcode.component';

export type ThermalPaperWidth = '80mm' | '58mm';

export interface ThermalFeeReceiptData {
  schoolName: string;
  branchName?: string;
  receiptTitle?: string;
  txnRef: string;
  challanNo: string;
  studentName: string;
  rollNo: string;
  grade: string;
  guardianName?: string;
  gatewayName: string;
  baseAmount: number;
  gatewayFee: number;
  totalAmount: number;
  status: string;
  paidAtLabel: string;
  verifiedBy?: string;
  proofReference?: string;
  footerNote?: string;
}

export interface BarcodeStickerItem {
  title: string;
  subtitle: string;
  code: string;
  meta: string;
}

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPkr(amount: number): string {
  const n = Number(amount || 0);
  return Number.isFinite(n) ? n.toLocaleString('en-PK') : '0';
}

/**
 * Prints sanitized self-contained HTML inside a hidden off-screen iframe.
 * Avoids window.open() popup blockers and iframe sandbox restrictions.
 */
export function printHtmlInHiddenFrame(htmlDocument: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      setTimeout(() => {
        try {
          iframe.remove();
        } catch {}
      }, 1500);
    };

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) {
          cleanup();
          resolve(false);
          return;
        }
        win.focus();
        win.print();
        cleanup();
        resolve(true);
      } catch {
        cleanup();
        resolve(false);
      }
    };

    iframe.srcdoc = htmlDocument;
    document.body.appendChild(iframe);
  });
}

export function buildThermalFeeReceiptHtml(data: ThermalFeeReceiptData, paperWidth: ThermalPaperWidth = '80mm'): string {
  const barcodeCode = data.challanNo || data.txnRef || `CH-2026-${data.rollNo}`;
  const svgBarcode = buildCode128SvgMarkup(barcodeCode, paperWidth === '58mm' ? 32 : 38, '#000000');
  const pageMm = paperWidth === '58mm' ? '58mm' : '80mm';
  const bodyFontPx = paperWidth === '58mm' ? '10px' : '11px';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Fee Receipt ${escapeHtml(data.txnRef)}</title>
  <style>
    @page { size: ${pageMm} auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 4px 6px;
      width: ${pageMm};
      max-width: 100%;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: ${bodyFontPx};
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
    }
    .center { text-align: center; }
    .bold { font-weight: 800; }
    .title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px; }
    .sub { font-size: 10px; color: #222; }
    .hr { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
    .row span:last-child { text-align: right; font-weight: 700; }
    .total-box { border: 1.5px solid #000; padding: 5px 6px; margin: 6px 0; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; }
    .badge { display: inline-block; border: 1px solid #000; padding: 1px 6px; font-size: 10px; font-weight: 900; text-transform: uppercase; margin-top: 3px; }
    .barcode-wrap { margin-top: 8px; text-align: center; }
    .barcode-label { font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-top: 2px; }
    .footer { font-size: 9px; text-align: center; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="center">
    <div class="title">${escapeHtml(data.schoolName || 'SoftCode School')}</div>
    ${data.branchName ? `<div class="sub">${escapeHtml(data.branchName)}</div>` : ''}
    <div class="sub bold">${escapeHtml(data.receiptTitle || 'OFFICIAL THERMAL FEE RECEIPT')}</div>
    <div class="badge">${escapeHtml(data.status)}</div>
  </div>
  <div class="hr"></div>
  <div class="row"><span>Receipt / Ref:</span><span>${escapeHtml(data.txnRef)}</span></div>
  <div class="row"><span>Challan #:</span><span>${escapeHtml(data.challanNo)}</span></div>
  <div class="row"><span>Date / Time:</span><span>${escapeHtml(data.paidAtLabel)}</span></div>
  <div class="hr"></div>
  <div class="row"><span>Student:</span><span>${escapeHtml(data.studentName)}</span></div>
  <div class="row"><span>Roll No:</span><span>#${escapeHtml(data.rollNo)}</span></div>
  <div class="row"><span>Class:</span><span>${escapeHtml(data.grade)}</span></div>
  ${data.guardianName ? `<div class="row"><span>Guardian:</span><span>${escapeHtml(data.guardianName)}</span></div>` : ''}
  <div class="hr"></div>
  <div class="row"><span>Channel:</span><span>${escapeHtml(data.gatewayName)}</span></div>
  ${data.proofReference ? `<div class="row"><span>TID / Slip Ref:</span><span>${escapeHtml(data.proofReference)}</span></div>` : ''}
  <div class="row"><span>Base Fee:</span><span>PKR ${formatPkr(data.baseAmount)}</span></div>
  <div class="row"><span>Gateway Charges:</span><span>PKR ${formatPkr(data.gatewayFee)}</span></div>
  <div class="total-box">
    <div class="total-row">
      <span>TOTAL PAID</span>
      <span>PKR ${formatPkr(data.totalAmount)}</span>
    </div>
  </div>
  ${data.verifiedBy ? `<div class="row"><span>Verified By:</span><span>${escapeHtml(data.verifiedBy)}</span></div>` : ''}
  <div class="barcode-wrap">
    ${svgBarcode}
    <div class="barcode-label">${escapeHtml(barcodeCode)}</div>
  </div>
  <div class="footer">
    ${escapeHtml(data.footerNote || 'Scan barcode at Fee Counter or Parent Desk to verify authenticity.')}<br/>
    Printed via SoftCode School Hardware Engine (${paperWidth})
  </div>
</body>
</html>`;
}

export function buildBarcodeStickerSheetHtml(schoolName: string, items: BarcodeStickerItem[]): string {
  const cards = items
    .map((item) => {
      const svg = buildCode128SvgMarkup(item.code, 40, '#000000');
      return `<div class="sticker">
        <div class="s-school">${escapeHtml(schoolName)}</div>
        <div class="s-title">${escapeHtml(item.title)}</div>
        <div class="s-sub">${escapeHtml(item.subtitle)}</div>
        <div class="s-bar">${svg}</div>
        <div class="s-code">${escapeHtml(item.code)}</div>
        <div class="s-meta">${escapeHtml(item.meta)}</div>
      </div>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Barcode Labels - ${escapeHtml(schoolName)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #0f172a; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
    .sticker { border: 1px dashed #94a3b8; border-radius: 6px; padding: 6px 8px; text-align: center; page-break-inside: avoid; }
    .s-school { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #475569; }
    .s-title { font-size: 11px; font-weight: 900; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .s-sub { font-size: 9px; font-weight: 700; color: #334155; margin-bottom: 4px; }
    .s-bar { margin: 2px 0; }
    .s-code { font-family: monospace; font-size: 9px; font-weight: 900; letter-spacing: 0.8px; }
    .s-meta { font-size: 8px; color: #64748b; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="grid">${cards}</div>
</body>
</html>`;
}

/**
 * Generates raw ESC/POS bytes for USB-Serial / Bluetooth-SPP 58mm/80mm thermal printers.
 */
export function buildEscPosReceiptBytes(data: ThermalFeeReceiptData): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: number[] = [];
  const pushBytes = (...b: number[]) => chunks.push(...b);
  const pushLine = (text: string) => {
    const clean = String(text || '').replace(/[^\x20-\x7E]/g, ' ');
    for (const byte of encoder.encode(clean + '\n')) chunks.push(byte);
  };

  pushBytes(0x1b, 0x40); // ESC @ Init
  pushBytes(0x1b, 0x61, 0x01); // Center
  pushBytes(0x1b, 0x45, 0x01); // Bold on
  pushLine(data.schoolName || 'SOFTCODE SCHOOL');
  pushBytes(0x1b, 0x45, 0x00); // Bold off
  if (data.branchName) pushLine(data.branchName);
  pushLine(data.receiptTitle || 'THERMAL FEE RECEIPT');
  pushLine(`STATUS: ${data.status}`);
  pushLine('--------------------------------');
  pushBytes(0x1b, 0x61, 0x00); // Left align
  pushLine(`Ref:     ${data.txnRef}`);
  pushLine(`Challan: ${data.challanNo}`);
  pushLine(`Date:    ${data.paidAtLabel}`);
  pushLine(`Student: ${data.studentName}`);
  pushLine(`Roll #:  ${data.rollNo} (${data.grade})`);
  pushLine(`Channel: ${data.gatewayName}`);
  if (data.proofReference) pushLine(`TID:     ${data.proofReference}`);
  pushLine('--------------------------------');
  pushLine(`Base Fee: PKR ${formatPkr(data.baseAmount)}`);
  pushLine(`Charges:  PKR ${formatPkr(data.gatewayFee)}`);
  pushBytes(0x1b, 0x45, 0x01);
  pushLine(`TOTAL:    PKR ${formatPkr(data.totalAmount)}`);
  pushBytes(0x1b, 0x45, 0x00);
  pushLine('--------------------------------');
  pushBytes(0x1b, 0x61, 0x01); // Center barcode
  const codeData = (data.challanNo || data.txnRef).replace(/[^\x20-\x7E]/g, '').slice(0, 24);
  if (codeData.length > 0) {
    // GS h 48, GS w 2, GS H 2 (HRI below), GS k 73 len {B + codeData
    pushBytes(0x1d, 0x68, 48, 0x1d, 0x77, 2, 0x1d, 0x48, 2);
    const codeBytes = Array.from(encoder.encode(`{B${codeData}`));
    pushBytes(0x1d, 0x6b, 73, codeBytes.length, ...codeBytes);
    pushLine('');
  }
  pushLine(data.footerNote || 'Thank you - Verified School Receipt');
  pushBytes(0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x41, 0x10); // Feed & Partial Cut
  return new Uint8Array(chunks);
}
