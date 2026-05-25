import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legal.component.html'
})
export class LegalComponent {
  @Input() isOpen: boolean = false;
  @Input() activeTab: string = 'terms';
  @Output() closeEvent = new EventEmitter<void>();

  closeModal() {
    this.closeEvent.emit();
  }

  printSection() {
    window.print();
  }

  sidebarItems = [
    {
      key: 'privacy',
      label: 'Privacy Policy',
      sub: 'Data & confidentiality',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>`
    },
    {
      key: 'sla',
      label: 'SLA Agreement',
      sub: 'Uptime & support',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    },
    {
      key: 'safety',
      label: 'Data Safety',
      sub: 'Encryption & security',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
    },
    {
      key: 'terms',
      label: 'Terms of Use',
      sub: 'Rules & conditions',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
    },
    {
      key: 'refund',
      label: 'Refund Policy',
      sub: 'Cancellation & billing',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    }
  ];

  slaStats = [
    { value: '99.9%', label: 'System Uptime' },
    { value: '4hr', label: 'Support Response' },
    { value: '24/7', label: 'Global Monitoring' }
  ];

  supportTiers = [
    { level: 'Critical — System Down', time: 'Within 1 hour', color: 'bg-red-500' },
    { level: 'High — Major Feature Broken', time: 'Within 4 hours', color: 'bg-orange-500' },
    { level: 'Medium — Minor Issue', time: 'Within 24 hours', color: 'bg-yellow-500' },
    { level: 'Low — General Query', time: 'Within 48 hours', color: 'bg-green-500' }
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
      phase: 'Booking Fee (30–40%)',
      desc: 'Non-refundable advance payment required to initiate the project. This reserves SoftCode Solution\'s development resources exclusively for your project.'
    },
    {
      phase: 'Milestone 1',
      desc: 'Payment due upon completion and client approval of design, wireframes, and project architecture.'
    },
    {
      phase: 'Milestone 2',
      desc: 'Payment due upon completion of core development phase and feature demonstration.'
    },
    {
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