import express from 'express';
import { collection, addDoc } from 'firebase/firestore';
import { getCryptoVault } from '../auth_security/crypto_vault.js';

export const PHARMACY_MEDICINES = [
  { id: 'med-1', name: 'Augmentin 625mg', generic: 'Co-Amoxiclav', category: 'Antibiotic', batchNo: 'AUG-9921', barcode: '896400112201', expiryDate: '2027-02-15', stock: 140, minStock: 25, unitPrice: 4.80, status: 'IN_STOCK' },
  { id: 'med-1b', name: 'Augmentin 625mg', generic: 'Co-Amoxiclav', category: 'Antibiotic', batchNo: 'AUG-8402', barcode: '896400112201', expiryDate: '2026-08-10', stock: 28, minStock: 25, unitPrice: 4.80, status: 'NEAR_EXPIRY' },
  { id: 'med-2', name: 'Panadol Extra', generic: 'Paracetamol + Caffeine', category: 'Analgesic', batchNo: 'PAN-4410', barcode: '896400112202', expiryDate: '2026-11-20', stock: 320, minStock: 50, unitPrice: 1.50, status: 'IN_STOCK' },
  { id: 'med-3', name: 'Nexum 40mg', generic: 'Esomeprazole', category: 'Antacid / PPI', batchNo: 'NEX-8812', barcode: '896400112203', expiryDate: '2026-10-05', stock: 12, minStock: 20, unitPrice: 3.20, status: 'LOW_STOCK' },
  { id: 'med-4', name: 'Zithromax 500mg', generic: 'Azithromycin', category: 'Antibiotic', batchNo: 'ZTH-3109', barcode: '896400112204', expiryDate: '2026-04-10', stock: 45, minStock: 15, unitPrice: 6.50, status: 'NEAR_EXPIRY' },
  { id: 'med-5', name: 'Glucophage 1000mg', generic: 'Metformin HCl', category: 'Antidiabetic', batchNo: 'GLU-5521', barcode: '896400112205', expiryDate: '2027-08-30', stock: 210, minStock: 30, unitPrice: 2.90, status: 'IN_STOCK' }
];

export const PHARMACY_SALES = [
  { id: 'psale-1', billNo: 'RXB-2026-8801', patient: 'Hamza Malik', doctor: 'Dr. Tariq Jamil', totalAmount: 24.50, itemsCount: 3, date: '2026-03-27', status: 'DISPENSED' },
  { id: 'psale-2', billNo: 'RXB-2026-8802', patient: 'Sultana Bibi', doctor: 'Dr. Ayesha Noor', totalAmount: 18.20, itemsCount: 2, date: '2026-03-27', status: 'DISPENSED' }
];

export function createPharmacyRouter(sqliteDb, db, getMedicinesData, getSalesData) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);
  const resolveTid = (req) => String(req?.headers?.['x-tenant-id'] || req?.query?.tenantId || req?.body?.tenantId || 'tenant-root-platform').trim();
  const medicines = () => (getMedicinesData ? getMedicinesData() : PHARMACY_MEDICINES);
  const sales = () => (getSalesData ? getSalesData() : PHARMACY_SALES);

  router.get('/medicines', (req, res) => {
    res.json({ ok: true, medicines: medicines() });
  });

  // FEFO (First-Expired-First-Out) barcode / batch / salt resolver
  router.get('/barcode-lookup', (req, res) => {
    const code = String(req.query?.code || '').trim();
    if (!code) return res.status(400).json({ ok: false, message: 'Medicine barcode or batch code is required.' });
    const upper = code.toUpperCase();
    const todayIso = String(req.query?.asOfDate || new Date().toISOString().split('T')[0]);
    const list = medicines();
    const matched = list.filter(
      (m) =>
        String(m.barcode || '').trim().toUpperCase() === upper ||
        String(m.batchNo || '').trim().toUpperCase() === upper ||
        String(m.name || '').trim().toUpperCase() === upper
    );
    if (matched.length === 0) {
      return res.status(404).json({ ok: false, error: 'MEDICINE_NOT_FOUND', message: `No medicine batch found for "${code}".` });
    }
    const annotated = matched
      .map((m) => {
        const exp = String(m.expiryDate || '2099-12-31');
        return {
          ...m,
          isExpired: exp < todayIso
        };
      })
      .sort((a, b) => String(a.expiryDate).localeCompare(String(b.expiryDate)));
    const fefoRecommended = annotated.find((m) => !m.isExpired && Number(m.stock || 0) > 0) || annotated[0];
    res.json({
      ok: true,
      strategy: 'FEFO',
      recommendedBatch: fefoRecommended,
      batches: annotated
    });
  });

  router.post('/medicines', (req, res) => {
    const m = req.body || {};
    const newMed = {
      id: 'med-' + Date.now(),
      name: m.name || 'New Medicine',
      generic: m.generic || 'Generic Formula',
      category: m.category || 'General',
      batchNo: m.batchNo || 'BAT-' + Math.floor(1000 + Math.random() * 9000),
      barcode: m.barcode || '8964' + Math.floor(10000000 + Math.random() * 90000000),
      expiryDate: m.expiryDate || '2027-06-30',
      stock: Number(m.stock || 50),
      minStock: Number(m.minStock || 15),
      unitPrice: Number(m.unitPrice || 5.0),
      status: Number(m.stock || 50) > 15 ? 'IN_STOCK' : 'LOW_STOCK'
    };
    medicines().unshift(newMed);
    res.json({ ok: true, medicine: newMed });
  });

  router.get('/sales', (req, res) => {
    const tid = resolveTid(req);
    let list = [...sales()];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM local_pharmacy_sales ORDER BY created_at DESC LIMIT 100').all();
        if (rows.length > 0) {
          const seen = new Set(list.map(s => s.id));
          for (const r of rows) {
            if (!seen.has(r.id)) {
              const rowTid = r.tenant_id || tid;
              list.unshift({
                id: r.id,
                billNo: r.bill_no,
                patient: vault.decryptField(rowTid, r.patient_name),
                doctor: vault.decryptField(rowTid, r.doctor_name),
                totalAmount: r.total_amount,
                itemsCount: r.items_count,
                date: r.created_at,
                status: 'DISPENSED'
              });
            }
          }
        }
      } catch (e) {}
    }
    res.json({ ok: true, sales: list });
  });

  router.post('/dispense', (req, res) => {
    const tid = resolveTid(req);
    const s = req.body || {};
    const newSale = {
      id: 'psale-' + Date.now(),
      tenant_id: tid,
      billNo: 'RXB-2026-' + Math.floor(1000 + Math.random() * 9000),
      patient: s.patient || 'Counter Walk-in',
      doctor: s.doctor || 'General Practitioner',
      totalAmount: Number(s.totalAmount || 15.0),
      itemsCount: Number(s.itemsCount || 1),
      date: new Date().toISOString().split('T')[0],
      status: 'DISPENSED'
    };
    sales().unshift(newSale);

    const encPatient = vault.encryptField(tid, newSale.patient);
    const encDoctor = vault.encryptField(tid, newSale.doctor);

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO local_pharmacy_sales (
            id, tenant_id, bill_no, patient_name, doctor_name, total_amount, items_count, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        `);
        stmt.run(newSale.id, tid, newSale.billNo, encPatient, encDoctor, newSale.totalAmount, newSale.itemsCount, newSale.date);
      } catch (e) {
        console.warn('[Pharmacy Dual-DB Engine] SQLite save warning:', e.message);
      }
    }

    if (db) {
      addDoc(collection(db, 'pharmacy_sales'), {
        ...newSale,
        patient: encPatient,
        doctor: encDoctor,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }).then(() => {
        if (sqliteDb) {
          try { sqliteDb.prepare('UPDATE local_pharmacy_sales SET is_synced = 1 WHERE id = ?').run(newSale.id); } catch (e) {}
        }
      }).catch(() => {});
    }

    res.json({ ok: true, message: 'Prescription dispensed & encrypted (AES-256-GCM) in SQLite', sale: newSale });
  });

  return router;
}
