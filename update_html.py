import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    content = f.read()

html_to_add = """
      <!-- Enterprise SaaS Modules -->
      <app-dashboard-security *ngIf="activeView === 'security'"></app-dashboard-security>
      <app-dashboard-feature-flags *ngIf="activeView === 'feature-flags'"></app-dashboard-feature-flags>
      <app-dashboard-compliance *ngIf="activeView === 'compliance'"></app-dashboard-compliance>
      <app-dashboard-webhooks *ngIf="activeView === 'webhooks'"></app-dashboard-webhooks>
"""

content = content.replace("<!-- SCS_SUPERADMIN_PLATFORM_EXPANSION_PAGES_END -->", html_to_add + "\n      <!-- SCS_SUPERADMIN_PLATFORM_EXPANSION_PAGES_END -->")

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.write(content)
