import { buildCode128SvgMarkup } from './barcode.component';
import { buildQrCodeSvgMarkup } from './qr-code.util';

export type ThermalPaperWidth = '80mm' | '58mm';

export interface EscPosRasterBitmap {
  widthBytes: number;
  height: number;
  data: number[];
}

export interface ThermalFeeReceiptData {
  schoolName: string;
  branchName?: string;
  campusTagline?: string;
  registrationNo?: string;
  campusAddress?: string;
  campusPhone?: string;
  campusWebsite?: string;
  monogramInitials?: string;
  logoDataUrl?: string;
  logoRasterBitmap?: EscPosRasterBitmap | null;
  logoPlacement?: 'left' | 'top' | 'right';
  logoSizePx?: number;
  headerAlign?: 'left' | 'center' | 'right';
  sectionOrder?: Array<'header' | 'meta' | 'person' | 'amounts' | 'verification' | 'footer'>;
  hiddenSections?: Array<'header' | 'meta' | 'person' | 'amounts' | 'verification' | 'footer'>;
  verificationOrder?: 'barcode_first' | 'qr_first' | 'side_by_side';
  signatoryTitle?: string;
  stampLabel?: string;
  showQr?: boolean;
  showBarcode?: boolean;
  receiptTitle?: string;
  txnRef: string;
  challanNo: string;
  billingMonth?: string;
  qrPayload?: string;
  studentName: string;
  rollNo: string;
  grade: string;
  guardianName?: string;
  cashierName?: string;
  gatewayName: string;
  currency?: string;
  baseAmount: number;
  previousArrears?: number;
  discountAmount?: number;
  lateFine?: number;
  gatewayFee: number;
  totalAmount: number;
  balanceRemaining?: number;
  status: string;
  paidAtLabel: string;
  verifiedBy?: string;
  proofReference?: string;
  footerNote?: string;
  dualCopy?: boolean;
  copyLabel?: string;
  paperWidth?: ThermalPaperWidth;
  kickDrawer?: boolean;
  autoCut?: boolean;
}

export interface BarcodeStickerItem {
  title: string;
  subtitle: string;
  code: string;
  meta: string;
}

export interface ThermalPosLineItem {
  name: string;
  qty: number;
  unitPrice: number;
  meta?: string;
}

export interface ThermalPosReceiptData {
  businessName: string;
  branchName?: string;
  receiptTitle?: string;
  receiptNo: string;
  customerName: string;
  cashierName?: string;
  paymentMethod: string;
  currency?: string;
  items: ThermalPosLineItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  cashTendered?: number;
  changeDue?: number;
  timestampLabel: string;
  barcodeValue?: string;
  qrPayload?: string;
  footerNote?: string;
}

export interface ThermalKotTicketData {
  businessName: string;
  ticketNo: string;
  tableOrOrder: string;
  station?: string;
  waiterOrCashier?: string;
  orderType?: string;
  priority?: string;
  timestampLabel: string;
  items: { name: string; qty: number; notes?: string; station?: string }[];
  footerNote?: string;
}

export interface ShippingWaybillData {
  companyName?: string;
  trackingNo: string;
  serviceType?: string;
  senderName: string;
  senderPhone?: string;
  origin: string;
  consigneeName: string;
  consigneePhone?: string;
  destination: string;
  weightKg: number;
  pieces?: number;
  codAmount?: number;
  currency?: string;
  riderOrCarrier?: string;
  bookedDate: string;
  status: string;
  notes?: string;
}

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(amount: number, currency = 'PKR'): string {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return '0';
  if (currency === 'PKR') return n.toLocaleString('en-PK');
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoneyLabel(amount: number, currency = 'PKR'): string {
  const cur = String(currency || 'PKR').toUpperCase();
  return `${cur} ${formatMoney(amount, cur)}`;
}

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

export function buildCashDrawerKickBytes(pin: 0 | 1 = 0): Uint8Array {
  // ESC p m t1 t2 -> opens RJ11/RJ12 cash drawer solenoid (25*2ms on, 250*2ms off)
  return new Uint8Array([0x1b, 0x70, pin, 0x19, 0xfa]);
}

function sanitizePrintImageDataUrl(raw?: string): string {
  const val = String(raw || '').trim();
  if (/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(val)) {
    return val;
  }
  return '';
}

export function imageDataUrlToEscPosRaster(
  dataUrl?: string,
  maxWidthPx = 200
): Promise<EscPosRasterBitmap | null> {
  return new Promise((resolve) => {
    const safeUrl = sanitizePrintImageDataUrl(dataUrl);
    if (!safeUrl || typeof document === 'undefined' || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => {
      try {
        const natW = img.naturalWidth || 120;
        const natH = img.naturalHeight || 120;
        const clampedMax = Math.max(48, Math.min(384, Math.round(maxWidthPx)));
        const scale = Math.min(1, clampedMax / Math.max(1, natW));
        const rawW = Math.max(8, Math.round(natW * scale));
        const width = Math.ceil(rawW / 8) * 8;
        const height = Math.max(8, Math.min(240, Math.round(natH * scale)));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        const offsetX = Math.floor((width - rawW) / 2);
        ctx.drawImage(img, offsetX, 0, rawW, height);
        const pixels = ctx.getImageData(0, 0, width, height).data;
        const widthBytes = width / 8;
        const bytes: number[] = [];
        for (let y = 0; y < height; y++) {
          for (let bx = 0; bx < widthBytes; bx++) {
            let b = 0;
            for (let bit = 0; bit < 8; bit++) {
              const x = bx * 8 + bit;
              const idx = (y * width + x) * 4;
              const r = pixels[idx];
              const g = pixels[idx + 1];
              const bl = pixels[idx + 2];
              const alpha = pixels[idx + 3];
              const lum = 0.299 * r + 0.587 * g + 0.114 * bl;
              if (alpha > 96 && lum < 168) {
                b |= 1 << (7 - bit);
              }
            }
            bytes.push(b);
          }
        }
        resolve({ widthBytes, height, data: bytes });
      } catch {
        resolve(null);
      }
    };
    img.src = safeUrl;
  });
}

function buildSingleThermalCopyHtml(
  data: ThermalFeeReceiptData,
  paperWidth: ThermalPaperWidth,
  copyBadge?: string
): string {
  const cur = String(data.currency || 'PKR').toUpperCase();
  const barcodeCode = data.challanNo || data.txnRef || `CH-2026-${data.rollNo}`;
  const svgBarcode = buildCode128SvgMarkup(barcodeCode, paperWidth === '58mm' ? 28 : 34, '#000000');
  const qrText =
    data.qrPayload ||
    `CHALLAN:${barcodeCode}|TXN:${data.txnRef}|ROLL:${data.rollNo}|AMT:${cur} ${Number(data.totalAmount || 0)}|STATUS:${data.status}`;
  const svgQr = buildQrCodeSvgMarkup(qrText, paperWidth === '58mm' ? 58 : 72, '#000000', 2, 'M');
  const showBarcode = data.showBarcode !== false;
  const showQr = data.showQr !== false;
  const monogram = (data.monogramInitials || '').trim().slice(0, 4);
  const stamp = (data.stampLabel || '').trim();
  const safeLogo = sanitizePrintImageDataUrl(data.logoDataUrl);
  const logoPlacement = data.logoPlacement || 'top';
  const logoSize = Math.min(72, Math.max(24, Number(data.logoSizePx || 44)));
  const align = data.headerAlign || 'center';
  const verifOrder = data.verificationOrder || 'barcode_first';
  const hidden = new Set(data.hiddenSections || []);
  const defaultOrder: Array<'header' | 'meta' | 'person' | 'amounts' | 'verification' | 'footer'> = [
    'header', 'meta', 'person', 'amounts', 'verification', 'footer'
  ];
  const order = (data.sectionOrder && data.sectionOrder.length > 0) ? data.sectionOrder : defaultOrder;
  const effectiveCopyBadge = copyBadge || data.copyLabel || '';

  const badgeHtml = safeLogo
    ? `<div class="logo-frame"><img src="${safeLogo}" alt="Logo" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;display:block;" /></div>`
    : (monogram ? `<div class="crest">${escapeHtml(monogram)}</div>` : '');

  const headerTextHtml = `
    <div style="flex:1;min-width:0;text-align:${logoPlacement === 'top' ? align : (logoPlacement === 'left' ? 'left' : 'right')};">
      <div class="title">${escapeHtml(data.schoolName || 'SoftCode Premier Academy')}</div>
      ${data.campusTagline ? `<div class="tagline">${escapeHtml(data.campusTagline)}</div>` : ''}
    </div>`;

  const headerLayoutHtml = logoPlacement === 'left'
    ? `<div style="display:flex;align-items:center;gap:9px;">${badgeHtml}${headerTextHtml}</div>`
    : (logoPlacement === 'right'
      ? `<div style="display:flex;align-items:center;gap:9px;">${headerTextHtml}${badgeHtml}</div>`
      : `<div style="display:flex;flex-direction:column;align-items:${align === 'left' ? 'flex-start' : (align === 'right' ? 'flex-end' : 'center')};gap:5px;">${badgeHtml}${headerTextHtml}</div>`);

  const headerContactHtml = `
    <div class="contact-block" style="text-align:${align};">
      ${data.branchName ? `<div class="sub">${escapeHtml(data.branchName)}</div>` : ''}
      ${data.registrationNo ? `<div class="sub-muted">${escapeHtml(data.registrationNo)}</div>` : ''}
      ${data.campusAddress ? `<div class="sub-muted">${escapeHtml(data.campusAddress)}</div>` : ''}
      ${data.campusPhone ? `<div class="sub-phone">Tel: ${escapeHtml(data.campusPhone)}</div>` : ''}
    </div>`;

  const arrears = Number(data.previousArrears || 0);
  const discount = Number(data.discountAmount || 0);
  const lateFine = Number(data.lateFine || 0);
  const gatewayFee = Number(data.gatewayFee || 0);
  const balanceRemaining = Number(data.balanceRemaining || 0);
  const normalizedStatus = String(data.status || '').trim().toUpperCase();
  const normalizedStamp = stamp.toUpperCase();
  const singleBadgeText = (normalizedStamp && normalizedStamp !== 'NONE')
    ? stamp
    : (normalizedStatus || 'PAID');
  const showPartialBadge = balanceRemaining > 0 && singleBadgeText.toUpperCase() !== 'PARTIAL';

  const sectionHtmlMap: Record<string, string> = {
    header: `
      <div class="sec-header">
        ${effectiveCopyBadge ? `<div class="copy-strip">${escapeHtml(effectiveCopyBadge)}</div>` : ''}
        ${headerLayoutHtml}
        ${headerContactHtml}
        <div class="doc-rule">
          <span class="doc-title">${escapeHtml(data.receiptTitle || 'FEE PAYMENT RECEIPT')}</span>
          <span class="badge-pill">${escapeHtml(singleBadgeText)}</span>
        </div>
        ${showPartialBadge ? `<div class="badge-row"><span class="badge-outline">PARTIAL PAYMENT</span></div>` : ''}
      </div>`,
    meta: `
      <div class="sec-block sec-meta">
        <div class="kv-row"><span class="lbl">Receipt No</span><span class="val">${escapeHtml(data.txnRef)}</span></div>
        <div class="kv-row"><span class="lbl">Challan Ref</span><span class="val">${escapeHtml(data.challanNo)}</span></div>
        ${data.billingMonth ? `<div class="kv-row"><span class="lbl">Fee Month</span><span class="val">${escapeHtml(data.billingMonth)}</span></div>` : ''}
        <div class="kv-row"><span class="lbl">Date</span><span class="val">${escapeHtml(data.paidAtLabel)}</span></div>
      </div>`,
    person: `
      <div class="sec-block">
        <div class="sec-cap">STUDENT DETAILS</div>
        <div class="kv-row"><span class="lbl">Student Name</span><span class="val">${escapeHtml(data.studentName)}</span></div>
        <div class="kv-row"><span class="lbl">Roll / ID</span><span class="val">#${escapeHtml(data.rollNo)}</span></div>
        <div class="kv-row"><span class="lbl">Class</span><span class="val">${escapeHtml(data.grade)}</span></div>
        ${data.guardianName ? `<div class="kv-row"><span class="lbl">Guardian</span><span class="val">${escapeHtml(data.guardianName)}</span></div>` : ''}
        ${data.cashierName ? `<div class="kv-row"><span class="lbl">Received By</span><span class="val">${escapeHtml(data.cashierName)}</span></div>` : ''}
      </div>`,
    amounts: `
      <div class="sec-block">
        <div class="tbl-head">
          <span>PARTICULARS</span>
          <span>AMOUNT (${escapeHtml(cur)})</span>
        </div>
        <div class="kv-row"><span class="lbl">Payment Mode</span><span class="val">${escapeHtml(data.gatewayName)}</span></div>
        ${data.proofReference ? `<div class="kv-row"><span class="lbl">Ref / Slip No</span><span class="val">${escapeHtml(data.proofReference)}</span></div>` : ''}
        <div class="kv-row"><span class="lbl">Tuition &amp; Academic Fee</span><span class="val">${formatMoney(data.baseAmount, cur)}</span></div>
        ${arrears > 0 ? `<div class="kv-row"><span class="lbl">Previous Arrears</span><span class="val">+${formatMoney(arrears, cur)}</span></div>` : ''}
        ${lateFine > 0 ? `<div class="kv-row"><span class="lbl">Late Fee Fine</span><span class="val">+${formatMoney(lateFine, cur)}</span></div>` : ''}
        ${discount > 0 ? `<div class="kv-row"><span class="lbl">Concession / Discount</span><span class="val">-${formatMoney(discount, cur)}</span></div>` : ''}
        ${gatewayFee > 0 ? `<div class="kv-row"><span class="lbl">Gateway / Service Fee</span><span class="val">${formatMoney(gatewayFee, cur)}</span></div>` : ''}
        <div class="total-box">
          <div class="total-row">
            <span>TOTAL PAID</span>
            <span>${formatMoneyLabel(data.totalAmount, cur)}</span>
          </div>
          ${balanceRemaining > 0 ? `<div class="bal-row"><span>BALANCE REMAINING</span><span>${formatMoneyLabel(balanceRemaining, cur)}</span></div>` : ''}
        </div>
        ${data.verifiedBy ? `<div class="kv-row"><span class="lbl">Authorized By</span><span class="val">${escapeHtml(data.verifiedBy)}</span></div>` : ''}
      </div>`,
    verification: (() => {
      if (!showBarcode && !showQr) return '';
      const bBlock = showBarcode ? `<div class="barcode-wrap">${svgBarcode}<div class="barcode-label">${escapeHtml(barcodeCode)}</div></div>` : '';
      const qBlock = showQr ? `<div class="qr-wrap">${svgQr}<div class="qr-cap">SCAN TO VERIFY RECEIPT</div></div>` : '';
      const inner = (verifOrder === 'side_by_side' && showBarcode && showQr)
        ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
            <div style="flex:1;min-width:0;text-align:center;">${svgBarcode}<div class="barcode-label">${escapeHtml(barcodeCode)}</div></div>
            <div style="flex-shrink:0;text-align:center;">${svgQr}</div>
          </div>`
        : (verifOrder === 'qr_first' ? `${qBlock}${bBlock}` : `${bBlock}${qBlock}`);
      return `<div class="ver-box">
        <div class="ver-cap">VERIFICATION</div>
        ${inner}
      </div>`;
    })(),
    footer: `
      <div class="sec-footer">
        ${data.signatoryTitle ? `<div class="sign-line">${escapeHtml(data.signatoryTitle)}</div>` : ''}
        <div class="footer">
          <div>${escapeHtml(data.footerNote || 'Computer-generated official receipt. Verify barcode or QR at Campus Accounts.')}</div>
          <div class="foot-meta">${data.campusWebsite ? `${escapeHtml(data.campusWebsite)} · ` : ''}${paperWidth.toUpperCase()} POS</div>
        </div>
      </div>`
  };

  return order
    .filter((k) => !hidden.has(k))
    .map((k) => sectionHtmlMap[k] || '')
    .join('\n');
}

export function buildThermalFeeReceiptHtml(data: ThermalFeeReceiptData, paperWidth: ThermalPaperWidth = '80mm'): string {
  const effectivePaper: ThermalPaperWidth = paperWidth || data.paperWidth || '80mm';
  const pageMm = effectivePaper === '58mm' ? '58mm' : '80mm';
  const bodyFontPx = effectivePaper === '58mm' ? '9.5px' : '10.5px';

  const bodyContent = data.dualCopy
    ? `${buildSingleThermalCopyHtml(data, effectivePaper, 'STUDENT / GUARDIAN COPY')}
       <div class="tear-line"><span>✂ TEAR / CUT — OFFICE COPY BELOW</span></div>
       ${buildSingleThermalCopyHtml(data, effectivePaper, 'OFFICE / ACCOUNTS COPY')}`
    : buildSingleThermalCopyHtml(data, effectivePaper);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(data.txnRef)}</title>
  <style>
    @page { size: ${pageMm} auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 6px; width: ${pageMm}; max-width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: ${bodyFontPx}; line-height: 1.38; color: #000; background: #fff; font-variant-numeric: tabular-nums; }
    .sec-header { margin-bottom: 5px; }
    .copy-strip { text-align: center; font-size: 8px; font-weight: 900; letter-spacing: 1px; border: 1px solid #000; padding: 2px 4px; margin-bottom: 6px; text-transform: uppercase; background: #f4f4f5; }
    .logo-frame { border: 1px solid #000; border-radius: 4px; padding: 2px; background: #fff; flex-shrink: 0; }
    .crest { display: inline-flex; align-items: center; justify-content: center; border: 2px solid #000; border-radius: 5px; padding: 4px 9px; font-size: 12px; font-weight: 900; letter-spacing: 1.4px; flex-shrink: 0; background: #fff; }
    .title { font-size: ${effectivePaper === '58mm' ? '11.5px' : '13px'}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.18; }
    .tagline { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25px; margin-top: 2px; color: #222; }
    .contact-block { margin-top: 4px; line-height: 1.32; }
    .sub { font-size: 9px; font-weight: 700; color: #111; }
    .sub-muted { font-size: 8.5px; color: #222; }
    .sub-phone { font-size: 8.5px; font-weight: 600; color: #111; }
    .doc-rule { margin-top: 7px; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 4px 2px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .doc-title { font-size: 9.5px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; }
    .badge-pill { background: #000; color: #fff; padding: 1px 7px; font-size: 8px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; border-radius: 2px; }
    .badge-row { display: flex; justify-content: center; gap: 5px; margin-top: 4px; }
    .badge-outline { border: 1px solid #000; padding: 1px 6px; font-size: 8px; font-weight: 900; text-transform: uppercase; border-radius: 2px; }
    .sec-block { margin: 6px 0; border-top: 1px dashed #000; padding-top: 5px; }
    .sec-meta { border-top: none; padding-top: 2px; }
    .sec-cap { font-size: 8.5px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 3px; color: #000; }
    .tbl-head { display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 900; letter-spacing: 0.7px; text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 4px; }
    .kv-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 2px 0; border-bottom: 1px dotted #d4d4d8; font-size: ${effectivePaper === '58mm' ? '9px' : '10px'}; }
    .kv-row:last-child { border-bottom: none; }
    .kv-row .lbl { font-weight: 600; color: #27272a; flex-shrink: 0; }
    .kv-row .val { font-weight: 700; color: #000; text-align: right; }
    .total-box { border-top: 2px solid #000; border-bottom: 2px solid #000; margin: 7px 0 4px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; background: #000; color: #fff; padding: 5px 7px; font-size: ${effectivePaper === '58mm' ? '11px' : '12px'}; font-weight: 900; }
    .bal-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 7px; font-size: 9.5px; font-weight: 900; background: #fff; color: #000; border-top: 1px solid #000; }
    .ver-box { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; text-align: center; }
    .ver-cap { font-size: 8px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
    .barcode-wrap { text-align: center; }
    .barcode-label { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; font-weight: 800; letter-spacing: 1px; margin-top: 2px; }
    .qr-wrap { margin-top: 5px; display: flex; flex-direction: column; align-items: center; }
    .qr-cap { font-size: 7.5px; font-weight: 800; letter-spacing: 0.5px; margin-top: 2px; }
    .sec-footer { margin-top: 6px; }
    .sign-line { margin-top: 22px; border-top: 1px solid #000; padding-top: 3px; font-size: 8.5px; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 0.4px; }
    .footer { font-size: 8px; text-align: center; margin-top: 6px; line-height: 1.35; }
    .foot-meta { font-weight: 800; margin-top: 2px; letter-spacing: 0.5px; }
    .tear-line { border-top: 1.5px dashed #000; margin: 14px 0 12px; text-align: center; font-size: 8px; font-weight: 900; letter-spacing: 0.6px; padding-top: 4px; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

export function buildThermalPosReceiptHtml(data: ThermalPosReceiptData, paperWidth: ThermalPaperWidth = '80mm'): string {
  const cur = data.currency || 'USD';
  const curSymbol = cur === 'PKR' ? 'PKR ' : '$';
  const barcodeCode = data.barcodeValue || data.receiptNo || `POS-${Date.now()}`;
  const svgBarcode = buildCode128SvgMarkup(barcodeCode, paperWidth === '58mm' ? 28 : 34, '#000000');
  const qrText = data.qrPayload || `RECEIPT:${data.receiptNo}|TOTAL:${cur}${Number(data.total || 0).toFixed(2)}|METHOD:${data.paymentMethod}|CUSTOMER:${data.customerName}`;
  const svgQr = buildQrCodeSvgMarkup(qrText, paperWidth === '58mm' ? 58 : 70, '#000000', 2, 'M');
  const pageMm = paperWidth === '58mm' ? '58mm' : '80mm';
  const bodyFontPx = paperWidth === '58mm' ? '10px' : '11px';

  const itemRows = (data.items || [])
    .map((it) => {
      const lineTotal = Number(it.unitPrice || 0) * Number(it.qty || 1);
      return `<div class="item">
        <div class="item-name">${escapeHtml(it.name)}${it.meta ? ` <span class="sub">[${escapeHtml(it.meta)}]</span>` : ''}</div>
        <div class="row">
          <span>${Number(it.qty || 1)} x ${curSymbol}${formatMoney(it.unitPrice, cur)}</span>
          <span>${curSymbol}${formatMoney(lineTotal, cur)}</span>
        </div>
      </div>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.receiptNo)}</title>
  <style>
    @page { size: ${pageMm} auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 4px 6px; width: ${pageMm}; max-width: 100%; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: ${bodyFontPx}; line-height: 1.35; color: #000; background: #fff; }
    .center { text-align: center; }
    .title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px; }
    .sub { font-size: 9px; color: #333; }
    .hr { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
    .row span:last-child { text-align: right; font-weight: 700; }
    .item { margin-bottom: 4px; }
    .item-name { font-weight: 700; }
    .total-box { border: 1.5px solid #000; padding: 5px 6px; margin: 6px 0; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; }
    .barcode-wrap { margin-top: 7px; text-align: center; }
    .barcode-label { font-size: 9px; font-weight: 800; letter-spacing: 1px; margin-top: 2px; }
    .qr-wrap { margin-top: 6px; display: flex; flex-direction: column; align-items: center; }
    .footer { font-size: 9px; text-align: center; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="center">
    <div class="title">${escapeHtml(data.businessName)}</div>
    ${data.branchName ? `<div class="sub">${escapeHtml(data.branchName)}</div>` : ''}
    <div class="sub"><strong>${escapeHtml(data.receiptTitle || 'SALES TAX INVOICE / RECEIPT')}</strong></div>
  </div>
  <div class="hr"></div>
  <div class="row"><span>Receipt #:</span><span>${escapeHtml(data.receiptNo)}</span></div>
  <div class="row"><span>Date/Time:</span><span>${escapeHtml(data.timestampLabel)}</span></div>
  <div class="row"><span>Customer:</span><span>${escapeHtml(data.customerName || 'Walk-in Customer')}</span></div>
  ${data.cashierName ? `<div class="row"><span>Cashier:</span><span>${escapeHtml(data.cashierName)}</span></div>` : ''}
  <div class="row"><span>Method:</span><span>${escapeHtml(data.paymentMethod)}</span></div>
  <div class="hr"></div>
  ${itemRows}
  <div class="hr"></div>
  <div class="row"><span>Subtotal:</span><span>${curSymbol}${formatMoney(data.subtotal, cur)}</span></div>
  ${data.discount ? `<div class="row"><span>Discount:</span><span>-${curSymbol}${formatMoney(data.discount, cur)}</span></div>` : ''}
  ${data.tax ? `<div class="row"><span>GST / Tax:</span><span>${curSymbol}${formatMoney(data.tax, cur)}</span></div>` : ''}
  <div class="total-box">
    <div class="total-row">
      <span>TOTAL PAID</span>
      <span>${curSymbol}${formatMoney(data.total, cur)}</span>
    </div>
  </div>
  ${data.cashTendered !== undefined && data.cashTendered > 0 ? `<div class="row"><span>Cash Tendered:</span><span>${curSymbol}${formatMoney(data.cashTendered, cur)}</span></div>` : ''}
  ${data.changeDue !== undefined && data.changeDue > 0 ? `<div class="row"><span>Change Return:</span><span>${curSymbol}${formatMoney(data.changeDue, cur)}</span></div>` : ''}
  <div class="barcode-wrap">
    ${svgBarcode}
    <div class="barcode-label">${escapeHtml(barcodeCode)}</div>
  </div>
  <div class="qr-wrap">
    ${svgQr}
  </div>
  <div class="footer">
    ${escapeHtml(data.footerNote || '*** THANK YOU FOR YOUR BUSINESS ***')}<br/>
    SoftCode POS Hardware Engine (${paperWidth})
  </div>
</body>
</html>`;
}

export function buildThermalKotHtml(ticket: ThermalKotTicketData, paperWidth: ThermalPaperWidth = '80mm'): string {
  const barcodeCode = ticket.ticketNo || 'KOT-001';
  const svgBarcode = buildCode128SvgMarkup(barcodeCode, paperWidth === '58mm' ? 24 : 30, '#000000');
  const pageMm = paperWidth === '58mm' ? '58mm' : '80mm';

  const itemsHtml = (ticket.items || [])
    .map(
      (it) => `<div class="kot-item">
        <div class="kot-line">
          <span class="qty">${Number(it.qty || 1)}x</span>
          <span class="name">${escapeHtml(it.name)}</span>
        </div>
        ${it.notes ? `<div class="notes">>> NOTE: ${escapeHtml(it.notes)}</div>` : ''}
        ${it.station ? `<div class="station">Station: ${escapeHtml(it.station)}</div>` : ''}
      </div>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KOT ${escapeHtml(ticket.ticketNo)}</title>
  <style>
    @page { size: ${pageMm} auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 5px 6px; width: ${pageMm}; max-width: 100%; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #000; background: #fff; }
    .banner { background: #000; color: #fff; text-align: center; padding: 5px 4px; font-weight: 900; font-size: 13px; letter-spacing: 0.8px; }
    .meta { margin: 6px 0; font-size: 11px; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .table-box { border: 2px solid #000; text-align: center; padding: 4px; font-size: 15px; font-weight: 900; margin: 6px 0; text-transform: uppercase; }
    .hr { border-top: 2px dashed #000; margin: 6px 0; }
    .kot-item { padding: 5px 0; border-bottom: 1px dotted #888; }
    .kot-line { display: flex; gap: 6px; font-size: 13px; font-weight: 900; }
    .qty { min-width: 28px; }
    .notes { font-size: 11px; font-weight: 800; padding-left: 34px; margin-top: 2px; }
    .station { font-size: 9px; padding-left: 34px; text-transform: uppercase; }
    .barcode-wrap { margin-top: 8px; text-align: center; }
    .footer { text-align: center; font-size: 9px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="banner">KITCHEN ORDER TICKET (KOT)</div>
  <div class="table-box">${escapeHtml(ticket.tableOrOrder)}</div>
  <div class="meta">
    <div class="row"><span><strong>KOT #:</strong></span><span><strong>${escapeHtml(ticket.ticketNo)}</strong></span></div>
    <div class="row"><span>Venue:</span><span>${escapeHtml(ticket.businessName)}</span></div>
    ${ticket.station ? `<div class="row"><span>Station:</span><span><strong>${escapeHtml(ticket.station)}</strong></span></div>` : ''}
    ${ticket.waiterOrCashier ? `<div class="row"><span>Server:</span><span>${escapeHtml(ticket.waiterOrCashier)}</span></div>` : ''}
    ${ticket.orderType ? `<div class="row"><span>Mode:</span><span>${escapeHtml(ticket.orderType)}</span></div>` : ''}
    <div class="row"><span>Time:</span><span>${escapeHtml(ticket.timestampLabel)}</span></div>
  </div>
  <div class="hr"></div>
  ${itemsHtml}
  <div class="barcode-wrap">${svgBarcode}</div>
  <div class="footer">${escapeHtml(ticket.footerNote || 'FIRE ORDER IMMEDIATELY · CHEF COPY')} (${paperWidth})</div>
</body>
</html>`;
}

export function buildWaybill4x6Html(waybill: ShippingWaybillData): string {
  const code = waybill.trackingNo || `EXP-PK-${Date.now()}`;
  const svgBarcode = buildCode128SvgMarkup(code, 56, '#000000');
  const qrPayload = `WAYBILL:${code}|FROM:${waybill.origin}|TO:${waybill.destination}|KG:${waybill.weightKg}|COD:${Number(waybill.codAmount || 0)}`;
  const svgQr = buildQrCodeSvgMarkup(qrPayload, 86, '#000000', 2, 'M');
  const cur = waybill.currency || 'PKR';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Waybill 4x6 - ${escapeHtml(code)}</title>
  <style>
    @page { size: 100mm 150mm; margin: 3mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; width: 94mm; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; color: #000; background: #fff; }
    .label { border: 2px solid #000; width: 100%; min-height: 142mm; display: flex; flex-direction: column; justify-content: space-between; }
    .hdr { background: #000; color: #fff; padding: 6px 8px; display: flex; justify-content: space-between; align-items: center; }
    .hdr-brand { font-size: 13px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase; }
    .hdr-service { font-size: 10px; font-weight: 800; border: 1px solid #fff; padding: 2px 6px; text-transform: uppercase; }
    .route-strip { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-bottom: 2px solid #000; background: #f8fafc; }
    .hub { font-size: 14px; font-weight: 900; text-transform: uppercase; }
    .arrow { font-size: 16px; font-weight: 900; }
    .parties { display: grid; grid-template-columns: 1fr; border-bottom: 2px solid #000; }
    .box { padding: 6px 8px; border-bottom: 1px dashed #666; }
    .box:last-child { border-bottom: none; }
    .lbl { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #444; }
    .val { font-size: 11px; font-weight: 800; margin-top: 2px; }
    .subval { font-size: 9px; color: #222; margin-top: 1px; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 2px solid #000; text-align: center; }
    .metric { padding: 6px 4px; border-right: 1px solid #000; }
    .metric:last-child { border-right: none; }
    .metric-val { font-size: 12px; font-weight: 900; margin-top: 2px; }
    .barcode-zone { padding: 8px; text-align: center; border-bottom: 2px solid #000; }
    .track-no { font-family: monospace; font-size: 13px; font-weight: 900; letter-spacing: 1.5px; margin-top: 4px; }
    .qr-footer { padding: 6px 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .meta-col { font-size: 9px; line-height: 1.45; }
  </style>
</head>
<body>
  <div class="label">
    <div>
      <div class="hdr">
        <div class="hdr-brand">${escapeHtml(waybill.companyName || 'SoftCode Express Cargo')}</div>
        <div class="hdr-service">${escapeHtml(waybill.serviceType || 'PRIORITY 4x6 WAYBILL')}</div>
      </div>

      <div class="route-strip">
        <span class="hub">${escapeHtml(waybill.origin)}</span>
        <span class="arrow">&rarr;</span>
        <span class="hub">${escapeHtml(waybill.destination)}</span>
      </div>

      <div class="parties">
        <div class="box">
          <div class="lbl">From / Shipper</div>
          <div class="val">${escapeHtml(waybill.senderName)}</div>
          ${waybill.senderPhone ? `<div class="subval">Tel: ${escapeHtml(waybill.senderPhone)}</div>` : ''}
        </div>
        <div class="box">
          <div class="lbl">To / Consignee</div>
          <div class="val">${escapeHtml(waybill.consigneeName)}</div>
          ${waybill.consigneePhone ? `<div class="subval">Tel: ${escapeHtml(waybill.consigneePhone)}</div>` : ''}
        </div>
      </div>

      <div class="metrics">
        <div class="metric">
          <div class="lbl">Weight</div>
          <div class="metric-val">${Number(waybill.weightKg || 1).toFixed(1)} KG</div>
        </div>
        <div class="metric">
          <div class="lbl">Pieces</div>
          <div class="metric-val">${Number(waybill.pieces || 1)} PCS</div>
        </div>
        <div class="metric">
          <div class="lbl">COD Collect</div>
          <div class="metric-val">${Number(waybill.codAmount || 0) > 0 ? `${escapeHtml(cur)} ${formatMoney(Number(waybill.codAmount || 0), cur)}` : 'PREPAID'}</div>
        </div>
      </div>

      <div class="barcode-zone">
        ${svgBarcode}
        <div class="track-no">${escapeHtml(code)}</div>
      </div>
    </div>

    <div class="qr-footer">
      <div class="meta-col">
        <div><strong>Booked:</strong> ${escapeHtml(waybill.bookedDate)}</div>
        <div><strong>Status:</strong> ${escapeHtml(waybill.status)}</div>
        ${waybill.riderOrCarrier ? `<div><strong>Carrier:</strong> ${escapeHtml(waybill.riderOrCarrier)}</div>` : ''}
        ${waybill.notes ? `<div><strong>Notes:</strong> ${escapeHtml(waybill.notes)}</div>` : ''}
        <div>Scan 2D QR for live POD &amp; Tracking</div>
      </div>
      <div>${svgQr}</div>
    </div>
  </div>
</body>
</html>`;
}

export interface BarcodeStickerSheetOptions {
  monogramInitials?: string;
  showLogoCrest?: boolean;
  footerNote?: string;
  accentColor?: string;
}

export function buildBarcodeStickerSheetHtml(
  brandName: string,
  items: BarcodeStickerItem[],
  logoDataUrl?: string,
  options?: BarcodeStickerSheetOptions
): string {
  const safeLogo = sanitizePrintImageDataUrl(logoDataUrl);
  const accent = /^#[0-9a-fA-F]{6}$/.test(String(options?.accentColor || '').trim())
    ? String(options?.accentColor).trim()
    : '#0f172a';
  const showCrest = options?.showLogoCrest !== false;
  const monogram = String(options?.monogramInitials || 'SPA').trim().slice(0, 4) || 'SPA';
  const stickerFooter = String(options?.footerNote || '').trim();
  const cards = items
    .map((item) => {
      const svg = buildCode128SvgMarkup(item.code, 40, '#000000');
      const crestHtml = safeLogo
        ? `<img src="${safeLogo}" alt="" style="width:14px;height:14px;object-fit:contain;border-radius:2px;flex-shrink:0;" />`
        : (showCrest
          ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:3px;background:${accent};color:#fff;font-size:6.5px;font-weight:900;flex-shrink:0;">${escapeHtml(monogram)}</span>`
          : '');
      return `<div class="sticker">
        <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
          ${crestHtml}
          <div class="s-school">${escapeHtml(brandName)}</div>
        </div>
        <div class="s-title">${escapeHtml(item.title)}</div>
        <div class="s-sub">${escapeHtml(item.subtitle)}</div>
        <div class="s-bar">${svg}</div>
        <div class="s-code">${escapeHtml(item.code)}</div>
        <div class="s-meta">${escapeHtml(item.meta)}</div>
        ${stickerFooter ? `<div class="s-foot">${escapeHtml(stickerFooter)}</div>` : ''}
      </div>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Barcode Labels - ${escapeHtml(brandName)}</title>
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
    .s-foot { font-size: 7px; font-weight: 700; color: #64748b; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="grid">${cards}</div>
</body>
</html>`;
}

export function buildEscPosReceiptBytes(data: ThermalFeeReceiptData, kickDrawer = false): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: number[] = [];
  const paper: ThermalPaperWidth = data.paperWidth || '80mm';
  const cols = paper === '58mm' ? 32 : 48;
  const cur = String(data.currency || 'PKR').toUpperCase();
  const shouldKick = kickDrawer || Boolean(data.kickDrawer);
  const shouldCut = data.autoCut !== false;
  const dashLine = '-'.repeat(cols);
  const eqLine = '='.repeat(cols);

  const cleanAscii = (v: unknown): string => String(v || '').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
  const pushBytes = (...b: number[]) => chunks.push(...b);
  const pushLine = (text: string) => {
    const clean = cleanAscii(text);
    for (const byte of encoder.encode(clean + '\n')) chunks.push(byte);
  };
  const pushWrapped = (text: string) => {
    const words = cleanAscii(text).split(' ').filter(Boolean);
    let line = '';
    for (const w of words) {
      if (!line) {
        line = w.slice(0, cols);
      } else if (line.length + 1 + w.length <= cols) {
        line += ' ' + w;
      } else {
        pushLine(line);
        line = w.slice(0, cols);
      }
    }
    if (line) pushLine(line);
  };
  const pushPair = (left: string, right: string) => {
    const l = cleanAscii(left);
    const r = cleanAscii(right);
    if (l.length + r.length + 1 <= cols) {
      pushLine(`${l}${' '.repeat(cols - l.length - r.length)}${r}`);
    } else {
      const maxL = Math.max(8, cols - r.length - 1);
      const lTrim = l.slice(0, maxL);
      const pad = Math.max(1, cols - lTrim.length - r.length);
      pushLine(`${lTrim}${' '.repeat(pad)}${r}`);
    }
  };
  const pushRasterLogo = (bmp?: EscPosRasterBitmap | null) => {
    if (!bmp || !bmp.widthBytes || !bmp.height || !bmp.data?.length) return;
    const xL = bmp.widthBytes & 0xff;
    const xH = (bmp.widthBytes >> 8) & 0xff;
    const yL = bmp.height & 0xff;
    const yH = (bmp.height >> 8) & 0xff;
    pushBytes(0x1b, 0x61, 0x01); // Center
    pushBytes(0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH, ...bmp.data);
    pushBytes(0x0a);
  };
  const pushEscPosQr = (payload: string) => {
    const rawBytes = Array.from(encoder.encode(cleanAscii(payload).slice(0, 220)));
    if (rawBytes.length === 0) return;
    const storeLen = rawBytes.length + 3;
    const pL = storeLen & 0xff;
    const pH = (storeLen >> 8) & 0xff;
    // QR Model 2, module size (4 for 58mm, 5 for 80mm), EC Level M (49)
    pushBytes(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    pushBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, paper === '58mm' ? 0x04 : 0x05);
    pushBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    pushBytes(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...rawBytes);
    pushBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    pushLine('');
  };
  const pushEscPosCode128 = (code: string) => {
    const codeData = (code || '').replace(/[^\x20-\x7E]/g, '').slice(0, 24);
    if (!codeData) return;
    pushBytes(0x1d, 0x68, paper === '58mm' ? 44 : 54, 0x1d, 0x77, 2, 0x1d, 0x48, 2);
    const codeBytes = Array.from(encoder.encode(`{B${codeData}`));
    pushBytes(0x1d, 0x6b, 73, codeBytes.length, ...codeBytes);
    pushLine('');
  };

  const hidden = new Set(data.hiddenSections || []);
  const defaultOrder: Array<'header' | 'meta' | 'person' | 'amounts' | 'verification' | 'footer'> = [
    'header', 'meta', 'person', 'amounts', 'verification', 'footer'
  ];
  const order = (data.sectionOrder && data.sectionOrder.length > 0) ? data.sectionOrder : defaultOrder;
  const arrears = Number(data.previousArrears || 0);
  const discount = Number(data.discountAmount || 0);
  const lateFine = Number(data.lateFine || 0);
  const balanceRemaining = Number(data.balanceRemaining || 0);
  const stamp = cleanAscii(data.stampLabel);
  const verOrder = data.verificationOrder || 'barcode_first';
  const showBarcode = data.showBarcode !== false;
  const showQr = data.showQr !== false;
  const barcodeCode = data.challanNo || data.txnRef || `CH-2026-${data.rollNo}`;
  const qrPayload =
    data.qrPayload ||
    `CHALLAN:${barcodeCode}|TXN:${data.txnRef}|ROLL:${data.rollNo}|AMT:${cur} ${Number(data.totalAmount || 0)}|STATUS:${data.status}`;

  const renderCopy = (copyTitle?: string) => {
    for (const sec of order) {
      if (hidden.has(sec)) continue;
      if (sec === 'header') {
        pushBytes(0x1b, 0x61, 0x01);
        if (copyTitle) {
          pushBytes(0x1b, 0x45, 0x01);
          pushLine(`[ ${copyTitle} ]`);
          pushBytes(0x1b, 0x45, 0x00);
        }
        pushRasterLogo(data.logoRasterBitmap);
        pushBytes(0x1b, 0x45, 0x01, 0x1b, 0x21, 0x18);
        pushWrapped(data.schoolName || 'SOFTCODE ENTERPRISE');
        pushBytes(0x1b, 0x21, 0x00, 0x1b, 0x45, 0x00);
        if (data.campusTagline) pushWrapped(data.campusTagline);
        if (data.branchName) pushWrapped(data.branchName);
        if (data.registrationNo) pushWrapped(`Reg: ${data.registrationNo}`);
        if (data.campusAddress) pushWrapped(data.campusAddress);
        if (data.campusPhone) pushWrapped(`Helpline: ${data.campusPhone}`);
        pushLine(eqLine);
        pushBytes(0x1b, 0x45, 0x01);
        pushLine(data.receiptTitle || 'OFFICIAL THERMAL FEE RECEIPT');
        const badges = [
          `STATUS: ${data.status}`,
          balanceRemaining > 0 ? 'PARTIAL' : '',
          stamp && stamp.toUpperCase() !== 'NONE' ? `[${stamp}]` : ''
        ].filter(Boolean).join(' ');
        pushLine(badges);
        pushBytes(0x1b, 0x45, 0x00);
      } else if (sec === 'meta') {
        pushBytes(0x1b, 0x61, 0x00);
        pushLine(dashLine);
        pushPair('Receipt Ref:', data.txnRef);
        pushPair('Challan #:', data.challanNo);
        if (data.billingMonth) pushPair('Billing Month:', data.billingMonth);
        pushPair('Date / Time:', data.paidAtLabel);
      } else if (sec === 'person') {
        pushBytes(0x1b, 0x61, 0x00);
        pushLine(dashLine);
        pushPair('Student:', data.studentName);
        pushPair('Roll / Class:', `#${data.rollNo} (${data.grade})`);
        if (data.guardianName) pushPair('Guardian:', data.guardianName);
        if (data.cashierName) pushPair('Cashier:', data.cashierName);
      } else if (sec === 'amounts') {
        pushBytes(0x1b, 0x61, 0x00);
        pushLine(dashLine);
        pushPair('Channel:', data.gatewayName);
        if (data.proofReference) pushPair('TID / Slip:', data.proofReference);
        pushPair('Tuition & Fee:', formatMoneyLabel(data.baseAmount, cur));
        if (arrears > 0) pushPair('Prev Arrears:', `+${formatMoneyLabel(arrears, cur)}`);
        if (lateFine > 0) pushPair('Late Fine:', `+${formatMoneyLabel(lateFine, cur)}`);
        if (discount > 0) pushPair('Discount:', `-${formatMoneyLabel(discount, cur)}`);
        pushPair('Charges:', formatMoneyLabel(data.gatewayFee, cur));
        pushLine(eqLine);
        pushBytes(0x1b, 0x45, 0x01, 0x1b, 0x21, 0x10);
        pushPair('TOTAL PAID:', formatMoneyLabel(data.totalAmount, cur));
        pushBytes(0x1b, 0x21, 0x00, 0x1b, 0x45, 0x00);
        if (balanceRemaining > 0) {
          pushPair('BAL REMAINING:', formatMoneyLabel(balanceRemaining, cur));
        }
        pushLine(eqLine);
        if (data.verifiedBy) pushPair('Verified By:', data.verifiedBy);
      } else if (sec === 'verification') {
        pushBytes(0x1b, 0x61, 0x01);
        if (verOrder === 'qr_first') {
          if (showQr) pushEscPosQr(qrPayload);
          if (showBarcode) pushEscPosCode128(barcodeCode);
        } else {
          if (showBarcode) pushEscPosCode128(barcodeCode);
          if (showQr) pushEscPosQr(qrPayload);
        }
      } else if (sec === 'footer') {
        pushBytes(0x1b, 0x61, 0x01);
        if (data.signatoryTitle) {
          pushLine('');
          pushLine('');
          pushLine('------------------------');
          pushLine(data.signatoryTitle);
        }
        pushLine(dashLine);
        pushWrapped(data.footerNote || 'Thank you - Verified Institutional Receipt');
        if (data.campusWebsite) pushWrapped(data.campusWebsite);
      }
    }
  };

  pushBytes(0x1b, 0x40); // ESC @ Initialize printer
  if (shouldKick) pushBytes(...buildCashDrawerKickBytes(0));

  if (data.dualCopy) {
    renderCopy('STUDENT / GUARDIAN COPY');
    pushBytes(0x0a, 0x0a);
    if (shouldCut) {
      pushBytes(0x1d, 0x56, 0x42, 0x10); // Partial cut between copies
    } else {
      pushBytes(0x1b, 0x61, 0x01);
      pushLine(dashLine);
      pushLine('TEAR HERE - OFFICE COPY');
      pushLine(dashLine);
    }
    renderCopy('OFFICE / ACCOUNTS COPY');
  } else {
    renderCopy(data.copyLabel);
  }

  pushBytes(0x0a, 0x0a, 0x0a);
  if (shouldCut) {
    pushBytes(0x1d, 0x56, 0x41, 0x10); // Full/feed cut
  }
  return new Uint8Array(chunks);
}

export function buildEscPosPosReceiptBytes(data: ThermalPosReceiptData, kickDrawer = false): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: number[] = [];
  const cur = data.currency || 'USD';
  const curSym = cur === 'PKR' ? 'PKR ' : '$';
  const pushBytes = (...b: number[]) => chunks.push(...b);
  const pushLine = (text: string) => {
    const clean = String(text || '').replace(/[^\x20-\x7E]/g, ' ');
    for (const byte of encoder.encode(clean + '\n')) chunks.push(byte);
  };

  pushBytes(0x1b, 0x40);
  if (kickDrawer) pushBytes(...buildCashDrawerKickBytes(0));
  pushBytes(0x1b, 0x61, 0x01);
  pushBytes(0x1b, 0x45, 0x01);
  pushLine(data.businessName || 'SOFTCODE POS');
  pushBytes(0x1b, 0x45, 0x00);
  pushLine(data.receiptTitle || 'SALES RECEIPT');
  pushLine('--------------------------------');
  pushBytes(0x1b, 0x61, 0x00);
  pushLine(`Receipt:  ${data.receiptNo}`);
  pushLine(`Date:     ${data.timestampLabel}`);
  pushLine(`Customer: ${data.customerName}`);
  pushLine(`Method:   ${data.paymentMethod}`);
  pushLine('--------------------------------');
  for (const it of data.items || []) {
    pushLine(String(it.name || '').slice(0, 32));
    pushLine(`  ${it.qty} x ${curSym}${formatMoney(it.unitPrice, cur)} = ${curSym}${formatMoney(it.qty * it.unitPrice, cur)}`);
  }
  pushLine('--------------------------------');
  pushBytes(0x1b, 0x45, 0x01);
  pushLine(`TOTAL: ${curSym}${formatMoney(data.total, cur)}`);
  pushBytes(0x1b, 0x45, 0x00);
  if (data.cashTendered) pushLine(`Cash:  ${curSym}${formatMoney(data.cashTendered, cur)}`);
  if (data.changeDue) pushLine(`Chg:   ${curSym}${formatMoney(data.changeDue, cur)}`);
  pushLine('--------------------------------');
  pushBytes(0x1b, 0x61, 0x01);
  const codeData = (data.barcodeValue || data.receiptNo).replace(/[^\x20-\x7E]/g, '').slice(0, 24);
  if (codeData.length > 0) {
    pushBytes(0x1d, 0x68, 46, 0x1d, 0x77, 2, 0x1d, 0x48, 2);
    const codeBytes = Array.from(encoder.encode(`{B${codeData}`));
    pushBytes(0x1d, 0x6b, 73, codeBytes.length, ...codeBytes);
    pushLine('');
  }
  pushLine(data.footerNote || 'Thank you!');
  pushBytes(0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x41, 0x10);
  return new Uint8Array(chunks);
}

export function buildEscPosKotBytes(ticket: ThermalKotTicketData): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: number[] = [];
  const pushBytes = (...b: number[]) => chunks.push(...b);
  const pushLine = (text: string) => {
    const clean = String(text || '').replace(/[^\x20-\x7E]/g, ' ');
    for (const byte of encoder.encode(clean + '\n')) chunks.push(byte);
  };

  pushBytes(0x1b, 0x40, 0x1b, 0x61, 0x01, 0x1b, 0x45, 0x01);
  pushLine('*** KITCHEN ORDER TICKET ***');
  pushLine(ticket.tableOrOrder.toUpperCase());
  pushBytes(0x1b, 0x45, 0x00, 0x1b, 0x61, 0x00);
  pushLine(`KOT #:  ${ticket.ticketNo}`);
  pushLine(`Venue:  ${ticket.businessName}`);
  if (ticket.station) pushLine(`Station:${ticket.station}`);
  pushLine(`Time:   ${ticket.timestampLabel}`);
  pushLine('================================');
  for (const it of ticket.items || []) {
    pushBytes(0x1b, 0x45, 0x01);
    pushLine(`${it.qty}x ${it.name}`);
    pushBytes(0x1b, 0x45, 0x00);
    if (it.notes) pushLine(`   NOTE: ${it.notes}`);
  }
  pushLine('================================');
  pushBytes(0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x41, 0x10);
  return new Uint8Array(chunks);
}
