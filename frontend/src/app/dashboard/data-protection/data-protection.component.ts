import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardApiService } from '../services/dashboard-api.service';
import { LucideAngularModule } from 'lucide-angular';

interface RecoveryPoint {
  id?: string;
  created_at?: string;

  postgres_sha256?: string;
  sqlite_sha256?: string;

  office_mirror_path?: string;
  office_mirror_sha256?: string;
  office_mirror_verified?: boolean;

  offsite_provider?: string;
  offsite_status?: string;
  offsite_path?: string;
  offsite_sha256?: string;
  offsite_retention_until?: string;
  offsite_verified?: boolean;

  status?: string;
}

interface RecoveryEvent {
  id?: number;
  recovery_id?: string;
  event_type?: string;
  status?: string;
  component?: string;
  message?: string;
  created_at?: string;
}

interface GuardianSupervisorTelemetry {
  heartbeat: string;
  crash_restart_count: number;
  incident_count: number;
  current_operation: string;
  last_heartbeat: string;
}

@Component({
  selector: 'app-dashboard-data-protection',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './data-protection.component.html',
  styleUrl: './data-protection.component.css',
})
export class DashboardDataProtectionComponent implements OnInit, OnDestroy {
  failoverStatus: any = { state: "UNKNOWN", message: "Checking failover readiness…" };
  failoverBusy = false;

  loading = true;

  errorMessage = '';

  liveState: 'LIVE' | 'DEGRADED' | 'ERROR' = 'DEGRADED';

  lastRefreshAt: string | null = null;

  backups: RecoveryPoint[] = [];

  latestBackup: RecoveryPoint | null = null;

  recoveryEvents: RecoveryEvent[] = [];
  guardianSupervisorTelemetry: GuardianSupervisorTelemetry | null = null;

  /**
   * Authoritative state returned by /api/recovery/status.
   */
  recoveryStatus: any = null;

  operationBusy: 'create' | 'verify' | 'restore' | null = null;

  operationMessage = '';

  operationError = '';

  private liveRefreshTimer: ReturnType<typeof setInterval> | null = null;

  readonly liveRefreshIntervalMs = 5000;

  readonly layers = [
    {
      number: 1,
      name: 'Core Recovery',
      description: 'PostgreSQL + SQLite recovery point',
      status: 'Waiting',
    },
    {
      number: 2,
      name: 'Office Mirror',
      description: 'Verified local mirror protection',
      status: 'Waiting',
    },
    {
      number: 3,
      name: 'Offsite Copy',
      description: 'Independent offsite protection',
      status: 'Waiting',
    },
    {
      number: 4,
      name: 'Reconciliation',
      description: 'Latest trusted recovery selection',
      status: 'Waiting',
    },
    {
      number: 5,
      name: 'Crash Supervisor',
      description: 'Independent process health and restart',
      status: 'Waiting',
    },
  ];

  readonly activityColumns = [
    'Time',
    'Layer',
    'Event',
    'Trigger',
    'Recovery ID',
    'Actor',
    'Result',
  ];

  constructor(private readonly dashboardApi: DashboardApiService) {}

  async ngOnInit(): Promise<void> {
    await this.loadProtectionState();
    await this.loadFailoverStatus();

    this.liveRefreshTimer = setInterval(() => {
      void this.loadProtectionState();
    }, this.liveRefreshIntervalMs);
  }

  ngOnDestroy(): void {
    if (this.liveRefreshTimer) {
      clearInterval(this.liveRefreshTimer);
      this.liveRefreshTimer = null;
    }
  }

  async refresh(): Promise<void> {
    await this.loadProtectionState();
  }

  async loadProtectionState(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const [backups, events, recoveryStatus, guardianSupervisorResponse] = await Promise.all([
        this.dashboardApi.listBackups(),
        this.dashboardApi.listRecoveryEvents(100),
        this.dashboardApi.getRecoveryStatus(),
        this.dashboardApi.getGuardianSupervisorTelemetry(),
      ]);

      this.backups = Array.isArray(backups) ? backups : [];

      this.recoveryEvents = Array.isArray(events) ? events : [];

      this.recoveryStatus = recoveryStatus && recoveryStatus.ok !== false ? recoveryStatus : null;
      this.guardianSupervisorTelemetry =
        guardianSupervisorResponse?.ok === true && guardianSupervisorResponse.telemetry
          ? guardianSupervisorResponse.telemetry
          : null;

      this.latestBackup = this.findLatest();

      this.updateLayerState();

      this.lastRefreshAt = new Date().toISOString();

      const protectionScore = this.protectionScore;

      this.liveState =
        protectionScore === 100 ? 'LIVE' : protectionScore > 0 ? 'DEGRADED' : 'ERROR';
    } catch (error) {
      this.guardianSupervisorTelemetry = null;
      console.error('[DataProtection] authoritative telemetry failed', error);

      this.errorMessage = 'Authoritative protection telemetry is unavailable.';

      this.liveState = 'ERROR';

      this.backups = [];

      this.latestBackup = null;

      this.recoveryEvents = [];
    } finally {
      this.loading = false;
    }
  }

  private findLatest(): RecoveryPoint | null {
    if (!this.backups.length) {
      return null;
    }

    return (
      [...this.backups].sort((a, b) => {
        const left = Date.parse(a.created_at || '') || 0;

        const right = Date.parse(b.created_at || '') || 0;

        return right - left;
      })[0] || null
    );
  }

  private updateLayerState(): void {
    const backendLayers = this.recoveryStatus?.layers;

    if (backendLayers) {
      this.layers[0].status = backendLayers.layer1_core || this.layers[0].status;

      this.layers[1].status = backendLayers.layer2_office_mirror || this.layers[1].status;

      this.layers[2].status = backendLayers.layer3_offsite || this.layers[2].status;

      this.layers[3].status = backendLayers.layer4_reconcile || this.layers[3].status;

      this.layers[4].status = backendLayers.layer5_guardian || this.layers[4].status;

      return;
    }

    const backup = this.latestBackup;

    /*
     * Layer 1
     */
    this.layers[0].status =
      backup && !!backup.postgres_sha256 && !!backup.sqlite_sha256 ? 'Verified' : 'Degraded';

    /*
     * Layer 2
     */
    this.layers[1].status = backup?.office_mirror_verified === true ? 'Verified' : 'Not verified';

    /*
     * Layer 3
     */
    this.layers[2].status =
      backup?.offsite_verified === true ? 'Verified' : backup?.offsite_status || 'Not verified';

    /*
     * Layer 4
     *
     * We derive authoritative state from persisted
     * reconciliation events instead of displaying
     * a fake "Verified" value.
     */
    const reconciliation = this.latestEventFor([
      'reconciliation',
      'recovery_reconciliation',
      'reconcile',
    ]);

    this.layers[3].status =
      reconciliation?.status === 'success' || reconciliation?.status === 'verified'
        ? 'Verified'
        : reconciliation
          ? reconciliation.status || 'Observed'
          : 'No event';

    /*
     * Layer 5
     */
    const guardian = this.latestEventFor(['guardian', 'supervisor', 'crash_supervisor']);

    this.layers[4].status =
      guardian?.status === 'success' ||
      guardian?.status === 'healthy' ||
      guardian?.status === 'verified'
        ? 'Verified'
        : guardian
          ? guardian.status || 'Observed'
          : 'No event';
  }

  private latestEventFor(keywords: string[]): RecoveryEvent | null {
    const matches = this.recoveryEvents.filter((event) => {
      const type = String(event.event_type || '').toLowerCase();

      const component = String(event.component || '').toLowerCase();

      return keywords.some((keyword) => type.includes(keyword) || component.includes(keyword));
    });

    return matches[0] || null;
  }

  get protectionScore(): number {
    const backendScore = Number(this.recoveryStatus?.score);

    if (Number.isFinite(backendScore) && backendScore >= 0 && backendScore <= 100) {
      return backendScore;
    }

    /*
     * Five equally weighted protection layers.
     *
     * 1 = 20%
     * 2 = 20%
     * 3 = 20%
     * 4 = 20%
     * 5 = 20%
     */
    let score = 0;

    for (const layer of this.layers) {
      if (layer.status === 'Verified') {
        score += 20;
      }
    }

    return score;
  }

  get latestRecoveryId(): string {
    return this.recoveryStatus?.latest_recovery_point?.id || this.latestBackup?.id || null;
  }

  get latestRecoveryTime(): string {
    return (
      this.recoveryStatus?.latest_recovery_point?.created_at || this.latestBackup?.created_at || null
    );
  }

  get activeWarnings(): number {
    if (Array.isArray(this.recoveryStatus?.warnings)) {
      return this.recoveryStatus.warnings.length;
    }

    const backup = this.latestBackup;

    if (!backup) {
      return 1;
    }

    let warnings = 0;

    if (!backup.postgres_sha256 || !backup.sqlite_sha256) {
      warnings++;
    }

    if (backup.office_mirror_verified !== true) {
      warnings++;
    }

    if (backup.offsite_verified !== true) {
      warnings++;
    }

    if (this.layers[3].status !== 'Verified') {
      warnings++;
    }

    if (this.layers[4].status !== 'Verified') {
      warnings++;
    }

    return warnings;
  }

  get warningSummary(): string {
    if (!this.latestBackup) {
      return 'No authoritative recovery point is available.';
    }

    const reasons: string[] = [];

    if (!this.latestBackup.postgres_sha256 || !this.latestBackup.sqlite_sha256) {
      reasons.push('Core PostgreSQL/SQLite verification is incomplete.');
    }

    if (this.latestBackup.office_mirror_verified !== true) {
      reasons.push('Office Mirror is not verified.');
    }

    if (this.latestBackup.offsite_verified !== true) {
      reasons.push('Offsite copy is not verified.');
    }

    if (this.layers[3].status !== 'Verified') {
      reasons.push('Reconciliation has no successful authoritative event.');
    }

    if (this.layers[4].status !== 'Verified') {
      reasons.push('Guardian has no successful authoritative health event.');
    }

    return reasons.length
      ? reasons.join(' ')
      : 'All protection layers currently report verified state.';
  }

  get layerReasons(): string[] {
    const backup = this.latestBackup;

    if (!backup) {
      return [
        'Waiting for PostgreSQL + SQLite recovery evidence.',
        'Waiting for Office Mirror verification.',
        'Waiting for Offsite verification.',
        'Waiting for reconciliation telemetry.',
        'Waiting for Guardian telemetry.',
      ];
    }

    return [
      backup.postgres_sha256 && backup.sqlite_sha256
        ? 'PostgreSQL and SQLite hashes are present.'
        : 'PostgreSQL/SQLite verification data is missing.',

      backup.office_mirror_verified === true
        ? 'Office Mirror is verified.'
        : 'Office Mirror is not verified.',

      backup.offsite_verified === true
        ? 'Offsite package and SHA-256 are verified.'
        : 'Offsite copy is not verified.',

      this.layers[3].status === 'Verified'
        ? 'Latest reconciliation event completed successfully.'
        : 'No successful reconciliation event is currently available.',

      this.layers[4].status === 'Verified'
        ? 'Latest Guardian/supervisor event reports healthy state.'
        : 'No successful Guardian/supervisor event is currently available.',
    ];
  }

  get liveStateLabel(): string {
    switch (this.liveState) {
      case 'LIVE':
        return 'Live';

      case 'ERROR':
        return 'Telemetry unavailable';

      default:
        return 'Waiting for verification';
    }
  }

  get liveDataAgeSeconds(): number | null {
    if (!this.lastRefreshAt) {
      return null;
    }

    const timestamp = Date.parse(this.lastRefreshAt);

    if (!Number.isFinite(timestamp)) {
      return null;
    }

    return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  }

  get liveStateReason(): string {
    if (this.liveState === 'ERROR') {
      return this.errorMessage || 'Authoritative recovery API unavailable.';
    }

    if (!this.latestBackup) {
      return 'No authoritative recovery point available.';
    }

    if (this.activeWarnings > 0) {
      return this.warningSummary;
    }

    return 'All currently exposed protection telemetry is responding normally.';
  }

  get latestReconciliationEvent(): RecoveryEvent | null {
    const matches = this.recoveryEvents.filter((event) => {
      const type = String(event.event_type || '').toLowerCase();
      const component = String(event.component || '').toLowerCase();

      return (
        type.includes('reconcil') ||
        type.includes('reconcile') ||
        component.includes('reconcil') ||
        component.includes('reconcile')
      );
    });

    return matches[0] || null;
  }

  get latestGuardianEvent(): RecoveryEvent | null {
    const matches = this.recoveryEvents.filter((event) => {
      const type = String(event.event_type || '').toLowerCase();
      const component = String(event.component || '').toLowerCase();

      return (
        type.includes('guardian') ||
        type.includes('supervisor') ||
        type.includes('heartbeat') ||
        type.includes('crash')
      );
    });

    return matches[0] || null;
  }

  get guardianEvents(): RecoveryEvent[] {
    return this.recoveryEvents.filter((event) => {
      const type = String(event.event_type || '').toLowerCase();
      const component = String(event.component || '').toLowerCase();

      return (
        type.includes('guardian') ||
        type.includes('supervisor') ||
        type.includes('heartbeat') ||
        type.includes('crash')
      );
    });
  }

  async createRecoveryPoint(): Promise<void> {
    if (this.operationBusy) {
      return;
    }

    this.operationBusy = 'create';
    this.operationMessage = 'Creating authoritative recovery point…';
    this.operationError = '';

    try {
      const result = await this.dashboardApi.createBackup();

      if (!result?.ok) {
        this.operationError = result?.message || 'Recovery point creation failed.';
        return;
      }

      this.operationMessage = 'Recovery point created successfully.';

      await this.loadProtectionState();
    } catch (error) {
      console.error('[DataProtection] create recovery point failed', error);

      this.operationError = 'Recovery point creation failed.';
    } finally {
      this.operationBusy = null;
    }
  }

  async verifyRecoveryPoint(id?: string): Promise<void> {
    const recoveryId = id || this.latestBackup?.id;

    if (!recoveryId || this.operationBusy) {
      return;
    }

    this.operationBusy = 'verify';

    this.operationMessage = 'Verifying recovery point integrity…';

    this.operationError = '';

    try {
      const result = await this.dashboardApi.verifyBackup(recoveryId);

      if (!result?.ok) {
        this.operationError = result?.message || 'Recovery point verification failed.';
        return;
      }

      this.operationMessage = 'Recovery point verified successfully.';

      await this.loadProtectionState();
    } catch (error) {
      console.error('[DataProtection] verify recovery point failed', error);

      this.operationError = 'Recovery point verification failed.';
    } finally {
      this.operationBusy = null;
    }
  }

  async restoreRecoveryPoint(id?: string): Promise<void> {
    const recoveryId = id || this.latestBackup?.id;

    if (!recoveryId || this.operationBusy) {
      return;
    }

    const confirmed = window.confirm(
      'Restore this authoritative recovery point to PostgreSQL + SQLite?\n\n' +
        'This is a destructive recovery operation.',
    );

    if (!confirmed) {
      return;
    }

    this.operationBusy = 'restore';

    this.operationMessage = 'Restoring PostgreSQL + SQLite from the selected recovery point…';

    this.operationError = '';

    try {
      const result = await this.dashboardApi.restoreBackup(recoveryId, 'both');

      if (!result?.ok) {
        this.operationError = result?.message || 'Restore operation failed.';
        return;
      }

      this.operationMessage = 'Restore completed and post-restore verification succeeded.';

      await this.loadProtectionState();
    } catch (error) {
      console.error('[DataProtection] restore recovery point failed', error);

      this.operationError = 'Restore operation failed.';
    } finally {
      this.operationBusy = null;
    }
  }

  get recoveryPoints(): RecoveryPoint[] {
    return this.backups;
  }

  get recoveryActivity(): RecoveryEvent[] {
    return this.recoveryEvents;
  }

  trackByIndex(index: number): number {
    return index;
  }

  async loadFailoverStatus(): Promise<void> {
    try {
      this.failoverStatus = await this.dashboardApi.getFailoverStatus();
    } catch {
      this.failoverStatus = {
        state: 'UNKNOWN',
        message: 'Failover status unavailable.',
      };
    }
  }

  async evaluateAutomaticFailover(): Promise<void> {
    if (this.failoverBusy) {
      return;
    }

    this.failoverBusy = true;

    try {
      const result = await this.dashboardApi.evaluateFailover();

      this.failoverStatus = result?.status ?? result;
    } catch (error: any) {
      this.failoverStatus = error?.error?.status ?? {
        state: 'BLOCKED',
        message: error?.message || 'Failover evaluation blocked.',
      };
    } finally {
      this.failoverBusy = false;
    }
  }

  async promoteAutomaticFailover(): Promise<void> {
    if (this.failoverBusy) {
      return;
    }

    const confirmed = window.confirm(
      'Evaluate and promote the configured Hot Standby if all failover prerequisites are satisfied?',
    );

    if (!confirmed) {
      return;
    }

    this.failoverBusy = true;

    try {
      const result = await this.dashboardApi.promoteFailover();

      this.failoverStatus = result?.status ?? result;
    } catch (error: any) {
      this.failoverStatus = error?.error?.status ?? {
        state: 'BLOCKED',
        message: error?.message || 'Promotion blocked by failover prerequisites.',
      };
    } finally {
      this.failoverBusy = false;
    }
  }
}
