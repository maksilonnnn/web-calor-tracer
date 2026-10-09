import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';

import { UserDto } from '../../shared/models';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let user: WritableSignal<UserDto | null>;
  let auth: { currentUser: unknown; logout: jasmine.Spy };
  let navigateSpy: jasmine.Spy;

  beforeEach(() => {
    user = signal<UserDto | null>(null);
    auth = {
      currentUser: user.asReadonly(),
      logout: jasmine.createSpy('logout').and.resolveTo(undefined),
    };

    fixture = TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).createComponent(SidebarComponent);

    navigateSpy = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  });

  function text(selector: string): string {
    return fixture.nativeElement.querySelector(selector)?.textContent?.trim() ?? '';
  }

  it('рендерит три навигационных ссылки и кнопку выхода', () => {
    expect(fixture.nativeElement.querySelector('[data-test="nav-dashboard"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="nav-diary"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="nav-settings"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="logout-button"]')).not.toBeNull();
  });

  it('без пользователя показывает заглушку инициала', () => {
    expect(text('[data-test="user-initial"]')).toBe('?');
  });

  it('показывает имя, email и инициал пользователя', () => {
    user.set({ id: 'u1', name: 'Алексей', email: 'alex@example.com' });
    fixture.detectChanges();

    expect(text('[data-test="user-name"]')).toBe('Алексей');
    expect(text('[data-test="user-email"]')).toBe('alex@example.com');
    expect(text('[data-test="user-initial"]')).toBe('А');
  });

  it('выход очищает сессию и ведёт на /login', async () => {
    await fixture.componentInstance['logout']();

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
