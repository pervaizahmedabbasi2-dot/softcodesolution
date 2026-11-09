import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShieldCheck, Key, Lock, AlertOctagon, CheckCircle2, RefreshCcw, Shield, Terminal, Globe, UserCheck } from 'lucide-angular';

export interface AdminOperator {
  id: string;
  name: string;
  email: string;
  role: string;
  accessTier: string;
  ipWhitelist: string;
  mfaHardwareKey: string;
  lastLoginIp: string;
  status: 'ACTIVE' | 'LOCKED';
}

@Component({
  selector: 'app-dashboard-admins',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admins.component.html'
})
export class DashboardAdminsComponent implements OnInit {
  readonly icons = {
    ShieldCheck,
    Key,
    Lock,
    AlertOctagon,
    CheckCircle2,
    RefreshCcw,
    Shield,
    Terminal,
    Globe,
    UserCheck
  };

  admins: AdminOperator[] = [
    {
      id: 'adm-01',
      name: 'Root System Administrator',
      email: 'admin@softcodesolution.local',
      role: 'Platform Owner / Superadmin',
      accessTier: 'Tier-0 (Full Kernel Access)',
      ipWhitelist: '10.0.0.0/8, 192.168.1.0/24',
      mfaHardwareKey: 'YubiKey 5Ci (Serial #9812948)',
      lastLoginIp: '127.0.0.1 (Localhost / Zero Trust)',
      status: 'ACTIVE'
    },
    {
      id: 'adm-02',
      name: 'Security Operations Lead',
      email: 'sec-ops@softcode.enterprise',
      role: 'NOC & Security Controller',
      accessTier: 'Tier-1 (Security & Audit)',
      ipWhitelist: '203.0.113.45/32',
      mfaHardwareKey: 'Titan Security Key FIDO2',
      lastLoginIp: '203.0.113.45 (Frankfurt Edge)',
      status: 'ACTIVE'
    },
    {
      id: 'adm-03',
      name: 'Database Failover SRE',
      email: 'sre-lead@softcode.enterprise',
      role: 'Site Reliability Architect',
      accessTier: 'Tier-1 (Database & Shards)',
      ipWhitelist: '198.51.100.12/32',
      mfaHardwareKey: 'YubiKey Bio FIDO Edition',
      lastLoginIp: '198.51.100.12 (Singapore Cluster)',
      status: 'ACTIVE'
    }
  ];

  isRotating = false;
  rotationSuccess = false;

  ngOnInit(): void {}

  triggerEmergencyRotation(): void {
    if (!confirm('Execute cryptographic key rotation for all Tier-0 credentials?')) return;
    this.isRotating = true;
    setTimeout(() => {
      this.isRotating = false;
      this.rotationSuccess = true;
      setTimeout(() => this.rotationSuccess = false, 4000);
    }, 1500);
  }
}
