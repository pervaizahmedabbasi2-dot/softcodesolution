import { Injectable, computed, signal } from '@angular/core';

export type SchoolTablePortalRole = 'owner' | 'principal' | 'teacher' | 'student' | 'parent' | 'accountant';
export type CustomColumnType = 'text' | 'number' | 'date' | 'badge';

export interface SchoolCustomColumn {
  id: string;
  label: string;
  type: CustomColumnType;
  defaultValue: string;
}

export interface SchoolTableSchema {
  tableId: string;
  hiddenColumns: number[];
  renamedHeaders: Record<number, string>;
  customColumns: SchoolCustomColumn[];
  customCells: Record<string, Record<string, string>>;
}

export interface DetectedBuiltInHeader {
  index: number;
  originalLabel: string;
}

export interface ColumnManagerState {
  open: boolean;
  tableId: string;
  tableTitle: string;
  detectedHeaders: DetectedBuiltInHeader[];
}

export interface CellEditorState {
  open: boolean;
  tableId: string;
  tableTitle: string;
  rowKey: string;
  rowLabel: string;
  colId: string;
  colLabel: string;
  colType: CustomColumnType;
  value: string;
}

const STORAGE_KEY_BASE = 'scs_school_table_schemas_v1';

@Injectable({
  providedIn: 'root'
})
export class SchoolTableSchemaService {
  readonly portalRole = signal<SchoolTablePortalRole>('owner');
  readonly isOwner = computed<boolean>(() => this.portalRole() === 'owner');
  readonly schemas = signal<Record<string, SchoolTableSchema>>({});
  readonly schemaRevision = signal<number>(0);

  readonly columnManagerState = signal<ColumnManagerState>({
    open: false,
    tableId: '',
    tableTitle: '',
    detectedHeaders: []
  });

  readonly cellEditorState = signal<CellEditorState | null>(null);
  readonly addRowRequest = signal<{ tableId: string; tableTitle: string; seq: number } | null>(null);

  private activeTenantId = 'alhuda_academy';
  private persistHook: (() => void) | null = null;
  private tableRegistry = new Map<string, { tableEl: HTMLTableElement; title: string }>();

  constructor() {
    this.loadFromLocalStorage();
  }

  registerPersistHook(hook: () => void): void {
    this.persistHook = hook;
  }

  setTenantId(tenantId: string): void {
    const clean = (tenantId || '').trim() || 'alhuda_academy';
    if (clean !== this.activeTenantId) {
      this.activeTenantId = clean;
      this.loadFromLocalStorage();
    }
  }

  setPortalRole(role: SchoolTablePortalRole): void {
    this.portalRole.set(role || 'owner');
    if (role !== 'owner') {
      this.closeColumnManager();
      this.closeCellEditor();
    }
  }

  registerTableElement(tableId: string, tableEl: HTMLTableElement, title: string): void {
    this.tableRegistry.set(tableId, { tableEl, title });
  }

  unregisterTableElement(tableId: string): void {
    this.tableRegistry.delete(tableId);
  }

  getSchema(tableId: string): SchoolTableSchema {
    const existing = this.schemas()[tableId];
    if (existing) {
      return existing;
    }
    return {
      tableId,
      hiddenColumns: [],
      renamedHeaders: {},
      customColumns: [],
      customCells: {}
    };
  }

  exportSchemas(): Record<string, SchoolTableSchema> {
    try {
      return JSON.parse(JSON.stringify(this.schemas()));
    } catch {
      return {};
    }
  }

  importSchemas(raw: unknown): void {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
    const normalized: Record<string, SchoolTableSchema> = {};
    for (const [k, v] of Object.entries(raw as Record<string, any>)) {
      if (!v || typeof v !== 'object') continue;
      normalized[k] = {
        tableId: String(v.tableId || k),
        hiddenColumns: Array.isArray(v.hiddenColumns)
          ? v.hiddenColumns.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 0)
          : [],
        renamedHeaders: v.renamedHeaders && typeof v.renamedHeaders === 'object' ? { ...v.renamedHeaders } : {},
        customColumns: Array.isArray(v.customColumns)
          ? v.customColumns
              .filter((c: any) => c && c.id && c.label)
              .map((c: any) => ({
                id: String(c.id),
                label: String(c.label),
                type: (['text', 'number', 'date', 'badge'].includes(c.type) ? c.type : 'text') as CustomColumnType,
                defaultValue: String(c.defaultValue ?? '')
              }))
          : [],
        customCells: v.customCells && typeof v.customCells === 'object' ? { ...v.customCells } : {}
      };
    }
    this.schemas.set(normalized);
    this.saveToLocalStorageOnly();
    this.schemaRevision.update((n) => n + 1);
  }

  openColumnManager(tableId: string, tableTitle: string, detectedHeaders: DetectedBuiltInHeader[]): void {
    if (!this.isOwner()) return;
    this.columnManagerState.set({
      open: true,
      tableId,
      tableTitle: tableTitle || tableId,
      detectedHeaders
    });
  }

  closeColumnManager(): void {
    const cur = this.columnManagerState();
    if (cur.open) {
      this.columnManagerState.set({ ...cur, open: false });
    }
  }

  openCellEditor(state: Omit<CellEditorState, 'open'>): void {
    if (!this.isOwner()) return;
    this.cellEditorState.set({ ...state, open: true });
  }

  closeCellEditor(): void {
    this.cellEditorState.set(null);
  }

  triggerAddRow(tableId: string, tableTitle: string): void {
    if (!this.isOwner()) return;
    this.addRowRequest.set({ tableId, tableTitle, seq: Date.now() });
  }

  toggleColumnVisibility(tableId: string, colIndex: number): void {
    if (!this.isOwner()) return;
    this.mutateSchema(tableId, (schema) => {
      const set = new Set(schema.hiddenColumns);
      if (set.has(colIndex)) {
        set.delete(colIndex);
      } else {
        set.add(colIndex);
      }
      return { ...schema, hiddenColumns: Array.from(set).sort((a, b) => a - b) };
    });
  }

  renameColumn(tableId: string, colIndex: number, newLabel: string, originalLabel: string): void {
    if (!this.isOwner()) return;
    const trimmed = (newLabel || '').trim();
    this.mutateSchema(tableId, (schema) => {
      const next = { ...schema.renamedHeaders };
      if (!trimmed || trimmed === originalLabel) {
        delete next[colIndex];
      } else {
        next[colIndex] = trimmed;
      }
      return { ...schema, renamedHeaders: next };
    });
  }

  addCustomColumn(tableId: string, label: string, type: CustomColumnType = 'text', defaultValue: string = ''): boolean {
    if (!this.isOwner()) return false;
    const cleanLabel = (label || '').trim();
    if (!cleanLabel) return false;
    const colId = `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.mutateSchema(tableId, (schema) => ({
      ...schema,
      customColumns: [
        ...schema.customColumns,
        { id: colId, label: cleanLabel, type, defaultValue: String(defaultValue ?? '') }
      ]
    }));
    return true;
  }

  updateCustomColumn(
    tableId: string,
    colId: string,
    updates: { label?: string; type?: CustomColumnType; defaultValue?: string }
  ): boolean {
    if (!this.isOwner()) return false;
    this.mutateSchema(tableId, (schema) => ({
      ...schema,
      customColumns: schema.customColumns.map((col) =>
        col.id === colId
          ? {
              ...col,
              label: updates.label !== undefined && updates.label.trim() ? updates.label.trim() : col.label,
              type: updates.type ?? col.type,
              defaultValue: updates.defaultValue !== undefined ? updates.defaultValue : col.defaultValue
            }
          : col
      )
    }));
    return true;
  }

  deleteCustomColumn(tableId: string, colId: string): void {
    if (!this.isOwner()) return;
    this.mutateSchema(tableId, (schema) => {
      const nextCells: Record<string, Record<string, string>> = {};
      for (const [rk, rowMap] of Object.entries(schema.customCells)) {
        if (!rowMap || typeof rowMap !== 'object') continue;
        const copy = { ...rowMap };
        delete copy[colId];
        if (Object.keys(copy).length > 0) {
          nextCells[rk] = copy;
        }
      }
      return {
        ...schema,
        customColumns: schema.customColumns.filter((c) => c.id !== colId),
        customCells: nextCells
      };
    });
  }

  setCustomCellValue(tableId: string, rowKey: string, colId: string, value: string): void {
    if (!this.isOwner()) return;
    const cleanKey = (rowKey || '').trim();
    if (!cleanKey) return;
    this.mutateSchema(tableId, (schema) => {
      const nextCells = { ...schema.customCells };
      const existingRow = { ...(nextCells[cleanKey] || {}) };
      existingRow[colId] = String(value ?? '');
      nextCells[cleanKey] = existingRow;
      return { ...schema, customCells: nextCells };
    });
  }

  resetTableSchema(tableId: string): void {
    if (!this.isOwner()) return;
    const next = { ...this.schemas() };
    delete next[tableId];
    this.schemas.set(next);
    this.persistAll();
    this.schemaRevision.update((n) => n + 1);
  }

  exportTableCsv(tableId: string, fallbackTitle?: string): void {
    const entry = this.tableRegistry.get(tableId);
    if (!entry) return;
    const { tableEl, title } = entry;
    const rows: string[][] = [];
    const headerRow = tableEl.querySelector('thead tr');
    if (headerRow) {
      const headers: string[] = [];
      Array.from(headerRow.children).forEach((th) => {
        const el = th as HTMLElement;
        if (el.style.display === 'none') return;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.toLowerCase() === 'actions' || text.toLowerCase() === 'action' || text.toLowerCase() === 'quick actions') return;
        headers.push(text);
      });
      if (headers.length > 0) rows.push(headers);
    }

    const bodyRows = tableEl.querySelectorAll('tbody tr');
    bodyRows.forEach((tr) => {
      const cells = Array.from(tr.children) as HTMLElement[];
      if (cells.length === 1 && cells[0].hasAttribute('colspan')) return;
      const line: string[] = [];
      const headerThs = headerRow ? Array.from(headerRow.children) : [];
      cells.forEach((td, i) => {
        if (td.style.display === 'none') return;
        const th = headerThs[i] as HTMLElement | undefined;
        const thLabel = (th?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (thLabel === 'actions' || thLabel === 'action' || thLabel === 'quick actions') return;
        line.push((td.textContent || '').replace(/\s+/g, ' ').trim());
      });
      if (line.length > 0) rows.push(line);
    });

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (typeof document === 'undefined') return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (fallbackTitle || title || tableId).toLowerCase().replace(/[^a-z0-9]+/g, '_');
    a.href = url;
    a.download = `${safeName}_export.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  getSummaryBadge(tableId: string, builtInCount: number): { hiddenCount: number; customCount: number; renamedCount: number } {
    const s = this.getSchema(tableId);
    return {
      hiddenCount: s.hiddenColumns.filter((i) => i < builtInCount).length,
      customCount: s.customColumns.length,
      renamedCount: Object.keys(s.renamedHeaders).length
    };
  }

  private mutateSchema(tableId: string, updater: (cur: SchoolTableSchema) => SchoolTableSchema): void {
    const cur = this.getSchema(tableId);
    const updated = updater(cur);
    this.schemas.set({ ...this.schemas(), [tableId]: updated });
    this.persistAll();
    this.schemaRevision.update((n) => n + 1);
  }

  private getScopedStorageKey(): string {
    let tid = this.activeTenantId;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('user_data') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.tenantId) tid = String(parsed.tenantId).trim();
      }
    } catch {}
    return `${STORAGE_KEY_BASE}_${tid || 'default'}`;
  }

  private saveToLocalStorageOnly(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getScopedStorageKey(), JSON.stringify(this.schemas()));
      }
    } catch {}
  }

  private persistAll(): void {
    this.saveToLocalStorageOnly();
    if (this.persistHook) {
      try {
        this.persistHook();
      } catch {}
    }
  }

  private loadFromLocalStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(this.getScopedStorageKey());
      if (raw) {
        this.importSchemas(JSON.parse(raw));
      }
    } catch {}
  }
}
