import express from 'express';

export const AUTO_JOBS = [
  { id: 'job-1', jobNo: 'JOB-2026-041', vehicle: 'Toyota Corolla Altis (ICT-9921)', customer: 'Adnan Sheikh', mechanic: 'Master Akram', service: 'Full Suspension & Brake Overhaul', estimate: 340.00, status: 'IN_PROGRESS', date: '2026-03-26' },
  { id: 'job-2', jobNo: 'JOB-2026-042', vehicle: 'Honda Civic RS (LEE-3310)', customer: 'Noman Bashir', mechanic: 'Tariq Ustad', service: 'Periodic 40,000km Engine Tune-up', estimate: 120.00, status: 'READY_DELIVERY', date: '2026-03-27' },
  { id: 'job-3', jobNo: 'JOB-2026-043', vehicle: 'KIA Sportage AWD (BKL-4401)', customer: 'Waqas Javed', mechanic: 'Ustad Imtiaz', service: 'Transmission Flush & AC Gas Refill', estimate: 210.00, status: 'QUEUED', date: '2026-03-27' }
];

export const AUTO_FLEET = [
  { id: 'flt-1', vehicle: 'Toyota Fortuner Legender', plate: 'ISB-2024-007', ratePerDay: 130.00, status: 'ON_RENT', currentHirer: 'Executive Protocol Delegation', returnDate: '2026-03-30' },
  { id: 'flt-2', vehicle: 'Hyundai Elantra 2.0 GLS', plate: 'LHR-2025-881', ratePerDay: 55.00, status: 'AVAILABLE', currentHirer: 'In Showroom Yard', returnDate: '-' },
  { id: 'flt-3', vehicle: 'Suzuki Alto VXL Auto', plate: 'KHI-2024-512', ratePerDay: 25.00, status: 'AVAILABLE', currentHirer: 'Ready for Dispatch', returnDate: '-' }
];

export function createAutoRouter(sqliteDb, db, getJobs, getFleet) {
  const router = express.Router();
  const jobs = () => (getJobs ? getJobs() : AUTO_JOBS);
  const fleet = () => (getFleet ? getFleet() : AUTO_FLEET);

  router.get('/jobs', (req, res) => {
    res.json({ ok: true, jobs: jobs() });
  });

  router.post('/jobs', (req, res) => {
    const j = req.body || {};
    const list = jobs();
    const newJob = {
      id: 'job-' + Date.now(),
      jobNo: 'JOB-2026-' + String(list.length + 45).padStart(3, '0'),
      vehicle: j.vehicle || 'Vehicle Details',
      customer: j.customer || 'Vehicle Owner',
      mechanic: j.mechanic || 'Lead Mechanic',
      service: j.service || 'Diagnostic & Repair',
      estimate: Number(j.estimate || 150.0),
      status: 'QUEUED',
      date: new Date().toISOString().split('T')[0]
    };
    list.unshift(newJob);
    res.json({ ok: true, job: newJob });
  });

  router.post('/jobs/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const job = jobs().find(j => j.id === id);
    if (job) {
      job.status = status;
      return res.json({ ok: true, job });
    }
    res.status(404).json({ ok: false });
  });

  router.get('/fleet', (req, res) => {
    res.json({ ok: true, fleet: fleet() });
  });

  return router;
}
