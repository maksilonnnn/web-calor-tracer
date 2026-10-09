import { Routes } from '@angular/router';

import { SettingsComponent } from './pages/settings/settings.component';

/** Маршруты фичи «Настройки» (монтируются в оболочке под authGuard). */
export const SETTINGS_ROUTES: Routes = [{ path: '', component: SettingsComponent }];
