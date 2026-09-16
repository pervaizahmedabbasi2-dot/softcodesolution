import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './store.component.html'
})
export class StoreComponent {

  selectedProduct: any = null;
  searchText = '';
  currentPage = 1;
  itemsPerPage = 3;
  cart: any[] = [];

  // 🔥 SAME DATA (UNCHANGED)
  products = [
    {
      title: 'School/Collage Management',
      desc: 'AI-Powered educational ecosystem for modern institutions.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop',
      price: 'RS 12,000',
      features: ['Biometric Attendance','Fee Invoicing','LMS Portal','Staff Payroll System','Online Exam System','Exam Result','Live Classess','Parent Portal','Staff Payroll & HR','Class Timetable','Expense Management','Lesson Planning','Profit & Loss Reports','Stock & Inventory Control','Inventory & Asset Control']
    },
    {
      title: 'Travel & Tourism',
      desc: 'Complete OTA engine with global API integrations.',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop',
      price: 'RS 18,000',
      features: ['Flight Booking','Hotel Reservation System','Visa Status Tracker','Tour Packages','Agent & B2B Portal','Dynamic Itinerary Planner','Travel Insurance Portal','Financials & Logistic','WhatsApp CRM','Account Ledger','Expense Mgmt']
    },
    {
      title: 'Pharmacy Medical',
      desc: 'Precision healthcare inventory with batch tracking.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop',
      price: 'RS 15,000',
      features: ['Expiry Engine','Smart POS Billing','Purchase Orders','Salt & Formula Search','Narcotic Logs','Profit Analytics','Inventory & Stock','Supplier Portal']
    },
    {
      title: 'Retail POS Pro',
      desc: 'Enterprise retail solution for high-volume stores.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop',
      price: 'RS 10,000',
      features: ['Barcode Automation','Low Stock Alerts','Dual Billing Display','GST/VAT Reports','Role Based Access','Customer Loyalty','Multi-Store Sync','Daily Closing']
    },
    {
      title: 'Gym & Fitness',
      desc: 'Advanced member tracking and trainer management.',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
      price: 'RS 8,500',
      features: ['Member Subscription','Access Control','Diet Chart Maker','Trainer Commission','Workout Logs','SMS Reminders','POS Supplement','Renewal Alerts']
    },
    {
      title: 'Salon & Spa ERP',
      desc: 'Elite booking and commission management system.',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
      price: 'RS 9,000',
      features: ['Booking Calendar','Service Mapping','Stylist Comm.','Product Inventory','Member Cards','Daily Cash Book','Expense Tracking','Mobile Booking']
    }
  ];

  get filteredProducts() {
    return this.products.filter(p =>
      p.title.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  get displayProducts() {
    if (this.searchText) return this.filteredProducts;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }

  openModal(p: any) { this.selectedProduct = p; }
  closeModal() { this.selectedProduct = null; }

  addToCart(event: Event, p: any) {
    event.stopPropagation();
    this.cart.push(p);
  }
}