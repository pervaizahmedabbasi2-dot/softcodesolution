package code_source_recovery

import (
	"errors"
	"time"
)

var (
	ErrNoRecoverySource = errors.New("no verified recovery source available")
)

type Service struct {
	current       SourceRecord
	lastKnownGood SourceRecord
}

func NewService(
	current SourceRecord,
	lastKnownGood SourceRecord,
) *Service {
	return &Service{
		current:       current,
		lastKnownGood: lastKnownGood,
	}
}

func (s *Service) Current() SourceRecord {
	return s.current
}

func (s *Service) LastKnownGood() SourceRecord {
	return s.lastKnownGood
}

func (s *Service) MarkKnownGood(
	record SourceRecord,
) {
	record.LastKnownGood = true

	if record.VerifiedAt.IsZero() {
		record.VerifiedAt = time.Now().UTC()
	}

	record.State = StateVerified

	s.lastKnownGood = record
}

func (s *Service) Decide() (RecoveryDecision, error) {
	/*
	   Prefer the current source only when it is verified.
	   Fall back to the last-known-good verified source.
	*/

	if s.current.State == StateVerified &&
		s.current.Commit != "" {

		return RecoveryDecision{
			SelectedSource: s.current.Provider,
			SelectedCommit: s.current.Commit,
			Reason:         "current source is verified",
			Ready:          true,
		}, nil
	}

	if s.lastKnownGood.State == StateVerified &&
		s.lastKnownGood.Commit != "" {

		return RecoveryDecision{
			SelectedSource: s.lastKnownGood.Provider,
			SelectedCommit: s.lastKnownGood.Commit,
			Reason:         "current source unavailable or unverified; using last-known-good source",
			Ready:          true,
		}, nil
	}

	return RecoveryDecision{}, ErrNoRecoverySource
}

func (s *Service) Status() (Status, error) {
	decision, err := s.Decide()

	if err != nil {
		return Status{
			Current:       s.current,
			LastKnownGood: s.lastKnownGood,
			UpdatedAt:     time.Now().UTC(),
		}, err
	}

	return Status{
		Current:       s.current,
		LastKnownGood: s.lastKnownGood,
		Decision:      decision,
		UpdatedAt:     time.Now().UTC(),
	}, nil
}
