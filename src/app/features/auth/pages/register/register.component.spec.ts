import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError, UserDto } from '../../../../shared/models';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { RegisterComponent } from './register.component';

interface RegisterInternals {
  form: FormGroup;
  onSubmit(): Promise<void>;
  repeatPasswordError(): string;
}

const ME: UserDto = {
  id: 'u1',
  login: 'petr',
  name: 'Пётр',
  email: 'petr@example.com',
  role: 'user',
};
const TAKEN: ApiError = {
  status: 409,
  body: { message: 'Пользователь с таким логином уже существует' },
};

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterInternals;
  let auth: { register: jasmine.Spy };
  let navigateSpy: jasmine.Spy;
  let notifyError: jasmine.Spy;

  const VALID = {
    name: 'Пётр',
    login: 'petr',
    email: 'petr@example.com',
    password: 'Demo1234!',
    repeatPassword: 'Demo1234!',
  };

  beforeEach(() => {
    auth = { register: jasmine.createSpy('register').and.returnValue(of(ME)) };

    fixture = TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).createComponent(RegisterComponent);

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    notifyError = spyOn(TestBed.inject(NotificationService), 'notifyError');
    component = fixture.componentInstance as unknown as RegisterInternals;
    fixture.detectChanges();
  });

  it('рендерит заголовок и ссылку на вход', () => {
    expect(fixture.nativeElement.querySelector('[data-test="register-title"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="login-link"]')).not.toBeNull();
  });

  it('невалидная форма: уведомление об ошибке, регистрация не вызывается', async () => {
    await component.onSubmit();

    expect(notifyError).toHaveBeenCalledWith('Данные заполнены неверно');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('недопустимый логин (кириллица): регистрация не вызывается', async () => {
    component.form.setValue({ ...VALID, login: 'иван' });

    await component.onSubmit();

    expect(notifyError).toHaveBeenCalledWith('Данные заполнены неверно');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('успех: значения с тримом, переход на домашний маршрут роли', async () => {
    component.form.setValue({
      name: '  Пётр  ',
      login: '  petr ',
      email: '  petr@example.com ',
      password: 'Demo1234!',
      repeatPassword: 'Demo1234!',
    });

    await component.onSubmit();

    expect(auth.register).toHaveBeenCalledWith({
      name: 'Пётр',
      login: 'petr',
      email: 'petr@example.com',
      password: 'Demo1234!',
      repeatPassword: 'Demo1234!',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('отказ бэкенда (занятый логин) показывается дословно', async () => {
    auth.register.and.returnValue(throwError(() => TAKEN));
    component.form.setValue(VALID);

    await component.onSubmit();

    expect(notifyError).toHaveBeenCalledWith('Пользователь с таким логином уже существует');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('несовпадение паролей даёт текст ошибки у поля повтора', () => {
    component.form.controls['repeatPassword'].markAsTouched();
    component.form.setValue({ ...VALID, repeatPassword: 'Другой123!' });

    expect(component.repeatPasswordError()).toBe('Пароли не совпадают');
  });
});
