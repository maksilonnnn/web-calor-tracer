import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';

/** Маршруты фичи «Дашборд» (монтируются в оболочке под authGuard). */
export const DASHBOARD_ROUTES: Routes = [{ path: '', component: DashboardComponent }];
