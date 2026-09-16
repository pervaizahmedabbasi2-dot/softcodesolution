import os

file_path = 'frontend/src/app/dashboard/dashboard.component.ts'
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
in_imports = False
for line in lines:
    if 'imports: [' in line:
        in_imports = True
    
    if in_imports and 'Menu,' in line:
        line = line.replace('Menu,', '')
    
    if in_imports and ']' in line:
        in_imports = False
        
    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)
