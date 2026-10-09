import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { ApiError, DashboardData, DEFAULT_SETTINGS, UserDto } from '../../../../shared/models';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { DiaryService } from '../../../../core/services/diary.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { DashboardComponent } from './dashboard.component';

interface DashboardInternals {
  data: () => DashboardData | null;
  loading: () => boolean;
  isAddFoodModalOpen: () => boolean;
  greeting: () => string;
  openAddFoodModal(): void;
  closeAddFoodModal(): void;
  onFoodAdded(): void;
}

const ME: UserDto = { id: 'u1', name: 'Алексей', email: 'alex@example.com' };

const DATA: DashboardData = {
  date: '2026-01-01',
  totalCalories: 3000,
  totalProtein: 100,
  totalFat: 50,
  totalCarbs: 200,
  meals: [
    { type: 'breakfast', calories: 500, itemsCount: 2 },
    { type: 'lunch', calories: 800, itemsCount: 3 },
    { type: 'dinner', calories: 700, itemsCount: 2 },
    { type: 'snack', calories: 1000, itemsCount: 1 },
  ],
  recentProducts: [],
  goals: { calories: 2500, protein: 150, fat: 83, carbs: 300 },
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardInternals;
  let dashboard: { getDay: jasmine.Spy };
  let notifyError: jasmine.Spy;

  beforeEach(() => {
    dashboard = { getDay: jasmine.createSpy('getDay') };

    fixture = TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboard },
        { provide: AuthService, useValue: { currentUser: signal<UserDto | null>(ME).asReadonly() } },
        { provide: SettingsService, useValue: { get: jasmine.createSpy('get').and.resolveTo(DEFAULT_SETTINGS) } },
        { provide: DiaryService, useValue: { addFood: jasmine.createSpy('addFood') } },
      ],
    }).createComponent(DashboardComponent);

    notifyError = spyOn(TestBed.inject(NotificationService), 'notifyError');
    component = fixture.componentInstance as unknown as DashboardInternals;
  });

  async function init(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('показывает индикатор загрузки до ответа, затем данные', async () => {
    let resolveDay: (value: DashboardData) => void = () => {};
    dashboard.getDay.and.returnValue(
      new Promise<DashboardData>((resolve) => (resolveDay = resolve)),
    );

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="dashboard-loading"]')).not.toBeNull();

    resolveDay(DATA);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-test="dashboard-loading"]')).toBeNull();
    expect(component.data()?.totalCalories).toBe(3000);
  });

  it('приветствие содержит имя пользователя, данные и нормы отрисованы', async () => {
    dashboard.getDay.and.resolveTo(DATA);
    await init();

    expect(component.greeting()).toContain('Алексей');
    expect(fixture.nativeElement.querySelector('[data-test="dashboard-greeting"]')?.textContent).toContain(
      'Алексей',
    );
    const calories = fixture.nativeElement.querySelector('.calories-value')?.textContent ?? '';
    expect(calories).toContain('3000');
    expect(fixture.nativeElement.textContent).toContain('из 2500 ккал');
  });

  it('отказ мока показывается уведомлением, загрузка снимается', async () => {
    const error: ApiError = { status: 401, body: { message: 'Не авторизован' } };
    dashboard.getDay.and.returnValue(Promise.reject(error));
    await init();

    expect(notifyError).toHaveBeenCalledWith('Не авторизован');
    expect(component.loading()).toBeFalse();
    expect(component.data()).toBeNull();
  });

  it('кнопка «Добавить еду» открывает модалку', async () => {
    dashboard.getDay.and.resolveTo(DATA);
    await init();

    (fixture.nativeElement.querySelector('[data-test="add-food-button"]') as HTMLElement).click();
    fixture.detectChanges();

    expect(component.isAddFoodModalOpen()).toBeTrue();
  });

  it('после добавления еды модалка закрывается и данные перезагружаются', async () => {
    dashboard.getDay.and.resolveTo(DATA);
    await init();
    component.openAddFoodModal();

    component.onFoodAdded();
    await fixture.whenStable();

    expect(component.isAddFoodModalOpen()).toBeFalse();
    expect(dashboard.getDay).toHaveBeenCalledTimes(2);
  });
});
