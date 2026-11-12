-- Hotel & Hospitality Domain Schema
CREATE TABLE IF NOT EXISTS local_hotel_rooms (
  id TEXT PRIMARY KEY,
  room_no TEXT UNIQUE NOT NULL,
  room_type TEXT NOT NULL,
  rate_per_night REAL NOT NULL,
  status TEXT DEFAULT 'VACANT',
  floor INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS local_hotel_bookings (
  id TEXT PRIMARY KEY,
  booking_ref TEXT UNIQUE NOT NULL,
  guest_name TEXT NOT NULL,
  room_no TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  total_bill REAL NOT NULL,
  status TEXT DEFAULT 'CONFIRMED'
);
