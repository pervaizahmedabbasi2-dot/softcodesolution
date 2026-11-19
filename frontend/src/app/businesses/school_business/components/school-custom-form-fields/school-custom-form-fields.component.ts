import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  CustomColumnType,
  FormFieldAnchorOption,
  FormManageableField,
  SchoolCustomColumn,
  SchoolTableSchemaService
} from '../../services/school-table-schema.service';

@Component({
  selector: 'app-school-custom-form-fields',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': 'inlineGrid() && !isBottomSlot() ? "contents" : "block"'
  },
  template: `
    @if (isBottomSlot()) {
      @if (slotColumns().length > 0 || (schemaService.isOwner() && allowSchemaEdit())) {
        <div class="space-y-3 text-xs">
          @if (slotColumns().length > 0) {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (col of slotColumns(); track col.id) {
                <div>
                  <div class="mb-1.5">
                    <label [class]="labelClass()">{{ col.label }}</label>
                  </div>
                  @if (col.type === 'select' && col.options && col.options.length > 0) {
                    <select
                      [value]="getFieldValue(col)"
                      (change)="updateFieldValue(col.id, $any($event.target).value)"
                      [class]="selectClass()"
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
                      [placeholder]="col.defaultValue ? col.defaultValue : 'Enter ' + col.label"
                      [class]="inputClass()"
                    />
                  }
                </div>
              }
            </div>
          }

          @if (schemaService.isOwner() && allowSchemaEdit()) {
            <div class="pt-1">
              <button
                type="button"
                (click)="toggleCustomizer()"
                class="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
              >
                <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">{{ showCustomizer() ? 'close' : 'tune' }}</mat-icon>
                <span>{{ showCustomizer() ? 'Close Field Manager' : 'Add / Delete Form Fields' }}</span>
              </button>

              @if (showCustomizer()) {
                <div class="mt-2.5 rounded-xl bg-white border border-slate-200 p-3.5 space-y-3 shadow-2xs">
                  <!-- Mode Tabs: Add Field | Delete / Edit Field -->
                  <div class="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <button
                      type="button"
                      (click)="setManagerTab('add')"
                      class="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                      [class]="managerTab() === 'add' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                    >
                      <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">add</mat-icon>
                      <span>Add Field</span>
                    </button>
                    <button
                      type="button"
                      (click)="setManagerTab('delete')"
                      class="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                      [class]="managerTab() === 'delete' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                    >
                      <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">delete_outline</mat-icon>
                      <span>Delete / Manage Fields</span>
                    </button>
                  </div>

                  @if (managerTab() === 'add') {
                    <div class="space-y-2.5">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label class="block text-[11px] font-bold text-slate-700 mb-1">Field Name *</label>
                          <input
                            type="text"
                            [value]="newLabel()"
                            (input)="newLabel.set($any($event.target).value)"
                            placeholder="e.g. Father Occupation, Bus Stop"
                            class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label class="block text-[11px] font-bold text-slate-700 mb-1">Field Type</label>
                          <select
                            [value]="newType()"
                            (change)="newType.set($any($event.target).value)"
                            class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="select">Dropdown List</option>
                          </select>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label class="block text-[11px] font-bold text-slate-700 mb-1">Place After</label>
                          <select
                            [value]="newFormPos()"
                            (change)="newFormPos.set($any($event.target).value)"
                            class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                          >
                            @for (opt of formPositionOptions(); track opt.key) {
                              <option [value]="opt.key">{{ opt.label }}</option>
                            }
                          </select>
                        </div>

                        @if (newType() === 'select') {
                          <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-1">Dropdown Choices (comma separated)</label>
                            <input
                              type="text"
                              [value]="newOptions()"
                              (input)="newOptions.set($any($event.target).value)"
                              placeholder="e.g. Yes, No, Pending"
                              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                            />
                          </div>
                        } @else {
                          <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-1">Default Value (Optional)</label>
                            <input
                              type="text"
                              [value]="newDefault()"
                              (input)="newDefault.set($any($event.target).value)"
                              placeholder="Optional default"
                              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                            />
                          </div>
                        }
                      </div>

                      <div class="flex justify-end">
                        <button
                          type="button"
                          (click)="addField()"
                          [disabled]="!newLabel().trim()"
                          class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">add</mat-icon>
                          <span>Add Field</span>
                        </button>
                      </div>
                    </div>
                  } @else {
                    <div class="space-y-3">
                      @if (manageableFields().length > 0) {
                        <div class="space-y-2">
                          <label class="block text-[11px] font-bold text-slate-700">Select Any Field to Delete or Edit</label>
                          <div class="flex flex-col sm:flex-row gap-2">
                            <select
                              [value]="effectiveSelectedManageValue()"
                              (change)="onSelectManageField($any($event.target).value)"
                              class="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                            >
                              @for (mf of manageableFields(); track mf.value) {
                                <option [value]="mf.value">{{ mf.label }}</option>
                              }
                            </select>
                            <button
                              type="button"
                              (click)="deleteSelectedManageField()"
                              class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1 shrink-0"
                            >
                              <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">delete</mat-icon>
                              <span>Delete Field</span>
                            </button>
                          </div>
                        </div>

                        @if (selectedCustomColumn(); as selCol) {
                          <div class="pt-2.5 border-t border-slate-100 space-y-2">
                            <p class="text-[11px] font-bold text-slate-600">Edit Name or Move Position</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                [value]="editColLabel()"
                                (input)="editColLabel.set($any($event.target).value)"
                                placeholder="Field name"
                                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                              />
                              <select
                                [value]="editColFormPos()"
                                (change)="editColFormPos.set($any($event.target).value)"
                                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                              >
                                @for (opt of formPositionOptionsFor(selCol.id); track opt.key) {
                                  <option [value]="opt.key">{{ opt.label }}</option>
                                }
                              </select>
                            </div>
                            <div class="flex justify-end">
                              <button
                                type="button"
                                (click)="saveSelectedCustomEdit(selCol.id)"
                                [disabled]="!editColLabel().trim()"
                                class="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                              >
                                <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">check</mat-icon>
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        }
                      } @else {
                        <p class="text-[11px] font-semibold text-slate-500">All fields are currently removed from this form.</p>
                      }

                      @if (formCustomColumns().length > 0 || hiddenBuiltinFields().length > 0) {
                        <div class="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          @if (hiddenBuiltinFields().length > 0) {
                            <div class="flex flex-wrap items-center gap-1.5">
                              <span class="text-[11px] font-bold text-slate-500">Deleted:</span>
                              @for (hf of hiddenBuiltinFields(); track hf.key) {
                                <button
                                  type="button"
                                  (click)="restoreField(hf.key)"
                                  class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                  title="Restore field to form"
                                >
                                  <span>{{ hf.label }}</span>
                                  <mat-icon class="!text-[12px] !w-[12px] !h-[12px]">restore</mat-icon>
                                </button>
                              }
                              <button
                                type="button"
                                (click)="restoreAllBuiltinFields()"
                                class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold cursor-pointer"
                              >
                                Restore All
                              </button>
                            </div>
                          }

                          @if (formCustomColumns().length > 0) {
                            <button
                              type="button"
                              (click)="deleteAllAddedFields()"
                              class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 ml-auto"
                            >
                              <mat-icon class="!text-[13px] !w-[13px] !h-[13px]">delete_sweep</mat-icon>
                              <span>Delete All Added Fields</span>
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    } @else if (slotColumns().length > 0) {
      @if (inlineGrid()) {
        @for (col of slotColumns(); track col.id) {
          <div>
            <div class="mb-1.5">
              <label [class]="labelClass()">{{ col.label }}</label>
            </div>
            @if (col.type === 'select' && col.options && col.options.length > 0) {
              <select
                [value]="getFieldValue(col)"
                (change)="updateFieldValue(col.id, $any($event.target).value)"
                [class]="selectClass()"
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
                [placeholder]="col.defaultValue ? col.defaultValue : 'Enter ' + col.label"
                [class]="inputClass()"
              />
            }
          </div>
        }
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          @for (col of slotColumns(); track col.id) {
            <div>
              <div class="mb-1.5">
                <label [class]="labelClass()">{{ col.label }}</label>
              </div>
              @if (col.type === 'select' && col.options && col.options.length > 0) {
                <select
                  [value]="getFieldValue(col)"
                  (change)="updateFieldValue(col.id, $any($event.target).value)"
                  [class]="selectClass()"
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
                  [placeholder]="col.defaultValue ? col.defaultValue : 'Enter ' + col.label"
                  [class]="inputClass()"
                />
              }
            </div>
          }
        </div>
      }
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
  readonly inlineGrid = input<boolean>(false);
  readonly inputSurface = input<'white' | 'slate'>('slate');

  readonly valuesChange = output<Record<string, string>>();

  readonly showCustomizer = signal<boolean>(false);
  readonly managerTab = signal<'add' | 'delete'>('add');
  readonly newLabel = signal<string>('');
  readonly newType = signal<CustomColumnType>('text');
  readonly newDefault = signal<string>('');
  readonly newOptions = signal<string>('');
  readonly newFormPos = signal<string>('__last__');

  readonly selectedManageValue = signal<string>('');
  readonly editColLabel = signal<string>('');
  readonly editColFormPos = signal<string>('__last__');

  readonly isBottomSlot = computed<boolean>(() => {
    const a = (this.slotAnchor() || '__bottom__').trim();
    return a === '__bottom__' || a === '__last__';
  });

  readonly labelClass = computed<string>(() =>
    this.inputSurface() === 'white'
      ? 'block font-bold text-slate-800 truncate'
      : 'block font-bold text-slate-700 truncate'
  );

  readonly inputClass = computed<string>(() =>
    this.inputSurface() === 'white'
      ? 'w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:border-indigo-600 focus:outline-none'
      : 'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none'
  );

  readonly selectClass = computed<string>(() =>
    this.inputSurface() === 'white'
      ? 'w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer'
      : 'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none cursor-pointer'
  );

  readonly formCustomColumns = computed<SchoolCustomColumn[]>(() => {
    this.schemaService.schemaRevision();
    return (this.schemaService.getSchema(this.tableId()).customColumns || []).filter(
      (c) => !c.scope || c.scope === 'form' || c.scope === 'both'
    );
  });

  readonly slotColumns = computed<SchoolCustomColumn[]>(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getCustomColumnsForSlot(this.tableId(), this.slotAnchor());
  });

  readonly formPositionOptions = computed<FormFieldAnchorOption[]>(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getFormAnchorOptions(this.tableId());
  });

  readonly manageableFields = computed<FormManageableField[]>(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getFormManageableFields(this.tableId());
  });

  readonly hiddenBuiltinFields = computed<FormFieldAnchorOption[]>(() => {
    this.schemaService.schemaRevision();
    return this.schemaService.getHiddenFormFields(this.tableId());
  });

  readonly effectiveSelectedManageValue = computed<string>(() => {
    const list = this.manageableFields();
    const cur = this.selectedManageValue();
    if (cur && list.some((m) => m.value === cur)) return cur;
    return list[0]?.value || '';
  });

  readonly selectedCustomColumn = computed<SchoolCustomColumn | null>(() => {
    const val = this.effectiveSelectedManageValue();
    if (!val.startsWith('custom:')) return null;
    const id = val.slice(7);
    return this.formCustomColumns().find((c) => c.id === id) || null;
  });

  formPositionOptionsFor(excludeColId: string): FormFieldAnchorOption[] {
    this.schemaService.schemaRevision();
    return this.schemaService.getFormAnchorOptions(this.tableId(), excludeColId);
  }

  toggleCustomizer(): void {
    const next = !this.showCustomizer();
    this.showCustomizer.set(next);
    if (next) {
      this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
    }
  }

  setManagerTab(tab: 'add' | 'delete'): void {
    this.managerTab.set(tab);
    if (tab === 'delete') {
      this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
    }
  }

  onSelectManageField(val: string): void {
    this.selectedManageValue.set(val);
    this.syncEditInputsFromSelection(val);
  }

  private syncEditInputsFromSelection(val: string): void {
    if (val.startsWith('custom:')) {
      const id = val.slice(7);
      const col = this.formCustomColumns().find((c) => c.id === id);
      if (col) {
        this.editColLabel.set(col.label);
        this.editColFormPos.set(col.insertAfterFormField || '__last__');
        return;
      }
    }
    this.editColLabel.set('');
    this.editColFormPos.set('__last__');
  }

  addField(): void {
    const label = this.newLabel().trim();
    if (!label) return;
    const type = this.newType();
    const canonical = this.schemaService.resolveCanonicalTableId(this.tableId());
    const formPos = this.newFormPos() || '__last__';
    const isAdmissionOrStudent = canonical === 'owner_admissions' || canonical === 'students_master';
    const tablePos = isAdmissionOrStudent
      ? this.schemaService.mapFormAnchorToTableColumn(this.tableId(), formPos)
      : '__last__';
    const created = this.schemaService.addCustomColumn(
      this.tableId(),
      label,
      type,
      type === 'select' ? '' : this.newDefault(),
      type === 'select' ? this.newOptions() : undefined,
      false,
      tablePos,
      formPos,
      isAdmissionOrStudent ? 'both' : 'form'
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

  saveSelectedCustomEdit(colId: string): void {
    const label = this.editColLabel().trim();
    if (!label) return;
    this.schemaService.updateCustomColumn(this.tableId(), colId, {
      label,
      insertAfterFormField: this.editColFormPos() || '__last__'
    });
  }

  deleteSelectedManageField(): void {
    const val = this.effectiveSelectedManageValue();
    if (!val) return;
    const target = this.manageableFields().find((m) => m.value === val);
    const label = target?.label || 'this field';
    this.schemaService.openConfirm({
      title: 'Delete Form Field?',
      message: `Are you sure you want to remove "${label}" from this form?`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        if (val.startsWith('custom:')) {
          const colId = val.slice(7);
          this.schemaService.deleteCustomColumn(this.tableId(), colId);
          const cur = { ...(this.values() || {}) };
          if (colId in cur) {
            delete cur[colId];
            this.valuesChange.emit(cur);
          }
        } else if (val.startsWith('builtin:')) {
          const key = val.slice(8);
          this.schemaService.hideFormField(this.tableId(), key);
        }
        this.selectedManageValue.set('');
        this.syncEditInputsFromSelection(this.effectiveSelectedManageValue());
      }
    });
  }

  deleteAllAddedFields(): void {
    const count = this.formCustomColumns().length;
    if (count === 0) return;
    const addedIds = new Set(this.formCustomColumns().map((c) => c.id));
    this.schemaService.openConfirm({
      title: 'Delete All Added Fields?',
      message: `Are you sure you want to delete all ${count} added form field(s)?`,
      confirmLabel: 'Delete All',
      danger: true,
      onConfirm: () => {
        this.schemaService.deleteAllCustomColumns(this.tableId(), 'form');
        const cur = { ...(this.values() || {}) };
        let changed = false;
        for (const id of addedIds) {
          if (id in cur) {
            delete cur[id];
            changed = true;
          }
        }
        if (changed) {
          this.valuesChange.emit(cur);
        }
        this.selectedManageValue.set('');
      }
    });
  }

  restoreField(fieldKey: string): void {
    this.schemaService.restoreFormField(this.tableId(), fieldKey);
  }

  restoreAllBuiltinFields(): void {
    this.schemaService.restoreAllFormFields(this.tableId());
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
}
