import express from 'express';

export const GYM_MEMBERS = [
  { id: 'gym-1', memberNo: 'GYM-2026-101', name: 'Zubair Khan', plan: 'Annual VIP Pro', fee: 45.00, dueDate: '2026-12-15', trainer: 'Coach Usman', lastCheckIn: 'Today 07:30 AM', status: 'ACTIVE' },
  { id: 'gym-2', memberNo: 'GYM-2026-102', name: 'Bilal Ahmed', plan: 'Monthly Standard', fee: 30.00, dueDate: '2026-04-05', trainer: 'Self-Guided', lastCheckIn: 'Today 08:15 AM', status: 'ACTIVE' },
  { id: 'gym-3', memberNo: 'GYM-2026-103', name: 'Ali Raza', plan: 'CrossFit & PT', fee: 65.00, dueDate: '2026-03-25', trainer: 'Coach Farhan', lastCheckIn: 'Yesterday', status: 'EXPIRED' }
];

export const GYM_CHECKINS = [
  { id: 'chk-1', memberName: 'Zubair Khan', plan: 'Annual VIP Pro', time: '07:30 AM', gate: 'Main Turnstile A' },
  { id: 'chk-2', memberName: 'Bilal Ahmed', plan: 'Monthly Standard', time: '08:15 AM', gate: 'Cardio Floor Gate' }
];

export function createGymRouter(sqliteDb, db, getMembers, getCheckins) {
  const router = express.Router();
  const members = () => (getMembers ? getMembers() : GYM_MEMBERS);
  const checkins = () => (getCheckins ? getCheckins() : GYM_CHECKINS);

  router.get('/members', (req, res) => {
    res.json({ ok: true, members: members() });
  });

  router.post('/members', (req, res) => {
    const m = req.body || {};
    const list = members();
    const newMember = {
      id: 'gym-' + Date.now(),
      memberNo: 'GYM-2026-' + (list.length + 101),
      name: m.name || 'Gym Member',
      plan: m.plan || 'Monthly Standard',
      fee: Number(m.fee || 35.0),
      dueDate: m.dueDate || '2026-04-30',
      trainer: m.trainer || 'Coach Staff',
      lastCheckIn: 'Registered Today',
      status: 'ACTIVE'
    };
    list.unshift(newMember);
    res.json({ ok: true, member: newMember });
  });

  router.get('/checkins', (req, res) => {
    res.json({ ok: true, checkins: checkins() });
  });

  router.post('/checkin', (req, res) => {
    const { memberId } = req.body || {};
    const mem = members().find(m => m.id === memberId || m.memberNo === memberId);
    if (mem) {
      mem.lastCheckIn = 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const log = { id: 'chk-' + Date.now(), memberName: mem.name, plan: mem.plan, time: mem.lastCheckIn, gate: 'RFID Turnstile Gate' };
      checkins().unshift(log);
      return res.json({ ok: true, message: `Access Granted for ${mem.name}`, log });
    }
    res.status(404).json({ ok: false, message: 'Member not found' });
  });

  return router;
}
