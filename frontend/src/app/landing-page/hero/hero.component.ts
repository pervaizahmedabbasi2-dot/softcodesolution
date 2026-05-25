import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // 🔥 RouterLink ko active karne ke liye zaroori import

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterModule], // 🔥 RouterModule ko yahan include kar diya taake page navigation chale
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent {
  // 1. Purana variable (Menu ke liye) - BILKUL SAFE HAI
  isMenuOpen: boolean = false;

  // 📝 NOTE: isBotOpen aur toggleSCSBot() ko hata diya hai kyunki popup ab HTML mein nahi hai, 
  // is se aapka code clean rahega aur koi fuzool variable memory mein load nahi hoga.

  // Purana function (Menu toggle karne ke liye) - BILKUL SAFE HAI
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}