-- Beauty Salon & Spa Domain Schema
CREATE TABLE IF NOT EXISTS local_salon_appointments (
  id TEXT PRIMARY KEY,
  appt_no TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  service TEXT NOT NULL,
  stylist TEXT NOT NULL,
  chair TEXT,
  time_slot TEXT NOT NULL,
  price REAL NOT NULL,
  status TEXT DEFAULT 'CONFIRMED'
);
