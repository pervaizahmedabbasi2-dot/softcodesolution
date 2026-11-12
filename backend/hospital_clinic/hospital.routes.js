import express from 'express';

export function createHospitalRouter(sqliteDb, db, memorySeedData) {
  const router = express.Router();
  const { HOSPITAL_PATIENTS, HOSPITAL_DOCTORS, HOSPITAL_APPOINTMENTS, HOSPITAL_LAB_TESTS } = memorySeedData;

  router.get('/patients', (req, res) => {
    res.json({ ok: true, patients: HOSPITAL_PATIENTS });
  });

  router.get('/doctors', (req, res) => {
    res.json({ ok: true, doctors: HOSPITAL_DOCTORS });
  });

  router.get('/appointments', (req, res) => {
    res.json({ ok: true, appointments: HOSPITAL_APPOINTMENTS });
  });

  router.get('/lab-tests', (req, res) => {
    res.json({ ok: true, tests: HOSPITAL_LAB_TESTS });
  });

  return router;
}
