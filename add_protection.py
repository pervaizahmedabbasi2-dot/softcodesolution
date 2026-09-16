import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    content = f.read()

new_modules = """
        { code: 'data-protection', label: 'Data Protection', route: 'data-protection', icon: 'Shield', pinned: true, hidden: false },
        { code: 'backup-manager', label: 'Backup Manager', route: 'backup-manager', icon: 'Database', pinned: true, hidden: false },
"""

content = re.sub(
    r"(icon:\s*'Settings',\s*pinned:\s*true,\s*hidden:\s*false,\s*},)",
    r"\1\n" + new_modules,
    content
)

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(content)
