import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PwaInstallComponent } from '../../../pwa-install.component';
import { CurrencyLanguageSelectorComponent } from '../../../components/currency-language-selector/currency-language-selector.component';
import { ScsBot3dComponent } from '../../../components/scs-bot-3d/scs-bot-3d.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, PwaInstallComponent, CurrencyLanguageSelectorComponent, ScsBot3dComponent],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent {
  private cdr = inject(ChangeDetectorRef);
  isMenuOpen: boolean = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (typeof document !== 'undefined') {
      if (this.isMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  closeMenu() {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }
}