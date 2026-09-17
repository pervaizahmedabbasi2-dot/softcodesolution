package backup

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"time"

	"scs-backend/backend/guardian"
)

type persistedGuardianSupervisorState struct {
	RestartCount int `json:"restart_count"`
}

/*
 * InitializeGuardianSupervisorTelemetry initializes the
 * authoritative runtime telemetry state and persists the
 * process restart count.
 *
 * The counter survives normal process restarts through a small
 * application-owned state file. It is intentionally not stored
 * in the recovery-event table because it represents supervisor
 * process lifecycle rather than a recovery event.
 */
func (s *Service) InitializeGuardianSupervisorTelemetry(
	statePath string,
) error {
	if s == nil {
		return errors.New("guardian telemetry service unavailable")
	}

	statePath = strings.TrimSpace(statePath)

	if statePath == "" {
		statePath = filepath.Join(
			"logs",
			"guardian-supervisor-state.json",
		)
	}

	if err := os.MkdirAll(
		filepath.Dir(statePath),
		0750,
	); err != nil {
		return err
	}

	state := persistedGuardianSupervisorState{}

	if raw, err := os.ReadFile(statePath); err == nil {
		if err := json.Unmarshal(raw, &state); err != nil {
			return err
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}

	state.RestartCount++

	encoded, err := json.MarshalIndent(
		state,
		"",
		"  ",
	)

	if err != nil {
		return err
	}

	tempPath := statePath + ".tmp"

	if err := os.WriteFile(
		tempPath,
		encoded,
		0600,
	); err != nil {
		return err
	}

	if err := os.Rename(
		tempPath,
		statePath,
	); err != nil {
		_ = os.Remove(tempPath)
		return err
	}

	s.supervisorMu.Lock()

	s.supervisorStatePath = statePath
	s.supervisorCrashRestartCount = state.RestartCount
	s.supervisorHeartbeat = time.Now().UTC()
	s.supervisorOperation = "STARTING"

	s.supervisorMu.Unlock()

	return nil
}

/*
 * SetGuardianHeartbeat records a real heartbeat emitted by
 * the existing Guardian monitor.
 */
func (s *Service) SetGuardianHeartbeat() {
	if s == nil {
		return
	}

	s.supervisorMu.Lock()
	s.supervisorHeartbeat = time.Now().UTC()
	s.supervisorMu.Unlock()
}

/*
 * SetGuardianOperation records the real operation currently
 * being executed by the Guardian monitor.
 */
func (s *Service) SetGuardianOperation(operation string) {
	if s == nil {
		return
	}

	operation = strings.TrimSpace(operation)

	if operation == "" {
		operation = "IDLE"
	}

	s.supervisorMu.Lock()
	s.supervisorOperation = operation
	s.supervisorMu.Unlock()
}

/*
 * GuardianSupervisorTelemetry returns authoritative supervisor
 * telemetry.
 *
 * Heartbeat and operation come from the running Guardian
 * supervisor.
 *
 * Incident history comes from the existing persistent
 * RecoveryEvent stream.
 */
func (s *Service) GuardianSupervisorTelemetry() (
	guardian.SupervisorTelemetry,
	[]RecoveryEvent,
	error,
) {
	if s == nil {
		return guardian.SupervisorTelemetry{}, nil,
			errors.New("guardian telemetry service unavailable")
	}

	s.supervisorMu.RLock()

	heartbeatAt := s.supervisorHeartbeat
	operation := s.supervisorOperation
	restartCount := s.supervisorCrashRestartCount

	s.supervisorMu.RUnlock()

	if heartbeatAt.IsZero() {
		return guardian.SupervisorTelemetry{}, nil,
			errors.New("guardian heartbeat has not been initialized")
	}

	events, err := s.ListRecoveryEvents(
		contextBackground(),
		500,
	)

	if err != nil {
		return guardian.SupervisorTelemetry{}, nil, err
	}

	incidents := make([]RecoveryEvent, 0)

	for _, event := range events {
		status := strings.ToLower(
			strings.TrimSpace(event.Status),
		)

		eventType := strings.ToLower(
			strings.TrimSpace(event.EventType),
		)

		component := strings.ToLower(
			strings.TrimSpace(event.Component),
		)

		if strings.Contains(eventType, "incident") ||
			strings.Contains(component, "incident") ||
			status == "failed" ||
			status == "error" ||
			status == "critical" {

			incidents = append(
				incidents,
				event,
			)

			if len(incidents) >= 20 {
				break
			}
		}
	}

	heartbeat := "STALE"

	if time.Since(heartbeatAt) <= 30*time.Second {
		heartbeat = "LIVE"
	}

	if operation == "" {
		operation = "IDLE"
	}

	telemetry := guardian.SupervisorTelemetry{
		Heartbeat:         heartbeat,
		CrashRestartCount: restartCount,
		IncidentCount:     len(incidents),
		CurrentOperation:  operation,
		LastHeartbeat:     heartbeatAt,
	}

	return telemetry, incidents, nil
}

/*
 * Small context helper keeps the telemetry implementation
 * independent from request lifecycle.
 */
func contextBackground() interface {
	Done() <-chan struct{}
	Err() error
	Deadline() (time.Time, bool)
	Value(any) any
} {
	return backgroundContext{}
}

type backgroundContext struct{}

func (backgroundContext) Done() <-chan struct{} {
	return nil
}

func (backgroundContext) Err() error {
	return nil
}

func (backgroundContext) Deadline() (time.Time, bool) {
	return time.Time{}, false
}

func (backgroundContext) Value(any) any {
	return nil
}
