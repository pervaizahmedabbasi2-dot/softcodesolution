import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    text = f.read()

# Fix duplicates in the imports block of Lucide
# For `import { ... } from "lucide-angular"`
import_match = re.search(r'import\s*\{\s*([^}]+)\s*\}\s*from\s*[\'"]lucide-angular[\'"];', text)
if import_match:
    imports = [i.strip() for i in import_match.group(1).split(',')]
    unique_imports = []
    for i in imports:
        if i and i not in unique_imports:
            unique_imports.append(i)
    new_import_str = f"import {{ {', '.join(unique_imports)} }} from 'lucide-angular';"
    text = text[:import_match.start()] + new_import_str + text[import_match.end():]

# Fix duplicated properties in the `imports: [...]` array
# Because it's hard to parse, let's just find `Bell,`, `CheckCircle2,`, `AlertTriangle,` 
# and keep only the first occurrence within the `imports:` array.

# Let's just remove the first 6 instances of duplicate Bell, CheckCircle2, AlertTriangle from the component metadata
for word in ['CheckCircle2', 'Bell', 'AlertTriangle']:
    # Replace the duplicate in the object literals (like icons: { ... })
    # We can just remove duplicates globally in the file by keeping the first N occurrences (import, usage)
    # Actually, the error says:
    # Duplicate identifier 'Bell' at 24:2, 73:2
    # Duplicate key "CheckCircle2" at 1035:4, 1004:4
    pass

# Safe way to fix:
lines = text.split('\n')
def remove_dup_lines(lines, match_str, keep_first=True):
    new_lines = []
    found = False
    for line in lines:
        if match_str in line and not line.startswith('import '):
            if found:
                continue
            found = True
        new_lines.append(line)
    return new_lines

text = "\n".join(remove_dup_lines(lines, "CheckCircle2,"))
lines = text.split('\n')
text = "\n".join(remove_dup_lines(lines, "Bell,"))
lines = text.split('\n')
text = "\n".join(remove_dup_lines(lines, "AlertTriangle,"))

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(text)

