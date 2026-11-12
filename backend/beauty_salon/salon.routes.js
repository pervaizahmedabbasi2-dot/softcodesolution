import express from 'express';

export function createSalonRouter(sqliteDb, db, getAppointments) {
  const router = express.Router();

  router.get('/appointments', (req, res) => {
    res.json({ ok: true, appointments: getAppointments ? getAppointments() : [] });
  });

  return router;
}
