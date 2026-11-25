import { Injectable, computed, signal } from '@angular/core';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private readonly deferredPromptSignal = signal<BeforeInstallPromptEvent | null>(null);
  private readonly installedSignal = signal<boolean>(false);
  private readonly onlineSignal = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine !== false : true);
  private readonly dismissedSignal = signal<boolean>(false);
  readonly iosDevice = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  readonly insideIframe = (() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  })();

  readonly isInstallable = computed(() => Boolean(this.deferredPromptSignal()));
  readonly isInstalled = this.installedSignal.asReadonly();
  readonly isOnline = this.onlineSignal.asReadonly();
  readonly isDismissed = this.dismissedSignal.asReadonly();

  constructor() {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    this.installedSignal.set(standalone);

    try {
      if (sessionStorage.getItem('scs_pwa_banner_dismissed') === '1') {
        this.dismissedSignal.set(true);
      }
    } catch {}

    const earlyPrompt = (window as unknown as { __scsDeferredInstallPrompt?: BeforeInstallPromptEvent | null })
      .__scsDeferredInstallPrompt;
    if (earlyPrompt) {
      this.deferredPromptSignal.set(earlyPrompt);
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      const bip = e as BeforeInstallPromptEvent;
      (window as unknown as { __scsDeferredInstallPrompt?: BeforeInstallPromptEvent | null }).__scsDeferredInstallPrompt = bip;
      this.deferredPromptSignal.set(bip);
    });

    window.addEventListener('appinstalled', () => {
      this.installedSignal.set(true);
      this.deferredPromptSignal.set(null);
      (window as unknown as { __scsDeferredInstallPrompt?: BeforeInstallPromptEvent | null }).__scsDeferredInstallPrompt = null;
    });

    window.addEventListener('online', () => this.onlineSignal.set(true));
    window.addEventListener('offline', () => this.onlineSignal.set(false));
  }

  async install(): Promise<boolean> {
    const promptEvent = this.deferredPromptSignal();
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      this.installedSignal.set(true);
      this.deferredPromptSignal.set(null);
      (window as unknown as { __scsDeferredInstallPrompt?: BeforeInstallPromptEvent | null }).__scsDeferredInstallPrompt = null;
      return true;
    }
    return false;
  }

  dismissBanner(): void {
    this.dismissedSignal.set(true);
    try {
      sessionStorage.setItem('scs_pwa_banner_dismissed', '1');
    } catch {}
  }
}
