import { Routes } from '@angular/router';
import { LandingPageComponent } from './softcodesolution_platform/landing-page/landing-page.component';
import { LoginComponent } from './auth_security/login/login.component';
import { RegisterComponent } from './auth_security/register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LegalComponent } from './softcodesolution_platform/landing-page/legal/legal.component';
import { MirroringComponent } from './softcodesolution_platform/landing-page/mirroring/mirroring.component';
import { HybridSyncComponent } from './softcodesolution_platform/landing-page/hybrid-sync/hybrid-sync.component';
import { TripleBackupComponent } from './softcodesolution_platform/landing-page/triple-backup/triple-backup.component';
import { authGuard } from './auth_security/guards/auth.guard';
import { superAdminGuard } from './auth_security/guards/superadmin.guard';


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