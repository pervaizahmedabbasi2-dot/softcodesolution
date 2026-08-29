import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  Search, Plus, CheckCircle2, XCircle, Clock, WalletCards, 
  FileText, Activity, CreditCard, Users, Shield, Percent, Receipt, RefreshCcw
} from 'lucide-angular';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-payments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './payments.component.html'
})
export class DashboardPaymentsComponent implements OnInit {
  @Input() activeView: string = '';
  @Input() userRole: string = '';
  @Input() icons: any = {};
  @Output() navigate = new EventEmitter<string>();

  private backend = inject(BackendService);

  activeTab: 'invoices' | 'subscriptions' | 'transactions' | 'approvals' | 'wallet' | 'coupons' | 'refunds' | 'tax' | 'notifications' = 'invoices';
  searchQuery: string = '';

  invoices: any[] = [];
  pendingApprovals: any[] = [];
  walletBalance: any = null;
  coupons: any[] = [];
  taxRules: any[] = [];
  isLoading = false;

  myIcons = {
    Search, Plus, CheckCircle2, XCircle, Clock, WalletCards, 
    FileText, Activity, CreditCard, Users, Shield, Percent, Receipt, RefreshCcw
  };

  ngOnInit() {
    this.loadDataForTab(this.activeTab);
  }

  setTab(tab: any) {
    this.activeTab = tab;
    this.loadDataForTab(tab);
  }

  async loadDataForTab(tab: string) {
    this.isLoading = true;
    try {
      if (tab === 'invoices') {
        const res = await this.backend.getInvoices(50, 0);
        if (res && res.ok) this.invoices = res.invoices || [];
      } else if (tab === 'approvals') {
        const res = await this.backend.getPendingApprovals();
        if (res && res.ok) this.pendingApprovals = res.transactions || [];
      } else if (tab === 'wallet') {
        const res = await this.backend.getWalletBalance('');
        if (res && res.ok) this.walletBalance = res;
      } else if (tab === 'coupons') {
        const res = await this.backend.getCoupons();
        if (res && res.ok) this.coupons = res.coupons || [];
      } else if (tab === 'tax') {
        const res = await this.backend.getTaxRules();
        if (res && res.ok) this.taxRules = res.rules || [];
      }
    } finally {
      this.isLoading = false;
    }
  }

  async approvePayment(transactionId: string) {
    const res = await this.backend.approvePayment(transactionId);
    if (res && res.ok) {
      this.loadDataForTab('approvals');
    } else {
      alert('Failed to approve payment');
    }
  }
}
