import re

with open('frontend/src/app/dashboard/api-gateway/api-gateway.component.html', 'r') as f:
    content = f.read()

# Replace the hero section and tabs
pattern = re.compile(r'<div class="rounded-\[24px\].*?</button>\s*</div>\s*</div>\s*</div>', re.DOTALL)

replacement = """<div class="relative overflow-hidden rounded-[32px] bg-[#0A0A0B] p-6 lg:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] border border-white/[0.08]">
   <!-- Inner glow / mesh gradients -->
   <div class="absolute -top-[50%] -left-[10%] w-[60%] h-[150%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15)_0%,rgba(0,0,0,0)_70%)] blur-[80px]"></div>
   <div class="absolute -bottom-[20%] -right-[10%] w-[50%] h-[100%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15)_0%,rgba(0,0,0,0)_70%)] blur-[80px]"></div>
   
   <div class="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-8">
      <div class="max-w-2xl">
         <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.2)] backdrop-blur-md">
            <lucide-icon [name]="icons.Network" class="h-3.5 w-3.5 text-cyan-400"></lucide-icon> API Gateway
         </div>
         <h1 class="text-4xl lg:text-5xl font-black tracking-tight text-white mb-3 drop-shadow-sm">
            Endpoint Security<span class="text-cyan-400">.</span>
         </h1>
         <p class="text-sm font-medium leading-relaxed text-white/50">
            Enterprise API management &mdash; monitor endpoints, manage keys, configure rate limits, enforce security policies and audit all traffic from one console.
         </p>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-nowrap sm:gap-3">
         <div class="flex-1 sm:flex-none rounded-[20px] bg-white/[0.03] border border-white/[0.08] p-5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-white/[0.06] transition-colors group">
            <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1 group-hover:text-cyan-400 transition-colors">Endpoints</p>
            <p class="text-3xl font-extrabold text-white tracking-tight">{{ totalEndpoints }}</p>
         </div>
         <div class="flex-1 sm:flex-none rounded-[20px] bg-white/[0.03] border border-white/[0.08] p-5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-white/[0.06] transition-colors group">
            <div class="flex items-center gap-2 mb-1">
               <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
               <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-emerald-400 transition-colors">Live</p>
            </div>
            <p class="text-3xl font-extrabold text-white tracking-tight">{{ liveEndpoints }}</p>
         </div>
         <div class="flex-1 sm:flex-none rounded-[20px] bg-white/[0.03] border border-white/[0.08] p-5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-white/[0.06] transition-colors group">
            <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1 group-hover:text-indigo-400 transition-colors">API Keys</p>
            <p class="text-3xl font-extrabold text-white tracking-tight">{{ activeKeys }}</p>
         </div>
         <div class="flex-1 sm:flex-none rounded-[20px] bg-white/[0.03] border border-white/[0.08] p-5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-white/[0.06] transition-colors group">
            <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1 group-hover:text-amber-400 transition-colors">Avg Latency</p>
            <p class="text-3xl font-extrabold text-white tracking-tight">{{ avgLatency }}<span class="text-sm font-bold text-white/30 ml-1">ms</span></p>
         </div>
      </div>
   </div>

   <div class="relative z-10 flex flex-wrap gap-2 pt-6 border-t border-white/[0.08]">
      <button *ngFor="let tab of [{key:'endpoints',label:'Endpoints'},{key:'keys',label:'API Keys'},{key:'rate-limits',label:'Rate Limits'},{key:'security',label:'Security'},{key:'logs',label:'Live Logs'}]" type="button" (click)="setTab(tab.key)" 
         class="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all backdrop-blur-md border"
         [class.bg-white]="activeTab === tab.key"
         [class.text-[#0A0A0B]]="activeTab === tab.key"
         [class.border-white]="activeTab === tab.key"
         [class.shadow-[0_4px_14px_rgba(255,255,255,0.25)]]="activeTab === tab.key"
         [class.bg-white/[0.03]]="activeTab !== tab.key"
         [class.border-white/[0.08]]="activeTab !== tab.key"
         [class.text-white/60]="activeTab !== tab.key"
         [class.hover:bg-white/[0.08]]="activeTab !== tab.key"
         [class.hover:text-white]="activeTab !== tab.key">
         {{ tab.label }}
      </button>
   </div>
</div>"""

new_content = pattern.sub(replacement, content, count=1)

with open('frontend/src/app/dashboard/api-gateway/api-gateway.component.html', 'w') as f:
    f.write(new_content)

print("Done replacing.")
