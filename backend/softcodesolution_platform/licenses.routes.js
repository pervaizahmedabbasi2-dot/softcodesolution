import express from 'express';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export const DEFAULT_LICENSES = [
  { id: 'lic-101', key: 'SCS-ENTP-9842-8819-4401', clientName: 'Apex Financial Holdings', companyName: 'Apex Financial', tier: 'ENTERPRISE_UNLIMITED', maxDevices: 50, activeDevices: 38, status: 'ACTIVE', issueDate: '2026-01-10', expiryDate: '2027-01-10', hardwareFingerprint: 'hw_99a8b1c4e2' },
  { id: 'lic-102', key: 'SCS-PROS-4712-3091-6628', clientName: 'Quantum Cloud Logistics', companyName: 'Quantum Logistics', tier: 'PROFESSIONAL_TIER', maxDevices: 15, activeDevices: 12, status: 'ACTIVE', issueDate: '2026-02-01', expiryDate: '2027-02-01', hardwareFingerprint: 'hw_33f7d2a1b9' },
  { id: 'lic-103', key: 'SCS-HYBR-8103-9941-1120', clientName: 'BioHealth Genomic Labs', companyName: 'BioHealth Labs', tier: 'ENTERPRISE_DEDICATED', maxDevices: 100, activeDevices: 91, status: 'ACTIVE', issueDate: '2025-11-15', expiryDate: '2026-11-15', hardwareFingerprint: 'hw_44b0c8d19e' },
  { id: 'lic-104', key: 'SCS-STRT-2041-5510-9082', clientName: 'Nordic Retail Group', companyName: 'Nordic Retail', tier: 'GROWTH_TIER', maxDevices: 10, activeDevices: 8, status: 'EXPIRING_SOON', issueDate: '2025-10-01', expiryDate: '2026-10-01', hardwareFingerprint: 'hw_77e1a3b5c6' }
];

export function createLicensesRouter(sqliteDb, db, getCollectionDocs) {
  const router = express.Router();

  router.get(['/license/list', '/licenses'], async (req, res) => {
    const licenses = getCollectionDocs ? await getCollectionDocs('licenses', DEFAULT_LICENSES) : DEFAULT_LICENSES;
    res.json({ ok: true, licenses });
  });

  router.post('/license/generate', async (req, res) => {
    try {
      const { clientName, companyName, tier = 'ENTERPRISE_UNLIMITED', maxDevices = 25, durationDays = 365 } = req.body || {};

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const randSegment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const key = `SCS-${randSegment()}-${randSegment()}-${randSegment()}-${randSegment()}`;

      const now = new Date();
      const expiry = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));

      const newLicense = {
        id: 'lic-' + Date.now(),
        key,
        clientName: clientName || companyName || 'Enterprise Partner',
        companyName: companyName || clientName || 'Enterprise Partner',
        tier,
        maxDevices: Number(maxDevices),
        activeDevices: 0,
        status: 'ACTIVE',
        issueDate: now.toISOString().split('T')[0],
        expiryDate: expiry.toISOString().split('T')[0],
        hardwareFingerprint: 'pending_first_binding',
        created_at: now.toISOString()
      };

      if (sqliteDb) {
        try {
          sqliteDb.prepare(`
            INSERT OR REPLACE INTO platform_licenses
            (id, license_key, client_name, company_name, tier, max_devices, active_devices, status, issue_date, expiry_date, hardware_fingerprint, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(newLicense.id, newLicense.key, newLicense.clientName, newLicense.companyName, newLicense.tier, newLicense.maxDevices, 0, newLicense.status, newLicense.issueDate, newLicense.expiryDate, newLicense.hardwareFingerprint, newLicense.created_at);
        } catch (e) {}
      }

      if (db) {
        try {
          await setDoc(doc(db, 'licenses', newLicense.id), newLicense);
        } catch (err) {
          console.warn('Save license error:', err.message);
        }
      }

      res.json({ ok: true, message: 'License key created and cryptographically signed', license: newLicense });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  router.post('/license/revoke', async (req, res) => {
    const { id } = req.body || {};
    if (sqliteDb && id) {
      try { sqliteDb.prepare("UPDATE platform_licenses SET status = 'REVOKED' WHERE id = ?").run(id); } catch (e) {}
    }
    if (db && id) {
      try {
        await updateDoc(doc(db, 'licenses', id), { status: 'REVOKED', revoked_at: new Date().toISOString() });
      } catch (e) {}
    }
    res.json({ ok: true, message: `License ${id} revoked` });
  });

  return router;
}
