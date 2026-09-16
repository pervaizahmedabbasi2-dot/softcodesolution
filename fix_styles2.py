import re

with open('frontend/src/styles.css', 'r') as f:
    content = f.read()

# Remove my previous bad rules
content = re.sub(r'/\* Enable native rubber-band bounce.*?html, body \{\s*overscroll-behavior-y: none !important;\s*\}', '', content, flags=re.DOTALL)
content = re.sub(r'html, body \{\s*overscroll-behavior-y: none !important;\s*\}', '', content)

new_rules = """
/* Enable native rubber-band bounce on iOS/Safari for scrollable areas */
html, body {
  /* Allow natural bounce on landing, login, register */
  overscroll-behavior-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* For inner scroll containers (like Dashboard), allow bounce but prevent it from chaining to body */
.overflow-y-auto, .overflow-auto, .sidebar-scroll, .scrollable {
  -webkit-overflow-scrolling: touch !important;
  overscroll-behavior-y: contain !important; /* Bounce allowed, but don't pull the whole page */
}
"""

with open('frontend/src/styles.css', 'w') as f:
    f.write(content + new_rules)
