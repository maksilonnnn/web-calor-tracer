import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { UserDto } from '../../shared/models';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard, homeGuard } from './guards';

const ME: UserDto = { id: 'user-1', name: 'Алексей', email: 'alex@example.com' };
const HOME = '/';
const LOGIN = '/login';

describe('navigation guards — доступ по сессии', () => {
  let authenticated: boolean;
  let current: UserDto | null;
  let loadMe: jasmine.Spy;

  beforeEach(() => {
    authenticated = false;
    current = null;
    loadMe = jasmine.createSpy('loadMe');

    const auth = {
      isAuthenticated: () => authenticated,
      currentUser: () => current,
      loadMe,
    };
    const router = {
      parseUrl: (url: string): UrlTree => url as unknown as UrlTree,
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  async function runGuard(guard: CanActivateFn): Promise<unknown> {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  describe('authGuard', () => {
    it('без сессии — редирект на /login', async () => {
      expect(await runGuard(authGuard)).toBe(LOGIN);
      expect(loadMe).not.toHaveBeenCalled();
    });

    it('сессия есть, кэш заполнен — доступ без догрузки', async () => {
      authenticated = true;
      current = ME;
      expect(await runGuard(authGuard)).toBeTrue();
      expect(loadMe).not.toHaveBeenCalled();
    });

    it('сессия есть, кэш пуст — однократная догрузка loadMe', async () => {
      authenticated = true;
      loadMe.and.resolveTo(ME);
      expect(await runGuard(authGuard)).toBeTrue();
      expect(loadMe).toHaveBeenCalledTimes(1);
    });

    it('битая сессия (loadMe → null) — редирект на /login', async () => {
      authenticated = true;
      loadMe.and.resolveTo(null);
      expect(await runGuard(authGuard)).toBe(LOGIN);
    });
  });

  describe('guestGuard', () => {
    it('гость — доступ разрешён', async () => {
      expect(await runGuard(guestGuard)).toBeTrue();
    });

    it('авторизованный — редирект на домашний маршрут', async () => {
      authenticated = true;
      current = ME;
      expect(await runGuard(guestGuard)).toBe(HOME);
    });

    it('авторизованный с пустым кэшем — догрузка, затем редирект домой', async () => {
      authenticated = true;
      loadMe.and.resolveTo(ME);
      expect(await runGuard(guestGuard)).toBe(HOME);
    });
  });

  describe('homeGuard', () => {
    it('сессия есть — домашний маршрут', async () => {
      authenticated = true;
      current = ME;
      expect(await runGuard(homeGuard)).toBe(HOME);
    });

    it('сессии нет — /login', async () => {
      expect(await runGuard(homeGuard)).toBe(LOGIN);
    });

    it('битая сессия — /login', async () => {
      authenticated = true;
      loadMe.and.resolveTo(null);
      expect(await runGuard(homeGuard)).toBe(LOGIN);
    });
  });
});
