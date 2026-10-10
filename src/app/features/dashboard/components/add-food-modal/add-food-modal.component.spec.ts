import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { DEFAULT_SETTINGS, MealType, WeightUnit } from '../../../../shared/models';
import { calculateNutrition } from '../../../../shared/calculations';
import { todayIso } from '../../../../shared/dates';
import { DiaryService } from '../../../../core/services/diary.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { AddFoodModalComponent } from './add-food-modal.component';

interface ModalInternals {
  form: FormGroup;
  unit: () => WeightUnit;
  unitLabel: () => string;
  previewNutrition: () => ReturnType<typeof calculateNutrition>;
  selectMeal(type: MealType): void;
  increment(): void;
  decrement(): void;
  handleAdd(): Promise<void>;
}

describe('AddFoodModalComponent', () => {
  let fixture: ComponentFixture<AddFoodModalComponent>;
  let component: ModalInternals;
  let diary: { addFood: jasmine.Spy };
  let settings: { get: jasmine.Spy };
  let notifySuccess: jasmine.Spy;
  let notifyError: jasmine.Spy;

  const VALID = {
    mealType: 'breakfast' as MealType,
    name: 'Яблоко',
    quantity: 100,
    calories: 52,
    protein: 0.3,
    fat: 0.2,
    carbs: 14,
    category: 'Фрукты',
  };

  beforeEach(() => {
    diary = { addFood: jasmine.createSpy('addFood').and.returnValue(of(undefined)) };
    settings = { get: jasmine.createSpy('get').and.returnValue(of({ ...DEFAULT_SETTINGS })) };

    fixture = TestBed.configureTestingModule({
      imports: [AddFoodModalComponent],
      providers: [
        { provide: DiaryService, useValue: diary },
        { provide: SettingsService, useValue: settings },
      ],
    }).createComponent(AddFoodModalComponent);

    fixture.componentRef.setInput('isOpen', true);
    const notifications = TestBed.inject(NotificationService);
    notifySuccess = spyOn(notifications, 'notifySuccess');
    notifyError = spyOn(notifications, 'notifyError');
    component = fixture.componentInstance as unknown as ModalInternals;
  });

  async function init(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('невалидная форма: уведомление и отказ от отправки', async () => {
    await init();
    await component.handleAdd();

    expect(notifyError).toHaveBeenCalledWith('Данные заполнены неверно');
    expect(diary.addFood).not.toHaveBeenCalled();
  });

  it('успех в граммах: продукт без id, количество в граммах, события added и close', async () => {
    await init();
    const added = jasmine.createSpy('added');
    const close = jasmine.createSpy('close');
    fixture.componentInstance.added.subscribe(added);
    fixture.componentInstance.close.subscribe(close);

    component.form.patchValue(VALID);
    await component.handleAdd();

    expect(diary.addFood).toHaveBeenCalledWith({
      date: todayIso(),
      mealType: 'breakfast',
      product: {
        name: 'Яблоко',
        calories: 52,
        protein: 0.3,
        fat: 0.2,
        carbs: 14,
        category: 'Фрукты',
      },
      quantity: 100,
    });
    expect(notifySuccess).toHaveBeenCalledWith('Сохранено');
    expect(added).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('единица кг: количество конвертируется в граммы перед отправкой', async () => {
    settings.get.and.returnValue(of({ ...DEFAULT_SETTINGS, weightUnit: 'kg' }));
    await init();
    expect(component.unit()).toBe('kg');

    component.form.patchValue({ ...VALID, quantity: 0.15 });
    await component.handleAdd();

    expect(diary.addFood).toHaveBeenCalledWith(jasmine.objectContaining({ quantity: 150 }));
  });

  it('отказ бэкенда показывается уведомлением, события не испускаются', async () => {
    await init();
    const added = jasmine.createSpy('added');
    fixture.componentInstance.added.subscribe(added);
    diary.addFood.and.returnValue(throwError(() => ({ status: 401, body: { message: 'Не авторизован' } })));

    component.form.patchValue(VALID);
    await component.handleAdd();

    expect(notifyError).toHaveBeenCalledWith('Не авторизован');
    expect(added).not.toHaveBeenCalled();
  });

  it('недоступные настройки оставляют граммы по умолчанию', async () => {
    settings.get.and.returnValue(throwError(() => new Error('нет сети')));
    await init();

    expect(component.unit()).toBe('g');
    expect(component.unitLabel()).toBe('г');
  });

  it('выбор приёма пищи и шаг степпера', async () => {
    await init();
    component.selectMeal('lunch');
    expect(component.form.controls['mealType'].value).toBe('lunch');

    component.form.controls['quantity'].setValue(100);
    component.increment();
    expect(component.form.controls['quantity'].value).toBe(110);
    component.decrement();
    expect(component.form.controls['quantity'].value).toBe(100);
  });

  it('превью пересчитывает пищевую ценность по количеству', async () => {
    await init();
    component.form.patchValue(VALID);
    fixture.detectChanges();

    expect(component.previewNutrition()).toEqual({ calories: 52, protein: 0.3, fat: 0.2, carbs: 14 });
  });
});
