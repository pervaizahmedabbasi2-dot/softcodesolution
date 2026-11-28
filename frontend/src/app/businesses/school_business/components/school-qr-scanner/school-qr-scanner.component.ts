import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import jsQR from 'jsqr';
import { BackendService } from '../../../../services/backend.service';
import { SchoolTableDirective } from '../../directives/school-table.directive';

export interface QrScannerJumpRequest {
  tableId: string;
  tableTitle?: string;
  portalTab: string;
  subTab?: string;
  rowKey?: string;
  rowLabel?: string;
  searchHint?: string;
}

export interface QrRolePermissionConfig {
  enabled: boolean;
  canScanCamera: boolean;
  canFileScan: boolean;
  canViewLedger: boolean;
  canJumpToRecord: boolean;
  canRevokePrints: boolean;
}

export interface QrScannerAccessPolicy {
  ownerLockedControl?: boolean;
  antiFakeStrictMode: boolean;
  duplicateScanAlertEnabled: boolean;
  roles: {
    owner: QrRolePermissionConfig;
    principal: QrRolePermissionConfig;
    teacher: QrRolePermissionConfig;
    accountant: QrRolePermissionConfig;
    staff: QrRolePermissionConfig;
  };
  allowedUserNames?: string[];
  updatedBy?: string;
  updatedAt?: string;
}

export interface QrVerificationResult {
  ok: boolean;
  scanLogId?: string;
  rawCode: string;
  verdict: 'AUTHENTIC' | 'TAMPERED' | 'FAKE' | 'REVOKED' | 'DUPLICATE_SCAN' | 'LEGACY_MATCH';
  isReal: boolean;
  sigValid: boolean;
  duplicateWarning?: boolean;
  reason: string;
  docType: string;
  docLabel: string;
  printId: string;
  printStatus: string;
  generator?: {
    generatedBy: string;
    generatedByRole: string;
    printedAt: string;
    scanCount: number;
    lastScannedAt?: string;
    lastScannedBy?: string;
  };
  location?: {
    tableId: string;
    tableTitle: string;
    portalTab: string;
    subTab?: string;
    rowKey: string;
    rowIndex?: number;
    rowLabel?: string;
    searchHint?: string;
  };
  printedSnapshot?: any;
  liveRecord?: any;
  allMatches?: any[];
  mismatches?: Array<{ field: string; printedValue: string; liveValue: string; severity: string }>;
  securityTips?: string[];
}

export interface PrintVerificationLedgerItem {
  id: string;
  printId: string;
  docType: string;
  docLabel: string;
  tableId: string;
  tableTitle: string;
  portalTab: string;
  subTab?: string;
  rowKey: string;
  rowLabel: string;
  subjectName: string;
  rollOrCode: string;
  amountPkr: number;
  statusSnapshot: string;
  generatedBy: string;
  generatedByRole: string;
  qrToken: string;
  status: 'ACTIVE' | 'REVOKED';
  revokeReason?: string;
  revokedBy?: string;
  scanCount: number;
  lastScannedAt?: string;
  lastScannedBy?: string;
  printedAt: string;
}

export interface QrScanAuditLogItem {
  id: string;
  printId: string;
  scannedCode: string;
  scanSource: string;
  verdict: string;
  isReal: boolean;
  reason: string;
  docType: string;
  tableId: string;
  tableTitle: string;
  rowKey: string;
  subjectName: string;
  generatedBy: string;
  generatedByRole: string;
  scannedBy: string;
  scannedByRole: string;
  createdAt: string;
}

@Component({
  selector: 'app-school-qr-scanner',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, SchoolTableDirective],
  templateUrl: './school-qr-scanner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchoolQrScannerComponent implements OnInit, OnDestroy {
  private readonly backend = inject(BackendService);

  readonly schoolName = input<string>('SoftCode International School');
  readonly portalRole = input<'owner' | 'principal' | 'teacher' | 'accountant' | 'staff'>('owner');
  readonly actorName = input<string>('School Owner');
  readonly branchId = input<string>('ALL');
  readonly wingId = input<string>('ALL');
  readonly accessPolicy = input<QrScannerAccessPolicy | null>(null);

  readonly jumpToRecord = output<QrScannerJumpRequest>();
  readonly accessPolicyChanged = output<QrScannerAccessPolicy>();
  readonly toast = output<{ message: string; type: 'success' | 'warning' | 'info' | 'error' }>();

  @ViewChild('videoPreview') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('decodeCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // Scanner mode & camera state
  readonly scannerMode = signal<'scan' | 'file'>('scan');
  readonly cameraActive = signal<boolean>(false);
  readonly cameraStarting = signal<boolean>(false);
  readonly cameraError = signal<string>('');
  readonly cameraFacing = signal<'environment' | 'user'>('environment');
  readonly torchSupported = signal<boolean>(false);
  readonly torchEnabled = signal<boolean>(false);
  readonly fillLightFallback = signal<boolean>(false);
  readonly uploadedFileName = signal<string>('');
  readonly uploadedPreviewUrl = signal<string>('');
  readonly isVerifying = signal<boolean>(false);

  // Results, ledger & audit logs
  readonly verificationResult = signal<QrVerificationResult | null>(null);
  readonly ledgerItems = signal<PrintVerificationLedgerItem[]>([]);
  readonly scanLogs = signal<QrScanAuditLogItem[]>([]);
  readonly ledgerStats = signal<{
    totalRegisteredPrints: number;
    activePrints: number;
    revokedPrints: number;
    totalScans: number;
    authenticScans: number;
    blockedFakeOrTampered: number;
  }>({
    totalRegisteredPrints: 0,
    activePrints: 0,
    revokedPrints: 0,
    totalScans: 0,
    authenticScans: 0,
    blockedFakeOrTampered: 0
  });
  readonly loadingLedger = signal<boolean>(false);
  readonly tableTab = signal<'ledger' | 'scans' | 'security_guide'>('ledger');
  readonly ledgerFilterStatus = signal<'all' | 'active' | 'revoked' | 'scanned'>('all');
  readonly showOwnerAccessPanel = signal<boolean>(false);
  readonly savingAccess = signal<boolean>(false);
  readonly localPolicy = signal<QrScannerAccessPolicy>({
    ownerLockedControl: true,
    antiFakeStrictMode: true,
    duplicateScanAlertEnabled: true,
    roles: {
      owner: { enabled: true, canScanCamera: true, canFileScan: true, canViewLedger: true, canJumpToRecord: true, canRevokePrints: true },
      principal: { enabled: false, canScanCamera: true, canFileScan: true, canViewLedger: true, canJumpToRecord: true, canRevokePrints: false },
      teacher: { enabled: false, canScanCamera: true, canFileScan: true, canViewLedger: false, canJumpToRecord: true, canRevokePrints: false },
      accountant: { enabled: false, canScanCamera: true, canFileScan: true, canViewLedger: true, canJumpToRecord: true, canRevokePrints: false },
      staff: { enabled: false, canScanCamera: true, canFileScan: false, canViewLedger: false, canJumpToRecord: false, canRevokePrints: false }
    },
    allowedUserNames: []
  });

  readonly roleCards: ReadonlyArray<{
    key: 'principal' | 'teacher' | 'accountant' | 'staff';
    label: string;
    hint: string;
  }> = [
    { key: 'principal', label: 'Principal Portal', hint: 'Academic & office document audit' },
    { key: 'teacher', label: 'Teacher Portal', hint: 'ID cards, DMCs & class sheets' },
    { key: 'accountant', label: 'Accountant Desk', hint: 'Bank challans & fee receipts' },
    { key: 'staff', label: 'Security & Gate Staff', hint: 'Gate passes & visitor badges' }
  ];

  // Reactive forms (NO ngModel)
  readonly manualLookupForm = new FormGroup({
    code: new FormControl<string>('', { nonNullable: true })
  });
  readonly ledgerFilterForm = new FormGroup({
    query: new FormControl<string>('', { nonNullable: true })
  });
  readonly allowedNamesForm = new FormGroup({
    namesText: new FormControl<string>('', { nonNullable: true })
  });
  readonly ledgerSearchTerm = signal<string>('');

  private mediaStream: MediaStream | null = null;
  private rafHandle: number | null = null;
  private barcodeDetector: any = null;
  private lastDecodedCode = '';
  private lastDecodedAt = 0;
  private ledgerSearchSub: { unsubscribe: () => void } | null = null;

  readonly isOwner = computed(() => this.portalRole() === 'owner');
  readonly currentRolePermissions = computed<QrRolePermissionConfig>(() => {
    const role = this.portalRole();
    const pol = this.accessPolicy() || this.localPolicy();
    if (role === 'owner') return pol.roles.owner;
    return pol.roles[role] || { enabled: false, canScanCamera: false, canFileScan: false, canViewLedger: false, canJumpToRecord: false, canRevokePrints: false };
  });

  readonly filteredLedgerItems = computed(() => {
    const status = this.ledgerFilterStatus();
    const q = this.ledgerSearchTerm().trim().toLowerCase();
    return this.ledgerItems().filter((item) => {
      if (status === 'active' && item.status !== 'ACTIVE') return false;
      if (status === 'revoked' && item.status !== 'REVOKED') return false;
      if (status === 'scanned' && item.scanCount <= 0) return false;
      if (!q) return true;
      return (
        item.printId.toLowerCase().includes(q) ||
        item.docLabel.toLowerCase().includes(q) ||
        item.subjectName.toLowerCase().includes(q) ||
        item.rollOrCode.toLowerCase().includes(q) ||
        item.tableTitle.toLowerCase().includes(q) ||
        item.generatedBy.toLowerCase().includes(q)
      );
    });
  });

  readonly filteredScanLogs = computed(() => {
    const q = this.ledgerSearchTerm().trim().toLowerCase();
    if (!q) return this.scanLogs();
    return this.scanLogs().filter((s) =>
      s.scannedCode.toLowerCase().includes(q) ||
      s.printId.toLowerCase().includes(q) ||
      s.verdict.toLowerCase().includes(q) ||
      s.subjectName.toLowerCase().includes(q) ||
      s.tableTitle.toLowerCase().includes(q) ||
      s.scannedBy.toLowerCase().includes(q) ||
      s.generatedBy.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    const passed = this.accessPolicy();
    if (passed) {
      this.localPolicy.set(passed);
      this.allowedNamesForm.patchValue({ namesText: (passed.allowedUserNames || []).join(', ') }, { emitEvent: false });
    }
    this.initBarcodeDetector();
    this.ledgerSearchSub = this.ledgerFilterForm.controls.query.valueChanges.subscribe((v) => {
      this.ledgerSearchTerm.set(v || '');
    });
    void this.loadAccessAndLedger();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.ledgerSearchSub) {
      this.ledgerSearchSub.unsubscribe();
      this.ledgerSearchSub = null;
    }
  }

  private initBarcodeDetector(): void {
    try {
      const BD = (globalThis as any)?.BarcodeDetector;
      if (typeof BD === 'function') {
        this.barcodeDetector = new BD({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix']
        });
      }
    } catch {
      this.barcodeDetector = null;
    }
  }

  async loadAccessAndLedger(): Promise<void> {
    this.loadingLedger.set(true);
    try {
      const [accessRes, ledgerRes] = await Promise.all([
        this.backend.getSchoolQrScannerAccess(this.actorName()),
        this.backend.getSchoolPrintVerifications({}, this.branchId(), this.wingId())
      ]);
      if (accessRes?.ok && accessRes.policy) {
        this.localPolicy.set(accessRes.policy);
        this.allowedNamesForm.patchValue(
          { namesText: (accessRes.policy.allowedUserNames || []).join(', ') },
          { emitEvent: false }
        );
      }
      if (ledgerRes?.ok) {
        this.ledgerItems.set(Array.isArray(ledgerRes.items) ? ledgerRes.items : []);
        this.scanLogs.set(Array.isArray(ledgerRes.scanLogs) ? ledgerRes.scanLogs : []);
        if (ledgerRes.stats) {
          this.ledgerStats.set(ledgerRes.stats);
        }
      }
    } finally {
      this.loadingLedger.set(false);
    }
  }

  setScannerMode(mode: 'scan' | 'file'): void {
    if (mode === 'file' && !this.currentRolePermissions().canFileScan && !this.isOwner()) {
      this.toast.emit({ message: 'File Scanning is disabled for your role by the School Owner.', type: 'warning' });
      return;
    }
    this.scannerMode.set(mode);
    if (mode === 'file') {
      this.stopCamera();
    } else {
      void this.startCamera();
    }
  }

  openGalleryPicker(): void {
    if (!this.currentRolePermissions().canFileScan && !this.isOwner()) {
      this.toast.emit({ message: 'Image / File Scanning is restricted by School Owner.', type: 'warning' });
      return;
    }
    this.fileInputRef?.nativeElement?.click();
  }

  async startCamera(): Promise<void> {
    if (this.cameraActive() || this.cameraStarting()) return;
    if (!this.currentRolePermissions().canScanCamera && !this.isOwner()) {
      this.cameraError.set('Camera scanning is disabled for your role by the School Owner.');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.cameraError.set('Camera API unavailable in this browser. Use File Scanning or Manual Token Lookup.');
      return;
    }

    this.cameraStarting.set(true);
    this.cameraError.set('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.cameraFacing() },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      this.mediaStream = stream;
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps: any = track.getCapabilities();
        this.torchSupported.set(Boolean(caps?.torch));
      } else {
        this.torchSupported.set(false);
      }
      this.cameraActive.set(true);

      setTimeout(() => {
        const video = this.videoRef?.nativeElement;
        if (video && this.mediaStream) {
          video.srcObject = this.mediaStream;
          void video.play().catch(() => {});
          this.scheduleScanLoop();
        }
      }, 40);
    } catch (err: any) {
      const msg = String(err?.message || 'Camera permission denied or unavailable.');
      this.cameraError.set(`${msg} — Tap "File Scanning" to upload a QR photo or use the lookup bar.`);
      this.cameraActive.set(false);
    } finally {
      this.cameraStarting.set(false);
    }
  }

  stopCamera(): void {
    if (this.rafHandle !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    if (this.mediaStream) {
      for (const t of this.mediaStream.getTracks()) {
        try { t.stop(); } catch {}
      }
      this.mediaStream = null;
    }
    const video = this.videoRef?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
    this.cameraActive.set(false);
    this.torchEnabled.set(false);
    this.fillLightFallback.set(false);
  }

  async flipCamera(): Promise<void> {
    this.cameraFacing.set(this.cameraFacing() === 'environment' ? 'user' : 'environment');
    if (this.cameraActive()) {
      this.stopCamera();
      await this.startCamera();
    }
  }

  async toggleTorch(): Promise<void> {
    const next = !this.torchEnabled();
    const track = this.mediaStream?.getVideoTracks?.()[0];
    if (track && this.torchSupported()) {
      try {
        await (track as any).applyConstraints({ advanced: [{ torch: next }] });
        this.torchEnabled.set(next);
        this.fillLightFallback.set(false);
        return;
      } catch {}
    }
    // Screen fill-light fallback on laptops or unsupported devices
    this.torchEnabled.set(next);
    this.fillLightFallback.set(next);
  }

  private scheduleScanLoop(): void {
    if (!this.cameraActive() || typeof requestAnimationFrame === 'undefined') return;
    let lastSampleMs = 0;
    const step = async (ts: number) => {
      if (!this.cameraActive()) return;
      if (ts - lastSampleMs >= 180 && !this.isVerifying()) {
        lastSampleMs = ts;
        await this.scanCurrentVideoFrame();
      }
      this.rafHandle = requestAnimationFrame(step);
    };
    this.rafHandle = requestAnimationFrame(step);
  }

  private async scanCurrentVideoFrame(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

    const maxW = 720;
    const scale = Math.min(1, maxW / video.videoWidth);
    const w = Math.max(160, Math.round(video.videoWidth * scale));
    const h = Math.max(160, Math.round(video.videoHeight * scale));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    if (this.barcodeDetector) {
      try {
        const hits = await this.barcodeDetector.detect(canvas);
        if (Array.isArray(hits) && hits[0]?.rawValue) {
          this.handleDecodedPayload(String(hits[0].rawValue), 'camera');
          return;
        }
      } catch {}
    }

    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const qr = jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (qr?.data) {
        this.handleDecodedPayload(qr.data, 'camera');
      }
    } catch {}
  }

  async onQrFileSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl?.files?.[0];
    if (!file) return;
    this.scannerMode.set('file');
    this.stopCamera();
    this.uploadedFileName.set(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      this.uploadedPreviewUrl.set(dataUrl);
      await this.decodeImageDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    inputEl.value = '';
  }

  private async decodeImageDataUrl(dataUrl: string): Promise<void> {
    const img = new Image();
    img.onload = async () => {
      const canvas = this.canvasRef?.nativeElement || document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const tryDecodeRegion = async (sx: number, sy: number, sw: number, sh: number, targetW: number, targetH: number): Promise<string> => {
        canvas.width = targetW;
        canvas.height = targetH;
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

        if (this.barcodeDetector) {
          try {
            const hits = await this.barcodeDetector.detect(canvas);
            if (Array.isArray(hits) && hits[0]?.rawValue) return String(hits[0].rawValue);
          } catch {}
        }
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const hit = jsQR(imgData.data, targetW, targetH, { inversionAttempts: 'attemptBoth' });
        return hit?.data || '';
      };

      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const scale = Math.min(1, 1200 / Math.max(iw, ih));
      let decoded = await tryDecodeRegion(0, 0, iw, ih, Math.max(160, Math.round(iw * scale)), Math.max(160, Math.round(ih * scale)));

      // Multi-quadrant crop pass for full-page Challan / Slip photos where QR sits in bottom/top corner
      if (!decoded) {
        const crops = [
          [0, 0, iw / 2, ih / 2],
          [iw / 2, 0, iw / 2, ih / 2],
          [0, ih / 2, iw / 2, ih / 2],
          [iw / 2, ih / 2, iw / 2, ih / 2],
          [iw * 0.25, ih * 0.25, iw * 0.5, ih * 0.5]
        ];
        for (const [sx, sy, sw, sh] of crops) {
          decoded = await tryDecodeRegion(sx, sy, sw, sh, 640, Math.max(320, Math.round((640 * sh) / Math.max(1, sw))));
          if (decoded) break;
        }
      }

      if (decoded) {
        await this.verifyCodeNow(decoded, 'file');
      } else {
        this.toast.emit({
          message: 'No readable QR or barcode found inside that image. Try cropping closer to the QR square or check lighting.',
          type: 'warning'
        });
      }
    };
    img.src = dataUrl;
  }

  private handleDecodedPayload(code: string, source: 'camera' | 'file' | 'usb_gun' | 'manual'): void {
    const clean = String(code || '').trim();
    if (!clean) return;
    const now = Date.now();
    if (clean === this.lastDecodedCode && now - this.lastDecodedAt < 2500) {
      return;
    }
    this.lastDecodedCode = clean;
    this.lastDecodedAt = now;
    this.playScanTone(true);
    void this.verifyCodeNow(clean, source);
  }

  async submitManualLookup(): Promise<void> {
    const raw = this.manualLookupForm.controls.code.value.trim();
    if (!raw) {
      this.toast.emit({ message: 'Enter or scan a QR token, Challan #, Roll #, or EMP code first.', type: 'warning' });
      return;
    }
    await this.verifyCodeNow(raw, 'manual');
  }

  async verifyCodeNow(rawCode: string, scanSource: 'camera' | 'file' | 'usb_gun' | 'manual'): Promise<void> {
    if (this.isVerifying()) return;
    this.isVerifying.set(true);
    try {
      const res = await this.backend.verifySchoolQrCode(
        {
          rawCode,
          scanSource,
          scannerRole: this.portalRole(),
          scannerName: this.actorName()
        },
        this.branchId(),
        this.wingId()
      );
      if (res && res.verdict) {
        this.verificationResult.set(res);
        this.manualLookupForm.patchValue({ code: rawCode }, { emitEvent: false });
        this.playScanTone(Boolean(res.isReal));
        this.toast.emit({
          message: res.isReal
            ? `Verified REAL: ${res.docLabel}${res.duplicateWarning ? ' (Duplicate scan alert)' : ''}`
            : `ALERT (${res.verdict}): ${res.reason}`,
          type: res.isReal ? (res.duplicateWarning ? 'warning' : 'success') : 'error'
        });
        void this.loadAccessAndLedger();
      } else {
        this.toast.emit({ message: res?.message || 'Unable to verify QR code.', type: 'error' });
      }
    } finally {
      this.isVerifying.set(false);
    }
  }

  triggerJumpToLocation(loc?: QrVerificationResult['location'] | null): void {
    if (!loc) return;
    if (!this.currentRolePermissions().canJumpToRecord && !this.isOwner()) {
      this.toast.emit({ message: 'Table jump access is disabled for your role by School Owner.', type: 'warning' });
      return;
    }
    this.jumpToRecord.emit({
      tableId: loc.tableId,
      tableTitle: loc.tableTitle,
      portalTab: loc.portalTab || 'overview',
      subTab: loc.subTab,
      rowKey: loc.rowKey,
      rowLabel: loc.rowLabel,
      searchHint: loc.searchHint
    });
  }

  jumpFromLedgerItem(item: PrintVerificationLedgerItem): void {
    this.triggerJumpToLocation({
      tableId: item.tableId,
      tableTitle: item.tableTitle,
      portalTab: item.portalTab || 'overview',
      subTab: item.subTab,
      rowKey: item.rowKey,
      rowLabel: item.rowLabel,
      searchHint: item.rollOrCode || item.rowKey
    });
  }

  async toggleRevokeLedgerItem(item: PrintVerificationLedgerItem): Promise<void> {
    if (!this.currentRolePermissions().canRevokePrints && !this.isOwner()) {
      this.toast.emit({ message: 'Only the School Owner (or delegated verifier) can revoke printouts.', type: 'warning' });
      return;
    }
    const nextStatus = item.status === 'REVOKED' ? 'ACTIVE' : 'REVOKED';
    const reason = nextStatus === 'REVOKED'
      ? `Revoked via QR Scanner Ledger by ${this.actorName()}`
      : `Restored to ACTIVE by ${this.actorName()}`;
    const res = await this.backend.revokeSchoolPrintVerification(item.printId || item.id, nextStatus, reason, this.actorName());
    if (res?.ok) {
      this.toast.emit({
        message: nextStatus === 'REVOKED'
          ? `Printout ${item.printId} REVOKED — any physical photocopy will now fail QR scan.`
          : `Printout ${item.printId} restored to ACTIVE.`,
        type: nextStatus === 'REVOKED' ? 'warning' : 'success'
      });
      await this.loadAccessAndLedger();
      const active = this.verificationResult();
      if (active && active.printId === item.printId) {
        await this.verifyCodeNow(item.qrToken || item.printId, 'manual');
      }
    } else {
      this.toast.emit({ message: res?.message || 'Unable to update printout status.', type: 'error' });
    }
  }

  async toggleRoleAccess(roleKey: 'principal' | 'teacher' | 'accountant' | 'staff', field: keyof QrRolePermissionConfig): Promise<void> {
    if (!this.isOwner()) return;
    const pol = structuredClone(this.localPolicy());
    const current = Boolean(pol.roles[roleKey][field]);
    pol.roles[roleKey][field] = !current;
    await this.persistAccessPolicy(pol);
  }

  async toggleGlobalSecurityFlag(field: 'antiFakeStrictMode' | 'duplicateScanAlertEnabled'): Promise<void> {
    if (!this.isOwner()) return;
    const pol = structuredClone(this.localPolicy());
    pol[field] = !pol[field];
    await this.persistAccessPolicy(pol);
  }

  async saveAllowedOperatorNames(): Promise<void> {
    if (!this.isOwner()) return;
    const pol = structuredClone(this.localPolicy());
    const raw = this.allowedNamesForm.controls.namesText.value || '';
    pol.allowedUserNames = raw.split(',').map((s) => s.trim()).filter(Boolean);
    await this.persistAccessPolicy(pol);
  }

  private async persistAccessPolicy(pol: QrScannerAccessPolicy): Promise<void> {
    this.savingAccess.set(true);
    try {
      const res = await this.backend.saveSchoolQrScannerAccess(pol, this.actorName());
      if (res?.ok && res.policy) {
        this.localPolicy.set(res.policy);
        this.accessPolicyChanged.emit(res.policy);
        this.toast.emit({ message: 'QR Scanner Role Access Policy saved & synced.', type: 'success' });
      } else {
        this.toast.emit({ message: res?.message || 'Failed to save QR access policy.', type: 'error' });
      }
    } finally {
      this.savingAccess.set(false);
    }
  }

  private playScanTone(real: boolean): void {
    try {
      const AudioCtx = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = real ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(real ? 920 : 280, ctx.currentTime);
      if (real) {
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.09);
      } else {
        osc.frequency.exponentialRampToValueAtTime(170, ctx.currentTime + 0.22);
      }
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (real ? 0.14 : 0.28));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (real ? 0.15 : 0.3));
    } catch {}
  }
}
