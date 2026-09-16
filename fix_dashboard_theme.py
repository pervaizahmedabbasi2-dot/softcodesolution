import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    content = f.read()

# Fix duplicate overflow container
content = content.replace(
'''        <div class="flex-1 overflow-y-auto bg-slate-50/50">
      <!-- SCS_DASHBOARD_OVERVIEW_HOST_V1 -->
      
      <div class="flex-1 overflow-y-auto bg-slate-50/50">''',
'''        <div class="flex-1 overflow-y-auto bg-[#FAFAFA]">''')

# Change bg-slate-50 to bg-[#FAFAFA] generally
content = content.replace('bg-slate-50', 'bg-[#FAFAFA]')
content = content.replace('bg-slate-50/50', 'bg-[#FAFAFA]')

# Replace the heavy dark gradient hero in saas pages with a premium white/light version
hero_old = '''<div class="relative overflow-hidden rounded-[2rem] shadow-2xl" style="background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 45%,#0f172a 100%)">
            <div class="absolute inset-0 opacity-10" style="background-image:radial-gradient(circle,#fff 1px,transparent 1px);background-size:28px 28px"></div>
            <div class="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-15" style="background:radial-gradient(circle,#60a5fa,transparent)"></div>
            <div class="relative px-7 py-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[3px] text-white/80"
                    style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18)">
                    {{ saasPage.badge }}
                  </span>
                  <span class="text-[10px] text-white/50 font-bold">Frontend shell · backend next phase</span>
                </div>
                <h1 class="text-3xl font-black text-white uppercase tracking-tight leading-tight">
                  {{ saasPage.title }}<span class="text-blue-300">.</span>
                </h1>
                <p class="text-sm text-white/45 font-medium mt-2 max-w-2xl">
                  {{ saasPage.subtitle }}
                </p>
              </div>
              <div class="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/15">
                <lucide-icon [name]="saasPage.icon" class="w-8 h-8 text-white"></lucide-icon>
              </div>
            </div>
          </div>'''

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
              <div class="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
                <lucide-icon [name]="saasPage.icon" class="w-8 h-8 text-slate-700"></lucide-icon>
              </div>
            </div>
          </div>'''

content = content.replace(hero_old, hero_new)

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.write(content)
print("Updated dashboard.component.html")
