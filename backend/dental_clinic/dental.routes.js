import express from 'express';

export function createDentalRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/procedures', (req, res) => {
    res.json({
      ok: true,
      procedures: [
        { id: 'den-1', patient: 'Amina Siddiqui', procedure: 'Root Canal Treatment (RCT)', toothNo: '16', feeUSD: 180, status: 'IN_PROGRESS' },
        { id: 'den-2', patient: 'Omer Farooq', procedure: 'Teeth Scaling & Polishing', toothNo: 'Full Arch', feeUSD: 75, status: 'COMPLETED' }
      ]
    });
  });
  return router;
}
