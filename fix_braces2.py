with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    text = f.read()

text = text.replace("    {\n          {\n      id: 'global-edge',", "    {\n      id: 'global-edge',")

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(text)
