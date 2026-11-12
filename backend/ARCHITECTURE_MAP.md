# SoftCodeSolution Enterprise Backend — Master Architecture Map

Modular Domain-Driven Backend (`Node.js / Express + Dual-DB SQLite Offline-First & Cloud Firestore + Go/Wails Core`).
Every domain has its own self-contained folder containing API routes (`.routes.js`), database schema (`*_schema.sql`), and Go engine module (`.go`). `/server.js` acts purely as the thin API Gateway, Schema Auto-Loader, Background Cloud Sync Worker, and Frontend Host.

---

## 1. SoftCodeSolution Company & Platform Core (3 Folders)

| Folder | Responsibilities | Key Files | API Base / Endpoints |
|---|---|---|---|
| `backend/softcodesolution_platform/` | Platform Core, Dual-DB Health, 221-Module Catalog, Business Types, Plans, Subscriptions, Billing/Invoices/Payment Gateways/Public Checkout, Notifications/WhatsApp, RBAC, Licenses, Teams, Microservices Catalog | `index.js`, `platform.routes.js`, `catalog.routes.js`, `billing.routes.js`, `notifications.routes.js`, `rbac.routes.js`, `licenses.routes.js`, `teams.routes.js`, `services.routes.js`, `platform_schema.sql`, `platform.go` | `/api/platform/*`, `/api/database/status`, `/api/superadmin/rbac/*`, `/api/superadmin/modules*`, `/api/client/modules`, `/api/business-types`, `/api/licenses*`, `/api/team/*`, `/api/services/*`, `/api/invoices`, `/api/payment*`, `/api/public/checkout*`, `/api/notifications/*` |
| `backend/auth_security/` | Tenant Registration, Argon2id/Bcrypt Login, Session `/api/auth/me`, Logout, 5-Attempt Intruder Lock Vault & Security Unlock/Lock/Password Reset | `auth.routes.js`, `auth.go` | `/api/auth/*`, `/api/login`, `/api/register`, `/api/logout`, `/api/me`, `/api/superadmin/security/*` |
| `backend/superadmin_core/` | SuperAdmin Tenant Governance, Approval, Rejection, Suspension, Force Logout, Login Lock/Unlock, Password Reset Links | `superadmin.routes.js` | `/api/superadmin/clients*`, `/api/clients*` |

---

## 2. Shared Infrastructure, Database & Recovery (6 Folders)

| Folder | Responsibilities |
|---|---|
| `backend/auth/` | Primary SQLite DB (`database/local_softcodesolution.db`) + Baseline schemas (`database/local_schema.sql`, `database/cloud_schema.sql`) |
| `backend/backup/` | 5-Layer Disaster Recovery & Triple-Backup Mirroring (Go) |
| `backend/guardian/` | Security Guardian Policy & Decision Engine (Go) |
| `backend/code_source_recovery/` | GitHub Code Recovery & Rebuild Service (Go) |
| `backend/desktop_wails/` | Desktop Wails Shell & Native Go Gateway (`go.mod`, `main.go`) |
| `backend/services/` | Archived legacy Go service reference |

---

## 3. 33 Business Industry Modules (Every Folder = `.routes.js` + `*_schema.sql` + `.go`)

| # | Business Domain Folder | Routes File | SQLite Schema File | Go Module | Mounted API Prefix(es) |
|---|---|---|---|---|---|
| 1 | `backend/accounting_tax/` | `accounting.routes.js` | `accounting_schema.sql` | `accounting.go` | `/api/accounting` |
| 2 | `backend/auto_workshop/` | `auto.routes.js` | `auto_schema.sql` | `auto.go` | `/api/auto` |
| 3 | `backend/bakery_confectionery/` | `bakery.routes.js` | `bakery_schema.sql` | `bakery.go` | `/api/bakery` |
| 4 | `backend/beauty_salon/` | `salon.routes.js` | `salon_schema.sql` | `salon.go` | `/api/salon` |
| 5 | `backend/car_rental/` | `carrental.routes.js` | `carrental_schema.sql` | `carrental.go` | `/api/car-rental` |
| 6 | `backend/catering_services/` | `catering.routes.js` | `catering_schema.sql` | `catering.go` | `/api/catering` |
| 7 | `backend/cleaning_janitorial/` | `cleaning.routes.js` | `cleaning_schema.sql` | `cleaning.go` | `/api/cleaning` |
| 8 | `backend/coaching_academy/` | `coaching.routes.js` | `coaching_schema.sql` | `coaching.go` | `/api/coaching` |
| 9 | `backend/construction_contractor/` | `construction.routes.js` | `construction_schema.sql` | `construction.go` | `/api/construction` |
| 10 | `backend/dental_clinic/` | `dental.routes.js` | `dental_schema.sql` | `dental.go` | `/api/dental` |
| 11 | `backend/diagnostic_lab/` | `lab.routes.js` | `lab_schema.sql` | `lab.go` | `/api/diagnostic-lab` |
| 12 | `backend/digital_marketing_agency/` | `marketing.routes.js` | `marketing_schema.sql` | `marketing.go` | `/api/marketing` |
| 13 | `backend/ecommerce_fulfillment/` | `ecommerce.routes.js`, `fulfillment.routes.js` | `ecommerce_schema.sql` | `ecommerce.go` | `/api/ecommerce`, `/api/fulfillment` |
| 14 | `backend/event_management/` | `events.routes.js` | `events_schema.sql` | `events.go` | `/api/events` |
| 15 | `backend/gym_fitness/` | `gym.routes.js` | `gym_schema.sql` | `gym.go` | `/api/gym` |
| 16 | `backend/hospital_clinic/` | `clinic.routes.js`, `hospital.routes.js` | `clinic_schema.sql` | `clinic.go` | `/api/clinic`, `/api/hospital` |
| 17 | `backend/hotel_hospitality/` | `hotel.routes.js` | `hotel_schema.sql` | `hotel.go` | `/api/hotel` |
| 18 | `backend/law_firm/` | `legal.routes.js` | `legal_schema.sql` | `legal.go` | `/api/law-firm`, `/api/legal` |
| 19 | `backend/logistics_courier/` | `logistics.routes.js` | `logistics_schema.sql` | `logistics.go` | `/api/logistics`, `/api/cargo` |
| 20 | `backend/manufacturing_plant/` | `manufacturing.routes.js` | `manufacturing_schema.sql` | `manufacturing.go` | `/api/manufacturing` |
| 21 | `backend/ngo_charity/` | `ngo.routes.js` | `ngo_schema.sql` | `ngo.go` | `/api/ngo` |
| 22 | `backend/pharmacy_store/` | `pharmacy.routes.js` | `pharmacy_schema.sql` | `pharmacy.go` | `/api/pharmacy` |
| 23 | `backend/photography_studio/` | `media.routes.js` | `media_schema.sql` | `media.go` | `/api/media-studio` |
| 24 | `backend/real_estate/` | `property.routes.js`, `realestate.routes.js` | `realestate_schema.sql` | `realestate.go` | `/api/properties`, `/api/realty`, `/api/real-estate` |
| 25 | `backend/restaurant_cafe/` | `restaurant.routes.js` | `restaurant_schema.sql` | `restaurant.go` | `/api/restaurant` |
| 26 | `backend/retail_pos/` | `retail.routes.js` | `retail_schema.sql` | `retail.go` | `/api/retail` |
| 27 | `backend/school_business/` | `school.routes.js` | `school_schema.sql` | `school.go` | `/api/school` |
| 28 | `backend/solar_energy/` | `solar.routes.js` | `solar_schema.sql` | `solar.go` | `/api/solar` |
| 29 | `backend/supermarket_grocery/` | `supermarket.routes.js` | `supermarket_schema.sql` | `supermarket.go` | `/api/supermarket` |
| 30 | `backend/travel_agency/` | `travel.routes.js` | `travel_schema.sql` | `travel.go` | `/api/travel` |
| 31 | `backend/veterinary_clinic/` | `veterinary.routes.js` | `veterinary_schema.sql` | `veterinary.go` | `/api/veterinary` |
| 32 | `backend/vocational_training/` | `vocational.routes.js` | `vocational_schema.sql` | `vocational.go` | `/api/vocational` |
| 33 | `backend/wholesale_distribution/` | `wholesale.routes.js` | `wholesale_schema.sql` | `wholesale.go` | `/api/wholesale` |
