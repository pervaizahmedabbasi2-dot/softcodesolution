import crypto from 'crypto';
import os from 'os';

const REDACTED_KEYS = new Set([
  'password',
  'password_hash',
  'passwordHash',
  'vipPassphrase',
  'passphrase',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'apiKey',
  'api_key',
  'secret',
  'masterKey',
  'blindKey',
  'wrapped_dek',
  'wrapped_dek_vip'
]);

export function redactSensitive(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (depth > 6) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (REDACTED_KEYS.has(k) || /password|secret|token|passphrase|apikey/i.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redactSensitive(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export function percentile(sortedValues, p) {
  if (!sortedValues || sortedValues.length === 0) return 0;
  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedValues.length) - 1)
  );
  return Number(sortedValues[idx].toFixed(2));
}

export class ObservabilityEngine {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'softcodesolution-enterprise';
    this.startedAt = Date.now();
    this.maxLatencySamples = options.maxLatencySamples || 2000;
    this.latenciesMs = [];
    this.totalRequests = 0;
    this.activeRequests = 0;
    this.statusCounts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 };
    this.routeStats = new Map();
    this.recentErrors = [];
    this.syncStats = {
      runs: 0,
      lastRunAt: null,
      lastSuccessAt: null,
      lastError: null,
      totalRecordsSynced: 0
    };
    this.alertCooldownMs = options.alertCooldownMs ?? 60_000;
    this.lastAlertByKey = new Map();
    this.alertWebhookUrl = options.alertWebhookUrl ?? process.env.SCS_ALERT_WEBHOOK_URL ?? '';
    this.sentryDsn = options.sentryDsn ?? process.env.SENTRY_DSN ?? '';
    this.logFormat = options.logFormat ?? process.env.SCS_LOG_FORMAT ?? 'text';
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
  }

  log(level, event, meta = {}) {
    const cleanMeta = redactSensitive(meta);
    if (this.logFormat === 'json') {
      const entry = {
        ts: new Date().toISOString(),
        level,
        service: this.serviceName,
        event,
        ...cleanMeta
      };
      const line = JSON.stringify(entry);
      if (level === 'error') console.error(line);
      else if (level === 'warn') console.warn(line);
      else console.log(line);
      return entry;
    }
    if (level === 'error') {
      console.error(`[${this.serviceName}] ERROR ${event}`, cleanMeta);
    } else if (level === 'warn') {
      console.warn(`[${this.serviceName}] WARN ${event}`, cleanMeta);
    }
    return { ts: new Date().toISOString(), level, event, ...cleanMeta };
  }

  _bucketRoute(reqPath) {
    if (!reqPath) return '/';
    const parts = String(reqPath).split('/').filter(Boolean);
    if (parts[0] === 'api' && parts[1]) return `/api/${parts[1]}`;
    if (parts[0] === 'api') return '/api';
    return `/${parts[0] || ''}`;
  }

  recordRequest(reqPath, statusCode, durationMs) {
    this.totalRequests += 1;
    const ms = Math.max(0, Number(durationMs) || 0);
    this.latenciesMs.push(ms);
    if (this.latenciesMs.length > this.maxLatencySamples) {
      this.latenciesMs.shift();
    }

    if (statusCode >= 500) this.statusCounts['5xx'] += 1;
    else if (statusCode >= 400) this.statusCounts['4xx'] += 1;
    else if (statusCode >= 300) this.statusCounts['3xx'] += 1;
    else if (statusCode >= 200) this.statusCounts['2xx'] += 1;
    else this.statusCounts.other += 1;

    const bucket = this._bucketRoute(reqPath);
    const prev = this.routeStats.get(bucket) || { count: 0, errors5xx: 0, totalMs: 0 };
    prev.count += 1;
    if (statusCode >= 500) prev.errors5xx += 1;
    prev.totalMs += ms;
    this.routeStats.set(bucket, prev);
  }

  recordSyncRun({ ok, syncedCount = 0, error = null }) {
    this.syncStats.runs += 1;
    this.syncStats.lastRunAt = new Date().toISOString();
    if (ok) {
      this.syncStats.lastSuccessAt = this.syncStats.lastRunAt;
      this.syncStats.totalRecordsSynced += syncedCount;
      this.syncStats.lastError = null;
    } else if (error) {
      this.syncStats.lastError = String(error?.message || error);
    }
  }

  async notifyAlert(alertKey, payload) {
    const now = Date.now();
    const lastSent = this.lastAlertByKey.get(alertKey) || 0;
    if (now - lastSent < this.alertCooldownMs) {
      return { sent: false, throttled: true };
    }
    this.lastAlertByKey.set(alertKey, now);

    const safePayload = redactSensitive({
      service: this.serviceName,
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      ...payload
    });

    const deliveries = [];
    if (this.alertWebhookUrl && typeof this.fetchImpl === 'function') {
      deliveries.push(
        this.fetchImpl(this.alertWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `[${safePayload.service}] ${safePayload.severity || 'ERROR'}: ${safePayload.message || alertKey}`,
            ...safePayload
          })
        }).catch(() => null)
      );
    }

    if (this.sentryDsn && typeof this.fetchImpl === 'function') {
      const envelope = this._buildSentryEnvelope(safePayload);
      if (envelope) {
        deliveries.push(
          this.fetchImpl(envelope.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-sentry-envelope',
              'X-Sentry-Auth': envelope.authHeader
            },
            body: envelope.body
          }).catch(() => null)
        );
      }
    }

    if (deliveries.length > 0) {
      await Promise.allSettled(deliveries);
      return { sent: true, throttled: false };
    }
    return { sent: false, throttled: false, reason: 'no_sink_configured' };
  }

  _buildSentryEnvelope(payload) {
    try {
      const parsed = new URL(this.sentryDsn);
      const publicKey = parsed.username;
      const projectId = parsed.pathname.replace(/^\/+/, '');
      if (!publicKey || !projectId) return null;
      const endpoint = `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/`;
      const eventId = crypto.randomBytes(16).toString('hex');
      const header = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
      const itemHeader = JSON.stringify({ type: 'event' });
      const itemBody = JSON.stringify({
        event_id: eventId,
        timestamp: Date.now() / 1000,
        platform: 'node',
        level: 'error',
        server_name: os.hostname(),
        environment: payload.environment,
        message: payload.message || 'Unhandled server error',
        extra: payload
      });
      return {
        endpoint,
        authHeader: `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=softcode-ops/1.0`,
        body: `${header}\n${itemHeader}\n${itemBody}\n`
      };
    } catch {
      return null;
    }
  }

  captureError(err, req = null) {
    const errorEntry = redactSensitive({
      id: `err-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      message: err?.message || String(err || 'Unknown error'),
      code: err?.code || 'INTERNAL_ERROR',
      method: req?.method || null,
      path: req?.originalUrl || req?.path || null,
      requestId: req?.requestId || null,
      tenantId: req?.headers?.['x-tenant-id'] || null
    });

    this.recentErrors.unshift(errorEntry);
    if (this.recentErrors.length > 50) {
      this.recentErrors.pop();
    }

    this.log('error', 'unhandled_exception', errorEntry);
    void this.notifyAlert(`err:${errorEntry.path || errorEntry.code}`, {
      severity: 'CRITICAL',
      ...errorEntry
    });
    return errorEntry;
  }

  getSqliteSnapshot(sqliteDb) {
    if (!sqliteDb) {
      return { connected: false, journalMode: 'unavailable', pendingCloudSync: {} };
    }
    const snapshot = {
      connected: true,
      journalMode: 'unknown',
      pageCount: 0,
      pendingCloudSync: {}
    };
    try {
      const jm = sqliteDb.prepare('PRAGMA journal_mode').get();
      if (jm) snapshot.journalMode = jm.journal_mode || Object.values(jm)[0] || 'unknown';
      const pc = sqliteDb.prepare('PRAGMA page_count').get();
      if (pc) snapshot.pageCount = Number(pc.page_count || Object.values(pc)[0] || 0);
    } catch {}

    const syncTables = [
      'local_tenants',
      'local_pos_orders',
      'local_school_students',
      'local_school_fees',
      'local_school_attendance'
    ];
    for (const table of syncTables) {
      try {
        const row = sqliteDb.prepare(`SELECT COUNT(*) AS cnt FROM ${table} WHERE is_synced = 0`).get();
        snapshot.pendingCloudSync[table] = Number(row?.cnt || 0);
      } catch {}
    }
    return snapshot;
  }

  getMetricsSnapshot(sqliteDb) {
    const sorted = [...this.latenciesMs].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, n) => acc + n, 0);
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor((Date.now() - this.startedAt) / 1000);
    const errorRatePct =
      this.totalRequests > 0
        ? Number(((this.statusCounts['5xx'] / this.totalRequests) * 100).toFixed(3))
        : 0;

    const topRoutes = [...this.routeStats.entries()]
      .map(([route, stats]) => ({
        route,
        count: stats.count,
        errors5xx: stats.errors5xx,
        avgMs: stats.count > 0 ? Number((stats.totalMs / stats.count).toFixed(2)) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      ok: true,
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptimeSec,
      requests: {
        total: this.totalRequests,
        active: this.activeRequests,
        status: this.statusCounts,
        errorRate5xxPct: errorRatePct
      },
      latencyMs: {
        samples: sorted.length,
        avg: sorted.length > 0 ? Number((sum / sorted.length).toFixed(2)) : 0,
        p50: percentile(sorted, 50),
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        max: sorted.length > 0 ? Number(sorted[sorted.length - 1].toFixed(2)) : 0
      },
      process: {
        rssMb: Number((mem.rss / 1048576).toFixed(2)),
        heapUsedMb: Number((mem.heapUsed / 1048576).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / 1048576).toFixed(2)),
        nodeVersion: process.version
      },
      sqlite: this.getSqliteSnapshot(sqliteDb),
      syncWorker: this.syncStats,
      alerting: {
        webhookConfigured: Boolean(this.alertWebhookUrl),
        sentryConfigured: Boolean(this.sentryDsn)
      },
      topRoutes,
      recentErrors: this.recentErrors.slice(0, 10)
    };
  }

  toPrometheusText(sqliteDb) {
    const snap = this.getMetricsSnapshot(sqliteDb);
    const pendingTotal = Object.values(snap.sqlite.pendingCloudSync || {}).reduce((a, b) => a + b, 0);
    return [
      '# HELP softcode_http_requests_total Total HTTP requests processed',
      '# TYPE softcode_http_requests_total counter',
      `softcode_http_requests_total ${snap.requests.total}`,
      '# HELP softcode_http_requests_active Current active HTTP requests',
      '# TYPE softcode_http_requests_active gauge',
      `softcode_http_requests_active ${snap.requests.active}`,
      '# HELP softcode_http_responses_status_total HTTP responses grouped by class',
      '# TYPE softcode_http_responses_status_total counter',
      `softcode_http_responses_status_total{class="2xx"} ${snap.requests.status['2xx']}`,
      `softcode_http_responses_status_total{class="4xx"} ${snap.requests.status['4xx']}`,
      `softcode_http_responses_status_total{class="5xx"} ${snap.requests.status['5xx']}`,
      '# HELP softcode_http_latency_ms HTTP latency percentiles in milliseconds',
      '# TYPE softcode_http_latency_ms gauge',
      `softcode_http_latency_ms{quantile="0.50"} ${snap.latencyMs.p50}`,
      `softcode_http_latency_ms{quantile="0.95"} ${snap.latencyMs.p95}`,
      `softcode_http_latency_ms{quantile="0.99"} ${snap.latencyMs.p99}`,
      '# HELP softcode_process_rss_bytes Process resident set size in bytes',
      '# TYPE softcode_process_rss_bytes gauge',
      `softcode_process_rss_bytes ${Math.round(snap.process.rssMb * 1048576)}`,
      '# HELP softcode_sqlite_pending_sync_rows Pending offline-first records waiting for cloud sync',
      '# TYPE softcode_sqlite_pending_sync_rows gauge',
      `softcode_sqlite_pending_sync_rows ${pendingTotal}`
    ].join('\n') + '\n';
  }

  requestMiddleware() {
    return (req, res, next) => {
      const start = process.hrtime.bigint();
      const incomingId = req.headers['x-request-id'];
      req.requestId = typeof incomingId === 'string' && incomingId.trim()
        ? incomingId.trim().slice(0, 64)
        : `req-${crypto.randomBytes(6).toString('hex')}`;
      res.setHeader('X-Request-Id', req.requestId);

      this.activeRequests += 1;
      let finished = false;
      const finalize = () => {
        if (finished) return;
        finished = true;
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        this.recordRequest(req.path || req.originalUrl, res.statusCode, durationMs);
        if (res.statusCode >= 500) {
          this.log('error', 'http_5xx', {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl || req.path,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2))
          });
        }
      };

      res.on('finish', finalize);
      res.on('close', finalize);
      next();
    };
  }

  errorMiddleware() {
    return (err, req, res, next) => {
      if (res.headersSent) return next(err);
      const captured = this.captureError(err, req);
      res.status(err?.status || 500).json({
        ok: false,
        code: captured.code,
        requestId: captured.requestId,
        message: process.env.NODE_ENV === 'production'
          ? 'Internal server error. Reference ID logged for engineering review.'
          : captured.message
      });
    };
  }
}

export function authorizeMetricsRequest(req) {
  const configuredToken = process.env.SCS_METRICS_TOKEN;
  if (!configuredToken) return true;
  const headerToken = req.headers['x-metrics-token'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  if (!headerToken || headerToken.length !== configuredToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(configuredToken));
}
