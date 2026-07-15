import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class BackendService {
  private notification = inject(NotificationService);

  async registerUser(payload: any): Promise<boolean> {
    try {
      const body = this.normalizeRegistrationPayload(payload);

      console.log('[Backend] Sending registration data to /api/register:', body);

      const response = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': this.makeIdempotencyKey(),
        },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('[Backend] Registration failed:', result);
        this.notification.error(result?.message || 'Registration failed');
        return false;
      }

      if (result?.ok === true) {
        this.notification.success?.('Registration submitted successfully');
        return true;
      }

      this.notification.error(result?.message || 'Backend response failed');
      return false;
    } catch (error) {
      console.error('[Backend] Register Error:', error);
      this.notification.error('Connection to backend failed. Please try again.');
      return false;
    }
  }

  async loginUser(email: string, password: string): Promise<any> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': this.makeIdempotencyKey(),
        },
        body: JSON.stringify({ email, password }),
      });

      return await response.json();
    } catch (error) {
      console.error('[Backend] Login Error:', error);
      return null;
    }
  }

  private normalizeRegistrationPayload(payload: any): any {
    return {
      full_name: payload.full_name || payload.fullName || payload.name || '',
      email: payload.email || '',
      country_code: payload.country_code || payload.countryCode || '+92',
      phone: payload.phone || payload.mobile || '',

      company_name: payload.company_name || payload.companyName || '',
      business_reg_no:
        payload.business_reg_no ||
        payload.businessRegNo ||
        payload.businessRegistrationNo ||
        '',
      business_type: payload.business_type || payload.businessType || '',
      business_size: payload.business_size || payload.businessSize || '',

      country: payload.country || '',
      city: payload.city || '',
      state: payload.state || '',
      postal_code: payload.postal_code || payload.postalCode || '',
      address: payload.address || '',

      custom_domain: payload.custom_domain || payload.customDomain || '',
      hear_about_us: payload.hear_about_us || payload.hearAboutUs || '',

      password: payload.password || '',
      terms_accepted:
        payload.terms_accepted === true ||
        payload.termsAccepted === true ||
        payload.terms === true,
    };
  }

  private makeIdempotencyKey(): string {
    return `reg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}