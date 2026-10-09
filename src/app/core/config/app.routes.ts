import { Routes } from '@angular/router';
import { DashboardComponent } from '../../features/dashboard/pages/dashboard/dashboard.component';
import { DiaryComponent } from '../../features/diary/pages/diary/diary.component';
import { SettingsComponent } from '../../features/settings/pages/settings/settings.component';
import { RegisterComponent } from '../../features/auth/pages/register/register.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: '', component: DashboardComponent },
  { path: 'diary', component: DiaryComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' },
];
