import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button *ngIf="isInstallable && !isInstalled" (click)="install()"
      class="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-all animate-fade-in mx-4">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Install App
    </button>

    <div *ngIf="isIOS && !isInstalled" class="relative group mx-4">
      <button (click)="showIOSGuide = true"
        class="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all animate-fade-in">
        Install App
      </button>

      <div *ngIf="showIOSGuide" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" (click)="showIOSGuide = false">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900">Install on iOS</h3>
            <button (click)="showIOSGuide = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div class="space-y-4">
            <p class="text-sm text-gray-600 flex items-center gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs">1</span>
              Tap the <strong>Share</strong> button in the Safari toolbar.
            </p>
            <p class="text-sm text-gray-600 flex items-center gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs">2</span>
              Scroll down and tap <strong>Add to Home Screen</strong>.
            </p>
          </div>
          <button (click)="showIOSGuide = false" class="mt-6 w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-800 hover:bg-gray-200 transition-colors">
            Got it
          </button>
        </div>
      </div>
    </div>
  `
})
export class PwaInstallComponent implements OnInit {
  deferredPrompt: BeforeInstallPromptEvent | null = null;
  isInstallable = false;
  isInstalled = false;
  isIOS = false;
  showIOSGuide = false;

  ngOnInit() {
    this.checkIfInstalled();
    this.checkIfIOS();
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e: Event) {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.deferredPrompt = e as BeforeInstallPromptEvent;
    // Update UI notify the user they can install the PWA
    this.isInstallable = true;
  }

  @HostListener('window:appinstalled')
  onappinstalled() {
    this.isInstallable = false;
    this.isInstalled = true;
    this.deferredPrompt = null;
    console.log('PWA was installed');
  }

  async install() {
    if (!this.deferredPrompt) {
      return;
    }
    // Show the install prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    this.isInstallable = false;
    
    if (outcome === 'accepted') {
      this.isInstalled = true;
    }
  }

  private checkIfInstalled() {
    // Check if the app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || 
       (window.navigator as any).standalone === true) {
      this.isInstalled = true;
    }
  }

  private checkIfIOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    this.isIOS = /iphone|ipad|ipod/.test(userAgent);
  }
}