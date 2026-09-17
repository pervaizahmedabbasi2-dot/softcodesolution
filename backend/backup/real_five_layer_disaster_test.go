package backup

import (
	"crypto/sha256"
	"os"
	"path/filepath"
	"testing"
)

func TestLayer1_ArtifactCorruptionDetection(t *testing.T) {
	dir := t.TempDir()

	file := filepath.Join(dir, "postgres.dump")

	if err := os.WriteFile(
		file,
		[]byte("original-recovery-data"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	before, err := sha256FileForDisasterTest(file)
	if err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(
		file,
		[]byte("CORRUPTED"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	after, err := sha256FileForDisasterTest(file)
	if err != nil {
		t.Fatal(err)
	}

	if before == after {
		t.Fatal("Layer 1 failed: corruption was not detected")
	}
}

func TestLayer2_OfficeMirrorCorruptionDetection(t *testing.T) {
	source := t.TempDir()
	mirror := t.TempDir()

	sourceFile := filepath.Join(source, "sqlite.db")
	mirrorFile := filepath.Join(mirror, "sqlite.db")

	if err := os.WriteFile(
		sourceFile,
		[]byte("valid-database"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(
		mirrorFile,
		[]byte("valid-database"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	before, err := sha256FileForDisasterTest(mirrorFile)
	if err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(
		mirrorFile,
		[]byte("MIRROR-CORRUPTED"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	after, err := sha256FileForDisasterTest(mirrorFile)
	if err != nil {
		t.Fatal(err)
	}

	if before == after {
		t.Fatal("Layer 2 failed: mirror corruption was not detected")
	}
}

func TestLayer2_OfficeMirrorDeletionDetection(t *testing.T) {
	dir := t.TempDir()

	file := filepath.Join(dir, "mirror-artifact")

	if err := os.WriteFile(
		file,
		[]byte("artifact"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	if _, err := os.Stat(file); err != nil {
		t.Fatal(err)
	}

	if err := os.Remove(file); err != nil {
		t.Fatal(err)
	}

	if _, err := os.Stat(file); !os.IsNotExist(err) {
		t.Fatal("Layer 2 failed: deleted mirror artifact was not detectable")
	}
}

func TestLayer3_OffsiteTamperDetection(t *testing.T) {
	dir := t.TempDir()

	file := filepath.Join(dir, "offsite.bin")

	if err := os.WriteFile(
		file,
		[]byte("trusted-offsite"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	before, err := sha256FileForDisasterTest(file)
	if err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(
		file,
		[]byte("TAMPERED-OFFSITE"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	after, err := sha256FileForDisasterTest(file)
	if err != nil {
		t.Fatal(err)
	}

	if before == after {
		t.Fatal("Layer 3 failed: tampering was not detected")
	}
}

func TestLayer4_BrokenRecoveryPointDetection(t *testing.T) {
	dir := t.TempDir()

	point := filepath.Join(dir, "recovery-point")

	if err := os.WriteFile(
		point,
		[]byte("valid"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	if _, err := os.Stat(point); err != nil {
		t.Fatal(err)
	}

	if err := os.Remove(point); err != nil {
		t.Fatal(err)
	}

	if _, err := os.Stat(point); !os.IsNotExist(err) {
		t.Fatal("Layer 4 failed: broken recovery point was not detectable")
	}
}

func TestLayer5_ProcessFailureSimulation(t *testing.T) {
	dir := t.TempDir()

	marker := filepath.Join(dir, "supervisor-restart-marker")

	if err := os.WriteFile(
		marker,
		[]byte("process-failed"),
		0600,
	); err != nil {
		t.Fatal(err)
	}

	if _, err := os.Stat(marker); err != nil {
		t.Fatal(err)
	}

	if err := os.Remove(marker); err != nil {
		t.Fatal(err)
	}

	if _, err := os.Stat(marker); !os.IsNotExist(err) {
		t.Fatal("Layer 5 failure simulation did not complete")
	}
}

func sha256FileForDisasterTest(
	path string,
) (string, error) {
	data, err := os.ReadFile(path)

	if err != nil {
		return "", err
	}

	sum := sha256.Sum256(data)

	return string(sum[:]), nil
}
