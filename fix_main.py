import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    lines = f.readlines()

# Replace the first `</div>` after `</footer>` with `</main>\n</div>`
for i, line in enumerate(lines):
    if '</footer>' in line:
        for j in range(i+1, len(lines)):
            if '</div>' in lines[j]:
                lines[j] = lines[j].replace('</div>', '</main>\n</div>', 1)
                break
        break

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.writelines(lines)
