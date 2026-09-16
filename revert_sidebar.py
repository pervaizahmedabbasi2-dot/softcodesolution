import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert Sidebar aside
content = content.replace('bg-white/70 backdrop-blur-2xl', 'bg-white')

# Revert Logo area
content = content.replace('shrink-0 bg-transparent"', 'shrink-0 bg-white"')

# Revert Nav area
content = content.replace('sidebar-scroll bg-transparent"', 'sidebar-scroll bg-white"')

with open('frontend/src/app/dashboard/dashboard.component.html', 'w', encoding='utf-8') as f:
    f.write(content)
