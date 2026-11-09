import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  HeartPulse,
  Calendar,
  FileText,
  User,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  Printer,
  X
} from 'lucide-angular';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-clinic-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './clinic-hub.component.html'
})
export class DashboardClinicHubComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    HeartPulse,
    Calendar,
    FileText,
    User,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    Check,
    Printer,
    X
  };

  activeTab: 'queue' | 'patients' | 'prescriptions' = 'queue';
  isLoading = false;
  searchQuery = '';
  actionMessage = '';

  patients: any[] = [];
  appointments: any[] = [];
  prescriptions: any[] = [];

  // Modals
  showNewPatientModal = false;
  showNewAptModal = false;
  showNewRxModal = false;
  showRxViewModal = false;
  selectedRx: any = null;

  newPatient = {
    fullName: '',
    age: 32,
    gender: 'Male',
    phone: '',
    bloodGroup: 'B+',
    chronic: 'None'
  };

  newApt = {
    patientName: '',
    doctor: 'Dr. Tariq Al-Mansoor (Cardiology)',
    time: '10:30 AM',
    date: new Date().toISOString().split('T')[0],
    fee: 40,
    vitals: 'BP 120/80, Pulse 72'
  };

  newRx = {
    patientName: '',
    doctor: 'Dr. Tariq Al-Mansoor',
    diagnosis: '',
    medicineName: '',
    dosage: '',
    days: 15
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const [patRes, aptRes, rxRes] = await Promise.all([
        this.backend.getClinicPatients(),
        this.backend.getClinicAppointments(),
        this.backend.getClinicPrescriptions()
      ]);
      this.patients = patRes.patients || [];
      this.appointments = aptRes.appointments || [];
      this.prescriptions = rxRes.prescriptions || [];
    } finally {
      this.isLoading = false;
    }
  }

  get stats() {
    const totalPatients = this.patients.length;
    const waiting = this.appointments.filter(a => a.status === 'WAITING').length;
    const inConsultation = this.appointments.filter(a => a.status === 'IN_CONSULTATION').length;
    const totalOpdFee = this.appointments.reduce((sum, a) => sum + (a.fee || 0), 0);
    return { totalPatients, waiting, inConsultation, totalOpdFee };
  }

  async registerPatient(): Promise<void> {
    if (!this.newPatient.fullName) return;
    this.isLoading = true;
    try {
      const res = await this.backend.registerClinicPatient(this.newPatient);
      if (res.ok && res.patient) {
        this.patients.unshift(res.patient);
      } else {
        await this.loadData();
      }
      this.showNewPatientModal = false;
      this.actionMessage = `Patient ${this.newPatient.fullName} registered in EHR records!`;
      setTimeout(() => this.actionMessage = '', 3500);
      this.newPatient = {
        fullName: '',
        age: 32,
        gender: 'Male',
        phone: '',
        bloodGroup: 'B+',
        chronic: 'None'
      };
    } finally {
      this.isLoading = false;
    }
  }

  async bookAppointment(): Promise<void> {
    if (!this.newApt.patientName) return;
    this.isLoading = true;
    try {
      const res = await this.backend.createClinicAppointment(this.newApt);
      if (res.ok && res.appointment) {
        this.appointments.unshift(res.appointment);
      } else {
        await this.loadData();
      }
      this.showNewAptModal = false;
      this.actionMessage = `Token issued for ${this.newApt.patientName}!`;
      setTimeout(() => this.actionMessage = '', 3500);
    } finally {
      this.isLoading = false;
    }
  }

  async setAptStatus(apt: any, status: string): Promise<void> {
    apt.status = status;
    await this.backend.updateClinicAppointmentStatus(apt.id, status);
    this.actionMessage = `Token #${apt.tokenNo} status set to ${status}`;
    setTimeout(() => this.actionMessage = '', 3500);
  }

  async issuePrescription(): Promise<void> {
    if (!this.newRx.patientName || !this.newRx.diagnosis) return;
    this.isLoading = true;
    try {
      const payload = {
        patientName: this.newRx.patientName,
        doctor: this.newRx.doctor,
        diagnosis: this.newRx.diagnosis,
        medicines: [
          { name: this.newRx.medicineName || 'Amoxicillin 500mg', dosage: this.newRx.dosage || '1 capsule tid', days: this.newRx.days }
        ]
      };
      const res = await this.backend.createClinicPrescription(payload);
      if (res.ok && res.prescription) {
        this.prescriptions.unshift(res.prescription);
        this.selectedRx = res.prescription;
        this.showNewRxModal = false;
        this.showRxViewModal = true;
        this.actionMessage = 'Digital prescription stamped & generated!';
        setTimeout(() => this.actionMessage = '', 3500);
      }
    } finally {
      this.isLoading = false;
    }
  }

  viewPrescription(rx: any): void {
    this.selectedRx = rx;
    this.showRxViewModal = true;
  }

  printSlip(): void {
    window.print();
  }
}
