#!/bin/bash
awk '
  /<!-- System Modules \/ Apps -->/ && !found {
    print "          <!-- Revenue & Growth (Replacing Modules Grid) -->"
    print "          <div class=\"bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6\">"
    print "            <div class=\"flex items-center justify-between mb-6\">"
    print "              <div>"
    print "                <h2 class=\"text-sm font-bold text-slate-900 uppercase tracking-wider\">Revenue & Growth</h2>"
    print "                <p class=\"text-xs text-slate-500 font-medium mt-1\">Monthly recurring revenue (MRR)</p>"
    print "              </div>"
    print "              <div class=\"flex items-center gap-2\">"
    print "                <span class=\"flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md\">"
    print "                  <lucide-icon [name]=\"icons.TrendingUp\" class=\"w-3 h-3\"></lucide-icon> +14.2%"
    print "                </span>"
    print "              </div>"
    print "            </div>"
    print "            <div class=\"h-48 flex items-end justify-between gap-2\">"
    print "              <!-- CSS Bar Chart Mockup -->"
    print "              <div class=\"w-full bg-indigo-50 rounded-t-sm h-[30%] relative group hover:bg-indigo-100 transition-colors\"><div class=\"absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity\">$12k</div></div>"
    print "              <div class=\"w-full bg-indigo-50 rounded-t-sm h-[45%] relative group hover:bg-indigo-100 transition-colors\"><div class=\"absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity\">$18k</div></div>"
    print "              <div class=\"w-full bg-indigo-100 rounded-t-sm h-[40%] relative group hover:bg-indigo-200 transition-colors\"><div class=\"absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity\">$16k</div></div>"
    print "              <div class=\"w-full bg-indigo-100 rounded-t-sm h-[60%] relative group hover:bg-indigo-200 transition-colors\"><div class=\"absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity\">$24k</div></div>"
    print "              <div class=\"w-full bg-indigo-200 rounded-t-sm h-[55%] relative group hover:bg-indigo-300 transition-colors\"><div class=\"absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity\">$22k</div></div>"
    print "              <div class=\"w-full bg-indigo-300 rounded-t-sm h-[75%] relative group hover:bg-indigo-400 transition-colors\"><div class=\"absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity\">$30k</div></div>"
    print "              <div class=\"w-full bg-indigo-400 rounded-t-sm h-[85%] relative group hover:bg-indigo-500 transition-colors\"><div class=\"absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity\">$34k</div></div>"
    print "              <div class=\"w-full bg-indigo-600 rounded-t-sm h-[100%] relative shadow-[0_0_15px_rgba(79,70,229,0.3)]\"><div class=\"absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-100 transition-opacity\">$42k</div></div>"
    print "            </div>"
    print "            <div class=\"flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest\">"
    print "              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>"
    print "            </div>"
    print "          </div>"
    found = 1
    skip = 1
    next
  }
  /<!-- Recent Activity Table \/ List -->/ && skip {
    skip = 0
    print $0
    next
  }
  !skip { print $0 }
' frontend/src/app/dashboard/overview/overview.component.html > temp_overview.html

mv temp_overview.html frontend/src/app/dashboard/overview/overview.component.html
