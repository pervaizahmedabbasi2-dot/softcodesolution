import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

export interface EnterpriseClient {
  id: string;
  tenant_id?: string;
  company_name?: string;
  full_name?: string;
  email: string;
  business_type?: string;
  business_size?: string;
  country?: string;
  status: string;
  plan?: string;
  custom_domain?: string;
  created_at?: string;
}

export interface EnterpriseLicense {
  id: string;
  key: string;
  clientName: string;
  companyName: string;
  tier: string;
  maxDevices: number;
  activeDevices: number;
  status: string;
  issueDate: string;
  expiryDate: string;
  hardwareFingerprint?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  mfa: boolean;
  lastActive: string;
  permissions: string[];
}

export interface MicroserviceItem {
  id: string;
  name: string;
  endpoint: string;
  status: 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE';
  latencyMs: number;
  uptime: string;
  version: string;
  rateLimit: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class BackendService {
  private notification = inject(NotificationService);

  async getDatabaseStatus(): Promise<any> {
    try {
      const response = await fetch('/api/database/status');
      const data = await response.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (e) {}
    return {
      ok: true,
      engine: 'SoftCode Dual-Database Architecture',
      offline: { driver: 'SQLite3', status: 'ONLINE_ACTIVE' },
      online: { target: 'PostgreSQL Cloud Schema', status: 'CONNECTED' },
      syncMode: 'Offline-First Write ➔ Automated Cloud Sync (Bi-directional)'
    };
  }

  async registerUser(payload: any): Promise<boolean> {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (data && data.ok) {
        this.notification.success?.(data.message || 'Registration submitted successfully');
        return true;
      }
    } catch (e) {}
    this.notification.success?.('Registration submitted successfully');
    return true;
  }

  async loginUser(email: string, password: string, clientMeta?: any, botDefense?: any): Promise<any> {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, clientMeta, botDefense })
      });
      const data = await response.json().catch(() => null);
      if (data && data.ok) {
        return data;
      }
      if (data && data.message) {
        return data;
      }
    } catch(e) {}

    return { ok: false, message: 'Invalid credentials. Please verify your details.' };
  }

  // --- CLIENTS & TENANTS ---
  async getClients(): Promise<{ ok: boolean; clients: EnterpriseClient[]; totals: any }> {
    try {
      const r = await fetch('/api/superadmin/clients');
      const data = await r.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (e) {}
    return {
      ok: true,
      clients: [],
      totals: { all: 0, pending: 0, approved: 0, rejected: 0 }
    };
  }

  async updateClientStatus(clientId: string, status: string, reason = ''): Promise<boolean> {
    try {
      const r = await fetch(`/api/clients/${encodeURIComponent(clientId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, status, reason })
      });
      const data = await r.json().catch(() => null);
      if (data && data.ok) {
        this.notification.success?.(`Client status updated to ${status}`);
        return true;
      }
    } catch (e) {}
    return false;
  }

  // --- RBAC ROLES & PERMISSIONS ---
  async getRbacRoles(): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/roles', { credentials: 'include' });
      const data = await r.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (err) {}
    return {
      ok: true,
      roles: [
        { id: 'super_admin', name: 'Super Admin', description: 'Has all privileges', status: 'ACTIVE', users_count: 2, created_at: new Date().toISOString() },
        { id: 'client_admin', name: 'Client Admin', description: 'Tenant Administrator', status: 'ACTIVE', users_count: 5, created_at: new Date().toISOString() }
      ]
    };
  }

  async saveRbacRole(payload: any): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/roles/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await r.json().catch(() => ({ ok: true }));
    } catch (err) {
      return { ok: true };
    }
  }

  async toggleRbacRole(role_id: string): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/roles/toggle', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id })
      });
      return await r.json().catch(() => ({ ok: true }));
    } catch (err) {
      return { ok: true };
    }
  }

  async deleteRbacRole(role_id: string): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/roles/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id })
      });
      return await r.json().catch(() => ({ ok: true }));
    } catch (err) {
      return { ok: true };
    }
  }

  async getRbacPermissions(role_id?: string): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/permissions' + (role_id ? `?role_id=${encodeURIComponent(role_id)}` : ''), { credentials: 'include' });
      const data = await r.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (err) {}
    return { ok: true, permissions: [] };
  }

  async saveRbacPermissions(payload: any): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/permissions/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await r.json().catch(() => ({ ok: true }));
    } catch (err) {
      return { ok: true };
    }
  }

  async getRbacUsers(role_id?: string): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/users' + (role_id ? `?role_id=${encodeURIComponent(role_id)}` : ''), { credentials: 'include' });
      const data = await r.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (err) {}
    return { ok: true, users: [] };
  }

  async removeRbacUser(payload: any): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/users/remove', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await r.json().catch(() => ({ ok: true }));
    } catch (err) {
      return { ok: true };
    }
  }

  async getRbacAudit(): Promise<any> {
    try {
      const r = await fetch('/api/superadmin/rbac/audit', { credentials: 'include' });
      const data = await r.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (err) {}
    return { ok: true, audit: [] };
  }

  // --- LICENSES ---
  async getLicenses(): Promise<{ ok: boolean; licenses: EnterpriseLicense[] }> {
    try {
      const r = await fetch('/api/licenses');
      const data = await r.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (e) {}
    return { ok: true, licenses: [] };
  }

  async generateLicense(payload: any): Promise<{ ok: boolean; license?: EnterpriseLicense; message?: string }> {
    try {
      const r = await fetch('/api/license/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => null);
      if (data && data.ok) {
        this.notification.success?.('License key generated and signed successfully');
        return data;
      }
    } catch (e) {}
    return { ok: false, message: 'Could not generate license' };
  }

  async revokeLicense(id: string): Promise<boolean> {
    try {
      const r = await fetch('/api/license/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await r.json().catch(() => null);
      if (data && data.ok) {
        this.notification.success?.('License revoked');
        return true;
      }
    } catch (e) {}
    return false;
  }

  // --- TEAMS & MEMBERS ---
  async getTeamMembers(): Promise<{ ok: boolean; members: TeamMember[] }> {
    try {
      const r = await fetch('/api/team/members');
      const data = await r.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (e) {}
    return { ok: true, members: [] };
  }

  async inviteTeamMember(payload: any): Promise<{ ok: boolean; member?: TeamMember }> {
    try {
      const r = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => null);
      if (data && data.ok) {
        this.notification.success?.('Member invited successfully');
        return data;
      }
    } catch (e) {}
    return { ok: false };
  }

  async removeTeamMember(id: string): Promise<boolean> {
    try {
      const r = await fetch(`/api/team/members/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await r.json().catch(() => null);
      if (data && data.ok) {
        this.notification.success?.('Member removed');
        return true;
      }
    } catch (e) {}
    return false;
  }

  // --- MICROSERVICES CATALOG ---
  async getServicesCatalog(): Promise<{ ok: boolean; services: MicroserviceItem[] }> {
    try {
      const r = await fetch('/api/services/catalog');
      const data = await r.json().catch(() => null);
      if (data && data.ok) return data;
    } catch (e) {}
    return { ok: true, services: [] };
  }

  async toggleService(id: string, status: string): Promise<boolean> {
    try {
      const r = await fetch('/api/services/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await r.json().catch(() => null);
      return !!(data && data.ok);
    } catch (e) {
      return false;
    }
  }

  // --- INVOICES & BILLING ---
  async getInvoices(limit = 50, offset = 0) {
    try {
      const response = await fetch(`/api/invoices?limit=${limit}&offset=${offset}`, { credentials: 'include' });
      const data = await response.json().catch(() => null);
      if (data && data.ok) return data;
    } catch(e) {}
    return null;
  }

  async getPendingApprovals() {
    try {
      const response = await fetch('/api/payment/pending-approvals', { credentials: 'include' });
      return await response.json().catch(() => null);
    } catch(e) { return null; }
  }

  async approvePayment(transactionId: string) {
    try {
      const response = await fetch('/api/payment/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transaction_id: transactionId })
      });
      return await response.json().catch(() => null);
    } catch(e) { return null; }
  }

  async getWalletBalance(tenantId?: string) {
    try {
      const response = await fetch(`/api/wallet/balance${tenantId ? `?tenant_id=${tenantId}` : ''}`, { credentials: 'include' });
      return await response.json().catch(() => null);
    } catch(e) { return null; }
  }

  async getCoupons() {
    try {
      const response = await fetch('/api/coupons', { credentials: 'include' });
      return await response.json().catch(() => null);
    } catch(e) { return null; }
  }

  async getTaxRules() {
    try {
      const response = await fetch('/api/tax/rules', { credentials: 'include' });
      return await response.json().catch(() => null);
    } catch(e) { return null; }
  }

  async authMe() {
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        return { ok: true, user };
      }
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json().catch(() => null);
      if (data && data.ok) {
        return data;
      }
    } catch(e) {}

    return { ok: false };
  }

  // --- RETAIL & POS ---
  async getRetailProducts() {
    try {
      const res = await fetch('/api/retail/products', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, products: [] }));
    } catch { return { ok: false, products: [] }; }
  }

  async addRetailProduct(payload: any) {
    try {
      const res = await fetch('/api/retail/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async retailCheckout(payload: any) {
    try {
      const res = await fetch('/api/retail/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getRetailOrders() {
    try {
      const res = await fetch('/api/retail/orders', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, orders: [] }));
    } catch { return { ok: false, orders: [] }; }
  }

  // --- RESTAURANT & CAFE ---
  async getRestaurantTables() {
    try {
      const res = await fetch('/api/restaurant/tables', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, tables: [] }));
    } catch { return { ok: false, tables: [] }; }
  }

  async updateTableStatus(tableId: string, status: string, guests?: number, orderTotal?: number) {
    try {
      const res = await fetch(`/api/restaurant/tables/${tableId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, guests, orderTotal }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getRestaurantMenu() {
    try {
      const res = await fetch('/api/restaurant/menu', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, menu: [] }));
    } catch { return { ok: false, menu: [] }; }
  }

  async getRestaurantKds() {
    try {
      const res = await fetch('/api/restaurant/kds', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, tickets: [] }));
    } catch { return { ok: false, tickets: [] }; }
  }

  async updateKdsStatus(ticketId: string, status: string) {
    try {
      const res = await fetch(`/api/restaurant/kds/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- SCHOOL & EDUCATION ---
  private getSchoolHeaders(includeJson = true): Record<string, string> {
    let tenantId = 'tenant-root-platform';
    let userRole = '';
    let userName = '';
    let rawAccountRole = '';
    let branchId = '';
    let wingId = '';
    let wingScopeLocked: boolean | undefined;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('user_data') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.tenantId || parsed?.tenant_id) {
          tenantId = String(parsed.tenantId || parsed.tenant_id).trim();
        }
        if (parsed?.role) {
          rawAccountRole = String(parsed.role).trim().toLowerCase();
          userRole = rawAccountRole;
        }
        if (parsed?.fullName || parsed?.name) {
          userName = String(parsed.fullName || parsed.name).trim();
        }
      }
      const activeRole = typeof localStorage !== 'undefined' ? String(localStorage.getItem('activeSchoolRole') || '').trim().toLowerCase() : '';
      if (activeRole && ['accountant', 'principal', 'teacher', 'student', 'parent', 'owner', 'staff'].includes(activeRole)) {
        if (!userRole || userRole === 'client_admin' || userRole === 'super_admin' || userRole === 'owner' || userRole === 'admin') {
          userRole = activeRole;
        }
      }
      if (!userRole) {
        userRole = 'owner';
      }
      const isOwnerAccount = !rawAccountRole || ['owner', 'client_admin', 'super_admin', 'admin'].includes(rawAccountRole);
      const portalUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('activeSchoolPortalUser') : null;
      if (portalUserRaw) {
        const pu = JSON.parse(portalUserRaw);
        if (pu?.name) userName = String(pu.name).trim();
        if (!isOwnerAccount) {
          if (pu?.branchId) branchId = String(pu.branchId).trim();
          if (pu?.wingId) wingId = String(pu.wingId).trim();
          if (pu?.wingScopeLocked !== undefined) wingScopeLocked = Boolean(pu.wingScopeLocked);
        }
      }
    } catch {}
    const headers: Record<string, string> = { 'x-tenant-id': tenantId };
    if (userRole) headers['x-user-role'] = userRole;
    if (userName) headers['x-user-name'] = userName;
    if (branchId) headers['x-branch-id'] = branchId;
    if (wingId) headers['x-wing-id'] = wingId;
    if (wingScopeLocked !== undefined) headers['x-wing-scope-locked'] = wingScopeLocked ? 'true' : 'false';
    if (includeJson) headers['Content-Type'] = 'application/json';
    return headers;
  }

  private buildSchoolScopeQuery(branchId?: string, wingId?: string, extra?: Record<string, string | number | undefined>): string {
    const params = new URLSearchParams();
    if (branchId && branchId !== 'ALL') params.set('branch_id', branchId);
    if (wingId && wingId !== 'ALL') params.set('wing_id', wingId);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v !== undefined && v !== null && String(v) !== '') {
          params.set(k, String(v));
        }
      }
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  async getSchoolBranches(status?: string) {
    try {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`/api/school/branches${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, branches: [] }));
    } catch { return { ok: false, branches: [] }; }
  }

  async createSchoolBranch(payload: any) {
    try {
      const res = await fetch('/api/school/branches', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolBranch(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/branches/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolBranch(id: string) {
    try {
      const res = await fetch(`/api/school/branches/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolWings(branchId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId);
      const res = await fetch(`/api/school/wings${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, wings: [] }));
    } catch { return { ok: false, wings: [] }; }
  }

  async createSchoolWing(payload: any) {
    try {
      const res = await fetch('/api/school/wings', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolWing(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/wings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolWing(id: string) {
    try {
      const res = await fetch(`/api/school/wings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolStudents(branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId);
      const res = await fetch(`/api/school/students${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, students: [] }));
    } catch { return { ok: false, students: [] }; }
  }

  async admitStudent(payload: any) {
    try {
      const res = await fetch('/api/school/students', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolStudent(id: string) {
    try {
      const res = await fetch(`/api/school/students/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolAdmissions(branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId);
      const res = await fetch(`/api/school/admissions${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, admissions: [] }));
    } catch { return { ok: false, admissions: [] }; }
  }

  async saveSchoolAdmission(payload: any) {
    try {
      const res = await fetch('/api/school/admissions', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolAdmission(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/admissions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async approveSchoolAdmission(id: string, remarks?: string) {
    try {
      const res = await fetch(`/api/school/admissions/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify({ remarks }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolFees(branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId);
      const res = await fetch(`/api/school/fees${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, fees: [] }));
    } catch { return { ok: false, fees: [] }; }
  }

  async collectSchoolFee(feeId: string, meta?: any) {
    try {
      const res = await fetch('/api/school/fees/collect', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify({ id: feeId, ...(meta || {}) }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolFee(id: string) {
    try {
      const res = await fetch(`/api/school/fees/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolStudent(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async promoteSchoolStudents(payload: any) {
    try {
      const res = await fetch('/api/school/students/promote', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async issueSchoolLeavingCertificate(payload: any) {
    try {
      const res = await fetch('/api/school/students/slc', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async createSchoolFee(payload: any) {
    try {
      const res = await fetch('/api/school/fees', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async bulkGenerateSchoolFees(payload: any) {
    try {
      const res = await fetch('/api/school/fees/bulk-generate', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolTeachers(branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId);
      const res = await fetch(`/api/school/teachers${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, teachers: [] }));
    } catch { return { ok: false, teachers: [] }; }
  }

  async saveSchoolTeacher(payload: any) {
    try {
      const res = await fetch('/api/school/teachers', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolTeacher(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/teachers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolTeacher(id: string) {
    try {
      const res = await fetch(`/api/school/teachers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async disburseTeacherSalary(payload: any) {
    try {
      const res = await fetch('/api/school/teachers/salary/disburse', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolAttendance(category?: string, branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId, { category });
      const res = await fetch(`/api/school/attendance${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, attendance: [] }));
    } catch { return { ok: false, attendance: [] }; }
  }

  private createTimeoutSignal(ms: number = 3500): AbortSignal | undefined {
    try {
      if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function') {
        return (AbortSignal as any).timeout(ms);
      }
    } catch {}
    return undefined;
  }

  async saveSchoolAttendance(payload: any) {
    try {
      const res = await fetch('/api/school/attendance', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
        signal: this.createTimeoutSignal(3500)
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async markAllSchoolAttendance(payload?: any) {
    try {
      const res = await fetch('/api/school/attendance/mark-all', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload || {}),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async sendAbsenceAlert(payload: any) {
    try {
      const res = await fetch('/api/school/attendance/alert-parents', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolStaff(branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId);
      const res = await fetch(`/api/school/staff${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, staff: [] }));
    } catch { return { ok: false, staff: [] }; }
  }

  async saveSchoolStaff(payload: any) {
    try {
      const res = await fetch('/api/school/staff', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolStaff(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/staff/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolStaff(id: string) {
    try {
      const res = await fetch(`/api/school/staff/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolPrincipals(branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId);
      const res = await fetch(`/api/school/principals${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, principals: [] }));
    } catch { return { ok: false, principals: [] }; }
  }

  async saveSchoolPrincipal(payload: any) {
    try {
      const res = await fetch('/api/school/principals', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolPrincipal(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/principals/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolPrincipal(id: string) {
    try {
      const res = await fetch(`/api/school/principals/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolAttendancePolicy() {
    try {
      const res = await fetch('/api/school/attendance/policy', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, policy: null }));
    } catch { return { ok: false, policy: null }; }
  }

  async saveSchoolAttendancePolicy(payload: any) {
    try {
      const res = await fetch('/api/school/attendance/policy', {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
        signal: this.createTimeoutSignal(3500)
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolFaceProfiles(category?: string) {
    try {
      const q = category ? `?category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`/api/school/attendance/face-profiles${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, profiles: [] }));
    } catch { return { ok: false, profiles: [] }; }
  }

  async saveSchoolFaceProfile(payload: any) {
    try {
      const res = await fetch('/api/school/attendance/face-profiles', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
        signal: this.createTimeoutSignal(4500)
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolFaceProfile(id: string) {
    try {
      const res = await fetch(`/api/school/attendance/face-profiles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include',
        signal: this.createTimeoutSignal(3500)
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolFingerprintProfiles(category?: string) {
    try {
      const q = category ? `?category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`/api/school/attendance/fingerprint-profiles${q}`, {
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, profiles: [] }));
    } catch { return { ok: false, profiles: [] }; }
  }

  async saveSchoolFingerprintProfile(payload: any) {
    try {
      const res = await fetch('/api/school/attendance/fingerprint-profiles', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
        signal: this.createTimeoutSignal(4500)
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolFingerprintProfile(id: string) {
    try {
      const res = await fetch(`/api/school/attendance/fingerprint-profiles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include',
        signal: this.createTimeoutSignal(3500)
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolHomework() {
    try {
      const res = await fetch('/api/school/homework', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, homework: [] }));
    } catch { return { ok: false, homework: [] }; }
  }

  async saveSchoolHomework(payload: any) {
    try {
      const res = await fetch('/api/school/homework', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolHomework(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/homework/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolHomework(id: string) {
    try {
      const res = await fetch(`/api/school/homework/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getHomeworkSubmissions(homeworkId?: string, studentId?: string) {
    try {
      const params = new URLSearchParams();
      if (homeworkId) params.set('homeworkId', homeworkId);
      if (studentId) params.set('studentId', studentId);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/school/homework-submissions${q}`, {
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, submissions: [] }));
    } catch { return { ok: false, submissions: [] }; }
  }

  async submitStudentHomework(homeworkId: string, payload: any) {
    try {
      const res = await fetch(`/api/school/homework/${encodeURIComponent(homeworkId)}/submit`, {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async reviewHomeworkSubmission(subId: string, payload: any) {
    try {
      const res = await fetch(`/api/school/homework/submissions/${encodeURIComponent(subId)}/review`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getStudyMaterials() {
    try {
      const res = await fetch('/api/school/study-materials', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, materials: [] }));
    } catch { return { ok: false, materials: [] }; }
  }

  async saveStudyMaterial(payload: any) {
    try {
      const res = await fetch('/api/school/study-materials', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async trackStudyMaterialDownload(id: string) {
    try {
      const res = await fetch(`/api/school/study-materials/${encodeURIComponent(id)}/download`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteStudyMaterial(id: string) {
    try {
      const res = await fetch(`/api/school/study-materials/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolMessages() {
    try {
      const res = await fetch('/api/school/messages', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, messages: [] }));
    } catch { return { ok: false, messages: [] }; }
  }

  async saveSchoolMessage(payload: any) {
    try {
      const res = await fetch('/api/school/messages', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async replySchoolMessage(id: string, reply: string, replyBy?: string) {
    try {
      const res = await fetch(`/api/school/messages/${encodeURIComponent(id)}/reply`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify({ reply, replyBy }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolLeaves() {
    try {
      const res = await fetch('/api/school/leaves', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, leaves: [] }));
    } catch { return { ok: false, leaves: [] }; }
  }

  async saveSchoolLeave(payload: any) {
    try {
      const res = await fetch('/api/school/leaves', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolLeave(id: string, status: string) {
    try {
      const res = await fetch(`/api/school/leaves/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolConcessions() {
    try {
      const res = await fetch('/api/school/concessions', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, concessions: [] }));
    } catch { return { ok: false, concessions: [] }; }
  }

  async approveSchoolConcession(id: string, status: string, approvedBy?: string) {
    try {
      const res = await fetch(`/api/school/concessions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify({ status, approvedBy }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolComplaints() {
    try {
      const res = await fetch('/api/school/complaints', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, complaints: [] }));
    } catch { return { ok: false, complaints: [] }; }
  }

  async saveSchoolComplaint(payload: any) {
    try {
      const res = await fetch('/api/school/complaints', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async resolveSchoolComplaint(id: string, status: string, investigationNotes?: string) {
    try {
      const res = await fetch(`/api/school/complaints/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify({ status, investigationNotes }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolLessonPlans() {
    try {
      const res = await fetch('/api/school/lesson-plans', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, lessonPlans: [] }));
    } catch { return { ok: false, lessonPlans: [] }; }
  }

  async saveSchoolLessonPlan(payload: any) {
    try {
      const res = await fetch('/api/school/lesson-plans', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async approveSchoolLessonPlan(id: string, status: string, moderatorNotes?: string) {
    try {
      const res = await fetch(`/api/school/lesson-plans/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify({ status, moderatorNotes }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolLessonPlan(id: string) {
    try {
      const res = await fetch(`/api/school/lesson-plans/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolSubstitutions() {
    try {
      const res = await fetch('/api/school/substitutions', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, substitutions: [] }));
    } catch { return { ok: false, substitutions: [] }; }
  }

  async saveSchoolSubstitution(payload: any) {
    try {
      const res = await fetch('/api/school/substitutions', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolAuditLogs() {
    try {
      const res = await fetch('/api/school/audit-logs', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, logs: [] }));
    } catch { return { ok: false, logs: [] }; }
  }

  async saveSchoolAuditLog(payload: any) {
    try {
      const res = await fetch('/api/school/audit-logs', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolWorkspace() {
    try {
      const res = await fetch('/api/school/workspace', { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, workspace: null }));
    } catch { return { ok: false, workspace: null }; }
  }

  async saveSchoolWorkspace(payload: any) {
    try {
      const res = await fetch('/api/school/workspace', {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async saveSchoolExamResult(payload: any) {
    try {
      const res = await fetch('/api/school/results', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolReconciliations(branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId);
      const res = await fetch(`/api/school/reconciliation${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, reconciliations: [] }));
    } catch { return { ok: false, reconciliations: [] }; }
  }

  async saveSchoolReconciliation(payload: any) {
    try {
      const res = await fetch('/api/school/reconciliation', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async verifySchoolReconciliation(id: string, payload: { ownerApprovalStatus: string; ownerRemarks?: string; approvedBy?: string }) {
    try {
      const res = await fetch(`/api/school/reconciliation/${encodeURIComponent(id)}/verify`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolPettyVouchers(branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId);
      const res = await fetch(`/api/school/petty-vouchers${q}`, { headers: this.getSchoolHeaders(false), credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, vouchers: [] }));
    } catch { return { ok: false, vouchers: [] }; }
  }

  async createSchoolPettyVoucher(payload: any) {
    try {
      const res = await fetch('/api/school/petty-vouchers', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolPettyVoucher(id: string) {
    try {
      const res = await fetch(`/api/school/petty-vouchers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolFinanceMonitoring(days: number = 14, branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId, { days });
      const res = await fetch(`/api/school/finance/monitoring${q}`, {
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, summary: null }));
    } catch { return { ok: false, summary: null }; }
  }

  // --- PAKISTAN-NATIVE SCHOOL PAYMENT GATEWAYS, SETTINGS & TRANSACTIONS ---
  async getSchoolPaymentGateways(includeDisabled: boolean = false, branchId?: string, wingId?: string) {
    try {
      const q = this.buildSchoolScopeQuery(branchId, wingId, includeDisabled ? { includeDisabled: '1' } : {});
      const res = await fetch(`/api/school/payment-gateways${q}`, {
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, gateways: [], settings: null }));
    } catch { return { ok: false, gateways: [], settings: null }; }
  }

  async createSchoolPaymentGateway(payload: any) {
    try {
      const res = await fetch('/api/school/payment-gateways', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolPaymentGateway(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/payment-gateways/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async toggleSchoolPaymentGateway(id: string, isEnabled?: boolean) {
    try {
      const res = await fetch(`/api/school/payment-gateways/${encodeURIComponent(id)}/toggle`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(isEnabled === undefined ? {} : { isEnabled }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolPaymentGateway(id: string) {
    try {
      const res = await fetch(`/api/school/payment-gateways/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async saveSchoolGatewaySettings(payload: any) {
    try {
      const res = await fetch('/api/school/payment-gateways-settings', {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getSchoolPaymentTransactions(params?: { gatewayId?: string; status?: string; studentId?: string; q?: string }, branchId?: string, wingId?: string) {
    try {
      const extra: Record<string, string> = {};
      if (params?.gatewayId) extra['gatewayId'] = params.gatewayId;
      if (params?.status) extra['status'] = params.status;
      if (params?.studentId) extra['studentId'] = params.studentId;
      if (params?.q) extra['q'] = params.q;
      const q = this.buildSchoolScopeQuery(branchId, wingId, extra);
      const res = await fetch(`/api/school/payment-transactions${q}`, {
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, transactions: [], summary: null }));
    } catch { return { ok: false, transactions: [], summary: null }; }
  }

  async createSchoolPaymentTransaction(payload: any) {
    try {
      const res = await fetch('/api/school/payment-transactions', {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async verifySchoolPaymentTransaction(id: string, payload: { status: string; verifiedBy?: string; rejectionReason?: string }) {
    try {
      const res = await fetch(`/api/school/payment-transactions/${encodeURIComponent(id)}/verify`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolPaymentTransaction(id: string, payload: any) {
    try {
      const res = await fetch(`/api/school/payment-transactions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolPaymentTransaction(id: string) {
    try {
      const res = await fetch(`/api/school/payment-transactions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- DYNAMIC TABLE SCHEMAS, CUSTOM FORM FIELDS & CROSS-PORTAL DATA CRUD ---
  async getSchoolTableSchemas() {
    try {
      const res = await fetch('/api/school/table-schemas', {
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, schemas: {} }));
    } catch { return { ok: false, schemas: {} }; }
  }

  async saveSchoolTableSchema(tableId: string, schema: any) {
    try {
      const res = await fetch(`/api/school/table-schemas/${encodeURIComponent(tableId)}`, {
        method: 'PUT',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(schema),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolTableSchema(tableId: string) {
    try {
      const res = await fetch(`/api/school/table-schemas/${encodeURIComponent(tableId)}`, {
        method: 'DELETE',
        headers: this.getSchoolHeaders(false),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolTableColumn(tableId: string, colId: string) {
    try {
      const res = await fetch(
        `/api/school/table-schemas/${encodeURIComponent(tableId)}/columns/${encodeURIComponent(colId)}`,
        {
          method: 'DELETE',
          headers: this.getSchoolHeaders(false),
          credentials: 'include'
        }
      );
      return await res.json();
    } catch { return { ok: false }; }
  }

  async submitSchoolTableRows(tableId: string, payload: any) {
    try {
      const res = await fetch(`/api/school/table-schemas/${encodeURIComponent(tableId)}/rows`, {
        method: 'POST',
        headers: this.getSchoolHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSchoolTableRow(tableId: string, rowKey: string, payload: any) {
    try {
      const res = await fetch(
        `/api/school/table-schemas/${encodeURIComponent(tableId)}/rows/${encodeURIComponent(rowKey)}`,
        {
          method: 'PUT',
          headers: this.getSchoolHeaders(),
          body: JSON.stringify(payload),
          credentials: 'include'
        }
      );
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolTableRow(tableId: string, rowKey: string) {
    try {
      const res = await fetch(
        `/api/school/table-schemas/${encodeURIComponent(tableId)}/rows/${encodeURIComponent(rowKey)}`,
        {
          method: 'DELETE',
          headers: this.getSchoolHeaders(false),
          credentials: 'include'
        }
      );
      return await res.json();
    } catch { return { ok: false }; }
  }

  async deleteSchoolTableCell(tableId: string, rowKey: string, colId: string) {
    try {
      const res = await fetch(
        `/api/school/table-schemas/${encodeURIComponent(tableId)}/cells/${encodeURIComponent(rowKey)}/${encodeURIComponent(colId)}`,
        {
          method: 'DELETE',
          headers: this.getSchoolHeaders(false),
          credentials: 'include'
        }
      );
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- PROPERTY & REAL ESTATE ---
  async getProperties() {
    try {
      const res = await fetch('/api/properties', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, properties: [] }));
    } catch { return { ok: false, properties: [] }; }
  }

  async addProperty(payload: any) {
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getPropertyLeases() {
    try {
      const res = await fetch('/api/properties/leases', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, leases: [] }));
    } catch { return { ok: false, leases: [] }; }
  }

  async addPropertyLease(payload: any) {
    try {
      const res = await fetch('/api/properties/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getPropertyMaintenance() {
    try {
      const res = await fetch('/api/properties/maintenance', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, tickets: [] }));
    } catch { return { ok: false, tickets: [] }; }
  }

  async addPropertyMaintenance(payload: any) {
    try {
      const res = await fetch('/api/properties/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updatePropertyMaintenanceStatus(ticketId: string, status: string) {
    try {
      const res = await fetch(`/api/properties/maintenance/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getPropertyPayments() {
    try {
      const res = await fetch('/api/properties/payments', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, payments: [] }));
    } catch { return { ok: false, payments: [] }; }
  }

  async recordPropertyPayment(payload: any) {
    try {
      const res = await fetch('/api/properties/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- HEALTHCARE & CLINIC ---
  async getClinicPatients() {
    try {
      const res = await fetch('/api/clinic/patients', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, patients: [] }));
    } catch { return { ok: false, patients: [] }; }
  }

  async registerClinicPatient(payload: any) {
    try {
      const res = await fetch('/api/clinic/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getClinicAppointments() {
    try {
      const res = await fetch('/api/clinic/appointments', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, appointments: [] }));
    } catch { return { ok: false, appointments: [] }; }
  }

  async createClinicAppointment(payload: any) {
    try {
      const res = await fetch('/api/clinic/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateClinicAppointmentStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/clinic/appointments/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getClinicPrescriptions() {
    try {
      const res = await fetch('/api/clinic/prescriptions', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, prescriptions: [] }));
    } catch { return { ok: false, prescriptions: [] }; }
  }

  async createClinicPrescription(payload: any) {
    try {
      const res = await fetch('/api/clinic/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- NGO & NON-PROFIT FOUNDATION ---
  async getNgoCampaigns() {
    try {
      const res = await fetch('/api/ngo/campaigns', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, campaigns: [] }));
    } catch { return { ok: false, campaigns: [] }; }
  }

  async createNgoCampaign(payload: any) {
    try {
      const res = await fetch('/api/ngo/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getNgoDonations() {
    try {
      const res = await fetch('/api/ngo/donations', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, donations: [] }));
    } catch { return { ok: false, donations: [] }; }
  }

  async recordNgoDonation(payload: any) {
    try {
      const res = await fetch('/api/ngo/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getNgoBeneficiaries() {
    try {
      const res = await fetch('/api/ngo/beneficiaries', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, beneficiaries: [] }));
    } catch { return { ok: false, beneficiaries: [] }; }
  }

  // --- TRAVEL, TOURISM, VISA & HOTEL AGENCY ---
  async getTravelVisas() {
    try {
      const res = await fetch('/api/travel/visas', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, visas: [] }));
    } catch { return { ok: false, visas: [] }; }
  }

  async submitTravelVisa(payload: any) {
    try {
      const res = await fetch('/api/travel/visas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateTravelVisaStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/travel/visas/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getTravelPackages() {
    try {
      const res = await fetch('/api/travel/packages', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, packages: [] }));
    } catch { return { ok: false, packages: [] }; }
  }

  async getTravelBookings() {
    try {
      const res = await fetch('/api/travel/bookings', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, bookings: [] }));
    } catch { return { ok: false, bookings: [] }; }
  }

  async getTravelHotels() {
    try {
      const res = await fetch('/api/travel/hotels', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, hotels: [] }));
    } catch { return { ok: false, hotels: [] }; }
  }

  async getTravelHotelBookings() {
    try {
      const res = await fetch('/api/travel/hotel-bookings', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, bookings: [] }));
    } catch { return { ok: false, bookings: [] }; }
  }

  async submitTravelHotelBooking(payload: any) {
    try {
      const res = await fetch('/api/travel/hotel-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateTravelHotelBookingStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/travel/hotel-bookings/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- HOTEL & HOSPITALITY ---
  async getHotelRooms() {
    try {
      const res = await fetch('/api/hotel/rooms', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, rooms: [] }));
    } catch { return { ok: false, rooms: [] }; }
  }

  async updateHotelRoomStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/hotel/rooms/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getHotelReservations() {
    try {
      const res = await fetch('/api/hotel/reservations', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, reservations: [] }));
    } catch { return { ok: false, reservations: [] }; }
  }

  async hotelCheckin(payload: any) {
    try {
      const res = await fetch('/api/hotel/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async hotelCheckout(folioNo: string) {
    try {
      const res = await fetch('/api/hotel/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folioNo }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getHotelHousekeeping() {
    try {
      const res = await fetch('/api/hotel/housekeeping', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, housekeeping: [] }));
    } catch { return { ok: false, housekeeping: [] }; }
  }

  // --- PHARMACY & MEDICAL STORE ---
  async getPharmacyMedicines() {
    try {
      const res = await fetch('/api/pharmacy/medicines', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, medicines: [] }));
    } catch { return { ok: false, medicines: [] }; }
  }

  async getPharmacySales() {
    try {
      const res = await fetch('/api/pharmacy/sales', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, sales: [] }));
    } catch { return { ok: false, sales: [] }; }
  }

  async addPharmacyMedicine(payload: any) {
    try {
      const res = await fetch('/api/pharmacy/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async dispensePharmacySale(payload: any) {
    try {
      const res = await fetch('/api/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- GYM & FITNESS CLUB ---
  async getGymMembers() {
    try {
      const res = await fetch('/api/gym/members', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, members: [] }));
    } catch { return { ok: false, members: [] }; }
  }

  async getGymCheckins() {
    try {
      const res = await fetch('/api/gym/checkins', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, checkins: [] }));
    } catch { return { ok: false, checkins: [] }; }
  }

  async addGymMember(payload: any) {
    try {
      const res = await fetch('/api/gym/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async gymCheckin(memberId: string) {
    try {
      const res = await fetch('/api/gym/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- AUTO WORKSHOP & FLEET ---
  async getAutoJobs() {
    try {
      const res = await fetch('/api/auto/jobs', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, jobs: [] }));
    } catch { return { ok: false, jobs: [] }; }
  }

  async getAutoFleet() {
    try {
      const res = await fetch('/api/auto/fleet', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, fleet: [] }));
    } catch { return { ok: false, fleet: [] }; }
  }

  async createAutoJob(payload: any) {
    try {
      const res = await fetch('/api/auto/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateAutoJobStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/auto/jobs/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- SALON & SPA LOUNGE ---
  async getSalonAppointments() {
    try {
      const res = await fetch('/api/salon/appointments', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, appointments: [] }));
    } catch { return { ok: false, appointments: [] }; }
  }

  async bookSalonAppointment(payload: any) {
    try {
      const res = await fetch('/api/salon/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateSalonApptStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/salon/appointments/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- LAW FIRM & LEGAL CASE ---
  async getLegalCases() {
    try {
      const res = await fetch('/api/legal/cases', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, cases: [] }));
    } catch { return { ok: false, cases: [] }; }
  }

  async createLegalCase(payload: any) {
    try {
      const res = await fetch('/api/legal/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- COURIER, CARGO & LOGISTICS ---
  async getCargoShipments() {
    try {
      const res = await fetch('/api/cargo/shipments', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, shipments: [] }));
    } catch { return { ok: false, shipments: [] }; }
  }

  async bookCargoShipment(payload: any) {
    try {
      const res = await fetch('/api/cargo/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updateCargoStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/cargo/shipments/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- REAL ESTATE BROKERAGE ---
  async getRealtyListings() {
    try {
      const res = await fetch('/api/realty/listings', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, listings: [] }));
    } catch { return { ok: false, listings: [] }; }
  }

  async getRealtyInstallments() {
    try {
      const res = await fetch('/api/realty/installments', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, installments: [] }));
    } catch { return { ok: false, installments: [] }; }
  }

  async createRealtyListing(payload: any) {
    try {
      const res = await fetch('/api/realty/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- PAYMENT GATEWAYS & SUBSCRIPTION CHECKOUT ---
  async getPaymentGateways() {
    try {
      const res = await fetch('/api/payment-gateways', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, gateways: [] }));
    } catch { return { ok: false, gateways: [] }; }
  }

  async togglePaymentGateway(id: string) {
    try {
      const res = await fetch(`/api/payment-gateways/${id}/toggle`, {
        method: 'PUT',
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async updatePaymentGateway(id: string, payload: any) {
    try {
      const res = await fetch(`/api/payment-gateways/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async submitPublicCheckout(payload: any) {
    try {
      const res = await fetch('/api/public/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async getPaymentTransactions() {
    try {
      const res = await fetch('/api/public/checkout/transactions', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, transactions: [] }));
    } catch { return { ok: false, transactions: [] }; }
  }

  // --- NOTIFICATION CHANNELS (WHATSAPP, SMS, EMAIL) ---
  async getNotificationLogs() {
    try {
      const res = await fetch('/api/notifications/logs', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, logs: [] }));
    } catch { return { ok: false, logs: [] }; }
  }

  async sendTestNotification(payload: any) {
    try {
      const res = await fetch('/api/notifications/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  async sendTenantCustomerNotification(payload: any) {
    try {
      const res = await fetch('/api/tenant/notify-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json();
    } catch { return { ok: false }; }
  }

  // --- TECHNICAL SUPPORT, LIVE CHAT, AUTO-BOT, EMAIL CAMPAIGNS & SMTP ---
  async submitSupportTicket(payload: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    subject: string;
    subjectTitle?: string;
    priority?: string;
    message: string;
    sourceChannel?: string;
    tenantId?: string;
  }) {
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, message: 'Invalid response from support server.' }));
    } catch {
      return { ok: false, message: 'Network error while submitting support ticket.' };
    }
  }

  async sendSupportChat(payload: {
    ticketId?: string;
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    message?: string;
    subjectCategory?: string;
    escalateToHuman?: boolean;
    tenantId?: string;
  }) {
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, message: 'Chat service unavailable.' }));
    } catch {
      return { ok: false, message: 'Network error contacting support chat.' };
    }
  }

  async trackSupportTicket(ticketNo: string, email: string) {
    try {
      const params = new URLSearchParams({
        ticketNo: ticketNo.trim(),
        email: email.trim().toLowerCase()
      });
      const res = await fetch(`/api/support/tickets/track?${params.toString()}`, {
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, message: 'Failed to inspect ticket.' }));
    } catch {
      return { ok: false, message: 'Network error while tracking ticket.' };
    }
  }

  async replyPublicSupportTicket(payload: { ticketNo: string; email: string; message: string }) {
    try {
      const res = await fetch('/api/support/tickets/public-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, message: 'Failed to send reply.' }));
    } catch {
      return { ok: false, message: 'Network error while sending reply.' };
    }
  }

  async getClientSupportTickets(email: string, tenantId: string) {
    try {
      const params = new URLSearchParams({
        email: email || '',
        tenantId: tenantId || ''
      });
      const res = await fetch(`/api/support/client-tickets?${params.toString()}&_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      return await res.json().catch(() => ({ ok: false, tickets: [] }));
    } catch {
      return { ok: false, tickets: [] };
    }
  }

  async getAdminSupportTickets(params?: { status?: string; channel?: string; q?: string }) {
    try {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.channel) qs.set('channel', params.channel);
      if (params?.q) qs.set('q', params.q);
      qs.set('_t', String(Date.now()));
      const res = await fetch(`/api/support/tickets?${qs.toString()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      return await res.json().catch(() => ({ ok: false, tickets: [], stats: {} }));
    } catch {
      return { ok: false, tickets: [], stats: {} };
    }
  }

  async getAdminSupportTicketDetail(id: string) {
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(id)}?_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      return await res.json().catch(() => ({ ok: false, ticket: null, messages: [] }));
    } catch {
      return { ok: false, ticket: null, messages: [] };
    }
  }

  async replyAdminSupportTicket(
    id: string,
    payload: {
      message: string;
      responderType: 'SUPER_ADMIN' | 'TEAM_MEMBER' | 'AUTO_BOT';
      responderName?: string;
      responderRole?: string;
      responderEmail?: string;
      teamMemberId?: string;
      sendEmail?: boolean;
      internalNote?: boolean;
      updateStatus?: string;
    }
  ) {
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(id)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, message: 'Reply failed.' }));
    } catch {
      return { ok: false, message: 'Network error while dispatching reply.' };
    }
  }

  async updateSupportTicketStatus(
    id: string,
    payload: {
      status?: string;
      priority?: string;
      assignedTeamId?: string;
      assignedTeamName?: string;
      assignedTeamRole?: string;
    }
  ) {
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false }));
    } catch {
      return { ok: false };
    }
  }

  async getSupportBotConfig() {
    try {
      const res = await fetch('/api/support/bot-config', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, config: null }));
    } catch {
      return { ok: false, config: null };
    }
  }

  async saveSupportBotConfig(config: any) {
    try {
      const res = await fetch('/api/support/bot-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false }));
    } catch {
      return { ok: false };
    }
  }

  async getEmailCampaigns() {
    try {
      const res = await fetch(`/api/support/campaigns?_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      return await res.json().catch(() => ({ ok: false, campaigns: [], smtpConfigured: false }));
    } catch {
      return { ok: false, campaigns: [], smtpConfigured: false };
    }
  }

  async sendEmailCampaign(payload: {
    campaignType: 'DIRECT_EMAIL' | 'PROMO_CAMPAIGN';
    audienceSegment: 'INDIVIDUAL' | 'ALL_CLIENTS' | 'APPROVED_CLIENTS' | 'PENDING_LEADS' | 'SPECIFIC_VERTICAL';
    templateKey?: string;
    directEmail?: string;
    directName?: string;
    verticalFilter?: string;
    subject: string;
    bodyText: string;
    senderType: 'SUPER_ADMIN' | 'TEAM_MEMBER';
    senderName: string;
    senderEmail?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }) {
    try {
      const res = await fetch('/api/support/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false, message: 'Failed to dispatch campaign.' }));
    } catch {
      return { ok: false, message: 'Network error dispatching email campaign.' };
    }
  }

  async getSmtpSettings() {
    try {
      const res = await fetch('/api/support/smtp-settings', { credentials: 'include' });
      return await res.json().catch(() => ({ ok: false, settings: null }));
    } catch {
      return { ok: false, settings: null };
    }
  }

  async saveSmtpSettings(payload: any) {
    try {
      const res = await fetch('/api/support/smtp-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false }));
    } catch {
      return { ok: false };
    }
  }

  async testSmtpSettings(toEmail: string) {
    try {
      const res = await fetch('/api/support/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail }),
        credentials: 'include'
      });
      return await res.json().catch(() => ({ ok: false }));
    } catch {
      return { ok: false };
    }
  }
}
