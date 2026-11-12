import express from 'express';

export function createPlatformRouter(sqliteDb, db, getAllModules) {
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

  return router;
}
