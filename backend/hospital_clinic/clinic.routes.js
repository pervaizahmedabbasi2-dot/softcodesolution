import express from 'express';

export function createClinicRouter(sqliteDb, db, getAppointments, getPatients) {
  const router = express.Router();

  router.get('/appointments', (req, res) => {
    res.json({ ok: true, appointments: getAppointments ? getAppointments() : [] });
  });

  router.get('/patients', (req, res) => {
    res.json({ ok: true, patients: getPatients ? getPatients() : [] });
  });

  return router;
}
