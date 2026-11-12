import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Building2,
  FileText,
  Wrench,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Maximize2,
  Filter,
  Check,
  X
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';

@Component({
  selector: 'app-dashboard-property-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './property-hub.component.html'
})
export class DashboardPropertyHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Building2,
    FileText,
    Wrench,
    Receipt,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertTriangle,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    DollarSign,
    Maximize2,
    Filter,
    Check,
    X
  };

  activeTab: 'properties' | 'leases' | 'maintenance' | 'ledger' = 'properties';
  isLoading = false;
  searchQuery = '';

  // Data collections
  properties: any[] = [];
  leases: any[] = [];
  maintenanceTickets: any[] = [];
  rentPayments: any[] = [];

  // Modals state
  showAddPropModal = false;
  showAddLeaseModal = false;
  showAddTicketModal = false;
  showCollectRentModal = false;
  actionFeedback = '';

  // Forms
  newProp = {
    title: '',
    type: 'Residential Apartment',
    address: '',
    areaSqFt: 1200,
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 1800,
    salePrice: 320000,
    status: 'AVAILABLE'
  };

  newLease = {
    propertyId: '',
    propertyTitle: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    monthlyRent: 1800,
    depositHeld: 3600,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2027-01-01',
    paymentCycle: 'Monthly'
  };

  newTicket = {
    property: '',
    issue: '',
    priority: 'HIGH',
    reportedBy: '',
    assignedContractor: ''
  };

  newPayment = {
    property: '',
    tenant: '',
    month: 'March 2026',
    amount: 1800
  };

  async ngOnInit(): Promise<void> {
    await this.loadAllData();
  }

  async loadAllData(): Promise<void> {
    this.isLoading = true;
    try {
      const [propsRes, leasesRes, mntRes, payRes] = await Promise.all([
        this.backend.getProperties(),
        this.backend.getPropertyLeases(),
        this.backend.getPropertyMaintenance(),
        this.backend.getPropertyPayments()
      ]);
      this.properties = propsRes.properties || [];
      this.leases = leasesRes.leases || [];
      this.maintenanceTickets = mntRes.tickets || [];
      this.rentPayments = payRes.payments || [];
    } finally {
      this.isLoading = false;
    }
  }

  get filteredProperties() {
    if (!this.searchQuery) return this.properties;
    const q = this.searchQuery.toLowerCase();
    return this.properties.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q)
    );
  }

  get stats() {
    const totalUnits = this.properties.length;
    const occupied = this.properties.filter(p => p.status === 'RENTED').length;
    const available = this.properties.filter(p => p.status === 'AVAILABLE').length;
    const monthlyRev = this.properties.reduce((sum, p) => sum + (p.status === 'RENTED' ? Number(p.monthlyRent || 0) : 0), 0);
    const activeTickets = this.maintenanceTickets.filter(t => t.status !== 'RESOLVED').length;
    return { totalUnits, occupied, available, monthlyRev, activeTickets };
  }

  async submitNewProperty(): Promise<void> {
    if (!this.newProp.title) return;
    this.isLoading = true;
    try {
      const res = await this.backend.addProperty(this.newProp);
      if (res.ok && res.product || res.property) {
        this.properties.unshift(res.property);
      } else {
        await this.loadAllData();
      }
      this.showAddPropModal = false;
      this.triggerFeedback('Property successfully registered in directory!');
      this.newProp = {
        title: '',
        type: 'Residential Apartment',
        address: '',
        areaSqFt: 1200,
        bedrooms: 2,
        bathrooms: 2,
        monthlyRent: 1800,
        salePrice: 320000,
        status: 'AVAILABLE'
      };
    } finally {
      this.isLoading = false;
    }
  }

  async submitNewLease(): Promise<void> {
    if (!this.newLease.tenantName || !this.newLease.propertyTitle) return;
    this.isLoading = true;
    try {
      const res = await this.backend.addPropertyLease(this.newLease);
      if (res.ok && res.lease) {
        this.leases.unshift(res.lease);
      } else {
        await this.loadAllData();
      }
      this.showAddLeaseModal = false;
      this.triggerFeedback('Lease agreement issued & signed!');
      this.newLease = {
        propertyId: '',
        propertyTitle: '',
        tenantName: '',
        tenantEmail: '',
        tenantPhone: '',
        monthlyRent: 1800,
        depositHeld: 3600,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2027-01-01',
        paymentCycle: 'Monthly'
      };
    } finally {
      this.isLoading = false;
    }
  }

  async submitNewTicket(): Promise<void> {
    if (!this.newTicket.property || !this.newTicket.issue) return;
    this.isLoading = true;
    try {
      const res = await this.backend.addPropertyMaintenance(this.newTicket);
      if (res.ok && res.ticket) {
        this.maintenanceTickets.unshift(res.ticket);
      } else {
        await this.loadAllData();
      }
      this.showAddTicketModal = false;
      this.triggerFeedback('Maintenance work order dispatched!');
      this.newTicket = {
        property: '',
        issue: '',
        priority: 'HIGH',
        reportedBy: '',
        assignedContractor: ''
      };
    } finally {
      this.isLoading = false;
    }
  }

  async toggleTicketStatus(ticket: any): Promise<void> {
    const nextStatus = ticket.status === 'OPEN' ? 'IN_PROGRESS' : (ticket.status === 'IN_PROGRESS' ? 'RESOLVED' : 'OPEN');
    ticket.status = nextStatus;
    await this.backend.updatePropertyMaintenanceStatus(ticket.id, nextStatus);
    this.triggerFeedback(`Ticket #${ticket.ticketNo} marked as ${nextStatus}`);
  }

  async submitPayment(): Promise<void> {
    if (!this.newPayment.property || !this.newPayment.tenant) return;
    this.isLoading = true;
    try {
      const res = await this.backend.recordPropertyPayment(this.newPayment);
      if (res.ok && res.payment) {
        this.rentPayments.unshift(res.payment);
      } else {
        await this.loadAllData();
      }
      this.showCollectRentModal = false;
      this.triggerFeedback('Rent payment recorded & digital voucher stamped!');
    } finally {
      this.isLoading = false;
    }
  }

  private triggerFeedback(msg: string): void {
    this.actionFeedback = msg;
    setTimeout(() => {
      if (this.actionFeedback === msg) this.actionFeedback = '';
    }, 3500);
  }
}
