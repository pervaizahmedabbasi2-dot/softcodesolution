import express from 'express';

export const PROPERTIES_LIST = [
  { id: 'prop-1', code: 'PRP-101', title: 'Emerald Heights - Luxury Penthouse 14B', type: 'Residential Apartment', address: 'Block 4, Clifton, Karachi', areaSqFt: 2850, bedrooms: 4, bathrooms: 4, monthlyRent: 2400.00, salePrice: 450000.00, status: 'RENTED', tenant: 'Kareem Mansoor', amenities: ['Central AC', 'Covered Parking', 'Sea View', 'Gym'] },
  { id: 'prop-2', code: 'PRP-102', title: 'Silver Oak Commercial Plaza - Floor 3', type: 'Commercial Office', address: 'Blue Area, Islamabad', areaSqFt: 4200, bedrooms: 0, bathrooms: 6, monthlyRent: 4800.00, salePrice: 850000.00, status: 'AVAILABLE', tenant: 'None', amenities: ['High Speed Elevators', 'Backup Generator', 'Fiber Optic', 'Fire Safety'] },
  { id: 'prop-3', code: 'PRP-103', title: 'Sunset Palm Executive Villa #8', type: 'Residential Villa', address: 'Phase 6, DHA, Lahore', areaSqFt: 5400, bedrooms: 5, bathrooms: 6, monthlyRent: 3800.00, salePrice: 720000.00, status: 'RENTED', tenant: 'Sarah Al-Mansoor', amenities: ['Private Pool', 'Lawn', 'Solar System', 'Guard Room'] },
  { id: 'prop-4', code: 'PRP-104', title: 'Metro Retail Boulevard Shop #12', type: 'Retail Storefront', address: 'Main Boulevard, Gulberg, Lahore', areaSqFt: 1450, bedrooms: 0, bathrooms: 1, monthlyRent: 1950.00, salePrice: 320000.00, status: 'AVAILABLE', tenant: 'None', amenities: ['Glass Facade', 'Heavy Footfall', 'Basement Storage'] },
  { id: 'prop-5', code: 'PRP-105', title: 'Al-Noor Tower Studio Unit 604', type: 'Studio Apartment', address: 'E-11/2, Islamabad', areaSqFt: 680, bedrooms: 1, bathrooms: 1, monthlyRent: 650.00, salePrice: 95000.00, status: 'MAINTENANCE', tenant: 'Pending Renovation', amenities: ['Furnished', 'Balcony', 'Secure Access'] }
];

export const PROPERTY_LEASES = [
  { id: 'lse-1', leaseNo: 'LSE-2026-091', propertyId: 'prop-1', propertyTitle: 'Emerald Heights 14B', tenantName: 'Kareem Mansoor', tenantEmail: 'kareem@mansoorgroup.com', tenantPhone: '+92 300 5566778', monthlyRent: 2400.00, depositHeld: 4800.00, startDate: '2025-06-01', endDate: '2026-06-01', status: 'ACTIVE', paymentCycle: 'Monthly' },
  { id: 'lse-2', leaseNo: 'LSE-2026-092', propertyId: 'prop-3', propertyTitle: 'Sunset Palm Villa #8', tenantName: 'Sarah Al-Mansoor', tenantEmail: 'sarah.mansoor@gulf.ae', tenantPhone: '+971 50 1234567', monthlyRent: 3800.00, depositHeld: 7600.00, startDate: '2025-01-01', endDate: '2026-01-01', status: 'EXPIRING_SOON', paymentCycle: 'Quarterly' }
];

export const PROPERTY_MAINTENANCE = [
  { id: 'mnt-1', ticketNo: 'TKT-881', property: 'Emerald Heights 14B', issue: 'Master Bedroom AC cooling leak', priority: 'HIGH', status: 'IN_PROGRESS', reportedBy: 'Kareem Mansoor', assignedContractor: 'Apex HVAC Services', date: '2026-03-24' },
  { id: 'mnt-2', ticketNo: 'TKT-882', property: 'Silver Oak Commercial Floor 3', issue: 'Main entrance electronic glass door sensor', priority: 'MEDIUM', status: 'OPEN', reportedBy: 'Building Manager', assignedContractor: 'Pending Dispatch', date: '2026-03-26' },
  { id: 'mnt-3', ticketNo: 'TKT-883', property: 'Al-Noor Tower Unit 604', issue: 'Washroom plumbing drainage overhaul', priority: 'HIGH', status: 'IN_PROGRESS', reportedBy: 'Unit Inspector', assignedContractor: 'Master Plumbers Ltd', date: '2026-03-22' }
];

export const PROPERTY_RENT_LEDGER = [
  { id: 'led-1', invoiceNo: 'RENT-2026-031', property: 'Emerald Heights 14B', tenant: 'Kareem Mansoor', month: 'March 2026', amount: 2400.00, status: 'PAID', paidDate: '2026-03-03', receiptUrl: '#' },
  { id: 'led-2', invoiceNo: 'RENT-2026-032', property: 'Sunset Palm Villa #8', tenant: 'Sarah Al-Mansoor', month: 'March 2026', amount: 3800.00, status: 'PAID', paidDate: '2026-03-05', receiptUrl: '#' },
  { id: 'led-3', invoiceNo: 'RENT-2026-033', property: 'Metro Retail Shop #12', tenant: 'Pending Lease', month: 'March 2026', amount: 1950.00, status: 'VACANT', paidDate: '-', receiptUrl: '#' }
];

export const REALTY_LISTINGS = [
  { id: 'rea-1', code: 'PLT-DHA-104', title: '1 Kanal Residential Plot - Phase 6 Boulevard', society: 'DHA Phase 6', city: 'Lahore', category: 'Plot', price: 145000.00, installmentOption: true, downPayment: 35000.00, monthlyInstallment: 3000.00, status: 'AVAILABLE' },
  { id: 'rea-2', code: 'COM-BHR-208', title: 'Commercial Plaza Ground Floor 1200 SqFt', society: 'Bahria Town Civic Center', city: 'Islamabad', category: 'Commercial', price: 210000.00, installmentOption: false, downPayment: 210000.00, monthlyInstallment: 0, status: 'UNDER_OFFER' },
  { id: 'rea-3', code: 'APT-EMA-301', title: '3-Bed Luxury Seafront Penthouse', society: 'Emaar Oceanfront Crescent Bay', city: 'Karachi', category: 'Apartment', price: 320000.00, installmentOption: true, downPayment: 80000.00, monthlyInstallment: 5500.00, status: 'AVAILABLE' }
];

export const REALTY_INSTALLMENT_FILES = [
  { id: 'fil-1', fileNo: 'FL-2026-9901', investor: 'Chaudhry Pervaiz', property: '1 Kanal Residential Plot - DHA Phase 6', totalAmount: 145000.00, paidAmount: 85000.00, nextDue: '2026-04-10', monthlyAmount: 3000.00, status: 'ON_SCHEDULE' },
  { id: 'fil-2', fileNo: 'FL-2026-9902', investor: 'Dr. Shahzad Afzal', property: '3-Bed Luxury Seafront Penthouse - Emaar', totalAmount: 320000.00, paidAmount: 160000.00, nextDue: '2026-04-15', monthlyAmount: 5500.00, status: 'ON_SCHEDULE' }
];

export function createPropertyRouter(sqliteDb, db, memorySeedData) {
  const router = express.Router();
  const list = (memorySeedData && memorySeedData.PROPERTIES_LIST) || PROPERTIES_LIST;
  const leases = (memorySeedData && memorySeedData.PROPERTY_LEASES) || PROPERTY_LEASES;
  const maintenance = (memorySeedData && memorySeedData.PROPERTY_MAINTENANCE) || PROPERTY_MAINTENANCE;
  const ledger = (memorySeedData && memorySeedData.PROPERTY_RENT_LEDGER) || PROPERTY_RENT_LEDGER;

  router.get(['/', '/properties'], (req, res) => {
    res.json({ ok: true, properties: list });
  });

  router.post(['/', '/properties'], (req, res) => {
    const p = req.body || {};
    const newProp = {
      id: 'prop-' + Date.now(),
      code: 'PRP-' + Math.floor(100 + Math.random() * 900),
      title: p.title || 'New Property Unit',
      type: p.type || 'Residential Apartment',
      address: p.address || 'Central City Location',
      areaSqFt: Number(p.areaSqFt || 1200),
      bedrooms: Number(p.bedrooms || 2),
      bathrooms: Number(p.bathrooms || 2),
      monthlyRent: Number(p.monthlyRent || 1500),
      salePrice: Number(p.salePrice || 250000),
      status: p.status || 'AVAILABLE',
      tenant: p.tenant || 'None',
      amenities: p.amenities || ['Parking', 'Security']
    };
    list.unshift(newProp);
    res.json({ ok: true, message: 'Property added successfully', property: newProp });
  });

  router.get('/leases', (req, res) => {
    res.json({ ok: true, leases });
  });

  router.post('/leases', (req, res) => {
    const l = req.body || {};
    const newLease = {
      id: 'lse-' + Date.now(),
      leaseNo: 'LSE-2026-' + Math.floor(100 + Math.random() * 900),
      propertyId: l.propertyId || 'prop-1',
      propertyTitle: l.propertyTitle || 'Property Unit',
      tenantName: l.tenantName || 'New Tenant',
      tenantEmail: l.tenantEmail || '',
      tenantPhone: l.tenantPhone || '',
      monthlyRent: Number(l.monthlyRent || 1000),
      depositHeld: Number(l.depositHeld || 2000),
      startDate: l.startDate || new Date().toISOString().split('T')[0],
      endDate: l.endDate || '2027-01-01',
      status: 'ACTIVE',
      paymentCycle: l.paymentCycle || 'Monthly'
    };
    leases.unshift(newLease);
    res.json({ ok: true, message: 'Lease agreement created', lease: newLease });
  });

  router.get('/maintenance', (req, res) => {
    res.json({ ok: true, tickets: maintenance, maintenance });
  });

  router.post('/maintenance', (req, res) => {
    const m = req.body || {};
    const newTicket = {
      id: 'mnt-' + Date.now(),
      ticketNo: 'TKT-' + Math.floor(100 + Math.random() * 900),
      property: m.property || 'Property Unit',
      issue: m.issue || 'Maintenance issue',
      priority: m.priority || 'MEDIUM',
      status: 'OPEN',
      reportedBy: m.reportedBy || 'Tenant',
      assignedContractor: m.assignedContractor || 'Pending Assignment',
      date: new Date().toISOString().split('T')[0]
    };
    maintenance.unshift(newTicket);
    res.json({ ok: true, message: 'Maintenance ticket lodged', ticket: newTicket });
  });

  router.post('/maintenance/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const ticket = maintenance.find(t => t.id === id);
    if (ticket) {
      ticket.status = status;
      return res.json({ ok: true, message: `Ticket status updated to ${status}`, ticket });
    }
    res.status(404).json({ ok: false, message: 'Ticket not found' });
  });

  router.get(['/payments', '/rent-ledger'], (req, res) => {
    res.json({ ok: true, payments: ledger, ledger });
  });

  router.post('/payments', (req, res) => {
    const p = req.body || {};
    const newPayment = {
      id: 'led-' + Date.now(),
      invoiceNo: 'RENT-2026-' + Math.floor(100 + Math.random() * 900),
      property: p.property || 'Property Unit',
      tenant: p.tenant || 'Tenant',
      month: p.month || 'Current Month',
      amount: Number(p.amount || 0),
      status: 'PAID',
      paidDate: new Date().toISOString().split('T')[0],
      receiptUrl: '#'
    };
    ledger.unshift(newPayment);
    res.json({ ok: true, message: 'Rent payment recorded', payment: newPayment });
  });

  return router;
}
