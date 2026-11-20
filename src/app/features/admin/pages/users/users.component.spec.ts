import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { GlobalLoaderService } from '../../../../core/services/global-loader.service';
import { AdminUser, PagedResult, UserDto } from '../../../../shared/models';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { UsersComponent } from './users.component';

interface UsersInternals {
  users: WritableSignal<AdminUser[]>;
  loading: () => boolean;
  page: () => number;
  totalPages: () => number;
  search: () => string;
  searchControl: FormControl<string>;
  onSearch(): void;
  goToPage(page: number): Promise<void>;
  canChangeBlock(user: AdminUser): boolean;
  toggleBlock(user: AdminUser): Promise<void>;
}

const ADMIN_ME: UserDto = {
  id: 'admin-1',
  login: 'admin',
  name: 'Администратор',
  email: 'admin@example.com',
  role: 'admin',
};

const USER: AdminUser = {
  id: 'u1',
  login: 'alex',
  name: 'Алексей',
  email: 'alex@example.com',
  role: 'user',
  isBlocked: false,
  createdAt: '2026-01-01T10:00:00+00:00',
};

const BLOCKED: AdminUser = {
  ...USER,
  id: 'u2',
  name: 'Пётр',
  email: 'petr@example.com',
  isBlocked: true,
};

const PAGE: PagedResult<AdminUser> = {
  items: [USER, BLOCKED],
  page: 1,
  pageSize: 20,
  totalCount: 2,
  totalPages: 1,
};

describe('UsersComponent — админ-таблица пользователей', () => {
  let fixture: ComponentFixture<UsersComponent>;
  let component: UsersInternals;
  let admin: {
    getUsers: jasmine.Spy;
    block: jasmine.Spy;
    unblock: jasmine.Spy;
  };
  let notifySuccess: jasmine.Spy;
  let notifyError: jasmine.Spy;

  beforeEach(() => {
    admin = {
      getUsers: jasmine.createSpy('getUsers').and.returnValue(of({ ...PAGE })),
      block: jasmine
        .createSpy('block')
        .and.callFake((id: string) => of({ ...USER, id, isBlocked: true })),
      unblock: jasmine
        .createSpy('unblock')
        .and.callFake((id: string) => of({ ...BLOCKED, id, isBlocked: false })),
    };

    fixture = TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: admin },
        {
          provide: AuthService,
          useValue: { currentUser: signal<UserDto | null>(ADMIN_ME).asReadonly() },
        },
        {
          provide: GlobalLoaderService,
          useValue: { show: jasmine.createSpy('show'), hide: jasmine.createSpy('hide') },
        },
      ],
    }).createComponent(UsersComponent);

    const notifications = TestBed.inject(NotificationService);
    notifySuccess = spyOn(notifications, 'notifySuccess');
    notifyError = spyOn(notifications, 'notifyError');
    component = fixture.componentInstance as unknown as UsersInternals;
  });

  async function init(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('загружает список и рендерит строки таблицы', async () => {
    await init();

    expect(admin.getUsers).toHaveBeenCalledWith({ page: 1, pageSize: 20, search: '' });
    expect(component.loading()).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('[data-test="admin-row"]').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('alex@example.com');
    expect(fixture.nativeElement.textContent).toContain('Заблокирован');
  });

  it('отказ загрузки показывается дословно', async () => {
    admin.getUsers.and.returnValue(
      throwError(() => ({ status: 403, body: { message: 'Доступ запрещён' } })),
    );

    await init();

    expect(notifyError).toHaveBeenCalledWith('Доступ запрещён');
  });

  it('поиск сбрасывает страницу и передаёт строку в сервис', async () => {
    await init();
    component.searchControl.setValue('  alex  ');

    component.onSearch();

    expect(admin.getUsers).toHaveBeenCalledWith({ page: 1, pageSize: 20, search: 'alex' });
    expect(component.search()).toBe('alex');
  });

  it('блокировка обновляет строку и показывает успех', async () => {
    await init();

    await component.toggleBlock(component.users()[0]);

    expect(admin.block).toHaveBeenCalledWith('u1');
    expect(component.users()[0].isBlocked).toBeTrue();
    expect(notifySuccess).toHaveBeenCalledWith('Сохранено');
  });

  it('себя и администраторов блокировать нельзя', async () => {
    await init();
    const self: AdminUser = { ...USER, id: ADMIN_ME.id };
    const otherAdmin: AdminUser = { ...USER, id: 'admin-2', role: 'admin' };

    expect(component.canChangeBlock(self)).toBeFalse();
    expect(component.canChangeBlock(otherAdmin)).toBeFalse();
    expect(component.canChangeBlock(USER)).toBeTrue();
  });

  it('пагинация переключает страницу', async () => {
    admin.getUsers.and.returnValue(of({ ...PAGE, totalPages: 3 }));
    await init();

    await component.goToPage(2);

    expect(component.page()).toBe(2);
    expect(admin.getUsers).toHaveBeenCalledWith({ page: 2, pageSize: 20, search: '' });
  });
});
