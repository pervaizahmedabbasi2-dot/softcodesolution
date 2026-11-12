import express from 'express';

export function createMarketingRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/campaigns', (req, res) => {
    res.json({
      ok: true,
      campaigns: [
        { id: 'mkt-1', client: 'Apex E-Commerce Store', platform: 'Meta & Google Ads', monthlyAdBudgetUSD: 12000, roas: '4.8x', status: 'ACTIVE' },
        { id: 'mkt-2', client: 'GreenField Real Estate', platform: 'LinkedIn & YouTube Lead Gen', monthlyAdBudgetUSD: 8500, roas: '3.2x', status: 'ACTIVE' }
      ]
    });
  });
  return router;
}
