/**
 * Страница «Настройки» (/settings): профиль, отображение и безопасность.
 *
 *  - «Профиль»: реактивная форма имя+email → ProfileService.update, успех
 *    «Сохранено», затем AuthService.loadMe() обновляет кэш пользователя
 *    (имя/email в сайдбаре);
 *  - «Отображение»: единица веса (г/кг) и уведомления →
 *    SettingsService.update, частичное обновление настроек;
 *  - «Безопасность»: смена пароля в модалке → ProfileService.changePassword,
 *    успех «Пароль изменён», поля сбрасываются (при отказе — нет);
 *  - «Опасная зона»: удаление аккаунта → ProfileService.deleteAccount,
 *    затем AuthService.logout() и переход на /register.
 *
 * Отказы бэкенда показываются дословно через NotificationService; тексты
 * ошибок полей — только из словаря ERROR_TEXTS после touched.
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { toApiError } from '../../../../shared/api-error';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { submitting } from '../../../../shared/loading/submitting';
import { WeightUnit } from '../../../../shared/models';
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
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    ToggleComponent,
    ModalComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly settingsService = inject(SettingsService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);

  /** Профиль: имя и email. */
  protected readonly profileForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [requiredTrim(), nameRule()] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [requiredTrim(), emailFormat()],
    }),
  });

  /** Отображение: единица веса и уведомления. */
  protected readonly unit = signal<WeightUnit>('g');
  protected readonly notificationsEnabled = signal(true);
  protected readonly settingsState = submitting();

  /** Смена пароля. */
  protected readonly passwordModalOpen = signal(false);
  protected readonly passwordForm = new FormGroup(
    {
      currentPassword: new FormControl('', { nonNullable: true, validators: [requiredTrim()] }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrim(), passwordRules()],
      }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [requiredTrim()] }),
    },
    { validators: passwordMatch('password', 'confirmPassword') },
  );

  /** Удаление аккаунта. */
  protected readonly deleteModalOpen = signal(false);

  protected readonly saveProfileState = submitting();
  protected readonly changePasswordState = submitting();
  protected readonly deleteState = submitting();

  async ngOnInit(): Promise<void> {
    try {
      const [profile, settings] = await Promise.all([
        firstValueFrom(this.profileService.get()),
        firstValueFrom(this.settingsService.get()),
      ]);
      this.profileForm.setValue({ name: profile.name, email: profile.email });
      this.unit.set(settings.weightUnit);
      this.notificationsEnabled.set(settings.notificationsEnabled);
    } catch (error) {
      this.notifications.notifyError(toApiError(error).body.message);
    } finally {
      this.loading.set(false);
    }
  }

  /** «Сохранить изменения»: валидация → profile.update → «Сохранено». */
  protected async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.notifications.notifyError(INVALID_FORM_MESSAGE);
      return;
    }
    trimFormValues(this.profileForm);
    const input = this.profileForm.getRawValue();
    await this.saveProfileState.run(async () => {
      try {
        const updated = await firstValueFrom(this.profileService.update(input));
        this.profileForm.setValue({ name: updated.name, email: updated.email });
        await firstValueFrom(this.auth.loadMe());
        this.notifications.notifySuccess('Сохранено');
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  /** Выбор единицы веса → частичное обновление настроек. */
  protected async setWeightUnit(unit: WeightUnit): Promise<void> {
    if (this.unit() === unit) {
      return;
    }
    await this.settingsState.run(async () => {
      try {
        const settings = await firstValueFrom(this.settingsService.update({ weightUnit: unit }));
        this.applySettings(settings.weightUnit, settings.notificationsEnabled);
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  /** Переключатель уведомлений → частичное обновление настроек. */
  protected async setNotificationsEnabled(enabled: boolean): Promise<void> {
    await this.settingsState.run(async () => {
      try {
        const settings = await firstValueFrom(
          this.settingsService.update({ notificationsEnabled: enabled }),
        );
        this.applySettings(settings.weightUnit, settings.notificationsEnabled);
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  protected openPasswordModal(): void {
    this.passwordModalOpen.set(true);
  }

  protected closePasswordModal(): void {
    this.passwordModalOpen.set(false);
    this.passwordForm.reset();
  }

  /** «Сменить»: валидация → changePassword → «Пароль изменён» и сброс полей. */
  protected async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.notifications.notifyError(INVALID_FORM_MESSAGE);
      return;
    }
    trimFormValues(this.passwordForm);
    const input = this.passwordForm.getRawValue();
    await this.changePasswordState.run(async () => {
      try {
        await firstValueFrom(this.profileService.changePassword(input));
        this.passwordForm.reset();
        this.passwordModalOpen.set(false);
        this.notifications.notifySuccess('Пароль изменён');
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  protected openDeleteModal(): void {
    this.deleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
  }

  /** «Удалить»: удаление аккаунта → выход → переход на /register. */
  protected async deleteAccount(): Promise<void> {
    await this.deleteState.run(async () => {
      try {
        await firstValueFrom(this.profileService.deleteAccount());
        await firstValueFrom(this.auth.logout());
        this.deleteModalOpen.set(false);
        await this.router.navigate(['/register']);
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  protected nameError(): string {
    return this.fieldError(this.profileForm.controls.name);
  }

  protected emailError(): string {
    return this.fieldError(this.profileForm.controls.email);
  }

  protected currentPasswordError(): string {
    return this.fieldError(this.passwordForm.controls.currentPassword);
  }

  protected newPasswordError(): string {
    return this.fieldError(this.passwordForm.controls.password);
  }

  /** У повтора — своя ошибка либо групповая «Пароли не совпадают». */
  protected confirmPasswordError(): string {
    const own = this.fieldError(this.passwordForm.controls.confirmPassword);
    if (own !== '') {
      return own;
    }
    const mismatch =
      this.passwordForm.hasError('password.mismatch') &&
      this.passwordForm.controls.confirmPassword.touched;
    return mismatch ? ERROR_TEXTS['password.mismatch'] : '';
  }

  private applySettings(unit: WeightUnit, notificationsEnabled: boolean): void {
    this.unit.set(unit);
    this.notificationsEnabled.set(notificationsEnabled);
  }

  private fieldError(control: AbstractControl): string {
    return control.touched ? firstErrorText(control.errors) ?? '' : '';
  }
}
