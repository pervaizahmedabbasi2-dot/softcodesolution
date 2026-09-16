#!/bin/bash

# We will replace lines 50 to 66 in frontend/src/app/dashboard/dashboard.component.html
awk '
  /userRole === .SUPER_ADMIN./ && !found {
    print "      <div *ngIf=\"userRole === '\''SUPER_ADMIN'\''\" class=\"pt-3 pb-24 space-y-0.5\">"
    print "        <p class=\"px-4 py-1.5 text-[9px] font-black text-white/30 uppercase tracking-widest\">Platform Modules</p>"
    print "        <button *ngFor=\"let mod of dashboardViewModel.quickActions.modules\""
    print "          (click)=\"navigateTo(mod.route || mod.code)\""
    print "          class=\"w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all\""
    print "          [class.bg-white/15]=\"activeView === (mod.route || mod.code)\" [class.font-black]=\"activeView === (mod.route || mod.code)\" [class.text-white]=\"activeView === (mod.route || mod.code)\""
    print "          [class.text-white/70]=\"activeView !== (mod.route || mod.code)\" [class.hover:bg-white/10]=\"activeView !== (mod.route || mod.code)\" [class.hover:text-white]=\"activeView !== (mod.route || mod.code)\">"
    print "          <lucide-icon [name]=\"moduleIcon(mod.icon)\" class=\"w-4 h-4 flex-shrink-0\""
    print "            [class.text-emerald-400]=\"mod.code === '\''all-tenants'\'' && activeView !== (mod.route || mod.code)\""
    print "            [class.text-purple-400]=\"mod.code === '\''analytics'\'' && activeView !== (mod.route || mod.code)\""
    print "            [class.text-slate-400]=\"mod.code !== '\''all-tenants'\'' && mod.code !== '\''analytics'\'' && activeView !== (mod.route || mod.code)\">"
    print "          </lucide-icon>"
    print "          <span>{{ mod.label }}</span>"
    print "          <span *ngIf=\"mod.code === '\''all-tenants'\'' && clientTotals.pending > 0\" class=\"ml-auto bg-amber-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full\">{{ clientTotals.pending }}</span>"
    print "        </button>"
    print "      </div>"
    found = 1
    skip = 1
    next
  }
  /<\/div>/ && skip {
    if (skip_count == 0) {
      skip_count = 1
      next
    }
  }
  /<\/nav>/ && skip {
    skip = 0
    print $0
    next
  }
  !skip { print $0 }
' frontend/src/app/dashboard/dashboard.component.html > temp_dashboard.html

mv temp_dashboard.html frontend/src/app/dashboard/dashboard.component.html
