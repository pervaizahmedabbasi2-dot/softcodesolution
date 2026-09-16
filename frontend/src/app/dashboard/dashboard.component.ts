import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ViewContainerRef } from '@angular/core';

import { SecurityComponent } from './security/security.component';
import { FeatureFlagsComponent } from './feature-flags/feature-flags.component';
import { ComplianceComponent } from './compliance/compliance.component';
import { WebhooksComponent } from './webhooks/webhooks.component';
import { GlobalEdgeComponent } from './global-edge/global-edge.component';
import { DashboardAnalyticsComponent } from './analytics/analytics.component';

import { CommonModule } from '@angular/common';
import { DashboardOverviewComponent } from './overview/overview.component';
import { DashboardAllClientsComponent } from './all-clients/all-clients.component';
import { DashboardPlansPricingComponent } from './plans-pricing/plans-pricing.component';
import { DashboardModuleCatalogComponent } from './module-catalog/module-catalog.component';
import { DashboardSystemHealthComponent } from './system-health/system-health.component';
import { DashboardSaasControlComponent } from './saas-control/saas-control.component';
import { DashboardRbacComponent } from './rbac/rbac.component';
import { DashboardApiGatewayComponent } from './api-gateway/api-gateway.component';
import { DashboardPaymentsComponent } from './payments/payments.component';
import { ModuleManagerComponent } from './components/module-manager/module-manager.component';
import { Router } from '@angular/router';
import { DashboardApiService } from './services/dashboard-api.service';
import { ModuleRegistryService } from './services/module-registry.service';
import { LucideAngularModule, Grip, Bell, CheckCircle2, AlertTriangle, LayoutDashboard, User, Image, Layers, Briefcase, Cpu, Users, Files, HelpCircle, Folder, CreditCard, BookOpen, Plus, Palette, Building2, Key, WalletCards, ShieldCheck, Network, BarChart3, Globe, RefreshCcw, Mail, Settings, MenuSquare, MessageSquare, LogOut, Search, X, XCircle, Clock, Database, ChevronDown, Eye, Pin, EyeOff, Copy, MoreVertical, MoreHorizontal, Pencil, TrendingUp, UserCheck, UserX, UserCog, Activity, Zap, ArrowUpRight, ArrowDownRight, Sparkles, CircleDot, Package, Server, Lock, BarChart2, PieChart, LineChart, Calendar, Star, Rocket, Shield, ShieldAlert, Wifi, WifiOff, Info, MapPin, Hash, Briefcase as BriefcaseIcon } from 'lucide-angular';

type BackendRole = 'super_admin' | 'client_admin' | 'client_user' | 'support';
type UiRole = 'SUPER_ADMIN' | 'CLIENT';
type ClientStatusTab = 'pending' | 'approved' | 'rejected' | 'all';

type PhaseTag = 'LIVE' | 'SUPPORT' | 'FUTURE';

interface AuthMeResponse {
  ok: boolean;
  redirect?: string;
  user?: { id: string; tenant_id: string; email: string; role: BackendRole; status: string };
}

interface DashboardCategory {
  id: string;
  label: string;
  icon: any;
  list: string;
  add: string;
  roles: BackendRole[];
  description: string;
  color: string;
  phase?: PhaseTag;
}

interface SuperadminClient {
  id: string;
  full_name: string;
  email: string;
  country_code?: string;
  phone?: string;
  company_name: string;
  business_type: string;
  business_size?: string;
  country: string;
  city: string;
  state?: string;
  address?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  tenant_id: string;
  auth_role: string;
  auth_status: string;
  plan_name: string;
  subscription_status: string;
  billing_cycle?: string;
  amount?: number;
  license_status?: string;
  enabled_modules?: number;
}

interface TenantModule {
  id: string;
  name: string;
  category: string;
  price_monthly: number;
  price_yearly: number;
  route: string;
  icon: string;
  enabled: boolean;
  source: string;
}

interface CatalogPlan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  status: string;
  modules: { id: string; name: string }[];
}

interface TenantSubscriptionSummary {
  status: string;
  plan_id: string;
  billing_cycle: string;
  plan_base_amount?: number;
  module_addons_amount?: number;
  amount: number;
}

interface SuperadminClientsResponse {
  ok: boolean;
  clients: SuperadminClient[];
  count: number;
  total: number;
  totals: { pending: number; approved: number; rejected: number; all: number };
  limit: number;
  offset: number;
  has_more: boolean;
  message?: string;
}

export const dashboardIcons = { Grip,
    Bell,
    CheckCircle2,
    AlertTriangle,
    LayoutDashboard,
    User,
    Image,
    Layers,
    Briefcase,
    Cpu,
    Users,
    Files,
    HelpCircle,
    Folder,
    CreditCard,
    BookOpen,
    Plus,
    Palette,
    Building2,
    Key,
    WalletCards,
    ShieldCheck,
    Network,
    BarChart3,
    Globe,
    RefreshCcw,
    Mail,
    Settings,
    MenuSquare,
    MessageSquare,
    LogOut,
    Search,
    X,
    XCircle,
    Clock,
    Database,
    ChevronDown,
    Eye, Pin, EyeOff, Copy, MoreVertical, MoreHorizontal,
    Pencil,
    TrendingUp,
    UserCheck,
    UserX,
    UserCog,
    Activity,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    CircleDot,
    Package,
    Server,
    Lock,
    BarChart2,
    PieChart,
    LineChart,
    Calendar,
    Star,
    Rocket,
    Shield,
    ShieldAlert,
    Wifi,
    WifiOff,
    Info,
    MapPin,
    Hash,
  };
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [

    SecurityComponent,
    FeatureFlagsComponent,
    ComplianceComponent,
    WebhooksComponent,
    GlobalEdgeComponent,
    DashboardAnalyticsComponent,
    CommonModule,
    LucideAngularModule, 
    DashboardOverviewComponent,
    DashboardAllClientsComponent,
    DashboardPlansPricingComponent,
    DashboardModuleCatalogComponent,
    DashboardSystemHealthComponent,
    DashboardSaasControlComponent,
    DashboardRbacComponent,
    DashboardApiGatewayComponent,
    DashboardPaymentsComponent,
    ModuleManagerComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly icons = dashboardIcons;
  // SCS_NOTIFICATIONS_CENTER
  isNotificationsOpen = false;
  unreadNotifications = 3;
  notifications = [
    { id: 1, type: 'alert', title: 'High CPU Usage', message: 'Tenant #492 is utilizing 98% of their allocated compute limits.', time: '2 mins ago', read: false },
    { id: 2, type: 'success', title: 'Global Backup Complete', message: 'All regional databases have been securely mirrored.', time: '1 hr ago', read: false },
    { id: 3, type: 'info', title: 'New Multi-Tenant Node', message: 'Node EU-West-3 has successfully joined the cluster.', time: '3 hrs ago', read: false },
    { id: 4, type: 'warning', title: 'API Rate Limit', message: 'Payment gateway API calls approaching 90% of quota.', time: '5 hrs ago', read: true }
  ];

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadNotifications = 0;
  }

  // SCS_PHASE52_LOCK_V1
  // Phase 5.2 Enterprise Dashboard Foundation
  // Status: LOCKED
  // Green Builds: 28
  // Rollbacks: 0

  // SCS_VIEWMODEL_CLEANUP_V1
  // SCS_API_FOUNDATION_V1

  // SCS_MODULE_MANAGER_STATE_V1

  showModuleManager = false;

  openModuleManager() {
    this.showModuleManager = true;
  }

  closeModuleManager() {
    this.showModuleManager = false;
  }

  // SCS_MODULE_MANAGER_GETTER_V1

  get platformModules() {
    return this.moduleRegistry.modules;
  }

  dashboardViewModel = {
    activityFeed: [
      {
        title: 'Dashboard Ready',
        detail: 'Overview connected successfully',
        level: 'success' as const,
        time: 'Now',
      },
      {
        title: 'Enterprise Mode',
        detail: 'Phase 5.2 activated',
        level: 'info' as const,
        time: 'Now',
      },
    ],

    systemHealth: [],

    monitoring: {
      backend: 'live',
      database: 'live',
      api: 'live',
    },

    statistics: {
      clients: 0,
      modules: 0,
      payments: 0,
      licenses: 0,
    },

    favorites: [
      {
        code: 'dashboard',
        label: 'Dashboard',
      },
      {
        code: 'rbac',
        label: 'RBAC',
      },
      {
        code: 'payments-sys-list',
        label: 'Payments',
      },
      {
        code: 'all-tenants',
        label: 'Clients',
      },
    ],

    notifications: [],

    metadata: {
      version: 'Phase 5.3',
      build: 'Enterprise',
      source: 'DashboardViewModel',
    },

    api: {
      initialized: false,
      loading: false,
      lastSync: null as Date | null,
      error: null,
    },

    // SCS_MASTER_MODULE_REGISTRY_V1
    modules: [
      {
        code: 'all-tenants',
        label: 'Clients',
        route: 'all-tenants',
        icon: 'Users',
        category: 'core',
        pinned: true,
        hidden: false,
      },
      {
        code: 'payments',
        label: 'Payments',
        route: 'payments-sys-list',
        icon: 'CreditCard',
        category: 'finance',
        pinned: true,
        hidden: false,
      },
      {
        code: 'rbac',
        label: 'RBAC',
        route: 'rbac',
        icon: 'Shield',
        category: 'security',
        pinned: true,
        hidden: false,
      },
      {
        code: 'license',
        label: 'License',
        route: 'license-list',
        icon: 'Key',
        category: 'security',
        pinned: true,
        hidden: false,
      },
      {
        code: 'api',
        label: 'API',
        route: 'api-gate-list',
        icon: 'Network',
        category: 'integration',
        pinned: true,
        hidden: false,
      },
      {
        code: 'settings',
        label: 'Settings',
        route: 'settings-list',
        icon: 'Settings',
        category: 'system',
        pinned: true,
        hidden: false,
      },
    ],

    // SCS_QUICK_ACTIONS_FOUNDATION_V1
    quickActions: {
      search: '',
      showHidden: false,
      modules: [
        {
          code: 'all-tenants',
          label: 'Clients',
          route: 'all-tenants',
          icon: 'Users',
          pinned: true,
          hidden: false,
        },
        {
          code: 'payments',
          label: 'Payments',
          route: 'payments-sys-list',
          icon: 'CreditCard',
          pinned: true,
          hidden: false,
        },
                {
          code: 'global-edge',
          label: 'Global Edge',
          route: 'global-edge',
          icon: 'Globe',
          pinned: true,
          hidden: false,
        },
        {
          code: 'analytics',
          label: 'Analytics',
          route: 'analytics',
          icon: 'BarChart3',
          pinned: true,
          hidden: false,
        },
        { code: 'rbac', label: 'RBAC', route: 'rbac', icon: 'Shield', pinned: true, hidden: false },
        {
          code: 'license',
          label: 'License',
          route: 'license-list',
          icon: 'Key',
          pinned: true,
          hidden: false,
        },
        {
          code: 'api',
          label: 'API',
          route: 'api-gate-list',
          icon: 'Network',
          pinned: true,
          hidden: false,
        },
        {
          code: 'settings',
          label: 'Settings',
          route: 'settings-list',
          icon: 'Settings',
          pinned: true,
          hidden: false,
        },
      ],
    },
  };

  // SCS_DASHBOARD_SAAS_CONTROL_BRIDGE_V1
  readonly saasControlBusinessLabel = (): string => this.saasClientBusinessLabel();

  readonly saasControlEnabledCount = (): number => this.scsSuperEnabledCount();

  readonly saasControlAssignablePlans = (): any[] => this.saasAssignablePlans();

  readonly saasControlBusinessPlanPrice = (plan: any): number => this.saasBusinessPlanPrice(plan);

  readonly saasControlBusinessPlanModuleCount = (plan: any): number =>
    this.saasBusinessPlanModuleCount(plan);

  readonly saasControlBusinessPlanModuleNames = (plan: any): string =>
    this.saasBusinessPlanModuleNames(plan);

  readonly saasControlSelectedPackageTotal = (): number => this.saasSelectedPackageTotal();

  readonly saasControlSuperCategories = (): string[] => this.scsSuperCategories();

  readonly saasControlModuleCategoryLabel = (category: any): string =>
    this.moduleCategoryLabel(String(category || ''));

  readonly saasControlSuperVisibleModules = (): any[] => this.scsSuperVisibleModules();

  readonly saasControlSuperTrackModule = (index: number, module: any): string =>
    this.scsSuperTrackModule(index, module);

  readonly saasControlSuperModuleSaving = (module: any): boolean =>
    this.scsSuperModuleSaving(module);

  readonly saasControlSuperIsModuleEnabled = (module: any): boolean =>
    this.scsSuperIsModuleEnabled(module);

  readonly saasControlSuperModulePrice = (module: any): number => this.scsSuperModulePrice(module);

  saasControlSelectClient(clientId: any): void {
    void this.selectSaasControlClient(String(clientId || ''));
  }

  saasControlSetBillingCycle(value: any): void {
    this.saasClientSetBillingCycle(String(value || ''));
  }

  saasControlSelectPlan(planId: any): void {
    this.saasClientSelectPlan(String(planId || ''));
  }

  saasControlAssignPlan(): void {
    void this.assignSaasClientBusinessPlan();
  }

  saasControlSetModuleSearch(value: any): void {
    this.scsSuperSetModuleSearch(String(value || ''));
  }

  saasControlSetModuleCategory(value: any): void {
    this.scsSuperSetModuleCategory(String(value || 'all'));
  }

  saasControlSetModuleEnabled(change: { module: any; enabled: boolean }): void {
    void this.scsSuperSetModuleEnabled(change.module, change.enabled);
  }
  // SCS_DASHBOARD_MODULE_CATALOG_BRIDGE_V1
  readonly moduleCatalogCountByCategory = (category: any): number =>
    this.countModulesByCategory(category);

  readonly moduleCatalogFormatCategory = (category: any): string =>
    this.formatModuleCategory(category);

  readonly moduleCatalogEditorTitleFn = (): string => this.moduleCatalogEditorTitle();

  moduleCatalogSetCategory(category: any): void {
    this.moduleCatalogCategory = String(category || 'all');
  }

  moduleCatalogSetSearch(value: any): void {
    this.moduleCatalogSearch = String(value || '');
  }

  moduleCatalogSetDraftField(change: { field: string; value: any }): void {
    this.setModuleCatalogDraftField(change.field, change.value);
  }
  // SCS_DASHBOARD_PLANS_PRICING_BRIDGE_V1
  readonly plansPricingIsCustom = (): boolean => this.businessPlanIsCustom();

  readonly plansPricingModuleScope = (module: any): string => this.businessPlanModuleScope(module);

  readonly plansPricingFormatModuleCategory = (category: any): string =>
    this.formatModuleCategory(category);

  readonly plansPricingIsModuleSelected = (module: any): boolean =>
    this.isPlanBuilderModuleSelected(module);

  readonly plansPricingModuleCount = (plan: any): number => this.planBuilderModuleCount(plan);

  plansPricingSetDraftField(change: {
    field: 'monthly_price' | 'yearly_price' | 'status' | 'sort_order';
    value: any;
  }): void {
    this.setPlanBuilderDraftField(change.field, change.value);
  }

  plansPricingSetSearch(value: string): void {
    this.planBuilderSearch = String(value || '');
  }
  // SCS_DASHBOARD_ALL_CLIENTS_BRIDGE_V1
  readonly allClientsGetInitials = (client: any): string => this.getInitials(client);

  allClientsSelectPage(page: number): void {
    this.clientPage = Math.max(1, Number(page || 1));

    this.applyClientLocalView();
  }
  // SCS_DASHBOARD_OVERVIEW_BRIDGE_V1
  readonly overviewGetGreeting = (): string => this.getGreeting();

  readonly overviewGetInitials = (client: any): string => this.getInitials(client);

  // SCS_CLIENT_POPUP_SECURE_STATE_START
  clientPopup: SuperadminClient | null = null;

  // Dev/Superadmin "Preview as Client" — lets Pervaiz see a real
  // client's dashboard without logging out and logging back in as
  // that client. Does NOT touch the auth session/cookie at all —
  // it only swaps the in-memory sidebar + role flag temporarily,
  // using superadmin-scoped read data. Exiting restores everything.
  previewMode = false;
  previewClient: SuperadminClient | null = null;
  private previewSnapshot: {
    userRole: UiRole;
    categories: DashboardCategory[];
    activeView: string;
  } | null = null;
  clientPopupDraft: any = {};
  clientPopupTab: 'overview' | 'edit' | 'status' | 'access' | 'audit' = 'overview';
  clientPopupBusy = false;
  clientPopupMessage = '';
  clientPopupMessageOk = true;
  clientPopupTempPassword = '';
  clientPopupAudit: Array<{ time: string; action: string; detail: string }> = [];
  // SCS_CLIENT_POPUP_SECURE_STATE_END

  // SCS_EYE_CLIENT_POPUP_V2_STATE_REMOVED_SECURE_REBUILD

  // SCS_SUPERADMIN_PROFILE_FINAL_START
  scsSuperProfileClient: SuperadminClient | null = null;
  scsSuperTab: 'overview' | 'plan' | 'modules' | 'billing' | 'access' | 'documents' | 'audit' =
    'overview';
  scsSuperModuleSearch = '';
  scsSuperModuleCategory = 'all';
  scsSuperSaving = false;
  scsSuperSavingModuleIds = new Set<string>();
  scsSuperAudit: Array<{ time: string; action: string; detail: string }> = [];
  scsSuperDocs = [
    { name: 'Business Registration', status: 'Pending', note: 'Company verification document' },
    { name: 'Tax / NTN Document', status: 'Optional', note: 'Billing verification document' },
    { name: 'Client Agreement', status: 'Pending', note: 'Commercial agreement' },
  ];

  scsSuperOpen(client: SuperadminClient): void {
    this.selectedClient = null;
    this.scsSuperProfileClient = { ...client };
    this.editClientDraft = { ...client };
    this.isEditMode = false;
    this.scsSuperTab = 'overview';
    this.scsSuperModuleSearch = '';
    this.scsSuperModuleCategory = 'all';
    this.tenantModules = [];
    this.scsSuperModuleEnabledState = {};
    this.selectedBillingCycle = client.billing_cycle === 'yearly' ? 'yearly' : 'monthly';
    this.selectedPlanId = '';
    this.tenantSubscription = {
      status: client.subscription_status || 'none',
      plan_id: '',
      billing_cycle: this.selectedBillingCycle,
      plan_base_amount: 0,
      module_addons_amount: 0,
      amount: Number(client.amount || 0),
    };
    this.scsSuperAudit = [
      {
        time: new Date().toLocaleString(),
        action: 'Opened profile',
        detail: client.email || client.full_name || 'client',
      },
    ];
    if (client.status === 'approved') void this.scsSuperLoadModules();
    this.cdr.detectChanges();
  }

  scsSuperClose(): void {
    this.scsSuperProfileClient = null;
    this.scsSuperSavingModuleIds = new Set<string>();
    this.cdr.detectChanges();
  }

  scsSuperSetTab(
    tab: 'overview' | 'plan' | 'modules' | 'billing' | 'access' | 'documents' | 'audit',
  ): void {
    this.scsSuperTab = tab;
    this.cdr.detectChanges();
  }

  scsSuperInitial(): string {
    const c: any = this.scsSuperProfileClient || {};
    return String(c.full_name || c.company_name || c.email || 'S')
      .slice(0, 1)
      .toUpperCase();
  }

  scsSuperAuditAdd(action: string, detail: string): void {
    this.scsSuperAudit = [
      { time: new Date().toLocaleString(), action, detail },
      ...this.scsSuperAudit,
    ].slice(0, 30);
  }

  scsSuperPlan(): any {
    const id = this.selectedPlanId || this.tenantSubscription.plan_id || '';
    return this.catalogPlans.find((p: any) => p.id === id);
  }

  scsSuperPlanBase(): number {
    const selectedID = String(
      this.saasClientSelectedPlanId || this.selectedPlanId || this.tenantSubscription.plan_id || '',
    );

    const matrixPlan = this.saasClientPlans.find(
      (plan: any) => String(plan?.id || plan?.plan_id || '') === selectedID,
    );

    if (matrixPlan) {
      return this.saasClientBillingCycle === 'yearly'
        ? Number(matrixPlan.yearly_price || 0)
        : Number(matrixPlan.monthly_price || 0);
    }

    const serverBase = Number(this.tenantSubscription.plan_base_amount || 0);

    if (serverBase > 0 && String(this.tenantSubscription.plan_id || '') === selectedID) {
      return serverBase;
    }

    const plan: any = this.scsSuperPlan();

    if (plan) {
      return this.selectedBillingCycle === 'yearly'
        ? Number(plan.yearly_price || 0)
        : Number(plan.monthly_price || 0);
    }

    return serverBase;
  }

  scsSuperModulePrice(module: TenantModule): number {
    return this.selectedBillingCycle === 'yearly'
      ? Number(module.price_yearly || 0)
      : Number(module.price_monthly || 0);
  }

  scsSuperIsModuleEnabled(module: TenantModule): boolean {
    const id = String((module as any)?.id || '');
    if (id && Object.prototype.hasOwnProperty.call(this.scsSuperModuleEnabledState, id)) {
      return this.scsSuperModuleEnabledState[id] === true;
    }
    return (module as any)?.enabled === true;
  }

  scsSuperEnabledCount(): number {
    return this.tenantModules.filter((m) => this.scsSuperIsModuleEnabled(m)).length;
  }

  scsSuperAddons(): number {
    const selectedPlan = this.saasSelectedBusinessPlan();

    const includedIDs = new Set<string>(
      Array.isArray(selectedPlan?.module_ids)
        ? selectedPlan.module_ids.map((id: any) => String(id))
        : [],
    );

    return this.tenantModules
      .filter((module: any) => {
        if (!this.scsSuperIsModuleEnabled(module)) return false;

        const moduleID = String(module?.id || '');
        const source = String(module?.source || 'manual');

        if (source === 'plan') return false;
        if (includedIDs.has(moduleID)) return false;

        return true;
      })
      .reduce((sum, module) => sum + this.scsSuperModulePrice(module), 0);
  }

  scsSuperTotal(): number {
    const live = this.scsSuperPlanBase() + this.scsSuperAddons();
    return (
      live ||
      Number(this.tenantSubscription.amount || 0) ||
      Number(this.scsSuperProfileClient?.amount || 0) ||
      0
    );
  }

  scsSuperApplyLive(): void {
    const base = this.scsSuperPlanBase();
    const addons = this.scsSuperAddons();
    const total = base + addons;

    this.tenantSubscription = {
      ...this.tenantSubscription,
      billing_cycle: this.selectedBillingCycle,
      plan_id: this.selectedPlanId || this.tenantSubscription.plan_id || '',
      plan_base_amount: base,
      module_addons_amount: addons,
      amount: total,
    };

    if (this.scsSuperProfileClient) {
      this.scsSuperProfileClient.amount = total;
      this.scsSuperProfileClient.billing_cycle = this.selectedBillingCycle;
      this.scsSuperProfileClient.enabled_modules = this.scsSuperEnabledCount();
    }
  }

  scsSuperApplyServerSubscription(raw: any): void {
    if (!raw) {
      this.scsSuperApplyLive();
      return;
    }

    this.tenantSubscription = {
      ...this.tenantSubscription,
      status: String(raw.status || this.tenantSubscription.status || 'active'),
      plan_id: String(raw.plan_id || this.selectedPlanId || this.tenantSubscription.plan_id || ''),
      billing_cycle: raw.billing_cycle === 'yearly' ? 'yearly' : 'monthly',
      plan_base_amount: Number(raw.plan_base_amount || 0),
      module_addons_amount: Number(raw.module_addons_amount || 0),
      amount: Number(raw.amount || 0),
    };

    this.selectedPlanId = this.tenantSubscription.plan_id || this.selectedPlanId;
    this.selectedBillingCycle =
      this.tenantSubscription.billing_cycle === 'yearly' ? 'yearly' : 'monthly';
    this.scsSuperApplyLive();
  }

  scsSuperCategories(): string[] {
    const cats = Array.from(
      new Set(this.tenantModules.map((m: any) => String(m.category || 'business'))),
    );
    return cats.length ? cats : ['business'];
  }

  scsSuperVisibleModules(): TenantModule[] {
    const q = (this.scsSuperModuleSearch || '').trim().toLowerCase();

    const business = String(
      this.selectedClient?.business_type ||
        this.saasClientBusinessInfo?.key ||
        this.saasClientBusinessInfo?.business_type ||
        '',
    ).toLowerCase();

    return this.tenantModules.filter((m: any) => {
      const cat = String(m.category || 'business').toLowerCase();

      const moduleBusiness = String(
        m.business_type || m.business || m.industry || '',
      ).toLowerCase();

      const byBusiness = !business || moduleBusiness === '' || moduleBusiness === business;

      const byCategory =
        this.scsSuperModuleCategory === 'all' ||
        cat === String(this.scsSuperModuleCategory).toLowerCase();

      const bySearch =
        !q ||
        String(m.name || '')
          .toLowerCase()
          .includes(q) ||
        cat.includes(q);

      return byBusiness && byCategory && bySearch;
    });
  }

  scsSuperTrackModule(_index: number, module: TenantModule): string {
    return module.id;
  }

  scsSuperModuleSaving(module: TenantModule): boolean {
    return this.scsSuperSavingModuleIds.has(module.id);
  }

  async scsSuperLoadModules(): Promise<void> {
    if (!this.scsSuperProfileClient) return;

    this.isModulesLoading = true;
    this.cdr.detectChanges();

    try {
      if (this.catalogPlans.length === 0 || this.moduleCatalog.length === 0) {
        await this.loadModuleCatalogForSuperadmin();
      }

      const c = this.scsSuperProfileClient;
      const params = new URLSearchParams();
      if (c.tenant_id) params.set('tenant_id', c.tenant_id);
      if (c.id) params.set('client_id', c.id);
      if (c.email) params.set('email', c.email);

      const res = await fetch(
        '/api/superadmin/tenant-modules?' + params.toString() + '&_live=' + Date.now(),
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
      );

      const data: any = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Modules load failed');

      this.tenantModules = Array.isArray(data.modules)
        ? data.modules.map((m: any) => ({
            ...m,
            price_monthly: Number(m.price_monthly || 0),
            price_yearly: Number(m.price_yearly || 0),
            enabled: m.enabled === true,
          }))
        : [];

      // SCS_STABLE_MODULE_STATE_REBUILD
      this.scsSuperModuleEnabledState = {};
      this.tenantModules.forEach((m: any) => {
        this.scsSuperModuleEnabledState[String(m.id || '')] = m.enabled === true;
      });

      this.scsSuperApplyServerSubscription(data.subscription);
      this.scsSuperApplyLive();
    } catch (error: any) {
      this.showActionPopup(
        'Modules Load Failed',
        error instanceof Error ? error.message : 'Modules load nahi huwe.',
        false,
      );
    } finally {
      this.isModulesLoading = false;
      this.cdr.detectChanges();
    }
  }

  scsSuperSetBilling(value: string): void {
    this.selectedBillingCycle = value === 'yearly' ? 'yearly' : 'monthly';
    this.scsSuperApplyLive();
    this.cdr.detectChanges();
  }

  scsSuperSetPlan(planId: string): void {
    this.selectedPlanId = planId || '';
    this.scsSuperApplyLive();
    this.cdr.detectChanges();
  }

  scsSuperSetModuleSearch(value: string): void {
    this.scsSuperModuleSearch = value || '';
    this.cdr.detectChanges();
  }

  scsSuperSetModuleCategory(value: string): void {
    this.scsSuperModuleCategory = value || 'all';
    this.cdr.detectChanges();
  }

  scsSuperSetModulePrice(module: TenantModule, cycle: 'monthly' | 'yearly', value: string): void {
    const price = Math.max(0, Number(value || 0));
    this.tenantModules = this.tenantModules.map((m) => {
      if (m.id !== module.id) return m;
      return {
        ...m,
        price_monthly: cycle === 'monthly' ? price : m.price_monthly,
        price_yearly: cycle === 'yearly' ? price : m.price_yearly,
      };
    });
    this.scsSuperApplyLive();
    this.cdr.detectChanges();
  }

  async scsSuperApprove(): Promise<void> {
    if (!this.scsSuperProfileClient) return;
    await this.approveClient(this.scsSuperProfileClient);
    this.scsSuperClose();
  }

  async scsSuperReject(): Promise<void> {
    if (!this.scsSuperProfileClient) return;
    await this.rejectClient(this.scsSuperProfileClient);
    this.scsSuperClose();
  }

  async scsSuperSaveInfo(): Promise<void> {
    if (!this.scsSuperProfileClient) return;
    this.selectedClient = this.scsSuperProfileClient;
    await this.saveClientEdit();
    this.selectedClient = null;
    this.scsSuperAuditAdd('Client info saved', this.scsSuperProfileClient.email || '');
    this.cdr.detectChanges();
  }

  async scsSuperApplyPlan(): Promise<void> {
    if (!this.scsSuperProfileClient || !this.selectedPlanId) {
      this.showActionPopup('Plan Required', 'Pehle plan select karo.', false);
      return;
    }

    const c = this.scsSuperProfileClient;
    const beforeModules = this.tenantModules.map((m) => ({ ...m }));
    const beforeSub = { ...this.tenantSubscription };

    this.scsSuperSaving = true;
    this.scsSuperApplyLive();
    this.cdr.detectChanges();

    try {
      const res = await fetch('/api/superadmin/subscriptions/save?_live=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          tenant_id: c.tenant_id || '',
          client_id: c.id || '',
          email: c.email || '',
          plan_id: this.selectedPlanId,
          billing_cycle: this.selectedBillingCycle,
          status: 'active',
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Plan save failed');

      this.scsSuperApplyServerSubscription(data.subscription);
      this.scsSuperAuditAdd(
        'Plan assigned',
        this.selectedPlanId + ' / ' + this.selectedBillingCycle,
      );
      this.showActionPopup('Plan Assigned Success', 'Total: ' + this.scsSuperTotal(), true);
      await this.loadSuperadminClients(true);
    } catch (error: any) {
      this.tenantModules = beforeModules;
      this.tenantSubscription = beforeSub;
      this.scsSuperApplyLive();
      this.showActionPopup(
        'Plan Save Failed',
        error instanceof Error ? error.message : 'Plan save nahi hua.',
        false,
      );
    } finally {
      this.scsSuperSaving = false;
      this.cdr.detectChanges();
    }
  }

  async scsSuperSetModuleEnabled(module: TenantModule, enabled: boolean): Promise<void> {
    if (!this.scsSuperProfileClient || !module) return;
    if (this.scsSuperModuleSaving(module)) return; // prevent double-click

    const c = this.scsSuperProfileClient;
    const moduleId = String((module as any).id || '');
    const next = enabled === true;

    // Save scroll before any changes
    const _el = document.querySelector('main > .overflow-y-auto') as HTMLElement | null;
    const _y = _el ? _el.scrollTop : 0;

    const beforeModules = this.tenantModules.map((m) => ({ ...m }));
    const beforeSub = { ...this.tenantSubscription };
    const beforeState = { ...this.scsSuperModuleEnabledState };

    // Optimistic update
    this.scsSuperModuleEnabledState = { ...this.scsSuperModuleEnabledState, [moduleId]: next };
    this.tenantModules = this.tenantModules.map((m: any) =>
      String(m.id || '') === moduleId ? { ...m, enabled: next, source: 'manual' } : m,
    );

    this.scsSuperSavingModuleIds = new Set(this.scsSuperSavingModuleIds).add(moduleId);
    this.cdr.detectChanges();

    // Restore scroll after optimistic render
    if (_el)
      requestAnimationFrame(() => {
        _el.scrollTop = _y;
      });

    try {
      const res = await fetch('/api/superadmin/tenant-modules/update?_live=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          tenant_id: c.tenant_id || '',
          client_id: c.id || '',
          email: c.email || '',
          module_id: moduleId,
          enabled: next,
          source: 'manual',
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Module save failed');

      if (data.subscription) this.scsSuperApplyServerSubscription(data.subscription);

      this.scsSuperModuleEnabledState = { ...this.scsSuperModuleEnabledState, [moduleId]: next };
      this.tenantModules = this.tenantModules.map((m: any) =>
        String(m.id || '') === moduleId ? { ...m, enabled: next, source: 'manual' } : m,
      );

      this.scsSuperAuditAdd(
        next ? 'Module granted' : 'Module revoked',
        (module as any).name || moduleId,
      );
      this.showActionPopup(
        next ? 'Access Granted Success' : 'Access Removed Success',
        'Saved live to tenant_modules.',
        true,
      );
    } catch (error: any) {
      this.tenantModules = beforeModules;
      this.tenantSubscription = beforeSub;
      this.scsSuperModuleEnabledState = beforeState;
      this.showActionPopup(
        'Module Save Failed',
        error instanceof Error ? error.message : 'Module save nahi hua.',
        false,
      );
    } finally {
      const ids = new Set(this.scsSuperSavingModuleIds);
      ids.delete(moduleId);
      this.scsSuperSavingModuleIds = ids;
      this.cdr.detectChanges();
    }
  }

  async scsSuperToggleModule(module: TenantModule): Promise<void> {
    if (!this.scsSuperProfileClient || !module) return;

    const c = this.scsSuperProfileClient;
    const moduleId = String(module.id || '');
    const current = this.tenantModules.find((m: any) => String(m.id || '') === moduleId) || module;
    const next = !current.enabled;

    const beforeModules = this.tenantModules.map((m) => ({ ...m }));
    const beforeSub = { ...this.tenantSubscription };

    this.tenantModules = this.tenantModules.map((m: any) =>
      String(m.id || '') === moduleId ? { ...m, enabled: next, source: 'manual' } : m,
    );

    this.scsSuperSavingModuleIds = new Set(this.scsSuperSavingModuleIds).add(moduleId);
    this.cdr.detectChanges();

    try {
      const res = await fetch('/api/superadmin/tenant-modules/update?_live=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          tenant_id: c.tenant_id || '',
          client_id: c.id || '',
          email: c.email || '',
          module_id: moduleId,
          enabled: next,
          source: 'manual',
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Module save failed');

      if (data.subscription) this.scsSuperApplyServerSubscription(data.subscription);

      this.tenantModules = this.tenantModules.map((m: any) =>
        String(m.id || '') === moduleId ? { ...m, enabled: next, source: 'manual' } : m,
      );

      this.scsSuperAuditAdd(next ? 'Module granted' : 'Module revoked', current.name || moduleId);
      this.showActionPopup(
        next ? 'Access Granted Success' : 'Access Removed Success',
        'Saved live to tenant_modules.',
        true,
      );
    } catch (error: any) {
      this.tenantModules = beforeModules;
      this.tenantSubscription = beforeSub;
      this.showActionPopup(
        'Module Save Failed',
        error instanceof Error ? error.message : 'Module save nahi hua.',
        false,
      );
    } finally {
      const ids = new Set(this.scsSuperSavingModuleIds);
      ids.delete(moduleId);
      this.scsSuperSavingModuleIds = ids;
      this.cdr.detectChanges();
    }
  }

  async scsSuperSaveModulePrice(module: TenantModule): Promise<void> {
    if (!this.scsSuperProfileClient || !module) return;

    const c = this.scsSuperProfileClient;
    const current = this.tenantModules.find((m) => m.id === module.id) || module;
    const beforeModules = this.tenantModules.map((m) => ({ ...m }));
    const beforeSub = { ...this.tenantSubscription };

    this.scsSuperSavingModuleIds = new Set(this.scsSuperSavingModuleIds).add(module.id);
    this.scsSuperApplyLive();
    this.cdr.detectChanges();

    try {
      const res = await fetch('/api/superadmin/tenant-modules/price/update?_live=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          tenant_id: c.tenant_id || '',
          client_id: c.id || '',
          email: c.email || '',
          module_id: module.id,
          monthly_price: Math.max(0, Number(current.price_monthly || 0)),
          yearly_price: Math.max(0, Number(current.price_yearly || 0)),
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Price save failed');

      this.scsSuperApplyServerSubscription(data.subscription);
      this.scsSuperAuditAdd('Module price saved', module.name || module.id);
      this.showActionPopup('Price Saved Success', 'Total: ' + this.scsSuperTotal(), true);
      await this.loadSuperadminClients(true);
    } catch (error: any) {
      this.tenantModules = beforeModules;
      this.tenantSubscription = beforeSub;
      this.scsSuperApplyLive();
      this.showActionPopup(
        'Price Save Failed',
        error instanceof Error ? error.message : 'Price save nahi hui.',
        false,
      );
    } finally {
      const ids = new Set(this.scsSuperSavingModuleIds);
      ids.delete(module.id);
      this.scsSuperSavingModuleIds = ids;
      this.cdr.detectChanges();
    }
  }

  scsSuperInvoiceDraft(): void {
    this.scsSuperAuditAdd('Invoice draft', 'Amount: ' + this.scsSuperTotal());
    this.showActionPopup(
      'Invoice Draft Ready',
      'Invoice backend next phase mein attach hoga.',
      true,
    );
  }

  scsSuperResetPassword(): void {
    this.scsSuperAuditAdd(
      'Password reset requested',
      this.scsSuperProfileClient?.email || 'client',
    );
    this.showActionPopup('Reset Queued', 'Password backend next phase mein attach hoga.', true);
  }
  // SCS_SUPERADMIN_PROFILE_FINAL_END

  userName = 'Loading...';
  userEmail = '';
  userRole: UiRole = 'CLIENT';
  backendRole: BackendRole | null = null;
  tenantId = '';
  isAuthLoading = true;

  isSidebarOpen = true;
  activeView: string = 'home';
  openDropdowns: { [key: string]: boolean } = {};
  isThemeMenuOpen = false;

  superadminClients: SuperadminClient[] = [];
  allSuperadminClients: SuperadminClient[] = [];
  selectedClient: SuperadminClient | null = null;
  editClientDraft: Partial<SuperadminClient> = {};
  isEditMode = false;
  detailTab: 'info' | 'system' | 'modules' = 'info';

  clientStatusTab: ClientStatusTab = 'all';
  clientSearch = '';
  clientLimit = 10;
  clientOffset = 0;
  clientTotal = 0;
  clientHasMore = false;
  clientPage = 1;
  isClientsLoading = false;
  isClientActionBusy = false;
  actionMessage = '';
  actionSuccess = true;

  popupOpen = false;
  popupTitle = '';
  popupMessage = '';
  popupSuccess = true;

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => Promise<void>) | null = null;
  confirmDanger = false;

  clientTotals = { pending: 0, approved: 0, rejected: 0, all: 0 };

  tenantModules: TenantModule[] = [];
  scsSuperModuleEnabledState: Record<string, boolean> = {};
  moduleCatalog: TenantModule[] = [];
  moduleCatalogSearch = '';
  moduleCatalogCategory = 'all';

  // SCS_MODULE_CATALOG_EDITOR_STATE_START
  moduleCatalogEditorOpen = false;
  moduleCatalogEditorMode: 'create' | 'edit' = 'create';
  moduleCatalogEditorBusy = false;
  moduleCatalogEditorMessage = '';
  moduleCatalogEditorOk = true;
  moduleCatalogDraft: any = {
    id: '',
    name: '',
    category: '',
    price_monthly: 0,
    price_yearly: 0,
    route: '',
    icon: '',
    status: 'active',
    sort_order: 0,
  };
  // SCS_MODULE_CATALOG_EDITOR_STATE_END
  catalogPlans: CatalogPlan[] = [];

  // SCS_PLAN_BUILDER_STATE_START
  planBuilderSearch = '';
  planBuilderBusy = false;
  planBuilderMessage = '';
  planBuilderOk = true;
  planBuilderSelectedPlanId = '';
  planBuilderDraft: any = null;
  // SCS_PLAN_BUILDER_STATE_END

  // SCS_BUSINESS_PLAN_MATRIX_STATE_V1
  businessPlanTypes: any[] = [];
  businessPlanSelectedType = '';
  businessPlanSelectedInfo: any = null;
  businessPlanPlans: any[] = [];
  businessPlanLoading = false;
  businessPlanSaving = false;
  businessPlanMessage = '';
  businessPlanOk = true;
  readonly scsGlobalPlanIds = ['starter', 'pro', 'enterprise', 'custom'];

  scsNormalizeCatalogPlans(plans: any[]): any[] {
    const allowed = new Set(this.scsGlobalPlanIds);
    return (Array.isArray(plans) ? plans : [])
      .filter(
        (p: any) => allowed.has(String(p?.id || '')) && String(p?.status || 'active') === 'active',
      )
      .sort((a: any, b: any) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0));
  }

  get moduleCatalogCategories(): string[] {
    const categories = new Set<string>();
    (this.moduleCatalog || []).forEach((m: any) => {
      if (m?.category) categories.add(String(m.category));
    });
    return Array.from(categories).sort();
  }

  get filteredModuleCatalog(): any[] {
    const q = (this.moduleCatalogSearch || '').trim().toLowerCase();
    const cat = this.moduleCatalogCategory || 'all';

    return (this.moduleCatalog || []).filter((m: any) => {
      const sameCategory = cat === 'all' || String(m?.category || '') === cat;
      const haystack = [m?.id, m?.name, m?.category, m?.route, m?.status].join(' ').toLowerCase();

      return sameCategory && (!q || haystack.includes(q));
    });
  }

  countModulesByCategory(cat: string): number {
    const key = String(cat || '').trim();
    return this.moduleCatalog.filter((m: any) => String(m?.category || '').trim() === key).length;
  }

  formatModuleCategory(cat: string): string {
    return String(cat || 'uncategorized').replace(/_/g, ' ');
  }

  // SCS_MODULE_CATALOG_EDITOR_METHODS_START

  // SCS_PLAN_BUILDER_METHODS_START
  planBuilderModuleIDs(plan: any): string[] {
    const raw = plan?.module_ids || plan?.modules || plan?.included_modules || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x: any) =>
        String((typeof x === 'string' ? x : x?.id || x?.module_id || '') || '').trim(),
      )
      .filter(Boolean);
  }

  planBuilderModuleCount(plan: any): number {
    return this.planBuilderModuleIDs(plan).length;
  }

  get filteredPlanBuilderModules(): any[] {
    const q = (this.planBuilderSearch || '').trim().toLowerCase();
    return (this.moduleCatalog || [])
      .filter((m: any) => {
        if (!q) return true;
        return (
          String(m?.name || '')
            .toLowerCase()
            .includes(q) ||
          String(m?.id || '')
            .toLowerCase()
            .includes(q) ||
          String(m?.category || '')
            .toLowerCase()
            .includes(q)
        );
      })
      .slice(0, 300);
  }

  async openPlanBuilderCreate(): Promise<void> {
    if (this.moduleCatalog.length === 0 || this.catalogPlans.length === 0) {
      await this.loadModuleCatalogForSuperadmin();
    }
    this.planBuilderSelectedPlanId = 'custom';
    this.planBuilderMessage = '';
    this.planBuilderOk = true;
    this.planBuilderDraft = {
      id: 'custom',
      name: 'Custom',
      monthly_price: 0,
      yearly_price: 0,
      status: 'active',
      sort_order: 99,
      module_ids: [],
    };
  }

  async openPlanBuilder(plan: any): Promise<void> {
    if (this.moduleCatalog.length === 0 || this.catalogPlans.length === 0) {
      await this.loadModuleCatalogForSuperadmin();
    }
    const ids = this.planBuilderModuleIDs(plan);
    this.planBuilderSelectedPlanId = String(plan?.id || '');
    this.planBuilderMessage = '';
    this.planBuilderOk = true;
    this.planBuilderDraft = {
      id: String(plan?.id || ''),
      name: String(plan?.name || ''),
      monthly_price: Number(plan?.monthly_price ?? plan?.price_monthly ?? 0),
      yearly_price: Number(plan?.yearly_price ?? plan?.price_yearly ?? 0),
      status: String(plan?.status || 'active'),
      sort_order: Number(plan?.sort_order || 0),
      module_ids: ids,
    };
  }

  setPlanBuilderDraftField(field: string, value: any): void {
    this.planBuilderDraft = {
      ...(this.planBuilderDraft || {}),
      [field]: value,
    };
  }

  isPlanBuilderModuleSelected(module: any): boolean {
    const id = String(module?.id || '');
    const ids = Array.isArray(this.planBuilderDraft?.module_ids)
      ? this.planBuilderDraft.module_ids
      : [];
    return ids.includes(id);
  }

  togglePlanBuilderModule(module: any): void {
    const id = String(module?.id || '');
    if (!id) return;
    const current = Array.isArray(this.planBuilderDraft?.module_ids)
      ? [...this.planBuilderDraft.module_ids]
      : [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.planBuilderDraft = {
      ...(this.planBuilderDraft || {}),
      module_ids: next,
    };
  }

  async savePlanBuilder(): Promise<void> {
    if (this.planBuilderBusy || !this.planBuilderDraft) return;

    const draft = { ...(this.planBuilderDraft || {}) };
    const payload = {
      id: String(draft.id || '').trim(),
      name: String(draft.name || '').trim(),
      monthly_price: Number(draft.monthly_price || 0),
      yearly_price: Number(draft.yearly_price || 0),
      status: String(draft.status || 'active'),
      sort_order: Number(draft.sort_order || 0),
      module_ids: Array.isArray(draft.module_ids) ? draft.module_ids : [],
    };

    if (!payload.id || !payload.name) {
      this.planBuilderMessage = 'Plan ID aur name required hain.';
      this.planBuilderOk = false;
      return;
    }

    this.planBuilderBusy = true;
    this.planBuilderMessage = '';

    try {
      const res = await fetch('/api/superadmin/plans/save?_live=' + Date.now(), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || result?.ok === false) {
        throw new Error(result?.message || 'Plan save failed');
      }

      if (result.catalog) {
        this.moduleCatalog = Array.isArray(result.catalog?.modules)
          ? result.catalog.modules
          : this.moduleCatalog;

        this.moduleRegistry.updateModules(
          this.moduleCatalog.map((module) => ({
            code: module.id,
            label: module.name,
            route: module.route,
            icon: module.icon,
            category: module.category,

            pinned: false,
            hidden: !module.enabled,
          })),
        );
        this.catalogPlans = this.scsNormalizeCatalogPlans(
          Array.isArray(result.catalog?.plans) ? result.catalog.plans : this.catalogPlans,
        );
      } else {
        await this.loadModuleCatalogForSuperadmin();
      }

      const updated = this.catalogPlans.find((p: any) => p.id === payload.id) || payload;
      this.planBuilderDraft = {
        ...payload,
        module_ids: payload.module_ids,
      };
      this.planBuilderSelectedPlanId = payload.id;
      this.planBuilderMessage = 'Plan saved. Included modules: ' + payload.module_ids.length;
      this.planBuilderOk = true;
      this.showActionPopup('Plan Saved Success', updated?.name || payload.name, true);
    } catch (e: any) {
      this.planBuilderMessage = e?.message || 'Plan save failed';
      this.planBuilderOk = false;
    } finally {
      this.planBuilderBusy = false;
    }
  }
  // SCS_BUSINESS_PLAN_MATRIX_METHODS_V1
  async businessPlanEnsureLoaded(): Promise<void> {
    if (this.businessPlanLoading || this.businessPlanTypes.length > 0) return;

    try {
      if (this.moduleCatalog.length === 0) {
        await this.loadModuleCatalogForSuperadmin();
      }
      await this.loadBusinessPlanMatrix();
    } catch (error: any) {
      this.businessPlanMessage = String(error?.message || 'Business plans could not load');
      this.businessPlanOk = false;
    }
  }

  private applyBusinessPlanMatrixResponse(result: any): void {
    this.businessPlanTypes = Array.isArray(result?.business_types)
      ? result.business_types
      : this.businessPlanTypes;

    this.businessPlanSelectedInfo = result?.selected_business || null;
    this.businessPlanSelectedType = String(
      result?.selected_business?.id || this.businessPlanSelectedType || '',
    );
    this.businessPlanPlans = Array.isArray(result?.plans) ? result.plans : [];

    const currentID = this.planBuilderSelectedPlanId;
    const selected =
      this.businessPlanPlans.find((p: any) => String(p?.id || p?.plan_id) === currentID) ||
      this.businessPlanPlans[0] ||
      null;

    if (selected) {
      this.openBusinessPlanMatrixPlan(selected);
    } else {
      this.planBuilderDraft = null;
      this.planBuilderSelectedPlanId = '';
    }
  }

  async loadBusinessPlanMatrix(businessType = ''): Promise<void> {
    if (this.businessPlanLoading) return;

    this.businessPlanLoading = true;
    this.businessPlanMessage = '';

    try {
      const selected = String(businessType || this.businessPlanSelectedType || '').trim();
      const query = selected ? '&business_type=' + encodeURIComponent(selected) : '';

      const response = await fetch(
        '/api/superadmin/business-plan-matrix?_live=' + Date.now() + query,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.message || 'Business plan matrix load failed');
      }

      this.applyBusinessPlanMatrixResponse(result);
      this.businessPlanOk = true;
    } catch (error: any) {
      this.businessPlanMessage = String(error?.message || 'Business plan matrix load failed');
      this.businessPlanOk = false;
    } finally {
      this.businessPlanLoading = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  async selectBusinessPlanType(value: string): Promise<void> {
    const id = String(value || '').trim();
    if (!id || id === this.businessPlanSelectedType) return;

    this.businessPlanSelectedType = id;
    this.planBuilderSelectedPlanId = '';
    this.planBuilderDraft = null;
    this.planBuilderSearch = '';
    await this.loadBusinessPlanMatrix(id);
  }

  openBusinessPlanMatrixPlan(plan: any): void {
    const ids = this.planBuilderModuleIDs(plan);
    const id = String(plan?.id || plan?.plan_id || '');

    this.planBuilderSelectedPlanId = id;
    this.businessPlanMessage = '';
    this.businessPlanOk = true;
    this.planBuilderDraft = {
      id,
      plan_id: id,
      name: String(plan?.name || id),
      monthly_price: Number(plan?.monthly_price || 0),
      yearly_price: Number(plan?.yearly_price || 0),
      status: String(plan?.status || 'active'),
      sort_order: Number(plan?.sort_order || 0),
      module_ids: ids,
    };
  }

  businessPlanIsCustom(): boolean {
    return String(this.planBuilderDraft?.plan_id || this.planBuilderDraft?.id || '') === 'custom';
  }

  businessPlanModuleScope(module: any): string {
    const category = String(module?.category || '');
    const businessCategory = String(this.businessPlanSelectedInfo?.module_category || '');
    if (category === 'core') return 'Core';
    if (businessCategory && category === businessCategory) return 'Business';
    return 'Shared / Add-on';
  }

  get filteredBusinessPlanModules(): any[] {
    const query = String(this.planBuilderSearch || '')
      .trim()
      .toLowerCase();
    const businessCategory = String(this.businessPlanSelectedInfo?.module_category || '');

    return (this.moduleCatalog || [])
      .filter((module: any) => {
        if (!query) return true;
        const text = [module?.id, module?.name, module?.category].join(' ').toLowerCase();
        return text.includes(query);
      })
      .sort((a: any, b: any) => {
        const aCategory = String(a?.category || '');
        const bCategory = String(b?.category || '');
        const rank = (category: string) => {
          if (category === 'core') return 0;
          if (businessCategory && category === businessCategory) return 1;
          return 2;
        };
        const rankDifference = rank(aCategory) - rank(bCategory);
        if (rankDifference !== 0) return rankDifference;
        return String(a?.name || '').localeCompare(String(b?.name || ''));
      })
      .slice(0, 350);
  }

  async saveBusinessPlanMatrix(): Promise<void> {
    if (this.businessPlanSaving || !this.planBuilderDraft || !this.businessPlanSelectedType) return;

    if (this.businessPlanIsCustom()) {
      this.businessPlanMessage = 'Custom package specific client ke liye SaaS Control me banega.';
      this.businessPlanOk = false;
      return;
    }

    const payload = {
      business_type: this.businessPlanSelectedType,
      plan_id: String(this.planBuilderDraft?.plan_id || this.planBuilderDraft?.id || ''),
      monthly_price: Number(this.planBuilderDraft?.monthly_price || 0),
      yearly_price: Number(this.planBuilderDraft?.yearly_price || 0),
      status: String(this.planBuilderDraft?.status || 'active'),
      sort_order: Number(this.planBuilderDraft?.sort_order || 0),
      module_ids: Array.isArray(this.planBuilderDraft?.module_ids)
        ? this.planBuilderDraft.module_ids
        : [],
    };

    if (!payload.plan_id) {
      this.businessPlanMessage = 'Plan tier missing hai.';
      this.businessPlanOk = false;
      return;
    }

    this.businessPlanSaving = true;
    this.businessPlanMessage = '';

    try {
      const response = await fetch(
        '/api/superadmin/business-plan-matrix/save?_live=' + Date.now(),
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.message || 'Business plan save failed');
      }

      this.applyBusinessPlanMatrixResponse(result);
      this.businessPlanMessage =
        'Business plan saved. Included modules: ' + payload.module_ids.length;
      this.businessPlanOk = true;
      this.showActionPopup(
        'Business Plan Saved Success',
        String(this.businessPlanSelectedInfo?.name || this.businessPlanSelectedType) +
          ' · ' +
          payload.plan_id,
        true,
      );
    } catch (error: any) {
      this.businessPlanMessage = String(error?.message || 'Business plan save failed');
      this.businessPlanOk = false;
    } finally {
      this.businessPlanSaving = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  // SCS_PLAN_BUILDER_METHODS_END

  moduleCatalogEditorTitle(): string {
    return this.moduleCatalogEditorMode === 'edit' ? 'Edit Module' : 'Add New Module';
  }

  openModuleCatalogCreate(): void {
    const cat =
      this.moduleCatalogCategory && this.moduleCatalogCategory !== 'all'
        ? this.moduleCatalogCategory
        : '';
    this.moduleCatalogEditorMode = 'create';
    this.moduleCatalogEditorOpen = true;
    this.moduleCatalogEditorBusy = false;
    this.moduleCatalogEditorMessage = '';
    this.moduleCatalogEditorOk = true;
    this.moduleCatalogDraft = {
      id: '',
      name: '',
      category: cat,
      price_monthly: 0,
      price_yearly: 0,
      route: '',
      icon: '',
      status: 'active',
      sort_order: 0,
    };
    this.cdr.detectChanges();
  }

  openModuleCatalogEdit(module: any): void {
    if (!module) return;
    this.moduleCatalogEditorMode = 'edit';
    this.moduleCatalogEditorOpen = true;
    this.moduleCatalogEditorBusy = false;
    this.moduleCatalogEditorMessage = '';
    this.moduleCatalogEditorOk = true;
    this.moduleCatalogDraft = {
      id: String(module.id || ''),
      name: String(module.name || ''),
      category: String(module.category || ''),
      price_monthly: Number(module.price_monthly || 0),
      price_yearly: Number(module.price_yearly || 0),
      route: String(module.route || ''),
      icon: String(module.icon || ''),
      status: String(module.status || 'active'),
      sort_order: Number(module.sort_order || 0),
    };
    this.cdr.detectChanges();
  }

  closeModuleCatalogEditor(): void {
    if (this.moduleCatalogEditorBusy) return;
    this.moduleCatalogEditorOpen = false;
    this.moduleCatalogEditorMessage = '';
    this.cdr.detectChanges();
  }

  setModuleCatalogDraftField(field: string, value: any): void {
    const numericFields = ['price_monthly', 'price_yearly', 'sort_order'];
    this.moduleCatalogDraft = {
      ...(this.moduleCatalogDraft || {}),
      [field]: numericFields.includes(field) ? Math.max(0, Number(value || 0)) : value,
    };
    this.cdr.detectChanges();
  }

  async saveModuleCatalogEditor(): Promise<void> {
    const draft = { ...(this.moduleCatalogDraft || {}) };

    draft.id = String(draft.id || '').trim();
    draft.name = String(draft.name || '').trim();
    draft.category = String(draft.category || '').trim();
    draft.route = String(draft.route || '').trim();
    draft.icon = String(draft.icon || '').trim();
    draft.status = String(draft.status || 'active').trim() || 'active';
    draft.price_monthly = Math.max(0, Number(draft.price_monthly || 0));
    draft.price_yearly = Math.max(0, Number(draft.price_yearly || 0));
    draft.sort_order = Math.max(0, Number(draft.sort_order || 0));

    if (!draft.name || !draft.category) {
      this.moduleCatalogEditorMessage = 'Module name aur category required hain.';
      this.moduleCatalogEditorOk = false;
      this.cdr.detectChanges();
      return;
    }

    if (this.moduleCatalogEditorMode === 'edit' && !draft.id) {
      this.moduleCatalogEditorMessage = 'Edit ke liye module ID required hai.';
      this.moduleCatalogEditorOk = false;
      this.cdr.detectChanges();
      return;
    }

    this.moduleCatalogEditorBusy = true;
    this.moduleCatalogEditorMessage = '';
    this.cdr.detectChanges();

    try {
      const endpoint =
        this.moduleCatalogEditorMode === 'edit'
          ? '/api/superadmin/modules/update?_live=' + Date.now()
          : '/api/superadmin/modules/create?_live=' + Date.now();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(draft),
      });

      const result: any = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || 'Module save failed');
      }

      if (result.catalog) {
        this.moduleCatalog = Array.isArray(result.catalog?.modules)
          ? result.catalog.modules
          : this.moduleCatalog;
        this.catalogPlans = this.scsNormalizeCatalogPlans(
          Array.isArray(result.catalog?.plans) ? result.catalog.plans : this.catalogPlans,
        );
      } else {
        await this.loadModuleCatalogForSuperadmin();
      }

      this.moduleCatalogEditorMessage = result.message || 'Module saved.';
      this.moduleCatalogEditorOk = true;
      this.showActionPopup(
        this.moduleCatalogEditorMode === 'edit' ? 'Module Updated Success' : 'Module Created Success',
        draft.name,
        true,
      );
      this.moduleCatalogEditorOpen = false;
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : 'Module save nahi hua.';
      this.moduleCatalogEditorMessage = msg;
      this.moduleCatalogEditorOk = false;
      this.showActionPopup('Module Save Failed', msg, false);
    } finally {
      this.moduleCatalogEditorBusy = false;
      this.cdr.detectChanges();
    }
  }
  // SCS_MODULE_CATALOG_EDITOR_METHODS_END

  tenantSubscription: TenantSubscriptionSummary = {
    status: 'none',
    plan_id: '',
    billing_cycle: '',
    plan_base_amount: 0,
    module_addons_amount: 0,
    amount: 0,
  };
  selectedPlanId = '';
  selectedBillingCycle: 'monthly' | 'yearly' = 'monthly';
  isModulesLoading = false;

  // SCS_SAAS_BUSINESS_ASSIGNMENT_STATE_V1
  saasClientBusinessInfo: any = null;
  saasClientPlans: any[] = [];
  saasClientPlanLoading = false;
  saasClientPlanSaving = false;
  saasClientPlanMessage = '';
  saasClientPlanOk = true;
  saasClientSelectedPlanId = '';
  saasClientBillingCycle: 'monthly' | 'yearly' = 'monthly';

  isOnline = true;
  lastRefreshedAt = '';
  autoRefreshCountdown = 30;

  // SCS_PHASE6794_TRIPLE_BACKUP_OVERVIEW
  tripleBackupSummary: any = {
    ok: false,
    totalBackups: 0,
    latest: null,
    layers: {
      localSQLite: {
        available: false,
        verified: false
      },
      postgres: {
        available: false,
        verified: false
      },
      officeMirror: {
        available: false,
        verified: false,
        implemented: false
      }
    }
  };
  currentTime = '';
  currentDate = '';

  customTheme = {
    sidebar: '#1e40af',
    header: '#ffffff',
    footer: '#ffffff',
    background: '#f1f5f9',
  };

  colorOptions = [
    { name: 'Royal Blue', code: '#1e40af' },
    { name: 'Dark Slate', code: '#0f172a' },
    { name: 'Emerald', code: '#059669' },
    { name: 'Rose', code: '#e11d48' },
    { name: 'Indigo', code: '#4f46e5' },
    { name: 'White', code: '#ffffff' },
  ];

  // SCS_SUPERADMIN_PLATFORM_EXPANSION_STATE_START
  readonly superadminSaasPages: any = {
    'saas-control': {
      icon: Sparkles,
      phase: 'LIVE',
      badge: 'SaaS Control',
      title: 'SaaS Control Center',
      subtitle: 'Global control for plans, modules, billing, tenants and feature access.',
      quickLinks: [
        { title: 'Plans & Pricing', view: 'plans-pricing' },
        { title: 'Module Catalog', view: 'module-catalog' },
        { title: 'Business Suites', view: 'business-suites' },
        { title: 'Payments', view: 'payments-sys-list' },
      ],
      groups: [
        {
          title: 'Subscription Control',
          items: [
            'Plans & Pricing',
            'Monthly / Yearly Billing',
            'Trial Management',
            'Renewals',
            'Suspension / Reactivation',
          ],
        },
        {
          title: 'Tenant Control',
          items: [
            'Tenant Management',
            'Module Entitlements',
            'ClientAdmin Access',
            'Feature Flags',
            'Usage Limits',
          ],
        },
        {
          title: 'Audit & Safety',
          items: [
            'Billing Audit',
            'Module Audit',
            'Admin Actions',
            'Data Export',
            'Restore Points',
          ],
        },
      ],
    },
    'module-catalog': {
      icon: Package,
      phase: 'LIVE',
      badge: 'Global Modules',
      title: 'Module Catalog',
      subtitle:
        'Master catalog for all SaaS, ERP, POS, CRM, clinic, school and restaurant modules.',
      quickLinks: [
        { title: 'Business Suites', view: 'business-suites' },
        { title: 'SaaS Control', view: 'saas-control' },
        { title: 'Plans', view: 'plans-pricing' },
      ],
      groups: [
        {
          title: 'Core / Admin',
          items: [
            'Dashboard',
            'Company Profile',
            'Branches',
            'Users',
            'Roles',
            'Files',
            'Calendar',
            'Notifications',
          ],
        },
        {
          title: 'Sales / CRM',
          items: [
            'Leads',
            'Customers',
            'Deals',
            'Follow-ups',
            'Quotations',
            'Contracts',
            'Loyalty',
            'Feedback',
          ],
        },
        {
          title: 'POS / Retail',
          items: [
            'POS',
            'Barcode',
            'Products',
            'Inventory',
            'Purchase Orders',
            'Suppliers',
            'Returns',
            'Ecommerce',
          ],
        },
        {
          title: 'Restaurant',
          items: [
            'Menu',
            'Tables',
            'Floor Plan',
            'Kitchen Display',
            'Waiter App',
            'Reservations',
            'Delivery',
            'Ingredients',
          ],
        },
        {
          title: 'Finance',
          items: [
            'Invoices',
            'Payments',
            'Receipts',
            'Expenses',
            'Ledger',
            'Tax',
            'Bank Accounts',
            'Subscriptions',
          ],
        },
        {
          title: 'Education',
          items: [
            'Students',
            'Admissions',
            'Classes',
            'Timetable',
            'Attendance',
            'Fees',
            'Exams',
            'Parent Portal',
          ],
        },
        {
          title: 'Clinic / Dental',
          items: [
            'Appointments',
            'Patients',
            'EHR',
            'Prescriptions',
            'Dental Charting',
            'Lab Reports',
            'Queue',
            'Patient Portal',
          ],
        },
        {
          title: 'AI / Reports / Integrations',
          items: [
            'Reports',
            'Sales Analytics',
            'AI Forecast',
            'Risk Score',
            'WhatsApp',
            'Stripe',
            'Bank API',
            'Webhooks',
          ],
        },
      ],
    },
    'business-suites': {
      icon: BriefcaseIcon,
      phase: 'FUTURE',
      badge: 'Business Apps',
      title: 'Business Suites',
      subtitle: 'Ready-made module groups for each client business type.',
      quickLinks: [
        { title: 'Module Catalog', view: 'module-catalog' },
        { title: 'All Clients', view: 'all-tenants' },
        { title: 'Plans', view: 'plans-pricing' },
      ],
      groups: [
        {
          title: 'Store / Retail Suite',
          items: [
            'POS',
            'Inventory',
            'Barcode',
            'Products',
            'Suppliers',
            'Returns',
            'Ecommerce',
            'Payments',
            'Reports',
          ],
        },
        {
          title: 'Restaurant / Cafe Suite',
          items: [
            'POS',
            'Menu',
            'Tables',
            'Kitchen Display',
            'Waiter App',
            'Delivery',
            'Reservations',
            'Food Inventory',
          ],
        },
        {
          title: 'School / Academy Suite',
          items: [
            'Students',
            'Admissions',
            'Classes',
            'Attendance',
            'Fees',
            'Exams',
            'Grades',
            'Parent Portal',
          ],
        },
        {
          title: 'Dental Clinic Suite',
          items: [
            'Appointments',
            'Patient Records',
            'Dental Charting',
            'Treatment Plans',
            'Prescriptions',
            'Lab Reports',
            'Billing',
          ],
        },
        {
          title: 'Medical Clinic Suite',
          items: [
            'Appointments',
            'EHR',
            'Doctor Schedule',
            'Prescriptions',
            'Lab Reports',
            'Pharmacy Stock',
            'Queue',
          ],
        },
        {
          title: 'Salon / Spa Suite',
          items: [
            'Booking',
            'Services Menu',
            'Staff Scheduling',
            'Packages',
            'Memberships',
            'Products',
            'Commission',
          ],
        },
        {
          title: 'Service / Repair Suite',
          items: [
            'Tickets',
            'Job Cards',
            'Work Orders',
            'Projects',
            'Warranty',
            'Field Staff',
            'Invoices',
          ],
        },
        {
          title: 'Hotel / Rental Suite',
          items: [
            'Reservations',
            'Check-in / Check-out',
            'Room Status',
            'Housekeeping',
            'Rental Items',
            'Deposits',
          ],
        },
      ],
    },
    'plans-pricing': {
      icon: CreditCard,
      phase: 'LIVE',
      badge: 'Plans',
      title: 'Plans & Pricing',
      subtitle: 'Frontend structure for SaaS plans. Backend/data will connect next.',
      quickLinks: [
        { title: 'SaaS Control', view: 'saas-control' },
        { title: 'Payments', view: 'payments-sys-list' },
        { title: 'Modules', view: 'module-catalog' },
      ],
      groups: [
        { title: 'Default Plans', items: ['Free', 'Starter', 'Pro', 'Enterprise', 'Custom'] },
        {
          title: 'Plan Rules',
          items: [
            'Base Monthly Price',
            'Base Yearly Price',
            'Included Modules',
            'Max Users',
            'Max Branches',
            'Trial Days',
          ],
        },
        {
          title: 'Client Overrides',
          items: [
            'Custom Amount',
            'Module Addons',
            'Discounts',
            'Manual Activation',
            'Renewal Rules',
          ],
        },
      ],
    },
    'system-health': {
      icon: Server,
      phase: 'LIVE',
      badge: 'Guardian',
      title: 'System Health',
      subtitle: 'Frontend view for platform health, guardian, sync and service status.',
      quickLinks: [
        { title: 'Analytics', view: 'analytics-list' },
        { title: 'RBAC', view: 'rbac' },
        { title: 'Settings', view: 'settings' },
      ],
      groups: [
        {
          title: 'Runtime',
          items: ['Frontend Build', 'Backend API', 'PostgreSQL', 'SQLite Sync', 'Preview Server'],
        },
        {
          title: 'Guardian',
          items: ['Audit Engine', 'Auto Refresh', 'Health Checks', 'Sync Worker', 'Error Logs'],
        },
        {
          title: 'Maintenance',
          items: ['Backup', 'Restore', 'Version Update', 'Cache Clear', 'Diagnostics'],
        },
      ],
    },
  };
  // SCS_SUPERADMIN_PLATFORM_EXPANSION_STATE_END

  private readonly allCategories: DashboardCategory[] = [
    {
      id: 'rbac',
      label: 'RBAC',
      icon: Shield,
      list: 'rbac',
      add: 'rbac-add',
      roles: ['super_admin'],
      description: 'Role Based Access',
      color: 'bg-emerald-50 text-emerald-600',
      phase: 'LIVE',
    },
    {
      id: 'api-gate',
      label: 'API Gateway',
      icon: Network,
      list: 'Endpoints',
      add: 'Security Layer',
      roles: ['super_admin'],
      description: 'Endpoint management & security',
      color: 'cyan',
      phase: 'FUTURE',
    },
    {
      id: 'global-edge',
      label: 'Edge Network',
      icon: Network,
      list: 'Global Map',
      add: 'Regions',
      roles: ['super_admin'],
      description: 'Infrastructure topology',
      color: 'slate',
      phase: 'LIVE',
    },

    {
    id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      list: 'Usage Stats',
      add: 'Audit Logs',
      roles: ['super_admin', 'client_admin'],
      description: 'Reports & audit trails',
      color: 'orange',
      phase: 'SUPPORT',
    },
    {
      id: 'frontend',
      label: 'Frontend Site',
      icon: Globe,
      list: 'Marketplace',
      add: 'Site Pages',
      roles: ['super_admin'],
      description: 'Marketplace & pages',
      color: 'teal',
      phase: 'FUTURE',
    },
    {
      id: 'updater',
      label: 'Auto Update',
      icon: RefreshCcw,
      list: 'Version Control',
      add: 'Plugins',
      roles: ['super_admin'],
      description: 'Version & plugin control',
      color: 'lime',
      phase: 'FUTURE',
    },
    {
      id: 'tenants',
      label: 'Tenant System',
      icon: Building2,
      list: 'Multi Company',
      add: 'Company Create',
      roles: ['super_admin'],
      description: 'Multi-tenant architecture',
      color: 'blue',
      phase: 'FUTURE',
    },
    {
      id: 'license',
      label: 'License System',
      icon: Key,
      list: 'Software Key',
      add: 'Device Binding',
      roles: ['super_admin'],
      description: 'Key & device management',
      color: 'amber',
      phase: 'FUTURE',
    },
    {
      id: 'payments-sys',
      label: 'Payments',
      icon: WalletCards,
      list: 'Billing',
      add: 'Plans',
      roles: ['super_admin', 'client_admin'],
      description: 'Billing & subscription plans',
      color: 'green',
      phase: 'FUTURE',
    },
    {
      id: 'admins',
      label: 'Admins',
      icon: User,
      list: 'List Admins',
      add: 'Add New',
      roles: ['super_admin', 'client_admin'],
      description: 'Admin user management',
      color: 'indigo',
      phase: 'SUPPORT',
    },
    {
      id: 'services',
      label: 'Services',
      icon: Layers,
      list: 'List Services',
      add: 'Add New',
      roles: ['super_admin', 'client_admin', 'client_user'],
      description: 'Service catalogue',
      color: 'purple',
      phase: 'SUPPORT',
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: Users,
      list: 'List Teams',
      add: 'Add New',
      roles: ['super_admin', 'client_admin'],
      description: 'Team & member management',
      color: 'pink',
      phase: 'FUTURE',
    },
    {
      id: 'blogs',
      label: 'Blogs',
      icon: BookOpen,
      list: 'List Blogs',
      add: 'Add New',
      roles: ['super_admin'],
      description: 'Content publishing',
      color: 'rose',
      phase: 'FUTURE',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      list: 'General',
      add: 'Security',
      roles: ['super_admin', 'client_admin'],
      description: 'System configuration',
      color: 'slate',
      phase: 'SUPPORT',
    },
  ];

  categories: DashboardCategory[] = [];


  private onlineHandler = () => {
    this.isOnline = true;
    this.cdr.detectChanges();
  };
  private offlineHandler = () => {
    this.isOnline = false;
    this.cdr.detectChanges();
  };
  private countdownTimer: any = null;
  private clockTimer: any = null;

  // SCS_PHASE677D4_LAZY_BACKUP_MANAGER
  // Backup Manager is loaded only when the backup-manager view opens.
  @ViewChild('backupManagerHost', {
    read: ViewContainerRef
  })
  private backupManagerHost?: ViewContainerRef;

  /* SCS_PHASE753E2_CORRECTED_DATA_PROTECTION */
  @ViewChild('dataProtectionHost', {
    read: ViewContainerRef
  })
  private dataProtectionHost?: ViewContainerRef;

  private dataProtectionRef: any = null;


  private backupManagerRef: any = null;

  constructor(
    public readonly moduleRegistry: ModuleRegistryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dashboardApi: DashboardApiService,
  ) {}

  loadDashboardData(): void {
    this.dashboardViewModel.api.loading = true;

    this.dashboardViewModel.api.initialized = true;

    this.dashboardViewModel.api.lastSync = new Date();

    this.dashboardViewModel.api.error = null;

    // SCS_DASHBOARD_SERVICE_WIREUP_V1

    void this.dashboardApi.loadSummary();
    void this.dashboardApi.loadActivity();
    void this.dashboardApi.loadStatistics();
    void this.dashboardApi.loadHealth();
    void this.dashboardApi.loadMonitoring();
    void this.dashboardApi.loadNotifications();

    // Phase 5.3
    // Backend API integration will be added here.

    this.dashboardViewModel.api.loading = false;
  }

  // SCS_PHASE622_SYNC_METHOD
  syncModuleRegistry(): void {
    // SCS_PHASE628_PUBLIC_SYNC

    // SCS_PHASE631_MANAGE_REGISTRY_SYNC
    // Manage always keeps ALL registered modules.
    // SCS_PHASE662_QUICK_ACTION_MANAGE_SYNC
    // Manage uses the same population as Quick Actions.
    // Hidden modules remain available for Eye restore.
    this.dashboardViewModel.modules = this.moduleRegistry.getQuickActionManageModules();

    this.dashboardViewModel.quickActions.modules = this.moduleRegistry.getQuickActions();
  }

  async ngOnInit(): Promise<void> {
    // SCS_MODULE_REGISTRY_BOOTSTRAP_V1
    // SCS_PHASE623_SYNC_CALL
    this.syncModuleRegistry();

    // SCS_BUSINESS_PLAN_MATRIX_AUTOLOAD_V1
    setTimeout(() => {
      void this.businessPlanEnsureLoaded();
    }, 0);
    this.isOnline = navigator.onLine;
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.updateDateTime();
    this.clockTimer = setInterval(() => {
      this.updateDateTime();
      this.cdr.detectChanges();
    }, 1000);
    await this.loadCurrentUser();
    await this.loadTripleBackupSummary();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  private startAutoRefresh(): void {
    this.autoRefreshCountdown = 30;
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.autoRefreshCountdown--;
      if (this.autoRefreshCountdown <= 0) {
        this.autoRefreshCountdown = 30;
        if (this.backendRole === 'super_admin' && this.isOnline && !this.isClientActionBusy) {
          this.silentRefresh();
        }
      }
      this.cdr.detectChanges(); // 🚀 FIX: Timer ticking update
    }, 1000);
  }

  // SCS_PHASE6794_TRIPLE_BACKUP_OVERVIEW_LOADER
  private async loadTripleBackupSummary(): Promise<void> {
    if (this.backendRole !== 'super_admin') return;

    try {
      this.tripleBackupSummary =
        await this.dashboardApi.loadTripleBackupSummary();

    } catch {
      /*
       * Preserve the existing dashboard if the backup API
       * is temporarily unavailable.
       */
    } finally {
      this.cdr.detectChanges();
    }
  }

  private async silentRefresh(): Promise<void> {
    if (this.backendRole !== 'super_admin') return;
    try {
      await this.loadTripleBackupSummary();
      const limit = 100;
      let offset = 0;
      let allRows: SuperadminClient[] = [];
      let lastResult: any = null;
      while (true) {
        const params = new URLSearchParams({
          status: 'all',
          limit: String(limit),
          offset: String(offset),
        });
        const response = await fetch(
          `/api/superadmin/clients?${params.toString()}&_t=${Date.now()}`,
          { method: 'GET', credentials: 'include', cache: 'no-store' },
        );
        const result: any = await response.json().catch(() => null);
        if (!response.ok || !result?.ok) return;
        lastResult = result;
        const rows = Array.isArray(result.clients) ? result.clients : [];
        allRows = [...allRows, ...rows];
        offset += rows.length;
        if (!result.has_more || rows.length === 0 || offset >= Number(result.total || 0)) break;
      }
      this.allSuperadminClients = allRows;
      this.clientTotals = lastResult?.totals || this.clientTotals;
      this.applyClientLocalView();
      const now = new Date();
      this.lastRefreshedAt = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
hour12: true,
      second: '2-digit',
});
    } catch {
    } finally {
      this.cdr.detectChanges();
    } // 🚀 FIX: Silent refresh update
  }

  updateDateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      second: '2-digit',
});
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  private async loadCurrentUser(): Promise<void> {
    this.isAuthLoading = true;
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('scs_auth_mock') === 'true') {
        const user = { role: 'super_admin' as BackendRole, email: 'superadmin@softcodesolution.local', name: 'Super Admin', tenant_id: 'tenant-1' };
        this.userEmail = user.email;
        this.tenantId = user.tenant_id || '';
        this.backendRole = user.role;
        this.userRole = user.role === 'super_admin' ? 'SUPER_ADMIN' : 'CLIENT';
        this.userName = this.nameFromEmail(user.email);
        this.categories = this.allCategories.filter((cat) => cat.roles.includes(user.role));
        if (user.role === 'super_admin') {
          this.activeView = 'home';
          this.clientStatusTab = 'all';
        }
        this.isAuthLoading = false;
        this.cdr.detectChanges();
        return;
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const result = (await response.json().catch(() => null)) as AuthMeResponse | null;
      if (!response.ok || !result?.ok || !result.user) {
        await this.router.navigateByUrl('/login');
        return;
      }
      const user = result.user;
      this.userEmail = user.email;
      this.tenantId = user.tenant_id || '';
      this.backendRole = user.role;
      this.userRole = user.role === 'super_admin' ? 'SUPER_ADMIN' : 'CLIENT';
      this.userName = this.nameFromEmail(user.email);
      this.categories = this.allCategories.filter((cat) => cat.roles.includes(user.role));
      if (user.role === 'super_admin') {
        this.activeView = 'home';
        this.clientStatusTab = 'all';
      }
      if (this.router.url.startsWith('/superadmin') && user.role !== 'super_admin') {
        await this.router.navigateByUrl('/dashboard');
        return;
      }
      if (this.router.url.startsWith('/dashboard') && user.role === 'super_admin') {
        await this.router.navigateByUrl('/superadmin');
        return;
      }
      if (user.role === 'super_admin') {
        await this.loadSuperadminClients(true);
      } else {
        await this.loadClientAllowedModules();
      }
    } catch {
      await this.router.navigateByUrl('/login');
    } finally {
      this.isAuthLoading = false;
      this.cdr.detectChanges(); // 🚀 FIX: Ensure UI removes loader
    }
  }

  private nameFromEmail(email: string): string {
    const name = (email || '').split('@')[0] || 'User';
    return name.replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  async loadSuperadminClients(reset = true): Promise<void> {
    if (this.backendRole !== 'super_admin') return;
    this.isClientsLoading = this.allSuperadminClients.length === 0;
    this.actionMessage = '';
    this.cdr.detectChanges(); // 🚀 FIX: Show loading state immediately

    try {
      const limit = 100;
      let offset = 0;
      let allRows: SuperadminClient[] = [];
      let lastResult: any = null;
      while (true) {
        const params = new URLSearchParams({
          status: 'all',
          limit: String(limit),
          offset: String(offset),
        });
        const response = await fetch(
          `/api/superadmin/clients?${params.toString()}&_t=${Date.now()}`,
          { method: 'GET', credentials: 'include', cache: 'no-store' },
        );
        const result: any = await response.json().catch(() => null);
        if (!response.ok || !result?.ok) {
          // Graceful fallback for UI prototype without backend
          this.allSuperadminClients = [];
          this.applyClientLocalView();
          this.isClientsLoading = false;
          this.cdr.detectChanges();
          return;
        }
        lastResult = result;
        const rows = Array.isArray(result.clients) ? result.clients : [];
        allRows = [...allRows, ...rows];
        offset += rows.length;
        if (!result.has_more || rows.length === 0 || offset >= Number(result.total || 0)) break;
      }
      this.allSuperadminClients = allRows.map((row: any) => ({ ...row }));
      this.clientTotals = lastResult?.totals || this.clientTotals;
      this.clientPage = 1;
      this.applyClientLocalView();
      const now = new Date();
      this.lastRefreshedAt = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
hour12: true,
      second: '2-digit',
});
      this.autoRefreshCountdown = 30;
    } catch {
      this.actionMessage = 'Network error. Please retry.';
      this.actionSuccess = false;
    } finally {
      this.isClientsLoading = false;
      this.cdr.detectChanges(); // 🚀 FIX: Remove loading state and show data
    }
  }

  applyClientLocalView(): void {
    const search = (this.clientSearch || '').toLowerCase().trim();
    let rows = [...this.allSuperadminClients];

    if (this.clientStatusTab !== 'all') {
      rows = rows.filter((c) => {
        if (this.clientStatusTab === 'pending')
          return c.status === 'pending' || c.status === 'pending_verification';
        return c.status === this.clientStatusTab;
      });
    }

    if (search) {
      rows = rows.filter(
        (c) =>
          (c.full_name || '').toLowerCase().includes(search) ||
          (c.email || '').toLowerCase().includes(search) ||
          (c.company_name || '').toLowerCase().includes(search) ||
          (c.business_type || '').toLowerCase().includes(search) ||
          (c.country || '').toLowerCase().includes(search) ||
          (c.city || '').toLowerCase().includes(search) ||
          (c.phone || '').toLowerCase().includes(search),
      );
    }

    this.clientTotal = rows.length;
    const totalPages = Math.max(1, Math.ceil(this.clientTotal / this.clientLimit));
    if (this.clientPage > totalPages) this.clientPage = totalPages;
    if (this.clientPage < 1) this.clientPage = 1;
    const start = (this.clientPage - 1) * this.clientLimit;
    this.superadminClients = rows.slice(start, start + this.clientLimit).map((c) => ({ ...c }));
    this.clientOffset = start + this.superadminClients.length;
    this.clientHasMore = this.clientPage < totalPages;

    this.cdr.detectChanges(); // 🚀 FIX: Update local table instantly
  }

  get clientTotalPages(): number {
    return Math.max(1, Math.ceil((this.clientTotal || 0) / this.clientLimit));
  }
  nextClientPage(): void {
    if (this.clientPage < this.clientTotalPages) {
      this.clientPage++;
      this.applyClientLocalView();
    }
  }
  previousClientPage(): void {
    if (this.clientPage > 1) {
      this.clientPage--;
      this.applyClientLocalView();
    }
  }

  changeClientStatusTab(tab: ClientStatusTab | string): void {
    const safeTab: ClientStatusTab =
      tab === 'pending' || tab === 'approved' || tab === 'rejected' || tab === 'all' ? tab : 'all';
    this.clientStatusTab = safeTab;
    this.clientPage = 1;
    this.clientSearch = '';
    this.closeClientDetail();
    this.applyClientLocalView();
  }

  searchClients(value: string): void {
    this.clientSearch = (value || '').trim();
    this.clientPage = 1;
    this.applyClientLocalView();
  }

  showActionPopup(title: string, message: string, success = true): void {
    // Visual alerts disabled: do not disturb workflow.
    this.popupOpen = false;
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupSuccess = success;
    this.actionMessage = '';
    this.actionSuccess = success;
    this.cdr.detectChanges();
  }

  closeActionPopup(): void {
    this.popupOpen = false;
    this.cdr.detectChanges(); // 🚀 FIX: Force popup to disappear immediately
  }

  openConfirm(title: string, message: string, action: () => Promise<void>, danger = false): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmAction = action;
    this.confirmDanger = danger;
    this.confirmOpen = true;
    this.cdr.detectChanges(); // 🚀 FIX: Show confirmation modal immediately
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.confirmAction = null;
    this.cdr.detectChanges(); // 🚀 FIX: Close confirmation modal immediately
  }

  async runConfirm(): Promise<void> {
    if (!this.confirmAction) return;
    const fn = this.confirmAction;
    this.closeConfirm();
    await fn();
  }

  moduleIcon(iconName: string): any {
    return (this.icons as any)[iconName] || this.icons.Package;
  }

  // Enters preview mode for one client. Superadmin session/cookie
  // is untouched — only fetches this client's enabled modules via
  // the superadmin-scoped endpoint and renders them the same way
  // the client's own dashboard would.
  async previewClientDashboard(client: SuperadminClient | null): Promise<void> {
    if (!client) return;

    this.previewSnapshot = {
      userRole: this.userRole,
      categories: this.categories,
      activeView: this.activeView,
    };

    try {
      const params = new URLSearchParams();
      params.set('client_id', String(client.id));
      params.set('_live', String(Date.now()));

      const response = await fetch('/api/superadmin/tenant-modules?' + params.toString(), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const result: any = await response.json().catch(() => null);

      let modules: any[] = [];
      if (response.ok && result?.ok && Array.isArray(result.modules)) {
         modules = result.modules;
      } else {
         // Prototype fallback based on business type
         const businessType = String(client.business_type || 'store');
         modules = [
            { id: 'dashboard', name: 'Analytics', route: 'dashboard', icon: 'BarChart3', enabled: true, category: 'core' },
            { id: 'users', name: 'Users', route: 'users', icon: 'Users', enabled: true, category: 'core' }
         ];
         
         if (businessType === 'store' || businessType === 'ecommerce') {
             modules.push(
               { id: 'inventory', name: 'Inventory', route: 'inventory', icon: 'Package', enabled: true, category: 'store' },
               { id: 'pos', name: 'POS', route: 'pos', icon: 'CreditCard', enabled: true, category: 'store' }
             );
         } else if (businessType === 'clinic' || businessType === 'healthcare') {
             modules.push(
               { id: 'patients', name: 'Patients', route: 'patients', icon: 'Users', enabled: true, category: 'clinic' },
               { id: 'appointments', name: 'Appointments', route: 'appointments', icon: 'Calendar', enabled: true, category: 'clinic' }
             );
         } else if (businessType === 'school' || businessType === 'education') {
             modules.push(
               { id: 'students', name: 'Students', route: 'students', icon: 'Users', enabled: true, category: 'school' },
               { id: 'attendance', name: 'Attendance', route: 'attendance', icon: 'CheckCircle2', enabled: true, category: 'school' }
             );
         } else {
             modules.push(
               { id: 'projects', name: 'Projects', route: 'projects', icon: 'Folder', enabled: true, category: 'business' },
               { id: 'billing', name: 'Billing', route: 'billing', icon: 'CreditCard', enabled: true, category: 'business' }
             );
         }
      }

      const enabledModules = (modules as TenantModule[]).filter((m: TenantModule) => !!m.enabled);

      this.categories = enabledModules.map((m: TenantModule) => this.moduleToCategory(m));
      this.userRole = 'CLIENT';
      this.previewClient = client;
      this.previewMode = true;
      this.activeView = 'home';
      this.closeClientPopupSecure();
    } catch (e) {
      this.showActionPopup('Preview Failed', 'Client dashboard preview load nahi hui.', false);
      this.previewSnapshot = null;
    } finally {
      this.cdr.detectChanges();
    }
  }

  exitClientPreview(): void {
    if (this.previewSnapshot) {
      this.userRole = this.previewSnapshot.userRole;
      this.categories = this.previewSnapshot.categories;
      this.activeView = this.previewSnapshot.activeView;
    }
    this.previewSnapshot = null;
    this.previewMode = false;
    this.previewClient = null;
    this.cdr.detectChanges();
  }

  private moduleToCategory(module: TenantModule): DashboardCategory {
    return {
      id: module.route || module.id,
      label: module.name,
      icon: this.moduleIcon(module.icon),
      list: module.name + ' Dashboard',
      add: 'Settings',
      roles: ['client_admin', 'client_user', 'support'],
      description: module.category + ' module',
      color: 'blue',
    };
  }

  moduleCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      store: 'Store Management',
      school: 'School Management',
      restaurant: 'Restaurant Management',
      clinic: 'Clinic Management',
      business: 'Business Tools',
      finance: 'Finance',
      analytics: 'Reports',
      frontend: 'Website',
    };
    return labels[category] || category;
  }

  tenantModuleCategories(): string[] {
    const order = [
      'store',
      'school',
      'restaurant',
      'clinic',
      'business',
      'finance',
      'analytics',
      'frontend',
    ];
    const unique = Array.from(new Set(this.tenantModules.map((m) => m.category || 'business')));
    return unique.sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }

  tenantModulesByCategory(category: string): TenantModule[] {
    return this.tenantModules.filter((m) => (m.category || 'business') === category);
  }

  async loadClientAllowedModules(): Promise<void> {
    try {
      const response = await fetch('/api/client/modules?_live=' + Date.now(), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const result: any = await response.json().catch(() => null);
      if (response.ok && result?.ok && Array.isArray(result.modules)) {
        const enabledModules = result.modules.filter((m: TenantModule) => !!m.enabled);
        this.categories = enabledModules.map((m: TenantModule) => this.moduleToCategory(m));
        this.tenantSubscription = result.subscription || this.tenantSubscription;
      }
    } catch {
      this.categories = [];
    } finally {
      this.cdr.detectChanges();
    } // 🚀 FIX
  }

  async loadModuleCatalogForSuperadmin(): Promise<void> {
    const response = await fetch('/api/superadmin/modules?_live=' + Date.now(), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    const result: any = await response.json().catch(() => null);
    if (response.ok && result?.ok) {
      this.moduleCatalog = Array.isArray(result.catalog?.modules) ? result.catalog.modules : [];

      // SCS_REGISTRY_SYNC_V1
      this.moduleRegistry.updateModules(
        this.moduleCatalog.map((module) => ({
          code: module.id,
          label: module.name,
          route: module.route,
          icon: module.icon,
          category: module.category,

          pinned: false,
          hidden: !module.enabled,
        })),
      );
      this.catalogPlans = this.scsNormalizeCatalogPlans(
        Array.isArray(result.catalog?.plans) ? result.catalog.plans : [],
      );
      this.cdr.detectChanges(); // 🚀 FIX
    }
  }
  // SCS_SAAS_BUSINESS_ASSIGNMENT_METHODS_V1
  saasAssignablePlans(): any[] {
    const allowed = new Set(['starter', 'pro', 'enterprise']);

    return this.saasClientPlans
      .filter((plan: any) => allowed.has(String(plan?.id || plan?.plan_id || '').toLowerCase()))
      .sort((a: any, b: any) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0));
  }

  saasSelectedBusinessPlan(): any | null {
    const selectedID = String(this.saasClientSelectedPlanId || this.selectedPlanId || '');

    return (
      this.saasAssignablePlans().find(
        (plan: any) => String(plan?.id || plan?.plan_id || '') === selectedID,
      ) || null
    );
  }

  saasBusinessPlanPrice(plan: any): number {
    if (!plan) return 0;

    return this.saasClientBillingCycle === 'yearly'
      ? Number(plan.yearly_price || 0)
      : Number(plan.monthly_price || 0);
  }

  saasBusinessPlanModuleCount(plan: any): number {
    if (Array.isArray(plan?.module_ids)) {
      return plan.module_ids.length;
    }

    return Number(plan?.module_count || 0);
  }

  saasBusinessPlanModuleNames(plan: any): string {
    const ids: string[] = Array.isArray(plan?.module_ids)
      ? plan.module_ids.map((id: any) => String(id))
      : [];

    if (ids.length === 0) return 'No included modules';

    const names = ids
      .map((id: string) => {
        const module = this.moduleCatalog.find((item: any) => String(item?.id || '') === id);

        return String(module?.name || id);
      })
      .slice(0, 5);

    const remaining = Math.max(0, ids.length - names.length);

    return names.join(', ') + (remaining > 0 ? ' +' + remaining + ' more' : '');
  }

  // SCS_SAAS_SELECTED_TOTAL_V1
  saasSelectedManualAddonsTotal(): number {
    const selectedPlan = this.saasSelectedBusinessPlan();

    const includedModules = new Set(
      Array.isArray(selectedPlan?.module_ids)
        ? selectedPlan.module_ids.map((id: any) => String(id))
        : [],
    );

    return this.tenantModules.reduce((total: number, module: any) => {
      const moduleID = String(module?.id || module?.module_id || '');

      if (!moduleID) return total;

      if (!this.scsSuperIsModuleEnabled(module)) {
        return total;
      }

      if (includedModules.has(moduleID)) {
        return total;
      }

      const source = String(module?.source || '').toLowerCase();

      if (source === 'plan') {
        return total;
      }

      const price =
        this.saasClientBillingCycle === 'yearly'
          ? Number(module?.price_yearly ?? module?.yearly_price_snapshot ?? 0)
          : Number(module?.price_monthly ?? module?.monthly_price_snapshot ?? 0);

      return total + Math.max(0, price || 0);
    }, 0);
  }

  saasSelectedPackageTotal(): number {
    return (
      this.saasBusinessPlanPrice(this.saasSelectedBusinessPlan()) +
      this.saasSelectedManualAddonsTotal()
    );
  }

  saasClientBusinessLabel(): string {
    return String(
      this.saasClientBusinessInfo?.name ||
        this.saasClientBusinessInfo?.label ||
        this.selectedClient?.business_type ||
        'Unknown business',
    );
  }

  saasClientSetBillingCycle(value: string): void {
    this.saasClientBillingCycle = value === 'yearly' ? 'yearly' : 'monthly';

    this.selectedBillingCycle = this.saasClientBillingCycle;
    this.scsSuperApplyLive();
    this.cdr.detectChanges();
  }

  saasClientSelectPlan(planID: string): void {
    this.saasClientSelectedPlanId = String(planID || '');
    this.selectedPlanId = this.saasClientSelectedPlanId;

    this.scsSuperApplyLive();
    this.cdr.detectChanges();
  }

  async loadSaasClientBusinessPlans(client: SuperadminClient | null): Promise<void> {
    this.saasClientBusinessInfo = null;
    this.saasClientPlans = [];
    this.saasClientPlanMessage = '';
    this.saasClientPlanOk = true;
    this.saasClientSelectedPlanId = '';

    if (!client) {
      this.cdr.detectChanges();
      return;
    }

    this.saasClientPlanLoading = true;
    this.cdr.detectChanges();

    try {
      const businessType = String(client.business_type || 'other_business');

      const params = new URLSearchParams();
      params.set('business_type', businessType);
      params.set('_live', String(Date.now()));

      const response = await fetch('/api/superadmin/business-plan-matrix?' + params.toString(), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const result: any = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || 'Client business plans load nahi huwe.');
      }

      this.saasClientBusinessInfo = result.selected_business || null;

      this.saasClientPlans = Array.isArray(result.plans) ? result.plans : [];

      const assignable = this.saasAssignablePlans();

      const currentPlanID = String(this.tenantSubscription.plan_id || '').toLowerCase();

      const currentIsAssignable = assignable.some(
        (plan: any) => String(plan?.id || plan?.plan_id || '') === currentPlanID,
      );

      const starter = assignable.find(
        (plan: any) => String(plan?.id || plan?.plan_id || '') === 'starter',
      );

      this.saasClientSelectedPlanId = currentIsAssignable
        ? currentPlanID
        : String(
            starter?.id || starter?.plan_id || assignable[0]?.id || assignable[0]?.plan_id || '',
          );

      this.saasClientBillingCycle =
        this.tenantSubscription.billing_cycle === 'yearly' || client.billing_cycle === 'yearly'
          ? 'yearly'
          : 'monthly';

      this.selectedPlanId = this.saasClientSelectedPlanId;
      this.selectedBillingCycle = this.saasClientBillingCycle;

      this.scsSuperApplyLive();
    } catch (error: any) {
      this.saasClientPlanMessage =
        error instanceof Error ? error.message : 'Business plans load nahi huwe.';

      this.saasClientPlanOk = false;
    } finally {
      this.saasClientPlanLoading = false;
      this.cdr.detectChanges();
    }
  }

  async assignSaasClientBusinessPlan(): Promise<void> {
    const client = this.selectedClient;

    if (!client) {
      this.showActionPopup('Client Required', 'Pehle client select karo.', false);
      return;
    }

    if (client.status !== 'approved') {
      this.showActionPopup('Approval Required', 'Plan sirf approved client ko assign hoga.', false);
      return;
    }

    if (!this.saasClientSelectedPlanId) {
      this.showActionPopup('Plan Required', 'Starter, Pro ya Enterprise select karo.', false);
      return;
    }

    this.saasClientPlanSaving = true;
    this.saasClientPlanMessage = '';
    this.cdr.detectChanges();

    try {
      const response = await fetch('/api/superadmin/subscriptions/save?_live=' + Date.now(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          tenant_id: client.tenant_id || '',
          client_id: client.id || '',
          email: client.email || '',
          plan_id: this.saasClientSelectedPlanId,
          billing_cycle: this.saasClientBillingCycle,
          status: 'active',
        }),
      });

      const result: any = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || 'Business plan save nahi hua.');
      }

      this.scsSuperApplyServerSubscription(result.subscription);

      await this.scsSuperLoadModules();
      await this.loadSaasClientBusinessPlans(client);
      await this.loadSuperadminClients(true);

      const refreshed = this.superadminClients.find(
        (item: any) => String(item?.id || '') === String(client.id || ''),
      );

      if (refreshed) {
        this.selectedClient = { ...refreshed };
        this.scsSuperProfileClient = { ...refreshed };
      }

      this.saasClientPlanMessage =
        result.message || 'Business plan aur included modules assign ho gaye.';

      this.saasClientPlanOk = true;

      this.showActionPopup(
        'Business Plan Assigned Success',
        this.saasClientBusinessLabel() +
          ' / ' +
          this.saasClientSelectedPlanId +
          ' / Rs ' +
          Number(result.subscription?.amount || 0),
        true,
      );
    } catch (error: any) {
      this.saasClientPlanMessage =
        error instanceof Error ? error.message : 'Business plan save nahi hua.';

      this.saasClientPlanOk = false;

      this.showActionPopup('Plan Assignment Failed', this.saasClientPlanMessage, false);
    } finally {
      this.saasClientPlanSaving = false;
      this.cdr.detectChanges();
    }
  }

  // Reads the real, saved subscription for one client from the
  // backend. Read-only — never creates or changes anything.
  // Runs before loadSaasClientBusinessPlans() because that
  // function needs the correct tenantSubscription.plan_id to
  // know which plan card should show as "current".
  async loadSaasClientSubscription(client: SuperadminClient | null): Promise<void> {
    if (!client) {
      this.tenantSubscription = {
        status: 'none',
        plan_id: '',
        billing_cycle: '',
        plan_base_amount: 0,
        module_addons_amount: 0,
        amount: 0,
      };
      this.cdr.detectChanges();
      return;
    }

    try {
      const params = new URLSearchParams();
      if (client.id) params.set('client_id', String(client.id));
      params.set('_live', String(Date.now()));

      const response = await fetch('/api/superadmin/subscriptions/load?' + params.toString(), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const result: any = await response.json().catch(() => null);

      if (response.ok && result?.ok && result.subscription) {
        this.tenantSubscription = result.subscription;
      } else {
        // No saved subscription yet for this client — that's a
        // valid state, not an error. Show a clean "none" card.
        this.tenantSubscription = {
          status: 'none',
          plan_id: '',
          billing_cycle: '',
          plan_base_amount: 0,
          module_addons_amount: 0,
          amount: 0,
        };
      }
    } catch {
      this.tenantSubscription = {
        status: 'none',
        plan_id: '',
        billing_cycle: '',
        plan_base_amount: 0,
        module_addons_amount: 0,
        amount: 0,
      };
    } finally {
      this.cdr.detectChanges();
    }
  }

  async selectSaasControlClient(clientId: string): Promise<void> {
    // Save scroll position before loading modules
    const _el = document.querySelector('main > .overflow-y-auto') as HTMLElement | null;
    const _y = _el ? _el.scrollTop : 0;

    const client =
      (this.superadminClients || []).find((c: any) => String(c.id) === String(clientId)) || null;
    this.scsSuperProfileClient = client ? { ...client } : null;
    this.selectedClient = client ? { ...client } : null;
    this.tenantModules = [];
    this.scsSuperModuleEnabledState = {};
    this.cdr.detectChanges();

    if (client) {
      // Load the real saved subscription FIRST so plan cards and
      // billing cycle reflect this client, not the previous one.
      await this.loadSaasClientSubscription(client);

      if (client.status === 'approved') {
        await this.scsSuperLoadModules();
      }
      await this.loadSaasClientBusinessPlans(client);
    } else {
      await this.loadSaasClientSubscription(null);
    }

    // Restore scroll after modules load
    if (_el)
      requestAnimationFrame(() => {
        _el.scrollTop = _y;
      });
    this.cdr.detectChanges();
  }

  async loadTenantModulesForSelectedClient(_client: SuperadminClient | null): Promise<void> {
    // Eye popup removed. New professional popup will be built fresh.
    this.tenantModules = [];
    this.cdr.detectChanges();
  }
  setBillingCycle(value: string): void {
    this.scsSuperSetBilling(value);
  }
  async saveClientSubscription(_planId: string): Promise<void> {
    await this.scsSuperApplyPlan();
  }
  async toggleTenantModule(module: TenantModule): Promise<void> {
    await this.scsSuperToggleModule(module);
  }
  async saveTenantModulePrice(module: TenantModule): Promise<void> {
    await this.scsSuperSaveModulePrice(module);
  }
  openClientDetail(client: SuperadminClient): void {
    this.openClientPopupSecure(client);
  }
  closeClientDetail(): void {
    this.closeClientPopupSecure();
  }
  startEditClient(): void {
    if (!this.selectedClient) return;
    this.editClientDraft = { ...this.selectedClient };
    this.isEditMode = true;
    this.cdr.detectChanges(); // 🚀 FIX
  }
  cancelEditClient(): void {
    if (!this.selectedClient) return;
    this.editClientDraft = { ...this.selectedClient };
    this.isEditMode = false;
    this.cdr.detectChanges(); // 🚀 FIX
  }
  setEditField(field: keyof SuperadminClient, value: string): void {
    (this.editClientDraft as any)[field] = value;
    this.cdr.detectChanges();
  }

  async saveClientEdit(): Promise<void> {
    if (!this.selectedClient) return;
    this.isClientActionBusy = true;
    this.cdr.detectChanges(); // 🚀 FIX
    try {
      const response = await fetch('/api/superadmin/clients/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          id: this.selectedClient.id,
          full_name: this.editClientDraft.full_name || '',
          country_code: this.editClientDraft.country_code || '',
          phone: this.editClientDraft.phone || '',
          company_name: this.editClientDraft.company_name || '',
          business_type: this.editClientDraft.business_type || '',
          business_size: this.editClientDraft.business_size || '',
          country: this.editClientDraft.country || '',
          city: this.editClientDraft.city || '',
          state: this.editClientDraft.state || '',
          address: this.editClientDraft.address || '',
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (response.ok && result?.ok) {
        this.isEditMode = false;
        const currentID = this.selectedClient.id;
        await this.loadSuperadminClients(true);
        const updated = this.superadminClients.find((c) => c.id === currentID);
        if (updated) this.openClientDetail(updated);
        this.showActionPopup(
          'Client Updated Success',
          'Client information has been saved successfully.',
          true,
        );
      } else {
        this.showActionPopup('Update Failed', result?.message || 'Could not save changes.', false);
      }
    } catch {
      this.showActionPopup('Network Error', 'Could not reach server.', false);
    } finally {
      this.isClientActionBusy = false;
      this.cdr.detectChanges(); // 🚀 FIX
    }
  }

  requestApproveClient(client: SuperadminClient): void {
    this.openConfirm(
      'Approve Client',
      `Approve ${client.full_name || client.email}? This will activate their account.`,
      () => this.approveClient(client),
      false,
    );
  }
  requestRejectClient(client: SuperadminClient): void {
    this.openConfirm(
      'Reject Client',
      `Reject ${client.full_name || client.email}? Registration will be declined.`,
      () => this.rejectClient(client),
      true,
    );
  }

  async approveClient(client: SuperadminClient): Promise<void> {
    if (this.backendRole !== 'super_admin') return;
    this.isClientActionBusy = true;
    this.cdr.detectChanges(); // 🚀 FIX
    try {
      const response = await fetch('/api/superadmin/clients/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ id: client.id }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (response.ok && result?.ok) {
        this.closeClientDetail();
        await this.loadSuperadminClients(true);
        this.showActionPopup(
          'Client Approved Success',
          `${client.full_name || client.email} approved. Tenant access active.`,
          true,
        );
      } else {
        this.showActionPopup('Approve Failed', result?.message || 'Could not approve.', false);
      }
    } catch {
      this.showActionPopup('Network Error', 'Could not reach server.', false);
    } finally {
      this.isClientActionBusy = false;
      this.cdr.detectChanges(); // 🚀 FIX
    }
  }

  async rejectClient(client: SuperadminClient): Promise<void> {
    if (this.backendRole !== 'super_admin') return;
    this.isClientActionBusy = true;
    this.cdr.detectChanges(); // 🚀 FIX
    try {
      const response = await fetch('/api/superadmin/clients/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ id: client.id }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (response.ok && result?.ok) {
        this.closeClientDetail();
        await this.loadSuperadminClients(true);
        this.showActionPopup(
          'Client Rejected',
          `${client.full_name || client.email} registration declined.`,
          false,
        );
      } else {
        this.showActionPopup('Reject Failed', result?.message || 'Could not reject.', false);
      }
    } catch {
      this.showActionPopup('Network Error', 'Could not reach server.', false);
    } finally {
      this.isClientActionBusy = false;
      this.cdr.detectChanges(); // 🚀 FIX
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } finally {
      // SCS_PHASE667_PRESERVE_MODULE_PREFERENCES
      // Keep persistent module visibility across logout/login.
      const moduleState = localStorage.getItem('scs.dashboard.module.visibility.v1');

      localStorage.clear();

      if (moduleState !== null) {
        localStorage.setItem('scs.dashboard.module.visibility.v1', moduleState);
      }

      await this.router.navigateByUrl('/login');
    }
  }

  toggleSidebar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarOpen = !this.isSidebarOpen;
    this.cdr.detectChanges();
  }
  toggleDropdown(id: string): void {
    this.openDropdowns[id] = !this.openDropdowns[id];
    this.cdr.detectChanges();
  }
  toggleThemeMenu(): void {
    this.isThemeMenuOpen = !this.isThemeMenuOpen;
    this.cdr.detectChanges();
  }
  updateColor(part: string, color: string): void {
    (this.customTheme as any)[part] = color;
    this.cdr.detectChanges();
  }

  // SCS_PHASE677D4_DYNAMIC_BACKUP_MANAGER
  private async loadBackupManager(): Promise<void> {
    // SCS_PHASE697_BACKUP_MANAGER_HOST_WAIT_FIX

    for (let attempt = 0; attempt < 20; attempt++) {
      this.cdr.detectChanges();

      if (this.backupManagerHost) {
        break;
      }

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    if (!this.backupManagerHost) {
      console.error(
        '❌ Backup Manager host was not created after waiting for the backup-manager view.'
      );
      return;
    }

    if (this.backupManagerRef) {
      this.backupManagerRef.destroy();
      this.backupManagerRef = null;
    }

    const module =
      /* SCS_PHASE753C2_DATA_PROTECTION_WIRING */
      await import('./backup-manager/backup-manager.component');

    this.backupManagerHost.clear();

    this.backupManagerRef =
      this.backupManagerHost.createComponent(
        module.BackupManagerComponent
      );

    this.cdr.detectChanges();
  }

  /*
   * SCS_PHASE753E2_CORRECTED_DATA_PROTECTION
   *
   * Completely independent from Backup Manager.
   */
  private async loadDataProtection(): Promise<void> {

    for (
      let attempt = 0;
      attempt < 20;
      attempt++
    ) {

      this.cdr.detectChanges();

      if (
        this.dataProtectionHost
      ) {
        break;
      }

      await new Promise<void>(
        resolve => {
          setTimeout(
            resolve,
            100
          );
        }
      );

    }

    if (
      !this.dataProtectionHost
    ) {

      console.error(
        '❌ Data Protection host was not created after waiting for the data-protection view.'
      );

      return;
    }

    if (
      this.dataProtectionRef
    ) {

      this.dataProtectionRef.destroy();

      this.dataProtectionRef =
        null;

    }

    const module =
      await import(
        './data-protection/data-protection.component'
      );

    this.dataProtectionHost.clear();

    this.dataProtectionRef =
      this.dataProtectionHost.createComponent(
        module.DashboardDataProtectionComponent
      );

    this.cdr.detectChanges();

  }


  async navigateTo(view: string): Promise<void> {
    this.activeView = view;

    if (view === 'backup-manager') {
      await this.loadBackupManager();
    }

    if (view === 'data-protection') {
      await this.loadDataProtection();
    }

    this.isThemeMenuOpen = false;
    this.cdr.detectChanges(); // 🚀 FIX
    if (view === 'all-tenants' && this.backendRole === 'super_admin')
      await this.loadSuperadminClients(true);
    if (view === 'saas-control' && this.backendRole === 'super_admin') {
      await this.loadSuperadminClients(true);
      if (this.moduleCatalog.length === 0) await this.loadModuleCatalogForSuperadmin();
    }
  }

  getInitials(name: string): string {
    if (!name) return 'CL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  setDetailTab(tab: string): void {
    if (tab === 'info' || tab === 'system' || tab === 'modules') {
      this.detailTab = tab;
      this.cdr.detectChanges(); // 🚀 FIX
    }
  }
  // SCS_EYE_CLIENT_POPUP_V2_METHODS_REMOVED_SECURE_REBUILD

  // SCS_CLIENT_POPUP_SECURE_METHODS_START
  openClientPopupSecure(client: SuperadminClient): void {
    if (!client) return;

    this.clientPopup = { ...client };
    this.clientPopupDraft = { ...client };
    this.clientPopupTab = 'overview';
    this.clientPopupBusy = false;
    this.clientPopupMessage = '';
    this.clientPopupMessageOk = true;
    this.clientPopupTempPassword = '';
    this.clientPopupAudit = [
      {
        time: new Date().toLocaleString(),
        action: 'Opened client',
        detail: client.email || client.full_name || client.company_name || 'client',
      },
    ];

    // Compatibility for existing edit/update helpers.
    this.selectedClient = { ...client };
    this.editClientDraft = { ...client };
    this.isEditMode = true;

    try {
      this.cdr.detectChanges();
    } catch {}
  }

  closeClientPopupSecure(): void {
    this.clientPopup = null;
    this.clientPopupDraft = {};
    this.clientPopupTab = 'overview';
    this.clientPopupBusy = false;
    this.clientPopupMessage = '';
    this.clientPopupTempPassword = '';
    this.clientPopupAudit = [];

    this.selectedClient = null;
    this.editClientDraft = {};
    this.isEditMode = false;

    try {
      this.cdr.detectChanges();
    } catch {}
  }

  setClientPopupTab(tab: 'overview' | 'edit' | 'status' | 'access' | 'audit'): void {
    this.clientPopupTab = tab;
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  setClientPopupField(field: string, value: string): void {
    this.clientPopupDraft = { ...(this.clientPopupDraft || {}), [field]: value };
    this.editClientDraft = { ...(this.editClientDraft || {}), [field]: value };
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  clientPopupStatusLabel(status: string | undefined): string {
    const s = String(status || 'pending_verification');
    if (s === 'pending_verification' || s === 'pending') return 'Pending';
    return s.replace(/_/g, ' ');
  }

  clientPopupInitial(): string {
    const c: any = this.clientPopup || {};
    return String(c.full_name || c.company_name || c.email || 'C')
      .slice(0, 1)
      .toUpperCase();
  }

  clientPopupAuditAdd(action: string, detail: string): void {
    this.clientPopupAudit = [
      { time: new Date().toLocaleString(), action, detail },
      ...this.clientPopupAudit,
    ].slice(0, 40);
  }

  clientPopupNotice(message: string, ok = true): void {
    this.clientPopupMessage = message;
    this.clientPopupMessageOk = ok;
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  async saveClientPopupInfo(): Promise<void> {
    if (!this.clientPopup) return;

    this.clientPopupBusy = true;
    this.clientPopupMessage = '';
    try {
      this.cdr.detectChanges();
    } catch {}

    try {
      const body: any = {
        id: this.clientPopup.id,
        full_name: this.clientPopupDraft.full_name || '',
        country_code: this.clientPopupDraft.country_code || '',
        phone: this.clientPopupDraft.phone || '',
        company_name: this.clientPopupDraft.company_name || '',
        business_type: this.clientPopupDraft.business_type || '',
        business_size: this.clientPopupDraft.business_size || '',
        country: this.clientPopupDraft.country || '',
        city: this.clientPopupDraft.city || '',
        state: this.clientPopupDraft.state || '',
        address: this.clientPopupDraft.address || '',
      };

      const response = await fetch('/api/superadmin/clients/update?_live=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(body),
      });

      const result: any = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.message || 'Client update failed.');

      const currentID = this.clientPopup.id;
      await this.loadSuperadminClients(true);

      const updated = this.superadminClients.find((c) => c.id === currentID);
      this.clientPopup = { ...(updated || this.clientPopup), ...body };
      this.clientPopupDraft = { ...this.clientPopup };

      this.clientPopupAuditAdd('Client info saved', this.clientPopup?.email || String(currentID));
      this.clientPopupNotice('Client information saved.', true);
      this.showActionPopup('Client Updated Success', 'Client information saved successfully.', true);
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : 'Client update failed.';
      this.clientPopupAuditAdd('Update failed', msg);
      this.clientPopupNotice(msg, false);
      this.showActionPopup('Update Failed', msg, false);
    } finally {
      this.clientPopupBusy = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  async clientPopupStatusAction(
    action: 'approve' | 'reject' | 'suspend' | 'restore',
  ): Promise<void> {
    if (!this.clientPopup) return;

    const endpoint =
      action === 'approve'
        ? '/api/superadmin/clients/approve'
        : action === 'reject'
          ? '/api/superadmin/clients/reject'
          : action === 'restore'
            ? '/api/superadmin/clients/approve'
            : '/api/superadmin/clients/suspend';

    this.clientPopupBusy = true;
    this.clientPopupMessage = '';
    try {
      this.cdr.detectChanges();
    } catch {}

    try {
      const response = await fetch(endpoint + '?_live=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ id: this.clientPopup.id }),
      });

      const result: any = await response.json().catch(() => null);
      if (!response.ok || !result?.ok)
        throw new Error(result?.message || action + ' backend route not ready.');

      await this.loadSuperadminClients(true);
      const updated = this.superadminClients.find((c) => c.id === this.clientPopup?.id);
      if (updated) {
        this.clientPopup = { ...updated };
        this.clientPopupDraft = { ...updated };
      }

      this.clientPopupAuditAdd('Status action', action);
      this.clientPopupNotice('Status updated: ' + action, true);
      this.showActionPopup('Status Updated Success', 'Client status action completed.', true);
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : 'Status action failed.';
      this.clientPopupAuditAdd('Status action failed', action + ': ' + msg);
      this.clientPopupNotice(msg, false);
      this.showActionPopup('Action Failed', msg, false);
    } finally {
      this.clientPopupBusy = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  async sendClientPasswordResetLink(): Promise<void> {
    if (!this.clientPopup) return;

    this.clientPopupBusy = true;
    this.clientPopupTempPassword = '';
    this.clientPopupMessage = '';
    try {
      this.cdr.detectChanges();
    } catch {}

    try {
      const response = await fetch(
        '/api/superadmin/clients/password/reset-link?_live=' + Date.now(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({ id: this.clientPopup.id, email: this.clientPopup.email }),
        },
      );

      const result: any = await response.json().catch(() => null);
      if (!response.ok || !result?.ok)
        throw new Error(result?.message || 'Reset-link backend route next patch me add hoga.');

      this.clientPopupAuditAdd(
        'Password reset link sent',
        this.clientPopup.email || this.clientPopup.id,
      );
      this.clientPopupNotice('Secure password reset link sent.', true);
      this.showActionPopup('Reset Link Sent Success', 'Client ko secure reset link send ho gaya.', true);
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : 'Reset link failed.';
      this.clientPopupAuditAdd('Password reset failed', msg);
      this.clientPopupNotice(msg, false);
      this.showActionPopup('Reset Link Pending', msg, false);
    } finally {
      this.clientPopupBusy = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  async generateClientTemporaryPassword(): Promise<void> {
    if (!this.clientPopup) return;

    this.clientPopupBusy = true;
    this.clientPopupTempPassword = '';
    this.clientPopupMessage = '';
    try {
      this.cdr.detectChanges();
    } catch {}

    try {
      const response = await fetch('/api/superadmin/clients/password/temp?_live=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          id: this.clientPopup.id,
          email: this.clientPopup.email,
          force_change: true,
        }),
      });

      const result: any = await response.json().catch(() => null);
      if (!response.ok || !result?.ok)
        throw new Error(
          result?.message || 'Temporary-password backend route next patch me add hoga.',
        );

      this.clientPopupTempPassword = String(result.temp_password || result.password || '');
      this.clientPopupAuditAdd(
        'One-time temporary password generated',
        this.clientPopup.email || this.clientPopup.id,
      );
      this.clientPopupNotice(
        'One-time temporary password generated. Client next login par password change karega.',
        true,
      );
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : 'Temporary password failed.';
      this.clientPopupAuditAdd('Temporary password failed', msg);
      this.clientPopupNotice(msg, false);
      this.showActionPopup('Temp Password Pending', msg, false);
    } finally {
      this.clientPopupBusy = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  async copyClientPopupTempPassword(): Promise<void> {
    if (!this.clientPopupTempPassword) return;
    try {
      await navigator.clipboard.writeText(this.clientPopupTempPassword);
      this.clientPopupNotice('Temporary password copied. Isko secure channel se share karo.', true);
    } catch {
      this.clientPopupNotice('Copy failed. Manually select karke copy karo.', false);
    }
  }

  async clientPopupAccessAction(action: string, endpoint: string): Promise<void> {
    if (!this.clientPopup) return;
    this.clientPopupBusy = true;
    try {
      const res = await fetch(endpoint, { method: 'POST', body: JSON.stringify({ id: this.clientPopup.id, email: this.clientPopup.email }), headers: { 'Content-Type': 'application/json' } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('Request failed');
      this.clientPopupNotice('Success', true);
      this.showActionPopup('Success', 'Done', true);
    } catch (e: any) {
      this.clientPopupNotice('Failed', false);
      this.showActionPopup('Failed', 'Error', false);
    } finally {
      this.clientPopupBusy = false;
    }
  }

  clientPopupSecurityComingSoon(action: string): void {
    this.clientPopupAuditAdd(action, 'Backend route next patch me add hoga.');
    this.clientPopupNotice(action + ' backend route next patch me add hoga.', false);
  }
  // SCS_CLIENT_POPUP_SECURE_METHODS_END
}
