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
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService, MeDto } from '../services/auth.service';
import { GlobalLoaderService } from '../services/global-loader.service';

/** Домашний маршрут авторизованной части — дашборд. */
export const HOME_PATH = '/';

/** UrlTree /login — единая точка редиректа неавторизованных. */
function toLogin(router: Router): UrlTree {
  return router.parseUrl('/login');
}

/** UrlTree домашнего маршрута. */
function toHome(router: Router): UrlTree {
  return router.parseUrl(HOME_PATH);
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
 * Гостевые страницы: есть сессия → домашний маршрут, гость (и битая сессия,
 * очищенная loadMe) → навигация разрешена.
 */
export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(
    inject(AuthService),
    inject(GlobalLoaderService),
  );
  return me !== null ? toHome(router) : true;
};

/**
 * Корень и wildcard: есть сессия → домашний маршрут, иначе → /login.
 */
export const homeGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(
    inject(AuthService),
    inject(GlobalLoaderService),
  );
  return me !== null ? toHome(router) : toLogin(router);
};
