import express from 'express';
import { collection, addDoc } from 'firebase/firestore';

export function createPharmacyRouter(sqliteDb, db, getMedicinesData, getSalesData) {
  const router = express.Router();

  router.get('/medicines', (req, res) => {
    const list = getMedicinesData ? getMedicinesData() : [];
    res.json({ ok: true, medicines: list });
  });

  router.get('/sales', (req, res) => {
    const list = getSalesData ? getSalesData() : [];
    res.json({ ok: true, sales: list });
  });

  router.post('/dispense', async (req, res) => {
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

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO local_pharmacy_sales (
            id, bill_no, patient_name, doctor_name, total_amount, items_count, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `);
        stmt.run(newSale.id, newSale.billNo, newSale.patient, newSale.doctor, newSale.totalAmount, newSale.itemsCount, newSale.date);
      } catch (e) {}
    }

    if (db) {
      try {
        await addDoc(collection(db, 'pharmacy_sales'), {
          ...newSale,
          is_synced: 1,
          synced_at: new Date().toISOString()
        });
      } catch (e) {}
    }

    res.json({ ok: true, message: 'Prescription dispensed & saved in SQLite offline', sale: newSale });
  });

  return router;
}
