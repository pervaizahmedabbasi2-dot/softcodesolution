package code_source_recovery

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRecoveryStatusHandlerReturnsJSON(t *testing.T) {
	provider := StaticRecoveryStatusProvider{
		Current: RecoveryStatus{
			State:               "ready",
			CurrentCommit:       "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			LastKnownGoodCommit: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			SelectedSource:      "local",
			SelectedCommit:      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			IntegrityVerified:   true,
			Restored:            true,
			Rebuilt:             true,
			GitHubAvailable:     true,
			RecoveryReady:       true,
			Reason:              "verified local source selected",
			ObservedAt:          time.Now().UTC(),
		},
	}

	api := NewRecoveryStatusAPI(provider)
	request := httptest.NewRequest(
		http.MethodGet,
		"/api/recovery/status",
		nil,
	)
	recorder := httptest.NewRecorder()

	api.Handler(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}

	if recorder.Header().Get("Content-Type") == "" {
		t.Fatal("missing content type")
	}

	var payload RecoveryStatus
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}

	if payload.State != "ready" {
		t.Fatalf("unexpected state: %s", payload.State)
	}

	if payload.CurrentCommit != "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" {
		t.Fatalf("unexpected current commit")
	}

	if !payload.IntegrityVerified || !payload.Rebuilt {
		t.Fatal("expected verified rebuilt status")
	}
}

func TestRecoveryStatusRejectsNonGET(t *testing.T) {
	provider := StaticRecoveryStatusProvider{}
	api := NewRecoveryStatusAPI(provider)

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/recovery/status",
		nil,
	)
	recorder := httptest.NewRecorder()

	api.Handler(recorder, request)

	if recorder.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", recorder.Code)
	}
}

func TestRecoveryStatusUsesFallbackStateWhenStateEmpty(t *testing.T) {
	provider := StaticRecoveryStatusProvider{
		Current: RecoveryStatus{
			RecoveryReady: true,
		},
	}

	api := NewRecoveryStatusAPI(provider)
	request := httptest.NewRequest(
		http.MethodGet,
		"/api/recovery/status",
		nil,
	)
	recorder := httptest.NewRecorder()

	api.Handler(recorder, request)

	var payload RecoveryStatus
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}

	if payload.State != "ready" {
		t.Fatalf("expected ready, got %s", payload.State)
	}

	if payload.ObservedAt.IsZero() {
		t.Fatal("expected observation time")
	}
}

func TestRegisterRecoveryStatusEndpoint(t *testing.T) {
	mux := http.NewServeMux()

	RegisterRecoveryStatusEndpoint(
		mux,
		StaticRecoveryStatusProvider{
			Current: RecoveryStatus{
				State: "not_ready",
			},
		},
	)

	request := httptest.NewRequest(
		http.MethodGet,
		"/api/recovery/status",
		nil,
	)
	recorder := httptest.NewRecorder()

	mux.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
}
