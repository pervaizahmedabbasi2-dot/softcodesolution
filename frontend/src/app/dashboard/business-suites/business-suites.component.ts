import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Briefcase,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  X,
  FileText,
  DollarSign,
  ShieldCheck,
  Building2,
  Users,
  Boxes,
  Truck,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  ArrowRight,
  Shield,
  Lock,
  BarChart3,
  TrendingUp,
  Activity,
  RefreshCw,
  Eye
} from 'lucide-angular';

export interface EnterpriseBusiness {
  id: string;
  name: string;
  category: string;
  sector: string;
  pricingWeight: number;
  dedicatedHubView?: string;
  tagline: string;
  description: string;
  modules: string[];
  kpis: {
    label: string;
    value: string;
    subtext: string;
    tone?: 'default' | 'emerald' | 'amber' | 'blue' | 'purple';
  }[];
  activeTab: string;
  tabs: string[];
  records: any[];
}

@Component({
  selector: 'app-dashboard-business-suites',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './business-suites.component.html'
})
export class DashboardBusinessSuitesComponent implements OnInit {
  private _initialBusinessId?: string;

  @Input()
  set initialBusinessId(val: string | undefined) {
    this._initialBusinessId = val;
    if (val && this.businesses && this.businesses.length > 0) {
      this.selectBusiness(val);
    }
  }
  get initialBusinessId(): string | undefined {
    return this._initialBusinessId;
  }

  @Input() activeRole: string = 'owner';

  @Output() navigate = new EventEmitter<string>();

  readonly icons = {
    Briefcase,
    Search,
    Plus,
    CheckCircle2,
    Clock,
    Printer,
    X,
    FileText,
    DollarSign,
    ShieldCheck,
    Building2,
    Users,
    Boxes,
    Truck,
    Layers,
    Sparkles,
    ExternalLink,
    ChevronRight,
    Filter,
    Check,
    ArrowRight,
    Shield,
    Lock,
    BarChart3,
    TrendingUp,
    Activity,
    RefreshCw,
    Eye
  };

  getRoleLabel(role?: string): string {
    const r = (role || this.activeRole || 'owner').toLowerCase();
    switch (r) {
      case 'owner': return '👑 Business Owner (Full Master Access)';
      case 'manager': return '💼 Branch Manager (Operational Command)';
      case 'staff': return '⚡ Department Specialist / Staff (Point of Work)';
      case 'accountant': return '📊 Finance & Accounting Officer';
      case 'auditor': return '🔍 Compliance & Audit Reviewer';
      case 'client': return '👤 Customer / Client Self-Service';
      default: return '👑 Business Admin';
    }
  }

  isModuleRestrictedForRole(modName: string): boolean {
    // All modules released across all business roles
    return false;
  }

  searchQuery = '';
  selectedSector = 'ALL';
  selectedBusinessId = 'accounting_tax';
  activeBusiness!: EnterpriseBusiness;
  actionMessage = '';

  showAddRecordModal = false;
  showPrintModal = false;
  selectedRecordForPrint: any = null;

  newRecord = {
    title: '',
    client: '',
    amount: 1500,
    status: 'ACTIVE',
    date: 'Today, Just Now',
    notes: 'Operational entry recorded via Enterprise Suite.'
  };

  readonly sectors = [
    { id: 'ALL', label: 'All 30 Businesses' },
    { id: 'COMMERCE', label: 'Retail & Commerce' },
    { id: 'HEALTHCARE', label: 'Healthcare & Pharma' },
    { id: 'EDUCATION', label: 'Education & Training' },
    { id: 'HOSPITALITY', label: 'Hospitality & Travel' },
    { id: 'INDUSTRIAL', label: 'Industrial & Logistics' },
    { id: 'PROFESSIONAL', label: 'Corporate & Legal' },
    { id: 'SERVICES', label: 'Services & Operations' }
  ];

  businesses: EnterpriseBusiness[] = [
    // 1. Accounting & Tax Services
    {
      id: 'accounting_tax',
      name: 'Accounting & Tax Services',
      category: 'accounting_tax',
      sector: 'PROFESSIONAL',
      pricingWeight: 1.00,
      tagline: 'Bookkeeping, Sales & Income Tax Returns, and Audit Ledgers',
      description: 'End-to-end accounting suite with double-entry ledgers, monthly tax return filing, financial audit workpapers, and client billing.',
      modules: [
        'Accounting Clients & Profiles',
        'Double-Entry Bookkeeping Ledger',
        'Tax Return Filings (FBR & Sales Tax)',
        'Expense Tracking & Vouchers',
        'Financial Statements & P&L',
        'Payroll Tax & EOBI Integration',
        'Statutory Audit Working Papers',
        'Bank Reconciliation Statements',
        'Aging Client Ledgers & Debt',
        'Corporate Withholding Certificates'
      ],
      kpis: [
        { label: 'Active Retainer Clients', value: '42 Accounts', subtext: 'Corporate tax retainers', tone: 'default' },
        { label: 'Tax Returns In Progress', value: '18 Returns', subtext: 'FBR & Provincial sales tax', tone: 'amber' },
        { label: 'Monthly Ledgers Reconciled', value: '96.4%', subtext: 'Zero ledger variance', tone: 'emerald' },
        { label: 'Audit Files Open', value: '6 Cases', subtext: 'Year-end statutory audits', tone: 'blue' },
        { label: 'Retainer Billed', value: '$28,450', subtext: 'Monthly accounting volume', tone: 'default' }
      ],
      activeTab: 'Tax Returns',
      tabs: ['Tax Returns', 'Bookkeeping Ledger', 'Retainer Clients', 'Audit Papers', 'Financial Statements'],
      records: [
        { id: 'rec-1', code: 'TAX-2026-091', title: 'Corporate Sales Tax Filing Q1', client: 'Al-Farooq Steel Mills Ltd', amount: 3500, date: '2026-05-15', status: 'IN_PROGRESS', meta: 'Form STR-7 Sales Tax', tab: 'Tax Returns' },
        { id: 'rec-2', code: 'TAX-2026-092', title: 'Withholding Income Tax Audit Reconciliation', client: 'Zenith Logistics Global', amount: 4800, date: '2026-05-20', status: 'AUDIT_READY', meta: 'Sec 161/205 Notice', tab: 'Audit Papers' },
        { id: 'rec-3', code: 'TAX-2026-093', title: 'Annual Statutory P&L & Balance Sheet', client: 'Naveed Enterprises SMC', amount: 2200, date: '2026-05-02', status: 'FILED', meta: 'Companies Act Compliance', tab: 'Financial Statements' },
        { id: 'rec-4', code: 'TAX-2026-094', title: 'Payroll Tax Statement & EOBI Clearance', client: 'TechnoServe Labs', amount: 1800, date: '2026-04-30', status: 'COMPLETED', meta: 'Monthly Retainer', tab: 'Bookkeeping Ledger' },
        { id: 'rec-5', code: 'TAX-2026-095', title: 'Monthly Retainer Ledger Settlement', client: 'Prime Textile Mills', amount: 4200, date: '2026-05-18', status: 'PAID', meta: 'Retainer Active', tab: 'Retainer Clients' }
      ]
    },

    // 2. Agriculture & Farming
    {
      id: 'agriculture',
      name: 'Agriculture & Farming',
      category: 'agriculture',
      sector: 'INDUSTRIAL',
      pricingWeight: 1.00,
      tagline: 'Field Parcels, Crop Cultivation, Livestock & Harvest Logistics',
      description: 'Comprehensive farm ERP tracking acreage cultivation, seed/fertilizer inputs, harvest yield weighing, livestock herds, and mandi sales.',
      modules: [
        'Fields & Land Parcels Records',
        'Crops & Cultivation Cycles',
        'Livestock & Herd Health Tracking',
        'Seeds & Fertilizer Inputs Stock',
        'Harvest Yield Weighment Logs',
        'Farm Operational Expense Ledger',
        'Crop Mandi & Produce Sales',
        'Irrigation Schedules & Tube-well',
        'Farm Equipment & Tractor Maintenance',
        'Weather & Rainfall Diary'
      ],
      kpis: [
        { label: 'Cultivated Land', value: '450 Acres', subtext: 'Canal & tube-well irrigated', tone: 'default' },
        { label: 'Current Crop Season', value: 'Wheat & Sugarcane', subtext: 'Rabi harvest active', tone: 'emerald' },
        { label: 'Livestock Herd', value: '185 Heads', subtext: 'Dairy & cattle herd', tone: 'blue' },
        { label: 'Harvest Weighment', value: '1,420 Tons', subtext: 'Silo grain storage', tone: 'amber' },
        { label: 'Market Sales Gross', value: '$64,200', subtext: 'Grain market receipts', tone: 'default' }
      ],
      activeTab: 'Crops & Cultivation',
      tabs: ['Crops & Cultivation', 'Fields & Lands', 'Livestock Herd', 'Inputs & Supplies', 'Mandi Sales'],
      records: [
        { id: 'rec-1', code: 'AGR-401', title: 'Wheat Crop Harvest & Grain Bagging (Plot A-F)', client: 'GreenField Farms Okara', amount: 18500, date: '2026-05-10', status: 'HARVEST_ACTIVE', meta: 'Canal Irrigated Acreage', tab: 'Crops & Cultivation' },
        { id: 'rec-2', code: 'AGR-402', title: 'Dairy Herd Vaccination & Milk Yield Logs', client: 'Model Cattle Yard Sahiwal', amount: 4200, date: '2026-05-12', status: 'HEALTH_VERIFIED', meta: '185 Heads Herd', tab: 'Livestock Herd' },
        { id: 'rec-3', code: 'AGR-403', title: 'Fertilizer DAP & Urea Consignment Delivery', client: 'Punjab Agri Corp', amount: 7600, date: '2026-05-04', status: 'INSPECTED', meta: 'Warehouse Silo # 2', tab: 'Inputs & Supplies' },
        { id: 'rec-4', code: 'AGR-404', title: 'Grain Mandi Auction Lot # 88 Settlement', client: 'Grain Market Multan', amount: 22400, date: '2026-05-16', status: 'CLEARED', meta: 'Cash Settlement', tab: 'Mandi Sales' },
        { id: 'rec-5', code: 'AGR-405', title: 'Canal Water Allocation & Parcel Land Deed', client: 'Chak 45 Land Survey', amount: 3200, date: '2026-05-08', status: 'ACTIVE', meta: 'Plot Deed Certified', tab: 'Fields & Lands' }
      ]
    },

    // 3. Auto Workshop & Garage
    {
      id: 'auto_workshop',
      name: 'Auto Workshop & Garage',
      category: 'auto_workshop',
      sector: 'SERVICES',
      pricingWeight: 1.00,
      dedicatedHubView: 'auto-hub',
      tagline: 'Repair Job Cards, Technician Scheduling & Parts Inventory',
      description: 'Multi-bay automotive service suite managing mechanic work orders, customer vehicle profiles, diagnostic checklists, and spare parts POS.',
      modules: [
        'Repair Job Cards & Bay Scheduling',
        'Customer Vehicles & Chassis Database',
        'Spare Parts POS & Inventory',
        'Service History & Maintenance Logs',
        'Technician & Mechanic Commission',
        'Diagnostic Multi-Point Inspection',
        'Insurance Repair Estimates & Claims',
        'Workshop Cash & Card Billing',
        'Vehicle Gate Pass & Delivery Logs',
        'Automated Service SMS Reminders'
      ],
      kpis: [
        { label: 'Active Job Cards', value: '14 Bays Open', subtext: 'Mechanical & body repair', tone: 'default' },
        { label: 'Today Dispatched', value: '9 Vehicles', subtext: 'Delivered with gate pass', tone: 'emerald' },
        { label: 'Spare Parts Reordered', value: '28 SKUs', subtext: 'Filters, brakes, synthetic oil', tone: 'blue' },
        { label: 'Mechanic Efficiency', value: '94.2%', subtext: 'Job card labor hours', tone: 'amber' },
        { label: 'Workshop Weekly Gross', value: '$18,900', subtext: 'Parts + service billing', tone: 'default' }
      ],
      activeTab: 'Job Cards',
      tabs: ['Job Cards', 'Vehicles Registry', 'Spare Parts POS', 'Diagnostic Bays', 'Billing & Cash'],
      records: [
        { id: 'rec-1', code: 'JC-1082', title: 'Complete Engine Tuning & Brake Pad Replacement', client: 'Toyota Corolla Altis (ICT-8921)', amount: 280, date: 'Today 09:30 AM', status: 'IN_SERVICE', meta: 'Lead Mechanic: Ustad Imran', tab: 'Job Cards' },
        { id: 'rec-2', code: 'JC-1083', title: 'AC Compressor Replacement & Gas Top-up', client: 'Honda Civic RS (ICT-4411)', amount: 420, date: 'Today 10:15 AM', status: 'DIAGNOSING', meta: 'Tech: Rashid Auto Elec', tab: 'Diagnostic Bays' },
        { id: 'rec-3', code: 'JC-1084', title: 'Shock Absorber & Suspension Overhaul', client: 'Kia Sportage AWD (KHI-7729)', amount: 350, date: 'Yesterday', status: 'READY_DELIVERY', meta: 'Gate Pass Ready', tab: 'Job Cards' },
        { id: 'rec-4', code: 'JC-1085', title: 'Synthetic Engine Oil 5W30 (4 Liters) + Filter', client: 'Over-the-Counter Customer', amount: 75, date: 'Today 11:00 AM', status: 'PAID', meta: 'Parts POS Invoice', tab: 'Spare Parts POS' },
        { id: 'rec-5', code: 'JC-1086', title: 'Fleet Vehicle Profile & Service History Log', client: 'Suzuki Swift VXL (ISB-1209)', amount: 190, date: 'Yesterday', status: 'LOGGED', meta: 'Chassis # NZE-99410', tab: 'Vehicles Registry' }
      ]
    },

    // 4. Clinic / Healthcare Center
    {
      id: 'clinic',
      name: 'Clinic / Healthcare Center',
      category: 'clinic',
      sector: 'HEALTHCARE',
      pricingWeight: 1.10,
      dedicatedHubView: 'clinic-hub',
      tagline: 'Outpatient OPD, Doctor Appointments & Digital Prescriptions',
      description: 'Complete outpatient medical management for polyclinics, featuring patient health records, doctor consultation schedules, and pharmacy links.',
      modules: [
        'OPD Token Queue System',
        'Patient Electronic Medical Records (EMR)',
        'Doctor Appointments & Duty Rosters',
        'Digital Rx Prescription Pad',
        'Diagnostic Pathology Lab Orders',
        'Clinic Cash & Consultation Billing',
        'Consultant Doctor Fee Split Calc',
        'Vital Signs & Triage Monitoring',
        'SMS Follow-up & Appointment Alerts',
        'Medical Pharmacy Inventory Dispense'
      ],
      kpis: [
        { label: 'OPD Patients Today', value: '68 Patients', subtext: 'Doctor consultations', tone: 'default' },
        { label: 'Doctor Specialists', value: '12 Doctors', subtext: 'On-duty shift roster', tone: 'emerald' },
        { label: 'Lab Scans Logged', value: '34 Tests', subtext: 'Diagnostic investigations', tone: 'blue' },
        { label: 'Avg Wait Duration', value: '11 Mins', subtext: 'OPD queue management', tone: 'amber' },
        { label: 'Clinic Consultations', value: '$8,450', subtext: 'Doctor fees collected', tone: 'default' }
      ],
      activeTab: 'Appointments',
      tabs: ['Appointments', 'Patients EMR', 'Doctor Rosters', 'Lab Investigations', 'Clinic Billing'],
      records: [
        { id: 'rec-1', code: 'OPD-8801', title: 'General Medicine & Cardiology Review', client: 'Haji Abdul Sattar (Age 62)', amount: 40, date: 'Today 10:00 AM', status: 'CONSULTED', meta: 'Dr. Tariq Mehmood', tab: 'Appointments' },
        { id: 'rec-2', code: 'OPD-8802', title: 'Pediatric Fever & Chest Infection Workup', client: 'Baby Ayan (Age 3)', amount: 35, date: 'Today 10:30 AM', status: 'IN_QUEUE', meta: 'Dr. Ayesha Alvi', tab: 'Appointments' },
        { id: 'rec-3', code: 'OPD-8803', title: 'Complete Blood Count (CBC) + Lipid Profile', client: 'Mrs. Nusrat Jahan', amount: 65, date: 'Today 11:00 AM', status: 'SAMPLE_COLLECTED', meta: 'Pathology Lab Desk', tab: 'Lab Investigations' },
        { id: 'rec-4', code: 'OPD-8804', title: 'Comprehensive EMR Health History File', client: 'Muhammad Farhan (MRN-1092)', amount: 50, date: 'Yesterday', status: 'ARCHIVED', meta: 'Diabetes Monitoring', tab: 'Patients EMR' },
        { id: 'rec-5', code: 'OPD-8805', title: 'Consultant Shift Settlement & Cash Closing', client: 'OPD Reception Counter # 1', amount: 1240, date: 'Today 02:00 PM', status: 'BALANCED', meta: 'Daily OPD Cash', tab: 'Clinic Billing' }
      ]
    },

    // 5. Hospital Management
    {
      id: 'hospital',
      name: 'Hospital Management',
      category: 'clinic',
      sector: 'HEALTHCARE',
      pricingWeight: 1.30,
      dedicatedHubView: 'clinic-hub',
      tagline: 'Inpatient (IPD), Emergency ER, Bed Allocation & Operation Theater',
      description: 'Full-scale hospital information system managing multi-floor wards, ICUs, emergency triage, surgical OT schedules, nursing stations, and discharge summaries.',
      modules: [
        'Inpatient IPD Admissions & Beds',
        'Emergency 24/7 ER Triage Intake',
        'Ward & Bed Allotment Management',
        'Operation Theater (OT) Surgical Roster',
        'Nursing Station Shift Handover Notes',
        'Radiology Scans & Diagnostic Imaging',
        'Patient Discharge Summary & Settlement',
        'Corporate & Panel Health Insurance',
        'Blood Bank & Donor Compatibility',
        'Biomedical Equipment & ICU Monitors'
      ],
      kpis: [
        { label: 'Bed Occupancy', value: '88% Occupied', subtext: '176 / 200 hospital beds', tone: 'default' },
        { label: 'Emergency Admissions', value: '28 Patients', subtext: '24-hour ER triage intake', tone: 'amber' },
        { label: 'Surgeries Scheduled', value: '11 OT Procedures', subtext: 'General & ortho theaters', tone: 'emerald' },
        { label: 'ICU / CCU Beds', value: '16 Active', subtext: 'Continuous cardiac monitors', tone: 'blue' },
        { label: 'Hospital IPD Inflow', value: '$84,900', subtext: 'Surgical & room settlements', tone: 'default' }
      ],
      activeTab: 'IPD Admissions',
      tabs: ['IPD Admissions', 'Emergency ER', 'Bed Allocation', 'Operation Theaters', 'Discharge & Billing'],
      records: [
        { id: 'rec-1', code: 'IPD-4401', title: 'Laparoscopic Cholecystectomy (OT 2)', client: 'Mrs. Parveen Akhtar (Bed W3-12)', amount: 1850, date: 'Today 08:00 AM', status: 'POST_OP', meta: 'Surgeon: Dr. M. Rizwan', tab: 'Operation Theaters' },
        { id: 'rec-2', code: 'IPD-4402', title: 'Acute Coronary Syndrome ICU Admission', client: 'Chaudhry Riaz (Bed ICU-04)', amount: 3200, date: 'Today 02:15 AM', status: 'CRITICAL_STABLE', meta: 'Dr. Shahzad (Cardiology)', tab: 'Emergency ER' },
        { id: 'rec-3', code: 'IPD-4403', title: 'Orthopedic Knee Replacement & Rehab', client: 'Brig. (R) Aslam Janjua', amount: 4500, date: 'Yesterday', status: 'DISCHARGE_PENDING', meta: 'Ward VIP-01', tab: 'IPD Admissions' },
        { id: 'rec-4', code: 'IPD-4404', title: 'Multi-Floor Bed Allocation & Oxygen Sensor Check', client: 'East Wing Floor 3 Wards', amount: 800, date: 'Today 07:00 AM', status: 'INSPECTED', meta: '48 Beds Active', tab: 'Bed Allocation' },
        { id: 'rec-5', code: 'IPD-4405', title: 'Corporate Insurance Discharge Settlement', client: 'State Life Panel (Case # 992)', amount: 2600, date: 'Yesterday', status: 'PAID', meta: 'Pre-Auth Cleared', tab: 'Discharge & Billing' }
      ]
    },

    // 6. Dental Clinic
    {
      id: 'dental',
      name: 'Dental Clinic',
      category: 'dental',
      sector: 'HEALTHCARE',
      pricingWeight: 1.05,
      tagline: 'Tooth Charting, Treatment Plans, Digital X-Rays & Dental Lab Orders',
      description: 'Specialized dental practice management with interactive tooth odontograms, orthodontic schedules, dental implant treatment tracking, and prosthetics lab orders.',
      modules: [
        'Interactive 32-Tooth Visual Charting',
        'Dental Procedure & Treatment Plans',
        'Digital X-Ray / Radiograph Storage',
        'Dental Lab Work Orders & Prosthetics',
        'Instrument Sterilization & Autoclave',
        'Dentist Chair Appointment Slots',
        'Treatment Installment Payment Plans',
        'Periodontal Pocket Depth Charting',
        'Automated Patient Recall SMS',
        'Dental Procedure Invoicing & Billing'
      ],
      kpis: [
        { label: 'Chairs Operating', value: '4 Operatories', subtext: 'Sterile surgical suites', tone: 'default' },
        { label: 'Active Treatments', value: '38 Active Plans', subtext: 'Root canals, crowns & braces', tone: 'emerald' },
        { label: 'Sterilization Checks', value: '100% Autoclaved', subtext: 'Hospital-grade infection control', tone: 'emerald' },
        { label: 'Dental Lab Orders', value: '14 Prosthetics', subtext: 'Zirconia crowns & bridges', tone: 'blue' },
        { label: 'Monthly Clinic Intake', value: '$22,400', subtext: 'Procedure & consult fees', tone: 'default' }
      ],
      activeTab: 'Tooth Charting',
      tabs: ['Tooth Charting', 'Procedure Plans', 'Dental Lab Cases', 'X-Ray Records', 'Dental Billing'],
      records: [
        { id: 'rec-1', code: 'DNT-601', title: 'Root Canal Therapy & Porcelain Crown (Tooth # 19)', client: 'Bilal Mustafa (Age 28)', amount: 260, date: 'Today 11:00 AM', status: 'STAGE_2_READY', meta: 'Dr. Zeeshan Haider (Endo)', tab: 'Procedure Plans' },
        { id: 'rec-2', code: 'DNT-602', title: 'Full Mouth Scaling & Deep Periodontal Curettage', client: 'Mrs. Shamim Bano (Age 54)', amount: 95, date: 'Today 12:30 PM', status: 'COMPLETED', meta: 'Chair # 1 (Hygienist)', tab: 'Tooth Charting' },
        { id: 'rec-3', code: 'DNT-603', title: 'Zirconia Bridge 3-Unit Fabrication Order', client: 'Apex Dental Lab Lahore', amount: 380, date: '2026-05-14', status: 'IN_FABRICATION', meta: 'Shade A2 Match', tab: 'Dental Lab Cases' },
        { id: 'rec-4', code: 'DNT-604', title: 'Digital OPG Panoramic Radiograph Scan', client: 'Usman Ali (Age 22)', amount: 45, date: 'Today 09:15 AM', status: 'ARCHIVED', meta: 'Wisdom Tooth Review', tab: 'X-Ray Records' },
        { id: 'rec-5', code: 'DNT-605', title: 'Orthodontic Braces Alignment Installment # 4', client: 'Miss Fatima Noor (Age 16)', amount: 150, date: 'Yesterday', status: 'PAID', meta: 'Monthly Adjustment', tab: 'Dental Billing' }
      ]
    },

    // 7. Pharmacy & Medical Store
    {
      id: 'pharmacy',
      name: 'Pharmacy & Medical Store',
      category: 'pharmacy',
      sector: 'HEALTHCARE',
      pricingWeight: 1.05,
      dedicatedHubView: 'pharmacy-hub',
      tagline: 'Batch & Expiry Control, Salt Formula Lookup, Prescription POS & Barcode',
      description: 'Pharmacy software with automated expiry alerts, narcotics register, distributor purchase orders, barcode checkout, and generic formula alternative match.',
      modules: [
        'Medicine & Generic Formula Catalog',
        'Batch Number & Expiry Date Tracker',
        'High-Speed Counter POS Billing',
        'Narcotic & Scheduled Drug Dispense Log',
        'Supplier Purchase Orders & Inwards',
        'Low Stock & Minimum Level Alerts',
        'Doctor Prescription Verification',
        'Distributor Ledger & Invoice Settlement',
        'Drug Interaction & Caution Warnings',
        'Daily Shift Cash Drawer Reconciliation'
      ],
      kpis: [
        { label: 'Medicine SKUs', value: '4,850 Formulas', subtext: 'Antibiotics, cardio, pediatric', tone: 'default' },
        { label: 'Expiry Alerts (<90d)', value: '18 Batches', subtext: 'Flagged for return to supplier', tone: 'amber' },
        { label: 'POS Counter Speed', value: '45 Secs / Bill', subtext: 'Barcode scan checkout', tone: 'emerald' },
        { label: 'Cold Chain Temp', value: '4.2°C Stored', subtext: 'Insulin & vaccine chillers', tone: 'blue' },
        { label: 'Pharmacy Daily Intake', value: '$6,800', subtext: 'Retail counter sales', tone: 'default' }
      ],
      activeTab: 'POS Sales',
      tabs: ['POS Sales', 'Medicine Catalog', 'Batch & Expiry', 'Supplier Orders', 'Daily Closing'],
      records: [
        { id: 'rec-1', code: 'RX-9901', title: 'Augmentin 625mg + Panadol CF (10 Strips)', client: 'Walk-in Cash Customer', amount: 32.5, date: '10 Mins Ago', status: 'DISPENSED', meta: 'Batch: AUG-2027A', tab: 'POS Sales' },
        { id: 'rec-2', code: 'RX-9902', title: 'Lantus Insulin Glargine Pen (2 Cartridges)', client: 'Dr. Hashmi Prescription Ref # 994', amount: 58, date: '25 Mins Ago', status: 'VERIFIED_DOCTOR', meta: 'Cold Chain 4°C Item', tab: 'POS Sales' },
        { id: 'rec-3', code: 'RX-9903', title: 'GlaxoSmithKline Distributor Stock Invoice', client: 'GSK Distribution Multan', amount: 2450, date: '2026-05-15', status: 'RECEIVED_STOCK', meta: 'PO # PHR-1092', tab: 'Supplier Orders' },
        { id: 'rec-4', code: 'RX-9904', title: 'Batch Expiry Near Warning Report (<60 Days)', client: 'Internal Quality Audit', amount: 420, date: 'Today 08:00 AM', status: 'RETURN_FLAGGED', meta: 'Supplier Replacement', tab: 'Batch & Expiry' },
        { id: 'rec-5', code: 'RX-9905', title: 'Generic Salt Matching: Paracetamol 500mg', client: 'Master Formula Registry', amount: 0, date: 'Yesterday', status: 'SYNCED', meta: '12 Brands Indexed', tab: 'Medicine Catalog' }
      ]
    },

    // 8. School / College Management
    {
      id: 'school_college',
      name: 'School / College Management',
      category: 'school',
      sector: 'EDUCATION',
      pricingWeight: 1.15,
      dedicatedHubView: 'school-hub',
      tagline: 'Student Enrollments, Biometrics, Fee Challans & Automated Report Cards',
      description: 'Full-featured school information system managing admissions, fee bank challan reconciliation, teacher rosters, exam mark sheets, and parent portal.',
      modules: [
        'Dynamic Classes & Sections (Nursery to Class 10)',
        'Computer & IT Lab Practical Suites & Terminal Roster',
        'STEM Robotics & Coding Academy Innovation Lab',
        'Live Classes & Interactive Virtual Rooms (WebRTC)',
        'Academic Curriculum & Chapter Syllabus Mapping',
        'Academic Wings & Grade Levels (Pre-Primary to Matric)',
        'Students Admission & Promotion Matrix',
        'Faculty & Staff HR Rosters & Class Allocations',
        'Teacher Faculty Portal with Live Gradebook & Rosters',
        'Biometric Attendance & RFID Gate Tracking',
        'Monthly Tuition Fee Challans & 1-Link Banking',
        'Exams, Report Cards, GPA & Grade Calculation',
        'Formal Character & School Leaving Certificates',
        'Lecture Timetable & Faculty Substitution Rosters',
        'Staff Monthly Payroll HRMS & Salary Slips',
        'Hostel, Dormitory & Mess Dining Allocation',
        'School Inventory & Lab Asset Procurement',
        'Student Health Clinic & Campus Infirmary',
        'Campus Visitors & Security Gate Pass System',
        'Alumni Network & Career Placement Directory',
        'Parents & Students Communication Portal & SMS Alerts',
        'Library Catalog, Barcode Circulation & Registry',
        'Transport Fleet Management & Student Bus Passes',
        'Multi-Campus Education Centralized Administration'
      ],
      kpis: [
        { label: 'Total Enrolled', value: '1,280 Students', subtext: 'Junior, Middle & Senior Wings', tone: 'default' },
        { label: 'Challan Collection', value: '94.8% Paid', subtext: 'May 2026 monthly billing', tone: 'emerald' },
        { label: 'Staff Present Today', value: '78 / 82 Teachers', subtext: 'Biometric gate logging', tone: 'blue' },
        { label: 'Term Exams Active', value: 'Final Term Exams', subtext: 'Grading rosters active', tone: 'amber' },
        { label: 'Monthly Fee Volume', value: '$52,000', subtext: 'Direct bank challan intake', tone: 'default' }
      ],
      activeTab: 'Live Classes',
      tabs: ['Live Classes', 'Fee Challans', 'Students Directory', 'Attendance Biometrics', 'Exams & Results', 'Timetables', 'Certificates & IDs'],
      records: [
        { id: 'rec-0', code: 'LIVE-901', title: 'Live Interactive Lecture: Advanced Mathematics & Calculus', client: 'Grade 10 Matriculation Cohort', amount: 0, date: 'Live Now', status: 'BROADCASTING', meta: 'WebRTC Studio Active', tab: 'Live Classes' },
        { id: 'rec-1', code: 'SCH-801', title: 'Monthly Tuition Challan (Class 9-A & 9-B)', client: '84 Students (HBL Bank Link)', amount: 16800, date: '2026-05-01', status: 'COLLECTED', meta: 'Bank 1-Link API', tab: 'Fee Challans' },
        { id: 'rec-2', code: 'SCH-802', title: 'Final Term Result Cards Generation & Ranking', client: 'Class 10 Matriculation Cohort', amount: 0, date: '2026-05-18', status: 'GRADES_COMPILED', meta: 'Principal Signature Req', tab: 'Exams & Results' },
        { id: 'rec-3', code: 'SCH-803', title: 'Biometric RFID Turnstile Gate Synchronization', client: 'All Senior School Students', amount: 0, date: 'Today 08:05 AM', status: 'SYNCED', meta: '0 Exceptions Reported', tab: 'Attendance Biometrics' },
        { id: 'rec-4', code: 'SCH-804', title: 'New Student Admission & Document Verification', client: 'Master Daniyal Raza (Grade 6)', amount: 250, date: 'Yesterday', status: 'ENROLLED', meta: 'Admission Fee Paid', tab: 'Students Directory' },
        { id: 'rec-5', code: 'SCH-805', title: 'Weekly Faculty Lecture Substitution Roster', client: 'Senior Science Faculty', amount: 0, date: 'Today 07:45 AM', status: 'DEPLOYED', meta: 'Physics Lab Period 3', tab: 'Timetables' },
        { id: 'rec-6', code: 'CERT-806', title: 'Official Character & School Leaving Certificate', client: 'Hamza Tariq (Grade 10 Passed)', amount: 15, date: 'Today', status: 'ISSUED', meta: 'Principal Stamped', tab: 'Certificates & IDs' }
      ]
    },

    // 9. Coaching & Training Center
    {
      id: 'coaching_center',
      name: 'Coaching & Training Center',
      category: 'school',
      sector: 'EDUCATION',
      pricingWeight: 0.95,
      tagline: 'Cohort Batches, MDCAT/ECAT Mock Tests, Tuition Cards & Lecture Schedules',
      description: 'Academy ERP designed for test prep institutes, evening academies, and professional certifications with batch attendance and automated parent progress alerts.',
      modules: [
        'Study Batches & Cohort Schedules',
        'Student Registration & Enrollments',
        'Mock Test Series & Instant Grading',
        'Daily Roll Call & Biometric Entry',
        'Faculty Lecture Rosters & Hours',
        'Monthly Academy Tuition Challans',
        'Study Notes & PDF Learning Portal',
        'Batch Academic Performance Analytics',
        'Parent SMS Notification Engine',
        'Admission Inquiry & Lead CRM'
      ],
      kpis: [
        { label: 'Active Batches', value: '16 Evening Groups', subtext: 'MDCAT, ECAT & O/A Levels', tone: 'default' },
        { label: 'Candidates Enrolled', value: '460 Students', subtext: 'Summer intensive cohorts', tone: 'emerald' },
        { label: 'Mock Test Sessions', value: '8 Tests / Week', subtext: 'OMR automated grading', tone: 'blue' },
        { label: 'Tuition Fee Recovery', value: '98.2%', subtext: 'Digital voucher settlement', tone: 'emerald' },
        { label: 'Academy Gross Intake', value: '$18,400', subtext: 'Course session retainers', tone: 'default' }
      ],
      activeTab: 'Mock Test Series',
      tabs: ['Mock Test Series', 'Study Batches', 'Candidate Registry', 'Tuition Fees', 'Lecture Schedules'],
      records: [
        { id: 'rec-1', code: 'COA-201', title: 'MDCAT Grand Mock Exam # 4 (Biology & Chemistry)', client: 'Evening Batch Gamma (120 Students)', amount: 3600, date: '2026-05-16', status: 'GRADES_POSTED', meta: 'OMR Sheet Scanning', tab: 'Mock Test Series' },
        { id: 'rec-2', code: 'COA-202', title: 'Summer Fast-Track Physics Cohort Enrollment', client: '45 Pre-Engineering Candidates', amount: 6750, date: '2026-05-10', status: 'BATCH_FULL', meta: 'Prof. Junaid Khan', tab: 'Study Batches' },
        { id: 'rec-3', code: 'COA-203', title: 'Monthly Tuition Card Clearance (Batch Beta)', client: '88 Candidates', amount: 4400, date: '2026-05-05', status: 'COLLECTED', meta: 'Tuition Card Stamp', tab: 'Tuition Fees' },
        { id: 'rec-4', code: 'COA-204', title: 'Candidate Profile & Diagnostic Test Dossier', client: 'Hamza Tariq (Roll # MDC-441)', amount: 150, date: 'Yesterday', status: 'ENROLLED', meta: 'Merit Seat Confirmed', tab: 'Candidate Registry' },
        { id: 'rec-5', code: 'COA-205', title: 'Special Weekend Chemistry Problem Solving Lecture', client: 'A-Level Chemistry Students', amount: 0, date: 'Today 03:00 PM', status: 'SCHEDULED', meta: 'Lecture Hall 1', tab: 'Lecture Schedules' }
      ]
    },

    // 10. eCommerce / Online Store
    {
      id: 'ecommerce',
      name: 'eCommerce / Online Store',
      category: 'ecommerce',
      sector: 'COMMERCE',
      pricingWeight: 1.05,
      tagline: 'Catalog CMS, Express Checkout, Multi-Courier Tracking & Abandoned Carts',
      description: 'Digital storefront engine with automated courier API waybill generation, stock variant matrix, discount campaigns, and abandoned cart recovery.',
      modules: [
        'Online Web Storefront CMS',
        'Live Customer Order Processing',
        'Product Variants & SKU Control',
        'Cart & One-Page Express Checkout',
        'Courier API Shipping & Live Tracking',
        'Promotional Coupons & Flash Deals',
        'Customer Verified Reviews & Ratings',
        'Abandoned Cart Automated Recovery',
        'Multi-Currency & Local Gateways',
        'Marketplace Multi-Vendor Sync'
      ],
      kpis: [
        { label: 'Today Online Orders', value: '148 Orders', subtext: 'Cash on delivery & cards', tone: 'default' },
        { label: 'Dispatch Speed', value: '3.2 Hours', subtext: 'Order to courier handoff', tone: 'emerald' },
        { label: 'Cart Conversion', value: '4.8% Checkout', subtext: 'Industry benchmark: 2.5%', tone: 'emerald' },
        { label: 'Courier In-Transit', value: '72 Parcels', subtext: 'TCS, Leopards, Trax sync', tone: 'blue' },
        { label: 'Web Store Intake', value: '$34,900', subtext: 'Weekly GMV volume', tone: 'default' }
      ],
      activeTab: 'Live Web Orders',
      tabs: ['Live Web Orders', 'Catalog & SKUs', 'Cart & Checkout', 'Courier Shipping', 'Coupons & Deals'],
      records: [
        { id: 'rec-1', code: 'ORD-9041', title: 'Premium Leather Briefcase (Dark Tan) + Wallet', client: 'Mrs. Sabeen Shah (Lahore DHA)', amount: 185, date: '15 Mins Ago', status: 'PACKED_READY', meta: 'TCS Waybill # 992140', tab: 'Live Web Orders' },
        { id: 'rec-2', code: 'ORD-9042', title: 'Wireless Noise Canceling Headphones (Midnight Black)', client: 'Kashif Mehmood (Islamabad F-10)', amount: 120, date: '35 Mins Ago', status: 'COURIER_TRANSIT', meta: 'COD: $120.00', tab: 'Courier Shipping' },
        { id: 'rec-3', code: 'ORD-9043', title: 'Flash Deal 20% Discount Code Activation (SUMMER26)', client: 'Storewide Promotional Campaign', amount: 0, date: '2026-05-18', status: 'ACTIVE', meta: '142 Uses Logged', tab: 'Coupons & Deals' },
        { id: 'rec-4', code: 'ORD-9044', title: 'Automated WhatsApp Abandoned Cart Recovery Link', client: 'Usama Qureshi (Cart # 8821)', amount: 95, date: 'Today 01:10 PM', status: 'CONVERTED', meta: 'Recovered via SMS Link', tab: 'Cart & Checkout' },
        { id: 'rec-5', code: 'ORD-9045', title: 'Product SKU Matrix: 8 Sizes & 4 Colors Synced', client: 'Summer Linen Collection', amount: 0, date: 'Yesterday', status: 'IN_STOCK', meta: '32 Variations Live', tab: 'Catalog & SKUs' }
      ]
    },

    // 11. Retail Shop & Point of Sale
    {
      id: 'retail_shop',
      name: 'Retail Shop & Point of Sale',
      category: 'store',
      sector: 'COMMERCE',
      pricingWeight: 1.00,
      dedicatedHubView: 'retail-pos',
      tagline: 'High-Speed Barcode Checkout, Multi-Tier Pricing & Cash Drawer Audit',
      description: 'Complete point-of-sale solution for general merchants, specialty boutiques, and retail franchises with thermal receipt printing and vendor purchase orders.',
      modules: [
        'Barcode Automation & Scanning',
        'Fast Cash & Card POS Terminal',
        'Multi-Shelf Inventory & Stock Count',
        'Purchase Orders & Supplier Inwards',
        'Customer Loyalty & Reward Points',
        'Item Returns & Refund Notes',
        'Tiered Price Lists & Bulk Wholesale',
        'Low Stock Automated Reorder Alerts',
        'Multi-Store Branch Stock Transfer',
        'Daily Cash Drawer Balancing'
      ],
      kpis: [
        { label: 'Active POS Lanes', value: '3 Counters Open', subtext: 'Barcode terminal sync', tone: 'default' },
        { label: 'Today Checkout Items', value: '820 Products', subtext: 'Average basket: 4.2 items', tone: 'emerald' },
        { label: 'Stock Valuation', value: '$42,500', subtext: 'Wholesale inventory basis', tone: 'blue' },
        { label: 'Cash Drawer Variance', value: '$0.00 Balanced', subtext: 'Shift cash reconciled', tone: 'emerald' },
        { label: 'Daily Retail Gross', value: '$4,850', subtext: 'Cash & card receipts', tone: 'default' }
      ],
      activeTab: 'POS Terminal',
      tabs: ['POS Terminal', 'Stock Inventory', 'Barcode & Labeling', 'Customer Loyalty', 'Purchase Orders'],
      records: [
        { id: 'rec-1', code: 'POS-7711', title: 'Counter POS Sale: 6 Apparel Items (Thermal Print)', client: 'Walk-in Retail Shopper', amount: 94, date: '5 Mins Ago', status: 'PAID_CASH', meta: 'Counter # 1 Receipt', tab: 'POS Terminal' },
        { id: 'rec-2', code: 'POS-7712', title: 'Vendor Stock Inward: 200 Pairs Denim Jeans', client: 'Master Apparel Suppliers', amount: 1600, date: 'Today 09:00 AM', status: 'STOCKED', meta: 'PO # RTL-4412', tab: 'Purchase Orders' },
        { id: 'rec-3', code: 'POS-7713', title: 'Barcode Label Batch Generation (Code-128)', client: 'Footwear Department Items', amount: 0, date: 'Today 08:30 AM', status: 'PRINTED', meta: '450 Stickers Printed', tab: 'Barcode & Labeling' },
        { id: 'rec-4', code: 'POS-7714', title: 'Loyalty Reward Points Redemption (500 Pts)', client: 'Mrs. Rabia Tariq (Loyalty # 204)', amount: 25, date: 'Today 11:30 AM', status: 'REDEEMED', meta: 'Discount Applied', tab: 'Customer Loyalty' },
        { id: 'rec-5', code: 'POS-7715', title: 'Low Stock Auto-Alert: 12 SKUs Under Minimum', client: 'Store Inventory Engine', amount: 820, date: 'Today 07:00 AM', status: 'REORDER_READY', meta: 'Auto PO Generated', tab: 'Stock Inventory' }
      ]
    },

    // 12. Super Mart & Grocery
    {
      id: 'super_mart',
      name: 'Super Mart & Grocery',
      category: 'store',
      sector: 'COMMERCE',
      pricingWeight: 1.10,
      tagline: 'Multi-Lane Scanning, Weighing Scales, Fresh Produce Expiry & Aisle Stock',
      description: 'High-throughput supermarket ERP integrating electronic weight scales, aisle shelf inventory, fresh bakery/produce expiry control, and FMCG supplier EDI.',
      modules: [
        'Multi-Lane Fast Retail POS',
        'Digital Weighing Scale Barcode Sync',
        'High-Volume Barcode Scanner Support',
        'Multi-Aisle Shelf Rack Stock Tracker',
        'Fresh Produce, Dairy & Bakery Expiry',
        'Automated Supplier Requisitions',
        'Loyalty Membership Card Points',
        'Bundle Deal & Buy-1-Get-1 Modifiers',
        'Daily Cash Counter Closing Audit',
        'FBR Sales Tax & VAT Invoicing'
      ],
      kpis: [
        { label: 'Lanes Active', value: '6 Checkout Lanes', subtext: 'High-throughput queues', tone: 'default' },
        { label: 'Weighing Scale Items', value: '340 Fresh Weighed', subtext: 'Fruits, poultry, bakery', tone: 'emerald' },
        { label: 'Aisles Monitored', value: '18 Supermarket Aisles', subtext: 'FMCG, dry food, frozen', tone: 'blue' },
        { label: 'Daily Transaction Vol', value: '1,450 Bills', subtext: 'Saturday peak shopping', tone: 'emerald' },
        { label: 'Store Daily Turnover', value: '$38,200', subtext: 'Gross supermarket sales', tone: 'default' }
      ],
      activeTab: 'Multi-Lane POS',
      tabs: ['Multi-Lane POS', 'Aisle Shelf Stock', 'Weighing Scales', 'Purchase Requisitions', 'Cash Drawer'],
      records: [
        { id: 'rec-1', code: 'SM-201', title: 'Lane 3 Cart: 18 FMCG Grocery Items + Meat Weighment', client: 'Family Cart Checkout', amount: 148.5, date: 'Just Now', status: 'CHECKED_OUT', meta: 'Lane 3 (Cashier: Zain)', tab: 'Multi-Lane POS' },
        { id: 'rec-2', code: 'SM-202', title: 'Digital Scale Barcode Sync (Fresh Bananas & Apples)', client: 'Produce Section Weighing Scale # 2', amount: 14.2, date: '10 Mins Ago', status: 'PRINTED_TAG', meta: 'Weight: 3.45 Kg', tab: 'Weighing Scales' },
        { id: 'rec-3', code: 'SM-203', title: 'Dairy & Milk Expiry Check (Near Expiry Re-pricing)', client: 'Chilled Dairy Aisle # 4', amount: 320, date: 'Today 06:00 AM', status: 'INSPECTED', meta: '15 Cartons Flagged', tab: 'Aisle Shelf Stock' },
        { id: 'rec-4', code: 'SM-204', title: 'Beverage & Cold Drinks Requisition (400 Crates)', client: 'Coca-Cola Beverages Pakistan', amount: 5600, date: '2026-05-17', status: 'PO_SENT', meta: 'Central Depot Delivery', tab: 'Purchase Requisitions' },
        { id: 'rec-5', code: 'SM-205', title: 'Night Cash Drawer Settlement: All 6 Lanes', client: 'Chief Accountant Closing', amount: 38200, date: 'Yesterday', status: 'RECONCILED', meta: 'Bank Deposit Prepared', tab: 'Cash Drawer' }
      ]
    },

    // 13. Wholesale & Distribution
    {
      id: 'wholesale_distribution',
      name: 'Wholesale & Distribution',
      category: 'store',
      sector: 'COMMERCE',
      pricingWeight: 1.10,
      tagline: 'Master Depots, Van Route Sales, Bulk Orders & Dealer Credit Limits',
      description: 'Supply chain management software with dealer ledgers, consignment manifests, credit limit enforcement, master warehouse bin locations, and route sales.',
      modules: [
        'B2B Bulk Purchase Order Intake',
        'Master Central Warehouse Depots',
        'Dealer & Distributor Account Ledgers',
        'Credit Limits & Aging Debt Enforcement',
        'Freight Loading Manifests & Waybills',
        'Van Sales Route Planning & Stock',
        'Volume Discount & Commission Schemes',
        'Pallet & Master Carton Tracking',
        'Batch Stock Auto-Reorder Levels',
        'Supplier Invoice Clearing & Banking'
      ],
      kpis: [
        { label: 'Authorized Dealers', value: '185 Wholesalers', subtext: 'Active credit ledgers', tone: 'default' },
        { label: 'Van Sales Fleet', value: '12 Delivery Vans', subtext: 'Daily market route delivery', tone: 'emerald' },
        { label: 'Pallets Stored', value: '3,200 Master Pallets', subtext: 'Central logistics depot', tone: 'blue' },
        { label: 'Dealer Aging Overdue', value: '2.1% Low Risk', subtext: 'Strict credit lock active', tone: 'emerald' },
        { label: 'B2B Weekly Turnover', value: '$124,000', subtext: 'Bulk consignment billing', tone: 'default' }
      ],
      activeTab: 'B2B Bulk Orders',
      tabs: ['B2B Bulk Orders', 'Warehouse Depots', 'Dealer Ledgers', 'Van Route Planning', 'Freight Manifests'],
      records: [
        { id: 'rec-1', code: 'WS-501', title: 'FMCG Bulk Delivery Consignment (1,200 Cartons)', client: 'Al-Madina Cash & Carry Faisalabad', amount: 18400, date: '2026-05-16', status: 'DISPATCHED', meta: 'Truck Fleet # 04', tab: 'B2B Bulk Orders' },
        { id: 'rec-2', code: 'WS-502', title: 'Beverage Crate Consignment (600 Cases)', client: 'Modern Traders Rawalpindi', amount: 9600, date: '2026-05-14', status: 'INVOICED_CREDIT', meta: 'Credit Term: 15 Days', tab: 'Dealer Ledgers' },
        { id: 'rec-3', code: 'WS-503', title: 'Consumer Electronics Cartons (200 Units)', client: 'Metro Electronics Mart', amount: 24500, date: '2026-05-10', status: 'PAID_BANK', meta: 'Bank Pay Order', tab: 'B2B Bulk Orders' },
        { id: 'rec-4', code: 'WS-504', title: 'Van Route 4: Saddar & Commercial Market Orders', client: 'Van Driver: Tariq Mahmood', amount: 5800, date: 'Today 07:30 AM', status: 'ROUTE_ACTIVE', meta: '22 Shop Drop-offs', tab: 'Van Route Planning' },
        { id: 'rec-5', code: 'WS-505', title: 'Master Warehouse Pallet Relocation to Bay 14', client: 'Depot Team Forklift # 2', amount: 0, date: 'Today 10:00 AM', status: 'STOCKED', meta: '40 Pallets Cleared', tab: 'Warehouse Depots' }
      ]
    },

    // 14. Restaurant & Fine Dine
    {
      id: 'restaurant_cafe',
      name: 'Restaurant & Fine Dine',
      category: 'restaurant',
      sector: 'HOSPITALITY',
      pricingWeight: 1.10,
      dedicatedHubView: 'restaurant-hub',
      tagline: 'Table Floor Plans, Kitchen Display (KDS), Recipe Costing & POS',
      description: 'Full food and beverage suite managing table occupancy, captain waiter tablets, live kitchen display screens, recipe ingredient deduction, and split bills.',
      modules: [
        'Interactive Table Floor Plan & Status',
        'Kitchen Display System (KDS) Screen',
        'Menu Item Modifiers & Recipe Cards',
        'Raw Meat & Vegetable Inventory',
        'Waiter Tablet Mobile Ordering App',
        'Dine-In, Takeaway & Home Delivery',
        'Bill Splitting & Service Charge Calc',
        'Customer Dining Feedback & Ratings',
        'Daily Food Costing & Portion Analysis',
        'Foodpanda / Delivery Partner Order Sync'
      ],
      kpis: [
        { label: 'Tables Occupied', value: '18 / 24 Tables', subtext: 'Dining hall & rooftop patio', tone: 'default' },
        { label: 'Average Prep Time', value: '14 Mins', subtext: 'Kitchen ticket to table speed', tone: 'emerald' },
        { label: 'Daily Covers Billed', value: '280 Meals', subtext: 'Dine-in, takeaway & delivery', tone: 'blue' },
        { label: 'Food Cost Ratio', value: '29.2%', subtext: 'Recipe portioning control', tone: 'amber' },
        { label: 'F&B Gross Intake', value: '$8,950', subtext: 'Shift receipts', tone: 'default' }
      ],
      activeTab: 'Table Floor Plan',
      tabs: ['Table Floor Plan', 'Kitchen KDS', 'Menu Catalog', 'Inventory Deductions', 'Shift Closing'],
      records: [
        { id: 'rec-1', code: 'TBL-04', title: 'Grilled Beef Steak + Wild Mushroom Risotto', client: 'Table 4 (4 Guests)', amount: 84.5, date: 'Just Now', status: 'KITCHEN_COOKING', meta: 'Captain: Haris', tab: 'Table Floor Plan' },
        { id: 'rec-2', code: 'TBL-08', title: 'Creamy Alfredo Fettuccine & Caesar Salad', client: 'Table 8 (2 Guests)', amount: 48, date: '5 mins ago', status: 'SERVED', meta: 'Captain: Zeeshan', tab: 'Table Floor Plan' },
        { id: 'rec-3', code: 'KDS-901', title: 'Kitchen KOT # 14: Chicken Parmigiana & Mocktails', client: 'Kitchen Station: Grill & Fryer', amount: 62, date: '8 Mins Ago', status: 'ON_FIRE', meta: 'Chef Ticket # 88', tab: 'Kitchen KDS' },
        { id: 'rec-4', code: 'INV-301', title: 'Daily Beef Tenderloin & Olive Oil Deductions', client: 'Raw Stock Cold Room', amount: 420, date: 'Today 03:00 PM', status: 'DEDUCTED', meta: 'Portion Control Verified', tab: 'Inventory Deductions' },
        { id: 'rec-5', code: 'CSH-101', title: 'Evening Dining Shift Cash Register Balance', client: 'F&B Cashier Desk # 1', amount: 8950, date: 'Yesterday', status: 'AUDITED', meta: 'Service Tax Cleared', tab: 'Shift Closing' }
      ]
    },

    // 15. Pizza & Fast Food POS
    {
      id: 'pizza_fastfood',
      name: 'Pizza & Fast Food POS',
      category: 'restaurant',
      sector: 'HOSPITALITY',
      pricingWeight: 1.10,
      dedicatedHubView: 'restaurant-hub',
      tagline: 'Custom Crusts, Toppings, Live Oven Baking Queue & Delivery Dispatch',
      description: 'Dedicated pizzeria and fast food restaurant suite featuring customizable crust/topping modifiers, half-and-half deals, oven queue timers, and rider delivery dispatch.',
      modules: [
        'Custom Crust & Topping Builder',
        'Live Pizza Oven Queue Timer',
        'Counter Fast-Order POS & Tokens',
        'Delivery Rider Dispatch & Tracking',
        'Deal Combos & Flavor Half/Half',
        'Raw Dough & Cheese Inventory Stock',
        'Kitchen Order Ticket (KOT) Printing',
        'Takeaway & Pickup Call Board',
        'Customer Phone Order Caller ID CRM',
        'Daily Shift Cash Drawer Balance'
      ],
      kpis: [
        { label: 'Active Oven Bakes', value: '14 Pizzas', subtext: 'Woodfire & conveyor ovens', tone: 'default' },
        { label: 'Avg Baking Speed', value: '8.5 Mins', subtext: 'Preparation to box', tone: 'emerald' },
        { label: 'Riders on Delivery', value: '9 Couriers', subtext: 'Real-time GPS dispatch', tone: 'blue' },
        { label: 'Today Pizza Slices', value: '410 Boxes', subtext: 'Takeaway, dine-in & delivery', tone: 'amber' },
        { label: 'Daily Shift Revenue', value: '$6,420', subtext: 'Cash & card settlements', tone: 'default' }
      ],
      activeTab: 'Live Oven Queue',
      tabs: ['Live Oven Queue', 'Counter Fast POS', 'Rider Delivery Dispatch', 'Deal Combos', 'Ingredient Stock'],
      records: [
        { id: 'rec-1', code: 'PIZ-101', title: 'Large Stuffed Crust Pepperoni Feast + Extra Cheese', client: 'Delivery: F-7/2 Islamabad', amount: 28.5, date: '4 mins ago', status: 'IN_OVEN', meta: 'Rider: Kamran Assigned', tab: 'Live Oven Queue' },
        { id: 'rec-2', code: 'PIZ-102', title: 'Twin Medium Fajita Sicilian + 1.5L Beverage Deal', client: 'Takeaway Counter # 14', amount: 34, date: '10 mins ago', status: 'BOXED_READY', meta: 'Customer Token # 38', tab: 'Counter Fast POS' },
        { id: 'rec-3', code: 'PIZ-103', title: 'Thin Crust Margherita + Buffalo Wings & Dips', client: 'Table 3 (Dine-in)', amount: 22, date: '15 mins ago', status: 'DELIVERED_TABLE', meta: 'Paid via Card POS', tab: 'Counter Fast POS' },
        { id: 'rec-4', code: 'PIZ-104', title: 'Fast-Food Deal # 4: 2 Zinger Burgers + 1 Medium Pizza', client: 'Phone Order: Sector G-11', amount: 32, date: '20 Mins Ago', status: 'DISPATCHED', meta: 'Rider Waqar Out', tab: 'Rider Delivery Dispatch' },
        { id: 'rec-5', code: 'PIZ-105', title: 'Mozzarella Cheese & Pizza Dough Ball Deduction', client: 'Pizzeria Kitchen Stock', amount: 380, date: 'Today 04:00 PM', status: 'DEDUCTED', meta: '80 Dough Balls Baked', tab: 'Ingredient Stock' }
      ]
    },

    // 16. Hotel & Hospitality
    {
      id: 'hotel_hospitality',
      name: 'Hotel & Hospitality',
      category: 'hotel',
      sector: 'HOSPITALITY',
      pricingWeight: 1.15,
      dedicatedHubView: 'hotel-hub',
      tagline: 'Room Bookings, Front Desk Check-in, Housekeeping & Deposits',
      description: 'Hotel property management system for boutique hotels, guest lodges, and resorts tracking room cleaning status, keycards, and folio billing.',
      modules: [
        'Interactive Room Booking Grid',
        'Guest Front Desk Check-in / Out',
        'RFID Room Key Card Integration',
        'Housekeeping Clean & Dirty Room Status',
        'Guest Folio Ledger & Deposits',
        'Banquet & Wedding Hall Booking',
        'Mini-Bar & Room Service Food POS',
        'Night Audit Automated Roll',
        'OTA Channel Manager Link (Booking/Agoda)',
        'Corporate & VIP Guest Negotiated Rates'
      ],
      kpis: [
        { label: 'Room Occupancy', value: '86% Booked', subtext: '43 / 50 Executive Suites', tone: 'default' },
        { label: 'Today Arrivals', value: '12 Check-ins', subtext: 'VIP corporate & tourism guests', tone: 'emerald' },
        { label: 'Housekeeping Status', value: 'Clean & Ready', subtext: '38 suites inspected', tone: 'blue' },
        { label: 'Avg Room Rate (ADR)', value: '$145/night', subtext: 'Standard & deluxe rooms', tone: 'amber' },
        { label: 'Hotel Booking Revenue', value: '$46,200', subtext: 'Weekly reservation volume', tone: 'default' }
      ],
      activeTab: 'Room Grid',
      tabs: ['Room Grid', 'Front Desk Check-in', 'Housekeeping Schedule', 'Guest Folios', 'Amenity Rentals'],
      records: [
        { id: 'rec-1', code: 'HTL-301', title: 'Executive Presidential Suite (3 Nights)', client: 'Sheikh Tariq Al-Hussain', amount: 850, date: 'Today Check-in', status: 'CHECKED_IN', meta: 'Room 501 (VIP Service)', tab: 'Front Desk Check-in' },
        { id: 'rec-2', code: 'HTL-302', title: 'Deluxe King City View Room (2 Nights)', client: 'Dr. Shahzad & Family', amount: 320, date: 'Today Check-in', status: 'CONFIRMED', meta: 'Room 304', tab: 'Room Grid' },
        { id: 'rec-3', code: 'HTL-303', title: 'Housekeeping Inspection: Floor 4 Suites Cleaned', client: 'Housekeeping Team Alpha', amount: 0, date: 'Today 11:30 AM', status: 'INSPECTED', meta: '12 Rooms Sanitized', tab: 'Housekeeping Schedule' },
        { id: 'rec-4', code: 'HTL-304', title: 'Guest Folio Settlement & Mini-Bar Charges', client: 'Mr. David Miller (Room 402)', amount: 480, date: 'Yesterday', status: 'PAID', meta: 'Card Settlement', tab: 'Guest Folios' },
        { id: 'rec-5', code: 'HTL-305', title: 'Banquet Hall Reservation (Corporate Dinner)', client: 'Engro Fertilizers Conference', amount: 2400, date: '2026-05-22', status: 'ADVANCE_PAID', meta: 'Marquee 1 Reserved', tab: 'Amenity Rentals' }
      ]
    },

    // 17. Travel & Tourism Agency
    {
      id: 'travel_tourism',
      name: 'Travel & Tourism Agency',
      category: 'travel',
      sector: 'HOSPITALITY',
      pricingWeight: 1.15,
      dedicatedHubView: 'travel-hub',
      tagline: 'Visa Applications, Official Hotel Vouchers, Umrah & Tour Packages',
      description: 'Our full-fledged travel and tourism operations platform with embassy visa dossier pipeline, verified hotel vouchers, flight ticketing, and holiday packages.',
      modules: [
        'Visa Applications & Embassy Tracker',
        'Official Embassy Hotel Vouchers',
        'Holiday & Umrah Tour Packages',
        'Customer Dossiers & Passport Vault',
        'Partner Hotel Contracted Inventory',
        'Flight PNR Ticketing Records',
        'Sub-Agent B2B Commission Ledger',
        'Travel Insurance Policy Generation',
        'Visa Biometric Appointment Scheduler',
        'WhatsApp Traveler Notification Alerts'
      ],
      kpis: [
        { label: 'Visa Dossiers', value: '142 Active', subtext: 'Schengen, UK, Turkey, Umrah', tone: 'default' },
        { label: 'Hotel Vouchers', value: '38 Issued', subtext: 'Confirmed tourist bookings', tone: 'emerald' },
        { label: 'Tour Packages', value: '9 Published', subtext: 'Azerbaijan, Turkey, Dubai', tone: 'blue' },
        { label: 'Approval Rate', value: '97.4%', subtext: 'Embassy verification score', tone: 'emerald' },
        { label: 'Travel Gross Booking', value: '$118,500', subtext: 'Ticketing & visa intake', tone: 'default' }
      ],
      activeTab: 'Visa Dossiers',
      tabs: ['Visa Dossiers', 'Hotel Vouchers', 'Tour Packages', 'Flight Bookings', 'Partner Hotels'],
      records: [
        { id: 'rec-1', code: 'TRV-901', title: 'UK Standard 6-Month Visitor Visa Dossier', client: 'Kamran Siddiqui & Spouse', amount: 480, date: '2026-05-18', status: 'EMBASSY_SUBMITTED', meta: 'VFS Global Track: UK9941', tab: 'Visa Dossiers' },
        { id: 'rec-2', code: 'TRV-902', title: 'Sultanahmet Palace Hotel Official Embassy Voucher', client: 'Farhan Qureshi (Istanbul Tour)', amount: 620, date: '2026-05-15', status: 'VOUCHER_ISSUED', meta: '6 Nights Confirmed', tab: 'Hotel Vouchers' },
        { id: 'rec-3', code: 'TRV-903', title: 'VIP Umrah Package 14-Days (Swissotel Makkah)', client: 'Haji Munir Family (4 Pax)', amount: 4200, date: '2026-05-10', status: 'CONFIRMED', meta: 'Visa + Flights + Vouchers', tab: 'Tour Packages' },
        { id: 'rec-4', code: 'TRV-904', title: 'Round-Trip Flight Ticket Booking (PK-785 / PK-786)', client: 'Islamabad to London Heathrow', amount: 1450, date: 'Yesterday', status: 'TICKETED', meta: 'PNR: 88QW2L', tab: 'Flight Bookings' },
        { id: 'rec-5', code: 'TRV-905', title: 'Partner Hotel Contract Rate Renewal (Swissôtel Clock Tower)', client: 'Makkah Hospitality Group', amount: 0, date: '2026-05-01', status: 'ACTIVE', meta: 'B2B Wholesale Rate', tab: 'Partner Hotels' }
      ]
    },

    // 18. Beauty Salon & Spa
    {
      id: 'salon_spa',
      name: 'Beauty Salon & Spa',
      category: 'salon',
      sector: 'SERVICES',
      pricingWeight: 1.00,
      dedicatedHubView: 'salon-hub',
      tagline: 'Beautician Rosters, Bridal Makeovers, Staff Commissions & Booking Slots',
      description: 'Salon and luxury wellness spa management with specialist beautician booking, consumable cosmetic stock deductions, bridal packages, and commissions.',
      modules: [
        'Service Menu & Rate Card Directory',
        'Beautician Appointment Scheduling',
        'Staff Duty Shift & Station Rosters',
        'Bridal & Party Makeover Packages',
        'Salon Beauty Products POS & Retail',
        'Staff Service Commission Calculation',
        'Client Loyalty Memberships & Points',
        'Automated SMS Booking Confirmations',
        'Consumable Cosmetics Usage Stock',
        'Daily Salon Cash Drawer Register'
      ],
      kpis: [
        { label: 'Today Appointments', value: '24 Bookings', subtext: 'Hair, bridal & skin facial', tone: 'default' },
        { label: 'Beauticians On-Duty', value: '8 Specialists', subtext: 'Stations fully booked', tone: 'emerald' },
        { label: 'Bridal Packages Active', value: '6 Bridal Deals', subtext: 'May & June wedding season', tone: 'blue' },
        { label: 'Product Retail Sales', value: '$840 / day', subtext: 'Serums, shampoos, creams', tone: 'amber' },
        { label: 'Salon Daily Turnover', value: '$3,800', subtext: 'Service + retail receipts', tone: 'default' }
      ],
      activeTab: 'Appointments',
      tabs: ['Appointments', 'Service Menu', 'Staff Rosters', 'Staff Commissions', 'Packages & Deals'],
      records: [
        { id: 'rec-1', code: 'SAL-101', title: 'Signature Bridal Makeover + Hair Styling', client: 'Miss Hira Shahzad (Wedding # 3)', amount: 350, date: 'Today 02:00 PM', status: 'IN_SERVICE', meta: 'Senior Artist: Saima', tab: 'Appointments' },
        { id: 'rec-2', code: 'SAL-102', title: 'Keratin Hair Treatment & Moroccan Hair Spa', client: 'Mrs. Amber Farooq', amount: 120, date: 'Today 04:30 PM', status: 'CONFIRMED', meta: 'Stylist: Nida', tab: 'Appointments' },
        { id: 'rec-3', code: 'SAL-103', title: 'Monthly Beautician Commission Ledger (April 2026)', client: '8 Salon Staff Members', amount: 1420, date: '2026-05-01', status: 'DISBURSED', meta: '15% Service Split', tab: 'Staff Commissions' },
        { id: 'rec-4', code: 'SAL-104', title: 'Bridal Makeover Advance Booking (June 12)', client: 'Miss Zainab Ali', amount: 150, date: 'Yesterday', status: 'ADVANCE_PAID', meta: 'Bridal Suite Reserved', tab: 'Packages & Deals' },
        { id: 'rec-5', code: 'SAL-105', title: 'Staff Station Duty Allocation (Station 1 to 8)', client: 'Salon Floor Shift Morning', amount: 0, date: 'Today 09:00 AM', status: 'ROSTER_ACTIVE', meta: 'Zero Wait Times', tab: 'Staff Rosters' }
      ]
    },

    // 19. Gym & Fitness Center
    {
      id: 'gym_fitness',
      name: 'Gym & Fitness Center',
      category: 'gym',
      sector: 'SERVICES',
      pricingWeight: 0.95,
      dedicatedHubView: 'gym-hub',
      tagline: 'Member Subscriptions, Turnstile Access, Diet Plans & Personal Trainers',
      description: 'Fitness club membership system with RFID turnstile gating, monthly subscription auto-renewals, certified trainer schedules, and supplement store POS.',
      modules: [
        'Member Subscriptions & Plan Passes',
        'RFID & Biometric Turnstile Access',
        'Personal Trainer Schedules & Client Slots',
        'Diet Plans & Workout Routine Cards',
        'Locker Allocations & Key Deposits',
        'Supplements & Protein Shake POS',
        'Membership Expiry SMS Reminder Engine',
        'Member Fitness Progress & BMI Logs',
        'Group Fitness & Aerobics Class Rosters',
        'Auto-Renewal Monthly Subscription Billing'
      ],
      kpis: [
        { label: 'Active Members', value: '420 Members', subtext: 'Monthly & Annual packages', tone: 'default' },
        { label: 'Check-ins Today', value: '185 Athletes', subtext: 'Biometric RFID gate logs', tone: 'emerald' },
        { label: 'Trainer Sessions', value: '14 Slots Booked', subtext: 'Certified bodybuilders', tone: 'blue' },
        { label: 'Lockers Assigned', value: '92 / 100 Lockers', subtext: 'Key security deposits held', tone: 'amber' },
        { label: 'Gym Monthly Gross', value: '$14,200', subtext: 'Dues + supplement sales', tone: 'default' }
      ],
      activeTab: 'Member Subscriptions',
      tabs: ['Member Subscriptions', 'Trainer Rosters', 'Locker Allocation', 'Supplement POS', 'Workout Plans'],
      records: [
        { id: 'rec-1', code: 'GYM-301', title: 'Annual VIP Gold Membership + Locker Allocation', client: 'Taimoor Abbasi (Card # 8821)', amount: 480, date: '2026-05-15', status: 'ACTIVE', meta: 'Access Granted 24/7', tab: 'Member Subscriptions' },
        { id: 'rec-2', code: 'GYM-302', title: 'Personal Training 12-Session Hypertrophy Package', client: 'Asadullah Khan', amount: 250, date: '2026-05-12', status: 'IN_TRAINING', meta: 'Coach: Farhan Fitness', tab: 'Trainer Rosters' },
        { id: 'rec-3', code: 'GYM-303', title: 'Whey Protein Isolate 5lbs (Double Rich Chocolate)', client: 'Member Counter POS', amount: 85, date: 'Today 11:00 AM', status: 'PAID', meta: 'Supplement Store', tab: 'Supplement POS' },
        { id: 'rec-4', code: 'GYM-304', title: 'Locker # 42 Allocation & Key Security Deposit', client: 'Bilal Warraich (Locker 42)', amount: 30, date: '2026-05-01', status: 'ASSIGNED', meta: 'Deposit Held', tab: 'Locker Allocation' },
        { id: 'rec-5', code: 'GYM-305', title: 'Custom Keto Diet & 5-Day Workout Split Card', client: 'Saad Rafique (Member # 992)', amount: 0, date: 'Yesterday', status: 'DELIVERED', meta: 'Card Stored in App', tab: 'Workout Plans' }
      ]
    },

    // 20. Property & Real Estate
    {
      id: 'real_estate',
      name: 'Property & Real Estate',
      category: 'real_estate',
      sector: 'COMMERCE',
      pricingWeight: 1.10,
      dedicatedHubView: 'property-management',
      tagline: 'Tenancy Leases, Unit Management, Automated Rent Invoices & Listings',
      description: 'Real estate portfolio platform for commercial plazas, residential developments, and leasing agencies tracking security deposits, rent defaults, and agreements.',
      modules: [
        'Property Plots & Rental Units Directory',
        'Tenant Lease & Tenancy Agreements',
        'Automated Monthly Rent Invoicing',
        'Maintenance & Repair Work Orders',
        'Property Owner Monthly Payout Statements',
        'Security Deposit Escrow Tracking',
        'Lease Expiry & Renewal Reminders',
        'Utility Bill Sub-Metering Calculation',
        'Legal Eviction & Default Notices',
        'Property Listing & Portal Syndication'
      ],
      kpis: [
        { label: 'Units Under Lease', value: '92 / 100 Units', subtext: 'Commercial & residential', tone: 'default' },
        { label: 'Monthly Rent Collected', value: '96.2% Paid', subtext: 'May 2026 rent cycle', tone: 'emerald' },
        { label: 'Maintenance Tickets', value: '4 In Progress', subtext: 'Plumbing & electrical', tone: 'amber' },
        { label: 'Security Deposit Escrow', value: '$84,000', subtext: 'Held in client escrow', tone: 'blue' },
        { label: 'Portfolio Monthly Rent', value: '$68,500', subtext: 'Gross tenant collection', tone: 'default' }
      ],
      activeTab: 'Rent Invoicing',
      tabs: ['Rent Invoicing', 'Property Units', 'Tenant Leases', 'Maintenance Requests', 'Owner Statements'],
      records: [
        { id: 'rec-1', code: 'PRP-201', title: 'Commercial Plaza Floor 2 Tenancy Agreement (2 Yrs)', client: 'TechWave Software SMC Ltd', amount: 2400, date: '2026-05-01', status: 'LEASE_ACTIVE', meta: 'Security Deposit Held: $4,800', tab: 'Tenant Leases' },
        { id: 'rec-2', code: 'PRP-202', title: 'Monthly Rental Invoice Settlement (Apt 4-B)', client: 'Dr. Nadeem Akhtar', amount: 850, date: '2026-05-05', status: 'PAID_BANK', meta: 'Bank Transfer Receipt', tab: 'Rent Invoicing' },
        { id: 'rec-3', code: 'PRP-203', title: 'HVAC Air Duct Maintenance Work Order', client: 'Al-Madina Commercial Tower', amount: 320, date: '2026-05-14', status: 'WORK_COMPLETED', meta: 'Vendor: CoolAir Tech', tab: 'Maintenance Requests' },
        { id: 'rec-4', code: 'PRP-204', title: 'Property Owner Net Rental Disbursement Statement', client: 'Chaudhry Mansoor (Owner Unit 10-14)', amount: 6200, date: '2026-05-10', status: 'DISBURSED', meta: 'Net Yield Disbursed', tab: 'Owner Statements' },
        { id: 'rec-5', code: 'PRP-205', title: 'Unit Inspection & Handover Checklist (Unit 6A)', client: 'New Tenant: Engineer Zafar', amount: 0, date: 'Yesterday', status: 'INSPECTED', meta: 'Key Handover Complete', tab: 'Property Units' }
      ]
    },

    // 21. Construction Business
    {
      id: 'construction',
      name: 'Construction Business',
      category: 'construction',
      sector: 'INDUSTRIAL',
      pricingWeight: 1.10,
      tagline: 'Site Work Orders, BOQ Estimates, Cement/Steel Stocks & Labor Attendance',
      description: 'General contractor and construction ERP managing project sites, bill of quantities (BOQ), subcontractor scopes, material delivery weighbills, and IPC billing.',
      modules: [
        'Project Sites & Work Locations Directory',
        'Bill of Quantities (BOQ) & Estimates',
        'Raw Material Requisitions (Cement/Steel)',
        'Subcontractor Contracts & Work Orders',
        'Daily Site Labor Attendance & Wage',
        'Milestone Progress Reports & Photos',
        'Heavy Equipment & Machinery Hours',
        'Site Safety & Environmental Compliance',
        'Client Progress Billing IPC Certificates',
        'Site Petty Cash Expense Vouchers'
      ],
      kpis: [
        { label: 'Active Projects', value: '6 Sites Live', subtext: 'Commercial towers & highways', tone: 'default' },
        { label: 'Labor Force on Sites', value: '240 Workers', subtext: 'Daily site biometric logging', tone: 'emerald' },
        { label: 'Steel & Cement Consumed', value: '1,850 Bags/wk', subtext: 'Reinforcement bar active', tone: 'blue' },
        { label: 'Safety Record', value: '180 Days Zero Harm', subtext: 'HSE compliance audited', tone: 'emerald' },
        { label: 'Contract Billing IPCs', value: '$240,000', subtext: 'Milestone certification', tone: 'default' }
      ],
      activeTab: 'Project Sites',
      tabs: ['Project Sites', 'BOQ Estimates', 'Material Supplies', 'Labor Attendance', 'Client Billing'],
      records: [
        { id: 'rec-1', code: 'CNT-101', title: 'Commercial Plaza Sector G-9 Foundation Pouring', client: 'Capital Development Consultants', amount: 48500, date: '2026-05-18', status: 'SLAB_IN_PROGRESS', meta: 'Grade 60 Deformed Steel', tab: 'Project Sites' },
        { id: 'rec-2', code: 'CNT-102', title: 'Subcontractor Electrical Conduit Installation Scope', client: 'Apex Electrical Engineering', amount: 12400, date: '2026-05-12', status: 'WORK_ORDER_ACTIVE', meta: 'IPC Certificate # 3', tab: 'Client Billing' },
        { id: 'rec-3', code: 'CNT-103', title: 'Raw Material Delivery: 800 Bags Maple Leaf Cement', client: 'Site Stock Warehouse Multan', amount: 3600, date: '2026-05-08', status: 'DELIVERED', meta: 'Weighbridge Certified', tab: 'Material Supplies' },
        { id: 'rec-4', code: 'CNT-104', title: 'Daily Labor Wage & Biometric Attendance Log', client: 'Site 2: 64 Masons & Helpers', amount: 1420, date: 'Today 05:00 PM', status: 'PAID_DAILY', meta: 'Site Petty Cash', tab: 'Labor Attendance' },
        { id: 'rec-5', code: 'CNT-105', title: 'Bill of Quantities Revision: HVAC & Plumbing Ducting', client: 'Project Architect Consultation', amount: 16500, date: 'Yesterday', status: 'APPROVED', meta: 'BOQ Amendment # 2', tab: 'BOQ Estimates' }
      ]
    },

    // 22. Manufacturing & Factory
    {
      id: 'manufacturing',
      name: 'Manufacturing & Factory',
      category: 'manufacturing',
      sector: 'INDUSTRIAL',
      pricingWeight: 1.20,
      tagline: 'Bill of Materials (BOM), Work Orders, Shop Floor & Quality Control',
      description: 'Industrial manufacturing execution system (MES) supporting multi-level bill of materials, workstation machine maintenance, scrap deduction, and production batch runs.',
      modules: [
        'Multi-Level Bill of Materials (BOM)',
        'Production Work Orders & Batch Run',
        'Workstation Shop Floor Routing',
        'Raw Material Planning (MRP Engine)',
        'Quality Control (QC) Inspection Checklists',
        'Finished Goods Batch & Serial Tracking',
        'Machine Preventive Maintenance Log',
        'Production Scrap & Wastage Deduction',
        'Direct Labor Hour Timecard Costing',
        'Factory Shift Handover Log'
      ],
      kpis: [
        { label: 'Workstations Active', value: '18 Assembly Lines', subtext: 'CNC, stamping, assembly', tone: 'default' },
        { label: 'Production Output', value: '4,200 Units/day', subtext: '98.6% quality yield rate', tone: 'emerald' },
        { label: 'Machine OEE Score', value: '88.4%', subtext: 'Overall equipment effectiveness', tone: 'blue' },
        { label: 'Scrap & Wastage', value: '1.2% Controlled', subtext: 'ISO 9001 audit cleared', tone: 'emerald' },
        { label: 'Manufacturing Value', value: '$182,000', subtext: 'Monthly finished goods output', tone: 'default' }
      ],
      activeTab: 'Production Orders',
      tabs: ['Production Orders', 'Bill of Materials', 'Workstations', 'Quality Control', 'Machine Maintenance'],
      records: [
        { id: 'rec-1', code: 'MFG-801', title: 'Automotive Radiator Assembly Batch Run (2,000 Pcs)', client: 'Indus Motor Supplier Contract', amount: 34000, date: '2026-05-18', status: 'ON_ASSEMBLY_LINE', meta: 'Line 2 (Workstation 4)', tab: 'Production Orders' },
        { id: 'rec-2', code: 'MFG-802', title: 'Multi-Level BOM Setup: Aluminum Die-Cast Housing', client: 'Master Engineering Database', amount: 0, date: '2026-05-14', status: 'BOM_APPROVED', meta: '8 Component Child Items', tab: 'Bill of Materials' },
        { id: 'rec-3', code: 'MFG-803', title: 'Quality Control Batch Inspection (50 Sample Units)', client: 'QC Lab Bench Test # 9', amount: 0, date: '2026-05-10', status: 'QC_PASSED', meta: 'Zero Defect Tolerance', tab: 'Quality Control' },
        { id: 'rec-4', code: 'MFG-804', title: 'CNC Milling Machine # 4 Preventive Hydraulic Service', client: 'Factory Maintenance Team', amount: 650, date: 'Today 08:00 AM', status: 'SERVICED', meta: 'Oil & Filter Replaced', tab: 'Machine Maintenance' },
        { id: 'rec-5', code: 'MFG-805', title: 'Workstation Shift Routing: Stamping to Powder Coat', client: 'Shop Floor Section B', amount: 0, date: 'Today 11:00 AM', status: 'ROUTED', meta: 'Operator Roster Full', tab: 'Workstations' }
      ]
    },

    // 23. Logistics & Transport
    {
      id: 'logistics_transport',
      name: 'Logistics & Transport',
      category: 'logistics',
      sector: 'INDUSTRIAL',
      pricingWeight: 1.10,
      tagline: 'Shipment Consignments, Delivery Fleet Tracking & Daily COD Reconcile',
      description: 'Fleet transport and freight logistics suite with live waybill consignment booking, vehicle maintenance rosters, fuel expense logs, and cash on delivery reconciliation.',
      modules: [
        'Shipment Consignments & Tracking',
        'Pickup Order Requests & Dispatch',
        'Live Courier Delivery GPS Tracking',
        'Fleet Trucks, Vans & Trailers Directory',
        'Driver Rosters & License Expiries',
        'Cash on Delivery (COD) Daily Reconciliation',
        'Vehicle Fuel & Highway Toll Expense',
        'Trip Loading Manifests & Waybills',
        'Proof of Delivery (POD) Signature / OTP',
        'Fleet Preventive Service Roster'
      ],
      kpis: [
        { label: 'Fleet Vehicles', value: '48 Trucks & Vans', subtext: 'GPS tracked in-transit', tone: 'default' },
        { label: 'Consignments Active', value: '820 Waybills', subtext: 'Inter-city freight', tone: 'emerald' },
        { label: 'On-Time Delivery', value: '97.8%', subtext: 'Service level agreement (SLA)', tone: 'emerald' },
        { label: 'COD Cash Reconciled', value: '$42,800', subtext: 'Daily courier collections', tone: 'blue' },
        { label: 'Logistics Gross Intake', value: '$78,400', subtext: 'Weekly freight billings', tone: 'default' }
      ],
      activeTab: 'Shipments',
      tabs: ['Shipments', 'Delivery Tracking', 'Fleet Vehicles', 'Driver Rosters', 'COD Reconciliation'],
      records: [
        { id: 'rec-1', code: 'LOG-701', title: 'Container Freight Consignment (Karachi to Lahore)', client: 'National Textile Logistics Hub', amount: 4800, date: '2026-05-18', status: 'IN_TRANSIT_MOTORWAY', meta: 'Truck # TKL-9041 (M-2)', tab: 'Shipments' },
        { id: 'rec-2', code: 'LOG-702', title: 'Express Same-Day City Courier Dispatch (42 Parcels)', client: 'eCommerce Dispatch Cluster', amount: 650, date: 'Today 10:00 AM', status: 'OUT_FOR_DELIVERY', meta: 'Van Fleet # 12', tab: 'Delivery Tracking' },
        { id: 'rec-3', code: 'LOG-703', title: 'Daily COD Remittance Clearance to Merchant Accounts', client: '34 Registered Merchants', amount: 14200, date: '2026-05-15', status: 'REMITTED', meta: '1-Link Direct Deposit', tab: 'COD Reconciliation' },
        { id: 'rec-4', code: 'LOG-704', title: 'Fleet Prime Mover 10-Wheeler Engine Overhaul Roster', client: 'Logistics Maintenance Yard', amount: 1800, date: '2026-05-02', status: 'IN_DEPOT_SERVICE', meta: 'Vehicle # PK-8812', tab: 'Fleet Vehicles' },
        { id: 'rec-5', code: 'LOG-705', title: 'Driver License Verification & Highway Medical Roster', client: 'Long-Haul Drivers (Batch 3)', amount: 0, date: 'Yesterday', status: 'CERTIFIED', meta: 'HTV License Audited', tab: 'Driver Rosters' }
      ]
    },

    // 24. Event Management
    {
      id: 'event_management',
      name: 'Event Management',
      category: 'event_management',
      sector: 'SERVICES',
      pricingWeight: 1.00,
      tagline: 'Marquees, Wedding Receptions, Vendor Contracts & Timeline Run-Sheets',
      description: 'Event and banquet management software for wedding halls, corporate conventions, catering services, sound/lighting subcontractors, and client payment milestones.',
      modules: [
        'Event Bookings & Wedding Calendar',
        'Venues & Marquees Capacity Directory',
        'Vendor, Decorator & Caterer Contracts',
        'Event Budgeting & Profit Calculation',
        'Stage, Sound & Lighting Work Orders',
        'Client Milestone Invoicing & Advance',
        'Guest Invitation & RSVP Tracker',
        'Decor, Floral & Theme Catalogs',
        'Event Day Run-Sheet Timelines',
        'Client Post-Event Feedback & Reviews'
      ],
      kpis: [
        { label: 'Events Scheduled', value: '18 Bookings', subtext: 'Weddings & corporate galas', tone: 'default' },
        { label: 'Venues Capacity', value: '4 Marquees Active', subtext: 'Seating up to 1,200 guests', tone: 'emerald' },
        { label: 'Vendor Subcontracts', value: '28 Vendors', subtext: 'Decor, catering, sound tech', tone: 'blue' },
        { label: 'Advance Deposits Held', value: '$38,500', subtext: 'Event reservations locked', tone: 'emerald' },
        { label: 'Event Monthly Intake', value: '$64,000', subtext: 'Event planning turnover', tone: 'default' }
      ],
      activeTab: 'Event Bookings',
      tabs: ['Event Bookings', 'Venues & Marquees', 'Vendor Contracts', 'Event Budgeting', 'Client Invoicing'],
      records: [
        { id: 'rec-1', code: 'EVT-401', title: 'Royal Barat Wedding Reception (800 Guests)', client: 'Chaudhry Rauf & Family', amount: 8500, date: '2026-05-24', status: 'CONFIRMED_DEPOSIT', meta: 'Grand Palm Marquee A', tab: 'Event Bookings' },
        { id: 'rec-2', code: 'EVT-402', title: 'Corporate Annual Tech Summit & Dinner (400 Pax)', client: 'Pakistan Software Houses Assoc', amount: 4800, date: '2026-05-20', status: 'IN_PLANNING', meta: 'Stage + Sound + AV Live', tab: 'Event Bookings' },
        { id: 'rec-3', code: 'EVT-403', title: 'Floral Decor & Stage Lighting Subcontractor Contract', client: 'Bloom & Light Event Designers', amount: 2200, date: '2026-05-14', status: 'CONTRACT_SIGNED', meta: 'Barat Theme Setup', tab: 'Vendor Contracts' },
        { id: 'rec-4', code: 'EVT-404', title: 'Marquee 2 Acoustic Sound & Seating Audit', client: 'Internal Venue Operations', amount: 0, date: 'Today 10:00 AM', status: 'INSPECTED', meta: '600 Chairs Verified', tab: 'Venues & Marquees' },
        { id: 'rec-5', code: 'EVT-405', title: 'Event Milestone Payment Invoice # 2 (50% Advance)', client: 'Tariq Mehmood Walima Booking', amount: 3200, date: 'Yesterday', status: 'PAID', meta: 'Bank Transfer Cleared', tab: 'Client Invoicing' }
      ]
    },

    // 25. HR & Payroll Services
    {
      id: 'hr_payroll',
      name: 'HR & Payroll Services',
      category: 'hr_recruitment',
      sector: 'SERVICES',
      pricingWeight: 1.00,
      tagline: 'Automated Salary Slips, Tax/EOBI Deductions, Leaves & Attendance',
      description: 'Human capital management system handling multi-branch employee files, automated monthly payroll computation, leave management, and tax withholdings.',
      modules: [
        'Employee Master Directory & Files',
        'Biometric Attendance Integration',
        'Monthly Salary Slips Generation',
        'Income Tax, EOBI & Provident Fund',
        'Leave Management & Annual Quotas',
        'Employee Expense Reimbursement Claims',
        'New Hire Onboarding & Offer Letters',
        'Annual Performance Appraisal Reviews',
        'Company Loan & Advance Deductions',
        'Final Settlement & Gratuity Clearance'
      ],
      kpis: [
        { label: 'Active Employees', value: '340 Staff', subtext: 'Across 4 regional offices', tone: 'default' },
        { label: 'Monthly Payroll Run', value: '100% Calculated', subtext: 'May 2026 salary cycle', tone: 'emerald' },
        { label: 'Tax & EOBI Withheld', value: '$18,400', subtext: 'Statutory compliance ready', tone: 'blue' },
        { label: 'Leave Requests Open', value: '4 Pending', subtext: 'Casual & sick leaves', tone: 'amber' },
        { label: 'Total Monthly Salaries', value: '$142,000', subtext: 'Disbursed via bank transfer', tone: 'default' }
      ],
      activeTab: 'Monthly Payroll',
      tabs: ['Monthly Payroll', 'Employee Directory', 'Attendance Logs', 'Leave Requests', 'Expense Claims'],
      records: [
        { id: 'rec-1', code: 'HR-301', title: 'May 2026 Monthly Payroll Batch (340 Employees)', client: 'Corporate HR Operations', amount: 142000, date: '2026-05-01', status: 'SALARY_DISBURSED', meta: 'Bank Direct Deposit File', tab: 'Monthly Payroll' },
        { id: 'rec-2', code: 'HR-302', title: 'Employee Income Tax & EOBI Clearance Filing', client: 'Finance & Tax Department', amount: 18400, date: '2026-05-05', status: 'FILED', meta: 'Challan CPR Generated', tab: 'Monthly Payroll' },
        { id: 'rec-3', code: 'HR-303', title: 'Senior Software Engineer Onboarding & Offer Letter', client: 'Usman Ghani (Emp ID # 892)', amount: 2400, date: '2026-05-12', status: 'HIRED', meta: 'Offer Accepted', tab: 'Employee Directory' },
        { id: 'rec-4', code: 'HR-304', title: 'Annual Leave Approval Request (5 Working Days)', client: 'Ayesha Siddiqua (Marketing Lead)', amount: 0, date: 'Today 09:15 AM', status: 'APPROVED', meta: 'Quota: 14 Remaining', tab: 'Leave Requests' },
        { id: 'rec-5', code: 'HR-305', title: 'Travel & Client Lunch Expense Reimbursement', client: 'Farooq Azam (Sales Manager)', amount: 180, date: 'Yesterday', status: 'APPROVED', meta: 'Receipts Verified', tab: 'Expense Claims' }
      ]
    },

    // 26. Legal Firm / Law Office
    {
      id: 'law_firm',
      name: 'Legal Firm / Law Office',
      category: 'law_firm',
      sector: 'PROFESSIONAL',
      pricingWeight: 1.00,
      dedicatedHubView: 'legal-hub',
      tagline: 'High Court Case Dockets, Peshi Hearing Calendar & Hourly Billing',
      description: 'Chambers and law office suite organizing litigation case files, court hearing calendars (peshi), advocate billable time logs, power of attorneys, and retainer billing.',
      modules: [
        'Client Legal Files & Case Dockets',
        'Court Hearing Dates (Peshi) Calendar',
        'Legal Documents & Pleadings Vault',
        'Advocate Hourly Timesheets & Billing',
        'Court Stamp & Legal Expense Vouchers',
        'Opposing Parties & Counsel Records',
        'Precedent & Case Research Notes',
        'Power of Attorney (Vakalatnama) Log',
        'Bar Council Compliance & Deadlines',
        'Client Retainer Ledger & Invoicing'
      ],
      kpis: [
        { label: 'Active Litigation Cases', value: '64 Cases', subtext: 'High Court & Civil dockets', tone: 'default' },
        { label: 'Court Hearings This Wk', value: '18 Peshis', subtext: 'Scheduled cause lists', tone: 'amber' },
        { label: 'Legal Retainers Active', value: '22 Corporate Clients', subtext: 'Monthly counsel retainers', tone: 'emerald' },
        { label: 'Billable Time Recorded', value: '380 Hours/mo', subtext: 'Senior partner & associates', tone: 'blue' },
        { label: 'Chambers Monthly Billing', value: '$36,800', subtext: 'Retainers + court appearances', tone: 'default' }
      ],
      activeTab: 'Court Cases',
      tabs: ['Court Cases', 'Hearing Calendar', 'Legal Documents', 'Time Tracking', 'Retainer Billing'],
      records: [
        { id: 'rec-1', code: 'LAW-201', title: 'Civil Suit: Commercial Plaza Title Dispute # 441/2026', client: 'Chaudhry Munir Associates', amount: 4500, date: '2026-05-22', status: 'HEARING_SCHEDULED', meta: 'High Court Rawalpindi Bench', tab: 'Court Cases' },
        { id: 'rec-2', code: 'LAW-202', title: 'Corporate Advisory & Contract Review Retainer', client: 'Horizon Telecom Pvt Ltd', amount: 3500, date: '2026-05-01', status: 'RETAINER_ACTIVE', meta: 'Monthly Chambers Fee', tab: 'Retainer Billing' },
        { id: 'rec-3', code: 'LAW-203', title: 'High Court Cause List Hearing (Peshi) Reminder', client: 'State vs. Al-Rehman Corporation', amount: 0, date: 'Today 08:30 AM', status: 'COURT_APPEARANCE', meta: 'Courtroom # 4 Justice Khan', tab: 'Hearing Calendar' },
        { id: 'rec-4', code: 'LAW-204', title: 'Pleading Vault: Writ Petition Draft (Art 199)', client: 'Engr. Haroon Rasheed', amount: 1200, date: 'Yesterday', status: 'DRAFT_FINAL', meta: 'Vakalatnama Signed', tab: 'Legal Documents' },
        { id: 'rec-5', code: 'LAW-205', title: 'Advocate Billable Hours Log: 8.5 Hours Legal Research', client: 'Senior Advocate: Barrister Tariq', amount: 850, date: 'Yesterday', status: 'BILLED', meta: 'Supreme Court Precedents', tab: 'Time Tracking' }
      ]
    },

    // 27. NGO / Nonprofit Organization
    {
      id: 'ngo_nonprofit',
      name: 'NGO / Nonprofit Organization',
      category: 'ngo',
      sector: 'SERVICES',
      pricingWeight: 0.95,
      dedicatedHubView: 'ngo-hub',
      tagline: 'Donor CRM, Zakat/Sadqah Accounting, Aid Relief & Volunteer Rosters',
      description: 'Charitable foundation and trust software tracking donor contributions, Zakat fund disbursements, relief goods inventory, and beneficiary verification.',
      modules: [
        'Donors Master Directory & CRM',
        'Zakat, Sadqah & Donation Receipts',
        'Relief Aid & Ration Distribution Log',
        'Needy Beneficiary Verification Profiles',
        'Fundraising Campaigns & Public Appeals',
        'Volunteer Directory & Field Rosters',
        'Institutional Donor Grants Accounting',
        'Project Social Impact Reporting',
        'Audit-Ready Expense Vouchers',
        'Tax Exemption Certificate Generation'
      ],
      kpis: [
        { label: 'Registered Donors', value: '1,420 Donors', subtext: 'Local & Overseas Pakistanis', tone: 'default' },
        { label: 'Relief Rations Given', value: '2,800 Families', subtext: 'Monthly food hamper packs', tone: 'emerald' },
        { label: 'Zakat Fund Collected', value: '$84,000', subtext: 'Shariah audited accounts', tone: 'blue' },
        { label: 'Active Volunteers', value: '185 Field Staff', subtext: 'Disaster response teams', tone: 'emerald' },
        { label: 'Total Aid Disbursed', value: '$68,500', subtext: 'Direct beneficiary support', tone: 'default' }
      ],
      activeTab: 'Donations Ledger',
      tabs: ['Donations Ledger', 'Donors Directory', 'Aid Distribution', 'Campaigns', 'Grants Accounting'],
      records: [
        { id: 'rec-1', code: 'NGO-101', title: 'Monthly Orphan Education & Food Sponsorship Fund', client: 'Overseas Donor: Tariq UK (Zakat)', amount: 1200, date: '2026-05-15', status: 'RECEIPT_ISSUED', meta: 'Tax Exemption Slip # 904', tab: 'Donations Ledger' },
        { id: 'rec-2', code: 'NGO-102', title: 'Ration Pack Distribution Camp (Tharparkar District)', client: '500 Verified Deserving Families', amount: 14500, date: '2026-05-10', status: 'DISTRIBUTED', meta: 'Biometric Verified', tab: 'Aid Distribution' },
        { id: 'rec-3', code: 'NGO-103', title: 'Clean Water Hand Pump Installation Grant Project', client: 'Global Aid Foundation Geneva', amount: 28000, date: '2026-05-02', status: 'PROJECT_LIVE', meta: 'Grant Milestone 2 Complete', tab: 'Grants Accounting' },
        { id: 'rec-4', code: 'NGO-104', title: 'Emergency Flood Relief Appeal 2026 Campaign', client: 'Public Crowdfunding Portal', amount: 9400, date: 'Today 09:00 AM', status: 'CAMPAIGN_LIVE', meta: '182 Donations Received', tab: 'Campaigns' },
        { id: 'rec-5', code: 'NGO-105', title: 'Major Philanthropist Donor Profile Review', client: 'Malik Riaz Family Trust', amount: 25000, date: 'Yesterday', status: 'VERIFIED', meta: 'Annual Donor Partnership', tab: 'Donors Directory' }
      ]
    },

    // 28. Home & Maintenance Services
    {
      id: 'home_services',
      name: 'Home & Maintenance Services',
      category: 'home_services',
      sector: 'SERVICES',
      pricingWeight: 0.95,
      tagline: 'Technician Dispatch, Field Invoices, AMC Contracts & Spare Parts',
      description: 'On-demand home maintenance service platform for plumbing, electrical, HVAC repair, and pest control technicians with job geolocation and ratings.',
      modules: [
        'Service Request Dispatch Board',
        'Field Technicians & Plumbers Directory',
        'Spare Parts & Materials Consumed Log',
        'On-Site Job Completion Verification',
        'Mobile Field Invoicing & Receipts',
        'Customer Digital Rating & Signatures',
        'Annual Maintenance Contracts (AMC)',
        'Technician Commission & Split Payout',
        'Service Warranty Claim Tracking',
        'Customer Address GPS Geolocation'
      ],
      kpis: [
        { label: 'Jobs Dispatched Today', value: '38 Requests', subtext: 'AC, plumbing & electrical', tone: 'default' },
        { label: 'Active Field Techs', value: '14 Specialists', subtext: 'Equipped with service vans', tone: 'emerald' },
        { label: 'Avg Arrival Speed', value: '32 Mins', subtext: 'GPS geolocation dispatch', tone: 'emerald' },
        { label: 'Customer Rating', value: '4.9 / 5.0 Stars', subtext: 'Based on 420 reviews', tone: 'blue' },
        { label: 'Service Daily Revenue', value: '$4,250', subtext: 'Parts + service fees', tone: 'default' }
      ],
      activeTab: 'Service Requests',
      tabs: ['Service Requests', 'Field Technicians', 'Parts Consumed', 'Customer Invoicing', 'AMC Contracts'],
      records: [
        { id: 'rec-1', code: 'HMS-101', title: 'Inverter AC Gas Leakage Repair & Coil Cleaning', client: 'Dr. Kamran (Sector F-8/3 Islamabad)', amount: 75, date: 'Today 10:15 AM', status: 'TECHNICIAN_DISPATCHED', meta: 'Tech: Zahid HVAC (Van 02)', tab: 'Service Requests' },
        { id: 'rec-2', code: 'HMS-102', title: 'Complete Villa Plumbing Pipe Replacement Scope', client: 'Chaudhry Naeem (DHA Phase 2)', amount: 380, date: 'Today 11:30 AM', status: 'IN_PROGRESS', meta: 'Tech: Ustad Bashir', tab: 'Service Requests' },
        { id: 'rec-3', code: 'HMS-103', title: 'Annual Maintenance Contract (AMC) Commercial Plaza', client: 'City Center Tower (12 Floors)', amount: 2400, date: '2026-05-01', status: 'ACTIVE', meta: 'Monthly Service Guarantee', tab: 'AMC Contracts' },
        { id: 'rec-4', code: 'HMS-104', title: 'Spare Parts Log: 3x Capacitor 45uF + R410 Gas', client: 'Stock Depo Islamabad', amount: 95, date: 'Today 08:30 AM', status: 'CONSUMED', meta: 'Job Ref # HMS-101', tab: 'Parts Consumed' },
        { id: 'rec-5', code: 'HMS-105', title: 'Field Mobile Invoice & Customer Digital Signature', client: 'Mrs. Saima Noor (Cashless OTP)', amount: 60, date: 'Yesterday', status: 'PAID', meta: '5-Star Rating Logged', tab: 'Customer Invoicing' }
      ]
    },

    // 29. Cleaning Services
    {
      id: 'cleaning_services',
      name: 'Cleaning Services',
      category: 'cleaning',
      sector: 'SERVICES',
      pricingWeight: 0.95,
      tagline: 'Commercial Site Contracts, Janitorial Shifts & Chemical Inventory',
      description: 'Commercial facility management software tracking corporate janitorial shifts, deep-cleaning equipment, chemical consumables, and site inspection checklists.',
      modules: [
        'Contracted Cleaning Sites Directory',
        'Janitorial Day & Night Shift Rosters',
        'Cleaning Chemicals & Supplies Inventory',
        'Facility Cleanliness Inspection Checklists',
        'Commercial Contract Invoicing System',
        'Deep Cleaning Equipment & Vacuum Tracker',
        'Health & Safety Compliance (HSE) Logs',
        'Client Supervisor Digital Sign-offs',
        'Cleaner Biometric Attendance & Hours',
        'Recurring Cleaning Frequency Schedules'
      ],
      kpis: [
        { label: 'Contracted Sites', value: '28 Facilities', subtext: 'Offices, hospitals, airports', tone: 'default' },
        { label: 'Janitors on Duty', value: '84 Cleaners', subtext: 'Day & night shift teams', tone: 'emerald' },
        { label: 'Inspection Score', value: '98.5% Grade A', subtext: 'Hygiene audit verified', tone: 'emerald' },
        { label: 'Deep Clean Machines', value: '16 Scrubbers', subtext: 'Industrial scrubbers operational', tone: 'blue' },
        { label: 'Monthly Contract Billed', value: '$48,000', subtext: 'Corporate janitorial contracts', tone: 'default' }
      ],
      activeTab: 'Contracted Sites',
      tabs: ['Contracted Sites', 'Janitorial Rosters', 'Chemical Inventory', 'Inspection Checklists', 'Invoicing'],
      records: [
        { id: 'rec-1', code: 'CLN-401', title: 'Corporate Office Daily Janitorial Maintenance', client: 'Bank Alfalah Head Office Tower', amount: 4800, date: '2026-05-01', status: 'CONTRACT_ACTIVE', meta: '12 Janitors Assigned', tab: 'Contracted Sites' },
        { id: 'rec-2', code: 'CLN-402', title: 'Post-Construction Deep Cleaning (10,000 Sq Ft)', client: 'Emerald Residency Mall', amount: 2200, date: '2026-05-14', status: 'IN_PROGRESS', meta: 'Team Leader: Waqas', tab: 'Contracted Sites' },
        { id: 'rec-3', code: 'CLN-403', title: 'Medical Grade Sterilization & Biohazard Sanitation', client: 'Ali Medical Center Hospital', amount: 6800, date: '2026-05-04', status: 'AUDIT_APPROVED', meta: 'Grade A Hygiene Certificate', tab: 'Inspection Checklists' },
        { id: 'rec-4', code: 'CLN-404', title: 'Industrial Floor Polishing Chemical Requisition', client: 'Chemical Store Warehouse', amount: 750, date: 'Today 09:00 AM', status: 'DELIVERED', meta: '20 Gallons Floor Wax', tab: 'Chemical Inventory' },
        { id: 'rec-5', code: 'CLN-405', title: 'Monthly Commercial Cleaning Service Invoice', client: 'Zong HQ Telecom Tower', amount: 5400, date: 'Yesterday', status: 'INVOICED', meta: 'Invoice # CLN-9921', tab: 'Invoicing' }
      ]
    },

    // 30. Media & Marketing Agency
    {
      id: 'media_agency',
      name: 'Media & Marketing Agency',
      category: 'media',
      sector: 'PROFESSIONAL',
      pricingWeight: 1.05,
      tagline: 'Brand Campaigns, Creative Kanban, Ad Spend Budgets & Client Retainers',
      description: 'Digital advertising and creative agency management suite tracking multi-client social campaigns, graphic deliverables, ad budgets, and retainers.',
      modules: [
        'Client Brand Accounts Directory',
        'Digital Ad Campaign ROI Tracking',
        'Creative Deliverables & Video Kanban',
        'Client Ad Spend Budget Allocation',
        'Social Media Editorial Calendar',
        'Client Monthly Retainer Invoicing',
        'Influencer Collaboration & Deals CRM',
        'High-Res Media Asset Storage Vault',
        'Brand Guidelines & Logo Repository',
        'Client Proof Approval Workflows'
      ],
      kpis: [
        { label: 'Active Retainer Brands', value: '18 Clients', subtext: 'FMCG, tech, retail fashion', tone: 'default' },
        { label: 'Monthly Ad Spend', value: '$64,000', subtext: 'Meta, Google, TikTok Ads', tone: 'blue' },
        { label: 'Average Campaign ROAS', value: '4.8x Return', subtext: 'Audited e-commerce sales', tone: 'emerald' },
        { label: 'Creative Tasks Closed', value: '92 Deliverables', subtext: 'Videos, reels, carousels', tone: 'emerald' },
        { label: 'Agency Retainer Billing', value: '$38,500', subtext: 'Monthly management fees', tone: 'default' }
      ],
      activeTab: 'Client Accounts',
      tabs: ['Client Accounts', 'Ad Campaigns', 'Creative Kanban', 'Ad Spend Budgets', 'Retainer Invoicing'],
      records: [
        { id: 'rec-1', code: 'MED-101', title: 'Summer Collection Meta & Google Performance Ads', client: 'Sapphire Retail Fashion Group', amount: 4500, date: '2026-05-18', status: 'CAMPAIGN_LIVE', meta: 'Monthly Media Retainer', tab: 'Ad Campaigns' },
        { id: 'rec-2', code: 'MED-102', title: 'Video Production: 3D Animated Product TVC (30s)', client: 'Krave Mart Beverages', amount: 3200, date: '2026-05-12', status: 'IN_POST_PRODUCTION', meta: 'Lead Producer: Hamza', tab: 'Creative Kanban' },
        { id: 'rec-3', code: 'MED-103', title: 'Top-Tier Influencer Collaboration Roster (10 Creators)', client: 'Glow Naturals Cosmetics', amount: 2800, date: '2026-05-08', status: 'APPROVED', meta: 'PR Hampers Dispatched', tab: 'Client Accounts' },
        { id: 'rec-4', code: 'MED-104', title: 'Meta Ad Spend Budget Allocation Statement ($15,000)', client: 'E-Commerce Brand Campaign', amount: 15000, date: 'Today 09:30 AM', status: 'BUDGET_ACTIVE', meta: 'Direct Meta API Link', tab: 'Ad Spend Budgets' },
        { id: 'rec-5', code: 'MED-105', title: 'Monthly Digital Agency Retainer Invoicing # 5', client: 'Master Group of Industries', amount: 5000, date: 'Yesterday', status: 'PAID', meta: 'Retainer Retained', tab: 'Retainer Invoicing' }
      ]
    },
    {
      id: 'cargo_freight',
      name: 'Cargo & Freight Logistics',
      category: 'cargo',
      sector: 'INDUSTRIAL',
      pricingWeight: 1.45,
      dedicatedHubView: 'cargo-hub',
      tagline: 'Freight Consignments, Fleet Tracking, Electronic Waybills & Delivery Proof',
      description: 'Complete cargo shipping and multi-city freight operations suite with GPS fleet dispatch, electronic consignment waybills, container customs, and driver allowances.',
      modules: [
        'Cargo Consignment Booking',
        'Electronic Waybill (Bilty)',
        'GPS Fleet Tracking & Alerts',
        'Driver Trip Sheets & Diesel',
        'Proof of Delivery (POD) Slips',
        'Freight Invoice & Ledgers',
        'Customs Clearing Vault',
        'Truck Maintenance Schedule',
        'Weighbridge Tonnage Logs',
        'Customer Consignment Portal'
      ],
      kpis: [
        { label: 'Active Shipments', value: '64 Dispatches', subtext: 'Inter-City & Port Freight', tone: 'blue' },
        { label: 'Trucks En Route', value: '28 Prime Movers', subtext: 'GPS Telemetry Active', tone: 'emerald' },
        { label: 'Pending PODs', value: '9 Waybills', subtext: 'Awaiting Client Signoff', tone: 'amber' },
        { label: 'Fleet Mileage', value: '94,200 km', subtext: 'This Month Logged', tone: 'default' },
        { label: 'Freight Revenue', value: '$52,800', subtext: 'Monthly Invoiced', tone: 'emerald' }
      ],
      activeTab: 'Consignments',
      tabs: ['Consignments', 'Fleet Tracking', 'Trip Sheets', 'Proof of Delivery', 'Freight Invoicing'],
      records: [
        { id: 'rec-1', code: 'CRG-101', title: 'Container 40ft (Textile Export to Karachi Port)', client: 'Al-Karam Textile Mills', amount: 3200, date: '2026-05-18', status: 'IN_TRANSIT', meta: 'Truck # TLA-992 (GPS Online)', tab: 'Consignments' },
        { id: 'rec-2', code: 'CRG-102', title: 'Electronic Waybill # BY-8842 Issued & Barcoded', client: 'Master Chemical Industries', amount: 1850, date: 'Today 09:15 AM', status: 'BILTY_ISSUED', meta: 'Driver: Aslam Khan', tab: 'Consignments' },
        { id: 'rec-3', code: 'CRG-103', title: 'Trip Advance & Fuel Card Top-up Authorized (200L)', client: 'Islamabad-Lahore Motorway Convoy', amount: 620, date: 'Today 10:30 AM', status: 'DISBURSED', meta: 'Fleet Card # 4491', tab: 'Trip Sheets' },
        { id: 'rec-4', code: 'CRG-104', title: 'Proof of Delivery (POD) Signed by Warehouse Lead', client: 'Unilever Logistics Hub Lahore', amount: 4100, date: 'Yesterday', status: 'DELIVERED', meta: 'Biometric Signoff', tab: 'Proof of Delivery' },
        { id: 'rec-5', code: 'CRG-105', title: 'Monthly Corporate Freight Invoice Generated', client: 'National Foods Distribution', amount: 8900, date: 'Yesterday', status: 'INVOICED', meta: 'Invoice # CRG-5002', tab: 'Freight Invoicing' }
      ]
    },
    {
      id: 'solar_energy',
      name: 'Solar & Renewable Energy Solutions',
      category: 'solar_energy',
      sector: 'INDUSTRIAL',
      pricingWeight: 1.50,
      tagline: 'PV Plant EPC, Net Metering Approvals, Inverter Telemetry & Maintenance',
      description: 'Complete renewable energy EPC management system tracking solar panel kilowatt projects, DISCO net metering permits, string inverter yield, and maintenance visits.',
      modules: [
        'Solar EPC Project Quotes',
        'Kilowatt Capacity Sizing',
        'DISCO Net Metering Permits',
        'Inverter Generation Logs',
        'BOM Hardware Inventory',
        'Solar Panel Maintenance AMC',
        'Client Payback ROI Ledger',
        'String Voltage Testing Vault',
        'Solar Structure Civil Works',
        'Customer Green Energy App'
      ],
      kpis: [
        { label: 'Installed Capacity', value: '1.45 MW', subtext: 'Commercial & Residential', tone: 'emerald' },
        { label: 'Active Sites', value: '38 Installations', subtext: 'Under Construction & EPC', tone: 'blue' },
        { label: 'Net Metering Queue', value: '14 Applications', subtext: 'WAPDA/K-Electric Linked', tone: 'amber' },
        { label: 'Generation Yield', value: '5,820 kWh/day', subtext: 'CO2 Offset 3.8 Tons', tone: 'emerald' },
        { label: 'Project Pipeline', value: '$184,000', subtext: 'Active Commercial EPCs', tone: 'default' }
      ],
      activeTab: 'Projects',
      tabs: ['Projects', 'Net Metering', 'Generation Logs', 'BOM Hardware', 'Project Invoicing'],
      records: [
        { id: 'rec-1', code: 'SLR-101', title: '50 kW Commercial Rooftop Solar EPC Complete', client: 'Packages Mall Industrial Unit', amount: 32000, date: '2026-05-18', status: 'COMMISSIONED', meta: 'Huawei 50KTL Inverter', tab: 'Projects' },
        { id: 'rec-2', code: 'SLR-102', title: 'LESCO / IESCO Net Metering Bi-Directional Inspection', client: 'Dr. Tariq Villa (15 kW)', amount: 1200, date: 'Today 11:00 AM', status: 'DISCO_APPROVED', meta: 'Green Meter Installed', tab: 'Net Metering' },
        { id: 'rec-3', code: 'SLR-103', title: 'Inverter Daily Yield Log: 214 kWh Generated Today', client: 'Sapphire Mill Rooftop', amount: 0, date: 'Today 01:00 PM', status: 'ONLINE', meta: 'Efficiency 98.4%', tab: 'Generation Logs' },
        { id: 'rec-4', code: 'SLR-104', title: 'Tier-1 Longi 585W N-Type Solar Panels (120 Units)', client: 'EPC Central Warehouse', amount: 16500, date: 'Yesterday', status: 'DELIVERED', meta: 'Flash Test Certified', tab: 'BOM Hardware' },
        { id: 'rec-5', code: 'SLR-105', title: 'Milestone 2 Project Invoicing: 40% On Panel Mounting', client: 'Askari Commercial Tower', amount: 18000, date: 'Yesterday', status: 'PAID', meta: 'Invoice # SLR-9941', tab: 'Project Invoicing' }
      ]
    }
  ];

  get displayedRecords(): any[] {
    if (!this.activeBusiness) return [];
    const currentTab = this.activeBusiness.activeTab;
    const filtered = (this.activeBusiness.records || []).filter((r: any) => !r.tab || r.tab === currentTab);
    return filtered.length > 0 ? filtered : this.activeBusiness.records;
  }

  selectModule(mod: string): void {
    const matchedTab = this.activeBusiness.tabs.find((t: string) => 
      mod.toLowerCase().includes(t.toLowerCase().split(' ')[0]) || 
      t.toLowerCase().includes(mod.toLowerCase().split(' ')[0])
    );
    if (matchedTab) {
      this.activeBusiness.activeTab = matchedTab;
      this.actionMessage = `Switched to active tab: ${matchedTab} (${mod})`;
    } else {
      this.actionMessage = `Module Verified & Active: ${mod}`;
    }
    setTimeout(() => this.actionMessage = '', 3500);
  }

  selectTab(tab: string): void {
    this.activeBusiness.activeTab = tab;
  }

  quickAddOperation(): void {
    const tab = this.activeBusiness.activeTab;
    const newCode = 'OP-' + Math.floor(1000 + Math.random() * 9000);
    const rec = {
      id: 'rec-' + Date.now(),
      code: newCode,
      title: `Live Operation Processed: ${tab}`,
      client: 'Direct Customer Order / Entry',
      amount: Math.floor(150 + Math.random() * 850),
      date: 'Just Now',
      status: 'ACTIVE',
      meta: tab + ' Live Operation',
      tab: tab
    };
    this.activeBusiness.records.unshift(rec);
    this.actionMessage = `New record #${newCode} added to ${tab} successfully!`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  ngOnInit(): void {
    if (this.initialBusinessId) {
      this.selectBusiness(this.initialBusinessId);
    } else {
      this.selectBusiness(this.selectedBusinessId);
    }
  }

  get filteredBusinesses(): EnterpriseBusiness[] {
    let list = this.businesses;
    if (this.selectedSector !== 'ALL') {
      list = list.filter(b => b.sector === this.selectedSector);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.tagline.toLowerCase().includes(q) ||
        b.modules.some(m => m.toLowerCase().includes(q))
      );
    }
    return list;
  }

  selectBusiness(id: string): void {
    const found = this.businesses.find(b => b.id === id);
    if (found) {
      this.selectedBusinessId = found.id;
      this.activeBusiness = found;
    }
  }

  openDedicatedHub(view: string): void {
    this.navigate.emit(view);
  }

  updateRecordStatus(rec: any, status: string): void {
    rec.status = status;
    this.actionMessage = `Record ${rec.code} updated to ${status}!`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  openPrintModal(rec: any): void {
    this.selectedRecordForPrint = rec;
    this.showPrintModal = true;
  }

  printRecord(): void {
    window.print();
  }

  getTabRecordCount(tab: string): number {
    if (!this.activeBusiness) return 0;
    return (this.activeBusiness.records || []).filter((r: any) => !r.tab || r.tab === tab).length;
  }

  submitNewRecord(): void {
    if (!this.newRecord.title) return;
    const currentTab = this.activeBusiness.activeTab;
    const rec = {
      id: 'rec-' + Date.now(),
      code: 'REC-' + Math.floor(1000 + Math.random() * 9000),
      title: this.newRecord.title,
      client: this.newRecord.client || 'Enterprise Client',
      amount: Number(this.newRecord.amount) || 1200,
      date: 'Today, Just Now',
      status: this.newRecord.status,
      meta: currentTab + ' Entry',
      tab: currentTab
    };
    this.activeBusiness.records.unshift(rec);
    this.showAddRecordModal = false;
    this.actionMessage = `Record #${rec.code} added to ${currentTab} successfully!`;
    setTimeout(() => this.actionMessage = '', 3500);
    this.newRecord = {
      title: '',
      client: '',
      amount: 1500,
      status: 'ACTIVE',
      date: 'Today, Just Now',
      notes: 'Operational entry recorded via Enterprise Suite.'
    };
  }
}
