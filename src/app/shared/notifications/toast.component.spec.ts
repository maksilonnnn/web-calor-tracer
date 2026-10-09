import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationService } from './notification-service';
import { ToastComponent } from './toast.component';

describe('ToastComponent — хост уведомлений', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let notifications: NotificationService;

  beforeEach(() => {
    jasmine.clock().install();
    fixture = TestBed.configureTestingModule({ imports: [ToastComponent] }).createComponent(
      ToastComponent,
    );
    notifications = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  function toast(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-test="toast"]') as HTMLElement | null;
  }

  it('без уведомления ничего не рендерит', () => {
    expect(toast()).toBeNull();
  });

  it('успех: текст и класс toast--success', () => {
    notifications.notifySuccess('Сохранено');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-test="toast-text"]')?.textContent).toBe(
      'Сохранено',
    );
    expect(toast()?.classList.contains('toast--success')).toBeTrue();
  });

  it('ошибка: текст дословно и класс toast--error', () => {
    notifications.notifyError('Неверный текущий пароль');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-test="toast-text"]')?.textContent).toBe(
      'Неверный текущий пароль',
    );
    expect(toast()?.classList.contains('toast--error')).toBeTrue();
  });

  it('клик по крестику закрывает уведомление', () => {
    notifications.notifySuccess('Удалено');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-test="toast-close"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(toast()).toBeNull();
    expect(notifications.message()).toBeNull();
  });
});
