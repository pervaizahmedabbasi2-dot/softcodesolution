package code_source_recovery

import "testing"

func candidate(name, commit string, available, verified bool) SourceCandidate {
	return SourceCandidate{
		Name:              name,
		Commit:            commit,
		Available:         available,
		IntegrityVerified: verified,
	}
}

func TestLocalSourceWinsWhenVerified(t *testing.T) {
	selector := NewSourceFallbackSelector()

	decision, err := selector.Select(
		candidate("local", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", true, true),
		candidate("github", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", true, true),
		candidate("last_known_good", "cccccccccccccccccccccccccccccccccccccc", true, true),
	)

	if err != nil {
		t.Fatal(err)
	}

	if decision.SelectedSource != "local" {
		t.Fatalf("expected local, got %s", decision.SelectedSource)
	}

	if !decision.Ready {
		t.Fatal("expected ready decision")
	}
}

func TestGitHubFallbackWhenLocalFails(t *testing.T) {
	selector := NewSourceFallbackSelector()

	decision, err := selector.Select(
		candidate("local", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", false, false),
		candidate("github", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", true, true),
		candidate("last_known_good", "cccccccccccccccccccccccccccccccccccccc", true, true),
	)

	if err != nil {
		t.Fatal(err)
	}

	if decision.SelectedSource != "github" {
		t.Fatalf("expected github, got %s", decision.SelectedSource)
	}
}

func TestGitHubUnverifiedFallsToLastKnownGood(t *testing.T) {
	selector := NewSourceFallbackSelector()

	decision, err := selector.Select(
		candidate("local", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", false, false),
		candidate("github", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", true, false),
		candidate("last_known_good", "cccccccccccccccccccccccccccccccccccccc", true, true),
	)

	if err != nil {
		t.Fatal(err)
	}

	if decision.SelectedSource != "last_known_good" {
		t.Fatalf("expected last_known_good, got %s", decision.SelectedSource)
	}
}

func TestAllSourcesUnavailableFailsClosed(t *testing.T) {
	selector := NewSourceFallbackSelector()

	decision, err := selector.Select(
		candidate("local", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", false, false),
		candidate("github", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", false, false),
		candidate("last_known_good", "cccccccccccccccccccccccccccccccccccccc", false, false),
	)

	if err == nil {
		t.Fatal("expected failure")
	}

	if decision.Ready {
		t.Fatal("expected recovery not ready")
	}
}
