import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// SoftCodeSolution Company & Platform Core Modules
import { mountSoftCodePlatform } from './backend/softcodesolution_platform/index.js';
import { createAuthRouter } from './backend/auth_security/auth.routes.js';
import { createSuperAdminRouter } from './backend/superadmin_core/superadmin.routes.js';
import { getCryptoVault } from './backend/auth_security/crypto_vault.js';
import { ObservabilityEngine, authorizeMetricsRequest } from './backend/ops/observability.js';

// 33 Business Domain Modules
import { createAccountingRouter } from './backend/accounting_tax/accounting.routes.js';
import { createAutoRouter } from './backend/auto_workshop/auto.routes.js';
import { createBakeryRouter } from './backend/bakery_confectionery/bakery.routes.js';
import { createSalonRouter } from './backend/beauty_salon/salon.routes.js';
import { createCarRentalRouter } from './backend/car_rental/carrental.routes.js';
import { createCateringRouter } from './backend/catering_services/catering.routes.js';
import { createCleaningRouter } from './backend/cleaning_janitorial/cleaning.routes.js';
import { createCoachingRouter } from './backend/coaching_academy/coaching.routes.js';
import { createConstructionRouter } from './backend/construction_contractor/construction.routes.js';
import { createDentalRouter } from './backend/dental_clinic/dental.routes.js';
import { createLabRouter } from './backend/diagnostic_lab/lab.routes.js';
import { createMarketingRouter } from './backend/digital_marketing_agency/marketing.routes.js';
import { createEcommerceRouter } from './backend/ecommerce_fulfillment/ecommerce.routes.js';
import { createFulfillmentRouter } from './backend/ecommerce_fulfillment/fulfillment.routes.js';
import { createEventsRouter } from './backend/event_management/events.routes.js';
import { createGymRouter } from './backend/gym_fitness/gym.routes.js';
import { createClinicRouter } from './backend/hospital_clinic/clinic.routes.js';
import { createHospitalRouter } from './backend/hospital_clinic/hospital.routes.js';
import { createHotelRouter } from './backend/hotel_hospitality/hotel.routes.js';
import { createLegalRouter } from './backend/law_firm/legal.routes.js';
import { createLogisticsRouter } from './backend/logistics_courier/logistics.routes.js';
import { createManufacturingRouter } from './backend/manufacturing_plant/manufacturing.routes.js';
import { createNgoRouter } from './backend/ngo_charity/ngo.routes.js';
import { createPharmacyRouter } from './backend/pharmacy_store/pharmacy.routes.js';
import { createMediaRouter } from './backend/photography_studio/media.routes.js';
import { createPropertyRouter } from './backend/real_estate/property.routes.js';
import { createRealEstateRouter } from './backend/real_estate/realestate.routes.js';
import { createRestaurantRouter } from './backend/restaurant_cafe/restaurant.routes.js';
import { createRetailRouter } from './backend/retail_pos/retail.routes.js';
import { createSchoolRouter } from './backend/school_business/school.routes.js';
import { createSolarRouter } from './backend/solar_energy/solar.routes.js';
import { createSupermarketRouter } from './backend/supermarket_grocery/supermarket.routes.js';
import { createTravelRouter } from './backend/travel_agency/travel.routes.js';
import { createVeterinaryRouter } from './backend/veterinary_clinic/veterinary.routes.js';
import { createVocationalRouter } from './backend/vocational_training/vocational.routes.js';
import { createWholesaleRouter } from './backend/wholesale_distribution/wholesale.routes.js';

dotenv.config();

export function createApp(options = {}) {
  const observability = options.observability || new ObservabilityEngine();
  const quiet = Boolean(options.quiet);

// ===========================================================================
// 1. DUAL-DATABASE ENGINE (SQLite3 Offline-First + Domain Schema Auto-Loader)
// ===========================================================================
let sqliteDb = null;
const SQLITE_DB_PATH = options.sqliteDbPath || process.env.SOFTCODE_SQLITE_DB || path.resolve('./backend/auth/database/local_softcodesolution.db');

try {
  const dbDir = path.dirname(SQLITE_DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new DatabaseSync(SQLITE_DB_PATH);
  try {
    sqliteDb.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA temp_store = MEMORY;
      PRAGMA foreign_keys = ON;
    `);
  } catch (pragmaErr) {
    if (!quiet) console.warn('[SoftCode Dual-DB Engine] PRAGMA notice:', pragmaErr.message);
  }

  // Execute SoftCodeSolution platform core schema first, then all 33 business domain schemas
  const platformSchemaPath = path.resolve('./backend/softcodesolution_platform/platform_schema.sql');
  if (fs.existsSync(platformSchemaPath)) {
    sqliteDb.exec(fs.readFileSync(platformSchemaPath, 'utf8'));
    if (!quiet) console.log('[Domain Schema Loader] Executed core schema: softcodesolution_platform/platform_schema.sql');
  }

  const backendBase = path.resolve('./backend');
  if (fs.existsSync(backendBase)) {
    const subdirs = fs
      .readdirSync(backendBase, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'softcodesolution_platform')
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const dir of subdirs) {
      const dirPath = path.join(backendBase, dir.name);
      const schemaFiles = fs.readdirSync(dirPath).filter((f) => f.endsWith('_schema.sql') || f.endsWith('.sql'));
      for (const sf of schemaFiles) {
        try {
          const sqlText = fs.readFileSync(path.join(dirPath, sf), 'utf8');
          sqliteDb.exec(sqlText);
          if (!quiet) console.log(`[Domain Schema Loader] Executed schema: ${dir.name}/${sf}`);
        } catch (e) {
          if (!quiet) console.warn(`[Domain Schema Loader] Schema warning in ${dir.name}/${sf}:`, e.message);
        }
      }
    }
  }

  getCryptoVault(sqliteDb);
  if (!quiet) console.log(`[SoftCode Dual-DB Engine] SQLite3 Offline Database & Crypto Vault initialized at: ${SQLITE_DB_PATH}`);
} catch (sqliteErr) {
  console.warn('[SoftCode Dual-DB Engine] SQLite3 initialization notice:', sqliteErr.message);
}

// ===========================================================================
// 2. CLOUD FIRESTORE INITIALIZATION
// ===========================================================================
let db = null;
let auth = null;
if (!options.disableFirebase) {
  try {
    const configPath = path.resolve('./firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const firebaseApp = initializeApp(config);
      db = config.firestoreDatabaseId
        ? getFirestore(firebaseApp, config.firestoreDatabaseId)
        : getFirestore(firebaseApp);
      if (config.apiKey) {
        auth = getAuth(firebaseApp);
      }
      if (!quiet) console.log('Firebase Client Initialized Successfully with db:', config.firestoreDatabaseId || 'default');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error?.message || error);
  }
}

// Safe Firestore collection reader with local fallback
async function getCollectionDocs(collName, defaultData) {
  if (!db) return defaultData;
  try {
    const snapshot = await getDocs(collection(db, collName));
    if (snapshot.empty) return defaultData;
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn(`Firestore read fallback for [${collName}]:`, err.message);
    return defaultData;
  }
}

// ===========================================================================
// 3. BACKGROUND CLOUD SYNC WORKER (SQLite is_synced=0 -> Firestore)
// ===========================================================================
let syncWorkerRunning = false;
async function runBackgroundAutoSync() {
  if (syncWorkerRunning || !sqliteDb || !db) return;
  syncWorkerRunning = true;
  let syncedThisRun = 0;
  try {
    const pendingTenants = sqliteDb.prepare('SELECT * FROM local_tenants WHERE is_synced = 0 LIMIT 25').all();
    for (const t of pendingTenants) {
      try {
        await addDoc(collection(db, 'clients'), {
          id: t.id,
          tenant_id: t.tenant_id,
          idempotency_key: t.idempotency_key,
          full_name: t.full_name,
          email: t.email,
          email_blind_idx: t.email_blind_idx || '',
          company_name: t.company_name,
          business_type: t.business_type,
          business_size: t.business_size,
          country: t.country,
          city: t.city,
          address: t.address,
          vault_encrypted: String(t.email || '').startsWith('enc:v1:'),
          status: 'PENDING',
          is_synced: 1,
          created_at: t.created_at,
          synced_at: new Date().toISOString()
        });
        sqliteDb.prepare('UPDATE local_tenants SET is_synced = 1 WHERE id = ?').run(t.id);
        syncedThisRun += 1;
      } catch {
        break;
      }
    }

    const pendingOrders = sqliteDb.prepare('SELECT * FROM local_pos_orders WHERE is_synced = 0 LIMIT 25').all();
    for (const ord of pendingOrders) {
      try {
        await addDoc(collection(db, 'retail_orders'), { ...ord, is_synced: 1, synced_at: new Date().toISOString() });
        sqliteDb.prepare('UPDATE local_pos_orders SET is_synced = 1 WHERE id = ?').run(ord.id);
      } catch {
        break;
      }
    }

    const pendingStudents = sqliteDb.prepare('SELECT * FROM local_school_students WHERE is_synced = 0 LIMIT 25').all();
    for (const st of pendingStudents) {
      try {
        await setDoc(doc(db, 'school_students', st.id), {
          id: st.id,
          tenant_id: st.tenant_id || 'tenant-root-platform',
          rollNo: st.roll_no,
          fullName: st.full_name,
          grade: st.grade,
          section: st.section,
          guardianName: st.guardian_name,
          phone: st.phone,
          feeStatus: st.fee_status,
          admissionDate: st.admission_date,
          status: st.status,
          is_synced: 1,
          synced_at: new Date().toISOString()
        });
        sqliteDb.prepare('UPDATE local_school_students SET is_synced = 1 WHERE id = ?').run(st.id);
      } catch {
        break;
      }
    }

    const pendingFees = sqliteDb.prepare('SELECT * FROM local_school_fees WHERE is_synced = 0 LIMIT 25').all();
    for (const fee of pendingFees) {
      try {
        await setDoc(doc(db, 'school_fees', fee.id), {
          id: fee.id,
          tenant_id: fee.tenant_id || 'tenant-root-platform',
          challanNo: fee.challan_no,
          studentId: fee.student_id || '',
          studentName: fee.student_name,
          rollNo: fee.roll_no,
          grade: fee.grade,
          month: fee.month,
          tuition: fee.tuition,
          labFee: fee.lab_fee,
          discount: fee.discount,
          total: fee.total,
          status: fee.status,
          dueDate: fee.due_date,
          paidDate: fee.paid_date,
          is_synced: 1,
          synced_at: new Date().toISOString()
        });
        sqliteDb.prepare('UPDATE local_school_fees SET is_synced = 1 WHERE id = ?').run(fee.id);
      } catch {
        break;
      }
    }

    const pendingAtt = sqliteDb.prepare('SELECT * FROM local_school_attendance WHERE is_synced = 0 LIMIT 30').all();
    for (const att of pendingAtt) {
      try {
        await setDoc(doc(db, 'school_attendance', att.id), {
          id: att.id,
          tenant_id: att.tenant_id || 'tenant-root-platform',
          studentId: att.student_id,
          rollNo: att.roll_no,
          studentName: att.student_name,
          grade: att.grade,
          status: att.status,
          date: att.date,
          verificationMode: att.verification_mode,
          is_synced: 1,
          synced_at: new Date().toISOString()
        });
        sqliteDb.prepare('UPDATE local_school_attendance SET is_synced = 1 WHERE id = ?').run(att.id);
        syncedThisRun += 1;
      } catch {
        break;
      }
    }
    observability.recordSyncRun({ ok: true, syncedCount: syncedThisRun });
  } catch (syncErr) {
    observability.recordSyncRun({ ok: false, error: syncErr });
  } finally {
    syncWorkerRunning = false;
  }
}

let syncIntervalId = null;
let syncTimeoutId = null;
if (!options.disableBackgroundSync) {
  syncIntervalId = setInterval(runBackgroundAutoSync, 30000);
  syncIntervalId.unref();
  syncTimeoutId = setTimeout(runBackgroundAutoSync, 3000);
  syncTimeoutId.unref();
}

// ===========================================================================
// 4. EXPRESS API GATEWAY & MODULAR DOMAIN ROUTER MOUNTING
// ===========================================================================
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(observability.requestMiddleware());

// Enterprise Security Headers (Anti-XSS, Anti-Clickjacking, Anti-MIME Sniffing)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), payment=()');
  next();
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Prototype-Pollution & Null-Byte Payload Sanitizer
function scrubDangerousKeys(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 8) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => scrubDangerousKeys(item, depth + 1));
  }
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    if (typeof v === 'string') {
      clean[k] = v.replace(/\0/g, '');
    } else {
      clean[k] = scrubDangerousKeys(v, depth + 1);
    }
  }
  return clean;
}

app.use('/api', (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = scrubDangerousKeys(req.body);
  }
  next();
});

// Global API Bot / Flood Rate Limiter (Sliding Window per IP)
const apiRateMap = new Map();
const ratePruneIntervalId = setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [ip, hits] of apiRateMap.entries()) {
    const recent = hits.filter((ts) => ts > cutoff);
    if (recent.length === 0) apiRateMap.delete(ip);
    else apiRateMap.set(ip, recent);
  }
}, 60000);
ratePruneIntervalId.unref();

const rateLimitMaxPerMin = Number(options.rateLimitMaxPerMin ?? process.env.SCS_API_RATE_LIMIT ?? 240);
app.use('/api', (req, res, next) => {
  if (options.disableRateLimit || req.path === '/health' || req.path.startsWith('/metrics')) return next();
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();
  const recent = (apiRateMap.get(ip) || []).filter((ts) => ts > now - 60000);
  if (recent.length >= rateLimitMaxPerMin) {
    return res.status(429).json({
      ok: false,
      code: 'GLOBAL_RATE_LIMIT',
      message: 'Too many requests detected from your network. Please slow down.'
    });
  }
  recent.push(now);
  apiRateMap.set(ip, recent);
  next();
});

// Health, Readiness & Live Observability Probes
app.get(['/healthz', '/_healthz', '/health', '/_health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'HEALTHY', service: 'SoftCode Enterprise', timestamp: new Date().toISOString() });
});

app.get(['/readyz', '/_readyz'], (req, res) => {
  let sqliteReady = false;
  if (sqliteDb) {
    try {
      sqliteDb.prepare('SELECT 1 AS ok').get();
      sqliteReady = true;
    } catch {}
  }
  const status = sqliteReady ? 200 : 503;
  res.status(status).json({
    status: sqliteReady ? 'READY' : 'DEGRADED',
    sqlite: sqliteReady ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/metrics', (req, res) => {
  if (!authorizeMetricsRequest(req)) {
    return res.status(401).json({ ok: false, code: 'METRICS_UNAUTHORIZED', message: 'Valid metrics token required.' });
  }
  res.json(observability.getMetricsSnapshot(sqliteDb));
});

app.get('/api/metrics/prometheus', (req, res) => {
  if (!authorizeMetricsRequest(req)) {
    return res.status(401).type('text/plain').send('# unauthorized\n');
  }
  res.type('text/plain; version=0.0.4').send(observability.toPrometheusText(sqliteDb));
});

// A. SoftCodeSolution Company Platform, Auth Security & SuperAdmin Governance
const cryptoVault = getCryptoVault(sqliteDb);
const vaultFor = (domainKey) => cryptoVault.createDomainVaultMiddleware(domainKey, db);

mountSoftCodePlatform(app, { sqliteDb, db, sqliteDbPath: SQLITE_DB_PATH, getCollectionDocs });

const authRouter = createAuthRouter(sqliteDb, db);
app.use('/api/auth', authRouter);
app.use('/api/superadmin/security', authRouter);
app.use('/api', authRouter);

const superAdminRouter = createSuperAdminRouter(sqliteDb, db);
app.use('/api/superadmin', vaultFor('superadmin_core'), superAdminRouter);
app.use('/api', superAdminRouter);

// B. All 33 Business Domain Routers (Mounted cleanly on /api/<domain> with Per-Tenant CryptoVault Encryption)
app.use('/api/accounting', vaultFor('accounting_tax'), createAccountingRouter(sqliteDb, db));
app.use('/api/auto', vaultFor('auto_workshop'), createAutoRouter(sqliteDb, db));
app.use('/api/bakery', vaultFor('bakery_confectionery'), createBakeryRouter(sqliteDb, db));
app.use('/api/salon', vaultFor('beauty_salon'), createSalonRouter(sqliteDb, db));
app.use('/api/car-rental', vaultFor('car_rental'), createCarRentalRouter(sqliteDb, db));
app.use('/api/catering', vaultFor('catering_services'), createCateringRouter(sqliteDb, db));
app.use('/api/cleaning', vaultFor('cleaning_janitorial'), createCleaningRouter(sqliteDb, db));
app.use('/api/coaching', vaultFor('coaching_academy'), createCoachingRouter(sqliteDb, db));
app.use('/api/construction', vaultFor('construction_contractor'), createConstructionRouter(sqliteDb, db));
app.use('/api/dental', vaultFor('dental_clinic'), createDentalRouter(sqliteDb, db));
app.use('/api/diagnostic-lab', vaultFor('diagnostic_lab'), createLabRouter(sqliteDb, db));
app.use('/api/marketing', vaultFor('digital_marketing_agency'), createMarketingRouter(sqliteDb, db));

const ecommerceRouter = createEcommerceRouter(sqliteDb, db);
const fulfillmentRouter = createFulfillmentRouter(sqliteDb, db);
app.use('/api/ecommerce', vaultFor('ecommerce_fulfillment'), ecommerceRouter);
app.use('/api/ecommerce', vaultFor('ecommerce_fulfillment'), fulfillmentRouter);
app.use('/api/fulfillment', vaultFor('ecommerce_fulfillment'), fulfillmentRouter);

app.use('/api/events', vaultFor('event_management'), createEventsRouter(sqliteDb, db));
app.use('/api/gym', vaultFor('gym_fitness'), createGymRouter(sqliteDb, db));
app.use('/api/clinic', vaultFor('hospital_clinic'), createClinicRouter(sqliteDb, db));
app.use('/api/hospital', vaultFor('hospital_clinic'), createHospitalRouter(sqliteDb, db));
app.use('/api/hotel', vaultFor('hotel_hospitality'), createHotelRouter(sqliteDb, db));

const legalRouter = createLegalRouter(sqliteDb, db);
app.use('/api/law-firm', vaultFor('law_firm'), legalRouter);
app.use('/api/legal', vaultFor('law_firm'), legalRouter);

const logisticsRouter = createLogisticsRouter(sqliteDb, db);
app.use('/api/logistics', vaultFor('logistics_courier'), logisticsRouter);
app.use('/api/cargo', vaultFor('logistics_courier'), logisticsRouter);

app.use('/api/manufacturing', vaultFor('manufacturing_plant'), createManufacturingRouter(sqliteDb, db));
app.use('/api/ngo', vaultFor('ngo_charity'), createNgoRouter(sqliteDb, db));
app.use('/api/pharmacy', vaultFor('pharmacy_store'), createPharmacyRouter(sqliteDb, db));
app.use('/api/media-studio', vaultFor('photography_studio'), createMediaRouter(sqliteDb, db));

const propertyRouter = createPropertyRouter(sqliteDb, db);
const realEstateRouter = createRealEstateRouter(sqliteDb, db);
app.use('/api/properties', vaultFor('real_estate'), propertyRouter);
app.use('/api/realty', vaultFor('real_estate'), realEstateRouter);
app.use('/api/real-estate', vaultFor('real_estate'), realEstateRouter);

app.use('/api/restaurant', vaultFor('restaurant_cafe'), createRestaurantRouter(sqliteDb, db));
app.use('/api/retail', vaultFor('retail_pos'), createRetailRouter(sqliteDb, db));
app.use('/api/school', vaultFor('school_business'), createSchoolRouter(sqliteDb, db, getCollectionDocs));
app.use('/api/solar', vaultFor('solar_energy'), createSolarRouter(sqliteDb, db));
app.use('/api/supermarket', vaultFor('supermarket_grocery'), createSupermarketRouter(sqliteDb, db));
app.use('/api/travel', vaultFor('travel_agency'), createTravelRouter(sqliteDb, db));
app.use('/api/veterinary', vaultFor('veterinary_clinic'), createVeterinaryRouter(sqliteDb, db));
app.use('/api/vocational', vaultFor('vocational_training'), createVocationalRouter(sqliteDb, db));
app.use('/api/wholesale', vaultFor('wholesale_distribution'), createWholesaleRouter(sqliteDb, db));

// ===========================================================================
// 5. STATIC FRONTEND HOSTING, AUTOMATED BUILD GUARD & SPA FALLBACK
// ===========================================================================
const candidateDistDirs = [
  path.resolve('./frontend/dist/softcode-ui/browser'),
  path.resolve('./dist/softcode-ui/browser'),
  path.resolve('./frontend/dist/browser'),
  path.resolve('./dist/browser'),
  path.resolve('./frontend/dist/softcode-ui'),
  path.resolve('./dist/softcode-ui'),
  path.resolve('./dist/softcodesolution/browser'),
  path.resolve('./dist/frontend/browser'),
  path.resolve('./frontend/dist'),
  path.resolve('./dist'),
  path.resolve('./frontend/public'),
  path.resolve('./public')
];

for (const dir of candidateDistDirs) {
  if (fs.existsSync(dir)) {
    app.use(express.static(dir, {
      maxAge: '1h',
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js') || filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
  }
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  for (const dir of candidateDistDirs) {
    if (fs.existsSync(dir)) {
      const cleanPath = decodeURIComponent(req.path).replace(/^\/+/, '');
      if (cleanPath) {
        const filePath = path.join(dir, cleanPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          return res.sendFile(filePath);
        }
      }
    }
  }
  next();
});

function findIndexHtml() {
  const candidateIndexFiles = [
    path.resolve('./dist/index.html'),
    path.resolve('./dist/softcode-ui/browser/index.html'),
    path.resolve('./frontend/dist/softcode-ui/browser/index.html'),
    path.resolve('./frontend/dist/browser/index.html'),
    path.resolve('./dist/browser/index.html'),
    path.resolve('./frontend/dist/softcode-ui/index.html'),
    path.resolve('./dist/softcode-ui/index.html'),
    path.resolve('./dist/softcodesolution/browser/index.html'),
    path.resolve('./frontend/dist/index.html')
  ];
  for (const f of candidateIndexFiles) {
    if (fs.existsSync(f)) return f;
  }
  return null;
}

let isBuilding = false;
let lastBuildAttemptAt = 0;
function triggerBuildIfNeeded() {
  if (options.disableFrontendBuild || findIndexHtml() || isBuilding) return;
  const now = Date.now();
  if (now - lastBuildAttemptAt < 15000) return;
  isBuilding = true;
  lastBuildAttemptAt = now;
  exec('pgrep -f "[n]g build"', (pgrepErr, pgrepOut) => {
    if (!pgrepErr && pgrepOut && pgrepOut.trim()) {
      console.log('[Softcode] External ng build already running, waiting before retry...');
      isBuilding = false;
      return;
    }
    console.log('[Softcode] Frontend build not detected. Initiating automated build...');
    exec('npm run build', { maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      isBuilding = false;
      if (err) {
        console.error('[Softcode] Build failed:', err.message || err);
        if (stderr) console.error(stderr.slice(-2000));
      } else {
        console.log('[Softcode] Frontend build completed successfully!');
      }
    });
  });
}
triggerBuildIfNeeded();

app.use((req, res, next) => {
  if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  const indexFile = findIndexHtml();
  if (indexFile) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(indexFile);
  }
  triggerBuildIfNeeded();
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SoftCode Solution</title>
  <meta http-equiv="refresh" content="2">
  <style>
    body { background: #090d16; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { text-align: center; padding: 2.5rem 3rem; border-radius: 1.25rem; background: #0f172a; border: 1px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); max-width: 480px; }
    .spinner { width: 44px; height: 44px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.9s linear infinite; margin: 0 auto 1.5rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 1.35rem; font-weight: 700; margin: 0 0 0.5rem; color: #fff; letter-spacing: -0.02em; }
    p { font-size: 0.9rem; color: #94a3b8; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>SoftCode Enterprise</h2>
    <p>Initializing enterprise modules and routing...</p>
  </div>
</body>
</html>`);
});

// Global Express Error Tracking & Alerting Boundary
app.use(observability.errorMiddleware());

  return {
    app,
    sqliteDb,
    db,
    observability,
    close: () => {
      if (syncIntervalId) clearInterval(syncIntervalId);
      if (syncTimeoutId) clearTimeout(syncTimeoutId);
      if (ratePruneIntervalId) clearInterval(ratePruneIntervalId);
      if (sqliteDb && typeof sqliteDb.close === 'function') {
        try { sqliteDb.close(); } catch {}
      }
    }
  };
}

// ===========================================================================
// 6. PROCESS LIFECYCLE & PORT BINDING
// ===========================================================================
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const { app, observability, close } = createApp();

  process.on('uncaughtException', (err) => {
    observability.captureError(err);
  });
  process.on('unhandledRejection', (reason) => {
    observability.captureError(reason instanceof Error ? reason : new Error(String(reason)));
  });

  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? process.argv[portArgIndex + 1] : null;
  const PORT = parseInt(portFromArg || process.env.PORT || '3000', 10);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Platform Backend running on 0.0.0.0:${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} signal received: closing HTTP server`);
    server.close(() => {
      close();
      console.log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      close();
      process.exit(0);
    }, 4000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}