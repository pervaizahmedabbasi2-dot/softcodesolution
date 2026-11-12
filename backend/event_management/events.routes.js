import express from 'express';

export function createEventsRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/bookings', (req, res) => {
    res.json({
      ok: true,
      events: [
        { id: 'evt-1', code: 'EVT-2026-90', title: 'Executive Corporate Gala & Awards', venue: 'Grand Pearl Banquet', guests: 350, date: '2026-04-12', budgetUSD: 18000, status: 'CONFIRMED' },
        { id: 'evt-2', code: 'EVT-2026-91', title: 'Royal Destination Wedding Reception', venue: 'Lakeside Pavilion', guests: 600, date: '2026-04-20', budgetUSD: 45000, status: 'PLANNING' }
      ]
    });
  });

  return router;
}
