package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"path/filepath"
	"scs-backend/backend/backup"
	"strings"
	"syscall"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed frontend/dist/softcode-ui
var assets embed.FS

const (
	appName           = "softcodesolution"
	embeddedAssetPath = "frontend/dist/softcode-ui/browser"
	defaultPreview    = "127.0.0.1:8080"
	auditDir          = "logs"
	auditFileName     = "guardian-audit.log"
)

var bootTime = time.Now().UTC()

type runtimeConfig struct {
	PreviewAddr     string
	LicenseRequired bool
	LicenseKey      string
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg := loadRuntimeConfig()

	audit("system_boot", "SoftCodeSolution Guardian starting")

	if !licenseGate(cfg) {
		audit("license_blocked", "License gate rejected startup")
		log.Fatal("License check failed. Set SOFTCODE_LICENSE_KEY or disable SOFTCODE_LICENSE_REQUIRED.")
	}

	startPostgresSafe()

	// SCS_PHASE_LAYER5_APPLICATION_BACKUP_DB
	//
	// One application-owned PostgreSQL connection pool is shared
	// by the Backup API and Guardian reconciliation lifecycle.
	// Existing registration/auth DB lifecycle remains unchanged.
	backupDB, err := openSoftCodeBackupDB(ctx)
	if err != nil {
		log.Fatalf("Layer 5 backup PostgreSQL connection failed: %v", err)
	}

	defer func() {
		if err := backupDB.Close(); err != nil {
			audit("backup_db_close_error", err.Error())
		}
	}()

	backupService := createSoftCodeBackupService(backupDB)

	go startGuardianMonitor(ctx, backupService)
	go startSQLiteToPostgresSyncWorker(ctx)
	go startFirebasePreviewServer(ctx, cfg, backupService)

	// Firebase Studio / IDX / normal terminal ke liye default web mode.
	// Isse "go run ." par Wails build-tags error nahi aayega.
	if isWebOnlyMode() {
		audit("web_only_mode", "Wails desktop runtime skipped; serving web preview only")
		log.Println("SoftCodeSolution web mode active.")
		log.Println("Frontend + Backend + PostgreSQL Guardian server is running.")
		log.Println("Press Ctrl+C to stop.")
		<-ctx.Done()
		audit("system_shutdown", "Web-only mode shutdown")
		return
	}

	app := NewApp()

	err = wails.Run(&options.App{
		Title:  appName,
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		OnShutdown: func(ctx context.Context) {
			audit("system_shutdown", "Wails app shutdown")
			stop()
		},
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		audit("fatal_error", err.Error())
		log.Fatalf("Eternity Engine failed to start: %v", err)
	}
}

func loadRuntimeConfig() runtimeConfig {
	addr := os.Getenv("SOFTCODE_PREVIEW_ADDR")
	if addr == "" {
		addr = defaultPreview
	}

	licenseRequired := strings.EqualFold(os.Getenv("SOFTCODE_LICENSE_REQUIRED"), "true") ||
		os.Getenv("SOFTCODE_LICENSE_REQUIRED") == "1"

	return runtimeConfig{
		PreviewAddr:     addr,
		LicenseRequired: licenseRequired,
		LicenseKey:      os.Getenv("SOFTCODE_LICENSE_KEY"),
	}
}

func licenseGate(cfg runtimeConfig) bool {
	if !cfg.LicenseRequired {
		audit("license_gate", "License requirement disabled for local/dev startup")
		return true
	}

	key := strings.TrimSpace(cfg.LicenseKey)
	if len(key) < 24 {
		return false
	}

	audit("license_gate", "License key detected")
	return true
}

func startPostgresSafe() {
	audit("postgres_check", "Checking PostgreSQL")

	if commandExists("pg_isready") && postgresReady() {
		log.Println("PostgreSQL already running")
		audit("postgres_ready", "PostgreSQL already running")
		return
	}

	if !commandExists("pg_ctl") {
		log.Println("pg_ctl not found, skipping PostgreSQL auto-start")
		audit("postgres_skip", "pg_ctl not found")
		return
	}

	pgData := findPostgresDataDir()
	if pgData == "" {
		log.Println("PGDATA not found. Set PGDATA or start PostgreSQL from startup script.")
		audit("postgres_pgdata_missing", "PGDATA not found")
		return
	}

	if !fileExists(filepath.Join(pgData, "PG_VERSION")) {
		log.Println("Invalid PGDATA:", pgData)
		audit("postgres_invalid_pgdata", pgData)
		return
	}

	log.Println("Starting PostgreSQL from:", pgData)
	audit("postgres_start_attempt", pgData)

	logFile := filepath.Join(pgData, "postgres.log")

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "pg_ctl", "-D", pgData, "-l", logFile, "start")
	output, err := cmd.CombinedOutput()

	if err != nil {
		out := string(output)

		if strings.Contains(out, "another server might be running") {
			time.Sleep(2 * time.Second)

			if postgresReady() {
				log.Println("PostgreSQL is already running")
				audit("postgres_ready_after_duplicate_start", "PostgreSQL already running")
				return
			}
		}

		log.Println("PostgreSQL start warning:", err)
		log.Println(out)
		audit("postgres_start_warning", err.Error())
		return
	}

	if waitForPostgres(15 * time.Second) {
		log.Println("PostgreSQL started successfully")
		audit("postgres_started", "PostgreSQL started successfully")
		return
	}

	log.Println("PostgreSQL start attempted, but readiness check failed")
	audit("postgres_readiness_failed", "pg_isready failed after start")
}

func findPostgresDataDir() string {
	if pgData := os.Getenv("PGDATA"); pgData != "" {
		return pgData
	}

	home, _ := os.UserHomeDir()

	possiblePaths := []string{
		filepath.Join(".", "postgres-data"),
		filepath.Join(".", ".postgres"),
		filepath.Join(home, "postgres-data"),
		filepath.Join(home, ".postgres"),
		filepath.Join(home, ".local", "share", "postgres"),
	}

	for _, p := range possiblePaths {
		if fileExists(filepath.Join(p, "PG_VERSION")) {
			return p
		}
	}

	return ""
}

func postgresReady() bool {
	if !commandExists("pg_isready") {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "pg_isready")
	return cmd.Run() == nil
}

func waitForPostgres(timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)

	for time.Now().Before(deadline) {
		if postgresReady() {
			return true
		}
		time.Sleep(1 * time.Second)
	}

	return false
}

func openSoftCodeBackupDB(ctx context.Context) (*sql.DB, error) {
	dsn := os.Getenv("DATABASE_URL")

	if dsn == "" {
		host := getenvDefault("SCS_DB_HOST", "127.0.0.1")
		port := getenvDefault("SCS_DB_PORT", "5432")
		user := getenvDefault("SCS_DB_USER", "user")
		dbname := getenvDefault("SCS_DB_NAME", "softcodesolution")
		sslmode := getenvDefault("SCS_DB_SSLMODE", "disable")
		password := os.Getenv("SCS_DB_PASSWORD")

		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s dbname=%s sslmode=%s",
			host,
			port,
			user,
			dbname,
			sslmode,
		)

		if password != "" {
			dsn += " password=" + password
		}
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}
func startFirebasePreviewServer(
	ctx context.Context,
	cfg runtimeConfig,
	backupService *backup.Service,
) {
	subFS, err := fs.Sub(assets, embeddedAssetPath)
	if err != nil {
		log.Println("Preview asset error:", err)
		audit("preview_asset_error", err.Error())
		return
	}

	mux := http.NewServeMux()
	registerHTTPRoutes(mux, backupService)

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		requestID := requestIDFrom(r)
		secureHeaders(w, requestID)

		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write([]byte(fmt.Sprintf(
			`{"status":"ok","app":"%s","uptime_seconds":%d,"request_id":"%s"}`,
			appName,
			int(time.Since(bootTime).Seconds()),
			requestID,
		)))
	})

	mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
		requestID := requestIDFrom(r)
		secureHeaders(w, requestID)

		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		indexOK := assetExists(subFS, "index.html")
		dbOK := postgresReady()

		status := http.StatusOK
		state := "ready"

		if !indexOK {
			status = http.StatusServiceUnavailable
			state = "asset_missing"
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(status)
		_, _ = w.Write([]byte(fmt.Sprintf(
			`{"status":"%s","asset_index":%t,"postgres":%t,"request_id":"%s"}`,
			state,
			indexOK,
			dbOK,
			requestID,
		)))
	})

	fileServer := http.FileServer(http.FS(subFS))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		requestID := requestIDFrom(r)
		secureHeaders(w, requestID)

		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		cleanPath := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")

		if cleanPath == "" || cleanPath == "." {
			serveIndex(w, subFS)
			return
		}

		if !fs.ValidPath(cleanPath) {
			http.Error(w, "bad request", http.StatusBadRequest)
			audit("preview_bad_path", cleanPath)
			return
		}

		if _, err := fs.Stat(subFS, cleanPath); err == nil {
			fileServer.ServeHTTP(w, r)
			return
		}

		serveIndex(w, subFS)
	})

	server := &http.Server{
		Addr:              cfg.PreviewAddr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		<-ctx.Done()

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		audit("preview_server_shutdown", "Shutdown signal received")
		_ = server.Shutdown(shutdownCtx)
	}()

	log.Println("Firebase Studio preview server running on http://" + cfg.PreviewAddr)
	audit("preview_server_start", cfg.PreviewAddr)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Println("Preview server failed:", err)
		audit("preview_server_failed", err.Error())
	}
}

func serveIndex(w http.ResponseWriter, subFS fs.FS) {
	index, err := fs.ReadFile(subFS, "index.html")
	if err != nil {
		http.Error(w, "index.html not found. Run Angular build first.", http.StatusInternalServerError)
		audit("preview_index_missing", err.Error())
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write(index)
}

func secureHeaders(w http.ResponseWriter, requestID string) {
	w.Header().Set("X-Request-ID", requestID)
	w.Header().Set("Idempotency-Key", requestID)
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
	w.Header().Set("Cache-Control", "no-store")

	w.Header().Set(
		"Content-Security-Policy",
		"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://localhost:* ws://localhost:*;",
	)
}

func requestIDFrom(r *http.Request) string {
	for _, header := range []string{"Idempotency-Key", "X-Request-ID"} {
		value := strings.TrimSpace(r.Header.Get(header))
		if value != "" {
			return sanitizeHeader(value)
		}
	}

	sum := sha256.Sum256([]byte(fmt.Sprintf(
		"%s|%s|%d",
		r.Method,
		r.URL.Path,
		time.Now().UnixNano(),
	)))

	return hex.EncodeToString(sum[:])[:24]
}

func sanitizeHeader(value string) string {
	value = strings.ReplaceAll(value, "\n", "")
	value = strings.ReplaceAll(value, "\r", "")
	value = strings.TrimSpace(value)

	if len(value) > 80 {
		value = value[:80]
	}

	if value == "" {
		return "unknown"
	}

	return value
}

type guardianRuntimeTelemetry struct {
	Heartbeat         string                 `json:"heartbeat"`
	CrashRestartCount int                    `json:"crash_restart_count"`
	IncidentCount     int                    `json:"incident_count"`
	CurrentOperation  string                 `json:"current_operation"`
	LastHeartbeat     time.Time              `json:"last_heartbeat"`
	Incidents         []backup.RecoveryEvent `json:"incidents,omitempty"`
}

func writeGuardianRuntimeTelemetry(
	ctx context.Context,
	backupService *backup.Service,
	heartbeat time.Time,
	operation string,
	crashRestartCount int,
) {

	events := make(
		[]backup.RecoveryEvent,
		0,
	)

	if backupService != nil {
		if existing, err := backupService.ListRecoveryEvents(
			ctx,
			100,
		); err == nil {
			events = existing
		}
	}

	incidentEvents := make(
		[]backup.RecoveryEvent,
		0,
		len(events),
	)

	for _, event := range events {
		eventType :=
			strings.ToLower(
				strings.TrimSpace(
					event.EventType,
				),
			)

		status :=
			strings.ToLower(
				strings.TrimSpace(
					event.Status,
				),
			)

		component :=
			strings.ToLower(
				strings.TrimSpace(
					event.Component,
				),
			)

		isIncident :=
			strings.Contains(eventType, "incident") ||
				strings.Contains(eventType, "crash") ||
				strings.Contains(eventType, "restart") ||
				strings.Contains(component, "incident") ||
				strings.Contains(component, "crash") ||
				strings.Contains(component, "supervisor") ||
				status == "error" ||
				status == "failed" ||
				status == "failure"

		if isIncident {
			incidentEvents =
				append(
					incidentEvents,
					event,
				)
		}
	}

	telemetry :=
		guardianRuntimeTelemetry{
			Heartbeat:         "LIVE",
			CrashRestartCount: crashRestartCount,
			IncidentCount:     len(incidentEvents),
			CurrentOperation:  operation,
			LastHeartbeat:     heartbeat.UTC(),
			Incidents:         incidentEvents,
		}

	dir :=
		filepath.Join(
			"backend",
			"guardian",
			"data",
		)

	if err := os.MkdirAll(
		dir,
		0750,
	); err != nil {
		log.Printf(
			"[GUARDIAN TELEMETRY] mkdir: %v",
			err,
		)
		return
	}

	payload, err :=
		json.MarshalIndent(
			telemetry,
			"",
			"  ",
		)

	if err != nil {
		log.Printf(
			"[GUARDIAN TELEMETRY] marshal: %v",
			err,
		)
		return
	}

	target :=
		filepath.Join(
			dir,
			"supervisor-telemetry.json",
		)

	temp := target + ".tmp"

	if err := os.WriteFile(
		temp,
		payload,
		0600,
	); err != nil {
		log.Printf(
			"[GUARDIAN TELEMETRY] write: %v",
			err,
		)
		return
	}

	if err := os.Rename(
		temp,
		target,
	); err != nil {
		_ = os.Remove(temp)

		log.Printf(
			"[GUARDIAN TELEMETRY] rename: %v",
			err,
		)

		return
	}
}

func startGuardianMonitor(
	ctx context.Context,
	backupService *backup.Service,
) {

	/*
	 * SCS_PHASE752C_AUTOMATIC_RECONCILIATION
	 *
	 * The application-owned backup service is reused.
	 * No duplicate database connection is created.
	 */
	ticker := time.NewTicker(
		10 * time.Second,
	)

	defer ticker.Stop()

	writeGuardianRuntimeTelemetry(
		ctx,
		backupService,
		time.Now().UTC(),
		"STARTING",
		0,
	)

	audit(
		"guardian_monitor",
		"Background monitor started; reconciliation interval=10s",
	)

	for {

		select {

		case <-ctx.Done():

			audit(
				"guardian_monitor",
				"Background monitor stopped",
			)

			return

		case <-ticker.C:

			writeGuardianRuntimeTelemetry(
				ctx,
				backupService,
				time.Now().UTC(),
				"OBSERVING",
				0,
			)

			postgresStatus :=
				"postgres=false"

			if postgresReady() {
				postgresStatus =
					"postgres=true"
			}

			audit(
				"guardian_heartbeat",
				postgresStatus,
			)

			/*
			 * Reconciliation repairs the recovery
			 * chain only.
			 *
			 * It does NOT call Restore().
			 * It does NOT modify live PostgreSQL.
			 * It does NOT modify live SQLite.
			 */
			writeGuardianRuntimeTelemetry(
				ctx,
				backupService,
				time.Now().UTC(),
				"RECONCILING",
				0,
			)

			manifest, err :=
				backupService.ReconcileLatestRecoveryPoint()

			if err != nil {

				writeGuardianRuntimeTelemetry(
					ctx,
					backupService,
					time.Now().UTC(),
					"ERROR",
					0,
				)

				audit(
					"guardian_reconciliation_error",
					err.Error(),
				)

				continue
			}

			if manifest == nil {

				audit(
					"guardian_reconciliation",
					"no trusted recovery point available",
				)

				continue
			}

			writeGuardianRuntimeTelemetry(
				ctx,
				backupService,
				time.Now().UTC(),
				"OBSERVING",
				0,
			)

			audit(
				"guardian_reconciliation",
				"latest recovery point reconciled and verified",
			)
		}
	}
}

func assetExists(subFS fs.FS, name string) bool {
	_, err := fs.Stat(subFS, name)
	return err == nil
}

func audit(event string, message string) {
	log.Printf("[AUDIT] %s: %s", event, message)

	_ = os.MkdirAll(auditDir, 0750)

	file := filepath.Join(auditDir, auditFileName)

	previousHash := previousAuditHash(file)

	raw := fmt.Sprintf(
		"%s|%s|%s|%s",
		time.Now().UTC().Format(time.RFC3339),
		sanitizeLog(event),
		sanitizeLog(message),
		previousHash,
	)

	sum := sha256.Sum256([]byte(raw))
	currentHash := hex.EncodeToString(sum[:])

	line := fmt.Sprintf("%s|hash=%s\n", raw, currentHash)

	f, err := os.OpenFile(file, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0640)
	if err != nil {
		log.Println("audit log write failed:", err)
		return
	}
	defer f.Close()

	_, _ = f.WriteString(line)
}

func previousAuditHash(file string) string {
	data, err := os.ReadFile(file)
	if err != nil || len(data) == 0 {
		return "genesis"
	}

	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(lines) == 0 {
		return "genesis"
	}

	last := lines[len(lines)-1]
	idx := strings.LastIndex(last, "hash=")
	if idx == -1 {
		return "unknown"
	}

	return strings.TrimSpace(last[idx+5:])
}

func sanitizeLog(value string) string {
	value = strings.ReplaceAll(value, "\n", " ")
	value = strings.ReplaceAll(value, "\r", " ")
	value = strings.ReplaceAll(value, "|", "/")
	value = strings.TrimSpace(value)

	if len(value) > 500 {
		value = value[:500]
	}

	if value == "" {
		return "empty"
	}

	return value
}

func commandExists(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func isWebOnlyMode() bool {
	// Default true: normal "go run ." Firebase/IDX/offline web preview me chalega.
	// Desktop Wails app ke liye: SOFTCODE_DESKTOP=1 wails dev
	if truthy(os.Getenv("SOFTCODE_DESKTOP")) {
		return false
	}

	webOnly := strings.TrimSpace(os.Getenv("SOFTCODE_WEB_ONLY"))
	if webOnly == "" {
		return true
	}

	return truthy(webOnly)
}

func truthy(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return value == "1" || value == "true" || value == "yes" || value == "on"
}
