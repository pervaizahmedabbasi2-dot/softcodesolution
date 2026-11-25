import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-pwa-install',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (!pwa.isOnline()) {
      <div
        class="fixed bottom-4 left-4 z-[99990] flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg"
        role="status"
        aria-live="polite">
        <mat-icon class="!text-base !w-4 !h-4 leading-none">wifi_off</mat-icon>
        <span>Offline Mode — Cached app ready</span>
      </div>
    }

    @if (!pwa.isInstalled() && !pwa.isDismissed() && (pwa.isInstallable() || (pwa.iosDevice && !pwa.insideIframe))) {
      <div class="fixed bottom-4 right-4 z-[99990] flex items-center gap-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 p-1.5 shadow-lg">
        @if (pwa.isInstallable()) {
          <button
            type="button"
            (click)="handleInstallClick()"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-colors">
            <mat-icon class="!text-base !w-4 !h-4 leading-none">download</mat-icon>
            <span>Install App</span>
          </button>
        } @else if (pwa.iosDevice) {
          <button
            type="button"
            (click)="showIosGuide.set(true)"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-colors">
            <mat-icon class="!text-base !w-4 !h-4 leading-none">install_mobile</mat-icon>
            <span>Install App</span>
          </button>
        }
        <button
          type="button"
          (click)="pwa.dismissBanner()"
          aria-label="Dismiss install prompt"
          class="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors">
          <mat-icon class="!text-base !w-4 !h-4 leading-none">close</mat-icon>
        </button>
      </div>
    }

    @if (showIosGuide()) {
      <div class="fixed inset-0 z-[100005] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
        <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-200 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-black text-slate-900">Install on iPhone / iPad</h3>
            <button
              type="button"
              (click)="showIosGuide.set(false)"
              aria-label="Close guide"
              class="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
              <mat-icon class="!text-lg !w-4.5 !h-4.5 leading-none">close</mat-icon>
            </button>
          </div>
          <ol class="text-xs text-slate-600 space-y-2 leading-relaxed list-decimal list-inside">
            <li>Tap the <strong>Share</strong> button in the Safari toolbar.</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
            <li>Open the installed app icon for full-screen biometric access.</li>
          </ol>
          <button
            type="button"
            (click)="showIosGuide.set(false)"
            class="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-2 text-xs font-bold text-white cursor-pointer transition-colors">
            Got It
          </button>
        </div>
      </div>
    }
  `
})
export class PwaInstallComponent {
  readonly pwa = inject(PwaInstallService);
  readonly showIosGuide = signal<boolean>(false);

  async handleInstallClick(): Promise<void> {
    await this.pwa.install();
  }
}
