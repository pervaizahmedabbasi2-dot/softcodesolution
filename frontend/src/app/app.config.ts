import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

// ===== SCSBOOT-AI IMPORT =====
import { routes } from './app.routes';
import {
  LucideAngularModule,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // ===== SCSBOOT-AI START =====
    provideHttpClient(),
    // ===== SCSBOOT-AI END =====

    importProvidersFrom(
      LucideAngularModule.pick({
        Mail,
        Lock,
        Eye,
        EyeOff,
        Loader2
      })
    )
  ]
};