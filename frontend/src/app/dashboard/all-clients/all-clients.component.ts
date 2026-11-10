import {
  Component,
  EventEmitter,
  Input,
<<<<<<< HEAD
  Output,
  ChangeDetectionStrategy
=======
  Output
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule
} from 'lucide-angular';

type ClientStatusTab =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'all';

@Component({
  selector: 'app-dashboard-all-clients',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './all-clients.component.html',
<<<<<<< HEAD
  styles: [':host{display:block;width:100%;}'],
  changeDetection: ChangeDetectionStrategy.OnPush
=======
  styles: [':host{display:block;width:100%;}']
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
})
export class DashboardAllClientsComponent {
  // SCS_DASHBOARD_ALL_CLIENTS_COMPONENT_V1

  @Input() activeView = '';
  @Input() userRole = '';
  @Input() lastRefreshedAt: any = null;
  @Input() autoRefreshCountdown = 0;

  @Input() clientTotals: any = {
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0
  };

  @Input() clientStatusTab:
    ClientStatusTab = 'all';

  @Input() actionMessage = '';
  @Input() actionSuccess = true;
  @Input() popupOpen = false;
  @Input() clientSearch = '';

  @Input() isClientsLoading = false;
  @Input() allSuperadminClients: any[] = [];
  @Input() superadminClients: any[] = [];
  @Input() isClientActionBusy = false;

  @Input() clientTotal = 0;
  @Input() clientLimit = 10;
  @Input() clientPage = 1;
  @Input() clientTotalPages = 1;
  @Input() icons: any = {};

  @Input() getInitials:
    (client: any) => string =
      () => '';

  @Output() statusTabChange =
    new EventEmitter<ClientStatusTab>();

  @Output() searchChange =
    new EventEmitter<string>();

  @Output() reloadClients =
    new EventEmitter<void>();

  @Output() clientOpen =
    new EventEmitter<any>();

  @Output() approveClient =
    new EventEmitter<any>();

  @Output() rejectClient =
    new EventEmitter<any>();

<<<<<<< HEAD
  @Output() bulkApprove =
    new EventEmitter<string[]>();

  @Output() bulkSuspend =
    new EventEmitter<string[]>();

=======
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
  @Output() previousPage =
    new EventEmitter<void>();

  @Output() nextPage =
    new EventEmitter<void>();

  @Output() pageSelect =
    new EventEmitter<number>();

<<<<<<< HEAD
  selectedClientIds = new Set<string>();

  isAllSelected(): boolean {
    if (!this.superadminClients || this.superadminClients.length === 0) return false;
    return this.superadminClients.every(c => this.selectedClientIds.has(c.id));
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedClientIds.clear();
    } else {
      this.superadminClients.forEach(c => this.selectedClientIds.add(c.id));
    }
  }

  toggleClientSelect(id: string): void {
    if (this.selectedClientIds.has(id)) {
      this.selectedClientIds.delete(id);
    } else {
      this.selectedClientIds.add(id);
    }
  }

  isClientSelected(id: string): boolean {
    return this.selectedClientIds.has(id);
  }

  getSelectedCount(): number {
    return this.selectedClientIds.size;
  }

  clearSelection(): void {
    this.selectedClientIds.clear();
  }

  requestBulkApprove(): void {
    if (this.selectedClientIds.size === 0) return;
    this.bulkApprove.emit(Array.from(this.selectedClientIds));
    this.clearSelection();
  }

  requestBulkSuspend(): void {
    if (this.selectedClientIds.size === 0) return;
    this.bulkSuspend.emit(Array.from(this.selectedClientIds));
    this.clearSelection();
  }

  exportClientsToCsv(): void {
    const list = this.selectedClientIds.size > 0 
      ? this.allSuperadminClients.filter(c => this.selectedClientIds.has(c.id))
      : this.allSuperadminClients;
    
    if (!list || list.length === 0) return;

    const headers = ['Tenant ID', 'Company Name', 'Full Name', 'Email', 'Phone', 'Business Type', 'City', 'Country', 'Status', 'Created At'];
    const rows = list.map(c => [
      `"${c.tenant_id || c.id || ''}"`,
      `"${(c.company_name || '').replace(/"/g, '""')}"`,
      `"${(c.full_name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${c.country_code || ''} ${c.phone || ''}"`,
      `"${c.business_type || ''}"`,
      `"${c.city || ''}"`,
      `"${c.country || ''}"`,
      `"${c.status || ''}"`,
      `"${c.created_at || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `softcodesolution_clients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportClientsToJson(): void {
    const list = this.selectedClientIds.size > 0 
      ? this.allSuperadminClients.filter(c => this.selectedClientIds.has(c.id))
      : this.allSuperadminClients;

    if (!list || list.length === 0) return;

    const jsonStr = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `softcodesolution_clients_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

=======
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
  changeClientStatusTab(
    tab: string
  ): void {
    const allowed:
      ClientStatusTab[] = [
        'pending',
        'approved',
        'rejected',
        'all'
      ];

    const safeTab =
      allowed.includes(
        tab as ClientStatusTab
      )
        ? tab as ClientStatusTab
        : 'all';

    this.statusTabChange.emit(
      safeTab
    );
  }

  searchClients(value: string): void {
    this.searchChange.emit(
      String(value || '')
    );
  }

  loadSuperadminClients(
    _force = false
  ): void {
    this.reloadClients.emit();
  }

  openClientDetail(client: any): void {
    this.clientOpen.emit(client);
  }

  requestApproveClient(client: any): void {
    this.approveClient.emit(client);
  }

  requestRejectClient(client: any): void {
    this.rejectClient.emit(client);
  }

  previousClientPage(): void {
    this.previousPage.emit();
  }

  nextClientPage(): void {
    this.nextPage.emit();
  }

  applyClientLocalView(): void {
    this.pageSelect.emit(
      Number(this.clientPage || 1)
    );
  }
}
