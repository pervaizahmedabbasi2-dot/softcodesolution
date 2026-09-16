import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
in_time_format = False
for line in lines:
    if 'hour12: true' in line:
        new_lines.append(line)
        continue
    
    if "second: '2-digit'" in line:
        if new_lines[-1].strip() == "second: '2-digit',":
            continue # duplicate
    new_lines.append(line)

# Let's just remove ALL "second: '2-digit'" and add them back right after hour12: true
content = "".join(lines)
content = re.sub(r"\s*second:\s*'2-digit',?", "", content)
content = content.replace("hour12: true,", "hour12: true,\n      second: '2-digit',")

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(content)
