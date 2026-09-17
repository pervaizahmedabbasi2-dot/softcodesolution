package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type superadminClientActionPayload struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func registerSuperadminHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/superadmin/clients", handleSuperadminClients)
	mux.HandleFunc("/api/superadmin/clients/update", handleSuperadminUpdateClient)
	mux.HandleFunc("/api/superadmin/clients/approve", handleSuperadminApproveClient)
	mux.HandleFunc("/api/superadmin/clients/reject", handleSuperadminRejectClient)

	// SCS_CLIENT_POPUP_BACKEND_ROUTES_START
	mux.HandleFunc("/api/superadmin/clients/suspend", handleSuperadminSuspendClient)
	mux.HandleFunc("/api/superadmin/clients/restore", handleSuperadminRestoreClient)
	mux.HandleFunc("/api/superadmin/clients/password/reset-link", handleSuperadminPasswordResetLink)
	mux.HandleFunc("/api/superadmin/clients/password/temp", handleSuperadminTemporaryPassword)
	mux.HandleFunc("/api/superadmin/clients/force-logout", handleSuperadminForceLogoutClient)
	mux.HandleFunc("/api/superadmin/clients/login/disable", handleSuperadminDisableClientLogin)
	mux.HandleFunc("/api/superadmin/clients/login/enable", handleSuperadminEnableClientLogin)
	mux.HandleFunc("/api/superadmin/clients/unlock", handleSuperadminUnlockClient)
	// SCS_CLIENT_POPUP_BACKEND_ROUTES_END
}

func handleSuperadminClients(w http.ResponseWriter, r *http.Request) {
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

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	status := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("status")))
	if status == "" {
		status = "pending"
	}

	limit := 50
	if limit < 1 {
		limit = 50
	}
	if limit > 50 {
		limit = 50
	}
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			limit = v
		}
	}
	if limit > 100 {
		limit = 100
	}

	offset := 0
	if raw := strings.TrimSpace(r.URL.Query().Get("offset")); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v >= 0 {
			offset = v
		}
	}

	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))

	where := []string{"1=1"}
	args := []interface{}{}

	switch status {
	case "pending", "pending_verification":
		where = append(where, "r.status IN ('pending_verification','pending')")
	case "approved":
		where = append(where, "r.status = 'approved'")
	case "rejected":
		where = append(where, "r.status = 'rejected'")
	case "all":
	default:
		writeAPIError(w, http.StatusBadRequest, "bad_status", "Invalid status")
		return
	}

	if search != "" {
		args = append(args, "%"+search+"%")
		p := fmt.Sprintf("$%d", len(args))
		where = append(where, fmt.Sprintf(`(
			lower(COALESCE(r.full_name,'')) LIKE %s OR
			lower(r.email::text) LIKE %s OR
			lower(COALESCE(r.company_name,'')) LIKE %s OR
			lower(COALESCE(r.business_type,'')) LIKE %s OR
			lower(COALESCE(r.country,'')) LIKE %s OR
			lower(COALESCE(r.city,'')) LIKE %s OR
			lower(COALESCE(r.phone,'')) LIKE %s
		)`, p, p, p, p, p, p, p))
	}

	countQuery := fmt.Sprintf(`
SELECT COUNT(*)
FROM public.client_business_register r
WHERE %s
`, strings.Join(where, " AND "))

	var total int
	if err := db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "superadmin_count_failed", err.Error(), r)
		writeAPIError(w, http.StatusInternalServerError, "count_failed", "Could not count clients")
		return
	}

	totals, err := countSuperadminClients(ctx, db, search)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "totals_failed", "Could not load totals")
		return
	}

	args = append(args, limit+1)
	limitP := fmt.Sprintf("$%d", len(args))
	args = append(args, offset)
	offsetP := fmt.Sprintf("$%d", len(args))

	query := fmt.Sprintf(`
SELECT
	r.id::text,
	COALESCE(r.full_name,''),
	r.email::text,
	COALESCE(r.country_code,''),
	COALESCE(r.phone,''),
	COALESCE(r.company_name,''),
	COALESCE(r.business_type,''),
	COALESCE(r.business_size,''),
	COALESCE(r.country,''),
	COALESCE(r.city,''),
	COALESCE(r.state,''),
	COALESCE(r.address,''),
	COALESCE(r.status,''),
	COALESCE(to_char(r.created_at, 'YYYY-MM-DD HH24:MI:SS'), ''),
	COALESCE(to_char(r.updated_at, 'YYYY-MM-DD HH24:MI:SS'), ''),
	COALESCE(u.tenant_id,''),
	COALESCE(u.role,''),
	COALESCE(u.status,'')
FROM public.client_business_register r
LEFT JOIN auth_users u ON lower(u.email) = lower(r.email::text)
WHERE %s
ORDER BY r.created_at DESC
LIMIT %s OFFSET %s
`, strings.Join(where, " AND "), limitP, offsetP)

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}
	defer rows.Close()

	clients := []map[string]interface{}{}

	for rows.Next() {
		var id, fullName, email, countryCode, phone, companyName, businessType, businessSize string
		var country, city, state, address, clientStatus, createdAt, updatedAt string
		var tenantID, authRole, authStatus string

		if err := rows.Scan(
			&id, &fullName, &email, &countryCode, &phone, &companyName,
			&businessType, &businessSize, &country, &city, &state, &address,
			&clientStatus, &createdAt, &updatedAt, &tenantID, &authRole, &authStatus,
		); err != nil {
			writeAPIError(w, http.StatusInternalServerError, "scan_failed", err.Error())
			return
		}

		planName := "Free"
		subStatus := "none"
		billingCycle := ""
		amount := 0.0
		enabledCount := 0
		if tenantID != "" {
			_ = db.QueryRowContext(ctx, `
SELECT COALESCE(p.name, 'Free'), COALESCE(ts.status, 'none'), COALESCE(ts.billing_cycle, ''), COALESCE(ts.amount, 0)::float8
FROM tenant_subscriptions ts
LEFT JOIN plans p ON p.id = ts.plan_id
WHERE ts.tenant_id = $1
ORDER BY ts.updated_at DESC
LIMIT 1`, tenantID).Scan(&planName, &subStatus, &billingCycle, &amount)

			_ = db.QueryRowContext(ctx, `
SELECT COUNT(*)
FROM tenant_modules
WHERE tenant_id = $1 AND enabled = true`, tenantID).Scan(&enabledCount)
		}

		clients = append(clients, map[string]interface{}{
			"id":                  id,
			"full_name":           fullName,
			"email":               email,
			"country_code":        countryCode,
			"phone":               phone,
			"company_name":        companyName,
			"business_type":       businessType,
			"business_size":       businessSize,
			"country":             country,
			"city":                city,
			"state":               state,
			"address":             address,
			"status":              clientStatus,
			"created_at":          createdAt,
			"updated_at":          updatedAt,
			"tenant_id":           tenantID,
			"auth_role":           authRole,
			"auth_status":         authStatus,
			"plan_name":           planName,
			"subscription_status": subStatus,
			"billing_cycle":       billingCycle,
			"amount":              amount,
			"license_status":      subStatus,
			"enabled_modules":     enabledCount,
		})
	}

	hasMore := false
	if len(clients) > limit {
		hasMore = true
		clients = clients[:limit]
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":       true,
		"clients":  clients,
		"count":    len(clients),
		"total":    total,
		"totals":   totals,
		"limit":    limit,
		"offset":   offset,
		"has_more": hasMore,
		"status":   status,
		"search":   search,
	})
}

func countSuperadminClients(ctx context.Context, db *sql.DB, search string) (map[string]int, error) {
	where := ""
	args := []interface{}{}

	if search != "" {
		args = append(args, "%"+search+"%")
		where = `
WHERE
	lower(COALESCE(full_name,'')) LIKE $1 OR
	lower(email::text) LIKE $1 OR
	lower(COALESCE(company_name,'')) LIKE $1 OR
	lower(COALESCE(business_type,'')) LIKE $1 OR
	lower(COALESCE(country,'')) LIKE $1 OR
	lower(COALESCE(city,'')) LIKE $1 OR
	lower(COALESCE(phone,'')) LIKE $1
`
	}

	var pending, approved, rejected, all int

	err := db.QueryRowContext(ctx, `
SELECT
	COUNT(*) FILTER (WHERE status IN ('pending_verification','pending')),
	COUNT(*) FILTER (WHERE status = 'approved'),
	COUNT(*) FILTER (WHERE status = 'rejected'),
	COUNT(*)
FROM public.client_business_register
`+where, args...).Scan(&pending, &approved, &rejected, &all)

	if err != nil {
		return nil, err
	}

	return map[string]int{
		"pending":  pending,
		"approved": approved,
		"rejected": rejected,
		"all":      all,
	}, nil
}

func handleSuperadminUpdateClient(w http.ResponseWriter, r *http.Request) {
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

	var raw map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON")
		return
	}

	id := strings.TrimSpace(fmt.Sprint(raw["id"]))
	if id == "" || id == "<nil>" {
		writeAPIError(w, http.StatusBadRequest, "missing_id", "Client id required")
		return
	}

	allowed := []string{"full_name", "country_code", "phone", "company_name", "business_type", "business_size", "country", "city", "state", "address"}
	setParts := []string{}
	args := []interface{}{}

	for _, f := range allowed {
		if v, ok := raw[f]; ok {
			args = append(args, strings.TrimSpace(fmt.Sprint(v)))
			setParts = append(setParts, fmt.Sprintf("%s = $%d", f, len(args)))
		}
	}

	if len(setParts) == 0 {
		writeAPIError(w, http.StatusBadRequest, "nothing_to_update", "Nothing to update")
		return
	}

	setParts = append(setParts, "updated_at = NOW()")
	args = append(args, id)
	idP := fmt.Sprintf("$%d", len(args))

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	q := fmt.Sprintf(`UPDATE public.client_business_register SET %s WHERE id::text = %s`, strings.Join(setParts, ", "), idP)

	res, err := db.ExecContext(ctx, q, args...)
	if err != nil {
		auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "client_update_failed", err.Error(), r)
		writeAPIError(w, http.StatusInternalServerError, "update_failed", err.Error())
		return
	}

	n, _ := res.RowsAffected()
	if n == 0 {
		writeAPIError(w, http.StatusNotFound, "not_found", "Client not found")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "message": "Client updated"})
}

func handleSuperadminApproveClient(w http.ResponseWriter, r *http.Request) {
	handleSuperadminStatusChange(w, r, "approved")
}

func handleSuperadminRejectClient(w http.ResponseWriter, r *http.Request) {
	handleSuperadminStatusChange(w, r, "rejected")
}

func handleSuperadminStatusChange(w http.ResponseWriter, r *http.Request, newStatus string) {
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

	var payload superadminClientActionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON")
		return
	}

	payload.ID = strings.TrimSpace(payload.ID)
	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))

	if payload.ID == "" && payload.Email == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_client", "Client id or email required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if newStatus == "approved" {
		result, err := approveClientRegistration(ctx, db, payload)
		if err != nil {
			auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "client_approve_failed", err.Error(), r)
			writeAPIError(w, http.StatusBadRequest, "approve_failed", err.Error())
			return
		}
		writeAPIJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "message": "Client approved", "client": result})
		return
	}

	res, err := db.ExecContext(ctx, `
UPDATE public.client_business_register
SET status = $3, updated_at = NOW()
WHERE ($1 <> '' AND id::text = $1)
   OR ($2 <> '' AND lower(email::text) = lower($2))
`, payload.ID, payload.Email, newStatus)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, newStatus+"_failed", err.Error())
		return
	}

	n, _ := res.RowsAffected()
	if n == 0 {
		writeAPIError(w, http.StatusNotFound, "not_found", "Client not found")
		return
	}

	if newStatus == "suspended" {
		_, _ = db.ExecContext(ctx, `
UPDATE auth_users
SET status = 'suspended', updated_at = NOW()
WHERE role = 'client_admin'
  AND lower(email) IN (
    SELECT lower(email::text)
    FROM public.client_business_register
    WHERE ($1 <> '' AND id::text = $1)
       OR ($2 <> '' AND lower(email::text) = lower($2))
  )
`, payload.ID, payload.Email)

		_, _ = db.ExecContext(ctx, `
UPDATE auth_sessions
SET revoked_at = NOW(), updated_at = NOW()
WHERE revoked_at IS NULL
  AND user_id IN (
    SELECT au.id
    FROM auth_users au
    JOIN public.client_business_register r ON lower(au.email) = lower(r.email::text)
    WHERE au.role = 'client_admin'
      AND (($1 <> '' AND r.id::text = $1)
       OR ($2 <> '' AND lower(r.email::text) = lower($2)))
  )
`, payload.ID, payload.Email)
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "message": "Client status updated", "status": newStatus})
}

// SCS_CLIENT_POPUP_BACKEND_STUBS_START
func handleSuperadminSuspendClient(w http.ResponseWriter, r *http.Request) {
	handleSuperadminStatusChange(w, r, "suspended")
}

func handleSuperadminRestoreClient(w http.ResponseWriter, r *http.Request) {
	handleSuperadminStatusChange(w, r, "approved")
}

func handleSuperadminPasswordResetLink(w http.ResponseWriter, r *http.Request) {
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

	var payload superadminClientActionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON")
		return
	}

	payload.ID = strings.TrimSpace(payload.ID)
	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	if payload.ID == "" && payload.Email == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_client", "Client id or email required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var userID, tenantID, clientEmail string
	err := db.QueryRowContext(ctx, `
SELECT au.id, COALESCE(au.tenant_id,''), lower(au.email)
FROM auth_users au
JOIN public.client_business_register r ON lower(au.email) = lower(r.email::text)
WHERE au.role = 'client_admin'
  AND (($1 <> '' AND r.id::text = $1)
   OR ($2 <> '' AND lower(r.email::text) = lower($2)))
LIMIT 1
`, payload.ID, payload.Email).Scan(&userID, &tenantID, &clientEmail)
	if err == sql.ErrNoRows {
		writeAPIError(w, http.StatusNotFound, "client_admin_not_found", "Client admin login not found. Approve client first.")
		return
	}
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "client_lookup_failed", err.Error())
		return
	}

	token, err := randomSessionToken()
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "token_failed", "Could not generate reset token")
		return
	}

	tokenHash, err := makePasswordHash(token)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "token_hash_failed", "Could not secure reset token")
		return
	}

	expiresAt := time.Now().Add(30 * time.Minute)

	_, err = db.ExecContext(ctx, `
INSERT INTO auth_password_reset_requests (
        id, user_id, tenant_id, email, token_hash, created_by, expires_at, used_at, created_at
)
VALUES ($1, $2, $3, lower($4), $5, $6, $7, NULL, NOW())
`, newUUID(), userID, tenantID, clientEmail, tokenHash, admin.ID, expiresAt)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "reset_request_failed", err.Error())
		return
	}

	auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "client_password_reset_link_created", clientEmail, r)
	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":         true,
		"message":    "Password reset request created. Email delivery next step me add hoga.",
		"email":      clientEmail,
		"expires_at": expiresAt.Format(time.RFC3339),
	})
}

func handleSuperadminTemporaryPassword(w http.ResponseWriter, r *http.Request) {
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

	var payload superadminClientActionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON")
		return
	}

	payload.ID = strings.TrimSpace(payload.ID)
	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	if payload.ID == "" && payload.Email == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_client", "Client id or email required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var clientEmail string
	err := db.QueryRowContext(ctx, `
SELECT lower(email::text)
FROM public.client_business_register
WHERE ($1 <> '' AND id::text = $1)
   OR ($2 <> '' AND lower(email::text) = lower($2))
LIMIT 1
`, payload.ID, payload.Email).Scan(&clientEmail)
	if err == sql.ErrNoRows {
		writeAPIError(w, http.StatusNotFound, "client_not_found", "Client not found")
		return
	}
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "client_lookup_failed", err.Error())
		return
	}

	tempPassword, err := makeSuperadminTempPassword()
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "temp_password_failed", "Could not generate temporary password")
		return
	}

	passwordHash, err := makePasswordHash(tempPassword)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "hash_failed", "Could not hash temporary password")
		return
	}

	res, err := db.ExecContext(ctx, `
UPDATE auth_users
SET password_hash = $1,
    status = 'active',
    failed_login_count = 0,
    locked_until = NULL,
    must_change_password = TRUE,
    updated_at = NOW()
WHERE role = 'client_admin'
  AND lower(email) = lower($2)
`, passwordHash, clientEmail)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "temp_password_update_failed", err.Error())
		return
	}

	n, _ := res.RowsAffected()
	if n == 0 {
		writeAPIError(w, http.StatusNotFound, "client_admin_not_found", "Client admin login not found. Approve client first.")
		return
	}

	auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "client_temp_password_generated", clientEmail, r)
	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":            true,
		"message":       "One-time temporary password generated. Client must change it on next login.",
		"email":         clientEmail,
		"temp_password": tempPassword,
	})
}

func handleSuperadminForceLogoutClient(w http.ResponseWriter, r *http.Request) {
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

	var payload superadminClientActionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON")
		return
	}

	payload.ID = strings.TrimSpace(payload.ID)
	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	if payload.ID == "" && payload.Email == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_client", "Client id or email required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	res, err := db.ExecContext(ctx, `
UPDATE auth_sessions
SET revoked_at = NOW(), updated_at = NOW()
WHERE revoked_at IS NULL
  AND user_id IN (
    SELECT au.id
    FROM auth_users au
    JOIN public.client_business_register r ON lower(au.email) = lower(r.email::text)
    WHERE au.role = 'client_admin'
      AND (($1 <> '' AND r.id::text = $1)
       OR ($2 <> '' AND lower(r.email::text) = lower($2)))
  )
`, payload.ID, payload.Email)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "force_logout_failed", err.Error())
		return
	}

	n, _ := res.RowsAffected()
	auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "client_force_logout", payload.Email, r)
	writeAPIJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "message": "Client sessions revoked", "sessions_revoked": n})
}

func handleSuperadminDisableClientLogin(w http.ResponseWriter, r *http.Request) {
	handleSuperadminClientLoginToggle(w, r, false)
}

func handleSuperadminEnableClientLogin(w http.ResponseWriter, r *http.Request) {
	handleSuperadminClientLoginToggle(w, r, true)
}

func handleSuperadminUnlockClient(w http.ResponseWriter, r *http.Request) {
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

	var payload superadminClientActionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON")
		return
	}

	payload.ID = strings.TrimSpace(payload.ID)
	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	if payload.ID == "" && payload.Email == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_client", "Client id or email required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	res, err := db.ExecContext(ctx, `
UPDATE auth_users
SET failed_login_count = 0,
    locked_until = NULL,
    updated_at = NOW()
WHERE role = 'client_admin'
  AND lower(email) IN (
    SELECT lower(email::text)
    FROM public.client_business_register
    WHERE ($1 <> '' AND id::text = $1)
       OR ($2 <> '' AND lower(email::text) = lower($2))
  )
`, payload.ID, payload.Email)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "unlock_failed", err.Error())
		return
	}

	n, _ := res.RowsAffected()
	if n == 0 {
		writeAPIError(w, http.StatusNotFound, "client_admin_not_found", "Client admin login not found. Approve client first.")
		return
	}

	auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, "client_unlock", payload.Email, r)
	writeAPIJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "message": "Client account unlocked"})
}

func handleSuperadminClientLoginToggle(w http.ResponseWriter, r *http.Request, enable bool) {
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

	var payload superadminClientActionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "bad_json", "Invalid JSON")
		return
	}

	payload.ID = strings.TrimSpace(payload.ID)
	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	if payload.ID == "" && payload.Email == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_client", "Client id or email required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	newStatus := "disabled"
	message := "Client login disabled"
	auditAction := "client_login_disabled"
	if enable {
		newStatus = "active"
		message = "Client login enabled"
		auditAction = "client_login_enabled"
	}

	res, err := db.ExecContext(ctx, `
UPDATE auth_users
SET status = $3,
    failed_login_count = CASE WHEN $3 = 'active' THEN 0 ELSE failed_login_count END,
    locked_until = CASE WHEN $3 = 'active' THEN NULL ELSE locked_until END,
    updated_at = NOW()
WHERE role = 'client_admin'
  AND lower(email) IN (
    SELECT lower(email::text)
    FROM public.client_business_register
    WHERE ($1 <> '' AND id::text = $1)
       OR ($2 <> '' AND lower(email::text) = lower($2))
  )
`, payload.ID, payload.Email, newStatus)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "login_toggle_failed", err.Error())
		return
	}

	n, _ := res.RowsAffected()
	if n == 0 {
		writeAPIError(w, http.StatusNotFound, "client_admin_not_found", "Client admin login not found. Approve client first.")
		return
	}

	if !enable {
		_, _ = db.ExecContext(ctx, `
UPDATE auth_sessions
SET revoked_at = NOW(), updated_at = NOW()
WHERE revoked_at IS NULL
  AND user_id IN (
    SELECT au.id
    FROM auth_users au
    JOIN public.client_business_register r ON lower(au.email) = lower(r.email::text)
    WHERE au.role = 'client_admin'
      AND (($1 <> '' AND r.id::text = $1)
       OR ($2 <> '' AND lower(r.email::text) = lower($2)))
  )
`, payload.ID, payload.Email)
	}

	auditAuthEvent(ctx, db, admin.ID, nullStringValue(admin.TenantID), admin.Email, auditAction, payload.Email, r)
	writeAPIJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "message": message, "auth_status": newStatus})
}

func makeSuperadminTempPassword() (string, error) {
	token, err := randomSessionToken()
	if err != nil {
		return "", err
	}

	clean := strings.NewReplacer("-", "", "_", "").Replace(token)
	if len(clean) > 18 {
		clean = clean[:18]
	}
	if len(clean) < 12 {
		clean = clean + "SCSTEMP2026"
	}

	return "SCS-" + clean, nil
}

func handleSuperadminClientPopupBackendStub(w http.ResponseWriter, r *http.Request, action string) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	writeAPIError(w, http.StatusNotImplemented, "not_implemented", "Backend action pending: "+action)
}

// SCS_CLIENT_POPUP_BACKEND_STUBS_END

func requireSuperadmin(ctx context.Context, w http.ResponseWriter, r *http.Request) (*sql.DB, authUser, bool) {
	db, err := openRegisterDB(ctx)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "db_failed", "Database connection failed")
		return nil, authUser{}, false
	}

	if err := ensureAuthSchemaAndSeed(ctx, db); err != nil {
		_ = db.Close()
		writeAPIError(w, http.StatusInternalServerError, "auth_schema_failed", err.Error())
		return nil, authUser{}, false
	}

	if err := ensureSuperadminClientManagementSchema(ctx, db); err != nil {
		_ = db.Close()
		writeAPIError(w, http.StatusInternalServerError, "superadmin_schema_failed", err.Error())
		return nil, authUser{}, false
	}

	user, err := userFromRequestSession(ctx, db, r)
	if err != nil {
		_ = db.Close()
		writeAPIError(w, http.StatusUnauthorized, "not_authenticated", "Not authenticated")
		return nil, authUser{}, false
	}

	if user.Role != "super_admin" {
		_ = db.Close()
		writeAPIError(w, http.StatusForbidden, "forbidden", "Superadmin only")
		return nil, authUser{}, false
	}

	return db, user, true
}

func ensureSuperadminClientManagementSchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
ALTER TABLE public.client_business_register
	ADD COLUMN IF NOT EXISTS country_code TEXT,
	ADD COLUMN IF NOT EXISTS phone TEXT,
	ADD COLUMN IF NOT EXISTS business_size TEXT,
	ADD COLUMN IF NOT EXISTS state TEXT,
	ADD COLUMN IF NOT EXISTS address TEXT,
	ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.client_business_register
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_register_status_created
ON public.client_business_register(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_register_email_lower
ON public.client_business_register(lower(email::text));

ALTER TABLE auth_users
        ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE auth_users
SET updated_at = NOW()
WHERE updated_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_password_reset_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        tenant_id TEXT,
        email TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        created_by TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_password_reset_email_created
ON auth_password_reset_requests(lower(email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_password_reset_expires
ON auth_password_reset_requests(expires_at);
`)
	return err
}

func approveClientRegistration(ctx context.Context, db *sql.DB, payload superadminClientActionPayload) (map[string]interface{}, error) {
	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var id, fullName, email, companyName, passwordHash, oldStatus string

	err = tx.QueryRowContext(ctx, `
SELECT id::text, COALESCE(full_name,''), email::text, COALESCE(company_name,''), password_hash, COALESCE(status,'')
FROM public.client_business_register
WHERE ($1 <> '' AND id::text = $1)
   OR ($2 <> '' AND lower(email::text) = lower($2))
LIMIT 1
`, payload.ID, payload.Email).Scan(&id, &fullName, &email, &companyName, &passwordHash, &oldStatus)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("client not found")
	}
	if err != nil {
		return nil, err
	}

	if !strings.HasPrefix(passwordHash, "$argon2id$") {
		return nil, fmt.Errorf("client password hash is not Argon2id")
	}

	tenantID := "tenant_" + strings.ReplaceAll(id, "-", "")

	_, err = tx.ExecContext(ctx, `
INSERT INTO auth_users (id, tenant_id, email, password_hash, role, status, failed_login_count)
VALUES ($1, $2, lower($3), $4, 'client_admin', 'active', 0)
ON CONFLICT (email) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id,
	password_hash = EXCLUDED.password_hash,
	role = 'client_admin',
	status = 'active',
	failed_login_count = 0,
	locked_until = NULL,
	updated_at = NOW()
`, newUUID(), tenantID, email, passwordHash)
	if err != nil {
		return nil, err
	}

	_, err = tx.ExecContext(ctx, `
UPDATE public.client_business_register
SET status = 'approved', updated_at = NOW()
WHERE id::text = $1
`, id)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":           id,
		"tenant_id":    tenantID,
		"full_name":    fullName,
		"email":        email,
		"company_name": companyName,
		"old_status":   oldStatus,
		"new_status":   "approved",
		"new_role":     "client_admin",
	}, nil
}
