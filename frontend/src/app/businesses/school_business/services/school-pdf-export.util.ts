export interface PdfStudentCardSection {
  title: string;
  items: Array<{ label: string; value: string }>;
}

export interface PdfStudentCardEntry {
  name: string;
  rollNo: string;
  studentId: string;
  gradeSection: string;
  feeStatus: string;
  feeAmountText: string;
  attendanceText: string;
  admissionDate: string;
  sections: PdfStudentCardSection[];
}

function sanitizePdfText(raw: unknown): string {
  const str = String(raw ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[—–]/g, '-')
    .replace(/[·•]/g, '|')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return str;
}

function escapePdfLiteral(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function approxTextWidth(text: string, fontSize: number): number {
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 32 || ch === 105 || ch === 108 || ch === 116 || ch === 73 || ch === 46 || ch === 44) {
      w += fontSize * 0.28;
    } else if (ch >= 65 && ch <= 90) {
      w += fontSize * 0.66;
    } else if (ch === 109 || ch === 119 || ch === 77 || ch === 87) {
      w += fontSize * 0.78;
    } else {
      w += fontSize * 0.52;
    }
  }
  return w;
}

function wrapTextLines(raw: string, maxWidthPt: number, fontSize: number, maxLines = 4): string[] {
  const text = sanitizePdfText(raw) || '-';
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (approxTextWidth(candidate, fontSize) <= maxWidthPt) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
        current = '';
        if (lines.length >= maxLines) break;
      }
      // Handle single long token
      if (approxTextWidth(word, fontSize) > maxWidthPt) {
        let slice = '';
        for (const ch of word) {
          if (approxTextWidth(slice + ch + '..', fontSize) > maxWidthPt && slice.length > 0) {
            lines.push(slice);
            slice = ch;
            if (lines.length >= maxLines) break;
          } else {
            slice += ch;
          }
        }
        current = lines.length < maxLines ? slice : '';
      } else {
        current = word;
      }
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === 0) return ['-'];
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length + 3) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? `${last.slice(0, last.length - 2)}..` : `${last}..`;
  }
  return lines;
}

class PdfCanvasBuilder {
  private pages: string[][] = [];
  private currentOps: string[] = [];
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.startPage();
  }

  startPage(): void {
    this.currentOps = [];
    this.pages.push(this.currentOps);
  }

  private yPdf(topY: number): number {
    return this.height - topY;
  }

  fillRect(x: number, topY: number, w: number, h: number, r: number, g: number, b: number): void {
    const y = this.height - topY - h;
    this.currentOps.push(
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`
    );
  }

  strokeRect(x: number, topY: number, w: number, h: number, r: number, g: number, b: number, lineWidth = 0.6): void {
    const y = this.height - topY - h;
    this.currentOps.push(
      `${lineWidth.toFixed(2)} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`
    );
  }

  drawLine(x1: number, topY1: number, x2: number, topY2: number, r: number, g: number, b: number, lineWidth = 0.5): void {
    this.currentOps.push(
      `${lineWidth.toFixed(2)} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1.toFixed(2)} ${this.yPdf(topY1).toFixed(2)} m ${x2.toFixed(2)} ${this.yPdf(topY2).toFixed(2)} l S`
    );
  }

  drawText(
    text: string,
    x: number,
    topBaselineY: number,
    size: number,
    bold = false,
    color: [number, number, number] = [0.08, 0.11, 0.17]
  ): void {
    const safe = escapePdfLiteral(sanitizePdfText(text));
    const fontKey = bold ? '/F2' : '/F1';
    this.currentOps.push(
      `BT ${fontKey} ${size.toFixed(2)} Tf ${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg 1 0 0 1 ${x.toFixed(2)} ${this.yPdf(topBaselineY).toFixed(2)} Tm (${safe}) Tj ET`
    );
  }

  getPageCount(): number {
    return this.pages.length;
  }

  stampFooters(footerPrefix: string): void {
    const total = this.pages.length;
    for (let i = 0; i < total; i++) {
      const ops = this.pages[i];
      const saved = this.currentOps;
      this.currentOps = ops;
      const lineY = this.height - 26;
      this.drawLine(28, lineY, this.width - 28, lineY, 0.85, 0.88, 0.92, 0.5);
      this.drawText(footerPrefix, 28, this.height - 14, 7.5, false, [0.42, 0.46, 0.54]);
      const pageStr = `Page ${i + 1} of ${total}`;
      const pWidth = approxTextWidth(pageStr, 7.5);
      this.drawText(pageStr, this.width - 28 - pWidth, this.height - 14, 7.5, true, [0.3, 0.35, 0.45]);
      this.currentOps = saved;
    }
  }

  buildBytes(): Uint8Array {
    const encoder = new TextEncoder();
    const objects: string[] = [];

    // 1: Catalog, 2: Pages, 3: Helvetica, 4: Helvetica-Bold
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    const pageObjIds: number[] = [];
    let nextId = 5;
    const contentEntries: Array<{ pageId: number; streamId: number; streamBody: string }> = [];

    for (const pageOps of this.pages) {
      const pageId = nextId++;
      const streamId = nextId++;
      pageObjIds.push(pageId);
      contentEntries.push({
        pageId,
        streamId,
        streamBody: pageOps.join('\n')
      });
    }

    const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${pageObjIds.length} >>\nendobj\n`);
    objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');
    objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');

    for (const entry of contentEntries) {
      objects.push(
        `${entry.pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width.toFixed(2)} ${this.height.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${entry.streamId} 0 R >>\nendobj\n`
      );
      const streamLen = encoder.encode(entry.streamBody).length;
      objects.push(
        `${entry.streamId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${entry.streamBody}\nendstream\nendobj\n`
      );
    }

    const chunks: Uint8Array[] = [];
    const header = encoder.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    chunks.push(header);

    let offset = header.length;
    const offsets: number[] = [0];

    for (const objStr of objects) {
      offsets.push(offset);
      const bytes = encoder.encode(objStr);
      chunks.push(bytes);
      offset += bytes.length;
    }

    const xrefOffset = offset;
    const xrefLines: string[] = [
      `xref\n0 ${offsets.length}\n`,
      '0000000000 65535 f \n'
    ];
    for (let i = 1; i < offsets.length; i++) {
      xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    }
    const trailer = `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    chunks.push(encoder.encode(xrefLines.join('') + trailer));

    const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(totalLen);
    let cursor = 0;
    for (const chunk of chunks) {
      merged.set(chunk, cursor);
      cursor += chunk.length;
    }
    return merged;
  }
}

export function triggerPdfDownload(bytes: Uint8Array, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadStudentsTablePdf(params: {
  title: string;
  subtitle: string;
  headers: string[];
  rows: string[][];
  filename: string;
}): void {
  const PAGE_W = 841.89; // A4 Landscape
  const PAGE_H = 595.28;
  const MARGIN_X = 28;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;
  const BOTTOM_LIMIT = PAGE_H - 36;

  const doc = new PdfCanvasBuilder(PAGE_W, PAGE_H);
  const headers = params.headers.length > 0 ? params.headers : ['Record'];
  const colCount = headers.length;

  // Compute proportional column widths bounded nicely
  const rawWeights = headers.map((h, idx) => {
    let maxLen = sanitizePdfText(h).length;
    for (let r = 0; r < Math.min(params.rows.length, 40); r++) {
      const cellLen = sanitizePdfText(params.rows[r]?.[idx] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return Math.min(34, Math.max(8, maxLen));
  });
  const totalWeight = rawWeights.reduce((a, b) => a + b, 0) || colCount;
  const colWidths = rawWeights.map((w) => (w / totalWeight) * CONTENT_W);

  const fontSize = colCount > 12 ? 6.5 : (colCount > 9 ? 7.0 : 7.8);
  const lineHeight = fontSize + 2.6;

  const drawPageHeader = (isFirst: boolean): number => {
    const bannerH = isFirst ? 52 : 34;
    doc.fillRect(MARGIN_X, 20, CONTENT_W, bannerH, 0.11, 0.16, 0.30);
    doc.drawText(params.title, MARGIN_X + 14, 39, isFirst ? 13 : 10.5, true, [1, 1, 1]);
    if (isFirst) {
      doc.drawText(params.subtitle, MARGIN_X + 14, 57, 8.2, false, [0.80, 0.86, 0.98]);
    }
    const headerTop = 20 + bannerH + 8;

    // Wrap header labels
    const wrappedHeaders = headers.map((h, i) => wrapTextLines(h, Math.max(24, colWidths[i] - 8), fontSize, 2));
    const maxHeaderLines = Math.max(1, ...wrappedHeaders.map((ls) => ls.length));
    const thHeight = maxHeaderLines * (fontSize + 2.4) + 10;

    doc.fillRect(MARGIN_X, headerTop, CONTENT_W, thHeight, 0.93, 0.95, 0.98);
    doc.strokeRect(MARGIN_X, headerTop, CONTENT_W, thHeight, 0.78, 0.82, 0.89, 0.6);

    let cx = MARGIN_X;
    for (let i = 0; i < colCount; i++) {
      const lines = wrappedHeaders[i];
      lines.forEach((line, lIdx) => {
        doc.drawText(line, cx + 4, headerTop + 11 + lIdx * (fontSize + 2.2), fontSize, true, [0.15, 0.20, 0.30]);
      });
      if (i > 0) {
        doc.drawLine(cx, headerTop, cx, headerTop + thHeight, 0.84, 0.87, 0.92, 0.4);
      }
      cx += colWidths[i];
    }
    return headerTop + thHeight;
  };

  let cursorY = drawPageHeader(true);

  if (params.rows.length === 0) {
    doc.strokeRect(MARGIN_X, cursorY, CONTENT_W, 28, 0.85, 0.88, 0.92, 0.5);
    doc.drawText('No student records matched the active filters.', MARGIN_X + 12, cursorY + 17, 8.5, false, [0.45, 0.50, 0.58]);
  } else {
    params.rows.forEach((row, rIdx) => {
      const wrappedCells = headers.map((_, cIdx) =>
        wrapTextLines(row[cIdx] ?? '-', Math.max(24, colWidths[cIdx] - 8), fontSize, 4)
      );
      const maxLines = Math.max(1, ...wrappedCells.map((ls) => ls.length));
      const rowH = maxLines * lineHeight + 8;

      if (cursorY + rowH > BOTTOM_LIMIT) {
        doc.startPage();
        cursorY = drawPageHeader(false);
      }

      if (rIdx % 2 === 1) {
        doc.fillRect(MARGIN_X, cursorY, CONTENT_W, rowH, 0.98, 0.985, 0.995);
      }
      doc.strokeRect(MARGIN_X, cursorY, CONTENT_W, rowH, 0.86, 0.89, 0.93, 0.45);

      let cx = MARGIN_X;
      for (let cIdx = 0; cIdx < colCount; cIdx++) {
        const lines = wrappedCells[cIdx];
        lines.forEach((line, lIdx) => {
          doc.drawText(line, cx + 4, cursorY + 10.5 + lIdx * lineHeight, fontSize, cIdx === 0 || cIdx === 1, [0.12, 0.15, 0.22]);
        });
        if (cIdx > 0) {
          doc.drawLine(cx, cursorY, cx, cursorY + rowH, 0.90, 0.92, 0.95, 0.35);
        }
        cx += colWidths[cIdx];
      }
      cursorY += rowH;
    });
  }

  doc.stampFooters(`SoftCode School ERP | Row-Wise Student Master Export | Generated ${new Date().toLocaleString()}`);
  triggerPdfDownload(doc.buildBytes(), params.filename);
}

export function downloadStudentsCardsPdf(params: {
  title: string;
  subtitle: string;
  cards: PdfStudentCardEntry[];
  filename: string;
  singleDossierMode?: boolean;
}): void {
  const PAGE_W = 595.28; // A4 Portrait
  const PAGE_H = 841.89;
  const MARGIN_X = 28;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;
  const BOTTOM_LIMIT = PAGE_H - 36;

  const doc = new PdfCanvasBuilder(PAGE_W, PAGE_H);

  const drawDocHeader = (isFirst: boolean): number => {
    const h = isFirst ? 50 : 30;
    doc.fillRect(MARGIN_X, 22, CONTENT_W, h, 0.19, 0.22, 0.56);
    doc.drawText(params.title, MARGIN_X + 12, 40, isFirst ? 12.5 : 10, true, [1, 1, 1]);
    if (isFirst) {
      doc.drawText(params.subtitle, MARGIN_X + 12, 57, 8, false, [0.85, 0.88, 0.99]);
    }
    return 22 + h + 12;
  };

  let cursorY = drawDocHeader(true);

  const estimateCardHeight = (card: PdfStudentCardEntry): number => {
    let h = 44; // Card header bar
    for (const sec of card.sections) {
      h += 18; // Section heading
      const rows = Math.ceil(sec.items.length / 2);
      h += rows * 16 + 6;
    }
    h += 28; // Fee & attendance footer bar inside card
    return h + 10;
  };

  params.cards.forEach((card) => {
    const neededH = estimateCardHeight(card);
    if (!params.singleDossierMode && cursorY + neededH > BOTTOM_LIMIT && cursorY > 95) {
      doc.startPage();
      cursorY = drawDocHeader(false);
    }

    let cardStartY = cursorY;

    // Card header bar
    doc.fillRect(MARGIN_X, cursorY, CONTENT_W, 38, 0.95, 0.96, 0.99);
    doc.drawText(card.name || 'Student', MARGIN_X + 10, cursorY + 16, 10.5, true, [0.08, 0.11, 0.22]);
    doc.drawText(
      `Roll #${card.rollNo} | ${card.studentId} | ${card.gradeSection} | Admitted: ${card.admissionDate || 'On file'}`,
      MARGIN_X + 10,
      cursorY + 30,
      7.6,
      false,
      [0.36, 0.41, 0.51]
    );
    const badgeTxt = `${card.feeStatus || 'Active'} | ${card.feeAmountText}`;
    const badgeW = approxTextWidth(badgeTxt, 7.6);
    doc.drawText(badgeTxt, MARGIN_X + CONTENT_W - badgeW - 10, cursorY + 17, 7.6, true, [0.10, 0.42, 0.30]);
    const attTxt = `Attendance: ${card.attendanceText || '100%'}`;
    const attW = approxTextWidth(attTxt, 7.2);
    doc.drawText(attTxt, MARGIN_X + CONTENT_W - attW - 10, cursorY + 30, 7.2, false, [0.32, 0.37, 0.48]);

    cursorY += 44;

    const halfW = (CONTENT_W - 24) / 2;

    for (const sec of card.sections) {
      if (sec.items.length === 0) continue;
      if (cursorY + 28 > BOTTOM_LIMIT) {
        doc.strokeRect(MARGIN_X, cardStartY, CONTENT_W, Math.max(20, cursorY - cardStartY), 0.80, 0.84, 0.90, 0.6);
        doc.startPage();
        cursorY = drawDocHeader(false);
        cardStartY = cursorY;
      }

      doc.drawText(sec.title.toUpperCase(), MARGIN_X + 10, cursorY + 8, 7.3, true, [0.25, 0.29, 0.72]);
      doc.drawLine(MARGIN_X + 10, cursorY + 11, MARGIN_X + CONTENT_W - 10, cursorY + 11, 0.90, 0.92, 0.96, 0.5);
      cursorY += 16;

      for (let i = 0; i < sec.items.length; i += 2) {
        const left = sec.items[i];
        const right = sec.items[i + 1];

        const leftValLines = wrapTextLines(left.value || '-', halfW - 95, 7.5, 2);
        const rightValLines = right ? wrapTextLines(right.value || '-', halfW - 95, 7.5, 2) : [];
        const lineCount = Math.max(1, leftValLines.length, rightValLines.length);
        const rowH = lineCount * 10 + 4;

        if (cursorY + rowH > BOTTOM_LIMIT) {
          doc.strokeRect(MARGIN_X, cardStartY, CONTENT_W, Math.max(20, cursorY - cardStartY), 0.80, 0.84, 0.90, 0.6);
          doc.startPage();
          cursorY = drawDocHeader(false);
          cardStartY = cursorY;
        }

        const drawPair = (item: { label: string; value: string }, valLines: string[], baseX: number) => {
          const lbl = wrapTextLines(`${item.label}:`, 92, 7.4, 1)[0];
          doc.drawText(lbl, baseX, cursorY + 8, 7.4, false, [0.42, 0.46, 0.55]);
          valLines.forEach((vl, lIdx) => {
            doc.drawText(vl, baseX + 94, cursorY + 8 + lIdx * 9.5, 7.5, true, [0.10, 0.13, 0.20]);
          });
        };

        drawPair(left, leftValLines, MARGIN_X + 10);
        if (right) {
          drawPair(right, rightValLines, MARGIN_X + 16 + halfW);
        }
        cursorY += rowH;
      }
      cursorY += 4;
    }

    doc.strokeRect(MARGIN_X, cardStartY, CONTENT_W, Math.max(40, cursorY - cardStartY + 2), 0.78, 0.82, 0.90, 0.65);
    cursorY += 14;
  });

  doc.stampFooters(`SoftCode School ERP | Student Profile Dossier Export | Generated ${new Date().toLocaleString()}`);
  triggerPdfDownload(doc.buildBytes(), params.filename);
}
