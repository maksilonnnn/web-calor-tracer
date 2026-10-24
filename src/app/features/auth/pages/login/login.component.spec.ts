import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';

import { ApiError, UserDto } from '../../../../shared/models';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { LoginComponent } from './login.component';

interface LoginInternals {
  form: FormGroup;
  onSubmit(): Promise<void>;
}

const ME: UserDto = { id: 'u1', name: 'Алексей', email: 'alex@example.com' };
const WRONG: ApiError = { status: 401, body: { message: 'Неверный email или пароль' } };

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginInternals;
  let auth: { login: jasmine.Spy };
  let navigateSpy: jasmine.Spy;
  let notifyError: jasmine.Spy;

  beforeEach(() => {
    auth = { login: jasmine.createSpy('login').and.resolveTo(ME) };

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

  it('успешный вход: значения с тримом, переход на главную', async () => {
    component.form.setValue({ email: '  alex@example.com  ', password: 'Demo1234!' });

    await component.onSubmit();

    expect(auth.login).toHaveBeenCalledWith({ email: 'alex@example.com', password: 'Demo1234!' });
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('отказ мока: текст ошибки показывается дословно', async () => {
    auth.login.and.returnValue(Promise.reject(WRONG));
    component.form.setValue({ email: 'alex@example.com', password: 'неверный' });

    await component.onSubmit();

    expect(notifyError).toHaveBeenCalledWith('Неверный email или пароль');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
