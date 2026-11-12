import express from 'express';

export function createCateringRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/orders', (req, res) => {
    res.json({
      ok: true,
      orders: [
        { id: 'cat-1', client: 'Bank Alfalah Corporate Lunch', menu: 'Buffet Deal A', pax: 150, date: '2026-03-29', totalUSD: 2450, status: 'PREPARING' },
        { id: 'cat-2', client: 'Walima Reception - Abbasi Family', menu: 'Royal Moghlai Menu', pax: 500, date: '2026-04-05', totalUSD: 7800, status: 'BOOKED' }
      ]
    });
  });
  return router;
}
