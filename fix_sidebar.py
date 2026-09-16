import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    content = f.read()

# Replace the overlay
content = content.replace('bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden', 'bg-slate-900/20 backdrop-blur-sm z-40 md:hidden')

# Replace sidebar responsive classes
content = content.replace('[class.lg:translate-x-0]', '[class.md:translate-x-0]')
content = content.replace('[class.lg:ml-0]', '[class.md:ml-0]')
content = content.replace('[class.lg:-ml-72]', '[class.md:-ml-72]')
content = content.replace('lg:static flex flex-col shadow-2xl lg:shadow-none', 'md:static flex flex-col shadow-2xl md:shadow-none')

# Replace sidebar toggle button classes (inside sidebar)
content = content.replace('hidden lg:flex p-1.5', 'hidden md:flex p-1.5')
content = content.replace('class="lg:hidden p-2', 'class="md:hidden p-2')

# Replace toggle button in main header
content = content.replace('[class.lg:hidden]="isSidebarOpen"', '[class.md:hidden]="isSidebarOpen"')

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.write(content)

print("Replaced classes.")
