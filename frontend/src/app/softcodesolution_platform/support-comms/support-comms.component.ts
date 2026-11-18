import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  MessageSquare,
  Mail,
  Send,
  Bot,
  Users,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Sparkles,
  Megaphone,
  Settings,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  Eye,
  X,
  Lock,
  Inbox
} from 'lucide-angular';
import { BackendService, TeamMember } from '../../services/backend.service';

interface EmailCampaignRecord {
  id: string;
  campaignType: string;
  audienceSegment: string;
  templateKey: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  senderType: string;
  senderName: string;
  senderEmail: string;
  recipientsCount: number;
  recipients: Array<{ email: string; name?: string }>;
  deliveryMode: string;
  status: string;
  createdAt: string;
}

interface BotRuleItem {
  id: string;
  category: string;
  keywords: string[];
  title: string;
  replyTemplate: string;
  priority: string;
}

const PROMO_TEMPLATES = [
  {
    key: 'promo-annual-discount',
    label: 'Annual Enterprise Renewal (20% Off)',
    campaignType: 'PROMO_CAMPAIGN' as const,
    subject: 'Upgrade to SoftCode Enterprise Annual Plan — Save 20% This Month',
    bodyText:
      'Unlock unlimited offline-first branch sync, automated cloud disaster backups, and priority hardware POS driver support across all 33+ SoftCode business suites.\n\nReply to this email or open your SoftCode Dashboard to activate your 20% annual upgrade credit before the end of this month.',
    ctaLabel: 'Explore Enterprise Plans',
    ctaUrl: 'https://softcodesolution.com/#pricing'
  },
  {
    key: 'promo-new-suite',
    label: 'New Multi-Branch Cloud Sync Release',
    campaignType: 'PROMO_CAMPAIGN' as const,
    subject: 'New Release: Real-Time Dual SQLite + Cloud Sync & POS Automation',
    bodyText:
      'We have rolled out our latest platform upgrade featuring faster SQLite offline resilience, instant thermal receipt printing, and automated WhatsApp + Email customer alerts.\n\nSchedule a 15-minute walkthrough with our engineering team anytime.',
    ctaLabel: 'Book Engineering Demo',
    ctaUrl: 'https://softcodesolution.com/#contact-support-section'
  },
  {
    key: 'onboarding-welcome',
    label: 'Client Onboarding & Setup Follow-Up',
    campaignType: 'DIRECT_EMAIL' as const,
    subject: 'Your SoftCodeSolution Workspace Onboarding Checklist',
    bodyText:
      'Welcome to SoftCodeSolution! Your dedicated account team is ready to help configure your company branches, staff RBAC permissions, and thermal hardware integration.\n\nReply directly to this email with your preferred onboarding slot.',
    ctaLabel: 'Access Client Portal',
    ctaUrl: 'https://softcodesolution.com/login'
  },
  {
    key: 'custom-blank',
    label: 'Custom Manual Email',
    campaignType: 'DIRECT_EMAIL' as const,
    subject: '',
    bodyText: '',
    ctaLabel: '',
    ctaUrl: ''
  }
];

@Component({
  selector: 'app-support-comms',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './support-comms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportCommsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private backend = inject(BackendService);

  unreadCountChanged = output<number>();

  readonly icons = {
    MessageSquare,
    Mail,
    Send,
    Bot,
    Users,
    CheckCircle2,
    Clock,
    RefreshCw,
    Search,
    Sparkles,
    Megaphone,
    Settings,
    ShieldCheck,
    AlertCircle,
    UserCheck,
    Eye,
    X,
    Lock,
    Inbox
  };

  readonly promoTemplates = PROMO_TEMPLATES;
  readonly cannedReplies = [
    {
      label: 'Pricing & Demo',
      text: 'Thank you for your interest in SoftCodeSolution! Our Enterprise plan includes offline SQLite + Cloud sync, multi-branch RBAC, and 24/7 engineering support. Let us know your branch count so we can share a tailored quote.'
    },
    {
      label: 'Deposit Verified',
      text: 'Your payment / deposit receipt has been verified by our Accounts Team. Your SoftCodeSolution tenant subscription and modules are now active.'
    },
    {
      label: 'POS Driver Fix',
      text: 'Please verify your thermal printer COM/USB port in SoftCode Hardware Bridge and restart the local print spooler service. Reply here if you would like an engineer to run a remote check.'
    },
    {
      label: 'Resolved Confirm',
      text: 'We have completed the requested configuration on your workspace and confirmed live connectivity. Marking this ticket resolved—reply anytime to reopen.'
    }
  ];

  activeTab = signal<'inbox' | 'chats' | 'campaigns' | 'bot-smtp'>('inbox');

  tickets = signal<any[]>([]);
  stats = signal<any>({ total: 0, open: 0, botReplied: 0, inProgress: 0, resolved: 0, unread: 0, chats: 0 });
  ticketsLoading = signal(false);

  selectedTicket = signal<any | null>(null);
  threadMessages = signal<any[]>([]);
  threadLoading = signal(false);

  teamMembers = signal<TeamMember[]>([]);
  campaigns = signal<EmailCampaignRecord[]>([]);
  smtpConfigured = signal(false);
  previewCampaign = signal<EmailCampaignRecord | null>(null);

  botRules = signal<BotRuleItem[]>([]);
  botSaveBanner = signal('');
  botSaving = signal(false);

  smtpBanner = signal('');
  smtpSaving = signal(false);
  smtpTesting = signal(false);

  replyBusy = signal(false);
  replyBanner = signal<{ ok: boolean; text: string } | null>(null);

  campaignBusy = signal(false);
  campaignBanner = signal<{ ok: boolean; text: string } | null>(null);

  filterForm = this.fb.nonNullable.group({
    q: [''],
    status: ['ALL'],
    channel: ['ALL']
  });

  replyForm = this.fb.nonNullable.group({
    responderType: ['SUPER_ADMIN' as 'SUPER_ADMIN' | 'TEAM_MEMBER' | 'AUTO_BOT'],
    teamMemberId: [''],
    sendEmail: [true],
    internalNote: [false],
    message: ['', [Validators.required, Validators.minLength(2)]]
  });

  campaignForm = this.fb.nonNullable.group({
    campaignType: ['PROMO_CAMPAIGN' as 'DIRECT_EMAIL' | 'PROMO_CAMPAIGN'],
    audienceSegment: ['ALL_CLIENTS' as 'INDIVIDUAL' | 'ALL_CLIENTS' | 'APPROVED_CLIENTS' | 'PENDING_LEADS' | 'SPECIFIC_VERTICAL'],
    templateKey: ['promo-annual-discount'],
    directEmail: [''],
    directName: [''],
    verticalFilter: ['retail_pos'],
    senderType: ['SUPER_ADMIN' as 'SUPER_ADMIN' | 'TEAM_MEMBER'],
    teamMemberId: [''],
    subject: [PROMO_TEMPLATES[0].subject, [Validators.required]],
    bodyText: [PROMO_TEMPLATES[0].bodyText, [Validators.required]],
    ctaLabel: [PROMO_TEMPLATES[0].ctaLabel],
    ctaUrl: [PROMO_TEMPLATES[0].ctaUrl]
  });

  botForm = this.fb.nonNullable.group({
    botEnabled: [true],
    autoAckEmail: [true],
    autoReplyChat: [true],
    botName: ['SoftCode Care Bot', [Validators.required]],
    botSignature: ['SoftCodeSolution Automated Support Desk · 24/7 SLA Routing'],
    slaMinutes: [30]
  });

  smtpForm = this.fb.nonNullable.group({
    smtpHost: [''],
    smtpPort: [587],
    smtpUser: [''],
    smtpPass: [''],
    smtpSecure: [false],
    fromEmail: ['support@softcodesolution.com'],
    fromName: ['SoftCodeSolution Support Desk'],
    supportEmail: ['support@softcodesolution.com'],
    testRecipient: ['support@softcodesolution.com']
  });

  visibleTickets = computed(() => {
    const all = this.tickets();
    if (this.activeTab() === 'chats') {
      return all.filter((t) => t.sourceChannel === 'CHAT_WIDGET' || t.sourceChannel === 'CLIENT_PORTAL');
    }
    return all;
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadTickets(),
      this.loadTeamMembers(),
      this.loadBotConfig(),
      this.loadCampaigns(),
      this.loadSmtpSettings()
    ]);
  }

  setTab(tab: 'inbox' | 'chats' | 'campaigns' | 'bot-smtp'): void {
    this.activeTab.set(tab);
    if (tab === 'chats' && this.selectedTicket() && !['CHAT_WIDGET', 'CLIENT_PORTAL'].includes(this.selectedTicket()?.sourceChannel)) {
      const firstChat = this.visibleTickets()[0];
      if (firstChat) void this.selectTicket(firstChat);
    }
  }

  async loadTickets(): Promise<void> {
    this.ticketsLoading.set(true);
    try {
      const f = this.filterForm.getRawValue();
      const res = await this.backend.getAdminSupportTickets({
        status: f.status,
        channel: f.channel,
        q: f.q
      });
      const list = Array.isArray(res?.tickets) ? res.tickets : [];
      this.tickets.set(list);
      if (res?.stats) {
        this.stats.set(res.stats);
        this.unreadCountChanged.emit(Number(res.stats.unread || res.stats.open || 0));
      }
      if (!this.selectedTicket() && list.length > 0) {
        await this.selectTicket(list[0]);
      }
    } finally {
      this.ticketsLoading.set(false);
    }
  }

  async selectTicket(ticket: any): Promise<void> {
    if (!ticket?.id) return;
    this.threadLoading.set(true);
    this.replyBanner.set(null);
    try {
      const res = await this.backend.getAdminSupportTicketDetail(ticket.id);
      if (res?.ok && res?.ticket) {
        this.selectedTicket.set(res.ticket);
        this.threadMessages.set(Array.isArray(res.messages) ? res.messages : []);
        this.tickets.update((rows) =>
          rows.map((r) => (r.id === res.ticket.id ? { ...r, unreadByAdmin: false } : r))
        );
      }
    } finally {
      this.threadLoading.set(false);
    }
  }

  async loadTeamMembers(): Promise<void> {
    const res = await this.backend.getTeamMembers();
    const list: TeamMember[] = Array.isArray(res?.members) ? res.members : [];
    this.teamMembers.set(list);
    if (list.length > 0) {
      if (!this.replyForm.getRawValue().teamMemberId) {
        this.replyForm.patchValue({ teamMemberId: list[0].id });
      }
      if (!this.campaignForm.getRawValue().teamMemberId) {
        this.campaignForm.patchValue({ teamMemberId: list[0].id });
      }
    }
  }

  useCannedReply(text: string): void {
    this.replyForm.patchValue({ message: text });
  }

  async sendTicketReply(markResolved = false): Promise<void> {
    const ticket = this.selectedTicket();
    if (!ticket) return;
    if (this.replyForm.controls.message.invalid) {
      this.replyForm.controls.message.markAsTouched();
      return;
    }

    const v = this.replyForm.getRawValue();
    const tm = this.teamMembers().find((m) => m.id === v.teamMemberId);

    this.replyBusy.set(true);
    this.replyBanner.set(null);
    try {
      const res = await this.backend.replyAdminSupportTicket(ticket.id, {
        message: v.message,
        responderType: v.responderType,
        teamMemberId: v.responderType === 'TEAM_MEMBER' ? v.teamMemberId : '',
        responderName:
          v.responderType === 'TEAM_MEMBER' && tm
            ? tm.name
            : v.responderType === 'AUTO_BOT'
              ? this.botForm.getRawValue().botName
              : 'SoftCode SuperAdmin',
        responderRole:
          v.responderType === 'TEAM_MEMBER' && tm
            ? tm.role
            : v.responderType === 'AUTO_BOT'
              ? 'Automated Assistant'
              : 'Platform SuperAdmin',
        responderEmail:
          v.responderType === 'TEAM_MEMBER' && tm ? tm.email : this.smtpForm.getRawValue().supportEmail,
        sendEmail: v.internalNote ? false : v.sendEmail,
        internalNote: v.internalNote,
        updateStatus: markResolved ? 'RESOLVED' : undefined
      });

      if (!res?.ok) {
        this.replyBanner.set({ ok: false, text: res?.message || 'Failed to dispatch reply.' });
        return;
      }

      this.selectedTicket.set(res.ticket);
      this.threadMessages.set(Array.isArray(res.messages) ? res.messages : []);
      this.replyForm.patchValue({ message: '' });
      this.replyBanner.set({ ok: true, text: res.message || 'Reply delivered.' });
      await Promise.all([this.loadTickets(), this.loadCampaigns()]);
    } finally {
      this.replyBusy.set(false);
    }
  }

  async changeTicketMeta(patch: { status?: string; priority?: string; teamMemberId?: string }): Promise<void> {
    const ticket = this.selectedTicket();
    if (!ticket) return;
    const tm = patch.teamMemberId ? this.teamMembers().find((m) => m.id === patch.teamMemberId) : null;
    const res = await this.backend.updateSupportTicketStatus(ticket.id, {
      status: patch.status,
      priority: patch.priority,
      assignedTeamId: patch.teamMemberId !== undefined ? patch.teamMemberId : undefined,
      assignedTeamName: tm ? tm.name : patch.teamMemberId === '' ? '' : undefined,
      assignedTeamRole: tm ? tm.role : patch.teamMemberId === '' ? '' : undefined
    });
    if (res?.ok && res?.ticket) {
      this.selectedTicket.set(res.ticket);
      await this.loadTickets();
    }
  }

  async loadCampaigns(): Promise<void> {
    const res = await this.backend.getEmailCampaigns();
    this.campaigns.set(Array.isArray(res?.campaigns) ? res.campaigns : []);
    this.smtpConfigured.set(Boolean(res?.smtpConfigured));
  }

  applyPromoTemplate(key: string): void {
    const tpl = this.promoTemplates.find((t) => t.key === key);
    if (!tpl) return;
    this.campaignForm.patchValue({
      templateKey: tpl.key,
      campaignType: tpl.campaignType,
      subject: tpl.subject,
      bodyText: tpl.bodyText,
      ctaLabel: tpl.ctaLabel,
      ctaUrl: tpl.ctaUrl
    });
  }

  async dispatchCampaign(): Promise<void> {
    this.campaignBanner.set(null);
    if (this.campaignForm.controls.subject.invalid || this.campaignForm.controls.bodyText.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    const v = this.campaignForm.getRawValue();
    const tm = this.teamMembers().find((m) => m.id === v.teamMemberId);

    this.campaignBusy.set(true);
    try {
      const res = await this.backend.sendEmailCampaign({
        campaignType: v.campaignType,
        audienceSegment: v.audienceSegment,
        templateKey: v.templateKey,
        directEmail: v.directEmail,
        directName: v.directName,
        verticalFilter: v.verticalFilter,
        subject: v.subject,
        bodyText: v.bodyText,
        senderType: v.senderType,
        senderName: v.senderType === 'TEAM_MEMBER' && tm ? tm.name : 'SoftCode SuperAdmin',
        senderEmail: v.senderType === 'TEAM_MEMBER' && tm ? tm.email : this.smtpForm.getRawValue().fromEmail,
        ctaLabel: v.ctaLabel,
        ctaUrl: v.ctaUrl
      });

      if (!res?.ok) {
        this.campaignBanner.set({ ok: false, text: res?.message || 'Unable to send email campaign.' });
        return;
      }

      this.campaignBanner.set({ ok: true, text: res.message || 'Email dispatched.' });
      await this.loadCampaigns();
    } finally {
      this.campaignBusy.set(false);
    }
  }

  async loadBotConfig(): Promise<void> {
    const res = await this.backend.getSupportBotConfig();
    const c = res?.config;
    if (!c) return;
    this.botForm.patchValue({
      botEnabled: Boolean(c.botEnabled),
      autoAckEmail: Boolean(c.autoAckEmail),
      autoReplyChat: Boolean(c.autoReplyChat),
      botName: c.botName || 'SoftCode Care Bot',
      botSignature: c.botSignature || '',
      slaMinutes: Number(c.slaMinutes || 30)
    });
    this.botRules.set(Array.isArray(c.rules) ? c.rules : []);
  }

  updateRuleReply(ruleId: string, newReply: string): void {
    this.botRules.update((rules) =>
      rules.map((r) => (r.id === ruleId ? { ...r, replyTemplate: newReply } : r))
    );
  }

  async saveBotConfig(): Promise<void> {
    this.botSaving.set(true);
    this.botSaveBanner.set('');
    try {
      const v = this.botForm.getRawValue();
      const res = await this.backend.saveSupportBotConfig({
        ...v,
        rules: this.botRules()
      });
      this.botSaveBanner.set(res?.message || 'Auto-Bot settings updated.');
    } finally {
      this.botSaving.set(false);
    }
  }

  async loadSmtpSettings(): Promise<void> {
    const res = await this.backend.getSmtpSettings();
    const s = res?.settings;
    if (!s) return;
    this.smtpConfigured.set(Boolean(s.configured));
    this.smtpForm.patchValue({
      smtpHost: s.smtpHost || '',
      smtpPort: Number(s.smtpPort || 587),
      smtpUser: s.smtpUser || '',
      smtpPass: '',
      smtpSecure: Boolean(s.smtpSecure),
      fromEmail: s.fromEmail || 'support@softcodesolution.com',
      fromName: s.fromName || 'SoftCodeSolution Support Desk',
      supportEmail: s.supportEmail || 'support@softcodesolution.com',
      testRecipient: s.supportEmail || 'support@softcodesolution.com'
    });
  }

  async saveSmtpConfig(): Promise<void> {
    this.smtpSaving.set(true);
    this.smtpBanner.set('');
    try {
      const v = this.smtpForm.getRawValue();
      const res = await this.backend.saveSmtpSettings({
        smtpHost: v.smtpHost,
        smtpPort: v.smtpPort,
        smtpUser: v.smtpUser,
        smtpPass: v.smtpPass || undefined,
        smtpSecure: v.smtpSecure,
        fromEmail: v.fromEmail,
        fromName: v.fromName,
        supportEmail: v.supportEmail
      });
      this.smtpConfigured.set(Boolean(res?.configured));
      this.smtpBanner.set(res?.message || 'SMTP configuration saved.');
    } finally {
      this.smtpSaving.set(false);
    }
  }

  async runSmtpTest(): Promise<void> {
    this.smtpTesting.set(true);
    this.smtpBanner.set('');
    try {
      const toEmail = this.smtpForm.getRawValue().testRecipient || this.smtpForm.getRawValue().supportEmail;
      const res = await this.backend.testSmtpSettings(toEmail);
      this.smtpBanner.set(res?.message || 'SMTP test finished.');
      await this.loadCampaigns();
    } finally {
      this.smtpTesting.set(false);
    }
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  statusLabelClass(status: string): string {
    switch (String(status || '').toUpperCase()) {
      case 'OPEN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'BOT_REPLIED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'IN_PROGRESS':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  channelLabel(channel: string): string {
    if (channel === 'CHAT_WIDGET') return 'Live Chat';
    if (channel === 'CLIENT_PORTAL') return 'Client Portal';
    return 'Web Form';
  }
}
