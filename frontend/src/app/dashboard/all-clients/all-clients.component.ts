import {
  Component,
  EventEmitter,
  Input,
  Output
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
  styles: [':host{display:block;width:100%;}']
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

  @Output() previousPage =
    new EventEmitter<void>();

  @Output() nextPage =
    new EventEmitter<void>();

  @Output() pageSelect =
    new EventEmitter<number>();

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
