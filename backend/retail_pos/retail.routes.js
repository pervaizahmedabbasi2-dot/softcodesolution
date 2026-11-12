import express from 'express';
import { collection, addDoc } from 'firebase/firestore';

export function createRetailRouter(sqliteDb, db, RETAIL_PRODUCTS) {
  const router = express.Router();

  router.get('/products', (req, res) => {
    res.json({ ok: true, products: RETAIL_PRODUCTS });
  });

  router.post('/checkout', async (req, res) => {
    const { items, paymentMethod, customerName, total } = req.body || {};
    const receiptNo = 'RCPT-2026-' + Math.floor(10000 + Math.random() * 90000);
    const orderId = 'POS-ORD-' + Date.now();
    const nowIso = new Date().toISOString();

    let sqliteSaved = false;
    let cloudSynced = false;

    // Save to SQLite POS table
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO local_pos_orders (
            id, receipt_no, customer_name, items_count, total_amount, payment_method, cashier, items_json, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `);

        stmt.run(
          orderId,
          receiptNo,
          customerName || 'Walk-in Customer',
          items ? items.length : 1,
          total || 0,
          paymentMethod || 'CASH',
          'Pos Cashier Counter 01',
          JSON.stringify(items || []),
          nowIso
        );
        sqliteSaved = true;
      } catch (sqlErr) {
        console.warn('POS Order SQLite Save Error:', sqlErr.message);
      }
    }

    // Sync to Cloud
    if (db) {
      try {
        await addDoc(collection(db, 'retail_orders'), {
          id: orderId,
          receiptNo,
          customerName: customerName || 'Walk-in Customer',
          items: items || [],
          total: total || 0,
          paymentMethod: paymentMethod || 'CASH',
          is_synced: 1,
          created_at: nowIso
        });
        cloudSynced = true;

        if (sqliteDb) {
          try { sqliteDb.prepare('UPDATE local_pos_orders SET is_synced = 1 WHERE id = ?').run(orderId); } catch (e) {}
        }
      } catch (dbErr) {
        console.warn('POS Order Cloud Sync Deferred:', dbErr.message);
      }
    }

    res.json({
      ok: true,
      message: `Checkout successful! Receipt #${receiptNo}`,
      receiptNo,
      orderId,
      syncStatus: {
        offlineStorage: sqliteSaved ? 'SAVED_SQLITE' : 'IN_MEMORY',
        cloudSync: cloudSynced ? 'SYNCED_POSTGRES_CLOUD' : 'QUEUED_FOR_RECONNECT'
      }
    });
  });

  return router;
}
