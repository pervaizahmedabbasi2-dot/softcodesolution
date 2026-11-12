import express from 'express';

export const NGO_CAMPAIGNS = [
  { id: 'cmp-1', code: 'RELIEF-2026-01', title: 'Ramadan Ration Pack Drive', targetAmount: 50000, raisedAmount: 38450, beneficiariesCount: 1200, category: 'Food Relief', status: 'ACTIVE', location: 'Sindh & Balochistan' },
  { id: 'cmp-2', code: 'RELIEF-2026-02', title: 'Clean Water Solar Wells', targetAmount: 30000, raisedAmount: 29100, beneficiariesCount: 850, category: 'Water Sanitation', status: 'ACTIVE', location: 'Tharparkar Desert' },
  { id: 'cmp-3', code: 'RELIEF-2026-03', title: 'Orphan Education Sponsorship', targetAmount: 25000, raisedAmount: 18200, beneficiariesCount: 150, category: 'Education', status: 'ACTIVE', location: 'Nationwide' },
  { id: 'cmp-4', code: 'RELIEF-2026-04', title: 'Mobile Medical Camps & Eye Care', targetAmount: 15000, raisedAmount: 15000, beneficiariesCount: 2200, category: 'Healthcare', status: 'COMPLETED', location: 'KPK Rural Districts' }
];

export const NGO_DONATIONS = [
  { id: 'don-1', receiptNo: 'DON-2026-901', donorName: 'Malik Faisal', amount: 2500.00, campaign: 'Ramadan Ration Pack Drive', type: 'Zakat', paymentMethod: 'Bank Wire', date: '2026-03-24' },
  { id: 'don-2', receiptNo: 'DON-2026-902', donorName: 'Anonymous Donor', amount: 500.00, campaign: 'Clean Water Solar Wells', type: 'Sadaqah Jariyah', paymentMethod: 'Card Online', date: '2026-03-25' },
  { id: 'don-3', receiptNo: 'DON-2026-903', donorName: 'Horizon Overseas Trust', amount: 10000.00, campaign: 'Orphan Education Sponsorship', type: 'General Grant', paymentMethod: 'Wire Transfer', date: '2026-03-22' }
];

export const NGO_BENEFICIARIES = [
  { id: 'ben-1', regNo: 'BEN-441', familyHead: 'Nazeer Ahmed', dependents: 6, cnic: '42101-1234567-1', aidReceived: 'Monthly Ration Pack (Box #24)', location: 'District Badin', status: 'DISTRIBUTED' },
  { id: 'ben-2', regNo: 'BEN-442', familyHead: 'Khadija Bibi (Widow)', dependents: 4, cnic: '42201-9876543-2', aidReceived: 'Education stipend + Clothing kit', location: 'Mithi, Tharparkar', status: 'DISTRIBUTED' },
  { id: 'ben-3', regNo: 'BEN-443', familyHead: 'Muhammad Ramzan', dependents: 8, cnic: '42301-4455667-3', aidReceived: 'Emergency medical aid voucher', location: 'Dadu, Sindh', status: 'PENDING_VERIFICATION' }
];

export function createNgoRouter(sqliteDb, db, getCampaigns, getDonations) {
  const router = express.Router();
  const campaigns = () => (getCampaigns ? getCampaigns() : NGO_CAMPAIGNS);
  const donations = () => (getDonations ? getDonations() : NGO_DONATIONS);

  router.get('/campaigns', (req, res) => {
    res.json({ ok: true, campaigns: campaigns() });
  });

  router.post('/campaigns', (req, res) => {
    const c = req.body || {};
    const list = campaigns();
    const newCmp = {
      id: 'cmp-' + Date.now(),
      code: 'RELIEF-2026-' + String(list.length + 1).padStart(2, '0'),
      title: c.title || 'New Relief Campaign',
      targetAmount: Number(c.targetAmount || 10000),
      raisedAmount: 0,
      beneficiariesCount: Number(c.beneficiariesCount || 100),
      category: c.category || 'General Aid',
      status: 'ACTIVE',
      location: c.location || 'Rural Region'
    };
    list.unshift(newCmp);
    res.json({ ok: true, message: 'Relief campaign launched', campaign: newCmp });
  });

  router.get('/donations', (req, res) => {
    res.json({ ok: true, donations: donations() });
  });

  router.post('/donations', (req, res) => {
    const d = req.body || {};
    const newDonation = {
      id: 'don-' + Date.now(),
      receiptNo: 'DON-2026-' + Math.floor(100 + Math.random() * 900),
      donorName: d.donorName || 'Anonymous Donor',
      amount: Number(d.amount || 100),
      campaign: d.campaign || 'General Relief',
      type: d.type || 'Sadaqah',
      paymentMethod: d.paymentMethod || 'Online',
      date: new Date().toISOString().split('T')[0]
    };
    donations().unshift(newDonation);
    const cmp = campaigns().find(c => c.title === d.campaign);
    if (cmp) cmp.raisedAmount += newDonation.amount;
    res.json({ ok: true, message: 'Donation credited & receipt issued', donation: newDonation });
  });

  router.get('/beneficiaries', (req, res) => {
    res.json({ ok: true, beneficiaries: NGO_BENEFICIARIES });
  });

  return router;
}
