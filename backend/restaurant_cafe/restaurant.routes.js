import express from 'express';

export function createRestaurantRouter(sqliteDb, db, getTablesData, getMenuData, getKdsData) {
  const router = express.Router();

  router.get('/tables', (req, res) => {
    res.json({ ok: true, tables: getTablesData ? getTablesData() : [] });
  });

  router.get('/menu', (req, res) => {
    res.json({ ok: true, menu: getMenuData ? getMenuData() : [] });
  });

  router.get('/kds', (req, res) => {
    res.json({ ok: true, tickets: getKdsData ? getKdsData() : [] });
  });

  return router;
}
