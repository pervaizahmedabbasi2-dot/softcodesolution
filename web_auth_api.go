package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

const authSessionCookieName = "scs_session"

type authLoginPayload struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	RememberMe bool   `json:"remember_me"`

	// Angular camelCase support
	RememberMeCamel bool `json:"rememberMe"`
}

type authUser struct {
	ID               string
	TenantID         sql.NullString
	Email            string
	PasswordHash     string
	Role             string
	Status           string
	FailedLoginCount int
	LockedUntil      sql.NullTime
}

func registerAuthHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/auth/login", handleAuthLogin)
	mux.HandleFunc("/api/auth/me", handleAuthMe)
	mux.HandleFunc("/api/auth/logout", handleAuthLogout)
}

func handleAuthLogin(w http.ResponseWriter, r *http.Request) {
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

	var payload authLoginPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		audit("auth_login_bad_json", err.Error())
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON body")
		return
	}

	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	payload.Password = strings.TrimSpace(payload.Password)

	if payload.RememberMeCamel {
		payload.RememberMe = true
	}

	if payload.Email == "" || !strings.Contains(payload.Email, "@") || payload.Password == "" {
		writeAPIError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, err := openRegisterDB(ctx)
	if err != nil {
		audit("auth_login_db_open_failed", err.Error())
		writeAPIError(w, http.StatusInternalServerError, "db_connection_failed", "Database connection failed")
		return
	}
	defer db.Close()

	if err := ensureAuthSchemaAndSeed(ctx, db); err != nil {
		audit("auth_schema_failed", err.Error())
		writeAPIError(w, http.StatusInternalServerError, "auth_schema_failed", "Authentication system is not ready")
		return
	}

	user, err := loadAuthUserByEmail(ctx, db, payload.Email)
	if err == sql.ErrNoRows {
		auditAuthEvent(ctx, db, "", "", payload.Email, "login_failed", "user_not_found", r)
		time.Sleep(350 * time.Millisecond)
		writeAPIError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}
	if err != nil {
		audit("auth_login_user_load_failed", err.Error())
		writeAPIError(w, http.StatusInternalServerError, "login_failed", "Could not login")
		return
	}

	if user.Status != "active" {
		auditAuthEvent(ctx, db, user.ID, nullStringValue(user.TenantID), user.Email, "login_blocked", "status="+user.Status, r)
		writeAPIError(w, http.StatusForbidden, "account_not_active", "Account is not active")
		return
	}

	if user.LockedUntil.Valid && user.LockedUntil.Time.After(time.Now().UTC()) {
		auditAuthEvent(ctx, db, user.ID, nullStringValue(user.TenantID), user.Email, "login_blocked", "account_locked", r)
		writeAPIError(w, http.StatusTooManyRequests, "account_locked", "Account is temporarily locked")
		return
	}

	ok, err := verifyPasswordHash(payload.Password, user.PasswordHash)
	if err != nil || !ok {
		_ = registerFailedLogin(ctx, db, user.ID)
		auditAuthEvent(ctx, db, user.ID, nullStringValue(user.TenantID), user.Email, "login_failed", "bad_password", r)
		time.Sleep(350 * time.Millisecond)
		writeAPIError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	sessionToken, expiresAt, err := createAuthSession(ctx, db, user, payload.RememberMe, r)
	if err != nil {
		audit("auth_session_create_failed", err.Error())
		writeAPIError(w, http.StatusInternalServerError, "session_failed", "Could not create session")
		return
	}

	_ = registerSuccessfulLogin(ctx, db, user.ID)
	auditAuthEvent(ctx, db, user.ID, nullStringValue(user.TenantID), user.Email, "login_success", "role="+user.Role, r)

	setAuthCookie(w, sessionToken, expiresAt)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":       true,
		"message":  "Login successful",
		"redirect": redirectForRole(user.Role),
		"user": map[string]interface{}{
			"id":        user.ID,
			"tenant_id": nullStringValue(user.TenantID),
			"email":     user.Email,
			"role":      user.Role,
			"status":    user.Status,
		},
		"request_id": requestID,
	})
}

func handleAuthMe(w http.ResponseWriter, r *http.Request) {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	apiCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET is allowed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()

	db, err := openRegisterDB(ctx)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "db_connection_failed", "Database connection failed")
		return
	}
	defer db.Close()

	if err := ensureAuthSchemaAndSeed(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "auth_schema_failed", "Authentication system is not ready")
		return
	}

	user, err := userFromRequestSession(ctx, db, r)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "not_authenticated", "Not authenticated")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":       true,
		"redirect": redirectForRole(user.Role),
		"user": map[string]interface{}{
			"id":        user.ID,
			"tenant_id": nullStringValue(user.TenantID),
			"email":     user.Email,
			"role":      user.Role,
			"status":    user.Status,
		},
		"request_id": requestID,
	})
}

func handleAuthLogout(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()

	db, err := openRegisterDB(ctx)
	if err == nil {
		defer db.Close()

		if cookie, cookieErr := r.Cookie(authSessionCookieName); cookieErr == nil {
			_, _ = db.ExecContext(
				ctx,
				`UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE session_hash = $1 AND revoked_at IS NULL`,
				hashSessionToken(cookie.Value),
			)
		}
	}

	clearAuthCookie(w)

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":         true,
		"message":    "Logged out",
		"request_id": requestID,
	})
}

func ensureAuthSchemaAndSeed(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS auth_users (
	id TEXT PRIMARY KEY,
	tenant_id TEXT,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	role TEXT NOT NULL CHECK (role IN ('super_admin', 'client_admin', 'client_user', 'support')),
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'deleted')),
	failed_login_count INTEGER NOT NULL DEFAULT 0,
	locked_until TEXT,
	last_login_at TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_tenant_id ON auth_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_status ON auth_users(status);

CREATE TABLE IF NOT EXISTS auth_sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
	session_hash TEXT NOT NULL UNIQUE,
	ip_address TEXT,
	user_agent TEXT,
	expires_at TEXT NOT NULL,
	revoked_at TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_revoked_at ON auth_sessions(revoked_at);

CREATE TABLE IF NOT EXISTS auth_audit_logs (
	id TEXT PRIMARY KEY,
	user_id TEXT,
	tenant_id TEXT,
	email TEXT,
	action TEXT NOT NULL,
	details TEXT,
	ip_address TEXT,
	user_agent TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_tenant_id ON auth_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created_at ON auth_audit_logs(created_at DESC);
`)
	if err != nil {
		return err
	}

	return seedSuperAdminFromEnv(ctx, db)
}

func seedSuperAdminFromEnv(ctx context.Context, db *sql.DB) error {
	email := strings.ToLower(strings.TrimSpace(os.Getenv("SCS_SUPERADMIN_EMAIL")))
	password := strings.TrimSpace(os.Getenv("SCS_SUPERADMIN_PASSWORD"))

	if email == "" || password == "" {
		return nil
	}

	if len(password) < 12 {
		return fmt.Errorf("SCS_SUPERADMIN_PASSWORD must be at least 12 characters")
	}

	passwordHash, err := makePasswordHash(password)
	if err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, `
INSERT INTO auth_users (
	id,
	tenant_id,
	email,
	password_hash,
	role,
	status,
	failed_login_count
)
VALUES ($1, 'system', $2, $3, 'super_admin', 'active', 0)
ON CONFLICT (email) DO NOTHING;
`, newUUID(), email, passwordHash)

	if err == nil {
		audit("super_admin_seed_checked", email)
	}

	return err
}

func loadAuthUserByEmail(ctx context.Context, db *sql.DB, email string) (authUser, error) {
	var user authUser

	err := db.QueryRowContext(ctx, `
SELECT
	id,
	tenant_id,
	email,
	password_hash,
	role,
	status,
	failed_login_count,
	locked_until
FROM auth_users
WHERE email = $1
LIMIT 1;
`, strings.ToLower(strings.TrimSpace(email))).Scan(
		&user.ID,
		&user.TenantID,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.Status,
		&user.FailedLoginCount,
		&user.LockedUntil,
	)

	return user, err
}

func registerFailedLogin(ctx context.Context, db *sql.DB, userID string) error {
	_, err := db.ExecContext(ctx, `
UPDATE auth_users
SET
	failed_login_count = failed_login_count + 1,
	locked_until = CASE
		WHEN failed_login_count + 1 >= 5 THEN datetime('now', '+15 minutes')
		ELSE locked_until
	END,
	updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
`, userID)

	return err
}

func registerSuccessfulLogin(ctx context.Context, db *sql.DB, userID string) error {
	_, err := db.ExecContext(ctx, `
UPDATE auth_users
SET
	failed_login_count = 0,
	locked_until = NULL,
	last_login_at = CURRENT_TIMESTAMP,
	updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
`, userID)

	return err
}

func createAuthSession(ctx context.Context, db *sql.DB, user authUser, remember bool, r *http.Request) (string, time.Time, error) {
	token, err := randomSessionToken()
	if err != nil {
		return "", time.Time{}, err
	}

	duration := 12 * time.Hour
	if remember {
		duration = 30 * 24 * time.Hour
	}

	expiresAt := time.Now().UTC().Add(duration)

	_, err = db.ExecContext(ctx, `
INSERT INTO auth_sessions (
	id,
	user_id,
	session_hash,
	ip_address,
	user_agent,
	expires_at
)
VALUES ($1, $2, $3, $4, $5, $6);
`,
		newUUID(),
		user.ID,
		hashSessionToken(token),
		clientIPFromRequest(r),
		safeUserAgent(r),
		expiresAt,
	)

	if err != nil {
		return "", time.Time{}, err
	}

	return token, expiresAt, nil
}

func userFromRequestSession(ctx context.Context, db *sql.DB, r *http.Request) (authUser, error) {
	cookie, err := r.Cookie(authSessionCookieName)
	if err != nil {
		return authUser{}, err
	}

	sessionHash := hashSessionToken(cookie.Value)

	var user authUser

	err = db.QueryRowContext(ctx, `
SELECT
	u.id,
	u.tenant_id,
	u.email,
	u.password_hash,
	u.role,
	u.status,
	u.failed_login_count,
	u.locked_until
FROM auth_sessions s
JOIN auth_users u ON u.id = s.user_id
WHERE
	s.session_hash = $1
	AND s.revoked_at IS NULL
	AND s.expires_at > CURRENT_TIMESTAMP
	AND u.status = 'active'
LIMIT 1;
`, sessionHash).Scan(
		&user.ID,
		&user.TenantID,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.Status,
		&user.FailedLoginCount,
		&user.LockedUntil,
	)

	return user, err
}

func randomSessionToken() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(raw), nil
}

func hashSessionToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func setAuthCookie(w http.ResponseWriter, token string, expiresAt time.Time) {
	maxAge := int(time.Until(expiresAt).Seconds())
	if maxAge < 0 {
		maxAge = 0
	}

	http.SetCookie(w, &http.Cookie{
		Name:     authSessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func clearAuthCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     authSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func auditAuthEvent(ctx context.Context, db *sql.DB, userID string, tenantID string, email string, action string, details string, r *http.Request) {
	_, _ = db.ExecContext(ctx, `
INSERT INTO auth_audit_logs (
	id,
	user_id,
	tenant_id,
	email,
	action,
	details,
	ip_address,
	user_agent
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
`,
		newUUID(),
		emptyToNil(userID),
		emptyToNil(tenantID),
		emptyToNil(strings.ToLower(strings.TrimSpace(email))),
		action,
		emptyToNil(details),
		emptyToNil(clientIPFromRequest(r)),
		emptyToNil(safeUserAgent(r)),
	)

	audit("auth_"+action, email+" "+details)
}

func redirectForRole(role string) string {
	switch role {
	case "super_admin":
		return "/dashboard" // Adjusted to standard /dashboard
	case "client_admin", "client_user", "support":
		return "/dashboard"
	default:
		return "/login"
	}
}

func clientIPFromRequest(r *http.Request) string {
	for _, header := range []string{"X-Forwarded-for", "X-Real-IP"} {
		value := strings.TrimSpace(r.Header.Get(header))
		if value != "" {
			parts := strings.Split(value, ",")
			return sanitizeLog(strings.TrimSpace(parts[0]))
		}
	}

	return sanitizeLog(r.RemoteAddr)
}

func safeUserAgent(r *http.Request) string {
	ua := strings.TrimSpace(r.UserAgent())
	if len(ua) > 300 {
		ua = ua[:300]
	}

	return sanitizeLog(ua)
}

func nullStringValue(value sql.NullString) string {
	if value.Valid {
		return value.String
	}

	return ""
}

func emptyToNil(value string) interface{} {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}

	return value
}
