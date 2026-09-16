import re

with open('frontend/src/app/dashboard/rbac/rbac.component.ts', 'r') as f:
    content = f.read()

# Replace role.permissions[module.code] with (role.permissions || {})[module.code]
content = re.sub(r'role\.permissions\[', r'(role.permissions || {})[', content)

# Replace current.permissions[moduleCode] with (current.permissions || {})[moduleCode]
content = re.sub(r'current\.permissions\[', r'(current.permissions || {})[', content)

# Replace nextPermissions with safe fallback in patchRole
content = re.sub(r'const nextPermissions = \{ \.\.\.current\.permissions \};', r'const nextPermissions = { ...(current.permissions || {}) };', content)

with open('frontend/src/app/dashboard/rbac/rbac.component.ts', 'w') as f:
    f.write(content)
print("Fixed rbac.component.ts")
