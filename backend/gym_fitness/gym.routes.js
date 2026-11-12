import express from 'express';

export function createGymRouter(sqliteDb, db, getMembers, getCheckins) {
  const router = express.Router();

  router.get('/members', (req, res) => {
    res.json({ ok: true, members: getMembers ? getMembers() : [] });
  });

  router.get('/checkins', (req, res) => {
    res.json({ ok: true, checkins: getCheckins ? getCheckins() : [] });
  });

  return router;
}
