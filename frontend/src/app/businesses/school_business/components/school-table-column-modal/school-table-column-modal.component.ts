import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  CustomColumnType,
  SchoolCustomColumn,
  SchoolTableSchemaService
} from '../../services/school-table-schema.service';

@Component({
  selector: 'app-school-table-column-modal',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (schemaService.isOwner() && managerState().open) {
      <div
        class="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4"
        (click)="closeManager()"
      >
        <div
          class="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">view_column</mat-icon>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-900 truncate">
                  Column Schema &amp; CRUD — {{ managerState().tableTitle }}
                </h3>
                <p class="text-[11px] font-medium text-slate-500">
                  School Business Owner Only · Add, edit, rename, show/hide, or delete columns
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="closeManager()"
              class="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer transition-colors"
            >
              <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">close</mat-icon>
            </button>
          </div>

          <!-- Body -->
          <div class="p-5 overflow-y-auto space-y-6">
            <!-- Section 1: Add / Edit Custom Column -->
            <div class="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3.5">
              <div class="flex items-center justify-between gap-2">
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-emerald-600">add_circle_outline</mat-icon>
                  <span>{{ editingColId() ? 'Edit Custom Column' : 'Add New Custom Column' }}</span>
                </h4>
                @if (editingColId()) {
                  <button
                    type="button"
                    (click)="cancelEditCustom()"
                    class="text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div class="sm:col-span-5">
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Column Label *</label>
                  <input
                    type="text"
                    [value]="colLabel()"
                    (input)="colLabel.set($any($event.target).value)"
                    placeholder="e.g. Scholarship %, Bus Stop"
                    class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div class="sm:col-span-3">
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Field Type</label>
                  <select
                    [value]="colType()"
                    (change)="colType.set($any($event.target).value)"
                    class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="badge">Badge</option>
                  </select>
                </div>
                <div class="sm:col-span-4">
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Default Value</label>
                  <input
                    type="text"
                    [value]="colDefault()"
                    (input)="colDefault.set($any($event.target).value)"
                    placeholder="Optional default"
                    class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  (click)="saveCustomColumn()"
                  [disabled]="!colLabel().trim()"
                  class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">{{ editingColId() ? 'save' : 'add' }}</mat-icon>
                  <span>{{ editingColId() ? 'Update Custom Column' : 'Add Custom Column' }}</span>
                </button>
              </div>

              <!-- Existing Custom Columns List -->
              @if (activeSchema().customColumns.length > 0) {
                <div class="pt-2 border-t border-slate-200/70 space-y-2">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Active Custom Columns ({{ activeSchema().customColumns.length }})
                  </p>
                  <div class="space-y-1.5">
                    @for (c of activeSchema().customColumns; track c.id) {
                      <div class="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-xs">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-[10px] font-bold uppercase">
                            {{ c.type }}
                          </span>
                          <span class="font-bold text-slate-900 truncate">{{ c.label }}</span>
                          @if (c.defaultValue) {
                            <span class="text-[11px] text-slate-400 truncate">(Default: {{ c.defaultValue }})</span>
                          }
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            (click)="startEditCustom(c)"
                            class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                            title="Edit Custom Column"
                          >
                            <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">edit</mat-icon>
                          </button>
                          <button
                            type="button"
                            (click)="deleteCustom(c.id)"
                            class="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                            title="Delete Custom Column"
                          >
                            <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">delete</mat-icon>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Section 2: Built-In Columns (Show/Hide & Rename) -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-slate-600">tune</mat-icon>
                  <span>Built-in Columns (Show / Hide &amp; Rename)</span>
                </h4>
                <span class="text-[11px] font-semibold text-slate-500 tabular-nums">
                  {{ visibleBuiltInCount() }}/{{ managerState().detectedHeaders.length }} visible
                </span>
              </div>

              @if (managerState().detectedHeaders.length === 0) {
                <p class="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-200/70">
                  No configurable built-in headers detected for this table.
                </p>
              } @else {
                <div class="space-y-2">
                  @for (h of managerState().detectedHeaders; track h.index) {
                    <div class="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200/80 bg-white">
                      <label class="inline-flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          [checked]="!isHidden(h.index)"
                          (change)="toggleVisibility(h.index)"
                          class="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                        <span class="text-[11px] font-bold text-slate-600 w-12">
                          {{ isHidden(h.index) ? 'Hidden' : 'Shown' }}
                        </span>
                      </label>
                      <div class="flex-1 min-w-0">
                        <input
                          type="text"
                          [value]="getHeaderValue(h.index, h.originalLabel)"
                          (change)="renameHeader(h.index, $any($event.target).value, h.originalLabel)"
                          [placeholder]="h.originalLabel"
                          class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <span class="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[130px]" [title]="h.originalLabel">
                        Orig: {{ h.originalLabel }}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-3">
            <button
              type="button"
              (click)="resetTable()"
              class="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-bold text-slate-700 hover:text-rose-700 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">restart_alt</mat-icon>
              <span>Reset Default Columns</span>
            </button>
            <button
              type="button"
              (click)="closeManager()"
              class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Custom Cell Value Editor Modal (Owner Only) -->
    @if (schemaService.isOwner() && cellEditor(); as ce) {
      <div
        class="fixed inset-0 z-[130] bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4"
        (click)="closeCellEditor()"
      >
        <div
          class="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div class="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/90 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-black text-slate-900">Edit Custom Cell Value</h3>
              <p class="text-[11px] font-medium text-slate-500 truncate max-w-[300px]">
                {{ ce.tableTitle }} · {{ ce.rowLabel }}
              </p>
            </div>
            <button
              type="button"
              (click)="closeCellEditor()"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
            >
              <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">close</mat-icon>
            </button>
          </div>
          <div class="p-5 space-y-3">
            <label class="block text-xs font-bold text-slate-700">{{ ce.colLabel }}</label>
            <input
              [type]="ce.colType === 'number' ? 'number' : (ce.colType === 'date' ? 'date' : 'text')"
              [value]="cellDraft()"
              (input)="cellDraft.set($any($event.target).value)"
              placeholder="Enter value..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div class="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-end gap-2">
            <button
              type="button"
              (click)="closeCellEditor()"
              class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="saveCellValue()"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">save</mat-icon>
              <span>Save Cell</span>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class SchoolTableColumnModalComponent {
  readonly schemaService = inject(SchoolTableSchemaService);

  readonly managerState = this.schemaService.columnManagerState;
  readonly cellEditor = this.schemaService.cellEditorState;

  readonly activeSchema = computed(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getSchema(this.managerState().tableId || '');
  });

  readonly visibleBuiltInCount = computed(() => {
    const headers = this.managerState().detectedHeaders;
    const hidden = new Set(this.activeSchema().hiddenColumns);
    return headers.filter((h) => !hidden.has(h.index)).length;
  });

  readonly colLabel = signal<string>('');
  readonly colType = signal<CustomColumnType>('text');
  readonly colDefault = signal<string>('');
  readonly editingColId = signal<string>('');
  readonly cellDraft = signal<string>('');

  constructor() {
    effect(() => {
      const state = this.cellEditor();
      if (state && state.open) {
        this.cellDraft.set(state.value ?? '');
      }
    });
  }

  closeManager(): void {
    this.cancelEditCustom();
    this.schemaService.closeColumnManager();
  }

  isHidden(colIndex: number): boolean {
    return this.activeSchema().hiddenColumns.includes(colIndex);
  }

  getHeaderValue(colIndex: number, originalLabel: string): string {
    return this.activeSchema().renamedHeaders[colIndex] ?? originalLabel;
  }

  toggleVisibility(colIndex: number): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    const headers = this.managerState().detectedHeaders;
    const schema = this.activeSchema();
    const currentlyHidden = schema.hiddenColumns.includes(colIndex);
    if (!currentlyHidden && this.visibleBuiltInCount() <= 1 && schema.customColumns.length === 0) {
      return; // Keep at least 1 visible column
    }
    if (headers.some((h) => h.index === colIndex)) {
      this.schemaService.toggleColumnVisibility(tableId, colIndex);
    }
  }

  renameHeader(colIndex: number, newLabel: string, originalLabel: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.renameColumn(tableId, colIndex, newLabel, originalLabel);
  }

  saveCustomColumn(): void {
    const tableId = this.managerState().tableId;
    if (!tableId || !this.colLabel().trim()) return;
    if (this.editingColId()) {
      this.schemaService.updateCustomColumn(tableId, this.editingColId(), {
        label: this.colLabel(),
        type: this.colType(),
        defaultValue: this.colDefault()
      });
    } else {
      this.schemaService.addCustomColumn(tableId, this.colLabel(), this.colType(), this.colDefault());
    }
    this.cancelEditCustom();
  }

  startEditCustom(col: SchoolCustomColumn): void {
    this.editingColId.set(col.id);
    this.colLabel.set(col.label);
    this.colType.set(col.type);
    this.colDefault.set(col.defaultValue || '');
  }

  cancelEditCustom(): void {
    this.editingColId.set('');
    this.colLabel.set('');
    this.colType.set('text');
    this.colDefault.set('');
  }

  deleteCustom(colId: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    if (this.editingColId() === colId) {
      this.cancelEditCustom();
    }
    this.schemaService.deleteCustomColumn(tableId, colId);
  }

  resetTable(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.cancelEditCustom();
    this.schemaService.resetTableSchema(tableId);
  }

  closeCellEditor(): void {
    this.schemaService.closeCellEditor();
  }

  saveCellValue(): void {
    const ce = this.schemaService.cellEditorState();
    if (!ce) return;
    this.schemaService.setCustomCellValue(ce.tableId, ce.rowKey, ce.colId, this.cellDraft());
    this.schemaService.closeCellEditor();
  }
}
