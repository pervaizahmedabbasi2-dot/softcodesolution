import { Injectable } from '@angular/core';

export interface DashboardModule{

  code:string;
  label:string;
  route:string;
  icon:string;

  category:string;

  pinned:boolean;
  hidden:boolean;

}

@Injectable({
  providedIn:'root'
})
export class ModuleRegistryService{

  // SCS_PHASE668_PERSISTENT_MODULE_STATE
  // Persistent per-browser/domain module visibility state.
  private readonly moduleStateStorageKey =
    'scs.module-manager.visibility.v1';


  // SCS_PHASE667_PERSISTENT_MODULE_STATE
  // User Eye state survives refresh and login.
  private readonly MODULE_STATE_KEY =
    'scs.dashboard.module.visibility.v1';

  private loadPersistentHiddenState(): Record<string, boolean> {

    try {

      const raw =
        localStorage.getItem(this.MODULE_STATE_KEY);

      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        return {};
      }

      return parsed;

    } catch {

      return {};

    }

  }

  private persistModuleState(): void {

    try {

      const hiddenState: Record<string, boolean> = {};

      for (const module of this.modules) {

        hiddenState[module.code] =
          !!module.hidden;

      }

      localStorage.setItem(
        this.MODULE_STATE_KEY,
        JSON.stringify(hiddenState)
      );

    } catch {

      // Persistence must never break dashboard operation.

    }

  }

  private restorePersistentModuleState(): void {

    const hiddenState =
      this.loadPersistentHiddenState();

    for (const module of this.modules) {

      if (
        Object.prototype.hasOwnProperty.call(
          hiddenState,
          module.code
        )
      ) {

        module.hidden =
          !!hiddenState[module.code];

      }

    }

  }


  // SCS_MASTER_MODULE_REGISTRY_V1

  readonly modules:DashboardModule[]=[

    {
      code:'all-tenants',
      label:'Clients',
      route:'all-tenants',
      icon:'Users',
      category:'core',
      pinned:true,
      hidden:false
    },

    {
      code:'payments',
      label:'Payments',
      route:'payments-sys-list',
      icon:'CreditCard',
      category:'finance',
      pinned:true,
      hidden:false
    },

    {
      code:'rbac',
      label:'RBAC',
      route:'rbac',
      icon:'Shield',
      category:'security',
      pinned:true,
      hidden:false
    },

    {
      code:'license',
      label:'License',
      route:'license-list',
      icon:'Key',
      category:'security',
      pinned:true,
      hidden:false
    },

    {
      code:'api',
      label:'API',
      route:'api-gate-list',
      icon:'Network',
      category:'integration',
      pinned:true,
      hidden:false
    },

    {
      code:'settings',
      label:'Settings',
      route:'settings-list',
      icon:'Settings',
      category:'system',
      pinned:true,
      hidden:false
    },

  // SCS_PHASE646_COMPLETE_PLATFORM_REGISTRY

  {
    code:'tenants',
    label:'Tenants',
    route:'tenants-list',
    icon:'Building2',
    category:'core',
    pinned:true,
    hidden:false
  },

  {
    code:'analytics',
    label:'Analytics',
    route:'analytics-list',
    icon:'BarChart3',
    category:'system',
    pinned:true,
    hidden:false
  },

  {
    code:'updater',
    label:'Updater',
    route:'updater-list',
    icon:'RefreshCcw',
    category:'system',
    pinned:true,
    hidden:false
  },

  {
    code:'frontend',
    label:'Frontend',
    route:'frontend-list',
    icon:'Globe',
    category:'system',
    pinned:true,
    hidden:false
  },

  {
    code:'blogs',
    label:'Blogs',
    route:'blogs-list',
    icon:'BookOpen',
    category:'system',
    pinned:true,
    hidden:false
  },

  {
    code:'saas-control',
    label:'SaaS Control',
    route:'saas-control',
    icon:'Sparkles',
    category:'core',
    pinned:true,
    hidden:false
  },

  {
    code:'business-suites',
    label:'Business Suites',
    route:'business-suites',
    icon:'Briefcase',
    category:'core',
    pinned:true,
    hidden:false
  },

  {
    code:'module-catalog',
    label:'Module Catalog',
    route:'module-catalog',
    icon:'Package',
    category:'system',
    pinned:true,
    hidden:false
  },

  {
    code:'plans-pricing',
    label:'Plans & Pricing',
    route:'plans-pricing',
    icon:'CreditCard',
    category:'finance',
    pinned:true,
    hidden:false
  },

  {
    code:'system-health',
    label:'System Health',
    route:'system-health',
    icon:'Server',
    category:'system',
    pinned:true,
    hidden:false
  },
];



  // SCS_PHASE668B_PERSISTENCE_METHODS

  private restoreModuleVisibilityState(): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const raw = localStorage.getItem(
        this.moduleStateStorageKey
      );

      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw);

      if (!saved || typeof saved !== 'object') {
        return;
      }

      for (const module of this.modules) {
        if (
          Object.prototype.hasOwnProperty.call(saved, module.code) &&
          typeof saved[module.code] === 'boolean'
        ) {
          module.hidden = saved[module.code];
        }
      }

    } catch {
      // Persistence failure must never break dashboard startup.
    }
  }

  private persistModuleVisibilityState(): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const state: Record<string, boolean> = {};

      for (const module of this.modules) {
        state[module.code] = !!module.hidden;
      }

      localStorage.setItem(
        this.moduleStateStorageKey,
        JSON.stringify(state)
      );

    } catch {
      // Persistence failure must never break module management.
    }
  }

  getQuickActions(){

    return this.modules.filter(x=>x.pinned&&!x.hidden);

  }

  // SCS_PHASE662_QUICK_ACTION_MANAGE_SOURCE
  // Manage contains the SAME population as Quick Actions.
  // Hidden modules remain here so Eye can restore them.
  getQuickActionManageModules(): DashboardModule[]{

    return this.modules.filter(x=>x.pinned);

  }

  // SCS_PHASE630_ALL_MODULES

  // SCS_PHASE667_RESTORE_ON_SERVICE_INIT
  constructor() {
    this.restorePersistentModuleState();


    // SCS_PHASE668B_RESTORE_ON_START
    this.restoreModuleVisibilityState();
}

getAllModules(): DashboardModule[]{
  return this.modules;
}

getPlatformModules(){

    return this.modules.filter(x=>!x.hidden);

  }

  // SCS_MODULE_REGISTRY_METHODS_V1

  search(query:string){

    const q=query.trim().toLowerCase();

    if(!q){
      return this.getPlatformModules();
    }

    return this.getPlatformModules().filter(m=>
      m.label.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q)
    );

  }

  pin(code:string){

    const m=this.modules.find(x=>x.code===code);

    if(m) m.pinned=true;

  }

  unpin(code:string){

    const m=this.modules.find(x=>x.code===code);

    if(m) m.pinned=false;

  }

    hide(code:string){

    const m=this.modules.find(x=>x.code===code);

    if(m){
      m.hidden=true;
      this.persistModuleVisibilityState();
    }

  }

    show(code:string){

    const m=this.modules.find(x=>x.code===code);

    if(m){
      m.hidden=false;
      this.persistModuleVisibilityState();
    }

  }

  // SCS_MODULE_MANAGER_V1

  getPinnedModules(){

    return this.modules.filter(m=>m.pinned&&!m.hidden);

  }

  getHiddenModules(){

    return this.modules.filter(m=>m.hidden);

  }

  getModulesByCategory(category:string){

    return this.modules.filter(m=>
      !m.hidden &&
      m.category===category
    );

  }

  getCategories(){

    return [...new Set(
      this.modules.map(m=>m.category)
    )].sort();

  }


  // SCS_REGISTRY_REFRESH_V1

  refreshQuickActions(){

    return this.modules
      .filter(m=>m.pinned && !m.hidden);

  }

  refreshVisibleModules(){

    return this.modules
      .filter(m=>!m.hidden);

  }

  // SCS_PLATFORM_MODULES_V1

  updateModules(modules:DashboardModule[]){

    // SCS_PHASE659_MERGE_MODULE_STATE
    // SCS_PHASE667_UPDATE_RESTORE_STATE
    // Catalog synchronization must not replace
    // user-controlled hidden/pinned state.

    const persistedHidden =
      this.loadPersistentHiddenState();

    for(const incoming of modules){

      const existing=this.modules.find(
        x=>x.code===incoming.code
      );

      if(existing){

        // Catalog owns metadata.
        existing.label=incoming.label;
        existing.route=incoming.route;
        existing.icon=incoming.icon;
        existing.category=incoming.category;

        // Existing user state remains untouched.
        continue;
      }

      // New catalog module.
      this.modules.push({
        ...incoming,
        pinned:incoming.pinned ?? false,
        hidden:
          Object.prototype.hasOwnProperty.call(
            persistedHidden,
            incoming.code
          )
            ? !!persistedHidden[incoming.code]
            : (incoming.hidden ?? false)
      });

    }

    this.refreshVisibleModules();
    this.refreshQuickActions();

  }


}
