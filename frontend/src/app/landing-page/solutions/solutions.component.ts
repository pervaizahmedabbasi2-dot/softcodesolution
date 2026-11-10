<<<<<<< HEAD
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LocalizationService } from '../../services/localization.service';

@Component({
  selector: 'app-solutions',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './solutions.component.html',
  styleUrls: []
})
export class SolutionsComponent {
  private router = inject(Router);
  readonly loc = inject(LocalizationService);

  selectedSuite: 'school' | 'business' | null = null;
  activeTab: string = 'overview';

  readonly schoolSuite = {
    id: 'school',
    title: 'School & Campus Management',
    tagline: 'Next-Gen Campus LMS & Student Information System (SIS)',
    badge: 'Education Flagship',
    price: 'RS 12,000',
    description: 'A complete institutional ecosystem managing admissions from Nursery to Class 10+, 1-Link bank challan billing, RFID gate turnstiles, live WebRTC classes, and automated GPA gradebooks.',
    kpis: [
      { label: 'Campuses Powered', value: '50+', sub: 'Nationwide & Regional' },
      { label: 'Bank Fee SLA', value: '99.98%', sub: '1-Link Online Gateways' },
      { label: 'RFID Gate Sync', value: 'Sub-Second', sub: 'Instant Parent SMS Alerts' }
    ],
    features: [
      { icon: 'account_balance', title: '1-Link Bank Fee Challan', desc: 'Instant barcode bank slips and online mobile wallet collection.' },
      { icon: 'fingerprint', title: 'Biometric RFID Attendance', desc: 'Turnstile gate integration with automated absent alerts to parents.' },
      { icon: 'grade', title: 'GPA & Term Report Cards', desc: 'Automated exam compilation, transcript generation, and rank lists.' },
      { icon: 'devices', title: 'Student & Parent Portals', desc: 'Dedicated mobile-ready web apps for syllabus, fees, and grades.' },
      { icon: 'badge', title: 'Faculty HRMS & Payroll', desc: 'Teacher attendance, substitution logs, and salary disbursements.' },
      { icon: 'science', title: 'STEM & Computer Labs', desc: 'Practical lab terminal allocations and innovation inventories.' },
      { icon: 'history_edu', title: 'Formal Certificates (SLC)', desc: 'Official School Leaving, Character, and Transfer Certificates.' },
      { icon: 'video_camera_front', title: 'Live WebRTC Virtual Rooms', desc: 'HD interactive classrooms with cloud lecture archives.' }
    ],
    tabs: [
      { id: 'overview', label: 'Suite Overview' },
      { id: 'challan', label: '1-Link Bank Challans' },
      { id: 'biometric', label: 'RFID Attendance' },
      { id: 'portals', label: 'Portals & LMS' }
    ]
  };

  readonly businessSuite = {
    id: 'business',
    title: 'Business Hub & Enterprise ERP',
    tagline: 'All-in-One Multi-Tenant Operating System with 299+ Modules',
    badge: 'Enterprise Flagship',
    price: 'RS 13,000',
    description: 'Full-spectrum enterprise resource planning covering multi-branch accounting, warehouse supply chains, high-speed POS checkout, HRMS payroll, and dynamic executive analytics.',
    kpis: [
      { label: 'Ready Modules', value: '299+', sub: 'Comprehensive Matrix' },
      { label: 'System Uptime', value: '99.99%', sub: 'Triple-Backup Cloud' },
      { label: 'Multi-Branch Sync', value: 'Real-Time', sub: 'Hybrid Offline Database' }
    ],
    features: [
      { icon: 'account_balance_wallet', title: 'Multi-Branch General Ledger', desc: 'Double-entry bookkeeping, P&L, balance sheets, and audit trails.' },
      { icon: 'point_of_sale', title: 'High-Speed POS Checkout', desc: 'Barcode scanning, thermal receipts, cash drawers, and split payments.' },
      { icon: 'inventory_2', title: 'Warehouse & Stock Control', desc: 'Batch tracking, expiry alerts, transfer orders, and low-stock triggers.' },
      { icon: 'badge', title: 'HRMS & Automated Payroll', desc: 'Biometric employee shifts, deductions, allowances, and pay slips.' },
      { icon: 'receipt_long', title: 'Tax & Invoicing Engine', desc: 'Sales tax, withholding calculations, and professional customer billing.' },
      { icon: 'sync_alt', title: 'Sub-Second Hybrid Sync', desc: 'Work completely offline with automatic background cloud mirroring.' },
      { icon: 'currency_exchange', title: 'Multi-Currency Engine', desc: 'Live exchange rates, localized pricing, and multi-region tax.' },
      { icon: 'insights', title: 'Executive P&L Analytics', desc: 'Real-time sales velocity, revenue forecasts, and expense breakdown.' }
    ],
    tabs: [
      { id: 'overview', label: 'Suite Overview' },
      { id: 'finance', label: 'General Ledger' },
      { id: 'pos', label: 'POS & Inventory' },
      { id: 'hrms', label: 'HRMS & Payroll' }
    ]
  };

  openSuite(type: 'school' | 'business') {
    this.selectedSuite = type;
    this.activeTab = 'overview';
  }

  closeSuite() {
    this.selectedSuite = null;
    this.activeTab = 'overview';
  }

  formatPrice(priceStr: string): string {
    return this.loc.convertStringPrice(priceStr);
  }

  scrollToStore(searchTerm?: string) {
    this.closeSuite();
    const storeEl = document.getElementById('store');
    if (storeEl) {
      storeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
=======
import { Component } from '@angular/core'; // <--- CORE hona chahiye
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-solutions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './solutions.component.html',
    styleUrls: []
})
export class SolutionsComponent { }
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
