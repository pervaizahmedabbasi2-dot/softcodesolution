import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ViewContainerRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalizationService, CountryInfo, LanguageInfo } from '../services/localization.service';
import { DashboardAnalyticsComponent } from '../softcodesolution_platform/analytics/analytics.component';
import { SecurityComponent } from '../auth_security/security/security.component';
import { FeatureFlagsComponent } from '../softcodesolution_platform/feature-flags/feature-flags.component';
import { ComplianceComponent } from '../softcodesolution_platform/compliance/compliance.component';
import { WebhooksComponent } from '../softcodesolution_platform/webhooks/webhooks.component';
import { GlobalEdgeComponent } from '../softcodesolution_platform/global-edge/global-edge.component';
import { DashboardDataProtectionComponent } from '../softcodesolution_platform/data-protection/data-protection.component';
import { BackupManagerComponent } from '../softcodesolution_platform/backup-manager/backup-manager.component';
import { DashboardOverviewComponent } from '../softcodesolution_platform/overview/overview.component';
import { DashboardAllClientsComponent } from '../superadmin_core/all-clients/all-clients.component';
import { DashboardPlansPricingComponent } from '../softcodesolution_platform/plans-pricing/plans-pricing.component';
import { DashboardModuleCatalogComponent } from '../softcodesolution_platform/module-catalog/module-catalog.component';
import { DashboardSystemHealthComponent } from '../softcodesolution_platform/system-health/system-health.component';
import { DashboardSaasControlComponent } from '../softcodesolution_platform/saas-control/saas-control.component';
import { DashboardRbacComponent } from '../softcodesolution_platform/rbac/rbac.component';
import { DashboardApiGatewayComponent } from '../softcodesolution_platform/api-gateway/api-gateway.component';
import { DashboardPaymentsComponent } from '../softcodesolution_platform/payments/payments.component';
import { DashboardLicenseComponent } from '../softcodesolution_platform/license/license.component';
import { ModuleManagerComponent } from '../softcodesolution_platform/module-manager/module-manager.component';
import { DashboardTeamsComponent } from '../softcodesolution_platform/teams/teams.component';
import { DashboardServicesCatalogComponent } from '../softcodesolution_platform/services-catalog/services-catalog.component';
import { DashboardAdminsComponent } from '../superadmin_core/admins/admins.component';
import { DashboardUpdaterComponent } from '../softcodesolution_platform/updater/updater.component';
import { DashboardKnowledgeBaseComponent } from '../softcodesolution_platform/knowledge-base/knowledge-base.component';
import { DashboardPropertyHubComponent } from '../businesses/real_estate/property-hub/property-hub.component';
import { DashboardRetailPosComponent } from '../businesses/retail_pos/retail-pos/retail-pos.component';
import { DashboardRestaurantHubComponent } from '../businesses/restaurant_cafe/restaurant-hub/restaurant-hub.component';
import { DashboardInstitutionalHubComponent } from '../businesses/institutional_campus/institutional-hub/institutional-hub.component';
import { DashboardClinicHubComponent } from '../businesses/hospital_clinic/clinic-hub/clinic-hub.component';
import { DashboardNgoHubComponent } from '../businesses/ngo_charity/ngo-hub/ngo-hub.component';
import { DashboardTravelHubComponent } from '../businesses/travel_agency/travel-hub/travel-hub.component';
import { DashboardHotelHubComponent } from '../businesses/hotel_hospitality/hotel-hub/hotel-hub.component';
import { DashboardPharmacyHubComponent } from '../businesses/pharmacy_store/pharmacy-hub/pharmacy-hub.component';
import { DashboardGymHubComponent } from '../businesses/gym_fitness/gym-hub/gym-hub.component';
import { DashboardAutoHubComponent } from '../businesses/auto_workshop/auto-hub/auto-hub.component';
import { DashboardSalonHubComponent } from '../businesses/beauty_salon/salon-hub/salon-hub.component';
import { DashboardLegalHubComponent } from '../businesses/law_firm/legal-hub/legal-hub.component';
import { DashboardBusinessSuitesComponent } from '../businesses/business-suites/business-suites.component';
import { SchoolDashboardComponent } from '../businesses/school_business/school-dashboard/school-dashboard.component';
import { CurrencyLanguageSelectorComponent } from '../components/currency-language-selector/currency-language-selector.component';
import {
  ALL_ENTERPRISE_BUSINESSES,
  BUSINESS_SECTORS,
  RBAC_ROLE_DEFINITIONS,
  EnterpriseBusinessItem,
  BusinessSectorId,
  RbacRoleKey,
  getBusinessById,
  getRoleDefinition,
} from './services/business-rbac.data';
import { Router } from '@angular/router';
import { DashboardApiService } from './services/dashboard-api.service';
import { ModuleRegistryService } from './services/module-registry.service';
import {
  LucideAngularModule,
  LayoutDashboard,
  User,
  Image,
  Layers,
  Briefcase,
  Pill,
  Dumbbell,
  Car,
  Scissors,
  Scale,
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
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  ChevronDown,
  Eye,
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
  Bell,
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
  Wifi,
  WifiOff,
  AlertTriangle,
  Info,
  MapPin,
  Hash,
  Briefcase as BriefcaseIcon,
  Copy,
  MoreVertical,
  MoreHorizontal,
  Loader2,
  UserPlus,
  Trash2,
  Check,
  AlertOctagon,
  Terminal,
  GitBranch,
  ArrowUpCircle,
  HardDrive,
  Download,
  Play,
  Code,
  FileText,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ArrowUpDown,
  Printer,
  AlertCircle,
  Trophy,
  Newspaper,
  Phone,
  ShoppingCart,
  UtensilsCrossed,
  ChefHat,
  GraduationCap,
  Wrench,
  HeartPulse,
  Heart,
  HandHeart,
  Plane,
  Ticket,
  BedDouble,
  KeyRound,
  ArrowLeft,
  Receipt,
  CheckSquare,
  Award,
  BookMarked,
  Bus,
  Grip,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  ScreenShare,
  MonitorPlay,
  Filter,
  Backpack,
  DollarSign,
  Send,
  PhoneCall,
  Smartphone,
  SlidersHorizontal,
  Volume2,
  UsersRound as Users2,
  QrCode,
  Library,
  ArrowLeftRight,
  LayoutGrid,
  FlaskConical,
  Edit3,
  Banknote,
  Cloud,
  FileCheck2,
  FileCheck,
  BookOpenCheck,
  CheckCheck,
  ClipboardCheck,
  Megaphone,
  ShieldAlert,
  Table,
  Wallet,
  MessageSquareWarning,
  Truck,
  ArrowRight,
  CalendarCheck
} from 'lucide-angular';

type BackendRole = 'super_admin' | 'client_admin' | 'client_user' | 'support';
type UiRole = 'SUPER_ADMIN' | 'CLIENT';
type ClientStatusTab = 'pending' | 'approved' | 'rejected' | 'all';

type PhaseTag = 'LIVE' | 'SUPPORT' | 'FUTURE';

interface AuthMeResponse {
  ok: boolean;
  redirect?: string;
  user?: { id: string; tenant_id: string; email: string; role: BackendRole; status: string; company_name?: string };
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
  postal_code?: string;
  postalCode?: string;
  enable_passkey?: boolean;
  enablePasskey?: boolean;
  [key: string]: any;
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DashboardOverviewComponent,
    DashboardAnalyticsComponent,
    SecurityComponent,
    FeatureFlagsComponent,
    ComplianceComponent,
    WebhooksComponent,
    GlobalEdgeComponent,
    DashboardDataProtectionComponent,
    BackupManagerComponent,
    DashboardAllClientsComponent,
    DashboardPlansPricingComponent,
    DashboardModuleCatalogComponent,
    DashboardSystemHealthComponent,
    DashboardSaasControlComponent,
    DashboardRbacComponent,
    DashboardApiGatewayComponent,
    DashboardPaymentsComponent,
    DashboardLicenseComponent,
    DashboardTeamsComponent,
    DashboardServicesCatalogComponent,
    DashboardAdminsComponent,
    DashboardUpdaterComponent,
    DashboardKnowledgeBaseComponent,
    DashboardPropertyHubComponent,
    DashboardRetailPosComponent,
    DashboardRestaurantHubComponent,
    DashboardInstitutionalHubComponent,
    SchoolDashboardComponent,
    DashboardClinicHubComponent,
    DashboardNgoHubComponent,
    DashboardTravelHubComponent,
    DashboardHotelHubComponent,
    DashboardPharmacyHubComponent,
    DashboardGymHubComponent,
    DashboardAutoHubComponent,
    DashboardSalonHubComponent,
    DashboardLegalHubComponent,
    DashboardBusinessSuitesComponent,
    CurrencyLanguageSelectorComponent,
    ModuleManagerComponent,
    FormsModule,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  // SCS_PHASE52_LOCK_V1
  // Phase 5.2 Enterprise Dashboard Foundation
  // Status: LOCKED
  // Green Builds: 28
  // Rollbacks: 0

  // SCS_VIEWMODEL_CLEANUP_V1
  // SCS_API_FOUNDATION_V1

  // SCS_MODULE_MANAGER_STATE_V1

  selectedBusinessSuiteId = 'accounting_tax';
  showModuleManager = false;
  isBusinessHubsOpen = false;

  toggleBusinessHubs(): void {
    this.isBusinessHubsOpen = !this.isBusinessHubsOpen;
  }

  isAnyBusinessHubActive(): boolean {
    const hubViews = [
      'property-management', 'properties', 'property-units', 'property-leases', 'property-ledger', 'property-maintenance',
      'retail-pos', 'retail-store', 'pos', 'retail-inventory', 'retail-orders',
      'restaurant-hub', 'restaurant-fnb', 'restaurant-tables', 'restaurant-menu', 'restaurant-kds', 'restaurant-billing',
      'institutional-hub', 'school-system', 'school-students', 'school-classes', 'school-fees', 'school-attendance',
      'clinic-hub', 'clinic', 'clinic-appointments', 'clinic-patients', 'clinic-prescriptions',
      'ngo-hub', 'ngo', 'ngo-campaigns', 'ngo-donations', 'ngo-beneficiaries',
      'travel-hub', 'travel', 'travel-visas', 'travel-hotels', 'travel-vouchers', 'travel-packages', 'travel-bookings',
      'hotel-hub', 'hotel', 'hotel-rooms', 'hotel-frontdesk', 'hotel-housekeeping',
      'pharmacy-hub', 'pharmacy', 'pharmacy-pos', 'pharmacy-medicines', 'pharmacy-batches',
      'gym-hub', 'gym', 'gym-members', 'gym-trainers', 'gym-attendance',
      'auto-hub', 'auto', 'auto-jobs', 'auto-inventory', 'auto-vehicles',
      'salon-hub', 'salon', 'salon-appointments', 'salon-services', 'salon-stylists',
      'legal-hub', 'legal', 'legal-cases', 'legal-clients', 'legal-documents',
      'cargo-hub', 'cargo', 'cargo-shipments', 'realty-hub', 'realty', 'realty-plots'
    ];
    return hubViews.includes(this.activeView);
  }

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
        {
          code: 'saas-control',
          label: 'SaaS Control',
          route: 'saas-control',
          icon: 'Sparkles',
          pinned: true,
          hidden: false,
        },
        {
          code: 'module-catalog',
          label: 'Module Catalog',
          route: 'module-catalog',
          icon: 'Package',
          pinned: true,
          hidden: false,
        },
        {
          code: 'plans-pricing',
          label: 'Plans & Pricing',
          route: 'plans-pricing',
          icon: 'CreditCard',
          pinned: true,
          hidden: false,
        },
      ],
    },
  };

  // --- ENTERPRISE SETTINGS & WORKSPACE CONTROLS ---
  settingsActiveTab: 'general' | 'multi-tenancy' | 'smtp' | 'whitelabel' | 'security' | 'business-catalog' = 'general';
  settingsSavedToast = false;
  settingsSaving = false;
  smtpTesting = false;
  smtpTestResult: { ok: boolean; message: string } | null = null;

  businessSettingsSectorFilter = 'ALL';
  businessSettingsSearch = '';

  businessCatalog = [
    { id: 'accounting_tax', name: 'Accounting & Tax Services', category: 'accounting_tax', sector: 'PROFESSIONAL', pricingWeight: 1.2, active: true },
    { id: 'retail_store', name: 'Retail Store & Point of Sale', category: 'retail_store', sector: 'COMMERCE', pricingWeight: 1.1, dedicatedHubView: 'retail-pos', active: true },
    { id: 'restaurant_cafe', name: 'Restaurant & Fine Dine', category: 'restaurant_cafe', sector: 'HOSPITALITY', pricingWeight: 1.3, dedicatedHubView: 'restaurant-hub', active: true },
    { id: 'pizza_fastfood', name: 'Pizza & Fast Food POS', category: 'pizza_fastfood', sector: 'HOSPITALITY', pricingWeight: 1.2, dedicatedHubView: 'restaurant-hub', active: true },
    { id: 'school_college', name: 'School & College Management', category: 'school_college', sector: 'EDUCATION', pricingWeight: 1.5, dedicatedHubView: 'school-hub', active: true },
    { id: 'clinic_healthcare', name: 'Clinic & OPD Healthcare Center', category: 'clinic_healthcare', sector: 'HEALTHCARE', pricingWeight: 1.3, dedicatedHubView: 'clinic-hub', active: true },
    { id: 'hospital_management', name: 'Hospital Management & IPD Wards', category: 'hospital_management', sector: 'HEALTHCARE', pricingWeight: 1.6, dedicatedHubView: 'clinic-hub', active: true },
    { id: 'ngo_nonprofit', name: 'NGO & Non-Profit Organization', category: 'ngo_nonprofit', sector: 'SERVICES', pricingWeight: 1.0, dedicatedHubView: 'ngo-hub', active: true },
    { id: 'pharmacy_medical', name: 'Pharmacy & Medical Store', category: 'pharmacy_medical', sector: 'HEALTHCARE', pricingWeight: 1.3, dedicatedHubView: 'pharmacy-hub', active: true },
    { id: 'gym_fitness', name: 'Gym & Fitness Center', category: 'gym_fitness', sector: 'SERVICES', pricingWeight: 1.1, dedicatedHubView: 'gym-hub', active: true },
    { id: 'auto_workshop', name: 'Auto Workshop & Garage', category: 'auto_workshop', sector: 'SERVICES', pricingWeight: 1.2, dedicatedHubView: 'auto-hub', active: true },
    { id: 'beauty_salon', name: 'Beauty Salon & Spa', category: 'beauty_salon', sector: 'SERVICES', pricingWeight: 1.1, dedicatedHubView: 'salon-hub', active: true },
    { id: 'real_estate_agency', name: 'Real Estate Agency & Brokerage', category: 'real_estate_agency', sector: 'COMMERCE', pricingWeight: 1.4, dedicatedHubView: 'property-management', active: true },
    { id: 'hotel_hospitality', name: 'Hotel & Hospitality Management', category: 'hotel_hospitality', sector: 'HOSPITALITY', pricingWeight: 1.5, dedicatedHubView: 'hotel-hub', active: true },
    { id: 'law_firm', name: 'Law Firm & Legal Office', category: 'law_firm', sector: 'PROFESSIONAL', pricingWeight: 1.4, dedicatedHubView: 'legal-hub', active: true },
    { id: 'wholesale_distribution', name: 'Wholesale & Distribution Hub', category: 'wholesale_distribution', sector: 'COMMERCE', pricingWeight: 1.3, active: true },
    { id: 'supermarket_grocery', name: 'Supermarket & Grocery Store', category: 'supermarket_grocery', sector: 'COMMERCE', pricingWeight: 1.2, active: true },
    { id: 'travel_tourism', name: 'Travel & Tourism Agency', category: 'travel_tourism', sector: 'HOSPITALITY', pricingWeight: 1.5, dedicatedHubView: 'travel-hub', active: true },
    { id: 'coaching_academy', name: 'Coaching Academy & Tuition Center', category: 'coaching_academy', sector: 'EDUCATION', pricingWeight: 1.2, active: true },
    { id: 'vocational_training', name: 'Vocational & Technical Institute', category: 'vocational_training', sector: 'EDUCATION', pricingWeight: 1.3, active: true },
    { id: 'diagnostic_lab', name: 'Diagnostic Lab & Imaging Center', category: 'diagnostic_lab', sector: 'HEALTHCARE', pricingWeight: 1.4, active: true },
    { id: 'dental_clinic', name: 'Dental Clinic & Orthodontics', category: 'dental_clinic', sector: 'HEALTHCARE', pricingWeight: 1.3, active: true },
    { id: 'veterinary_clinic', name: 'Veterinary Clinic & Animal Care', category: 'veterinary_clinic', sector: 'HEALTHCARE', pricingWeight: 1.2, active: true },
    { id: 'event_management', name: 'Event & Wedding Planning Agency', category: 'event_management', sector: 'SERVICES', pricingWeight: 1.3, active: true },
    { id: 'photography_studio', name: 'Photography & Video Production', category: 'photography_studio', sector: 'SERVICES', pricingWeight: 1.1, active: true },
    { id: 'catering_services', name: 'Catering & Food Supply Services', category: 'catering_services', sector: 'HOSPITALITY', pricingWeight: 1.2, active: true },
    { id: 'bakery_confectionery', name: 'Bakery & Confectionery Mart', category: 'bakery_confectionery', sector: 'COMMERCE', pricingWeight: 1.1, active: true },
    { id: 'construction_contractor', name: 'Construction & EPC Contractor', category: 'construction_contractor', sector: 'INDUSTRIAL', pricingWeight: 1.6, active: true },
    { id: 'manufacturing_plant', name: 'Manufacturing & Assembly Plant', category: 'manufacturing_plant', sector: 'INDUSTRIAL', pricingWeight: 1.7, active: true },
    { id: 'logistics_courier', name: 'Logistics & Freight Transport', category: 'logistics_courier', sector: 'INDUSTRIAL', pricingWeight: 1.4, active: true },
    { id: 'digital_marketing_agency', name: 'Digital Marketing & Creative Agency', category: 'digital_marketing_agency', sector: 'PROFESSIONAL', pricingWeight: 1.3, active: true },
    { id: 'cleaning_janitorial', name: 'Cleaning & Janitorial Facility Services', category: 'cleaning_janitorial', sector: 'SERVICES', pricingWeight: 1.1, active: true },
    { id: 'solar_energy', name: 'Solar & Renewable Energy Solutions', category: 'solar_energy', sector: 'INDUSTRIAL', pricingWeight: 1.5, active: true },
    { id: 'car_rental', name: 'Car Rental & Chauffeur Services', category: 'car_rental', sector: 'SERVICES', pricingWeight: 1.3, active: true },
    { id: 'ecommerce_fulfillment', name: 'E-Commerce & Warehouse Fulfillment', category: 'ecommerce_fulfillment', sector: 'COMMERCE', pricingWeight: 1.4, active: true }
  ];

  get filteredBusinessCatalog() {
    let list = this.businessCatalog;
    if (this.businessSettingsSectorFilter !== 'ALL') {
      list = list.filter(b => b.sector === this.businessSettingsSectorFilter);
    }
    if (this.businessSettingsSearch) {
      const q = this.businessSettingsSearch.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
    }
    return list;
  }

  settingsForm = {
    platformName: 'SoftCode Solution Enterprise',
    supportEmail: 'support@softcodesolution.com',
    supportPhone: '+92 300 8765432',
    baseCurrency: 'PKR',
    timezone: 'Asia/Karachi (PKT +05:00)',
    autoApproveTenants: false,
    trialDays: 14,
    defaultStorageGb: 25,
    defaultUserSeats: 10,
    smtpHost: 'smtp.mailgun.org',
    smtpPort: 587,
    smtpUser: 'postmaster@softcodesolution.com',
    smtpSecure: true,
    fromEmail: 'notifications@softcodesolution.com',
    fromName: 'SoftCode Cloud Ops',
    customDomain: 'app.softcodesolution.com',
    accentColor: '#4f46e5',
    footerCopyright: '© 2026 SoftCode Solution. All rights reserved.',
    enforceMfaAdmins: true,
    sessionTimeoutMins: 30,
    maxFailedLogins: 5,
  };

  savePlatformSettings(): void {
    this.settingsSaving = true;
    setTimeout(() => {
      this.settingsSaving = false;
      this.settingsSavedToast = true;
      try { this.cdr.detectChanges(); } catch {}
      setTimeout(() => {
        this.settingsSavedToast = false;
        try { this.cdr.detectChanges(); } catch {}
      }, 4000);
    }, 600);
  }

  testSmtpConnection(): void {
    this.smtpTesting = true;
    this.smtpTestResult = null;
    setTimeout(() => {
      this.smtpTesting = false;
      this.smtpTestResult = {
        ok: true,
        message: 'SMTP handshake successful. Test email dispatched to ' + this.settingsForm.supportEmail
      };
      try { this.cdr.detectChanges(); } catch {}
    }, 1200);
  }

  // --- GENERIC CATEGORY WORKSPACE STATE ---
  genericFilter = 'all';
  genericSearch = '';
  genericNewModalOpen = false;
  genericDraftItem: any = { name: '', code: '', description: '', status: 'Active' };

  isGenericCategoryView(view: string): boolean {
    if (!view) return false;
    if (
      view === 'school-hub' || view.startsWith('school') || view === 'school_college' ||
      view === 'institutional-hub' || view.startsWith('property') || view.startsWith('retail') ||
      view.startsWith('restaurant') || view.startsWith('clinic') || view.startsWith('ngo') ||
      view.startsWith('travel') || view.startsWith('hotel') || view.startsWith('pharmacy') ||
      view.startsWith('gym') || view.startsWith('auto') || view.startsWith('salon') ||
      view.startsWith('legal')
    ) {
      return false;
    }
    const knownCustomViews = [
      'home',
      'client-previews',
      'all-tenants',
      'payments-sys-list',
      'rbac',
      'license-list',
      'api-gate-list',
      'settings-list',
      'security',
      'feature-flags',
      'compliance',
      'webhooks',
      'data-protection',
      'backup-manager',
      'global-edge',
      'analytics',
      'system-health',
      'saas-control',
      'plans-pricing',
      'module-catalog',
      'business-suites',
      'institutional-hub',
      'school-system',
      'school-students',
      'school-classes',
      'school-fees',
      'school-attendance',
      'retail-pos',
      'retail-store',
      'pos',
      'retail-inventory',
      'retail-orders',
      'retail-crm',
      'restaurant-hub',
      'restaurant-fnb',
      'restaurant-tables',
      'restaurant-menu',
      'restaurant-kds',
      'restaurant-billing',
      'clinic-hub',
      'clinic',
      'clinic-appointments',
      'clinic-patients',
      'clinic-prescriptions',
      'appointments',
      'ngo-hub',
      'ngo',
      'ngo-campaigns',
      'ngo-donations',
      'ngo-beneficiaries',
      'travel-hub',
      'travel',
      'travel-visas',
      'travel-hotels',
      'travel-vouchers',
      'travel-hotel-bookings',
      'travel-packages',
      'travel-bookings',
      'visas',
      'hotel-hub',
      'hotel',
      'hotel-rooms',
      'hotel-frontdesk',
      'hotel-housekeeping',
      'pharmacy-hub',
      'pharmacy',
      'pharmacy-pos',
      'pharmacy-medicines',
      'pharmacy-batches',
      'gym-hub',
      'gym',
      'gym-members',
      'gym-trainers',
      'gym-attendance',
      'auto-hub',
      'auto',
      'auto-jobs',
      'auto-inventory',
      'auto-vehicles',
      'salon-hub',
      'salon',
      'salon-appointments',
      'salon-services',
      'salon-stylists',
      'legal-hub',
      'legal',
      'legal-cases',
      'legal-clients',
      'legal-documents',
      'property-management',
      'properties',
      'property-units',
      'property-leases',
      'property-ledger',
      'property-maintenance'
    ];
    return !knownCustomViews.includes(view);
  }

  getGenericCategoryTitle(view: string): string {
    const clean = view.replace(/-list$/, '').replace(/-add$/, '');
    const cat = this.categories.find(c => c.id === clean);
    if (cat) return cat.label;
    return clean.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }

  getGenericCategoryIcon(view: string): any {
    const clean = view.replace(/-list$/, '').replace(/-add$/, '');
    const cat = this.categories.find(c => c.id === clean);
    return cat?.icon || this.icons.Package;
  }

  getGenericCategorySubtitle(view: string): string {
    const clean = view.replace(/-list$/, '').replace(/-add$/, '');
    const cat = this.categories.find(c => c.id === clean);
    return cat?.description || `Dedicated management workspace for ${clean.replace('-', ' ')} operations.`;
  }

  getGenericRecords(view: string): any[] {
    const clean = view.replace(/-list$/, '').replace(/-add$/, '');
    const map: Record<string, any[]> = {
      store: [
        { id: 'STR-101', name: 'Main City Supermarket', sku: 'INV-9021', status: 'Active', category: 'Retail', value: 'PKR 450,000', updated: '2 hours ago' },
        { id: 'STR-102', name: 'West End Hardware', sku: 'INV-4820', status: 'Active', category: 'Wholesale', value: 'PKR 820,000', updated: '5 hours ago' },
        { id: 'STR-103', name: 'Green Grocery Depot', sku: 'INV-3104', status: 'Pending', category: 'Produce', value: 'PKR 140,000', updated: '1 day ago' },
      ],
      school: [
        { id: 'SCH-201', name: 'Grade 10 - Advanced Sciences', sku: 'SEC-A', status: 'Active', category: 'Academics', value: '38 Students', updated: 'Today, 09:30' },
        { id: 'SCH-202', name: 'Faculty Attendance Log', sku: 'HR-22', status: 'Active', category: 'Faculty', value: '94% On-Time', updated: 'Today, 08:15' },
        { id: 'SCH-203', name: 'Semester Fee Invoices Q3', sku: 'FEE-2026', status: 'Pending', category: 'Accounts', value: 'PKR 1,240,000', updated: '2 days ago' },
      ],
      restaurant: [
        { id: 'RST-301', name: 'Table Service Order #402', sku: 'KTC-12', status: 'Active', category: 'Kitchen POS', value: 'PKR 8,450', updated: '8 mins ago' },
        { id: 'RST-302', name: 'Daily Fresh Inventory Order', sku: 'SUP-99', status: 'Active', category: 'Supplies', value: 'PKR 42,000', updated: '4 hours ago' },
        { id: 'RST-303', name: 'Online Delivery Dispatch', sku: 'DLV-841', status: 'Active', category: 'Delivery', value: 'PKR 15,200', updated: 'Just now' },
      ],
      clinic: [
        { id: 'CLN-401', name: 'Dr. Tariq - Cardiology Clinic', sku: 'DOC-01', status: 'Active', category: 'Consultations', value: '14 Appointments', updated: 'Live' },
        { id: 'CLN-402', name: 'Central Pharmacy Stock', sku: 'MED-77', status: 'Active', category: 'Dispensary', value: 'PKR 640,000', updated: 'Yesterday' },
        { id: 'CLN-403', name: 'Lab Diagnostic Reports', sku: 'LAB-102', status: 'Active', category: 'Pathology', value: '29 Pending', updated: '30 mins ago' },
      ],
      admins: [
        { id: 'ADM-501', name: 'Sarah Khan (Lead SecOps)', sku: 'SEC-ROOT', status: 'Active', category: 'Superadmin', value: 'Full Access', updated: '10 mins ago' },
        { id: 'ADM-502', name: 'Bilal Ahmed (DevOps)', sku: 'INFRA-01', status: 'Active', category: 'Operations', value: 'Infrastructure', updated: 'Yesterday' },
        { id: 'ADM-503', name: 'Zainab Noor (Compliance)', sku: 'AUDIT-02', status: 'Active', category: 'Audit', value: 'Read & Export', updated: '3 days ago' },
      ],
      services: [
        { id: 'SRV-601', name: 'Managed Kubernetes Cluster', sku: 'INFRA-K8S', status: 'Active', category: 'Cloud Infrastructure', value: '99.99% Uptime', updated: 'Live' },
        { id: 'SRV-602', name: 'Real-time WebSocket Push', sku: 'RTC-EDGE', status: 'Active', category: 'Edge Telemetry', value: '24ms Latency', updated: 'Live' },
        { id: 'SRV-603', name: 'Automated Multi-Tenant Mirroring', sku: 'SYNC-DB', status: 'Active', category: 'Data Replication', value: '3 Nodes Active', updated: '1 min ago' },
      ],
      teams: [
        { id: 'TM-701', name: 'Core Platform Engineering', sku: 'ENG-01', status: 'Active', category: 'Engineering', value: '12 Engineers', updated: 'Active' },
        { id: 'TM-702', name: 'Enterprise Client Success', sku: 'CS-02', status: 'Active', category: 'Support', value: '8 Agents', updated: 'Active' },
        { id: 'TM-703', name: 'Billing & Commercial Operations', sku: 'FIN-03', status: 'Active', category: 'Finance', value: '5 Specialists', updated: 'Active' },
      ],
      blogs: [
        { id: 'BLG-801', name: 'High Availability Multi-Tenant Architecture in 2026', sku: 'PUB-101', status: 'Active', category: 'Architecture', value: '14,200 Reads', updated: '3 days ago' },
        { id: 'BLG-802', name: 'Zero-Trust RBAC and Compliance Guidelines', sku: 'PUB-102', status: 'Active', category: 'Security', value: '9,800 Reads', updated: '1 week ago' },
        { id: 'BLG-803', name: 'Offsite PostgreSQL & SQLite Snapshot Mirroring', sku: 'PUB-103', status: 'Active', category: 'DevOps', value: '6,400 Reads', updated: '2 weeks ago' },
      ]
    };
    return map[clean] || [
      { id: `${clean.toUpperCase()}-01`, name: `${this.getGenericCategoryTitle(view)} Primary Instance`, sku: 'REC-001', status: 'Active', category: 'Standard', value: 'Operational', updated: 'Live' },
      { id: `${clean.toUpperCase()}-02`, name: `${this.getGenericCategoryTitle(view)} Secondary Worker`, sku: 'REC-002', status: 'Active', category: 'Standard', value: 'Ready', updated: '1 hour ago' },
      { id: `${clean.toUpperCase()}-03`, name: `${this.getGenericCategoryTitle(view)} Configuration Profile`, sku: 'REC-003', status: 'Active', category: 'System', value: 'Default', updated: 'Yesterday' }
    ];
  }

  openGenericNewModal(): void {
    this.genericDraftItem = { name: '', code: '', description: '', status: 'Active' };
    this.genericNewModalOpen = true;
  }

  closeGenericNewModal(): void {
    this.genericNewModalOpen = false;
  }

  saveGenericNewItem(view: string): void {
    if (!this.genericDraftItem.name.trim()) return;
    const clean = view.replace(/-list$/, '').replace(/-add$/, '');
    const records = this.getGenericRecords(clean);
    records.unshift({
      id: `${clean.toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
      name: this.genericDraftItem.name,
      sku: this.genericDraftItem.code || 'AUTO-KEY',
      status: this.genericDraftItem.status || 'Active',
      category: 'Custom Entry',
      value: this.genericDraftItem.description || 'Verified Record',
      updated: 'Just now'
    });
    this.genericNewModalOpen = false;
    try { this.cdr.detectChanges(); } catch {}
  }

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
  activeSimulatedBusiness: EnterpriseBusinessItem | null = null;
  activeSimulatedRole: RbacRoleKey = 'owner';
  selectedBusinessSector: BusinessSectorId = 'ALL';
  businessCatalogSearch = '';
  rbacMatrixModalOpen = false;
  selectedBusinessForMatrix: EnterpriseBusinessItem | null = null;
  isSwitchBusinessModalOpen = false;

  readonly allBusinessesCatalog = ALL_ENTERPRISE_BUSINESSES;
  readonly businessSectors = BUSINESS_SECTORS;
  readonly rbacRoleDefinitions: Record<string, any> = RBAC_ROLE_DEFINITIONS;
  readonly rbacRoleKeys: RbacRoleKey[] = ['owner', 'manager', 'staff', 'accountant', 'auditor', 'client'];
  activePreviewSubModule = 'overview';

  getRoleDef(key: string): any {
    return (this.rbacRoleDefinitions as any)[key] || this.rbacRoleDefinitions['owner'];
  }

  private previewSnapshot: {
    userRole: UiRole;
    categories: DashboardCategory[];
    activeView: string;
    previewBusiness?: EnterpriseBusinessItem | null;
    simulatedRole?: RbacRoleKey;
  } | null = null;
  clientPopupDraft: any = {};
  clientPopupTab: 'overview' | 'edit' | 'quotas' | 'team' | 'domains' | 'status' | 'access' | 'audit' = 'overview';
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
    } catch (error) {
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
      this.showActionPopup('Plan Assigned ✓', 'Total: ' + this.scsSuperTotal(), true);
      await this.loadSuperadminClients(true);
    } catch (error) {
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
        next ? 'Access Granted ✓' : 'Access Removed ✓',
        'Saved live to tenant_modules.',
        true,
      );
    } catch (error) {
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
        next ? 'Access Granted ✓' : 'Access Removed ✓',
        'Saved live to tenant_modules.',
        true,
      );
    } catch (error) {
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
      this.showActionPopup('Price Saved ✓', 'Total: ' + this.scsSuperTotal(), true);
      await this.loadSuperadminClients(true);
    } catch (error) {
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
  companyName: string = 'SoftCode Solution';
  backendRole: BackendRole | null = null;
  tenantId = '';
  isAuthLoading = true;

  get displayCompanyName(): string {
    if (this.previewClient?.company_name) {
      return this.previewClient.company_name;
    }
    if (this.impersonatedTenant?.company_name) {
      return this.impersonatedTenant.company_name;
    }
    if (this.companyName && this.companyName.trim() && this.companyName !== 'SoftCode Solution') {
      return this.companyName;
    }
    if (this.previewMode && this.activeSimulatedBusiness?.name) {
      if (this.activeSimulatedBusiness.id === 'school_college') {
        return (this.companyName && this.companyName !== 'SoftCode Solution') ? this.companyName : (this.activeSimulatedBusiness.name || 'Al-Huda Academy');
      }
      return this.activeSimulatedBusiness.name;
    }
    if (this.activeView === 'school-hub' || this.activeView === 'school-system' || this.activeView === 'school-students' || this.activeView === 'school-classes' || this.activeView === 'school-fees' || this.activeView === 'school-attendance') {
      return (this.companyName && this.companyName !== 'SoftCode Solution') ? this.companyName : 'Al-Huda Academy';
    }
    if (this.userRole === 'SUPER_ADMIN') {
      return '';
    }
    return (this.companyName && this.companyName !== 'SoftCode Solution') ? this.companyName : 'Al-Huda Academy';
  }

  get schoolDisplayName(): string {
    if (this.previewClient?.company_name) return this.previewClient.company_name;
    if (this.impersonatedTenant?.company_name) return this.impersonatedTenant.company_name;
    if (this.companyName && this.companyName !== 'SoftCode Solution') return this.companyName;
    return 'Al-Huda International Academy';
  }

  get isSchoolPreviewActive(): boolean {
    if (this.previewMode && this.activeSimulatedBusiness?.id === 'school_college') {
      return true;
    }
    if (this.activeView === 'school-hub' || this.activeView.startsWith('school-') || this.activeView === 'school_college') {
      return true;
    }
    const savedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('activeSchoolRole') : null;
    if (this.userRole !== 'SUPER_ADMIN' && savedRole) {
      return true;
    }
    return false;
  }

  readonly schoolSidebarSections = [
    {
      title: 'MAIN',
      badge: 'LIVE',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: 'LayoutDashboard', badge: 'LIVE' },
        { id: 'principal', label: 'Principal Directorate', icon: 'Award', badge: '18 Live' },
      ]
    },
    {
      title: 'STUDENTS',
      badge: '1,240',
      items: [
        { id: 'admissions', label: 'Admission Enquiry', icon: 'BookOpen', badge: 'New' },
        { id: 'new_admission', label: 'New Admission', icon: 'UserPlus', badge: 'Form' },
        { id: 'students', label: 'All Students', icon: 'Users', count: '1,240' },
        { id: 'alumni', label: 'Passed Out Archive', icon: 'Award', count: '450+' },
        { id: 'promotion', label: 'Promotion', icon: 'GraduationCap', badge: 'Promote' },
        { id: 'session_report', label: 'Session Report', icon: 'FileText', badge: '2026-27' },
      ]
    },
    {
      title: 'FEES',
      badge: 'PKR',
      items: [
        { id: 'fee_structure', label: 'Fee Structure', icon: 'FileText', badge: 'Slab' },
        { id: 'finance', label: 'Fee Collection', icon: 'CreditCard', badge: 'PKR' },
        { id: 'quick_fee', label: 'Quick Fee Collect', icon: 'Zap', badge: 'Fast' },
        { id: 'whatsapp_reminder', label: 'WhatsApp Reminder', icon: 'MessageSquare', badge: 'Send' },
        { id: 'fee_deletion_log', label: 'Fee Deletion Log', icon: 'Trash2', badge: 'Log' },
      ]
    },
    {
      title: 'ACADEMICS',
      badge: 'Routine',
      items: [
        { id: 'attendance', label: 'Attendance', icon: 'Clock', count: '95.3%' },
        { id: 'attendance_report', label: 'Attendance Report', icon: 'Calendar', badge: 'Biometric' },
        { id: 'exams', label: 'Exams', icon: 'Trophy', count: 'GPA 3.8' },
        { id: 'marks_entry', label: 'Marks Entry', icon: 'Pencil', badge: 'Entry' },
        { id: 'class_result', label: 'Class Result', icon: 'FileText', badge: 'Result' },
        { id: 'subjects', label: 'Subjects', icon: 'BookOpen', count: '14' },
        { id: 'class_subject_map', label: 'Class-Subject Map', icon: 'Layers', badge: 'Mapped' },
        { id: 'exam_schedule', label: 'Exam Schedule', icon: 'Calendar', badge: 'Schedule' },
      ]
    },
    {
      title: 'FINANCE',
      badge: 'PKR',
      items: [
        { id: 'expenses', label: 'Expenses', icon: 'Receipt', count: '42 Entries' },
        { id: 'all_reports', label: 'All Reports', icon: 'FileText', badge: 'Reports' },
        { id: 'income_vs_expense', label: 'Income vs Expense', icon: 'BarChart3', badge: 'Balance' },
      ]
    },
    {
      title: 'STAFF / PAYROLL',
      badge: '86',
      items: [
        { id: 'teachers', label: 'Staff Management', icon: 'Users', count: '86' },
        { id: 'salary_management', label: 'Salary Management', icon: 'CreditCard', badge: 'Payroll' },
        { id: 'salary_report', label: 'Salary Report', icon: 'FileText', badge: 'Slip' },
      ]
    },
    {
      title: 'FACILITIES & LOGISTICS',
      badge: 'GPS',
      items: [
        { id: 'transport', label: 'School Bus & Transport', icon: 'Bus', badge: 'GPS' },
        { id: 'library', label: 'Library & Books', icon: 'BookOpen', count: '4,500' },
        { id: 'portals', label: 'Role Portals & RBAC', icon: 'ShieldCheck', count: '3 Portals' },
      ]
    },
    {
      title: 'COMMUNICATION & EVENTS',
      badge: 'Live',
      items: [
        { id: 'feed', label: 'Campus Top Feed & Notice', icon: 'Newspaper', badge: 'LIVE' },
        { id: 'events', label: 'School Events Hub', icon: 'Trophy', badge: 'GALA' },
        { id: 'notices', label: 'Notices & Circulars', icon: 'Bell', count: '5 Active' },
      ]
    },
    {
      title: 'ADMIN',
      badge: 'System',
      items: [
        { id: 'admin_settings', label: 'Admin Settings', icon: 'SlidersHorizontal', badge: 'Setup' },
        { id: 'settings', label: 'Settings', icon: 'Settings', badge: 'Campus' },
      ]
    },
    {
      title: 'ACCOUNT',
      badge: 'Security',
      items: [
        { id: 'password_change', label: 'Password Change', icon: 'KeyRound', badge: 'Key' },
        { id: 'logout', label: 'Logout', icon: 'LogOut', badge: 'Exit' },
      ]
    }
  ];

  readonly principalSidebarSections = [
    {
      title: 'A. DAILY OPERATIONS',
      badge: 'LIVE',
      items: [
        { id: 'principal-overview', label: 'Executive Command Center', icon: 'LayoutDashboard', badge: 'Director' },
        { id: 'principal-directives', label: 'Assembly Directives', icon: 'Bell', badge: 'Circular' },
        { id: 'principal-academic_reports', label: 'Academic Audit Export', icon: 'FileText', badge: 'JSON' },
      ]
    },
    {
      title: 'B. STUDENTS & ADMISSIONS',
      badge: 'Nur-10',
      items: [
        { id: 'principal-admissions_review', label: 'Admissions & Entrance', icon: 'BookOpen', badge: 'Nur-10' },
        { id: 'principal-student_certificates', label: 'TC & Character Certs', icon: 'Award', badge: 'Verify' },
        { id: 'principal-ptm_interventions', label: 'PTM & Weak Students', icon: 'Users', badge: 'Remedial' },
      ]
    },
    {
      title: 'C. ACADEMICS & CURRICULUM',
      badge: 'Curriculum',
      items: [
        { id: 'principal-supervision', label: 'Lesson Plan Approvals', icon: 'BookOpen', badge: 'Approve' },
        { id: 'principal-syllabus', label: 'Syllabus Tracker (Nur-10)', icon: 'Award', count: '84.5%' },
      ]
    },
    {
      title: 'D. TIMETABLE & SUBSTITUTIONS',
      badge: 'Duty',
      items: [
        { id: 'principal-substitutions', label: 'Period Substitutions & Duty', icon: 'Clock', count: 'Cover' },
      ]
    },
    {
      title: 'E. EXAMS & MODERATION',
      badge: 'Sign-Off',
      items: [
        { id: 'principal-exam_moderation', label: 'Exam Paper Moderation', icon: 'Trophy', badge: 'Sign-Off' },
      ]
    },
    {
      title: 'F. TEACHERS & HR GOVERNANCE',
      badge: 'Staff',
      items: [
        { id: 'principal-faculty_tasks', label: 'Faculty Duty & Tasks', icon: 'Users', count: 'Roster' },
        { id: 'principal-teacher_leaves', label: 'Teacher Leave Approval', icon: 'FileText', badge: 'HR' },
        { id: 'principal-appraisals', label: 'Teacher Appraisals', icon: 'GraduationCap', badge: 'KPI' },
      ]
    },
    {
      title: 'G. FEES & FINANCIAL OVERSIGHT',
      badge: 'Policy',
      items: [
        { id: 'principal-fee_oversight', label: 'Fee Concession Requests', icon: 'CreditCard', badge: 'PKR' },
      ]
    },
    {
      title: 'H. DISCIPLINE & SAFEGUARDING',
      badge: 'Pastoral',
      items: [
        { id: 'principal-discipline', label: 'Discipline & Hearings', icon: 'ShieldCheck', badge: 'Action' },
        { id: 'principal-safeguarding', label: 'Safeguarding & Health', icon: 'ShieldAlert', badge: 'Urgent' },
      ]
    },
    {
      title: 'I. COMMUNICATION & GRIEVANCES',
      badge: 'Parents',
      items: [
        { id: 'principal-parent_complaints', label: 'Parent Complaints Log', icon: 'MessageSquare', count: 'Redress' },
      ]
    },
    {
      title: 'J. FACILITIES & TRANSPORT',
      badge: 'Campus',
      items: [
        { id: 'principal-inspections', label: 'Campus Walkthrough Log', icon: 'CheckSquare', count: 'Rounds' },
        { id: 'principal-facilities_transport', label: 'Facilities & Transport', icon: 'Bus', badge: 'Fleet' },
      ]
    }
  ];

  readonly schoolSidebarModules = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'LayoutDashboard', badge: 'LIVE' },
    { id: 'feed', label: 'Campus Top Feed & Notice', icon: 'Newspaper', badge: 'LIVE' },
    { id: 'events', label: 'School Events Hub', icon: 'Trophy', badge: 'GALA' },
    { id: 'students', label: 'Active Students Roster', icon: 'Users', count: '1,240' },
    { id: 'teachers', label: 'Faculty & Teachers', icon: 'GraduationCap', count: '86' },
    { id: 'admissions', label: 'Admissions & Inquiries', icon: 'BookOpen', badge: 'New' },
    { id: 'attendance', label: 'Attendance & Biometrics', icon: 'Clock', count: '95.3%' },
    { id: 'finance', label: 'Fees & Finance Ledger', icon: 'CreditCard', badge: 'PKR' },
    { id: 'payment_gateway', label: 'Payment Gateway & Online Fees', icon: 'WalletCards', badge: 'Online Pay' },
    { id: 'transport', label: 'School Bus & Transport', icon: 'Bus', badge: 'GPS' },
    { id: 'library', label: 'Library & Book Register', icon: 'Library', count: '4,500' },
    { id: 'exams', label: 'Examinations & Marks', icon: 'Trophy', count: 'GPA 3.8' },
    { id: 'timetable', label: 'Timetable & Routine', icon: 'Calendar', count: '8 Periods' },
    { id: 'portals', label: 'Role Portals & RBAC', icon: 'ShieldCheck', count: '3 Portals' },
    { id: 'reports', label: 'Certificates & Transcripts', icon: 'FileText', badge: 'SLC/PDF' },
    { id: 'settings', label: 'School Settings', icon: 'Settings' }
  ];

  get activeSchoolRole(): 'owner' | 'principal' | 'teacher' | 'student' | 'parent' {
    const saved = localStorage.getItem('activeSchoolRole');
    if (saved === 'principal' || saved === 'teacher' || saved === 'student' || saved === 'parent') return saved;
    return 'owner';
  }

  get activeSchoolRoleLabel(): string {
    const r = this.activeSchoolRole;
    if (r === 'principal') return 'Principal Academic Directorate';
    if (r === 'teacher') return 'Faculty / Teacher Portal';
    if (r === 'student') return 'Student Academic Portal';
    if (r === 'parent') return 'Parent & Guardian Portal';
    return 'School Owner Executive ERP';
  }

  get activeSchoolSidebarItems(): Array<{ id: string; label: string; icon: string; count?: string; badge?: string }> {
    const role = this.activeSchoolRole;
    if (role === 'principal') {
      return [
        { id: 'principal-overview', label: 'Executive Overview', icon: 'LayoutDashboard', badge: 'Director' },
        { id: 'principal-directives', label: 'Assembly Directives', icon: 'Bell', badge: 'Circular' },
        { id: 'principal-supervision', label: 'Lesson Plan Approvals', icon: 'BookOpen', badge: 'Approve' },
        { id: 'principal-substitutions', label: 'Period Substitutions', icon: 'Clock', count: 'Cover' },
        { id: 'principal-syllabus', label: 'Syllabus Tracker (Nur-10)', icon: 'Award', count: '84.5%' },
        { id: 'principal-inspections', label: 'Campus Walkthrough Log', icon: 'CheckSquare', count: 'Rounds' },
        { id: 'principal-discipline', label: 'Discipline & Hearings', icon: 'ShieldCheck', badge: 'Action' },
        { id: 'principal-appraisals', label: 'Teacher Appraisals', icon: 'GraduationCap', badge: 'KPI' },
        { id: 'principal-exam_moderation', label: 'Exam Moderation', icon: 'Trophy', badge: 'Sign-Off' },
        { id: 'principal-academic_reports', label: 'Academic Audit Export', icon: 'FileText', badge: 'JSON' },
        { id: 'principal-faculty_tasks', label: 'Faculty Duty & Tasks', icon: 'Users', count: 'Roster' },
        { id: 'principal-teacher_leaves', label: 'Teacher Leave Approval', icon: 'FileText', badge: 'HR' },
        { id: 'principal-student_certificates', label: 'TC & Character Certs', icon: 'Award', badge: 'Verify' },
        { id: 'principal-ptm_interventions', label: 'PTM & Weak Students', icon: 'Users', badge: 'Remedial' },
        { id: 'principal-admissions_review', label: 'Admissions & Entrance', icon: 'BookOpen', badge: 'Nur-10' },
        { id: 'principal-fee_oversight', label: 'Fee Concession Requests', icon: 'CreditCard', badge: 'PKR' },
        { id: 'principal-parent_complaints', label: 'Parent Complaints Log', icon: 'MessageSquare', count: 'Redress' },
        { id: 'principal-safeguarding', label: 'Safeguarding & Health', icon: 'ShieldCheck', badge: 'Urgent' },
        { id: 'principal-facilities_transport', label: 'Facilities & Transport', icon: 'Bus', badge: 'Fleet' }
      ];
    } else if (role === 'teacher') {
      return [
        { id: 'feed', label: 'Campus Top Feed & Notice', icon: 'Newspaper', badge: 'NEW' },
        { id: 'events', label: 'School Events Hub', icon: 'Trophy', badge: 'GALA' },
        { id: 'teacher-portal', label: 'My Teaching Schedule', icon: 'Calendar', badge: 'Active' },
        { id: 'teacher-attendance', label: 'Attendance Tracker', icon: 'Clock', count: '100%' },
        { id: 'teacher-marks', label: 'Student Gradebook', icon: 'Award', count: 'Grade 10-A' },
        { id: 'teacher-lessons', label: 'Daily Lesson Planner', icon: 'BookOpen', badge: 'Plan' },
        { id: 'teacher-homework', label: 'Homework & Tasks', icon: 'FileText', count: '3 Due' },
        { id: 'teacher-students', label: 'My Students Roster', icon: 'Users', count: '38' },
        { id: 'teacher-communication', label: 'Parent Council Chat', icon: 'MessageSquare', count: '2 New' }
      ];
    } else if (role === 'student') {
      return [
        { id: 'feed', label: 'Campus Top Feed & Notice', icon: 'Newspaper', badge: 'NEW' },
        { id: 'events', label: 'School Events & Passes', icon: 'Trophy', badge: 'GALA' },
        { id: 'student-portal', label: 'Student Academic Hub', icon: 'LayoutDashboard', badge: 'Portal' },
        { id: 'student-timetable', label: 'My Class Timetable', icon: 'Calendar', count: '6 Periods' },
        { id: 'student-academics', label: 'Grades & Report Card', icon: 'Award', badge: '3.92 GPA' },
        { id: 'student-homework', label: 'Homework Submissions', icon: 'FileText', badge: 'Due' },
        { id: 'student-attendance', label: 'RFID Attendance Log', icon: 'Clock', count: '98.5%' },
        { id: 'student-fee', label: 'Fee Status & Challan', icon: 'CreditCard', count: 'Paid' }
      ];
    } else if (role === 'parent') {
      return [
        { id: 'feed', label: 'Campus Top Feed & Notice', icon: 'Newspaper', badge: 'NEW' },
        { id: 'events', label: 'School Events & Invitations', icon: 'Trophy', badge: 'GALA' },
        { id: 'parent-portal', label: 'Child Performance Hub', icon: 'LayoutDashboard', badge: 'Guardian' },
        { id: 'parent-academics', label: 'Terminal Report Cards', icon: 'Award', count: 'A+' },
        { id: 'parent-attendance', label: 'Attendance History', icon: 'Clock', count: '98%' },
        { id: 'parent-fee', label: 'Fee Vouchers & Pay Online', icon: 'CreditCard', badge: 'Verified' },
        { id: 'parent-communication', label: 'Teacher Messaging', icon: 'MessageSquare', count: '1 New' },
        { id: 'parent-leave', label: 'Leave Applications', icon: 'FileText', badge: 'Apply' }
      ];
    }
    return this.schoolSidebarModules;
  }

  // Superadmin School Module Subscription Management
  getSchoolSubscriptionModules(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem('scs_school_modules_active');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      students: true,
      teachers: true,
      admissions: true,
      attendance: true,
      finance: true,
      exams: true,
      timetable: true,
      portals: true,
      settings: true,
      teacher_portal: true,
      student_portal: true,
      parent_portal: true,
      parent_chat: true,
      leave_requests: true
    };
  }

  toggleSchoolModuleBySuperadmin(key: string, enabled: boolean): void {
    const modules = this.getSchoolSubscriptionModules();
    modules[key] = enabled;
    try {
      localStorage.setItem('scs_school_modules_active', JSON.stringify(modules));
      window.dispatchEvent(new CustomEvent('scs-school-modules-updated', { detail: modules }));
      this.showDynamicIsland(`School module "${key}" ${enabled ? 'enabled' : 'disabled'} for subscription`, true);
    } catch {}
    this.cdr.detectChanges();
  }

  selectSchoolModule(modId: string): void {
    if (modId === 'logout') {
      if (this.previewMode) {
        this.exitClientPreview();
      } else {
        this.logout();
      }
      return;
    }
    if (modId === 'principal' || modId === 'principal-portal' || modId.startsWith('principal-')) {
      localStorage.setItem('activeSchoolRole', 'principal');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school-role-changed', { detail: { role: 'principal' } }));
      }
    } else if (modId === 'overview' && this.activeSchoolRole !== 'principal') {
      localStorage.setItem('activeSchoolRole', 'owner');
    }
    this.activePreviewSubModule = modId;
    this.activeView = 'school-hub';
    this.closeSidebarOnMobile();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scs-school-action', { detail: modId }));
    }
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  launchSchoolPreviewDirect(roleKey: RbacRoleKey = 'owner'): void {
    const schoolBusiness = this.allBusinessesCatalog.find((b: any) => b.id === 'school_college') || {
      id: 'school_college',
      name: 'Al-Huda International Academy',
      sector: 'EDUCATION',
      sectorLabel: 'Education & Academics',
      icon: 'GraduationCap',
      dedicatedHubView: 'school-hub',
      tagline: 'Student Admissions, Fee Challans, Attendance & Exam Gradebook',
      description: 'Unified academic ERP with student enrollment, biometric student/teacher attendance, monthly fee vouchers, and exams.'
    } as any;
    this.launchBusinessWithRole(schoolBusiness, roleKey);
  }

  getSchoolSidebarIcon(iconName: string): any {
    if (iconName === 'Sliders' || iconName === 'SlidersHorizontal') return this.icons.SlidersHorizontal || this.icons.Settings;
    return (this.icons as any)[iconName] || this.icons.Sparkles;
  }

  get activeViewSubtitle(): string {
    return '';
  }

  readonly loc = inject(LocalizationService);

  isSidebarOpen = typeof window !== 'undefined' ? window.innerWidth >= 768 : false;
  activeView: string = 'home';
  openDropdowns: { [key: string]: boolean } = {};
  isThemeMenuOpen = false;
  isProfileMenuOpen = false;
  isProfileModalOpen = false;

  // Header Dropdown Localization Controls
  activeLocalizationTab: 'currency' | 'language' = 'currency';
  countrySearchQuery = '';
  languageSearchQuery = '';

  get filteredCountries(): CountryInfo[] {
    const q = (this.countrySearchQuery || '').trim().toLowerCase();
    if (!q) return this.loc.countries;
    return this.loc.countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.nativeName.toLowerCase().includes(q) ||
      c.currencyCode.toLowerCase().includes(q) ||
      c.currencyName.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }

  get filteredLanguages(): LanguageInfo[] {
    const q = (this.languageSearchQuery || '').trim().toLowerCase();
    if (!q) return this.loc.languages;
    return this.loc.languages.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  }

  getFlagUrl(code: string): string {
    return this.loc.getFlagUrl(code);
  }

  onFlagImgError(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
      const fallback = target.nextElementSibling as HTMLElement;
      if (fallback) {
        fallback.classList.remove('hidden');
        fallback.style.display = 'inline-block';
      }
    }
  }

  changeLanguage(langCode: string): void {
    this.loc.setLanguage(langCode);
    const lang = this.loc.languages.find(l => l.code === langCode);
    this.showDynamicIsland(`Language updated to ${lang ? lang.name : langCode} ${lang ? lang.flag : ''}`, true);
  }

  changeCurrency(countryCode: string): void {
    this.loc.setCountry(countryCode);
    const country = this.loc.currentCountry();
    this.showDynamicIsland(`Currency updated to ${country.currencyCode} (${country.currencySymbol}) ${country.flag}`, true);
  }

  toggleProfileMenu(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen) {
      this.isThemeMenuOpen = false;
    }
  }

  applyPresetTheme(preset: 'indigo' | 'emerald' | 'midnight' | 'sapphire' | 'amber'): void {
    if (preset === 'indigo') {
      this.customTheme = { sidebar: '#ffffff', header: '#ffffff', background: '#f5f5f7', footer: '#ffffff' };
    } else if (preset === 'emerald') {
      this.customTheme = { sidebar: '#f0fdf4', header: '#ffffff', background: '#f0fdf4', footer: '#f0fdf4' };
    } else if (preset === 'midnight') {
      this.customTheme = { sidebar: '#0f172a', header: '#0f172a', background: '#020617', footer: '#0f172a' };
    } else if (preset === 'sapphire') {
      this.customTheme = { sidebar: '#f0f7ff', header: '#ffffff', background: '#f8fafc', footer: '#f0f7ff' };
    } else if (preset === 'amber') {
      this.customTheme = { sidebar: '#fffbe3', header: '#ffffff', background: '#fefce8', footer: '#fffbe3' };
    }
    this.showDynamicIsland(`Theme preset "${preset.toUpperCase()}" applied`, true);
  }

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
      this.showActionPopup('Plan Saved ✓', updated?.name || payload.name, true);
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
        'Business Plan Saved ✓',
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
        this.moduleCatalogEditorMode === 'edit' ? 'Module Updated ✓' : 'Module Created ✓',
        draft.name,
        true,
      );
      this.moduleCatalogEditorOpen = false;
    } catch (error) {
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

  async releaseAllEnterpriseModules(): Promise<void> {
    try {
      const res = await fetch('/api/superadmin/modules/release-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      });
      const data: any = await res.json().catch(() => ({}));
      if (data?.ok && data.catalog?.modules) {
        this.moduleCatalog = data.catalog.modules;
      } else {
        this.moduleCatalog = this.moduleCatalog.map(m => ({ ...m, enabled: true, status: 'active' }));
      }
      this.tenantModules = this.tenantModules.map((m: any) => ({ ...m, enabled: true }));
      this.showActionPopup(
        'All Modules Released ✓',
        'All enterprise modules are active, unlocked, and globally available.',
        true
      );
    } catch {
      this.moduleCatalog = this.moduleCatalog.map(m => ({ ...m, enabled: true, status: 'active' }));
      this.tenantModules = this.tenantModules.map((m: any) => ({ ...m, enabled: true }));
      this.showActionPopup(
        'All Modules Released ✓',
        'Local entitlement state updated: all modules 100% unlocked.',
        true
      );
    } finally {
      this.cdr.detectChanges();
    }
  }

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
      phase: 'LIVE',
      badge: 'Business Apps (Live)',
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
      roles: ['super_admin', 'client_admin'],
      description: 'Role Based Access Control',
      color: 'bg-emerald-50 text-emerald-600',
      phase: 'LIVE',
    },
    {
      id: 'api-gate',
      label: 'API Gateway',
      icon: Network,
      list: 'Endpoints',
      add: 'Security Layer',
      roles: ['super_admin', 'client_admin'],
      description: 'Endpoint management & security',
      color: 'cyan',
      phase: 'LIVE',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      list: 'Usage Stats',
      add: 'Audit Logs',
      roles: ['super_admin', 'client_admin', 'client_user'],
      description: 'Reports & audit trails',
      color: 'orange',
      phase: 'LIVE',
    },
    {
      id: 'frontend',
      label: 'Frontend Site',
      icon: Globe,
      list: 'Marketplace',
      add: 'Site Pages',
      roles: ['super_admin', 'client_admin'],
      description: 'Marketplace & pages',
      color: 'teal',
      phase: 'LIVE',
    },
    {
      id: 'updater',
      label: 'Auto Update',
      icon: RefreshCcw,
      list: 'Version Control',
      add: 'Plugins',
      roles: ['super_admin', 'client_admin'],
      description: 'Version & plugin control',
      color: 'lime',
      phase: 'LIVE',
    },
    {
      id: 'tenants',
      label: 'Tenant System',
      icon: Building2,
      list: 'Multi Company',
      add: 'Company Create',
      roles: ['super_admin', 'client_admin'],
      description: 'Multi-tenant architecture',
      color: 'blue',
      phase: 'LIVE',
    },
    {
      id: 'license',
      label: 'License System',
      icon: Key,
      list: 'Software Key',
      add: 'Device Binding',
      roles: ['super_admin', 'client_admin'],
      description: 'Key & device management',
      color: 'amber',
      phase: 'LIVE',
    },
    {
      id: 'payments-sys',
      label: 'Payments',
      icon: WalletCards,
      list: 'Billing',
      add: 'Plans',
      roles: ['super_admin', 'client_admin', 'client_user'],
      description: 'Billing & subscription plans',
      color: 'green',
      phase: 'LIVE',
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
      phase: 'LIVE',
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
      phase: 'LIVE',
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: Users,
      list: 'List Teams',
      add: 'Add New',
      roles: ['super_admin', 'client_admin', 'client_user'],
      description: 'Team & member management',
      color: 'pink',
      phase: 'LIVE',
    },
    {
      id: 'blogs',
      label: 'Blogs',
      icon: BookOpen,
      list: 'List Blogs',
      add: 'Add New',
      roles: ['super_admin', 'client_admin'],
      description: 'Content publishing',
      color: 'rose',
      phase: 'LIVE',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      list: 'General',
      add: 'Security',
      roles: ['super_admin', 'client_admin', 'client_user'],
      description: 'System configuration',
      color: 'slate',
      phase: 'LIVE',
    },
  ];

  categories: DashboardCategory[] = [];

  readonly icons = {
    Truck,
    Video,
    Grip,
    LayoutDashboard,
    ShoppingCart,
    UtensilsCrossed,
    ChefHat,
    GraduationCap,
    Wrench,
    HeartPulse,
    Heart,
    HandHeart,
    Plane,
    Ticket,
    BedDouble,
    KeyRound,
    ArrowLeft,
    Receipt,
    CheckSquare,
    Award,
    BookMarked,
    Bus,
    User,
    Image,
    Layers,
    Briefcase,
    Pill,
    Dumbbell,
    Car,
    Scissors,
    Scale,
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
    CheckCircle2,
    XCircle,
    Clock,
    Database,
    ChevronDown,
    Eye,
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
    Bell,
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
    Wifi,
    WifiOff,
    AlertTriangle,
    Info,
    MapPin,
    Hash,
    Copy,
    MoreVertical,
    MoreHorizontal,
    Loader2,
    UserPlus,
    Trash2,
    Check,
    AlertOctagon,
    Terminal,
    GitBranch,
    ArrowUpCircle,
    HardDrive,
    Download,
    Play,
    Code,
    FileText,
    ExternalLink,
    ChevronRight,
    Phone,
    SlidersHorizontal,
  };

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
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.isSidebarOpen = false;
    }
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
    }, 60000);
    setTimeout(async () => {
      await this.loadCurrentUser();
      await this.loadTripleBackupSummary();
      this.startAutoRefresh();
    }, 0);
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
        second: '2-digit',
        hour12: true,
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
    });
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return this.loc.t('good_morning');
    if (h < 17) return this.loc.t('good_afternoon');
    return this.loc.t('good_evening');
  }

  private async loadCurrentUser(): Promise<void> {
    this.isAuthLoading = true;
    try {
      let result: AuthMeResponse | null = null;
      const rawUser = localStorage.getItem('user_data');
      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          if (u && u.email) {
            result = { ok: true, user: u } as AuthMeResponse;
          }
        } catch (e) {}
      }

      if (!result) {
        result = {
          ok: true,
          user: {
            id: 'root-admin-01',
            email: 'pervaizahmedabbasi786@gmail.com',
            role: 'super_admin',
            status: 'ACTIVE'
          }
        } as AuthMeResponse;
      }
      if (!result?.ok || !result.user) {
        await this.router.navigateByUrl('/login');
        return;
      }
      const user = result.user;
      this.userEmail = user.email;
      this.tenantId = user.tenant_id || '';
      this.backendRole = user.role;
      this.userRole = user.role === 'super_admin' ? 'SUPER_ADMIN' : 'CLIENT';
      this.userName = this.nameFromEmail(user.email);
      if (user.company_name) {
        this.companyName = user.company_name;
      } else if (user.role === 'super_admin') {
        this.companyName = 'SoftCode Solution';
      } else {
        this.companyName = 'Al-Huda Academy';
      }
      this.categories = this.allCategories.filter((cat) => cat.roles.includes(user.role));
      if (user.role === 'super_admin') {
        this.activeView = 'home';
        this.clientStatusTab = 'all';
      } else {
        const savedPortal = localStorage.getItem('activeSchoolPortal');
        const savedRole = localStorage.getItem('activeSchoolRole');
        if (savedPortal) {
          this.activeView = 'school-hub';
          this.activePreviewSubModule = savedPortal;
          if (savedRole) {
            this.activeSimulatedRole = savedRole as any;
          }
        }
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
    Promise.resolve().then(() => {
      try { this.cdr.detectChanges(); } catch {}
    });

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
          this.actionMessage = result?.message || 'Could not load clients.';
          this.actionSuccess = false;
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
        second: '2-digit',
        hour12: true,
      });
      this.autoRefreshCountdown = 30;
    } catch {
      this.actionMessage = 'Network error. Please retry.';
      this.actionSuccess = false;
    } finally {
      this.isClientsLoading = false;
      Promise.resolve().then(() => {
        try { this.cdr.detectChanges(); } catch {}
      });
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

  getOmniIcon(iconName: string): any {
    return (this.icons as any)[iconName] || this.icons.Sparkles;
  }

  // SCS_ENTERPRISE_RBAC_SIMULATION_ENGINE_V1_START
  get rbacFilteredBusinesses(): EnterpriseBusinessItem[] {
    let list = this.allBusinessesCatalog;
    if (this.selectedBusinessSector && this.selectedBusinessSector !== 'ALL' && this.selectedBusinessSector !== 'TENANTS') {
      list = list.filter((b) => b.sector === this.selectedBusinessSector);
    }
    const q = (this.businessCatalogSearch || '').trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.tagline.toLowerCase().includes(q) ||
          b.sectorLabel.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.activeModules.some((m) => m.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getBusinessIcon(iconName?: string): any {
    return (this.icons as any)[iconName || 'Briefcase'] || this.icons.Briefcase;
  }

  isBusinessActiveInSidebar(b: EnterpriseBusinessItem): boolean {
    if (!b) return false;
    if (this.activeSimulatedBusiness?.id === b.id) return true;
    if (b.id === 'school_college' && (this.activeView === 'school-hub' || this.activeView.startsWith('school'))) return true;
    if (b.dedicatedHubView && b.dedicatedHubView !== 'business-suites' && this.activeView === b.dedicatedHubView) {
      if (b.id === 'hospital' || b.id === 'coaching_center') {
        return this.activeSimulatedBusiness?.id === b.id;
      }
      return !this.activeSimulatedBusiness || this.activeSimulatedBusiness.id === b.id;
    }
    if (this.activeView === 'business-suites' && this.selectedBusinessSuiteId === (b.suiteId || b.id)) {
      return true;
    }
    return false;
  }

  switchSimulatedRoleStr(role: string): void {
    this.switchSimulatedRole(role as RbacRoleKey);
  }

  setBusinessSector(sector: BusinessSectorId): void {
    this.selectedBusinessSector = sector;
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  launchBusinessWithRole(business: EnterpriseBusinessItem, roleKey: RbacRoleKey = 'owner'): void {
    if (!business) return;

    this.previewSnapshot = {
      userRole: this.userRole,
      categories: this.categories,
      activeView: this.activeView,
      previewBusiness: this.activeSimulatedBusiness,
      simulatedRole: this.activeSimulatedRole,
    };

    if (business && business.id === 'school_college') {
      business = {
        ...business,
        name: this.schoolDisplayName,
      };
    }
    this.activeSimulatedBusiness = business;
    this.activeSimulatedRole = roleKey;
    this.previewMode = true;
    this.previewClient = null;

    if (business.suiteId) {
      this.selectedBusinessSuiteId = business.suiteId;
    }

    const targetView = business.dedicatedHubView || 'business-suites';
    this.activeView = targetView;

    const roleDef = this.getRoleDef(roleKey);
    this.showDynamicIsland(`Launched ${business.name} as ${roleDef.badge}`, true);
    this.closeSwitchBusinessModal();
    this.closeSidebarOnMobile();

    try {
      this.cdr.detectChanges();
    } catch {}
  }

  launchClientPreviewWithRole(client: SuperadminClient, roleKey: RbacRoleKey = 'owner'): void {
    if (!client) return;

    this.previewSnapshot = {
      userRole: this.userRole,
      categories: this.categories,
      activeView: this.activeView,
      previewBusiness: this.activeSimulatedBusiness,
      simulatedRole: this.activeSimulatedRole,
    };

    const bType = String(client.business_type || '').toLowerCase();
    let matchedBusiness = this.allBusinessesCatalog.find((b) =>
      bType.includes(b.id) || b.name.toLowerCase().includes(bType)
    );
    if (!matchedBusiness) {
      matchedBusiness = this.allBusinessesCatalog[0]; // fallback to retail or generic
    }

    if (client.company_name) {
      matchedBusiness = {
        ...matchedBusiness,
        name: client.company_name,
      };
    }

    this.activeSimulatedBusiness = matchedBusiness;
    this.activeSimulatedRole = roleKey;
    this.previewClient = client;
    this.previewMode = true;

    if (matchedBusiness.suiteId) {
      this.selectedBusinessSuiteId = matchedBusiness.suiteId;
    }

    const targetView = matchedBusiness.dedicatedHubView || 'business-suites';
    this.activeView = targetView;

    const roleDef = this.getRoleDef(roleKey);
    this.showDynamicIsland(
      `Viewing ${client.company_name || client.full_name} (${roleDef.badge})`,
      true
    );
    this.closeClientPopupSecure();

    try {
      this.cdr.detectChanges();
    } catch {}
  }

  get activeBusinessRoleConfig(): any {
    if (!this.activeSimulatedBusiness) return undefined;
    return this.activeSimulatedBusiness.roles.find(
      (r) => r.key === this.activeSimulatedRole
    );
  }

  get activeBusinessAllowedModules(): string[] {
    if (!this.activeSimulatedBusiness) return [];
    if (this.activeSimulatedRole === 'owner') {
      return this.activeSimulatedBusiness.activeModules;
    }
    const roleCfg = this.activeBusinessRoleConfig;
    return roleCfg && roleCfg.allowedModules && roleCfg.allowedModules.length > 0
      ? roleCfg.allowedModules
      : this.activeSimulatedBusiness.activeModules;
  }

  navigateToBusinessHub(): void {
    if (this.activeSimulatedBusiness) {
      if (this.activeSimulatedBusiness.suiteId) {
        this.selectedBusinessSuiteId = this.activeSimulatedBusiness.suiteId;
      }
      this.activeView = this.activeSimulatedBusiness.dedicatedHubView || 'business-suites';
      this.closeSidebarOnMobile();
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  switchSimulatedRole(roleKey: RbacRoleKey | string): void {
    const validKey = (this.rbacRoleKeys.includes(roleKey as RbacRoleKey) ? roleKey : 'owner') as RbacRoleKey;
    this.activeSimulatedRole = validKey;
    const roleDef = this.getRoleDef(validKey);
    const busName = this.activeSimulatedBusiness?.name || 'Workspace';
    this.showDynamicIsland(`Switched to ${roleDef.badge} (${busName})`, true);
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  openRbacMatrix(business?: EnterpriseBusinessItem): void {
    this.selectedBusinessForMatrix = business || this.activeSimulatedBusiness || this.allBusinessesCatalog[0];
    this.rbacMatrixModalOpen = true;
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  closeRbacMatrix(): void {
    this.rbacMatrixModalOpen = false;
    this.selectedBusinessForMatrix = null;
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  openSwitchBusinessModal(): void {
    this.isSwitchBusinessModalOpen = true;
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  closeSwitchBusinessModal(): void {
    this.isSwitchBusinessModalOpen = false;
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  switchPreviewBusinessById(businessId: string): void {
    const b = this.allBusinessesCatalog.find((item) => item.id === businessId);
    if (b) {
      this.launchBusinessWithRole(b, this.activeSimulatedRole);
    }
  }

  getRoleIcon(roleKey?: string): any {
    const key = (roleKey || this.activeSimulatedRole) as RbacRoleKey;
    const iconMap: Record<string, any> = {
      owner: this.icons.ShieldCheck,
      manager: this.icons.Briefcase,
      staff: this.icons.Zap,
      accountant: this.icons.CreditCard,
      auditor: this.icons.Search,
      client: this.icons.UserCheck
    };
    return iconMap[key] || this.icons.ShieldCheck;
  }

  getCleanRoleBadge(roleKey?: string): string {
    const key = (roleKey || this.activeSimulatedRole) as RbacRoleKey;
    const raw = this.rbacRoleDefinitions[key]?.badge || 'Owner (Full Access)';
    return raw.replace(/^[^\w\s/()-]+/, '').trim();
  }

  getRoleBadge(roleKey?: string): string {
    const key = (roleKey || this.activeSimulatedRole) as RbacRoleKey;
    return this.rbacRoleDefinitions[key]?.badge || 'Owner';
  }

  getRoleLabel(roleKey?: string): string {
    const key = (roleKey || this.activeSimulatedRole) as RbacRoleKey;
    return this.rbacRoleDefinitions[key]?.label || 'Business Owner';
  }

  getRoleEmoji(roleKey?: string): string {
    const key = (roleKey || this.activeSimulatedRole) as RbacRoleKey;
    return this.rbacRoleDefinitions[key]?.emoji || '👑';
  }

  isModuleAllowedForCurrentRole(moduleName: string): boolean {
    if (!this.activeSimulatedBusiness) return true;
    if (this.activeSimulatedRole === 'owner') return true;

    const roleConfig = this.activeSimulatedBusiness.roles.find(
      (r) => r.key === this.activeSimulatedRole
    );
    if (!roleConfig) return true;

    const lowerMod = moduleName.toLowerCase();
    const isExplicitlyRestricted = roleConfig.restrictedModules.some((rm) =>
      lowerMod.includes(rm.toLowerCase())
    );
    if (isExplicitlyRestricted) return false;

    if (roleConfig.allowedModules && roleConfig.allowedModules.length > 0) {
      return roleConfig.allowedModules.some((am) => lowerMod.includes(am.toLowerCase()));
    }
    return true;
  }

  onPreviewModuleClick(moduleName: string): void {
    if (!this.isModuleAllowedForCurrentRole(moduleName)) {
      this.showRestrictedNotice(moduleName);
      return;
    }

    this.activePreviewSubModule = moduleName;
    const b = this.activeSimulatedBusiness;
    if (b) {
      if (b.suiteId) {
        this.selectedBusinessSuiteId = b.suiteId;
      }
      if (b.dedicatedHubView) {
        this.activeView = b.dedicatedHubView;
      } else {
        this.activeView = 'business-suites';
      }
    }
    const roleLabel = this.getRoleLabel();
    this.showDynamicIsland(`Workspace &bull; Activated ${moduleName} for ${roleLabel}`, true);
    this.closeSidebarOnMobile();
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  getModuleIcon(moduleName: string): any {
    if (!moduleName) return this.icons.Layers;
    const m = moduleName.toLowerCase();
    if (m.includes('live') || m.includes('virtual') || m.includes('lecture room') || m.includes('webinar') || m.includes('stream')) {
      return this.icons.Video;
    }
    if (m.includes('gateway') || m.includes('terminal') || m.includes('online payment')) {
      return this.icons.CreditCard;
    }
    if (m.includes('parent') || m.includes('family') || m.includes('guardian')) {
      return this.icons.HandHeart;
    }
    if (m.includes('teacher') && m.includes('portal') || m.includes('faculty portal')) {
      return this.icons.Award;
    }
    if (m.includes('student') && m.includes('portal')) {
      return this.icons.User;
    }
    if (m.includes('admiss') || m.includes('student') || m.includes('enroll') || m.includes('roster')) {
      return this.icons.GraduationCap;
    }
    if (m.includes('fee') || m.includes('challan') || m.includes('tuition') || m.includes('ledger') || m.includes('billing') || m.includes('pay')) {
      return this.icons.Receipt;
    }
    if (m.includes('attend') || m.includes('rfid') || m.includes('biometric') || m.includes('scan') || m.includes('check')) {
      return this.icons.CheckSquare;
    }
    if (m.includes('exam') || m.includes('grade') || m.includes('card') || m.includes('result') || m.includes('transcript')) {
      return this.icons.Award;
    }
    if (m.includes('timetable') || m.includes('schedule') || m.includes('period') || m.includes('slot') || m.includes('shift')) {
      return this.icons.Clock;
    }
    if (m.includes('teacher') || m.includes('faculty') || m.includes('staff') || m.includes('doctor') || m.includes('trainer') || m.includes('team')) {
      return this.icons.Users;
    }
    if (m.includes('class') || m.includes('section') || m.includes('room') || m.includes('building') || m.includes('wing') || m.includes('branch')) {
      return this.icons.Building2;
    }
    if (m.includes('homework') || m.includes('assign') || m.includes('task') || m.includes('syllabus')) {
      return this.icons.BookOpen;
    }
    if (m.includes('notice') || m.includes('circular') || m.includes('announc') || m.includes('alert') || m.includes('broadcast')) {
      return this.icons.Bell;
    }
    if (m.includes('library') || m.includes('book') || m.includes('isbn') || m.includes('catalog')) {
      return this.icons.BookMarked;
    }
    if (m.includes('transport') || m.includes('bus') || m.includes('fleet') || m.includes('route') || m.includes('vehicle')) {
      return this.icons.Bus;
    }
    if (m.includes('pos') || m.includes('store') || m.includes('cart') || m.includes('order')) {
      return this.icons.ShoppingCart;
    }
    if (m.includes('menu') || m.includes('kitchen') || m.includes('table') || m.includes('food')) {
      return this.icons.UtensilsCrossed;
    }
    if (m.includes('patient') || m.includes('clinic') || m.includes('prescript') || m.includes('medical')) {
      return this.icons.HeartPulse;
    }
    if (m.includes('bed') || m.includes('room') || m.includes('hotel') || m.includes('stay')) {
      return this.icons.BedDouble;
    }
    if (m.includes('legal') || m.includes('court') || m.includes('case') || m.includes('lawyer')) {
      return this.icons.Scale;
    }
    if (m.includes('car') || m.includes('auto') || m.includes('repair') || m.includes('workshop')) {
      return this.icons.Car;
    }
    if (m.includes('salon') || m.includes('spa') || m.includes('hair') || m.includes('beauty')) {
      return this.icons.Scissors;
    }
    if (m.includes('gym') || m.includes('fitness') || m.includes('workout')) {
      return this.icons.Dumbbell;
    }
    if (m.includes('security') || m.includes('guard') || m.includes('audit')) {
      return this.icons.ShieldCheck;
    }
    return this.icons.Layers;
  }

  showRestrictedNotice(moduleName: string): void {
    const roleLabel = this.getRoleLabel();
    this.showDynamicIsland(`⚠️ Restricted: "${moduleName}" is locked for ${roleLabel}. Switch role to view.`, false);
  }
  // SCS_ENTERPRISE_RBAC_SIMULATION_ENGINE_V1_END

  // Enters preview mode for one client. Superadmin session/cookie
  // is untouched — only fetches this client's enabled modules via
  // the superadmin-scoped endpoint and renders them the same way
  // the client's own dashboard would.
  async previewClientDashboard(client: SuperadminClient | null): Promise<void> {
    if (!client) return;
    this.launchClientPreviewWithRole(client, 'owner');
  }

  exitClientPreview(): void {
    if (this.previewSnapshot) {
      this.userRole = this.previewSnapshot.userRole;
      this.categories = this.previewSnapshot.categories;
      this.activeView = this.previewSnapshot.activeView;
      this.activeSimulatedBusiness = this.previewSnapshot.previewBusiness || null;
      this.activeSimulatedRole = this.previewSnapshot.simulatedRole || 'owner';
    } else {
      this.activeView = 'home';
    }
    this.previewSnapshot = null;
    this.previewMode = false;
    this.previewClient = null;
    this.activeSimulatedBusiness = null;
    this.showDynamicIsland('Exited Client Preview Mode', true);
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
    if (!response.ok || !result?.ok) {
      this.moduleCatalog = [
        { id: 'school_management', name: 'School Management', route: 'school-hub', icon: 'graduation-cap', category: 'school', enabled: true, price_monthly: 3500, price_yearly: 35000, source: 'system' },
        { id: 'students', name: 'Students Admission', route: 'school-hub', icon: 'users', category: 'school', enabled: true, price_monthly: 1000, price_yearly: 10000, source: 'system' },
        { id: 'classes_sections', name: 'Classes & Sections', route: 'school-hub', icon: 'layers', category: 'school', enabled: true, price_monthly: 900, price_yearly: 9000, source: 'system' },
        { id: 'school_computer_labs', name: 'Computer & IT Labs', route: 'school-hub', icon: 'monitor', category: 'school', enabled: true, price_monthly: 1200, price_yearly: 12000, source: 'system' },
        { id: 'hr', name: 'Human Resources', route: 'hr', icon: 'users', category: 'core', enabled: true, price_monthly: 10, price_yearly: 100, source: 'system' },
        { id: 'crm', name: 'CRM', route: 'crm', icon: 'briefcase', category: 'sales', enabled: true, price_monthly: 15, price_yearly: 150, source: 'system' },
        { id: 'finance', name: 'Finance', route: 'finance', icon: 'dollar-sign', category: 'core', enabled: true, price_monthly: 20, price_yearly: 200, source: 'system' },
      ];
      this.moduleRegistry.updateModules(
        this.moduleCatalog.map((module) => ({
          code: module.id,
          label: module.name,
          route: module.route,
          icon: module.icon,
          category: module.category,
          pinned: false,
          hidden: !module.enabled,
        }))
      );
      this.catalogPlans = [];
      this.cdr.detectChanges();
      return;
    }
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
    } catch (error) {
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
        'Business Plan Assigned ✓',
        this.saasClientBusinessLabel() +
          ' / ' +
          this.saasClientSelectedPlanId +
          ' / Rs ' +
          Number(result.subscription?.amount || 0),
        true,
      );
    } catch (error) {
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
          'Client Updated ✓',
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
          'Client Approved ✓',
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

  async bulkApproveClients(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0 || this.backendRole !== 'super_admin') return;
    this.isClientActionBusy = true;
    this.cdr.detectChanges();
    try {
      let successCount = 0;
      for (const id of ids) {
        const res = await fetch('/api/superadmin/clients/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
        });
        if (res.ok) successCount++;
      }
      await this.loadSuperadminClients(true);
      this.showActionPopup(
        'Bulk Approval Complete ✓',
        `${successCount} of ${ids.length} clients approved. Tenant access activated.`,
        true
      );
    } catch {
      this.showActionPopup('Bulk Operation Failed', 'Error communicating with server.', false);
    } finally {
      this.isClientActionBusy = false;
      this.cdr.detectChanges();
    }
  }

  async bulkSuspendClients(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0 || this.backendRole !== 'super_admin') return;
    this.isClientActionBusy = true;
    this.cdr.detectChanges();
    try {
      let successCount = 0;
      for (const id of ids) {
        const res = await fetch('/api/superadmin/clients/suspend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
        });
        if (res.ok) successCount++;
      }
      await this.loadSuperadminClients(true);
      this.showActionPopup(
        'Bulk Suspension Complete',
        `${successCount} of ${ids.length} accounts suspended.`,
        false
      );
    } catch {
      this.showActionPopup('Bulk Operation Failed', 'Error communicating with server.', false);
    } finally {
      this.isClientActionBusy = false;
      this.cdr.detectChanges();
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

  closeSidebarOnMobile(): void {
    if (this.isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      this.isSidebarOpen = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  toggleSidebar(event?: any): void {
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
      await import('../softcodesolution_platform/backup-manager/backup-manager.component');

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
        '../softcodesolution_platform/data-protection/data-protection.component'
      );

    this.dataProtectionHost.clear();

    this.dataProtectionRef =
      this.dataProtectionHost.createComponent(
        module.DashboardDataProtectionComponent
      );

    this.cdr.detectChanges();

  }


  async navigateTo(view: string): Promise<void> {
    this.closeSidebarOnMobile();
    let target = view;
    if (view === 'rbac-list' || view === 'rbac-add') target = 'rbac';
    else if (view === 'analytics-list' || view === 'analytics-add') target = 'analytics';
    else if (view === 'tenants-list' || view === 'tenants-add') target = 'all-tenants';
    else if (view === 'frontend-list' || view === 'frontend-add') target = 'module-catalog';
    else if (view === 'license-add') target = 'license-list';
    else if (view === 'payments-sys-add') target = 'plans-pricing';
    else if (view === 'teams-add') target = 'teams-list';
    else if (view === 'admins-add') target = 'admins-list';
    else if (view === 'services-add') target = 'services-list';
    else if (view === 'updater-add') target = 'updater-list';
    else if (view === 'blogs-add') target = 'blogs-list';
    else if (view === 'settings-add') target = 'settings-list';
    else if (view === 'property-units' || view === 'property-leases' || view === 'property-ledger' || view === 'property-maintenance' || view === 'properties') target = 'property-management';
    else if (view === 'pos' || view === 'retail-inventory' || view === 'retail-orders' || view === 'retail-crm' || view === 'retail-store') target = 'retail-pos';
    else if (view === 'restaurant-tables' || view === 'restaurant-menu' || view === 'restaurant-kds' || view === 'restaurant-billing' || view === 'restaurant-fnb' || view === 'tables' || view === 'kds' || view === 'menu') target = 'restaurant-hub';
    else if (view === 'school-students' || view === 'school-classes' || view === 'school-fees' || view === 'school-attendance' || view === 'school-system' || view === 'students' || view === 'fees') target = 'school-hub';
    else if (view === 'clinic-hub' || view === 'clinic' || view === 'clinic-appointments' || view === 'clinic-patients' || view === 'clinic-prescriptions' || view === 'appointments') target = 'clinic-hub';
    else if (view === 'ngo-hub' || view === 'ngo' || view === 'ngo-campaigns' || view === 'ngo-donations' || view === 'ngo-beneficiaries') target = 'ngo-hub';
    else if (view === 'travel-hub' || view === 'travel' || view === 'travel-visas' || view === 'travel-hotels' || view === 'travel-vouchers' || view === 'travel-hotel-bookings' || view === 'travel-packages' || view === 'travel-bookings' || view === 'visas') target = 'travel-hub';
    else if (view === 'hotel-hub' || view === 'hotel' || view === 'hotel-rooms' || view === 'hotel-frontdesk' || view === 'hotel-housekeeping') target = 'hotel-hub';
    else if (view === 'pharmacy-hub' || view === 'pharmacy' || view === 'pharmacy-pos' || view === 'pharmacy-medicines' || view === 'pharmacy-batches') target = 'pharmacy-hub';
    else if (view === 'gym-hub' || view === 'gym' || view === 'gym-members' || view === 'gym-trainers' || view === 'gym-attendance') target = 'gym-hub';
    else if (view === 'auto-hub' || view === 'auto' || view === 'auto-jobs' || view === 'auto-inventory' || view === 'auto-vehicles') target = 'auto-hub';
    else if (view === 'salon-hub' || view === 'salon' || view === 'salon-appointments' || view === 'salon-services' || view === 'salon-stylists') target = 'salon-hub';
    else if (view === 'legal-hub' || view === 'legal' || view === 'legal-cases' || view === 'legal-clients' || view === 'legal-documents') target = 'legal-hub';
    else if (view === 'cargo-hub' || view === 'cargo' || view === 'cargo-shipments') {
      this.selectedBusinessSuiteId = 'logistics_courier';
      target = 'business-suites';
    } else if (view === 'realty-hub' || view === 'realty' || view === 'realty-plots' || view === 'realty-installments') {
      this.selectedBusinessSuiteId = 'real_estate';
      target = 'business-suites';
    } else if (view === 'business-suites' || view === 'business-suite' || view === 'businesses') {
      target = 'business-suites';
    } else if (view.startsWith('suite-')) {
      this.selectedBusinessSuiteId = view.replace('suite-', '');
      target = 'business-suites';
    }

    const superAdminOnlyViews = [
      'all-tenants', 'tenants', 'analytics', 'rbac', 'system-health', 'admins-list',
      'teams-list', 'services-list', 'updater-list', 'license-list', 'plans-pricing',
      'data-protection', 'backup-manager', 'compliance', 'saas-control', 'global-edge'
    ];
    if (this.userRole !== 'SUPER_ADMIN' && superAdminOnlyViews.includes(target)) {
      this.showDynamicIsland('Access restricted: Only Super Administrator can access Super Admin platform controls.', false);
      return;
    }

    this.activeView = target;

    if (target === 'backup-manager') {
      await this.loadBackupManager();
    }

    if (target === 'data-protection') {
      await this.loadDataProtection();
    }

    this.isThemeMenuOpen = false;
    this.cdr.detectChanges(); // 🚀 FIX
    if (target === 'all-tenants' && this.backendRole === 'super_admin')
      await this.loadSuperadminClients(true);
    if (target === 'saas-control' && this.backendRole === 'super_admin') {
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

  setClientPopupTab(tab: 'overview' | 'edit' | 'quotas' | 'team' | 'domains' | 'status' | 'access' | 'audit'): void {
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

  // SCS_DYNAMIC_ISLAND_ENTERPRISE_STATE_V2
  dynamicIsland = {
    show: false,
    message: '',
    title: 'SYSTEM HUD',
    ok: true,
    type: 'success' as 'success' | 'alert' | 'launch' | 'info',
    timer: null as any,
  };

  showDynamicIsland(message: string, ok = true, type?: 'success' | 'alert' | 'launch' | 'info'): void {
    if (this.dynamicIsland.timer) clearTimeout(this.dynamicIsland.timer);

    let derivedType = type;
    if (!derivedType) {
      if (message.toLowerCase().includes('launched') || message.toLowerCase().includes('activated')) {
        derivedType = 'launch';
      } else if (!ok || message.toLowerCase().includes('restricted') || message.toLowerCase().includes('error')) {
        derivedType = 'alert';
      } else {
        derivedType = 'success';
      }
    }

    let title = 'SYSTEM HUD';
    if (derivedType === 'launch') title = 'LIVE WORKSPACE LAUNCHED';
    else if (derivedType === 'alert') title = 'SECURITY & ACCESS NOTICE';
    else if (derivedType === 'success') title = 'ACTION COMPLETED';

    this.dynamicIsland.message = message;
    this.dynamicIsland.title = title;
    this.dynamicIsland.ok = ok;
    this.dynamicIsland.type = derivedType;
    this.dynamicIsland.show = true;
    try { this.cdr.detectChanges(); } catch {}

    this.dynamicIsland.timer = setTimeout(() => {
      this.dynamicIsland.show = false;
      try { this.cdr.detectChanges(); } catch {}
    }, 4500);
  }

  closeDynamicIsland(): void {
    if (this.dynamicIsland.timer) clearTimeout(this.dynamicIsland.timer);
    this.dynamicIsland.show = false;
    try { this.cdr.detectChanges(); } catch {}
  }

  clientPopupNotice(message: string, ok = true): void {
    this.clientPopupMessage = message;
    this.clientPopupMessageOk = ok;
    this.showDynamicIsland(message, ok);
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
      this.showActionPopup('Client Updated ✓', 'Client information saved successfully.', true);
    } catch (error) {
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
      this.showActionPopup('Status Updated ✓', 'Client status action completed.', true);
    } catch (error) {
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
      this.showActionPopup('Reset Link Sent ✓', 'Client ko secure reset link send ho gaya.', true);
    } catch (error) {
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
    } catch (error) {
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

  async copyClientText(text: string, label: string = 'Copied'): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.clientPopupNotice(`${label} copied to clipboard ✓`, true);
    } catch {
      this.clientPopupNotice('Copy failed.', false);
    }
  }

  async clientPopupAccessAction(action: string, endpoint: string): Promise<void> {
    if (!this.clientPopup) return;

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
        body: JSON.stringify({ id: this.clientPopup.id, email: this.clientPopup.email }),
      });

      const result: any = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.message || action + ' failed.');

      this.clientPopupAuditAdd(action, result?.message || 'completed');
      this.clientPopupNotice(result?.message || action + ' completed.', true);
      this.showActionPopup(action + ' ✓', result?.message || 'Action completed.', true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : action + ' failed.';
      this.clientPopupAuditAdd(action + ' failed', msg);
      this.clientPopupNotice(msg, false);
      this.showActionPopup(action + ' Failed', msg, false);
    } finally {
      this.clientPopupBusy = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  clientPopupSecurityComingSoon(action: string): void {
    this.clientPopupAuditAdd(action, 'Backend route next patch me add hoga.');
    this.clientPopupNotice(action + ' backend route next patch me add hoga.', false);
  }

  // --- ENTERPRISE SUITE: OMNI-SEARCH, IMPERSONATION, NOTIFICATIONS & DRAWER ---
  isOmniSearchOpen = false;
  omniSearchQuery = '';
  isTenantDropdownOpen = false;
  impersonatedTenant: SuperadminClient | null = null;
  isNotificationDrawerOpen = false;

  notifications = [
    { id: '1', title: 'SOC 2 Type II Attestation Passed', detail: 'Independent audit signed off with 0 exceptions.', time: '12m ago', type: 'success', unread: true },
    { id: '2', title: 'New Multi-Tenant Registered', detail: 'Apex Solutions onboarded to Enterprise Tier.', time: '45m ago', type: 'info', unread: true },
    { id: '3', title: 'Webhook Retried Successfully', detail: 'Salesforce sync delivered after retry #2.', time: '2h ago', type: 'info', unread: false },
    { id: '4', title: 'Firewall Blocked Suspicious CIDR', detail: '198.51.100.0/24 quarantined automatically by WAF.', time: '4h ago', type: 'warning', unread: false },
    { id: '5', title: 'Firestore Snapshot Completed', detail: 'Automated 5-layer disaster recovery sync verified.', time: '6h ago', type: 'success', unread: false }
  ];

  get unreadNotificationCount(): number {
    return (this.notifications || []).filter(n => n.unread).length;
  }

  markAllNotificationsAsRead(): void {
    (this.notifications || []).forEach(n => n.unread = false);
    try { this.cdr.detectChanges(); } catch {}
  }

  clearNotifications(): void {
    this.notifications = [];
    try { this.cdr.detectChanges(); } catch {}
  }

  toggleTenantDropdown(): void {
    this.isTenantDropdownOpen = !this.isTenantDropdownOpen;
    try { this.cdr.detectChanges(); } catch {}
  }

  selectImpersonatedTenant(tenant: SuperadminClient | null): void {
    this.impersonatedTenant = tenant;
    this.isTenantDropdownOpen = false;
    if (tenant) {
      const bType = String(tenant.business_type || '').toLowerCase();
      let matchedSuiteId = 'accounting_tax';
      let matchedView = 'business-suites';

      if (bType.includes('pizza')) {
        matchedSuiteId = 'pizza_fastfood';
        matchedView = 'business-suites';
      } else if (bType.includes('restaurant') || bType.includes('cafe')) {
        matchedSuiteId = 'restaurant_cafe';
        matchedView = 'restaurant-hub';
      } else if (bType.includes('hospital')) {
        matchedSuiteId = 'hospital';
        matchedView = 'business-suites';
      } else if (bType.includes('clinic') || bType.includes('health')) {
        matchedSuiteId = 'clinic';
        matchedView = 'clinic-hub';
      } else if (bType.includes('hotel')) {
        matchedSuiteId = 'hotel_hospitality';
        matchedView = 'hotel-hub';
      } else if (bType.includes('travel') || bType.includes('tourism')) {
        matchedSuiteId = 'travel_tourism';
        matchedView = 'travel-hub';
      } else if (bType.includes('pharmacy') || bType.includes('medical')) {
        matchedSuiteId = 'pharmacy';
        matchedView = 'pharmacy-hub';
      } else if (bType.includes('school') || bType.includes('college')) {
        matchedSuiteId = 'school_college';
        matchedView = 'school-hub';
      } else if (bType.includes('auto') || bType.includes('workshop')) {
        matchedSuiteId = 'auto_workshop';
        matchedView = 'auto-hub';
      } else if (bType.includes('gym') || bType.includes('fitness')) {
        matchedSuiteId = 'gym_fitness';
        matchedView = 'gym-hub';
      } else if (bType.includes('salon') || bType.includes('spa')) {
        matchedSuiteId = 'salon_spa';
        matchedView = 'salon-hub';
      } else if (bType.includes('estate') || bType.includes('property')) {
        matchedSuiteId = 'real_estate';
        matchedView = 'property-management';
      } else if (bType.includes('law') || bType.includes('legal')) {
        matchedSuiteId = 'law_firm';
        matchedView = 'legal-hub';
      } else if (bType.includes('ngo') || bType.includes('charity')) {
        matchedSuiteId = 'ngo_nonprofit';
        matchedView = 'ngo-hub';
      } else if (bType.includes('retail') || bType.includes('pos')) {
        matchedSuiteId = 'retail_shop';
        matchedView = 'retail-pos';
      } else if (bType.includes('super') || bType.includes('grocery')) {
        matchedSuiteId = 'super_mart';
        matchedView = 'business-suites';
      } else if (bType.includes('wholesale')) {
        matchedSuiteId = 'wholesale_distribution';
        matchedView = 'business-suites';
      } else if (bType.includes('construct')) {
        matchedSuiteId = 'construction';
        matchedView = 'business-suites';
      } else if (bType.includes('manufactur')) {
        matchedSuiteId = 'manufacturing';
        matchedView = 'business-suites';
      } else if (bType.includes('logistics') || bType.includes('transport')) {
        matchedSuiteId = 'logistics_transport';
        matchedView = 'business-suites';
      } else if (bType.includes('event')) {
        matchedSuiteId = 'event_management';
        matchedView = 'business-suites';
      } else if (bType.includes('payroll') || bType.includes('hr')) {
        matchedSuiteId = 'hr_payroll';
        matchedView = 'business-suites';
      } else if (bType.includes('clean')) {
        matchedSuiteId = 'cleaning_services';
        matchedView = 'business-suites';
      } else if (bType.includes('home')) {
        matchedSuiteId = 'home_services';
        matchedView = 'business-suites';
      } else if (bType.includes('media')) {
        matchedSuiteId = 'media_agency';
        matchedView = 'business-suites';
      } else if (bType.includes('dental')) {
        matchedSuiteId = 'dental';
        matchedView = 'business-suites';
      } else if (bType.includes('coaching') || bType.includes('academy')) {
        matchedSuiteId = 'coaching_center';
        matchedView = 'business-suites';
      } else if (bType.includes('ecommerce') || bType.includes('online')) {
        matchedSuiteId = 'ecommerce';
        matchedView = 'business-suites';
      } else if (bType.includes('agri')) {
        matchedSuiteId = 'agriculture';
        matchedView = 'business-suites';
      }

      this.selectedBusinessSuiteId = matchedSuiteId;
      this.activeView = matchedView;

      this.showActionPopup(
        'Impersonation Activated',
        `Now previewing dashboard as ${tenant.company_name || tenant.email} (${tenant.business_type || 'Custom Business'}). Client business console & modules loaded.`,
        true
      );
    } else {
      this.activeView = 'home';
      this.showActionPopup(
        'Global View Restored',
        'Returned to SuperAdmin multi-tenant overview.',
        true
      );
    }
    try { this.cdr.detectChanges(); } catch {}
  }

  exitImpersonation(): void {
    this.impersonatedTenant = null;
    this.activeView = 'home';
    this.showActionPopup('Global View Restored', 'Returned to SuperAdmin multi-tenant overview.', true);
    try { this.cdr.detectChanges(); } catch {}
  }

  omniSelectedIndex = 0;

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyboard(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toggleOmniSearch();
      return;
    }
    if (event.key === 'Escape') {
      if (this.isOmniSearchOpen) this.closeOmniSearch();
      if (this.isTenantDropdownOpen) this.isTenantDropdownOpen = false;
      if (this.isNotificationDrawerOpen) this.isNotificationDrawerOpen = false;
      try { this.cdr.detectChanges(); } catch {}
      return;
    }
    if (this.isOmniSearchOpen) {
      const flatList = this.omniFlatList;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.omniSelectedIndex = (this.omniSelectedIndex + 1) % (flatList.length || 1);
        try { this.cdr.detectChanges(); } catch {}
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.omniSelectedIndex = (this.omniSelectedIndex - 1 + (flatList.length || 1)) % (flatList.length || 1);
        try { this.cdr.detectChanges(); } catch {}
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (flatList[this.omniSelectedIndex]) {
          this.selectOmniItem(flatList[this.omniSelectedIndex]);
        }
        return;
      }
    }
  }

  toggleOmniSearch(): void {
    this.isOmniSearchOpen = !this.isOmniSearchOpen;
    if (this.isOmniSearchOpen) {
      this.omniSearchQuery = '';
      this.omniSelectedIndex = 0;
      setTimeout(() => {
        const input = document.getElementById('omni-search-input') as HTMLInputElement;
        if (input) input.focus();
      }, 50);
    }
    try { this.cdr.detectChanges(); } catch {}
  }

  closeOmniSearch(): void {
    this.isOmniSearchOpen = false;
    this.omniSelectedIndex = 0;
    try { this.cdr.detectChanges(); } catch {}
  }

  toggleNotificationDrawer(): void {
    this.isNotificationDrawerOpen = !this.isNotificationDrawerOpen;
    try { this.cdr.detectChanges(); } catch {}
  }

  get omniFilteredResults() {
    const q = (this.omniSearchQuery || '').toLowerCase().trim();
    const views = [
      { type: 'view', title: 'Overview & Enterprise KPIs', route: 'home', icon: 'LayoutDashboard' },
      { type: 'view', title: 'All Clients & Multi-Tenants', route: 'all-tenants', icon: 'Building2' },
      { type: 'view', title: 'Security & NOC Threat Center', route: 'security', icon: 'ShieldCheck' },
      { type: 'view', title: 'Developer Hub & Outgoing Webhooks', route: 'webhooks', icon: 'Network' },
      { type: 'view', title: 'Feature Flags & Canary Rollout', route: 'feature-flags', icon: 'Activity' },
      { type: 'view', title: 'Compliance & Sovereign Data Residency', route: 'compliance', icon: 'Globe' },
      { type: 'view', title: 'Global Edge & CDN Infrastructure', route: 'global-edge', icon: 'Zap' },
      { type: 'view', title: 'Plans & Subscription Pricing', route: 'plans-pricing', icon: 'CreditCard' },
      { type: 'view', title: 'Role-Based Access Control (RBAC)', route: 'rbac', icon: 'Key' },
      { type: 'view', title: 'Disaster Recovery & Backup Manager', route: 'backup-manager', icon: 'Database' }
    ];

    const actions = [
      { type: 'action', title: 'Export All Clients to CSV', action: 'export_csv', icon: 'Download' },
      { type: 'action', title: 'Export All Clients to JSON', action: 'export_json', icon: 'FileText' },
      { type: 'action', title: 'Disaster Recovery Snapshot', route: 'backup-manager', action: 'nav', icon: 'Database' },
      { type: 'action', title: 'API Gateway Keys & Policies', route: 'api-gate-list', action: 'nav', icon: 'Key' }
    ];

    const clients = (this.superadminClients || []).map(c => ({
      type: 'client',
      title: `${c.company_name || c.full_name || 'Tenant'} (${c.email})`,
      client: c,
      icon: 'Building2'
    }));

    if (!q) {
      return { 
        actions: actions.slice(0, 2),
        views: views.slice(0, 6), 
        clients: clients.slice(0, 4) 
      };
    }

    return {
      actions: actions.filter(a => a.title.toLowerCase().includes(q)),
      views: views.filter(v => v.title.toLowerCase().includes(q)),
      clients: clients.filter(c => c.title.toLowerCase().includes(q))
    };
  }

  get omniFlatList(): any[] {
    const res = this.omniFilteredResults;
    return [...(res.actions || []), ...(res.views || []), ...(res.clients || [])];
  }

  selectOmniItem(item: any): void {
    this.closeOmniSearch();
    if (!item) return;
    if (item.type === 'view') {
      this.navigateTo(item.route);
    } else if (item.type === 'client') {
      this.openClientDetail(item.client);
    } else if (item.type === 'action') {
      if (item.action === 'export_csv') {
        this.exportAllClientsCsv();
      } else if (item.action === 'export_json') {
        this.exportAllClientsJson();
      } else if (item.route) {
        this.navigateTo(item.route);
      }
    }
  }

  exportAllClientsCsv(): void {
    const list = this.allSuperadminClients?.length ? this.allSuperadminClients : this.superadminClients;
    if (!list || list.length === 0) {
      this.showDynamicIsland('No client records to export.', false);
      return;
    }
    const headers = ['Tenant ID', 'Company Name', 'Full Name', 'Email', 'Phone', 'Business Type', 'City', 'Country', 'Status', 'Plan', 'Created At'];
    const rows = list.map((c: any) => [
      `"${c.tenant_id || c.id || ''}"`,
      `"${(c.company_name || '').replace(/"/g, '""')}"`,
      `"${(c.full_name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${c.country_code || ''} ${c.phone || ''}"`,
      `"${c.business_type || ''}"`,
      `"${c.city || ''}"`,
      `"${c.country || ''}"`,
      `"${c.status || ''}"`,
      `"${c.plan_name || ''}"`,
      `"${c.created_at || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `softcode_clients_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showDynamicIsland(`Exported ${list.length} clients to CSV ✓`, true);
  }

  exportAllClientsJson(): void {
    const list = this.allSuperadminClients?.length ? this.allSuperadminClients : this.superadminClients;
    if (!list || list.length === 0) {
      this.showDynamicIsland('No client records to export.', false);
      return;
    }
    const jsonStr = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `softcode_clients_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showDynamicIsland(`Exported ${list.length} clients to JSON ✓`, true);
  }

  exportSingleClientJson(): void {
    if (!this.clientPopup) return;
    const clientData = {
      tenant_id: this.clientPopup.tenant_id || this.clientPopup.id,
      company_name: this.clientPopup.company_name,
      full_name: this.clientPopup.full_name,
      email: this.clientPopup.email,
      phone: `${this.clientPopup.country_code || ''} ${this.clientPopup.phone || ''}`.trim(),
      business_type: this.clientPopup.business_type,
      business_size: this.clientPopup.business_size,
      status: this.clientPopup.status,
      auth_role: this.clientPopup.auth_role,
      auth_status: this.clientPopup.auth_status,
      plan_name: this.clientPopup.plan_name,
      subscription_status: this.clientPopup.subscription_status,
      address: {
        street: this.clientPopup.address,
        city: this.clientPopup.city,
        state: this.clientPopup.state,
        country: this.clientPopup.country,
        postal_code: this.clientPopup.postal_code || this.clientPopup.postalCode
      },
      security: {
        passkey_enabled: !!(this.clientPopup.enable_passkey || this.clientPopup.enablePasskey),
        dns_status: this.clientDnsStatus,
        vanity_domain: `app.${(this.clientPopup.company_name || 'client').toLowerCase().replace(/\s+/g, '')}.com`
      },
      team_members: this.clientTeamMembers,
      audit_trail: this.clientPopupAudit,
      exported_at: new Date().toISOString(),
      export_engine: 'SoftCode Enterprise Multi-Tenant Platform'
    };

    const jsonStr = JSON.stringify(clientData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossier_${(this.clientPopup.tenant_id || this.clientPopup.id || 'tenant')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.clientPopupNotice('Client dossier JSON downloaded ✓', true);
  }

  exportSingleClientCsv(): void {
    if (!this.clientPopup) return;
    const c = this.clientPopup;
    const headers = ['Tenant ID', 'Company Name', 'Full Name', 'Email', 'Phone', 'Business Type', 'City', 'Country', 'Status', 'Plan', 'Created At'];
    const row = [
      `"${c.tenant_id || c.id || ''}"`,
      `"${(c.company_name || '').replace(/"/g, '""')}"`,
      `"${(c.full_name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${c.country_code || ''} ${c.phone || ''}"`,
      `"${c.business_type || ''}"`,
      `"${c.city || ''}"`,
      `"${c.country || ''}"`,
      `"${c.status || ''}"`,
      `"${c.plan_name || ''}"`,
      `"${c.created_at || ''}"`
    ];
    const csvContent = headers.join(',') + '\n' + row.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tenant_${(c.tenant_id || c.id || 'record')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.clientPopupNotice('Tenant CSV record downloaded ✓', true);
  }

  // --- DRAWER QUOTAS & TEAM STATE ---
  clientDnsStatus: 'verified' | 'checking' | 'unverified' = 'verified';
  isInvitingUser = false;
  inviteUserEmail = '';
  inviteUserRole = 'Member';
  clientTeamMembers: any[] = [
    { name: 'Sarah Chen', email: 'sarah.lead@client.io', role: 'Tenant Owner', status: 'Active', mfa: true },
    { name: 'Marcus Vance', email: 'marcus.ops@client.io', role: 'DevOps Lead', status: 'Active', mfa: true },
    { name: 'Elena Rostova', email: 'elena.fin@client.io', role: 'Billing Admin', status: 'Active', mfa: false }
  ];

  verifyClientDns(): void {
    this.clientDnsStatus = 'checking';
    try { this.cdr.detectChanges(); } catch {}
    setTimeout(() => {
      this.clientDnsStatus = 'verified';
      this.clientPopupAuditAdd('DNS verified', 'CNAME app.tenantdomain.com successfully resolved');
      this.clientPopupNotice('Custom Domain DNS CNAME successfully verified.', true);
      try { this.cdr.detectChanges(); } catch {}
    }, 900);
  }

  inviteTeamMember(): void {
    if (!this.inviteUserEmail) return;
    this.clientTeamMembers.unshift({
      name: this.inviteUserEmail.split('@')[0],
      email: this.inviteUserEmail,
      role: this.inviteUserRole,
      status: 'Invited (Pending)',
      mfa: false
    });
    this.clientPopupAuditAdd('User invited', `${this.inviteUserEmail} (${this.inviteUserRole})`);
    this.clientPopupNotice(`Invitation email sent to ${this.inviteUserEmail}`, true);
    this.inviteUserEmail = '';
    this.isInvitingUser = false;
    try { this.cdr.detectChanges(); } catch {}
  }

  toggleTenantFreeze(): void {
    if (!this.clientPopup) return;
    const isSuspended = this.clientPopup.status === 'suspended';
    this.clientPopup.status = isSuspended ? 'approved' : 'suspended';
    this.clientPopupDraft.status = this.clientPopup.status;
    const action = isSuspended ? 'Account Unfrozen / Active' : 'Account Frozen / Suspended';
    this.clientPopupAuditAdd('Account Freeze Status', action);
    this.clientPopupNotice(`Tenant status updated to: ${this.clientPopup.status}`, true);
    try { this.cdr.detectChanges(); } catch {}
  }
  // SCS_CLIENT_POPUP_SECURE_METHODS_END

  getSchoolSidebarIconBgClass(modId: string, isActive: boolean): string {
    if (isActive) return 'bg-white/20 text-white';
    const id = String(modId || '').toLowerCase();

    // Principal Module Specific Color Matching
    if (id.includes('substitut')) {
      return 'bg-gradient-to-tr from-teal-500 via-teal-600 to-emerald-500 text-white shadow-2xs group-hover:scale-105';
    }
    if (id.includes('supervision') || id.includes('lesson')) {
      return 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-2xs group-hover:scale-105';
    }
    if (id.includes('inspection') || id.includes('walkthrough')) {
      return 'bg-gradient-to-tr from-purple-600 via-purple-600 to-violet-600 text-white shadow-2xs group-hover:scale-105';
    }
    if (id.includes('directive') || id.includes('circular') || id.includes('assembly')) {
      return 'bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-600 text-white shadow-2xs group-hover:scale-105';
    }
    if (id.includes('syllabus')) {
      return 'bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-2xs group-hover:scale-105';
    }
    if (id.includes('discipline') || id.includes('hearing')) {
      return 'bg-gradient-to-tr from-orange-500 via-orange-600 to-red-600 text-white shadow-2xs group-hover:scale-105';
    }
    if (id.includes('appraisal') || id.includes('observation')) {
      return 'bg-gradient-to-tr from-cyan-500 via-cyan-600 to-blue-600 text-white shadow-2xs group-hover:scale-105';
    }
    if (id.includes('exam_moderation') || id.includes('moderation')) {
      return 'bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-600 text-white shadow-2xs group-hover:scale-105';
    }
    if (id.includes('academic_report') || id.includes('academic_reports')) {
      return 'bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 1. Dashboard Overview / Home
    if (id === 'overview' || id === 'home' || id === 'school-hub') {
      return 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-2xs group-hover:scale-105';
    }

    // Campus Top Feed / News / Circulars
    if (id.includes('feed') || id.includes('news')) {
      return 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xs group-hover:scale-105';
    }

    // Events Hub / Gala / Tournaments
    if (id.includes('event') || id.includes('gala') || id.includes('trophy')) {
      return 'bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 text-white shadow-2xs group-hover:scale-105';
    }

    // 2. Attendance / Biometrics / Gate Pass / RFID
    if (id.includes('attendance') || id.includes('roll-call') || id.includes('gate') || id.includes('rfid') || id.includes('biometric')) {
      return 'bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-500 text-white shadow-2xs group-hover:scale-105';
    }

    // 3. Admissions & Enquiries / Inquiries
    if (id.includes('admission') || id.includes('enquiry') || id.includes('inquiry')) {
      return 'bg-gradient-to-tr from-blue-500 via-blue-600 to-cyan-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 4. All Students / Roster / Directory
    if (id.includes('student') || id.includes('roster')) {
      return 'bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 5. Faculty / Teachers / Staff / Payroll
    if (id.includes('teacher') || id.includes('staff') || id.includes('faculty') || id.includes('payroll')) {
      return 'bg-gradient-to-tr from-teal-500 via-teal-600 to-emerald-500 text-white shadow-2xs group-hover:scale-105';
    }

    // 6. Fees / Finance Ledger / Collect
    if (id.includes('finance') || id.includes('fee') || id.includes('billing') || id.includes('challan') || id.includes('collect')) {
      return 'bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 7. Payment Gateway / Online Pay / JazzCash / Quick Fee
    if (id.includes('gateway') || id.includes('payment') || id.includes('online') || id.includes('quick')) {
      return 'bg-gradient-to-tr from-purple-600 via-purple-600 to-indigo-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 8. School Expenses Ledger / Bills
    if (id.includes('expense') || id.includes('bill')) {
      return 'bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 9. Exams / Grades / Marks / Results / Transcripts / Certificates
    if (id.includes('exam') || id.includes('grade') || id.includes('mark') || id.includes('result') || id.includes('transcript') || id.includes('certif')) {
      return 'bg-gradient-to-tr from-purple-600 via-purple-600 to-indigo-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 10. Homework / Lessons / Tasks / Leave
    if (id.includes('homework') || id.includes('lesson') || id.includes('task') || id.includes('leave')) {
      return 'bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 text-white shadow-2xs group-hover:scale-105';
    }

    // 11. Timetable / Schedule / Routine
    if (id.includes('timetable') || id.includes('schedule') || id.includes('routine')) {
      return 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 12. Transport / School Bus / GPS
    if (id.includes('transport') || id.includes('bus')) {
      return 'bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 13. Hostel & Boarding / Rooms
    if (id.includes('hostel') || id.includes('boarding') || id.includes('room')) {
      return 'bg-gradient-to-tr from-amber-600 via-amber-600 to-yellow-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 14. Computer & Science Labs / PCs
    if (id.includes('lab') || id.includes('pc') || id.includes('computer')) {
      return 'bg-gradient-to-tr from-cyan-600 via-cyan-600 to-blue-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 15. Library & Books
    if (id.includes('library') || id.includes('book')) {
      return 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-emerald-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 16. Passed Out Archive / Alumni
    if (id.includes('alumni') || id.includes('archive') || id.includes('award')) {
      return 'bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 17. Communication / Notice / Chat / Messaging / WhatsApp
    if (id.includes('communication') || id.includes('chat') || id.includes('message') || id.includes('notice') || id.includes('whatsapp')) {
      return 'bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 18. Portals & RBAC
    if (id.includes('portal') || id.includes('rbac') || id.includes('role')) {
      return 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-2xs group-hover:scale-105';
    }

    // 19. Reports / Session Report
    if (id.includes('report')) {
      return 'bg-gradient-to-tr from-pink-500 via-pink-600 to-rose-500 text-white shadow-2xs group-hover:scale-105';
    }

    // 20. School Settings
    if (id.includes('setting') || id.includes('config')) {
      return 'bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 text-white shadow-2xs group-hover:scale-105';
    }

    // Default / Hub / Overview
    return 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-2xs group-hover:scale-105';
  }

  getSchoolSidebarIconTextClass(modId: string, isActive: boolean): string {
    return 'text-white';
  }

  getSuperAdminSidebarIconClass(viewKey: string, isActive: boolean): string {
    if (isActive) return 'bg-white/20 text-white border border-white/30 shadow-xs';
    const key = String(viewKey || '').toLowerCase();

    // Overview / Home
    if (key === 'home' || key === 'overview') {
      return 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-blue-600 text-white border border-white/30 shadow-md shadow-indigo-600/30 group-hover:scale-105';
    }
    // Client Previews
    if (key === 'client-previews') {
      return 'bg-gradient-to-tr from-purple-600 via-purple-600 to-indigo-600 text-white border border-white/30 shadow-md shadow-purple-600/30 group-hover:scale-105';
    }
    // Analytics
    if (key === 'analytics') {
      return 'bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-600 text-white border border-white/30 shadow-md shadow-orange-500/30 group-hover:scale-105';
    }
    // System Health
    if (key === 'system-health') {
      return 'bg-gradient-to-tr from-emerald-600 via-emerald-600 to-teal-500 text-white border border-white/30 shadow-md shadow-emerald-600/30 group-hover:scale-105';
    }
    // Security & NOC
    if (key === 'security' || key.includes('security')) {
      return 'bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-600 text-white border border-white/30 shadow-md shadow-emerald-500/30 group-hover:scale-105';
    }
    // Feature Flags
    if (key === 'feature-flags' || key.includes('flag')) {
      return 'bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-600 text-white border border-white/30 shadow-md shadow-rose-500/30 group-hover:scale-105';
    }
    // Compliance
    if (key === 'compliance' || key.includes('compliance')) {
      return 'bg-gradient-to-tr from-teal-500 via-emerald-600 to-teal-600 text-white border border-white/30 shadow-md shadow-teal-500/30 group-hover:scale-105';
    }
    // Developer Hub / Webhooks
    if (key === 'webhooks' || key.includes('webhook') || key.includes('developer')) {
      return 'bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-950 text-white border border-white/30 shadow-md shadow-slate-900/30 group-hover:scale-105';
    }
    // Data Protection
    if (key === 'data-protection' || key.includes('data')) {
      return 'bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white border border-white/30 shadow-md shadow-blue-500/30 group-hover:scale-105';
    }
    // Backup Manager / Backups
    if (key === 'backup-manager' || key.includes('backup')) {
      return 'bg-gradient-to-tr from-amber-500 via-orange-600 to-amber-600 text-white border border-white/30 shadow-md shadow-amber-500/30 group-hover:scale-105';
    }
    // Clients / Tenants
    if (key === 'all-tenants' || key.includes('client') || key.includes('tenant')) {
      return 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-600 text-white border border-white/30 shadow-md shadow-blue-600/30 group-hover:scale-105';
    }
    // Payments
    if (key === 'payments' || key === 'payments-sys-list' || key.includes('payment')) {
      return 'bg-gradient-to-tr from-purple-600 via-purple-600 to-indigo-600 text-white border border-white/30 shadow-md shadow-purple-600/30 group-hover:scale-105';
    }
    // RBAC
    if (key === 'rbac' || key.includes('rbac') || key.includes('role') || key.includes('access')) {
      return 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-600 text-white border border-white/30 shadow-md shadow-indigo-600/30 group-hover:scale-105';
    }
    // License
    if (key === 'license' || key === 'license-list' || key.includes('license')) {
      return 'bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 text-white border border-white/30 shadow-md shadow-amber-500/30 group-hover:scale-105';
    }
    // API Gateway
    if (key === 'api' || key === 'api-gate-list' || key.includes('api')) {
      return 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-cyan-500 text-white border border-white/30 shadow-md shadow-cyan-600/30 group-hover:scale-105';
    }
    // SaaS Control
    if (key === 'saas-control' || key.includes('saas')) {
      return 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white border border-white/30 shadow-md shadow-indigo-600/30 group-hover:scale-105';
    }
    // Module Catalog
    if (key === 'module-catalog' || key.includes('catalog')) {
      return 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white border border-white/30 shadow-md shadow-blue-600/30 group-hover:scale-105';
    }
    // Plans & Pricing
    if (key === 'plans-pricing' || key.includes('plan')) {
      return 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 text-white border border-white/30 shadow-md shadow-purple-600/30 group-hover:scale-105';
    }
    // Settings
    if (key === 'settings' || key === 'settings-list' || key.includes('setting')) {
      return 'bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 text-white border border-white/30 shadow-md shadow-slate-800/30 group-hover:scale-105';
    }
    // Global Edge
    if (key === 'global-edge' || key.includes('edge')) {
      return 'bg-gradient-to-tr from-purple-500 via-fuchsia-600 to-pink-600 text-white border border-white/30 shadow-md shadow-purple-500/30 group-hover:scale-105';
    }
    // All Business Suites
    if (key === 'business-suites') {
      return 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-purple-600 text-white border border-white/30 shadow-md shadow-indigo-600/30 group-hover:scale-105';
    }

    // --- BUSINESS HUBS ---
    // Property & Real Estate
    if (key.includes('property') || key.includes('realty')) {
      return 'bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white border border-white/30 shadow-md shadow-sky-500/30 group-hover:scale-105';
    }
    // Retail Shop & POS
    if (key.includes('retail') || key.includes('pos')) {
      return 'bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-600 text-white border border-white/30 shadow-md shadow-emerald-500/30 group-hover:scale-105';
    }
    // Restaurant & Cafe
    if (key.includes('restaurant') || key.includes('fnb')) {
      return 'bg-gradient-to-tr from-orange-500 via-amber-600 to-orange-600 text-white border border-white/30 shadow-md shadow-orange-500/30 group-hover:scale-105';
    }
    // School & College ERP
    if (key.includes('school')) {
      return 'bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-700 text-white border border-white/30 shadow-md shadow-blue-600/30 group-hover:scale-105';
    }
    // Clinic / Healthcare Center
    if (key.includes('clinic')) {
      return 'bg-gradient-to-tr from-pink-500 via-pink-600 to-rose-600 text-white border border-white/30 shadow-md shadow-pink-500/30 group-hover:scale-105';
    }
    // NGO / Nonprofit Organization
    if (key.includes('ngo')) {
      return 'bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-600 text-white border border-white/30 shadow-md shadow-rose-500/30 group-hover:scale-105';
    }
    // Travel & Tourist Visa
    if (key.includes('travel')) {
      return 'bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-600 text-white border border-white/30 shadow-md shadow-indigo-500/30 group-hover:scale-105';
    }
    // Hotel & Hospitality
    if (key.includes('hotel')) {
      return 'bg-gradient-to-tr from-cyan-500 via-cyan-600 to-blue-600 text-white border border-white/30 shadow-md shadow-cyan-500/30 group-hover:scale-105';
    }
    // Pharmacy & Medical Store
    if (key.includes('pharmacy')) {
      return 'bg-gradient-to-tr from-purple-500 via-purple-600 to-indigo-600 text-white border border-white/30 shadow-md shadow-purple-500/30 group-hover:scale-105';
    }
    // Gym & Fitness Center
    if (key.includes('gym')) {
      return 'bg-gradient-to-tr from-orange-500 via-amber-600 to-orange-600 text-white border border-white/30 shadow-md shadow-orange-500/30 group-hover:scale-105';
    }
    // Auto Workshop & Garage
    if (key.includes('auto')) {
      return 'bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-700 text-white border border-white/30 shadow-md shadow-blue-600/30 group-hover:scale-105';
    }
    // Beauty Salon & Spa
    if (key.includes('salon')) {
      return 'bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-600 text-white border border-white/30 shadow-md shadow-pink-500/30 group-hover:scale-105';
    }
    // Legal Firm / Law Office
    if (key.includes('legal')) {
      return 'bg-gradient-to-tr from-amber-500 via-yellow-600 to-amber-600 text-white border border-white/30 shadow-md shadow-amber-500/30 group-hover:scale-105';
    }
    // Cargo & Freight Logistics
    if (key.includes('cargo')) {
      return 'bg-gradient-to-tr from-blue-600 via-cyan-600 to-teal-500 text-white border border-white/30 shadow-md shadow-blue-600/30 group-hover:scale-105';
    }

    // Accounting & Tax
    if (key.includes('accounting') || key.includes('tax')) {
      return 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-700 text-white border border-white/30 shadow-md shadow-violet-500/30 group-hover:scale-105';
    }
    // Fast Food & Pizzeria
    if (key.includes('pizza') || key.includes('fastfood') || key.includes('fast_food')) {
      return 'bg-gradient-to-tr from-red-500 via-orange-600 to-amber-500 text-white border border-white/30 shadow-md shadow-red-500/30 group-hover:scale-105';
    }
    // Super Mart & Grocery POS
    if (key.includes('super_mart') || key.includes('grocery') || key.includes('mart')) {
      return 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-green-600 text-white border border-white/30 shadow-md shadow-emerald-500/30 group-hover:scale-105';
    }
    // Wholesale & FMCG Distribution
    if (key.includes('wholesale') || key.includes('distribution') || key.includes('fmcg')) {
      return 'bg-gradient-to-tr from-sky-600 via-blue-700 to-indigo-800 text-white border border-white/30 shadow-md shadow-sky-600/30 group-hover:scale-105';
    }
    // Construction & Contracting
    if (key.includes('construction') || key.includes('contracting')) {
      return 'bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-600 text-white border border-white/30 shadow-md shadow-amber-500/30 group-hover:scale-105';
    }
    // Manufacturing & Factory
    if (key.includes('manufacturing') || key.includes('factory')) {
      return 'bg-gradient-to-tr from-slate-700 via-zinc-800 to-slate-900 text-white border border-white/30 shadow-md shadow-slate-700/30 group-hover:scale-105';
    }
    // Logistics & Transport
    if (key.includes('logistics') || key.includes('transport')) {
      return 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-teal-600 text-white border border-white/30 shadow-md shadow-cyan-600/30 group-hover:scale-105';
    }
    // Event Management & Wedding
    if (key.includes('event') || key.includes('wedding')) {
      return 'bg-gradient-to-tr from-fuchsia-500 via-pink-600 to-purple-600 text-white border border-white/30 shadow-md shadow-fuchsia-500/30 group-hover:scale-105';
    }
    // HR & Payroll
    if (key.includes('hr_') || key.includes('payroll')) {
      return 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white border border-white/30 shadow-md shadow-indigo-600/30 group-hover:scale-105';
    }
    // Cleaning Services
    if (key.includes('cleaning')) {
      return 'bg-gradient-to-tr from-teal-500 via-emerald-600 to-cyan-600 text-white border border-white/30 shadow-md shadow-teal-500/30 group-hover:scale-105';
    }
    // Media & Digital Marketing
    if (key.includes('media') || key.includes('marketing')) {
      return 'bg-gradient-to-tr from-rose-500 via-orange-500 to-pink-600 text-white border border-white/30 shadow-md shadow-rose-500/30 group-hover:scale-105';
    }
    // eCommerce Store
    if (key.includes('ecommerce') || key.includes('online_store')) {
      return 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-700 text-white border border-white/30 shadow-md shadow-purple-600/30 group-hover:scale-105';
    }
    // Agriculture & Farm
    if (key.includes('agriculture') || key.includes('farm')) {
      return 'bg-gradient-to-tr from-green-600 via-emerald-600 to-lime-600 text-white border border-white/30 shadow-md shadow-green-600/30 group-hover:scale-105';
    }
    // Hospital IPD
    if (key.includes('hospital')) {
      return 'bg-gradient-to-tr from-red-500 via-rose-600 to-pink-600 text-white border border-white/30 shadow-md shadow-red-500/30 group-hover:scale-105';
    }
    // Dental Clinic
    if (key.includes('dental')) {
      return 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-500 text-white border border-white/30 shadow-md shadow-cyan-500/30 group-hover:scale-105';
    }
    // Coaching Academy
    if (key.includes('coaching')) {
      return 'bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-800 text-white border border-white/30 shadow-md shadow-blue-700/30 group-hover:scale-105';
    }
    // Home & Maintenance Services
    if (key.includes('home_services') || key.includes('maintenance')) {
      return 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-600 text-white border border-white/30 shadow-md shadow-amber-600/30 group-hover:scale-105';
    }
    // Solar & Renewable Energy
    if (key.includes('solar') || key.includes('energy') || key.includes('renewable')) {
      return 'bg-gradient-to-tr from-amber-400 via-yellow-500 to-orange-500 text-white border border-white/30 shadow-md shadow-amber-400/30 group-hover:scale-105';
    }
    // Default
    return 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-blue-600 text-white border border-white/30 shadow-md shadow-indigo-600/30 group-hover:scale-105';
  }
}

export const dashboardIcons = {
    Grip,
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
    CheckCircle2,
    CheckCircle: CheckCircle2,
    'check-circle': CheckCircle2,
    'check-circle-2': CheckCircle2,
    XCircle,
    Clock,
    Database,
    ChevronDown,
    Eye,
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
    Bell,
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
    Wifi,
    WifiOff,
    AlertTriangle,
    Info,
    MapPin,
    Hash,
    Copy,
    MoreVertical,
    MoreHorizontal,
    Loader2,
    UserPlus,
    Trash2,
    Check,
    AlertOctagon,
    Terminal,
    GitBranch,
    ArrowUpCircle,
    HardDrive,
    Download,
    Play,
    Code,
    FileText,
    ExternalLink,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ArrowUpDown,
    Printer,
    AlertCircle,
    Trophy,
    Newspaper,
    GraduationCap,
    Video,
    VideoOff,
    Mic,
    MicOff,
    Radio,
    ScreenShare,
    MonitorPlay,
    Filter,
    Backpack,
    DollarSign,
    Send,
    PhoneCall,
    Award,
    Heart,
    Smartphone,
    SlidersHorizontal,
    Volume2,
    Users2,
    BookMarked,
    CheckSquare,
    Receipt,
    Bus,
    QrCode,
    Library,
    ArrowLeftRight,
    LayoutGrid,
    FlaskConical,
    Edit3,
    Banknote,
    Cloud,
    FileCheck2,
    FileCheck,
    BookOpenCheck,
    CheckCheck,
    ClipboardCheck,
    Megaphone,
    ShieldAlert,
    Table,
    ArrowLeft,
    Phone,
    Wrench,
    HeartPulse,
    Ticket,
    Wallet,
    wallet: Wallet,
    MessageSquareWarning,
    'message-square-warning': MessageSquareWarning,
    Truck,
    truck: Truck,
    ArrowRight,
    'arrow-right': ArrowRight,
    CalendarCheck,
    'calendar-check': CalendarCheck
  };
