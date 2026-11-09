import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Dumbbell,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  UserCheck,
  CreditCard,
  X,
  Users,
  Calendar,
  AlertTriangle,
  Printer,
  ShieldCheck,
  DollarSign
} from 'lucide-angular';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-gym-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './gym-hub.component.html'
})
export class DashboardGymHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Dumbbell,
    Search,
    Plus,
    CheckCircle2,
    Clock,
    UserCheck,
    CreditCard,
    X,
    Users,
    Calendar,
    AlertTriangle,
    Printer,
    ShieldCheck,
    DollarSign
  };

  activeTab: 'members' | 'attendance' | 'trainers' | 'plans' | 'billing' = 'members';
  isLoading = false;
  searchQuery = '';
  actionMessage = '';

  members: any[] = [];
  attendance: any[] = [];
  trainers: any[] = [];
  plans: any[] = [];
  invoices: any[] = [];

  showNewMemberModal = false;
  showCheckinModal = false;
  showReceiptModal = false;
  selectedMemberReceipt: any = null;

  newMember = {
    name: '',
    phone: '',
    email: '',
    plan: 'Pro Fitness & CrossFit',
    fee: 45,
    trainer: 'Captain Bilal (Strength Coach)',
    startDate: '2026-04-01',
    dueDate: '2026-05-01'
  };

  newCheckin = {
    memberId: 'mem-1',
    memberName: 'Farhan Zaidi',
    accessZone: 'Weight Room & Cardio',
    time: 'Just Now'
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [mRes, cRes] = await Promise.all([
        this.backend.getGymMembers(),
        this.backend.getGymCheckins()
      ]);
      this.members = (mRes.members && mRes.members.length > 0) ? mRes.members : this.defaultMembers;
      this.attendance = (cRes.checkins && cRes.checkins.length > 0) ? cRes.checkins : this.defaultAttendance;
    } catch {
      this.members = this.defaultMembers;
      this.attendance = this.defaultAttendance;
    } finally {
      this.trainers = this.defaultTrainers;
      this.plans = this.defaultPlans;
      this.invoices = this.defaultInvoices;
      this.isLoading = false;
    }
  }

  get stats() {
    const totalMembers = this.members.length;
    const activeMembers = this.members.filter(m => m.status === 'ACTIVE').length;
    const todayCheckins = this.attendance.length;
    const totalCollections = this.invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const expiringSoon = this.members.filter(m => m.status === 'EXPIRED' || m.status === 'OVERDUE').length;
    return { totalMembers, activeMembers, todayCheckins, totalCollections, expiringSoon };
  }

  get filteredMembers() {
    if (!this.searchQuery) return this.members;
    const q = this.searchQuery.toLowerCase();
    return this.members.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.plan?.toLowerCase().includes(q) ||
      m.regNo?.toLowerCase().includes(q)
    );
  }

  get filteredAttendance() {
    if (!this.searchQuery) return this.attendance;
    const q = this.searchQuery.toLowerCase();
    return this.attendance.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.zone?.toLowerCase().includes(q) ||
      a.cardId?.toLowerCase().includes(q)
    );
  }

  openReceipt(member: any): void {
    this.selectedMemberReceipt = member;
    this.showReceiptModal = true;
  }

  printReceipt(): void {
    window.print();
  }

  async submitNewMember(): Promise<void> {
    if (!this.newMember.name) return;
    const member = {
      id: 'mem-' + Date.now(),
      regNo: 'GYM-' + (2000 + this.members.length + 1),
      name: this.newMember.name,
      phone: this.newMember.phone || '+92 321 0000000',
      email: this.newMember.email || 'member@example.com',
      plan: this.newMember.plan,
      fee: Number(this.newMember.fee) || 40,
      trainer: this.newMember.trainer,
      dueDate: this.newMember.dueDate,
      status: 'ACTIVE',
      joinedAt: 'Today'
    };
    this.members.unshift(member);
    this.showNewMemberModal = false;
    this.actionMessage = `Member ${member.name} registered with Reg #${member.regNo}`;
    setTimeout(() => this.actionMessage = '', 3500);
    this.newMember = {
      name: '',
      phone: '',
      email: '',
      plan: 'Pro Fitness & CrossFit',
      fee: 45,
      trainer: 'Captain Bilal (Strength Coach)',
      startDate: '2026-04-01',
      dueDate: '2026-05-01'
    };
  }

  logQuickCheckin(): void {
    const entry = {
      id: 'chk-' + Date.now(),
      cardId: 'RFID-' + Math.floor(1000 + Math.random() * 9000),
      name: this.newCheckin.memberName,
      zone: this.newCheckin.accessZone,
      time: 'Just Now',
      status: 'VERIFIED'
    };
    this.attendance.unshift(entry);
    this.showCheckinModal = false;
    this.actionMessage = `Check-in recorded for ${entry.name}!`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  readonly defaultMembers = [
    { id: 'mem-1', regNo: 'GYM-2041', name: 'Farhan Zaidi', phone: '+92 300 8472910', plan: 'CrossFit & Heavy Weights', fee: 55, trainer: 'Captain Bilal', dueDate: '2026-05-10', status: 'ACTIVE', joinedAt: 'Jan 2026' },
    { id: 'mem-2', regNo: 'GYM-2042', name: 'Ayesha Daniyal', phone: '+92 321 7719283', plan: 'Aerobics & Pilates VIP', fee: 65, trainer: 'Sana Fitness Coach', dueDate: '2026-05-05', status: 'ACTIVE', joinedAt: 'Feb 2026' },
    { id: 'mem-3', regNo: 'GYM-2043', name: 'Shehroz Munir', phone: '+92 333 4401928', plan: 'Standard Cardio & Gym', fee: 35, trainer: 'General Floor Staff', dueDate: '2026-04-02', status: 'OVERDUE', joinedAt: 'Nov 2025' },
    { id: 'mem-4', regNo: 'GYM-2044', name: 'Mustafa Qureshi', phone: '+92 301 9928172', plan: 'Bodybuilding Championship Tier', fee: 80, trainer: 'Captain Bilal', dueDate: '2026-05-20', status: 'ACTIVE', joinedAt: 'Mar 2026' }
  ];

  readonly defaultAttendance = [
    { id: 'c-1', cardId: 'RFID-9812', name: 'Farhan Zaidi', zone: 'Strength Training Bay', time: '07:15 AM', status: 'VERIFIED' },
    { id: 'c-2', cardId: 'RFID-9814', name: 'Ayesha Daniyal', zone: 'Ladies Studio & Pilates', time: '08:00 AM', status: 'VERIFIED' },
    { id: 'c-3', cardId: 'RFID-9819', name: 'Mustafa Qureshi', zone: 'Powerlifting Platform', time: '09:30 AM', status: 'VERIFIED' },
    { id: 'c-4', cardId: 'RFID-9825', name: 'Ali Raza', zone: 'Steam & Sauna Room', time: '10:05 AM', status: 'VERIFIED' }
  ];

  readonly defaultTrainers = [
    { id: 't-1', name: 'Captain Bilal', specialty: 'Strength, Powerlifting & Nutrition', clients: 14, exp: '8 Years', rating: '4.9', status: 'On Floor' },
    { id: 't-2', name: 'Sana Fitness Coach', specialty: 'Pilates, Zumba & Aerobics', clients: 18, exp: '6 Years', rating: '5.0', status: 'On Floor' },
    { id: 't-3', name: 'Rashid Khan', specialty: 'CrossFit & Functional Mobility', clients: 11, exp: '5 Years', rating: '4.8', status: 'Off Duty' }
  ];

  readonly defaultPlans = [
    { id: 'p-1', name: 'Standard General Fitness', fee: 35, billing: 'Monthly', access: 'All Cardio & Weight Machines', popular: false },
    { id: 'p-2', name: 'Pro Fitness & CrossFit', fee: 55, billing: 'Monthly', access: 'All Gym + Group CrossFit + Steam', popular: true },
    { id: 'p-3', name: 'VIP Personal Coaching', fee: 120, billing: 'Monthly', access: 'Dedicated Trainer + Diet Chart + Locker', popular: false }
  ];

  readonly defaultInvoices = [
    { id: 'inv-1', invoiceNo: 'INV-401', member: 'Farhan Zaidi', plan: 'CrossFit & Heavy Weights', amount: 55, method: 'EasyPaisa', date: '2026-04-10', status: 'PAID' },
    { id: 'inv-2', invoiceNo: 'INV-402', member: 'Ayesha Daniyal', plan: 'Aerobics & Pilates VIP', amount: 65, method: 'Credit Card', date: '2026-04-05', status: 'PAID' },
    { id: 'inv-3', invoiceNo: 'INV-403', member: 'Mustafa Qureshi', plan: 'Bodybuilding Championship Tier', amount: 80, method: 'Cash at Desk', date: '2026-04-20', status: 'PAID' }
  ];
}
