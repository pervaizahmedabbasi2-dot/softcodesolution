# SoftCodeSolution — School & College Multi-Branch & Multi-Wing Handover Guide

> **Purpose of this file**: Complete technical and functional handover record for the `school_business` ERP module in `softcodesolution`. If you hit usage limits, push this repository to GitHub, and re-import it under another account, paste the **Continuity Prompt** at the bottom of this file to resume seamlessly with zero lost context.

---

## 1. Architecture Summary

The School & College Management system (`school_business`) runs a **Multi-Branch & Multi-Wing** enterprise architecture supporting:
- **Multi-Branch Isolation & Consolidation** (e.g., Lahore Main Campus `BR-LHR-01`, Islamabad F-10 Campus `BR-ISB-02`, Karachi Clifton Campus `BR-KHI-03`)
- **Multi-Wing Academic Segmentation** (`Montessori`, `Junior`, `Middle`, `Senior`, `Girls` wings mapped to branches)
- **End-to-End "Who am I?" Identity & Role-Locked Portal Scoping** vs **Owner Global Switching**:
  - **School Owner (`owner`)**: Can inspect `"ALL"` branches/wings or drill into any specific branch and wing globally from the Owner Hero Scope Switcher or Multi-Branch Executive Matrix, and can simulate any Principal, Accountant, Teacher, Student, or Parent persona while preserving `isOwnerSession === true` to return cleanly to Owner ERP.
  - **Principal (`principal`) & Accountant (`accountant`)**: Automatically hydrated from login/passkey/portal switcher to their exact `activePrincipalProfile` / `activeAccountantProfile` and locked to their assigned `branchId` (and optionally `wingId` when `wingScopeLocked` is enabled). Non-owner sessions are blocked from escaping into Owner ERP or other roles.
  - **Teacher (`teacher`), Student (`student`), & Parent (`parent`)**: Matched directly on login/portal launch against their exact branch & wing (`BR-LHR-01` / `BR-ISB-02` / `BR-KHI-03`) and hydrated across `localStorage`, `/api/school/workspace`, and Firestore (`hydrateActivePortalIdentity()`).
- **Clean Staff & Student Dossiers**: Staff Hub and Student Registry open full structured dossier modals with Branch & Wing assignment badges and direct **Transfer Branch / Wing** triggers.

---

## 2. Modified & Created Files

| File Path | Role & Changes Implemented | Status |
| :--- | :--- | :--- |
| `/frontend/src/app/businesses/school_business/models/school-attendance.models.ts` | Added `SchoolBranchRecord`, `SchoolWingType`, `SchoolWingRecord`, `branchId`/`branchName`/`wingId`/`wingName` plus `wingScopeLocked` and `portalUserId` on `StaffMemberRecord`, `PrincipalMemberRecord`, `FaceProfileRecord`, `FingerprintProfileRecord`, and `FaceVerificationLogRecord`. | Implemented (Base + Step 1 + Step 3) |
| `/frontend/src/app/businesses/school_business/components/school-attendance-hub/school-attendance-hub.component.ts` | Added `activeBranchScope`, `activeWingScope`, and `activeBranchLabel` signal inputs; filtered biometric face/fingerprint enrollments and enforced cross-branch kiosk terminal guards; stamped branch/wing metadata on enrollment records. | Implemented (Step 3) |
| `/frontend/src/app/businesses/school_business/components/school-attendance-hub/school-attendance-hub.component.html` | Added live `Terminal Locked: <Branch>` / `Group HQ Kiosk · All Branches` indicator badge in the biometric station header. | Implemented (Step 3) |
| `/frontend/src/app/auth_security/login/login.component.ts` | Added `'principal'` portal role, seeded multi-branch portal accounts (`BR-LHR-01` & `BR-ISB-02`), synced matching against Owner-created `scs_school_portal_users_v1`, preserved `branchId`/`branchName`/`wingId`/`wingName`/`wingScopeLocked`/`tenantId` on login & Passkey login, and wrote `activeSchoolTargetPrincipal`, `activeSchoolTargetAccountant`, `activeSchoolTargetTeacher`, `activeSchoolTargetStudent`, `activeSchoolTargetParent`. | Implemented (Step 1) |
| `/backend/school_business/school_schema.sql` | Added `local_school_branches` and `local_school_wings` SQLite tables and `branch_id` / `wing_id` columns on `local_school_students`, `local_school_fees`, `local_school_attendance`, `local_school_staff`, `local_school_principals`. | Implemented (Base; Step 5 adds remaining tables/API) |
| `/frontend/src/app/businesses/school_business/school-dashboard/school-dashboard.component.ts` | Added branch/wing state, normalization, scoped getters, matrix/reports, Branch/Wing CRUD & Transfer modals, **Step 1 Identity Binding**, **Step 2 Modal Pickers & Persistence**, **Step 3 Secondary Modules & Biometric Kiosk Scoping**, and **Step 4 Role-Wise Daily Operations** (`FeePlanTemplateRecord` per-Branch/Wing fee plan CRUD & auto-resolution, 3-tier Accountant → Principal → Owner Multi-Branch Rooznama closing approval chain + `branchDailyClosingAuditSummary`, and strict branch/wing scoping for substitutions, walkthrough inspections, syllabus tracker, teacher leaves, faculty tasks, fee concessions, challans, defaulters, and petty vouchers). | Implemented (Base + Steps 1–4) |
| `/frontend/src/app/businesses/school_business/school-dashboard/school-dashboard.component.html` | Added Owner Hero Switcher, Executive Matrix, Transfer Modal, **Step 1 UI Bindings**, **Step 2 Direct Modal Pickers**, **Step 3 Scoped Secondary UI & Branch-Locked Biometric Kiosk Props**, and **Step 4 Operational UI** (Multi-Branch Rooznama Variance & Consolidation Matrix, Principal Fee & Rooznama Oversight review queue + sidebar badge, Branch/Wing Fee Plan Template editor modal + Accountant shortcut, scoped Substitute Duty / Walkthrough Inspection / Teacher Leave / Faculty Task / Concession views, and scoped Print Substitute Roster). | Implemented (Base + Steps 1–4) |
| `/MULTI_BRANCH_HANDOVER.md` | Handover documentation, 5-step implementation tracker, and continuity prompt. | Updated (Step 4) |

---

## 3. Data Model & Default Seed

### Seeded Branches (`getDefaultBranches()`)
1. `BR-LHR-01` — **Lahore Main Campus** (`Lahore`)
2. `BR-ISB-02` — **Islamabad F-10 Campus** (`Islamabad`)
3. `BR-KHI-03` — **Karachi Clifton Campus** (`Karachi`)

### Seeded Wings (`getDefaultWings()`)
12 wings across the 3 campuses covering:
- `Montessori`, `Junior`, `Middle`, `Senior`, `Girls`

### Multi-Branch Portal Demo / Seeded Accounts (Step 1)
- **Lahore Main (`BR-LHR-01`)**:
  - Principal: `principal@campus.edu` (`9900` / `Principal#2026!`)
  - Accountant: `accountant@campus.edu` (`5511` / `Accountant#2026!`)
  - Teacher: `teacher@campus.edu` (`1122` / `Teacher#2026!`)
  - Student: `student@campus.edu` (`3344` / `Student#2026!`)
  - Parent: `parent@campus.edu` (`7788` / `Parent#2026!`)
- **Islamabad F-10 (`BR-ISB-02`)**:
  - Principal: `principal.isb@campus.edu` (`9902` / `Principal#2026!`)
  - Accountant: `accountant.isb@campus.edu` (`5522` / `Accountant#2026!`)
  - Teacher: `teacher.isb@campus.edu` (`1133` / `Teacher#2026!`)
- Owner-created accounts in **Portal User Accounts & Credentials** (`scs_school_portal_users_v1`) also sync automatically to the login screen with their assigned `branchId`, `wingId`, and `wingScopeLocked`.

### Normalization & Deterministic Assignment
- `normalizeBranchWingAssignments()` ensures legacy or newly imported student, teacher, admission, finance, expense, reconciliation, principal closing, principal, and staff records without explicit `branchId`/`wingId` receive deterministic valid branch & wing assignments (`inferWingTypeFromGrade` / `inferWingForBranch`).
- New records created via admissions, students, teachers, executive staff, fee receipts, expenses, and daily closings automatically stamp the active branch & wing via `stampActiveBranchWing(...)`.

---

## 4. Persistence Layer

1. **Browser `localStorage`**: Persists workspace data (`schoolBranchRecords`, `schoolWingRecords`, `selectedBranchScope`, `selectedWingScope`, `portalUsers`), active role targets (`activeSchoolTargetPrincipal`, `activeSchoolTargetAccountant`, `activeSchoolTargetTeacher`, `activeSchoolTargetStudent`, `activeSchoolTargetParent`), and unscoped `scs_school_portal_users_v1` mirror for pre-login lookup.
2. **Backend Workspace API (`/api/school/workspace` in `/backend/school_business/school.routes.js`)**: Stores and restores the workspace JSON payload (including branch/wing records and portal users) in `local_school_workspaces` and Firestore `school_workspaces`.
3. **Cloud Firestore Sync (`syncToCloud()` / `loadStateFromCloud()`)**: Syncs branch/wing records and triggers `normalizeBranchWingAssignments()` + `hydrateActivePortalIdentity()` on hydration.
4. **SQLite Relational Schema (`/backend/school_business/school_schema.sql`)**: Schema updated with `local_school_branches`, `local_school_wings`, and `branch_id` / `wing_id` columns on core tables (remaining tables & SQL endpoints scheduled in Step 5).

---

## 5. 5-Step Multi-Branch & Multi-Role Implementation Roadmap

### ✅ Step 1 — Identity & Login Chain + Multi-Branch/Wing Role Binding (COMPLETED)
- End-to-end "Who am I?" identity binding across `login.component.ts`, Passkey login, `school-dashboard.component.ts`, and `school-dashboard.component.html` for all 6 roles (`owner`, `principal`, `accountant`, `teacher`, `student`, `parent`).
- `wingScopeLocked` option on Portal Users, Principals, and Staff so wing-specific Principals/Fee Clerks stay locked to their assigned wing while campus-wide Principals/Accountants can view all wings in their branch.
- Strict separation of real non-owner login sessions (`isOwnerSession === false`) from Owner portal simulation (`isOwnerSession === true`).

### ✅ Step 2 — Direct Branch & Wing `<select>` Pickers in Create/Edit Modals (COMPLETED)
- Added explicit **Campus Branch** and **Academic Wing** `<select>` dropdowns (cascading via `getWingsForBranch(...)` + auto-suggesting wing from selected class/grade + branch-locked for non-owner roles) directly inside:
  - New Admission / Inquiry modal (`isAdmissionModalOpen`)
  - Edit Student modal (`isStudentModalOpen`)
  - Add / Edit Teacher modal (`isTeacherModalOpen`)
  - Add / Edit Executive Staff (Principal / Accountant / Support Staff) modal (`isExecutiveStaffModalOpen`, including `wingScopeLocked` checkbox)
- Updated `saveAdmission()`, `saveStudent()`, `saveTeacher()`, and `saveExecutiveStaffModal()` to persist explicit `branchId`, `branchName`, `wingId`, `wingName` (and `wingScopeLocked` + linked `portalUserId` sync on `portalUsers`).

### ✅ Step 3 — Branch & Wing Scoping for Secondary Modules & Biometric Kiosk (COMPLETED)
- Added `branchId`, `branchName`, `wingId`, and `wingName` metadata, deterministic/member-linked normalization, scoped getters, and save-handler stamping for:
  - Exams, Date Sheets, Gradebook, Exam Moderation, Subjects & Admit Cards (plus Campus & Wing badge inside Admit Card modal)
  - Homework, Study Materials, Lesson Plans & Class Timetable
  - Biometric Face / Fingerprint Attendance Kiosk (`activeBranchScope`, `activeWingScope`, `activeBranchLabel` inputs on `<app-school-attendance-hub>` + terminal lock badge + cross-branch verification rejection)
  - Library Physical Catalog, Circulations, Digital E-Resources & Transport Routes per campus branch/wing

### ✅ Step 4 — Role-Wise Daily Operations & Multi-Branch Fee/Closing Workflows (COMPLETED)
- Custom per-Branch & per-Wing Fee Plan templates (`FeePlanTemplateRecord` catalog across `BR-LHR-01`, `BR-ISB-02`, and `BR-KHI-03`, persisted in `scs_school_fee_plans_v1` + workspace/cloud sync, editable in Fee Structure modal, and auto-resolved in Admissions & Accountant Challan generation).
- Multi-branch Daily Closing (`Rooznama`) 3-tier workflow: Accountant submits branch-scoped closing → Branch Principal reviews/endorses or flags inside Principal `Fee & Rooznama Oversight` → School Owner audits branch-wise & consolidated Cash / Meezan / HBL / Digital / Petty / Variance matrix (`branchDailyClosingAuditSummary`) and approves/locks per campus.
- Principal substitute teacher duty assignment (`scopedSubstituteArrangements` + campus teacher datalist + scoped Print Cover Duty Sheet), daily inspection walkthrough rounds (`scopedDailyInspectionLogs` + branch wing selector), syllabus tracker, teacher leave approvals, faculty tasks, fee concessions, Accountant challans, defaulters, and petty cash vouchers strictly scoped to the active `branchId` (and `wingId` if locked).

### ⏳ Step 5 — Backend SQLite Normalization & Branch-Filtered REST APIs (REMAINING)
- Add `branch_id` & `wing_id` columns to `local_school_teachers` and `local_school_admissions` (plus other secondary tables as needed) in `/backend/school_business/school_schema.sql`.
- Add dedicated `/api/school/branches` and `/api/school/wings` CRUD endpoints and server-side `?branch_id=` / `?wing_id=` query filtering + role enforcement in `/backend/school_business/school.routes.js`.
- Add/update integration tests in `tests/integration/school_business.test.js` covering multi-branch & multi-role backend isolation.

---

## 6. Continuity Prompt (Paste When Resuming on Another Account)

If you export this repo to GitHub and re-import it into a new session, copy and send this message to the assistant:

> Please read `/MULTI_BRANCH_HANDOVER.md` first to understand the Multi-Branch & Multi-Wing architecture and the 5-step roadmap in `school_business`. **Steps 1, 2, 3 & 4 are completed and documented**. Let's continue from **Step 5** (Backend SQLite Normalization & Branch-Filtered REST APIs in `school_schema.sql`, `school.routes.js`, and integration tests in `tests/integration/school_business.test.js`), and keep updating `/MULTI_BRANCH_HANDOVER.md` when finished.
