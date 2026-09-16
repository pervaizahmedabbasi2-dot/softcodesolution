import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert Backgrounds & Text colors
content = content.replace('bg-[#F2F2F7]', 'bg-[#FAFAFA]')
content = content.replace('text-[#1D1D1F]', 'text-slate-900')
# Note: we originally replaced slate-800 to #1D1D1F too, but slate-900 is safe.
content = content.replace('text-[#86868B]', 'text-slate-600')
content = content.replace('text-[#A1A1A6]', 'text-slate-400')
content = content.replace('bg-[#E5E5EA]', 'bg-slate-100')
content = content.replace('border-[#E5E5EA]', 'border-slate-100')
content = content.replace('border-[#D1D1D6]', 'border-slate-200')

# Rounding
content = content.replace('rounded-[20px]', 'rounded-lg')

# Hover states
content = content.replace('hover:bg-black/5', 'hover:bg-[#FAFAFA]')
content = content.replace('hover:bg-slate-100', 'hover:bg-[#FAFAFA]')

with open('frontend/src/app/dashboard/dashboard.component.html', 'w', encoding='utf-8') as f:
    f.write(content)

