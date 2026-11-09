package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type gatewayMetric struct {
	Calls       int64
	TotalMS     int64
	LastRequest string
}

var gatewayMetricStore = struct {
	sync.RWMutex
	items map[string]*gatewayMetric
}{
	items: make(map[string]*gatewayMetric),
}

func gatewayMetricKey(method, endpoint string) string {
	return method + " " + endpoint
}

func recordGatewayMetric(method, endpoint string, latency time.Duration) {
	key := gatewayMetricKey(method, endpoint)

	gatewayMetricStore.Lock()
	metric := gatewayMetricStore.items[key]
	if metric == nil {
		metric = &gatewayMetric{}
		gatewayMetricStore.items[key] = metric
	}
	gatewayMetricStore.Unlock()

	atomic.AddInt64(&metric.Calls, 1)
	atomic.AddInt64(&metric.TotalMS, latency.Milliseconds())

	gatewayMetricStore.Lock()
	metric.LastRequest = time.Now().UTC().Format(time.RFC3339)
	gatewayMetricStore.Unlock()
}

type gatewayResponseWriter struct {
	http.ResponseWriter
	status int
}

func (w *gatewayResponseWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *gatewayResponseWriter) Write(body []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	return w.ResponseWriter.Write(body)
}

func gatewayTelemetryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()

		recorder := &gatewayResponseWriter{ResponseWriter: w}
		next.ServeHTTP(recorder, r)

		recordGatewayMetric(
			r.Method,
			r.URL.Path,
			time.Since(started),
		)
	})
}

type gatewayEndpointSnapshot struct {
	Method      string `json:"method"`
	Path        string `json:"path"`
	Calls       int64  `json:"calls"`
	AvgLatency  int64  `json:"avgLatency"`
	LastRequest string `json:"lastRequest,omitempty"`
}

type gatewaySummaryResponse struct {
	OK        bool                      `json:"ok"`
	RequestID string                    `json:"request_id"`
	Endpoints []gatewayEndpointSnapshot `json:"endpoints"`
}

func handleSuperadminAPIGatewaySummary(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "GET required")
		return
	}

	ctx := r.Context()
	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	requestID := requestIDFrom(r)

	routes := []struct {
		method string
		path   string
	}{
		{"POST", "/api/auth/login"},
		{"POST", "/api/auth/register"},
		{"GET", "/api/auth/me"},
		{"GET", "/api/superadmin/clients"},
		{"POST", "/api/superadmin/clients/approve"},
		{"GET", "/api/superadmin/rbac/roles"},
		{"POST", "/api/superadmin/rbac/roles/save"},
		{"GET", "/api/superadmin/modules"},
		{"POST", "/api/superadmin/subscriptions/save"},
		{"GET", "/api/client/modules"},
		{"GET", "/api/superadmin/rbac/audit"},
		{"GET", "/healthz"},
		{"GET", "/readyz"},
	}

	out := make([]gatewayEndpointSnapshot, 0, len(routes))

	for _, route := range routes {
		snapshot := gatewayEndpointSnapshot{
			Method: route.method,
			Path:   route.path,
		}

		key := gatewayMetricKey(route.method, route.path)

		gatewayMetricStore.RLock()
		metric := gatewayMetricStore.items[key]
		if metric != nil {
			snapshot.Calls = atomic.LoadInt64(&metric.Calls)
			total := atomic.LoadInt64(&metric.TotalMS)
			if snapshot.Calls > 0 {
				snapshot.AvgLatency = total / snapshot.Calls
			}
			snapshot.LastRequest = metric.LastRequest
		}
		gatewayMetricStore.RUnlock()

		out = append(out, snapshot)
	}

	writeAPIJSON(w, http.StatusOK, gatewaySummaryResponse{
		OK:        true,
		RequestID: requestID,
		Endpoints: out,
	})
}

type gatewayAPIKey struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	KeyPrefix  string     `json:"key_prefix"`
	TenantID   string     `json:"tenant_id"`
	Scopes     []string   `json:"scopes"`
	Status     string     `json:"status"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
}

type gatewayAPIKeyCreatePayload struct {
	Name      string   `json:"name"`
	TenantID  string   `json:"tenant_id"`
	Scopes    []string `json:"scopes"`
	ExpiresAt string   `json:"expires_at"`
}

type gatewayAPIKeyActionPayload struct {
	ID string `json:"id"`
}

func normalizeGatewayScopes(scopes []string) []string {
	allowed := map[string]bool{
		"read":  true,
		"write": true,
		"admin": true,
	}

	seen := make(map[string]bool)
	out := make([]string, 0, len(scopes))

	for _, scope := range scopes {
		scope = strings.ToLower(strings.TrimSpace(scope))
		if !allowed[scope] || seen[scope] {
			continue
		}
		seen[scope] = true
		out = append(out, scope)
	}

	if len(out) == 0 {
		out = []string{"read"}
	}

	return out
}

func generateGatewayID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func generateGatewaySecret() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func gatewaySecretHash(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

func ensureAPIGatewayKeySchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
        CREATE TABLE IF NOT EXISTS api_gateway_keys (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            key_prefix TEXT NOT NULL,
            secret_hash TEXT NOT NULL UNIQUE,
            tenant_id TEXT NOT NULL,
            scopes JSONB NOT NULL DEFAULT '["read"]'::jsonb,
            status TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'revoked', 'expired')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_used_at TIMESTAMPTZ,
            expires_at TIMESTAMPTZ,
            created_by TEXT,
            revoked_at TIMESTAMPTZ,
            revoked_by TEXT
        );

        CREATE INDEX IF NOT EXISTS
        idx_api_gateway_keys_tenant_status
        ON api_gateway_keys(tenant_id, status);

        CREATE INDEX IF NOT EXISTS
        idx_api_gateway_keys_expires_at
        ON api_gateway_keys(expires_at);
    `)
	return err
}

func loadGatewayAPIKeys(ctx context.Context, db *sql.DB, tenantID string) ([]gatewayAPIKey, error) {
	rows, err := db.QueryContext(ctx, `
        SELECT
            id,
            name,
            key_prefix,
            tenant_id,
            scopes,
            status,
            created_at,
            updated_at,
            last_used_at,
            expires_at
        FROM api_gateway_keys
        WHERE tenant_id = $1
        ORDER BY created_at DESC
    `, tenantID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]gatewayAPIKey, 0)

	for rows.Next() {
		var item gatewayAPIKey
		var scopeJSON []byte

		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.KeyPrefix,
			&item.TenantID,
			&scopeJSON,
			&item.Status,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.LastUsedAt,
			&item.ExpiresAt,
		); err != nil {
			return nil, err
		}

		if err := json.Unmarshal(scopeJSON, &item.Scopes); err != nil {
			item.Scopes = []string{"read"}
		}

		if item.ExpiresAt != nil &&
			item.ExpiresAt.Before(time.Now().UTC()) &&
			item.Status == "active" {

			_, _ = db.ExecContext(ctx, `
                UPDATE api_gateway_keys
                SET status = 'expired', updated_at = NOW()
                WHERE id = $1
            `, item.ID)

			item.Status = "expired"
		}

		out = append(out, item)
	}

	return out, rows.Err()
}

func handleSuperadminAPIGatewayKeys(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureAPIGatewayKeySchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "api_key_schema_failed", "API key storage is not ready")
		return
	}

	switch r.Method {
	case http.MethodGet:
		tenantID := strings.TrimSpace(admin.TenantID.String)
		if tenantID == "" {
			tenantID = "platform"
		}

		keys, err := loadGatewayAPIKeys(ctx, db, tenantID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_load_failed", "Could not load API keys")
			return
		}

		writeAPIJSON(w, http.StatusOK, map[string]interface{}{
			"ok":         true,
			"request_id": requestIDFrom(r),
			"keys":       keys,
		})
		return

	case http.MethodPost:
		var payload gatewayAPIKeyCreatePayload

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid API key payload")
			return
		}

		payload.Name = strings.TrimSpace(payload.Name)
		if payload.Name == "" {
			writeAPIError(w, http.StatusBadRequest, "invalid_name", "API key name is required")
			return
		}

		tenantID := strings.TrimSpace(admin.TenantID.String)
		if tenantID == "" {
			tenantID = "platform"
		}

		if strings.TrimSpace(payload.TenantID) != "" {
			tenantID = strings.TrimSpace(payload.TenantID)
		}

		scopes := normalizeGatewayScopes(payload.Scopes)

		var expiresAt *time.Time
		if strings.TrimSpace(payload.ExpiresAt) != "" {
			parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(payload.ExpiresAt))
			if err != nil {
				writeAPIError(w, http.StatusBadRequest, "invalid_expiry", "expires_at must be RFC3339")
				return
			}
			expiresAt = &parsed
		}

		keyID, err := generateGatewayID()
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_generation_failed", "Could not generate API key")
			return
		}

		secret, err := generateGatewaySecret()
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_generation_failed", "Could not generate API secret")
			return
		}

		const prefix = "scs_live_"
		keyPrefix := prefix + secret[:8]
		presentedSecret := prefix + secret
		secretHash := gatewaySecretHash(secret)

		scopeJSON, err := json.Marshal(scopes)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "scope_encoding_failed", "Could not encode API key scopes")
			return
		}

		_, err = db.ExecContext(ctx, `
            INSERT INTO api_gateway_keys (
                id,
                name,
                key_prefix,
                secret_hash,
                tenant_id,
                scopes,
                status,
                created_at,
                updated_at,
                expires_at,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'active', NOW(), NOW(), $7, $8)
        `,
			keyID,
			payload.Name,
			keyPrefix,
			secretHash,
			tenantID,
			string(scopeJSON),
			expiresAt,
			admin.ID,
		)

		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_create_failed", "Could not create API key")
			return
		}

		auditAuthEvent(
			ctx,
			db,
			admin.ID,
			nullStringValue(admin.TenantID),
			admin.Email,
			"api_key_created",
			"name="+payload.Name,
			r,
		)

		writeAPIJSON(w, http.StatusCreated, map[string]interface{}{
			"ok":         true,
			"request_id": requestIDFrom(r),
			"id":         keyID,
			"name":       payload.Name,
			"tenant_id":  tenantID,
			"key_prefix": keyPrefix,
			"scopes":     scopes,
			"secret":     presentedSecret,
			"warning":    "Store this secret now. It will not be returned again.",
		})
		return

	default:
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "GET or POST required")
	}
}

func handleSuperadminAPIGatewayKeyAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "POST required")
		return
	}

	ctx := r.Context()
	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := ensureAPIGatewayKeySchema(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "api_key_schema_failed", "API key storage is not ready")
		return
	}

	var payload gatewayAPIKeyActionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid API key action payload")
		return
	}

	payload.ID = strings.TrimSpace(payload.ID)
	if payload.ID == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_key_id", "API key id is required")
		return
	}

	tenantID := strings.TrimSpace(admin.TenantID.String)
	if tenantID == "" {
		tenantID = "platform"
	}

	switch r.URL.Path {
	case "/api/superadmin/api-gateway/keys/revoke":
		res, err := db.ExecContext(ctx, `
            UPDATE api_gateway_keys
            SET
                status = 'revoked',
                revoked_at = NOW(),
                revoked_by = $1,
                updated_at = NOW()
            WHERE id = $2
              AND tenant_id = $3
              AND status = 'active'
        `, admin.ID, payload.ID, tenantID)

		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_revoke_failed", "Could not revoke API key")
			return
		}

		affected, _ := res.RowsAffected()
		if affected == 0 {
			writeAPIError(w, http.StatusNotFound, "api_key_not_active", "Active API key not found")
			return
		}

		auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "api_key_revoked", "id="+payload.ID, r)

		writeAPIJSON(w, http.StatusOK, map[string]interface{}{
			"ok":         true,
			"request_id": requestIDFrom(r),
			"id":         payload.ID,
			"status":     "revoked",
		})
		return

	case "/api/superadmin/api-gateway/keys/rotate":
		var name string
		var scopesJSON []byte

		err := db.QueryRowContext(ctx, `
            SELECT name, scopes
            FROM api_gateway_keys
            WHERE id = $1 AND tenant_id = $2
        `, payload.ID, tenantID).Scan(&name, &scopesJSON)

		if err != nil {
			writeAPIError(w, http.StatusNotFound, "api_key_not_found", "API key not found")
			return
		}

		scopes := []string{"read"}
		_ = json.Unmarshal(scopesJSON, &scopes)
		scopes = normalizeGatewayScopes(scopes)

		secret, err := generateGatewaySecret()
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_generation_failed", "Could not generate replacement secret")
			return
		}

		secretHash := gatewaySecretHash(secret)
		presentedSecret := "scs_live_" + secret
		keyPrefix := "scs_live_" + secret[:8]

		_, err = db.ExecContext(ctx, `
            UPDATE api_gateway_keys
            SET
                secret_hash = $1,
                key_prefix = $2,
                status = 'active',
                updated_at = NOW(),
                revoked_at = NULL,
                revoked_by = NULL
            WHERE id = $3 AND tenant_id = $4
        `, secretHash, keyPrefix, payload.ID, tenantID)

		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "api_key_rotate_failed", "Could not rotate API key")
			return
		}

		auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "api_key_rotated", "id="+payload.ID, r)

		writeAPIJSON(w, http.StatusOK, map[string]interface{}{
			"ok":         true,
			"request_id": requestIDFrom(r),
			"id":         payload.ID,
			"name":       name,
			"tenant_id":  tenantID,
			"scopes":     scopes,
			"status":     "active",
			"secret":     presentedSecret,
			"warning":    "Store this replacement secret now. It will not be returned again.",
		})
		return
	}

	writeAPIError(w, http.StatusNotFound, "unknown_key_action", "Unknown API key action")
}

func registerAPIGatewayHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc(
		"/api/superadmin/api-gateway/summary",
		handleSuperadminAPIGatewaySummary,
	)

	mux.HandleFunc(
		"/api/superadmin/api-gateway/keys",
		handleSuperadminAPIGatewayKeys,
	)

	mux.HandleFunc(
		"/api/superadmin/api-gateway/keys/revoke",
		handleSuperadminAPIGatewayKeyAction,
	)

	mux.HandleFunc(
		"/api/superadmin/api-gateway/keys/rotate",
		handleSuperadminAPIGatewayKeyAction,
	)
}
