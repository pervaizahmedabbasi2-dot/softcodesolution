import sys
with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.strip() == '<div class="flex-1 overflow-y-auto bg-[#FAFAFA]/50">' and '<!-- SCS_DASHBOARD_OVERVIEW_HOST_V1 -->' in lines[i+1]:
        if i == 180: # It's line 181
            pass # skip it
        elif i == 184: # It's line 185
            new_lines.append(line.replace('bg-[#FAFAFA]/50"', 'bg-[#FAFAFA]/50 h-full"'))
        else:
            new_lines.append(line)
    else:
        if i in [180, 181, 182, 183]:
            pass
        else:
            new_lines.append(line)

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.writelines(new_lines)
