package code_source_recovery

import (
	"encoding/json"
	"testing"
)

func TestBuildDecisionTelemetryLocal(t *testing.T) {
	payload, err := BuildDecisionTelemetry(
		RecoveryDecision{
			SelectedSource: "local",
			SelectedCommit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			Reason:         "local source is verified",
			Ready:          true,
		},
		DecisionTelemetryInput{
			LocalAvailable:  true,
			LocalVerified:   true,
			GitHubAvailable: true,
			GitHubVerified:  true,
			LKGAvailable:    true,
			LKGVerified:     true,
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	if payload.Decision != "LOCAL_PREFERRED" {
		t.Fatalf("unexpected decision: %s", payload.Decision)
	}

	if !payload.LocalAvailable || !payload.LocalVerified {
		t.Fatal("local evidence missing")
	}
}

func TestBuildDecisionTelemetryGitHubFallback(t *testing.T) {
	payload, err := BuildDecisionTelemetry(
		RecoveryDecision{
			SelectedSource: "github",
			SelectedCommit: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			Reason:         "local source unavailable or unverified; GitHub selected",
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

	if payload.Decision != "GITHUB_FALLBACK" {
		t.Fatalf("unexpected decision: %s", payload.Decision)
	}

	if payload.SelectedSource != "github" {
		t.Fatalf("unexpected source: %s", payload.SelectedSource)
	}
}

func TestBuildDecisionTelemetryLKGFallback(t *testing.T) {
	payload, err := BuildDecisionTelemetry(
		RecoveryDecision{
			SelectedSource: "last_known_good",
			SelectedCommit: "cccccccccccccccccccccccccccccccccccccc",
			Reason:         "current and GitHub unavailable; using last-known-good",
			Ready:          true,
		},
		DecisionTelemetryInput{
			LocalAvailable:  false,
			LocalVerified:   false,
			GitHubAvailable: false,
			GitHubVerified:  false,
			LKGAvailable:    true,
			LKGVerified:     true,
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	if payload.Decision != "LAST_KNOWN_GOOD_FALLBACK" {
		t.Fatalf("unexpected decision: %s", payload.Decision)
	}
}

func TestBuildDecisionTelemetryFailClosed(t *testing.T) {
	payload, err := BuildDecisionTelemetry(
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

	if payload.Decision != "FAIL_CLOSED" {
		t.Fatalf("unexpected decision: %s", payload.Decision)
	}

	if payload.Ready {
		t.Fatal("fail-closed decision must not be ready")
	}
}

func TestMarshalDecisionTelemetry(t *testing.T) {
	payload, err := BuildDecisionTelemetry(
		RecoveryDecision{
			SelectedSource: "github",
			SelectedCommit: "dddddddddddddddddddddddddddddddddddddddd",
			Reason:         "GitHub verified fallback",
			Ready:          true,
		},
		DecisionTelemetryInput{
			GitHubAvailable: true,
			GitHubVerified:  true,
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	message, err := MarshalDecisionTelemetry(payload)
	if err != nil {
		t.Fatal(err)
	}

	var decoded DecisionTelemetryPayload
	if err := json.Unmarshal([]byte(message), &decoded); err != nil {
		t.Fatal(err)
	}

	if decoded.SelectedSource != "github" {
		t.Fatalf("unexpected selected source: %s", decoded.SelectedSource)
	}

	if decoded.RecordedAt.IsZero() {
		t.Fatal("recorded_at missing")
	}
}

func TestBuildDecisionTelemetryRejectsMissingSource(t *testing.T) {
	_, err := BuildDecisionTelemetry(
		RecoveryDecision{
			Reason: "test",
			Ready:  false,
		},
		DecisionTelemetryInput{},
	)

	if err == nil {
		t.Fatal("expected missing-source error")
	}
}
