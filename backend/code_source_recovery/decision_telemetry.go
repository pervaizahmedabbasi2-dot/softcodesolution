package code_source_recovery

import (
	"encoding/json"
	"errors"
	"strings"
	"time"
)

const DecisionTelemetryEventType = "code_source_recovery_decision"

type DecisionTelemetryPayload struct {
	Decision        string    `json:"decision"`
	SelectedSource  string    `json:"selected_source"`
	SelectedCommit  string    `json:"selected_commit,omitempty"`
	LocalAvailable  bool      `json:"local_available"`
	LocalVerified   bool      `json:"local_verified"`
	GitHubAvailable bool      `json:"github_available"`
	GitHubVerified  bool      `json:"github_verified"`
	LKGAvailable    bool      `json:"lkg_available"`
	LKGVerified     bool      `json:"lkg_verified"`
	Ready           bool      `json:"ready"`
	Reason          string    `json:"reason"`
	RecordedAt      time.Time `json:"recorded_at"`
}

type DecisionTelemetryInput struct {
	LocalAvailable  bool
	LocalVerified   bool
	GitHubAvailable bool
	GitHubVerified  bool
	LKGAvailable    bool
	LKGVerified     bool
}

func BuildDecisionTelemetry(
	decision RecoveryDecision,
	input DecisionTelemetryInput,
) (DecisionTelemetryPayload, error) {
	source := strings.TrimSpace(decision.SelectedSource)
	commit := strings.TrimSpace(decision.SelectedCommit)
	reason := strings.TrimSpace(decision.Reason)

	if source == "" {
		return DecisionTelemetryPayload{}, errors.New("selected source is required")
	}

	if reason == "" {
		return DecisionTelemetryPayload{}, errors.New("decision reason is required")
	}

	return DecisionTelemetryPayload{
		Decision:        decisionType(source, decision.Ready),
		SelectedSource:  source,
		SelectedCommit:  commit,
		LocalAvailable:  input.LocalAvailable,
		LocalVerified:   input.LocalVerified,
		GitHubAvailable: input.GitHubAvailable,
		GitHubVerified:  input.GitHubVerified,
		LKGAvailable:    input.LKGAvailable,
		LKGVerified:     input.LKGVerified,
		Ready:           decision.Ready,
		Reason:          reason,
		RecordedAt:      time.Now().UTC(),
	}, nil
}

func decisionType(source string, ready bool) string {
	if !ready {
		return "FAIL_CLOSED"
	}

	switch strings.ToLower(source) {
	case "local":
		return "LOCAL_PREFERRED"
	case "github":
		return "GITHUB_FALLBACK"
	case "last_known_good":
		return "LAST_KNOWN_GOOD_FALLBACK"
	default:
		return "RECOVERY_DECISION"
	}
}

func MarshalDecisionTelemetry(
	payload DecisionTelemetryPayload,
) (string, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	return string(data), nil
}
