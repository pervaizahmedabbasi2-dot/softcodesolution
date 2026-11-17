import { Injectable, computed, inject, signal } from '@angular/core';
import { BackendService } from '../../../services/backend.service';

export type SchoolTablePortalRole = 'owner' | 'principal' | 'teacher' | 'student' | 'parent' | 'accountant';
export type CustomColumnType = 'text' | 'number' | 'date' | 'badge' | 'select';

export interface SchoolCustomColumn {
  id: string;
  label: string;
  type: CustomColumnType;
  defaultValue: string;
  options?: string[];
  required?: boolean;
}

export interface SchoolCustomRow {
  rowKey: string;
  rowLabel?: string;
  values: Record<string, string>;
  submittedByName?: string;
  submittedByRole?: string;
  createdAt?: string;
}

export interface SchoolCellMeta {
  submittedByName?: string;
  submittedByRole?: string;
  updatedAt?: string;
}

export interface SchoolTableSchema {
  tableId: string;
  customTitle?: string;
  hiddenColumns: number[];
  hiddenColumnLabels: string[];
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
  principal_master_parents: 'parents_master',
  // Fee receipts & cashiering
  owner_overview_fee_cashiering: 'fee_receipts_cashiering',
  owner_overview_recent_payments: 'fee_receipts_cashiering',
  owner_payment_gateway: 'fee_receipts_cashiering',
  principal_master_cashiering: 'fee_receipts_cashiering',
  accountant_recent_receipts: 'fee_receipts_cashiering',
  accountant_posted_receipts: 'fee_receipts_cashiering',
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
  // SLC
  owner_audit_slc: 'slc_certificates',
  principal_slc: 'slc_certificates',
  // Library circulation
  owner_library_circulation: 'library_circulation',
  student_library_loans: 'library_circulation',
  // Academics & gradebook
  owner_marks_entry: 'academics_gradebook_results',
  owner_class_results: 'academics_gradebook_results',
  teacher_gradebook: 'academics_gradebook_results',
  student_academics: 'academics_gradebook_results',
  parent_academics: 'academics_gradebook_results',
  // Attendance & gate logs
  student_attendance_log: 'attendance_gate_logs',
  parent_gate_logs: 'attendance_gate_logs'
};

export const SCHOOL_TABLE_CATALOG: TableCatalogItem[] = [
  {
    tableId: 'students_master',
    canonicalId: 'students_master',
    title: 'Students Master Directory',
    portals: 'Owner, Principal',
    defaultHeaders: ['Student', 'Roll #', 'Grade', 'Guardian', 'Fee Status']
  },
  {
    tableId: 'owner_admissions',
    canonicalId: 'owner_admissions',
    title: 'Admissions & Enrollment Applications',
    portals: 'Owner, Principal',
    defaultHeaders: ['Applicant', 'Class Applied', 'Guardian', 'Phone', 'Score', 'Status']
  },
  {
    tableId: 'teachers_master',
    canonicalId: 'teachers_master',
    title: 'Teachers & Faculty Directory',
    portals: 'Owner, Principal',
    defaultHeaders: ['Emp ID', 'Faculty Name', 'Department', 'Subjects', 'Salary', 'Status']
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
    defaultHeaders: ['Challan / Invoice #', 'Student / Recipient', 'Title / Month', 'Amount', 'Status']
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
    defaultHeaders: ['Date', 'Cashier', 'Cash & Bank', 'Actual Collected', 'Approval Status']
  },
  {
    tableId: 'campus_notices_feed',
    canonicalId: 'campus_notices_feed',
    title: 'Campus Notices & Circulars Feed',
    portals: 'Owner, Teacher, Student, Parent',
    defaultHeaders: ['Title / Circular', 'Author', 'Target Class', 'Priority', 'Date']
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
    defaultHeaders: ['Absent Teacher', 'Substitute', 'Class & Subject', 'Period', 'Status']
  },
  {
    tableId: 'academics_gradebook_results',
    canonicalId: 'academics_gradebook_results',
    title: 'Gradebook Marks & Academic Results',
    portals: 'Owner, Teacher, Student, Parent',
    defaultHeaders: ['Student / Roll #', 'Subject', 'Obtained / Total', 'Grade']
  },
  {
    tableId: 'library_circulation',
    canonicalId: 'library_circulation',
    title: 'Library Book Circulation & Loans',
    portals: 'Owner, Student',
    defaultHeaders: ['Issue #', 'Book Title', 'Borrower', 'Due Date', 'Status']
  },
  {
    tableId: 'slc_certificates',
    canonicalId: 'slc_certificates',
    title: 'Student Leaving Certificates (SLC)',
    portals: 'Owner, Principal',
    defaultHeaders: ['Certificate #', 'Student', 'Father Name', 'Grade', 'Status']
  },
  {
    tableId: 'attendance_gate_logs',
    canonicalId: 'attendance_gate_logs',
    title: 'Gate & Biometric Attendance Logs',
    portals: 'Student, Parent',
    defaultHeaders: ['Date', 'Time', 'Member', 'Status', 'Gate']
  },
  {
    tableId: 'owner_expenses',
    canonicalId: 'owner_expenses',
    title: 'School Expenses & Vendor Bills',
    portals: 'Owner',
    defaultHeaders: ['Voucher / Ref', 'Category', 'Vendor / Payee', 'Amount', 'Status']
  },
  {
    tableId: 'owner_medical',
    canonicalId: 'owner_medical',
    title: 'Student Health & Medical Records',
    portals: 'Owner',
    defaultHeaders: ['Roll #', 'Student', 'Blood Group', 'Vaccination', 'Emergency']
  },
  {
    tableId: 'owner_discipline',
    canonicalId: 'owner_discipline',
    title: 'Disciplinary & Conduct Incident Log',
    portals: 'Owner',
    defaultHeaders: ['Student', 'Category', 'Severity', 'Action Taken', 'Status']
  },
  {
    tableId: 'owner_payroll',
    canonicalId: 'owner_payroll',
    title: 'Staff Payroll Register',
    portals: 'Owner',
    defaultHeaders: ['Staff Member', 'Month', 'Base Salary', 'Net Payable', 'Status']
  },
  {
    tableId: 'owner_staff_leaves',
    canonicalId: 'owner_staff_leaves',
    title: 'Staff Leave Applications',
    portals: 'Owner',
    defaultHeaders: ['Staff Member', 'Leave Type', 'Dates', 'Days', 'Status']
  },
  {
    tableId: 'owner_exams',
    canonicalId: 'owner_exams',
    title: 'Examinations & Datesheets',
    portals: 'Owner',
    defaultHeaders: ['Exam Title', 'Class', 'Start Date', 'Average GPA', 'Status']
  },
  {
    tableId: 'owner_timetable',
    canonicalId: 'owner_timetable',
    title: 'Class Timetable Roster',
    portals: 'Owner',
    defaultHeaders: ['Period', 'Time', 'Class', 'Subject', 'Teacher']
  },
  {
    tableId: 'owner_homework_log',
    canonicalId: 'owner_homework_log',
    title: 'Teacher Homework Assignments',
    portals: 'Teacher, Student, Parent',
    defaultHeaders: ['Title', 'Subject', 'Grade', 'Due Date']
  },
  {
    tableId: 'owner_student_leaves',
    canonicalId: 'owner_student_leaves',
    title: 'Parent Student Leave Requests',
    portals: 'Owner, Principal, Parent',
    defaultHeaders: ['Child', 'From', 'To', 'Reason', 'Status']
  }
];

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

  private activeTenantId = 'tenant-root-platform';
  private persistHook: (() => void) | null = null;
  private tableRegistry = new Map<string, { tableEl: HTMLTableElement; title: string; detectedHeaders: DetectedBuiltInHeader[] }>();

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
      detectedHeaders: prev?.detectedHeaders || []
    });
  }

  updateRegisteredHeaders(tableId: string, headers: DetectedBuiltInHeader[]): void {
    const prev = this.tableRegistry.get(tableId);
    if (prev) {
      prev.detectedHeaders = headers;
    }
  }

  unregisterTableElement(tableId: string): void {
    this.tableRegistry.delete(tableId);
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
              required: Boolean(c.required)
            }))
        : [],
      customRows: Array.isArray(v.customRows)
        ? v.customRows
            .filter((r: any) => r && r.rowKey)
            .map((r: any) => ({
              rowKey: String(r.rowKey),
              rowLabel: String(r.rowLabel || ''),
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
    if (!this.isOwner()) return;
    const headers = detectedHeaders && detectedHeaders.length > 0
      ? detectedHeaders
      : this.getDetectedHeadersForTable(tableId);
    this.rowFormModalState.set({
      open: true,
      tableId,
      tableTitle: tableTitle || tableId,
      detectedHeaders: headers
    });
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
      if (set.has(colIndex)) {
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

  addCustomColumn(
    tableId: string,
    label: string,
    type: CustomColumnType = 'text',
    defaultValue: string = '',
    optionsRaw?: string[] | string,
    required: boolean = false
  ): SchoolCustomColumn | null {
    if (!this.isOwner()) return null;
    const cleanLabel = (label || '').trim();
    if (!cleanLabel) return null;
    const parsedOptions = Array.isArray(optionsRaw)
      ? optionsRaw.map((o) => o.trim()).filter(Boolean)
      : typeof optionsRaw === 'string'
        ? optionsRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
    const col: SchoolCustomColumn = {
      id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: cleanLabel,
      type,
      defaultValue: String(defaultValue ?? ''),
      ...(parsedOptions && parsedOptions.length > 0 ? { options: parsedOptions } : {}),
      ...(required ? { required: true } : {})
    };
    const canonical = this.mutateSchema(tableId, (schema) => ({
      ...schema,
      customColumns: [...schema.customColumns, col]
    }));
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
    return col;
  }

  updateCustomColumn(
    tableId: string,
    colId: string,
    updates: { label?: string; type?: CustomColumnType; defaultValue?: string; options?: string[]; required?: boolean }
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
              required: updates.required !== undefined ? updates.required : col.required
            }
          : col
      )
    }));
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
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
  }

  deleteAllCustomColumns(tableId: string): void {
    if (!this.isOwner()) return;
    const cur = this.getSchema(tableId);
    const colIds = new Set(cur.customColumns.map((c) => c.id));
    const canonical = this.mutateSchema(tableId, (schema) => {
      const nextRows = (schema.customRows || []).map((r) => {
        const vals: Record<string, string> = {};
        for (const [k, v] of Object.entries(r.values || {})) {
          if (!colIds.has(k)) vals[k] = v;
        }
        return { ...r, values: vals };
      });
      return {
        ...schema,
        customColumns: [],
        customCells: {},
        customRows: nextRows
      };
    });
    void this.backend.saveSchoolTableSchema(canonical, this.getSchema(canonical));
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
    draftRows: Array<{ values: Record<string, string>; rowLabel?: string }>,
    actorName = 'School Business Owner'
  ): number {
    if (!this.isOwner() || !Array.isArray(draftRows) || draftRows.length === 0) return 0;
    const canonical = this.resolveCanonicalTableId(tableId);
    const now = new Date().toISOString();

    const prepared: SchoolCustomRow[] = draftRows
      .map((d, idx) => {
        const cleanVals: Record<string, string> = {};
        for (const [k, v] of Object.entries(d.values || {})) {
          cleanVals[k] = String(v ?? '').trim();
        }
        const firstNonEmpty = Object.values(cleanVals).find((v) => v.length > 0) || `Custom Row ${idx + 1}`;
        const rowKey = `crow_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`;
        return {
          rowKey,
          rowLabel: d.rowLabel || firstNonEmpty,
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
        values: r.values,
        isStandaloneRow: true
      }))
    });

    return prepared.length;
  }

  updateCustomRow(tableId: string, rowKey: string, values: Record<string, string>, rowLabel?: string): void {
    if (!this.isOwner() || !rowKey) return;
    const canonical = this.mutateSchema(tableId, (schema) => {
      const nextRows = (schema.customRows || []).map((r) =>
        r.rowKey === rowKey
          ? {
              ...r,
              rowLabel: rowLabel ?? r.rowLabel,
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
    void this.backend.updateSchoolTableRow(canonical, rowKey, { values, rowLabel, upsertRow: true });
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

  exportTableCsv(tableId: string, fallbackTitle?: string): void {
    const entry = this.tableRegistry.get(tableId);
    if (!entry) return;
    const { tableEl, title } = entry;
    const rows: string[][] = [];
    const headerRow = tableEl.querySelector('thead tr');
    if (headerRow) {
      const headers: string[] = [];
      Array.from(headerRow.children).forEach((th) => {
        const el = th as HTMLElement;
        if (el.style.display === 'none') return;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.toLowerCase() === 'actions' || text.toLowerCase() === 'action' || text.toLowerCase() === 'quick actions') return;
        headers.push(text);
      });
      if (headers.length > 0) rows.push(headers);
    }

    const bodyRows = tableEl.querySelectorAll('tbody tr');
    bodyRows.forEach((tr) => {
      const cells = Array.from(tr.children) as HTMLElement[];
      if (cells.length === 1 && cells[0].hasAttribute('colspan')) return;
      const line: string[] = [];
      const headerThs = headerRow ? Array.from(headerRow.children) : [];
      cells.forEach((td, i) => {
        if (td.style.display === 'none') return;
        const th = headerThs[i] as HTMLElement | undefined;
        const thLabel = (th?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (thLabel === 'actions' || thLabel === 'action' || thLabel === 'quick actions') return;
        line.push((td.textContent || '').replace(/\s+/g, ' ').trim());
      });
      if (line.length > 0) rows.push(line);
    });

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (typeof document === 'undefined') return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (fallbackTitle || title || tableId).toLowerCase().replace(/[^a-z0-9]+/g, '_');
    a.href = url;
    a.download = `${safeName}_export.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
