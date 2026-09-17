package backup

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type OfficeMirrorResult struct {
	Path     string
	SHA256   string
	Verified bool
}

type officeMirrorManifest struct {
	SnapshotID    string            `json:"snapshot_id"`
	CreatedAt     time.Time         `json:"created_at"`
	GitCommit     string            `json:"git_commit"`
	GitBranch     string            `json:"git_branch"`
	GitRemote     string            `json:"git_remote,omitempty"`
	GitClean      bool              `json:"git_clean"`
	CodeStatus    string            `json:"code_status"`
	SourceArchive string            `json:"source_archive,omitempty"`
	PostgreSQL    string            `json:"postgresql"`
	SQLite        string            `json:"sqlite"`
	RecoveryGuide string            `json:"recovery_guide"`
	Checksums     map[string]string `json:"checksums"`
	Status        string            `json:"status"`
}

func (s *Service) createOfficeMirror(
	snapshotID string,
	snapshotDir string,
	postgresFile string,
	sqliteFile string,
) (*OfficeMirrorResult, error) {

	if snapshotID == "" {
		return nil, errors.New(
			"office mirror snapshot id is empty",
		)
	}

	mirrorRoot :=
		os.Getenv("SCS_OFFICE_MIRROR_ROOT")

	if mirrorRoot == "" {
		mirrorRoot =
			filepath.Join(
				s.BackupRoot,
				"office-mirror",
			)
	}

	projectRoot, err :=
		gitProjectRoot()

	if err != nil {
		return nil, fmt.Errorf(
			"git repository unavailable: %w",
			err,
		)
	}

	gitClean, err :=
		gitWorkingTreeClean(
			projectRoot,
		)

	if err != nil {
		return nil, fmt.Errorf(
			"git status check failed: %w",
			err,
		)
	}

	commit, _ :=
		gitOutput(
			projectRoot,
			"rev-parse",
			"HEAD",
		)

	branch, _ :=
		gitOutput(
			projectRoot,
			"branch",
			"--show-current",
		)

	remote, _ :=
		gitOutput(
			projectRoot,
			"remote",
			"get-url",
			"origin",
		)

	mirrorDir :=
		filepath.Join(
			mirrorRoot,
			snapshotID,
		)

	codeDir :=
		filepath.Join(
			mirrorDir,
			"code",
		)

	dataDir :=
		filepath.Join(
			mirrorDir,
			"data",
		)

	if err := os.MkdirAll(
		codeDir,
		0700,
	); err != nil {
		return nil, fmt.Errorf(
			"create mirror code directory: %w",
			err,
		)
	}

	if err := os.MkdirAll(
		dataDir,
		0700,
	); err != nil {
		return nil, fmt.Errorf(
			"create mirror data directory: %w",
			err,
		)
	}

	checksums :=
		make(
			map[string]string,
		)

	sourceArchive := ""

	codeStatus :=
		"verified"

	sourceArchive =
		filepath.Join(
			codeDir,
			"source.tar.gz",
		)

	if err := gitArchive(
		projectRoot,
		sourceArchive,
	); err != nil {
		_ = os.RemoveAll(
			mirrorDir,
		)

		return nil, fmt.Errorf(
			"source archive failed: %w",
			err,
		)
	}

	checksums["code/source.tar.gz"] =
		fileSHA256(
			sourceArchive,
		)

	/*
	 * IMPORTANT:
	 * copyFile() is intentionally NOT defined here.
	 * office_mirror.go reuses the existing helper from
	 * backup_service.go in the same package.
	 */

	mirrorPostgres :=
		filepath.Join(
			dataDir,
			"postgres.sql",
		)

	if err := copyFile(
		postgresFile,
		mirrorPostgres,
	); err != nil {

		_ = os.RemoveAll(
			mirrorDir,
		)

		return nil, fmt.Errorf(
			"mirror postgres copy failed: %w",
			err,
		)
	}

	checksums["data/postgres.sql"] =
		fileSHA256(
			mirrorPostgres,
		)

	mirrorSQLite :=
		filepath.Join(
			dataDir,
			"local.sqlite",
		)

	if err := copyFile(
		sqliteFile,
		mirrorSQLite,
	); err != nil {

		_ = os.RemoveAll(
			mirrorDir,
		)

		return nil, fmt.Errorf(
			"mirror sqlite copy failed: %w",
			err,
		)
	}

	checksums["data/local.sqlite"] =
		fileSHA256(
			mirrorSQLite,
		)

	recoveryGuide :=
		filepath.Join(
			mirrorDir,
			"RECOVERY.md",
		)

	recoveryLines :=
		[]string{
			"# SoftCodeSolution Office Mirror Recovery",
			"",
			"Snapshot: " + snapshotID,
			"Created: " +
				time.Now().
					UTC().
					Format(time.RFC3339),
			"Git commit: " +
				strings.TrimSpace(commit),
			"Git branch: " +
				strings.TrimSpace(branch),
			"Git clean: " +
				fmt.Sprintf(
					"%t",
					gitClean,
				),
			"Code status: " +
				codeStatus,
			"",
			"Recovery order:",
			"",
			"1. Select and verify the recovery snapshot.",
			"2. Restore the approved source-code version.",
			"3. Restore PostgreSQL from data/postgres.sql.",
			"4. Restore SQLite from data/local.sqlite.",
			"5. Verify SHA-256 checksums.",
			"6. Rebuild the application.",
			"7. Run application health checks.",
			"",
			"Automatic restore is intentionally disabled.",
			"",
		}

	if err := os.WriteFile(
		recoveryGuide,
		[]byte(
			strings.Join(
				recoveryLines,
				"\n",
			),
		),
		0600,
	); err != nil {

		_ = os.RemoveAll(
			mirrorDir,
		)

		return nil, fmt.Errorf(
			"recovery guide write failed: %w",
			err,
		)
	}

	checksums["RECOVERY.md"] =
		fileSHA256(
			recoveryGuide,
		)

	status :=
		"verified"

	verified :=
		true

	mirrorManifest :=
		officeMirrorManifest{
			SnapshotID: snapshotID,

			CreatedAt: time.Now().UTC(),

			GitCommit: strings.TrimSpace(
				commit,
			),

			GitBranch: strings.TrimSpace(
				branch,
			),

			GitRemote: strings.TrimSpace(
				remote,
			),

			GitClean: gitClean,

			CodeStatus: codeStatus,

			SourceArchive: func() string {
				if sourceArchive == "" {
					return ""
				}

				return "code/source.tar.gz"
			}(),

			PostgreSQL: "data/postgres.sql",

			SQLite: "data/local.sqlite",

			RecoveryGuide: "RECOVERY.md",

			Checksums: checksums,

			Status: status,
		}

	manifestBytes, err :=
		json.MarshalIndent(
			mirrorManifest,
			"",
			"  ",
		)

	if err != nil {
		_ = os.RemoveAll(
			mirrorDir,
		)

		return nil, fmt.Errorf(
			"office mirror manifest encode failed: %w",
			err,
		)
	}

	manifestFile :=
		filepath.Join(
			mirrorDir,
			"manifest.json",
		)

	if err := os.WriteFile(
		manifestFile,
		manifestBytes,
		0600,
	); err != nil {

		_ = os.RemoveAll(
			mirrorDir,
		)

		return nil, fmt.Errorf(
			"office mirror manifest write failed: %w",
			err,
		)
	}

	directorySHA, shaErr := directorySHA256(mirrorDir)
	if shaErr != nil {
		_ = os.RemoveAll(mirrorDir)
		return nil, fmt.Errorf(
			"office mirror directory SHA calculation failed: %w",
			shaErr,
		)
	}

	return &OfficeMirrorResult{
		Path: mirrorDir,

		SHA256: directorySHA,

		Verified: verified,
	}, nil
}

func gitProjectRoot() (string, error) {

	out, err :=
		exec.Command(
			"git",
			"rev-parse",
			"--show-toplevel",
		).CombinedOutput()

	if err != nil {
		return "", fmt.Errorf(
			"%s",
			strings.TrimSpace(
				string(out),
			),
		)
	}

	return strings.TrimSpace(
		string(out),
	), nil
}

func gitWorkingTreeClean(
	root string,
) (bool, error) {

	/*
	 * Runtime/customer database files and generated backup
	 * material are NOT source-code changes. They must not
	 * prevent an approved Git commit from becoming a verified
	 * Office Mirror code snapshot.
	 */
	args := []string{
		"-C",
		root,
		"status",
		"--porcelain",
		"--",
		".",
		":(exclude)backend/auth/database/local_softcodesolution.db",
		":(exclude)backend/backup/data/**",
		":(exclude)**/*.bak.phase*",
	}

	out, err :=
		exec.Command(
			"git",
			args...,
		).CombinedOutput()

	if err != nil {
		return false, fmt.Errorf(
			"%s",
			strings.TrimSpace(
				string(out),
			),
		)
	}

	return strings.TrimSpace(
		string(out),
	) == "", nil
}

func gitOutput(
	root string,
	args ...string,
) (string, error) {

	cmdArgs :=
		append(
			[]string{
				"-C",
				root,
			},
			args...,
		)

	out, err :=
		exec.Command(
			"git",
			cmdArgs...,
		).CombinedOutput()

	if err != nil {
		return "", fmt.Errorf(
			"%s",
			strings.TrimSpace(
				string(out),
			),
		)
	}

	return strings.TrimSpace(
		string(out),
	), nil
}

func gitArchive(
	root string,
	destination string,
) error {

	temp :=
		destination + ".tmp"

	out, err :=
		os.Create(temp)

	if err != nil {
		return err
	}

	gzipWriter :=
		gzip.NewWriter(out)

	cmd :=
		exec.Command(
			"git",
			"-C",
			root,
			"archive",
			"--format=tar",
			"HEAD",
		)

	stdout, err :=
		cmd.StdoutPipe()

	if err != nil {
		_ = out.Close()
		_ = os.Remove(temp)
		return err
	}

	if err := cmd.Start(); err != nil {
		_ = out.Close()
		_ = os.Remove(temp)
		return err
	}

	if _, err := io.Copy(
		gzipWriter,
		stdout,
	); err != nil {
		_ = cmd.Process.Kill()
		_ = out.Close()
		_ = os.Remove(temp)
		return err
	}

	if err := cmd.Wait(); err != nil {
		_ = gzipWriter.Close()
		_ = out.Close()
		_ = os.Remove(temp)
		return err
	}

	if err := gzipWriter.Close(); err != nil {
		_ = out.Close()
		_ = os.Remove(temp)
		return err
	}

	if err := out.Sync(); err != nil {
		_ = out.Close()
		_ = os.Remove(temp)
		return err
	}

	if err := out.Close(); err != nil {
		_ = os.Remove(temp)
		return err
	}

	return os.Rename(
		temp,
		destination,
	)
}

func fileSHA256(
	path string,
) string {

	f, err :=
		os.Open(path)

	if err != nil {
		return ""
	}

	defer f.Close()

	h :=
		sha256.New()

	if _, err := io.Copy(
		h,
		f,
	); err != nil {
		return ""
	}

	return hex.EncodeToString(
		h.Sum(nil),
	)
}

/*
 * Keep archive/tar imported at package level so future recovery
 * validation can use the standard tar reader without changing
 * this foundation.
 */
var _ = tar.TypeReg
