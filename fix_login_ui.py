import re

with open('frontend/src/app/login/login.component.html', 'r') as f:
    content = f.read()

new_right_side = """    <!-- Right Side: Premium Branding Panel -->
    <div class="hidden lg:flex lg:w-1/2 bg-[#09090b] relative items-center justify-center p-12 overflow-hidden border-l border-white/5 shadow-[inset_20px_0_40px_rgba(0,0,0,0.5)]">
        
        <!-- Animated Background Orbs -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div class="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000" style="animation-delay: 1s;"></div>
            <div class="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000" style="animation-delay: 2s;"></div>
        </div>

        <div class="relative z-10 w-full max-w-2xl">
            <!-- Brand Info -->
            <div class="mb-12 animate-in slide-in-from-bottom-8 fade-in duration-1000">
                <h2 class="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                        </svg>
                    </div>
                    SOFT<span class="text-blue-500">CODE</span>
                </h2>
                <p class="text-zinc-400 text-lg font-medium mt-4 max-w-md">
                    Enterprise-grade SaaS infrastructure. Scale globally with our autonomous management platform.
                </p>
            </div>

            <!-- Abstract Dashboard Mockup (Animated) -->
            <div class="relative h-[380px] w-full perspective-[1000px] animate-in zoom-in-95 fade-in duration-1000 delay-300">
                <!-- Main Glass Card -->
                <div class="absolute inset-0 bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 transform rotate-[-2deg] hover:rotate-0 hover:scale-[1.02] transition-all duration-700">
                    <!-- Header inside card -->
                    <div class="flex items-center justify-between border-b border-white/5 pb-4">
                        <div class="flex flex-col gap-1.5">
                            <div class="h-2.5 w-24 bg-zinc-800 rounded-full"></div>
                            <div class="h-2 w-16 bg-zinc-800/60 rounded-full"></div>
                        </div>
                        <div class="flex gap-2">
                            <div class="h-7 w-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-blue-400"></div></div>
                            <div class="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div></div>
                        </div>
                    </div>
                    <!-- Body inside card -->
                    <div class="flex-1 grid grid-cols-2 gap-4">
                        <!-- Chart Mockup -->
                        <div class="bg-zinc-800/40 rounded-2xl p-5 flex flex-col justify-end relative overflow-hidden group">
                            <div class="absolute top-5 left-5 h-2 w-16 bg-zinc-700 rounded-full"></div>
                            <div class="h-24 w-full flex items-end gap-1.5">
                                <div class="w-full bg-blue-500/20 rounded-t-sm h-[30%] group-hover:h-[40%] transition-all duration-500"></div>
                                <div class="w-full bg-blue-500/40 rounded-t-sm h-[50%] group-hover:h-[60%] transition-all duration-500 delay-75"></div>
                                <div class="w-full bg-blue-500/60 rounded-t-sm h-[80%] group-hover:h-[70%] transition-all duration-500 delay-100"></div>
                                <div class="w-full bg-blue-500/80 rounded-t-sm h-[60%] group-hover:h-[90%] transition-all duration-500 delay-150"></div>
                                <div class="w-full bg-blue-500 rounded-t-sm h-[90%] group-hover:h-[100%] transition-all duration-500 delay-200 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                            </div>
                        </div>
                        <!-- List Mockup -->
                        <div class="bg-zinc-800/40 rounded-2xl p-5 flex flex-col gap-4">
                            <div class="h-2 w-20 bg-zinc-700 rounded-full mb-1"></div>
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center">
                                    <div class="w-4 h-4 rounded-full bg-indigo-400"></div>
                                </div>
                                <div class="flex-1 space-y-2.5"><div class="h-1.5 w-full bg-zinc-700 rounded-full"></div><div class="h-1.5 w-2/3 bg-zinc-700 rounded-full"></div></div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center">
                                    <div class="w-4 h-4 rounded-full bg-purple-400"></div>
                                </div>
                                <div class="flex-1 space-y-2.5"><div class="h-1.5 w-full bg-zinc-700 rounded-full"></div><div class="h-1.5 w-1/2 bg-zinc-700 rounded-full"></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Floating Element 1 (Uptime) -->
                <div class="absolute -right-8 top-16 bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/20 p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-[bounce_5s_infinite_ease-in-out]">
                    <div class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">System Health</div>
                        <div class="text-xl font-black text-white tracking-tight">99.99% Uptime</div>
                    </div>
                </div>

                <!-- Floating Element 2 (Live Users) -->
                <div class="absolute -left-10 bottom-12 bg-zinc-900/90 backdrop-blur-xl border border-blue-500/20 p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-[bounce_6s_infinite_ease-in-out_reverse]">
                    <div class="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Active Clusters</div>
                        <div class="text-xl font-black text-white tracking-tight">4,892 Nodes</div>
                    </div>
                </div>
            </div>

            <!-- Footer style in branding -->
            <div class="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
                <div class="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    © 2026 SOFTCODE SOLUTION
                </div>
                <div class="flex gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                </div>
            </div>
        </div>
    </div>
</div>"""

content = re.sub(
    r"<!-- Right Side: Premium Branding Panel -->.*</div>",
    new_right_side,
    content,
    flags=re.DOTALL
)

with open('frontend/src/app/login/login.component.html', 'w') as f:
    f.write(content)
