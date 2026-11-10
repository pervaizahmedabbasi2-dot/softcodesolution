import { ApplicationConfig, importProvidersFrom } from '@angular/core';
<<<<<<< HEAD
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule } from 'lucide-angular';
=======
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule,  Loader2 } from 'lucide-angular';
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
import { dashboardIcons } from './dashboard/dashboard.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
<<<<<<< HEAD
      }),
      withRouterConfig({
        onSameUrlNavigation: 'reload'
=======
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
      })
    ),
    provideHttpClient(),
    importProvidersFrom(
<<<<<<< HEAD
      LucideAngularModule.pick(dashboardIcons)
=======
      LucideAngularModule.pick({
        
        Loader2,
        ...dashboardIcons
      })
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
    )
  ]
};
