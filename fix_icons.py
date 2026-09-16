import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    content = f.read()

# Replace ShieldAlert with ShieldCheck
content = content.replace("icon: 'ShieldAlert'", "icon: 'ShieldCheck'")

# Replace Flag with Bookmark or layers or activity. Let's see what's there. Activity is there.
content = content.replace("icon: 'Flag'", "icon: 'Activity'")

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(content)
