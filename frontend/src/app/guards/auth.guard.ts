import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';

export const authGuard: CanActivateFn = async () => {
  const router=inject(Router);
  const backend=inject(BackendService);

  try{
    const me=await backend.authMe();

    if(me?.ok===true){
      return true;
    }

  }catch{}

  router.navigate(['/login']);
  return false;
};
