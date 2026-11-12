import express from 'express';

export function createVeterinaryRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/pets', (req, res) => {
    res.json({
      ok: true,
      pets: [
        { id: 'pet-1', petName: 'Leo (German Shepherd)', owner: 'Kamran Ali', breed: 'Canine', ageYears: 3, vaccinationStatus: 'UP_TO_DATE', lastCheckup: '2026-03-15' },
        { id: 'pet-2', petName: 'Milo (Persian Cat)', owner: 'Zainab Bibi', breed: 'Feline', ageYears: 1.5, vaccinationStatus: 'BOOSTER_DUE', lastCheckup: '2026-03-20' }
      ]
    });
  });

  return router;
}
