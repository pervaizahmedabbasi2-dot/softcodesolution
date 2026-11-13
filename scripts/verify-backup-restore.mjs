#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

const DEFAULT_DB = path.resolve(
  process.env.SOFTCODE_SQLITE_DB || './backend/auth/database/local_softcodesolution.db'
);
const keepFile = process.argv.includes('--keep');

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function runBackupVerify() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-backup-verify-'));
  let sourcePath = DEFAULT_DB;
  let createdTempSource = false;

  try {
    if (!fs.existsSync(sourcePath)) {
      createdTempSource = true;
      sourcePath = path.join(tempDir, 'seed_source.db');
      const seedDb = new DatabaseSync(sourcePath);
      const platformSchemaPath = path.resolve('./backend/softcodesolution_platform/platform_schema.sql');
      if (fs.existsSync(platformSchemaPath)) {
        seedDb.exec(fs.readFileSync(platformSchemaPath, 'utf8'));
      }
      seedDb.close();
    }

    const backupPath = path.join(tempDir, `backup-${Date.now()}.sqlite`);
    const escapedBackupPath = backupPath.replace(/'/g, "''");

    const sourceDb = new DatabaseSync(sourcePath);
    sourceDb.exec('PRAGMA busy_timeout = 5000;');
    sourceDb.exec(`VACUUM INTO '${escapedBackupPath}';`);
    sourceDb.close();

    const checksum = sha256File(backupPath);
    const sizeBytes = fs.statSync(backupPath).size;

    const restoredDb = new DatabaseSync(backupPath, { readOnly: true });
    const integrity = restoredDb.prepare('PRAGMA integrity_check;').get();
    const integrityVal = integrity ? Object.values(integrity)[0] : 'unknown';

    const tables = restoredDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((r) => r.name);

    let tenantCount = 0;
    if (tables.includes('local_tenants')) {
      const row = restoredDb.prepare('SELECT COUNT(*) AS cnt FROM local_tenants').get();
      tenantCount = Number(row?.cnt || 0);
    }
    restoredDb.close();

    if (integrityVal !== 'ok') {
      throw new Error(`SQLite integrity_check failed: ${integrityVal}`);
    }

    const summary = {
      ok: true,
      sourceMode: createdTempSource ? 'ci_ephemeral_schema' : 'live_sqlite_db',
      backupBytes: sizeBytes,
      sha256: checksum,
      integrityCheck: integrityVal,
      tableCount: tables.length,
      localTenantsCount: tenantCount
    };

    console.log(JSON.stringify(summary, null, 2));
    console.log('✅ Backup & restore integrity verification PASSED.');
  } finally {
    if (!keepFile && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

runBackupVerify();
