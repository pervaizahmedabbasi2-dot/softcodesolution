import express from 'express';

export function createHotelRouter(sqliteDb, db, getRooms, getBookings) {
  const router = express.Router();

  router.get('/rooms', (req, res) => {
    res.json({ ok: true, rooms: getRooms ? getRooms() : [] });
  });

  router.get('/bookings', (req, res) => {
    res.json({ ok: true, bookings: getBookings ? getBookings() : [] });
  });

  return router;
}
