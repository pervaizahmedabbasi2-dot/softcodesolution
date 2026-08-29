import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LegalComponent } from './landing-page/legal/legal.component';
import { MirroringComponent } from './landing-page/mirroring/mirroring.component';
import { HybridSyncComponent } from './landing-page/hybrid-sync/hybrid-sync.component';
import { TripleBackupComponent } from './landing-page/triple-backup/triple-backup.component';
import { authGuard } from './guards/auth.guard';
import { superAdminGuard } from './guards/superadmin.guard';


export const routes: Routes = [
    { path: '', component: LandingPageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate:[authGuard] },
    { path: 'superadmin', component: DashboardComponent, canActivate:[superAdminGuard] },
    { path: 'legal', component: LegalComponent },
    { path: 'mirroring', component: MirroringComponent },
    { path: 'hybrid-sync', component: HybridSyncComponent },
    { path: 'triple-backup', component: TripleBackupComponent },
    
    { path: '**', redirectTo: '' }
];