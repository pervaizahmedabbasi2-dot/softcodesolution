import express from 'express';

export function createConstructionRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/projects', (req, res) => {
    res.json({
      ok: true,
      projects: [
        { id: 'proj-1', code: 'PRJ-2026-08', title: 'Al-Haram Commercial Tower', site: 'Clifton Block 2', completion: '68%', budgetUSD: 4500000, engineer: 'Engr. Rashid', status: 'IN_PROGRESS' },
        { id: 'proj-2', code: 'PRJ-2026-09', title: 'Margalla Valley Highway Flyover', site: 'Sector G-13', completion: '92%', budgetUSD: 8200000, engineer: 'Engr. Bilal', status: 'FINAL_FINISHING' }
      ]
    });
  });

  return router;
}
