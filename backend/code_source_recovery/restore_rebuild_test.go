package code_source_recovery

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestRestoreLocalSourceCreatesIsolatedWorkspace(t *testing.T) {
	root := t.TempDir()

	if err := os.WriteFile(filepath.Join(root, "main.go"), []byte("package main\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	service := NewRestoreRebuildService(root)

	result, err := service.RestoreLocalSource(
		SourceCandidate{
			Name:              "local",
			Commit:            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			Available:         true,
			IntegrityVerified: true,
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	if !result.Restored {
		t.Fatal("expected restored source")
	}

	if result.Workspace == root {
		t.Fatal("workspace must be isolated from project root")
	}

	if _, err := os.Stat(filepath.Join(result.Workspace, "main.go")); err != nil {
		t.Fatal(err)
	}
}

func TestRestoreRejectsUnverifiedSource(t *testing.T) {
	service := NewRestoreRebuildService(t.TempDir())

	_, err := service.RestoreLocalSource(
		SourceCandidate{
			Name:              "local",
			Commit:            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			Available:         true,
			IntegrityVerified: false,
		},
	)

	if err == nil {
		t.Fatal("expected restore rejection")
	}
}

func TestRestoreSkipsRuntimeDirectories(t *testing.T) {
	root := t.TempDir()

	if err := os.MkdirAll(filepath.Join(root, ".git"), 0o755); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(root, "main.go"), []byte("package main\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(root, ".git", "object"), []byte("ignored"), 0o644); err != nil {
		t.Fatal(err)
	}

	service := NewRestoreRebuildService(root)

	result, err := service.RestoreLocalSource(
		SourceCandidate{
			Name:              "local",
			Commit:            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			Available:         true,
			IntegrityVerified: true,
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	if _, err := os.Stat(filepath.Join(result.Workspace, ".git")); !os.IsNotExist(err) {
		t.Fatal(".git should not be restored into recovery workspace")
	}
}

func TestRebuildRequiresVerifiedRestore(t *testing.T) {
	service := NewRestoreRebuildService(t.TempDir())

	_, err := service.Rebuild(
		context.Background(),
		RestoreResult{
			Restored:          true,
			IntegrityVerified: false,
		},
	)

	if err == nil {
		t.Fatal("expected rebuild rejection")
	}
}
