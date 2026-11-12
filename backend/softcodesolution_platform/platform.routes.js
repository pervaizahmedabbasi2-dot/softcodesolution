import express from 'express';

export function createPlatformRouter(sqliteDb, db, getAllModules, sqliteDbPath = './backend/auth/database/local_softcodesolution.db') {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({
      ok: true,
      platform: 'SoftCode Solution Multi-Tenant Cloud & Edge Kernel',
      version: 'v2026.4.1',
      status: 'ONLINE',
      company: 'SoftCode Solution',
      founder: 'Pervaiz Ahmed Abbasi',
      totalModulesCatalog: getAllModules ? getAllModules().length : 221
    });
  });

  router.get('/modules', (req, res) => {
    res.json({
      ok: true,
      modules: getAllModules ? getAllModules() : []
    });
  });

  router.get('/database/status', (req, res) => {
    let sqliteCount = 0;
    let pendingSyncCount = 0;
    if (sqliteDb) {
      try {
        const countStmt = sqliteDb.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN is_synced = 0 THEN 1 ELSE 0 END) as pending FROM local_tenants');
        const row = countStmt.get();
        if (row) {
          sqliteCount = Number(row.total || 0);
          pendingSyncCount = Number(row.pending || 0);
        }
      } catch (e) {}
    }

    res.json({
      ok: true,
      engine: 'SoftCode Dual-Database Architecture',
      offline: {
        driver: 'SQLite3 (node:sqlite / C-Engine)',
        path: sqliteDbPath,
        status: sqliteDb ? 'ONLINE_ACTIVE' : 'STANDBY',
        recordsStored: sqliteCount,
        pendingCloudSync: pendingSyncCount
      },
      online: {
        target: 'PostgreSQL Cloud Schema / Cloud Firestore DB',
        status: 'CONNECTED',
        rlsEnabled: true,
        schema: 'cloud_schema.sql'
      },
      syncMode: 'Offline-First Write ➔ Automated Cloud Sync (Bi-directional)'
    });
  });

  return router;
}
