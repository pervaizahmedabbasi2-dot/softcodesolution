package main

import (
	"context"
	"database/sql"
	"log"
)

func ensurePaymentSchema(ctx context.Context, db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS invoices (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id TEXT NOT NULL,
			invoice_number VARCHAR(100) UNIQUE NOT NULL,
			type VARCHAR(50) NOT NULL,
			status VARCHAR(50) NOT NULL,
			currency VARCHAR(10) NOT NULL,
			subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			tax_rate NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			coupon_id UUID,
			total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			amount_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			billing_cycle VARCHAR(50),
			period_start TIMESTAMPTZ,
			period_end TIMESTAMPTZ,
			due_date TIMESTAMPTZ,
			paid_at TIMESTAMPTZ,
			notes TEXT,
			created_by TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS invoice_line_items (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
			description TEXT,
			type VARCHAR(50),
			module_id UUID,
			quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
			unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id TEXT NOT NULL,
			invoice_id UUID REFERENCES invoices(id),
			type VARCHAR(50),
			method VARCHAR(50),
			gateway VARCHAR(50),
			status VARCHAR(50),
			currency VARCHAR(10),
			amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			gateway_txn_id VARCHAR(255),
			proof_url TEXT,
			proof_note TEXT,
			collected_by TEXT,
			approved_by TEXT,
			approved_at TIMESTAMPTZ,
			rejection_reason TEXT,
			ip_address VARCHAR(45),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS payment_methods (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id TEXT NOT NULL,
			type VARCHAR(50),
			provider VARCHAR(50),
			token TEXT,
			last4 VARCHAR(4),
			brand VARCHAR(50),
			bank_name VARCHAR(100),
			account_title VARCHAR(100),
			account_number_masked VARCHAR(50),
			iban VARCHAR(50),
			is_default BOOLEAN DEFAULT false,
			expires_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS wallet (
			tenant_id TEXT PRIMARY KEY,
			balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			currency VARCHAR(10),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS wallet_transactions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id TEXT NOT NULL,
			type VARCHAR(50),
			amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			balance_after NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			reference TEXT,
			created_by TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS refunds (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id TEXT NOT NULL,
			invoice_id UUID REFERENCES invoices(id),
			transaction_id UUID REFERENCES transactions(id),
			type VARCHAR(50),
			amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			reason TEXT,
			status VARCHAR(50),
			refund_to VARCHAR(100),
			processed_by TEXT,
			approved_by TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS coupons (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			code VARCHAR(50) UNIQUE NOT NULL,
			type VARCHAR(50),
			value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			currency VARCHAR(10),
			max_uses INT DEFAULT 0,
			current_uses INT DEFAULT 0,
			applicable_plans TEXT,
			min_amount NUMERIC(12,2),
			valid_from TIMESTAMPTZ,
			valid_until TIMESTAMPTZ,
			status VARCHAR(50),
			created_by TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS coupon_redemptions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			coupon_id UUID NOT NULL REFERENCES coupons(id),
			tenant_id TEXT NOT NULL,
			invoice_id UUID REFERENCES invoices(id),
			discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (coupon_id, tenant_id)
		);`,
		`CREATE TABLE IF NOT EXISTS tax_rules (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			country VARCHAR(100) NOT NULL,
			state VARCHAR(100) NOT NULL,
			tax_name VARCHAR(100) NOT NULL,
			tax_rate NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			status VARCHAR(50) DEFAULT 'active',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (country, state, tax_name)
		);`,
		`CREATE TABLE IF NOT EXISTS usage_meters (
			id TEXT PRIMARY KEY,
			name VARCHAR(100),
			unit VARCHAR(50),
			price_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			billing_mode VARCHAR(50),
			status VARCHAR(50) DEFAULT 'active',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS tenant_usage (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id TEXT NOT NULL,
			meter_id TEXT REFERENCES usage_meters(id),
			period VARCHAR(50),
			quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			peak NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
			finalized BOOLEAN DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (tenant_id, meter_id, period)
		);`,
		`CREATE TABLE IF NOT EXISTS notification_templates (
			id TEXT PRIMARY KEY,
			channel VARCHAR(50),
			subject TEXT,
			body TEXT,
			status VARCHAR(50) DEFAULT 'active',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS notification_log (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id TEXT NOT NULL,
			channel VARCHAR(50),
			template_id TEXT,
			recipient TEXT,
			subject TEXT,
			body TEXT,
			status VARCHAR(50),
			error TEXT,
			invoice_id UUID REFERENCES invoices(id),
			sent_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS dunning_schedule (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id TEXT NOT NULL,
			invoice_id UUID REFERENCES invoices(id),
			attempt_number INT DEFAULT 1,
			scheduled_at TIMESTAMPTZ NOT NULL,
			attempted_at TIMESTAMPTZ,
			status VARCHAR(50),
			result TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
	}

	for _, query := range queries {
		if _, err := db.ExecContext(ctx, query); err != nil {
			log.Printf("failed to execute schema query: %v", err)
			return err
		}
	}

	if err := seedDefaultTaxRules(ctx, db); err != nil {
		return err
	}
	if err := seedDefaultNotificationTemplates(ctx, db); err != nil {
		return err
	}
	if err := seedDefaultUsageMeters(ctx, db); err != nil {
		return err
	}

	return nil
}

func seedDefaultTaxRules(ctx context.Context, db *sql.DB) error {
	rules := []struct {
		Country string
		State   string
		Name    string
		Rate    float64
	}{
		{"Pakistan", "All", "GST", 17.00},
		{"US", "All", "Sales Tax", 0.00},
		{"UK", "All", "VAT", 20.00},
		{"UAE", "All", "VAT", 5.00},
		{"India", "All", "GST", 18.00},
		{"Canada", "All", "GST", 5.00},
		{"Germany", "All", "VAT", 19.00},
		{"Saudi Arabia", "All", "VAT", 15.00},
	}

	query := `INSERT INTO tax_rules (country, state, tax_name, tax_rate) VALUES ($1, $2, $3, $4) ON CONFLICT (country, state, tax_name) DO NOTHING;`
	for _, r := range rules {
		if _, err := db.ExecContext(ctx, query, r.Country, r.State, r.Name, r.Rate); err != nil {
			log.Printf("failed to seed tax rule: %v", err)
			return err
		}
	}
	return nil
}

func seedDefaultNotificationTemplates(ctx context.Context, db *sql.DB) error {
	templates := []string{
		"invoice_generated",
		"payment_received",
		"payment_approved",
		"deadline_reminder_3day",
		"deadline_today",
		"payment_overdue",
		"payment_failed",
		"account_suspended",
		"refund_processed",
	}

	channels := []string{"email", "sms", "whatsapp"}

	query := `INSERT INTO notification_templates (id, channel, subject, body) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING;`

	for _, tmpl := range templates {
		for _, ch := range channels {
			id := tmpl + "_" + ch
			subject := "Update regarding your account"
			body := "Hello {{tenant_name}}, this is regarding invoice {{invoice_number}} for {{amount}} {{currency}} with due date {{due_date}}."
			
			if _, err := db.ExecContext(ctx, query, id, ch, subject, body); err != nil {
				log.Printf("failed to seed notification template: %v", err)
				return err
			}
		}
	}
	return nil
}

func seedDefaultUsageMeters(ctx context.Context, db *sql.DB) error {
	meters := []struct {
		ID    string
		Name  string
		Unit  string
		Price float64
		Mode  string
	}{
		{"employee_seats", "Employee Seats", "seat", 10.00, "recurring"},
		{"api_calls", "API Calls", "call", 0.01, "metered"},
		{"storage_gb", "Storage (GB)", "gb", 0.50, "metered"},
		{"email_sends", "Emails Sent", "email", 0.001, "metered"},
		{"sms_sends", "SMS Sent", "sms", 0.02, "metered"},
	}

	query := `INSERT INTO usage_meters (id, name, unit, price_per_unit, billing_mode) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING;`
	for _, m := range meters {
		if _, err := db.ExecContext(ctx, query, m.ID, m.Name, m.Unit, m.Price, m.Mode); err != nil {
			log.Printf("failed to seed usage meter: %v", err)
			return err
		}
	}
	return nil
}
