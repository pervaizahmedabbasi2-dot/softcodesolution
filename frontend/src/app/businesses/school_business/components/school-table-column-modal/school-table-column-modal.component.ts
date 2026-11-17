import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  CustomColumnType,
  DetectedBuiltInHeader,
  SchoolCustomColumn,
  SchoolCustomRow,
  SchoolTableSchemaService,
  TableCatalogItem
} from '../../services/school-table-schema.service';

interface DraftFormRow {
  tempId: string;
  values: Record<string, string>;
}

@Component({
  selector: 'app-school-table-column-modal',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ======================================================================= -->
    <!-- OWNER TABLE & FORM SCHEMA STUDIO MODAL (COLUMNS, ROWS & PORTAL CRUD)    -->
    <!-- ======================================================================= -->
    @if (schemaService.isOwner() && managerState().open) {
      <div
        class="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4"
        (click)="closeManager()"
      >
        <div
          class="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-200/80 bg-slate-50/95 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">view_column</mat-icon>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-900 truncate">
                  Table &amp; Form Studio (Owner CRUD) — {{ activeDisplayTitle() }}
                </h3>
                <p class="text-[11px] font-medium text-slate-500 truncate">
                  School Owner Only · Syncs automatically to: <strong class="text-indigo-700">{{ portalsLabel() }}</strong>
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

          <!-- Table Switcher & Tabs -->
          <div class="px-5 py-3 border-b border-slate-200/70 bg-white space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div class="flex-1 min-w-0">
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Switch Table / Portal Register</label>
                <select
                  [value]="canonicalTableId()"
                  (change)="onSwitchTable($any($event.target).value)"
                  class="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  @for (cat of catalogTables(); track cat.canonicalId) {
                    <option [value]="cat.canonicalId">{{ cat.title }} ({{ cat.portals }})</option>
                  }
                </select>
              </div>
              <div class="flex items-center gap-1.5 pt-1 sm:pt-4 shrink-0">
                <button
                  type="button"
                  (click)="activeTab.set('columns')"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  [class]="activeTab() === 'columns' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                >
                  Columns &amp; Form ({{ activeSchema().customColumns.length }})
                </button>
                <button
                  type="button"
                  (click)="activeTab.set('rows')"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  [class]="activeTab() === 'rows' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                >
                  Rows &amp; Portal Data ({{ totalCustomEntriesCount() }})
                </button>
                <button
                  type="button"
                  (click)="activeTab.set('reset')"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  [class]="activeTab() === 'reset' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 overflow-y-auto space-y-5 flex-1">
            <!-- TAB 1: COLUMNS & FORM FIELDS -->
            @if (activeTab() === 'columns') {
              <!-- Section 0: Custom Title Control -->
              <div class="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <label class="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-indigo-600">title</mat-icon>
                    <span>Custom Form &amp; Table Title</span>
                  </label>
                  @if (activeSchema().customTitle) {
                    <button
                      type="button"
                      (click)="clearTableTitle()"
                      class="px-2 py-0.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <mat-icon class="!text-[13px] !w-[13px] !h-[13px]">delete_outline</mat-icon>
                      <span>Remove Custom Title</span>
                    </button>
                  }
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    [value]="titleDraft()"
                    (input)="titleDraft.set($any($event.target).value)"
                    [placeholder]="managerState().tableTitle || 'Set custom title shown on table & synced form...'"
                    class="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    (click)="saveTableTitle()"
                    class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Apply Title
                  </button>
                </div>
              </div>

              <!-- Section 1: Add / Edit Custom Column & Form Field -->
              <div class="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3.5">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-emerald-600">add_circle_outline</mat-icon>
                    <span>{{ editingColId() ? 'Edit Custom Column & Form Field' : 'Add Custom Column & Form Field' }}</span>
                  </h4>
                  <div class="flex items-center gap-2">
                    @if (editingColId()) {
                      <button
                        type="button"
                        (click)="cancelEditCustom()"
                        class="text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    }
                    @if (activeSchema().customColumns.length > 0) {
                      <button
                        type="button"
                        (click)="deleteAllCustomColumns()"
                        class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                        title="Remove all extra custom columns from form, table & database"
                      >
                        <mat-icon class="!text-[13px] !w-[13px] !h-[13px]">delete_sweep</mat-icon>
                        <span>Remove All Custom</span>
                      </button>
                    }
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div class="sm:col-span-5">
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Column / Form Field Label *</label>
                    <input
                      type="text"
                      [value]="colLabel()"
                      (input)="colLabel.set($any($event.target).value)"
                      placeholder="e.g. Scholarship %, Bus Route, Remarks"
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
                      <option value="select">Dropdown List</option>
                    </select>
                  </div>
                  <div class="sm:col-span-4">
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      {{ colType() === 'select' ? 'Dropdown Options (comma separated)' : 'Default Value' }}
                    </label>
                    @if (colType() === 'select') {
                      <input
                        type="text"
                        [value]="colOptions()"
                        (input)="colOptions.set($any($event.target).value)"
                        placeholder="e.g. Approved, Pending, Rejected"
                        class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    } @else {
                      <input
                        type="text"
                        [value]="colDefault()"
                        (input)="colDefault.set($any($event.target).value)"
                        placeholder="Optional default"
                        class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    }
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
                    <span>{{ editingColId() ? 'Update Column & Form Field' : 'Add to Form & Table' }}</span>
                  </button>
                </div>

                <!-- Existing Custom Columns List -->
                @if (activeSchema().customColumns.length > 0) {
                  <div class="pt-2 border-t border-slate-200/70 space-y-2">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Active Custom Columns &amp; Form Fields ({{ activeSchema().customColumns.length }})
                    </p>
                    <div class="space-y-1.5">
                      @for (c of activeSchema().customColumns; track c.id) {
                        <div class="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-xs">
                          <div class="flex items-center gap-2 min-w-0 flex-wrap">
                            <span class="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-[10px] font-bold uppercase">
                              {{ c.type }}
                            </span>
                            <span class="font-bold text-slate-900 truncate">{{ c.label }}</span>
                            @if (c.options && c.options.length > 0) {
                              <span class="text-[10px] text-slate-500 truncate">[{{ c.options.join(', ') }}]</span>
                            } @else if (c.defaultValue) {
                              <span class="text-[11px] text-slate-400 truncate">(Default: {{ c.defaultValue }})</span>
                            }
                          </div>
                          <div class="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              (click)="startEditCustom(c)"
                              class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                              title="Edit Column"
                            >
                              <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">edit</mat-icon>
                            </button>
                            <button
                              type="button"
                              (click)="deleteCustom(c.id)"
                              class="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                              title="Delete Column from Form, Table & Database"
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
                    <span>Built-in Columns (Show / Cut &amp; Rename Across Portals)</span>
                  </h4>
                  <span class="text-[11px] font-semibold text-slate-500 tabular-nums">
                    {{ visibleBuiltInCount() }}/{{ managerState().detectedHeaders.length }} visible
                  </span>
                </div>

                @if (managerState().detectedHeaders.length === 0) {
                  <p class="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-200/70">
                    Open the portal tab containing this table once to auto-detect built-in headers, or add custom columns above.
                  </p>
                } @else {
                  <div class="space-y-2">
                    @for (h of managerState().detectedHeaders; track h.index) {
                      <div class="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200/80 bg-white">
                        <label class="inline-flex items-center gap-2 cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            [checked]="!isHidden(h.index, h.originalLabel)"
                            (change)="toggleVisibility(h.index, h.originalLabel)"
                            class="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          />
                          <span class="text-[11px] font-bold w-12"
                            [class]="isHidden(h.index, h.originalLabel) ? 'text-rose-600' : 'text-emerald-700'">
                            {{ isHidden(h.index, h.originalLabel) ? 'Removed' : 'Shown' }}
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
            }

            <!-- TAB 2: ROWS & PORTAL INPUT DATA CRUD -->
            @if (activeTab() === 'rows') {
              <!-- Multi-Row Staging Form -->
              <div class="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-emerald-600">playlist_add</mat-icon>
                      <span>Multi-Row Form Submission</span>
                    </h4>
                    <p class="text-[11px] text-slate-500">
                      Add or remove multiple rows here, then submit all at once to table &amp; database.
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="addStudioDraftRow()"
                    class="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">add</mat-icon>
                    <span>+ Add Another Row</span>
                  </button>
                </div>

                <div class="space-y-2.5">
                  @for (row of studioDraftRows(); track row.tempId; let rIdx = $index) {
                    <div class="p-3 rounded-xl bg-white border border-slate-200/90 space-y-2.5">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-black uppercase text-slate-500">Draft Row #{{ rIdx + 1 }}</span>
                        @if (studioDraftRows().length > 1) {
                          <button
                            type="button"
                            (click)="removeStudioDraftRow(row.tempId)"
                            class="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <mat-icon class="!text-[13px] !w-[13px] !h-[13px]">close</mat-icon>
                            <span>Remove Row</span>
                          </button>
                        }
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        @for (h of visibleHeaders(); track h.index) {
                          <div>
                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5 truncate">
                              {{ getHeaderValue(h.index, h.originalLabel) }}
                            </label>
                            <input
                              type="text"
                              [value]="row.values['built_' + h.index] ?? ''"
                              (input)="updateStudioDraftCell(row.tempId, 'built_' + h.index, $any($event.target).value)"
                              [placeholder]="getHeaderValue(h.index, h.originalLabel)"
                              class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        }
                        @for (col of activeSchema().customColumns; track col.id) {
                          <div>
                            <label class="block text-[10px] font-bold text-indigo-700 mb-0.5 truncate">{{ col.label }}</label>
                            @if (col.type === 'select' && col.options && col.options.length > 0) {
                              <select
                                [value]="row.values[col.id] ?? col.defaultValue ?? ''"
                                (change)="updateStudioDraftCell(row.tempId, col.id, $any($event.target).value)"
                                class="w-full px-2.5 py-1.5 rounded-lg bg-indigo-50/40 border border-indigo-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                              >
                                <option value="">-- Select --</option>
                                @for (opt of col.options; track opt) {
                                  <option [value]="opt">{{ opt }}</option>
                                }
                              </select>
                            } @else {
                              <input
                                [type]="col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : 'text')"
                                [value]="row.values[col.id] ?? col.defaultValue ?? ''"
                                (input)="updateStudioDraftCell(row.tempId, col.id, $any($event.target).value)"
                                [placeholder]="col.label"
                                class="w-full px-2.5 py-1.5 rounded-lg bg-indigo-50/40 border border-indigo-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                              />
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    (click)="submitStudioDraftRows()"
                    class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">save</mat-icon>
                    <span>Submit {{ studioDraftRows().length }} Row(s) to Table &amp; Database</span>
                  </button>
                </div>
              </div>

              <!-- Existing Custom Rows (Owner CRUD) -->
              <div class="space-y-2.5">
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-indigo-600">table_rows</mat-icon>
                  <span>Submitted Custom Rows ({{ activeSchema().customRows.length }})</span>
                </h4>
                @if (activeSchema().customRows.length === 0) {
                  <p class="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-200/70">
                    No standalone custom rows added yet. Use the Multi-Row Form above to add rows.
                  </p>
                } @else {
                  <div class="space-y-2">
                    @for (crow of activeSchema().customRows; track crow.rowKey) {
                      <div class="p-3 rounded-xl border border-slate-200/90 bg-white space-y-2">
                        <div class="flex items-center justify-between gap-2">
                          <div class="flex items-center gap-2 min-w-0">
                            <span class="font-bold text-xs text-slate-900 truncate">{{ crow.rowLabel || crow.rowKey }}</span>
                            @if (crow.submittedByRole) {
                              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                {{ crow.submittedByRole }}
                              </span>
                            }
                          </div>
                          <div class="flex items-center gap-1 shrink-0">
                            @if (editingRowKey() === crow.rowKey) {
                              <button
                                type="button"
                                (click)="saveEditedRow(crow)"
                                class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                (click)="editingRowKey.set('')"
                                class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                            } @else {
                              <button
                                type="button"
                                (click)="startEditRow(crow)"
                                class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                                title="Edit Row Values"
                              >
                                <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">edit</mat-icon>
                              </button>
                              <button
                                type="button"
                                (click)="deleteCustomRow(crow.rowKey)"
                                class="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                title="Delete Row from Table & Database"
                              >
                                <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">delete</mat-icon>
                              </button>
                            }
                          </div>
                        </div>

                        @if (editingRowKey() === crow.rowKey) {
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            @for (h of visibleHeaders(); track h.index) {
                              <div>
                                <label class="block text-[10px] font-bold text-slate-500 mb-0.5">{{ getHeaderValue(h.index, h.originalLabel) }}</label>
                                <input
                                  type="text"
                                  [value]="editRowValues()['built_' + h.index] ?? ''"
                                  (input)="updateEditRowField('built_' + h.index, $any($event.target).value)"
                                  class="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                                />
                              </div>
                            }
                            @for (col of activeSchema().customColumns; track col.id) {
                              <div>
                                <label class="block text-[10px] font-bold text-indigo-700 mb-0.5">{{ col.label }}</label>
                                <input
                                  type="text"
                                  [value]="editRowValues()[col.id] ?? ''"
                                  (input)="updateEditRowField(col.id, $any($event.target).value)"
                                  class="w-full px-2.5 py-1 rounded-lg bg-indigo-50/40 border border-indigo-200 text-xs font-semibold text-slate-900"
                                />
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="flex flex-wrap gap-2 text-[11px] text-slate-600">
                            @for (h of visibleHeaders(); track h.index) {
                              @if (crow.values['built_' + h.index]) {
                                <span class="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80">
                                  <strong>{{ getHeaderValue(h.index, h.originalLabel) }}:</strong> {{ crow.values['built_' + h.index] }}
                                </span>
                              }
                            }
                            @for (col of activeSchema().customColumns; track col.id) {
                              @if (crow.values[col.id]) {
                                <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200/70">
                                  <strong>{{ col.label }}:</strong> {{ crow.values[col.id] }}
                                </span>
                              }
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Portal-Submitted Custom Cell Data on Built-in Rows (Owner CRUD) -->
              @if (submittedCellEntries().length > 0) {
                <div class="space-y-2.5">
                  <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-emerald-600">fact_check</mat-icon>
                    <span>Portal-Submitted Custom Field Data ({{ submittedCellEntries().length }} records)</span>
                  </h4>
                  <div class="space-y-2">
                    @for (entry of submittedCellEntries(); track entry.rowKey) {
                      <div class="p-3 rounded-xl border border-slate-200/90 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div class="space-y-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-mono text-[11px] font-bold text-slate-800">{{ entry.rowKey }}</span>
                            @if (entry.submittedByRole) {
                              <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                By {{ entry.submittedByRole }}
                              </span>
                            }
                          </div>
                          <div class="flex flex-wrap gap-1.5 text-[11px]">
                            @for (cell of entry.cells; track cell.colId) {
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200/70">
                                <strong>{{ cell.colLabel }}:</strong> {{ cell.value }}
                                <button
                                  type="button"
                                  (click)="editSubmittedCell(entry.rowKey, cell.colId, cell.colLabel, cell.colType, cell.value)"
                                  class="ml-1 text-indigo-600 hover:text-indigo-900 cursor-pointer font-bold"
                                  title="Edit Cell"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  (click)="deleteSubmittedCell(entry.rowKey, cell.colId)"
                                  class="ml-0.5 text-rose-600 hover:text-rose-900 cursor-pointer font-bold"
                                  title="Delete Cell Value"
                                >
                                  ×
                                </button>
                              </span>
                            }
                          </div>
                        </div>
                        <button
                          type="button"
                          (click)="clearRecordCustomCells(entry.rowKey)"
                          class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer shrink-0 self-start sm:self-center"
                        >
                          Remove Entry
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            }

            <!-- TAB 3: RESET SCHEMA -->
            @if (activeTab() === 'reset') {
              <div class="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                <h4 class="text-sm font-black text-rose-900">Reset Table &amp; Form Customization</h4>
                <p class="text-xs text-rose-800 leading-relaxed">
                  Resetting removes all custom columns, custom title, hidden/renamed headers, custom rows, and submitted custom cell data for
                  <strong>{{ activeDisplayTitle() }}</strong> from SQLite, Firestore, and all synced role portals.
                </p>
                <div class="pt-1">
                  <button
                    type="button"
                    (click)="resetTable()"
                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">restart_alt</mat-icon>
                    <span>Confirm Full Reset for This Table</span>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-3">
            <span class="text-[11px] font-medium text-slate-500">
              All changes saved to SQLite &amp; Firestore
            </span>
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

    <!-- ======================================================================= -->
    <!-- UNIVERSAL MULTI-ROW FORM MODAL (ADD / REMOVE ROWS + INLINE FIELDS)      -->
    <!-- ======================================================================= -->
    @if (schemaService.isOwner() && rowFormState().open) {
      <div
        class="fixed inset-0 z-[125] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        (click)="closeRowFormModal()"
      >
        <div
          class="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div class="px-5 py-4 border-b border-slate-200/80 bg-slate-50/95 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-sm font-black text-slate-900 truncate">
                Multi-Row Table Form — {{ rowFormTitle() }}
              </h3>
              <p class="text-[11px] font-medium text-slate-500">
                Add or remove rows and custom fields here; submitted rows mirror across synced portals.
              </p>
            </div>
            <button
              type="button"
              (click)="closeRowFormModal()"
              class="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer"
            >
              <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">close</mat-icon>
            </button>
          </div>

          <div class="p-5 overflow-y-auto space-y-4 flex-1">
            <!-- Quick Inline Field / Title Add & Remove Bar -->
            <div class="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2.5 text-xs">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="font-black text-slate-900">Quick Form &amp; Table Column Controls</span>
                <button
                  type="button"
                  (click)="addModalDraftRow()"
                  class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">add</mat-icon>
                  <span>+ Add Row</span>
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  [value]="quickFieldLabel()"
                  (input)="quickFieldLabel.set($any($event.target).value)"
                  placeholder="New column/field label..."
                  class="sm:col-span-5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                />
                <select
                  [value]="quickFieldType()"
                  (change)="quickFieldType.set($any($event.target).value)"
                  class="sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="badge">Badge</option>
                </select>
                <button
                  type="button"
                  (click)="addQuickField()"
                  [disabled]="!quickFieldLabel().trim()"
                  class="sm:col-span-4 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  + Add Column to Form &amp; Table
                </button>
              </div>
              @if (rowFormSchema().customColumns.length > 0) {
                <div class="flex flex-wrap gap-1.5 pt-1">
                  @for (cc of rowFormSchema().customColumns; track cc.id) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-[11px] font-bold text-indigo-800">
                      <span>{{ cc.label }}</span>
                      <button
                        type="button"
                        (click)="removeQuickField(cc.id)"
                        class="text-rose-600 hover:text-rose-800 cursor-pointer font-black"
                        title="Delete this column from form, table & DB"
                      >
                        ×
                      </button>
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Staged Rows -->
            <div class="space-y-3">
              @for (row of modalDraftRows(); track row.tempId; let idx = $index) {
                <div class="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-black text-slate-700 uppercase">Row #{{ idx + 1 }}</span>
                    @if (modalDraftRows().length > 1) {
                      <button
                        type="button"
                        (click)="removeModalDraftRow(row.tempId)"
                        class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">delete_outline</mat-icon>
                        <span>Remove Row</span>
                      </button>
                    }
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    @for (h of rowFormVisibleHeaders(); track h.index) {
                      <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5 truncate">
                          {{ getRowFormHeaderLabel(h) }}
                        </label>
                        <input
                          type="text"
                          [value]="row.values['built_' + h.index] ?? ''"
                          (input)="updateModalDraftCell(row.tempId, 'built_' + h.index, $any($event.target).value)"
                          [placeholder]="getRowFormHeaderLabel(h)"
                          class="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-900"
                        />
                      </div>
                    }
                    @for (cc of rowFormSchema().customColumns; track cc.id) {
                      <div>
                        <label class="block text-[10px] font-bold text-indigo-700 mb-0.5 truncate">{{ cc.label }}</label>
                        <input
                          [type]="cc.type === 'number' ? 'number' : (cc.type === 'date' ? 'date' : 'text')"
                          [value]="row.values[cc.id] ?? cc.defaultValue ?? ''"
                          (input)="updateModalDraftCell(row.tempId, cc.id, $any($event.target).value)"
                          [placeholder]="cc.label"
                          class="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-semibold text-slate-900"
                        />
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-2">
            <button
              type="button"
              (click)="closeRowFormModal()"
              class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="submitModalDraftRows()"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">check_circle</mat-icon>
              <span>Submit {{ modalDraftRows().length }} Row(s) to Table</span>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ======================================================================= -->
    <!-- CUSTOM CELL VALUE EDITOR MODAL (OWNER ONLY)                             -->
    <!-- ======================================================================= -->
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
            @if (ce.colType === 'select' && ce.colOptions && ce.colOptions.length > 0) {
              <select
                [value]="cellDraft()"
                (change)="cellDraft.set($any($event.target).value)"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Clear / None --</option>
                @for (opt of ce.colOptions; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            } @else {
              <input
                [type]="ce.colType === 'number' ? 'number' : (ce.colType === 'date' ? 'date' : 'text')"
                [value]="cellDraft()"
                (input)="cellDraft.set($any($event.target).value)"
                placeholder="Enter value..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            }
          </div>
          <div class="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-2">
            <button
              type="button"
              (click)="deleteCellValue()"
              class="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 cursor-pointer inline-flex items-center gap-1"
            >
              <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">delete_outline</mat-icon>
              <span>Delete Value</span>
            </button>
            <div class="flex items-center gap-2">
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
      </div>
    }
  `
})
export class SchoolTableColumnModalComponent {
  readonly schemaService = inject(SchoolTableSchemaService);

  readonly managerState = this.schemaService.columnManagerState;
  readonly rowFormState = this.schemaService.rowFormModalState;
  readonly cellEditor = this.schemaService.cellEditorState;

  readonly activeTab = signal<'columns' | 'rows' | 'reset'>('columns');
  readonly titleDraft = signal<string>('');
  readonly colLabel = signal<string>('');
  readonly colType = signal<CustomColumnType>('text');
  readonly colDefault = signal<string>('');
  readonly colOptions = signal<string>('');
  readonly editingColId = signal<string>('');
  readonly cellDraft = signal<string>('');

  readonly studioDraftRows = signal<DraftFormRow[]>([this.createBlankDraftRow()]);
  readonly editingRowKey = signal<string>('');
  readonly editRowValues = signal<Record<string, string>>({});

  readonly modalDraftRows = signal<DraftFormRow[]>([this.createBlankDraftRow()]);
  readonly quickFieldLabel = signal<string>('');
  readonly quickFieldType = signal<CustomColumnType>('text');

  readonly canonicalTableId = computed(() =>
    this.schemaService.resolveCanonicalTableId(this.managerState().tableId || '')
  );

  readonly catalogTables = computed<TableCatalogItem[]>(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getCatalogTables();
  });

  readonly activeSchema = computed(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getSchema(this.managerState().tableId || '');
  });

  readonly activeDisplayTitle = computed(() => {
    return this.activeSchema().customTitle || this.managerState().tableTitle || this.canonicalTableId();
  });

  readonly portalsLabel = computed(() =>
    this.schemaService.getPortalTargetsLabel(this.managerState().tableId || '')
  );

  readonly visibleBuiltInCount = computed(() => {
    const headers = this.managerState().detectedHeaders;
    return headers.filter((h) => !this.isHidden(h.index, h.originalLabel)).length;
  });

  readonly visibleHeaders = computed(() => {
    const headers = this.managerState().detectedHeaders;
    return headers.filter((h) => !this.isHidden(h.index, h.originalLabel));
  });

  readonly submittedCellEntries = computed(() => {
    const schema = this.activeSchema();
    const colMap = new Map<string, SchoolCustomColumn>();
    for (const c of schema.customColumns) colMap.set(c.id, c);
    const customRowKeys = new Set((schema.customRows || []).map((r) => r.rowKey));
    const entries: Array<{
      rowKey: string;
      submittedByRole: string;
      cells: Array<{ colId: string; colLabel: string; colType: CustomColumnType; value: string }>;
    }> = [];

    for (const [rk, rowMap] of Object.entries(schema.customCells || {})) {
      if (customRowKeys.has(rk) || !rowMap || typeof rowMap !== 'object') continue;
      const cells: Array<{ colId: string; colLabel: string; colType: CustomColumnType; value: string }> = [];
      let role = '';
      for (const [cid, val] of Object.entries(rowMap)) {
        const col = colMap.get(cid);
        if (!col) continue;
        const meta = schema.cellMeta?.[rk]?.[cid];
        if (meta?.submittedByRole && !role) role = meta.submittedByRole;
        cells.push({ colId: cid, colLabel: col.label, colType: col.type, value: String(val ?? '') });
      }
      if (cells.length > 0) {
        entries.push({ rowKey: rk, submittedByRole: role, cells });
      }
    }
    return entries;
  });

  readonly totalCustomEntriesCount = computed(() => {
    return this.activeSchema().customRows.length + this.submittedCellEntries().length;
  });

  readonly rowFormSchema = computed(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getSchema(this.rowFormState().tableId || '');
  });

  readonly rowFormTitle = computed(() => {
    return this.rowFormSchema().customTitle || this.rowFormState().tableTitle || this.rowFormState().tableId;
  });

  readonly rowFormVisibleHeaders = computed(() => {
    const schema = this.rowFormSchema();
    const hiddenLabels = new Set((schema.hiddenColumnLabels || []).map((l) => l.toLowerCase()));
    const hiddenIndices = new Set(schema.hiddenColumns || []);
    return (this.rowFormState().detectedHeaders || []).filter(
      (h) => !hiddenIndices.has(h.index) && !hiddenLabels.has(h.originalLabel.toLowerCase())
    );
  });

  constructor() {
    effect(() => {
      const m = this.managerState();
      if (m.open) {
        const s = this.schemaService.getSchema(m.tableId);
        this.titleDraft.set(s.customTitle || '');
        if (m.initialTab) {
          this.activeTab.set(m.initialTab);
        }
      }
    });
    effect(() => {
      const rf = this.rowFormState();
      if (rf.open) {
        this.modalDraftRows.set([this.createBlankDraftRow()]);
        this.quickFieldLabel.set('');
      }
    });
    effect(() => {
      const state = this.cellEditor();
      if (state && state.open) {
        this.cellDraft.set(state.value ?? '');
      }
    });
  }

  private createBlankDraftRow(): DraftFormRow {
    return {
      tempId: `dr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      values: {}
    };
  }

  onSwitchTable(canonicalId: string): void {
    const found = this.catalogTables().find((c) => c.canonicalId === canonicalId);
    if (found) {
      this.cancelEditCustom();
      this.editingRowKey.set('');
      this.schemaService.switchManagedTable(found);
      this.titleDraft.set(this.schemaService.getSchema(found.tableId).customTitle || '');
    }
  }

  closeManager(): void {
    this.cancelEditCustom();
    this.editingRowKey.set('');
    this.schemaService.closeColumnManager();
  }

  saveTableTitle(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.updateTableTitle(tableId, this.titleDraft());
  }

  clearTableTitle(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.titleDraft.set('');
    this.schemaService.updateTableTitle(tableId, '');
  }

  isHidden(colIndex: number, originalLabel: string): boolean {
    const s = this.activeSchema();
    const byIdx = s.hiddenColumns.includes(colIndex);
    const byLabel = (s.hiddenColumnLabels || []).includes(originalLabel.trim().toLowerCase());
    return byIdx || byLabel;
  }

  getHeaderValue(colIndex: number, originalLabel: string): string {
    const s = this.activeSchema();
    return s.renamedHeadersByLabel?.[originalLabel.trim().toLowerCase()] ?? s.renamedHeaders[colIndex] ?? originalLabel;
  }

  toggleVisibility(colIndex: number, originalLabel: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    const schema = this.activeSchema();
    const currentlyHidden = this.isHidden(colIndex, originalLabel);
    if (!currentlyHidden && this.visibleBuiltInCount() <= 1 && schema.customColumns.length === 0) {
      return;
    }
    this.schemaService.toggleColumnVisibility(tableId, colIndex, originalLabel);
  }

  renameHeader(colIndex: number, newLabel: string, originalLabel: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.renameColumn(tableId, colIndex, newLabel, originalLabel);
  }

  saveCustomColumn(): void {
    const tableId = this.managerState().tableId;
    if (!tableId || !this.colLabel().trim()) return;
    const type = this.colType();
    const opts = type === 'select'
      ? this.colOptions().split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    if (this.editingColId()) {
      this.schemaService.updateCustomColumn(tableId, this.editingColId(), {
        label: this.colLabel(),
        type,
        defaultValue: type === 'select' ? '' : this.colDefault(),
        options: opts
      });
    } else {
      this.schemaService.addCustomColumn(
        tableId,
        this.colLabel(),
        type,
        type === 'select' ? '' : this.colDefault(),
        opts
      );
    }
    this.cancelEditCustom();
  }

  startEditCustom(col: SchoolCustomColumn): void {
    this.editingColId.set(col.id);
    this.colLabel.set(col.label);
    this.colType.set(col.type);
    this.colDefault.set(col.defaultValue || '');
    this.colOptions.set((col.options || []).join(', '));
  }

  cancelEditCustom(): void {
    this.editingColId.set('');
    this.colLabel.set('');
    this.colType.set('text');
    this.colDefault.set('');
    this.colOptions.set('');
  }

  deleteCustom(colId: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    if (this.editingColId() === colId) {
      this.cancelEditCustom();
    }
    this.schemaService.deleteCustomColumn(tableId, colId);
  }

  deleteAllCustomColumns(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.cancelEditCustom();
    this.schemaService.deleteAllCustomColumns(tableId);
  }

  // --- Studio Multi-Row & Row CRUD ---
  addStudioDraftRow(): void {
    this.studioDraftRows.update((rows) => [...rows, this.createBlankDraftRow()]);
  }

  removeStudioDraftRow(tempId: string): void {
    this.studioDraftRows.update((rows) => rows.length > 1 ? rows.filter((r) => r.tempId !== tempId) : rows);
  }

  updateStudioDraftCell(tempId: string, key: string, val: string): void {
    this.studioDraftRows.update((rows) =>
      rows.map((r) => (r.tempId === tempId ? { ...r, values: { ...r.values, [key]: val } } : r))
    );
  }

  submitStudioDraftRows(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    const count = this.schemaService.addCustomRowsBatch(tableId, this.studioDraftRows());
    if (count > 0) {
      this.studioDraftRows.set([this.createBlankDraftRow()]);
    }
  }

  startEditRow(crow: SchoolCustomRow): void {
    this.editingRowKey.set(crow.rowKey);
    this.editRowValues.set({ ...(crow.values || {}) });
  }

  updateEditRowField(key: string, val: string): void {
    this.editRowValues.update((cur) => ({ ...cur, [key]: val }));
  }

  saveEditedRow(crow: SchoolCustomRow): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.updateCustomRow(tableId, crow.rowKey, this.editRowValues(), crow.rowLabel);
    this.editingRowKey.set('');
  }

  deleteCustomRow(rowKey: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.deleteCustomRow(tableId, rowKey);
  }

  editSubmittedCell(rowKey: string, colId: string, colLabel: string, colType: CustomColumnType, value: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.openCellEditor({
      tableId,
      tableTitle: this.activeDisplayTitle(),
      rowKey,
      rowLabel: rowKey,
      colId,
      colLabel,
      colType,
      value
    });
  }

  deleteSubmittedCell(rowKey: string, colId: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.deleteCustomCellValue(tableId, rowKey, colId);
  }

  clearRecordCustomCells(rowKey: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.clearRowCustomData(tableId, rowKey);
  }

  resetTable(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.cancelEditCustom();
    this.editingRowKey.set('');
    this.titleDraft.set('');
    this.schemaService.resetTableSchema(tableId);
    this.activeTab.set('columns');
  }

  // --- Universal Multi-Row Modal ---
  closeRowFormModal(): void {
    this.schemaService.closeRowFormModal();
  }

  getRowFormHeaderLabel(h: DetectedBuiltInHeader): string {
    const s = this.rowFormSchema();
    return s.renamedHeadersByLabel?.[h.originalLabel.trim().toLowerCase()] ?? s.renamedHeaders[h.index] ?? h.originalLabel;
  }

  addQuickField(): void {
    const tableId = this.rowFormState().tableId;
    if (!tableId || !this.quickFieldLabel().trim()) return;
    this.schemaService.addCustomColumn(tableId, this.quickFieldLabel(), this.quickFieldType(), '');
    this.quickFieldLabel.set('');
  }

  removeQuickField(colId: string): void {
    const tableId = this.rowFormState().tableId;
    if (!tableId) return;
    this.schemaService.deleteCustomColumn(tableId, colId);
  }

  addModalDraftRow(): void {
    this.modalDraftRows.update((rows) => [...rows, this.createBlankDraftRow()]);
  }

  removeModalDraftRow(tempId: string): void {
    this.modalDraftRows.update((rows) => rows.length > 1 ? rows.filter((r) => r.tempId !== tempId) : rows);
  }

  updateModalDraftCell(tempId: string, key: string, val: string): void {
    this.modalDraftRows.update((rows) =>
      rows.map((r) => (r.tempId === tempId ? { ...r, values: { ...r.values, [key]: val } } : r))
    );
  }

  submitModalDraftRows(): void {
    const tableId = this.rowFormState().tableId;
    if (!tableId) return;
    const count = this.schemaService.addCustomRowsBatch(tableId, this.modalDraftRows());
    if (count > 0) {
      this.schemaService.closeRowFormModal();
    }
  }

  // --- Cell Value Editor ---
  closeCellEditor(): void {
    this.schemaService.closeCellEditor();
  }

  saveCellValue(): void {
    const ce = this.schemaService.cellEditorState();
    if (!ce) return;
    this.schemaService.setCustomCellValue(ce.tableId, ce.rowKey, ce.colId, this.cellDraft());
    this.schemaService.closeCellEditor();
  }

  deleteCellValue(): void {
    const ce = this.schemaService.cellEditorState();
    if (!ce) return;
    this.schemaService.deleteCustomCellValue(ce.tableId, ce.rowKey, ce.colId);
    this.schemaService.closeCellEditor();
  }
}
