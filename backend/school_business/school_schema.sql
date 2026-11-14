-- ===========================================================================
-- SCHOOL & COLLEGE BUSINESS DOMAIN SCHEMA (MULTI-TENANT + ENCRYPTED PII)
-- ===========================================================================

-- Students Directory
CREATE TABLE IF NOT EXISTS local_school_students (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  roll_no TEXT NOT NULL,
  full_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  gender TEXT DEFAULT 'Male',
  dob TEXT,
  student_bform TEXT,
  blood_group TEXT DEFAULT 'B+',
  guardian_name TEXT,
  guardian_relation TEXT DEFAULT 'Father',
  guardian_cnic TEXT,
  guardian_occupation TEXT,
  guardian_email TEXT,
  phone TEXT,
  emergency_contact TEXT,
  address TEXT,
  previous_school TEXT,
  medical_conditions TEXT,
  fee_amount REAL DEFAULT 18000,
  due_bakaya REAL DEFAULT 0,
  fee_status TEXT DEFAULT 'PENDING',
  attendance_rate TEXT DEFAULT '96%',
  admission_date TEXT,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fee Collection & Invoices
CREATE TABLE IF NOT EXISTS local_school_fees (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  challan_no TEXT NOT NULL,
  student_id TEXT,
  student_name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  grade TEXT NOT NULL,
  month TEXT NOT NULL,
  tuition REAL DEFAULT 0,
  lab_fee REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT DEFAULT 'PENDING',
  payment_mode TEXT,
  resource_reference TEXT,
  collected_by TEXT,
  collector_role TEXT DEFAULT 'owner',
  due_date TEXT,
  paid_date TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Biometric & RFID Attendance Ledger
CREATE TABLE IF NOT EXISTS local_school_attendance (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  student_id TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  gate_name TEXT DEFAULT 'Main Turnstile 01',
  verification_mode TEXT DEFAULT 'rfid',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Directory & Payroll
CREATE TABLE IF NOT EXISTS local_school_teachers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  emp_code TEXT NOT NULL,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  subject TEXT,
  qualification TEXT,
  classes TEXT,
  incharge_class TEXT,
  gender TEXT DEFAULT 'Male',
  cnic TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  salary TEXT NOT NULL,
  basic_salary REAL DEFAULT 0,
  salary_status TEXT DEFAULT 'Pending',
  last_salary_month TEXT,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exams & Scorecards
CREATE TABLE IF NOT EXISTS local_school_exams (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  exam_code TEXT NOT NULL,
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
  tenant_id TEXT DEFAULT 'tenant-root-platform',
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

-- Admission Applications Registry
CREATE TABLE IF NOT EXISTS local_school_admissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  applicant TEXT NOT NULL,
  applied_for TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  roll_no TEXT,
  father_name TEXT NOT NULL,
  relation TEXT DEFAULT 'Father',
  father_cnic TEXT,
  student_bform TEXT,
  dob TEXT,
  gender TEXT DEFAULT 'Male',
  blood_group TEXT DEFAULT 'B+',
  phone TEXT NOT NULL,
  email TEXT,
  father_occupation TEXT,
  address TEXT,
  previous_school TEXT,
  emergency_contact TEXT,
  medical_notes TEXT,
  admission_fee REAL DEFAULT 25000,
  tuition_fee REAL DEFAULT 18000,
  discount REAL DEFAULT 0,
  initial_payment_status TEXT DEFAULT 'Paid',
  score TEXT,
  status TEXT DEFAULT 'Pending',
  source TEXT DEFAULT 'School Office Direct',
  decision_remarks TEXT,
  date TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily Homework & Digital Diary
CREATE TABLE IF NOT EXISTS local_school_homework (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  assigned_date TEXT,
  due_date TEXT,
  description TEXT NOT NULL,
  teacher_name TEXT,
  submissions_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 30,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parent Student Leave Applications
CREATE TABLE IF NOT EXISTS local_school_leaves (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  child_id TEXT NOT NULL,
  child_name TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending Review',
  submitted_date TEXT,
  leave_type TEXT DEFAULT 'Student Leave',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fee Concession & Scholarship Approvals
CREATE TABLE IF NOT EXISTS local_school_concessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  student_id TEXT,
  student_name TEXT NOT NULL,
  roll_no TEXT,
  grade TEXT NOT NULL,
  guardian_name TEXT,
  guardian_occupation TEXT,
  guardian_income TEXT,
  regular_fee REAL DEFAULT 0,
  revised_fee REAL DEFAULT 0,
  requested_discount TEXT,
  category TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending Review',
  approved_by TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parent Grievances & Complaints
CREATE TABLE IF NOT EXISTS local_school_complaints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  parent_name TEXT NOT NULL,
  student_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  priority TEXT DEFAULT 'Routine',
  assigned_incharge TEXT,
  investigation_notes TEXT,
  status TEXT DEFAULT 'In Progress',
  date TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Lesson Plans
CREATE TABLE IF NOT EXISTS local_school_lesson_plans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  teacher_id TEXT,
  teacher_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  topic TEXT NOT NULL,
  objective TEXT,
  date TEXT,
  status TEXT DEFAULT 'Planned',
  moderator_notes TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Substitute Period Arrangements
CREATE TABLE IF NOT EXISTS local_school_substitutions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  absent_teacher TEXT NOT NULL,
  substitute_teacher TEXT NOT NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  period TEXT NOT NULL,
  date TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Confirmed Cover',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Institutional Audit Trail
CREATE TABLE IF NOT EXISTS local_school_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  timestamp TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  operator_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  category TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_description TEXT,
  details TEXT,
  severity TEXT DEFAULT 'Normal Audit',
  verified_by TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fee Reconciliation Ledger
CREATE TABLE IF NOT EXISTS local_school_reconciliation (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  date TEXT NOT NULL,
  counter_cash REAL DEFAULT 0,
  bank_meezan REAL DEFAULT 0,
  bank_hbl REAL DEFAULT 0,
  online_digital REAL DEFAULT 0,
  total_billed REAL DEFAULT 0,
  actual_collected REAL DEFAULT 0,
  variance_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'Balanced & Cleared',
  cashier_name TEXT,
  verified_by_auditor TEXT,
  submitted_by_role TEXT DEFAULT 'accountant',
  principal_collected REAL DEFAULT 0,
  accountant_collected REAL DEFAULT 0,
  online_collected REAL DEFAULT 0,
  opening_vault_cash REAL DEFAULT 0,
  petty_expenses REAL DEFAULT 0,
  closing_vault_cash REAL DEFAULT 0,
  bank_deposit_slip_no TEXT,
  owner_approval_status TEXT DEFAULT 'Pending Owner Review',
  owner_remarks TEXT,
  approved_by TEXT,
  approved_at TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Per-Tenant School Workspace Snapshot
CREATE TABLE IF NOT EXISTS local_school_workspaces (
  tenant_id TEXT PRIMARY KEY,
  school_name TEXT,
  payload_json TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
