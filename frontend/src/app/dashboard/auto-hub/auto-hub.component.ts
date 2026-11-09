import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Wrench,
  Car,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Users,
  Boxes,
  FileText,
  Printer,
  DollarSign,
  ShieldCheck,
  Calendar
} from 'lucide-angular';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-auto-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './auto-hub.component.html'
})
export class DashboardAutoHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Wrench,
    Car,
    Search,
    Plus,
    CheckCircle2,
    Clock,
    AlertTriangle,
    X,
    Users,
    Boxes,
    FileText,
    Printer,
    DollarSign,
    ShieldCheck,
    Calendar
  };

  activeTab: 'jobs' | 'vehicles' | 'mechanics' | 'parts' | 'estimates' = 'jobs';
  isLoading = false;
  searchQuery = '';
  actionMessage = '';

  jobs: any[] = [];
  vehicles: any[] = [];
  mechanics: any[] = [];
  parts: any[] = [];
  estimates: any[] = [];

  showNewJobModal = false;
  showNewPartModal = false;
  showInvoiceModal = false;
  selectedJobForInvoice: any = null;

  getTotalInvoiceAmount(): number {
    return (Number(this.selectedJobForInvoice?.estimate) || 0) + 15;
  }

  newJob = {
    vehicle: '',
    plate: '',
    customer: '',
    phone: '',
    mechanic: 'Master Akram (Senior Tech)',
    service: 'Full Engine Tune-up & Brake Pad Replacement',
    priority: 'Normal',
    estimate: 240
  };

  newPart = {
    code: 'PRT-8821',
    name: '',
    category: 'Braking & Suspension',
    unitPrice: 45,
    costPrice: 28,
    stock: 12,
    minStock: 4
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [jRes, fRes] = await Promise.all([
        this.backend.getAutoJobs(),
        this.backend.getAutoFleet()
      ]);
      this.jobs = (jRes.jobs && jRes.jobs.length > 0) ? jRes.jobs : this.defaultJobs;
      this.vehicles = (fRes.fleet && fRes.fleet.length > 0) ? fRes.fleet : this.defaultVehicles;
    } catch {
      this.jobs = this.defaultJobs;
      this.vehicles = this.defaultVehicles;
    } finally {
      this.mechanics = this.defaultMechanics;
      this.parts = this.defaultParts;
      this.estimates = this.defaultEstimates;
      this.isLoading = false;
    }
  }

  get stats() {
    const activeJobs = this.jobs.filter(j => j.status !== 'COMPLETED').length;
    const inProgress = this.jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'DIAGNOSING').length;
    const readyJobs = this.jobs.filter(j => j.status === 'READY_DELIVERY').length;
    const partsLow = this.parts.filter(p => p.stock <= p.minStock).length;
    const totalRevenue = this.jobs.reduce((sum, j) => sum + (Number(j.estimate) || 0), 0);
    return { activeJobs, inProgress, readyJobs, partsLow, totalRevenue };
  }

  get filteredJobs() {
    if (!this.searchQuery) return this.jobs;
    const q = this.searchQuery.toLowerCase();
    return this.jobs.filter(j =>
      j.vehicle?.toLowerCase().includes(q) ||
      j.plate?.toLowerCase().includes(q) ||
      j.customer?.toLowerCase().includes(q) ||
      j.jobNo?.toLowerCase().includes(q) ||
      j.mechanic?.toLowerCase().includes(q)
    );
  }

  get filteredParts() {
    if (!this.searchQuery) return this.parts;
    const q = this.searchQuery.toLowerCase();
    return this.parts.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }

  get filteredVehicles() {
    if (!this.searchQuery) return this.vehicles;
    const q = this.searchQuery.toLowerCase();
    return this.vehicles.filter(v =>
      v.model?.toLowerCase().includes(q) ||
      v.plate?.toLowerCase().includes(q) ||
      v.owner?.toLowerCase().includes(q)
    );
  }

  async updateJobStatus(job: any, status: string): Promise<void> {
    job.status = status;
    try {
      await this.backend.updateAutoJobStatus(job.id, status);
    } catch {}
    this.actionMessage = `Job #${job.jobNo} moved to ${status.replace('_', ' ')}`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  openInvoice(job: any): void {
    this.selectedJobForInvoice = job;
    this.showInvoiceModal = true;
  }

  printInvoice(): void {
    window.print();
  }

  async submitNewJob(): Promise<void> {
    if (!this.newJob.vehicle || !this.newJob.customer) return;
    const job = {
      id: 'job-' + Date.now(),
      jobNo: 'JC-' + (1000 + this.jobs.length + 1),
      vehicle: this.newJob.vehicle,
      plate: this.newJob.plate || 'ABC-' + Math.floor(100 + Math.random() * 900),
      customer: this.newJob.customer,
      phone: this.newJob.phone || '+92 300 1234567',
      mechanic: this.newJob.mechanic,
      service: this.newJob.service,
      status: 'DIAGNOSING',
      estimate: Number(this.newJob.estimate) || 150,
      priority: this.newJob.priority,
      createdAt: 'Today, Just Now'
    };
    this.jobs.unshift(job);
    this.showNewJobModal = false;
    this.actionMessage = `Job card #${job.jobNo} opened for ${job.vehicle}`;
    setTimeout(() => this.actionMessage = '', 3500);
    this.newJob = {
      vehicle: '',
      plate: '',
      customer: '',
      phone: '',
      mechanic: 'Master Akram (Senior Tech)',
      service: 'Full Engine Tune-up & Brake Pad Replacement',
      priority: 'Normal',
      estimate: 240
    };
  }

  submitNewPart(): void {
    if (!this.newPart.name) return;
    const part = {
      id: 'prt-' + Date.now(),
      code: 'PRT-' + Math.floor(1000 + Math.random() * 9000),
      name: this.newPart.name,
      category: this.newPart.category,
      unitPrice: Number(this.newPart.unitPrice) || 20,
      costPrice: Number(this.newPart.costPrice) || 12,
      stock: Number(this.newPart.stock) || 1,
      minStock: Number(this.newPart.minStock) || 2
    };
    this.parts.unshift(part);
    this.showNewPartModal = false;
    this.actionMessage = `Part ${part.name} added to inventory!`;
    setTimeout(() => this.actionMessage = '', 3500);
    this.newPart = {
      code: 'PRT-8821',
      name: '',
      category: 'Braking & Suspension',
      unitPrice: 45,
      costPrice: 28,
      stock: 12,
      minStock: 4
    };
  }

  readonly defaultJobs = [
    {
      id: 'job-1',
      jobNo: 'JC-1082',
      vehicle: 'Toyota Corolla Grande 1.8',
      plate: 'LEB-24-9102',
      customer: 'Usman Ghani',
      phone: '+92 321 8847291',
      mechanic: 'Master Akram (Senior Tech)',
      service: 'Periodic 40,000km Maintenance & Catalytic Cleaning',
      status: 'IN_PROGRESS',
      estimate: 280,
      priority: 'High',
      createdAt: 'Today 09:30 AM'
    },
    {
      id: 'job-2',
      jobNo: 'JC-1083',
      vehicle: 'Honda Civic RS Turbo',
      plate: 'ICT-22-4411',
      customer: 'Hamza Farooq',
      phone: '+92 300 5519283',
      mechanic: 'Rashid Auto Electrician',
      service: 'AC Compressor Replacement & Gas Recharge',
      status: 'DIAGNOSING',
      estimate: 420,
      priority: 'Normal',
      createdAt: 'Today 10:15 AM'
    },
    {
      id: 'job-3',
      jobNo: 'JC-1084',
      vehicle: 'Kia Sportage AWD',
      plate: 'KHI-23-7729',
      customer: 'Dr. Tariq Mehmood',
      phone: '+92 333 9928172',
      mechanic: 'Umer Suspension Specialist',
      service: 'Front Shock Absorber & Bushing Replacement',
      status: 'READY_DELIVERY',
      estimate: 350,
      priority: 'Urgent',
      createdAt: 'Yesterday'
    },
    {
      id: 'job-4',
      jobNo: 'JC-1085',
      vehicle: 'Hyundai Tucson GLS',
      plate: 'ISB-24-5501',
      customer: 'Zainab Bibi',
      phone: '+92 301 7729182',
      mechanic: 'Master Akram (Senior Tech)',
      service: 'Brake Disc Resurfacing & Ceramic Pads',
      status: 'COMPLETED',
      estimate: 190,
      priority: 'Normal',
      createdAt: '2 days ago'
    }
  ];

  readonly defaultVehicles = [
    { id: 'v-1', model: 'Toyota Corolla Grande 1.8', plate: 'LEB-24-9102', owner: 'Usman Ghani', year: '2022', mileage: '41,200 km', engine: '1.8L VVTi', status: 'In Bay 2' },
    { id: 'v-2', model: 'Honda Civic RS Turbo', plate: 'ICT-22-4411', owner: 'Hamza Farooq', year: '2021', mileage: '34,500 km', engine: '1.5L Turbo', status: 'Bay 4 (AC Dept)' },
    { id: 'v-3', model: 'Kia Sportage AWD', plate: 'KHI-23-7729', owner: 'Dr. Tariq Mehmood', year: '2023', mileage: '22,100 km', engine: '2.0L MPI', status: 'Wash & Polish Bay' },
    { id: 'v-4', model: 'Hyundai Tucson GLS', plate: 'ISB-24-5501', owner: 'Zainab Bibi', year: '2023', mileage: '18,400 km', engine: '2.0L Dual CVVT', status: 'Dispatched' }
  ];

  readonly defaultMechanics = [
    { id: 'm-1', name: 'Master Akram', specialty: 'Senior Engine & Transmission', activeJobs: 2, rating: '4.9', phone: '+92 300 4429182', status: 'Active' },
    { id: 'm-2', name: 'Rashid Ali', specialty: 'Auto Electrician & Scanner Diagnostics', activeJobs: 1, rating: '4.8', phone: '+92 321 9928172', status: 'Active' },
    { id: 'm-3', name: 'Umer Farooq', specialty: 'Under-carriage & Suspension', activeJobs: 1, rating: '4.7', phone: '+92 334 1128762', status: 'Active' },
    { id: 'm-4', name: 'Zeeshan Khan', specialty: 'AC & Climate Control Specialist', activeJobs: 0, rating: '4.9', phone: '+92 312 8847291', status: 'Available' }
  ];

  readonly defaultParts = [
    { id: 'p-1', code: 'BRK-4011', name: 'Ceramic Front Brake Pads (Corolla/Civic)', category: 'Braking System', unitPrice: 65, costPrice: 42, stock: 18, minStock: 6 },
    { id: 'p-2', code: 'FLT-1029', name: 'Synthetic Oil Filter Genuine OEM', category: 'Lubrication', unitPrice: 18, costPrice: 10, stock: 42, minStock: 15 },
    { id: 'p-3', code: 'SHK-5520', name: 'Front Strut Shock Absorber (Sportage)', category: 'Suspension', unitPrice: 140, costPrice: 95, stock: 3, minStock: 4 },
    { id: 'p-4', code: 'ENG-9901', name: 'Iridium Spark Plugs Set of 4 (Denso)', category: 'Ignition', unitPrice: 80, costPrice: 52, stock: 14, minStock: 5 },
    { id: 'p-5', code: 'GAS-134A', name: 'R134a AC Refrigerant Canister (13.6kg)', category: 'AC Parts', unitPrice: 120, costPrice: 85, stock: 2, minStock: 3 }
  ];

  readonly defaultEstimates = [
    { id: 'est-1', estNo: 'EST-902', customer: 'Usman Ghani', vehicle: 'Toyota Corolla', partsAmount: 160, laborAmount: 120, tax: 28, total: 308, status: 'Approved' },
    { id: 'est-2', estNo: 'EST-903', customer: 'Hamza Farooq', vehicle: 'Honda Civic', partsAmount: 280, laborAmount: 140, tax: 42, total: 462, status: 'Pending Review' },
    { id: 'est-3', estNo: 'EST-904', customer: 'Dr. Tariq Mehmood', vehicle: 'Kia Sportage', partsAmount: 220, laborAmount: 130, tax: 35, total: 385, status: 'Billed & Settled' }
  ];
}
