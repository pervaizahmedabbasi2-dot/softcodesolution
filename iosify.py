import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Backgrounds & Text colors
content = content.replace('bg-[#FAFAFA]', 'bg-[#F2F2F7]')
content = content.replace('text-slate-900', 'text-[#1D1D1F]')
content = content.replace('text-slate-800', 'text-[#1D1D1F]')
content = content.replace('text-slate-600', 'text-[#86868B]')
content = content.replace('text-slate-500', 'text-[#86868B]')
content = content.replace('text-slate-400', 'text-[#A1A1A6]')
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

# Glassmorphism for Sidebar & Header
# <aside ... bg-white ... >
content = re.sub(
    r'class="([^"]*)bg-white([^"]*)transition-transform',
    r'class="\1bg-white/70 backdrop-blur-2xl\2transition-transform',
    content
)

# Header bg-white
content = re.sub(
    r'<header class="([^"]*)bg-white([^"]*)',
    r'<header class="\1bg-white/70 backdrop-blur-2xl\2',
    content
)

# Logo area bg-white -> transparent
content = content.replace('shrink-0 bg-white"', 'shrink-0 bg-transparent"')

# Nav area bg-white -> transparent
content = content.replace('sidebar-scroll bg-white"', 'sidebar-scroll bg-transparent"')

# Any other bg-white could be a card. Let's make them iOS cards.
# iOS cards: bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-0
content = content.replace('bg-white border-slate-100 shadow-sm', 'bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/50')
content = content.replace('bg-white shadow-sm', 'bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)]')

# Typography changes
# font-sans -> font-sans (if we want, we can add tracking-tight for Apple look)
content = content.replace('font-sans', 'font-sans tracking-tight')
content = content.replace('uppercase tracking-widest', 'uppercase tracking-wider text-[11px] font-semibold text-[#86868B]')

with open('frontend/src/app/dashboard/dashboard.component.html', 'w', encoding='utf-8') as f:
    f.write(content)

