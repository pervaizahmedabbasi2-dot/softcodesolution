import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createApp } from '../../server.js';

let server;
let baseUrl;
let tempDir;
let sqliteDbPath;
let runtime;

before(async () => {
  process.env.ARGON2_MEMORY_KB = process.env.ARGON2_MEMORY_KB || '16384';
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scs-support-test-'));
  sqliteDbPath = path.join(tempDir, 'test_support.db');

  runtime = createApp({
    sqliteDbPath,
    disableFirebase: true,
    disableBackgroundSync: true,
    disableFrontendBuild: true,
    quiet: true
  });

  await new Promise((resolve) => {
    server = runtime.app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (runtime?.close) {
    runtime.close();
  }
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Landing Page support ticket routes to SuperAdmin with Auto-Bot triage & email outbox tracking', async () => {
  const submitRes = await fetch(`${baseUrl}/api/support/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Zainab Tariq',
      email: 'zainab@medicareclinic.pk',
      phone: '+92-321-7654321',
      companyName: 'Medicare Clinic Hub',
      subject: 'hardware-pos',
      priority: 'HIGH',
      message: 'We need USB thermal printer setup guidance for our clinic billing counter.',
      sourceChannel: 'WEB_FORM'
    })
  });

  assert.equal(submitRes.status, 200);
  const submitted = await submitRes.json();
  assert.equal(submitted.ok, true);
  assert.match(submitted.ticket.ticketNo, /^SCS-TKT-/);
  assert.equal(submitted.ticket.status, 'BOT_REPLIED');
  assert.equal(submitted.ticket.lastRepliedByType, 'AUTO_BOT');
  assert.ok(submitted.botReply?.messageBody.includes('Hardware'));

  // Public Ticket Tracking + Follow-up
  const trackRes = await fetch(
    `${baseUrl}/api/support/tickets/track?ticketNo=${encodeURIComponent(submitted.ticket.ticketNo)}&email=${encodeURIComponent('zainab@medicareclinic.pk')}`
  );
  assert.equal(trackRes.status, 200);
  const tracked = await trackRes.json();
  assert.equal(tracked.ok, true);
  assert.equal(tracked.messages.length, 2);

  const followRes = await fetch(`${baseUrl}/api/support/tickets/public-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticketNo: submitted.ticket.ticketNo,
      email: 'zainab@medicareclinic.pk',
      message: 'Printer model is Epson TM-T88VI.'
    })
  });
  assert.equal(followRes.status, 200);
  const followed = await followRes.json();
  assert.equal(followed.messages.length, 3);

  // SuperAdmin replies as Team Member with attribution + email outbox dispatch
  const replyRes = await fetch(`${baseUrl}/api/support/tickets/${encodeURIComponent(submitted.ticket.id)}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      responderType: 'TEAM_MEMBER',
      teamMemberId: 'tm-3',
      message: 'Enabled TM-T88VI ESC/POS profile on your tenant.',
      sendEmail: true,
      updateStatus: 'IN_PROGRESS'
    })
  });
  assert.equal(replyRes.status, 200);
  const replied = await replyRes.json();
  assert.equal(replied.ok, true);
  assert.equal(replied.ticket.lastRepliedByType, 'TEAM_MEMBER');
  assert.equal(replied.ticket.lastRepliedByName, 'Marcus Vance');
  assert.equal(replied.ticket.status, 'IN_PROGRESS');
  assert.equal(replied.messages[3].senderType, 'TEAM_MEMBER');
  assert.equal(replied.messages[3].emailDeliveryStatus, 'OUTBOX_SAVED');

  // Verify in SuperAdmin Inbox listing
  const inboxRes = await fetch(`${baseUrl}/api/support/tickets`);
  assert.equal(inboxRes.status, 200);
  const inbox = await inboxRes.json();
  assert.equal(inbox.ok, true);
  assert.ok(inbox.tickets.some((t) => t.ticketNo === submitted.ticket.ticketNo));
});

test('Live Chat Auto-Bot handles issue and supports human escalation to SuperAdmin', async () => {
  const chatRes = await fetch(`${baseUrl}/api/support/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Usman Raza',
      email: 'usman@razamart.pk',
      message: 'My deposit slip verification is pending for 2 hours.'
    })
  });
  assert.equal(chatRes.status, 200);
  const chatJson = await chatRes.json();
  assert.equal(chatJson.ok, true);
  assert.equal(chatJson.ticket.sourceChannel, 'CHAT_WIDGET');
  assert.equal(chatJson.ticket.status, 'BOT_REPLIED');
  assert.equal(chatJson.messages.length, 2);

  // Escalate to engineering team
  const escRes = await fetch(`${baseUrl}/api/support/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticketId: chatJson.ticket.id,
      name: 'Usman Raza',
      email: 'usman@razamart.pk',
      escalateToHuman: true
    })
  });
  assert.equal(escRes.status, 200);
  const escJson = await escRes.json();
  assert.equal(escJson.ticket.status, 'OPEN');
  assert.equal(escJson.ticket.priority, 'HIGH');
  assert.equal(escJson.messages.length, 3);
});

test('Auto-Bot rules, Direct/Promo Email campaigns, and SMTP settings persist cleanly', async () => {
  // Bot Config Update
  const botSave = await fetch(`${baseUrl}/api/support/bot-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      botEnabled: true,
      autoAckEmail: true,
      autoReplyChat: true,
      botName: 'SoftCode AI Triage',
      slaMinutes: 20
    })
  });
  assert.equal(botSave.status, 200);
  const botSaved = await botSave.json();
  assert.equal(botSaved.config.botName, 'SoftCode AI Triage');
  assert.equal(botSaved.config.slaMinutes, 20);

  // Direct Email / Promo Dispatch
  const cmpRes = await fetch(`${baseUrl}/api/support/campaigns/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignType: 'PROMO_CAMPAIGN',
      audienceSegment: 'INDIVIDUAL',
      directEmail: 'vip@enterprise.pk',
      directName: 'VIP Partner',
      subject: '20% Annual Enterprise Renewal Offer',
      bodyText: 'Upgrade your SoftCodeSolution multi-branch workspace today.',
      senderType: 'SUPER_ADMIN',
      senderName: 'Pervaiz SuperAdmin'
    })
  });
  assert.equal(cmpRes.status, 200);
  const cmpJson = await cmpRes.json();
  assert.equal(cmpJson.ok, true);
  assert.equal(cmpJson.campaign.senderName, 'Pervaiz SuperAdmin');

  const cmpListRes = await fetch(`${baseUrl}/api/support/campaigns`);
  assert.equal(cmpListRes.status, 200);
  const cmpList = await cmpListRes.json();
  assert.ok(cmpList.campaigns.some((c) => c.subject === '20% Annual Enterprise Renewal Offer'));

  // SMTP Save & Diagnostic Test
  const smtpPut = await fetch(`${baseUrl}/api/support/smtp-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      smtpHost: 'smtp.example.org',
      smtpPort: 587,
      smtpUser: 'desk@softcodesolution.com',
      fromEmail: 'desk@softcodesolution.com',
      fromName: 'SoftCode Ops',
      supportEmail: 'support@softcodesolution.com'
    })
  });
  assert.equal(smtpPut.status, 200);

  const smtpGet = await fetch(`${baseUrl}/api/support/smtp-settings`);
  assert.equal(smtpGet.status, 200);
  const smtpJson = await smtpGet.json();
  assert.equal(smtpJson.settings.smtpHost, 'smtp.example.org');
  assert.equal(smtpJson.settings.smtpUser, 'desk@softcodesolution.com');
});
