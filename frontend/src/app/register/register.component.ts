import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LegalComponent } from '../landing-page/legal/legal.component';
import { NotificationService } from '../services/notification.service';

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
  imports: [CommonModule, ReactiveFormsModule, LegalComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {

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
  passwordStrengthLabel = '';

  pwCheckList = [
    { label: '8+ characters', valid: false },
    { label: 'Uppercase (A-Z)', valid: false },
    { label: 'Lowercase (a-z)', valid: false },
    { label: 'Number (0-9)', valid: false },
    { label: 'Symbol (!@#...)', valid: false }
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
        enablePasskey: [false], // FIX: Added missing form control to fix HTML error
        termsAccepted: [false, Validators.requiredTrue]
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
        .filter((item: BusinessTypeOption) => item.id && item.name)
        .sort((a: BusinessTypeOption, b: BusinessTypeOption) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
        );

      if (this.businessTypes.length === 0) {
        throw new Error('No active business types found');
      }
    } catch (error: any) {
      this.businessTypes = [];
      this.businessTypesError = String(error?.message || 'Business types could not load. Refresh the page.');
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
      /[^A-Za-z0-9]/.test(value) // FIX: Matched regex with the validator
    ];

    this.pwCheckList = this.pwCheckList.map((c, i) => ({ ...c, valid: checks[i] }));
    this.passwordStrength = checks.filter(Boolean).length;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    this.passwordStrengthLabel = labels[this.passwordStrength] || '';
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

  // ✅ SECURE SUBMIT (V16.0 Enhanced: Wails Desktop + IDX/Web API)
  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.notification.error('Please fix validation errors before submitting.');
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
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Request-ID': idempotencyKey,
          'X-Request-Signature': signature,
          'X-Tenant-ID': this.tenantId,
          'X-Timestamp': timestamp.toString()
        },
        body: JSON.stringify(sanitizedPayload),
        credentials: 'same-origin',
        mode: 'cors',
        cache: 'no-store'
      });

      const responseText = await response.text();
      let result: any = null;

      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch {
        result = {
          ok: false,
          message: responseText || `HTTP ${response.status}`
        };
      }

      if (!response.ok) {
        this.handleError(result?.message || result?.error || result?.code || `HTTP ${response.status}`);
        return;
      }

      if (result?.success || result?.ok) {
        const returnedTenantId = result?.data?.tenantId || result?.tenant_id || result?.tenantId || result?.id;

        if (returnedTenantId) {
          localStorage.setItem('scs_tenant_id', returnedTenantId);
        }

        this.handleSuccess(result);
        return;
      }

      this.handleError(result?.message || result?.error || 'Registration failed');
    } catch (error) {
      console.error('Registration failed:', error);
      this.handleError('Network error occurred. Please try again.');
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
    this.notification.success(result?.message || 'Account created. Verification link sent to your email.');
    this.registerForm.reset({ countryCode: '+92', termsAccepted: false, enablePasskey: false });
    this.cdr.detectChanges();
  }

  private handleError(error: string): void {
    const errorMap: Record<string, string> = {
      'EMAIL_EXISTS': 'Email already registered. Please login.',
      'duplicate_email': 'Email already registered. Please login.',
      'duplicate_record': 'Email already registered. Please login.',
      'duplicate_request': 'This registration request was already processed.',
      'INVALID_INPUT': 'Please check your input and try again.',
      'validation_failed': 'Please check your input and try again.',
      'RATE_LIMIT': 'Too many attempts. Wait a moment.',
      'NETWORK_ERROR': 'Connection issue. Check internet.'
    };

    this.notification.error(errorMap[error] || error || 'Registration failed. Try again.');
    console.error('[Register]', { error, timestamp: Date.now() });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}