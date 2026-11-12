import express from 'express';

export function createVocationalRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/courses', (req, res) => {
    res.json({
      ok: true,
      courses: [
        { id: 'voc-1', title: 'Industrial CNC Lathe Operation', durationMonths: 6, enrolled: 28, certification: 'NVQ Level 3' },
        { id: 'voc-2', title: 'Solar PV Systems Installation', durationMonths: 3, enrolled: 42, certification: 'NABCEP Certified' }
      ]
    });
  });
  return router;
}
