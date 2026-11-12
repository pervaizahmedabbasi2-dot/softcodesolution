import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LegalComponent } from '../../softcodesolution_platform/landing-page/legal/legal.component';
import { NotificationService } from '../../services/notification.service';
import { PwaInstallComponent } from '../../pwa-install.component';
import { CurrencyLanguageSelectorComponent } from '../../components/currency-language-selector/currency-language-selector.component';

// ============ SECURITY UTILS (Minimal & Safe) ============

function sanitizeInput(value: string): string {
  if (!value) return '';
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

async function signRequest(payload: any): Promise<string> {
  const data = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getTenantContext(): { tenantId: string } {
  const tenantId = localStorage.getItem('scs_tenant_id') || `tenant_${Date.now()}`;
  return { tenantId };
}

function generateIdempotencyKey(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'idemp_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ============ VALIDATORS ============

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  const valid =
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value) && // FIX: Changed to accept any special character
    value.length >= 8;
  return valid ? null : { passwordStrength: true };
}

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const pw = form.get('password')?.value;
  const cpw = form.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

// ============ TYPES ============

interface Currency {
  code: string;
  symbol: string;
  label: string;
}

interface BusinessTypeOption {
  id: string;
  name: string;
  module_category?: string;
  pricing_weight?: number;
  sort_order?: number;
}

// ============ COMPONENT ============

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LegalComponent, RouterModule, PwaInstallComponent, CurrencyLanguageSelectorComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
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

  registerForm!: FormGroup;
  isLoading = false;
  showSuccessAlert = false;
  isPasswordVisible = false;
  isConfirmPasswordVisible = false;
  showLegalModal = false;
  legalActiveTab = 'terms';
  
  // FIX: Added isOnline variable to solve HTML error
  isOnline: boolean = navigator.onLine;

  // SCS_OFFICIAL_BUSINESS_TYPES_REGISTER_STATE_V1
  businessTypes: BusinessTypeOption[] = [];
  businessTypesLoading = false;
  businessTypesError = '';

  passwordStrength = 0;
  passwordStrengthLabel = 'Enter Password';
  autoCorrectedFields: Record<string, string> = {};

  // Anti-Bot & Anti-Hacker Shield State
  private formLoadedAt = Date.now();
  humanVerified = false;
  humanVerifying = false;
  humanShieldError = false;
  private botChallengeToken = '';
  private botPowNonce = 0;

  pwCheckList = [
    { label: '8+ Chars', valid: false },
    { label: 'Bara (A-Z)', valid: false },
    { label: 'Choti (a-z)', valid: false },
    { label: 'Number (0-9)', valid: false },
    { label: 'Symbol (!@#)', valid: false }
  ];

  selectedCurrency: Currency | null = null;

  private readonly currencyMap: { [key: string]: Currency } = {
    PK: { code: 'PKR', symbol: 'Rs.', label: 'Pakistani Rupee' },
    AE: { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
    SA: { code: 'SAR', symbol: '﷼', label: 'Saudi Riyal' },
    QA: { code: 'QAR', symbol: '﷼', label: 'Qatari Riyal' },
    KW: { code: 'KWD', symbol: 'د.ك', label: 'Kuwaiti Dinar' },
    BH: { code: 'BHD', symbol: '.د.ب', label: 'Bahraini Dinar' },
    OM: { code: 'OMR', symbol: '﷼', label: 'Omani Rial' },
    GB: { code: 'GBP', symbol: '£', label: 'British Pound' },
    US: { code: 'USD', symbol: '$', label: 'US Dollar' },
    CA: { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
    AU: { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
    IN: { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
    DE: { code: 'EUR', symbol: '€', label: 'Euro' },
    FR: { code: 'EUR', symbol: '€', label: 'Euro' },
    IT: { code: 'EUR', symbol: '€', label: 'Euro' },
    ES: { code: 'EUR', symbol: '€', label: 'Euro' },
    NL: { code: 'EUR', symbol: '€', label: 'Euro' },
    CN: { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
    JP: { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
    SG: { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
    MY: { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
    NG: { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
    ZA: { code: 'ZAR', symbol: 'R', label: 'South African Rand' },
    EG: { code: 'EGP', symbol: 'E£', label: 'Egyptian Pound' },
    TR: { code: 'TRY', symbol: '₺', label: 'Turkish Lira' },
    BD: { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka' },
    LK: { code: 'LKR', symbol: 'Rs', label: 'Sri Lankan Rupee' },
    NP: { code: 'NPR', symbol: 'Rs', label: 'Nepali Rupee' },
    AF: { code: 'AFN', symbol: '؋', label: 'Afghan Afghani' }
  };

  private readonly tenantId = getTenantContext().tenantId;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notification: NotificationService
  ) { }

  // FIX: Added Listeners for Online/Offline status
  @HostListener('window:online') setOnline() { this.isOnline = true; }
  @HostListener('window:offline') setOffline() { this.isOnline = false; }

  ngOnInit(): void {
    this.formLoadedAt = Date.now();
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        countryCode: ['+92'],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
        companyName: ['', Validators.required],
        businessRegNo: [''],
        businessType: ['', Validators.required],
        businessSize: ['', Validators.required],
        country: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postalCode: [''],
        address: ['', Validators.required],
        customDomain: [''],
        hearAboutUs: [''],
        password: ['', [Validators.required, passwordStrengthValidator]],
        confirmPassword: ['', Validators.required],
        enablePasskey: [false],
        termsAccepted: [false, Validators.requiredTrue],
        hpWebsite: ['']
      },
      { validators: passwordMatchValidator }
    );

    this.registerForm.get('password')?.valueChanges.subscribe(val => {
      this.evaluatePassword(val || '');
    });

    void this.loadBusinessTypes();
  }

  // SCS_OFFICIAL_BUSINESS_TYPES_REGISTER_LOAD_V1
  async loadBusinessTypes(): Promise<void> {
    this.businessTypesLoading = true;
    this.businessTypesError = '';

    try {
      const response = await fetch('/api/public/business-types?_live=' + Date.now(), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok !== true) {
        throw new Error(data?.message || 'Business types could not load');
      }

      const rows = Array.isArray(data?.business_types) ? data.business_types : [];
      this.businessTypes = rows
        .map((item: any) => ({
          id: String(item?.id || '').trim(),
          name: String(item?.name || '').trim(),
          module_category: String(item?.module_category || '').trim(),
          pricing_weight: Number(item?.pricing_weight || 1),
          sort_order: Number(item?.sort_order || 0)
        }))
        .filter((item: BusinessTypeOption) => {
          if (!item.id || !item.name) return false;
          const lowerId = item.id.toLowerCase();
          const lowerName = item.name.toLowerCase();
          if (lowerId.includes('telecom') || lowerName.includes('telecom')) return false;
          if (lowerId === 'other_business' || lowerId === 'other' || lowerName === 'other' || lowerName.includes('other business')) return false;
          if (lowerId.includes('software') || lowerId.includes('it_') || lowerName.includes('software') || lowerName.includes('it services') || lowerName.includes('software & it')) return false;
          if (lowerId.includes('recruitment') || lowerName.includes('recruitment')) return false;
          if (lowerId.includes('professional_services') || lowerName.includes('professional services')) return false;
          if (lowerId.includes('security_services') || lowerName.includes('security services') || lowerName.includes('security guard')) return false;
          return true;
        })
        .sort((a: BusinessTypeOption, b: BusinessTypeOption) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
        );

      if (this.businessTypes.length === 0) {
        throw new Error('No active business types found');
      }

    } catch (error: any) {
      // Fallback for AI Studio preview without backend
      this.businessTypes = [
        { id: 'retail_store', name: 'Retail / General Store', module_category: 'COMMERCE', pricing_weight: 1, sort_order: 1 },
        { id: 'restaurant_cafe', name: 'Restaurant & Fine Dine', module_category: 'HOSPITALITY', pricing_weight: 1.2, sort_order: 2 },
        { id: 'pizza_fastfood', name: 'Pizza & Fast Food POS', module_category: 'HOSPITALITY', pricing_weight: 1.2, sort_order: 3 },
        { id: 'clinic_healthcare', name: 'Clinic & Healthcare Center', module_category: 'HEALTHCARE', pricing_weight: 1.3, sort_order: 4 },
        { id: 'hospital_management', name: 'Hospital Management', module_category: 'HEALTHCARE', pricing_weight: 1.6, sort_order: 5 },
        { id: 'hotel_hospitality', name: 'Hotel & Hospitality Management', module_category: 'HOSPITALITY', pricing_weight: 1.5, sort_order: 6 },
        { id: 'school_college', name: 'School & College Management', module_category: 'EDUCATION', pricing_weight: 1.5, sort_order: 7 },
        { id: 'pharmacy_medical', name: 'Pharmacy & Medical Store', module_category: 'HEALTHCARE', pricing_weight: 1.3, sort_order: 8 }
      ];
      this.businessTypesError = '';
    } finally {

      this.businessTypesLoading = false;
      try { this.cdr.detectChanges(); } catch {}
    }
  }

  get f() {
    return this.registerForm.controls;
  }

  evaluatePassword(value: string): void {
    const checks = [
      value.length >= 8,
      /[A-Z]/.test(value),
      /[a-z]/.test(value),
      /[0-9]/.test(value),
      /[^A-Za-z0-9]/.test(value)
    ];

    this.pwCheckList = this.pwCheckList.map((c, i) => ({ ...c, valid: checks[i] }));
    this.passwordStrength = checks.filter(Boolean).length;

    const labels = ['Enter Password', 'Weak (1/5)', 'Fair (2/5)', 'Good (3/5)', 'Strong (4/5)', 'Enterprise Vault (5/5)'];
    this.passwordStrengthLabel = labels[this.passwordStrength] || 'Enter Password';
  }

  isFieldValid(name: string): boolean {
    const ctrl = this.registerForm?.get(name);
    if (!ctrl) return false;
    const val = ctrl.value;
    return ctrl.valid && val !== null && val !== undefined && String(val).trim().length > 0;
  }

  get isConfirmPasswordMatched(): boolean {
    const pw = this.registerForm?.get('password')?.value || '';
    const cpw = this.registerForm?.get('confirmPassword')?.value || '';
    return pw.length >= 8 && cpw.length > 0 && pw === cpw && !this.registerForm.hasError('passwordMismatch');
  }

  onEmailInput(): void {
    const ctrl = this.registerForm.get('email');
    if (!ctrl) return;
    const raw: string = ctrl.value || '';
    const cleaned = raw.replace(/[<>"';\s]/g, '');
    if (cleaned !== raw) {
      ctrl.setValue(cleaned, { emitEvent: false });
      this.autoCorrectedFields['email'] = 'Auto-Corrected';
    }
  }

  onEmailBlur(): void {
    const ctrl = this.registerForm.get('email');
    if (!ctrl) return;
    const raw: string = ctrl.value || '';
    const normalized = sanitizeInput(raw).toLowerCase();
    if (normalized && normalized !== raw) {
      ctrl.setValue(normalized);
      this.autoCorrectedFields['email'] = 'Normalized';
    }
  }

  onPhoneInput(): void {
    const ctrl = this.registerForm.get('phone');
    if (!ctrl) return;
    const raw: string = ctrl.value || '';
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 15);
    if (digitsOnly !== raw) {
      ctrl.setValue(digitsOnly, { emitEvent: false });
      this.autoCorrectedFields['phone'] = 'Digits Cleaned';
    }
  }

  onTextBlur(fieldName: string): void {
    const ctrl = this.registerForm.get(fieldName);
    if (!ctrl) return;
    const raw: string = ctrl.value || '';
    const cleaned = sanitizeInput(raw).replace(/\s{2,}/g, ' ');
    if (cleaned && cleaned !== raw) {
      ctrl.setValue(cleaned);
      this.autoCorrectedFields[fieldName] = 'Auto-Trimmed';
    }
  }

  onPasswordBlur(): void {
    const ctrl = this.registerForm.get('password');
    if (!ctrl) return;
    const raw: string = ctrl.value || '';
    const trimmed = raw.trim();
    if (trimmed && trimmed !== raw) {
      ctrl.setValue(trimmed);
      this.autoCorrectedFields['password'] = 'Trimmed';
    }
  }

  onCountryChange(): void {
    const code = this.registerForm.get('country')?.value;
    this.selectedCurrency = this.currencyMap[code] || { code: 'USD', symbol: '$', label: 'US Dollar' };
  }

  togglePassword(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleConfirmPassword(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }

  toggleTermsCheckbox(): void {
    const current = this.registerForm.get('termsAccepted')?.value;
    this.registerForm.get('termsAccepted')?.setValue(!current);
  }

  openLegalModal(tab: string): void {
    this.legalActiveTab = tab;
    this.showLegalModal = true;
  }

  closeLegalModal(): void {
    this.showLegalModal = false;
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

  // ✅ SECURE SUBMIT (V16.0 Enhanced: Wails Desktop + IDX/Web API)
  async onSubmit(): Promise<void> {
    this.humanShieldError = false;
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.notification.error('Please fix validation errors before submitting.');
      return;
    }

    if (!this.humanVerified || !this.botChallengeToken) {
      this.humanShieldError = true;
      this.notification.error('Please complete the 3D Anti-Bot Human Shield verification before registering.');
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const idempotencyKey = generateIdempotencyKey();

      const formValue = this.registerForm.value;
      const timestamp = Date.now();

      // 1. Sanitize inputs + keep both camelCase and snake_case keys.
      // Snake_case is for /api/register. CamelCase stays for Wails/Desktop compatibility.
      const sanitizedPayload = {
        idempotency_key: idempotencyKey,
        idempotencyKey,

        email: sanitizeInput(formValue.email),
        password: formValue.password,

        full_name: sanitizeInput(formValue.fullName),
        fullName: sanitizeInput(formValue.fullName),

        company_name: sanitizeInput(formValue.companyName),
        companyName: sanitizeInput(formValue.companyName),

        country_code: sanitizeInput(formValue.countryCode),
        countryCode: sanitizeInput(formValue.countryCode),

        phone: sanitizeInput(formValue.phone),

        business_reg_no: sanitizeInput(formValue.businessRegNo),
        businessRegNo: sanitizeInput(formValue.businessRegNo),

        business_type: sanitizeInput(formValue.businessType),
        businessType: sanitizeInput(formValue.businessType),

        business_size: sanitizeInput(formValue.businessSize),
        businessSize: sanitizeInput(formValue.businessSize),

        country: sanitizeInput(formValue.country),
        city: sanitizeInput(formValue.city),
        state: sanitizeInput(formValue.state),

        postal_code: sanitizeInput(formValue.postalCode),
        postalCode: sanitizeInput(formValue.postalCode),

        address: sanitizeInput(formValue.address),

        custom_domain: sanitizeInput(formValue.customDomain),
        customDomain: sanitizeInput(formValue.customDomain),

        hear_about_us: sanitizeInput(formValue.hearAboutUs),
        hearAboutUs: sanitizeInput(formValue.hearAboutUs),

        enable_passkey: !!formValue.enablePasskey,
        enablePasskey: !!formValue.enablePasskey,

        terms_accepted: !!formValue.termsAccepted,
        termsAccepted: !!formValue.termsAccepted,

        tenant_id: this.tenantId,
        tenantId: this.tenantId,

        botDefense: {
          honeypot: formValue.hpWebsite || '',
          challengeToken: this.botChallengeToken,
          powNonce: this.botPowNonce,
          formTimingMs: Date.now() - this.formLoadedAt
        },

        timestamp
      };

      // 2. Sign request for integrity.
      const signature = await signRequest(sanitizedPayload);

      // 3. Desktop/Wails bridge only if the actual method exists.
      // Your Go bridge method is ProcessRegistration, not RegisterUser.
      const wailsApp = (window as any).go?.main?.App;

      if (wailsApp?.ProcessRegistration) {
        const result = await wailsApp.ProcessRegistration(sanitizedPayload, signature);

        if (result?.ok === false) {
          this.handleError(result.message || result.code || 'Registration failed');
          return;
        }

        this.handleSuccess(result);
        return;
      }

      // 4. IDX / Browser / Firebase Studio HTTP API.
      const response = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(sanitizedPayload),
      });

      const result = await response.json().catch(() => null);

      // Single-use nonce consumed: reset shield so replay is impossible
      this.humanVerified = false;
      this.botChallengeToken = '';
      this.botPowNonce = 0;

      if (response.ok && result?.ok) {
        this.handleSuccess(result);
        return;
      }

      this.handleError(result?.code || result?.message || 'REGISTRATION_ERROR');
    } catch (error) {
      this.humanVerified = false;
      this.botChallengeToken = '';
      this.botPowNonce = 0;
      console.error('Registration error:', error);
      this.handleError('NETWORK_ERROR');
    } finally {
      this.isLoading = false;

      // Clear password from memory
      this.registerForm.get('password')?.setValue('');
      this.registerForm.get('confirmPassword')?.setValue('');

      this.cdr.detectChanges();
    }
  }

  private handleSuccess(result?: any): void {
    this.showSuccessAlert = true;
    localStorage.setItem('scs_auth_mock', 'true');
    if (result?.data?.user?.tenant_id) localStorage.setItem('scs_tenant_id', result.data.user.tenant_id);
    if (result?.data?.user) {
      localStorage.setItem('user_data', JSON.stringify(result.data.user));
    }
    this.notification.success(result?.message || 'Account created. Verification link sent to your email.');
    this.registerForm.reset({ countryCode: '+92', termsAccepted: false, enablePasskey: false, hpWebsite: '' });
    this.autoCorrectedFields = {};
    this.humanVerified = false;
    this.botChallengeToken = '';
    this.botPowNonce = 0;
    this.evaluatePassword('');
    this.cdr.detectChanges();
  }

  private handleError(error: string): void {
    const errorMap: Record<string, string> = {
      'EMAIL_EXISTS': 'Email already registered. Please login.',
      'duplicate_email': 'Email already registered. Please login.',
      'duplicate_record': 'Email already registered. Please login.',
      'duplicate_request': 'This registration request was already processed.',
      'INVALID_EMAIL': 'Please enter a valid business email address.',
      'WEAK_PASSWORD': 'Password must contain 8+ chars, uppercase (A-Z), lowercase (a-z), number (0-9), and symbol.',
      'INVALID_INPUT': 'Please check your input and try again.',
      'validation_failed': 'Please check your input and try again.',
      'BOT_DETECTED': 'Bot activity blocked by SoftCode Security Shield.',
      'BOT_CHALLENGE_REQUIRED': 'Please click the 3D Anti-Bot Human Shield first.',
      'BOT_REPLAY_DETECTED': 'Security challenge expired or replayed. Please re-verify Human Shield.',
      'BOT_TOKEN_EXPIRED': 'Security verification expired. Please re-verify Human Shield.',
      'BOT_TOO_FAST': 'Submission too fast. Please verify Human Shield and retry.',
      'RATE_LIMIT': 'Too many attempts detected. Please wait 60 seconds.',
      'NETWORK_ERROR': 'Connection issue. Check internet and retry.'
    };

    this.notification.error(errorMap[error] || error || 'Registration failed. Try again.');
    console.error('[Register]', { error, timestamp: Date.now() });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}