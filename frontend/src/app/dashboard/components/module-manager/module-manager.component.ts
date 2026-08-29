import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Search,
  X,
  Pin,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Folder,
  Shield,
  CreditCard,
  Network,
  Settings,
  Users
} from 'lucide-angular';
import { ModuleRegistryService } from '../../services/module-registry.service';

@Component({
  selector:'app-module-manager',
  standalone:true,
  imports:[
  CommonModule,
  LucideAngularModule
],
  templateUrl:'./module-manager.component.html',
  styleUrls:['./module-manager.component.css']
})
export class ModuleManagerComponent{

  readonly icons={
    Search,
    X,
    Pin,
    Eye,
    EyeOff,
    Save,
    RotateCcw,
    Folder,
    Shield,
    CreditCard,
    Network,
    Settings,
    Users
  };

  constructor(
    private readonly registry: ModuleRegistryService
  ){}

  @Input() modules:any[]=[];

  @Output() close=new EventEmitter<void>();

  @Output() moduleChanged=new EventEmitter<void>();
  // SCS_PHASE627_MODULE_CHANGED

  search='';

  // SCS_ACTION_MENU_V1

  openedMenu:string|null=null;

  // SCS_DIRTY_STATE_V1

  hasChanges=false;

  markDirty(){

    this.hasChanges=true;

  }

  clearDirty(){

    this.hasChanges=false;

  }

  toggleMenu(module:any){

    this.openedMenu=
      this.openedMenu===module.code
        ? null
        : module.code;

  }

  closeMenu(){

    this.openedMenu=null;

  }

  // SCS_SAVE_RESET_V1

  saveChanges(){

    this.clearDirty();

    this.closeMenu();

  }

  resetChanges(){

    this.clearDirty();

    this.closeMenu();

  }

  // SCS_ENTERPRISE_STATE_V1

  selectedCategory='all';

// SCS_PHASE614_FILTERS

showHidden=false;

onlyPinned=false;

  viewMode:'grid'|'list'='grid';

  sortMode='name';

  readonly categories=[
    'all',
    'core',
    'finance',
    'security',
    'integration',
    'system'
  ];

  onSearch(event: Event){

    const input = event.target as HTMLInputElement | null;

    this.search = (input?.value ?? '').toLowerCase();

  }

  
get filteredModules(){

  let list=[...this.modules];

  // SCS_PHASE629_MANAGE_ALL_MODULES
    // Manage always displays every registered module.
    // hidden state only controls Quick Actions visibility.

  if(this.onlyPinned){
    list=list.filter(x=>x.pinned);
  }

  if(this.selectedCategory!=='all'){
    list=list.filter(
      x=>(x.category||'system')===this.selectedCategory
    );
  }

  const q=this.search.trim().toLowerCase();

  if(q){

    list=list.filter(x=>
      (x.label||'').toLowerCase().includes(q) ||
      (x.code||'').toLowerCase().includes(q)
    );

  }

  switch(this.sortMode){

    case 'category':

      list.sort((a,b)=>
        (a.category||'').localeCompare(b.category||'')
      );

      break;

    case 'pinned':

      list.sort((a,b)=>
        Number(b.pinned)-Number(a.pinned)
      );

      break;

    default:

      list.sort((a,b)=>
        (a.label||'').localeCompare(b.label||'')
      );

  }

  return list;

}

// SCS_MODULE_ACTIONS_LOGIC_V1
// SCS_MODULE_ACTIONS_LOGIC_V1

  // SCS_REGISTRY_TOGGLE_V1

  togglePinned(module:any){

    // SCS_PHASE620_PIN_DISABLED
    return;

  }

    toggleHidden(module:any){

// SCS_PHASE666_INSTANT_EYE_STATE
// Eye is an immediate action.
// No draft and no Save Changes.

if(module.hidden){

  this.registry.show(module.code);

}else{

  this.registry.hide(module.code);

}

// Reload the authoritative Registry state.
this.modules =
  [...this.registry.getAllModules()];

// Notify Dashboard immediately.
// Quick Actions refresh from Registry.
this.moduleChanged.emit(module);

}

  setCategory(category:string){

    this.selectedCategory=category;

  }

  setView(mode:'grid'|'list'){

    this.viewMode=mode;

  }

  setSort(mode:string){

    this.sortMode=mode;

  }

  onClose(){

    this.close.emit();

  }

}
