package backup

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

type OffsiteCopyResult struct {
	Provider       string
	Status         string
	Path           string
	SHA256         string
	RetentionUntil time.Time
	Verified       bool
}

type offsiteManifest struct {
	RecoveryID     string    `json:"recovery_id"`
	SourceMirror   string    `json:"source_mirror"`
	Provider       string    `json:"provider"`
	CreatedAt      time.Time `json:"created_at"`
	RetentionUntil time.Time `json:"retention_until"`
	PackageSHA256  string    `json:"package_sha256"`
}

func (s *Service) createOffsiteCopy(
	recoveryID string,
	officeMirrorPath string,
) OffsiteCopyResult {

	retentionDays := 30

	if raw := strings.TrimSpace(
		os.Getenv("SCS_OFFSITE_RETENTION_DAYS"),
	); raw != "" {
		if value, err := strconv.Atoi(raw); err == nil &&
			value > 0 {
			retentionDays = value
		}
	}

	retentionUntil :=
		time.Now().UTC().Add(
			time.Duration(retentionDays) *
				24 *
				time.Hour,
		)

	rcloneRemote := strings.TrimSpace(os.Getenv("SCS_OFFSITE_RCLONE_REMOTE"))
	root := strings.TrimSpace(os.Getenv("SCS_OFFSITE_ROOT"))

	if root == "" && rcloneRemote == "" {
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "not-configured",
			RetentionUntil: retentionUntil,
		}
	}

	if recoveryID == "" || officeMirrorPath == "" {
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed",
			RetentionUntil: retentionUntil,
		}
	}

	if _, err := os.Stat(officeMirrorPath); err != nil {
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed",
			RetentionUntil: retentionUntil,
		}
	}

	/*
	 * Filesystem offsite is the primary local verified path when
	 * SCS_OFFSITE_ROOT is configured.
	 *
	 * rclone is used only when no filesystem offsite root exists.
	 * This prevents a configured rclone environment from breaking
	 * the verified filesystem recovery path.
	 */
	if rcloneRemote != "" && root == "" {
		targetRemote := fmt.Sprintf("%s/%s", strings.TrimSuffix(rcloneRemote, "/"), recoveryID)

		if !commandExists("rclone") {
			return OffsiteCopyResult{
				Provider:       "rclone",
				Status:         "failed",
				Path:           targetRemote,
				RetentionUntil: retentionUntil,
				Verified:       false,
			}
		}

		packageSHA, err := directorySHA256(officeMirrorPath)
		if err != nil {
			return OffsiteCopyResult{
				Provider:       "rclone",
				Status:         "failed",
				Path:           targetRemote,
				RetentionUntil: retentionUntil,
				Verified:       false,
			}
		}

		cmd := exec.Command(
			"rclone",
			"copy",
			officeMirrorPath,
			targetRemote,
			"--checksum",
		)
		if output, err := cmd.CombinedOutput(); err != nil {
			_ = output
			return OffsiteCopyResult{
				Provider:       "rclone",
				Status:         "failed",
				Path:           targetRemote,
				SHA256:         packageSHA,
				RetentionUntil: retentionUntil,
				Verified:       false,
			}
		}

		verifyCmd := exec.Command(
			"rclone",
			"check",
			officeMirrorPath,
			targetRemote,
			"--one-way",
		)
		if output, err := verifyCmd.CombinedOutput(); err != nil {
			_ = output
			return OffsiteCopyResult{
				Provider:       "rclone",
				Status:         "failed",
				Path:           targetRemote,
				SHA256:         packageSHA,
				RetentionUntil: retentionUntil,
				Verified:       false,
			}
		}

		return OffsiteCopyResult{
			Provider:       "rclone",
			Status:         "verified",
			Path:           targetRemote,
			SHA256:         packageSHA,
			RetentionUntil: retentionUntil,
			Verified:       true,
		}
	}

	_ = s.enforceFilesystemRetention(root)

	destination := filepath.Join(root, recoveryID)

	/*
	 * Never overwrite an existing Recovery Point.
	 */
	if _, err := os.Stat(destination); err == nil {
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed",
			Path:           destination,
			RetentionUntil: retentionUntil,
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed",
			Path:           destination,
			RetentionUntil: retentionUntil,
		}
	}

	if err := copyDirectory(officeMirrorPath, destination); err != nil {
		_ = os.RemoveAll(destination)
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed: copyDirectory: " + err.Error(),
			Path:           destination,
			RetentionUntil: retentionUntil,
		}
	}

	packageSHA, err := directorySHA256(destination)
	if err != nil {
		_ = os.RemoveAll(destination)
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed: directorySHA256: " + err.Error(),
			Path:           destination,
			RetentionUntil: retentionUntil,
		}
	}

	metadata := offsiteManifest{
		RecoveryID:     recoveryID,
		SourceMirror:   officeMirrorPath,
		Provider:       "filesystem",
		CreatedAt:      time.Now().UTC(),
		RetentionUntil: retentionUntil,
		PackageSHA256:  packageSHA,
	}

	metadataBytes, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		_ = os.RemoveAll(destination)
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed: directorySHA256: " + err.Error(),
			Path:           destination,
			RetentionUntil: retentionUntil,
		}
	}

	metadataPath := filepath.Join(destination, "OFFSITE-MANIFEST.json")
	if err := os.WriteFile(metadataPath, metadataBytes, 0400); err != nil {
		_ = os.RemoveAll(destination)
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed: manifest write: " + err.Error(),
			Path:           destination,
			RetentionUntil: retentionUntil,
		}
	}

	if err := makeReadOnlyTree(destination); err != nil {
		_ = os.RemoveAll(destination)
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed: makeReadOnlyTree: " + err.Error(),
			Path:           destination,
			RetentionUntil: retentionUntil,
		}
	}

	verifiedSHA, err := directorySHA256(destination)
	if err != nil || verifiedSHA != packageSHA {
		_ = removeRecoveryTree(destination)
		return OffsiteCopyResult{
			Provider:       "filesystem",
			Status:         "failed",
			Path:           destination,
			RetentionUntil: retentionUntil,
			Verified:       false,
		}
	}

	return OffsiteCopyResult{
		Provider:       "filesystem",
		Status:         "verified",
		Path:           destination,
		SHA256:         verifiedSHA,
		RetentionUntil: retentionUntil,
		Verified:       true,
	}
}

func (s *Service) enforceFilesystemRetention(root string) error {
	if strings.TrimSpace(root) == "" {
		return nil
	}

	entries, err := os.ReadDir(root)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}

	now := time.Now().UTC()
	var dirNames []string
	for _, entry := range entries {
		if entry.IsDir() {
			dirNames = append(dirNames, entry.Name())
		}
	}

	if len(dirNames) <= 1 {
		return nil
	}

	sort.Strings(dirNames)
	latestID := dirNames[len(dirNames)-1]

	for _, name := range dirNames {
		if name == latestID {
			continue
		}

		manifestPath := filepath.Join(root, name, "OFFSITE-MANIFEST.json")
		data, err := os.ReadFile(manifestPath)
		if err != nil {
			continue
		}

		var manifest offsiteManifest
		if err := json.Unmarshal(data, &manifest); err != nil {
			continue
		}

		if !manifest.RetentionUntil.IsZero() && manifest.RetentionUntil.Before(now) {
			_ = removeRecoveryTree(filepath.Join(root, name))
		}
	}

	return nil
}

func copyDirectory(source string, destination string) error {
	return filepath.Walk(source, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relative, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}

		target := filepath.Join(destination, relative)

		if info.IsDir() {
			return os.MkdirAll(target, 0700)
		}

		if !info.Mode().IsRegular() {
			return nil
		}

		return copyFile(path, target)
	})
}

func directorySHA256(root string) (string, error) {
	var files []string

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		if info.Name() == "OFFSITE-MANIFEST.json" {
			return nil
		}

		if info.Mode().IsRegular() {
			files = append(files, path)
		}

		return nil
	})

	if err != nil {
		return "", err
	}

	sort.Strings(files)

	hash := sha256.New()

	for _, file := range files {
		relative, err := filepath.Rel(root, file)
		if err != nil {
			return "", err
		}

		contentHash, _, err := fileHash(file)
		if err != nil {
			return "", err
		}

		_, _ = io.WriteString(hash, relative)
		_, _ = io.WriteString(hash, "\n")
		_, _ = io.WriteString(hash, contentHash)
		_, _ = io.WriteString(hash, "\n")
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

func makeReadOnlyTree(root string) error {
	var paths []string

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		paths = append(paths, path)
		return nil
	})

	if err != nil {
		return err
	}

	for i := len(paths) - 1; i >= 0; i-- {
		info, err := os.Stat(paths[i])
		if err != nil {
			return err
		}

		mode := os.FileMode(0400)
		if info.IsDir() {
			mode = 0500
		}

		if err := os.Chmod(paths[i], mode); err != nil {
			return err
		}
	}

	return nil
}
