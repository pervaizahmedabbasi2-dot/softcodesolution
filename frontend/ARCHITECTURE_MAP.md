# SoftCodeSolution Enterprise Frontend — Master Architecture Map

Modular Domain-Driven Angular Frontend (`frontend/src/app/`) matching the Backend Architecture (`backend/`):

---

## 1. SoftCodeSolution Company & Platform Frontend (`frontend/src/app/softcodesolution_platform/`)

| Module Folder | Responsibilities |
|---|---|
| `landing-page/` | Public Company Brand Website (Hero, Solutions, Pricing, Store, Technology, Triple Backup, Hybrid Sync, Mirroring, FAQ, Contact, Legal, Footer) |
| `overview/` | SuperAdmin & Enterprise Overview Metrics |
| `analytics/` | Revenue, Tenant Growth & Usage Analytics |
| `saas-control/` | Tenant Module Access & SaaS Control Plane |
| `plans-pricing/` | Subscription Plans & Pricing Matrix UI |
| `module-catalog/` | 221-Module Enterprise Catalog |
| `module-manager/` | Per-Tenant Dynamic Module Activation UI |
| `rbac/` | Roles, Permissions & Audit Matrix UI |
| `license/` | Enterprise License Key Generator & Management |
| `teams/` | SoftCodeSolution Internal Team & Staff Console |
| `services-catalog/` | Microservices Status & Rate-Limit Console |
| `payments/` | Invoices, Payment Gateways, Approvals & Wallet |
| `api-gateway/` | API Gateway Routes, Rate Limits & Traffic Console |
| `system-health/` | Infrastructure, Database & Server Health |
| `global-edge/` | Global CDN & Regional Node Edge Status |
| `feature-flags/` | Feature Rollout & Toggle Matrix |
| `updater/` | Platform OTA Update Dispatcher |
| `webhooks/` | Event Webhooks & Notification Logs |
| `knowledge-base/` | Enterprise Support Docs & Runbooks |
| `compliance/` | Regulatory & Audit Compliance Center |
| `data-protection/` | Recovery Status & Data Shield Vault |
| `backup-manager/` | 5-Layer Snapshot & Restore UI |

---

## 2. Auth & Security Core (`frontend/src/app/auth_security/`)

| Folder | Responsibilities |
|---|---|
| `login/` | Tenant & SuperAdmin Login Page |
| `register/` | New Business Registration Wizard |
| `security/` | Intruder Lock Vault, Camera Snapshots & Account Unlock Console |
| `guards/` | `auth.guard.ts` & `superadmin.guard.ts` |

---

## 3. SuperAdmin Core Governance (`frontend/src/app/superadmin_core/`)

| Folder | Responsibilities |
|---|---|
| `admins/` | SuperAdmin Root Administrators Manager |
| `all-clients/` | Registered Business Clients Directory, Approvals & Status Controls |

---

## 4. Business Industry Frontends (`frontend/src/app/businesses/`)

| Domain Folder | Frontend Hub Component | Backend Counterpart |
|---|---|---|
| `auto_workshop/auto-hub/` | Auto Workshop & Fleet Rental Hub | `backend/auto_workshop/` |
| `beauty_salon/salon-hub/` | Beauty Salon & Spa Lounge Hub | `backend/beauty_salon/` |
| `gym_fitness/gym-hub/` | Gym, Fitness & Sports Club Hub | `backend/gym_fitness/` |
| `hospital_clinic/clinic-hub/` | Hospital, Clinic & OPD Hub | `backend/hospital_clinic/` |
| `hotel_hospitality/hotel-hub/` | Hotel & Hospitality PMS Hub | `backend/hotel_hospitality/` |
| `institutional_campus/institutional-hub/` | Institutional & Multi-Campus Hub | `backend/school_business/` |
| `law_firm/legal-hub/` | Law Firm & Case Management Hub | `backend/law_firm/` |
| `ngo_charity/ngo-hub/` | NGO, Charity & Donor Relief Hub | `backend/ngo_charity/` |
| `pharmacy_store/pharmacy-hub/` | Pharmacy & Drugstore Counter Hub | `backend/pharmacy_store/` |
| `real_estate/property-hub/` | Real Estate, Leases & Installments Hub | `backend/real_estate/` |
| `restaurant_cafe/restaurant-hub/` | Restaurant, Cafe & KDS Hub | `backend/restaurant_cafe/` |
| `retail_pos/retail-pos/` | Retail POS & Inventory Hub | `backend/retail_pos/` |
| `school_business/school-dashboard/` | School Management & Challan Hub | `backend/school_business/` |
| `travel_agency/travel-hub/` | Travel, Visa & Umrah Packages Hub | `backend/travel_agency/` |
| `business-suites/` | Universal 33-Business Enterprise Suites Hub (Accounting, Bakery, Car Rental, Catering, Cleaning, Coaching, Construction, Dental, Diagnostic Lab, Digital Marketing, E-Commerce, Events, Logistics, Manufacturing, Photography, Solar, Supermarket, Veterinary, Vocational, Wholesale + all dedicated hubs) | All 33 `backend/*/` folders |

---

## 5. Shared App Core (`frontend/src/app/`)

- `dashboard/` (`dashboard.component.ts`, `dashboard.component.html`, `services/` — Main Workspace Shell & API Services)
- `services/` (`backend.service.ts`, `current-user.service.ts`, `firebase-db.service.ts`, `localization.service.ts`, `notification.service.ts`)
- `components/currency-language-selector/`
- `app.routes.ts`, `app.config.ts`, `app.component.*`, `pwa-install.component.ts`
