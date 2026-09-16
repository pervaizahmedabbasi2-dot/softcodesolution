import os

file_path = 'frontend/src/app/dashboard/dashboard.component.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Add Menu to the import from lucide-angular
if 'Menu,' not in content:
    content = content.replace("LucideAngularModule,", "LucideAngularModule, Menu,")

# Add Menu to dashboardIcons
if ' Menu,' not in content:
    content = content.replace("export const dashboardIcons = {", "export const dashboardIcons = {\n    Menu,")

with open(file_path, 'w') as f:
    f.write(content)
print("Added Menu icon")
