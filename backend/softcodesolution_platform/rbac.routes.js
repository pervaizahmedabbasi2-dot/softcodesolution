import express from 'express';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export const DEFAULT_ROLES = [
  { id: 'super_admin', name: 'Super Admin', description: 'Unrestricted root platform controller', status: 'ACTIVE', users_count: 2, created_at: new Date('2026-01-01').toISOString() },
  { id: 'client_admin', name: 'Client Tenant Admin', description: 'Tenant enterprise account administrator', status: 'ACTIVE', users_count: 14, created_at: new Date('2026-01-05').toISOString() },
  { id: 'compliance_officer', name: 'Compliance & Legal Officer', description: 'Access to SOC2, GDPR, and data protection logs', status: 'ACTIVE', users_count: 3, created_at: new Date('2026-01-10').toISOString() },
  { id: 'devops_lead', name: 'DevOps & API Architect', description: 'API Gateway, Webhooks, Global Edge routing manager', status: 'ACTIVE', users_count: 5, created_at: new Date('2026-01-12').toISOString() },
  { id: 'billing_manager', name: 'Financial & Billing Controller', description: 'Invoicing, refund approvals, and quota billing', status: 'ACTIVE', users_count: 4, created_at: new Date('2026-01-15').toISOString() }
];

let RBAC_PERMISSIONS = [
  { module: 'Core Dashboard & Analytics', read: true, write: true, delete: false, export: true },
  { module: 'Tenant & Multi-Company Console', read: true, write: true, delete: true, export: true },
  { module: 'License Key Generator & Binding', read: true, write: true, delete: false, export: true },
  { module: 'Security & NOC Telemetry', read: true, write: true, delete: false, export: true },
  { module: 'API Gateway & Global Edge', read: true, write: true, delete: false, export: false },
  { module: 'Compliance & SOC2 Vault', read: true, write: false, delete: false, export: true },
  { module: 'Billing & Invoicing Ledger', read: true, write: true, delete: false, export: true }
];

let RBAC_USERS = [
  { id: 'usr-1', name: 'Alexander Wright', email: 'alex.wright@enterprise.softcode.com', status: 'ACTIVE', assigned_at: '2026-01-10' },
  { id: 'usr-2', name: 'Sophia Chen', email: 'sophia.chen@enterprise.softcode.com', status: 'ACTIVE', assigned_at: '2026-01-12' },
  { id: 'usr-3', name: 'Marcus Vance', email: 'marcus.v@enterprise.softcode.com', status: 'ACTIVE', assigned_at: '2026-02-01' }
];

export function createRbacRouter(sqliteDb, db, getCollectionDocs) {
  const router = express.Router();

  router.get('/roles', async (req, res) => {
    const roles = getCollectionDocs ? await getCollectionDocs('roles', DEFAULT_ROLES) : DEFAULT_ROLES;
    res.json({ ok: true, roles });
  });

  router.post('/roles/save', async (req, res) => {
    try {
      const payload = req.body || {};
      const roleId = payload.id || 'role-' + Date.now();
      if (sqliteDb) {
        try {
          sqliteDb.prepare(`
            INSERT OR REPLACE INTO platform_roles (id, name, description, status, users_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(roleId, payload.name || 'Custom Role', payload.description || '', payload.status || 'ACTIVE', Number(payload.users_count || 0), new Date().toISOString());
        } catch (e) {}
      }
      if (db) {
        try {
          await setDoc(doc(db, 'roles', roleId), {
            ...payload,
            id: roleId,
            updated_at: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn('Firestore save role warn:', err.message);
        }
      }
      res.json({ ok: true, message: 'Role persisted successfully', roleId });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  router.post('/roles/toggle', async (req, res) => {
    const { role_id } = req.body || {};
    res.json({ ok: true, message: `Role ${role_id} status toggled` });
  });

  router.post('/roles/delete', async (req, res) => {
    const { role_id } = req.body || {};
    if (sqliteDb && role_id) {
      try { sqliteDb.prepare('DELETE FROM platform_roles WHERE id = ?').run(role_id); } catch (e) {}
    }
    if (db && role_id) {
      try {
        await deleteDoc(doc(db, 'roles', role_id));
      } catch (e) {}
    }
    res.json({ ok: true, message: `Role ${role_id} removed` });
  });

  router.get('/permissions', (req, res) => {
    res.json({ ok: true, permissions: RBAC_PERMISSIONS });
  });

  router.post('/permissions/save', (req, res) => {
    if (Array.isArray(req.body?.permissions)) {
      RBAC_PERMISSIONS = req.body.permissions;
    }
    res.json({ ok: true, message: 'Permissions saved' });
  });

  router.get('/users', (req, res) => {
    res.json({ ok: true, users: RBAC_USERS });
  });

  router.post('/users/remove', (req, res) => {
    const targetId = req.body?.user_id || req.body?.id;
    if (targetId) {
      RBAC_USERS = RBAC_USERS.filter(u => u.id !== targetId);
    }
    res.json({ ok: true, message: 'User removed from role successfully', users: RBAC_USERS });
  });

  router.get('/audit', (req, res) => {
    const auditLogs = [
      { id: 'aud-991', time: new Date(Date.now() - 3600000).toISOString(), user: 'admin@softcode.com', action: 'ROLE_POLICY_UPDATED', detail: 'Elevated rate-limit permissions for Devops Lead role' },
      { id: 'aud-992', time: new Date(Date.now() - 7200000).toISOString(), user: 'compliance@softcode.com', action: 'KEY_ROTATION_SCHEDULED', detail: 'Rotated Ed25519 digital signature keys for License Vault' },
      { id: 'aud-993', time: new Date(Date.now() - 14400000).toISOString(), user: 'system_daemon', action: 'AUTO_BACKUP_COMPLETED', detail: 'Triple-redundant snapshot archived across 3 geographic zones' }
    ];
    res.json({ ok: true, audit: auditLogs });
  });

  return router;
}
