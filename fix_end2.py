import re
with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    text = f.read()

pattern = r"    \} finally \{\n      this\.clientPopupBusy = false;\n    clientPopupSecurityComingSoon\(action: string\): void \{"
replacement = """    } finally {
      this.clientPopupBusy = false;
    }
  }

  clientPopupSecurityComingSoon(action: string): void {"""

text = re.sub(pattern, replacement, text)

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(text)
