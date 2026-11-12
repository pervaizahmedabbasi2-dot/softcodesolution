import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (typeof localStorage === 'undefined') return true;
  try {
    const sessionToken = localStorage.getItem('scs_auth_session');
    const rawUserData = localStorage.getItem('user_data');
    if (sessionToken && rawUserData) {
      const user = JSON.parse(rawUserData);
      if (user && user.email && user.role) {
        return true;
      }
    }
  } catch (err) {}

  localStorage.removeItem('user_data');
  localStorage.removeItem('scs_auth_session');
  router.navigateByUrl('/login');
  return false;
};
