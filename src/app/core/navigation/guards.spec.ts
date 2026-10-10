import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { UserDto } from '../../shared/models';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard, homeGuard } from './guards';

const ME: UserDto = { id: 'user-1', name: 'Алексей', email: 'alex@example.com' };
const HOME = '/';
const LOGIN = '/login';

describe('navigation guards — доступ по сессии', () => {
  let loadMe: jasmine.Spy;

  beforeEach(() => {
    loadMe = jasmine.createSpy('loadMe').and.returnValue(of(ME));

    const auth = { loadMe };
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

  /** Ответ loadMe: авторизован (ME) или нет сессии (null). */
  function reply(result: Observable<UserDto | null>): void {
    loadMe.and.returnValue(result);
  }

  describe('authGuard', () => {
    it('без сессии (loadMe → null) — редирект на /login', async () => {
      reply(of(null));

      expect(await runGuard(authGuard)).toBe(LOGIN);
      expect(loadMe).toHaveBeenCalledTimes(1);
    });

    it('сессия есть — доступ разрешён', async () => {
      expect(await runGuard(authGuard)).toBeTrue();
      expect(loadMe).toHaveBeenCalledTimes(1);
    });

    it('сбой загрузки сессии (сеть) — редирект на /login', async () => {
      reply(throwError(() => new Error('нет сети')));

      expect(await runGuard(authGuard)).toBe(LOGIN);
    });
  });

  describe('guestGuard', () => {
    it('гость — доступ разрешён', async () => {
      reply(of(null));

      expect(await runGuard(guestGuard)).toBeTrue();
    });

    it('авторизованный — редирект на домашний маршрут', async () => {
      expect(await runGuard(guestGuard)).toBe(HOME);
    });

    it('сбой загрузки сессии — доступ разрешён (гость)', async () => {
      reply(throwError(() => new Error('нет сети')));

      expect(await runGuard(guestGuard)).toBeTrue();
    });
  });

  describe('homeGuard', () => {
    it('сессия есть — домашний маршрут', async () => {
      expect(await runGuard(homeGuard)).toBe(HOME);
    });

    it('сессии нет — /login', async () => {
      reply(of(null));

      expect(await runGuard(homeGuard)).toBe(LOGIN);
    });

    it('сбой загрузки сессии — /login', async () => {
      reply(throwError(() => new Error('нет сети')));

      expect(await runGuard(homeGuard)).toBe(LOGIN);
    });
  });
});
