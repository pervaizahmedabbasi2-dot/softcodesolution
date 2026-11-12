-- Law Firm & Legal Office Domain Schema
CREATE TABLE IF NOT EXISTS local_legal_cases (
  id TEXT PRIMARY KEY,
  case_no TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  court TEXT NOT NULL,
  judge TEXT,
  advocate TEXT NOT NULL,
  hearing_date TEXT NOT NULL,
  retainer_fee REAL NOT NULL,
  status TEXT DEFAULT 'ACTIVE'
);
