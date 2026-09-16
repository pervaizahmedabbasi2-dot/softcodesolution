with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    content = f.read()

old_popup_header = '''<div class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-5 text-white sm:px-6">
      <div class="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl"></div>
      <div class="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-black uppercase ring-1 ring-white/15 sm:h-16 sm:w-16">
            {{ clientPopupInitial() }}
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Secure Client Control</p>
            <h2 class="mt-1 truncate text-xl font-black uppercase tracking-tight sm:text-2xl">{{ clientPopup.full_name || clientPopup.company_name || 'Client' }}</h2>
            <p class="mt-1 truncate text-xs font-bold text-blue-100 sm:text-sm">{{ clientPopup.email || 'No email' }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/15">
                {{ clientPopupStatusLabel(clientPopup.status) }}
              </span>
              <span class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/15">
                {{ clientPopup.tenant_id || 'no-tenant' }}
              </span>
              <span class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/15">
                {{ clientPopup.business_type || 'general' }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 lg:flex-col lg:items-end">
          <button type="button" *ngIf="clientPopup.status !== 'approved'" (click)="clientPopupStatusAction('approve')" [disabled]="clientPopupBusy" class="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/20 disabled:opacity-50">Approve</button>
          <button type="button" *ngIf="clientPopup.status !== 'rejected'" (click)="clientPopupStatusAction('reject')" [disabled]="clientPopupBusy" class="rounded-full bg-rose-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-rose-950/20 disabled:opacity-50">Reject</button>
          <button type="button" (click)="clientPopupStatusAction('suspend')" [disabled]="clientPopupBusy" class="rounded-full bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-950/20 disabled:opacity-50">Suspend</button>
          <button type="button" *ngIf="clientPopup.status === 'approved'" (click)="previewClientDashboard(clientPopup)" [disabled]="clientPopupBusy" class="rounded-full bg-indigo-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-950/20 disabled:opacity-50">Preview Dashboard</button>
        </div>
      </div>
    </div>'''

new_popup_header = '''<div class="relative overflow-hidden bg-white border-b border-slate-200/80 px-6 py-8 sm:px-8">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div class="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-slate-50/50"></div>
      <div class="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-5">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-2xl font-extrabold uppercase ring-1 ring-slate-200 shadow-sm text-slate-700">
            {{ clientPopupInitial() }}
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Secure Client Control</p>
            <h2 class="mt-1 truncate text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{{ clientPopup.full_name || clientPopup.company_name || 'Client' }}</h2>
            <p class="mt-1 truncate text-sm font-bold text-slate-500">{{ clientPopup.email || 'No email' }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-slate-200 text-slate-600">
                {{ clientPopupStatusLabel(clientPopup.status) }}
              </span>
              <span class="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-slate-200 text-slate-600">
                {{ clientPopup.tenant_id || 'no-tenant' }}
              </span>
              <span class="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-slate-200 text-slate-600">
                {{ clientPopup.business_type || 'general' }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 lg:flex-col lg:items-end">
          <button type="button" *ngIf="clientPopup.status !== 'approved'" (click)="clientPopupStatusAction('approve')" [disabled]="clientPopupBusy" class="rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_2px_10px_rgb(16,185,129,0.2)] disabled:opacity-50 hover:bg-emerald-700 transition-colors">Approve</button>
          <button type="button" *ngIf="clientPopup.status !== 'rejected'" (click)="clientPopupStatusAction('reject')" [disabled]="clientPopupBusy" class="rounded-full bg-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_2px_10px_rgb(225,29,72,0.2)] disabled:opacity-50 hover:bg-rose-700 transition-colors">Reject</button>
          <button type="button" (click)="clientPopupStatusAction('suspend')" [disabled]="clientPopupBusy" class="rounded-full bg-amber-400 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_2px_10px_rgb(251,191,36,0.2)] disabled:opacity-50 hover:bg-amber-500 transition-colors">Suspend</button>
          <button type="button" *ngIf="clientPopup.status === 'approved'" (click)="previewClientDashboard(clientPopup)" [disabled]="clientPopupBusy" class="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_2px_10px_rgb(15,23,42,0.2)] disabled:opacity-50 hover:bg-slate-800 transition-colors">Preview Dashboard</button>
        </div>
      </div>
    </div>'''

content = content.replace(old_popup_header, new_popup_header)

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.write(content)
print("Replaced client popup header")
