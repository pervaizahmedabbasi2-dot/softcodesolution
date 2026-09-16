import os
import re

file_path = 'frontend/src/app/landing-page/landing-page.component.ts'
with open(file_path, 'r') as f:
    content = f.read()

# I want to remove the implementations of ngOnInit and ngAfterViewInit completely
content = re.sub(r'  ngOnInit\(\) \{.*?\n  \}', '', content, flags=re.DOTALL)
content = re.sub(r'  ngAfterViewInit\(\) \{.*?\n  \}', '', content, flags=re.DOTALL)
content = re.sub(r'  private forceScrollToHero\(\) \{.*?\n  \}', '', content, flags=re.DOTALL)
content = re.sub(r'export class LandingPageComponent implements OnInit, AfterViewInit \{', 'export class LandingPageComponent {', content)

with open(file_path, 'w') as f:
    f.write(content)
