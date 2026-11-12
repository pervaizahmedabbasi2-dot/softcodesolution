import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Heart,
  HandHeart,
  Users,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  Printer,
  Calendar,
  MapPin,
  X
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';

@Component({
  selector: 'app-dashboard-ngo-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './ngo-hub.component.html'
})
export class DashboardNgoHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Heart,
    HandHeart,
    Users,
    Plus,
    Search,
    CheckCircle2,
    DollarSign,
    Printer,
    Calendar,
    MapPin,
    X
  };

  activeTab: 'campaigns' | 'donations' | 'beneficiaries' = 'campaigns';
  isLoading = false;
  actionMessage = '';

  campaigns: any[] = [];
  donations: any[] = [];
  beneficiaries: any[] = [];

  showNewCampaignModal = false;
  showNewDonationModal = false;
  showDonationReceiptModal = false;
  lastDonation: any = null;

  newCampaign = {
    title: '',
    targetAmount: 25000,
    beneficiariesCount: 500,
    category: 'Food Relief',
    location: 'Rural Districts'
  };

  newDonation = {
    donorName: '',
    amount: 500,
    campaign: 'Ramadan Ration Pack Drive',
    type: 'Zakat',
    paymentMethod: 'Bank Transfer'
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [cmpRes, donRes, benRes] = await Promise.all([
        this.backend.getNgoCampaigns(),
        this.backend.getNgoDonations(),
        this.backend.getNgoBeneficiaries()
      ]);
      this.campaigns = cmpRes.campaigns || [];
      this.donations = donRes.donations || [];
      this.beneficiaries = benRes.beneficiaries || [];
    } finally {
      this.isLoading = false;
    }
  }

  get stats() {
    const totalDonations = this.donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const activeProjects = this.campaigns.filter(c => c.status === 'ACTIVE').length;
    const totalBeneficiaries = this.beneficiaries.length;
    return { totalDonations, activeProjects, totalBeneficiaries };
  }

  async launchCampaign(): Promise<void> {
    if (!this.newCampaign.title) return;
    this.isLoading = true;
    try {
      const res = await this.backend.createNgoCampaign(this.newCampaign);
      if (res.ok && res.campaign) {
        this.campaigns.unshift(res.campaign);
      } else {
        await this.loadData();
      }
      this.showNewCampaignModal = false;
      this.actionMessage = `Relief campaign "${this.newCampaign.title}" launched successfully!`;
      setTimeout(() => this.actionMessage = '', 3500);
      this.newCampaign = {
        title: '',
        targetAmount: 25000,
        beneficiariesCount: 500,
        category: 'Food Relief',
        location: 'Rural Districts'
      };
    } finally {
      this.isLoading = false;
    }
  }

  async recordDonation(): Promise<void> {
    if (!this.newDonation.donorName || !this.newDonation.amount) return;
    this.isLoading = true;
    try {
      const res = await this.backend.recordNgoDonation(this.newDonation);
      if (res.ok && res.donation) {
        this.donations.unshift(res.donation);
        this.lastDonation = res.donation;
        this.showNewDonationModal = false;
        this.showDonationReceiptModal = true;
        this.actionMessage = 'Donation verified & formal charity voucher stamped!';
        setTimeout(() => this.actionMessage = '', 3500);
        await this.loadData();
      }
    } finally {
      this.isLoading = false;
    }
  }

  printReceipt(): void {
    window.print();
  }
}
