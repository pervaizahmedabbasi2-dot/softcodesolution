import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
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
  PrintHeaderAlign,
  PrintLogoPlacement,
  PrintSectionKey,
  PrintSectionMeta,
  PrintVerificationOrder,
  SCHOOL_DOCUMENT_CATALOG,
  SchoolDocumentFormatMeta,
  SchoolPrintBrandingConfig,
  SchoolPrintDocumentType,
  buildA4BankChallanHtml,
  buildResultDmcHtml,
  buildSalarySlipHtml,
  buildStudentIdCardPrintHtml,
  normalizeSchoolPrintBranding,
  sanitizeBrandingLogoUrl
} from '../../utils/school-print-templates.util';

export type PrintStudioTab = 'formats' | 'branding' | 'hardware';

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

  readonly saveBranding = output<SchoolPrintBrandingConfig>();
  readonly resetBranding = output<void>();
  readonly paperSizeChange = output<'a4' | '80mm' | '58mm'>();
  readonly printThermalTest = output<'80mm' | '58mm'>();
  readonly printStickers = output<void>();
  readonly printStaffStickers = output<void>();
  readonly connectSerialPrinter = output<void>();
  readonly disconnectSerialPrinter = output<void>();
  readonly openHardwareTerminal = output<'auto' | 'fee' | 'attendance' | 'library'>();
  readonly navigateToTab = output<string>();
  readonly toast = output<{ message: string; type: 'success' | 'info' | 'warning' }>();

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

  readonly documentCatalog: SchoolDocumentFormatMeta[] = SCHOOL_DOCUMENT_CATALOG;

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
    defaultPaperWidth: new FormControl<'80mm' | '58mm'>(DEFAULT_SCHOOL_PRINT_BRANDING.defaultPaperWidth, { nonNullable: true }),
    stampLabel: new FormControl<'PAID' | 'VERIFIED' | 'ORIGINAL' | 'NONE'>(DEFAULT_SCHOOL_PRINT_BRANDING.stampLabel, { nonNullable: true }),
    footerNote: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.footerNote, { nonNullable: true }),
    showLogoCrest: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.showLogoCrest, { nonNullable: true }),
    showQrVerification: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.showQrVerification, { nonNullable: true }),
    showBarcodeVerification: new FormControl<boolean>(DEFAULT_SCHOOL_PRINT_BRANDING.showBarcodeVerification, { nonNullable: true }),
    logoDataUrl: new FormControl<string>(DEFAULT_SCHOOL_PRINT_BRANDING.logoDataUrl, { nonNullable: true }),
    logoPlacement: new FormControl<PrintLogoPlacement>(DEFAULT_SCHOOL_PRINT_BRANDING.logoPlacement, { nonNullable: true }),
    logoSizePx: new FormControl<number>(DEFAULT_SCHOOL_PRINT_BRANDING.logoSizePx, { nonNullable: true }),
    headerAlign: new FormControl<PrintHeaderAlign>(DEFAULT_SCHOOL_PRINT_BRANDING.headerAlign, { nonNullable: true }),
    verificationOrder: new FormControl<PrintVerificationOrder>(DEFAULT_SCHOOL_PRINT_BRANDING.verificationOrder, { nonNullable: true })
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
          defaultPaperWidth: normalized.defaultPaperWidth,
          stampLabel: normalized.stampLabel,
          footerNote: normalized.footerNote,
          showLogoCrest: normalized.showLogoCrest,
          showQrVerification: normalized.showQrVerification,
          showBarcodeVerification: normalized.showBarcodeVerification,
          logoDataUrl: normalized.logoDataUrl,
          logoPlacement: normalized.logoPlacement,
          logoSizePx: normalized.logoSizePx,
          headerAlign: normalized.headerAlign,
          verificationOrder: normalized.verificationOrder
        },
        { emitEvent: false }
      );
      this.liveFormDraft.set(normalized);
      this.previewThermalWidth.set(normalized.defaultPaperWidth === '58mm' ? '58mm' : '80mm');
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
      feeAmount: Number(s?.feeAmount || 25000),
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
      status: String(tx?.status || 'VERIFIED'),
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
    return {
      max,
      obt,
      pct: ((obt / max) * 100).toFixed(1)
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

  private syncDraftFromState(): void {
    const val = this.brandingForm.getRawValue();
    this.liveFormDraft.set(
      normalizeSchoolPrintBranding(
        {
          ...val,
          sectionOrder: this.sectionOrder(),
          hiddenSections: this.hiddenSections()
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

  setHeaderAlign(align: PrintHeaderAlign): void {
    this.brandingForm.patchValue({ headerAlign: align });
  }

  setVerificationOrder(order: PrintVerificationOrder): void {
    this.brandingForm.patchValue({ verificationOrder: order });
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
        message: 'Sirf image file upload karen (PNG, JPG, WebP, ya SVG).',
        type: 'warning'
      });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.toast.emit({
        message: 'Logo file size 8MB se kam hona chahiye.',
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
          message: 'Logo process nahi ho saka. Koi dusri PNG/JPG image try karen.',
          type: 'warning'
        });
        return;
      }
      this.brandingForm.patchValue({ logoDataUrl: safe, showLogoCrest: true });
      this.syncDraftFromState();
      this.toast.emit({
        message: 'Apna school/company logo add ho gaya hai — live preview aur print formats update ho gaye!',
        type: 'success'
      });
    } catch {
      this.toast.emit({
        message: 'Image read karne mein error aya. Valid PNG/JPG file select karen.',
        type: 'warning'
      });
    } finally {
      this.isProcessingLogo.set(false);
    }
  }

  private readAndScaleLogoToPng(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('File read failed'));
      reader.onload = () => {
        const rawResult = String(reader.result || '');
        if (typeof document === 'undefined' || typeof Image === 'undefined') {
          resolve(rawResult);
          return;
        }
        const img = new Image();
        img.onerror = () => reject(new Error('Image decode failed'));
        img.onload = () => {
          const maxDim = 260;
          const w = img.naturalWidth || 120;
          const h = img.naturalHeight || 120;
          const scale = Math.min(1, maxDim / Math.max(w, h));
          const targetW = Math.max(24, Math.round(w * scale));
          const targetH = Math.max(24, Math.round(h * scale));
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawResult);
            return;
          }
          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
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
        hiddenSections: this.hiddenSections()
      },
      this.schoolName()
    );
    this.saveBranding.emit(cleaned);
    this.toast.emit({
      message: 'Custom logo, layout order aur branding save ho gayi — ab har real thermal & A4 print mein yehi niklega.',
      type: 'success'
    });
  }

  onResetBranding(): void {
    const resetVal: SchoolPrintBrandingConfig = {
      ...DEFAULT_SCHOOL_PRINT_BRANDING,
      schoolName: this.schoolName() || DEFAULT_SCHOOL_PRINT_BRANDING.schoolName,
      sectionOrder: [...DEFAULT_PRINT_SECTION_ORDER],
      hiddenSections: []
    };
    this.sectionOrder.set([...DEFAULT_PRINT_SECTION_ORDER]);
    this.hiddenSections.set([]);
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
        defaultPaperWidth: resetVal.defaultPaperWidth,
        stampLabel: resetVal.stampLabel,
        footerNote: resetVal.footerNote,
        showLogoCrest: resetVal.showLogoCrest,
        showQrVerification: resetVal.showQrVerification,
        showBarcodeVerification: resetVal.showBarcodeVerification,
        logoDataUrl: '',
        logoPlacement: resetVal.logoPlacement,
        logoSizePx: resetVal.logoSizePx,
        headerAlign: resetVal.headerAlign,
        verificationOrder: resetVal.verificationOrder
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
      const st = this.resolvedStaff();
      const tx = this.resolvedTransaction();
      const format = this.selectedFormat();
      let html = '';
      let label = '';

      if (format === 'thermal_receipt') {
        const width = this.previewThermalWidth();
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
          logoSizePx: b.logoSizePx,
          headerAlign: b.headerAlign,
          sectionOrder: b.sectionOrder,
          hiddenSections: b.hiddenSections,
          verificationOrder: b.verificationOrder,
          signatoryTitle: b.signatoryTitle,
          stampLabel: b.stampLabel,
          showQr: b.showQrVerification,
          showBarcode: b.showBarcodeVerification,
          receiptTitle: 'OFFICIAL COUNTER FEE RECEIPT',
          txnRef: tx.txnRef,
          challanNo: tx.challanNo,
          studentName: stu.name,
          rollNo: stu.rollNo,
          grade: stu.grade,
          guardianName: stu.guardian,
          gatewayName: tx.gatewayName,
          baseAmount: tx.baseAmount,
          gatewayFee: tx.gatewayFee,
          totalAmount: tx.totalAmount,
          status: tx.status,
          paidAtLabel: tx.paidAtLabel,
          verifiedBy: 'Accountant Fee Desk',
          footerNote: b.footerNote
        };
        html = buildThermalFeeReceiptHtml(data, width);
        label = `${width} Thermal Fee Raseed`;
      } else if (format === 'bank_challan') {
        html = buildA4BankChallanHtml(
          {
            challanNo: stu.challanNo,
            issueMonth: 'NOV-2026',
            dueDate: '10 Nov 2026',
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
            tuitionFee: Math.max(stu.feeAmount - 3500, 12500),
            labFee: 1500,
            examFee: 1200,
            activityFee: 800,
            lateFine: this.lateFeeFinePkr(),
            statusLabel: 'UNPAID'
          },
          b
        );
        label = 'A4 3-Copy Bank Fee Challan';
      } else if (format === 'id_card') {
        html = buildStudentIdCardPrintHtml(
          {
            holderName: stu.name,
            roleOrGrade: stu.grade,
            code: stu.idBarcode,
            guardianOrDept: stu.guardian,
            phone: stu.phone,
            validThrough: 'Mar 2027',
            campusBranch: this.branchLabel(),
            initials: stu.initials
          },
          b
        );
        label = 'Student Gate ID Card (Front + Back)';
      } else if (format === 'barcode_stickers') {
        html = buildBarcodeStickerSheetHtml(b.schoolName, this.sampleStickers(), b.logoDataUrl);
        label = 'A4 Barcode Sticker Sheet';
      } else if (format === 'result_dmc') {
        html = buildResultDmcHtml(
          {
            dmcNo: `DMC-2026-${stu.rollNo}`,
            examTitle: 'Mid-Term Terminal Examination 2026',
            session: '2026 - 2027',
            studentName: stu.name,
            guardianName: stu.guardian,
            rollNo: stu.rollNo,
            grade: stu.grade,
            subjects: this.sampleDmcSubjects,
            classRank: '2nd / 42'
          },
          b
        );
        label = 'A4 Official Exam Result DMC';
      } else {
        const sb = this.salaryBreakdown();
        html = buildSalarySlipHtml(
          {
            slipNo: `PAY-2026-${st.empCode}`,
            payMonth: 'October 2026',
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
            paymentMode: 'Direct Bank IBFT'
          },
          b
        );
        label = 'A4 Monthly Salary Slip';
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
