import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule
} from 'lucide-angular';
import { LocalizationService } from '../../services/localization.service';

type OverviewStatusTab =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'all';

interface DashboardActivity{
  title:string;
  detail:string;
  level:'success'|'info'|'warning';
  time:string;
}


@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
  ],
  templateUrl: './overview.component.html',
  styles: [':host{display:block;width:100%;}']
})
export class DashboardOverviewComponent {
  // SCS_DASHBOARD_OVERVIEW_COMPONENT_V1
  readonly loc = inject(LocalizationService);

  @Input() activeView = 'home';
  @Input() userRole = '';
  @Input() userName = '';

  @Input() clientTotals: any = {
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0
  };

  @Input() autoRefreshCountdown = 0;
  @Input() categories: any[] = [];
  @Input() icons: any = {};
  @Input() isClientsLoading = false;
  @Input() allSuperadminClients: any[] = [];
  @Input() lastRefreshedAt: any = null;

  // SCS_PHASE6796_TRIPLE_BACKUP_INPUT
  @Input() tripleBackupSummary: any = null;

  @Input() activityFeed: DashboardActivity[] = [];

  @Input() systemHealth: any[] = [];

  // SCS_PHASE632_ALL_MODULES_MANAGER_INPUT
  @Input() modules:{
    code:string;
    label:string;
    route?:string;
    icon?:string;
    category?:string;
    pinned?:boolean;
    hidden?:boolean;
  }[]=[];

  @Output() manageModules=new EventEmitter<void>();
  // SCS_PHASE637_NOTIFY_DASHBOARD

  @Input() quickActions:{
    code:string;
    label:string;
    route?:string;
    icon?:string;
    pinned?:boolean;
    hidden?:boolean;
  }[]=[];

  @Input() favoriteModules: {
    code:string;
    label:string;
  }[] = [];

  moduleSearch = '';

  // Executive Charts Data (Matching User Dashboard Quality)
  monthlyMrrChartData = [
    { month: 'May', amount: 24000, heightPct: 52, label: '$24k' },
    { month: 'Jun', amount: 29000, heightPct: 62, label: '$29k' },
    { month: 'Jul', amount: 33500, heightPct: 72, label: '$33.5k' },
    { month: 'Aug', amount: 38200, heightPct: 82, label: '$38.2k' },
    { month: 'Sep', amount: 44600, heightPct: 92, label: '$44.6k' },
    { month: 'Oct', amount: 52400, heightPct: 100, label: '$52.4k' }
  ];

  tenantsByVerticalDistribution = [
    { vertical: 'School & College LMS', count: 14, color: 'bg-indigo-600', pct: 85 },
    { vertical: 'Retail POS & Store', count: 11, color: 'bg-emerald-500', pct: 70 },
    { vertical: 'Clinic & Healthcare', count: 9, color: 'bg-rose-500', pct: 58 },
    { vertical: 'Restaurant & Cafe', count: 8, color: 'bg-amber-500', pct: 52 },
    { vertical: 'Property & Real Estate', count: 7, color: 'bg-blue-500', pct: 45 },
    { vertical: 'Travel & Tourism Hub', count: 5, color: 'bg-purple-500', pct: 35 }
  ];

  // SCS_PHASE655_SINGLE_MANAGER
  // Dashboard owns the single Module Manager instance.
  openModuleManager(): void {
    this.manageModules.emit();
  }

  // SCS_PHASE633B_LIVE_QUICK_ACTIONS


  // SCS_QUICK_ACTIONS_SEARCH_V1
  get filteredQuickActions(){

    const q=this.moduleSearch.trim().toLowerCase();

    if(!q){
      return this.quickActions.filter(x=>!x.hidden);
    }

    return this.quickActions.filter(x=>
      !x.hidden &&
      x.label.toLowerCase().includes(q)
    );

  }




  @Input() getGreeting:
    () => string =
      () => '';

  @Input() getInitials:
    (client: any) => string =
      () => '';

  @Output() navigate =
    new EventEmitter<string>();

  @Output() statusTabChange =
    new EventEmitter<OverviewStatusTab>();

  @Output() clientOpen =
    new EventEmitter<any>();

  navigateTo(view: string): void {
    this.navigate.emit(view);
  }

  changeClientStatusTab(
    tab: OverviewStatusTab
  ): void {
    this.statusTabChange.emit(tab);
  }

  openClientDetail(client: any): void {
    this.clientOpen.emit(client);
  }













  getFavoriteModules(){

    if(this.favoriteModules.length){
      return this.favoriteModules;
    }

    return [
      {code:'dashboard',label:'Dashboard'},
      {code:'rbac',label:'RBAC'},
      {code:'payments-sys-list',label:'Payments'},
      {code:'all-tenants',label:'Clients'}
    ];

  }

  getNotifications(): any[]{

    return [
      {
        title:'System Ready',
        detail:'Enterprise dashboard initialized',
        level:'success'
      },
      {
        title:'RBAC',
        detail:'Permission manager active',
        level:'info'
      },
      {
        title:'Payments',
        detail:'Gateway integration pending',
        level:'warning'
      }
    ];

  }

  getStatistics(): any[]{

    return [
      {
        label:'Clients',
        value:this.clientTotals?.all ?? 0
      },
      {
        label:'Pending',
        value:this.clientTotals?.pending ?? 0
      },
      {
        label:'Approved',
        value:this.clientTotals?.approved ?? 0
      },
      {
        label:'Rejected',
        value:this.clientTotals?.rejected ?? 0
      }
    ];

  }

  getMonitoringStatus(): any[] {

    return [
      {
        name:'Authentication',
        status:'Live'
      },
      {
        name:'Multi-Tenant Core',
        status:'Live'
      },
      {
        name:'Payments',
        status:'Development'
      },
      {
        name:'License',
        status:'Development'
      },
      {
        name:'API Gateway',
        status:'Development'
      }
    ];

  }

  getSystemHealth(): any[]{

    if(this.systemHealth?.length){
      return this.systemHealth;
    }

    return [
      {
        name:'Backend',
        status:'Live',
        level:'success'
      },
      {
        name:'Database',
        status:'Live',
        level:'success'
      },
      {
        name:'API',
        status:'Live',
        level:'success'
      }
    ];

  }

  getActivityFeed(): DashboardActivity[]{

    if(this.activityFeed.length){
      return this.activityFeed;
    }

    return [
      {
        title:'New client registered',
        detail:'Awaiting backend integration',
        level:'success',
        time:'Just now'
      },
      {
        title:'Invoice generated',
        detail:'Awaiting backend integration',
        level:'info',
        time:'5 min ago'
      },
      {
        title:'RBAC updated',
        detail:'Awaiting backend integration',
        level:'warning',
        time:'12 min ago'
      }
    ];

  }

  filteredCategories(): any[] {

    const q=this.moduleSearch.trim().toLowerCase();

    if(!q){
      return this.categories;
    }

    return this.categories.filter((c:any)=>
      (c.label||'').toLowerCase().includes(q) ||
      (c.description||'').toLowerCase().includes(q)
    );

  }

  getCategoryLucideIcon(cat: any): any {
    if (!cat) return this.icons?.Layers || 'Layers';
    return cat.icon || this.icons?.Layers || 'Layers';
  }

  getClientKpis(): any[] {
    return [
      {
        label: 'Total Records',
        value: '1,284',
        badge: '+8.4%',
        badgeColor: 'text-emerald-500',
        subtext: 'Across assigned modules',
        icon: this.icons?.Files || 'Files'
      },
      {
        label: 'Active Modules',
        value: this.categories?.length || 6,
        badge: 'Operational',
        badgeColor: 'text-emerald-500',
        subtext: 'Configured business tools',
        icon: this.icons?.Layers || 'Layers'
      },
      {
        label: 'Pending Tasks',
        value: '4',
        badge: 'In Review',
        badgeColor: 'text-amber-500',
        subtext: 'Awaiting client action',
        icon: this.icons?.Clock || 'Clock'
      },
      {
        label: 'Monthly Volume',
        value: '$24,850',
        badge: '+14.2%',
        badgeColor: 'text-emerald-500',
        subtext: 'Billing & operations',
        icon: this.icons?.TrendingUp || 'TrendingUp'
      }
    ];
  }

  getClientActivityFeed(): any[] {
    return [
      {
        title: 'Invoice #INV-2049 generated',
        detail: 'Billing module • Amount $1,420.00 confirmed and logged',
        level: 'success',
        time: '10 min ago'
      },
      {
        title: 'Customer account updated',
        detail: 'CRM profile updated with verified contact details',
        level: 'info',
        time: '45 min ago'
      },
      {
        title: 'Monthly reconciliation report compiled',
        detail: 'Financial records finalized and ready for export',
        level: 'success',
        time: '2 hours ago'
      },
      {
        title: 'Operational inventory checked',
        detail: 'Stock level refreshed across active product catalog',
        level: 'info',
        time: '5 hours ago'
      },
      {
        title: 'Scheduled automated backup verified',
        detail: 'Routine encrypted client workspace snapshot secured',
        level: 'success',
        time: 'Yesterday'
      }
    ];
  }

  quickAddPrimaryRecord(): void {
    if (this.categories && this.categories.length > 0) {
      this.navigateTo(this.categories[0].id + '-add');
    } else {
      this.navigateTo('home');
    }
  }

  viewPrimaryRecords(): void {
    if (this.categories && this.categories.length > 0) {
      this.navigateTo(this.categories[0].id + '-list');
    } else {
      this.navigateTo('home');
    }
  }
}
