import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-saas-control',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './saas-control.component.html'
})
export class DashboardSaasControlComponent {

  bulkModuleActionRunning = false;

  selectedModuleIds = new Set<string>();

  scsIsModuleSelected(module: any): boolean {
    return this.selectedModuleIds.has(String(module?.id || ''));
  }

  scsToggleModuleSelection(module: any): void {

    const id = String(module?.id || '');

    const next = new Set(this.selectedModuleIds);

    if(next.has(id)){
      next.delete(id);
    }else{
      next.add(id);
    }

    this.selectedModuleIds = next;
  }

  scsClearSelection(): void{
    this.selectedModuleIds = new Set<string>();
  }

  scsSelectedCount(): number{
    return this.selectedModuleIds.size;
  }

  scsSelectAllVisibleModules(): void {

    const next = new Set<string>();

    for(const module of this.scsSuperVisibleModules()){
      next.add(String(module?.id || ''));
    }

    this.selectedModuleIds = next;
  }

  // SCS_DASHBOARD_SAAS_CONTROL_COMPONENT_V1

  @Input() activeView = '';
  @Input() selectedClient: any = null;
  @Input() superadminClients: any[] = [];
  @Input() tenantSubscription: any = {};

  @Input() saasClientBillingCycle:
    'monthly' | 'yearly' = 'monthly';

  @Input() saasClientPlanLoading = false;
  @Input() saasClientPlanSaving = false;
  @Input() saasClientPlanMessage = '';
  @Input() saasClientPlanOk = true;
  @Input() saasClientSelectedPlanId = '';

  @Input() scsSuperModuleSearch = '';
  @Input() scsSuperModuleCategory = 'all';
  @Input() isModulesLoading = false;

  @Input() businessLabelFn:
    () => string =
      () => '';

  @Input() enabledCountFn:
    () => number =
      () => 0;

  @Input() assignablePlansFn:
    () => any[] =
      () => [];

  @Input() businessPlanPriceFn:
    (plan: any) => number =
      () => 0;

  @Input() businessPlanModuleCountFn:
    (plan: any) => number =
      () => 0;

  @Input() businessPlanModuleNamesFn:
    (plan: any) => string =
      () => '';

  @Input() selectedPackageTotalFn:
    () => number =
      () => 0;

  @Input() categoriesFn:
    () => string[] =
      () => [];

  @Input() moduleCategoryLabelFn:
    (category: any) => string =
      () => '';

  @Input() visibleModulesFn:
    () => any[] =
      () => [];

  @Input() trackModuleFn:
    (index: number, module: any) => string =
      (_index, module) => String(module?.id || '');

  @Input() moduleSavingFn:
    (module: any) => boolean =
      () => false;

  @Input() isModuleEnabledFn:
    (module: any) => boolean =
      () => false;

  @Input() modulePriceFn:
    (module: any) => number =
      () => 0;

  @Output() clientSelect =
    new EventEmitter<string>();

  @Output() billingCycleChange =
    new EventEmitter<string>();

  @Output() planSelect =
    new EventEmitter<string>();

  @Output() assignPlan =
    new EventEmitter<void>();

  @Output() moduleSearchChange =
    new EventEmitter<string>();

  @Output() moduleCategoryChange =
    new EventEmitter<string>();

  @Output() moduleEnabledChange =
    new EventEmitter<{
      module: any;
      enabled: boolean;
    }>();

  selectSaasControlClient(
    value: any
  ): void {
    this.clientSelect.emit(
      String(value || '')
    );
  }

  saasClientSetBillingCycle(
    value: any
  ): void {
    this.billingCycleChange.emit(
      String(value || '')
    );
  }

  saasClientSelectPlan(
    value: any
  ): void {
    this.planSelect.emit(
      String(value || '')
    );
  }

  assignSaasClientBusinessPlan(): void {
    this.assignPlan.emit();
  }

  scsSuperSetModuleSearch(
    value: any
  ): void {
    this.moduleSearchChange.emit(
      String(value || '')
    );
  }

  scsSuperSetModuleCategory(
    value: any
  ): void {
    this.moduleCategoryChange.emit(
      String(value || 'all')
    );
  }

  scsSuperSetModuleEnabled(
    module: any,
    enabled: boolean
  ): void {
    this.moduleEnabledChange.emit({
      module,
      enabled
    });
  }

  saasClientBusinessLabel(): string {
    return this.businessLabelFn();
  }

  scsSuperEnabledCount(): number {
    return this.enabledCountFn();
  }

  saasAssignablePlans(): any[] {
    return this.assignablePlansFn();
  }

  saasBusinessPlanPrice(
    plan: any
  ): number {
    return this.businessPlanPriceFn(plan);
  }

  saasBusinessPlanModuleCount(
    plan: any
  ): number {
    return this.businessPlanModuleCountFn(plan);
  }

  saasBusinessPlanModuleNames(
    plan: any
  ): string {
    return this.businessPlanModuleNamesFn(plan);
  }

  saasSelectedPackageTotal(): number {
    return this.selectedPackageTotalFn();
  }

  scsSuperCategories(): string[] {
    return this.categoriesFn();
  }

  moduleCategoryLabel(
    category: any
  ): string {
    return this.moduleCategoryLabelFn(category);
  }

  scsSuperVisibleModules(): any[] {
    return this.visibleModulesFn();
  }

  scsSuperTrackModule = (
    index: number,
    module: any
  ): string => {
    return this.trackModuleFn(
      index,
      module
    );
  };

  scsSuperModuleSaving(
    module: any
  ): boolean {
    return this.moduleSavingFn(module);
  }

  scsSuperIsModuleEnabled(
    module: any
  ): boolean {
    return this.isModuleEnabledFn(module);
  }

  scsSuperModulePrice(
    module: any
  ): number {
    return this.modulePriceFn(module);
  }


  async scsBulkEnableVisibleModules(): Promise<void> {

    this.bulkModuleActionRunning = true;

    try {

    for (const module of this.scsSuperVisibleModules()) {

      if (!this.scsSuperIsModuleEnabled(module)) {
        await this.scsSuperSetModuleEnabled(module,true);
      }

    }

    } finally {

      this.bulkModuleActionRunning = false;

    }

  }

  
  async scsEnableSelectedModules(): Promise<void>{

    for(const module of this.scsSuperVisibleModules()){

      if(this.scsIsModuleSelected(module) && !this.scsSuperIsModuleEnabled(module)){
        await this.scsSuperSetModuleEnabled(module,true);
      }

    }

    this.scsClearSelection();

  }

  async scsDisableSelectedModules(): Promise<void>{

    for(const module of this.scsSuperVisibleModules()){

      if(this.scsIsModuleSelected(module) && this.scsSuperIsModuleEnabled(module)){
        await this.scsSuperSetModuleEnabled(module,false);
      }

    }

    this.scsClearSelection();

  }

async scsBulkDisableVisibleModules(): Promise<void> {

    this.bulkModuleActionRunning = true;

    try {

      for (const module of this.scsSuperVisibleModules()) {

        if (this.scsSuperIsModuleEnabled(module)) {
          await this.scsSuperSetModuleEnabled(module,false);
        }

      }

    } finally {

      this.bulkModuleActionRunning = false;

    }

  }

}