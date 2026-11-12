import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  BedDouble,
  KeyRound,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Plus,
  Search,
  DollarSign,
  Printer,
  X
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';

@Component({
  selector: 'app-dashboard-hotel-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './hotel-hub.component.html'
})
export class DashboardHotelHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    BedDouble,
    KeyRound,
    Sparkles,
    Calendar,
    CheckCircle2,
    Clock,
    User,
    Plus,
    Search,
    DollarSign,
    Printer,
    X
  };

  activeTab: 'rooms' | 'frontdesk' | 'housekeeping' = 'rooms';
  isLoading = false;
  selectedFloor = 'ALL';
  floors = ['ALL', '1st Floor', '2nd Floor', '3rd Floor'];
  actionMessage = '';

  rooms: any[] = [];
  reservations: any[] = [];
  housekeepingTasks: any[] = [];

  showCheckinModal = false;
  showCheckoutReceiptModal = false;
  lastCheckedOutFolio: any = null;

  newCheckin = {
    guestName: '',
    roomNo: '102',
    checkOut: '2026-03-30',
    nights: 3,
    ratePerNight: 110,
    paymentMethod: 'Credit Card'
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [rmRes, resRes, hkRes] = await Promise.all([
        this.backend.getHotelRooms(),
        this.backend.getHotelReservations(),
        this.backend.getHotelHousekeeping()
      ]);
      this.rooms = rmRes.rooms || [];
      this.reservations = resRes.reservations || [];
      this.housekeepingTasks = hkRes.housekeeping || [];
    } finally {
      this.isLoading = false;
    }
  }

  get stats() {
    const totalRooms = this.rooms.length;
    const occupied = this.rooms.filter(r => r.status === 'OCCUPIED').length;
    const available = this.rooms.filter(r => r.status === 'CLEAN_READY').length;
    const dirty = this.rooms.filter(r => r.status === 'DIRTY_HOUSEKEEPING').length;
    const occupancyRate = Math.round((occupied / (totalRooms || 1)) * 100);
    return { totalRooms, occupied, available, dirty, occupancyRate };
  }

  get filteredRooms() {
    if (this.selectedFloor === 'ALL') return this.rooms;
    return this.rooms.filter(r => r.floor === this.selectedFloor);
  }

  async setRoomStatus(room: any, status: string): Promise<void> {
    room.status = status;
    await this.backend.updateHotelRoomStatus(room.id, status);
    this.actionMessage = `Room ${room.roomNo} marked as ${status.replace('_', ' ')}`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  async submitCheckin(): Promise<void> {
    if (!this.newCheckin.guestName) return;
    this.isLoading = true;
    try {
      const selectedRoomObj = this.rooms.find(r => r.roomNo === this.newCheckin.roomNo);
      if (selectedRoomObj) {
        this.newCheckin.ratePerNight = selectedRoomObj.ratePerNight;
      }
      const res = await this.backend.hotelCheckin(this.newCheckin);
      if (res.ok && res.folio) {
        this.reservations.unshift(res.folio);
      }
      this.showCheckinModal = false;
      this.actionMessage = `Guest ${this.newCheckin.guestName} checked into Room ${this.newCheckin.roomNo}!`;
      setTimeout(() => this.actionMessage = '', 3500);
      await this.loadData();
    } finally {
      this.isLoading = false;
    }
  }

  async checkoutGuest(folio: any): Promise<void> {
    this.isLoading = true;
    try {
      const res = await this.backend.hotelCheckout(folio.folioNo);
      if (res.ok) {
        folio.status = 'CHECKED_OUT';
        this.lastCheckedOutFolio = folio;
        this.showCheckoutReceiptModal = true;
        this.actionMessage = `Room ${folio.roomNo} vacated & marked for housekeeping`;
        setTimeout(() => this.actionMessage = '', 3500);
        await this.loadData();
      }
    } finally {
      this.isLoading = false;
    }
  }

  printFolio(): void {
    window.print();
  }
}
