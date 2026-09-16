import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    content = f.read()

# Replace multiple second: '2-digit', with just one
content = re.sub(r"(second:\s*'2-digit',\s*)+", "second: '2-digit',\n", content)

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(content)
