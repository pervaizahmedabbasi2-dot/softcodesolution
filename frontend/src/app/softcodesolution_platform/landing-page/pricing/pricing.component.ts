import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing.component.html'
})
export class PricingComponent {
  selectedProduct = signal<any>(null);
  products = signal<any[]>([
    {
      icon: '💼',
      name: 'Accounting & Tax System',
      category: 'Professional',
      shortDesc: 'Automated bookkeeping, ledger management, audit compliance, and tax calculation matrix.'
    },
    {
      icon: '🛍️',
      name: 'Retail POS Pro',
      category: 'Commerce',
      shortDesc: 'Omnichannel POS, real-time inventory tracking, barcode scanner support, and supplier billing.'
    },
    {
      icon: '✈️',
      name: 'Travel & Tourism Suite',
      category: 'Hospitality',
      shortDesc: 'Tourist e-visa processing, hotel reservation vouchers, flight package management, and ledger.'
    }
  ]);

  viewDetails(item: any): void {
    this.selectedProduct.set(item);
  }

  backToStore(): void {
    this.selectedProduct.set(null);
  }

  handleBooking(name: string): void {
    const el = document.getElementById('contact-support-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
