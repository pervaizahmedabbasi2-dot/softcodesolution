import { Injectable, signal } from '@angular/core';

export interface CurrentUser{
  id:string;
  tenant_id:string|null;
  email:string;
  role:string;
  status:string;
}

@Injectable({
  providedIn:'root'
})
export class CurrentUserService{

  readonly user=signal<CurrentUser|null>(null);

  readonly loaded=signal(false);

  setUser(user:CurrentUser|null){
    this.user.set(user);
    this.loaded.set(true);
  }

  clear(){
    this.user.set(null);
    this.loaded.set(false);
  }

  isLoggedIn(){
    return this.user()!=null;
  }

  isSuperAdmin(){
    return this.user()?.role==='super_admin';
  }

  role(){
    return this.user()?.role ?? '';
  }

}
