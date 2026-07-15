import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface DraftFieldChange {
  field: string;
  value: any;
}

@Component({
  selector: 'app-dashboard-module-catalog',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './module-catalog.component.html',
  styles: [':host{display:block;width:100%;}']
})
export class DashboardModuleCatalogComponent {
  // SCS_DASHBOARD_MODULE_CATALOG_COMPONENT_V1

  @Input() mode:
    'panel' | 'modal' = 'panel';

  @Input() activeView = '';

  @Input() moduleCatalog: any[] = [];
  @Input() moduleCatalogCategories:
    string[] = [];

  @Input() filteredModuleCatalog:
    any[] = [];

  @Input() moduleCatalogCategory = 'all';
  @Input() moduleCatalogSearch = '';

  @Input() moduleCatalogEditorOpen = false;

  @Input() moduleCatalogEditorMode:
    'create' | 'edit' = 'create';

  @Input() moduleCatalogEditorBusy = false;
  @Input() moduleCatalogEditorMessage = '';
  @Input() moduleCatalogEditorOk = true;
  @Input() moduleCatalogDraft: any = {};

  @Input() countModulesByCategoryFn:
    (category: any) => number =
      () => 0;

  @Input() formatModuleCategoryFn:
    (category: any) => string =
      () => '';

  @Input() editorTitleFn:
    () => string =
      () => '';

  @Output() categoryChange =
    new EventEmitter<string>();

  @Output() searchChange =
    new EventEmitter<string>();

  @Output() createModule =
    new EventEmitter<void>();

  @Output() reloadCatalog =
    new EventEmitter<void>();

  @Output() editModule =
    new EventEmitter<any>();

  @Output() closeEditor =
    new EventEmitter<void>();

  @Output() draftFieldChange =
    new EventEmitter<DraftFieldChange>();

  @Output() saveEditor =
    new EventEmitter<void>();

  setModuleCatalogCategory(
    category: any
  ): void {
    this.categoryChange.emit(
      String(category || 'all')
    );
  }

  setModuleCatalogSearch(
    value: any
  ): void {
    this.searchChange.emit(
      String(value || '')
    );
  }

  countModulesByCategory(
    category: any
  ): number {
    return this.countModulesByCategoryFn(
      category
    );
  }

  formatModuleCategory(
    category: any
  ): string {
    return this.formatModuleCategoryFn(
      category
    );
  }

  moduleCatalogEditorTitle(): string {
    return this.editorTitleFn();
  }

  openModuleCatalogCreate(): void {
    this.createModule.emit();
  }

  loadModuleCatalogForSuperadmin(): void {
    this.reloadCatalog.emit();
  }

  openModuleCatalogEdit(
    module: any
  ): void {
    this.editModule.emit(module);
  }

  closeModuleCatalogEditor(): void {
    this.closeEditor.emit();
  }

  setModuleCatalogDraftField(
    field: string,
    value: any
  ): void {
    this.draftFieldChange.emit({
      field,
      value
    });
  }

  saveModuleCatalogEditor(): void {
    this.saveEditor.emit();
  }
}
