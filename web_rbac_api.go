package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"
)

type rbacActionKey string

const (
	rbacActionView    rbacActionKey = "view"
	rbacActionCreate  rbacActionKey = "create"
	rbacActionEdit    rbacActionKey = "edit"
	rbacActionDelete  rbacActionKey = "delete"
	rbacActionApprove rbacActionKey = "approve"
	rbacActionExport  rbacActionKey = "export"
	rbacActionManage  rbacActionKey = "manage"
)

var rbacActionKeys = []rbacActionKey{
	rbacActionView,
	rbacActionCreate,
	rbacActionEdit,
	rbacActionDelete,
	rbacActionApprove,
	rbacActionExport,
	rbacActionManage,
}

type rbacModule struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Group       string `json:"group"`
	Description string `json:"description"`
}

type rbacRoleRow struct {
	ID              string                     `json:"id"`
	Name            string                     `json:"name"`
	Description     string                     `json:"description"`
	IsSystem        bool                       `json:"is_system"`
	Status          string                     `json:"status"`
	Scope           string                     `json:"scope"`
	InheritsFrom    string                     `json:"inherits_from"`
	CreatedBy       string                     `json:"created_by"`
	UpdatedBy       string                     `json:"updated_by"`
	CreatedAt       string                     `json:"created_at"`
	UpdatedAt       string                     `json:"updated_at"`
	UsersCount      int                        `json:"users_count"`
	PermissionCount int                        `json:"permission_count"`
	Permissions     map[string]map[string]bool `json:"permissions,omitempty"`
}

type rbacAuditRow struct {
	ID          int64  `json:"id"`
	ActorUserID string `json:"actor_user_id"`
	RoleID      string `json:"role_id"`
	TenantID    string `json:"tenant_id"`
	Action      string `json:"action"`
	Detail      string `json:"detail"`
	IPAddress   string `json:"ip_address"`
	UserAgent   string `json:"user_agent"`
	CreatedAt   string `json:"created_at"`
}

type rbacRoleSavePayload struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Status       string `json:"status"`
	Scope        string `json:"scope"`
	InheritsFrom string `json:"inherits_from"`
	IsSystem     bool   `json:"is_system"`
}

type rbacRoleTogglePayload struct {
	RoleID string `json:"role_id"`
}

type rbacRoleDeletePayload struct {
	RoleID string `json:"role_id"`
}

type rbacPermissionSavePayload struct {
	RoleID      string                     `json:"role_id"`
	ModuleCode  string                     `json:"module_code"`
	ActionKey   string                     `json:"action_key"`
	Enabled     *bool                      `json:"enabled"`
	Permissions map[string]map[string]bool `json:"permissions"`
}

type rbacUserAssignPayload struct {
	UserID string `json:"user_id"`
	RoleID string `json:"role_id"`
	Scope  string `json:"scope"`
}

type rbacUserRemovePayload struct {
	UserID string `json:"user_id"`
	RoleID string `json:"role_id"`
}

func registerRbacHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/superadmin/rbac/roles", handleRbacRolesList)
	mux.HandleFunc("/api/superadmin/rbac/roles/save", handleRbacRoleSave)
	mux.HandleFunc("/api/superadmin/rbac/roles/toggle", handleRbacRoleToggle)
	mux.HandleFunc("/api/superadmin/rbac/roles/delete", handleRbacRoleDelete)

	mux.HandleFunc("/api/superadmin/rbac/modules", handleRbacModules)
	mux.HandleFunc("/api/superadmin/rbac/permissions", handleRbacPermissionsGet)
	mux.HandleFunc("/api/superadmin/rbac/permissions/save", handleRbacPermissionsSave)

	mux.HandleFunc("/api/superadmin/rbac/users", handleRbacUsers)
	mux.HandleFunc("/api/superadmin/rbac/users/assign", handleRbacUserAssign)
	mux.HandleFunc("/api/superadmin/rbac/users/remove", handleRbacUserRemove)

	mux.HandleFunc("/api/superadmin/rbac/audit", handleRbacAudit)
}

func ensureRbacSchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS rbac_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  scope TEXT NOT NULL DEFAULT 'tenant',
  inherits_from TEXT REFERENCES rbac_roles(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rbac_role_permissions (
  role_id TEXT NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  action_key TEXT NOT NULL
    CHECK (action_key IN ('view','create','edit','delete','approve','export','manage')),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, module_code, action_key)
);

CREATE TABLE IF NOT EXISTS rbac_user_roles (
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS rbac_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id TEXT REFERENCES auth_users(id) ON DELETE SET NULL,
  role_id TEXT REFERENCES rbac_roles(id) ON DELETE SET NULL,
  tenant_id TEXT,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rbac_roles_status ON rbac_roles(status, is_system, name);
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_role ON rbac_role_permissions(role_id, module_code);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_user ON rbac_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_created ON rbac_audit_logs(created_at DESC);
`)
	return err
}

func rbacDefaultModules() []rbacModule {
	return []rbacModule{
		{Code: "dashboard", Name: "Dashboard", Group: "Core", Description: "Main overview and KPI panels"},
		{Code: "users", Name: "Users", Group: "Core", Description: "User management and identity access"},
		{Code: "roles_permissions", Name: "Roles & Permissions", Group: "Governance", Description: "Role lifecycle and access policy control"},
		{Code: "audit_logs", Name: "Audit Logs", Group: "Governance", Description: "Track security and administrative actions"},
		{Code: "all_clients", Name: "All Clients", Group: "Clients", Description: "Approve, suspend, edit and review clients"},
		{Code: "tenants", Name: "Tenants", Group: "Clients", Description: "Multi-company tenant operations"},
		{Code: "payments", Name: "Payments", Group: "Billing", Description: "Invoices, receipts and payment control"},
		{Code: "plans_pricing", Name: "Plans & Pricing", Group: "Billing", Description: "Billing tiers and pricing rules"},
		{Code: "license", Name: "License", Group: "Billing", Description: "Device and license controls"},
		{Code: "saas_control", Name: "SaaS Control", Group: "Platform", Description: "Command centre for subscriptions and access"},
		{Code: "business_suites", Name: "Business Suites", Group: "Platform", Description: "Business-specific package management"},
		{Code: "module_catalog", Name: "Module Catalog", Group: "Platform", Description: "Global module and price catalog"},
		{Code: "analytics", Name: "Analytics", Group: "Intelligence", Description: "Reports, trends and usage visibility"},
		{Code: "system_health", Name: "System Health", Group: "Operations", Description: "Database, API and worker status"},
		{Code: "frontend", Name: "Frontend / Marketplace", Group: "Content", Description: "Public pages and marketplace surface"},
		{Code: "blogs", Name: "Blogs", Group: "Content", Description: "Content publishing and editorial control"},
		{Code: "settings", Name: "Settings", Group: "Security", Description: "Global and tenant configuration"},
		{Code: "api_gateway", Name: "API Gateway", Group: "Security", Description: "Endpoint security and API controls"},
		{Code: "updater", Name: "Updater", Group: "Operations", Description: "Versioning, rollouts and update controls"},
	}
}

func rbacSystemRoleMap() map[string]string {
	return map[string]string{
		"role_super_admin":  "super_admin",
		"role_client_admin": "client_admin",
		"role_client_user":  "client_user",
		"role_support":      "support",
	}
}

func seedDefaultRbacData(ctx context.Context, db *sql.DB) error {
	if err := ensureRbacSchema(ctx, db); err != nil {
		return err
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	systemRoles := []rbacRoleRow{
		{
			ID:           "role_super_admin",
			Name:         "Super Admin",
			Description:  "Unrestricted platform access across every module and tenant.",
			IsSystem:     true,
			Status:       "active",
			Scope:        "Platform",
			InheritsFrom: "",
			CreatedBy:    "System",
			UpdatedBy:    "System",
		},
		{
			ID:           "role_client_admin",
			Name:         "Client Admin",
			Description:  "Tenant-level administration with billing, clients and module control.",
			IsSystem:     true,
			Status:       "active",
			Scope:        "Tenant",
			InheritsFrom: "",
			CreatedBy:    "System",
			UpdatedBy:    "System",
		},
		{
			ID:           "role_client_user",
			Name:         "Client User",
			Description:  "Restricted operational access for day-to-day business work.",
			IsSystem:     true,
			Status:       "active",
			Scope:        "Branch",
			InheritsFrom: "",
			CreatedBy:    "System",
			UpdatedBy:    "System",
		},
		{
			ID:           "role_support",
			Name:         "Support",
			Description:  "Support desk access to inspect health, logs and client state.",
			IsSystem:     true,
			Status:       "active",
			Scope:        "Platform",
			InheritsFrom: "",
			CreatedBy:    "System",
			UpdatedBy:    "System",
		},
	}

	for _, role := range systemRoles {
		_, err := tx.ExecContext(ctx, `
INSERT INTO rbac_roles (id, name, description, is_system, status, scope, inherits_from, created_by, updated_by, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  status = EXCLUDED.status,
  scope = EXCLUDED.scope,
  inherits_from = EXCLUDED.inherits_from,
  updated_by = EXCLUDED.updated_by,
  updated_at = now()
`, role.ID, role.Name, role.Description, role.IsSystem, role.Status, role.Scope, nilString(role.InheritsFrom), role.CreatedBy, role.UpdatedBy)
		if err != nil {
			return err
		}
	}

	modules := rbacDefaultModules()
	for _, role := range systemRoles {
		if err := seedRbacRolePermissions(ctx, tx, role.ID, role.ID, modules); err != nil {
			return err
		}
	}

	_, err = tx.ExecContext(ctx, `
INSERT INTO rbac_user_roles (user_id, role_id, scope)
SELECT au.id,
  CASE au.role
    WHEN 'super_admin' THEN 'role_super_admin'
    WHEN 'client_admin' THEN 'role_client_admin'
    WHEN 'client_user' THEN 'role_client_user'
    WHEN 'support' THEN 'role_support'
    ELSE NULL
  END,
  'tenant'
FROM auth_users au
WHERE au.role IN ('super_admin','client_admin','client_user','support')
  AND (
    CASE au.role
      WHEN 'super_admin' THEN 'role_super_admin'
      WHEN 'client_admin' THEN 'role_client_admin'
      WHEN 'client_user' THEN 'role_client_user'
      WHEN 'support' THEN 'role_support'
      ELSE NULL
    END
  ) IS NOT NULL
ON CONFLICT (user_id, role_id) DO NOTHING;
`)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func seedRbacRolePermissions(ctx context.Context, q execContext, roleID string, preset string, modules []rbacModule) error {
	if roleID == "" {
		return errors.New("role id is required")
	}

	_, err := q.ExecContext(ctx, `DELETE FROM rbac_role_permissions WHERE role_id=$1`, roleID)
	if err != nil {
		return err
	}

	allowAll := preset == "role_super_admin"
	clientAdmin := preset == "role_client_admin"
	clientUser := preset == "role_client_user"
	support := preset == "role_support"

	for _, module := range modules {
		enabled := map[rbacActionKey]bool{}

		switch {
		case allowAll:
			enabled[rbacActionView] = true
			enabled[rbacActionCreate] = true
			enabled[rbacActionEdit] = true
			enabled[rbacActionDelete] = true
			enabled[rbacActionApprove] = true
			enabled[rbacActionExport] = true
			enabled[rbacActionManage] = true

		case clientAdmin:
			switch module.Code {
			case "dashboard", "users", "all_clients", "tenants", "payments", "plans_pricing", "license", "saas_control", "business_suites", "module_catalog", "settings":
				enabled[rbacActionView] = true
				enabled[rbacActionCreate] = true
				enabled[rbacActionEdit] = true
				enabled[rbacActionApprove] = true
				enabled[rbacActionExport] = true
				enabled[rbacActionManage] = true
			case "analytics", "audit_logs", "system_health":
				enabled[rbacActionView] = true
				enabled[rbacActionExport] = true
			default:
				enabled[rbacActionView] = true
				enabled[rbacActionCreate] = true
				enabled[rbacActionEdit] = true
				enabled[rbacActionManage] = true
			}

		case clientUser:
			switch module.Code {
			case "dashboard", "all_clients", "analytics", "system_health", "frontend", "blogs":
				enabled[rbacActionView] = true
				enabled[rbacActionExport] = true
			default:
				enabled[rbacActionView] = true
			}

		case support:
			switch module.Code {
			case "dashboard", "all_clients", "analytics", "audit_logs", "system_health":
				enabled[rbacActionView] = true
				enabled[rbacActionExport] = true
			case "users", "settings":
				enabled[rbacActionView] = true
				enabled[rbacActionEdit] = true
			default:
				enabled[rbacActionView] = false
			}
		}

		for _, action := range rbacActionKeys {
			_, err := q.ExecContext(ctx, `
INSERT INTO rbac_role_permissions (role_id, module_code, action_key, enabled, updated_at)
VALUES ($1,$2,$3,$4,now())
ON CONFLICT (role_id, module_code, action_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  updated_at = now()
`, roleID, module.Code, string(action), enabled[action])
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func handleRbacRolesList(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := seedDefaultRbacData(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "rbac_seed_failed", err.Error())
		return
	}

	roles, err := loadRbacRoles(ctx, db)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "rbac_roles_failed", "Could not load roles")
		return
	}

	_ = admin

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"roles":      roles,
		"request_id": requestID,
	})
}

func handleRbacRoleSave(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	if err := seedDefaultRbacData(ctx, db); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "rbac_seed_failed", err.Error())
		return
	}

	var payload rbacRoleSavePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid role payload")
		return
	}

	payload.ID = strings.TrimSpace(payload.ID)
	payload.Name = strings.TrimSpace(payload.Name)
	payload.Description = strings.TrimSpace(payload.Description)
	payload.Scope = normalizeRBACScope(payload.Scope)
	payload.Status = normalizeRBACStatus(payload.Status)
	payload.InheritsFrom = strings.TrimSpace(payload.InheritsFrom)

	if payload.Name == "" {
		writeAPIError(w, http.StatusBadRequest, "name_required", "Role name is required")
		return
	}
	if payload.ID == "" {
		payload.ID = slugifyRBAC(payload.Name)
		if payload.ID == "" {
			payload.ID = "role_" + strings.ReplaceAll(strings.ToLower(payload.Name), " ", "_")
		}
	}
	if payload.Scope == "" {
		payload.Scope = "tenant"
	}

	existing, err := loadRbacRoleByID(ctx, db, payload.ID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		writeAPIError(w, http.StatusInternalServerError, "role_load_failed", err.Error())
		return
	}
	if existing != nil && existing.IsSystem {
		writeAPIError(w, http.StatusForbidden, "system_role_locked", "System role cannot be modified here")
		return
	}

	inheritsFrom := sql.NullString{}
	if payload.InheritsFrom != "" {
		inheritsFrom = sql.NullString{String: payload.InheritsFrom, Valid: true}
	}

	_, err = db.ExecContext(ctx, `
INSERT INTO rbac_roles (
  id, name, description, is_system, status, scope, inherits_from, created_by, updated_by, updated_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  status = EXCLUDED.status,
  scope = EXCLUDED.scope,
  inherits_from = EXCLUDED.inherits_from,
  updated_by = EXCLUDED.updated_by,
  updated_at = now()
`, payload.ID, payload.Name, payload.Description, payload.IsSystem, payload.Status, payload.Scope, inheritsFrom, safeUserName(admin), safeUserName(admin))
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "role_save_failed", err.Error())
		return
	}

	if err := insertRbacAudit(ctx, db, safeUserID(admin), "", "", "role_saved", fmt.Sprintf("%s saved", payload.Name), requestIDFrom(r), r.UserAgent(), adminTenantID(admin)); err != nil {
		log.Printf("[WARN] rbac audit save failed: %v", err)
	}

	role, _ := loadRbacRoleByID(ctx, db, payload.ID)
	if role == nil {
		writeAPIError(w, http.StatusInternalServerError, "role_reload_failed", "Role saved but reload failed")
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"message":    "Role saved",
		"role":       role,
		"request_id": requestID,
	})
}

func handleRbacRoleToggle(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload rbacRoleTogglePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid payload")
		return
	}
	payload.RoleID = strings.TrimSpace(payload.RoleID)
	if payload.RoleID == "" {
		writeAPIError(w, http.StatusBadRequest, "role_id_required", "Role id is required")
		return
	}

	role, err := loadRbacRoleByID(ctx, db, payload.RoleID)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "role_not_found", "Role not found")
		return
	}
	if role.IsSystem {
		writeAPIError(w, http.StatusForbidden, "system_role_locked", "System role cannot be disabled here")
		return
	}

	nextStatus := "disabled"
	if role.Status == "disabled" {
		nextStatus = "active"
	}

	_, err = db.ExecContext(ctx, `
UPDATE rbac_roles
SET status=$2, updated_by=$3, updated_at=now()
WHERE id=$1
`, payload.RoleID, nextStatus, safeUserName(admin))
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "role_toggle_failed", err.Error())
		return
	}

	_ = insertRbacAudit(ctx, db, safeUserID(admin), payload.RoleID, "", "role_toggled", fmt.Sprintf("%s -> %s", role.Name, nextStatus), requestID, r.UserAgent(), adminTenantID(admin))

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"message":    "Role status updated",
		"role_id":    payload.RoleID,
		"status":     nextStatus,
		"request_id": requestID,
	})
}

func handleRbacRoleDelete(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload rbacRoleDeletePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid payload")
		return
	}

	payload.RoleID = strings.TrimSpace(payload.RoleID)
	if payload.RoleID == "" {
		writeAPIError(w, http.StatusBadRequest, "role_id_required", "Role id is required")
		return
	}

	role, err := loadRbacRoleByID(ctx, db, payload.RoleID)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "role_not_found", "Role not found")
		return
	}
	if role.IsSystem {
		writeAPIError(w, http.StatusForbidden, "system_role_locked", "System role cannot be deleted")
		return
	}

	_, err = db.ExecContext(ctx, `DELETE FROM rbac_roles WHERE id=$1`, payload.RoleID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "role_delete_failed", err.Error())
		return
	}

	_ = insertRbacAudit(ctx, db, safeUserID(admin), payload.RoleID, "", "role_deleted", role.Name+" deleted", requestID, r.UserAgent(), adminTenantID(admin))

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"message":    "Role deleted",
		"role_id":    payload.RoleID,
		"request_id": requestID,
	})
}

func handleRbacModules(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	modules, err := loadRBACModules(ctx, db)
	if err != nil {
		modules = rbacDefaultModules()
	}

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"modules":    modules,
		"request_id": requestID,
	})
}

func handleRbacPermissionsGet(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	roleID := strings.TrimSpace(r.URL.Query().Get("role_id"))
	if roleID == "" {
		writeAPIError(w, http.StatusBadRequest, "role_id_required", "role_id is required")
		return
	}

	role, err := loadRbacRoleByID(ctx, db, roleID)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "role_not_found", "Role not found")
		return
	}

	modules, _ := loadRBACModules(ctx, db)
	perms, err := loadRbacRolePermissions(ctx, db, roleID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "permissions_load_failed", err.Error())
		return
	}

	_ = modules

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":          true,
		"role":        role,
		"role_id":     roleID,
		"permissions": perms,
		"request_id":  requestID,
	})
}

func handleRbacPermissionsSave(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload rbacPermissionSavePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid payload")
		return
	}

	payload.RoleID = strings.TrimSpace(payload.RoleID)
	if payload.RoleID == "" {
		writeAPIError(w, http.StatusBadRequest, "role_id_required", "role_id is required")
		return
	}

	role, err := loadRbacRoleByID(ctx, db, payload.RoleID)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "role_not_found", "Role not found")
		return
	}
	if role.IsSystem {
		writeAPIError(w, http.StatusForbidden, "system_role_locked", "System role permissions are managed by presets")
		return
	}

	modules := payload.Permissions
	singleSave := payload.ModuleCode != "" && payload.ActionKey != "" && payload.Enabled != nil

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tx_failed", err.Error())
		return
	}
	defer tx.Rollback()

	if singleSave {
		enabled := false
		if payload.Enabled != nil {
			enabled = *payload.Enabled
		}
		if !isValidRBACAction(payload.ActionKey) {
			writeAPIError(w, http.StatusBadRequest, "invalid_action", "Invalid action key")
			return
		}
		if enabled {
			_, err = tx.ExecContext(ctx, `
INSERT INTO rbac_role_permissions (role_id, module_code, action_key, enabled, updated_at)
VALUES ($1,$2,$3,true,now())
ON CONFLICT (role_id, module_code, action_key) DO UPDATE SET enabled=true, updated_at=now()
`, payload.RoleID, payload.ModuleCode, payload.ActionKey)
		} else {
			_, err = tx.ExecContext(ctx, `
DELETE FROM rbac_role_permissions
WHERE role_id=$1 AND module_code=$2 AND action_key=$3
`, payload.RoleID, payload.ModuleCode, payload.ActionKey)
		}
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "permission_save_failed", err.Error())
			return
		}
	} else {
		_, err = tx.ExecContext(ctx, `DELETE FROM rbac_role_permissions WHERE role_id=$1`, payload.RoleID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "permission_clear_failed", err.Error())
			return
		}

		for moduleCode, row := range modules {
			moduleCode = strings.TrimSpace(moduleCode)
			if moduleCode == "" {
				continue
			}
			for actionKey, enabled := range row {
				actionKey = strings.TrimSpace(actionKey)
				if !isValidRBACAction(actionKey) || !enabled {
					continue
				}
				_, err = tx.ExecContext(ctx, `
INSERT INTO rbac_role_permissions (role_id, module_code, action_key, enabled, updated_at)
VALUES ($1,$2,$3,true,now())
ON CONFLICT (role_id, module_code, action_key) DO UPDATE SET enabled=true, updated_at=now()
`, payload.RoleID, moduleCode, actionKey)
				if err != nil {
					writeAPIError(w, http.StatusInternalServerError, "permission_save_failed", err.Error())
					return
				}
			}
		}
	}

	if err := tx.Commit(); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "tx_commit_failed", err.Error())
		return
	}

	_ = insertRbacAudit(ctx, db, safeUserID(admin), payload.RoleID, "", "permissions_saved", "Role permissions updated", requestID, r.UserAgent(), adminTenantID(admin))

	perms, _ := loadRbacRolePermissions(ctx, db, payload.RoleID)

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":          true,
		"message":     "Permissions saved",
		"role_id":     payload.RoleID,
		"permissions": perms,
		"request_id":  requestID,
	})
}

func handleRbacUsers(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	roleID := strings.TrimSpace(r.URL.Query().Get("role_id"))
	if roleID == "" {
		writeAPIError(w, http.StatusBadRequest, "role_id_required", "role_id is required")
		return
	}

	users, err := loadUsersForRbacRole(ctx, db, roleID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "users_load_failed", err.Error())
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"role_id":    roleID,
		"users":      users,
		"request_id": requestID,
	})
}

func handleRbacUserAssign(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload rbacUserAssignPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid payload")
		return
	}

	payload.UserID = strings.TrimSpace(payload.UserID)
	payload.RoleID = strings.TrimSpace(payload.RoleID)
	payload.Scope = normalizeRBACScope(payload.Scope)
	if payload.Scope == "" {
		payload.Scope = "tenant"
	}

	if payload.UserID == "" || payload.RoleID == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_fields", "user_id and role_id are required")
		return
	}

	role, err := loadRbacRoleByID(ctx, db, payload.RoleID)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "role_not_found", "Role not found")
		return
	}

	var userExists string
	err = db.QueryRowContext(ctx, `SELECT id FROM auth_users WHERE id=$1`, payload.UserID).Scan(&userExists)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "user_not_found", "User not found")
		return
	}

	_, err = db.ExecContext(ctx, `
INSERT INTO rbac_user_roles (user_id, role_id, scope, created_at)
VALUES ($1,$2,$3,now())
ON CONFLICT (user_id, role_id) DO UPDATE SET
  scope = EXCLUDED.scope
`, payload.UserID, payload.RoleID, payload.Scope)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "assign_failed", err.Error())
		return
	}

	_ = insertRbacAudit(ctx, db, safeUserID(admin), payload.RoleID, "", "user_assigned", fmt.Sprintf("%s assigned to %s", payload.UserID, role.Name), requestID, r.UserAgent(), adminTenantID(admin))

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"message":    "User assigned",
		"role_id":    payload.RoleID,
		"user_id":    payload.UserID,
		"request_id": requestID,
	})
}

func handleRbacUserRemove(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, admin, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	var payload rbacUserRemovePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "Invalid payload")
		return
	}

	payload.UserID = strings.TrimSpace(payload.UserID)
	payload.RoleID = strings.TrimSpace(payload.RoleID)
	if payload.UserID == "" || payload.RoleID == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_fields", "user_id and role_id are required")
		return
	}

	role, err := loadRbacRoleByID(ctx, db, payload.RoleID)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "role_not_found", "Role not found")
		return
	}

	_, err = db.ExecContext(ctx, `DELETE FROM rbac_user_roles WHERE user_id=$1 AND role_id=$2`, payload.UserID, payload.RoleID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "remove_failed", err.Error())
		return
	}

	_ = insertRbacAudit(ctx, db, safeUserID(admin), payload.RoleID, "", "user_removed", fmt.Sprintf("%s removed from %s", payload.UserID, role.Name), requestID, r.UserAgent(), adminTenantID(admin))

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"message":    "User removed",
		"role_id":    payload.RoleID,
		"user_id":    payload.UserID,
		"request_id": requestID,
	})
}

func handleRbacAudit(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	db, _, ok := requireSuperadmin(ctx, w, r)
	if !ok {
		return
	}
	defer db.Close()

	roleID := strings.TrimSpace(r.URL.Query().Get("role_id"))
	limit := clampInt(parseIntDefault(r.URL.Query().Get("limit"), 50), 1, 200)

	items, err := loadRbacAuditLogs(ctx, db, roleID, limit)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "audit_load_failed", err.Error())
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"items":      items,
		"request_id": requestID,
	})
}

func loadRbacRoles(ctx context.Context, db *sql.DB) ([]rbacRoleRow, error) {
	rows, err := db.QueryContext(ctx, `
SELECT
  r.id,
  r.name,
  r.description,
  r.is_system,
  r.status,
  r.scope,
  COALESCE(r.inherits_from,''),
  COALESCE(r.created_by,''),
  COALESCE(r.updated_by,''),
  COALESCE(r.created_at::text,''),
  COALESCE(r.updated_at::text,'')
FROM rbac_roles r
ORDER BY r.is_system DESC, r.name ASC
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]rbacRoleRow, 0)
	for rows.Next() {
		var row rbacRoleRow
		var inheritsFrom string
		if err := rows.Scan(
			&row.ID,
			&row.Name,
			&row.Description,
			&row.IsSystem,
			&row.Status,
			&row.Scope,
			&inheritsFrom,
			&row.CreatedBy,
			&row.UpdatedBy,
			&row.CreatedAt,
			&row.UpdatedAt,
		); err != nil {
			return nil, err
		}
		row.InheritsFrom = inheritsFrom

		row.UsersCount, _ = countRbacUsersForRole(ctx, db, row.ID)
		row.PermissionCount, _ = countRbacPermissionsForRole(ctx, db, row.ID)
		out = append(out, row)
	}

	for i := range out {
		perms, _ := loadRbacRolePermissions(ctx, db, out[i].ID)
		out[i].Permissions = perms
	}

	return out, rows.Err()
}

func loadRbacRoleByID(ctx context.Context, db *sql.DB, roleID string) (*rbacRoleRow, error) {
	var row rbacRoleRow
	var inheritsFrom sql.NullString
	var createdBy sql.NullString
	var updatedBy sql.NullString

	err := db.QueryRowContext(ctx, `
SELECT
  id, name, description, is_system, status, scope, inherits_from,
  COALESCE(created_by,''), COALESCE(updated_by,''),
  COALESCE(created_at::text,''), COALESCE(updated_at::text,'')
FROM rbac_roles
WHERE id=$1
`, roleID).Scan(
		&row.ID,
		&row.Name,
		&row.Description,
		&row.IsSystem,
		&row.Status,
		&row.Scope,
		&inheritsFrom,
		&createdBy,
		&updatedBy,
		&row.CreatedAt,
		&row.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	row.InheritsFrom = nullStringToString(inheritsFrom)
	row.CreatedBy = createdBy.String
	row.UpdatedBy = updatedBy.String
	row.UsersCount, _ = countRbacUsersForRole(ctx, db, row.ID)
	row.PermissionCount, _ = countRbacPermissionsForRole(ctx, db, row.ID)
	row.Permissions, _ = loadRbacRolePermissions(ctx, db, row.ID)

	return &row, nil
}

func loadRBACModules(ctx context.Context, db *sql.DB) ([]rbacModule, error) {
	rows, err := db.QueryContext(ctx, `
SELECT id, name, COALESCE(category,''), COALESCE(route,''), COALESCE(icon,''), COALESCE(status,''), COALESCE(sort_order,0)
FROM modules
WHERE COALESCE(status,'active') = 'active'
ORDER BY COALESCE(sort_order,0), name
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type row struct {
		Code  string
		Name  string
		Group string
		Desc  string
	}
	tmp := make([]row, 0)

	for rows.Next() {
		var id, name, category, route, icon, status string
		var sortOrder int
		if err := rows.Scan(&id, &name, &category, &route, &icon, &status, &sortOrder); err != nil {
			return nil, err
		}
		tmp = append(tmp, row{
			Code:  strings.TrimSpace(id),
			Name:  strings.TrimSpace(name),
			Group: normalizeModuleGroup(category),
			Desc:  strings.TrimSpace(route + " " + icon + " " + status),
		})
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(tmp) == 0 {
		return rbacDefaultModules(), nil
	}

	out := make([]rbacModule, 0, len(tmp))
	for _, item := range tmp {
		out = append(out, rbacModule{
			Code:        item.Code,
			Name:        item.Name,
			Group:       item.Group,
			Description: item.Desc,
		})
	}
	return out, nil
}

func loadRbacRolePermissions(ctx context.Context, db *sql.DB, roleID string) (map[string]map[string]bool, error) {
	rows, err := db.QueryContext(ctx, `
SELECT module_code, action_key, enabled
FROM rbac_role_permissions
WHERE role_id=$1
`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[string]map[string]bool)
	for rows.Next() {
		var moduleCode, actionKey string
		var enabled bool
		if err := rows.Scan(&moduleCode, &actionKey, &enabled); err != nil {
			return nil, err
		}
		moduleCode = strings.TrimSpace(moduleCode)
		actionKey = strings.TrimSpace(actionKey)
		if moduleCode == "" || !isValidRBACAction(actionKey) {
			continue
		}
		if _, ok := out[moduleCode]; !ok {
			out[moduleCode] = map[string]bool{}
		}
		out[moduleCode][actionKey] = enabled
	}
	return out, rows.Err()
}

func countRbacUsersForRole(ctx context.Context, db *sql.DB, roleID string) (int, error) {
	var count int
	err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM rbac_user_roles WHERE role_id=$1`, roleID).Scan(&count)
	return count, err
}

func countRbacPermissionsForRole(ctx context.Context, db *sql.DB, roleID string) (int, error) {
	var count int
	err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM rbac_role_permissions WHERE role_id=$1 AND enabled=true`, roleID).Scan(&count)
	return count, err
}

func loadUsersForRbacRole(ctx context.Context, db *sql.DB, roleID string) ([]map[string]any, error) {
	rows, err := db.QueryContext(ctx, `
SELECT
  au.id,
  COALESCE(NULLIF(TRIM(au.email), ''), au.id),
  COALESCE(au.status, ''),
  COALESCE(ur.scope, 'tenant')
FROM rbac_user_roles ur
JOIN auth_users au ON au.id = ur.user_id
WHERE ur.role_id = $1
ORDER BY au.email
`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]map[string]any, 0)
	for rows.Next() {
		var id, email, status, scope string
		if err := rows.Scan(&id, &email, &status, &scope); err != nil {
			return nil, err
		}
		out = append(out, map[string]any{
			"id":     id,
			"name":   email,
			"email":  email,
			"status": status,
			"scope":  scope,
		})
	}
	return out, rows.Err()
}

func loadRbacAuditLogs(ctx context.Context, db *sql.DB, roleID string, limit int) ([]rbacAuditRow, error) {
	query := `
SELECT id, COALESCE(actor_user_id,''), COALESCE(role_id,''), COALESCE(tenant_id,''), action, detail, COALESCE(ip_address,''), COALESCE(user_agent,''), COALESCE(created_at::text,'')
FROM rbac_audit_logs
`
	args := []any{}
	if strings.TrimSpace(roleID) != "" {
		query += ` WHERE role_id=$1`
		args = append(args, roleID)
	}
	query += ` ORDER BY id DESC LIMIT ` + fmt.Sprintf("%d", limit)

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]rbacAuditRow, 0)
	for rows.Next() {
		var row rbacAuditRow
		if err := rows.Scan(
			&row.ID,
			&row.ActorUserID,
			&row.RoleID,
			&row.TenantID,
			&row.Action,
			&row.Detail,
			&row.IPAddress,
			&row.UserAgent,
			&row.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func insertRbacAudit(ctx context.Context, db *sql.DB, actorUserID, roleID, tenantID, action, detail, ipAddress, userAgent, actorTenantID string) error {
	_, err := db.ExecContext(ctx, `
INSERT INTO rbac_audit_logs (
  actor_user_id, role_id, tenant_id, action, detail, ip_address, user_agent, created_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,now())
`, emptyToNull(actorUserID), emptyToNull(roleID), emptyToNull(coalesceString(tenantID, actorTenantID)), action, detail, ipAddress, userAgent)
	return err
}

func safeUserID(user authUser) string {
	return strings.TrimSpace(user.ID)
}

func safeUserName(user authUser) string {
	if strings.TrimSpace(user.Email) != "" {
		return strings.TrimSpace(user.Email)
	}
	return strings.TrimSpace(user.ID)
}

func adminTenantID(user authUser) string {
	if user.TenantID.Valid {
		return strings.TrimSpace(user.TenantID.String)
	}
	return ""
}

type execContext interface {
	ExecContext(context.Context, string, ...any) (sql.Result, error)
}

func normalizeRBACStatus(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "disabled" {
		return "disabled"
	}
	return "active"
}

func normalizeRBACScope(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	switch value {
	case "platform", "tenant", "branch", "department":
		return value
	default:
		return "tenant"
	}
}

func isValidRBACAction(action string) bool {
	action = strings.ToLower(strings.TrimSpace(action))
	switch rbacActionKey(action) {
	case rbacActionView, rbacActionCreate, rbacActionEdit, rbacActionDelete, rbacActionApprove, rbacActionExport, rbacActionManage:
		return true
	default:
		return false
	}
}

func slugifyRBAC(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return ""
	}
	var b strings.Builder
	lastUnderscore := false
	for _, r := range value {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			lastUnderscore = false
			continue
		}
		if !lastUnderscore {
			b.WriteByte('_')
			lastUnderscore = true
		}
	}
	return strings.Trim(b.String(), "_")
}

func normalizeModuleGroup(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	switch value {
	case "core":
		return "Core"
	case "governance":
		return "Governance"
	case "clients":
		return "Clients"
	case "billing":
		return "Billing"
	case "platform":
		return "Platform"
	case "intelligence":
		return "Intelligence"
	case "operations":
		return "Operations"
	case "content":
		return "Content"
	case "security":
		return "Security"
	default:
		return "Other"
	}
}

func loadRbacRolePermissionsMap(ctx context.Context, db *sql.DB, roleID string) (map[string]map[string]bool, error) {
	return loadRbacRolePermissions(ctx, db, roleID)
}

func parseIntDefault(value string, fallback int) int {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	var n int
	_, err := fmt.Sscanf(value, "%d", &n)
	if err != nil {
		return fallback
	}
	return n
}

func clampInt(n, minV, maxV int) int {
	if n < minV {
		return minV
	}
	if n > maxV {
		return maxV
	}
	return n
}

func nullString(v string) sql.NullString {
	v = strings.TrimSpace(v)
	return sql.NullString{String: v, Valid: v != ""}
}

func nilString(v string) any {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	return strings.TrimSpace(v)
}

func nullStringToString(v sql.NullString) string {
	if v.Valid {
		return v.String
	}
	return ""
}

func emptyToNull(value string) any {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return value
}

func coalesceString(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func writeRBACJSON(w http.ResponseWriter, status int, payload any) {
	writeAPIJSON(w, status, payload)
}

func loadRbacRolePermissionsOrEmpty(ctx context.Context, db *sql.DB, roleID string) map[string]map[string]bool {
	out, err := loadRbacRolePermissions(ctx, db, roleID)
	if err != nil || out == nil {
		return map[string]map[string]bool{}
	}
	return out
}

func loadRbacUsersRoleSummary(ctx context.Context, db *sql.DB, roleID string) (int, error) {
	return countRbacUsersForRole(ctx, db, roleID)
}

func sortRbacRolesInPlace(roles []rbacRoleRow) {
	sort.SliceStable(roles, func(i, j int) bool {
		if roles[i].IsSystem != roles[j].IsSystem {
			return roles[i].IsSystem
		}
		return strings.ToLower(roles[i].Name) < strings.ToLower(roles[j].Name)
	})
}

func handleRbacPermissionSaveSingle(ctx context.Context, db *sql.DB, roleID, moduleCode, actionKey string, enabled bool) error {
	if !isValidRBACAction(actionKey) {
		return errors.New("invalid action")
	}
	if enabled {
		_, err := db.ExecContext(ctx, `
INSERT INTO rbac_role_permissions (role_id, module_code, action_key, enabled, updated_at)
VALUES ($1,$2,$3,true,now())
ON CONFLICT (role_id, module_code, action_key) DO UPDATE SET enabled=true, updated_at=now()
`, roleID, moduleCode, actionKey)
		return err
	}
	_, err := db.ExecContext(ctx, `
DELETE FROM rbac_role_permissions
WHERE role_id=$1 AND module_code=$2 AND action_key=$3
`, roleID, moduleCode, actionKey)
	return err
}

func init() {
	_ = log.Printf
}
