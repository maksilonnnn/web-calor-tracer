/**
 * Страница регистрации (/register) — по эталонному образцу преподавателя:
 * форма Имя / Логин / Email / Пароль / Повторите пароль с подсказками;
 * роли на форме нет — регистрация всегда создаёт пользователя (user).
 * Валидация — валидаторами shared/validation; тексты ошибок полей — только
 * из ERROR_TEXTS и показываются после touched. Отказы бэкенда (занятый
 * логин/email) показываются дословно через NotificationService. Успех —
 * автоматический вход (сервис кэширует currentUser) и редирект по
 * ROLE_HOME[role].
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ROLE_HOME } from '../../../../core/navigation/guards';
import { AuthService } from '../../../../core/services/auth.service';
import { toApiError } from '../../../../shared/api-error';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { submitting } from '../../../../shared/loading/submitting';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { ERROR_TEXTS, INVALID_FORM_MESSAGE } from '../../../../shared/validation/error-texts';
import {
  emailFormat,
  firstErrorText,
  loginCharset,
  name as nameRule,
  passwordMatch,
  passwordRules,
  requiredTrim,
  trimFormValues,
} from '../../../../shared/validation/validators';

/** Имена полей формы регистрации. */
type RegisterField = 'name' | 'login' | 'email' | 'password' | 'repeatPassword';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, CardComponent, ButtonComponent, InputComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly submitState = submitting();

  /**
   * Правила — те же валидаторы, что применяет бэкенд (единый источник
   * границ); пара — passwordMatch на всю группу.
   */
  protected readonly form = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [requiredTrim(), nameRule()] }),
      login: new FormControl('', { nonNullable: true, validators: [requiredTrim(), loginCharset()] }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrim(), emailFormat()],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrim(), passwordRules()],
      }),
      repeatPassword: new FormControl('', { nonNullable: true, validators: [requiredTrim()] }),
    },
    { validators: passwordMatch('password', 'repeatPassword') },
  );

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.notifyError(INVALID_FORM_MESSAGE);
      return;
    }
    trimFormValues(this.form);
    const params = this.form.getRawValue();
    await this.submitState.run(async () => {
      try {
        const me = await firstValueFrom(this.auth.register(params));
        // Автологин уже выполнен бэкендом (cookie) и сервисом (кэш currentUser).
        await this.router.navigate([ROLE_HOME[me.role]]);
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  protected nameError(): string {
    return this.fieldError('name');
  }

  protected loginError(): string {
    return this.fieldError('login');
  }

  protected emailError(): string {
    return this.fieldError('email');
  }

  protected passwordError(): string {
    return this.fieldError('password');
  }

  protected repeatPasswordError(): string {
    const own = this.fieldError('repeatPassword');
    if (own !== '') {
      return own;
    }
    const mismatch =
      this.form.hasError('password.mismatch') &&
      this.form.controls.repeatPassword.touched;
    return mismatch ? ERROR_TEXTS['password.mismatch'] : '';
  }

  private fieldError(field: RegisterField): string {
    const control = this.form.controls[field];
    return control.touched ? firstErrorText(control.errors) ?? '' : '';
  }
}
