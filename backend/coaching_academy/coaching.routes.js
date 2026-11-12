import express from 'express';

export function createCoachingRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/batches', (req, res) => {
    res.json({
      ok: true,
      batches: [
        { id: 'bch-1', title: 'MDCAT Intensive Crash Course 2026', subject: 'Biology & Chemistry', studentsCount: 45, timing: '03:00 PM - 06:00 PM', instructor: 'Dr. Kamran', status: 'ACTIVE' },
        { id: 'bch-2', title: 'ECAT Advanced Mathematics & Physics', subject: 'Calculus & Physics', studentsCount: 38, timing: '06:00 PM - 08:30 PM', instructor: 'Sir Asad', status: 'ACTIVE' }
      ]
    });
  });

  return router;
}
