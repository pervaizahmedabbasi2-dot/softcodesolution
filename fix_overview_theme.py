import re

with open('frontend/src/app/dashboard/overview/overview.component.html', 'r') as f:
    content = f.read()

# Update spacing and shadows on cards for a more premium look.
content = content.replace('shadow-sm hover:shadow-md transition-shadow', 'shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300')
content = content.replace('border-slate-200/60', 'border-slate-200/80')

# Update metrics inner layout
content = content.replace('p-5', 'p-6')
content = content.replace('p-4', 'p-6')

with open('frontend/src/app/dashboard/overview/overview.component.html', 'w') as f:
    f.write(content)
print("Updated overview.component.html")
