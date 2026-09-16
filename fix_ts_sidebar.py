import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    content = f.read()

# The original modules ended with "settings" before my additions. Let's find settings and everything after it up to the end of the array.
# Let's just use string replacement.

pattern = r"(code:\s*'settings',\s*label:\s*'Settings',\s*route:\s*'settings-list',\s*icon:\s*'Settings',\s*pinned:\s*true,\s*hidden:\s*false,\s*\},)(.*?)(      \],\s*\},\s*\};)"

def repl(m):
    return m.group(1) + "\n" + m.group(3)

content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(content)
