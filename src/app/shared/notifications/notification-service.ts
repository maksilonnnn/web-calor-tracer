/**
 * NotificationService — единый механизм уведомлений об успехе и ошибке.
 *
 * Публичный API:
 *   notifyError(text)   — ошибка (text показывается дословно: body.message
 *                         мока либо текст клиентской валидации);
 *   notifySuccess(text) — успех; допустимы только 'Сохранено' | 'Удалено' |
 *                         'Пароль изменён' (тип-литерал union).
 *
 * Уведомление — единственное текущее сообщение в сигнале; хост-компонент
 * <app-toast> рендерит его поверх интерфейса. Автозакрытие — 5 с, сброс
 * таймера при каждом новом уведомлении; dismiss() закрывает досрочно.
 */
import { Injectable, signal } from '@angular/core';

/** Разрешённые тексты успеха (контракт уведомлений). */
export type SuccessNotificationText = 'Сохранено' | 'Удалено' | 'Пароль изменён';

/** Вид уведомления: зелёный успех либо красная ошибка. */
export type NotificationSeverity = 'success' | 'error';

/** Текущее уведомление для отображения. */
export interface ToastNotification {
  severity: NotificationSeverity;
  text: string;
}

/** Время автозакрытия уведомления, мс. */
export const NOTIFICATION_AUTO_CLOSE_MS = 5000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messageSource = signal<ToastNotification | null>(null);

  /** Текущее уведомление; null — ничего не показано. */
  readonly message = this.messageSource.asReadonly();

  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  /** Показать ошибку; text — дословно из body.message либо валидации. */
  notifyError(text: string): void {
    this.show({ severity: 'error', text });
  }

  /** Показать успех (только разрешённые тексты). */
  notifySuccess(text: SuccessNotificationText): void {
    this.show({ severity: 'success', text });
  }

  /** Закрыть текущее уведомление досрочно. */
  dismiss(): void {
    this.cancelAutoClose();
    this.messageSource.set(null);
  }

  private show(notification: ToastNotification): void {
    this.cancelAutoClose();
    this.messageSource.set(notification);
    this.autoCloseTimer = setTimeout(() => {
      this.autoCloseTimer = null;
      this.messageSource.set(null);
    }, NOTIFICATION_AUTO_CLOSE_MS);
  }

  private cancelAutoClose(): void {
    if (this.autoCloseTimer !== null) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }
}
