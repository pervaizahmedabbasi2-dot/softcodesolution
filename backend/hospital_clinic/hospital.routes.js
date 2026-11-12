import express from 'express';
import { CLINIC_PATIENTS, CLINIC_APPOINTMENTS } from './clinic.routes.js';

const DEFAULT_DOCTORS = [
  { id: 'doc-1', name: 'Dr. Tariq Al-Mansoor', specialty: 'Cardiology', shift: 'Morning OPD (09:00-14:00)', status: 'ON_DUTY' },
  { id: 'doc-2', name: 'Dr. Zainab Tariq', specialty: 'Gynecology', shift: 'Morning OPD (10:00-15:00)', status: 'ON_DUTY' },
  { id: 'doc-3', name: 'Dr. Haris Vance', specialty: 'Endocrinology', shift: 'Evening OPD (16:00-21:00)', status: 'ON_DUTY' }
];

const DEFAULT_LAB_TESTS = [
  { id: 'lab-1', testCode: 'CBC-101', name: 'Complete Blood Count (CBC)', patient: 'Zubair Shah', status: 'COMPLETED' },
  { id: 'lab-2', testCode: 'HBA1C-202', name: 'HbA1c Glycemic Profile', patient: 'Rashid Minhas', status: 'PROCESSING' }
];

export function createHospitalRouter(sqliteDb, db, memorySeedData = {}) {
  const router = express.Router();
  const HOSPITAL_PATIENTS = memorySeedData.HOSPITAL_PATIENTS || CLINIC_PATIENTS;
  const HOSPITAL_DOCTORS = memorySeedData.HOSPITAL_DOCTORS || DEFAULT_DOCTORS;
  const HOSPITAL_APPOINTMENTS = memorySeedData.HOSPITAL_APPOINTMENTS || CLINIC_APPOINTMENTS;
  const HOSPITAL_LAB_TESTS = memorySeedData.HOSPITAL_LAB_TESTS || DEFAULT_LAB_TESTS;

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
