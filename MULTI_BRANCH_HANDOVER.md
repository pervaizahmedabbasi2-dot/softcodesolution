# SoftCodeSolution — School & College Multi-Branch & Multi-Wing Handover Guide

> **Purpose of this file**: Complete technical and functional handover record for the `school_business` ERP module in `softcodesolution`. If you hit usage limits, push this repository to GitHub, and re-import it under another account, paste the **Continuity Prompt** at the bottom of this file to resume seamlessly with zero lost context.

---

## 1. Architecture Summary

The School & College Management system (`school_business`) has been upgraded from a single-campus layout to a **Multi-Branch & Multi-Wing** enterprise architecture supporting:
- **Multi-Branch Isolation & Consolidation** (e.g., Lahore Main Campus `BR-LHR-01`, Islamabad F-10 Campus `BR-ISB-02`, Karachi Clifton Campus `BR-KHI-03`)
- **Multi-Wing Academic Segmentation** (`Montessori`, `Junior`, `Middle`, `Senior`, `Girls` wings mapped to branches)
- **Role-Locked Portal Scoping** vs **Owner Global Switching**:
  - **School Owner (`owner`)**: Can inspect `"ALL"` branches/wings or drill into any specific branch and wing globally from the Owner Hero Scope Switcher or by clicking rows in the Multi-Branch Executive Matrix.
  - **Principal (`principal`) & Accountant (`accountant`)**: Automatically scoped to their assigned campus branch/wing via `effectiveBranchScope`, `effectiveWingScope`, and `activePersonaBranchLabel`.
- **Clean Staff & Student Dossiers**: Staff Hub and Student Registry open full structured dossier modals (matching the clean 16-field card format) with Branch & Wing assignment badges and direct **Transfer Branch / Wing** triggers.

---

## 2. Modified & Created Files

| File Path | Role & Changes Implemented | Status |
| :--- | :--- | :--- |
| `/frontend/src/app/businesses/school_business/models/school-attendance.models.ts` | Added `SchoolBranchRecord`, `SchoolWingType`, `SchoolWingRecord`, plus optional `branchId`, `branchName`, `wingId`, `wingName` on `StaffMemberRecord` and `PrincipalMemberRecord`. | Implemented |
| `/backend/school_business/school_schema.sql` | Added `local_school_branches` and `local_school_wings` SQLite tables and `branch_id` / `wing_id` columns on `local_school_students`, `local_school_fees`, `local_school_attendance`, `local_school_staff`, `local_school_principals`. | Implemented |
| `/frontend/src/app/businesses/school_business/school-dashboard/school-dashboard.component.ts` | Added branch/wing state (`schoolBranchRecords`, `schoolWingRecords`, `selectedBranchScope`, `selectedWingScope`), seeded defaults (3 branches, 12 wings), `normalizeBranchWingAssignments()`, role-locked & owner scoping helpers, scoped getters (`scopedActiveStudents`, `scopedTeachers`, `scopedAdmissions`, `scopedFinances`, `scopedSchoolExpenses`, `scopedFeeReconciliations`, `scopedPrincipalFeeCollections`, `scopedPrincipals`, `scopedStaff`, `principalDirectoryRecords`, `accountantDirectoryRecords`, `supportStaffDirectoryRecords`, `allCampusPersonnelRecords`), `branchComparisonRows`, `wingComparisonRows`, Branch/Wing CRUD modal state & handlers, Branch/Wing Transfer modal state & handlers, CSV exports (`exportBranchMatrixCSV`, `exportWingReportCSV`), and persistence across `localStorage`, `/api/school/workspace`, and Firestore (`syncToCloud`/`loadStateFromCloud`). | Implemented |
| `/frontend/src/app/businesses/school_business/school-dashboard/school-dashboard.component.html` | Added Owner Hero Branch/Wing Switcher & `Branches & Wings` button; Principal/Accountant scope badge (`activePersonaBranchLabel`); Overview scoped KPIs & **Multi-Branch & Academic Wing Executive Matrix**; Student & Staff table branch/wing subtitles; Student & Staff Dossier Branch/Wing fields & transfer action buttons; Reports **Branch-Wise Financial & Closing Report** and **Academic Wing Breakdown** with CSV export buttons; Settings **Campus Branches & Academic Wings Registry** card; and both **Manage Campus Branches & Academic Wings Modal** and **Branch & Academic Wing Transfer Modal**. | Implemented |
| `/MULTI_BRANCH_HANDOVER.md` | This handover documentation & continuity prompt. | Implemented |

---

## 3. Data Model & Default Seed

### Seeded Branches (`getDefaultBranches()`)
1. `BR-LHR-01` — **Lahore Main Campus**
2. `BR-ISB-02` — **Islamabad F-10 Campus**
3. `BR-KHI-03` — **Karachi Clifton Campus**

### Seeded Wings (`getDefaultWings()`)
12 wings across the 3 campuses covering:
- `Montessori`
- `Junior`
- `Middle`
- `Senior`
- `Girls`

### Normalization & Deterministic Assignment
- `normalizeBranchWingAssignments()` ensures legacy or newly imported student, teacher, admission, finance, expense, reconciliation, principal closing, principal, and staff records without explicit `branchId`/`wingId` receive deterministic valid branch & wing assignments (inferring wing type from class/grade when applicable via `inferWingTypeFromGrade` / `inferWingForBranch`).
- New records created via admissions, students, teachers, executive staff, fee receipts, expenses, and daily closings automatically stamp the active branch & wing via `stampActiveBranchWing(...)`.

---

## 4. Persistence Layer

1. **Browser `localStorage`**: Persists `schoolBranchRecords`, `schoolWingRecords`, `selectedBranchScope`, and `selectedWingScope` alongside existing campus workspace data.
2. **Backend Workspace API (`/api/school/workspace` in `/backend/school_business/school.routes.js`)**: Automatically stores and restores the workspace JSON payload (including branch/wing records and scope keys) in `local_school_workspaces` and Firestore `school_workspaces` without requiring custom per-branch route migrations.
3. **Cloud Firestore Sync (`syncToCloud()` / `loadStateFromCloud()`)**: Syncs `schoolBranchRecords`, `schoolWingRecords`, `selectedBranchScope`, and `selectedWingScope`, followed by `this.normalizeBranchWingAssignments()` on hydration.
4. **SQLite Relational Schema (`/backend/school_business/school_schema.sql`)**: Schema updated with `local_school_branches`, `local_school_wings`, and `branch_id` / `wing_id` foreign-reference columns ready for direct SQL endpoints if migrated later.

---

## 5. Optional Next Enhancements (Not Blocking Current Operation)

These items are completely optional future upgrades if you want deeper backend SQL normalization or extra modal convenience later:
1. **Direct Branch & Wing `<select>` Pickers Inside Create/Edit Modals**: Currently new records auto-stamp the active branch/wing (`stampActiveBranchWing`) and any record can be reassigned cleanly via the **Branch & Academic Wing Transfer Modal**. Adding explicit Branch/Wing dropdowns directly inside the Admission, Add Student, Add Teacher, and Executive Staff Add/Edit forms is an easy enhancement.
2. **Dedicated SQL REST Endpoints for Branches & Wings**: Right now branches/wings persist cleanly in `/api/school/workspace` + `localStorage` + Firestore. If you later move away from workspace JSON blobs to normalized SQL queries, wire CRUD endpoints in `/backend/school_business/school.routes.js` against `local_school_branches` and `local_school_wings`.
3. **Per-Branch Custom Fee Structure & Wing Timetable Filters**: Extend the timetable and fee plan templates to filter/configure default tuition tiers per Branch + Wing combination.

---

## 6. Continuity Prompt (Paste When Resuming on Another Account)

If you export this repo to GitHub and re-import it into a new session, copy and send this message to the assistant:

> Please read `/MULTI_BRANCH_HANDOVER.md` first to understand the Multi-Branch & Multi-Wing architecture already implemented in `school_business`. Let's continue from the current state — check `school-dashboard.component.ts`, `school-dashboard.component.html`, and `school_schema.sql`, and then [describe your next requested feature or modification].
