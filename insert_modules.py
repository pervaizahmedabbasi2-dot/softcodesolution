import re

with open('frontend/src/app/dashboard/overview/overview.component.html', 'r') as f:
    content = f.read()

# First, match everything between <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10"> and </div>\s*</div>\s*<!-- Revenue & Growth

pattern = re.compile(r'<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">.*?</div>\s*</div>\s*<!-- Revenue & Growth', re.DOTALL)

replacement = """<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 relative z-10">
                <!-- Clients -->
                <button (click)="navigateTo('all-tenants')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Users" class="w-4 h-4 text-indigo-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Clients</span>
                </button>
                
                <!-- Security & NOC -->
                <button (click)="navigateTo('security')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.ShieldCheck" class="w-4 h-4 text-emerald-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700 text-center">Security & NOC</span>
                </button>
                
                <!-- Access Control (RBAC) -->
                <button (click)="navigateTo('rbac')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Shield" class="w-4 h-4 text-blue-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Access Control</span>
                </button>
                
                <!-- API Gateway -->
                <button (click)="navigateTo('api-gate-list')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Network" class="w-4 h-4 text-cyan-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">API Gateway</span>
                </button>

                <!-- Feature Flags -->
                <button (click)="navigateTo('feature-flags')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Activity" class="w-4 h-4 text-rose-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Feature Flags</span>
                </button>

                <!-- Payments -->
                <button (click)="navigateTo('payments-sys-list')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.CreditCard" class="w-4 h-4 text-purple-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Payments</span>
                </button>

                <!-- Analytics -->
                <button (click)="navigateTo('analytics')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.BarChart3" class="w-4 h-4 text-orange-500"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Analytics</span>
                </button>
                
                <!-- Compliance -->
                <button (click)="navigateTo('compliance')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Globe" class="w-4 h-4 text-teal-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Compliance</span>
                </button>
                
                <!-- Developer Hub -->
                <button (click)="navigateTo('webhooks')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Package" class="w-4 h-4 text-slate-800"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Developer Hub</span>
                </button>
                
                <!-- Data Protection -->
                <button (click)="navigateTo('data-protection')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Lock" class="w-4 h-4 text-sky-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700 text-center">Data Protect</span>
                </button>
                
                <!-- Backup Manager -->
                <button (click)="navigateTo('backup-manager')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Database" class="w-4 h-4 text-amber-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Backups</span>
                </button>
                
                <!-- Global Edge -->
                <button (click)="navigateTo('global-edge')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Server" class="w-4 h-4 text-fuchsia-600"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Global Edge</span>
                </button>
                
                <!-- License -->
                <button (click)="navigateTo('license-list')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Key" class="w-4 h-4 text-yellow-500"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">License</span>
                </button>
                
                <!-- Settings -->
                <button (click)="navigateTo('settings-list')" class="flex flex-col items-center justify-center p-4 rounded-[16px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all group">
                   <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <lucide-icon [name]="icons.Settings" class="w-4 h-4 text-slate-500"></lucide-icon>
                   </div>
                   <span class="text-[11px] font-bold text-slate-700">Settings</span>
                </button>
                
             </div>
          </div>
          <!-- Revenue & Growth"""

new_content = pattern.sub(replacement, content, count=1)

with open('frontend/src/app/dashboard/overview/overview.component.html', 'w') as f:
    f.write(new_content)

print("Done replacing.")
