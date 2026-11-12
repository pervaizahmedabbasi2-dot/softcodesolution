import express from 'express';

export function createWholesaleRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/orders', (req, res) => {
    res.json({
      ok: true,
      orders: [
        { id: 'w-1', invoiceNo: 'WHL-2026-001', retailer: 'Metro Hypermarket', itemsCount: 450, totalUSD: 14200, status: 'DISPATCHED' },
        { id: 'w-2', invoiceNo: 'WHL-2026-002', retailer: 'Al-Madina Marts', itemsCount: 180, totalUSD: 5800, status: 'DELIVERED' }
      ]
    });
  });
  return router;
}
