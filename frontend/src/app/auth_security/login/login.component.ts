import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { BackendService } from '../../services/backend.service';
import { PwaInstallComponent } from '../../pwa-install.component';
import { LegalComponent } from '../../softcodesolution_platform/landing-page/legal/legal.component';
import { CurrencyLanguageSelectorComponent } from '../../components/currency-language-selector/currency-language-selector.component';
import {
  base64UrlToArrayBuffer,
  bufferToBase64Url,
  buildRpEntity,
  getBiometricPasskeyAssertion,
  isPasskeyWebAuthnSupported
} from '../passkey-webauthn.util';

function sanitizeInput(value: string): string {
  if (!value) return '';
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PwaInstallComponent, LegalComponent, CurrencyLanguageSelectorComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  isMenuOpen: boolean = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (typeof document !== 'undefined') {
      if (this.isMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    this.cdr.detectChanges();
  }

  closeMenu() {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
      this.cdr.detectChanges();
    }
  }

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private notification = inject(NotificationService);
  private backendService = inject(BackendService);

  loginForm!: FormGroup;
  isLoading = false;
  isPasskeyLoading = false;
  showSuccessPopup = false;
  showLoginError = false;
  loginErrorMessage = 'Invalid credentials. Please verify your details.';
  private prefetchedLoginOptions: {
    email: string;
    data: any;
    fetchedAt: number;
  } | null = null;
  private loginPrefetchTimer: any = null;
  remainingAttempts: number | null = null;
  isAccountLocked = false;
  
  rememberMe = true;
  showPassword = false;
  emailAutoCorrected = false;
  emailAutoCorrectNote = '';
  passwordAutoCorrected = false;

  // Anti-Bot & Anti-Hacker Shield State
  private formLoadedAt = Date.now();
  humanVerified = false;
  humanVerifying = false;
  humanShieldError = false;
  private botChallengeToken = '';
  private botPowNonce = 0;

  // Multi-Portal Gateway Selection
  portalType: 'owner' | 'principal' | 'teacher' | 'student' | 'parent' | 'staff' | 'accountant' = 'owner';

  showForgotPopup = false;
  showForgotSuccess = false;
  forgotEmail = '';
  forgotEmailError = false;
  forgotLoading = false;

  showLegalModal = false;
  legalActiveTab = 'privacy';

  openLegalModal(tab: string = 'privacy') {
    this.legalActiveTab = tab;
    this.showLegalModal = true;
  }

  closeLegalModal() {
    this.showLegalModal = false;
  }

  private redirectPath = '/dashboard';
  private isCheckoutRedirect = false;
  private checkoutSuiteParam = '';
  private checkoutPlanParam = '';

  ngOnInit(): void {
    this.formLoadedAt = Date.now();
    const savedEmail = localStorage.getItem('scs_remembered_email');
    this.loginForm = this.fb.group({
      email: [savedEmail || '', [Validators.required]],
      password: ['', [Validators.required]],
      hpWebsite: ['']
    });

    // Smart Gateway: Check if redirected from a specific portal link or Store checkout
    this.route.queryParams.subscribe(params => {
      this.isCheckoutRedirect = params['redirect'] === 'checkout';
      this.checkoutSuiteParam = String(params['suite'] || '').trim();
      this.checkoutPlanParam = String(params['plan'] || '').trim();

      const p = (params['portal'] || params['role'] || '').toLowerCase();
      if (p.includes('student')) {
        this.selectPortal('student');
      } else if (p.includes('parent') || p.includes('family')) {
        this.selectPortal('parent');
      } else if (p.includes('principal') || p.includes('headmaster') || p.includes('viceprincipal')) {
        this.selectPortal('principal');
      } else if (p.includes('teacher') || p.includes('faculty')) {
        this.selectPortal('teacher');
      } else if (p.includes('accountant') || p.includes('feeclerk') || p.includes('bursar') || p.includes('cashier')) {
        this.selectPortal('accountant');
      } else if (p.includes('staff') || p.includes('worker')) {
        this.selectPortal('staff');
      } else if (p.includes('owner') || p.includes('admin')) {
        this.selectPortal('owner');
      }
    });

    void this.prefetchLoginOptions();
  }

  selectPortal(type: 'owner' | 'principal' | 'teacher' | 'student' | 'parent' | 'staff' | 'accountant'): void {
    this.portalType = type;
    this.showLoginError = false;
    this.cdr.detectChanges();
  }

  quickFillDemo(type: 'owner' | 'principal' | 'teacher' | 'student' | 'parent' | 'accountant'): void {
    this.portalType = type;
    if (type === 'student') {
      this.loginForm.patchValue({
        email: 'SCH-2026-01',
        password: 'Daniyal#2026!'
      });
    } else if (type === 'parent') {
      this.loginForm.patchValue({
        email: '+92 300 1234567',
        password: 'Parent#2026!'
      });
    } else if (type === 'principal') {
      this.loginForm.patchValue({
        email: 'principal@campus.edu',
        password: 'Principal#2026!'
      });
    } else if (type === 'teacher') {
      this.loginForm.patchValue({
        email: 'farhan@school.edu',
        password: 'Teacher#2026!'
      });
    } else if (type === 'accountant') {
      this.loginForm.patchValue({
        email: 'accountant@campus.edu',
        password: 'Accountant#2026!'
      });
    } else {
      this.loginForm.patchValue({
        email: 'owner@school.edu',
        password: 'AdminPassword2026!'
      });
    }
    this.cdr.detectChanges();
  }

  toggleRememberMe(): void {
    this.rememberMe = !this.rememberMe;
  }

  onEmailInput(): void {
    const ctrl = this.loginForm.get('email');
    if (!ctrl) return;
    const raw: string = ctrl.value || '';
    const noDanger = raw.replace(/[<>"';]/g, '');
    if (noDanger !== raw) {
      ctrl.setValue(noDanger, { emitEvent: false });
      this.emailAutoCorrected = true;
      this.emailAutoCorrectNote = 'Unsafe characters removed';
    }
    this.scheduleLoginPrefetch();
  }

  onEmailBlur(): void {
    const ctrl = this.loginForm.get('email');
    if (!ctrl) return;
    const raw: string = ctrl.value || '';
    const trimmed = sanitizeInput(raw);
    const normalized = trimmed.includes('@') ? trimmed.toLowerCase() : trimmed;
    if (normalized && normalized !== raw) {
      ctrl.setValue(normalized);
      this.emailAutoCorrected = true;
      this.emailAutoCorrectNote = raw !== trimmed ? 'Spaces auto-trimmed' : 'Email normalized';
    }
    void this.prefetchLoginOptions();
  }

  onPasswordInput(): void {
    this.passwordAutoCorrected = false;
  }

  onPasswordBlur(): void {
    const ctrl = this.loginForm.get('password');
    if (!ctrl) return;
    const raw: string = ctrl.value || '';
    const trimmed = raw.trim();
    if (trimmed && trimmed !== raw) {
      ctrl.setValue(trimmed);
      this.passwordAutoCorrected = true;
    }
  }

  onForgotPassword(): void {
    this.forgotEmail = this.loginForm.value.email || '';
    this.forgotEmailError = false;
    this.showForgotPopup = true;
    this.cdr.detectChanges();
  }

  closeForgotPopup(): void {
    this.showForgotPopup = false;
    this.forgotEmailError = false;
  }

  async submitForgotPassword(): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = sanitizeInput(this.forgotEmail);

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      this.forgotEmailError = true;
      return;
    }

    this.forgotLoading = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.forgotLoading = false;
      this.showForgotPopup = false;
      this.showForgotSuccess = true;
      this.cdr.detectChanges();
    }, 1200);
  }

  finishForgot(): void {
    this.showForgotSuccess = false;
    this.forgotEmail = '';
  }

  async verifyHumanShield(): Promise<void> {
    if (this.humanVerifying || this.humanVerified) return;
    this.humanVerifying = true;
    this.humanShieldError = false;
    this.cdr.detectChanges();

    try {
      const resp = await fetch('/api/auth/challenge', { cache: 'no-store' });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.challengeToken || !data?.challengeSeed) {
        throw new Error('Challenge unavailable');
      }

      const difficulty = Number(data.difficulty) || 3;
      const prefix = '0'.repeat(Math.max(1, Math.min(difficulty, 5)));
      const encoder = new TextEncoder();
      let nonce = 0;

      while (nonce < 250000) {
        const buf = await crypto.subtle.digest('SHA-256', encoder.encode(`${data.challengeSeed}:${nonce}`));
        const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (hex.startsWith(prefix)) {
          this.botChallengeToken = data.challengeToken;
          this.botPowNonce = nonce;
          this.humanVerified = true;
          break;
        }
        nonce++;
      }
    } catch {
      this.humanShieldError = true;
    } finally {
      this.humanVerifying = false;
      this.cdr.detectChanges();
    }
  }

  async onSubmit(): Promise<void> {
    this.showLoginError = false;
    this.isAccountLocked = false;
    this.remainingAttempts = null;
    this.humanShieldError = false;

    this.onEmailBlur();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.humanVerified || !this.botChallengeToken) {
      this.humanShieldError = true;
      this.showLoginError = true;
      this.loginErrorMessage = 'Please complete the Anti-Bot Human Verification check below before signing in.';
      this.notification.warning?.(this.loginErrorMessage, 'Notice');
      this.cdr.detectChanges();
      return;
    }

    const rawInput = (this.loginForm.value.email || '').trim();
    if (rawInput.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawInput)) {
      this.showLoginError = true;
      this.loginErrorMessage = 'Please enter a valid email format (e.g. name@company.com).';
      this.notification.warning?.(this.loginErrorMessage, 'Notice');
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const sanitizedEmail = sanitizeInput(rawInput).toLowerCase().trim();
    const password = this.loginForm.value.password || '';
    const botDefense = {
      honeypot: this.loginForm.value.hpWebsite || '',
      challengeToken: this.botChallengeToken,
      powNonce: this.botPowNonce,
      formTimingMs: Date.now() - this.formLoadedAt
    };

    // Smart Role Determination (Portal users registry lookup first — tenant-scoped + global fallback)
    let targetPortal: 'owner' | 'principal' | 'teacher' | 'student' | 'parent' | 'staff' | 'accountant' = this.portalType;
    let matchedPortalUser: any = null;
    const savedTenantId = (localStorage.getItem('scs_tenant_id') || '').trim();
    const portalUsersStorageKey = savedTenantId
      ? `scs_school_portal_users_v1_${savedTenantId}`
      : 'scs_school_portal_users_v1';

    try {
      let storedUsersRaw = localStorage.getItem(portalUsersStorageKey) || localStorage.getItem('scs_school_portal_users_v1');
      if (!storedUsersRaw) {
        const initialUsers = [
          { id: 'USR-601', staffIdOrRoll: 'PRI-101', name: 'Prof. Dr. Tahir Malik', role: 'principal', email: 'principal@campus.edu', linkedEntity: 'Academic Directorate & Examination Council', branchId: 'BR-LHR-01', branchName: 'Lahore Main Campus', wingId: 'WNG-LHR-SNR', wingName: 'Senior & O-Level Wing', status: 'Active', pin: '9900', lastLogin: 'Never' },
          { id: 'USR-602', staffIdOrRoll: 'PRI-102', name: 'Prof. Ayesha Siddiqua', role: 'principal', email: 'viceprincipal@campus.edu.pk', linkedEntity: 'Islamabad F-10 Campus Directorate', branchId: 'BR-ISB-02', branchName: 'Islamabad F-10 Campus', wingId: 'WNG-ISB-SNR', wingName: 'F-10 Senior Science Wing', status: 'Active', pin: '9902', lastLogin: 'Never' },
          { id: 'USR-501', staffIdOrRoll: 'ACC-001', name: 'Muhammad Rizwan (Accountant)', role: 'accountant', email: 'accountant@campus.edu', linkedEntity: 'Fee Counter & Daily Closing Desk', branchId: 'BR-LHR-01', branchName: 'Lahore Main Campus', wingId: 'WNG-LHR-SNR', wingName: 'Senior & O-Level Wing', status: 'Active', pin: '4455', lastLogin: 'Never' },
          { id: 'USR-502', staffIdOrRoll: 'STF-104', name: 'Kamran Qureshi', role: 'accountant', email: 'accounts@campus.edu.pk', linkedEntity: 'Islamabad Fee Counter & Ledger Desk', branchId: 'BR-ISB-02', branchName: 'Islamabad F-10 Campus', wingId: 'WNG-ISB-SNR', wingName: 'F-10 Senior Science Wing', status: 'Active', pin: '4460', lastLogin: 'Never' },
          { id: 'TCH-001', staffIdOrRoll: 'EMP-2021-01', name: 'Prof. Tariq Mehmood', role: 'teacher', email: 'tariq.math@school.edu', linkedEntity: 'Grade 10-A (Mathematics)', branchId: 'BR-LHR-01', branchName: 'Lahore Main Campus', wingId: 'WNG-LHR-SNR', wingName: 'Senior & O-Level Wing', status: 'Active', pin: '1001', lastLogin: 'Never' },
          { id: 'TCH-002', staffIdOrRoll: 'EMP-2020-02', name: 'Dr. Sarah Jenkins', role: 'teacher', email: 'sarah.eng@school.edu', linkedEntity: 'Grade 10-B (English)', branchId: 'BR-ISB-02', branchName: 'Islamabad F-10 Campus', wingId: 'WNG-ISB-GRL', wingName: 'F-10 Girls Wing', status: 'Active', pin: '1002', lastLogin: 'Never' },
          { id: 'ST-1001', staffIdOrRoll: '1001', name: 'Zayan Ahmed Khan', role: 'student', email: 'zayan.1001@student.edu', linkedEntity: 'Grade 10-A (Roll #1001)', branchId: 'BR-LHR-01', branchName: 'Lahore Main Campus', wingId: 'WNG-LHR-SNR', wingName: 'Senior & O-Level Wing', status: 'Active', pin: '8821', lastLogin: 'Never' },
          { id: 'ST-1002', staffIdOrRoll: '1102', name: 'Amna Salman', role: 'student', email: 'amna.1102@student.edu', linkedEntity: 'Grade 9-C (Roll #1102)', branchId: 'BR-ISB-02', branchName: 'Islamabad F-10 Campus', wingId: 'WNG-ISB-GRL', wingName: 'F-10 Girls Wing', status: 'Active', pin: '8824', lastLogin: 'Never' },
          { id: 'PAR-001', staffIdOrRoll: 'GRD-701', name: 'Tariq Ahmed Khan (Guardian)', role: 'parent', email: 'tariq.parent@guardian.com', linkedEntity: 'ST-1001', branchId: 'BR-LHR-01', branchName: 'Lahore Main Campus', wingId: 'WNG-LHR-SNR', wingName: 'Senior & O-Level Wing', status: 'Active', pin: '4041', lastLogin: 'Never' },
          { id: 'PAR-002', staffIdOrRoll: 'GRD-702', name: 'Dr. Salman Farooq (Guardian)', role: 'parent', email: 'salman.parent@guardian.com', linkedEntity: 'ST-1002', branchId: 'BR-ISB-02', branchName: 'Islamabad F-10 Campus', wingId: 'WNG-ISB-GRL', wingName: 'F-10 Girls Wing', status: 'Active', pin: '4042', lastLogin: 'Never' }
        ];
        localStorage.setItem('scs_school_portal_users_v1', JSON.stringify(initialUsers));
        if (savedTenantId) {
          localStorage.setItem(portalUsersStorageKey, JSON.stringify(initialUsers));
        }
        storedUsersRaw = JSON.stringify(initialUsers);
      }
      if (storedUsersRaw) {
        const storedUsers = JSON.parse(storedUsersRaw);
        if (Array.isArray(storedUsers)) {
          const inputLower = sanitizedEmail;
          matchedPortalUser = storedUsers.find((u: any) => {
            const uEmail = (u.email || '').toLowerCase().trim();
            const uId = (u.id || '').toLowerCase().trim();
            const uCode = (u.staffIdOrRoll || '').toLowerCase().trim();
            const uName = (u.name || '').toLowerCase().trim();
            const uPin = (u.pin || '').trim();
            return (
              (uEmail && uEmail === inputLower) ||
              (uId && uId === inputLower) ||
              (uCode && uCode === inputLower) ||
              (uName && uName === inputLower) ||
              (uPin && uPin === inputLower) ||
              (uId && inputLower.includes(uId)) ||
              (uEmail && inputLower.includes(uEmail)) ||
              (uPin && uPin === password && inputLower.includes(u.role))
            );
          });
        }
      }
    } catch {}

    if (matchedPortalUser) {
      if (matchedPortalUser.status === 'Suspended') {
        this.showLoginError = true;
        this.isLoading = false;
        this.notification.error?.('Portal Access Suspended: Please contact school administration.', 'Notice');
        this.cdr.detectChanges();
        return;
      }
      targetPortal = matchedPortalUser.role;
      try {
        const updateRegistryKey = (storageKey: string) => {
          const raw = localStorage.getItem(storageKey);
          if (!raw) return;
          const list = JSON.parse(raw);
          if (!Array.isArray(list)) return;
          const idx = list.findIndex((u: any) => u.id === matchedPortalUser.id);
          if (idx !== -1) {
            list[idx].lastLogin = 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem(storageKey, JSON.stringify(list));
          }
        };
        updateRegistryKey('scs_school_portal_users_v1');
        if (savedTenantId) updateRegistryKey(portalUsersStorageKey);
      } catch {}
      localStorage.setItem('activeSchoolPortalUser', JSON.stringify({
        ...matchedPortalUser,
        tenantId: matchedPortalUser.tenantId || savedTenantId || undefined
      }));
    } else {
      if (sanitizedEmail.includes('principal') || sanitizedEmail.includes('viceprincipal') || sanitizedEmail.includes('headmaster')) {
        targetPortal = 'principal';
      } else if (sanitizedEmail.includes('owner') || sanitizedEmail.includes('admin@school')) {
        targetPortal = 'owner';
      } else if (sanitizedEmail.includes('accountant') || sanitizedEmail.includes('accounts@') || sanitizedEmail.includes('feeclerk') || sanitizedEmail.includes('bursar') || sanitizedEmail.includes('cashier')) {
        targetPortal = 'accountant';
      } else if (sanitizedEmail.startsWith('sch-') || sanitizedEmail.endsWith('.sch') || sanitizedEmail.includes('std-') || sanitizedEmail.includes('student') || sanitizedEmail.includes('zayan') || sanitizedEmail.includes('amna') || /^\d{4,6}$/.test(sanitizedEmail)) {
        targetPortal = 'student';
      } else if (sanitizedEmail.startsWith('+92') || sanitizedEmail.startsWith('03') || /^\d{10,12}$/.test(sanitizedEmail.replace(/\D/g, '')) || sanitizedEmail.includes('parent') || sanitizedEmail.includes('guardian')) {
        targetPortal = 'parent';
      } else if (sanitizedEmail.includes('farhan') || sanitizedEmail.includes('teacher') || sanitizedEmail.includes('saima') || sanitizedEmail.includes('faculty') || sanitizedEmail.includes('prof') || sanitizedEmail.includes('tariq.math') || sanitizedEmail.includes('sarah.eng')) {
        targetPortal = 'teacher';
      }
    }

    const applySchoolPortalRouting = (portalRole: string, personaObj: any, fallbackInput: string) => {
      if (portalRole === 'student') {
        localStorage.setItem('activeSchoolPortal', 'student-portal');
        localStorage.setItem('activeSchoolRole', 'student');
        localStorage.setItem('activeSchoolTargetStudent', personaObj?.staffIdOrRoll || personaObj?.id || fallbackInput);
      } else if (portalRole === 'parent') {
        localStorage.setItem('activeSchoolPortal', 'parent-portal');
        localStorage.setItem('activeSchoolRole', 'parent');
        localStorage.setItem('activeSchoolTargetParent', personaObj?.linkedEntity || personaObj?.id || fallbackInput);
      } else if (portalRole === 'teacher') {
        localStorage.setItem('activeSchoolPortal', 'teacher-portal');
        localStorage.setItem('activeSchoolRole', 'teacher');
        localStorage.setItem('activeSchoolTargetTeacher', personaObj?.staffIdOrRoll || personaObj?.id || fallbackInput);
      } else if (portalRole === 'principal') {
        localStorage.setItem('activeSchoolPortal', 'principal-portal');
        localStorage.setItem('activeSchoolRole', 'principal');
        localStorage.setItem('activeSchoolTargetPrincipal', personaObj?.staffIdOrRoll || personaObj?.id || fallbackInput);
      } else if (portalRole === 'accountant') {
        localStorage.setItem('activeSchoolPortal', 'accountant-portal');
        localStorage.setItem('activeSchoolRole', 'accountant');
        localStorage.setItem('activeSchoolTargetAccountant', personaObj?.id || personaObj?.staffIdOrRoll || fallbackInput);
      } else if (portalRole === 'staff') {
        localStorage.setItem('activeSchoolPortal', 'attendance');
        localStorage.setItem('activeSchoolRole', 'staff');
      } else {
        localStorage.setItem('activeSchoolPortal', 'overview');
        localStorage.setItem('activeSchoolRole', 'owner');
      }
    };

    // Configure initial role-based routing target
    applySchoolPortalRouting(targetPortal, matchedPortalUser, rawInput);

    try {
      const clientMeta = {
        browser: window.navigator?.userAgent?.includes('Chrome') ? 'Google Chrome' : 'Mobile Web',
        os: window.navigator?.platform || 'Android/Windows',
        device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile Device' : 'Desktop Workstation',
        city: 'Karachi',
        country: 'Pakistan'
      };

      const result = await this.backendService.loginUser(sanitizedEmail, password, clientMeta, botDefense);

      // Single-use nonce consumed: reset shield so next attempt gets a fresh challenge
      this.humanVerified = false;
      this.botChallengeToken = '';
      this.botPowNonce = 0;

      if (!result || !result.ok) {
        this.showLoginError = true;
        this.isLoading = false;
        this.isAccountLocked = !!result?.isLocked;
        this.remainingAttempts = typeof result?.remainingAttempts === 'number' ? result.remainingAttempts : null;
        const errMsg = result?.message || 'Invalid credentials. Please verify your details.';
        this.loginErrorMessage = errMsg;
        this.notification.error?.(errMsg, 'Notice');
        localStorage.removeItem('user_data');
        localStorage.removeItem('scs_auth_session');
        localStorage.removeItem('scs_auth_mock');

        // Capture intruder webcam camera snapshot on failed attempt
        this.tryCaptureCameraSnapshot(sanitizedEmail);

        this.cdr.detectChanges();
        return;
      }

      if (this.rememberMe) {
        localStorage.setItem('scs_remembered_email', sanitizedEmail);
      } else {
        localStorage.removeItem('scs_remembered_email');
      }
      
      localStorage.setItem('scs_auth_session', result.token || ('scs_token_' + Date.now()));
      
      if (result.user) {
        localStorage.setItem('user_data', JSON.stringify(result.user));
        if (result.user.tenant_id) {
          localStorage.setItem('scs_tenant_id', result.user.tenant_id);
        } else {
          localStorage.removeItem('scs_tenant_id');
        }
        const backendRole = String(result.user.role || '').toLowerCase();
        const backendPortal = String(result.user.portal_type || '').toLowerCase();
        const resolvedSchoolRole = ['principal', 'teacher', 'student', 'parent', 'accountant'].includes(backendRole)
          ? backendRole
          : (['principal', 'teacher', 'student', 'parent', 'accountant'].includes(backendPortal) ? backendPortal : targetPortal);
        const mergedPortalUser = {
          ...(matchedPortalUser || {}),
          id: matchedPortalUser?.id || result.user.id || undefined,
          name: matchedPortalUser?.name || result.user.full_name || result.user.name || undefined,
          email: matchedPortalUser?.email || result.user.email || sanitizedEmail,
          role: resolvedSchoolRole,
          tenantId: result.user.tenant_id || matchedPortalUser?.tenantId || savedTenantId || undefined,
          branchId: result.user.branchId || result.user.branch_id || matchedPortalUser?.branchId,
          branchName: result.user.branchName || result.user.branch_name || matchedPortalUser?.branchName,
          wingId: result.user.wingId || result.user.wing_id || matchedPortalUser?.wingId,
          wingName: result.user.wingName || result.user.wing_name || matchedPortalUser?.wingName,
          wingScopeLocked: result.user.wingScopeLocked ?? matchedPortalUser?.wingScopeLocked
        };
        if (mergedPortalUser.role && mergedPortalUser.role !== 'owner') {
          localStorage.setItem('activeSchoolPortalUser', JSON.stringify(mergedPortalUser));
          applySchoolPortalRouting(mergedPortalUser.role, mergedPortalUser, rawInput);
        }
      }
      
      const isSuperAdminRole = result.user?.role === 'super_admin' || result.redirect === '/superadmin';
      const targetUrl = isSuperAdminRole ? '/superadmin' : '/dashboard';
      const displayName = result.user?.full_name || result.user?.company_name || (isSuperAdminRole ? 'Super Admin' : 'User');

      this.notification.success?.(
        `Welcome back, ${displayName}! Access granted.`,
        isSuperAdminRole ? 'Super Admin Login' : 'Login Successful'
      );
      this.isLoading = false;
      this.cdr.detectChanges();

      if (this.isCheckoutRedirect && !isSuperAdminRole) {
        const suiteParam = this.checkoutSuiteParam || this.checkoutPlanParam || 'active';
        await this.router.navigate(['/'], {
          queryParams: { checkoutSuite: suiteParam },
          fragment: 'store'
        });
        return;
      }

      await this.router.navigateByUrl(targetUrl);
    } catch (error: any) {
      this.humanVerified = false;
      this.botChallengeToken = '';
      this.botPowNonce = 0;
      this.showLoginError = true;
      this.isLoading = false;
      this.notification.error?.('Invalid credentials. Please verify your details.', 'Notice');
      localStorage.removeItem('user_data');
      localStorage.removeItem('scs_auth_session');
      localStorage.removeItem('scs_auth_mock');
      this.tryCaptureCameraSnapshot(sanitizedEmail);
      this.cdr.detectChanges();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private scheduleLoginPrefetch(): void {
    if (this.loginPrefetchTimer) {
      clearTimeout(this.loginPrefetchTimer);
    }
    this.loginPrefetchTimer = setTimeout(() => {
      void this.prefetchLoginOptions();
    }, 280);
  }

  private async fetchLoginOptionsPayload(email: string): Promise<any> {
    const optResp = await fetch('/api/auth/passkey/login-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const optData = await optResp.json().catch(() => null);
    if (!optResp.ok || !optData?.ok || !optData?.challenge) {
      throw new Error('Unable to initialize Passkey sign-in.');
    }
    return optData;
  }

  private async prefetchLoginOptions(): Promise<void> {
    if (!isPasskeyWebAuthnSupported()) return;
    const emailInput = sanitizeInput(this.loginForm?.value?.email || '').toLowerCase();
    try {
      const data = await this.fetchLoginOptionsPayload(emailInput);
      this.prefetchedLoginOptions = {
        email: emailInput,
        data,
        fetchedAt: Date.now()
      };
    } catch {
      // Silent prefetch retry on user tap
    }
  }

  async onPasskeyLogin(): Promise<void> {
    this.showLoginError = false;
    this.isAccountLocked = false;
    this.remainingAttempts = null;

    if (!isPasskeyWebAuthnSupported() || !navigator.credentials?.get) {
      this.showLoginError = true;
      this.loginErrorMessage = 'Passkey is not supported in this browser. Please sign in with your password.';
      this.notification.warning?.(this.loginErrorMessage, 'Notice');
      this.cdr.detectChanges();
      return;
    }

    const emailInput = sanitizeInput(this.loginForm.value.email || '').toLowerCase();
    let optData: any = null;
    if (
      this.prefetchedLoginOptions &&
      this.prefetchedLoginOptions.email === emailInput &&
      Date.now() - this.prefetchedLoginOptions.fetchedAt < 4 * 60 * 1000
    ) {
      optData = this.prefetchedLoginOptions.data;
      this.prefetchedLoginOptions = null;
    }

    this.isPasskeyLoading = true;
    this.cdr.detectChanges();

    try {
      if (!optData) {
        optData = await this.fetchLoginOptionsPayload(emailInput);
      }

      const allowCredentials: PublicKeyCredentialDescriptor[] = [];
      if (Array.isArray(optData.allowCredentials)) {
        for (const c of optData.allowCredentials) {
          try {
            if (c?.id) {
              allowCredentials.push({
                type: 'public-key',
                id: base64UrlToArrayBuffer(String(c.id))
              });
            }
          } catch {}
        }
      }

      const rp = buildRpEntity();
      const publicKeyRequest: PublicKeyCredentialRequestOptions = {
        challenge: base64UrlToArrayBuffer(optData.challenge),
        userVerification: 'required',
        timeout: 60000
      };
      if (rp.id) {
        publicKeyRequest.rpId = rp.id;
      }
      if (allowCredentials.length > 0) {
        publicKeyRequest.allowCredentials = allowCredentials;
      }

      const assertion = await getBiometricPasskeyAssertion(publicKeyRequest);
      if (!assertion) {
        throw new Error('Passkey sign-in cancelled.');
      }

      const resp = assertion.response as AuthenticatorAssertionResponse;
      const credentialId = bufferToBase64Url(assertion.rawId) || assertion.id;
      const verifyResp = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: optData.challengeToken,
          credentialId,
          clientDataJSON: bufferToBase64Url(resp.clientDataJSON),
          authenticatorData: bufferToBase64Url(resp.authenticatorData),
          signature: bufferToBase64Url(resp.signature)
        })
      });

      const result = await verifyResp.json().catch(() => null);
      if (!verifyResp.ok || !result?.ok) {
        this.showLoginError = true;
        this.loginErrorMessage = result?.message || 'Passkey verification failed. Please sign in with your password.';
        this.notification.error?.(this.loginErrorMessage, 'Notice');
        this.cdr.detectChanges();
        return;
      }

      localStorage.setItem('scs_auth_session', result.token || ('scs_token_' + Date.now()));
      if (result.user) {
        localStorage.setItem('user_data', JSON.stringify(result.user));
        if (result.user.tenant_id) {
          localStorage.setItem('scs_tenant_id', result.user.tenant_id);
        }
        const pkPortal = String(result.portalType || result.user.portal_type || '').toLowerCase();
        const pkRole = String(result.user.role || '').toLowerCase();
        const resolvedPkRole = ['principal', 'teacher', 'student', 'parent', 'accountant'].includes(pkRole)
          ? pkRole
          : (['principal', 'teacher', 'student', 'parent', 'accountant'].includes(pkPortal) ? pkPortal : '');
        if (resolvedPkRole) {
          localStorage.setItem('activeSchoolRole', resolvedPkRole);
          localStorage.setItem('activeSchoolPortal', resolvedPkRole + '-portal');
          const pkId = result.user.id || result.user.email || emailInput;
          if (resolvedPkRole === 'principal' && pkId) localStorage.setItem('activeSchoolTargetPrincipal', String(pkId));
          if (resolvedPkRole === 'accountant' && pkId) localStorage.setItem('activeSchoolTargetAccountant', String(pkId));
          if (resolvedPkRole === 'teacher' && pkId) localStorage.setItem('activeSchoolTargetTeacher', String(pkId));
          if (resolvedPkRole === 'student' && pkId) localStorage.setItem('activeSchoolTargetStudent', String(pkId));
          if (resolvedPkRole === 'parent' && pkId) localStorage.setItem('activeSchoolTargetParent', String(pkId));
          localStorage.setItem('activeSchoolPortalUser', JSON.stringify({
            id: result.user.id,
            name: result.user.full_name || result.user.name,
            email: result.user.email,
            role: resolvedPkRole,
            tenantId: result.user.tenant_id,
            branchId: result.user.branchId || result.user.branch_id,
            branchName: result.user.branchName || result.user.branch_name,
            wingId: result.user.wingId || result.user.wing_id,
            wingName: result.user.wingName || result.user.wing_name,
            wingScopeLocked: result.user.wingScopeLocked
          }));
        } else if (pkPortal === 'school_owner') {
          localStorage.setItem('activeSchoolRole', 'owner');
          localStorage.setItem('activeSchoolPortal', 'overview');
        }
      }

      const isSuperAdminRole = result.user?.role === 'super_admin' || result.redirect === '/superadmin';
      const targetUrl = isSuperAdminRole ? '/superadmin' : '/dashboard';
      const displayName = result.user?.full_name || result.user?.company_name || (isSuperAdminRole ? 'Super Admin' : 'User');
      this.notification.success?.(
        `Welcome back, ${displayName}! Passkey verified.`,
        isSuperAdminRole ? 'Super Admin Login' : 'Login Successful'
      );

      if (this.isCheckoutRedirect && !isSuperAdminRole) {
        const suiteParam = this.checkoutSuiteParam || this.checkoutPlanParam || 'active';
        await this.router.navigate(['/'], {
          queryParams: { checkoutSuite: suiteParam },
          fragment: 'store'
        });
        return;
      }

      await this.router.navigateByUrl(targetUrl);
    } catch (err: any) {
      this.showLoginError = true;
      const errName = String(err?.name || '');
      if (errName === 'NotAllowedError' || errName === 'SecurityError' || errName === 'AbortError') {
        this.loginErrorMessage = 'No matching Passkey found on this device or verification was cancelled. Enter your email or sign in with password.';
      } else {
        this.loginErrorMessage = err?.message || 'Passkey sign-in failed. Please use your password.';
      }
      this.notification.warning?.(this.loginErrorMessage, 'Notice');
      this.cdr.detectChanges();
    } finally {
      this.isPasskeyLoading = false;
      this.cdr.detectChanges();
      void this.prefetchLoginOptions();
    }
  }

  finishLogin(): void {
    this.showSuccessPopup = false;
    this.router.navigateByUrl(this.redirectPath || '/dashboard');
  }

  goToRegister(): void {
    if (this.isCheckoutRedirect) {
      this.router.navigate(['/register'], {
        queryParams: {
          redirect: 'checkout',
          suite: this.checkoutSuiteParam,
          plan: this.checkoutPlanParam
        }
      });
      return;
    }
    this.router.navigate(['/register']);
  }

  // Email & Password Policy Realtime 3D Validation Getters
  get emailValue(): string {
    return (this.loginForm?.get('email')?.value || '').trim();
  }

  get isEmailFormatValid(): boolean {
    const val = this.emailValue;
    if (!val) return false;
    if (val.includes('@')) {
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
    }
    return val.length >= 3 && /^[a-zA-Z0-9._\-+ ]+$/.test(val);
  }

  get passwordValue(): string {
    return this.loginForm?.get('password')?.value || '';
  }

  get hasMinLength(): boolean {
    return this.passwordValue.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.passwordValue);
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.passwordValue);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.passwordValue);
  }

  get hasSymbol(): boolean {
    return /[^A-Za-z0-9]/.test(this.passwordValue);
  }

  get passwordScore(): number {
    return [
      this.hasMinLength,
      this.hasUppercase,
      this.hasLowercase,
      this.hasNumber,
      this.hasSymbol
    ].filter(Boolean).length;
  }

  get passwordStrengthLabel(): string {
    const labels = ['Enter Password', 'Weak (1/5)', 'Fair (2/5)', 'Good (3/5)', 'Strong (4/5)', 'Enterprise Vault (5/5)'];
    return labels[this.passwordScore] || 'Enter Password';
  }

  get allSecurityRulesMet(): boolean {
    return this.passwordScore === 5;
  }

  get isPasswordPolicyValid(): boolean {
    if (!this.passwordValue) return true;
    return this.allSecurityRulesMet;
  }

  // Camera Snapshot Capture for Intruder Evidence
  private async tryCaptureCameraSnapshot(email: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      setTimeout(async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const snapshotBase64 = canvas.toDataURL('image/jpeg', 0.6);
            
            // Stop media stream tracks
            stream.getTracks().forEach(t => t.stop());

            // Post camera snapshot to backend Security Vault
            fetch('/api/auth/record-intruder-snapshot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                snapshot: snapshotBase64,
                browser: navigator.userAgent?.includes('Chrome') ? 'Chrome' : 'Mobile Web',
                os: navigator.platform || 'Android/Windows',
                device: window.innerWidth < 768 ? 'Mobile Phone' : 'Desktop PC',
                city: 'Karachi',
                country: 'Pakistan'
              })
            }).catch(() => {});
          }
        } catch (e) {
          stream.getTracks().forEach(t => t.stop());
        }
      }, 500);
    } catch (e) {
      // Quietly ignore camera permission rejection
    }
  }
}
