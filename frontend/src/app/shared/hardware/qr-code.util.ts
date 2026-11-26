// Pure TypeScript ISO/IEC 18004 QR Code Matrix Generator (Byte Mode, Versions 1..10, ECC L/M)
// Zero external dependencies; offline-ready for 3-Copy Challans, Invoices, ID Cards, Waybills & Thermal Receipts.

export type QrEccLevel = 'L' | 'M';

export interface QrMatrixResult {
  version: number;
  size: number;
  ecc: QrEccLevel;
  matrix: boolean[][];
  encodedText: string;
}

interface QrVersionSpec {
  version: number;
  totalDataCodewords: number;
  eccCodewordsPerBlock: number;
  group1Blocks: number;
  group1DataCodewords: number;
  group2Blocks: number;
  group2DataCodewords: number;
}

const QR_SPECS_L: readonly QrVersionSpec[] = [
  { version: 1, totalDataCodewords: 19, eccCodewordsPerBlock: 7, group1Blocks: 1, group1DataCodewords: 19, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 2, totalDataCodewords: 34, eccCodewordsPerBlock: 10, group1Blocks: 1, group1DataCodewords: 34, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 3, totalDataCodewords: 55, eccCodewordsPerBlock: 15, group1Blocks: 1, group1DataCodewords: 55, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 4, totalDataCodewords: 80, eccCodewordsPerBlock: 20, group1Blocks: 1, group1DataCodewords: 80, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 5, totalDataCodewords: 108, eccCodewordsPerBlock: 26, group1Blocks: 1, group1DataCodewords: 108, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 6, totalDataCodewords: 136, eccCodewordsPerBlock: 18, group1Blocks: 2, group1DataCodewords: 68, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 7, totalDataCodewords: 156, eccCodewordsPerBlock: 20, group1Blocks: 2, group1DataCodewords: 78, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 8, totalDataCodewords: 194, eccCodewordsPerBlock: 24, group1Blocks: 2, group1DataCodewords: 97, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 9, totalDataCodewords: 232, eccCodewordsPerBlock: 30, group1Blocks: 2, group1DataCodewords: 116, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 10, totalDataCodewords: 274, eccCodewordsPerBlock: 18, group1Blocks: 2, group1DataCodewords: 68, group2Blocks: 2, group2DataCodewords: 69 }
];

const QR_SPECS_M: readonly QrVersionSpec[] = [
  { version: 1, totalDataCodewords: 16, eccCodewordsPerBlock: 10, group1Blocks: 1, group1DataCodewords: 16, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 2, totalDataCodewords: 28, eccCodewordsPerBlock: 16, group1Blocks: 1, group1DataCodewords: 28, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 3, totalDataCodewords: 44, eccCodewordsPerBlock: 26, group1Blocks: 1, group1DataCodewords: 44, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 4, totalDataCodewords: 64, eccCodewordsPerBlock: 18, group1Blocks: 2, group1DataCodewords: 32, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 5, totalDataCodewords: 86, eccCodewordsPerBlock: 24, group1Blocks: 2, group1DataCodewords: 43, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 6, totalDataCodewords: 108, eccCodewordsPerBlock: 16, group1Blocks: 4, group1DataCodewords: 27, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 7, totalDataCodewords: 124, eccCodewordsPerBlock: 18, group1Blocks: 4, group1DataCodewords: 31, group2Blocks: 0, group2DataCodewords: 0 },
  { version: 8, totalDataCodewords: 154, eccCodewordsPerBlock: 22, group1Blocks: 2, group1DataCodewords: 38, group2Blocks: 2, group2DataCodewords: 39 },
  { version: 9, totalDataCodewords: 182, eccCodewordsPerBlock: 22, group1Blocks: 3, group1DataCodewords: 36, group2Blocks: 2, group2DataCodewords: 37 },
  { version: 10, totalDataCodewords: 216, eccCodewordsPerBlock: 26, group1Blocks: 4, group1DataCodewords: 43, group2Blocks: 1, group2DataCodewords: 44 }
];

const ALIGNMENT_POSITIONS: readonly (readonly number[])[] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50]
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildRsGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function computeRsEcc(data: Uint8Array, eccLen: number): Uint8Array {
  const gen = buildRsGenerator(eccLen);
  const res = new Uint8Array(eccLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.copyWithin(0, 1);
    res[eccLen - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < eccLen; j++) {
        res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return res;
}

function utf8Bytes(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

function pickSpec(byteLen: number, ecc: QrEccLevel): { spec: QrVersionSpec; usableBytesLen: number } {
  const specs = ecc === 'L' ? QR_SPECS_L : QR_SPECS_M;
  for (const spec of specs) {
    const countBits = spec.version <= 9 ? 8 : 16;
    const overheadBits = 4 + countBits;
    const capacityBytes = Math.floor((spec.totalDataCodewords * 8 - overheadBits) / 8);
    if (byteLen <= capacityBytes) {
      return { spec, usableBytesLen: byteLen };
    }
  }
  const maxSpec = specs[specs.length - 1];
  const maxCap = Math.floor((maxSpec.totalDataCodewords * 8 - 20) / 8);
  return { spec: maxSpec, usableBytesLen: Math.min(byteLen, maxCap) };
}

function encodeDataCodewords(bytes: Uint8Array, spec: QrVersionSpec): Uint8Array {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  const countBits = spec.version <= 9 ? 8 : 16;
  pushBits(bytes.length, countBits);
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  const totalBits = spec.totalDataCodewords * 8;
  const terminatorLen = Math.min(4, Math.max(0, totalBits - bits.length));
  pushBits(0, terminatorLen);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords = new Uint8Array(spec.totalDataCodewords);
  const byteCount = bits.length / 8;
  for (let i = 0; i < byteCount; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    codewords[i] = b;
  }

  let padToggle = 0;
  for (let i = byteCount; i < spec.totalDataCodewords; i++) {
    codewords[i] = padToggle === 0 ? 0xec : 0x11;
    padToggle ^= 1;
  }

  return codewords;
}

function interleaveBlocks(dataCodewords: Uint8Array, spec: QrVersionSpec): number[] {
  const dataBlocks: Uint8Array[] = [];
  const eccBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < spec.group1Blocks; i++) {
    const slice = dataCodewords.subarray(offset, offset + spec.group1DataCodewords);
    offset += spec.group1DataCodewords;
    dataBlocks.push(slice);
    eccBlocks.push(computeRsEcc(slice, spec.eccCodewordsPerBlock));
  }
  for (let i = 0; i < spec.group2Blocks; i++) {
    const slice = dataCodewords.subarray(offset, offset + spec.group2DataCodewords);
    offset += spec.group2DataCodewords;
    dataBlocks.push(slice);
    eccBlocks.push(computeRsEcc(slice, spec.eccCodewordsPerBlock));
  }

  const out: number[] = [];
  const maxDataLen = Math.max(spec.group1DataCodewords, spec.group2DataCodewords);
  for (let col = 0; col < maxDataLen; col++) {
    for (const blk of dataBlocks) {
      if (col < blk.length) out.push(blk[col]);
    }
  }
  for (let col = 0; col < spec.eccCodewordsPerBlock; col++) {
    for (const blk of eccBlocks) {
      if (col < blk.length) out.push(blk[col]);
    }
  }
  return out;
}

function buildFunctionGrid(version: number): { modules: boolean[][]; isFunction: boolean[][] } {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const setFn = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  const drawFinder = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onRing = inOuter && (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFn(r, c, onRing || inCore);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  const alignPos = ALIGNMENT_POSITIONS[version] || [];
  for (let i = 0; i < alignPos.length; i++) {
    for (let j = 0; j < alignPos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === alignPos.length - 1) || (i === alignPos.length - 1 && j === 0)) {
        continue;
      }
      const cr = alignPos[i];
      const cc = alignPos[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFn(cr + dr, cc + dc, dist === 2 || dist === 0);
        }
      }
    }
  }

  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0;
    if (!isFunction[6][i]) setFn(6, i, dark);
    if (!isFunction[i][6]) setFn(i, 6, dark);
  }

  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
  }
  for (let i = 0; i < 7; i++) {
    isFunction[size - 1 - i][8] = true;
  }
  setFn(4 * version + 9, 8, true);

  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const verBits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((verBits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, dark);
      setFn(b, a, dark);
    }
  }

  return { modules, isFunction };
}

function placeCodewords(modules: boolean[][], isFunction: boolean[][], allCodewords: number[]): void {
  const size = modules.length;
  const totalBits = allCodewords.length * 8;
  let bitIdx = 0;
  let upward = true;

  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let d = 0; d < 2; d++) {
        const c = rightCol - d;
        if (!isFunction[r][c]) {
          let bit = false;
          if (bitIdx < totalBits) {
            const cw = allCodewords[bitIdx >>> 3];
            bit = ((cw >>> (7 - (bitIdx & 7))) & 1) === 1;
          }
          modules[r][c] = bit;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }
}

function maskBit(maskId: number, r: number, c: number): boolean {
  switch (maskId) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

function applyFormatInfo(modules: boolean[][], ecc: QrEccLevel, maskId: number): void {
  const size = modules.length;
  const eccBits = ecc === 'L' ? 0b01 : 0b00;
  const data = (eccBits << 3) | (maskId & 0b111);
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  const bits = ((data << 10) | rem) ^ 0x5412;

  for (let i = 0; i <= 5; i++) modules[8][i] = ((bits >>> i) & 1) === 1;
  modules[8][7] = ((bits >>> 6) & 1) === 1;
  modules[8][8] = ((bits >>> 7) & 1) === 1;
  modules[7][8] = ((bits >>> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) modules[14 - i][8] = ((bits >>> i) & 1) === 1;

  for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = ((bits >>> i) & 1) === 1;
  for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = ((bits >>> i) & 1) === 1;
}

function evaluatePenalty(modules: boolean[][]): number {
  const size = modules.length;
  let penalty = 0;

  for (let r = 0; r < size; r++) {
    let runColor = modules[r][0];
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (modules[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }
  for (let c = 0; c < size; c++) {
    let runColor = modules[0][c];
    let runLen = 1;
    for (let r = 1; r < size; r++) {
      if (modules[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const b = modules[r][c];
      if (b === modules[r][c + 1] && b === modules[r + 1][c] && b === modules[r + 1][c + 1]) {
        penalty += 3;
      }
    }
  }

  const matchFinderLike = (arr: boolean[], i: number): boolean => {
    const p1 = arr[i] && !arr[i + 1] && arr[i + 2] && arr[i + 3] && arr[i + 4] && !arr[i + 5] && arr[i + 6];
    if (!p1) return false;
    const leftClear = i >= 4 && !arr[i - 1] && !arr[i - 2] && !arr[i - 3] && !arr[i - 4];
    const rightClear = i + 10 < arr.length && !arr[i + 7] && !arr[i + 8] && !arr[i + 9] && !arr[i + 10];
    return leftClear || rightClear;
  };
  for (let r = 0; r < size; r++) {
    const row = modules[r];
    for (let c = 0; c <= size - 7; c++) {
      if (matchFinderLike(row, c)) penalty += 40;
    }
  }
  const colBuf = new Array<boolean>(size);
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) colBuf[r] = modules[r][c];
    for (let r = 0; r <= size - 7; r++) {
      if (matchFinderLike(colBuf, r)) penalty += 40;
    }
  }

  let darkCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) darkCount++;
    }
  }
  const total = size * size;
  const k = Math.floor(Math.abs(darkCount * 20 - total * 10) / total);
  penalty += k * 10;

  return penalty;
}

export function encodeQrMatrix(rawText: string, ecc: QrEccLevel = 'M'): QrMatrixResult {
  const cleanText = String(rawText || 'SCS-2026').trim() || 'SCS-2026';
  const rawBytes = utf8Bytes(cleanText);
  const { spec, usableBytesLen } = pickSpec(rawBytes.length, ecc);
  const clippedBytes = rawBytes.subarray(0, usableBytesLen);
  const dataCw = encodeDataCodewords(clippedBytes, spec);
  const finalCw = interleaveBlocks(dataCw, spec);

  const { modules: baseModules, isFunction } = buildFunctionGrid(spec.version);
  placeCodewords(baseModules, isFunction, finalCw);

  const size = baseModules.length;
  let bestPenalty = Number.POSITIVE_INFINITY;
  let bestMatrix: boolean[][] = baseModules;

  for (let m = 0; m < 8; m++) {
    const candidate = baseModules.map((row, r) =>
      row.map((val, c) => (!isFunction[r][c] && maskBit(m, r, c) ? !val : val))
    );
    applyFormatInfo(candidate, ecc, m);
    const penalty = evaluatePenalty(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMatrix = candidate;
    }
  }

  return {
    version: spec.version,
    size,
    ecc,
    matrix: bestMatrix,
    encodedText: cleanText
  };
}

export function buildQrPathData(matrix: boolean[][], quietZone = 2): string {
  const parts: string[] = [];
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    let c = 0;
    while (c < row.length) {
      if (row[c]) {
        const start = c;
        while (c < row.length && row[c]) c++;
        const w = c - start;
        parts.push(`M${start + quietZone} ${r + quietZone}h${w}v1h-${w}z`);
      } else {
        c++;
      }
    }
  }
  return parts.join('');
}

export function buildQrCodeSvgMarkup(
  rawText: string,
  sizePx = 76,
  darkColor = '#0f172a',
  quietZone = 2,
  ecc: QrEccLevel = 'M'
): string {
  const qr = encodeQrMatrix(rawText, ecc);
  const viewSize = qr.size + quietZone * 2;
  const path = buildQrPathData(qr.matrix, quietZone);
  const escaped = String(qr.encodedText)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges" role="img" aria-label="QR ${escaped}"><rect width="${viewSize}" height="${viewSize}" fill="#ffffff"/><path d="${path}" fill="${darkColor}"/></svg>`;
}
