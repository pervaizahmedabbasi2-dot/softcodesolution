import express from 'express';

export function createCleaningRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/schedules', (req, res) => {
    res.json({
      ok: true,
      schedules: [
        { id: 'cln-1', facility: 'Corporate Tower A - Floors 1-5', shift: 'Night Shift', supervisor: 'Akhtar Ali', cleanersAssigned: 8, status: 'SCHEDULED' },
        { id: 'cln-2', facility: 'Medical Complex ICU & Sterile Corridors', shift: 'Morning Shift', supervisor: 'Shahida Perveen', cleanersAssigned: 6, status: 'IN_PROGRESS' }
      ]
    });
  });

  return router;
}
