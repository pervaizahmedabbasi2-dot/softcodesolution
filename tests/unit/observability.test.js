import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ObservabilityEngine,
  redactSensitive,
  percentile,
  authorizeMetricsRequest
} from '../../backend/ops/observability.js';

test('redactSensitive: strips passwords, tokens, passphrases, and nested secrets', () => {
  const clean = redactSensitive({
    email: 'ops@softcodesolution.com',
    password: 'MySecretPassword!1',
    nested: {
      apiKey: 'sk-live-secret',
      vipPassphrase: 'secret-phrase',
      safeFlag: true
    }
  });

  assert.equal(clean.email, 'ops@softcodesolution.com');
  assert.equal(clean.password, '[REDACTED]');
  assert.equal(clean.nested.apiKey, '[REDACTED]');
  assert.equal(clean.nested.vipPassphrase, '[REDACTED]');
  assert.equal(clean.nested.safeFlag, true);
});

test('percentile: computes accurate p50, p95, p99 latency buckets', () => {
  const values = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.equal(percentile(values, 50), 50);
  assert.equal(percentile(values, 95), 95);
  assert.equal(percentile(values, 99), 99);
  assert.equal(percentile([], 95), 0);
});

test('ObservabilityEngine: tracks request metrics, 5xx errors, and Prometheus output', () => {
  const obs = new ObservabilityEngine({ serviceName: 'test-svc' });
  obs.recordRequest('/api/health', 200, 4.2);
  obs.recordRequest('/api/retail/checkout', 200, 18.5);
  obs.recordRequest('/api/auth/login', 401, 25.0);
  obs.recordRequest('/api/platform/boom', 500, 42.1);

  const snap = obs.getMetricsSnapshot(null);
  assert.equal(snap.requests.total, 4);
  assert.equal(snap.requests.status['2xx'], 2);
  assert.equal(snap.requests.status['4xx'], 1);
  assert.equal(snap.requests.status['5xx'], 1);
  assert.equal(snap.requests.errorRate5xxPct, 25);
  assert.ok(snap.latencyMs.p95 >= 25);

  const prom = obs.toPrometheusText(null);
  assert.match(prom, /softcode_http_requests_total 4/);
  assert.match(prom, /softcode_http_responses_status_total\{class="5xx"\} 1/);
});

test('ObservabilityEngine: dispatches and rate-limits webhook & Sentry alerts', async () => {
  const calls = [];
  const mockFetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200 };
  };

  const obs = new ObservabilityEngine({
    alertCooldownMs: 60_000,
    alertWebhookUrl: 'https://hooks.example.test/alerts',
    sentryDsn: 'https://publickey123@o123.ingest.sentry.io/456',
    fetchImpl: mockFetch
  });

  const first = await obs.notifyAlert('db-lock', { severity: 'CRITICAL', message: 'Test alert' });
  assert.equal(first.sent, true);
  assert.equal(calls.length, 2, 'Should deliver to both webhook and Sentry envelope endpoint');

  const second = await obs.notifyAlert('db-lock', { severity: 'CRITICAL', message: 'Duplicate spike' });
  assert.equal(second.throttled, true);
  assert.equal(calls.length, 2, 'Cooldown must prevent alert storm');
});

test('authorizeMetricsRequest: enforces SCS_METRICS_TOKEN when configured', () => {
  const prev = process.env.SCS_METRICS_TOKEN;
  try {
    delete process.env.SCS_METRICS_TOKEN;
    assert.equal(authorizeMetricsRequest({ headers: {} }), true);

    process.env.SCS_METRICS_TOKEN = 'ops-metrics-token-2026';
    assert.equal(authorizeMetricsRequest({ headers: {} }), false);
    assert.equal(authorizeMetricsRequest({ headers: { 'x-metrics-token': 'wrong' } }), false);
    assert.equal(authorizeMetricsRequest({ headers: { 'x-metrics-token': 'ops-metrics-token-2026' } }), true);
    assert.equal(
      authorizeMetricsRequest({ headers: { authorization: 'Bearer ops-metrics-token-2026' } }),
      true
    );
  } finally {
    if (prev === undefined) delete process.env.SCS_METRICS_TOKEN;
    else process.env.SCS_METRICS_TOKEN = prev;
  }
});
