/**
 * Навигационные guards поверх AuthService: функциональные CanActivateFn.
 *
 * Схема защиты:
 *  - сессия определяется исключительно вызовом AuthService.loadMe()
 *    (GET /auth/me) — JWT лежит в httpOnly-cookie, из JavaScript не читается,
 *    поэтому «есть ли сессия» нельзя узнать локально;
 *  - loadMe кэширует пользователя в сигнале (для синхронных чтений в UI);
 *  - 401 внутри loadMe превращается в null → редирект; прочие сбои
 *    (например, сеть) трактуются как «не авторизован», чтобы навигация
 *    не «зависала».
 *
 * Редиректы возвращаются как UrlTree; guards не знают о маршрутах фич,
 * кроме фиксированных /, /login.
 *
 * adminGuard дополнительно проверяет роль из /auth/me: страница
 * администрирования доступна только роли admin. Это UX-защита; настоящая
 * авторизация выполняется на бэкенде атрибутом [Authorize(Roles = "admin")].
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { UserRole } from '../../shared/models';
import { AuthService, MeDto } from '../services/auth.service';
import { GlobalLoaderService } from '../services/global-loader.service';

/** Домашний маршрут по роли (как в эталонном образце): после входа и для гостя. */
export const ROLE_HOME: Record<UserRole, string> = {
  user: '/',
  admin: '/',
};

/** Домашний маршрут авторизованной части — дашборд. */
export const HOME_PATH = '/';

/** UrlTree /login — единая точка редиректа неавторизованных. */
function toLogin(router: Router): UrlTree {
  return router.parseUrl('/login');
}

/** UrlTree домашнего маршрута роли (ROLE_HOME). */
function toHome(router: Router, role: UserRole): UrlTree {
  return router.parseUrl(ROLE_HOME[role]);
}

/** Текущий пользователь для решения guard'а; нет сессии/сбой → null. */
async function resolveCurrentUser(
  auth: AuthService,
  loader: GlobalLoaderService,
): Promise<MeDto | null> {
  loader.show();
  try {
    return await firstValueFrom(auth.loadMe());
  } catch {
    return null;
  } finally {
    loader.hide();
  }
}

/**
 * Авторизованный доступ: нет сессии или битая → /login, иначе навигация.
 */
export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(
    inject(AuthService),
    inject(GlobalLoaderService),
  );
  return me !== null ? true : toLogin(router);
};

/**
 * Гостевые страницы: есть сессия → домашний маршрут роли, гость (и битая
 * сессия, очищенная loadMe) → навигация разрешена.
 */
export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(
    inject(AuthService),
    inject(GlobalLoaderService),
  );
  return me !== null ? toHome(router, me.role) : true;
};

/**
 * Корень и wildcard: есть сессия → домашний маршрут роли, иначе → /login.
 */
export const homeGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(
    inject(AuthService),
    inject(GlobalLoaderService),
  );
  return me !== null ? toHome(router, me.role) : toLogin(router);
};

/**
 * Админ-страницы: роль admin → доступ; обычный пользователь → на главную;
 * нет сессии/сбой → /login.
 */
export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(
    inject(AuthService),
    inject(GlobalLoaderService),
  );
  if (me === null) {
    return toLogin(router);
  }
  return me.role === 'admin' ? true : toHome(router, me.role);
};
