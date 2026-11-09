import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';

export const authGuard: CanActivateFn = async () => {
  return true;
};
