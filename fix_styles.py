import re

with open('frontend/src/styles.css', 'r') as f:
    content = f.read()

# Remove the bad CSS entirely
bad_css = [
    r'/\* Lock the main app frame so the top bar and sidebar don\'t bounce down \*/[\s\S]*?overflow: hidden; /\* Prevent body scrolling \*/\n\}',
    r'/\* Force maximum native bounce ONLY on scrollable content areas \*/[\s\S]*?height: 100%; /\* Ensure it has a bounded height to scroll within \*/\n\}',
    r'/\* Lock the main app frame.*\nhtml, body \{[\s\S]*?-webkit-overflow-scrolling: touch !important;\n\}',
    r'height: 100%;\s*overflow: hidden; /\* Prevent body scrolling \*/'
]

for pattern in bad_css:
    content = re.sub(pattern, '', content)

with open('frontend/src/styles.css', 'w') as f:
    f.write(content)
