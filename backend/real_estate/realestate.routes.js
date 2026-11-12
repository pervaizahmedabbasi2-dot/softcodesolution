import express from 'express';
import { PROPERTIES_LIST, PROPERTY_LEASES, REALTY_LISTINGS, REALTY_INSTALLMENT_FILES } from './property.routes.js';

export function createRealEstateRouter(sqliteDb, db, getPropertiesData, getAgreementsData) {
  const router = express.Router();

  router.get('/properties', (req, res) => {
    res.json({ ok: true, properties: getPropertiesData ? getPropertiesData() : PROPERTIES_LIST });
  });

  router.get('/agreements', (req, res) => {
    res.json({ ok: true, agreements: getAgreementsData ? getAgreementsData() : PROPERTY_LEASES });
  });

  router.get('/listings', (req, res) => {
    res.json({ ok: true, listings: REALTY_LISTINGS });
  });

  router.post('/listings', (req, res) => {
    const r = req.body || {};
    const newListing = {
      id: 'rea-' + Date.now(),
      code: 'PLT-' + Math.floor(100 + Math.random() * 900),
      title: r.title || 'Prime Real Estate Property',
      society: r.society || 'Exclusive Society',
      city: r.city || 'Islamabad',
      category: r.category || 'Plot',
      price: Number(r.price || 100000.0),
      installmentOption: !!r.installmentOption,
      downPayment: Number(r.downPayment || 20000.0),
      monthlyInstallment: Number(r.monthlyInstallment || 2500.0),
      status: 'AVAILABLE'
    };
    REALTY_LISTINGS.unshift(newListing);
    res.json({ ok: true, listing: newListing });
  });

  router.get('/installments', (req, res) => {
    res.json({ ok: true, installments: REALTY_INSTALLMENT_FILES });
  });

  return router;
}
