with open('frontend/src/app/login/login.component.html', 'r') as f:
    content = f.read()

import re

# Remove `h-[calc(100vh-5rem)]` from the left side.
# `<div class="w-full lg:w-1/2 flex flex-col relative bg-[#F7F9FC] lg:bg-transparent h-[calc(100vh-5rem)] overflow-y-auto">`
content = content.replace('h-[calc(100vh-5rem)] overflow-y-auto', '')

# Remove `min-h-screen` and `pt-20` from the main flex container, or adjust it
content = content.replace('<div class="min-h-screen flex bg-white font-sans relative overflow-hidden pt-20">', '<div class="h-screen flex bg-white font-sans relative overflow-hidden pt-20">')
content = content.replace('<div class="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">', '<div class="h-screen bg-slate-50 flex flex-col lg:flex-row font-sans overflow-hidden">')

with open('frontend/src/app/login/login.component.html', 'w') as f:
    f.write(content)
