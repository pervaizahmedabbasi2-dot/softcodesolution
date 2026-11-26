import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { QrEccLevel, buildQrPathData, encodeQrMatrix } from '../../../../shared/hardware/qr-code.util';
import {
  Code128Bar,
  Code128Layout,
  encodeCode128B,
  buildCode128SvgMarkup
} from '../../../../shared/hardware/barcode.component';

export type { Code128Bar, Code128Layout };
export { encodeCode128B, buildCode128SvgMarkup };

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

@Component({
  selector: 'app-school-qr-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex flex-col items-center justify-center select-none">
      <div class="bg-white rounded-lg p-1 border border-slate-200/90 shadow-2xs overflow-hidden inline-flex items-center justify-center">
        <svg
          [attr.viewBox]="'0 0 ' + viewSize() + ' ' + viewSize()"
          [attr.width]="size()"
          [attr.height]="size()"
          shape-rendering="crispEdges"
          class="block"
          role="img"
          [attr.aria-label]="'QR ' + qr().encodedText">
          <rect x="0" y="0" [attr.width]="viewSize()" [attr.height]="viewSize()" fill="#ffffff" />
          <path [attr.d]="pathData()" [attr.fill]="color()" />
        </svg>
      </div>
      @if (label()) {
        <span class="mt-0.5 text-[8px] font-mono font-black tracking-wider uppercase text-slate-700 leading-none">
          {{ label() }}
        </span>
      }
    </div>
  `
})
export class SchoolQrCodeComponent {
  readonly value = input<string>('SCH-2026');
  readonly label = input<string>('');
  readonly size = input<number>(64);
  readonly color = input<string>('#0f172a');
  readonly ecc = input<QrEccLevel>('M');
  readonly quietZone = input<number>(2);

  readonly qr = computed(() => encodeQrMatrix(this.value(), this.ecc()));
  readonly viewSize = computed(() => this.qr().size + this.quietZone() * 2);
  readonly pathData = computed(() => buildQrPathData(this.qr().matrix, this.quietZone()));
}
