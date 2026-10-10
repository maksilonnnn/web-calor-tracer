import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import {
  DEFAULT_SETTINGS,
  DiaryEntry,
  MealItem,
  MEAL_TYPES,
  WeightUnit,
} from '../../../../shared/models';
import { DiaryService } from '../../../../core/services/diary.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { DiaryComponent } from './diary.component';

interface DiaryInternals {
  entry: () => DiaryEntry | null;
  loading: () => boolean;
  selectedDate: () => string;
  unit: () => WeightUnit;
  totals: () => { calories: number; protein: number; fat: number; carbs: number };
  editForm: FormGroup;
  onDateChange(event: Event): void;
  openEditModal(item: MealItem): void;
  closeEditModal(): void;
  openDeleteModal(item: MealItem): void;
  saveEdit(): Promise<void>;
  confirmDelete(): Promise<void>;
}

const ITEM: MealItem = {
  id: 'i1',
  product: {
    id: 'p1',
    name: 'Яблоко',
    calories: 52,
    protein: 0.3,
    fat: 0.2,
    carbs: 14,
    category: 'Фрукты',
  },
  quantity: 150,
};

const ENTRY: DiaryEntry = {
  id: 'd1',
  date: '2026-01-01',
  meals: MEAL_TYPES.map((type) => ({
    id: `m-${type}`,
    type,
    items: type === 'breakfast' ? [ITEM] : [],
  })),
};

describe('DiaryComponent', () => {
  let fixture: ComponentFixture<DiaryComponent>;
  let component: DiaryInternals;
  let diary: { getDay: jasmine.Spy; updateItem: jasmine.Spy; removeItem: jasmine.Spy };
  let settings: { get: jasmine.Spy };
  let notifySuccess: jasmine.Spy;
  let notifyError: jasmine.Spy;

  beforeEach(() => {
    diary = {
      getDay: jasmine.createSpy('getDay').and.returnValue(of(ENTRY)),
      updateItem: jasmine.createSpy('updateItem').and.returnValue(of(ENTRY)),
      removeItem: jasmine.createSpy('removeItem').and.returnValue(of(ENTRY)),
    };
    settings = { get: jasmine.createSpy('get').and.returnValue(of({ ...DEFAULT_SETTINGS })) };

    fixture = TestBed.configureTestingModule({
      imports: [DiaryComponent],
      providers: [
        { provide: DiaryService, useValue: diary },
        { provide: SettingsService, useValue: settings },
      ],
    }).createComponent(DiaryComponent);

    const notifications = TestBed.inject(NotificationService);
    notifySuccess = spyOn(notifications, 'notifySuccess');
    notifyError = spyOn(notifications, 'notifyError');
    component = fixture.componentInstance as unknown as DiaryInternals;
  });

  async function init(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('загружает день и считает итог по позициям', async () => {
    await init();

    expect(component.entry()?.meals.length).toBe(4);
    expect(component.totals()).toEqual({ calories: 78, protein: 0.5, fat: 0.3, carbs: 21 });
    expect(
      fixture.nativeElement.querySelector('[data-test="diary-total-calories"]')?.textContent,
    ).toBe('78');
    expect(fixture.nativeElement.querySelector('[data-test="meal-item-i1"]')).not.toBeNull();
  });

  it('блок загрузки показывает спиннер до ответа и исчезает после', async () => {
    const day = new Subject<DiaryEntry>();
    diary.getDay.and.returnValue(day.asObservable());

    fixture.detectChanges();
    const loadingBlock = fixture.nativeElement.querySelector('[data-test="diary-loading"]');
    expect(loadingBlock).not.toBeNull();
    expect(loadingBlock?.querySelector('app-spinner')).not.toBeNull();

    day.next(ENTRY);
    day.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-test="diary-loading"]')).toBeNull();
  });

  it('смена даты перезагружает день', async () => {
    await init();
    const event = { target: { value: '2026-02-02' } } as unknown as Event;

    component.onDateChange(event);
    await fixture.whenStable();

    expect(component.selectedDate()).toBe('2026-02-02');
    expect(diary.getDay).toHaveBeenCalledWith('2026-02-02');
  });

  it('отказ загрузки показывается уведомлением', async () => {
    diary.getDay.and.returnValue(throwError(() => ({ status: 401, body: { message: 'Не авторизован' } })));
    await init();

    expect(notifyError).toHaveBeenCalledWith('Не авторизован');
    expect(component.loading()).toBeFalse();
  });

  it('редактирование в кг: количество показывается и отправляется в граммах', async () => {
    settings.get.and.returnValue(of({ ...DEFAULT_SETTINGS, weightUnit: 'kg' }));
    await init();

    component.openEditModal(ITEM);
    expect(component.editForm.controls['quantity'].value).toBe(0.15);

    await component.saveEdit();

    expect(diary.updateItem).toHaveBeenCalledWith('i1', {
      quantity: 150,
      product: {
        name: 'Яблоко',
        calories: 52,
        protein: 0.3,
        fat: 0.2,
        carbs: 14,
        category: 'Фрукты',
      },
    });
    expect(notifySuccess).toHaveBeenCalledWith('Сохранено');
  });

  it('редактирование пищевой ценности отправляет новые значения', async () => {
    await init();
    component.openEditModal(ITEM);
    const form = component.editForm.controls;
    expect(form['name'].value).toBe('Яблоко');
    expect(form['calories'].value).toBe(52);
    expect(form['protein'].value).toBe(0.3);

    form['name'].setValue('Груша');
    form['calories'].setValue(70);
    form['protein'].setValue(2);
    form['carbs'].setValue(20);

    await component.saveEdit();

    expect(diary.updateItem).toHaveBeenCalledWith('i1', {
      quantity: 150,
      product: {
        name: 'Груша',
        calories: 70,
        protein: 2,
        fat: 0.2,
        carbs: 20,
        category: 'Фрукты',
      },
    });
    expect(notifySuccess).toHaveBeenCalledWith('Сохранено');
  });

  it('удаление позиции: вызов сервиса и уведомление «Удалено»', async () => {
    await init();
    component.openDeleteModal(ITEM);

    await component.confirmDelete();

    expect(diary.removeItem).toHaveBeenCalledWith('i1');
    expect(notifySuccess).toHaveBeenCalledWith('Удалено');
  });

  it('пустое количество при редактировании не отправляется', async () => {
    await init();
    component.openEditModal(ITEM);
    component.editForm.controls['quantity'].setValue(0);

    await component.saveEdit();

    expect(notifyError).toHaveBeenCalledWith('Данные заполнены неверно');
    expect(diary.updateItem).not.toHaveBeenCalled();
  });
});
