import re

with open('frontend/src/styles.css', 'r') as f:
    content = f.read()

# Replace the previous overscroll rules
new_rules = """
/* Lock the main app frame so the top bar and sidebar don't bounce down */
html, body {
  overscroll-behavior: none !important; 
  height: 100%;
  overflow: hidden; /* Prevent body scrolling */
}

/* Force maximum native bounce ONLY on scrollable content areas */
.overflow-y-auto, .overflow-auto, .scrollable, main {
  overscroll-behavior-y: auto !important;
  -webkit-overflow-scrolling: touch !important;
  height: 100%; /* Ensure it has a bounded height to scroll within */
}
"""

if "overscroll-behavior: auto !important;" in content:
    # Remove the old block
    content = re.sub(r'/\* Force maximum native bounce.*\nhtml, body \{[\s\S]*?-webkit-overflow-scrolling: touch !important;\n\}', new_rules, content)
else:
    content += new_rules

with open('frontend/src/styles.css', 'w') as f:
    f.write(content)
