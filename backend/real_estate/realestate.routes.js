import express from 'express';

export function createRealEstateRouter(sqliteDb, db, getPropertiesData, getAgreementsData) {
  const router = express.Router();

  router.get('/properties', (req, res) => {
    res.json({ ok: true, properties: getPropertiesData ? getPropertiesData() : [] });
  });

  router.get('/agreements', (req, res) => {
    res.json({ ok: true, agreements: getAgreementsData ? getAgreementsData() : [] });
  });

  return router;
}
