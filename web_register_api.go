package main

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/argon2"
)

func registerHTTPRoutes(mux *http.ServeMux) {
	registerAuthHTTPRoutes(mux)
	registerSuperadminHTTPRoutes(mux)
	registerModuleHTTPRoutes(mux)
	mux.HandleFunc("/api/register", handleRegister)
	mux.HandleFunc("/api/auth/register", handleRegister)
	mux.HandleFunc("/api/client/register", handleRegister)
}

type registerPayload struct {
	IdempotencyKey string `json:"idempotency_key"`
	TenantID       string `json:"tenant_id"`

	FullName      string `json:"full_name"`
	Email         string `json:"email"`
	CountryCode   string `json:"country_code"`
	Phone         string `json:"phone"`
	CompanyName   string `json:"company_name"`
	BusinessRegNo string `json:"business_reg_no"`
	BusinessType  string `json:"business_type"`
	BusinessSize  string `json:"business_size"`
	Country       string `json:"country"`
	City          string `json:"city"`
	State         string `json:"state"`
	PostalCode    string `json:"postal_code"`
	Address       string `json:"address"`
	CustomDomain  string `json:"custom_domain"`
	HearAboutUs   string `json:"hear_about_us"`

	Password string `json:"password"`

	EnablePasskey bool `json:"enable_passkey"`
	TermsAccepted bool `json:"terms_accepted"`

	// Angular camelCase support
	IdempotencyKeyCamel string `json:"idempotencyKey"`
	TenantIDCamel       string `json:"tenantId"`
	FullNameCamel       string `json:"fullName"`
	CountryCodeCamel    string `json:"countryCode"`
	CompanyNameCamel    string `json:"companyName"`
	BusinessRegNoCamel  string `json:"businessRegNo"`
	BusinessTypeCamel   string `json:"businessType"`
	BusinessSizeCamel   string `json:"businessSize"`
	PostalCodeCamel     string `json:"postalCode"`
	CustomDomainCamel   string `json:"customDomain"`
	HearAboutUsCamel    string `json:"hearAboutUs"`
	EnablePasskeyCamel  *bool  `json:"enablePasskey"`
	TermsAcceptedCamel  *bool  `json:"termsAccepted"`
}

type localRegistration struct {
	ID             string
	IdempotencyKey string
	TenantID       string
	Payload        registerPayload
	PasswordHash   string
	CreatedAt      time.Time
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST is allowed")
		return
	}

	var payload registerPayload

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&payload); err != nil {
		audit("register_bad_json", err.Error())
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON body")
		return
	}

	payload.normalize(requestID)

	if err := payload.validate(); err != nil {
		audit("register_validation_failed", err.Error())
		writeAPIError(w, http.StatusBadRequest, "validation_failed", err.Error())
		return
	}

	passwordHash, err := makePasswordHash(payload.Password)
	if err != nil {
		audit("register_password_hash_failed", err.Error())
		writeAPIError(w, http.StatusBadRequest, "password_invalid", err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 18*time.Second)
	defer cancel()

	// OFFLINE-FIRST RULE:
	// SQLite save always happens first. PostgreSQL is then synced immediately if available.
	localID, localCreatedAt, err := saveRegistrationToSQLiteFirst(ctx, payload, passwordHash)
	if err != nil {
		audit("sqlite_local_register_failed", err.Error())
		writeAPIError(w, http.StatusInternalServerError, "local_save_failed", "Could not save registration locally")
		return
	}

	cloudID := localID
	cloudStatus := "pending_verification"
	cloudCreatedAt := localCreatedAt
	cloudSynced := false

	syncResult, err := syncRegistrationToPostgres(ctx, localRegistration{
		ID:             localID,
		IdempotencyKey: payload.IdempotencyKey,
		TenantID:       payload.TenantID,
		Payload:        payload,
		PasswordHash:   passwordHash,
		CreatedAt:      localCreatedAt,
	})

	if err == nil {
		cloudSynced = true
		cloudID = syncResult.ID
		cloudStatus = syncResult.Status
		cloudCreatedAt = syncResult.CreatedAt

		_ = markSQLiteRegistrationSynced(context.Background(), localID)
		audit("register_success", payload.Email+" id="+cloudID)
	} else {
		_ = markSQLiteRegistrationPending(context.Background(), localID, err.Error())
		audit("register_local_saved_cloud_pending", payload.Email+" local_id="+localID+" error="+err.Error())
	}

	statusCode := http.StatusCreated
	message := "Registration submitted successfully"
	syncStatus := "synced"

	if !cloudSynced {
		statusCode = http.StatusAccepted
		message = "Registration saved locally. Cloud sync is pending."
		syncStatus = "pending"
	}

	writeAPIJSON(w, statusCode, map[string]interface{}{
		"ok":              true,
		"message":         message,
		"id":              cloudID,
		"local_id":        localID,
		"status":          cloudStatus,
		"created_at":      cloudCreatedAt,
		"idempotency_key": payload.IdempotencyKey,
		"request_id":      requestID,
		"local_saved":     true,
		"cloud_synced":    cloudSynced,
		"sync_status":     syncStatus,
	})
}

func (p *registerPayload) normalize(requestID string) {
	if p.IdempotencyKey == "" {
		p.IdempotencyKey = p.IdempotencyKeyCamel
	}

	if p.IdempotencyKey == "" {
		p.IdempotencyKey = requestID
	}

	if p.TenantID == "" {
		p.TenantID = p.TenantIDCamel
	}

	if p.FullName == "" {
		p.FullName = p.FullNameCamel
	}

	if p.CountryCode == "" {
		p.CountryCode = p.CountryCodeCamel
	}

	if p.CountryCode == "" {
		p.CountryCode = "+92"
	}

	if p.CompanyName == "" {
		p.CompanyName = p.CompanyNameCamel
	}

	if p.BusinessRegNo == "" {
		p.BusinessRegNo = p.BusinessRegNoCamel
	}

	if p.BusinessType == "" {
		p.BusinessType = p.BusinessTypeCamel
	}

	if p.BusinessSize == "" {
		p.BusinessSize = p.BusinessSizeCamel
	}

	if p.PostalCode == "" {
		p.PostalCode = p.PostalCodeCamel
	}

	if p.CustomDomain == "" {
		p.CustomDomain = p.CustomDomainCamel
	}

	if p.HearAboutUs == "" {
		p.HearAboutUs = p.HearAboutUsCamel
	}

	if p.EnablePasskeyCamel != nil {
		p.EnablePasskey = *p.EnablePasskeyCamel
	}

	if p.TermsAcceptedCamel != nil {
		p.TermsAccepted = *p.TermsAcceptedCamel
	}

	p.IdempotencyKey = strings.TrimSpace(p.IdempotencyKey)
	p.TenantID = strings.TrimSpace(p.TenantID)
	p.FullName = strings.TrimSpace(p.FullName)
	p.Email = strings.ToLower(strings.TrimSpace(p.Email))
	p.CountryCode = strings.TrimSpace(p.CountryCode)
	p.Phone = strings.TrimSpace(p.Phone)
	p.CompanyName = strings.TrimSpace(p.CompanyName)
	p.BusinessRegNo = strings.TrimSpace(p.BusinessRegNo)
	p.BusinessType = strings.TrimSpace(p.BusinessType)
	p.BusinessSize = strings.TrimSpace(p.BusinessSize)
	p.Country = strings.TrimSpace(p.Country)
	p.City = strings.TrimSpace(p.City)
	p.State = strings.TrimSpace(p.State)
	p.PostalCode = strings.TrimSpace(p.PostalCode)
	p.Address = strings.TrimSpace(p.Address)
	p.CustomDomain = strings.TrimSpace(p.CustomDomain)
	p.HearAboutUs = strings.TrimSpace(p.HearAboutUs)

	if p.TenantID == "" {
		p.TenantID = "tenant_" + strings.ReplaceAll(p.Email, "@", "_")
	}
}

func (p registerPayload) validate() error {
	if len(p.FullName) < 3 {
		return fmt.Errorf("full_name is required and must be at least 3 characters")
	}

	if !strings.Contains(p.Email, "@") || len(p.Email) < 6 {
		return fmt.Errorf("valid email is required")
	}

	if p.Phone == "" {
		return fmt.Errorf("phone is required")
	}

	if len(p.CompanyName) < 2 {
		return fmt.Errorf("company_name is required")
	}

	if p.BusinessType == "" {
		return fmt.Errorf("business_type is required")
	}

	if p.BusinessSize == "" {
		return fmt.Errorf("business_size is required")
	}

	if p.Country == "" {
		return fmt.Errorf("country is required")
	}

	if p.City == "" {
		return fmt.Errorf("city is required")
	}

	if p.State == "" {
		return fmt.Errorf("state is required")
	}

	if p.Address == "" {
		return fmt.Errorf("address is required")
	}

	if p.Password == "" {
		return fmt.Errorf("password is required")
	}

	if len(p.Password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}

	if !p.TermsAccepted {
		return fmt.Errorf("terms_accepted must be true")
	}

	return nil
}

func makePasswordHash(password string) (string, error) {
	if len(password) < 8 {
		return "", fmt.Errorf("password must be at least 8 characters")
	}

	return generateArgon2idHash(password)
}

type argon2idParams struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
	saltLength  uint32
	keyLength   uint32
}

func defaultArgon2idParams() argon2idParams {
	return argon2idParams{
		memory:      64 * 1024,
		iterations:  3,
		parallelism: 2,
		saltLength:  16,
		keyLength:   32,
	}
}

func generateArgon2idHash(password string) (string, error) {
	params := defaultArgon2idParams()

	salt := make([]byte, params.saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey(
		[]byte(password),
		salt,
		params.iterations,
		params.memory,
		params.parallelism,
		params.keyLength,
	)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		params.memory,
		params.iterations,
		params.parallelism,
		b64Salt,
		b64Hash,
	), nil
}

func verifyPasswordHash(password string, storedHash string) (bool, error) {
	storedHash = strings.TrimSpace(storedHash)

	if !strings.HasPrefix(storedHash, "$argon2id$") {
		return false, fmt.Errorf("unsupported password hash")
	}

	return verifyArgon2idHash(password, storedHash)
}

func verifyArgon2idHash(password string, encodedHash string) (bool, error) {
	params, salt, expectedHash, err := decodeArgon2idHash(encodedHash)
	if err != nil {
		return false, err
	}

	actualHash := argon2.IDKey(
		[]byte(password),
		salt,
		params.iterations,
		params.memory,
		params.parallelism,
		params.keyLength,
	)

	if len(actualHash) != len(expectedHash) {
		return false, nil
	}

	return subtle.ConstantTimeCompare(actualHash, expectedHash) == 1, nil
}

func decodeArgon2idHash(encodedHash string) (argon2idParams, []byte, []byte, error) {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return argon2idParams{}, nil, nil, fmt.Errorf("invalid argon2id hash format")
	}

	if parts[1] != "argon2id" {
		return argon2idParams{}, nil, nil, fmt.Errorf("unsupported argon2 variant")
	}

	var version int
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil {
		return argon2idParams{}, nil, nil, err
	}

	if version != argon2.Version {
		return argon2idParams{}, nil, nil, fmt.Errorf("unsupported argon2 version")
	}

	params := argon2idParams{}
	if _, err := fmt.Sscanf(
		parts[3],
		"m=%d,t=%d,p=%d",
		&params.memory,
		&params.iterations,
		&params.parallelism,
	); err != nil {
		return argon2idParams{}, nil, nil, err
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return argon2idParams{}, nil, nil, err
	}

	hash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return argon2idParams{}, nil, nil, err
	}

	params.saltLength = uint32(len(salt))
	params.keyLength = uint32(len(hash))

	return params, salt, hash, nil
}

func saveRegistrationToSQLiteFirst(ctx context.Context, payload registerPayload, passwordHash string) (string, time.Time, error) {
	sqlitePath := getenvDefault("SOFTCODE_SQLITE_DB", "backend/auth/database/local_softcodesolution.db")

	if err := os.MkdirAll(filepath.Dir(sqlitePath), 0750); err != nil {
		return "", time.Time{}, err
	}

	db, err := sql.Open("sqlite3", sqlitePath)
	if err != nil {
		return "", time.Time{}, err
	}
	defer db.Close()

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.PingContext(ctx); err != nil {
		return "", time.Time{}, err
	}

	if err := ensureSQLiteRegisterSchema(ctx, db); err != nil {
		return "", time.Time{}, err
	}

	localID := newUUID()
	createdAt := time.Now().UTC()
	created := createdAt.Format(time.RFC3339)

	result, err := db.ExecContext(ctx, `
INSERT OR IGNORE INTO local_tenants (
	id, idempotency_key, tenant_id, full_name, email, country_code, phone,
	company_name, business_reg_no, business_type, business_size, country,
	city, state, postal_code, address, custom_domain, hear_about_us,
	password_hash, enable_passkey, terms_accepted, is_synced, sync_error_log,
	version, created_at, updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`,
		localID,
		payload.IdempotencyKey,
		payload.TenantID,
		payload.FullName,
		payload.Email,
		payload.CountryCode,
		payload.Phone,
		payload.CompanyName,
		nullableString(payload.BusinessRegNo),
		payload.BusinessType,
		payload.BusinessSize,
		payload.Country,
		payload.City,
		payload.State,
		nullableString(payload.PostalCode),
		payload.Address,
		nullableString(payload.CustomDomain),
		nullableString(payload.HearAboutUs),
		passwordHash,
		boolToInt(payload.EnablePasskey),
		boolToInt(payload.TermsAccepted),
		0,
		nil,
		1,
		created,
		created,
	)
	if err != nil {
		return "", time.Time{}, err
	}

	rows, _ := result.RowsAffected()
	if rows > 0 {
		return localID, createdAt, nil
	}

	var existingID, existingCreated string
	err = db.QueryRowContext(
		ctx,
		`SELECT id, created_at FROM local_tenants WHERE idempotency_key = ? OR email = ? ORDER BY created_at DESC LIMIT 1`,
		payload.IdempotencyKey,
		payload.Email,
	).Scan(&existingID, &existingCreated)
	if err != nil {
		return "", time.Time{}, err
	}

	parsedCreated := parseTimeFlexible(existingCreated)
	return existingID, parsedCreated, nil
}

type cloudSyncResult struct {
	ID        string
	Status    string
	CreatedAt time.Time
}

func syncRegistrationToPostgres(ctx context.Context, local localRegistration) (cloudSyncResult, error) {
	db, err := openRegisterDB(ctx)
	if err != nil {
		return cloudSyncResult{}, err
	}
	defer db.Close()

	if err := ensureRegisterAPISchema(ctx, db); err != nil {
		return cloudSyncResult{}, err
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return cloudSyncResult{}, err
	}
	defer tx.Rollback()

	existingID, err := cloudIDForIdempotencyKey(ctx, tx, local.IdempotencyKey)
	if err != nil {
		return cloudSyncResult{}, err
	}

	if existingID != "" {
		return cloudSyncResult{
			ID:        existingID,
			Status:    "pending_verification",
			CreatedAt: local.CreatedAt,
		}, tx.Commit()
	}

	insertQuery := `
INSERT INTO client_business_register (
	id,
	full_name,
	email,
	country_code,
	phone,
	company_name,
	business_reg_no,
	business_type,
	business_size,
	country,
	city,
	state,
	postal_code,
	address,
	password_hash,
	custom_domain,
	hear_about_us,
	terms_accepted
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9,
	$10, $11, $12, $13, $14, $15, $16, $17, $18
)
ON CONFLICT (email) DO NOTHING
RETURNING id, status, created_at;
`

	var result cloudSyncResult

	err = tx.QueryRowContext(
		ctx,
		insertQuery,
		local.ID,
		local.Payload.FullName,
		local.Payload.Email,
		local.Payload.CountryCode,
		local.Payload.Phone,
		local.Payload.CompanyName,
		nullableString(local.Payload.BusinessRegNo),
		local.Payload.BusinessType,
		local.Payload.BusinessSize,
		local.Payload.Country,
		local.Payload.City,
		local.Payload.State,
		nullableString(local.Payload.PostalCode),
		local.Payload.Address,
		local.PasswordHash,
		nullableString(local.Payload.CustomDomain),
		nullableString(local.Payload.HearAboutUs),
		local.Payload.TermsAccepted,
	).Scan(&result.ID, &result.Status, &result.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return cloudSyncResult{}, fmt.Errorf("duplicate_email")
		}

		return cloudSyncResult{}, err
	}

	if err := saveIdempotencyKey(ctx, tx, local.IdempotencyKey, result.ID); err != nil {
		return cloudSyncResult{}, err
	}

	if err := tx.Commit(); err != nil {
		return cloudSyncResult{}, err
	}

	return result, nil
}

func openRegisterDB(ctx context.Context) (*sql.DB, error) {
	dsn := os.Getenv("DATABASE_URL")

	if dsn == "" {
		host := getenvDefault("SCS_DB_HOST", "127.0.0.1")
		port := getenvDefault("SCS_DB_PORT", "5432")
		user := getenvDefault("SCS_DB_USER", os.Getenv("USER"))
		dbname := getenvDefault("SCS_DB_NAME", "softcodesolution")
		sslmode := getenvDefault("SCS_DB_SSLMODE", "disable")
		password := os.Getenv("SCS_DB_PASSWORD")

		if user == "" {
			user = "postgres"
		}

		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s dbname=%s sslmode=%s",
			host,
			port,
			user,
			dbname,
			sslmode,
		)

		if password != "" {
			dsn += " password=" + password
		}
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}

func ensureRegisterAPISchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS api_idempotency_keys (
	idempotency_key TEXT PRIMARY KEY,
	entity_name TEXT NOT NULL,
	entity_id TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`)
	return err
}

func ensureSQLiteRegisterSchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS local_tenants (
	id TEXT PRIMARY KEY,
	idempotency_key TEXT UNIQUE NOT NULL,
	tenant_id TEXT NOT NULL,
	full_name TEXT NOT NULL,
	email TEXT UNIQUE NOT NULL,
	country_code TEXT NOT NULL,
	phone TEXT NOT NULL,
	company_name TEXT NOT NULL,
	business_reg_no TEXT,
	business_type TEXT NOT NULL,
	business_size TEXT NOT NULL,
	country TEXT NOT NULL,
	city TEXT NOT NULL,
	state TEXT NOT NULL,
	postal_code TEXT,
	address TEXT NOT NULL,
	custom_domain TEXT,
	hear_about_us TEXT,
	password_hash TEXT NOT NULL,
	enable_passkey INTEGER DEFAULT 0,
	biometric_hash TEXT,
	terms_accepted INTEGER DEFAULT 1,
	is_synced INTEGER DEFAULT 0,
	sync_error_log TEXT,
	version INTEGER DEFAULT 1,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_local_pending_sync ON local_tenants(is_synced) WHERE is_synced = 0;
CREATE INDEX IF NOT EXISTS idx_local_tenant_id ON local_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_local_email ON local_tenants(email);
`)
	return err
}

func cloudIDForIdempotencyKey(ctx context.Context, tx *sql.Tx, key string) (string, error) {
	var entityID string

	err := tx.QueryRowContext(
		ctx,
		`SELECT entity_id FROM api_idempotency_keys WHERE idempotency_key = $1 LIMIT 1`,
		key,
	).Scan(&entityID)

	if err == sql.ErrNoRows {
		return "", nil
	}

	return entityID, err
}

func idempotencyKeyExists(ctx context.Context, tx *sql.Tx, key string) (bool, error) {
	existingID, err := cloudIDForIdempotencyKey(ctx, tx, key)
	return existingID != "", err
}

func saveIdempotencyKey(ctx context.Context, tx *sql.Tx, key string, entityID string) error {
	_, err := tx.ExecContext(
		ctx,
		`INSERT INTO api_idempotency_keys (idempotency_key, entity_name, entity_id)
		 VALUES ($1, 'client_business_register', $2)
		 ON CONFLICT (idempotency_key) DO NOTHING`,
		key,
		entityID,
	)

	return err
}

func startSQLiteToPostgresSyncWorker(ctx context.Context) {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	audit("sqlite_sync_worker", "started")

	for {
		select {
		case <-ctx.Done():
			audit("sqlite_sync_worker", "stopped")
			return

		case <-ticker.C:
			if err := syncPendingSQLiteRegistrations(ctx, 25); err != nil {
				audit("sqlite_sync_worker_warning", err.Error())
			}
		}
	}
}

func syncPendingSQLiteRegistrations(ctx context.Context, limit int) error {
	sqlitePath := getenvDefault("SOFTCODE_SQLITE_DB", "backend/auth/database/local_softcodesolution.db")

	db, err := sql.Open("sqlite3", sqlitePath)
	if err != nil {
		return err
	}
	defer db.Close()

	db.SetMaxOpenConns(1)

	if err := ensureSQLiteRegisterSchema(ctx, db); err != nil {
		return err
	}

	rows, err := db.QueryContext(ctx, `
SELECT
	id, idempotency_key, tenant_id, full_name, email, country_code, phone,
	company_name, business_reg_no, business_type, business_size, country,
	city, state, postal_code, address, custom_domain, hear_about_us,
	password_hash, enable_passkey, terms_accepted, created_at
FROM local_tenants
WHERE is_synced = 0
ORDER BY created_at ASC
LIMIT ?;
`, limit)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		local, err := scanLocalRegistration(rows)
		if err != nil {
			audit("sqlite_sync_scan_warning", err.Error())
			continue
		}

		syncCtx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
		result, err := syncRegistrationToPostgres(syncCtx, local)
		cancel()

		if err != nil {
			_ = markSQLiteRegistrationPending(context.Background(), local.ID, err.Error())
			audit("sqlite_sync_pending", local.Payload.Email+" error="+err.Error())
			continue
		}

		_ = markSQLiteRegistrationSynced(context.Background(), local.ID)
		audit("sqlite_sync_success", local.Payload.Email+" id="+result.ID)
	}

	return rows.Err()
}

func scanLocalRegistration(rows *sql.Rows) (localRegistration, error) {
	var local localRegistration
	var businessRegNo, postalCode, customDomain, hearAboutUs sql.NullString
	var enablePasskey, termsAccepted int
	var createdAtText string

	err := rows.Scan(
		&local.ID,
		&local.IdempotencyKey,
		&local.TenantID,
		&local.Payload.FullName,
		&local.Payload.Email,
		&local.Payload.CountryCode,
		&local.Payload.Phone,
		&local.Payload.CompanyName,
		&businessRegNo,
		&local.Payload.BusinessType,
		&local.Payload.BusinessSize,
		&local.Payload.Country,
		&local.Payload.City,
		&local.Payload.State,
		&postalCode,
		&local.Payload.Address,
		&customDomain,
		&hearAboutUs,
		&local.PasswordHash,
		&enablePasskey,
		&termsAccepted,
		&createdAtText,
	)
	if err != nil {
		return localRegistration{}, err
	}

	local.Payload.IdempotencyKey = local.IdempotencyKey
	local.Payload.TenantID = local.TenantID
	local.Payload.BusinessRegNo = businessRegNo.String
	local.Payload.PostalCode = postalCode.String
	local.Payload.CustomDomain = customDomain.String
	local.Payload.HearAboutUs = hearAboutUs.String
	local.Payload.EnablePasskey = enablePasskey == 1
	local.Payload.TermsAccepted = termsAccepted == 1
	local.CreatedAt = parseTimeFlexible(createdAtText)

	return local, nil
}

func markSQLiteRegistrationSynced(ctx context.Context, localID string) error {
	sqlitePath := getenvDefault("SOFTCODE_SQLITE_DB", "backend/auth/database/local_softcodesolution.db")

	db, err := sql.Open("sqlite3", sqlitePath)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.ExecContext(ctx, `
UPDATE local_tenants
SET is_synced = 1,
    sync_error_log = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`, localID)

	return err
}

func markSQLiteRegistrationPending(ctx context.Context, localID string, syncErr string) error {
	sqlitePath := getenvDefault("SOFTCODE_SQLITE_DB", "backend/auth/database/local_softcodesolution.db")

	db, err := sql.Open("sqlite3", sqlitePath)
	if err != nil {
		return err
	}
	defer db.Close()

	if len(syncErr) > 500 {
		syncErr = syncErr[:500]
	}

	_, err = db.ExecContext(ctx, `
UPDATE local_tenants
SET is_synced = 0,
    sync_error_log = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`, syncErr, localID)

	return err
}

func parseTimeFlexible(value string) time.Time {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Now().UTC()
	}

	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006-01-02 15:04:05.999999",
	}

	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed.UTC()
		}
	}

	return time.Now().UTC()
}

func newUUID() string {
	var b [16]byte

	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}

	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80

	return fmt.Sprintf(
		"%08x-%04x-%04x-%04x-%012x",
		b[0:4],
		b[4:6],
		b[6:8],
		b[8:10],
		b[10:16],
	)
}

func boolToInt(value bool) int {
	if value {
		return 1
	}

	return 0
}

func writeAPIJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Println("write json failed:", err)
	}
}

func writeAPIError(w http.ResponseWriter, status int, code string, message string) {
	writeAPIJSON(w, status, map[string]interface{}{
		"ok":      false,
		"code":    code,
		"message": message,
	})
}

func apiCORSHeaders(w http.ResponseWriter) {
	origin := os.Getenv("SCS_ALLOWED_ORIGIN")
	if origin == "" {
		origin = "*"
	}

	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, Idempotency-Key")
}

func nullableString(value string) interface{} {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}

	return value
}

func getenvDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
