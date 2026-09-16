import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    content = f.read()

# Add imports
imports_to_add = """
import { SecurityComponent } from './security/security.component';
import { FeatureFlagsComponent } from './feature-flags/feature-flags.component';
import { ComplianceComponent } from './compliance/compliance.component';
import { WebhooksComponent } from './webhooks/webhooks.component';
"""

# Insert imports at the top
content = re.sub(
    r"(import \{ Component,.*\} from '@angular/core';)",
    r"\1\n" + imports_to_add,
    content
)

# Add to components array
content = re.sub(
    r"(imports: \[\n?)(.*)(CommonModule)",
    r"\1\n    SecurityComponent,\n    FeatureFlagsComponent,\n    ComplianceComponent,\n    WebhooksComponent,\n\2CommonModule",
    content
)

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(content)
