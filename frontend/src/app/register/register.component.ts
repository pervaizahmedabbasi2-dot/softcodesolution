import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LegalComponent } from '../landing-page/legal/legal.component';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  const valid =
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) &&
    value.length >= 8;
  return valid ? null : { passwordStrength: true };
}

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const pw = form.get('password')?.value;
  const cpw = form.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

interface Currency {
  code: string;
  symbol: string;
  label: string;
}

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

  private currencyMap: { [key: string]: Currency } = {
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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

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
        termsAccepted: [false, Validators.requiredTrue]
      },
      { validators: passwordMatchValidator }
    );

    this.registerForm.get('password')?.valueChanges.subscribe(val => {
      this.evaluatePassword(val || '');
    });
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
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
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

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.isLoading = false;
      this.showSuccessAlert = true;
      this.cdr.detectChanges();
    }, 2500);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}