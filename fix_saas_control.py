import re

with open('frontend/src/app/dashboard/saas-control/saas-control.component.html', 'r') as f:
    content = f.read()

pattern = r'<div class="overflow-hidden rounded-\[1\.75rem\] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-2xl sm:p-6">.*?</div>\s*</div>\s*</div>'

new_hero = '''<div class="overflow-hidden rounded-[1.75rem] bg-white p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative">
              <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between relative">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">
                    Business-wise subscription engine
                  </p>
                  <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    SaaS Control Center
                  </h2>
                  <p class="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-slate-500">
                    Client ka official business resolve hota hai, phir usi business ka
                    Starter, Pro ya Enterprise price aur included modules assign hote hain.
                  </p>
                </div>
                <div class="w-full xl:max-w-md">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Select approved client
                  </label>
                  <select
                    class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-black text-slate-900 outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm"
                    [value]="selectedClient?.id || ''"
                    (change)="selectSaasControlClient($any($event.target).value)">
                    <option value="" class="text-slate-900">
                      Select client
                    </option>
                    <option
                      *ngFor="let client of superadminClients"
                      [value]="client.id"
                      [disabled]="client.status !== 'approved'"
                      class="text-slate-900">
                      {{ client.company_name || client.full_name || client.email }}
                      — {{ client.business_type }}
                      — {{ client.status }}
                    </option>
                  </select>
                </div>
              </div>
            </div>'''

content = re.sub(pattern, new_hero, content, flags=re.DOTALL)

with open('frontend/src/app/dashboard/saas-control/saas-control.component.html', 'w') as f:
    f.write(content)
print("Fixed saas control")
