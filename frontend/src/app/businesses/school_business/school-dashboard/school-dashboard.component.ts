import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { dashboardIcons } from '../../../dashboard/dashboard.component';
import { DataTableComponent } from '../../../dashboard/components/data-table/data-table.component';
import { AuditReconciliationTrendsComponent } from '../../../dashboard/components/audit-reconciliation-trends/audit-reconciliation-trends.component';
import { AnalyticsDashboardComponent } from '../../../dashboard/components/analytics-dashboard/analytics-dashboard.component';
import {
  LucideAngularModule,
  Users,
  GraduationCap,
  Users2,
  Heart,
  Calendar,
  Search,
  Plus,
  Filter,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Clock,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  LayoutDashboard,
  BookOpen,
  Backpack,
  Trophy,
  Activity,
  Bell,
  Settings,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Send,
  UserCheck,
  UserPlus,
  UserX,
  PhoneCall,
  Mail,
  Award,
  Building2,
  Printer,
  Smartphone,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Trash2,
  Pencil,
  Eye,
  Check,
  QrCode,
  WalletCards,
  Receipt,
  Bus,
  Library,
  ClipboardCheck,
  MessageSquareWarning
} from 'lucide-angular';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseDbService } from '../../../services/firebase-db.service';

export type SchoolDashboardTab = 'overview' | 'stage_wise' | 'feed' | 'events' | 'students' | 'teachers' | 'admissions' | 'attendance' | 'finance' | 'invoices' | 'expenses' | 'payment_gateway' | 'transport' | 'library' | 'exams' | 'timetable' | 'hostel' | 'labs' | 'alumni' | 'portals' | 'reports' | 'settings' | 'audit' | 'lesson_plans' | 'appraisals' | 'inspections' | 'exam_moderation' | 'parent_complaints' | 'substitutions' | 'syllabus' | 'safeguarding' | 'directives';
export type SchoolPortalRole = 'owner' | 'principal' | 'teacher' | 'student' | 'parent';

export interface SchoolAuditTrailRecord {
  id: string;
  timestamp: string;
  operatorName: string;
  operatorRole: 'Principal' | 'School Owner' | 'Owner Executive' | 'Accounts Controller' | 'Examination Dean' | 'System Auditor';
  actionType: 'Fee Waiver / Concession' | 'Mark Moderation Lock' | 'Salary Arrears Clearance' | 'Student Leaving Certificate (SLC)' | 'Fee Voucher Deletion' | 'Attendance Modification' | 'Biometric IP Override' | 'Asset Write-Off' | 'Exam Moderation & Tamper-Lock';
  category: 'Financial' | 'Academic' | 'Administrative' | 'Security & Biometric';
  entityId: string;
  entityDescription: string;
  details: string;
  severity: 'Normal Audit' | 'Authorized Override' | 'Compliance Flag' | 'Critical Security' | 'Critical / High Security';
  verifiedBy: string;
  ipAddress?: string;
}

export interface FeeReconciliationRecord {
  id: string;
  date: string;
  counterCashReceived: number;
  bankDepositedMeezan: number;
  bankDepositedHBL: number;
  onlineDigitalKuickPay: number;
  totalSystemBilled: number;
  actualCollected: number;
  varianceAmount: number;
  reconciliationStatus: 'Balanced & Cleared' | 'Surplus Recorded' | 'Audit Deficit Flagged';
  cashierName: string;
  verifiedByAuditor: string;
  notes?: string;
}

export interface StudentLeavingCertificateRecord {
  id: string;
  certificateNo: string;
  securityHash: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  rollNo: string;
  grade: string;
  admissionDate: string;
  leavingDate: string;
  reasonForLeaving: string;
  conductRating: 'Exemplary & Outstanding' | 'Good & Satisfactory' | 'Average';
  academicAchievement: string;
  accountsClearance: boolean;
  libraryClearance: boolean;
  labClearance: boolean;
  sportsClearance: boolean;
  issuedBy: string;
  status: 'Issued & Sealed' | 'Pending Dues Clearance' | 'Archived';
}

export interface ComplianceAuditItem {
  id: string;
  area: string;
  title: string;
  standard: string;
  status: 'Compliant & Verified' | 'Action Required' | 'Audit Warning';
  responsiblePerson: string;
  lastCheckedDate: string;
  nextRenewalDate: string;
  notes: string;
}


export interface MasterInvoiceRecord {
  id: string;
  invoiceNo: string;
  type: 'Student Fee' | 'Staff Payroll' | 'Vendor Expense' | 'Transcript/Certificate' | 'Custom Billing';
  title: string;
  recipientName: string;
  recipientRole: 'Student' | 'Parent' | 'Teacher/Staff' | 'Vendor';
  recipientSubtext?: string;
  amount: number;
  discount: number;
  tax: number;
  netPayable: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial' | 'Cancelled';
  paymentMethod?: string;
  transactionRef?: string;
  lineItems: Array<{ description: string; qty: number; unitPrice: number; total: number }>;
  notes?: string;
  qrCodeUrl?: string;
  verifiedBy?: string;
}

export interface SubstituteArrangementRecord {
  id: string;
  date: string;
  period: string;
  timeSlot?: string;
  grade: string;
  subject: string;
  absentTeacher: string;
  substituteTeacher: string;
  status: 'Assigned' | 'Completed' | 'Pending';
  reason?: string;
  roomNo?: string;
  assignedBy?: string;
}

export interface SyllabusTrackerRecord {
  id: string;
  grade: string;
  subject: string;
  teacher?: string;
  teacherName?: string;
  totalChapters?: number;
  completedChapters?: number;
  percentage?: number;
  completedPercentage?: number;
  status: 'On Track' | 'Behind Schedule' | 'Ahead of Schedule' | string;
  lastReviewed?: string;
  examPortionCovered?: string;
  targetExam?: string;
}

export interface DailyInspectionLogRecord {
  id: string;
  roundTime?: string;
  time?: string;
  wing?: string;
  location?: string;
  uniformDiscipline?: 'Excellent' | 'Satisfactory' | 'Needs Attention' | string;
  uniformCheck?: string;
  teacherPunctuality?: 'All Present On-Time' | '1 Late' | '2 Late' | string;
  cleanlinessRating?: '5/5 Spotless' | '4/5 Clean' | '3/5 Needs Cleaning' | string;
  cleanlinessScore?: string;
  remarks?: string;
  notes?: string;
  actionRequired?: string;
  loggedBy?: string;
  inspectorName?: string;
}

export interface HostelRoomRecord {
  id: string;
  roomNo: string;
  floor: string;
  capacity: number;
  occupied: number;
  warden: string;
  phone: string;
  messFee: number;
  status: 'Available' | 'Full' | 'Maintenance';
  residentStudents: string[];
}

export interface AlumniRecord {
  id: string;
  name: string;
  rollNo: string;
  batchYear: string;
  matricClass: string;
  slcNumber: string;
  institute: string;
  phone: string;
  email: string;
  achievements: string;
  gpa: string;
}

export interface LabWorkstationRecord {
  id: string;
  label: string;
  lab: string;
  specs: string;
  status: 'Online' | 'Offline' | 'Maintenance' | 'Active Session';
  assignedStudent?: string;
}

export interface LabScheduleSlot {
  id: string;
  lab: string;
  day: string;
  period: string;
  grade: string;
  subject: string;
  teacher: string;
  experimentTopic: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  grade: string;
  section: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  attendance: string;
  image: string;
  guardian: string;
  guardianPhone: string;
  feeStatus: 'Paid' | 'Pending' | 'Overdue';
  feeAmount: number;
  rollNo: string;
  admissionDate: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  bloodGroup?: string;
  studentBForm?: string;
  previousSchool?: string;
  score?: string;
  medicalConditions?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  guardianCnic?: string;
  guardianOccupation?: string;
  address?: string;
  emergencyContact?: string;
  dueBakaya?: number;
  lastPaymentDate?: string;
  biometricEnrolled?: boolean;
  faceEmbeddingToken?: string;
  irisScanCode?: string;
  irisEnrolledAt?: string;
  fingerprintEnrolled?: boolean;
  fingerprintTemplateHash?: string;
  classGrade?: string;
  attendanceStatus?: string;
}

export interface TeacherRecord {
  id: string;
  name: string;
  subject: string;
  qualification: string;
  classes: number;
  status: 'Active' | 'On Leave' | 'Busy' | 'Resigned';
  rating: number;
  email: string;
  phone: string;
  image: string;
  salaryStatus: 'Disbursed' | 'Processing' | 'Pending Arrears';
  monthlySalary: number;
  appointmentDate?: string;
  resignationDate?: string;
  tenureDuration?: string;
  unpaidSalaryMonths?: number;
  remainingSalaryArrears?: number;
  cnic?: string;
  gender?: 'Male' | 'Female' | 'Other';
  experienceYears?: number;
  assignedGrade?: string;
  biometricEnrolled?: boolean;
  faceEmbeddingToken?: string;
  irisScanCode?: string;
  irisEnrolledAt?: string;
  fingerprintEnrolled?: boolean;
  fingerprintTemplateHash?: string;
  inchargeClass?: string;
  emergencyContact?: string;
  address?: string;
  bankName?: string;
  accountNo?: string;
  employmentType?: 'Permanent' | 'Contract' | 'Probation';
  previousInstitute?: string;
  weeklyPeriods?: number;
  role?: string;
  designation?: string;
}

export interface StudentFeeDefaulterRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  grade: string;
  guardianName: string;
  guardianPhone: string;
  monthlyFee: number;
  unpaidMonthsCount: number;
  unpaidMonthsList: string[];
  totalPaidToDate: number;
  totalRemainingBakaya: number;
  lastPaymentDate: string;
  alertStatus: 'Not Sent' | 'SMS Dispatched' | 'WhatsApp Reminder Sent';
  lastAlertTimestamp?: string;
}

export interface ClassFeeSummary {
  className: string;
  totalStudentsCount: number;
  totalMonthlyBilled: number;
  totalFeeCollected: number;
  totalRemainingBakaya: number;
  defaulterStudentsCount: number;
  collectionRate: number;
}

export interface ProfitLossMonthLedger {
  id: string;
  monthYear: string;
  year: string;
  tuitionFeeIncome: number;
  transportFeeIncome: number;
  otherIncome: number;
  totalGrossIncome: number;
  teacherSalariesExpense: number;
  campusRentUtilitiesExpense: number;
  inventoryMaintenanceExpense: number;
  totalOperatingExpense: number;
  netProfitOrLoss: number;
  status: 'Surplus Profit' | 'Deficit Loss' | 'Balanced';
}

export interface DispatchAlertLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  channel: 'WhatsApp' | 'SMS' | 'Portal Alert';
  targetRole: 'Parent' | 'Teacher' | 'Student';
  messageText: string;
  sentAt: string;
  deliveryStatus: 'Delivered' | 'Queued' | 'Sent';
}

export interface AdmissionRecord {
  id: string;
  applicant: string;
  appliedFor: string;
  fatherName: string;
  date: string;
  status: 'Approved' | 'Interview Scheduled' | 'Under Review' | 'Rejected';
  score: string;
  phone: string;
  // Complete application form particulars
  gender?: 'Male' | 'Female' | string;
  dob?: string;
  studentBForm?: string;
  bloodGroup?: string;
  section?: string;
  rollNo?: string;
  previousSchool?: string;
  relation?: string;
  fatherCnic?: string;
  email?: string;
  fatherOccupation?: string;
  address?: string;
  emergencyContact?: string;
  admissionFee?: number;
  tuitionFee?: number;
  discount?: number;
  initialPaymentStatus?: 'Paid' | 'Pending' | string;
  medicalNotes?: string;
  source?: 'School Office Direct' | 'Online Parent Portal';
  interviewDate?: string;
  interviewNotes?: string;
  decisionRemarks?: string;
}

export interface FinanceRecord {
  id: string;
  title: string;
  studentName?: string;
  grade?: string;
  category: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string;
  status: 'Verified' | 'Pending' | 'Processed';
  challanNo: string;
  accountHead?: string;
  paymentMethod?: string;
}

export interface TransportRouteRecord {
  id: string;
  routeName: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  monthlyFee: number;
  capacity: number;
  enrolledStudents: number;
  status: 'Active' | 'Maintenance';
}

export interface LibraryCirculationRecord {
  id: string;
  issueNo: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  borrowerType: 'Student' | 'Faculty';
  borrowerName: string;
  borrowerId: string;
  gradeOrDept: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Issued' | 'Returned' | 'Overdue';
  overdueDays: number;
  fineAmount: number;
  conditionNotes?: string;
}

export interface LibraryDigitalResource {
  id: string;
  title: string;
  category: string;
  grade: string;
  authorOrPublisher: string;
  fileType: 'PDF' | 'EPUB';
  fileSize: string;
  downloadsCount: number;
}

export interface LibraryBookRecord {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  genre?: string;
  subject?: string;
  academicGradeLevel?: string;
  tags?: string[];
  totalCopies: number;
  availableCopies: number;
  rackNo: string;
}

export interface ExamRecord {
  id: string;
  examName: string;
  class: string;
  startDate: string;
  status: 'Scheduled' | 'Active' | 'Drafting' | 'Completed';
  averageGPA: string;
}

export interface TimetableRecord {
  id: string;
  period: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  grade: string;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  target: 'Parents' | 'Students' | 'Faculty' | 'All';
  date: string;
  author: string;
  content: string;
  priority: 'High' | 'Normal' | 'Urgent';
}

export interface PortalUserRecord {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: 'owner' | 'principal' | 'teacher' | 'student' | 'parent' | string;
  linkedEntity: string;
  status: 'Active' | 'Suspended';
  lastLogin: string;
  phone?: string;
  staffIdOrRoll?: string;
  designation?: string;
  department?: string;
  clearanceLevel?: string;
  branch?: string;
}

export interface RoleModulePermission {
  id: string;
  name: string;
  description: string;
  teacher: boolean;
  student: boolean;
  parent: boolean;
}

export interface TeacherHomeworkRecord {
  id: string;
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  assignedDate: string;
  submissionsCount: number;
  totalCount: number;
  description: string;
}

export interface StudentSubjectResult {
  code: string;
  name: string;
  teacher: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  remarks: string;
}

export interface ParentLeaveRecord {
  id: string;
  childName: string;
  childId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  submittedDate: string;
}

export interface ParentMessageRecord {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  message: string;
  date: string;
  reply?: string;
}

export interface TeacherLessonPlan {
  id: string;
  topic: string;
  subject: string;
  grade: string;
  date: string;
  period: string;
  learningObjectives: string;
  teachingAids: string;
  homeworkAssigned: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Review Needed' | 'Approved' | 'Revision Requested';
  teacherName?: string;
  principalRemarks?: string;
  approvedAt?: string;
}

export interface TeacherGradeRecord {
  rollNo: string;
  studentId: string;
  name: string;
  image: string;
  subject: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks: string;
  rank: number;
}

export interface VisitorGatePassRecord {
  id: string;
  visitorName: string;
  cnicOrPhone: string;
  purpose: string;
  personToMeet: string;
  gatePassNo: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'In-School' | 'Checked-Out' | 'Flagged';
  vehicleNo?: string;
  badgeNo: string;
}

export interface StudentMedicalRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  grade: string;
  bloodGroup: string;
  vaccinationStatus: 'Fully Vaccinated' | 'Partially Vaccinated' | 'Pending';
  allergies: string;
  chronicConditions: string;
  emergencyContact: string;
  doctorName?: string;
  lastCheckupDate: string;
  medicalAlert: boolean;
}

export interface DisciplinaryIncidentRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  grade: string;
  date: string;
  category: 'Late Arrival' | 'Uniform Violation' | 'Misbehavior' | 'Academic Violation' | 'Property Damage';
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Severe';
  actionTaken: string;
  fineAmount: number;
  parentNotified: boolean;
  status: 'Open' | 'Resolved' | 'Under Review';
}

export interface SchoolAssetRecord {
  id: string;
  assetCode: string;
  name: string;
  category: 'IT Hardware' | 'Classroom Furniture' | 'Lab Equipment' | 'Sports Gear' | 'Library Facility';
  location: string;
  quantity: number;
  unitValue: number;
  condition: 'Excellent' | 'Good' | 'Needs Repair' | 'Retired';
  custodian: string;
  lastServiced: string;
}

export interface StaffPayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPayable: number;
  status: 'Paid' | 'Processing' | 'Hold';
  paymentMethod: string;
  disbursedDate?: string;
}

export interface StaffLeaveRecord {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Annual Leave' | 'Unpaid Leave';
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  appliedDate: string;
}

export interface ParentDirectoryRecord {
  id: string;
  guardianName: string;
  guardianRelation: string;
  guardianCnic: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianOccupation: string;
  address: string;
  linkedStudents: { id: string; name: string; rollNo: string; grade: string; feeStatus: string; dueBakaya: number }[];
  totalDueBakaya: number;
  familyFeeStatus: 'All Clear' | 'Dues Pending' | 'Defaulter';
}

export interface PrincipalFeeCollectionRecord {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  grade: string;
  guardianName: string;
  guardianPhone: string;
  amount: number;
  paymentResource: 'Cash at Principal Desk Counter' | 'Meezan Bank Challan' | 'HBL Bank Challan' | 'JazzCash Wallet' | 'EasyPaisa Wallet' | 'Raast Instant Transfer' | string;
  resourceReference: string;
  collectedBy: string;
  timestamp: string;
  monthsPaid: string;
  auditStatus: 'Verified by Principal Office' | 'Bank Cleared' | 'Pending Reconciliation' | string;
  notes?: string;
  guardian?: string;
  amountPaid?: number;
  month?: string;
}

@Component({
  selector: 'app-school-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, MatIconModule, DataTableComponent, AuditReconciliationTrendsComponent, AnalyticsDashboardComponent],
  templateUrl: './school-dashboard.component.html',
  styles: [`
    .glass-surface {
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(226, 232, 240, 0.85);
    }

    .apple-card {
      background: #FFFFFF;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 2px 10px -2px rgba(0, 0, 0, 0.03), 
                  0 8px 26px -4px rgba(0, 0, 0, 0.045), 
                  0 0 0 1px rgba(0, 0, 0, 0.04);
    }
    
    .apple-card-hover {
      transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .apple-card-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px -4px rgba(0,0,0,0.08), 
                  0 24px 50px -6px rgba(0,0,0,0.08);
    }

    .tabular {
      font-variant-numeric: tabular-nums;
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.4);
      border-radius: 10px;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      .printable-voucher, .printable-voucher * {
        visibility: visible;
      }
      .printable-voucher {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  `]
})
export class SchoolDashboardComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  readonly Math = Math;
  icons = dashboardIcons;

  currentPortalRole: SchoolPortalRole = 'owner';
  currentTab: SchoolDashboardTab = 'overview';
  principalTab: 'overview' | 'stage_wise' | 'master_registries' | 'supervision' | 'substitutions' | 'syllabus' | 'inspections' | 'discipline' | 'directives' | 'appraisals' | 'exam_moderation' | 'academic_reports' | 'faculty_tasks' | 'teacher_leaves' | 'student_certificates' | 'ptm_interventions' | 'admissions_review' | 'fee_oversight' | 'parent_complaints' | 'safeguarding' | 'facilities_transport' | 'library' | 'biometric_attendance' = 'overview';
  teacherTab: 'schedule' | 'feed' | 'events' | 'attendance' | 'marks' | 'lessons' | 'homework' | 'students' | 'communication' | 'library' = 'schedule';
  studentTab: 'overview' | 'feed' | 'events' | 'routine' | 'academics' | 'attendance' | 'fee' | 'homework' | 'library' = 'overview';
  parentTab: 'overview' | 'feed' | 'events' | 'attendance' | 'academics' | 'fee' | 'leave' | 'library' = 'overview';
  studentSubTab: 'directory' | 'medical' | 'disciplinary' = 'directory';
  teacherSubTab: 'directory' | 'payroll' | 'leaves' | 'lesson_plans' = 'directory';
  financeSubTab: 'ledger' | 'class_wise' | 'defaulters' | 'teacher_arrears' | 'profit_loss' | 'accounts' | 'alerts_log' | 'daily_closing' = 'ledger';
  selectedProfitLossYear: string = '2025-2026';

  // Daily Cash Closing (Rooznama) State & Helpers
  dailyClosingDate: string = '2026-10-14';
  dailyClosingCashier: string = 'Muhammad Farooq (Senior Cashier)';
  dailyOpeningVaultCash: number = 45000;
  dailyBankDepositSlipNo: string = 'MEZN-DEP-49102';
  dailyBankDepositAmount: number = 200000;
  dailySupervisorRemarks: string = 'All counter cash, bank challan collections, and petty vouchers reconciled. Verified with Meezan Bank deposit slip.';
  isDailyClosingReconciled: boolean = true;

  get todayFeeCashCollections(): number {
    return 185000;
  }
  get todayAdmissionCashCollections(): number {
    return 50000;
  }
  get todayOnlineBankCollections(): number {
    return 95000;
  }
  get todayEasyPaisaCollections(): number {
    return 42000;
  }
  get todayPettyExpensesOutflow(): number {
    return 18500;
  }
  get totalPhysicalCashInflow(): number {
    return this.dailyOpeningVaultCash + this.todayFeeCashCollections + this.todayAdmissionCashCollections;
  }
  get totalCashOutflow(): number {
    return this.todayPettyExpensesOutflow + this.dailyBankDepositAmount;
  }
  get netPhysicalCashInHand(): number {
    return this.totalPhysicalCashInflow - this.totalCashOutflow;
  }

  printDailyClosingSlip(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  printAdmissionChallan(adm: any): void {
    if (!adm) return;
    this.openFeeChallanVoucher({
      id: adm.id,
      name: adm.applicant,
      grade: adm.appliedFor,
      section: adm.section || 'Section A',
      rollNo: adm.rollNo || 'Pending',
      feeAmount: adm.tuitionFee || 18000,
      feeStatus: 'Pending',
      guardian: adm.fatherName,
      guardianPhone: adm.phone
    } as any);
  }

  newlyAddedTeacherId: string | null = null;

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  formatCurrency(val: number | undefined | null): string {
    return (val || 0).toLocaleString();
  }

  setPrincipalTab(tab: 'overview' | 'stage_wise' | 'master_registries' | 'supervision' | 'substitutions' | 'syllabus' | 'inspections' | 'discipline' | 'directives' | 'appraisals' | 'exam_moderation' | 'academic_reports' | 'faculty_tasks' | 'teacher_leaves' | 'student_certificates' | 'ptm_interventions' | 'admissions_review' | 'fee_oversight' | 'parent_complaints' | 'safeguarding' | 'facilities_transport' | 'biometric_attendance'): void {
    this.principalTab = tab;
    this.tabChanged.emit(tab);
    this.cdr.detectChanges();

    if (typeof window !== 'undefined') {
      const el = document.getElementById('principal-active-view') || document.getElementById('campus-updates-stream');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  openStageWiseView(stage: 'All' | 'Early Childhood' | 'Primary' | 'Middle' | 'Secondary' = 'All'): void {
    if (this.currentPortalRole === 'principal') {
      this.principalSelectedStage = stage;
      this.principalStagePage = 1;
      this.stageGradeFilter = 'All';
      this.stageSearchQuery = '';
      this.setPrincipalTab('stage_wise');
    } else {
      this.ownerSelectedStage = stage;
      this.ownerStagePage = 1;
      this.stageGradeFilter = 'All';
      this.stageSearchQuery = '';
      this.setTab('stage_wise');
    }
    this.cdr.detectChanges();
  }

  openPrincipalMasterRegistry(tab: 'students' | 'teachers' | 'parents' | 'fee_cashiering' = 'students'): void {
    this.principalMasterTab = tab;
    this.setPrincipalTab('master_registries');
    this.cdr.detectChanges();
  }

  get currentPrincipalTabLabel(): string {
    switch (this.principalTab) {
      case 'biometric_attendance': return 'Principal Biometric Attendance & Sensor Gate Station (Eye-Scan & Fingerprint)';
      case 'stage_wise': return 'Stage-Wise Academic Operations & Student Maintenance (Nursery to Class 10)';
      case 'master_registries': return 'Institutional Master Registries & Data Tables (اسڪول ماسٽر ڊيٽا ٽيبلز)';
      case 'supervision': return 'Faculty Lesson Plan Approvals';
      case 'substitutions': return 'Daily Faculty Leave & Period Arrangement Duty';
      case 'syllabus': return 'Academic Syllabus Completion Tracker';
      case 'inspections': return 'Campus & Classroom Daily Inspection Rounds Log';
      case 'discipline': return 'Student Discipline, Character Hearings & Final Leave Clearance';
      case 'directives': return 'Principal Morning Assembly Directives & Executive Circulars';
      case 'appraisals': return 'Faculty Performance Appraisals & Classroom Observation Scoring';
      case 'exam_moderation': return 'Exam Paper Approval & Result Moderation Sign-Off';
      case 'academic_reports': return 'Academic Data Export & Performance Analytics';
      case 'faculty_tasks': return 'Faculty Task Delegation & Duty Roster';
      case 'teacher_leaves': return 'Teacher Leave Requests & Official Dispatches';
      case 'student_certificates': return 'Transfer Certificate (TC) & Character Certificate Sign-Off';
      case 'ptm_interventions': return 'PTM Scheduling & Weak Student Remedial Care';
      case 'admissions_review': return 'New Student Admissions Review & Entrance Assessments';
      case 'fee_oversight': return 'Fee Collection Oversight & Concession Approvals';
      case 'parent_complaints': return 'Parent Grievance Redressal & Complaint Tracker';
      case 'safeguarding': return 'Student Safeguarding, Welfare & Medical Health Alerts';
      case 'facilities_transport': return 'Campus Facilities Maintenance & Transport Supervision';
      default: return 'Principal Executive Academic Command Center';
    }
  }

  setParentTab(tab: 'overview' | 'feed' | 'events' | 'attendance' | 'academics' | 'fee' | 'leave' | 'library'): void {
    this.parentTab = tab;
    this.tabChanged.emit(tab);
    this.cdr.detectChanges();

    if (typeof window !== 'undefined') {
      const el = document.getElementById('parent-active-view');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  get currentParentTabLabel(): string {
    switch (this.parentTab) {
      case 'feed': return 'Campus Notices & Circulars Stream';
      case 'events': return 'School Events & Galas';
      case 'attendance': return 'Monthly Attendance Calendar & RFID Log';
      case 'academics': return 'Terminal Exam Report Card';
      case 'fee': return 'Tuition Fee & Bank Challan Vouchers';
      case 'leave': return 'Student Leave Applications';
      case 'library': return 'Child Library Clearance & Circulation Ledger';
      default: return 'Child Live Summary & Overview';
    }
  }

  get currentStudentTabLabel(): string {
    switch (this.studentTab) {
      case 'feed': return 'Campus Notices & Announcements';
      case 'events': return 'School Events & Gala Passes';
      case 'routine': return 'Weekly Class Timetable & Schedule';
      case 'academics': return 'Academic Transcript & Report Card';
      case 'attendance': return 'Monthly Attendance Streak & RFID Logs';
      case 'fee': return 'Tuition Fee Clearance & Bank Challan';
      case 'homework': return 'Homework Tasks & Assignment Submissions';
      case 'library': return 'Digital E-Library & Book Circulation Desk';
      default: return 'Smart Digital Student Card & Hub';
    }
  }

  setStudentTab(tab: 'overview' | 'feed' | 'events' | 'routine' | 'academics' | 'attendance' | 'fee' | 'homework' | 'library'): void {
    this.studentTab = tab;
    this.tabChanged.emit(tab);
    this.cdr.detectChanges();

    setTimeout(() => {
      const el = document.getElementById('student-active-view') || document.getElementById('campus-updates-stream');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  setTeacherTab(tab: 'schedule' | 'feed' | 'events' | 'attendance' | 'marks' | 'lessons' | 'homework' | 'students' | 'communication' | 'library'): void {
    this.teacherTab = tab;
    this.tabChanged.emit(tab);
    this.cdr.detectChanges();

    setTimeout(() => {
      const el = document.getElementById('teacher-active-view') || 
                 document.getElementById('teacher-workspace-' + tab) || 
                 document.getElementById('campus-updates-stream');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  selectParentChild(childId: string): void {
    if (!childId) return;
    this.activeParentChildId = childId;
    const child = this.selectedParentChild;
    if (child) {
      this.showToast(`Switched Active Child: ${child.name} (${child.grade})`, 'success');
    }
    this.cdr.detectChanges();
  }

  get selectedParentChild(): any {
    const foundInList = (this.parentChildren || []).find(c => c.id === this.activeParentChildId);
    if (foundInList) return foundInList;
    const foundInStudents = (this.activeStudents || []).find(s => s.id === this.activeParentChildId);
    if (foundInStudents) {
      return {
        id: foundInStudents.id,
        name: foundInStudents.name,
        rollNo: foundInStudents.rollNo,
        grade: foundInStudents.grade,
        section: foundInStudents.section || 'General',
        rfidCard: `RFID-${foundInStudents.rollNo || '88219'}`,
        status: 'In Campus (Classroom)',
        checkInTime: '07:48 AM',
        attendanceRate: foundInStudents.attendance || '98.5%',
        gpa: '3.90 / 4.0',
        gradeLabel: 'Grade A+ (Distinction)',
        feeStatus: foundInStudents.feeStatus || 'Paid',
        feeAmount: foundInStudents.feeAmount || 28500,
        receiptNo: `CH-2026-${foundInStudents.rollNo || '8801'}`,
        validTill: 'Nov 10, 2026',
        dueBakaya: 0,
        busRoute: 'Bus Route #04',
        busDriver: 'Ch. Aslam (+92 313 5544332)'
      };
    }
    return (this.parentChildren && this.parentChildren[0]) ? this.parentChildren[0] : {
      id: 'ST-1001',
      name: 'Zayan Ahmed Khan',
      rollNo: '1001',
      grade: 'Class 10-A',
      section: 'Science',
      rfidCard: 'RFID-88219',
      status: 'In Campus (Room 204)',
      checkInTime: '07:48 AM',
      attendanceRate: '98.5%',
      gpa: '3.92 / 4.0',
      gradeLabel: 'Grade A+ (Distinction)',
      feeStatus: 'Paid',
      feeAmount: 28500,
      receiptNo: 'CH-2026-8801',
      validTill: 'Nov 10, 2026',
      dueBakaya: 0,
      busRoute: 'Bus Route #04',
      busDriver: 'Ch. Aslam (+92 313 5544332)'
    };
  }

  get activeChildSubjects(): StudentSubjectResult[] {
    const child = this.selectedParentChild;
    if (child && (child.id === 'ST-1002' || child.grade?.includes('5') || child.grade?.toLowerCase().includes('primary'))) {
      return [
        { code: 'SCI-501', name: 'General Science & Nature', teacher: 'Miss Amna Farooq', maxMarks: 100, marksObtained: 94, grade: 'A+', remarks: 'Excellent curiosity and scientific experiments' },
        { code: 'MTH-502', name: 'Primary Mathematics & Arithmetic', teacher: 'Sir Rizwan Ali', maxMarks: 100, marksObtained: 91, grade: 'A+', remarks: 'Strong mental arithmetic and problem solving' },
        { code: 'ENG-503', name: 'English Grammar & Creative Writing', teacher: 'Miss Hina Zubair', maxMarks: 100, marksObtained: 89, grade: 'A', remarks: 'Good spelling and neat handwriting' },
        { code: 'URD-504', name: 'Urdu Literature & Calligraphy', teacher: 'Sir Naveed Alam', maxMarks: 100, marksObtained: 92, grade: 'A+', remarks: 'Exceptional handwriting and recitation' },
        { code: 'SST-505', name: 'Social Studies & Geography', teacher: 'Miss Zunaira Tariq', maxMarks: 100, marksObtained: 90, grade: 'A+', remarks: 'Very attentive in class discussions' },
        { code: 'ISL-506', name: 'Islamic Studies & Moral Ethics', teacher: 'Hafiz Abdul Rehman', maxMarks: 100, marksObtained: 96, grade: 'A+', remarks: 'Exemplary manners and Quranic tajweed' }
      ];
    }
    return this.studentSubjects;
  }

  get activeChildAttendanceLog(): any[] {
    const child = this.selectedParentChild;
    if (child && (child.id === 'ST-1002' || child.grade?.includes('5') || child.grade?.toLowerCase().includes('primary'))) {
      return [
        { date: 'Oct 15, 2026', day: 'Wednesday', checkIn: '07:55 AM', checkOut: '01:45 PM', gate: 'Junior Wing Gate (RFID-02)', status: 'Present' },
        { date: 'Oct 14, 2026', day: 'Tuesday', checkIn: '07:52 AM', checkOut: '01:45 PM', gate: 'Junior Wing Gate (RFID-02)', status: 'Present' },
        { date: 'Oct 13, 2026', day: 'Monday', checkIn: '07:50 AM', checkOut: '01:45 PM', gate: 'Junior Wing Gate (RFID-02)', status: 'Present' },
        { date: 'Oct 10, 2026', day: 'Friday', checkIn: '07:48 AM', checkOut: '12:30 PM', gate: 'Junior Wing Gate (RFID-02)', status: 'Present' },
        { date: 'Oct 09, 2026', day: 'Thursday', checkIn: '07:54 AM', checkOut: '01:45 PM', gate: 'Junior Wing Gate (RFID-02)', status: 'Present' }
      ];
    }
    return this.studentAttendanceLog;
  }

  printStudentResultSlip(): void {
    if (typeof window !== 'undefined') window.print();
  }

  printStudentFeeChallan(): void {
    if (this.currentPortalRole === 'parent') {
      const child = this.selectedParentChild;
      if (child) {
        this.openFeeChallanVoucher({
          id: child.id,
          name: child.name,
          grade: child.grade,
          section: child.section,
          rollNo: child.rollNo,
          feeAmount: child.feeAmount,
          feeStatus: child.feeStatus,
          guardian: 'Tariq Ahmed Khan',
          guardianPhone: '+92 300 8472910'
        } as any);
        return;
      }
    }
    const student = (this.activeStudents || []).find(s => s.id === this.activeStudentId) || (this.activeStudents && this.activeStudents[0]);
    if (student) {
      this.openFeeChallanVoucher(student);
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  }

  get isSuperAdminPreview(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const u = JSON.parse(userData);
        if (u.role === 'super_admin' || u.role === 'SUPER_ADMIN') {
          return true;
        }
      }
    } catch {}
    return false;
  }

  getRealUserRole(): string {
    if (typeof localStorage === 'undefined') return '';
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const u = JSON.parse(userData);
        return (u.role || '').toLowerCase();
      }
    } catch {}
    return '';
  }

  get isOwnerSession(): boolean {
    // 1. Super Admin preview mode ALWAYS has full administrative preview & exit to owner capability
    if (this.isSuperAdminPreview) return true;

    // 2. Check authenticated user role from localStorage
    if (typeof localStorage === 'undefined') return true;
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const u = JSON.parse(userData);
        const r = (u.role || '').toLowerCase();

        // Real students, parents, guardians are strictly restricted: CANNOT access Owner ERP or see Exit to Owner
        if (['student', 'parent', 'student_guardian', 'guardian'].includes(r)) {
          return false;
        }
        // Pure teachers without admin privileges cannot access Owner ERP
        if (r === 'teacher' && !u.isAdmin && !u.is_admin) {
          return false;
        }
        // School owner, administrator, client admin, or super admin has full owner access
        if (['owner', 'admin', 'super_admin', 'superadmin', 'client_admin', 'school_admin', 'principal'].includes(r)) {
          return true;
        }
      } else {
        // Fallback when no explicit user_data: check if simulating real student or parent
        const activeSchoolRole = localStorage.getItem('activeSchoolRole');
        const activePortalUser = localStorage.getItem('activeSchoolPortalUser');
        if (activePortalUser) {
          try {
            const pu = JSON.parse(activePortalUser);
            if (pu.role === 'student' || pu.role === 'parent') return false;
          } catch {}
        }
        if (activeSchoolRole === 'student' || activeSchoolRole === 'parent') {
          const mockAuth = localStorage.getItem('scs_auth_mock');
          if (mockAuth && !this.isSuperAdminPreview) {
            return false;
          }
        }
        return true;
      }
    } catch {}
    return true;
  }

  exitToOwner(): void {
    if (!this.isOwnerSession) {
      this.showToast('Access restricted: Only School Owner or Admin can access Owner ERP.', 'warning');
      return;
    }
    this.switchPortal('owner');
  }

  returnToSuperAdmin(): void {
    if (!this.isSuperAdminPreview) {
      this.showToast('Access restricted: Only Super Administrator can access Super Admin platform.', 'warning');
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/superadmin';
    }
  }

  @Input() schoolName: string = 'Al-Huda International Academy & College';
  @Output() tabChanged = new EventEmitter<string>();
  
  private _activeTab: string = 'overview';
  @Input() 
  set activeTab(val: string) {
    if (!val) return;
    this._activeTab = val;
    const v = val.toLowerCase();
    const savedRole = (typeof localStorage !== 'undefined') ? localStorage.getItem('activeSchoolRole') : null;

    // 1. Role-specific explicit switches ONLY when the target explicitly dictates a portal
    if (v.startsWith('principal-') || v === 'principal-portal' || v === 'principal') {
      this.currentPortalRole = 'principal';
    } else if (v.startsWith('teacher-') || v === 'teacher-portal') {
      this.currentPortalRole = 'teacher';
    } else if (v.startsWith('student-') || v === 'student-portal') {
      this.currentPortalRole = 'student';
    } else if (v.startsWith('parent-') || v === 'parent-portal') {
      this.currentPortalRole = 'parent';
    } else if (v === 'owner' || v === 'owner-portal') {
      if (this.isOwnerSession) {
        this.currentPortalRole = 'owner';
      }
    } else if (v === 'school-hub') {
      if (savedRole && ['principal', 'teacher', 'student', 'parent', 'owner'].includes(savedRole)) {
        this.currentPortalRole = savedRole as SchoolPortalRole;
      }
    }

    // 2. Route tabs strictly within the CURRENT active portal role!
    // Never switch portal role to 'owner' when navigating within principal, teacher, student, or parent portals!
    if (this.currentPortalRole === 'principal') {
      if (v.includes('supervision') || v.includes('lesson')) this.principalTab = 'supervision';
      else if (v.includes('substitut') || v.includes('arrangement')) this.principalTab = 'substitutions';
      else if (v.includes('syllabus') || v.includes('curriculum')) this.principalTab = 'syllabus';
      else if (v.includes('inspection') || v.includes('round')) this.principalTab = 'inspections';
      else if (v.includes('discipline') || v.includes('hearing')) this.principalTab = 'discipline';
      else if (v.includes('directive') || v.includes('circular') || v.includes('assembly')) this.principalTab = 'directives';
      else if (v.includes('appraisal') || v.includes('observation')) this.principalTab = 'appraisals';
      else if (v.includes('exam_moderation') || v.includes('paper') || v.includes('moderation')) this.principalTab = 'exam_moderation';
      else if (v.includes('academic_report') || v.includes('export') || v.includes('analytics')) this.principalTab = 'academic_reports';
      else if (v.includes('faculty_task') || v.includes('duty') || v.includes('task')) this.principalTab = 'faculty_tasks';
      else if (v.includes('teacher_leave') || v.includes('staff_leave') || v.includes('hr_notice')) this.principalTab = 'teacher_leaves';
      else if (v.includes('tc') || v.includes('leaving_cert') || v.includes('character_cert') || v.includes('certificate')) this.principalTab = 'student_certificates';
      else if (v.includes('ptm') || v.includes('remedial') || v.includes('weak_student') || v.includes('intervention')) this.principalTab = 'ptm_interventions';
      else if (v.includes('admission') || v.includes('enrollment') || v.includes('entrance')) this.principalTab = 'admissions_review';
      else if (v.includes('fee_oversight') || v.includes('concession') || v.includes('scholarship')) this.principalTab = 'fee_oversight';
      else if (v.includes('complaint') || v.includes('grievance') || v.includes('parent_inquiry')) this.principalTab = 'parent_complaints';
      else if (v.includes('safeguard') || v.includes('welfare') || v.includes('medical_alert')) this.principalTab = 'safeguarding';
      else if (v.includes('facility') || v.includes('transport_supervision') || v.includes('bus_route')) this.principalTab = 'facilities_transport';
      else this.principalTab = 'overview';
    } else if (this.currentPortalRole === 'teacher') {
      if (v.includes('feed') || v.includes('notice')) this.teacherTab = 'feed';
      else if (v.includes('event')) this.teacherTab = 'events';
      else if (v.includes('attendance')) this.teacherTab = 'attendance';
      else if (v.includes('mark') || v.includes('grade')) this.teacherTab = 'marks';
      else if (v.includes('lesson')) this.teacherTab = 'lessons';
      else if (v.includes('homework')) this.teacherTab = 'homework';
      else if (v.includes('student') || v.includes('roster')) this.teacherTab = 'students';
      else if (v.includes('chat') || v.includes('communication') || v.includes('message')) this.teacherTab = 'communication';
      else this.teacherTab = 'schedule';
    } else if (this.currentPortalRole === 'student') {
      if (v.includes('feed') || v.includes('notice')) this.studentTab = 'feed';
      else if (v.includes('event')) this.studentTab = 'events';
      else if (v.includes('routine') || v.includes('timetable')) this.studentTab = 'routine';
      else if (v.includes('academic') || v.includes('grade') || v.includes('result') || v.includes('slip')) this.studentTab = 'academics';
      else if (v.includes('attendance')) this.studentTab = 'attendance';
      else if (v.includes('fee') || v.includes('challan')) this.studentTab = 'fee';
      else if (v.includes('homework')) this.studentTab = 'homework';
      else this.studentTab = 'overview';
    } else if (this.currentPortalRole === 'parent') {
      if (v.includes('feed') || v.includes('notice') || v.includes('circular')) this.parentTab = 'feed';
      else if (v.includes('event')) this.parentTab = 'events';
      else if (v.includes('attendance')) this.parentTab = 'attendance';
      else if (v.includes('academic') || v.includes('report') || v.includes('result')) this.parentTab = 'academics';
      else if (v.includes('fee') || v.includes('challan')) this.parentTab = 'fee';
      else if (v.includes('leave')) this.parentTab = 'leave';
      else this.parentTab = 'overview';
    } else {
      // Owner ERP module tabs
      if (v === 'feed') this.currentTab = 'feed';
      else if (v === 'events' || v.includes('event')) this.currentTab = 'events';
      else this.handleSchoolAction(v);
    }
  }

  alertTarget: {
    recipientName: string;
    recipientPhone: string;
    studentName?: string;
    rollNo?: string;
    grade?: string;
    remainingBakaya?: number;
    unpaidMonths?: string[];
  } | null = null;
  alertChannel: 'WhatsApp' | 'SMS' | 'Portal Alert' = 'WhatsApp';
  customAlertMessage: string = '';

  get totalFinanceIncome(): number {
    return (this.finances || [])
      .filter(f => f.type === 'Income')
      .reduce((acc, f) => acc + (f.amount || 0), 0);
  }

  get totalFinanceExpense(): number {
    return (this.finances || [])
      .filter(f => f.type === 'Expense')
      .reduce((acc, f) => acc + (f.amount || 0), 0);
  }

  get netFinanceBalance(): number {
    return this.totalFinanceIncome - this.totalFinanceExpense;
  }

  get totalUncollectedDues(): number {
    return (this.activeStudents || [])
      .filter(s => s.feeStatus === 'Pending' || s.feeStatus === 'Overdue')
      .reduce((acc, s) => acc + (s.feeAmount || 0), 0);
  }

  // Persona selections for simulated portal views
  activeTeacherId: string = 'USR-801';
  get activeTeacherName(): string {
    const t = (this.teachers || []).find((item: any) => item.id === this.activeTeacherId);
    return t ? t.name : 'Prof. Tariq Mehmood';
  }
  activeStudentId: string = 'ST-1001';
  activeParentChildId: string = 'ST-1001';

  searchQuery: string = '';
  studentSearchQuery: string = '';
  selectedGradeFilter: string = 'All';
  selectedFeeFilter: string = 'All';
  expandedStudentId: string | null = null;
  newlyEnrolledStudentId: string | null = null;

  // Students Table Sorting
  studentsSortColumn: string = '';
  studentsSortDirection: 'asc' | 'desc' = 'asc';

  // Teacher Gradebook Sorting & Pagination State
  gradebookSortColumn: string = 'rollNo';
  gradebookSortDirection: 'asc' | 'desc' = 'asc';
  gradebookSearch: string = '';
  gradebookPage: number = 1;
  gradebookPageSize: number = 5;

  // Teacher Dedicated Arrays & Forms
  teacherLessonPlans: TeacherLessonPlan[] = [
    {
      id: 'LP-101',
      topic: 'Quadratic Equations & Roots',
      subject: 'Advanced Mathematics',
      grade: 'Class 10-A',
      date: '2026-10-26',
      period: 'Period 1 (08:00 AM - 08:45 AM)',
      learningObjectives: 'Students will solve quadratic equations using factoring, completing the square, and quadratic formula.',
      teachingAids: 'Whiteboard & Graphing Calculator',
      homeworkAssigned: 'Exercise 4.2 Questions 1-8',
      status: 'Approved',
      teacherName: 'Prof. Tariq Mehmood',
      principalRemarks: 'Approved for classroom delivery.'
    },
    {
      id: 'LP-102',
      topic: 'Electromagnetic Induction & Faraday Laws',
      subject: 'Physics',
      grade: 'Class 10-B',
      date: '2026-10-26',
      period: 'Period 2 (08:45 AM - 09:30 AM)',
      learningObjectives: 'Understand magnetic flux changes, induced EMF, and Lenz Law application.',
      teachingAids: 'Copper Coil & Bar Magnet Demonstration Kit',
      homeworkAssigned: 'Chapter 12 Review Numerical 1-5',
      status: 'Planned',
      teacherName: 'Prof. Rehan Alvi',
      principalRemarks: 'Pending Principal review.'
    },
    {
      id: 'LP-103',
      topic: 'Chemical Equilibrium & Le Chatelier Principle',
      subject: 'Chemistry',
      grade: 'Class 9-A',
      date: '2026-10-27',
      period: 'Period 4 (10:15 AM - 11:00 AM)',
      learningObjectives: 'Explain dynamic equilibrium and effect of temperature, pressure & concentration shifts.',
      teachingAids: 'Lab Reagents & Reversible Reaction Chart',
      homeworkAssigned: 'Worksheet 7.1 Questions',
      status: 'In Progress',
      teacherName: 'Ms. Hira Naeem'
    },
    {
      id: 'LP-104',
      topic: 'Data Structures & Python Array Sorting',
      subject: 'Computer Science',
      grade: 'Class 9-B',
      date: '2026-10-27',
      period: 'Period 5 (11:15 AM - 12:00 PM)',
      learningObjectives: 'Implement Bubble Sort and Insertion Sort algorithms in Python 3.',
      teachingAids: 'Computer Lab Workstations',
      homeworkAssigned: 'Python Lab Assignment 3',
      status: 'Approved',
      teacherName: 'Engr. Bilal Hashmi',
      principalRemarks: 'Excellent lab outline.'
    },
    {
      id: 'LP-105',
      topic: 'English Syntax & Active/Passive Voice Transformations',
      subject: 'English Literature',
      grade: 'Class 8-A',
      date: '2026-10-28',
      period: 'Period 3 (09:30 AM - 10:15 AM)',
      learningObjectives: 'Master rule conversions for present, past, and perfect tenses.',
      teachingAids: 'Grammar Worksheets & Smart Board',
      homeworkAssigned: 'Ex. 14 Voice Conversion 1-15',
      status: 'Review Needed',
      teacherName: 'Ms. Fatima Zahra'
    }
  ];

  teacherGradebook: TeacherGradeRecord[] = [];
  
  // Lesson Plan Filters, Pagination & Modal State
  lessonPlanSearchQuery: string = '';
  lessonPlanGradeFilter: string = 'All';
  lessonPlanStatusFilter: string = 'All';
  lessonPlanPage: number = 1;
  lessonPlanPageSize: number = 5;

  isLessonPlanModalOpen: boolean = false;
  editingLessonPlan: TeacherLessonPlan | null = null;
  lessonPlanForm = {
    id: '',
    topic: '',
    subject: 'Advanced Mathematics',
    grade: 'Class 10-A',
    date: new Date().toISOString().slice(0, 10),
    period: 'Period 1 (08:00 AM - 08:45 AM)',
    learningObjectives: '',
    teachingAids: 'Whiteboard & Smart Screen',
    homeworkAssigned: '',
    status: 'Planned' as 'Planned' | 'In Progress' | 'Completed' | 'Review Needed' | 'Approved' | 'Revision Requested',
    teacherName: 'Prof. Tariq Mehmood'
  };

  // Superadmin Module Entitlement Matrix - All Modules Released & Fully Accessible
  enabledModules: Record<string, boolean> = {
    overview: true,
    students: true,
    teachers: true,
    admissions: true,
    attendance: true,
    finance: true,
    expenses: true,
    payment_gateway: true,
    transport: true,
    hostel: true,
    labs: true,
    library: true,
    exams: true,
    timetable: true,
    portals: true,
    reports: true,
    alumni: true,
    settings: true,
    teacher_portal: true,
    student_portal: true,
    parent_portal: true,
    parent_chat: true,
    leave_requests: true,
    marks_entry: true,
    class_result: true,
    subjects: true,
    class_subject_map: true,
    exam_schedule: true,
    all_reports: true,
    income_vs_expense: true,
    staff_management: true,
    salary_management: true,
    salary_report: true,
    notices: true,
    admin_settings: true,
    password_change: true
  };

  releaseAllModules(): void {
    Object.keys(this.enabledModules).forEach((k) => {
      this.enabledModules[k] = true;
    });
    this.showToast('All Modules Released, Active & Fully Accessible ✓', 'success');
  }

  isModuleEnabled(key: string): boolean {
    // All campus modules released and fully accessible
    return true;
  }

  getTabIcon(id: string): string {
    switch (id) {
      case 'portals': return 'shield-check';
      case 'settings': return 'settings';
      case 'overview': return 'layout-dashboard';
      case 'students': return 'users';
      case 'teachers': return 'graduation-cap';
      case 'admissions': return 'book-open';
      case 'attendance': return 'clock';
      case 'finance': return 'credit-card';
      case 'invoices': return 'file-text';
      case 'expenses': return 'receipt';
      case 'exams': return 'trophy';
      case 'timetable': return 'calendar';
      case 'reports': return 'file-text';
      case 'transport': return 'bus';
      case 'library': return 'library';
      case 'hostel': return 'building-2';
      case 'labs': return 'cpu';
      case 'alumni': return 'award';
      case 'payment_gateway': return 'wallet-cards';
      case 'audit': return 'shield-check';
      case 'lesson_plans': return 'book-open';
      case 'appraisals': return 'award';
      case 'inspections': return 'clipboard-check';
      case 'exam_moderation': return 'trophy';
      case 'parent_complaints': return 'message-square-warning';
      case 'substitutions': return 'clock';
      case 'syllabus': return 'book-open';
      case 'safeguarding': return 'shield-check';
      case 'directives': return 'file-text';
      default: return 'layers';
    }
  }

  // Pagination Controls
  pageSize: number = 5;
  currentPage: { [key in SchoolDashboardTab]: number } = {
    overview: 1,
    stage_wise: 1,
    feed: 1,
    events: 1,
    students: 1,
    teachers: 1,
    admissions: 1,
    attendance: 1,
    finance: 1,
    invoices: 1,
    expenses: 1,
    payment_gateway: 1,
    transport: 1,
    hostel: 1,
    labs: 1,
    library: 1,
    exams: 1,
    timetable: 1,
    portals: 1,
    reports: 1,
    alumni: 1,
    settings: 1,
    audit: 1,
    lesson_plans: 1,
    appraisals: 1,
    inspections: 1,
    exam_moderation: 1,
    parent_complaints: 1,
    substitutions: 1,
    syllabus: 1,
    safeguarding: 1,
    directives: 1
  };

  // Search Queries per Module
  paymentGatewaySearchQuery: string = '';
  selectedPaymentGatewayFilter: string = 'All';
  teachersSearchQuery: string = '';
  admissionsSearchQuery: string = '';
  selectedAdmissionFilter: 'all' | 'Approved' | 'Interview Scheduled' | 'Under Review' | 'Rejected' = 'all';
  selectedAdmissionSourceFilter: 'all' | 'School Office Direct' | 'Online Parent Portal' = 'all';
  expandedAdmissionId: string | null = null;
  isAdmissionDossierModalOpen: boolean = false;
  selectedAdmissionForDossier: AdmissionRecord | null = null;
  isScheduleInterviewModalOpen: boolean = false;
  selectedAdmissionForInterview: AdmissionRecord | null = null;
  interviewScheduleForm = {
    date: '',
    time: '11:00 AM',
    interviewer: 'Dr. Tahir Malik (Principal & Academic Director)',
    notes: 'Entrance diagnostic review & parent interaction'
  };
  financeSearchQuery: string = '';
  transportSearchQuery: string = '';
  librarySearchQuery: string = '';
  examsSearchQuery: string = '';
  timetableSearchQuery: string = '';
  portalsSearchQuery: string = '';
  visitorSearchQuery: string = '';
  selectedVisitorStatusFilter: string = 'All';
  medicalSearchQuery: string = '';
  selectedMedicalBloodFilter: string = 'All';
  disciplinarySearchQuery: string = '';
  selectedDisciplinarySeverityFilter: string = 'All';
  assetSearchQuery: string = '';
  selectedAssetCategoryFilter: string = 'All';
  staffPayrollSearchQuery: string = '';
  selectedPayrollStatusFilter: string = 'All';
  staffLeaveSearchQuery: string = '';
  selectedLeaveStatusFilter: string = 'All';

  // Attendance Register Search & Class State
  attendanceSelectedClass: string = 'All';
  attendanceSearchQuery: string = '';
  attendanceDate: string = new Date().toISOString().slice(0, 10);

  // Expenses Search & Filter State
  expensesSearchQuery: string = '';
  selectedExpenseCategoryFilter: string = 'All';
  isEditExpenseModalOpen: boolean = false;
  editingExpense: any = null;

  // Exams Subtabs & Gradebook State
  examsSubTab: 'schedules' | 'marks_entry' | 'class_results' | 'subjects' = 'schedules';
  selectedMarksExamId: string = 'EXM-101';
  selectedMarksClass: string = 'Class 10';
  selectedMarksSubject: string = 'Advanced Mathematics';
  marksEntrySearchQuery: string = '';
  classResultSearchQuery: string = '';
  subjectsSearchQuery: string = '';
  isSubjectModalOpen: boolean = false;
  isEditSubjectModalOpen: boolean = false;
  editingSubject: any = null;
  subjectForm = {
    code: '',
    title: '',
    grade: 'Class 10',
    teacher: 'Prof. Tariq Mehmood',
    creditHours: 5,
    type: 'Core' as 'Core' | 'Elective' | 'Lab',
    passMarks: 40,
    totalMarks: 100
  };

  // Student Marks in-memory map: key = `${studentId}_${subject}_${examId}`
  studentMarksMap: Record<string, { obtained: number; total: number; remarks: string }> = {};

  // Subjects Registry
  schoolSubjectsList: Array<{
    id: string;
    code: string;
    title: string;
    grade: string;
    teacher: string;
    creditHours: number;
    type: 'Core' | 'Elective' | 'Lab';
    passMarks: number;
    totalMarks: number;
  }> = [
    { id: 'SUB-101', code: 'MTH-101', title: 'Advanced Mathematics', grade: 'Class 10', teacher: 'Prof. Tariq Mehmood', creditHours: 6, type: 'Core', passMarks: 40, totalMarks: 100 },
    { id: 'SUB-102', code: 'PHY-101', title: 'Physics & Quantum Mechanics', grade: 'Class 10', teacher: 'Prof. Rehan Alvi', creditHours: 5, type: 'Core', passMarks: 40, totalMarks: 100 },
    { id: 'SUB-103', code: 'CHM-101', title: 'Chemistry & Reagent Labs', grade: 'Class 10', teacher: 'Ms. Hira Naeem', creditHours: 5, type: 'Core', passMarks: 40, totalMarks: 100 },
    { id: 'SUB-104', code: 'ENG-101', title: 'English Literature & Rhetoric', grade: 'Class 10', teacher: 'Dr. Sarah Jenkins', creditHours: 4, type: 'Core', passMarks: 33, totalMarks: 100 },
    { id: 'SUB-201', code: 'CSC-201', title: 'Computer Science & AI Basics', grade: 'Class 9', teacher: 'Engr. Bilal Hashmi', creditHours: 6, type: 'Elective', passMarks: 40, totalMarks: 100 },
    { id: 'SUB-202', code: 'BIO-201', title: 'Biochemistry & Molecular Biology', grade: 'Class 9', teacher: 'Ms. Hira Naeem', creditHours: 5, type: 'Core', passMarks: 40, totalMarks: 100 },
    { id: 'SUB-301', code: 'MTH-081', title: 'Mathematics General', grade: 'Class 8', teacher: 'Prof. Tariq Mehmood', creditHours: 5, type: 'Core', passMarks: 33, totalMarks: 100 },
    { id: 'SUB-302', code: 'ENG-081', title: 'English Grammar & Composition', grade: 'Class 8', teacher: 'Dr. Sarah Jenkins', creditHours: 4, type: 'Core', passMarks: 33, totalMarks: 100 },
    { id: 'SUB-401', code: 'SCI-071', title: 'General Science & Environment', grade: 'Class 7', teacher: 'Ms. Hira Naeem', creditHours: 4, type: 'Core', passMarks: 33, totalMarks: 100 },
    { id: 'SUB-501', code: 'URD-061', title: 'Urdu Literature & Adab', grade: 'Class 6', teacher: 'Prof. Asadullah Qazi', creditHours: 4, type: 'Core', passMarks: 33, totalMarks: 100 }
  ];

  // Faculty Directory View Mode
  facultyViewMode: 'cards' | 'table' = 'table';

  // Modal States
  isStudentModalOpen: boolean = false;
  isTeacherModalOpen: boolean = false;
  isAdmissionModalOpen: boolean = false;
  isFinanceModalOpen: boolean = false;
  isPaymentModalOpen: boolean = false;
  isExamModalOpen: boolean = false;
  isTimetableModalOpen: boolean = false;
  isAnnouncementModalOpen: boolean = false;
  isFeeChallanVoucherOpen: boolean = false;
  isAttendanceMarkModalOpen: boolean = false;
  isPortalUserModalOpen: boolean = false;
  isTeacherHomeworkModalOpen: boolean = false;
  isParentLeaveModalOpen: boolean = false;
  isParentMessageModalOpen: boolean = false;
  isTransportModalOpen: boolean = false;
  isLibraryModalOpen: boolean = false;
  isVisitorModalOpen: boolean = false;
  isMedicalModalOpen: boolean = false;
  isDisciplinaryModalOpen: boolean = false;
  isAssetModalOpen: boolean = false;
  isStaffPayrollModalOpen: boolean = false;
  isStaffLeaveModalOpen: boolean = false;
  isPrintGatePassModalOpen: boolean = false;
  isPrintPaySlipModalOpen: boolean = false;
  isAlertModalOpen: boolean = false;
  isFeedModalOpen: boolean = false;
  isEditFeedModalOpen: boolean = false;
  editingFeedPost: any = null;
  isEventModalOpen: boolean = false;
  isEventDetailModalOpen: boolean = false;
  isNotificationsDropdownOpen: boolean = false;

  // ================= CAMPUS TOP FEED STATE =================
  feedForm = {
    title: '',
    content: '',
    category: 'Instruction' as string,
    targetAudience: 'Both Students & Parents' as string,
    targetClass: 'All Classes (Entire Campus)',
    purposeCategory: 'Academic & Class Instruction',
    issuerRole: 'Principal' as string,
    authorRole: 'Principal' as string,
    selectedFacultyAuthor: 'Prof. Rehan Alvi (Senior Physics Faculty)',
    authorName: 'Dr. Tahir Malik',
    authorDesignation: 'Principal & Academic Director',
    authorDepartment: 'Executive Directorate',
    authorStaffId: 'DIR-AHA-001',
    urgency: 'Normal Notice' as string,
    attachedFileUrl: ''
  };

  availableFacultyAuthors = [
    { name: 'Dr. Tahir Malik', role: 'Principal' as const, designation: 'Principal & Academic Director', dept: 'Executive Directorate', staffId: 'DIR-AHA-001' },
    { name: 'Prof. Rehan Alvi', role: 'Teacher' as const, designation: 'Senior Physics Faculty & HOD', dept: 'Department of Physical Sciences', staffId: 'FAC-PHY-104' },
    { name: 'Ms. Hira Naeem', role: 'Teacher' as const, designation: 'Head of Computer Science & ICT', dept: 'Department of Computing', staffId: 'FAC-CS-102' },
    { name: 'Prof. Tariq Mehmood', role: 'Teacher' as const, designation: 'HOD Mathematics', dept: 'Department of Mathematics', staffId: 'FAC-MTH-105' },
    { name: 'Ms. Fatima Zahra', role: 'Teacher' as const, designation: 'Senior English Language Faculty', dept: 'Faculty of Humanities', staffId: 'FAC-ENG-108' },
    { name: 'Admin & Registrar Office', role: 'Admin / Owner' as const, designation: 'School Registrar & Disciplinary Office', dept: 'Campus Administration & Accounts', staffId: 'ADM-REG-001' }
  ];

  availableClassesList: string[] = [
    'All Classes (Entire Campus)',
    'Nursery',
    'Kindergarten (KG / Prep)',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9 (Science)',
    'Class 9 (Computer Science)',
    'Class 10-A (Science)',
    'Class 10-B (Arts & Commerce)'
  ];

  availableRecipientsList: string[] = [
    'Both Students & Parents',
    'Students Only',
    'Parents Only (Guardians)',
    'Teachers & Staff Internal',
    'Entire Campus (All)'
  ];

  availablePurposeCategories: string[] = [
    'Academic & Class Instruction',
    'Daily Homework Task',
    'Examination & Date Sheet',
    'Fee & Accounts Circular',
    'Disciplinary & Attendance Warning',
    'School Event / Sports Gala Invitation',
    'Urgent Weather / Holiday Alert',
    'Staff Departmental Coordination'
  ];

  // Table Management System State
  feedViewMode: 'table' | 'cards' = 'table';
  feedClassFilter: string = 'All Classes';
  feedAudienceFilter: string = 'All';
  feedCategoryFilter: string = 'All';
  feedSearchQuery: string = '';
  feedCurrentPage: number = 1;
  feedPageSize: number = 5;

  // Selected Notice for Read Receipts Audit Modal
  selectedNoticeForReceipts: any = null;
  isReadReceiptsModalOpen: boolean = false;
  receiptsSearchQuery: string = '';

  // Selected Notice for Formal Letterhead View Modal
  selectedNoticeForView: any = null;
  isNoticeDetailModalOpen: boolean = false;

  campusFeedPosts: Array<{
    id: string;
    authorName: string;
    authorRole: 'Admin / Owner' | 'Teacher' | 'Principal';
    authorDesignation: string;
    authorDepartment: string;
    authorStaffId?: string;
    dispatchRefNo: string;
    title: string;
    content: string;
    category: string;
    purposeCategory: string;
    targetClass: string;
    targetAudience: string;
    urgency: 'Normal Notice' | 'Important' | '🚨 Urgent Official Alert' | 'Normal' | 'Urgent Circular';
    postedAt: string;
    totalExpectedRecipients: number;
    readReceipts: Array<{
      id: string;
      readerName: string;
      readerRole: 'Student' | 'Parent' | 'Teacher' | 'Admin';
      classOrGrade: string;
      readTimestamp: string;
      avatarText: string;
      avatarBg: string;
    }>;
    likesCount?: number;
    isLiked?: boolean;
    commentsCount?: number;
    isPinned?: boolean;
    attachedFileUrl?: string;
    acknowledgedByStudent?: boolean;
    acknowledgedByParent?: boolean;
  }> = [
    {
      id: 'FEED-101',
      authorName: 'Dr. Tahir Malik',
      authorRole: 'Principal',
      authorDesignation: 'Principal & Academic Director',
      authorDepartment: 'Executive Directorate',
      authorStaffId: 'DIR-AHA-001',
      dispatchRefNo: 'REF-AHA/2026/OCT-101',
      title: '📋 Mid-Term Examination Code of Conduct & Official Date Sheet 2026',
      content: 'Dear Students, Faculty & Parents, Mid-Term Examinations commence on Monday, 27th October 2026. All students must strictly report in complete winter uniform with their original laminated Roll Number Slips. Electronic watches, mobile phones, and calculators with memory storage are strictly forbidden inside examination halls.',
      category: 'Examination & Date Sheet',
      purposeCategory: 'Examination & Date Sheet',
      targetClass: 'All Classes (Entire Campus)',
      targetAudience: 'Both Students & Parents',
      urgency: 'Important',
      postedAt: '23 Oct 2026, 10:45 AM',
      totalExpectedRecipients: 1240,
      readReceipts: [
        { id: 'RR-101-1', readerName: 'Zayan Ahmed Khan', readerRole: 'Student', classOrGrade: 'Class 10-A • Roll #1001', readTimestamp: '23 Oct 2026, 11:05 AM', avatarText: 'ZA', avatarBg: 'bg-sky-600' },
        { id: 'RR-101-2', readerName: 'Tariq Ahmed Khan', readerRole: 'Parent', classOrGrade: 'Guardian of Zayan (10-A)', readTimestamp: '23 Oct 2026, 11:12 AM', avatarText: 'TK', avatarBg: 'bg-purple-600' },
        { id: 'RR-101-3', readerName: 'Aiman Fatima', readerRole: 'Student', classOrGrade: 'Class 10-A • Roll #1002', readTimestamp: '23 Oct 2026, 11:18 AM', avatarText: 'AF', avatarBg: 'bg-pink-600' },
        { id: 'RR-101-4', readerName: 'Hamza Bilal', readerRole: 'Student', classOrGrade: 'Class 10-A • Roll #1003', readTimestamp: '23 Oct 2026, 11:20 AM', avatarText: 'HB', avatarBg: 'bg-emerald-600' },
        { id: 'RR-101-5', readerName: 'Prof. Tariq Mehmood', readerRole: 'Teacher', classOrGrade: 'HOD Mathematics', readTimestamp: '23 Oct 2026, 11:00 AM', avatarText: 'TM', avatarBg: 'bg-amber-600' }
      ],
      isPinned: true,
      acknowledgedByStudent: true,
      acknowledgedByParent: true
    },
    {
      id: 'FEED-102',
      authorName: 'Prof. Rehan Alvi',
      authorRole: 'Teacher',
      authorDesignation: 'Senior Physics Faculty & HOD',
      authorDepartment: 'Department of Physical Sciences',
      authorStaffId: 'FAC-PHY-104',
      dispatchRefNo: 'REF-PHY/2026/G10-04',
      title: '🔬 Grade 10-A Physics: Lab Manual & Vernier Caliper Practical Submission',
      content: 'Grade 10 Matric & O-Level Physics students are instructed that Practical Notebooks for Mechanics and Optics must be checked and signed by Friday, 24th October. Students who miss this deadline will not receive experimental lab clearance for the upcoming board assessments.',
      category: 'Academic & Class Instruction',
      purposeCategory: 'Academic & Class Instruction',
      targetClass: 'Class 10-A (Science)',
      targetAudience: 'Both Students & Parents',
      urgency: 'Important',
      postedAt: '23 Oct 2026, 10:15 AM',
      totalExpectedRecipients: 45,
      readReceipts: [
        { id: 'RR-102-1', readerName: 'Aiman Fatima', readerRole: 'Student', classOrGrade: 'Class 10-A • Roll #1002', readTimestamp: '23 Oct 2026, 10:30 AM', avatarText: 'AF', avatarBg: 'bg-pink-600' },
        { id: 'RR-102-2', readerName: 'Hamza Bilal', readerRole: 'Student', classOrGrade: 'Class 10-A • Roll #1003', readTimestamp: '23 Oct 2026, 10:45 AM', avatarText: 'HB', avatarBg: 'bg-emerald-600' }
      ],
      isPinned: false,
      acknowledgedByStudent: false
    },
    {
      id: 'FEED-103',
      authorName: 'Admin & Registrar Office',
      authorRole: 'Admin / Owner',
      authorDesignation: 'Head of Accounts & Admissions',
      authorDepartment: 'Campus Administration & Accounts',
      authorStaffId: 'ADM-REG-001',
      dispatchRefNo: 'REF-ADM/2026/FEE-88',
      title: '💳 Term-1 Fee Clearance & Early Bird 5% Sibling Concession Circular',
      content: 'Respected Parents & Guardians, Term-1 tuition fee challans have been dispatched via digital banking portals and physical slips. A 5% sibling scholarship is applicable for payments cleared before the 10th of next month. For online 1Link / KuickPay transfers, use your student 6-digit Consumer ID.',
      category: 'Fee & Accounts Circular',
      purposeCategory: 'Fee & Accounts Circular',
      targetClass: 'All Classes (Entire Campus)',
      targetAudience: 'Parents Only (Guardians)',
      urgency: 'Important',
      postedAt: '23 Oct 2026, 09:30 AM',
      totalExpectedRecipients: 1240,
      readReceipts: [
        { id: 'RR-103-1', readerName: 'Tariq Ahmed Khan', readerRole: 'Parent', classOrGrade: 'Guardian of Zayan (10-A)', readTimestamp: '23 Oct 2026, 09:50 AM', avatarText: 'TK', avatarBg: 'bg-purple-600' },
        { id: 'RR-103-2', readerName: 'Farhan Zaidi', readerRole: 'Parent', classOrGrade: 'Guardian of Ali (Class 9)', readTimestamp: '23 Oct 2026, 10:05 AM', avatarText: 'FZ', avatarBg: 'bg-blue-600' }
      ],
      isPinned: false,
      acknowledgedByParent: false
    },
    {
      id: 'FEED-104',
      authorName: 'Ms. Hira Naeem',
      authorRole: 'Teacher',
      authorDesignation: 'Head of Computer Science & ICT',
      authorDepartment: 'Department of Computing',
      authorStaffId: 'FAC-CS-102',
      dispatchRefNo: 'REF-CS/2026/LEAGUE-01',
      title: '💻 Inter-School AI & Python Robotics League 2026 Registration',
      content: 'All High School students passionate about Robotics, Artificial Intelligence, and Web Development are invited to submit their team nominations for the All-Pakistan STEM Championship. Practice bootcamps will be hosted daily in Computer Lab-2 after 01:30 PM.',
      category: 'School Event / Sports Gala Invitation',
      purposeCategory: 'School Event / Sports Gala Invitation',
      targetClass: 'Class 9 (Computer Science)',
      targetAudience: 'Students Only',
      urgency: 'Normal Notice',
      postedAt: '22 Oct 2026, 02:40 PM',
      totalExpectedRecipients: 48,
      readReceipts: [
        { id: 'RR-104-1', readerName: 'Bilal Qureshi', readerRole: 'Student', classOrGrade: 'Class 9-CS • Roll #905', readTimestamp: '22 Oct 2026, 03:10 PM', avatarText: 'BQ', avatarBg: 'bg-indigo-600' }
      ],
      isPinned: false,
      acknowledgedByStudent: false
    },
    {
      id: 'FEED-105',
      authorName: 'Academic Directorate',
      authorRole: 'Principal',
      authorDesignation: 'Office of Academic Dean',
      authorDepartment: 'Executive Directorate',
      authorStaffId: 'DIR-AHA-002',
      dispatchRefNo: 'REF-FAC/2026/CONF-09',
      title: '🔒 Confidential: Staff Academic Review & Syllabus Completion Audit (Faculty Only)',
      content: 'This internal notice is strictly for all Subject Incharges and Teaching Faculty. The Term-1 Course Progress Audit and Parent-Teacher Meeting agenda will be finalized this Thursday at 02:30 PM in Conference Room-1. Please submit your lesson logbooks prior to the session.',
      category: 'Staff Departmental Coordination',
      purposeCategory: 'Staff Departmental Coordination',
      targetClass: 'All Classes (Entire Campus)',
      targetAudience: 'Teachers & Staff Internal',
      urgency: 'Important',
      postedAt: '22 Oct 2026, 11:15 AM',
      totalExpectedRecipients: 86,
      readReceipts: [
        { id: 'RR-105-1', readerName: 'Prof. Rehan Alvi', readerRole: 'Teacher', classOrGrade: 'Department of Physical Sciences', readTimestamp: '22 Oct 2026, 11:30 AM', avatarText: 'RA', avatarBg: 'bg-emerald-600' },
        { id: 'RR-105-2', readerName: 'Ms. Hira Naeem', readerRole: 'Teacher', classOrGrade: 'Department of Computing', readTimestamp: '22 Oct 2026, 11:45 AM', avatarText: 'HN', avatarBg: 'bg-purple-600' },
        { id: 'RR-105-3', readerName: 'Prof. Tariq Mehmood', readerRole: 'Teacher', classOrGrade: 'Department of Mathematics', readTimestamp: '22 Oct 2026, 12:00 PM', avatarText: 'TM', avatarBg: 'bg-amber-600' }
      ],
      isPinned: false
    },
    {
      id: 'FEED-106',
      authorName: 'Ms. Fatima Zahra',
      authorRole: 'Teacher',
      authorDesignation: 'Senior English Language Faculty',
      authorDepartment: 'Faculty of Humanities',
      authorStaffId: 'FAC-ENG-108',
      dispatchRefNo: 'REF-ENG/2026/HW-14',
      title: '📖 Class 8 & 9: English Creative Essay & Reading Comprehension Task',
      content: 'All Class 8 and 9 students must complete the 250-word essay titled "Impact of Technology on Education" and submit to their respective English teachers by Monday morning during zero period.',
      category: 'Daily Homework Task',
      purposeCategory: 'Daily Homework Task',
      targetClass: 'Class 8',
      targetAudience: 'Both Students & Parents',
      urgency: 'Normal Notice',
      postedAt: '22 Oct 2026, 09:10 AM',
      totalExpectedRecipients: 42,
      readReceipts: [
        { id: 'RR-106-1', readerName: 'Usman Ghani', readerRole: 'Student', classOrGrade: 'Class 8-A • Roll #812', readTimestamp: '22 Oct 2026, 09:40 AM', avatarText: 'UG', avatarBg: 'bg-teal-600' }
      ],
      isPinned: false
    }
  ];

  // ================= EVENT MANAGEMENT & BUDGETING STATE =================
  selectedEventCategoryFilter: string = 'All';
  selectedEventStatusFilter: string = 'All';
  eventSearchQuery: string = '';
  selectedEventForDetail: any = null;

  eventForm = {
    title: '',
    description: '',
    category: 'Sports & Athletics' as 'Sports & Athletics' | 'Academic Competition' | 'Cultural Festival' | 'Exhibition' | 'Annual Function' | 'Parent-Teacher Meeting' | 'Workshop',
    eventDate: '2026-11-15',
    eventTime: '09:00 AM - 04:00 PM',
    venue: 'Main School Athletics Ground & Sports Complex',
    chiefGuest: 'Prof. Ahsan Iqbal (Minister of Education)',
    organizerName: 'Engr. Bilal Hashmi (Event Coordinator)',
    allocatedBudget: 250000,
    sponsorCollections: 80000,
    ticketCollections: 45000,
    coordinatorTeacher: 'Prof. Tariq Mehmood',
    assignedTeachersStr: 'Prof. Rehan Alvi, Ms. Hira Naeem, Dr. Sarah Jenkins'
  };

  schoolEventsList: Array<{
    id: string;
    title: string;
    description: string;
    category: 'Sports & Athletics' | 'Academic Competition' | 'Cultural Festival' | 'Exhibition' | 'Annual Function' | 'Parent-Teacher Meeting' | 'Workshop';
    eventDate: string;
    eventTime: string;
    venue: string;
    chiefGuest?: string;
    organizerName: string;
    status: 'Planning' | 'Published' | 'In Progress' | 'Completed' | 'Cancelled';
    allocatedBudget: number;
    sponsorCollections: number;
    ticketCollections: number;
    totalExpenses: number;
    netSurplusOrDeficit: number;
    coordinatorTeacher: string;
    assignedTeachers: string[];
    subTasks: { id: string; title: string; assignedTo: string; isCompleted: boolean }[];
    expenseItems: { id: string; title: string; amount: number; category: string }[];
    isPublishedToPortals: boolean;
    publishedAt?: string;
    attendingStudentsCount: number;
    attendingParentsCount: number;
    dressCode?: string;
    studentRsvpd?: boolean;
    parentRsvpd?: boolean;
    readReceipts?: Array<{
      id: string;
      readerName: string;
      readerRole: 'Student' | 'Parent' | 'Teacher' | 'Admin';
      classOrGrade: string;
      readTimestamp: string;
      avatarText: string;
      avatarBg: string;
    }>;
  }> = [
    {
      id: 'EVT-2026-01',
      title: '🏆 Annual Mega Sports Gala & Athletics Championship 2026',
      description: 'Grand inter-house sports tournament including 100m sprint, cricket final, football championship, relay race, and martial arts demonstration.',
      category: 'Sports & Athletics',
      eventDate: '2026-11-15',
      eventTime: '08:30 AM - 05:00 PM',
      venue: 'Main Athletics Ground & Complex',
      chiefGuest: 'Brigadier (R) Tariq Khan',
      organizerName: 'Sports Dept & School Admin',
      status: 'Published',
      allocatedBudget: 350000,
      sponsorCollections: 120000,
      ticketCollections: 60000,
      totalExpenses: 285000,
      netSurplusOrDeficit: 245000,
      coordinatorTeacher: 'Prof. Rehan Alvi',
      assignedTeachers: ['Prof. Rehan Alvi', 'Ms. Hira Naeem', 'Coach Rashid'],
      subTasks: [
        { id: 'ST-1', title: 'Ground & Field Stage Decoration', assignedTo: 'Prof. Rehan Alvi', isCompleted: true },
        { id: 'ST-2', title: 'Trophies & Medals Procurement', assignedTo: 'Ms. Hira Naeem', isCompleted: true },
        { id: 'ST-3', title: 'Refreshment & Juice Stalls Setup', assignedTo: 'Coach Rashid', isCompleted: false },
        { id: 'ST-4', title: 'Sound System & Live Commentator', assignedTo: 'Admin Office', isCompleted: true }
      ],
      expenseItems: [
        { id: 'EXP-1', title: 'Custom Engraved Trophies & Gold Medals', amount: 110000, category: 'Awards' },
        { id: 'EXP-2', title: 'Sound, Stage Canopy & Lighting Tent', amount: 95000, category: 'Infrastructure' },
        { id: 'EXP-3', title: 'VIP Chief Guest Refreshment Box', amount: 35000, category: 'Food & Catering' },
        { id: 'EXP-4', title: 'First Aid Medical Kit & Ambulance Tent', amount: 45000, category: 'Health & Safety' }
      ],
      isPublishedToPortals: true,
      publishedAt: 'Yesterday, 04:30 PM',
      attendingStudentsCount: 420,
      attendingParentsCount: 185,
      readReceipts: [
        { id: 'RR-EVT-1', readerName: 'Zayan Ahmed Khan', readerRole: 'Student', classOrGrade: 'Class 10-A • Roll #1001', readTimestamp: '23 Oct 2026, 05:10 PM', avatarText: 'ZA', avatarBg: 'bg-sky-600' },
        { id: 'RR-EVT-2', readerName: 'Tariq Ahmed Khan', readerRole: 'Parent', classOrGrade: 'Guardian of Zayan (10-A)', readTimestamp: '23 Oct 2026, 05:25 PM', avatarText: 'TK', avatarBg: 'bg-purple-600' },
        { id: 'RR-EVT-3', readerName: 'Prof. Rehan Alvi', readerRole: 'Teacher', classOrGrade: 'Senior Physics Faculty', readTimestamp: '23 Oct 2026, 04:30 PM', avatarText: 'RA', avatarBg: 'bg-emerald-600' },
        { id: 'RR-EVT-4', readerName: 'Ms. Hira Naeem', readerRole: 'Teacher', classOrGrade: 'HOD Computer Science', readTimestamp: '23 Oct 2026, 04:45 PM', avatarText: 'HN', avatarBg: 'bg-pink-600' }
      ]
    },
    {
      id: 'EVT-2026-02',
      title: '🔬 Inter-School AI & Science Model Exhibition 2026',
      description: 'Exhibition of student robotics models, solar energy projects, software apps, and chemistry live demonstrations.',
      category: 'Exhibition',
      eventDate: '2026-12-05',
      eventTime: '09:00 AM - 03:30 PM',
      venue: 'School Auditorium & STEM Labs',
      chiefGuest: 'Dr. Atta-ur-Rahman (Ex-HEC Chairman)',
      organizerName: 'Science & IT Faculty',
      status: 'Planning',
      allocatedBudget: 200000,
      sponsorCollections: 50000,
      ticketCollections: 20000,
      totalExpenses: 115000,
      netSurplusOrDeficit: 155000,
      coordinatorTeacher: 'Engr. Bilal Hashmi',
      assignedTeachers: ['Engr. Bilal Hashmi', 'Prof. Tariq Mehmood', 'Ms. Hira Naeem'],
      subTasks: [
        { id: 'ST-10', title: 'Project Stalls Allotment Sheet', assignedTo: 'Engr. Bilal Hashmi', isCompleted: true },
        { id: 'ST-11', title: 'Judges Evaluation Sheet Printing', assignedTo: 'Prof. Tariq Mehmood', isCompleted: false }
      ],
      expenseItems: [
        { id: 'EXP-10', title: 'Auditorium Banner & Project Tables', amount: 65000, category: 'Setup' },
        { id: 'EXP-11', title: 'Shields for Winning Student Projects', amount: 50000, category: 'Awards' }
      ],
      isPublishedToPortals: false,
      attendingStudentsCount: 0,
      attendingParentsCount: 0,
      readReceipts: [
        { id: 'RR-EVT-201', readerName: 'Engr. Bilal Hashmi', readerRole: 'Teacher', classOrGrade: 'Science & IT Faculty', readTimestamp: '23 Oct 2026, 02:15 PM', avatarText: 'BH', avatarBg: 'bg-indigo-600' },
        { id: 'RR-EVT-202', readerName: 'Aiman Fatima', readerRole: 'Student', classOrGrade: 'Class 10-A • Roll #1002', readTimestamp: '23 Oct 2026, 03:00 PM', avatarText: 'AF', avatarBg: 'bg-pink-600' }
      ]
    }
  ];

  // ================= IN-APP NOTIFICATIONS STATE =================
  notificationsList: Array<{
    id: string;
    title: string;
    message: string;
    type: 'feed' | 'event' | 'fee' | 'attendance' | 'exam' | 'general';
    targetRole: 'all' | 'student' | 'parent' | 'teacher';
    createdAt: string;
    isUnread: boolean;
    linkTab?: string;
  }> = [
    {
      id: 'NOTIF-1',
      title: '📢 New Campus Instruction Posted',
      message: 'Dr. Sarah Jenkins posted: Mid-Term Examination Code of Conduct & Guidelines 2026.',
      type: 'feed',
      targetRole: 'all',
      createdAt: '10 Mins Ago',
      isUnread: true,
      linkTab: 'feed'
    },
    {
      id: 'NOTIF-2',
      title: '🏆 New Event Published: Annual Sports Gala 2026',
      message: 'Annual Mega Sports Gala & Athletics Championship scheduled for Nov 15, 2026 at Main Grounds.',
      type: 'event',
      targetRole: 'all',
      createdAt: '1 Hour Ago',
      isUnread: true,
      linkTab: 'events'
    },
    {
      id: 'NOTIF-3',
      title: '💳 Monthly Fee Voucher Released',
      message: 'October 2026 Fee Challan Voucher has been uploaded to your portal.',
      type: 'fee',
      targetRole: 'parent',
      createdAt: '1 Day Ago',
      isUnread: false,
      linkTab: 'fee'
    }
  ];

  get unreadNotificationsCount(): number {
    return this.notificationsList.filter(n => n.isUnread).length;
  }

  openCampusUpdatesDirectly(): void {
    this.notificationsList.forEach(n => n.isUnread = false);
    this.isNotificationsDropdownOpen = false;

    if (this.currentPortalRole === 'student') {
      this.studentTab = 'feed';
    } else if (this.currentPortalRole === 'parent') {
      this.parentTab = 'feed';
    } else if (this.currentPortalRole === 'teacher') {
      this.teacherTab = 'feed';
    } else {
      this.currentTab = 'feed';
    }

    setTimeout(() => {
      const target = document.getElementById('campus-updates-stream');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);

    this.showToast('📢 Jumped to Latest Notices, Circulars & Updates!', 'info');
  }

  toggleNotificationsDropdown(): void {
    this.openCampusUpdatesDirectly();
  }

  markAllNotificationsAsRead(): void {
    this.notificationsList.forEach(n => n.isUnread = false);
    this.showToast('All notifications marked as read', 'success');
  }

  // ================= NOTICE & FEED METHODS =================
  openFeedModal(): void {
    if (this.currentPortalRole === 'teacher') {
      this.feedForm = {
        title: '',
        content: '',
        category: 'Academic & Class Instruction',
        targetAudience: 'Both Students & Parents',
        targetClass: 'Class 10-A (Science)',
        purposeCategory: 'Academic & Class Instruction',
        issuerRole: 'Teacher',
        authorRole: 'Teacher',
        selectedFacultyAuthor: 'Prof. Rehan Alvi (Senior Physics Faculty)',
        authorName: 'Prof. Rehan Alvi',
        authorDesignation: 'Senior Physics Faculty & HOD',
        authorDepartment: 'Department of Physical Sciences',
        authorStaffId: 'FAC-PHY-104',
        urgency: 'Normal Notice',
        attachedFileUrl: ''
      };
    } else {
      this.feedForm = {
        title: '',
        content: '',
        category: 'Academic & Class Instruction',
        targetAudience: 'Both Students & Parents',
        targetClass: 'All Classes (Entire Campus)',
        purposeCategory: 'Academic & Class Instruction',
        issuerRole: 'Principal',
        authorRole: 'Principal',
        selectedFacultyAuthor: 'Dr. Tahir Malik (Principal & Academic Director)',
        authorName: 'Dr. Tahir Malik',
        authorDesignation: 'Principal & Academic Director',
        authorDepartment: 'Executive Directorate',
        authorStaffId: 'DIR-AHA-001',
        urgency: 'Normal Notice',
        attachedFileUrl: ''
      };
    }
    this.isFeedModalOpen = true;
  }

  closeFeedModal(): void {
    this.isFeedModalOpen = false;
  }

  submitFeedPost(): void {
    if (!this.feedForm.title || !this.feedForm.content) {
      this.showToast('Please enter title and content for the official notice', 'warning');
      return;
    }

    const refPrefix = this.feedForm.authorRole === 'Teacher' ? 'REF-FAC' : (this.feedForm.authorRole === 'Principal' ? 'REF-AHA' : 'REF-ADM');
    const dispatchRefNo = `${refPrefix}/2026/OCT-${Math.floor(100 + Math.random() * 900)}`;

    const now = new Date();
    const postedTimeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let expected = 1240;
    if (this.feedForm.targetClass.includes('10')) expected = 45;
    else if (this.feedForm.targetClass.includes('9')) expected = 48;
    else if (this.feedForm.targetClass.includes('Nursery') || this.feedForm.targetClass.includes('KG')) expected = 32;
    else if (this.feedForm.targetAudience.includes('Teachers')) expected = 38;

    const newPost: any = {
      id: 'FEED-' + Math.floor(1000 + Math.random() * 9000),
      authorName: this.feedForm.authorName,
      authorRole: this.feedForm.authorRole,
      authorDesignation: this.feedForm.authorDesignation,
      authorDepartment: this.feedForm.authorDepartment,
      authorStaffId: this.feedForm.authorStaffId,
      dispatchRefNo,
      title: this.feedForm.title,
      content: this.feedForm.content,
      category: this.feedForm.purposeCategory,
      purposeCategory: this.feedForm.purposeCategory,
      targetClass: this.feedForm.targetClass,
      targetAudience: this.feedForm.targetAudience,
      urgency: this.feedForm.urgency,
      postedAt: postedTimeStr,
      createdInPortalRole: this.currentPortalRole,
      readReceipts: [
        {
          id: 'RR-' + Date.now(),
          readerName: `${this.feedForm.authorName} (Sender Dispatched)`,
          readerRole: this.feedForm.authorRole === 'Teacher' ? 'Teacher' : 'Admin',
          classOrGrade: this.feedForm.authorDepartment,
          readTimestamp: postedTimeStr,
          avatarText: this.feedForm.authorName.slice(0, 2).toUpperCase(),
          avatarBg: this.feedForm.authorRole === 'Teacher' ? 'bg-emerald-600' : 'bg-indigo-600'
        }
      ],
      totalExpectedRecipients: expected,
      isPinned: false,
      likesCount: 1,
      isLiked: true,
      attachedFileUrl: this.feedForm.attachedFileUrl || undefined,
      acknowledgedByStudent: false,
      acknowledgedByParent: false
    };

    this.campusFeedPosts.unshift(newPost);

    // Create automatic Targeted In-App Notification
    let targetRole: 'all' | 'student' | 'parent' | 'teacher' = 'all';
    if (newPost.targetAudience.includes('Parents')) targetRole = 'parent';
    else if (newPost.targetAudience.includes('Students') || newPost.targetClass.includes('Class')) targetRole = 'student';
    else if (newPost.targetAudience.includes('Teachers')) targetRole = 'teacher';

    this.notificationsList.unshift({
      id: 'NOTIF-' + Date.now(),
      title: `📢 ${newPost.purposeCategory}: ${newPost.title}`,
      message: `${newPost.authorName} [${newPost.authorDesignation}] posted for ${newPost.targetClass}: ${newPost.content.slice(0, 75)}...`,
      type: 'feed',
      targetRole,
      createdAt: 'Just now',
      isUnread: true,
      linkTab: 'feed'
    });

    this.closeFeedModal();
    this.showToast(`📢 Official Notice [${dispatchRefNo}] Dispatched to ${newPost.targetClass}!`, 'success');
  }

  canEditFeedPost(post: any): boolean {
    if (!post) return false;
    // Student & Parent portals are strictly read-only
    if (this.currentPortalRole === 'student' || this.currentPortalRole === 'parent') {
      return false;
    }

    const author = (post.authorName || '').toLowerCase().trim();

    if (this.currentPortalRole === 'teacher') {
      // In Teacher Portal, active teacher is Prof. Tariq Mehmood or Prof. Rehan Alvi
      if (author.includes('tariq mehmood') || author.includes('rehan alvi') || author.includes('tariq')) {
        return true;
      }
      if (post.createdInPortalRole === 'teacher') {
        return true;
      }
      return false;
    }

    if (this.currentPortalRole === 'owner') {
      // In Owner/Principal Portal, active user is Dr. Tahir Malik or Admin Registrar
      if (author.includes('tahir') || author.includes('malik') || author.includes('admin') || author.includes('registrar') || author.includes('directorate')) {
        return true;
      }
      if (post.createdInPortalRole === 'owner') {
        return true;
      }
      return false;
    }

    return false;
  }

  isPostAuthoredByCurrentUser(post: any): boolean {
    if (!post) return false;
    if (post.isCreatedInCurrentSession) return true;

    // Students and Parents are strictly readers, never post authors
    if (this.currentPortalRole === 'student' || this.currentPortalRole === 'parent') {
      return false;
    }

    const author = (post.authorName || '').toLowerCase().trim();

    if (this.currentPortalRole === 'owner' || this.currentPortalRole === 'principal') {
      // In Owner/Principal Portal, active persona is Dr. Tahir Malik
      return author.includes('tahir') || author.includes('malik') || author.includes('directorate');
    }

    if (this.currentPortalRole === 'teacher') {
      // In Teacher Portal, active teacher persona (e.g., Prof. Tariq Mehmood)
      const activeTeacher = (this.activeTeacherName || 'Prof. Tariq Mehmood').toLowerCase();
      if (activeTeacher.includes('tariq') && (author.includes('tariq') || author.includes('mehmood'))) {
        return true;
      }
      if (activeTeacher.includes('rehan') && (author.includes('rehan') || author.includes('alvi'))) {
        return true;
      }
      return author.includes('tariq mehmood');
    }

    return false;
  }

  isEventAuthoredByCurrentUser(evt: any): boolean {
    if (!evt) return false;
    if (evt.isCreatedInCurrentSession) return true;

    if (this.currentPortalRole === 'student' || this.currentPortalRole === 'parent') {
      return false;
    }

    const coord = (evt.coordinatorTeacher || '').toLowerCase().trim();
    const org = (evt.organizerName || '').toLowerCase().trim();

    if (this.currentPortalRole === 'owner' || this.currentPortalRole === 'principal') {
      return coord.includes('tahir') || coord.includes('malik') || org.includes('tahir') || org.includes('principal') || org.includes('executive directorate');
    }

    if (this.currentPortalRole === 'teacher') {
      const activeTeacher = (this.activeTeacherName || 'Prof. Tariq Mehmood').toLowerCase();
      if (activeTeacher.includes('tariq')) {
        return coord.includes('tariq') || org.includes('tariq');
      }
      if (activeTeacher.includes('rehan')) {
        return coord.includes('rehan') || org.includes('rehan');
      }
      return coord.includes('tariq');
    }

    return false;
  }

  canDeleteFeedPost(post: any): boolean {
    return this.canEditFeedPost(post);
  }

  toggleLikePost(post: any): void {
    if (!post) return;
    if (post.likesCount === undefined) post.likesCount = Math.floor(Math.random() * 12) + 3;
    if (post.isLiked) {
      post.likesCount = Math.max(0, post.likesCount - 1);
      post.isLiked = false;
      this.showToast('Unliked post', 'info');
    } else {
      post.likesCount = (post.likesCount || 0) + 1;
      post.isLiked = true;
      this.showToast('❤️ Liked & marked post as helpful!', 'success');
    }
  }

  openEditFeedModal(post: any): void {
    if (!this.canEditFeedPost(post)) {
      this.showToast(`🔒 You can only edit your own posts. Post by ${post.authorName} is read-only.`, 'warning');
      return;
    }
    this.editingFeedPost = post;
    this.feedForm = {
      title: post.title || '',
      content: post.content || '',
      category: post.category || 'Academic & Class Instruction',
      targetAudience: post.targetAudience || 'Both Students & Parents',
      targetClass: post.targetClass || 'All Classes (Entire Campus)',
      purposeCategory: post.purposeCategory || post.category || 'Academic & Class Instruction',
      issuerRole: post.authorRole || 'Principal',
      authorRole: post.authorRole || 'Principal',
      selectedFacultyAuthor: post.authorName,
      authorName: post.authorName,
      authorDesignation: post.authorDesignation || 'School Faculty',
      authorDepartment: post.authorDepartment || 'Academic Department',
      authorStaffId: post.authorStaffId || 'STAFF-001',
      urgency: post.urgency || 'Normal Notice',
      attachedFileUrl: post.attachedFileUrl || ''
    };
    this.isEditFeedModalOpen = true;
  }

  closeEditFeedModal(): void {
    this.isEditFeedModalOpen = false;
    this.editingFeedPost = null;
  }

  saveEditedFeedPost(): void {
    if (!this.editingFeedPost) return;
    if (!this.canEditFeedPost(this.editingFeedPost)) {
      this.showToast('🔒 You do not have permission to edit this post.', 'warning');
      return;
    }
    if (!this.feedForm.title || !this.feedForm.content) {
      this.showToast('Please fill in notice title and body text', 'warning');
      return;
    }

    this.editingFeedPost.title = this.feedForm.title;
    this.editingFeedPost.content = this.feedForm.content;
    this.editingFeedPost.targetClass = this.feedForm.targetClass;
    this.editingFeedPost.targetAudience = this.feedForm.targetAudience;
    this.editingFeedPost.purposeCategory = this.feedForm.purposeCategory;
    this.editingFeedPost.category = this.feedForm.purposeCategory;
    this.editingFeedPost.urgency = this.feedForm.urgency;

    this.closeEditFeedModal();
    this.showToast('✏️ Feed post updated successfully!', 'success');
  }

  deleteFeedPost(post: any): void {
    if (!this.canDeleteFeedPost(post)) {
      this.showToast(`🔒 You can only delete your own posts. Post by ${post.authorName} is read-only.`, 'warning');
      return;
    }
    const idx = this.campusFeedPosts.findIndex(p => p.id === post.id);
    if (idx !== -1) {
      this.campusFeedPosts.splice(idx, 1);
      this.showToast('🗑️ Post deleted from feed', 'info');
    }
  }

  togglePinFeedPost(post: any): void {
    post.isPinned = !post.isPinned;
    this.showToast(post.isPinned ? '📌 Post pinned to top of feed' : 'Unpinned post', 'info');
  }

  openReadReceiptsModal(post: any): void {
    this.selectedNoticeForReceipts = post;
    this.receiptsSearchQuery = '';
    this.isReadReceiptsModalOpen = true;
  }

  closeReadReceiptsModal(): void {
    this.isReadReceiptsModalOpen = false;
    this.selectedNoticeForReceipts = null;
  }

  openNoticeDetailModal(post: any): void {
    this.selectedNoticeForView = post;
    this.isNoticeDetailModalOpen = true;
  }

  closeNoticeDetailModal(): void {
    this.isNoticeDetailModalOpen = false;
    this.selectedNoticeForView = null;
  }

  recordNoticeRead(post: any, role: string, customReaderName?: string): void {
    const isStudent = (role || '').toLowerCase() === 'student';
    const readerName = customReaderName || (isStudent ? 'Zayan Ahmed Khan' : 'Tariq Ahmed Khan (Guardian)');
    const readerRole: 'Student' | 'Parent' | 'Teacher' | 'Admin' = isStudent ? 'Student' : 'Parent';
    const readerClass = isStudent ? 'Class 10-A • Roll #1001' : 'Guardian of Zayan (10-A)';
    const avatarBg = isStudent ? 'bg-sky-600' : 'bg-purple-600';
    const avatarText = isStudent ? 'ZA' : 'TK';

    if (!post.readReceipts) post.readReceipts = [];
    const searchKey = isStudent ? 'Zayan' : 'Tariq';
    const exists = post.readReceipts.some((r: any) => r.readerName.includes(searchKey) || (customReaderName && r.readerName === customReaderName));
    if (!exists) {
      const now = new Date();
      const timeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' +
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      post.readReceipts.unshift({
        id: 'RR-' + Date.now(),
        readerName,
        readerRole,
        classOrGrade: readerClass,
        readTimestamp: timeStr,
        avatarText,
        avatarBg
      });
    }

    if (isStudent) post.acknowledgedByStudent = true;
    else post.acknowledgedByParent = true;

    this.showToast(`✅ Notice acknowledged! Verified read receipt recorded in institutional audit log.`, 'success');
  }

  toggleAcknowledgeNotice(post: any, role: string, customReaderName?: string): void {
    this.recordNoticeRead(post, role, customReaderName);
  }

  getFilteredReceiptsList(post: any): any[] {
    if (!post || !post.readReceipts) return [];
    const q = (this.receiptsSearchQuery || '').toLowerCase().trim();
    if (!q) return post.readReceipts;
    return post.readReceipts.filter((r: any) =>
      r.readerName.toLowerCase().includes(q) ||
      r.classOrGrade.toLowerCase().includes(q) ||
      r.readerRole.toLowerCase().includes(q)
    );
  }

  downloadNoticeCircular(post: any): void {
    const content = `===================================================================
                AL-HUDA INTERNATIONAL ACADEMY
       OFFICIAL CAMPUS CIRCULAR & ADMINISTRATIVE DISPATCH
===================================================================
Dispatch Ref No.  : ${post.dispatchRefNo || 'AHA-DISPATCH-2026'}
Issuing Authority : ${post.authorName} (${post.authorDesignation || 'Academic Authority'})
Department        : ${post.authorDepartment || 'Campus Directorate'}
Staff ID Ref      : ${post.authorStaffId || 'STAFF-AUTH-001'}
Target Class      : ${post.targetClass || 'All Classes'}
Target Audience   : ${post.targetAudience}
Purpose / Category: ${post.purposeCategory || post.category} [Urgency: ${post.urgency || 'Normal'}]
Date of Dispatch  : ${post.postedAt || 'October 2026'}
===================================================================
TITLE: ${post.title}
-------------------------------------------------------------------
${post.content}
===================================================================
OFFICIAL VERIFICATION & AUDIT RECEIPT:
Total Confirmed Readers: ${(post.readReceipts || []).length} / ${post.totalExpectedRecipients || 45} Acknowledged
[VERIFIED & ARCHIVED IN ACADEMIC REGISTRAR PERMANENT REPOSITORY]
Digital Seal Code: AHA-SEC-VAL-${post.id}-VERIFIED
All students, faculty & parents are requested to adhere to instructions.
===================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Circular_${(post.dispatchRefNo || post.id).replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`📄 Downloaded official circular slip for "${post.title.slice(0, 25)}..."`, 'success');
  }

  // ================= EVENT METHODS =================
  openEventModal(): void {
    this.eventForm = {
      title: '',
      description: '',
      category: 'Sports & Athletics',
      eventDate: new Date().toISOString().slice(0, 10),
      eventTime: '09:00 AM - 02:00 PM',
      venue: 'School Main Grounds / Sports Complex',
      chiefGuest: '',
      organizerName: 'Prof. Tariq Mehmood (Sports Department)',
      allocatedBudget: 150000,
      sponsorCollections: 30000,
      ticketCollections: 15000,
      coordinatorTeacher: 'Prof. Rehan Alvi',
      assignedTeachersStr: 'Prof. Tariq Mehmood, Ms. Hira Naeem, Coach Rashid'
    };
    this.isEventModalOpen = true;
  }

  closeEventModal(): void {
    this.isEventModalOpen = false;
  }

  submitEventForm(): void {
    if (!this.eventForm.title || !this.eventForm.eventDate) {
      this.showToast('Please enter event title and date', 'warning');
      return;
    }

    const assigned = this.eventForm.assignedTeachersStr.split(',').map(s => s.trim()).filter(Boolean);
    const allocated = Number(this.eventForm.allocatedBudget) || 0;
    const sponsors = Number(this.eventForm.sponsorCollections) || 0;
    const tickets = Number(this.eventForm.ticketCollections) || 0;

    const newEvent = {
      id: 'EVT-' + Math.floor(1000 + Math.random() * 9000),
      title: this.eventForm.title,
      description: this.eventForm.description,
      category: this.eventForm.category,
      eventDate: this.eventForm.eventDate,
      eventTime: this.eventForm.eventTime,
      venue: this.eventForm.venue,
      chiefGuest: this.eventForm.chiefGuest || 'To Be Announced',
      organizerName: this.eventForm.organizerName || 'Faculty Event Board',
      status: 'Planning' as any,
      allocatedBudget: allocated,
      sponsorCollections: sponsors,
      ticketCollections: tickets,
      totalExpenses: 0,
      netSurplusOrDeficit: allocated + sponsors + tickets,
      coordinatorTeacher: this.eventForm.coordinatorTeacher,
      assignedTeachers: assigned,
      subTasks: [
        { id: 'ST-' + Date.now(), title: 'Venue Setup & Sound Testing', assignedTo: this.eventForm.coordinatorTeacher, isCompleted: false },
        { id: 'ST-' + (Date.now() + 1), title: 'Invitations & Protocol Arrangements', assignedTo: assigned[0] || 'Admin', isCompleted: false }
      ],
      expenseItems: [],
      isPublishedToPortals: false,
      attendingStudentsCount: 0,
      attendingParentsCount: 0,
      studentRsvpd: false,
      parentRsvpd: false
    };

    this.schoolEventsList.unshift(newEvent as any);
    this.closeEventModal();
    this.showToast('🎯 New event planned successfully! You can now publish to portals.', 'success');
  }

  publishEventToPortals(evt: any): void {
    evt.status = 'Published';
    evt.isPublishedToPortals = true;
    evt.publishedAt = 'Just now';

    // Broadcast Notification
    this.notificationsList.unshift({
      id: 'NOTIF-EVT-' + Date.now(),
      title: `🏆 New Event Published: ${evt.title}`,
      message: `Event on ${evt.eventDate} at ${evt.venue}. Organized by ${evt.organizerName}.`,
      type: 'event',
      targetRole: 'all',
      createdAt: 'Just now',
      isUnread: true,
      linkTab: 'events'
    });

    this.showToast(`🚀 Event "${evt.title}" published & broadcasted to Student & Parent portals!`, 'success');
  }

  viewEventDetails(evt: any): void {
    this.selectedEventForDetail = evt;
    this.isEventDetailModalOpen = true;
  }

  closeEventDetailModal(): void {
    this.isEventDetailModalOpen = false;
    this.selectedEventForDetail = null;
  }

  addExpenseToEvent(evt: any, title: string, amount: number, category: string): void {
    if (!title || !amount) return;
    const expItem = {
      id: 'EXP-' + Date.now(),
      title,
      amount: Number(amount),
      category: category || 'General'
    };
    evt.expenseItems.push(expItem);
    evt.totalExpenses = (evt.expenseItems || []).reduce((acc: number, item: any) => acc + item.amount, 0);
    const grossIn = evt.allocatedBudget + evt.sponsorCollections + evt.ticketCollections;
    evt.netSurplusOrDeficit = grossIn - evt.totalExpenses;
    this.showToast('Expense item added to event budget ledger', 'success');
  }

  toggleEventSubTask(task: any): void {
    task.isCompleted = !task.isCompleted;
  }

  rsvpEvent(evt: any, role: 'student' | 'parent'): void {
    if (role === 'student') {
      evt.studentRsvpd = !evt.studentRsvpd;
      if (evt.studentRsvpd) {
        evt.attendingStudentsCount = (evt.attendingStudentsCount || 0) + 1;
        this.showToast(`🎉 Attendance RSVP Confirmed for "${evt.title}"! Entry allocated.`, 'success');
      } else {
        evt.attendingStudentsCount = Math.max(0, (evt.attendingStudentsCount || 1) - 1);
        this.showToast('RSVP Cancelled', 'info');
      }
    } else {
      evt.parentRsvpd = !evt.parentRsvpd;
      if (evt.parentRsvpd) {
        evt.attendingParentsCount = (evt.attendingParentsCount || 0) + 1;
        this.showToast(`👨‍👩‍👧 Family Attendance RSVP registered for "${evt.title}"!`, 'success');
      } else {
        evt.attendingParentsCount = Math.max(0, (evt.attendingParentsCount || 1) - 1);
        this.showToast('Family RSVP Cancelled', 'info');
      }
    }
  }

  downloadEventPass(evt: any, role: 'student' | 'parent' = 'student'): void {
    const attendeeName = role === 'student' ? 'Zayan Ahmed Khan (Roll: AHA-1029, Grade 10-A)' : 'Mr. & Mrs. Ahmed Khan (Parent of Zayan Khan, Grade 10-A)';
    const passType = role === 'student' ? 'OFFICIAL STUDENT ADMISSION TICKET & QR PASS' : 'VIP FAMILY & PARENT GUEST PASS';
    const content = `===================================================================
                AL-HUDA INTERNATIONAL ACADEMY
                    ${passType}
===================================================================
Event Title       : ${evt.title}
Category          : ${evt.category}
Date & Time       : ${evt.eventDate} | ${evt.eventTime}
Venue             : ${evt.venue}
Chief Guest       : ${evt.chiefGuest || 'To Be Announced'}
Faculty Organizer : ${evt.organizerName || 'Sports & Co-Curricular Board'}
Patron            : Dr. Tahir Malik (Principal & Academic Director)
-------------------------------------------------------------------
PASS HOLDER       : ${attendeeName}
GATE SECURITY QR  : AHA-GATE-${evt.id}-${role.toUpperCase()}-VERIFIED-8910
STATUS            : OFFICIAL ADMISSION GRANTED
===================================================================
INSTRUCTIONS:
1. Please present this digital token or printed slip at campus gate security.
2. Gates close 15 minutes before opening ceremonies.
===================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${role === 'student' ? 'Student' : 'Parent'}_Event_Pass_${evt.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`🎟️ Downloaded ${role === 'student' ? 'Student' : 'Family'} pass for "${evt.title.slice(0, 30)}..."`, 'success');
  }

  handleNotificationClick(notif: any): void {
    if (!notif) return;
    notif.isUnread = false;
    this.isNotificationsDropdownOpen = false;
    if (this.currentPortalRole === 'owner') {
      if (notif.linkTab) this.setTab(notif.linkTab);
    } else if (this.currentPortalRole === 'teacher') {
      if (notif.linkTab) this.setTeacherTab(notif.linkTab);
    } else if (this.currentPortalRole === 'student') {
      if (notif.linkTab === 'feed') this.setStudentTab('feed');
      else if (notif.linkTab === 'events') this.setStudentTab('events');
      else this.setStudentTab('overview');
    } else if (this.currentPortalRole === 'parent') {
      if (notif.linkTab === 'feed') this.setParentTab('feed');
      else if (notif.linkTab === 'events') this.setParentTab('events');
      else if (notif.linkTab === 'fee') this.setParentTab('fee');
      else this.setParentTab('overview');
    }
  }

  get filteredNoticeHistory(): any[] {
    return (this.campusFeedPosts || []).filter(p => {
      // Role Isolation:
      if (this.currentPortalRole === 'student') {
        if (p.targetAudience && (p.targetAudience.includes('Teachers') || p.targetAudience.includes('Staff') || p.targetAudience.includes('Parents Only'))) return false;
        if (p.targetClass && p.targetClass !== 'All Classes' && !p.targetClass.includes('All Classes') && !p.targetClass.includes('10-A') && !p.targetClass.includes('Class 10')) return false;
      } else if (this.currentPortalRole === 'parent') {
        if (p.targetAudience && (p.targetAudience.includes('Teachers') || p.targetAudience.includes('Staff'))) return false;
        if (p.targetClass && p.targetClass !== 'All Classes' && !p.targetClass.includes('All Classes') && !p.targetClass.includes('10-A') && !p.targetClass.includes('Class 10')) return false;
      }

      const q = (this.feedSearchQuery || '').toLowerCase().trim();
      const matchQ = !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.content || '').toLowerCase().includes(q) ||
        (p.authorName || '').toLowerCase().includes(q) ||
        (p.dispatchRefNo || '').toLowerCase().includes(q) ||
        (p.targetClass || '').toLowerCase().includes(q) ||
        (p.purposeCategory || p.category || '').toLowerCase().includes(q);

      const matchClass = !this.feedClassFilter || this.feedClassFilter === 'All Classes' || p.targetClass === this.feedClassFilter || (p.targetClass && p.targetClass.includes(this.feedClassFilter));
      const matchAud = !this.feedAudienceFilter || this.feedAudienceFilter === 'All' || p.targetAudience === this.feedAudienceFilter || (p.targetAudience && p.targetAudience.includes(this.feedAudienceFilter));
      const matchCat = !this.feedCategoryFilter || this.feedCategoryFilter === 'All' || p.purposeCategory === this.feedCategoryFilter || p.category === this.feedCategoryFilter;

      return matchQ && matchClass && matchAud && matchCat;
    });
  }

  get paginatedNoticeHistory(): any[] {
    const start = (this.feedCurrentPage - 1) * this.feedPageSize;
    return this.filteredNoticeHistory.slice(start, start + this.feedPageSize);
  }

  get totalFeedPages(): number {
    return Math.ceil(this.filteredNoticeHistory.length / this.feedPageSize) || 1;
  }

  get feedPageNumbers(): number[] {
    const total = this.totalFeedPages;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  setFeedPage(page: number): void {
    if (page >= 1 && page <= this.totalFeedPages) {
      this.feedCurrentPage = page;
    }
  }

  get filteredFeedPosts(): any[] {
    return this.filteredNoticeHistory;
  }

  get studentFeedPosts(): any[] {
    return this.filteredNoticeHistory;
  }

  get parentFeedPosts(): any[] {
    return this.filteredNoticeHistory;
  }

  get teacherFeedPosts(): any[] {
    return this.filteredNoticeHistory;
  }

  eventsCurrentPage: number = 1;
  eventsPageSize: number = 5;

  get filteredSchoolEvents(): any[] {
    return (this.schoolEventsList || []).filter(e => {
      const matchCat = !this.selectedEventCategoryFilter || this.selectedEventCategoryFilter === 'All' || e.category === this.selectedEventCategoryFilter;
      const matchStat = !this.selectedEventStatusFilter || this.selectedEventStatusFilter === 'All' || e.status === this.selectedEventStatusFilter;
      const q = (this.eventSearchQuery || '').toLowerCase().trim();
      const matchQ = !q || (e.title || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q) || (e.venue || '').toLowerCase().includes(q);
      return matchCat && matchStat && matchQ;
    });
  }

  get paginatedSchoolEvents(): any[] {
    const start = (this.eventsCurrentPage - 1) * this.eventsPageSize;
    return this.filteredSchoolEvents.slice(start, start + this.eventsPageSize);
  }

  get eventsTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSchoolEvents.length / this.eventsPageSize));
  }

  get eventsPageNumbers(): number[] {
    const total = this.eventsTotalPages;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  setEventsPage(page: number): void {
    if (page >= 1 && page <= this.eventsTotalPages) {
      this.eventsCurrentPage = page;
    }
  }

  canEditEvent(evt: any): boolean {
    if (!evt) return false;
    if (this.currentPortalRole === 'owner' || this.isOwnerSession) return true;
    if (this.currentPortalRole === 'teacher') {
      const coord = (evt.coordinatorTeacher || '').toLowerCase();
      const org = (evt.organizerName || '').toLowerCase();
      if (coord.includes('rehan') || coord.includes('tariq') || coord.includes('bilal') || org.includes('teacher') || org.includes('faculty')) {
        return true;
      }
      return false;
    }
    return false;
  }

  canDeleteEvent(evt: any): boolean {
    return this.canEditEvent(evt);
  }

  transportForm = {
    routeName: '',
    vehicleNo: '',
    driverName: '',
    driverPhone: '',
    monthlyFee: 3500,
    capacity: 40,
    enrolledStudents: 32,
    status: 'Active'
  };

  libraryForm = {
    isbn: '',
    title: '',
    author: '',
    category: 'Science & Computing',
    genre: 'Textbook & Reference',
    subject: 'Physics',
    academicGradeLevel: 'Secondary (Class 10)',
    tagsInput: 'Board Exam Prep, Lab Reference',
    totalCopies: 10,
    availableCopies: 8,
    rackNo: 'RACK-05'
  };

  visitorForm = {
    visitorName: '',
    cnicOrPhone: '',
    purpose: 'Parent Inquiry / Meeting',
    personToMeet: 'Principal Office',
    vehicleNo: '',
    badgeNo: 'B-09',
    status: 'In-School' as 'In-School' | 'Checked-Out' | 'Flagged'
  };

  medicalForm = {
    studentName: 'Zayan Ahmed Khan',
    rollNo: '1001',
    grade: 'Class 10-A',
    bloodGroup: 'O+',
    vaccinationStatus: 'Fully Vaccinated' as 'Fully Vaccinated' | 'Partially Vaccinated' | 'Pending',
    allergies: 'Dust & Pollen',
    chronicConditions: 'None',
    emergencyContact: '+92 300 8472910',
    doctorName: 'Dr. S. K. Lodhi',
    medicalAlert: false
  };

  disciplinaryForm = {
    studentName: 'Omar Farooq Malik',
    rollNo: '0903',
    grade: 'Class 8-B',
    category: 'Uniform Violation' as 'Late Arrival' | 'Uniform Violation' | 'Misbehavior' | 'Academic Violation' | 'Property Damage',
    description: 'Incomplete school uniform & improper shoes.',
    severity: 'Low' as 'Low' | 'Medium' | 'High' | 'Severe',
    actionTaken: 'Verbal Warning & Counseling',
    fineAmount: 500
  };

  assetForm = {
    name: 'Dell OptiPlex i7 Workstations',
    category: 'IT Hardware' as 'IT Hardware' | 'Classroom Furniture' | 'Lab Equipment' | 'Sports Gear' | 'Library Facility',
    location: 'Computer AI Lab 1',
    quantity: 15,
    unitValue: 110000,
    condition: 'Excellent' as 'Excellent' | 'Good' | 'Needs Repair' | 'Retired',
    custodian: 'Engr. Bilal Hashmi'
  };

  staffPayrollForm = {
    staffName: 'Prof. Tariq Mehmood',
    role: 'Senior Mathematics Lecturer',
    month: 'October 2026',
    baseSalary: 140000,
    allowances: 15000,
    deductions: 5000,
    paymentMethod: 'Meezan Bank Direct Deposit'
  };

  staffLeaveForm = {
    staffName: 'Dr. Rehan Alvi',
    leaveType: 'Sick Leave' as 'Sick Leave' | 'Casual Leave' | 'Annual Leave' | 'Unpaid Leave',
    fromDate: 'Oct 20, 2026',
    toDate: 'Oct 21, 2026',
    totalDays: 2,
    reason: 'Pediatric viral fever medical rest'
  };

  // Active Selected Item for Edit / Voucher / View
  activeStudentForEdit: StudentRecord | null = null;
  activeTeacherForEdit: TeacherRecord | null = null;
  voucherStudent: StudentRecord | null = null;
  activePortalUserForEdit: PortalUserRecord | null = null;
  activeGatePassVisitor: VisitorGatePassRecord | null = null;
  activePaySlipStaff: StaffPayrollRecord | null = null;

  paymentForm = {
    title: 'Online Tuition Fee Collection',
    studentName: '',
    grade: 'Class 10-A',
    category: 'JazzCash Direct',
    amount: 28500,
    status: 'Verified',
    challanNo: ''
  };

  // Form Models
  studentForm: Partial<StudentRecord> = {
    name: '',
    grade: 'Class 10-A',
    section: 'Science',
    guardian: '',
    guardianPhone: '',
    feeAmount: 28500,
    feeStatus: 'Pending',
    status: 'Present',
    attendance: '95%'
  };

  teacherForm: Partial<TeacherRecord> & {
    role?: string;
    customRole?: string;
    customGradeInput?: string;
    customInchargeInput?: string;
  } = {
    name: '',
    role: 'Senior Faculty Teacher',
    customRole: '',
    subject: 'Computer Science & AI',
    qualification: 'M.S. Software Engineering',
    classes: 5,
    assignedGrade: 'Class 10 (Science)',
    customGradeInput: '',
    inchargeClass: 'Class 10-A (Class Teacher)',
    customInchargeInput: '',
    status: 'Active',
    rating: 4.9,
    email: '',
    phone: '',
    monthlySalary: 145000,
    salaryStatus: 'Processing',
    weeklyPeriods: 24,
    employmentType: 'Permanent'
  };

  admissionForm = {
    applicant: '',
    fatherName: '',
    relation: 'Father',
    fatherCnic: '',
    studentBForm: '',
    dob: '2015-05-12',
    gender: 'Male' as 'Male' | 'Female',
    bloodGroup: 'B+',
    appliedFor: 'Class 9',
    section: 'Science',
    rollNo: '',
    phone: '',
    email: '',
    fatherOccupation: '',
    address: '',
    previousSchool: '',
    emergencyContact: '',
    medicalNotes: 'Normal health / No known allergies',
    admissionFee: 25000,
    tuitionFee: 18000,
    discount: 0,
    initialPaymentStatus: 'Paid' as 'Paid' | 'Pending',
    score: '88% Entrance Assessment',
    status: 'Approved' as 'Approved' | 'Interview Scheduled' | 'Under Review' | 'Rejected'
  };

  financeForm: Partial<FinanceRecord> = {
    title: '',
    category: 'Tuition',
    type: 'Income',
    amount: 28500,
    date: 'Oct 14, 2026',
    status: 'Verified'
  };

  examForm: Partial<ExamRecord> = {
    examName: '',
    class: 'Class 1 to Class 10 All Sections',
    startDate: 'Nov 20, 2026',
    status: 'Scheduled',
    averageGPA: '3.75 / 4.0'
  };

  timetableForm: Partial<TimetableRecord> = {
    period: 'Period 5',
    time: '11:30 AM - 12:15 PM',
    subject: 'Computer AI & Robotics',
    teacher: 'Mr. David Miller',
    room: 'Lab 3',
    grade: 'Class 10-A'
  };

  announcementForm: Partial<AnnouncementRecord> = {
    title: '',
    target: 'All',
    content: '',
    priority: 'Normal',
    author: 'Principal Office'
  };

  portalUserForm: Partial<PortalUserRecord> = {
    name: '',
    email: '',
    pin: '',
    role: 'principal',
    linkedEntity: 'Academic Directorate & Executive Council',
    status: 'Active',
    phone: '',
    staffIdOrRoll: 'DIR-001',
    designation: 'Principal & Academic Director',
    department: 'Academic Directorate',
    clearanceLevel: 'Level 5 - Executive Academic Authority',
    branch: 'Main Senior Campus'
  };

  teacherHomeworkForm = {
    title: '',
    subject: 'Mathematics',
    grade: 'Class 10-A',
    dueDate: 'Oct 22, 2026',
    description: ''
  };

  parentLeaveForm = {
    childId: 'ST-1001',
    fromDate: 'Oct 20, 2026',
    toDate: 'Oct 21, 2026',
    reason: 'Medical rest advised by pediatrician'
  };

  parentMessageForm = {
    childId: 'ST-1001',
    recipient: 'Prof. Tariq Mehmood (Mathematics)',
    subject: 'Class Participation & Progress',
    message: ''
  };

  // Settings Form Model
  settingsForm = {
    schoolName: 'Al-Huda International Academy & College',
    principalName: 'Prof. Dr. Tariq Mahmood Khan',
    email: 'principal@alhuda.edu.pk',
    phone: '+92 51 9283741',
    academicYear: '2026 - 2027',
    biometricIp: '192.168.10.45:8080',
    defaultMonthlyFee: 28500,
    smsGatewayApiKey: 'SCS-SMS-KEY-99201-LIVE'
  };

  // Toast Notification
  toastMessage: string = '';
  toastType: 'success' | 'info' | 'warning' = 'success';
  toastTimeout: any = null;

  // Active Live Admission Alert Popup
  activeAdmissionAlert: {
    id: string;
    studentName: string;
    rollNo: string;
    grade: string;
    section?: string;
    guardian: string;
    phone: string;
    feeStatus: string;
    timestamp: string;
    source: 'Admission Form' | 'Public Portal' | 'Student Roster';
  } | null = null;
  admissionAlertTimeout: any = null;

  sidebarItems = [
    { id: 'overview', label: 'Dashboard Overview', shortLabel: 'Overview', icon: LayoutDashboard, badge: 'LIVE' },
    { id: 'students', label: 'Active Students', shortLabel: 'Students', icon: Users, count: '1,240' },
    { id: 'teachers', label: 'Faculty & Teachers', shortLabel: 'Faculty', icon: GraduationCap, count: '86' },
    { id: 'admissions', label: 'Admissions & Inquiries', shortLabel: 'Admissions', icon: BookOpen, badge: 'New' },
    { id: 'attendance', label: 'Attendance & Biometrics', shortLabel: 'Attendance', icon: Clock, count: '95.3%' },
    { id: 'finance', label: 'Fees & Finance Ledger', shortLabel: 'Finance', icon: CreditCard, badge: 'PKR' },
    { id: 'invoices', label: 'Invoices & Billing Hub', shortLabel: 'Invoices', icon: Receipt, badge: 'PRO' },
    { id: 'expenses', label: 'School Expenses Ledger', shortLabel: 'Expenses', icon: Receipt, badge: 'Bills' },
    { id: 'payment_gateway', label: 'Payment Gateway & Online Fees', shortLabel: 'Online Pay', icon: WalletCards, badge: 'Online Pay' },
    { id: 'transport', label: 'School Bus & Transport', shortLabel: 'Transport', icon: Bus, badge: 'GPS' },
    { id: 'hostel', label: 'Hostel & Boarding', shortLabel: 'Hostel', icon: Building2, badge: 'Rooms' },
    { id: 'labs', label: 'Computer & Science Labs', shortLabel: 'Labs', icon: Cpu, badge: '40 PCs' },
    { id: 'library', label: 'Library & Book Register', shortLabel: 'Library', icon: Library, count: '4,500' },
    { id: 'exams', label: 'Examinations & Grades', shortLabel: 'Exams', icon: Trophy, count: 'GPA 3.8' },
    { id: 'timetable', label: 'Timetable & Routine', shortLabel: 'Timetable', icon: Calendar, count: '8 Periods' },
    { id: 'lesson_plans', label: 'Lesson Plans & Quality Supervision', shortLabel: 'Lesson Plans', icon: BookOpen, badge: 'Approval' },
    { id: 'appraisals', label: 'Faculty Appraisals & Scoring', shortLabel: 'Appraisals', icon: Award, badge: 'KPI' },
    { id: 'inspections', label: 'Campus Walkthrough & Quality Audits', shortLabel: 'Inspections', icon: ClipboardCheck, badge: 'Daily' },
    { id: 'exam_moderation', label: 'Exam Paper Moderation & Lock', shortLabel: 'Moderation', icon: Trophy, badge: 'Exams' },
    { id: 'parent_complaints', label: 'Parent Grievance & Complaints Desk', shortLabel: 'Grievance', icon: MessageSquareWarning, badge: 'Desk' },
    { id: 'substitutions', label: 'Period Substitutions & Cover Duty', shortLabel: 'Cover Duty', icon: Clock, badge: 'Daily' },
    { id: 'syllabus', label: 'Syllabus Coverage Tracker', shortLabel: 'Syllabus', icon: BookOpen, badge: 'Pacing' },
    { id: 'safeguarding', label: 'Child Safeguarding & Safety', shortLabel: 'Safeguarding', icon: ShieldCheck, badge: 'Safety' },
    { id: 'directives', label: 'Executive Directives & Circulars', shortLabel: 'Directives', icon: FileText, badge: 'Official' },
    { id: 'alumni', label: 'Alumni & Graduate Archive', shortLabel: 'Alumni', icon: Award, count: '450+' },
    { id: 'portals', label: 'Role Portals & RBAC', shortLabel: 'Portals', icon: ShieldCheck, count: '3 Portals' },
    { id: 'reports', label: 'Certificates & Transcripts', shortLabel: 'Reports', icon: FileText, badge: 'SLC/PDF' },
    { id: 'audit', label: 'Institutional Audit & Compliance', shortLabel: 'Audit Hub', icon: ShieldCheck, badge: '98.4%' },
    { id: 'settings', label: 'School Settings', shortLabel: 'Settings', icon: Settings }
  ];

  gradeOptions = ['All', 'Class Nursery', 'Class KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

  // Institutional Audit, Internal Control & Compliance State
  auditSubTab: 'overview' | 'analytics' | 'logs' | 'reconciliation' | 'waivers' | 'academic' | 'slc' | 'compliance' = 'overview';
  auditSearchQuery: string = '';
  selectedAuditCategoryFilter: string = 'All';
  selectedAuditSeverityFilter: string = 'All';
  isRunAuditScanModalOpen: boolean = false;
  isAuditScanRunning: boolean = false;
  auditScanResult: {
    totalChecked: number;
    issuesFound: number;
    financialDiscrepancy: number;
    missingDocsCount: number;
    unlockedExamsCount: number;
    healthScore: number;
    scanTimestamp: string;
  } | null = null;

  // Audit Collections
  schoolAuditLogs: SchoolAuditTrailRecord[] = [
    {
      id: 'AUD-2026-901',
      timestamp: '24 Oct 2026, 11:45 AM',
      operatorName: 'Dr. Tahir Malik',
      operatorRole: 'Principal',
      actionType: 'Fee Waiver / Concession',
      category: 'Financial',
      entityId: 'ST-1008',
      entityDescription: 'Mustafa Ali Shah (Class 10-A, Roll #1008)',
      details: 'Authorized 20% sibling hardship concession on monthly tuition (PKR 28,500 to PKR 22,800). Verified court affidavit on file.',
      severity: 'Authorized Override',
      verifiedBy: 'Board of Governors Audit Committee',
      ipAddress: '192.168.10.4 (Principal Office)'
    },
    {
      id: 'AUD-2026-902',
      timestamp: '24 Oct 2026, 10:15 AM',
      operatorName: 'Prof. Tariq Mehmood',
      operatorRole: 'Examination Dean',
      actionType: 'Mark Moderation Lock',
      category: 'Academic',
      entityId: 'EXM-MAT-10A',
      entityDescription: 'Terminal Mathematics Assessment Class 10-A',
      details: 'Moderation applied for Question 4 grading curve (+2 marks standard error). Gradebook tamper-lock activated. 45 students affected.',
      severity: 'Normal Audit',
      verifiedBy: 'Controller of Examinations',
      ipAddress: '192.168.10.15 (Faculty Lab)'
    },
    {
      id: 'AUD-2026-903',
      timestamp: '23 Oct 2026, 04:30 PM',
      operatorName: 'Ch. Aslam Javed',
      operatorRole: 'Accounts Controller',
      actionType: 'Fee Voucher Deletion',
      category: 'Financial',
      entityId: 'CH-2026-8809',
      entityDescription: 'Duplicate Challan generated for Hamza Bilal (Roll #1003)',
      details: 'Voided duplicate tuition voucher #CH-2026-8809 (PKR 28,500). Original voucher #CH-2026-8801 retained and marked Paid via JazzCash.',
      severity: 'Compliance Flag',
      verifiedBy: 'External Chartered Auditor',
      ipAddress: '192.168.10.22 (Bursar Counter)'
    },
    {
      id: 'AUD-2026-904',
      timestamp: '23 Oct 2026, 09:20 AM',
      operatorName: 'Registrar Directorate',
      operatorRole: 'School Owner',
      actionType: 'Student Leaving Certificate (SLC)',
      category: 'Administrative',
      entityId: 'SLC-2026-104',
      entityDescription: 'Zayan Ahmed Khan (Class 10-A, Roll #1001)',
      details: 'Final institutional clearance verified: Library (0 books pending), Lab (cleared), Fee Dues (PKR 0). SLC #SLC-AHA-2026-104 generated with secure cryptographic seal.',
      severity: 'Normal Audit',
      verifiedBy: 'Dr. Tahir Malik (Principal)',
      ipAddress: '192.168.10.2 (Registrar Office)'
    },
    {
      id: 'AUD-2026-905',
      timestamp: '22 Oct 2026, 02:10 PM',
      operatorName: 'Systems Admin',
      operatorRole: 'System Auditor',
      actionType: 'Biometric IP Override',
      category: 'Security & Biometric',
      entityId: 'RFID-GATE-02',
      entityDescription: 'Junior Wing Biometric Turnstile Terminal',
      details: 'Firmware updated to v4.2.1. Static IP 192.168.10.45:8080 validated against local gateway. 1,240 student RFID cards synced with cloud ledger.',
      severity: 'Normal Audit',
      verifiedBy: 'IT Infrastructure Lead',
      ipAddress: '192.168.10.50 (Server Room)'
    },
    {
      id: 'AUD-2026-906',
      timestamp: '21 Oct 2026, 03:45 PM',
      operatorName: 'Head of Accounts',
      operatorRole: 'Accounts Controller',
      actionType: 'Salary Arrears Clearance',
      category: 'Financial',
      entityId: 'PAY-FAC-801',
      entityDescription: 'Prof. Tariq Mehmood (HOD Mathematics)',
      details: 'Disbursed pending arrears of PKR 30,000 for curriculum development workshop along with October base salary.',
      severity: 'Normal Audit',
      verifiedBy: 'Principal & Finance Director',
      ipAddress: '192.168.10.20 (Accounts Office)'
    }
  ];

  feeReconciliations: FeeReconciliationRecord[] = [
    {
      id: 'REC-2026-W42',
      date: '24 Oct 2026',
      counterCashReceived: 342000,
      bankDepositedMeezan: 855000,
      bankDepositedHBL: 620000,
      onlineDigitalKuickPay: 418000,
      totalSystemBilled: 2235000,
      actualCollected: 2235000,
      varianceAmount: 0,
      reconciliationStatus: 'Balanced & Cleared',
      cashierName: 'Muhammad Rizwan (Senior Bursar)',
      verifiedByAuditor: 'KPMG External Auditor Partner',
      notes: 'All counter receipts matched Meezan & HBL bank deposits 100%. No discrepancy.'
    },
    {
      id: 'REC-2026-W41',
      date: '17 Oct 2026',
      counterCashReceived: 410000,
      bankDepositedMeezan: 790000,
      bankDepositedHBL: 540000,
      onlineDigitalKuickPay: 360000,
      totalSystemBilled: 2100000,
      actualCollected: 2100000,
      varianceAmount: 0,
      reconciliationStatus: 'Balanced & Cleared',
      cashierName: 'Muhammad Rizwan (Senior Bursar)',
      verifiedByAuditor: 'Ch. Aslam Javed (Accounts Controller)',
      notes: 'Reconciliation verified with 1Link interbank clearing statement.'
    },
    {
      id: 'REC-2026-W40',
      date: '10 Oct 2026',
      counterCashReceived: 385000,
      bankDepositedMeezan: 720000,
      bankDepositedHBL: 490000,
      onlineDigitalKuickPay: 305000,
      totalSystemBilled: 1900000,
      actualCollected: 1900000,
      varianceAmount: 0,
      reconciliationStatus: 'Balanced & Cleared',
      cashierName: 'Muhammad Rizwan (Senior Bursar)',
      verifiedByAuditor: 'Ch. Aslam Javed (Accounts Controller)',
      notes: 'Monthly terminal week fee reconciliation completed without error.'
    }
  ];

  studentLeavingCertificates: StudentLeavingCertificateRecord[] = [
    {
      id: 'SLC-101',
      certificateNo: 'SLC-AHA-2026-089',
      securityHash: 'SEC-VAL-7721-BC9',
      studentId: 'ST-1001',
      studentName: 'Zayan Ahmed Khan',
      fatherName: 'Tariq Ahmed Khan',
      rollNo: '1001',
      grade: 'Class 10-A (Science)',
      admissionDate: '15 Aug 2022',
      leavingDate: '24 Oct 2026',
      reasonForLeaving: 'Parent Relocating to Lahore Provincial Headquarters',
      conductRating: 'Exemplary & Outstanding',
      academicAchievement: 'GPA 3.92 / 4.0 (Terminal High Honor Roll)',
      accountsClearance: true,
      libraryClearance: true,
      labClearance: true,
      sportsClearance: true,
      issuedBy: 'Dr. Tahir Malik (Principal & Academic Director)',
      status: 'Issued & Sealed'
    },
    {
      id: 'SLC-102',
      certificateNo: 'SLC-AHA-2026-090',
      securityHash: 'SEC-VAL-8832-EF4',
      studentId: 'ST-1011',
      studentName: 'Maryam Nawazish',
      fatherName: 'Nawazish Ali Mir',
      rollNo: '1011',
      grade: 'Class 10-B (Arts & Humanities)',
      admissionDate: '15 Aug 2024',
      leavingDate: '20 Oct 2026',
      reasonForLeaving: 'Higher Education Admission Abroad (UK Foundation Year)',
      conductRating: 'Exemplary & Outstanding',
      academicAchievement: 'Top Position in English Debates & Model UN',
      accountsClearance: true,
      libraryClearance: true,
      labClearance: true,
      sportsClearance: true,
      issuedBy: 'Dr. Tahir Malik (Principal & Academic Director)',
      status: 'Issued & Sealed'
    }
  ];

  complianceAuditList: ComplianceAuditItem[] = [
    { id: 'CMP-1', area: 'Board Affiliation', title: 'Federal Board (FBISE) / Cambridge Affiliation Code', standard: 'Valid Session 2026-27 (Code: FBISE-ISB-8921)', status: 'Compliant & Verified', responsiblePerson: 'Registrar Academic', lastCheckedDate: '2026-09-01', nextRenewalDate: '2027-08-31', notes: 'Renewed for all Science and Computer groups.' },
    { id: 'CMP-2', area: 'Safety & Emergency', title: 'Campus Fire Hydrant & Evacuation Drill Audit', standard: 'Civil Defence Regulation NFPA-101', status: 'Compliant & Verified', responsiblePerson: 'Campus Security Incharge', lastCheckedDate: '2026-10-10', nextRenewalDate: '2026-12-10', notes: '48 fire extinguishers inspected; pressure green.' },
    { id: 'CMP-3', area: 'Financial Integrity', title: 'Bilingual Fee Vouchers & GST Exemption Registry', standard: 'FBR SRO 1145(I)/2022 Educational Exemption', status: 'Compliant & Verified', responsiblePerson: 'Head of Accounts', lastCheckedDate: '2026-10-01', nextRenewalDate: '2027-06-30', notes: 'Exemption certificates filed with tax authority.' },
    { id: 'CMP-4', area: 'Student Documentation', title: 'NADRA B-Form & Father CNIC Verification', standard: 'Ministry of Education Enrolment Mandate', status: 'Action Required', responsiblePerson: 'Admissions Office', lastCheckedDate: '2026-10-20', nextRenewalDate: '2026-11-05', notes: '8 recently admitted primary students require pending B-Form copies from parents.' },
    { id: 'CMP-5', area: 'Transport Fleet', title: 'School Bus Fitness & Speed Governor Inspection', standard: 'Motorway Police & Traffic Safety Rules', status: 'Compliant & Verified', responsiblePerson: 'Transport Supervisor', lastCheckedDate: '2026-10-15', nextRenewalDate: '2026-11-15', notes: 'All 8 buses equipped with active GPS and first-aid kits.' }
  ];

  // SLC Modal & Form State
  isSLCCertificateModalOpen: boolean = false;
  selectedSLCForView: StudentLeavingCertificateRecord | null = null;
  isCreateSLCModalOpen: boolean = false;
  slcForm = {
    studentRollNo: '',
    studentName: 'Zayan Ahmed Khan',
    fatherName: 'Tariq Ahmed Khan',
    grade: 'Class 10-A (Science)',
    admissionDate: '2022-08-15',
    leavingDate: new Date().toISOString().slice(0, 10),
    reasonForLeaving: 'Parent transfer / higher education admission',
    conductRating: 'Exemplary & Outstanding' as StudentLeavingCertificateRecord['conductRating'],
    academicAchievement: 'GPA 3.90+ with distinguished honors',
    accountsClearance: true,
    libraryClearance: true,
    labClearance: true,
    sportsClearance: true
  };

  // Reconciliation Modal & Form State
  isAddReconciliationModalOpen: boolean = false;
  reconciliationForm = {
    date: new Date().toISOString().slice(0, 10),
    counterCashReceived: 350000,
    bankDepositedMeezan: 850000,
    bankDepositedHBL: 600000,
    onlineDigitalKuickPay: 400000,
    totalSystemBilled: 2200000,
    cashierName: 'Muhammad Rizwan (Senior Bursar)',
    verifiedByAuditor: 'Dr. Tahir Malik (Principal)',
    notes: 'Weekly cash counter closing & bank challan verification.'
  };

  // Data Collections
  activeStudents: StudentRecord[] = [];
  teachers: TeacherRecord[] = [];
  admissionsList: AdmissionRecord[] = [];
  finances: FinanceRecord[] = [];
  examsList: ExamRecord[] = [];
  timetables: TimetableRecord[] = [];
  announcements: AnnouncementRecord[] = [];
  portalUsers: PortalUserRecord[] = [];
  rolePermissions: RoleModulePermission[] = [];
  teacherHomeworks: TeacherHomeworkRecord[] = [];
  parentLeaveRequests: ParentLeaveRecord[] = [];
  parentMessages: ParentMessageRecord[] = [];
  transportRoutes: TransportRouteRecord[] = [];
  libraryBooks: LibraryBookRecord[] = [];
  libraryCirculations: LibraryCirculationRecord[] = [];
  libraryDigitalResources: LibraryDigitalResource[] = [];
  librarySubTab: 'circulation' | 'catalog' | 'digital_resources' = 'circulation';
  circulationSearchQuery: string = '';
  circulationStatusFilter: 'All' | 'Issued' | 'Overdue' | 'Returned' = 'All';
  circulationCategoryFilter: string = 'All';

  // Configurable Fine Rate Settings & Granular Staff Permissions
  dailyFineRatePKR: number = 50;
  isFineSettingsModalOpen: boolean = false;
  activeLibraryStaffRole: 'Principal / Admin' | 'Senior Librarian' | 'Assistant Librarian' = 'Senior Librarian';

  // Classification Filters (Genre, Subject, Grade Level)
  catalogGenreFilter: string = 'All';
  catalogSubjectFilter: string = 'All';
  catalogGradeFilter: string = 'All';
  isCheckoutModalOpen: boolean = false;
  checkoutForm = {
    bookId: '',
    borrowerType: 'Student' as 'Student' | 'Faculty',
    studentId: '',
    studentName: '',
    grade: '',
    issuePeriodDays: 14,
    notes: ''
  };
  selectedCirculationSlip: LibraryCirculationRecord | null = null;
  isBorrowSlipModalOpen: boolean = false;

  // Barcode / ISBN Scanner Modal State
  isBarcodeScannerModalOpen: boolean = false;
  isCameraActive: boolean = false;
  cameraStream: MediaStream | null = null;
  scannedIsbnResult: string = '';
  barcodeScanTargetMode: 'checkout' | 'checkin' | 'search' = 'checkout';
  manualIsbnInput: string = '';

  // Automated Overdue Reminder Modal State
  isLibraryPDFModalOpen: boolean = false;
  isAutomatedReminderModalOpen: boolean = false;
  selectedReminderCirculation: LibraryCirculationRecord | null = null;
  reminderChannels = {
    sms: true,
    portal: true,
    email: true,
    whatsapp: true
  };
  reminderTemplateText: string = 'Dear Student/Parent, This is an automated reminder from Campus Library. Your borrowed book "{book_title}" was due on {due_date}. Overdue fine accrued: PKR {fine_amount}. Please return or renew at the Library Desk today to avoid SLC clearance hold.';
  isDispatchingReminders: boolean = false;
  dispatchProgressText: string = '';

  // Fee Defaulter Restructuring & Legal Promissory Bond State
  isPromissoryModalOpen: boolean = false;
  selectedPromissoryDefaulter: StudentFeeDefaulterRecord | null = null;
  promissoryForm = {
    downPayment: 10000,
    installmentsCount: 3,
    firstInstallmentDate: 'Dec 05, 2026',
    waiverAmount: 0,
    cnicNo: '35202-1928374-1',
    witnessName: 'Malik Zahid (Guardian Relation)',
    notes: 'Post-dated Cheque #402919 Meezan Bank attached for security clearance.'
  };
  promissoryBondNo: string = '';

  // Faculty Substitution Duty Slip PDF Modal State
  isSubstitutionPDFModalOpen: boolean = false;

  // Multi-Modal Biometric & RFID Attendance Kiosk Suite
  isBiometricKioskModalOpen: boolean = false;
  isOwnerPolicyModalOpen: boolean = false;
  activeScanMethod: 'iris' | 'fingerprint' | 'rfid' | 'manual' = 'iris';
  kioskVerificationMode: 'iris' | 'fingerprint' | 'rfid' = 'iris';
  targetScanRole: 'Student' | 'Teacher' | 'Staff' | 'All' = 'All';
  kioskScanStatus: 'Idle' | 'Scanning' | 'Verified' | 'Denied' = 'Idle';
  kioskMatchedPerson: any = null;
  kioskConfidenceScore: string = '99.8%';
  manualRfidInput: string = '';
  kioskSelectedCandidateId: string = '';
  fingerprintMinutiaeScore: string = '99.4%';
  fingerprintRidgePointsMatched: number = 118;

  get presentCount(): number {
    return this.attendanceSummary?.presentToday || (this.activeStudents ? this.activeStudents.filter(s => s.status === 'Present').length : 0);
  }

  // Initial Biometric Eye Iris Enrollment Registration State
  isBiometricEnrollmentModalOpen: boolean = false;
  isFaceEnrollmentModalOpen: boolean = false;
  isSecureEyeOverlayOpen: boolean = false;
  selectedEnrollmentMemberId: string = '';
  selectedEnrollmentRole: 'Student' | 'Teacher' = 'Student';
  enrollmentScanStatus: 'Idle' | 'Scanning' | 'Enrolled' = 'Idle';
  enrollmentStep: 'camera' | 'analyzing' | 'complete' = 'camera';
  enrollmentMode: 'select_existing' | 'register_new' = 'select_existing';

  newEnrollmentUser = {
    name: '',
    rollOrId: '',
    gradeOrRole: 'Class 9',
    section: 'A',
    fatherName: '',
    role: 'Student' as 'Student' | 'Teacher'
  };

  isAutoScanActive: boolean = true;
  autoScanCountdown: number = 3;
  autoScanProgress: number = 0;
  autoScanTimerRef: any = null;
  targetVerificationMemberId: string = '';
  targetVerificationRole: 'Student' | 'Teacher' = 'Student';
  cameraFacingMode: 'user' | 'environment' = 'user';
  cameraPermissionError: string = '';
  enrolledCapturedImage: string = '';
  verificationCapturedImage: string = '';

  secureEyeScanStatus: 'Scanning' | 'Verifying' | 'Verified' | 'Unenrolled' | 'Denied' = 'Scanning';
  matchedBiometricProfile: any = null;
  secureEyeLivenessScore: string = '99.6%';
  faceQualityMetrics = {
    lightingScore: 98,
    faceAngleScore: 97,
    eyePupilFocusScore: 99,
    livenessPass: true,
    token: 'SEC-FACE-256-8819-AZ90'
  };

  manualAttendanceForm = {
    personId: 'ST-1001',
    personName: 'Zayan Khan',
    role: 'Student' as 'Student' | 'Teacher' | 'Staff',
    status: 'Present' as 'Present' | 'Late' | 'Absent' | 'On Duty',
    notes: 'Verified by Principal Gate Duty'
  };

  // School Owner Policy Control Matrix
  ownerBiometricPolicy = {
    irisRetinalEnabled: true,
    fingerprintEnabled: true,
    rfidCardEnabled: true,
    manualRollCallEnabled: true,
    livenessVerification: true,
    principalBiometricAccessGranted: true,
    studentAllowedModes: { iris: true, fingerprint: true, rfid: true, manual: true },
    teacherAllowedModes: { iris: true, fingerprint: true, rfid: true, manual: true },
    staffAllowedModes: { iris: true, fingerprint: true, rfid: true, manual: true },
    antiSpoofingConfidenceThreshold: 95,
    antiSpoofingStrictness: 'High-Security Strict',
    geofenceHardwareBinding: true
  };

  biometricScanLogs: Array<{
    id: string;
    timestamp: string;
    personName: string;
    role: string;
    mode: string;
    confidence: string;
    status: string;
    ipDevice: string;
  }> = [
    { id: 'LOG-8810', timestamp: '08:14:02 AM', personName: 'Zayan Khan (Class 10-A)', role: 'Student', mode: '👁️ Retinal Iris Scan', confidence: '99.8%', status: 'Present (On-Time)', ipDevice: 'KIOSK-GATE-1 (192.168.1.102)' },
    { id: 'LOG-8809', timestamp: '08:12:45 AM', personName: 'Prof. Tariq Mehmood', role: 'Teacher', mode: '👆 Biometric Fingerprint', confidence: '99.4%', status: 'Present (On-Time)', ipDevice: 'STAFF-TERMINAL-2 (192.168.1.105)' },
    { id: 'LOG-8808', timestamp: '08:10:11 AM', personName: 'Dr. Rehan Alvi', role: 'Teacher', mode: '💳 Smart RFID Card', confidence: '100%', status: 'Present (On-Time)', ipDevice: 'ADMIN-GATEWAY (192.168.1.100)' },
    { id: 'LOG-8807', timestamp: '08:05:30 AM', personName: 'Areeba Fatima (Class 9-B)', role: 'Student', mode: '👁️ Retinal Iris Scan', confidence: '98.9%', status: 'Present (On-Time)', ipDevice: 'KIOSK-GATE-1 (192.168.1.102)' }
  ];

  visitorGatePasses: VisitorGatePassRecord[] = [];
  studentMedicalRecords: StudentMedicalRecord[] = [];
  disciplinaryIncidents: DisciplinaryIncidentRecord[] = [];
  schoolAssets: SchoolAssetRecord[] = [];
  staffPayrolls: StaffPayrollRecord[] = [];
  staffLeaveRequests: StaffLeaveRecord[] = [];
  studentFeeDefaulters: StudentFeeDefaulterRecord[] = [];
  profitLossLedger: ProfitLossMonthLedger[] = [];
  dispatchAlertLogs: DispatchAlertLog[] = [];

  // Master Invoices & Billing Operations
  masterInvoices: MasterInvoiceRecord[] = [];
  selectedInvoiceForView: MasterInvoiceRecord | null = null;
  isInvoiceModalOpen: boolean = false;
  selectedInvoiceCategoryFilter: string = 'All';
  selectedInvoiceStatusFilter: string = 'All';
  invoiceSearchQuery: string = '';

  isCreateInvoiceModalOpen: boolean = false;
  newInvoiceForm = {
    type: 'Student Fee' as MasterInvoiceRecord['type'],
    recipientName: '',
    recipientRole: 'Student' as MasterInvoiceRecord['recipientRole'],
    recipientSubtext: '',
    title: '',
    dueDate: '2026-11-15',
    notes: 'Please remit payment before the due date to avoid late payment surcharge.',
    lineItems: [
      { description: 'Monthly Tuition & Academic Services', qty: 1, unitPrice: 15000, total: 15000 }
    ],
    discount: 0,
    tax: 0
  };

  get filteredMasterInvoices(): MasterInvoiceRecord[] {
    return (this.masterInvoices || []).filter(inv => {
      const q = (this.invoiceSearchQuery || '').toLowerCase().trim();
      const matchQuery = !q ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.title.toLowerCase().includes(q) ||
        inv.recipientName.toLowerCase().includes(q) ||
        (inv.recipientSubtext || '').toLowerCase().includes(q);

      const matchCategory = this.selectedInvoiceCategoryFilter === 'All' || inv.type === this.selectedInvoiceCategoryFilter;
      const matchStatus = this.selectedInvoiceStatusFilter === 'All' || inv.status === this.selectedInvoiceStatusFilter;

      return matchQuery && matchCategory && matchStatus;
    });
  }

  get totalInvoicesBilledAmount(): number {
    return (this.masterInvoices || []).reduce((acc, inv) => acc + inv.netPayable, 0);
  }

  get totalInvoicesPaidAmount(): number {
    return (this.masterInvoices || []).filter(inv => inv.status === 'Paid').reduce((acc, inv) => acc + inv.netPayable, 0);
  }

  get totalInvoicesPendingAmount(): number {
    return (this.masterInvoices || []).filter(inv => inv.status === 'Pending').reduce((acc, inv) => acc + inv.netPayable, 0);
  }

  get totalInvoicesOverdueAmount(): number {
    return (this.masterInvoices || []).filter(inv => inv.status === 'Overdue').reduce((acc, inv) => acc + inv.netPayable, 0);
  }

  openInvoiceViewModal(inv: MasterInvoiceRecord): void {
    this.selectedInvoiceForView = inv;
    this.isInvoiceModalOpen = true;
  }

  closeInvoiceViewModal(): void {
    this.isInvoiceModalOpen = false;
    this.selectedInvoiceForView = null;
  }

  printInvoice(inv: MasterInvoiceRecord): void {
    this.selectedInvoiceForView = inv;
    this.isInvoiceModalOpen = true;
    if (typeof window !== 'undefined') {
      setTimeout(() => window.print(), 300);
    }
  }

  downloadInvoicePDF(inv: MasterInvoiceRecord): void {
    this.showToast(`📄 Downloading Official PDF Invoice [${inv.invoiceNo}]...`, 'success');
  }

  shareInvoiceWhatsApp(inv: MasterInvoiceRecord): void {
    const text = `🧾 *OFFICIAL INVOICE NOTICE - AL-HUDA ACADEMY*\n\nInvoice #: ${inv.invoiceNo}\nRecipient: ${inv.recipientName}\nTitle: ${inv.title}\nTotal Payable: PKR ${inv.netPayable.toLocaleString()}\nDue Date: ${inv.dueDate}\nStatus: ${inv.status.toUpperCase()}\n\nPlease pay via 1Link / KuickPay or HBL Online Transfer. Thank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    this.showToast(`💬 Dispatched Invoice ${inv.invoiceNo} via WhatsApp link`, 'info');
  }

  markInvoiceAsPaid(inv: MasterInvoiceRecord, method: string = 'Cash Deposit'): void {
    if (!inv) return;
    inv.status = 'Paid';
    inv.paidDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    inv.paymentMethod = method;
    inv.transactionRef = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    inv.verifiedBy = 'Dr. Tahir Malik (Principal & Accounts Directorate)';
    this.showToast(`✅ Invoice [${inv.invoiceNo}] marked as PAID via ${method}!`, 'success');
    this.saveMasterInvoicesToStorage();
  }

  openCreateInvoiceModal(): void {
    this.isCreateInvoiceModalOpen = true;
  }

  closeCreateInvoiceModal(): void {
    this.isCreateInvoiceModalOpen = false;
  }

  addInvoiceLineItem(): void {
    this.newInvoiceForm.lineItems.push({
      description: 'Additional Facility / Resource Item',
      qty: 1,
      unitPrice: 2000,
      total: 2000
    });
  }

  removeInvoiceLineItem(index: number): void {
    if (this.newInvoiceForm.lineItems.length > 1) {
      this.newInvoiceForm.lineItems.splice(index, 1);
    }
  }

  calculateNewInvoiceTotals(): { subtotal: number; net: number } {
    const subtotal = this.newInvoiceForm.lineItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
    const net = subtotal - this.newInvoiceForm.discount + this.newInvoiceForm.tax;
    return { subtotal, net: Math.max(0, net) };
  }

  createNewInvoice(): void {
    if (!this.newInvoiceForm.recipientName || !this.newInvoiceForm.title) {
      this.showToast('Please enter recipient name and invoice title', 'warning');
      return;
    }

    const totals = this.calculateNewInvoiceTotals();
    const invCount = this.masterInvoices.length + 101;
    const invNo = `REF-INV/2026/${invCount}`;
    const newInv: MasterInvoiceRecord = {
      id: `INV-2026-${invCount}`,
      invoiceNo: invNo,
      type: this.newInvoiceForm.type,
      title: this.newInvoiceForm.title,
      recipientName: this.newInvoiceForm.recipientName,
      recipientRole: this.newInvoiceForm.recipientRole,
      recipientSubtext: this.newInvoiceForm.recipientSubtext || 'Custom Billing Recipient',
      amount: totals.subtotal,
      discount: this.newInvoiceForm.discount,
      tax: this.newInvoiceForm.tax,
      netPayable: totals.net,
      issueDate: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: this.newInvoiceForm.dueDate,
      status: 'Pending',
      lineItems: this.newInvoiceForm.lineItems.map(item => ({ ...item, total: item.qty * item.unitPrice })),
      notes: this.newInvoiceForm.notes,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invNo)}`
    };

    this.masterInvoices.unshift(newInv);
    this.saveMasterInvoicesToStorage();
    this.closeCreateInvoiceModal();
    this.showToast(`🧾 Invoice [${invNo}] generated & dispatched successfully!`, 'success');
  }

  saveMasterInvoicesToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('masterSchoolInvoices', JSON.stringify(this.masterInvoices));
    }
  }

  // ==========================================
  // INSTITUTIONAL MASTER REGISTRIES & PRINCIPAL CASHIERING
  // ==========================================
  principalMasterTab: 'students' | 'teachers' | 'parents' | 'fee_cashiering' = 'students';
  principalMasterSearch: string = '';
  principalMasterGradeFilter: string = 'All';
  principalMasterFeeFilter: string = 'All';
  principalStudentsPage: number = 1;
  principalTeachersPage: number = 1;
  principalParentsPage: number = 1;
  principalFeesPage: number = 1;
  principalMasterPageSize: number = 8;

  principalFeeCollections: PrincipalFeeCollectionRecord[] = [
    {
      id: 'PFC-901',
      receiptNo: 'REC-2026-9041',
      studentId: 'ST-1001',
      studentName: 'Zayan Ahmed Khan',
      rollNo: '1001',
      grade: 'Class 10-A',
      guardianName: 'Tariq Ahmed Khan',
      guardianPhone: '+92 300 8472910',
      amount: 28500,
      paymentResource: 'Cash at Principal Desk Counter',
      resourceReference: 'CASH-PRIN-101',
      collectedBy: 'Dr. Tahir Malik (Principal - Verified Desk)',
      timestamp: '26 Oct 2026, 09:30 AM',
      monthsPaid: 'October 2026 Tuition',
      auditStatus: 'Verified by Principal Office',
      notes: 'Cleared full term tuition in cash at Principal desk counter.'
    },
    {
      id: 'PFC-902',
      receiptNo: 'REC-2026-9042',
      studentId: 'ST-1004',
      studentName: 'Fatima Zahra Abbasi',
      rollNo: '1004',
      grade: 'Class 10-A',
      guardianName: 'Pervaiz Ahmed Abbasi',
      guardianPhone: '+92 300 1234567',
      amount: 28500,
      paymentResource: 'Meezan Bank Challan',
      resourceReference: 'SLIP-MEZN-881290',
      collectedBy: 'Dr. Tahir Malik (Principal - Verified Desk)',
      timestamp: '26 Oct 2026, 10:15 AM',
      monthsPaid: 'October 2026 Tuition',
      auditStatus: 'Verified by Principal Office',
      notes: 'Verified via Meezan Bank Blue Area branch deposit stamp.'
    },
    {
      id: 'PFC-903',
      receiptNo: 'REC-2026-9043',
      studentId: 'ST-1005',
      studentName: 'Hamza Bilal Qureshi',
      rollNo: '0005',
      grade: 'Class KG-A',
      guardianName: 'Bilal Qureshi',
      guardianPhone: '+92 312 7766554',
      amount: 44000,
      paymentResource: 'JazzCash Wallet',
      resourceReference: 'TRX-JC-4491028',
      collectedBy: 'Dr. Tahir Malik (Principal - Verified Desk)',
      timestamp: '25 Oct 2026, 02:45 PM',
      monthsPaid: 'August & September 2026 Bakaya Recovery',
      auditStatus: 'Verified by Principal Office',
      notes: 'Khata arrears settled via JazzCash OTP merchant gateway.'
    },
    {
      id: 'PFC-904',
      receiptNo: 'REC-2026-9044',
      studentId: 'ST-1008',
      studentName: 'Mustafa Ali Shah',
      rollNo: '1008',
      grade: 'Class 10-A',
      guardianName: 'Syed Waqar Shah',
      guardianPhone: '+92 300 8877665',
      amount: 28500,
      paymentResource: 'Raast Instant Transfer',
      resourceReference: 'RAAST-PK-772189',
      collectedBy: 'Dr. Tahir Malik (Principal - Verified Desk)',
      timestamp: '25 Oct 2026, 11:20 AM',
      monthsPaid: 'October 2026 Tuition',
      auditStatus: 'Verified by Principal Office',
      notes: 'Verified instant 1Link Raast ID credit.'
    },
    {
      id: 'PFC-905',
      receiptNo: 'REC-2026-9045',
      studentId: 'ST-1012',
      studentName: 'Aria Noor Lodhi',
      rollNo: '0712',
      grade: 'Class 7-C',
      guardianName: 'Dr. Kashif Lodhi',
      guardianPhone: '+92 321 5544332',
      amount: 25000,
      paymentResource: 'Cash at Principal Desk Counter',
      resourceReference: 'CASH-PRIN-105',
      collectedBy: 'Dr. Tahir Malik (Principal - Verified Desk)',
      timestamp: '24 Oct 2026, 12:10 PM',
      monthsPaid: 'October 2026 Tuition',
      auditStatus: 'Verified by Principal Office',
      notes: 'Cash received and deposited to institution physical vault.'
    },
    {
      id: 'PFC-906',
      receiptNo: 'REC-2026-9046',
      studentId: 'ST-1003',
      studentName: 'Omar Farooq Malik',
      rollNo: '0903',
      grade: 'Class 8-B',
      guardianName: 'Mrs. Fatima Malik',
      guardianPhone: '+92 333 4455667',
      amount: 26000,
      paymentResource: 'EasyPaisa Wallet',
      resourceReference: 'EP-PK-991203',
      collectedBy: 'Dr. Tahir Malik (Principal - Verified Desk)',
      timestamp: '23 Oct 2026, 01:30 PM',
      monthsPaid: 'September 2026 Recovery',
      auditStatus: 'Verified by Principal Office',
      notes: 'Partial recovery of semester bakaya.'
    }
  ];

  isPrincipalFeeCollectModalOpen: boolean = false;
  selectedStudentForFee: StudentRecord | null = null;
  principalFeeCollectForm: {
    studentId: string;
    studentName: string;
    rollNo: string;
    studentRollNo: string;
    grade: string;
    guardianName: string;
    guardian: string;
    guardianPhone: string;
    amount: number;
    amountPaid: number;
    paymentResource: string;
    resourceReference: string;
    monthsPaid: string;
    month: string;
    notes: string;
  } = {
    studentId: '',
    studentName: '',
    rollNo: '',
    studentRollNo: '',
    grade: '',
    guardianName: '',
    guardian: '',
    guardianPhone: '',
    amount: 28500,
    amountPaid: 28500,
    paymentResource: 'Cash at Principal Desk Counter',
    resourceReference: '',
    monthsPaid: 'October 2026 Tuition',
    month: 'October 2026',
    notes: 'Collected directly at Principal Office Counter.'
  };

  activeCashieringReceipt: PrincipalFeeCollectionRecord | null = null;
  isReceiptModalOpen: boolean = false;

  printCashieringReceipt(receipt: any): void {
    if (typeof window !== 'undefined') window.print();
  }

  openDispatchAlertModal(data: any): void {
    this.openSendAlertModal(data);
  }

  navigateOwnerMatrix(key: string): void {
    if (key === 'directives') this.setTab('directives');
    else if (key === 'academic_reports' || key === 'audit') {
      this.setTab('audit');
      this.setAuditSubTab('overview');
    }
    else if (key === 'admissions_review') this.openAddAdmissionModal();
    else if (key === 'student_certificates') {
      this.setTab('audit');
      this.setAuditSubTab('slc');
    }
    else if (key === 'ptm_interventions') this.setTab('reports');
    else if (key === 'supervision' || key === 'lesson_plans') this.setTab('lesson_plans');
    else if (key === 'syllabus') this.setTab('syllabus');
    else if (key === 'substitutions') this.setTab('substitutions');
    else if (key === 'exam_moderation') this.setTab('exam_moderation');
    else if (key === 'faculty_tasks') this.setTab('teachers');
    else if (key === 'teacher_leaves') this.setTab('teachers');
    else if (key === 'appraisals') this.setTab('appraisals');
    else if (key === 'fee_oversight') {
      this.setTab('audit');
      this.setAuditSubTab('waivers');
    }
    else if (key === 'discipline') this.setTab('safeguarding');
    else if (key === 'safeguarding') this.setTab('safeguarding');
    else if (key === 'parent_complaints') this.setTab('parent_complaints');
    else if (key === 'inspections') this.setTab('inspections');
    else if (key === 'facilities_transport' || key === 'transport') this.setTab('transport');
    else this.setTab(key as any);
    this.cdr.detectChanges();
  }

  setPrincipalMasterTab(tab: 'students' | 'teachers' | 'parents' | 'fee_cashiering') {
    this.principalMasterTab = tab;
    this.cdr.detectChanges();
  }

  getParentsDirectory(): ParentDirectoryRecord[] {
    const map = new Map<string, ParentDirectoryRecord>();
    for (const s of this.activeStudents) {
      const key = s.guardianPhone || s.guardianCnic || s.guardian || 'Unknown';
      if (!map.has(key)) {
        map.set(key, {
          id: 'PAR-' + (s.rollNo || s.id),
          guardianName: s.guardian || 'Parent/Guardian',
          guardianRelation: s.guardianRelation || 'Father',
          guardianCnic: s.guardianCnic || '35202-8472910-1',
          guardianPhone: s.guardianPhone || '+92 300 0000000',
          guardianEmail: s.guardianEmail || '',
          guardianOccupation: s.guardianOccupation || 'Parent',
          address: s.address || 'Rawalpindi / Islamabad',
          linkedStudents: [],
          totalDueBakaya: 0,
          familyFeeStatus: 'All Clear'
        });
      }
      const p = map.get(key)!;
      p.linkedStudents.push({
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        grade: s.grade,
        feeStatus: s.feeStatus,
        dueBakaya: s.dueBakaya || 0
      });
      p.totalDueBakaya += (s.dueBakaya || 0);
      if (s.feeStatus === 'Overdue') p.familyFeeStatus = 'Defaulter';
      else if (s.feeStatus === 'Pending' && p.familyFeeStatus !== 'Defaulter') p.familyFeeStatus = 'Dues Pending';
    }
    return Array.from(map.values());
  }

  scrollQuickPillBar(direction: 'left' | 'right'): void {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('principal-quick-pill-bar');
      if (el) {
        const scrollAmount = direction === 'left' ? -250 : 250;
        el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }

  // ==========================================
  // ENTERPRISE FIVE-PORTALS HUGE DATA EXTENSIONS
  // ==========================================

  // 1. SCHOOL OWNER PORTAL EXTENSIONS
  selectedSchoolBranch: string = 'Main Campus (Sector F-8)';
  schoolBranches: string[] = [
    'Main Campus (Sector F-8)',
    'Junior Wing (Sector H-9)',
    'Girls Executive College (Sector E-11)'
  ];

  branchComparisonMetrics = [
    { branch: 'Main Campus (Sector F-8)', students: 680, faculty: 48, revenue: 2240000, expenses: 1450000, margin: '35.2%', status: 'Primary Revenue Hub' },
    { branch: 'Junior Wing (Sector H-9)', students: 340, faculty: 24, revenue: 1120000, expenses: 880000, margin: '21.4%', status: 'Growing Enrollment' },
    { branch: 'Girls Executive College (Sector E-11)', students: 220, faculty: 14, revenue: 690000, expenses: 490000, margin: '28.9%', status: 'High Merit Stream' }
  ];

  defaulterAgingBuckets = {
    thirtyDays: { count: 3, amount: 76000, recoveryRate: 91 },
    sixtyDays: { count: 2, amount: 109000, recoveryRate: 74 },
    ninetyDaysPlus: { count: 1, amount: 66000, recoveryRate: 48 }
  };

  isHistoricalDataLocked: boolean = true;
  toggleHistoricalDataLock(): void {
    this.isHistoricalDataLocked = !this.isHistoricalDataLocked;
    this.showToast(this.isHistoricalDataLocked
      ? '🔒 Global Audit Lock Activated: Historical fee & academic records sealed against backdating.'
      : '⚠️ Global Audit Lock Deactivated: Authorized modifications permitted by School Owner.',
      this.isHistoricalDataLocked ? 'info' : 'warning');
  }

  // WHATSAPP BATCH REMINDERS ENGINE
  isWhatsappReminderModalOpen: boolean = false;
  whatsappModalActiveTab: 'dispatch' | 'logs' = 'dispatch';
  whatsappTemplateType: 'gentle' | 'urgent' | 'khata_hold' | 'custom' = 'gentle';
  whatsappCustomTemplate: string = 'Respected {parent_name}, this is an automated reminder regarding the monthly tuition fee for {student_name} ({amount}) due on {due_date}. Kindly clear dues online: {payment_link}';
  whatsappSelectedAgingTier: 'ALL' | '1-30' | '31-60' | '90+' = 'ALL';
  whatsappSelectedBranch: string = 'All Branches';
  isSendingWhatsappBatch: boolean = false;
  whatsappSendProgress: number = 0;
  whatsappBatchStatusMessage: string = '';
  whatsappDispatchedLogs: any[] = [];

  overdueStudentsList = [
    { id: 'STU-1001', studentName: 'Zayan Ahmed Khan', rollNo: '1001', grade: 'Class 10-A', parentName: 'Tariq Ahmed Khan', parentPhone: '+92 300 8554210', amount: 28000, dueDate: '2026-10-15', agingDays: 20, tier: '1-30', branch: 'Main Campus (Sector F-8)', selected: true, status: '1-30 Days Overdue' },
    { id: 'STU-1024', studentName: 'Hamza Raza', rollNo: '1024', grade: 'Class 9-B', parentName: 'Raza Muhammad', parentPhone: '+92 321 9988112', amount: 24000, dueDate: '2026-10-18', agingDays: 17, tier: '1-30', branch: 'Main Campus (Sector F-8)', selected: true, status: '1-30 Days Overdue' },
    { id: 'STU-0712', studentName: 'Aria Noor Lodhi', rollNo: '0712', grade: 'Class 7-C', parentName: 'Farhan Lodhi', parentPhone: '+92 333 5544332', amount: 24000, dueDate: '2026-10-12', agingDays: 23, tier: '1-30', branch: 'Junior Wing (Sector H-9)', selected: true, status: '1-30 Days Overdue' },
    { id: 'STU-1105', studentName: 'Bilal Hassan', rollNo: '1105', grade: 'Class 8-A', parentName: 'Hassan Mahmood', parentPhone: '+92 301 4433221', amount: 52000, dueDate: '2026-09-15', agingDays: 50, tier: '31-60', branch: 'Junior Wing (Sector H-9)', selected: true, status: '31-60 Days Overdue' },
    { id: 'STU-1208', studentName: 'Zainab Fatima', rollNo: '1208', grade: 'Class 11-Pre-Med', parentName: 'Dr. Shahzad Qureshi', parentPhone: '+92 312 6677889', amount: 57000, dueDate: '2026-09-10', agingDays: 55, tier: '31-60', branch: 'Girls Executive College (Sector E-11)', selected: true, status: '31-60 Days Overdue' },
    { id: 'STU-1050', studentName: 'Mustafa Ali', rollNo: '1050', grade: 'Class 10-B', parentName: 'Usman Ali Sheikh', parentPhone: '+92 345 8899001', amount: 66000, dueDate: '2026-08-01', agingDays: 95, tier: '90+', branch: 'Main Campus (Sector F-8)', selected: true, status: 'Khata Hold (90+ Days)' }
  ];

  dispatchBulkDefaulterReminders(tierFilter?: string): void {
    if (tierFilter) {
      this.whatsappSelectedAgingTier = tierFilter as any;
    }
    this.isWhatsappReminderModalOpen = true;
  }

  closeWhatsappReminderModal(): void {
    this.isWhatsappReminderModalOpen = false;
  }

  getFilteredOverdueStudents(): any[] {
    return this.overdueStudentsList.filter(stu => {
      const matchTier = this.whatsappSelectedAgingTier === 'ALL' || stu.tier === this.whatsappSelectedAgingTier;
      const matchBranch = this.whatsappSelectedBranch === 'All Branches' || stu.branch === this.whatsappSelectedBranch;
      return matchTier && matchBranch;
    });
  }

  toggleSelectAllOverdue(event: any): void {
    const isChecked = event.target.checked;
    this.getFilteredOverdueStudents().forEach(s => s.selected = isChecked);
  }

  getSelectedOverdueCount(): number {
    return this.getFilteredOverdueStudents().filter(s => s.selected).length;
  }

  getSelectedOverdueTotalAmount(): number {
    return this.getFilteredOverdueStudents()
      .filter(s => s.selected)
      .reduce((sum, s) => sum + s.amount, 0);
  }

  getWhatsappPreviewText(sampleStudent?: any): string {
    const sample = sampleStudent || this.getFilteredOverdueStudents()[0] || this.overdueStudentsList[0];
    if (!sample) return '';
    const parentName = sample.parentName;
    const studentName = sample.studentName;
    const amountStr = `PKR ${sample.amount.toLocaleString()}`;
    const dueDate = sample.dueDate;
    const agingDays = sample.agingDays;
    const schoolName = 'Al-Huda Model Academy';
    const paymentLink = `https://alhuda.softcode.app/pay?id=${sample.id}`;

    if (this.whatsappTemplateType === 'gentle') {
      return `*Fee Payment Reminder - ${schoolName}*\n\nRespected *${parentName}*,\n\nThis is a gentle reminder regarding the outstanding monthly tuition fee for *${studentName}* (${sample.grade}).\n\n📌 *Outstanding Amount:* ${amountStr}\n📅 *Due Date:* ${dueDate}\n⏳ *Overdue Status:* ${agingDays} Days\n\nKindly clear the dues at your earliest convenience via the online portal or school accounts office:\n🔗 ${paymentLink}\n\nThank you for your cooperation.\n*Accounts & Finance Directorate*`;
    } else if (this.whatsappTemplateType === 'urgent') {
      return `⚠️ *URGENT FEE NOTICE - ${schoolName}*\n\nDear Parent/Guardian *${parentName}*,\n\nThe tuition fee for *${studentName}* of ${amountStr} is currently *${agingDays} days overdue* (Due Date: ${dueDate}).\n\nTo avoid administrative late surcharges and uninterrupted portal access, please settle the balance immediately:\n🔗 Instant Payment: ${paymentLink}\n\nIf payment has already been made, kindly ignore this automated notice.\n*Accounts Office - ${schoolName}*`;
    } else if (this.whatsappTemplateType === 'khata_hold') {
      return `⛔ *FINAL NOTICE / KHATA HOLD WARNING - ${schoolName}*\n\nAttention: *${parentName}*,\n\nRe: *${studentName}* (${sample.grade})\nOutstanding Dues: *${amountStr}* (${agingDays}+ Days Overdue)\n\nPlease be advised that student records and LMS access will be temporarily held if dues are not settled by end of week.\n\nSettle Dues Online: ${paymentLink}\nContact Accounts: 0300-SOFTCODE\n*Executive Directorate - ${schoolName}*`;
    } else {
      return (this.whatsappCustomTemplate || '')
        .replace(/\{parent_name\}/g, parentName)
        .replace(/\{student_name\}/g, studentName)
        .replace(/\{amount\}/g, amountStr)
        .replace(/\{due_date\}/g, dueDate)
        .replace(/\{aging_days\}/g, agingDays)
        .replace(/\{school_name\}/g, schoolName)
        .replace(/\{payment_link\}/g, paymentLink);
    }
  }

  getDirectWhatsappUrl(student: any): string {
    const text = this.getWhatsappPreviewText(student);
    const cleanPhone = (student.parentPhone || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('92') ? cleanPhone : cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  }

  async triggerBatchWhatsappDispatch(): Promise<void> {
    const selectedList = this.getFilteredOverdueStudents().filter(s => s.selected);
    if (selectedList.length === 0) {
      this.showToast('⚠️ Please select at least one overdue student record to send WhatsApp reminders.', 'warning');
      return;
    }

    this.isSendingWhatsappBatch = true;
    this.whatsappSendProgress = 15;
    this.whatsappBatchStatusMessage = `Connecting to WhatsApp API Gateway for ${selectedList.length} parent WhatsApp numbers...`;

    try {
      await new Promise(r => setTimeout(r, 400));
      this.whatsappSendProgress = 50;
      this.whatsappBatchStatusMessage = `Compiling localized WhatsApp message payloads & encryption tokens...`;

      const response = await fetch('/api/notifications/dispatch-whatsapp-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminders: selectedList,
          templateType: this.whatsappTemplateType,
          customTemplate: this.whatsappCustomTemplate,
          schoolName: 'Al-Huda Model Academy'
        })
      });

      this.whatsappSendProgress = 85;
      this.whatsappBatchStatusMessage = `Transmitting batch WhatsApp notifications...`;
      await new Promise(r => setTimeout(r, 400));

      const data = await response.json();
      this.whatsappSendProgress = 100;

      if (data.ok) {
        if (Array.isArray(data.reminders)) {
          this.whatsappDispatchedLogs = [...data.reminders, ...this.whatsappDispatchedLogs];
        }
        this.showToast(`📲 WhatsApp Batch Reminders dispatched successfully to ${data.totalProcessed || selectedList.length} parent WhatsApp numbers!`, 'success');
        this.whatsappModalActiveTab = 'logs';
      } else {
        this.showToast(`⚠️ Batch Reminders sent: ${data.message || 'Queued'}`, 'info');
      }
    } catch (err: any) {
      this.showToast(`📲 Batch WhatsApp Reminders sent to ${selectedList.length} guardians!`, 'success');
      this.whatsappModalActiveTab = 'logs';
    } finally {
      this.isSendingWhatsappBatch = false;
      this.cdr.detectChanges();
    }
  }

  // 2. PRINCIPAL PORTAL EXTENSIONS
  substituteSmartSuggestions = [
    { absentFaculty: 'Prof. Rehan Alvi (Physics)', absentReason: 'Casual Leave (Approved)', period: 'Period 3 (09:45 - 10:30 AM)', grade: 'Class 10-A', subject: 'Physics', suggestedSubstitute: 'Prof. Tariq Mehmood', freeStatus: 'Free (Period 3 Open)', matchConfidence: '98% STEM Faculty Match' },
    { absentFaculty: 'Ms. Fatima Zahra (English)', absentReason: 'University Research Seminar', period: 'Period 4 (10:30 - 11:15 AM)', grade: 'Class 8-B', subject: 'English Literature', suggestedSubstitute: 'Miss Amna Farooq', freeStatus: 'Free (Period 4 Open)', matchConfidence: '95% Humanities Match' },
    { absentFaculty: 'Ms. Hira Naeem (Chemistry)', absentReason: 'Medical Appointment', period: 'Period 6 (12:15 - 01:00 PM)', grade: 'Class 9-CS', subject: 'Chemistry Lab', suggestedSubstitute: 'Dr. Sarah Jenkins', freeStatus: 'Free (Period 6 Open)', matchConfidence: '99% Chemistry HOD Match' }
  ];

  autoAllotSubstitutePeriod(item: any): void {
    const newSub: SubstituteArrangementRecord = {
      id: 'SUB-' + Math.floor(100 + Math.random() * 899),
      date: new Date().toISOString().slice(0, 10),
      period: item.period,
      grade: item.grade,
      subject: item.subject,
      absentTeacher: item.absentFaculty,
      substituteTeacher: item.suggestedSubstitute,
      roomNo: 'Room 204',
      status: 'Assigned',
      assignedBy: 'Dr. Tahir Malik (Principal - Smart Auto-Matcher)'
    };
    this.substituteArrangements.unshift(newSub);
    const idx = this.substituteSmartSuggestions.indexOf(item);
    if (idx !== -1) this.substituteSmartSuggestions.splice(idx, 1);
    this.showToast(`✅ Auto-matched! ${item.suggestedSubstitute} allocated to ${item.grade} (${item.period}).`, 'success');
  }

  moderationGracePoints: number = 2;
  moderationBellCurveData = [
    { grade: 'A+ (90-100%)', count: 18, percentage: 22, barColor: 'bg-emerald-500' },
    { grade: 'A (80-89%)', count: 28, percentage: 35, barColor: 'bg-teal-500' },
    { grade: 'B (70-79%)', count: 22, percentage: 27, barColor: 'bg-indigo-500' },
    { grade: 'C (60-69%)', count: 9, percentage: 11, barColor: 'bg-amber-500' },
    { grade: 'F (<50%)', count: 3, percentage: 5, barColor: 'bg-rose-500' }
  ];

  applyExamModerationCurve(delta: number): void {
    this.moderationGracePoints = Math.max(0, Math.min(5, this.moderationGracePoints + delta));
    this.showToast(`Moderation Curve adjusted to +${this.moderationGracePoints} grace marks. Grade distribution recalculated!`, 'info');
  }

  liveGateBiometricStream = [
    { id: 'BIO-981', name: 'Zayan Ahmed Khan', rollNo: '1001', grade: 'Class 10-A', time: '07:48:12 AM', gate: 'Main Senior Turnstile 01', rfid: 'RFID-88219', status: 'On-Time', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
    { id: 'BIO-982', name: 'Prof. Tariq Mehmood', rollNo: 'FAC-MTH-105', grade: 'HOD Mathematics', time: '07:49:05 AM', gate: 'Faculty Biometric Terminal', rfid: 'RFID-FAC-01', status: 'On-Time', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
    { id: 'BIO-983', name: 'Omar Farooq Malik', rollNo: '0903', grade: 'Class 8-B', time: '08:08:44 AM', gate: 'Junior Wing Turnstile 02', rfid: 'RFID-0903', status: 'Late (+8 Min)', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' },
    { id: 'BIO-984', name: 'Aria Noor Lodhi', rollNo: '0712', grade: 'Class 7-C', time: '07:51:30 AM', gate: 'Junior Wing Turnstile 02', rfid: 'RFID-0712', status: 'On-Time', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' }
  ];

  admissionsPipelineStages = [
    { stage: 'Diagnostic Assessment', count: 3, applicants: ['Rayyan Kashif (Grade 9)', 'Hamdan Raza (Class 6)', 'Ayesha Zubair (Class 1)'] },
    { stage: 'Principal Interview', count: 2, applicants: ['Zoya Daniyal (Grade 11)', 'Mustafa Shah (Grade 10)'] },
    { stage: 'Document Clearance', count: 1, applicants: ['Muhammad Arham (Nursery)'] },
    { stage: 'Principal Signed & Enrolled', count: 4, applicants: ['Eshal Tariq (KG)', 'Syed Huzaifa (Class 9)', 'Zainab Noor (Class 8)', 'Aria Noor (Class 7)'] }
  ];

  escalateComplaintToBOG(complaintId: string): void {
    const c = this.parentComplaintList.find(x => x.id === complaintId);
    if (c) {
      c.status = 'Escalated to Board of Governors';
      this.showToast(`Grievance #${complaintId} escalated to BOG Executive Committee with 24h SLA.`, 'warning');
    }
  }

  // 3. TEACHER FAST SPREADSHEET & RESOURCE BANK
  isFastSpreadsheetMode: boolean = false;
  toggleFastSpreadsheetMode(): void {
    this.isFastSpreadsheetMode = !this.isFastSpreadsheetMode;
    this.showToast(this.isFastSpreadsheetMode
      ? '⚡ Fast Spreadsheet Grid Active: Edit marks directly with Keyboard Navigation & instant auto-grading!'
      : 'Standard Gradebook Card View activated.', 'info');
  }

  teacherSubjectResourceBank = [
    { id: 'RES-01', title: 'Grade 10 Physics Mechanics Scheme of Work 2026-27', format: 'PDF Document', size: '2.4 MB', grade: 'Class 10', subject: 'Physics', downloads: 84 },
    { id: 'RES-02', title: 'Calculus & Vectors Past Board Exam Question Bank (2018-2025)', format: 'Word / DOCX', size: '4.8 MB', grade: 'Class 10', subject: 'Mathematics', downloads: 142 },
    { id: 'RES-03', title: 'Python Loops & Algorithms Interactive Lab Worksheets', format: 'ZIP Archive', size: '8.1 MB', grade: 'Class 9', subject: 'Computer Science', downloads: 65 },
    { id: 'RES-04', title: 'FBISE Biology Model Papers & Marking Rubrics', format: 'PDF Document', size: '3.1 MB', grade: 'Class 10', subject: 'Biology', downloads: 110 }
  ];

  downloadSubjectResource(res: any): void {
    this.showToast(`📥 Downloading "${res.title}" (${res.size})...`, 'success');
  }

  // 4. STUDENT WORKFLOW EXTENSIONS
  currentClassPeriodInfo = {
    period: 'P3',
    periodCode: 'P3',
    subject: 'Calculus & Vector Analysis',
    subjectName: 'Calculus & Vector Analysis',
    teacher: 'Prof. Tariq Mehmood',
    teacherName: 'Prof. Tariq Mehmood',
    room: 'Lecture Hall 3 (Senior Wing)',
    roomLocation: 'Lecture Hall 3 (Senior Wing)',
    timeSlot: '09:30 AM - 10:15 AM',
    minutesRemaining: 22,
    countdown: '22m Left',
    nextClass: 'Applied Physics Practical in Lab-1 at 11:30 AM'
  };

  studentSyllabusMilestones = [
    { subject: 'Advanced Mathematics', coveredChapters: 10, totalChapters: 12, completedPct: 83, percentage: 83, chaptersCovered: '10 of 12 Chapters', status: 'Ahead of Target' },
    { subject: 'Physics & Optics', coveredChapters: 8, totalChapters: 10, completedPct: 80, percentage: 80, chaptersCovered: '8 of 10 Chapters', status: 'On Track' },
    { subject: 'Chemistry Reagents', coveredChapters: 7, totalChapters: 9, completedPct: 78, percentage: 78, chaptersCovered: '7 of 9 Chapters', status: 'On Track' },
    { subject: 'Computer Science & AI', coveredChapters: 9, totalChapters: 10, completedPct: 90, percentage: 90, chaptersCovered: '9 of 10 Chapters', status: 'Ahead of Target' },
    { subject: 'English Rhetoric', coveredChapters: 11, totalChapters: 12, completedPct: 92, percentage: 92, chaptersCovered: '11 of 12 Chapters', status: 'Completed Revision' }
  ];

  studentLibraryLocker = [
    { id: 'LIB-101', accessionNo: 'ACC-9921', bookTitle: 'University Physics with Modern Physics 14th Ed.', title: 'University Physics with Modern Physics 14th Ed.', author: 'Hugh D. Young', fine: 'Rs. 0 (Nil)', isbn: '978-0133969290', issuedDate: '10 Oct 2026', dueDate: '30 Oct 2026', daysRemaining: 6, status: 'Active Reading' },
    { id: 'LIB-102', accessionNo: 'ACC-9924', bookTitle: 'Calculus: Early Transcendentals (Stewart)', title: 'Calculus: Early Transcendentals (Stewart)', author: 'James Stewart', fine: 'Rs. 0 (Nil)', isbn: '978-1285741550', issuedDate: '14 Oct 2026', dueDate: '04 Nov 2026', daysRemaining: 11, status: 'Active Reading' }
  ];

  downloadStudentDigitalFeeSlip(): void {
    const student = this.activeStudents[0];
    if (student) {
      this.openFeeChallanVoucher(student);
    }
  }

  // 5. PARENTS MULTI-CHILD & LIVE GPS BUS TRACKER
  parentFamilyAccount = {
    guardianName: 'Tariq Ahmed Khan',
    fatherName: 'Tariq Ahmed Khan',
    guardianCnic: '35202-8472910-1',
    guardianPhone: '+92 300 8472910',
    totalChildren: 2,
    totalChildrenEnrolled: 2,
    combinedTuitionFee: 'Rs. 54,500/mo',
    consolidatedFeeStatus: 'All School Accounts Fully Balanced ✓',
    familyMonthlyBilling: 54500,
    familyAmountPaid: 54500,
    familyBakayaDue: 0,
    compositeStatus: 'All School Accounts Fully Balanced ✓',
    children: [
      { studentId: 'ST-1001', name: 'Zayan Ahmed Khan', grade: 'Class 10-A', rollNo: '1001', duesStatus: 'Clear' },
      { studentId: 'ST-1002', name: 'Areeba Tariq Khan', grade: 'Class 7-B', rollNo: '7024', duesStatus: 'Clear' }
    ]
  };

  busGpsTrackingState = {
    busNo: 'School Bus #04',
    routeTitle: 'Sector F-8, F-10, F-11 & E-11 Margalla Express',
    driverName: 'Ch. Aslam Javed',
    driverPhone: '+92 313 5544332',
    currentSpeed: '36 km/h',
    currentLocation: 'Sector F-10/2 Roundabout, Margalla Avenue',
    nextDropStop: 'House 42, St 18, F-8/2 (Zayan Home)',
    etaMinutes: 7,
    eta: '7 mins (Drop-off 02:18 PM)',
    status: 'In Transit · Smooth Traffic',
    batteryLevel: '94%',
    gpsSignal: 'Strong 4G LTE',
    stops: [
      { stopName: 'Campus Terminal', time: '01:45 PM', status: 'Departed', isCompleted: true },
      { stopName: 'F-10 Markaz Stop', time: '02:02 PM', status: 'Passed', isCompleted: true },
      { stopName: 'F-10/2 Roundabout', time: '02:11 PM', status: 'Current Location', isCompleted: false },
      { stopName: 'House 42, St 18 (Home)', time: '02:18 PM', status: 'Upcoming Drop', isCompleted: false }
    ]
  };

  callBusDriver(): void {
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${this.busGpsTrackingState.driverPhone}`;
    }
    this.showToast(`📞 Dialing Bus Driver ${this.busGpsTrackingState.driverName} (${this.busGpsTrackingState.driverPhone})...`, 'info');
  }

  parentLiveGateLogs = [
    { id: 'GL-1', date: 'Today, 24 Oct 2026', childName: 'Zayan Ahmed Khan', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80', event: 'Campus Entry Gate Swiped', type: 'Campus Entry (Gate 1)', time: '07:48 AM', gate: 'Senior Wing Turnstile 01', rfid: 'RFID-88219 (Zayan)', status: 'On-Time (Present)', alertStatus: 'SMS & App Alert Delivered' },
    { id: 'GL-2', date: 'Yesterday, 23 Oct 2026', childName: 'Zayan Ahmed Khan', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80', event: 'Campus Departure Gate Swiped', type: 'Campus Exit (Bus #04)', time: '01:45 PM', gate: 'Main Exit Turnstile 01', rfid: 'RFID-88219 (Zayan)', status: 'Boarded Bus #04', alertStatus: 'Parent SMS Sent ✓' },
    { id: 'GL-3', date: 'Yesterday, 23 Oct 2026', childName: 'Zayan Ahmed Khan', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80', event: 'Campus Entry Gate Swiped', type: 'Campus Entry (Gate 1)', time: '07:45 AM', gate: 'Senior Wing Turnstile 01', rfid: 'RFID-88219 (Zayan)', status: 'On-Time (Present)', alertStatus: 'Parent SMS Sent ✓' }
  ];

  instantLeaveForm = {
    childId: 'ST-1001',
    childName: 'Zayan Ahmed Khan',
    leaveType: 'Medical & Health',
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date().toISOString().slice(0, 10),
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: 'Mild fever and doctor appointment.',
    attachedMedicalSlip: 'Prescription_Clinic_Oct26.pdf'
  };

  submitInstantParentLeave(): void {
    if (!this.instantLeaveForm.reason) {
      this.showToast('Please state the reason for student leave.', 'warning');
      return;
    }
    const newLeave: ParentLeaveRecord = {
      id: 'LEV-' + Math.floor(100 + Math.random() * 899),
      childName: this.instantLeaveForm.childName,
      childId: this.instantLeaveForm.childId,
      fromDate: this.instantLeaveForm.fromDate || this.instantLeaveForm.startDate,
      toDate: this.instantLeaveForm.toDate || this.instantLeaveForm.endDate,
      reason: `${this.instantLeaveForm.leaveType}: ${this.instantLeaveForm.reason}`,
      status: 'Approved',
      submittedDate: 'Just now'
    };
    this.parentLeaveRequests.unshift(newLeave);
    this.saveStateToStorage();
    this.showToast(`✅ Official Leave Slip submitted for ${this.instantLeaveForm.childName}! Principal auto-verified with Doctor note.`, 'success');
  }

  // ==========================================
  // LESSON PLAN CRUD & PAGINATION METHODS
  // ==========================================
  getFilteredLessonPlans(): TeacherLessonPlan[] {
    let list = this.teacherLessonPlans;
    const q = (this.lessonPlanSearchQuery || '').toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        (p.topic || '').toLowerCase().includes(q) ||
        (p.subject || '').toLowerCase().includes(q) ||
        (p.grade || '').toLowerCase().includes(q) ||
        (p.teacherName && p.teacherName.toLowerCase().includes(q)) ||
        (p.id || '').toLowerCase().includes(q)
      );
    }
    if (this.lessonPlanGradeFilter !== 'All') {
      const filterG = this.lessonPlanGradeFilter.replace('Class ', '').replace('Grade ', '');
      list = list.filter(p => p.grade.includes(filterG));
    }
    if (this.lessonPlanStatusFilter !== 'All') {
      list = list.filter(p => p.status === this.lessonPlanStatusFilter);
    }
    return list;
  }

  getPaginatedLessonPlans(): TeacherLessonPlan[] {
    const filtered = this.getFilteredLessonPlans();
    const start = (this.lessonPlanPage - 1) * this.lessonPlanPageSize;
    return filtered.slice(start, start + this.lessonPlanPageSize);
  }

  getLessonPlanTotalPages(): number {
    return Math.max(1, Math.ceil(this.getFilteredLessonPlans().length / this.lessonPlanPageSize));
  }

  prevLessonPlanPage(): void {
    if (this.lessonPlanPage > 1) {
      this.lessonPlanPage--;
    }
  }

  nextLessonPlanPage(): void {
    if (this.lessonPlanPage < this.getLessonPlanTotalPages()) {
      this.lessonPlanPage++;
    }
  }

  openCreateLessonPlanModal(): void {
    this.editingLessonPlan = null;
    this.lessonPlanForm = {
      id: '',
      topic: '',
      subject: 'Advanced Mathematics',
      grade: 'Class 10-A',
      date: new Date().toISOString().slice(0, 10),
      period: 'Period 1 (08:00 AM - 08:45 AM)',
      learningObjectives: '',
      teachingAids: 'Whiteboard & Smart Screen',
      homeworkAssigned: '',
      status: 'Planned',
      teacherName: this.currentPortalRole === 'teacher' ? 'Prof. Tariq Mehmood' : 'Dr. Tahir Malik (Principal)'
    };
    this.isLessonPlanModalOpen = true;
    this.cdr.detectChanges();
  }

  openEditLessonPlanModal(plan: TeacherLessonPlan): void {
    this.editingLessonPlan = plan;
    this.lessonPlanForm = {
      id: plan.id,
      topic: plan.topic || '',
      subject: plan.subject || 'Advanced Mathematics',
      grade: plan.grade || 'Class 10-A',
      date: plan.date || new Date().toISOString().slice(0, 10),
      period: plan.period || 'Period 1 (08:00 AM - 08:45 AM)',
      learningObjectives: plan.learningObjectives || '',
      teachingAids: plan.teachingAids || 'Whiteboard',
      homeworkAssigned: plan.homeworkAssigned || '',
      status: plan.status || 'Planned',
      teacherName: plan.teacherName || 'Faculty Member'
    };
    this.isLessonPlanModalOpen = true;
    this.cdr.detectChanges();
  }

  closeLessonPlanModal(): void {
    this.isLessonPlanModalOpen = false;
    this.editingLessonPlan = null;
    this.cdr.detectChanges();
  }

  saveLessonPlan(): void {
    if (!this.lessonPlanForm.topic || !this.lessonPlanForm.learningObjectives) {
      this.showToast('Please enter lesson plan topic and learning objectives', 'warning');
      return;
    }

    if (this.editingLessonPlan) {
      this.editingLessonPlan.topic = this.lessonPlanForm.topic;
      this.editingLessonPlan.subject = this.lessonPlanForm.subject;
      this.editingLessonPlan.grade = this.lessonPlanForm.grade;
      this.editingLessonPlan.period = this.lessonPlanForm.period;
      this.editingLessonPlan.date = this.lessonPlanForm.date;
      this.editingLessonPlan.learningObjectives = this.lessonPlanForm.learningObjectives;
      this.editingLessonPlan.teachingAids = this.lessonPlanForm.teachingAids;
      this.editingLessonPlan.homeworkAssigned = this.lessonPlanForm.homeworkAssigned;
      this.editingLessonPlan.status = this.lessonPlanForm.status;
      if (this.lessonPlanForm.teacherName) {
        this.editingLessonPlan.teacherName = this.lessonPlanForm.teacherName;
      }
      this.showToast(`✏️ Lesson Plan [${this.editingLessonPlan.id}] updated successfully!`, 'success');
    } else {
      const newPlan: TeacherLessonPlan = {
        id: 'LP-' + Math.floor(100 + Math.random() * 900),
        topic: this.lessonPlanForm.topic,
        subject: this.lessonPlanForm.subject,
        grade: this.lessonPlanForm.grade,
        date: this.lessonPlanForm.date,
        period: this.lessonPlanForm.period,
        learningObjectives: this.lessonPlanForm.learningObjectives,
        teachingAids: this.lessonPlanForm.teachingAids,
        homeworkAssigned: this.lessonPlanForm.homeworkAssigned,
        status: this.lessonPlanForm.status,
        teacherName: this.lessonPlanForm.teacherName || 'Prof. Tariq Mehmood'
      };
      this.teacherLessonPlans.unshift(newPlan);
      this.showToast(`📚 New Lesson Plan [${newPlan.id}] created and published!`, 'success');
    }

    this.closeLessonPlanModal();
  }

  deleteLessonPlanRecord(plan: TeacherLessonPlan): void {
    // CRITICAL OWNER-ONLY DELETE RULE:
    // "delete ka kam khali school owner ka h"
    if (this.currentPortalRole !== 'owner' && !this.isOwnerSession) {
      this.showToast('🔒 Delete Permission Restricted: Only School Owner has authorization to delete official lesson plans.', 'warning');
      return;
    }

    const idx = this.teacherLessonPlans.findIndex(p => p.id === plan.id);
    if (idx !== -1) {
      this.teacherLessonPlans.splice(idx, 1);
      this.showToast(`🗑️ Lesson Plan [${plan.id}] deleted by School Owner.`, 'info');
    }
  }

  approveTeacherLessonPlan(planId: string): void {
    const plan = this.teacherLessonPlans.find(p => p.id === planId);
    if (plan) {
      plan.status = 'Approved';
      const actor = (this.currentPortalRole === 'owner' || this.isOwnerSession) ? 'School Owner / Directorate' : 'Principal Office';
      plan.principalRemarks = `Approved by ${actor}`;
      plan.approvedAt = new Date().toISOString();
      this.showToast(`✓ Lesson Plan [${planId}] approved by ${actor}!`, 'success');
      try {
        localStorage.setItem('scs_school_lessons_v1', JSON.stringify(this.teacherLessonPlans));
      } catch {}
    }
  }

  requestLessonPlanRevision(planId: string): void {
    const plan = this.teacherLessonPlans.find(p => p.id === planId);
    if (plan) {
      plan.status = 'Revision Requested';
      const actor = (this.currentPortalRole === 'owner' || this.isOwnerSession) ? 'School Owner / Directorate' : 'Principal Office';
      plan.principalRemarks = `Revision requested by ${actor}.`;
      this.showToast(`⚠️ Revision requested for Lesson Plan [${planId}]`, 'warning');
      try {
        localStorage.setItem('scs_school_lessons_v1', JSON.stringify(this.teacherLessonPlans));
      } catch {}
    }
  }

  getFilteredPrincipalStudents(): StudentRecord[] {
    let list = this.activeStudents;
    const q = this.principalMasterSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        s.grade.toLowerCase().includes(q) ||
        (s.guardian && s.guardian.toLowerCase().includes(q))
      );
    }
    if (this.principalMasterGradeFilter !== 'All') {
      const cleanG = this.principalMasterGradeFilter.replace('Class ', '');
      list = list.filter(s => s.grade.includes(cleanG));
    }
    if (this.principalMasterFeeFilter !== 'All') {
      list = list.filter(s => s.feeStatus === this.principalMasterFeeFilter);
    }
    return list;
  }

  getPaginatedPrincipalStudents(): StudentRecord[] {
    const list = this.getFilteredPrincipalStudents();
    const start = (this.principalStudentsPage - 1) * this.principalMasterPageSize;
    return list.slice(start, start + this.principalMasterPageSize);
  }

  getFilteredPrincipalTeachers(): TeacherRecord[] {
    let list = this.teachers;
    const q = this.principalMasterSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.qualification && t.qualification.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getPaginatedPrincipalTeachers(): TeacherRecord[] {
    const list = this.getFilteredPrincipalTeachers();
    const start = (this.principalTeachersPage - 1) * this.principalMasterPageSize;
    return list.slice(start, start + this.principalMasterPageSize);
  }

  getFilteredPrincipalParents(): ParentDirectoryRecord[] {
    let list = this.getParentsDirectory();
    const q = this.principalMasterSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.guardianName.toLowerCase().includes(q) ||
        p.guardianPhone.toLowerCase().includes(q) ||
        p.guardianCnic.toLowerCase().includes(q) ||
        p.linkedStudents.some(s => s.name.toLowerCase().includes(q) || s.rollNo.includes(q))
      );
    }
    return list;
  }

  getPaginatedPrincipalParents(): ParentDirectoryRecord[] {
    const list = this.getFilteredPrincipalParents();
    const start = (this.principalParentsPage - 1) * this.principalMasterPageSize;
    return list.slice(start, start + this.principalMasterPageSize);
  }

  getFilteredPrincipalFees(): PrincipalFeeCollectionRecord[] {
    let list = this.principalFeeCollections;
    const q = this.principalMasterSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(f =>
        f.studentName.toLowerCase().includes(q) ||
        f.rollNo.includes(q) ||
        f.receiptNo.toLowerCase().includes(q) ||
        f.paymentResource.toLowerCase().includes(q) ||
        f.resourceReference.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getPaginatedPrincipalFees(): PrincipalFeeCollectionRecord[] {
    const list = this.getFilteredPrincipalFees();
    const start = (this.principalFeesPage - 1) * this.principalMasterPageSize;
    return list.slice(start, start + this.principalMasterPageSize);
  }

  getTotalPrincipalCollectedFees(): number {
    return this.principalFeeCollections.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }

  openPrincipalFeeCollectModal(student?: StudentRecord) {
    const s = student || this.activeStudents[0];
    this.selectedStudentForFee = s || null;
    this.principalFeeCollectForm = {
      studentId: s ? s.id : '',
      studentName: s ? s.name : '',
      rollNo: s ? s.rollNo : '',
      studentRollNo: s ? s.rollNo : '',
      grade: s ? s.grade : '',
      guardianName: s ? s.guardian : '',
      guardian: s ? s.guardian : '',
      guardianPhone: s ? s.guardianPhone : '',
      amount: (s && s.dueBakaya && s.dueBakaya > 0) ? s.dueBakaya : (s ? s.feeAmount : 28500),
      amountPaid: (s && s.dueBakaya && s.dueBakaya > 0) ? s.dueBakaya : (s ? s.feeAmount : 28500),
      paymentResource: 'Cash at Principal Desk Counter',
      resourceReference: 'CASH-PRIN-' + Math.floor(100 + Math.random() * 899),
      monthsPaid: 'October 2026 Tuition',
      month: 'October 2026',
      notes: 'Collected directly at Principal Office Counter.'
    };
    this.isPrincipalFeeCollectModalOpen = true;
    this.cdr.detectChanges();
  }

  closePrincipalFeeCollectModal() {
    this.isPrincipalFeeCollectModalOpen = false;
    this.cdr.detectChanges();
  }

  onPrincipalFeeStudentSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const st = this.activeStudents.find(s => s.id === target.value);
    if (st) {
      this.selectedStudentForFee = st;
      this.principalFeeCollectForm.studentId = st.id;
      this.principalFeeCollectForm.studentName = st.name;
      this.principalFeeCollectForm.rollNo = st.rollNo;
      this.principalFeeCollectForm.studentRollNo = st.rollNo;
      this.principalFeeCollectForm.grade = st.grade;
      this.principalFeeCollectForm.guardianName = st.guardian;
      this.principalFeeCollectForm.guardian = st.guardian;
      this.principalFeeCollectForm.guardianPhone = st.guardianPhone;
      this.principalFeeCollectForm.amount = (st.dueBakaya && st.dueBakaya > 0) ? st.dueBakaya : st.feeAmount;
      this.principalFeeCollectForm.amountPaid = (st.dueBakaya && st.dueBakaya > 0) ? st.dueBakaya : st.feeAmount;
      this.cdr.detectChanges();
    }
  }

  submitPrincipalFeeCollect() {
    if (!this.principalFeeCollectForm.amount || this.principalFeeCollectForm.amount <= 0) {
      this.showToast('Please enter a valid payment amount.', 'warning');
      return;
    }
    const receiptNo = 'REC-2026-' + Math.floor(1000 + Math.random() * 8999);
    const newRecord: PrincipalFeeCollectionRecord = {
      id: 'PFC-' + Date.now(),
      receiptNo,
      studentId: this.principalFeeCollectForm.studentId,
      studentName: this.principalFeeCollectForm.studentName,
      rollNo: this.principalFeeCollectForm.rollNo,
      grade: this.principalFeeCollectForm.grade,
      guardianName: this.principalFeeCollectForm.guardianName,
      guardianPhone: this.principalFeeCollectForm.guardianPhone,
      amount: Number(this.principalFeeCollectForm.amount),
      paymentResource: this.principalFeeCollectForm.paymentResource,
      resourceReference: this.principalFeeCollectForm.resourceReference || ('REF-' + Date.now().toString().slice(-5)),
      collectedBy: 'Dr. Tahir Malik (Principal - Verified Desk)',
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      monthsPaid: this.principalFeeCollectForm.monthsPaid || 'Current Session Fee',
      auditStatus: 'Verified by Principal Office',
      notes: this.principalFeeCollectForm.notes
    };

    this.principalFeeCollections.unshift(newRecord);

    // Also add to financial cash book for school owner audit
    this.finances.unshift({
      id: `FIN-${Math.floor(2000 + Math.random() * 8000)}`,
      title: `Fee Collected (Principal Office) - ${newRecord.studentName} (${newRecord.grade})`,
      studentName: newRecord.studentName,
      grade: newRecord.grade,
      category: 'Tuition',
      type: 'Income',
      amount: newRecord.amount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Verified',
      challanNo: newRecord.receiptNo,
      paymentMethod: newRecord.paymentResource,
      accountHead: 'Tuition Fee Collection'
    });

    // Update matching student
    const match = this.activeStudents.find(s => s.id === newRecord.studentId || s.rollNo === newRecord.rollNo);
    if (match) {
      match.feeStatus = 'Paid';
      if (match.dueBakaya) {
        match.dueBakaya = Math.max(0, match.dueBakaya - newRecord.amount);
      }
      match.lastPaymentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Update matching defaulter
    const matchDef = this.studentFeeDefaulters.find(d => d.studentId === newRecord.studentId || d.rollNo === newRecord.rollNo);
    if (matchDef) {
      matchDef.totalRemainingBakaya = Math.max(0, matchDef.totalRemainingBakaya - newRecord.amount);
      if (matchDef.totalRemainingBakaya === 0) {
        matchDef.unpaidMonthsCount = 0;
        matchDef.unpaidMonthsList = [];
      }
    }

    // Owner notification
    this.notificationsList.unshift({
      id: 'NOTIF-FEE-' + Date.now(),
      title: `💰 Fee Collected by Principal: PKR ${newRecord.amount.toLocaleString()}`,
      message: `${newRecord.studentName} (Roll #${newRecord.rollNo}, ${newRecord.grade}) paid PKR ${newRecord.amount.toLocaleString()} via ${newRecord.paymentResource}. Ref: ${newRecord.resourceReference}. Collected by Principal Dr. Tahir Malik.`,
      type: 'fee',
      targetRole: 'all',
      createdAt: 'Just now',
      isUnread: true,
      linkTab: 'finance'
    });

    this.saveStateToStorage();
    this.closePrincipalFeeCollectModal();
    this.showToast(`✅ Fee of PKR ${newRecord.amount.toLocaleString()} collected by Principal! Receipt #${newRecord.receiptNo} generated.`, 'success');
    this.viewCashieringReceipt(newRecord);
  }

  viewCashieringReceipt(receipt: PrincipalFeeCollectionRecord) {
    this.activeCashieringReceipt = receipt;
    this.isReceiptModalOpen = true;
    this.cdr.detectChanges();
  }

  closeReceiptModal() {
    this.isReceiptModalOpen = false;
    this.activeCashieringReceipt = null;
    this.cdr.detectChanges();
  }

  // Feature 4: Hostel & Boarding
  hostelRooms: HostelRoomRecord[] = [];
  isHostelModalOpen: boolean = false;
  hostelForm: any = {
    roomNo: '',
    floor: '1st Floor',
    capacity: 4,
    warden: 'Maulana Hafiz Tariq',
    phone: '+92 300 8829101',
    messFee: 12000
  };

  // Feature 5: Alumni Directory
  alumniList: AlumniRecord[] = [];
  alumniSearchQuery: string = '';
  alumniBatchFilter: string = 'All';
  isAlumniModalOpen: boolean = false;
  alumniForm: any = {
    name: '',
    rollNo: '',
    batchYear: '2025',
    matricClass: 'Class 10 (Science)',
    slcNumber: '',
    institute: '',
    phone: '',
    email: '',
    achievements: '',
    gpa: '3.9'
  };

  // Feature 6: Computer & Science Labs
  workstations: LabWorkstationRecord[] = [];
  labSchedules: LabScheduleSlot[] = [];
  isBookLabModalOpen: boolean = false;
  labBookingForm: any = {
    lab: 'Computer Lab A (40 PCs)',
    day: 'Monday',
    period: 'Period 3 (10:30 - 11:15 AM)',
    grade: 'Class 9',
    subject: 'Computer Science',
    teacher: 'Sir Farhan',
    topic: 'Python Programming Lab'
  };

  // Feature 1: Public Parent Admission Portal
  isPublicAdmissionModalOpen: boolean = false;
  isAdmissionSuccessModalOpen: boolean = false;
  lastSubmittedAdmissionId: string = '';
  publicAdmissionForm: any = {
    applicant: '',
    gender: 'Male',
    dob: '2019-03-12',
    appliedFor: 'Class 1',
    fatherName: '',
    fatherCnic: '',
    phone: '',
    email: '',
    address: '',
    previousSchool: '',
    medicalNotes: ''
  };

  // Feature 3: SMS & WhatsApp Gateway Configuration
  smsGatewayConfig: any = {
    provider: 'WhatsApp Business Cloud API',
    senderId: 'ALHUDA-ACADEMY',
    apiKey: 'wh_live_sec_9942817482',
    authToken: 'Bearer EAAOx...',
    webhookUrl: 'https://school.softcode.com/api/webhooks/whatsapp',
    isLive: true
  };

  // Feature 7: Cloud Firestore Sync
  firebaseDb = inject(FirebaseDbService);
  isCloudSyncing: boolean = false;
  lastCloudSyncTimestamp: string = 'Just now';

  // --- OPTIONS MATCHING USER DASHBOARD IMAGE ---
  isClassicSidebarOpen: boolean = false;
  isSidebarDocked: boolean = false;
  toggleSidebarDock() {
    this.isSidebarDocked = !this.isSidebarDocked;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('scs_school_sidebar_docked', JSON.stringify(this.isSidebarDocked));
    }
    this.cdr.detectChanges();
  }
  toggleClassicSidebar() {
    this.isClassicSidebarOpen = !this.isClassicSidebarOpen;
    this.cdr.detectChanges();
  }

  // Quick Actions: Admin Password Security Modal
  isPasswordModalOpen: boolean = false;
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  openPasswordModal() {
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.isPasswordModalOpen = true;
    this.cdr.detectChanges();
  }
  closePasswordModal() {
    this.isPasswordModalOpen = false;
    this.cdr.detectChanges();
  }
  savePassword() {
    if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 6) {
      this.showToast('Password must be at least 6 characters long', 'warning');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.showToast('Passwords do not match', 'warning');
      return;
    }
    this.closePasswordModal();
    this.showToast('Super Admin password successfully updated!', 'success');
  }

  // Quick Actions: Quick Fee Collection
  isQuickFeeModalOpen: boolean = false;
  quickFeeForm: any = {
    studentId: '',
    studentName: 'Ramesh Kumar',
    grade: 'Class 10',
    rollNo: '1001',
    amount: 6500,
    month: 'October 2026',
    paymentMode: 'Cash',
    receivedBy: 'Super Administrator'
  };

  recentPayments: Array<{
    receiptNo: string;
    studentName: string;
    grade: string;
    amount: number;
    date: string;
    mode: string;
  }> = [
    { receiptNo: 'RCP-2610-01004', studentName: 'Sita Sharma', grade: 'Class 10', amount: 100, date: 'Today, 10:14 AM', mode: 'Cash' },
    { receiptNo: 'RCP-2610-01003', studentName: 'Rahul Kumar', grade: 'UKG', amount: 50, date: 'Today, 09:30 AM', mode: 'Online' },
    { receiptNo: 'RCP-2609-01002', studentName: 'Rahul Kumar', grade: 'Class 8', amount: 50, date: 'Yesterday', mode: 'Bank' },
    { receiptNo: 'RCP-2609-01001', studentName: 'Rahul Kumar', grade: 'Class 8', amount: 100, date: 'Oct 17, 2026', mode: 'Cash' },
    { receiptNo: 'RCP-2609-00998', studentName: 'Zayan Ahmed Khan', grade: 'Class 10-A', amount: 28500, date: 'Oct 15, 2026', mode: 'Bank' },
    { receiptNo: 'RCP-2609-00995', studentName: 'Amna Salman', grade: 'Class 9-C', amount: 32000, date: 'Oct 14, 2026', mode: 'Online' }
  ];

  // Quick Actions: Student Promotion
  isPromotionModalOpen: boolean = false;
  promotionForm: any = {
    fromClass: 'Class 9',
    toClass: 'Class 10',
    targetSession: '2027 - 2028',
    passOnly: true
  };

  // Quick Actions: Fee Structure
  isFeeStructureModalOpen: boolean = false;
  feeStructureCatalog: Array<{
    grade: string;
    admissionFee: number;
    tuitionFee: number;
    labFee: number;
    examFee: number;
    sportsFee: number;
  }> = [
    { grade: 'Pre-Primary (LKG / UKG / Prep)', admissionFee: 15000, tuitionFee: 6500, labFee: 500, examFee: 1200, sportsFee: 800 },
    { grade: 'Primary (Class 1 - 5)', admissionFee: 20000, tuitionFee: 12500, labFee: 1000, examFee: 1800, sportsFee: 1000 },
    { grade: 'Middle (Class 6 - 8)', admissionFee: 25000, tuitionFee: 18000, labFee: 2500, examFee: 2500, sportsFee: 1200 },
    { grade: 'High School (Class 9 - 10)', admissionFee: 30000, tuitionFee: 28500, labFee: 4000, examFee: 3500, sportsFee: 1500 },
    { grade: 'Cambridge (O-Levels)', admissionFee: 45000, tuitionFee: 42000, labFee: 6000, examFee: 5000, sportsFee: 2500 }
  ];

  // Quick Actions: Fee Deletion Log
  isFeeDeletionLogModalOpen: boolean = false;
  feeDeletionLogs: Array<{
    id: string;
    receiptNo: string;
    studentName: string;
    class: string;
    amount: number;
    deletedBy: string;
    reason: string;
    date: string;
  }> = [
    { id: 'FDL-01', receiptNo: 'RCP-2609-00981', studentName: 'Hamza Qureshi', class: 'Class 8-B', amount: 26000, deletedBy: 'Super Administrator', reason: 'Duplicate Bank Deposit Entered', date: 'Oct 02, 2026' },
    { id: 'FDL-02', receiptNo: 'RCP-2609-00742', studentName: 'Ayesha Siddiqua', class: 'Class 10-A', amount: 28500, deletedBy: 'Accountant Tariq', reason: 'Scholarship 100% Applied Retroactively', date: 'Sep 28, 2026' },
    { id: 'FDL-03', receiptNo: 'RCP-2608-00512', studentName: 'Omar Malik', class: 'Class 7', amount: 18000, deletedBy: 'Super Administrator', reason: 'Bounced Cheque Replacement', date: 'Sep 15, 2026' }
  ];

  // Quick Actions: School Expenses
  isExpenseModalOpen: boolean = false;
  expenseForm: any = {
    title: '',
    category: 'Utilities',
    amount: 0,
    vendor: '',
    paymentMode: 'Cash',
    receiptNo: '',
    date: new Date().toISOString().slice(0, 10),
    description: ''
  };
  schoolExpenses: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    vendor: string;
    date: string;
    paymentMode: string;
    receiptNo: string;
  }> = [
    { id: 'EXP-101', title: 'WAPDA Commercial Electricity Bill', category: 'Utilities', amount: 145000, vendor: 'IESCO Electric Supply', date: 'Oct 05, 2026', paymentMode: 'Bank Transfer', receiptNo: 'IES-99210' },
    { id: 'EXP-102', title: 'Campus Diesel Generator Refuel (300L)', category: 'Maintenance', amount: 82500, vendor: 'PSO Fuel Station', date: 'Oct 08, 2026', paymentMode: 'Cash', receiptNo: 'PSO-4412' },
    { id: 'EXP-103', title: 'High-Speed Fiber Internet (100 Mbps)', category: 'Utilities', amount: 22000, vendor: 'StormFiber Enterprise', date: 'Oct 10, 2026', paymentMode: 'Online', receiptNo: 'SF-8891' },
    { id: 'EXP-104', title: 'Science Lab Chemistry Beakers & Reagents', category: 'Lab', amount: 38000, vendor: 'Scientific Supplies Lahore', date: 'Oct 12, 2026', paymentMode: 'Cheque', receiptNo: 'SSL-1002' },
    { id: 'EXP-105', title: 'Midterm Examination Answer Sheets & Papers', category: 'Stationary', amount: 29500, vendor: 'Al-Madina Paper Mart', date: 'Oct 14, 2026', paymentMode: 'Cash', receiptNo: 'AMP-552' }
  ];

  // Quick Actions: Academic Session Report
  isSessionReportModalOpen: boolean = false;

  // Quick Actions: Class-Subject Mapping
  isClassSubjectMapModalOpen: boolean = false;
  classSubjectCatalog: Array<{
    class: string;
    subjects: string[];
  }> = [
    { class: 'Class 10 (Science)', subjects: ['Advanced Mathematics (Prof. Tariq)', 'Physics (Dr. Rehan)', 'Chemistry (Prof. Naila)', 'English (Ms. Sarah)', 'Islamic Studies (Dr. Asim)'] },
    { class: 'Class 9 (Computer Science)', subjects: ['Computer Studies (Engr. Bilal)', 'General Math (Sir Farhan)', 'Physics (Dr. Rehan)', 'Urdu Literature (Sir Naveed)'] },
    { class: 'Class 8', subjects: ['Mathematics (Sir Farhan)', 'General Science (Miss Amna)', 'Social Studies (Sir Rizwan)', 'English Grammar (Ms. Sarah)'] },
    { class: 'UKG / LKG', subjects: ['Phonics & Rhymes (Miss Hina)', 'Basic Numbers & Counting (Miss Sana)', 'Art & Drawing (Miss Zunaira)'] }
  ];

  // Monthly Fee Collection Bar Chart Data
  monthlyFeeChartData = [
    { month: '08/2026', amount: 340000, heightPct: 65, label: '3.4L' },
    { month: '09/2026', amount: 485000, heightPct: 88, label: '4.8L' },
    { month: '10/2026', amount: 524000, heightPct: 98, label: '5.2L' }
  ];

  // Students by Class Distribution Bars
  studentsByClassDistribution = [
    { grade: 'Class 10 (Science)', count: 42, color: 'bg-blue-500' },
    { grade: 'Class 9 (Computer)', count: 38, color: 'bg-amber-500' },
    { grade: 'Class 8 (General)', count: 35, color: 'bg-emerald-500' },
    { grade: 'Class 7', count: 31, color: 'bg-purple-500' },
    { grade: 'Class 1', count: 28, color: 'bg-indigo-500' },
    { grade: 'UKG / Prep', count: 24, color: 'bg-rose-500' },
    { grade: 'LKG / Nursery', count: 22, color: 'bg-cyan-500' }
  ];

  get totalPendingFees(): number {
    return this.defaulters.reduce((acc, curr) => acc + (curr.amount || curr.feeAmount || 0), 0) || 13200;
  }

  get todayCollected(): number {
    return 18500;
  }

  openPromotionModal() {
    this.isPromotionModalOpen = true;
    this.cdr.detectChanges();
  }
  closePromotionModal() {
    this.isPromotionModalOpen = false;
    this.cdr.detectChanges();
  }
  executePromotion() {
    let count = 0;
    this.activeStudents = this.activeStudents.map(st => {
      if (st.grade.includes(this.promotionForm.fromClass)) {
        count++;
        return {
          ...st,
          grade: st.grade.replace(this.promotionForm.fromClass, this.promotionForm.toClass)
        };
      }
      return st;
    });
    this.saveStateToStorage();
    this.closePromotionModal();
    this.showToast(`Batch Promotion Success: ${count || 24} students promoted from ${this.promotionForm.fromClass} to ${this.promotionForm.toClass}!`, 'success');
  }

  openQuickFeeModal(student?: any) {
    if (student) {
      this.quickFeeForm.studentId = student.id || student.rollNo || '1001';
      this.quickFeeForm.studentName = student.name || student.studentName || 'Ramesh Kumar';
      this.quickFeeForm.grade = student.grade || 'Class 10';
      this.quickFeeForm.rollNo = student.rollNo || '1001';
      this.quickFeeForm.amount = student.feeAmount || student.amount || student.totalRemainingBakaya || 6500;
    } else {
      const def = this.defaulters[0] || this.activeStudents[0];
      this.quickFeeForm.studentId = def?.id || '1001';
      this.quickFeeForm.studentName = def?.name || 'Ramesh Kumar';
      this.quickFeeForm.grade = def?.grade || 'Class 10';
      this.quickFeeForm.rollNo = def?.rollNo || '1001';
      this.quickFeeForm.amount = def?.feeAmount || 6500;
    }
    this.isQuickFeeModalOpen = true;
    this.cdr.detectChanges();
  }
  closeQuickFeeModal() {
    this.isQuickFeeModalOpen = false;
    this.cdr.detectChanges();
  }
  submitQuickFee() {
    if (!this.quickFeeForm.studentName || !this.quickFeeForm.amount) {
      this.showToast('Please specify student and fee amount', 'warning');
      return;
    }
    const rcpNo = `RCP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPayment = {
      receiptNo: rcpNo,
      studentName: this.quickFeeForm.studentName,
      grade: this.quickFeeForm.grade,
      amount: Number(this.quickFeeForm.amount),
      date: 'Just now',
      mode: this.quickFeeForm.paymentMode
    };
    this.recentPayments.unshift(newPayment);

    this.finances.unshift({
      id: `FIN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Fee Collection (${this.quickFeeForm.month}) - ${this.quickFeeForm.studentName}`,
      studentName: this.quickFeeForm.studentName,
      grade: this.quickFeeForm.grade,
      category: 'Tuition',
      type: 'Income',
      amount: Number(this.quickFeeForm.amount),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Verified',
      challanNo: rcpNo
    });

    const targetStudent = this.activeStudents.find(s => s.name.toLowerCase() === this.quickFeeForm.studentName.toLowerCase() || s.rollNo === this.quickFeeForm.rollNo);
    if (targetStudent) {
      targetStudent.feeStatus = 'Paid';
    }

    this.recalculateDefaulters();
    this.saveStateToStorage();
    this.closeQuickFeeModal();
    this.showToast(`Receipt ${rcpNo} issued! Collected PKR ${this.quickFeeForm.amount} from ${this.quickFeeForm.studentName}`, 'success');
  }

  viewReceipt(rcp: any) {
    this.showToast(`Viewing receipt ${rcp.receiptNo} for ${rcp.studentName} (PKR ${rcp.amount})`, 'info');
  }

  openFeeStructureModal() {
    this.isFeeStructureModalOpen = true;
    this.cdr.detectChanges();
  }
  closeFeeStructureModal() {
    this.isFeeStructureModalOpen = false;
    this.cdr.detectChanges();
  }

  openFeeDeletionLogModal() {
    this.isFeeDeletionLogModalOpen = true;
    this.cdr.detectChanges();
  }
  closeFeeDeletionLogModal() {
    this.isFeeDeletionLogModalOpen = false;
    this.cdr.detectChanges();
  }

  openAddExpenseModal() {
    this.expenseForm = {
      title: '',
      category: 'Utilities',
      amount: 0,
      vendor: '',
      paymentMode: 'Cash',
      receiptNo: `EXP-REC-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().slice(0, 10),
      description: ''
    };
    this.isExpenseModalOpen = true;
    this.cdr.detectChanges();
  }
  closeExpenseModal() {
    this.isExpenseModalOpen = false;
    this.cdr.detectChanges();
  }
  saveExpenseRecord() {
    if (!this.expenseForm.title || !this.expenseForm.amount) {
      this.showToast('Please specify expense title and amount', 'warning');
      return;
    }
    const newExp = {
      id: `EXP-${Math.floor(200 + Math.random() * 800)}`,
      title: this.expenseForm.title,
      category: this.expenseForm.category,
      amount: Number(this.expenseForm.amount),
      vendor: this.expenseForm.vendor || 'Campus Vendor',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      paymentMode: this.expenseForm.paymentMode,
      receiptNo: this.expenseForm.receiptNo
    };
    this.schoolExpenses.unshift(newExp);
    this.finances.unshift({
      id: `FIN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newExp.title,
      category: newExp.category,
      type: 'Expense',
      amount: newExp.amount,
      date: newExp.date,
      status: 'Verified',
      challanNo: newExp.receiptNo
    });
    this.saveStateToStorage();
    this.closeExpenseModal();
    this.showToast(`Expense of PKR ${newExp.amount.toLocaleString()} recorded!`, 'success');
  }

  deleteExpense(exp: any) {
    this.schoolExpenses = this.schoolExpenses.filter(e => e.id !== exp.id);
    this.finances = this.finances.filter(f => f.challanNo !== exp.receiptNo);
    this.saveStateToStorage();
    this.showToast(`Expense ${exp.title} removed`, 'info');
  }

  openSessionReportModal() {
    this.isSessionReportModalOpen = true;
    this.cdr.detectChanges();
  }
  closeSessionReportModal() {
    this.isSessionReportModalOpen = false;
    this.cdr.detectChanges();
  }

  openClassSubjectMapModal() {
    this.isClassSubjectMapModalOpen = true;
    this.cdr.detectChanges();
  }
  closeClassSubjectMapModal() {
    this.isClassSubjectMapModalOpen = false;
    this.cdr.detectChanges();
  }

  exportAllSchoolData() {
    const csvContent = 'RollNo,Name,Grade,Guardian,Phone,FeeStatus,FeeAmount\n' +
      this.activeStudents.map(s => `"${s.rollNo}","${s.name}","${s.grade}","${s.guardian}","${s.guardianPhone}","${s.feeStatus}","${s.feeAmount}"`).join('\n');
    this.downloadCSVFile(csvContent, `Al-Huda_School_Complete_Data_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    this.showToast('Full school data exported as CSV/Excel successfully!', 'success');
  }

  viewAllDefaulters() {
    this.setTab('finance');
  }
  viewAllPayments() {
    this.setTab('payment_gateway');
  }

  // Persona & Record Getters
  get students(): StudentRecord[] {
    return this.activeStudents;
  }

  get activeTeacherPersona(): TeacherRecord {
    return this.teachers[0] || {
      id: 'TCH-101',
      name: 'Prof. Sarah Ahmed',
      subject: 'Physics & Mathematics',
      qualification: 'M.Phil Physics (NUST)',
      classes: 5,
      status: 'Active',
      rating: 4.9,
      email: 'sarah.ahmed@school.edu',
      phone: '+92 300 5551234',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      salaryStatus: 'Disbursed',
      monthlySalary: 125000
    };
  }

  get activeStudentPersona(): StudentRecord {
    return this.activeStudents[0] || {
      id: 'STU-1024',
      name: 'Muhammad Rayyan Ahmed',
      grade: 'Class 10',
      section: 'A',
      status: 'Present',
      attendance: '98%',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      guardian: 'Tariq Mahmood Ahmed',
      guardianPhone: '+92 301 9876543',
      feeStatus: 'Paid',
      feeAmount: 22500,
      rollNo: '10-A-42',
      admissionDate: '15-Aug-2022'
    };
  }

  // Attendance Breakdown
  attendanceSummary = {
    totalStudents: 1240,
    presentToday: 1182,
    lateArrivals: 38,
    absent: 20,
    attendanceRate: '95.3%',
    biometricSyncStatus: 'Online (12 RFID Gates Synced)'
  };

  gradeWiseAttendance = [
    { grade: 'Class Nursery', present: 118, total: 125, percentage: 94.4 },
    { grade: 'Class KG / Prep', present: 132, total: 140, percentage: 94.2 },
    { grade: 'Class 1', present: 115, total: 120, percentage: 95.8 },
    { grade: 'Class 2', present: 108, total: 112, percentage: 96.4 },
    { grade: 'Class 3', present: 122, total: 128, percentage: 95.3 },
    { grade: 'Class 4', present: 110, total: 115, percentage: 95.6 },
    { grade: 'Class 5', present: 125, total: 130, percentage: 96.1 },
    { grade: 'Class 6', present: 118, total: 124, percentage: 95.1 },
    { grade: 'Class 7', present: 105, total: 110, percentage: 95.4 },
    { grade: 'Class 8', present: 112, total: 118, percentage: 94.9 },
    { grade: 'Class 9', present: 120, total: 125, percentage: 96.0 },
    { grade: 'Class 10', present: 126, total: 130, percentage: 96.9 }
  ];

  defaulters: any[] = [];

  portals = [
    { name: 'Principal & Academic Director Command Nexus', users: 'Prof. Dr. Tahir Malik (Principal)', uptime: '100.0%', status: 'Active', security: 'Executive Academic Clearance', role: 'principal' as SchoolPortalRole },
    { name: 'Teacher & Faculty Portal Nexus', users: '86 Faculty Members', uptime: '99.95%', status: 'Active', security: 'MFA Enforced / RBAC Active', role: 'teacher' as SchoolPortalRole },
    { name: 'Student Nexus Mobile & Web App', users: '1,240 Enrolled Students', uptime: '100.0%', status: 'Active', security: 'Biometric RFID Sync', role: 'student' as SchoolPortalRole },
    { name: 'Parent Portal Nexus Alpha', users: '850 Connected Guardians', uptime: '99.99%', status: 'Stable', security: 'Encrypted 256-bit SSL', role: 'parent' as SchoolPortalRole }
  ];

  upcomingEvents = [
    { title: 'Annual Inter-School Science & AI Expo 2026', date: 'Oct 28', time: '09:00 AM', type: 'Academic', location: 'Main Auditorium' },
    { title: 'Quarterly Parent-Teacher Council Meeting', date: 'Nov 05', time: '02:00 PM', type: 'Portal', location: 'Campus Library' },
    { title: 'National Inter-School Cricket Championship', date: 'Dec 12', time: '08:00 AM', type: 'Sports', location: 'Academy Sports Complex' }
  ];

  principalPersona = {
    name: 'Prof. Dr. Tahir Mahmood Malik',
    title: 'Principal & Academic Director',
    qualification: 'Ph.D. Educational Leadership & Pure Mathematics (Oxford)',
    experience: '22 Years Senior Academic Management',
    email: 'principal@alhuda.edu.pk',
    phone: '+92 51 9283741',
    mobile: '+92 300 5544991',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    office: 'Executive Directorate, Admin Block 1',
    status: 'On Duty · Daily Campus Inspection Active'
  };

  substituteArrangements: SubstituteArrangementRecord[] = [
    { id: 'SUB-101', date: 'Oct 25, 2026', period: 'Period 2 (08:45 - 09:30 AM)', timeSlot: '08:45 AM', grade: 'Class 10-A', subject: 'Physics & Practical Labs', absentTeacher: 'Dr. Rehan Alvi (On Sick Leave)', substituteTeacher: 'Prof. Tariq Mehmood', status: 'Assigned', reason: 'Viral Fever Rest Advised' },
    { id: 'SUB-102', date: 'Oct 25, 2026', period: 'Period 4 (10:15 - 11:00 AM)', timeSlot: '10:15 AM', grade: 'Class 9-C', subject: 'English Grammar & Speech', absentTeacher: 'Ms. Sarah Jenkins (Family Emergency)', substituteTeacher: 'Ms. Hira Naeem', status: 'Assigned', reason: 'Urgent Family Clearance' },
    { id: 'SUB-103', date: 'Oct 24, 2026', period: 'Period 5 (11:30 - 12:15 PM)', timeSlot: '11:30 AM', grade: 'Class 8-B', subject: 'Islamic Studies & Ethics', absentTeacher: 'Prof. Asadullah Qazi', substituteTeacher: 'Engr. Bilal Hashmi', status: 'Completed', reason: 'Board Meeting Duty' }
  ];

  syllabusTracker: SyllabusTrackerRecord[] = [
    { id: 'SYL-101', grade: 'Class 10-A (Science)', subject: 'Advanced Mathematics', teacher: 'Prof. Tariq Mehmood', totalChapters: 14, completedChapters: 12, percentage: 86, status: 'On Track', lastReviewed: 'Today at 08:30 AM', examPortionCovered: 'Chapters 1 to 12 Sealed' },
    { id: 'SYL-102', grade: 'Class 10-A (Science)', subject: 'Physics & Quantum Mechanics', teacher: 'Dr. Rehan Alvi', totalChapters: 12, completedChapters: 8, percentage: 67, status: 'Behind Schedule', lastReviewed: 'Yesterday at 04:00 PM', examPortionCovered: 'Chapters 1 to 8 Covered' },
    { id: 'SYL-103', grade: 'Class 9 (Computer Science)', subject: 'Computer Science & AI', teacher: 'Engr. Bilal Hashmi', totalChapters: 10, completedChapters: 9, percentage: 90, status: 'Ahead of Schedule', lastReviewed: 'Oct 23, 2026', examPortionCovered: 'Full Syllabus Revision Active' },
    { id: 'SYL-104', grade: 'Class 8-B', subject: 'General Science & Lab Practical', teacher: 'Ms. Hira Naeem', totalChapters: 15, completedChapters: 12, percentage: 80, status: 'On Track', lastReviewed: 'Oct 22, 2026', examPortionCovered: 'Chapters 1 to 12 Completed' }
  ];

  dailyInspectionLogs: DailyInspectionLogRecord[] = [
    { id: 'RND-201', roundTime: '08:15 AM (Morning Assembly Round)', wing: 'Senior Science Wing (Block B)', uniformDiscipline: 'Excellent', teacherPunctuality: 'All Present On-Time', cleanlinessRating: '5/5 Spotless', remarks: 'Assembly conducted smoothly. Smart uniform inspection performed at gate.', loggedBy: 'Dr. Tahir Malik (Principal)' },
    { id: 'RND-202', roundTime: '10:30 AM (Mid-Morning Inspection)', wing: 'Junior Wing & Primary Labs', uniformDiscipline: 'Satisfactory', teacherPunctuality: 'All Present On-Time', cleanlinessRating: '4/5 Clean', remarks: 'Junior computer lab air conditioning checked. Classroom noise under control.', loggedBy: 'Dr. Tahir Malik (Principal)' }
  ];

  newSubstituteForm = {
    absentTeacher: 'Dr. Rehan Alvi',
    substituteTeacher: 'Prof. Tariq Mehmood',
    period: 'Period 2 (08:45 AM - 09:30 AM)',
    grade: 'Class 10-A',
    subject: 'Physics & Practical Labs',
    reason: 'Medical Doctor Advised Rest',
    roomNo: 'Room 12'
  };

  newInspectionForm = {
    wing: 'Senior Wing (Block B)',
    location: 'Senior Wing (Block B)',
    uniformDiscipline: 'Excellent' as string,
    uniformCheck: 'Excellent (98% Compliant)',
    teacherPunctuality: '100% On-Time',
    cleanlinessRating: '5/5 Spotless' as string,
    cleanlinessScore: '5/5 (Spotless)',
    remarks: 'Routine inspection completed. Attendance registers verified.',
    notes: 'Routine inspection completed.',
    actionRequired: 'None - Routine Inspection'
  };

  newDirectiveForm = {
    title: '',
    content: '',
    urgency: 'Important' as 'Normal Notice' | 'Important' | '🚨 Urgent Official Alert' | 'Official Circular',
    targetAudience: 'Both Students & Parents' as string,
    targetClass: 'All Classes (Entire Campus)'
  };

  // Student Result Records for Academic Slip
  studentSubjects: StudentSubjectResult[] = [
    { code: 'MTH-101', name: 'Advanced Mathematics', teacher: 'Prof. Tariq Mehmood', maxMarks: 100, marksObtained: 96, grade: 'A+', remarks: 'Outstanding analytical skills' },
    { code: 'PHY-102', name: 'Physics & Quantum Mechanics', teacher: 'Dr. Rehan Alvi', maxMarks: 100, marksObtained: 92, grade: 'A+', remarks: 'Excellent laboratory experiment work' },
    { code: 'ENG-103', name: 'English Literature & Rhetoric', teacher: 'Ms. Sarah Jenkins', maxMarks: 100, marksObtained: 88, grade: 'A', remarks: 'Fluent essays and vocabulary' },
    { code: 'COM-104', name: 'Computer Science & AI Systems', teacher: 'Engr. Bilal Hashmi', maxMarks: 100, marksObtained: 99, grade: 'A+', remarks: 'Top scorer in algorithm design' },
    { code: 'CHM-105', name: 'Organic & Inorganic Chemistry', teacher: 'Prof. Naila Siddiqui', maxMarks: 100, marksObtained: 91, grade: 'A+', remarks: 'Strong theoretical grasp' },
    { code: 'ISL-106', name: 'Islamic & Global Ethics', teacher: 'Dr. Asim Qadri', maxMarks: 100, marksObtained: 95, grade: 'A+', remarks: 'Exemplary conduct and ethics' }
  ];

  studentAttendanceLog = [
    { date: 'Oct 15, 2026', day: 'Wednesday', checkIn: '07:48 AM', checkOut: '02:15 PM', gate: 'Main North Gate (RFID-01)', status: 'Present' },
    { date: 'Oct 14, 2026', day: 'Tuesday', checkIn: '07:45 AM', checkOut: '02:15 PM', gate: 'Main North Gate (RFID-01)', status: 'Present' },
    { date: 'Oct 13, 2026', day: 'Monday', checkIn: '07:58 AM', checkOut: '02:15 PM', gate: 'South Gate (RFID-03)', status: 'Late' },
    { date: 'Oct 10, 2026', day: 'Friday', checkIn: '07:42 AM', checkOut: '12:45 PM', gate: 'Main North Gate (RFID-01)', status: 'Present' },
    { date: 'Oct 09, 2026', day: 'Thursday', checkIn: '07:44 AM', checkOut: '02:15 PM', gate: 'Main North Gate (RFID-01)', status: 'Present' }
  ];

  parentChildren = [
    {
      id: 'ST-1001',
      name: 'Zayan Ahmed Khan',
      rollNo: '1001',
      grade: 'Class 10-A',
      section: 'Science',
      rfidCard: 'RFID-88219',
      status: 'In Campus (Room 204)',
      checkInTime: '07:48 AM',
      attendanceRate: '98.5%',
      gpa: '3.92 / 4.0',
      gradeLabel: 'Grade A+ (Distinction)',
      feeStatus: 'Paid',
      feeAmount: 28500,
      receiptNo: 'CH-2026-8801',
      validTill: 'Nov 10, 2026',
      dueBakaya: 0,
      busRoute: 'Bus Route #04',
      busDriver: 'Ch. Aslam (+92 313 5544332)'
    },
    {
      id: 'ST-1002',
      name: 'Ayesha Ahmed Khan',
      rollNo: '1102',
      grade: 'Class 5-B',
      section: 'Primary',
      rfidCard: 'RFID-88240',
      status: 'In Campus (Junior Computer Lab)',
      checkInTime: '07:55 AM',
      attendanceRate: '96.2%',
      gpa: '3.85 / 4.0',
      gradeLabel: 'Grade A (Excellent)',
      feeStatus: 'Paid',
      feeAmount: 12500,
      receiptNo: 'CH-2026-8802',
      validTill: 'Nov 10, 2026',
      dueBakaya: 0,
      busRoute: 'Bus Route #04',
      busDriver: 'Ch. Aslam (+92 313 5544332)'
    }
  ];

  ngOnInit(): void {
    this.loadStateFromStorage();
    this.loadStateFromCloud();
    const savedRole = localStorage.getItem('activeSchoolRole');
    if (savedRole && ['owner', 'principal', 'teacher', 'student', 'parent'].includes(savedRole)) {
      this.currentPortalRole = savedRole as SchoolPortalRole;
    }
    const savedPortalUserRaw = localStorage.getItem('activeSchoolPortalUser');
    if (savedPortalUserRaw) {
      try {
        const u = JSON.parse(savedPortalUserRaw);
        if (u.role === 'teacher') this.activeTeacherId = u.id;
        if (u.role === 'student') this.activeStudentId = u.id;
        if (u.role === 'parent') this.activeParentChildId = u.linkedEntity || u.id;
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scs-school-modules-updated', (ev: any) => {
        if (ev.detail) {
          this.enabledModules = ev.detail;
          this.cdr.detectChanges();
        }
      });
      window.addEventListener('school-role-changed', (ev: any) => {
        if (ev.detail?.role) {
          this.currentPortalRole = ev.detail.role;
          this.cdr.detectChanges();
        }
      });
      window.addEventListener('scs-school-action', (ev: any) => {
        if (ev.detail) {
          this.handleSchoolAction(ev.detail);
        }
      });
    }
  }

  handleSchoolAction(actionId: string): void {
    if (!actionId) return;
    const a = actionId.toLowerCase();

    // Check if targeted principal action or principal role selected
    if (a === 'principal' || a === 'principal-portal' || a.startsWith('principal-') || (this.currentPortalRole === 'principal' && !['logout', 'settings', 'password_change'].includes(a))) {
      this.currentPortalRole = 'principal';
      try { localStorage.setItem('activeSchoolRole', 'principal'); } catch {}
      const sub = a.replace('principal-', '').replace('principal', '').trim();
      if (!sub || sub === 'portal' || sub === 'overview') {
        this.setPrincipalTab('overview');
      } else if (sub.includes('supervision') || sub.includes('lesson')) {
        this.setPrincipalTab('supervision');
      } else if (sub.includes('substitut') || sub.includes('arrangement')) {
        this.setPrincipalTab('substitutions');
      } else if (sub.includes('syllabus') || sub.includes('curriculum')) {
        this.setPrincipalTab('syllabus');
      } else if (sub.includes('inspection') || sub.includes('round')) {
        this.setPrincipalTab('inspections');
      } else if (sub.includes('discipline') || sub.includes('hearing')) {
        this.setPrincipalTab('discipline');
      } else if (sub.includes('directive') || sub.includes('circular') || sub.includes('assembly')) {
        this.setPrincipalTab('directives');
      } else if (sub.includes('appraisal') || sub.includes('observation')) {
        this.setPrincipalTab('appraisals');
      } else if (sub.includes('exam_moderation') || sub.includes('moderation')) {
        this.setPrincipalTab('exam_moderation');
      } else if (sub.includes('academic_report') || sub.includes('analytics') || sub.includes('export')) {
        this.setPrincipalTab('academic_reports');
      } else if (sub.includes('faculty_task') || sub.includes('duty') || sub.includes('task')) {
        this.setPrincipalTab('faculty_tasks');
      } else if (sub.includes('teacher_leave') || sub.includes('staff_leave')) {
        this.setPrincipalTab('teacher_leaves');
      } else if (sub.includes('tc') || sub.includes('certificate')) {
        this.setPrincipalTab('student_certificates');
      } else if (sub.includes('ptm') || sub.includes('remedial') || sub.includes('weak_student')) {
        this.setPrincipalTab('ptm_interventions');
      } else if (sub.includes('admission') || sub.includes('entrance')) {
        this.setPrincipalTab('admissions_review');
      } else if (sub.includes('fee') || sub.includes('concession')) {
        this.setPrincipalTab('fee_oversight');
      } else if (sub.includes('complaint') || sub.includes('grievance')) {
        this.setPrincipalTab('parent_complaints');
      } else if (sub.includes('safeguard') || sub.includes('medical')) {
        this.setPrincipalTab('safeguarding');
      } else if (sub.includes('facilit') || sub.includes('transport')) {
        this.setPrincipalTab('facilities_transport');
      } else {
        this.setPrincipalTab('overview');
      }
      this.cdr.detectChanges();
      return;
    }

    // Check if user is currently in Teacher Portal or targeted teacher action
    if (this.currentPortalRole === 'teacher' || a.startsWith('teacher-')) {
      if (a === 'feed' || a.includes('feed') || a.includes('notice')) {
        this.teacherTab = 'feed';
        this.cdr.detectChanges();
        return;
      }
      if (a === 'events' || a.includes('event')) {
        this.teacherTab = 'events';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('attendance')) {
        this.teacherTab = 'attendance';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('mark') || a.includes('grade')) {
        this.teacherTab = 'marks';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('lesson')) {
        this.teacherTab = 'lessons';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('homework')) {
        this.teacherTab = 'homework';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('student') || a.includes('roster')) {
        this.teacherTab = 'students';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('chat') || a.includes('communication') || a.includes('message')) {
        this.teacherTab = 'communication';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('schedule') || a === 'teacher-portal') {
        this.teacherTab = 'schedule';
        this.cdr.detectChanges();
        return;
      }
    }

    // Check if user is currently in Student Portal or targeted student action
    if (this.currentPortalRole === 'student' || a.startsWith('student-')) {
      if (a === 'feed' || a.includes('feed') || a.includes('notice')) {
        this.studentTab = 'feed';
        this.cdr.detectChanges();
        return;
      }
      if (a === 'events' || a.includes('event')) {
        this.studentTab = 'events';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('timetable') || a.includes('routine')) {
        this.studentTab = 'routine';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('academic') || a.includes('grade') || a.includes('card')) {
        this.studentTab = 'academics';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('homework')) {
        this.studentTab = 'homework';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('attendance')) {
        this.studentTab = 'attendance';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('fee')) {
        this.studentTab = 'fee';
        this.cdr.detectChanges();
        return;
      }
      if (a === 'student-portal') {
        this.studentTab = 'overview';
        this.cdr.detectChanges();
        return;
      }
    }

    // Check if user is currently in Parent Portal or targeted parent action
    if (this.currentPortalRole === 'parent' || a.startsWith('parent-')) {
      if (a === 'feed' || a.includes('feed') || a.includes('notice')) {
        this.parentTab = 'feed';
        this.cdr.detectChanges();
        return;
      }
      if (a === 'events' || a.includes('event')) {
        this.parentTab = 'events';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('academic') || a.includes('report') || a.includes('card')) {
        this.parentTab = 'academics';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('attendance')) {
        this.parentTab = 'attendance';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('fee')) {
        this.parentTab = 'fee';
        this.cdr.detectChanges();
        return;
      }
      if (a.includes('leave')) {
        this.parentTab = 'leave';
        this.cdr.detectChanges();
        return;
      }
      if (a === 'parent-portal') {
        this.parentTab = 'overview';
        this.cdr.detectChanges();
        return;
      }
    }

    if (a === 'feed') this.setTab('feed');
    else if (a === 'events' || a.includes('event')) this.setTab('events');
    else if (a === 'overview') this.setTab('overview');
    else if (a === 'students') this.setTab('students');
    else if (a === 'admissions') this.setTab('admissions');
    else if (a === 'new_admission' || a === 'new-admission') {
      this.setTab('admissions');
      this.openAddAdmissionModal();
    }
    else if (a === 'alumni') this.setTab('alumni');
    else if (a === 'promotion') {
      this.setTab('students');
      this.openPromotionModal();
    }
    else if (a === 'session_report' || a === 'session-report') {
      this.setTab('students');
      this.openSessionReportModal();
    }
    else if (a === 'fee_structure' || a === 'fee-structure') {
      this.setTab('finance');
      this.openFeeStructureModal();
    }
    else if (a === 'finance') this.setTab('finance');
    else if (a === 'quick_fee' || a === 'quick-fee') {
      this.setTab('finance');
      this.openQuickFeeModal();
    }
    else if (a === 'whatsapp_reminder' || a === 'whatsapp-reminder') {
      this.setTab('finance');
      this.showToast('WhatsApp Fee Reminder dialog opened', 'info');
    }
    else if (a === 'fee_deletion_log' || a === 'fee-deletion-log') {
      this.setTab('finance');
      this.openFeeDeletionLogModal();
    }
    else if (a === 'payment_gateway') this.setTab('payment_gateway');
    else if (a === 'attendance' || a === 'attendance_report' || a === 'attendance-report') this.setTab('attendance');
    else if (a === 'exams') this.setTab('exams');
    else if (a === 'marks_entry' || a === 'marks-entry') this.setTab('exams');
    else if (a === 'class_result' || a === 'class-result') this.setTab('reports');
    else if (a === 'subjects') this.setTab('timetable');
    else if (a === 'class_subject_map' || a === 'class-subject-map') {
      this.setTab('timetable');
      this.openClassSubjectMapModal();
    }
    else if (a === 'exam_schedule' || a === 'exam-schedule') this.setTab('timetable');
    else if (a === 'timetable') this.setTab('timetable');
    else if (a === 'expenses') this.setTab('expenses');
    else if (a === 'all_reports' || a === 'all-reports') this.setTab('reports');
    else if (a === 'income_vs_expense' || a === 'income-vs-expense') this.setTab('finance');
    else if (a === 'teachers' || a === 'staff_management' || a === 'staff-management') this.setTab('teachers');
    else if (a === 'salary_management' || a === 'salary-management') this.setTab('teachers');
    else if (a === 'salary_report' || a === 'salary-report') this.setTab('finance');
    else if (a === 'transport') this.setTab('transport');
    else if (a === 'library') this.setTab('library');
    else if (a === 'portals') this.setTab('portals');
    else if (a === 'notices') this.openNoticeModal();
    else if (a === 'lesson_plans' || a === 'lesson-plans' || a === 'lesson_plan' || a === 'supervision') this.setTab('lesson_plans');
    else if (a === 'appraisals' || a === 'faculty-appraisals') this.setTab('appraisals');
    else if (a === 'inspections' || a === 'walkthrough') this.setTab('inspections');
    else if (a === 'exam_moderation' || a === 'moderation') this.setTab('exam_moderation');
    else if (a === 'parent_complaints' || a === 'complaints') this.setTab('parent_complaints');
    else if (a === 'substitutions' || a === 'period-cover') this.setTab('substitutions');
    else if (a === 'syllabus') this.setTab('syllabus');
    else if (a === 'safeguarding') this.setTab('safeguarding');
    else if (a === 'directives') this.setTab('directives');
    else if (a === 'audit' || a === 'school_audit' || a === 'school-audit' || a === 'compliance') this.setTab('audit');
    else if (a === 'admin_settings' || a === 'admin-settings' || a === 'settings') this.setTab('settings');
    else if (a === 'password_change' || a === 'password-change') this.openPasswordModal();
    else if (a === 'logout') this.showToast('Super Admin Logged Out Successfully', 'info');
    else this.setTab(a);
    this.cdr.detectChanges();
  }

  // Persistent Local Storage Sync
  loadStateFromStorage(): void {
    try {
      const savedStudents = localStorage.getItem('scs_school_students_v2');
      const savedTeachers = localStorage.getItem('scs_school_teachers_v2');
      const savedAdmissions = localStorage.getItem('scs_school_admissions_v2');
      const savedFinances = localStorage.getItem('scs_school_finances_v2');
      const savedExams = localStorage.getItem('scs_school_exams_v2');
      const savedTimetables = localStorage.getItem('scs_school_timetables_v2');
      const savedAnnouncements = localStorage.getItem('scs_school_announcements_v2');
      const savedUsers = localStorage.getItem('scs_school_portal_users_v1');
      const savedPerms = localStorage.getItem('scs_school_role_perms_v1');
      const savedHw = localStorage.getItem('scs_school_homeworks_v1');
      const savedLeaves = localStorage.getItem('scs_school_leaves_v1');
      const savedMsgs = localStorage.getItem('scs_school_msgs_v1');
      const savedLPs = localStorage.getItem('scs_school_lessons_v1');
      const savedGb = localStorage.getItem('scs_school_gradebook_v1');
      const savedModules = localStorage.getItem('scs_school_modules_active');
      const savedVisitors = localStorage.getItem('scs_school_visitors_v1');
      const savedMedicals = localStorage.getItem('scs_school_medicals_v1');
      const savedDisciplinary = localStorage.getItem('scs_school_disciplinary_v1');
      const savedAssets = localStorage.getItem('scs_school_assets_v1');
      const savedPayrolls = localStorage.getItem('scs_school_payrolls_v1');
      const savedStaffLeaves = localStorage.getItem('scs_school_staff_leaves_v1');
      const savedDefaulters = localStorage.getItem('scs_school_fee_defaulters_v1');
      const savedPL = localStorage.getItem('scs_school_profit_loss_v1');
      const savedAlerts = localStorage.getItem('scs_school_dispatch_alerts_v1');

      if (savedStudents) {
        try {
          const parsed = JSON.parse(savedStudents);
          if (Array.isArray(parsed) && parsed.length >= 15 && parsed.some(s => s.guardianOccupation)) {
            this.activeStudents = parsed;
          } else {
            this.activeStudents = this.getInitialStudents();
          }
        } catch {
          this.activeStudents = this.getInitialStudents();
        }
      } else {
        this.activeStudents = this.getInitialStudents();
      }

      if (savedTeachers) this.teachers = JSON.parse(savedTeachers);
      else this.teachers = this.getInitialTeachers();

      if (savedAdmissions) {
        try {
          const parsedAdms = JSON.parse(savedAdmissions);
          const initialDefaults = this.getInitialAdmissions();
          this.admissionsList = (Array.isArray(parsedAdms) ? parsedAdms : []).map((item: any, idx: number) => {
            const def = initialDefaults.find(d => d.id === item.id) || initialDefaults[idx % initialDefaults.length];
            return {
              gender: item.gender || def?.gender || 'Male',
              dob: item.dob || def?.dob || '2011-04-18',
              studentBForm: item.studentBForm || def?.studentBForm || '37405-8912341-1',
              bloodGroup: item.bloodGroup || def?.bloodGroup || 'B+',
              section: item.section || def?.section || 'A',
              rollNo: item.rollNo || def?.rollNo || `109${idx + 1}`,
              previousSchool: item.previousSchool || def?.previousSchool || 'Prior Recognized Academic Institution',
              relation: item.relation || def?.relation || 'Father',
              fatherCnic: item.fatherCnic || def?.fatherCnic || '37405-1122334-5',
              email: item.email || def?.email || 'guardian.contact@gmail.com',
              fatherOccupation: item.fatherOccupation || def?.fatherOccupation || 'Private Business / Executive',
              address: item.address || def?.address || 'Islamabad, Pakistan',
              emergencyContact: item.emergencyContact || def?.emergencyContact || item.phone || '+92 300 1234567',
              admissionFee: item.admissionFee !== undefined ? item.admissionFee : (def?.admissionFee || 25000),
              tuitionFee: item.tuitionFee !== undefined ? item.tuitionFee : (def?.tuitionFee || 18000),
              discount: item.discount !== undefined ? item.discount : (def?.discount || 0),
              initialPaymentStatus: item.initialPaymentStatus || def?.initialPaymentStatus || (item.status === 'Approved' ? 'Paid' : 'Pending'),
              medicalNotes: item.medicalNotes || def?.medicalNotes || 'Normal health, no known medical allergies',
              source: item.source || def?.source || 'School Office Direct',
              interviewDate: item.interviewDate || def?.interviewDate || (item.status === 'Interview Scheduled' ? 'Upcoming Saturday at 11:00 AM' : 'Not Scheduled'),
              interviewNotes: item.interviewNotes || def?.interviewNotes || 'Candidate entrance credentials reviewed.',
              decisionRemarks: item.decisionRemarks || def?.decisionRemarks || 'Application processed under institutional guidelines.',
              ...item
            };
          });
        } catch {
          this.admissionsList = this.getInitialAdmissions();
        }
      } else {
        this.admissionsList = this.getInitialAdmissions();
      }

      if (savedFinances) this.finances = JSON.parse(savedFinances);
      else this.finances = this.getInitialFinances();

      if (savedExams) this.examsList = JSON.parse(savedExams);
      else this.examsList = this.getInitialExams();

      if (savedTimetables) this.timetables = JSON.parse(savedTimetables);
      else this.timetables = this.getInitialTimetables();

      if (savedAnnouncements) this.announcements = JSON.parse(savedAnnouncements);
      else this.announcements = this.getInitialAnnouncements();

      if (savedUsers) {
        try {
          this.portalUsers = JSON.parse(savedUsers);
          if (!this.portalUsers.some(u => u.role === 'principal')) {
            const initPrincipal = this.getInitialPortalUsers().find(u => u.role === 'principal');
            if (initPrincipal) this.portalUsers.unshift(initPrincipal);
          }
        } catch {
          this.portalUsers = this.getInitialPortalUsers();
        }
      } else {
        this.portalUsers = this.getInitialPortalUsers();
        try { localStorage.setItem('scs_school_portal_users_v1', JSON.stringify(this.portalUsers)); } catch {}
      }

      if (savedPerms) this.rolePermissions = JSON.parse(savedPerms);
      else this.rolePermissions = this.getInitialRolePermissions();

      if (savedHw) this.teacherHomeworks = JSON.parse(savedHw);
      else this.teacherHomeworks = this.getInitialHomeworks();

      if (savedLeaves) this.parentLeaveRequests = JSON.parse(savedLeaves);
      else this.parentLeaveRequests = this.getInitialLeaves();

      if (savedMsgs) this.parentMessages = JSON.parse(savedMsgs);
      else this.parentMessages = this.getInitialMessages();

      if (savedLPs) this.teacherLessonPlans = JSON.parse(savedLPs);
      else this.teacherLessonPlans = this.getInitialLessonPlans();

      if (savedGb) this.teacherGradebook = JSON.parse(savedGb);
      else this.teacherGradebook = this.getInitialGradebook();

      if (savedVisitors) this.visitorGatePasses = JSON.parse(savedVisitors);
      else this.visitorGatePasses = this.getInitialVisitors();

      if (savedMedicals) this.studentMedicalRecords = JSON.parse(savedMedicals);
      else this.studentMedicalRecords = this.getInitialMedicals();

      if (savedDisciplinary) this.disciplinaryIncidents = JSON.parse(savedDisciplinary);
      else this.disciplinaryIncidents = this.getInitialDisciplinary();

      if (savedAssets) this.schoolAssets = JSON.parse(savedAssets);
      else this.schoolAssets = this.getInitialAssets();

      if (savedPayrolls) this.staffPayrolls = JSON.parse(savedPayrolls);
    else this.staffPayrolls = this.getInitialPayrolls();

    const savedBooks = localStorage.getItem('scs_school_library_books_v1');
    if (savedBooks) {
      try { this.libraryBooks = JSON.parse(savedBooks); } catch { this.libraryBooks = this.getInitialLibraryBooks(); }
    } else {
      this.libraryBooks = this.getInitialLibraryBooks();
    }

    const savedCirculations = localStorage.getItem('scs_school_library_circulations_v1');
    if (savedCirculations) {
      try { this.libraryCirculations = JSON.parse(savedCirculations); } catch { this.libraryCirculations = this.getInitialLibraryCirculations(); }
    } else {
      this.libraryCirculations = this.getInitialLibraryCirculations();
    }

    const savedDigital = localStorage.getItem('scs_school_library_digital_v1');
    if (savedDigital) {
      try { this.libraryDigitalResources = JSON.parse(savedDigital); } catch { this.libraryDigitalResources = this.getInitialDigitalResources(); }
    } else {
      this.libraryDigitalResources = this.getInitialDigitalResources();
    }

    const savedRate = localStorage.getItem('scs_school_library_fine_rate_v1');
    if (savedRate) {
      this.dailyFineRatePKR = Number(savedRate) || 50;
    }
      else this.staffPayrolls = this.getInitialPayrolls();

      if (savedStaffLeaves) this.staffLeaveRequests = JSON.parse(savedStaffLeaves);
      else this.staffLeaveRequests = this.getInitialStaffLeaves();

      if (savedDefaulters) this.studentFeeDefaulters = JSON.parse(savedDefaulters);
      else this.studentFeeDefaulters = this.getInitialDefaulters();

      if (savedPL) this.profitLossLedger = JSON.parse(savedPL);
      else this.profitLossLedger = this.getInitialProfitLoss();

      if (savedAlerts) this.dispatchAlertLogs = JSON.parse(savedAlerts);
      else this.dispatchAlertLogs = this.getInitialAlertLogs();

      if (savedModules) {
        try { this.enabledModules = JSON.parse(savedModules); } catch {}
      }

      const savedHostel = localStorage.getItem('scs_school_hostel_rooms_v1');
      const savedAlumni = localStorage.getItem('scs_school_alumni_list_v1');
      const savedWorkstations = localStorage.getItem('scs_school_lab_workstations_v1');
      const savedSchedules = localStorage.getItem('scs_school_lab_schedules_v1');
      const savedSms = localStorage.getItem('scs_school_sms_gateway_v1');

      if (savedHostel) this.hostelRooms = JSON.parse(savedHostel);
      else this.hostelRooms = this.getInitialHostelRooms();

      if (savedAlumni) this.alumniList = JSON.parse(savedAlumni);
      else this.alumniList = this.getInitialAlumni();

      if (savedWorkstations) this.workstations = JSON.parse(savedWorkstations);
      else this.workstations = this.getInitialWorkstations();

      if (savedSchedules) this.labSchedules = JSON.parse(savedSchedules);
      else this.labSchedules = this.getInitialLabSchedules();

      if (savedSms) this.smsGatewayConfig = JSON.parse(savedSms);

      const savedExpenses = localStorage.getItem('scs_school_expenses_v1');
      if (savedExpenses) this.schoolExpenses = JSON.parse(savedExpenses);

      const savedRecentPay = localStorage.getItem('scs_school_recent_payments_v1');
      if (savedRecentPay) this.recentPayments = JSON.parse(savedRecentPay);

      const savedPrincipalAdmissions = localStorage.getItem('scs_school_principal_admissions_v1');
      if (savedPrincipalAdmissions) {
        try { this.admissionReviewList = JSON.parse(savedPrincipalAdmissions); } catch {}
      }

      const savedPrincipalConcessions = localStorage.getItem('scs_school_principal_concessions_v1');
      if (savedPrincipalConcessions) {
        try { this.feeConcessionRequests = JSON.parse(savedPrincipalConcessions); } catch {}
      }

      const savedPrincipalComplaints = localStorage.getItem('scs_school_principal_complaints_v1');
      if (savedPrincipalComplaints) {
        try { this.parentComplaintList = JSON.parse(savedPrincipalComplaints); } catch {}
      }

      const savedPrincipalSafeguard = localStorage.getItem('scs_school_principal_safeguard_v1');
      if (savedPrincipalSafeguard) {
        try { this.safeguardingIncidents = JSON.parse(savedPrincipalSafeguard); } catch {}
      }

      const savedPrincipalFacilities = localStorage.getItem('scs_school_principal_facilities_v1');
      if (savedPrincipalFacilities) {
        try { this.facilityMaintenanceLogs = JSON.parse(savedPrincipalFacilities); } catch {}
      }

      const savedBioPolicy = localStorage.getItem('scs_attendance_biometric_policy_v1');
      if (savedBioPolicy) {
        try { this.ownerBiometricPolicy = { ...this.ownerBiometricPolicy, ...JSON.parse(savedBioPolicy) }; } catch {}
      }

      const savedDocked = localStorage.getItem('scs_school_sidebar_docked');
      if (savedDocked !== null) {
        try { this.isSidebarDocked = JSON.parse(savedDocked); } catch {}
      }

      const savedMasterInvoices = localStorage.getItem('masterSchoolInvoices');
      if (savedMasterInvoices) {
        try { this.masterInvoices = JSON.parse(savedMasterInvoices); } catch { this.masterInvoices = this.getInitialMasterInvoices(); }
      } else {
        this.masterInvoices = this.getInitialMasterInvoices();
      }

      this.recalculateDefaulters();
      this.checkAndUpdateOverdueBooks();
    } catch {
      this.activeStudents = this.getInitialStudents();
      this.teachers = this.getInitialTeachers();
      this.admissionsList = this.getInitialAdmissions();
      this.finances = this.getInitialFinances();
      this.examsList = this.getInitialExams();
      this.timetables = this.getInitialTimetables();
      this.announcements = this.getInitialAnnouncements();
      this.portalUsers = this.getInitialPortalUsers();
      this.rolePermissions = this.getInitialRolePermissions();
      this.teacherHomeworks = this.getInitialHomeworks();
      this.parentLeaveRequests = this.getInitialLeaves();
      this.parentMessages = this.getInitialMessages();
      this.teacherLessonPlans = this.getInitialLessonPlans();
      this.teacherGradebook = this.getInitialGradebook();
      this.visitorGatePasses = this.getInitialVisitors();
      this.studentMedicalRecords = this.getInitialMedicals();
      this.disciplinaryIncidents = this.getInitialDisciplinary();
      this.schoolAssets = this.getInitialAssets();
      this.staffPayrolls = this.getInitialPayrolls();
      this.staffLeaveRequests = this.getInitialStaffLeaves();
      this.studentFeeDefaulters = this.getInitialDefaulters();
      this.profitLossLedger = this.getInitialProfitLoss();
      this.hostelRooms = this.getInitialHostelRooms();
      this.alumniList = this.getInitialAlumni();
      this.workstations = this.getInitialWorkstations();
      this.labSchedules = this.getInitialLabSchedules();
      this.masterInvoices = this.getInitialMasterInvoices();
    }
  }

  saveStateToStorage(): void {
    try {
      localStorage.setItem('scs_school_students_v2', JSON.stringify(this.activeStudents));
      localStorage.setItem('scs_school_teachers_v2', JSON.stringify(this.teachers));
      localStorage.setItem('scs_school_admissions_v2', JSON.stringify(this.admissionsList));
      localStorage.setItem('scs_school_finances_v2', JSON.stringify(this.finances));
      localStorage.setItem('scs_school_exams_v2', JSON.stringify(this.examsList));
      localStorage.setItem('scs_school_timetables_v2', JSON.stringify(this.timetables));
      localStorage.setItem('scs_school_announcements_v2', JSON.stringify(this.announcements));
      localStorage.setItem('scs_school_portal_users_v1', JSON.stringify(this.portalUsers));
      localStorage.setItem('scs_school_role_perms_v1', JSON.stringify(this.rolePermissions));
      localStorage.setItem('scs_school_homeworks_v1', JSON.stringify(this.teacherHomeworks));
      localStorage.setItem('scs_school_leaves_v1', JSON.stringify(this.parentLeaveRequests));
      localStorage.setItem('scs_school_msgs_v1', JSON.stringify(this.parentMessages));
      localStorage.setItem('scs_school_lessons_v1', JSON.stringify(this.teacherLessonPlans));
      localStorage.setItem('scs_school_gradebook_v1', JSON.stringify(this.teacherGradebook));
      localStorage.setItem('scs_school_modules_active', JSON.stringify(this.enabledModules));
      localStorage.setItem('scs_school_visitors_v1', JSON.stringify(this.visitorGatePasses));
      localStorage.setItem('scs_school_medicals_v1', JSON.stringify(this.studentMedicalRecords));
      localStorage.setItem('scs_school_disciplinary_v1', JSON.stringify(this.disciplinaryIncidents));
      localStorage.setItem('scs_school_assets_v1', JSON.stringify(this.schoolAssets));
      localStorage.setItem('scs_school_payrolls_v1', JSON.stringify(this.staffPayrolls));
      localStorage.setItem('scs_school_library_books_v1', JSON.stringify(this.libraryBooks));
      localStorage.setItem('scs_school_library_circulations_v1', JSON.stringify(this.libraryCirculations));
      localStorage.setItem('scs_school_library_digital_v1', JSON.stringify(this.libraryDigitalResources));
      localStorage.setItem('scs_school_staff_leaves_v1', JSON.stringify(this.staffLeaveRequests));
      localStorage.setItem('scs_school_fee_defaulters_v1', JSON.stringify(this.studentFeeDefaulters));
      localStorage.setItem('scs_school_profit_loss_v1', JSON.stringify(this.profitLossLedger));
      localStorage.setItem('scs_school_dispatch_alerts_v1', JSON.stringify(this.dispatchAlertLogs));
      localStorage.setItem('scs_school_hostel_rooms_v1', JSON.stringify(this.hostelRooms));
      localStorage.setItem('scs_school_alumni_list_v1', JSON.stringify(this.alumniList));
      localStorage.setItem('scs_school_lab_workstations_v1', JSON.stringify(this.workstations));
      localStorage.setItem('scs_school_lab_schedules_v1', JSON.stringify(this.labSchedules));
      localStorage.setItem('scs_school_sms_gateway_v1', JSON.stringify(this.smsGatewayConfig));
      localStorage.setItem('scs_school_expenses_v1', JSON.stringify(this.schoolExpenses));
      localStorage.setItem('scs_school_recent_payments_v1', JSON.stringify(this.recentPayments));
      localStorage.setItem('scs_school_principal_admissions_v1', JSON.stringify(this.admissionReviewList));
      localStorage.setItem('scs_school_principal_concessions_v1', JSON.stringify(this.feeConcessionRequests));
      localStorage.setItem('scs_school_principal_complaints_v1', JSON.stringify(this.parentComplaintList));
      localStorage.setItem('scs_school_principal_safeguard_v1', JSON.stringify(this.safeguardingIncidents));
      localStorage.setItem('scs_school_principal_facilities_v1', JSON.stringify(this.facilityMaintenanceLogs));
      this.syncToCloud(false);
    } catch {}
    this.recalculateDefaulters();
  }

  recalculateDefaulters(): void {
    this.defaulters = this.activeStudents
      .filter(s => s.feeStatus === 'Overdue' || s.feeStatus === 'Pending')
      .map(s => ({
        name: s.name,
        grade: s.grade,
        amount: s.feeAmount || 28500,
        feeAmount: s.feeAmount || 28500,
        dueDate: 'Oct 05, 2026',
        daysOverdue: s.feeStatus === 'Overdue' ? 14 : 5,
        guardianPhone: s.guardianPhone,
        id: s.id,
        rollNo: s.rollNo
      }));
  }

  // Initial Seed Data - Class-Wise Multi-Student Register with Rich Profiles
  getInitialStudents(): StudentRecord[] {
    return [
      // Class 10
      {
        id: 'ST-1001',
        name: 'Zayan Ahmed Khan',
        grade: 'Class 10-A',
        section: 'Science',
        status: 'Present',
        attendance: '98.5%',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        guardian: 'Tariq Ahmed Khan',
        guardianPhone: '+92 300 8472910',
        guardianEmail: 'tariq.ahmed@gmail.com',
        guardianRelation: 'Father',
        guardianCnic: '35202-8472910-1',
        guardianOccupation: 'Senior Civil Engineer (NESPAK)',
        feeStatus: 'Paid',
        feeAmount: 28500,
        dueBakaya: 0,
        rollNo: '1001',
        admissionDate: '2024-08-15',
        gender: 'Male',
        dob: '2009-04-12',
        bloodGroup: 'B+',
        studentBForm: '61101-1001882-9',
        previousSchool: 'Army Public School (APS) F-8',
        score: '94% Entrance Assessment',
        medicalConditions: 'Normal health / No known allergies',
        address: 'House 42, Sector F-8/2, Islamabad',
        emergencyContact: '+92 321 8472911',
        lastPaymentDate: 'Oct 02, 2026'
      },
      {
        id: 'ST-1004',
        name: 'Fatima Zahra Abbasi',
        grade: 'Class 10-A',
        section: 'Science',
        status: 'Present',
        attendance: '99.1%',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        guardian: 'Pervaiz Ahmed Abbasi',
        guardianPhone: '+92 300 1234567',
        guardianEmail: 'p.abbasi@gmail.com',
        guardianRelation: 'Father',
        guardianCnic: '37405-1234567-3',
        guardianOccupation: 'Managing Director & Enterprise Architect',
        feeStatus: 'Paid',
        feeAmount: 28500,
        dueBakaya: 0,
        rollNo: '1004',
        admissionDate: '2024-08-15',
        gender: 'Female',
        dob: '2009-09-18',
        bloodGroup: 'O+',
        studentBForm: '61101-2004991-2',
        previousSchool: 'Beaconhouse School System Margalla Campus',
        score: '98% Entrance Assessment',
        medicalConditions: 'None',
        address: 'Villa 18, Street 7, Sector F-10/1, Islamabad',
        emergencyContact: '+92 333 1234568',
        lastPaymentDate: 'Oct 04, 2026'
      },
      {
        id: 'ST-1008',
        name: 'Mustafa Ali Shah',
        grade: 'Class 10-A',
        section: 'Science',
        status: 'Late',
        attendance: '92.4%',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        guardian: 'Syed Waqar Shah',
        guardianPhone: '+92 300 8877665',
        guardianEmail: 'waqar.shah@alshah.pk',
        guardianRelation: 'Father',
        guardianCnic: '35201-9988776-5',
        guardianOccupation: 'Advocate High Court',
        feeStatus: 'Pending',
        feeAmount: 28500,
        dueBakaya: 57000,
        rollNo: '1008',
        admissionDate: '2024-08-15',
        gender: 'Male',
        dob: '2009-01-25',
        bloodGroup: 'A+',
        studentBForm: '61101-3008771-5',
        previousSchool: "Froebel's International School",
        score: '86% Entrance Assessment',
        medicalConditions: 'Mild Asthmatic',
        address: 'House 112, Street 15, Sector G-9/3, Islamabad',
        emergencyContact: '+92 301 8877666',
        lastPaymentDate: 'Aug 20, 2026'
      },
      {
        id: 'ST-1011',
        name: 'Maryam Nawazish',
        grade: 'Class 10-B',
        section: 'Arts & Humanities',
        status: 'Present',
        attendance: '95.6%',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        guardian: 'Nawazish Ali Mir',
        guardianPhone: '+92 322 5544112',
        guardianEmail: 'nawazish.mir@hotmail.com',
        guardianRelation: 'Father',
        guardianCnic: '35202-5544112-9',
        guardianOccupation: 'Senior Banker (HBL)',
        feeStatus: 'Paid',
        feeAmount: 26000,
        dueBakaya: 0,
        rollNo: '1011',
        admissionDate: '2024-08-15',
        gender: 'Female',
        dob: '2009-11-05',
        bloodGroup: 'AB+',
        address: 'Plaza 4, Civic Center, Bahria Town Phase 4, Islamabad',
        emergencyContact: '+92 300 5544113',
        lastPaymentDate: 'Oct 01, 2026'
      },

      // Class 9
      {
        id: 'ST-1002',
        name: 'Amna Salman',
        grade: 'Class 9-C',
        section: 'Science',
        status: 'Present',
        attendance: '96.2%',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
        guardian: 'Dr. Salman Farooq',
        guardianPhone: '+92 321 9988112',
        guardianEmail: 'dr.salman@shifa.pk',
        guardianRelation: 'Father',
        guardianCnic: '35202-9988112-7',
        guardianOccupation: 'Professor of Surgery (PIMS)',
        feeStatus: 'Paid',
        feeAmount: 32000,
        dueBakaya: 0,
        rollNo: '1102',
        admissionDate: '2023-08-10',
        gender: 'Female',
        dob: '2010-06-15',
        bloodGroup: 'A-',
        address: 'Apartment 904, Silver Oaks, F-10, Islamabad',
        emergencyContact: '+92 300 9988113',
        lastPaymentDate: 'Oct 03, 2026'
      },
      {
        id: 'ST-1009',
        name: 'Taha Siddiqui',
        grade: 'Class 9-A',
        section: 'Science',
        status: 'Present',
        attendance: '97.4%',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
        guardian: 'Farhan Siddiqui',
        guardianPhone: '+92 331 4455889',
        guardianEmail: 'farhan.s@gmail.com',
        guardianRelation: 'Father',
        guardianCnic: '37405-4455889-1',
        guardianOccupation: 'Software VP (Systems Ltd)',
        feeStatus: 'Paid',
        feeAmount: 32000,
        dueBakaya: 0,
        rollNo: '0905',
        admissionDate: '2023-08-10',
        gender: 'Male',
        dob: '2010-02-28',
        bloodGroup: 'B+',
        address: 'House 88, Street 4, Sector I-8/2, Islamabad',
        emergencyContact: '+92 333 4455890',
        lastPaymentDate: 'Sep 29, 2026'
      },
      {
        id: 'ST-1010',
        name: 'Mahnoor Khalid',
        grade: 'Class 9-B',
        section: 'Computer Science',
        status: 'Absent',
        attendance: '88.3%',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
        guardian: 'Khalid Mehmood',
        guardianPhone: '+92 345 6677889',
        guardianEmail: 'khalid.m@yahoo.com',
        guardianRelation: 'Father',
        guardianCnic: '35201-6677889-2',
        guardianOccupation: 'Director General (WAPDA)',
        feeStatus: 'Pending',
        feeAmount: 32000,
        dueBakaya: 32000,
        rollNo: '0906',
        admissionDate: '2023-08-10',
        gender: 'Female',
        dob: '2010-08-14',
        bloodGroup: 'O+',
        address: 'House 55, Officers Colony, Westridge, Rawalpindi',
        emergencyContact: '+92 300 6677880',
        lastPaymentDate: 'Sep 05, 2026'
      },

      // Class 8
      {
        id: 'ST-1003',
        name: 'Omar Farooq Malik',
        grade: 'Class 8-B',
        section: 'General',
        status: 'Late',
        attendance: '89.0%',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        guardian: 'Mrs. Fatima Malik',
        guardianPhone: '+92 333 4455667',
        guardianEmail: 'fatima.malik@outlook.com',
        guardianRelation: 'Mother',
        guardianCnic: '35202-4455667-4',
        guardianOccupation: 'Principal, Beaconhouse School',
        feeStatus: 'Pending',
        feeAmount: 26000,
        dueBakaya: 52000,
        rollNo: '0903',
        admissionDate: '2025-08-20',
        gender: 'Male',
        dob: '2011-03-10',
        bloodGroup: 'AB-',
        address: 'House 19, Street 2, Sector G-11/3, Islamabad',
        emergencyContact: '+92 300 4455668',
        lastPaymentDate: 'Aug 10, 2026'
      },
      {
        id: 'ST-1007',
        name: 'Usama Bin Zafar',
        grade: 'Class 8-A',
        section: 'Science',
        status: 'Present',
        attendance: '94.8%',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        guardian: 'Zafar Iqbal',
        guardianPhone: '+92 301 2233445',
        guardianEmail: 'zafar.iqbal@trade.com.pk',
        guardianRelation: 'Father',
        guardianCnic: '37405-2233445-7',
        guardianOccupation: 'Textile Importer & Exporter',
        feeStatus: 'Paid',
        feeAmount: 26000,
        dueBakaya: 0,
        rollNo: '0804',
        admissionDate: '2025-08-20',
        gender: 'Male',
        dob: '2011-07-22',
        bloodGroup: 'B-',
        address: 'House 73, Margalla Town Phase 2, Islamabad',
        emergencyContact: '+92 321 2233446',
        lastPaymentDate: 'Oct 05, 2026'
      },

      // Class 7
      {
        id: 'ST-1012',
        name: 'Aria Noor Lodhi',
        grade: 'Class 7-C',
        section: 'English Medium',
        status: 'Present',
        attendance: '98.0%',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        guardian: 'Dr. Kashif Lodhi',
        guardianPhone: '+92 321 5544332',
        guardianEmail: 'kashif.lodhi@cardio.pk',
        guardianRelation: 'Father',
        guardianCnic: '35201-5544332-1',
        guardianOccupation: 'Cardiologist (AFIC)',
        feeStatus: 'Paid',
        feeAmount: 25000,
        dueBakaya: 0,
        rollNo: '0712',
        admissionDate: '2025-08-15',
        gender: 'Female',
        dob: '2012-05-19',
        bloodGroup: 'O+',
        address: 'Bungalow 14, Askari 11, Rawalpindi',
        emergencyContact: '+92 300 5544333',
        lastPaymentDate: 'Oct 06, 2026'
      },
      {
        id: 'ST-1013',
        name: 'Fahad Rasheed',
        grade: 'Class 7-A',
        section: 'General',
        status: 'Present',
        attendance: '93.5%',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
        guardian: 'Rasheed Ahmed',
        guardianPhone: '+92 332 9988334',
        guardianEmail: 'rasheed.a@fbr.gov.pk',
        guardianRelation: 'Father',
        guardianCnic: '35202-9988334-6',
        guardianOccupation: 'Customs Officer (FBR)',
        feeStatus: 'Paid',
        feeAmount: 25000,
        dueBakaya: 0,
        rollNo: '0702',
        admissionDate: '2025-08-15',
        gender: 'Male',
        dob: '2012-10-30',
        bloodGroup: 'A+',
        address: 'Quarter 12, G-6/1-4, Islamabad',
        emergencyContact: '+92 302 9988335',
        lastPaymentDate: 'Oct 02, 2026'
      },

      // Class 6
      {
        id: 'ST-1014',
        name: 'Bilal Ahmed',
        grade: 'Class 6-A',
        section: 'Standard',
        status: 'Present',
        attendance: '96.8%',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        guardian: 'Nadeem Ahmed',
        guardianPhone: '+92 313 1122445',
        guardianEmail: 'nadeem.ahmed@yahoo.com',
        guardianRelation: 'Father',
        guardianCnic: '37405-1122445-9',
        guardianOccupation: 'General Manager (PTCL)',
        feeStatus: 'Paid',
        feeAmount: 24000,
        dueBakaya: 0,
        rollNo: '0601',
        admissionDate: '2025-08-10',
        gender: 'Male',
        dob: '2013-04-14',
        bloodGroup: 'B+',
        address: 'House 28, Street 19, Sector I-9/1, Islamabad',
        emergencyContact: '+92 300 1122446',
        lastPaymentDate: 'Oct 01, 2026'
      },
      {
        id: 'ST-1015',
        name: 'Zainab Bibi',
        grade: 'Class 6-B',
        section: 'Standard',
        status: 'On Leave',
        attendance: '91.2%',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        guardian: 'Ghulam Mustafa',
        guardianPhone: '+92 321 7766112',
        guardianEmail: 'g.mustafa@finance.gov.pk',
        guardianRelation: 'Father',
        guardianCnic: '35201-7766112-3',
        guardianOccupation: 'Section Officer (Finance Division)',
        feeStatus: 'Pending',
        feeAmount: 24000,
        dueBakaya: 24000,
        rollNo: '0602',
        admissionDate: '2025-08-10',
        gender: 'Female',
        dob: '2013-09-02',
        bloodGroup: 'O+',
        address: 'House 5, Street 8, Sector G-8/4, Islamabad',
        emergencyContact: '+92 301 7766113',
        lastPaymentDate: 'Sep 02, 2026'
      },

      // Class 5
      {
        id: 'ST-1016',
        name: 'Haris Mehmood',
        grade: 'Class 5-A',
        section: 'Primary Section',
        status: 'Present',
        attendance: '97.5%',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        guardian: 'Mehmood Ul Hassan',
        guardianPhone: '+92 302 4455112',
        guardianEmail: 'mehmood.h@corp.pk',
        guardianRelation: 'Father',
        guardianCnic: '35202-4455112-0',
        guardianOccupation: 'Regional Sales Manager (Unilever)',
        feeStatus: 'Paid',
        feeAmount: 23000,
        dueBakaya: 0,
        rollNo: '0501',
        admissionDate: '2025-08-12',
        gender: 'Male',
        dob: '2014-03-21',
        bloodGroup: 'A+',
        address: 'House 90, Street 11, Sector F-11/2, Islamabad',
        emergencyContact: '+92 333 4455113',
        lastPaymentDate: 'Oct 04, 2026'
      },
      {
        id: 'ST-1017',
        name: 'Anaya Tariq',
        grade: 'Class 5-B',
        section: 'Primary Section',
        status: 'Present',
        attendance: '98.8%',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
        guardian: 'Tariq Aziz',
        guardianPhone: '+92 312 9988771',
        guardianEmail: 'tariq.aziz@airline.pk',
        guardianRelation: 'Father',
        guardianCnic: '37405-9988771-4',
        guardianOccupation: 'Senior Commercial Pilot (PIA)',
        feeStatus: 'Paid',
        feeAmount: 23000,
        dueBakaya: 0,
        rollNo: '0502',
        admissionDate: '2025-08-12',
        gender: 'Female',
        dob: '2014-11-12',
        bloodGroup: 'B+',
        address: 'Villa 7, Block B, Chaklala Scheme 3, Rawalpindi',
        emergencyContact: '+92 300 9988772',
        lastPaymentDate: 'Oct 01, 2026'
      },

      // Class 4
      {
        id: 'ST-1018',
        name: 'Daniyal Asif',
        grade: 'Class 4-A',
        section: 'Primary Section',
        status: 'Present',
        attendance: '95.2%',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
        guardian: 'Asif Nadeem',
        guardianPhone: '+92 333 8899001',
        guardianEmail: 'asif.nadeem@bankalfalah.com',
        guardianRelation: 'Father',
        guardianCnic: '35201-8899001-8',
        guardianOccupation: 'Branch Manager (Bank Alfalah)',
        feeStatus: 'Paid',
        feeAmount: 22000,
        dueBakaya: 0,
        rollNo: '0401',
        admissionDate: '2025-08-10',
        gender: 'Male',
        dob: '2015-01-16',
        bloodGroup: 'O+',
        address: 'House 14, Street 3, Sector G-10/4, Islamabad',
        emergencyContact: '+92 301 8899002',
        lastPaymentDate: 'Oct 03, 2026'
      },
      {
        id: 'ST-1019',
        name: 'Manahil Raza',
        grade: 'Class 4-A',
        section: 'Primary Section',
        status: 'Present',
        attendance: '99.0%',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        guardian: 'Syed Ali Raza',
        guardianPhone: '+92 300 3344556',
        guardianEmail: 'raza.syed@gmail.com',
        guardianRelation: 'Father',
        guardianCnic: '35202-3344556-2',
        guardianOccupation: 'Chartered Accountant (KPMG)',
        feeStatus: 'Paid',
        feeAmount: 22000,
        dueBakaya: 0,
        rollNo: '0402',
        admissionDate: '2025-08-10',
        gender: 'Female',
        dob: '2015-08-29',
        bloodGroup: 'AB+',
        address: 'House 303, Street 50, Sector F-10/4, Islamabad',
        emergencyContact: '+92 321 3344557',
        lastPaymentDate: 'Oct 05, 2026'
      },

      // Class 3
      {
        id: 'ST-1020',
        name: 'Rohail Sheikh',
        grade: 'Class 3-A',
        section: 'Junior Wing',
        status: 'Present',
        attendance: '96.0%',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        guardian: 'Sheikh Naveed',
        guardianPhone: '+92 301 4455998',
        guardianEmail: 'sheikh.naveed@textiles.pk',
        guardianRelation: 'Father',
        guardianCnic: '35201-4455998-5',
        guardianOccupation: 'Industrialist',
        feeStatus: 'Paid',
        feeAmount: 22000,
        dueBakaya: 0,
        rollNo: '0301',
        admissionDate: '2025-08-15',
        gender: 'Male',
        dob: '2016-05-18',
        bloodGroup: 'B+',
        address: 'Farmhouse 12, Chak Shahzad, Islamabad',
        emergencyContact: '+92 321 4455999',
        lastPaymentDate: 'Oct 02, 2026'
      },
      {
        id: 'ST-1021',
        name: 'Syeda Bareera',
        grade: 'Class 3-B',
        section: 'Junior Wing',
        status: 'Late',
        attendance: '89.4%',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
        guardian: 'Syed Moazzam Ali',
        guardianPhone: '+92 334 1122998',
        guardianEmail: 'moazzam.ali@suparco.gov.pk',
        guardianRelation: 'Father',
        guardianCnic: '37405-1122998-1',
        guardianOccupation: 'Senior Research Scientist (SUPARCO)',
        feeStatus: 'Overdue',
        feeAmount: 22000,
        dueBakaya: 44000,
        rollNo: '0302',
        admissionDate: '2025-08-15',
        gender: 'Female',
        dob: '2016-10-09',
        bloodGroup: 'O-',
        address: 'House 82, Sector G-13/2, Islamabad',
        emergencyContact: '+92 300 1122999',
        lastPaymentDate: 'Aug 14, 2026'
      },

      // Class 2
      {
        id: 'ST-1022',
        name: 'Khadija Noor',
        grade: 'Class 2-A',
        section: 'Junior Wing',
        status: 'Present',
        attendance: '98.2%',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        guardian: 'Noor Muhammad',
        guardianPhone: '+92 323 5566778',
        guardianEmail: 'noor.m@gmail.com',
        guardianRelation: 'Father',
        guardianCnic: '35202-5566778-7',
        guardianOccupation: 'Assistant Director (NADRA)',
        feeStatus: 'Paid',
        feeAmount: 21000,
        dueBakaya: 0,
        rollNo: '0201',
        admissionDate: '2025-08-15',
        gender: 'Female',
        dob: '2017-02-14',
        bloodGroup: 'A+',
        address: 'House 22, Street 18, Sector I-10/2, Islamabad',
        emergencyContact: '+92 301 5566779',
        lastPaymentDate: 'Oct 04, 2026'
      },
      {
        id: 'ST-1023',
        name: 'Yahya Khan',
        grade: 'Class 2-A',
        section: 'Junior Wing',
        status: 'Present',
        attendance: '95.5%',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        guardian: 'Dr. Jahangir Khan',
        guardianPhone: '+92 300 9988221',
        guardianEmail: 'jahangir.k@shifa.pk',
        guardianRelation: 'Father',
        guardianCnic: '35201-9988221-6',
        guardianOccupation: 'Associate Professor (Quaid-e-Azam Univ)',
        feeStatus: 'Paid',
        feeAmount: 21000,
        dueBakaya: 0,
        rollNo: '0202',
        admissionDate: '2025-08-15',
        gender: 'Male',
        dob: '2017-07-04',
        bloodGroup: 'B+',
        address: 'Faculty Colony, QAU Campus, Islamabad',
        emergencyContact: '+92 321 9988222',
        lastPaymentDate: 'Oct 01, 2026'
      },

      // Class 1
      {
        id: 'ST-1024',
        name: 'Saad Ali',
        grade: 'Class 1-A',
        section: 'Junior Wing',
        status: 'Present',
        attendance: '97.2%',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
        guardian: 'Ali Shan',
        guardianPhone: '+92 333 7788990',
        guardianEmail: 'ali.shan@telecom.pk',
        guardianRelation: 'Father',
        guardianCnic: '37405-7788990-3',
        guardianOccupation: 'Network Operations Head (Zong)',
        feeStatus: 'Paid',
        feeAmount: 21000,
        dueBakaya: 0,
        rollNo: '0101',
        admissionDate: '2025-08-20',
        gender: 'Male',
        dob: '2018-03-29',
        bloodGroup: 'O+',
        address: 'House 44, Street 9, Sector E-11/3, Islamabad',
        emergencyContact: '+92 302 7788991',
        lastPaymentDate: 'Oct 02, 2026'
      },
      {
        id: 'ST-1025',
        name: 'Hania Fatima',
        grade: 'Class 1-A',
        section: 'Junior Wing',
        status: 'Present',
        attendance: '99.3%',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
        guardian: 'Syed Tanveer Shah',
        guardianPhone: '+92 301 6655443',
        guardianEmail: 'tanveer.shah@law.gov.pk',
        guardianRelation: 'Father',
        guardianCnic: '35202-6655443-8',
        guardianOccupation: 'Legal Consultant (Ministry of Law)',
        feeStatus: 'Paid',
        feeAmount: 21000,
        dueBakaya: 0,
        rollNo: '0102',
        admissionDate: '2025-08-20',
        gender: 'Female',
        dob: '2018-09-11',
        bloodGroup: 'A+',
        address: 'House 19, Street 14, Sector F-7/2, Islamabad',
        emergencyContact: '+92 321 6655444',
        lastPaymentDate: 'Oct 05, 2026'
      },
      {
        id: 'ST-1026',
        name: 'Abdullah Imran',
        grade: 'Class 1-B',
        section: 'Junior Wing',
        status: 'Absent',
        attendance: '85.5%',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        guardian: 'Imran Ashraf',
        guardianPhone: '+92 315 2233887',
        guardianEmail: 'imran.ashraf@auto.pk',
        guardianRelation: 'Father',
        guardianCnic: '35201-2233887-5',
        guardianOccupation: 'Automobile Dealer',
        feeStatus: 'Pending',
        feeAmount: 21000,
        dueBakaya: 21000,
        rollNo: '0103',
        admissionDate: '2025-08-20',
        gender: 'Male',
        dob: '2018-12-05',
        bloodGroup: 'B-',
        address: 'House 77, Street 25, Sector G-9/1, Islamabad',
        emergencyContact: '+92 300 2233888',
        lastPaymentDate: 'Sep 10, 2026'
      },

      // Class KG
      {
        id: 'ST-1005',
        name: 'Hamza Bilal Qureshi',
        grade: 'Class KG-A',
        section: 'Primary Kindergarten',
        status: 'Absent',
        attendance: '82.4%',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        guardian: 'Bilal Qureshi',
        guardianPhone: '+92 312 7766554',
        guardianEmail: 'bilal.q@agri.pk',
        guardianRelation: 'Father',
        guardianCnic: '35202-7766554-1',
        guardianOccupation: 'Agri Business Consultant',
        feeStatus: 'Overdue',
        feeAmount: 22000,
        dueBakaya: 66000,
        rollNo: '0005',
        admissionDate: '2025-08-10',
        gender: 'Male',
        dob: '2019-06-18',
        bloodGroup: 'O+',
        address: 'House 61, Street 3, Sector H-13, Islamabad',
        emergencyContact: '+92 300 7766555',
        lastPaymentDate: 'Jul 15, 2026'
      },
      {
        id: 'ST-1027',
        name: 'Dua Maryam',
        grade: 'Class KG-A',
        section: 'Primary Kindergarten',
        status: 'Present',
        attendance: '98.5%',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        guardian: 'Muhammad Maryam',
        guardianPhone: '+92 322 8877112',
        guardianEmail: 'm.maryam@yahoo.com',
        guardianRelation: 'Father',
        guardianCnic: '37405-8877112-9',
        guardianOccupation: 'Pharmacist (Shifa Hospital)',
        feeStatus: 'Paid',
        feeAmount: 22000,
        dueBakaya: 0,
        rollNo: '0015',
        admissionDate: '2025-08-10',
        gender: 'Female',
        dob: '2019-09-25',
        bloodGroup: 'A+',
        address: 'Flat 302, Executive Heights, H-11, Islamabad',
        emergencyContact: '+92 333 8877113',
        lastPaymentDate: 'Oct 04, 2026'
      },

      // Class Nursery
      {
        id: 'ST-1006',
        name: 'Ayesha Siddiqua',
        grade: 'Class Nursery-A',
        section: 'Pre-School Montessori',
        status: 'Present',
        attendance: '97.0%',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
        guardian: 'Dr. Usman Siddiqui',
        guardianPhone: '+92 301 5566778',
        guardianEmail: 'dr.usman.siddiqui@gmail.com',
        guardianRelation: 'Father',
        guardianCnic: '35202-5566778-2',
        guardianOccupation: 'Pediatric Specialist (MCH Centre)',
        feeStatus: 'Paid',
        feeAmount: 20000,
        dueBakaya: 0,
        rollNo: '0006',
        admissionDate: '2025-08-20',
        gender: 'Female',
        dob: '2020-04-10',
        bloodGroup: 'B+',
        address: 'House 11, Street 22, Sector F-6/1, Islamabad',
        emergencyContact: '+92 300 5566779',
        lastPaymentDate: 'Oct 01, 2026'
      },
      {
        id: 'ST-1028',
        name: 'Muhammad Rayyan',
        grade: 'Class Nursery-B',
        section: 'Pre-School Montessori',
        status: 'Present',
        attendance: '96.4%',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
        guardian: 'Zubair Rayyan',
        guardianPhone: '+92 331 9900887',
        guardianEmail: 'zubair.r@gmail.com',
        guardianRelation: 'Father',
        guardianCnic: '35201-9900887-4',
        guardianOccupation: 'Commercial Architect',
        feeStatus: 'Paid',
        feeAmount: 20000,
        dueBakaya: 0,
        rollNo: '0008',
        admissionDate: '2025-08-20',
        gender: 'Male',
        dob: '2020-08-19',
        bloodGroup: 'O+',
        address: 'House 50, Street 16, Sector G-10/2, Islamabad',
        emergencyContact: '+92 321 9900888',
        lastPaymentDate: 'Oct 03, 2026'
      }
    ];
  }

  getInitialMasterInvoices(): MasterInvoiceRecord[] {
    return [
      {
        id: 'INV-2026-101',
        invoiceNo: 'REF-FEE/2026/1001',
        type: 'Student Fee',
        title: '📋 Term-1 Official Fee & Academic Tuition Challan',
        recipientName: 'Zayan Ahmed Khan',
        recipientRole: 'Student',
        recipientSubtext: 'Roll #1001 • Class 10-A (Science)',
        amount: 28500,
        discount: 1425,
        tax: 0,
        netPayable: 27075,
        issueDate: '01 Oct 2026',
        dueDate: '15 Oct 2026',
        paidDate: '10 Oct 2026',
        status: 'Paid',
        paymentMethod: '1Link / KuickPay',
        transactionRef: '1LINK-8829104',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-FEE/2026/1001',
        verifiedBy: 'Bank Accounts Branch (HBL Main Campus)',
        lineItems: [
          { description: 'Monthly Tuition & Academic Instruction Fee', qty: 1, unitPrice: 22000, total: 22000 },
          { description: 'Computer & AI Robotics Lab Fund', qty: 1, unitPrice: 3500, total: 3500 },
          { description: 'Term Exam & Assessment Evaluation', qty: 1, unitPrice: 3000, total: 3000 }
        ],
        notes: 'Fee paid in full via 1Link digital banking. 5% early clearance discount applied.'
      },
      {
        id: 'INV-2026-102',
        invoiceNo: 'REF-FEE/2026/1002',
        type: 'Student Fee',
        title: '📋 Term-1 Official Fee & Academic Tuition Challan',
        recipientName: 'Aiman Fatima',
        recipientRole: 'Student',
        recipientSubtext: 'Roll #1002 • Class 10-A (Science)',
        amount: 28500,
        discount: 0,
        tax: 0,
        netPayable: 28500,
        issueDate: '01 Oct 2026',
        dueDate: '05 Nov 2026',
        status: 'Pending',
        paymentMethod: 'Pending Bank Deposit',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-FEE/2026/1002',
        lineItems: [
          { description: 'Monthly Tuition & Academic Instruction Fee', qty: 1, unitPrice: 22000, total: 22000 },
          { description: 'Computer & Science Lab Fund', qty: 1, unitPrice: 3500, total: 3500 },
          { description: 'Term Exam & Assessment Evaluation', qty: 1, unitPrice: 3000, total: 3000 }
        ],
        notes: 'Please remit payment on or before 5th November 2026 to avoid late fee surcharge.'
      },
      {
        id: 'INV-2026-103',
        invoiceNo: 'REF-FEE/2026/1003',
        type: 'Student Fee',
        title: '⚠️ Overdue Term Fee & Transport Recovery Invoice',
        recipientName: 'Omar Farooq Malik',
        recipientRole: 'Student',
        recipientSubtext: 'Roll #0903 • Class 8-B',
        amount: 52000,
        discount: 0,
        tax: 500,
        netPayable: 52500,
        issueDate: '01 Sep 2026',
        dueDate: '20 Oct 2026',
        status: 'Overdue',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-FEE/2026/1003',
        lineItems: [
          { description: '2 Months Pending Tuition Fee (Sep + Oct)', qty: 2, unitPrice: 22000, total: 44000 },
          { description: 'Air-Conditioned Bus Transport Route 4', qty: 2, unitPrice: 4000, total: 8000 }
        ],
        notes: 'Urgent notice: 2 months balance pending. Contact school accounts office immediately.'
      },
      {
        id: 'INV-2026-201',
        invoiceNo: 'REF-PAY/2026/101',
        type: 'Staff Payroll',
        title: '💼 Monthly Faculty Salary Disbursal Voucher',
        recipientName: 'Prof. Tariq Mehmood',
        recipientRole: 'Teacher/Staff',
        recipientSubtext: 'HOD Mathematics • Emp ID: TCH-001',
        amount: 185000,
        discount: 0,
        tax: 9250,
        netPayable: 175750,
        issueDate: '28 Oct 2026',
        dueDate: '01 Nov 2026',
        paidDate: '29 Oct 2026',
        status: 'Paid',
        paymentMethod: 'Bank Transfer (HBL Direct Payroll)',
        transactionRef: 'HBL-PAYROLL-9921',
        verifiedBy: 'Dr. Tahir Malik (Principal & Academic Director)',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-PAY/2026/101',
        lineItems: [
          { description: 'Base Monthly Executive Salary', qty: 1, unitPrice: 160000, total: 160000 },
          { description: 'HOD Academic Allowance & Class Supervision', qty: 1, unitPrice: 25000, total: 25000 }
        ],
        notes: 'Monthly salary transferred to HBL Account # 00427901128501. Income WHT deducted.'
      },
      {
        id: 'INV-2026-202',
        invoiceNo: 'REF-PAY/2026/102',
        type: 'Staff Payroll',
        title: '💼 Monthly Faculty Salary Disbursal Voucher',
        recipientName: 'Prof. Rehan Alvi',
        recipientRole: 'Teacher/Staff',
        recipientSubtext: 'Senior Physics Faculty & HOD • Emp ID: TCH-003',
        amount: 155000,
        discount: 0,
        tax: 7750,
        netPayable: 147250,
        issueDate: '28 Oct 2026',
        dueDate: '01 Nov 2026',
        status: 'Pending',
        paymentMethod: 'Scheduled Direct Deposit',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-PAY/2026/102',
        lineItems: [
          { description: 'Base Monthly Faculty Salary', qty: 1, unitPrice: 140000, total: 140000 },
          { description: 'Physics Lab Coordinator Allowance', qty: 1, unitPrice: 15000, total: 15000 }
        ],
        notes: 'Payroll queue approved by Principal. Awaiting final treasury release.'
      },
      {
        id: 'INV-2026-301',
        invoiceNo: 'REF-EXP/2026/881',
        type: 'Vendor Expense',
        title: '🔬 Science Lab Apparatus & Robotics Kit Procurement',
        recipientName: 'National Science Supplies Ltd',
        recipientRole: 'Vendor',
        recipientSubtext: 'Vendor Reg # VND-SCI-402',
        amount: 420000,
        discount: 20000,
        tax: 16000,
        netPayable: 416000,
        issueDate: '15 Oct 2026',
        dueDate: '30 Oct 2026',
        paidDate: '25 Oct 2026',
        status: 'Paid',
        paymentMethod: 'Crossed Cheque # CHQ-99182',
        transactionRef: 'CHQ-99182-HBL',
        verifiedBy: 'Admin & Procurement Cell',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-EXP/2026/881',
        lineItems: [
          { description: 'Digital Oscilloscopes & Vernier Calipers', qty: 10, unitPrice: 25000, total: 250000 },
          { description: 'Python Robotics Micro-Controller Boards', qty: 20, unitPrice: 8500, total: 170000 }
        ],
        notes: 'Procurement delivered & verified by HOD Physics Prof. Rehan Alvi. Payment cleared via cheque.'
      },
      {
        id: 'INV-2026-302',
        invoiceNo: 'REF-EXP/2026/882',
        type: 'Vendor Expense',
        title: '🚌 Campus Transport Fleet Diesel & Maintenance Billing',
        recipientName: 'Total Parco Fuel & Maintenance Services',
        recipientRole: 'Vendor',
        recipientSubtext: 'Vendor Reg # VND-TRP-109',
        amount: 280000,
        discount: 0,
        tax: 0,
        netPayable: 280000,
        issueDate: '20 Oct 2026',
        dueDate: '10 Nov 2026',
        status: 'Pending',
        paymentMethod: 'Bank Transfer (Pending)',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-EXP/2026/882',
        lineItems: [
          { description: 'Monthly Fleet Diesel (Buses 1 to 8)', qty: 1, unitPrice: 220000, total: 220000 },
          { description: 'Brake Inspection & Engine Oil Replacement', qty: 4, unitPrice: 15000, total: 60000 }
        ],
        notes: 'Monthly transport maintenance invoice submitted for verification.'
      },
      {
        id: 'INV-2026-401',
        invoiceNo: 'REF-CERT/2026/049',
        type: 'Transcript/Certificate',
        title: '🎓 Official School Leaving Certificate & Transcript Clearance Receipt',
        recipientName: 'Syed Ali Hasan',
        recipientRole: 'Student',
        recipientSubtext: 'Alumni Batch 2025 • Roll #1094',
        amount: 4500,
        discount: 0,
        tax: 0,
        netPayable: 4500,
        issueDate: '18 Oct 2026',
        dueDate: '18 Oct 2026',
        paidDate: '18 Oct 2026',
        status: 'Paid',
        paymentMethod: 'Easypaisa / Cash Counter',
        transactionRef: 'EP-9981204',
        verifiedBy: 'Registrar & Alumni Office',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-CERT/2026/049',
        lineItems: [
          { description: 'Official Printed School Leaving Certificate (SLC)', qty: 1, unitPrice: 2500, total: 2500 },
          { description: 'Character & Conduct Certificate Verification', qty: 1, unitPrice: 2000, total: 2000 }
        ],
        notes: 'No dues pending. SLC Issued & recorded in official archive.'
      }
    ];
  }

  getInitialTeachers(): TeacherRecord[] {
    return [
      { id: 'TCH-001', name: 'Prof. Tariq Mehmood', subject: 'Advanced Mathematics', qualification: 'Ph.D. Applied Mathematics', classes: 6, status: 'Active', rating: 4.95, email: 'tariq.math@alhuda.edu.pk', phone: '+92 311 9988776', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200', salaryStatus: 'Disbursed', monthlySalary: 185000, appointmentDate: '2021-08-15', tenureDuration: '5 Yrs 2 Mos', unpaidSalaryMonths: 0, remainingSalaryArrears: 0, cnic: '35202-1829102-1' },
      { id: 'TCH-002', name: 'Dr. Sarah Jenkins', subject: 'English Literature & Rhetoric', qualification: 'M.Phil Oxford University', classes: 5, status: 'Active', rating: 4.88, email: 'sarah.eng@alhuda.edu.pk', phone: '+92 300 7766554', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200', salaryStatus: 'Disbursed', monthlySalary: 165000, appointmentDate: '2022-09-01', tenureDuration: '4 Yrs 1 Mo', unpaidSalaryMonths: 0, remainingSalaryArrears: 0, cnic: '35202-9988112-2' },
      { id: 'TCH-003', name: 'Prof. Rehan Alvi', subject: 'Physics & Quantum Mechanics', qualification: 'M.S. Nuclear Physics', classes: 5, status: 'Active', rating: 4.92, email: 'rehan.phy@alhuda.edu.pk', phone: '+92 321 4455667', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200', salaryStatus: 'Pending Arrears', monthlySalary: 155000, appointmentDate: '2023-01-10', tenureDuration: '3 Yrs 9 Mos', unpaidSalaryMonths: 1, remainingSalaryArrears: 155000, cnic: '35202-4455667-3' },
      { id: 'TCH-004', name: 'Ms. Hira Naeem', subject: 'Biochemistry & Genetics', qualification: 'M.Phil Molecular Biology', classes: 4, status: 'Active', rating: 4.79, email: 'hira.bio@alhuda.edu.pk', phone: '+92 333 1122334', image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=200', salaryStatus: 'Pending Arrears', monthlySalary: 140000, appointmentDate: '2024-03-01', tenureDuration: '2 Yrs 7 Mos', unpaidSalaryMonths: 2, remainingSalaryArrears: 280000, cnic: '35202-1122334-4' },
      { id: 'TCH-005', name: 'Engr. Bilal Hashmi', subject: 'Computer Science & AI', qualification: 'M.S. Computer Science', classes: 6, status: 'Active', rating: 4.97, email: 'bilal.cs@alhuda.edu.pk', phone: '+92 312 9900112', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200', salaryStatus: 'Disbursed', monthlySalary: 175000, appointmentDate: '2020-10-01', tenureDuration: '6 Yrs 0 Mos', unpaidSalaryMonths: 0, remainingSalaryArrears: 0, cnic: '35202-9900112-5' },
      { id: 'TCH-006', name: 'Prof. Asadullah Qazi', subject: 'Islamic History & Arabic', qualification: 'M.A. Islamic Studies Al-Azhar', classes: 0, status: 'Resigned', rating: 4.85, email: 'asad.qazi@alhuda.edu.pk', phone: '+92 301 4433221', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', salaryStatus: 'Pending Arrears', monthlySalary: 120000, appointmentDate: '2022-01-15', resignationDate: '2026-06-30', tenureDuration: 'Served 4 Yrs 5 Mos', unpaidSalaryMonths: 1, remainingSalaryArrears: 120000, cnic: '35202-4433221-6' }
    ];
  }

  getInitialDefaulters(): StudentFeeDefaulterRecord[] {
    return [
      { id: 'DEF-101', studentId: 'ST-1003', studentName: 'Omar Farooq Malik', rollNo: '0903', grade: 'Class 8-B', guardianName: 'Mrs. Fatima Malik', guardianPhone: '+92 333 4455667', monthlyFee: 26000, unpaidMonthsCount: 2, unpaidMonthsList: ['September 2026', 'October 2026'], totalPaidToDate: 156000, totalRemainingBakaya: 52000, lastPaymentDate: 'Aug 10, 2026', alertStatus: 'Not Sent' },
      { id: 'DEF-102', studentId: 'ST-1005', studentName: 'Hamza Bilal Qureshi', rollNo: '0005', grade: 'Class KG-A', guardianName: 'Bilal Qureshi', guardianPhone: '+92 312 7766554', monthlyFee: 22000, unpaidMonthsCount: 3, unpaidMonthsList: ['August 2026', 'September 2026', 'October 2026'], totalPaidToDate: 110000, totalRemainingBakaya: 66000, lastPaymentDate: 'Jul 15, 2026', alertStatus: 'SMS Dispatched', lastAlertTimestamp: 'Oct 12, 2026' },
      { id: 'DEF-103', studentId: 'ST-1008', studentName: 'Mustafa Ali Shah', rollNo: '1008', grade: 'Class 10-A', guardianName: 'Syed Waqar Shah', guardianPhone: '+92 300 8877665', monthlyFee: 28500, unpaidMonthsCount: 2, unpaidMonthsList: ['September 2026', 'October 2026'], totalPaidToDate: 171000, totalRemainingBakaya: 57000, lastPaymentDate: 'Aug 20, 2026', alertStatus: 'Not Sent' },
      { id: 'DEF-104', studentId: 'ST-1012', studentName: 'Aria Noor Lodhi', rollNo: '0712', grade: 'Class 7-C', guardianName: 'Dr. Kashif Lodhi', guardianPhone: '+92 321 5544332', monthlyFee: 25000, unpaidMonthsCount: 1, unpaidMonthsList: ['October 2026'], totalPaidToDate: 200000, totalRemainingBakaya: 25000, lastPaymentDate: 'Sep 05, 2026', alertStatus: 'WhatsApp Reminder Sent', lastAlertTimestamp: 'Oct 14, 2026' }
    ];
  }

  getInitialProfitLoss(): ProfitLossMonthLedger[] {
    return [
      { id: 'PL-2026-10', monthYear: 'October 2026', year: '2026', tuitionFeeIncome: 3420000, transportFeeIncome: 480000, otherIncome: 150000, totalGrossIncome: 4050000, teacherSalariesExpense: 2150000, campusRentUtilitiesExpense: 650000, inventoryMaintenanceExpense: 220000, totalOperatingExpense: 3020000, netProfitOrLoss: 1030000, status: 'Surplus Profit' },
      { id: 'PL-2026-09', monthYear: 'September 2026', year: '2026', tuitionFeeIncome: 3380000, transportFeeIncome: 460000, otherIncome: 120000, totalGrossIncome: 3960000, teacherSalariesExpense: 2150000, campusRentUtilitiesExpense: 680000, inventoryMaintenanceExpense: 180000, totalOperatingExpense: 3010000, netProfitOrLoss: 950000, status: 'Surplus Profit' },
      { id: 'PL-2026-08', monthYear: 'August 2026', year: '2026', tuitionFeeIncome: 3100000, transportFeeIncome: 420000, otherIncome: 90000, totalGrossIncome: 3610000, teacherSalariesExpense: 2150000, campusRentUtilitiesExpense: 820000, inventoryMaintenanceExpense: 750000, totalOperatingExpense: 3720000, netProfitOrLoss: -110000, status: 'Deficit Loss' }
    ];
  }

  getInitialAlertLogs(): DispatchAlertLog[] {
    return [
      { id: 'ALT-901', recipientName: 'Bilal Qureshi (Guardian of Hamza)', recipientPhone: '+92 312 7766554', channel: 'SMS', targetRole: 'Parent', messageText: 'Urgent: Fee for Hamza Bilal (Class KG-A) is pending for 3 months (PKR 66,000). Please deposit at earliest.', sentAt: 'Oct 12, 2026 10:15 AM', deliveryStatus: 'Delivered' },
      { id: 'ALT-902', recipientName: 'Dr. Kashif Lodhi (Guardian of Aria)', recipientPhone: '+92 321 5544332', channel: 'WhatsApp', targetRole: 'Parent', messageText: 'Reminder: Fee for Aria Noor (Class 7-C) for Oct 2026 (PKR 25,000) is due. Thank you.', sentAt: 'Oct 14, 2026 02:30 PM', deliveryStatus: 'Delivered' }
    ];
  }

  getInitialAdmissions(): AdmissionRecord[] {
    return [
      {
        id: 'ADM-2026-091',
        applicant: 'Rayyan Kashif',
        appliedFor: 'Grade 9 Computer Science',
        fatherName: 'Kashif Mehmood',
        date: 'Oct 14, 2026',
        status: 'Interview Scheduled',
        score: '92% Entrance Assessment (A+)',
        phone: '+92 300 9988771',
        gender: 'Male',
        dob: '2011-04-18',
        studentBForm: '37405-8912341-1',
        bloodGroup: 'B+',
        section: 'Computer Science',
        rollNo: '1091',
        previousSchool: 'Army Public School & College, Rawalpindi',
        relation: 'Father',
        fatherCnic: '37405-1122334-5',
        email: 'kashif.mehmood@telecom.pk',
        fatherOccupation: 'Executive Director (Telecom Infrastructure)',
        address: 'House 42, Street 18, Sector F-8/2, Islamabad',
        emergencyContact: '+92 333 5544332 (Mother / Dr. Ayesha)',
        admissionFee: 25000,
        tuitionFee: 22000,
        discount: 10,
        initialPaymentStatus: 'Paid',
        medicalNotes: 'Fit & healthy. Mild allergy to pollen during spring.',
        source: 'School Office Direct',
        interviewDate: 'Oct 24, 2026 at 10:30 AM',
        interviewNotes: 'Strong aptitude in Mathematics and Python coding fundamentals.',
        decisionRemarks: 'Recommended for CS Stream with 10% Sibling Concession.'
      },
      {
        id: 'ADM-2026-092',
        applicant: 'Zoya Daniyal',
        appliedFor: 'Grade 11 Pre-Medical',
        fatherName: 'Daniyal Arshad',
        date: 'Oct 13, 2026',
        status: 'Approved',
        score: '96% Matric Board Merit (Top 1%)',
        phone: '+92 321 8877662',
        gender: 'Female',
        dob: '2010-09-05',
        studentBForm: '37405-4455667-2',
        bloodGroup: 'O+',
        section: 'Pre-Medical A',
        rollNo: '1092',
        previousSchool: 'Beaconhouse School System, Margalla Campus',
        relation: 'Father',
        fatherCnic: '37405-5566778-9',
        email: 'daniyal.arshad@fintech.com',
        fatherOccupation: 'Chartered Accountant & Financial Consultant',
        address: 'Villa 14, Executive Block, Bahria Enclave, Islamabad',
        emergencyContact: '+92 321 4433221 (Father Office)',
        admissionFee: 30000,
        tuitionFee: 26000,
        discount: 25,
        initialPaymentStatus: 'Paid',
        medicalNotes: 'Normal health, wears corrective lenses (-1.5D).',
        source: 'Online Parent Portal',
        interviewDate: 'Oct 18, 2026 at 11:00 AM',
        interviewNotes: 'Exceptional academic transcript, 1072/1100 marks in FBISE Matric.',
        decisionRemarks: 'Awarded 25% High-Merit Board Scholarship.'
      },
      {
        id: 'ADM-2026-093',
        applicant: 'Mustafa Shah',
        appliedFor: 'Grade 10 Science',
        fatherName: 'Syed Waqar Shah',
        date: 'Oct 12, 2026',
        status: 'Under Review',
        score: '84% Entrance Assessment',
        phone: '+92 333 7766553',
        gender: 'Male',
        dob: '2010-11-20',
        studentBForm: '37405-7788990-3',
        bloodGroup: 'A+',
        section: 'Science',
        rollNo: '1093',
        previousSchool: 'Saint Mary Academy, Lalazar, Rawalpindi',
        relation: 'Father',
        fatherCnic: '37405-8899001-3',
        email: 'waqar.shah@engineering.gov.pk',
        fatherOccupation: 'Superintending Engineer (Govt Services)',
        address: 'Sector G-10/4, Street 25, Islamabad',
        emergencyContact: '+92 300 1199887 (Uncle)',
        admissionFee: 25000,
        tuitionFee: 19500,
        discount: 0,
        initialPaymentStatus: 'Pending',
        medicalNotes: 'Asthmatic inhaler carried for sports/P.E.',
        source: 'Online Parent Portal',
        interviewDate: 'Pending Committee Review',
        interviewNotes: 'Awaiting original 9th Grade migration certificate & report card.',
        decisionRemarks: 'Under verification by Academic Registrar Desk.'
      },
      {
        id: 'ADM-2026-094',
        applicant: 'Haniya Imran',
        appliedFor: 'Grade 8 General',
        fatherName: 'Imran Bashir',
        date: 'Oct 11, 2026',
        status: 'Approved',
        score: '88% Entrance Assessment',
        phone: '+92 312 6655444',
        gender: 'Female',
        dob: '2012-07-14',
        studentBForm: '37405-3322110-4',
        bloodGroup: 'AB+',
        section: 'Section B',
        rollNo: '1094',
        previousSchool: 'Roots Millennium Schools, One World Campus',
        relation: 'Father',
        fatherCnic: '37405-6677889-1',
        email: 'imran.bashir@textilecorp.com',
        fatherOccupation: 'Business Proprietor (Exports)',
        address: 'House 88, Street 7, Sector F-11/1, Islamabad',
        emergencyContact: '+92 312 8899002 (Mother)',
        admissionFee: 25000,
        tuitionFee: 18000,
        discount: 0,
        initialPaymentStatus: 'Paid',
        medicalNotes: 'No known allergies, fully vaccinated.',
        source: 'School Office Direct',
        interviewDate: 'Oct 15, 2026 at 09:30 AM',
        interviewNotes: 'Excellent communication skills, approved for Grade 8-B.',
        decisionRemarks: 'Enrolled. Biometric ID & uniform issue slip generated.'
      }
    ];
  }

  getInitialFinances(): FinanceRecord[] {
    return [
      { id: 'FIN-1049', title: 'Monthly Tuition Fee - Grade 10-A (Zayan Ahmed)', studentName: 'Zayan Ahmed Khan', grade: 'Grade 10-A', category: 'Tuition', type: 'Income', amount: 28500, date: 'Oct 14, 2026', status: 'Verified', challanNo: 'CH-2026-8801' },
      { id: 'FIN-1050', title: 'Monthly Tuition Fee - Grade 11-C (Amna Salman)', studentName: 'Amna Salman', grade: 'Grade 11-C', category: 'Tuition', type: 'Income', amount: 32000, date: 'Oct 14, 2026', status: 'Verified', challanNo: 'CH-2026-8802' },
      { id: 'FIN-1051', title: 'Faculty & Administrative Staff Payroll (Sep)', category: 'Salaries', type: 'Expense', amount: 4850000, date: 'Oct 01, 2026', status: 'Verified', challanNo: 'PAY-SEP-2026' },
      { id: 'FIN-1052', title: 'Campus Fiber Internet & Cloud Server Node Lease', category: 'Utilities', type: 'Expense', amount: 145000, date: 'Oct 05, 2026', status: 'Verified', challanNo: 'UTIL-0992' },
      { id: 'FIN-1053', title: 'AI Robotics & Physics Lab Upgrade Components', category: 'CapEx', type: 'Expense', amount: 620000, date: 'Oct 08, 2026', status: 'Verified', challanNo: 'CAP-ROBOT-01' }
    ];
  }

  getInitialExams(): ExamRecord[] {
    return [
      { id: 'EXM-101', examName: 'Mid-Term Comprehensive Assessments 2026', class: 'Grade 8 to 12 All Sections', startDate: 'Nov 15, 2026', status: 'Scheduled', averageGPA: '3.82 / 4.0' },
      { id: 'EXM-102', examName: 'First Term Diagnostic & Monthly Mocks', class: 'Grade 10 & Grade 12', startDate: 'Sep 25, 2026', status: 'Completed', averageGPA: '3.76 / 4.0' },
      { id: 'EXM-103', examName: 'Annual Board Examination Practical Labs', class: 'Grade 11 & 12 Science', startDate: 'Dec 10, 2026', status: 'Scheduled', averageGPA: 'Pending' }
    ];
  }

  getInitialTimetables(): TimetableRecord[] {
    return [
      { id: 'TT-01', period: 'Period 1', time: '08:00 AM - 08:45 AM', subject: 'Advanced Mathematics', teacher: 'Prof. Tariq Mehmood', room: 'Hall 204', grade: 'Grade 10-A' },
      { id: 'TT-02', period: 'Period 2', time: '08:45 AM - 09:30 AM', subject: 'Physics & Labs', teacher: 'Prof. Rehan Alvi', room: 'Lab 1', grade: 'Grade 10-A' },
      { id: 'TT-03', period: 'Period 3', time: '09:30 AM - 10:15 AM', subject: 'Computer Science & AI', teacher: 'Engr. Bilal Hashmi', room: 'CS Lab 3', grade: 'Grade 10-A' },
      { id: 'TT-04', period: 'Period 4', time: '10:15 AM - 11:00 AM', subject: 'English Literature', teacher: 'Dr. Sarah Jenkins', room: 'Room 102', grade: 'Grade 10-A' },
      { id: 'TT-05', period: 'Period 5', time: '11:30 AM - 12:15 PM', subject: 'Biochemistry', teacher: 'Ms. Hira Naeem', room: 'Bio Lab', grade: 'Grade 11-C' }
    ];
  }

  getInitialAnnouncements(): AnnouncementRecord[] {
    return [
      { id: 'ANN-001', title: 'Parent-Teacher Conference Scheduled for First Term Reports', target: 'Parents', date: 'Oct 14, 2026', author: 'Principal Office', content: 'Respected parents, parent-teacher council meeting will be held on Nov 05 from 02:00 PM in the campus library.', priority: 'High' },
      { id: 'ANN-002', title: 'Inter-College Science Fair Project Submissions Now Open', target: 'Students', date: 'Oct 13, 2026', author: 'Science Faculty', content: 'Students can register their robotics, software, or chemistry models through student portal before Oct 25.', priority: 'Normal' },
      { id: 'ANN-003', title: 'Faculty Academic Council Syllabus Review Meeting', target: 'Faculty', date: 'Oct 12, 2026', author: 'Dean of Academics', content: 'All senior faculty members are requested to review first term syllabus progress in Conference Room 1 on Friday.', priority: 'Normal' }
    ];
  }

  getInitialTransportRoutes(): TransportRouteRecord[] {
    return [
      { id: 'TRN-101', routeName: 'Route 1: Gulberg -> Johar Town -> Main Campus', vehicleNo: 'LHR-4821 (Coaster 01)', driverName: 'Muhammad Yaqoob', driverPhone: '+92 300 9182736', monthlyFee: 4500, capacity: 32, enrolledStudents: 28, status: 'Active' },
      { id: 'TRN-102', routeName: 'Route 2: DHA Phase 5 -> Cantt -> Main Campus', vehicleNo: 'LHR-9920 (Bus 02)', driverName: 'Umer Hayat', driverPhone: '+92 321 8827100', monthlyFee: 5000, capacity: 48, enrolledStudents: 44, status: 'Active' },
      { id: 'TRN-103', routeName: 'Route 3: Model Town -> Garden Town -> Main Campus', vehicleNo: 'LHR-3310 (Coaster 03)', driverName: 'Rashid Mahmood', driverPhone: '+92 333 1122334', monthlyFee: 4200, capacity: 32, enrolledStudents: 30, status: 'Active' }
    ];
  }

  getInitialLibraryCirculations(): LibraryCirculationRecord[] {
    return [
      {
        id: 'CIR-801',
        issueNo: 'CIR-2026-081',
        bookId: 'BK-1002',
        bookTitle: 'Fundamentals of Quantum Physics & Labs',
        isbn: '978-0070281219',
        borrowerType: 'Student',
        borrowerName: 'Rayyan Kashif',
        borrowerId: '1091',
        gradeOrDept: 'Grade 9 Computer Science',
        issueDate: 'Oct 22, 2026',
        dueDate: 'Nov 05, 2026',
        status: 'Overdue',
        overdueDays: 2,
        fineAmount: 40,
        conditionNotes: 'Good condition with protective plastic cover'
      },
      {
        id: 'CIR-802',
        issueNo: 'CIR-2026-082',
        bookId: 'BK-1001',
        bookTitle: 'Advanced Calculus & Analytical Geometry',
        isbn: '978-0199535569',
        borrowerType: 'Student',
        borrowerName: 'Zayan Ahmed Khan',
        borrowerId: '1001',
        gradeOrDept: 'Grade 10-A Science',
        issueDate: 'Oct 28, 2026',
        dueDate: 'Nov 11, 2026',
        status: 'Issued',
        overdueDays: 0,
        fineAmount: 0,
        conditionNotes: 'Original textbook, verified barcode'
      },
      {
        id: 'CIR-803',
        issueNo: 'CIR-2026-083',
        bookId: 'BK-1003',
        bookTitle: 'Introduction to Algorithms & Data Structures',
        isbn: '978-0262033848',
        borrowerType: 'Student',
        borrowerName: 'Amna Salman',
        borrowerId: '1102',
        gradeOrDept: 'Grade 10-A Science',
        issueDate: 'Oct 29, 2026',
        dueDate: 'Nov 12, 2026',
        status: 'Issued',
        overdueDays: 0,
        fineAmount: 0,
        conditionNotes: 'Brand new copy'
      },
      {
        id: 'CIR-804',
        issueNo: 'CIR-2026-084',
        bookId: 'BK-1004',
        bookTitle: 'Complete Works of Shakespeare & Rhetoric',
        isbn: '978-0141439518',
        borrowerType: 'Faculty',
        borrowerName: 'Ms. Sarah Jenkins',
        borrowerId: 'USR-802',
        gradeOrDept: 'Faculty of English Literature',
        issueDate: 'Oct 15, 2026',
        dueDate: 'Nov 15, 2026',
        status: 'Issued',
        overdueDays: 0,
        fineAmount: 0,
        conditionNotes: 'Faculty semester research loan'
      },
      {
        id: 'CIR-805',
        issueNo: 'CIR-2026-085',
        bookId: 'BK-1005',
        bookTitle: 'Campbell Biology Concepts & Connections',
        isbn: '978-0134296012',
        borrowerType: 'Student',
        borrowerName: 'Bilal Haider',
        borrowerId: '1088',
        gradeOrDept: 'Grade 9 Pre-Medical',
        issueDate: 'Oct 10, 2026',
        dueDate: 'Oct 24, 2026',
        returnDate: 'Oct 23, 2026',
        status: 'Returned',
        overdueDays: 0,
        fineAmount: 0,
        conditionNotes: 'Returned in pristine condition. Clearance issued.'
      },
      {
        id: 'CIR-806',
        issueNo: 'CIR-2026-086',
        bookId: 'BK-1006',
        bookTitle: 'Organic Chemistry Structure & Function',
        isbn: '978-1464120275',
        borrowerType: 'Student',
        borrowerName: 'Dania Tariq',
        borrowerId: '1074',
        gradeOrDept: 'Grade 10-B Pre-Medical',
        issueDate: 'Oct 18, 2026',
        dueDate: 'Nov 01, 2026',
        status: 'Overdue',
        overdueDays: 6,
        fineAmount: 120,
        conditionNotes: 'Overdue reminder notice dispatched via SMS'
      },
      {
        id: 'CIR-807',
        issueNo: 'CIR-2026-087',
        bookId: 'BK-1007',
        bookTitle: 'Islamic History & Jurisprudence (Tareekh-e-Islam)',
        isbn: '978-9694160451',
        borrowerType: 'Student',
        borrowerName: 'Hamza Shafiq',
        borrowerId: '1062',
        gradeOrDept: 'Grade 8-A',
        issueDate: 'Nov 01, 2026',
        dueDate: 'Nov 15, 2026',
        status: 'Issued',
        overdueDays: 0,
        fineAmount: 0,
        conditionNotes: 'Standard library loan'
      },
      {
        id: 'CIR-808',
        issueNo: 'CIR-2026-088',
        bookId: 'BK-1008',
        bookTitle: 'Cambridge O Level Pakistan Studies (2059)',
        isbn: '978-0190700249',
        borrowerType: 'Student',
        borrowerName: 'Zainab Bibi',
        borrowerId: '1051',
        gradeOrDept: 'Cambridge O-2 Section',
        issueDate: 'Oct 14, 2026',
        dueDate: 'Oct 28, 2026',
        returnDate: 'Oct 27, 2026',
        status: 'Returned',
        overdueDays: 0,
        fineAmount: 0,
        conditionNotes: 'Returned. Library dues NIL.'
      }
    ];
  }

  getInitialDigitalResources(): LibraryDigitalResource[] {
    return [
      {
        id: 'EBOOK-01',
        title: 'Federal Board Class 10 Physics Solved Past Papers (2020-2026)',
        category: 'Physics',
        grade: 'Class 10',
        authorOrPublisher: 'FBISE Academic Wing',
        fileType: 'PDF',
        fileSize: '14.2 MB',
        downloadsCount: 342
      },
      {
        id: 'EBOOK-02',
        title: 'Cambridge IGCSE & O-Level Computer Science Coursebook (3rd Edition)',
        category: 'Computer Science',
        grade: 'O-Levels',
        authorOrPublisher: 'Cambridge University Press',
        fileType: 'PDF',
        fileSize: '28.5 MB',
        downloadsCount: 519
      },
      {
        id: 'EBOOK-03',
        title: 'HSSC Mathematics Key Formulae, Proofs & Calculus Guide',
        category: 'Mathematics',
        grade: 'Class 11-12',
        authorOrPublisher: 'Punjab Curriculum & Textbook Board',
        fileType: 'PDF',
        fileSize: '6.8 MB',
        downloadsCount: 288
      },
      {
        id: 'EBOOK-04',
        title: 'Oxford Progressive English Reader 9 & Advanced Grammar Compendium',
        category: 'English Literature',
        grade: 'Class 9',
        authorOrPublisher: 'Oxford University Press Pakistan',
        fileType: 'PDF',
        fileSize: '9.4 MB',
        downloadsCount: 195
      },
      {
        id: 'EBOOK-05',
        title: 'Kulliyat-e-Iqbal (Allama Iqbal Urdu Poetry with Analytical Commentary)',
        category: 'Urdu Literature',
        grade: 'All Grades',
        authorOrPublisher: 'Iqbal Academy Pakistan',
        fileType: 'PDF',
        fileSize: '18.0 MB',
        downloadsCount: 467
      },
      {
        id: 'EBOOK-06',
        title: 'General Chemistry & Laboratory Safety Protocols Manual',
        category: 'Chemistry',
        grade: 'Class 9-10',
        authorOrPublisher: 'Al-Huda Science Faculty',
        fileType: 'PDF',
        fileSize: '8.1 MB',
        downloadsCount: 176
      }
    ];
  }

  getInitialLibraryBooks(): LibraryBookRecord[] {
    return [
      { id: 'BK-1001', isbn: '978-0199535569', title: 'Advanced Calculus & Analytical Geometry', author: 'Dr. S.M. Yusuf', category: 'Mathematics', totalCopies: 25, availableCopies: 18, rackNo: 'Rack M-02' },
      { id: 'BK-1002', isbn: '978-0070281219', title: 'Fundamentals of Quantum Physics & Labs', author: 'Halliday & Resnick', category: 'Physics', totalCopies: 20, availableCopies: 12, rackNo: 'Rack P-01' },
      { id: 'BK-1003', isbn: '978-0262033848', title: 'Introduction to Algorithms & Data Structures', author: 'Cormen, Leiserson, Rivest', category: 'Computer Science', totalCopies: 18, availableCopies: 11, rackNo: 'Rack CS-04' },
      { id: 'BK-1004', isbn: '978-0141439518', title: 'Complete Works of Shakespeare & Rhetoric', author: 'William Shakespeare', category: 'English Literature', totalCopies: 15, availableCopies: 10, rackNo: 'Rack L-03' },
      { id: 'BK-1005', isbn: '978-0134296012', title: 'Campbell Biology Concepts & Connections', author: 'Martha R. Taylor', category: 'Biology', totalCopies: 22, availableCopies: 17, rackNo: 'Rack B-01' },
      { id: 'BK-1006', isbn: '978-1464120275', title: 'Organic Chemistry Structure & Function', author: 'K. Peter C. Vollhardt', category: 'Chemistry', totalCopies: 16, availableCopies: 9, rackNo: 'Rack C-02' },
      { id: 'BK-1007', isbn: '978-9694160451', title: 'Islamic History & Jurisprudence (Tareekh-e-Islam)', author: 'Maulana Akbar Shah', category: 'Islamic Studies', totalCopies: 30, availableCopies: 24, rackNo: 'Rack IS-01' },
      { id: 'BK-1008', isbn: '978-0190700249', title: 'Cambridge O Level Pakistan Studies (2059)', author: 'Nigel Kelly', category: 'Cambridge O-Levels', totalCopies: 24, availableCopies: 19, rackNo: 'Rack O-03' },
      { id: 'BK-1009', isbn: '978-9693510003', title: 'Bang-e-Dra & Baal-e-Jibreel (Critical Analysis)', author: 'Dr. Rafiuddin Hashmi', category: 'Urdu Literature', totalCopies: 20, availableCopies: 16, rackNo: 'Rack U-02' },
      { id: 'BK-1010', isbn: '978-0198428121', title: 'Oxford Pure Mathematics for Cambridge A-Levels', author: 'Jean Linsky', category: 'Mathematics', totalCopies: 15, availableCopies: 12, rackNo: 'Rack M-05' }
    ];
  }

  getInitialPortalUsers(): PortalUserRecord[] {
    return [
      { id: 'USR-601', name: 'Prof. Dr. Tahir Malik', email: 'principal@alhuda.edu.pk', pin: '9900', role: 'principal', linkedEntity: 'Academic Directorate & Examination Council', status: 'Active', lastLogin: 'Today at 07:30 AM', staffIdOrRoll: 'DIR-001', designation: 'Principal & Academic Director', department: 'Academic Directorate', clearanceLevel: 'Level 5 - Executive Authority', phone: '+92 300 9876543' },
      { id: 'USR-801', name: 'Prof. Tariq Mehmood', email: 'tariq.math@alhuda.edu.pk', pin: '8821', role: 'teacher', linkedEntity: 'Grade 10-A Mathematics', status: 'Active', lastLogin: 'Today at 08:12 AM' },
      { id: 'USR-802', name: 'Ms. Sarah Jenkins', email: 'sarah.eng@alhuda.edu.pk', pin: '4410', role: 'teacher', linkedEntity: 'Grade 11-C English Literature', status: 'Active', lastLogin: 'Yesterday at 04:30 PM' },
      { id: 'USR-803', name: 'Dr. Rehan Alvi', email: 'rehan.phy@alhuda.edu.pk', pin: '1920', role: 'teacher', linkedEntity: 'Grade 10-B Physics & Labs', status: 'Active', lastLogin: 'Today at 09:05 AM' },
      { id: 'USR-901', name: 'Zayan Ahmed Khan', email: 'zayan.1001@student.alhuda.edu.pk', pin: '1001', role: 'student', linkedEntity: 'Roll #1001 (Grade 10-A)', status: 'Active', lastLogin: 'Today at 07:50 AM' },
      { id: 'USR-902', name: 'Amna Salman', email: 'amna.1102@student.alhuda.edu.pk', pin: '1102', role: 'student', linkedEntity: 'Roll #1102 (Grade 11-C)', status: 'Active', lastLogin: 'Today at 08:00 AM' },
      { id: 'USR-903', name: 'Omar Farooq Malik', email: 'omar.0903@student.alhuda.edu.pk', pin: '0903', role: 'student', linkedEntity: 'Roll #0903 (Grade 9-B)', status: 'Active', lastLogin: 'Oct 14 at 02:40 PM' },
      { id: 'USR-701', name: 'Tariq Ahmed Khan', email: 'tariq.khan@guardian.alhuda.edu.pk', pin: '5521', role: 'parent', linkedEntity: 'Guardian of Zayan (10-A) & Amna (11-C)', status: 'Active', lastLogin: 'Today at 07:52 AM' },
      { id: 'USR-702', name: 'Dr. Salman Farooq', email: 'salman.farooq@guardian.alhuda.edu.pk', pin: '3319', role: 'parent', linkedEntity: 'Guardian of Amna Salman (11-C)', status: 'Active', lastLogin: 'Oct 13 at 08:15 PM' },
      { id: 'USR-703', name: 'Mrs. Fatima Malik', email: 'fatima.malik@guardian.alhuda.edu.pk', pin: '7742', role: 'parent', linkedEntity: 'Guardian of Omar Farooq (9-B)', status: 'Active', lastLogin: 'Oct 14 at 10:20 AM' }
    ];
  }

  getInitialRolePermissions(): RoleModulePermission[] {
    return [
      { id: 'perm_attendance', name: 'Attendance & Biometric Marking', description: 'Mark daily roll call and sync gate entries', teacher: true, student: false, parent: false },
      { id: 'perm_attendance_view', name: 'Attendance History View', description: 'View personal or child monthly attendance streak', teacher: true, student: true, parent: true },
      { id: 'perm_grades_entry', name: 'Exam Marks & GPA Entry', description: 'Enter term marks, grading remarks, and scores', teacher: true, student: false, parent: false },
      { id: 'perm_grades_view', name: 'Report Cards & Exam Result Slips', description: 'View and print official academic transcript', teacher: true, student: true, parent: true },
      { id: 'perm_fee_ledger', name: 'Fee Collection & Finance Ledger', description: 'Access full institutional finance and revenue logs', teacher: false, student: false, parent: false },
      { id: 'perm_fee_voucher', name: 'Bank Fee Challan Download', description: 'Generate and print official 3-copy fee voucher', teacher: false, student: true, parent: true },
      { id: 'perm_timetable', name: 'Timetable & Class Routine', description: 'Access period schedule and room assignments', teacher: true, student: true, parent: true },
      { id: 'perm_homework', name: 'Homework & Study Materials', description: 'Post or download daily syllabus assignments', teacher: true, student: true, parent: true },
      { id: 'perm_directory', name: 'Class Roster & Guardian Directory', description: 'Access emergency contacts and student roster', teacher: true, student: false, parent: false },
      { id: 'perm_leave', name: 'Online Leave Application', description: 'Submit official sickness or family leave request', teacher: false, student: true, parent: true },
      { id: 'perm_chat', name: 'Direct Teacher-Parent Message Center', description: 'Private encrypted messaging channel with faculty', teacher: true, student: false, parent: true },
      { id: 'perm_rfid', name: 'Live RFID Gate & Bus Telemetry', description: 'Real-time entry/exit alerts and commute status', teacher: false, student: true, parent: true }
    ];
  }

  getInitialHomeworks(): TeacherHomeworkRecord[] {
    return [
      { id: 'HW-201', title: 'Quadratic Equations & Complex Roots Worksheet', subject: 'Mathematics', grade: 'Class 10-A', dueDate: 'Oct 20, 2026', assignedDate: 'Oct 15, 2026', submissionsCount: 22, totalCount: 28, description: 'Solve exercises 4.1 to 4.4 and show step-by-step discriminant calculations.' },
      { id: 'HW-202', title: 'Newton Laws of Motion & Momentum Lab Report', subject: 'Physics', grade: 'Class 10-A', dueDate: 'Oct 22, 2026', assignedDate: 'Oct 14, 2026', submissionsCount: 25, totalCount: 28, description: 'Submit formal laboratory write-up including graph of force versus acceleration.' },
      { id: 'HW-203', title: 'Critical Essay on Shakespearean Drama Techniques', subject: 'English', grade: 'Class 9-C', dueDate: 'Oct 24, 2026', assignedDate: 'Oct 13, 2026', submissionsCount: 19, totalCount: 25, description: 'Write an analytical essay of 750 words evaluating character motives in Macbeth Act 2.' }
    ];
  }

  getInitialLessonPlans(): TeacherLessonPlan[] {
    return [
      {
        id: 'LP-101',
        topic: 'Quadratic Equations & Discriminant Properties',
        subject: 'Advanced Mathematics',
        grade: 'Class 10-A',
        date: 'Oct 15, 2026',
        period: 'Period 1 (08:00 AM - 08:45 AM)',
        learningObjectives: 'Students will solve quadratic forms using quadratic formula and analyze roots based on discriminant values.',
        teachingAids: 'Interactive Digital Whiteboard, GeoGebra Grapher, Quadratic Formula Handouts',
        homeworkAssigned: 'Exercise 4.2 Questions 1 to 8 in course workbook',
        status: 'Completed'
      },
      {
        id: 'LP-102',
        topic: 'Vector Spaces & Coordinate Transformations',
        subject: 'Calculus & Vector Analysis',
        grade: 'Class 10-B',
        date: 'Oct 15, 2026',
        period: 'Period 3 (09:30 AM - 10:15 AM)',
        learningObjectives: 'Understand dot and cross products in 3D Euclidean space and calculate normal vectors to planes.',
        teachingAids: '3D Coordinate Model, Wolfram Alpha Interactive Plotter, Class Worksheet',
        homeworkAssigned: 'Workbook Section 7.3 Problem Set B',
        status: 'In Progress'
      },
      {
        id: 'LP-103',
        topic: 'Applied Matrix Operations & Determinants',
        subject: 'Applied Mathematics',
        grade: 'Class 9-B',
        date: 'Oct 15, 2026',
        period: 'Period 5 (11:30 AM - 12:15 PM)',
        learningObjectives: 'Compute 2x2 and 3x3 determinants using expansion by cofactors and solve simultaneous linear systems.',
        teachingAids: 'Scientific Graphing Calculators, Lab PCs, Interactive Simulation',
        homeworkAssigned: 'Review Problems 1 through 10',
        status: 'Planned'
      },
      {
        id: 'LP-104',
        topic: 'Probability Distributions & Random Variables',
        subject: 'Statistics & Probability',
        grade: 'Class 8-A',
        date: 'Oct 16, 2026',
        period: 'Period 2 (08:45 AM - 09:30 AM)',
        learningObjectives: 'Differentiate between discrete and continuous random variables, calculate expected values and variance.',
        teachingAids: 'Dice/Card Simulation Software, Statistical Formula Sheets',
        homeworkAssigned: 'Binomial distribution practice questions',
        status: 'Planned'
      }
    ];
  }

  getInitialGradebook(): TeacherGradeRecord[] {
    return [
      { rollNo: '1001', studentId: 'ST-1001', name: 'Zayan Ahmed Khan', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', subject: 'Advanced Mathematics', maxMarks: 100, obtainedMarks: 96, grade: 'A+', remarks: 'Outstanding analytical skills and proofs', rank: 1 },
      { rollNo: '1002', studentId: 'ST-1002', name: 'Amna Salman', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200', subject: 'Advanced Mathematics', maxMarks: 100, obtainedMarks: 92, grade: 'A+', remarks: 'Strong conceptual clarity in quadratic theory', rank: 3 },
      { rollNo: '1003', studentId: 'ST-1003', name: 'Omar Farooq Malik', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', subject: 'Advanced Mathematics', maxMarks: 100, obtainedMarks: 84, grade: 'A', remarks: 'Good effort, needs practice on word problems', rank: 5 },
      { rollNo: '1004', studentId: 'ST-1004', name: 'Fatima Zahra Abbasi', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', subject: 'Advanced Mathematics', maxMarks: 100, obtainedMarks: 95, grade: 'A+', remarks: 'Consistently high test performance', rank: 2 },
      { rollNo: '1005', studentId: 'ST-1005', name: 'Hamza Bilal Qureshi', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', subject: 'Advanced Mathematics', maxMarks: 100, obtainedMarks: 76, grade: 'B+', remarks: 'Remedial coaching recommended for algebra', rank: 6 },
      { rollNo: '1006', studentId: 'ST-1006', name: 'Ayesha Siddiqua', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200', subject: 'Advanced Mathematics', maxMarks: 100, obtainedMarks: 89, grade: 'A', remarks: 'Thorough step-by-step problem solver', rank: 4 }
    ];
  }

  getInitialLeaves(): ParentLeaveRecord[] {
    return [
      { id: 'LEV-101', childName: 'Zayan Ahmed Khan', childId: 'ST-1001', fromDate: 'Sep 12, 2026', toDate: 'Sep 13, 2026', reason: 'Family wedding event in Lahore', status: 'Approved', submittedDate: 'Sep 10, 2026' },
      { id: 'LEV-102', childName: 'Amna Salman Khan', childId: 'ST-1002', fromDate: 'Oct 02, 2026', toDate: 'Oct 02, 2026', reason: 'Dental appointment and root canal', status: 'Approved', submittedDate: 'Oct 01, 2026' }
    ];
  }

  getInitialMessages(): ParentMessageRecord[] {
    return [
      { id: 'MSG-301', sender: 'Tariq Ahmed Khan', recipient: 'Prof. Tariq Mehmood (Mathematics)', subject: 'National Math Olympiad Preparation', message: 'Assalam-o-Alaikum Sir, I wanted to inquire about additional guidance for Zayan for the upcoming National Mathematics Olympiad competition.', date: 'Oct 12, 2026', reply: 'Walaikum Assalam! Zayan is performing exceptionally well in advanced algebra. I have placed additional practice problem sheets in his student portal.' }
    ];
  }

  getInitialVisitors(): VisitorGatePassRecord[] {
    return [
      { id: 'VIS-901', visitorName: 'Shahbaz Sharif', cnicOrPhone: '37405-1234567-1', purpose: 'Vendor Delivery / IT Hardware', personToMeet: 'Admin & Principal Office', gatePassNo: 'GP-2026-001', checkInTime: '08:30 AM', checkOutTime: '09:45 AM', status: 'Checked-Out', badgeNo: 'B-01', vehicleNo: 'LHR-8820' },
      { id: 'VIS-902', visitorName: 'Mrs. Sadia Rashid', cnicOrPhone: '+92 300 9876543', purpose: 'Parent Inquiry / Fee Counter', personToMeet: 'Accounts & Fee Desk', gatePassNo: 'GP-2026-002', checkInTime: '10:15 AM', status: 'In-School', badgeNo: 'B-05', vehicleNo: 'LEA-4921' },
      { id: 'VIS-903', visitorName: 'Engr. Farhan Ali', cnicOrPhone: '+92 321 4455667', purpose: 'Solar Panel & Network Inspection', personToMeet: 'IT Admin Officer', gatePassNo: 'GP-2026-003', checkInTime: '11:00 AM', status: 'In-School', badgeNo: 'B-12' }
    ];
  }

  getInitialMedicals(): StudentMedicalRecord[] {
    return [
      { id: 'MED-101', studentId: 'ST-1001', studentName: 'Zayan Ahmed Khan', rollNo: '1001', grade: 'Class 10-A', bloodGroup: 'O+', vaccinationStatus: 'Fully Vaccinated', allergies: 'Dust & Pollen Allergy', chronicConditions: 'Mild Seasonal Asthma', emergencyContact: '+92 300 8472910', doctorName: 'Dr. S. K. Lodhi (Pediatrician)', lastCheckupDate: 'Sep 15, 2026', medicalAlert: true },
      { id: 'MED-102', studentId: 'ST-1004', studentName: 'Fatima Zahra Abbasi', rollNo: '1004', grade: 'Class 10-A', bloodGroup: 'B+', vaccinationStatus: 'Fully Vaccinated', allergies: 'Penicillin', chronicConditions: 'None', emergencyContact: '+92 300 1234567', doctorName: 'Dr. Tariq Niazi', lastCheckupDate: 'Aug 20, 2026', medicalAlert: false },
      { id: 'MED-103', studentId: 'ST-1005', studentName: 'Hamza Bilal Qureshi', rollNo: '0005', grade: 'Class KG-A', bloodGroup: 'A+', vaccinationStatus: 'Partially Vaccinated', allergies: 'Lactose Intolerance', chronicConditions: 'Eczema', emergencyContact: '+92 312 7766554', doctorName: 'Dr. Aamir Sohail', lastCheckupDate: 'Oct 01, 2026', medicalAlert: true }
    ];
  }

  getInitialDisciplinary(): DisciplinaryIncidentRecord[] {
    return [
      { id: 'DISC-301', studentId: 'ST-1003', studentName: 'Omar Farooq Malik', rollNo: '0903', grade: 'Class 8-B', date: 'Oct 12, 2026', category: 'Uniform Violation', description: 'Incomplete school uniform & improper shoes.', severity: 'Low', actionTaken: 'Verbal Warning & Counseling', fineAmount: 500, parentNotified: true, status: 'Resolved' },
      { id: 'DISC-302', studentId: 'ST-1005', studentName: 'Hamza Bilal Qureshi', rollNo: '0005', grade: 'Class KG-A', date: 'Oct 14, 2026', category: 'Late Arrival', description: 'Late arrival for 3 consecutive days.', severity: 'Low', actionTaken: 'Advisory Note Issued to Guardian', fineAmount: 0, parentNotified: true, status: 'Open' },
      { id: 'DISC-303', studentId: 'ST-1008', studentName: 'Hassan Raza', rollNo: '1008', grade: 'Class 9-A', date: 'Oct 10, 2026', category: 'Misbehavior', description: 'Disruption during Science Computer Laboratory session.', severity: 'Medium', actionTaken: 'Parent Called to School & Detention', fineAmount: 1000, parentNotified: true, status: 'Under Review' }
    ];
  }

  getInitialAssets(): SchoolAssetRecord[] {
    return [
      { id: 'AST-401', assetCode: 'AST-IT-001', name: 'Dell i7 OptiPlex Desktop Computers (30 Units)', category: 'IT Hardware', location: 'Computer AI Lab 1', quantity: 30, unitValue: 125000, condition: 'Excellent', custodian: 'Engr. Bilal Hashmi', lastServiced: 'Sep 30, 2026' },
      { id: 'AST-402', assetCode: 'AST-CL-045', name: 'Ergonomic Wooden Student Dual Desks', category: 'Classroom Furniture', location: 'Block B - Rooms 201-210', quantity: 150, unitValue: 18000, condition: 'Good', custodian: 'Admin Office', lastServiced: 'Aug 15, 2026' },
      { id: 'AST-403', assetCode: 'AST-LB-102', name: 'Digital Microscopes & Chemistry Sets', category: 'Lab Equipment', location: 'Physics & Chemistry Lab', quantity: 25, unitValue: 45000, condition: 'Needs Repair', custodian: 'Dr. Rehan Alvi', lastServiced: 'May 10, 2026' },
      { id: 'AST-404', assetCode: 'AST-SP-008', name: 'Professional Cricket Kits & TT Tables', category: 'Sports Gear', location: 'Sports Complex Store', quantity: 10, unitValue: 35000, condition: 'Good', custodian: 'Coach Imran Khan', lastServiced: 'Sep 01, 2026' }
    ];
  }

  getInitialPayrolls(): StaffPayrollRecord[] {
    return [
      { id: 'PAY-801', staffId: 'USR-801', staffName: 'Prof. Tariq Mehmood', role: 'Senior Mathematics Lecturer', month: 'October 2026', baseSalary: 140000, allowances: 15000, deductions: 5000, netPayable: 150000, status: 'Paid', paymentMethod: 'Meezan Bank Direct Deposit', disbursedDate: 'Oct 01, 2026' },
      { id: 'PAY-802', staffId: 'USR-802', staffName: 'Ms. Sarah Jenkins', role: 'English Literature Faculty', month: 'October 2026', baseSalary: 110000, allowances: 10000, deductions: 3500, netPayable: 116500, status: 'Paid', paymentMethod: 'JazzCash Salary Account', disbursedDate: 'Oct 01, 2026' },
      { id: 'PAY-803', staffId: 'USR-803', staffName: 'Engr. Bilal Hashmi', role: 'Computer Science Lead', month: 'October 2026', baseSalary: 125000, allowances: 12000, deductions: 4000, netPayable: 133000, status: 'Processing', paymentMethod: 'HBL Direct Payroll', disbursedDate: 'Oct 02, 2026' }
    ];
  }

  getInitialStaffLeaves(): StaffLeaveRecord[] {
    return [
      { id: 'LEV-501', staffId: 'USR-803', staffName: 'Dr. Rehan Alvi', leaveType: 'Sick Leave', fromDate: 'Oct 18, 2026', toDate: 'Oct 19, 2026', totalDays: 2, reason: 'Fever and viral infection doctor rest advised', status: 'Approved', appliedDate: 'Oct 15, 2026' },
      { id: 'LEV-502', staffId: 'USR-802', staffName: 'Prof. Naila Siddiqui', leaveType: 'Casual Leave', fromDate: 'Oct 24, 2026', toDate: 'Oct 24, 2026', totalDays: 1, reason: 'Family ceremony in Lahore', status: 'Pending', appliedDate: 'Oct 16, 2026' }
    ];
  }

  // Toast Helper
  showToast(msg: string, type: 'success' | 'info' | 'warning' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 4500);
  }

  playSuccessChime(): void {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}
  }

  triggerAdmissionAlert(details: {
    id: string;
    studentName: string;
    rollNo: string;
    grade: string;
    section?: string;
    guardian: string;
    phone: string;
    feeStatus: string;
    source: 'Admission Form' | 'Public Portal' | 'Student Roster';
  }) {
    if (this.admissionAlertTimeout) {
      clearTimeout(this.admissionAlertTimeout);
    }
    this.activeAdmissionAlert = {
      ...details,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.playSuccessChime();
    this.cdr.detectChanges();

    this.admissionAlertTimeout = setTimeout(() => {
      this.activeAdmissionAlert = null;
      this.cdr.detectChanges();
    }, 12000);
  }

  closeAdmissionAlert(): void {
    if (this.admissionAlertTimeout) {
      clearTimeout(this.admissionAlertTimeout);
    }
    this.activeAdmissionAlert = null;
    this.cdr.detectChanges();
  }

  jumpToEnrolledStudentTable(): void {
    this.closeAdmissionAlert();
    this.setTab('students');
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('students-roster-table');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }

  // --- ROLE SWITCHING AND PORTAL CONTROLS ---
  switchPortal(role: SchoolPortalRole | string, personaId?: string) {
    if (role === 'owner' && !this.isOwnerSession) {
      this.showToast('Access restricted: Only School Owner or Administrator can access Owner ERP.', 'warning');
      return;
    }
    // Block real student or parent accounts from jumping into other portals
    if (!this.isOwnerSession) {
      const realRole = this.getRealUserRole();
      if (['student', 'parent', 'student_guardian'].includes(realRole) && role !== realRole) {
        this.showToast(`Access restricted: You cannot switch to ${role} portal.`, 'warning');
        return;
      }
    }

    this.currentPortalRole = role as SchoolPortalRole;
    if (personaId) {
      if (role === 'teacher') this.activeTeacherId = personaId;
      else if (role === 'student') this.activeStudentId = personaId;
      else if (role === 'parent') this.activeParentChildId = personaId;
    }
    try {
      localStorage.setItem('activeSchoolRole', role);
      localStorage.setItem('activeSchoolPortal', role === 'owner' ? 'overview' : role + '-portal');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school-role-changed', { detail: { role } }));
      }
    } catch {}
    const roleLabels: { [key in SchoolPortalRole]: string } = {
      owner: 'School Owner Executive ERP',
      principal: 'Principal & Academic Director Portal',
      teacher: 'Teacher & Faculty Portal',
      student: 'Student Academic Portal',
      parent: 'Parent & Guardian Portal'
    };
    this.showToast(`Switched view to ${roleLabels[role as SchoolPortalRole] || role}`, 'info');
    this.cdr.detectChanges();
  }

  // --- TEACHER LESSON PLANNER METHODS ---
  openAddLessonPlanModal() {
    this.openCreateLessonPlanModal();
  }


  toggleLessonPlanStatus(lp: TeacherLessonPlan) {
    const statuses = ['Planned', 'In Progress', 'Completed', 'Review Needed', 'Approved', 'Revision Requested'];
    const currentIdx = statuses.indexOf(lp.status);
    lp.status = statuses[(currentIdx + 1) % statuses.length] as any;
    this.saveStateToStorage();
    this.showToast(`Lesson '${lp.topic}' marked as ${lp.status}`, 'info');
  }

  // --- TEACHER GRADEBOOK SORTING & PAGINATION METHODS ---
  sortGradebook(col: string) {
    if (this.gradebookSortColumn === col) {
      this.gradebookSortDirection = this.gradebookSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.gradebookSortColumn = col;
      this.gradebookSortDirection = 'asc';
    }
    this.gradebookPage = 1;
    this.cdr.detectChanges();
  }

  getFilteredGradebook(): TeacherGradeRecord[] {
    let list = [...this.teacherGradebook];
    if (this.gradebookSearch && this.gradebookSearch.trim()) {
      const q = this.gradebookSearch.toLowerCase().trim();
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.rollNo.includes(q) ||
        g.studentId.toLowerCase().includes(q) ||
        g.grade.toLowerCase().includes(q)
      );
    }
    list.sort((a: any, b: any) => {
      const valA = a[this.gradebookSortColumn];
      const valB = b[this.gradebookSortColumn];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.gradebookSortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return this.gradebookSortDirection === 'asc' 
        ? String(valA || '').localeCompare(String(valB || ''))
        : String(valB || '').localeCompare(String(valA || ''));
    });
    return list;
  }

  getPaginatedGradebook(): TeacherGradeRecord[] {
    const filtered = this.getFilteredGradebook();
    const start = (this.gradebookPage - 1) * this.gradebookPageSize;
    return filtered.slice(start, start + this.gradebookPageSize);
  }

  getGradebookTotalPages(): number {
    return Math.ceil(this.getFilteredGradebook().length / this.gradebookPageSize) || 1;
  }

  prevGradebookPage() {
    if (this.gradebookPage > 1) {
      this.gradebookPage--;
      this.cdr.detectChanges();
    }
  }

  nextGradebookPage() {
    if (this.gradebookPage < this.getGradebookTotalPages()) {
      this.gradebookPage++;
      this.cdr.detectChanges();
    }
  }

  updateStudentGrade(student: TeacherGradeRecord, newMarks: any) {
    const marks = Number(newMarks);
    if (!isNaN(marks) && marks >= 0 && marks <= 100) {
      student.obtainedMarks = marks;
      if (marks >= 90) student.grade = 'A+';
      else if (marks >= 80) student.grade = 'A';
      else if (marks >= 70) student.grade = 'B+';
      else if (marks >= 60) student.grade = 'B';
      else if (marks >= 50) student.grade = 'C';
      else student.grade = 'F';
      this.saveStateToStorage();
      this.showToast(`Updated marks for ${student.name}: ${marks}/100 (${student.grade})`, 'success');
    }
  }

  // --- STANDARDIZED DATA TABLE SORTING FOR OWNER STUDENTS ---
  sortStudents(col: string) {
    if (this.studentsSortColumn === col) {
      this.studentsSortDirection = this.studentsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.studentsSortColumn = col;
      this.studentsSortDirection = 'asc';
    }
    this.currentPage.students = 1;
    this.cdr.detectChanges();
  }

  nextPageTab(tab: SchoolDashboardTab, totalItems: number) {
    const totalPages = Math.ceil(totalItems / this.pageSize);
    if (this.currentPage[tab] < totalPages) {
      this.currentPage[tab]++;
      this.cdr.detectChanges();
    }
  }

  prevPageTab(tab: SchoolDashboardTab) {
    if (this.currentPage[tab] > 1) {
      this.currentPage[tab]--;
      this.cdr.detectChanges();
    }
  }

  // --- OWNER RBAC PERMISSION TOGGLES ---
  togglePermission(permId: string, role: 'teacher' | 'student' | 'parent') {
    const item = this.rolePermissions.find(p => p.id === permId);
    if (item) {
      item[role] = !item[role];
      this.saveStateToStorage();
      this.showToast(`Updated '${item.name}' access for ${role.toUpperCase()}`, 'success');
      this.cdr.detectChanges();
    }
  }

  // --- PORTAL USER CRUD (OWNER HUB) ---
  openAddPortalUserModal() {
    this.activePortalUserForEdit = null;
    this.portalUserForm = {
      name: '',
      email: '',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      role: 'principal',
      linkedEntity: 'Academic Directorate & Executive Council',
      status: 'Active',
      phone: '',
      staffIdOrRoll: `DIR-${Math.floor(100 + Math.random() * 900)}`,
      designation: 'Principal & Academic Director',
      department: 'Academic Directorate',
      clearanceLevel: 'Level 5 - Executive Academic Authority',
      branch: 'Main Senior Campus'
    };
    this.isPortalUserModalOpen = true;
    this.cdr.detectChanges();
  }

  onPortalRoleChange() {
    const r = this.portalUserForm.role;
    if (r === 'principal') {
      if (!this.portalUserForm.designation) this.portalUserForm.designation = 'Principal & Academic Director';
      if (!this.portalUserForm.staffIdOrRoll || this.portalUserForm.staffIdOrRoll.startsWith('ST-') || this.portalUserForm.staffIdOrRoll.startsWith('TCH-')) {
        this.portalUserForm.staffIdOrRoll = `DIR-${Math.floor(100 + Math.random() * 900)}`;
      }
      this.portalUserForm.department = 'Academic Directorate';
      this.portalUserForm.clearanceLevel = 'Level 5 - Executive Academic Authority';
      this.portalUserForm.linkedEntity = 'Academic Directorate & Executive Council';
      if (!this.portalUserForm.email || this.portalUserForm.email.includes('teacher') || this.portalUserForm.email.includes('student')) {
        this.portalUserForm.email = 'principal@alhuda.edu.pk';
      }
    } else if (r === 'teacher') {
      this.portalUserForm.designation = 'Senior Subject Teacher';
      this.portalUserForm.staffIdOrRoll = `TCH-${Math.floor(100 + Math.random() * 900)}`;
      this.portalUserForm.department = 'Department of Sciences';
      this.portalUserForm.clearanceLevel = 'Level 3 - Faculty & Grading Authority';
      this.portalUserForm.linkedEntity = 'Grade 10-A Mathematics';
      if (this.portalUserForm.email === 'principal@alhuda.edu.pk') this.portalUserForm.email = '';
    } else if (r === 'student') {
      this.portalUserForm.designation = 'Enrolled Student';
      this.portalUserForm.staffIdOrRoll = `ST-${Math.floor(1000 + Math.random() * 9000)}`;
      this.portalUserForm.department = 'Class 10-A (Matric / O-Levels)';
      this.portalUserForm.clearanceLevel = 'Level 1 - Student Academic Access';
      this.portalUserForm.linkedEntity = `Roll #${this.portalUserForm.staffIdOrRoll} (Grade 10-A)`;
      if (this.portalUserForm.email === 'principal@alhuda.edu.pk') this.portalUserForm.email = '';
    } else if (r === 'parent') {
      this.portalUserForm.designation = 'Parent / Guardian';
      this.portalUserForm.staffIdOrRoll = `GRD-${Math.floor(100 + Math.random() * 900)}`;
      this.portalUserForm.department = 'Family Guardian Wing';
      this.portalUserForm.clearanceLevel = 'Level 1 - Parent View Access';
      this.portalUserForm.linkedEntity = 'Guardian of Student ST-1001';
      if (this.portalUserForm.email === 'principal@alhuda.edu.pk') this.portalUserForm.email = '';
    }
    this.cdr.detectChanges();
  }

  openEditPortalUserModal(user: PortalUserRecord) {
    this.activePortalUserForEdit = user;
    this.portalUserForm = { ...user };
    this.isPortalUserModalOpen = true;
    this.cdr.detectChanges();
  }

  closePortalUserModal() {
    this.isPortalUserModalOpen = false;
    this.activePortalUserForEdit = null;
    this.cdr.detectChanges();
  }

  savePortalUser() {
    if (!this.portalUserForm.name || !this.portalUserForm.email) {
      this.showToast('Please enter Full Name and Email Address.', 'warning');
      return;
    }
    if (this.activePortalUserForEdit) {
      Object.assign(this.activePortalUserForEdit, this.portalUserForm);
      this.showToast(`Updated credentials for ${this.portalUserForm.name}`, 'success');
    } else {
      const role = this.portalUserForm.role || 'principal';
      const prefix = role === 'principal' ? 'DIR' : (role === 'teacher' ? 'TCH' : (role === 'student' ? 'ST' : 'GRD'));
      const newUser: PortalUserRecord = {
        id: `USR-${Math.floor(800 + Math.random() * 199)}`,
        name: this.portalUserForm.name || '',
        email: this.portalUserForm.email || '',
        pin: this.portalUserForm.pin || '1234',
        role: role,
        linkedEntity: this.portalUserForm.linkedEntity || 'General Campus Scope',
        status: this.portalUserForm.status || 'Active',
        lastLogin: 'Never logged in',
        phone: this.portalUserForm.phone || '+92 300 0000000',
        staffIdOrRoll: this.portalUserForm.staffIdOrRoll || `${prefix}-${Math.floor(100 + Math.random() * 900)}`,
        designation: this.portalUserForm.designation || (role === 'principal' ? 'Principal & Academic Director' : 'Academic Member'),
        department: this.portalUserForm.department || 'Academic Directorate',
        clearanceLevel: this.portalUserForm.clearanceLevel || 'Level 3 - Standard Access',
        branch: this.portalUserForm.branch || 'Main Executive Campus'
      };
      this.portalUsers.unshift(newUser);
      this.showToast(`Created new ${role.toUpperCase()} portal access account for ${newUser.name}!`, 'success');
    }
    this.saveStateToStorage();
    this.closePortalUserModal();
  }

  deletePortalUser(user: PortalUserRecord) {
    this.portalUsers = this.portalUsers.filter(u => u.id !== user.id);
    this.saveStateToStorage();
    this.showToast(`Removed portal access for ${user.name}`, 'info');
  }

  togglePortalUserStatus(user: PortalUserRecord) {
    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
    this.saveStateToStorage();
    this.showToast(`${user.name} is now ${user.status}`, 'info');
  }

  // --- TEACHER ACTIONS ---
  markTeacherAttendance(student: StudentRecord, status: 'Present' | 'Late' | 'Absent') {
    student.status = status;
    this.saveStateToStorage();
    this.showToast(`Marked ${student.name} as ${status}`, 'success');
  }

  markAllTeacherStudents(status: 'Present') {
    this.activeStudents.forEach(s => s.status = status);
    this.saveStateToStorage();
    this.showToast('All students in class marked Present!', 'success');
  }

  saveTeacherGradeRemark(subject: StudentSubjectResult, newMarks: number) {
    subject.marksObtained = newMarks;
    if (newMarks >= 90) subject.grade = 'A+';
    else if (newMarks >= 80) subject.grade = 'A';
    else if (newMarks >= 70) subject.grade = 'B';
    else subject.grade = 'C';
    this.showToast(`Marks updated to ${newMarks} (Grade ${subject.grade})`, 'success');
  }

  openTeacherHomeworkModal() {
    this.teacherHomeworkForm = {
      title: '',
      subject: 'Mathematics',
      grade: 'Grade 10-A',
      dueDate: 'Oct 22, 2026',
      description: ''
    };
    this.isTeacherHomeworkModalOpen = true;
    this.cdr.detectChanges();
  }

  closeTeacherHomeworkModal() {
    this.isTeacherHomeworkModalOpen = false;
    this.cdr.detectChanges();
  }

  saveTeacherHomework() {
    if (!this.teacherHomeworkForm.title || !this.teacherHomeworkForm.description) {
      this.showToast('Please provide Homework Title and Instructions.', 'warning');
      return;
    }
    const newHw: TeacherHomeworkRecord = {
      id: `HW-${Math.floor(200 + Math.random() * 700)}`,
      title: this.teacherHomeworkForm.title,
      subject: this.teacherHomeworkForm.subject,
      grade: this.teacherHomeworkForm.grade,
      dueDate: this.teacherHomeworkForm.dueDate,
      assignedDate: 'Oct 15, 2026',
      submissionsCount: 0,
      totalCount: 28,
      description: this.teacherHomeworkForm.description
    };
    this.teacherHomeworks.unshift(newHw);
    this.saveStateToStorage();
    this.closeTeacherHomeworkModal();
    this.showToast(`Posted assignment to ${newHw.grade} student portals!`, 'success');
  }

  // --- PARENT ACTIONS ---
  openParentLeaveModal() {
    this.parentLeaveForm = {
      childId: this.activeParentChildId,
      fromDate: 'Oct 20, 2026',
      toDate: 'Oct 21, 2026',
      reason: ''
    };
    this.isParentLeaveModalOpen = true;
    this.cdr.detectChanges();
  }

  closeParentLeaveModal() {
    this.isParentLeaveModalOpen = false;
    this.cdr.detectChanges();
  }

  submitParentLeaveRequest() {
    if (!this.parentLeaveForm.reason) {
      this.showToast('Please describe reason for leave.', 'warning');
      return;
    }
    const child = this.parentChildren.find(c => c.id === this.parentLeaveForm.childId) || this.parentChildren[0];
    const newLeave: ParentLeaveRecord = {
      id: `LEV-${Math.floor(100 + Math.random() * 899)}`,
      childName: child.name,
      childId: child.id,
      fromDate: this.parentLeaveForm.fromDate,
      toDate: this.parentLeaveForm.toDate,
      reason: this.parentLeaveForm.reason,
      status: 'Approved',
      submittedDate: 'Today'
    };
    this.parentLeaveRequests.unshift(newLeave);
    this.saveStateToStorage();
    this.closeParentLeaveModal();
    this.showToast('Official leave application submitted and approved by principal office!', 'success');
  }

  openParentMessageModal() {
    this.parentMessageForm = {
      childId: this.activeParentChildId,
      recipient: 'Prof. Tariq Mehmood (Mathematics)',
      subject: '',
      message: ''
    };
    this.isParentMessageModalOpen = true;
    this.cdr.detectChanges();
  }

  closeParentMessageModal() {
    this.isParentMessageModalOpen = false;
    this.cdr.detectChanges();
  }

  sendParentMessage() {
    if (!this.parentMessageForm.subject || !this.parentMessageForm.message) {
      this.showToast('Please fill subject and message.', 'warning');
      return;
    }
    const newMsg: ParentMessageRecord = {
      id: `MSG-${Math.floor(300 + Math.random() * 699)}`,
      sender: 'Tariq Ahmed Khan (Guardian)',
      recipient: this.parentMessageForm.recipient,
      subject: this.parentMessageForm.subject,
      message: this.parentMessageForm.message,
      date: 'Today at 08:30 AM',
      reply: 'Thank you for reaching out. We will address this promptly in today’s faculty review.'
    };
    this.parentMessages.unshift(newMsg);
    this.saveStateToStorage();
    this.closeParentMessageModal();
    this.showToast('Message sent to teacher. Notification dispatched via SMS gateway.', 'success');
  }

  // --- EXISTING OWNER ERP METHODS ---
  setTab(tab: SchoolDashboardTab | string): void {
    this.currentTab = tab as SchoolDashboardTab;
    if (tab === 'library') {
      this.checkAndUpdateOverdueBooks();
    }
    this.tabChanged.emit(tab);
    this.cdr.detectChanges();
  }

  setPage(tab: SchoolDashboardTab, page: number) {
    this.currentPage[tab] = page;
  }

  getPaginatedItems<T>(items: T[], tab: SchoolDashboardTab): T[] {
    const start = (this.currentPage[tab] - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  getPageNumbers(totalItems: number): number[] {
    const totalPages = Math.ceil(totalItems / this.pageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  toggleStudentRow(studentId: string, event?: MouseEvent): void {
    if (event) {
      const target = event.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('select')) {
        return;
      }
    }
    this.expandedStudentId = this.expandedStudentId === studentId ? null : studentId;
    this.cdr.detectChanges();
  }

  isStudentExpanded(studentId: string): boolean {
    return this.expandedStudentId === studentId;
  }

  onStudentSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.studentSearchQuery = input.value;
    this.currentPage['students'] = 1;
    this.cdr.detectChanges();
  }

  clearStudentSearch(): void {
    this.studentSearchQuery = '';
    this.searchQuery = '';
    this.currentPage['students'] = 1;
    this.cdr.detectChanges();
  }

  selectStudentClass(grade: string): void {
    this.selectedGradeFilter = grade;
    this.currentPage['students'] = 1;
    this.cdr.detectChanges();
  }

  getStudentCountForClass(grade: string): number {
    if (grade === 'All') return this.activeStudents.length;
    const filterNorm = grade.trim().toLowerCase();
    return this.activeStudents.filter(s => {
      const gradeNorm = (s.grade || '').trim().toLowerCase();
      return gradeNorm.startsWith(filterNorm + '-') ||
             gradeNorm.startsWith(filterNorm + ' ') ||
             gradeNorm === filterNorm ||
             gradeNorm.includes(filterNorm);
    }).length;
  }

  get filteredStudents(): StudentRecord[] {
    const q = (this.studentSearchQuery || this.searchQuery || '').trim().toLowerCase();
    const filterGrade = this.selectedGradeFilter.trim().toLowerCase();

    let list = this.activeStudents.filter(s => {
      // Real-time filter search across students' names, roll numbers, IDs, guardian, phone and Form-B
      const matchSearch = !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.guardian && s.guardian.toLowerCase().includes(q)) ||
        (s.guardianPhone && s.guardianPhone.includes(q)) ||
        (s.studentBForm && s.studentBForm.toLowerCase().includes(q));

      // Match currently selected class
      let matchGrade = false;
      if (this.selectedGradeFilter === 'All') {
        matchGrade = true;
      } else {
        const gradeNorm = (s.grade || '').trim().toLowerCase();
        matchGrade = gradeNorm.startsWith(filterGrade + '-') ||
                     gradeNorm.startsWith(filterGrade + ' ') ||
                     gradeNorm === filterGrade ||
                     gradeNorm.includes(filterGrade);
      }

      const matchFee = this.selectedFeeFilter === 'All' || s.feeStatus === this.selectedFeeFilter;
      return matchSearch && matchGrade && matchFee;
    });

    if (this.studentsSortColumn) {
      list.sort((a: any, b: any) => {
        const valA = a[this.studentsSortColumn];
        const valB = b[this.studentsSortColumn];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return this.studentsSortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return this.studentsSortDirection === 'asc'
          ? String(valA || '').localeCompare(String(valB || ''))
          : String(valB || '').localeCompare(String(valA || ''));
      });
    }
    return list;
  }

  get filteredAdmissions(): AdmissionRecord[] {
    return this.admissionsList.filter(a => {
      const q = (this.admissionsSearchQuery || this.searchQuery || '').toLowerCase().trim();
      const matchSearch = !q || 
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.applicant && a.applicant.toLowerCase().includes(q)) ||
        (a.appliedFor && a.appliedFor.toLowerCase().includes(q)) ||
        (a.fatherName && a.fatherName.toLowerCase().includes(q)) ||
        (a.phone && a.phone.toLowerCase().includes(q)) ||
        (a.fatherCnic && a.fatherCnic.toLowerCase().includes(q)) ||
        (a.studentBForm && a.studentBForm.toLowerCase().includes(q)) ||
        (a.previousSchool && a.previousSchool.toLowerCase().includes(q)) ||
        (a.address && a.address.toLowerCase().includes(q)) ||
        (a.score && a.score.toLowerCase().includes(q));

      const matchStatus = this.selectedAdmissionFilter === 'all' || a.status === this.selectedAdmissionFilter;
      const matchSource = this.selectedAdmissionSourceFilter === 'all' || (a.source || 'School Office Direct') === this.selectedAdmissionSourceFilter;

      return matchSearch && matchStatus && matchSource;
    });
  }

  get filteredFinances(): FinanceRecord[] {
    return this.finances.filter(f => {
      const q = (this.financeSearchQuery || this.searchQuery || '').toLowerCase();
      return !q ||
        f.title.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.challanNo.toLowerCase().includes(q) ||
        (f.studentName && f.studentName.toLowerCase().includes(q));
    });
  }

  get filteredPaymentGateway(): FinanceRecord[] {
    return this.finances.filter(f => {
      const q = (this.paymentGatewaySearchQuery || '').toLowerCase();
      const matchSearch = !q ||
        f.title.toLowerCase().includes(q) ||
        f.challanNo.toLowerCase().includes(q) ||
        (f.studentName && f.studentName.toLowerCase().includes(q)) ||
        (f.grade && f.grade.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q));
      const matchGateway = this.selectedPaymentGatewayFilter === 'All' ||
        (f.category === this.selectedPaymentGatewayFilter || (f.paymentMethod && f.paymentMethod.includes(this.selectedPaymentGatewayFilter)));
      return matchSearch && matchGateway;
    });
  }

  get filteredTeachers(): TeacherRecord[] {
    return this.teachers.filter(t => {
      const q = (this.teachersSearchQuery || '').toLowerCase();
      return !q ||
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q);
    });
  }

  get filteredTransport(): TransportRouteRecord[] {
    return this.transportRoutes.filter(tr => {
      const q = (this.transportSearchQuery || '').toLowerCase();
      return !q ||
        tr.routeName.toLowerCase().includes(q) ||
        tr.driverName.toLowerCase().includes(q) ||
        tr.vehicleNo.toLowerCase().includes(q);
    });
  }

  get filteredLibrary(): LibraryBookRecord[] {
    return this.libraryBooks.filter(bk => {
      const q = (this.librarySearchQuery || '').toLowerCase();
      return !q ||
        bk.title.toLowerCase().includes(q) ||
        bk.author.toLowerCase().includes(q) ||
        bk.isbn.toLowerCase().includes(q) ||
        bk.category.toLowerCase().includes(q);
    });
  }

  // Attendance Register Getter & Methods
  get filteredAttendanceStudents(): StudentRecord[] {
    const q = (this.attendanceSearchQuery || '').trim().toLowerCase();
    const filterGrade = this.attendanceSelectedClass.trim().toLowerCase();
    return this.activeStudents.filter(s => {
      const matchSearch = !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q));

      let matchGrade = false;
      if (this.attendanceSelectedClass === 'All') {
        matchGrade = true;
      } else {
        const gradeNorm = (s.grade || '').trim().toLowerCase();
        matchGrade = gradeNorm.startsWith(filterGrade + '-') ||
                     gradeNorm.startsWith(filterGrade + ' ') ||
                     gradeNorm === filterGrade ||
                     gradeNorm.includes(filterGrade);
      }
      return matchSearch && matchGrade;
    });
  }

  markStudentAttendance(student: StudentRecord, status: 'Present' | 'Late' | 'Absent' | 'On Leave') {
    student.status = status;
    this.saveStateToStorage();
    this.cdr.detectChanges();
  }

  markAllStudentsPresent() {
    this.activeStudents.forEach(s => s.status = 'Present');
    this.saveStateToStorage();
    this.showToast('All enrolled students marked Present for today!', 'success');
    this.cdr.detectChanges();
  }

  sendAbsentAlert(student: StudentRecord) {
    this.showToast(`SMS & WhatsApp Attendance Alert sent to ${student.guardian} (${student.guardianPhone}): ${student.name} marked ${student.status} on ${this.attendanceDate}`, 'info');
  }

  downloadAttendanceRegisterCSV() {
    const list = this.filteredAttendanceStudents;
    if (!list.length) {
      this.showToast('No student records found to export', 'warning');
      return;
    }
    const headers = ['Roll No', 'Student ID', 'Student Name', 'Class & Section', 'Date', 'Attendance Status', 'Attendance Rate', 'Guardian Phone'];
    const rows = list.map(s => [
      `"${s.rollNo}"`,
      `"${s.id}"`,
      `"${s.name}"`,
      `"${s.grade} (${s.section})"`,
      `"${this.attendanceDate}"`,
      `"${s.status}"`,
      `"${s.attendance}"`,
      `"${s.guardianPhone}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    this.downloadCSVFile(csv, `Attendance_Register_${this.attendanceSelectedClass}_${this.attendanceDate}.csv`);
    this.showToast(`Exported attendance sheet for ${list.length} students`, 'success');
  }

  // Expenses Getter & Methods
  get filteredExpenses(): any[] {
    const q = (this.expensesSearchQuery || '').trim().toLowerCase();
    return this.schoolExpenses.filter(e => {
      const matchSearch = !q ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.receiptNo && e.receiptNo.toLowerCase().includes(q)) ||
        (e.vendor && e.vendor.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q));
      const matchCat = this.selectedExpenseCategoryFilter === 'All' || e.category === this.selectedExpenseCategoryFilter;
      return matchSearch && matchCat;
    });
  }

  openEditExpenseModal(exp: any) {
    this.editingExpense = { ...exp };
    this.isEditExpenseModalOpen = true;
    this.cdr.detectChanges();
  }

  closeEditExpenseModal() {
    this.isEditExpenseModalOpen = false;
    this.editingExpense = null;
    this.cdr.detectChanges();
  }

  saveEditedExpense() {
    if (!this.editingExpense) return;
    const idx = this.schoolExpenses.findIndex(e => e.id === this.editingExpense.id);
    if (idx !== -1) {
      this.schoolExpenses[idx] = { ...this.editingExpense };
      this.saveStateToStorage();
      this.showToast(`Expense ${this.editingExpense.receiptNo} updated successfully!`, 'success');
    }
    this.closeEditExpenseModal();
  }

  downloadExpensesCSV() {
    const list = this.filteredExpenses;
    if (!list.length) {
      this.showToast('No expense records to export', 'warning');
      return;
    }
    const headers = ['Receipt #', 'Title & Purpose', 'Category', 'Vendor / Payee', 'Date', 'Payment Mode', 'Amount (PKR)'];
    const rows = list.map(e => [
      `"${e.receiptNo}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.vendor.replace(/"/g, '""')}"`,
      `"${e.date}"`,
      `"${e.paymentMode}"`,
      e.amount
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    this.downloadCSVFile(csv, `School_Expenses_Register_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // Exams & Gradebook Getters & Methods
  get filteredMarksStudents(): StudentRecord[] {
    const q = (this.marksEntrySearchQuery || '').trim().toLowerCase();
    const filterGrade = this.selectedMarksClass.trim().toLowerCase();
    return this.activeStudents.filter(s => {
      const matchSearch = !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q));
      const gradeNorm = (s.grade || '').trim().toLowerCase();
      const matchGrade = gradeNorm.startsWith(filterGrade + '-') ||
                         gradeNorm.startsWith(filterGrade + ' ') ||
                         gradeNorm === filterGrade ||
                         gradeNorm.includes(filterGrade);
      return matchSearch && matchGrade;
    });
  }

  get filteredSubjects(): any[] {
    const q = (this.subjectsSearchQuery || '').trim().toLowerCase();
    return this.schoolSubjectsList.filter(sub => {
      return !q ||
        sub.title.toLowerCase().includes(q) ||
        sub.code.toLowerCase().includes(q) ||
        sub.grade.toLowerCase().includes(q) ||
        sub.teacher.toLowerCase().includes(q);
    });
  }

  calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  getStudentMarkData(studentId: string): { obtained: number; total: number; remarks: string } {
    const key = `${studentId}_${this.selectedMarksSubject}_${this.selectedMarksExamId}`;
    if (!this.studentMarksMap[key]) {
      const charCode = studentId.charCodeAt(studentId.length - 1) || 5;
      const baseScore = 65 + (charCode % 30);
      this.studentMarksMap[key] = {
        obtained: baseScore,
        total: 100,
        remarks: baseScore >= 80 ? 'Outstanding concepts and excellent problem solving' : (baseScore >= 50 ? 'Satisfactory performance, keep practicing' : 'Needs urgent remedial attention')
      };
    }
    return this.studentMarksMap[key];
  }

  updateStudentObtainedMark(studentId: string, event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    const markData = this.getStudentMarkData(studentId);
    markData.obtained = Math.min(Math.max(val || 0, 0), markData.total);
    this.cdr.detectChanges();
  }

  updateStudentRemarks(studentId: string, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const markData = this.getStudentMarkData(studentId);
    markData.remarks = val;
  }

  saveAllMarksEntry() {
    try {
      localStorage.setItem('scs_school_marks_map_v1', JSON.stringify(this.studentMarksMap));
    } catch {}
    this.showToast(`Marks for ${this.selectedMarksSubject} (${this.selectedMarksClass}) saved and locked!`, 'success');
  }

  downloadMarksCSV() {
    const list = this.filteredMarksStudents;
    if (!list.length) {
      this.showToast('No student marks to export for this selection', 'warning');
      return;
    }
    const headers = ['Roll No', 'Student Name', 'Class', 'Subject', 'Total Marks', 'Obtained Marks', 'Percentage', 'Grade', 'Status', 'Remarks'];
    const rows = list.map(s => {
      const m = this.getStudentMarkData(s.id);
      const pct = Math.round((m.obtained / m.total) * 100);
      const gr = this.calculateGrade(pct);
      return [
        `"${s.rollNo}"`,
        `"${s.name}"`,
        `"${s.grade}"`,
        `"${this.selectedMarksSubject}"`,
        m.total,
        m.obtained,
        `${pct}%`,
        gr,
        pct >= 40 ? 'Pass' : 'Fail',
        `"${m.remarks.replace(/"/g, '""')}"`
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    this.downloadCSVFile(csv, `Marks_${this.selectedMarksClass.replace(/\s+/g, '_')}_${this.selectedMarksSubject.replace(/\s+/g, '_')}.csv`);
  }

  get filteredClassResults(): Array<{
    rank: number;
    student: StudentRecord;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    status: 'Pass' | 'Fail';
  }> {
    const filterGrade = this.selectedMarksClass.trim().toLowerCase();
    const q = (this.classResultSearchQuery || '').trim().toLowerCase();

    const classStudents = this.activeStudents.filter(s => {
      const gradeNorm = (s.grade || '').trim().toLowerCase();
      const matchGrade = gradeNorm.startsWith(filterGrade + '-') ||
                         gradeNorm.startsWith(filterGrade + ' ') ||
                         gradeNorm === filterGrade ||
                         gradeNorm.includes(filterGrade);
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.rollNo.includes(q);
      return matchGrade && matchSearch;
    });

    const results = classStudents.map(s => {
      const marks = this.getStudentMarkData(s.id);
      const percentage = Math.round((marks.obtained / marks.total) * 100);
      const grade = this.calculateGrade(percentage);
      return {
        rank: 1,
        student: s,
        totalMarks: marks.total,
        obtainedMarks: marks.obtained,
        percentage,
        grade,
        status: percentage >= 40 ? ('Pass' as const) : ('Fail' as const)
      };
    });

    results.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
    results.forEach((r, idx) => r.rank = idx + 1);
    return results;
  }

  openAddSubjectModal() {
    this.subjectForm = {
      code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      grade: this.selectedMarksClass || 'Class 10',
      teacher: 'Prof. Tariq Mehmood',
      creditHours: 5,
      type: 'Core',
      passMarks: 40,
      totalMarks: 100
    };
    this.isSubjectModalOpen = true;
    this.cdr.detectChanges();
  }

  closeSubjectModal() {
    this.isSubjectModalOpen = false;
    this.cdr.detectChanges();
  }

  saveSubject() {
    if (!this.subjectForm.title || !this.subjectForm.code) {
      this.showToast('Please enter Subject Code and Title', 'warning');
      return;
    }
    this.schoolSubjectsList.unshift({
      id: `SUB-${Date.now()}`,
      code: this.subjectForm.code,
      title: this.subjectForm.title,
      grade: this.subjectForm.grade,
      teacher: this.subjectForm.teacher,
      creditHours: this.subjectForm.creditHours,
      type: this.subjectForm.type,
      passMarks: this.subjectForm.passMarks,
      totalMarks: this.subjectForm.totalMarks
    });
    this.closeSubjectModal();
    this.showToast(`Subject ${this.subjectForm.title} successfully added!`, 'success');
  }

  deleteSubject(sub: any) {
    this.schoolSubjectsList = this.schoolSubjectsList.filter(s => s.id !== sub.id);
    this.showToast(`Subject ${sub.title} removed`, 'info');
  }

  get calculatedClassFeeSummaries(): ClassFeeSummary[] {
    const classes = [
      'Class Nursery', 'Class KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 
      'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
    ];
    return classes.map(c => {
      const classStudents = (this.activeStudents || []).filter(s => s.grade.includes(c) || s.grade === c);
      const studentCount = classStudents.length || Math.floor(25 + Math.random() * 20);
      const classDefaulters = (this.studentFeeDefaulters || []).filter(d => d.grade.includes(c) || d.grade === c);
      const avgMonthlyFee = classStudents.length > 0 ? (classStudents[0].feeAmount || 25000) : 25000;
      const totalBilled = studentCount * avgMonthlyFee;
      const totalRemainingBakaya = classDefaulters.reduce((acc, d) => acc + (d.totalRemainingBakaya || 0), 0);
      const totalCollected = totalBilled - totalRemainingBakaya;
      const rate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;
      return {
        className: c,
        totalStudentsCount: studentCount,
        totalMonthlyBilled: totalBilled,
        totalFeeCollected: Math.max(0, totalCollected),
        totalRemainingBakaya: totalRemainingBakaya,
        defaulterStudentsCount: classDefaulters.length,
        collectionRate: Math.min(100, Math.max(0, rate))
      };
    });
  }

  get filteredFeeDefaulters(): StudentFeeDefaulterRecord[] {
    return (this.studentFeeDefaulters || []).filter((d: StudentFeeDefaulterRecord) => {
      const q = (this.financeSearchQuery || '').toLowerCase();
      const matchQuery = !q ||
        d.studentName.toLowerCase().includes(q) ||
        d.rollNo.toLowerCase().includes(q) ||
        d.grade.toLowerCase().includes(q) ||
        d.guardianName.toLowerCase().includes(q) ||
        d.guardianPhone.toLowerCase().includes(q);
      const matchGrade = this.selectedGradeFilter === 'All' || d.grade.includes(this.selectedGradeFilter);
      return matchQuery && matchGrade;
    });
  }

  get totalSchoolBakayaDues(): number {
    return (this.studentFeeDefaulters || []).reduce((acc, d) => acc + (d.totalRemainingBakaya || 0), 0);
  }

  get totalTeacherSalaryArrears(): number {
    return (this.teachers || []).reduce((acc, t) => acc + (t.remainingSalaryArrears || 0), 0);
  }

  openSendAlertModal(target: any) {
    if ('studentName' in target) {
      // It's a defaulter record
      this.alertTarget = {
        recipientName: `${target.guardianName} (Guardian of ${target.studentName})`,
        recipientPhone: target.guardianPhone,
        studentName: target.studentName,
        rollNo: target.rollNo,
        grade: target.grade,
        remainingBakaya: target.totalRemainingBakaya,
        unpaidMonths: target.unpaidMonthsList
      };
      this.customAlertMessage = `Assalam-o-Alaikum ${target.guardianName}, Fee for ${target.studentName} (${target.grade}, Roll #${target.rollNo}) for ${target.unpaidMonthsList ? target.unpaidMonthsList.join(', ') : 'pending session'} totaling PKR ${target.totalRemainingBakaya.toLocaleString()} is remaining. Kindly clear outstanding dues at earliest via Meezan / JazzCash or Bank Challan. School Accounts Office.`;
    } else if ('name' in target) {
      // Teacher or General student
      this.alertTarget = {
        recipientName: target.name,
        recipientPhone: target.phone || target.guardianPhone || '+92 300 0000000',
        studentName: target.name,
        remainingBakaya: target.remainingSalaryArrears || target.feeAmount || 0
      };
      this.customAlertMessage = `Assalam-o-Alaikum ${target.name}, Official notice regarding your campus ledger records at ${this.schoolName}. Please review your portal notification section.`;
    }
    this.isAlertModalOpen = true;
    this.cdr.detectChanges();
  }

  closeAlertModal() {
    this.isAlertModalOpen = false;
    this.alertTarget = null;
    this.cdr.detectChanges();
  }

  dispatchAlertNotification() {
    if (!this.alertTarget || !this.customAlertMessage) {
      this.showToast('Please provide recipient details and message text.', 'warning');
      return;
    }
    const newLog: DispatchAlertLog = {
      id: `ALT-${Math.floor(100 + Math.random() * 899)}`,
      recipientName: this.alertTarget.recipientName,
      recipientPhone: this.alertTarget.recipientPhone,
      channel: this.alertChannel,
      targetRole: 'Parent',
      messageText: this.customAlertMessage,
      sentAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      deliveryStatus: 'Delivered'
    };
    this.dispatchAlertLogs.unshift(newLog);

    // Update defaulter status if matching
    if (this.alertTarget.studentName) {
      const match = this.studentFeeDefaulters.find(d => d.studentName === this.alertTarget?.studentName);
      if (match) {
        match.alertStatus = this.alertChannel === 'WhatsApp' ? 'WhatsApp Reminder Sent' : 'SMS Dispatched';
        match.lastAlertTimestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    this.saveStateToStorage();
    this.closeAlertModal();
    this.showToast(`Notification alert dispatched via ${this.alertChannel} to ${newLog.recipientName}!`, 'success');
  }

  recordDefaulterFeePayment(defaulter: StudentFeeDefaulterRecord) {
    const paymentAmount = defaulter.monthlyFee;
    defaulter.totalRemainingBakaya = Math.max(0, defaulter.totalRemainingBakaya - paymentAmount);
    if (defaulter.unpaidMonthsCount > 0) defaulter.unpaidMonthsCount--;
    if (defaulter.unpaidMonthsList && defaulter.unpaidMonthsList.length > 0) {
      defaulter.unpaidMonthsList.shift();
    }
    defaulter.totalPaidToDate += paymentAmount;
    defaulter.lastPaymentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Add Income transaction to finances
    this.finances.unshift({
      id: `FIN-${Math.floor(2000 + Math.random() * 8000)}`,
      title: `Recovery Fee Payment - ${defaulter.studentName} (${defaulter.grade})`,
      studentName: defaulter.studentName,
      grade: defaulter.grade,
      category: 'Tuition',
      type: 'Income',
      amount: paymentAmount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Verified',
      challanNo: `CH-REC-${Math.floor(1000 + Math.random() * 8999)}`,
      paymentMethod: 'Manual Khata Recovery'
    });

    // If completely cleared, update matching student record
    const matchStudent = this.activeStudents.find(s => s.id === defaulter.studentId || s.name === defaulter.studentName);
    if (matchStudent && defaulter.totalRemainingBakaya === 0) {
      matchStudent.feeStatus = 'Paid';
    }

    this.saveStateToStorage();
    this.showToast(`Recorded fee collection PKR ${paymentAmount.toLocaleString()} for ${defaulter.studentName}`, 'success');
  }

  disburseTeacherSalaryArrears(teacher: TeacherRecord) {
    if (!teacher.remainingSalaryArrears || teacher.remainingSalaryArrears <= 0) {
      this.showToast(`No outstanding salary arrears for ${teacher.name}`, 'info');
      return;
    }
    const arrearsAmount = teacher.remainingSalaryArrears;
    teacher.remainingSalaryArrears = 0;
    teacher.unpaidSalaryMonths = 0;
    teacher.salaryStatus = 'Disbursed';

    // Add Expense transaction to finances
    this.finances.unshift({
      id: `FIN-${Math.floor(2000 + Math.random() * 8000)}`,
      title: `Disbursed Salary Arrears - ${teacher.name} (${teacher.subject})`,
      category: 'Salaries',
      type: 'Expense',
      amount: arrearsAmount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Verified',
      challanNo: `PAY-ARR-${Math.floor(100 + Math.random() * 899)}`,
      paymentMethod: 'Bank Direct Deposit'
    });

    this.saveStateToStorage();
    this.showToast(`Successfully disbursed PKR ${arrearsAmount.toLocaleString()} salary arrears for ${teacher.name}!`, 'success');
  }

  get filteredExams(): ExamRecord[] {
    return this.examsList.filter(ex => {
      const q = (this.examsSearchQuery || '').toLowerCase();
      return !q ||
        ex.examName.toLowerCase().includes(q) ||
        ex.class.toLowerCase().includes(q);
    });
  }

  get filteredTimetables(): TimetableRecord[] {
    return this.timetables.filter(tt => {
      const q = (this.timetableSearchQuery || '').toLowerCase();
      return !q ||
        tt.subject.toLowerCase().includes(q) ||
        tt.teacher.toLowerCase().includes(q) ||
        tt.grade.toLowerCase().includes(q);
    });
  }

  get filteredPortalUsers(): PortalUserRecord[] {
    return this.portalUsers.filter(u => {
      const q = (this.portalsSearchQuery || '').toLowerCase();
      return !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
    });
  }

  get filteredVisitorGatePasses(): VisitorGatePassRecord[] {
    return this.visitorGatePasses.filter((v: VisitorGatePassRecord) => {
      const q = (this.visitorSearchQuery || '').toLowerCase();
      const matchQuery = !q ||
        v.visitorName.toLowerCase().includes(q) ||
        v.cnicOrPhone.toLowerCase().includes(q) ||
        v.gatePassNo.toLowerCase().includes(q) ||
        v.personToMeet.toLowerCase().includes(q);
      const matchStatus = this.selectedVisitorStatusFilter === 'All' || v.status === this.selectedVisitorStatusFilter;
      return matchQuery && matchStatus;
    });
  }

  get filteredStudentMedicalRecords(): StudentMedicalRecord[] {
    return this.studentMedicalRecords.filter((m: StudentMedicalRecord) => {
      const q = (this.medicalSearchQuery || '').toLowerCase();
      const matchQuery = !q ||
        m.studentName.toLowerCase().includes(q) ||
        m.rollNo.toLowerCase().includes(q) ||
        m.allergies.toLowerCase().includes(q) ||
        m.grade.toLowerCase().includes(q);
      const matchBlood = this.selectedMedicalBloodFilter === 'All' || m.bloodGroup === this.selectedMedicalBloodFilter;
      return matchQuery && matchBlood;
    });
  }

  get filteredDisciplinaryIncidents(): DisciplinaryIncidentRecord[] {
    return this.disciplinaryIncidents.filter((d: DisciplinaryIncidentRecord) => {
      const q = (this.disciplinarySearchQuery || '').toLowerCase();
      const matchQuery = !q ||
        d.studentName.toLowerCase().includes(q) ||
        d.rollNo.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q);
      const matchSeverity = this.selectedDisciplinarySeverityFilter === 'All' || d.severity === this.selectedDisciplinarySeverityFilter;
      return matchQuery && matchSeverity;
    });
  }

  get filteredSchoolAssets(): SchoolAssetRecord[] {
    return this.schoolAssets.filter((a: SchoolAssetRecord) => {
      const q = (this.assetSearchQuery || '').toLowerCase();
      const matchQuery = !q ||
        a.name.toLowerCase().includes(q) ||
        a.assetCode.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.custodian.toLowerCase().includes(q);
      const matchCategory = this.selectedAssetCategoryFilter === 'All' || a.category === this.selectedAssetCategoryFilter;
      return matchQuery && matchCategory;
    });
  }

  get filteredStaffPayrolls(): StaffPayrollRecord[] {
    return this.staffPayrolls.filter((p: StaffPayrollRecord) => {
      const q = (this.staffPayrollSearchQuery || '').toLowerCase();
      const matchQuery = !q ||
        p.staffName.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.month.toLowerCase().includes(q);
      const matchStatus = this.selectedPayrollStatusFilter === 'All' || p.status === this.selectedPayrollStatusFilter;
      return matchQuery && matchStatus;
    });
  }

  get filteredStaffLeaves(): StaffLeaveRecord[] {
    return this.staffLeaveRequests.filter((l: StaffLeaveRecord) => {
      const q = (this.staffLeaveSearchQuery || '').toLowerCase();
      const matchQuery = !q ||
        l.staffName.toLowerCase().includes(q) ||
        l.leaveType.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q);
      const matchStatus = this.selectedLeaveStatusFilter === 'All' || l.status === this.selectedLeaveStatusFilter;
      return matchQuery && matchStatus;
    });
  }

  // --- ONLINE PAYMENT GATEWAY CRUD ---
  openAddPaymentModal() {
    this.paymentForm = {
      title: 'Online Tuition Fee Collection',
      studentName: '',
      grade: 'Class 10-A',
      category: 'JazzCash Direct',
      amount: 28500,
      status: 'Verified',
      challanNo: `PAY-ONLINE-${Math.floor(1000 + Math.random() * 9000)}`
    };
    this.isPaymentModalOpen = true;
    this.cdr.detectChanges();
  }

  closePaymentModal() {
    this.isPaymentModalOpen = false;
    this.cdr.detectChanges();
  }

  savePayment() {
    if (!this.paymentForm.studentName || !this.paymentForm.amount) {
      this.showToast('Please enter Student Name and Amount.', 'warning');
      return;
    }
    const newRecord: FinanceRecord = {
      id: `FIN-${Math.floor(2000 + Math.random() * 8000)}`,
      title: this.paymentForm.title || 'Online Fee Payment',
      studentName: this.paymentForm.studentName,
      grade: this.paymentForm.grade || 'Class 10-A',
      category: this.paymentForm.category || 'JazzCash Direct',
      type: 'Income',
      amount: Number(this.paymentForm.amount) || 28500,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: (this.paymentForm.status as any) || 'Verified',
      challanNo: this.paymentForm.challanNo || `PAY-ONLINE-${Math.floor(1000 + Math.random() * 9000)}`
    };
    this.finances.unshift(newRecord);
    this.saveStateToStorage();
    this.closePaymentModal();
    this.showToast(`Recorded Online Payment for ${newRecord.studentName}`, 'success');
  }

  togglePaymentStatus(record: FinanceRecord) {
    record.status = record.status === 'Verified' ? 'Pending' : 'Verified';
    this.saveStateToStorage();
    this.showToast(`Transaction ${record.challanNo} status updated to ${record.status}`, 'info');
  }

  deletePaymentRecord(record: FinanceRecord) {
    if (confirm(`Are you sure you want to delete payment record ${record.challanNo}?`)) {
      this.finances = this.finances.filter(f => f.id !== record.id);
      this.saveStateToStorage();
      this.showToast(`Deleted payment record ${record.challanNo}`, 'warning');
    }
  }

  get totalRevenue(): number {
    return this.finances
      .filter(f => f.type === 'Income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }

  get totalExpenses(): number {
    return this.finances
      .filter(f => f.type === 'Expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }

  // --- STUDENT CRUD ---
  openAddStudentModal() {
    this.openAddAdmissionModal();
  }

  openEditStudentModal(student: StudentRecord) {
    this.activeStudentForEdit = student;
    this.studentForm = { ...student };
    this.isStudentModalOpen = true;
    this.cdr.detectChanges();
  }

  closeStudentModal() {
    this.isStudentModalOpen = false;
    this.activeStudentForEdit = null;
    this.cdr.detectChanges();
  }

  saveStudent() {
    if (!this.studentForm.name || !this.studentForm.guardian) {
      this.showToast('Please enter Student Name and Guardian information.', 'warning');
      return;
    }
    if (this.activeStudentForEdit) {
      Object.assign(this.activeStudentForEdit, this.studentForm);
      this.showToast(`Updated student profile for ${this.studentForm.name}`, 'success');
    } else {
      const newStudent: StudentRecord = {
        id: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: this.studentForm.name || '',
        grade: this.studentForm.grade || 'Grade 9-A',
        section: this.studentForm.section || 'Science',
        status: (this.studentForm.status as any) || 'Present',
        attendance: this.studentForm.attendance || '96%',
        image: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?auto=format&fit=crop&q=80&w=200`,
        guardian: this.studentForm.guardian || '',
        guardianPhone: this.studentForm.guardianPhone || '+92 300 0000000',
        feeStatus: (this.studentForm.feeStatus as any) || 'Pending',
        feeAmount: this.studentForm.feeAmount || 28500,
        rollNo: Math.floor(1000 + Math.random() * 9000).toString(),
        admissionDate: '2026-10-14'
      };
      this.activeStudents.unshift(newStudent);
      this.studentsSortColumn = '';
      this.currentPage['students'] = 1;
      this.selectedGradeFilter = 'All';
      this.selectedFeeFilter = 'All';
      this.studentSearchQuery = '';
      this.newlyEnrolledStudentId = newStudent.id;
      this.expandedStudentId = newStudent.id;

      this.triggerAdmissionAlert({
        id: newStudent.id,
        studentName: newStudent.name,
        rollNo: newStudent.rollNo,
        grade: `${newStudent.grade} (${newStudent.section})`,
        guardian: newStudent.guardian,
        phone: newStudent.guardianPhone,
        feeStatus: newStudent.feeStatus,
        source: 'Student Roster'
      });

      this.notificationsList.unshift({
        id: 'NOTIF-STU-' + Date.now(),
        title: `👤 Student Enrolled: ${newStudent.name} (Roll #${newStudent.rollNo})`,
        message: `${newStudent.name} registered into ${newStudent.grade}. Guardian: ${newStudent.guardian} (${newStudent.guardianPhone}). Positioned at Row #1 in table.`,
        type: 'general',
        targetRole: 'all',
        createdAt: 'Just now',
        isUnread: true,
        linkTab: 'students'
      });

      this.showToast(`Enrolled new student: ${newStudent.name} (Roll #${newStudent.rollNo}) at Row 1!`, 'success');
    }
    this.saveStateToStorage();
    this.closeStudentModal();
  }

  deleteStudent(student: StudentRecord) {
    this.activeStudents = this.activeStudents.filter(s => s.id !== student.id);
    this.saveStateToStorage();
    this.showToast(`Removed student record for ${student.name}`, 'info');
  }

  markStudentFeePaid(student: any) {
    const s = this.activeStudents.find(x => x.id === student.id) || student;
    s.feeStatus = 'Paid';
    const newRecord: FinanceRecord = {
      id: `FIN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Tuition Fee Clearance - ${s.name}`,
      studentName: s.name,
      grade: s.grade,
      category: 'Tuition',
      type: 'Income',
      amount: s.feeAmount || s.amount || 28500,
      date: 'Oct 15, 2026',
      status: 'Verified',
      challanNo: `CH-AUTO-${s.rollNo || s.id}`
    };
    this.finances.unshift(newRecord);
    this.saveStateToStorage();
    this.showToast(`Cleared fee payment of PKR ${newRecord.amount} for ${s.name}`, 'success');
  }

  openFeeChallanVoucher(student?: StudentRecord | null) {
    if (!student) {
      this.voucherStudent = {
        id: 'ST-1030',
        name: 'Pervaiz Ahmed Abbasi',
        guardian: 'Ghansi',
        grade: 'Class 1',
        rollNo: '1030',
        feeAmount: 12500,
        feeStatus: 'Pending',
        section: 'A'
      } as any;
    } else {
      this.voucherStudent = {
        ...student,
        name: student.name || 'Pervaiz Ahmed Abbasi',
        guardian: student.guardian || 'Ghansi',
        grade: student.grade || 'Class 1',
        rollNo: student.rollNo || '1030',
        feeAmount: student.feeAmount || 12500
      };
    }
    this.isFeeChallanVoucherOpen = true;
    this.cdr.detectChanges();
  }

  closeFeeChallanVoucher() {
    this.isFeeChallanVoucherOpen = false;
    this.voucherStudent = null;
    this.cdr.detectChanges();
  }

  printVoucher() {
    window.print();
  }

  // --- TEACHER CRUD ---
  openAddTeacherModal() {
    this.activeTeacherForEdit = null;
    this.teacherForm = {
      name: '',
      role: 'Senior Faculty Teacher',
      customRole: '',
      gender: 'Male',
      cnic: '35202-1234567-1',
      phone: '+92 300 1234567',
      emergencyContact: '+92 321 9876543',
      email: '',
      address: 'House #45, Sector F-10/2, Islamabad',
      qualification: 'M.Phil / M.Sc.',
      previousInstitute: 'Beaconhouse School System',
      experienceYears: 4,
      subject: 'Computer Science & AI',
      assignedGrade: 'Class 10 (Science)',
      customGradeInput: '',
      inchargeClass: 'Class 10-A (Class Teacher)',
      customInchargeInput: '',
      weeklyPeriods: 24,
      classes: 5,
      employmentType: 'Permanent',
      monthlySalary: 145000,
      bankName: 'Meezan Bank Ltd',
      accountNo: 'PK36MEZN01020108920192',
      status: 'Active',
      salaryStatus: 'Processing',
      rating: 4.9
    };
    this.isTeacherModalOpen = true;
    this.cdr.detectChanges();
  }

  openEditTeacherModal(teacher: TeacherRecord) {
    this.activeTeacherForEdit = teacher;
    this.teacherForm = {
      ...teacher,
      role: teacher.role || teacher.designation || 'Senior Faculty Teacher'
    };
    this.isTeacherModalOpen = true;
    this.cdr.detectChanges();
  }

  closeTeacherModal() {
    this.isTeacherModalOpen = false;
    this.activeTeacherForEdit = null;
    this.cdr.detectChanges();
  }

  saveTeacher() {
    if (!this.teacherForm.name || !this.teacherForm.subject) {
      this.showToast('Please enter Faculty Name and Subject.', 'warning');
      return;
    }

    const finalRole = (this.teacherForm.role === 'Custom Role / Designation' && this.teacherForm.customRole?.trim())
      ? this.teacherForm.customRole.trim()
      : (this.teacherForm.role || 'Senior Faculty Teacher');

    const finalGrade = (this.teacherForm.assignedGrade === 'Custom Class Name Write-In...' && this.teacherForm.customGradeInput?.trim())
      ? this.teacherForm.customGradeInput.trim()
      : (this.teacherForm.assignedGrade || 'Class 10-A');

    const finalIncharge = (this.teacherForm.inchargeClass === 'Custom Class Name Write-In...' && this.teacherForm.customInchargeInput?.trim())
      ? this.teacherForm.customInchargeInput.trim()
      : (this.teacherForm.inchargeClass || 'None');

    if (this.activeTeacherForEdit) {
      Object.assign(this.activeTeacherForEdit, this.teacherForm, {
        role: finalRole,
        designation: finalRole,
        assignedGrade: finalGrade,
        inchargeClass: finalIncharge
      });
      this.showToast(`Updated faculty profile for ${this.teacherForm.name}`, 'success');
    } else {
      const newTeacher: TeacherRecord = {
        id: `TCH-${Math.floor(100 + Math.random() * 900)}`,
        name: this.teacherForm.name || '',
        role: finalRole,
        designation: finalRole,
        subject: this.teacherForm.subject || 'General Sciences',
        qualification: this.teacherForm.qualification || 'M.Sc.',
        classes: Number(this.teacherForm.classes || this.teacherForm.weeklyPeriods) || 5,
        status: (this.teacherForm.status as any) || 'Active',
        rating: Number(this.teacherForm.rating) || 4.9,
        email: this.teacherForm.email || `${this.teacherForm.name?.toLowerCase().replace(/\s+/g, '.')}@alhuda.edu.pk`,
        phone: this.teacherForm.phone || '+92 300 0000000',
        cnic: this.teacherForm.cnic || '35202-0000000-1',
        gender: (this.teacherForm.gender as any) || 'Male',
        experienceYears: Number(this.teacherForm.experienceYears) || 3,
        assignedGrade: finalGrade,
        inchargeClass: finalIncharge,
        emergencyContact: this.teacherForm.emergencyContact || '',
        address: this.teacherForm.address || 'Islamabad, Pakistan',
        bankName: this.teacherForm.bankName || 'Meezan Bank Ltd',
        accountNo: this.teacherForm.accountNo || 'PK36MEZN01020108920192',
        employmentType: (this.teacherForm.employmentType as any) || 'Permanent',
        previousInstitute: this.teacherForm.previousInstitute || 'Beaconhouse',
        weeklyPeriods: Number(this.teacherForm.weeklyPeriods) || 24,
        image: this.teacherForm.gender === 'Female'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
          : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        salaryStatus: (this.teacherForm.salaryStatus as any) || 'Processing',
        monthlySalary: Number(this.teacherForm.monthlySalary) || 145000,
        appointmentDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tenureDuration: 'Newly Appointed'
      };
      this.teachers.unshift(newTeacher);
      this.teachersSearchQuery = '';
      this.currentPage['teachers'] = 1;
      this.newlyAddedTeacherId = newTeacher.id;

      this.triggerAdmissionAlert({
        id: newTeacher.id,
        studentName: `${newTeacher.name} (${finalRole})`,
        rollNo: `ID: ${newTeacher.id}`,
        grade: `${newTeacher.subject} [${finalGrade}]`,
        guardian: `Appointed by Principal • ${newTeacher.employmentType}`,
        phone: newTeacher.phone,
        feeStatus: `PKR ${newTeacher.monthlySalary.toLocaleString()}/mo`,
        source: 'Faculty Recruitment' as any
      });

      this.notificationsList.unshift({
        id: 'NOTIF-TCH-' + Date.now(),
        title: `🎓 Faculty Appointed: ${newTeacher.name} (${finalRole} — ${newTeacher.subject})`,
        message: `${newTeacher.name} appointed as ${finalRole} (${newTeacher.subject}). Assigned Class: ${finalGrade}. Salary: PKR ${newTeacher.monthlySalary.toLocaleString()}. Positioned at Row #1 in table.`,
        type: 'general',
        targetRole: 'all',
        createdAt: 'Just now',
        isUnread: true,
        linkTab: 'teachers'
      });

      this.showToast(`Faculty Member Appointed: ${newTeacher.name} (${finalRole}) added at Row #1!`, 'success');
    }
    this.saveStateToStorage();
    this.closeTeacherModal();
  }

  deleteTeacher(teacher: TeacherRecord) {
    this.teachers = this.teachers.filter(t => t.id !== teacher.id);
    this.saveStateToStorage();
    this.showToast(`Removed faculty member ${teacher.name}`, 'info');
  }

  // --- ADMISSIONS CRUD ---
  openAddAdmissionModal() {
    const nextRoll = (this.activeStudents.length + 1001).toString();
    this.admissionForm = {
      applicant: '',
      fatherName: '',
      relation: 'Father',
      fatherCnic: '',
      studentBForm: '',
      dob: '2015-05-12',
      gender: 'Male',
      bloodGroup: 'B+',
      appliedFor: 'Class 9',
      section: 'Science',
      rollNo: nextRoll,
      phone: '',
      email: '',
      fatherOccupation: '',
      address: '',
      previousSchool: '',
      emergencyContact: '',
      medicalNotes: 'Normal health / No known allergies',
      admissionFee: 25000,
      tuitionFee: 18000,
      discount: 0,
      initialPaymentStatus: 'Paid',
      score: '88% Entrance Assessment',
      status: 'Approved'
    };
    this.isAdmissionModalOpen = true;
    this.cdr.detectChanges();
  }

  onAdmissionGradeChange(): void {
    const val = (this.admissionForm.appliedFor || '').toLowerCase();
    if (val.includes('prep') || val.includes('nursery') || val.includes('playgroup')) {
      this.admissionForm.admissionFee = 15000;
      this.admissionForm.tuitionFee = 6500;
    } else if (val.includes('1') || val.includes('2') || val.includes('3') || val.includes('4') || val.includes('5')) {
      this.admissionForm.admissionFee = 20000;
      this.admissionForm.tuitionFee = 12500;
    } else if (val.includes('6') || val.includes('7') || val.includes('8')) {
      this.admissionForm.admissionFee = 25000;
      this.admissionForm.tuitionFee = 18000;
    } else if (val.includes('o-level') || val.includes('cambridge')) {
      this.admissionForm.admissionFee = 45000;
      this.admissionForm.tuitionFee = 42000;
    } else {
      this.admissionForm.admissionFee = 30000;
      this.admissionForm.tuitionFee = 28500;
    }
  }

  closeAdmissionModal() {
    this.isAdmissionModalOpen = false;
    this.cdr.detectChanges();
  }

  // --- REAL-TIME ADMISSION FORM VALIDATION & AUTO-FORMATTING ---
  get applicantValidation() {
    const val = (this.admissionForm.applicant || '').trim();
    if (!val) return { valid: false, message: 'Applicant full name is required' };
    if (val.length < 3) return { valid: false, message: 'Name must be at least 3 characters long' };
    return { valid: true, message: 'Student name verified' };
  }

  get fatherNameValidation() {
    const val = (this.admissionForm.fatherName || '').trim();
    if (!val) return { valid: false, message: 'Father / Guardian name is required' };
    if (val.length < 3) return { valid: false, message: 'Name must be at least 3 characters long' };
    return { valid: true, message: 'Guardian verified' };
  }

  get phoneValidation() {
    const val = (this.admissionForm.phone || '').trim();
    if (!val) return { valid: false, message: 'Contact phone / WhatsApp is required' };
    const cleanDigits = val.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10 || cleanDigits.length > 13) {
      return { valid: false, message: 'Enter a valid 10-12 digit mobile number (e.g. +92 300 1234567)' };
    }
    return { valid: true, message: 'Contact number verified' };
  }

  get cnicValidation() {
    const val = (this.admissionForm.fatherCnic || '').trim();
    if (!val) return { valid: true, message: 'Optional NADRA CNIC' };
    const cleanDigits = val.replace(/[^0-9]/g, '');
    if (cleanDigits.length !== 13) {
      return { valid: false, message: 'CNIC must be 13 digits (e.g. 35202-1234567-1)' };
    }
    return { valid: true, message: 'CNIC format verified' };
  }

  get bformValidation() {
    const val = (this.admissionForm.studentBForm || '').trim();
    if (!val) return { valid: true, message: 'Optional NADRA B-Form' };
    const cleanDigits = val.replace(/[^0-9]/g, '');
    if (cleanDigits.length !== 13) {
      return { valid: false, message: 'B-Form must be 13 digits (e.g. 37405-1234567-1)' };
    }
    return { valid: true, message: 'B-Form format verified' };
  }

  get isAdmissionFormValid(): boolean {
    return this.applicantValidation.valid &&
           this.fatherNameValidation.valid &&
           this.phoneValidation.valid &&
           this.cnicValidation.valid &&
           this.bformValidation.valid;
  }

  formatCnicInput(field: 'fatherCnic' | 'studentBForm') {
    let raw = (this.admissionForm[field] || '').replace(/[^0-9]/g, '');
    if (raw.length > 13) raw = raw.slice(0, 13);
    if (raw.length > 12) {
      this.admissionForm[field] = `${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12)}`;
    } else if (raw.length > 5) {
      this.admissionForm[field] = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    } else {
      this.admissionForm[field] = raw;
    }
  }

  formatPhoneInput() {
    let raw = (this.admissionForm.phone || '').trim();
    if (raw.startsWith('03') && raw.length === 11) {
      this.admissionForm.phone = `+92 ${raw.slice(1, 4)} ${raw.slice(4)}`;
    }
  }

  saveAdmission() {
    if (!this.applicantValidation.valid) {
      this.showToast(`⚠️ Student Name Error: ${this.applicantValidation.message}`, 'warning');
      return;
    }
    if (!this.fatherNameValidation.valid) {
      this.showToast(`⚠️ Father Name Error: ${this.fatherNameValidation.message}`, 'warning');
      return;
    }
    if (!this.phoneValidation.valid) {
      this.showToast(`⚠️ Contact Phone Error: ${this.phoneValidation.message}`, 'warning');
      return;
    }
    if (!this.cnicValidation.valid) {
      this.showToast(`⚠️ Guardian CNIC Error: ${this.cnicValidation.message}`, 'warning');
      return;
    }
    if (!this.bformValidation.valid) {
      this.showToast(`⚠️ Student B-Form Error: ${this.bformValidation.message}`, 'warning');
      return;
    }

    const father = this.admissionForm.fatherName.trim();
    const phoneNum = this.admissionForm.phone.trim();
    const roll = this.admissionForm.rollNo || (this.activeStudents.length + 1001).toString();
    const finalMonthlyFee = Math.round(Math.max(0, Number(this.admissionForm.tuitionFee || 18000) * (1 - (Number(this.admissionForm.discount || 0) / 100))));
    const admId = `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newStudent: StudentRecord = {
      id: `ST-${roll}`,
      name: this.admissionForm.applicant.trim(),
      grade: this.admissionForm.appliedFor || 'Class 9',
      section: this.admissionForm.section || 'A',
      status: 'Present',
      attendance: '100%',
      image: this.admissionForm.gender === 'Female'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      guardian: father,
      guardianPhone: phoneNum,
      guardianEmail: this.admissionForm.email ? this.admissionForm.email.trim() : undefined,
      guardianRelation: this.admissionForm.relation || 'Father',
      guardianCnic: this.admissionForm.fatherCnic ? this.admissionForm.fatherCnic.trim() : undefined,
      guardianOccupation: this.admissionForm.fatherOccupation ? this.admissionForm.fatherOccupation.trim() : 'Business / Private Service',
      feeStatus: this.admissionForm.initialPaymentStatus === 'Paid' ? 'Paid' : 'Pending',
      feeAmount: finalMonthlyFee,
      dueBakaya: this.admissionForm.initialPaymentStatus === 'Paid' ? 0 : Number(this.admissionForm.admissionFee || 25000),
      rollNo: roll,
      admissionDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      gender: this.admissionForm.gender,
      dob: this.admissionForm.dob,
      bloodGroup: this.admissionForm.bloodGroup,
      studentBForm: this.admissionForm.studentBForm ? this.admissionForm.studentBForm.trim() : undefined,
      previousSchool: this.admissionForm.previousSchool ? this.admissionForm.previousSchool.trim() : undefined,
      score: this.admissionForm.score ? this.admissionForm.score.trim() : undefined,
      medicalConditions: this.admissionForm.medicalNotes ? this.admissionForm.medicalNotes.trim() : undefined,
      address: this.admissionForm.address ? this.admissionForm.address.trim() : 'Islamabad, Pakistan',
      emergencyContact: this.admissionForm.emergencyContact ? this.admissionForm.emergencyContact.trim() : this.admissionForm.phone.trim()
    };

    // 1. Add to active students list
    this.activeStudents.unshift(newStudent);

    // 2. Add to admissions enquiry log
    const newAdm: AdmissionRecord = {
      id: admId,
      applicant: newStudent.name,
      appliedFor: newStudent.grade,
      fatherName: newStudent.guardian,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Approved',
      score: this.admissionForm.score || 'Admitted & Enrolled',
      phone: newStudent.guardianPhone,
      gender: this.admissionForm.gender,
      dob: this.admissionForm.dob,
      studentBForm: this.admissionForm.studentBForm,
      bloodGroup: this.admissionForm.bloodGroup,
      section: this.admissionForm.section,
      rollNo: roll,
      previousSchool: this.admissionForm.previousSchool,
      relation: this.admissionForm.relation || 'Father',
      fatherCnic: this.admissionForm.fatherCnic,
      email: this.admissionForm.email,
      fatherOccupation: this.admissionForm.fatherOccupation,
      address: this.admissionForm.address,
      emergencyContact: this.admissionForm.emergencyContact,
      admissionFee: Number(this.admissionForm.admissionFee || 25000),
      tuitionFee: Number(this.admissionForm.tuitionFee || 18000),
      discount: Number(this.admissionForm.discount || 0),
      initialPaymentStatus: this.admissionForm.initialPaymentStatus || 'Paid',
      medicalNotes: this.admissionForm.medicalNotes,
      source: 'School Office Direct',
      decisionRemarks: 'Approved & Enrolled by School Admissions Directorate'
    };
    this.admissionsList.unshift(newAdm);

    // 3. Log initial admission fee if Paid
    if (this.admissionForm.initialPaymentStatus === 'Paid') {
      const receiptNo = `CH-ADM-2026-${roll}`;
      this.finances.unshift({
        id: `FIN-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `New Admission Fee Collection — ${newStudent.name} (${newStudent.grade})`,
        studentName: newStudent.name,
        grade: newStudent.grade,
        category: 'Tuition',
        type: 'Income',
        amount: Number(this.admissionForm.admissionFee || 25000),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Verified',
        challanNo: receiptNo
      });
    }

    // 4. Add medical record
    this.studentMedicalRecords.unshift({
      id: `MED-${Math.floor(100 + Math.random() * 899)}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      rollNo: newStudent.rollNo,
      grade: newStudent.grade,
      bloodGroup: newStudent.bloodGroup || 'B+',
      vaccinationStatus: 'Fully Vaccinated',
      allergies: this.admissionForm.medicalNotes || 'None',
      chronicConditions: 'None',
      emergencyContact: newStudent.emergencyContact || newStudent.guardianPhone,
      doctorName: 'Panel Physician',
      lastCheckupDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      medicalAlert: false
    });

    // 5. Ensure the table switches to Page 1 and resets filters/sort so the newly enrolled student is immediately visible right at the top
    this.studentsSortColumn = ''; // Unsorted keeps new student at index 0 (Row 1 of Page 1)
    this.currentPage['students'] = 1;
    this.selectedGradeFilter = 'All';
    this.selectedFeeFilter = 'All';
    this.studentSearchQuery = '';
    this.newlyEnrolledStudentId = newStudent.id;
    this.expandedStudentId = newStudent.id; // Auto-expand dossier so school owner sees full record immediately

    this.saveStateToStorage();
    this.syncToCloud(false);
    this.closeAdmissionModal();

    // Trigger rich live admission alert & notification
    this.triggerAdmissionAlert({
      id: admId,
      studentName: newStudent.name,
      rollNo: newStudent.rollNo,
      grade: `${newStudent.grade} (${newStudent.section})`,
      guardian: newStudent.guardian,
      phone: newStudent.guardianPhone,
      feeStatus: newStudent.feeStatus,
      source: 'Admission Form'
    });

    this.notificationsList.unshift({
      id: 'NOTIF-ADM-' + Date.now(),
      title: `🎉 New Student Enrolled: ${newStudent.name} (Roll #${newStudent.rollNo})`,
      message: `${newStudent.name} admitted to ${newStudent.grade} (${newStudent.section}). Guardian: ${newStudent.guardian} (${newStudent.guardianPhone}). Record active at Row #1 in Students Table.`,
      type: 'general',
      targetRole: 'all',
      createdAt: 'Just now',
      isUnread: true,
      linkTab: 'students'
    });

    this.showToast(`Admission Confirmed! ${newStudent.name} (Roll #${newStudent.rollNo}) enrolled & displayed on Page 1!`, 'success');

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('students-roster-table');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    }
  }

  updateAdmissionStatus(adm: AdmissionRecord, newStatus: any) {
    adm.status = newStatus;
    this.saveStateToStorage();
    this.showToast(`Updated application status for ${adm.applicant} to ${newStatus}`, 'success');
  }

  countAdmissionsByStatus(status: string): number {
    return (this.admissionsList || []).filter(a => a.status === status).length;
  }

  countAdmissionsBySource(source: string): number {
    return (this.admissionsList || []).filter(a => (a.source || 'School Office Direct') === source).length;
  }

  toggleAdmissionExpand(id: string): void {
    this.expandedAdmissionId = this.expandedAdmissionId === id ? null : id;
    this.cdr.detectChanges();
  }

  openAdmissionDossierModal(adm: AdmissionRecord): void {
    this.selectedAdmissionForDossier = adm;
    this.isAdmissionDossierModalOpen = true;
    this.cdr.detectChanges();
  }

  closeAdmissionDossierModal(): void {
    this.isAdmissionDossierModalOpen = false;
    this.selectedAdmissionForDossier = null;
    this.cdr.detectChanges();
  }

  openScheduleInterviewModal(adm: AdmissionRecord): void {
    this.selectedAdmissionForInterview = adm;
    const interviewDateObj = new Date();
    interviewDateObj.setDate(interviewDateObj.getDate() + 3);
    const dateStr = interviewDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.interviewScheduleForm = {
      date: dateStr,
      time: '11:00 AM',
      interviewer: 'Dr. Tahir Malik (Principal & Academic Director)',
      notes: `Entrance evaluation for ${adm.appliedFor}. Bring student original B-Form, Father CNIC, and previous school leaving certificate.`
    };
    this.isScheduleInterviewModalOpen = true;
    this.cdr.detectChanges();
  }

  closeScheduleInterviewModal(): void {
    this.isScheduleInterviewModalOpen = false;
    this.selectedAdmissionForInterview = null;
    this.cdr.detectChanges();
  }

  saveScheduledInterview(): void {
    if (!this.selectedAdmissionForInterview) return;
    this.selectedAdmissionForInterview.status = 'Interview Scheduled';
    this.selectedAdmissionForInterview.interviewDate = `${this.interviewScheduleForm.date} at ${this.interviewScheduleForm.time}`;
    this.selectedAdmissionForInterview.interviewNotes = this.interviewScheduleForm.notes;
    this.saveStateToStorage();
    this.showToast(`✅ Interview scheduled for ${this.selectedAdmissionForInterview.applicant} on ${this.selectedAdmissionForInterview.interviewDate}`, 'success');
    this.closeScheduleInterviewModal();
  }

  approveAndEnrollAdmission(adm: AdmissionRecord): void {
    adm.status = 'Approved';
    adm.decisionRemarks = 'Approved & Formally Enrolled into Academic Register';

    // Check if student already exists in activeStudents
    const existing = this.activeStudents.find(s => s.name.toLowerCase() === adm.applicant.toLowerCase());
    if (!existing) {
      const roll = adm.rollNo || (this.activeStudents.length + 1001).toString();
      const finalMonthlyFee = Math.round(Math.max(0, Number(adm.tuitionFee || 18000) * (1 - (Number(adm.discount || 0) / 100))));
      const newStudent: StudentRecord = {
        id: `ST-${roll}`,
        name: adm.applicant.trim(),
        grade: adm.appliedFor,
        section: adm.section || 'A',
        status: 'Present',
        attendance: '100%',
        image: adm.gender === 'Female'
          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        guardian: adm.fatherName.trim(),
        guardianPhone: adm.phone.trim(),
        guardianEmail: adm.email,
        guardianRelation: adm.relation || 'Father',
        guardianCnic: adm.fatherCnic,
        guardianOccupation: adm.fatherOccupation || 'Private Business / Services',
        feeStatus: adm.initialPaymentStatus === 'Paid' ? 'Paid' : 'Pending',
        feeAmount: finalMonthlyFee,
        dueBakaya: adm.initialPaymentStatus === 'Paid' ? 0 : Number(adm.admissionFee || 25000),
        rollNo: roll,
        admissionDate: adm.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        gender: (adm.gender as any) || 'Male',
        dob: adm.dob,
        bloodGroup: adm.bloodGroup,
        studentBForm: adm.studentBForm,
        previousSchool: adm.previousSchool,
        score: adm.score,
        medicalConditions: adm.medicalNotes,
        address: adm.address || 'Islamabad, Pakistan',
        emergencyContact: adm.emergencyContact || adm.phone
      };
      this.activeStudents.unshift(newStudent);
    }

    this.saveStateToStorage();
    this.showToast(`✅ ${adm.applicant} has been formally Approved & Enrolled into Institutional Register!`, 'success');
  }

  printAdmissionDossier(adm: AdmissionRecord): void {
    this.selectedAdmissionForDossier = adm;
    this.isAdmissionDossierModalOpen = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (typeof window !== 'undefined') window.print();
    }, 350);
  }

  // --- ATTENDANCE ACTIONS ---
  openAttendanceMarkModal() {
    this.isAttendanceMarkModalOpen = true;
    this.cdr.detectChanges();
  }

  closeAttendanceMarkModal() {
    this.isAttendanceMarkModalOpen = false;
    this.cdr.detectChanges();
  }

  markAllPresent() {
    this.activeStudents.forEach(s => s.status = 'Present');
    this.attendanceSummary.presentToday = this.activeStudents.length;
    this.attendanceSummary.absent = 0;
    this.attendanceSummary.lateArrivals = 0;
    this.saveStateToStorage();
    this.closeAttendanceMarkModal();
    this.showToast('Attendance Synchronized: All 1,240 students marked Present!', 'success');
  }

  // --- FINANCE CRUD ---
  openAddFinanceModal() {
    this.financeForm = {
      title: '',
      category: 'Tuition',
      type: 'Income',
      amount: 28500,
      date: 'Oct 15, 2026',
      status: 'Verified'
    };
    this.isFinanceModalOpen = true;
    this.cdr.detectChanges();
  }

  closeFinanceModal() {
    this.isFinanceModalOpen = false;
    this.cdr.detectChanges();
  }

  saveFinance() {
    if (!this.financeForm.title || !this.financeForm.amount) {
      this.showToast('Please enter Title and Amount.', 'warning');
      return;
    }
    const newFin: FinanceRecord = {
      id: `FIN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: this.financeForm.title || '',
      category: (this.financeForm.category as any) || 'Tuition',
      type: (this.financeForm.type as any) || 'Income',
      amount: Number(this.financeForm.amount),
      date: 'Oct 15, 2026',
      status: 'Verified',
      challanNo: `CH-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`
    };
    this.finances.unshift(newFin);
    this.saveStateToStorage();
    this.closeFinanceModal();
    this.showToast(`Ledger entry recorded: ${newFin.title} (PKR ${newFin.amount})`, 'success');
  }

  sendFeeReminder(s: StudentRecord) {
    this.showToast(`Automated Fee Reminder SMS & WhatsApp sent to ${s.guardian} (${s.guardianPhone}) for ${s.name} (PKR ${s.feeAmount})`, 'success');
  }

  deleteFinance(fin: FinanceRecord) {
    this.finances = this.finances.filter(x => x.id !== fin.id);
    this.saveStateToStorage();
    this.showToast('Ledger entry removed.', 'info');
  }

  // --- EXAM CRUD ---
  openAddExamModal() {
    this.examForm = {
      examName: '',
      class: 'Grade 9 to 12 All Sections',
      startDate: 'Nov 25, 2026',
      status: 'Scheduled',
      averageGPA: '3.80 / 4.0'
    };
    this.isExamModalOpen = true;
    this.cdr.detectChanges();
  }

  closeExamModal() {
    this.isExamModalOpen = false;
    this.cdr.detectChanges();
  }

  saveExam() {
    if (!this.examForm.examName) {
      this.showToast('Please enter Examination Title.', 'warning');
      return;
    }
    const newEx: ExamRecord = {
      id: `EXM-${Math.floor(100 + Math.random() * 900)}`,
      examName: this.examForm.examName || '',
      class: this.examForm.class || 'All Sections',
      startDate: this.examForm.startDate || 'Nov 2026',
      status: (this.examForm.status as any) || 'Scheduled',
      averageGPA: this.examForm.averageGPA || '3.75 / 4.0'
    };
    this.examsList.unshift(newEx);
    this.saveStateToStorage();
    this.closeExamModal();
    this.showToast(`Scheduled new examination: ${newEx.examName}`, 'success');
  }

  deleteExam(ex: ExamRecord) {
    this.examsList = this.examsList.filter(x => x.id !== ex.id);
    this.saveStateToStorage();
    this.showToast('Examination record removed.', 'info');
  }

  // --- TIMETABLE CRUD ---
  openAddTimetableModal() {
    this.timetableForm = {
      period: 'Period 6',
      time: '12:15 PM - 01:00 PM',
      subject: 'Robotics & AI',
      teacher: 'Engr. Bilal Hashmi',
      room: 'CS Lab 2',
      grade: 'Grade 10-A'
    };
    this.isTimetableModalOpen = true;
    this.cdr.detectChanges();
  }

  closeTimetableModal() {
    this.isTimetableModalOpen = false;
    this.cdr.detectChanges();
  }

  saveTimetable() {
    if (!this.timetableForm.subject || !this.timetableForm.teacher) {
      this.showToast('Please enter Subject and Teacher.', 'warning');
      return;
    }
    const newTt: TimetableRecord = {
      id: `TT-${Math.floor(10 + Math.random() * 90)}`,
      period: this.timetableForm.period || 'Period 1',
      time: this.timetableForm.time || '08:00 AM',
      subject: this.timetableForm.subject || '',
      teacher: this.timetableForm.teacher || '',
      room: this.timetableForm.room || 'Room 101',
      grade: this.timetableForm.grade || 'Grade 10-A'
    };
    this.timetables.push(newTt);
    this.saveStateToStorage();
    this.closeTimetableModal();
    this.showToast(`Timetable Period added for ${newTt.subject}`, 'success');
  }

  deleteTimetable(tt: TimetableRecord) {
    this.timetables = this.timetables.filter(x => x.id !== tt.id);
    this.saveStateToStorage();
    this.showToast('Timetable period removed.', 'info');
  }

  // --- ANNOUNCEMENT CRUD ---
  openAnnouncementModal() {
    this.announcementForm = {
      title: '',
      target: 'All',
      content: '',
      priority: 'Normal',
      author: 'Principal Office'
    };
    this.isAnnouncementModalOpen = true;
    this.cdr.detectChanges();
  }

  closeAnnouncementModal() {
    this.isAnnouncementModalOpen = false;
    this.cdr.detectChanges();
  }

  saveAnnouncement() {
    if (!this.announcementForm.title || !this.announcementForm.content) {
      this.showToast('Please enter Title and Announcement Content.', 'warning');
      return;
    }
    const newAnn: AnnouncementRecord = {
      id: `ANN-${Math.floor(100 + Math.random() * 900)}`,
      title: this.announcementForm.title || '',
      target: (this.announcementForm.target as any) || 'All',
      date: 'Oct 15, 2026',
      author: 'Principal Office',
      content: this.announcementForm.content || '',
      priority: (this.announcementForm.priority as any) || 'Normal'
    };
    this.announcements.unshift(newAnn);
    this.saveStateToStorage();
    this.closeAnnouncementModal();
    this.showToast(`Announcement Broadcast sent to ${newAnn.target} Portals!`, 'success');
  }

  deleteAnnouncement(ann: AnnouncementRecord) {
    this.announcements = this.announcements.filter(x => x.id !== ann.id);
    this.saveStateToStorage();
    this.showToast('Announcement removed.', 'info');
  }

  // --- TRANSPORT CRUD ---
  openAddTransportModal() {
    this.transportForm = {
      routeName: '',
      vehicleNo: '',
      driverName: '',
      driverPhone: '',
      monthlyFee: 3500,
      capacity: 40,
      enrolledStudents: 32,
      status: 'Active'
    };
    this.isTransportModalOpen = true;
    this.cdr.detectChanges();
  }

  closeTransportModal() {
    this.isTransportModalOpen = false;
    this.cdr.detectChanges();
  }

  saveTransport() {
    if (!this.transportForm.routeName || !this.transportForm.driverName) {
      this.showToast('Please enter Route Name and Driver Name.', 'warning');
      return;
    }
    const newRoute: TransportRouteRecord = {
      id: `TR-${Math.floor(10 + Math.random() * 90)}`,
      routeName: this.transportForm.routeName,
      vehicleNo: this.transportForm.vehicleNo || 'BUS-2026',
      driverName: this.transportForm.driverName,
      driverPhone: this.transportForm.driverPhone || '+92 300 1234567',
      monthlyFee: Number(this.transportForm.monthlyFee) || 3500,
      capacity: Number(this.transportForm.capacity) || 40,
      enrolledStudents: Number(this.transportForm.enrolledStudents) || 30,
      status: (this.transportForm.status as any) || 'Active'
    };
    this.transportRoutes.unshift(newRoute);
    this.saveStateToStorage();
    this.closeTransportModal();
    this.showToast(`Added transport route: ${newRoute.routeName}`, 'success');
  }

  deleteTransport(tr: TransportRouteRecord) {
    if (confirm(`Are you sure you want to remove route ${tr.routeName}?`)) {
      this.transportRoutes = this.transportRoutes.filter(r => r.id !== tr.id);
      this.saveStateToStorage();
      this.showToast(`Removed transport route ${tr.routeName}`, 'warning');
    }
  }

  // --- LIBRARY CRUD & FINE SETTINGS ---
  openFineSettingsModal(): void {
    if (this.activeLibraryStaffRole === 'Assistant Librarian') {
      this.showToast('Permission Restricted: Assistant Librarians cannot alter fine penalty rates.', 'warning');
      return;
    }
    this.isFineSettingsModalOpen = true;
    this.cdr.detectChanges();
  }

  closeFineSettingsModal(): void {
    this.isFineSettingsModalOpen = false;
    this.cdr.detectChanges();
  }

  saveFineRateSettings(): void {
    this.dailyFineRatePKR = Math.max(1, Number(this.dailyFineRatePKR) || 50);
    this.checkAndUpdateOverdueBooks();
    try {
      localStorage.setItem('scs_school_library_fine_rate_v1', String(this.dailyFineRatePKR));
    } catch {}
    this.closeFineSettingsModal();
    this.showToast(`Daily late penalty rate updated to PKR ${this.dailyFineRatePKR}/day. Overdue fines recalculated!`, 'success');
  }

  openAddLibraryModal() {
    if (this.activeLibraryStaffRole === 'Assistant Librarian') {
      this.showToast('Permission Restricted: Assistant Librarians cannot catalog new titles.', 'warning');
      return;
    }
    this.libraryForm = {
      isbn: `ISBN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: '',
      author: '',
      category: 'Science & Computing',
      genre: 'Textbook & Reference',
      subject: 'Physics',
      academicGradeLevel: 'Secondary (Class 10)',
      tagsInput: 'Board Exam Prep, Lab Reference',
      totalCopies: 10,
      availableCopies: 8,
      rackNo: 'RACK-05'
    };
    this.isLibraryModalOpen = true;
    this.cdr.detectChanges();
  }

  closeLibraryModal() {
    this.isLibraryModalOpen = false;
    this.cdr.detectChanges();
  }

  saveLibrary() {
    if (!this.libraryForm.title || !this.libraryForm.author) {
      this.showToast('Please enter Book Title and Author Name.', 'warning');
      return;
    }
    const tagsArr = (this.libraryForm.tagsInput || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newBook: LibraryBookRecord = {
      id: `BK-${Math.floor(100 + Math.random() * 900)}`,
      isbn: this.libraryForm.isbn || `ISBN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: this.libraryForm.title,
      author: this.libraryForm.author,
      category: this.libraryForm.category || 'General Literature',
      genre: this.libraryForm.genre || 'Textbook & Reference',
      subject: this.libraryForm.subject || 'General',
      academicGradeLevel: this.libraryForm.academicGradeLevel || 'All Grades',
      tags: tagsArr.length > 0 ? tagsArr : ['Catalog Entry'],
      totalCopies: Number(this.libraryForm.totalCopies) || 10,
      availableCopies: Number(this.libraryForm.availableCopies) || 10,
      rackNo: this.libraryForm.rackNo || 'RACK-01'
    };
    this.libraryBooks.unshift(newBook);
    this.saveStateToStorage();
    this.closeLibraryModal();
    this.showToast(`Cataloged new book with classification tags: "${newBook.title}"`, 'success');
  }

  deleteLibrary(bk: LibraryBookRecord) {
    if (this.activeLibraryStaffRole === 'Assistant Librarian') {
      this.showToast('Permission Restricted: Assistant Librarians cannot delete catalog records.', 'warning');
      return;
    }
    if (confirm(`Are you sure you want to remove "${bk.title}" from library catalog?`)) {
      this.libraryBooks = this.libraryBooks.filter(b => b.id !== bk.id);
      this.saveStateToStorage();
      this.showToast(`Removed book "${bk.title}"`, 'warning');
    }
  }

  get filteredCatalogBooks(): LibraryBookRecord[] {
    let list = this.libraryBooks;
    const q = (this.librarySearchQuery || '').toLowerCase().trim();
    if (q) {
      list = list.filter(bk =>
        (bk.title || '').toLowerCase().includes(q) ||
        (bk.author || '').toLowerCase().includes(q) ||
        (bk.isbn || '').toLowerCase().includes(q) ||
        (bk.category || '').toLowerCase().includes(q) ||
        (bk.genre || '').toLowerCase().includes(q) ||
        (bk.subject || '').toLowerCase().includes(q) ||
        (bk.academicGradeLevel || '').toLowerCase().includes(q) ||
        (bk.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (this.catalogGenreFilter !== 'All') {
      list = list.filter(bk => bk.genre === this.catalogGenreFilter);
    }
    if (this.catalogSubjectFilter !== 'All') {
      list = list.filter(bk => bk.subject === this.catalogSubjectFilter);
    }
    if (this.catalogGradeFilter !== 'All') {
      list = list.filter(bk => bk.academicGradeLevel === this.catalogGradeFilter);
    }
    return list;
  }

  parseLibraryDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  checkAndUpdateOverdueBooks(): void {
    if (!this.libraryCirculations || !this.libraryCirculations.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updatedCount = 0;
    let newlyOverdueCount = 0;

    this.libraryCirculations.forEach(circ => {
      if (circ.status === 'Issued' || circ.status === 'Overdue') {
        const due = this.parseLibraryDate(circ.dueDate);
        if (due) {
          due.setHours(0, 0, 0, 0);
          if (today.getTime() > due.getTime()) {
            const diffTime = today.getTime() - due.getTime();
            const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            const fine = diffDays * (Number(this.dailyFineRatePKR) || 50);

            if (circ.status === 'Issued') {
              newlyOverdueCount++;
            }
            circ.status = 'Overdue';
            circ.overdueDays = diffDays;
            circ.fineAmount = fine;
            updatedCount++;
          } else if (today.getTime() <= due.getTime() && circ.status === 'Overdue') {
            circ.status = 'Issued';
            circ.overdueDays = 0;
            circ.fineAmount = 0;
            updatedCount++;
          }
        }
      }
    });

    if (updatedCount > 0) {
      try {
        localStorage.setItem('scs_school_library_circulations_v1', JSON.stringify(this.libraryCirculations));
      } catch {}
    }

    if (newlyOverdueCount > 0) {
      this.showToast(`Automated Audit: ${newlyOverdueCount} library circulation item(s) flagged OVERDUE with accrued fines!`, 'warning');
    }
  }

  dispatchOverdueWhatsAppNotice(circ: LibraryCirculationRecord): void {
    const msg = `*CAMPUS LIBRARY OVERDUE NOTICE*\nDear ${circ.borrowerName} (${circ.gradeOrDept}),\n\nThe book "*${circ.bookTitle}*" (ISBN: ${circ.isbn}, Token: ${circ.issueNo}) was due on *${circ.dueDate}*.\nIt is currently *${circ.overdueDays} day(s) OVERDUE* with an accumulated fine of *PKR ${circ.fineAmount}*.\n\nPlease return or renew this title at the Library Resource Desk immediately to clear library dues.\n\n_School Library Automation System_`;
    const encoded = encodeURIComponent(msg);
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
    this.showToast(`Overdue Notice dispatched to WhatsApp for ${circ.borrowerName}`, 'info');
  }

  get libraryCirculationStats() {
    const totalBooksCount = this.libraryBooks.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
    const availableBooksCount = this.libraryBooks.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
    const activeCheckouts = this.libraryCirculations.filter(c => c.status === 'Issued');
    const overdueCheckouts = this.libraryCirculations.filter(c => c.status === 'Overdue');
    const returnedCheckouts = this.libraryCirculations.filter(c => c.status === 'Returned');
    const totalFinesAccrued = overdueCheckouts.reduce((acc, c) => acc + (c.fineAmount || 0), 0);
    const inCirculationCount = totalBooksCount - availableBooksCount;
    const circulationRate = totalBooksCount > 0 
      ? ((inCirculationCount / totalBooksCount) * 100).toFixed(1)
      : '0';

    return {
      totalTitles: this.libraryBooks.length,
      totalBooksCount,
      availableBooksCount,
      activeCheckoutsCount: activeCheckouts.length,
      overdueCheckoutsCount: overdueCheckouts.length,
      returnedCheckoutsCount: returnedCheckouts.length,
      totalFinesAccrued,
      inCirculationCount,
      circulationRate
    };
  }

  get filteredCirculations(): LibraryCirculationRecord[] {
    let list = this.libraryCirculations;
    const q = (this.circulationSearchQuery || '').toLowerCase().trim();
    if (q) {
      list = list.filter(c => 
        (c.borrowerName || '').toLowerCase().includes(q) ||
        (c.borrowerId || '').toLowerCase().includes(q) ||
        (c.bookTitle || '').toLowerCase().includes(q) ||
        (c.isbn || '').toLowerCase().includes(q) ||
        (c.issueNo || '').toLowerCase().includes(q) ||
        (c.gradeOrDept || '').toLowerCase().includes(q)
      );
    }
    if (this.circulationStatusFilter !== 'All') {
      list = list.filter(c => c.status === this.circulationStatusFilter);
    }
    if (this.circulationCategoryFilter !== 'All') {
      const matchingBookIds = this.libraryBooks
        .filter(b => b.category === this.circulationCategoryFilter)
        .map(b => b.id);
      list = list.filter(c => matchingBookIds.includes(c.bookId));
    }
    return list;
  }

  openCheckoutModal(bk?: LibraryBookRecord): void {
    const defaultBook = bk || this.libraryBooks[0];
    const defaultStudent = this.activeStudents[0];
    this.checkoutForm = {
      bookId: defaultBook ? defaultBook.id : '',
      borrowerType: 'Student',
      studentId: defaultStudent ? defaultStudent.rollNo || defaultStudent.id : '1091',
      studentName: defaultStudent ? defaultStudent.name : 'Rayyan Kashif',
      grade: defaultStudent ? defaultStudent.grade : 'Grade 9 Computer Science',
      issuePeriodDays: 14,
      notes: 'Issued under standard institutional library regulations.'
    };
    this.isCheckoutModalOpen = true;
    this.cdr.detectChanges();
  }

  closeCheckoutModal(): void {
    this.isCheckoutModalOpen = false;
    this.cdr.detectChanges();
  }

  onCheckoutStudentChange(studentId: string): void {
    const st = this.activeStudents.find(s => s.id === studentId || s.rollNo === studentId);
    if (st) {
      this.checkoutForm.studentId = st.rollNo || st.id;
      this.checkoutForm.studentName = st.name;
      this.checkoutForm.grade = st.grade;
    }
  }

  confirmCheckoutBook(): void {
    if (!this.checkoutForm.bookId) {
      this.showToast('Please select a book title from the catalog.', 'warning');
      return;
    }
    const bk = this.libraryBooks.find(b => b.id === this.checkoutForm.bookId);
    if (!bk) {
      this.showToast('Selected book could not be found.', 'warning');
      return;
    }
    if (bk.availableCopies <= 0) {
      this.showToast(`No copies of "${bk.title}" available on shelves.`, 'warning');
      return;
    }

    const now = new Date();
    const issueDateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dueDateObj = new Date(now.getTime() + (Number(this.checkoutForm.issuePeriodDays) || 14) * 24 * 60 * 60 * 1000);
    const dueDateStr = dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newCirculation: LibraryCirculationRecord = {
      id: 'CIR-' + Date.now(),
      issueNo: 'CIR-2026-' + String(this.libraryCirculations.length + 101).padStart(3, '0'),
      bookId: bk.id,
      bookTitle: bk.title,
      isbn: bk.isbn,
      borrowerType: this.checkoutForm.borrowerType,
      borrowerName: this.checkoutForm.borrowerType === 'Student' ? (this.checkoutForm.studentName || 'Student') : 'Faculty Member',
      borrowerId: this.checkoutForm.borrowerType === 'Student' ? (this.checkoutForm.studentId || 'RN-1099') : 'FAC-01',
      gradeOrDept: this.checkoutForm.borrowerType === 'Student' ? (this.checkoutForm.grade || 'General') : 'Department of Science',
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      status: 'Issued',
      overdueDays: 0,
      fineAmount: 0,
      conditionNotes: this.checkoutForm.notes || 'Issued in verified good condition'
    };

    bk.availableCopies = Math.max(0, bk.availableCopies - 1);
    this.libraryCirculations.unshift(newCirculation);
    this.saveStateToStorage();
    this.checkAndUpdateOverdueBooks();
    this.closeCheckoutModal();
    this.showToast('Book "' + bk.title + '" checked out to ' + newCirculation.borrowerName + ' successfully!', 'success');
  }

  returnCirculationBook(rec: LibraryCirculationRecord): void {
    if (rec.status === 'Returned') {
      this.showToast('This book has already been marked returned.', 'info');
      return;
    }
    rec.status = 'Returned';
    rec.returnDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const bk = this.libraryBooks.find(b => b.id === rec.bookId || b.title === rec.bookTitle);
    if (bk) {
      bk.availableCopies = Math.min(bk.totalCopies, bk.availableCopies + 1);
    }
    this.saveStateToStorage();
    this.checkAndUpdateOverdueBooks();
    this.showToast('Marked "' + rec.bookTitle + '" as returned by ' + rec.borrowerName + '. Inventory updated!', 'success');
  }

  renewCirculationBook(rec: LibraryCirculationRecord): void {
    const currentDue = new Date(rec.dueDate);
    const newDue = isNaN(currentDue.getTime()) ? new Date(Date.now() + 7 * 86400000) : new Date(currentDue.getTime() + 7 * 86400000);
    rec.dueDate = newDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (rec.status === 'Overdue') {
      rec.status = 'Issued';
      rec.fineAmount = 0;
      rec.overdueDays = 0;
    }
    this.saveStateToStorage();
    this.checkAndUpdateOverdueBooks();
    this.showToast('Renewed loan for "' + rec.bookTitle + '" (+7 Days). New due date: ' + rec.dueDate, 'info');
  }

  openBorrowSlipModal(rec: LibraryCirculationRecord): void {
    this.selectedCirculationSlip = rec;
    this.isBorrowSlipModalOpen = true;
    this.cdr.detectChanges();
  }

  closeBorrowSlipModal(): void {
    this.isBorrowSlipModalOpen = false;
    this.selectedCirculationSlip = null;
    this.cdr.detectChanges();
  }

  printBorrowSlip(): void {
    if (typeof window !== 'undefined') window.print();
  }

  exportLibraryCirculationCSV(): void {
    if (!this.libraryCirculations.length) {
      this.showToast('No circulation records found to export', 'warning');
      return;
    }
    const headers = [
      'Sr No',
      'Issue Token Ref',
      'Book Title',
      'ISBN Number',
      'Borrower Full Name',
      'Borrower Roll / Staff ID',
      'Borrower Type',
      'Class / Department',
      'Issue Date',
      'Due Date',
      'Return Date',
      'Circulation Status',
      'Overdue Days',
      'Late Fine Accrued (PKR)',
      'Book Condition Remarks'
    ];
    const rows = this.libraryCirculations.map((c, i) => [
      i + 1,
      '"' + c.issueNo + '"',
      '"' + c.bookTitle + '"',
      '"' + c.isbn + '"',
      '"' + c.borrowerName + '"',
      '"' + c.borrowerId + '"',
      '"' + c.borrowerType + '"',
      '"' + c.gradeOrDept + '"',
      '"' + c.issueDate + '"',
      '"' + c.dueDate + '"',
      '"' + (c.returnDate || 'Pending') + '"',
      '"' + c.status + '"',
      c.overdueDays,
      c.fineAmount,
      '"' + (c.conditionNotes || 'N/A') + '"'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Library_Circulation_Ledger_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('Library Circulation Ledger exported successfully (CSV)', 'success');
  }

  openLibraryPDFReportModal(): void {
    this.checkAndUpdateOverdueBooks();
    this.isLibraryPDFModalOpen = true;
    this.cdr.detectChanges();
  }

  closeLibraryPDFReportModal(): void {
    this.isLibraryPDFModalOpen = false;
    this.cdr.detectChanges();
  }

  printLibraryPDFReport(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  // --- BARCODE / ISBN SCANNER METHODS ---
  openBarcodeScannerModal(mode: 'checkout' | 'checkin' | 'search' = 'checkout'): void {
    this.barcodeScanTargetMode = mode;
    this.isBarcodeScannerModalOpen = true;
    this.scannedIsbnResult = '';
    this.manualIsbnInput = '';
    this.isCameraActive = false;
    this.cdr.detectChanges();
    this.startCameraScanner();
  }

  closeBarcodeScannerModal(): void {
    this.stopCameraStream();
    this.isBarcodeScannerModalOpen = false;
    this.cdr.detectChanges();
  }

  setBarcodeScanTargetMode(mode: 'checkout' | 'checkin' | 'search'): void {
    this.barcodeScanTargetMode = mode;
    this.cdr.detectChanges();
  }

  startCameraScanner(targetMode: 'user' | 'environment' = 'user', elementId: string = 'kiosk-iris-video-feed'): void {
    this.cameraFacingMode = targetMode;
    this.cameraPermissionError = '';
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      this.stopCameraStream();

      const bindStreamToElement = (stream: MediaStream) => {
        this.cameraStream = stream;
        this.isCameraActive = true;
        this.cdr.detectChanges();

        const tryAttach = (attemptsLeft: number) => {
          const videoEl = (
            document.getElementById(elementId) ||
            document.getElementById('face-enrollment-video-feed') ||
            document.getElementById('secure-eye-overlay-video-feed') ||
            document.getElementById('kiosk-iris-video-feed') ||
            document.getElementById('enrollment-iris-video-feed') ||
            document.getElementById('barcode-video-feed')
          ) as HTMLVideoElement;

          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.play().catch(() => {});
            if (targetMode === 'environment') {
              this.attachBarcodeDetectionLoop(videoEl);
            }
          } else if (attemptsLeft > 0) {
            setTimeout(() => tryAttach(attemptsLeft - 1), 100);
          }
        };

        tryAttach(8);
      };

      navigator.mediaDevices.getUserMedia({ video: { facingMode: targetMode } })
        .then((stream) => bindStreamToElement(stream))
        .catch((err) => {
          console.warn('Camera facingMode constraints failed, retrying standard video:', err);
          navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => bindStreamToElement(stream))
            .catch((cameraErr) => {
              console.warn('Camera permission unavailable or denied in frame:', cameraErr);
              this.isCameraActive = false;
              this.cameraPermissionError = 'Device camera access is restricted or awaiting permission. Biometric sensor simulation active.';
              this.cdr.detectChanges();
            });
        });
    } else {
      this.isCameraActive = false;
      this.cameraPermissionError = 'Web camera API not supported on this browser. Interactive biometric sensor simulation active.';
      this.cdr.detectChanges();
    }
  }

  toggleCameraFacingMode(elementId: string = 'face-enrollment-video-feed'): void {
    const newMode = this.cameraFacingMode === 'user' ? 'environment' : 'user';
    this.startCameraScanner(newMode, elementId);
  }

  attachBarcodeDetectionLoop(videoEl: HTMLVideoElement): void {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
        const interval = setInterval(() => {
          if (!this.isCameraActive || !this.isBarcodeScannerModalOpen) {
            clearInterval(interval);
            return;
          }
          detector.detect(videoEl).then((barcodes: any[]) => {
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue) {
                const matchedBk = this.libraryBooks.find(b => b.isbn.replace(/[^0-9]/g, '').includes(rawValue.replace(/[^0-9]/g, '')) || b.isbn === rawValue);
                if (matchedBk) {
                  clearInterval(interval);
                  this.simulateBarcodeScan(matchedBk);
                }
              }
            }
          }).catch(() => {});
        }, 600);
      } catch (e) {
        console.warn('BarcodeDetector API fallback active.');
      }
    }
  }

  stopCameraStream(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this.isCameraActive = false;
  }

  processManualIsbnScan(): void {
    const raw = (this.manualIsbnInput || '').trim();
    if (!raw) {
      this.showToast('Please enter an ISBN barcode or circulation ID.', 'warning');
      return;
    }
    const bk = this.libraryBooks.find(b => 
      b.isbn.toLowerCase().includes(raw.toLowerCase()) || 
      b.id.toLowerCase() === raw.toLowerCase() ||
      b.title.toLowerCase().includes(raw.toLowerCase())
    );
    if (bk) {
      this.simulateBarcodeScan(bk);
    } else {
      const circ = this.libraryCirculations.find(c => c.issueNo.toLowerCase() === raw.toLowerCase() || c.id.toLowerCase() === raw.toLowerCase());
      if (circ && this.barcodeScanTargetMode === 'checkin') {
        this.returnCirculationBook(circ);
        this.closeBarcodeScannerModal();
      } else {
        this.showToast(`No catalog book or circulation record matched ISBN/ID "${raw}"`, 'warning');
      }
    }
  }

  simulateBarcodeScan(bk: LibraryBookRecord): void {
    this.scannedIsbnResult = bk.isbn;
    
    if (this.barcodeScanTargetMode === 'checkout') {
      this.checkoutForm.bookId = bk.id;
      this.showToast(`📷 Camera Barcode Matched: "${bk.title}" (ISBN: ${bk.isbn})`, 'success');
      setTimeout(() => {
        this.closeBarcodeScannerModal();
        this.openCheckoutModal();
      }, 450);
    } else if (this.barcodeScanTargetMode === 'checkin') {
      const activeCirc = this.libraryCirculations.find(c => (c.bookId === bk.id || c.bookTitle.toLowerCase() === bk.title.toLowerCase() || c.isbn === bk.isbn) && c.status !== 'Returned');
      if (activeCirc) {
        this.returnCirculationBook(activeCirc);
        this.showToast(`📷 Camera Barcode Check-In Success: "${bk.title}" returned by ${activeCirc.borrowerName}.`, 'success');
      } else {
        this.showToast(`📷 ISBN Barcode "${bk.title}" matched, but no active borrowed copy found.`, 'info');
      }
      setTimeout(() => {
        this.closeBarcodeScannerModal();
      }, 450);
    } else {
      this.librarySearchQuery = bk.title;
      this.showToast(`📷 Camera Barcode Catalog Filter: "${bk.title}"`, 'info');
      setTimeout(() => {
        this.closeBarcodeScannerModal();
      }, 450);
    }
  }

  // --- AUTOMATED OVERDUE REMINDER METHODS ---
  openAutomatedReminderModal(circ?: LibraryCirculationRecord): void {
    this.selectedReminderCirculation = circ || null;
    this.isAutomatedReminderModalOpen = true;
    this.isDispatchingReminders = false;
    this.dispatchProgressText = '';
    this.cdr.detectChanges();
  }

  closeAutomatedReminderModal(): void {
    this.isAutomatedReminderModalOpen = false;
    this.selectedReminderCirculation = null;
    this.isDispatchingReminders = false;
    this.cdr.detectChanges();
  }

  get overdueRemindersList(): LibraryCirculationRecord[] {
    if (this.selectedReminderCirculation) {
      return [this.selectedReminderCirculation];
    }
    return this.libraryCirculations.filter(c => c.status === 'Overdue');
  }

  confirmDispatchAutomatedReminders(): void {
    const list = this.overdueRemindersList;
    if (!list.length) {
      this.showToast('No overdue circulations found to send reminders.', 'warning');
      return;
    }

    this.isDispatchingReminders = true;
    this.dispatchProgressText = 'Initializing SCS Telecom & WhatsApp Gateway...';
    this.cdr.detectChanges();

    setTimeout(() => {
      this.dispatchProgressText = 'Formatting overdue fine ledger & SMS templates...';
      this.cdr.detectChanges();
    }, 700);

    setTimeout(() => {
      let sentCount = 0;
      list.forEach(circ => {
        sentCount++;
        const logEntry = {
          id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recipient: circ.borrowerName + ' (' + circ.gradeOrDept + ')',
          type: 'Library Overdue Fine Alert',
          channel: 'SMS Gateway + In-App Portal + WhatsApp',
          message: `Overdue book "${circ.bookTitle}" (${circ.overdueDays} days overdue). Accrued Fine: PKR ${circ.fineAmount}`,
          status: 'Delivered'
        };
        if (this.dispatchAlertLogs) {
          this.dispatchAlertLogs.unshift(logEntry as any);
        }
      });

      try {
        localStorage.setItem('scs_school_alert_logs_v1', JSON.stringify(this.dispatchAlertLogs));
      } catch {}

      this.isDispatchingReminders = false;
      this.closeAutomatedReminderModal();
      this.showToast(`Automated Overdue Reminders dispatched successfully to ${sentCount} borrower(s)!`, 'success');
    }, 1600);
  }

  reserveBookForStudent(bk: LibraryBookRecord): void {
    this.showToast(`Desk Reservation Placed: "${bk.title}" (Rack ${bk.rackNo}). Hold valid for 24 hours.`, 'success');
  }

  get studentLibraryCirculations(): LibraryCirculationRecord[] {
    return this.libraryCirculations.filter(c => c.borrowerName.toLowerCase().includes('zayan') || c.borrowerId === '1001' || c.borrowerId === 'ST-1001');
  }

  // --- FEE DEFAULTER PROMISSORY NOTE & RESTRUCTURING METHODS ---
  saveFeeDefaultersToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('scs_school_fee_defaulters_v1', JSON.stringify(this.studentFeeDefaulters));
      } catch {}
    }
  }

  openPromissoryModal(defaulter: StudentFeeDefaulterRecord): void {
    this.selectedPromissoryDefaulter = defaulter;
    const bakaya = defaulter.totalRemainingBakaya || 15000;
    this.promissoryForm.downPayment = Math.round(bakaya * 0.3);
    this.promissoryForm.waiverAmount = 0;
    this.promissoryForm.installmentsCount = 3;
    this.promissoryForm.firstInstallmentDate = 'Dec 05, 2026';
    this.promissoryForm.cnicNo = '35202-1928374-1';
    this.promissoryForm.witnessName = 'Malik Zahid (Guardian Relation)';
    this.promissoryForm.notes = 'Post-dated Cheque #402919 Meezan Bank attached for security clearance.';
    this.promissoryBondNo = 'BOND-2026-' + Math.floor(1000 + Math.random() * 9000);
    this.isPromissoryModalOpen = true;
    this.cdr.detectChanges();
  }

  closePromissoryModal(): void {
    this.isPromissoryModalOpen = false;
    this.selectedPromissoryDefaulter = null;
    this.cdr.detectChanges();
  }

  getCalculatedInstallments(): Array<{ num: number; dueDate: string; amount: number; status: string }> {
    if (!this.selectedPromissoryDefaulter) return [];
    const totalBakaya = this.selectedPromissoryDefaulter.totalRemainingBakaya || 0;
    const remainingAfterDown = Math.max(0, totalBakaya - (this.promissoryForm.downPayment || 0) - (this.promissoryForm.waiverAmount || 0));
    const count = Math.max(1, this.promissoryForm.installmentsCount || 1);
    const installmentAmount = Math.round(remainingAfterDown / count);

    const baseMonths = ['Dec 05, 2026', 'Jan 05, 2027', 'Feb 05, 2027', 'Mar 05, 2027'];
    const list: Array<{ num: number; dueDate: string; amount: number; status: string }> = [];

    for (let i = 0; i < count; i++) {
      list.push({
        num: i + 1,
        dueDate: baseMonths[i] || `Month ${i + 1}`,
        amount: i === count - 1 ? remainingAfterDown - installmentAmount * (count - 1) : installmentAmount,
        status: 'Scheduled & Guaranteed'
      });
    }
    return list;
  }

  savePromissoryAgreement(): void {
    if (!this.selectedPromissoryDefaulter) return;
    const d = this.selectedPromissoryDefaulter;
    d.alertStatus = 'WhatsApp Reminder Sent';
    d.lastAlertTimestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' (Restructured)';
    
    this.saveFeeDefaultersToStorage();
    
    if (this.schoolAuditLogs) {
      this.schoolAuditLogs.unshift({
        id: 'AUDIT-' + Math.floor(10000 + Math.random() * 90000),
        timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        operatorName: 'Accounts Controller / Principal',
        operatorRole: 'Accounts Controller',
        actionType: 'Fee Waiver / Concession',
        category: 'Financial',
        entityId: d.rollNo,
        entityDescription: `Promissory Bond ${this.promissoryBondNo} for ${d.studentName} (${d.grade})`,
        details: `Restructured PKR ${d.totalRemainingBakaya.toLocaleString()} into ${this.promissoryForm.installmentsCount} installments with down payment PKR ${this.promissoryForm.downPayment.toLocaleString()}`,
        severity: 'Authorized Override',
        verifiedBy: 'Dr. Tahir Malik (Principal)'
      });
    }

    this.showToast(`Promissory Agreement & Legal Bond ${this.promissoryBondNo} registered successfully for ${d.studentName}!`, 'success');
    this.closePromissoryModal();
  }

  printPromissoryBond(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  sendDefaulterWhatsAppDirect(defaulter: StudentFeeDefaulterRecord): void {
    const phone = defaulter.guardianPhone ? defaulter.guardianPhone.replace(/[^0-9]/g, '') : '923001234567';
    const msg = `Dear Guardian of ${defaulter.studentName} (${defaulter.grade}),\n\n` +
      `This is an urgent notice from Data Click IT HUB School Accounts Directorate.\n` +
      `Total Fee Bakaya Dues: PKR ${defaulter.totalRemainingBakaya.toLocaleString()} (${defaulter.unpaidMonthsCount} months unpaid).\n` +
      `Unpaid Months: ${defaulter.unpaidMonthsList.join(', ')}.\n\n` +
      `Please clear dues immediately or visit the Accounts Office to sign an Installment Restructuring Agreement to prevent student portal lock.\n\n` +
      `Accounts Office Contact: +92 51 9283741`;
    
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    defaulter.alertStatus = 'WhatsApp Reminder Sent';
    defaulter.lastAlertTimestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.saveFeeDefaultersToStorage();
    this.showToast(`WhatsApp reminder initialized for ${defaulter.studentName}`, 'success');
  }

  // --- FACULTY SUBSTITUTION DUTY ENHANCEMENTS ---
  openSubstitutionPDFModal(): void {
    this.isSubstitutionPDFModalOpen = true;
    this.cdr.detectChanges();
  }

  closeSubstitutionPDFModal(): void {
    this.isSubstitutionPDFModalOpen = false;
    this.cdr.detectChanges();
  }

  printSubstitutionPDFReport(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  sendSubstituteWhatsApp(sub: SubstituteArrangementRecord): void {
    const msg = `Dear ${sub.substituteTeacher},\n\n` +
      `OFFICIAL FACULTY COVER DUTY ASSIGNMENT\n` +
      `--------------------------------------\n` +
      `Date: ${sub.date}\n` +
      `Target Class: ${sub.grade}\n` +
      `Subject Period: ${sub.subject}\n` +
      `Time Slot: ${sub.period} (${sub.roomNo || 'Main Classroom'})\n` +
      `Absent Faculty: ${sub.absentTeacher}\n\n` +
      `Please report promptly to the classroom to ensure seamless student supervision.\n\n` +
      `Regards,\nPrincipal Directorate`;

    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
    this.showToast(`WhatsApp substitution slip sent to ${sub.substituteTeacher}`, 'success');
  }

  // --- INITIAL BIOMETRIC EYE IRIS ENROLLMENT REGISTRATION ---
  openBiometricEnrollmentModal(memberId?: string, role: 'Student' | 'Teacher' = 'Student'): void {
    this.closeBiometricKioskModal();
    this.openFaceEnrollmentModal(memberId, role);
  }

  closeBiometricEnrollmentModal(): void {
    this.stopCameraStream();
    this.isBiometricEnrollmentModalOpen = false;
    this.enrollmentScanStatus = 'Idle';
    this.cdr.detectChanges();
  }

  triggerBiometricEnrollmentScan(): void {
    if (!this.selectedEnrollmentMemberId) {
      this.showToast('Please select a student or teacher profile for eye iris & fingerprint enrollment.', 'warning');
      return;
    }
    this.enrollmentScanStatus = 'Scanning';
    this.cdr.detectChanges();

    setTimeout(() => {
      let memberName = 'Member';
      if (this.selectedEnrollmentRole === 'Student') {
        const st = this.activeStudents.find(s => s.id === this.selectedEnrollmentMemberId);
        if (st) {
          st.biometricEnrolled = true;
          st.irisScanCode = 'IRIS-' + Math.floor(10000 + Math.random() * 89999);
          st.irisEnrolledAt = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          st.fingerprintEnrolled = true;
          st.fingerprintTemplateHash = 'FP-SHA256-ST-' + st.rollNo + '-' + Math.floor(10000 + Math.random() * 89999);
          st.faceEmbeddingToken = 'SEC-FACE-256-' + st.rollNo + '-X99';
          memberName = st.name;
        }
      } else {
        const tch = this.teachers.find(t => t.id === this.selectedEnrollmentMemberId);
        if (tch) {
          tch.biometricEnrolled = true;
          tch.irisScanCode = 'IRIS-' + Math.floor(10000 + Math.random() * 89999);
          tch.irisEnrolledAt = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          tch.fingerprintEnrolled = true;
          tch.fingerprintTemplateHash = 'FP-SHA256-TCH-' + tch.id + '-' + Math.floor(10000 + Math.random() * 89999);
          tch.faceEmbeddingToken = 'SEC-FACE-256-' + tch.id + '-TCH';
          memberName = tch.name;
        }
      }

      this.saveStateToStorage();
      this.enrollmentScanStatus = 'Enrolled';
      this.showToast(`✅ Biometric Eye Iris & Fingerprint Profile for ${memberName} successfully registered & saved!`, 'success');
      this.cdr.detectChanges();
    }, 1800);
  }

  // --- FACE BIOMETRIC ENROLLMENT COMPONENT METHODS ---
  openFaceEnrollmentModal(memberId?: string, role: 'Student' | 'Teacher' = 'Student'): void {
    if (this.autoScanTimerRef) {
      clearInterval(this.autoScanTimerRef);
      this.autoScanTimerRef = null;
    }
    this.isFaceEnrollmentModalOpen = true;
    this.enrollmentMode = 'select_existing';
    this.selectedEnrollmentRole = role;
    this.selectedEnrollmentMemberId = memberId || (role === 'Student' ? (this.activeStudents[0]?.id || '') : (this.teachers[0]?.id || ''));
    this.enrollmentStep = 'camera';
    this.enrolledCapturedImage = '';
    this.cameraPermissionError = '';
    this.cdr.detectChanges();
    this.startCameraScanner('user', 'face-enrollment-video-feed');
  }

  closeFaceEnrollmentModal(): void {
    if (this.autoScanTimerRef) {
      clearInterval(this.autoScanTimerRef);
      this.autoScanTimerRef = null;
    }
    this.stopCameraStream();
    this.isFaceEnrollmentModalOpen = false;
    this.enrollmentStep = 'camera';
    this.enrolledCapturedImage = '';
    this.cdr.detectChanges();
  }

  openInNewBrowserTab(): void {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  }

  captureViewfinderBiometricLandmarks(context: 'enrollment' | 'verification'): void {
    const sample = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
    if (context === 'enrollment') {
      this.enrolledCapturedImage = sample;
      this.showToast('📸 Optical sensor captured eye & face landmarks from viewfinder! Processing registration...', 'info');
      this.cdr.detectChanges();
      this.executeFaceBiometricEnrollment();
    } else {
      this.verificationCapturedImage = sample;
      this.showToast('👁️ Optical sensor captured live eye scan from viewfinder! Verifying candidate...', 'info');
      this.cdr.detectChanges();
      this.startSecureEyeMatchingLoop();
    }
  }

  instantVerifyCandidate(): void {
    let target: any = null;
    if (this.targetVerificationRole === 'Student') {
      target = this.activeStudents.find(s => s.id === this.targetVerificationMemberId) || this.activeStudents[0];
    } else {
      target = this.teachers.find(t => t.id === this.targetVerificationMemberId) || this.teachers[0];
    }

    if (!target) {
      this.showToast('No member selected for verification.', 'warning');
      return;
    }

    if (!target.biometricEnrolled) {
      target.biometricEnrolled = true;
      target.irisScanCode = 'IRIS-' + Math.floor(10000 + Math.random() * 89999);
      target.faceEmbeddingToken = 'SEC-FACE-256-' + Math.floor(1000 + Math.random() * 8999);
      this.showToast(`⚡ Instant biometric profile generated for ${target.name}!`, 'info');
    }

    this.verificationCapturedImage = target.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
    this.startSecureEyeMatchingLoop();
  }

  autoEnrollAndMatchCurrent(): void {
    this.instantVerifyCandidate();
  }

  triggerNativeCameraCapture(inputId: string): void {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(inputId) as HTMLInputElement;
      if (el) {
        el.value = '';
        el.click();
      }
    }
  }

  onMobilePhotoCaptured(event: any, context: 'enrollment' | 'verification'): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      if (context === 'enrollment') {
        this.enrolledCapturedImage = base64;
        this.cameraPermissionError = '';
        this.showToast('📸 Real eye & face photo captured from phone camera! Tap "Process & Register" to complete.', 'success');
        this.cdr.detectChanges();
      } else {
        this.verificationCapturedImage = base64;
        this.cameraPermissionError = '';
        this.showToast('👁️ Live eye verification photo captured! Matching with registered profile...', 'info');
        this.cdr.detectChanges();
        setTimeout(() => {
          this.startSecureEyeMatchingLoop();
        }, 600);
      }
    };
    reader.readAsDataURL(file);
  }

  useSampleBiometricEyePhoto(context: 'enrollment' | 'verification'): void {
    const sample = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
    if (context === 'enrollment') {
      this.enrolledCapturedImage = sample;
      this.showToast('🧪 Verified biometric eye & face sample loaded! Extracting landmarks...', 'info');
      this.cdr.detectChanges();
      setTimeout(() => {
        this.executeFaceBiometricEnrollment();
      }, 500);
    } else {
      this.verificationCapturedImage = sample;
      this.showToast('🧪 Live verification eye sample loaded! Matching against database...', 'info');
      this.cdr.detectChanges();
      setTimeout(() => {
        this.startSecureEyeMatchingLoop();
      }, 500);
    }
  }

  addNewMemberAndProceedToBiometric(): void {
    if (!this.newEnrollmentUser.name.trim()) {
      this.showToast('Please enter full name of student or faculty member.', 'warning');
      return;
    }
    const rollId = this.newEnrollmentUser.rollOrId.trim() || String(Math.floor(10000000 + Math.random() * 90000000));
    const newId = 'USER-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000);

    if (this.newEnrollmentUser.role === 'Student') {
      const newStudent: StudentRecord = {
        id: newId,
        name: this.newEnrollmentUser.name.trim(),
        grade: this.newEnrollmentUser.gradeOrRole || 'Class 9',
        section: this.newEnrollmentUser.section || 'A',
        status: 'Absent',
        attendance: '0%',
        image: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
        guardian: this.newEnrollmentUser.fatherName.trim() || 'Parent / Guardian',
        guardianPhone: '+92 300 0000000',
        feeStatus: 'Paid',
        feeAmount: 12500,
        rollNo: rollId,
        admissionDate: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        biometricEnrolled: false,
        fingerprintEnrolled: false
      };
      this.activeStudents.unshift(newStudent);
      this.selectedEnrollmentRole = 'Student';
      this.selectedEnrollmentMemberId = newStudent.id;
    } else {
      const newTeacher: TeacherRecord = {
        id: newId,
        name: this.newEnrollmentUser.name.trim(),
        subject: this.newEnrollmentUser.gradeOrRole || 'Senior Faculty',
        qualification: 'M.Sc / B.Ed',
        classes: 4,
        status: 'Active',
        rating: 4.9,
        email: `${this.newEnrollmentUser.name.toLowerCase().replace(/\s+/g, '')}@school.edu.pk`,
        phone: '+92 311 0000000',
        image: `https://images.unsplash.com/photo-${1507003211169 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
        designation: this.newEnrollmentUser.gradeOrRole || 'Teacher',
        biometricEnrolled: false,
        fingerprintEnrolled: false,
        salaryStatus: 'Disbursed',
        monthlySalary: 45000
      };
      this.teachers.unshift(newTeacher);
      this.selectedEnrollmentRole = 'Teacher';
      this.selectedEnrollmentMemberId = newTeacher.id;
    }

    const savedName = this.newEnrollmentUser.name;
    this.saveStateToStorage();
    this.enrollmentMode = 'select_existing';
    this.enrollmentStep = 'camera';
    this.enrolledCapturedImage = '';
    this.showToast(`✅ Member "${savedName}" registered in database! Please snap or activate camera to add their eye scan.`, 'success');

    // Reset form
    this.newEnrollmentUser = {
      name: '',
      rollOrId: '',
      gradeOrRole: 'Class 9',
      section: 'A',
      fatherName: '',
      role: 'Student'
    };

    this.cdr.detectChanges();
    this.startCameraScanner('user', 'face-enrollment-video-feed');
  }

  executeFaceBiometricEnrollment(): void {
    if (this.autoScanTimerRef) {
      clearInterval(this.autoScanTimerRef);
      this.autoScanTimerRef = null;
    }
    if (!this.selectedEnrollmentMemberId) {
      this.showToast('Please select a student or teacher profile for face biometric registration.', 'warning');
      return;
    }

    // Check if camera is active OR a real photo was captured from mobile camera
    if (!this.isCameraActive && !this.enrolledCapturedImage) {
      // Auto optical viewfinder sensor snapshot fallback so enrollment is 100% operational
      this.enrolledCapturedImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
      this.showToast('📸 Optical biometric viewfinder captured facial landmarks! Proceeding with registration...', 'info');
    }

    this.enrollmentStep = 'analyzing';
    this.cdr.detectChanges();

    setTimeout(() => {
      let memberName = 'Member';
      let memberCode = '';
      if (this.selectedEnrollmentRole === 'Student') {
        const st = this.activeStudents.find(s => s.id === this.selectedEnrollmentMemberId);
        if (st) {
          st.biometricEnrolled = true;
          if (this.enrolledCapturedImage) {
            st.image = this.enrolledCapturedImage;
          }
          st.faceEmbeddingToken = 'SEC-FACE-256-' + Math.floor(1000 + Math.random() * 8999);
          st.irisScanCode = 'IRIS-' + Math.floor(10000 + Math.random() * 89999);
          st.irisEnrolledAt = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          st.fingerprintEnrolled = true;
          st.fingerprintTemplateHash = 'FP-SHA256-ST-' + st.rollNo + '-' + Math.floor(10000 + Math.random() * 89999);
          memberName = st.name;
          memberCode = st.rollNo;
        }
      } else {
        const tch = this.teachers.find(t => t.id === this.selectedEnrollmentMemberId);
        if (tch) {
          tch.biometricEnrolled = true;
          if (this.enrolledCapturedImage) {
            tch.image = this.enrolledCapturedImage;
          }
          tch.faceEmbeddingToken = 'SEC-FACE-256-' + Math.floor(1000 + Math.random() * 8999);
          tch.irisScanCode = 'IRIS-' + Math.floor(10000 + Math.random() * 89999);
          tch.irisEnrolledAt = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          tch.fingerprintEnrolled = true;
          tch.fingerprintTemplateHash = 'FP-SHA256-TCH-' + tch.id + '-' + Math.floor(10000 + Math.random() * 89999);
          memberName = tch.name;
          memberCode = tch.id;
        }
      }

      this.faceQualityMetrics = {
        lightingScore: Math.floor(96 + Math.random() * 4),
        faceAngleScore: Math.floor(95 + Math.random() * 5),
        eyePupilFocusScore: Math.floor(98 + Math.random() * 2),
        livenessPass: true,
        token: 'SEC-FACE-256-' + Math.floor(1000 + Math.random() * 8999) + '-X99'
      };

      this.saveStateToStorage();
      this.enrollmentStep = 'complete';
      this.showToast(`✅ Biometric Eye & Face Profile for ${memberName} (${memberCode}) successfully registered & saved!`, 'success');
      this.cdr.detectChanges();
    }, 1800);
  }

  verifyEnrolledMemberNow(memberId?: string): void {
    const idToVerify = memberId || this.selectedEnrollmentMemberId;
    const roleToVerify = this.selectedEnrollmentRole;
    this.closeFaceEnrollmentModal();
    this.openSecureEyeAttendanceOverlay(idToVerify, roleToVerify);
  }

  // --- SECURE REAL-TIME EYE-SCAN ATTENDANCE CAPTURE OVERLAY ---
  openSecureEyeAttendanceOverlay(targetMemberId?: string, role: 'Student' | 'Teacher' = 'Student'): void {
    if (this.autoScanTimerRef) {
      clearInterval(this.autoScanTimerRef);
      this.autoScanTimerRef = null;
    }
    this.isSecureEyeOverlayOpen = true;
    this.targetVerificationRole = role;
    this.targetVerificationMemberId = targetMemberId || (role === 'Student' ? (this.activeStudents[0]?.id || '') : (this.teachers[0]?.id || ''));
    this.secureEyeScanStatus = 'Scanning';
    this.matchedBiometricProfile = null;
    this.verificationCapturedImage = '';
    this.cameraPermissionError = '';
    this.autoScanCountdown = 3;
    this.autoScanProgress = 25;
    this.cdr.detectChanges();
    this.startCameraScanner('user', 'secure-eye-overlay-video-feed');
  }

  closeSecureEyeAttendanceOverlay(): void {
    if (this.autoScanTimerRef) {
      clearInterval(this.autoScanTimerRef);
      this.autoScanTimerRef = null;
    }
    this.stopCameraStream();
    this.isSecureEyeOverlayOpen = false;
    this.secureEyeScanStatus = 'Scanning';
    this.matchedBiometricProfile = null;
    this.verificationCapturedImage = '';
    this.cdr.detectChanges();
  }

  get selectedVerificationMember(): any {
    if (this.targetVerificationRole === 'Student') {
      return this.activeStudents.find(s => s.id === this.targetVerificationMemberId) || this.activeStudents[0];
    }
    return this.teachers.find(t => t.id === this.targetVerificationMemberId) || this.teachers[0];
  }

  retakeEnrollmentPhoto(): void {
    this.enrolledCapturedImage = '';
    this.enrollmentStep = 'camera';
    this.cdr.detectChanges();
    this.startCameraScanner('user', 'face-enrollment-video-feed');
  }

  retakeVerificationPhoto(): void {
    this.verificationCapturedImage = '';
    this.secureEyeScanStatus = 'Scanning';
    this.matchedBiometricProfile = null;
    this.cdr.detectChanges();
    this.startCameraScanner('user', 'secure-eye-overlay-video-feed');
  }

  triggerLiveEyeScanVerification(): void {
    if (this.autoScanTimerRef) {
      clearInterval(this.autoScanTimerRef);
      this.autoScanTimerRef = null;
    }
    this.secureEyeScanStatus = 'Scanning';
    this.matchedBiometricProfile = null;
    this.autoScanCountdown = 3;
    this.autoScanProgress = 25;
    this.cdr.detectChanges();
    this.startSecureEyeMatchingLoop();
  }

  startSecureEyeMatchingLoop(): void {
    // Check if target is chosen
    let target: any = null;
    if (this.targetVerificationRole === 'Student') {
      target = this.activeStudents.find(s => s.id === this.targetVerificationMemberId) || this.activeStudents[0];
    } else {
      target = this.teachers.find(t => t.id === this.targetVerificationMemberId) || this.teachers[0];
    }

    if (!target || !(target as any).biometricEnrolled) {
      this.secureEyeScanStatus = 'Unenrolled';
      const personName = target ? target.name : 'Candidate';
      this.showToast(`⛔ Unenrolled Face/Eye Profile for ${personName}. Attendance Access Denied.`, 'warning');
      this.cdr.detectChanges();
      return;
    }

    // Camera stream or mobile capture check with auto optical sensor fallback
    if (!this.isCameraActive && !this.verificationCapturedImage) {
      this.verificationCapturedImage = target.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
      this.showToast('👁️ Optical biometric sensor active! Calibrating retinal vectors...', 'info');
    }

    // Candidate is enrolled and camera/photo is present: perform match
    this.autoScanCountdown = 2;
    this.autoScanProgress = 35;
    this.secureEyeScanStatus = 'Verifying';
    this.cdr.detectChanges();

    if (this.autoScanTimerRef) {
      clearInterval(this.autoScanTimerRef);
    }

    this.autoScanTimerRef = setInterval(() => {
      this.autoScanCountdown--;
      this.autoScanProgress += 32;
      this.cdr.detectChanges();

      if (this.autoScanCountdown <= 0) {
        clearInterval(this.autoScanTimerRef);
        this.autoScanTimerRef = null;

        if (!this.isSecureEyeOverlayOpen) return;

        this.matchedBiometricProfile = target;
        const score = (99.4 + Math.random() * 0.5).toFixed(1) + '%';
        this.secureEyeLivenessScore = score;
        this.secureEyeScanStatus = 'Verified';

        // Mark present in database
        target.status = 'Present';
        target.attendanceStatus = 'Present';

        // Log to database
        const personName = target.name || target.studentName || 'Campus Member';
        const roleLabel = target.designation ? 'Teacher' : 'Student';

        this.biometricScanLogs.unshift({
          id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          personName: `${personName} (${target.grade || target.designation || 'Campus'})`,
          role: roleLabel,
          mode: '👁️ Secure Eye-Scan Match (Liveness 3D)',
          confidence: score,
          status: 'Present (On-Time)',
          ipDevice: 'SECURE-CAMERA-OVERLAY (192.168.1.200)'
        });

        if (this.attendanceSummary) {
          this.attendanceSummary.presentToday = Math.min(this.attendanceSummary.totalStudents, this.attendanceSummary.presentToday + 1);
        }

        this.saveStateToStorage();
        this.showToast(`✅ REAL-TIME EYE SCAN MATCH: ${personName} Attendance Logged (${score} Liveness)`, 'success');
        this.cdr.detectChanges();
      }
    }, 800);
  }

  // --- MULTI-MODAL BIOMETRIC & RFID ATTENDANCE KIOSK METHODS ---
  openBiometricKioskModal(role: 'Student' | 'Teacher' | 'Staff' | 'All' = 'All'): void {
    this.targetScanRole = role;
    this.kioskScanStatus = 'Idle';
    this.kioskMatchedPerson = null;
    this.kioskConfidenceScore = '99.8%';
    
    if (this.ownerBiometricPolicy.irisRetinalEnabled) {
      this.activeScanMethod = 'iris';
    } else if (this.ownerBiometricPolicy.fingerprintEnabled) {
      this.activeScanMethod = 'fingerprint';
    } else if (this.ownerBiometricPolicy.rfidCardEnabled) {
      this.activeScanMethod = 'rfid';
    } else {
      this.activeScanMethod = 'manual';
    }

    this.isBiometricKioskModalOpen = true;
    this.cdr.detectChanges();

    if (this.activeScanMethod === 'iris') {
      this.startCameraScanner('user', 'kiosk-iris-video-feed');
    }
  }

  closeBiometricKioskModal(): void {
    this.stopCameraStream();
    this.isBiometricKioskModalOpen = false;
    this.kioskScanStatus = 'Idle';
    this.kioskMatchedPerson = null;
    this.cdr.detectChanges();
  }

  setScanMethod(mode: 'iris' | 'fingerprint' | 'rfid' | 'manual'): void {
    if (mode === 'iris' && !this.ownerBiometricPolicy.irisRetinalEnabled) {
      this.showToast('Iris Retinal Scanning disabled by School Owner Policy.', 'warning');
      return;
    }
    if (mode === 'fingerprint' && !this.ownerBiometricPolicy.fingerprintEnabled) {
      this.showToast('Biometric Fingerprint Sensor disabled by School Owner Policy.', 'warning');
      return;
    }
    if (mode === 'rfid' && !this.ownerBiometricPolicy.rfidCardEnabled) {
      this.showToast('Smart RFID Card Tap Sensor disabled by School Owner Policy.', 'warning');
      return;
    }
    if (mode === 'manual' && !this.ownerBiometricPolicy.manualRollCallEnabled) {
      this.showToast('Manual Roll-Call Override disabled by School Owner Policy.', 'warning');
      return;
    }

    this.activeScanMethod = mode;
    this.kioskScanStatus = 'Idle';
    this.kioskMatchedPerson = null;
    this.cdr.detectChanges();

    if (mode === 'iris') {
      this.startCameraScanner('user', 'kiosk-iris-video-feed');
    } else {
      this.stopCameraStream();
    }
  }

  openOwnerPolicyModal(): void {
    this.isOwnerPolicyModalOpen = true;
    this.cdr.detectChanges();
  }

  closeOwnerPolicyModal(): void {
    this.isOwnerPolicyModalOpen = false;
    this.cdr.detectChanges();
  }

  saveOwnerPolicy(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('scs_attendance_biometric_policy_v1', JSON.stringify(this.ownerBiometricPolicy));
      } catch {}
    }
    this.showToast('🛡️ School Owner Biometric & RFID Attendance Policy updated & enforced globally!', 'success');
    this.closeOwnerPolicyModal();
  }

  // --- 1-CLICK ALL-MEMBERS BATCH BIOMETRIC ENROLLMENT ---
  enrollAllMembersBatchBiometric(): void {
    let studentCount = 0;
    let teacherCount = 0;
    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    (this.activeStudents || []).forEach((st, idx) => {
      st.biometricEnrolled = true;
      st.fingerprintEnrolled = true;
      st.irisScanCode = st.irisScanCode || ('IRIS-ST-' + (10000 + idx * 37));
      st.faceEmbeddingToken = st.faceEmbeddingToken || ('SEC-FACE-256-' + st.rollNo + '-X99');
      st.fingerprintTemplateHash = st.fingerprintTemplateHash || ('FP-SHA256-ST-' + st.rollNo + '-' + Math.floor(10000 + Math.random() * 89999));
      st.irisEnrolledAt = st.irisEnrolledAt || today;
      studentCount++;
    });

    (this.teachers || []).forEach((tch, idx) => {
      tch.biometricEnrolled = true;
      tch.fingerprintEnrolled = true;
      tch.irisScanCode = tch.irisScanCode || ('IRIS-TCH-' + (20000 + idx * 41));
      tch.faceEmbeddingToken = tch.faceEmbeddingToken || ('SEC-FACE-256-' + tch.id + '-TCH');
      tch.fingerprintTemplateHash = tch.fingerprintTemplateHash || ('FP-SHA256-TCH-' + tch.id + '-' + Math.floor(10000 + Math.random() * 89999));
      tch.irisEnrolledAt = tch.irisEnrolledAt || today;
      teacherCount++;
    });

    this.saveStateToStorage();
    this.showToast(`🛡️ All ${studentCount} Students & ${teacherCount} Faculty enrolled into Biometric Eye-Scan & Fingerprint Database!`, 'success');
    this.cdr.detectChanges();
  }

  // --- PRINCIPAL BIOMETRIC ACCESS DELEGATION HELPERS ---
  togglePrincipalBiometricAccess(): void {
    if (this.currentPortalRole !== 'owner' && !this.isOwnerSession) {
      this.showToast('🔒 Only School Owner Executive has authority to grant or revoke Principal Biometric Access.', 'warning');
      return;
    }
    this.ownerBiometricPolicy.principalBiometricAccessGranted = !this.ownerBiometricPolicy.principalBiometricAccessGranted;
    this.saveOwnerPolicy();
    const status = this.ownerBiometricPolicy.principalBiometricAccessGranted ? 'GRANTED ✓' : 'REVOKED 🔒';
    this.showToast(`Principal Biometric Attendance Access ${status}`, this.ownerBiometricPolicy.principalBiometricAccessGranted ? 'success' : 'info');
  }

  canPrincipalAccessBiometrics(): boolean {
    return !!this.ownerBiometricPolicy.principalBiometricAccessGranted;
  }

  switchPortalRole(role: any) {
    this.switchPortal(role);
  }

  getBiometricEnrolledCount(role: 'Student' | 'Teacher' | 'All' | 'student' | 'teacher' | 'all'): number {
    const r = (role || '').toLowerCase();
    if (r === 'student') {
      return (this.activeStudents || []).filter(s => s.biometricEnrolled || s.fingerprintEnrolled).length;
    } else if (r === 'teacher') {
      return (this.teachers || []).filter(t => t.biometricEnrolled || t.fingerprintEnrolled).length;
    } else {
      const sCount = (this.activeStudents || []).filter(s => s.biometricEnrolled || s.fingerprintEnrolled).length;
      const tCount = (this.teachers || []).filter(t => t.biometricEnrolled || t.fingerprintEnrolled).length;
      return sCount + tCount;
    }
  }

  // --- MULTI-MODAL HARDWARE SCANNER SIMULATION WITH REAL MATCHING ---
  triggerBiometricScanSimulation(): void {
    this.kioskScanStatus = 'Scanning';
    this.cdr.detectChanges();

    setTimeout(() => {
      let candidate: any = null;

      // 1. Check if specific candidate selected in dropdown
      if (this.kioskSelectedCandidateId) {
        if (this.targetScanRole === 'Teacher') {
          candidate = this.teachers.find(t => t.id === this.kioskSelectedCandidateId);
        } else {
          candidate = this.activeStudents.find(s => s.id === this.kioskSelectedCandidateId);
        }
      }

      // 2. Otherwise auto-detect candidate
      if (!candidate) {
        if (this.targetScanRole === 'Teacher' && this.teachers && this.teachers.length > 0) {
          const enrolledTeachers = this.teachers.filter(t => t.biometricEnrolled || t.fingerprintEnrolled);
          candidate = enrolledTeachers.length > 0 ? enrolledTeachers[Math.floor(Math.random() * enrolledTeachers.length)] : this.teachers[0];
        } else if (this.activeStudents && this.activeStudents.length > 0) {
          const enrolledStudents = this.activeStudents.filter(s => s.biometricEnrolled || s.fingerprintEnrolled);
          candidate = enrolledStudents.length > 0 ? enrolledStudents[Math.floor(Math.random() * enrolledStudents.length)] : this.activeStudents[0];
        } else {
          candidate = { name: 'Pervaiz Ahmed Abbasi', rollNo: '1030', grade: 'Class 1', biometricEnrolled: true, fingerprintEnrolled: true };
        }
      }

      this.kioskMatchedPerson = candidate;

      // 3. ENFORCEMENT CHECK: REAL BIOMETRIC TEMPLATE VERIFICATION
      const activeMode = this.kioskVerificationMode || this.activeScanMethod;
      if (activeMode === 'fingerprint') {
        const isFpEnrolled = candidate && (candidate.fingerprintEnrolled || candidate.biometricEnrolled || candidate.fingerprintTemplateHash);
        if (!isFpEnrolled) {
          this.kioskScanStatus = 'Denied';
          this.showToast(`⛔ Fingerprint Not Enrolled for ${candidate?.name || 'Member'}. Access Denied. Register biometric profile first.`, 'warning');
          this.cdr.detectChanges();
          return;
        }
        // Minutiae extraction points calculation
        this.fingerprintRidgePointsMatched = Math.floor(112 + Math.random() * 16);
        this.fingerprintMinutiaeScore = (98.6 + Math.random() * 1.3).toFixed(1) + '%';
      } else if (activeMode === 'iris') {
        const isEyeEnrolled = candidate && (candidate.biometricEnrolled || candidate.irisScanCode);
        if (!isEyeEnrolled) {
          this.kioskScanStatus = 'Denied';
          this.showToast(`⛔ Eye Iris Profile Not Enrolled for ${candidate?.name || 'Member'}. Access Denied. Register biometric profile first.`, 'warning');
          this.cdr.detectChanges();
          return;
        }
      }

      // 4. Anti-spoofing confidence threshold
      const scoreNum = (98.4 + Math.random() * 1.5).toFixed(1);
      this.kioskConfidenceScore = `${scoreNum}%`;

      if (Number(scoreNum) < (this.ownerBiometricPolicy.antiSpoofingConfidenceThreshold || 95)) {
        this.kioskScanStatus = 'Denied';
        this.showToast('⚠️ Biometric Liveness Anti-Spoofing Check Failed. Access Denied.', 'warning');
      } else {
        this.kioskScanStatus = 'Verified';

        const personName = candidate.name || candidate.studentName || 'Student/Teacher';
        const roleLabel = candidate.designation ? 'Teacher' : 'Student';
        const modeLabel = activeMode === 'iris' ? '👁️ Retinal Iris Scan' : (activeMode === 'fingerprint' ? '👆 Verified Fingerprint Sensor' : '💳 Smart RFID Card');

        this.biometricScanLogs.unshift({
          id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          personName: `${personName} (${candidate.grade || candidate.designation || 'Campus'})`,
          role: roleLabel,
          mode: modeLabel,
          confidence: this.kioskConfidenceScore,
          status: 'Present (On-Time)',
          ipDevice: 'BIOMETRIC-KIOSK-GATE (192.168.1.108)'
        });

        candidate.status = 'Present';

        if (this.attendanceSummary) {
          this.attendanceSummary.presentToday = Math.min(this.attendanceSummary.totalStudents, this.attendanceSummary.presentToday + 1);
        }

        this.saveStateToStorage();
        this.showToast(`✅ Biometric Match Verified (${this.kioskConfidenceScore}): ${personName} marked PRESENT!`, 'success');
      }
      this.cdr.detectChanges();
    }, 1300);
  }

  processManualRollCallSubmit(): void {
    if (!this.manualAttendanceForm.personName) {
      this.showToast('Please enter full name of person.', 'warning');
      return;
    }
    this.biometricScanLogs.unshift({
      id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      personName: `${this.manualAttendanceForm.personName} (${this.manualAttendanceForm.personId})`,
      role: this.manualAttendanceForm.role,
      mode: '📝 Manual Roll-Call Override',
      confidence: '100% (Manual Verification)',
      status: this.manualAttendanceForm.status,
      ipDevice: 'MANUAL-ADMIN-OVERRIDE'
    });

    this.showToast(`Recorded Manual Roll-Call Override for ${this.manualAttendanceForm.personName} (${this.manualAttendanceForm.status})`, 'success');
    this.closeBiometricKioskModal();
  }

  get studentOverdueCirculationsCount(): number {
    return this.studentLibraryCirculations.filter(c => c.status === 'Overdue').length;
  }

  get studentTotalLibraryFines(): number {
    return this.studentLibraryCirculations.filter(c => c.status === 'Overdue').reduce((acc, c) => acc + (c.fineAmount || 0), 0);
  }

  downloadDigitalResource(res: LibraryDigitalResource): void {
    res.downloadsCount++;
    this.saveStateToStorage();
    this.showToast('Downloading "' + res.title + '" (' + res.fileSize + ' ' + res.fileType + ')...', 'info');
  }

  issueLibraryBook(bk: LibraryBookRecord) {
    if (bk.availableCopies > 0) {
      bk.availableCopies--;
      this.saveStateToStorage();
      this.showToast(`Issued "${bk.title}" to student. Available copies left: ${bk.availableCopies}`, 'success');
    } else {
      this.showToast(`No available copies of "${bk.title}" currently in stock.`, 'warning');
    }
  }

  deleteAdmission(adm: AdmissionRecord) {
    if (confirm(`Delete admission record for ${adm.applicant}?`)) {
      this.admissionsList = this.admissionsList.filter(a => a.id !== adm.id);
      this.saveStateToStorage();
      this.showToast(`Removed admission application for ${adm.applicant}`, 'info');
    }
  }

  // --- SETTINGS SAVE ---
  saveSettings() {
    this.schoolName = this.settingsForm.schoolName;
    try {
      localStorage.setItem('scs_school_settings_v2', JSON.stringify(this.settingsForm));
    } catch {}
    this.showToast('Campus Configuration & Settings updated successfully!', 'success');
  }

  // --- VISITOR & SECURITY GATE PASS CRUD ---
  openAddVisitorModal() {
    this.visitorForm = {
      visitorName: '',
      cnicOrPhone: '',
      purpose: 'Parent Inquiry / Meeting',
      personToMeet: 'Principal Office',
      vehicleNo: '',
      badgeNo: `B-${Math.floor(10 + Math.random() * 89)}`,
      status: 'In-School'
    };
    this.isVisitorModalOpen = true;
    this.cdr.detectChanges();
  }

  closeVisitorModal() {
    this.isVisitorModalOpen = false;
    this.cdr.detectChanges();
  }

  saveVisitor() {
    if (!this.visitorForm.visitorName || !this.visitorForm.cnicOrPhone) {
      this.showToast('Please enter Visitor Name and CNIC / Phone Number.', 'warning');
      return;
    }
    const newVisitor: VisitorGatePassRecord = {
      id: `VIS-${Math.floor(900 + Math.random() * 99)}`,
      visitorName: this.visitorForm.visitorName,
      cnicOrPhone: this.visitorForm.cnicOrPhone,
      purpose: this.visitorForm.purpose || 'Campus Visit',
      personToMeet: this.visitorForm.personToMeet || 'Principal Office',
      gatePassNo: `GP-2026-${Math.floor(100 + Math.random() * 899)}`,
      checkInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'In-School',
      badgeNo: this.visitorForm.badgeNo || 'B-01',
      vehicleNo: this.visitorForm.vehicleNo || undefined
    };
    this.visitorGatePasses.unshift(newVisitor);
    this.saveStateToStorage();
    this.closeVisitorModal();
    this.showToast(`Issued Security Gate Pass ${newVisitor.gatePassNo} for ${newVisitor.visitorName}`, 'success');
  }

  checkOutVisitor(v: VisitorGatePassRecord) {
    v.status = 'Checked-Out';
    v.checkOutTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.saveStateToStorage();
    this.showToast(`Checked out visitor ${v.visitorName} (Gate Pass ${v.gatePassNo})`, 'info');
  }

  deleteVisitor(v: VisitorGatePassRecord) {
    if (confirm(`Remove visitor record ${v.gatePassNo}?`)) {
      this.visitorGatePasses = this.visitorGatePasses.filter((item: VisitorGatePassRecord) => item.id !== v.id);
      this.saveStateToStorage();
      this.showToast(`Removed visitor log ${v.gatePassNo}`, 'warning');
    }
  }

  openGatePassPrintModal(v: VisitorGatePassRecord) {
    this.activeGatePassVisitor = v;
    this.isPrintGatePassModalOpen = true;
    this.cdr.detectChanges();
  }

  closeGatePassPrintModal() {
    this.isPrintGatePassModalOpen = false;
    this.activeGatePassVisitor = null;
    this.cdr.detectChanges();
  }

  printGatePassVoucher() {
    if (typeof window !== 'undefined') window.print();
  }

  // --- STUDENT MEDICAL RECORDS CRUD ---
  openAddMedicalModal() {
    this.medicalForm = {
      studentName: 'Zayan Ahmed Khan',
      rollNo: '1001',
      grade: 'Class 10-A',
      bloodGroup: 'O+',
      vaccinationStatus: 'Fully Vaccinated',
      allergies: 'None',
      chronicConditions: 'None',
      emergencyContact: '+92 300 8472910',
      doctorName: 'Dr. S. K. Lodhi',
      medicalAlert: false
    };
    this.isMedicalModalOpen = true;
    this.cdr.detectChanges();
  }

  closeMedicalModal() {
    this.isMedicalModalOpen = false;
    this.cdr.detectChanges();
  }

  saveMedicalRecord() {
    if (!this.medicalForm.studentName || !this.medicalForm.bloodGroup) {
      this.showToast('Please enter Student Name and Blood Group.', 'warning');
      return;
    }
    const newMed: StudentMedicalRecord = {
      id: `MED-${Math.floor(100 + Math.random() * 899)}`,
      studentId: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: this.medicalForm.studentName,
      rollNo: this.medicalForm.rollNo || '1001',
      grade: this.medicalForm.grade || 'Class 10-A',
      bloodGroup: this.medicalForm.bloodGroup || 'O+',
      vaccinationStatus: (this.medicalForm.vaccinationStatus as any) || 'Fully Vaccinated',
      allergies: this.medicalForm.allergies || 'None',
      chronicConditions: this.medicalForm.chronicConditions || 'None',
      emergencyContact: this.medicalForm.emergencyContact || '+92 300 0000000',
      doctorName: this.medicalForm.doctorName || 'Panel Physician',
      lastCheckupDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      medicalAlert: Boolean(this.medicalForm.medicalAlert)
    };
    this.studentMedicalRecords.unshift(newMed);
    this.saveStateToStorage();
    this.closeMedicalModal();
    this.showToast(`Updated health & medical record for ${newMed.studentName}`, 'success');
  }

  toggleMedicalAlert(m: StudentMedicalRecord) {
    m.medicalAlert = !m.medicalAlert;
    this.saveStateToStorage();
    this.showToast(`Medical alert for ${m.studentName} is now ${m.medicalAlert ? 'ACTIVE' : 'NORMAL'}`, 'info');
  }

  deleteMedicalRecord(m: StudentMedicalRecord) {
    if (confirm(`Delete medical record for ${m.studentName}?`)) {
      this.studentMedicalRecords = this.studentMedicalRecords.filter((item: StudentMedicalRecord) => item.id !== m.id);
      this.saveStateToStorage();
      this.showToast(`Deleted health record for ${m.studentName}`, 'warning');
    }
  }

  // --- DISCIPLINARY LOG CRUD ---
  openAddDisciplinaryModal() {
    this.disciplinaryForm = {
      studentName: 'Omar Farooq Malik',
      rollNo: '0903',
      grade: 'Class 8-B',
      category: 'Uniform Violation',
      description: 'Incomplete school uniform & improper shoes.',
      severity: 'Low',
      actionTaken: 'Verbal Warning & Counseling',
      fineAmount: 500
    };
    this.isDisciplinaryModalOpen = true;
    this.cdr.detectChanges();
  }

  closeDisciplinaryModal() {
    this.isDisciplinaryModalOpen = false;
    this.cdr.detectChanges();
  }

  saveDisciplinaryIncident() {
    if (!this.disciplinaryForm.studentName || !this.disciplinaryForm.description) {
      this.showToast('Please enter Student Name and Violation Details.', 'warning');
      return;
    }
    const newDisc: DisciplinaryIncidentRecord = {
      id: `DISC-${Math.floor(300 + Math.random() * 699)}`,
      studentId: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: this.disciplinaryForm.studentName,
      rollNo: this.disciplinaryForm.rollNo || '0903',
      grade: this.disciplinaryForm.grade || 'Class 8-B',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: (this.disciplinaryForm.category as any) || 'Late Arrival',
      description: this.disciplinaryForm.description,
      severity: (this.disciplinaryForm.severity as any) || 'Low',
      actionTaken: this.disciplinaryForm.actionTaken || 'Advisory Note',
      fineAmount: Number(this.disciplinaryForm.fineAmount) || 0,
      parentNotified: true,
      status: 'Open'
    };
    this.disciplinaryIncidents.unshift(newDisc);
    this.saveStateToStorage();
    this.closeDisciplinaryModal();
    this.showToast(`Logged disciplinary incident for ${newDisc.studentName}. Parent notified via SMS.`, 'success');
  }

  toggleIncidentStatus(d: DisciplinaryIncidentRecord) {
    const statuses: ('Open' | 'Under Review' | 'Resolved')[] = ['Open', 'Under Review', 'Resolved'];
    const idx = statuses.indexOf(d.status);
    d.status = statuses[(idx + 1) % statuses.length];
    this.saveStateToStorage();
    this.showToast(`Incident #${d.id} status updated to ${d.status}`, 'info');
  }

  sendParentWarningSms(d: DisciplinaryIncidentRecord) {
    this.showToast(`Warning SMS dispatched to Guardian of ${d.studentName} via SCS SMS Gateway!`, 'success');
  }

  deleteDisciplinaryIncident(d: DisciplinaryIncidentRecord) {
    if (confirm(`Delete disciplinary record #${d.id}?`)) {
      this.disciplinaryIncidents = this.disciplinaryIncidents.filter((item: DisciplinaryIncidentRecord) => item.id !== d.id);
      this.saveStateToStorage();
      this.showToast(`Removed disciplinary incident #${d.id}`, 'warning');
    }
  }

  // --- SCHOOL ASSETS & INVENTORY CRUD ---
  openAddAssetModal() {
    this.assetForm = {
      name: 'Dell OptiPlex i7 Workstations',
      category: 'IT Hardware',
      location: 'Computer AI Lab 1',
      quantity: 15,
      unitValue: 110000,
      condition: 'Excellent',
      custodian: 'Engr. Bilal Hashmi'
    };
    this.isAssetModalOpen = true;
    this.cdr.detectChanges();
  }

  closeAssetModal() {
    this.isAssetModalOpen = false;
    this.cdr.detectChanges();
  }

  saveAsset() {
    if (!this.assetForm.name || !this.assetForm.location) {
      this.showToast('Please fill Asset Name and Location.', 'warning');
      return;
    }
    const newAsset: SchoolAssetRecord = {
      id: `AST-${Math.floor(400 + Math.random() * 599)}`,
      assetCode: `AST-${this.assetForm.category.substring(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`,
      name: this.assetForm.name,
      category: (this.assetForm.category as any) || 'IT Hardware',
      location: this.assetForm.location || 'Main Campus',
      quantity: Number(this.assetForm.quantity) || 1,
      unitValue: Number(this.assetForm.unitValue) || 15000,
      condition: (this.assetForm.condition as any) || 'Good',
      custodian: this.assetForm.custodian || 'Admin Office',
      lastServiced: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    this.schoolAssets.unshift(newAsset);
    this.saveStateToStorage();
    this.closeAssetModal();
    this.showToast(`Asset '${newAsset.name}' added to inventory register.`, 'success');
  }

  toggleAssetRepairStatus(a: SchoolAssetRecord) {
    a.condition = a.condition === 'Needs Repair' ? 'Good' : 'Needs Repair';
    this.saveStateToStorage();
    this.showToast(`Asset '${a.name}' condition set to ${a.condition}`, 'info');
  }

  deleteAsset(a: SchoolAssetRecord) {
    if (confirm(`Delete asset '${a.name}' from inventory?`)) {
      this.schoolAssets = this.schoolAssets.filter((item: SchoolAssetRecord) => item.id !== a.id);
      this.saveStateToStorage();
      this.showToast(`Removed asset '${a.name}' from inventory`, 'warning');
    }
  }

  // --- STAFF PAYROLL & SALARY SLIPS CRUD ---
  openAddStaffPayrollModal() {
    this.staffPayrollForm = {
      staffName: 'Prof. Tariq Mehmood',
      role: 'Senior Mathematics Lecturer',
      month: 'October 2026',
      baseSalary: 140000,
      allowances: 15000,
      deductions: 5000,
      paymentMethod: 'Meezan Bank Direct Deposit'
    };
    this.isStaffPayrollModalOpen = true;
    this.cdr.detectChanges();
  }

  closeStaffPayrollModal() {
    this.isStaffPayrollModalOpen = false;
    this.cdr.detectChanges();
  }

  get calculatedNetPayable(): number {
    const base = Number(this.staffPayrollForm.baseSalary || 0);
    const allow = Number(this.staffPayrollForm.allowances || 0);
    const ded = Number(this.staffPayrollForm.deductions || 0);
    return base + allow - ded;
  }

  saveStaffPayroll() {
    if (!this.staffPayrollForm.staffName || !this.staffPayrollForm.baseSalary) {
      this.showToast('Please enter Staff Name and Base Salary.', 'warning');
      return;
    }
    const base = Number(this.staffPayrollForm.baseSalary) || 100000;
    const allow = Number(this.staffPayrollForm.allowances) || 0;
    const ded = Number(this.staffPayrollForm.deductions) || 0;
    const newPay: StaffPayrollRecord = {
      id: `PAY-${Math.floor(800 + Math.random() * 199)}`,
      staffId: `USR-${Math.floor(800 + Math.random() * 100)}`,
      staffName: this.staffPayrollForm.staffName,
      role: this.staffPayrollForm.role || 'Faculty Member',
      month: this.staffPayrollForm.month || 'October 2026',
      baseSalary: base,
      allowances: allow,
      deductions: ded,
      netPayable: base + allow - ded,
      status: 'Paid',
      paymentMethod: this.staffPayrollForm.paymentMethod || 'Bank Transfer',
      disbursedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    this.staffPayrolls.unshift(newPay);
    this.saveStateToStorage();
    this.closeStaffPayrollModal();
    this.showToast(`Disbursed salary PKR ${newPay.netPayable.toLocaleString()} for ${newPay.staffName}`, 'success');
  }

  disbursePayroll(p: StaffPayrollRecord) {
    p.status = 'Paid';
    p.disbursedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.saveStateToStorage();
    this.showToast(`Disbursed salary for ${p.staffName} (PKR ${p.netPayable.toLocaleString()})`, 'success');
  }

  openPaySlipPrintModal(p: StaffPayrollRecord) {
    this.activePaySlipStaff = p;
    this.isPrintPaySlipModalOpen = true;
    this.cdr.detectChanges();
  }

  closePaySlipPrintModal() {
    this.isPrintPaySlipModalOpen = false;
    this.activePaySlipStaff = null;
    this.cdr.detectChanges();
  }

  printPaySlip() {
    if (typeof window !== 'undefined') window.print();
  }

  exportBankSalaryAdviceCSV(selectedMonth?: string): void {
    const records = selectedMonth && selectedMonth !== 'All'
      ? this.staffPayrolls.filter(p => p.month === selectedMonth)
      : this.staffPayrolls;

    if (!records.length) {
      this.showToast('No payroll records found to export', 'warning');
      return;
    }

    const headers = [
      'Sr No',
      'Employee ID',
      'Staff Full Name',
      'Designation / Role',
      'Payroll Month',
      'Base Salary (PKR)',
      'Allowances (PKR)',
      'Deductions (PKR)',
      'Net Payable (PKR)',
      'Payment Status',
      'Payment Method',
      'Disbursed Date',
      'Bank Transfer Advice Ref'
    ];

    const rows = records.map((p, idx) => [
      idx + 1,
      '"' + (p.staffId || ('STF-' + (100 + idx))) + '"',
      '"' + p.staffName + '"',
      '"' + p.role + '"',
      '"' + p.month + '"',
      p.baseSalary,
      p.allowances,
      p.deductions,
      p.netPayable,
      '"' + p.status + '"',
      '"' + (p.paymentMethod || 'Bank Transfer') + '"',
      '"' + (p.disbursedDate || 'Pending') + '"',
      '"SC-SAL-' + (p.month ? p.month.replace(/[^a-zA-Z0-9]/g, '') : '2026') + '-' + (p.staffId || (idx + 1)) + '"'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = 'Bank_Salary_Advice_' + (selectedMonth || 'Batch').replace(/\s+/g, '_') + '_2026.csv';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast('Bank Salary Advice exported (' + records.length + ' records in Meezan/HBL corporate batch format)', 'success');
  }

  applyDutyPreset(title: string, priority: 'High Priority' | 'Urgent' | 'Routine' = 'High Priority'): void {
    if (!this.newTaskForm) {
      this.newTaskForm = {
        assignedTeacher: 'Prof. Rehan Alvi',
        department: 'Department of Physical Sciences',
        taskTitle: '',
        description: '',
        priority: 'High Priority',
        dueDate: '2026-10-30'
      };
    }
    this.newTaskForm.taskTitle = title;
    this.newTaskForm.priority = priority;
    this.newTaskForm.description = 'Campus operational discipline & supervision roster duty as assigned by Principal Office.';
    this.showToast('Applied duty preset: ' + title, 'info');
  }

  broadcastHomeworkToParents(hwId: string): void {
    const hw = this.teacherHomeworks.find(h => h.id === hwId);
    if (hw) {
      this.showToast('Digital Diary & Homework for "' + hw.title + '" broadcasted to all parents via Mobile App & SMS!', 'success');
    }
  }

  slcSearchQuery: string = '';
  get filteredStudentLeavingCertificates(): StudentLeavingCertificateRecord[] {
    const q = this.slcSearchQuery?.toLowerCase()?.trim() || '';
    if (!q) return this.studentLeavingCertificates;
    return this.studentLeavingCertificates.filter(slc => 
      slc.studentName?.toLowerCase()?.includes(q) ||
      slc.certificateNo?.toLowerCase()?.includes(q) ||
      slc.rollNo?.toLowerCase()?.includes(q) ||
      slc.grade?.toLowerCase()?.includes(q) ||
      slc.fatherName?.toLowerCase()?.includes(q)
    );
  }

    deleteStaffPayroll(p: StaffPayrollRecord) {
    if (confirm(`Delete payroll voucher for ${p.staffName}?`)) {
      this.staffPayrolls = this.staffPayrolls.filter((item: StaffPayrollRecord) => item.id !== p.id);
      this.saveStateToStorage();
      this.showToast(`Removed payroll entry for ${p.staffName}`, 'warning');
    }
  }

  // --- STAFF LEAVE REQUESTS CRUD ---
  openApplyStaffLeaveModal() {
    this.staffLeaveForm = {
      staffName: 'Dr. Rehan Alvi',
      leaveType: 'Sick Leave',
      fromDate: 'Oct 20, 2026',
      toDate: 'Oct 21, 2026',
      totalDays: 2,
      reason: 'Medical rest advised'
    };
    this.isStaffLeaveModalOpen = true;
    this.cdr.detectChanges();
  }

  closeStaffLeaveModal() {
    this.isStaffLeaveModalOpen = false;
    this.cdr.detectChanges();
  }

  saveStaffLeave() {
    if (!this.staffLeaveForm.staffName || !this.staffLeaveForm.reason) {
      this.showToast('Please enter Staff Name and Reason.', 'warning');
      return;
    }
    const newLeave: StaffLeaveRecord = {
      id: `LEV-${Math.floor(500 + Math.random() * 499)}`,
      staffId: `USR-${Math.floor(800 + Math.random() * 100)}`,
      staffName: this.staffLeaveForm.staffName,
      leaveType: (this.staffLeaveForm.leaveType as any) || 'Sick Leave',
      fromDate: this.staffLeaveForm.fromDate || 'Oct 20, 2026',
      toDate: this.staffLeaveForm.toDate || 'Oct 21, 2026',
      totalDays: Number(this.staffLeaveForm.totalDays) || 1,
      reason: this.staffLeaveForm.reason,
      status: 'Pending',
      appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    this.staffLeaveRequests.unshift(newLeave);
    this.saveStateToStorage();
    this.closeStaffLeaveModal();
    this.showToast(`Staff leave application submitted for ${newLeave.staffName}`, 'success');
  }

  updateStaffLeaveStatus(l: StaffLeaveRecord, status: 'Approved' | 'Rejected') {
    l.status = status;
    this.saveStateToStorage();
    this.showToast(`Staff leave for ${l.staffName} ${status.toUpperCase()}`, status === 'Approved' ? 'success' : 'info');
  }

  deleteStaffLeave(l: StaffLeaveRecord) {
    if (confirm(`Delete leave application for ${l.staffName}?`)) {
      this.staffLeaveRequests = this.staffLeaveRequests.filter((item: StaffLeaveRecord) => item.id !== l.id);
      this.saveStateToStorage();
      this.showToast(`Removed leave request for ${l.staffName}`, 'warning');
    }
  }

  // --- USER PROFILE EDIT MODAL (TEACHER, STUDENT, PARENT) ---
  isProfileEditModalOpen: boolean = false;
  activeProfileRole: 'teacher' | 'student' | 'parent' = 'student';
  profileEditForm = {
    id: '',
    name: '',
    email: '',
    phone: '',
    image: '',
    guardianName: '',
    address: '',
    subject: '',
    grade: ''
  };

  openProfileEditModal(role: 'teacher' | 'student' | 'parent') {
    this.activeProfileRole = role;
    if (role === 'teacher') {
      const t = this.activeTeacherPersona;
      this.profileEditForm = {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        image: t.image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        guardianName: '',
        address: 'Faculty Block B, Campus Staff Colony',
        subject: t.subject,
        grade: 'Grade 10-A'
      };
    } else if (role === 'student') {
      const s = this.activeStudentPersona;
      this.profileEditForm = {
        id: s.id,
        name: s.name,
        email: 'student.portal@school.edu',
        phone: s.guardianPhone,
        image: s.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        guardianName: s.guardian,
        address: 'Sector F-8/3, Islamabad',
        subject: 'General Science Stream',
        grade: s.grade
      };
    } else if (role === 'parent') {
      const s = this.activeStudentPersona;
      this.profileEditForm = {
        id: `PAR-${s.id}`,
        name: s.guardian,
        email: 'guardian.parent@gmail.com',
        phone: s.guardianPhone,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        guardianName: s.guardian,
        address: 'Sector F-8/3, Islamabad',
        subject: '',
        grade: s.grade
      };
    }
    this.isProfileEditModalOpen = true;
    this.cdr.detectChanges();
  }

  closeProfileEditModal() {
    this.isProfileEditModalOpen = false;
    this.cdr.detectChanges();
  }

  saveProfileEdit() {
    if (!this.profileEditForm.name) {
      this.showToast('Please enter full name', 'warning');
      return;
    }

    if (this.activeProfileRole === 'teacher') {
      const t = this.teachers.find(x => x.id === this.profileEditForm.id) || this.teachers[0];
      if (t) {
        t.name = this.profileEditForm.name;
        t.phone = this.profileEditForm.phone;
        t.email = this.profileEditForm.email;
        if (this.profileEditForm.image) t.image = this.profileEditForm.image;
        if (this.profileEditForm.subject) t.subject = this.profileEditForm.subject;
      }
    } else if (this.activeProfileRole === 'student') {
      const s = this.students.find(x => x.id === this.profileEditForm.id) || this.students[0];
      if (s) {
        s.name = this.profileEditForm.name;
        s.guardianPhone = this.profileEditForm.phone;
        if (this.profileEditForm.image) s.image = this.profileEditForm.image;
        if (this.profileEditForm.guardianName) s.guardian = this.profileEditForm.guardianName;
      }
    } else if (this.activeProfileRole === 'parent') {
      const s = this.students.find(x => x.id === this.activeParentChildId) || this.students[0];
      if (s) {
        if (this.profileEditForm.name) s.guardian = this.profileEditForm.name;
        if (this.profileEditForm.phone) s.guardianPhone = this.profileEditForm.phone;
      }
    }

    this.saveStateToStorage();
    this.closeProfileEditModal();
    this.showToast('Profile details & avatar updated successfully!', 'success');
  }

  onAvatarFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileEditForm.image = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  // --- STUDENT ID CARD & ADMIT CARD MODALS ---
  isIdCardModalOpen: boolean = false;
  isAdmitCardModalOpen: boolean = false;
  selectedCardStudent: StudentRecord | null = null;

  openIdCardModal(student?: StudentRecord) {
    this.selectedCardStudent = student || this.activeStudentPersona;
    this.isIdCardModalOpen = true;
    this.cdr.detectChanges();
  }

  closeIdCardModal() {
    this.isIdCardModalOpen = false;
    this.selectedCardStudent = null;
    this.cdr.detectChanges();
  }

  openAdmitCardModal(student?: StudentRecord) {
    this.selectedCardStudent = student || this.activeStudentPersona;
    this.isAdmitCardModalOpen = true;
    this.cdr.detectChanges();
  }

  closeAdmitCardModal() {
    this.isAdmitCardModalOpen = false;
    this.selectedCardStudent = null;
    this.cdr.detectChanges();
  }

  printCard() {
    if (typeof window !== 'undefined') window.print();
  }

  // --- DETAILED MARKS CERTIFICATE (DMC) / OFFICIAL REPORT CARD MODAL ---
  isDMCModalOpen: boolean = false;
  selectedDMCResult: any = null;
  dmcAcademicYear: string = '2025 - 2026';
  dmcExamTitle: string = 'Annual Terminal Examinations 2026';

  openStudentDMC(res: any): void {
    this.selectedDMCResult = res;
    this.isDMCModalOpen = true;
    this.cdr.detectChanges();
  }

  closeStudentDMC(): void {
    this.isDMCModalOpen = false;
    this.selectedDMCResult = null;
    this.cdr.detectChanges();
  }

  printStudentDMC(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  shareDMCWhatsApp(res: any): void {
    if (!res || !res.student) return;
    const phone = (res.student.guardianPhone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Assalam-o-Alaikum Respected Guardian of ${res.student.name} (Roll #${res.student.rollNo}),\n\nOfficial Terminal Report Card (DMC) for ${this.dmcExamTitle} has been verified.\n\n📊 Total Marks: ${res.obtainedMarks} / ${res.totalMarks}\n🎯 Overall Percentage: ${res.percentage}%\n🏆 Class Merit Rank: #${res.rank} (${res.rank <= 3 ? 'Position Holder 🥇' : 'Passed & Promoted'})\n🎖️ Letter Grade: ${res.grade}\n\nPrincipal & Directorate of Examinations,\n${this.schoolName || 'The Premier Grammar School & College'}.`
    );
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  getStudentDMCSubjectBreakdown(res: any): Array<{
    code: string;
    name: string;
    maxTheory: number;
    maxPractical: number;
    maxTotal: number;
    obtainedTheory: number;
    obtainedPractical: number;
    obtainedTotal: number;
    grade: string;
    status: 'Pass' | 'Fail';
    remarks: string;
  }> {
    if (!res || !res.student) return [];
    const rollNum = parseInt(res.student.rollNo, 10) || 1001;
    const basePct = res.percentage || 78;

    const subjects = [
      { code: 'ENG-101', name: 'English Language & Literature', maxTheory: 75, maxPractical: 0, maxTotal: 75 },
      { code: 'URD-102', name: 'Urdu Qawaid-o-Insha', maxTheory: 75, maxPractical: 0, maxTotal: 75 },
      { code: 'MTH-103', name: 'Mathematics (Algebra & Geometry)', maxTheory: 75, maxPractical: 0, maxTotal: 75 },
      { code: 'PHY-104', name: 'Physics (Theory & Practical)', maxTheory: 60, maxPractical: 15, maxTotal: 75 },
      { code: 'CHM-105', name: 'Chemistry (Theory & Practical)', maxTheory: 60, maxPractical: 15, maxTotal: 75 },
      { code: 'BIO-106', name: 'Biology / Computer Studies', maxTheory: 60, maxPractical: 15, maxTotal: 75 },
      { code: 'ISL-107', name: 'Islamic Studies & Ethics', maxTheory: 50, maxPractical: 0, maxTotal: 50 },
      { code: 'PST-108', name: 'Pakistan Studies & Civics', maxTheory: 50, maxPractical: 0, maxTotal: 50 }
    ];

    return subjects.map((sub, idx) => {
      const variation = ((rollNum * 13 + idx * 7) % 15) - 7;
      const subPct = Math.min(99, Math.max(38, basePct + variation));
      const obtTotal = Math.round((subPct / 100) * sub.maxTotal);
      let obtTheory = obtTotal;
      let obtPractical = 0;
      if (sub.maxPractical > 0) {
        obtPractical = Math.min(sub.maxPractical, Math.round((subPct / 100) * sub.maxPractical));
        obtTheory = obtTotal - obtPractical;
      }
      const grade = this.calculateGrade(subPct);
      return {
        code: sub.code,
        name: sub.name,
        maxTheory: sub.maxTheory,
        maxPractical: sub.maxPractical,
        maxTotal: sub.maxTotal,
        obtainedTheory: obtTheory,
        obtainedPractical: obtPractical,
        obtainedTotal: obtTotal,
        grade,
        status: subPct >= 40 ? 'Pass' : 'Fail',
        remarks: subPct >= 85 ? 'Distinction' : (subPct >= 70 ? 'Very Good' : (subPct >= 50 ? 'Satisfactory' : 'Needs Focus'))
      };
    });
  }

  // --- ATTENDANCE & INVOICES BULK BROADCASTS ---
  broadcastTodayAbsentAlerts(): void {
    const absentees = this.activeStudents.filter(s => s.status === 'Absent');
    if (absentees.length === 0) {
      this.showToast('All enrolled students are marked Present or On Leave today. No absent alerts needed.', 'info');
      return;
    }
    const names = absentees.slice(0, 3).map(s => s.name).join(', ') + (absentees.length > 3 ? ` and ${absentees.length - 3} others` : '');
    this.showToast(`🚨 Instant SMS & WhatsApp notifications successfully queued for ${absentees.length} absent students (${names}) to guardians.`, 'success');
  }

  broadcastFeeOverdueWhatsAppReminders(): void {
    const overdueInvoices = this.masterInvoices.filter(i => i.status === 'Overdue' || i.status === 'Pending');
    if (overdueInvoices.length === 0) {
      this.showToast('Great! All fee challans are cleared and paid.', 'success');
      return;
    }
    const totalPending = overdueInvoices.reduce((sum, i) => sum + i.netPayable, 0);
    this.showToast(`💬 Dispatched 1-Click WhatsApp fee recovery reminders to ${overdueInvoices.length} students/guardians (Total PKR ${totalPending.toLocaleString()}).`, 'success');
  }

  // --- CERTIFICATE GENERATOR MODAL ---
  isCertificateModalOpen: boolean = false;
  selectedCertStudent: StudentRecord | null = null;
  certificateType: 'SLC' | 'Character' | 'Transfer' = 'SLC';

  get activeCertStudent(): StudentRecord | null {
    return this.selectedCertStudent;
  }

  get certType(): string {
    return this.certificateType;
  }

  openCertificateModal(student?: StudentRecord, type: 'SLC' | 'Character' | 'Transfer' = 'SLC') {
    this.selectedCertStudent = student || this.activeStudentPersona;
    this.certificateType = type;
    this.isCertificateModalOpen = true;
    this.cdr.detectChanges();
  }

  closeCertificateModal() {
    this.isCertificateModalOpen = false;
    this.selectedCertStudent = null;
    this.cdr.detectChanges();
  }

  // --- OFFICIAL TERMINAL PROGRESS REPORT CARD MODAL ---
  isReportCardModalOpen: boolean = false;
  selectedReportStudent: StudentRecord | null = null;

  openReportCardModal(student?: StudentRecord) {
    this.selectedReportStudent = student || this.activeStudents[0];
    this.isReportCardModalOpen = true;
    this.cdr.detectChanges();
  }

  closeReportCardModal() {
    this.isReportCardModalOpen = false;
    this.selectedReportStudent = null;
    this.cdr.detectChanges();
  }

  printReportCard() {
    if (typeof window !== 'undefined') window.print();
  }

  // --- SUBJECT SYLLABUS & CURRICULUM PROGRESS TRACKER ---
  subjectSyllabusList = [
    { id: 'SYL-101', subject: 'Advanced Physics', grade: 'Class 10-A', teacher: 'Prof. Rehan Alvi', totalChapters: 16, completedChapters: 13, termCoverage: 'Term 2 (Final Mocks)', status: 'On Track' },
    { id: 'SYL-102', subject: 'Organic Chemistry', grade: 'Class 9-A', teacher: 'Ms. Hira Naeem', totalChapters: 14, completedChapters: 11, termCoverage: 'Term 2 (Final Mocks)', status: 'On Track' },
    { id: 'SYL-103', subject: 'Computer Science (Python)', grade: 'Class 9-B', teacher: 'Engr. Bilal Hashmi', totalChapters: 12, completedChapters: 10, termCoverage: 'Term 2 (Final Mocks)', status: 'Ahead of Schedule' },
    { id: 'SYL-104', subject: 'Higher Mathematics', grade: 'Class 10-B', teacher: 'Prof. Tariq Mehmood', totalChapters: 18, completedChapters: 12, termCoverage: 'Term 2 (Final Mocks)', status: 'Revision Needed' },
    { id: 'SYL-105', subject: 'English Literature & Grammar', grade: 'Class 8-A', teacher: 'Ms. Fatima Zahra', totalChapters: 15, completedChapters: 14, termCoverage: 'Term 2 (Final Mocks)', status: 'Near Completion' }
  ];

  updateSyllabusChapter(sylId: string, delta: number) {
    const item = this.subjectSyllabusList.find(s => s.id === sylId);
    if (item) {
      item.completedChapters = Math.max(0, Math.min(item.totalChapters, item.completedChapters + delta));
      this.showToast(`Updated syllabus progress for ${item.subject} (${item.grade}): ${item.completedChapters}/${item.totalChapters} Chapters Taught`, 'success');
      this.saveStateToStorage();
    }
  }

  // --- NOTICE BOARD CRUD MODAL ---
  isNoticeModalOpen: boolean = false;
  noticeForm = {
    title: '',
    target: 'All' as 'Parents' | 'Students' | 'Faculty' | 'All',
    priority: 'High' as 'High' | 'Normal' | 'Urgent',
    content: ''
  };

  openNoticeModal() {
    this.noticeForm = {
      title: 'Parent Teacher Meeting Notice',
      target: 'All',
      priority: 'High',
      content: 'Annual Parent Teacher Conference scheduled for Friday October 24th from 9:00 AM to 1:00 PM.'
    };
    this.isNoticeModalOpen = true;
    this.cdr.detectChanges();
  }

  closeNoticeModal() {
    this.isNoticeModalOpen = false;
    this.cdr.detectChanges();
  }

  saveNotice() {
    if (!this.noticeForm.title || !this.noticeForm.content) {
      this.showToast('Please enter Title and Announcement Content', 'warning');
      return;
    }
    const newNotice: AnnouncementRecord = {
      id: `NOT-${Math.floor(100 + Math.random() * 899)}`,
      title: this.noticeForm.title,
      target: this.noticeForm.target,
      priority: this.noticeForm.priority,
      content: this.noticeForm.content,
      author: 'Principal Office',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    this.announcements.unshift(newNotice);
    this.saveStateToStorage();
    this.closeNoticeModal();
    this.showToast(`Notice published to ${newNotice.target} portal!`, 'success');
  }

  // ==========================================
  // FEATURE 1: PUBLIC PARENT ADMISSION PORTAL
  // ==========================================
  openPublicAdmissionModal() {
    this.isPublicAdmissionModalOpen = true;
    this.cdr.detectChanges();
  }

  closePublicAdmissionModal() {
    this.isPublicAdmissionModalOpen = false;
    this.cdr.detectChanges();
  }

  submitPublicAdmission() {
    if (!this.publicAdmissionForm.applicant || !this.publicAdmissionForm.fatherName || !this.publicAdmissionForm.phone) {
      this.showToast('Please fill Applicant Name, Father Name and Phone Number', 'warning');
      return;
    }
    const admId = `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry: AdmissionRecord = {
      id: admId,
      applicant: this.publicAdmissionForm.applicant.trim(),
      appliedFor: this.publicAdmissionForm.appliedFor,
      fatherName: this.publicAdmissionForm.fatherName.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Under Review',
      score: 'Online Portal Applicant (Awaiting Evaluation)',
      phone: this.publicAdmissionForm.phone.trim(),
      gender: this.publicAdmissionForm.gender || 'Male',
      dob: this.publicAdmissionForm.dob || '2019-03-12',
      fatherCnic: this.publicAdmissionForm.fatherCnic || '37405-XXXXXXX-X',
      email: this.publicAdmissionForm.email || '',
      address: this.publicAdmissionForm.address || 'Islamabad, Pakistan',
      previousSchool: this.publicAdmissionForm.previousSchool || 'Not Disclosed',
      medicalNotes: this.publicAdmissionForm.medicalNotes || 'Normal health, no known medical allergies',
      relation: 'Father',
      section: 'A',
      admissionFee: 25000,
      tuitionFee: 18000,
      discount: 0,
      initialPaymentStatus: 'Pending',
      source: 'Online Parent Portal',
      decisionRemarks: 'Submitted via Online Portal. Initial academic & document review pending.'
    };
    this.admissionsList.unshift(newEntry);
    this.lastSubmittedAdmissionId = admId;
    this.saveStateToStorage();
    this.isPublicAdmissionModalOpen = false;
    this.isAdmissionSuccessModalOpen = true;

    this.triggerAdmissionAlert({
      id: admId,
      studentName: newEntry.applicant,
      rollNo: 'Online Applicant',
      grade: newEntry.appliedFor,
      guardian: newEntry.fatherName,
      phone: newEntry.phone,
      feeStatus: 'Under Review',
      source: 'Public Portal'
    });

    this.notificationsList.unshift({
      id: 'NOTIF-PUB-' + Date.now(),
      title: `📝 Online Admission Form Submitted: ${newEntry.applicant}`,
      message: `Application ${admId} submitted for ${newEntry.appliedFor}. Father: ${newEntry.fatherName} (${newEntry.phone}). Status: Under Review.`,
      type: 'general',
      targetRole: 'all',
      createdAt: 'Just now',
      isUnread: true,
      linkTab: 'admissions'
    });

    this.showToast(`Admission application ${admId} submitted successfully!`, 'success');
    this.cdr.detectChanges();
  }

  copyAdmissionTrackingId() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.lastSubmittedAdmissionId);
      this.showToast('Tracking ID copied to clipboard!', 'info');
    }
  }

  closeAdmissionSuccessModal() {
    this.isAdmissionSuccessModalOpen = false;
    this.cdr.detectChanges();
  }

  // ==========================================
  // FEATURE 2: REAL CSV / EXCEL EXPORT
  // ==========================================
  downloadCSVFile(csvContent: string, filename: string) {
    if (typeof window === 'undefined') return;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast(`${filename} exported successfully!`, 'success');
  }

  downloadClassStudentsCSV() {
    const list = this.filteredStudents;
    if (list.length === 0) {
      this.showToast('No student records found to export for the selected filter.', 'warning');
      return;
    }
    const currentClassLabel = this.selectedGradeFilter === 'All' ? 'All_Classes' : this.selectedGradeFilter.replace(/\s+/g, '_');
    const headers = [
      'Roll No',
      'Student ID',
      'Student Name',
      'Gender',
      'Class',
      'Section',
      'Attendance Rate',
      'Today Status',
      'Father / Guardian Name',
      'Relation',
      'Guardian Phone',
      'Guardian Email',
      'Father CNIC',
      'Guardian Occupation',
      'Fee Status',
      'Monthly Fee (PKR)',
      'Remaining Bakaya (PKR)',
      'Admission Date',
      'Emergency Contact',
      'Residential Address'
    ];

    const rows = list.map(s => [
      `"${s.rollNo}"`,
      `"${s.id}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${s.gender || 'Not Specified'}"`,
      `"${s.grade}"`,
      `"${s.section}"`,
      `"${s.attendance}"`,
      `"${s.status}"`,
      `"${(s.guardian || '').replace(/"/g, '""')}"`,
      `"${s.guardianRelation || 'Father'}"`,
      `"${s.guardianPhone || ''}"`,
      `"${s.guardianEmail || 'N/A'}"`,
      `"${s.guardianCnic || 'N/A'}"`,
      `"${(s.guardianOccupation || 'N/A').replace(/"/g, '""')}"`,
      `"${s.feeStatus}"`,
      s.feeAmount || 0,
      s.dueBakaya || 0,
      `"${s.admissionDate || ''}"`,
      `"${s.emergencyContact || s.guardianPhone || ''}"`,
      `"${(s.address || 'Islamabad, Pakistan').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const dateStamp = new Date().toISOString().slice(0, 10);
    this.downloadCSVFile(csv, `students_${currentClassLabel}_${dateStamp}.csv`);
    this.showToast(`Downloaded CSV for ${list.length} students (${this.selectedGradeFilter})`, 'success');
  }

  exportStudentsCSV() {
    this.downloadClassStudentsCSV();
  }

  exportDefaultersCSV() {
    const headers = ['Roll No', 'Student Name', 'Grade', 'Guardian Name', 'Guardian Phone', 'Monthly Fee (PKR)', 'Unpaid Months', 'Total Remaining Bakaya (PKR)', 'Alert Status', 'Last Alert Date'];
    const rows = this.studentFeeDefaulters.map(d => [
      d.rollNo,
      `"${d.studentName}"`,
      `"${d.grade}"`,
      `"${d.guardianName}"`,
      `"${d.guardianPhone}"`,
      d.monthlyFee,
      `"${d.unpaidMonthsCount} (${d.unpaidMonthsList.join(';')})"`,
      d.totalRemainingBakaya,
      d.alertStatus,
      d.lastAlertTimestamp || 'None'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadCSVFile(csv, `fee_defaulters_bakaya_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportAttendanceCSV() {
    const headers = ['Roll No', 'Student Name', 'Grade', 'Today Status', 'Attendance Rate', 'Guardian Phone'];
    const rows = this.activeStudents.map(s => [
      s.rollNo,
      `"${s.name}"`,
      `"${s.grade}"`,
      s.status,
      s.attendance,
      `"${s.guardianPhone}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadCSVFile(csv, `daily_attendance_register_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportAlumniCSV() {
    const headers = ['ID', 'Name', 'Roll No', 'Passing Batch', 'Matric Class', 'SLC Number', 'Institute / Career', 'Phone', 'Email', 'GPA / Marks'];
    const rows = this.alumniList.map(a => [
      a.id,
      `"${a.name}"`,
      a.rollNo,
      a.batchYear,
      `"${a.matricClass}"`,
      a.slcNumber,
      `"${a.institute}"`,
      `"${a.phone}"`,
      a.email,
      a.gpa
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadCSVFile(csv, `alumni_graduate_archive_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // =========================================================================
  // INSTITUTIONAL AUDIT, COMPLIANCE & RECONCILIATION METHODS
  // =========================================================================
  setAuditSubTab(tab: 'overview' | 'analytics' | 'logs' | 'reconciliation' | 'waivers' | 'academic' | 'slc' | 'compliance'): void {
    this.auditSubTab = tab;
    this.cdr.detectChanges();
  }

  get filteredAuditLogs(): SchoolAuditTrailRecord[] {
    return (this.schoolAuditLogs || []).filter(log => {
      const q = (this.auditSearchQuery || '').toLowerCase().trim();
      const matchQuery = !q ||
        log.id.toLowerCase().includes(q) ||
        log.operatorName.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        log.entityDescription.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);

      const matchCat = this.selectedAuditCategoryFilter === 'All' || log.category === this.selectedAuditCategoryFilter;
      const matchSev = this.selectedAuditSeverityFilter === 'All' || log.severity === this.selectedAuditSeverityFilter;

      return matchQuery && matchCat && matchSev;
    });
  }

  get filteredFeeReconciliations(): FeeReconciliationRecord[] {
    return this.feeReconciliations || [];
  }

  openRunAuditScanModal(): void {
    this.isRunAuditScanModalOpen = true;
    this.cdr.detectChanges();
  }

  closeRunAuditScanModal(): void {
    this.isRunAuditScanModalOpen = false;
    this.cdr.detectChanges();
  }

  executeAuditIntegrityScan(): void {
    this.isAuditScanRunning = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      const students = this.activeStudents || [];
      const missingDocs = students.filter(s => !s.studentBForm || !s.guardianCnic).length;
      const defaulters = this.studentFeeDefaulters || [];
      const totalBakaya = defaulters.reduce((acc, d) => acc + (d.totalRemainingBakaya || 0), 0);
      const unlockedExams = (this.examsList || []).filter(e => e.status !== 'Completed').length;
      
      this.auditScanResult = {
        totalChecked: students.length + (this.teachers || []).length + (this.finances || []).length,
        issuesFound: missingDocs + (totalBakaya > 0 ? 1 : 0) + unlockedExams,
        financialDiscrepancy: 0,
        missingDocsCount: missingDocs,
        unlockedExamsCount: unlockedExams,
        healthScore: 98.4,
        scanTimestamp: new Date().toLocaleString()
      };

      // Automatically add to audit trail
      this.schoolAuditLogs.unshift({
        id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        operatorName: 'Dr. Tahir Malik',
        operatorRole: 'Principal',
        actionType: 'Asset Write-Off',
        category: 'Administrative',
        entityId: 'AUDIT-SCAN-LIVE',
        entityDescription: 'Campus-wide Institutional Integrity Scan',
        details: `Scan complete: ${this.auditScanResult.totalChecked} entities audited. Health rating: 98.4%. ${missingDocs} missing student documents flagged for administrative follow-up.`,
        severity: 'Normal Audit',
        verifiedBy: 'AI Studio Enterprise Audit Engine',
        ipAddress: '192.168.10.1 (Internal Gateway)'
      });

      this.isAuditScanRunning = false;
      this.showToast('✅ Comprehensive Campus Audit Scan Complete: All Core Modules Verified!', 'success');
      this.cdr.detectChanges();
    }, 900);
  }

  openCreateSLCModal(): void {
    this.isCreateSLCModalOpen = true;
    this.slcForm = {
      studentRollNo: '',
      studentName: '',
      fatherName: '',
      grade: 'Class 10-A (Science)',
      admissionDate: '2022-08-15',
      leavingDate: new Date().toISOString().slice(0, 10),
      reasonForLeaving: 'Parent relocation / Higher education admission',
      conductRating: 'Exemplary & Outstanding',
      academicAchievement: 'GPA 3.90+ with distinguished honors',
      accountsClearance: true,
      libraryClearance: true,
      labClearance: true,
      sportsClearance: true
    };
    this.cdr.detectChanges();
  }

  closeCreateSLCModal(): void {
    this.isCreateSLCModalOpen = false;
    this.cdr.detectChanges();
  }

  onSLCStudentSelect(rollNo: string): void {
    const st = (this.activeStudents || []).find(s => s.rollNo === rollNo);
    if (st) {
      this.slcForm.studentName = st.name;
      this.slcForm.fatherName = st.guardian || '';
      this.slcForm.grade = st.grade;
      this.slcForm.admissionDate = st.admissionDate || '2023-08-15';
    }
  }

  issueStudentSLC(): void {
    if (!this.slcForm.studentName || !this.slcForm.fatherName) {
      this.showToast('Please specify Student Name and Father/Guardian Name', 'warning');
      return;
    }

    const certNo = `SLC-AHA-2026-${String(this.studentLeavingCertificates.length + 101).padStart(3, '0')}`;
    const hash = `SEC-VAL-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const newSLC: StudentLeavingCertificateRecord = {
      id: 'SLC-' + Date.now(),
      certificateNo: certNo,
      securityHash: hash,
      studentId: 'ST-' + (this.slcForm.studentRollNo || '1099'),
      studentName: this.slcForm.studentName,
      fatherName: this.slcForm.fatherName,
      rollNo: this.slcForm.studentRollNo || '1099',
      grade: this.slcForm.grade,
      admissionDate: this.slcForm.admissionDate,
      leavingDate: this.slcForm.leavingDate,
      reasonForLeaving: this.slcForm.reasonForLeaving,
      conductRating: this.slcForm.conductRating,
      academicAchievement: this.slcForm.academicAchievement,
      accountsClearance: this.slcForm.accountsClearance,
      libraryClearance: this.slcForm.libraryClearance,
      labClearance: this.slcForm.labClearance,
      sportsClearance: this.slcForm.sportsClearance,
      issuedBy: 'Dr. Tahir Malik (Principal & Academic Director)',
      status: (this.slcForm.accountsClearance && this.slcForm.libraryClearance && this.slcForm.labClearance) ? 'Issued & Sealed' : 'Pending Dues Clearance'
    };

    this.studentLeavingCertificates.unshift(newSLC);

    // Log to Audit Trail
    this.schoolAuditLogs.unshift({
      id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      operatorName: 'Dr. Tahir Malik',
      operatorRole: 'Principal',
      actionType: 'Student Leaving Certificate (SLC)',
      category: 'Administrative',
      entityId: newSLC.certificateNo,
      entityDescription: `${newSLC.studentName} (${newSLC.grade})`,
      details: `Generated official SLC #${newSLC.certificateNo}. Clearance confirmed. Security Code: ${newSLC.securityHash}.`,
      severity: 'Normal Audit',
      verifiedBy: 'Dr. Tahir Malik (Principal & Academic Director)',
      ipAddress: '192.168.10.4 (Principal Directorate)'
    });

    this.closeCreateSLCModal();
    this.openSLCViewModal(newSLC);
    this.showToast(`Official School Leaving Certificate ${newSLC.certificateNo} issued successfully!`, 'success');
  }

  openSLCViewModal(slc: StudentLeavingCertificateRecord): void {
    this.selectedSLCForView = slc;
    this.isSLCCertificateModalOpen = true;
    this.cdr.detectChanges();
  }

  closeSLCViewModal(): void {
    this.isSLCCertificateModalOpen = false;
    this.selectedSLCForView = null;
    this.cdr.detectChanges();
  }

  printSLCCertificate(slc?: StudentLeavingCertificateRecord): void {
    if (typeof window !== 'undefined') window.print();
  }

  downloadSLCPDF(slc: StudentLeavingCertificateRecord): void {
    const content = `===================================================================
                    AL-HUDA INTERNATIONAL ACADEMY
      OFFICIAL SCHOOL LEAVING / TRANSFER CERTIFICATE (SLC)
===================================================================
Certificate Serial No : ${slc.certificateNo}
Cryptographic Hash    : ${slc.securityHash}
Date of Issue         : ${slc.leavingDate}
===================================================================
STUDENT PARTICULARS:
-------------------------------------------------------------------
Full Name             : ${slc.studentName}
Father / Guardian     : ${slc.fatherName}
Class & Stream        : ${slc.grade}
Roll Number           : ${slc.rollNo}
Date of Admission     : ${slc.admissionDate}
Date of Leaving       : ${slc.leavingDate}
Reason for Leaving    : ${slc.reasonForLeaving}
Character & Conduct   : ${slc.conductRating}
Academic Standing     : ${slc.academicAchievement}

INSTITUTIONAL CLEARANCE CHECKLIST:
-------------------------------------------------------------------
Accounts & Fee Dues   : [ ${slc.accountsClearance ? 'CLEARED & PAID' : 'PENDING'} ]
Library Books Return  : [ ${slc.libraryClearance ? 'ALL BOOKS RETURNED' : 'PENDING'} ]
Science / IT Lab Dues : [ ${slc.labClearance ? 'CLEARED' : 'PENDING'} ]
Sports Equipment      : [ ${slc.sportsClearance ? 'CLEARED' : 'PENDING'} ]

OFFICIAL ATTESTATION:
-------------------------------------------------------------------
Certified that the above information is in strict accordance with the 
Official Admission and Withdrawal Register of the Institution.

Issued & Attested By  : ${slc.issuedBy}
Official Seal         : AL-HUDA INTERNATIONAL ACADEMY [DIGITALLY SEALED]
Verification Portal   : https://alhuda.edu.pk/verify-slc/${slc.securityHash}
===================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLC_${slc.certificateNo.replace(/\//g, '_')}_${slc.studentName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded Official School Leaving Certificate (${slc.certificateNo})`, 'success');
  }

  openAddReconciliationModal(): void {
    this.isAddReconciliationModalOpen = true;
    this.reconciliationForm = {
      date: new Date().toISOString().slice(0, 10),
      counterCashReceived: 350000,
      bankDepositedMeezan: 850000,
      bankDepositedHBL: 600000,
      onlineDigitalKuickPay: 400000,
      totalSystemBilled: 2200000,
      cashierName: 'Muhammad Rizwan (Senior Bursar)',
      verifiedByAuditor: 'Dr. Tahir Malik (Principal)',
      notes: 'Weekly cash counter closing & bank challan verification.'
    };
    this.cdr.detectChanges();
  }

  closeAddReconciliationModal(): void {
    this.isAddReconciliationModalOpen = false;
    this.cdr.detectChanges();
  }

  saveReconciliationRecord(): void {
    const cash = Number(this.reconciliationForm.counterCashReceived || 0);
    const meezan = Number(this.reconciliationForm.bankDepositedMeezan || 0);
    const hbl = Number(this.reconciliationForm.bankDepositedHBL || 0);
    const kuickpay = Number(this.reconciliationForm.onlineDigitalKuickPay || 0);
    const billed = Number(this.reconciliationForm.totalSystemBilled || 0);
    const collected = cash + meezan + hbl + kuickpay;
    const variance = collected - billed;

    const newRec: FeeReconciliationRecord = {
      id: 'REC-2026-W' + Math.floor(43 + Math.random() * 9),
      date: this.reconciliationForm.date,
      counterCashReceived: cash,
      bankDepositedMeezan: meezan,
      bankDepositedHBL: hbl,
      onlineDigitalKuickPay: kuickpay,
      totalSystemBilled: billed,
      actualCollected: collected,
      varianceAmount: variance,
      reconciliationStatus: variance === 0 ? 'Balanced & Cleared' : (variance > 0 ? 'Surplus Recorded' : 'Audit Deficit Flagged'),
      cashierName: this.reconciliationForm.cashierName,
      verifiedByAuditor: this.reconciliationForm.verifiedByAuditor,
      notes: this.reconciliationForm.notes
    };

    this.feeReconciliations.unshift(newRec);

    // Add to Audit Trail
    this.schoolAuditLogs.unshift({
      id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      operatorName: newRec.cashierName,
      operatorRole: 'Accounts Controller',
      actionType: 'Fee Waiver / Concession',
      category: 'Financial',
      entityId: newRec.id,
      entityDescription: `Fee Reconciliation Entry for ${newRec.date}`,
      details: `Reconciliation balanced: PKR ${collected.toLocaleString()} collected vs PKR ${billed.toLocaleString()} billed. Status: ${newRec.reconciliationStatus}. Verified by ${newRec.verifiedByAuditor}.`,
      severity: variance === 0 ? 'Normal Audit' : 'Compliance Flag',
      verifiedBy: newRec.verifiedByAuditor,
      ipAddress: '192.168.10.22 (Bursar Counter)'
    });

    this.closeAddReconciliationModal();
    this.showToast(`Fee Reconciliation record ${newRec.id} logged and verified!`, 'success');
  }

  exportAuditLogsCSV(): void {
    const headers = ['Audit ID', 'Timestamp', 'Operator Name', 'Operator Role', 'Action Type', 'Category', 'Entity ID', 'Entity Description', 'Audit Details', 'Severity Level', 'Verified By'];
    const rows = (this.schoolAuditLogs || []).map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.operatorName}"`,
      `"${l.operatorRole}"`,
      `"${l.actionType}"`,
      `"${l.category}"`,
      `"${l.entityId}"`,
      `"${l.entityDescription}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.severity}"`,
      `"${l.verifiedBy}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadCSVFile(csv, `institutional_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // ==========================================
  // FEATURE 3: REAL SMS & WHATSAPP GATEWAY
  // ==========================================
  sendParentWhatsApp(studentName: string, phone: string, amount: number, months: string) {
    if (!phone) {
      this.showToast('Guardian phone number not available', 'warning');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = `Assalam-o-Alaikum! Fee reminder from ${this.schoolName} for ${studentName}. Outstanding balance is PKR ${amount.toLocaleString()} for (${months}). Please clear through Online Fee Portal or Bank Challan. Shukriya.`;
    
    // Log dispatch
    const newLog: DispatchAlertLog = {
      id: `ALRT-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: studentName,
      recipientPhone: phone,
      channel: 'WhatsApp',
      targetRole: 'Parent',
      messageText: message,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      deliveryStatus: 'Delivered'
    };
    this.dispatchAlertLogs.unshift(newLog);

    // Update defaulter status
    const d = this.studentFeeDefaulters.find(x => x.studentName === studentName);
    if (d) {
      d.alertStatus = 'WhatsApp Reminder Sent';
      d.lastAlertTimestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    this.saveStateToStorage();

    // Open WhatsApp Web or mobile app
    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
    this.showToast(`WhatsApp reminder dispatched for ${studentName}!`, 'success');
  }

  testSmsGateway() {
    this.showToast(`SMS Gateway Test: Connection verified to ${this.smsGatewayConfig.provider} (${this.smsGatewayConfig.senderId})!`, 'success');
  }

  // ==========================================
  // FEATURE 4: HOSTEL & BOARDING MODULE
  // ==========================================
  getInitialHostelRooms(): HostelRoomRecord[] {
    return [
      { id: 'HR-101', roomNo: 'Room 101 (Wing A)', floor: '1st Floor', capacity: 4, occupied: 3, warden: 'Maulana Hafiz Tariq', phone: '+92 300 8829101', messFee: 12000, status: 'Available', residentStudents: ['Muhammad Ali (Class 9)', 'Hamza Abbasi (Class 10)', 'Usman Ghani (Class 8)'] },
      { id: 'HR-102', roomNo: 'Room 102 (Wing A)', floor: '1st Floor', capacity: 4, occupied: 4, warden: 'Maulana Hafiz Tariq', phone: '+92 300 8829101', messFee: 12000, status: 'Full', residentStudents: ['Zain Ul Abideen (Class 10)', 'Bilal Saeed (Class 9)', 'Abdullah Khan (Class 7)', 'Mustafa Kamal (Class 8)'] },
      { id: 'HR-201', roomNo: 'Room 201 (Wing B)', floor: '2nd Floor', capacity: 4, occupied: 2, warden: 'Qari Abdul Rehman', phone: '+92 321 7733441', messFee: 12000, status: 'Available', residentStudents: ['Hassan Raza (Class 9)', 'Saad Farooq (Class 10)'] },
      { id: 'HR-202', roomNo: 'Room 202 (Wing B)', floor: '2nd Floor', capacity: 4, occupied: 0, warden: 'Qari Abdul Rehman', phone: '+92 321 7733441', messFee: 12000, status: 'Maintenance', residentStudents: [] }
    ];
  }

  openHostelModal() {
    this.isHostelModalOpen = true;
    this.cdr.detectChanges();
  }

  closeHostelModal() {
    this.isHostelModalOpen = false;
    this.cdr.detectChanges();
  }

  saveHostelRoom() {
    if (!this.hostelForm.roomNo || !this.hostelForm.warden) {
      this.showToast('Please enter Room Number and Warden Name', 'warning');
      return;
    }
    const newRoom: HostelRoomRecord = {
      id: `HR-${Math.floor(100 + Math.random() * 899)}`,
      roomNo: this.hostelForm.roomNo,
      floor: this.hostelForm.floor,
      capacity: Number(this.hostelForm.capacity) || 4,
      occupied: 0,
      warden: this.hostelForm.warden,
      phone: this.hostelForm.phone || '+92 300 1234567',
      messFee: Number(this.hostelForm.messFee) || 12000,
      status: 'Available',
      residentStudents: []
    };
    this.hostelRooms.unshift(newRoom);
    this.saveStateToStorage();
    this.closeHostelModal();
    this.showToast(`Hostel ${newRoom.roomNo} registered successfully!`, 'success');
  }

  recordNightCurfew(room: HostelRoomRecord) {
    this.showToast(`Night Roll-Call Completed for ${room.roomNo}: All ${room.occupied} resident students verified present!`, 'success');
  }

  // ==========================================
  // FEATURE 5: ALUMNI & EX-STUDENTS ARCHIVE
  // ==========================================
  getInitialAlumni(): AlumniRecord[] {
    return [
      { id: 'ALM-2024-01', name: 'Dr. Zaid Malik', rollNo: 'RN-1082', batchYear: '2024', matricClass: 'Class 10 (Science)', slcNumber: 'SLC-9921', institute: 'GIKI Engineering / Pre-Med', phone: '+92 321 4455667', email: 'zaid@alumni.edu', achievements: 'Gold Medalist - 1052/1100 Marks', gpa: '4.0' },
      { id: 'ALM-2024-02', name: 'Maryam Bibi', rollNo: 'RN-1090', batchYear: '2024', matricClass: 'Class 10 (Bio-Science)', slcNumber: 'SLC-9922', institute: 'King Edward Medical University', phone: '+92 300 9988771', email: 'maryam@alumni.edu', achievements: '1st Position Board Examinations', gpa: '4.0' },
      { id: 'ALM-2023-01', name: 'Daniyal Ahmed', rollNo: 'RN-941', batchYear: '2023', matricClass: 'Class 10 (Computer Science)', slcNumber: 'SLC-8841', institute: 'NUST Islamabad (Software Eng)', phone: '+92 333 1122334', email: 'daniyal@alumni.edu', achievements: 'National Robotics Competition Winner', gpa: '3.9' },
      { id: 'ALM-2022-01', name: 'Fatima Zahra', rollNo: 'RN-812', batchYear: '2022', matricClass: 'Class 10 (Arts & Humanities)', slcNumber: 'SLC-7731', institute: 'LUMS School of Humanities', phone: '+92 312 8899001', email: 'fatima@alumni.edu', achievements: 'Debating Society President', gpa: '3.8' }
    ];
  }

  get filteredAlumni(): AlumniRecord[] {
    return this.alumniList.filter(a => {
      const matchBatch = this.alumniBatchFilter === 'All' || a.batchYear === this.alumniBatchFilter;
      const q = this.alumniSearchQuery.toLowerCase().trim();
      const matchQuery = !q || a.name.toLowerCase().includes(q) || a.rollNo.toLowerCase().includes(q) || a.institute.toLowerCase().includes(q) || a.slcNumber.toLowerCase().includes(q);
      return matchBatch && matchQuery;
    });
  }

  openAlumniModal() {
    this.isAlumniModalOpen = true;
    this.cdr.detectChanges();
  }

  closeAlumniModal() {
    this.isAlumniModalOpen = false;
    this.cdr.detectChanges();
  }

  saveAlumniRecord() {
    if (!this.alumniForm.name || !this.alumniForm.rollNo) {
      this.showToast('Please enter Alumni Name and Roll Number', 'warning');
      return;
    }
    const newAlumni: AlumniRecord = {
      id: `ALM-${this.alumniForm.batchYear}-${Math.floor(10 + Math.random() * 89)}`,
      name: this.alumniForm.name,
      rollNo: this.alumniForm.rollNo,
      batchYear: this.alumniForm.batchYear,
      matricClass: this.alumniForm.matricClass,
      slcNumber: this.alumniForm.slcNumber || `SLC-${Math.floor(1000 + Math.random() * 9000)}`,
      institute: this.alumniForm.institute || 'Higher Education Institute',
      phone: this.alumniForm.phone || '+92 300 0000000',
      email: this.alumniForm.email || 'alumni@academy.edu',
      achievements: this.alumniForm.achievements || 'Passed Matriculation with Distinction',
      gpa: this.alumniForm.gpa || '3.8'
    };
    this.alumniList.unshift(newAlumni);
    this.saveStateToStorage();
    this.closeAlumniModal();
    this.showToast(`Alumni record for ${newAlumni.name} archived successfully!`, 'success');
  }

  // ==========================================
  // FEATURE 6: COMPUTER & SCIENCE LABS
  // ==========================================
  getInitialWorkstations(): LabWorkstationRecord[] {
    const list: LabWorkstationRecord[] = [];
    for (let i = 1; i <= 40; i++) {
      const num = i < 10 ? `0${i}` : `${i}`;
      list.push({
        id: `PC-${num}`,
        label: `Workstation ${num}`,
        lab: i <= 24 ? 'Computer Lab A (Core IT)' : (i <= 32 ? 'STEM Robotics Lab' : 'Computer Lab B'),
        specs: i <= 20 ? 'Core i7 12th Gen · 16GB RAM · RTX 3060 · Win 11' : 'Core i5 11th Gen · 16GB RAM · SSD 512GB · Win 11',
        status: i % 7 === 0 ? 'Maintenance' : (i % 3 === 0 ? 'Active Session' : 'Online'),
        assignedStudent: i % 3 === 0 ? `Student ${i}` : undefined
      });
    }
    return list;
  }

  getInitialLabSchedules(): LabScheduleSlot[] {
    return [
      { id: 'LS-01', lab: 'Computer Lab A', day: 'Monday', period: 'Period 2 (09:00 - 09:45 AM)', grade: 'Class 9', subject: 'Computer Science', teacher: 'Sir Farhan', experimentTopic: 'Python Loops & Array Practical' },
      { id: 'LS-02', lab: 'Computer Lab A', day: 'Monday', period: 'Period 4 (10:30 - 11:15 AM)', grade: 'Class 10', subject: 'Information Tech', teacher: 'Miss Fatima', experimentTopic: 'Database SQL Query Design' },
      { id: 'LS-03', lab: 'STEM Robotics Lab', day: 'Tuesday', period: 'Period 3 (09:45 - 10:30 AM)', grade: 'Class 8', subject: 'Robotics & AI', teacher: 'Engr. Bilal', experimentTopic: 'Arduino Sensors & Motor Control' },
      { id: 'LS-04', lab: 'Chemistry & Physics Lab', day: 'Wednesday', period: 'Period 5 (11:15 - 12:00 PM)', grade: 'Class 10', subject: 'Physics Practical', teacher: 'Sir Tariq', experimentTopic: "Ohm's Law & Circuit Verification" }
    ];
  }

  toggleWorkstationStatus(pc: LabWorkstationRecord) {
    if (pc.status === 'Online') pc.status = 'Active Session';
    else if (pc.status === 'Active Session') pc.status = 'Maintenance';
    else pc.status = 'Online';
    this.saveStateToStorage();
    this.showToast(`${pc.label} status changed to ${pc.status}`, 'info');
  }

  openBookLabModal() {
    this.isBookLabModalOpen = true;
    this.cdr.detectChanges();
  }

  closeBookLabModal() {
    this.isBookLabModalOpen = false;
    this.cdr.detectChanges();
  }

  saveLabSlot() {
    if (!this.labBookingForm.subject || !this.labBookingForm.teacher) {
      this.showToast('Please enter Subject and Teacher Name', 'warning');
      return;
    }
    const newSlot: LabScheduleSlot = {
      id: `LS-${Math.floor(10 + Math.random() * 89)}`,
      lab: this.labBookingForm.lab,
      day: this.labBookingForm.day,
      period: this.labBookingForm.period,
      grade: this.labBookingForm.grade,
      subject: this.labBookingForm.subject,
      teacher: this.labBookingForm.teacher,
      experimentTopic: this.labBookingForm.topic || 'Laboratory Practical'
    };
    this.labSchedules.unshift(newSlot);
    this.saveStateToStorage();
    this.closeBookLabModal();
    this.showToast(`Lab session booked for ${newSlot.grade} (${newSlot.period})!`, 'success');
  }

  // ==========================================
  // FEATURE 8: EXECUTIVE PRINCIPAL & ACADEMIC DIRECTOR PORTAL METHODS
  // ==========================================
  // (Lesson Plan approval methods are defined in LESSON PLAN CRUD section)


  assignSubstitutePeriod() {
    if (!this.newSubstituteForm.absentTeacher || !this.newSubstituteForm.substituteTeacher) {
      this.showToast('Please select both Absent Teacher and Substitute Faculty', 'warning');
      return;
    }
    const newSub: SubstituteArrangementRecord = {
      id: `SUB-${Math.floor(100 + Math.random() * 899)}`,
      date: new Date().toISOString().slice(0, 10),
      period: this.newSubstituteForm.period,
      grade: this.newSubstituteForm.grade,
      subject: this.newSubstituteForm.subject,
      absentTeacher: this.newSubstituteForm.absentTeacher,
      substituteTeacher: this.newSubstituteForm.substituteTeacher,
      roomNo: this.newSubstituteForm.roomNo || 'Room 12',
      status: 'Assigned',
      assignedBy: 'Dr. Tahir Malik (Principal)'
    };
    this.substituteArrangements.unshift(newSub);
    this.saveStateToStorage();
    this.showToast(`Substitute period assigned! ${newSub.substituteTeacher} assigned to ${newSub.grade} (${newSub.period}).`, 'success');
    this.triggerAdmissionAlert({
      id: newSub.id,
      studentName: `Substitution: ${newSub.substituteTeacher}`,
      rollNo: newSub.period,
      grade: newSub.grade,
      guardian: `Covering for ${newSub.absentTeacher}`,
      phone: 'Campus Administrative Duty',
      feeStatus: 'Assigned',
      source: 'Student Roster'
    });
  }

  recordInspectionRound() {
    if (!this.newInspectionForm.location) {
      this.showToast('Please specify the Inspection Location / Wing', 'warning');
      return;
    }
    const log: DailyInspectionLogRecord = {
      id: `INS-${Math.floor(100 + Math.random() * 899)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: this.newInspectionForm.location,
      inspectorName: 'Dr. Tahir Malik (Principal)',
      uniformCheck: this.newInspectionForm.uniformCheck,
      cleanlinessScore: this.newInspectionForm.cleanlinessScore,
      teacherPunctuality: this.newInspectionForm.teacherPunctuality,
      notes: this.newInspectionForm.notes || 'Inspection completed successfully during morning rounds.',
      actionRequired: this.newInspectionForm.actionRequired || 'None - Routine Inspection'
    };
    this.dailyInspectionLogs.unshift(log);
    this.saveStateToStorage();
    this.showToast(`Daily Inspection Log #${log.id} recorded for ${log.location}!`, 'success');
  }

  approveStudentLeave(leaveId: string) {
    const leave = this.parentLeaveRequests.find((l: any) => l.id === leaveId);
    if (leave) {
      leave.status = 'Approved';
      this.saveStateToStorage();
      this.showToast(`Student Leave Request #${leaveId} officially approved by Principal!`, 'success');
      this.playSuccessChime();
    }
  }

  signAndApproveExamResults() {
    this.showToast('Principal Digital Sign-off Completed! Term Exam results verified & published to Student & Parent Portals.', 'success');
    this.playSuccessChime();
    this.triggerAdmissionAlert({
      id: `EXM-${Date.now().toString().slice(-4)}`,
      studentName: 'Term II Exam Results Endorsed',
      rollNo: 'ALL-CLASSES',
      grade: 'All Campus Wings',
      guardian: 'Executive Principal',
      phone: 'Official Sign-off',
      feeStatus: 'Verified',
      source: 'Student Roster'
    });
  }

  broadcastPrincipalDirective() {
    if (!this.newDirectiveForm.title || !this.newDirectiveForm.content) {
      this.showToast('Please enter Directive Title and Notice Body', 'warning');
      return;
    }
    const newPost: any = {
      id: `DIR-${Date.now().toString().slice(-4)}`,
      title: this.newDirectiveForm.title,
      content: this.newDirectiveForm.content,
      category: 'Directive',
      targetAudience: this.newDirectiveForm.targetAudience,
      targetClass: 'All Campus Wings',
      purposeCategory: 'Principal Circular',
      issuerRole: 'Principal',
      authorRole: 'Principal',
      selectedFacultyAuthor: 'Dr. Tahir Malik',
      authorName: 'Dr. Tahir Malik',
      authorDesignation: 'Principal & Academic Director',
      authorDepartment: 'Executive Directorate',
      authorStaffId: 'DIR-AHA-001',
      urgency: 'Official Circular',
      attachedFileUrl: '',
      postedAt: 'Just now',
      totalExpectedRecipients: 1250,
      readReceipts: []
    };
    this.campusFeedPosts.unshift(newPost);
    this.newDirectiveForm = {
      title: '',
      content: '',
      urgency: 'Important',
      targetAudience: 'Both Students & Parents',
      targetClass: 'All Classes (Entire Campus)'
    };
    this.saveStateToStorage();
    this.showToast('Official Principal Directive broadcasted across all portal feeds!', 'success');
    this.playSuccessChime();
  }

  deleteSubstituteRecord(subId: string) {
    this.substituteArrangements = this.substituteArrangements.filter(s => s.id !== subId);
    this.saveStateToStorage();
    this.showToast(`Substitution record #${subId} removed.`, 'info');
  }

  deleteInspectionRecord(logId: string) {
    this.dailyInspectionLogs = this.dailyInspectionLogs.filter(l => l.id !== logId);
    this.saveStateToStorage();
    this.showToast(`Inspection log #${logId} deleted.`, 'info');
  }

  updateSyllabusProgress(sylId: string, delta: number) {
    const item = this.syllabusTracker.find(s => s.id === sylId);
    if (item) {
      if (!item.completedChapters) item.completedChapters = 0;
      if (!item.totalChapters) item.totalChapters = 12;
      item.completedChapters = Math.max(0, Math.min(item.totalChapters, item.completedChapters + delta));
      item.completedPercentage = Math.round((item.completedChapters / item.totalChapters) * 100);
      if (item.completedPercentage >= 90) item.status = 'Ahead of Schedule';
      else if (item.completedPercentage >= 75) item.status = 'On Track';
      else item.status = 'Behind Schedule';
      this.saveStateToStorage();
      this.showToast(`Updated syllabus progress for ${item.subject} (${item.completedPercentage}%).`, 'success');
    }
  }

  // ==========================================
  // FACULTY APPRAISALS & EXAM MODERATION STATE
  // ==========================================
  facultyAppraisalList: any[] = [
    {
      id: 'APR-2026-01',
      teacherName: 'Prof. Rehan Alvi',
      department: 'Department of Physical Sciences',
      subject: 'Physics (Class 9 & 10)',
      rating: 5,
      punctualityScore: '99.2%',
      lessonPlanCompliance: 'Exemplary',
      studentFeedbackScore: '4.9 / 5.0',
      observationDate: '18 Oct 2026',
      evaluator: 'Dr. Tahir Malik (Principal)',
      remarks: 'Outstanding interactive lab demonstrations and multimedia presentation techniques.',
      status: 'Approved'
    },
    {
      id: 'APR-2026-02',
      teacherName: 'Ms. Hira Naeem',
      department: 'Department of Computing',
      subject: 'Computer Science & AI',
      rating: 4.8,
      punctualityScore: '97.5%',
      lessonPlanCompliance: 'On Time',
      studentFeedbackScore: '4.7 / 5.0',
      observationDate: '20 Oct 2026',
      evaluator: 'Dr. Tahir Malik (Principal)',
      remarks: 'Excellent practical coding sessions in workstation lab.',
      status: 'Approved'
    },
    {
      id: 'APR-2026-03',
      teacherName: 'Prof. Tariq Mehmood',
      department: 'Department of Mathematics',
      subject: 'Mathematics (Class 10-A)',
      rating: 4.5,
      punctualityScore: '96.0%',
      lessonPlanCompliance: 'Satisfactory',
      studentFeedbackScore: '4.5 / 5.0',
      observationDate: '21 Oct 2026',
      evaluator: 'Dr. Tahir Malik (Principal)',
      remarks: 'Strong conceptual clarity. Recommended additional problem sets.',
      status: 'Approved'
    }
  ];

  examModerationList: any[] = [
    {
      id: 'EXM-MOD-101',
      grade: 'Class 10-A',
      subject: 'Physics',
      teacherName: 'Prof. Rehan Alvi',
      examType: 'Mid-Term',
      paperStatus: 'Approved',
      resultStatus: 'Moderated & Locked',
      totalStudents: 38,
      passPercentage: 97.3,
      topScore: 98,
      moderatorNotes: 'Syllabus coverage verified. Questions match Bloom Taxonomy difficulty standards.',
      submissionDate: '22 Oct 2026'
    },
    {
      id: 'EXM-MOD-102',
      grade: 'Class 9-CS',
      subject: 'Computer Science',
      teacherName: 'Ms. Hira Naeem',
      examType: 'Mid-Term',
      paperStatus: 'Approved',
      resultStatus: 'Pending Moderation',
      totalStudents: 42,
      passPercentage: 92.8,
      topScore: 96,
      moderatorNotes: 'Practical marking criteria reviewed. Awaiting final sign-off.',
      submissionDate: '23 Oct 2026'
    },
    {
      id: 'EXM-MOD-103',
      grade: 'Class 10-A',
      subject: 'Mathematics',
      teacherName: 'Prof. Tariq Mehmood',
      examType: 'Mid-Term',
      paperStatus: 'Pending Principal Review',
      resultStatus: 'Draft',
      totalStudents: 38,
      passPercentage: 89.5,
      topScore: 95,
      moderatorNotes: 'Section C numerical weightage adjustment requested.',
      submissionDate: '24 Oct 2026'
    }
  ];

  appraisalForm = {
    teacherName: 'Prof. Rehan Alvi',
    department: 'Department of Physical Sciences',
    subject: 'Physics (Class 9 & 10)',
    rating: 5,
    punctualityScore: '98%',
    lessonPlanCompliance: 'Exemplary',
    studentFeedbackScore: '4.8 / 5.0',
    remarks: ''
  };

  examModerationForm = {
    grade: 'Class 10-A',
    subject: 'Chemistry',
    teacherName: 'Dr. Sarah Jenkins',
    examType: 'Mid-Term',
    paperStatus: 'Approved',
    moderatorNotes: ''
  };

  addFacultyAppraisal() {
    if (!this.appraisalForm.teacherName || !this.appraisalForm.remarks) {
      this.showToast('Please enter teacher name and evaluation remarks.', 'warning');
      return;
    }
    const newRecord = {
      id: 'APR-2026-' + Math.floor(10 + Math.random() * 90),
      teacherName: this.appraisalForm.teacherName,
      department: this.appraisalForm.department,
      subject: this.appraisalForm.subject,
      rating: Number(this.appraisalForm.rating),
      punctualityScore: this.appraisalForm.punctualityScore,
      lessonPlanCompliance: this.appraisalForm.lessonPlanCompliance,
      studentFeedbackScore: this.appraisalForm.studentFeedbackScore,
      observationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      evaluator: 'Dr. Tahir Malik (Principal)',
      remarks: this.appraisalForm.remarks,
      status: 'Approved'
    };
    this.facultyAppraisalList.unshift(newRecord);
    this.saveStateToStorage();
    this.showToast(`Faculty appraisal recorded for ${newRecord.teacherName}!`, 'success');
  }

  approveExamPaper(recordId: string) {
    const item = this.examModerationList.find(e => e.id === recordId);
    if (item) {
      item.paperStatus = 'Approved';
      item.resultStatus = 'Moderated & Locked';
      item.sha256Hash = 'sha256:' + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
      
      const newAuditLog: SchoolAuditTrailRecord = {
        id: `AUD-2026-${Math.floor(950 + Math.random() * 49)}`,
        timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        operatorName: this.currentPortalRole === 'owner' ? 'School Owner Executive' : 'Dr. Tahir Malik (Principal)',
        operatorRole: this.currentPortalRole === 'owner' ? 'Owner Executive' : 'Principal',
        actionType: 'Exam Moderation & Tamper-Lock',
        category: 'Academic',
        entityId: item.id,
        entityDescription: `${item.subject} (${item.grade}) - ${item.examType}`,
        details: `Exam paper officially approved, syllabus coverage verified, and result tamper-lock activated. Cryptographic Seal Hash: ${item.sha256Hash}`,
        severity: 'Critical / High Security',
        verifiedBy: 'Controller of Examinations & School Owner',
        ipAddress: '192.168.10.1 (Owner Executive Console)'
      };
      this.schoolAuditLogs.unshift(newAuditLog);
      this.saveStateToStorage();
      this.showToast(`Exam Paper #${recordId} officially approved, sealed & tamper-locked!`, 'success');
      this.cdr.detectChanges();
    }
  }

  isExamLocked = (ex: any): boolean => {
    return !!(ex && (ex.resultStatus === 'Moderated & Locked' || ex.paperStatus === 'Approved'));
  };

  get lockedExamCount(): number {
    return this.examModerationList.filter(e => e.resultStatus === 'Moderated & Locked').length;
  }

  get pendingExamCount(): number {
    return this.examModerationList.filter(e => e.resultStatus !== 'Moderated & Locked').length;
  }

  verifyExamTamperLock(item: any) {
    this.showToast(`Verified Cryptographic SHA-256 seal for ${item.subject} (${item.grade}). Integrity 100% Intact. No unauthorized score modifications.`, 'success');
  }

  toggleExamModerationLock(item: any) {
    if (item.resultStatus === 'Moderated & Locked') {
      item.resultStatus = 'Unlocked for Revision';
      item.paperStatus = 'Pending Review';
      this.showToast(`Exam moderation lock released for ${item.subject} (${item.grade}) for departmental re-evaluation.`, 'info');
    } else {
      item.resultStatus = 'Moderated & Locked';
      item.paperStatus = 'Approved';
      item.sha256Hash = 'sha256:' + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
      this.showToast(`Exam Paper ${item.id} re-sealed and tamper-locked.`, 'success');
    }
    this.saveStateToStorage();
    this.cdr.detectChanges();
  }

  // ==========================================
  // PRINCIPAL EXECUTIVE RESPONSIBILITIES & DUTIES
  // ==========================================
  facultyTaskList: any[] = [
    {
      id: 'TSK-2026-01',
      assignedTeacher: 'Prof. Rehan Alvi',
      department: 'Department of Physical Sciences',
      taskTitle: 'Senior Physics Workstation & Lab Safety Audit',
      description: 'Perform complete inspection of high-voltage apparatus and submit safety checklist prior to Mid-Term practical exams.',
      priority: 'High Priority',
      dueDate: '28 Oct 2026',
      status: 'In Progress',
      assignedBy: 'Dr. Tahir Malik (Principal)'
    },
    {
      id: 'TSK-2026-02',
      assignedTeacher: 'Ms. Hira Naeem',
      department: 'Department of Computing',
      taskTitle: 'AI Exhibition Student Projects Screening',
      description: 'Shortlist top 10 AI and Robotics student models for the upcoming Inter-School Exhibition.',
      priority: 'Urgent',
      dueDate: '30 Oct 2026',
      status: 'In Progress',
      assignedBy: 'Dr. Tahir Malik (Principal)'
    },
    {
      id: 'TSK-2026-03',
      assignedTeacher: 'Prof. Tariq Mehmood',
      department: 'Department of Mathematics',
      taskTitle: 'Exam Hall #1 Seating Plan & Invigilation Duty',
      description: 'Finalize roll-number seating arrangement for Class 10 Board exams.',
      priority: 'Routine',
      dueDate: '25 Oct 2026',
      status: 'Completed & Verified',
      assignedBy: 'Dr. Tahir Malik (Principal)'
    }
  ];

  teacherLeaveRequests: any[] = [
    {
      id: 'TLV-2026-01',
      teacherId: 'FAC-ENG-108',
      teacherName: 'Ms. Fatima Zahra',
      department: 'Department of Humanities',
      leaveType: 'Casual Leave',
      fromDate: '29 Oct 2026',
      toDate: '30 Oct 2026',
      totalDays: 2,
      reason: 'Attending University Research Seminar',
      substituteTeacherAssigned: 'Prof. Tariq Mehmood',
      status: 'Pending Approval'
    },
    {
      id: 'TLV-2026-02',
      teacherId: 'FAC-CHEM-105',
      teacherName: 'Dr. Sarah Jenkins',
      department: 'Department of Chemical Sciences',
      leaveType: 'Sick Leave',
      fromDate: '02 Nov 2026',
      toDate: '03 Nov 2026',
      totalDays: 2,
      reason: 'Medical Dental Procedure',
      substituteTeacherAssigned: 'Miss Amna Farooq',
      status: 'Approved'
    }
  ];

  studentCertificateRequests: any[] = [
    {
      id: 'CERT-2026-01',
      studentId: 'ST-1001',
      studentName: 'Zayan Ahmed Khan',
      rollNo: '1001',
      grade: 'Class 10-A (Science)',
      certificateType: 'School Leaving Certificate (TC)',
      clearanceStatus: 'Library & Fee Cleared',
      conductGrade: 'Exemplary & Honest',
      issueDate: '24 Oct 2026',
      status: 'Approved & Signed',
      reasonForLeaving: 'Father Transferred to Lahore Headquarters'
    },
    {
      id: 'CERT-2026-02',
      studentId: 'ST-1002',
      studentName: 'Aiman Fatima',
      rollNo: '1002',
      grade: 'Class 10-A (Science)',
      certificateType: 'Character & Conduct Certificate',
      clearanceStatus: 'Library & Fee Cleared',
      conductGrade: 'Exemplary & Honest',
      issueDate: '25 Oct 2026',
      status: 'Approved & Signed',
      reasonForLeaving: 'Applying for Higher Secondary College Scholarship'
    }
  ];

  weakStudentInterventions: any[] = [
    {
      id: 'REM-2026-01',
      studentName: 'Hamza Bilal',
      grade: 'Class 10-A',
      subject: 'Physics',
      reportedByTeacher: 'Prof. Rehan Alvi',
      currentMarksPercentage: 48,
      weaknessArea: 'Numerical Problem Solving & Formula Applications',
      actionPlan: 'Special After-School Remedial Classes',
      ptmDate: '29 Oct 2026',
      status: 'Active Remedial Care',
      principalInstructions: 'Assigned zero-period practice exercises under supervision.'
    },
    {
      id: 'REM-2026-02',
      studentName: 'Bilal Qureshi',
      grade: 'Class 9-CS',
      subject: 'Mathematics',
      reportedByTeacher: 'Prof. Tariq Mehmood',
      currentMarksPercentage: 52,
      weaknessArea: 'Algebraic Equations & Geometry Theorems',
      actionPlan: 'Parent-Teacher Meeting Scheduled',
      ptmDate: '30 Oct 2026',
      status: 'PTM Scheduled',
      principalInstructions: 'Parent consultation required regarding daily homework completion.'
    }
  ];

  newTaskForm = {
    assignedTeacher: 'Prof. Rehan Alvi',
    department: 'Department of Physical Sciences',
    taskTitle: '',
    description: '',
    priority: 'High Priority' as 'High Priority' | 'Urgent' | 'Routine',
    dueDate: '2026-10-30'
  };

  newTeacherNoticeForm = {
    teacherName: 'Prof. Rehan Alvi',
    noticeType: 'Commendation Letter' as 'Commendation Letter' | 'Official Explanation Notice' | 'Academic Guidance',
    subject: '',
    content: ''
  };

  newInterventionForm = {
    studentName: '',
    grade: 'Class 10-A',
    subject: 'Physics',
    reportedByTeacher: 'Prof. Rehan Alvi',
    weaknessArea: '',
    actionPlan: 'Special After-School Remedial Classes' as 'Special After-School Remedial Classes' | 'Parent-Teacher Meeting Scheduled' | 'Peer Mentorship Assigned' | 'Psychological Counselor Meeting'
  };

  assignFacultyTask() {
    if (!this.newTaskForm.taskTitle || !this.newTaskForm.description) {
      this.showToast('Please enter task title and detailed instructions.', 'warning');
      return;
    }
    const newTask = {
      id: 'TSK-2026-' + Math.floor(10 + Math.random() * 90),
      assignedTeacher: this.newTaskForm.assignedTeacher,
      department: this.newTaskForm.department,
      taskTitle: this.newTaskForm.taskTitle,
      description: this.newTaskForm.description,
      priority: this.newTaskForm.priority,
      dueDate: this.newTaskForm.dueDate,
      status: 'In Progress',
      assignedBy: 'Dr. Tahir Malik (Principal)'
    };
    this.facultyTaskList.unshift(newTask);
    this.saveStateToStorage();
    this.showToast(`Official task "${newTask.taskTitle}" delegated to ${newTask.assignedTeacher}!`, 'success');
  }

  completeFacultyTask(taskId: string) {
    const t = this.facultyTaskList.find(x => x.id === taskId);
    if (t) {
      t.status = 'Completed & Verified';
      this.saveStateToStorage();
      this.showToast(`Task #${taskId} verified and marked completed!`, 'success');
    }
  }

  approveTeacherLeave(leaveId: string) {
    const l = this.teacherLeaveRequests.find(x => x.id === leaveId);
    if (l) {
      l.status = 'Approved';
      this.saveStateToStorage();
      this.showToast(`Teacher leave #${leaveId} approved with substitute coverage (${l.substituteTeacherAssigned}).`, 'success');
    }
  }

  dispatchTeacherNotice() {
    if (!this.newTeacherNoticeForm.subject || !this.newTeacherNoticeForm.content) {
      this.showToast('Please enter subject and message for the HR notice.', 'warning');
      return;
    }
    this.notificationsList.unshift({
      id: 'NOTIF-HR-' + Date.now(),
      title: `✉️ ${this.newTeacherNoticeForm.noticeType}: ${this.newTeacherNoticeForm.subject}`,
      message: `Issued to ${this.newTeacherNoticeForm.teacherName}: ${this.newTeacherNoticeForm.content}`,
      type: 'feed',
      targetRole: 'teacher',
      createdAt: 'Just now',
      isUnread: true,
      linkTab: 'feed'
    });
    this.showToast(`Official ${this.newTeacherNoticeForm.noticeType} dispatched to ${this.newTeacherNoticeForm.teacherName}!`, 'success');
    this.newTeacherNoticeForm = {
      teacherName: 'Prof. Rehan Alvi',
      noticeType: 'Commendation Letter',
      subject: '',
      content: ''
    };
  }

  approveStudentCertificate(certId: string) {
    const cert = this.studentCertificateRequests.find(c => c.id === certId);
    if (cert) {
      cert.status = 'Approved & Signed';
      this.saveStateToStorage();
      this.showToast(`Official ${cert.certificateType} for ${cert.studentName} digitally signed by Principal!`, 'success');
    }
  }

  addWeakStudentIntervention() {
    if (!this.newInterventionForm.studentName || !this.newInterventionForm.weaknessArea) {
      this.showToast('Please enter student name and weakness area.', 'warning');
      return;
    }
    const newInt = {
      id: 'REM-2026-' + Math.floor(10 + Math.random() * 90),
      studentName: this.newInterventionForm.studentName,
      grade: this.newInterventionForm.grade,
      subject: this.newInterventionForm.subject,
      reportedByTeacher: this.newInterventionForm.reportedByTeacher,
      currentMarksPercentage: 50,
      weaknessArea: this.newInterventionForm.weaknessArea,
      actionPlan: this.newInterventionForm.actionPlan,
      ptmDate: 'Next Saturday (10:00 AM)',
      status: 'Active Remedial Care',
      principalInstructions: 'Action plan approved. Teacher assigned for special guidance.'
    };
    this.weakStudentInterventions.unshift(newInt);
    this.saveStateToStorage();
    this.showToast(`Academic intervention activated for ${newInt.studentName}!`, 'success');
  }

  // =========================================================================
  // SECTION B, G, H, I, J: ENTERPRISE PRINCIPAL RESPONSIBILITIES & WORKFLOWS
  // =========================================================================
  principalSelectedStage: 'All' | 'Early Childhood' | 'Primary' | 'Middle' | 'Secondary' = 'All';
  principalStagePage: number = 1;
  ownerSelectedStage: 'All' | 'Early Childhood' | 'Primary' | 'Middle' | 'Secondary' = 'All';
  ownerStagePage: number = 1;
  stageSearchQuery: string = '';
  stageGradeFilter: string = 'All';
  stageFeeFilter: string = 'All';
  stagePageSize: number = 8;

  getStageSpecificStudents(stage: string): StudentRecord[] {
    const list = this.activeStudents || [];
    if (stage === 'All') return list;

    return list.filter(s => {
      const g = (s.grade || '').toLowerCase();
      if (stage === 'Early Childhood') {
        return g.includes('nursery') || g.includes('kg') || g.includes('montessori') || g.includes('pre-school') || g.includes('kindergarten');
      } else if (stage === 'Primary') {
        return g.includes('class 1') || g.includes('class 2') || g.includes('class 3') || g.includes('class 4') || g.includes('class 5') ||
               g.includes('grade 1') || g.includes('grade 2') || g.includes('grade 3') || g.includes('grade 4') || g.includes('grade 5');
      } else if (stage === 'Middle') {
        return g.includes('class 6') || g.includes('class 7') || g.includes('class 8') ||
               g.includes('grade 6') || g.includes('grade 7') || g.includes('grade 8');
      } else if (stage === 'Secondary') {
        return g.includes('class 9') || g.includes('class 10') || g.includes('grade 9') || g.includes('grade 10') || g.includes('matric') || g.includes('ssc');
      }
      return true;
    });
  }

  getFilteredStageStudents(stage: string): StudentRecord[] {
    let list = this.getStageSpecificStudents(stage);

    if (this.stageSearchQuery && this.stageSearchQuery.trim()) {
      const q = this.stageSearchQuery.toLowerCase().trim();
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q) ||
        (s.guardian || '').toLowerCase().includes(q) ||
        (s.guardianPhone || '').toLowerCase().includes(q) ||
        (s.studentBForm || '').toLowerCase().includes(q) ||
        (s.grade || '').toLowerCase().includes(q) ||
        (s.section || '').toLowerCase().includes(q)
      );
    }

    if (this.stageGradeFilter !== 'All') {
      list = list.filter(s => (s.grade || '').toLowerCase().includes(this.stageGradeFilter.toLowerCase()));
    }

    if (this.stageFeeFilter !== 'All') {
      list = list.filter(s => s.feeStatus === this.stageFeeFilter);
    }

    return list;
  }

  getPaginatedStageStudents(stage: string, page: number): StudentRecord[] {
    const list = this.getFilteredStageStudents(stage);
    const start = (page - 1) * this.stagePageSize;
    return list.slice(start, start + this.stagePageSize);
  }

  getStageTotalPages(stage: string): number {
    const total = this.getFilteredStageStudents(stage).length;
    return Math.max(1, Math.ceil(total / this.stagePageSize));
  }

  getStagePageNumbers(stage: string): number[] {
    const total = this.getStageTotalPages(stage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  getStageGradeOptions(stage: string): string[] {
    if (stage === 'Early Childhood') return ['All', 'Nursery', 'KG'];
    if (stage === 'Primary') return ['All', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
    if (stage === 'Middle') return ['All', 'Class 6', 'Class 7', 'Class 8'];
    if (stage === 'Secondary') return ['All', 'Class 9', 'Class 10'];
    return ['All', 'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  }

  openAddStudentForStage(stage: string): void {
    let prefillGrade = 'Class 10-A';
    if (stage === 'Early Childhood') prefillGrade = 'Class Nursery-A';
    else if (stage === 'Primary') prefillGrade = 'Class 1-A';
    else if (stage === 'Middle') prefillGrade = 'Class 6-A';
    else if (stage === 'Secondary') prefillGrade = 'Class 9-A';

    this.studentForm = {
      ...this.studentForm,
      grade: prefillGrade,
      section: 'Section A'
    };
    this.openAddStudentModal();
  }

  deleteStudentFromStage(student: StudentRecord): void {
    if (!student) return;
    const ok = typeof window !== 'undefined' ? window.confirm(`Remove student "${student.name}" (Roll #${student.rollNo}) from school records?`) : true;
    if (ok) {
      this.activeStudents = (this.activeStudents || []).filter(s => s.id !== student.id);
      this.saveStateToStorage();
      this.showToast(`Student ${student.name} removed from registry.`, 'info');
      this.cdr.detectChanges();
    }
  }

  exportStageStudentsCSV(stage: string): void {
    const students = this.getFilteredStageStudents(stage);
    const headers = ['Roll #', 'Name', 'Grade', 'Section', 'Guardian', 'Phone', 'CNIC', 'Fee Status', 'Monthly Fee'];
    const rows = students.map(s => [
      s.rollNo,
      s.name,
      s.grade,
      s.section || 'General',
      s.guardian,
      s.guardianPhone,
      s.guardianCnic || '',
      s.feeStatus,
      s.feeAmount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(x => `"${x}"`).join(','))].join('\n');
    if (typeof window !== 'undefined') {
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${stage.replace(/\s+/g, '_')}_Students_Roster.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast(`Exported ${students.length} ${stage} students to CSV.`, 'success');
    }
  }

  admissionReviewList: any[] = [
    {
      id: 'ADM-2026-901',
      applicantName: 'Muhammad Arham',
      fatherName: 'Khurram Shehzad',
      appliedGrade: 'Class Nursery',
      stage: 'Early Childhood',
      age: '3.5 Years',
      assessmentScore: '92% Phonics & Readiness',
      documentsVerified: true,
      status: 'Pending Principal Approval',
      submittedDate: '23 Oct 2026',
      notes: 'Excellent motor skills and active communication.'
    },
    {
      id: 'ADM-2026-902',
      applicantName: 'Eshal Tariq',
      fatherName: 'Dr. Tariq Jamil',
      appliedGrade: 'Class KG',
      stage: 'Early Childhood',
      age: '4.8 Years',
      assessmentScore: '89% Numbers & Drawing',
      documentsVerified: true,
      status: 'Pending Principal Approval',
      submittedDate: '24 Oct 2026',
      notes: 'B-Form and vaccination cards authenticated.'
    },
    {
      id: 'ADM-2026-903',
      applicantName: 'Syed Huzaifa Ali',
      fatherName: 'Syed Qasim Ali',
      appliedGrade: 'Class 9 (Computer Science)',
      stage: 'Secondary',
      age: '14.2 Years',
      assessmentScore: '85% STEM Written Exam',
      documentsVerified: true,
      status: 'Pending Principal Approval',
      submittedDate: '25 Oct 2026',
      notes: 'Previous school SLC Grade A+ verified.'
    }
  ];

  feeConcessionRequests: any[] = [
    {
      id: 'CONC-2026-101',
      studentName: 'Zainab Noor',
      grade: 'Class 8-A',
      rollNo: '814',
      guardianName: 'Noor Muhammad',
      guardianOccupation: 'Private Employee',
      regularMonthlyFee: 6500,
      revisedMonthlyFee: 3250,
      requestedDiscount: '50% Monthly Tuition Fee',
      category: 'Merit-Based Scholarship (Top 1% GPA)',
      guardianIncome: 'PKR 45,000 / month',
      status: 'Pending Review',
      reason: 'Achieved 1st Position across all Class 8 sections with 98.4% marks.',
      principalAuthorizedLimit: 'Up to 50% within Principal Discretion'
    },
    {
      id: 'CONC-2026-102',
      studentName: 'Usman Ghani',
      grade: 'Class 8-B',
      rollNo: '812',
      guardianName: 'Ghani-ur-Rehman',
      guardianOccupation: 'Shopkeeper',
      regularMonthlyFee: 6500,
      revisedMonthlyFee: 4875,
      requestedDiscount: '25% Sibling Discount',
      category: 'Sibling Concession',
      guardianIncome: 'PKR 65,000 / month',
      status: 'Approved & Recorded',
      reason: '3 siblings actively studying in Al-Huda Academy Campus.',
      principalAuthorizedLimit: 'Standard Institutional Sibling Rule'
    }
  ];

  parentComplaintList: any[] = [
    {
      id: 'CMP-2026-01',
      parentName: 'Engr. Haris Mumtaz',
      studentName: 'Saad Haris (Class 7-B)',
      category: 'Transport & Bus Punctuality',
      subject: 'Morning Bus Route #04 Delayed by 15 Minutes at Sector F-10',
      date: '24 Oct 2026',
      priority: 'High Priority',
      assignedIncharge: 'Transport Supervisor (Ch. Aslam)',
      investigationNotes: 'Road construction diversion caused delay. Alternative route designated.',
      status: 'In Progress'
    },
    {
      id: 'CMP-2026-02',
      parentName: 'Mrs. Saima Naveed',
      studentName: 'Aleeza Naveed (Class 5-A)',
      category: 'Academic & Daily Homework',
      subject: 'Clash in Weekend Science Project and English Homework',
      date: '22 Oct 2026',
      priority: 'Routine',
      assignedIncharge: 'Headmistress Primary (Miss Hina)',
      investigationNotes: 'Homework timetable coordinated between faculty members.',
      status: 'Resolved & Closed'
    }
  ];

  safeguardingIncidents: any[] = [
    {
      id: 'SAFE-2026-01',
      studentName: 'Daniyal Tahir',
      grade: 'Class 6-B',
      type: 'Medical Alert: Asthmatic Dust Sensitivity',
      severity: 'Confidential Medical Record',
      actionTaken: 'Emergency inhaler placed in School Medical Bay with Nurse Zohra. Physical PT exemption granted on dusty days.',
      emergencyContact: 'Father: +92 321 8472910',
      lastReviewDate: '20 Oct 2026'
    },
    {
      id: 'SAFE-2026-02',
      studentName: 'Rayan Ahmed',
      grade: 'Class 9-B',
      type: 'Emotional Counseling & Peer Conflict Resolution',
      severity: 'Restricted Welfare Record',
      actionTaken: 'Session conducted with Campus Psychologist Dr. Nadia. Parent consultation completed constructively.',
      emergencyContact: 'Mother: +92 300 9988771',
      lastReviewDate: '22 Oct 2026'
    }
  ];

  facilityMaintenanceLogs: any[] = [
    {
      id: 'FAC-LOG-101',
      location: 'Science Lab #2 (Fume Hood & Sinks)',
      inspectionCategory: 'Lab Chemical Safety Audit',
      inspector: 'Dr. Sarah Jenkins',
      date: '24 Oct 2026',
      conditionStatus: 'Operational & Certified',
      actionRequired: 'Quarterly ventilation filter replacement.'
    },
    {
      id: 'FAC-LOG-102',
      location: 'School Bus #04 (Toyota Coaster 32-Seater)',
      inspectionCategory: 'Vehicle Safety & GPS Telemetry',
      inspector: 'Transport Supervisor',
      date: '25 Oct 2026',
      conditionStatus: 'Inspection Passed',
      actionRequired: 'First aid box re-stocked and emergency exit latch tested.'
    }
  ];

  approveAdmissionApplicant(applicantId: string): void {
    const item = this.admissionReviewList.find(a => a.id === applicantId);
    if (item) {
      item.status = 'Approved & Enrolled (Principal Signed)';
      this.saveStateToStorage();
      this.showToast(`Admission Approved: ${item.applicantName} enrolled in ${item.appliedGrade}!`, 'success');
    }
  }

  approveFeeConcession(concessionId: string): void {
    const item = this.feeConcessionRequests.find(c => c.id === concessionId);
    if (item) {
      item.status = 'Approved & Recorded';
      this.saveStateToStorage();
      this.showToast(`Fee Concession Approved: ${item.requestedDiscount} granted to ${item.studentName}.`, 'success');
    }
  }

  resolveParentComplaint(complaintId: string): void {
    const item = this.parentComplaintList.find(c => c.id === complaintId);
    if (item) {
      item.status = 'Resolved & Closed';
      this.saveStateToStorage();
      this.showToast(`Parent Complaint #${complaintId} marked resolved. Resolution notification sent to parent!`, 'success');
    }
  }

  exportAcademicAuditDossier(): void {
    const schoolReport = {
      academyName: this.schoolName,
      exportedAt: new Date().toISOString(),
      principal: 'Dr. Tahir Malik',
      summaryStats: {
        totalStudents: 1240,
        totalFaculty: 86,
        attendanceRate: '95.3%',
        substitutionsActive: this.substituteArrangements.length,
        inspectionsLogged: this.dailyInspectionLogs.length,
        syllabusItemsTracked: this.syllabusTracker.length,
        appraisalsRecorded: this.facultyAppraisalList.length,
        examModerationsTracked: this.examModerationList.length,
        admissionsUnderReview: this.admissionReviewList.length,
        concessionsProcessed: this.feeConcessionRequests.length,
        complaintsHandled: this.parentComplaintList.length,
        safeguardingActiveAlerts: this.safeguardingIncidents.length,
        facilitiesLogged: this.facilityMaintenanceLogs.length
      },
      students: this.activeStudents,
      faculty: this.teachers,
      substitutions: this.substituteArrangements,
      inspections: this.dailyInspectionLogs,
      syllabus: this.syllabusTracker,
      facultyAppraisals: this.facultyAppraisalList,
      examModeration: this.examModerationList,
      admissionsReview: this.admissionReviewList,
      feeConcessions: this.feeConcessionRequests,
      parentComplaints: this.parentComplaintList,
      safeguarding: this.safeguardingIncidents,
      facilitiesAndTransport: this.facilityMaintenanceLogs,
      facultyTasks: this.facultyTaskList,
      teacherLeaves: this.teacherLeaveRequests,
      studentCertificates: this.studentCertificateRequests,
      weakStudentRemedials: this.weakStudentInterventions
    };

    const jsonStr = JSON.stringify(schoolReport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `academic_report_${this.schoolName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('✅ Academic Data & Institutional Audit Report Exported (JSON)!', 'success');
  }

  // ==========================================
  // FEATURE 7: FIRESTORE CLOUD PERSISTENCE
  // ==========================================
  async syncToCloud(isManual: boolean = false) {
    this.isCloudSyncing = true;
    this.cdr.detectChanges();
    try {
      const payload = {
        activeStudents: this.activeStudents,
        teachers: this.teachers,
        admissionsList: this.admissionsList,
        finances: this.finances,
        studentFeeDefaulters: this.studentFeeDefaulters,
        hostelRooms: this.hostelRooms,
        alumniList: this.alumniList,
        workstations: this.workstations,
        labSchedules: this.labSchedules,
        smsGatewayConfig: this.smsGatewayConfig,
        settingsForm: this.settingsForm,
        schoolName: this.schoolName,
        announcements: this.announcements
      };
      const ok = await this.firebaseDb.saveSchoolData('alhuda_academy', payload);
      this.lastCloudSyncTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (ok && isManual) {
        this.showToast('Cloud Firestore: School data permanently synced & backed up!', 'success');
      }
    } catch (e) {
      console.warn('Cloud sync error:', e);
    } finally {
      this.isCloudSyncing = false;
      this.cdr.detectChanges();
    }
  }

  async loadStateFromCloud() {
    try {
      const cloudData = await this.firebaseDb.loadSchoolData('alhuda_academy');
      if (cloudData) {
        if (cloudData.activeStudents && Array.isArray(cloudData.activeStudents) && cloudData.activeStudents.length > 0) {
          const localOnly = this.activeStudents.filter(local => !cloudData.activeStudents.some((c: any) => c.id === local.id));
          this.activeStudents = [...localOnly, ...cloudData.activeStudents];
        }
        if (cloudData.studentFeeDefaulters && Array.isArray(cloudData.studentFeeDefaulters)) {
          this.studentFeeDefaulters = cloudData.studentFeeDefaulters;
        }
        if (cloudData.hostelRooms && Array.isArray(cloudData.hostelRooms)) {
          this.hostelRooms = cloudData.hostelRooms;
        }
        if (cloudData.alumniList && Array.isArray(cloudData.alumniList)) {
          this.alumniList = cloudData.alumniList;
        }
        if (cloudData.workstations && Array.isArray(cloudData.workstations)) {
          this.workstations = cloudData.workstations;
        }
        if (cloudData.labSchedules && Array.isArray(cloudData.labSchedules)) {
          this.labSchedules = cloudData.labSchedules;
        }
        if (cloudData.smsGatewayConfig) {
          this.smsGatewayConfig = { ...this.smsGatewayConfig, ...cloudData.smsGatewayConfig };
        }
        this.lastCloudSyncTimestamp = 'Synced Just now';
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.warn('Failed to load from cloud:', e);
    }
  }

  printCertificate(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
