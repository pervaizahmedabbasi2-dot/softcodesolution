import express from 'express';

export const CLINIC_PATIENTS = [
  { id: 'pat-1', mrNo: 'MRN-2026-0041', fullName: 'Zubair Shah', age: 46, gender: 'Male', phone: '+92 300 2345678', bloodGroup: 'B+', chronic: 'Hypertension', lastVisit: '2026-03-20', status: 'ACTIVE' },
  { id: 'pat-2', mrNo: 'MRN-2026-0042', fullName: 'Amina Khatoon', age: 34, gender: 'Female', phone: '+92 321 8765432', bloodGroup: 'O+', chronic: 'None', lastVisit: '2026-03-24', status: 'ACTIVE' },
  { id: 'pat-3', mrNo: 'MRN-2026-0043', fullName: 'Rashid Minhas', age: 58, gender: 'Male', phone: '+92 333 4455667', bloodGroup: 'A+', chronic: 'Type 2 Diabetes', lastVisit: '2026-03-15', status: 'ACTIVE' },
  { id: 'pat-4', mrNo: 'MRN-2026-0044', fullName: 'Dr. Mariam Bilal', age: 29, gender: 'Female', phone: '+92 345 1122334', bloodGroup: 'AB+', chronic: 'Asthma', lastVisit: '2026-03-26', status: 'ACTIVE' }
];

export const CLINIC_APPOINTMENTS = [
  { id: 'apt-1', tokenNo: 'TKN-01', patientName: 'Zubair Shah', doctor: 'Dr. Tariq Al-Mansoor (Cardiology)', time: '10:30 AM', date: '2026-03-27', fee: 40.00, status: 'IN_CONSULTATION', vitals: 'BP 135/85, Pulse 76' },
  { id: 'apt-2', tokenNo: 'TKN-02', patientName: 'Amina Khatoon', doctor: 'Dr. Zainab Tariq (Gynecology)', time: '11:00 AM', date: '2026-03-27', fee: 45.00, status: 'WAITING', vitals: 'BP 118/75, Temp 98.4F' },
  { id: 'apt-3', tokenNo: 'TKN-03', patientName: 'Rashid Minhas', doctor: 'Dr. Haris Vance (Endocrinology)', time: '11:30 AM', date: '2026-03-27', fee: 50.00, status: 'WAITING', vitals: 'Blood Sugar 160 mg/dL' },
  { id: 'apt-4', tokenNo: 'TKN-04', patientName: 'Dr. Mariam Bilal', doctor: 'Dr. Tariq Al-Mansoor (Cardiology)', time: '12:00 PM', date: '2026-03-27', fee: 40.00, status: 'COMPLETED', vitals: 'Normal ECG' }
];

export const CLINIC_PRESCRIPTIONS = [
  { id: 'rx-1', rxNo: 'RX-2026-891', patientName: 'Zubair Shah', doctor: 'Dr. Tariq Al-Mansoor', medicines: [{ name: 'Amlodipine 5mg', dosage: '1 tab daily morning', days: 30 }, { name: 'Cardiopirin 75mg', dosage: '1 tab after dinner', days: 30 }], diagnosis: 'Mild Primary Hypertension', date: '2026-03-20' },
  { id: 'rx-2', rxNo: 'RX-2026-892', patientName: 'Rashid Minhas', doctor: 'Dr. Haris Vance', medicines: [{ name: 'Metformin 500mg', dosage: '1 tab twice daily', days: 60 }, { name: 'Vitamin D3 200,000 IU', dosage: '1 ampoule monthly', days: 90 }], diagnosis: 'Type 2 Diabetes Mellitus glycemic control', date: '2026-03-15' }
];

export function createClinicRouter(sqliteDb, db, getAppointments, getPatients) {
  const router = express.Router();
  const patients = () => (getPatients ? getPatients() : CLINIC_PATIENTS);
  const appointments = () => (getAppointments ? getAppointments() : CLINIC_APPOINTMENTS);

  router.get('/patients', (req, res) => {
    res.json({ ok: true, patients: patients() });
  });

  router.post('/patients', (req, res) => {
    const p = req.body || {};
    const list = patients();
    const newPatient = {
      id: 'pat-' + Date.now(),
      mrNo: 'MRN-2026-' + String(list.length + 1).padStart(4, '0'),
      fullName: p.fullName || 'New Patient',
      age: Number(p.age || 30),
      gender: p.gender || 'Male',
      phone: p.phone || '',
      bloodGroup: p.bloodGroup || 'O+',
      chronic: p.chronic || 'None',
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };
    list.unshift(newPatient);
    res.json({ ok: true, message: 'Patient registered in EHR', patient: newPatient });
  });

  router.get('/appointments', (req, res) => {
    res.json({ ok: true, appointments: appointments() });
  });

  router.post('/appointments', (req, res) => {
    const a = req.body || {};
    const list = appointments();
    const newApt = {
      id: 'apt-' + Date.now(),
      tokenNo: 'TKN-' + String(list.length + 1).padStart(2, '0'),
      patientName: a.patientName || 'Walk-in Patient',
      doctor: a.doctor || 'Duty Consultant',
      time: a.time || '10:00 AM',
      date: a.date || new Date().toISOString().split('T')[0],
      fee: Number(a.fee || 40),
      status: 'WAITING',
      vitals: a.vitals || 'Vitals Pending'
    };
    list.unshift(newApt);
    res.json({ ok: true, message: 'Appointment queued', appointment: newApt });
  });

  router.post('/appointments/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const apt = appointments().find(a => a.id === id);
    if (apt) {
      apt.status = status;
      return res.json({ ok: true, message: `Appointment status set to ${status}`, appointment: apt });
    }
    res.status(404).json({ ok: false, message: 'Appointment not found' });
  });

  router.get('/prescriptions', (req, res) => {
    res.json({ ok: true, prescriptions: CLINIC_PRESCRIPTIONS });
  });

  router.post('/prescriptions', (req, res) => {
    const r = req.body || {};
    const newRx = {
      id: 'rx-' + Date.now(),
      rxNo: 'RX-2026-' + Math.floor(100 + Math.random() * 900),
      patientName: r.patientName || 'Patient',
      doctor: r.doctor || 'Doctor',
      medicines: r.medicines || [{ name: 'Paracetamol 500mg', dosage: '1 tab SOS', days: 3 }],
      diagnosis: r.diagnosis || 'Clinical review',
      date: new Date().toISOString().split('T')[0]
    };
    CLINIC_PRESCRIPTIONS.unshift(newRx);
    res.json({ ok: true, message: 'Digital Rx issued', prescription: newRx });
  });

  return router;
}
