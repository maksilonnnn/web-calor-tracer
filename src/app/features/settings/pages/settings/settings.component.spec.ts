import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { DEFAULT_SETTINGS, Settings, UserDto, WeightUnit } from '../../../../shared/models';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { SettingsComponent } from './settings.component';

interface SettingsInternals {
  loading: () => boolean;
  unit: () => WeightUnit;
  notificationsEnabled: () => boolean;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  passwordModalOpen: WritableSignal<boolean>;
  saveProfile(): Promise<void>;
  setWeightUnit(unit: WeightUnit): Promise<void>;
  setNotificationsEnabled(enabled: boolean): Promise<void>;
  changePassword(): Promise<void>;
  deleteAccount(): Promise<void>;
}

const ME: UserDto = { id: 'u1', name: 'Алексей', email: 'alex@example.com' };
const SAVED: Settings = { ...DEFAULT_SETTINGS, weightUnit: 'kg', notificationsEnabled: false };

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsInternals;
  let profile: {
    get: jasmine.Spy;
    update: jasmine.Spy;
    changePassword: jasmine.Spy;
    deleteAccount: jasmine.Spy;
  };
  let settings: { get: jasmine.Spy; update: jasmine.Spy };
  let auth: { loadMe: jasmine.Spy; logout: jasmine.Spy };
  let navigateSpy: jasmine.Spy;
  let notifySuccess: jasmine.Spy;
  let notifyError: jasmine.Spy;

  beforeEach(() => {
    profile = {
      get: jasmine.createSpy('get').and.returnValue(of(ME)),
      update: jasmine
        .createSpy('update')
        .and.returnValue(of({ id: 'u1', name: 'Алексей Н.', email: 'new@example.com' })),
      changePassword: jasmine.createSpy('changePassword').and.returnValue(of(undefined)),
      deleteAccount: jasmine.createSpy('deleteAccount').and.returnValue(of(undefined)),
    };
    settings = {
      get: jasmine.createSpy('get').and.returnValue(of({ ...SAVED })),
      update: jasmine
        .createSpy('update')
        .and.callFake((params: Partial<Settings>) => of({ ...SAVED, ...params })),
    };
    auth = {
      loadMe: jasmine.createSpy('loadMe').and.returnValue(of(ME)),
      logout: jasmine.createSpy('logout').and.returnValue(of(undefined)),
    };

    fixture = TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        { provide: ProfileService, useValue: profile },
        { provide: SettingsService, useValue: settings },
        { provide: AuthService, useValue: auth },
      ],
    }).createComponent(SettingsComponent);

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const notifications = TestBed.inject(NotificationService);
    notifySuccess = spyOn(notifications, 'notifySuccess');
    notifyError = spyOn(notifications, 'notifyError');
    component = fixture.componentInstance as unknown as SettingsInternals;
  });

  async function init(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('загружает профиль и настройки в формы и сигналы', async () => {
    await init();

    expect(component.loading()).toBeFalse();
    expect(component.profileForm.value).toEqual({ name: 'Алексей', email: 'alex@example.com' });
    expect(component.unit()).toBe('kg');
    expect(component.notificationsEnabled()).toBeFalse();
  });

  it('сохранение профиля: update, loadMe и уведомление «Сохранено»', async () => {
    await init();
    component.profileForm.setValue({ name: 'Алексей Н.', email: 'new@example.com' });

    await component.saveProfile();

    expect(profile.update).toHaveBeenCalledWith({ name: 'Алексей Н.', email: 'new@example.com' });
    expect(auth.loadMe).toHaveBeenCalledTimes(1);
    expect(notifySuccess).toHaveBeenCalledWith('Сохранено');
  });

  it('невалидный профиль: уведомление, update не вызывается', async () => {
    await init();
    component.profileForm.setValue({ name: '', email: 'плохо' });

    await component.saveProfile();

    expect(notifyError).toHaveBeenCalledWith('Данные заполнены неверно');
    expect(profile.update).not.toHaveBeenCalled();
  });

  it('отказ update профиля показывается дословно', async () => {
    await init();
    profile.update.and.returnValue(
      throwError(() => ({ status: 409, body: { message: 'Пользователь с таким email уже существует' } })),
    );
    component.profileForm.setValue({ name: 'Алексей', email: 'petr@example.com' });

    await component.saveProfile();

    expect(notifyError).toHaveBeenCalledWith('Пользователь с таким email уже существует');
  });

  it('смена единицы веса обновляет настройки; повторный выбор — без вызова', async () => {
    await init();
    expect(component.unit()).toBe('kg');

    await component.setWeightUnit('g');
    expect(settings.update).toHaveBeenCalledWith({ weightUnit: 'g' });
    expect(component.unit()).toBe('g');

    settings.update.calls.reset();
    await component.setWeightUnit('g');
    expect(settings.update).not.toHaveBeenCalled();
  });

  it('переключатель уведомлений обновляет настройки', async () => {
    await init();

    await component.setNotificationsEnabled(true);

    expect(settings.update).toHaveBeenCalledWith({ notificationsEnabled: true });
    expect(component.notificationsEnabled()).toBeTrue();
  });

  it('невалидная смена пароля: уведомление, сервис не вызывается', async () => {
    await init();

    await component.changePassword();

    expect(notifyError).toHaveBeenCalledWith('Данные заполнены неверно');
    expect(profile.changePassword).not.toHaveBeenCalled();
  });

  it('успешная смена пароля: вызов, уведомление и сброс формы', async () => {
    await init();
    component.passwordForm.setValue({
      currentPassword: 'Demo1234!',
      password: 'NewDemo1234!',
      confirmPassword: 'NewDemo1234!',
    });
    component['passwordModalOpen'].set(true);

    await component.changePassword();

    expect(profile.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Demo1234!',
      password: 'NewDemo1234!',
      confirmPassword: 'NewDemo1234!',
    });
    expect(notifySuccess).toHaveBeenCalledWith('Пароль изменён');
    expect(component.passwordModalOpen()).toBeFalse();
  });

  it('удаление аккаунта: удаление, выход и переход на /register', async () => {
    await init();

    await component.deleteAccount();

    expect(profile.deleteAccount).toHaveBeenCalledTimes(1);
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/register']);
  });
});
