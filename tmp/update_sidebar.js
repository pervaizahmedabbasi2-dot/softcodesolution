const fs = require('fs');
const file = 'frontend/src/app/dashboard/dashboard.component.html';
let content = fs.readFileSync(file, 'utf8');

const startStr = '<!-- Collapsible Dedicated Consoles Accordion -->';
const searchEnd = '<!-- Client Modules -->';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(searchEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `<!-- Collapsible Dedicated Consoles Accordion (All Businesses) -->
              <button (click)="toggleBusinessHubs()"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer group"
                      [class.bg-slate-100]="isBusinessHubsOpen || isAnyBusinessHubActive()"
                      [class.border-slate-200]="isBusinessHubsOpen || isAnyBusinessHubActive()"
                      [class.text-slate-900]="isBusinessHubsOpen || isAnyBusinessHubActive()"
                      [class.bg-slate-50/60]="!isBusinessHubsOpen && !isAnyBusinessHubActive()"
                      [class.border-slate-100]="!isBusinessHubsOpen && !isAnyBusinessHubActive()"
                      [class.text-slate-600]="!isBusinessHubsOpen && !isAnyBusinessHubActive()"
                      [class.hover:bg-slate-100]="!isBusinessHubsOpen && !isAnyBusinessHubActive()">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <span class="truncate">All Business Consoles</span>
                  <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                    {{ allBusinessesCatalog.length }} Live
                  </span>
                </div>
                <lucide-icon [name]="icons.ChevronDown" class="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 shrink-0"
                             [style.transform]="(isBusinessHubsOpen || isAnyBusinessHubActive()) ? 'rotate(180deg)' : ''"></lucide-icon>
              </button>

              <!-- Collapsible Body with ALL Businesses -->
              <div *ngIf="isBusinessHubsOpen || isAnyBusinessHubActive()" class="pl-1 space-y-1 pt-1 border-l-2 border-indigo-100 ml-3 animate-fade-in max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                <button *ngFor="let b of allBusinessesCatalog"
                        (click)="launchBusinessWithRole(b, 'owner')"
                        class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer"
                        [class.bg-indigo-600]="isBusinessActiveInSidebar(b)"
                        [class.text-white]="isBusinessActiveInSidebar(b)"
                        [class.shadow-md]="isBusinessActiveInSidebar(b)"
                        [class.shadow-indigo-200]="isBusinessActiveInSidebar(b)"
                        [class.hover:bg-slate-100]="!isBusinessActiveInSidebar(b)"
                        [class.text-slate-700]="!isBusinessActiveInSidebar(b)">
                  <div class="flex items-center gap-2.5 truncate">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        [class]="getSuperAdminSidebarIconClass(b.dedicatedHubView || b.id, isBusinessActiveInSidebar(b))">
                      <lucide-icon [name]="getBusinessIcon(b.icon)" class="w-3.5 h-3.5"></lucide-icon>
                    </div>
                    <span class="truncate">{{ b.name }}</span>
                  </div>
                  <span *ngIf="b.dedicatedHubView" class="text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0"
                        [class.bg-white/20]="isBusinessActiveInSidebar(b)"
                        [class.text-white]="isBusinessActiveInSidebar(b)"
                        [class.bg-emerald-100]="!isBusinessActiveInSidebar(b)"
                        [class.text-emerald-800]="!isBusinessActiveInSidebar(b)">HUB</span>
                </button>
              </div>
            </div>
          </div>

          `;
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  fs.writeFileSync(file, content);
  console.log('Successfully updated sidebar HTML!');
} else {
  console.error('Indices not found:', startIndex, endIndex);
}
