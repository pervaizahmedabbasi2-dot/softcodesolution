import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule
} from 'lucide-angular';

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
}
