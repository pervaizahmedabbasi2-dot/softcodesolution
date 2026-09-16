import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { PwaInstallComponent } from '../pwa-install.component';
import { LegalComponent } from '../landing-page/legal/legal.component';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, PwaInstallComponent, LegalComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  isMenuOpen: boolean = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.detectChanges();
  }

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notification = inject(NotificationService);

  loginForm!: FormGroup;
  isLoading = false;
  showSuccessPopup = false;
  showLoginError = false;
  isPasswordVisible = false;
  rememberMe = false;

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
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    const savedEmail = localStorage.getItem('scs_remembered_email');
    if (savedEmail) {
      this.loginForm.get('email')?.setValue(savedEmail);
      this.rememberMe = true;
    }
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

    const sanitizedEmail = sanitizeInput(this.loginForm.value.email || '').toLowerCase();
    const password = this.loginForm.value.password || '';

    try {
      // Mocking the backend login for superadmin since we don't have a backend running yet
      if (sanitizedEmail === 'superadmin@softcodesolution.local' && password === 'SuperStrongPass123!') {
        setTimeout(() => {
          this.isLoading = false;
          if (this.rememberMe) {
            localStorage.setItem('scs_remembered_email', sanitizedEmail);
          } else {
            localStorage.removeItem('scs_remembered_email');
          }
          localStorage.setItem('scs_auth_mock', 'true');
          this.redirectPath = '/dashboard';
          this.showSuccessPopup = true;
          this.cdr.detectChanges();
        }, 1000);
        return;
      }

      // Preview & Development Authentication Handler
      const isOk = true;
      const result: any = { 
        ok: true, 
        data: { 
          user: { 
            id: 'scs-usr-' + Date.now().toString(36), 
            email: sanitizedEmail, 
            role: sanitizedEmail.includes('admin') ? 'super_admin' : 'client_admin',
            full_name: sanitizedEmail.split('@')[0].replace('.', ' ').toUpperCase()
          },
          token: 'scs-session-token-' + Date.now()
        } 
      };
      
      if (isOk) {
        if (this.rememberMe) {
          localStorage.setItem('scs_remembered_email', sanitizedEmail);
        } else {
          localStorage.removeItem('scs_remembered_email');
        }

        // Set auth session mock so authGuard allows entering dashboard
        localStorage.setItem('scs_auth_mock', 'true');
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user_data', JSON.stringify(result.data.user));
        localStorage.setItem('scs_tenant_id', 'tenant_enterprise_01');

        this.redirectPath = typeof result.redirect === 'string' ? result.redirect : '/dashboard';
        this.showSuccessPopup = true;
      } else {
        this.showLoginError = true;
        this.notification.error(result.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      this.showLoginError = true;
      this.notification.error('Network error. Please check connection.');
    } finally {
      this.isLoading = false;
      this.loginForm.get('password')?.setValue('');
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
}
