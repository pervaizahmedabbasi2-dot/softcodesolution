import express from 'express';

export function createPropertyRouter(sqliteDb, db, memorySeedData) {
  const router = express.Router();
  const { PROPERTIES_LIST, PROPERTY_LEASES, PROPERTY_MAINTENANCE, PROPERTY_RENT_LEDGER } = memorySeedData;

  router.get('/properties', (req, res) => {
    res.json({ ok: true, properties: PROPERTIES_LIST });
  });

  router.post('/properties', (req, res) => {
    const p = req.body || {};
    const newProp = {
      id: 'prop-' + Date.now(),
      code: 'PRP-' + Math.floor(100 + Math.random() * 900),
      title: p.title || 'New Real Estate Property',
      type: p.type || 'Residential Apartment',
      address: p.address || 'Central Prime Location',
      areaSqFt: Number(p.areaSqFt || 1200),
      bedrooms: Number(p.bedrooms || 2),
      bathrooms: Number(p.bathrooms || 2),
      monthlyRent: Number(p.monthlyRent || 1500),
      salePrice: Number(p.salePrice || 250000),
      status: p.status || 'AVAILABLE',
      tenant: p.tenant || 'None',
      amenities: p.amenities || ['Parking', 'Security']
    };
    PROPERTIES_LIST.unshift(newProp);
    res.json({ ok: true, message: 'Property listing created', property: newProp });
  });

  router.get('/leases', (req, res) => {
    res.json({ ok: true, leases: PROPERTY_LEASES });
  });

  router.get('/maintenance', (req, res) => {
    res.json({ ok: true, maintenance: PROPERTY_MAINTENANCE });
  });

  router.get('/rent-ledger', (req, res) => {
    res.json({ ok: true, ledger: PROPERTY_RENT_LEDGER });
  });

  return router;
}
