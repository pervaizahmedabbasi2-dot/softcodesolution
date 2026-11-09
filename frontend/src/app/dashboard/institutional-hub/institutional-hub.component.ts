import { Component, OnInit, Input, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  GraduationCap,
  Users,
  Heart,
  BarChart3,
  Search,
  Plus,
  Filter,
  ChevronRight,
  MoreVertical,
  Activity,
  Calendar,
  Wallet,
  ShieldCheck,
  Globe,
  Zap,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Layers,
  Settings,
  Bell,
  Cpu,
  Monitor,
  Building2,
  BookOpen,
  Trophy,
  Users2
} from 'lucide-angular';

export type InstitutionalTab = 'nexus' | 'intelligence' | 'human-capital' | 'infrastructure' | 'security';

@Component({
  selector: 'app-dashboard-institutional-hub',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './institutional-hub.component.html',
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
    }
    .text-gradient {
      background: linear-gradient(135deg, #1D1D1F 0%, #4338CA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  `]
})
export class DashboardInstitutionalHubComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  private _activeTab: string = 'nexus';
  @Input() 
  set activeTab(val: string) {
    if (!val) return;
    const v = val.toLowerCase();
    if (v === 'overview') this.currentTab = 'nexus';
    else if (v.includes('student') || v.includes('human')) this.currentTab = 'human-capital';
    else if (v.includes('fee') || v.includes('intel')) this.currentTab = 'intelligence';
    else if (v.includes('attendance') || v.includes('nexus')) this.currentTab = 'nexus';
    else if (v.includes('security')) this.currentTab = 'security';
    else if (v.includes('infrastructure')) this.currentTab = 'infrastructure';
  }
  currentTab: InstitutionalTab = 'nexus';
  searchQuery: string = '';
  isLive: boolean = true;

  // Billion Dollar Enterprise Data
  metrics = [
    { label: 'Global Enrollment', value: '1,240', trend: '+12.5%', trendUp: true, icon: Users2, color: 'indigo' },
    { label: 'Asset Valuation', value: '₨ 8.4B', trend: '+4.2%', trendUp: true, icon: Wallet, color: 'emerald' },
    { label: 'Operational Efficiency', value: '98.4%', trend: 'Steady', trendUp: true, icon: Zap, color: 'blue' },
    { label: 'Security Integrity', value: 'Grade A+', trend: 'Verified', trendUp: true, icon: ShieldCheck, color: 'purple' }
  ];

  workflowSteps = [
    { id: 1, label: 'Intake', status: 'completed' },
    { id: 2, label: 'Nurture', status: 'active' },
    { id: 3, label: 'Certify', status: 'pending' },
    { id: 4, label: 'Alumni', status: 'pending' }
  ];

  announcements = [
    { title: 'Global Accreditation Renewed', type: 'success', time: '2h ago' },
    { title: 'Q4 Financial Audit Scheduled', type: 'info', time: '5h ago' },
    { title: 'Campus Infrastructure Expansion Phase II', type: 'warning', time: '1d ago' }
  ];

  recentEvents = [
    { title: 'Annual Convocation 2026', date: 'Oct 24', location: 'Grand Hall', status: 'Confirmed' },
    { title: 'STEM Innovation Fair', date: 'Nov 02', location: 'Lab Wing C', status: 'Planning' },
    { title: 'Alumni Gala Night', date: 'Dec 15', location: 'Corporate Plaza', status: 'Pending' }
  ];

  constructor() {}

  ngOnInit(): void {
    if (this.activeTab) {
      this.setTab(this.activeTab as InstitutionalTab);
    }
  }

  setTab(tab: any) {
    this.currentTab = tab as InstitutionalTab;
    this.cdr.detectChanges();
  }

  formatTabLabel(tab: string): string {
    return tab.replace(/-/g, ' ');
  }

  getTabIcon(tab: string) {
    switch(tab) {
      case 'nexus': return LayoutDashboard;
      case 'intelligence': return BarChart3;
      case 'human-capital': return Users;
      case 'infrastructure': return Building2;
      case 'security': return ShieldCheck;
      default: return Layers;
    }
  }
}
