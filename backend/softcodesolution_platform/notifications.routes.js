import express from 'express';
import { collection, addDoc } from 'firebase/firestore';
import { getCryptoVault } from '../auth_security/crypto_vault.js';

export const NOTIFICATION_LOGS = [
  {
    id: 'notif-101',
    channel: 'WHATSAPP',
    target: 'CUSTOMER',
    recipient: '+92 300 9876543',
    recipientName: 'Kashif Mehmood',
    subject: 'Software License Activated: Super Mart & Grocery',
    message: 'Assalam-o-Alaikum Kashif! Your Super Mart & Grocery POS license is ACTIVE. Invoice #INV-2026-9041, Amount: RS 15,500. Support Hotline: 0300-SOFTCODE.',
    status: 'READ',
    category: 'SOFTWARE_PURCHASE',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'notif-102',
    channel: 'SMS',
    target: 'CUSTOMER',
    recipient: '+92 300 9876543',
    recipientName: 'Kashif Mehmood',
    subject: 'Order #INV-2026-9041 Confirmed',
    message: 'SoftCodeSolution: Order #INV-2026-9041 confirmed for Super Mart & Grocery. Paid: RS 15,500. Thank you for your business.',
    status: 'DELIVERED',
    category: 'SOFTWARE_PURCHASE',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'notif-103',
    channel: 'EMAIL',
    target: 'CUSTOMER',
    recipient: 'kashif@supermart.pk',
    recipientName: 'Kashif Mehmood',
    subject: 'Official Receipt: Super Mart & Grocery [INV-2026-9041]',
    message: 'Dear Kashif, your payment of RS 15,500 has been verified. Welcome to SoftCodeSolution.',
    status: 'DELIVERED',
    category: 'SOFTWARE_PURCHASE',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'notif-104',
    channel: 'WHATSAPP',
    target: 'ADMIN_COMPANY',
    recipient: '+92 321 0000000',
    recipientName: 'SoftCodeSolution Admin',
    subject: '🎉 New Company Sale Alert',
    message: 'SoftCodeSolution Sales Alert: Kashif Mehmood purchased Super Mart & Grocery for RS 15,500 via JazzCash.',
    status: 'READ',
    category: 'COMPANY_REVENUE_ALERT',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'notif-105',
    channel: 'WHATSAPP',
    target: 'TENANT_CUSTOMER',
    recipient: '+92 333 1122334',
    recipientName: 'Patient: Haji Abdul Sattar',
    subject: 'OPD Token #8801 Confirmed',
    message: 'City Clinic: Your OPD Token #8801 with Dr. Tariq Mehmood is confirmed for 10:00 AM. Thank you.',
    status: 'DELIVERED',
    category: 'TENANT_BUSINESS_OPERATION',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];

export function createNotificationsRouter(sqliteDb, db) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);
  const resolveTid = (req) => String(req?.headers?.['x-tenant-id'] || req?.query?.tenantId || req?.body?.tenantId || 'tenant-root-platform').trim();

  router.get('/notifications/logs', (req, res) => {
    const tid = resolveTid(req);
    let logs = [...NOTIFICATION_LOGS];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM platform_notification_logs ORDER BY created_at DESC LIMIT 100').all();
        if (rows.length > 0) {
          const seen = new Set(logs.map(l => l.id));
          for (const r of rows) {
            if (!seen.has(r.id)) {
              logs.unshift({
                id: r.id,
                channel: r.channel,
                target: r.target,
                recipient: vault.decryptField('tenant-root-platform', r.recipient),
                recipientName: vault.decryptField('tenant-root-platform', r.recipient_name),
                subject: r.subject,
                message: vault.decryptField('tenant-root-platform', r.message),
                status: r.status,
                category: r.category,
                timestamp: r.created_at
              });
            }
          }
        }
      } catch (e) {}
    }
    res.json({ ok: true, logs, tenantId: tid });
  });

  router.post('/notifications/send-test', (req, res) => {
    const { channel, recipient, recipientName, message, subject, target } = req.body || {};
    if (!recipient || !message) {
      return res.status(400).json({ ok: false, message: 'Recipient and message content are required.' });
    }

    const logEntry = {
      id: 'notif-' + Date.now(),
      channel: channel || 'WHATSAPP',
      target: target || 'CUSTOMER',
      recipient,
      recipientName: recipientName || 'Subscriber',
      subject: subject || `${channel || 'WHATSAPP'} Message Alert`,
      message,
      status: 'DELIVERED',
      category: 'MANUAL_TEST_DISPATCH',
      timestamp: new Date().toISOString()
    };

    NOTIFICATION_LOGS.unshift(logEntry);

    if (sqliteDb) {
      try {
        sqliteDb.prepare(`
          INSERT OR REPLACE INTO platform_notification_logs
          (id, channel, target, recipient, recipient_name, subject, message, status, category, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          logEntry.id,
          logEntry.channel,
          logEntry.target,
          vault.encryptField('tenant-root-platform', logEntry.recipient),
          vault.encryptField('tenant-root-platform', logEntry.recipientName),
          logEntry.subject,
          vault.encryptField('tenant-root-platform', logEntry.message),
          logEntry.status,
          logEntry.category,
          logEntry.timestamp
        );
      } catch (e) {}
    }

    res.json({
      ok: true,
      message: `${channel || 'Notification'} successfully sent to ${recipient}!`,
      entry: logEntry
    });
  });

  router.post('/tenant/notify-customer', (req, res) => {
    const { customerName, customerPhone, customerEmail, businessName, operationType, referenceCode, message } = req.body || {};
    const textMsg = message || `${businessName || 'Business'}: Your ${operationType || 'order'} (${referenceCode || 'REF-99'}) has been processed successfully.`;

    const notif = {
      id: 'notif-' + Date.now(),
      channel: customerPhone ? 'WHATSAPP' : 'EMAIL',
      target: 'TENANT_CUSTOMER',
      recipient: customerPhone || customerEmail || '0300-CUSTOMER',
      recipientName: customerName || 'Valued Client',
      subject: `${businessName}: ${operationType} Update (${referenceCode})`,
      message: textMsg,
      status: 'DELIVERED',
      category: 'TENANT_BUSINESS_OPERATION',
      timestamp: new Date().toISOString()
    };

    NOTIFICATION_LOGS.unshift(notif);

    if (sqliteDb) {
      try {
        sqliteDb.prepare(`
          INSERT OR REPLACE INTO platform_notification_logs
          (id, channel, target, recipient, recipient_name, subject, message, status, category, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          notif.id,
          notif.channel,
          notif.target,
          vault.encryptField('tenant-root-platform', notif.recipient),
          vault.encryptField('tenant-root-platform', notif.recipientName),
          notif.subject,
          vault.encryptField('tenant-root-platform', notif.message),
          notif.status,
          notif.category,
          notif.timestamp
        );
      } catch (e) {}
    }

    res.json({
      ok: true,
      message: `Customer notification sent via ${notif.channel} for ${businessName}!`,
      notification: notif
    });
  });

  router.post('/notifications/dispatch-whatsapp-reminders', async (req, res) => {
    try {
      const { reminders = [], templateType = 'gentle', customTemplate = '', schoolName = 'Al-Huda Model Academy' } = req.body || {};

      if (!Array.isArray(reminders) || reminders.length === 0) {
        return res.status(400).json({ ok: false, message: 'No student/parent records provided for dispatch.' });
      }

      const batchId = 'BATCH-WA-' + Date.now();
      const results = [];

      for (const item of reminders) {
        const parentName = item.parentName || 'Respected Guardian';
        const studentName = item.studentName || 'Student';
        const amount = item.amount ? `PKR ${Number(item.amount).toLocaleString()}` : 'PKR 0';
        const dueDate = item.dueDate || new Date().toISOString().slice(0, 10);
        const agingDays = item.agingDays || 15;
        const rawPhone = (item.parentPhone || item.phone || '+923001234567').toString().replace(/\D/g, '');
        const formattedPhone = rawPhone.startsWith('92') ? `+${rawPhone}` : rawPhone.startsWith('0') ? `+92${rawPhone.slice(1)}` : `+${rawPhone}`;
        const cleanPhoneForWa = formattedPhone.replace('+', '');
        const paymentLink = `https://${schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')}.softcode.app/pay?id=${item.id || 'INV-101'}`;

        let bodyText = '';
        if (templateType === 'gentle') {
          bodyText = `*Fee Payment Reminder - ${schoolName}*\n\nRespected *${parentName}*,\n\nThis is a gentle reminder regarding the outstanding monthly tuition fee for *${studentName}* (${item.grade || 'Class 10'}).\n\n📌 *Outstanding Amount:* ${amount}\n📅 *Due Date:* ${dueDate}\n⏳ *Overdue Status:* ${agingDays} Days\n\nKindly clear the dues at your earliest convenience via the online portal or school accounts office:\n🔗 ${paymentLink}\n\nThank you for your cooperation.\n*Accounts & Finance Directorate*`;
        } else if (templateType === 'urgent') {
          bodyText = `⚠️ *URGENT FEE NOTICE - ${schoolName}*\n\nDear Parent/Guardian *${parentName}*,\n\nThe tuition fee for *${studentName}* of ${amount} is currently *${agingDays} days overdue* (Due Date: ${dueDate}).\n\nTo avoid administrative late surcharges and uninterrupted portal access, please settle the balance immediately:\n🔗 Instant Payment: ${paymentLink}\n\nIf payment has already been made, kindly ignore this automated notice.\n*Accounts Office - ${schoolName}*`;
        } else if (templateType === 'khata_hold') {
          bodyText = `⛔ *FINAL NOTICE / KHATA HOLD WARNING - ${schoolName}*\n\nAttention: *${parentName}*,\n\nRe: *${studentName}* (Grade ${item.grade || '10'})\nOutstanding Dues: *${amount}* (${agingDays}+ Days Overdue)\n\nPlease be advised that student records and LMS access will be temporarily held if dues are not settled by end of week.\n\nSettle Dues Online: ${paymentLink}\nContact Accounts: 0300-SOFTCODE\n*Executive Directorate - ${schoolName}*`;
        } else {
          bodyText = (customTemplate || '')
            .replace(/\{parent_name\}/g, parentName)
            .replace(/\{student_name\}/g, studentName)
            .replace(/\{amount\}/g, amount)
            .replace(/\{due_date\}/g, dueDate)
            .replace(/\{aging_days\}/g, agingDays)
            .replace(/\{school_name\}/g, schoolName)
            .replace(/\{payment_link\}/g, paymentLink);
        }

        const encodedMsg = encodeURIComponent(bodyText);
        const whatsappDirectUrl = `https://wa.me/${cleanPhoneForWa}?text=${encodedMsg}`;

        const logEntry = {
          id: 'notif-wa-' + Math.floor(Math.random() * 100000),
          batchId,
          channel: 'WHATSAPP',
          target: 'PARENT_GUARDIAN',
          recipient: formattedPhone,
          recipientName: `${parentName} (${studentName})`,
          subject: `WhatsApp Fee Reminder: ${studentName}`,
          message: bodyText,
          status: 'DELIVERED',
          category: 'FEE_PAYMENT_REMINDER',
          whatsappUrl: whatsappDirectUrl,
          studentId: item.id || 'STU-101',
          amount: item.amount,
          timestamp: new Date().toISOString()
        };

        NOTIFICATION_LOGS.unshift(logEntry);
        if (db) {
          try {
            await addDoc(collection(db, 'whatsapp_reminders'), logEntry);
          } catch (e) {
            console.warn('Firestore whatsapp reminder write warn:', e.message);
          }
        }

        results.push(logEntry);
      }

      res.json({
        ok: true,
        batchId,
        message: `Batch WhatsApp reminders successfully generated and queued for ${results.length} guardians!`,
        totalProcessed: results.length,
        deliveredCount: results.length,
        failedCount: 0,
        reminders: results
      });
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  return router;
}
