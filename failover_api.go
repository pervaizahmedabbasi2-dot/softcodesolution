package main

import (
	"context"
	"encoding/json"
	"net/http"

	"scs-backend/backend/backup"
)

var scsFailoverController = backup.NewFailoverController()

func handleFailoverStatus(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodGet {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(
		scsFailoverController.Status(),
	)
}

func handleFailoverEvaluate(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	status, err :=
		scsFailoverController.Evaluate(
			context.Background(),
		)

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	if err != nil {
		w.WriteHeader(
			http.StatusConflict,
		)

		_ = json.NewEncoder(w).Encode(
			map[string]interface{}{
				"success": false,
				"status":  status,
				"error":   err.Error(),
			},
		)

		return
	}

	_ = json.NewEncoder(w).Encode(
		map[string]interface{}{
			"success": true,
			"status":  status,
		},
	)
}

func handleFailoverPromote(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	status, err :=
		scsFailoverController.Promote(
			context.Background(),
		)

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	if err != nil {
		w.WriteHeader(
			http.StatusConflict,
		)

		_ = json.NewEncoder(w).Encode(
			map[string]interface{}{
				"success": false,
				"status":  status,
				"error":   err.Error(),
			},
		)

		return
	}

	_ = json.NewEncoder(w).Encode(
		map[string]interface{}{
			"success": true,
			"status":  status,
		},
	)
}
