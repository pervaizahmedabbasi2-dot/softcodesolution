import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { doc, setDoc } from 'firebase/firestore';
import { getCryptoVault } from '../auth_security/crypto_vault.js';
import { NOTIFICATION_LOGS } from './notifications.routes.js';
import { DEFAULT_TEAM } from './teams.routes.js';

const ROOT_TID = 'tenant-root-platform';

const DEFAULT_BOT_RULES = [
  {
    id: 'rule-saas',
    category: 'saas-rental',
    keywords: ['saas', 'rental', 'subscription', 'plan', 'module', 'license', 'pricing', 'price', 'demo'],
    title: 'SaaS Module & Rental Inquiry',
    replyTemplate:
      'Thank you for contacting SoftCodeSolution! Your inquiry has been logged under SaaS Software Rentals. All 33+ enterprise business suites (School ERP, Retail POS, Clinic, Real Estate, Restaurant, Pharmacy, and more) are available with offline-first SQLite + Cloud Firestore sync. An Account Architect will follow up within 30 minutes with tailored deployment options.',
    priority: 'NORMAL'
  },
  {
    id: 'rule-custom',
    category: 'custom-dev',
    keywords: ['custom', 'architecture', 'api', 'integration', 'erp', 'enterprise', 'migration'],
    title: 'Custom Platform Engineering',
    replyTemplate:
      'Your custom engineering brief is queued with our Solutions Architecture Desk. Please share any target workflows, user volume, or third-party integrations on this thread so our lead engineer can prepare a technical scoping call.',
    priority: 'HIGH'
  },
  {
    id: 'rule-hardware',
    category: 'hardware-pos',
    keywords: ['hardware', 'printer', 'thermal', 'barcode', 'biometric', 'scanner', 'driver', 'pos', 'kiosk', 'camera'],
    title: 'Hardware & POS Drivers Support',
    replyTemplate:
      'Our Hardware & Device Integration team has received your ticket. For thermal printers, barcode scanners, or biometric attendance terminals, ensure your local SoftCode Desktop Bridge / USB driver service is running. A technical engineer will verify your device model shortly.',
    priority: 'HIGH'
  },
  {
    id: 'rule-billing',
    category: 'billing',
    keywords: ['billing', 'invoice', 'payment', 'refund', 'renewal', 'card', 'jazzcash', 'easypaisa'],
    title: 'Billing & Account Reconciliation',
    replyTemplate:
      'Your billing request has been routed to our Finance & Accounts Desk. If you are confirming a manual transfer, please keep your slip reference handy on this thread so our team can verify and activate your license immediately.',
    priority: 'HIGH'
  },
  {
    id: 'rule-deposit',
    category: 'deposit',
    keywords: ['deposit', 'pending', 'slip', 'wallet', 'balance', 'topup'],
    title: 'Deposit & Settlement Verification',
    replyTemplate:
      'We have prioritized your deposit verification inquiry. Our Settlement Team audits incoming receipts continuously and will update your wallet/invoice status directly on this ticket and via email.',
    priority: 'URGENT'
  },
  {
    id: 'rule-chat',
    category: 'chat-issue',
    keywords: ['chat', 'login', 'password', 'error', 'bug', 'issue', 'slow', 'sync', 'down', 'help'],
    title: 'Technical Troubleshooting & Live Issue',
    replyTemplate:
      'SoftCode Care Bot has flagged your technical issue for priority review. If you are experiencing login, sync, or dashboard errors, our NOC engineering team has been alerted and will reply on this thread and to your email shortly.',
    priority: 'HIGH'
  }
];

const SUBJECT_LABELS = {
  'saas-rental': 'SCS Software Rentals',
  'custom-dev': 'Custom Platform Development',
  'hardware-pos': 'Hardware & Drivers Setup',
  billing: 'Billing / Account Inquiry',
  deposit: 'Deposit Issues',
  'technical-bug': 'Technical Incident / Bug',
  'chat-issue': 'Live Chat Support Inquiry',
  other: 'General Enterprise Inquiry'
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildBrandedEmailHtml({
  subject,
  recipientName,
  ticketNo,
  messageBody,
  senderType,
  senderName,
  senderRole,
  isPromo = false,
  ctaLabel = '',
  ctaUrl = ''
}) {
  const badgeLabel =
    senderType === 'AUTO_BOT'
      ? 'Automated Support Assistant'
      : senderType === 'TEAM_MEMBER'
        ? `Support Team · ${senderRole || 'Specialist'}`
        : 'SoftCodeSolution Executive Desk';

  const safeBodyHtml = escapeHtml(messageBody).replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;background:#0f172a;color:#ffffff;">
              <div style="font-size:18px;font-weight:800;letter-spacing:-0.02em;">SoftCode<span style="color:#818cf8;">Solution</span></div>
              <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">${escapeHtml(badgeLabel)}${ticketNo ? ` · Ticket ${escapeHtml(ticketNo)}` : ''}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${recipientName ? `<p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#0f172a;">Hello ${escapeHtml(recipientName)},</p>` : ''}
              <div style="font-size:14px;line-height:1.65;color:#334155;">${safeBodyHtml}</div>
              ${
                ctaLabel && ctaUrl
                  ? `<div style="margin-top:24px;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 22px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px;">${escapeHtml(ctaLabel)}</a></div>`
                  : ''
              }
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                Sent by <strong>${escapeHtml(senderName)}</strong> (${escapeHtml(badgeLabel)}) via SoftCodeSolution Platform.
                ${isPromo ? ' You are receiving this update as a registered SoftCodeSolution contact.' : ' Reply directly or track your ticket in the SoftCodeSolution portal.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function createSupportRouter(sqliteDb, db) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);

  function getSmtpConfig() {
    let row = null;
    if (sqliteDb) {
      try {
        row = sqliteDb.prepare('SELECT * FROM platform_smtp_settings WHERE id = ? LIMIT 1').get('default');
      } catch {}
    }
    const host = (row?.smtp_host || process.env.SMTP_HOST || '').trim();
    const port = Number(row?.smtp_port || process.env.SMTP_PORT || 587);
    const user = (row?.smtp_user || process.env.SMTP_USER || '').trim();
    const pass = (row?.smtp_pass_enc ? vault.decryptField(ROOT_TID, row.smtp_pass_enc) : '') || process.env.SMTP_PASS || '';
    const secure = row ? row.smtp_secure === 1 : String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    const fromEmail = (row?.from_email || process.env.SMTP_FROM || user || 'support@softcodesolution.com').trim();
    const fromName = (row?.from_name || 'SoftCodeSolution Support Desk').trim();
    const supportEmail = (row?.support_email || 'support@softcodesolution.com').trim();
    const configured = Boolean(host && user && pass);
    return { host, port, user, pass, secure, fromEmail, fromName, supportEmail, configured };
  }

  function getBotConfig() {
    let row = null;
    if (sqliteDb) {
      try {
        row = sqliteDb.prepare('SELECT * FROM platform_support_bot_config WHERE id = ? LIMIT 1').get('default');
      } catch {}
    }
    if (!row) {
      const defaults = {
        id: 'default',
        botEnabled: true,
        autoAckEmail: true,
        autoReplyChat: true,
        botName: 'SoftCode Care Bot',
        botSignature: 'SoftCodeSolution Automated Support Desk · 24/7 SLA Routing',
        slaMinutes: 30,
        rules: DEFAULT_BOT_RULES
      };
      if (sqliteDb) {
        try {
          sqliteDb
            .prepare(
              `INSERT OR IGNORE INTO platform_support_bot_config
               (id, bot_enabled, auto_ack_email, auto_reply_chat, bot_name, bot_signature, sla_minutes, rules_json, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
              'default',
              1,
              1,
              1,
              defaults.botName,
              defaults.botSignature,
              defaults.slaMinutes,
              JSON.stringify(DEFAULT_BOT_RULES),
              new Date().toISOString()
            );
        } catch {}
      }
      return defaults;
    }

    let rules = DEFAULT_BOT_RULES;
    try {
      const parsed = JSON.parse(row.rules_json || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) rules = parsed;
    } catch {}

    return {
      id: row.id,
      botEnabled: row.bot_enabled !== 0,
      autoAckEmail: row.auto_ack_email !== 0,
      autoReplyChat: row.auto_reply_chat !== 0,
      botName: row.bot_name || 'SoftCode Care Bot',
      botSignature: row.bot_signature || 'SoftCodeSolution Automated Support Desk',
      slaMinutes: Number(row.sla_minutes || 30),
      rules
    };
  }

  function evaluateAutoBotResponse({ category, message, botConfig }) {
    const text = String(message || '').toLowerCase();
    const rules = botConfig?.rules || DEFAULT_BOT_RULES;
    let matched = rules.find((r) =>
      Array.isArray(r.keywords) && r.keywords.some((kw) => text.includes(String(kw).toLowerCase()))
    );
    if (!matched && category) {
      matched = rules.find((r) => r.category === category);
    }
    if (!matched) {
      return {
        matchedRuleTitle: 'Standard Engineering Triage',
        suggestedPriority: 'NORMAL',
        replyText:
          'Thank you for reaching out to SoftCodeSolution! Your ticket has been registered with our Engineering Support Desk. A support specialist or SuperAdmin will review your request and reply directly to your email and ticket thread within our 30-minute SLA.'
      };
    }
    return {
      matchedRuleTitle: matched.title,
      suggestedPriority: matched.priority || 'NORMAL',
      replyText: matched.replyTemplate
    };
  }

  async function dispatchEmail({
    toEmail,
    toName = '',
    subject,
    messageBody,
    htmlOverride = '',
    ticketNo = '',
    senderType = 'SUPER_ADMIN',
    senderName = 'SoftCode SuperAdmin',
    senderEmail = '',
    senderRole = 'Platform Administrator',
    campaignType = 'TICKET_REPLY',
    audienceSegment = 'INDIVIDUAL',
    templateKey = 'support-reply',
    isPromo = false
  }) {
    const smtp = getSmtpConfig();
    const html =
      htmlOverride ||
      buildBrandedEmailHtml({
        subject,
        recipientName: toName,
        ticketNo,
        messageBody,
        senderType,
        senderName,
        senderRole,
        isPromo
      });

    let deliveryStatus = 'OUTBOX_SAVED';
    let deliveryMode = 'OUTBOX_SIMULATED';
    let messageId = `scs-outbox-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    let transportError = '';

    if (smtp.configured && toEmail) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure || smtp.port === 465,
          auth: { user: smtp.user, pass: smtp.pass },
          connectionTimeout: 8000,
          greetingTimeout: 8000
        });
        const info = await transporter.sendMail({
          from: `"${senderName || smtp.fromName}" <${smtp.fromEmail}>`,
          replyTo: senderEmail || smtp.supportEmail || smtp.fromEmail,
          to: toName ? `"${toName}" <${toEmail}>` : toEmail,
          subject: ticketNo ? `[${ticketNo}] ${subject}` : subject,
          text: messageBody,
          html
        });
        deliveryStatus = 'SENT_SMTP';
        deliveryMode = 'SMTP_LIVE';
        messageId = info.messageId || messageId;
      } catch (err) {
        transportError = err?.message || 'SMTP transport error';
        deliveryStatus = 'OUTBOX_SAVED';
        deliveryMode = 'OUTBOX_FALLBACK';
      }
    }

    const logId = 'notif-email-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
    const now = new Date().toISOString();
    const notifEntry = {
      id: logId,
      channel: 'EMAIL',
      target: 'CUSTOMER',
      recipient: toEmail,
      recipientName: toName || toEmail,
      subject: ticketNo ? `[${ticketNo}] ${subject}` : subject,
      message: messageBody,
      status: deliveryStatus === 'SENT_SMTP' ? 'DELIVERED' : 'QUEUED_OUTBOX',
      category: campaignType,
      timestamp: now
    };
    NOTIFICATION_LOGS.unshift(notifEntry);

    if (sqliteDb) {
      try {
        sqliteDb
          .prepare(
            `INSERT OR REPLACE INTO platform_notification_logs
             (id, channel, target, recipient, recipient_name, subject, message, status, category, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            notifEntry.id,
            'EMAIL',
            'CUSTOMER',
            vault.encryptField(ROOT_TID, toEmail),
            vault.encryptField(ROOT_TID, toName || toEmail),
            notifEntry.subject,
            vault.encryptField(ROOT_TID, messageBody),
            notifEntry.status,
            campaignType,
            now
          );
      } catch {}
    }

    const campaignId = 'cmp-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
    if (sqliteDb && campaignType !== 'CAMPAIGN_PER_RECIPIENT') {
      try {
        sqliteDb
          .prepare(
            `INSERT INTO platform_email_campaigns
             (id, campaign_type, audience_segment, template_key, subject, body_html, body_text, sender_type, sender_name, sender_email, recipients_count, recipients_json, delivery_mode, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            campaignId,
            campaignType,
            audienceSegment,
            templateKey,
            notifEntry.subject,
            html,
            messageBody,
            senderType,
            senderName,
            senderEmail || smtp.fromEmail,
            1,
            JSON.stringify([{ email: toEmail, name: toName }]),
            deliveryMode,
            deliveryStatus,
            now
          );
      } catch {}
    }

    return {
      deliveryStatus,
      deliveryMode,
      messageId,
      transportError,
      smtpConfigured: smtp.configured
    };
  }

  function mapTicketRow(r) {
    if (!r) return null;
    return {
      id: r.id,
      ticketNo: r.ticket_no,
      tenantId: r.tenant_id || 'public-visitor',
      companyName: r.company_name || '',
      requesterName: vault.decryptField(ROOT_TID, r.requester_name),
      requesterEmail: vault.decryptField(ROOT_TID, r.requester_email),
      requesterPhone: vault.decryptField(ROOT_TID, r.requester_phone || ''),
      subjectCategory: r.subject_category,
      subjectTitle: r.subject_title,
      sourceChannel: r.source_channel || 'WEB_FORM',
      priority: r.priority || 'NORMAL',
      status: r.status || 'OPEN',
      assignedTeamId: r.assigned_team_id || '',
      assignedTeamName: r.assigned_team_name || '',
      assignedTeamRole: r.assigned_team_role || '',
      lastRepliedByType: r.last_replied_by_type || 'CUSTOMER',
      lastRepliedByName: r.last_replied_by_name || '',
      lastReplyAt: r.last_reply_at || r.created_at,
      unreadByAdmin: r.unread_by_admin === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  function mapMessageRow(m) {
    if (!m) return null;
    return {
      id: m.id,
      ticketId: m.ticket_id,
      senderType: m.sender_type,
      senderName: vault.decryptField(ROOT_TID, m.sender_name),
      senderEmail: vault.decryptField(ROOT_TID, m.sender_email || ''),
      senderRole: m.sender_role || '',
      teamMemberId: m.team_member_id || '',
      messageBody: m.message_body,
      deliveryChannel: m.delivery_channel || 'EMAIL_AND_PORTAL',
      emailDeliveryStatus: m.email_delivery_status || 'NONE',
      emailMessageId: m.email_message_id || '',
      createdAt: m.created_at
    };
  }

  function ensureSeedSupportTickets() {
    if (!sqliteDb) return;
    try {
      const cnt = sqliteDb.prepare('SELECT COUNT(*) AS c FROM platform_support_tickets').get();
      if (Number(cnt?.c || 0) > 0) return;

      const now = Date.now();
      const t1Created = new Date(now - 3600 * 1000 * 5).toISOString();
      const t1Reply = new Date(now - 3600 * 1000 * 4).toISOString();
      const t2Created = new Date(now - 3600 * 1000 * 2).toISOString();
      const t2Reply = new Date(now - 3600 * 1000 * 1.5).toISOString();

      sqliteDb
        .prepare(
          `INSERT INTO platform_support_tickets
           (id, ticket_no, tenant_id, company_name, requester_name, requester_email, requester_phone, subject_category, subject_title, source_channel, priority, status, assigned_team_id, assigned_team_name, assigned_team_role, last_replied_by_type, last_replied_by_name, last_reply_at, unread_by_admin, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'tkt-seed-1001',
          'SCS-TKT-2026-1001',
          'tenant-apex-fin',
          'Apex Financial Holdings',
          vault.encryptField(ROOT_TID, 'David Sterling'),
          vault.encryptField(ROOT_TID, 'admin@apexholdings.com'),
          vault.encryptField(ROOT_TID, '+1-555-0192'),
          'hardware-pos',
          'Hardware & Drivers Setup — Thermal POS Printer Bridge',
          'CLIENT_PORTAL',
          'HIGH',
          'IN_PROGRESS',
          'tm-3',
          'Marcus Vance',
          'Global Systems DevOps',
          'TEAM_MEMBER',
          'Marcus Vance',
          t1Reply,
          0,
          t1Created,
          t1Reply
        );

      sqliteDb
        .prepare(
          `INSERT INTO platform_support_messages
           (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'msg-seed-1001-a',
          'tkt-seed-1001',
          'CUSTOMER',
          vault.encryptField(ROOT_TID, 'David Sterling'),
          vault.encryptField(ROOT_TID, 'admin@apexholdings.com'),
          'Tenant Admin',
          '',
          'We deployed two new Epson 80mm thermal receipt printers at Branch #3. Need confirmation on USB-Serial driver bridge parameters for Wails Desktop.',
          'WEB_PORTAL',
          'NONE',
          '',
          t1Created
        );

      sqliteDb
        .prepare(
          `INSERT INTO platform_support_messages
           (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'msg-seed-1001-b',
          'tkt-seed-1001',
          'TEAM_MEMBER',
          vault.encryptField(ROOT_TID, 'Marcus Vance'),
          vault.encryptField(ROOT_TID, 'marcus.v@enterprise.softcode.com'),
          'Global Systems DevOps',
          'tm-3',
          'Hi David, we have enabled raw ESC/POS spooling on your tenant profile. Please restart the SoftCode Hardware Bridge and test a receipt print. Let us know if you need live screen support.',
          'EMAIL_AND_PORTAL',
          'OUTBOX_SAVED',
          'scs-seed-mail-1001',
          t1Reply
        );

      sqliteDb
        .prepare(
          `INSERT INTO platform_support_tickets
           (id, ticket_no, tenant_id, company_name, requester_name, requester_email, requester_phone, subject_category, subject_title, source_channel, priority, status, assigned_team_id, assigned_team_name, assigned_team_role, last_replied_by_type, last_replied_by_name, last_reply_at, unread_by_admin, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'tkt-seed-1002',
          'SCS-TKT-2026-1002',
          'public-visitor',
          'Crescent Retail Group',
          vault.encryptField(ROOT_TID, 'Bilal Ahmed'),
          vault.encryptField(ROOT_TID, 'bilal@crescentretail.pk'),
          vault.encryptField(ROOT_TID, '+92-300-4455667'),
          'saas-rental',
          'SCS Software Rentals — Multi-Branch Retail + Warehouse Pricing',
          'WEB_FORM',
          'NORMAL',
          'BOT_REPLIED',
          '',
          '',
          '',
          'AUTO_BOT',
          'SoftCode Care Bot',
          t2Reply,
          1,
          t2Created,
          t2Reply
        );

      sqliteDb
        .prepare(
          `INSERT INTO platform_support_messages
           (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'msg-seed-1002-a',
          'tkt-seed-1002',
          'CUSTOMER',
          vault.encryptField(ROOT_TID, 'Bilal Ahmed'),
          vault.encryptField(ROOT_TID, 'bilal@crescentretail.pk'),
          'Prospective Client',
          '',
          'We operate 6 grocery branches and want a quote for Retail POS + Wholesale Distribution with offline SQLite backup.',
          'WEB_PORTAL',
          'NONE',
          '',
          t2Created
        );

      sqliteDb
        .prepare(
          `INSERT INTO platform_support_messages
           (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'msg-seed-1002-b',
          'tkt-seed-1002',
          'AUTO_BOT',
          vault.encryptField(ROOT_TID, 'SoftCode Care Bot'),
          vault.encryptField(ROOT_TID, 'support@softcodesolution.com'),
          'Automated Assistant',
          '',
          DEFAULT_BOT_RULES[0].replyTemplate,
          'EMAIL_AND_PORTAL',
          'OUTBOX_SAVED',
          'scs-seed-mail-1002',
          t2Reply
        );
    } catch (err) {
      console.warn('[Support Desk] Seed notice:', err.message);
    }
  }

  ensureSeedSupportTickets();

  async function syncTicketToFirestore(ticketObj, messagesArr = []) {
    if (!db || !ticketObj) return;
    try {
      await setDoc(doc(db, 'support_tickets', ticketObj.id), {
        ...ticketObj,
        syncedAt: new Date().toISOString()
      });
      for (const m of messagesArr) {
        await setDoc(doc(db, 'support_messages', m.id), {
          ...m,
          syncedAt: new Date().toISOString()
        });
      }
    } catch {}
  }

  // -------------------------------------------------------------------------
  // 1. PUBLIC & CLIENT TICKET SUBMISSION (Landing Page + Client Portal)
  // -------------------------------------------------------------------------
  router.post('/support/tickets', async (req, res) => {
    try {
      const b = req.body || {};
      const name = String(b.name || b.requesterName || '').trim();
      const email = String(b.email || b.requesterEmail || '').trim().toLowerCase();
      const phone = String(b.phone || b.requesterPhone || '').trim();
      const companyName = String(b.companyName || b.company || '').trim();
      const subjectCategory = String(b.subject || b.subjectCategory || 'saas-rental').trim();
      const message = String(b.message || '').trim();
      const sourceChannel = String(b.sourceChannel || 'WEB_FORM').trim().toUpperCase();
      const tenantId = String(b.tenantId || req.headers['x-tenant-id'] || 'public-visitor').trim();
      const requestedPriority = String(b.priority || '').trim().toUpperCase();

      if (name.length < 2 || !email.includes('@') || message.length < 10) {
        return res.status(400).json({
          ok: false,
          message: 'Please provide a valid name, email address, and message (at least 10 characters).'
        });
      }

      const botConfig = getBotConfig();
      const botEval = evaluateAutoBotResponse({ category: subjectCategory, message, botConfig });
      const priority = ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(requestedPriority)
        ? requestedPriority
        : botEval.suggestedPriority || 'NORMAL';

      const nowMs = Date.now();
      const now = new Date(nowMs - 5).toISOString();
      const ticketId = `tkt-${nowMs}-${crypto.randomBytes(2).toString('hex')}`;
      const ticketNo = `SCS-TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const catLabel = SUBJECT_LABELS[subjectCategory] || 'Technical Support';
      const subjectTitle = b.subjectTitle ? String(b.subjectTitle).trim() : `${catLabel} — ${name}`;

      let status = 'OPEN';
      let lastRepliedByType = 'CUSTOMER';
      let lastRepliedByName = name;
      let lastReplyAt = now;

      const customerMsgId = `msg-${nowMs}-c`;
      const customerMsg = {
        id: customerMsgId,
        ticketId,
        senderType: 'CUSTOMER',
        senderName: name,
        senderEmail: email,
        senderRole: tenantId !== 'public-visitor' ? 'Client Tenant' : 'Visitor',
        teamMemberId: '',
        messageBody: message,
        deliveryChannel: 'WEB_PORTAL',
        emailDeliveryStatus: 'NONE',
        emailMessageId: '',
        createdAt: now
      };

      const createdMessages = [customerMsg];
      let botReplyObj = null;
      let emailStatus = null;

      if (botConfig.botEnabled) {
        status = 'BOT_REPLIED';
        lastRepliedByType = 'AUTO_BOT';
        lastRepliedByName = botConfig.botName;
        const botTime = new Date(nowMs).toISOString();
        lastReplyAt = botTime;

        if (botConfig.autoAckEmail) {
          emailStatus = await dispatchEmail({
            toEmail: email,
            toName: name,
            subject: `Ticket Received: ${catLabel}`,
            messageBody: `${botEval.replyText}\n\nReference Ticket: ${ticketNo}\nCategory: ${catLabel}\nPriority: ${priority}\n\nYour original inquiry:\n"${message}"`,
            ticketNo,
            senderType: 'AUTO_BOT',
            senderName: botConfig.botName,
            senderRole: 'Automated Assistant',
            campaignType: 'BOT_AUTO_REPLY',
            templateKey: 'bot-auto-ack'
          });
        }

        botReplyObj = {
          id: `msg-${Date.now()}-b`,
          ticketId,
          senderType: 'AUTO_BOT',
          senderName: botConfig.botName,
          senderEmail: getSmtpConfig().supportEmail,
          senderRole: `Automated Assistant · ${botEval.matchedRuleTitle}`,
          teamMemberId: '',
          messageBody: botEval.replyText,
          deliveryChannel: botConfig.autoAckEmail ? 'EMAIL_AND_PORTAL' : 'WEB_PORTAL',
          emailDeliveryStatus: emailStatus?.deliveryStatus || 'NONE',
          emailMessageId: emailStatus?.messageId || '',
          createdAt: botTime
        };
        createdMessages.push(botReplyObj);
      }

      if (sqliteDb) {
        sqliteDb
          .prepare(
            `INSERT INTO platform_support_tickets
             (id, ticket_no, tenant_id, company_name, requester_name, requester_email, requester_phone, subject_category, subject_title, source_channel, priority, status, assigned_team_id, assigned_team_name, assigned_team_role, last_replied_by_type, last_replied_by_name, last_reply_at, unread_by_admin, is_synced, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`
          )
          .run(
            ticketId,
            ticketNo,
            tenantId,
            companyName,
            vault.encryptField(ROOT_TID, name),
            vault.encryptField(ROOT_TID, email),
            vault.encryptField(ROOT_TID, phone),
            subjectCategory,
            subjectTitle,
            sourceChannel,
            priority,
            status,
            '',
            '',
            '',
            lastRepliedByType,
            lastRepliedByName,
            lastReplyAt,
            now,
            lastReplyAt
          );

        for (const m of createdMessages) {
          sqliteDb
            .prepare(
              `INSERT INTO platform_support_messages
               (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
              m.id,
              m.ticketId,
              m.senderType,
              vault.encryptField(ROOT_TID, m.senderName),
              vault.encryptField(ROOT_TID, m.senderEmail),
              m.senderRole,
              m.teamMemberId,
              m.messageBody,
              m.deliveryChannel,
              m.emailDeliveryStatus,
              m.emailMessageId,
              m.createdAt
            );
        }
      }

      const ticketRecord = {
        id: ticketId,
        ticketNo,
        tenantId,
        companyName,
        requesterName: name,
        requesterEmail: email,
        requesterPhone: phone,
        subjectCategory,
        subjectTitle,
        sourceChannel,
        priority,
        status,
        assignedTeamId: '',
        assignedTeamName: '',
        assignedTeamRole: '',
        lastRepliedByType,
        lastRepliedByName,
        lastReplyAt,
        unreadByAdmin: true,
        createdAt: now,
        updatedAt: lastReplyAt
      };

      void syncTicketToFirestore(ticketRecord, createdMessages);

      res.json({
        ok: true,
        message: `Support ticket ${ticketNo} submitted successfully.`,
        ticket: ticketRecord,
        messages: createdMessages,
        botReply: botReplyObj,
        emailStatus
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  // -------------------------------------------------------------------------
  // 2. LIVE SUPPORT CHAT WIDGET & ISSUE ESCALATION
  // -------------------------------------------------------------------------
  router.post('/support/chat', async (req, res) => {
    try {
      const b = req.body || {};
      const ticketId = String(b.ticketId || '').trim();
      const name = String(b.name || 'Website Visitor').trim();
      const email = String(b.email || 'visitor@softcodesolution.local').trim().toLowerCase();
      const message = String(b.message || '').trim();
      const escalateToHuman = Boolean(b.escalateToHuman);
      const subjectCategory = String(b.subjectCategory || 'chat-issue').trim();
      const tenantId = String(b.tenantId || 'public-visitor').trim();

      if (!message && !escalateToHuman) {
        return res.status(400).json({ ok: false, message: 'Message text is required.' });
      }

      const botConfig = getBotConfig();
      const chatNowMs = Date.now();
      const now = new Date(chatNowMs - 5).toISOString();

      let activeTicket = null;
      if (ticketId && sqliteDb) {
        activeTicket = mapTicketRow(
          sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(ticketId)
        );
      }

      if (!activeTicket) {
        const newId = `tkt-${chatNowMs}-${crypto.randomBytes(2).toString('hex')}`;
        const ticketNo = `SCS-CHAT-${Math.floor(1000 + Math.random() * 9000)}`;
        const subjectTitle = `Live Chat Support — ${name}`;
        activeTicket = {
          id: newId,
          ticketNo,
          tenantId,
          companyName: String(b.companyName || ''),
          requesterName: name,
          requesterEmail: email,
          requesterPhone: String(b.phone || ''),
          subjectCategory,
          subjectTitle,
          sourceChannel: 'CHAT_WIDGET',
          priority: escalateToHuman ? 'HIGH' : 'NORMAL',
          status: escalateToHuman ? 'OPEN' : 'BOT_REPLIED',
          assignedTeamId: '',
          assignedTeamName: '',
          assignedTeamRole: '',
          lastRepliedByType: 'CUSTOMER',
          lastRepliedByName: name,
          lastReplyAt: now,
          unreadByAdmin: true,
          createdAt: now,
          updatedAt: now
        };
        if (sqliteDb) {
          sqliteDb
            .prepare(
              `INSERT INTO platform_support_tickets
               (id, ticket_no, tenant_id, company_name, requester_name, requester_email, requester_phone, subject_category, subject_title, source_channel, priority, status, assigned_team_id, assigned_team_name, assigned_team_role, last_replied_by_type, last_replied_by_name, last_reply_at, unread_by_admin, is_synced, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '', ?, ?, ?, 1, 0, ?, ?)`
            )
            .run(
              activeTicket.id,
              activeTicket.ticketNo,
              activeTicket.tenantId,
              activeTicket.companyName,
              vault.encryptField(ROOT_TID, activeTicket.requesterName),
              vault.encryptField(ROOT_TID, activeTicket.requesterEmail),
              vault.encryptField(ROOT_TID, activeTicket.requesterPhone),
              activeTicket.subjectCategory,
              activeTicket.subjectTitle,
              'CHAT_WIDGET',
              activeTicket.priority,
              activeTicket.status,
              activeTicket.lastRepliedByType,
              activeTicket.lastRepliedByName,
              now,
              now,
              now
            );
        }
      }

      const newMessages = [];
      if (message) {
        const custMsg = {
          id: `msg-${chatNowMs}-${crypto.randomBytes(2).toString('hex')}`,
          ticketId: activeTicket.id,
          senderType: 'CUSTOMER',
          senderName: name,
          senderEmail: email,
          senderRole: 'Chat User',
          teamMemberId: '',
          messageBody: message,
          deliveryChannel: 'CHAT_AND_EMAIL',
          emailDeliveryStatus: 'NONE',
          emailMessageId: '',
          createdAt: now
        };
        newMessages.push(custMsg);
        if (sqliteDb) {
          sqliteDb
            .prepare(
              `INSERT INTO platform_support_messages
               (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
              custMsg.id,
              custMsg.ticketId,
              custMsg.senderType,
              vault.encryptField(ROOT_TID, custMsg.senderName),
              vault.encryptField(ROOT_TID, custMsg.senderEmail),
              custMsg.senderRole,
              '',
              custMsg.messageBody,
              custMsg.deliveryChannel,
              'NONE',
              '',
              custMsg.createdAt
            );
        }
      }

      const humanAlreadyAssigned = ['TEAM_MEMBER', 'SUPER_ADMIN'].includes(activeTicket.lastRepliedByType);
      if (escalateToHuman) {
        if (sqliteDb) {
          sqliteDb
            .prepare(
              `UPDATE platform_support_tickets SET status = 'OPEN', priority = 'HIGH', unread_by_admin = 1, updated_at = ? WHERE id = ?`
            )
            .run(now, activeTicket.id);
        }
        const escMsg = {
          id: `msg-${chatNowMs}-esc`,
          ticketId: activeTicket.id,
          senderType: 'AUTO_BOT',
          senderName: botConfig.botName,
          senderEmail: getSmtpConfig().supportEmail,
          senderRole: 'Escalation Router',
          teamMemberId: '',
          messageBody: `Escalated to SoftCodeSolution SuperAdmin & Engineering Desk (${activeTicket.ticketNo}). Any reply from our team will appear right here and will also be emailed to ${activeTicket.requesterEmail}.`,
          deliveryChannel: 'CHAT_AND_EMAIL',
          emailDeliveryStatus: 'NONE',
          emailMessageId: '',
          createdAt: new Date(chatNowMs).toISOString()
        };
        newMessages.push(escMsg);
        if (sqliteDb) {
          sqliteDb
            .prepare(
              `INSERT INTO platform_support_messages
               (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
              escMsg.id,
              escMsg.ticketId,
              escMsg.senderType,
              vault.encryptField(ROOT_TID, escMsg.senderName),
              vault.encryptField(ROOT_TID, escMsg.senderEmail),
              escMsg.senderRole,
              '',
              escMsg.messageBody,
              escMsg.deliveryChannel,
              'NONE',
              '',
              escMsg.createdAt
            );
        }
      } else if (botConfig.botEnabled && botConfig.autoReplyChat && !humanAlreadyAssigned && message) {
        const botEval = evaluateAutoBotResponse({ category: subjectCategory, message, botConfig });
        const botTime = new Date(chatNowMs).toISOString();
        const botMsg = {
          id: `msg-${Date.now()}-bot`,
          ticketId: activeTicket.id,
          senderType: 'AUTO_BOT',
          senderName: botConfig.botName,
          senderEmail: getSmtpConfig().supportEmail,
          senderRole: `Automated Assistant · ${botEval.matchedRuleTitle}`,
          teamMemberId: '',
          messageBody: botEval.replyText,
          deliveryChannel: 'CHAT_AND_EMAIL',
          emailDeliveryStatus: 'NONE',
          emailMessageId: '',
          createdAt: botTime
        };
        newMessages.push(botMsg);
        if (sqliteDb) {
          sqliteDb
            .prepare(
              `INSERT INTO platform_support_messages
               (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
              botMsg.id,
              botMsg.ticketId,
              botMsg.senderType,
              vault.encryptField(ROOT_TID, botMsg.senderName),
              vault.encryptField(ROOT_TID, botMsg.senderEmail),
              botMsg.senderRole,
              '',
              botMsg.messageBody,
              botMsg.deliveryChannel,
              'NONE',
              '',
              botMsg.createdAt
            );
          sqliteDb
            .prepare(
              `UPDATE platform_support_tickets SET status = 'BOT_REPLIED', last_replied_by_type = 'AUTO_BOT', last_replied_by_name = ?, last_reply_at = ?, unread_by_admin = 1, updated_at = ? WHERE id = ?`
            )
            .run(botConfig.botName, botTime, botTime, activeTicket.id);
        }
      } else if (sqliteDb) {
        sqliteDb
          .prepare(
            `UPDATE platform_support_tickets SET unread_by_admin = 1, last_replied_by_type = 'CUSTOMER', last_replied_by_name = ?, last_reply_at = ?, updated_at = ? WHERE id = ?`
          )
          .run(name, now, now, activeTicket.id);
      }

      const fullMessages = sqliteDb
        ? sqliteDb
            .prepare('SELECT * FROM platform_support_messages WHERE ticket_id = ? ORDER BY created_at ASC')
            .all(activeTicket.id)
            .map(mapMessageRow)
        : newMessages;

      const updatedTicket = sqliteDb
        ? mapTicketRow(sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(activeTicket.id))
        : activeTicket;

      void syncTicketToFirestore(updatedTicket, newMessages);

      res.json({ ok: true, ticket: updatedTicket, messages: fullMessages });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  // -------------------------------------------------------------------------
  // 3. PUBLIC TICKET TRACKING & CUSTOMER FOLLOW-UP REPLY
  // -------------------------------------------------------------------------
  router.get('/support/tickets/track', (req, res) => {
    try {
      const ticketNo = String(req.query?.ticketNo || '').trim().toUpperCase();
      const email = String(req.query?.email || '').trim().toLowerCase();
      if (!ticketNo || !email) {
        return res.status(400).json({ ok: false, message: 'Ticket ID and email address are required.' });
      }
      if (!sqliteDb) {
        return res.status(404).json({ ok: false, message: 'Ticket storage unavailable.' });
      }
      const row = sqliteDb
        .prepare('SELECT * FROM platform_support_tickets WHERE UPPER(ticket_no) = ? LIMIT 1')
        .get(ticketNo);
      const ticket = mapTicketRow(row);
      if (!ticket || ticket.requesterEmail.toLowerCase() !== email) {
        return res.status(404).json({ ok: false, message: 'No matching ticket found for that Ticket ID and email.' });
      }
      const messages = sqliteDb
        .prepare('SELECT * FROM platform_support_messages WHERE ticket_id = ? ORDER BY created_at ASC')
        .all(ticket.id)
        .map(mapMessageRow);
      res.json({ ok: true, ticket, messages });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.post('/support/tickets/public-reply', async (req, res) => {
    try {
      const ticketNo = String(req.body?.ticketNo || '').trim().toUpperCase();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const message = String(req.body?.message || '').trim();
      if (!ticketNo || !email || message.length < 2) {
        return res.status(400).json({ ok: false, message: 'Ticket ID, email, and reply text are required.' });
      }
      const row = sqliteDb
        ? sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE UPPER(ticket_no) = ? LIMIT 1').get(ticketNo)
        : null;
      const ticket = mapTicketRow(row);
      if (!ticket || ticket.requesterEmail.toLowerCase() !== email) {
        return res.status(404).json({ ok: false, message: 'Ticket verification failed.' });
      }

      const now = new Date().toISOString();
      const msgObj = {
        id: `msg-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        ticketId: ticket.id,
        senderType: 'CUSTOMER',
        senderName: ticket.requesterName,
        senderEmail: ticket.requesterEmail,
        senderRole: 'Customer Follow-up',
        teamMemberId: '',
        messageBody: message,
        deliveryChannel: 'WEB_PORTAL',
        emailDeliveryStatus: 'NONE',
        emailMessageId: '',
        createdAt: now
      };

      sqliteDb
        .prepare(
          `INSERT INTO platform_support_messages
           (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, '', ?, 'WEB_PORTAL', 'NONE', '', ?)`
        )
        .run(
          msgObj.id,
          msgObj.ticketId,
          msgObj.senderType,
          vault.encryptField(ROOT_TID, msgObj.senderName),
          vault.encryptField(ROOT_TID, msgObj.senderEmail),
          msgObj.senderRole,
          msgObj.messageBody,
          now
        );

      const nextStatus = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'OPEN' : ticket.status;
      sqliteDb
        .prepare(
          `UPDATE platform_support_tickets
           SET status = ?, last_replied_by_type = 'CUSTOMER', last_replied_by_name = ?, last_reply_at = ?, unread_by_admin = 1, updated_at = ?
           WHERE id = ?`
        )
        .run(nextStatus, ticket.requesterName, now, now, ticket.id);

      const messages = sqliteDb
        .prepare('SELECT * FROM platform_support_messages WHERE ticket_id = ? ORDER BY created_at ASC')
        .all(ticket.id)
        .map(mapMessageRow);
      const updatedTicket = mapTicketRow(
        sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(ticket.id)
      );

      void syncTicketToFirestore(updatedTicket, [msgObj]);
      res.json({ ok: true, ticket: updatedTicket, messages });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  // -------------------------------------------------------------------------
  // 4. CLIENT PORTAL SELF-SERVICE TICKETS
  // -------------------------------------------------------------------------
  router.get('/support/client-tickets', (req, res) => {
    try {
      const email = String(req.query?.email || '').trim().toLowerCase();
      const tenantId = String(req.query?.tenantId || req.headers['x-tenant-id'] || '').trim();
      if (!sqliteDb) return res.json({ ok: true, tickets: [] });

      const rows = sqliteDb.prepare('SELECT * FROM platform_support_tickets ORDER BY updated_at DESC LIMIT 200').all();
      const filtered = rows
        .map(mapTicketRow)
        .filter((t) => {
          if (tenantId && tenantId !== 'public-visitor' && tenantId !== 'tenant-root-platform' && t.tenantId === tenantId) {
            return true;
          }
          if (email && t.requesterEmail.toLowerCase() === email) return true;
          return false;
        });

      res.json({ ok: true, tickets: filtered });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  // -------------------------------------------------------------------------
  // 5. SUPERADMIN SUPPORT INBOX, THREADS & DIRECT EMAIL REPLIES
  // -------------------------------------------------------------------------
  router.get('/support/tickets', (req, res) => {
    try {
      const statusFilter = String(req.query?.status || 'ALL').toUpperCase();
      const channelFilter = String(req.query?.channel || 'ALL').toUpperCase();
      const search = String(req.query?.q || '').trim().toLowerCase();

      const allRows = sqliteDb
        ? sqliteDb.prepare('SELECT * FROM platform_support_tickets ORDER BY updated_at DESC LIMIT 300').all()
        : [];
      const allTickets = allRows.map(mapTicketRow);

      const filtered = allTickets.filter((t) => {
        if (statusFilter !== 'ALL' && t.status.toUpperCase() !== statusFilter) return false;
        if (channelFilter !== 'ALL' && t.sourceChannel.toUpperCase() !== channelFilter) return false;
        if (search) {
          const hay = `${t.ticketNo} ${t.requesterName} ${t.requesterEmail} ${t.companyName} ${t.subjectTitle} ${t.assignedTeamName}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      });

      const stats = {
        total: allTickets.length,
        open: allTickets.filter((t) => t.status === 'OPEN').length,
        botReplied: allTickets.filter((t) => t.status === 'BOT_REPLIED').length,
        inProgress: allTickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_CLIENT').length,
        resolved: allTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
        unread: allTickets.filter((t) => t.unreadByAdmin).length,
        chats: allTickets.filter((t) => t.sourceChannel === 'CHAT_WIDGET').length
      };

      res.json({ ok: true, tickets: filtered, stats });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.get('/support/tickets/:id', (req, res) => {
    try {
      const id = req.params.id;
      if (!sqliteDb) return res.status(404).json({ ok: false, message: 'Ticket not found' });

      const row = sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(id);
      if (!row) return res.status(404).json({ ok: false, message: 'Ticket not found' });

      sqliteDb.prepare('UPDATE platform_support_tickets SET unread_by_admin = 0 WHERE id = ?').run(id);
      const ticket = mapTicketRow(sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(id));
      const messages = sqliteDb
        .prepare('SELECT * FROM platform_support_messages WHERE ticket_id = ? ORDER BY created_at ASC')
        .all(id)
        .map(mapMessageRow);

      res.json({ ok: true, ticket, messages });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.post('/support/tickets/:id/reply', async (req, res) => {
    try {
      const id = req.params.id;
      if (!sqliteDb) return res.status(500).json({ ok: false, message: 'Database unavailable' });
      const existing = mapTicketRow(sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(id));
      if (!existing) return res.status(404).json({ ok: false, message: 'Ticket not found' });

      const b = req.body || {};
      const messageBody = String(b.message || b.messageBody || '').trim();
      if (!messageBody) {
        return res.status(400).json({ ok: false, message: 'Reply message cannot be empty.' });
      }

      const responderType = ['SUPER_ADMIN', 'TEAM_MEMBER', 'AUTO_BOT'].includes(String(b.responderType || '').toUpperCase())
        ? String(b.responderType).toUpperCase()
        : 'SUPER_ADMIN';
      const internalNote = Boolean(b.internalNote);
      const sendEmail = internalNote ? false : b.sendEmail !== false;

      let responderName = String(b.responderName || '').trim();
      let responderRole = String(b.responderRole || '').trim();
      let responderEmail = String(b.responderEmail || '').trim();
      const teamMemberId = String(b.teamMemberId || '').trim();

      if (responderType === 'TEAM_MEMBER' && teamMemberId) {
        const tmRow = sqliteDb
          .prepare('SELECT * FROM platform_team_members WHERE id = ? LIMIT 1')
          .get(teamMemberId);
        if (tmRow) {
          responderName = responderName || vault.decryptField(ROOT_TID, tmRow.name);
          responderEmail = responderEmail || vault.decryptField(ROOT_TID, tmRow.email);
          responderRole = responderRole || tmRow.role || tmRow.department;
        } else {
          const fallbackTm = DEFAULT_TEAM.find((m) => m.id === teamMemberId);
          if (fallbackTm) {
            responderName = responderName || fallbackTm.name;
            responderEmail = responderEmail || fallbackTm.email;
            responderRole = responderRole || fallbackTm.role;
          }
        }
      }

      if (!responderName) {
        responderName =
          responderType === 'AUTO_BOT'
            ? getBotConfig().botName
            : responderType === 'TEAM_MEMBER'
              ? 'SoftCode Support Engineer'
              : 'SoftCode SuperAdmin';
      }
      if (!responderRole) {
        responderRole =
          responderType === 'AUTO_BOT'
            ? 'Automated Assistant'
            : responderType === 'TEAM_MEMBER'
              ? 'Support Team'
              : 'Platform SuperAdmin';
      }

      let emailResult = null;
      if (sendEmail && existing.requesterEmail) {
        emailResult = await dispatchEmail({
          toEmail: existing.requesterEmail,
          toName: existing.requesterName,
          subject: `Re: ${existing.subjectTitle}`,
          messageBody,
          ticketNo: existing.ticketNo,
          senderType: responderType,
          senderName: responderName,
          senderEmail: responderEmail || getSmtpConfig().supportEmail,
          senderRole: responderRole,
          campaignType: 'TICKET_REPLY',
          templateKey: 'ticket-reply'
        });
      }

      const now = new Date().toISOString();
      const msgObj = {
        id: `msg-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        ticketId: existing.id,
        senderType: responderType,
        senderName: responderName,
        senderEmail: responderEmail || getSmtpConfig().supportEmail,
        senderRole: internalNote ? `${responderRole} · Internal Note` : responderRole,
        teamMemberId,
        messageBody,
        deliveryChannel: internalNote ? 'INTERNAL_NOTE' : sendEmail ? 'EMAIL_AND_PORTAL' : 'WEB_PORTAL',
        emailDeliveryStatus: emailResult?.deliveryStatus || 'NONE',
        emailMessageId: emailResult?.messageId || '',
        createdAt: now
      };

      sqliteDb
        .prepare(
          `INSERT INTO platform_support_messages
           (id, ticket_id, sender_type, sender_name, sender_email, sender_role, team_member_id, message_body, delivery_channel, email_delivery_status, email_message_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          msgObj.id,
          msgObj.ticketId,
          msgObj.senderType,
          vault.encryptField(ROOT_TID, msgObj.senderName),
          vault.encryptField(ROOT_TID, msgObj.senderEmail),
          msgObj.senderRole,
          msgObj.teamMemberId,
          msgObj.messageBody,
          msgObj.deliveryChannel,
          msgObj.emailDeliveryStatus,
          msgObj.emailMessageId,
          now
        );

      const requestedStatus = String(b.updateStatus || '').trim().toUpperCase();
      const nextStatus = ['OPEN', 'BOT_REPLIED', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'].includes(requestedStatus)
        ? requestedStatus
        : internalNote
          ? existing.status
          : 'IN_PROGRESS';

      const nextAssignedId = teamMemberId || existing.assignedTeamId;
      const nextAssignedName = responderType === 'TEAM_MEMBER' ? responderName : existing.assignedTeamName;
      const nextAssignedRole = responderType === 'TEAM_MEMBER' ? responderRole : existing.assignedTeamRole;

      sqliteDb
        .prepare(
          `UPDATE platform_support_tickets
           SET status = ?,
               assigned_team_id = ?,
               assigned_team_name = ?,
               assigned_team_role = ?,
               last_replied_by_type = ?,
               last_replied_by_name = ?,
               last_reply_at = ?,
               unread_by_admin = 0,
               updated_at = ?
           WHERE id = ?`
        )
        .run(
          nextStatus,
          nextAssignedId,
          nextAssignedName,
          nextAssignedRole,
          internalNote ? existing.lastRepliedByType : responderType,
          internalNote ? existing.lastRepliedByName : responderName,
          now,
          now,
          existing.id
        );

      const updatedTicket = mapTicketRow(
        sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(existing.id)
      );
      const messages = sqliteDb
        .prepare('SELECT * FROM platform_support_messages WHERE ticket_id = ? ORDER BY created_at ASC')
        .all(existing.id)
        .map(mapMessageRow);

      void syncTicketToFirestore(updatedTicket, [msgObj]);

      res.json({
        ok: true,
        message: internalNote
          ? 'Internal note added to ticket thread.'
          : emailResult?.deliveryStatus === 'SENT_SMTP'
            ? `Reply posted and live email delivered to ${existing.requesterEmail} as ${responderName}.`
            : `Reply posted to ticket thread and queued in Email Outbox for ${existing.requesterEmail} as ${responderName}.`,
        ticket: updatedTicket,
        messages,
        emailStatus: emailResult
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.put('/support/tickets/:id/status', (req, res) => {
    try {
      const id = req.params.id;
      if (!sqliteDb) return res.status(500).json({ ok: false, message: 'Database unavailable' });
      const existing = mapTicketRow(sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(id));
      if (!existing) return res.status(404).json({ ok: false, message: 'Ticket not found' });

      const b = req.body || {};
      const status = String(b.status || existing.status).toUpperCase();
      const priority = String(b.priority || existing.priority).toUpperCase();
      const assignedTeamId = b.assignedTeamId !== undefined ? String(b.assignedTeamId) : existing.assignedTeamId;
      const assignedTeamName = b.assignedTeamName !== undefined ? String(b.assignedTeamName) : existing.assignedTeamName;
      const assignedTeamRole = b.assignedTeamRole !== undefined ? String(b.assignedTeamRole) : existing.assignedTeamRole;
      const now = new Date().toISOString();

      sqliteDb
        .prepare(
          `UPDATE platform_support_tickets
           SET status = ?, priority = ?, assigned_team_id = ?, assigned_team_name = ?, assigned_team_role = ?, unread_by_admin = 0, updated_at = ?
           WHERE id = ?`
        )
        .run(status, priority, assignedTeamId, assignedTeamName, assignedTeamRole, now, id);

      const updatedTicket = mapTicketRow(sqliteDb.prepare('SELECT * FROM platform_support_tickets WHERE id = ? LIMIT 1').get(id));
      void syncTicketToFirestore(updatedTicket, []);
      res.json({ ok: true, ticket: updatedTicket });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  // -------------------------------------------------------------------------
  // 6. AUTO-BOT CONFIGURATION & SMART RULES
  // -------------------------------------------------------------------------
  router.get('/support/bot-config', (req, res) => {
    res.json({ ok: true, config: getBotConfig() });
  });

  router.put('/support/bot-config', async (req, res) => {
    try {
      const b = req.body || {};
      const current = getBotConfig();
      const next = {
        id: 'default',
        botEnabled: b.botEnabled !== undefined ? Boolean(b.botEnabled) : current.botEnabled,
        autoAckEmail: b.autoAckEmail !== undefined ? Boolean(b.autoAckEmail) : current.autoAckEmail,
        autoReplyChat: b.autoReplyChat !== undefined ? Boolean(b.autoReplyChat) : current.autoReplyChat,
        botName: String(b.botName || current.botName).trim() || 'SoftCode Care Bot',
        botSignature: String(b.botSignature ?? current.botSignature).trim(),
        slaMinutes: Number(b.slaMinutes || current.slaMinutes || 30),
        rules: Array.isArray(b.rules) && b.rules.length > 0 ? b.rules : current.rules
      };

      if (sqliteDb) {
        sqliteDb
          .prepare(
            `INSERT OR REPLACE INTO platform_support_bot_config
             (id, bot_enabled, auto_ack_email, auto_reply_chat, bot_name, bot_signature, sla_minutes, rules_json, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            'default',
            next.botEnabled ? 1 : 0,
            next.autoAckEmail ? 1 : 0,
            next.autoReplyChat ? 1 : 0,
            next.botName,
            next.botSignature,
            next.slaMinutes,
            JSON.stringify(next.rules),
            new Date().toISOString()
          );
      }

      if (db) {
        try {
          await setDoc(doc(db, 'support_bot_config', 'default'), next);
        } catch {}
      }

      res.json({ ok: true, message: 'Auto-Bot rules saved and active.', config: next });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  // -------------------------------------------------------------------------
  // 7. PROMOTIONAL & MANUAL DIRECT EMAIL STUDIO
  // -------------------------------------------------------------------------
  router.get('/support/campaigns', (req, res) => {
    try {
      const rows = sqliteDb
        ? sqliteDb.prepare('SELECT * FROM platform_email_campaigns ORDER BY created_at DESC LIMIT 100').all()
        : [];
      const campaigns = rows.map((r) => ({
        id: r.id,
        campaignType: r.campaign_type,
        audienceSegment: r.audience_segment,
        templateKey: r.template_key,
        subject: r.subject,
        bodyHtml: r.body_html,
        bodyText: r.body_text,
        senderType: r.sender_type,
        senderName: r.sender_name,
        senderEmail: r.sender_email,
        recipientsCount: Number(r.recipients_count || 1),
        recipients: (() => {
          try {
            return JSON.parse(r.recipients_json || '[]');
          } catch {
            return [];
          }
        })(),
        deliveryMode: r.delivery_mode,
        status: r.status,
        createdAt: r.created_at
      }));
      res.json({ ok: true, campaigns, smtpConfigured: getSmtpConfig().configured });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.post('/support/campaigns/send', async (req, res) => {
    try {
      const b = req.body || {};
      const campaignType = String(b.campaignType || 'PROMO_CAMPAIGN').toUpperCase();
      const audienceSegment = String(b.audienceSegment || 'INDIVIDUAL').toUpperCase();
      const templateKey = String(b.templateKey || 'custom').trim();
      const subject = String(b.subject || '').trim();
      const bodyText = String(b.bodyText || '').trim();
      const senderType = String(b.senderType || 'SUPER_ADMIN').toUpperCase();
      const senderName = String(b.senderName || 'SoftCode SuperAdmin').trim();
      const senderEmail = String(b.senderEmail || getSmtpConfig().fromEmail).trim();
      const ctaLabel = String(b.ctaLabel || '').trim();
      const ctaUrl = String(b.ctaUrl || '').trim();
      const verticalFilter = String(b.verticalFilter || '').trim().toLowerCase();

      if (!subject || !bodyText) {
        return res.status(400).json({ ok: false, message: 'Email subject and body content are required.' });
      }

      let recipients = [];
      if (audienceSegment === 'INDIVIDUAL') {
        const directEmail = String(b.directEmail || '').trim().toLowerCase();
        const directName = String(b.directName || '').trim();
        if (!directEmail || !directEmail.includes('@')) {
          return res.status(400).json({ ok: false, message: 'Please provide a valid recipient email address.' });
        }
        recipients.push({ email: directEmail, name: directName || directEmail.split('@')[0] });
      } else if (sqliteDb) {
        const tenantRows = sqliteDb.prepare('SELECT * FROM local_tenants ORDER BY created_at DESC').all();
        for (const r of tenantRows) {
          const dec = vault.decryptFields(r.tenant_id, r, ['full_name', 'email']);
          const st = String(r.status || (r.is_synced === 1 ? 'APPROVED' : 'PENDING')).toUpperCase();
          if (audienceSegment === 'APPROVED_CLIENTS' && st !== 'APPROVED') continue;
          if (audienceSegment === 'PENDING_LEADS' && st !== 'PENDING') continue;
          if (audienceSegment === 'SPECIFIC_VERTICAL' && verticalFilter && String(r.business_type || '').toLowerCase() !== verticalFilter) {
            continue;
          }
          if (dec.email && String(dec.email).includes('@')) {
            recipients.push({ email: dec.email, name: dec.full_name || r.company_name || 'Partner' });
          }
        }
        if (recipients.length === 0 && Array.isArray(b.fallbackRecipients)) {
          recipients = b.fallbackRecipients.filter((x) => x?.email && String(x.email).includes('@'));
        }
      }

      if (recipients.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'No matching recipients found for this audience segment. Try Individual Email or register/select clients.'
        });
      }

      let sentSmtpCount = 0;
      let lastDeliveryMode = 'OUTBOX_SIMULATED';
      for (const rec of recipients) {
        const result = await dispatchEmail({
          toEmail: rec.email,
          toName: rec.name,
          subject,
          messageBody: bodyText,
          senderType,
          senderName,
          senderEmail,
          senderRole: senderType === 'TEAM_MEMBER' ? 'Campaign Team' : 'Executive Administration',
          campaignType: 'CAMPAIGN_PER_RECIPIENT',
          audienceSegment,
          templateKey,
          isPromo: campaignType === 'PROMO_CAMPAIGN'
        });
        if (result.deliveryStatus === 'SENT_SMTP') sentSmtpCount++;
        lastDeliveryMode = result.deliveryMode;
      }

      const now = new Date().toISOString();
      const campaignId = `cmp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      const sampleHtml = buildBrandedEmailHtml({
        subject,
        recipientName: recipients[0]?.name || 'Partner',
        messageBody: bodyText,
        senderType,
        senderName,
        senderRole: senderType === 'TEAM_MEMBER' ? 'Campaign Team' : 'SuperAdmin',
        isPromo: campaignType === 'PROMO_CAMPAIGN',
        ctaLabel,
        ctaUrl
      });
      const status = sentSmtpCount > 0 ? 'SENT_SMTP' : 'OUTBOX_SAVED';

      const campaignRecord = {
        id: campaignId,
        campaignType,
        audienceSegment,
        templateKey,
        subject,
        bodyHtml: sampleHtml,
        bodyText,
        senderType,
        senderName,
        senderEmail,
        recipientsCount: recipients.length,
        recipients,
        deliveryMode: sentSmtpCount > 0 ? 'SMTP_LIVE' : lastDeliveryMode,
        status,
        createdAt: now
      };

      if (sqliteDb) {
        sqliteDb
          .prepare(
            `INSERT INTO platform_email_campaigns
             (id, campaign_type, audience_segment, template_key, subject, body_html, body_text, sender_type, sender_name, sender_email, recipients_count, recipients_json, delivery_mode, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            campaignId,
            campaignType,
            audienceSegment,
            templateKey,
            subject,
            sampleHtml,
            bodyText,
            senderType,
            senderName,
            senderEmail,
            recipients.length,
            JSON.stringify(recipients),
            campaignRecord.deliveryMode,
            status,
            now
          );
      }

      if (db) {
        try {
          await setDoc(doc(db, 'support_campaigns', campaignId), campaignRecord);
        } catch {}
      }

      res.json({
        ok: true,
        message:
          sentSmtpCount > 0
            ? `Delivered live SMTP email to ${sentSmtpCount}/${recipients.length} recipient(s) as ${senderName}.`
            : `Campaign prepared & logged in Outbox for ${recipients.length} recipient(s) as ${senderName}. Configure SMTP credentials for live external inbox delivery.`,
        campaign: campaignRecord
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  // -------------------------------------------------------------------------
  // 8. PERSISTENT SMTP CONFIGURATION & LIVE TEST DISPATCH
  // -------------------------------------------------------------------------
  router.get('/support/smtp-settings', (req, res) => {
    const cfg = getSmtpConfig();
    res.json({
      ok: true,
      settings: {
        smtpHost: cfg.host,
        smtpPort: cfg.port,
        smtpUser: cfg.user,
        hasPassword: Boolean(cfg.pass),
        smtpSecure: cfg.secure,
        fromEmail: cfg.fromEmail,
        fromName: cfg.fromName,
        supportEmail: cfg.supportEmail,
        configured: cfg.configured
      }
    });
  });

  router.put('/support/smtp-settings', (req, res) => {
    try {
      const b = req.body || {};
      const current = getSmtpConfig();
      const smtpHost = String(b.smtpHost ?? current.host).trim();
      const smtpPort = Number(b.smtpPort ?? current.port ?? 587);
      const smtpUser = String(b.smtpUser ?? current.user).trim();
      const rawPass = b.smtpPass !== undefined && String(b.smtpPass).trim() !== '' ? String(b.smtpPass) : current.pass;
      const smtpSecure = b.smtpSecure !== undefined ? Boolean(b.smtpSecure) : current.secure;
      const fromEmail = String(b.fromEmail ?? current.fromEmail).trim();
      const fromName = String(b.fromName ?? current.fromName).trim();
      const supportEmail = String(b.supportEmail ?? current.supportEmail).trim();

      if (sqliteDb) {
        sqliteDb
          .prepare(
            `INSERT OR REPLACE INTO platform_smtp_settings
             (id, smtp_host, smtp_port, smtp_user, smtp_pass_enc, smtp_secure, from_email, from_name, support_email, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            'default',
            smtpHost,
            smtpPort,
            smtpUser,
            rawPass ? vault.encryptField(ROOT_TID, rawPass) : '',
            smtpSecure ? 1 : 0,
            fromEmail,
            fromName,
            supportEmail,
            new Date().toISOString()
          );
      }

      const updated = getSmtpConfig();
      res.json({
        ok: true,
        message: updated.configured
          ? 'SMTP credentials encrypted & saved. Live email dispatch enabled.'
          : 'SMTP settings saved (add SMTP password to enable live outbound email delivery).',
        configured: updated.configured
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  router.post('/support/smtp-test', async (req, res) => {
    try {
      const toEmail = String(req.body?.toEmail || getSmtpConfig().supportEmail || 'support@softcodesolution.com').trim();
      const result = await dispatchEmail({
        toEmail,
        toName: 'SoftCode Admin',
        subject: 'SoftCodeSolution SMTP Diagnostic Test',
        messageBody:
          'This is a live SMTP verification message sent from your SoftCodeSolution SuperAdmin Support & Communications Desk.',
        senderType: 'SUPER_ADMIN',
        senderName: 'SoftCode SuperAdmin',
        campaignType: 'SMTP_DIAGNOSTIC',
        templateKey: 'smtp-test'
      });

      res.json({
        ok: true,
        deliveryStatus: result.deliveryStatus,
        smtpConfigured: result.smtpConfigured,
        message:
          result.deliveryStatus === 'SENT_SMTP'
            ? `Live SMTP handshake succeeded! Test email delivered to ${toEmail}.`
            : result.transportError
              ? `SMTP connection warning (${result.transportError}). Saved to Email Outbox.`
              : `No SMTP password configured yet — diagnostic email logged in Outbox for ${toEmail}.`
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  return router;
}
