package code_source_recovery

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSourceIntegrityDigestIsDeterministic(t *testing.T) {
	root := t.TempDir()

	if err := os.MkdirAll(filepath.Join(root, "src"), 0o755); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(root, "src", "a.txt"), []byte("alpha"), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(root, "src", "b.txt"), []byte("beta"), 0o644); err != nil {
		t.Fatal(err)
	}

	verifier := NewSourceIntegrityVerifier(root)

	first, err := verifier.Digest()
	if err != nil {
		t.Fatal(err)
	}

	second, err := verifier.Digest()
	if err != nil {
		t.Fatal(err)
	}

	if first.Digest != second.Digest {
		t.Fatalf("digest is not deterministic")
	}

	if first.Files != 2 {
		t.Fatalf("expected 2 files, got %d", first.Files)
	}

	if len(first.Digest) != 64 {
		t.Fatalf("expected SHA-256 digest, got %d characters", len(first.Digest))
	}
}

func TestSourceIntegrityChangesWhenFileChanges(t *testing.T) {
	root := t.TempDir()
	file := filepath.Join(root, "source.txt")

	if err := os.WriteFile(file, []byte("before"), 0o644); err != nil {
		t.Fatal(err)
	}

	verifier := NewSourceIntegrityVerifier(root)

	before, err := verifier.Digest()
	if err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(file, []byte("after"), 0o644); err != nil {
		t.Fatal(err)
	}

	after, err := verifier.Digest()
	if err != nil {
		t.Fatal(err)
	}

	if before.Digest == after.Digest {
		t.Fatal("digest did not change after source mutation")
	}
}

func TestSourceIntegrityDetectsAddedFile(t *testing.T) {
	root := t.TempDir()

	if err := os.WriteFile(filepath.Join(root, "one.txt"), []byte("one"), 0o644); err != nil {
		t.Fatal(err)
	}

	verifier := NewSourceIntegrityVerifier(root)

	before, err := verifier.Digest()
	if err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(root, "two.txt"), []byte("two"), 0o644); err != nil {
		t.Fatal(err)
	}

	after, err := verifier.Digest()
	if err != nil {
		t.Fatal(err)
	}

	if before.Digest == after.Digest {
		t.Fatal("digest did not change after file addition")
	}
}

func TestExcludedDirectoriesAreIgnored(t *testing.T) {
	root := t.TempDir()

	if err := os.MkdirAll(filepath.Join(root, ".git"), 0o755); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(root, "main.go"), []byte("source"), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(root, ".git", "ignored"), []byte("noise"), 0o644); err != nil {
		t.Fatal(err)
	}

	verifier := NewSourceIntegrityVerifier(root)

	result, err := verifier.Digest()
	if err != nil {
		t.Fatal(err)
	}

	if result.Files != 1 {
		t.Fatalf("expected only source file to be counted, got %d", result.Files)
	}
}

func TestVerifyExpectedAcceptsMatchingDigest(t *testing.T) {
	root := t.TempDir()

	if err := os.WriteFile(filepath.Join(root, "main.go"), []byte("source"), 0o644); err != nil {
		t.Fatal(err)
	}

	verifier := NewSourceIntegrityVerifier(root)

	original, err := verifier.Digest()
	if err != nil {
		t.Fatal(err)
	}

	verified, err := verifier.VerifyExpected(original.Digest)
	if err != nil {
		t.Fatal(err)
	}

	if !verified.Verified {
		t.Fatal("expected integrity verification to pass")
	}
}

func TestVerifyExpectedRejectsMismatch(t *testing.T) {
	root := t.TempDir()

	if err := os.WriteFile(filepath.Join(root, "main.go"), []byte("source"), 0o644); err != nil {
		t.Fatal(err)
	}

	verifier := NewSourceIntegrityVerifier(root)

	_, err := verifier.VerifyExpected(
		"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	)

	if err == nil {
		t.Fatal("expected integrity mismatch")
	}
}
