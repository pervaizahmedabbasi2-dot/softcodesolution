with open('frontend/src/app/dashboard/module-catalog/module-catalog.component.html', 'r') as f:
    content = f.read()

old_header = '''<div class="relative overflow-hidden px-6 py-6 text-white" style="background:linear-gradient(135deg,#1e40af,#0f172a)">
            <div class="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10"></div>
            <div class="relative flex items-start justify-between gap-4">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[3px] text-blue-200">Module Catalog</p>
                <h2 class="mt-1 text-2xl font-black uppercase tracking-tight">{{ moduleCatalogEditorTitle() }}</h2>
                <p class="mt-1 text-xs font-bold text-white/50">Create/update global modules used by plans, suites and tenant access.</p>
              </div>
              <button type="button" (click)="closeModuleCatalogEditor()" [disabled]="moduleCatalogEditorBusy" class="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 disabled:opacity-50">Close</button>
            </div>
          </div>'''

new_header = '''<div class="relative overflow-hidden px-8 py-8 bg-white border-b border-slate-200/80">
            <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div class="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-slate-50/50"></div>
            <div class="relative flex items-start justify-between gap-4">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Module Catalog</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">{{ moduleCatalogEditorTitle() }}</h2>
                <p class="mt-1 text-xs font-bold text-slate-500">Create/update global modules used by plans, suites and tenant access.</p>
              </div>
              <button type="button" (click)="closeModuleCatalogEditor()" [disabled]="moduleCatalogEditorBusy" class="rounded-full bg-slate-100 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 border border-slate-200">Close</button>
            </div>
          </div>'''

content = content.replace(old_header, new_header)

with open('frontend/src/app/dashboard/module-catalog/module-catalog.component.html', 'w') as f:
    f.write(content)
print("Updated module-catalog header")
