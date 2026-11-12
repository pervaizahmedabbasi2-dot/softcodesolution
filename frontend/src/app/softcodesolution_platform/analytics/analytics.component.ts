import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Package,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  ShieldCheck,
  Clock3,
  Filter,
  Download,
} from 'lucide-angular';

interface AnalyticsMetric {
  label: string;
  value: string;
  detail: string;
  trend: string;
  positive: boolean;
  icon: any;
}

interface AnalyticsSeries {
  label: string;
  values: number[];
}

@Component({
  selector: 'app-dashboard-analytics',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
  ],
  templateUrl: './analytics.component.html',
})
export class DashboardAnalyticsComponent {
  readonly icons = {
    BarChart3,
    TrendingUp,
    Users,
    CreditCard,
    Package,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Database,
    ShieldCheck,
    Clock3,
    Filter,
    Download,
  };

  readonly periods = [
    '7 Days',
    '30 Days',
    '90 Days',
    '12 Months',
  ];

  selectedPeriod = '30 Days';

  readonly metrics: AnalyticsMetric[] = [
    {
      label: 'Active Tenants',
      value: '—',
      detail: 'Awaiting tenant analytics API',
      trend: '—',
      positive: true,
      icon: Users,
    },
    {
      label: 'Subscription Revenue',
      value: '—',
      detail: 'Awaiting billing aggregation',
      trend: '—',
      positive: true,
      icon: CreditCard,
    },
    {
      label: 'Enabled Modules',
      value: '—',
      detail: 'Awaiting module usage aggregation',
      trend: '—',
      positive: true,
      icon: Package,
    },
    {
      label: 'Platform Activity',
      value: '—',
      detail: 'Awaiting activity event stream',
      trend: '—',
      positive: true,
      icon: Activity,
    },
  ];

  readonly series: AnalyticsSeries[] = [
    {
      label: 'Tenant Growth',
      values: [24, 31, 28, 42, 47, 53, 61, 58, 66, 72, 78, 84],
    },
    {
      label: 'Module Adoption',
      values: [18, 23, 29, 34, 31, 39, 45, 48, 54, 57, 63, 69],
    },
  ];

  readonly operationalSignals = [
    {
      label: 'Data source',
      value: 'API integration pending',
      icon: Database,
    },
    {
      label: 'Authorization',
      value: 'SuperAdmin scope',
      icon: ShieldCheck,
    },
    {
      label: 'Refresh',
      value: 'Automatic refresh will connect later',
      icon: Clock3,
    },
  ];

  selectPeriod(period: string): void {
    this.selectedPeriod = period;
  }

  maxSeriesValue(values: number[]): number {
    return Math.max(...values, 1);
  }

  barHeight(value: number, values: number[]): number {
    const max = this.maxSeriesValue(values);
    return Math.max(8, Math.round((value / max) * 100));
  }
}
