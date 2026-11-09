import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DashboardApiService } from '../services/dashboard-api.service';

interface BackupRecord {
  id?: string;
  created_at?: string;
  postgres?: boolean;
  sqlite?: boolean;
  postgres_sha256?: string;
  sqlite_sha256?: string;
  size_bytes?: number;
  status?: string;
  office_mirror_path?: string;
  office_mirror_sha256?: string;
  office_mirror_verified?: boolean;
  offsite_provider?: string;
  offsite_status?: string;
  offsite_path?: string;
  offsite_sha256?: string;
  offsite_retention_until?: string;
  offsite_verified?: boolean;
}

@Component({
  selector: 'app-dashboard-backup-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backup-manager.component.html',
  styleUrl: './backup-manager.component.css',
})
export class BackupManagerComponent implements OnInit {
  backups: BackupRecord[] = [];

  get latestBackup(): BackupRecord | null {
    if (!this.backups.length) {
      return null;
    }

    return [...this.backups].sort((a, b) => {
      const left =
        new Date(a.created_at || 0).getTime();

      const right =
        new Date(b.created_at || 0).getTime();

      return right - left;
    })[0] || null;
  }

  get recoveryLayerCount(): number {
    const backup =
      this.latestBackup;

    if (!backup) {
      return 0;
    }

    return [
      !!backup.sqlite_sha256,
      !!backup.postgres_sha256,
      backup.office_mirror_verified === true
    ].filter(Boolean).length;
  }

  get coreRecoveryLabel(): string {
    return `${this.recoveryLayerCount}/3`;
  }

  get offsiteStatus(): string {
    const backup =
      this.latestBackup;

    if (!backup) {
      return 'NOT CONFIGURED';
    }

    if (
      backup.offsite_verified === true
    ) {
      return 'VERIFIED';
    }

    if (
      backup.offsite_status === 'failed'
    ) {
      return 'FAILED';
    }

    if (
      backup.offsite_status === 'pending'
    ) {
      return 'PENDING';
    }

    return 'NOT CONFIGURED';
  }

  get restoreVerificationStatus(): string {
    return 'NOT CONFIGURED';
  }

  get activeWarningCount(): number {

    const backup =
      this.latestBackup;

    if (!backup) {
      return 0;
    }

    let count = 0;

    if (!backup.sqlite_sha256) {
      count++;
    }

    if (!backup.postgres_sha256) {
      count++;
    }

    if (!backup.office_mirror_verified) {
      count++;
    }

    if (
      backup.offsite_status === 'failed'
    ) {
      count++;
    }

    return count;
  }

  get latestRecoveryId(): string {
    return this.latestBackup?.id || '—';
  }

  get latestRecoveryTime(): string {
    return this.latestBackup?.created_at || '';
  }

  get retentionDaysLabel(): string {
    return this.latestBackup?.offsite_retention_until
      ? 'Configured'
      : 'Pending';
  }

  get storageUsageLabel(): string {

    const total =
      this.backups.reduce(
        (sum, backup) =>
          sum +
          Number(
            backup.size_bytes || 0
          ),
        0
      );

    return this.formatBytes(total);
  }


  loading = false;
  creating = false;
  verifyingId: string | null = null;
  restoringId: string | null = null;

  errorMessage = '';
  successMessage = '';

  selectedBackup: BackupRecord | null = null;

  restoreTarget: 'local' | 'postgres' | 'both' = 'both';

  showRestoreConfirm = false;

  constructor(private readonly api: DashboardApiService) {}

  async ngOnInit(): Promise<void> {
    await this.loadBackups();
  }

  async loadBackups(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.backups = await this.api.listBackups();
    } catch (error) {
      this.errorMessage = String(error);
    } finally {
      this.loading = false;
    }
  }

  async createBackup(): Promise<void> {
    if (this.creating) {
      return;
    }

    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const result = await this.api.createBackup();

      if (result?.ok === false) {
        this.errorMessage = result?.message || 'Backup creation failed.';

        return;
      }

      this.successMessage = 'Backup created successfully.';

      await this.loadBackups();
    } catch (error) {
      this.errorMessage = String(error);
    } finally {
      this.creating = false;
    }
  }

  async verifyBackup(backup: BackupRecord): Promise<void> {
    const id = backup.id;

    if (!id || this.verifyingId) {
      return;
    }

    this.verifyingId = id;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const result = await this.api.verifyBackup(id);

      if (result?.ok === false) {
        this.errorMessage = result?.message || 'Backup verification failed.';

        return;
      }

      this.successMessage = 'Backup SHA-256 verification passed.';

      await this.loadBackups();
    } catch (error) {
      this.errorMessage = String(error);
    } finally {
      this.verifyingId = null;
    }
  }

  openRestore(backup: BackupRecord): void {
    if (!backup.id) {
      return;
    }

    this.selectedBackup = backup;
    this.restoreTarget = 'both';
    this.showRestoreConfirm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelRestore(): void {
    this.showRestoreConfirm = false;
    this.selectedBackup = null;
  }

  async confirmRestore(): Promise<void> {
    const backup = this.selectedBackup;

    if (!backup?.id || this.restoringId) {
      return;
    }

    this.restoringId = backup.id;

    this.errorMessage = '';
    this.successMessage = '';

    try {
      const result = await this.api.restoreBackup(backup.id, this.restoreTarget);

      if (result?.ok === false) {
        const detail =
          result?.message ||
          result?.error ||
          result?.detail ||
          result?.data?.message ||
          JSON.stringify(result);

        console.error(
          '❌ Backup restore failed:',
          result,
        );

        this.errorMessage =
          String(detail || 'Restore failed.');

        return;
      }

      this.successMessage = 'Restore completed successfully.';

      this.showRestoreConfirm = false;
      this.selectedBackup = null;

      await this.loadBackups();
    } catch (error) {
      this.errorMessage = String(error);
    } finally {
      this.restoringId = null;
    }
  }

  formatBytes(value: number | undefined): string {
    if (!value) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];

    let size = value;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }

    return size.toFixed(index === 0 ? 0 : 2) + ' ' + units[index];
  }
}
