import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    content = f.read()

# Replace <lucide-icon [name]="icons.Menu" class="w-5 h-5"></lucide-icon> with <lucide-icon [name]="icons.Grip" class="w-5 h-5"></lucide-icon>
content = content.replace('<lucide-icon [name]="icons.Menu"', '<lucide-icon [name]="icons.Grip"')

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.write(content)

print("Done replacing.")
