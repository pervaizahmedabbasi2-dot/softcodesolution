import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Globe, ChevronDown, Check, Search, X, RefreshCw, TrendingUp } from 'lucide-angular';
import { LocalizationService, CountryInfo, LanguageInfo } from '../../services/localization.service';

@Component({
  selector: 'app-currency-language-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="relative inline-block text-left" #container>
      <!-- Plain Header Trigger: Only Flag Sticker & Dropdown Sign (Zero button-like box/borders, pure white header match) -->
      <button
        type="button"
        (click)="toggleDropdown()"
        class="inline-flex items-center gap-1 sm:gap-1.5 p-1 bg-transparent hover:bg-transparent border-0 outline-none focus:outline-none cursor-pointer select-none"
        title="Change Country, Currency or Language"
      >
        <!-- Flag Sticker -->
        <span class="inline-flex items-center text-xl sm:text-2xl leading-none select-none transition-transform duration-150 hover:scale-105">
          <img
            [src]="getFlagUrl(loc.currentCountry().code)"
            [alt]="loc.currentCountry().name"
            class="w-6 h-4 sm:w-6.5 sm:h-4.5 object-cover inline-block"
            loading="eager"
            referrerpolicy="no-referrer"
            (error)="onFlagImgError($event)"
          />
          <span class="hidden fallback-flag text-xl sm:text-2xl leading-none select-none">
            {{ loc.currentCountry().flag }}
          </span>
        </span>

        <!-- Dropdown Sign -->
        <lucide-icon
          [name]="icons.ChevronDown"
          class="w-3.5 h-3.5 text-slate-500 transition-transform duration-200"
          [class.rotate-180]="isOpen()"
        ></lucide-icon>
      </button>

      <!-- Dropdown Popover / Modal (Hidden until clicked) -->
      <div
        *ngIf="isOpen()"
        class="fixed sm:absolute inset-x-3 sm:inset-x-auto top-20 sm:top-full sm:right-0 sm:mt-2 w-auto sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] z-[1000] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Header with Tabs & Close -->
        <div class="p-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/70">
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <lucide-icon [name]="icons.Globe" class="w-3.5 h-3.5"></lucide-icon>
              </div>
              <div>
                <h4 class="text-xs font-black text-slate-900 tracking-tight leading-tight">
                  Country & Currency / Language
                </h4>
                <p class="text-[10px] font-medium text-slate-500">
                  Select your country to update all prices & text
                </p>
              </div>
            </div>

            <button
              (click)="closeDropdown()"
              class="w-6 h-6 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <lucide-icon [name]="icons.X" class="w-3.5 h-3.5"></lucide-icon>
            </button>
          </div>

          <!-- Navigation Tabs (Only 2 tabs: Currency & Language - Calculator removed) -->
          <div class="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              (click)="activeTab.set('currency')"
              class="py-1.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              [class.bg-white]="activeTab() === 'currency'"
              [class.text-indigo-950]="activeTab() === 'currency'"
              [class.shadow-2xs]="activeTab() === 'currency'"
              [class.text-slate-600]="activeTab() !== 'currency'"
            >
              <span class="text-xs">🌍</span>
              <span class="truncate">Currency & Country</span>
            </button>
            <button
              type="button"
              (click)="activeTab.set('language')"
              class="py-1.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              [class.bg-white]="activeTab() === 'language'"
              [class.text-indigo-950]="activeTab() === 'language'"
              [class.shadow-2xs]="activeTab() === 'language'"
              [class.text-slate-600]="activeTab() !== 'language'"
            >
              <span class="text-xs">🗣️</span>
              <span class="truncate">Language (زبان)</span>
            </button>
          </div>
        </div>

        <!-- TAB 1: CURRENCIES & COUNTRIES -->
        <div *ngIf="activeTab() === 'currency'" class="p-3">
          <!-- Search Bar -->
          <div class="relative mb-2.5">
            <lucide-icon [name]="icons.Search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></lucide-icon>
            <input
              type="text"
              [(ngModel)]="searchCountryQuery"
              placeholder="Search country, currency (PK, USA, UAE, Saudi, UK...)"
              class="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          <!-- Active Selection Banner -->
          <div class="p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 mb-2.5 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img
                [src]="getFlagUrl(loc.currentCountry().code)"
                [alt]="loc.currentCountry().name"
                class="w-6 h-4 object-cover rounded-[2px] shadow-2xs inline-block"
                loading="eager"
                referrerpolicy="no-referrer"
                (error)="onFlagImgError($event)"
              />
              <span class="hidden fallback-flag text-xl">{{ loc.currentCountry().flag }}</span>
              <div>
                <p class="text-xs font-black text-slate-900 leading-tight">
                  {{ loc.currentCountry().name }} ({{ loc.currentCountry().currencyCode }})
                </p>
                <p class="text-[10px] text-slate-500 font-medium">
                  Active rate: 1 USD = {{ loc.currentCountry().rateToUSD }} {{ loc.currentCountry().currencyCode }}
                </p>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
              ACTIVE
            </span>
          </div>

          <!-- Country List Grid -->
          <div class="max-h-64 sm:max-h-72 overflow-y-auto space-y-1 pr-1 custom-scroll">
            <button
              *ngFor="let c of filteredCountries()"
              type="button"
              (click)="selectCountry(c)"
              class="w-full text-left p-2 rounded-xl transition-all flex items-center justify-between group cursor-pointer border"
              [class.bg-indigo-50]="loc.currentCountry().code === c.code"
              [class.border-indigo-200]="loc.currentCountry().code === c.code"
              [class.text-indigo-950]="loc.currentCountry().code === c.code"
              [class.bg-white]="loc.currentCountry().code !== c.code"
              [class.border-transparent]="loc.currentCountry().code !== c.code"
              [class.hover:bg-slate-50]="loc.currentCountry().code !== c.code"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <img
                  [src]="getFlagUrl(c.code)"
                  [alt]="c.name"
                  class="w-5 h-3.5 object-cover rounded-[2px] shadow-2xs shrink-0"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  (error)="onFlagImgError($event)"
                />
                <span class="hidden fallback-flag text-lg leading-none filter drop-shadow-2xs group-hover:scale-110 transition-transform">
                  {{ c.flag }}
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-slate-900 truncate">
                      {{ c.name }}
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium">
                      {{ c.nativeName }}
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-500 font-medium truncate">
                    {{ c.currencyName }} · 1 USD = {{ c.rateToUSD }} {{ c.currencyCode }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <div class="text-right">
                  <span class="text-xs font-black font-mono text-slate-900 block">
                    {{ c.currencyCode }}
                  </span>
                  <span class="text-[11px] font-bold text-indigo-600">
                    {{ c.currencySymbol }}
                  </span>
                </div>
                <div
                  *ngIf="loc.currentCountry().code === c.code"
                  class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs"
                >
                  <lucide-icon [name]="icons.Check" class="w-3 h-3"></lucide-icon>
                </div>
              </div>
            </button>

            <div *ngIf="filteredCountries().length === 0" class="text-center py-6 text-slate-400 text-xs">
              No matching countries found for "{{ searchCountryQuery }}"
            </div>
          </div>
        </div>

        <!-- TAB 2: LANGUAGES -->
        <div *ngIf="activeTab() === 'language'" class="p-3">
          <!-- Search Bar -->
          <div class="relative mb-2.5">
            <lucide-icon [name]="icons.Search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></lucide-icon>
            <input
              type="text"
              [(ngModel)]="searchLangQuery"
              placeholder="Search English, Urdu, Arabic, Hindi, etc..."
              class="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          <div class="max-h-64 sm:max-h-72 overflow-y-auto space-y-1.5 pr-1 custom-scroll">
            <button
              *ngFor="let l of filteredLanguages()"
              type="button"
              (click)="selectLanguage(l)"
              class="w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer border"
              [class.bg-indigo-50]="loc.currentLanguage().code === l.code"
              [class.border-indigo-200]="loc.currentLanguage().code === l.code"
              [class.bg-white]="loc.currentLanguage().code !== l.code"
              [class.border-transparent]="loc.currentLanguage().code !== l.code"
              [class.hover:bg-slate-50]="loc.currentLanguage().code !== l.code"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-lg">{{ l.flag }}</span>
                <div>
                  <p class="text-xs font-bold text-slate-900 leading-tight">
                    {{ l.nativeName }}
                  </p>
                  <p class="text-[10px] text-slate-400 font-medium">
                    {{ l.name }} · {{ l.dir === 'rtl' ? 'Right-to-Left (RTL)' : 'Standard (LTR)' }}
                  </p>
                </div>
              </div>

              <div
                *ngIf="loc.currentLanguage().code === l.code"
                class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs"
              >
                <lucide-icon [name]="icons.Check" class="w-3 h-3"></lucide-icon>
              </div>
            </button>
          </div>
        </div>

        <!-- Footer Notice: Professional Financial Exchange Indicator -->
        <div class="px-4 py-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <div class="flex items-center gap-2">
            <div class="relative flex items-center justify-center">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/30 animate-ping"></span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px]">
              <lucide-icon [name]="icons.RefreshCw" class="w-3.5 h-3.5 text-indigo-600"></lucide-icon>
              <span>Live forex rates synced automatically</span>
            </div>
          </div>
          <button
            type="button"
            (click)="closeDropdown()"
            class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  `
})
export class CurrencyLanguageSelectorComponent {
  readonly loc = inject(LocalizationService);
  private elementRef = inject(ElementRef);

  readonly icons = {
    Globe,
    ChevronDown,
    Check,
    Search,
    X,
    RefreshCw,
    TrendingUp
  };

  isOpen = signal(false);
  activeTab = signal<'currency' | 'language'>('currency');

  searchCountryQuery = '';
  searchLangQuery = '';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  selectCountry(country: CountryInfo): void {
    this.loc.setCountry(country);
    this.closeDropdown();
  }

  selectLanguage(lang: LanguageInfo): void {
    this.loc.setLanguage(lang);
    this.closeDropdown();
  }

  filteredCountries = computed(() => {
    const q = this.searchCountryQuery.trim().toLowerCase();
    if (!q) return this.loc.countries;
    return this.loc.countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.nativeName.toLowerCase().includes(q) ||
      c.currencyCode.toLowerCase().includes(q) ||
      c.currencyName.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  filteredLanguages = computed(() => {
    const q = this.searchLangQuery.trim().toLowerCase();
    if (!q) return this.loc.languages;
    return this.loc.languages.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  getFlagUrl(code: string): string {
    if (!code) return 'https://flagcdn.com/w40/pk.png';
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  }

  onFlagImgError(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
      const fallback = target.nextElementSibling as HTMLElement;
      if (fallback) {
        fallback.classList.remove('hidden');
        fallback.style.display = 'inline-block';
      }
    }
  }
}
