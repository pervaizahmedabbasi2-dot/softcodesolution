#!/bin/bash
cat << 'APP_CONFIG' > frontend/src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-angular';
import { dashboardIcons } from './dashboard/dashboard.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      LucideAngularModule.pick({
        Mail,
        Lock,
        Eye,
        EyeOff,
        Loader2,
        ...dashboardIcons
      })
    )
  ]
};
APP_CONFIG
