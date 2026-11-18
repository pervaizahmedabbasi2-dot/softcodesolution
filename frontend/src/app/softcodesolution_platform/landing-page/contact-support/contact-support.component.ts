import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  Mail,
  Clock,
  Send,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  Headset,
  UserCheck,
  Bot,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Copy
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';

export interface SupportMessageItem {
  id: string;
  ticketId: string;
  senderType: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: string;
  messageBody: string;
  deliveryChannel?: string;
  emailDeliveryStatus?: string;
  createdAt: string;
}

export interface SupportTicketSummary {
  id: string;
  ticketNo: string;
  requesterName: string;
  requesterEmail: string;
  companyName?: string;
  subjectCategory: string;
  subjectTitle: string;
  sourceChannel: string;
  priority: string;
  status: string;
  assignedTeamName?: string;
  assignedTeamRole?: string;
  lastRepliedByType?: string;
  lastRepliedByName?: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-contact-support',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './contact-support.component.html',
  styleUrls: ['./contact-support.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactSupportComponent {
  private fb = inject(FormBuilder);
  private backend = inject(BackendService);

  readonly icons = {
    Mail,
    Clock,
    Send,
    MessageSquare,
    Search,
    CheckCircle2,
    AlertCircle,
    Headset,
    UserCheck,
    Bot,
    ShieldCheck,
    ArrowRight,
    RefreshCw,
    Copy
  };

  activeMode = signal<'ticket' | 'chat' | 'track'>('ticket');

  isSubmitting = signal(false);
  submitError = signal('');
  submittedTicket = signal<SupportTicketSummary | null>(null);
  submittedBotReply = signal<SupportMessageItem | null>(null);
  submittedEmailStatus = signal<{ deliveryStatus?: string; smtpConfigured?: boolean } | null>(null);
  copiedTicketNo = signal(false);

  chatTicket = signal<SupportTicketSummary | null>(null);
  chatMessages = signal<SupportMessageItem[]>([]);
  chatBusy = signal(false);
  chatError = signal('');
  chatEscalated = signal(false);

  trackBusy = signal(false);
  trackError = signal('');
  trackedTicket = signal<SupportTicketSummary | null>(null);
  trackedMessages = signal<SupportMessageItem[]>([]);
  followUpBusy = signal(false);

  readonly quickChatPrompts = [
    'Need pricing & setup for Retail POS + Cloud Sync',
    'Thermal printer or barcode scanner driver issue',
    'Deposit payment slip verification pending',
    'Login or multi-branch sync error in dashboard'
  ];

  supportForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    companyName: [''],
    subject: ['saas-rental', [Validators.required]],
    priority: ['NORMAL', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  chatForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(2)]]
  });

  trackForm = this.fb.nonNullable.group({
    ticketNo: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [Validators.required, Validators.email]]
  });

  followUpForm = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(2)]]
  });

  setMode(mode: 'ticket' | 'chat' | 'track'): void {
    this.activeMode.set(mode);
  }

  async onSubmitTicket(): Promise<void> {
    this.submitError.set('');
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const val = this.supportForm.getRawValue();
      const res = await this.backend.submitSupportTicket({
        ...val,
        sourceChannel: 'WEB_FORM'
      });

      if (!res?.ok || !res?.ticket) {
        this.submitError.set(res?.message || 'Unable to submit your ticket right now. Please try again.');
        return;
      }

      this.submittedTicket.set(res.ticket);
      this.submittedBotReply.set(res.botReply || null);
      this.submittedEmailStatus.set(res.emailStatus || null);

      this.trackForm.patchValue({
        ticketNo: res.ticket.ticketNo,
        email: res.ticket.requesterEmail
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  resetTicketForm(): void {
    this.submittedTicket.set(null);
    this.submittedBotReply.set(null);
    this.submittedEmailStatus.set(null);
    this.submitError.set('');
    this.supportForm.reset({
      name: '',
      email: '',
      phone: '',
      companyName: '',
      subject: 'saas-rental',
      priority: 'NORMAL',
      message: ''
    });
  }

  openSubmittedInTracker(): void {
    const t = this.submittedTicket();
    if (!t) return;
    this.trackForm.patchValue({
      ticketNo: t.ticketNo,
      email: t.requesterEmail
    });
    this.activeMode.set('track');
    void this.onTrackTicket();
  }

  async copyTicketId(ticketNo: string): Promise<void> {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(ticketNo);
      }
      this.copiedTicketNo.set(true);
      setTimeout(() => this.copiedTicketNo.set(false), 2000);
    } catch {}
  }

  useQuickChatPrompt(promptText: string): void {
    this.chatForm.patchValue({ message: promptText });
  }

  async onSendChat(): Promise<void> {
    this.chatError.set('');
    const val = this.chatForm.getRawValue();

    if (!this.chatTicket()) {
      if (this.chatForm.get('name')?.invalid || this.chatForm.get('email')?.invalid) {
        this.chatForm.markAllAsTouched();
        return;
      }
    }

    if (!val.message.trim()) {
      this.chatForm.get('message')?.markAsTouched();
      return;
    }

    this.chatBusy.set(true);
    try {
      const existing = this.chatTicket();
      const res = await this.backend.sendSupportChat({
        ticketId: existing?.id,
        name: existing?.requesterName || val.name,
        email: existing?.requesterEmail || val.email,
        message: val.message.trim(),
        subjectCategory: 'chat-issue'
      });

      if (!res?.ok || !res?.ticket) {
        this.chatError.set(res?.message || 'Unable to send chat message.');
        return;
      }

      this.chatTicket.set(res.ticket);
      this.chatMessages.set(Array.isArray(res.messages) ? res.messages : []);
      this.chatForm.patchValue({ message: '' });
      this.trackForm.patchValue({
        ticketNo: res.ticket.ticketNo,
        email: res.ticket.requesterEmail
      });
    } finally {
      this.chatBusy.set(false);
    }
  }

  async escalateChatToHuman(): Promise<void> {
    const existing = this.chatTicket();
    if (!existing) return;
    this.chatBusy.set(true);
    try {
      const res = await this.backend.sendSupportChat({
        ticketId: existing.id,
        name: existing.requesterName,
        email: existing.requesterEmail,
        escalateToHuman: true,
        message: 'Customer requested live engineering escalation from website chat.'
      });
      if (res?.ok) {
        this.chatTicket.set(res.ticket);
        this.chatMessages.set(Array.isArray(res.messages) ? res.messages : []);
        this.chatEscalated.set(true);
      }
    } finally {
      this.chatBusy.set(false);
    }
  }

  async refreshChatThread(): Promise<void> {
    const t = this.chatTicket();
    if (!t) return;
    const res = await this.backend.trackSupportTicket(t.ticketNo, t.requesterEmail);
    if (res?.ok) {
      this.chatTicket.set(res.ticket);
      this.chatMessages.set(Array.isArray(res.messages) ? res.messages : []);
    }
  }

  async onTrackTicket(): Promise<void> {
    this.trackError.set('');
    if (this.trackForm.invalid) {
      this.trackForm.markAllAsTouched();
      return;
    }

    this.trackBusy.set(true);
    try {
      const val = this.trackForm.getRawValue();
      const res = await this.backend.trackSupportTicket(val.ticketNo, val.email);
      if (!res?.ok || !res?.ticket) {
        this.trackedTicket.set(null);
        this.trackedMessages.set([]);
        this.trackError.set(res?.message || 'Ticket not found. Verify your Ticket ID and email.');
        return;
      }
      this.trackedTicket.set(res.ticket);
      this.trackedMessages.set(Array.isArray(res.messages) ? res.messages : []);
    } finally {
      this.trackBusy.set(false);
    }
  }

  async onSendFollowUp(): Promise<void> {
    const ticket = this.trackedTicket();
    if (!ticket) return;
    if (this.followUpForm.invalid) {
      this.followUpForm.markAllAsTouched();
      return;
    }
    this.followUpBusy.set(true);
    try {
      const res = await this.backend.replyPublicSupportTicket({
        ticketNo: ticket.ticketNo,
        email: ticket.requesterEmail,
        message: this.followUpForm.getRawValue().message
      });
      if (res?.ok) {
        this.trackedTicket.set(res.ticket);
        this.trackedMessages.set(Array.isArray(res.messages) ? res.messages : []);
        this.followUpForm.reset({ message: '' });
      }
    } finally {
      this.followUpBusy.set(false);
    }
  }

  formatTime(iso: string): string {
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

  senderBadgeText(msg: SupportMessageItem): string {
    if (msg.senderType === 'AUTO_BOT') return 'Auto-Bot';
    if (msg.senderType === 'TEAM_MEMBER') return msg.senderRole ? `Team · ${msg.senderRole}` : 'Support Team';
    if (msg.senderType === 'SUPER_ADMIN') return 'SuperAdmin';
    return 'You';
  }
}