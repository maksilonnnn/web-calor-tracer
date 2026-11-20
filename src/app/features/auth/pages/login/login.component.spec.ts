import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError, UserDto } from '../../../../shared/models';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { LoginComponent } from './login.component';

interface LoginInternals {
  form: FormGroup;
  errorMessage: () => string;
  onSubmit(): Promise<void>;
}

const ME: UserDto = {
  id: 'u1',
  login: 'alex',
  name: 'Алексей',
  email: 'alex@example.com',
  role: 'user',
};
const WRONG: ApiError = { status: 401, body: { message: 'Неверный логин или пароль' } };
const BLOCKED: ApiError = { status: 403, body: { message: 'Аккаунт заблокирован' } };

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginInternals;
  let auth: { login: jasmine.Spy };
  let navigateSpy: jasmine.Spy;
  let notifyError: jasmine.Spy;

  beforeEach(() => {
    auth = { login: jasmine.createSpy('login').and.returnValue(of(ME)) };

    fixture = TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).createComponent(LoginComponent);

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    notifyError = spyOn(TestBed.inject(NotificationService), 'notifyError');
    component = fixture.componentInstance as unknown as LoginInternals;
    fixture.detectChanges();
  });

  it('рендерит заголовок и ссылку на регистрацию', () => {
    expect(fixture.nativeElement.querySelector('[data-test="login-title"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="register-link"]')).not.toBeNull();
  });

  it('невалидная форма: уведомление об ошибке, вход не вызывается', async () => {
    await component.onSubmit();

    expect(notifyError).toHaveBeenCalledWith('Данные заполнены неверно');
    expect(auth.login).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('успешный вход по логину: значения с тримом, переход на главную', async () => {
    component.form.setValue({ login: '  alex  ', password: 'Demo1234!' });

    await component.onSubmit();

    expect(auth.login).toHaveBeenCalledWith({ login: 'alex', password: 'Demo1234!' });
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('отказ бэкенда: текст ошибки показывается дословно', async () => {
    auth.login.and.returnValue(throwError(() => WRONG));
    component.form.setValue({ login: 'alex', password: 'неверный' });

    await component.onSubmit();

    expect(notifyError).toHaveBeenCalledWith('Неверный логин или пароль');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('заблокированный аккаунт (403): текст показан на странице, без редиректа', async () => {
    auth.login.and.returnValue(throwError(() => BLOCKED));
    component.form.setValue({ login: 'alex', password: 'Demo1234!' });

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Аккаунт заблокирован');
    expect(fixture.nativeElement.querySelector('[data-test="login-error"]')?.textContent).toContain(
      'Аккаунт заблокирован',
    );
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
