/**
 * Страница входа (/login): реактивная форма email + пароль, стиль как у
 * регистрации. Успех — переход на домашний маршрут; отказ мока показывается
 * дословно через NotificationService.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { toApiError } from '../../../../shared/api-error';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { submitting } from '../../../../shared/loading/submitting';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { INVALID_FORM_MESSAGE } from '../../../../shared/validation/error-texts';
import {
  emailFormat,
  firstErrorText,
  requiredTrim,
  trimFormValues,
} from '../../../../shared/validation/validators';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CardComponent, ButtonComponent, InputComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly submitState = submitting();

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [requiredTrim(), emailFormat()] }),
    password: new FormControl('', { nonNullable: true, validators: [requiredTrim()] }),
  });

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
        await this.auth.login(input);
        await this.router.navigate(['/']);
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  protected emailError(): string {
    return this.fieldError(this.form.controls.email);
  }

  protected passwordError(): string {
    return this.fieldError(this.form.controls.password);
  }

  private fieldError(control: AbstractControl): string {
    return control.touched ? firstErrorText(control.errors) ?? '' : '';
  }
}
