import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { BackendService } from '../services/backend.service';
import { PwaInstallComponent } from '../pwa-install.component';
import { LegalComponent } from '../landing-page/legal/legal.component';
import { CurrencyLanguageSelectorComponent } from '../components/currency-language-selector/currency-language-selector.component';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, PwaInstallComponent, LegalComponent, CurrencyLanguageSelectorComponent],
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
  showSuccessPopup = false;
  showLoginError = false;
  isPasswordVisible = false;
  rememberMe = true;

  // Multi-Portal Gateway Selection
  portalType: 'owner' | 'teacher' | 'student' | 'parent' | 'staff' = 'owner';

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

  ngOnInit(): void {
    const savedEmail = localStorage.getItem('scs_remembered_email');
    this.loginForm = this.fb.group({
      email: [savedEmail || '', [Validators.required]],
      password: ['', [Validators.required]]
    });

    // Smart Gateway: Check if redirected from a specific portal link (e.g. /login?portal=student)
    this.route.queryParams.subscribe(params => {
      const p = (params['portal'] || params['role'] || '').toLowerCase();
      if (p.includes('student')) {
        this.selectPortal('student');
      } else if (p.includes('parent') || p.includes('family')) {
        this.selectPortal('parent');
      } else if (p.includes('teacher') || p.includes('faculty')) {
        this.selectPortal('teacher');
      } else if (p.includes('staff') || p.includes('worker')) {
        this.selectPortal('staff');
      } else if (p.includes('owner') || p.includes('admin')) {
        this.selectPortal('owner');
      }
    });
  }

  selectPortal(type: 'owner' | 'teacher' | 'student' | 'parent' | 'staff'): void {
    this.portalType = type;
    this.showLoginError = false;
    this.cdr.detectChanges();
  }

  quickFillDemo(type: 'owner' | 'teacher' | 'student' | 'parent'): void {
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
    } else if (type === 'teacher') {
      this.loginForm.patchValue({
        email: 'farhan@school.edu',
        password: 'Teacher#2026!'
      });
    } else {
      this.loginForm.patchValue({
        email: 'owner@school.edu',
        password: 'AdminPassword2026!'
      });
    }
    this.cdr.detectChanges();
  }

  togglePassword(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleRememberMe(): void {
    this.rememberMe = !this.rememberMe;
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

  async onSubmit(): Promise<void> {
    this.showLoginError = false;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const rawInput = (this.loginForm.value.email || '').trim();
    const sanitizedEmail = sanitizeInput(rawInput).toLowerCase().trim();
    const password = this.loginForm.value.password || '';

    // Smart Role Determination (Portal users registry lookup first)
    let targetPortal: 'owner' | 'teacher' | 'student' | 'parent' | 'staff' = this.portalType;
    let matchedPortalUser: any = null;

    try {
      let storedUsersRaw = localStorage.getItem('scs_school_portal_users_v1');
      if (!storedUsersRaw) {
        const initialUsers = [
          { id: 'TCH-001', name: 'Prof. Tariq Mehmood', role: 'teacher', email: 'tariq.math@school.edu', linkedEntity: 'Grade 10-A (Mathematics)', status: 'Active', pin: '1001', lastLogin: 'Never' },
          { id: 'TCH-002', name: 'Ms. Sarah Jenkins', role: 'teacher', email: 'sarah.eng@school.edu', linkedEntity: 'Grade 10-B (English)', status: 'Active', pin: '1002', lastLogin: 'Never' },
          { id: 'ST-1001', name: 'Zayan Ahmed Khan', role: 'student', email: 'zayan.1001@student.edu', linkedEntity: 'Grade 10-A (Roll #1001)', status: 'Active', pin: '8821', lastLogin: 'Never' },
          { id: 'ST-1002', name: 'Amna Salman Khan', role: 'student', email: 'amna.1102@student.edu', linkedEntity: 'Grade 11-C (Roll #1102)', status: 'Active', pin: '8824', lastLogin: 'Never' },
          { id: 'PAR-001', name: 'Tariq Ahmed Khan (Guardian)', role: 'parent', email: 'tariq.parent@guardian.com', linkedEntity: 'Zayan Ahmed Khan (ST-1001)', status: 'Active', pin: '4041', lastLogin: 'Never' },
          { id: 'PAR-002', name: 'Dr. Salman Khan (Guardian)', role: 'parent', email: 'salman.parent@guardian.com', linkedEntity: 'Amna Salman Khan (ST-1002)', status: 'Active', pin: '4042', lastLogin: 'Never' }
        ];
        localStorage.setItem('scs_school_portal_users_v1', JSON.stringify(initialUsers));
        storedUsersRaw = JSON.stringify(initialUsers);
      }
      if (storedUsersRaw) {
        const storedUsers = JSON.parse(storedUsersRaw);
        if (Array.isArray(storedUsers)) {
          const inputLower = sanitizedEmail;
          matchedPortalUser = storedUsers.find((u: any) => {
            const uEmail = (u.email || '').toLowerCase().trim();
            const uId = (u.id || '').toLowerCase().trim();
            const uName = (u.name || '').toLowerCase().trim();
            const uPin = (u.pin || '').trim();
            return (
              (uEmail && uEmail === inputLower) ||
              (uId && uId === inputLower) ||
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
        this.notification.error?.('Portal Access Suspended: Please contact school administration.');
        this.cdr.detectChanges();
        return;
      }
      targetPortal = matchedPortalUser.role;
      try {
        const storedUsersRaw = localStorage.getItem('scs_school_portal_users_v1');
        if (storedUsersRaw) {
          const storedUsers = JSON.parse(storedUsersRaw);
          const idx = storedUsers.findIndex((u: any) => u.id === matchedPortalUser.id);
          if (idx !== -1) {
            storedUsers[idx].lastLogin = 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem('scs_school_portal_users_v1', JSON.stringify(storedUsers));
          }
        }
      } catch {}
      localStorage.setItem('activeSchoolPortalUser', JSON.stringify(matchedPortalUser));
    } else {
      if (sanitizedEmail.includes('owner') || sanitizedEmail.includes('principal') || sanitizedEmail.includes('headmaster') || sanitizedEmail.includes('admin@school')) {
        targetPortal = 'owner';
      } else if (sanitizedEmail.startsWith('sch-') || sanitizedEmail.endsWith('.sch') || sanitizedEmail.includes('std-') || sanitizedEmail.includes('student') || sanitizedEmail.includes('zayan') || sanitizedEmail.includes('amna') || /^\d{4,6}$/.test(sanitizedEmail)) {
        targetPortal = 'student';
      } else if (sanitizedEmail.startsWith('+92') || sanitizedEmail.startsWith('03') || /^\d{10,12}$/.test(sanitizedEmail.replace(/\D/g, '')) || sanitizedEmail.includes('parent') || sanitizedEmail.includes('guardian')) {
        targetPortal = 'parent';
      } else if (sanitizedEmail.includes('farhan') || sanitizedEmail.includes('teacher') || sanitizedEmail.includes('saima') || sanitizedEmail.includes('faculty') || sanitizedEmail.includes('prof') || sanitizedEmail.includes('tariq.math') || sanitizedEmail.includes('sarah.eng')) {
        targetPortal = 'teacher';
      }
    }

    // Configure role-based routing target
    if (targetPortal === 'student') {
      localStorage.setItem('activeSchoolPortal', 'student-portal');
      localStorage.setItem('activeSchoolRole', 'student');
      localStorage.setItem('activeSchoolTargetStudent', matchedPortalUser?.id || rawInput);
    } else if (targetPortal === 'parent') {
      localStorage.setItem('activeSchoolPortal', 'parent-portal');
      localStorage.setItem('activeSchoolRole', 'parent');
      localStorage.setItem('activeSchoolTargetParent', matchedPortalUser?.id || rawInput);
    } else if (targetPortal === 'teacher') {
      localStorage.setItem('activeSchoolPortal', 'teacher-portal');
      localStorage.setItem('activeSchoolRole', 'teacher');
      localStorage.setItem('activeSchoolTargetTeacher', matchedPortalUser?.id || rawInput);
    } else if (targetPortal === 'staff') {
      localStorage.setItem('activeSchoolPortal', 'attendance');
      localStorage.setItem('activeSchoolRole', 'staff');
    } else {
      localStorage.setItem('activeSchoolPortal', 'overview');
      localStorage.setItem('activeSchoolRole', 'owner');
    }

    try {
      const clientMeta = {
        browser: window.navigator?.userAgent?.includes('Chrome') ? 'Google Chrome' : 'Mobile Web',
        os: window.navigator?.platform || 'Android/Windows',
        device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile Device' : 'Desktop Workstation',
        city: 'Karachi',
        country: 'Pakistan'
      };

      const result = await this.backendService.loginUser(sanitizedEmail, password, clientMeta);

      if (!result || !result.ok) {
        this.showLoginError = true;
        this.isLoading = false;
        const errMsg = result?.message || 'Invalid Email or Password. Access Denied.';
        this.notification.error?.(errMsg);
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
      }
      
      const isSuperAdminRole = result.user?.role === 'super_admin' || result.redirect === '/superadmin';
      const targetUrl = isSuperAdminRole ? '/superadmin' : '/dashboard';
      
      this.notification.success?.(`Welcome back, ${result.user?.full_name || result.user?.company_name || 'User'}! Access granted.`);
      this.isLoading = false;
      this.cdr.detectChanges();

      await this.router.navigateByUrl(targetUrl);
    } catch (error: any) {
      this.showLoginError = true;
      this.isLoading = false;
      this.notification.error?.('Login failed: Invalid credentials or account locked.');
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

  finishLogin(): void {
    this.showSuccessPopup = false;
    this.router.navigateByUrl(this.redirectPath || '/dashboard');
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Password Policy Realtime Strength Validation Getters
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
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.passwordValue);
  }

  get isPasswordPolicyValid(): boolean {
    if (!this.passwordValue) return true;
    return this.hasMinLength && this.hasUppercase && this.hasLowercase && this.hasNumber && this.hasSymbol;
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
