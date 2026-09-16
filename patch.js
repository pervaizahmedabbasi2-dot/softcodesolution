const fs = require('fs');
const file = 'frontend/src/app/dashboard/dashboard.component.html';
let content = fs.readFileSync(file, 'utf8');
const search = `    <div class="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 bg-white z-[60]">
      <div class="flex items-center gap-3 min-w-0">
        <a href="/" class="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 group block">
          <img src="/logos/logo.png" alt="Logo" class="w-full h-full object-center object-contain p-1 group-hover:scale-110 transition-transform">
        </a>
        <a href="/" class="text-lg font-extrabold text-slate-900 tracking-tight truncate hover:opacity-80 transition-opacity">SoftCode<span class="text-indigo-600">Solution</span></a>
      </div>
      <button class="ml-auto lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors" (click)="toggleSidebar()">`;

const replace = `    <div class="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 bg-white z-[60] justify-between">
      <div class="flex items-center gap-2.5 min-w-0">
        <a href="/" class="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 group block">
          <img src="/logos/logo.png" alt="Logo" class="w-full h-full object-center object-contain p-1 group-hover:scale-110 transition-transform">
        </a>
        <span class="text-lg font-extrabold text-slate-900 tracking-tight truncate block">SoftCode<span class="text-indigo-600">Solution</span></span>
      </div>
      <button class="lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors flex-shrink-0" (click)="toggleSidebar()">`;

content = content.replace(search, replace);
fs.writeFileSync(file, content);
