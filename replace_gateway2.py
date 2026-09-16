import re

with open('frontend/src/app/dashboard/api-gateway/api-gateway.component.html', 'r') as f:
    content = f.read()

# Replace the hero section and tabs
pattern = re.compile(r'<div class="overflow-hidden rounded-\[2rem\].*?</button>\s*</div>', re.DOTALL)

replacement = """<div class="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
         <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">API Gateway</p>
            <div class="flex items-center gap-2">
               <span class="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse"></span>
               <p class="text-xl font-extrabold text-slate-900 tracking-tight">Endpoint Security</p>
            </div>
            <p class="mt-1.5 text-xs font-medium text-slate-500 max-w-2xl">
              Enterprise API management &mdash; monitor endpoints, manage keys, configure rate limits, enforce security policies and audit all traffic from one console.
            </p>
         </div>
      </div>

      <div class="bg-slate-50/50 rounded-[20px] p-5 border border-slate-100/80">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <div class="rounded-[16px] border border-slate-200/60 bg-white p-4 shadow-sm relative overflow-hidden group hover:border-cyan-200 transition-colors">
            <div class="absolute inset-0 bg-slate-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div class="relative">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Endpoints</p>
              <p class="mt-1 text-3xl font-extrabold text-slate-900">{{ totalEndpoints }}</p>
            </div>
          </div>
          <div class="rounded-[16px] border border-slate-200/60 bg-white p-4 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div class="absolute inset-0 bg-slate-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div class="relative">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Live</p>
              <p class="mt-1 text-3xl font-extrabold text-slate-900">{{ liveEndpoints }}</p>
            </div>
          </div>
          <div class="rounded-[16px] border border-slate-200/60 bg-white p-4 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
            <div class="absolute inset-0 bg-slate-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div class="relative">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">API Keys</p>
              <p class="mt-1 text-3xl font-extrabold text-slate-900">{{ activeKeys }}</p>
            </div>
          </div>
          <div class="rounded-[16px] border border-slate-200/60 bg-white p-4 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
            <div class="absolute inset-0 bg-slate-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div class="relative">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Avg Latency</p>
              <p class="mt-1 text-3xl font-extrabold text-slate-900">{{ avgLatency }}<span class="text-sm text-slate-400 font-bold ml-1">ms</span></p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button *ngFor="let tab of [{key:'endpoints',label:'Endpoints'},{key:'keys',label:'API Keys'},{key:'rate-limits',label:'Rate Limits'},{key:'security',label:'Security'},{key:'logs',label:'Live Logs'}]" type="button" (click)="setTab(tab.key)" 
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm transition-all shadow-sm"
            [class.bg-slate-900]="activeTab === tab.key"
            [class.border-slate-900]="activeTab === tab.key"
            [class.text-white]="activeTab === tab.key"
            [class.bg-white]="activeTab !== tab.key"
            [class.border-slate-200]="activeTab !== tab.key"
            [class.text-slate-700]="activeTab !== tab.key"
            [class.hover:bg-slate-50]="activeTab !== tab.key">
            <span class="font-bold">{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </div>"""

new_content = pattern.sub(replacement, content, count=1)

with open('frontend/src/app/dashboard/api-gateway/api-gateway.component.html', 'w') as f:
    f.write(new_content)

print("Done replacing.")
