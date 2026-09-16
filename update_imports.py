import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    content = f.read()

# Add Bell to lucide imports
content = content.replace('LucideAngularModule,\n  LayoutDashboard', 'LucideAngularModule,\n  Bell,\n  CheckCircle2,\n  AlertTriangle,\n  LayoutDashboard')

# Add Bell to dashboardIcons
content = content.replace('export const dashboardIcons = {\n    LayoutDashboard', 'export const dashboardIcons = {\n    Bell,\n    CheckCircle2,\n    AlertTriangle,\n    LayoutDashboard')

# Add Notification properties to DashboardComponent class
props = '''  // SCS_NOTIFICATIONS_CENTER
  isNotificationsOpen = false;
  unreadNotifications = 3;
  notifications = [
    { id: 1, type: 'alert', title: 'High CPU Usage', message: 'Tenant #492 is utilizing 98% of their allocated compute limits.', time: '2 mins ago', read: false },
    { id: 2, type: 'success', title: 'Global Backup Complete', message: 'All regional databases have been securely mirrored.', time: '1 hr ago', read: false },
    { id: 3, type: 'info', title: 'New Multi-Tenant Node', message: 'Node EU-West-3 has successfully joined the cluster.', time: '3 hrs ago', read: false },
    { id: 4, type: 'warning', title: 'API Rate Limit', message: 'Payment gateway API calls approaching 90% of quota.', time: '5 hrs ago', read: true }
  ];

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadNotifications = 0;
  }
'''
content = content.replace('readonly icons = dashboardIcons;', 'readonly icons = dashboardIcons;\n' + props)

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(content)
