import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';

<<<<<<< HEAD
export const superAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (typeof localStorage === 'undefined') return true;
  try {
    const raw = localStorage.getItem('user_data');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && (u.role === 'super_admin' || u.role === 'SUPER_ADMIN')) {
        return true;
      }
    }
  } catch {}
  router.navigateByUrl('/dashboard');
=======
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
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
  return false;
};
