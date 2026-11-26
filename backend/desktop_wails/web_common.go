package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"net/http"
	"os"
	"strings"
)

func phase3CORSHeaders(w http.ResponseWriter) {
	origin := os.Getenv("SCS_ALLOWED_ORIGIN")
	if origin == "" {
		origin = "*"
	}
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Request-ID, Idempotency-Key, X-Tenant-Id, X-User-Role, X-User-Name, X-Branch-Id, X-Wing-Id, X-Wing-Scope-Locked",
	)
}

func phase3Begin(w http.ResponseWriter, r *http.Request) bool {
	requestID := requestIDFrom(r)
	secureHeaders(w, requestID)
	phase3CORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return true
	}
	return false
}

func writePhase3Error(w http.ResponseWriter, status int, errCode string, message string) {
	payload := map[string]interface{}{
		"ok":      false,
		"message": message,
	}
	if errCode != "" {
		payload["error"] = errCode
	}
	writeAPIJSON(w, status, payload)
}

func resolveTenantIDFromReq(r *http.Request, bodyTenantID string) string {
	candidates := []string{
		r.Header.Get("X-Tenant-Id"),
		r.URL.Query().Get("tenantId"),
		bodyTenantID,
	}
	for _, c := range candidates {
		trimmed := strings.TrimSpace(c)
		if trimmed != "" {
			return trimmed
		}
	}
	return "tenant-root-platform"
}

func resolveRoleFromReq(r *http.Request, bodyRole string, defaultRole string) string {
	candidates := []string{
		r.Header.Get("X-User-Role"),
		r.URL.Query().Get("role"),
		bodyRole,
	}
	for _, c := range candidates {
		trimmed := strings.ToLower(strings.TrimSpace(c))
		if trimmed != "" {
			return trimmed
		}
	}
	return defaultRole
}

func maskSecretTail(s string) string {
	if s == "" {
		return ""
	}
	if len(s) > 4 {
		return "••••" + s[len(s)-4:]
	}
	return "••••"
}

func randomHexToken(numBytes int) string {
	if numBytes <= 0 {
		numBytes = 4
	}
	b := make([]byte, numBytes)
	if _, err := rand.Read(b); err != nil {
		return "00000000"
	}
	return hex.EncodeToString(b)
}

func nullStrVal(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

func nullFloatVal(nf sql.NullFloat64, fallback float64) float64 {
	if nf.Valid {
		return nf.Float64
	}
	return fallback
}

func nullIntVal(ni sql.NullInt64, fallback int64) int64 {
	if ni.Valid {
		return ni.Int64
	}
	return fallback
}
