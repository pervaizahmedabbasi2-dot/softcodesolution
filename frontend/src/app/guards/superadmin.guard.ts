import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';

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
  return false;
};
