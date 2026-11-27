import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
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
import { printHtmlInHiddenFrame } from '../../../../shared/hardware/thermal-print.util';
import { SchoolBarcodeComponent, SchoolQrCodeComponent } from '../school-barcode/school-barcode.component';

type StatementFormatMode = 'a4' | '80mm' | '58mm' | 'card' | 'whatsapp';

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
        class="fixed inset-0 z-[10060] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
        (click)="close()"
      >
        <div
          class="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="px-4 sm:px-6 py-3.5 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <mat-icon class="!text-[20px] !w-5 !h-5 text-emerald-300">receipt_long</mat-icon>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm sm:text-base font-black tracking-tight truncate">
                  {{ data.title }} — Statement &amp; Print Studio
                </h3>
                <p class="text-[11px] text-slate-300 truncate">
                  {{ branding().schoolName }} · {{ filteredRows().length }} of {{ data.rows.length }} record(s) matched · Ref: {{ statementRef() }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0 flex-wrap">
              <!-- Format Switcher Tabs -->
              <div class="inline-flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  (click)="activeFormat.set('a4')"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  [class]="activeFormat() === 'a4' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'"
                >
                  <mat-icon class="!text-[14px] !w-3.5 !h-3.5">description</mat-icon>
                  <span>A4 Statement</span>
                </button>
                <button
                  type="button"
                  (click)="activeFormat.set('80mm')"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  [class]="activeFormat() === '80mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'"
                >
                  <mat-icon class="!text-[14px] !w-3.5 !h-3.5">receipt</mat-icon>
                  <span>80mm Rasheed</span>
                </button>
                <button
                  type="button"
                  (click)="activeFormat.set('58mm')"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  [class]="activeFormat() === '58mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'"
                >
                  <mat-icon class="!text-[14px] !w-3.5 !h-3.5">receipt_long</mat-icon>
                  <span>58mm Rasheed</span>
                </button>
                <button
                  type="button"
                  (click)="activeFormat.set('card')"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  [class]="activeFormat() === 'card' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'"
                >
                  <mat-icon class="!text-[14px] !w-3.5 !h-3.5">qr_code_2</mat-icon>
                  <span>QR Card</span>
                </button>
                <button
                  type="button"
                  (click)="activeFormat.set('whatsapp')"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  [class]="activeFormat() === 'whatsapp' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'"
                >
                  <mat-icon class="!text-[14px] !w-3.5 !h-3.5">chat</mat-icon>
                  <span>WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                (click)="close()"
                class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close statement modal"
              >
                <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">close</mat-icon>
              </button>
            </div>
          </div>

          <!-- Search + Date Range Statement Builder Bar (or Single Record Banner) -->
          @if (isSingleDataset()) {
            <div class="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div class="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                <mat-icon class="!text-[16px] !w-4 !h-4 text-emerald-600">verified</mat-icon>
                <span>Individual Record Slip Preview — Print in A4, 80mm / 58mm Rasheed, PDF, or share on WhatsApp.</span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                @for (col of amountSummary().amountColumns.slice(0, 3); track col.colIndex) {
                  <div
                    class="px-2.5 py-1 rounded-lg border text-[11px] font-bold tabular-nums"
                    [class]="col.kind === 'debit' ? 'bg-rose-50 border-rose-200 text-rose-800' : (col.kind === 'credit' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-800')"
                  >
                    {{ col.label }}: <strong>{{ amountSummary().currency }} {{ formatMoney(col.total) }}</strong>
                  </div>
                }
              </div>
            </div>
          } @else {
          <div class="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
              <!-- Search Keyword -->
              <div class="md:col-span-5">
                <label class="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Search Record (Student / Name / Ref / Category / Amount)
                </label>
                <div class="relative flex items-center">
                  <mat-icon class="!text-[16px] !w-4 !h-4 text-slate-400 absolute left-3 pointer-events-none">search</mat-icon>
                  <input
                    type="text"
                    [value]="searchQuery()"
                    (input)="onSearchInput($event)"
                    placeholder="Type student, challan, voucher, category, or keyword..."
                    class="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-semibold text-slate-900"
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

              <!-- From Date -->
              <div class="md:col-span-3">
                <label class="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  [value]="fromDate()"
                  (change)="onFromDateChange($event)"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>

              <!-- To Date -->
              <div class="md:col-span-3">
                <label class="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  [value]="toDate()"
                  (change)="onToDateChange($event)"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>

              <!-- Reset Filters -->
              <div class="md:col-span-1 flex items-center">
                <button
                  type="button"
                  (click)="resetFilters()"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <!-- Quick Date Presets & Live Computed Summary -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1 inline-flex items-center gap-1">
                  <mat-icon class="!text-[14px] !w-3.5 !h-3.5">date_range</mat-icon>
                  Quick Period:
                </span>
                <button
                  type="button"
                  (click)="applyDatePreset('all')"
                  class="px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors"
                  [class]="!fromDate() && !toDate() ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
                >
                  All Dates
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
                  Last 7 Days
                </button>
                <button
                  type="button"
                  (click)="applyDatePreset('month')"
                  class="px-2.5 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  This Month
                </button>
                <button
                  type="button"
                  (click)="applyDatePreset('30d')"
                  class="px-2.5 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Last 30 Days
                </button>
              </div>

              <!-- Live Computed Totals Pill Strip -->
              <div class="flex flex-wrap items-center gap-2">
                <div class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 tabular-nums">
                  Matched: <strong class="text-slate-950">{{ filteredRows().length }}</strong> / {{ data.rows.length }}
                </div>
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
            </div>
          </div>
          }

          <!-- Preview Viewport -->
          <div class="flex-1 min-h-0 overflow-y-auto bg-slate-100/90 p-3 sm:p-5">
            @if (activeFormat() === 'a4') {
              <!-- A4 Branded Institutional Statement Preview -->
              <div class="mx-auto max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5 text-slate-900">
                <!-- Letterhead -->
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-slate-900">
                  <div class="flex items-start gap-3.5" [class.flex-row-reverse]="branding().logoPlacement === 'right'">
                    @if (branding().showLogoCrest !== false) {
                      @if (safeLogoUrl()) {
                        <div class="border border-slate-200 rounded-xl p-1.5 bg-white shrink-0">
                          <img
                            [src]="safeLogoUrl()"
                            alt="School Logo"
                            referrerpolicy="no-referrer"
                            class="object-contain block"
                            [style.width.px]="logoBoxSize()"
                            [style.height.px]="logoBoxSize()"
                          />
                        </div>
                      } @else {
                        <div class="px-3 py-2 rounded-xl border-2 border-slate-900 font-black text-sm tracking-widest uppercase bg-white shrink-0">
                          {{ monogramText() }}
                        </div>
                      }
                    }
                    <div>
                      <h4 class="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950 leading-tight">
                        {{ branding().schoolName }}
                      </h4>
                      @if (branding().campusTagline) {
                        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-0.5">
                          {{ branding().campusTagline }}
                        </p>
                      }
                      <p class="text-[11px] text-slate-500 mt-1">
                        {{ brandingContactLine() }}
                      </p>
                    </div>
                  </div>

                  <div class="text-left sm:text-right shrink-0">
                    <span
                      class="inline-block px-2.5 py-1 rounded-md text-white text-[10px] font-black uppercase tracking-wider"
                      [style.background-color]="branding().headerAccentColor || '#0f172a'"
                    >
                      {{ stampBadgeLabel() }} {{ isSingleRecord() ? 'RECORD SLIP' : 'STATEMENT' }}
                    </span>
                    <p class="text-[11px] font-mono font-bold text-slate-700 mt-1.5">Ref: {{ statementRef() }}</p>
                    <p class="text-[11px] text-slate-500">Issued: {{ issuedAtLabel() }}</p>
                  </div>
                </div>

                <!-- Statement Title Banner -->
                <div class="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 class="text-sm font-black text-slate-950">{{ data.title }}</h5>
                    <p class="text-[11px] text-slate-600">
                      {{ isSingleRecord() ? ('Official Individual Record Voucher · ' + data.roleLabel) : (criteriaSubtitle() + ' · ' + data.roleLabel) }}
                    </p>
                  </div>
                </div>

                <!-- Amount Summary Grid -->
                @if (amountSummary().amountColumns.length > 0) {
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    @for (col of amountSummary().amountColumns; track col.colIndex) {
                      <div class="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                        <span class="block text-[9px] font-black uppercase tracking-wider text-slate-500 truncate">{{ col.label }}</span>
                        <span
                          class="block text-sm font-black font-mono tabular-nums mt-0.5"
                          [class]="col.kind === 'debit' ? 'text-rose-700' : (col.kind === 'credit' ? 'text-emerald-700' : 'text-slate-950')"
                        >
                          {{ amountSummary().currency }} {{ formatMoney(col.total) }}
                        </span>
                      </div>
                    }
                    @if (amountSummary().hasInflowOutflowSplit) {
                      <div class="rounded-xl border border-slate-900 bg-slate-900 text-white px-3 py-2">
                        <span class="block text-[9px] font-black uppercase tracking-wider text-slate-300">Net Statement Balance</span>
                        <span class="block text-sm font-black font-mono tabular-nums mt-0.5">
                          {{ amountSummary().currency }} {{ formatMoney(amountSummary().netBalance) }}
                        </span>
                      </div>
                    }
                  </div>
                }

                @if (isSingleRecord()) {
                  <!-- Single-Record Voucher Field Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (fld of singleRecordFields(); track $index) {
                      <div
                        class="rounded-xl border px-3.5 py-2.5"
                        [class]="fld.isAmount ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'"
                      >
                        <span class="block text-[10px] font-black uppercase tracking-wider text-slate-500">{{ fld.label }}</span>
                        <span
                          class="block mt-0.5 break-words"
                          [class]="fld.isAmount ? 'font-mono font-black text-sm text-slate-950' : 'font-bold text-xs text-slate-900'"
                        >
                          {{ fld.value }}
                        </span>
                      </div>
                    }
                  </div>
                } @else {
                <!-- Ledger Table -->
                <div class="overflow-x-auto border border-slate-200 rounded-xl">
                  <table class="w-full text-left border-collapse text-xs tabular-nums">
                    <thead class="bg-slate-100 text-slate-700 uppercase font-black text-[10px] border-b border-slate-300">
                      <tr>
                        <th class="px-3 py-2.5 border-r border-slate-200">#</th>
                        @for (hdr of data.headers; track $index) {
                          <th
                            class="px-3 py-2.5 border-r border-slate-200 last:border-r-0 whitespace-nowrap"
                            [class.text-right]="amountColIndexSet().has($index)"
                          >
                            {{ hdr }}
                          </th>
                        }
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (row of filteredRows(); track $index) {
                        <tr class="hover:bg-slate-50/70" [class.bg-slate-50/40]="$odd">
                          <td class="px-3 py-2 font-mono text-slate-500 border-r border-slate-100">{{ $index + 1 }}</td>
                          @for (hdr of data.headers; track $index; let cIdx = $index) {
                            <td
                              class="px-3 py-2 border-r border-slate-100 last:border-r-0"
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
                              <td class="px-3 py-2.5 text-slate-300">
                                {{ cIdx === 0 ? filteredRows().length + ' Rows' : '' }}
                              </td>
                            }
                          }
                        </tr>
                      </tfoot>
                    }
                  </table>
                </div>
                }

                <!-- Verification & Signatory Footer -->
                <div class="pt-4 border-t border-dashed border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div class="flex items-center gap-3 flex-wrap">
                    @if (branding().showQrVerification !== false) {
                      <app-school-qr-code [value]="qrPayload()" [size]="56" />
                    }
                    <div>
                      @if (branding().showBarcodeVerification !== false) {
                        <app-school-barcode [value]="statementRef()" [height]="26" [barWidth]="1.15" />
                      }
                      <p class="text-[10px] text-slate-500 mt-1 max-w-md">{{ branding().footerNote }}</p>
                    </div>
                  </div>
                  <div class="text-left sm:text-right">
                    <div class="inline-block border-t border-slate-900 pt-1 min-w-[180px] text-[10px] font-black uppercase tracking-wider text-slate-900">
                      {{ branding().signatoryTitle || 'Principal & Accounts Directorate' }}
                    </div>
                  </div>
                </div>
              </div>
            } @else if (activeFormat() === '80mm' || activeFormat() === '58mm') {
              <!-- Thermal Rasheed Roll Preview (80mm or 58mm) -->
              <div
                class="mx-auto bg-white border border-slate-300 shadow-sm rounded-xl p-4 text-slate-950 font-sans tabular-nums"
                [class]="activeFormat() === '58mm' ? 'max-w-[265px] text-[10px]' : 'max-w-[355px] text-[11px]'"
              >
                <div class="flex flex-col items-center text-center gap-1 pb-2.5">
                  @if (branding().showLogoCrest !== false) {
                    @if (safeLogoUrl()) {
                      <div class="border border-slate-900 rounded-md p-1 bg-white">
                        <img
                          [src]="safeLogoUrl()"
                          alt="School Logo"
                          referrerpolicy="no-referrer"
                          class="w-10 h-10 object-contain block"
                        />
                      </div>
                    } @else {
                      <div class="px-2.5 py-1 border-2 border-slate-950 rounded-md text-xs font-black tracking-widest uppercase">
                        {{ monogramText() }}
                      </div>
                    }
                  }
                  <div class="text-xs font-black uppercase tracking-tight leading-tight">{{ branding().schoolName }}</div>
                  @if (branding().campusTagline) {
                    <div class="text-[8px] font-bold uppercase text-slate-600">{{ branding().campusTagline }}</div>
                  }
                  @if (branding().address) {
                    <div class="text-[9px] text-slate-600">{{ branding().address }}</div>
                  }
                  @if (branding().phone) {
                    <div class="text-[9px] text-slate-600">Tel: {{ branding().phone }}</div>
                  }
                </div>

                <div class="border-y-2 border-slate-950 py-1 flex items-center justify-between gap-2">
                  <span class="text-[9px] font-black uppercase tracking-wider truncate">{{ data.title }}</span>
                  <span class="px-1.5 py-0.5 bg-slate-950 text-white text-[8px] font-black uppercase rounded-xs shrink-0">
                    {{ stampBadgeLabel() }}
                  </span>
                </div>

                <div class="py-2 space-y-1 text-[10px] border-b border-dashed border-slate-400">
                  <div class="flex justify-between gap-2">
                    <span class="text-slate-600">{{ isSingleRecord() ? 'Slip Ref' : 'Statement Ref' }}</span>
                    <span class="font-bold font-mono">{{ statementRef() }}</span>
                  </div>
                  @if (!isSingleRecord()) {
                    <div class="flex justify-between gap-2">
                      <span class="text-slate-600">Date Range</span>
                      <span class="font-bold">{{ (fromDate() || 'Start') + ' → ' + (toDate() || 'Latest') }}</span>
                    </div>
                    @if (searchQuery().trim()) {
                      <div class="flex justify-between gap-2">
                        <span class="text-slate-600">Filter</span>
                        <span class="font-bold truncate max-w-[160px]">{{ searchQuery().trim() }}</span>
                      </div>
                    }
                    <div class="flex justify-between gap-2">
                      <span class="text-slate-600">Records</span>
                      <span class="font-bold">{{ filteredRows().length }} / {{ data.rows.length }}</span>
                    </div>
                  }
                  <div class="flex justify-between gap-2">
                    <span class="text-slate-600">Printed At</span>
                    <span class="font-bold">{{ issuedAtLabel() }}</span>
                  </div>
                </div>

                <!-- Itemized Thermal Entries (or Full Single-Record Particulars) -->
                <div class="py-2 border-b border-dashed border-slate-400 space-y-1.5">
                  <div class="text-[8px] font-black uppercase tracking-wider text-slate-700">
                    {{ isSingleRecord() ? 'RECORD PARTICULARS' : 'ITEMIZED ENTRIES' }}
                  </div>
                  @if (isSingleRecord()) {
                    @for (fld of singleRecordTextFields(); track $index) {
                      <div class="flex justify-between items-baseline gap-2 py-0.5 border-b border-dotted border-slate-200 last:border-b-0 text-[10px]">
                        <span class="text-slate-600 shrink-0">{{ fld.label }}</span>
                        <span class="font-bold text-slate-950 text-right break-words">{{ fld.value }}</span>
                      </div>
                    } @empty {
                      <p class="text-center py-2 font-bold text-slate-500">See amount summary below.</p>
                    }
                  } @else {
                    @for (item of thermalPreviewRows(); track $index) {
                      <div class="py-1 border-b border-dotted border-slate-300 last:border-b-0">
                        <div class="flex justify-between items-baseline gap-2">
                          <span class="font-extrabold text-slate-950 truncate">{{ $index + 1 }}. {{ item.primary }}</span>
                          @if (item.amount) {
                            <span class="font-mono font-black shrink-0">{{ item.amount }}</span>
                          }
                        </div>
                        @if (item.meta) {
                          <div class="text-[9px] text-slate-600 leading-snug">{{ item.meta }}</div>
                        }
                      </div>
                    } @empty {
                      <p class="text-center py-3 font-bold text-slate-500">No matching records found.</p>
                    }
                    @if (filteredRows().length > 40) {
                      <p class="text-[9px] text-center text-slate-500 font-semibold pt-1">
                        + {{ filteredRows().length - 40 }} more row(s) included on print (up to 120 rows)
                      </p>
                    }
                  }
                </div>

                <!-- Thermal Totals Block -->
                @if (amountSummary().amountColumns.length > 0) {
                  <div class="py-2 space-y-1">
                    <div class="text-[8px] font-black uppercase tracking-wider text-slate-700">AMOUNT SUMMARY</div>
                    @for (col of amountSummary().amountColumns; track col.colIndex) {
                      <div class="flex justify-between gap-2 text-[10px]">
                        <span class="text-slate-700 font-semibold">{{ col.label }}</span>
                        <span class="font-mono font-bold">{{ amountSummary().currency }} {{ formatMoney(col.total) }}</span>
                      </div>
                    }
                    <div class="mt-2 bg-slate-950 text-white px-2.5 py-1.5 flex items-center justify-between font-black text-xs">
                      <span>{{ isSingleRecord() ? 'TOTAL AMOUNT' : (amountSummary().hasInflowOutflowSplit ? 'NET BALANCE' : 'STATEMENT TOTAL') }}</span>
                      <span class="font-mono">{{ amountSummary().currency }} {{ formatMoney(amountSummary().primaryTotal) }}</span>
                    </div>
                  </div>
                }

                <!-- Barcode + QR Verification -->
                @if (branding().showBarcodeVerification !== false || branding().showQrVerification !== false) {
                  <div class="pt-2.5 mt-1 border-t border-dashed border-slate-400 flex flex-col items-center gap-2 text-center">
                    <span class="text-[8px] font-black uppercase tracking-widest text-slate-700">VERIFICATION</span>
                    @if (branding().showBarcodeVerification !== false) {
                      <app-school-barcode [value]="statementRef()" [height]="24" [barWidth]="1.05" />
                    }
                    @if (branding().showQrVerification !== false) {
                      <app-school-qr-code [value]="qrPayload()" [size]="56" />
                    }
                  </div>
                }

                <div class="mt-3 pt-1.5 border-t border-slate-900 text-center text-[8px] font-black uppercase tracking-wider">
                  {{ branding().signatoryTitle || 'Accounts Officer' }}
                </div>
                <div class="text-center text-[8px] text-slate-500 mt-1">
                  {{ branding().footerNote }} ({{ activeFormat().toUpperCase() }})
                </div>
              </div>
            } @else if (activeFormat() === 'card') {
              <!-- Digital QR & Verification Record Card Preview -->
              <div class="mx-auto max-w-2xl bg-white rounded-2xl border-2 border-slate-900 shadow-sm overflow-hidden text-slate-900">
                <div
                  class="px-5 py-4 text-white flex items-center justify-between gap-3"
                  [style.background-color]="branding().headerAccentColor || '#0f172a'"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    @if (branding().showLogoCrest !== false) {
                      @if (safeLogoUrl()) {
                        <div class="bg-white rounded-lg p-1 shrink-0">
                          <img
                            [src]="safeLogoUrl()"
                            alt="School Logo"
                            referrerpolicy="no-referrer"
                            class="w-10 h-10 object-contain block"
                          />
                        </div>
                      } @else {
                        <div class="px-2.5 py-1.5 rounded-lg bg-white/15 border border-white/40 font-black text-xs tracking-widest uppercase shrink-0">
                          {{ monogramText() }}
                        </div>
                      }
                    }
                    <div class="min-w-0">
                      <h4 class="text-sm sm:text-base font-black uppercase tracking-tight truncate">{{ branding().schoolName }}</h4>
                      @if (branding().campusTagline) {
                        <p class="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">{{ branding().campusTagline }}</p>
                      }
                    </div>
                  </div>
                  <span class="px-2.5 py-1 rounded-md bg-white/15 border border-white/40 text-[10px] font-black uppercase tracking-wider shrink-0">
                    {{ stampBadgeLabel() }} PASS
                  </span>
                </div>

                <div class="p-5 space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dashed border-slate-300">
                    <div class="space-y-1 min-w-0">
                      <h5 class="text-sm sm:text-base font-black text-slate-950">{{ data.title }}</h5>
                      <p class="text-xs font-mono font-bold text-slate-600">Ref: {{ statementRef() }}</p>
                      <p class="text-[11px] text-slate-500">Issued: {{ issuedAtLabel() }} · {{ data.roleLabel }}</p>
                    </div>
                    @if (branding().showQrVerification !== false) {
                      <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center shrink-0 self-start sm:self-center">
                        <app-school-qr-code [value]="qrPayload()" [size]="84" />
                        <span class="block text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">SCAN TO VERIFY</span>
                      </div>
                    }
                  </div>

                  @if (singleRecordFields().length > 0) {
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      @for (fld of singleRecordFields(); track $index) {
                        <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span class="block text-[9px] font-black uppercase tracking-wider text-slate-500">{{ fld.label }}</span>
                          <span
                            class="block mt-0.5 break-words"
                            [class]="fld.isAmount ? 'font-mono font-black text-xs text-slate-950' : 'font-bold text-xs text-slate-900'"
                          >
                            {{ fld.value }}
                          </span>
                        </div>
                      }
                    </div>
                  } @else if (amountSummary().amountColumns.length > 0) {
                    <div class="grid grid-cols-2 gap-2.5">
                      @for (col of amountSummary().amountColumns; track col.colIndex) {
                        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span class="block text-[9px] font-black uppercase tracking-wider text-slate-500">{{ col.label }}</span>
                          <span class="block font-mono font-black text-sm text-slate-950 mt-0.5">{{ amountSummary().currency }} {{ formatMoney(col.total) }}</span>
                        </div>
                      }
                    </div>
                  }

                  <div class="pt-3 border-t border-dashed border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                      @if (branding().showBarcodeVerification !== false) {
                        <app-school-barcode [value]="statementRef()" [height]="26" [barWidth]="1.15" />
                      }
                      <p class="text-[10px] text-slate-500 mt-1">{{ branding().footerNote }}</p>
                    </div>
                    <div class="border-t border-slate-900 pt-1 min-w-[170px] text-left sm:text-right text-[10px] font-black uppercase tracking-wider text-slate-900">
                      {{ branding().signatoryTitle || 'Principal & Accounts Directorate' }}
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <!-- WhatsApp Formatted Slip Preview & Direct Dispatch -->
              <div class="mx-auto max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h4 class="text-sm font-black text-slate-950">WhatsApp Statement &amp; Rasheed Message</h4>
                    <p class="text-xs text-slate-500">
                      Formatted with school branding, filtered dates, and computed amount totals — ready to copy or open in WhatsApp.
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="copyWhatsAppText()"
                    class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                  >
                    <mat-icon class="!text-[15px] !w-3.5 !h-3.5">{{ copiedWhatsApp() ? 'check' : 'content_copy' }}</mat-icon>
                    <span>{{ copiedWhatsApp() ? 'Copied!' : 'Copy Message' }}</span>
                  </button>
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Recipient WhatsApp Number (Optional — leave blank to pick contact in WhatsApp)
                  </label>
                  <input
                    type="tel"
                    [value]="whatsappPhone()"
                    (input)="onWhatsAppPhoneInput($event)"
                    placeholder="e.g. +92 300 1234567"
                    class="w-full sm:w-72 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-emerald-500 outline-none text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <pre class="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs font-mono text-slate-900 whitespace-pre-wrap break-words max-h-[380px] overflow-y-auto leading-relaxed">{{ whatsappText() }}</pre>

                <p class="text-[11px] text-slate-500">
                  Tip: You can also download <strong>Table PDF</strong> or <strong>Cards PDF</strong> below to attach alongside this WhatsApp summary.
                </p>
              </div>
            }
          </div>

          <!-- Modal Action Footer -->
          <div class="px-4 sm:px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div class="text-[11px] text-slate-500 font-medium">
              Exports &amp; prints automatically reflect your active search &amp; date range filter.
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                (click)="printCurrentFormat()"
                class="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <mat-icon class="!text-[16px] !w-4 !h-4 text-emerald-300">print</mat-icon>
                <span>
                  {{ activeFormat() === '80mm' ? 'Print 80mm Rasheed' : (activeFormat() === '58mm' ? 'Print 58mm Rasheed' : (activeFormat() === 'card' ? 'Print QR Card' : (isSingleRecord() ? 'Print A4 Slip' : 'Print A4 Statement'))) }}
                </span>
              </button>

              <button
                type="button"
                (click)="downloadFilteredTablePdf()"
                class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                <mat-icon class="!text-[15px] !w-3.5 !h-3.5">picture_as_pdf</mat-icon>
                <span>Table PDF</span>
              </button>

              <button
                type="button"
                (click)="downloadFilteredCardsPdf()"
                class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                <mat-icon class="!text-[15px] !w-3.5 !h-3.5">view_agenda</mat-icon>
                <span>Cards PDF</span>
              </button>

              <button
                type="button"
                (click)="downloadFilteredCsv()"
                class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all active:scale-95"
              >
                <mat-icon class="!text-[15px] !w-3.5 !h-3.5">download</mat-icon>
                <span>CSV</span>
              </button>

              <button
                type="button"
                (click)="copyWhatsAppText()"
                class="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all active:scale-95"
              >
                <mat-icon class="!text-[15px] !w-3.5 !h-3.5">{{ copiedWhatsApp() ? 'check' : 'content_copy' }}</mat-icon>
                <span>{{ copiedWhatsApp() ? 'Copied' : 'Copy Slip' }}</span>
              </button>

              <a
                [href]="whatsappHref()"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95 no-underline"
              >
                <mat-icon class="!text-[16px] !w-4 !h-4">chat</mat-icon>
                <span>Send WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class SchoolTableStatementModalComponent {
  private readonly schemaService = inject(SchoolTableSchemaService);

  readonly modalState = this.schemaService.statementModalState;
  readonly branding = this.schemaService.printBranding;

  readonly searchQuery = signal<string>('');
  readonly fromDate = signal<string>('');
  readonly toDate = signal<string>('');
  readonly activeFormat = signal<StatementFormatMode>('a4');
  readonly whatsappPhone = signal<string>('');
  readonly copiedWhatsApp = signal<boolean>(false);

  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const state = this.modalState();
      if (state.open) {
        this.searchQuery.set(state.presetSearch || '');
        this.fromDate.set(state.presetFromDate || '');
        this.toDate.set(state.presetToDate || '');
        this.activeFormat.set(state.initialFormat || 'a4');
        this.copiedWhatsApp.set(false);
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
    return data.headers.map((hdr, idx) => ({
      label: hdr || `Field ${idx + 1}`,
      value: String(row[idx] ?? '').trim() || '—',
      isAmount: amtSet.has(idx)
    }));
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

  readonly logoBoxSize = computed(() => Math.min(72, Math.max(32, Number(this.branding().logoSizePx || 44))));

  readonly stampBadgeLabel = computed(() => {
    const lbl = this.branding().stampLabel;
    return lbl && lbl !== 'NONE' ? lbl : 'VERIFIED';
  });

  readonly brandingContactLine = computed(() => {
    const b = this.branding();
    return [b.registrationNo, b.address, b.phone ? `Tel: ${b.phone}` : ''].filter(Boolean).join(' · ');
  });

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
    const data = this.dataset();
    const sum = this.amountSummary();
    return `STM:${this.statementRef()}|${data?.title || 'Statement'}|ROWS:${this.filteredRows().length}|NET:${sum.currency} ${Math.round(sum.primaryTotal)}`;
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
          if (amtSet.has(i) || parseAmountNumber(val) !== null && /pkr|rs|fee|amount|total|salary|paid|due|bakaya|expense|credit|debit/i.test(data.headers[i])) {
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
      title: data.title,
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

  printCurrentFormat(): void {
    const data = this.dataset();
    if (!data) return;
    const rows = this.filteredRows();
    const criteria = {
      searchQuery: this.searchQuery(),
      fromDate: this.fromDate(),
      toDate: this.toDate()
    };
    const mode = this.activeFormat();
    const params = {
      title: data.title,
      roleLabel: data.roleLabel,
      headers: data.headers,
      rows,
      totalUnfilteredCount: data.rows.length,
      criteria,
      branding: this.branding(),
      statementRef: this.statementRef()
    };
    if (mode === '80mm' || mode === '58mm') {
      const html = buildSchoolStatementThermalHtml(params, mode);
      printHtmlInHiddenFrame(html);
      return;
    }
    if (mode === 'card') {
      const html = buildSchoolStatementCardHtml(params);
      printHtmlInHiddenFrame(html);
      return;
    }
    const html = buildSchoolStatementA4Html(params);
    printHtmlInHiddenFrame(html);
  }

  downloadFilteredTablePdf(): void {
    const data = this.dataset();
    if (!data) return;
    const rows = this.filteredRows();
    const branding = this.schemaService.getPdfBranding();
    const subtitle = `${data.roleLabel} | ${this.criteriaSubtitle()}`;
    downloadStudentsTablePdf({
      title: `${data.title} (Statement Register)`,
      subtitle,
      headers: data.headers,
      rows,
      filename: `${data.safeBaseName}_statement_table.pdf`,
      footerLabel: `${branding.schoolName || 'SoftCode School ERP'} | ${this.statementRef()} | Statement PDF`,
      emptyMessage: 'No records matched the selected search or date range filter.',
      branding
    });
  }

  downloadFilteredCardsPdf(): void {
    const data = this.dataset();
    if (!data) return;
    const rows = this.filteredRows();
    const branding = this.schemaService.getPdfBranding();
    const cards: PdfGenericCardEntry[] = rows.map((row, idx) => {
      const fields = data.headers.map((h, hIdx) => ({
        label: h || `Field ${hIdx + 1}`,
        value: row[hIdx] || '-'
      }));
      const nonEmpty = row.filter((v) => v && v !== '-' && v !== '—');
      const statusField = fields.find((f) => /status|grade|result|fee|state/i.test(f.label));
      return {
        title: nonEmpty[0] || `Record #${idx + 1}`,
        subtitle: `${data.roleLabel} | ${data.title} | Entry #${idx + 1}`,
        badgeText: statusField?.value && statusField.value !== '-' ? statusField.value : `#${idx + 1}`,
        fields
      };
    });
    downloadTableCardsPdf({
      title: `${data.title} (Statement Cards)`,
      subtitle: `${data.roleLabel} | ${this.criteriaSubtitle()}`,
      cards,
      filename: `${data.safeBaseName}_statement_cards.pdf`,
      footerLabel: `${branding.schoolName || 'SoftCode School ERP'} | ${this.statementRef()} | Cards PDF`,
      emptyMessage: 'No records matched the selected search or date range filter.',
      branding
    });
  }

  downloadFilteredCsv(): void {
    const data = this.dataset();
    if (!data || typeof document === 'undefined') return;
    const rows = this.filteredRows();
    const csvLines: string[][] = [data.headers, ...rows];
    const csv = csvLines
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.safeBaseName}_statement.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  copyWhatsAppText(): void {
    const txt = this.whatsappText();
    if (!txt) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(txt).then(() => {
        this.markCopied();
      }).catch(() => {
        this.fallbackCopy(txt);
      });
      return;
    }
    this.fallbackCopy(txt);
  }

  private fallbackCopy(text: string): void {
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
      this.markCopied();
    } catch {}
  }

  private markCopied(): void {
    this.copiedWhatsApp.set(true);
    if (this.copyResetTimer !== null) {
      clearTimeout(this.copyResetTimer);
    }
    this.copyResetTimer = setTimeout(() => {
      this.copiedWhatsApp.set(false);
      this.copyResetTimer = null;
    }, 2200);
  }
}
