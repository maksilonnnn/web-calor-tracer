/**
 * Хост уведомлений <app-toast> — рендерит текущее уведомление
 * NotificationService поверх интерфейса. Объявлен один раз в корневом
 * каркасе (layout/app-root), поэтому доступен и гостевым экранам, и
 * авторизованной оболочке. Закрывается крестиком либо автоматически (5 с).
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NotificationService } from './notification-service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private readonly notifications = inject(NotificationService);

  protected readonly message = this.notifications.message;

  protected dismiss(): void {
    this.notifications.dismiss();
  }
}
