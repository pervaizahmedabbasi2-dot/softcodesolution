import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';

export const superAdminGuard: CanActivateFn = async () => {
  const router=inject(Router);
  const backend=inject(BackendService);

  try{
    const me=await backend.authMe();

    if(
      me?.ok===true &&
      me?.user?.role==='super_admin'
    ){
      return true;
    }

  }catch{}

  router.navigate(['/dashboard']);
  return false;
};
