import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SchoolTableSchemaService } from '../../services/school-table-schema.service';
import {
  PdfGenericCardEntry,
  downloadStudentsTablePdf,
  downloadTableCardsPdf
} from '../../services/school-pdf-export.util';
import {
  DEFAULT_SCHOOL_PRINT_BRANDING,
  PrintSectionKey,
  resolveEffectiveTableBranding,
  sanitizeBrandingLogoUrl
} from '../../utils/school-print-templates.util';
import {
  buildSchoolStatementA4Html,
  buildSchoolStatementCardHtml,
  buildSchoolStatementThermalHtml,
  buildSchoolStatementWhatsAppText,
  buildStatementCriteriaSubtitle,
  computeStatementAmounts,
  filterStatementRows,
  formatStatementMoney,
  parseAmountNumber
} from '../../utils/school-statement-print.util';
import {
  downloadPrintableHtmlFile,
  printHtmlInHiddenFrame
} from '../../../../shared/hardware/thermal-print.util';
import { SchoolBarcodeComponent, SchoolQrCodeComponent } from '../school-barcode/school-barcode.component';

type StatementFormatMode = 'a4' | '80mm' | '58mm' | 'card' | 'whatsapp';

interface ActionFeedbackState {
  message: string;
  tone: 'success' | 'warn' | 'info';
  offerHtmlDownload?: boolean;
}

@Component({
  selector: 'app-school-table-statement-modal',
  imports: [MatIconModule, SchoolBarcodeComponent, SchoolQrCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.escape)': 'handleEscape()'
  },
  template: `
    @if (modalState().open && dataset(); as data) {
      <div
        class="fixed inset-0 z-[10060] flex items-center justify-center bg-slate-950/55 p-3 sm:p-5 backdrop-blur-md animate-fade-in"
        (click)="close()"
      >
        <div
          class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_30px_70px_-15px_rgba(15,23,42,0.28)] animate-scale-up"
          (click)="$event.stopPropagation()"
        >
          <!-- Frosted Emerald-Glass Header (Matches SuperAdmin Client Overview Popup) -->
          <div class="relative shrink-0 border-b border-slate-200/80 bg-gradient-to-br from-white/95 via-emerald-50/40 to-slate-50/90 px-5 py-4 sm:px-6 sm:py-5">
            <div class="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/35 blur-2xl"></div>

            <div class="relative z-10 flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-center gap-3.5 sm:gap-4">
                <div class="relative shrink-0">
                  @if (safeLogoUrl() && branding().showLogoCrest !== false) {
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-md sm:h-14 sm:w-14">
                      <img
                        [src]="safeLogoUrl()"
                        alt="Campus logo"
                        referrerpolicy="no-referrer"
                        class="h-full w-full object-contain"
                      />
                    </div>
                  } @else {
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-800 text-base font-black uppercase text-white shadow-md shadow-emerald-600/20 sm:h-14 sm:w-14 sm:text-lg">
                      {{ monogramText() }}
                    </div>
                  }
                  <span class="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-xs">
                    <span class="h-1.5 w-1.5 rounded-full bg-white"></span>
                  </span>
                </div>

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      {{ primaryStatusValue() || stampBadgeText() }}
                    </span>
                    <span class="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 truncate max-w-[180px]">
                      {{ branding().schoolName }}
                    </span>
                    <span class="hidden sm:inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                      {{ statementRef() }}
                    </span>
                  </div>

                  <h2 class="mt-1 truncate text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                    {{ effectiveTitle() }}
                  </h2>

                  <div class="mt-0.5 flex items-center gap-1.5 min-w-0">
                    <p class="truncate text-xs font-semibold text-slate-500 sm:text-sm">
                      @if (isSingleRecord()) {
                        <span>{{ data.roleLabel || 'Official Campus Record' }} · {{ singleRecordFields().length }} Field(s)</span>
                      } @else {
                        <span>{{ data.roleLabel || 'Campus Register' }} · {{ filteredRows().length }} of {{ data.rows.length }} record(s)</span>
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                @if (isOwner()) {
                  <button
                    type="button"
                    (click)="openPrintStudioForTable()"
                    title="Customize print design for this table"
                    class="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px] text-emerald-600">tune</mat-icon>
                    <span>Print Design</span>
                  </button>
                }
                <button
                  type="button"
                  (click)="close()"
                  title="Close"
                  aria-label="Close modal"
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">close</mat-icon>
                </button>
              </div>
            </div>

            <!-- iOS Segmented Tab Bar (Matches Client Popup 3D Pill Bar) -->
            <div class="relative z-10 mt-4 inline-flex w-full sm:w-auto max-w-full items-center gap-1 rounded-2xl bg-slate-200/60 p-1 overflow-x-auto custom-scroll">
              <button
                type="button"
                (click)="selectFormat('a4')"
                class="rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                [class]="activeFormat() === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">description</mat-icon>
                <span>{{ isSingleRecord() ? 'Record Card' : 'A4 Statement' }}</span>
              </button>
              <button
                type="button"
                (click)="selectFormat('80mm')"
                class="rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                [class]="activeFormat() === '80mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">receipt</mat-icon>
                <span>80mm Rasheed</span>
              </button>
              <button
                type="button"
                (click)="selectFormat('58mm')"
                class="rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                [class]="activeFormat() === '58mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">receipt_long</mat-icon>
                <span>58mm</span>
              </button>
              <button
                type="button"
                (click)="selectFormat('card')"
                class="rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                [class]="activeFormat() === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">qr_code_2</mat-icon>
                <span>QR Card</span>
              </button>
              <button
                type="button"
                (click)="selectFormat('whatsapp')"
                class="rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                [class]="activeFormat() === 'whatsapp' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">chat</mat-icon>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          <!-- Multi-Record Search + Date Filter Bar (Hidden for Single Record Cards) -->
          @if (!isSingleDataset()) {
            <div class="shrink-0 border-b border-slate-200/80 bg-slate-50/70 px-5 py-3 sm:px-6 space-y-2.5">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                <div class="md:col-span-5">
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Search Record
                  </label>
                  <div class="relative flex items-center">
                    <mat-icon class="!text-[16px] !w-4 !h-4 text-slate-400 absolute left-3 pointer-events-none">search</mat-icon>
                    <input
                      type="text"
                      [value]="searchQuery()"
                      (input)="onSearchInput($event)"
                      placeholder="Type name, ref, category, or keyword..."
                      class="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-semibold text-slate-900 transition-all"
                    />
                    @if (searchQuery()) {
                      <button
                        type="button"
                        (click)="searchQuery.set('')"
                        class="absolute right-2 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                        aria-label="Clear search"
                      >
                        <mat-icon class="!text-[14px] !w-3.5 !h-3.5">close</mat-icon>
                      </button>
                    }
                  </div>
                </div>

                <div class="grid grid-cols-2 md:col-span-6 gap-2">
                  <div>
                    <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      [value]="fromDate()"
                      (change)="onFromDateChange($event)"
                      class="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-900 tabular-nums transition-all"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      [value]="toDate()"
                      (change)="onToDateChange($event)"
                      class="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-900 tabular-nums transition-all"
                    />
                  </div>
                </div>

                <div class="md:col-span-1 flex items-center">
                  <button
                    type="button"
                    (click)="resetFilters()"
                    class="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors inline-flex items-center justify-center gap-1"
                  >
                    <mat-icon class="!text-[14px] !w-3.5 !h-3.5">restart_alt</mat-icon>
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div class="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    (click)="applyDatePreset('all')"
                    class="px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors"
                    [class]="!fromDate() && !toDate() ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    (click)="applyDatePreset('today')"
                    class="px-2.5 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    (click)="applyDatePreset('7d')"
                    class="px-2.5 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    7D
                  </button>
                  <button
                    type="button"
                    (click)="applyDatePreset('month')"
                    class="px-2.5 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    (click)="applyDatePreset('30d')"
                    class="px-2.5 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    30D
                  </button>
                </div>

                @if (amountSummary().amountColumns.length > 0) {
                  <div class="flex flex-wrap items-center gap-1.5">
                    @for (col of amountSummary().amountColumns.slice(0, 3); track col.colIndex) {
                      <div
                        class="px-2.5 py-1 rounded-lg border text-[11px] font-bold tabular-nums"
                        [class]="col.kind === 'debit' ? 'bg-rose-50 border-rose-200 text-rose-800' : (col.kind === 'credit' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-800')"
                      >
                        {{ col.label }}: <strong>{{ amountSummary().currency }} {{ formatMoney(col.total) }}</strong>
                      </div>
                    }
                    @if (amountSummary().hasInflowOutflowSplit) {
                      <div class="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-black tabular-nums">
                        Net: {{ amountSummary().currency }} {{ formatMoney(amountSummary().netBalance) }}
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Inline Alert / Feedback Banner (Matches Client Popup) -->
          @if (actionFeedback(); as fb) {
            <div
              class="border-b px-5 py-2.5 text-xs font-bold shrink-0 transition-all"
              [class]="fb.tone === 'warn'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : (fb.tone === 'info' ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-emerald-50 border-emerald-200 text-emerald-700')"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <mat-icon class="!text-[16px] !w-4 !h-4 shrink-0">
                    {{ fb.tone === 'warn' ? 'warning' : (fb.tone === 'info' ? 'info' : 'check_circle') }}
                  </mat-icon>
                  <span class="truncate">{{ fb.message }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  @if (fb.offerHtmlDownload) {
                    <button
                      type="button"
                      (click)="downloadPrintableFallback()"
                      class="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <mat-icon class="!text-[13px] !w-3.5 !h-3.5">download</mat-icon>
                      <span>Save Print File</span>
                    </button>
                  }
                  <button
                    type="button"
                    (click)="clearActionFeedback()"
                    class="opacity-60 hover:opacity-100 shrink-0 cursor-pointer"
                    aria-label="Dismiss notice"
                  >
                    <mat-icon class="!text-[15px] !w-4 !h-4">close</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Scrollable Modal Body (Matches Client Overview HiOS/iOS 3D White Canvas) -->
          <main #previewViewport class="flex-1 min-h-0 overflow-y-auto bg-white p-4 sm:p-6 custom-scroll">
            @if ((activeFormat() === 'a4' || activeFormat() === 'card') && isSingleRecord()) {
              <!-- SUPERADMIN EYE-CLICK POPUP 2-PANEL DESIGN -->
              <section class="grid gap-5 lg:grid-cols-[1fr_290px]">
                <!-- Left Panel: Clean Record Identity & Particulars -->
                <div class="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70">
                  <div class="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        {{ activeFormat() === 'card' ? 'Digital Verification Pass' : 'Record Particulars' }}
                      </p>
                      <h3 class="text-base font-black text-slate-900 truncate">{{ effectiveTitle() }}</h3>
                    </div>
                    <span class="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200/70 shrink-0">
                      {{ primaryStatusValue() || 'Verified Record' }}
                    </span>
                  </div>

                  <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    @for (fld of singleRecordFields(); track $index) {
                      <div
                        class="rounded-xl bg-white border border-slate-200/80 p-3.5"
                        [class.sm:col-span-2]="isLongCardText(fld.value)"
                      >
                        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {{ fld.label }}
                        </p>
                        @if (fld.isStatus) {
                          <div class="mt-1.5">
                            <span [class]="getStatusPillClass(fld.value)">{{ fld.value }}</span>
                          </div>
                        } @else {
                          <p
                            class="mt-1 text-sm break-words leading-snug"
                            [class]="fld.isAmount ? 'font-mono font-black text-emerald-700' : 'font-bold text-slate-900'"
                          >
                            {{ fld.value }}
                          </p>
                        }
                      </div>
                    }
                  </div>

                  @if (amountSummary().amountColumns.length > 0) {
                    <div class="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white border border-emerald-200/70 p-3.5 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-wider text-emerald-700">Verified Total Amount</p>
                        <p class="text-xs font-semibold text-slate-500 mt-0.5">{{ issuedAtLabel() }}</p>
                      </div>
                      <span class="text-lg font-mono font-black text-emerald-700">
                        {{ amountSummary().currency }} {{ formatMoney(amountSummary().primaryTotal) }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Right Panel: Verification Code, Quick Actions & Export -->
                <div class="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between gap-4">
                  <div class="space-y-3.5">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Print &amp; Verification</p>
                      <h3 class="text-base font-black text-slate-900">Quick Actions</h3>
                    </div>

                    @if (branding().showQrVerification !== false || branding().showBarcodeVerification !== false) {
                      <div class="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 flex flex-col items-center gap-2 text-center">
                        @if (branding().showQrVerification !== false) {
                          <app-school-qr-code [value]="qrPayload()" [size]="84" />
                        }
                        @if (branding().showBarcodeVerification !== false) {
                          <app-school-barcode [value]="statementRef()" [height]="22" [barWidth]="0.95" />
                        }
                        <span class="font-mono text-[10px] font-bold text-slate-500">{{ statementRef() }}</span>
                      </div>
                    }

                    <div class="space-y-2">
                      <button
                        type="button"
                        (click)="printCurrentFormat()"
                        [disabled]="isPrinting()"
                        class="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <mat-icon class="!text-[16px] !w-4 !h-4">print</mat-icon>
                        <span>{{ isPrinting() ? 'Printing...' : (activeFormat() === 'card' ? 'Print QR Card' : 'Print Record Card') }}</span>
                      </button>

                      <button
                        type="button"
                        (click)="selectFormat('80mm')"
                        class="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <mat-icon class="!text-[16px] !w-4 !h-4">receipt</mat-icon>
                        <span>Open 80mm POS Slip</span>
                      </button>

                      <button
                        type="button"
                        (click)="downloadFilteredCardsPdf()"
                        class="w-full rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <mat-icon class="!text-[16px] !w-4 !h-4">picture_as_pdf</mat-icon>
                        <span>Download Record PDF</span>
                      </button>

                      <button
                        type="button"
                        (click)="sendWhatsApp()"
                        class="w-full rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <mat-icon class="!text-[16px] !w-4 !h-4">chat</mat-icon>
                        <span>Send WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <div class="pt-3 border-t border-slate-100 space-y-2">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Export Record</p>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        (click)="downloadFilteredCsv()"
                        class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <mat-icon class="!text-[15px] !w-[15px] !h-[15px] text-emerald-600">download</mat-icon>
                        <span>CSV</span>
                      </button>
                      <button
                        type="button"
                        (click)="copyRecordSummary()"
                        class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <mat-icon class="!text-[15px] !w-[15px] !h-[15px] text-slate-600">content_copy</mat-icon>
                        <span>Copy</span>
                      </button>
                    </div>
                    @if (branding().signatoryTitle) {
                      <p class="pt-1 text-center text-[10px] font-semibold text-slate-400 truncate">
                        {{ branding().signatoryTitle }}
                      </p>
                    }
                  </div>
                </div>
              </section>
            } @else if (activeFormat() === 'a4' || activeFormat() === 'card') {
              <!-- MULTI-ROW REGISTER STATEMENT IN SAME HiOS/iOS 3D CARD STYLE -->
              <section class="space-y-4">
                <div class="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 space-y-4">
                  <div class="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600">Campus Statement Register</p>
                      <h3 class="text-base font-black text-slate-900 truncate">{{ effectiveTitle() }}</h3>
                      <p class="text-xs font-semibold text-slate-500 mt-0.5">{{ criteriaSubtitle() }}</p>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        (click)="downloadFilteredTablePdf()"
                        class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">picture_as_pdf</mat-icon>
                        <span>Table PDF</span>
                      </button>
                      <button
                        type="button"
                        (click)="downloadFilteredCardsPdf()"
                        class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <mat-icon class="!text-[15px] !w-[15px] !h-[15px] text-emerald-600">view_agenda</mat-icon>
                        <span>Cards PDF</span>
                      </button>
                      <button
                        type="button"
                        (click)="downloadFilteredCsv()"
                        class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <mat-icon class="!text-[15px] !w-[15px] !h-[15px] text-slate-600">download</mat-icon>
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>

                  <div class="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                    <div class="overflow-x-auto">
                      <table class="w-full text-left border-collapse text-xs tabular-nums">
                        <thead class="bg-slate-50 text-slate-700 uppercase font-black text-[10px] border-b border-slate-200">
                          <tr>
                            <th class="px-3 py-2.5 border-r border-slate-200/80">#</th>
                            @for (hdr of data.headers; track $index) {
                              <th
                                class="px-3 py-2.5 border-r border-slate-200/80 last:border-r-0 whitespace-nowrap"
                                [class.text-right]="amountColIndexSet().has($index)"
                              >
                                {{ hdr }}
                              </th>
                            }
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                          @for (row of filteredRows(); track $index) {
                            <tr class="hover:bg-emerald-50/35 transition-colors" [class.bg-slate-50/40]="$odd">
                              <td class="px-3 py-2 font-mono text-slate-500 border-r border-slate-100">{{ $index + 1 }}</td>
                              @for (hdr of data.headers; track $index; let cIdx = $index) {
                                <td
                                  class="px-3 py-2 border-r border-slate-100 last:border-r-0 text-slate-800 font-medium"
                                  [class.text-right]="amountColIndexSet().has(cIdx)"
                                  [class.font-mono]="amountColIndexSet().has(cIdx)"
                                  [class.font-bold]="amountColIndexSet().has(cIdx)"
                                >
                                  {{ row[cIdx] || '—' }}
                                </td>
                              }
                            </tr>
                          } @empty {
                            <tr>
                              <td [attr.colspan]="data.headers.length + 1" class="px-4 py-8 text-center text-slate-500 font-bold">
                                No records match your current search or date range filter.
                              </td>
                            </tr>
                          }
                        </tbody>
                        @if (filteredRows().length > 0 && amountSummary().amountColumns.length > 0) {
                          <tfoot class="bg-slate-900 text-white font-black text-xs">
                            <tr>
                              <td class="px-3 py-2.5">TOTAL</td>
                              @for (hdr of data.headers; track $index; let cIdx = $index) {
                                @if (amountColumnByIndex().get(cIdx); as sumCol) {
                                  <td class="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                                    {{ amountSummary().currency }} {{ formatMoney(sumCol.total) }}
                                  </td>
                                } @else {
                                  <td class="px-3 py-2.5 opacity-80">
                                    {{ cIdx === 0 ? filteredRows().length + ' Rows' : '' }}
                                  </td>
                                }
                              }
                            </tr>
                          </tfoot>
                        }
                      </table>
                    </div>
                  </div>

                  @if (amountSummary().amountColumns.length > 0 || branding().showQrVerification !== false || branding().showBarcodeVerification !== false) {
                    <div class="pt-2 flex items-center justify-between gap-4 flex-wrap">
                      @if (amountSummary().amountColumns.length > 0) {
                        <div class="rounded-xl bg-emerald-50 border border-emerald-200/80 px-4 py-2.5 flex items-center gap-3">
                          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                            {{ amountSummary().hasInflowOutflowSplit ? 'Net Balance' : 'Statement Total' }}
                          </span>
                          <span class="text-base font-mono font-black text-emerald-800">
                            {{ amountSummary().currency }} {{ formatMoney(amountSummary().primaryTotal) }}
                          </span>
                        </div>
                      }
                      <div class="flex items-center gap-3 ml-auto">
                        @if (branding().showBarcodeVerification !== false) {
                          <app-school-barcode [value]="statementRef()" [height]="22" [barWidth]="0.95" />
                        }
                        @if (branding().showQrVerification !== false) {
                          <app-school-qr-code [value]="qrPayload()" [size]="46" />
                        }
                      </div>
                    </div>
                  }
                </div>
              </section>
            } @else if (activeFormat() === '80mm' || activeFormat() === '58mm') {
              <!-- 1:1 THERMAL POS SLIP IN OFFICIAL CHALLAN 3D CARD LAYOUT -->
              <section class="flex flex-col items-center gap-4">
                <div class="w-full rounded-2xl bg-slate-50/75 border border-slate-200/70 p-4 sm:p-6 flex flex-col items-center gap-3">
                  <div
                    class="p-4 sm:p-5 rounded-2xl bg-white flex flex-col justify-between text-slate-900 space-y-3.5 scs-tile-3d border border-slate-200/90 transition-all tabular-nums relative font-sans"
                    [class]="activeFormat() === '58mm' ? 'w-full max-w-[276px] text-[10px]' : 'w-full max-w-[356px] text-[11px]'"
                  >
                    @for (secKey of branding().sectionOrder; track secKey) {
                      @if (!hiddenSectionSet().has(secKey)) {
                        @switch (secKey) {
                          @case ('header') {
                            <div class="space-y-2.5">
                              @if (branding().thermalDualCopy) {
                                <div class="flex items-center justify-between gap-2">
                                  <span class="text-[9.5px] font-black uppercase px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 text-white tracking-wide shrink-0">
                                    STUDENT / GUARDIAN COPY
                                  </span>
                                  <span class="text-[9.5px] font-mono font-bold text-slate-500 uppercase tracking-tight">
                                    {{ activeFormat().toUpperCase() }} SLIP
                                  </span>
                                </div>
                              }

                              <!-- Top Corners Row: Logo in One Corner, QR Scanner in Opposite Top Corner -->
                              <div
                                class="flex items-start justify-between gap-2.5"
                                [class]="branding().logoPlacement === 'right' ? 'flex-row-reverse' : 'flex-row'"
                              >
                                @if (safeLogoUrl() && branding().showLogoCrest !== false) {
                                  <img
                                    [src]="safeLogoUrl()"
                                    alt="School logo"
                                    referrerpolicy="no-referrer"
                                    [style.width.px]="branding().logoSizePx || 44"
                                    [style.height.px]="branding().logoSizePx || 44"
                                    class="object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0 shadow-2xs"
                                  />
                                } @else if (branding().showLogoCrest !== false) {
                                  <div class="w-10 h-10 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 font-black text-[11px] flex items-center justify-center shrink-0 tracking-wider shadow-2xs">
                                    {{ monogramText() }}
                                  </div>
                                } @else {
                                  <span class="shrink-0"></span>
                                }

                                @if (branding().showQrVerification !== false) {
                                  <div class="shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                                    <app-school-qr-code
                                      [value]="qrPayload()"
                                      [size]="activeFormat() === '58mm' ? 42 : 48"
                                    />
                                  </div>
                                }
                              </div>

                              <!-- Centered Institution Header Below Corners -->
                              <div
                                class="space-y-0.5 pt-0.5"
                                [class]="branding().headerAlign === 'left'
                                  ? 'text-left'
                                  : (branding().headerAlign === 'right' ? 'text-right' : 'text-center')"
                              >
                                <div class="font-black text-[13px] uppercase tracking-tight leading-tight text-slate-950">
                                  {{ branding().schoolName }}
                                </div>
                                @if (branding().campusTagline) {
                                  <div class="text-[9px] uppercase font-bold tracking-wide text-slate-500 leading-tight">
                                    {{ branding().campusTagline }}
                                  </div>
                                }
                                @if (branding().registrationNo) {
                                  <div class="text-[9.5px] font-mono text-slate-500 pt-0.5">{{ branding().registrationNo }}</div>
                                }
                                @if (branding().address) {
                                  <div class="text-[10px] font-medium text-slate-600 leading-snug">{{ branding().address }}</div>
                                }
                                @if (branding().phone) {
                                  <div class="text-[10px] font-mono font-bold text-slate-800">Tel: {{ branding().phone }}</div>
                                }
                              </div>

                              <!-- Challan-Style Copy / Title + Status Badge Row -->
                              <div class="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                                <span class="text-[9.5px] font-black uppercase px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 text-white tracking-wide truncate">
                                  {{ effectiveTitle() }}
                                </span>
                                @if (branding().stampLabel !== 'NONE') {
                                  <span class="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0 uppercase">
                                    {{ branding().stampLabel }}
                                  </span>
                                }
                              </div>
                            </div>
                          }

                          @case ('meta') {
                            <div class="space-y-1.5 text-[11px]">
                              <div class="flex justify-between items-center gap-3">
                                <span class="text-slate-500 font-bold shrink-0">{{ isSingleRecord() ? 'Slip Ref:' : 'Statement Ref:' }}</span>
                                <span class="font-mono font-black text-slate-950 text-right">{{ statementRef() }}</span>
                              </div>
                              <div class="flex justify-between items-center gap-3">
                                <span class="text-slate-500 font-bold shrink-0">Date:</span>
                                <span class="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-right">{{ issuedAtLabel() }}</span>
                              </div>
                            </div>
                          }

                          @case ('person') {
                            <div class="border-t border-slate-100 pt-2.5 space-y-1.5">
                              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                {{ isSingleRecord() ? 'Record Particulars' : 'Itemized Entries' }}
                              </div>
                              @if (isSingleRecord()) {
                                @for (fld of singleRecordTextFields(); track $index) {
                                  @if (isLongThermalText(fld.value)) {
                                    <div class="rounded-xl bg-slate-50/85 border border-slate-200/70 p-2.5 space-y-1">
                                      <div class="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide inline-flex items-center gap-1">
                                        @if (effectiveTable().showFieldLogos) {
                                          <span class="w-1.5 h-1.5 bg-emerald-600 rounded-full inline-block"></span>
                                        }
                                        <span>{{ fld.label }}</span>
                                      </div>
                                      <div class="text-[11px] font-semibold text-slate-900 leading-relaxed break-words">{{ fld.value }}</div>
                                    </div>
                                  } @else {
                                    <div class="flex justify-between items-baseline gap-3 text-[11px]">
                                      <span class="text-slate-500 font-bold shrink-0 inline-flex items-center gap-1">
                                        @if (effectiveTable().showFieldLogos) {
                                          <span class="w-1.5 h-1.5 bg-emerald-600 rounded-full inline-block"></span>
                                        }
                                        <span>{{ fld.label }}:</span>
                                      </span>
                                      <span class="font-black text-slate-950 text-right break-words">{{ fld.value }}</span>
                                    </div>
                                  }
                                } @empty {
                                  <p class="text-center py-2 font-bold text-slate-500">See amount summary below.</p>
                                }
                              } @else {
                                @for (item of thermalPreviewRows(); track $index) {
                                  <div class="py-1.5 border-b border-slate-100 last:border-b-0">
                                    <div class="flex justify-between items-baseline gap-2 text-[11px]">
                                      <span class="font-black text-slate-950 truncate">{{ $index + 1 }}. {{ item.primary }}</span>
                                      @if (item.amount) {
                                        <span class="font-mono font-black text-indigo-700 shrink-0">{{ item.amount }}</span>
                                      }
                                    </div>
                                    @if (item.meta) {
                                      <div class="text-[10px] font-medium text-slate-500 leading-snug mt-0.5">{{ item.meta }}</div>
                                    }
                                  </div>
                                } @empty {
                                  <p class="text-center py-3 font-bold text-slate-500">No matching records found.</p>
                                }
                              }
                            </div>
                          }

                          @case ('amounts') {
                            @if (amountSummary().amountColumns.length > 0) {
                              <div class="border-t border-slate-100 pt-2.5 space-y-2.5">
                                <div class="space-y-1.5 text-[11px]">
                                  <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <span>Fee / Amount Description</span>
                                    <span>Amount ({{ amountSummary().currency }})</span>
                                  </div>
                                  @for (col of amountSummary().amountColumns; track col.colIndex) {
                                    <div class="flex justify-between items-center gap-3">
                                      <span class="text-slate-700 font-medium shrink-0">{{ col.label }}</span>
                                      <span class="font-mono font-black text-slate-950 text-right">{{ formatMoney(col.total) }}</span>
                                    </div>
                                  }
                                </div>
                                <div class="rounded-xl p-3 bg-gradient-to-r from-indigo-50 via-emerald-50/70 to-rose-50/60 border border-emerald-100/80 space-y-1">
                                  <div class="flex justify-between items-center gap-2">
                                    <span class="text-[11px] font-black text-slate-950">{{ isSingleRecord() ? 'Total Verified Amount:' : 'Statement Total:' }}</span>
                                    <span class="font-mono font-black text-sm text-indigo-950">{{ amountSummary().currency }} {{ formatMoney(amountSummary().primaryTotal) }}</span>
                                  </div>
                                </div>
                                @if (branding().thermalDualCopy) {
                                  <div class="text-center text-[9px] font-bold uppercase tracking-wider text-slate-500 border-t border-dashed border-slate-300 pt-1.5">
                                    ✂ Tear / Cut — Office Copy Printed Below
                                  </div>
                                }
                              </div>
                            }
                          }

                          @case ('verification') {
                            @if (branding().showBarcodeVerification !== false) {
                              <div class="border-t border-slate-100 pt-2.5 text-center space-y-1.5">
                                <div class="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                  Verification
                                </div>
                                <div class="flex justify-center">
                                  <app-school-barcode
                                    [value]="statementRef()"
                                    [label]="statementRef()"
                                    [height]="activeFormat() === '58mm' ? 28 : 34"
                                    [barWidth]="activeFormat() === '58mm' ? 1.05 : 1.25"
                                  />
                                </div>
                              </div>
                            }
                          }

                          @case ('footer') {
                            <div class="border-t border-slate-100 pt-2.5 space-y-1.5 text-center">
                              @if (branding().signatoryTitle) {
                                <div class="pt-2">
                                  <span class="inline-block min-w-[150px] border-t border-slate-300 pt-1 text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                                    {{ branding().signatoryTitle }}
                                  </span>
                                </div>
                              }
                              <p class="text-[9.5px] text-slate-500 font-medium leading-snug">
                                {{ branding().footerNote }}
                              </p>
                              <div class="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                                {{ branding().website ? branding().website + ' · ' : '' }}{{ activeFormat().toUpperCase() }} POS
                              </div>
                              @if (effectiveTable().showWatermark) {
                                <div class="text-[8px] font-black uppercase tracking-[0.18em] text-slate-300">
                                  *** {{ branding().schoolName }} ***
                                </div>
                              }
                            </div>
                          }
                        }
                      }
                    }
                  </div>
                  <span class="text-[10px] font-mono font-bold text-slate-500">
                    School POS Thermal Slip · {{ activeFormat().toUpperCase() }} Roll
                  </span>
                </div>

                <!-- Compact Quick Export Strip Below Receipt -->
                <div class="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    (click)="downloadFilteredCardsPdf()"
                    class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px] text-emerald-600">picture_as_pdf</mat-icon>
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    (click)="downloadFilteredCsv()"
                    class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px] text-slate-600">download</mat-icon>
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    (click)="copyRecordSummary()"
                    class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px] text-slate-600">content_copy</mat-icon>
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    (click)="sendWhatsApp()"
                    class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">chat</mat-icon>
                    <span>WhatsApp</span>
                  </button>
                </div>
              </section>
            } @else {
              <!-- WhatsApp Message Preview (Matches Client Overview Card) -->
              <section class="mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 space-y-4">
                <div class="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600">Direct Share</p>
                    <h3 class="text-base font-black text-slate-900">WhatsApp Dispatch</h3>
                    <p class="text-xs font-medium text-slate-500 mt-0.5">Copy or send formatted slip directly via WhatsApp.</p>
                  </div>
                  <button
                    type="button"
                    (click)="copyWhatsAppText()"
                    class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <mat-icon class="!text-[15px] !w-3.5 !h-3.5">{{ copiedWhatsApp() ? 'check' : 'content_copy' }}</mat-icon>
                    <span>{{ copiedWhatsApp() ? 'Copied!' : 'Copy' }}</span>
                  </button>
                </div>

                <label class="block">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Recipient Phone (Optional)
                  </span>
                  <input
                    type="tel"
                    [value]="whatsappPhone()"
                    (input)="onWhatsAppPhoneInput($event)"
                    placeholder="e.g. +92 300 1234567"
                    class="mt-1.5 w-full sm:w-72 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </label>

                <pre class="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs font-mono text-slate-900 whitespace-pre-wrap break-words max-h-[320px] overflow-y-auto leading-relaxed">{{ whatsappText() }}</pre>
              </section>
            }
          </main>

          <!-- Clean Minimal Footer (Matches SuperAdmin Client Overview Popup) -->
          <footer class="shrink-0 border-t border-slate-200/80 bg-white px-5 py-3.5 sm:px-6 flex items-center justify-between gap-3">
            @if (activeFormat() !== 'a4') {
              <button
                type="button"
                (click)="selectFormat('a4')"
                class="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-800 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">arrow_back</mat-icon>
                <span>{{ isSingleRecord() ? 'Back to Card' : 'Back to Statement' }}</span>
              </button>
            } @else {
              <button
                type="button"
                (click)="close()"
                class="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-800 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">close</mat-icon>
                <span>Close</span>
              </button>
            }

            <div class="flex items-center gap-2">
              @if (activeFormat() === 'whatsapp') {
                <button
                  type="button"
                  (click)="sendWhatsApp()"
                  class="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">chat</mat-icon>
                  <span>Send WhatsApp</span>
                </button>
              } @else {
                <button
                  type="button"
                  (click)="printCurrentFormat()"
                  [disabled]="isPrinting()"
                  class="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">print</mat-icon>
                  <span>{{ isPrinting() ? 'Printing...' : primaryPrintLabel() }}</span>
                </button>
              }
            </div>
          </footer>
        </div>
      </div>
    }
  `
})
export class SchoolTableStatementModalComponent {
  private readonly schemaService = inject(SchoolTableSchemaService);
  private readonly previewViewport = viewChild<ElementRef<HTMLElement>>('previewViewport');

  readonly modalState = this.schemaService.statementModalState;
  readonly rawBranding = this.schemaService.printBranding;
  readonly isOwner = this.schemaService.isOwner;

  readonly searchQuery = signal<string>('');
  readonly fromDate = signal<string>('');
  readonly toDate = signal<string>('');
  readonly activeFormat = signal<StatementFormatMode>('a4');
  readonly whatsappPhone = signal<string>('');
  readonly copiedWhatsApp = signal<boolean>(false);
  readonly isPrinting = signal<boolean>(false);
  readonly actionFeedback = signal<ActionFeedbackState | null>(null);

  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackResetTimer: ReturnType<typeof setTimeout> | null = null;
  private lastBuiltHtml = '';
  private lastBuiltFilename = 'school_statement.html';

  constructor() {
    effect(() => {
      const state = this.modalState();
      if (state.open) {
        this.searchQuery.set(state.presetSearch || '');
        this.fromDate.set(state.presetFromDate || '');
        this.toDate.set(state.presetToDate || '');
        this.activeFormat.set(state.initialFormat || 'a4');
        this.copiedWhatsApp.set(false);
        this.isPrinting.set(false);
        this.actionFeedback.set(null);
        this.prefillDetectedPhone();
        this.scrollPreviewToTop();
      }
    });
  }

  readonly dataset = computed(() => {
    const state = this.modalState();
    if (!state.open) return null;
    return this.schemaService.resolveStatementDataset(
      state.tableId,
      state.title,
      state.directDataset
    );
  });

  readonly canonicalTableId = computed(() => {
    const rawId = (this.dataset()?.tableId || this.modalState().tableId || '').replace(/_single_record$/, '');
    return rawId ? this.schemaService.resolveCanonicalTableId(rawId) : '';
  });

  readonly effectiveTable = computed(() => {
    const data = this.dataset();
    const rawId = (data?.tableId || this.modalState().tableId || '').replace(/_single_record$/, '');
    return resolveEffectiveTableBranding(this.rawBranding(), rawId, this.canonicalTableId());
  });

  readonly branding = computed(() => this.effectiveTable().branding);

  readonly effectiveTitle = computed(() => {
    const data = this.dataset();
    return this.effectiveTable().customHeading || data?.title || 'Statement';
  });

  readonly hiddenSectionSet = computed(() => new Set<PrintSectionKey>(this.branding().hiddenSections || []));

  readonly filteredRows = computed(() => {
    const data = this.dataset();
    if (!data) return [];
    return filterStatementRows(
      data.headers,
      data.rows,
      {
        searchQuery: this.searchQuery(),
        fromDate: this.fromDate(),
        toDate: this.toDate()
      },
      data.dateColHint
    ).filteredRows;
  });

  readonly amountSummary = computed(() => {
    const data = this.dataset();
    const b = this.branding();
    const cur = String(b.currencySymbol || 'PKR').toUpperCase();
    if (!data) {
      return computeStatementAmounts([], [], cur);
    }
    return computeStatementAmounts(data.headers, this.filteredRows(), cur);
  });

  readonly amountColIndexSet = computed(() => {
    return new Set(this.amountSummary().amountColumns.map((c) => c.colIndex));
  });

  readonly isSingleDataset = computed(() => (this.dataset()?.rows.length ?? 0) === 1);
  readonly isSingleRecord = computed(() => this.filteredRows().length === 1);

  readonly singleRecordFields = computed(() => {
    const data = this.dataset();
    const row = this.filteredRows()[0];
    if (!data || !row) return [];
    const amtSet = this.amountColIndexSet();
    return data.headers.map((hdr, idx) => {
      const label = hdr || `Field ${idx + 1}`;
      const value = String(row[idx] ?? '').trim() || '—';
      const isStatus = /\b(status|state|result|grade|attendance|verified)\b/i.test(label) && value !== '—';
      return {
        label,
        value,
        isAmount: amtSet.has(idx),
        isStatus
      };
    });
  });

  readonly primaryStatusValue = computed(() => {
    const hit = this.singleRecordFields().find((f) => f.isStatus && f.value !== '-' && f.value !== '—');
    return hit ? hit.value : '';
  });

  readonly singleRecordTextFields = computed(() => {
    return this.singleRecordFields().filter(
      (f) => !f.isAmount && f.value !== '—' && f.value !== '-'
    );
  });

  readonly amountColumnByIndex = computed(() => {
    const map = new Map<number, { colIndex: number; label: string; total: number }>();
    for (const c of this.amountSummary().amountColumns) {
      map.set(c.colIndex, c);
    }
    return map;
  });

  readonly safeLogoUrl = computed(() => sanitizeBrandingLogoUrl(this.branding().logoDataUrl));

  readonly monogramText = computed(() => {
    const mono = (this.branding().monogramInitials || 'SPA').trim();
    return mono.slice(0, 4) || 'SPA';
  });

  readonly accentColor = computed(() => {
    const c = this.branding().headerAccentColor || '';
    return /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#0f172a';
  });

  readonly stampBadgeText = computed(() => {
    const s = this.branding().stampLabel;
    return s && s !== 'NONE' ? s : 'VERIFIED';
  });

  readonly compactContactLine = computed(() => {
    const b = this.branding();
    return [b.address, b.phone ? `Tel: ${b.phone}` : ''].filter(Boolean).join(' · ');
  });

  readonly primaryPrintLabel = computed(() => {
    const mode = this.activeFormat();
    if (mode === '80mm') return 'Print 80mm Rasheed';
    if (mode === '58mm') return 'Print 58mm Rasheed';
    if (mode === 'card') return 'Print QR Card';
    return this.isSingleRecord() ? 'Print Record Card' : 'Print Statement';
  });

  isLongThermalText(value: string): boolean {
    return String(value || '').trim().length > 32;
  }

  isLongCardText(value: string): boolean {
    return String(value || '').trim().length > 42;
  }

  getStatusPillClass(value: string): string {
    const v = String(value || '').toLowerCase();
    if (/unpaid|overdue|pending|due|late|fail|absent|rejected|cancelled/.test(v)) {
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200';
    }
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200';
  }

  readonly statementRef = computed(() => {
    const data = this.dataset();
    const slug = (data?.tableId || 'STM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'STM';
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `STM-${slug}-${stamp}`;
  });

  readonly issuedAtLabel = computed(() => {
    return new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  readonly criteriaSubtitle = computed(() => {
    const data = this.dataset();
    return buildStatementCriteriaSubtitle(
      {
        searchQuery: this.searchQuery(),
        fromDate: this.fromDate(),
        toDate: this.toDate()
      },
      this.filteredRows().length,
      data?.rows.length || 0
    );
  });

  readonly qrPayload = computed(() => {
    const sum = this.amountSummary();
    return `STM:${this.statementRef()}|${this.effectiveTitle()}|ROWS:${this.filteredRows().length}|NET:${sum.currency} ${Math.round(sum.primaryTotal)}`;
  });

  readonly thermalPreviewRows = computed(() => {
    const data = this.dataset();
    if (!data) return [];
    const amtSet = this.amountColIndexSet();
    return this.filteredRows()
      .slice(0, 40)
      .map((row, idx) => {
        const textCols: string[] = [];
        const amtCols: string[] = [];
        for (let i = 0; i < data.headers.length; i++) {
          const val = String(row[i] ?? '').trim();
          if (!val || val === '-' || val === '—') continue;
          if (amtSet.has(i) || (parseAmountNumber(val) !== null && /pkr|rs|fee|amount|total|salary|paid|due|bakaya|expense|credit|debit/i.test(data.headers[i]))) {
            amtCols.push(`${data.headers[i]}: ${val}`);
          } else {
            textCols.push(val);
          }
        }
        const primary = textCols[0] || `Entry #${idx + 1}`;
        const meta = [...textCols.slice(1, 3), ...(amtCols.length > 1 ? amtCols.slice(0, -1) : [])].join(' · ');
        const lastAmt = amtCols.length > 0 ? amtCols[amtCols.length - 1].replace(/^[^:]+:\s*/, '') : '';
        return { primary, meta, amount: lastAmt };
      });
  });

  readonly whatsappText = computed(() => {
    const data = this.dataset();
    if (!data) return '';
    return buildSchoolStatementWhatsAppText({
      tableId: data.tableId,
      canonicalTableId: this.canonicalTableId(),
      title: this.effectiveTitle(),
      roleLabel: data.roleLabel,
      headers: data.headers,
      rows: this.filteredRows(),
      totalUnfilteredCount: data.rows.length,
      criteria: {
        searchQuery: this.searchQuery(),
        fromDate: this.fromDate(),
        toDate: this.toDate()
      },
      branding: this.branding(),
      statementRef: this.statementRef()
    });
  });

  readonly whatsappHref = computed(() => {
    const encoded = encodeURIComponent(this.whatsappText());
    let digits = this.whatsappPhone().replace(/\D/g, '');
    if (digits.startsWith('03') && digits.length === 11) {
      digits = '92' + digits.slice(1);
    } else if (digits.startsWith('0092')) {
      digits = digits.slice(2);
    }
    if (digits.length >= 10) {
      return `https://wa.me/${digits}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  });

  handleEscape(): void {
    if (this.modalState().open) {
      this.close();
    }
  }

  close(): void {
    this.schemaService.closeStatementModal();
  }

  selectFormat(format: StatementFormatMode): void {
    this.activeFormat.set(format);
    this.scrollPreviewToTop();
  }

  private scrollPreviewToTop(): void {
    setTimeout(() => {
      const el = this.previewViewport()?.nativeElement;
      if (el) {
        el.scrollTop = 0;
      }
    }, 0);
  }

  private prefillDetectedPhone(): void {
    const data = this.dataset();
    if (!data || data.rows.length !== 1) return;
    const row = data.rows[0] || [];
    for (let i = 0; i < data.headers.length; i++) {
      if (/phone|mobile|whatsapp|contact|tel|cell/i.test(data.headers[i] || '')) {
        const val = String(row[i] ?? '').trim();
        if (val && val.replace(/\D/g, '').length >= 9) {
          this.whatsappPhone.set(val);
          return;
        }
      }
    }
    this.whatsappPhone.set('');
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchQuery.set(target?.value ?? '');
  }

  onFromDateChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.fromDate.set(target?.value ?? '');
  }

  onToDateChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.toDate.set(target?.value ?? '');
  }

  onWhatsAppPhoneInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.whatsappPhone.set(target?.value ?? '');
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.fromDate.set('');
    this.toDate.set('');
  }

  applyDatePreset(preset: 'all' | 'today' | '7d' | 'month' | '30d'): void {
    if (preset === 'all') {
      this.fromDate.set('');
      this.toDate.set('');
      return;
    }
    const now = new Date();
    const toIso = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const endStr = toIso(now);
    if (preset === 'today') {
      this.fromDate.set(endStr);
      this.toDate.set(endStr);
    } else if (preset === '7d') {
      const start = new Date(now.getTime() - 6 * 86400000);
      this.fromDate.set(toIso(start));
      this.toDate.set(endStr);
    } else if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      this.fromDate.set(toIso(start));
      this.toDate.set(endStr);
    } else if (preset === '30d') {
      const start = new Date(now.getTime() - 29 * 86400000);
      this.fromDate.set(toIso(start));
      this.toDate.set(endStr);
    }
  }

  formatMoney(val: number): string {
    return formatStatementMoney(val, this.branding().currencySymbol || DEFAULT_SCHOOL_PRINT_BRANDING.currencySymbol);
  }

  openPrintStudioForTable(): void {
    const data = this.dataset();
    const tid = this.canonicalTableId() || data?.tableId || this.modalState().tableId;
    this.schemaService.requestOpenPrintStudio('table_statement', tid);
    this.close();
  }

  private buildPrintableHtmlForCurrentMode(): { html: string; label: string; filename: string } | null {
    const data = this.dataset();
    if (!data) return null;
    const rows = this.filteredRows();
    const criteria = {
      searchQuery: this.searchQuery(),
      fromDate: this.fromDate(),
      toDate: this.toDate()
    };
    const mode = this.activeFormat();
    const params = {
      tableId: data.tableId,
      canonicalTableId: this.canonicalTableId(),
      title: data.title,
      roleLabel: data.roleLabel,
      headers: data.headers,
      rows,
      totalUnfilteredCount: data.rows.length,
      criteria,
      branding: this.rawBranding(),
      statementRef: this.statementRef()
    };
    if (mode === '80mm' || mode === '58mm') {
      return {
        html: buildSchoolStatementThermalHtml(params, mode),
        label: `${mode} Rasheed`,
        filename: `${data.safeBaseName}_${mode}_rasheed.html`
      };
    }
    if (mode === 'card') {
      return {
        html: buildSchoolStatementCardHtml(params),
        label: 'QR Verification Card',
        filename: `${data.safeBaseName}_qr_card.html`
      };
    }
    return {
      html: buildSchoolStatementA4Html(params),
      label: this.isSingleRecord() ? 'Record Card' : 'Statement',
      filename: `${data.safeBaseName}_a4.html`
    };
  }

  async printCurrentFormat(): Promise<void> {
    if (this.isPrinting()) return;
    if (this.filteredRows().length === 0) {
      this.showFeedback('No records match your filter to print.', 'warn');
      return;
    }
    const built = this.buildPrintableHtmlForCurrentMode();
    if (!built) return;
    this.lastBuiltHtml = built.html;
    this.lastBuiltFilename = built.filename;
    this.isPrinting.set(true);
    try {
      const ok = await printHtmlInHiddenFrame(built.html);
      if (ok) {
        this.showFeedback(`Print dialog opened for ${built.label}.`, 'success', true);
      } else {
        this.showFeedback(`Browser print preview blocked — tap Save Print File or PDF.`, 'warn', true);
      }
    } finally {
      this.isPrinting.set(false);
    }
  }

  downloadPrintableFallback(): void {
    if (!this.lastBuiltHtml) {
      const built = this.buildPrintableHtmlForCurrentMode();
      if (!built) return;
      this.lastBuiltHtml = built.html;
      this.lastBuiltFilename = built.filename;
    }
    const ok = downloadPrintableHtmlFile(this.lastBuiltHtml, this.lastBuiltFilename);
    if (ok) {
      this.showFeedback(`Saved printable file (${this.lastBuiltFilename}).`, 'success');
    } else {
      this.showFeedback('Unable to save printable file. Please use PDF.', 'warn');
    }
  }

  downloadFilteredTablePdf(): void {
    const data = this.dataset();
    if (!data) return;
    const rows = this.filteredRows();
    if (rows.length === 0) {
      this.showFeedback('No records matched your filter for Table PDF.', 'warn');
      return;
    }
    try {
      const branding = this.schemaService.getPdfBranding(data.tableId);
      const subtitle = `${data.roleLabel} | ${this.criteriaSubtitle()}`;
      downloadStudentsTablePdf({
        title: `${this.effectiveTitle()} (Statement Register)`,
        subtitle,
        headers: data.headers,
        rows,
        filename: `${data.safeBaseName}_statement_table.pdf`,
        footerLabel: `${branding.schoolName || 'SoftCode School ERP'} | ${this.statementRef()} | Statement PDF`,
        emptyMessage: 'No records matched the selected search or date range filter.',
        branding
      });
      this.showFeedback(`Table PDF downloaded (${rows.length} record${rows.length === 1 ? '' : 's'}).`, 'success');
    } catch {
      this.showFeedback('Could not generate Table PDF. Please try again.', 'warn');
    }
  }

  downloadFilteredCardsPdf(): void {
    const data = this.dataset();
    if (!data) return;
    const rows = this.filteredRows();
    if (rows.length === 0) {
      this.showFeedback('No records matched your filter for PDF.', 'warn');
      return;
    }
    try {
      const branding = this.schemaService.getPdfBranding(data.tableId);
      const titleText = this.effectiveTitle();
      const cards: PdfGenericCardEntry[] = rows.map((row, idx) => {
        const fields = data.headers.map((h, hIdx) => ({
          label: h || `Field ${hIdx + 1}`,
          value: row[hIdx] || '-'
        }));
        const nonEmpty = row.filter((v) => v && v !== '-' && v !== '—');
        const statusField = fields.find((f) => /status|grade|result|fee|state/i.test(f.label));
        return {
          title: nonEmpty[0] || `Record #${idx + 1}`,
          subtitle: `${data.roleLabel} | ${titleText} | Entry #${idx + 1}`,
          badgeText: statusField?.value && statusField.value !== '-' ? statusField.value : `#${idx + 1}`,
          fields
        };
      });
      downloadTableCardsPdf({
        title: this.isSingleRecord() ? `${titleText} (Record Details)` : `${titleText} (Statement Cards)`,
        subtitle: `${data.roleLabel} | ${this.criteriaSubtitle()}`,
        cards,
        filename: this.isSingleRecord() ? `${data.safeBaseName}_card.pdf` : `${data.safeBaseName}_statement_cards.pdf`,
        footerLabel: `${branding.schoolName || 'SoftCode School ERP'} | ${this.statementRef()} | PDF`,
        emptyMessage: 'No records matched the selected search or date range filter.',
        branding
      });
      this.showFeedback(
        this.isSingleRecord()
          ? 'PDF downloaded.'
          : `Cards PDF downloaded (${cards.length} card${cards.length === 1 ? '' : 's'}).`,
        'success'
      );
    } catch {
      this.showFeedback('Could not generate PDF. Please try again.', 'warn');
    }
  }

  downloadFilteredCsv(): void {
    const data = this.dataset();
    if (!data || typeof document === 'undefined') return;
    const rows = this.filteredRows();
    if (rows.length === 0) {
      this.showFeedback('No records matched your filter for CSV export.', 'warn');
      return;
    }
    const csvLines: string[][] = [data.headers, ...rows];
    const csv = csvLines
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.safeBaseName}_statement.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {}
    }, 1000);
    this.showFeedback(`CSV exported (${rows.length} row${rows.length === 1 ? '' : 's'}).`, 'success');
  }

  sendWhatsApp(): void {
    this.copyWhatsAppText(true);
    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = this.whatsappHref();
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch {}
      }, 400);
    }
    this.showFeedback('Message copied & WhatsApp opened.', 'success');
  }

  copyRecordSummary(): void {
    const lines = [
      `${this.branding().schoolName} — ${this.effectiveTitle()} (${this.statementRef()})`,
      ...this.singleRecordFields().map((f) => `${f.label}: ${f.value}`)
    ];
    const txt = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(txt).then(() => {
        this.showFeedback('Record details copied to clipboard.', 'success');
      }).catch(() => {
        this.fallbackCopy(txt, true);
        this.showFeedback('Record details copied to clipboard.', 'success');
      });
      return;
    }
    this.fallbackCopy(txt, true);
    this.showFeedback('Record details copied to clipboard.', 'success');
  }

  copyWhatsAppText(silentFeedback = false): void {
    const txt = this.whatsappText();
    if (!txt) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(txt).then(() => {
        this.markCopied(silentFeedback);
      }).catch(() => {
        this.fallbackCopy(txt, silentFeedback);
      });
      return;
    }
    this.fallbackCopy(txt, silentFeedback);
  }

  clearActionFeedback(): void {
    this.actionFeedback.set(null);
    if (this.feedbackResetTimer !== null) {
      clearTimeout(this.feedbackResetTimer);
      this.feedbackResetTimer = null;
    }
  }

  private showFeedback(message: string, tone: 'success' | 'warn' | 'info', offerHtmlDownload = false): void {
    this.actionFeedback.set({ message, tone, offerHtmlDownload });
    if (this.feedbackResetTimer !== null) {
      clearTimeout(this.feedbackResetTimer);
    }
    this.feedbackResetTimer = setTimeout(() => {
      this.actionFeedback.set(null);
      this.feedbackResetTimer = null;
    }, offerHtmlDownload ? 9000 : 4500);
  }

  private fallbackCopy(text: string, silentFeedback = false): void {
    if (typeof document === 'undefined') return;
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.markCopied(silentFeedback);
    } catch {}
  }

  private markCopied(silentFeedback = false): void {
    this.copiedWhatsApp.set(true);
    if (!silentFeedback) {
      this.showFeedback('Copied to clipboard.', 'success');
    }
    if (this.copyResetTimer !== null) {
      clearTimeout(this.copyResetTimer);
    }
    this.copyResetTimer = setTimeout(() => {
      this.copiedWhatsApp.set(false);
      this.copyResetTimer = null;
    }, 2200);
  }
}
