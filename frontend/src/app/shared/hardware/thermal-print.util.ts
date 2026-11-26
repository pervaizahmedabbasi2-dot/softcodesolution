import { buildCode128SvgMarkup } from './barcode.component';
import { buildQrCodeSvgMarkup } from './qr-code.util';

export type ThermalPaperWidth = '80mm' | '58mm';

export interface ThermalFeeReceiptData {
  schoolName: string;
  branchName?: string;
  campusTagline?: string;
  registrationNo?: string;
  campusAddress?: string;
  campusPhone?: string;
  campusWebsite?: string;
  monogramInitials?: string;
  signatoryTitle?: string;
  stampLabel?: string;
  showQr?: boolean;
  showBarcode?: boolean;
  receiptTitle?: string;
  txnRef: string;
  challanNo: string;
  qrPayload?: string;
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

export function buildThermalFeeReceiptHtml(data: ThermalFeeReceiptData, paperWidth: ThermalPaperWidth = '80mm'): string {
  const barcodeCode = data.challanNo || data.txnRef || `CH-2026-${data.rollNo}`;
  const svgBarcode = buildCode128SvgMarkup(barcodeCode, paperWidth === '58mm' ? 30 : 36, '#000000');
  const qrText = data.qrPayload || `CHALLAN:${barcodeCode}|TXN:${data.txnRef}|ROLL:${data.rollNo}|AMT:${Number(data.totalAmount || 0)}|STATUS:${data.status}`;
  const svgQr = buildQrCodeSvgMarkup(qrText, paperWidth === '58mm' ? 62 : 76, '#000000', 2, 'M');
  const pageMm = paperWidth === '58mm' ? '58mm' : '80mm';
  const bodyFontPx = paperWidth === '58mm' ? '10px' : '11px';
  const showBarcode = data.showBarcode !== false;
  const showQr = data.showQr !== false;
  const monogram = (data.monogramInitials || '').trim().slice(0, 4);
  const stamp = (data.stampLabel || '').trim();

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(data.txnRef)}</title>
  <style>
    @page { size: ${pageMm} auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 5px 6px; width: ${pageMm}; max-width: 100%; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: ${bodyFontPx}; line-height: 1.35; color: #000; background: #fff; }
    .center { text-align: center; }
    .bold { font-weight: 800; }
    .crest { display: inline-block; border: 2px solid #000; padding: 2px 7px; font-size: 11px; font-weight: 900; letter-spacing: 1px; margin-bottom: 3px; }
    .title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px; }
    .tagline { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 1px; }
    .sub { font-size: 9.5px; color: #111; }
    .hr { border-top: 1px dashed #000; margin: 6px 0; }
    .hr-solid { border-top: 1.5px solid #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
    .row span:last-child { text-align: right; font-weight: 700; }
    .total-box { border: 1.5px solid #000; padding: 5px 6px; margin: 6px 0; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; }
    .badge-row { display: flex; justify-content: center; gap: 4px; flex-wrap: wrap; margin-top: 3px; }
    .badge { display: inline-block; border: 1px solid #000; padding: 1px 6px; font-size: 9.5px; font-weight: 900; text-transform: uppercase; }
    .stamp { display: inline-block; border: 1.5px solid #000; padding: 1px 6px; font-size: 9.5px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
    .barcode-wrap { margin-top: 7px; text-align: center; }
    .barcode-label { font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-top: 2px; }
    .qr-wrap { margin-top: 6px; display: flex; flex-direction: column; align-items: center; }
    .qr-cap { font-size: 8px; font-weight: 800; letter-spacing: 0.4px; margin-top: 2px; }
    .sign-line { margin-top: 10px; border-top: 1px solid #000; padding-top: 2px; font-size: 9px; font-weight: 800; text-align: center; text-transform: uppercase; }
    .footer { font-size: 8.5px; text-align: center; margin-top: 7px; }
  </style>
</head>
<body>
  <div class="center">
    ${monogram ? `<div class="crest">${escapeHtml(monogram)}</div>` : ''}
    <div class="title">${escapeHtml(data.schoolName || 'SoftCode Enterprise')}</div>
    ${data.campusTagline ? `<div class="tagline">${escapeHtml(data.campusTagline)}</div>` : ''}
    ${data.branchName ? `<div class="sub">${escapeHtml(data.branchName)}</div>` : ''}
    ${data.registrationNo ? `<div class="sub">Reg / BISE: ${escapeHtml(data.registrationNo)}</div>` : ''}
    ${data.campusAddress ? `<div class="sub">${escapeHtml(data.campusAddress)}</div>` : ''}
    ${data.campusPhone ? `<div class="sub">Helpline: ${escapeHtml(data.campusPhone)}</div>` : ''}
    <div class="hr-solid"></div>
    <div class="sub bold">${escapeHtml(data.receiptTitle || 'OFFICIAL THERMAL FEE RECEIPT')}</div>
    <div class="badge-row">
      <span class="badge">${escapeHtml(data.status)}</span>
      ${stamp && stamp.toUpperCase() !== 'NONE' ? `<span class="stamp">${escapeHtml(stamp)}</span>` : ''}
    </div>
  </div>
  <div class="hr"></div>
  <div class="row"><span>Receipt / Ref:</span><span>${escapeHtml(data.txnRef)}</span></div>
  <div class="row"><span>Challan / Ref #:</span><span>${escapeHtml(data.challanNo)}</span></div>
  <div class="row"><span>Date / Time:</span><span>${escapeHtml(data.paidAtLabel)}</span></div>
  <div class="hr"></div>
  <div class="row"><span>Payer:</span><span>${escapeHtml(data.studentName)}</span></div>
  <div class="row"><span>ID / Ref:</span><span>#${escapeHtml(data.rollNo)}</span></div>
  <div class="row"><span>Category:</span><span>${escapeHtml(data.grade)}</span></div>
  ${data.guardianName ? `<div class="row"><span>Guardian / Contact:</span><span>${escapeHtml(data.guardianName)}</span></div>` : ''}
  <div class="hr"></div>
  <div class="row"><span>Channel:</span><span>${escapeHtml(data.gatewayName)}</span></div>
  ${data.proofReference ? `<div class="row"><span>TID / Slip Ref:</span><span>${escapeHtml(data.proofReference)}</span></div>` : ''}
  <div class="row"><span>Base Amount:</span><span>PKR ${formatMoney(data.baseAmount, 'PKR')}</span></div>
  <div class="row"><span>Gateway Charges:</span><span>PKR ${formatMoney(data.gatewayFee, 'PKR')}</span></div>
  <div class="total-box">
    <div class="total-row">
      <span>TOTAL PAID</span>
      <span>PKR ${formatMoney(data.totalAmount, 'PKR')}</span>
    </div>
  </div>
  ${data.verifiedBy ? `<div class="row"><span>Verified By:</span><span>${escapeHtml(data.verifiedBy)}</span></div>` : ''}
  ${showBarcode ? `<div class="barcode-wrap">
    ${svgBarcode}
    <div class="barcode-label">${escapeHtml(barcodeCode)}</div>
  </div>` : ''}
  ${showQr ? `<div class="qr-wrap">
    ${svgQr}
    <div class="qr-cap">SCAN 2D QR TO VERIFY RECEIPT</div>
  </div>` : ''}
  ${data.signatoryTitle ? `<div class="sign-line">${escapeHtml(data.signatoryTitle)}</div>` : ''}
  <div class="footer">
    ${escapeHtml(data.footerNote || 'Scan barcode or QR at Counter to verify authenticity.')}<br/>
    ${data.campusWebsite ? `${escapeHtml(data.campusWebsite)} · ` : ''}${paperWidth} Institutional Slip
  </div>
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

export function buildBarcodeStickerSheetHtml(brandName: string, items: BarcodeStickerItem[]): string {
  const cards = items
    .map((item) => {
      const svg = buildCode128SvgMarkup(item.code, 40, '#000000');
      return `<div class="sticker">
        <div class="s-school">${escapeHtml(brandName)}</div>
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
  const pushBytes = (...b: number[]) => chunks.push(...b);
  const pushLine = (text: string) => {
    const clean = String(text || '').replace(/[^\x20-\x7E]/g, ' ');
    for (const byte of encoder.encode(clean + '\n')) chunks.push(byte);
  };

  pushBytes(0x1b, 0x40);
  if (kickDrawer) pushBytes(...buildCashDrawerKickBytes(0));
  pushBytes(0x1b, 0x61, 0x01);
  pushBytes(0x1b, 0x45, 0x01);
  pushLine(data.schoolName || 'SOFTCODE ENTERPRISE');
  pushBytes(0x1b, 0x45, 0x00);
  if (data.branchName) pushLine(data.branchName);
  pushLine(data.receiptTitle || 'THERMAL RECEIPT');
  pushLine(`STATUS: ${data.status}`);
  pushLine('--------------------------------');
  pushBytes(0x1b, 0x61, 0x00);
  pushLine(`Ref:     ${data.txnRef}`);
  pushLine(`Challan: ${data.challanNo}`);
  pushLine(`Date:    ${data.paidAtLabel}`);
  pushLine(`Payer:   ${data.studentName}`);
  pushLine(`ID #:    ${data.rollNo} (${data.grade})`);
  pushLine(`Channel: ${data.gatewayName}`);
  if (data.proofReference) pushLine(`TID:     ${data.proofReference}`);
  pushLine('--------------------------------');
  pushLine(`Base:    PKR ${formatMoney(data.baseAmount, 'PKR')}`);
  pushLine(`Charges: PKR ${formatMoney(data.gatewayFee, 'PKR')}`);
  pushBytes(0x1b, 0x45, 0x01);
  pushLine(`TOTAL:   PKR ${formatMoney(data.totalAmount, 'PKR')}`);
  pushBytes(0x1b, 0x45, 0x00);
  pushLine('--------------------------------');
  pushBytes(0x1b, 0x61, 0x01);
  const codeData = (data.challanNo || data.txnRef).replace(/[^\x20-\x7E]/g, '').slice(0, 24);
  if (codeData.length > 0) {
    pushBytes(0x1d, 0x68, 48, 0x1d, 0x77, 2, 0x1d, 0x48, 2);
    const codeBytes = Array.from(encoder.encode(`{B${codeData}`));
    pushBytes(0x1d, 0x6b, 73, codeBytes.length, ...codeBytes);
    pushLine('');
  }
  pushLine(data.footerNote || 'Thank you - Verified Thermal Receipt');
  pushBytes(0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x41, 0x10);
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
