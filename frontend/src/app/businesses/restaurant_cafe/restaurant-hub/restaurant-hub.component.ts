import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  LayoutGrid,
  UtensilsCrossed,
  ChefHat,
  CreditCard,
  Plus,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Check,
  AlertTriangle,
  X
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';

@Component({
  selector: 'app-dashboard-restaurant-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './restaurant-hub.component.html'
})
export class DashboardRestaurantHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    LayoutGrid,
    UtensilsCrossed,
    ChefHat,
    CreditCard,
    Plus,
    Clock,
    CheckCircle2,
    Users,
    Search,
    Check,
    AlertTriangle,
    X
  };

  activeTab: 'tables' | 'kds' | 'menu' = 'tables';
  isLoading = false;
  selectedZone = 'ALL';
  zones = ['ALL', 'Main Dining', 'Terrace Garden', 'VIP Lounge'];

  tables: any[] = [];
  menuItems: any[] = [];
  kdsTickets: any[] = [];

  // Table action modal
  selectedTable: any = null;
  showTableModal = false;
  guestCount = 2;
  actionMessage = '';

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [tblRes, menuRes, kdsRes] = await Promise.all([
        this.backend.getRestaurantTables(),
        this.backend.getRestaurantMenu(),
        this.backend.getRestaurantKds()
      ]);
      this.tables = tblRes.tables || [];
      this.menuItems = menuRes.menu || [];
      this.kdsTickets = kdsRes.tickets || [];
    } finally {
      this.isLoading = false;
    }
  }

  get filteredTables() {
    if (this.selectedZone === 'ALL') return this.tables;
    return this.tables.filter(t => t.zone === this.selectedZone);
  }

  get stats() {
    const total = this.tables.length;
    const occupied = this.tables.filter(t => t.status === 'OCCUPIED').length;
    const vacant = this.tables.filter(t => t.status === 'VACANT').length;
    const activeKds = this.kdsTickets.filter(t => t.status !== 'SERVED').length;
    return { total, occupied, vacant, activeKds };
  }

  openTableModal(table: any): void {
    this.selectedTable = table;
    this.guestCount = table.guests > 0 ? table.guests : 2;
    this.showTableModal = true;
  }

  async setTableStatus(status: string): Promise<void> {
    if (!this.selectedTable) return;
    this.isLoading = true;
    try {
      const guests = status === 'VACANT' ? 0 : this.guestCount;
      const orderTotal = status === 'VACANT' ? 0 : (this.selectedTable.orderTotal || 35.00);
      const res = await this.backend.updateTableStatus(this.selectedTable.id, status, guests, orderTotal);
      if (res.ok) {
        this.selectedTable.status = status;
        this.selectedTable.guests = guests;
        this.selectedTable.orderTotal = orderTotal;
        this.showTableModal = false;
        this.actionMessage = `Table ${this.selectedTable.name} status updated to ${status}`;
        setTimeout(() => this.actionMessage = '', 3500);
      }
    } finally {
      this.isLoading = false;
    }
  }

  async advanceKdsStatus(ticket: any): Promise<void> {
    const nextStatus = ticket.status === 'NEW' ? 'PREPARING' : (ticket.status === 'PREPARING' ? 'READY' : 'SERVED');
    ticket.status = nextStatus;
    await this.backend.updateKdsStatus(ticket.id, nextStatus);
    this.actionMessage = `Kitchen Ticket ${ticket.ticketNo} marked as ${nextStatus}`;
    setTimeout(() => this.actionMessage = '', 3500);
  }
}
