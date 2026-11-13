import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface LegalNavItem {
  key: 'privacy' | 'sla' | 'safety' | 'terms' | 'refund';
  label: string;
  sub: string;
  icon: string;
}

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legal.component.html',
  host: {
    '(document:keydown.escape)': 'onEscapeKey()'
  }
})
export class LegalComponent implements OnInit {
  @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLDivElement>;

  private router = inject(Router, { optional: true });
  private location = inject(Location, { optional: true });

  isModalOpen = signal(false);
  currentTab = signal<string>('terms');
  isRouted = false;

  @Input() set isOpen(value: boolean) {
    this.isModalOpen.set(Boolean(value));
  }

  @Input() set activeTab(value: string) {
    this.currentTab.set(value || 'terms');
  }

  @Output() closeEvent = new EventEmitter<void>();

  ngOnInit(): void {
    if (this.router && this.router.url.includes('legal')) {
      this.isRouted = true;
      this.isModalOpen.set(true);
    }
  }

  onEscapeKey(): void {
    if (this.isModalOpen()) {
      this.closeModal();
    }
  }

  selectTab(key: string): void {
    this.currentTab.set(key);
    if (this.scrollArea?.nativeElement) {
      this.scrollArea.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.closeEvent.emit();
    if (this.isRouted) {
      if (this.location) {
        this.location.back();
      } else if (this.router) {
        this.router.navigate(['/']);
      }
    }
  }

  printSection(): void {
    window.print();
  }

  sidebarItems: LegalNavItem[] = [
    {
      key: 'privacy',
      label: 'Privacy Policy',
      sub: 'Data & confidentiality',
      icon: 'shield'
    },
    {
      key: 'sla',
      label: 'SLA Agreement',
      sub: 'Uptime & support',
      icon: 'verified'
    },
    {
      key: 'safety',
      label: 'Data Safety',
      sub: 'Encryption & security',
      icon: 'lock'
    },
    {
      key: 'terms',
      label: 'Terms of Use',
      sub: 'Rules & conditions',
      icon: 'description'
    },
    {
      key: 'refund',
      label: 'Refund Policy',
      sub: 'Cancellation & billing',
      icon: 'receipt_long'
    }
  ];

  slaStats = [
    { value: '99.9%', label: 'System Uptime' },
    { value: '4hr', label: 'Support Response' },
    { value: '24/7', label: 'Global Monitoring' }
  ];

  supportTiers = [
    { level: 'Critical — System Down', priority: 'P1 Urgent', time: 'Within 1 hour', badgeClass: 'bg-rose-100 text-rose-700' },
    { level: 'High — Major Feature Broken', priority: 'P2 High', time: 'Within 4 hours', badgeClass: 'bg-amber-100 text-amber-800' },
    { level: 'Medium — Minor Issue', priority: 'P3 Standard', time: 'Within 24 hours', badgeClass: 'bg-sky-100 text-sky-700' },
    { level: 'Low — General Query', priority: 'P4 General', time: 'Within 48 hours', badgeClass: 'bg-emerald-100 text-emerald-700' }
  ];

  privacyCollectItems = [
    'Business registration information — name, company, address, business type',
    'Contact details — email address and phone number',
    'Authentication credentials — stored in encrypted form, never in plain text',
    'Usage analytics — which features are used, session duration, error logs (no personal content)',
    'Payment metadata — transaction IDs only; full card details are never stored on our servers'
  ];

  prohibitedItems = [
    'Using the platform to process fraudulent transactions or falsify business records — punishable under PECA 2016',
    'Attempting to reverse-engineer, decompile, or extract source code from our software',
    'Sharing your account credentials with unauthorized third parties outside your registered business',
    'Using automated bots or scripts to scrape or extract data from the platform',
    'Engaging in any activity that disrupts or degrades the performance of shared multi-tenant infrastructure'
  ];

  refundExceptions = [
    'SoftCode Solution\'s platform was inaccessible for more than 72 consecutive hours due to a failure on our own infrastructure — not caused by the client\'s hardware, internet, or third-party services.',
    'A duplicate payment was charged due to a confirmed billing system error on our part, supported by transaction records.',
    'The client was charged after a cancellation request was successfully submitted and confirmed before the billing date of that cycle.',
    'The software module delivered was materially and fundamentally different from the description published at the time of purchase.'
  ];

  milestoneItems = [
    {
      step: '01',
      phase: 'Booking Fee (30–40%)',
      desc: 'Non-refundable advance payment required to initiate the project. This reserves SoftCode Solution\'s development resources exclusively for your project.'
    },
    {
      step: '02',
      phase: 'Milestone 1',
      desc: 'Payment due upon completion and client approval of design, wireframes, and project architecture.'
    },
    {
      step: '03',
      phase: 'Milestone 2',
      desc: 'Payment due upon completion of core development phase and feature demonstration.'
    },
    {
      step: '04',
      phase: 'Final Payment',
      desc: 'Payment due upon final delivery, testing completion, and deployment. Full payment must be cleared before source code or system access is handed over.'
    }
  ];

  nonPaymentItems = [
    'A 7-day grace period is granted from the milestone due date — work continues during this window.',
    'If payment is not received within 7 days, all development work is immediately suspended.',
    'If payment remains outstanding after 30 days from the due date, the project is legally terminated.',
    'All code, designs, and deliverables produced remain the exclusive intellectual property of SoftCode Solution SMC-Private Limited until full payment is received.',
    'SoftCode Solution reserves the right to pursue legal action for outstanding dues under the Contract Act 1872 and Companies Act 2017 in the High Court of Sindh, Karachi.'
  ];

  cancellationItems = [
    'The non-refundable booking fee is forfeited in all cases — no exceptions.',
    'Any milestone already completed and approved by the client is non-refundable.',
    'Any milestone that has not yet commenced will be refunded minus a 15% administrative processing fee.',
    'Partial milestones — work already started but not completed — are non-refundable for the work done to date.',
    'All deliverables, code, and designs remain with SoftCode Solution until full outstanding balance is settled.'
  ];

  deliveryItems = [
    'Source code, admin credentials, hosting access, and all project files will NOT be handed over until the final payment is fully cleared.',
    'A 7-day payment window is provided after delivery confirmation.',
    'Failure to pay within 7 days post-delivery will result in a formal legal notice under Contract Act 1872.',
    'Continued non-payment beyond 30 days post-delivery will result in legal proceedings in the High Court of Sindh, Karachi, and the client\'s business details may be reported to relevant authorities under PECA 2016.',
    'SoftCode Solution reserves the right to repurpose, modify, or resell any custom-developed software for which full payment was not received.'
  ];
}