import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Copy, MoreVertical, Key, CheckCircle2, Clock, XCircle, Search, Plus, Download, Check, X, Shield } from 'lucide-angular';

interface License {
  id: string;
  keyMasked: string;
  client: string;
  product: string;
  type: 'saas' | 'on-premise' | 'trial';
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  domains: string[];
  issuedAt: string;
  expiresAt: string;
}

@Component({
  selector: 'app-dashboard-license',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './license.component.html',
  styles: [':host { display: block; width: 100%; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLicenseComponent implements OnInit {
  @Input() activeView = '';
  @Input() icons: any = {};
  @Output() navigate = new EventEmitter<string>();

  searchQuery = '';
  filterStatus = 'all';
  copiedId: string | null = null;

  isGenerateModalOpen = false;
  newClientName = '';
  newProduct = 'Enterprise Suite';
  newType: 'saas' | 'on-premise' | 'trial' = 'saas';
  generatedKey = '';
  generatedNotice = '';

  licenses: License[] = [
    { id: 'LIC-901', keyMasked: 'XXXX-XXXX-XXXX-1234', client: 'Islamabad Tech Corp', product: 'Enterprise Suite', type: 'saas', status: 'active', domains: ['islamabadtech.com'], issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
    { id: 'LIC-902', keyMasked: 'XXXX-XXXX-XXXX-5678', client: 'Lahore Digital Studio', product: 'Pro Edition', type: 'on-premise', status: 'active', domains: ['lahoredigital.pk'], issuedAt: '2025-06-15', expiresAt: '2026-06-15' },
    { id: 'LIC-903', keyMasked: 'XXXX-XXXX-XXXX-9012', client: 'Karachi Solutions', product: 'Enterprise Suite', type: 'saas', status: 'expired', domains: ['karachisolutions.com', 'ks-app.net'], issuedAt: '2025-01-01', expiresAt: '2026-01-01' },
    { id: 'LIC-904', keyMasked: 'XXXX-XXXX-XXXX-3456', client: 'Rawalpindi Systems', product: 'Starter Pack', type: 'trial', status: 'active', domains: ['rawalpindisystems.com'], issuedAt: '2026-07-20', expiresAt: '2026-08-20' },
    { id: 'LIC-905', keyMasked: 'XXXX-XXXX-XXXX-7890', client: 'Multan Enterprises', product: 'Pro Edition', type: 'saas', status: 'revoked', domains: ['multanent.com'], issuedAt: '2026-03-10', expiresAt: '2027-03-10' },
  ];

  filteredLicenses: License[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateFilteredLicenses();
  }

  openGenerateModal(): void {
    this.isGenerateModalOpen = true;
    this.newClientName = '';
    this.generatedKey = '';
    this.generatedNotice = '';
    this.cdr.markForCheck();
  }

  closeGenerateModal(): void {
    this.isGenerateModalOpen = false;
    this.cdr.markForCheck();
  }

  createCryptographicKey(): void {
    if (!this.newClientName.trim()) return;
    const randHex = () => Math.random().toString(16).substring(2, 6).toUpperCase();
    const key = `SCS-${randHex()}-${randHex()}-${randHex()}-${randHex()}`;
    const nextId = `LIC-${900 + this.licenses.length + 1}`;
    
    const now = new Date();
    const exp = new Date(now.getTime() + 365 * 24 * 3600 * 1000);

    const newLic: License = {
      id: nextId,
      keyMasked: `XXXX-XXXX-XXXX-${key.slice(-4)}`,
      client: this.newClientName.trim(),
      product: this.newProduct,
      type: this.newType,
      status: 'active',
      domains: [`${this.newClientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`],
      issuedAt: now.toISOString().slice(0, 10),
      expiresAt: exp.toISOString().slice(0, 10)
    };

    this.licenses.unshift(newLic);
    this.updateFilteredLicenses();
    this.generatedKey = key;
    this.generatedNotice = `License ${nextId} provisioned for ${newLic.client}.`;
    this.cdr.markForCheck();
  }

  downloadLicenseFile(): void {
    if (!this.generatedKey) return;
    const content = `SOFT CODE SOLUTION ENTERPRISE LICENSE
=======================================
License ID: LIC-${900 + this.licenses.length}
Client: ${this.newClientName || 'Client Tenant'}
Product: ${this.newProduct}
Key: ${this.generatedKey}
Algorithm: Ed25519 Hardware Signature
Status: ACTIVE
=======================================
Do not distribute this private license key file.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `softcode-license-${this.generatedKey.slice(-4)}.key`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  updateFilteredLicenses(): void {
    let filtered = [...this.licenses];
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(l => l.status === this.filterStatus);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(l =>
        l.client.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.product.toLowerCase().includes(q)
      );
    }
    this.filteredLicenses = filtered;
    this.cdr.markForCheck();
  }

  get activeCount(): number { return this.licenses.filter(l => l.status === 'active').length; }
  get expiredCount(): number { return this.licenses.filter(l => l.status === 'expired').length; }
  get revokedCount(): number { return this.licenses.filter(l => l.status === 'revoked' || l.status === 'suspended').length; }

  setSearch(v: string): void {
    this.searchQuery = v;
    this.updateFilteredLicenses();
  }

  setFilter(v: string): void {
    this.filterStatus = v;
    this.updateFilteredLicenses();
  }

  trackByLicId(index: number, lic: License): string {
    return lic.id;
  }

  copyKey(lic: License): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lic.keyMasked).catch(() => {});
    }
    this.copiedId = lic.id;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copiedId = null;
      this.cdr.markForCheck();
    }, 1500);
  }

  navigateTo(view: string): void {
    this.navigate.emit(view);
  }
}