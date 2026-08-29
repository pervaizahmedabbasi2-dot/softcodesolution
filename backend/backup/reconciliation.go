package backup

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

/*
 * SCS_PHASE752B_AUTOMATIC_RECONCILIATION
 *
 * Recovery reconciliation repairs the recovery chain itself.
 *
 * Restore() changes live data.
 * Reconciliation does NOT change live data.
 *
 * Order:
 *
 * 1. Identify recovery point.
 * 2. Validate manifest.
 * 3. Verify PostgreSQL SHA-256.
 * 4. Verify SQLite SHA-256.
 * 5. Trust core recovery point.
 * 6. Verify Office Mirror.
 * 7. Rebuild Office Mirror when missing/corrupt.
 * 8. Verify rebuilt Office Mirror SHA-256.
 * 9. Verify Offsite when configured.
 * 10. Rebuild Offsite when missing/corrupt.
 * 11. Verify rebuilt Offsite SHA-256.
 * 12. Persist repaired manifest.
 * 13. Final read-back verification.
 */

func (s *Service) ReconcileRecoveryPoint(
	id string,
) (*Manifest, error) {
	// Layer 5: persistent recovery lifecycle event.
	_ = s.recordRecoveryEvent(
		context.Background(),
		id,
		"reconciliation_started",
		"started",
		"reconciliation",
		"Recovery point reconciliation started",
	)

	if strings.TrimSpace(id) == "" {
		return nil, errors.New(
			"reconciliation recovery id is required",
		)
	}

	/*
	 * CORE TRUST GATE
	 *
	 * verifyUnlocked() is the existing authoritative
	 * recovery-point validation path.
	 */
	manifest, err :=
		s.verifyUnlocked(id)

	if err != nil {
		return nil, fmt.Errorf(
			"reconciliation core verification failed: %w",
			err,
		)
	}

	// Layer 5: core recovery artifacts passed the authoritative verification gate.
	_ = s.recordRecoveryEvent(
		context.Background(),
		id,
		"core_verification",
		"verified",
		"core",
		"PostgreSQL and SQLite recovery artifacts passed core verification",
	)

	recoveryDir :=
		filepath.Join(
			s.BackupRoot,
			id,
		)

	postgresFile :=
		filepath.Join(
			recoveryDir,
			manifest.Postgres,
		)

	sqliteFile :=
		filepath.Join(
			recoveryDir,
			manifest.SQLite,
		)

	/*
	 * Core artifacts must physically exist.
	 */
	if _, err := os.Stat(postgresFile); err != nil {
		return nil, fmt.Errorf(
			"trusted recovery postgres artifact unavailable: %w",
			err,
		)
	}

	if _, err := os.Stat(sqliteFile); err != nil {
		return nil, fmt.Errorf(
			"trusted recovery sqlite artifact unavailable: %w",
			err,
		)
	}

	manifest.Status = "verified"

	/* =====================================================
	   OFFICE MIRROR
	===================================================== */

	officeMirrorHealthy := false

	if manifest.OfficeMirrorVerified &&
		strings.TrimSpace(
			manifest.OfficeMirrorPath,
		) != "" {

		if info, statErr :=
			os.Stat(
				manifest.OfficeMirrorPath,
			); statErr == nil &&
			info.IsDir() {

			actualSHA, shaErr :=
				directorySHA256(
					manifest.OfficeMirrorPath,
				)

			if shaErr == nil &&
				strings.TrimSpace(
					manifest.OfficeMirrorSHA,
				) != "" &&
				actualSHA ==
					manifest.OfficeMirrorSHA {

				officeMirrorHealthy = true

				_ = s.recordRecoveryEvent(
					context.Background(),
					id,
					"office_mirror_verified",
					"verified",
					"office_mirror",
					"Existing Office Mirror passed SHA-256 verification",
				)
			}
		}
	}

	/*
	 * Missing/corrupt Office Mirror:
	 * rebuild from trusted PostgreSQL + SQLite recovery point.
	 */
	if !officeMirrorHealthy {

		if strings.TrimSpace(
			manifest.OfficeMirrorPath,
		) != "" {

			_ = removeRecoveryTree(
				manifest.OfficeMirrorPath,
			)
		}

		officeMirror, mirrorErr :=
			s.createOfficeMirror(
				id,
				recoveryDir,
				postgresFile,
				sqliteFile,
			)

		if mirrorErr != nil {
			return nil, fmt.Errorf(
				"office mirror rebuild failed: %w",
				mirrorErr,
			)
		}

		if !officeMirror.Verified {
			return nil, errors.New(
				"rebuilt office mirror was not verified",
			)
		}

		rebuiltSHA, shaErr :=
			directorySHA256(
				officeMirror.Path,
			)

		if shaErr != nil {
			return nil, fmt.Errorf(
				"rebuilt office mirror SHA verification failed: %w",
				shaErr,
			)
		}

		if rebuiltSHA != officeMirror.SHA256 {
			return nil, errors.New(
				"rebuilt office mirror SHA mismatch",
			)
		}

		manifest.OfficeMirrorPath =
			officeMirror.Path

		manifest.OfficeMirrorSHA =
			rebuiltSHA

		manifest.OfficeMirrorVerified =
			true

		_ = s.recordRecoveryEvent(
			context.Background(),
			id,
			"office_mirror_rebuilt",
			"verified",
			"office_mirror",
			"Office Mirror rebuilt and SHA-256 verified",
		)

	} else {

		manifest.OfficeMirrorVerified =
			true
	}

	/* =====================================================
	   OFFSITE
	===================================================== */

	offsiteRoot :=
		strings.TrimSpace(
			os.Getenv(
				"SCS_OFFSITE_ROOT",
			),
		)

	if offsiteRoot == "" {

		manifest.OffsiteProvider =
			"filesystem"

		manifest.OffsiteStatus =
			"not-configured"

		manifest.OffsitePath = ""
		manifest.OffsiteSHA = ""
		manifest.OffsiteVerified = false

	} else {

		offsiteHealthy := false

		if manifest.OffsiteVerified &&
			strings.TrimSpace(
				manifest.OffsitePath,
			) != "" {

			if info, statErr :=
				os.Stat(
					manifest.OffsitePath,
				); statErr == nil &&
				info.IsDir() {

				actualSHA, shaErr :=
					directorySHA256(
						manifest.OffsitePath,
					)

				if shaErr == nil &&
					strings.TrimSpace(
						manifest.OffsiteSHA,
					) != "" &&
					actualSHA ==
						manifest.OffsiteSHA {

					offsiteHealthy = true
				}
			}
		}

		/*
		 * Missing/corrupt Offsite:
		 * rebuild from verified Office Mirror.
		 */
		if !offsiteHealthy {

			/*
			 * FINAL OFFSITE REBUILD CLEANUP
			 *
			 * Remove both the manifest path and the canonical
			 * SCS_OFFSITE_ROOT/<recoveryID> path.
			 *
			 * createOffsiteCopy() retains its no-overwrite
			 * protection; reconciliation performs healing.
			 */
			cleanupPaths := []string{
				strings.TrimSpace(manifest.OffsitePath),
			}

			cleanupRoot := strings.TrimSpace(os.Getenv("SCS_OFFSITE_ROOT"))
			if cleanupRoot != "" {
				cleanupPaths = append(
					cleanupPaths,
					filepath.Join(cleanupRoot, id),
				)
			}

			seenCleanupPaths := make(map[string]struct{})

			for _, cleanupPath := range cleanupPaths {
				cleanupPath = strings.TrimSpace(cleanupPath)

				if cleanupPath == "" {
					continue
				}

				if _, seen := seenCleanupPaths[cleanupPath]; seen {
					continue
				}

				seenCleanupPaths[cleanupPath] = struct{}{}

				if err := removeRecoveryTree(cleanupPath); err != nil {
					return nil, fmt.Errorf(
						"offsite stale tree cleanup failed: %w",
						err,
					)
				}
			}

			offsite := s.createOffsiteCopy(
				id,
				manifest.OfficeMirrorPath,
			)

			if !offsite.Verified {
				return nil, fmt.Errorf(
					"offsite rebuild failed: provider=%s status=%s path=%s sha256=%s",
					offsite.Provider,
					offsite.Status,
					offsite.Path,
					offsite.SHA256,
				)
			}

			rebuiltSHA, shaErr := directorySHA256(offsite.Path)

			if shaErr != nil {
				return nil, fmt.Errorf(
					"rebuilt offsite SHA verification failed: %w",
					shaErr,
				)
			}

			if rebuiltSHA != offsite.SHA256 {
				return nil, errors.New("rebuilt offsite SHA mismatch")
			}

			manifest.OffsiteProvider = offsite.Provider
			manifest.OffsiteStatus = offsite.Status
			manifest.OffsitePath = offsite.Path
			manifest.OffsiteSHA = offsite.SHA256
			manifest.OffsiteVerified = true
		} else {

			manifest.OffsiteStatus =
				"verified"

			manifest.OffsiteVerified =
				true

			_ = s.recordRecoveryEvent(
				context.Background(),
				id,
				"offsite_verified",
				"verified",
				"offsite",
				"Existing Offsite artifact passed SHA-256 verification",
			)
		}
	}

	/* =====================================================
	   PERSIST RECONCILED MANIFEST
	===================================================== */

	manifest.Status = "verified"

	data, err :=
		json.MarshalIndent(
			manifest,
			"",
			"  ",
		)

	if err != nil {
		return nil, fmt.Errorf(
			"reconciled manifest encoding failed: %w",
			err,
		)
	}

	if err := os.WriteFile(
		filepath.Join(
			recoveryDir,
			"manifest.json",
		),
		data,
		0600,
	); err != nil {
		return nil, fmt.Errorf(
			"reconciled manifest write failed: %w",
			err,
		)
	}

	// Layer 5: reconciled manifest was successfully persisted.
	_ = s.recordRecoveryEvent(
		context.Background(),
		id,
		"manifest_persisted",
		"success",
		"reconciliation",
		"Reconciled manifest persisted successfully",
	)

	/*
	 * FINAL TRUST GATE
	 *
	 * Read the persisted manifest again and run the existing
	 * core verification path.
	 */
	finalManifest, err :=
		s.verifyUnlocked(id)

	if err != nil {
		return nil, fmt.Errorf(
			"final reconciliation verification failed: %w",
			err,
		)
	}

	// Layer 5: final persisted recovery state passed the
	// existing authoritative verification gate.
	_ = s.recordRecoveryEvent(
		context.Background(),
		id,
		"reconciliation_completed",
		"success",
		"reconciliation",
		"Final authoritative recovery verification succeeded",
	)
	/*
	 * Successful authoritative reconciliation establishes
	 * Guardian health for this exact recovery point.
	 *
	 * This is a real lifecycle event, not a status override.
	 */
	_ = s.recordRecoveryEvent(
		context.Background(),
		id,
		"guardian_health",
		"healthy",
		"guardian",
		"Guardian reconciliation cycle completed successfully",
	)

	return finalManifest, nil
}

/*
 * removeRecoveryTree removes a recovery artifact tree
 * before rebuilding it.
 *
 * It never touches live PostgreSQL or SQLite data.
 */
/*
 * SCS_PHASE752C_LATEST_TRUSTED_RECOVERY
 *
 * Select the newest recovery point whose core
 * PostgreSQL + SQLite artifacts pass the existing
 * authoritative verification path.
 *
 * A corrupt/incomplete recovery point is never trusted.
 * The next newest valid recovery point may be used.
 *
 * This method never restores live databases.
 */
func (s *Service) ReconcileLatestRecoveryPoint() (*Manifest, error) {

	/*
	 * SCS_PHASE752D_EXISTING_MUTEX
	 *
	 * The Service already owns the authoritative mutex.
	 * Serialize automatic recovery reconciliation so two
	 * Guardian cycles can never rebuild the same recovery
	 * point concurrently.
	 */
	s.mu.Lock()
	defer s.mu.Unlock()

	entries, err := os.ReadDir(s.BackupRoot)

	if err != nil {
		if errors.Is(
			err,
			os.ErrNotExist,
		) {
			return nil, nil
		}

		return nil, fmt.Errorf(
			"reconciliation backup root unavailable: %w",
			err,
		)
	}

	ids := make([]string, 0)

	for _, entry := range entries {

		if !entry.IsDir() {
			continue
		}

		ids = append(
			ids,
			entry.Name(),
		)
	}

	/*
	 * Recovery IDs are timestamp-based.
	 * Descending lexical order therefore places
	 * the newest recovery point first.
	 */
	sort.Strings(ids)

	for i := len(ids) - 1; i >= 0; i-- {

		id := ids[i]

		if _, err := s.verifyUnlocked(id); err != nil {
			continue
		}

		return s.ReconcileRecoveryPoint(id)
	}

	// SCS_PHASE752E_FINAL_RECOVERY_HEALTH
	//
	// No trusted recovery point was available.
	// The caller must keep the system in recovery/degraded
	// state rather than falsely reporting protection.
	return nil, nil
}

func removeRecoveryTree(
	root string,
) error {

	if strings.TrimSpace(root) == "" {
		return nil
	}

	if _, err := os.Stat(root); err != nil {

		if errors.Is(
			err,
			os.ErrNotExist,
		) {
			return nil
		}

		return err
	}

	err := filepath.Walk(
		root,
		func(
			path string,
			info os.FileInfo,
			walkErr error,
		) error {

			if walkErr != nil {
				return walkErr
			}

			if info.IsDir() {
				return os.Chmod(
					path,
					0700,
				)
			}

			return os.Chmod(
				path,
				0600,
			)
		},
	)

	if err != nil {
		return err
	}

	return os.RemoveAll(root)
}
