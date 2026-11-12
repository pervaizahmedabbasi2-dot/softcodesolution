import express from 'express';

export function createLegalRouter(sqliteDb, db, getCases) {
  const router = express.Router();

  router.get('/cases', (req, res) => {
    res.json({ ok: true, cases: getCases ? getCases() : [] });
  });

  return router;
}
