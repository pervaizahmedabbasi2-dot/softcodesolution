import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly apiBase = '/api';

  // SCS_DASHBOARD_API_SERVICE_V1

  // SCS_PHASE669_DASHBOARD_API_REQUEST
  // Shared authenticated API reader.
  // Uses existing backend routes only.

  private async safeJson(response: Response, fallback: any = null): Promise<any> {
    try {
      const text = await response.text();
      if (!text || text.trim().startsWith('<')) {
        return fallback;
      }
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

private async requestJSON<T = any>(path: string, fallback: T): Promise<T> {
    try {
      const response = await fetch(this.apiBase + path, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        return fallback;
      }
      const text = await response.text();
      if (!text || text.trim().startsWith('<')) {
         return fallback;
      }
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  }

  // SCS_PHASE678_TRIPLE_BACKUP_SUMMARY
  // Reads the existing real backup API.
  // No fake third-layer health is reported here.
  async loadTripleBackupSummary(): Promise<any> {
    const result: any = await this.requestJSON('/superadmin/backups', { ok: false, items: [] });

    const items = Array.isArray(result?.items)
      ? result.items
      : Array.isArray(result?.backups)
        ? result.backups
        : [];

    const sorted = [...items].sort((a, b) => {
      const left = new Date(a?.created_at || 0).getTime();

      const right = new Date(b?.created_at || 0).getTime();

      return right - left;
    });

    const latest = sorted.length > 0 ? sorted[0] : null;

    const officeMirrorAvailable = !!latest?.office_mirror_path;

    const officeMirrorVerified = latest?.office_mirror_verified === true;

    return {
      ok: result?.ok === true,

      totalBackups: sorted.length,

      latest,

      layers: {
        localSQLite: {
          available: !!latest?.sqlite,

          verified: !!latest?.sqlite_sha256,
        },

        postgres: {
          available: !!latest?.postgres,

          verified: !!latest?.postgres_sha256,
        },

        officeMirror: {
          available: officeMirrorAvailable,

          verified: officeMirrorVerified,

          implemented: officeMirrorAvailable,

          status: officeMirrorVerified
            ? 'verified'
            : officeMirrorAvailable
              ? 'pending'
              : 'not-created',

          path: latest?.office_mirror_path || null,

          sha256: latest?.office_mirror_sha256 || null,
        },
      },
    };
  }

  // SCS_LOAD_SUMMARY_V1
  async loadSummary(): Promise<any> {
    try {
      const response = await fetch(this.apiBase + '/superadmin/tenants/summary', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      return await this.safeJson(response);
    } catch (error) {
      return {
        ok: false,
        code: 'network_error',
        message: String(error),
      };
    }
  }

  // SCS_PHASE669_ACTIVITY_REAL_API
  // Existing backend source: RBAC audit.
  async loadActivity(): Promise<any[]> {
    const result: any = await this.requestJSON('/superadmin/rbac/audit?limit=50', {
      ok: false,
      items: [],
    });

    return Array.isArray(result?.items) ? result.items : [];
  }

  // SCS_PHASE669_STATISTICS_REAL_API
  // Existing backend source: tenant summary.
  // No new statistics endpoint is invented.
  async loadStatistics(): Promise<any[]> {
    const result: any = await this.requestJSON('/superadmin/tenants/summary', {
      ok: false,
      items: [],
    });

    if (result && typeof result === 'object' && Array.isArray(result.items)) {
      return result.items;
    }

    if (result && typeof result === 'object' && Array.isArray(result.tenants)) {
      return result.tenants;
    }

    return [];
  }

  // SCS_PHASE669_HEALTH_REAL_API
  // Existing backend health endpoint.
  async loadHealth(): Promise<any[]> {
    const result: any = await this.requestJSON('/healthz', { ok: false });

    return [
      {
        source: 'healthz',
        ok: result?.ok === true,
        status: result?.status || null,
        service: result?.service || null,
      },
    ];
  }

  // SCS_PHASE669_MONITORING_REAL_API
  // Existing readiness endpoint.
  async loadMonitoring(): Promise<any[]> {
    const result: any = await this.requestJSON('/readyz', { ok: false });

    return [
      {
        source: 'readyz',
        ok: result?.ok === true,
        status: result?.status || null,
        service: result?.service || null,
      },
    ];
  }

  // SCS_PHASE669_NOTIFICATIONS_REAL_API
  // Existing backend source: pending payment approvals.
  async loadNotifications(): Promise<any[]> {
    const result: any = await this.requestJSON('/payment/pending-approvals', {
      ok: false,
      transactions: [],
    });

    return Array.isArray(result?.transactions) ? result.transactions : [];
  }

  // SCS_PHASE677D_BACKUP_API
  // Real backup/restore API methods.
  // Uses the existing backend contract only.

  async listBackups(): Promise<any[]> {
    const result: any = await this.requestJSON('/superadmin/backups', { ok: false, backups: [] });

    return Array.isArray(result?.backups) ? result.backups : [];
  }

  async listRecoveryEvents(limit = 100): Promise<any[]> {
    try {
      const response = await fetch(
        this.apiBase + '/superadmin/recovery/events?limit=' + encodeURIComponent(String(limit)),
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        },
      );

      const result = await this.safeJson(response);

      if (!response.ok) {
        return [];
      }

      return Array.isArray(result?.events) ? result.events : [];
    } catch (error) {
      console.error('[DashboardApi] recovery events failed', error);

      return [];
    }
  }

  async createBackup(): Promise<any> {
    try {
      const response = await fetch(this.apiBase + '/superadmin/backups', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      const result = await this.safeJson(response);

      if (!response.ok) {
        return {
          ok: false,
          ...result,
        };
      }

      return result;
    } catch (error) {
      return {
        ok: false,
        code: 'network_error',
        message: String(error),
      };
    }
  }

  async verifyBackup(id: string): Promise<any> {
    try {
      const response = await fetch(
        this.apiBase + '/superadmin/backups/' + encodeURIComponent(id) + '/verify',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        },
      );

      const result = await this.safeJson(response);

      if (!response.ok) {
        return {
          ok: false,
          ...result,
        };
      }

      return result;
    } catch (error) {
      return {
        ok: false,
        code: 'network_error',
        message: String(error),
      };
    }
  }

  async restoreBackup(id: string, target: 'local' | 'postgres' | 'both'): Promise<any> {
    try {
      const response = await fetch(
        this.apiBase + '/superadmin/backups/' + encodeURIComponent(id) + '/restore',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          body: JSON.stringify({
            backup_id: id,
            confirm: 'RESTORE',
            target,
          }),
        },
      );

      const result = await this.safeJson(response);

      if (!response.ok) {
        return {
          ok: false,
          ...result,
        };
      }

      return result;
    } catch (error) {
      return {
        ok: false,
        code: 'network_error',
        message: String(error),
      };
    }
  }
  async getGuardianSupervisorTelemetry(): Promise<any> {
    return this.requestJSON('/recovery/supervisor-telemetry', {
      ok: false,
      telemetry: null,
    });
  }

  async getRecoveryStatus(): Promise<any> {
    const result: any = await this.requestJSON('/recovery/status', { ok: false });
    return result;
  }

  async getRecoveryEvents(limit: number = 50): Promise<any[]> {
    const result: any = await this.requestJSON(`/recovery/events?limit=${limit}`, {
      ok: false,
      events: [],
    });
    return Array.isArray(result?.events) ? result.events : [];
  }

  async getFailoverStatus(): Promise<any> {
    return this.requestJSON('/superadmin/failover/status', {
      state: 'UNKNOWN',
      message: 'Failover status unavailable.',
    });
  }

  async evaluateFailover(): Promise<any> {
    const response = await fetch(this.apiBase + '/superadmin/failover/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const result = await this.safeJson(response);

    if (!response.ok) {
      throw new Error(result?.message || result?.status?.message || 'Failover evaluation failed.');
    }

    return result;
  }

  async promoteFailover(): Promise<any> {
    const response = await fetch(this.apiBase + '/superadmin/failover/promote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const result = await this.safeJson(response);

    if (!response.ok) {
      throw new Error(result?.message || result?.status?.message || 'Failover promotion failed.');
    }

    return result;
  }
}
