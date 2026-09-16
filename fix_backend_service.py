import re

with open('frontend/src/app/services/backend.service.ts', 'r') as f:
    content = f.read()

# Replace await response.json() with await response.json().catch(() => null) where not already done
content = re.sub(r'await (\w+)\.json\(\)(?!\.catch)', r'await \1.json().catch(() => null)', content)

with open('frontend/src/app/services/backend.service.ts', 'w') as f:
    f.write(content)
