package backup

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type supervisorTelemetryResponse struct {
	Heartbeat         string           `json:"heartbeat"`
	CrashRestartCount int              `json:"crash_restart_count"`
	IncidentCount     int              `json:"incident_count"`
	CurrentOperation  string           `json:"current_operation"`
	LastHeartbeat     time.Time        `json:"last_heartbeat"`
	Incidents         []map[string]any `json:"incidents,omitempty"`
}

type API struct {
	Service *Service
}

func NewAPI(service *Service) *API {
	return &API{
		Service: service,
	}
}

func (a *API) CreateBackup(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodPost {
		writeBackupError(
			w,
			http.StatusMethodNotAllowed,
			"method not allowed",
		)
		return
	}

	result, err := a.Service.Create()

	if err != nil {
		writeBackupError(
			w,
			http.StatusInternalServerError,
			err.Error(),
		)
		return
	}

	writeBackupJSON(
		w,
		http.StatusCreated,
		result,
	)
}

func (a *API) ListBackups(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodGet {
		writeBackupError(
			w,
			http.StatusMethodNotAllowed,
			"method not allowed",
		)
		return
	}

	result, err := a.Service.List()

	if err != nil {
		writeBackupError(
			w,
			http.StatusInternalServerError,
			err.Error(),
		)
		return
	}

	writeBackupJSON(
		w,
		http.StatusOK,
		map[string]any{
			"ok":      true,
			"backups": result,
		},
	)
}

func (a *API) VerifyBackup(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodGet {
		writeBackupError(
			w,
			http.StatusMethodNotAllowed,
			"method not allowed",
		)
		return
	}

	id := backupIDFromPath(
		r.URL.Path,
		"/api/superadmin/backups/",
		"/verify",
	)

	if id == "" {
		writeBackupError(
			w,
			http.StatusBadRequest,
			"backup id is required",
		)
		return
	}

	result, err := a.Service.Verify(id)

	if err != nil {
		writeBackupError(
			w,
			http.StatusConflict,
			err.Error(),
		)
		return
	}

	writeBackupJSON(
		w,
		http.StatusOK,
		map[string]any{
			"ok":     true,
			"backup": result,
		},
	)
}

func (a *API) RestoreBackup(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodPost {
		writeBackupError(
			w,
			http.StatusMethodNotAllowed,
			"method not allowed",
		)
		return
	}

	id := backupIDFromPath(
		r.URL.Path,
		"/api/superadmin/backups/",
		"/restore",
	)

	if id == "" {
		writeBackupError(
			w,
			http.StatusBadRequest,
			"backup id is required",
		)
		return
	}

	var payload struct {
		Confirm string `json:"confirm"`
		Target  string `json:"target"`
	}

	decoder := json.NewDecoder(
		r.Body,
	)

	if err := decoder.Decode(
		&payload,
	); err != nil {

		writeBackupError(
			w,
			http.StatusBadRequest,
			"invalid restore request",
		)
		return
	}

	result, err := a.Service.Restore(
		RestoreOptions{
			BackupID: id,
			Confirm:  payload.Confirm,
			Target:   payload.Target,
		},
	)

	if err != nil {

		status := http.StatusBadRequest

		if strings.Contains(
			err.Error(),
			"backup verification",
		) {
			status = http.StatusConflict
		}

		writeBackupError(
			w,
			status,
			err.Error(),
		)

		return
	}

	writeBackupJSON(
		w,
		http.StatusOK,
		map[string]any{
			"ok":      true,
			"restore": result,
		},
	)
}

func (a *API) GetRecoveryStatus(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodGet {
		writeBackupError(
			w,
			http.StatusMethodNotAllowed,
			"method not allowed",
		)
		return
	}

	backups, err := a.Service.List()
	if err != nil {
		writeBackupError(
			w,
			http.StatusInternalServerError,
			err.Error(),
		)
		return
	}

	var latest *Manifest

	if len(backups) > 0 {
		latest = &backups[len(backups)-1]
	}

	events, eventErr := a.Service.ListRecoveryEvents(
		r.Context(),
		500,
	)

	if eventErr != nil {
		events = []RecoveryEvent{}
	}

	score := 0

	warnings := []string{}

	layer1Status := "Degraded"
	layer2Status := "Not verified"
	layer3Status := "Not verified"
	layer4Status := "No event"
	layer5Status := "No event"

	if latest != nil {

		//
		// Layer 1 — Core Recovery
		//
		if latest.PostgresSHA != "" &&
			latest.SQLiteSHA != "" {

			layer1Status = "Verified"
			score += 20

		} else {

			warnings = append(
				warnings,
				"Layer 1: PostgreSQL or SQLite SHA checksum missing.",
			)
		}

		//
		// Layer 2 — Office Mirror
		//
		if latest.OfficeMirrorVerified {

			layer2Status = "Verified"
			score += 20

		} else {

			warnings = append(
				warnings,
				"Layer 2: Office Mirror is not verified.",
			)
		}

		//
		// Layer 3 — Offsite
		//
		if latest.OffsiteVerified {

			layer3Status = "Verified"
			score += 20

		} else {

			layer3Status =
				latest.OffsiteStatus

			if layer3Status == "" {
				layer3Status = "Not verified"
			}

			warnings = append(
				warnings,
				"Layer 3: Offsite copy is not verified.",
			)
		}

		//
		// Layer 4 — Reconciliation
		//
		for _, event := range events {

			if event.RecoveryID != latest.ID {
				continue
			}

			eventType :=
				strings.ToLower(
					strings.TrimSpace(event.EventType),
				)

			component :=
				strings.ToLower(
					strings.TrimSpace(event.Component),
				)

			status :=
				strings.ToLower(
					strings.TrimSpace(event.Status),
				)

			if strings.Contains(eventType, "reconciliation") ||
				strings.Contains(eventType, "reconcile") ||
				strings.Contains(component, "reconciliation") {

				if status == "success" ||
					status == "verified" {

					layer4Status = "Verified"
					score += 20

				} else {

					layer4Status = event.Status
				}

				break
			}
		}

		if layer4Status != "Verified" {
			warnings = append(
				warnings,
				"Layer 4: latest recovery point has no successful reconciliation event.",
			)
		}

	} else {

		warnings = append(
			warnings,
			"No authoritative recovery point is currently available.",
		)
	}

	//
	// Layer 5 — Guardian
	//
	for _, event := range events {

		eventType :=
			strings.ToLower(
				strings.TrimSpace(event.EventType),
			)

		component :=
			strings.ToLower(
				strings.TrimSpace(event.Component),
			)

		status :=
			strings.ToLower(
				strings.TrimSpace(event.Status),
			)

		if strings.Contains(eventType, "guardian") ||
			strings.Contains(component, "guardian") ||
			strings.Contains(eventType, "supervisor") ||
			strings.Contains(component, "supervisor") {

			if status == "success" ||
				status == "healthy" ||
				status == "verified" {

				layer5Status = "Verified"
				score += 20

			} else {

				layer5Status = event.Status
			}

			break
		}
	}

	if layer5Status != "Verified" {

		warnings = append(
			warnings,
			"Layer 5: no successful Guardian health event is currently available.",
		)
	}

	overallStatus := "UNKNOWN"

	switch {

	case latest == nil:
		overallStatus = "UNKNOWN"

	case score == 100:
		overallStatus = "PROTECTED"

	case score > 0:
		overallStatus = "DEGRADED"

	default:
		overallStatus = "FAILED"
	}

	writeBackupJSON(
		w,
		http.StatusOK,
		map[string]any{
			"ok":                    true,
			"status":                overallStatus,
			"score":                 score,
			"total_backups":         len(backups),
			"latest_recovery_point": latest,
			"layers": map[string]any{
				"layer1_core":          layer1Status,
				"layer2_office_mirror": layer2Status,
				"layer3_offsite":       layer3Status,
				"layer4_reconcile":     layer4Status,
				"layer5_guardian":      layer5Status,
			},
			"warnings":      warnings,
			"event_count":   len(events),
			"reconciled_at": time.Now().UTC(),
		},
	)
}

// GetSupervisorTelemetry exposes authoritative
// Guardian Supervisor runtime telemetry.
func (a *API) GetSupervisorTelemetry(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodGet {
		writeBackupError(
			w,
			http.StatusMethodNotAllowed,
			"method not allowed",
		)
		return
	}

	telemetryPath := strings.TrimSpace(
		os.Getenv("SCS_GUARDIAN_TELEMETRY_FILE"),
	)

	if telemetryPath == "" {
		telemetryPath =
			"backend/guardian/data/supervisor-telemetry.json"
	}

	payload, err := os.ReadFile(telemetryPath)

	if err != nil {
		writeBackupError(
			w,
			http.StatusServiceUnavailable,
			"guardian supervisor telemetry unavailable",
		)
		return
	}

	var telemetry supervisorTelemetryResponse

	if err := json.Unmarshal(
		payload,
		&telemetry,
	); err != nil {
		writeBackupError(
			w,
			http.StatusServiceUnavailable,
			"guardian supervisor telemetry invalid",
		)
		return
	}

	if strings.TrimSpace(
		telemetry.Heartbeat,
	) == "" ||
		strings.TrimSpace(
			telemetry.CurrentOperation,
		) == "" ||
		telemetry.LastHeartbeat.IsZero() {

		writeBackupError(
			w,
			http.StatusServiceUnavailable,
			"guardian supervisor telemetry incomplete",
		)
		return
	}

	writeBackupJSON(
		w,
		http.StatusOK,
		map[string]any{
			"ok":        true,
			"telemetry": telemetry,
		},
	)
}

func (a *API) GetRecoveryEvents(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodGet {
		writeBackupError(
			w,
			http.StatusMethodNotAllowed,
			"method not allowed",
		)
		return
	}

	limit := 50
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			limit = v
		}
	}

	events, err := a.Service.ListRecoveryEvents(r.Context(), limit)
	if err != nil {
		events = []RecoveryEvent{}
	}

	writeBackupJSON(
		w,
		http.StatusOK,
		map[string]any{
			"ok":     true,
			"events": events,
		},
	)
}

func RegisterHTTPRoutes(
	mux *http.ServeMux,
	api *API,
) {

	mux.HandleFunc(
		"/api/recovery/status",
		api.GetRecoveryStatus,
	)

	mux.HandleFunc(
		"/api/superadmin/recovery/status",
		api.GetRecoveryStatus,
	)

	mux.HandleFunc(
		"/api/recovery/events",
		api.GetRecoveryEvents,
	)

	mux.HandleFunc(
		"/api/recovery/supervisor-telemetry",
		api.GetSupervisorTelemetry,
	)

	mux.HandleFunc(
		"/api/superadmin/recovery/events",
		api.GetRecoveryEvents,
	)

	mux.HandleFunc(
		"/api/superadmin/backups",
		func(
			w http.ResponseWriter,
			r *http.Request,
		) {

			switch r.Method {

			case http.MethodPost:
				api.CreateBackup(
					w,
					r,
				)

			case http.MethodGet:
				api.ListBackups(
					w,
					r,
				)

			default:
				writeBackupError(
					w,
					http.StatusMethodNotAllowed,
					"method not allowed",
				)
			}
		},
	)

	mux.HandleFunc(
		"/api/superadmin/backups/",
		func(
			w http.ResponseWriter,
			r *http.Request,
		) {

			if strings.HasSuffix(
				r.URL.Path,
				"/verify",
			) {

				api.VerifyBackup(
					w,
					r,
				)

				return
			}

			if strings.HasSuffix(
				r.URL.Path,
				"/restore",
			) {

				api.RestoreBackup(
					w,
					r,
				)

				return
			}

			writeBackupError(
				w,
				http.StatusNotFound,
				"backup route not found",
			)
		},
	)
}

func backupIDFromPath(
	path string,
	prefix string,
	suffix string,
) string {

	if !strings.HasPrefix(
		path,
		prefix,
	) {
		return ""
	}

	value := strings.TrimPrefix(
		path,
		prefix,
	)

	value = strings.TrimSuffix(
		value,
		suffix,
	)

	value = strings.Trim(
		value,
		"/",
	)

	if strings.Contains(
		value,
		"/",
	) {
		return ""
	}

	return value
}

func writeBackupJSON(
	w http.ResponseWriter,
	status int,
	value any,
) {

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	w.WriteHeader(status)

	_ = json.NewEncoder(
		w,
	).Encode(value)
}

func writeBackupError(
	w http.ResponseWriter,
	status int,
	message string,
) {

	writeBackupJSON(
		w,
		status,
		map[string]any{
			"ok":    false,
			"error": message,
		},
	)
}
