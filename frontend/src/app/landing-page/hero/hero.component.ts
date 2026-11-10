<<<<<<< HEAD
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PwaInstallComponent } from '../../pwa-install.component';
import { CurrencyLanguageSelectorComponent } from '../../components/currency-language-selector/currency-language-selector.component';
=======
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // 🔥 RouterLink ko active karne ke liye zaroori import
import { PwaInstallComponent } from '../../pwa-install.component';
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b

@Component({
  selector: 'app-hero',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, RouterModule, PwaInstallComponent, CurrencyLanguageSelectorComponent],
=======
  imports: [CommonModule, RouterModule, PwaInstallComponent], // 🔥 RouterModule ko yahan include kar diya taake page navigation chale
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent {
<<<<<<< HEAD
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
=======
  // 1. Purana variable (Menu ke liye) - BILKUL SAFE HAI
  isMenuOpen: boolean = false;

  // 📝 NOTE: isBotOpen aur toggleSCSBot() ko hata diya hai kyunki popup ab HTML mein nahi hai, 
  // is se aapka code clean rahega aur koi fuzool variable memory mein load nahi hoga.

  // Purana function (Menu toggle karne ke liye) - BILKUL SAFE HAI
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
  }
}