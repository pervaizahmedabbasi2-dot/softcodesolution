import { Injectable, computed, inject, signal } from '@angular/core';
import { BackendService } from '../../../services/backend.service';
import {
  DEFAULT_SCHOOL_PRINT_BRANDING,
  SchoolPrintBrandingConfig,
  SchoolPrintDocumentType,
  normalizeSchoolPrintBranding,
  resolveEffectiveTableBranding
} from '../utils/school-print-templates.util';
import { StatementDataset } from '../utils/school-statement-print.util';
import {
  PdfBrandingOptions,
  PdfGenericCardEntry,
  downloadStudentsTablePdf,
  downloadTableCardsPdf
} from './school-pdf-export.util';

export type SchoolTablePortalRole = 'owner' | 'principal' | 'teacher' | 'student' | 'parent' | 'accountant';
export type CustomColumnType = 'text' | 'number' | 'date' | 'badge' | 'select';

export interface SchoolCustomColumn {
  id: string;
  label: string;
  type: CustomColumnType;
  defaultValue: string;
  options?: string[];
  required?: boolean;
  insertAfterColumn?: string;
  insertAfterFormField?: string;
  scope?: 'table' | 'form' | 'both';
}

export interface SchoolCustomRow {
  rowKey: string;
  rowLabel?: string;
  insertAfterRowKey?: string;
  values: Record<string, string>;
  submittedByName?: string;
  submittedByRole?: string;
  createdAt?: string;
}

export interface DetectedTableRow {
  rowKey: string;
  label: string;
  isCustom?: boolean;
}

export interface FormFieldAnchorOption {
  key: string;
  label: string;
}

export interface TableColumnPositionOption {
  value: string;
  label: string;
}

export type OrderedTableColumn =
  | { kind: 'builtin'; header: DetectedBuiltInHeader; displayLabel: string; hidden: boolean }
  | { kind: 'custom'; col: SchoolCustomColumn };

export interface SchoolCellMeta {
  submittedByName?: string;
  submittedByRole?: string;
  updatedAt?: string;
}

export interface FormManageableField {
  value: string;
  key: string;
  label: string;
  kind: 'builtin' | 'custom';
}

export interface TableManageableColumn {
  value: string;
  key: string;
  label: string;
  originalLabel: string;
  index?: number;
  kind: 'builtin' | 'custom';
}

export interface HiddenTableColumnOption {
  index: number;
  originalLabel: string;
  displayLabel: string;
}

export interface SchoolConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export interface SchoolTableSchema {
  tableId: string;
  customTitle?: string;
  hiddenColumns: number[];
  hiddenColumnLabels: string[];
  hiddenFormFields?: string[];
  renamedHeaders: Record<number, string>;
  renamedHeadersByLabel: Record<string, string>;
  customColumns: SchoolCustomColumn[];
  customRows: SchoolCustomRow[];
  customCells: Record<string, Record<string, string>>;
  cellMeta?: Record<string, Record<string, SchoolCellMeta>>;
}

export interface DetectedBuiltInHeader {
  index: number;
  originalLabel: string;
}

export interface ColumnManagerState {
  open: boolean;
  tableId: string;
  tableTitle: string;
  detectedHeaders: DetectedBuiltInHeader[];
  initialTab?: 'columns' | 'rows' | 'reset';
}

export interface RowFormModalState {
  open: boolean;
  tableId: string;
  tableTitle: string;
  detectedHeaders: DetectedBuiltInHeader[];
}

export interface CellEditorState {
  open: boolean;
  tableId: string;
  tableTitle: string;
  rowKey: string;
  rowLabel: string;
  colId: string;
  colLabel: string;
  colType: CustomColumnType;
  colOptions?: string[];
  value: string;
}

export interface TableCatalogItem {
  tableId: string;
  canonicalId: string;
  title: string;
  portals: string;
  defaultHeaders: string[];
}

export interface StatementModalState {
  open: boolean;
  tableId: string;
  title: string;
  presetFromDate?: string;
  presetToDate?: string;
  presetSearch?: string;
  initialFormat?: 'a4' | '80mm' | '58mm' | 'card' | 'whatsapp';
  directDataset?: StatementDataset | null;
}

const STORAGE_KEY_BASE = 'scs_school_table_schemas_v1';

export const SCHOOL_TABLE_FAMILY_MAP: Record<string, string> = {
  // Students master
  owner_students_roster: 'students_master',
  owner_overview_students: 'students_master',
  owner_stage_wise: 'students_master',
  principal_master_students: 'students_master',
  principal_stage_wise: 'students_master',
  // Teachers master
  owner_teachers_faculty: 'teachers_master',
  owner_overview_teachers: 'teachers_master',
  principal_master_teachers: 'teachers_master',
  // Parents directory
  owner_overview_parents: 'parents_master',
  owner_parents_directory: 'parents_master',
  principal_master_parents: 'parents_master',
  // Fee receipts & cashiering
  owner_overview_fee_cashiering: 'fee_receipts_cashiering',
  owner_overview_recent_payments: 'fee_receipts_cashiering',
  owner_payment_gateway: 'fee_receipts_cashiering',
  principal_master_cashiering: 'fee_receipts_cashiering',
  accountant_recent_receipts: 'fee_receipts_cashiering',
  accountant_posted_receipts: 'fee_receipts_cashiering',
  // Online payment verification & student/parent payment history
  owner_gateway_pending_slips: 'online_payment_slips',
  accountant_pending_slips: 'online_payment_slips',
  parent_payment_history: 'student_payment_history',
  // Fee defaulters
  owner_fee_defaulters: 'fee_defaulters',
  owner_overview_defaulters: 'fee_defaulters',
  accountant_defaulters: 'fee_defaulters',
  // Challans & invoices
  owner_invoices: 'fee_challans_invoices',
  accountant_challans: 'fee_challans_invoices',
  // Petty cash vouchers
  owner_petty_vouchers: 'petty_vouchers',
  accountant_petty_vouchers: 'petty_vouchers',
  // Daily closing & reconciliation
  owner_daily_closing: 'daily_closing_reconciliation',
  owner_audit_reconciliation: 'daily_closing_reconciliation',
  accountant_closings: 'daily_closing_reconciliation',
  // Campus notices & feed
  owner_feed_table: 'campus_notices_feed',
  teacher_feed_table: 'campus_notices_feed',
  student_feed_table: 'campus_notices_feed',
  parent_feed_table: 'campus_notices_feed',
  // Events calendar
  owner_events: 'events_calendar',
  teacher_events: 'events_calendar',
  student_events: 'events_calendar',
  parent_events: 'events_calendar',
  // Homework
  teacher_homework: 'owner_homework_log',
  student_homework: 'owner_homework_log',
  parent_homework: 'owner_homework_log',
  // SLC
  owner_audit_slc: 'slc_certificates',
  principal_slc: 'slc_certificates',
  // Library circulation
  owner_library_circulation: 'library_circulation',
  principal_library_circulation: 'library_circulation',
  student_library_loans: 'library_circulation',
  parent_library_loans: 'library_circulation',
  // Academics & gradebook
  owner_marks_entry: 'academics_gradebook_results',
  owner_class_results: 'academics_gradebook_results',
  teacher_gradebook: 'academics_gradebook_results',
  student_academics: 'academics_gradebook_results',
  parent_academics: 'academics_gradebook_results',
  // Attendance & gate logs
  student_attendance_log: 'attendance_gate_logs',
  parent_gate_logs: 'attendance_gate_logs',
  attendance_history_daily_log: 'attendance_gate_logs',
  attendance_history_monthly: 'attendance_period_summary',
  attendance_history_yearly: 'attendance_yearly_summary',
  attendance_history_members: 'attendance_member_matrix'
};

export const SCHOOL_TABLE_CATALOG: TableCatalogItem[] = [
  {
    tableId: 'students_master',
    canonicalId: 'students_master',
    title: 'Students Master Directory',
    portals: 'Owner, Principal',
    defaultHeaders: [
      'Roll #', 'Student ID', 'Student Name', 'Gender', 'Date of Birth', 'B-Form / CNIC', 'Blood Group',
      'Class / Grade', 'Section', 'Previous School', 'Merit Score',
      'Father / Guardian', 'Relation', 'Guardian CNIC', 'Mobile & WhatsApp', 'Guardian Email',
      'Occupation', 'Residential Address', 'Emergency Contact',
      'Admission Fee', 'Monthly Tuition', 'Concession %', 'Due Bakaya', 'Fee Status',
      'Attendance', 'Medical Notes', 'Admission Date'
    ]
  },
  {
    tableId: 'owner_admissions',
    canonicalId: 'owner_admissions',
    title: 'Admissions & Enrollment Applications',
    portals: 'Owner, Principal',
    defaultHeaders: [
      'Ref ID', 'Date', 'Roll #', 'Student Name', 'Gender', 'Date of Birth', 'B-Form / CNIC', 'Blood Group',
      'Class / Grade', 'Section', 'Previous School', 'Merit Score',
      'Father / Guardian', 'Relation', 'Guardian CNIC', 'Mobile & WhatsApp', 'Guardian Email',
      'Occupation', 'Residential Address', 'Emergency Contact',
      'Admission Fee', 'Monthly Tuition', 'Concession %', 'Fee Status', 'Source', 'Medical Notes', 'Status'
    ]
  },
  {
    tableId: 'teachers_master',
    canonicalId: 'teachers_master',
    title: 'Teachers & Faculty Directory',
    portals: 'Owner, Principal',
    defaultHeaders: [
      'Faculty Member', 'Gender', 'CNIC', 'Phone', 'Email', 'Address', 'Emergency Contact',
      'Qualification', 'Previous Institute', 'Experience', 'Designation / Role', 'Subjects / Dept',
      'Assigned Grade', 'In-Charge Class', 'Weekly Periods', 'Contract Type', 'Salary', 'Bank & IBAN', 'Status'
    ]
  },
  {
    tableId: 'owner_portal_users',
    canonicalId: 'owner_portal_users',
    title: 'Role Portals & RBAC Users',
    portals: 'Owner',
    defaultHeaders: [
      'Full Name', 'Role', 'Staff / Roll ID', 'Designation', 'Department', 'Clearance Level',
      'Branch', 'Email / Login', 'Phone', 'Linked Scope', 'Access PIN', 'Status'
    ]
  },
  {
    tableId: 'parents_master',
    canonicalId: 'parents_master',
    title: 'Parents & Guardians Directory',
    portals: 'Owner, Principal',
    defaultHeaders: ['Guardian Name', 'Phone', 'Children', 'CNIC', 'Fee Standing']
  },
  {
    tableId: 'fee_receipts_cashiering',
    canonicalId: 'fee_receipts_cashiering',
    title: 'Fee Cashiering & Receipts Ledger',
    portals: 'Owner, Principal, Accountant',
    defaultHeaders: ['Receipt #', 'Student', 'Channel & Ref', 'Desk', 'Amount']
  },
  {
    tableId: 'owner_finance_ledger',
    canonicalId: 'owner_finance_ledger',
    title: 'Fees & Finance Master Ledger',
    portals: 'Owner',
    defaultHeaders: ['Challan / Ref #', 'Particulars', 'Category', 'Entry Type', 'Amount (PKR)', 'Date', 'Status']
  },
  {
    tableId: 'fee_defaulters',
    canonicalId: 'fee_defaulters',
    title: 'Fee Defaulters (Bakaya) Register',
    portals: 'Owner, Accountant',
    defaultHeaders: ['Student & Roll #', 'Guardian Contact', 'Unpaid Months', 'Remaining Bakaya']
  },
  {
    tableId: 'fee_challans_invoices',
    canonicalId: 'fee_challans_invoices',
    title: 'Master Invoices & Fee Challans',
    portals: 'Owner, Accountant',
    defaultHeaders: ['Invoice #', 'Type', 'Recipient', 'Role', 'Title & Line Items', 'Issue / Due Date', 'Gross', 'Discount', 'Tax', 'Net Total', 'Status']
  },
  {
    tableId: 'petty_vouchers',
    canonicalId: 'petty_vouchers',
    title: 'Counter Petty Cash Vouchers',
    portals: 'Owner, Accountant',
    defaultHeaders: ['Voucher #', 'Category', 'Description & Payee', 'Amount']
  },
  {
    tableId: 'daily_closing_reconciliation',
    canonicalId: 'daily_closing_reconciliation',
    title: 'Daily Rooznama & Cash Reconciliation',
    portals: 'Owner, Accountant',
    defaultHeaders: ['Closing Date', 'Counter Cash', 'Meezan Bank', 'HBL Branch', 'KuickPay Digital', 'Total Collected', 'System Billed', 'Variance', 'Notes', 'Owner Status']
  },
  {
    tableId: 'campus_notices_feed',
    canonicalId: 'campus_notices_feed',
    title: 'Campus Notices & Circulars Feed',
    portals: 'Owner, Teacher, Student, Parent',
    defaultHeaders: ['Title / Circular', 'Author', 'Target Class', 'Priority', 'Date']
  },
  {
    tableId: 'events_calendar',
    canonicalId: 'events_calendar',
    title: 'Events & Campus Calendar',
    portals: 'Owner, Teacher, Student, Parent',
    defaultHeaders: ['Event Title', 'Category', 'Date', 'Time', 'Venue', 'Chief Guest', 'Organizer', 'Coordinator', 'Budget (PKR)', 'Status', 'Description']
  },
  {
    tableId: 'principal_lesson_plans',
    canonicalId: 'principal_lesson_plans',
    title: 'Faculty Lesson Plans Register',
    portals: 'Principal, Teacher (View/Submit)',
    defaultHeaders: ['Teacher', 'Grade & Subject', 'Topic', 'Status']
  },
  {
    tableId: 'principal_substitutions',
    canonicalId: 'principal_substitutions',
    title: 'Substitute Period Arrangements',
    portals: 'Principal, Teacher',
    defaultHeaders: ['Ref #', 'Date', 'Absent Faculty', 'Assigned Substitute', 'Class & Subject', 'Period & Room', 'Status']
  },
  {
    tableId: 'principal_inspections',
    canonicalId: 'principal_inspections',
    title: 'Campus & Classroom Inspection Rounds',
    portals: 'Principal',
    defaultHeaders: ['Log #', 'Time', 'Campus Location', 'Uniform & Cleanliness', 'Teacher Punctuality', 'Notes & Action Items']
  },
  {
    tableId: 'principal_appraisals',
    canonicalId: 'principal_appraisals',
    title: 'Faculty Performance Appraisals',
    portals: 'Principal',
    defaultHeaders: ['Appraisal #', 'Faculty Member', 'Subject & Dept', 'Observation Score', 'Punctuality & Compliance', 'Observation Remarks', 'Status']
  },
  {
    tableId: 'principal_faculty_tasks',
    canonicalId: 'principal_faculty_tasks',
    title: 'Faculty Task Delegation & Duty Roster',
    portals: 'Principal',
    defaultHeaders: ['Task #', 'Assigned Faculty', 'Duty Title & Scope', 'Priority', 'Target Date', 'Status', 'Principal Verification']
  },
  {
    tableId: 'academics_gradebook_results',
    canonicalId: 'academics_gradebook_results',
    title: 'Gradebook Marks & Academic Results',
    portals: 'Owner, Teacher, Student, Parent',
    defaultHeaders: ['Student / Roll #', 'Subject', 'Obtained / Total', 'Grade']
  },
  {
    tableId: 'owner_library_catalog',
    canonicalId: 'owner_library_catalog',
    title: 'Library Book Catalog',
    portals: 'Owner',
    defaultHeaders: ['ISBN', 'Book Title & Author', 'Category / Genre', 'Grade Level', 'Rack Location', 'Copies (Avail / Total)']
  },
  {
    tableId: 'library_circulation',
    canonicalId: 'library_circulation',
    title: 'Library Book Circulation & Loans',
    portals: 'Owner, Student',
    defaultHeaders: ['Issue #', 'Book Title', 'ISBN', 'Borrower', 'Class / Dept', 'Due Date', 'Fine', 'Status']
  },
  {
    tableId: 'slc_certificates',
    canonicalId: 'slc_certificates',
    title: 'Student Leaving Certificates (SLC)',
    portals: 'Owner, Principal',
    defaultHeaders: ['Certificate No.', 'Student Name', 'Class', 'Admission Date', 'Leaving Date', 'Reason for Leaving', 'Conduct & Standing', 'Achievement', 'Clearance (4-Way)', 'Status']
  },
  {
    tableId: 'attendance_gate_logs',
    canonicalId: 'attendance_gate_logs',
    title: 'Gate & Biometric Attendance Logs',
    portals: 'Owner, Principal, Teacher, Student, Parent',
    defaultHeaders: ['Date', 'Time', 'Member', 'Status', 'Gate']
  },
  {
    tableId: 'attendance_period_summary',
    canonicalId: 'attendance_period_summary',
    title: 'Monthly & 6-Month Attendance Summary',
    portals: 'Owner, Principal, Teacher, Student, Parent',
    defaultHeaders: ['Month & Year', 'Working Days', 'Present', 'Late', 'Absent', 'Approved Leaves', 'Avg Check-In', 'Rate %', 'Standing']
  },
  {
    tableId: 'attendance_yearly_summary',
    canonicalId: 'attendance_yearly_summary',
    title: 'Multi-Year Attendance History (Min / Max / Total)',
    portals: 'Owner, Principal, Teacher, Student, Parent',
    defaultHeaders: ['Academic Year', 'Working Days', 'Present', 'Late', 'Absent', 'Approved Leaves', 'Peak Month (Max)', 'Lowest Month (Min)', 'Overall Rate %']
  },
  {
    tableId: 'attendance_member_matrix',
    canonicalId: 'attendance_member_matrix',
    title: 'Campus Role-Scoped Attendance Matrix',
    portals: 'Owner, Principal, Teacher',
    defaultHeaders: ['ID / Roll', 'Member Details', 'Role / Class', 'Total %', '6-Month %', 'Min Period', 'Max Period', 'Attended / Days', 'Actions']
  },
  {
    tableId: 'attendance_roster_staff',
    canonicalId: 'attendance_roster_staff',
    title: 'Campus Staff Attendance Roster',
    portals: 'Owner, Principal',
    defaultHeaders: ['ID / Roll', 'Member Details', 'Father / Guardian', 'CNIC / B-Form', 'Gender', 'Role / Dept', 'Mobile / Phone', 'Status']
  },
  {
    tableId: 'attendance_roster_principals',
    canonicalId: 'attendance_roster_principals',
    title: 'Principals & Directorate Roster',
    portals: 'Owner, Principal',
    defaultHeaders: ['ID / Roll', 'Member Details', 'Father / Guardian', 'CNIC / B-Form', 'Gender', 'Role / Dept', 'Mobile / Phone', 'Status']
  },
  {
    tableId: 'owner_expenses',
    canonicalId: 'owner_expenses',
    title: 'School Expenses & Vendor Bills',
    portals: 'Owner',
    defaultHeaders: ['Voucher / Ref', 'Category', 'Vendor / Payee', 'Description', 'Amount', 'Status']
  },
  {
    tableId: 'owner_medical',
    canonicalId: 'owner_medical',
    title: 'Student Health & Medical Records',
    portals: 'Owner',
    defaultHeaders: ['Roll #', 'Student', 'Blood Group', 'Vaccination', 'Allergies', 'Chronic Conditions', 'Emergency', 'Physician']
  },
  {
    tableId: 'owner_discipline',
    canonicalId: 'owner_discipline',
    title: 'Disciplinary & Conduct Incident Log',
    portals: 'Owner',
    defaultHeaders: ['Student', 'Category', 'Severity', 'Description', 'Action Taken', 'Fine', 'Status']
  },
  {
    tableId: 'owner_payroll',
    canonicalId: 'owner_payroll',
    title: 'Staff Payroll Register',
    portals: 'Owner',
    defaultHeaders: ['Staff Member', 'Month', 'Base Salary', 'Allowances', 'Deductions', 'Net Payable', 'Payment Method', 'Disbursed Date', 'Status']
  },
  {
    tableId: 'owner_staff_leaves',
    canonicalId: 'owner_staff_leaves',
    title: 'Staff Leave Applications',
    portals: 'Owner',
    defaultHeaders: ['Staff Member', 'Leave Type', 'Dates', 'Days', 'Reason', 'Status']
  },
  {
    tableId: 'owner_exams',
    canonicalId: 'owner_exams',
    title: 'Examinations & Datesheets',
    portals: 'Owner',
    defaultHeaders: ['Exam Title', 'Class', 'Start Date', 'Average GPA', 'Status']
  },
  {
    tableId: 'owner_subjects',
    canonicalId: 'owner_subjects',
    title: 'Subject Catalog & Class Map',
    portals: 'Owner',
    defaultHeaders: ['Subject Code', 'Subject Name', 'Assigned Class', 'Subject Type', 'Weekly Periods', 'Lead Teacher', 'Total / Passing Marks']
  },
  {
    tableId: 'owner_timetable',
    canonicalId: 'owner_timetable',
    title: 'Class Timetable Roster',
    portals: 'Owner',
    defaultHeaders: ['Period & Time', 'Class', 'Subject', 'Faculty Teacher', 'Classroom / Lab']
  },
  {
    tableId: 'owner_labs_schedule',
    canonicalId: 'owner_labs_schedule',
    title: 'Practical Lab Schedule',
    portals: 'Owner',
    defaultHeaders: ['Day & Period', 'Laboratory', 'Class', 'Subject', 'Practical Experiment Topic', 'Supervising Teacher']
  },
  {
    tableId: 'owner_transport',
    canonicalId: 'owner_transport',
    title: 'School Bus & Transport Fleet',
    portals: 'Owner',
    defaultHeaders: ['Route Name', 'Vehicle #', 'Driver Name', 'Driver Phone', 'Monthly Fee', 'Capacity', 'Enrolled', 'Status']
  },
  {
    tableId: 'owner_hostel',
    canonicalId: 'owner_hostel',
    title: 'Hostel & Boarding Rooms',
    portals: 'Owner',
    defaultHeaders: ['Room #', 'Floor / Wing', 'Capacity', 'Occupied', 'Warden', 'Warden Phone', 'Mess Fee (PKR)', 'Residents', 'Status']
  },
  {
    tableId: 'owner_alumni',
    canonicalId: 'owner_alumni',
    title: 'Alumni & Graduate Archive',
    portals: 'Owner',
    defaultHeaders: ['Roll #', 'Graduate Name', 'Batch Year', 'Matric Class', 'SLC #', 'Institute / Career', 'Phone', 'Email', 'Achievements', 'GPA']
  },
  {
    tableId: 'owner_visitors',
    canonicalId: 'owner_visitors',
    title: 'Visitor Security & Gate Passes',
    portals: 'Owner',
    defaultHeaders: ['Pass #', 'Visitor Name', 'CNIC / Phone', 'Purpose', 'Host / Whom to Meet', 'Badge #', 'Vehicle #', 'Check-In / Out', 'Status']
  },
  {
    tableId: 'owner_assets',
    canonicalId: 'owner_assets',
    title: 'Campus Assets & Inventory Ledger',
    portals: 'Owner',
    defaultHeaders: ['Asset Code', 'Asset Name', 'Category', 'Location / Room', 'Qty', 'Unit Value (PKR)', 'Custodian', 'Last Serviced', 'Condition']
  },
  {
    tableId: 'owner_audit_waivers',
    canonicalId: 'owner_audit_waivers',
    title: 'Concession & Hardship Waivers',
    portals: 'Owner',
    defaultHeaders: ['Student Name', 'Class', 'Category', 'Original Fee', 'Concession % / Net', 'Reason / Justification', 'Authorizing Body', 'Approval Date']
  },
  {
    tableId: 'owner_audit_compliance',
    canonicalId: 'owner_audit_compliance',
    title: 'Regulatory & Compliance Audits',
    portals: 'Owner',
    defaultHeaders: ['Audit Area', 'Title & Standard', 'Regulatory Standard', 'Compliance Status', 'Responsible Officer', 'Last Checked', 'Next Renewal', 'Audit Inspector Notes']
  },
  {
    tableId: 'owner_homework_log',
    canonicalId: 'owner_homework_log',
    title: 'Teacher & Student Homework Register',
    portals: 'Teacher, Student, Parent',
    defaultHeaders: [
      'Title & Type',
      'Subject',
      'Topic / Chapter',
      'Class & Section',
      'Teacher',
      'Assigned Date',
      'Due Date & Time',
      'Submission Mode',
      'Max Marks',
      'Files & Links',
      'Status'
    ]
  },
  {
    tableId: 'owner_student_leaves',
    canonicalId: 'owner_student_leaves',
    title: 'Parent Student Leave Requests',
    portals: 'Owner, Principal, Parent',
    defaultHeaders: ['Child', 'From', 'To', 'Reason', 'Status']
  },
  {
    tableId: 'owner_fee_structure_catalog',
    canonicalId: 'owner_fee_structure_catalog',
    title: 'Campus & Wing Fee Structure Catalog',
    portals: 'Owner, Principal',
    defaultHeaders: ['CAMPUS & WING', 'CLASS / GRADE TIER', 'ADMISSION', 'TUITION (MO)', 'LAB', 'EXAM', 'TOTAL MO.']
  },
  {
    tableId: 'owner_fee_deletion_audit',
    canonicalId: 'owner_fee_deletion_audit',
    title: 'Fee Deletion & Void Receipts Register',
    portals: 'Owner',
    defaultHeaders: ['RECEIPT #', 'STUDENT & CLASS', 'VOID REASON', 'DELETED BY', 'AMOUNT']
  },
  {
    tableId: 'owner_notice_read_receipts',
    canonicalId: 'owner_notice_read_receipts',
    title: 'Circular & Notice Reader Audit',
    portals: 'Owner, Principal',
    defaultHeaders: ['Reader Identity', 'Role & Role Badge', 'Class / Designation', 'Read Timestamp', 'Audit Status']
  },
  {
    tableId: 'attendance_roster_students',
    canonicalId: 'attendance_roster_students',
    title: 'Student Attendance & Identity Roster',
    portals: 'Owner, Principal, Teacher',
    defaultHeaders: ['ID / Roll', 'Member Details', 'Class / Section', 'Father / Guardian', 'CNIC / B-Form', 'Mobile / Phone', 'Check-In / Out', 'Status']
  },
  {
    tableId: 'attendance_roster_teachers',
    canonicalId: 'attendance_roster_teachers',
    title: 'Faculty Attendance & Identity Roster',
    portals: 'Owner, Principal',
    defaultHeaders: ['ID / Code', 'Faculty Member', 'Role / Dept', 'CNIC / B-Form', 'Mobile / Phone', 'Check-In / Out', 'Late Status', 'Status']
  },
  {
    tableId: 'attendance_marked_details',
    canonicalId: 'attendance_marked_details',
    title: 'Marked Attendance Verification Details',
    portals: 'Owner, Principal, Teacher',
    defaultHeaders: ['Date', 'ID / Roll', 'Member & Face', 'Category', 'Class / Dept', 'Father / Guardian', 'Phone', 'Check-In (IN)', 'Check-Out (OUT)', 'Verification', 'Status']
  },
  {
    tableId: 'owner_overview_branch_comparison',
    canonicalId: 'owner_overview_branch_comparison',
    title: 'Multi-Campus Branch Overview',
    portals: 'Owner',
    defaultHeaders: ['Campus Branch', 'Campus Principal', 'Wings', 'Students', 'Total Staff', 'Revenue (PKR)', 'Expenses (PKR)', 'Pending Dues', 'Pending Closings']
  },
  {
    tableId: 'owner_campus_directory_summary',
    canonicalId: 'owner_campus_directory_summary',
    title: 'Campus Directory Summary',
    portals: 'Owner',
    defaultHeaders: ['Campus Role / Group', 'Total Registered', 'Active / Present / Clear', 'Remaining / Away / Dues']
  },
  {
    tableId: 'owner_branch_financial_matrix',
    canonicalId: 'owner_branch_financial_matrix',
    title: 'Branch-Wise Financial & Closing Report',
    portals: 'Owner',
    defaultHeaders: ['Branch', 'Students', 'Revenue', 'Pending Dues', 'Closings']
  },
  {
    tableId: 'owner_wing_breakdown',
    canonicalId: 'owner_wing_breakdown',
    title: 'Academic Wing Breakdown',
    portals: 'Owner',
    defaultHeaders: ['Wing & Campus', 'Coordinator', 'Students', 'Faculty', 'Pending Dues']
  },
  {
    tableId: 'owner_all_personnel',
    canonicalId: 'owner_all_personnel',
    title: 'Complete Campus Personnel Directory',
    portals: 'Owner',
    defaultHeaders: ['Emp Code', 'Full Name', 'Hierarchy Tier', 'Designation & Department', 'Phone & Email', 'CNIC No', 'Shift / Load', 'Monthly Salary', 'Today Status']
  },
  {
    tableId: 'owner_principals_directory',
    canonicalId: 'owner_principals_directory',
    title: 'Principals Executive Directory',
    portals: 'Owner',
    defaultHeaders: ['Emp Code', 'Principal Name', 'Designation & Department', 'CNIC', 'Phone & Email', 'Shift & Clearance', 'Portal PIN', 'Monthly Salary', 'Duty Status']
  },
  {
    tableId: 'owner_accountants_directory',
    canonicalId: 'owner_accountants_directory',
    title: 'Accountants & Fee Clerks Directory',
    portals: 'Owner',
    defaultHeaders: ['Emp Code', 'Accountant / Clerk Name', 'Role & Department', 'CNIC', 'Phone & Email', 'Counter Shift & Clearance', 'PIN', 'Monthly Salary', 'Desk Status']
  },
  {
    tableId: 'owner_support_staff_directory',
    canonicalId: 'owner_support_staff_directory',
    title: 'Campus Support & Admin Staff',
    portals: 'Owner',
    defaultHeaders: ['Emp Code', 'Staff Member Name', 'Role & Department', 'CNIC', 'Phone & Email', 'Shift', 'Monthly Salary', 'Today Status']
  },
  {
    tableId: 'owner_permission_matrix',
    canonicalId: 'owner_permission_matrix',
    title: 'Role-Based Access Control Matrix',
    portals: 'Owner',
    defaultHeaders: ['Module / Feature Name', 'Description', 'Accountant Desk', 'Teacher Portal', 'Student Portal', 'Parent Portal']
  },
  {
    tableId: 'owner_teacher_arrears',
    canonicalId: 'owner_teacher_arrears',
    title: 'Faculty Salary Arrears & Tenure',
    portals: 'Owner',
    defaultHeaders: ['Teacher Name & Subject', 'Appointment Date', 'Tenure / Service Duration', 'Status', 'Monthly Salary', 'Unpaid Months', 'Remaining Salary Arrears']
  },
  {
    tableId: 'owner_profit_loss',
    canonicalId: 'owner_profit_loss',
    title: 'Profit & Loss Ledger Khata',
    portals: 'Owner',
    defaultHeaders: ['Month & Session', 'Tuition & Admissions Income', 'Transport Income', 'Gross Income (Aamdani)', 'Salaries Expense', 'Rent & Utilities', 'Operating Expenses (Kharcha)', 'Net Margin (Nafa / Naqsan)', 'Status']
  },
  {
    tableId: 'owner_rooznama_branch_matrix',
    canonicalId: 'owner_rooznama_branch_matrix',
    title: 'Multi-Branch Rooznama Consolidation',
    portals: 'Owner',
    defaultHeaders: ['Campus Branch', 'Cash', 'Meezan', 'HBL', 'Digital', 'Petty', 'Collected', 'Variance', 'Review Queue']
  },
  {
    tableId: 'owner_alerts_log',
    canonicalId: 'owner_alerts_log',
    title: 'Dispatched WhatsApp & SMS Alerts Log',
    portals: 'Owner',
    defaultHeaders: ['Alert Ref #', 'Recipient & Phone', 'Channel', 'Message Copy', 'Sent Timestamp', 'Delivery Status']
  },
  {
    tableId: 'owner_audit_trail',
    canonicalId: 'owner_audit_trail',
    title: 'System Audit Trail Log',
    portals: 'Owner',
    defaultHeaders: ['Audit ID & Time', 'Operator', 'Action & Category', 'Target Entity', 'Audit Details', 'Severity', 'Verified By']
  },
  {
    tableId: 'online_payment_slips',
    canonicalId: 'online_payment_slips',
    title: 'Online Payment Slips Awaiting Verification',
    portals: 'Owner, Accountant',
    defaultHeaders: ['Date & TXN / Challan', 'Student & Depositor', 'PK Channel & Proof TID', 'Slip Image', 'Amount', 'Verification']
  },
  {
    tableId: 'student_payment_history',
    canonicalId: 'student_payment_history',
    title: 'Student & Ward Payment History',
    portals: 'Student, Parent',
    defaultHeaders: ['Deposit Date & TXN', 'Paid By / Depositor', 'Channel & Proof TID', 'Slip Image', 'Deposit Amount', 'Status', 'Voucher']
  },
  {
    tableId: 'qr_verification_ledger',
    canonicalId: 'qr_verification_ledger',
    title: 'Cryptographic Print Verification Ledger',
    portals: 'Owner, Principal, Teacher, Accountant',
    defaultHeaders: ['Print Ref ID', 'Document Type', 'Student / Code', 'Exact Table & Row', 'Amount', 'Generated By', 'Scans', 'Status', 'Actions']
  },
  {
    tableId: 'qr_scan_audit_logs',
    canonicalId: 'qr_scan_audit_logs',
    title: 'QR Verification Scan Audit Logs',
    portals: 'Owner, Principal, Teacher, Accountant',
    defaultHeaders: ['Scanned At', 'Verdict', 'Source', 'Scanned Code / Print Ref', 'Table & Row', 'Creator', 'Verified By', 'Verification Details']
  }
];

export const SCHOOL_FORM_FIELD_ANCHORS: Record<string, FormFieldAnchorOption[]> = {
  owner_admissions: [
    { key: 'adm_name', label: 'Student / Applicant Full Name' },
    { key: 'adm_gender', label: 'Gender' },
    { key: 'adm_dob', label: 'Date of Birth' },
    { key: 'adm_bform', label: 'Student B-Form / CNIC' },
    { key: 'adm_blood', label: 'Blood Group' },
    { key: 'adm_class', label: 'Admission Class / Grade' },
    { key: 'adm_section', label: 'Section Assignment' },
    { key: 'adm_roll', label: 'Assigned Roll No.' },
    { key: 'adm_prev_school', label: 'Previous School Attended' },
    { key: 'adm_score', label: 'Entrance / Merit Score' },
    { key: 'adm_father', label: 'Father / Guardian Name' },
    { key: 'adm_relation', label: 'Relationship' },
    { key: 'adm_cnic', label: 'Guardian CNIC' },
    { key: 'adm_phone', label: 'Mobile & WhatsApp' },
    { key: 'adm_email', label: 'Guardian Email' },
    { key: 'adm_occupation', label: 'Guardian Occupation' },
    { key: 'adm_address', label: 'Permanent Residential Address' },
    { key: 'adm_emergency', label: 'Emergency Contact' },
    { key: 'adm_fee', label: 'Admission Fee (PKR)' },
    { key: 'adm_tuition', label: 'Monthly Tuition Fee (PKR)' },
    { key: 'adm_discount', label: 'Scholarship / Concession (%)' },
    { key: 'adm_pay_status', label: 'Payment Status' },
    { key: 'adm_medical', label: 'Health, Allergies & Medical Notes' }
  ],
  students_master: [
    { key: 'stu_roll', label: 'Assigned Roll No.' },
    { key: 'stu_name', label: 'Student Full Name' },
    { key: 'stu_gender', label: 'Gender' },
    { key: 'stu_dob', label: 'Date of Birth' },
    { key: 'stu_bform', label: 'Student B-Form / CNIC' },
    { key: 'stu_blood', label: 'Blood Group' },
    { key: 'stu_grade', label: 'Class & Grade' },
    { key: 'stu_section', label: 'Section' },
    { key: 'stu_prev_school', label: 'Previous School Attended' },
    { key: 'stu_score', label: 'Entrance / Merit Score' },
    { key: 'stu_guardian', label: 'Father / Guardian Name' },
    { key: 'stu_relation', label: 'Relationship' },
    { key: 'stu_cnic', label: 'Guardian CNIC' },
    { key: 'stu_phone', label: 'Mobile & WhatsApp' },
    { key: 'stu_email', label: 'Guardian Email' },
    { key: 'stu_occupation', label: 'Guardian Occupation' },
    { key: 'stu_address', label: 'Permanent Residential Address' },
    { key: 'stu_emergency', label: 'Emergency Contact' },
    { key: 'stu_adm_fee', label: 'Admission Fee (PKR)' },
    { key: 'stu_fee_amount', label: 'Monthly Tuition Fee (PKR)' },
    { key: 'stu_discount', label: 'Scholarship / Concession (%)' },
    { key: 'stu_bakaya', label: 'Due Bakaya (PKR)' },
    { key: 'stu_fee_status', label: 'Fee Status' },
    { key: 'stu_medical', label: 'Health, Allergies & Medical Notes' }
  ],
  teachers_master: [
    { key: 't_name', label: 'Teacher Full Name' },
    { key: 't_gender', label: 'Gender' },
    { key: 't_cnic', label: 'National CNIC Number' },
    { key: 't_phone', label: 'Mobile & WhatsApp' },
    { key: 't_email', label: 'Official Email Address' },
    { key: 't_address', label: 'Permanent Residential Address' },
    { key: 't_emergency', label: 'Emergency Contact' },
    { key: 't_qual', label: 'Highest Degree / Qualification' },
    { key: 't_prev', label: 'Previous School / Institute' },
    { key: 't_exp', label: 'Teaching Experience (Years)' },
    { key: 't_role', label: 'Faculty Designation / Role' },
    { key: 't_subject', label: 'Subjects Taught / Department' },
    { key: 't_grade', label: 'Assigned Grade / Class Level' },
    { key: 't_incharge', label: 'Class Teacher In-Charge' },
    { key: 't_periods', label: 'Weekly Periods Workload' },
    { key: 't_contract', label: 'Employment Contract Type' },
    { key: 't_salary', label: 'Monthly Base Salary (PKR)' },
    { key: 't_bank', label: 'Bank Name' },
    { key: 't_account', label: 'Account No. / IBAN' }
  ],
  campus_notices_feed: [
    { key: 'feed_target', label: 'Target Class & Recipient Group' },
    { key: 'feed_priority', label: 'Purpose Category & Urgency Priority' },
    { key: 'feed_title', label: 'Notice / Circular Subject Title' },
    { key: 'feed_body', label: 'Official Instructions & Attachment' }
  ],
  principal_lesson_plans: [
    { key: 'lp_teacher', label: 'Teacher Name & Grade / Section' },
    { key: 'lp_subject', label: 'Subject & Lecture Period' },
    { key: 'lp_topic', label: 'Topic Title & Learning Objectives' },
    { key: 'lp_aids', label: 'Teaching Aids, Homework & Status' }
  ],
  fee_receipts_cashiering: [
    { key: 'fee_student', label: 'Student Selector & Details' },
    { key: 'fee_payment', label: 'Fee Month, Amount Paid & Payment Channel' },
    { key: 'fee_notes', label: 'Reference / Slip # & Counter Remarks' }
  ],
  fee_challans_invoices: [
    { key: 'ch_student', label: 'Student Selector, Name & Class' },
    { key: 'ch_amounts', label: 'Billing Month, Tuition, Lab Fee & Due Date' }
  ],
  daily_closing_reconciliation: [
    { key: 'dc_date', label: 'Closing Date & Opening Vault Cash' },
    { key: 'dc_channels', label: 'Cash, Meezan/HBL Bank & Digital Deposits' },
    { key: 'dc_notes', label: 'Petty Expenses, Slip # & Handover Note' }
  ],
  petty_vouchers: [
    { key: 'pv_fields', label: 'Voucher Category, Payee, Description & Amount' }
  ],
  owner_homework_log: [
    { key: 'hw_title', label: 'Assignment Title & Type' },
    { key: 'hw_subject', label: 'Subject & Topic / Chapter' },
    { key: 'hw_class', label: 'Class / Grade & Section' },
    { key: 'hw_dates', label: 'Assigned Date, Due Date & Time' },
    { key: 'hw_submission_mode', label: 'Submission Mode, Priority & Est. Time' },
    { key: 'hw_marks', label: 'Max Marks & Status' },
    { key: 'hw_desc', label: 'Instructions & Problem Set' },
    { key: 'hw_attachment', label: 'Worksheet File & Reference Link' }
  ],
  owner_student_leaves: [
    { key: 'lv_child', label: 'Selected Child' },
    { key: 'lv_dates', label: 'Date From & Date To' },
    { key: 'lv_reason', label: 'Reason for Absence' }
  ],
  owner_medical: [
    { key: 'rollNo', label: 'Roll #' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'grade', label: 'Class / Grade' },
    { key: 'bloodGroup', label: 'Blood Group' },
    { key: 'vaccinationStatus', label: 'Vaccination Status' },
    { key: 'allergies', label: 'Allergies' },
    { key: 'chronicConditions', label: 'Chronic Conditions' },
    { key: 'emergencyContact', label: 'Emergency Contact' },
    { key: 'doctorName', label: 'Physician Name' }
  ],
  owner_discipline: [
    { key: 'rollNo', label: 'Roll #' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'grade', label: 'Grade / Class' },
    { key: 'category', label: 'Category' },
    { key: 'severity', label: 'Severity' },
    { key: 'description', label: 'Violation Description' },
    { key: 'actionTaken', label: 'Action Taken' },
    { key: 'fineAmount', label: 'Fine Amount (PKR)' },
    { key: 'status', label: 'Status' }
  ],
  owner_payroll: [
    { key: 'staffName', label: 'Staff / Faculty Name' },
    { key: 'role', label: 'Designation / Role' },
    { key: 'month', label: 'Payroll Month' },
    { key: 'baseSalary', label: 'Base Salary (PKR)' },
    { key: 'allowances', label: 'Allowances (PKR)' },
    { key: 'deductions', label: 'Deductions (PKR)' },
    { key: 'status', label: 'Disbursement Status' }
  ],
  owner_staff_leaves: [
    { key: 'staffName', label: 'Staff Member' },
    { key: 'leaveType', label: 'Leave Type' },
    { key: 'fromDate', label: 'From Date' },
    { key: 'toDate', label: 'To Date' },
    { key: 'totalDays', label: 'Total Days' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Approval Status' }
  ],
  owner_finance_ledger: [
    { key: 'challanNo', label: 'Ref / Voucher #' },
    { key: 'title', label: 'Particulars / Description' },
    { key: 'studentName', label: 'Student / Party Name' },
    { key: 'grade', label: 'Class / Section' },
    { key: 'category', label: 'Account Head / Gateway' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'type', label: 'Entry Type' },
    { key: 'amount', label: 'Amount (PKR)' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' }
  ],
  owner_invoices: [
    { key: 'invoiceNo', label: 'Invoice #' },
    { key: 'type', label: 'Invoice Type' },
    { key: 'recipientName', label: 'Recipient Name' },
    { key: 'title', label: 'Invoice Title' },
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'amount', label: 'Gross Amount (PKR)' },
    { key: 'discount', label: 'Discount (PKR)' },
    { key: 'status', label: 'Status' }
  ],
  library_circulation: [
    { key: 'issueNo', label: 'Issue Ref #' },
    { key: 'bookTitle', label: 'Book Title' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'borrowerName', label: 'Borrower Name' },
    { key: 'borrowerId', label: 'Borrower ID / Roll #' },
    { key: 'gradeOrDept', label: 'Class / Department' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'fineAmount', label: 'Fine (PKR)' },
    { key: 'status', label: 'Status' }
  ],
  owner_library_circulation: [
    { key: 'issueNo', label: 'Issue Ref #' },
    { key: 'bookTitle', label: 'Book Title' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'borrowerName', label: 'Borrower Name' },
    { key: 'borrowerId', label: 'Borrower ID / Roll #' },
    { key: 'gradeOrDept', label: 'Class / Department' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'fineAmount', label: 'Fine (PKR)' },
    { key: 'status', label: 'Status' }
  ],
  owner_library_catalog: [
    { key: 'isbn', label: 'ISBN' },
    { key: 'title', label: 'Book Title' },
    { key: 'author', label: 'Author' },
    { key: 'category', label: 'Subject / Category' },
    { key: 'genre', label: 'Genre' },
    { key: 'academicGradeLevel', label: 'Grade Level' },
    { key: 'rackNo', label: 'Rack Location' },
    { key: 'totalCopies', label: 'Total Copies' },
    { key: 'availableCopies', label: 'Available Copies' }
  ],
  owner_exams: [
    { key: 'examName', label: 'Examination Title' },
    { key: 'class', label: 'Assigned Class / Grade' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'averageGPA', label: 'Average GPA' },
    { key: 'status', label: 'Status' }
  ],
  owner_subjects: [
    { key: 'code', label: 'Subject Code' },
    { key: 'title', label: 'Subject Name' },
    { key: 'grade', label: 'Assigned Class' },
    { key: 'creditHours', label: 'Weekly Periods' },
    { key: 'teacher', label: 'Lead Teacher' },
    { key: 'passMarks', label: 'Passing Marks' },
    { key: 'totalMarks', label: 'Total Marks' }
  ],
  owner_timetable: [
    { key: 'period', label: 'Period' },
    { key: 'time', label: 'Time Slot' },
    { key: 'grade', label: 'Class' },
    { key: 'subject', label: 'Subject' },
    { key: 'teacher', label: 'Faculty Teacher' },
    { key: 'room', label: 'Classroom / Lab' }
  ],
  owner_labs_schedule: [
    { key: 'day', label: 'Day' },
    { key: 'period', label: 'Period' },
    { key: 'lab', label: 'Laboratory' },
    { key: 'grade', label: 'Class' },
    { key: 'subject', label: 'Subject' },
    { key: 'experimentTopic', label: 'Practical Experiment Topic' },
    { key: 'teacher', label: 'Supervising Teacher' }
  ],
  owner_audit_waivers: [
    { key: 'studentName', label: 'Student Name & Roll #' },
    { key: 'grade', label: 'Class / Section' },
    { key: 'category', label: 'Waiver Category' },
    { key: 'originalFee', label: 'Original Fee (PKR)' },
    { key: 'concessionLabel', label: 'Concession % / Net Amount' },
    { key: 'reason', label: 'Justification / Reason' },
    { key: 'authorizingBody', label: 'Authorizing Body' },
    { key: 'approvalDate', label: 'Approval Date' }
  ],
  owner_audit_compliance: [
    { key: 'area', label: 'Audit Area' },
    { key: 'title', label: 'Compliance Title' },
    { key: 'standard', label: 'Regulatory Standard' },
    { key: 'status', label: 'Status' },
    { key: 'responsiblePerson', label: 'Responsible Officer' },
    { key: 'lastCheckedDate', label: 'Last Checked' },
    { key: 'nextRenewalDate', label: 'Next Renewal' },
    { key: 'notes', label: 'Audit Notes' }
  ],
  slc_certificates: [
    { key: 'certificateNo', label: 'Certificate No.' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'grade', label: 'Class / Grade' },
    { key: 'admissionDate', label: 'Admission Date' },
    { key: 'leavingDate', label: 'Leaving Date' },
    { key: 'reasonForLeaving', label: 'Reason for Leaving' },
    { key: 'conductRating', label: 'Conduct Rating' },
    { key: 'achievement', label: 'Academic Achievement' },
    { key: 'status', label: 'Status' }
  ],
  owner_portal_users: [
    { key: 'pu_name', label: 'Full Name' },
    { key: 'pu_role', label: 'Portal Role' },
    { key: 'pu_staff_id', label: 'Staff / Roll ID' },
    { key: 'pu_designation', label: 'Designation' },
    { key: 'pu_department', label: 'Department' },
    { key: 'pu_clearance', label: 'Clearance Level' },
    { key: 'pu_branch', label: 'Branch' },
    { key: 'pu_email', label: 'Email / Login' },
    { key: 'pu_phone', label: 'Phone' },
    { key: 'pu_linked', label: 'Linked Scope' },
    { key: 'pu_pin', label: 'Access PIN' },
    { key: 'pu_status', label: 'Status' }
  ],
  owner_expenses: [
    { key: 'exp_title', label: 'Expense Title / Voucher' },
    { key: 'exp_category', label: 'Category' },
    { key: 'exp_vendor', label: 'Vendor / Payee' },
    { key: 'exp_description', label: 'Description' },
    { key: 'exp_amount', label: 'Amount (PKR)' },
    { key: 'exp_date', label: 'Date' },
    { key: 'exp_method', label: 'Payment Method' },
    { key: 'exp_status', label: 'Status' }
  ],
  owner_transport: [
    { key: 'tr_route', label: 'Route Name' },
    { key: 'tr_vehicle', label: 'Vehicle #' },
    { key: 'tr_driver', label: 'Driver Name' },
    { key: 'tr_phone', label: 'Driver Phone' },
    { key: 'tr_fee', label: 'Monthly Fee (PKR)' },
    { key: 'tr_capacity', label: 'Seat Capacity' },
    { key: 'tr_enrolled', label: 'Enrolled Students' },
    { key: 'tr_status', label: 'Status' }
  ],
  owner_hostel: [
    { key: 'hs_room', label: 'Room Number & Wing' },
    { key: 'hs_floor', label: 'Floor Assignment' },
    { key: 'hs_capacity', label: 'Bed Capacity' },
    { key: 'hs_warden', label: 'Hostel Warden' },
    { key: 'hs_phone', label: 'Warden Phone' },
    { key: 'hs_mess', label: 'Monthly Mess Fee (PKR)' }
  ],
  owner_alumni: [
    { key: 'al_roll', label: 'Roll Number' },
    { key: 'al_name', label: 'Graduate Name' },
    { key: 'al_year', label: 'Passing Batch Year' },
    { key: 'al_class', label: 'Matric Class' },
    { key: 'al_slc', label: 'SLC Number' },
    { key: 'al_institute', label: 'Higher Institute / Career' },
    { key: 'al_phone', label: 'Phone' },
    { key: 'al_email', label: 'Email' },
    { key: 'al_achievements', label: 'Achievements' },
    { key: 'al_gpa', label: 'GPA / Marks' }
  ],
  owner_visitors: [
    { key: 'vs_name', label: 'Visitor Full Name' },
    { key: 'vs_cnic_phone', label: 'CNIC or Mobile Phone' },
    { key: 'vs_purpose', label: 'Purpose of Visit' },
    { key: 'vs_host', label: 'Person / Office to Meet' },
    { key: 'vs_badge', label: 'Security Badge #' },
    { key: 'vs_vehicle', label: 'Vehicle Plate #' },
    { key: 'vs_status', label: 'Gate Status' }
  ],
  owner_assets: [
    { key: 'as_name', label: 'Asset Name / Model' },
    { key: 'as_category', label: 'Asset Category' },
    { key: 'as_location', label: 'Location / Room' },
    { key: 'as_qty', label: 'Quantity' },
    { key: 'as_value', label: 'Unit Value (PKR)' },
    { key: 'as_custodian', label: 'Custodian / Assigned Staff' },
    { key: 'as_condition', label: 'Condition' }
  ],
  events_calendar: [
    { key: 'ev_title', label: 'Event Title' },
    { key: 'ev_category', label: 'Category' },
    { key: 'ev_date', label: 'Date' },
    { key: 'ev_time', label: 'Time Slot' },
    { key: 'ev_venue', label: 'Venue / Location' },
    { key: 'ev_guest', label: 'Chief Guest' },
    { key: 'ev_organizer', label: 'Organizer' },
    { key: 'ev_coordinator', label: 'Coordinator Teacher' },
    { key: 'ev_budget', label: 'Allocated Budget (PKR)' },
    { key: 'ev_desc', label: 'Description & Notes' }
  ],
  owner_payment_gateway: [
    { key: 'pg_title', label: 'Gateway Fee Title & Amount' },
    { key: 'pg_details', label: 'Gateway Channel & Reference' }
  ],
  principal_substitutions: [
    { key: 'sub_teachers', label: 'Absent Teacher & Assigned Substitute' },
    { key: 'sub_class', label: 'Class, Subject, Period & Room' }
  ],
  principal_inspections: [
    { key: 'ins_location', label: 'Location / Wing & Uniform Rating' },
    { key: 'ins_scores', label: 'Cleanliness Rating & Faculty Punctuality' },
    { key: 'ins_notes', label: 'Inspection Notes & Corrective Action' }
  ],
  principal_appraisals: [
    { key: 'apr_teacher', label: 'Faculty Member & Department' },
    { key: 'apr_metrics', label: 'Punctuality, Compliance & Score' },
    { key: 'apr_remarks', label: 'Observation Remarks' }
  ],
  principal_faculty_tasks: [
    { key: 'tsk_meta', label: 'Assigned Faculty, Title & Priority' },
    { key: 'tsk_details', label: 'Target Date & Scope Instructions' }
  ],
  attendance_roster_staff: [
    { key: 'st_name', label: 'Full Name' },
    { key: 'st_father', label: 'Father Name' },
    { key: 'st_cnic', label: 'CNIC Number' },
    { key: 'st_role', label: 'Role / Designation' },
    { key: 'st_dept', label: 'Department' },
    { key: 'st_phone', label: 'Phone' },
    { key: 'st_gender', label: 'Gender' }
  ],
  attendance_roster_principals: [
    { key: 'pr_name', label: 'Full Name' },
    { key: 'pr_father', label: 'Father / Husband Name' },
    { key: 'pr_cnic', label: 'CNIC / National ID' },
    { key: 'pr_role', label: 'Designation' },
    { key: 'pr_dept', label: 'Directorate / Dept' },
    { key: 'pr_phone', label: 'Phone' },
    { key: 'pr_gender', label: 'Gender' }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class SchoolTableSchemaService {
  private readonly backend = inject(BackendService);

  readonly portalRole = signal<SchoolTablePortalRole>('owner');
  readonly isOwner = computed<boolean>(() => this.portalRole() === 'owner');
  readonly schemas = signal<Record<string, SchoolTableSchema>>({});
  readonly schemaRevision = signal<number>(0);

  readonly columnManagerState = signal<ColumnManagerState>({
    open: false,
    tableId: '',
    tableTitle: '',
    detectedHeaders: [],
    initialTab: 'columns'
  });

  readonly rowFormModalState = signal<RowFormModalState>({
    open: false,
    tableId: '',
    tableTitle: '',
    detectedHeaders: []
  });

  readonly cellEditorState = signal<CellEditorState | null>(null);
  readonly addRowRequest = signal<{ tableId: string; tableTitle: string; seq: number } | null>(null);
  readonly confirmDialogState = signal<SchoolConfirmDialogState | null>(null);
  readonly printBranding = signal<SchoolPrintBrandingConfig>({ ...DEFAULT_SCHOOL_PRINT_BRANDING });
  readonly statementModalState = signal<StatementModalState>({
    open: false,
    tableId: '',
    title: '',
    initialFormat: 'a4',
    directDataset: null
  });
  readonly printStudioJumpRequest = signal<{
    docType: SchoolPrintDocumentType;
    tableId?: string;
    seq: number;
  } | null>(null);

  private activeTenantId = 'tenant-root-platform';
  private persistHook: (() => void) | null = null;
  private readonly statementProviders = new Map<string, () => StatementDataset | null>();
  private tableRegistry = new Map<string, {
    tableEl: HTMLTableElement;
    title: string;
    detectedHeaders: DetectedBuiltInHeader[];
    detectedRows: DetectedTableRow[];
  }>();

  constructor() {
    this.loadFromLocalStorage();
  }

  registerPersistHook(hook: () => void): void {
    this.persistHook = hook;
  }

  setTenantId(tenantId: string): void {
    const clean = (tenantId || '').trim() || 'tenant-root-platform';
    if (clean !== this.activeTenantId) {
      this.activeTenantId = clean;
      this.loadFromLocalStorage();
    }
  }

  setPortalRole(role: SchoolTablePortalRole): void {
    this.portalRole.set(role || 'owner');
    if (role !== 'owner') {
      this.closeColumnManager();
      this.closeCellEditor();
      this.closeRowFormModal();
      this.cancelConfirm();
    }
  }

  openConfirm(opts: SchoolConfirmDialogState): void {
    if (!this.isOwner()) return;
    this.confirmDialogState.set({
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
      ...opts
    });
  }

  cancelConfirm(): void {
    this.confirmDialogState.set(null);
  }

  acceptConfirm(): void {
    const cur = this.confirmDialogState();
    this.confirmDialogState.set(null);
    if (cur?.onConfirm) {
      cur.onConfirm();
    }
  }

  resolveCanonicalTableId(tableId: string): string {
    const clean = String(tableId || '').trim();
    return SCHOOL_TABLE_FAMILY_MAP[clean] || clean;
  }

  getPortalTargetsLabel(tableId: string): string {
    const canonical = this.resolveCanonicalTableId(tableId);
    const catalogHit = SCHOOL_TABLE_CATALOG.find((c) => c.canonicalId === canonical || c.tableId === tableId);
    if (catalogHit) return catalogHit.portals;
    if (canonical.startsWith('principal_')) return 'Owner, Principal';
    if (canonical.startsWith('teacher_')) return 'Owner, Teacher';
    if (canonical.startsWith('accountant_')) return 'Owner, Accountant';
    if (canonical.startsWith('student_')) return 'Owner, Student';
    if (canonical.startsWith('parent_')) return 'Owner, Parent';
    return 'Owner Portal';
  }

  getCatalogTables(): TableCatalogItem[] {
    const byCanonical = new Map<string, TableCatalogItem>();
    for (const item of SCHOOL_TABLE_CATALOG) {
      byCanonical.set(item.canonicalId, { ...item });
    }
    for (const [tid, reg] of this.tableRegistry.entries()) {
      const canonical = this.resolveCanonicalTableId(tid);
      if (!byCanonical.has(canonical)) {
        byCanonical.set(canonical, {
          tableId: tid,
          canonicalId: canonical,
          title: reg.title || tid.replace(/_/g, ' '),
          portals: this.getPortalTargetsLabel(tid),
          defaultHeaders: reg.detectedHeaders.map((h) => h.originalLabel)
        });
      } else if (reg.detectedHeaders.length > 0) {
        const cur = byCanonical.get(canonical)!;
        if (!cur.defaultHeaders.length) {
          cur.defaultHeaders = reg.detectedHeaders.map((h) => h.originalLabel);
        }
      }
    }
    return Array.from(byCanonical.values());
  }

  getDetectedHeadersForTable(tableId: string): DetectedBuiltInHeader[] {
    const canonical = this.resolveCanonicalTableId(tableId);
    const direct = this.tableRegistry.get(tableId);
    if (direct?.detectedHeaders?.length) return direct.detectedHeaders;
    for (const [tid, reg] of this.tableRegistry.entries()) {
      if (this.resolveCanonicalTableId(tid) === canonical && reg.detectedHeaders.length > 0) {
        return reg.detectedHeaders;
      }
    }
    const cat = SCHOOL_TABLE_CATALOG.find((c) => c.canonicalId === canonical || c.tableId === tableId);
    if (cat) {
      return cat.defaultHeaders.map((label, idx) => ({ index: idx, originalLabel: label }));
    }
    return [];
  }

  registerTableElement(tableId: string, tableEl: HTMLTableElement, title: string): void {
    const prev = this.tableRegistry.get(tableId);
    this.tableRegistry.set(tableId, {
      tableEl,
      title,
      detectedHeaders: prev?.detectedHeaders || [],
      detectedRows: prev?.detectedRows || []
    });
  }

  updateRegisteredHeaders(tableId: string, headers: DetectedBuiltInHeader[]): void {
    const prev = this.tableRegistry.get(tableId);
    if (prev) {
      prev.detectedHeaders = headers;
    }
  }

  updateRegisteredRows(tableId: string, rows: DetectedTableRow[]): void {
    const prev = this.tableRegistry.get(tableId);
    if (prev) {
      prev.detectedRows = rows;
    }
  }

  unregisterTableElement(tableId: string): void {
    this.tableRegistry.delete(tableId);
  }

  getDetectedRowsForTable(tableId: string): DetectedTableRow[] {
    const canonical = this.resolveCanonicalTableId(tableId);
    const seen = new Set<string>();
    const combined: DetectedTableRow[] = [];

    const direct = this.tableRegistry.get(tableId);
    if (direct?.detectedRows?.length) {
      for (const r of direct.detectedRows) {
        if (r.rowKey && !seen.has(r.rowKey)) {
          seen.add(r.rowKey);
          combined.push(r);
        }
      }
    } else {
      for (const [tid, reg] of this.tableRegistry.entries()) {
        if (this.resolveCanonicalTableId(tid) === canonical && reg.detectedRows.length > 0) {
          for (const r of reg.detectedRows) {
            if (r.rowKey && !seen.has(r.rowKey)) {
              seen.add(r.rowKey);
              combined.push(r);
            }
          }
          break;
        }
      }
    }

    const schema = this.getSchema(canonical);
    for (const cr of schema.customRows || []) {
      if (cr.rowKey && !seen.has(cr.rowKey)) {
        seen.add(cr.rowKey);
        combined.push({ rowKey: cr.rowKey, label: cr.rowLabel || cr.rowKey, isCustom: true });
      }
    }

    return combined;
  }

  getRowPositionOptions(tableId: string): TableColumnPositionOption[] {
    const rows = this.getDetectedRowsForTable(tableId);
    const options: TableColumnPositionOption[] = [
      { value: '__first__', label: 'Top of table (First)' },
      { value: '__last__', label: 'Bottom of table (Last)' }
    ];
    for (const r of rows) {
      const cleanLabel = (r.label || r.rowKey).slice(0, 48);
      options.push({
        value: `after:${r.rowKey}`,
        label: `After: ${cleanLabel}${r.isCustom ? ' (Added)' : ''}`
      });
    }
    return options;
  }

  getTableColumnPositionOptions(tableId: string, excludeColId?: string): TableColumnPositionOption[] {
    const schema = this.getSchema(tableId);
    const headers = this.getDetectedHeadersForTable(tableId);
    const hiddenLabels = new Set((schema.hiddenColumnLabels || []).map((l) => l.trim().toLowerCase()));
    const hiddenIndices = new Set(schema.hiddenColumns || []);

    const options: TableColumnPositionOption[] = [
      { value: '__last__', label: 'At End (Default)' },
      { value: '__first__', label: 'At Start (First)' }
    ];

    for (const h of headers) {
      const orig = (h.originalLabel || '').trim();
      const origLower = orig.toLowerCase();
      const renamed = schema.renamedHeadersByLabel?.[origLower] ?? schema.renamedHeaders[h.index] ?? orig;
      const isHidden = hiddenIndices.has(h.index) || (origLower ? hiddenLabels.has(origLower) : false);
      if (isHidden) continue;
      options.push({
        value: `built:${orig}`,
        label: `After: ${renamed}`
      });
    }

    for (const c of schema.customColumns || []) {
      if (c.scope === 'form') continue;
      if (excludeColId && c.id === excludeColId) continue;
      options.push({
        value: `custom:${c.id}`,
        label: `After: ${c.label}`
      });
    }

    return options;
  }

  getTableManageableColumns(
    tableId: string,
    detectedHeaders?: DetectedBuiltInHeader[]
  ): TableManageableColumn[] {
    const schema = this.getSchema(tableId);
    const headers = detectedHeaders && detectedHeaders.length > 0
      ? detectedHeaders
      : this.getDetectedHeadersForTable(tableId);
    const ordered = this.resolveOrderedColumns(tableId, headers, schema);
    const list: TableManageableColumn[] = [];
    for (const item of ordered) {
      if (item.kind === 'builtin') {
        if (item.hidden) continue;
        list.push({
          value: `builtin:${item.header.index}`,
          key: String(item.header.index),
          label: item.displayLabel,
          originalLabel: item.header.originalLabel,
          index: item.header.index,
          kind: 'builtin'
        });
      } else {
        list.push({
          value: `custom:${item.col.id}`,
          key: item.col.id,
          label: item.col.label,
          originalLabel: item.col.label,
          kind: 'custom'
        });
      }
    }
    return list;
  }

  getHiddenTableColumns(
    tableId: string,
    detectedHeaders?: DetectedBuiltInHeader[]
  ): HiddenTableColumnOption[] {
    const schema = this.getSchema(tableId);
    const headers = detectedHeaders && detectedHeaders.length > 0
      ? detectedHeaders
      : this.getDetectedHeadersForTable(tableId);
    const hiddenLabels = new Set((schema.hiddenColumnLabels || []).map((l) => l.trim().toLowerCase()));
    const hiddenIndices = new Set(schema.hiddenColumns || []);
    const isCanonicalMatch = schema.tableId === tableId;
    const result: HiddenTableColumnOption[] = [];
    for (const h of headers) {
      const orig = (h.originalLabel || '').trim();
      const origLower = orig.toLowerCase();
      const isHidden = hiddenIndices.has(h.index) || (origLower ? hiddenLabels.has(origLower) : false);
      if (!isHidden) continue;
      const renamed = schema.renamedHeadersByLabel?.[origLower] ?? (isCanonicalMatch ? schema.renamedHeaders[h.index] : undefined);
      result.push({
        index: h.index,
        originalLabel: orig,
        displayLabel: renamed && renamed.trim() ? renamed.trim() : orig
      });
    }
    return result;
  }

  getFormAnchorOptions(tableId: string, excludeColId?: string): FormFieldAnchorOption[] {
    const canonical = this.resolveCanonicalTableId(tableId);
    const schema = this.getSchema(canonical);
    const hiddenSet = new Set((schema.hiddenFormFields || []).map((k) => k.trim()));
    const anchors = (SCHOOL_FORM_FIELD_ANCHORS[canonical] || SCHOOL_FORM_FIELD_ANCHORS[tableId] || []).filter(
      (a) => !hiddenSet.has(a.key)
    );
    const options: FormFieldAnchorOption[] = [
      { key: '__last__', label: 'At Bottom (End of Form)' },
      { key: '__first__', label: 'At Top (First Field)' }
    ];
    for (const a of anchors) {
      options.push({ key: a.key, label: `After: ${a.label}` });
    }
    const existingCustom = (schema.customColumns || []).filter(
      (c) => (!c.scope || c.scope === 'form' || c.scope === 'both') && c.id !== excludeColId
    );
    for (const c of existingCustom) {
      options.push({ key: `custom:${c.id}`, label: `After: ${c.label}` });
    }
    return options;
  }

  isFormFieldHidden(tableId: string, fieldKey: string): boolean {
    if (!tableId || !fieldKey) return false;
    const schema = this.getSchema(tableId);
    return (schema.hiddenFormFields || []).includes(fieldKey.trim());
  }

  getFormManageableFields(tableId: string): FormManageableField[] {
    const canonical = this.resolveCanonicalTableId(tableId);
    const schema = this.getSchema(canonical);
    const hiddenSet = new Set((schema.hiddenFormFields || []).map((k) => k.trim()));
    const anchors = (SCHOOL_FORM_FIELD_ANCHORS[canonical] || SCHOOL_FORM_FIELD_ANCHORS[tableId] || []).filter(
      (a) => !hiddenSet.has(a.key)
    );
    const list: FormManageableField[] = anchors.map((a) => ({
      value: `builtin:${a.key}`,
      key: a.key,
      label: a.label,
      kind: 'builtin'
    }));
    const custom = (schema.customColumns || []).filter(
      (c) => !c.scope || c.scope === 'form' || c.scope === 'both'
    );
    for (const c of custom) {
      list.push({
        value: `custom:${c.id}`,
        key: c.id,
        label: c.label,
        kind: 'custom'
      });
    }
    return list;
  }

  getHiddenFormFields(tableId: string): FormFieldAnchorOption[] {
    const canonical = this.resolveCanonicalTableId(tableId);
    const schema = this.getSchema(canonical);
    const hiddenKeys = schema.hiddenFormFields || [];
    if (hiddenKeys.length === 0) return [];
    const anchorMap = new Map<string, string>();
    for (const a of SCHOOL_FORM_FIELD_ANCHORS[canonical] || SCHOOL_FORM_FIELD_ANCHORS[tableId] || []) {
      anchorMap.set(a.key, a.label);
    }
    return hiddenKeys.map((k) => ({ key: k, label: anchorMap.get(k) || k }));
  }

  hideFormField(tableId: string, fieldKey: string): void {
    if (!this.isOwner()) return;
    const clean = (fieldKey || '').trim();
    if (!clean) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const set = new Set(schema.hiddenFormFields || []);
      set.add(clean);
      return { ...schema, hiddenFormFields: Array.from(set) };
    });
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  restoreFormField(tableId: string, fieldKey: string): void {
    if (!this.isOwner()) return;
    const clean = (fieldKey || '').trim();
    if (!clean) return;
    const canonical = this.mutateSchema(tableId, (schema) => ({
      ...schema,
      hiddenFormFields: (schema.hiddenFormFields || []).filter((k) => k !== clean)
    }));
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  restoreAllFormFields(tableId: string): void {
    if (!this.isOwner()) return;
    const canonical = this.mutateSchema(tableId, (schema) => ({
      ...schema,
      hiddenFormFields: []
    }));
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  hasCustomColumnsAtSlot(tableId: string, slotAnchor: string): boolean {
    const schema = this.getSchema(tableId);
    const cols = schema.customColumns || [];
    if (cols.length === 0) return false;
    return this.getCustomColumnsForSlot(tableId, slotAnchor).length > 0;
  }

  private resolveFormRootSlot(
    col: SchoolCustomColumn,
    colMap: Map<string, SchoolCustomColumn>,
    anchorSet: Set<string>
  ): string {
    let cur: SchoolCustomColumn | undefined = col;
    const visited = new Set<string>();
    while (cur) {
      const pos = (cur.insertAfterFormField || '').trim();
      if (!pos || pos === '__last__' || pos === '__bottom__') return '__bottom__';
      if (pos === '__first__') return '__first__';
      if (pos.startsWith('custom:')) {
        const refId = pos.slice(7).trim();
        if (!refId || visited.has(refId)) return '__bottom__';
        visited.add(refId);
        cur = colMap.get(refId);
        continue;
      }
      return anchorSet.has(pos) ? pos : '__bottom__';
    }
    return '__bottom__';
  }

  getCustomColumnsForSlot(tableId: string, slotAnchor: string): SchoolCustomColumn[] {
    const canonical = this.resolveCanonicalTableId(tableId);
    const cols = (this.getSchema(canonical).customColumns || []).filter(
      (c) => !c.scope || c.scope === 'form' || c.scope === 'both'
    );
    if (cols.length === 0) return [];

    const legacyAnchors = ['sec_01', 'sec_02', 'sec_03', 'sec_04', 'sec_05', 'stu_identity', 'stu_fee', 't_sec_1', 't_sec_2', 't_sec_3', 't_sec_4'];
    const anchorSet = new Set([
      ...(SCHOOL_FORM_FIELD_ANCHORS[canonical] || SCHOOL_FORM_FIELD_ANCHORS[tableId] || []).map((a) => a.key),
      ...legacyAnchors
    ]);

    const targetRaw = (slotAnchor || '__bottom__').trim();
    const target = targetRaw === '__last__' ? '__bottom__' : targetRaw;

    const colMap = new Map<string, SchoolCustomColumn>();
    for (const c of cols) colMap.set(c.id, c);

    const slotCols = cols.filter((c) => this.resolveFormRootSlot(c, colMap, anchorSet) === target);
    if (slotCols.length <= 1) return slotCols;

    const slotIdSet = new Set(slotCols.map((c) => c.id));
    const childrenByParent = new Map<string, SchoolCustomColumn[]>();
    const roots: SchoolCustomColumn[] = [];

    for (const c of slotCols) {
      const pos = (c.insertAfterFormField || '').trim();
      if (pos.startsWith('custom:')) {
        const parentId = pos.slice(7).trim();
        if (slotIdSet.has(parentId) && parentId !== c.id) {
          const list = childrenByParent.get(parentId) || [];
          list.push(c);
          childrenByParent.set(parentId, list);
          continue;
        }
      }
      roots.push(c);
    }

    const ordered: SchoolCustomColumn[] = [];
    const visited = new Set<string>();
    const visit = (c: SchoolCustomColumn) => {
      if (visited.has(c.id)) return;
      visited.add(c.id);
      ordered.push(c);
      for (const child of childrenByParent.get(c.id) || []) {
        visit(child);
      }
    };

    for (const r of roots) visit(r);
    for (const c of slotCols) visit(c);
    return ordered;
  }

  describeColumnTablePosition(tableId: string, col: SchoolCustomColumn): string {
    const raw = (col.insertAfterColumn || '').trim();
    if (!raw || raw === '__last__') return 'Table: End (Before Actions)';
    if (raw === '__first__') return 'Table: First Column';
    if (raw.startsWith('built:')) return `Table: After ${raw.slice(6)}`;
    if (raw.startsWith('custom:')) {
      const refId = raw.slice(7);
      const target = (this.getSchema(tableId).customColumns || []).find((c) => c.id === refId);
      return `Table: After ${target?.label || 'Custom Column'}`;
    }
    return `Table: After ${raw}`;
  }

  describeColumnFormPosition(tableId: string, col: SchoolCustomColumn): string {
    const raw = (col.insertAfterFormField || '').trim();
    if (!raw || raw === '__last__' || raw === '__bottom__') return 'Form: Bottom';
    if (raw === '__first__') return 'Form: Top (First)';
    const canonical = this.resolveCanonicalTableId(tableId);
    const anchor = (SCHOOL_FORM_FIELD_ANCHORS[canonical] || SCHOOL_FORM_FIELD_ANCHORS[tableId] || []).find((a) => a.key === raw);
    return `Form: After ${anchor?.label || raw}`;
  }

  resolveOrderedColumns(
    tableId: string,
    detectedHeaders: DetectedBuiltInHeader[],
    schema?: SchoolTableSchema,
    effectiveHiddenSet?: Set<number>
  ): OrderedTableColumn[] {
    const s = schema || this.getSchema(tableId);
    const isCanonicalMatch = s.tableId === tableId;
    const hiddenLabels = new Set((s.hiddenColumnLabels || []).map((l) => l.trim().toLowerCase()));
    const hiddenIndices = new Set(s.hiddenColumns || []);

    const ordered: OrderedTableColumn[] = detectedHeaders.map((h) => {
      const orig = (h.originalLabel || '').trim();
      const origLower = orig.toLowerCase();
      const renamed = s.renamedHeadersByLabel?.[origLower] ?? (isCanonicalMatch ? s.renamedHeaders[h.index] : undefined);
      const displayLabel = renamed && renamed.trim() ? renamed.trim() : orig;
      const hidden = effectiveHiddenSet
        ? effectiveHiddenSet.has(h.index)
        : (hiddenIndices.has(h.index) || (origLower ? hiddenLabels.has(origLower) : false));
      return { kind: 'builtin', header: h, displayLabel, hidden };
    });

    const customCols = [...(s.customColumns || [])].filter(
      (c) => !c.scope || c.scope === 'table' || c.scope === 'both'
    );
    if (customCols.length === 0) return ordered;

    const anchorTailCount = new Map<string, number>();

    const matchesBuiltIn = (item: OrderedTableColumn, targetRaw: string): boolean => {
      if (item.kind !== 'builtin') return false;
      const clean = targetRaw.replace(/^built:/i, '').trim().toLowerCase();
      if (!clean) return false;
      const orig = item.header.originalLabel.trim().toLowerCase();
      const disp = item.displayLabel.trim().toLowerCase();
      return orig === clean || disp === clean;
    };

    const insertAtAnchor = (col: SchoolCustomColumn, posRaw: string): boolean => {
      const pos = (posRaw || '').trim();
      if (!pos || pos === '__last__') {
        ordered.push({ kind: 'custom', col });
        return true;
      }
      if (pos === '__first__') {
        const offset = anchorTailCount.get('__first__') || 0;
        ordered.splice(Math.min(offset, ordered.length), 0, { kind: 'custom', col });
        anchorTailCount.set('__first__', offset + 1);
        return true;
      }
      if (pos.startsWith('custom:')) {
        const refId = pos.slice(7).trim();
        const targetIdx = ordered.findIndex((item) => item.kind === 'custom' && item.col.id === refId);
        if (targetIdx >= 0) {
          const offset = anchorTailCount.get(pos) || 0;
          ordered.splice(Math.min(targetIdx + 1 + offset, ordered.length), 0, { kind: 'custom', col });
          anchorTailCount.set(pos, offset + 1);
          return true;
        }
        return false;
      }
      const builtTarget = pos.startsWith('built:') ? pos.slice(6) : pos;
      const bIdx = ordered.findIndex((item) => matchesBuiltIn(item, builtTarget));
      if (bIdx >= 0) {
        const normKey = `built:${builtTarget.trim().toLowerCase()}`;
        const offset = anchorTailCount.get(normKey) || 0;
        ordered.splice(Math.min(bIdx + 1 + offset, ordered.length), 0, { kind: 'custom', col });
        anchorTailCount.set(normKey, offset + 1);
        return true;
      }
      return false;
    };

    // Pass 1: Insert built-in-anchored, '__first__', and '__last__' columns
    let deferred: SchoolCustomColumn[] = [];
    for (const col of customCols) {
      const pos = (col.insertAfterColumn || '').trim();
      if (pos.startsWith('custom:')) {
        deferred.push(col);
      } else {
        const placed = insertAtAnchor(col, pos || '__last__');
        if (!placed) {
          ordered.push({ kind: 'custom', col });
        }
      }
    }

    // Pass 2+: Resolve chained 'custom:<id>' columns cleanly with cycle safety
    let safety = deferred.length + 2;
    while (deferred.length > 0 && safety-- > 0) {
      const nextDeferred: SchoolCustomColumn[] = [];
      let progressed = false;
      for (const col of deferred) {
        if (insertAtAnchor(col, col.insertAfterColumn || '__last__')) {
          progressed = true;
        } else {
          nextDeferred.push(col);
        }
      }
      deferred = nextDeferred;
      if (!progressed) break;
    }

    // Any remaining unresolved (e.g. deleted anchor target) append at end before Actions
    for (const col of deferred) {
      ordered.push({ kind: 'custom', col });
    }

    return ordered;
  }

  getSchema(tableId: string): SchoolTableSchema {
    const canonical = this.resolveCanonicalTableId(tableId);
    const map = this.schemas();
    const existing = map[canonical] || map[tableId];
    if (existing) {
      return {
        ...existing,
        tableId: canonical,
        customTitle: existing.customTitle || '',
        hiddenColumns: existing.hiddenColumns || [],
        hiddenColumnLabels: existing.hiddenColumnLabels || [],
        hiddenFormFields: existing.hiddenFormFields || [],
        renamedHeaders: existing.renamedHeaders || {},
        renamedHeadersByLabel: existing.renamedHeadersByLabel || {},
        customColumns: existing.customColumns || [],
        customRows: existing.customRows || [],
        customCells: existing.customCells || {},
        cellMeta: existing.cellMeta || {}
      };
    }
    return {
      tableId: canonical,
      customTitle: '',
      hiddenColumns: [],
      hiddenColumnLabels: [],
      hiddenFormFields: [],
      renamedHeaders: {},
      renamedHeadersByLabel: {},
      customColumns: [],
      customRows: [],
      customCells: {},
      cellMeta: {}
    };
  }

  exportSchemas(): Record<string, SchoolTableSchema> {
    try {
      return JSON.parse(JSON.stringify(this.schemas()));
    } catch {
      return {};
    }
  }

  importSchemas(raw: unknown, replaceAll = false): void {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
    const normalized: Record<string, SchoolTableSchema> = replaceAll ? {} : { ...this.schemas() };
    for (const [k, v] of Object.entries(raw as Record<string, any>)) {
      if (!v || typeof v !== 'object') continue;
      const canonical = this.resolveCanonicalTableId(String(v.tableId || k));
      normalized[canonical] = this.normalizeSchemaObject(canonical, v);
    }
    this.schemas.set(normalized);
    this.saveToLocalStorageOnly();
    this.schemaRevision.update((n) => n + 1);
  }

  private normalizeSchemaObject(canonicalId: string, v: any): SchoolTableSchema {
    return {
      tableId: canonicalId,
      customTitle: typeof v.customTitle === 'string' ? v.customTitle : '',
      hiddenColumns: Array.isArray(v.hiddenColumns)
        ? v.hiddenColumns.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 0)
        : [],
      hiddenColumnLabels: Array.isArray(v.hiddenColumnLabels)
        ? v.hiddenColumnLabels.map((s: any) => String(s).trim()).filter(Boolean)
        : [],
      hiddenFormFields: Array.isArray(v.hiddenFormFields)
        ? v.hiddenFormFields.map((s: any) => String(s).trim()).filter(Boolean)
        : [],
      renamedHeaders: v.renamedHeaders && typeof v.renamedHeaders === 'object' ? { ...v.renamedHeaders } : {},
      renamedHeadersByLabel: v.renamedHeadersByLabel && typeof v.renamedHeadersByLabel === 'object' ? { ...v.renamedHeadersByLabel } : {},
      customColumns: Array.isArray(v.customColumns)
        ? v.customColumns
            .filter((c: any) => c && c.id && c.label)
            .map((c: any) => ({
              id: String(c.id),
              label: String(c.label),
              type: (['text', 'number', 'date', 'badge', 'select'].includes(c.type) ? c.type : 'text') as CustomColumnType,
              defaultValue: String(c.defaultValue ?? ''),
              options: Array.isArray(c.options) ? c.options.map((o: any) => String(o)).filter(Boolean) : undefined,
              required: Boolean(c.required),
              ...(c.insertAfterColumn ? { insertAfterColumn: String(c.insertAfterColumn).trim() } : {}),
              ...(c.insertAfterFormField ? { insertAfterFormField: String(c.insertAfterFormField).trim() } : {}),
              ...(c.scope && ['table', 'form', 'both'].includes(c.scope) ? { scope: c.scope } : {})
            }))
        : [],
      customRows: Array.isArray(v.customRows)
        ? v.customRows
            .filter((r: any) => r && r.rowKey)
            .map((r: any) => ({
              rowKey: String(r.rowKey),
              rowLabel: String(r.rowLabel || ''),
              ...(r.insertAfterRowKey ? { insertAfterRowKey: String(r.insertAfterRowKey).trim() } : {}),
              values: r.values && typeof r.values === 'object' ? { ...r.values } : {},
              submittedByName: String(r.submittedByName || ''),
              submittedByRole: String(r.submittedByRole || 'owner'),
              createdAt: String(r.createdAt || '')
            }))
        : [],
      customCells: v.customCells && typeof v.customCells === 'object' ? { ...v.customCells } : {},
      cellMeta: v.cellMeta && typeof v.cellMeta === 'object' ? { ...v.cellMeta } : {}
    };
  }

  async loadFromBackend(): Promise<void> {
    try {
      const res = await this.backend.getSchoolTableSchemas();
      if (res?.ok && res.schemas && typeof res.schemas === 'object') {
        const incomingCount = Object.keys(res.schemas).length;
        if (incomingCount > 0) {
          this.importSchemas(res.schemas, true);
        }
      }
    } catch {}
  }

  openColumnManager(
    tableId: string,
    tableTitle: string,
    detectedHeaders?: DetectedBuiltInHeader[],
    initialTab: 'columns' | 'rows' | 'reset' = 'columns'
  ): void {
    if (!this.isOwner()) return;
    const headers = detectedHeaders && detectedHeaders.length > 0
      ? detectedHeaders
      : this.getDetectedHeadersForTable(tableId);
    this.columnManagerState.set({
      open: true,
      tableId,
      tableTitle: tableTitle || tableId,
      detectedHeaders: headers,
      initialTab
    });
  }

  switchManagedTable(item: TableCatalogItem): void {
    if (!this.isOwner()) return;
    const headers = this.getDetectedHeadersForTable(item.tableId);
    this.columnManagerState.set({
      open: true,
      tableId: item.tableId,
      tableTitle: item.title,
      detectedHeaders: headers,
      initialTab: this.columnManagerState().initialTab || 'columns'
    });
  }

  closeColumnManager(): void {
    const cur = this.columnManagerState();
    if (cur.open) {
      this.columnManagerState.set({ ...cur, open: false });
    }
  }

  openRowFormModal(tableId: string, tableTitle: string, detectedHeaders?: DetectedBuiltInHeader[]): void {
    this.openColumnManager(tableId, tableTitle, detectedHeaders, 'rows');
  }

  closeRowFormModal(): void {
    const cur = this.rowFormModalState();
    if (cur.open) {
      this.rowFormModalState.set({ ...cur, open: false });
    }
  }

  openCellEditor(state: Omit<CellEditorState, 'open'>): void {
    if (!this.isOwner()) return;
    this.cellEditorState.set({ ...state, open: true });
  }

  closeCellEditor(): void {
    this.cellEditorState.set(null);
  }

  triggerAddRow(tableId: string, tableTitle: string): void {
    if (!this.isOwner()) return;
    this.addRowRequest.set({ tableId, tableTitle, seq: Date.now() });
  }

  updateTableTitle(tableId: string, customTitle: string): void {
    if (!this.isOwner()) return;
    const clean = (customTitle || '').trim();
    const canonical = this.mutateSchema(tableId, (schema) => ({
      ...schema,
      customTitle: clean
    }));
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  toggleColumnVisibility(tableId: string, colIndex: number, originalLabel?: string): void {
    if (!this.isOwner()) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const set = new Set(schema.hiddenColumns);
      const labelSet = new Set((schema.hiddenColumnLabels || []).map((s) => s.toLowerCase()));
      const origLower = (originalLabel || '').trim().toLowerCase();
      if (set.has(colIndex) || (origLower && labelSet.has(origLower))) {
        set.delete(colIndex);
        if (origLower) labelSet.delete(origLower);
      } else {
        set.add(colIndex);
        if (origLower) labelSet.add(origLower);
      }
      return {
        ...schema,
        hiddenColumns: Array.from(set).sort((a, b) => a - b),
        hiddenColumnLabels: Array.from(labelSet)
      };
    });
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  hideTableColumn(tableId: string, colIndex: number, originalLabel?: string): void {
    if (!this.isOwner()) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const set = new Set(schema.hiddenColumns);
      const labelSet = new Set((schema.hiddenColumnLabels || []).map((s) => s.toLowerCase()));
      const origLower = (originalLabel || '').trim().toLowerCase();
      set.add(colIndex);
      if (origLower) labelSet.add(origLower);
      return {
        ...schema,
        hiddenColumns: Array.from(set).sort((a, b) => a - b),
        hiddenColumnLabels: Array.from(labelSet)
      };
    });
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  restoreTableColumn(tableId: string, colIndex: number, originalLabel?: string): void {
    if (!this.isOwner()) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const set = new Set(schema.hiddenColumns);
      const labelSet = new Set((schema.hiddenColumnLabels || []).map((s) => s.toLowerCase()));
      const origLower = (originalLabel || '').trim().toLowerCase();
      set.delete(colIndex);
      if (origLower) labelSet.delete(origLower);
      return {
        ...schema,
        hiddenColumns: Array.from(set).sort((a, b) => a - b),
        hiddenColumnLabels: Array.from(labelSet)
      };
    });
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  restoreAllTableColumns(tableId: string): void {
    if (!this.isOwner()) return;
    const canonical = this.mutateSchema(tableId, (schema) => ({
      ...schema,
      hiddenColumns: [],
      hiddenColumnLabels: []
    }));
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  renameColumn(tableId: string, colIndex: number, newLabel: string, originalLabel: string): void {
    if (!this.isOwner()) return;
    const trimmed = (newLabel || '').trim();
    const origKey = (originalLabel || '').trim().toLowerCase();
    const canonical = this.mutateSchema(tableId, (schema) => {
      const next = { ...schema.renamedHeaders };
      const nextByLabel = { ...(schema.renamedHeadersByLabel || {}) };
      if (!trimmed || trimmed === originalLabel) {
        delete next[colIndex];
        if (origKey) delete nextByLabel[origKey];
      } else {
        next[colIndex] = trimmed;
        if (origKey) nextByLabel[origKey] = trimmed;
      }
      return { ...schema, renamedHeaders: next, renamedHeadersByLabel: nextByLabel };
    });
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
  }

  mapFormAnchorToTableColumn(tableId: string, anchorKey: string): string {
    const canonical = this.resolveCanonicalTableId(tableId);
    const key = (anchorKey || '').trim();
    if (!key || key === '__last__' || key === '__bottom__') return '__last__';
    if (key === '__first__') return '__first__';
    if (key.startsWith('custom:')) return key;

    const studentAndAdmissionAnchorMap: Record<string, string> = {
      adm_roll: 'built:Roll #',
      stu_roll: 'built:Roll #',
      adm_name: 'built:Student Name',
      stu_name: 'built:Student Name',
      stu_identity: 'built:Student Name',
      adm_gender: 'built:Gender',
      stu_gender: 'built:Gender',
      adm_dob: 'built:Date of Birth',
      stu_dob: 'built:Date of Birth',
      adm_bform: 'built:B-Form / CNIC',
      stu_bform: 'built:B-Form / CNIC',
      adm_blood: 'built:Blood Group',
      stu_blood: 'built:Blood Group',
      adm_class: 'built:Class / Grade',
      stu_grade: 'built:Class / Grade',
      adm_section: 'built:Section',
      stu_section: 'built:Section',
      adm_prev_school: 'built:Previous School',
      stu_prev_school: 'built:Previous School',
      adm_score: 'built:Merit Score',
      stu_score: 'built:Merit Score',
      adm_father: 'built:Father / Guardian',
      stu_guardian: 'built:Father / Guardian',
      adm_relation: 'built:Relation',
      stu_relation: 'built:Relation',
      adm_cnic: 'built:Guardian CNIC',
      stu_cnic: 'built:Guardian CNIC',
      adm_phone: 'built:Mobile & WhatsApp',
      stu_phone: 'built:Mobile & WhatsApp',
      adm_email: 'built:Guardian Email',
      stu_email: 'built:Guardian Email',
      adm_occupation: 'built:Occupation',
      stu_occupation: 'built:Occupation',
      adm_address: 'built:Residential Address',
      stu_address: 'built:Residential Address',
      adm_emergency: 'built:Emergency Contact',
      stu_emergency: 'built:Emergency Contact',
      adm_fee: 'built:Admission Fee',
      stu_adm_fee: 'built:Admission Fee',
      adm_tuition: 'built:Monthly Tuition',
      stu_fee_amount: 'built:Monthly Tuition',
      stu_fee: 'built:Monthly Tuition',
      adm_discount: 'built:Concession %',
      stu_discount: 'built:Concession %',
      stu_bakaya: 'built:Due Bakaya',
      adm_pay_status: 'built:Fee Status',
      stu_fee_status: 'built:Fee Status',
      adm_medical: 'built:Medical Notes',
      stu_medical: 'built:Medical Notes'
    };

    if (canonical === 'owner_admissions' || canonical === 'students_master') {
      return studentAndAdmissionAnchorMap[key] || '__last__';
    }

    const teachersAnchorMap: Record<string, string> = {
      t_name: 'built:Faculty Member',
      t_gender: 'built:Gender',
      t_cnic: 'built:CNIC',
      t_phone: 'built:Phone',
      t_email: 'built:Email',
      t_address: 'built:Address',
      t_emergency: 'built:Emergency Contact',
      t_qual: 'built:Qualification',
      t_prev: 'built:Previous Institute',
      t_exp: 'built:Experience',
      t_role: 'built:Designation / Role',
      t_subject: 'built:Subjects / Dept',
      t_grade: 'built:Assigned Grade',
      t_incharge: 'built:In-Charge Class',
      t_periods: 'built:Weekly Periods',
      t_contract: 'built:Contract Type',
      t_salary: 'built:Salary',
      t_bank: 'built:Bank & IBAN',
      t_account: 'built:Bank & IBAN',
      t_sec_1: 'built:Emergency Contact',
      t_sec_2: 'built:Experience',
      t_sec_3: 'built:Weekly Periods',
      t_sec_4: 'built:Bank & IBAN'
    };
    if (canonical === 'teachers_master' && teachersAnchorMap[key]) {
      return teachersAnchorMap[key];
    }

    const portalUsersMap: Record<string, string> = {
      pu_name: 'built:Full Name',
      pu_role: 'built:Role',
      pu_staff_id: 'built:Staff / Roll ID',
      pu_designation: 'built:Designation',
      pu_department: 'built:Department',
      pu_clearance: 'built:Clearance Level',
      pu_branch: 'built:Branch',
      pu_email: 'built:Email / Login',
      pu_phone: 'built:Phone',
      pu_linked: 'built:Linked Scope',
      pu_pin: 'built:Access PIN',
      pu_status: 'built:Status'
    };
    if (canonical === 'owner_portal_users' && portalUsersMap[key]) {
      return portalUsersMap[key];
    }

    const extraAnchorMaps: Record<string, Record<string, string>> = {
      events_calendar: {
        ev_title: 'built:Event Title',
        ev_category: 'built:Category',
        ev_date: 'built:Date',
        ev_time: 'built:Time',
        ev_venue: 'built:Venue',
        ev_guest: 'built:Chief Guest',
        ev_organizer: 'built:Organizer',
        ev_coordinator: 'built:Coordinator',
        ev_budget: 'built:Budget (PKR)',
        ev_desc: 'built:Description'
      },
      owner_homework_log: {
        hw_title: 'built:Title & Type',
        hw_subject: 'built:Subject',
        hw_meta: 'built:Subject',
        hw_class: 'built:Class & Section',
        hw_dates: 'built:Due Date & Time',
        hw_submission_mode: 'built:Submission Mode',
        hw_marks: 'built:Max Marks',
        hw_desc: 'built:Title & Type',
        hw_attachment: 'built:Files & Links'
      },
      owner_transport: {
        tr_route: 'built:Route Name',
        tr_vehicle: 'built:Vehicle #',
        tr_driver: 'built:Driver Name',
        tr_phone: 'built:Driver Phone',
        tr_fee: 'built:Monthly Fee',
        tr_capacity: 'built:Capacity',
        tr_enrolled: 'built:Enrolled',
        tr_status: 'built:Status'
      },
      owner_hostel: {
        hs_room: 'built:Room #',
        hs_floor: 'built:Floor / Wing',
        hs_capacity: 'built:Capacity',
        hs_warden: 'built:Warden',
        hs_phone: 'built:Warden Phone',
        hs_mess: 'built:Mess Fee (PKR)'
      },
      owner_alumni: {
        al_roll: 'built:Roll #',
        al_name: 'built:Graduate Name',
        al_year: 'built:Batch Year',
        al_class: 'built:Matric Class',
        al_slc: 'built:SLC #',
        al_institute: 'built:Institute / Career',
        al_phone: 'built:Phone',
        al_email: 'built:Email',
        al_achievements: 'built:Achievements',
        al_gpa: 'built:GPA'
      },
      owner_visitors: {
        vs_name: 'built:Visitor Name',
        vs_cnic_phone: 'built:CNIC / Phone',
        vs_purpose: 'built:Purpose',
        vs_host: 'built:Host / Whom to Meet',
        vs_badge: 'built:Badge #',
        vs_vehicle: 'built:Vehicle #',
        vs_status: 'built:Status'
      },
      owner_assets: {
        as_name: 'built:Asset Name',
        as_category: 'built:Category',
        as_location: 'built:Location / Room',
        as_qty: 'built:Qty',
        as_value: 'built:Unit Value (PKR)',
        as_custodian: 'built:Custodian',
        as_condition: 'built:Condition'
      },
      attendance_roster_staff: {
        st_name: 'built:Member Details',
        st_father: 'built:Father / Guardian',
        st_cnic: 'built:CNIC / B-Form',
        st_role: 'built:Role / Dept',
        st_dept: 'built:Role / Dept',
        st_phone: 'built:Mobile / Phone',
        st_gender: 'built:Gender'
      },
      attendance_roster_principals: {
        pr_name: 'built:Member Details',
        pr_father: 'built:Father / Guardian',
        pr_cnic: 'built:CNIC / B-Form',
        pr_role: 'built:Role / Dept',
        pr_dept: 'built:Role / Dept',
        pr_phone: 'built:Mobile / Phone',
        pr_gender: 'built:Gender'
      },
      principal_substitutions: {
        sub_teachers: 'built:Assigned Substitute',
        sub_class: 'built:Period & Room'
      },
      principal_inspections: {
        ins_location: 'built:Campus Location',
        ins_scores: 'built:Teacher Punctuality',
        ins_notes: 'built:Notes & Action Items'
      },
      principal_appraisals: {
        apr_teacher: 'built:Subject & Dept',
        apr_metrics: 'built:Punctuality & Compliance',
        apr_remarks: 'built:Observation Remarks'
      },
      principal_faculty_tasks: {
        tsk_meta: 'built:Duty Title & Scope',
        tsk_details: 'built:Target Date'
      },
      owner_subjects: {
        code: 'built:Subject Code',
        title: 'built:Subject Name',
        grade: 'built:Assigned Class',
        creditHours: 'built:Weekly Periods',
        teacher: 'built:Lead Teacher',
        passMarks: 'built:Total / Passing Marks',
        totalMarks: 'built:Total / Passing Marks'
      },
      owner_exams: {
        examName: 'built:Exam Title',
        class: 'built:Class',
        startDate: 'built:Start Date',
        averageGPA: 'built:Average GPA',
        status: 'built:Status'
      },
      owner_timetable: {
        period: 'built:Period & Time',
        time: 'built:Period & Time',
        grade: 'built:Class',
        subject: 'built:Subject',
        teacher: 'built:Faculty Teacher',
        room: 'built:Classroom / Lab'
      },
      owner_labs_schedule: {
        day: 'built:Day & Period',
        period: 'built:Day & Period',
        lab: 'built:Laboratory',
        grade: 'built:Class',
        subject: 'built:Subject',
        experimentTopic: 'built:Practical Experiment Topic',
        teacher: 'built:Supervising Teacher'
      },
      owner_library_catalog: {
        isbn: 'built:ISBN',
        title: 'built:Book Title & Author',
        author: 'built:Book Title & Author',
        category: 'built:Category / Genre',
        genre: 'built:Category / Genre',
        academicGradeLevel: 'built:Grade Level',
        rackNo: 'built:Rack Location',
        totalCopies: 'built:Copies (Avail / Total)',
        availableCopies: 'built:Copies (Avail / Total)'
      },
      library_circulation: {
        issueNo: 'built:Issue #',
        bookTitle: 'built:Book Title',
        isbn: 'built:ISBN',
        borrowerName: 'built:Borrower',
        borrowerId: 'built:Borrower',
        gradeOrDept: 'built:Class / Dept',
        dueDate: 'built:Due Date',
        fineAmount: 'built:Fine',
        status: 'built:Status'
      },
      slc_certificates: {
        certificateNo: 'built:Certificate No.',
        studentName: 'built:Student Name',
        grade: 'built:Class',
        admissionDate: 'built:Admission Date',
        leavingDate: 'built:Leaving Date',
        reasonForLeaving: 'built:Reason for Leaving',
        conductRating: 'built:Conduct & Standing',
        achievement: 'built:Achievement',
        status: 'built:Status'
      },
      campus_notices_feed: {
        feed_target: 'built:Target & Urgency',
        feed_priority: 'built:Target & Urgency',
        feed_title: 'built:Notice Title',
        feed_body: 'built:Notice Content'
      },
      owner_medical: {
        rollNo: 'built:Roll #',
        studentName: 'built:Student',
        grade: 'built:Student',
        bloodGroup: 'built:Blood Group',
        vaccinationStatus: 'built:Vaccination',
        allergies: 'built:Allergies',
        chronicConditions: 'built:Chronic Conditions',
        emergencyContact: 'built:Emergency',
        doctorName: 'built:Physician'
      },
      owner_discipline: {
        rollNo: 'built:Student',
        studentName: 'built:Student',
        grade: 'built:Student',
        category: 'built:Category',
        severity: 'built:Severity',
        description: 'built:Description',
        actionTaken: 'built:Action Taken',
        fineAmount: 'built:Fine',
        status: 'built:Status'
      },
      owner_payroll: {
        staffName: 'built:Staff Member',
        role: 'built:Staff Member',
        month: 'built:Month',
        baseSalary: 'built:Base Salary',
        allowances: 'built:Allowances',
        deductions: 'built:Deductions',
        status: 'built:Status'
      },
      owner_staff_leaves: {
        staffName: 'built:Staff Member',
        leaveType: 'built:Leave Type',
        fromDate: 'built:Dates',
        toDate: 'built:Dates',
        totalDays: 'built:Days',
        reason: 'built:Reason',
        status: 'built:Status'
      },
      fee_challans_invoices: {
        ch_student: 'built:Student',
        ch_amounts: 'built:Due Date',
        invoiceNo: 'built:Invoice #',
        type: 'built:Challan Type',
        recipientName: 'built:Student / Recipient',
        title: 'built:Billing Title',
        issueDate: 'built:Due Date',
        dueDate: 'built:Due Date',
        amount: 'built:Net Payable',
        discount: 'built:Net Payable',
        status: 'built:Status'
      },
      fee_receipts_cashiering: {
        fee_student: 'built:Student Details',
        fee_payment: 'built:Fee & Channel',
        fee_notes: 'built:Ref / Notes'
      }
    };

    if (extraAnchorMaps[canonical]?.[key]) {
      return extraAnchorMaps[canonical][key];
    }

    const anchors = SCHOOL_FORM_FIELD_ANCHORS[canonical] || SCHOOL_FORM_FIELD_ANCHORS[tableId] || [];
    const matchedAnchor = anchors.find((a) => a.key === key);
    if (matchedAnchor) {
      const headers = this.getDetectedHeadersForTable(canonical);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const targetNorm = norm(matchedAnchor.label);
      const exact = headers.find((h) => norm(h.originalLabel) === targetNorm);
      if (exact) return `built:${exact.originalLabel}`;
      const targetWords = targetNorm.split(' ').filter((w) => w.length > 2);
      const partial = headers.find((h) => {
        const hn = norm(h.originalLabel);
        return hn.includes(targetNorm) || targetNorm.includes(hn) || (targetWords.length > 0 && targetWords.some((w) => hn.includes(w)));
      });
      if (partial) return `built:${partial.originalLabel}`;
    }

    return '__last__';
  }

  mapTableColumnToFormAnchor(tableId: string, colPos: string): string {
    const canonical = this.resolveCanonicalTableId(tableId);
    const raw = (colPos || '').trim();
    if (!raw || raw === '__last__' || raw === '__bottom__') return '__last__';
    if (raw === '__first__') return '__first__';
    if (raw.startsWith('custom:')) return raw;

    const headerLabel = raw.startsWith('built:') ? raw.slice(6).trim() : raw;
    const anchors = SCHOOL_FORM_FIELD_ANCHORS[canonical] || SCHOOL_FORM_FIELD_ANCHORS[tableId] || [];
    if (anchors.length === 0) return '__last__';

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const targetNorm = norm(headerLabel);

    for (const a of anchors) {
      const mapped = this.mapFormAnchorToTableColumn(canonical, a.key);
      if (mapped.startsWith('built:') && norm(mapped.slice(6)) === targetNorm) {
        return a.key;
      }
    }

    const exactAnchor = anchors.find((a) => norm(a.label) === targetNorm);
    if (exactAnchor) return exactAnchor.key;

    const words = targetNorm.split(' ').filter((w) => w.length > 2);
    const partialAnchor = anchors.find((a) => {
      const an = norm(a.label);
      return an.includes(targetNorm) || targetNorm.includes(an) || (words.length > 0 && words.some((w) => an.includes(w)));
    });
    return partialAnchor ? partialAnchor.key : '__last__';
  }

  addCustomColumn(
    tableId: string,
    label: string,
    type: CustomColumnType = 'text',
    defaultValue: string = '',
    optionsRaw?: string[] | string,
    required: boolean = false,
    insertAfterColumn: string = '__last__',
    insertAfterFormField: string = '__last__',
    scope: 'table' | 'form' | 'both' = 'both'
  ): SchoolCustomColumn | null {
    if (!this.isOwner()) return null;
    const cleanLabel = (label || '').trim();
    if (!cleanLabel) return null;
    const parsedOptions = Array.isArray(optionsRaw)
      ? optionsRaw.map((o) => o.trim()).filter(Boolean)
      : typeof optionsRaw === 'string'
        ? optionsRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
    const cleanColPos = (insertAfterColumn || '__last__').trim() || '__last__';
    const cleanFormPos = (insertAfterFormField || '__last__').trim() || '__last__';
    const col: SchoolCustomColumn = {
      id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: cleanLabel,
      type,
      defaultValue: String(defaultValue ?? ''),
      ...(parsedOptions && parsedOptions.length > 0 ? { options: parsedOptions } : {}),
      ...(required ? { required: true } : {}),
      insertAfterColumn: cleanColPos,
      insertAfterFormField: cleanFormPos,
      scope
    };
    const canonical = this.mutateSchema(tableId, (schema) => ({
      ...schema,
      customColumns: [...schema.customColumns, col]
    }));
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));

    // Bidirectional mirror between Admissions Form and Students Master Directory
    if (canonical === 'owner_admissions' || canonical === 'students_master') {
      const siblingTableId = canonical === 'owner_admissions' ? 'students_master' : 'owner_admissions';
      const mappedColPos = cleanFormPos !== '__last__'
        ? this.mapFormAnchorToTableColumn(siblingTableId, cleanFormPos)
        : cleanColPos;
      const mappedFormPos = cleanColPos !== '__last__' && cleanFormPos === '__last__'
        ? this.mapTableColumnToFormAnchor(siblingTableId, cleanColPos)
        : cleanFormPos;
      const siblingCol: SchoolCustomColumn = {
        ...col,
        insertAfterColumn: mappedColPos,
        insertAfterFormField: mappedFormPos,
        scope: 'both'
      };
      this.mutateSchema(siblingTableId, (sibSchema) => {
        if (sibSchema.customColumns.some((c) => c.id === siblingCol.id)) return sibSchema;
        return {
          ...sibSchema,
          customColumns: [...sibSchema.customColumns, siblingCol]
        };
      });
      void this.backend.saveSchoolTableSchema(siblingTableId, this.getSchema(siblingTableId));
    }

    return col;
  }

  updateCustomColumn(
    tableId: string,
    colId: string,
    updates: {
      label?: string;
      type?: CustomColumnType;
      defaultValue?: string;
      options?: string[];
      required?: boolean;
      insertAfterColumn?: string;
      insertAfterFormField?: string;
    }
  ): boolean {
    if (!this.isOwner()) return false;
    const canonical = this.mutateSchema(tableId, (schema) => ({
      ...schema,
      customColumns: schema.customColumns.map((col) =>
        col.id === colId
          ? {
              ...col,
              label: updates.label !== undefined && updates.label.trim() ? updates.label.trim() : col.label,
              type: updates.type ?? col.type,
              defaultValue: updates.defaultValue !== undefined ? updates.defaultValue : col.defaultValue,
              options: updates.options !== undefined ? updates.options : col.options,
              required: updates.required !== undefined ? updates.required : col.required,
              insertAfterColumn: updates.insertAfterColumn !== undefined
                ? (updates.insertAfterColumn.trim() || '__last__')
                : (col.insertAfterColumn || '__last__'),
              insertAfterFormField: updates.insertAfterFormField !== undefined
                ? (updates.insertAfterFormField.trim() || '__last__')
                : (col.insertAfterFormField || '__last__')
            }
          : col
      )
    }));
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));

    if (canonical === 'owner_admissions' || canonical === 'students_master') {
      const siblingTableId = canonical === 'owner_admissions' ? 'students_master' : 'owner_admissions';
      const sibling = this.getSchema(siblingTableId);
      if (sibling.customColumns.some((c) => c.id === colId)) {
        const mappedColPos = updates.insertAfterColumn !== undefined
          ? updates.insertAfterColumn.trim() || '__last__'
          : (updates.insertAfterFormField !== undefined
            ? this.mapFormAnchorToTableColumn(siblingTableId, updates.insertAfterFormField)
            : undefined);
        const mappedFormPos = updates.insertAfterFormField !== undefined
          ? updates.insertAfterFormField.trim() || '__last__'
          : (updates.insertAfterColumn !== undefined
            ? this.mapTableColumnToFormAnchor(siblingTableId, updates.insertAfterColumn)
            : undefined);
        this.mutateSchema(siblingTableId, (sibSchema) => ({
          ...sibSchema,
          customColumns: sibSchema.customColumns.map((col) =>
            col.id === colId
              ? {
                  ...col,
                  label: updates.label !== undefined && updates.label.trim() ? updates.label.trim() : col.label,
                  type: updates.type ?? col.type,
                  defaultValue: updates.defaultValue !== undefined ? updates.defaultValue : col.defaultValue,
                  options: updates.options !== undefined ? updates.options : col.options,
                  ...(mappedColPos ? { insertAfterColumn: mappedColPos } : {}),
                  ...(mappedFormPos ? { insertAfterFormField: mappedFormPos } : {})
                }
              : col
          )
        }));
        void this.backend.saveSchoolTableSchema(siblingTableId, this.getSchema(siblingTableId));
      }
    }

    return true;
  }

  deleteCustomColumn(tableId: string, colId: string): void {
    if (!this.isOwner()) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const nextCells: Record<string, Record<string, string>> = {};
      for (const [rk, rowMap] of Object.entries(schema.customCells)) {
        if (!rowMap || typeof rowMap !== 'object') continue;
        const copy = { ...rowMap };
        delete copy[colId];
        if (Object.keys(copy).length > 0) {
          nextCells[rk] = copy;
        }
      }
      const nextRows = (schema.customRows || []).map((r) => {
        const vals = { ...(r.values || {}) };
        delete vals[colId];
        return { ...r, values: vals };
      });
      return {
        ...schema,
        customColumns: schema.customColumns.filter((c) => c.id !== colId),
        customRows: nextRows,
        customCells: nextCells
      };
    });
    void this.backend.deleteSchoolTableColumn(canonical, colId);

    if (canonical === 'owner_admissions' || canonical === 'students_master') {
      const siblingTableId = canonical === 'owner_admissions' ? 'students_master' : 'owner_admissions';
      const sibling = this.getSchema(siblingTableId);
      if (sibling.customColumns.some((c) => c.id === colId)) {
        this.mutateSchema(siblingTableId, (sibSchema) => ({
          ...sibSchema,
          customColumns: sibSchema.customColumns.filter((c) => c.id !== colId)
        }));
        void this.backend.deleteSchoolTableColumn(siblingTableId, colId);
      }
    }
  }

  deleteAllCustomColumns(tableId: string, scopeOnly?: 'table' | 'form'): void {
    if (!this.isOwner()) return;
    const cur = this.getSchema(tableId);
    const removedIds = new Set(
      cur.customColumns
        .filter((c) => !scopeOnly || !c.scope || c.scope === scopeOnly || c.scope === 'both')
        .map((c) => c.id)
    );
    const canonical = this.mutateSchema(tableId, (schema) => {
      const nextRows = (schema.customRows || []).map((r) => {
        const vals: Record<string, string> = {};
        for (const [k, v] of Object.entries(r.values || {})) {
          if (!removedIds.has(k)) vals[k] = v;
        }
        return { ...r, values: vals };
      });
      const nextCells: Record<string, Record<string, string>> = {};
      for (const [rk, rowMap] of Object.entries(schema.customCells || {})) {
        if (!rowMap || typeof rowMap !== 'object') continue;
        const copy: Record<string, string> = {};
        for (const [cid, val] of Object.entries(rowMap)) {
          if (!removedIds.has(cid)) copy[cid] = val;
        }
        if (Object.keys(copy).length > 0) nextCells[rk] = copy;
      }
      return {
        ...schema,
        customColumns: schema.customColumns.filter((c) => !removedIds.has(c.id)),
        customCells: nextCells,
        customRows: nextRows
      };
    });
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));

    if ((canonical === 'owner_admissions' || canonical === 'students_master') && removedIds.size > 0) {
      const siblingTableId = canonical === 'owner_admissions' ? 'students_master' : 'owner_admissions';
      this.mutateSchema(siblingTableId, (sibSchema) => ({
        ...sibSchema,
        customColumns: sibSchema.customColumns.filter((c) => !removedIds.has(c.id))
      }));
      void this.backend.saveSchoolTableSchema(siblingTableId, this.getSchema(siblingTableId));
    }
  }

  setCustomCellValue(tableId: string, rowKey: string, colId: string, value: string): void {
    if (!this.isOwner()) return;
    const cleanKey = (rowKey || '').trim();
    if (!cleanKey) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const nextCells = { ...schema.customCells };
      const existingRow = { ...(nextCells[cleanKey] || {}) };
      existingRow[colId] = String(value ?? '');
      nextCells[cleanKey] = existingRow;

      // Also sync if this rowKey is a customRow
      const nextCustomRows = (schema.customRows || []).map((r) =>
        r.rowKey === cleanKey ? { ...r, values: { ...r.values, [colId]: String(value ?? '') } } : r
      );

      return { ...schema, customCells: nextCells, customRows: nextCustomRows };
    });
    void this.backend.updateSchoolTableRow(canonical, cleanKey, {
      values: { [colId]: String(value ?? '') },
      upsertRow: false
    });
  }

  deleteCustomCellValue(tableId: string, rowKey: string, colId: string): void {
    if (!this.isOwner()) return;
    const cleanKey = (rowKey || '').trim();
    if (!cleanKey || !colId) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const nextCells = { ...schema.customCells };
      if (nextCells[cleanKey]) {
        const copy = { ...nextCells[cleanKey] };
        delete copy[colId];
        if (Object.keys(copy).length > 0) nextCells[cleanKey] = copy;
        else delete nextCells[cleanKey];
      }
      const nextRows = (schema.customRows || []).map((r) => {
        if (r.rowKey !== cleanKey) return r;
        const vals = { ...(r.values || {}) };
        delete vals[colId];
        return { ...r, values: vals };
      });
      return { ...schema, customCells: nextCells, customRows: nextRows };
    });
    void this.backend.deleteSchoolTableCell(canonical, cleanKey, colId);
  }

  /**
   * Called when ANY form (built-in or portal work form) is submitted by Owner or any authorized portal role
   * (Principal, Teacher, Accountant, Parent, Student).
   * Persists custom field inputs directly to SQLite + Firestore and links them to the table row.
   */
  submitFormCustomInputs(
    tableId: string,
    rowKeys: string | string[],
    values: Record<string, string> | undefined | null,
    meta?: { rowLabel?: string; submittedByName?: string; submittedByRole?: string }
  ): void {
    if (!values || typeof values !== 'object') return;
    const entries = Object.entries(values).filter(
      ([k, v]) => k && v !== undefined && v !== null && String(v).trim() !== ''
    );
    if (entries.length === 0) return;

    const keys = (Array.isArray(rowKeys) ? rowKeys : [rowKeys])
      .map((k) => String(k || '').trim())
      .filter(Boolean);
    if (keys.length === 0) return;

    const cleanValues: Record<string, string> = {};
    for (const [k, v] of entries) cleanValues[k] = String(v).trim();

    const canonical = this.resolveCanonicalTableId(tableId);
    const now = new Date().toISOString();
    const submittedByName = meta?.submittedByName || this.portalRole();
    const submittedByRole = meta?.submittedByRole || this.portalRole();

    this.mutateSchema(canonical, (schema) => {
      const nextCells = { ...schema.customCells };
      const nextMeta = { ...(schema.cellMeta || {}) };
      for (const rk of keys) {
        nextCells[rk] = { ...(nextCells[rk] || {}), ...cleanValues };
        nextMeta[rk] = { ...(nextMeta[rk] || {}) };
        for (const colId of Object.keys(cleanValues)) {
          nextMeta[rk][colId] = { submittedByName, submittedByRole, updatedAt: now };
        }
      }
      return { ...schema, customCells: nextCells, cellMeta: nextMeta };
    });

    void this.backend.submitSchoolTableRows(canonical, {
      cellsOnly: true,
      submittedByName,
      submittedByRole,
      rows: keys.map((rk) => ({
        rowKey: rk,
        rowLabel: meta?.rowLabel || rk,
        values: cleanValues,
        isStandaloneRow: false
      }))
    });
  }

  /**
   * Owner adds one or more custom rows (from the Multi-Row Universal Form or Column/Form Studio).
   */
  addCustomRowsBatch(
    tableId: string,
    draftRows: Array<{ values: Record<string, string>; rowLabel?: string; insertAfterRowKey?: string }>,
    actorName = 'School Business Owner',
    defaultInsertAfterRowKey = '__first__'
  ): number {
    if (!this.isOwner() || !Array.isArray(draftRows) || draftRows.length === 0) return 0;
    const canonical = this.resolveCanonicalTableId(tableId);
    const now = new Date().toISOString();
    const fallbackPos = (defaultInsertAfterRowKey || '__first__').trim() || '__first__';

    const prepared: SchoolCustomRow[] = draftRows
      .map((d, idx) => {
        const cleanVals: Record<string, string> = {};
        for (const [k, v] of Object.entries(d.values || {})) {
          cleanVals[k] = String(v ?? '').trim();
        }
        const firstNonEmpty = Object.values(cleanVals).find((v) => v.length > 0) || `Custom Row ${idx + 1}`;
        const rowKey = `crow_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`;
        const rowPos = (d.insertAfterRowKey || fallbackPos).trim() || '__first__';
        return {
          rowKey,
          rowLabel: d.rowLabel || firstNonEmpty,
          insertAfterRowKey: rowPos,
          values: cleanVals,
          submittedByName: actorName,
          submittedByRole: 'owner',
          createdAt: now
        };
      })
      .filter((r) => Object.values(r.values).some((v) => v !== ''));

    if (prepared.length === 0) return 0;

    this.mutateSchema(canonical, (schema) => {
      const nextCells = { ...schema.customCells };
      for (const r of prepared) {
        const colEntries: Record<string, string> = {};
        for (const [k, v] of Object.entries(r.values)) {
          if (k.startsWith('col_') && v !== '') colEntries[k] = v;
        }
        if (Object.keys(colEntries).length > 0) {
          nextCells[r.rowKey] = colEntries;
        }
      }
      return {
        ...schema,
        customRows: [...prepared, ...(schema.customRows || [])],
        customCells: nextCells
      };
    });

    void this.backend.submitSchoolTableRows(canonical, {
      submittedByName: actorName,
      submittedByRole: 'owner',
      rows: prepared.map((r) => ({
        rowKey: r.rowKey,
        rowLabel: r.rowLabel,
        insertAfterRowKey: r.insertAfterRowKey,
        values: r.values,
        isStandaloneRow: true
      }))
    });

    return prepared.length;
  }

  updateCustomRow(
    tableId: string,
    rowKey: string,
    values: Record<string, string>,
    rowLabel?: string,
    insertAfterRowKey?: string
  ): void {
    if (!this.isOwner() || !rowKey) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const nextRows = (schema.customRows || []).map((r) =>
        r.rowKey === rowKey
          ? {
              ...r,
              rowLabel: rowLabel ?? r.rowLabel,
              insertAfterRowKey: insertAfterRowKey !== undefined ? (insertAfterRowKey.trim() || '__first__') : r.insertAfterRowKey,
              values: { ...values }
            }
          : r
      );
      const nextCells = { ...schema.customCells };
      const colCells: Record<string, string> = { ...(nextCells[rowKey] || {}) };
      for (const [k, v] of Object.entries(values)) {
        if (k.startsWith('col_')) colCells[k] = String(v ?? '');
      }
      if (Object.keys(colCells).length > 0) nextCells[rowKey] = colCells;
      return { ...schema, customRows: nextRows, customCells: nextCells };
    });
    void this.backend.updateSchoolTableRow(canonical, rowKey, {
      values,
      rowLabel,
      ...(insertAfterRowKey !== undefined ? { insertAfterRowKey: insertAfterRowKey.trim() || '__first__' } : {}),
      upsertRow: true
    });
  }

  deleteCustomRow(tableId: string, rowKey: string): void {
    if (!this.isOwner() || !rowKey) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const nextCells = { ...schema.customCells };
      delete nextCells[rowKey];
      const nextMeta = { ...(schema.cellMeta || {}) };
      delete nextMeta[rowKey];
      return {
        ...schema,
        customRows: (schema.customRows || []).filter((r) => r.rowKey !== rowKey),
        customCells: nextCells,
        cellMeta: nextMeta
      };
    });
    void this.backend.deleteSchoolTableRow(canonical, rowKey);
  }

  clearRowCustomData(tableId: string, rowKeys: string | string[]): void {
    if (!this.isOwner()) return;
    const keys = (Array.isArray(rowKeys) ? rowKeys : [rowKeys])
      .map((k) => String(k || '').trim())
      .filter(Boolean);
    if (keys.length === 0) return;

    const canonical = this.resolveCanonicalTableId(tableId);
    const cur = this.getSchema(canonical);
    let touched = false;
    for (const rk of keys) {
      if (cur.customCells[rk] || (cur.customRows || []).some((r) => r.rowKey === rk)) {
        touched = true;
        break;
      }
    }
    if (!touched) return;

    const keySet = new Set(keys);
    this.mutateSchema(canonical, (schema) => {
      const nextCells = { ...schema.customCells };
      const nextMeta = { ...(schema.cellMeta || {}) };
      for (const rk of keys) {
        delete nextCells[rk];
        delete nextMeta[rk];
      }
      return {
        ...schema,
        customRows: (schema.customRows || []).filter((r) => !keySet.has(r.rowKey)),
        customCells: nextCells,
        cellMeta: nextMeta
      };
    });

    for (const rk of keys) {
      void this.backend.deleteSchoolTableRow(canonical, rk);
    }
  }

  resetTableSchema(tableId: string): void {
    if (!this.isOwner()) return;
    const canonical = this.resolveCanonicalTableId(tableId);
    const next = { ...this.schemas() };
    delete next[canonical];
    delete next[tableId];
    this.schemas.set(next);
    this.persistAll();
    this.schemaRevision.update((n) => n + 1);
    void this.backend.deleteSchoolTableSchema(canonical);
  }

  getPortalRoleLabel(): string {
    switch (this.portalRole()) {
      case 'owner':
        return 'School Owner Portal';
      case 'principal':
        return 'Principal Portal';
      case 'teacher':
        return 'Teacher Portal';
      case 'student':
        return 'Student Portal';
      case 'parent':
        return 'Parent Portal';
      case 'accountant':
        return 'Accountant Portal';
      default:
        return 'School Portal';
    }
  }

  private extractCellExportText(td: HTMLElement): string {
    const inputEl = td.querySelector('input, select, textarea') as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | null;
    if (inputEl) {
      if (typeof HTMLSelectElement !== 'undefined' && inputEl instanceof HTMLSelectElement) {
        const txt = inputEl.options[inputEl.selectedIndex]?.text || inputEl.value || '';
        if (txt.trim()) return txt.replace(/\s+/g, ' ').trim();
      } else if (typeof HTMLInputElement !== 'undefined' && inputEl instanceof HTMLInputElement && inputEl.type === 'checkbox') {
        return inputEl.checked ? 'Yes' : 'No';
      } else if ((inputEl.value || '').trim()) {
        return inputEl.value.replace(/\s+/g, ' ').trim();
      }
    }
    const clone = td.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-scs-ignore-export]').forEach((n) => n.remove());
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }

  private extractVisibleTableData(tableId: string, fallbackTitle?: string): {
    title: string;
    roleLabel: string;
    roleSlug: string;
    safeBaseName: string;
    headers: string[];
    rows: string[][];
    cards: PdfGenericCardEntry[];
  } | null {
    const entry = this.tableRegistry.get(tableId);
    if (!entry) return null;
    const { tableEl, title: regTitle } = entry;
    const schema = this.getSchema(tableId);
    const title = (schema.customTitle || fallbackTitle || regTitle || tableId.replace(/_/g, ' ')).trim();
    const roleLabel = this.getPortalRoleLabel();
    const roleSlug = this.portalRole() || 'school';
    const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || tableId;
    const dateStamp = new Date().toISOString().slice(0, 10);
    const safeBaseName = `${roleSlug}_${safeName}_${dateStamp}`;

    const headerRow = tableEl.querySelector('thead tr');
    const keptColIndices: number[] = [];
    const headers: string[] = [];
    const skipHeaderLabels = new Set(['actions', 'action', 'quick actions', 'remove', 'scope action', 'focus', 'manage']);

    if (headerRow) {
      Array.from(headerRow.children).forEach((th, idx) => {
        const el = th as HTMLElement;
        if (el.style.display === 'none') return;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (skipHeaderLabels.has(text.toLowerCase())) return;
        keptColIndices.push(idx);
        headers.push(text || `Column ${idx + 1}`);
      });
    }

    const rows: string[][] = [];
    const cards: PdfGenericCardEntry[] = [];
    const bodyRows = Array.from(tableEl.querySelectorAll('tbody tr')) as HTMLTableRowElement[];

    bodyRows.forEach((tr) => {
      if (tr.hasAttribute('data-scs-row-detail')) return;
      const cells = Array.from(tr.children) as HTMLElement[];
      if (cells.length === 1 && (cells[0].hasAttribute('colspan') || cells[0].hasAttribute('data-scs-empty-row'))) {
        return;
      }

      const rowValues: string[] = [];
      const cardFields: Array<{ label: string; value: string }> = [];

      if (keptColIndices.length > 0) {
        keptColIndices.forEach((colIdx, hPos) => {
          const td = cells[colIdx];
          if (!td || td.style.display === 'none') {
            rowValues.push('');
            return;
          }
          const val = this.extractCellExportText(td);
          rowValues.push(val);
          cardFields.push({
            label: headers[hPos] || `Field ${hPos + 1}`,
            value: val || '-'
          });
        });
      } else {
        cells.forEach((td, idx) => {
          if (td.style.display === 'none') return;
          const val = this.extractCellExportText(td);
          rowValues.push(val);
          cardFields.push({
            label: `Field ${idx + 1}`,
            value: val || '-'
          });
        });
      }

      if (rowValues.length === 0) return;
      rows.push(rowValues);

      const resolvedLabel = (tr.getAttribute('data-scs-resolved-label') || '').trim();
      const nonEmptyVals = rowValues.filter((v) => v && v !== '—' && v !== '-');
      const cardTitle = resolvedLabel || nonEmptyVals[0] || `Record #${rows.length}`;
      const statusField = cardFields.find((f) => /status|grade|result|fee|state/i.test(f.label));

      cards.push({
        title: cardTitle,
        subtitle: `${roleLabel} | ${title} | Record #${rows.length}`,
        badgeText: statusField?.value && statusField.value !== '-' ? statusField.value : `#${rows.length}`,
        fields: cardFields
      });
    });

    return {
      title,
      roleLabel,
      roleSlug,
      safeBaseName,
      headers,
      rows,
      cards
    };
  }

  setPrintBranding(config: SchoolPrintBrandingConfig | null | undefined): void {
    const normalized = normalizeSchoolPrintBranding(config, config?.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName);
    this.printBranding.set(normalized);
  }

  requestOpenPrintStudio(docType: SchoolPrintDocumentType = 'table_statement', tableId?: string): void {
    const cleanId = String(tableId || '').trim().replace(/_single_record$/, '');
    const canonical = cleanId ? this.resolveCanonicalTableId(cleanId) : '';
    const nextSeq = (this.printStudioJumpRequest()?.seq || 0) + 1;
    this.printStudioJumpRequest.set({
      docType,
      tableId: canonical || cleanId || undefined,
      seq: nextSeq
    });
  }

  clearPrintStudioJumpRequest(): void {
    if (this.printStudioJumpRequest()) {
      this.printStudioJumpRequest.set(null);
    }
  }

  getPdfBranding(tableId?: string): PdfBrandingOptions {
    const cleanId = String(tableId || '').trim().replace(/_single_record$/, '');
    const eff = cleanId
      ? resolveEffectiveTableBranding(this.printBranding(), cleanId, this.resolveCanonicalTableId(cleanId))
      : resolveEffectiveTableBranding(this.printBranding());
    const b = eff.branding;
    return {
      schoolName: b.schoolName || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName,
      headerAccentColor: b.headerAccentColor || DEFAULT_SCHOOL_PRINT_BRANDING.headerAccentColor,
      footerNote: b.footerNote || DEFAULT_SCHOOL_PRINT_BRANDING.footerNote
    };
  }

  registerStatementDataProvider(tableId: string, provider: () => StatementDataset | null): void {
    const clean = (tableId || '').trim();
    if (!clean) return;
    this.statementProviders.set(clean, provider);
  }

  unregisterStatementDataProvider(tableId: string): void {
    const clean = (tableId || '').trim();
    if (!clean) return;
    this.statementProviders.delete(clean);
  }

  openStatementModal(
    tableId: string,
    fallbackTitle?: string,
    opts?: {
      presetFromDate?: string;
      presetToDate?: string;
      presetSearch?: string;
      initialFormat?: 'a4' | '80mm' | '58mm' | 'card' | 'whatsapp';
    }
  ): void {
    const cleanId = (tableId || '').trim();
    if (!cleanId) return;
    const schema = this.getSchema(cleanId);
    const entry = this.tableRegistry.get(cleanId);
    const resolvedTitle = (schema.customTitle || fallbackTitle || entry?.title || cleanId.replace(/_/g, ' ')).trim();
    const eff = resolveEffectiveTableBranding(this.printBranding(), cleanId, this.resolveCanonicalTableId(cleanId));
    const initialFormat = opts?.initialFormat || eff.defaultFormat || 'a4';
    this.statementModalState.set({
      open: true,
      tableId: cleanId,
      title: resolvedTitle,
      presetFromDate: opts?.presetFromDate || '',
      presetToDate: opts?.presetToDate || '',
      presetSearch: opts?.presetSearch || '',
      initialFormat,
      directDataset: null
    });
  }

  openDirectStatement(
    dataset: StatementDataset,
    opts?: {
      presetFromDate?: string;
      presetToDate?: string;
      presetSearch?: string;
      initialFormat?: 'a4' | '80mm' | '58mm' | 'card' | 'whatsapp';
    }
  ): void {
    const rawId = (dataset.tableId || 'custom_statement').replace(/_single_record$/, '');
    const eff = resolveEffectiveTableBranding(this.printBranding(), rawId, this.resolveCanonicalTableId(rawId));
    this.statementModalState.set({
      open: true,
      tableId: dataset.tableId || 'custom_statement',
      title: dataset.title || 'School Statement',
      presetFromDate: opts?.presetFromDate || '',
      presetToDate: opts?.presetToDate || '',
      presetSearch: opts?.presetSearch || '',
      initialFormat: opts?.initialFormat || eff.defaultFormat || 'a4',
      directDataset: dataset
    });
  }

  openSingleRecordStatement(opts: {
    tableId: string;
    tableTitle: string;
    recordLabel?: string;
    headers: string[];
    values: string[];
    initialFormat?: 'a4' | '80mm' | '58mm' | 'card' | 'whatsapp';
  }): void {
    const cleanTitle = (opts.tableTitle || opts.tableId || 'Record Slip').trim();
    const label = (opts.recordLabel || '').trim();
    const title = label && !cleanTitle.toLowerCase().includes(label.toLowerCase())
      ? `${cleanTitle} — ${label}`
      : cleanTitle;
    const cleanId = (opts.tableId || '').trim();
    const eff = resolveEffectiveTableBranding(this.printBranding(), cleanId, this.resolveCanonicalTableId(cleanId));
    this.openDirectStatement(
      {
        tableId: `${opts.tableId}_single_record`,
        title,
        subtitle: `Individual Record Print · ${cleanTitle}`,
        roleLabel: this.getPortalRoleLabel(),
        headers: opts.headers,
        rows: [opts.values]
      },
      {
        initialFormat: opts.initialFormat || eff.defaultFormat || 'a4'
      }
    );
  }

  closeStatementModal(): void {
    const cur = this.statementModalState();
    if (cur.open) {
      this.statementModalState.set({ ...cur, open: false });
    }
  }

  resolveStatementDataset(
    tableId: string,
    fallbackTitle?: string,
    directOverride?: StatementDataset | null
  ): {
    tableId: string;
    title: string;
    subtitle: string;
    roleLabel: string;
    safeBaseName: string;
    headers: string[];
    rows: string[][];
    dateColHint?: number;
  } | null {
    const roleLabel = this.getPortalRoleLabel();
    const roleSlug = this.portalRole() || 'school';
    const dateStamp = new Date().toISOString().slice(0, 10);

    const buildBaseName = (title: string, id: string) => {
      const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || id;
      return `${roleSlug}_${safeName}_${dateStamp}`;
    };

    if (directOverride && directOverride.headers.length > 0) {
      const title = (directOverride.title || fallbackTitle || 'Statement').trim();
      return {
        tableId: directOverride.tableId || tableId,
        title,
        subtitle: directOverride.subtitle || roleLabel,
        roleLabel: directOverride.roleLabel || roleLabel,
        safeBaseName: buildBaseName(title, directOverride.tableId || tableId),
        headers: directOverride.headers,
        rows: directOverride.rows,
        dateColHint: directOverride.dateColHint
      };
    }

    const canonical = this.resolveCanonicalTableId(tableId);
    const provider = this.statementProviders.get(tableId) || this.statementProviders.get(canonical);
    if (provider) {
      const supplied = provider();
      if (supplied && supplied.headers.length > 0) {
        const schema = this.getSchema(tableId);
        const title = (schema.customTitle || supplied.title || fallbackTitle || tableId.replace(/_/g, ' ')).trim();
        return {
          tableId,
          title,
          subtitle: supplied.subtitle || roleLabel,
          roleLabel: supplied.roleLabel || roleLabel,
          safeBaseName: buildBaseName(title, tableId),
          headers: supplied.headers,
          rows: supplied.rows,
          dateColHint: supplied.dateColHint
        };
      }
    }

    const extracted = this.extractVisibleTableData(tableId, fallbackTitle);
    if (!extracted) return null;
    return {
      tableId,
      title: extracted.title,
      subtitle: extracted.roleLabel,
      roleLabel: extracted.roleLabel,
      safeBaseName: extracted.safeBaseName,
      headers: extracted.headers,
      rows: extracted.rows
    };
  }

  exportTableCsv(tableId: string, fallbackTitle?: string): void {
    const extracted = this.extractVisibleTableData(tableId, fallbackTitle);
    if (!extracted || typeof document === 'undefined') return;
    const csvLines: string[][] = [];
    if (extracted.headers.length > 0) {
      csvLines.push(extracted.headers);
    }
    csvLines.push(...extracted.rows);
    const csv = csvLines
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extracted.safeBaseName}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  exportTablePdf(tableId: string, fallbackTitle?: string): void {
    const extracted = this.extractVisibleTableData(tableId, fallbackTitle);
    if (!extracted) return;
    const eff = resolveEffectiveTableBranding(this.printBranding(), tableId, this.resolveCanonicalTableId(tableId));
    const branding = this.getPdfBranding(tableId);
    const titleText = eff.customHeading || extracted.title;
    downloadStudentsTablePdf({
      title: `${titleText} (Row & Column Register)`,
      subtitle: `${extracted.roleLabel} | ${extracted.rows.length} Record(s) | ${extracted.headers.length} Column(s)`,
      headers: extracted.headers,
      rows: extracted.rows,
      filename: `${extracted.safeBaseName}_table.pdf`,
      footerLabel: `${branding.schoolName || 'SoftCode School ERP'} | ${extracted.roleLabel} | Table PDF`,
      emptyMessage: 'No records found in this table view.',
      branding
    });
  }

  exportTableCardsPdf(tableId: string, fallbackTitle?: string): void {
    const extracted = this.extractVisibleTableData(tableId, fallbackTitle);
    if (!extracted) return;
    const eff = resolveEffectiveTableBranding(this.printBranding(), tableId, this.resolveCanonicalTableId(tableId));
    const branding = this.getPdfBranding(tableId);
    const titleText = eff.customHeading || extracted.title;
    downloadTableCardsPdf({
      title: `${titleText} (Card / Widget-Wise)`,
      subtitle: `${extracted.roleLabel} | ${extracted.cards.length} Record Card(s) | ${extracted.headers.length} Field(s) Each`,
      cards: extracted.cards,
      filename: `${extracted.safeBaseName}_cards.pdf`,
      footerLabel: `${branding.schoolName || 'SoftCode School ERP'} | ${extracted.roleLabel} | Cards PDF`,
      emptyMessage: 'No records found in this table view.',
      branding
    });
  }

  getSummaryBadge(tableId: string, builtInCount: number): { hiddenCount: number; customCount: number; renamedCount: number; customRowCount: number } {
    const s = this.getSchema(tableId);
    return {
      hiddenCount: s.hiddenColumns.filter((i) => i < builtInCount).length,
      customCount: s.customColumns.length,
      renamedCount: Object.keys(s.renamedHeaders).length,
      customRowCount: (s.customRows || []).length
    };
  }

  private mutateSchema(tableId: string, updater: (cur: SchoolTableSchema) => SchoolTableSchema): string {
    const canonical = this.resolveCanonicalTableId(tableId);
    const cur = this.getSchema(canonical);
    const updated = updater(cur);
    const next = { ...this.schemas(), [canonical]: { ...updated, tableId: canonical } };
    if (tableId !== canonical && next[tableId]) {
      delete next[tableId];
    }
    this.schemas.set(next);
    this.persistAll();
    this.schemaRevision.update((n) => n + 1);
    return canonical;
  }

  private getScopedStorageKey(): string {
    let tid = this.activeTenantId;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('user_data') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.tenantId || parsed?.tenant_id) tid = String(parsed.tenantId || parsed.tenant_id).trim();
      }
    } catch {}
    return `${STORAGE_KEY_BASE}_${tid || 'default'}`;
  }

  private saveToLocalStorageOnly(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getScopedStorageKey(), JSON.stringify(this.schemas()));
      }
    } catch {}
  }

  private persistAll(): void {
    this.saveToLocalStorageOnly();
    if (this.persistHook) {
      try {
        this.persistHook();
      } catch {}
    }
  }

  private loadFromLocalStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(this.getScopedStorageKey());
      if (raw) {
        this.importSchemas(JSON.parse(raw));
      }
    } catch {}
  }
}
