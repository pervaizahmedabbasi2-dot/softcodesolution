import re

with open('frontend/src/app/dashboard/services/dashboard-api.service.ts', 'r') as f:
    content = f.read()

# Replace Array.isArray(result?.tenants) with a safe check
pattern_tenants = r"if \(Array\.isArray\(result\?\.tenants\)\) \{\s*return result\.tenants;\s*\}"
safe_tenants = """if (result && typeof result === 'object' && Array.isArray(result.tenants)) {
      return result.tenants;
    }"""
content = re.sub(pattern_tenants, safe_tenants, content)

# Replace Array.isArray(result?.items) with a safe check
pattern_items = r"if \(Array\.isArray\(result\?\.items\)\) \{\s*return result\.items;\s*\}"
safe_items = """if (result && typeof result === 'object' && Array.isArray(result.items)) {
      return result.items;
    }"""
content = re.sub(pattern_items, safe_items, content)

# Also fix the backups one just in case
pattern_backups = r"Array\.isArray\(t\?\.items\) \? t\.items : Array\.isArray\(t\?\.backups\) \? t\.backups : \[\]"
safe_backups = """(t && Array.isArray(t.items)) ? t.items : (t && Array.isArray(t.backups)) ? t.backups : []"""
content = content.replace("Array.isArray(t?.items)?t.items:Array.isArray(t?.backups)?t.backups:[]", safe_backups)


with open('frontend/src/app/dashboard/services/dashboard-api.service.ts', 'w') as f:
    f.write(content)
print("Fixed dashboard-api.service.ts")
