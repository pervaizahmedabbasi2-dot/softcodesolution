package main

import (
	"context"
	"database/sql"
	_ "embed"
)

//go:embed database/seeds/modules_enterprise_221.sql
var enterpriseModuleCatalogSQL string

func seedEnterpriseModuleCatalogV1(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, enterpriseModuleCatalogSQL)
	return err
}
