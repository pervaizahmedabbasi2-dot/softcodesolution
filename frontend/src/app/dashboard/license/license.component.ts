import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

interface License { id: string; keyMasked: string; client: string; product: string; type: 'saas' | 'on-premise' | 'trial'; status: 'active' | 'expired' | 'revoked' | 'suspended'; domains: string[]; issuedAt: string; expiresAt: string; }

@Component({ selector: 'app-dashboard-license', standalone: true, imports: [CommonModule, LucideAngularModule], templateUrl: './license.component.html', styles: [':host { display: block; width: 100%; }'] })
export class DashboardLicenseComponent {
  @Input() activeView = '';
  @Input() icons: any = {};
  @Output() navigate = new EventEmitter<string>();
  searchQuery = '';
  filterStatus = 'all';

  licenses: License[] = [
    { id: 'LIC-901', keyMasked: 'XXXX-XXXX-XXXX-1234', client: 'Islamabad Tech Corp', product: 'Enterprise Suite', type: 'saas', status: 'active', domains: ['islamabadtech.com'], issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
    { id: 'LIC-902', keyMasked: 'XXXX-XXXX-XXXX-5678', client: 'Lahore Digital Studio', product: 'Pro Edition', type: 'on-premise', status: 'active', domains: ['lahoredigital.pk'], issuedAt: '2025-06-15', expiresAt: '2026-06-15' },
    { id: 'LIC-903', keyMasked: 'XXXX-XXXX-XXXX-9012', client: 'Karachi Solutions', product: 'Enterprise Suite', type: 'saas', status: 'expired', domains: ['karachisolutions.com', 'ks-app.net'], issuedAt: '2025-01-01', expiresAt: '2026-01-01' },
    { id: 'LIC-904', keyMasked: 'XXXX-XXXX-XXXX-3456', client: 'Rawalpindi Systems', product: 'Starter Pack', type: 'trial', status: 'active', domains: ['rawalpindisystems.com'], issuedAt: '2026-07-20', expiresAt: '2026-08-20' },
    { id: 'LIC-905', keyMasked: 'XXXX-XXXX-XXXX-7890', client: 'Multan Enterprises', product: 'Pro Edition', type: 'saas', status: 'revoked', domains: ['multanent.com'], issuedAt: '2026-03-10', expiresAt: '2027-03-10' },
  ];

  get filteredLicenses(): License[] {
    let filtered = this.licenses;
    if (this.filterStatus !== 'all') { filtered = filtered.filter(l => l.status === this.filterStatus); }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(l => l.client.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.product.toLowerCase().includes(q));
    }
    return filtered;
  }

  get activeCount(): number { return this.licenses.filter(l => l.status === 'active').length; }
  get expiredCount(): number { return this.licenses.filter(l => l.status === 'expired').length; }
  get revokedCount(): number { return this.licenses.filter(l => l.status === 'revoked' || l.status === 'suspended').length; }

  setSearch(v: string): void { this.searchQuery = v; }
  setFilter(v: string): void { this.filterStatus = v; }
  navigateTo(view: string): void { this.navigate.emit(view); }
}