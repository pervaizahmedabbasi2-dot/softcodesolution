import express from 'express';

export function createSolarRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/systems', (req, res) => {
    res.json({
      ok: true,
      systems: [
        { id: 'sol-1', client: 'Malik Textiles Industrial Estate', capacityKW: 150, panelsCount: 260, inverter: 'Huawei 100kW On-Grid', generationTodayKWh: 680, status: 'GENERATING' },
        { id: 'sol-2', client: 'Commercial Plaza Clifton', capacityKW: 35, panelsCount: 64, inverter: 'Growatt 30kW Hybrid', generationTodayKWh: 155, status: 'GENERATING' }
      ]
    });
  });

  return router;
}
