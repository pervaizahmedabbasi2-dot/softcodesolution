import re

def replace_hero_dashboard():
    with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
        content = f.read()

    pattern = r'<div class="relative overflow-hidden rounded-\[2rem\] shadow-2xl" style="background:linear-gradient\(135deg,#1e40af 0%,#1e3a8a 45%,#0f172a 100%\)".*?<lucide-icon \[name\]="saasPage\.icon".*?</div>\s*</div>\s*</div>'
    
    hero_new = '''<div class="relative overflow-hidden rounded-[2rem] bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div class="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-10 bg-gradient-to-br from-slate-100 to-transparent"></div>
            <div class="relative px-8 py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-4">
                  <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 backdrop-blur-sm shadow-sm text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                    {{ saasPage.badge }}
                  </span>
                </div>
                <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {{ saasPage.title }}<span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">.</span>
                </h1>
                <p class="text-base text-slate-500 font-medium mt-3 max-w-2xl leading-relaxed">
                  {{ saasPage.subtitle }}
                </p>
              </div>
              <div class="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                <lucide-icon [name]="saasPage.icon" class="w-8 h-8 text-slate-700"></lucide-icon>
              </div>
            </div>
          </div>'''
    
    content = re.sub(pattern, hero_new, content, flags=re.DOTALL)
    
    # Fix duplicate overflow container
    content = content.replace(
'''        <div class="flex-1 overflow-y-auto bg-slate-50/50">
      <!-- SCS_DASHBOARD_OVERVIEW_HOST_V1 -->
      
      <div class="flex-1 overflow-y-auto bg-slate-50/50">''',
'''        <div class="flex-1 overflow-y-auto bg-[#FAFAFA]">''')

    # Change bg-slate-50 to bg-[#FAFAFA] generally
    content = content.replace('bg-slate-50/50', 'bg-[#FAFAFA]')
    
    with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
        f.write(content)

def replace_hero_all_clients():
    with open('frontend/src/app/dashboard/all-clients/all-clients.component.html', 'r') as f:
        content = f.read()

    pattern = r'<div class="relative overflow-hidden rounded-\[2rem\] shadow-2xl" style="background:linear-gradient\(135deg,#1e40af 0%,#1e3a8a 45%,#0f172a 100%\)">.*?<div class="hidden md:grid grid-cols-2 gap-3 min-w-\[280px\]">.*?</div>\s*</div>\s*</div>\s*</div>'
    
    hero_new = '''<div class="relative overflow-hidden rounded-[2rem] bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div class="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-10 bg-gradient-to-br from-slate-100 to-transparent"></div>
          <div class="relative px-8 py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-4">
                <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 backdrop-blur-sm shadow-sm text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  Superadmin
                </span>
                <span *ngIf="lastRefreshedAt" class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Updated {{ lastRefreshedAt }} · Auto in {{ autoRefreshCountdown }}s
                </span>
              </div>
              <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Client Management<span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">.</span>
              </h1>
              <p class="text-base text-slate-500 font-medium mt-3 max-w-2xl leading-relaxed">
                {{ allSuperadminClients.length }} total · {{ superadminClients.length }} showing
              </p>
            </div>
            <div class="hidden md:grid grid-cols-2 gap-3 min-w-[280px]">
              <div class="rounded-2xl bg-slate-50 p-5 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active</p>
                <p class="text-3xl font-black text-slate-900">{{ clientTotals.approved }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-5 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
                <p class="text-3xl font-black text-slate-900">{{ clientTotals.pending }}</p>
              </div>
            </div>
          </div>
        </div>'''
    
    content = re.sub(pattern, hero_new, content, flags=re.DOTALL)
    
    # Let's fix the tabs which were not matched due to quotes or formatting.
    tab_pattern = r'<div \*ngFor="let tab of \[.*?\]" \(click\)="changeClientStatusTab\(tab\.key\)".*?<!-- Value & Label -->.*?</div>\s*</div>'
    
    tabs_new = '''<div *ngFor="let tab of [
            {key:'pending', label:'Pending', count:clientTotals.pending, icon:icons.Clock, pulse:'bg-amber-400', txt:'Review'},
            {key:'approved', label:'Active', count:clientTotals.approved, icon:icons.UserCheck, pulse:'bg-emerald-400', txt:'Manage'},
            {key:'rejected', label:'Rejected', count:clientTotals.rejected, icon:icons.UserX, pulse:'bg-red-400', txt:'View'},
            {key:'all', label:'All Clients', count:clientTotals.all, icon:icons.Database, pulse:'bg-blue-400', txt:'View All'}
          ]" (click)="changeClientStatusTab(tab.key)"
            class="relative overflow-hidden rounded-2xl p-6 cursor-pointer group transition-all duration-300"
            [class.bg-slate-900]="clientStatusTab === tab.key"
            [class.text-white]="clientStatusTab === tab.key"
            [class.shadow-[0_8px_30px_rgb(0,0,0,0.12)]]="clientStatusTab === tab.key"
            [class.-translate-y-1]="clientStatusTab === tab.key"
            [class.bg-white]="clientStatusTab !== tab.key"
            [class.border]="clientStatusTab !== tab.key"
            [class.border-slate-200/80]="clientStatusTab !== tab.key"
            [class.shadow-[0_2px_10px_rgb(0,0,0,0.02)]]="clientStatusTab !== tab.key"
            [class.hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]]="clientStatusTab !== tab.key">
            
            <!-- Bottom Right Gradient Circle (Subtle) -->
            <div class="absolute -bottom-6 -right-6 w-28 h-28 rounded-full opacity-10"
              [class.bg-slate-700]="clientStatusTab === tab.key"
              [class.bg-slate-200]="clientStatusTab !== tab.key"></div>
            
            <!-- Icon & Live Pill -->
            <div class="flex items-start justify-between mb-6 relative z-10">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                   [class.bg-slate-800]="clientStatusTab === tab.key" [class.text-white]="clientStatusTab === tab.key"
                   [class.bg-slate-50]="clientStatusTab !== tab.key" [class.text-slate-600]="clientStatusTab !== tab.key" [class.border]="clientStatusTab !== tab.key" [class.border-slate-100]="clientStatusTab !== tab.key">
                <lucide-icon [name]="tab.icon" class="w-5 h-5"></lucide-icon>
              </div>
              <div class="px-2 py-1 rounded border flex items-center gap-1.5 transition-colors"
                   [class.border-slate-700]="clientStatusTab === tab.key" [class.bg-slate-800]="clientStatusTab === tab.key"
                   [class.border-slate-100]="clientStatusTab !== tab.key" [class.bg-slate-50]="clientStatusTab !== tab.key">
                <div class="w-1.5 h-1.5 rounded-full" [ngClass]="tab.pulse" [class.animate-pulse]="tab.count > 0"></div>
                <span class="text-[9px] font-black uppercase tracking-widest transition-colors"
                      [class.text-slate-300]="clientStatusTab === tab.key" [class.text-slate-400]="clientStatusTab !== tab.key">{{ tab.txt }}</span>
              </div>
            </div>

            <!-- Value & Label -->
            <div class="relative z-10">
              <p class="text-3xl font-black mb-1 transition-colors"
                 [class.text-white]="clientStatusTab === tab.key" [class.text-slate-900]="clientStatusTab !== tab.key">{{ tab.count }}</p>
              <p class="text-[10px] font-black uppercase tracking-widest transition-colors"
                 [class.text-slate-400]="clientStatusTab === tab.key" [class.text-slate-400]="clientStatusTab !== tab.key">{{ tab.label }}</p>
            </div>
          </div>'''
    
    content = re.sub(tab_pattern, tabs_new, content, flags=re.DOTALL)

    with open('frontend/src/app/dashboard/all-clients/all-clients.component.html', 'w') as f:
        f.write(content)

replace_hero_dashboard()
replace_hero_all_clients()
print("Regex replace complete")
