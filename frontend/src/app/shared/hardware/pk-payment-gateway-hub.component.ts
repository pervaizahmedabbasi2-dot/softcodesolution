import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BackendService } from '../../services/backend.service';
import { HardwareDeviceService } from './hardware-device.service';
import { SharedBarcodeComponent, SharedQrCodeComponent } from './barcode.component';

export interface PkGatewayRecord {
  id: string;
  providerKey: string;
  displayName: string;
  category: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  raastId: string;
  bankName: string;
  branchCode: string;
  tillId: string;
  billerCode: string;
  merchantId: string;
  hasMerchantSecret?: boolean;
  hasIntegritySalt?: boolean;
  feeType: string;
  feeValue: number;
  verificationMode: string;
  instructions: string;
  isEnabled: boolean;
  isDefault: boolean;
}

export interface PkTransactionRecord {
  id: string;
  txnRef: string;
  invoiceNo: string;
  gatewayId: string;
  gatewayName: string;
  providerKey: string;
  payerName: string;
  payerPhone: string;
  baseAmount: number;
  gatewayFee: number;
  totalAmount: number;
  currency: string;
  status: string;
  proofReference: string;
  proofNotes: string;
  proofScreenshot: string;
  hasProofScreenshot: boolean;
  verifiedBy: string;
  createdAt: string;
}

@Component({
  selector: 'app-pk-payment-gateway-hub',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, SharedBarcodeComponent, SharedQrCodeComponent],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <!-- Top Bar -->
      <div class="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50/70">
        <div>
          <div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            <mat-icon class="!text-[16px] !w-4 !h-4">account_balance</mat-icon>
            <span>Pakistan Digital Banking &amp; Wallet Gateways</span>
          </div>
          <h3 class="text-base font-extrabold text-slate-900 mt-0.5">{{ businessLabel() }} — Payment Gateways &amp; Slip Ledger</h3>
          <p class="text-xs text-slate-500">Raast IBFT, JazzCash, Easypaisa, 1Bill Voucher, Meezan Bank &amp; HBL Konnect with deposit slip proof &amp; 80mm thermal receipts.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" (click)="openCollectModal()"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer">
            <mat-icon class="!text-[16px] !w-4 !h-4">qr_code_scanner</mat-icon>
            <span>Collect / Submit Slip</span>
          </button>

          <button type="button" (click)="activeSubTab.set(activeSubTab() === 'settings' ? 'ledger' : 'settings')"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer">
            <mat-icon class="!text-[16px] !w-4 !h-4">tune</mat-icon>
            <span>{{ activeSubTab() === 'settings' ? 'Back to Ledger' : 'Gateway Setting (' + enabledCount() + ')' }}</span>
          </button>

          <button type="button" (click)="kickDrawer()"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer">
            <mat-icon class="!text-[16px] !w-4 !h-4">point_of_sale</mat-icon>
            <span>Open Drawer</span>
          </button>
        </div>
      </div>

      @if (feedbackMessage()) {
        <div class="mx-5 mt-4 p-3 rounded-xl text-xs font-bold flex items-center justify-between"
          [class.bg-emerald-50]="!feedbackIsError()" [class.text-emerald-800]="!feedbackIsError()" [class.border-emerald-200]="!feedbackIsError()"
          [class.bg-rose-50]="feedbackIsError()" [class.text-rose-800]="feedbackIsError()" [class.border-rose-200]="feedbackIsError()"
          class="border">
          <span>{{ feedbackMessage() }}</span>
          <button type="button" (click)="feedbackMessage.set('')" class="underline text-[11px] ml-3">Dismiss</button>
        </div>
      }

      <!-- LEDGER TAB -->
      @if (activeSubTab() === 'ledger') {
        <div class="p-5 space-y-5">
          <!-- Enabled Channels Quick Strip -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (gw of enabledGateways(); track gw.id) {
              <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-extrabold text-slate-900">{{ gw.displayName }}</span>
                      @if (gw.isDefault) {
                        <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">Default</span>
                      }
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">{{ gw.bankName || gw.category }}</p>
                  </div>
                  <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {{ gw.feeType === 'none' ? '0 Fee' : (gw.feeType === 'percent' ? gw.feeValue + '%' : 'PKR ' + gw.feeValue) }}
                  </span>
                </div>
                <div class="text-[11px] font-mono text-slate-700 bg-white rounded-lg p-2 border border-slate-200/80 space-y-0.5">
                  @if (gw.raastId) { <div>Raast: <strong>{{ gw.raastId }}</strong></div> }
                  @if (gw.iban) { <div class="truncate">IBAN: <strong>{{ gw.iban }}</strong></div> }
                  @if (gw.accountNumber) { <div>A/C: <strong>{{ gw.accountNumber }}</strong></div> }
                  @if (gw.tillId) { <div>Till ID: <strong>{{ gw.tillId }}</strong></div> }
                  @if (gw.billerCode) { <div>1Bill Biller: <strong>{{ gw.billerCode }}</strong></div> }
                </div>
                <button type="button" (click)="openCollectModal(gw)"
                  class="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors cursor-pointer">
                  Receive / Submit Proof via {{ gw.providerKey | uppercase }}
                </button>
              </div>
            }
          </div>

          <!-- Transactions Table -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span class="font-extrabold text-slate-800">Deposit Slip &amp; Digital Collection Ledger ({{ transactions().length }})</span>
              <button type="button" (click)="loadAll()" class="text-indigo-600 font-bold hover:underline cursor-pointer">Refresh</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-white border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th class="py-2.5 px-4">TXN Ref</th>
                    <th class="py-2.5 px-4">Invoice #</th>
                    <th class="py-2.5 px-4">{{ defaultEntityLabel() }}</th>
                    <th class="py-2.5 px-4">Channel</th>
                    <th class="py-2.5 px-4">TID / Ref</th>
                    <th class="py-2.5 px-4 text-right">Total</th>
                    <th class="py-2.5 px-4">Status</th>
                    <th class="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (tx of transactions(); track tx.id) {
                    <tr class="hover:bg-slate-50/70">
                      <td class="py-2.5 px-4 font-mono font-bold text-indigo-700">{{ tx.txnRef }}</td>
                      <td class="py-2.5 px-4 font-mono text-slate-700">{{ tx.invoiceNo }}</td>
                      <td class="py-2.5 px-4 font-bold text-slate-900">{{ tx.payerName }}</td>
                      <td class="py-2.5 px-4 text-slate-700">{{ tx.gatewayName }}</td>
                      <td class="py-2.5 px-4 font-mono text-slate-500">{{ tx.proofReference || '—' }}</td>
                      <td class="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900">{{ tx.currency }} {{ tx.totalAmount | number:'1.0-0' }}</td>
                      <td class="py-2.5 px-4">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                          [class.bg-emerald-100]="tx.status === 'VERIFIED' || tx.status === 'SETTLED'"
                          [class.text-emerald-700]="tx.status === 'VERIFIED' || tx.status === 'SETTLED'"
                          [class.bg-amber-100]="tx.status === 'PENDING_VERIFICATION'"
                          [class.text-amber-700]="tx.status === 'PENDING_VERIFICATION'"
                          [class.bg-rose-100]="tx.status === 'REJECTED'"
                          [class.text-rose-700]="tx.status === 'REJECTED'">
                          {{ tx.status }}
                        </span>
                      </td>
                      <td class="py-2.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button type="button" (click)="openSlipModal(tx)"
                          class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer">
                          {{ tx.hasProofScreenshot ? 'View Slip' : 'Inspect' }}
                        </button>
                        @if (tx.status === 'PENDING_VERIFICATION') {
                          <button type="button" (click)="verifyTxn(tx, 'VERIFIED')"
                            class="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer">
                            Verify
                          </button>
                        }
                        <button type="button" (click)="printThermalTxn(tx)"
                          class="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold cursor-pointer">
                          80mm Slip
                        </button>
                      </td>
                    </tr>
                  }
                  @if (transactions().length === 0) {
                    <tr>
                      <td colspan="8" class="py-10 text-center text-slate-400 text-xs">
                        No digital slip submissions yet. Click "Collect / Submit Slip" above to test Raast, JazzCash, Easypaisa, or 1Bill.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- GATEWAY SETTINGS TAB -->
      @if (activeSubTab() === 'settings') {
        <div class="p-5 space-y-5">
          <!-- Policy Options -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <label class="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" [checked]="policySettings().requireProofReference"
                (change)="updatePolicyField('requireProofReference', $any($event.target).checked)" />
              <span>Require TID / Reference #</span>
            </label>
            <label class="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" [checked]="policySettings().autoVerifyDigitalSlips"
                (change)="updatePolicyField('autoVerifyDigitalSlips', $any($event.target).checked)" />
              <span>Auto-Verify Digital Slips</span>
            </label>
            <label class="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" [checked]="policySettings().allowClientSelfPay"
                (change)="updatePolicyField('allowClientSelfPay', $any($event.target).checked)" />
              <span>Allow Client Self-Service Pay</span>
            </label>
            <div class="text-right">
              <button type="button" (click)="openNewGatewayModal()"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer">
                <mat-icon class="!text-[15px] !w-4 !h-4">add</mat-icon>
                <span>Add Custom Channel</span>
              </button>
            </div>
          </div>

          <!-- Gateway Config List -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (gw of gateways(); track gw.id) {
              <div class="p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-3"
                [class.bg-white]="gw.isEnabled" [class.bg-slate-50]="!gw.isEnabled" [class.opacity-70]="!gw.isEnabled">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-extrabold text-slate-900">{{ gw.displayName }}</h4>
                      @if (gw.isDefault) {
                        <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">Default</span>
                      }
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">{{ gw.bankName }} · {{ gw.accountTitle }}</p>
                  </div>
                  <button type="button" (click)="toggleGatewayEnabled(gw)"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                    [class.bg-emerald-100]="gw.isEnabled" [class.text-emerald-800]="gw.isEnabled"
                    [class.bg-slate-200]="!gw.isEnabled" [class.text-slate-700]="!gw.isEnabled">
                    {{ gw.isEnabled ? 'Enabled' : 'Disabled' }}
                  </button>
                </div>

                <div class="text-[11px] font-mono text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-200/70 space-y-0.5">
                  <div>A/C: {{ gw.accountNumber || '—' }} | Raast: {{ gw.raastId || '—' }}</div>
                  <div>IBAN: {{ gw.iban || '—' }} | Till/1Bill: {{ gw.tillId || gw.billerCode || '—' }}</div>
                  <div>Charges: {{ gw.feeType }} ({{ gw.feeValue }}) · Mode: {{ gw.verificationMode }}</div>
                </div>

                <div class="flex items-center justify-end gap-2">
                  <button type="button" (click)="openEditGatewayModal(gw)"
                    class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer">
                    Configure A/C &amp; IBAN
                  </button>
                  <button type="button" (click)="deleteGateway(gw)"
                    class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- MODAL: COLLECT PAYMENT & SLIP SCREENSHOT UPLOAD -->
      @if (showCollectModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-base font-extrabold text-slate-900">Receive Payment &amp; Upload Deposit Slip</h3>
                <p class="text-xs text-slate-500">{{ businessLabel() }} · Duplicate Invoice Guard Active</p>
              </div>
              <button type="button" (click)="showCollectModal.set(false)" class="text-slate-400 hover:text-slate-700">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Pakistan Gateway Channel *</label>
                <select [value]="collectForm().gatewayId"
                  (change)="patchCollectForm('gatewayId', $any($event.target).value)"
                  class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold">
                  @for (gw of enabledGateways(); track gw.id) {
                    <option [value]="gw.id">{{ gw.displayName }} ({{ gw.raastId || gw.accountNumber || gw.billerCode }})</option>
                  }
                </select>
              </div>

              @if (selectedCollectGateway(); as sgw) {
                <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
                  <div class="font-extrabold">Transfer Instructions ({{ sgw.displayName }}):</div>
                  <div>{{ sgw.instructions }}</div>
                  <div class="font-mono font-bold pt-1">
                    @if (sgw.raastId) { Raast: {{ sgw.raastId }} · }
                    @if (sgw.iban) { IBAN: {{ sgw.iban }} · }
                    @if (sgw.tillId) { Till ID: {{ sgw.tillId }} · }
                    @if (sgw.billerCode) { 1Bill: {{ sgw.billerCode }} }
                  </div>
                </div>
              }

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">{{ defaultEntityLabel() }} Name *</label>
                  <input type="text" [value]="collectForm().payerName"
                    (input)="patchCollectForm('payerName', $any($event.target).value)"
                    placeholder="Full name"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Invoice / Slip #</label>
                  <input type="text" [value]="collectForm().invoiceNo"
                    (input)="patchCollectForm('invoiceNo', $any($event.target).value)"
                    placeholder="Auto if empty"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Amount (PKR) *</label>
                  <input type="number" [value]="collectForm().baseAmount"
                    (input)="patchCollectForm('baseAmount', +$any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Bank TID / Proof Reference *</label>
                  <input type="text" [value]="collectForm().proofReference"
                    (input)="patchCollectForm('proofReference', $any($event.target).value)"
                    placeholder="e.g. RAAST-998120"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Attach Deposit Slip Screenshot (PNG / JPG / WEBP)</label>
                <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onSlipFileSelected($event)"
                  class="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold" />
                @if (collectForm().proofScreenshot) {
                  <div class="mt-2 p-2 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3">
                    <img [src]="collectForm().proofScreenshot" alt="Deposit slip preview" referrerpolicy="no-referrer"
                      class="h-14 w-auto rounded border border-slate-200 object-contain" />
                    <button type="button" (click)="patchCollectForm('proofScreenshot', '')"
                      class="text-rose-600 font-bold text-[11px] hover:underline">Remove</button>
                  </div>
                }
              </div>

              <label class="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer pt-1">
                <input type="checkbox" [checked]="collectForm().markVerified"
                  (change)="patchCollectForm('markVerified', $any($event.target).checked)" />
                <span>Instant Counter Verification (Mark VERIFIED &amp; Ready for 80mm Receipt)</span>
              </label>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" (click)="showCollectModal.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
              <button type="button" (click)="submitPaymentSlip()" [disabled]="isSaving()"
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
                {{ isSaving() ? 'Submitting...' : 'Submit Payment Slip' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: SLIP LIGHTBOX & VERIFY -->
      @if (selectedTxnForModal(); as tx) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-base font-extrabold text-slate-900">Payment Slip Proof · {{ tx.txnRef }}</h3>
                <p class="text-xs text-slate-500">{{ tx.gatewayName }} · {{ tx.invoiceNo }}</p>
              </div>
              <button type="button" (click)="selectedTxnForModal.set(null)" class="text-slate-400 hover:text-slate-700">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
              <div class="flex justify-between"><span>Payer:</span><strong>{{ tx.payerName }}</strong></div>
              <div class="flex justify-between"><span>TID Ref:</span><strong>{{ tx.proofReference || '—' }}</strong></div>
              <div class="flex justify-between"><span>Total:</span><strong>{{ tx.currency }} {{ tx.totalAmount | number:'1.0-0' }}</strong></div>
              <div class="flex justify-between"><span>Status:</span><strong>{{ tx.status }}</strong></div>
            </div>

            @if (tx.proofScreenshot) {
              <div class="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center">
                <img [src]="tx.proofScreenshot" alt="Deposit slip proof" referrerpolicy="no-referrer"
                  class="max-h-64 mx-auto rounded-lg object-contain" />
              </div>
            } @else {
              <div class="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No image attached — verified via Reference / Counter ID.
              </div>
            }

            <div class="flex items-center justify-around pt-1">
              <app-shared-barcode [value]="tx.txnRef" [height]="30" />
              <app-shared-qr-code [value]="'TXN:' + tx.txnRef + '|INV:' + tx.invoiceNo + '|AMT:' + tx.totalAmount" [size]="56" />
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
              @if (tx.status === 'PENDING_VERIFICATION') {
                <button type="button" (click)="verifyTxn(tx, 'REJECTED')"
                  class="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer">
                  Reject
                </button>
                <button type="button" (click)="verifyTxn(tx, 'VERIFIED')"
                  class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer">
                  Approve &amp; Verify
                </button>
              }
              <button type="button" (click)="printThermalTxn(tx)"
                class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer">
                Print 80mm Receipt
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: EDIT / ADD GATEWAY -->
      @if (editingGateway(); as egw) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-base font-extrabold text-slate-900">{{ egw.id ? 'Configure Channel: ' + egw.displayName : 'Add Custom Pakistan Channel' }}</h3>
              <button type="button" (click)="editingGateway.set(null)" class="text-slate-400 hover:text-slate-700">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Display Name *</label>
                  <input type="text" [value]="egw.displayName"
                    (input)="patchEditingGateway('displayName', $any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Bank / Provider Name</label>
                  <input type="text" [value]="egw.bankName"
                    (input)="patchEditingGateway('bankName', $any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Account Title</label>
                  <input type="text" [value]="egw.accountTitle"
                    (input)="patchEditingGateway('accountTitle', $any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Account / Wallet Mobile #</label>
                  <input type="text" [value]="egw.accountNumber"
                    (input)="patchEditingGateway('accountNumber', $any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">IBAN</label>
                  <input type="text" [value]="egw.iban"
                    (input)="patchEditingGateway('iban', $any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Raast ID</label>
                  <input type="text" [value]="egw.raastId"
                    (input)="patchEditingGateway('raastId', $any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono" />
                </div>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Till / QR ID</label>
                  <input type="text" [value]="egw.tillId"
                    (input)="patchEditingGateway('tillId', $any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Fee Type</label>
                  <select [value]="egw.feeType"
                    (change)="patchEditingGateway('feeType', $any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                    <option value="none">None (0 Fee)</option>
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed PKR</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Fee Value</label>
                  <input type="number" [value]="egw.feeValue"
                    (input)="patchEditingGateway('feeValue', +$any($event.target).value)"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono" />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" (click)="editingGateway.set(null)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
              <button type="button" (click)="saveEditingGateway()" [disabled]="isSaving()"
                class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer">
                Save Channel Settings
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PkPaymentGatewayHubComponent implements OnInit {
  private backend = inject(BackendService);
  private hardware = inject(HardwareDeviceService);

  readonly businessKey = input<string>('coaching_academy');
  readonly businessLabel = input<string>('Enterprise Business');
  readonly defaultEntityLabel = input<string>('Customer');
  readonly defaultAmount = input<number>(5000);

  readonly activeSubTab = signal<'ledger' | 'settings'>('ledger');
  readonly gateways = signal<PkGatewayRecord[]>([]);
  readonly transactions = signal<PkTransactionRecord[]>([]);
  readonly policySettings = signal<any>({
    requireProofReference: true,
    autoVerifyDigitalSlips: false,
    allowClientSelfPay: true,
    defaultCurrency: 'PKR'
  });

  readonly showCollectModal = signal<boolean>(false);
  readonly selectedTxnForModal = signal<PkTransactionRecord | null>(null);
  readonly editingGateway = signal<PkGatewayRecord | null>(null);
  readonly isSaving = signal<boolean>(false);
  readonly feedbackMessage = signal<string>('');
  readonly feedbackIsError = signal<boolean>(false);

  readonly collectForm = signal<{
    gatewayId: string;
    payerName: string;
    invoiceNo: string;
    baseAmount: number;
    proofReference: string;
    proofScreenshot: string;
    markVerified: boolean;
  }>({
    gatewayId: '',
    payerName: '',
    invoiceNo: '',
    baseAmount: 5000,
    proofReference: '',
    proofScreenshot: '',
    markVerified: true
  });

  readonly enabledGateways = computed(() => this.gateways().filter((g) => g.isEnabled));
  readonly enabledCount = computed(() => this.enabledGateways().length);
  readonly selectedCollectGateway = computed(() => {
    const id = this.collectForm().gatewayId;
    return this.enabledGateways().find((g) => g.id === id) || this.enabledGateways()[0] || null;
  });

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  async loadAll(): Promise<void> {
    const key = this.businessKey();
    const [gwRes, txRes] = await Promise.all([
      this.backend.getPkGateways(key, true),
      this.backend.getPkGatewayTransactions(key)
    ]);
    if (gwRes.ok) {
      this.gateways.set(gwRes.gateways || []);
      if (gwRes.settings) this.policySettings.set(gwRes.settings);
    }
    if (txRes.ok) {
      this.transactions.set(txRes.transactions || []);
    }
  }

  private notify(msg: string, isError = false): void {
    this.feedbackIsError.set(isError);
    this.feedbackMessage.set(msg);
    setTimeout(() => {
      if (this.feedbackMessage() === msg) this.feedbackMessage.set('');
    }, 4500);
  }

  openCollectModal(gw?: PkGatewayRecord): void {
    const chosen = gw || this.enabledGateways()[0];
    this.collectForm.set({
      gatewayId: chosen ? chosen.id : '',
      payerName: '',
      invoiceNo: '',
      baseAmount: this.defaultAmount() || 5000,
      proofReference: '',
      proofScreenshot: '',
      markVerified: true
    });
    this.showCollectModal.set(true);
  }

  patchCollectForm<K extends keyof ReturnType<typeof this.collectForm>>(key: K, val: ReturnType<typeof this.collectForm>[K]): void {
    this.collectForm.update((f) => ({ ...f, [key]: val }));
  }

  async onSlipFileSelected(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await this.compressImageFile(file);
      this.patchCollectForm('proofScreenshot', dataUrl);
    } catch {
      this.notify('Could not read selected image file.', true);
    }
  }

  private compressImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Read error'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => resolve(String(reader.result || ''));
        img.onload = () => {
          const maxW = 900;
          const scale = img.width > maxW ? maxW / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.78));
          } else {
            resolve(String(reader.result || ''));
          }
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  async submitPaymentSlip(): Promise<void> {
    const f = this.collectForm();
    if (!f.payerName.trim() || f.baseAmount <= 0) {
      this.notify(`${this.defaultEntityLabel()} name and positive amount are required.`, true);
      return;
    }
    this.isSaving.set(true);
    try {
      const res = await this.backend.submitPkGatewayTransaction(this.businessKey(), f);
      if (res.ok && res.transaction) {
        this.transactions.update((list) => [res.transaction, ...list]);
        this.showCollectModal.set(false);
        this.notify(`Payment slip ${res.transaction.txnRef} recorded (${res.transaction.status}).`);
        this.hardware.playBeep(1180, 65);
      } else {
        this.notify(res.message || 'Unable to submit payment slip.', true);
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  openSlipModal(tx: PkTransactionRecord): void {
    this.selectedTxnForModal.set(tx);
  }

  async verifyTxn(tx: PkTransactionRecord, status: 'VERIFIED' | 'REJECTED'): Promise<void> {
    const res = await this.backend.verifyPkGatewayTransaction(this.businessKey(), tx.id, status);
    if (res.ok && res.transaction) {
      this.transactions.update((list) => list.map((t) => (t.id === tx.id ? res.transaction : t)));
      if (this.selectedTxnForModal()?.id === tx.id) {
        this.selectedTxnForModal.set(res.transaction);
      }
      this.notify(`Slip ${tx.txnRef} marked ${status}.`);
    } else {
      this.notify(res.message || 'Verification failed.', true);
    }
  }

  async printThermalTxn(tx: PkTransactionRecord): Promise<void> {
    await this.hardware.printPosReceipt({
      businessName: this.businessLabel(),
      receiptTitle: `PK GATEWAY RECEIPT (${tx.providerKey.toUpperCase()})`,
      receiptNo: tx.txnRef,
      customerName: tx.payerName,
      paymentMethod: `${tx.gatewayName}${tx.proofReference ? ' · ' + tx.proofReference : ''}`,
      currency: tx.currency || 'PKR',
      items: [
        {
          name: `Invoice ${tx.invoiceNo}`,
          qty: 1,
          unitPrice: tx.baseAmount
        }
      ],
      subtotal: tx.baseAmount,
      tax: tx.gatewayFee,
      total: tx.totalAmount,
      timestampLabel: tx.createdAt ? tx.createdAt.slice(0, 16).replace('T', ' ') : 'Just now',
      barcodeValue: tx.txnRef,
      footerNote: `Status: ${tx.status} · Verified via SoftCode PK Gateway`
    });
  }

  async kickDrawer(): Promise<void> {
    const r = await this.hardware.kickCashDrawer();
    this.notify(r.message);
  }

  async updatePolicyField(field: string, value: boolean): Promise<void> {
    const next = { ...this.policySettings(), [field]: value };
    this.policySettings.set(next);
    await this.backend.savePkGatewaySettings(this.businessKey(), next);
    this.notify('Gateway policy updated.');
  }

  async toggleGatewayEnabled(gw: PkGatewayRecord): Promise<void> {
    const res = await this.backend.updatePkGateway(this.businessKey(), gw.id, { isEnabled: !gw.isEnabled });
    if (res.ok && res.gateway) {
      this.gateways.update((list) => list.map((g) => (g.id === gw.id ? res.gateway : g)));
      this.notify(`${gw.displayName} ${res.gateway.isEnabled ? 'enabled' : 'disabled'}.`);
    }
  }

  openEditGatewayModal(gw: PkGatewayRecord): void {
    this.editingGateway.set({ ...gw });
  }

  openNewGatewayModal(): void {
    this.editingGateway.set({
      id: '',
      providerKey: 'custom',
      displayName: '',
      category: 'bank_transfer',
      accountTitle: '',
      accountNumber: '',
      iban: '',
      raastId: '',
      bankName: '',
      branchCode: '',
      tillId: '',
      billerCode: '',
      merchantId: '',
      feeType: 'none',
      feeValue: 0,
      verificationMode: 'slip_review',
      instructions: 'Transfer and attach confirmation slip.',
      isEnabled: true,
      isDefault: false
    });
  }

  patchEditingGateway<K extends keyof PkGatewayRecord>(key: K, val: PkGatewayRecord[K]): void {
    this.editingGateway.update((g) => (g ? { ...g, [key]: val } : null));
  }

  async saveEditingGateway(): Promise<void> {
    const egw = this.editingGateway();
    if (!egw || !egw.displayName.trim()) {
      this.notify('Display name is required.', true);
      return;
    }
    this.isSaving.set(true);
    try {
      const res = egw.id
        ? await this.backend.updatePkGateway(this.businessKey(), egw.id, egw)
        : await this.backend.createPkGateway(this.businessKey(), egw);
      if (res.ok && res.gateway) {
        await this.loadAll();
        this.editingGateway.set(null);
        this.notify(`${res.gateway.displayName} saved.`);
      } else {
        this.notify(res.message || 'Save failed.', true);
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteGateway(gw: PkGatewayRecord): Promise<void> {
    const res = await this.backend.deletePkGateway(this.businessKey(), gw.id);
    if (res.ok) {
      this.gateways.update((list) => list.filter((g) => g.id !== gw.id));
      this.notify(`${gw.displayName} removed.`);
    }
  }
}
