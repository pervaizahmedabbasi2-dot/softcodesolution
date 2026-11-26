-- ===========================================================================
-- SCHOOL & COLLEGE BUSINESS DOMAIN SCHEMA (MULTI-TENANT + ENCRYPTED PII)
-- ===========================================================================

-- Multi-Campus Branches & Academic Wings
CREATE TABLE IF NOT EXISTS local_school_branches (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  phone TEXT,
  principal_name TEXT,
  accountant_name TEXT,
  established_year TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_school_wings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  wing_type TEXT DEFAULT 'General',
  grade_range TEXT,
  head_name TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students Directory
CREATE TABLE IF NOT EXISTS local_school_students (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  roll_no TEXT NOT NULL,
  full_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  gender TEXT DEFAULT 'Male',
  dob TEXT,
  student_bform TEXT,
  passport_no TEXT,
  nationality TEXT DEFAULT 'Pakistani',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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

-- Biometric & Camera Face Verification Attendance Ledger
CREATE TABLE IF NOT EXISTS local_school_attendance (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  student_id TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  member_category TEXT DEFAULT 'student',
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  check_in_time TEXT,
  scheduled_start_time TEXT DEFAULT '08:00',
  late_minutes INTEGER DEFAULT 0,
  late_by_label TEXT,
  punch_type TEXT DEFAULT 'IN',
  gate_name TEXT DEFAULT 'Main Turnstile 01',
  verification_mode TEXT DEFAULT 'face_camera',
  confidence_score REAL DEFAULT 0,
  verified_by TEXT DEFAULT 'Camera Face Verification',
  marked_by_role TEXT DEFAULT 'owner',
  remarks TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Non-Teaching Campus Staff Directory
CREATE TABLE IF NOT EXISTS local_school_staff (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  emp_code TEXT NOT NULL,
  name TEXT NOT NULL,
  father_name TEXT,
  cnic TEXT,
  passport_no TEXT,
  nationality TEXT DEFAULT 'Pakistani',
  gender TEXT DEFAULT 'Male',
  dob TEXT,
  blood_group TEXT DEFAULT 'B+',
  role_title TEXT NOT NULL,
  department TEXT DEFAULT 'Administration',
  phone TEXT,
  emergency_contact TEXT,
  address TEXT,
  shift TEXT DEFAULT 'Morning (07:30 AM - 03:00 PM)',
  status TEXT DEFAULT 'ACTIVE',
  attendance_status TEXT DEFAULT 'Absent',
  face_enrolled INTEGER DEFAULT 0,
  lite_enabled INTEGER DEFAULT 1,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Principal & Campus Executive Leadership Directory
CREATE TABLE IF NOT EXISTS local_school_principals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  emp_code TEXT NOT NULL,
  name TEXT NOT NULL,
  father_name TEXT,
  cnic TEXT,
  passport_no TEXT,
  nationality TEXT DEFAULT 'Pakistani',
  gender TEXT DEFAULT 'Male',
  dob TEXT,
  blood_group TEXT DEFAULT 'O+',
  role_title TEXT NOT NULL,
  department TEXT DEFAULT 'Executive Directorate',
  phone TEXT,
  emergency_contact TEXT,
  email TEXT,
  address TEXT,
  shift TEXT DEFAULT 'Full Day (07:30 AM - 04:00 PM)',
  status TEXT DEFAULT 'ACTIVE',
  attendance_status TEXT DEFAULT 'Absent',
  face_enrolled INTEGER DEFAULT 0,
  fingerprint_enrolled INTEGER DEFAULT 0,
  lite_enabled INTEGER DEFAULT 1,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Camera Face Biometric Profiles (Students, Teachers, Staff, Principal)
CREATE TABLE IF NOT EXISTS local_school_face_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  member_id TEXT NOT NULL,
  member_category TEXT NOT NULL,
  member_name TEXT NOT NULL,
  member_code TEXT,
  grade_or_dept TEXT,
  face_descriptor_json TEXT NOT NULL,
  face_photo_data TEXT,
  face_hash TEXT NOT NULL,
  quality_score REAL DEFAULT 92,
  lite_enabled INTEGER DEFAULT 1,
  enrolled_by TEXT DEFAULT 'owner',
  enrolled_at TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Biometric Fingerprint Profiles (Students, Teachers, Staff, Principal)
CREATE TABLE IF NOT EXISTS local_school_fingerprint_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  member_id TEXT NOT NULL,
  member_category TEXT NOT NULL,
  member_name TEXT NOT NULL,
  member_code TEXT,
  grade_or_dept TEXT,
  finger_label TEXT DEFAULT 'Right Index',
  scanner_type TEXT DEFAULT 'device_webauthn',
  credential_id TEXT,
  public_key_spki TEXT,
  fingerprint_descriptor_json TEXT NOT NULL DEFAULT '[]',
  fingerprint_preview_data TEXT,
  fingerprint_hash TEXT NOT NULL,
  quality_score REAL DEFAULT 95,
  lite_enabled INTEGER DEFAULT 1,
  enrolled_by TEXT DEFAULT 'owner',
  enrolled_at TEXT NOT NULL,
  is_synced INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- School Owner Attendance Setup, Lite Controls & Access Matrix
CREATE TABLE IF NOT EXISTS local_school_attendance_policy (
  tenant_id TEXT PRIMARY KEY,
  policy_json TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Directory & Payroll
CREATE TABLE IF NOT EXISTS local_school_teachers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  emp_code TEXT NOT NULL,
  name TEXT NOT NULL,
  father_name TEXT,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  subject TEXT,
  qualification TEXT,
  classes TEXT,
  incharge_class TEXT,
  gender TEXT DEFAULT 'Male',
  dob TEXT,
  blood_group TEXT DEFAULT 'B+',
  cnic TEXT,
  passport_no TEXT,
  nationality TEXT DEFAULT 'Pakistani',
  phone TEXT NOT NULL,
  emergency_contact TEXT,
  email TEXT,
  address TEXT,
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT DEFAULT 'All Sections',
  chapter_topic TEXT,
  assigned_date TEXT,
  due_date TEXT,
  due_time TEXT DEFAULT '11:59 PM',
  submission_mode TEXT DEFAULT 'Online Upload + Written',
  priority TEXT DEFAULT 'Normal',
  estimated_minutes INTEGER DEFAULT 30,
  external_link TEXT,
  description TEXT NOT NULL,
  teacher_name TEXT,
  teacher_id TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_data TEXT,
  resource_kind TEXT DEFAULT 'Homework',
  max_marks REAL DEFAULT 10,
  status TEXT DEFAULT 'Active',
  submissions_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 30,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Student Two-Way Homework Submissions & Teacher Checking
CREATE TABLE IF NOT EXISTS local_school_homework_submissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  homework_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  roll_no TEXT,
  student_name TEXT NOT NULL,
  grade TEXT,
  answer_text TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_data TEXT,
  external_link TEXT,
  status TEXT DEFAULT 'Submitted',
  marks_obtained REAL,
  max_marks REAL DEFAULT 10,
  teacher_remarks TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  submitted_at TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teacher Uploaded Study Notes, Worksheets & Class Resources
CREATE TABLE IF NOT EXISTS local_school_study_materials (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  material_type TEXT DEFAULT 'Class Notes',
  description TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_data TEXT,
  external_url TEXT,
  file_size TEXT,
  uploaded_by TEXT,
  teacher_id TEXT,
  downloads_count INTEGER DEFAULT 0,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Direct Teacher-Parent Two-Way Communication Thread
CREATE TABLE IF NOT EXISTS local_school_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  sender TEXT NOT NULL,
  sender_role TEXT DEFAULT 'parent',
  recipient TEXT NOT NULL,
  child_id TEXT,
  student_name TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  date TEXT,
  reply TEXT,
  reply_by TEXT,
  reply_date TEXT,
  status TEXT DEFAULT 'Open',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parent Student Leave Applications
CREATE TABLE IF NOT EXISTS local_school_leaves (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
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

-- Accountant Counter Itemized Petty Cash Vouchers
CREATE TABLE IF NOT EXISTS local_school_petty_vouchers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  voucher_no TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  paid_to TEXT,
  recorded_by TEXT,
  collector_role TEXT DEFAULT 'accountant',
  closing_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Owner-Configured Dynamic Table Schemas & Form Fields (Mirrored across portals)
CREATE TABLE IF NOT EXISTS local_school_table_schemas (
  tenant_id TEXT NOT NULL,
  table_id TEXT NOT NULL,
  custom_title TEXT,
  hidden_columns_json TEXT DEFAULT '[]',
  hidden_column_labels_json TEXT DEFAULT '[]',
  hidden_form_fields_json TEXT DEFAULT '[]',
  renamed_headers_json TEXT DEFAULT '{}',
  renamed_headers_by_label_json TEXT DEFAULT '{}',
  custom_columns_json TEXT DEFAULT '[]',
  updated_by TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, table_id)
);

-- Dynamic Custom Table Rows & Form Submission Entries
CREATE TABLE IF NOT EXISTS local_school_table_rows (
  tenant_id TEXT NOT NULL,
  table_id TEXT NOT NULL,
  row_key TEXT NOT NULL,
  row_label TEXT,
  values_json TEXT NOT NULL DEFAULT '{}',
  submitted_by_name TEXT,
  submitted_by_role TEXT DEFAULT 'owner',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, table_id, row_key)
);

-- Dynamic Custom Cell Values (Including Portal Form Custom Inputs)
CREATE TABLE IF NOT EXISTS local_school_table_cells (
  tenant_id TEXT NOT NULL,
  table_id TEXT NOT NULL,
  row_key TEXT NOT NULL,
  col_id TEXT NOT NULL,
  cell_value TEXT DEFAULT '',
  submitted_by_name TEXT,
  submitted_by_role TEXT DEFAULT 'owner',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, table_id, row_key, col_id)
);

-- School Payment Gateways Registry (Owner-Controlled Pakistan Native & Custom Channels)
CREATE TABLE IF NOT EXISTS local_school_payment_gateways (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'ALL',
  wing_id TEXT DEFAULT 'ALL',
  provider_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT DEFAULT 'mobile_wallet',
  account_title TEXT,
  account_number TEXT,
  iban TEXT,
  raast_id TEXT,
  bank_name TEXT,
  branch_code TEXT,
  till_id TEXT,
  biller_code TEXT,
  merchant_id TEXT,
  merchant_secret_enc TEXT,
  integrity_salt_enc TEXT,
  webhook_url TEXT,
  fee_type TEXT DEFAULT 'none',
  fee_value REAL DEFAULT 0,
  verification_mode TEXT DEFAULT 'slip_review',
  instructions TEXT,
  allowed_portals_json TEXT DEFAULT '["owner","principal","accountant","student","parent"]',
  custom_fields_json TEXT DEFAULT '[]',
  is_enabled INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 10,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- School Payment Gateway Global Settings (Strictly Owner-Controlled)
CREATE TABLE IF NOT EXISTS local_school_gateway_settings (
  tenant_id TEXT PRIMARY KEY,
  settings_json TEXT NOT NULL,
  is_synced INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- School Payment Gateway Transactions & Verification Ledger
CREATE TABLE IF NOT EXISTS local_school_payment_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'tenant-root-platform',
  branch_id TEXT DEFAULT 'BR-LHR-01',
  wing_id TEXT DEFAULT 'WNG-LHR-SR',
  txn_ref TEXT NOT NULL,
  challan_no TEXT,
  gateway_id TEXT NOT NULL,
  gateway_name TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  student_id TEXT,
  student_name TEXT NOT NULL,
  roll_no TEXT,
  grade TEXT,
  guardian_name TEXT,
  payer_phone TEXT,
  payer_account_title TEXT,
  month TEXT,
  base_amount REAL NOT NULL,
  gateway_fee REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  currency TEXT DEFAULT 'PKR',
  status TEXT DEFAULT 'PENDING_VERIFICATION',
  verification_mode TEXT DEFAULT 'slip_review',
  proof_reference TEXT,
  proof_notes TEXT,
  proof_screenshot TEXT DEFAULT '',
  submitted_by_name TEXT,
  submitted_by_role TEXT DEFAULT 'parent',
  verified_by TEXT,
  verified_at TEXT,
  rejection_reason TEXT,
  linked_fee_id TEXT,
  custom_fields_json TEXT DEFAULT '{}',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Multi-Branch & Wing Query Indexes
CREATE INDEX IF NOT EXISTS idx_school_wings_tenant_branch ON local_school_wings (tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_school_students_branch_wing ON local_school_students (tenant_id, branch_id, wing_id);
CREATE INDEX IF NOT EXISTS idx_school_fees_branch_wing ON local_school_fees (tenant_id, branch_id, wing_id);
CREATE INDEX IF NOT EXISTS idx_school_attendance_branch_wing ON local_school_attendance (tenant_id, branch_id, wing_id);
CREATE INDEX IF NOT EXISTS idx_school_teachers_branch_wing ON local_school_teachers (tenant_id, branch_id, wing_id);
CREATE INDEX IF NOT EXISTS idx_school_admissions_branch_wing ON local_school_admissions (tenant_id, branch_id, wing_id);
CREATE INDEX IF NOT EXISTS idx_school_reconciliation_branch ON local_school_reconciliation (tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_school_petty_branch ON local_school_petty_vouchers (tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_school_pg_gateways_tenant ON local_school_payment_gateways (tenant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_school_pg_txns_tenant_status ON local_school_payment_transactions (tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_school_pg_txns_student ON local_school_payment_transactions (tenant_id, student_id);

