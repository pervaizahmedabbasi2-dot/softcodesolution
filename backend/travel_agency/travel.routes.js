import express from 'express';

export function createTravelRouter(sqliteDb, db, getPackages, getVisas) {
  const router = express.Router();

  router.get('/packages', (req, res) => {
    res.json({ ok: true, packages: getPackages ? getPackages() : [] });
  });

  router.get('/visas', (req, res) => {
    res.json({ ok: true, visas: getVisas ? getVisas() : [] });
  });

  return router;
}
