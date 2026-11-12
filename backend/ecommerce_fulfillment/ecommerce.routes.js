import express from 'express';

export function createEcommerceRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/fulfillment', (req, res) => {
    res.json({
      ok: true,
      parcels: [
        { id: 'ecom-1', parcelNo: 'PCL-2026-8801', store: 'Shopify Store A', recipient: 'Bilal Hassan', warehouseBin: 'BIN-C4-12', status: 'PACKED_READY' },
        { id: 'ecom-2', parcelNo: 'PCL-2026-8802', store: 'WooCommerce Store B', recipient: 'Fatima Ali', warehouseBin: 'BIN-A1-09', status: 'IN_TRANSIT' }
      ]
    });
  });
  return router;
}
