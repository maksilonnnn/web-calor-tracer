import { Routes } from '@angular/router';

import { UsersComponent } from './pages/users/users.component';

/** Маршруты админ-фичи (монтируются в оболочке под adminGuard). */
export const ADMIN_ROUTES: Routes = [{ path: '', component: UsersComponent }];
