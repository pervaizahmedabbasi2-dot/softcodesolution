package main

import (
	"context"
	"database/sql"
	"net/http"
	"time"
)

// SCS_OFFICIAL_BUSINESS_TYPES_API_V1
func ensureBusinessTypesSchemaAndSeed(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS business_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  module_category TEXT NOT NULL,
  pricing_weight NUMERIC(6,2) NOT NULL DEFAULT 1.00 CHECK (pricing_weight > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_type_aliases (
  alias TEXT PRIMARY KEY,
  business_type_id TEXT NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO business_types
  (id, name, module_category, pricing_weight, status, sort_order)
VALUES
  ('accounting_tax',        'Accounting & Tax Services',        'accounting_tax',        1.00, 'active', 10),
  ('agriculture',           'Agriculture & Farming',            'agriculture',           1.00, 'active', 20),
  ('auto_workshop',         'Auto Workshop & Garage',           'auto_workshop',         1.00, 'active', 30),
  ('clinic',                'Clinic / Healthcare Center',       'clinic',                1.10, 'active', 40),
  ('hospital',              'Hospital Management',              'clinic',                1.30, 'active', 50),
  ('dental',                'Dental Clinic',                    'dental',                1.05, 'active', 60),
  ('pharmacy',              'Pharmacy & Medical Store',         'pharmacy',              1.05, 'active', 70),
  ('school_college',        'School / College Management',      'school',                1.15, 'active', 80),
  ('coaching_center',       'Coaching & Training Center',       'school',                0.95, 'active', 90),
  ('ecommerce',             'eCommerce / Online Store',         'ecommerce',             1.05, 'active', 100),
  ('retail_shop',           'Retail Shop / General Store',      'store',                 1.00, 'active', 110),
  ('super_mart',            'Super Mart & Grocery',             'store',                 1.10, 'active', 120),
  ('wholesale_distribution','Wholesale & Distribution',        'store',                 1.10, 'active', 130),
  ('restaurant_cafe',       'Restaurant & Cafe',                'restaurant',            1.10, 'active', 140),
  ('hotel_hospitality',     'Hotel & Hospitality',              'hotel',                 1.15, 'active', 150),
  ('travel_tourism',        'Travel & Tourism',                 'travel',                1.15, 'active', 160),
  ('salon_spa',             'Beauty Salon & Spa',               'salon',                 1.00, 'active', 170),
  ('gym_fitness',           'Gym & Fitness Center',             'gym',                   0.95, 'active', 180),
  ('real_estate',           'Property & Real Estate',           'real_estate',           1.10, 'active', 190),
  ('construction',          'Construction Business',            'construction',          1.10, 'active', 200),
  ('manufacturing',         'Manufacturing & Factory',          'manufacturing',         1.20, 'active', 210),
  ('logistics_transport',   'Logistics & Transport',            'logistics',             1.10, 'active', 220),
  ('event_management',      'Event Management',                 'event_management',      1.00, 'active', 230),
  ('hr_payroll',            'HR & Payroll Services',            'hr_recruitment',        1.00, 'active', 240),
  ('recruitment_agency',    'Recruitment Agency',               'hr_recruitment',        1.00, 'active', 250),
  ('law_firm',              'Legal Firm / Law Office',          'law_firm',              1.00, 'active', 260),
  ('ngo_nonprofit',         'NGO / Nonprofit Organization',     'ngo',                   0.95, 'active', 270),
  ('professional_services', 'Professional Services',            'professional_services', 1.00, 'active', 280),
  ('software_it',           'Software & IT Services',           'professional_services', 1.10, 'active', 290),
  ('home_services',         'Home & Maintenance Services',      'services',              0.95, 'active', 300),
  ('security_services',     'Security Services',                'security',              1.00, 'active', 310),
  ('cleaning_services',     'Cleaning Services',                'services',              0.95, 'active', 320),
  ('media_marketing',       'Media & Marketing Agency',         'communication',         1.00, 'active', 330),
  ('telecom_communication', 'Telecom & Communication',          'communication',         1.05, 'active', 340),
  ('other_business',        'Other Business Type',              'business',              1.00, 'active', 350)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  module_category = EXCLUDED.module_category,
  pricing_weight = EXCLUDED.pricing_weight,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

UPDATE business_types
SET status='inactive', updated_at=now()
WHERE id NOT IN (
  'accounting_tax','agriculture','auto_workshop','clinic','hospital',
  'dental','pharmacy','school_college','coaching_center','ecommerce',
  'retail_shop','super_mart','wholesale_distribution','restaurant_cafe',
  'hotel_hospitality','travel_tourism','salon_spa','gym_fitness',
  'real_estate','construction','manufacturing','logistics_transport',
  'event_management','hr_payroll','recruitment_agency','law_firm',
  'ngo_nonprofit','professional_services','software_it','home_services',
  'security_services','cleaning_services','media_marketing',
  'telecom_communication','other_business'
);

INSERT INTO business_type_aliases (alias, business_type_id)
VALUES
  ('accounting',       'accounting_tax'),
  ('fleet',            'logistics_transport'),
  ('general_store',    'retail_shop'),
  ('gym',              'gym_fitness'),
  ('hotel',            'hotel_hospitality'),
  ('hotel_rental',     'hotel_hospitality'),
  ('hr_recruitment',   'recruitment_agency'),
  ('legal_firm',       'law_firm'),
  ('other',            'other_business'),
  ('property_mgmt',    'real_estate'),
  ('restaurant',       'restaurant_cafe'),
  ('retail',           'retail_shop'),
  ('salon',            'salon_spa'),
  ('school',           'school_college'),
  ('software',         'software_it'),
  ('store',            'retail_shop'),
  ('travel',           'travel_tourism'),
  ('wholesale',        'wholesale_distribution')
ON CONFLICT (alias) DO UPDATE SET
  business_type_id = EXCLUDED.business_type_id;`)
	return err
}

func handlePublicBusinessTypes(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, err := openRegisterDB(ctx)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "db_failed", "Database connection failed")
		return
	}
	defer db.Close()

	if err := ensureBusinessTypesSchemaAndSeed(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "business_types_schema_failed", err.Error())
		return
	}

	rows, err := db.QueryContext(ctx, `
SELECT
  id,
  name,
  module_category,
  pricing_weight::float8,
  sort_order
FROM business_types
WHERE status='active'
ORDER BY sort_order, name
`)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "business_types_failed", "Could not load business types")
		return
	}
	defer rows.Close()

	items := make([]map[string]interface{}, 0, 35)
	for rows.Next() {
		var id, name, moduleCategory string
		var pricingWeight float64
		var sortOrder int

		if err := rows.Scan(&id, &name, &moduleCategory, &pricingWeight, &sortOrder); err != nil {
			writeAPIError(w, http.StatusInternalServerError, "business_types_scan_failed", "Could not read business types")
			return
		}

		items = append(items, map[string]interface{}{
			"id":              id,
			"name":            name,
			"module_category": moduleCategory,
			"pricing_weight":  pricingWeight,
			"sort_order":      sortOrder,
		})
	}

	if err := rows.Err(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "business_types_rows_failed", "Could not complete business types list")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":             true,
		"count":          len(items),
		"business_types": items,
		"request_id":     requestID,
	})
}
