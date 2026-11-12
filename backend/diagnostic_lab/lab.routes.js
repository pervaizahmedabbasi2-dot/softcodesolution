import express from 'express';

export function createLabRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/reports', (req, res) => {
    res.json({
      ok: true,
      reports: [
        { id: 'lab-1', sampleNo: 'SMP-2026-901', patient: 'Khalid Mehmood', testName: 'Complete Blood Count (CBC) + ESR', status: 'COMPLETED', date: '2026-03-27' },
        { id: 'lab-2', sampleNo: 'SMP-2026-902', patient: 'Shagufta Begum', testName: 'Lipid Profile & HbA1c', status: 'PROCESSING', date: '2026-03-27' }
      ]
    });
  });
  return router;
}
