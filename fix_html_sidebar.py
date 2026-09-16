import re

with open('frontend/src/app/dashboard/dashboard.component.html', 'r') as f:
    content = f.read()

new_enterprise_items = """
           <!-- Security -->
           <button (click)="navigateTo('security')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" [class.bg-slate-100]="activeView === 'security'" [class.text-slate-900]="activeView === 'security'" [class.text-slate-600]="activeView !== 'security'" [class.hover:bg-[#FAFAFA]]="activeView !== 'security'" [class.hover:text-slate-900]="activeView !== 'security'">
             <lucide-icon name="ShieldCheck" class="w-4 h-4 flex-shrink-0" [class.text-indigo-600]="activeView === 'security'"></lucide-icon>
             <span>Security & NOC</span>
           </button>
           <!-- Feature Flags -->
           <button (click)="navigateTo('feature-flags')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" [class.bg-slate-100]="activeView === 'feature-flags'" [class.text-slate-900]="activeView === 'feature-flags'" [class.text-slate-600]="activeView !== 'feature-flags'" [class.hover:bg-[#FAFAFA]]="activeView !== 'feature-flags'" [class.hover:text-slate-900]="activeView !== 'feature-flags'">
             <lucide-icon name="Activity" class="w-4 h-4 flex-shrink-0" [class.text-indigo-600]="activeView === 'feature-flags'"></lucide-icon>
             <span>Feature Flags</span>
           </button>
           <!-- Compliance -->
           <button (click)="navigateTo('compliance')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" [class.bg-slate-100]="activeView === 'compliance'" [class.text-slate-900]="activeView === 'compliance'" [class.text-slate-600]="activeView !== 'compliance'" [class.hover:bg-[#FAFAFA]]="activeView !== 'compliance'" [class.hover:text-slate-900]="activeView !== 'compliance'">
             <lucide-icon name="Globe" class="w-4 h-4 flex-shrink-0" [class.text-indigo-600]="activeView === 'compliance'"></lucide-icon>
             <span>Compliance</span>
           </button>
           <!-- Webhooks -->
           <button (click)="navigateTo('webhooks')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" [class.bg-slate-100]="activeView === 'webhooks'" [class.text-slate-900]="activeView === 'webhooks'" [class.text-slate-600]="activeView !== 'webhooks'" [class.hover:bg-[#FAFAFA]]="activeView !== 'webhooks'" [class.hover:text-slate-900]="activeView !== 'webhooks'">
             <lucide-icon name="Network" class="w-4 h-4 flex-shrink-0" [class.text-indigo-600]="activeView === 'webhooks'"></lucide-icon>
             <span>Developer Hub</span>
           </button>
           
           <!-- Data Protection (Pre-existing full module) -->
           <button (click)="navigateTo('data-protection')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" [class.bg-slate-100]="activeView === 'data-protection'" [class.text-slate-900]="activeView === 'data-protection'" [class.text-slate-600]="activeView !== 'data-protection'" [class.hover:bg-[#FAFAFA]]="activeView !== 'data-protection'" [class.hover:text-slate-900]="activeView !== 'data-protection'">
             <lucide-icon name="Shield" class="w-4 h-4 flex-shrink-0" [class.text-indigo-600]="activeView === 'data-protection'"></lucide-icon>
             <span>Data Protection</span>
           </button>
           
           <!-- Backup Manager (Pre-existing full module) -->
           <button (click)="navigateTo('backup-manager')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" [class.bg-slate-100]="activeView === 'backup-manager'" [class.text-slate-900]="activeView === 'backup-manager'" [class.text-slate-600]="activeView !== 'backup-manager'" [class.hover:bg-[#FAFAFA]]="activeView !== 'backup-manager'" [class.hover:text-slate-900]="activeView !== 'backup-manager'">
             <lucide-icon name="Database" class="w-4 h-4 flex-shrink-0" [class.text-indigo-600]="activeView === 'backup-manager'"></lucide-icon>
             <span>Backup Manager</span>
           </button>
"""

# replace the block between "<!-- Security -->" and "</div>\n       </div>\n\n       <!-- Platform Modules for Super Admin -->"
# using regex

content = re.sub(
    r"<!-- Security -->.*?</div>\s*</div>\s*<!-- Platform Modules for Super Admin -->",
    new_enterprise_items + "\n         </div>\n       </div>\n\n       <!-- Platform Modules for Super Admin -->",
    content,
    flags=re.DOTALL
)

with open('frontend/src/app/dashboard/dashboard.component.html', 'w') as f:
    f.write(content)

