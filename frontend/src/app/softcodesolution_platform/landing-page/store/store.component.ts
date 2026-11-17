import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LocalizationService } from '../../../services/localization.service';

export type StoreCategory =
  | 'All'
  | 'Healthcare'
  | 'Education'
  | 'Retail & F&B'
  | 'Business & Industrial'
  | 'Services & Lifestyle';

export interface StoreProduct {
  title: string;
  category: Exclude<StoreCategory, 'All'>;
  desc: string;
  image: string;
  price: string;
  features: string[];
}

export interface CheckoutTransaction {
  invoiceNumber: string;
  softwareTitle: string;
  amount: string;
  status: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  hasPhone: boolean;
  notificationsDispatched: string[];
}

const NEUTRAL_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 360'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23eef2ff'/%3E%3Cstop offset='100%25' stop-color='%23f8fafc'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='360' fill='url(%23g)'/%3E%3Crect x='220' y='110' width='160' height='140' rx='24' fill='%23ffffff' stroke='%23e2e8f0' stroke-width='3'/%3E%3Cpath d='M265 160h70M265 185h50M265 210h60' stroke='%234f46e5' stroke-width='8' stroke-linecap='round'/%3E%3C/svg%3E";

@Component({
  selector: 'app-store',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './store.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreComponent implements OnInit {
  readonly loc = inject(LocalizationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly businessTypeMap: Record<string, string> = {
    'Accounting & Tax Services': 'accounting_tax',
    'Agriculture & Farming': 'agriculture_farming',
    'Auto Workshop & Garage': 'auto_workshop',
    'Clinic / Healthcare Center': 'clinic_healthcare',
    'Hospital Management': 'hospital_management',
    'Dental Clinic': 'dental_clinic',
    'Pharmacy & Medical Store': 'pharmacy_medical',
    'School / College Management': 'school_college',
    'Coaching & Training Center': 'coaching_academy',
    'eCommerce / Online Store': 'ecommerce_fulfillment',
    'Retail Shop & Point of Sale': 'retail_store',
    'Super Mart & Grocery': 'supermarket_grocery',
    'Wholesale & Distribution': 'wholesale_distribution',
    'Restaurant & Fine Dine': 'restaurant_cafe',
    'Pizza & Fast Food POS': 'pizza_fastfood',
    'Hotel & Hospitality': 'hotel_hospitality',
    'Travel & Tourism Agency': 'travel_tourism',
    'Beauty Salon & Spa': 'beauty_salon',
    'Gym & Fitness Center': 'gym_fitness',
    'Property & Real Estate': 'real_estate_agency',
    'Construction Business': 'construction_contractor',
    'Manufacturing & Factory': 'manufacturing_plant',
    'Logistics & Transport': 'logistics_courier',
    'Event Management': 'event_management',
    'HR & Payroll Services': 'hr_payroll',
    'Legal Firm / Law Office': 'law_firm',
    'NGO / Nonprofit Organization': 'ngo_nonprofit',
    'Home & Maintenance Services': 'home_maintenance',
    'Cleaning Services': 'cleaning_janitorial',
    'Media & Marketing Agency': 'digital_marketing_agency'
  };

  readonly categories: StoreCategory[] = [
    'All',
    'Retail & F&B',
    'Healthcare',
    'Education',
    'Business & Industrial',
    'Services & Lifestyle'
  ];

  selectedCategory: StoreCategory = 'All';
  selectedProduct: StoreProduct | null = null;
  authGateProduct: StoreProduct | null = null;
  searchText = '';
  currentPage = 1;
  itemsPerPage = 6;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const requestedSuite = String(params['checkoutSuite'] || '').trim();
      if (!requestedSuite || !this.isUserAuthenticated()) return;

      const matched = this.findProductBySuiteOrTitle(requestedSuite);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('scs_pending_checkout');
      }
      if (matched) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          fragment: 'store',
          replaceUrl: true
        });
        setTimeout(() => {
          if (typeof document !== 'undefined') {
            document.getElementById('store')?.scrollIntoView({ behavior: 'smooth' });
          }
          this.openCheckout(matched);
        }, 120);
      }
    });
  }

  // 30 Enterprise Verticals
  products: StoreProduct[] = [
    {
      title: 'Accounting & Tax Services',
      category: 'Business & Industrial',
      desc: 'End-to-end accounting suite with double-entry ledgers, monthly tax return filing, financial audit workpapers, and client billing.',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop',
      price: 'RS 13,000',
      features: [
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
      ]
    },
    {
      title: 'Agriculture & Farming',
      category: 'Business & Industrial',
      desc: 'Comprehensive farm ERP tracking acreage cultivation, seed/fertilizer inputs, harvest yield weighing, livestock herds, and mandi sales.',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600&auto=format&fit=crop',
      price: 'RS 9,500',
      features: [
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
      ]
    },
    {
      title: 'Auto Workshop & Garage',
      category: 'Services & Lifestyle',
      desc: 'Multi-bay automotive service suite managing mechanic work orders, customer vehicle profiles, diagnostic checklists, and spare parts POS.',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop',
      price: 'RS 12,500',
      features: [
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
      ]
    },
    {
      title: 'Clinic / Healthcare Center',
      category: 'Healthcare',
      desc: 'Complete outpatient medical management for polyclinics, featuring patient health records, doctor consultation schedules, and pharmacy links.',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop',
      price: 'RS 14,000',
      features: [
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
      ]
    },
    {
      title: 'Hospital Management',
      category: 'Healthcare',
      desc: 'Full-scale hospital information system managing multi-floor wards, ICUs, emergency triage, surgical OT schedules, nursing stations, and discharge summaries.',
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=600&auto=format&fit=crop',
      price: 'RS 24,000',
      features: [
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
      ]
    },
    {
      title: 'Dental Clinic',
      category: 'Healthcare',
      desc: 'Specialized dental practice management with interactive tooth odontograms, orthodontic schedules, dental implant treatment tracking, and prosthetics lab orders.',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600&auto=format&fit=crop',
      price: 'RS 11,000',
      features: [
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
      ]
    },
    {
      title: 'Pharmacy & Medical Store',
      category: 'Healthcare',
      desc: 'Pharmacy software with automated expiry alerts, narcotics register, distributor purchase orders, barcode checkout, and generic formula alternative match.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop',
      price: 'RS 15,000',
      features: [
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
      ]
    },
    {
      title: 'School / College Management',
      category: 'Education',
      desc: 'Complete Next-Gen School Campus LMS & SIS managing dynamic classes (Nursery to 10), computer/coding & STEM robotics labs, 1-Link bank fee challans, live virtual classes, report cards, and student/parent/teacher portals.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop',
      price: 'RS 12,000',
      features: [
        'Dynamic Classes & Sections (Nursery to Class 10 & Wing Setup)',
        'Computer & IT Lab Practical Suites & Terminal Roster',
        'STEM Robotics & Coding Academy Innovation Lab',
        'Live Interactive Classes & Virtual Rooms (WebRTC & Cloud Archive)',
        'Academic Curriculum & Chapter Syllabus Mapping',
        'Academic Wings & Grade Level Management (Pre-Primary to Matric)',
        'Students Admission & Promotion Matrix (Roll No & Documents)',
        'Faculty & Staff HR Rosters & Teaching Class Assignments',
        'Teacher Faculty Portal with Real-Time Gradebook & Roster',
        'Biometric RFID Gate Attendance & Shift Punching Logs',
        'Monthly Tuition Fee Challans & 1-Link Online Bank Gateways',
        'Exams, Term Report Cards, GPA & Automated Grade Compilation',
        'Lecture Timetables, Period Scheduling & Teacher Substitutions',
        'Formal Transfer, Character & School Leaving Certificates',
        'Faculty & Staff Monthly Payroll HRMS (Allowances & Deductions)',
        'Campus Inventory & Asset Procurement (Labs, Sports, Library)',
        'Hostel, Dormitory & Mess Dining Allocation (Room & Warden Logs)',
        'Student Health Clinic & Campus Infirmary Medical Records',
        'Transport Fleet Management, GPS Tracking & Student Bus Passes',
        'Campus Security Turnstile & Visitor Gate Pass System',
        'Alumni Network Directory & Career Placement Services',
        'Parents & Students Communication Portal & SMS Broadcast Alerts',
        'Library Catalog, Barcode Circulation & ISBN Registry',
        'Multi-Campus Education Centralized Administration'
      ]
    },
    {
      title: 'Coaching & Training Center',
      category: 'Education',
      desc: 'Academy ERP designed for test prep institutes, evening academies, and professional certifications with batch attendance and automated parent progress alerts.',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop',
      price: 'RS 8,000',
      features: [
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
      ]
    },
    {
      title: 'eCommerce / Online Store',
      category: 'Retail & F&B',
      desc: 'Digital storefront engine with automated courier API waybill generation, stock variant matrix, discount campaigns, and abandoned cart recovery.',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=600&auto=format&fit=crop',
      price: 'RS 16,000',
      features: [
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
      ]
    },
    {
      title: 'Retail Shop & Point of Sale',
      category: 'Retail & F&B',
      desc: 'Complete point-of-sale solution for general merchants, specialty boutiques, and retail franchises with thermal receipt printing and vendor purchase orders.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop',
      price: 'RS 10,000',
      features: [
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
      ]
    },
    {
      title: 'Super Mart & Grocery',
      category: 'Retail & F&B',
      desc: 'High-throughput supermarket ERP integrating electronic weight scales, aisle shelf inventory, fresh bakery/produce expiry control, and FMCG supplier EDI.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop',
      price: 'RS 15,500',
      features: [
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
      ]
    },
    {
      title: 'Wholesale & Distribution',
      category: 'Retail & F&B',
      desc: 'Supply chain management software with dealer ledgers, consignment manifests, credit limit enforcement, master warehouse bin locations, and route sales.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop',
      price: 'RS 17,000',
      features: [
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
      ]
    },
    {
      title: 'Restaurant & Fine Dine',
      category: 'Retail & F&B',
      desc: 'Full food and beverage suite managing table occupancy, captain waiter tablets, live kitchen display screens, recipe ingredient deduction, and split bills.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop',
      price: 'RS 13,500',
      features: [
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
      ]
    },
    {
      title: 'Pizza & Fast Food POS',
      category: 'Retail & F&B',
      desc: 'Dedicated pizzeria and fast food restaurant suite featuring customizable crust/topping modifiers, half-and-half deals, oven queue timers, and rider delivery dispatch.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop',
      price: 'RS 12,500',
      features: [
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
      ]
    },
    {
      title: 'Hotel & Hospitality',
      category: 'Retail & F&B',
      desc: 'Hotel property management system for boutique hotels, guest lodges, and resorts tracking room cleaning status, keycards, and folio billing.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop',
      price: 'RS 19,000',
      features: [
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
      ]
    },
    {
      title: 'Travel & Tourism Agency',
      category: 'Retail & F&B',
      desc: 'Full-fledged travel and tourism operations platform with embassy visa dossier pipeline, verified hotel vouchers, flight ticketing, and holiday packages.',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop',
      price: 'RS 18,000',
      features: [
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
      ]
    },
    {
      title: 'Beauty Salon & Spa',
      category: 'Services & Lifestyle',
      desc: 'Salon and luxury wellness spa management with specialist beautician booking, consumable cosmetic stock deductions, bridal packages, and commissions.',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
      price: 'RS 9,000',
      features: [
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
      ]
    },
    {
      title: 'Gym & Fitness Center',
      category: 'Services & Lifestyle',
      desc: 'Fitness club membership system with RFID turnstile gating, monthly subscription auto-renewals, certified trainer schedules, and supplement store POS.',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
      price: 'RS 8,500',
      features: [
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
      ]
    },
    {
      title: 'Property & Real Estate',
      category: 'Business & Industrial',
      desc: 'Real estate portfolio platform for commercial plazas, residential developments, and leasing agencies tracking security deposits, rent defaults, and agreements.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop',
      price: 'RS 16,500',
      features: [
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
      ]
    },
    {
      title: 'Construction Business',
      category: 'Business & Industrial',
      desc: 'General contractor and construction ERP managing project sites, bill of quantities (BOQ), subcontractor scopes, material delivery weighbills, and IPC billing.',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop',
      price: 'RS 21,000',
      features: [
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
      ]
    },
    {
      title: 'Manufacturing & Factory',
      category: 'Business & Industrial',
      desc: 'Industrial manufacturing execution system (MES) supporting multi-level bill of materials, workstation machine maintenance, scrap deduction, and production batch runs.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop',
      price: 'RS 26,000',
      features: [
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
      ]
    },
    {
      title: 'Logistics & Transport',
      category: 'Business & Industrial',
      desc: 'Fleet transport and freight logistics suite with live waybill consignment booking, vehicle maintenance rosters, fuel expense logs, and cash on delivery reconciliation.',
      image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=600&auto=format&fit=crop',
      price: 'RS 19,500',
      features: [
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
      ]
    },
    {
      title: 'Event Management',
      category: 'Services & Lifestyle',
      desc: 'Event and banquet management software for wedding halls, corporate conventions, catering services, sound/lighting subcontractors, and client payment milestones.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600&auto=format&fit=crop',
      price: 'RS 14,500',
      features: [
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
      ]
    },
    {
      title: 'HR & Payroll Services',
      category: 'Business & Industrial',
      desc: 'Human capital management system handling multi-branch employee files, automated monthly payroll computation, leave management, and tax withholdings.',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=600&auto=format&fit=crop',
      price: 'RS 11,500',
      features: [
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
      ]
    },
    {
      title: 'Legal Firm / Law Office',
      category: 'Business & Industrial',
      desc: 'Chambers and law office suite organizing litigation case files, court hearing calendars (peshi), advocate billable time logs, power of attorneys, and retainer billing.',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
      price: 'RS 17,500',
      features: [
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
      ]
    },
    {
      title: 'NGO / Nonprofit Organization',
      category: 'Services & Lifestyle',
      desc: 'Charitable foundation and trust software tracking donor contributions, Zakat fund disbursements, relief goods inventory, and beneficiary verification.',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop',
      price: 'RS 7,500',
      features: [
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
      ]
    },
    {
      title: 'Home & Maintenance Services',
      category: 'Services & Lifestyle',
      desc: 'On-demand home maintenance service platform for plumbing, electrical, HVAC repair, and pest control technicians with job geolocation and ratings.',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop',
      price: 'RS 10,500',
      features: [
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
      ]
    },
    {
      title: 'Cleaning Services',
      category: 'Services & Lifestyle',
      desc: 'Commercial facility management software tracking corporate janitorial shifts, deep-cleaning equipment, chemical consumables, and site inspection checklists.',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop',
      price: 'RS 9,000',
      features: [
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
      ]
    },
    {
      title: 'Media & Marketing Agency',
      category: 'Business & Industrial',
      desc: 'Digital advertising and creative agency management suite tracking multi-client social campaigns, graphic deliverables, ad budgets, and retainers.',
      image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=600&auto=format&fit=crop',
      price: 'RS 18,500',
      features: [
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
      ]
    }
  ];

  formatProductPrice(priceStr: string): string {
    return this.loc.convertStringPrice(priceStr);
  }

  getCategoryCount(category: StoreCategory): number {
    if (category === 'All') return this.products.length;
    return this.products.filter(p => p.category === category).length;
  }

  get filteredProducts(): StoreProduct[] {
    const query = this.searchText.trim().toLowerCase();
    return this.products.filter(p => {
      const matchesCategory = this.selectedCategory === 'All' || p.category === this.selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        p.title.toLowerCase().includes(query) ||
        p.desc.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.features.some(f => f.toLowerCase().includes(query))
      );
    });
  }

  get displayProducts(): StoreProduct[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.itemsPerPage));
  }

  setCategory(category: StoreCategory) {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.searchText = input?.value ?? '';
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchText = '';
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  resetFilters() {
    this.selectedCategory = 'All';
    this.searchText = '';
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.detectChanges();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  checkoutProduct: StoreProduct | null = null;
  checkoutSuccessData: CheckoutTransaction | null = null;
  isSubmittingCheckout = false;
  validationError = '';
  copiedIban = false;
  billingCycle: 'monthly' | 'yearly' = 'monthly';
  gatewayId: 'stripe' | 'jazzcash' | 'bank_transfer' = 'stripe';
  paymentMethod = 'Credit / Debit Card (Stripe)';

  checkoutForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    walletNumber: new FormControl('', { nonNullable: true }),
    slipRef: new FormControl('', { nonNullable: true }),
    cardNumber: new FormControl('', { nonNullable: true }),
    cardExpiry: new FormControl('', { nonNullable: true }),
    cardCvc: new FormControl('', { nonNullable: true })
  });

  getBusinessTypeSlug(p: StoreProduct): string {
    return this.businessTypeMap[p.title] || 'retail_store';
  }

  private findProductBySuiteOrTitle(key: string): StoreProduct | undefined {
    const lower = key.toLowerCase();
    const direct = this.products.find(
      p => p.title.toLowerCase() === lower || this.getBusinessTypeSlug(p).toLowerCase() === lower
    );
    if (direct) return direct;

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('scs_pending_checkout');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.title) {
            return this.products.find(p => p.title === parsed.title);
          }
        }
      } catch {}
    }
    return undefined;
  }

  private getAuthenticatedUser(): any | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const token = localStorage.getItem('scs_auth_session');
      const rawUser = localStorage.getItem('user_data');
      if (!token || !rawUser) return null;
      const user = JSON.parse(rawUser);
      if (user && user.email && user.role) return user;
    } catch {}
    return null;
  }

  isUserAuthenticated(): boolean {
    return Boolean(this.getAuthenticatedUser());
  }

  openModal(p: StoreProduct) {
    this.selectedProduct = p;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.selectedProduct = null;
    this.cdr.detectChanges();
  }

  closeAuthGate() {
    this.authGateProduct = null;
    this.cdr.detectChanges();
  }

  proceedToRegister() {
    if (!this.authGateProduct) return;
    const p = this.authGateProduct;
    const suiteSlug = this.getBusinessTypeSlug(p);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'scs_pending_checkout',
        JSON.stringify({ title: p.title, businessType: suiteSlug, timestamp: Date.now() })
      );
    }
    this.authGateProduct = null;
    this.cdr.detectChanges();
    void this.router.navigate(['/register'], {
      queryParams: {
        suite: suiteSlug,
        plan: p.title,
        redirect: 'checkout'
      }
    });
  }

  proceedToLogin() {
    if (!this.authGateProduct) return;
    const p = this.authGateProduct;
    const suiteSlug = this.getBusinessTypeSlug(p);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'scs_pending_checkout',
        JSON.stringify({ title: p.title, businessType: suiteSlug, timestamp: Date.now() })
      );
    }
    this.authGateProduct = null;
    this.cdr.detectChanges();
    void this.router.navigate(['/login'], {
      queryParams: {
        redirect: 'checkout',
        suite: suiteSlug,
        plan: p.title
      }
    });
  }

  goToDashboard() {
    this.closeCheckout();
    void this.router.navigateByUrl('/dashboard');
  }

  openCheckout(p: StoreProduct, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedProduct = null;

    const authUser = this.getAuthenticatedUser();
    if (!authUser) {
      this.authGateProduct = p;
      this.cdr.detectChanges();
      return;
    }

    this.authGateProduct = null;
    this.checkoutProduct = p;
    this.checkoutSuccessData = null;
    this.validationError = '';
    this.billingCycle = 'monthly';
    this.gatewayId = 'stripe';
    this.paymentMethod = 'Credit / Debit Card (Stripe)';

    if (typeof localStorage !== 'undefined') {
      const savedName =
        authUser.full_name ||
        localStorage.getItem('scs_user_name') ||
        localStorage.getItem('scs_full_name') ||
        '';
      const savedEmail =
        authUser.email ||
        localStorage.getItem('scs_user_email') ||
        localStorage.getItem('scs_email') ||
        '';
      const savedPhone = authUser.phone || localStorage.getItem('scs_user_phone') || '';
      this.checkoutForm.patchValue({
        name: this.checkoutForm.controls.name.value || savedName,
        email: this.checkoutForm.controls.email.value || savedEmail,
        phone: this.checkoutForm.controls.phone.value || savedPhone
      });
    }
    this.cdr.detectChanges();
  }

  closeCheckout() {
    this.checkoutProduct = null;
    this.checkoutSuccessData = null;
    this.validationError = '';
    this.isSubmittingCheckout = false;
    this.checkoutForm.patchValue({
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
      slipRef: ''
    });
    this.cdr.detectChanges();
  }

  setBillingCycle(cycle: 'monthly' | 'yearly') {
    this.billingCycle = cycle;
    this.cdr.detectChanges();
  }

  setGateway(id: 'stripe' | 'jazzcash' | 'bank_transfer', name: string) {
    this.gatewayId = id;
    this.paymentMethod = name;
    this.validationError = '';
    this.cdr.detectChanges();
  }

  getMaskedCardPreview(): string {
    const digits = this.checkoutForm.controls.cardNumber.value.replace(/\D/g, '');
    if (!digits) return '•••• •••• •••• ••••';
    const padded = digits.slice(0, 16);
    const groups = padded.match(/.{1,4}/g) || [];
    return groups.join(' ');
  }

  copyIban() {
    const iban = 'PK42MEZN0001090123456789';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(iban).then(() => {
        this.copiedIban = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.copiedIban = false;
          this.cdr.detectChanges();
        }, 3000);
      });
    }
  }

  getCalculatedAmount(): string {
    if (!this.checkoutProduct) return this.loc.formatPrice(0, 'PKR');
    const basePriceNum = parseInt(this.checkoutProduct.price.replace(/[^0-9]/g, ''), 10) || 12000;
    if (this.billingCycle === 'yearly') {
      const yearlyDiscounted = basePriceNum * 12 * 0.8;
      return this.loc.formatPrice(yearlyDiscounted, 'PKR');
    }
    return this.loc.formatPrice(basePriceNum, 'PKR');
  }

  private validateCheckout(): string | null {
    const name = this.checkoutForm.controls.name.value.trim();
    const email = this.checkoutForm.controls.email.value.trim();

    if (!name || name.length < 2) {
      return 'Please enter your Full Name to register the license.';
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid Email Address (e.g. name@company.com).';
    }

    if (this.gatewayId === 'stripe') {
      const cardDigits = this.checkoutForm.controls.cardNumber.value.replace(/\D/g, '');
      const expiryRaw = this.checkoutForm.controls.cardExpiry.value.replace(/\s+/g, '');
      const cvcDigits = this.checkoutForm.controls.cardCvc.value.replace(/\D/g, '');

      if (cardDigits.length < 13 || cardDigits.length > 19) {
        return 'Please enter a valid 13–19 digit card number.';
      }
      if (!/^(0[1-9]|1[0-2])\/?\d{2}$/.test(expiryRaw)) {
        return 'Please enter a valid card expiry date (MM/YY).';
      }
      if (cvcDigits.length < 3 || cvcDigits.length > 4) {
        return 'Please enter a valid 3 or 4 digit security code (CVV/CVC).';
      }
    } else if (this.gatewayId === 'jazzcash') {
      const walletDigits = this.checkoutForm.controls.walletNumber.value.replace(/[\s\-()]/g, '');
      if (!/^\+?\d{10,15}$/.test(walletDigits)) {
        return 'Please enter a valid Mobile Wallet account number (e.g. 03001234567).';
      }
    } else if (this.gatewayId === 'bank_transfer') {
      const slipRef = this.checkoutForm.controls.slipRef.value.trim();
      if (slipRef.length < 4) {
        return 'Please enter your Bank Transaction ID or Deposit Slip Reference.';
      }
    }

    return null;
  }

  async processCustomerPayment() {
    if (!this.checkoutProduct || this.isSubmittingCheckout) return;

    const error = this.validateCheckout();
    if (error) {
      this.validationError = error;
      this.cdr.detectChanges();
      return;
    }

    this.validationError = '';
    this.isSubmittingCheckout = true;
    this.cdr.detectChanges();

    const name = this.checkoutForm.controls.name.value.trim();
    const email = this.checkoutForm.controls.email.value.trim();
    const whatsappPhone = this.checkoutForm.controls.phone.value.trim();
    const walletPhone = this.checkoutForm.controls.walletNumber.value.trim();
    const effectivePhone = whatsappPhone || (this.gatewayId === 'jazzcash' ? walletPhone : '');
    const amountVal = this.getCalculatedAmount();

    const authUser = this.getAuthenticatedUser();
    const tenantId =
      authUser?.tenant_id ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('scs_tenant_id') : '') ||
      '';
    const businessTypeSlug = this.getBusinessTypeSlug(this.checkoutProduct);

    const payload = {
      customerName: name,
      customerEmail: email,
      customerPhone: effectivePhone || 'N/A',
      softwareTitle: this.checkoutProduct.title,
      billingCycle: this.billingCycle,
      gatewayId: this.gatewayId,
      paymentMethod: this.paymentMethod,
      amount: amountVal,
      slipReference: this.gatewayId === 'bank_transfer' ? this.checkoutForm.controls.slipRef.value.trim() : '',
      tenantId,
      businessType: businessTypeSlug
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('/api/public/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok || !data?.transaction) {
        this.validationError =
          data?.message || 'Payment gateway could not confirm your order. Please verify your details and try again.';
        return;
      }

      this.checkoutSuccessData = {
        ...data.transaction,
        hasPhone: Boolean(effectivePhone),
        notificationsDispatched: Array.isArray(data.notificationsDispatched)
          ? data.notificationsDispatched
          : ['EMAIL']
      };

      if (data.transaction.status === 'PAID' && authUser && typeof localStorage !== 'undefined') {
        const updatedUser = {
          ...authUser,
          status: 'ACTIVE',
          business_type: businessTypeSlug
        };
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }

      this.checkoutForm.patchValue({ cardNumber: '', cardExpiry: '', cardCvc: '', slipRef: '' });
    } catch {
      this.validationError = 'Unable to reach checkout server right now. Please check your connection and try again.';
    } finally {
      this.isSubmittingCheckout = false;
      this.cdr.detectChanges();
    }
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement | null;
    if (!target || target.dataset['fallbackApplied']) return;
    target.dataset['fallbackApplied'] = 'true';
    target.src = NEUTRAL_FALLBACK_IMAGE;
  }
}