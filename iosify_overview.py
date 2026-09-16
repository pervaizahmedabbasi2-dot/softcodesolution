import re

with open('frontend/src/app/dashboard/overview/overview.component.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Backgrounds & Text colors
content = content.replace('bg-[#FAFAFA]', 'bg-[#F2F2F7]')
content = content.replace('text-slate-900', 'text-[#1D1D1F]')
content = content.replace('text-slate-800', 'text-[#1D1D1F]')
content = content.replace('text-slate-600', 'text-[#86868B]')
content = content.replace('text-slate-500', 'text-[#86868B]')
content = content.replace('text-slate-400', 'text-[#A1A1A6]')
content = content.replace('text-slate-700', 'text-[#1D1D1F]')
content = content.replace('bg-slate-100', 'bg-[#E5E5EA]')
content = content.replace('bg-slate-50', 'bg-[#F2F2F7]')
content = content.replace('border-slate-100', 'border-[#E5E5EA]')
content = content.replace('border-slate-200', 'border-[#D1D1D6]')

# Rounding
content = content.replace('rounded-lg', 'rounded-xl')
content = content.replace('rounded-md', 'rounded-lg')
content = content.replace('rounded-xl', 'rounded-2xl') # some existing xl to 2xl
content = content.replace('rounded-2xl', 'rounded-[20px]') # specifically for inner cards

# Hover states
content = content.replace('hover:bg-[#FAFAFA]', 'hover:bg-black/5')
content = content.replace('hover:bg-slate-100', 'hover:bg-black/5')
content = content.replace('hover:bg-slate-50', 'hover:bg-black/5')

content = content.replace('bg-white border-slate-100 shadow-sm', 'bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/50')
content = content.replace('bg-white shadow-sm', 'bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)]')

with open('frontend/src/app/dashboard/overview/overview.component.html', 'w', encoding='utf-8') as f:
    f.write(content)
