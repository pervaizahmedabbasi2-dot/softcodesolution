package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"
)

func gatewayDistributedRateLimitKey(r *http.Request, keyID, tenantID string) string {
	return tenantID + "|" + keyID + "|" + r.Method + "|" + r.URL.Path
}

func gatewayEnsureDistributedRateLimitSchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS api_gateway_rate_limit_windows (
			counter_key TEXT PRIMARY KEY,
			window_start TIMESTAMPTZ NOT NULL,
			request_count INTEGER NOT NULL DEFAULT 0,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS
		idx_api_gateway_rate_limit_windows_updated
		ON api_gateway_rate_limit_windows(updated_at);
	`)

	return err
}

func gatewayLoadRateLimitPolicy(ctx context.Context, db *sql.DB, tenantID, keyID, path string) (int, int, error) {
	var windowSeconds int
	var maxRequests int

	err := db.QueryRowContext(ctx, `
		SELECT window_seconds, max_requests
		FROM api_gateway_rate_limits
		WHERE tenant_id = $1
		  AND (api_key_id = $2 OR api_key_id IS NULL)
		  AND enabled = TRUE
		  AND (path_pattern = $3 OR path_pattern = '*')
		ORDER BY
			CASE WHEN api_key_id = $2 THEN 0 ELSE 1 END,
			CASE WHEN path_pattern = $3 THEN 0 ELSE 1 END
		LIMIT 1
	`, tenantID, keyID, path).Scan(&windowSeconds, &maxRequests)

	if err == sql.ErrNoRows {
		return 60, 60, nil
	}

	if err != nil {
		return 0, 0, err
	}

	if windowSeconds < 1 {
		windowSeconds = 60
	}

	if maxRequests < 1 {
		maxRequests = 1
	}

	return windowSeconds, maxRequests, nil
}

func gatewayDistributedRateLimit(db *sql.DB, r *http.Request, keyID, tenantID string) (bool, int, time.Duration, error) {
	ctx := r.Context()

	if err := gatewaySecurityEnsureRateLimitSchema(ctx, db); err != nil {
		return false, 0, 0, err
	}

	if err := gatewayEnsureDistributedRateLimitSchema(ctx, db); err != nil {
		return false, 0, 0, err
	}

	windowSeconds, maxRequests, err := gatewayLoadRateLimitPolicy(
		ctx,
		db,
		tenantID,
		keyID,
		r.URL.Path,
	)

	if err != nil {
		return false, 0, 0, err
	}

	window := time.Duration(windowSeconds) * time.Second
	now := time.Now().UTC()
	counterKey := gatewayDistributedRateLimitKey(r, keyID, tenantID)

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return false, 0, 0, err
	}

	defer func() {
		_ = tx.Rollback()
	}()

	var windowStart time.Time
	var requestCount int

	err = tx.QueryRowContext(ctx, `
		SELECT window_start, request_count
		FROM api_gateway_rate_limit_windows
		WHERE counter_key = $1
		FOR UPDATE
	`, counterKey).Scan(&windowStart, &requestCount)

	if err == sql.ErrNoRows {
		windowStart = now
		requestCount = 1

		_, err = tx.ExecContext(ctx, `
			INSERT INTO api_gateway_rate_limit_windows (
				counter_key,
				window_start,
				request_count,
				updated_at
			)
			VALUES ($1, $2, 1, NOW())
		`, counterKey, now)

		if err != nil {
			return false, 0, 0, err
		}
	} else if err != nil {
		return false, 0, 0, err
	} else if now.Sub(windowStart) >= window {
		windowStart = now
		requestCount = 1

		_, err = tx.ExecContext(ctx, `
			UPDATE api_gateway_rate_limit_windows
			SET
				window_start = $2,
				request_count = 1,
				updated_at = NOW()
			WHERE counter_key = $1
		`, counterKey, now)

		if err != nil {
			return false, 0, 0, err
		}
	} else {
		if requestCount >= maxRequests {
			retryAfter := time.Until(windowStart.Add(window))
			if retryAfter < 0 {
				retryAfter = 0
			}

			if err := tx.Commit(); err != nil {
				return false, 0, 0, err
			}

			return false, 0, retryAfter, nil
		}

		requestCount++

		_, err = tx.ExecContext(ctx, `
			UPDATE api_gateway_rate_limit_windows
			SET request_count = $2, updated_at = NOW()
			WHERE counter_key = $1
		`, counterKey, requestCount)

		if err != nil {
			return false, 0, 0, err
		}
	}

	if err := tx.Commit(); err != nil {
		return false, 0, 0, err
	}

	remaining := maxRequests - requestCount
	if remaining < 0 {
		remaining = 0
	}

	retryAfter := time.Until(windowStart.Add(window))
	if retryAfter < 0 {
		retryAfter = 0
	}

	return true, remaining, retryAfter, nil
}

func gatewayRateLimitHeaders(w http.ResponseWriter, remaining int, retryAfter time.Duration) {
	if remaining < 0 {
		remaining = 0
	}

	w.Header().Set(
		"X-RateLimit-Remaining",
		fmt.Sprintf("%d", remaining),
	)

	seconds := int(retryAfter.Seconds())
	if seconds < 1 {
		seconds = 1
	}

	w.Header().Set("Retry-After", fmt.Sprintf("%d", seconds))
}

func gatewayRateLimitMethodSupported(method string) bool {
	switch strings.ToUpper(method) {
	case http.MethodGet, http.MethodHead, http.MethodOptions,
		http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	default:
		return false
	}
}
