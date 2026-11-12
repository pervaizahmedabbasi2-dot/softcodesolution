import express from 'express';

export function createSupermarketRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/inventory', (req, res) => {
    res.json({
      ok: true,
      items: [
        { id: 'g-1', barcode: '890112233445', item: 'Fresh Organic Milk 1L', category: 'Dairy', price: 2.50, stock: 450 },
        { id: 'g-2', barcode: '890223344556', item: 'Whole Wheat Flour 10kg', category: 'Grains', price: 8.90, stock: 210 }
      ]
    });
  });
  return router;
}
