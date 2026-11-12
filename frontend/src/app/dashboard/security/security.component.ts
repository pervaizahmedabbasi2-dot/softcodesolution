import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldCheck, AlertTriangle, Activity, ShieldAlert, Plus, X, Trash2, Download, CheckCircle2, Lock, Unlock, Globe, RefreshCcw, Camera, UserX, KeyRound, Eye } from 'lucide-angular';

export interface IpRule {
  id: string;
  cidr: string;
  type: 'allow' | 'block';
  description: string;
  addedBy: string;
  createdAt: string;
}

export interface ActiveSession {
  id: string;
  userEmail: string;
  role: string;
  ipAddress: string;
  location: string;
  device: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface IntruderLog {
  id: string;
  email: string;
  ip_address: string;
  user_agent: string;
  browser: string;
  os: string;
  device_type: string;
  city: string;
  country: string;
  attempts_count: number;
  company_name: string;
  owner_name: string;
  business_type: string;
  owner_phone: string;
  camera_snapshot_base64?: string;
  status: string; // LOCKED / UNLOCKED
  created_at: string;
}

@Component({
  selector: 'app-dashboard-security',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './security.component.html'
})
export class SecurityComponent implements OnInit {
  constructor(private cdr: ChangeDetectorRef) {}

  icons = {
    ShieldCheck,
    AlertTriangle,
    Activity,
    ShieldAlert,
    Plus,
    X,
    Trash2,
    Download,
    CheckCircle2,
    Lock,
    Unlock,
    Globe,
    RefreshCcw,
    Camera,
    UserX,
    KeyRound,
    Eye
  };

  isLockdownActive = false;
  isLockdownModalOpen = false;
  isIpModalOpen = false;
  isAuditModalOpen = false;
  selectedIntruder: IntruderLog | null = null;
  isIntruderDetailModalOpen = false;

  intruderLogs: IntruderLog[] = [];
  totalLockedAccounts = 0;
  isLoadingIntruders = false;

  ngOnInit(): void {
    this.loadIntruders();
  }

  async loadIntruders(): Promise<void> {
    this.isLoadingIntruders = true;
    try {
      const res = await fetch('/api/auth/security/intruders');
      const data = await res.json();
      if (data && data.ok) {
        this.intruderLogs = data.intruders || [];
        this.totalLockedAccounts = data.totalLocked || 0;
      }
    } catch (e) {
      console.warn('Could not load intruder logs:', e);
    } finally {
      this.isLoadingIntruders = false;
      this.cdr.detectChanges();
    }
  }

  async unlockAccount(intruder: IntruderLog): Promise<void> {
    if (!confirm(`Unlock account ${intruder.email} and restore full access for ${intruder.company_name}?`)) return;
    try {
      const res = await fetch('/api/auth/security/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: intruder.email, intruderId: intruder.id })
      });
      const data = await res.json();
      if (data.ok) {
        alert(`SUCCESS: Account ${intruder.email} unlocked! Access restored.`);
        await this.loadIntruders();
      }
    } catch (e) {
      alert('Failed to unlock account.');
    }
  }

  async lockAccountManually(email: string): Promise<void> {
    try {
      const res = await fetch('/api/auth/security/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Account ${email} locked.`);
        await this.loadIntruders();
      }
    } catch (e) {}
  }

  async resetPasswordForIntruder(intruder: IntruderLog): Promise<void> {
    const newPass = prompt(`Enter new password for ${intruder.email}:`, 'Pervaiz786!Pass');
    if (!newPass) return;

    try {
      const res = await fetch('/api/auth/security/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: intruder.email, newPassword: newPass })
      });
      const data = await res.json();
      if (data.ok) {
        alert(`SUCCESS: Password reset for ${intruder.email} to: ${newPass}. Account unlocked.`);
        await this.loadIntruders();
      }
    } catch (e) {
      alert('Password reset failed.');
    }
  }

  viewIntruderDetails(intruder: IntruderLog): void {
    this.selectedIntruder = intruder;
    this.isIntruderDetailModalOpen = true;
    this.cdr.detectChanges();
  }

  closeIntruderDetailModal(): void {
    this.isIntruderDetailModalOpen = false;
    this.selectedIntruder = null;
  }

  newIpRule = {
    cidr: '',
    type: 'block' as 'allow' | 'block',
    description: ''
  };

  ipRules: IpRule[] = [
    {
      id: 'rule_01',
      cidr: '198.51.100.0/24',
      type: 'block',
      description: 'Automated Bot Credential Stuffing Origin',
      addedBy: 'WAF Auto-Rule',
      createdAt: '2026-09-24'
    },
    {
      id: 'rule_02',
      cidr: '203.0.113.15/32',
      type: 'block',
      description: 'Brute Force SSH & API Probing',
      addedBy: 'Admin (Security Ops)',
      createdAt: '2026-09-22'
    }
  ];

  activeSessions: ActiveSession[] = [
    {
      id: 'sess_1',
      userEmail: 'admin@softcodesolution.local',
      role: 'Super Admin',
      ipAddress: '127.0.0.1 (Localhost / Preview)',
      location: 'Singapore (Edge Node)',
      device: 'Chrome 128 / Linux x64',
      lastActive: 'Active now',
      isCurrent: true
    }
  ];

  toggleLockdownModal() {
    this.isLockdownModalOpen = !this.isLockdownModalOpen;
  }

  confirmLockdown() {
    this.isLockdownActive = !this.isLockdownActive;
    this.isLockdownModalOpen = false;
  }

  openIpModal() {
    this.newIpRule = { cidr: '', type: 'block', description: '' };
    this.isIpModalOpen = true;
  }

  closeIpModal() {
    this.isIpModalOpen = false;
  }

  saveIpRule() {
    if (!this.newIpRule.cidr) return;
    this.ipRules.unshift({
      id: 'rule_' + Date.now().toString(36),
      cidr: this.newIpRule.cidr,
      type: this.newIpRule.type,
      description: this.newIpRule.description || 'Custom administrative rule',
      addedBy: 'Super Admin',
      createdAt: 'Just now'
    });
    this.closeIpModal();
  }

  removeIpRule(id: string) {
    this.ipRules = this.ipRules.filter(r => r.id !== id);
  }

  revokeSession(sessionId: string) {
    this.activeSessions = this.activeSessions.filter(s => s.id !== sessionId);
  }

  openAuditModal() {
    this.isAuditModalOpen = true;
  }

  closeAuditModal() {
    this.isAuditModalOpen = false;
  }

  downloadAuditJson() {
    const data = {
      exportTimestamp: new Date().toISOString(),
      platform: 'SoftCodeSolution Multi-Tenant Cloud',
      securityStatus: this.isLockdownActive ? 'LOCKDOWN' : 'NOMINAL',
      intruderLogs: this.intruderLogs,
      ipRules: this.ipRules
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-intruder-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
