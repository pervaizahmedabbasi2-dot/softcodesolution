-- ===========================================================================
-- SCHOOL & COLLEGE BUSINESS DOMAIN SCHEMA
-- ===========================================================================

-- Students Directory & Admissions
CREATE TABLE IF NOT EXISTS local_school_students (
  id TEXT PRIMARY KEY,
  roll_no TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  guardian_name TEXT,
  phone TEXT,
  fee_status TEXT DEFAULT 'PENDING',
  admission_date TEXT,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fee Collection & Invoices
CREATE TABLE IF NOT EXISTS local_school_fees (
  id TEXT PRIMARY KEY,
  challan_no TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  grade TEXT NOT NULL,
  month TEXT NOT NULL,
  tuition REAL DEFAULT 0,
  lab_fee REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT DEFAULT 'PENDING',
  due_date TEXT,
  paid_date TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Biometric Attendance Ledger
CREATE TABLE IF NOT EXISTS local_school_attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  verification_mode TEXT DEFAULT 'rfid',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Directory
CREATE TABLE IF NOT EXISTS local_school_teachers (
  id TEXT PRIMARY KEY,
  emp_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  salary REAL NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exams & Scorecards
CREATE TABLE IF NOT EXISTS local_school_exams (
  id TEXT PRIMARY KEY,
  exam_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  total_marks REAL NOT NULL,
  passing_marks REAL NOT NULL,
  exam_date TEXT NOT NULL,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_school_results (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  marks_obtained REAL NOT NULL,
  total_marks REAL NOT NULL,
  percentage REAL NOT NULL,
  grade_letter TEXT NOT NULL,
  remarks TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
