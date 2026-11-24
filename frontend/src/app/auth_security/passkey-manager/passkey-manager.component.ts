import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import {
  base64UrlToArrayBuffer,
  bufferToBase64Url,
  buildRpEntity,
  createBiometricPasskey,
  detectPasskeyDeviceLabel,
  isPasskeyWebAuthnSupported
} from '../passkey-webauthn.util';

export interface PasskeyItem {
  id: string;
  credentialId: string;
  deviceLabel: string;
  role: string;
  portalType: string;
  hasPublicKey?: boolean;
  isSynced: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
}

@Component({
  selector: 'app-passkey-manager',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      <!-- Header -->
      <div class="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-start sm:items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">fingerprint</mat-icon>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm font-black text-slate-900 tracking-tight">Passkey Login Security</h3>
              <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                SQLite Offline + Cloud Sync
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5 truncate">
              Manage WebAuthn Passkeys for <strong class="text-slate-700">{{ resolvedEmail() || 'your account' }}</strong> ({{ portalBadge() }})
            </p>
          </div>
        </div>

        <button type="button"
                (click)="loadPasskeys()"
                [disabled]="loading()"
                class="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50">
          <mat-icon class="!text-[16px] !w-[16px] !h-[16px]" [class.animate-spin]="loading()">refresh</mat-icon>
          <span>Refresh</span>
        </button>
      </div>

      <div class="p-4 sm:p-5 space-y-4">
        @if (sessionUpgradeRequired()) {
          <div class="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-start gap-2.5">
              <mat-icon class="!text-[18px] !w-[18px] !h-[18px] text-indigo-600 shrink-0 mt-0.5">verified_user</mat-icon>
              <div>
                <p class="font-bold">Signed Security Session Required</p>
                <p class="text-[11px] text-indigo-800 mt-0.5">Please sign in once to refresh your signed session token before adding or removing Passkeys.</p>
              </div>
            </div>
            <button type="button"
                    (click)="goToReauth()"
                    class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shrink-0 inline-flex items-center gap-1.5">
              <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">login</mat-icon>
              <span>Sign In Again</span>
            </button>
          </div>
        }

        @if (statusMessage()) {
          <div class="p-3 rounded-xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border"
               [class]="statusType() === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'">
            <div class="flex items-center gap-2 min-w-0">
              <mat-icon class="!text-[17px] !w-[17px] !h-[17px] shrink-0">
                {{ statusType() === 'error' ? 'error_outline' : 'check_circle' }}
              </mat-icon>
              <span>{{ statusMessage() }}</span>
            </div>
          </div>
        }

        <!-- Enroll New Passkey -->
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div class="flex-1 min-w-0">
            <label class="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Device / Passkey Label
            </label>
            <input type="text"
                   [formControl]="deviceLabelControl"
                   placeholder="e.g. My Phone Fingerprint or Work Laptop"
                   class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>

          <button type="button"
                  (click)="enrollPasskey()"
                  [disabled]="enrolling() || sessionUpgradeRequired()"
                  class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:bg-slate-300 text-white text-xs font-extrabold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 shadow-xs">
            <mat-icon class="!text-[17px] !w-[17px] !h-[17px]">{{ enrolling() ? 'hourglass_top' : 'add_circle' }}</mat-icon>
            <span>{{ enrolling() ? 'Waiting for Device...' : 'Add Passkey' }}</span>
          </button>
        </div>

        <!-- Enrolled Passkeys List -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
            <span>Registered Passkeys ({{ passkeys().length }})</span>
            <span class="text-slate-400 font-semibold normal-case">Works offline via SQLite &amp; synced to Cloud</span>
          </div>

          @if (loading() && passkeys().length === 0) {
            <div class="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-200">
              Loading your enrolled Passkeys...
            </div>
          } @else if (passkeys().length === 0) {
            <div class="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 space-y-1.5">
              <mat-icon class="!text-[28px] !w-[28px] !h-[28px] text-slate-400 mx-auto">key_off</mat-icon>
              <p class="text-xs font-bold text-slate-700">No Passkey added for this account yet</p>
              <p class="text-[11px] text-slate-500">Click "Add Passkey" above to register fingerprint, FaceID, or screen-lock sign-in.</p>
            </div>
          } @else {
            <div class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
              @for (pk of passkeys(); track pk.id) {
                <div class="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div class="flex items-start gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
                      <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">fingerprint</mat-icon>
                    </div>
                    <div class="min-w-0 space-y-0.5">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-xs font-black text-slate-900 truncate">{{ pk.deviceLabel }}</p>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                              [class]="pk.isSynced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                          {{ pk.isSynced ? 'Cloud Synced' : 'Offline SQLite' }}
                        </span>
                        @if (pk.hasPublicKey === false) {
                          <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            Incomplete Key · Remove &amp; Re-add
                          </span>
                        }
                      </div>
                      <p class="text-[11px] text-slate-500 font-mono truncate">
                        ID: {{ shortCredId(pk.credentialId) }} · Added {{ formatDate(pk.createdAt) }}
                        @if (pk.lastUsedAt) {
                          · Last used {{ formatDate(pk.lastUsedAt) }}
                        }
                      </p>
                    </div>
                  </div>

                  <button type="button"
                          (click)="removePasskey(pk)"
                          [disabled]="removingId() === pk.id"
                          class="self-end sm:self-center inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0">
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">delete</mat-icon>
                    <span>{{ removingId() === pk.id ? 'Removing...' : 'Remove' }}</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class PasskeyManagerComponent {
  private router = inject(Router);
  private notification = inject(NotificationService);

  email = input<string>('');
  fullName = input<string>('');
  tenantId = input<string>('');
  userId = input<string>('');
  role = input<string>('client_admin');
  portalType = input<string>('platform');

  passkeys = signal<PasskeyItem[]>([]);
  loading = signal<boolean>(false);
  enrolling = signal<boolean>(false);
  removingId = signal<string | null>(null);
  statusMessage = signal<string>('');
  statusType = signal<'success' | 'error'>('success');
  sessionUpgradeRequired = signal<boolean>(false);

  deviceLabelControl = new FormControl<string>(detectPasskeyDeviceLabel(), { nonNullable: true });

  private prefetchedRegisterOptions: {
    cacheKey: string;
    data: any;
    fetchedAt: number;
  } | null = null;
  private prefetchInFlight = false;

  readonly resolvedEmail = computed(() => {
    const passed = (this.email() || '').trim().toLowerCase();
    if (passed) return passed;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('user_data') : null;
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.email) return String(u.email).trim().toLowerCase();
      }
    } catch {}
    return '';
  });

  readonly portalBadge = computed(() => {
    const pt = (this.portalType() || this.role() || 'platform').replace(/_/g, ' ');
    return pt.toUpperCase();
  });

  constructor() {
    effect(() => {
      const targetEmail = this.resolvedEmail();
      const targetTenant = this.tenantId();
      if (targetEmail || targetTenant !== undefined) {
        void this.loadPasskeys();
      }
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('scs_auth_session') || '' : '';
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-scs-session'] = token;
      }
    } catch {}
    return headers;
  }

  private checkSignedSession(): boolean {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('scs_auth_session') || '' : '';
      if (!token.startsWith('scs_v1.')) {
        this.sessionUpgradeRequired.set(true);
        return false;
      }
      this.sessionUpgradeRequired.set(false);
      return true;
    } catch {
      this.sessionUpgradeRequired.set(true);
      return false;
    }
  }

  async loadPasskeys(): Promise<void> {
    if (!this.checkSignedSession()) {
      this.passkeys.set([]);
      return;
    }
    const email = this.resolvedEmail();
    if (!email) return;

    this.loading.set(true);
    try {
      const params = new URLSearchParams({ email });
      if (this.tenantId()) params.set('tenantId', this.tenantId());
      const resp = await fetch(`/api/auth/passkey/list?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const data = await resp.json().catch(() => null);
      if (resp.status === 401) {
        this.sessionUpgradeRequired.set(true);
        this.passkeys.set([]);
        return;
      }
      if (resp.ok && data?.ok) {
        this.passkeys.set(Array.isArray(data.passkeys) ? data.passkeys : []);
        void this.prefetchRegisterOptions();
      }
    } catch {
      // Keep current list on transient network blip
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchRegisterOptionsPayload(email: string): Promise<any> {
    const optResp = await fetch('/api/auth/passkey/register-options', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        email,
        tenantId: this.tenantId(),
        fullName: this.fullName() || email
      })
    });
    const optData = await optResp.json().catch(() => null);
    if (!optResp.ok || !optData?.ok || !optData?.challenge) {
      throw new Error(optData?.message || 'Unable to start Passkey setup.');
    }
    return optData;
  }

  private async prefetchRegisterOptions(): Promise<void> {
    if (this.prefetchInFlight || !this.checkSignedSession()) return;
    const email = this.resolvedEmail();
    if (!email) return;
    const cacheKey = `${email}|${this.tenantId()}`;
    this.prefetchInFlight = true;
    try {
      const data = await this.fetchRegisterOptionsPayload(email);
      this.prefetchedRegisterOptions = {
        cacheKey,
        data,
        fetchedAt: Date.now()
      };
    } catch {
      // Ignore silent prefetch errors; tap handler will retry on demand
    } finally {
      this.prefetchInFlight = false;
    }
  }

  async enrollPasskey(): Promise<void> {
    this.statusMessage.set('');
    if (!this.checkSignedSession()) return;

    if (!isPasskeyWebAuthnSupported() || !navigator.credentials?.create) {
      this.statusType.set('error');
      this.statusMessage.set('WebAuthn Passkeys are not supported in this browser.');
      this.notification.warning(this.statusMessage(), 'Notice');
      return;
    }

    const email = this.resolvedEmail();
    if (!email) {
      this.statusType.set('error');
      this.statusMessage.set('Account email is required before adding a Passkey.');
      this.notification.warning(this.statusMessage(), 'Notice');
      return;
    }

    const cacheKey = `${email}|${this.tenantId()}`;
    let optData: any = null;
    if (
      this.prefetchedRegisterOptions &&
      this.prefetchedRegisterOptions.cacheKey === cacheKey &&
      Date.now() - this.prefetchedRegisterOptions.fetchedAt < 10 * 60 * 1000
    ) {
      optData = this.prefetchedRegisterOptions.data;
      this.prefetchedRegisterOptions = null;
    }

    this.enrolling.set(true);
    try {
      if (!optData) {
        optData = await this.fetchRegisterOptionsPayload(email);
      }

      const excludeCredentials: PublicKeyCredentialDescriptor[] = [];
      if (Array.isArray(optData.excludeCredentials)) {
        for (const c of optData.excludeCredentials) {
          try {
            if (c?.id) {
              excludeCredentials.push({
                type: 'public-key',
                id: base64UrlToArrayBuffer(String(c.id))
              });
            }
          } catch {}
        }
      }

      const credential = await createBiometricPasskey({
        challenge: base64UrlToArrayBuffer(optData.challenge),
        rp: buildRpEntity(optData.rp?.name || 'SoftCodeSolution'),
        user: {
          id: base64UrlToArrayBuffer(optData.user?.id || 'c2NzLXVzZXI'),
          name: optData.user?.name || email,
          displayName: optData.user?.displayName || this.fullName() || email
        },
        pubKeyCredParams: Array.isArray(optData.pubKeyCredParams) && optData.pubKeyCredParams.length
          ? optData.pubKeyCredParams
          : [
              { alg: -7, type: 'public-key' },
              { alg: -257, type: 'public-key' },
              { alg: -8, type: 'public-key' }
            ],
        excludeCredentials,
        timeout: 60000,
        attestation: 'none'
      });

      if (!credential) {
        throw new Error('Passkey creation was cancelled.');
      }

      const resp = credential.response as AuthenticatorAttestationResponse;
      let publicKeySpki = '';
      if (typeof resp.getPublicKey === 'function') {
        const spkiBuf = resp.getPublicKey();
        if (spkiBuf) publicKeySpki = bufferToBase64Url(spkiBuf);
      }
      const attestationObject = resp.attestationObject ? bufferToBase64Url(resp.attestationObject) : '';
      const credentialId = bufferToBase64Url(credential.rawId) || credential.id;

      const enrollResp = await fetch('/api/auth/passkey/enroll', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          email,
          tenantId: this.tenantId(),
          userId: this.userId(),
          role: this.role(),
          portalType: this.portalType(),
          deviceLabel: (this.deviceLabelControl.value || '').trim() || detectPasskeyDeviceLabel(),
          challengeToken: optData.challengeToken,
          credentialId,
          clientDataJSON: bufferToBase64Url(resp.clientDataJSON),
          attestationObject,
          publicKeySpki
        })
      });
      const enrollData = await enrollResp.json().catch(() => null);
      if (!enrollResp.ok || !enrollData?.ok) {
        throw new Error(enrollData?.message || 'Failed to save Passkey.');
      }

      this.statusType.set('success');
      this.statusMessage.set(enrollData.message || 'Passkey added and secured.');
      this.notification.success(this.statusMessage(), 'Passkey Added');
      await this.loadPasskeys();
    } catch (err: any) {
      this.statusType.set('error');
      const errName = String(err?.name || '');
      if (errName === 'InvalidStateError') {
        this.statusMessage.set('This device already has a Passkey saved for this account.');
      } else if (errName === 'NotAllowedError' || errName === 'SecurityError' || errName === 'AbortError') {
        this.statusMessage.set(
          'Biometric Passkey prompt was cancelled or blocked by this context. Ensure device screen lock / fingerprint is enabled and try again.'
        );
      } else {
        this.statusMessage.set(err?.message || 'Could not enroll Passkey.');
      }
      this.notification.warning(this.statusMessage(), 'Notice');
    } finally {
      this.enrolling.set(false);
      void this.prefetchRegisterOptions();
    }
  }

  async removePasskey(pk: PasskeyItem): Promise<void> {
    this.statusMessage.set('');
    if (!this.checkSignedSession()) return;

    this.removingId.set(pk.id);
    try {
      const resp = await fetch('/api/auth/passkey/remove', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ id: pk.id })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.message || 'Unable to remove Passkey.');
      }
      this.passkeys.update((items) => items.filter((item) => item.id !== pk.id));
      this.statusType.set('success');
      this.statusMessage.set(data.message || 'Passkey removed.');
      this.notification.info(this.statusMessage(), 'Notice');
      this.prefetchedRegisterOptions = null;
      void this.prefetchRegisterOptions();
    } catch (err: any) {
      this.statusType.set('error');
      this.statusMessage.set(err?.message || 'Unable to remove Passkey.');
      this.notification.error(this.statusMessage(), 'Notice');
    } finally {
      this.removingId.set(null);
    }
  }

  goToReauth(): void {
    void this.router.navigateByUrl('/login');
  }

  shortCredId(credId: string): string {
    if (!credId) return '—';
    return credId.length > 16 ? `${credId.slice(0, 8)}...${credId.slice(-6)}` : credId;
  }

  formatDate(iso: string): string {
    if (!iso) return 'Just now';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
