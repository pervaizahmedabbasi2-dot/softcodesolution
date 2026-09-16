import os
import re

file_path = 'frontend/src/index.html'
with open(file_path, 'r') as f:
    content = f.read()

# Remove the aggressive script tag
content = re.sub(r'<script>\s*if \(\'scrollRestoration\'.*?</script>\s*', '', content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
