import express from 'express';

export function createMediaRouter(sqliteDb, db) {
  const router = express.Router();
  router.get('/shoots', (req, res) => {
    res.json({
      ok: true,
      shoots: [
        { id: 'sht-1', client: 'Luxe Fashion Line', type: 'Studio Catalog Shoot', photographer: 'Zain Studio', deliverable: '4K Raw & Edited Photos', status: 'EDITING' },
        { id: 'sht-2', client: 'Tech Summit 2026', type: 'Live Event Coverage', photographer: 'Sarah Visuals', deliverable: 'Full Highlight Reel', status: 'DELIVERED' }
      ]
    });
  });
  return router;
}
