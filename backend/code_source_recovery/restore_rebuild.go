package code_source_recovery

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type RestoreResult struct {
	Workspace         string
	Source            string
	Commit            string
	Restored          bool
	IntegrityVerified bool
	Rebuilt           bool
	BuildOutput       string
	CompletedAt       time.Time
}

type RestoreRebuildService struct {
	Root    string
	WorkDir string
}

func NewRestoreRebuildService(root string) *RestoreRebuildService {
	root = strings.TrimSpace(root)

	workDir := filepath.Join(
		root,
		".scs-recovery-workspaces",
	)

	return &RestoreRebuildService{
		Root:    root,
		WorkDir: workDir,
	}
}

func (s *RestoreRebuildService) createWorkspace() (string, error) {
	if err := os.MkdirAll(s.WorkDir, 0o700); err != nil {
		return "", err
	}

	workspace, err := os.MkdirTemp(
		s.WorkDir,
		"recovery-*",
	)
	if err != nil {
		return "", err
	}

	return workspace, nil
}

func copyFile(source, destination string) error {
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()

	info, err := input.Stat()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(destination), 0o755); err != nil {
		return err
	}

	output, err := os.OpenFile(
		destination,
		os.O_CREATE|os.O_WRONLY|os.O_TRUNC,
		info.Mode().Perm(),
	)
	if err != nil {
		return err
	}

	defer output.Close()

	buffer := make([]byte, 64*1024)

	for {
		count, readErr := input.Read(buffer)

		if count > 0 {
			if _, err := output.Write(buffer[:count]); err != nil {
				return err
			}
		}

		if readErr != nil {
			if readErr.Error() == "EOF" {
				return nil
			}
			return readErr
		}
	}
}

func shouldSkipRestorePath(relative string) bool {
	relative = filepath.ToSlash(relative)

	if relative == "" || relative == "." {
		return true
	}

	for _, part := range strings.Split(relative, "/") {
		switch part {
		case ".git", ".scs-recovery-workspaces", ".scs-patch-backups", ".postgres", "node_modules", "dist":
			return true
		}
	}

	return false
}

func copyTree(sourceRoot, destinationRoot string) error {
	return filepath.Walk(sourceRoot, func(sourcePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relative, err := filepath.Rel(sourceRoot, sourcePath)
		if err != nil {
			return err
		}

		if relative == "." {
			return nil
		}

		if shouldSkipRestorePath(relative) {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		destination := filepath.Join(destinationRoot, relative)

		if info.IsDir() {
			return os.MkdirAll(destination, info.Mode().Perm())
		}

		return copyFile(sourcePath, destination)
	})
}

func (s *RestoreRebuildService) RestoreLocalSource(
	candidate SourceCandidate,
) (RestoreResult, error) {

	if !candidate.Available || !candidate.IntegrityVerified {
		return RestoreResult{}, fmt.Errorf("local source is not usable")
	}

	workspace, err := s.createWorkspace()
	if err != nil {
		return RestoreResult{}, err
	}

	if err := copyTree(s.Root, workspace); err != nil {
		return RestoreResult{}, err
	}

	result := RestoreResult{
		Workspace:         workspace,
		Source:            candidate.Name,
		Commit:            candidate.Commit,
		Restored:          true,
		IntegrityVerified: true,
	}

	return result, nil
}

func runCommand(ctx context.Context, workspace, command string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, command, args...)
	cmd.Dir = workspace

	output, err := cmd.CombinedOutput()
	text := strings.TrimSpace(string(output))

	if err != nil {
		return text, fmt.Errorf("%s: %w", text, err)
	}

	return text, nil
}

func (s *RestoreRebuildService) Rebuild(ctx context.Context, result RestoreResult) (RestoreResult, error) {
	if !result.Restored || !result.IntegrityVerified {
		return result, fmt.Errorf("restore must be verified before rebuild")
	}

	if strings.TrimSpace(result.Workspace) == "" {
		return result, fmt.Errorf("recovery workspace is missing")
	}

	output, err := runCommand(
		ctx,
		result.Workspace,
		"go",
		"build",
		"./...",
	)
	if err != nil {
		result.BuildOutput = output
		result.Rebuilt = false
		return result, err
	}

	result.BuildOutput = output
	result.Rebuilt = true
	result.CompletedAt = time.Now().UTC()

	return result, nil
}
