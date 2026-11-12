import express from 'express';

export const HOTEL_ROOMS = [
  { id: 'rm-101', roomNo: '101', type: 'Deluxe King', floor: '1st Floor', ratePerNight: 120.00, status: 'OCCUPIED', currentGuest: 'David Miller', checkIn: '2026-03-25', checkOut: '2026-03-29', features: ['King Bed', 'Balcony', 'Mini Bar'] },
  { id: 'rm-102', roomNo: '102', type: 'Deluxe Twin', floor: '1st Floor', ratePerNight: 110.00, status: 'CLEAN_READY', currentGuest: 'Vacant', checkIn: '-', checkOut: '-', features: ['Twin Beds', 'Garden View'] },
  { id: 'rm-201', roomNo: '201', type: 'Executive Suite', floor: '2nd Floor', ratePerNight: 240.00, status: 'OCCUPIED', currentGuest: 'Sheikh Mansoor', checkIn: '2026-03-26', checkOut: '2026-03-31', features: ['Living Room', 'Jacuzzi', 'City View'] },
  { id: 'rm-202', roomNo: '202', type: 'Executive Suite', floor: '2nd Floor', ratePerNight: 240.00, status: 'DIRTY_HOUSEKEEPING', currentGuest: 'Vacant (Post Checkout)', checkIn: '-', checkOut: '-', features: ['Living Room', 'Jacuzzi'] },
  { id: 'rm-301', roomNo: '301', type: 'Presidential Royal Penthouse', floor: '3rd Floor', ratePerNight: 550.00, status: 'RESERVED', currentGuest: 'Diplomatic Delegation', checkIn: '2026-03-28', checkOut: '2026-04-02', features: ['Private Butler', 'Panoramic Terrace', 'Dining Hall'] }
];

export const HOTEL_RESERVATIONS = [
  { id: 'res-1', folioNo: 'FOL-2026-019', guestName: 'David Miller', roomNo: '101', checkIn: '2026-03-25', checkOut: '2026-03-29', nights: 4, ratePerNight: 120.00, roomCharges: 480.00, extraCharges: 65.00, total: 545.00, status: 'CHECKED_IN', paymentMethod: 'Mastercard' },
  { id: 'res-2', folioNo: 'FOL-2026-020', guestName: 'Sheikh Mansoor', roomNo: '201', checkIn: '2026-03-26', checkOut: '2026-03-31', nights: 5, ratePerNight: 240.00, roomCharges: 1200.00, extraCharges: 180.00, total: 1380.00, status: 'CHECKED_IN', paymentMethod: 'Corporate Ledger' }
];

export const HOTEL_HOUSEKEEPING = [
  { id: 'hk-1', roomNo: '202', task: 'Deep Sanitization & Linen Replacement', attendant: 'Maria Santos', priority: 'HIGH', status: 'IN_PROGRESS' },
  { id: 'hk-2', roomNo: '101', task: 'Evening Turn-down Service', attendant: 'Ali Raza', priority: 'MEDIUM', status: 'SCHEDULED' }
];

export function createHotelRouter(sqliteDb, db, getRooms, getBookings) {
  const router = express.Router();
  const rooms = () => (getRooms ? getRooms() : HOTEL_ROOMS);
  const reservations = () => (getBookings ? getBookings() : HOTEL_RESERVATIONS);

  router.get('/rooms', (req, res) => {
    res.json({ ok: true, rooms: rooms() });
  });

  router.post('/rooms/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const room = rooms().find(r => r.id === id);
    if (room) {
      room.status = status;
      return res.json({ ok: true, message: `Room ${room.roomNo} marked as ${status}`, room });
    }
    res.status(404).json({ ok: false, message: 'Room not found' });
  });

  router.get('/reservations', (req, res) => {
    res.json({ ok: true, reservations: reservations() });
  });

  router.get('/bookings', (req, res) => {
    res.json({ ok: true, bookings: reservations() });
  });

  router.post('/checkin', (req, res) => {
    const r = req.body || {};
    const nights = Number(r.nights || 2);
    const rate = Number(r.ratePerNight || 120);
    const newFolio = {
      id: 'res-' + Date.now(),
      folioNo: 'FOL-2026-' + Math.floor(100 + Math.random() * 900),
      guestName: r.guestName || 'Hotel Guest',
      roomNo: r.roomNo || '102',
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: r.checkOut || '2026-03-30',
      nights,
      ratePerNight: rate,
      roomCharges: nights * rate,
      extraCharges: 0,
      total: nights * rate,
      status: 'CHECKED_IN',
      paymentMethod: r.paymentMethod || 'Credit Card'
    };
    reservations().unshift(newFolio);
    const room = rooms().find(rm => rm.roomNo === r.roomNo);
    if (room) {
      room.status = 'OCCUPIED';
      room.currentGuest = newFolio.guestName;
      room.checkIn = newFolio.checkIn;
      room.checkOut = newFolio.checkOut;
    }
    res.json({ ok: true, message: 'Guest checked in and room card activated', folio: newFolio });
  });

  router.post('/checkout', (req, res) => {
    const { folioNo } = req.body || {};
    const folio = reservations().find(f => f.folioNo === folioNo);
    if (folio) {
      folio.status = 'CHECKED_OUT';
      const room = rooms().find(rm => rm.roomNo === folio.roomNo);
      if (room) {
        room.status = 'DIRTY_HOUSEKEEPING';
        room.currentGuest = 'Vacant';
      }
      return res.json({ ok: true, message: 'Guest checked out & room flagged for housekeeping', folio });
    }
    res.status(404).json({ ok: false, message: 'Reservation folio not found' });
  });

  router.get('/housekeeping', (req, res) => {
    res.json({ ok: true, housekeeping: HOTEL_HOUSEKEEPING });
  });

  return router;
}
