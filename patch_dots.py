import os

file_path = 'frontend/src/app/dashboard/dashboard.component.html'
with open(file_path, 'r') as f:
    content = f.read()

search = """          <button class="p-2 -ml-2 hover:bg-slate-50 rounded-lg transition-colors flex gap-1.5 items-center justify-center" (click)="toggleSidebar()">
             <div class="w-1.5 h-1.5 rounded-full bg-slate-800 transition-transform duration-300" [class.scale-75]="!isSidebarOpen"></div>
             <div class="w-1.5 h-1.5 rounded-full bg-slate-800 transition-transform duration-300" [class.scale-75]="!isSidebarOpen"></div>
             <div class="w-1.5 h-1.5 rounded-full bg-slate-800 transition-transform duration-300" [class.scale-75]="!isSidebarOpen"></div>
          </button>"""

replace = """          <button class="p-2 -ml-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center text-slate-500 hover:text-slate-900 lg:hidden" (click)="toggleSidebar()">
             <lucide-icon [name]="icons.Menu" class="w-5 h-5"></lucide-icon>
          </button>"""

if search in content:
    content = content.replace(search, replace)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Search string not found")
