with open('frontend/src/app/dashboard/plans-pricing/plans-pricing.component.html', 'r') as f:
    content = f.read()

bad_str = '''<button
                  type="button"
                  *ngFor="let plan of businessPlanPlans"
                  (click)="openBusinessPlanMatrixPlan(plan)"
                  class="text-left rounded-2xl border p-5 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"          </div>'''

good_str = '''<button
                  type="button"
                  *ngFor="let plan of businessPlanPlans"
                  (click)="openBusinessPlanMatrixPlan(plan)"
                  class="text-left rounded-2xl border p-5 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                  [class.border-slate-200]="plan.plan_type !== 'enterprise'"
                  [class.bg-white]="plan.plan_type !== 'enterprise'"
                  [class.border-indigo-600]="plan.plan_type === 'enterprise'"
                  [class.bg-indigo-50]="plan.plan_type === 'enterprise'">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-black uppercase tracking-widest text-slate-500">{{ plan.plan_type }}</span>
                    <lucide-icon [name]="icons.ChevronRight" class="w-4 h-4 text-slate-400"></lucide-icon>
                  </div>
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-black text-slate-900">${{ plan.price_usd }}</span>
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">/mo</span>
                  </div>
                  <div class="mt-4 flex flex-wrap gap-1">
                    <span class="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{{ planBuilderModuleCountFn(plan) }} modules</span>
                  </div>
                </button>
              </div>
            </div>
          </div>'''

content = content.replace(bad_str, good_str)

with open('frontend/src/app/dashboard/plans-pricing/plans-pricing.component.html', 'w') as f:
    f.write(content)

print("Fixed the HTML button closure.")
