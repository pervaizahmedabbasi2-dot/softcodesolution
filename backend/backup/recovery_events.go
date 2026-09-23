package backup

import (
	"context"
	"errors"
	"strings"
	"time"
)

// RecoveryEvent is the persistent Layer 5 recovery timeline event.
type RecoveryEvent struct {
	ID         int64     `json:"id"`
	RecoveryID string    `json:"recovery_id"`
	EventType  string    `json:"event_type"`
	Status     string    `json:"status"`
	Component  string    `json:"component"`
	Message    string    `json:"message"`
	CreatedAt  time.Time `json:"created_at"`
}

// ensureRecoveryEventSchema creates the Layer 5 event store
// using the existing PostgreSQL database connection.
func (s *Service) ensureRecoveryEventSchema(ctx context.Context) error {
	if s == nil || s.DB == nil {
		return errors.New("recovery event database unavailable")
	}

	statements := []string{
		`CREATE TABLE IF NOT EXISTS recovery_events (
			id BIGSERIAL PRIMARY KEY,
			recovery_id TEXT NOT NULL,
			event_type TEXT NOT NULL,
			status TEXT NOT NULL,
			component TEXT NOT NULL,
			message TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_recovery_events_recovery_id
			ON recovery_events(recovery_id)`,
		`CREATE INDEX IF NOT EXISTS idx_recovery_events_created_at
			ON recovery_events(created_at DESC)`,
	}

	for _, statement := range statements {
		if _, err := s.DB.ExecContext(ctx, statement); err != nil {
			return err
		}
	}

	return nil
}

// recordRecoveryEvent persists one real recovery/reconciliation event.
func (s *Service) recordRecoveryEvent(
	ctx context.Context,
	recoveryID string,
	eventType string,
	status string,
	component string,
	message string,
) error {
	if s == nil {
		return errors.New("recovery event service unavailable")
	}

	recoveryID = strings.TrimSpace(recoveryID)
	eventType = strings.TrimSpace(eventType)
	status = strings.TrimSpace(status)
	component = strings.TrimSpace(component)

	if recoveryID == "" ||
		eventType == "" ||
		status == "" ||
		component == "" {
		return errors.New("recovery event required field missing")
	}
	/*
	 * Explicit E2E/test-only event store.
	 *
	 * Production always uses PostgreSQL.
	 * This branch is reachable only when tests explicitly
	 * enable allowInMemoryEvents.
	 */
	if s.DB == nil {
		if !s.allowInMemoryEvents {
			return errors.New("recovery event database unavailable")
		}

		s.eventMu.Lock()
		defer s.eventMu.Unlock()

		s.testEventSequence++

		s.testEvents = append(
			s.testEvents,
			RecoveryEvent{
				ID:         s.testEventSequence,
				RecoveryID: recoveryID,
				EventType:  eventType,
				Status:     status,
				Component:  component,
				Message:    message,
				CreatedAt:  time.Now().UTC(),
			},
		)

		return nil
	}


	if err := s.ensureRecoveryEventSchema(ctx); err != nil {
		return err
	}

	_, err := s.DB.ExecContext(
		ctx,
		`INSERT INTO recovery_events (
			recovery_id,
			event_type,
			status,
			component,
			message
		) VALUES ($1, $2, $3, $4, $5)`,
		recoveryID,
		eventType,
		status,
		component,
		message,
	)

	return err
}

// RecordRecoveryEvent persists an application-owned recovery
// lifecycle event from the Guardian/runtime control plane.
func (s *Service) RecordRecoveryEvent(
	recoveryID string,
	eventType string,
	status string,
	component string,
	message string,
) error {
	return s.recordRecoveryEvent(
		context.Background(),
		recoveryID,
		eventType,
		status,
		component,
		message,
	)
}

// ListRecoveryEvents returns the newest persistent recovery events.
func (s *Service) ListRecoveryEvents(
	ctx context.Context,
	limit int,
) ([]RecoveryEvent, error) {
	if s == nil {
		return nil, errors.New("recovery event service unavailable")
	}

	if limit <= 0 || limit > 500 {
		limit = 100
	}

	/*
	 * Explicit E2E/test-only read path.
	 *
	 * Production always reads PostgreSQL.
	 */
	if s.DB == nil {
		if !s.allowInMemoryEvents {
			return nil, errors.New("recovery event database unavailable")
		}

		s.eventMu.Lock()
		defer s.eventMu.Unlock()

		events := make([]RecoveryEvent, len(s.testEvents))

		copy(events, s.testEvents)

		for i, j := 0, len(events)-1; i < j; i, j = i+1, j-1 {
			events[i], events[j] = events[j], events[i]
		}

		if len(events) > limit {
			events = events[:limit]
		}

		return events, nil
	}

	if err := s.ensureRecoveryEventSchema(ctx); err != nil {
		return nil, err
	}

	rows, err := s.DB.QueryContext(
		ctx,
		`SELECT
			id,
			recovery_id,
			event_type,
			status,
			component,
			message,
			created_at
		FROM recovery_events
		ORDER BY created_at DESC, id DESC
		LIMIT $1`,
		limit,
	)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	events := make([]RecoveryEvent, 0)

	for rows.Next() {
		var event RecoveryEvent

		if err := rows.Scan(
			&event.ID,
			&event.RecoveryID,
			&event.EventType,
			&event.Status,
			&event.Component,
			&event.Message,
			&event.CreatedAt,
		); err != nil {
			return nil, err
		}

		events = append(events, event)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return events, nil
}
