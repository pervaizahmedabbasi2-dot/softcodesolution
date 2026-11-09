import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plane,
  Map,
  Ticket,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Globe,
  Calendar,
  X,
  BedDouble,
  Building2,
  FileText,
  Printer,
  ShieldCheck,
  Users,
  DollarSign,
  ExternalLink
} from 'lucide-angular';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-travel-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './travel-hub.component.html'
})
export class DashboardTravelHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Plane,
    Map,
    Ticket,
    Search,
    Plus,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Globe,
    Calendar,
    X,
    BedDouble,
    Building2,
    FileText,
    Printer,
    ShieldCheck,
    Users,
    DollarSign,
    ExternalLink
  };

  activeTab: 'visas' | 'hotel-vouchers' | 'partner-hotels' | 'packages' | 'bookings' = 'visas';
  isLoading = false;
  searchQuery = '';
  hotelSearchQuery = '';
  actionMessage = '';

  visas: any[] = [];
  packages: any[] = [];
  bookings: any[] = [];
  hotels: any[] = [];
  hotelBookings: any[] = [];

  showNewVisaModal = false;
  showNewHotelBookingModal = false;
  showVoucherModal = false;
  selectedVoucher: any = null;

  newVisa = {
    clientName: '',
    passportNo: '',
    country: 'Saudi Arabia',
    visaType: 'Umrah Tourist E-Visa',
    embassyFee: 120,
    serviceFee: 50,
    includeHotelBooking: true,
    hotelId: 'th-1',
    hotelRoomType: 'Classic Haram View',
    hotelCheckIn: '2026-05-01',
    hotelCheckOut: '2026-05-07',
    hotelNights: 6,
    hotelMealPlan: 'Bed & Breakfast (Buffet)'
  };

  newHotelBooking = {
    guestName: '',
    passportNo: '',
    hotelId: 'th-1',
    roomType: 'Classic Haram View',
    checkIn: '2026-05-10',
    checkOut: '2026-05-16',
    nights: 6,
    roomsCount: 1,
    paxCount: 2,
    mealPlan: 'Bed & Breakfast (Buffet)',
    ratePerNight: 210,
    paidAmount: 1260,
    linkedVisaApp: '',
    purpose: 'Tourist Visa Proof of Accommodation'
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [vsaRes, pkgRes, bkgRes, htlRes, hbRes] = await Promise.all([
        this.backend.getTravelVisas(),
        this.backend.getTravelPackages(),
        this.backend.getTravelBookings(),
        this.backend.getTravelHotels(),
        this.backend.getTravelHotelBookings()
      ]);
      this.visas = vsaRes.visas || [];
      this.packages = pkgRes.packages || [];
      this.bookings = bkgRes.bookings || [];
      this.hotels = htlRes.hotels || [];
      this.hotelBookings = hbRes.bookings || [];

      if (this.hotels.length > 0 && !this.newVisa.hotelId) {
        this.newVisa.hotelId = this.hotels[0].id;
        this.newVisa.hotelRoomType = this.hotels[0].roomTypes[0] || 'Standard Room';
      }
    } finally {
      this.isLoading = false;
    }
  }

  get stats() {
    const totalVisas = this.visas.length;
    const approvedVisas = this.visas.filter(v => v.status === 'APPROVED').length;
    const processingVisas = this.visas.filter(v => v.status === 'PROCESSING' || v.status === 'SUBMITTED').length;
    const hotelVouchersCount = this.hotelBookings.length;
    const totalNightsManaged = this.hotelBookings.reduce((sum, b) => sum + (b.nights || 0), 0);
    const partnerHotelsCount = this.hotels.length;
    const bookingsValue = this.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const hotelBookingsValue = this.hotelBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    return {
      totalVisas,
      approvedVisas,
      processingVisas,
      hotelVouchersCount,
      totalNightsManaged,
      partnerHotelsCount,
      totalRevenue: bookingsValue + hotelBookingsValue
    };
  }

  get filteredVisas() {
    if (!this.searchQuery) return this.visas;
    const q = this.searchQuery.toLowerCase();
    return this.visas.filter(v =>
      v.clientName?.toLowerCase().includes(q) ||
      v.passportNo?.toLowerCase().includes(q) ||
      v.country?.toLowerCase().includes(q) ||
      v.trackingRef?.toLowerCase().includes(q) ||
      v.hotelName?.toLowerCase().includes(q) ||
      v.hotelVoucherRef?.toLowerCase().includes(q)
    );
  }

  get filteredHotelBookings() {
    if (!this.hotelSearchQuery) return this.hotelBookings;
    const q = this.hotelSearchQuery.toLowerCase();
    return this.hotelBookings.filter(b =>
      b.guestName?.toLowerCase().includes(q) ||
      b.voucherNo?.toLowerCase().includes(q) ||
      b.confirmationCode?.toLowerCase().includes(q) ||
      b.hotelName?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q) ||
      b.passportNo?.toLowerCase().includes(q) ||
      b.linkedVisaApp?.toLowerCase().includes(q)
    );
  }

  onVisaHotelChange(): void {
    const selected = this.hotels.find(h => h.id === this.newVisa.hotelId);
    if (selected && selected.roomTypes && selected.roomTypes.length > 0) {
      this.newVisa.hotelRoomType = selected.roomTypes[0];
    }
  }

  onBookingHotelChange(): void {
    const selected = this.hotels.find(h => h.id === this.newHotelBooking.hotelId);
    if (selected) {
      this.newHotelBooking.ratePerNight = selected.contractedRate;
      if (selected.roomTypes && selected.roomTypes.length > 0) {
        this.newHotelBooking.roomType = selected.roomTypes[0];
      }
      this.calculateBookingTotal();
    }
  }

  calculateBookingTotal(): void {
    const total = (this.newHotelBooking.ratePerNight || 0) * (this.newHotelBooking.nights || 1) * (this.newHotelBooking.roomsCount || 1);
    this.newHotelBooking.paidAmount = total;
  }

  async submitVisa(): Promise<void> {
    if (!this.newVisa.clientName || !this.newVisa.passportNo) return;
    this.isLoading = true;
    try {
      const res = await this.backend.submitTravelVisa(this.newVisa);
      if (res.ok && res.visa) {
        this.visas.unshift(res.visa);
      }
      await this.loadData();
      this.showNewVisaModal = false;
      this.actionMessage = `Visa file for ${this.newVisa.clientName} lodged successfully! ${this.newVisa.includeHotelBooking ? 'Hotel voucher generated & linked.' : ''}`;
      setTimeout(() => this.actionMessage = '', 4000);
      this.newVisa = {
        clientName: '',
        passportNo: '',
        country: 'Saudi Arabia',
        visaType: 'Umrah Tourist E-Visa',
        embassyFee: 120,
        serviceFee: 50,
        includeHotelBooking: true,
        hotelId: this.hotels[0]?.id || 'th-1',
        hotelRoomType: this.hotels[0]?.roomTypes[0] || 'Standard Room',
        hotelCheckIn: '2026-05-01',
        hotelCheckOut: '2026-05-07',
        hotelNights: 6,
        hotelMealPlan: 'Bed & Breakfast (Buffet)'
      };
    } finally {
      this.isLoading = false;
    }
  }

  async submitHotelBooking(): Promise<void> {
    if (!this.newHotelBooking.guestName || !this.newHotelBooking.passportNo) return;
    this.isLoading = true;
    try {
      const res = await this.backend.submitTravelHotelBooking(this.newHotelBooking);
      if (res.ok && res.booking) {
        this.hotelBookings.unshift(res.booking);
        this.actionMessage = `Official Hotel Voucher #${res.booking.voucherNo} issued for ${res.booking.guestName}!`;
      }
      await this.loadData();
      this.showNewHotelBookingModal = false;
      setTimeout(() => this.actionMessage = '', 4000);
      this.newHotelBooking = {
        guestName: '',
        passportNo: '',
        hotelId: this.hotels[0]?.id || 'th-1',
        roomType: this.hotels[0]?.roomTypes[0] || 'Standard Room',
        checkIn: '2026-05-10',
        checkOut: '2026-05-16',
        nights: 6,
        roomsCount: 1,
        paxCount: 2,
        mealPlan: 'Bed & Breakfast (Buffet)',
        ratePerNight: this.hotels[0]?.contractedRate || 210,
        paidAmount: (this.hotels[0]?.contractedRate || 210) * 6,
        linkedVisaApp: '',
        purpose: 'Tourist Visa Proof of Accommodation'
      };
    } finally {
      this.isLoading = false;
    }
  }

  async updateVisaStatus(visa: any, status: string): Promise<void> {
    visa.status = status;
    await this.backend.updateTravelVisaStatus(visa.id, status);
    this.actionMessage = `Application #${visa.appNo} marked as ${status}`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  async updateHotelBookingStatus(booking: any, status: string): Promise<void> {
    booking.voucherStatus = status;
    await this.backend.updateTravelHotelBookingStatus(booking.id, status);
    this.actionMessage = `Voucher #${booking.voucherNo} status changed to ${status}`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  openVoucherModal(booking: any): void {
    this.selectedVoucher = booking;
    this.showVoucherModal = true;
  }

  findAndOpenVoucherForVisa(visa: any): void {
    if (!visa.hotelVoucherRef) return;
    const found = this.hotelBookings.find(b => b.voucherNo === visa.hotelVoucherRef);
    if (found) {
      this.openVoucherModal(found);
    } else {
      this.actionMessage = `Voucher ${visa.hotelVoucherRef} details: Reserved at ${visa.hotelName || 'Partner Hotel'}`;
      setTimeout(() => this.actionMessage = '', 3500);
    }
  }

  printVoucher(): void {
    window.print();
  }
}
