# SoftCode Solution — Hardware & Pakistan Payment Gateway Handover Document

**Last Updated:** 2026-11-26  
**Repository:** `pervaizahmedabbasi2-dot/softcodesolution`  
**Completed Phases:** **Phase 1 (`school_business` Hardware & 2D QR)** + **Phase 2 (Shared Hardware Engine, Vertical Printers/Scanners & PK Gateways)**

---

## 1. Phase 1 Completed & Verified (`school_business`)

### A. Pakistan-Native Payment Gateway & Owner `Gateway Setting`
- **Owner Settings Card & Navigation:** Placed under **School Settings -> `Gateway Setting`** (`#owner-gateway-setting`) supporting **Raast Instant IBFT**, **JazzCash**, **Easypaisa**, **1Link / 1Bill Fee Voucher**, **Meezan Bank**, **HBL Konnect**, **SadaPay / NayaPay**, and custom Pakistani bank/wallet channels.
- **Role-Based Gateway Visibility & Policy:** `allowOnlineGatewayForStudent`, `allowOnlineGatewayForParent`, `allowGatewayInAccountant`, `autoVerifyDigitalSlips`, `requireProofReference`, `lateFeeFinePkr`, `oneBillPrefix`, `receiptFooterNote`, and `customPolicyFields`.
- **Dynamic Live Challan Binding:** Populates the 3-Copy Bank Fee Challan (`primaryVoucherBankGateway`, `primaryVoucherRaastGateway`, `primaryVoucherOneBillGateway`).

### B. Payment Slip Screenshot Upload, Deposit Ledger & Cross-Portal Paid Sync
- Compressed PNG/JPG/WEBP deposit slip proof uploaded from Student/Parent modals, stored in SQLite (`local_school_payment_transactions.proof_screenshot`) and Firestore.
- `View Slip` Lightbox with Verify/Reject controls, 3-Copy Voucher print, and Thermal Receipt print.
- Instant sync across Owner, Principal, Accountant, Student, and Parent portals plus `409` duplicate-pay guard (`ALREADY_PAID` / `STUDENT_ALREADY_PAID` / `PENDING_SLIP_EXISTS`).

### C. Printer, 2D QR Matrix & Barcode Scanner Hardware Support (`school_business`)
- **ISO/IEC 15417 Code-128B Barcode + ISO/IEC 18004 2D QR Code Matrix SVG:** Both rendered offline cleanly via vector SVG on 3-Copy Bank Fee Challans (`CH-2026-<rollNo>`), Student/Staff/Teacher/Principal ID Cards, and Exam Roll No. Slips.
- **Thermal Receipt Printer (80mm / 58mm + Web Serial ESC/POS + A4 Sticker Sheet):** Works via hidden iframe print + USB Web Serial ESC/POS bytes, plus an **Auto-Print Receipt Toggle** directly inside the Accountant Fee Counter.
- **USB / Bluetooth HID Barcode Scanner + Dedicated Fullscreen Gate Kiosk:** `onHardwareScannerKeydown` + `GET /api/school/barcode-lookup?code=...` + `SchoolAttendanceHubComponent` fullscreen Gate Kiosk mode.

---

## 2. Phase 2 Completed Work Summary (Shared Engine + Vertical Hardware & PK Gateways)

### A. Shared Hardware & Print Architecture (`/frontend/src/app/shared/hardware/`)
Refactored `school_business` utilities into canonical shared modules (with `school_business` re-exports preserved so 100% of existing selectors and imports keep working):
- `/frontend/src/app/shared/hardware/qr-code.util.ts` — Pure TypeScript offline ISO/IEC 18004 QR Code matrix & SVG generator (`encodeQrMatrix`, `buildQrPathData`, `buildQrCodeSvgMarkup`).
- `/frontend/src/app/shared/hardware/barcode.component.ts` — `SharedBarcodeComponent` (`<app-shared-barcode>`) & `SharedQrCodeComponent` (`<app-shared-qr-code>`).
- `/frontend/src/app/shared/hardware/thermal-print.util.ts` — Shared `80mm` / `58mm` thermal POS receipts, `80mm` Kitchen Order Tickets (KOT), `4x6` (`100mm x 150mm`) thermal shipping waybills, A4 sticker sheets, and ESC/POS raw byte builders including `ESC p` Cash Drawer kick (`buildCashDrawerKickBytes()`).
- `/frontend/src/app/shared/hardware/hardware-device.service.ts` — Singleton `@Injectable({ providedIn: 'root' })` managing `paperWidth`, `autoPrintEnabled`, USB Web Serial connection, `kickCashDrawer()`, `printPosReceipt()`, `printKotTicket()`, `printWaybill4x6()`, and WebAudio `playBeep()`.
- `/frontend/src/app/shared/hardware/pk-payment-gateway-hub.component.ts` — Reusable standalone `<app-pk-payment-gateway-hub>` component (`Raast`, `JazzCash`, `Easypaisa`, `1Bill`, `Meezan/HBL`) with Gateway Settings, PNG/JPG/WEBP Deposit Slip upload modal, Lightbox preview, Verify/Reject workflow, and 80mm thermal slip printing.

### B. Vertical Hardware & Gateway Rollout
1. **`retail_pos` (`/frontend/src/app/businesses/retail_pos/retail-pos/` + `/backend/retail_pos/retail.routes.js`):**
   - `GET /api/retail/barcode-lookup?code=...` SKU/barcode resolver.
   - Buffered USB/Bluetooth HID keyboard-wedge scanner + `[data-scanner-input="true"]` input auto-adds items to cart with audio beep, updates stock guard, triggers `ESC p` Cash Drawer kick on Cash checkout, auto-prints `80mm`/`58mm` receipt with Code-128 & 2D QR, and supports USB Web Serial ESC/POS connection.
2. **`supermarket_grocery` (`super_mart` in `business-suites.component.ts/.html`):**
   - Supermarket EAN-13 + Digital Scale PLU weight-tag scanner (`2xxxxx`), live lane total counter, `80mm` receipt printing, and `ESC p` Cash Drawer button.
3. **`pharmacy_store` (`/frontend/src/app/businesses/pharmacy_store/pharmacy-hub/` + `/backend/pharmacy_store/pharmacy.routes.js`):**
   - `GET /api/pharmacy/barcode-lookup?code=...` implementing **FEFO (First-Expired-First-Out)**: sorts matching batches ascending by `expiryDate`, auto-selects nearest non-expired batch (`recommendedBatch`), and blocks expired batches.
   - Pharmacy UI bar + Dispense modal FEFO batch alert + `80mm`/`58mm` thermal Prescription Receipt with Code-128 & QR.
4. **`restaurant_cafe` & `bakery_confectionery` (`restaurant-hub` + `bakery_confectionery` in `business-suites`):**
   - Dedicated `80mm` Kitchen Order Ticket (KOT) thermal printing on every KDS ticket card and Table Controls modal (`restaurant-hub`), plus Customer Bill thermal slip.
   - Added `bakery_confectionery` vertical in `business-suites.component.ts/.html` with Bakery & Patisserie `80mm` KOT + Customer Bill toolbar.
5. **`logistics_courier` (`logistics_transport` & `cargo_freight` in `business-suites` + `/backend/logistics_courier/logistics.routes.js`):**
   - `GET /api/logistics/waybill/:trackingNo` endpoint.
   - Dedicated `Print 4x6 Waybill (100×150mm)` thermal shipping label action on table rows, mobile cards, and Print Dossier modal with scannable Code-128 tracking barcode + 2D QR.
6. **Pakistan Payment Gateway Rollout (`Raast`, `JazzCash`, `Easypaisa`, `1Bill`, `Meezan/HBL`):**
   - Parameterized SQLite backend: `/backend/softcodesolution_platform/business_gateways.routes.js` + `/backend/softcodesolution_platform/platform_schema.sql` (`local_business_payment_gateways`, `local_business_gateway_settings`, `local_business_payment_transactions`), mounted at `/api/pk-gateways/:businessKey/*` in `/backend/softcodesolution_platform/index.js`.
   - AES-GCM encryption of `merchantSecret` (`crypto_vault.js`), secret masking (`hasMerchantSecret`/`merchantSecretHint`), MIME/size slip validation, and `409` duplicate invoice guard (`INVOICE_ALREADY_PAID` / `PENDING_SLIP_EXISTS`).
   - Integrated live into **`coaching_academy`** (`coaching_center` in `business-suites`), **`gym_fitness`** (`gym-hub` + 80mm fee voucher print), **`hospital_clinic`** (`clinic-hub` + 80mm Rx print), and **`real_estate`** (`property-hub`).

---

## 3. Verification Commands & Status

Run from `/app/applet`:
- **Integration & Unit Tests:** `npm test` (runs both `tests/integration/school_business.test.js` and `tests/integration/phase2_hardware_gateways.test.js`)
- **Frontend Build Check:** `npm run build` (or AI Studio `compile_applet`)
- **JS Lint Check:** `npm run lint` (or AI Studio `lint_applet`)

---

## 4. Remaining Roadmap

### Phase 3 — Go Migration Parity (Pending)
- Mirror new SQLite/Express endpoints into the Go desktop/Wails backend (`/backend/desktop_wails/` & domain `.go` files) per `/GO_MIGRATION_HANDOVER.md`:
  - `school_business`: `payment-gateways`, `payment-transactions`, `barcode-lookup`
  - Shared PK Gateways: `/api/pk-gateways/:businessKey/*` (`coaching_academy`, `gym_fitness`, `hospital_clinic`, `real_estate`)
  - Hardware lookups: `/api/retail/barcode-lookup`, `/api/pharmacy/barcode-lookup` (FEFO), `/api/logistics/waybill/:trackingNo`
