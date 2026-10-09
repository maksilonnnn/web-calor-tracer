/**
 * Страница регистрации (/register): реактивная форма, вход после успеха.
 * Валидация — валидаторами shared/validation; тексты ошибок полей — только
 * из ERROR_TEXTS и показываются после touched. Отказы мока (занятый email)
 * показываются дословно через NotificationService.
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
  name as nameRule,
  passwordMatch,
  passwordRules,
  requiredTrim,
  trimFormValues,
} from '../../../../shared/validation/validators';

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

  protected readonly form = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [requiredTrim(), nameRule()] }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrim(), emailFormat()],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrim(), passwordRules()],
      }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [requiredTrim()] }),
    },
    { validators: passwordMatch('password', 'confirmPassword') },
  );

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.notifyError(INVALID_FORM_MESSAGE);
      return;
    }
    trimFormValues(this.form);
    const input = this.form.getRawValue();
    await this.submitState.run(async () => {
      try {
        await this.auth.register(input);
        await this.router.navigate(['/']);
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  protected nameError(): string {
    return this.fieldError(this.form.controls.name);
  }

  protected emailError(): string {
    return this.fieldError(this.form.controls.email);
  }

  protected passwordError(): string {
    return this.fieldError(this.form.controls.password);
  }

  protected confirmPasswordError(): string {
    const own = this.fieldError(this.form.controls.confirmPassword);
    if (own !== '') {
      return own;
    }
    const mismatch =
      this.form.hasError('password.mismatch') &&
      this.form.controls.confirmPassword.touched;
    return mismatch ? ERROR_TEXTS['password.mismatch'] : '';
  }

  private fieldError(control: AbstractControl): string {
    return control.touched ? firstErrorText(control.errors) ?? '' : '';
  }
}
