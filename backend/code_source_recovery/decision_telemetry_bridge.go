package code_source_recovery

import "errors"

// DecisionTelemetryRecorder keeps the recovery package independent
// from the backup package while allowing the real runtime recorder
// to be supplied by the orchestration layer.
type DecisionTelemetryRecorder interface {
	RecordRecoveryEvent(
		recoveryID string,
		eventType string,
		status string,
		component string,
		message string,
	) error
}

// RecordDecisionTelemetry persists the computed recovery decision
// through the existing Layer-5 recovery-event contract.
func RecordDecisionTelemetry(
	recorder DecisionTelemetryRecorder,
	recoveryID string,
	decision RecoveryDecision,
	input DecisionTelemetryInput,
) error {
	if recorder == nil {
		return errors.New("decision telemetry recorder unavailable")
	}

	if recoveryID == "" {
		return errors.New("recovery id is required")
	}

	payload, err := BuildDecisionTelemetry(
		decision,
		input,
	)
	if err != nil {
		return err
	}

	message, err := MarshalDecisionTelemetry(payload)
	if err != nil {
		return err
	}

	status := "blocked"

	if payload.Ready {
		status = "ready"
	}

	return recorder.RecordRecoveryEvent(
		recoveryID,
		DecisionTelemetryEventType,
		status,
		"code_source_recovery",
		message,
	)
}
