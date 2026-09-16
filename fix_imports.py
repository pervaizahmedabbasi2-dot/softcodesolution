import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    content = f.read()

# Add import
import_statement = "import { GlobalEdgeComponent } from './global-edge/global-edge.component';\nimport { DashboardAnalyticsComponent } from './analytics/analytics.component';"
content = content.replace("import { WebhooksComponent } from './webhooks/webhooks.component';", "import { WebhooksComponent } from './webhooks/webhooks.component';\n" + import_statement)

# Add to @Component imports
content = content.replace("WebhooksComponent,", "WebhooksComponent,\n    GlobalEdgeComponent,\n    DashboardAnalyticsComponent,")

# Add to allCategories
all_cats = """    {
      id: 'global-edge',
      label: 'Edge Network',
      icon: Network,
      list: 'Global Map',
      add: 'Regions',
      roles: ['super_admin'],
      description: 'Infrastructure topology',
      color: 'slate',
      phase: 'LIVE',
    },
"""
# Insert before analytics
content = content.replace("id: 'analytics',", all_cats + "\n    id: 'analytics',")

# Update quickActions.modules to include global edge and analytics
quick_actions = """        {
          code: 'global-edge',
          label: 'Global Edge',
          route: 'global-edge',
          icon: 'Globe',
          pinned: true,
          hidden: false,
        },
        {
          code: 'analytics',
          label: 'Analytics',
          route: 'analytics',
          icon: 'BarChart3',
          pinned: true,
          hidden: false,
        },
"""
content = content.replace("{ code: 'rbac',", quick_actions + "        { code: 'rbac',")

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(content)
