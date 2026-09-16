import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule,  Loader2 } from 'lucide-angular';
import { dashboardIcons } from './dashboard/dashboard.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(),
    importProvidersFrom(
      LucideAngularModule.pick({
        
        Loader2,
        ...dashboardIcons
      })
    )
  ]
};
