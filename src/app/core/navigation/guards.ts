/**
 * Навигационные guards поверх AuthService: функциональные CanActivateFn.
 *
 * Схема защиты:
 *  - наличие сессии проверяется синхронно по ключу localStorage
 *    (isAuthenticated) — переходы между вкладками мгновенны;
 *  - при первом входе после F5 пользователь доожидается однократным
 *    loadMe() (кэш currentUser заполняется, дальше синхронно);
 *  - битая сессия (me 401) очищается внутри loadMe → редирект /login.
 *
 * Редиректы возвращаются как UrlTree; guards не знают о маршрутах фич,
 * кроме фиксированных /, /login.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService, MeDto } from '../services/auth.service';

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

/**
 * Текущий пользователь для решения guard'а: без сессии — null (синхронно);
 * сессия есть, кэш пуст (первый вход после F5) — однократная догрузка
 * loadMe(); битая сессия очищается внутри loadMe → null.
 */
async function resolveCurrentUser(auth: AuthService): Promise<MeDto | null> {
  if (!auth.isAuthenticated()) {
    return null;
  }
  return auth.currentUser() ?? (await auth.loadMe());
}

/**
 * Авторизованный доступ: нет сессии или битая → /login, иначе навигация.
 */
export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(inject(AuthService));
  return me !== null ? true : toLogin(router);
};

/**
 * Гостевые страницы: есть сессия → домашний маршрут, гость (и битая сессия,
 * очищенная loadMe) → навигация разрешена.
 */
export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(inject(AuthService));
  return me !== null ? toHome(router) : true;
};

/**
 * Корень и wildcard: есть сессия → домашний маршрут, иначе → /login.
 */
export const homeGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const me = await resolveCurrentUser(inject(AuthService));
  return me !== null ? toHome(router) : toLogin(router);
};
