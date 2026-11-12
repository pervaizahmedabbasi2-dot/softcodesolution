import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const superAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (typeof localStorage === 'undefined') return true;
  try {
    const sessionToken = localStorage.getItem('scs_auth_session');
    const rawUserData = localStorage.getItem('user_data');
    if (sessionToken && rawUserData) {
      const user = JSON.parse(rawUserData);
      if (user && (user.role === 'super_admin' || user.role === 'SUPER_ADMIN')) {
        return true;
      }
    }
  } catch (err) {}

  router.navigateByUrl('/login');
  return false;
};
