import express from 'express';

export function createManufacturingRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/production-lines', (req, res) => {
    res.json({
      ok: true,
      lines: [
        { id: 'line-1', name: 'Assembly Line A - Precision Motors', outputRate: '240 units/hr', efficiency: '98.4%', status: 'RUNNING' },
        { id: 'line-2', name: 'Packaging Line B - Vacuum Sealing', outputRate: '500 packs/hr', efficiency: '95.2%', status: 'RUNNING' }
      ]
    });
  });

  return router;
}
