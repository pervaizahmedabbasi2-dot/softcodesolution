package code_source_recovery

import (
	"strings"
	"testing"
)

func verifiedRecord(
	provider string,
	commit string,
) SourceRecord {
	return SourceRecord{
		Provider:  provider,
		Branch:    "main",
		Commit:    commit,
		State:     StateVerified,
		Integrity: "verified",
	}
}

func TestCurrentVerifiedSourceIsSelected(t *testing.T) {
	service := NewService(
		verifiedRecord(
			"local",
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		),
		verifiedRecord(
			"github",
			"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		),
	)

	decision, err := service.Decide()

	if err != nil {
		t.Fatal(err)
	}

	if decision.SelectedSource != "local" {
		t.Fatalf(
			"expected local, got %s",
			decision.SelectedSource,
		)
	}

	if !decision.Ready {
		t.Fatal("expected recovery to be ready")
	}
}

func TestFallsBackToLastKnownGood(t *testing.T) {
	service := NewService(
		SourceRecord{
			Provider: "local",
			Branch:   "main",
			Commit:   "cccccccccccccccccccccccccccccccccccccccc",
			State:    StateFailed,
		},
		verifiedRecord(
			"github",
			"dddddddddddddddddddddddddddddddddddddddd",
		),
	)

	decision, err := service.Decide()

	if err != nil {
		t.Fatal(err)
	}

	if decision.SelectedSource != "github" {
		t.Fatalf(
			"expected github fallback, got %s",
			decision.SelectedSource,
		)
	}

	if decision.SelectedCommit !=
		"dddddddddddddddddddddddddddddddddddddddd" {
		t.Fatalf(
			"unexpected fallback commit: %s",
			decision.SelectedCommit,
		)
	}
}

func TestNoVerifiedSourceFailsClosed(t *testing.T) {
	service := NewService(
		SourceRecord{
			Provider: "local",
			Branch:   "main",
			State:    StateUnavailable,
		},
		SourceRecord{
			Provider: "github",
			Branch:   "main",
			State:    StateUnavailable,
		},
	)

	_, err := service.Decide()

	if err == nil {
		t.Fatal("expected recovery decision to fail")
	}

	if !strings.Contains(
		err.Error(),
		"no verified recovery source",
	) {
		t.Fatalf(
			"unexpected error: %v",
			err,
		)
	}
}

func TestMarkKnownGood(t *testing.T) {
	service := NewService(
		SourceRecord{},
		SourceRecord{},
	)

	service.MarkKnownGood(
		SourceRecord{
			Provider: "local",
			Branch:   "main",
			Commit:   "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
			State:    StateAvailable,
		},
	)

	record := service.LastKnownGood()

	if record.State != StateVerified {
		t.Fatalf(
			"expected VERIFIED, got %s",
			record.State,
		)
	}

	if !record.LastKnownGood {
		t.Fatal(
			"expected last_known_good=true",
		)
	}

	if record.VerifiedAt.IsZero() {
		t.Fatal(
			"expected verified_at timestamp",
		)
	}
}
