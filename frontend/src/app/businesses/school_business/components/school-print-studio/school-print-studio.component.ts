import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { BackendService } from '../../../../services/backend.service';
import { SchoolBarcodeComponent, SchoolQrCodeComponent } from '../school-barcode/school-barcode.component';
import {
  BarcodeStickerItem,
  ThermalFeeReceiptData,
  ThermalPaperWidth,
  buildBarcodeStickerSheetHtml,
  buildThermalFeeReceiptHtml,
  printHtmlInHiddenFrame
} from '../../utils/thermal-print.util';
import {
  DEFAULT_PRINT_SECTION_ORDER,
  DEFAULT_SCHOOL_PRINT_BRANDING,
  PRINT_SECTION_META,
  PrintChallanLogoCorner,
  PrintHeaderAlign,
  PrintLogoPlacement,
  PrintLogoShape,
  PrintSectionKey,
  PrintSectionMeta,
  PrintVerificationOrder,
  SCHOOL_DOCUMENT_CATALOG,
  SchoolCurrencyCode,
  SchoolDocumentFormatMeta,
  SchoolPrintBrandingConfig,
  SchoolPrintDocumentType,
  TablePrintDefaultFormat,
  TablePrintOrientation,
  TablePrintOverride,
  TablePrintSlipLayout,
  buildA4BankChallanHtml,
  buildResultDmcHtml,
  buildSalarySlipHtml,
  buildStudentIdCardPrintHtml,
  normalizeSchoolPrintBranding,
  resolveEffectiveTableBranding,
  sanitizeBrandingLogoUrl
} from '../../utils/school-print-templates.util';
import {
  SCHOOL_TABLE_CATALOG,
  SCHOOL_TABLE_FAMILY_MAP,
  TableCatalogItem
} from '../../services/school-table-schema.service';
import {
  StatementDataset,
  buildSchoolStatementA4Html,
  buildSchoolStatementCardHtml,
  buildSchoolStatementThermalHtml,
  computeStatementAmounts,
  formatStatementMoney
} from '../../utils/school-statement-print.util';

export type PrintStudioTab = 'formats' | 'branding' | 'hardware';

export type PrintTableCategoryKey =
  | 'all'
  | 'students_identity'
  | 'finance_fees'
  | 'academics_exams'
  | 'hr_attendance'
  | 'operations_audit'
  | 'custom_only';

export interface EnrichedTableDirectoryItem extends TableCatalogItem {
  categoryKey: Exclude<PrintTableCategoryKey, 'all' | 'custom_only'>;
  categoryLabel: string;
  linkedPortalCount: number;
  specialFormatId?: SchoolPrintDocumentType;
  specialFormatLabel?: string;
  isCustom: boolean;
}

@Component({
  selector: 'app-school-print-studio',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    SchoolBarcodeComponent,
    SchoolQrCodeComponent
  ],
  templateUrl: './school-print-studio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchoolPrintStudioComponent implements OnDestroy {
  readonly branding = input.required<SchoolPrintBrandingConfig>();
  readonly schoolName = input<string>('SoftCode Premier Academy');
  readonly branchLabel = input<string>('Main Campus · Senior & Junior Wing');
  readonly sampleStudent = input<any>(null);
  readonly sampleStaff = input<any>(null);
  readonly sampleTransaction = input<any>(null);
  readonly serialThermalConnected = input<boolean>(false);
  readonly serialThermalLabel = input<string>('');
  readonly isWebSerialSupported = input<boolean>(false);
  readonly hardwarePrinterPaper = input<'a4' | '80mm' | '58mm'>('80mm');
  readonly bankGatewayName = input<string>('Meezan Bank Ltd');
  readonly bankBranchCode = input<string>('0102');
  readonly bankAccountNumber = input<string>('0102-0105829102');
  readonly bankIban = input<string>('PK36MEZN0001020105829102');
  readonly oneBillPrefix = input<string>('10089');
  readonly lateFeeFinePkr = input<number>(500);
  readonly initialFormat = input<SchoolPrintDocumentType | null>(null);
  readonly initialTableScope = input<string | null>(null);
  readonly initialJumpSeq = input<number>(0);

  readonly saveBranding = output<SchoolPrintBrandingConfig>();
  readonly resetBranding = output<void>();
  readonly paperSizeChange = output<'a4' | '80mm' | '58mm'>();
  readonly printThermalTest = output<'80mm' | '58mm'>();
  readonly printStickers = output<void>();
  readonly printStaffStickers = output<void>();
  readonly printBulkIdCards = output<void>();
  readonly connectSerialPrinter = output<void>();
  readonly disconnectSerialPrinter = output<void>();
  readonly openHardwareTerminal = output<'auto' | 'fee' | 'attendance' | 'library'>();
  readonly openQrScanner = output<void>();
  readonly navigateToTab = output<string>();
  readonly toast = output<{ message: string; type: 'success' | 'info' | 'warning' }>();

  private readonly backend = inject(BackendService);

  readonly activeStudioTab = signal<PrintStudioTab>('formats');
  readonly selectedFormat = signal<SchoolPrintDocumentType>('thermal_receipt');
  readonly previewThermalWidth = signal<ThermalPaperWidth>('80mm');
  readonly isPrinting = signal<boolean>(false);
  readonly showQuickLayoutBar = signal<boolean>(false);
  readonly logoUploadDragOver = signal<boolean>(false);
  readonly isProcessingLogo = signal<boolean>(false);
  readonly draggedSectionKey = signal<PrintSectionKey | null>(null);
  readonly dragOverSectionKey = signal<PrintSectionKey | null>(null);

  readonly sectionOrder = signal<PrintSectionKey[]>([...DEFAULT_PRINT_SECTION_ORDER]);
  readonly hiddenSections = signal<PrintSectionKey[]>([]);
  readonly sectionMetaMap = PRINT_SECTION_META;

  readonly tableCatalog: TableCatalogItem[] = SCHOOL_TABLE_CATALOG;
  readonly tableFamilyMap: Record<string, string> = SCHOOL_TABLE_FAMILY_MAP;
  readonly tableOverrides = signal<Record<string, TablePrintOverride>>({});
  readonly selectedTableScope = signal<string>('__global__');
  readonly tablePreviewSubMode = signal<'a4_slip' | 'a4_statement' | '80mm' | '58mm' | 'card'>('80mm');
  readonly tableSearchQuery = signal<string>('');
  readonly tableCategoryFilter = signal<PrintTableCategoryKey>('all');
  readonly showTableDirectory = signal<boolean>(true);
  private lastHandledJumpSeq = 0;

  readonly documentCatalog: SchoolDocumentFormatMeta[] = SCHOOL_DOCUMENT_CATALOG;
  readonly specialDocumentCatalog: SchoolDocumentFormatMeta[] = SCHOOL_DOCUMENT_CATALOG.filter(
    (d) => d.id !== 'table_statement'
  );
  readonly universalTableDocumentMeta: SchoolDocumentFormatMeta =
    SCHOOL_DOCUMENT_CATALOG.find((d) => d.id === 'table_statement') || SCHOOL_DOCUMENT_CATALOG[0];

  readonly accentSwatches = [
    { label: 'Institutional Navy', hex: '#0f172a' },
    { label: 'Academy Emerald', hex: '#065f46' },
    { label: 'Royal Indigo', hex: '#312e81' },
    { label: 'Heritage Maroon', hex: '#881337' },
    { label: 'Executive Slate', hex: '#334155' }
  ];

  readonly brandingForm = new FormGroup({
    schoolName: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.schoolName, { nonNullable: true }),
    campusTagline: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.campusTagline, { nonNullable: true }),
    registrationNo: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.registrationNo, { nonNullable: true }),
    address: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.address, { nonNullable: true }),
    phone: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.phone, { nonNullable: true }),
    website: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.website, { nonNullable: true }),
    signatoryTitle: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.signatoryTitle, { nonNullable: true }),
    monogramInitials: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.monogramInitials, { nonNullable: true }),
    headerAccentColor: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.headerAccentColor, { nonNullable: true }),
    currencySymbol: new FormControl<SchoolCurrencyCode>(DEFAULT_SCHOOL_PRINT_BRANDING.currencySymbol, { nonNullable: true }),
    defaultPaperWidth: new FormControl<'80mm' | '58mm'>(DEFAULT_SCHOOL_PRINT_BRANDING.defaultPaperWidth, { nonNullable: true }),
    thermalDualCopy: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.thermalDualCopy, { nonNullable: true }),
    autoKickCashDrawer: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.autoKickCashDrawer, { nonNullable: true }),
    autoCutThermal: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.autoCutThermal, { nonNullable: true }),
    stampLabel: new FormControl<'PAID' | 'VERIFIED' | 'ORIGINAL' | 'NONE'>(DEFAULT_SCHOOL_PRINT_BRANDING.stampLabel, { nonNullable: true }),
    footerNote: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.footerNote, { nonNullable: true }),
    showLogoCrest: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.showLogoCrest, { nonNullable: true }),
    showQrVerification: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.showQrVerification, { nonNullable: true }),
    showBarcodeVerification: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.showBarcodeVerification, { nonNullable: true }),
    logoDataUrl: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.logoDataUrl, { nonNullable: true }),
    logoPlacement: new FormControl<PrintLogoPlacement>(DEFAULT_SCHOOL_PRINT_BRANDING.logoPlacement, { nonNullable: true }),
    logoShape: new FormControl<PrintLogoShape>(DEFAULT_SCHOOL_PRINT_BRANDING.logoShape, { nonNullable: true }),
    logoSizePx: new FormControl<number>(DEFAULT_SCHOOL_PRINT_BRANDING.logoSizePx, { nonNullable: true }),
    headerAlign: new FormControl<PrintHeaderAlign>(DEFAULT_SCHOOL_PRINT_BRANDING.headerAlign, { nonNullable: true }),
    verificationOrder: new FormControl<PrintVerificationOrder>(DEFAULT_SCHOOL_PRINT_BRANDING.verificationOrder, { nonNullable: true }),
    challanLogoCorner: new FormControl<PrintChallanLogoCorner>(DEFAULT_SCHOOL_PRINT_BRANDING.challanLogoCorner, { nonNullable: true }),
    challanRefLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.challanRefLabel, { nonNullable: true }),
    challanDueDateLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.challanDueDateLabel, { nonNullable: true }),
    challanTuitionLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.challanTuitionLabel, { nonNullable: true }),
    challanLabLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.challanLabLabel, { nonNullable: true }),
    challanExamLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.challanExamLabel, { nonNullable: true }),
    challanActivityLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.challanActivityLabel, { nonNullable: true }),
    challanLeftSignLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.challanLeftSignLabel, { nonNullable: true }),
    challanRightSignLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.challanRightSignLabel, { nonNullable: true }),
    idCardValidThru: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.idCardValidThru, { nonNullable: true }),
    idCardBadgeLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.idCardBadgeLabel, { nonNullable: true }),
    stickerFooterNote: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.stickerFooterNote, { nonNullable: true }),
    dmcExamTitle: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.dmcExamTitle, { nonNullable: true }),
    dmcSessionLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.dmcSessionLabel, { nonNullable: true }),
    salaryMonthLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.salaryMonthLabel, { nonNullable: true }),
    salaryPayModeLabel: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.salaryPayModeLabel, { nonNullable: true }),
    tableDefaultFormat: new FormControl<TablePrintDefaultFormat>(DEFAULT_SCHOOL_PRINT_BRANDING.tableDefaultFormat, { nonNullable: true }),
    tableA4Orientation: new FormControl<TablePrintOrientation>(DEFAULT_SCHOOL_PRINT_BRANDING.tableA4Orientation, { nonNullable: true }),
    tableSlipLayout: new FormControl<TablePrintSlipLayout>(DEFAULT_SCHOOL_PRINT_BRANDING.tableSlipLayout, { nonNullable: true }),
    tableShowFieldLogos: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.tableShowFieldLogos, { nonNullable: true }),
    tableShowWatermark: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.tableShowWatermark, { nonNullable: true })
  });

  readonly liveFormDraft = signal<SchoolPrintBrandingConfig>({ ...DEFAULT_SCHOOL_PRINT_BRANDING });
  private formSub?: Subscription;

  constructor() {
    this.formSub = this.brandingForm.valueChanges.subscribe(() => {
      this.syncDraftFromState();
    });

    effect(() => {
      const incoming = this.branding();
      const normalized = normalizeSchoolPrintBranding(incoming, this.schoolName());
      this.sectionOrder.set([...normalized.sectionOrder]);
      this.hiddenSections.set([...normalized.hiddenSections]);
      this.tableOverrides.set({ ...(normalized.tableOverrides || {}) });
      this.brandingForm.patchValue(
        {
          schoolName: normalized.schoolName,
          campusTagline: normalized.campusTagline,
          registrationNo: normalized.registrationNo,
          address: normalized.address,
          phone: normalized.phone,
          website: normalized.website,
          signatoryTitle: normalized.signatoryTitle,
          monogramInitials: normalized.monogramInitials,
          headerAccentColor: normalized.headerAccentColor,
          currencySymbol: normalized.currencySymbol,
          defaultPaperWidth: normalized.defaultPaperWidth,
          thermalDualCopy: normalized.thermalDualCopy,
          autoKickCashDrawer: normalized.autoKickCashDrawer,
          autoCutThermal: normalized.autoCutThermal,
          stampLabel: normalized.stampLabel,
          footerNote: normalized.footerNote,
          showLogoCrest: normalized.showLogoCrest,
          showQrVerification: normalized.showQrVerification,
          showBarcodeVerification: normalized.showBarcodeVerification,
          logoDataUrl: normalized.logoDataUrl,
          logoPlacement: normalized.logoPlacement,
          logoShape: normalized.logoShape,
          logoSizePx: normalized.logoSizePx,
          headerAlign: normalized.headerAlign,
          verificationOrder: normalized.verificationOrder,
          challanLogoCorner: normalized.challanLogoCorner,
          challanRefLabel: normalized.challanRefLabel,
          challanDueDateLabel: normalized.challanDueDateLabel,
          challanTuitionLabel: normalized.challanTuitionLabel,
          challanLabLabel: normalized.challanLabLabel,
          challanExamLabel: normalized.challanExamLabel,
          challanActivityLabel: normalized.challanActivityLabel,
          challanLeftSignLabel: normalized.challanLeftSignLabel,
          challanRightSignLabel: normalized.challanRightSignLabel,
          idCardValidThru: normalized.idCardValidThru,
          idCardBadgeLabel: normalized.idCardBadgeLabel,
          stickerFooterNote: normalized.stickerFooterNote,
          dmcExamTitle: normalized.dmcExamTitle,
          dmcSessionLabel: normalized.dmcSessionLabel,
          salaryMonthLabel: normalized.salaryMonthLabel,
          salaryPayModeLabel: normalized.salaryPayModeLabel,
          tableDefaultFormat: normalized.tableDefaultFormat,
          tableA4Orientation: normalized.tableA4Orientation,
          tableSlipLayout: normalized.tableSlipLayout,
          tableShowFieldLogos: normalized.tableShowFieldLogos,
          tableShowWatermark: normalized.tableShowWatermark
        },
        { emitEvent: false }
      );
      this.liveFormDraft.set(normalized);
      this.previewThermalWidth.set(normalized.defaultPaperWidth === '58mm' ? '58mm' : '80mm');
    });

    effect(() => {
      const seq = this.initialJumpSeq();
      const fmt = this.initialFormat();
      const scope = this.initialTableScope();
      if (seq > 0 && seq !== this.lastHandledJumpSeq) {
        this.lastHandledJumpSeq = seq;
        if (fmt) {
          this.selectedFormat.set(fmt);
        } else {
          this.selectedFormat.set('table_statement');
        }
        this.activeStudioTab.set('formats');
        if (scope) {
          const hit = this.tableCatalog.find((t) => t.tableId === scope || t.canonicalId === scope);
          this.selectedTableScope.set(hit ? hit.tableId : scope);
        } else {
          this.selectedTableScope.set('__global__');
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  readonly effectiveBranding = computed<SchoolPrintBrandingConfig>(() => this.liveFormDraft());
  readonly safeLogoUrl = computed<string>(() => sanitizeBrandingLogoUrl(this.effectiveBranding().logoDataUrl));

  readonly selectedFormatMeta = computed<SchoolDocumentFormatMeta>(() => {
    const id = this.selectedFormat();
    return this.documentCatalog.find((d) => d.id === id) || this.documentCatalog[0];
  });

  readonly resolvedStudent = computed(() => {
    const s = this.sampleStudent();
    const roll = String(s?.rollNo || '1001');
    return {
      name: String(s?.name || 'Zayan Ahmed Khan'),
      rollNo: roll,
      grade: String(s?.grade || 'Class 10-A'),
      guardian: String(s?.guardian || 'Tariq Ahmed Khan'),
      phone: String(s?.guardianPhone || this.effectiveBranding().phone),
      feeAmount: Math.max(0, Number(s?.feeAmount ?? 25000)),
      photoDataUrl: String(s?.image || ''),
      bloodGroup: String(s?.bloodGroup || 'O+'),
      challanNo: `CH-2026-${roll}`,
      idBarcode: `STU-${roll}`,
      initials: String(s?.name || 'ZA')
        .split(/\s+/)
        .map((p: string) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'ST'
    };
  });

  readonly resolvedChallanBreakdown = computed(() => {
    const total = Math.max(0, Number(this.resolvedStudent().feeAmount || 0));
    const lab = total >= 10000 ? 1500 : (total >= 4000 ? 600 : 0);
    const exam = total >= 10000 ? 1200 : (total >= 4000 ? 500 : 0);
    const activity = total >= 10000 ? 800 : (total >= 4000 ? 300 : 0);
    const tuition = Math.max(0, total - lab - exam - activity);
    return { tuition, lab, exam, activity, total };
  });

  readonly resolvedStaff = computed(() => {
    const st = this.sampleStaff();
    const code = String(st?.empCode || 'TCH-301');
    return {
      name: String(st?.name || 'Prof. Tariq Mehmood'),
      empCode: code.toUpperCase().startsWith('EMP-') ? code : `EMP-${code}`,
      designation: String(st?.role || st?.roleTitle || 'Senior Science Lecturer'),
      department: String(st?.subject || st?.department || 'Academic Faculty'),
      bankAccount: String(st?.accountNo || 'PK36MEZN01020108920192'),
      basicPay: Number(st?.monthlySalary || 125000)
    };
  });

  readonly resolvedTransaction = computed(() => {
    const tx = this.sampleTransaction();
    const stu = this.resolvedStudent();
    return {
      txnRef: String(tx?.txnRef || 'TXN-2026-88412'),
      challanNo: String(tx?.challanNo || stu.challanNo),
      gatewayName: String(tx?.gatewayName || 'Accountant Fee Counter / Raast'),
      baseAmount: Number(tx?.baseAmount || stu.feeAmount),
      gatewayFee: Number(tx?.gatewayFee || 0),
      totalAmount: Number(tx?.totalAmount || tx?.baseAmount || stu.feeAmount),
      status: String(tx?.status || 'PAID'),
      paidAtLabel: tx?.verifiedAt ? new Date(tx.verifiedAt).toLocaleString() : '26 Nov 2026, 10:15 AM'
    };
  });

  readonly sampleStickers = computed<BarcodeStickerItem[]>(() => {
    const stu = this.resolvedStudent();
    const staff = this.resolvedStaff();
    return [
      {
        title: stu.name,
        subtitle: `${stu.grade} · Roll #${stu.rollNo}`,
        code: stu.idBarcode,
        meta: `Challan: ${stu.challanNo}`
      },
      {
        title: 'Ayesha Siddiqui',
        subtitle: 'Class 9-B · Roll #1002',
        code: 'STU-1002',
        meta: 'Challan: CH-2026-1002'
      },
      {
        title: staff.name,
        subtitle: `${staff.designation} · ${staff.department}`,
        code: staff.empCode,
        meta: 'Gate Attendance Pass'
      }
    ];
  });

  readonly sampleDmcSubjects = [
    { subject: 'English Literature & Comp.', maxMarks: 100, obtainedMarks: 91, grade: 'A+', remarks: 'Distinction' },
    { subject: 'Mathematics (Core)', maxMarks: 100, obtainedMarks: 95, grade: 'A+', remarks: 'Top 5% in Class' },
    { subject: 'Physics & Practical', maxMarks: 100, obtainedMarks: 88, grade: 'A', remarks: 'Very Good' },
    { subject: 'Computer Science', maxMarks: 100, obtainedMarks: 94, grade: 'A+', remarks: 'Lab Merit' },
    { subject: 'Urdu & Islamiat', maxMarks: 100, obtainedMarks: 86, grade: 'A', remarks: 'Commendable' }
  ];

  readonly dmcTotals = computed(() => {
    const max = this.sampleDmcSubjects.reduce((a, b) => a + b.maxMarks, 0);
    const obt = this.sampleDmcSubjects.reduce((a, b) => a + b.obtainedMarks, 0);
    const pctNum = max > 0 ? (obt / max) * 100 : 0;
    const failedCount = this.sampleDmcSubjects.filter(
      (s) => s.grade.toUpperCase() === 'F' || (s.maxMarks > 0 && (s.obtainedMarks / s.maxMarks) * 100 < 40)
    ).length;
    const statusLabel = pctNum < 40 || failedCount >= 2
      ? 'FAIL'
      : (failedCount === 1 ? 'COMPARTMENT' : 'PASS');
    return {
      max,
      obt,
      pct: pctNum.toFixed(1),
      statusLabel
    };
  });

  readonly salaryBreakdown = computed(() => {
    const st = this.resolvedStaff();
    const basic = st.basicPay;
    const house = Math.round(basic * 0.15);
    const medical = 8500;
    const gross = basic + house + medical;
    const tax = Math.round(gross * 0.025);
    const advance = 0;
    return {
      basic,
      house,
      medical,
      gross,
      tax,
      advance,
      net: gross - tax - advance
    };
  });

  readonly overrideCount = computed(() => Object.keys(this.tableOverrides()).length);

  readonly totalMappedPortalAliases = computed(() => Object.keys(this.tableFamilyMap).length);
  readonly totalCoveredTableCount = computed(() => {
    const uniqueIds = new Set<string>([
      ...this.tableCatalog.map((t) => t.tableId),
      ...Object.keys(this.tableFamilyMap)
    ]);
    return uniqueIds.size;
  });

  readonly enrichedTableCatalog = computed<EnrichedTableDirectoryItem[]>(() => {
    const overrides = this.tableOverrides();
    const aliasCounts: Record<string, number> = {};
    for (const canonicalId of Object.values(this.tableFamilyMap)) {
      aliasCounts[canonicalId] = (aliasCounts[canonicalId] || 0) + 1;
    }

    return this.tableCatalog.map((tbl) => {
      const cls = this.classifyTableMeta(tbl.tableId);
      return {
        ...tbl,
        categoryKey: cls.categoryKey,
        categoryLabel: cls.categoryLabel,
        linkedPortalCount: Math.max(1, aliasCounts[tbl.canonicalId] || 1),
        specialFormatId: cls.specialFormatId,
        specialFormatLabel: cls.specialFormatLabel,
        isCustom: Boolean(overrides[tbl.tableId] || overrides[tbl.canonicalId])
      };
    });
  });

  readonly tableCategoryTabs = computed(() => {
    const items = this.enrichedTableCatalog();
    const countOf = (key: Exclude<PrintTableCategoryKey, 'all' | 'custom_only'>) =>
      items.filter((i) => i.categoryKey === key).length;
    return [
      { key: 'all' as PrintTableCategoryKey, label: 'All Tables', count: items.length },
      { key: 'students_identity' as PrintTableCategoryKey, label: 'Students & Admissions', count: countOf('students_identity') },
      { key: 'finance_fees' as PrintTableCategoryKey, label: 'Fees & Finance', count: countOf('finance_fees') },
      { key: 'academics_exams' as PrintTableCategoryKey, label: 'Exams & Academics', count: countOf('academics_exams') },
      { key: 'hr_attendance' as PrintTableCategoryKey, label: 'Attendance & HR', count: countOf('hr_attendance') },
      { key: 'operations_audit' as PrintTableCategoryKey, label: 'Campus, Transport & Audit', count: countOf('operations_audit') },
      { key: 'custom_only' as PrintTableCategoryKey, label: 'Customized', count: items.filter((i) => i.isCustom).length }
    ];
  });

  readonly filteredTableCatalog = computed<EnrichedTableDirectoryItem[]>(() => {
    const items = this.enrichedTableCatalog();
    const cat = this.tableCategoryFilter();
    const q = this.tableSearchQuery().trim().toLowerCase();

    return items.filter((item) => {
      if (cat === 'custom_only' && !item.isCustom) return false;
      if (cat !== 'all' && cat !== 'custom_only' && item.categoryKey !== cat) return false;
      if (!q) return true;
      const haystack = [
        item.title,
        item.tableId,
        item.portals,
        item.categoryLabel,
        item.specialFormatLabel || '',
        ...(item.defaultHeaders || [])
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  readonly selectedTableMeta = computed<EnrichedTableDirectoryItem>(() => {
    const items = this.enrichedTableCatalog();
    const scope = this.selectedTableScope();
    if (scope && scope !== '__global__') {
      const hit = items.find((t) => t.tableId === scope || t.canonicalId === scope);
      if (hit) return hit;
    }
    return items[0];
  });

  readonly effectiveTablePreview = computed(() => {
    const scope = this.selectedTableScope();
    const tid = scope && scope !== '__global__' ? scope : undefined;
    return resolveEffectiveTableBranding(this.effectiveBranding(), tid, tid);
  });

  readonly sampleTableDataset = computed<StatementDataset>(() => {
    const meta = this.selectedTableMeta();
    const stu = this.resolvedStudent();
    const st = this.resolvedStaff();
    const tx = this.resolvedTransaction();
    const cur = this.effectiveTablePreview().branding.currencySymbol || 'PKR';
    const hdrs = (meta?.defaultHeaders || ['Ref #', 'Particulars', 'Date', 'Amount', 'Status']).slice(0, 6);

    const buildCell = (header: string, rowIdx: number): string => {
      const h = header.toLowerCase();
      if (h.includes('roll')) return rowIdx === 0 ? stu.rollNo : '1002';
      if (h.includes('student id') || h.includes('emp') || h.includes('staff / roll')) {
        return rowIdx === 0 ? stu.idBarcode : st.empCode;
      }
      if (
        h.includes('student') ||
        h.includes('candidate') ||
        h.includes('applicant') ||
        h.includes('borrower') ||
        h.includes('graduate') ||
        h.includes('child') ||
        h.includes('member details') ||
        h.includes('member & face') ||
        h === 'member'
      ) {
        return rowIdx === 0 ? stu.name : 'Ayesha Siddiqui';
      }
      if (h.includes('father') || h.includes('guardian') || h.includes('parent')) {
        return rowIdx === 0 ? stu.guardian : 'Muhammad Khalid';
      }
      if (
        h.includes('teacher') ||
        h.includes('staff') ||
        h.includes('faculty') ||
        h.includes('principal') ||
        h.includes('accountant') ||
        h.includes('collector') ||
        h.includes('cashier') ||
        h.includes('coordinator') ||
        h.includes('warden') ||
        h.includes('officer') ||
        h.includes('operator') ||
        h.includes('author') ||
        h.includes('physician') ||
        h.includes('custodian')
      ) {
        return rowIdx === 0 ? st.name : 'Ms. Fatima Noor';
      }
      if (h.includes('visitor')) return rowIdx === 0 ? 'Imran Qureshi' : 'Sadia Tariq';
      if (h.includes('driver')) return rowIdx === 0 ? 'Ustad Nawaz' : 'Rashid Ali';
      if (h.includes('vendor') || h.includes('payee') || h.includes('recipient')) {
        return rowIdx === 0 ? 'Al-Karam Stationers' : 'Islamabad Electric Co.';
      }
      if (h.includes('full name') || h.includes('reader identity')) {
        return rowIdx === 0 ? st.name : stu.name;
      }
      if (h.includes('class') || h.includes('grade') || h.includes('wing')) {
        return rowIdx === 0 ? stu.grade : 'Class 9-B';
      }
      if (h.includes('section')) return rowIdx === 0 ? 'Section A' : 'Section B';
      if (h.includes('branch')) return rowIdx === 0 ? 'Main Campus HQ' : 'Girls Wing Branch';
      if (h.includes('isbn')) return rowIdx === 0 ? '978-0-13-468599-1' : '978-0-32-112521-7';
      if (h.includes('book title')) return rowIdx === 0 ? 'Advanced Physics Vol. II' : 'Oxford Mathematics IX';
      if (h.includes('rack')) return rowIdx === 0 ? 'Rack A-14 (Science)' : 'Rack B-03 (Math)';
      if (h.includes('copies')) return rowIdx === 0 ? '4 / 6 Available' : '2 / 5 Available';
      if (h.includes('subject')) return rowIdx === 0 ? 'Physics & Lab' : 'Mathematics Core';
      if (h.includes('topic') || h.includes('experiment')) return rowIdx === 0 ? 'Electromagnetic Induction' : 'Quadratic Functions';
      if (h.includes('exam title')) return rowIdx === 0 ? 'Mid-Term Examination 2026' : 'Final Term Assessment';
      if (h.includes('obtained') || h.includes('marks')) return rowIdx === 0 ? '92 / 100' : '86 / 100';
      if (h.includes('gpa')) return rowIdx === 0 ? '3.85 GPA' : '3.60 GPA';
      if (h.includes('blood')) return rowIdx === 0 ? stu.bloodGroup : 'B+';
      if (h.includes('vaccination')) return rowIdx === 0 ? 'Fully Immunized' : 'Up to Date';
      if (h.includes('allerg')) return rowIdx === 0 ? 'None Reported' : 'Mild Dust';
      if (h.includes('route')) return rowIdx === 0 ? 'Route 01 — F-10 / G-11' : 'Route 04 — Bahria Link';
      if (h.includes('vehicle')) return rowIdx === 0 ? 'ICT-BUS-204' : 'ICT-VAN-118';
      if (h.includes('room') || h.includes('lab') || h.includes('venue') || h.includes('location')) {
        return rowIdx === 0 ? 'Room 104 / Main Hall' : 'Physics Lab 02';
      }
      if (h.includes('period') || h.includes('time slot') || h.includes('shift')) {
        return rowIdx === 0 ? 'Period 2 (09:00 AM)' : 'Morning Shift';
      }
      if (h.includes('check-in') || h.includes('time')) return rowIdx === 0 ? '07:52 AM / 01:45 PM' : '08:04 AM / 02:00 PM';
      if (h.includes('gate')) return rowIdx === 0 ? 'Gate A (RFID Auto)' : 'Gate B (QR Scan)';
      if (h.includes('leave type')) return rowIdx === 0 ? 'Medical Leave' : 'Casual Leave';
      if (h.includes('days')) return rowIdx === 0 ? '2 Days' : '1 Day';
      if (h.includes('unpaid')) return rowIdx === 0 ? '1 Month (Nov)' : '2 Months';
      if (h.includes('certificate')) return rowIdx === 0 ? 'SLC-2026-041' : 'SLC-2026-042';
      if (h.includes('clearance')) return rowIdx === 0 ? '4/4 Cleared (Fee/Lib/Lab/Hostel)' : '3/4 Pending';
      if (h.includes('conduct') || h.includes('severity')) return rowIdx === 0 ? 'Exemplary / Low' : 'Good';
      if (h.includes('asset name') || h.includes('event title') || h.includes('title / circular') || h.includes('title & type')) {
        return rowIdx === 0 ? 'Annual Science & Robotics Expo' : 'Smart Interactive Board 75"';
      }
      if (h.includes('asset code')) return rowIdx === 0 ? 'AST-IT-089' : 'AST-LAB-014';
      if (h.includes('qty') || h.includes('capacity') || h.includes('enrolled') || h.includes('students') || h.includes('wings')) {
        return rowIdx === 0 ? '28' : '14';
      }
      if (h.includes('date') || h.includes('month') || h.includes('period') || h.includes('year')) {
        return rowIdx === 0 ? '2026-11-26' : '2026-11-25';
      }
      if (
        h.includes('ref') ||
        h.includes('challan') ||
        h.includes('receipt') ||
        h.includes('voucher') ||
        h.includes('slip') ||
        h.includes('token') ||
        h.includes('issue #') ||
        h.includes('pass #') ||
        h.includes('log #') ||
        h.includes('task #') ||
        h.includes('audit id') ||
        h.includes('alert ref') ||
        h.includes('invoice')
      ) {
        return rowIdx === 0 ? tx.txnRef : 'REF-2026-88413';
      }
      if (h.includes('cnic') || h.includes('b-form')) return rowIdx === 0 ? '61101-4829103-1' : '37405-9182734-2';
      if (h.includes('phone') || h.includes('mobile') || h.includes('whatsapp') || h.includes('emergency')) return stu.phone;
      if (h.includes('email')) return rowIdx === 0 ? 'parent@campus.edu.pk' : 'accounts@campus.edu.pk';
      if (h.includes('pin')) return rowIdx === 0 ? '••••' : '••••';
      if (
        h.includes('fee') ||
        h.includes('amount') ||
        h.includes('tuition') ||
        h.includes('salary') ||
        h.includes('pay') ||
        h.includes('total') ||
        h.includes('bakaya') ||
        h.includes('due') ||
        h.includes('fine') ||
        h.includes('expense') ||
        h.includes('credit') ||
        h.includes('debit') ||
        h.includes('cash') ||
        h.includes('meezan') ||
        h.includes('hbl') ||
        h.includes('kuickpay') ||
        h.includes('digital') ||
        h.includes('revenue') ||
        h.includes('income') ||
        h.includes('margin') ||
        h.includes('collected') ||
        h.includes('billed') ||
        h.includes('variance') ||
        h.includes('discount') ||
        h.includes('tax') ||
        h.includes('allowance') ||
        h.includes('deduction') ||
        h.includes('value') ||
        h.includes('budget')
      ) {
        return rowIdx === 0 ? `${cur} ${formatStatementMoney(stu.feeAmount, cur)}` : `${cur} ${formatStatementMoney(18500, cur)}`;
      }
      if (h.includes('channel') || h.includes('method') || h.includes('desk')) {
        return rowIdx === 0 ? 'Meezan Bank / Counter' : 'Raast Digital QR';
      }
      if (h.includes('role') || h.includes('designation') || h.includes('department') || h.includes('category') || h.includes('priority')) {
        return rowIdx === 0 ? 'Senior Academic / Verified' : 'Campus Operations';
      }
      if (h.includes('status') || h.includes('state') || h.includes('condition') || h.includes('verification') || h.includes('standing')) {
        return rowIdx === 0 ? 'VERIFIED' : 'ACTIVE';
      }
      if (h.includes('gender')) return rowIdx === 0 ? 'Male' : 'Female';
      return rowIdx === 0 ? 'Verified Campus Entry' : 'Synced Record';
    };

    return {
      tableId: meta?.tableId || 'students_master',
      title: meta?.title || 'Students Master Directory',
      roleLabel: meta?.portals || 'School Business Owner',
      headers: hdrs,
      rows: [
        hdrs.map((h) => buildCell(h, 0)),
        hdrs.map((h) => buildCell(h, 1))
      ]
    };
  });

  readonly sampleTableSummary = computed(() => {
    const ds = this.sampleTableDataset();
    const cur = this.effectiveTablePreview().branding.currencySymbol || 'PKR';
    return computeStatementAmounts(ds.headers, ds.rows, cur);
  });

  readonly sampleTableSingleFields = computed(() => {
    const ds = this.sampleTableDataset();
    const row = ds.rows[0] || [];
    const amtSet = new Set(this.sampleTableSummary().amountColumns.map((c) => c.colIndex));
    return ds.headers.map((h, idx) => {
      const value = row[idx] || '—';
      const isStatus = /\b(status|state|condition|verification|standing|grade|result)\b/i.test(h || '') && value !== '—';
      return {
        label: h,
        value,
        isAmount: amtSet.has(idx),
        isStatus
      };
    });
  });

  readonly sampleTableTextFields = computed(() =>
    this.sampleTableSingleFields().filter((f) => !f.isAmount && f.value !== '—' && f.value !== '-')
  );

  isLongThermalText(value: string): boolean {
    return String(value || '').trim().length > 32;
  }

  getTableFieldPillClass(value: string): string {
    const v = String(value || '').toLowerCase();
    if (/unpaid|overdue|pending|due|late|fail|absent|rejected|cancelled/.test(v)) {
      return 'inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-black bg-amber-50 text-amber-800 border border-amber-200';
    }
    return 'inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200';
  }

  private syncDraftFromState(): void {
    const val = this.brandingForm.getRawValue();
    this.liveFormDraft.set(
      normalizeSchoolPrintBranding(
        {
          ...val,
          sectionOrder: this.sectionOrder(),
          hiddenSections: this.hiddenSections(),
          tableOverrides: this.tableOverrides()
        },
        this.schoolName()
      )
    );
  }

  getSectionMeta(key: PrintSectionKey): PrintSectionMeta {
    return this.sectionMetaMap[key];
  }

  isSectionHidden(key: PrintSectionKey): boolean {
    return this.effectiveBranding().hiddenSections.includes(key);
  }

  isTableSectionHidden(key: PrintSectionKey): boolean {
    return this.effectiveTablePreview().branding.hiddenSections.includes(key);
  }

  canMoveSection(index: number, delta: -1 | 1): boolean {
    const next = index + delta;
    return next >= 0 && next < this.sectionOrder().length;
  }

  toggleQuickLayoutBar(): void {
    this.showQuickLayoutBar.update((v) => !v);
  }

  setStudioTab(tab: PrintStudioTab): void {
    this.activeStudioTab.set(tab);
  }

  selectDocumentFormat(docType: SchoolPrintDocumentType, jumpToPreview = false): void {
    this.selectedFormat.set(docType);
    if (jumpToPreview) {
      this.activeStudioTab.set('formats');
    }
  }

  setThermalPreviewWidth(width: ThermalPaperWidth): void {
    this.previewThermalWidth.set(width);
    this.brandingForm.patchValue({ defaultPaperWidth: width });
    this.paperSizeChange.emit(width);
  }

  pickAccentColor(hex: string): void {
    this.brandingForm.patchValue({ headerAccentColor: hex });
  }

  setLogoPlacement(placement: PrintLogoPlacement): void {
    this.brandingForm.patchValue({ logoPlacement: placement });
  }

  setLogoShape(shape: PrintLogoShape): void {
    this.brandingForm.patchValue({ logoShape: shape });
  }

  setHeaderAlign(align: PrintHeaderAlign): void {
    this.brandingForm.patchValue({ headerAlign: align });
  }

  setVerificationOrder(order: PrintVerificationOrder): void {
    this.brandingForm.patchValue({ verificationOrder: order });
  }

  setChallanLogoCorner(corner: PrintChallanLogoCorner): void {
    this.brandingForm.patchValue({ challanLogoCorner: corner });
  }

  private classifyTableMeta(tableId: string): {
    categoryKey: Exclude<PrintTableCategoryKey, 'all' | 'custom_only'>;
    categoryLabel: string;
    specialFormatId?: SchoolPrintDocumentType;
    specialFormatLabel?: string;
  } {
    switch (tableId) {
      case 'students_master':
      case 'owner_admissions':
        return {
          categoryKey: 'students_identity',
          categoryLabel: 'Students & Admissions',
          specialFormatId: 'id_card',
          specialFormatLabel: 'ID Card & Stickers'
        };
      case 'slc_certificates':
        return {
          categoryKey: 'students_identity',
          categoryLabel: 'Students & Admissions',
          specialFormatId: 'result_dmc',
          specialFormatLabel: 'Official SLC Print'
        };
      case 'parents_master':
      case 'owner_medical':
      case 'owner_discipline':
      case 'owner_alumni':
      case 'owner_student_leaves':
        return {
          categoryKey: 'students_identity',
          categoryLabel: 'Students & Admissions'
        };

      case 'fee_receipts_cashiering':
      case 'online_payment_slips':
      case 'student_payment_history':
        return {
          categoryKey: 'finance_fees',
          categoryLabel: 'Fees & Finance',
          specialFormatId: 'thermal_receipt',
          specialFormatLabel: '80/58mm POS Receipt'
        };
      case 'fee_challans_invoices':
      case 'fee_defaulters':
      case 'owner_finance_ledger':
        return {
          categoryKey: 'finance_fees',
          categoryLabel: 'Fees & Finance',
          specialFormatId: 'bank_challan',
          specialFormatLabel: '3-Copy Bank Challan'
        };
      case 'petty_vouchers':
      case 'daily_closing_reconciliation':
      case 'owner_expenses':
      case 'owner_audit_waivers':
      case 'owner_fee_structure_catalog':
      case 'owner_fee_deletion_audit':
      case 'owner_branch_financial_matrix':
      case 'owner_profit_loss':
      case 'owner_rooznama_branch_matrix':
        return {
          categoryKey: 'finance_fees',
          categoryLabel: 'Fees & Finance'
        };

      case 'academics_gradebook_results':
      case 'owner_exams':
        return {
          categoryKey: 'academics_exams',
          categoryLabel: 'Exams & Academics',
          specialFormatId: 'result_dmc',
          specialFormatLabel: 'Official Result DMC'
        };
      case 'owner_library_catalog':
      case 'library_circulation':
        return {
          categoryKey: 'academics_exams',
          categoryLabel: 'Exams & Academics',
          specialFormatId: 'barcode_stickers',
          specialFormatLabel: 'Book Barcode Stickers'
        };
      case 'principal_lesson_plans':
      case 'principal_substitutions':
      case 'owner_subjects':
      case 'owner_timetable':
      case 'owner_labs_schedule':
      case 'owner_homework_log':
      case 'owner_wing_breakdown':
        return {
          categoryKey: 'academics_exams',
          categoryLabel: 'Exams & Academics'
        };

      case 'owner_payroll':
      case 'owner_teacher_arrears':
        return {
          categoryKey: 'hr_attendance',
          categoryLabel: 'Attendance & HR',
          specialFormatId: 'salary_slip',
          specialFormatLabel: 'Monthly Salary Slip'
        };
      case 'teachers_master':
      case 'attendance_roster_staff':
      case 'attendance_roster_principals':
      case 'attendance_roster_students':
      case 'attendance_roster_teachers':
      case 'owner_all_personnel':
      case 'owner_principals_directory':
      case 'owner_accountants_directory':
      case 'owner_support_staff_directory':
        return {
          categoryKey: 'hr_attendance',
          categoryLabel: 'Attendance & HR',
          specialFormatId: 'id_card',
          specialFormatLabel: 'Gate ID Badge'
        };
      case 'attendance_gate_logs':
      case 'attendance_marked_details':
      case 'principal_appraisals':
      case 'principal_faculty_tasks':
      case 'owner_staff_leaves':
        return {
          categoryKey: 'hr_attendance',
          categoryLabel: 'Attendance & HR'
        };

      case 'owner_stock_movements':
      case 'owner_assets':
        return {
          categoryKey: 'operations_audit',
          categoryLabel: 'Campus, Transport & Audit',
          specialFormatId: 'barcode_stickers',
          specialFormatLabel: 'Asset Barcode Stickers'
        };
      default:
        return {
          categoryKey: 'operations_audit',
          categoryLabel: 'Campus, Transport & Audit'
        };
    }
  }

  onTableSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement | null)?.value ?? '';
    this.tableSearchQuery.set(val);
  }

  clearTableSearch(): void {
    this.tableSearchQuery.set('');
  }

  setTableCategoryFilter(cat: PrintTableCategoryKey): void {
    this.tableCategoryFilter.set(cat);
  }

  toggleTableDirectory(): void {
    this.showTableDirectory.update((v) => !v);
  }

  selectTableAndPreview(scopeId: string): void {
    this.selectedTableScope.set(scopeId || '__global__');
    this.selectedFormat.set('table_statement');
    const eff = this.effectiveTablePreview();
    if (eff.defaultFormat === '80mm' || eff.defaultFormat === '58mm') {
      this.tablePreviewSubMode.set(eff.defaultFormat);
    } else {
      this.tablePreviewSubMode.set('a4_slip');
    }
  }

  setTableThermalPaper(width: ThermalPaperWidth): void {
    this.tablePreviewSubMode.set(width);
    this.updateActiveTableSetting({ defaultFormat: width });
  }

  setTableDefaultPaper(fmt: TablePrintDefaultFormat): void {
    this.updateActiveTableSetting({ defaultFormat: fmt });
    this.tablePreviewSubMode.set(fmt === 'a4' ? 'a4_slip' : fmt);
  }

  onSelectTableScopeChange(event: Event): void {
    const sel = event.target as HTMLSelectElement | null;
    this.selectTableAndPreview(sel?.value || '__global__');
  }

  selectTableScope(scope: string): void {
    this.selectTableAndPreview(scope || '__global__');
  }

  onTableCustomHeadingInput(event: Event): void {
    const val = (event.target as HTMLInputElement | null)?.value ?? '';
    this.updateActiveTableSetting({ customHeading: val });
  }

  updateActiveTableSetting(patch: Partial<TablePrintOverride>): void {
    const scope = this.selectedTableScope();
    if (!scope || scope === '__global__') {
      const formPatch: Record<string, unknown> = {};
      if (patch.defaultFormat) formPatch['tableDefaultFormat'] = patch.defaultFormat;
      if (patch.a4Orientation) formPatch['tableA4Orientation'] = patch.a4Orientation;
      if (patch.slipLayout) formPatch['tableSlipLayout'] = patch.slipLayout;
      if (typeof patch.showFieldLogos === 'boolean') formPatch['tableShowFieldLogos'] = patch.showFieldLogos;
      if (typeof patch.showWatermark === 'boolean') formPatch['tableShowWatermark'] = patch.showWatermark;
      if (patch.logoPlacement) formPatch['logoPlacement'] = patch.logoPlacement;
      if (patch.logoShape) formPatch['logoShape'] = patch.logoShape;
      if (patch.headerAlign) formPatch['headerAlign'] = patch.headerAlign;
      if (patch.stampLabel) formPatch['stampLabel'] = patch.stampLabel;
      if (Object.keys(formPatch).length > 0) {
        this.brandingForm.patchValue(formPatch);
      }
      return;
    }

    const next = { ...this.tableOverrides() };
    const existing = { ...(next[scope] || {}) };
    const merged: TablePrintOverride = { ...existing, ...patch };
    if (typeof merged.customHeading === 'string' && !merged.customHeading.trim()) {
      delete merged.customHeading;
    }
    next[scope] = merged;
    this.tableOverrides.set(next);
    this.syncDraftFromState();
  }

  clearTableOverride(scopeId?: string): void {
    const target = scopeId || this.selectedTableScope();
    if (!target || target === '__global__') return;
    const next = { ...this.tableOverrides() };
    if (!next[target]) return;
    delete next[target];
    this.tableOverrides.set(next);
    this.syncDraftFromState();
    this.toast.emit({
      message: 'Table override cleared — now inheriting Global School Table Print Design.',
      type: 'info'
    });
  }

  removeUploadedLogo(): void {
    this.brandingForm.patchValue({ logoDataUrl: '' });
    this.toast.emit({
      message: 'Custom logo removed. Reverted to monogram crest.',
      type: 'info'
    });
  }

  onLogoDragOver(event: DragEvent): void {
    event.preventDefault();
    this.logoUploadDragOver.set(true);
  }

  onLogoDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.logoUploadDragOver.set(false);
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    this.logoUploadDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void this.processLogoFile(file);
    }
  }

  onLogoFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    const file = inputEl?.files?.[0];
    if (file) {
      void this.processLogoFile(file);
    }
    if (inputEl) {
      inputEl.value = '';
    }
  }

  private async processLogoFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.toast.emit({
        message: 'Please upload a valid image file (PNG, JPG, WebP, or SVG).',
        type: 'warning'
      });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.toast.emit({
        message: 'Logo file size must be under 8MB.',
        type: 'warning'
      });
      return;
    }

    this.isProcessingLogo.set(true);
    try {
      const dataUrl = await this.readAndScaleLogoToPng(file);
      const safe = sanitizeBrandingLogoUrl(dataUrl);
      if (!safe) {
        this.toast.emit({
          message: 'Unable to process logo image. Please try another PNG or JPG file.',
          type: 'warning'
        });
        return;
      }
      this.brandingForm.patchValue({ logoDataUrl: safe, showLogoCrest: true });
      this.syncDraftFromState();
      this.toast.emit({
        message: 'School logo applied — live previews and all print templates updated.',
        type: 'success'
      });
    } catch {
      this.toast.emit({
        message: 'Error reading image file. Please select a valid PNG or JPG logo.',
        type: 'warning'
      });
    } finally {
      this.isProcessingLogo.set(false);
    }
  }

  private readAndScaleLogoToPng(file: File): Promise<string> {
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (isSvg) {
      return new Promise((resolve, reject) => {
        const textReader = new FileReader();
        textReader.onerror = () => reject(new Error('SVG read failed'));
        textReader.onload = () => {
          let svgText = String(textReader.result || '').trim();
          if (!svgText) {
            reject(new Error('Empty SVG'));
            return;
          }
          // Ensure explicit pixel width/height on SVG root so canvas scaling works crisply when SVG only defines viewBox
          const vbMatch = svgText.match(/viewBox\s*=\s*["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
          let targetW = 260;
          let targetH = 260;
          if (vbMatch) {
            const vw = parseFloat(vbMatch[1]);
            const vh = parseFloat(vbMatch[2]);
            if (vw > 0 && vh > 0) {
              const ratio = vw / vh;
              if (ratio >= 1) {
                targetW = 260;
                targetH = Math.max(40, Math.round(260 / ratio));
              } else {
                targetH = 260;
                targetW = Math.max(40, Math.round(260 * ratio));
              }
            }
          }
          svgText = svgText.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
            const cleaned = attrs
              .replace(/\swidth\s*=\s*["'][^"']*["']/gi, '')
              .replace(/\sheight\s*=\s*["'][^"']*["']/gi, '');
            return `<svg${cleaned} width="${targetW}" height="${targetH}">`;
          });
          const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
          this.renderImageUrlToScaledPng(svgDataUrl, targetW, targetH).then(resolve, reject);
        };
        textReader.readAsText(file);
      });
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('File read failed'));
      reader.onload = () => {
        const rawResult = String(reader.result || '');
        this.renderImageUrlToScaledPng(rawResult).then(resolve, reject);
      };
      reader.readAsDataURL(file);
    });
  }

  private renderImageUrlToScaledPng(rawUrl: string, fallbackW = 120, fallbackH = 120): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined' || typeof Image === 'undefined') {
        resolve(rawUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Image decode failed'));
      img.onload = () => {
        const maxDim = 260;
        const w = img.naturalWidth || fallbackW;
        const h = img.naturalHeight || fallbackH;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const targetW = Math.max(24, Math.round(w * scale));
        const targetH = Math.max(24, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawUrl);
          return;
        }
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = rawUrl;
    });
  }

  onSectionDragStart(event: DragEvent, key: PrintSectionKey): void {
    this.draggedSectionKey.set(key);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', key);
    }
  }

  onSectionDragOver(event: DragEvent, key: PrintSectionKey): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.dragOverSectionKey() !== key) {
      this.dragOverSectionKey.set(key);
    }
  }

  onSectionDrop(event: DragEvent, targetKey: PrintSectionKey): void {
    event.preventDefault();
    const fromKey =
      this.draggedSectionKey() ||
      (event.dataTransfer?.getData('text/plain') as PrintSectionKey | undefined);
    this.draggedSectionKey.set(null);
    this.dragOverSectionKey.set(null);
    if (!fromKey || fromKey === targetKey) return;

    const current = [...this.sectionOrder()];
    const fromIdx = current.indexOf(fromKey);
    const toIdx = current.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved);
    this.sectionOrder.set(current);
    this.syncDraftFromState();
  }

  onSectionDragEnd(): void {
    this.draggedSectionKey.set(null);
    this.dragOverSectionKey.set(null);
  }

  moveSection(key: PrintSectionKey, delta: -1 | 1): void {
    const current = [...this.sectionOrder()];
    const idx = current.indexOf(key);
    const targetIdx = idx + delta;
    if (idx === -1 || targetIdx < 0 || targetIdx >= current.length) return;
    const swap = current[targetIdx];
    current[targetIdx] = current[idx];
    current[idx] = swap;
    this.sectionOrder.set(current);
    this.syncDraftFromState();
  }

  toggleSectionVisibility(key: PrintSectionKey): void {
    if (this.sectionMetaMap[key]?.locked) return;
    const current = [...this.hiddenSections()];
    const idx = current.indexOf(key);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(key);
    }
    this.hiddenSections.set(current);
    this.syncDraftFromState();
  }

  onSaveBranding(): void {
    const val = this.brandingForm.getRawValue();
    const cleaned = normalizeSchoolPrintBranding(
      {
        ...val,
        schoolName: val.schoolName.trim() || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName,
        monogramInitials: (val.monogramInitials || 'SC').trim().toUpperCase().slice(0, 4),
        sectionOrder: this.sectionOrder(),
        hiddenSections: this.hiddenSections(),
        tableOverrides: this.tableOverrides()
      },
      this.schoolName()
    );
    this.saveBranding.emit(cleaned);
    this.toast.emit({
      message: 'Custom logo, table rasheed styles, layout order, and print branding saved across all portals.',
      type: 'success'
    });
  }

  onResetBranding(): void {
    const resetVal: SchoolPrintBrandingConfig = {
      ...DEFAULT_SCHOOL_PRINT_BRANDING,
      schoolName: this.schoolName() || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName,
      sectionOrder: [...DEFAULT_PRINT_SECTION_ORDER],
      hiddenSections: [],
      tableOverrides: {}
    };
    this.sectionOrder.set([...DEFAULT_PRINT_SECTION_ORDER]);
    this.hiddenSections.set([]);
    this.tableOverrides.set({});
    this.selectedTableScope.set('__global__');
    this.brandingForm.reset(
      {
        schoolName: resetVal.schoolName,
        campusTagline: resetVal.campusTagline,
        registrationNo: resetVal.registrationNo,
        address: resetVal.address,
        phone: resetVal.phone,
        website: resetVal.website,
        signatoryTitle: resetVal.signatoryTitle,
        monogramInitials: resetVal.monogramInitials,
        headerAccentColor: resetVal.headerAccentColor,
        currencySymbol: resetVal.currencySymbol,
        defaultPaperWidth: resetVal.defaultPaperWidth,
        thermalDualCopy: resetVal.thermalDualCopy,
        autoKickCashDrawer: resetVal.autoKickCashDrawer,
        autoCutThermal: resetVal.autoCutThermal,
        stampLabel: resetVal.stampLabel,
        footerNote: resetVal.footerNote,
        showLogoCrest: resetVal.showLogoCrest,
        showQrVerification: resetVal.showQrVerification,
        showBarcodeVerification: resetVal.showBarcodeVerification,
        logoDataUrl: '',
        logoPlacement: resetVal.logoPlacement,
        logoShape: resetVal.logoShape,
        logoSizePx: resetVal.logoSizePx,
        headerAlign: resetVal.headerAlign,
        verificationOrder: resetVal.verificationOrder,
        challanLogoCorner: resetVal.challanLogoCorner,
        challanRefLabel: resetVal.challanRefLabel,
        challanDueDateLabel: resetVal.challanDueDateLabel,
        challanTuitionLabel: resetVal.challanTuitionLabel,
        challanLabLabel: resetVal.challanLabLabel,
        challanExamLabel: resetVal.challanExamLabel,
        challanActivityLabel: resetVal.challanActivityLabel,
        challanLeftSignLabel: resetVal.challanLeftSignLabel,
        challanRightSignLabel: resetVal.challanRightSignLabel,
        idCardValidThru: resetVal.idCardValidThru,
        idCardBadgeLabel: resetVal.idCardBadgeLabel,
        stickerFooterNote: resetVal.stickerFooterNote,
        dmcExamTitle: resetVal.dmcExamTitle,
        dmcSessionLabel: resetVal.dmcSessionLabel,
        salaryMonthLabel: resetVal.salaryMonthLabel,
        salaryPayModeLabel: resetVal.salaryPayModeLabel,
        tableDefaultFormat: resetVal.tableDefaultFormat,
        tableA4Orientation: resetVal.tableA4Orientation,
        tableSlipLayout: resetVal.tableSlipLayout,
        tableShowFieldLogos: resetVal.tableShowFieldLogos,
        tableShowWatermark: resetVal.tableShowWatermark
      },
      { emitEvent: false }
    );
    this.liveFormDraft.set(resetVal);
    this.previewThermalWidth.set(resetVal.defaultPaperWidth);
    this.resetBranding.emit();
  }

  async printSelectedDocument(): Promise<void> {
    if (this.isPrinting()) return;
    this.isPrinting.set(true);
    try {
      const b = this.effectiveBranding();
      const stu = this.resolvedStudent();
      const challan = this.resolvedChallanBreakdown();
      const st = this.resolvedStaff();
      const tx = this.resolvedTransaction();
      const format = this.selectedFormat();
      let html = '';
      let label = '';

      const registerStudioPrint = async (params: {
        docType: string;
        docLabel: string;
        tableId: string;
        tableTitle: string;
        portalTab: string;
        rowKey: string;
        rowLabel: string;
        subjectName: string;
        rollOrCode: string;
        amountPkr?: number;
        statusSnapshot?: string;
        snapshot?: Record<string, any>;
      }): Promise<{ qrToken?: string; printId?: string }> => {
        try {
          const res = await this.backend.registerSchoolPrintVerification({
            ...params,
            generatedBy: 'School Owner (Print Studio)',
            generatedByRole: 'owner'
          });
          if (res?.ok && res.qrToken) {
            return { qrToken: res.qrToken, printId: res.printId };
          }
        } catch {}
        return {};
      };

      if (format === 'thermal_receipt') {
        const width = this.previewThermalWidth();
        const signed = await registerStudioPrint({
          docType: 'thermal_receipt',
          docLabel: `${width} Thermal Fee Receipt`,
          tableId: 'fee_receipts_cashiering',
          tableTitle: 'Fee Collection & Cashiering Register',
          portalTab: 'finance',
          rowKey: tx.challanNo || tx.txnRef,
          rowLabel: stu.name,
          subjectName: stu.name,
          rollOrCode: stu.rollNo || tx.challanNo,
          amountPkr: Number(tx.totalAmount || 0),
          statusSnapshot: tx.status || 'VERIFIED',
          snapshot: { txnRef: tx.txnRef, challanNo: tx.challanNo, totalAmount: tx.totalAmount, status: tx.status }
        });
        const data: ThermalFeeReceiptData = {
          schoolName: b.schoolName,
          branchName: this.branchLabel(),
          campusTagline: b.campusTagline,
          registrationNo: b.registrationNo,
          campusAddress: b.address,
          campusPhone: b.phone,
          campusWebsite: b.website,
          monogramInitials: b.showLogoCrest ? b.monogramInitials : '',
          logoDataUrl: b.logoDataUrl,
          logoPlacement: b.logoPlacement,
          logoShape: b.logoShape,
          logoSizePx: b.logoSizePx,
          headerAlign: b.headerAlign,
          sectionOrder: b.sectionOrder,
          hiddenSections: b.hiddenSections,
          verificationOrder: b.verificationOrder,
          signatoryTitle: b.signatoryTitle,
          stampLabel: b.stampLabel,
          showQr: b.showQrVerification,
          showBarcode: b.showBarcodeVerification,
          receiptTitle: 'FEE PAYMENT RECEIPT',
          txnRef: tx.txnRef,
          challanNo: tx.challanNo,
          billingMonth: 'November 2026',
          studentName: stu.name,
          rollNo: stu.rollNo,
          grade: stu.grade,
          guardianName: stu.guardian,
          cashierName: 'Accountant Fee Desk',
          gatewayName: tx.gatewayName,
          currency: b.currencySymbol,
          baseAmount: tx.baseAmount,
          gatewayFee: tx.gatewayFee,
          totalAmount: tx.totalAmount,
          status: tx.status,
          paidAtLabel: tx.paidAtLabel,
          verifiedBy: 'Accountant Fee Desk',
          qrPayload: signed.qrToken,
          footerNote: b.footerNote,
          dualCopy: b.thermalDualCopy,
          paperWidth: width,
          kickDrawer: b.autoKickCashDrawer,
          autoCut: b.autoCutThermal
        };
        html = buildThermalFeeReceiptHtml(data, width);
        label = `${width} Thermal Fee Receipt`;
      } else if (format === 'bank_challan') {
        const challanTotal = challan.tuition + challan.lab + challan.exam + challan.activity;
        const signed = await registerStudioPrint({
          docType: 'bank_challan',
          docLabel: 'A4 3-Copy Bank Fee Challan',
          tableId: 'fee_challans_invoices',
          tableTitle: 'Fee Challans & Invoices Ledger',
          portalTab: 'finance',
          rowKey: stu.challanNo || stu.rollNo,
          rowLabel: stu.name,
          subjectName: stu.name,
          rollOrCode: stu.challanNo || stu.rollNo,
          amountPkr: challanTotal,
          statusSnapshot: 'UNPAID',
          snapshot: { challanNo: stu.challanNo, totalAmount: challanTotal, status: 'UNPAID' }
        });
        html = buildA4BankChallanHtml(
          {
            challanNo: stu.challanNo,
            issueMonth: b.challanRefLabel || 'REF: 2026-OCT',
            dueDate: b.challanDueDateLabel || '10th Oct 2026',
            studentName: stu.name,
            rollNo: stu.rollNo,
            grade: stu.grade,
            guardianName: stu.guardian,
            bankName: this.bankGatewayName(),
            branchCode: this.bankBranchCode(),
            accountTitle: b.schoolName,
            accountNumber: this.bankAccountNumber(),
            iban: this.bankIban(),
            oneBillId: `${this.oneBillPrefix()}-${stu.rollNo}`,
            tuitionFee: challan.tuition,
            labFee: challan.lab,
            examFee: challan.exam,
            activityFee: challan.activity,
            lateFine: this.lateFeeFinePkr(),
            statusLabel: 'UNPAID',
            qrPayload: signed.qrToken,
            printId: signed.printId,
            generatedBy: 'School Owner (Print Studio)'
          },
          b
        );
        label = 'A4 3-Copy Bank Fee Challan';
      } else if (format === 'id_card') {
        const signed = await registerStudioPrint({
          docType: 'id_card',
          docLabel: 'Student Gate ID Card',
          tableId: 'students_master',
          tableTitle: 'Students Master Directory',
          portalTab: 'students',
          rowKey: stu.rollNo || stu.idBarcode,
          rowLabel: stu.name,
          subjectName: stu.name,
          rollOrCode: stu.idBarcode || stu.rollNo,
          statusSnapshot: 'ACTIVE'
        });
        html = buildStudentIdCardPrintHtml(
          {
            holderName: stu.name,
            roleOrGrade: stu.grade,
            code: stu.idBarcode,
            guardianOrDept: stu.guardian,
            phone: stu.phone,
            validThrough: b.idCardValidThru || 'Mar 2027',
            campusBranch: this.branchLabel(),
            initials: stu.initials,
            photoDataUrl: stu.photoDataUrl,
            bloodGroup: stu.bloodGroup,
            cardTypeLabel: b.idCardBadgeLabel || 'Official Gate Card',
            qrPayload: signed.qrToken,
            printId: signed.printId,
            generatedBy: 'School Owner (Print Studio)'
          },
          b
        );
        label = 'Student Gate ID Card (Front + Back)';
      } else if (format === 'barcode_stickers') {
        html = buildBarcodeStickerSheetHtml(b.schoolName, this.sampleStickers(), b.logoDataUrl, {
          monogramInitials: b.monogramInitials,
          showLogoCrest: b.showLogoCrest,
          footerNote: b.stickerFooterNote,
          accentColor: b.headerAccentColor,
          logoShape: b.logoShape
        });
        label = 'A4 Barcode Sticker Sheet';
      } else if (format === 'result_dmc') {
        const dmcNo = `DMC-2026-${stu.rollNo}`;
        const signed = await registerStudioPrint({
          docType: 'result_dmc',
          docLabel: 'Official Exam Result DMC',
          tableId: 'academics_gradebook_results',
          tableTitle: 'Academics & Class Result Sheet',
          portalTab: 'exams',
          rowKey: stu.rollNo || dmcNo,
          rowLabel: stu.name,
          subjectName: stu.name,
          rollOrCode: dmcNo,
          statusSnapshot: 'EVALUATED'
        });
        html = buildResultDmcHtml(
          {
            dmcNo,
            examTitle: b.dmcExamTitle || 'Mid-Term Examination 2026',
            session: b.dmcSessionLabel || 'Session 2026-27',
            studentName: stu.name,
            guardianName: stu.guardian,
            rollNo: stu.rollNo,
            grade: stu.grade,
            subjects: this.sampleDmcSubjects,
            classRank: '2nd / 42',
            qrPayload: signed.qrToken,
            printId: signed.printId,
            generatedBy: 'School Owner (Print Studio)'
          },
          b
        );
        label = 'A4 Official Exam Result DMC';
      } else if (format === 'salary_slip') {
        const sb = this.salaryBreakdown();
        const slipNo = `PAY-2026-${st.empCode}`;
        const signed = await registerStudioPrint({
          docType: 'salary_slip',
          docLabel: 'Monthly Salary Slip',
          tableId: 'owner_payroll',
          tableTitle: 'Staff Payroll & Salary Slips',
          portalTab: 'teachers',
          rowKey: st.empCode || slipNo,
          rowLabel: st.name,
          subjectName: st.name,
          rollOrCode: st.empCode,
          amountPkr: Number(sb.net || 0),
          statusSnapshot: 'PAID',
          snapshot: { slipNo, totalAmount: sb.net, status: 'PAID' }
        });
        html = buildSalarySlipHtml(
          {
            slipNo,
            payMonth: b.salaryMonthLabel || 'October 2026',
            empCode: st.empCode,
            employeeName: st.name,
            designation: st.designation,
            department: st.department,
            bankAccount: st.bankAccount,
            basicPay: sb.basic,
            houseAllowance: sb.house,
            medicalAllowance: sb.medical,
            taxDeduction: sb.tax,
            advanceDeduction: sb.advance,
            paymentMode: b.salaryPayModeLabel || 'Direct Bank IBFT',
            qrPayload: signed.qrToken,
            printId: signed.printId,
            generatedBy: 'School Owner (Print Studio)'
          },
          b
        );
        label = 'A4 Monthly Salary Slip';
      } else {
        const ds = this.sampleTableDataset();
        const subMode = this.tablePreviewSubMode();
        const scope = this.selectedTableScope();
        const tableId = scope !== '__global__' ? scope : ds.tableId;
        const useRows = subMode === 'a4_slip' ? ds.rows.slice(0, 1) : ds.rows;
        const signed = await registerStudioPrint({
          docType: subMode === 'card' || subMode === 'a4_slip' ? 'table_record_card' : 'table_statement',
          docLabel: `${ds.title} (${subMode.toUpperCase()})`,
          tableId,
          tableTitle: ds.title,
          portalTab: 'overview',
          rowKey: String(useRows[0]?.[0] || 'STM-PREVIEW-2026'),
          rowLabel: String(useRows[0]?.[1] || ds.title),
          subjectName: ds.title,
          rollOrCode: 'STM-PREVIEW-2026',
          statusSnapshot: 'VERIFIED'
        });
        const stmtParams = {
          tableId,
          canonicalTableId: tableId,
          title: ds.title,
          roleLabel: ds.roleLabel,
          headers: ds.headers,
          rows: useRows,
          totalUnfilteredCount: ds.rows.length,
          criteria: {},
          branding: b,
          statementRef: signed.printId || 'STM-PREVIEW-2026',
          qrPayload: signed.qrToken,
          generatedBy: 'School Owner (Print Studio)'
        };
        if (subMode === '80mm' || subMode === '58mm') {
          html = buildSchoolStatementThermalHtml(stmtParams, subMode);
          label = `${subMode} Table Rasheed (${ds.title})`;
        } else if (subMode === 'card') {
          html = buildSchoolStatementCardHtml({ ...stmtParams, rows: ds.rows.slice(0, 1) });
          label = `QR Verification Card (${ds.title})`;
        } else {
          html = buildSchoolStatementA4Html(stmtParams);
          label = `${subMode === 'a4_slip' ? 'A4 Row Slip' : 'A4 Table Statement'} (${ds.title})`;
        }
      }

      const ok = await printHtmlInHiddenFrame(html);
      this.toast.emit({
        message: ok
          ? `Opened Print / Save PDF preview for ${label}.`
          : 'Print dialog could not be opened in this browser context.',
        type: ok ? 'success' : 'warning'
      });
    } finally {
      this.isPrinting.set(false);
    }
  }

  formatCurrency(n: number): string {
    return Number(n || 0).toLocaleString('en-PK');
  }
}
