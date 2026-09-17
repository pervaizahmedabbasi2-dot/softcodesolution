package code_source_recovery

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestLastKnownGoodStoreSaveLoad(t *testing.T) {
	root := t.TempDir()
	store := NewLastKnownGoodStore(
		filepath.Join(root, "recovery", "last-known-good.json"),
	)

	state := LastKnownGoodState{
		Commit:     "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		Repository: "example/project",
		Branch:     "main",
		Source:     "github",
		Integrity:  "verified",
		VerifiedAt: time.Now().UTC(),
	}

	if err := store.Save(state); err != nil {
		t.Fatal(err)
	}

	loaded, err := store.Load()
	if err != nil {
		t.Fatal(err)
	}

	if loaded.Commit != state.Commit {
		t.Fatalf("commit mismatch: %s != %s", loaded.Commit, state.Commit)
	}

	if loaded.Repository != state.Repository {
		t.Fatalf("repository mismatch")
	}

	if loaded.Branch != "main" {
		t.Fatalf("branch mismatch")
	}

	if loaded.Source != "github" {
		t.Fatalf("source mismatch")
	}

	if loaded.Integrity != "verified" {
		t.Fatalf("integrity mismatch")
	}

	if loaded.UpdatedAt.IsZero() {
		t.Fatal("updated_at missing")
	}
}

func TestLastKnownGoodRejectsBadCommit(t *testing.T) {
	root := t.TempDir()
	store := NewLastKnownGoodStore(
		filepath.Join(root, "last-known-good.json"),
	)

	err := store.Save(LastKnownGoodState{
		Commit: "914f5d2",
	})

	if err == nil {
		t.Fatal("expected invalid commit error")
	}
}

func TestRecordVerifiedSnapshot(t *testing.T) {
	root := t.TempDir()
	file := filepath.Join(root, "last-known-good.json")
	store := NewLastKnownGoodStore(file)

	state, err := store.RecordVerifiedSnapshot(
		CommitSnapshot{
			Repository: "example/project",
			Branch:     "main",
			SHA:        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		},
		"github",
	)

	if err != nil {
		t.Fatal(err)
	}

	if state.Commit != "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" {
		t.Fatalf("unexpected commit: %s", state.Commit)
	}

	if state.Integrity != "verified" {
		t.Fatalf("unexpected integrity: %s", state.Integrity)
	}

	if _, err := os.Stat(file); err != nil {
		t.Fatal(err)
	}
}
