import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    content = f.read()

replacement = """
      <!-- Advanced Enterprise Views -->
      <app-dashboard-global-edge *ngIf="activeView === 'global-edge'" [activeView]="activeView"></app-dashboard-global-edge>
      <app-dashboard-analytics *ngIf="activeView === 'analytics'"></app-dashboard-analytics>

      <!-- Enterprise SaaS Modules -->
"""
content = content.replace('<!-- Enterprise SaaS Modules -->', replacement)

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.write(content)
