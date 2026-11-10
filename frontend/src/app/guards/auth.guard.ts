import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';

export const authGuard: CanActivateFn = async () => {
<<<<<<< HEAD
  return true;
=======
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
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
};
