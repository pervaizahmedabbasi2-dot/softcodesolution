import re

with open('frontend/src/app/dashboard/module-catalog/module-catalog.component.html', 'r') as f:
    content = f.read()

# Replace the content between <ng-container *ngIf="mode === 'panel'"> and </ng-container>
pattern = re.compile(r'(<ng-container \*ngIf="mode === \'panel\'">).*?(</ng-container>)', re.DOTALL)

replacement = """<ng-container *ngIf="mode === 'panel'">
  <div *ngIf="activeView !== 'saas-control' && activeView !== 'plans-pricing'" class="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
       <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Catalog Status</p>
          <div class="flex items-center gap-2">
             <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
             <p class="text-lg font-extrabold text-slate-900 tracking-tight">REAL Module Catalog Connected</p>
          </div>
          <p class="mt-1.5 text-xs font-medium text-slate-500">
            <strong class="text-slate-800">{{ moduleCatalog.length || 0 }}</strong> modules ready &middot; <strong class="text-slate-800">{{ moduleCatalogCategories.length || 0 }}</strong> business groups. Upar group select karo, neeche modules filter honge.
          </p>
       </div>
    </div>

    <div class="bg-slate-50/50 rounded-[20px] p-5 border border-slate-100/80">
        <!-- CATALOG_GROUP_CHIPS_REAL -->
        <div class="mb-6">
          <div class="flex items-center justify-between gap-3 mb-3">
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Business Groups</p>
            <p class="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{{ moduleCatalogCategories.length || 0 }} groups</p>
          </div>
          <div class="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto scrollbar-thin">
            <button type="button" (click)="setModuleCatalogCategory('all')" 
              class="flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm transition-all shadow-sm"
              [class.bg-slate-900]="moduleCatalogCategory === 'all'"
              [class.border-slate-900]="moduleCatalogCategory === 'all'"
              [class.text-white]="moduleCatalogCategory === 'all'"
              [class.bg-white]="moduleCatalogCategory !== 'all'"
              [class.border-slate-200]="moduleCatalogCategory !== 'all'"
              [class.text-slate-700]="moduleCatalogCategory !== 'all'"
              [class.hover:bg-slate-50]="moduleCatalogCategory !== 'all'">
              <span class="font-bold">All Modules</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                 [class.bg-white/20]="moduleCatalogCategory === 'all'"
                 [class.text-white]="moduleCatalogCategory === 'all'"
                 [class.bg-slate-100]="moduleCatalogCategory !== 'all'"
                 [class.text-slate-500]="moduleCatalogCategory !== 'all'">
                 {{ moduleCatalog.length || 0 }}
              </span>
            </button>
            <button type="button" *ngFor="let cat of moduleCatalogCategories" (click)="setModuleCatalogCategory(cat)" 
              class="flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm transition-all shadow-sm"
              [class.bg-indigo-600]="moduleCatalogCategory === cat"
              [class.border-indigo-600]="moduleCatalogCategory === cat"
              [class.text-white]="moduleCatalogCategory === cat"
              [class.bg-white]="moduleCatalogCategory !== cat"
              [class.border-slate-200]="moduleCatalogCategory !== cat"
              [class.text-slate-700]="moduleCatalogCategory !== cat"
              [class.hover:bg-slate-50]="moduleCatalogCategory !== cat">
              <span class="font-bold truncate max-w-[120px]">{{ formatModuleCategory(cat) }}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                 [class.bg-white/20]="moduleCatalogCategory === cat"
                 [class.text-white]="moduleCatalogCategory === cat"
                 [class.bg-slate-100]="moduleCatalogCategory !== cat"
                 [class.text-slate-500]="moduleCatalogCategory !== cat">
                 {{ countModulesByCategory(cat) }}
              </span>
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 mb-5">
          <div class="relative flex-1 group">
             <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
             </div>
             <input [value]="moduleCatalogSearch" (input)="setModuleCatalogSearch($any($event.target).value)" placeholder="Search modules..." 
                class="w-full pl-10 pr-4 py-3 rounded-[14px] border border-slate-200 bg-white text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm placeholder:text-slate-400 text-slate-900">
          </div>
          <div class="flex gap-2 shrink-0">
             <button type="button" (click)="openModuleCatalogCreate()" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] bg-indigo-600 text-white text-sm font-bold shadow-sm hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all" title="Add new module">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                <span class="hidden sm:inline">Add Module</span><span class="sm:hidden">Add</span>
             </button><!-- SCS_MODULE_CATALOG_ADD_BUTTON -->
             <button type="button" (click)="loadModuleCatalogForSuperadmin()" class="inline-flex items-center justify-center p-3 rounded-[14px] bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-0.5 transition-all" title="Refresh">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
             </button>
          </div>
        </div>

        <div class="flex items-center justify-between mb-3 px-1">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Showing <span class="text-indigo-600">{{ filteredModuleCatalog.length }}</span> of {{ moduleCatalog.length }} modules
          </p>
        </div>

        <div class="max-h-[320px] overflow-y-auto scrollbar-thin pr-1 space-y-2">
          <div *ngFor="let m of filteredModuleCatalog" class="group flex items-center justify-between gap-4 p-4 rounded-[16px] bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
            <div class="flex items-center gap-4 min-w-0">
               <div class="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                  <svg class="w-5 h-5 text-slate-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
               </div>
               <div class="min-w-0">
                 <p class="text-sm font-extrabold text-slate-900 truncate">{{ $any(m).name }}</p>
                 <p class="text-[11px] font-medium text-slate-500 truncate mt-0.5 tracking-wide">{{ $any(m).id }}</p>
               </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-[0.1em]">{{ formatModuleCategory($any(m).category) }}</span>
              <button type="button" (click)="openModuleCatalogEdit(m)" class="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:-translate-y-0.5 transition-all">Edit</button><!-- SCS_MODULE_CATALOG_EDIT_BUTTON -->
            </div>
          </div>
        </div>
    </div>
  </div>
</ng-container>"""

new_content = pattern.sub(replacement, content, count=1)

with open('frontend/src/app/dashboard/module-catalog/module-catalog.component.html', 'w') as f:
    f.write(new_content)

print("Done replacing.")
