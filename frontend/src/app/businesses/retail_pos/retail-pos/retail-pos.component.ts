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
  AlertTriangle,
  ScanBarcode,
  Usb
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';
import { CurrencyLanguageSelectorComponent } from '../../../components/currency-language-selector/currency-language-selector.component';
import { LocalizationService } from '../../../services/localization.service';
import { HardwareDeviceService } from '../../../shared/hardware/hardware-device.service';
import { SharedBarcodeComponent, SharedQrCodeComponent } from '../../../shared/hardware/barcode.component';

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
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CurrencyLanguageSelectorComponent,
    SharedBarcodeComponent,
    SharedQrCodeComponent
  ],
  host: {
    '(window:keydown)': 'onScannerKeydown($event)'
  },
  templateUrl: './retail-pos.component.html'
})
export class DashboardRetailPosComponent implements OnInit {
  private backend = inject(BackendService);
  readonly loc = inject(LocalizationService);
  readonly hardware = inject(HardwareDeviceService);

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
    AlertTriangle,
    ScanBarcode,
    Usb
  };

  activeTab: 'pos' | 'inventory' | 'orders' = 'pos';
  isLoading = false;
  searchProduct = '';
  scannerInput = '';
  lastScannedLabel = '';
  selectedCategory = 'ALL';

  private hidBuffer = '';
  private hidLastKeyAt = 0;

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
  scanWarning = '';

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

  onScannerKeydown(event: KeyboardEvent): void {
    if (this.activeTab !== 'pos' || this.showCheckoutModal || this.showAddProductModal) return;
    const target = event.target as HTMLElement | null;
    const isScannerBox = target?.getAttribute('data-scanner-input') === 'true';
    const tag = target?.tagName?.toLowerCase() || '';
    if (!isScannerBox && (tag === 'input' || tag === 'textarea' || tag === 'select')) {
      return;
    }
    const now = Date.now();
    if (event.key === 'Enter' || event.key === 'Tab') {
      if (isScannerBox && this.scannerInput.trim().length >= 3) {
        event.preventDefault();
        void this.handleBarcodeScan(this.scannerInput.trim());
        this.scannerInput = '';
        this.hidBuffer = '';
        return;
      }
      if (this.hidBuffer.length >= 4 && now - this.hidLastKeyAt < 120) {
        event.preventDefault();
        const code = this.hidBuffer.trim();
        this.hidBuffer = '';
        void this.handleBarcodeScan(code);
      } else {
        this.hidBuffer = '';
      }
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (now - this.hidLastKeyAt > 80) {
        this.hidBuffer = '';
      }
      this.hidBuffer += event.key;
      this.hidLastKeyAt = now;
    }
  }

  async handleBarcodeScan(rawCode: string): Promise<void> {
    const code = String(rawCode || '').trim();
    if (!code) return;
    this.scanWarning = '';
    const lower = code.toLowerCase();

    let product = this.products.find(
      (p) => String(p.barcode || '').toLowerCase() === lower || String(p.sku || '').toLowerCase() === lower
    );

    if (!product) {
      try {
        const res = await this.backend.lookupRetailBarcode(code);
        if (res?.ok && res?.product) {
          product = res.product;
        }
      } catch {
        // Fallback handled below
      }
    }

    if (!product) {
      this.hardware.playBeep(320, 140);
      this.scanWarning = `Unknown barcode or SKU "${code}". Verify label or register SKU in Inventory.`;
      return;
    }

    if (Number(product.stock || 0) <= 0) {
      this.hardware.playBeep(320, 140);
      this.scanWarning = `"${product.name}" (${product.sku || code}) is out of stock.`;
      return;
    }

    this.addToCart(product);
    this.hardware.playBeep(1120, 65);
    this.lastScannedLabel = `${product.name} (${product.barcode || product.sku})`;
    this.actionMessage = `Scanned & added: ${product.name}`;
    setTimeout(() => {
      if (this.actionMessage.startsWith('Scanned & added:')) this.actionMessage = '';
    }, 2500);
    this.scannerInput = '';
  }

  async connectSerialPrinter(): Promise<void> {
    const ok = await this.hardware.connectSerialPrinter();
    this.actionMessage = ok
      ? 'USB ESC/POS thermal printer and RJ11 cash drawer connected.'
      : this.hardware.serialStatusLabel();
    setTimeout(() => (this.actionMessage = ''), 3500);
  }

  async triggerCashDrawer(): Promise<void> {
    const res = await this.hardware.kickCashDrawer();
    this.actionMessage = res.message;
    setTimeout(() => (this.actionMessage = ''), 4000);
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
    const snapSubtotal = this.subtotal;
    const snapDiscount = this.discountAmount;
    const snapTax = this.taxAmount;
    const snapTotal = this.grandTotal;
    const snapCash = this.paymentMethod === 'Cash' ? this.cashTendered : 0;
    const snapChange = this.changeDue;
    try {
      const payload = {
        items: this.cart,
        total: snapTotal,
        paymentMethod: this.paymentMethod,
        customerName: this.customerName,
        cashier: 'Main POS Register'
      };

      const res = await this.backend.retailCheckout(payload);
      if (res.ok) {
        this.lastCompletedOrder = {
          ...res.order,
          subtotal: snapSubtotal,
          discount: snapDiscount,
          tax: snapTax,
          cashTendered: snapCash,
          changeDue: snapChange
        };
        this.showCheckoutModal = false;
        this.showReceiptModal = true;
        const isCash = this.paymentMethod === 'Cash';
        if (this.hardware.autoPrintEnabled()) {
          await this.printThermalOrder(this.lastCompletedOrder, isCash);
        } else if (isCash) {
          await this.hardware.kickCashDrawer();
        }
        this.clearCart();
        await this.loadData();
      }
    } finally {
      this.isLoading = false;
    }
  }

  async printThermalOrder(order: any, kickDrawer = false): Promise<void> {
    if (!order) return;
    const items = Array.isArray(order.items) && order.items.length > 0
      ? order.items.map((it: any) => ({
          name: it.name || 'POS Item',
          qty: Number(it.qty || 1),
          unitPrice: Number(it.price || 0)
        }))
      : [{ name: `${order.itemsCount || 1} Retail Items`, qty: 1, unitPrice: Number(order.total || 0) }];

    const receiptNo = order.receiptNo || order.id || 'POS-0001';
    await this.hardware.printPosReceipt(
      {
        businessName: 'SOFTCODE RETAIL STORE',
        branchName: 'Main POS Register #1',
        receiptTitle: 'SALES RECEIPT / TAX INVOICE',
        receiptNo,
        customerName: order.customerName || 'Walk-in Customer',
        cashierName: order.cashier || 'Main POS Register',
        paymentMethod: order.paymentMethod || 'Cash',
        currency: 'USD',
        items,
        subtotal: Number(order.subtotal ?? order.total ?? 0),
        discount: Number(order.discount || 0),
        tax: Number(order.tax || 0),
        total: Number(order.total || 0),
        cashTendered: order.cashTendered ? Number(order.cashTendered) : undefined,
        changeDue: order.changeDue ? Number(order.changeDue) : undefined,
        timestampLabel: order.date ? new Date(order.date).toLocaleString() : new Date().toLocaleString(),
        barcodeValue: receiptNo,
        qrPayload: `POS|${receiptNo}|${Number(order.total || 0).toFixed(2)}|${order.paymentMethod || 'Cash'}`,
        footerNote: 'Thank you for shopping! Goods exchanged within 7 days with original receipt.'
      },
      kickDrawer
    );
  }

  async printReceipt(): Promise<void> {
    await this.printThermalOrder(this.lastCompletedOrder, false);
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
