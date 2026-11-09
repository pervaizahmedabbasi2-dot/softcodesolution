import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldCheck, AlertTriangle, Activity, ShieldAlert, Plus, X, Trash2, Download, CheckCircle2, Lock, Unlock, Globe, RefreshCcw } from 'lucide-angular';

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

@Component({
  selector: 'app-dashboard-security',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './security.component.html'
})
export class SecurityComponent {
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
    RefreshCcw
  };

  isLockdownActive = false;
  isLockdownModalOpen = false;
  isIpModalOpen = false;
  isAuditModalOpen = false;

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
    },
    {
      id: 'rule_03',
      cidr: '10.0.0.0/8',
      type: 'allow',
      description: 'Internal VPC Cluster & Gateway Mesh',
      addedBy: 'System Core',
      createdAt: '2026-01-01'
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
    },
    {
      id: 'sess_2',
      userEmail: 'security.lead@softcodesolution.io',
      role: 'Security Engineer',
      ipAddress: '192.0.2.45',
      location: 'Frankfurt, Germany',
      device: 'Firefox 129 / macOS',
      lastActive: '12 minutes ago',
      isCurrent: false
    },
    {
      id: 'sess_3',
      userEmail: 'audit@fintechcorp.global',
      role: 'Auditor (Read-Only)',
      ipAddress: '198.51.100.89',
      location: 'New York, USA',
      device: 'Safari 18 / iOS',
      lastActive: '1 hour ago',
      isCurrent: false
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
    this.newIpRule = {
      cidr: '',
      type: 'block',
      description: ''
    };
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
      activeThreatsBlocked24h: 14293,
      wafRulesTriggered: 892,
      ipRules: this.ipRules,
      activeSessions: this.activeSessions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
