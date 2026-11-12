import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Scissors,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  X,
  Users,
  Calendar,
  Boxes,
  DollarSign,
  Printer,
  Heart
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';

@Component({
  selector: 'app-dashboard-salon-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './salon-hub.component.html'
})
export class DashboardSalonHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Scissors,
    Search,
    Plus,
    CheckCircle2,
    Clock,
    Sparkles,
    User,
    X,
    Users,
    Calendar,
    Boxes,
    DollarSign,
    Printer,
    Heart
  };

  activeTab: 'appointments' | 'services' | 'stylists' | 'packages' | 'products' = 'appointments';
  isLoading = false;
  searchQuery = '';
  actionMessage = '';

  appointments: any[] = [];
  services: any[] = [];
  stylists: any[] = [];
  packages: any[] = [];
  products: any[] = [];

  showBookingModal = false;
  showNewServiceModal = false;
  showInvoiceModal = false;
  selectedInvoice: any = null;

  newAppt = {
    client: '',
    phone: '',
    service: 'Signature Bridal Makeover & Spa',
    stylist: 'Sana Senior Artist',
    chair: 'Station 1 (Bridal Suite)',
    timeSlot: 'Today 03:00 PM',
    price: 65
  };

  newService = {
    name: '',
    category: 'Hair Treatments & Coloring',
    duration: '45 mins',
    price: 35
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const res = await this.backend.getSalonAppointments();
      this.appointments = (res.appointments && res.appointments.length > 0) ? res.appointments : this.defaultAppointments;
    } catch {
      this.appointments = this.defaultAppointments;
    } finally {
      this.services = this.defaultServices;
      this.stylists = this.defaultStylists;
      this.packages = this.defaultPackages;
      this.products = this.defaultProducts;
      this.isLoading = false;
    }
  }

  get stats() {
    const todayBookings = this.appointments.length;
    const completed = this.appointments.filter(a => a.status === 'COMPLETED').length;
    const inChair = this.appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS').length;
    const totalRevenue = this.appointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const totalStylists = this.stylists.length;
    return { todayBookings, completed, inChair, totalRevenue, totalStylists };
  }

  get filteredAppointments() {
    if (!this.searchQuery) return this.appointments;
    const q = this.searchQuery.toLowerCase();
    return this.appointments.filter(a =>
      a.client?.toLowerCase().includes(q) ||
      a.service?.toLowerCase().includes(q) ||
      a.stylist?.toLowerCase().includes(q)
    );
  }

  get filteredServices() {
    if (!this.searchQuery) return this.services;
    const q = this.searchQuery.toLowerCase();
    return this.services.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  }

  async updateStatus(appt: any, status: string): Promise<void> {
    appt.status = status;
    try {
      await this.backend.updateSalonApptStatus(appt.id, status);
    } catch {}
    this.actionMessage = `Appointment for ${appt.client} marked as ${status}`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  openInvoice(appt: any): void {
    this.selectedInvoice = appt;
    this.showInvoiceModal = true;
  }

  printInvoice(): void {
    window.print();
  }

  async submitBooking(): Promise<void> {
    if (!this.newAppt.client) return;
    const appt = {
      id: 'appt-' + Date.now(),
      client: this.newAppt.client,
      phone: this.newAppt.phone || '+92 300 0000000',
      service: this.newAppt.service,
      stylist: this.newAppt.stylist,
      chair: this.newAppt.chair,
      timeSlot: this.newAppt.timeSlot,
      price: Number(this.newAppt.price) || 45,
      status: 'CONFIRMED'
    };
    this.appointments.unshift(appt);
    this.showBookingModal = false;
    this.actionMessage = `Appointment confirmed for ${appt.client} with ${appt.stylist}`;
    setTimeout(() => this.actionMessage = '', 3500);
    this.newAppt = {
      client: '',
      phone: '',
      service: 'Signature Bridal Makeover & Spa',
      stylist: 'Sana Senior Artist',
      chair: 'Station 1 (Bridal Suite)',
      timeSlot: 'Today 03:00 PM',
      price: 65
    };
  }

  submitService(): void {
    if (!this.newService.name) return;
    const s = {
      id: 'srv-' + Date.now(),
      name: this.newService.name,
      category: this.newService.category,
      duration: this.newService.duration,
      price: Number(this.newService.price) || 25
    };
    this.services.unshift(s);
    this.showNewServiceModal = false;
    this.actionMessage = `Service "${s.name}" added to salon menu!`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  readonly defaultAppointments = [
    { id: 'appt-1', client: 'Mahnoor Tariq', phone: '+92 321 9928172', service: 'Full Keratin Hair Gloss & Blowdry', stylist: 'Sana Senior Artist', chair: 'Station 2', timeSlot: 'Today 11:30 AM', price: 75, status: 'CONFIRMED' },
    { id: 'appt-2', client: 'Fatima Zahra', phone: '+92 300 8829102', service: 'HydraFacial Glow & Organic Pedicure', stylist: 'Anum Skin Specialist', chair: 'Spa Room 1', timeSlot: 'Today 01:00 PM', price: 90, status: 'CONFIRMED' },
    { id: 'appt-3', client: 'Hina Qasim', phone: '+92 333 4410928', service: 'Signature Bridal Makeover & Spa', stylist: 'Sana Senior Artist', chair: 'VIP Bridal Suite', timeSlot: 'Today 03:30 PM', price: 180, status: 'CONFIRMED' },
    { id: 'appt-4', client: 'Arooj Rauf', phone: '+92 301 7719283', service: 'Balayage Color Melting & Trim', stylist: 'Kiran Hair Colorist', chair: 'Station 4', timeSlot: 'Yesterday', price: 120, status: 'COMPLETED' }
  ];

  readonly defaultServices = [
    { id: 's-1', name: 'Signature Bridal Makeover', category: 'Bridal & Groom', duration: '180 mins', price: 180 },
    { id: 's-2', name: 'HydraFacial Medical Cleanse', category: 'Skincare & Facials', duration: '60 mins', price: 90 },
    { id: 's-3', name: 'Brazilian Keratin Smoothing', category: 'Hair Care', duration: '120 mins', price: 110 },
    { id: 's-4', name: 'Balayage & Hair Gloss', category: 'Hair Coloring', duration: '90 mins', price: 95 },
    { id: 's-5', name: 'Luxury Manicure & Pedicure', category: 'Nail Studio', duration: '50 mins', price: 40 }
  ];

  readonly defaultStylists = [
    { id: 'st-1', name: 'Sana Senior Artist', role: 'Master Bridal Makeup & Hair', experience: '9 Years', rating: '5.0', bookingsToday: 3, status: 'In Session' },
    { id: 'st-2', name: 'Anum Skin Specialist', role: 'Aesthetician & HydraFacial Lead', experience: '6 Years', rating: '4.9', bookingsToday: 2, status: 'Available' },
    { id: 'st-3', name: 'Kiran Hair Colorist', role: 'Senior Colorist & Balayage', experience: '7 Years', rating: '4.8', bookingsToday: 2, status: 'In Session' }
  ];

  readonly defaultPackages = [
    { id: 'pkg-1', name: 'Royal Barat Bridal Glow Package', price: 280, services: 'HD Bridal Makeup + Hair + HydraFacial + Acrylic Nails + Body Spa', duration: '1 Day' },
    { id: 'pkg-2', name: 'Pre-Wedding Party Glam', price: 120, services: 'Party Makeup + Hairstyling + Classic Manicure', duration: '3 Hours' },
    { id: 'pkg-3', name: 'Hair Revival & Spa Therapy', price: 95, services: 'Keratin Mask + Scalp Detox + Blowdry + Hand Massage', duration: '90 Mins' }
  ];

  readonly defaultProducts = [
    { id: 'pr-1', name: 'Moroccanoil Treatment Oil (100ml)', brand: 'Moroccanoil', price: 48, stock: 14 },
    { id: 'pr-2', name: 'Olaplex No.3 Hair Perfector', brand: 'Olaplex', price: 32, stock: 9 },
    { id: 'pr-3', name: 'Dermalogica Daily Microfoliant', brand: 'Dermalogica', price: 65, stock: 6 }
  ];
}
