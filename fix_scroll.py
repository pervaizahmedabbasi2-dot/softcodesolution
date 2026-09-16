with open('frontend/src/app/login/login.component.html', 'r') as f:
    content = f.read()

content = content.replace('<div class="h-screen flex bg-white font-sans relative overflow-hidden pt-20">', '<div class="min-h-screen flex bg-white font-sans relative pt-20">')
content = content.replace('<div class="w-full lg:w-1/2 flex flex-col relative bg-[#F7F9FC] lg:bg-transparent ">', '<div class="w-full lg:w-1/2 flex flex-col relative bg-[#F7F9FC] lg:bg-transparent min-h-[calc(100vh-5rem)] py-10">')

with open('frontend/src/app/login/login.component.html', 'w') as f:
    f.write(content)

with open('frontend/src/app/register/register.component.html', 'r') as f:
    content2 = f.read()

content2 = content2.replace('<div class="h-screen flex bg-white font-sans relative overflow-hidden pt-20">', '<div class="min-h-screen flex bg-white font-sans relative pt-20">')
content2 = content2.replace('<div class="w-full lg:w-1/2 flex flex-col relative bg-[#F7F9FC] lg:bg-transparent ">', '<div class="w-full lg:w-1/2 flex flex-col relative bg-[#F7F9FC] lg:bg-transparent min-h-[calc(100vh-5rem)] py-10">')

with open('frontend/src/app/register/register.component.html', 'w') as f:
    f.write(content2)
