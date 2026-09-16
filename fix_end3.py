with open('frontend/src/app/dashboard/dashboard.component.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re
text = re.sub(r'this\.clientPopupBusy = false;[\s]*clientPopupSecurityComingSoon', 'this.clientPopupBusy = false;\n    }\n  }\n\n  clientPopupSecurityComingSoon', text)

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w', encoding='utf-8') as f:
    f.write(text)
