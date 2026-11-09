import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ShoppingCart,
  Package,
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  CreditCard,
  DollarSign,
  Smartphone,
  X,
  Filter,
  BarChart2,
  AlertTriangle
} from 'lucide-angular';
import { BackendService } from '../../services/backend.service';
import { CurrencyLanguageSelectorComponent } from '../../components/currency-language-selector/currency-language-selector.component';
import { LocalizationService } from '../../services/localization.service';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  barcode: string;
}

@Component({
  selector: 'app-dashboard-retail-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CurrencyLanguageSelectorComponent],
  templateUrl: './retail-pos.component.html'
})
export class DashboardRetailPosComponent implements OnInit {
  private backend = inject(BackendService);
  readonly loc = inject(LocalizationService);

  formatPrice(amount: number): string {
    return this.loc.formatPrice(amount, 'USD');
  }

  readonly icons = {
    ShoppingCart,
    Package,
    Receipt,
    Search,
    Plus,
    Minus,
    Trash2,
    CheckCircle2,
    Printer,
    CreditCard,
    DollarSign,
    Smartphone,
    X,
    Filter,
    BarChart2,
    AlertTriangle
  };

  activeTab: 'pos' | 'inventory' | 'orders' = 'pos';
  isLoading = false;
  searchProduct = '';
  selectedCategory = 'ALL';

  categories = ['ALL', 'Electronics', 'Groceries', 'Fashion', 'Home & Living', 'Office'];

  products: any[] = [];
  orders: any[] = [];
  cart: CartItem[] = [];

  discountPercent = 0;
  taxRate = 0.05; // 5%

  // Modals
  showCheckoutModal = false;
  showReceiptModal = false;
  showAddProductModal = false;
  lastCompletedOrder: any = null;
  actionMessage = '';

  // Payment form
  paymentMethod: 'Cash' | 'Card' | 'Digital' = 'Cash';
  cashTendered = 0;
  customerName = 'Walk-in Customer';

  // Add Product Form
  newProduct = {
    name: '',
    category: 'Electronics',
    costPrice: 20,
    sellingPrice: 39.99,
    stock: 25,
    barcode: ''
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [prodRes, ordRes] = await Promise.all([
        this.backend.getRetailProducts(),
        this.backend.getRetailOrders()
      ]);
      this.products = prodRes.products || [];
      this.orders = ordRes.orders || [];
    } finally {
      this.isLoading = false;
    }
  }

  get filteredProducts() {
    return this.products.filter(p => {
      const matchCat = this.selectedCategory === 'ALL' || p.category === this.selectedCategory;
      const matchSearch = !this.searchProduct ||
        p.name.toLowerCase().includes(this.searchProduct.toLowerCase()) ||
        p.barcode?.includes(this.searchProduct) ||
        p.sku?.toLowerCase().includes(this.searchProduct.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  // Cart operations
  addToCart(product: any): void {
    if (product.stock <= 0) return;
    const existing = this.cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty < product.stock) {
        existing.qty++;
      }
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.sellingPrice),
        qty: 1,
        barcode: product.barcode
      });
    }
  }

  updateQty(item: CartItem, delta: number): void {
    const product = this.products.find(p => p.id === item.id);
    const maxStock = product ? product.stock : 999;
    item.qty += delta;
    if (item.qty <= 0) {
      this.removeFromCart(item);
    } else if (item.qty > maxStock) {
      item.qty = maxStock;
    }
  }

  removeFromCart(item: CartItem): void {
    this.cart = this.cart.filter(i => i.id !== item.id);
  }

  clearCart(): void {
    this.cart = [];
    this.discountPercent = 0;
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  get discountAmount(): number {
    return (this.subtotal * this.discountPercent) / 100;
  }

  get taxAmount(): number {
    return (this.subtotal - this.discountAmount) * this.taxRate;
  }

  get grandTotal(): number {
    return this.subtotal - this.discountAmount + this.taxAmount;
  }

  get changeDue(): number {
    if (this.paymentMethod !== 'Cash') return 0;
    return Math.max(0, this.cashTendered - this.grandTotal);
  }

  openCheckout(): void {
    if (this.cart.length === 0) return;
    this.cashTendered = Math.ceil(this.grandTotal);
    this.showCheckoutModal = true;
  }

  async processCheckout(): Promise<void> {
    this.isLoading = true;
    try {
      const payload = {
        items: this.cart,
        total: this.grandTotal,
        paymentMethod: this.paymentMethod,
        customerName: this.customerName,
        cashier: 'Main POS Register'
      };

      const res = await this.backend.retailCheckout(payload);
      if (res.ok) {
        this.lastCompletedOrder = res.order;
        this.showCheckoutModal = false;
        this.showReceiptModal = true;
        this.clearCart();
        await this.loadData();
      }
    } finally {
      this.isLoading = false;
    }
  }

  printReceipt(): void {
    window.print();
  }

  viewPastOrder(order: any): void {
    this.lastCompletedOrder = order;
    this.showReceiptModal = true;
  }

  async submitNewProduct(): Promise<void> {
    if (!this.newProduct.name) return;
    this.isLoading = true;
    try {
      const res = await this.backend.addRetailProduct(this.newProduct);
      if (res.ok && res.product) {
        this.products.unshift(res.product);
      } else {
        await this.loadData();
      }
      this.showAddProductModal = false;
      this.actionMessage = 'Product saved to inventory successfully!';
      setTimeout(() => this.actionMessage = '', 3500);
      this.newProduct = {
        name: '',
        category: 'Electronics',
        costPrice: 20,
        sellingPrice: 39.99,
        stock: 25,
        barcode: ''
      };
    } finally {
      this.isLoading = false;
    }
  }
}
