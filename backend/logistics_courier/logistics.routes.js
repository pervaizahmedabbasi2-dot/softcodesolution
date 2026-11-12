import express from 'express';

export function createLogisticsRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/shipments', (req, res) => {
    res.json({
      ok: true,
      shipments: [
        { id: 'shp-1', trackingNo: 'TRK-2026-9901', origin: 'Karachi Port', destination: 'Lahore Hub', driver: 'Nasir Khan', status: 'IN_TRANSIT', eta: 'Tonight 11:00 PM' },
        { id: 'shp-2', trackingNo: 'TRK-2026-9902', origin: 'Islamabad Express', destination: 'Faisalabad Mart', driver: 'Imran Gul', status: 'DELIVERED', eta: 'Completed' }
      ]
    });
  });

  return router;
}
