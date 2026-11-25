# SoftCodeSolution — Pure Go + Angular + Dual-DB (SQLite & PostgreSQL) Migration Handover Guide

> **Purpose of this file**: Complete technical handover and progress tracker for migrating the remaining Node.js backend endpoints (`*.routes.js`) into a unified **Go (`backend/desktop_wails/` + domain Go packages)** backend alongside **Angular 21 (`frontend/`)** and **Dual-DB (SQLite Offline-First + PostgreSQL Cloud / RLS)**.
> If you switch accounts or resume on another session after exporting/importing via GitHub, paste the **Continuity Prompt** at the bottom of this file to resume from the exact next step with zero lost context.

---

## 1. Current Architecture & Environment Facts

### What Runs Where
1. **AI Studio Web Sandbox (`npm start` -> `server.js`)**:
   - Currently does **not** include the `go` toolchain or `postgresql` server inside the preview container.
   - Live Node.js + SQLite preview stays intact and functional while Go code is built incrementally.
2. **GitHub Actions CI (`/.github/workflows/ci-cd.yml`)**:
   - Runs **Node.js backend + Angular build/unit tests** AND **`go-backend-verify`** (`go build` + `go test` on Go packages).
   - Every push to GitHub compiles and tests the Go code on Linux automatically.
3. **Firebase Studio / IDX (`/.idx/dev.nix`) & Local Machine / Docker**:
   - Installs **Go, Node.js 22, PostgreSQL 16, SQLite3, GCC**.
   - Auto-initializes PostgreSQL (`$HOME/.softcodesolution-postgres`), applies `backend/auth/database/cloud_schema.sql`, applies SQLite schemas (`platform_schema.sql`, `local_schema.sql`, and all `backend/*/*_schema.sql`), builds Angular, boots Go backend (`go run ./backend/desktop_wails`) on `127.0.0.1:8080`, and launches Angular dev server with `/api` proxy to `:8080`.

---

## 2. Go vs Node.js Audit (Baseline Inventory)

### Already Implemented in Go
| Area | Location | Functionality |
|---|---|---|
| Go Module Root | `/go.mod`, `/go.sum` | Unified `module scs-backend` resolving all `scs-backend/backend/*` packages cleanly |
| Go HTTP Gateway & Wails Shell | `/backend/desktop_wails/` | `main.go` (Web-only & Wails modes + Postgres/SQLite boot), `web_auth_api.go`, `web_register_api.go`, `web_superadmin_api.go`, `web_rbac_api.go`, `web_modules_*.go`, `web_business_*.go`, `web_payment_*.go`, `web_api_gateway_*.go`, `failover_api.go` |
| 5-Layer Disaster Backup | `/backend/backup/` | `backup_api.go`, `backup_service.go`, `failover_controller.go`, `offsite.go`, `office_mirror*.go`, `reconciliation.go`, `guardian_telemetry.go`, tests |
| Guardian Policy Engine | `/backend/guardian/` | `engine.go`, `decision.go`, `observer.go`, `policy.go`, tests |
| GitHub Code Recovery | `/backend/code_source_recovery/` | `service.go`, `restore_rebuild.go`, `last_known_good.go`, `github_app_auth.go`, tests |
| Platform Core Stubs | `/backend/softcodesolution_platform/platform.go`, `/backend/auth_security/auth.go` | Base structs (note: `auth.go` has placeholder `VerifyArgon2Hash` & unused imports to complete in Step 2) |

### Currently Running in Node.js (Target to Port to Go)
| Area | Location | Notes |
|---|---|---|
| Domain Crypto Vault | `/backend/auth_security/crypto_vault.js` | Argon2id VIP unlock, HKDF key separation, AES-256-GCM field encryption, HMAC-SHA256 blind indexes, branch/wing-aware domain middleware |
| Observability & Alerts | `/backend/ops/observability.js` | Request latency p50/p95/p99 metrics, Prometheus output, rate-limited webhooks/Sentry alerts |
| Platform Node Routes | `/backend/softcodesolution_platform/*.routes.js`, `/backend/auth_security/auth.routes.js`, `/backend/superadmin_core/superadmin.routes.js` | WebAuthn Passkeys, Support/Auto-Bot, Email Outbox/SMTP, I18n |
| Flagship School Business ERP | `/backend/school_business/school.routes.js` (~6,300 lines) | Multi-Branch & Multi-Wing (Steps 1–5 complete), 23 normalized SQLite tables, Biometric Face/Fingerprint, Admissions, Fees, Rooznama Closings, Academics |
| Remaining 32 Business Modules | `/backend/<domain>/*.routes.js` | Currently active in Node.js; each folder has `*_schema.sql` (SQLite) and a `*.go` struct stub |

---

## 3. 5-Step Go Migration Roadmap

### ✅ Step 1 — Go Module Root, Runtime Asset Bridge, Firebase Studio & CI/CD Pipeline (COMPLETED)
- Moved `go.mod` and `go.sum` from `/backend/desktop_wails/` to repository root `/` so `module scs-backend` cleanly resolves `scs-backend/backend/...` imports across `desktop_wails`, `backup`, `guardian`, and all business packages.
- Created `/backend/desktop_wails/embedded_fallback/index.html` and updated `/backend/desktop_wails/main.go` (`resolveWebAssetsFS()`) so Go compiles reliably without a pre-copied `frontend/dist` folder inside `backend/desktop_wails/`, while serving the built Angular `frontend/dist/softcode-ui/browser` or `dist/softcode-ui/browser` from disk at runtime.
- Fixed `/.idx/dev.nix` for 1-click Firebase Studio startup: dynamic `REPO_ROOT`, automatic PostgreSQL `initdb` on first workspace creation, auto-loading of all SQLite domain schemas (`*_schema.sql`), `go run ./backend/desktop_wails`, and Angular `npx ng serve` proxy.
- Added `go-backend-verify` job to `/.github/workflows/ci-cd.yml` so GitHub Actions builds and runs Go tests on every commit.

### ⏳ Step 2 — Go CryptoVault, Auth Completion & Multi-Branch Scope Middleware (REMAINING)
- Complete `/backend/auth_security/auth.go` (implement real Argon2id hash parsing/verification via `subtle.ConstantTimeCompare`, remove unused imports so `go test ./backend/auth_security/...` compiles cleanly).
- Implement `/backend/auth_security/vault.go`: port `SoftCodeCryptoVault` (HKDF-SHA256 master/blind keys, AES-256-GCM per-tenant DEK wrapping + field `EncryptField`/`DecryptField` with AAD, HMAC-SHA256 `BlindIndex`, VIP zero-knowledge Argon2id unlock & crypto-shredding, and `encrypted_domain_records` store).
- Create shared Go middleware helper (e.g. `backend/auth_security/scope.go`) implementing `ResolveBranchWingScope(r)`, `RequireOwnerRole`, `RejectRestrictedRole`, and `403 BRANCH_SCOPE_FORBIDDEN` / `WING_SCOPE_FORBIDDEN` enforcement matching `school.routes.js`.
- Add Go unit tests (`vault_test.go`, `auth_test.go`, `scope_test.go`) and add `./backend/auth_security/...` to CI `go-backend-verify`.

### ⏳ Step 3 — Dual-DB (SQLite + PostgreSQL) Repository Layer & Schema Alignment (REMAINING)
- Build a unified Dual-DB query/dialect helper in Go (e.g. `backend/auth/database/db_engine.go`) supporting both offline SQLite (`mattn/go-sqlite3`) and Cloud PostgreSQL (`lib/pq`) with automatic placeholder rebinding (`?` -> `$1, $2...` for Postgres) and tenant RLS context setting (`SET LOCAL app.current_tenant_id`).
- Audit and generate PostgreSQL-compatible business migration scripts (or dual-dialect SQL runner) for `school_schema.sql` and the other 32 `*_schema.sql` files (`INTEGER`/`BOOLEAN`, `DATETIME` -> `TIMESTAMPTZ`, `INSERT OR REPLACE` -> `ON CONFLICT DO UPDATE`).
- Verify startup schema application + WebAuthn Passkey & Support routes in Go (`backend/desktop_wails/`).

### ⏳ Step 4 — Flagship Business Port: `school_business` in Go (REMAINING)
- Port `/backend/school_business/school.routes.js` endpoints into modular Go handlers under `/backend/school_business/`:
  - Branches & Wings registry CRUD (`/api/school/branches`, `/api/school/wings`)
  - Students, Admissions (inquiry -> approve -> roll-over), Promotions, Leaving Certificates
  - Fees, Bulk Challans, Fee Plans, Daily Closing (`Reconciliation`), Petty Vouchers, `/api/school/finance/monitoring`
  - Teachers, Executive Staff, Principals, Biometric Face & Fingerprint profiles + attendance logs + policy
  - Exams, Results, Homework/Submissions, Study Materials, Messages, Leaves, Concessions, Complaints, Lesson Plans, Substitutions, Audit Logs, Workspaces & Custom Schemas
- Wire `/api/school/*` mux in `/backend/desktop_wails/web_register_api.go` (`registerHTTPRoutes`).
- Port multi-tenant & multi-branch tests to Go (`backend/school_business/routes_test.go`) and add `./backend/school_business/...` to `.github/workflows/ci-cd.yml`.

### ⏳ Step 5 — Remaining 32 Businesses Port, Angular Cutover & Node.js Retirement (REMAINING)
- Port the remaining 32 business modules from `backend/<domain>/*.routes.js` into Go HTTP routers (using a shared Go Domain CRUD + Encrypted Domain Vault base package to keep the 32 modules clean and DRY).
- Mount all 32 `/api/<domain>` prefixes + `/metrics` + observability alerts in `/backend/desktop_wails/`.
- Update root startup/Docker/CI pipeline to run the compiled Go binary + Angular `dist/` directly, then retire `server.js` and `*.routes.js` once full API parity passes in CI and Firebase Studio.

---

## 4. 33-Business Go Migration Tracker

| # | Business Domain | Schema SQLite | Node Routes | Go Stub | Go Full Handlers |
|---|---|---|---|---|---|
| 1 | `accounting_tax` | Ready | Active | `accounting.go` | Pending (Step 5) |
| 2 | `auto_workshop` | Ready | Active | `auto.go` | Pending (Step 5) |
| 3 | `bakery_confectionery` | Ready | Active | `bakery.go` | Pending (Step 5) |
| 4 | `beauty_salon` | Ready | Active | `salon.go` | Pending (Step 5) |
| 5 | `car_rental` | Ready | Active | `carrental.go` | Pending (Step 5) |
| 6 | `catering_services` | Ready | Active | `catering.go` | Pending (Step 5) |
| 7 | `cleaning_janitorial` | Ready | Active | `cleaning.go` | Pending (Step 5) |
| 8 | `coaching_academy` | Ready | Active | `coaching.go` | Pending (Step 5) |
| 9 | `construction_contractor` | Ready | Active | `construction.go` | Pending (Step 5) |
| 10 | `dental_clinic` | Ready | Active | `dental.go` | Pending (Step 5) |
| 11 | `diagnostic_lab` | Ready | Active | `lab.go` | Pending (Step 5) |
| 12 | `digital_marketing_agency` | Ready | Active | `marketing.go` | Pending (Step 5) |
| 13 | `ecommerce_fulfillment` | Ready | Active | `ecommerce.go` | Pending (Step 5) |
| 14 | `event_management` | Ready | Active | `events.go` | Pending (Step 5) |
| 15 | `gym_fitness` | Ready | Active | `gym.go` | Pending (Step 5) |
| 16 | `hospital_clinic` | Ready | Active | `clinic.go` | Pending (Step 5) |
| 17 | `hotel_hospitality` | Ready | Active | `hotel.go` | Pending (Step 5) |
| 18 | `law_firm` | Ready | Active | `legal.go` | Pending (Step 5) |
| 19 | `logistics_courier` | Ready | Active | `logistics.go` | Pending (Step 5) |
| 20 | `manufacturing_plant` | Ready | Active | `manufacturing.go` | Pending (Step 5) |
| 21 | `ngo_charity` | Ready | Active | `ngo.go` | Pending (Step 5) |
| 22 | `pharmacy_store` | Ready | Active | `pharmacy.go` | Pending (Step 5) |
| 23 | `photography_studio` | Ready | Active | `media.go` | Pending (Step 5) |
| 24 | `real_estate` | Ready | Active | `realestate.go` | Pending (Step 5) |
| 25 | `restaurant_cafe` | Ready | Active | `restaurant.go` | Pending (Step 5) |
| 26 | `retail_pos` | Ready | Active | `retail.go` | Pending (Step 5) |
| 27 | `school_business` | Normalized (23 tables) | Active (Multi-Branch Done) | `school.go` | **Priority Next (Step 4)** |
| 28 | `solar_energy` | Ready | Active | `solar.go` | Pending (Step 5) |
| 29 | `supermarket_grocery` | Ready | Active | `supermarket.go` | Pending (Step 5) |
| 30 | `travel_agency` | Ready | Active | `travel.go` | Pending (Step 5) |
| 31 | `veterinary_clinic` | Ready | Active | `veterinary.go` | Pending (Step 5) |
| 32 | `vocational_training` | Ready | Active | `vocational.go` | Pending (Step 5) |
| 33 | `wholesale_distribution` | Ready | Active | `wholesale.go` | Pending (Step 5) |

---

## 5. How to Preview / Verify Right Now (GitHub CI & Firebase Studio)

### Option A: GitHub Actions Verification
1. Push changes to GitHub (`main` or PR).
2. Open the **Actions** tab → workflow **SoftCodeSolution Enterprise CI/CD** → check **`Go Backend Build & Unit Tests`** (`go-backend-verify`) alongside the Node.js & Angular jobs.

### Option B: Firebase Studio Live Preview (Go + PostgreSQL + SQLite + Angular)
1. Open [Firebase Studio](https://studio.firebase.google.com/) and import your GitHub repository.
2. `.idx/dev.nix` automatically:
   - Initializes PostgreSQL 16 (first run) and starts it on `127.0.0.1:5432`
   - Creates `softcodesolution` database and applies `backend/auth/database/cloud_schema.sql`
   - Applies SQLite schemas to `backend/auth/database/local_softcodesolution.db`
   - Builds Angular and launches Go backend (`go run ./backend/desktop_wails`) on `127.0.0.1:8080`
   - Starts Angular live preview proxying `/api`, `/healthz`, and `/readyz` to the Go backend

---

## 6. Continuity Prompt (Paste When Resuming on Another Account / Session)

If you export/push this repo to GitHub and continue in a new session or account, paste this exact message:

> Please read `/GO_MIGRATION_HANDOVER.md` first to understand the SoftCodeSolution Go + Angular + Dual-DB (SQLite & PostgreSQL) migration plan, architecture inventory, and current progress. **Step 1 (Go Module Root, Runtime Asset Bridge, Firebase Studio `.idx/dev.nix`, and CI/CD `go-backend-verify`) is COMPLETED.** Continue cleanly from **Step 2 (Go CryptoVault, Argon2id Auth Completion, Multi-Branch Scope Middleware & Go Tests)**, keep Node.js live preview intact until Step 5 cutover, and update `/GO_MIGRATION_HANDOVER.md` after each completed step.
