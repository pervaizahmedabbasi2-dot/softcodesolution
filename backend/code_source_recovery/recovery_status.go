package code_source_recovery

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type RecoveryStatus struct {
	State               string    `json:"state"`
	CurrentCommit       string    `json:"current_commit,omitempty"`
	LastKnownGoodCommit string    `json:"last_known_good_commit,omitempty"`
	SelectedSource      string    `json:"selected_source,omitempty"`
	SelectedCommit      string    `json:"selected_commit,omitempty"`
	IntegrityVerified   bool      `json:"integrity_verified"`
	Restored            bool      `json:"restored"`
	Rebuilt             bool      `json:"rebuilt"`
	GitHubAvailable     bool      `json:"github_available"`
	RecoveryReady       bool      `json:"recovery_ready"`
	Reason              string    `json:"reason,omitempty"`
	ObservedAt          time.Time `json:"observed_at"`
}

type RecoveryStatusProvider interface {
	Status() RecoveryStatus
}

type StaticRecoveryStatusProvider struct {
	Current RecoveryStatus
}

func (p StaticRecoveryStatusProvider) Status() RecoveryStatus {
	return p.Current
}

type RecoveryStatusAPI struct {
	Provider RecoveryStatusProvider
}

func NewRecoveryStatusAPI(provider RecoveryStatusProvider) *RecoveryStatusAPI {
	return &RecoveryStatusAPI{
		Provider: provider,
	}
}

func (api *RecoveryStatusAPI) Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if api.Provider == nil {
		http.Error(w, "recovery status unavailable", http.StatusServiceUnavailable)
		return
	}

	status := api.Provider.Status()
	if status.ObservedAt.IsZero() {
		status.ObservedAt = time.Now().UTC()
	}

	if strings.TrimSpace(status.State) == "" {
		if status.RecoveryReady {
			status.State = "ready"
		} else {
			status.State = "not_ready"
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")

	if err := json.NewEncoder(w).Encode(status); err != nil {
		return
	}
}

func RegisterRecoveryStatusEndpoint(
	mux *http.ServeMux,
	provider RecoveryStatusProvider,
) {
	if mux == nil || provider == nil {
		return
	}

	api := NewRecoveryStatusAPI(provider)

	mux.HandleFunc(
		"/api/recovery/status",
		api.Handler,
	)
}
