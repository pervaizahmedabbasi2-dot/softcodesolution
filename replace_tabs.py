with open('frontend/src/app/dashboard/all-clients/all-clients.component.html', 'r') as f:
    content = f.read()

start_str = '''<div *ngFor="let tab of ['''
end_str = '''<!-- Value & Label -->'''

start_idx = content.find(start_str)
end_idx = content.find('</div>\n          </div>', start_idx) + 22

if start_idx != -1 and end_idx != -1:
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
            
            <div class="absolute -bottom-6 -right-6 w-28 h-28 rounded-full opacity-10"
              [class.bg-slate-700]="clientStatusTab === tab.key"
              [class.bg-slate-200]="clientStatusTab !== tab.key"></div>
            
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

            <div class="relative z-10">
              <p class="text-3xl font-black mb-1 transition-colors"
                 [class.text-white]="clientStatusTab === tab.key" [class.text-slate-900]="clientStatusTab !== tab.key">{{ tab.count }}</p>
              <p class="text-[10px] font-black uppercase tracking-widest transition-colors"
                 [class.text-slate-400]="clientStatusTab === tab.key" [class.text-slate-400]="clientStatusTab !== tab.key">{{ tab.label }}</p>
            </div>
          </div>'''
    
    content = content[:start_idx] + tabs_new + content[end_idx:]
    with open('frontend/src/app/dashboard/all-clients/all-clients.component.html', 'w') as f:
        f.write(content)
    print("Replaced tabs")
else:
    print("Could not find tabs block")

