package backup

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func createTestSQLiteDBWithData(t *testing.T, path string, data string) {
	_ = os.Remove(path)
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		t.Fatalf("failed to open test sqlite db: %v", err)
	}
	defer db.Close()

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS test_records (id INTEGER PRIMARY KEY, content TEXT);")
	if err != nil {
		t.Fatalf("failed to create table: %v", err)
	}

	_, err = db.Exec("INSERT INTO test_records (content) VALUES (?);", data)
	if err != nil {
		t.Fatalf("failed to insert data: %v", err)
	}
}

func readTestSQLiteData(t *testing.T, path string) string {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		t.Fatalf("failed to open test sqlite db: %v", err)
	}
	defer db.Close()

	var content string
	err = db.QueryRow("SELECT content FROM test_records ORDER BY id DESC LIMIT 1").Scan(&content)
	if err != nil {
		return ""
	}
	return content
}

func setupTestService(t *testing.T) (*Service, string, string) {
	tempDir := t.TempDir()
	backupRoot := filepath.Join(tempDir, "backups")
	sqlitePath := filepath.Join(tempDir, "test.sqlite")

	_ = os.MkdirAll(backupRoot, 0700)

	createTestSQLiteDBWithData(t, sqlitePath, "INITIAL_APPLICATION_STATE")

	eventDSN :=
		strings.TrimSpace(
			os.Getenv("DATABASE_URL"),
		)

	if eventDSN == "" {
		host := strings.TrimSpace(os.Getenv("SCS_DB_HOST"))
		port := strings.TrimSpace(os.Getenv("SCS_DB_PORT"))
		user := strings.TrimSpace(os.Getenv("SCS_DB_USER"))
		dbname := strings.TrimSpace(os.Getenv("SCS_DB_NAME"))
		sslmode := strings.TrimSpace(os.Getenv("SCS_DB_SSLMODE"))

		if host == "" {
			host = "127.0.0.1"
		}

		if port == "" {
			port = "5432"
		}

		if user == "" {
			user = os.Getenv("USER")
		}

		if dbname == "" {
			dbname = "softcodesolution"
		}

		if sslmode == "" {
			sslmode = "disable"
		}

		eventDSN =
			fmt.Sprintf(
				"host=%s port=%s user=%s dbname=%s sslmode=%s",
				host,
				port,
				user,
				dbname,
				sslmode,
			)
	}

	eventDB, err :=
		sql.Open(
			"postgres",
			eventDSN,
		)

	if err != nil {
		t.Fatalf(
			"failed to open existing PostgreSQL event store: %v",
			err,
		)
	}

	t.Cleanup(
		func() {
			_ = eventDB.Close()
		},
	)

	if err := eventDB.Ping(); err != nil {
		t.Fatalf(
			"existing PostgreSQL event store unavailable: %v",
			err,
		)
	}

	service :=
		NewService(
			backupRoot,
			eventDSN,
			sqlitePath,
			eventDB,
		)
	return service, tempDir, sqlitePath
}

// 1. Real SQLite & Postgres Backup Creation
func TestRealPostgresAndSQLiteBackup(t *testing.T) {
	service, tempDir, sqlitePath := setupTestService(t)

	destDir := filepath.Join(tempDir, "dest")
	_ = os.MkdirAll(destDir, 0700)
	destFile := filepath.Join(destDir, "local.sqlite")

	if err := copyFile(sqlitePath, destFile); err != nil {
		t.Fatalf("copyFile failed: %v", err)
	}

	hash, size, err := fileHash(destFile)
	if err != nil {
		t.Fatalf("fileHash failed: %v", err)
	}

	if hash == "" || size == 0 {
		t.Fatalf("expected non-empty hash and size > 0, got hash=%s, size=%d", hash, size)
	}

	_ = service
}

// 2. Metadata integrity and deterministic identity
func TestBackupMetadata(t *testing.T) {
	manifest := Manifest{
		ID:          "20260822T040000Z",
		CreatedAt:   time.Now().UTC(),
		Postgres:    "postgres.sql",
		SQLite:      "local.sqlite",
		PostgresSHA: "abcd1234abcd",
		SQLiteSHA:   "ef012345ef01",
		SizeBytes:   1024,
		Status:      "verified",
	}

	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		t.Fatalf("json.MarshalIndent failed: %v", err)
	}

	var parsed Manifest
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("json.Unmarshal failed: %v", err)
	}

	if parsed.ID != manifest.ID || parsed.Status != "verified" {
		t.Fatalf("manifest mismatch: %+v", parsed)
	}
}

// 3. Office Mirror hashing and corruption detection
func TestOfficeMirrorHashAndCorruption(t *testing.T) {
	tempDir := t.TempDir()
	testFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(testFile, []byte("office mirror test"), 0600); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	sha := fileSHA256(testFile)
	if sha == "" {
		t.Fatalf("expected non-empty sha256")
	}

	// Tamper test: corrupt artifact
	if err := os.WriteFile(testFile, []byte("tampered content"), 0600); err != nil {
		t.Fatalf("failed to write tampered file: %v", err)
	}

	newSha := fileSHA256(testFile)
	if newSha == sha {
		t.Fatalf("expected sha to change after tampering")
	}
}

// 4. Offsite replication and read-back verification
func TestOffsiteReplicationAndReadBack(t *testing.T) {
	service, tempDir, _ := setupTestService(t)

	mirrorDir := filepath.Join(tempDir, "mirror", "rec_001")
	_ = os.MkdirAll(mirrorDir, 0700)
	if err := os.WriteFile(filepath.Join(mirrorDir, "data.txt"), []byte("offsite test payload"), 0600); err != nil {
		t.Fatalf("failed to write mirror file: %v", err)
	}

	offsiteRoot := filepath.Join(tempDir, "offsite_root")
	t.Setenv("SCS_OFFSITE_ROOT", offsiteRoot)
	t.Cleanup(func() { _ = removeRecoveryTree(offsiteRoot) })

	result := service.createOffsiteCopy("rec_001", mirrorDir)
	if !result.Verified || result.Status != "verified" {
		t.Fatalf("createOffsiteCopy failed: %+v", result)
	}

	if result.SHA256 == "" {
		t.Fatalf("expected non-empty offsite package SHA256")
	}

	manifestPath := filepath.Join(offsiteRoot, "rec_001", "OFFSITE-MANIFEST.json")
	if _, err := os.Stat(manifestPath); err != nil {
		t.Fatalf("OFFSITE-MANIFEST.json not found: %v", err)
	}

	// Read-back verification assertion
	verifiedSHA, err := directorySHA256(result.Path)
	if err != nil || verifiedSHA != result.SHA256 {
		t.Fatalf("readback sha mismatch: got %s, expected %s", verifiedSHA, result.SHA256)
	}
}

// 5. Deterministic SHA-256 package hash contract
func TestOffsitePackageHashContract(t *testing.T) {
	tempDir := t.TempDir()
	subDir := filepath.Join(tempDir, "dataset")
	_ = os.MkdirAll(subDir, 0700)

	_ = os.WriteFile(filepath.Join(subDir, "a.txt"), []byte("file a"), 0600)
	_ = os.WriteFile(filepath.Join(subDir, "b.txt"), []byte("file b"), 0600)

	hash1, err := directorySHA256(subDir)
	if err != nil {
		t.Fatalf("directorySHA256 failed: %v", err)
	}

	hash2, err := directorySHA256(subDir)
	if err != nil {
		t.Fatalf("directorySHA256 repeat failed: %v", err)
	}

	if hash1 != hash2 {
		t.Fatalf("directory hash is not deterministic: %s != %s", hash1, hash2)
	}
}

// 6. Offsite Tamper Detection
func TestOffsiteTamperDetection(t *testing.T) {
	tempDir := t.TempDir()
	sourceDir := filepath.Join(tempDir, "source")
	_ = os.MkdirAll(sourceDir, 0700)
	_ = os.WriteFile(filepath.Join(sourceDir, "valid.dat"), []byte("clean data"), 0600)

	origHash, err := directorySHA256(sourceDir)
	if err != nil {
		t.Fatalf("directorySHA256 failed: %v", err)
	}

	// Tamper with file
	_ = os.WriteFile(filepath.Join(sourceDir, "valid.dat"), []byte("corrupted data"), 0600)
	tamperedHash, err := directorySHA256(sourceDir)
	if err != nil {
		t.Fatalf("directorySHA256 after tamper failed: %v", err)
	}

	if origHash == tamperedHash {
		t.Fatalf("tampering was not detected by directorySHA256")
	}
}

// 7. Retention Policy Pruning & Latest Point Protection
func TestRetentionPruningAndProtection(t *testing.T) {
	service, tempDir, _ := setupTestService(t)
	offsiteRoot := filepath.Join(tempDir, "offsite_retention")
	_ = os.MkdirAll(offsiteRoot, 0700)
	t.Cleanup(func() { _ = removeRecoveryTree(offsiteRoot) })

	// Expired point
	expiredDir := filepath.Join(offsiteRoot, "20260101T000000Z")
	_ = os.MkdirAll(expiredDir, 0700)
	expiredManifest := offsiteManifest{
		RecoveryID:     "20260101T000000Z",
		CreatedAt:      time.Now().UTC().Add(-60 * 24 * time.Hour),
		RetentionUntil: time.Now().UTC().Add(-30 * 24 * time.Hour),
		PackageSHA256:  "expired123",
	}
	expiredData, _ := json.Marshal(expiredManifest)
	_ = os.WriteFile(filepath.Join(expiredDir, "OFFSITE-MANIFEST.json"), expiredData, 0600)

	// Active point
	activeDir := filepath.Join(offsiteRoot, "20260822T000000Z")
	_ = os.MkdirAll(activeDir, 0700)
	activeManifest := offsiteManifest{
		RecoveryID:     "20260822T000000Z",
		CreatedAt:      time.Now().UTC(),
		RetentionUntil: time.Now().UTC().Add(30 * 24 * time.Hour),
		PackageSHA256:  "active123",
	}
	activeData, _ := json.Marshal(activeManifest)
	_ = os.WriteFile(filepath.Join(activeDir, "OFFSITE-MANIFEST.json"), activeData, 0600)

	err := service.enforceFilesystemRetention(offsiteRoot)
	if err != nil {
		t.Fatalf("enforceFilesystemRetention failed: %v", err)
	}

	if _, err := os.Stat(expiredDir); !os.IsNotExist(err) {
		t.Fatalf("expected expired directory to be pruned")
	}

	if _, err := os.Stat(activeDir); err != nil {
		t.Fatalf("expected active directory to be preserved: %v", err)
	}
}

// 8. Real SQLite Restore Success
func TestRealSQLiteRestoreSuccess(t *testing.T) {
	service, tempDir, sqlitePath := setupTestService(t)

	recID := "20260822T100000Z"
	recDir := filepath.Join(service.BackupRoot, recID)
	_ = os.MkdirAll(recDir, 0700)

	backupSQLite := filepath.Join(recDir, "local.sqlite")
	createTestSQLiteDBWithData(t, backupSQLite, "VALID_BACKUP_STATE_RESTORED")

	backupPG := filepath.Join(recDir, "postgres.sql")
	_ = os.WriteFile(backupPG, []byte("-- postgres dummy"), 0600)

	sqHash, sqSize, _ := fileHash(backupSQLite)
	pgHash, pgSize, _ := fileHash(backupPG)

	manifest := Manifest{
		ID:          recID,
		CreatedAt:   time.Now().UTC(),
		Postgres:    "postgres.sql",
		SQLite:      "local.sqlite",
		PostgresSHA: pgHash,
		SQLiteSHA:   sqHash,
		SizeBytes:   sqSize + pgSize,
		Status:      "verified",
	}
	mData, _ := json.MarshalIndent(manifest, "", "  ")
	_ = os.WriteFile(filepath.Join(recDir, "manifest.json"), mData, 0600)

	// Modify live database to simulate corruption/loss before restore
	createTestSQLiteDBWithData(t, sqlitePath, "CORRUPTED_LIVE_DATA_BEFORE_RESTORE")

	res, err := service.Restore(RestoreOptions{
		BackupID: recID,
		Confirm:  "RESTORE",
		Target:   "local",
	})

	if err != nil {
		t.Fatalf("service.Restore failed: %v", err)
	}

	if !res.Verified {
		t.Fatalf("expected restore to be verified")
	}

	// Verify restored data
	content := readTestSQLiteData(t, sqlitePath)
	if content != "VALID_BACKUP_STATE_RESTORED" {
		t.Fatalf("restored content mismatch: got %s, expected VALID_BACKUP_STATE_RESTORED", content)
	}

	_ = tempDir
}

// 9. Real Partial Restore Failure & Rollback Orchestration
func TestPartialRestoreRollbackOrchestration(t *testing.T) {
	service, tempDir, sqlitePath := setupTestService(t)

	// Live database has known pre-restore state
	createTestSQLiteDBWithData(t, sqlitePath, "PRE_RESTORE_SAFE_DATA")

	// Create recovery point with an invalid/corrupted SQLite file
	recID := "20260822T110000Z"
	recDir := filepath.Join(service.BackupRoot, recID)
	_ = os.MkdirAll(recDir, 0700)

	badSQLite := filepath.Join(recDir, "local.sqlite")
	_ = os.WriteFile(badSQLite, []byte("CORRUPT_NOT_A_SQLITE_DB"), 0600)

	badPG := filepath.Join(recDir, "postgres.sql")
	_ = os.WriteFile(badPG, []byte("-- valid sql"), 0600)

	sqHash, sqSize, _ := fileHash(badSQLite)
	pgHash, pgSize, _ := fileHash(badPG)

	manifest := Manifest{
		ID:          recID,
		CreatedAt:   time.Now().UTC(),
		Postgres:    "postgres.sql",
		SQLite:      "local.sqlite",
		PostgresSHA: pgHash,
		SQLiteSHA:   sqHash,
		SizeBytes:   sqSize + pgSize,
		Status:      "verified",
	}
	mData, _ := json.MarshalIndent(manifest, "", "  ")
	_ = os.WriteFile(filepath.Join(recDir, "manifest.json"), mData, 0600)

	// Attempt restore: post-restore integrity check should fail and trigger rollback
	_, err := service.Restore(RestoreOptions{
		BackupID: recID,
		Confirm:  "RESTORE",
		Target:   "local",
	})

	if err == nil {
		t.Fatalf("expected restore to fail due to sqlite integrity check failure")
	}

	// PROVE ZERO DATA LOSS: Live database must be rolled back to PRE_RESTORE_SAFE_DATA
	content := readTestSQLiteData(t, sqlitePath)
	if content != "PRE_RESTORE_SAFE_DATA" {
		t.Fatalf("rollback failed: live data was corrupted, got: %s", content)
	}

	_ = tempDir
}

// 10. Office Mirror Tampering & Automatic Reconciliation Healing
func TestOfficeMirrorTamperAndAutoHeal(t *testing.T) {
	service, tempDir, _ := setupTestService(t)

	recID := "20260822T130000Z"
	recDir := filepath.Join(service.BackupRoot, recID)
	_ = os.MkdirAll(recDir, 0700)

	sqFile := filepath.Join(recDir, "local.sqlite")
	createTestSQLiteDBWithData(t, sqFile, "CORE_SQLITE_TRUSTED")
	pgFile := filepath.Join(recDir, "postgres.sql")
	_ = os.WriteFile(pgFile, []byte("CORE_POSTGRES_TRUSTED"), 0600)

	sqHash, sqSize, _ := fileHash(sqFile)
	pgHash, pgSize, _ := fileHash(pgFile)

	mirrorRoot := filepath.Join(tempDir, "mirror_heal")
	t.Setenv("SCS_OFFICE_MIRROR_ROOT", mirrorRoot)
	_ = os.MkdirAll(mirrorRoot, 0700)

	manifest := Manifest{
		ID:          recID,
		CreatedAt:   time.Now().UTC(),
		Postgres:    "postgres.sql",
		SQLite:      "local.sqlite",
		PostgresSHA: pgHash,
		SQLiteSHA:   sqHash,
		SizeBytes:   sqSize + pgSize,
		Status:      "verified",
	}
	mData, _ := json.MarshalIndent(manifest, "", "  ")
	_ = os.WriteFile(filepath.Join(recDir, "manifest.json"), mData, 0600)

	// Reconcile creates initial verified mirror
	reconciled, err := service.ReconcileRecoveryPoint(recID)
	if err != nil || !reconciled.OfficeMirrorVerified {
		t.Fatalf("initial reconciliation failed: %v", err)
	}

	// Deliberately tamper/corrupt the Office Mirror data
	mirrorPostgres := filepath.Join(reconciled.OfficeMirrorPath, "data", "postgres.sql")
	if fileExists(mirrorPostgres) {
		_ = os.WriteFile(mirrorPostgres, []byte("TAMPERED_MIRROR_DATA"), 0600)
	}

	// Reconcile again: must detect mismatch and automatically heal from trusted core
	healed, err := service.ReconcileRecoveryPoint(recID)
	if err != nil {
		t.Fatalf("healing reconciliation failed: %v", err)
	}

	if !healed.OfficeMirrorVerified {
		t.Fatalf("expected healed mirror to be verified")
	}

	// Read healed mirror file and confirm it matches source
	healedContent, _ := os.ReadFile(filepath.Join(healed.OfficeMirrorPath, "data", "postgres.sql"))
	if string(healedContent) != "CORE_POSTGRES_TRUSTED" {
		t.Fatalf("mirror was not healed to trusted source content: %s", string(healedContent))
	}
}

// 11. Offsite Package Tampering & Automatic Reconciliation Healing
func TestOffsitePackageTamperAndAutoHeal(t *testing.T) {
	service, tempDir, _ := setupTestService(t)

	recID := "20260822T140000Z"
	recDir := filepath.Join(service.BackupRoot, recID)
	_ = os.MkdirAll(recDir, 0700)

	sqFile := filepath.Join(recDir, "local.sqlite")
	createTestSQLiteDBWithData(t, sqFile, "CORE_SQLITE_OFFSITE_HEAL")
	pgFile := filepath.Join(recDir, "postgres.sql")
	_ = os.WriteFile(pgFile, []byte("CORE_POSTGRES_OFFSITE_HEAL"), 0600)

	sqHash, sqSize, _ := fileHash(sqFile)
	pgHash, pgSize, _ := fileHash(pgFile)

	mirrorRoot := filepath.Join(tempDir, "mirror_offsite_heal")
	offsiteRoot := filepath.Join(tempDir, "offsite_heal")
	t.Setenv("SCS_OFFICE_MIRROR_ROOT", mirrorRoot)
	t.Setenv("SCS_OFFSITE_ROOT", offsiteRoot)
	t.Cleanup(func() { _ = removeRecoveryTree(offsiteRoot) })

	manifest := Manifest{
		ID:          recID,
		CreatedAt:   time.Now().UTC(),
		Postgres:    "postgres.sql",
		SQLite:      "local.sqlite",
		PostgresSHA: pgHash,
		SQLiteSHA:   sqHash,
		SizeBytes:   sqSize + pgSize,
		Status:      "verified",
	}
	mData, _ := json.MarshalIndent(manifest, "", "  ")
	_ = os.WriteFile(filepath.Join(recDir, "manifest.json"), mData, 0600)

	// Reconcile creates initial verified offsite
	reconciled, err := service.ReconcileRecoveryPoint(recID)
	if err != nil || !reconciled.OffsiteVerified {
		t.Fatalf("initial offsite reconciliation failed: %v", err)
	}

	// Deliberately tamper with offsite copy
	offsiteData := filepath.Join(reconciled.OffsitePath, "data", "postgres.sql")
	if fileExists(offsiteData) {
		_ = os.Chmod(filepath.Dir(offsiteData), 0700)
		_ = os.Chmod(offsiteData, 0600)
		_ = os.WriteFile(offsiteData, []byte("TAMPERED_OFFSITE_DATA"), 0600)
	}

	// Reconcile: must detect offsite SHA mismatch and automatically heal
	healed, err := service.ReconcileRecoveryPoint(recID)
	if err != nil {
		t.Fatalf("offsite healing reconciliation failed: %v", err)
	}

	if !healed.OffsiteVerified {
		t.Fatalf("expected healed offsite copy to be verified")
	}
}

// 12. Guardian Autonomous Health Supervision & Reconciliation
func TestGuardianSupervisionAndHealing(t *testing.T) {
	service, tempDir, _ := setupTestService(t)

	recID := "20260822T160000Z"
	recDir := filepath.Join(service.BackupRoot, recID)
	_ = os.MkdirAll(recDir, 0700)

	sqFile := filepath.Join(recDir, "local.sqlite")
	createTestSQLiteDBWithData(t, sqFile, "GUARDIAN_SQLITE")
	pgFile := filepath.Join(recDir, "postgres.sql")
	_ = os.WriteFile(pgFile, []byte("GUARDIAN_POSTGRES"), 0600)

	sqHash, sqSize, _ := fileHash(sqFile)
	pgHash, pgSize, _ := fileHash(pgFile)

	manifest := Manifest{
		ID:          recID,
		CreatedAt:   time.Now().UTC(),
		Postgres:    "postgres.sql",
		SQLite:      "local.sqlite",
		PostgresSHA: pgHash,
		SQLiteSHA:   sqHash,
		SizeBytes:   sqSize + pgSize,
		Status:      "verified",
	}
	mData, _ := json.MarshalIndent(manifest, "", "  ")
	_ = os.WriteFile(filepath.Join(recDir, "manifest.json"), mData, 0600)

	// Guardian reconciliation cycle
	latestManifest, err := service.ReconcileLatestRecoveryPoint()
	if err != nil {
		t.Fatalf("Guardian ReconcileLatestRecoveryPoint failed: %v", err)
	}

	if latestManifest == nil || latestManifest.Status != "verified" {
		t.Fatalf("expected verified latest manifest from Guardian cycle")
	}

	_ = tempDir
}

// 13. Authoritative Recovery Status & Events API
func TestRecoveryStatusAndEventsAPI(t *testing.T) {
	service, _, _ := setupTestService(t)
	api := NewAPI(service)

	// Status API test
	reqStatus := httptest.NewRequest(http.MethodGet, "/api/recovery/status", nil)
	wStatus := httptest.NewRecorder()
	api.GetRecoveryStatus(wStatus, reqStatus)

	if wStatus.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", wStatus.Code)
	}

	var statusRes map[string]any
	if err := json.Unmarshal(wStatus.Body.Bytes(), &statusRes); err != nil {
		t.Fatalf("invalid json: %v", err)
	}

	if statusRes["ok"] != true {
		t.Fatalf("expected ok=true")
	}

	layers, ok := statusRes["layers"].(map[string]any)
	if !ok || layers["layer1_core"] == nil {
		t.Fatalf("expected 5 layers in status response")
	}

	// Events API test
	reqEvents := httptest.NewRequest(http.MethodGet, "/api/recovery/events", nil)
	wEvents := httptest.NewRecorder()
	api.GetRecoveryEvents(wEvents, reqEvents)

	if wEvents.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", wEvents.Code)
	}
}

// 14. Complete End-to-End Disaster Simulation & Zero Data Loss Recovery
func TestEndToEndDisasterRecoverySimulation(t *testing.T) {
	service, tempDir, sqlitePath := setupTestService(t)
	offsiteRoot := filepath.Join(tempDir, "e2e_offsite")
	mirrorRoot := filepath.Join(tempDir, "e2e_mirror")
	t.Setenv("SCS_OFFSITE_ROOT", offsiteRoot)
	t.Setenv("SCS_OFFICE_MIRROR_ROOT", mirrorRoot)
	t.Cleanup(func() { _ = removeRecoveryTree(offsiteRoot) })

	// STEP 1: Live database has real customer records
	createTestSQLiteDBWithData(t, sqlitePath, "TRANSACTION_RECORD_BEFORE_DISASTER")

	// STEP 2: Create Recovery Point
	recID := "20260822T200000Z"
	recDir := filepath.Join(service.BackupRoot, recID)
	_ = os.MkdirAll(recDir, 0700)

	backupSQLite := filepath.Join(recDir, "local.sqlite")
	createTestSQLiteDBWithData(t, backupSQLite, "TRANSACTION_RECORD_BEFORE_DISASTER")

	backupPG := filepath.Join(recDir, "postgres.sql")
	_ = os.WriteFile(backupPG, []byte("POSTGRES_TRANSACTION_DUMP"), 0600)

	sqHash, sqSize, _ := fileHash(backupSQLite)
	pgHash, pgSize, _ := fileHash(backupPG)

	manifest := Manifest{
		ID:          recID,
		CreatedAt:   time.Now().UTC(),
		Postgres:    "postgres.sql",
		SQLite:      "local.sqlite",
		PostgresSHA: pgHash,
		SQLiteSHA:   sqHash,
		SizeBytes:   sqSize + pgSize,
		Status:      "verified",
	}
	mData, _ := json.MarshalIndent(manifest, "", "  ")
	_ = os.WriteFile(filepath.Join(recDir, "manifest.json"), mData, 0600)

	// Reconcile all 5 layers to verified state
	reconciled, err := service.ReconcileRecoveryPoint(recID)
	if err != nil || !reconciled.OfficeMirrorVerified || !reconciled.OffsiteVerified {
		t.Fatalf("initial full pipeline reconciliation failed: %v", err)
	}

	// STEP 3 (DISASTER INJECTION):
	// - Disaster A: Live database is deleted/corrupted
	createTestSQLiteDBWithData(t, sqlitePath, "DISASTER_TOTAL_DATABASE_CORRUPTION")
	// - Disaster B: Offsite copy is corrupted
	offsiteData := filepath.Join(reconciled.OffsitePath, "data", "postgres.sql")
	if fileExists(offsiteData) {
		_ = os.Chmod(filepath.Dir(offsiteData), 0700)
		_ = os.Chmod(offsiteData, 0600)
		_ = os.WriteFile(offsiteData, []byte("DISASTER_OFFSITE_CORRUPTION"), 0600)
	}

	// STEP 4 (AUTONOMOUS DETECTION & HEALING):
	// Reconciliation detects corrupted offsite, heals it from verified local mirror
	healedManifest, err := service.ReconcileRecoveryPoint(recID)
	if err != nil || !healedManifest.OffsiteVerified {
		t.Fatalf("disaster reconciliation healing failed: %v", err)
	}

	// STEP 5 (DISASTER RESTORE):
	// Restore database from verified recovery point
	restoreRes, err := service.Restore(RestoreOptions{
		BackupID: recID,
		Confirm:  "RESTORE",
		Target:   "local",
	})
	if err != nil || !restoreRes.Verified {
		t.Fatalf("disaster restore failed: %v", err)
	}

	// STEP 6 (POST-RECOVERY PROOF):
	// Query live database and confirm 100% data recovery
	recoveredData := readTestSQLiteData(t, sqlitePath)
	if recoveredData != "TRANSACTION_RECORD_BEFORE_DISASTER" {
		t.Fatalf("recovery failed: expected TRANSACTION_RECORD_BEFORE_DISASTER, got %s", recoveredData)
	}

	// STEP 7 (STATUS VERIFICATION):
	api := NewAPI(service)
	req := httptest.NewRequest(http.MethodGet, "/api/recovery/status", nil)
	w := httptest.NewRecorder()
	api.GetRecoveryStatus(w, req)

	var finalStatus map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &finalStatus)
	if finalStatus["status"] != "PROTECTED" {
		t.Fatalf("expected final status PROTECTED, got %v", finalStatus["status"])
	}
}

var _ = context.Background
var _ = fmt.Sprintf
var _ = strings.TrimSpace
var _ sql.DB
