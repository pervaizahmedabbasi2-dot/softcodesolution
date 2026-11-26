import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface Code128Bar {
  x: number;
  width: number;
}

export interface Code128Layout {
  totalWidth: number;
  bars: Code128Bar[];
  encodedText: string;
}

// ISO/IEC 15417 Code-128 bar-space module widths (indices 0..106)
// Every pattern 0..105 has 6 elements [bar, space, bar, space, bar, space] summing to 11.
// Index 106 (STOP) has 7 elements summing to 13.
const CODE128_PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

export function encodeCode128B(rawText: string, moduleWidth = 1.35, quietZoneModules = 8): Code128Layout {
  const sanitized = String(rawText || 'SCH-2026')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, 36) || 'SCH-2026';

  const codes: number[] = [104]; // Start Code B
  let checksum = 104;
  for (let i = 0; i < sanitized.length; i++) {
    const val = sanitized.charCodeAt(i) - 32;
    if (val >= 0 && val <= 95) {
      codes.push(val);
      checksum += val * (i + 1);
    }
  }
  codes.push(checksum % 103);
  codes.push(106); // STOP

  const bars: Code128Bar[] = [];
  let cursor = quietZoneModules * moduleWidth;
  for (const sym of codes) {
    const pattern = CODE128_PATTERNS[sym] || CODE128_PATTERNS[0];
    for (let i = 0; i < pattern.length; i++) {
      const w = Number(pattern[i]) * moduleWidth;
      if (i % 2 === 0) {
        bars.push({ x: Number(cursor.toFixed(2)), width: Number(w.toFixed(2)) });
      }
      cursor += w;
    }
  }
  cursor += quietZoneModules * moduleWidth;

  return {
    totalWidth: Math.max(80, Math.ceil(cursor)),
    bars,
    encodedText: sanitized
  };
}

export function buildCode128SvgMarkup(rawText: string, height = 38, barColor = '#0f172a'): string {
  const layout = encodeCode128B(rawText, 1.4, 8);
  const rects = layout.bars
    .map((b) => `<rect x="${b.x}" y="0" width="${b.width}" height="${height}" fill="${barColor}" />`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.totalWidth} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Barcode ${layout.encodedText}"><rect x="0" y="0" width="${layout.totalWidth}" height="${height}" fill="#ffffff" />${rects}</svg>`;
}

@Component({
  selector: 'app-school-barcode',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex flex-col items-center justify-center max-w-full select-none">
      <div class="bg-white rounded-md px-1.5 py-1 border border-slate-200/80 shadow-2xs max-w-full overflow-hidden">
        <svg
          [attr.viewBox]="'0 0 ' + layout().totalWidth + ' ' + height()"
          [attr.height]="height()"
          class="block max-w-full w-auto"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          [attr.aria-label]="'Barcode ' + layout().encodedText">
          <rect x="0" y="0" [attr.width]="layout().totalWidth" [attr.height]="height()" fill="#ffffff" />
          @for (bar of layout().bars; track $index) {
            <rect [attr.x]="bar.x" y="0" [attr.width]="bar.width" [attr.height]="height()" fill="#0f172a" />
          }
        </svg>
      </div>
      @if (showText()) {
        <span class="mt-1 text-[9px] font-mono font-black tracking-widest uppercase text-slate-900 leading-none">
          {{ displayLabel() }}
        </span>
      }
    </div>
  `
})
export class SchoolBarcodeComponent {
  readonly value = input<string>('SCH-2026');
  readonly label = input<string>('');
  readonly height = input<number>(34);
  readonly barWidth = input<number>(1.35);
  readonly showText = input<boolean>(true);

  readonly layout = computed(() => encodeCode128B(this.value(), this.barWidth()));
  readonly displayLabel = computed(() => this.label() || this.layout().encodedText);
}
