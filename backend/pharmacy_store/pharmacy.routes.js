import express from 'express';
import { collection, addDoc } from 'firebase/firestore';

export const PHARMACY_MEDICINES = [
  { id: 'med-1', name: 'Augmentin 625mg', generic: 'Co-Amoxiclav', category: 'Antibiotic', batchNo: 'AUG-9921', expiryDate: '2027-02-15', stock: 140, minStock: 25, unitPrice: 4.80, status: 'IN_STOCK' },
  { id: 'med-2', name: 'Panadol Extra', generic: 'Paracetamol + Caffeine', category: 'Analgesic', batchNo: 'PAN-4410', expiryDate: '2026-11-20', stock: 320, minStock: 50, unitPrice: 1.50, status: 'IN_STOCK' },
  { id: 'med-3', name: 'Nexum 40mg', generic: 'Esomeprazole', category: 'Antacid / PPI', batchNo: 'NEX-8812', expiryDate: '2026-10-05', stock: 12, minStock: 20, unitPrice: 3.20, status: 'LOW_STOCK' },
  { id: 'med-4', name: 'Zithromax 500mg', generic: 'Azithromycin', category: 'Antibiotic', batchNo: 'ZTH-3109', expiryDate: '2026-04-10', stock: 45, minStock: 15, unitPrice: 6.50, status: 'NEAR_EXPIRY' },
  { id: 'med-5', name: 'Glucophage 1000mg', generic: 'Metformin HCl', category: 'Antidiabetic', batchNo: 'GLU-5521', expiryDate: '2027-08-30', stock: 210, minStock: 30, unitPrice: 2.90, status: 'IN_STOCK' }
];

export const PHARMACY_SALES = [
  { id: 'psale-1', billNo: 'RXB-2026-8801', patient: 'Hamza Malik', doctor: 'Dr. Tariq Jamil', totalAmount: 24.50, itemsCount: 3, date: '2026-03-27', status: 'DISPENSED' },
  { id: 'psale-2', billNo: 'RXB-2026-8802', patient: 'Sultana Bibi', doctor: 'Dr. Ayesha Noor', totalAmount: 18.20, itemsCount: 2, date: '2026-03-27', status: 'DISPENSED' }
];

export function createPharmacyRouter(sqliteDb, db, getMedicinesData, getSalesData) {
  const router = express.Router();
  const medicines = () => (getMedicinesData ? getMedicinesData() : PHARMACY_MEDICINES);
  const sales = () => (getSalesData ? getSalesData() : PHARMACY_SALES);

  router.get('/medicines', (req, res) => {
    res.json({ ok: true, medicines: medicines() });
  });

  router.post('/medicines', (req, res) => {
    const m = req.body || {};
    const newMed = {
      id: 'med-' + Date.now(),
      name: m.name || 'New Medicine',
      generic: m.generic || 'Generic Formula',
      category: m.category || 'General',
      batchNo: m.batchNo || 'BAT-' + Math.floor(1000 + Math.random() * 9000),
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
    res.json({ ok: true, sales: sales() });
  });

  router.post('/dispense', (req, res) => {
    const s = req.body || {};
    const newSale = {
      id: 'psale-' + Date.now(),
      billNo: 'RXB-2026-' + Math.floor(1000 + Math.random() * 9000),
      patient: s.patient || 'Counter Walk-in',
      doctor: s.doctor || 'General Practitioner',
      totalAmount: Number(s.totalAmount || 15.0),
      itemsCount: Number(s.itemsCount || 1),
      date: new Date().toISOString().split('T')[0],
      status: 'DISPENSED'
    };
    sales().unshift(newSale);

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO local_pharmacy_sales (
            id, bill_no, patient_name, doctor_name, total_amount, items_count, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `);
        stmt.run(newSale.id, newSale.billNo, newSale.patient, newSale.doctor, newSale.totalAmount, newSale.itemsCount, newSale.date);
      } catch (e) {
        console.warn('[Pharmacy Dual-DB Engine] SQLite save warning:', e.message);
      }
    }

    if (db) {
      addDoc(collection(db, 'pharmacy_sales'), {
        ...newSale,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }).then(() => {
        if (sqliteDb) {
          try { sqliteDb.prepare('UPDATE local_pharmacy_sales SET is_synced = 1 WHERE id = ?').run(newSale.id); } catch (e) {}
        }
      }).catch(() => {});
    }

    res.json({ ok: true, message: 'Prescription dispensed & saved in SQLite offline', sale: newSale });
  });

  return router;
}
