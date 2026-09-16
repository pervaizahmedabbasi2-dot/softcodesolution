import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    html = f.read()

# find duplicate
html = html.replace('''    <div class="flex-1 overflow-y-auto bg-[#FAFAFA]/50">
      <!-- SCS_DASHBOARD_OVERVIEW_HOST_V1 -->
      
      <div class="flex-1 overflow-y-auto bg-[#FAFAFA]/50">''', '''    <div class="flex-1 overflow-y-auto bg-[#FAFAFA]/50 h-full">''')

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.write(html)
