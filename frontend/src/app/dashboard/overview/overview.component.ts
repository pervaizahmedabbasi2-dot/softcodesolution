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

type OverviewStatusTab =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'all';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './overview.component.html',
  styles: [':host{display:block;width:100%;}']
})
export class DashboardOverviewComponent {
  // SCS_DASHBOARD_OVERVIEW_COMPONENT_V1

  @Input() activeView = 'home';
  @Input() userRole = '';
  @Input() userName = '';

  @Input() clientTotals: any = {
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0
  };

  @Input() autoRefreshCountdown = 0;
  @Input() categories: any[] = [];
  @Input() icons: any = {};
  @Input() isClientsLoading = false;
  @Input() allSuperadminClients: any[] = [];
  @Input() lastRefreshedAt: any = null;

  @Input() getGreeting:
    () => string =
      () => '';

  @Input() getInitials:
    (client: any) => string =
      () => '';

  @Output() navigate =
    new EventEmitter<string>();

  @Output() statusTabChange =
    new EventEmitter<OverviewStatusTab>();

  @Output() clientOpen =
    new EventEmitter<any>();

  navigateTo(view: string): void {
    this.navigate.emit(view);
  }

  changeClientStatusTab(
    tab: OverviewStatusTab
  ): void {
    this.statusTabChange.emit(tab);
  }

  openClientDetail(client: any): void {
    this.clientOpen.emit(client);
  }
}
