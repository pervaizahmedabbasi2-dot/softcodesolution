with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    text = f.read()

count = 0
for line_no, line in enumerate(text.split('\n'), 1):
    count += line.count('{')
    count -= line.count('}')
    if line_no > 4100 and count != 1:
        print(f"Line {line_no}: Count = {count}")
print(f"Final Count = {count}")
