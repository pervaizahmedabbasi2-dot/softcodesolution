import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { BackendService } from '../../services/backend.service';

type RbacActionKey =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'manage';

type RbacRoleFilter = 'all' | 'system' | 'custom';
type RbacStatusFilter = 'all' | 'active' | 'disabled';
type RbacDetailTab = 'overview' | 'permissions' | 'users' | 'audit';
type RbacPreset = 'super' | 'clientAdmin' | 'clientUser' | 'support' | 'empty';

export interface RbacModuleDefinition {
  code: string;
  name: string;
  group: string;
  description: string;
}

export interface RbacUserItem {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  roleScope: string;
}

export interface RbacAuditEvent {
  time: string;
  title: string;
  detail: string;
  level: 'info' | 'success' | 'warning';
}

export interface RbacRole {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  isSystem: boolean;
  status: 'active' | 'disabled';
  scope: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  inheritsFrom: string;
  permissions: Record<string, Partial<Record<RbacActionKey, boolean>>>;
}

type PermissionsMatrix = Record<string, Partial<Record<RbacActionKey, boolean>>>;

@Component({
  selector: 'app-dashboard-rbac',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './rbac.component.html',
  styles: [':host{display:block;width:100%;}']
})
export class DashboardRbacComponent {
  @Input() activeView = '';
  @Input() userRole = '';
  @Input() icons: any = {};
  @Output() navigate = new EventEmitter<string>();

  readonly actionLabels: Array<{ key: RbacActionKey; label: string }> = [
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete' },
    { key: 'approve', label: 'Approve' },
    { key: 'export', label: 'Export' },
    { key: 'manage', label: 'Manage' }
  ];

  readonly modules: RbacModuleDefinition[] = [
    { code: 'dashboard', name: 'Dashboard', group: 'Core', description: 'Main overview and KPI panels' },
    { code: 'users', name: 'Users', group: 'Core', description: 'User management and identity access' },
    { code: 'roles_permissions', name: 'Roles & Permissions', group: 'Governance', description: 'Role lifecycle and access policy control' },
    { code: 'audit_logs', name: 'Audit Logs', group: 'Governance', description: 'Track security and administrative actions' },
    { code: 'all_clients', name: 'All Clients', group: 'Clients', description: 'Approve, suspend, edit and review clients' },
    { code: 'tenants', name: 'Tenants', group: 'Clients', description: 'Multi-company tenant operations' },
    { code: 'payments', name: 'Payments', group: 'Billing', description: 'Invoices, receipts and payment control' },
    { code: 'plans_pricing', name: 'Plans & Pricing', group: 'Billing', description: 'Billing tiers and pricing rules' },
    { code: 'license', name: 'License', group: 'Billing', description: 'Device and license controls' },
    { code: 'saas_control', name: 'SaaS Control', group: 'Platform', description: 'Command centre for subscriptions and access' },
    { code: 'business_suites', name: 'Business Suites', group: 'Platform', description: 'Business-specific package management' },
    { code: 'module_catalog', name: 'Module Catalog', group: 'Platform', description: 'Global module and price catalog' },
    { code: 'analytics', name: 'Analytics', group: 'Intelligence', description: 'Reports, trends and usage visibility' },
    { code: 'system_health', name: 'System Health', group: 'Operations', description: 'Database, API and worker status' },
    { code: 'frontend', name: 'Frontend / Marketplace', group: 'Content', description: 'Public pages and marketplace surface' },
    { code: 'blogs', name: 'Blogs', group: 'Content', description: 'Content publishing and editorial control' },
    { code: 'settings', name: 'Settings', group: 'Security', description: 'Global and tenant configuration' },
    { code: 'api_gateway', name: 'API Gateway', group: 'Security', description: 'Endpoint security and API controls' },
    { code: 'updater', name: 'Updater', group: 'Operations', description: 'Versioning, rollouts and update controls' }
  ];

  private readonly userDirectory: Record<string, RbacUserItem[]> = {
    role_super_admin: [
      { id: 'u1', name: 'Pervaiz Ahmed', email: 'pervaiz@example.com', status: 'active', roleScope: 'Platform' },
      { id: 'u2', name: 'Platform Owner', email: 'owner@example.com', status: 'active', roleScope: 'Platform' }
    ],
    role_client_admin: [
      { id: 'u3', name: 'Client Admin One', email: 'admin1@example.com', status: 'active', roleScope: 'Tenant' },
      { id: 'u4', name: 'Client Admin Two', email: 'admin2@example.com', status: 'active', roleScope: 'Tenant' }
    ],
    role_client_user: [
      { id: 'u5', name: 'Branch User', email: 'user1@example.com', status: 'active', roleScope: 'Branch' },
      { id: 'u6', name: 'Operations User', email: 'user2@example.com', status: 'inactive', roleScope: 'Department' }
    ],
    role_support: [
      { id: 'u7', name: 'Support Lead', email: 'support1@example.com', status: 'active', roleScope: 'Platform' }
    ],
    role_sales_manager: [
      { id: 'u8', name: 'Sales Manager', email: 'sales@example.com', status: 'active', roleScope: 'Branch' }
    ],
    role_billing_admin: [
      { id: 'u9', name: 'Billing Admin', email: 'billing@example.com', status: 'active', roleScope: 'Tenant' }
    ],
    role_ops_manager: [
      { id: 'u10', name: 'Ops Manager', email: 'ops@example.com', status: 'active', roleScope: 'Department' }
    ]
  };

  roles: RbacRole[] = this.seedRoles();

  searchQuery = '';
  roleFilter: RbacRoleFilter = 'all';
  statusFilter: RbacStatusFilter = 'all';
  detailTab: RbacDetailTab = 'permissions';

  selectedRoleId = 'role_super_admin';

  editorOpen = false;
  editorMode: 'create' | 'edit' = 'create';
  editorDraft: RbacRole | null = null;

  auditEvents: RbacAuditEvent[] = [
    { time: this.nowLabel(), title: 'RBAC loaded', detail: 'Frontend enterprise shell ready', level: 'success' },
    { time: this.nowLabel(), title: 'System roles protected', detail: 'Core roles stay locked from destructive edits', level: 'info' }
  ];

  permissionDraft: Record<string, boolean> | null = null;
  permissionDirty = false;


  private readonly backend = inject(BackendService);

  constructor() {
    this.ensureSelection();
    this.loadRoles();
  }

  async loadRoles(){

    try{

      const res=await this.backend.getRbacRoles();

      if(res?.ok && Array.isArray(res.roles) && res.roles.length){

        this.roles=res.roles;
        this.ensureSelection();

      }

    }catch(err){

      console.error("RBAC roles load failed",err);

    }

  }

  private nowLabel(): string {
    return new Date().toLocaleString();
  }

  private allActionKeys(): RbacActionKey[] {
    return this.actionLabels.map(item => item.key);
  }

  private emptyRow(): Partial<Record<RbacActionKey, boolean>> {
    return {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      export: false,
      manage: false
    };
  }

  private permissionRow(values: Partial<Record<RbacActionKey, boolean>> = {}): Partial<Record<RbacActionKey, boolean>> {
    return { ...this.emptyRow(), ...values };
  }

  private generatePermissions(preset: RbacPreset): PermissionsMatrix {
    const matrix: PermissionsMatrix = {};

    for (const module of this.modules) {
      let row: Partial<Record<RbacActionKey, boolean>> = this.emptyRow();

      switch (preset) {
        case 'super':
          row = this.permissionRow({
            view: true,
            create: true,
            edit: true,
            delete: true,
            approve: true,
            export: true,
            manage: true
          });
          break;

        case 'clientAdmin':
          if (['dashboard', 'users', 'all_clients', 'tenants', 'payments', 'plans_pricing', 'license', 'saas_control', 'business_suites', 'module_catalog', 'settings'].includes(module.code)) {
            row = this.permissionRow({
              view: true,
              create: true,
              edit: true,
              delete: false,
              approve: true,
              export: true,
              manage: true
            });
          } else if (['analytics', 'audit_logs', 'system_health'].includes(module.code)) {
            row = this.permissionRow({
              view: true,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              export: true,
              manage: false
            });
          } else {
            row = this.permissionRow({
              view: true,
              create: true,
              edit: true,
              delete: false,
              approve: false,
              export: false,
              manage: true
            });
          }
          break;

        case 'clientUser':
          if (['dashboard', 'all_clients', 'analytics', 'system_health', 'frontend', 'blogs'].includes(module.code)) {
            row = this.permissionRow({
              view: true,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              export: true,
              manage: false
            });
          } else {
            row = this.permissionRow({
              view: true,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              export: false,
              manage: false
            });
          }
          break;

        case 'support':
          if (['dashboard', 'all_clients', 'analytics', 'audit_logs', 'system_health'].includes(module.code)) {
            row = this.permissionRow({
              view: true,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              export: true,
              manage: false
            });
          } else if (['users', 'settings'].includes(module.code)) {
            row = this.permissionRow({
              view: true,
              create: false,
              edit: true,
              delete: false,
              approve: false,
              export: false,
              manage: false
            });
          } else {
            row = this.permissionRow({
              view: false,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              export: false,
              manage: false
            });
          }
          break;

        case 'empty':
          row = this.permissionRow();
          break;
      }

      matrix[module.code] = row;
    }

    return matrix;
  }

  private seedRoles(): RbacRole[] {
    return [
      {
        id: 'role_super_admin',
        name: 'Super Admin',
        description: 'Unrestricted platform access across every module and tenant.',
        usersCount: 2,
        isSystem: true,
        status: 'active',
        scope: 'Platform',
        createdBy: 'System',
        createdAt: 'Always',
        updatedAt: this.nowLabel(),
        inheritsFrom: '',
        permissions: this.generatePermissions('super')
      },
      {
        id: 'role_client_admin',
        name: 'Client Admin',
        description: 'Tenant-level administration with billing, clients and module control.',
        usersCount: 154,
        isSystem: true,
        status: 'active',
        scope: 'Tenant',
        createdBy: 'System',
        createdAt: 'Always',
        updatedAt: this.nowLabel(),
        inheritsFrom: '',
        permissions: this.generatePermissions('clientAdmin')
      },
      {
        id: 'role_client_user',
        name: 'Client User',
        description: 'Restricted operational access for day-to-day business work.',
        usersCount: 812,
        isSystem: true,
        status: 'active',
        scope: 'Branch',
        createdBy: 'System',
        createdAt: 'Always',
        updatedAt: this.nowLabel(),
        inheritsFrom: '',
        permissions: this.generatePermissions('clientUser')
      },
      {
        id: 'role_support',
        name: 'Support',
        description: 'Support desk access to inspect health, logs and client state.',
        usersCount: 24,
        isSystem: true,
        status: 'active',
        scope: 'Platform',
        createdBy: 'System',
        createdAt: 'Always',
        updatedAt: this.nowLabel(),
        inheritsFrom: '',
        permissions: this.generatePermissions('support')
      },
      {
        id: 'role_sales_manager',
        name: 'Sales Manager',
        description: 'Custom sales access with lead, client and billing visibility.',
        usersCount: 14,
        isSystem: false,
        status: 'active',
        scope: 'Tenant',
        createdBy: 'Pervaiz Ahmed',
        createdAt: this.nowLabel(),
        updatedAt: this.nowLabel(),
        inheritsFrom: 'role_client_admin',
        permissions: this.generatePermissions('empty')
      },
      {
        id: 'role_billing_admin',
        name: 'Billing Admin',
        description: 'Custom billing and subscription operations for finance teams.',
        usersCount: 9,
        isSystem: false,
        status: 'active',
        scope: 'Tenant',
        createdBy: 'Pervaiz Ahmed',
        createdAt: this.nowLabel(),
        updatedAt: this.nowLabel(),
        inheritsFrom: 'role_client_admin',
        permissions: this.generatePermissions('empty')
      },
      {
        id: 'role_ops_manager',
        name: 'Operations Manager',
        description: 'Operational control for branches, staff and system review.',
        usersCount: 11,
        isSystem: false,
        status: 'disabled',
        scope: 'Branch',
        createdBy: 'Pervaiz Ahmed',
        createdAt: this.nowLabel(),
        updatedAt: this.nowLabel(),
        inheritsFrom: 'role_client_user',
        permissions: this.generatePermissions('empty')
      }
    ];
  }

  get moduleGroups(): Array<{ group: string; modules: RbacModuleDefinition[] }> {
    const map = new Map<string, RbacModuleDefinition[]>();

    for (const module of this.modules) {
      const list = map.get(module.group) || [];
      list.push(module);
      map.set(module.group, list);
    }

    return Array.from(map.entries()).map(([group, modules]) => ({
      group,
      modules
    }));
  }

  get filteredRoles(): RbacRole[] {
    const q = this.searchQuery.trim().toLowerCase();

    return this.roles.filter(role => {
      const matchesQuery =
        !q ||
        role.name.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q) ||
        role.scope.toLowerCase().includes(q);

      const matchesType =
        this.roleFilter === 'all' ||
        (this.roleFilter === 'system' && role.isSystem) ||
        (this.roleFilter === 'custom' && !role.isSystem);

      const matchesStatus =
        this.statusFilter === 'all' ||
        role.status === this.statusFilter;

      return matchesQuery && matchesType && matchesStatus;
    });
  }

  get selectedRole(): RbacRole | undefined {
    return this.roles.find(role => role.id === this.selectedRoleId) || this.roles[0];
  }

  get selectedUsers(): RbacUserItem[] {
    const role = this.selectedRole;
    if (!role) return [];
    return this.userDirectory[role.id] || [];
  }

  get totalRoles(): number {
    return this.roles.length;
  }

  get systemRolesCount(): number {
    return this.roles.filter(role => role.isSystem).length;
  }

  get customRolesCount(): number {
    return this.roles.filter(role => !role.isSystem).length;
  }

  get totalUsersAssigned(): number {
    return this.roles.reduce((sum, role) => sum + Number(role.usersCount || 0), 0);
  }

  get permissionChangesCount(): number {
    return this.auditEvents.length;
  }

  get totalGrantedPermissions(): number {
    return this.roles.reduce((sum, role) => sum + this.grantedPermissionCount(role), 0);
  }

  ensureSelection(): void {
    if (!this.roles.some(role => role.id === this.selectedRoleId)) {
      this.selectedRoleId = this.roles[0]?.id || '';
    }
  }

  trackByRole(_index: number, role: RbacRole): string {
    return role.id;
  }

  trackByModule(_index: number, module: RbacModuleDefinition): string {
    return module.code;
  }

  trackByUser(_index: number, user: RbacUserItem): string {
    return user.id;
  }

  trackByGroup(_index: number, group: { group: string }): string {
    return group.group;
  }

  setSearch(value: string): void {
    this.searchQuery = String(value || '');
  }

  setRoleFilter(value: string): void {
    this.roleFilter = value === 'system' || value === 'custom' ? value : 'all';
  }

  setStatusFilter(value: string): void {
    this.statusFilter = value === 'active' || value === 'disabled' ? value : 'all';
  }

  setDetailTab(tab: RbacDetailTab): void {
    this.detailTab = tab;
    if (tab === 'audit') {
      this.loadAuditLogs();
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
  }

  async selectRole(roleId: string): Promise<void> {
    this.selectedRoleId = roleId;
    this.detailTab = 'overview';
    this.editorOpen = false;
    this.editorDraft = null;
    await this.loadLiveRoleData(roleId);
  }

  async loadLiveRoleData(roleId: string) {
    try {
      const pRes = await this.backend.getRbacPermissions(roleId);
      if (pRes?.ok && this.selectedRole) {
        this.selectedRole.permissions = pRes.permissions || this.generatePermissions('empty');

        this.permissionDraft = JSON.parse(
          JSON.stringify(this.selectedRole.permissions)
        );

        this.permissionDirty = false;
      }

      const uRes = await this.backend.getRbacUsers(roleId);
      if (uRes?.ok) {
        this.userDirectory[roleId] = uRes.users || [];
      }
    } catch(err) {
      console.error("Live data load failed", err);
    }
  }

  async loadAuditLogs() {
    try {
      const res = await this.backend.getRbacAudit();
      if (res?.ok && res.audit_logs) {
        this.auditEvents = res.audit_logs;
      }
    } catch(err) {
      console.error("Audit load failed", err);
    }
  }

  private audit(title: string, detail: string, level: 'info' | 'success' | 'warning' = 'info'): void {
    this.auditEvents = [
      {
        time: this.nowLabel(),
        title,
        detail,
        level
      },
      ...this.auditEvents
    ].slice(0, 30);
  }

  createRoleId(name: string): string {
    const base = String(name || 'role')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    return `${base || 'role'}_${Date.now()}`;
  }

  openCreateRole(): void {
    const draftName = 'New Custom Role';

    this.editorMode = 'create';
    this.editorDraft = {
      id: this.createRoleId(draftName),
      name: draftName,
      description: '',
      usersCount: 0,
      isSystem: false,
      status: 'active',
      scope: 'Tenant',
      createdBy: 'Pervaiz Ahmed',
      createdAt: this.nowLabel(),
      updatedAt: this.nowLabel(),
      inheritsFrom: this.selectedRole?.isSystem ? this.selectedRole.id : '',
      permissions: this.generatePermissions('empty')
    };

    this.editorOpen = true;
  }

  openEditRole(role: RbacRole): void {
    if (role.isSystem) return;

    this.editorMode = 'edit';
    this.editorDraft = JSON.parse(JSON.stringify(role)) as RbacRole;
    this.editorOpen = true;
  }

  duplicateRole(role: RbacRole): void {
    const copyName = `${role.name} Copy`;
    this.editorMode = 'create';
    this.editorDraft = {
      ...JSON.parse(JSON.stringify(role)),
      id: this.createRoleId(copyName),
      name: copyName,
      isSystem: false,
      status: 'active',
      usersCount: 0,
      createdBy: 'Pervaiz Ahmed',
      createdAt: this.nowLabel(),
      updatedAt: this.nowLabel(),
      inheritsFrom: role.id
    };
    this.editorOpen = true;
  }

  async saveCurrentPermissions(): Promise<void> {
    const role = this.selectedRole;
    if (!role || role.isSystem) return;
    try {
      const res = await this.backend.saveRbacPermissions({
        role_id: role.id,
        permissions: this.permissionDraft ?? role.permissions
      });
      if (res?.ok) {

        role.permissions = JSON.parse(
          JSON.stringify(this.permissionDraft ?? role.permissions)
        );

        this.permissionDirty = false;

        this.audit('Permissions saved', role.name + ' permissions persisted to database', 'success');
      } else {
        this.audit('Permissions save failed', res?.message || 'Backend rejected request', 'warning');
      }
    } catch (err) {
      console.error(err);
      this.audit('Permissions save failed', 'Unable to reach backend', 'warning');
    }
  }

  async removeUserFromRole(userId: string): Promise<void> {
    const role = this.selectedRole;
    if (!role) return;
    try {
      const res = await this.backend.removeRbacUser({ role_id: role.id, user_id: userId });
      if (res?.ok) {
        this.userDirectory[role.id] = (this.userDirectory[role.id] || []).filter(u => u.id !== userId);
        this.audit('User removed', 'User removed from ' + role.name, 'success');
        await this.loadRoles();
      } else {
        this.audit('Remove failed', res?.message || 'Backend rejected request', 'warning');
      }
    } catch (err) {
      console.error(err);
      this.audit('Remove user failed', 'Unable to reach backend', 'warning');
    }
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.editorDraft = null;
  }

  async saveRole(): Promise<void> {
    if (!this.editorDraft) return;

    const draft = JSON.parse(JSON.stringify(this.editorDraft)) as RbacRole;
    draft.name = draft.name.trim();
    draft.description = draft.description.trim();
    draft.scope = draft.scope || 'Tenant';
    draft.updatedAt = this.nowLabel();

    if (!draft.name) {
      this.audit('Role save blocked', 'Role name is required', 'warning');
      return;
    }

    try {

      const res = await this.backend.saveRbacRole(draft);

      if (!res?.ok) {
        this.audit('Role save failed', res?.message || 'Backend rejected request', 'warning');
        return;
      }
      
      // Save permissions matrix safely to backend
      await this.backend.saveRbacPermissions({ role_id: draft.id, permissions: draft.permissions });

      await this.loadRoles();

      this.audit(
        this.editorMode === 'create' ? 'Role created' : 'Role updated',
        draft.name + ' saved to backend',
        'success'
      );

    } catch (err) {

      console.error(err);

      this.audit(
        'Role save failed',
        'Unable to reach backend',
        'warning'
      );

      return;

    }

    this.selectedRoleId = draft.id;
    this.editorOpen = false;
    this.editorDraft = null;
    this.ensureSelection();
  }

  async toggleRoleStatus(role: RbacRole): Promise<void> {
    if (role.isSystem) return;

    const res=await this.backend.toggleRbacRole(role.id);

    if(!res?.ok){
      this.audit('Toggle failed','Backend rejected request','warning');
      return;
    }

    await this.loadRoles();

    this.audit(
      'Role status updated',
      role.name,
      'success'
    );
  }

  async deleteRole(role: RbacRole): Promise<void> {
    if (role.isSystem) return;

    const res=await this.backend.deleteRbacRole(role.id);

    if(!res?.ok){
      this.audit('Delete failed','Backend rejected request','warning');
      return;
    }

    await this.loadRoles();

    this.audit(
      'Role deleted',
      role.name,
      'success'
    );
  }

  private patchRole(roleId: string, updater: (role: RbacRole) => RbacRole): void {
    this.roles = this.roles.map(role => {
      if (role.id !== roleId) return role;
      return updater(role);
    });
  }

  effectivePermission(role: RbacRole, moduleCode: string, action: RbacActionKey): boolean {
    const direct = role.permissions?.[moduleCode]?.[action];

    if (typeof direct === 'boolean') {
      return direct;
    }

    if (role.inheritsFrom) {
      const parent = this.roles.find(item => item.id === role.inheritsFrom);
      if (parent) {
        return this.effectivePermission(parent, moduleCode, action);
      }
    }

    return false;
  }

  grantedPermissionCount(role: RbacRole): number {
    let total = 0;

    for (const module of this.modules) {
      for (const action of this.actionLabels) {
        if (this.effectivePermission(role, module.code, action.key)) {
          total += 1;
        }
      }
    }

    return total;
  }

  moduleGrantedPermissionCount(role: RbacRole, moduleCode: string): number {
    return this.actionLabels.reduce((sum, action) => {
      return sum + (this.effectivePermission(role, moduleCode, action.key) ? 1 : 0);
    }, 0);
  }

  setPermission(roleId: string, moduleCode: string, action: RbacActionKey, enabled: boolean): void {
    this.permissionDirty = true;

    this.patchRole(roleId, role => ({
      ...role,
      updatedAt: this.nowLabel(),
      permissions: {
        ...role.permissions,
        [moduleCode]: {
          ...(role.permissions[moduleCode] || this.emptyRow()),
          [action]: enabled
        }
      }
    }));

    const role = this.roles.find(item => item.id === roleId);
    if (role) {
      this.audit(
        'Permission changed',
        `${role.name}: ${moduleCode}.${action} = ${enabled ? 'enabled' : 'disabled'}`,
        'info'
      );
    }
  }

  togglePermission(roleId: string, moduleCode: string, action: RbacActionKey): void {
    const role = this.roles.find(item => item.id === roleId);
    if (!role || role.isSystem) return;

    const next = !this.effectivePermission(role, moduleCode, action);
    this.setPermission(roleId, moduleCode, action, next);
  }

  setModulePermissions(roleId: string, moduleCode: string, enabled: boolean): void {
    const role = this.roles.find(item => item.id === roleId);
    if (!role || role.isSystem) return;

    this.patchRole(roleId, current => {
      const row = { ...(current.permissions[moduleCode] || this.emptyRow()) };

      for (const key of this.allActionKeys()) {
        row[key] = enabled;
      }

      return {
        ...current,
        updatedAt: this.nowLabel(),
        permissions: {
          ...current.permissions,
          [moduleCode]: row
        }
      };
    });

    this.audit(
      enabled ? 'Module permissions granted' : 'Module permissions cleared',
      `${role.name}: ${moduleCode}`,
      enabled ? 'success' : 'warning'
    );
  }

  setGroupPermissions(roleId: string, modules: RbacModuleDefinition[], enabled: boolean): void {
    for (const module of modules) {
      this.setModulePermissions(roleId, module.code, enabled);
    }
  }

  setActionAcrossModules(roleId: string, action: RbacActionKey, enabled: boolean): void {
    const role = this.roles.find(item => item.id === roleId);
    if (!role || role.isSystem) return;

    this.patchRole(roleId, current => {
      const nextPermissions = { ...current.permissions };

      for (const module of this.modules) {
        const row = { ...(nextPermissions[module.code] || this.emptyRow()) };
        row[action] = enabled;
        nextPermissions[module.code] = row;
      }

      return {
        ...current,
        updatedAt: this.nowLabel(),
        permissions: nextPermissions
      };
    });

    this.audit(
      enabled ? 'Action granted across modules' : 'Action cleared across modules',
      `${role.name}: ${action}`,
      enabled ? 'success' : 'warning'
    );
  }

  totalGrantedModules(role: RbacRole): number {
    return this.modules.filter(module => this.moduleGrantedPermissionCount(role, module.code) > 0).length;
  }

  statusLabel(status: 'active' | 'disabled'): string {
    return status === 'active' ? 'Active' : 'Disabled';
  }

  scopeLabel(scope: string): string {
    return String(scope || '').replace(/_/g, ' ');
  }

  get editorParentRoles(): RbacRole[] {
    return this.roles.filter(role => role.id !== this.editorDraft?.id);
  }

  get selectedRoleUsers(): RbacUserItem[] {
    const role = this.selectedRole;
    if (!role) return [];
    return this.userDirectory[role.id] || [];
  }

  get selectedRoleInheritedFrom(): RbacRole | undefined {
    const role = this.selectedRole;
    if (!role?.inheritsFrom) return undefined;
    return this.roles.find(item => item.id === role.inheritsFrom);
  }

  isRoleVisible(role: RbacRole): boolean {
    const q = this.searchQuery.trim().toLowerCase();

    const matchesQuery =
      !q ||
      role.name.toLowerCase().includes(q) ||
      role.description.toLowerCase().includes(q) ||
      role.scope.toLowerCase().includes(q);

    const matchesType =
      this.roleFilter === 'all' ||
      (this.roleFilter === 'system' && role.isSystem) ||
      (this.roleFilter === 'custom' && !role.isSystem);

    const matchesStatus =
      this.statusFilter === 'all' ||
      role.status === this.statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  }


  resetPermissionDraft(): void {
    const role=this.selectedRole;

    if(!role){
      return;
    }

    role.permissions=JSON.parse(
      JSON.stringify(this.permissionDraft ?? role.permissions)
    );

    this.permissionDirty=false;

    this.audit(
      'Permission changes discarded',
      role.name + ' permissions restored',
      'info'
    );
  }


}
