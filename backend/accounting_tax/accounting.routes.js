import express from 'express';

export function createAccountingRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/vouchers', (req, res) => {
    res.json({
      ok: true,
      vouchers: [
        { id: 'jv-1', voucherNo: 'JV-2026-101', account: 'Cash at Bank - Meezan', debit: 45000, credit: 0, nar: 'Monthly Software Subscriptions', date: '2026-03-27' },
        { id: 'jv-2', voucherNo: 'JV-2026-102', account: 'Accounts Payable - Cloud Hosting', debit: 0, credit: 45000, nar: 'Server Infrastructure Provisioning', date: '2026-03-27' }
      ]
    });
  });

  return router;
}
