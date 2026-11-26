package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	logistics "scs-backend/backend/logistics_courier"
	pharmacy "scs-backend/backend/pharmacy_store"
	retail "scs-backend/backend/retail_pos"
)

func registerPhase3HardwareHTTPRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/retail/barcode-lookup", handleRetailBarcodeLookup)
	mux.HandleFunc("/api/pharmacy/barcode-lookup", handlePharmacyBarcodeLookup)
	mux.HandleFunc("/api/logistics/waybill/", handleLogisticsWaybillLookup)
}

func openOptionalPhase3DB(ctx context.Context) *sql.DB {
	db, err := openRegisterDB(ctx)
	if err != nil {
		return nil
	}
	return db
}

func handleRetailBarcodeLookup(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is allowed.")
		return
	}

	code := strings.TrimSpace(r.URL.Query().Get("code"))
	if code == "" {
		writePhase3Error(w, http.StatusBadRequest, "", "Barcode or SKU code is required.")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	db := openOptionalPhase3DB(ctx)
	if db != nil {
		defer db.Close()
	}

	product, found, err := retail.LookupProductByBarcodeOrSKU(db, code)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to lookup barcode.")
		return
	}
	if !found {
		writePhase3Error(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", fmt.Sprintf("No SKU found for barcode \"%s\".", code))
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"product": product,
	})
}

func handlePharmacyBarcodeLookup(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is allowed.")
		return
	}

	code := strings.TrimSpace(r.URL.Query().Get("code"))
	if code == "" {
		writePhase3Error(w, http.StatusBadRequest, "", "Medicine barcode or batch code is required.")
		return
	}
	asOfDate := strings.TrimSpace(r.URL.Query().Get("asOfDate"))

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	db := openOptionalPhase3DB(ctx)
	if db != nil {
		defer db.Close()
	}

	res, found, err := pharmacy.LookupMedicineFEFO(db, code, asOfDate)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to lookup medicine batches.")
		return
	}
	if !found || res == nil {
		writePhase3Error(w, http.StatusNotFound, "MEDICINE_NOT_FOUND", fmt.Sprintf("No medicine batch found for \"%s\".", code))
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":               true,
		"strategy":         res.Strategy,
		"recommendedBatch": res.RecommendedBatch,
		"batches":          res.Batches,
	})
}

func handleLogisticsWaybillLookup(w http.ResponseWriter, r *http.Request) {
	if phase3Begin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writePhase3Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is allowed.")
		return
	}

	trackingNo := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/api/logistics/waybill/"))
	trackingNo = strings.Trim(trackingNo, "/")
	if trackingNo == "" || strings.Contains(trackingNo, "/") {
		writePhase3Error(w, http.StatusBadRequest, "", "Tracking number is required.")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	db := openOptionalPhase3DB(ctx)
	if db != nil {
		defer db.Close()
	}

	wb, found, err := logistics.LookupWaybill(db, trackingNo)
	if err != nil {
		writePhase3Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to lookup waybill.")
		return
	}
	if !found {
		writePhase3Error(w, http.StatusNotFound, "", fmt.Sprintf("Waybill %s not found.", strings.ToUpper(trackingNo)))
		return
	}

	writeAPIJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"waybill": wb,
	})
}
