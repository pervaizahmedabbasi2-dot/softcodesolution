package code_source_recovery

import "time"

type SourceState string

const (
	StateUnavailable SourceState = "UNAVAILABLE"
	StateAvailable   SourceState = "AVAILABLE"
	StateVerified    SourceState = "VERIFIED"
	StateFailed      SourceState = "FAILED"
)

type SourceRecord struct {
	Provider      string      `json:"provider"`
	Repository    string      `json:"repository"`
	Branch        string      `json:"branch"`
	Commit        string      `json:"commit"`
	State         SourceState `json:"state"`
	Integrity     string      `json:"integrity"`
	VerifiedAt    time.Time   `json:"verified_at,omitempty"`
	LastKnownGood bool        `json:"last_known_good"`
}

type RecoveryDecision struct {
	SelectedSource string `json:"selected_source"`
	SelectedCommit string `json:"selected_commit"`
	Reason         string `json:"reason"`
	Ready          bool   `json:"ready"`
}

type Status struct {
	Current       SourceRecord     `json:"current"`
	LastKnownGood SourceRecord     `json:"last_known_good"`
	Decision      RecoveryDecision `json:"decision"`
	UpdatedAt     time.Time        `json:"updated_at"`
}
