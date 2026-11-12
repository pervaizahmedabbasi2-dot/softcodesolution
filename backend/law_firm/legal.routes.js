import express from 'express';

export const LEGAL_CASES = [
  { id: 'law-1', caseNo: 'WP-2026-9041', title: 'Apex Industrial Corp vs. State Revenue', court: 'High Court Commercial Division', judge: 'Justice M. I. Siddiqui', advocate: 'Barrister Shahrukh', stage: 'Final Arguments', hearingDate: '2026-04-02', retainer: 3500.00, status: 'ACTIVE' },
  { id: 'law-2', caseNo: 'CRA-2026-118', title: 'Tariq Property Trust vs. City Authority', court: 'District Civil Court Room 4', judge: 'Judge R. A. Malik', advocate: 'Advocate Farzana', stage: 'Cross Examination', hearingDate: '2026-03-31', retainer: 1800.00, status: 'ACTIVE' },
  { id: 'law-3', caseNo: 'ARB-2026-022', title: 'Global Logistics Contract Arbitration', court: 'Chamber Arbitration Tribunal', judge: 'Arbitrator S. K. Lodhi', advocate: 'Senior Counsel Danial', stage: 'Evidence Submission', hearingDate: '2026-04-12', retainer: 5000.00, status: 'SCHEDULED' }
];

export function createLegalRouter(sqliteDb, db, getCases) {
  const router = express.Router();
  const cases = () => (getCases ? getCases() : LEGAL_CASES);

  router.get('/cases', (req, res) => {
    res.json({ ok: true, cases: cases() });
  });

  router.post('/cases', (req, res) => {
    const c = req.body || {};
    const newCase = {
      id: 'law-' + Date.now(),
      caseNo: c.caseNo || 'CA-2026-' + Math.floor(1000 + Math.random() * 9000),
      title: c.title || 'Legal Matter',
      court: c.court || 'High Court of Justice',
      judge: c.judge || 'Bench President',
      advocate: c.advocate || 'Lead Advocate',
      stage: c.stage || 'Initial Hearing',
      hearingDate: c.hearingDate || '2026-04-15',
      retainer: Number(c.retainer || 2000.0),
      status: 'ACTIVE'
    };
    cases().unshift(newCase);
    res.json({ ok: true, legalCase: newCase });
  });

  return router;
}
