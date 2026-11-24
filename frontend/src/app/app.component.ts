import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DomTranslatorService } from './services/dom-translator.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>

    @if (notification.toasts().length > 0) {
      <div class="fixed top-5 right-5 z-[100001] max-w-md w-[calc(100vw-2.5rem)] sm:w-full flex flex-col gap-2.5 pointer-events-none">
        @for (toast of notification.toasts(); track toast.id) {
          <div class="pointer-events-auto w-full p-4 rounded-2xl shadow-2xl backdrop-blur-2xl border flex items-start gap-3.5 animate-in slide-in-from-top-4 fade-in duration-300"
               [class]="toast.type === 'success'
                 ? 'bg-gradient-to-br from-white/95 via-emerald-50/80 to-slate-50/95 text-slate-900 border-emerald-200/90 ring-1 ring-emerald-400/20 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.22)]'
                 : (toast.type === 'warning' || toast.type === 'error'
                   ? 'bg-gradient-to-br from-white/95 via-amber-50/70 to-slate-50/95 text-slate-900 border-amber-200/90 ring-1 ring-amber-400/20 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.18)]'
                   : 'bg-gradient-to-br from-white/95 via-emerald-50/60 to-slate-50/95 text-slate-900 border-indigo-200/90 ring-1 ring-indigo-400/20 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.18)]')">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                 [class]="toast.type === 'success'
                   ? 'bg-emerald-100 text-emerald-700'
                   : (toast.type === 'warning' || toast.type === 'error'
                     ? 'bg-amber-100 text-amber-700'
                     : 'bg-indigo-100 text-indigo-700')">
              @if (toast.type === 'success') {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              } @else if (toast.type === 'warning' || toast.type === 'error') {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
              }
            </div>
            <div class="flex-1 min-w-0 pr-1">
              <p class="font-extrabold text-xs tracking-tight"
                 [class]="toast.type === 'success'
                   ? 'text-emerald-700'
                   : (toast.type === 'warning' || toast.type === 'error'
                     ? 'text-amber-700'
                     : 'text-indigo-700')">
                {{ toast.title }}
              </p>
              <p class="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium break-words">{{ toast.message }}</p>
            </div>
            <button type="button" (click)="notification.dismiss(toast.id)" class="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" title="Dismiss Notification">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        }
      </div>
    }
  `
})
export class AppComponent {
  readonly notification = inject(NotificationService);

  constructor() {
    inject(DomTranslatorService).init();
  }
}