package main

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"
)

type gatewaySecurityTenantKey struct{}
type gatewaySecurityScopesKey struct{}
type gatewaySecurityAPIKeyIDKey struct{}

type gatewayRateLimitBucket struct {
	WindowStart time.Time
	Count       int
}

var gatewayRateLimitStore = struct {
	sync.Mutex
	Items map[string]*gatewayRateLimitBucket
}{
	Items: make(map[string]*gatewayRateLimitBucket),
}

func gatewaySecurityHash(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

func gatewaySecurityAPIKey(r *http.Request) string {
	if key := strings.TrimSpace(r.Header.Get("X-SCS-API-Key")); key != "" {
		return key
	}

	auth := strings.TrimSpace(r.Header.Get("Authorization"))
	if len(auth) > 7 && strings.EqualFold(auth[:7], "Bearer ") {
		return strings.TrimSpace(auth[7:])
	}

	return ""
}

func gatewaySecurityVerifyAPIKey(ctx context.Context, db *sql.DB, secret string) (string, string, []string, time.Time, error) {
	secret = strings.TrimSpace(secret)

	if strings.HasPrefix(secret, "scs_live_") {
		secret = strings.TrimPrefix(secret, "scs_live_")
	}

	if secret == "" {
		return "", "", nil, time.Time{}, sql.ErrNoRows
	}

	hash := gatewaySecurityHash(secret)

	var (
		keyID     string
		tenantID  string
		scopeJSON []byte
		status    string
		expiresAt sql.NullTime
	)

	err := db.QueryRowContext(ctx, `
		SELECT id, tenant_id, scopes, status, expires_at
		FROM api_gateway_keys
		WHERE secret_hash = $1
	`, hash).Scan(
		&keyID,
		&tenantID,
		&scopeJSON,
		&status,
		&expiresAt,
	)

	if err != nil {
		return "", "", nil, time.Time{}, err
	}

	if status != "active" {
		return "", "", nil, time.Time{}, sql.ErrNoRows
	}

	if expiresAt.Valid && !expiresAt.Time.After(time.Now().UTC()) {
		_, _ = db.ExecContext(ctx, `
			UPDATE api_gateway_keys
			SET status = 'expired', updated_at = NOW()
			WHERE id = $1
		`, keyID)

		return "", "", nil, time.Time{}, sql.ErrNoRows
	}

	scopes := []string{"read"}

	if len(scopeJSON) > 0 {
		if err := json.Unmarshal(scopeJSON, &scopes); err != nil {
			return "", "", nil, time.Time{}, err
		}
	}

	_, _ = db.ExecContext(ctx, `
		UPDATE api_gateway_keys
		SET last_used_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, keyID)

	return keyID, tenantID, normalizeGatewayScopes(scopes), expiresAt.Time, nil
}

func gatewaySecurityHasScope(scopes []string, required string) bool {
	required = strings.ToLower(strings.TrimSpace(required))

	for _, scope := range scopes {
		scope = strings.ToLower(strings.TrimSpace(scope))

		if subtle.ConstantTimeCompare([]byte(scope), []byte(required)) == 1 ||
			subtle.ConstantTimeCompare([]byte(scope), []byte("admin")) == 1 {
			return true
		}
	}

	return false
}

func gatewaySecurityRequiredScope(method string) string {
	switch method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return "read"
	default:
		return "write"
	}
}

func gatewaySecurityRateLimitKey(r *http.Request, keyID, tenantID string) string {
	return tenantID + "|" + keyID + "|" + r.Method + "|" + r.URL.Path
}

func gatewaySecurityEnsureRateLimitSchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS api_gateway_rate_limits (
			id TEXT PRIMARY KEY,
			tenant_id TEXT NOT NULL,
			api_key_id TEXT,
			path_pattern TEXT NOT NULL DEFAULT '*',
			window_seconds INTEGER NOT NULL DEFAULT 60,
			max_requests INTEGER NOT NULL DEFAULT 60,
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS
		idx_api_gateway_rate_limits_lookup
		ON api_gateway_rate_limits(tenant_id, api_key_id, path_pattern, enabled);
	`)

	return err
}

func gatewaySecurityRateLimit(db *sql.DB, r *http.Request, keyID, tenantID string) (bool, int, time.Duration, error) {
	return gatewayDistributedRateLimit(db, r, keyID, tenantID)
}

func gatewaySecurityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := gatewaySecurityAPIKey(r)

		if apiKey == "" {
			writeAPIError(w, http.StatusUnauthorized, "api_key_required", "API key authentication is required")
			return
		}

		db, err := openSoftCodeBackupDB(r.Context())
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_db_failed", "API key database unavailable")
			return
		}
		defer db.Close()

		if err := ensureAPIGatewayKeySchema(r.Context(), db); err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_schema_failed", "API key schema unavailable")
			return
		}

		keyID, tenantID, scopes, _, err := gatewaySecurityVerifyAPIKey(r.Context(), db, apiKey)
		if err != nil || keyID == "" || tenantID == "" {
			writeAPIError(w, http.StatusUnauthorized, "invalid_api_key", "Invalid or inactive API key")
			return
		}

		/* API-key credentials never become SuperAdmin browser sessions. */
		if strings.HasPrefix(r.URL.Path, "/api/superadmin/") {
			writeAPIError(w, http.StatusForbidden, "api_key_forbidden", "API keys cannot access SuperAdmin session routes")
			return
		}

		requiredScope := gatewaySecurityRequiredScope(r.Method)
		if !gatewaySecurityHasScope(scopes, requiredScope) {
			writeAPIError(w, http.StatusForbidden, "insufficient_scope", "Required scope: "+requiredScope)
			return
		}

		gatewayApplySecurityHeaders(w)

		_, policyStatus, policyMessage := gatewayEnforceSecurityPolicy(r.Context(), db, r, tenantID)
		if policyStatus != 0 {
			writeAPIError(w, policyStatus, "security_policy_blocked", policyMessage)
			return
		}
		allowed, remaining, retryAfter, err := gatewaySecurityRateLimit(db, r, keyID, tenantID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "rate_limit_failed", "Rate-limit enforcement unavailable")
			return
		}

		if !allowed {
			w.Header().Set("Retry-After", strings.TrimRight(strings.TrimSpace((retryAfter+time.Second).String()), "0s"))
			w.Header().Set("X-RateLimit-Remaining", "0")
			writeAPIError(w, http.StatusTooManyRequests, "rate_limit_exceeded", "API rate limit exceeded")
			return
		}

		gatewayRateLimitHeaders(w, remaining, retryAfter)

		ctx := context.WithValue(r.Context(), gatewaySecurityTenantKey{}, tenantID)
		ctx = context.WithValue(ctx, gatewaySecurityScopesKey{}, scopes)
		ctx = context.WithValue(ctx, gatewaySecurityAPIKeyIDKey{}, keyID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func gatewaySecurityTenantID(ctx context.Context) string {
	value, _ := ctx.Value(gatewaySecurityTenantKey{}).(string)
	return value
}

func gatewaySecurityScopes(ctx context.Context) []string {
	value, _ := ctx.Value(gatewaySecurityScopesKey{}).([]string)
	return value
}

func gatewaySecurityAPIKeyID(ctx context.Context) string {
	value, _ := ctx.Value(gatewaySecurityAPIKeyIDKey{}).(string)
	return value
}

func handleGatewaySecurityProbe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "GET required")
		return
	}

	db, err := openSoftCodeBackupDB(r.Context())
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "api_key_db_failed", "API key database unavailable")
		return
	}
	defer db.Close()

	apiKey := gatewaySecurityAPIKey(r)
	if apiKey == "" {
		writeAPIError(w, http.StatusUnauthorized, "api_key_required", "X-SCS-API-Key or Bearer token is required")
		return
	}

	keyID, tenantID, scopes, _, err := gatewaySecurityVerifyAPIKey(r.Context(), db, apiKey)
	if err != nil || keyID == "" {
		writeAPIError(w, http.StatusUnauthorized, "invalid_api_key", "Invalid or inactive API key")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":            true,
		"request_id":    requestIDFrom(r),
		"authenticated": true,
		"api_key_id":    keyID,
		"tenant_id":     tenantID,
		"scopes":        scopes,
	})
}

func registerAPIGatewaySecurityRoutes(mux *http.ServeMux) {
	mux.Handle(
		"/api/gateway/security/probe",
		gatewaySecurityMiddleware(http.HandlerFunc(handleGatewaySecurityProbe)),
	)
}
