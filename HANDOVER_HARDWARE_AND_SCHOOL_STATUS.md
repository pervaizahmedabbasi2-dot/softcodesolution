# SoftCode Solution — School Business Hardware & Payment Gateway Handover Document

**Last Updated:** 2026-11-26  
**Repository:** `pervaizahmedabbasi2-dot/softcodesolution`  
**Primary Focus Completed:** `school_business` (Pakistan-Native Payment Gateways + Slip Screenshot Ledger + Cross-Portal Paid Sync + Thermal Printer & USB/Bluetooth Barcode Scanner Hardware)

---

## 1. Completed Work Summary (Ready & Tested in `school_business`)

### A. Pakistan-Native Payment Gateway & Owner `Gateway Setting`
- **Owner Settings Card & Navigation:** Placed under **School Settings -> `Gateway Setting`** (`#owner-gateway-setting`) with full owner control over Pakistan channels:
  - **Raast Instant IBFT (0 Fee)**
  - **JazzCash Merchant / Mobile Wallet**
  - **Easypaisa Merchant / Telenor Wallet**
  - **1Link / 1Bill Fee Voucher (KuickPay)**
  - **Meezan Bank Challan / IBAN**
  - **HBL Konnect / Bank Deposit Slip**
  - **SadaPay / NayaPay Wallet**
  - **Custom Pakistani Bank / Wallet Channels** (Add, Edit, Enable/Disable toggle, Delete)
- **Role-Based Gateway Visibility & Policy:** Owner controls `allowOnlineGatewayForStudent`, `allowOnlineGatewayForParent`, `allowGatewayInAccountant`, `autoVerifyDigitalSlips`, `requireProofReference`, `lateFeeFinePkr`, `oneBillPrefix`, `receiptFooterNote`, and `customPolicyFields`.
- **Dynamic Live Challan Binding:** Owner gateway config dynamically populates the 3-Copy Bank Fee Challan (`primaryVoucherBankGateway`, `primaryVoucherRaastGateway`, `primaryVoucherOneBillGateway`).

### B. Payment Slip Screenshot Upload, Detailed Deposit Ledger & Cross-Portal Paid Sync
- **Slip Screenshot Upload (`proofScreenshot`):** Parent and Student online checkout modals compress and attach deposit slip photos (PNG/JPG/WEBP), stored securely in SQLite (`local_school_payment_transactions.proof_screenshot`) and Firestore.
- **Slip Lightbox Modal:** Clicking `View Slip` opens full-screen deposit slip proof with metadata, Verify/Reject controls, 3-Copy Voucher print, and Thermal Receipt print.
- **Single-Source Cross-Portal Paid Sync & 409 Duplicate-Pay Guard:**
  - When a **Parent** pays or submits a verified/settled slip (or Accountant/Owner verifies a pending slip), `local_school_fees` and `local_school_students` (`fee_status = 'Paid'`, `due_bakaya = 0`) sync immediately across **Owner, Principal, Accountant, Student, and Parent** portals.
  - Attempting to re-pay an already paid challan/student or double-submitting while a slip is `PENDING_VERIFICATION` returns HTTP `409` (`ALREADY_PAID` / `STUDENT_ALREADY_PAID` / `PENDING_SLIP_EXISTS`) and shows an in-app paid status banner.

### C. Printer & Barcode Scanner Hardware Support (`school_business`)
1. **Real Scannable ISO/IEC 15417 Code-128B Vector SVG Barcode Component:**
   - File: `/frontend/src/app/businesses/school_business/components/school-barcode/school-barcode.component.ts`
   - Replaced placeholder CSS bar strips with genuine Code-128B barcodes (100% offline SVG, readable by USB/Bluetooth laser/CCD scanners & phone cameras) on:
     - **3-Copy Official Bank Fee Challan** (`CH-2026-<rollNo>`)
     - **Official Student ID Card** (`STU-<rollNo>`)
     - **Exam Roll No. Slip / Admit Card** (`ADM-<rollNo>`)
2. **Thermal Receipt Printer (80mm / 58mm + Web Serial ESC/POS + A4 Sticker Labels):**
   - File: `/frontend/src/app/businesses/school_business/utils/thermal-print.util.ts`
   - Prints via hidden `<iframe>` (`printHtmlInHiddenFrame` — never blocked by `window.open` restrictions) OR direct USB-Serial ESC/POS bytes (`connectWebSerialThermalPrinter()` / `buildEscPosReceiptBytes()` in Chrome/Edge desktop).
   - Buttons added in:
     - **Hardware Terminal Modal (`Printer & Scanner`)** in Owner Header & Accountant Header (`Print Thermal Test`, `Print Sticker Sheet`, paper size switcher `80mm` / `58mm` / `A4`)
     - **3-Copy Bank Fee Challan Modal** (`80mm Thermal Slip` button)
     - **Owner Deposit Ledger, Student Payment History, Parent Payment History & Slip Lightbox Modal** (`Thermal` / `Thermal Receipt` button)
     - **Official Student ID Card Modal** (`Sticker Label` button)
3. **USB / Bluetooth HID Barcode Scanner Global Listener + Unified Backend Lookup:**
   - Global keydown listener (`onHardwareScannerKeydown` via `@Component.host`) captures fast USB/Bluetooth HID keyboard-wedge bursts (without interfering with regular form typing; `data-scanner-input="true"` supported on dedicated scan inputs).
   - Backend endpoint: `GET /api/school/barcode-lookup?code=...` in `/backend/school_business/school.routes.js` (tenant & branch/wing scoped, AES-GCM decrypting PII) resolving Fee Challans, Gateway Transaction Refs, Students (`rollNo` / `id` / `rfid_card`), and Library ISBNs.
   - Attendance endpoint `POST /api/school/attendance` now treats `verificationMode: 'barcode_scanner'` as a verified hardware gate scan (`Barcode Gate Scanner · IN/OUT`) even under strict biometric camera policies.
   - Mode switcher (`Auto` | `Fee Slip` | `Gate IN/OUT` | `Library`) in **Hardware Terminal Modal** automatically:
     - Marks `IN`/`OUT` Attendance when scanning Student ID cards
     - Opens unpaid challan into Accountant Counter / Checkout OR blocks duplicate pay with Verified Paid alert
     - Checks in / checks out Library books by ISBN / Circulation ID

---

## 2. Modified & Created Files Map (Current State)

### Backend
- `/backend/school_business/school.routes.js`
  - Pakistan Payment Gateways, Gateway Settings, Transactions, Screenshot validation (`validateProofScreenshot`), Cross-Portal settlement (`settleFeeForGatewayTransaction`)
  - `POST /api/school/attendance` updated for `barcode_scanner` / `rfid` hardware mode
  - `GET /api/school/barcode-lookup?code=...` added
- `/tests/integration/school_business.test.js`
  - Full automated integration test suite covering tenants, attendance, gateways, screenshots, 409 duplicate guard, barcode lookup, and barcode gate attendance

### Frontend (`school_business`)
- `/frontend/src/app/services/backend.service.ts` (`lookupSchoolBarcode` + gateway/transaction methods)
- `/frontend/src/app/businesses/school_business/components/school-barcode/school-barcode.component.ts` (**NEW** Code-128B vector SVG component)
- `/frontend/src/app/businesses/school_business/utils/thermal-print.util.ts` (**NEW** 80mm/58mm thermal HTML print, A4 barcode sticker sheet, and ESC/POS raw byte builder)
- `/frontend/src/app/businesses/school_business/school-dashboard/school-dashboard.component.ts`
- `/frontend/src/app/businesses/school_business/school-dashboard/school-dashboard.component.html`

---

## 3. Verification Commands & Status

Run from `/app/applet`:
- **Integration Tests:** `npm test` (includes `tests/integration/school_business.test.js`)
- **Frontend Build Check:** `npm run build --prefix frontend` (or AI Studio `compile_applet`)
- **Frontend Lint Check:** `npm run lint` (or AI Studio `lint_applet`)

---

## 4. What Is Pending / Next Roadmap (For Next AI Studio Account)

Everything above is complete and working for **`school_business`**. The following items are **pending** if you want to expand hardware & payment systems across the remaining modules or deepen hardware support:

### Phase 1 — School Business Hardware Enhancements (Optional Next Upgrades)
1. **Real 2D Scannable QR Code Matrix SVG:** Currently the ID Card has a decorative QR icon alongside the real scannable Code-128 1D barcode; adding a pure offline QR matrix generator allows parents to scan challans directly with mobile banking camera apps (`Raast QR` / fee portal URL).
2. **Dedicated Gate Kiosk Auto-Scan Fullscreen Page:** Add a dedicated `"Gate Kiosk Fullscreen"` banner in `SchoolAttendanceHubComponent` optimized for an unattended tablet/PC with a fixed USB barcode gun or UHF/13.56MHz RFID reader at the school gate.
3. **Auto-Print Receipt Toggle at Accountant Counter:** Add an `"Auto-print 80mm receipt immediately after collecting fee"` toggle right inside Accountant -> Receive Fee Receipts form.
4. **Principal / Teacher / Staff Barcode ID Cards:** Extend ID Card modal & sticker label printing to Teachers, Staff, and Principals (using `EMP-<empCode>`).

### Phase 2 — Other Business Modules (Not Yet Connected to Hardware Engine)
Reuse `school-barcode.component.ts` and `thermal-print.util.ts` (move into `/frontend/src/app/shared/` when ready) for:
1. **`retail_pos` & `supermarket_grocery`:** USB Barcode scanner auto-adds scanned SKU/EAN-13 item to POS cart, calculates total, opens Cash Drawer (`ESC p` command in ESC/POS), and prints 80mm customer receipt.
2. **`pharmacy_store`:** Medicine batch/expiry barcode scanning (`FEFO`) + 80mm patient dispensing receipt.
3. **`restaurant_cafe` & `bakery_confectionery`:** 80mm KOT (Kitchen Order Ticket) thermal printer + customer bill thermal slip.
4. **`logistics_courier`:** Thermal 4x6 shipping waybill label (`100mm x 150mm`) with Code-128 tracking barcode.
5. **Pakistan Payment Gateway Rollout to Other Businesses:** Port the configurable Pakistan Gateway Settings + Screenshot verification pattern (`Raast`, `JazzCash`, `Easypaisa`, `1Bill`, `Meezan/HBL`) to `coaching_academy`, `gym_fitness`, `hospital_clinic`, and `real_estate`.

### Phase 3 — Go Migration Parity
- Check `/GO_MIGRATION_HANDOVER.md` and `/backend/school_business/school.go` when syncing new SQLite/Express endpoints (`payment-gateways`, `payment-transactions`, `barcode-lookup`) to the Go desktop/Wails backend (`/backend/desktop_wails/`).

---

## 5. Copy-Paste Handover Prompt for New Google AI Studio Account / Session

Paste the block below directly into a fresh Google AI Studio chat after opening/importing this repository:

> We are continuing development on the `softcodesolution` repo (`pervaizahmedabbasi2-dot/softcodesolution`).
> Read `/HANDOVER_HARDWARE_AND_SCHOOL_STATUS.md` first to review everything already implemented and verified for `school_business` (Pakistan Payment Gateways, `Gateway Setting`, Deposit Slip Screenshots, Cross-Portal Paid Sync + 409 guard, Code-128B SVG barcodes, 80mm/58mm/ESC-POS thermal receipt printing, and USB/Bluetooth HID Barcode Scanner + `GET /api/school/barcode-lookup`).
>
> Next task I want you to implement cleanly without breaking existing `school_business` tests (`npm test`):
> [WRITE YOUR NEXT GOAL HERE — e.g.:
> - Add an auto-print 80mm thermal receipt toggle on Accountant fee collection + Gate Kiosk fullscreen barcode attendance view in `school_business`, OR
> - Port the shared Code-128 Barcode Scanner + 80mm Thermal Receipt + Cash Drawer kick engine to `retail_pos` and `pharmacy_store`, OR
> - Add real scannable 2D QR codes to `school_business` Fee Challans and Student ID Cards.]
