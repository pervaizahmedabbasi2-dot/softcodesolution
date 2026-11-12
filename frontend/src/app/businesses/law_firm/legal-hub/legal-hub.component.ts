import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Scale,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  DollarSign,
  X,
  Users,
  Briefcase,
  Printer,
  ShieldCheck,
  FolderOpen
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';

@Component({
  selector: 'app-dashboard-legal-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './legal-hub.component.html'
})
export class DashboardLegalHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Scale,
    Search,
    Plus,
    CheckCircle2,
    Clock,
    Calendar,
    FileText,
    DollarSign,
    X,
    Users,
    Briefcase,
    Printer,
    ShieldCheck,
    FolderOpen
  };

  activeTab: 'cases' | 'hearings' | 'clients' | 'documents' | 'billing' = 'cases';
  isLoading = false;
  searchQuery = '';
  actionMessage = '';

  cases: any[] = [];
  hearings: any[] = [];
  clients: any[] = [];
  documents: any[] = [];
  invoices: any[] = [];

  showNewCaseModal = false;
  showHearingModal = false;
  showDocketModal = false;
  selectedCaseDocket: any = null;

  newCase = {
    caseNo: '',
    title: '',
    court: 'High Court Commercial Division',
    judge: 'Hon. Justice M. A. Farooqi',
    advocate: 'Barrister Shahrukh (Lead Counsel)',
    stage: 'Arguments & Pleadings',
    hearingDate: '2026-05-14',
    retainer: 3200,
    client: 'Apex Industrial Corp'
  };

  newHearing = {
    caseNo: 'HC-2026-081',
    court: 'Supreme Court of Pakistan',
    hearingDate: '2026-05-18',
    purpose: 'Interim Injunction Review',
    bench: 'Division Bench II'
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const res = await this.backend.getLegalCases();
      this.cases = (res.cases && res.cases.length > 0) ? res.cases : this.defaultCases;
    } catch {
      this.cases = this.defaultCases;
    } finally {
      this.hearings = this.defaultHearings;
      this.clients = this.defaultClients;
      this.documents = this.defaultDocuments;
      this.invoices = this.defaultInvoices;
      this.isLoading = false;
    }
  }

  get stats() {
    const totalCases = this.cases.length;
    const upcomingHearings = this.hearings.length;
    const corporateClients = this.clients.length;
    const activeDocuments = this.documents.length;
    const totalRetainerBilled = this.cases.reduce((sum, c) => sum + (Number(c.retainer) || 0), 0);
    return { totalCases, upcomingHearings, corporateClients, activeDocuments, totalRetainerBilled };
  }

  get filteredCases() {
    if (!this.searchQuery) return this.cases;
    const q = this.searchQuery.toLowerCase();
    return this.cases.filter(c =>
      c.caseNo?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.court?.toLowerCase().includes(q) ||
      c.advocate?.toLowerCase().includes(q) ||
      c.client?.toLowerCase().includes(q)
    );
  }

  get filteredHearings() {
    if (!this.searchQuery) return this.hearings;
    const q = this.searchQuery.toLowerCase();
    return this.hearings.filter(h =>
      h.caseNo?.toLowerCase().includes(q) ||
      h.court?.toLowerCase().includes(q) ||
      h.purpose?.toLowerCase().includes(q)
    );
  }

  openDocket(c: any): void {
    this.selectedCaseDocket = c;
    this.showDocketModal = true;
  }

  printDocket(): void {
    window.print();
  }

  async submitNewCase(): Promise<void> {
    if (!this.newCase.title) return;
    const c = {
      id: 'case-' + Date.now(),
      caseNo: this.newCase.caseNo || 'HC-2026-' + Math.floor(100 + Math.random() * 900),
      title: this.newCase.title,
      client: this.newCase.client,
      court: this.newCase.court,
      judge: this.newCase.judge,
      advocate: this.newCase.advocate,
      stage: this.newCase.stage,
      hearingDate: this.newCase.hearingDate,
      retainer: Number(this.newCase.retainer) || 2500,
      status: 'ACTIVE'
    };
    this.cases.unshift(c);
    this.showNewCaseModal = false;
    this.actionMessage = `Case Docket ${c.caseNo} filed successfully!`;
    setTimeout(() => this.actionMessage = '', 3500);
    this.newCase = {
      caseNo: '',
      title: '',
      court: 'High Court Commercial Division',
      judge: 'Hon. Justice M. A. Farooqi',
      advocate: 'Barrister Shahrukh (Lead Counsel)',
      stage: 'Arguments & Pleadings',
      hearingDate: '2026-05-14',
      retainer: 3200,
      client: 'Apex Industrial Corp'
    };
  }

  scheduleHearing(): void {
    const h = {
      id: 'hrg-' + Date.now(),
      caseNo: this.newHearing.caseNo,
      court: this.newHearing.court,
      hearingDate: this.newHearing.hearingDate,
      purpose: this.newHearing.purpose,
      bench: this.newHearing.bench,
      status: 'SCHEDULED'
    };
    this.hearings.unshift(h);
    this.showHearingModal = false;
    this.actionMessage = `Hearing scheduled for ${h.caseNo} on ${h.hearingDate}`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  readonly defaultCases = [
    { id: 'cs-1', caseNo: 'HC-2026-081', title: 'Apex Industrial vs Federal Board of Revenue', client: 'Apex Industrial Corp', court: 'High Court (Commercial Bench)', judge: 'Justice M. A. Farooqi', advocate: 'Barrister Shahrukh', stage: 'Final Arguments', hearingDate: '2026-05-14', retainer: 4500, status: 'ACTIVE' },
    { id: 'cs-2', caseNo: 'SC-2025-412', title: 'Habib Holdings Ltd vs Maritime Authority', client: 'Habib Holdings Ltd', court: 'Supreme Court Appellate', judge: 'Chief Justice Bench', advocate: 'Syed Tariq Advocate SC', stage: 'Leave to Appeal Granted', hearingDate: '2026-05-22', retainer: 7500, status: 'ACTIVE' },
    { id: 'cs-3', caseNo: 'ARB-2026-019', title: 'Cross-Border Telecom IP Arbitration', client: 'TeleGlobal Singapore', court: 'International Arbitration Tribunal', judge: 'Panel of Arbitrators', advocate: 'Barrister Shahrukh', stage: 'Witness Cross Examination', hearingDate: '2026-06-02', retainer: 12000, status: 'ACTIVE' },
    { id: 'cs-4', caseNo: 'CC-2026-302', title: 'Shahana Builders vs Capital Development', client: 'Shahana Builders & Developers', court: 'District & Sessions Court', judge: 'Judge Riaz Ahmed', advocate: 'Advocate Hamza Bilal', stage: 'Consent Decree Issued', hearingDate: 'Concluded', retainer: 3000, status: 'WON / SETTLED' }
  ];

  readonly defaultHearings = [
    { id: 'h-1', caseNo: 'HC-2026-081', court: 'High Court Courtroom 3', hearingDate: '14 May 2026 (10:30 AM)', purpose: 'Concluding Arguments & Writ Decision', bench: 'Single Bench I', status: 'CONFIRMED' },
    { id: 'h-2', caseNo: 'SC-2025-412', court: 'Supreme Court Courtroom 1', hearingDate: '22 May 2026 (11:00 AM)', purpose: 'Civil Miscellaneous Application Hearing', bench: 'Larger Bench', status: 'CONFIRMED' },
    { id: 'h-3', caseNo: 'ARB-2026-019', court: 'Arbitration Center Bay Hall', hearingDate: '02 Jun 2026 (09:00 AM)', purpose: 'Expert Witness Forensic Cross-Examination', bench: 'Sole Arbitrator', status: 'CONFIRMED' }
  ];

  readonly defaultClients = [
    { id: 'cl-1', name: 'Apex Industrial Corp', contact: 'Mian Aslam (MD)', type: 'Corporate Retainer', activeCases: 3, totalBilled: 14500 },
    { id: 'cl-2', name: 'Habib Holdings Ltd', contact: 'Suleman Habib', type: 'Litigation & Maritime', activeCases: 2, totalBilled: 21000 },
    { id: 'cl-3', name: 'TeleGlobal Singapore', contact: 'Kevin Chen (General Counsel)', type: 'Cross-Border Tech IP', activeCases: 1, totalBilled: 35000 },
    { id: 'cl-4', name: 'Shahana Builders', contact: 'Kamran Shahana', type: 'Real Estate Disputes', activeCases: 1, totalBilled: 8500 }
  ];

  readonly defaultDocuments = [
    { id: 'd-1', docNo: 'DOC-901', title: 'Writ Petition under Article 199 (Certified Copy)', caseNo: 'HC-2026-081', type: 'Writ Petition', filedOn: '15 Mar 2026', pages: 42 },
    { id: 'd-2', docNo: 'DOC-902', title: 'Rejoinder Affidavit by Managing Director', caseNo: 'HC-2026-081', type: 'Affidavit', filedOn: '28 Mar 2026', pages: 18 },
    { id: 'd-3', docNo: 'DOC-903', title: 'Statement of Claim & Forensic Audit Annexures', caseNo: 'ARB-2026-019', type: 'Arbitration Pleadings', filedOn: '10 Apr 2026', pages: 114 }
  ];

  readonly defaultInvoices = [
    { id: 'li-1', invNo: 'LEX-401', client: 'Apex Industrial Corp', description: 'High Court Writ Filing & Stay Order Retainer', amount: 4500, date: '2026-04-02', status: 'PAID' },
    { id: 'li-2', invNo: 'LEX-402', client: 'Habib Holdings Ltd', description: 'Supreme Court Appeal Fee & Chamber Conferences', amount: 7500, date: '2026-04-12', status: 'PAID' },
    { id: 'li-3', invNo: 'LEX-403', client: 'TeleGlobal Singapore', description: 'Arbitration Pleadings & Expert Witness Preparation', amount: 12000, date: '2026-04-20', status: 'PENDING' }
  ];
}
