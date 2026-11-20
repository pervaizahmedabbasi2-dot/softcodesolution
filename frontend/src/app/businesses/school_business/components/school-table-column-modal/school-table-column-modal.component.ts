import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  CustomColumnType,
  HiddenTableColumnOption,
  SchoolCustomColumn,
  SchoolCustomRow,
  SchoolTableSchemaService,
  TableCatalogItem,
  TableManageableColumn
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
    <!-- TABLE EDITOR MODAL (CLEAN FORM-MANAGER PARITY DESIGN)                   -->
    <!-- ======================================================================= -->
    @if (schemaService.isOwner() && managerState().open) {
      <div
        class="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        (click)="closeManager()"
      >
        <div
          class="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/95 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <mat-icon class="!text-[17px] !w-[17px] !h-[17px]">table_chart</mat-icon>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-900 truncate">
                  Edit Table — {{ activeDisplayTitle() }}
                </h3>
                <p class="text-[11px] font-medium text-slate-500 truncate">
                  Auto-syncs Table columns ↔ Form fields and saves to SQLite &amp; Cloud Firestore.
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

          <!-- Table Switcher + Clean 2-Tab Navigation -->
          <div class="px-4 sm:px-5 py-3 border-b border-slate-200/70 bg-white space-y-2.5">
            <div>
              <select
                [value]="canonicalTableId()"
                (change)="onSwitchTable($any($event.target).value)"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                aria-label="Select Table"
              >
                @for (cat of catalogTables(); track cat.canonicalId) {
                  <option [value]="cat.canonicalId">{{ cat.title }}</option>
                }
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="activeTab.set('columns')"
                class="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5"
                [class]="activeTab() === 'columns' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">view_column</mat-icon>
                <span>Table Columns</span>
              </button>
              <button
                type="button"
                (click)="activeTab.set('rows')"
                class="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5"
                [class]="activeTab() === 'rows' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">playlist_add</mat-icon>
                <span>Table Rows ({{ totalCustomEntriesCount() }})</span>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
            <!-- =============================================================== -->
            <!-- TAB 1: TABLE COLUMNS (MATCHES CLEAN FORM FIELD MANAGER UX)      -->
            <!-- =============================================================== -->
            @if (activeTab() === 'columns') {
              <div class="rounded-2xl bg-white border border-slate-200 p-4 space-y-3.5 shadow-2xs">
                <!-- Mode Sub-Tabs: Add Column | Delete / Manage Columns -->
                <div class="flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    (click)="setColMode('add')"
                    class="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                    [class]="colMode() === 'add' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">add</mat-icon>
                    <span>Add Column</span>
                  </button>
                  <button
                    type="button"
                    (click)="setColMode('delete')"
                    class="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                    [class]="colMode() === 'delete' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">delete_outline</mat-icon>
                    <span>Delete / Manage Columns</span>
                  </button>
                </div>

                @if (colMode() === 'add') {
                  <!-- ADD COLUMN FORM -->
                  <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-[11px] font-bold text-slate-700 mb-1">Column Name *</label>
                        <input
                          type="text"
                          [value]="newColLabel()"
                          (input)="newColLabel.set($any($event.target).value)"
                          placeholder="e.g. Bus Route, Remarks, Fee Note"
                          class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-bold text-slate-700 mb-1">Column Type</label>
                        <select
                          [value]="newColType()"
                          (change)="newColType.set($any($event.target).value)"
                          class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Dropdown List</option>
                          <option value="badge">Badge</option>
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-[11px] font-bold text-slate-700 mb-1">Place After</label>
                        <select
                          [value]="newColTablePos()"
                          (change)="newColTablePos.set($any($event.target).value)"
                          class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                        >
                          @for (opt of addPositionOptions(); track opt.value) {
                            <option [value]="opt.value">{{ opt.label }}</option>
                          }
                        </select>
                      </div>

                      @if (newColType() === 'select') {
                        <div>
                          <label class="block text-[11px] font-bold text-slate-700 mb-1">Dropdown Choices (comma separated)</label>
                          <input
                            type="text"
                            [value]="newColOptions()"
                            (input)="newColOptions.set($any($event.target).value)"
                            placeholder="e.g. Paid, Pending, Exempt"
                            class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                      } @else {
                        <div>
                          <label class="block text-[11px] font-bold text-slate-700 mb-1">Default Value (Optional)</label>
                          <input
                            type="text"
                            [value]="newColDefault()"
                            (input)="newColDefault.set($any($event.target).value)"
                            placeholder="Optional default cell text"
                            class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                      }
                    </div>

                    <div class="flex justify-end pt-1">
                      <button
                        type="button"
                        (click)="addTableColumn()"
                        [disabled]="!newColLabel().trim()"
                        class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                      >
                        <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">add</mat-icon>
                        <span>Add Column</span>
                      </button>
                    </div>
                  </div>
                } @else {
                  <!-- DELETE / MANAGE COLUMNS -->
                  <div class="space-y-3.5">
                    @if (manageableColumns().length > 0) {
                      <div class="space-y-2">
                        <label class="block text-[11px] font-bold text-slate-700">Select Any Column to Delete or Edit</label>
                        <div class="flex flex-col sm:flex-row gap-2">
                          <select
                            [value]="effectiveSelectedManageValue()"
                            (change)="onSelectManageColumn($any($event.target).value)"
                            class="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                          >
                            @for (mc of manageableColumns(); track mc.value) {
                              <option [value]="mc.value">{{ mc.label }}</option>
                            }
                          </select>
                          <button
                            type="button"
                            (click)="deleteSelectedManageColumn()"
                            [disabled]="manageableColumns().length <= 1"
                            class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1 shrink-0 transition-colors"
                          >
                            <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">delete</mat-icon>
                            <span>Delete Column</span>
                          </button>
                        </div>
                      </div>

                      <!-- Edit Selected Column Name / Position -->
                      @if (selectedCustomColumn(); as selCol) {
                        <div class="pt-3 border-t border-slate-100 space-y-2.5">
                          <p class="text-[11px] font-bold text-slate-600">Edit Column Name or Move Position</p>
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              [value]="editColLabel()"
                              (input)="editColLabel.set($any($event.target).value)"
                              placeholder="Column name"
                              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                            />
                            <select
                              [value]="editColTablePos()"
                              (change)="editColTablePos.set($any($event.target).value)"
                              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                            >
                              @for (opt of editPositionOptionsFor(selCol.id); track opt.value) {
                                <option [value]="opt.value">{{ opt.label }}</option>
                              }
                            </select>
                          </div>
                          @if (selCol.type === 'select') {
                            <div>
                              <input
                                type="text"
                                [value]="editColOptions()"
                                (input)="editColOptions.set($any($event.target).value)"
                                placeholder="Dropdown choices (comma separated)"
                                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                              />
                            </div>
                          }
                          <div class="flex justify-end">
                            <button
                              type="button"
                              (click)="saveSelectedCustomEdit(selCol)"
                              [disabled]="!editColLabel().trim()"
                              class="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                            >
                              <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">check</mat-icon>
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      } @else if (selectedBuiltInColumn(); as selBuilt) {
                        <div class="pt-3 border-t border-slate-100 space-y-2">
                          <p class="text-[11px] font-bold text-slate-600">Edit Column Name</p>
                          <div class="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              [value]="editColLabel()"
                              (input)="editColLabel.set($any($event.target).value)"
                              [placeholder]="selBuilt.originalLabel"
                              class="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              (click)="saveSelectedBuiltInRename(selBuilt)"
                              [disabled]="!editColLabel().trim()"
                              class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1 shrink-0"
                            >
                              <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">check</mat-icon>
                              <span>Save Name</span>
                            </button>
                          </div>
                        </div>
                      }
                    } @else {
                      <p class="text-xs font-semibold text-slate-500 py-2">
                        No active columns left to edit. Restore a deleted column below or switch to Add Column.
                      </p>
                    }

                    <!-- Deleted Built-in Columns Restore Strip + Bulk / Reset Actions -->
                    <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      @if (hiddenBuiltInColumns().length > 0) {
                        <div class="flex flex-wrap items-center gap-1.5">
                          <span class="text-[11px] font-bold text-slate-500">Deleted:</span>
                          @for (hc of hiddenBuiltInColumns(); track hc.index) {
                            <button
                              type="button"
                              (click)="restoreColumn(hc)"
                              class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                              title="Restore column to table"
                            >
                              <span>{{ hc.displayLabel }}</span>
                              <mat-icon class="!text-[13px] !w-[13px] !h-[13px]">restore</mat-icon>
                            </button>
                          }
                          <button
                            type="button"
                            (click)="restoreAllBuiltInColumns()"
                            class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold cursor-pointer"
                          >
                            Restore All
                          </button>
                        </div>
                      }

                      <div class="flex flex-wrap items-center gap-2 ml-auto">
                        @if (tableCustomColumns().length > 0) {
                          <button
                            type="button"
                            (click)="deleteAllTableColumns()"
                            class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">delete_sweep</mat-icon>
                            <span>Delete All Added Columns</span>
                          </button>
                        }
                        <button
                          type="button"
                          (click)="resetTable()"
                          class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">restart_alt</mat-icon>
                          <span>Reset Table</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Optional Table Heading Card (Kept Secondary & Clean) -->
                  <div class="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <label class="text-[11px] font-bold text-slate-600">Table Heading (Optional)</label>
                      @if (activeSchema().customTitle) {
                        <button
                          type="button"
                          (click)="clearTableTitle()"
                          class="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Remove Heading
                        </button>
                      }
                    </div>
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        [value]="titleDraft()"
                        (input)="titleDraft.set($any($event.target).value)"
                        [placeholder]="managerState().tableTitle || 'Custom table heading...'"
                        class="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        (click)="saveTableTitle()"
                        class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- =============================================================== -->
            <!-- TAB 2: TABLE ROWS                                               -->
            <!-- =============================================================== -->
            @if (activeTab() === 'rows') {
              <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 class="text-xs font-black text-slate-900">Add Rows Directly to This Table</h4>
                    <p class="text-[11px] text-slate-500">Enter values for the table columns below.</p>
                  </div>
                  <button
                    type="button"
                    (click)="addStudioDraftRow()"
                    class="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-800 hover:text-emerald-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">add</mat-icon>
                    <span>Add Another Row</span>
                  </button>
                </div>

                <!-- Compact Row Placement -->
                <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                  <label class="text-[11px] font-bold text-slate-600 shrink-0">Place row at:</label>
                  <select
                    [value]="studioRowPos()"
                    (change)="studioRowPos.set($any($event.target).value)"
                    class="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                  >
                    @for (opt of studioRowPositionOptions(); track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                </div>

                <!-- Draft Rows -->
                <div class="space-y-2.5">
                  @for (row of studioDraftRows(); track row.tempId; let rIdx = $index) {
                    <div class="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                      <div class="flex items-center justify-between">
                        <span class="text-[11px] font-black text-slate-700">Row #{{ rIdx + 1 }}</span>
                        @if (studioDraftRows().length > 1) {
                          <button
                            type="button"
                            (click)="removeStudioDraftRow(row.tempId)"
                            class="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <mat-icon class="!text-[13px] !w-[13px] !h-[13px]">close</mat-icon>
                            <span>Remove</span>
                          </button>
                        }
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        @for (item of studioOrderedColumns(); track $index) {
                          @if (item.kind === 'builtin') {
                            @if (!item.hidden) {
                              <div>
                                <label class="block text-[11px] font-bold text-slate-700 mb-1 truncate">
                                  {{ item.displayLabel }}
                                </label>
                                <input
                                  type="text"
                                  [value]="row.values['built_' + item.header.index] ?? ''"
                                  (input)="updateStudioDraftCell(row.tempId, 'built_' + item.header.index, $any($event.target).value)"
                                  [placeholder]="item.displayLabel"
                                  class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:border-slate-400 focus:outline-none"
                                />
                              </div>
                            }
                          } @else {
                            <div>
                              <label class="block text-[11px] font-bold text-slate-700 mb-1 truncate">{{ item.col.label }}</label>
                              @if (item.col.type === 'select' && item.col.options && item.col.options.length > 0) {
                                <select
                                  [value]="row.values[item.col.id] ?? item.col.defaultValue ?? ''"
                                  (change)="updateStudioDraftCell(row.tempId, item.col.id, $any($event.target).value)"
                                  class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:border-slate-400 focus:outline-none cursor-pointer"
                                >
                                  <option value="">-- Select --</option>
                                  @for (opt of item.col.options; track opt) {
                                    <option [value]="opt">{{ opt }}</option>
                                  }
                                </select>
                              } @else {
                                <input
                                  [type]="item.col.type === 'number' ? 'number' : (item.col.type === 'date' ? 'date' : 'text')"
                                  [value]="row.values[item.col.id] ?? item.col.defaultValue ?? ''"
                                  (input)="updateStudioDraftCell(row.tempId, item.col.id, $any($event.target).value)"
                                  [placeholder]="item.col.label"
                                  class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:border-slate-400 focus:outline-none"
                                />
                              }
                            </div>
                          }
                        }
                      </div>
                    </div>
                  }
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    (click)="submitStudioDraftRows()"
                    class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">check_circle</mat-icon>
                    <span>{{ studioDraftRows().length === 1 ? 'Save Row to Table' : 'Save ' + studioDraftRows().length + ' Rows to Table' }}</span>
                  </button>
                </div>
              </div>

              <!-- Saved Table Rows -->
              @if (activeSchema().customRows.length > 0) {
                <div class="space-y-2">
                  <h4 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-slate-600">table_rows</mat-icon>
                    <span>Added Table Rows ({{ activeSchema().customRows.length }})</span>
                  </h4>
                  <div class="space-y-2">
                    @for (crow of activeSchema().customRows; track crow.rowKey) {
                      <div class="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div class="flex items-center justify-between gap-2">
                          <span class="font-bold text-xs text-slate-900 truncate">{{ crow.rowLabel || crow.rowKey }}</span>
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
                                class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                                title="Edit Row"
                              >
                                <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">edit</mat-icon>
                              </button>
                              <button
                                type="button"
                                (click)="deleteCustomRow(crow)"
                                class="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                title="Delete Row"
                              >
                                <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">delete</mat-icon>
                              </button>
                            }
                          </div>
                        </div>

                        @if (editingRowKey() === crow.rowKey) {
                          <div class="pt-2 border-t border-slate-100 space-y-2">
                            <div>
                              <label class="block text-[11px] font-bold text-slate-600 mb-0.5">Row Position</label>
                              <select
                                [value]="editRowPos()"
                                (change)="editRowPos.set($any($event.target).value)"
                                class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 cursor-pointer"
                              >
                                @for (opt of studioRowPositionOptions(); track opt.value) {
                                  @if (opt.value !== 'after:' + crow.rowKey) {
                                    <option [value]="opt.value">{{ opt.label }}</option>
                                  }
                                }
                              </select>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              @for (item of studioOrderedColumns(); track $index) {
                                @if (item.kind === 'builtin') {
                                  @if (!item.hidden) {
                                    <div>
                                      <label class="block text-[10px] font-bold text-slate-600 mb-0.5">{{ item.displayLabel }}</label>
                                      <input
                                        type="text"
                                        [value]="editRowValues()['built_' + item.header.index] ?? ''"
                                        (input)="updateEditRowField('built_' + item.header.index, $any($event.target).value)"
                                        class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                                      />
                                    </div>
                                  }
                                } @else {
                                  <div>
                                    <label class="block text-[10px] font-bold text-slate-600 mb-0.5">{{ item.col.label }}</label>
                                    <input
                                      type="text"
                                      [value]="editRowValues()[item.col.id] ?? ''"
                                      (input)="updateEditRowField(item.col.id, $any($event.target).value)"
                                      class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                                    />
                                  </div>
                                }
                              }
                            </div>
                          </div>
                        } @else {
                          <div class="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                            @for (h of visibleHeaders(); track h.index) {
                              @if (crow.values['built_' + h.index]) {
                                <span class="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80">
                                  <strong>{{ getHeaderValue(h.index, h.originalLabel) }}:</strong> {{ crow.values['built_' + h.index] }}
                                </span>
                              }
                            }
                            @for (col of tableCustomColumns(); track col.id) {
                              @if (crow.values[col.id]) {
                                <span class="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80">
                                  <strong>{{ col.label }}:</strong> {{ crow.values[col.id] }}
                                </span>
                              }
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Saved Table Custom Cell Values -->
              @if (submittedCellEntries().length > 0) {
                <div class="space-y-2">
                  <h4 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-emerald-600">fact_check</mat-icon>
                    <span>Saved Cell Values ({{ submittedCellEntries().length }})</span>
                  </h4>
                  <div class="space-y-2">
                    @for (entry of submittedCellEntries(); track entry.rowKey) {
                      <div class="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div class="space-y-1 min-w-0">
                          <span class="font-mono text-[11px] font-bold text-slate-800">{{ entry.rowKey }}</span>
                          <div class="flex flex-wrap gap-1.5 text-[11px]">
                            @for (cell of entry.cells; track cell.colId) {
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/80">
                                <strong>{{ cell.colLabel }}:</strong> {{ cell.value }}
                                <button
                                  type="button"
                                  (click)="editSubmittedCell(entry.rowKey, cell.colId, cell.colLabel, cell.colType, cell.value)"
                                  class="ml-1 text-slate-700 hover:text-slate-950 cursor-pointer font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  (click)="deleteSubmittedCell(entry.rowKey, cell.colId, cell.colLabel)"
                                  class="ml-0.5 text-rose-600 hover:text-rose-900 cursor-pointer font-bold"
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
                          Remove
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- Footer -->
          <div class="px-4 sm:px-5 py-3 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-3">
            <span class="text-[11px] font-medium text-slate-500">
              Table changes save automatically
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
    <!-- TABLE CELL EDITOR MODAL (CLICK ON A CUSTOM CELL IN THE TABLE)           -->
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
              <h3 class="text-sm font-black text-slate-900">Edit Table Cell</h3>
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
              <span>Clear</span>
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
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ======================================================================= -->
    <!-- PREMIUM CONFIRMATION ALERT MODAL (SUPERADMIN ALL-CLIENTS PARITY)        -->
    <!-- ======================================================================= -->
    @if (schemaService.isOwner() && confirmDialog(); as cd) {
      <div
        class="fixed inset-0 z-[10050] flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-md animate-fade-in"
        (click)="cancelConfirm()"
      >
        <div
          class="w-full max-w-sm rounded-2xl overflow-hidden bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.22),0_12px_28px_-6px_rgba(0,0,0,0.12)] p-6 sm:p-7 text-center animate-scale-up"
          (click)="$event.stopPropagation()"
        >
          <div
            class="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border shadow-sm"
            [class]="cd.danger !== false ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'"
          >
            <mat-icon
              class="!text-[28px] !w-[28px] !h-[28px]"
              [class]="cd.danger !== false ? 'text-rose-600' : 'text-emerald-600'"
            >
              {{ cd.danger !== false ? 'warning_amber' : 'info' }}
            </mat-icon>
          </div>
          <h3 class="text-base font-bold text-slate-900 tracking-tight">{{ cd.title }}</h3>
          <p class="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">{{ cd.message }}</p>
          <div class="flex gap-3 mt-6">
            <button
              type="button"
              (click)="cancelConfirm()"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer"
            >
              {{ cd.cancelLabel || 'Cancel' }}
            </button>
            <button
              type="button"
              (click)="acceptConfirm()"
              class="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              [class]="cd.danger !== false ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0071E3] hover:bg-[#0077ED]'"
            >
              {{ cd.confirmLabel || 'Delete' }}
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
  readonly confirmDialog = this.schemaService.confirmDialogState;

  readonly activeTab = signal<'columns' | 'rows'>('columns');
  readonly colMode = signal<'add' | 'delete'>('add');

  // Add Column form state
  readonly newColLabel = signal<string>('');
  readonly newColType = signal<CustomColumnType>('text');
  readonly newColDefault = signal<string>('');
  readonly newColOptions = signal<string>('');
  readonly newColTablePos = signal<string>('__last__');

  // Delete / Manage Column state
  readonly selectedManageValue = signal<string>('');
  readonly editColLabel = signal<string>('');
  readonly editColTablePos = signal<string>('__last__');
  readonly editColOptions = signal<string>('');
  readonly titleDraft = signal<string>('');

  // Cell editor
  readonly cellDraft = signal<string>('');

  // Table Rows state
  readonly studioDraftRows = signal<DraftFormRow[]>([this.createBlankDraftRow()]);
  readonly studioRowPos = signal<string>('__first__');
  readonly editingRowKey = signal<string>('');
  readonly editRowPos = signal<string>('__first__');
  readonly editRowValues = signal<Record<string, string>>({});

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

  readonly tableCustomColumns = computed<SchoolCustomColumn[]>(() =>
    (this.activeSchema().customColumns || []).filter(
      (c) => !c.scope || c.scope === 'table' || c.scope === 'both'
    )
  );

  readonly activeDisplayTitle = computed(() => {
    return this.activeSchema().customTitle || this.managerState().tableTitle || this.canonicalTableId();
  });

  readonly addPositionOptions = computed(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getTableColumnPositionOptions(this.managerState().tableId || '');
  });

  readonly manageableColumns = computed<TableManageableColumn[]>(() => {
    this.schemaService.schemaRevision();
    const m = this.managerState();
    return this.schemaService.getTableManageableColumns(m.tableId || '', m.detectedHeaders);
  });

  readonly hiddenBuiltInColumns = computed<HiddenTableColumnOption[]>(() => {
    this.schemaService.schemaRevision();
    const m = this.managerState();
    return this.schemaService.getHiddenTableColumns(m.tableId || '', m.detectedHeaders);
  });

  readonly effectiveSelectedManageValue = computed<string>(() => {
    const list = this.manageableColumns();
    const cur = this.selectedManageValue();
    if (cur && list.some((m) => m.value === cur)) return cur;
    return list[0]?.value || '';
  });

  readonly selectedCustomColumn = computed<SchoolCustomColumn | null>(() => {
    const val = this.effectiveSelectedManageValue();
    if (!val.startsWith('custom:')) return null;
    const id = val.slice(7);
    return this.tableCustomColumns().find((c) => c.id === id) || null;
  });

  readonly selectedBuiltInColumn = computed<TableManageableColumn | null>(() => {
    const val = this.effectiveSelectedManageValue();
    if (!val.startsWith('builtin:')) return null;
    return this.manageableColumns().find((m) => m.value === val) || null;
  });

  readonly studioRowPositionOptions = computed(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getRowPositionOptions(this.managerState().tableId || '');
  });

  readonly studioOrderedColumns = computed(() => {
    this.schemaService.schemaRevision();
    const tid = this.managerState().tableId || '';
    const headers = this.managerState().detectedHeaders || [];
    return this.schemaService.resolveOrderedColumns(tid, headers, this.activeSchema());
  });

  readonly visibleHeaders = computed(() => {
    const headers = this.managerState().detectedHeaders;
    return headers.filter((h) => !this.isHidden(h.index, h.originalLabel));
  });

  readonly submittedCellEntries = computed(() => {
    const schema = this.activeSchema();
    const colMap = new Map<string, SchoolCustomColumn>();
    for (const c of this.tableCustomColumns()) colMap.set(c.id, c);
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

  constructor() {
    effect(() => {
      const m = this.managerState();
      if (m.open) {
        const s = this.schemaService.getSchema(m.tableId);
        this.titleDraft.set(s.customTitle || '');
        this.studioRowPos.set('__first__');
        if (m.initialTab === 'rows') {
          this.activeTab.set('rows');
        } else if (m.initialTab === 'reset') {
          this.activeTab.set('columns');
          this.colMode.set('delete');
        } else {
          this.activeTab.set('columns');
        }
        this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
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

  editPositionOptionsFor(excludeColId: string) {
    this.schemaService.schemaRevision();
    return this.schemaService.getTableColumnPositionOptions(
      this.managerState().tableId || '',
      excludeColId
    );
  }

  setColMode(mode: 'add' | 'delete'): void {
    this.colMode.set(mode);
    if (mode === 'delete') {
      this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
    }
  }

  onSelectManageColumn(val: string): void {
    this.selectedManageValue.set(val);
    this.syncEditInputsFromSelection(val);
  }

  private syncEditInputsFromSelection(val: string): void {
    if (val.startsWith('custom:')) {
      const id = val.slice(7);
      const col = this.tableCustomColumns().find((c) => c.id === id);
      if (col) {
        this.editColLabel.set(col.label);
        this.editColTablePos.set(col.insertAfterColumn || '__last__');
        this.editColOptions.set((col.options || []).join(', '));
        return;
      }
    } else if (val.startsWith('builtin:')) {
      const mc = this.manageableColumns().find((m) => m.value === val);
      if (mc) {
        this.editColLabel.set(mc.label);
        this.editColTablePos.set('__last__');
        this.editColOptions.set('');
        return;
      }
    }
    this.editColLabel.set('');
    this.editColTablePos.set('__last__');
    this.editColOptions.set('');
  }

  onSwitchTable(canonicalId: string): void {
    const found = this.catalogTables().find((c) => c.canonicalId === canonicalId);
    if (found) {
      this.selectedManageValue.set('');
      this.editingRowKey.set('');
      this.schemaService.switchManagedTable(found);
      this.titleDraft.set(this.schemaService.getSchema(found.tableId).customTitle || '');
      this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
    }
  }

  closeManager(): void {
    this.editingRowKey.set('');
    this.schemaService.closeColumnManager();
  }

  // --- Add Column ---
  addTableColumn(): void {
    const tableId = this.managerState().tableId;
    const label = this.newColLabel().trim();
    if (!tableId || !label) return;
    const type = this.newColType();
    const colPos = this.newColTablePos() || '__last__';
    const formPos = this.schemaService.mapTableColumnToFormAnchor(tableId, colPos);
    const opts = type === 'select'
      ? this.newColOptions().split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    this.schemaService.addCustomColumn(
      tableId,
      label,
      type,
      type === 'select' ? '' : this.newColDefault(),
      opts,
      false,
      colPos,
      formPos,
      'both'
    );
    this.newColLabel.set('');
    this.newColType.set('text');
    this.newColDefault.set('');
    this.newColOptions.set('');
  }

  // --- Delete / Edit / Restore Columns ---
  deleteSelectedManageColumn(): void {
    const tableId = this.managerState().tableId;
    const val = this.effectiveSelectedManageValue();
    if (!tableId || !val || this.manageableColumns().length <= 1) return;
    const target = this.manageableColumns().find((m) => m.value === val);
    if (!target) return;
    this.schemaService.openConfirm({
      title: 'Delete Table Column?',
      message: `Are you sure you want to remove "${target.label}" from ${this.activeDisplayTitle()} & its synced form?`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        if (target.kind === 'custom') {
          this.schemaService.deleteCustomColumn(tableId, target.key);
        } else if (typeof target.index === 'number') {
          this.schemaService.hideTableColumn(tableId, target.index, target.originalLabel);
        }
        this.selectedManageValue.set('');
        this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
      }
    });
  }

  saveSelectedCustomEdit(col: SchoolCustomColumn): void {
    const tableId = this.managerState().tableId;
    const label = this.editColLabel().trim();
    if (!tableId || !label) return;
    const nextColPos = this.editColTablePos() || '__last__';
    const opts = col.type === 'select'
      ? this.editColOptions().split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    this.schemaService.updateCustomColumn(tableId, col.id, {
      label,
      insertAfterColumn: nextColPos,
      insertAfterFormField: this.schemaService.mapTableColumnToFormAnchor(tableId, nextColPos),
      ...(col.type === 'select' ? { options: opts } : {})
    });
  }

  saveSelectedBuiltInRename(mc: TableManageableColumn): void {
    const tableId = this.managerState().tableId;
    const label = this.editColLabel().trim();
    if (!tableId || typeof mc.index !== 'number' || !label) return;
    this.schemaService.renameColumn(tableId, mc.index, label, mc.originalLabel);
  }

  restoreColumn(hc: HiddenTableColumnOption): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.restoreTableColumn(tableId, hc.index, hc.originalLabel);
  }

  restoreAllBuiltInColumns(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.restoreAllTableColumns(tableId);
  }

  deleteAllTableColumns(): void {
    const tableId = this.managerState().tableId;
    const count = this.tableCustomColumns().length;
    if (!tableId || count === 0) return;
    this.schemaService.openConfirm({
      title: 'Delete All Added Columns?',
      message: `Are you sure you want to delete all ${count} added column(s) from ${this.activeDisplayTitle()}?`,
      confirmLabel: 'Delete All',
      danger: true,
      onConfirm: () => {
        this.schemaService.deleteAllCustomColumns(tableId);
        this.selectedManageValue.set('');
        this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
      }
    });
  }

  resetTable(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.openConfirm({
      title: 'Reset Table to Default?',
      message: `This will remove all added columns, custom heading, renamed/deleted headers, and added rows for ${this.activeDisplayTitle()}.`,
      confirmLabel: 'Reset Table',
      danger: true,
      onConfirm: () => {
        this.selectedManageValue.set('');
        this.editingRowKey.set('');
        this.titleDraft.set('');
        this.schemaService.resetTableSchema(tableId);
        this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
      }
    });
  }

  saveTableTitle(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.updateTableTitle(tableId, this.titleDraft());
  }

  clearTableTitle(): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.openConfirm({
      title: 'Remove Custom Heading?',
      message: `Are you sure you want to restore the default heading for ${this.activeDisplayTitle()}?`,
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: () => {
        this.titleDraft.set('');
        this.schemaService.updateTableTitle(tableId, '');
      }
    });
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

  // --- Table Multi-Row & Row CRUD ---
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
    const count = this.schemaService.addCustomRowsBatch(
      tableId,
      this.studioDraftRows(),
      'School Business Owner',
      this.studioRowPos() || '__first__'
    );
    if (count > 0) {
      this.studioDraftRows.set([this.createBlankDraftRow()]);
    }
  }

  startEditRow(crow: SchoolCustomRow): void {
    this.editingRowKey.set(crow.rowKey);
    this.editRowPos.set(crow.insertAfterRowKey || '__first__');
    this.editRowValues.set({ ...(crow.values || {}) });
  }

  updateEditRowField(key: string, val: string): void {
    this.editRowValues.update((cur) => ({ ...cur, [key]: val }));
  }

  saveEditedRow(crow: SchoolCustomRow): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.updateCustomRow(
      tableId,
      crow.rowKey,
      this.editRowValues(),
      crow.rowLabel,
      this.editRowPos() || '__first__'
    );
    this.editingRowKey.set('');
  }

  deleteCustomRow(crow: SchoolCustomRow): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.openConfirm({
      title: 'Delete Table Row?',
      message: `Are you sure you want to delete "${crow.rowLabel || crow.rowKey}" from this table?`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        this.schemaService.deleteCustomRow(tableId, crow.rowKey);
      }
    });
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

  deleteSubmittedCell(rowKey: string, colId: string, colLabel: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.openConfirm({
      title: 'Delete Cell Value?',
      message: `Are you sure you want to delete the saved value for "${colLabel}"?`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        this.schemaService.deleteCustomCellValue(tableId, rowKey, colId);
      }
    });
  }

  clearRecordCustomCells(rowKey: string): void {
    const tableId = this.managerState().tableId;
    if (!tableId) return;
    this.schemaService.openConfirm({
      title: 'Remove Row Values?',
      message: `Are you sure you want to remove all saved cell values for "${rowKey}"?`,
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: () => {
        this.schemaService.clearRowCustomData(tableId, rowKey);
      }
    });
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
    this.schemaService.openConfirm({
      title: 'Clear Cell Value?',
      message: `Are you sure you want to clear "${ce.colLabel}" for ${ce.rowLabel}?`,
      confirmLabel: 'Clear',
      danger: true,
      onConfirm: () => {
        this.schemaService.deleteCustomCellValue(ce.tableId, ce.rowKey, ce.colId);
        this.schemaService.closeCellEditor();
      }
    });
  }

  // --- Confirm Alert Handlers ---
  cancelConfirm(): void {
    this.schemaService.cancelConfirm();
  }

  acceptConfirm(): void {
    this.schemaService.acceptConfirm();
  }
}
