# SoftCodeSolution Backup Core

Phase 677A provides the real backup engine.

## Sources

- PostgreSQL logical backup through pg_dump
- Local SQLite database image

## Verification

Every backup contains:

- PostgreSQL dump
- SQLite database image
- SHA-256 checksums
- manifest.json

## Important

Restore is deliberately NOT performed by the backup operation.

Restore will be implemented as a separate controlled phase so a
backup operation can never accidentally overwrite live data.
