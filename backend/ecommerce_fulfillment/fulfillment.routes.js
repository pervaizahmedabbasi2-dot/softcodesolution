import express from 'express';

export function createFulfillmentRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/pick-queue', (req, res) => {
    res.json({
      ok: true,
      queue: [
        { id: 'pick-1', orderRef: 'ORD-ECOMM-9901', itemsCount: 4, aisleBin: 'A-12-04', picker: 'Tariq Mehmood', status: 'PICKING' },
        { id: 'pick-2', orderRef: 'ORD-ECOMM-9902', itemsCount: 2, aisleBin: 'B-03-01', picker: 'Faisal Shah', status: 'PACKED' }
      ]
    });
  });

  return router;
}
