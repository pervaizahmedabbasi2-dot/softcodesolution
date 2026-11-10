import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { LucideAngularModule, Globe, CheckCircle2, ShieldCheck, Download, X, FileCheck, AlertTriangle } from 'lucide-angular';

export interface ResidencyRegion {
  id: string;
  name: string;
  flag: string;
  framework: string;
  tenantsCount: number;
  status: 'Active' | 'Nominal';
  latencyMs: number;
}
=======
import { LucideAngularModule } from 'lucide-angular';
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b

@Component({
  selector: 'app-dashboard-compliance',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './compliance.component.html'
})
export class ComplianceComponent {
<<<<<<< HEAD
  icons = {
    Globe,
    CheckCircle2,
    ShieldCheck,
    Download,
    X,
    FileCheck,
    AlertTriangle
  };

  isReportModalOpen = false;
  isGeneratingReport = false;
  reportReady = false;

  regions: ResidencyRegion[] = [
    {
      id: 'reg_eu',
      name: 'EU-Central (Frankfurt)',
      flag: '🇪🇺',
      framework: 'GDPR Compliant · ISO 27018',
      tenantsCount: 4291,
      status: 'Active',
      latencyMs: 14
    },
    {
      id: 'reg_us',
      name: 'US-East (N. Virginia)',
      flag: '🇺🇸',
      framework: 'SOC2 Type II · HIPAA Readiness',
      tenantsCount: 9102,
      status: 'Active',
      latencyMs: 22
    },
    {
      id: 'reg_ap',
      name: 'AP-Southeast (Singapore)',
      flag: '🇸🇬',
      framework: 'MAS TRM · Personal Data Protection',
      tenantsCount: 2840,
      status: 'Active',
      latencyMs: 18
    }
  ];

  frameworks = [
    { name: 'SOC 2 Type II Certified', validity: 'Valid until Dec 2026', auditor: 'PricewaterhouseCoopers (PwC)', status: 'Verified' },
    { name: 'GDPR Privacy Shield Compliance', validity: 'Continuous Verification', auditor: 'EU Data Protection Board', status: 'Verified' },
    { name: 'HIPAA Health Data Readiness', validity: 'Annual Attestation', auditor: 'Coalfire Security Labs', status: 'Verified' },
    { name: 'ISO/IEC 27001:2022 ISMS', validity: 'Certified Scope: Global Cloud', auditor: 'BSI Assurance UK', status: 'Verified' }
  ];

  openReportModal() {
    this.isReportModalOpen = true;
    this.reportReady = false;
    this.isGeneratingReport = true;
    setTimeout(() => {
      this.isGeneratingReport = false;
      this.reportReady = true;
    }, 800);
  }

  closeReportModal() {
    this.isReportModalOpen = false;
  }

  downloadComplianceCertificate() {
    const report = {
      title: 'SoftCodeSolution Enterprise Multi-Tenant Compliance Attestation',
      generatedDate: new Date().toISOString(),
      complianceScore: '100% Pass',
      frameworks: this.frameworks,
      regions: this.regions,
      cryptographicSignoff: 'RSA-4096 / Root CA Validated'
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-attestation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
=======
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
}
