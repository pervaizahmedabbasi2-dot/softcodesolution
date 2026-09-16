with open('frontend/src/app/register/register.component.html', 'r') as f:
    content = f.read()

content = content.replace('h-[calc(100vh-5rem)] overflow-y-auto', '')
content = content.replace('<div class="min-h-screen flex bg-white font-sans relative overflow-hidden pt-20">', '<div class="h-screen flex bg-white font-sans relative overflow-hidden pt-20">')

with open('frontend/src/app/register/register.component.html', 'w') as f:
    f.write(content)
