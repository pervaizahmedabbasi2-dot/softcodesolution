import express from 'express';

export function createNgoRouter(sqliteDb, db, getCampaigns, getDonations) {
  const router = express.Router();

  router.get('/campaigns', (req, res) => {
    res.json({ ok: true, campaigns: getCampaigns ? getCampaigns() : [] });
  });

  router.get('/donations', (req, res) => {
    res.json({ ok: true, donations: getDonations ? getDonations() : [] });
  });

  return router;
}
