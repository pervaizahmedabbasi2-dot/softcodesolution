package code_source_recovery

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"sync"
	"time"
)

var ErrInvalidKnownGoodCommit = errors.New("invalid last known good commit")

type LastKnownGoodStore struct {
	path string
	mu   sync.RWMutex
}

type LastKnownGoodState struct {
	Commit     string    `json:"commit"`
	Repository string    `json:"repository"`
	Branch     string    `json:"branch"`
	Source     string    `json:"source"`
	Integrity  string    `json:"integrity"`
	VerifiedAt time.Time `json:"verified_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func NewLastKnownGoodStore(path string) *LastKnownGoodStore {
	return &LastKnownGoodStore{path: path}
}

func validKnownGoodCommit(commit string) bool {
	if len(commit) != 40 {
		return false
	}

	matched, err := regexp.MatchString(
		`^[0-9a-fA-F]{40}$`,
		commit,
	)

	return err == nil && matched
}

func (s *LastKnownGoodStore) Load() (LastKnownGoodState, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(s.path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return LastKnownGoodState{}, nil
		}
		return LastKnownGoodState{}, err
	}

	var state LastKnownGoodState

	if err := json.Unmarshal(data, &state); err != nil {
		return LastKnownGoodState{}, err
	}

	if state.Commit != "" && !validKnownGoodCommit(state.Commit) {
		return LastKnownGoodState{}, ErrInvalidKnownGoodCommit
	}

	return state, nil
}

func (s *LastKnownGoodStore) Save(state LastKnownGoodState) error {
	if state.Commit == "" || !validKnownGoodCommit(state.Commit) {
		return ErrInvalidKnownGoodCommit
	}

	if state.VerifiedAt.IsZero() {
		state.VerifiedAt = time.Now().UTC()
	}

	state.UpdatedAt = time.Now().UTC()

	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}

	data = append(data, 10)

	s.mu.Lock()
	defer s.mu.Unlock()

	if err := os.MkdirAll(filepath.Dir(s.path), 0o755); err != nil {
		return err
	}

	temp := s.path + ".tmp"

	if err := os.WriteFile(temp, data, 0o600); err != nil {
		return err
	}

	if err := os.Rename(temp, s.path); err != nil {
		_ = os.Remove(temp)
		return err
	}

	return nil
}

func (s *LastKnownGoodStore) RecordVerifiedSnapshot(snapshot CommitSnapshot, source string) (LastKnownGoodState, error) {
	if !validKnownGoodCommit(snapshot.SHA) {
		return LastKnownGoodState{}, ErrInvalidKnownGoodCommit
	}

	state := LastKnownGoodState{
		Commit:     snapshot.SHA,
		Repository: snapshot.Repository,
		Branch:     snapshot.Branch,
		Source:     source,
		Integrity:  "verified",
		VerifiedAt: time.Now().UTC(),
	}

	if err := s.Save(state); err != nil {
		return LastKnownGoodState{}, err
	}

	return state, nil
}
