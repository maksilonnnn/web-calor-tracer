/**
 * Единственное место композиции маршрутов и подключения guards.
 *
 * Схема:
 *  - авторизованная часть — оболочка AppShell под authGuard: '' (дашборд),
 *    'diary', 'settings', 'admin' — чистые маршруты фич; /admin дополнительно
 *    под adminGuard (роль проверяется и на бэкенде);
 *  - гостевая часть — /register, /login под guestGuard, вне оболочки;
 *  - '**' — homeGuard: есть сессия → '/', иначе → '/login'.
 */
import { Routes } from '@angular/router';

import { AppShellComponent } from '../../layout/app-shell/app-shell.component';
import { ADMIN_ROUTES } from '../../features/admin/admin.routes';
import { AUTH_ROUTES } from '../../features/auth/auth.routes';
import { DASHBOARD_ROUTES } from '../../features/dashboard/dashboard.routes';
import { DIARY_ROUTES } from '../../features/diary/diary.routes';
import { SETTINGS_ROUTES } from '../../features/settings/settings.routes';
import { adminGuard, authGuard, guestGuard, homeGuard } from '../navigation/guards';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', children: DASHBOARD_ROUTES },
      { path: 'diary', children: DIARY_ROUTES },
      { path: 'settings', children: SETTINGS_ROUTES },
      { path: 'admin', canActivate: [adminGuard], children: ADMIN_ROUTES },
    ],
  },
  {
    path: '',
    canActivate: [guestGuard],
    children: AUTH_ROUTES,
  },
  {
    path: '**',
    canActivate: [homeGuard],
    children: [],
  },
];
