import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule
} from 'lucide-angular';

type DraftFieldName =
  | 'monthly_price'
  | 'yearly_price'
  | 'status'
  | 'sort_order';

interface DraftFieldChange {
  field: DraftFieldName;
  value: any;
}

@Component({
  selector: 'app-dashboard-plans-pricing',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './plans-pricing.component.html',
  styles: [':host{display:block;width:100%;}']
})
export class DashboardPlansPricingComponent {
  // SCS_DASHBOARD_PLANS_PRICING_COMPONENT_V1

  @Input() activeView = '';

  @Input() businessPlanLoading = false;
  @Input() businessPlanMessage = '';
  @Input() businessPlanOk = true;
  @Input() businessPlanPlans: any[] = [];
  @Input() businessPlanSaving = false;
  @Input() businessPlanSelectedInfo: any = null;
  @Input() businessPlanSelectedType = '';
  @Input() businessPlanTypes: any[] = [];

  @Input() planBuilderDraft: any = null;
  @Input() planBuilderSearch = '';
  @Input() planBuilderSelectedPlanId = '';

  @Input() filteredBusinessPlanModules:
    any[] = [];

  @Input() businessPlanIsCustomFn:
    () => boolean =
      () => false;

  @Input() businessPlanModuleScopeFn:
    (module: any) => string =
      () => '';

  @Input() formatModuleCategoryFn:
    (category: any) => string =
      () => '';

  @Input() isPlanBuilderModuleSelectedFn:
    (module: any) => boolean =
      () => false;

  @Input() planBuilderModuleCountFn:
    (plan: any) => number =
      () => 0;

  @Output() ensureLoaded =
    new EventEmitter<void>();

  @Output() businessTypeSelect =
    new EventEmitter<string>();

  @Output() planOpen =
    new EventEmitter<any>();

  @Output() draftFieldChange =
    new EventEmitter<DraftFieldChange>();

  @Output() savePlan =
    new EventEmitter<void>();

  @Output() searchChange =
    new EventEmitter<string>();

  @Output() moduleToggle =
    new EventEmitter<any>();

  businessPlanEnsureLoaded(): void {
    this.ensureLoaded.emit();
  }

  selectBusinessPlanType(value: any): void {
    this.businessTypeSelect.emit(
      String(value || '')
    );
  }

  openBusinessPlanMatrixPlan(
    plan: any
  ): void {
    this.planOpen.emit(plan);
  }

  setPlanBuilderDraftField(
    field: DraftFieldName,
    value: any
  ): void {
    this.draftFieldChange.emit({
      field,
      value
    });
  }

  saveBusinessPlanMatrix(): void {
    this.savePlan.emit();
  }

  setPlanBuilderSearch(value: any): void {
    this.searchChange.emit(
      String(value || '')
    );
  }

  togglePlanBuilderModule(
    module: any
  ): void {
    this.moduleToggle.emit(module);
  }

  businessPlanIsCustom(): boolean {
    return this.businessPlanIsCustomFn();
  }

  businessPlanModuleScope(
    module: any
  ): string {
    return this.businessPlanModuleScopeFn(
      module
    );
  }

  formatModuleCategory(
    category: any
  ): string {
    return this.formatModuleCategoryFn(
      category
    );
  }

  isPlanBuilderModuleSelected(
    module: any
  ): boolean {
    return this.isPlanBuilderModuleSelectedFn(
      module
    );
  }

  planBuilderModuleCount(
    plan: any
  ): number {
    return this.planBuilderModuleCountFn(
      plan
    );
  }
}
