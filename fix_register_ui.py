import re

with open('frontend/src/app/register/register.component.html', 'r') as f:
    content = f.read()

new_right_side = """    <!-- Right Side: Premium Branding Panel -->
    <div class="hidden lg:flex lg:w-1/2 bg-[#09090b] relative items-center justify-center p-12 overflow-hidden border-l border-white/5 shadow-[inset_20px_0_40px_rgba(0,0,0,0.5)]">
        
        <!-- Animated Background Orbs -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div class="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000" style="animation-delay: 1s;"></div>
            <div class="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000" style="animation-delay: 2s;"></div>
        </div>

        <div class="relative z-10 w-full max-w-2xl">
            <!-- Brand Info -->
            <div class="mb-12 animate-in slide-in-from-bottom-8 fade-in duration-1000">
                <h2 class="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                        </svg>
                    </div>
                    SOFT<span class="text-emerald-500">CODE</span>
                </h2>
                <p class="text-zinc-400 text-lg font-medium mt-4 max-w-md">
                    Join thousands of organizations building resilient, scalable systems on our global infrastructure.
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
                            <div class="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-emerald-400"></div></div>
                            <div class="h-7 w-7 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div></div>
                        </div>
                    </div>
                    <!-- Body inside card -->
                    <div class="flex-1 grid grid-cols-2 gap-4">
                        <!-- Chart Mockup -->
                        <div class="bg-zinc-800/40 rounded-2xl p-5 flex flex-col justify-end relative overflow-hidden group">
                            <div class="absolute top-5 left-5 h-2 w-16 bg-zinc-700 rounded-full"></div>
                            <div class="h-24 w-full flex items-end gap-1.5">
                                <div class="w-full bg-emerald-500/20 rounded-t-sm h-[40%] group-hover:h-[50%] transition-all duration-500"></div>
                                <div class="w-full bg-emerald-500/40 rounded-t-sm h-[60%] group-hover:h-[70%] transition-all duration-500 delay-75"></div>
                                <div class="w-full bg-emerald-500/60 rounded-t-sm h-[70%] group-hover:h-[80%] transition-all duration-500 delay-100"></div>
                                <div class="w-full bg-emerald-500/80 rounded-t-sm h-[90%] group-hover:h-[95%] transition-all duration-500 delay-150"></div>
                                <div class="w-full bg-emerald-500 rounded-t-sm h-[100%] group-hover:h-[100%] transition-all duration-500 delay-200 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                            </div>
                        </div>
                        <!-- List Mockup -->
                        <div class="bg-zinc-800/40 rounded-2xl p-5 flex flex-col gap-4">
                            <div class="h-2 w-20 bg-zinc-700 rounded-full mb-1"></div>
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-cyan-500/20 flex-shrink-0 flex items-center justify-center">
                                    <div class="w-4 h-4 rounded-full bg-cyan-400"></div>
                                </div>
                                <div class="flex-1 space-y-2.5"><div class="h-1.5 w-full bg-zinc-700 rounded-full"></div><div class="h-1.5 w-2/3 bg-zinc-700 rounded-full"></div></div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center">
                                    <div class="w-4 h-4 rounded-full bg-blue-400"></div>
                                </div>
                                <div class="flex-1 space-y-2.5"><div class="h-1.5 w-full bg-zinc-700 rounded-full"></div><div class="h-1.5 w-1/2 bg-zinc-700 rounded-full"></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Floating Element 1 (Users) -->
                <div class="absolute -right-8 top-16 bg-zinc-900/90 backdrop-blur-xl border border-teal-500/20 p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-[bounce_5s_infinite_ease-in-out]">
                    <div class="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Global Accounts</div>
                        <div class="text-xl font-black text-white tracking-tight">150,000+</div>
                    </div>
                </div>

                <!-- Floating Element 2 (Performance) -->
                <div class="absolute -left-10 bottom-12 bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/20 p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-[bounce_6s_infinite_ease-in-out_reverse]">
                    <div class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Data Processing</div>
                        <div class="text-xl font-black text-white tracking-tight">Real-time</div>
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
                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                </div>
            </div>
        </div>
    </div>
"""

# Try to find the section and replace it. Register has a <div *ngIf="showSuccessAlert"... after the right panel, so we need to be careful with regex.
# We'll use split.
split_str = "<!-- Right Side: Premium Branding Panel -->"
parts = content.split(split_str)
if len(parts) > 1:
    left = parts[0]
    right_and_rest = parts[1]
    
    # We need to find where the right panel ends. It ends just before `<div *ngIf="showSuccessAlert"` or `<app-legal`
    end_split = '<div *ngIf="showSuccessAlert"'
    if end_split in right_and_rest:
        right_parts = right_and_rest.split(end_split)
        new_content = left + new_right_side + "\n    " + end_split + right_parts[1]
    else:
        # Fallback if showSuccessAlert is not there
        end_split2 = '<app-legal'
        right_parts2 = right_and_rest.split(end_split2)
        new_content = left + new_right_side + "\n    " + end_split2 + right_parts2[1]
        
    with open('frontend/src/app/register/register.component.html', 'w') as f:
        f.write(new_content)
else:
    print("Could not find Premium Branding Panel comment")
