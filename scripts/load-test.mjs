#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createApp } from '../server.js';
import { percentile } from '../backend/ops/observability.js';

const CONCURRENCY = Number(process.env.SCS_LOAD_CONCURRENCY || 24);
const DURATION_SEC = Number(process.env.SCS_LOAD_DURATION_SEC || 6);
const TARGET_URL = process.env.SCS_LOAD_TARGET || '';
const MAX_ERROR_RATE_PCT = Number(process.env.SCS_LOAD_MAX_ERROR_PCT || 1.0);

async function runLoadTest() {
  let server = null;
  let runtime = null;
  let tempDir = null;
  let baseUrl = TARGET_URL;

  try {
    if (!baseUrl) {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-load-'));
      const sqliteDbPath = path.join(tempDir, 'load_softcode.db');
      runtime = createApp({
        sqliteDbPath,
        disableFirebase: true,
        disableBackgroundSync: true,
        disableFrontendBuild: true,
        disableRateLimit: true,
        quiet: true
      });
      await new Promise((resolve) => {
        server = runtime.app.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    }

    console.log(`\n[Load Test] Target=${baseUrl} Concurrency=${CONCURRENCY} Duration=${DURATION_SEC}s`);
    const deadline = Date.now() + DURATION_SEC * 1000;
    const latencies = [];
    const statusBuckets = {};
    let totalRequests = 0;
    let failedRequests = 0;
    let server5xx = 0;

    const tenants = ['tenant-load-01', 'tenant-load-02', 'tenant-load-03', 'tenant-load-04'];

    async function worker(workerId) {
      let step = 0;
      while (Date.now() < deadline) {
        const idx = step++;
        const tenantId = tenants[(workerId + idx) % tenants.length];
        const reqStart = process.hrtime.bigint();
        try {
          let res;
          if (idx % 5 === 0) {
            res = await fetch(`${baseUrl}/api/retail/checkout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
              body: JSON.stringify({
                customerName: `Load Buyer ${workerId}-${idx}`,
                cashier: 'Load Cashier',
                total: 250 + (idx % 50),
                paymentMethod: 'Card',
                items: [{ id: 'prd-102', qty: 1 }]
              })
            });
          } else if (idx % 5 === 1) {
            res = await fetch(`${baseUrl}/api/retail/orders`, {
              headers: { 'x-tenant-id': tenantId }
            });
          } else if (idx % 5 === 2) {
            res = await fetch(`${baseUrl}/api/modules`);
          } else if (idx % 5 === 3) {
            res = await fetch(`${baseUrl}/api/auth/challenge`);
          } else {
            res = await fetch(`${baseUrl}/readyz`);
          }
          await res.arrayBuffer();
          const ms = Number(process.hrtime.bigint() - reqStart) / 1e6;
          latencies.push(ms);
          totalRequests += 1;
          statusBuckets[res.status] = (statusBuckets[res.status] || 0) + 1;
          if (res.status >= 500) {
            server5xx += 1;
            failedRequests += 1;
          } else if (res.status >= 400 && res.status !== 429) {
            failedRequests += 1;
          }
        } catch {
          failedRequests += 1;
          totalRequests += 1;
        }
      }
    }

    const startedAt = Date.now();
    await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
    const elapsedSec = Math.max(0.001, (Date.now() - startedAt) / 1000);

    const sorted = [...latencies].sort((a, b) => a - b);
    const rps = Number((totalRequests / elapsedSec).toFixed(1));
    const errorRatePct = totalRequests > 0 ? Number(((failedRequests / totalRequests) * 100).toFixed(3)) : 0;

    const report = {
      ok: server5xx === 0 && errorRatePct <= MAX_ERROR_RATE_PCT,
      target: baseUrl,
      concurrency: CONCURRENCY,
      durationSec: Number(elapsedSec.toFixed(2)),
      totalRequests,
      throughputRps: rps,
      failedRequests,
      server5xx,
      errorRatePct,
      latencyMs: {
        p50: percentile(sorted, 50),
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        max: sorted.length ? Number(sorted[sorted.length - 1].toFixed(2)) : 0
      },
      statusBuckets
    };

    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) {
      console.error('❌ Load test failed SLA thresholds.');
      process.exitCode = 1;
    } else {
      console.log(`✅ Load test PASSED (${rps} req/s, p95=${report.latencyMs.p95}ms, 5xx=${server5xx})`);
    }
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (runtime?.close) runtime.close();
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

runLoadTest();
