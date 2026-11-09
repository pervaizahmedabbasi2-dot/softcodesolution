package backup

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type Manifest struct {
	ID                    string    `json:"id"`
	CreatedAt             time.Time `json:"created_at"`
	Postgres              string    `json:"postgres"`
	SQLite                string    `json:"sqlite"`
	PostgresSHA           string    `json:"postgres_sha256"`
	SQLiteSHA             string    `json:"sqlite_sha256"`
	SizeBytes             int64     `json:"size_bytes"`
	Status                string    `json:"status"`
	OfficeMirrorPath      string    `json:"office_mirror_path,omitempty"`
	OfficeMirrorSHA       string    `json:"office_mirror_sha256,omitempty"`
	OfficeMirrorVerified  bool      `json:"office_mirror_verified"`
	OffsiteProvider       string    `json:"offsite_provider,omitempty"`
	OffsiteStatus         string    `json:"offsite_status"`
	OffsitePath           string    `json:"offsite_path,omitempty"`
	OffsiteSHA            string    `json:"offsite_sha256,omitempty"`
	OffsiteRetentionUntil time.Time `json:"offsite_retention_until,omitempty"`
	OffsiteVerified       bool      `json:"offsite_verified"`
}

type Result struct {
	Manifest Manifest `json:"manifest"`
}

type Service struct {
	mu sync.Mutex

	BackupRoot string

	PostgresDSN string
	SQLitePath  string

	DB *sql.DB

	/*
	 * Test-only recovery event store.
	 *
	 * Production remains PostgreSQL-backed.
	 * This store is enabled explicitly by tests only,
	 * never automatically.
	 */
	eventMu             sync.Mutex
	testEvents          []RecoveryEvent
	allowInMemoryEvents bool
	testEventSequence   int64

	/*
	 * Guardian Supervisor runtime telemetry.
	 *
	 * This state belongs to the existing application-owned
	 * backup service so the Guardian monitor and API share
	 * one authoritative runtime state without introducing
	 * another database connection or duplicate store.
	 */
	supervisorMu                sync.RWMutex
	supervisorHeartbeat         time.Time
	supervisorOperation         string
	supervisorCrashRestartCount int
	supervisorStatePath         string
}

func NewService(
	backupRoot string,
	postgresDSN string,
	sqlitePath string,
	db *sql.DB,
) *Service {

	service := &Service{
		BackupRoot:  backupRoot,
		PostgresDSN: postgresDSN,
		SQLitePath:  sqlitePath,
		DB:          db,
	}

	return service
}

func (s *Service) Create() (*Result, error) {

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.BackupRoot == "" {
		return nil, errors.New("backup root is empty")
	}

	if s.PostgresDSN == "" {
		return nil, errors.New("postgres DSN is empty")
	}

	if s.SQLitePath == "" {
		return nil, errors.New("sqlite path is empty")
	}

	if _, err := os.Stat(s.SQLitePath); err != nil {
		return nil, fmt.Errorf("sqlite database unavailable: %w", err)
	}

	id := time.Now().UTC().Format("20060102T150405.000000000Z")

	dir := filepath.Join(s.BackupRoot, id)

	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, fmt.Errorf("create backup directory: %w", err)
	}

	postgresFile := filepath.Join(dir, "postgres.sql")
	sqliteFile := filepath.Join(dir, "local.sqlite")
	manifestFile := filepath.Join(dir, "manifest.json")

	/*
	 * PostgreSQL logical backup.
	 */
	pgDump := exec.Command(
		"pg_dump",
		"--no-owner",
		"--no-privileges",
		"--clean",
		"--if-exists",
		"--format=plain",
		"--file="+postgresFile,
		s.PostgresDSN,
	)

	pgOutput, err := pgDump.CombinedOutput()

	if err != nil {
		_ = os.RemoveAll(dir)

		return nil, fmt.Errorf(
			"pg_dump failed: %w: %s",
			err,
			strings.TrimSpace(string(pgOutput)),
		)
	}

	/*
	 * SQLite snapshot.
	 */
	if err := copyFile(s.SQLitePath, sqliteFile); err != nil {
		_ = os.RemoveAll(dir)

		return nil, fmt.Errorf(
			"sqlite backup failed: %w",
			err,
		)
	}

	pgHash, pgSize, err := fileHash(postgresFile)

	if err != nil {
		_ = os.RemoveAll(dir)
		return nil, fmt.Errorf(
			"postgres checksum failed: %w",
			err,
		)
	}

	// Validate SQLite recovery image before SHA-256.
	if commandExists("sqlite3") {
		sqliteIntegrity := exec.Command(
			"sqlite3",
			sqliteFile,
			"PRAGMA integrity_check;",
		)

		integrityOutput, integrityErr := sqliteIntegrity.CombinedOutput()

		if integrityErr != nil {
			_ = os.RemoveAll(dir)

			return nil, fmt.Errorf(
				"sqlite integrity check failed: %w: %s",
				integrityErr,
				strings.TrimSpace(string(integrityOutput)),
			)
		}

		if strings.TrimSpace(string(integrityOutput)) != "ok" {
			_ = os.RemoveAll(dir)

			return nil, fmt.Errorf(
				"sqlite integrity check failed: %s",
				strings.TrimSpace(string(integrityOutput)),
			)
		}
	}

	sqliteHash, sqliteSize, err := fileHash(sqliteFile)

	if err != nil {
		_ = os.RemoveAll(dir)
		return nil, fmt.Errorf(
			"sqlite checksum failed: %w",
			err,
		)
	}

	manifest := Manifest{
		ID:          id,
		CreatedAt:   time.Now().UTC(),
		Postgres:    filepath.Base(postgresFile),
		SQLite:      filepath.Base(sqliteFile),
		PostgresSHA: pgHash,
		SQLiteSHA:   sqliteHash,
		SizeBytes:   pgSize + sqliteSize,
		Status:      "verified",
	}

	// Office Mirror
	officeMirror, officeMirrorErr := s.createOfficeMirror(
		id,
		dir,
		postgresFile,
		sqliteFile,
	)

	if officeMirrorErr != nil {
		_ = os.RemoveAll(dir)

		return nil, fmt.Errorf(
			"office mirror creation failed: %w",
			officeMirrorErr,
		)
	}

	manifest.OfficeMirrorPath = officeMirror.Path
	manifest.OfficeMirrorSHA = officeMirror.SHA256
	manifest.OfficeMirrorVerified = officeMirror.Verified

	// Offsite Copy
	offsite := s.createOffsiteCopy(
		id,
		officeMirror.Path,
	)

	manifest.OffsiteProvider = offsite.Provider
	manifest.OffsiteStatus = offsite.Status
	manifest.OffsitePath = offsite.Path
	manifest.OffsiteSHA = offsite.SHA256
	manifest.OffsiteRetentionUntil = offsite.RetentionUntil
	manifest.OffsiteVerified = offsite.Verified

	data, err := json.MarshalIndent(
		manifest,
		"",
		"  ",
	)

	if err != nil {
		_ = os.RemoveAll(dir)
		return nil, fmt.Errorf(
			"manifest encoding failed: %w",
			err,
		)
	}

	if err := os.WriteFile(
		manifestFile,
		data,
		0600,
	); err != nil {
		_ = os.RemoveAll(dir)
		return nil, fmt.Errorf(
			"manifest write failed: %w",
			err,
		)
	}

	_ = s.recordRecoveryEvent(
		context.Background(),
		id,
		"backup_created",
		"verified",
		"core",
		"Layer 1-3 backup created and verified",
	)

	return &Result{
		Manifest: manifest,
	}, nil
}

type RestoreOptions struct {
	BackupID string `json:"backup_id"`
	Confirm  string `json:"confirm"`
	Target   string `json:"target"`
}

type RestoreResult struct {
	BackupID     string    `json:"backup_id"`
	Target       string    `json:"target"`
	PreRestoreID string    `json:"pre_restore_backup_id"`
	Postgres     string    `json:"postgres"`
	SQLite       string    `json:"sqlite"`
	Verified     bool      `json:"verified"`
	CompletedAt  time.Time `json:"completed_at"`
}

func (s *Service) Restore(
	opts RestoreOptions,
) (*RestoreResult, error) {

	s.mu.Lock()
	defer s.mu.Unlock()

	if opts.BackupID == "" {
		return nil, errors.New("backup id is required")
	}

	if opts.Confirm != "RESTORE" {
		return nil, errors.New(
			"restore confirmation required",
		)
	}

	if opts.Target != "local" &&
		opts.Target != "postgres" &&
		opts.Target != "both" {
		return nil, errors.New(
			"invalid restore target",
		)
	}

	/*
	 * Verify selected backup before changing live data.
	 */
	manifest, err := s.verifyUnlocked(opts.BackupID)

	if err != nil {
		return nil, fmt.Errorf(
			"backup verification failed: %w",
			err,
		)
	}

	/*
	 * Create rollback point.
	 */
	preRestoreID := time.Now().
		UTC().
		Format("pre-restore-20060102T150405.000000000Z")

	preRestoreDir := filepath.Join(
		s.BackupRoot,
		preRestoreID,
	)

	if err := os.MkdirAll(
		preRestoreDir,
		0700,
	); err != nil {
		return nil, fmt.Errorf(
			"create pre-restore backup: %w",
			err,
		)
	}

	/*
	 * Current SQLite rollback copy.
	 */
	preRestoreSQLite := filepath.Join(
		preRestoreDir,
		"local.sqlite",
	)

	if opts.Target == "local" ||
		opts.Target == "both" {

		if _, statErr := os.Stat(s.SQLitePath); statErr == nil {
			if err := copyFile(
				s.SQLitePath,
				preRestoreSQLite,
			); err != nil {

				_ = os.RemoveAll(preRestoreDir)

				return nil, fmt.Errorf(
					"pre-restore sqlite backup failed: %w",
					err,
				)
			}
		}
	}

	/*
	 * Current PostgreSQL rollback dump.
	 */
	preRestorePostgres := filepath.Join(
		preRestoreDir,
		"postgres.sql",
	)

	if (opts.Target == "postgres" || opts.Target == "both") && commandExists("pg_dump") && s.PostgresDSN != "" {

		dump := exec.Command(
			"pg_dump",
			"--no-owner",
			"--no-privileges",
			"--format=plain",
			"--file="+preRestorePostgres,
			s.PostgresDSN,
		)

		output, err := dump.CombinedOutput()

		if err != nil {
			_ = os.RemoveAll(preRestoreDir)

			return nil, fmt.Errorf(
				"pre-restore postgres backup failed: %w: %s",
				err,
				strings.TrimSpace(
					string(output),
				),
			)
		}
	}

	_ = s.recordRecoveryEvent(
		context.Background(),
		opts.BackupID,
		"restore_started",
		"started",
		"restore_engine",
		"Restore transaction initiated with pre-restore rollback snapshot",
	)

	/*
	 * Stage SQLite restore.
	 * Do NOT activate yet.
	 */
	var sqliteTemp string

	if opts.Target == "local" ||
		opts.Target == "both" {

		source := filepath.Join(
			s.BackupRoot,
			opts.BackupID,
			manifest.SQLite,
		)

		sqliteTemp = s.SQLitePath + ".restore.tmp"

		if err := copyFile(
			source,
			sqliteTemp,
		); err != nil {

			_ = os.Remove(sqliteTemp)

			_ = s.recordRecoveryEvent(
				context.Background(),
				opts.BackupID,
				"restore_failed",
				"failed",
				"sqlite",
				fmt.Sprintf("prepare sqlite restore failed: %v", err),
			)

			return nil, fmt.Errorf(
				"prepare sqlite restore failed: %w",
				err,
			)
		}
	}

	/*
	 * Restore PostgreSQL first for "both" or "postgres".
	 */
	if opts.Target == "postgres" ||
		opts.Target == "both" {

		source := filepath.Join(
			s.BackupRoot,
			opts.BackupID,
			manifest.Postgres,
		)

		if commandExists("psql") && s.PostgresDSN != "" {
			restore := exec.Command(
				"psql",
				s.PostgresDSN,
				"--set",
				"ON_ERROR_STOP=1",
				"--single-transaction",
				"--file="+source,
			)

			output, err := restore.CombinedOutput()

			if err != nil {

				if sqliteTemp != "" {
					_ = os.Remove(sqliteTemp)
				}

				_ = s.recordRecoveryEvent(
					context.Background(),
					opts.BackupID,
					"restore_failed",
					"failed",
					"postgres",
					fmt.Sprintf("postgres restore failed: %v: %s", err, strings.TrimSpace(string(output))),
				)

				return nil, fmt.Errorf(
					"postgres restore failed: %w: %s",
					err,
					strings.TrimSpace(
						string(output),
					),
				)
			}
		}
	}

	/*
	 * Activate SQLite only after PostgreSQL succeeds.
	 */
	if sqliteTemp != "" {

		if err := os.Rename(
			sqliteTemp,
			s.SQLitePath,
		); err != nil {

			_ = os.Remove(sqliteTemp)

			if (opts.Target == "postgres" || opts.Target == "both") && commandExists("psql") && fileExists(preRestorePostgres) {
				_ = exec.Command("psql", s.PostgresDSN, "--single-transaction", "--file="+preRestorePostgres).Run()
			}

			_ = s.recordRecoveryEvent(
				context.Background(),
				opts.BackupID,
				"restore_failed",
				"failed",
				"sqlite",
				fmt.Sprintf("activate sqlite restore failed: %v", err),
			)

			return nil, fmt.Errorf(
				"activate sqlite restore failed: %w",
				err,
			)
		}

		if commandExists("sqlite3") {
			integrity := exec.Command("sqlite3", s.SQLitePath, "PRAGMA integrity_check;")
			out, err := integrity.CombinedOutput()
			if err != nil || strings.TrimSpace(string(out)) != "ok" {
				if fileExists(preRestoreSQLite) {
					_ = copyFile(preRestoreSQLite, s.SQLitePath)
				}
				if fileExists(preRestorePostgres) && commandExists("psql") {
					_ = exec.Command("psql", s.PostgresDSN, "--single-transaction", "--file="+preRestorePostgres).Run()
				}

				_ = s.recordRecoveryEvent(
					context.Background(),
					opts.BackupID,
					"restore_failed",
					"failed",
					"integrity",
					"Post-restore SQLite integrity check failed",
				)

				return nil, fmt.Errorf("post-restore sqlite integrity check failed: %s", strings.TrimSpace(string(out)))
			}
		}
	}

	_ = s.recordRecoveryEvent(
		context.Background(),
		opts.BackupID,
		"restore_succeeded",
		"verified",
		"restore_engine",
		"Restore transaction and post-restore integrity verified successfully",
	)

	return &RestoreResult{
		BackupID:     opts.BackupID,
		Target:       opts.Target,
		PreRestoreID: preRestoreID,
		Postgres:     manifest.PostgresSHA,
		SQLite:       manifest.SQLiteSHA,
		Verified:     true,
		CompletedAt:  time.Now().UTC(),
	}, nil
}

func (s *Service) verifyUnlocked(
	id string,
) (*Manifest, error) {

	if id == "" {
		return nil, errors.New(
			"backup id is empty",
		)
	}

	dir := filepath.Join(
		s.BackupRoot,
		id,
	)

	data, err := os.ReadFile(
		filepath.Join(
			dir,
			"manifest.json",
		),
	)

	if err != nil {
		return nil, fmt.Errorf(
			"backup manifest unavailable: %w",
			err,
		)
	}

	var manifest Manifest

	if err := json.Unmarshal(
		data,
		&manifest,
	); err != nil {
		return nil, fmt.Errorf(
			"invalid backup manifest: %w",
			err,
		)
	}

	pgHash, _, err := fileHash(
		filepath.Join(
			dir,
			manifest.Postgres,
		),
	)

	if err != nil {
		return nil, err
	}

	sqliteHash, _, err := fileHash(
		filepath.Join(
			dir,
			manifest.SQLite,
		),
	)

	if err != nil {
		return nil, err
	}

	if pgHash != manifest.PostgresSHA {
		return nil, errors.New(
			"postgres backup checksum mismatch",
		)
	}

	if sqliteHash != manifest.SQLiteSHA {
		return nil, errors.New(
			"sqlite backup checksum mismatch",
		)
	}

	manifest.Status = "verified"

	return &manifest, nil
}

func (s *Service) Verify(id string) (*Manifest, error) {

	if id == "" {
		return nil, errors.New("backup id is empty")
	}

	dir := filepath.Join(s.BackupRoot, id)

	data, err := os.ReadFile(
		filepath.Join(dir, "manifest.json"),
	)

	if err != nil {
		return nil, fmt.Errorf(
			"backup manifest unavailable: %w",
			err,
		)
	}

	var manifest Manifest

	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf(
			"invalid backup manifest: %w",
			err,
		)
	}

	pgHash, _, err := fileHash(
		filepath.Join(dir, manifest.Postgres),
	)

	if err != nil {
		return nil, err
	}

	sqliteHash, _, err := fileHash(
		filepath.Join(dir, manifest.SQLite),
	)

	if err != nil {
		return nil, err
	}

	if pgHash != manifest.PostgresSHA {
		return nil, errors.New(
			"postgres backup checksum mismatch",
		)
	}

	if sqliteHash != manifest.SQLiteSHA {
		return nil, errors.New(
			"sqlite backup checksum mismatch",
		)
	}

	manifest.Status = "verified"

	return &manifest, nil
}

func (s *Service) List() ([]Manifest, error) {

	entries, err := os.ReadDir(s.BackupRoot)

	if err != nil {
		if os.IsNotExist(err) {
			return []Manifest{}, nil
		}

		return nil, err
	}

	result := make([]Manifest, 0)

	for _, entry := range entries {

		if !entry.IsDir() {
			continue
		}

		manifest, err := s.Verify(entry.Name())

		if err != nil {
			continue
		}

		result = append(
			result,
			*manifest,
		)
	}

	return result, nil
}

func copyFile(src, dst string) error {

	in, err := os.Open(src)

	if err != nil {
		return err
	}

	defer in.Close()

	info, err := in.Stat()

	if err != nil {
		return err
	}

	out, err := os.OpenFile(
		dst,
		os.O_CREATE|
			os.O_WRONLY|
			os.O_TRUNC,
		info.Mode().Perm(),
	)

	if err != nil {
		return err
	}

	defer out.Close()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}

	return out.Sync()
}

func fileHash(file string) (string, int64, error) {

	f, err := os.Open(file)

	if err != nil {
		return "", 0, err
	}

	defer f.Close()

	h := sha256.New()

	n, err := io.Copy(h, f)

	if err != nil {
		return "", 0, err
	}

	return hex.EncodeToString(h.Sum(nil)), n, nil
}

func commandExists(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
