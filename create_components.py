import os

components = [
    {
        "dir": "security",
        "name": "SecurityComponent",
        "selector": "app-dashboard-security",
        "html": """
<div class="p-6 md:p-8 space-y-8 animate-fade-in pb-24">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-slate-900">Security & NOC</h2>
      <p class="text-sm text-slate-500 mt-1">Real-time threat intelligence and global network operations center.</p>
    </div>
    <div class="flex items-center gap-3">
      <button class="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-all">
        Export Audit
      </button>
      <button class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white shadow-sm rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
        <lucide-icon name="ShieldAlert" class="w-4 h-4"></lucide-icon>
        Lockdown Mode
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-700">Active Threats Blocked</h3>
        <span class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <lucide-icon name="ShieldCheck" class="w-5 h-5"></lucide-icon>
        </span>
      </div>
      <p class="text-3xl font-black text-slate-900">14,293</p>
      <p class="text-xs text-emerald-600 font-medium mt-1">↓ 12% from last hour (Auto-mitigated)</p>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-700">WAF Rules Triggered</h3>
        <span class="p-2 bg-amber-50 rounded-lg text-amber-600">
          <lucide-icon name="AlertTriangle" class="w-5 h-5"></lucide-icon>
        </span>
      </div>
      <p class="text-3xl font-black text-slate-900">892</p>
      <p class="text-xs text-amber-600 font-medium mt-1">Action Required on 3 IPs</p>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-700">Global DDoS Status</h3>
        <span class="p-2 bg-slate-50 rounded-lg text-slate-600">
          <lucide-icon name="Activity" class="w-5 h-5"></lucide-icon>
        </span>
      </div>
      <p class="text-xl font-bold text-slate-900">Normal</p>
      <p class="text-xs text-slate-500 mt-1">Traffic across 14 regions</p>
    </div>
  </div>

  <div class="bg-slate-900 rounded-xl border border-slate-800 p-6 overflow-hidden relative shadow-lg">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-white font-bold">Live Traffic Matrix (NOC)</h3>
      <span class="flex items-center gap-2 text-xs text-emerald-400">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Live Monitoring
      </span>
    </div>
    <div class="h-64 w-full bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-center justify-center relative overflow-hidden">
        <!-- Mock Map Visual -->
        <div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9IiNmZmYiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] [background-size:20px_20px]"></div>
        <p class="text-slate-400 font-medium z-10 font-mono text-sm">[ Map Visualization Offline in Preview ]</p>
    </div>
  </div>
</div>
"""
    },
    {
        "dir": "feature-flags",
        "name": "FeatureFlagsComponent",
        "selector": "app-dashboard-feature-flags",
        "html": """
<div class="p-6 md:p-8 space-y-8 animate-fade-in pb-24">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-slate-900">Feature Flags & Rollout</h2>
      <p class="text-sm text-slate-500 mt-1">Manage gradual feature releases, A/B testing, and canary deployments.</p>
    </div>
    <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg text-sm font-semibold transition-all">
      Create Flag
    </button>
  </div>

  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
    <div class="p-4 border-b border-slate-100 flex items-center gap-4 bg-[#FAFAFA]/50">
        <div class="relative flex-1 max-w-sm">
            <lucide-icon name="Search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></lucide-icon>
            <input type="text" placeholder="Search feature flags..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
        </div>
    </div>
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200">
          <th class="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Feature Key</th>
          <th class="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
          <th class="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rollout %</th>
          <th class="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Environment</th>
          <th class="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr class="hover:bg-slate-50/50 transition-colors">
          <td class="py-4 px-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <lucide-icon name="Sparkles" class="w-4 h-4"></lucide-icon>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900">AI Auto-Tagging</p>
                <p class="text-xs text-slate-500">feature.ai.auto_tagging</p>
              </div>
            </div>
          </td>
          <td class="py-4 px-4">
             <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Enabled
              </span>
          </td>
          <td class="py-4 px-4">
            <div class="flex items-center gap-3">
                <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 w-[25%]"></div>
                </div>
                <span class="text-xs font-bold text-slate-700">25%</span>
            </div>
          </td>
          <td class="py-4 px-4">
            <span class="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">Production</span>
          </td>
          <td class="py-4 px-4 text-right">
            <button class="p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-100">
              <lucide-icon name="MoreHorizontal" class="w-4 h-4"></lucide-icon>
            </button>
          </td>
        </tr>
        <tr class="hover:bg-slate-50/50 transition-colors">
          <td class="py-4 px-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <lucide-icon name="CreditCard" class="w-4 h-4"></lucide-icon>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900">Stripe v2 Integration</p>
                <p class="text-xs text-slate-500">payment.stripe_v2</p>
              </div>
            </div>
          </td>
          <td class="py-4 px-4">
             <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Disabled
              </span>
          </td>
          <td class="py-4 px-4">
            <div class="flex items-center gap-3">
                <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-slate-300 w-[0%]"></div>
                </div>
                <span class="text-xs font-bold text-slate-500">0%</span>
            </div>
          </td>
          <td class="py-4 px-4">
            <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">Staging</span>
          </td>
          <td class="py-4 px-4 text-right">
            <button class="p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-100">
              <lucide-icon name="MoreHorizontal" class="w-4 h-4"></lucide-icon>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
"""
    },
    {
        "dir": "compliance",
        "name": "ComplianceComponent",
        "selector": "app-dashboard-compliance",
        "html": """
<div class="p-6 md:p-8 space-y-8 animate-fade-in pb-24">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-slate-900">Compliance & Data Residency</h2>
      <p class="text-sm text-slate-500 mt-1">Manage GDPR, SOC2 compliance, and regional data storage rules.</p>
    </div>
    <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg text-sm font-semibold transition-all">
      Generate Report
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <lucide-icon name="Globe" class="w-5 h-5"></lucide-icon>
        </div>
        <h3 class="font-bold text-slate-900">Data Residency Regions</h3>
      </div>
      <div class="space-y-4">
        <div class="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-[#FAFAFA]">
          <div class="flex items-center gap-3">
             <span class="text-xl">🇪🇺</span>
             <div>
                <p class="text-sm font-bold text-slate-900">EU-Central (Frankfurt)</p>
                <p class="text-xs text-slate-500">GDPR Compliant • 4,291 Tenants</p>
             </div>
          </div>
          <span class="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">Active</span>
        </div>
        <div class="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-[#FAFAFA]">
          <div class="flex items-center gap-3">
             <span class="text-xl">🇺🇸</span>
             <div>
                <p class="text-sm font-bold text-slate-900">US-East (N. Virginia)</p>
                <p class="text-xs text-slate-500">SOC2 Compliant • 9,102 Tenants</p>
             </div>
          </div>
          <span class="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">Active</span>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <lucide-icon name="FileCheck" class="w-5 h-5"></lucide-icon>
        </div>
        <h3 class="font-bold text-slate-900">Compliance Frameworks</h3>
      </div>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
           <div class="flex items-center gap-2">
             <lucide-icon name="CheckCircle2" class="w-4 h-4 text-emerald-500"></lucide-icon>
             <span class="text-sm font-medium text-slate-700">SOC 2 Type II</span>
           </div>
           <span class="text-xs text-slate-400">Valid until Dec 2026</span>
        </div>
        <div class="flex items-center justify-between">
           <div class="flex items-center gap-2">
             <lucide-icon name="CheckCircle2" class="w-4 h-4 text-emerald-500"></lucide-icon>
             <span class="text-sm font-medium text-slate-700">GDPR Privacy Shield</span>
           </div>
           <span class="text-xs text-slate-400">Verified</span>
        </div>
        <div class="flex items-center justify-between">
           <div class="flex items-center gap-2">
             <lucide-icon name="CheckCircle2" class="w-4 h-4 text-emerald-500"></lucide-icon>
             <span class="text-sm font-medium text-slate-700">HIPAA Readiness</span>
           </div>
           <span class="text-xs text-slate-400">Verified</span>
        </div>
      </div>
    </div>
  </div>
</div>
"""
    },
    {
        "dir": "webhooks",
        "name": "WebhooksComponent",
        "selector": "app-dashboard-webhooks",
        "html": """
<div class="p-6 md:p-8 space-y-8 animate-fade-in pb-24">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-slate-900">Developer Hub & Webhooks</h2>
      <p class="text-sm text-slate-500 mt-1">Manage API integrations, outgoing webhooks, and events.</p>
    </div>
    <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
      <lucide-icon name="Plus" class="w-4 h-4"></lucide-icon>
      New Endpoint
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 space-y-4">
       <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
               <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
               <h3 class="font-bold text-slate-900">Salesforce Sync</h3>
            </div>
            <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">POST</span>
          </div>
          <p class="text-xs text-slate-500 font-mono mb-4 break-all">https://api.salesforce.com/services/data/v60.0/sobjects/Account</p>
          <div class="flex items-center gap-4 text-xs font-medium">
             <span class="text-slate-500"><span class="text-slate-900 font-bold">14.2k</span> calls/day</span>
             <span class="text-slate-500"><span class="text-emerald-600 font-bold">99.9%</span> success</span>
          </div>
       </div>

       <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
               <span class="w-2 h-2 rounded-full bg-rose-500"></span>
               <h3 class="font-bold text-slate-900">Legacy ERP Notification</h3>
            </div>
            <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">POST</span>
          </div>
          <p class="text-xs text-slate-500 font-mono mb-4 break-all">https://erp.internal.acme.corp/webhooks/billing_update</p>
          <div class="flex items-center gap-4 text-xs font-medium">
             <span class="text-slate-500"><span class="text-slate-900 font-bold">840</span> calls/day</span>
             <span class="text-slate-500"><span class="text-rose-600 font-bold">82.1%</span> success (Failing)</span>
          </div>
       </div>
    </div>

    <div class="bg-slate-50 border border-slate-200 rounded-xl p-6">
       <h3 class="font-bold text-slate-900 mb-4">Event Topics</h3>
       <div class="space-y-3">
          <label class="flex items-center gap-3">
             <input type="checkbox" checked class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600">
             <span class="text-sm font-medium text-slate-700">tenant.created</span>
          </label>
          <label class="flex items-center gap-3">
             <input type="checkbox" checked class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600">
             <span class="text-sm font-medium text-slate-700">subscription.updated</span>
          </label>
          <label class="flex items-center gap-3">
             <input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600">
             <span class="text-sm font-medium text-slate-700">user.login_failed</span>
          </label>
          <label class="flex items-center gap-3">
             <input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600">
             <span class="text-sm font-medium text-slate-700">payment.failed</span>
          </label>
       </div>
    </div>
  </div>
</div>
"""
    }
]

for c in components:
    os.makedirs(f"frontend/src/app/dashboard/{c['dir']}", exist_ok=True)
    
    with open(f"frontend/src/app/dashboard/{c['dir']}/{c['dir']}.component.html", "w") as f:
        f.write(c['html'])
        
    ts = f"""import {{ Component }} from '@angular/core';
import {{ CommonModule }} from '@angular/common';
import {{ LucideAngularModule }} from 'lucide-angular';

@Component({{
  selector: '{c['selector']}',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './{c['dir']}.component.html'
}})
export class {c['name']} {{
}}
"""
    with open(f"frontend/src/app/dashboard/{c['dir']}/{c['dir']}.component.ts", "w") as f:
        f.write(ts)

print("Created 4 new enterprise components!")
