package code_source_recovery

import (
	"strings"
	"testing"
)

type fakeDecisionTelemetryRecorder struct {
	calls      int
	recoveryID string
	eventType  string
	status     string
	component  string
	message    string
}

func (f *fakeDecisionTelemetryRecorder) RecordRecoveryEvent(
	recoveryID string,
	eventType string,
	status string,
	component string,
	message string,
) error {
	f.calls++
	f.recoveryID = recoveryID
	f.eventType = eventType
	f.status = status
	f.component = component
	f.message = message
	return nil
}

func TestRecordDecisionTelemetryReady(t *testing.T) {
	recorder := &fakeDecisionTelemetryRecorder{}

	err := RecordDecisionTelemetry(
		recorder,
		"recovery-123",
		RecoveryDecision{
			SelectedSource: "github",
			SelectedCommit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			Reason:         "local unavailable; GitHub verified",
			Ready:          true,
		},
		DecisionTelemetryInput{
			LocalAvailable:  false,
			LocalVerified:   false,
			GitHubAvailable: true,
			GitHubVerified:  true,
			LKGAvailable:    true,
			LKGVerified:     true,
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	if recorder.calls != 1 {
		t.Fatalf("expected one call, got %d", recorder.calls)
	}

	if recorder.eventType != DecisionTelemetryEventType {
		t.Fatalf("unexpected event type: %s", recorder.eventType)
	}

	if recorder.status != "ready" {
		t.Fatalf("unexpected status: %s", recorder.status)
	}

	if recorder.component != "code_source_recovery" {
		t.Fatalf("unexpected component: %s", recorder.component)
	}

	if !strings.Contains(
		recorder.message,
		"selected_source",
	) {
		t.Fatal("structured decision payload missing")
	}
}

func TestRecordDecisionTelemetryFailClosed(t *testing.T) {
	recorder := &fakeDecisionTelemetryRecorder{}

	err := RecordDecisionTelemetry(
		recorder,
		"recovery-456",
		RecoveryDecision{
			SelectedSource: "none",
			Reason:         "no verified recovery source is available",
			Ready:          false,
		},
		DecisionTelemetryInput{},
	)

	if err != nil {
		t.Fatal(err)
	}

	if recorder.status != "blocked" {
		t.Fatalf("unexpected status: %s", recorder.status)
	}

	if recorder.calls != 1 {
		t.Fatalf("expected one call, got %d", recorder.calls)
	}
}

func TestRecordDecisionTelemetryRejectsMissingRecorder(t *testing.T) {
	err := RecordDecisionTelemetry(
		nil,
		"recovery-789",
		RecoveryDecision{
			SelectedSource: "local",
			Reason:         "local source is verified",
			Ready:          true,
		},
		DecisionTelemetryInput{
			LocalAvailable: true,
			LocalVerified:  true,
		},
	)

	if err == nil {
		t.Fatal("expected recorder error")
	}
}

func TestRecordDecisionTelemetryRejectsMissingRecoveryID(t *testing.T) {
	recorder := &fakeDecisionTelemetryRecorder{}

	err := RecordDecisionTelemetry(
		recorder,
		"",
		RecoveryDecision{
			SelectedSource: "local",
			Reason:         "local source is verified",
			Ready:          true,
		},
		DecisionTelemetryInput{
			LocalAvailable: true,
			LocalVerified:  true,
		},
	)

	if err == nil {
		t.Fatal("expected recovery id error")
	}

	if recorder.calls != 0 {
		t.Fatal("recorder must not be called")
	}
}

func TestDecisionTelemetryRecorderContract(t *testing.T) {
	var recorder DecisionTelemetryRecorder = &fakeDecisionTelemetryRecorder{}

	if recorder == nil {
		t.Fatal("recorder contract unavailable")
	}
}
