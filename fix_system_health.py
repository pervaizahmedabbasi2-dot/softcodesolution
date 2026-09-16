import re

with open('frontend/src/app/dashboard/system-health/system-health.component.html', 'r') as f:
    content = f.read()

pattern = r'<div\s+class="relative overflow-hidden rounded-\[2rem\] shadow-2xl"\s+style="background:linear-gradient\(135deg,#1e40af 0%,#1e3a8a 45%,#0f172a 100%\)".*?</div>\s*</div>\s*</div>'

new_hero = '''<div class="relative overflow-hidden rounded-[2rem] bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    <div class="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-10 bg-gradient-to-br from-slate-100 to-transparent"></div>
    <div class="relative px-8 py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 backdrop-blur-sm shadow-sm text-[10px] font-bold text-slate-700 uppercase tracking-widest">
            {{ page.badge }}
          </span>
          <span class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5 ml-2">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            All Systems Operational
          </span>
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {{ page.title }}<span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">.</span>
        </h1>
        <p class="text-base text-slate-500 font-medium mt-3 max-w-2xl leading-relaxed">
          {{ page.subtitle }}
        </p>
      </div>
      <div class="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
        <lucide-icon [name]="page.icon" class="w-8 h-8 text-slate-700"></lucide-icon>
      </div>
    </div>
  </div>'''

content = re.sub(pattern, new_hero, content, flags=re.DOTALL)

with open('frontend/src/app/dashboard/system-health/system-health.component.html', 'w') as f:
    f.write(content)
print("Fixed system health")
