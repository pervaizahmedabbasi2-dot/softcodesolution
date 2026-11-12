import express from 'express';

export function createCarRentalRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/rentals', (req, res) => {
    res.json({
      ok: true,
      rentals: [
        { id: 'cr-1', vehicle: 'Toyota Fortuner V8', plateNo: 'ICT-2025-990', hirer: 'Embassy Delegation', perDayUSD: 140, returnDate: '2026-03-31', status: 'ON_RENT' },
        { id: 'cr-2', vehicle: 'Honda Civic Oriel 1.8', plateNo: 'LHR-2024-441', hirer: 'Walk-in Executive', perDayUSD: 60, returnDate: '2026-03-29', status: 'ON_RENT' }
      ]
    });
  });
  return router;
}
