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
  Boxes
} from 'lucide-angular';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-pharmacy-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './pharmacy-hub.component.html'
})
export class DashboardPharmacyHubComponent implements OnInit {
  private backend = inject(BackendService);

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
    Boxes
  };

  activeTab: 'inventory' | 'sales' | 'expiry' | 'suppliers' | 'compliance' = 'inventory';
  isLoading = false;
  searchQuery = '';
  actionMessage = '';

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

  printReceipt(): void {
    window.print();
  }

  async submitNewMedicine(): Promise<void> {
    if (!this.newMed.name) return;
    const med = {
      id: 'med-' + Date.now(),
      name: this.newMed.name,
      generic: this.newMed.generic || 'Generic Formulation',
      category: this.newMed.category,
      batchNo: this.newMed.batchNo || 'BTH-' + Math.floor(1000 + Math.random() * 9000),
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
      expiryDate: '2027-06-30',
      stock: 60,
      minStock: 20,
      unitPrice: 4.50
    };
  }

  async submitDispense(): Promise<void> {
    if (!this.newDispense.patient) return;
    const med = this.medicines.find(m => m.id === this.newDispense.selectedMedicineId) || this.medicines[0];
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
      quantity: qty,
      unitPrice: this.newDispense.unitPrice,
      totalAmount: (this.newDispense.unitPrice * qty),
      timestamp: 'Today, Just Now',
      status: 'DISPENSED'
    };
    this.sales.unshift(sale);
    this.showDispenseModal = false;
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
    { id: 'm-1', name: 'Augmentin 625mg Tablet', generic: 'Amoxicillin + Clavulanic Acid', category: 'Antibiotics', batchNo: 'B-7729', expiryDate: '2027-08-15', daysRemaining: 504, stock: 120, minStock: 30, unitPrice: 8.50 },
    { id: 'm-2', name: 'Panadol CF Caplet 500mg', generic: 'Paracetamol + Pseudoephedrine', category: 'Analgesics & Cold', batchNo: 'B-6102', expiryDate: '2026-11-30', daysRemaining: 246, stock: 350, minStock: 80, unitPrice: 2.20 },
    { id: 'm-3', name: 'Nexum 40mg Capsule', generic: 'Esomeprazole Magnesium', category: 'Gastrointestinal', batchNo: 'B-8819', expiryDate: '2026-06-15', daysRemaining: 78, stock: 14, minStock: 25, unitPrice: 6.80 },
    { id: 'm-4', name: 'Lipitor 20mg Tablet', generic: 'Atorvastatin Calcium', category: 'Cardiovascular', batchNo: 'B-9021', expiryDate: '2027-12-31', daysRemaining: 642, stock: 85, minStock: 20, unitPrice: 12.00 }
  ];

  readonly defaultSales = [
    { id: 's-1', invoiceNo: 'RX-99201', patientName: 'Naveed Akhtar', doctorName: 'Dr. Tariq Mehmood', medicineName: 'Augmentin 625mg', quantity: 2, unitPrice: 8.50, totalAmount: 17.00, timestamp: 'Today 10:15 AM', status: 'DISPENSED' },
    { id: 's-2', invoiceNo: 'RX-99202', patientName: 'Saima Khanum', doctorName: 'Dr. Ayesha Alvi', medicineName: 'Panadol CF Caplet', quantity: 4, unitPrice: 2.20, totalAmount: 8.80, timestamp: 'Today 11:40 AM', status: 'DISPENSED' },
    { id: 's-3', invoiceNo: 'RX-99203', patientName: 'Hamid Raza', doctorName: 'Dr. Faisal Shah', medicineName: 'Nexum 40mg', quantity: 3, unitPrice: 6.80, totalAmount: 20.40, timestamp: 'Today 01:20 PM', status: 'DISPENSED' }
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
