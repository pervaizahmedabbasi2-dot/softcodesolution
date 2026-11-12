import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Search, Plus, CheckCircle2, XCircle, Clock, WalletCards, 
  FileText, Activity, CreditCard, Users, Shield, Percent, Receipt, RefreshCcw, Printer, Download, X,
  Key, Settings, ToggleLeft, ToggleRight, Landmark, Smartphone, Globe,
  MessageSquare, Send, Mail, Bell
} from 'lucide-angular';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './payments.component.html'
})
export class DashboardPaymentsComponent implements OnInit {
  @Input() activeView: string = '';
  @Input() userRole: string = '';
  @Input() icons: any = {};
  @Output() navigate = new EventEmitter<string>();

  private backend = inject(BackendService);

  activeTab: 'invoices' | 'gateways' | 'subscriptions' | 'transactions' | 'approvals' | 'wallet' | 'coupons' | 'refunds' | 'tax' | 'notifications' = 'gateways';
  searchQuery: string = '';

  invoices: any[] = [];
  pendingApprovals: any[] = [];
  walletBalance: any = null;
  coupons: any[] = [];
  taxRules: any[] = [];
  gateways: any[] = [];
  transactions: any[] = [];
  notificationLogs: any[] = [];
  isLoading = false;
  selectedInvoiceForModal: any = null;
  editingGateway: any = null;
  gatewayActionMsg = '';

  testNotif = {
    channel: 'WHATSAPP',
    target: 'CUSTOMER',
    recipient: '',
    recipientName: '',
    message: ''
  };
  isSendingNotif = false;

  myIcons = {
    Search, Plus, CheckCircle2, XCircle, Clock, WalletCards, 
    FileText, Activity, CreditCard, Users, Shield, Percent, Receipt, RefreshCcw, Printer, Download, X,
    Key, Settings, ToggleLeft, ToggleRight, Landmark, Smartphone, Globe,
    MessageSquare, Send, Mail, Bell
  };

  ngOnInit() {
    this.loadDataForTab(this.activeTab);
  }

  setTab(tab: any) {
    this.activeTab = tab;
    this.loadDataForTab(tab);
  }

  openInvoiceModal(inv: any) {
    this.selectedInvoiceForModal = inv || {
      invoice_number: 'INV-2026-9041',
      tenant_id: 'tenant_1789674078676',
      status: 'PAID',
      currency: 'PKR',
      total: 19300,
      created_at: new Date().toISOString()
    };
  }

  closeInvoiceModal() {
    this.selectedInvoiceForModal = null;
  }

  printInvoice() {
    window.print();
  }

  openEditGateway(gw: any) {
    this.editingGateway = JSON.parse(JSON.stringify(gw));
  }

  closeEditGateway() {
    this.editingGateway = null;
  }

  async toggleGateway(gw: any) {
    const res = await this.backend.togglePaymentGateway(gw.id);
    if (res && res.ok) {
      gw.enabled = res.gateway.enabled;
      this.gatewayActionMsg = res.message;
      setTimeout(() => this.gatewayActionMsg = '', 3500);
    }
  }

  async saveGateway() {
    if (!this.editingGateway) return;
    const res = await this.backend.updatePaymentGateway(this.editingGateway.id, this.editingGateway);
    if (res && res.ok) {
      this.gatewayActionMsg = `${this.editingGateway.name} updated successfully!`;
      this.editingGateway = null;
      this.loadDataForTab('gateways');
      setTimeout(() => this.gatewayActionMsg = '', 3500);
    }
  }

  async loadDataForTab(tab: string) {
    this.isLoading = true;
    try {
      if (tab === 'gateways') {
        const res = await this.backend.getPaymentGateways();
        if (res && res.ok) this.gateways = res.gateways || [];
        const txRes = await this.backend.getPaymentTransactions();
        if (txRes && txRes.ok) this.transactions = txRes.transactions || [];
      } else if (tab === 'invoices') {
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
      } else if (tab === 'notifications') {
        const res = await this.backend.getNotificationLogs();
        if (res && res.ok) this.notificationLogs = res.logs || [];
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

  async sendTestNotification() {
    if (!this.testNotif.recipient || !this.testNotif.message) {
      alert('Please provide recipient number/email and message text.');
      return;
    }
    this.isSendingNotif = true;
    try {
      const res = await this.backend.sendTestNotification(this.testNotif);
      if (res && res.ok) {
        this.gatewayActionMsg = res.message;
        this.testNotif.message = '';
        this.loadDataForTab('notifications');
        setTimeout(() => this.gatewayActionMsg = '', 3500);
      } else {
        alert(res?.message || 'Failed to dispatch notification');
      }
    } finally {
      this.isSendingNotif = false;
    }
  }
}
