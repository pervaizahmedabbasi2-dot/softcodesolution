import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Pill,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  X,
  FileText,
  DollarSign,
  ShieldCheck,
  Truck,
  Boxes,
  ScanBarcode
} from 'lucide-angular';
import { BackendService } from '../../../services/backend.service';
import { HardwareDeviceService } from '../../../shared/hardware/hardware-device.service';
import { SharedBarcodeComponent, SharedQrCodeComponent } from '../../../shared/hardware/barcode.component';

@Component({
  selector: 'app-dashboard-pharmacy-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SharedBarcodeComponent, SharedQrCodeComponent],
  host: {
    '(window:keydown)': 'onScannerKeydown($event)'
  },
  templateUrl: './pharmacy-hub.component.html'
})
export class DashboardPharmacyHubComponent implements OnInit {
  private backend = inject(BackendService);
  readonly hardware = inject(HardwareDeviceService);

  readonly icons = {
    Pill,
    Search,
    Plus,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Printer,
    X,
    FileText,
    DollarSign,
    ShieldCheck,
    Truck,
    Boxes,
    ScanBarcode
  };

  activeTab: 'inventory' | 'sales' | 'expiry' | 'suppliers' | 'compliance' = 'inventory';
  isLoading = false;
  searchQuery = '';
  barcodeQuery = '';
  actionMessage = '';
  fefoAlert = '';
  fefoError = '';

  private hidBuffer = '';
  private hidLastKeyAt = 0;

  medicines: any[] = [];
  sales: any[] = [];
  suppliers: any[] = [];
  complianceLogs: any[] = [];

  showNewMedModal = false;
  showDispenseModal = false;
  showReceiptModal = false;
  selectedSaleForReceipt: any = null;

  newMed = {
    name: '',
    generic: '',
    category: 'Antibiotic & Anti-infective',
    batchNo: '',
    barcode: '',
    expiryDate: '2027-06-30',
    stock: 60,
    minStock: 20,
    unitPrice: 4.50
  };

  newDispense = {
    patient: '',
    doctor: '',
    selectedMedicineId: '',
    quantity: 1,
    unitPrice: 5.0,
    notes: ''
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [mRes, sRes] = await Promise.all([
        this.backend.getPharmacyMedicines(),
        this.backend.getPharmacySales()
      ]);
      this.medicines = (mRes.medicines && mRes.medicines.length > 0) ? mRes.medicines : this.defaultMedicines;
      this.sales = (sRes.sales && sRes.sales.length > 0) ? sRes.sales : this.defaultSales;
    } catch {
      this.medicines = this.defaultMedicines;
      this.sales = this.defaultSales;
    } finally {
      this.suppliers = this.defaultSuppliers;
      this.complianceLogs = this.defaultCompliance;
      if (this.medicines.length > 0 && !this.newDispense.selectedMedicineId) {
        this.newDispense.selectedMedicineId = this.medicines[0].id;
        this.newDispense.unitPrice = this.medicines[0].unitPrice;
      }
      this.isLoading = false;
    }
  }

  onScannerKeydown(event: KeyboardEvent): void {
    if (this.showNewMedModal || this.showReceiptModal) return;
    const target = event.target as HTMLElement | null;
    const isScannerBox = target?.getAttribute('data-pharma-scanner') === 'true';
    const tag = target?.tagName?.toLowerCase() || '';
    if (!isScannerBox && (tag === 'input' || tag === 'textarea' || tag === 'select')) {
      return;
    }
    const now = Date.now();
    if (event.key === 'Enter' || event.key === 'Tab') {
      if (isScannerBox && this.barcodeQuery.trim().length >= 3) {
        event.preventDefault();
        void this.scanMedicineBarcode(this.barcodeQuery.trim());
        return;
      }
      if (this.hidBuffer.length >= 4 && now - this.hidLastKeyAt < 120) {
        event.preventDefault();
        const code = this.hidBuffer.trim();
        this.hidBuffer = '';
        void this.scanMedicineBarcode(code);
      } else {
        this.hidBuffer = '';
      }
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (now - this.hidLastKeyAt > 80) this.hidBuffer = '';
      this.hidBuffer += event.key;
      this.hidLastKeyAt = now;
    }
  }

  async scanMedicineBarcode(rawCode: string): Promise<void> {
    const code = String(rawCode || '').trim();
    if (!code) return;
    this.fefoAlert = '';
    this.fefoError = '';

    let recommended: any = null;
    try {
      const res = await this.backend.lookupPharmacyFefo(code);
      if (res?.ok && res?.recommendedBatch) {
        recommended = res.recommendedBatch;
      } else if (res && res.batches?.length > 0 && !res.recommendedBatch) {
        this.hardware.playBeep(320, 140);
        this.fefoError = `All matching batches for barcode "${code}" are EXPIRED or out of stock. Dispensing blocked!`;
        return;
      }
    } catch {
      // Offline FEFO fallback below
    }

    if (!recommended) {
      const q = code.toLowerCase();
      const today = new Date().toISOString().slice(0, 10);
      const matches = this.medicines
        .filter((m) =>
          String(m.barcode || '').toLowerCase() === q ||
          String(m.batchNo || '').toLowerCase() === q ||
          String(m.name || '').toLowerCase().includes(q)
        )
        .sort((a, b) => String(a.expiryDate || '9999-12-31').localeCompare(String(b.expiryDate || '9999-12-31')));

      if (matches.length === 0) {
        this.hardware.playBeep(320, 140);
        this.fefoError = `No formulation matched barcode/batch "${code}".`;
        return;
      }

      const validNonExpired = matches.find((m) => Number(m.stock || 0) > 0 && (!m.expiryDate || m.expiryDate >= today));
      if (!validNonExpired) {
        this.hardware.playBeep(320, 140);
        this.fefoError = `Expired or zero-stock batch (${matches[0].batchNo}, exp ${matches[0].expiryDate}) — blocked by FEFO guard.`;
        return;
      }
      recommended = validNonExpired;
    }

    // Ensure recommended batch exists in local list for selector binding
    if (!this.medicines.some((m) => m.id === recommended.id)) {
      this.medicines.unshift(recommended);
    }

    this.newDispense.selectedMedicineId = recommended.id;
    this.newDispense.unitPrice = Number(recommended.unitPrice || 0);
    this.showDispenseModal = true;
    this.hardware.playBeep(1140, 70);
    this.fefoAlert = `FEFO Auto-Selected: ${recommended.name} · Batch ${recommended.batchNo} · Exp ${recommended.expiryDate} (${recommended.stock} packs left)`;
    this.actionMessage = this.fefoAlert;
    this.barcodeQuery = '';
  }

  get stats() {
    const totalFormulations = this.medicines.length;
    const totalStock = this.medicines.reduce((sum, m) => sum + (m.stock || 0), 0);
    const lowStock = this.medicines.filter(m => m.stock <= m.minStock).length;
    const nearExpiry = this.medicines.filter(m => m.daysRemaining && m.daysRemaining < 90).length;
    const salesVolume = this.sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    return { totalFormulations, totalStock, lowStock, nearExpiry, salesVolume };
  }

  get filteredMedicines() {
    if (!this.searchQuery) return this.medicines;
    const q = this.searchQuery.toLowerCase();
    return this.medicines.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.generic?.toLowerCase().includes(q) ||
      m.batchNo?.toLowerCase().includes(q) ||
      m.barcode?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    );
  }

  onMedicineSelect(medId: string): void {
    const med = this.medicines.find(m => m.id === medId);
    if (med) {
      this.newDispense.unitPrice = med.unitPrice;
    }
  }

  openReceipt(sale: any): void {
    this.selectedSaleForReceipt = sale;
    this.showReceiptModal = true;
  }

  async printThermalRxReceipt(sale: any): Promise<void> {
    if (!sale) return;
    await this.hardware.printPosReceipt({
      businessName: 'SOFTCODE PHARMACY & CARE',
      branchName: 'DRAP Licensed Counter · Reg #001928',
      receiptTitle: 'PRESCRIPTION DISPENSING RECEIPT',
      receiptNo: sale.invoiceNo || sale.id || 'RX-0001',
      customerName: `${sale.patientName || 'Patient'} (${sale.doctorName || 'OTC'})`,
      cashierName: 'Duty Pharmacist',
      paymentMethod: 'Counter Cash / Rx',
      currency: 'USD',
      items: [
        {
          name: `${sale.medicineName || 'Medicine'}${sale.batchNo ? ' [' + sale.batchNo + ']' : ''}`,
          qty: Number(sale.quantity || 1),
          unitPrice: Number(sale.unitPrice || sale.totalAmount || 0),
          meta: sale.expiryDate ? `Exp: ${sale.expiryDate}` : undefined
        }
      ],
      subtotal: Number(sale.totalAmount || 0),
      discount: 0,
      tax: 0,
      total: Number(sale.totalAmount || 0),
      timestampLabel: sale.timestamp || new Date().toLocaleString(),
      barcodeValue: sale.invoiceNo || 'RX-0001',
      qrPayload: `RX|${sale.invoiceNo || 'RX-0001'}|${sale.patientName || ''}|${sale.medicineName || ''}|${sale.totalAmount || 0}`,
      footerNote: 'Verify batch expiry before use. Keep medicines out of reach of children.'
    });
  }

  async printReceipt(): Promise<void> {
    await this.printThermalRxReceipt(this.selectedSaleForReceipt);
  }

  async submitNewMedicine(): Promise<void> {
    if (!this.newMed.name) return;
    const med = {
      id: 'med-' + Date.now(),
      name: this.newMed.name,
      generic: this.newMed.generic || 'Generic Formulation',
      category: this.newMed.category,
      batchNo: this.newMed.batchNo || 'BTH-' + Math.floor(1000 + Math.random() * 9000),
      barcode: this.newMed.barcode || ('896400' + Math.floor(100000 + Math.random() * 899999)),
      expiryDate: this.newMed.expiryDate,
      daysRemaining: 400,
      stock: Number(this.newMed.stock) || 30,
      minStock: Number(this.newMed.minStock) || 10,
      unitPrice: Number(this.newMed.unitPrice) || 5.0
    };
    this.medicines.unshift(med);
    this.showNewMedModal = false;
    this.actionMessage = `Medicine ${med.name} (${med.batchNo}) added to inventory!`;
    setTimeout(() => this.actionMessage = '', 3500);
    this.newMed = {
      name: '',
      generic: '',
      category: 'Antibiotic & Anti-infective',
      batchNo: '',
      barcode: '',
      expiryDate: '2027-06-30',
      stock: 60,
      minStock: 20,
      unitPrice: 4.50
    };
  }

  async submitDispense(): Promise<void> {
    if (!this.newDispense.patient) return;
    const med = this.medicines.find(m => m.id === this.newDispense.selectedMedicineId) || this.medicines[0];
    const today = new Date().toISOString().slice(0, 10);
    if (med?.expiryDate && med.expiryDate < today) {
      this.fefoError = `Cannot dispense expired batch ${med.batchNo} (expired ${med.expiryDate}).`;
      return;
    }
    const qty = Number(this.newDispense.quantity) || 1;
    if (med && med.stock >= qty) {
      med.stock -= qty;
    }
    const sale = {
      id: 'sale-' + Date.now(),
      invoiceNo: 'RX-' + Math.floor(10000 + Math.random() * 90000),
      patientName: this.newDispense.patient,
      doctorName: this.newDispense.doctor || 'Dr. Self / Over The Counter',
      medicineName: med?.name || 'Formulation',
      batchNo: med?.batchNo || '',
      expiryDate: med?.expiryDate || '',
      quantity: qty,
      unitPrice: this.newDispense.unitPrice,
      totalAmount: (this.newDispense.unitPrice * qty),
      timestamp: 'Today, Just Now',
      status: 'DISPENSED'
    };
    this.sales.unshift(sale);
    this.showDispenseModal = false;
    this.selectedSaleForReceipt = sale;
    this.showReceiptModal = true;
    await this.printThermalRxReceipt(sale);
    this.actionMessage = `Prescription dispensed for ${sale.patientName} (${sale.invoiceNo})`;
    setTimeout(() => this.actionMessage = '', 3500);
    this.newDispense = {
      patient: '',
      doctor: '',
      selectedMedicineId: this.medicines[0]?.id || '',
      quantity: 1,
      unitPrice: this.medicines[0]?.unitPrice || 5.0,
      notes: ''
    };
  }

  readonly defaultMedicines = [
    { id: 'med-1b', name: 'Augmentin 625mg Tablet', generic: 'Amoxicillin + Clavulanic Acid', category: 'Antibiotics', batchNo: 'B-7710-FEFO', barcode: '896400112201', expiryDate: '2026-08-10', daysRemaining: 76, stock: 34, minStock: 20, unitPrice: 8.50 },
    { id: 'med-1', name: 'Augmentin 625mg Tablet', generic: 'Amoxicillin + Clavulanic Acid', category: 'Antibiotics', batchNo: 'B-7729', barcode: '896400112201', expiryDate: '2027-08-15', daysRemaining: 504, stock: 120, minStock: 30, unitPrice: 8.50 },
    { id: 'med-2', name: 'Panadol CF Caplet 500mg', generic: 'Paracetamol + Pseudoephedrine', category: 'Analgesics & Cold', batchNo: 'B-6102', barcode: '896400112202', expiryDate: '2026-11-30', daysRemaining: 246, stock: 350, minStock: 80, unitPrice: 2.20 },
    { id: 'med-3', name: 'Nexum 40mg Capsule', generic: 'Esomeprazole Magnesium', category: 'Gastrointestinal', batchNo: 'B-8819', barcode: '896400112203', expiryDate: '2026-06-15', daysRemaining: 78, stock: 14, minStock: 25, unitPrice: 6.80 },
    { id: 'med-4', name: 'Lipitor 20mg Tablet', generic: 'Atorvastatin Calcium', category: 'Cardiovascular', batchNo: 'B-9021', barcode: '896400112204', expiryDate: '2027-12-31', daysRemaining: 642, stock: 85, minStock: 20, unitPrice: 12.00 }
  ];

  readonly defaultSales = [
    { id: 's-1', invoiceNo: 'RX-99201', patientName: 'Naveed Akhtar', doctorName: 'Dr. Tariq Mehmood', medicineName: 'Augmentin 625mg', batchNo: 'B-7710-FEFO', expiryDate: '2026-08-10', quantity: 2, unitPrice: 8.50, totalAmount: 17.00, timestamp: 'Today 10:15 AM', status: 'DISPENSED' },
    { id: 's-2', invoiceNo: 'RX-99202', patientName: 'Saima Khanum', doctorName: 'Dr. Ayesha Alvi', medicineName: 'Panadol CF Caplet', batchNo: 'B-6102', expiryDate: '2026-11-30', quantity: 4, unitPrice: 2.20, totalAmount: 8.80, timestamp: 'Today 11:40 AM', status: 'DISPENSED' },
    { id: 's-3', invoiceNo: 'RX-99203', patientName: 'Hamid Raza', doctorName: 'Dr. Faisal Shah', medicineName: 'Nexum 40mg', batchNo: 'B-8819', expiryDate: '2026-06-15', quantity: 3, unitPrice: 6.80, totalAmount: 20.40, timestamp: 'Today 01:20 PM', status: 'DISPENSED' }
  ];

  readonly defaultSuppliers = [
    { id: 'sup-1', name: 'GlaxoSmithKline (GSK) Distribution', contact: '+92 21 111-475-111', pendingOrders: 2, lastDelivery: 'Yesterday', status: 'Active OEM' },
    { id: 'sup-2', name: 'Getz Pharma Logistics', contact: '+92 21 386-211-100', pendingOrders: 1, lastDelivery: '3 days ago', status: 'Active OEM' },
    { id: 'sup-3', name: 'Abbott Laboratories Depot', contact: '+92 42 357-611-222', pendingOrders: 0, lastDelivery: '1 week ago', status: 'Active OEM' }
  ];

  readonly defaultCompliance = [
    { id: 'cmp-1', logNo: 'DRAP-2026-091', authority: 'Drug Regulatory Authority (DRAP)', type: 'Controlled Substance Audit', date: '12 Apr 2026', inspector: 'Inspector M. Zubair', status: 'PASSED & COMPLIANT' },
    { id: 'cmp-2', logNo: 'DRAP-2026-092', authority: 'Cold-Chain Biologicals Verification', type: 'Insulin & Vaccine Fridge Log', date: '20 Apr 2026', inspector: 'Auto Sensor Log (4°C)', status: 'NORMAL 100%' }
  ];
}
