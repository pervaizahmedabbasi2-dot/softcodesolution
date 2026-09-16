with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    lines = f.readlines()

# Replace the Grip on line 29 with X
for i, line in enumerate(lines):
    if "hidden md:flex" in line and "toggleSidebar()" in line:
        # The next line should be the lucide-icon Grip
        if "icons.Grip" in lines[i+1]:
            lines[i+1] = lines[i+1].replace("icons.Grip", "icons.X")
            break

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.writelines(lines)

print("Fixed desktop X icon.")
