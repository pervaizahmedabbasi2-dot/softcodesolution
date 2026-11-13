import express from 'express';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

import { getCryptoVault } from '../auth_security/crypto_vault.js';

export const DEFAULT_TEAM = [
  { id: 'tm-1', name: 'Alexander Wright', email: 'alex.wright@enterprise.softcode.com', role: 'Chief Technology Officer', department: 'Executive', status: 'ACTIVE', mfa: true, lastActive: '2 mins ago', permissions: ['all'] },
  { id: 'tm-2', name: 'Sophia Chen', email: 'sophia.chen@enterprise.softcode.com', role: 'Lead Security Architect', department: 'InfraSec', status: 'ACTIVE', mfa: true, lastActive: '14 mins ago', permissions: ['security', 'compliance', 'api-gate'] },
  { id: 'tm-3', name: 'Marcus Vance', email: 'marcus.v@enterprise.softcode.com', role: 'Global Systems DevOps', department: 'Infrastructure', status: 'ACTIVE', mfa: true, lastActive: '1 hour ago', permissions: ['global-edge', 'updater', 'system-health'] },
  { id: 'tm-4', name: 'Elena Rostova', email: 'elena.r@enterprise.softcode.com', role: 'Head of Financial Operations', department: 'Finance', status: 'ACTIVE', mfa: true, lastActive: '3 hours ago', permissions: ['payments', 'invoices', 'licenses'] },
  { id: 'tm-5', name: 'Darius Thorne', email: 'darius.t@enterprise.softcode.com', role: 'Enterprise Product Lead', department: 'Product', status: 'ACTIVE', mfa: false, lastActive: '5 hours ago', permissions: ['module-catalog', 'saas-control'] }
];

export function createTeamsRouter(sqliteDb, db, getCollectionDocs) {
  const router = express.Router();
  const vault = getCryptoVault(sqliteDb);
  const rootTid = 'tenant-root-platform';

  router.get('/members', async (req, res) => {
    let members = [];
    if (sqliteDb) {
      try {
        const rows = sqliteDb.prepare('SELECT * FROM platform_team_members ORDER BY created_at DESC').all();
        if (rows.length > 0) {
          members = rows.map(r => ({
            id: r.id,
            name: vault.decryptField(rootTid, r.name),
            email: vault.decryptField(rootTid, r.email),
            role: r.role,
            department: r.department,
            status: r.status,
            mfa: r.mfa === 1,
            lastActive: r.last_active || 'Active',
            permissions: (() => { try { return JSON.parse(r.permissions_json || '["read"]'); } catch { return ['read']; } })()
          }));
        }
      } catch (e) {}
    }
    if (members.length === 0) {
      const raw = getCollectionDocs ? await getCollectionDocs('team_members', DEFAULT_TEAM) : DEFAULT_TEAM;
      members = raw.map(m => vault.decryptFields(rootTid, m, ['name', 'email']));
    }
    res.json({ ok: true, members });
  });

  router.post('/invite', async (req, res) => {
    try {
      const { name, email, role = 'Member', department = 'General' } = req.body || {};
      const newMember = {
        id: 'tm-' + Date.now(),
        name: name || (email ? email.split('@')[0] : 'Team Member'),
        email: email || '',
        role,
        department,
        status: 'INVITED',
        mfa: false,
        lastActive: 'Never',
        permissions: ['read'],
        invited_at: new Date().toISOString()
      };

      const encName = vault.encryptField(rootTid, newMember.name);
      const encEmail = vault.encryptField(rootTid, newMember.email);

      if (sqliteDb) {
        try {
          sqliteDb.prepare(`
            INSERT OR REPLACE INTO platform_team_members
            (id, name, email, role, department, status, mfa, last_active, permissions_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
          `).run(newMember.id, encName, encEmail, newMember.role, newMember.department, newMember.status, newMember.lastActive, JSON.stringify(newMember.permissions), newMember.invited_at);
        } catch (e) {}
      }

      if (db) {
        try {
          await setDoc(doc(db, 'team_members', newMember.id), { ...newMember, name: encName, email: encEmail });
        } catch (err) {
          console.warn('Invite team member error:', err.message);
        }
      }

      res.json({ ok: true, message: 'Invitation dispatched & encrypted in SuperAdmin Vault', member: newMember });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  router.delete('/members/:id', async (req, res) => {
    const id = req.params.id;
    if (sqliteDb && id) {
      try { sqliteDb.prepare('DELETE FROM platform_team_members WHERE id = ?').run(id); } catch (e) {}
    }
    if (db && id) {
      try {
        await deleteDoc(doc(db, 'team_members', id));
      } catch (e) {}
    }
    res.json({ ok: true, message: `Member ${id} removed` });
  });

  return router;
}
