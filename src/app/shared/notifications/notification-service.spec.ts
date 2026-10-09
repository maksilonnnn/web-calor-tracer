import { NOTIFICATION_AUTO_CLOSE_MS, NotificationService } from './notification-service';

describe('NotificationService — единый механизм уведомлений', () => {
  let service: NotificationService;

  beforeEach(() => {
    jasmine.clock().install();
    service = new NotificationService();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('notifyError показывает ошибку с текстом дословно', () => {
    service.notifyError('Неверный текущий пароль');
    expect(service.message()).toEqual({
      severity: 'error',
      text: 'Неверный текущий пароль',
    });
  });

  it('notifySuccess показывает успех', () => {
    service.notifySuccess('Сохранено');
    expect(service.message()).toEqual({ severity: 'success', text: 'Сохранено' });
  });

  it('dismiss закрывает уведомление досрочно', () => {
    service.notifySuccess('Удалено');
    service.dismiss();
    expect(service.message()).toBeNull();
  });

  it('автозакрытие через 5 секунд', () => {
    service.notifySuccess('Сохранено');
    jasmine.clock().tick(NOTIFICATION_AUTO_CLOSE_MS - 1);
    expect(service.message()).not.toBeNull();
    jasmine.clock().tick(1);
    expect(service.message()).toBeNull();
  });

  it('новое уведомление сбрасывает таймер автозакрытия', () => {
    service.notifySuccess('Сохранено');
    jasmine.clock().tick(NOTIFICATION_AUTO_CLOSE_MS - 1);
    service.notifyError('Ошибка');
    jasmine.clock().tick(NOTIFICATION_AUTO_CLOSE_MS - 1);
    expect(service.message()).toEqual({ severity: 'error', text: 'Ошибка' });
  });
});
