import express from 'express';

export function createAutoRouter(sqliteDb, db, getJobs, getFleet) {
  const router = express.Router();

  router.get('/jobs', (req, res) => {
    res.json({ ok: true, jobs: getJobs ? getJobs() : [] });
  });

  router.get('/fleet', (req, res) => {
    res.json({ ok: true, fleet: getFleet ? getFleet() : [] });
  });

  return router;
}
