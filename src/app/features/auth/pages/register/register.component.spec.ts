import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';

import { ApiError, UserDto } from '../../../../shared/models';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { RegisterComponent } from './register.component';

interface RegisterInternals {
  form: FormGroup;
  onSubmit(): Promise<void>;
  confirmPasswordError(): string;
}

const ME: UserDto = { id: 'u1', name: 'Пётр', email: 'petr@example.com' };
const TAKEN: ApiError = {
  status: 409,
  body: { message: 'Пользователь с таким email уже существует' },
};

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterInternals;
  let auth: { register: jasmine.Spy };
  let navigateSpy: jasmine.Spy;
  let notifyError: jasmine.Spy;

  const VALID = {
    name: 'Пётр',
    email: 'petr@example.com',
    password: 'Demo1234!',
    confirmPassword: 'Demo1234!',
  };

  beforeEach(() => {
    auth = { register: jasmine.createSpy('register').and.resolveTo(ME) };

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

  it('успех: значения с тримом, переход на главную', async () => {
    component.form.setValue({
      name: '  Пётр  ',
      email: '  petr@example.com ',
      password: 'Demo1234!',
      confirmPassword: 'Demo1234!',
    });

    await component.onSubmit();

    expect(auth.register).toHaveBeenCalledWith({
      name: 'Пётр',
      email: 'petr@example.com',
      password: 'Demo1234!',
      confirmPassword: 'Demo1234!',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('отказ мока (занятый email) показывается дословно', async () => {
    auth.register.and.returnValue(Promise.reject(TAKEN));
    component.form.setValue(VALID);

    await component.onSubmit();

    expect(notifyError).toHaveBeenCalledWith('Пользователь с таким email уже существует');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('несовпадение паролей даёт текст ошибки у поля повтора', () => {
    component.form.controls['confirmPassword'].markAsTouched();
    component.form.setValue({ ...VALID, confirmPassword: 'Другой123!' });

    expect(component.confirmPasswordError()).toBe('Пароли не совпадают');
  });
});
