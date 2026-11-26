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
  X,
  Printer
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';
import { HardwareDeviceService } from '../../../shared/hardware/hardware-device.service';

@Component({
  selector: 'app-dashboard-restaurant-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './restaurant-hub.component.html'
})
export class DashboardRestaurantHubComponent implements OnInit {
  private backend = inject(BackendService);
  readonly hardware = inject(HardwareDeviceService);

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
    X,
    Printer
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
        if (status === 'BILL_PRINTED') {
          await this.printTableCustomerBill(this.selectedTable);
        }
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

  async printKotTicket(ticket: any): Promise<void> {
    if (!ticket) return;
    await this.hardware.printKotTicket({
      businessName: 'SOFTCODE RESTAURANT & CAFE',
      ticketNo: ticket.ticketNo || 'KOT-101',
      tableOrOrder: ticket.table || 'Dining Table',
      station: 'Main Hot Kitchen',
      waiterOrCashier: ticket.waiter || 'Floor Server',
      orderType: 'DINE-IN',
      priority: ticket.status === 'NEW' ? 'RUSH' : 'NORMAL',
      timestampLabel: ticket.timeAgo ? `${ticket.timeAgo} · ${new Date().toLocaleTimeString()}` : new Date().toLocaleTimeString(),
      items: (ticket.items || []).map((i: any) => ({
        name: i.name,
        qty: Number(i.qty || 1),
        notes: i.notes
      })),
      footerNote: 'Verify allergen / spice notes before plating.'
    });
    this.actionMessage = `Sent ${this.hardware.paperWidth()} KOT ${ticket.ticketNo} to kitchen printer.`;
    setTimeout(() => (this.actionMessage = ''), 3000);
  }

  async printTableKot(table: any): Promise<void> {
    if (!table) return;
    const matchingTicket = this.kdsTickets.find((k) =>
      String(k.table || '').toLowerCase().includes(String(table.name || '').toLowerCase())
    );
    await this.hardware.printKotTicket({
      businessName: 'SOFTCODE RESTAURANT & CAFE',
      ticketNo: matchingTicket?.ticketNo || `KOT-${table.name}`,
      tableOrOrder: `${table.name} (${table.zone})`,
      station: 'Kitchen & Grill',
      waiterOrCashier: table.waiter || 'Assigned Server',
      orderType: `DINE-IN · ${table.guests || this.guestCount} Guests`,
      timestampLabel: new Date().toLocaleTimeString(),
      items: matchingTicket?.items || [
        { name: 'Active Table Running Order', qty: 1, notes: `Guests: ${table.guests || this.guestCount}` }
      ],
      footerNote: 'KITCHEN ORDER TICKET — INTERNAL USE ONLY'
    });
    this.actionMessage = `KOT printed for ${table.name}`;
    setTimeout(() => (this.actionMessage = ''), 3000);
  }

  async printTableCustomerBill(table: any): Promise<void> {
    if (!table) return;
    const total = Number(table.orderTotal || 35);
    await this.hardware.printPosReceipt({
      businessName: 'SOFTCODE RESTAURANT & CAFE',
      branchName: table.zone || 'Main Dining',
      receiptTitle: 'GUEST CHECK / CUSTOMER BILL',
      receiptNo: `CHK-${String(table.name || 'TBL').replace(/\s+/g, '')}`,
      customerName: `${table.name} (${table.guests || this.guestCount} Guests)`,
      cashierName: table.waiter || 'Table Server',
      paymentMethod: 'Table Check / Pay at Counter',
      currency: 'USD',
      items: [
        { name: `${table.name} Dining Course`, qty: 1, unitPrice: total }
      ],
      subtotal: total,
      discount: 0,
      tax: 0,
      total,
      timestampLabel: new Date().toLocaleString(),
      barcodeValue: `CHK-${table.id || table.name}`,
      qrPayload: `RESTAURANT|${table.name}|${total.toFixed(2)}`,
      footerNote: 'Thank you for dining with us! Gratuity not included.'
    });
    this.actionMessage = `Printed ${this.hardware.paperWidth()} Customer Bill for ${table.name}`;
    setTimeout(() => (this.actionMessage = ''), 3000);
  }
}
