import express from 'express';

export const CARGO_SHIPMENTS = [
  { id: 'crg-1', trackingNo: 'EXP-PK-994102', sender: 'Karachi Wholesale Hub', consignee: 'Mustafa Electronics (Lahore)', origin: 'Karachi Port', destination: 'Lahore Central', weightKg: 12.5, codAmount: 420.00, rider: 'Rider Kashif (Bike 08)', status: 'IN_TRANSIT', bookedDate: '2026-03-26' },
  { id: 'crg-2', trackingNo: 'EXP-PK-994103', sender: 'Islamabad Medical Store', consignee: 'Dr. Zafar Clinic (Rawalpindi)', origin: 'Islamabad F-10', destination: 'Rawalpindi Saddar', weightKg: 2.1, codAmount: 85.00, rider: 'Rider Waqar (Van 02)', status: 'OUT_FOR_DELIVERY', bookedDate: '2026-03-27' },
  { id: 'crg-3', trackingNo: 'EXP-PK-994104', sender: 'Sialkot Surgical Instruments', consignee: 'Airport Cargo Terminal UK', origin: 'Sialkot S.I.E', destination: 'Heathrow London', weightKg: 65.0, codAmount: 0.00, rider: 'Freight Carrier Flight 701', status: 'DELIVERED', bookedDate: '2026-03-24' }
];

export function createLogisticsRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/shipments', (req, res) => {
    res.json({ ok: true, shipments: CARGO_SHIPMENTS });
  });

  router.post('/shipments', (req, res) => {
    const s = req.body || {};
    const newShipment = {
      id: 'crg-' + Date.now(),
      trackingNo: 'EXP-PK-' + Math.floor(100000 + Math.random() * 900000),
      sender: s.sender || 'Origin Shipper',
      consignee: s.consignee || 'Destination Recipient',
      origin: s.origin || 'Karachi Hub',
      destination: s.destination || 'Lahore Hub',
      weightKg: Number(s.weightKg || 1.5),
      codAmount: Number(s.codAmount || 0.0),
      rider: s.rider || 'Unassigned / Sorting Hub',
      status: 'BOOKED',
      bookedDate: new Date().toISOString().split('T')[0]
    };
    CARGO_SHIPMENTS.unshift(newShipment);
    res.json({ ok: true, shipment: newShipment });
  });

  router.post('/shipments/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const s = CARGO_SHIPMENTS.find(shp => shp.id === id);
    if (s) {
      s.status = status;
      return res.json({ ok: true, shipment: s });
    }
    res.status(404).json({ ok: false });
  });

  return router;
}
