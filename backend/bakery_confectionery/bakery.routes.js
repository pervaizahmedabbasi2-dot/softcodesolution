import express from 'express';

export function createBakeryRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/batches', (req, res) => {
    res.json({
      ok: true,
      batches: [
        { id: 'bkr-1', product: 'Artisan Sourdough Loaf 700g', quantityBaked: 80, oven: 'Deck Oven 1', bakedAt: '05:30 AM', status: 'FRESH' },
        { id: 'bkr-2', product: 'Butter Croissants & Danish Pastries', quantityBaked: 120, oven: 'Convection 2', bakedAt: '06:15 AM', status: 'FRESH' }
      ]
    });
  });

  return router;
}
