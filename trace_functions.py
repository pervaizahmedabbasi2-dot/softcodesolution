with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    text = f.read()

count = 0
for line_no, line in enumerate(text.split('\n'), 1):
    count += line.count('{')
    count -= line.count('}')
    if "loadCurrentUser()" in line or "clientPopupAccessAction(" in line:
        print(f"Line {line_no}: {line.strip()} (Depth: {count})")
