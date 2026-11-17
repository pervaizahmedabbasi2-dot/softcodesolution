import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  CustomColumnType,
  SchoolCustomColumn,
  SchoolTableSchemaService
} from '../../services/school-table-schema.service';

@Component({
  selector: 'app-school-custom-form-fields',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isBottomSlot() ? (slotColumns().length > 0 || (schemaService.isOwner() && allowSchemaEdit())) : slotColumns().length > 0) {
      <div
        class="rounded-2xl border border-indigo-200/80 text-xs"
        [class]="isBottomSlot() ? 'bg-indigo-50/40 p-3.5 sm:p-4 space-y-3' : 'bg-indigo-50/35 p-3 space-y-2.5'"
      >
        @if (isBottomSlot()) {
          <!-- Header Bar (Bottom Builder Slot Only) -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-indigo-600">dynamic_form</mat-icon>
                <span class="font-black text-slate-900 text-xs truncate">
                  {{ customTitle() || 'Additional Table Fields' }}
                </span>
                @if (customColumns().length > 0) {
                  <span class="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                    {{ customColumns().length }} custom {{ customColumns().length === 1 ? 'field' : 'fields' }}
                  </span>
                }
              </div>
              @if (schemaService.isOwner() && allowSchemaEdit()) {
                <p class="text-[10px] font-medium text-slate-500 mt-0.5">
                  Owner Only · Place fields before, between, or after form sections &amp; table columns · Syncs with {{ portalsLabel() }}
                </p>
              }
            </div>

            @if (schemaService.isOwner() && allowSchemaEdit()) {
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  (click)="toggleCustomizer()"
                  class="px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                  [class]="showCustomizer() ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200'"
                >
                  <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">tune</mat-icon>
                  <span>{{ showCustomizer() ? 'Hide Field Builder' : '+ Add / Remove Fields' }}</span>
                </button>
                <button
                  type="button"
                  (click)="openStudio()"
                  class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                  title="Open Full Column, Row & Portal Table Studio"
                >
                  <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">view_column</mat-icon>
                  <span>Table Studio</span>
                </button>
              </div>
            }
          </div>

          <!-- Inline Owner Form/Table Schema Customizer -->
          @if (schemaService.isOwner() && allowSchemaEdit() && showCustomizer()) {
            <div class="rounded-xl bg-white border border-slate-200/90 p-3 space-y-3 shadow-2xs">
              <!-- Custom Form / Table Title Control -->
              <div class="flex flex-col sm:flex-row sm:items-end gap-2 pb-2.5 border-b border-slate-100">
                <div class="flex-1 min-w-0">
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Form &amp; Table Custom Title (Synced Across Portals)
                  </label>
                  <input
                    type="text"
                    [value]="titleDraft()"
                    (input)="titleDraft.set($any($event.target).value)"
                    [placeholder]="defaultTitle() || 'Optional custom form/table title...'"
                    class="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    (click)="saveTitle()"
                    class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">check</mat-icon>
                    <span>Apply Title</span>
                  </button>
                  @if (customTitle()) {
                    <button
                      type="button"
                      (click)="clearTitle()"
                      class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                      title="Remove custom title"
                    >
                      <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">delete_outline</mat-icon>
                      <span>Remove</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Add Custom Field & Position Controls -->
              <div class="space-y-2">
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div class="sm:col-span-4">
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">New Field / Column Label *</label>
                    <input
                      type="text"
                      [value]="newLabel()"
                      (input)="newLabel.set($any($event.target).value)"
                      placeholder="e.g. Bus Route, Remarks"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div class="sm:col-span-3">
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Input Type</label>
                    <select
                      [value]="newType()"
                      (change)="newType.set($any($event.target).value)"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="badge">Badge</option>
                      <option value="select">Dropdown List</option>
                    </select>
                  </div>
                  <div class="sm:col-span-3">
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      {{ newType() === 'select' ? 'Options (comma-separated)' : 'Default Value' }}
                    </label>
                    @if (newType() === 'select') {
                      <input
                        type="text"
                        [value]="newOptions()"
                        (input)="newOptions.set($any($event.target).value)"
                        placeholder="e.g. Yes, No, Pending"
                        class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                    } @else {
                      <input
                        type="text"
                        [value]="newDefault()"
                        (input)="newDefault.set($any($event.target).value)"
                        placeholder="Optional default"
                        class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                    }
                  </div>
                  <div class="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      (click)="addField()"
                      [disabled]="!newLabel().trim()"
                      class="w-full px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">add</mat-icon>
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <!-- Table Column Position & Form Field Position Selectors -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label class="block text-[10px] font-bold uppercase text-indigo-700 mb-1">
                      Table Column Position (Insert After Column)
                    </label>
                    <select
                      [value]="newTablePos()"
                      (change)="newTablePos.set($any($event.target).value)"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-200 text-[11px] font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      @for (opt of tablePositionOptions(); track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold uppercase text-indigo-700 mb-1">
                      Form Field Position (Place After Section / Field)
                    </label>
                    <select
                      [value]="newFormPos()"
                      (change)="newFormPos.set($any($event.target).value)"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-200 text-[11px] font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      @for (opt of formPositionOptions(); track opt.key) {
                        <option [value]="opt.key">{{ opt.label }}</option>
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
          }
        } @else {
          <!-- Compact Header for Mid/Top Form Slot -->
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700">
              <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">dynamic_form</mat-icon>
              <span>Custom Fields (Placed Here)</span>
            </span>
            <span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold">
              {{ slotColumns().length }} {{ slotColumns().length === 1 ? 'field' : 'fields' }}
            </span>
          </div>
        }

        <!-- Active Custom Fields Input Grid for This Slot -->
        @if (slotColumns().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (col of slotColumns(); track col.id) {
              <div class="rounded-xl bg-white border border-slate-200/80 p-2.5 space-y-1.5">
                @if (schemaService.isOwner() && allowSchemaEdit() && editingColId() === col.id) {
                  <!-- Inline Edit Label + Table Position + Form Position -->
                  <div class="space-y-1.5">
                    <div class="flex items-center gap-1">
                      <input
                        type="text"
                        [value]="editColLabel()"
                        (input)="editColLabel.set($any($event.target).value)"
                        placeholder="Field label"
                        class="flex-1 min-w-0 px-2 py-1 rounded-md border border-indigo-300 text-[11px] font-bold text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        (click)="saveRenameCol(col.id)"
                        class="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                        title="Save label & positions"
                      >
                        <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">check</mat-icon>
                      </button>
                      <button
                        type="button"
                        (click)="editingColId.set('')"
                        class="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Cancel"
                      >
                        <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">close</mat-icon>
                      </button>
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                      <select
                        [value]="editColTablePos()"
                        (change)="editColTablePos.set($any($event.target).value)"
                        class="w-full px-2 py-1 rounded-md bg-indigo-50/50 border border-indigo-200 text-[10px] font-semibold text-slate-800 focus:outline-none"
                        title="Table column position"
                      >
                        @for (opt of getEditTablePositionOptions(col.id); track opt.value) {
                          <option [value]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                      <select
                        [value]="editColFormPos()"
                        (change)="editColFormPos.set($any($event.target).value)"
                        class="w-full px-2 py-1 rounded-md bg-indigo-50/50 border border-indigo-200 text-[10px] font-semibold text-slate-800 focus:outline-none"
                        title="Form field position"
                      >
                        @for (opt of formPositionOptions(); track opt.key) {
                          <option [value]="opt.key">{{ opt.label }}</option>
                        }
                      </select>
                    </div>
                  </div>
                } @else {
                  <div class="flex items-center justify-between gap-2">
                    <label class="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1.5">
                      <span>{{ col.label }}</span>
                      <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase">{{ col.type }}</span>
                    </label>
                    @if (schemaService.isOwner() && allowSchemaEdit()) {
                      <div class="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          (click)="startRenameCol(col)"
                          class="p-1 rounded-md text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                          title="Edit label or move table/form position"
                        >
                          <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">edit</mat-icon>
                        </button>
                        <button
                          type="button"
                          (click)="removeField(col.id)"
                          class="p-1 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete this field &amp; column from form, table &amp; database"
                        >
                          <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">delete</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                  @if (schemaService.isOwner() && allowSchemaEdit()) {
                    <div class="flex flex-wrap gap-1">
                      <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold truncate max-w-full">
                        {{ schemaService.describeColumnTablePosition(tableId(), col) }}
                      </span>
                      <span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-semibold truncate max-w-full">
                        {{ schemaService.describeColumnFormPosition(tableId(), col) }}
                      </span>
                    </div>
                  }
                }

                @if (col.type === 'select' && col.options && col.options.length > 0) {
                  <select
                    [value]="getFieldValue(col)"
                    (change)="updateFieldValue(col.id, $any($event.target).value)"
                    class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select {{ col.label }} --</option>
                    @for (opt of col.options; track opt) {
                      <option [value]="opt">{{ opt }}</option>
                    }
                  </select>
                } @else {
                  <input
                    [type]="col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : 'text')"
                    [value]="getFieldValue(col)"
                    (input)="updateFieldValue(col.id, $any($event.target).value)"
                    [placeholder]="col.defaultValue ? 'Default: ' + col.defaultValue : 'Enter ' + col.label + '...'"
                    class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                }
              </div>
            }
          </div>
        } @else if (isBottomSlot() && schemaService.isOwner() && allowSchemaEdit()) {
          @if (customColumns().length > 0) {
            <p class="text-[11px] text-indigo-700/80 font-medium italic">
              All {{ customColumns().length }} custom {{ customColumns().length === 1 ? 'field is' : 'fields are' }} placed in specific form sections above. Use <strong>Table Studio</strong> or click Edit on any field above to move or remove them.
            </p>
          } @else {
            <p class="text-[11px] text-slate-500 italic">
              No extra custom fields yet. Click <strong>+ Add / Remove Fields</strong> above to add custom fields to both this form and its table.
            </p>
          }
        }
      </div>
    }
  `
})
export class SchoolCustomFormFieldsComponent {
  readonly schemaService = inject(SchoolTableSchemaService);

  readonly tableId = input.required<string>();
  readonly values = input<Record<string, string>>({});
  readonly allowSchemaEdit = input<boolean>(true);
  readonly defaultTitle = input<string>('');
  readonly slotAnchor = input<string>('__bottom__');

  readonly valuesChange = output<Record<string, string>>();

  readonly showCustomizer = signal<boolean>(false);
  readonly titleDraft = signal<string>('');
  readonly newLabel = signal<string>('');
  readonly newType = signal<CustomColumnType>('text');
  readonly newDefault = signal<string>('');
  readonly newOptions = signal<string>('');
  readonly newTablePos = signal<string>('__last__');
  readonly newFormPos = signal<string>('__last__');
  readonly editingColId = signal<string>('');
  readonly editColLabel = signal<string>('');
  readonly editColTablePos = signal<string>('__last__');
  readonly editColFormPos = signal<string>('__last__');

  readonly isBottomSlot = computed<boolean>(() => {
    const a = (this.slotAnchor() || '__bottom__').trim();
    return a === '__bottom__' || a === '__last__';
  });

  readonly activeSchema = computed(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getSchema(this.tableId());
  });

  readonly customColumns = computed<SchoolCustomColumn[]>(() => this.activeSchema().customColumns || []);
  readonly slotColumns = computed<SchoolCustomColumn[]>(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getCustomColumnsForSlot(this.tableId(), this.slotAnchor());
  });
  readonly customTitle = computed<string>(() => this.activeSchema().customTitle || '');
  readonly portalsLabel = computed<string>(() => this.schemaService.getPortalTargetsLabel(this.tableId()));

  readonly tablePositionOptions = computed(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getTableColumnPositionOptions(this.tableId());
  });

  readonly formPositionOptions = computed(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getFormAnchorOptions(this.tableId());
  });

  getEditTablePositionOptions(colId: string) {
    this.schemaService.schemaRevision();
    return this.schemaService.getTableColumnPositionOptions(this.tableId(), colId);
  }

  toggleCustomizer(): void {
    const next = !this.showCustomizer();
    if (next) {
      this.titleDraft.set(this.customTitle());
    }
    this.showCustomizer.set(next);
  }

  saveTitle(): void {
    this.schemaService.updateTableTitle(this.tableId(), this.titleDraft());
  }

  clearTitle(): void {
    this.titleDraft.set('');
    this.schemaService.updateTableTitle(this.tableId(), '');
  }

  addField(): void {
    const label = this.newLabel().trim();
    if (!label) return;
    const type = this.newType();
    const created = this.schemaService.addCustomColumn(
      this.tableId(),
      label,
      type,
      type === 'select' ? '' : this.newDefault(),
      type === 'select' ? this.newOptions() : undefined,
      false,
      this.newTablePos() || '__last__',
      this.newFormPos() || '__last__'
    );
    if (created && created.defaultValue) {
      const next = { ...(this.values() || {}), [created.id]: created.defaultValue };
      this.valuesChange.emit(next);
    }
    this.newLabel.set('');
    this.newDefault.set('');
    this.newOptions.set('');
    this.newType.set('text');
  }

  startRenameCol(col: SchoolCustomColumn): void {
    this.editingColId.set(col.id);
    this.editColLabel.set(col.label);
    this.editColTablePos.set(col.insertAfterColumn || '__last__');
    this.editColFormPos.set(col.insertAfterFormField || '__last__');
  }

  saveRenameCol(colId: string): void {
    const label = this.editColLabel().trim();
    if (label) {
      this.schemaService.updateCustomColumn(this.tableId(), colId, {
        label,
        insertAfterColumn: this.editColTablePos() || '__last__',
        insertAfterFormField: this.editColFormPos() || '__last__'
      });
    }
    this.editingColId.set('');
  }

  removeField(colId: string): void {
    this.schemaService.deleteCustomColumn(this.tableId(), colId);
    const cur = { ...(this.values() || {}) };
    if (colId in cur) {
      delete cur[colId];
      this.valuesChange.emit(cur);
    }
  }

  getFieldValue(col: SchoolCustomColumn): string {
    const map = this.values() || {};
    if (map[col.id] !== undefined) return map[col.id];
    return col.defaultValue || '';
  }

  updateFieldValue(colId: string, val: string): void {
    const next = { ...(this.values() || {}), [colId]: val };
    this.valuesChange.emit(next);
  }

  openStudio(): void {
    this.schemaService.openColumnManager(
      this.tableId(),
      this.customTitle() || this.defaultTitle() || this.tableId(),
      undefined,
      'columns'
    );
  }
}
