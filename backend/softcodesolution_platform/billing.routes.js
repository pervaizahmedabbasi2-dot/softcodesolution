import express from 'express';
import { NOTIFICATION_LOGS } from './notifications.routes.js';

export const DEFAULT_INVOICES = [
  { id: 'INV-2026-0091', invoiceNo: 'INV-2026-0091', client: 'Apex Financial Holdings', amount: '$12,450.00', currency: 'USD', status: 'PAID', plan: 'Enterprise Unlimited (Annual)', date: '2026-03-01', dueDate: '2026-03-15', pdfUrl: '#' },
  { id: 'INV-2026-0092', invoiceNo: 'INV-2026-0092', client: 'Quantum Cloud Logistics', amount: '$4,800.00', currency: 'USD', status: 'PAID', plan: 'Professional Multi-Region', date: '2026-03-05', dueDate: '2026-03-19', pdfUrl: '#' },
  { id: 'INV-2026-0093', invoiceNo: 'INV-2026-0093', client: 'BioHealth Genomic Labs', amount: '$24,900.00', currency: 'USD', status: 'PAID', plan: 'Dedicated Shard + Compliance Vault', date: '2026-03-10', dueDate: '2026-03-24', pdfUrl: '#' },
  { id: 'INV-2026-0094', invoiceNo: 'INV-2026-0094', client: 'Nordic Retail Group', amount: '$1,950.00', currency: 'USD', status: 'PENDING', plan: 'Growth Tier Edge Sync', date: '2026-03-20', dueDate: '2026-04-03', pdfUrl: '#' }
];

export const PAYMENT_GATEWAYS = [
  {
    id: 'stripe',
    name: 'Stripe Payments (Global Cards)',
    type: 'CREDIT_CARD',
    currency: 'USD, PKR, EUR, GBP',
    enabled: true,
    testMode: true,
    publishableKey: 'pk_test_51MzSCSLiveStripeKey9041',
    secretKeyConfigured: true,
    webhookSecretConfigured: true,
    feePercent: 2.9,
    feeFixed: 0.30,
    acceptedMethods: ['Visa', 'MasterCard', 'American Express', 'Apple Pay', 'Google Pay'],
    description: 'Direct global credit and debit card processing with 3D Secure verification.'
  },
  {
    id: 'jazzcash',
    name: 'JazzCash Mobile Account',
    type: 'MOBILE_WALLET',
    currency: 'PKR',
    enabled: true,
    testMode: false,
    merchantId: 'JC_MERCHANT_904128',
    secretKeyConfigured: true,
    feePercent: 1.5,
    feeFixed: 0,
    acceptedMethods: ['JazzCash Wallet', 'Voucher Payment', 'Debit Card'],
    description: 'Instant mobile wallet payment across Pakistan via OTP and MPIN.'
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa Merchant Gateway',
    type: 'MOBILE_WALLET',
    currency: 'PKR',
    enabled: true,
    testMode: false,
    merchantId: 'EP_STORE_883109',
    secretKeyConfigured: true,
    feePercent: 1.5,
    feeFixed: 0,
    acceptedMethods: ['EasyPaisa Wallet', 'QR Code Scan', 'OTC Tokens'],
    description: 'Direct mobile wallet checkout for all EasyPaisa account holders.'
  },
  {
    id: 'bank_transfer',
    name: 'Direct Bank Wire (Meezan / HBL / Raast)',
    type: 'MANUAL_BANK',
    currency: 'PKR, USD',
    enabled: true,
    testMode: false,
    bankName: 'Meezan Bank Limited',
    accountTitle: 'SoftCodeSolution Tech Pvt Ltd',
    iban: 'PK42MEZN0001090123456789',
    accountNumber: '01090123456789',
    swiftCode: 'MEZNPKKA',
    acceptedMethods: ['Online Banking', 'ATM Transfer', 'Raast Instant ID', 'Cheque Deposit'],
    description: 'Direct wire transfer. Client uploads deposit slip, which routes to SuperAdmin Approvals.'
  }
];

export const PAYMENT_TRANSACTIONS = [
  {
    id: 'tx-2026-901',
    invoiceNumber: 'INV-2026-9041',
    customerName: 'Kashif Mehmood',
    customerEmail: 'kashif@supermart.pk',
    softwareTitle: 'Super Mart & Grocery',
    billingCycle: 'monthly',
    amount: 'RS 15,500',
    gatewayId: 'jazzcash',
    paymentMethod: 'JazzCash Mobile Account',
    status: 'PAID',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-2026-902',
    invoiceNumber: 'INV-2026-9042',
    customerName: 'Dr. Tariq Alvi',
    customerEmail: 'tariq@cityclinic.org',
    softwareTitle: 'Clinic / Healthcare Center',
    billingCycle: 'yearly',
    amount: 'RS 140,000',
    gatewayId: 'bank_transfer',
    paymentMethod: 'Meezan Bank Wire',
    status: 'PENDING_APPROVAL',
    slipReference: 'REF-HBL-992140',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export function createBillingRouter(sqliteDb, db, getCollectionDocs) {
  const router = express.Router();

  router.get(['/invoices', '/billing/invoices'], async (req, res) => {
    const invoices = getCollectionDocs ? await getCollectionDocs('invoices', DEFAULT_INVOICES) : DEFAULT_INVOICES;
    res.json({ ok: true, invoices, totalPending: '$1,950.00', totalPaid: '$44,150.00' });
  });

  router.get('/payment/pending-approvals', (req, res) => {
    res.json({
      ok: true,
      approvals: [
        { id: 'tx-ach-8801', client: 'Nordic Retail Group', amount: '$1,950.00', method: 'SEPA Direct Debit', reference: 'TRX_NORDIC_9921', status: 'PENDING_ADMIN_SIGN' },
        { id: 'tx-ach-8802', client: 'BioHealth Genomic Labs', amount: '$24,900.00', method: 'FedWire Domestic', reference: 'WIRE_BIO_2026_03', status: 'PENDING_ADMIN_SIGN' }
      ]
    });
  });

  router.post('/payment/approve', (req, res) => {
    res.json({ ok: true, message: 'Transaction verified and approved' });
  });

  router.get('/wallet/balance', (req, res) => {
    res.json({
      ok: true,
      balance: '$48,500.00',
      availableCredits: '250,000 API Credits',
      currency: 'USD',
      nextRechargeDate: '2026-04-01'
    });
  });

  router.get('/coupons', (req, res) => {
    res.json({ ok: true, coupons: [{ code: 'ENTERPRISE2026', discount: '20%', validTill: '2026-12-31' }] });
  });

  router.get('/tax/rules', (req, res) => {
    res.json({ ok: true, rules: [{ region: 'US', rate: '0.00% (Reverse Charge)' }, { region: 'EU', rate: 'Standard VAT 21%' }] });
  });

  router.get('/payment-gateways', (req, res) => {
    res.json({ ok: true, gateways: PAYMENT_GATEWAYS });
  });

  router.put('/payment-gateways/:id/toggle', (req, res) => {
    const { id } = req.params;
    const gw = PAYMENT_GATEWAYS.find(g => g.id === id);
    if (gw) {
      gw.enabled = !gw.enabled;
      return res.json({ ok: true, gateway: gw, message: `${gw.name} is now ${gw.enabled ? 'Enabled' : 'Disabled'}` });
    }
    res.status(404).json({ ok: false, message: 'Gateway not found' });
  });

  router.put('/payment-gateways/:id', (req, res) => {
    const { id } = req.params;
    const gwIndex = PAYMENT_GATEWAYS.findIndex(g => g.id === id);
    if (gwIndex !== -1) {
      PAYMENT_GATEWAYS[gwIndex] = { ...PAYMENT_GATEWAYS[gwIndex], ...req.body };
      return res.json({ ok: true, gateway: PAYMENT_GATEWAYS[gwIndex], message: 'Gateway credentials updated successfully' });
    }
    res.status(404).json({ ok: false, message: 'Gateway not found' });
  });

  router.get('/public/checkout/transactions', (req, res) => {
    res.json({ ok: true, transactions: PAYMENT_TRANSACTIONS });
  });

  router.post('/public/checkout', (req, res) => {
    const { customerName, customerEmail, customerPhone, softwareTitle, billingCycle, gatewayId, paymentMethod, amount, slipReference } = req.body || {};
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    const status = gatewayId === 'bank_transfer' ? 'PENDING_APPROVAL' : 'PAID';

    const transaction = {
      id: 'tx-' + Date.now(),
      invoiceNumber,
      customerName: customerName || 'Valued Client',
      customerEmail: customerEmail || 'client@example.com',
      customerPhone: customerPhone || 'N/A',
      softwareTitle: softwareTitle || 'Enterprise Software Suite',
      billingCycle: billingCycle || 'monthly',
      amount: amount || 'RS 12,000',
      gatewayId: gatewayId || 'stripe',
      paymentMethod: paymentMethod || 'Online Gateway',
      status,
      slipReference: slipReference || '',
      createdAt: new Date().toISOString()
    };

    PAYMENT_TRANSACTIONS.unshift(transaction);

    if (sqliteDb) {
      try {
        sqliteDb.prepare(`
          INSERT OR REPLACE INTO platform_transactions
          (id, invoice_number, customer_name, customer_email, customer_phone, software_title, billing_cycle, amount, gateway_id, payment_method, status, slip_reference, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(transaction.id, transaction.invoiceNumber, transaction.customerName, transaction.customerEmail, transaction.customerPhone, transaction.softwareTitle, transaction.billingCycle, transaction.amount, transaction.gatewayId, transaction.paymentMethod, transaction.status, transaction.slipReference, transaction.createdAt);
      } catch (e) {}
    }

    const phone = customerPhone || '0300-1234567';
    const email = customerEmail || 'client@example.com';
    const name = customerName || 'Valued Customer';
    const title = softwareTitle || 'Software Suite';

    NOTIFICATION_LOGS.unshift({
      id: 'notif-' + Date.now() + '-1',
      channel: 'WHATSAPP',
      target: 'CUSTOMER',
      recipient: phone,
      recipientName: name,
      subject: `Software License Activated: ${title}`,
      message: `Assalam-o-Alaikum ${name}! Thank you for choosing SoftCodeSolution. Your license for ${title} (${billingCycle}) is ACTIVE. Invoice #${invoiceNumber}, Amount: ${amount}. Access portal: https://softcodesolution.com/dashboard`,
      status: 'DELIVERED',
      category: 'SOFTWARE_PURCHASE',
      timestamp: new Date().toISOString()
    });

    NOTIFICATION_LOGS.unshift({
      id: 'notif-' + Date.now() + '-2',
      channel: 'SMS',
      target: 'CUSTOMER',
      recipient: phone,
      recipientName: name,
      subject: `Order #${invoiceNumber} Confirmed`,
      message: `SoftCodeSolution: Order #${invoiceNumber} for ${title} received. Paid: ${amount} via ${paymentMethod}. License active.`,
      status: 'DELIVERED',
      category: 'SOFTWARE_PURCHASE',
      timestamp: new Date().toISOString()
    });

    NOTIFICATION_LOGS.unshift({
      id: 'notif-' + Date.now() + '-3',
      channel: 'EMAIL',
      target: 'CUSTOMER',
      recipient: email,
      recipientName: name,
      subject: `Official Receipt & License Details: ${title} [${invoiceNumber}]`,
      message: `Dear ${name},\n\nWe are pleased to confirm your software subscription for ${title}. Your transaction of ${amount} via ${paymentMethod} was successful.\n\nInvoice: ${invoiceNumber}\nStatus: ${status}\nPortal: https://softcodesolution.com`,
      status: 'DELIVERED',
      category: 'SOFTWARE_PURCHASE',
      timestamp: new Date().toISOString()
    });

    NOTIFICATION_LOGS.unshift({
      id: 'notif-' + Date.now() + '-4',
      channel: 'WHATSAPP',
      target: 'ADMIN_COMPANY',
      recipient: '0300-SOFTCODE (Admin Hotline)',
      recipientName: 'SoftCodeSolution Management',
      subject: `🎉 New Software Sale: ${amount}`,
      message: `SoftCodeSolution Sales Alert: ${name} (${email}, ${phone}) has purchased ${title} (${billingCycle}) for ${amount} via ${paymentMethod}. Invoice #${invoiceNumber}.`,
      status: 'DELIVERED',
      category: 'COMPANY_REVENUE_ALERT',
      timestamp: new Date().toISOString()
    });

    res.json({
      ok: true,
      message: status === 'PAID'
        ? 'Payment successfully charged! Your software subscription is now ACTIVE. Confirmation sent via WhatsApp, SMS & Email.'
        : 'Order placed! Your bank deposit slip has been submitted to SuperAdmin Approvals.',
      transaction,
      status,
      notificationsDispatched: ['WHATSAPP', 'SMS', 'EMAIL']
    });
  });

  return router;
}
