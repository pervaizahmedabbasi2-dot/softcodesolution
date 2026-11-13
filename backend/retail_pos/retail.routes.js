import express from 'express';
import crypto from 'crypto';
import { collection, addDoc } from 'firebase/firestore';
import { getCryptoVault } from '../auth_security/crypto_vault.js';

export const DEFAULT_RETAIL_PRODUCTS = [
  { id: 'prd-101', name: 'Ultra Wireless Noise-Cancelling Headphones', category: 'Electronics', sku: 'ELEC-9021', barcode: '890123456789', costPrice: 45.00, sellingPrice: 89.99, stock: 42, alertThreshold: 10, status: 'In Stock' },
  { id: 'prd-102', name: 'Organic Arabica Espresso Roast 500g', category: 'Groceries', sku: 'GROC-4412', barcode: '890987654321', costPrice: 6.50, sellingPrice: 14.50, stock: 110, alertThreshold: 20, status: 'In Stock' },
  { id: 'prd-103', name: 'Mechanical RGB Gaming Keyboard (Blue Switch)', category: 'Electronics', sku: 'ELEC-3382', barcode: '890334455667', costPrice: 32.00, sellingPrice: 64.99, stock: 18, alertThreshold: 5, status: 'In Stock' },
  { id: 'prd-104', name: 'Stainless Steel Insulated Thermal Flask 1L', category: 'Home & Living', sku: 'HOME-1109', barcode: '890778899001', costPrice: 8.00, sellingPrice: 19.99, stock: 65, alertThreshold: 15, status: 'In Stock' },
  { id: 'prd-105', name: 'Cotton Crew Neck Minimalist Tee (Navy/L)', category: 'Fashion', sku: 'FASH-8820', barcode: '890556677889', costPrice: 7.20, sellingPrice: 22.00, stock: 4, alertThreshold: 10, status: 'Low Stock' },
  { id: 'prd-106', name: 'Ergonomic Memory Foam Lumbar Cushion', category: 'Office', sku: 'OFF-6651', barcode: '890223344556', costPrice: 11.50, sellingPrice: 28.50, stock: 0, alertThreshold: 8, status: 'Out of Stock' }
];

export const DEFAULT_RETAIL_ORDERS = [
  { id: 'ORD-9021', receiptNo: 'RCP-2026-9021', customerName: 'Walk-in Customer', itemsCount: 3, total: 118.98, paymentMethod: 'Card', cashier: 'Sara Jenkins', date: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ORD-9020', receiptNo: 'RCP-2026-9020', customerName: 'Zainab Qasim', itemsCount: 1, total: 14.50, paymentMethod: 'Cash', cashier: 'Bilal Ahmed', date: new Date(Date.now() - 7200000).toISOString() },
  { id: 'ORD-9019', receiptNo: 'RCP-2026-9019', customerName: 'David Sterling', itemsCount: 4, total: 247.97, paymentMethod: 'Digital Transfer', cashier: 'Sara Jenkins', date: new Date(Date.now() - 14400000).toISOString() }
];

export function createRetailRouter(sqliteDb, db, customProducts) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);
  const resolveTid = (req) => String(req?.headers?.['x-tenant-id'] || req?.query?.tenantId || req?.body?.tenantId || 'tenant-root-platform').trim();
  const RETAIL_PRODUCTS = Array.isArray(customProducts) && customProducts.length > 0 ? customProducts : DEFAULT_RETAIL_PRODUCTS;
  const RETAIL_ORDERS = DEFAULT_RETAIL_ORDERS;
  const TENANT_ORDERS = new Map();

  router.get('/products', (req, res) => {
    res.json({ ok: true, products: RETAIL_PRODUCTS });
  });

  router.post('/products', (req, res) => {
    const p = req.body || {};
    const newProduct = {
      id: 'prd-' + Date.now(),
      name: p.name || 'New Product',
      category: p.category || 'General',
      sku: p.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      barcode: p.barcode || String(Math.floor(100000000000 + Math.random() * 900000000000)),
      costPrice: Number(p.costPrice || 0),
      sellingPrice: Number(p.sellingPrice || 0),
      stock: Number(p.stock || 0),
      alertThreshold: Number(p.alertThreshold || 5),
      status: Number(p.stock) <= 0 ? 'Out of Stock' : (Number(p.stock) <= 10 ? 'Low Stock' : 'In Stock')
    };
    RETAIL_PRODUCTS.unshift(newProduct);
    res.json({ ok: true, message: 'Product added successfully', product: newProduct });
  });

  router.post('/checkout', (req, res) => {
    const tid = resolveTid(req);
    const { items = [], total = 0, paymentMethod = 'Cash', customerName = 'Walk-in Customer', cashier = 'POS Cashier' } = req.body || {};

    items.forEach(item => {
      const prd = RETAIL_PRODUCTS.find(p => p.id === item.id);
      if (prd) {
        prd.stock = Math.max(0, prd.stock - (item.qty || 1));
        prd.status = prd.stock <= 0 ? 'Out of Stock' : (prd.stock <= 10 ? 'Low Stock' : 'In Stock');
      }
    });

    const uniqueSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const receiptNo = `RCP-2026-${Date.now().toString(36).toUpperCase().slice(-4)}${uniqueSuffix}`;
    const orderId = `ORD-${Date.now()}-${uniqueSuffix}`;
    const newOrder = {
      id: orderId,
      tenant_id: tid,
      receiptNo,
      customerName,
      itemsCount: items.reduce((acc, i) => acc + (i.qty || 1), 0) || items.length || 1,
      total: Number(total),
      paymentMethod,
      cashier,
      items,
      date: new Date().toISOString()
    };

    if (tid === 'tenant-root-platform') {
      RETAIL_ORDERS.unshift(newOrder);
    } else {
      const bucket = TENANT_ORDERS.get(tid) || [];
      bucket.unshift(newOrder);
      TENANT_ORDERS.set(tid, bucket.slice(0, 100));
    }

    const encCustomer = vault.encryptField(tid, customerName);
    const encCashier = vault.encryptField(tid, cashier);
    const encItemsJson = vault.encryptField(tid, JSON.stringify(items));

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO local_pos_orders (
            id, tenant_id, receipt_no, customer_name, items_count, total_amount,
            payment_method, cashier, items_json, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `);
        stmt.run(
          orderId,
          tid,
          receiptNo,
          encCustomer,
          newOrder.itemsCount,
          newOrder.total,
          paymentMethod,
          encCashier,
          encItemsJson,
          newOrder.date
        );
      } catch (e) {
        console.warn('[POS Dual-DB Engine] SQLite save warning:', e.message);
      }
    }

    if (db) {
      addDoc(collection(db, 'retail_orders'), {
        ...newOrder,
        customerName: encCustomer,
        cashier: encCashier,
        itemsJson: encItemsJson,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }).then(() => {
        if (sqliteDb) {
          try {
            sqliteDb.prepare('UPDATE local_pos_orders SET is_synced = 1 WHERE id = ?').run(orderId);
          } catch (e) {}
        }
      }).catch(() => {});
    }

    res.json({ ok: true, message: 'Checkout recorded & encrypted (AES-256-GCM) in SQLite', receiptNo, orderId, order: newOrder });
  });

  router.get('/orders', (req, res) => {
    const tid = resolveTid(req);
    const isRoot = tid === 'tenant-root-platform';
    let orders = isRoot ? [...RETAIL_ORDERS] : [...(TENANT_ORDERS.get(tid) || [])];
    if (sqliteDb) {
      try {
        const rows = isRoot
          ? sqliteDb.prepare('SELECT * FROM local_pos_orders ORDER BY created_at DESC LIMIT 100').all()
          : sqliteDb.prepare('SELECT * FROM local_pos_orders WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100').all(tid);
        if (rows.length > 0) {
          const seen = new Set(orders.map(o => o.id));
          for (const r of rows) {
            if (!seen.has(r.id)) {
              const rowTid = r.tenant_id || tid;
              const decItems = vault.decryptField(rowTid, r.items_json);
              let parsedItems = [];
              try { parsedItems = JSON.parse(decItems); } catch {}
              orders.unshift({
                id: r.id,
                tenant_id: rowTid,
                receiptNo: r.receipt_no,
                customerName: vault.decryptField(rowTid, r.customer_name),
                itemsCount: r.items_count,
                total: r.total_amount,
                paymentMethod: r.payment_method,
                cashier: vault.decryptField(rowTid, r.cashier),
                items: parsedItems,
                date: r.created_at
              });
            }
          }
        }
      } catch (e) {}
    }
    res.json({ ok: true, orders });
  });

  return router;
}
