import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  isLoading = false;
  showSuccessPopup = false;
  showLoginError = false;

  // Password visibility
  isPasswordVisible = false;

  // Remember Me
  rememberMe = false;

  // Forgot Password
  showForgotPopup = false;
  showForgotSuccess = false;
  forgotEmail = '';
  forgotEmailError = false;
  forgotLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // ✅ Pre-fill email if Remember Me was used previously
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

  onSubmit(): void {
    this.showLoginError = false;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.isLoading = false;

      // ✅ Remember Me logic
      if (this.rememberMe) {
        localStorage.setItem('scs_remembered_email', this.loginForm.value.email);
      } else {
        localStorage.removeItem('scs_remembered_email');
      }

      // ✅ Simulate auth check — replace with real API call
      const validEmail = 'admin@softcode.com';
      const validPassword = 'Admin@1234';

      if (
        this.loginForm.value.email === validEmail &&
        this.loginForm.value.password === validPassword
      ) {
        this.showSuccessPopup = true;
      } else {
        this.showLoginError = true;
      }

      this.cdr.detectChanges();
    }, 1500);
  }

  finishLogin(): void {
    this.showSuccessPopup = false;
    this.router.navigate(['/dashboard']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // ✅ Forgot Password flow
  onForgotPassword(): void {
    this.forgotEmail = this.loginForm.value.email || '';
    this.forgotEmailError = false;
    this.showForgotPopup = true;
  }

  closeForgotPopup(): void {
    this.showForgotPopup = false;
    this.forgotEmailError = false;
  }

  submitForgotPassword(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.forgotEmail || !emailRegex.test(this.forgotEmail)) {
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
    }, 1500);
  }
}