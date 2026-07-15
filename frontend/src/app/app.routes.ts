import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LegalComponent } from './landing-page/legal/legal.component';
import { MirroringComponent } from './landing-page/mirroring/mirroring.component';
import { HybridSyncComponent } from './landing-page/hybrid-sync/hybrid-sync.component';
import { TripleBackupComponent } from './landing-page/triple-backup/triple-backup.component';


export const routes: Routes = [
    { path: '', component: LandingPageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'superadmin', component: DashboardComponent },
    { path: 'legal', component: LegalComponent },
    { path: 'mirroring', component: MirroringComponent },
    { path: 'hybrid-sync', component: HybridSyncComponent },
    { path: 'triple-backup', component: TripleBackupComponent },
    
    { path: '**', redirectTo: '' }
];