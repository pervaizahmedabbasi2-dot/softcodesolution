import express from 'express';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export function createSuperAdminRouter(sqliteDb, db) {
  const router = express.Router();

  router.get('/clients', async (req, res) => {
    try {
      let clients = [];
      
      if (sqliteDb) {
        try {
          const stmt = sqliteDb.prepare('SELECT * FROM local_tenants ORDER BY created_at DESC');
          const rows = stmt.all ? stmt.all() : [];
          if (rows.length > 0) {
            clients = rows.map(r => ({
              id: r.id,
              tenant_id: r.tenant_id,
              company_name: r.company_name,
              full_name: r.full_name,
              email: r.email,
              phone: r.phone,
              business_type: r.business_type,
              business_size: r.business_size,
              country: r.country,
              city: r.city,
              status: r.is_synced === 1 ? 'approved' : 'pending',
              plan: (r.business_type || 'General').toUpperCase() + ' Enterprise',
              custom_domain: r.custom_domain || (r.tenant_id + '.softcode.local'),
              created_at: r.created_at
            }));
          }
        } catch (sqlErr) {
          console.warn("SQLite clients fetch warning:", sqlErr.message);
        }
      }

      if (clients.length === 0 && db) {
        try {
          const snapshot = await getDocs(collection(db, 'clients'));
          clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {}
      }

      const pending = clients.filter(c => (c.status || '').toLowerCase() === 'pending').length;
      const approved = clients.filter(c => (c.status || '').toLowerCase() === 'approved').length;
      const rejected = clients.filter(c => (c.status || '').toLowerCase() === 'rejected').length;

      res.json({
        ok: true,
        clients,
        totals: {
          all: clients.length,
          pending,
          approved,
          rejected
        }
      });
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  const handleStatusChange = async (req, res) => {
    try {
      const clientId = req.params.id || req.body.clientId || req.body.id;
      const status = req.body.status || 'approved';
      const reason = req.body.reason || '';

      if (!clientId) {
        return res.status(400).json({ ok: false, message: "Client ID is required" });
      }

      if (sqliteDb) {
        try {
          sqliteDb.prepare('UPDATE local_tenants SET is_synced = ? WHERE id = ?').run(status === 'approved' ? 1 : 0, clientId);
        } catch (e) {}
      }

      if (db) {
        try {
          const clientRef = doc(db, 'clients', clientId);
          await updateDoc(clientRef, {
            status: status.toLowerCase(),
            status_reason: reason,
            status_updated_at: new Date().toISOString()
          });
        } catch (err) {}
      }

      res.json({
        ok: true,
        message: `Client ${clientId} status updated to ${status}`,
        clientId,
        status
      });
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  };

  router.post('/clients/status', handleStatusChange);
  router.post('/clients/:id/status', handleStatusChange);
  router.put('/clients/:id/status', handleStatusChange);
  router.post('/clients/approve', async (req, res) => {
    const id = req.body.id || req.body.clientId;
    if (sqliteDb && id) {
      try { sqliteDb.prepare('UPDATE local_tenants SET is_synced = 1 WHERE id = ?').run(id); } catch (e) {}
    }
    res.json({ ok: true, message: 'Client approved successfully' });
  });

  router.post('/clients/reject', async (req, res) => {
    const id = req.body.id || req.body.clientId;
    if (sqliteDb && id) {
      try { sqliteDb.prepare('UPDATE local_tenants SET is_synced = 0 WHERE id = ?').run(id); } catch (e) {}
    }
    res.json({ ok: true, message: 'Client rejected successfully' });
  });

  return router;
}
