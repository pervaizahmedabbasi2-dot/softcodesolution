import express from 'express';

export const DEFAULT_SERVICES = [
  { id: 'srv-auth', name: 'Auth & Identity Nexus', endpoint: '/api/v1/auth', status: 'HEALTHY', latencyMs: 18, uptime: '99.99%', version: 'v3.4.1', rateLimit: '10,000 req/min', description: 'Zero-trust JWT verification and RBAC evaluator' },
  { id: 'srv-gateway', name: 'Edge API Gateway', endpoint: '/api/v1/gateway', status: 'HEALTHY', latencyMs: 12, uptime: '100%', version: 'v2.9.0', rateLimit: '50,000 req/min', description: 'Global ingress reverse proxy with WAF DDoS mitigation' },
  { id: 'srv-license', name: 'License & Key Cryptor', endpoint: '/api/v1/license', status: 'HEALTHY', latencyMs: 24, uptime: '99.98%', version: 'v2.1.0', rateLimit: '5,000 req/min', description: 'Ed25519 digital signature validation and device binding' },
  { id: 'srv-ledger', name: 'Financial Invoicing Ledger', endpoint: '/api/v1/ledger', status: 'HEALTHY', latencyMs: 35, uptime: '99.95%', version: 'v1.8.2', rateLimit: '2,000 req/min', description: 'PCI-DSS certified multi-currency subscription processor' },
  { id: 'srv-storage', name: 'Triple-Backup Vault', endpoint: '/api/v1/vault', status: 'HEALTHY', latencyMs: 42, uptime: '99.99%', version: 'v4.0.0', rateLimit: '15,000 req/min', description: 'AES-256 GCM encrypted multi-region object storage' },
  { id: 'srv-events', name: 'Event Streaming Engine', endpoint: '/api/v1/events', status: 'HEALTHY', latencyMs: 9, uptime: '99.99%', version: 'v3.1.2', rateLimit: '100,000 req/min', description: 'Low-latency distributed Kafka-compatible webhook dispatcher' }
];

export function createServicesRouter(sqliteDb, db, getCollectionDocs) {
  const router = express.Router();

  router.get('/catalog', async (req, res) => {
    const services = getCollectionDocs ? await getCollectionDocs('services_catalog', DEFAULT_SERVICES) : DEFAULT_SERVICES;
    res.json({ ok: true, services });
  });

  router.post('/toggle', async (req, res) => {
    const { id, status } = req.body || {};
    const svc = DEFAULT_SERVICES.find(s => s.id === id);
    if (svc && status) {
      svc.status = status;
    }
    res.json({ ok: true, message: `Service ${id} status changed to ${status}` });
  });

  return router;
}
