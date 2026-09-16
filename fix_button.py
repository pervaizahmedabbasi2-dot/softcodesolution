import re

with open('frontend/src/app/dashboard/plans-pricing/plans-pricing.component.html', 'r') as f:
    content = f.read()

pattern = r'''<button
                  type="button"
                  \*ngFor="let plan of businessPlanPlans"
                  \(click\)="openBusinessPlanMatrixPlan\(plan\)"
                  class="text-left rounded-2xl border p-5 transition-all shadow-\[0_2px_10px_rgb\(0,0,0,0\.02\)\] hover:shadow-\[0_8px_30px_rgb\(0,0,0,0\.06\)\]"'''

replacement = '''<button
                  type="button"
                  *ngFor="let plan of businessPlanPlans"
                  (click)="openBusinessPlanMatrixPlan(plan)"
                  class="text-left rounded-2xl border p-5 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"'''

# It looks like the regex missed the end > or we chopped it off. Let's fix the end of the button tag matching.
# Let's just find the exact snippet that is broken.
