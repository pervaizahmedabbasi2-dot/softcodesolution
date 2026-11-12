import express from 'express';

export const SALON_APPOINTMENTS = [
  { id: 'sln-1', apptNo: 'SLN-2026-301', client: 'Mahnoor Khan', service: 'Signature Bridal Makeover & Spa', stylist: 'Sana Senior Artist', chair: 'VIP Suite 1', timeSlot: 'Today 11:30 AM', price: 180.00, status: 'CONFIRMED' },
  { id: 'sln-2', apptNo: 'SLN-2026-302', client: 'Fatima Zahra', service: 'Keratin Hair Therapy & Cut', stylist: 'Amna Hair Stylist', chair: 'Station 3', timeSlot: 'Today 02:00 PM', price: 95.00, status: 'IN_SERVICE' },
  { id: 'sln-3', apptNo: 'SLN-2026-303', client: 'Sarah Imran', service: 'HydraFacial Glow Treatment', stylist: 'Nida Skin Specialist', chair: 'Esthetic Room B', timeSlot: 'Today 04:30 PM', price: 70.00, status: 'SCHEDULED' }
];

export function createSalonRouter(sqliteDb, db, getAppointments) {
  const router = express.Router();
  const appointments = () => (getAppointments ? getAppointments() : SALON_APPOINTMENTS);

  router.get('/appointments', (req, res) => {
    res.json({ ok: true, appointments: appointments() });
  });

  router.post('/appointments', (req, res) => {
    const a = req.body || {};
    const list = appointments();
    const newAppt = {
      id: 'sln-' + Date.now(),
      apptNo: 'SLN-2026-' + (list.length + 305),
      client: a.client || 'Client Guest',
      service: a.service || 'Hair & Skin Service',
      stylist: a.stylist || 'Lead Stylist',
      chair: a.chair || 'Station 1',
      timeSlot: a.timeSlot || 'Today 03:00 PM',
      price: Number(a.price || 50.0),
      status: 'CONFIRMED'
    };
    list.unshift(newAppt);
    res.json({ ok: true, appointment: newAppt });
  });

  router.post('/appointments/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const appt = appointments().find(a => a.id === id);
    if (appt) {
      appt.status = status;
      return res.json({ ok: true, appointment: appt });
    }
    res.status(404).json({ ok: false });
  });

  return router;
}
