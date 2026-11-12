package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net"
	"net/http"
	"strings"
)

type gatewaySecurityPolicy struct {
	TenantID       string   `json:"tenant_id"`
	Enabled        bool     `json:"enabled"`
	AllowedIPs     []string `json:"allowed_ips"`
	AllowedOrigins []string `json:"allowed_origins"`
	RequireOrigin  bool     `json:"require_origin"`
	MaxBodyBytes   int64    `json:"max_body_bytes"`
}

type gatewaySecurityPolicyPayload struct {
	Enabled        *bool    `json:"enabled"`
	AllowedIPs     []string `json:"allowed_ips"`
	AllowedOrigins []string `json:"allowed_origins"`
	RequireOrigin  *bool    `json:"require_origin"`
	MaxBodyBytes   *int64   `json:"max_body_bytes"`
}

func gatewayDefaultSecurityPolicy(tenantID string) gatewaySecurityPolicy {
	return gatewaySecurityPolicy{
		TenantID:       tenantID,
		Enabled:        true,
		AllowedIPs:     []string{},
		AllowedOrigins: []string{},
		RequireOrigin:  false,
		MaxBodyBytes:   2 * 1024 * 1024,
	}
}

func gatewayEnsureSecurityPolicySchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS api_gateway_security_policies (
			tenant_id TEXT PRIMARY KEY,
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			allowed_ips JSONB NOT NULL DEFAULT '[]'::jsonb,
			allowed_origins JSONB NOT NULL DEFAULT '[]'::jsonb,
			require_origin BOOLEAN NOT NULL DEFAULT FALSE,
			max_body_bytes BIGINT NOT NULL DEFAULT 2097152,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_by TEXT
		);
	`)
	return err
}

func gatewayLoadSecurityPolicy(ctx context.Context, db *sql.DB, tenantID string) (gatewaySecurityPolicy, error) {
	policy := gatewayDefaultSecurityPolicy(tenantID)

	if err := gatewayEnsureSecurityPolicySchema(ctx, db); err != nil {
		return policy, err
	}

	var ipsJSON []byte
	var originsJSON []byte

	err := db.QueryRowContext(ctx, `
		SELECT enabled, allowed_ips, allowed_origins, require_origin, max_body_bytes
		FROM api_gateway_security_policies
		WHERE tenant_id = $1
	`, tenantID).Scan(
		&policy.Enabled,
		&ipsJSON,
		&originsJSON,
		&policy.RequireOrigin,
		&policy.MaxBodyBytes,
	)

	if err == sql.ErrNoRows {
		return policy, nil
	}

	if err != nil {
		return policy, err
	}

	if err := json.Unmarshal(ipsJSON, &policy.AllowedIPs); err != nil {
		return policy, err
	}

	if err := json.Unmarshal(originsJSON, &policy.AllowedOrigins); err != nil {
		return policy, err
	}

	if policy.MaxBodyBytes < 1024 {
		return policy, sql.ErrNoRows
	}

	return policy, nil
}

func gatewayClientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return host
	}

	return strings.TrimSpace(r.RemoteAddr)
}

func gatewayIPAllowed(ip string, allowed []string) bool {
	if len(allowed) == 0 {
		return true
	}

	client := net.ParseIP(ip)
	if client == nil {
		return false
	}

	for _, entry := range allowed {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}

		if parsed := net.ParseIP(entry); parsed != nil {
			if parsed.Equal(client) {
				return true
			}
			continue
		}

		_, network, err := net.ParseCIDR(entry)
		if err == nil && network.Contains(client) {
			return true
		}
	}

	return false
}

func gatewayOriginAllowed(origin string, allowed []string) bool {
	if len(allowed) == 0 {
		return true
	}

	origin = strings.TrimSpace(origin)
	if origin == "" {
		return false
	}

	for _, item := range allowed {
		if strings.EqualFold(strings.TrimSpace(item), origin) {
			return true
		}
	}

	return false
}

func gatewayApplySecurityHeaders(w http.ResponseWriter) {
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Cache-Control", "no-store")
}

func gatewayEnforceSecurityPolicy(ctx context.Context, db *sql.DB, r *http.Request, tenantID string) (gatewaySecurityPolicy, int, string) {
	policy, err := gatewayLoadSecurityPolicy(ctx, db, tenantID)
	if err != nil {
		return policy, http.StatusInternalServerError, "Security policy unavailable"
	}

	if !policy.Enabled {
		return policy, http.StatusForbidden, "Security policy disabled access"
	}

	if !gatewayIPAllowed(gatewayClientIP(r), policy.AllowedIPs) {
		return policy, http.StatusForbidden, "Client IP is not allowed"
	}

	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if policy.RequireOrigin && origin == "" {
		return policy, http.StatusForbidden, "Origin is required"
	}

	if origin != "" && !gatewayOriginAllowed(origin, policy.AllowedOrigins) {
		return policy, http.StatusForbidden, "Origin is not allowed"
	}

	if r.ContentLength > policy.MaxBodyBytes {
		return policy, http.StatusRequestEntityTooLarge, "Request body exceeds security policy limit"
	}

	return policy, 0, ""
}

func handleGatewaySecurityPolicy(w http.ResponseWriter, r *http.Request) {
	db, admin, ok := requireSuperadmin(r.Context(), w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := gatewayEnsureSecurityPolicySchema(r.Context(), db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "security_policy_schema_failed", "Security policy storage unavailable")
		return
	}

	tenantID := strings.TrimSpace(admin.TenantID.String)
	if tenantID == "" {
		tenantID = "platform"
	}

	switch r.Method {
	case http.MethodGet:
		policy, err := gatewayLoadSecurityPolicy(r.Context(), db, tenantID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "security_policy_load_failed", "Could not load security policy")
			return
		}

		gatewayApplySecurityHeaders(w)
		writeAPIJSON(w, http.StatusOK, map[string]interface{}{
			"ok":         true,
			"request_id": requestIDFrom(r),
			"policy":     policy,
		})
		return

	case http.MethodPut:
		var payload gatewaySecurityPolicyPayload

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid security policy payload")
			return
		}

		current, err := gatewayLoadSecurityPolicy(r.Context(), db, tenantID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "security_policy_load_failed", "Could not load current security policy")
			return
		}

		if payload.Enabled != nil {
			current.Enabled = *payload.Enabled
		}

		if payload.RequireOrigin != nil {
			current.RequireOrigin = *payload.RequireOrigin
		}

		if payload.AllowedIPs != nil {
			for _, entry := range payload.AllowedIPs {
				entry = strings.TrimSpace(entry)
				if entry == "" {
					continue
				}
				if net.ParseIP(entry) == nil {
					if _, _, err := net.ParseCIDR(entry); err != nil {
						writeAPIError(w, http.StatusBadRequest, "invalid_ip_rule", "Invalid IP or CIDR rule")
						return
					}
				}
			}
			current.AllowedIPs = payload.AllowedIPs
		}

		if payload.AllowedOrigins != nil {
			clean := make([]string, 0, len(payload.AllowedOrigins))
			for _, origin := range payload.AllowedOrigins {
				origin = strings.TrimSpace(origin)
				if origin != "" {
					clean = append(clean, origin)
				}
			}
			current.AllowedOrigins = clean
		}

		if payload.MaxBodyBytes != nil {
			if *payload.MaxBodyBytes < 1024 || *payload.MaxBodyBytes > 50*1024*1024 {
				writeAPIError(w, http.StatusBadRequest, "invalid_body_limit", "max_body_bytes must be between 1024 and 52428800")
				return
			}
			current.MaxBodyBytes = *payload.MaxBodyBytes
		}

		ipsJSON, err := json.Marshal(current.AllowedIPs)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "policy_encode_failed", "Could not encode IP rules")
			return
		}

		originsJSON, err := json.Marshal(current.AllowedOrigins)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "policy_encode_failed", "Could not encode origin rules")
			return
		}

		_, err = db.ExecContext(r.Context(), `
			INSERT INTO api_gateway_security_policies (
				tenant_id, enabled, allowed_ips, allowed_origins, require_origin, max_body_bytes, created_at, updated_at, updated_by
			)
			VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, NOW(), NOW(), $7)
			ON CONFLICT (tenant_id) DO UPDATE SET
				enabled = EXCLUDED.enabled,
				allowed_ips = EXCLUDED.allowed_ips,
				allowed_origins = EXCLUDED.allowed_origins,
				require_origin = EXCLUDED.require_origin,
				max_body_bytes = EXCLUDED.max_body_bytes,
				updated_at = NOW(),
				updated_by = EXCLUDED.updated_by
		`, tenantID, current.Enabled, string(ipsJSON), string(originsJSON), current.RequireOrigin, current.MaxBodyBytes, admin.ID)

		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "security_policy_save_failed", "Could not save security policy")
			return
		}

		auditAuthEvent(
			r.Context(),
			db,
			admin.ID,
			nullStringValue(admin.TenantID),
			admin.Email,
			"security_policy_updated",
			"tenant="+tenantID,
			r,
		)

		gatewayApplySecurityHeaders(w)
		writeAPIJSON(w, http.StatusOK, map[string]interface{}{
			"ok":         true,
			"request_id": requestIDFrom(r),
			"policy":     current,
		})
		return

	default:
		writeAPIError(w, http.StatusMethodNotAllowed, "method_not_allowed", "GET or PUT required")
	}
}

func registerAPIGatewaySecurityPolicyRoutes(mux *http.ServeMux) {
	mux.HandleFunc(
		"/api/superadmin/api-gateway/security-policy",
		handleGatewaySecurityPolicy,
	)
}
