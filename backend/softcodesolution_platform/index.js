import { createPlatformRouter } from './platform.routes.js';
import { createBillingRouter } from './billing.routes.js';
import { createNotificationsRouter } from './notifications.routes.js';
import { createCatalogRouter, ALL_ENTERPRISE_MODULES } from './catalog.routes.js';
import { createRbacRouter } from './rbac.routes.js';
import { createLicensesRouter } from './licenses.routes.js';
import { createTeamsRouter } from './teams.routes.js';
import { createServicesRouter } from './services.routes.js';

export function mountSoftCodePlatform(app, { sqliteDb, db, sqliteDbPath, getCollectionDocs }) {
  // 1. Platform Core Health, Modules & Dual-DB Status
  const platformRouter = createPlatformRouter(sqliteDb, db, () => ALL_ENTERPRISE_MODULES, sqliteDbPath);
  app.use('/api/platform', platformRouter);
  app.use('/api', platformRouter); // Exposes /api/database/status without moving endpoints

  // 2. SuperAdmin RBAC (Roles, Permissions, Users, Audit)
  app.use('/api/superadmin/rbac', createRbacRouter(sqliteDb, db, getCollectionDocs));

  // 3. Enterprise License Key Management
  app.use('/api', createLicensesRouter(sqliteDb, db, getCollectionDocs));

  // 4. Company Team & Members Management
  app.use('/api/team', createTeamsRouter(sqliteDb, db, getCollectionDocs));

  // 5. Microservices Orchestration Catalog
  app.use('/api/services', createServicesRouter(sqliteDb, db, getCollectionDocs));

  // 6. Billing, Invoices, Wallet, Coupons, Tax, Payment Gateways & Public Checkout
  app.use('/api', createBillingRouter(sqliteDb, db, getCollectionDocs));

  // 7. Multi-Channel Notification & WhatsApp Dispatch Engine
  app.use('/api', createNotificationsRouter(sqliteDb, db));

  // 8. Business Types, 221-Module Catalog, Plans, Subscriptions & Matrix
  app.use('/api', createCatalogRouter(sqliteDb, db));
}
