/**
 * Модалка «Добавить еду»: реактивная форма продукта (название, количество,
 * пищевая ценность на 100 г, категория, приём пищи). Отправка валидирует
 * форму и вызывает DiaryService.addFood; количество вводится в текущих
 * единицах отображения и перед отправкой переводится в граммы. Блок «Итог»
 * показывает пищевую ценность для указанного количества (calculateNutrition).
 *
 * Успех: уведомление «Сохранено» + события added (родителю для обновления
 * итогов) и close (закрытие модалки).
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, map } from 'rxjs';

import { DiaryService } from '../../../../core/services/diary.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { toApiError } from '../../../../shared/api-error';
import { calculateNutrition } from '../../../../shared/calculations';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { todayIso } from '../../../../shared/dates';
import { submitting } from '../../../../shared/loading/submitting';
import { MealType, Product, WeightUnit } from '../../../../shared/models';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import {
  quantityStep,
  toGrams,
  weightUnitLabel,
} from '../../../../shared/units';
import { INVALID_FORM_MESSAGE } from '../../../../shared/validation/error-texts';
import {
  firstErrorText,
  nonNegativeNumber,
  positiveNumber,
  productName,
  requiredTrim,
  trimFormValues,
} from '../../../../shared/validation/validators';

/** Вариант выбора приёма пищи. */
interface MealOption {
  value: MealType;
  label: string;
  icon: string;
}

/** Значение контрола как конечное число (иначе 0). */
function toNumber(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Округление до тысячных — защита от накопления погрешности в кг. */
function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

@Component({
  selector: 'app-add-food-modal',
  imports: [ReactiveFormsModule, ModalComponent, InputComponent, ButtonComponent, SpinnerComponent],
  templateUrl: './add-food-modal.component.html',
  styleUrl: './add-food-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFoodModalComponent implements OnInit {
  private readonly diary = inject(DiaryService);
  private readonly settingsService = inject(SettingsService);
  private readonly notifications = inject(NotificationService);

  readonly isOpen = input(false);
  readonly close = output<void>();
  readonly added = output<void>();

  protected readonly submitState = submitting();

  protected readonly meals: readonly MealOption[] = [
    { value: 'breakfast', label: 'Завтрак', icon: '🌅' },
    { value: 'lunch', label: 'Обед', icon: '☀️' },
    { value: 'dinner', label: 'Ужин', icon: '🌙' },
    { value: 'snack', label: 'Перекус', icon: '🍎' },
  ];

  protected readonly categories: readonly string[] = [
    'Мясо',
    'Крупы',
    'Яйца',
    'Выпечка',
    'Молочные',
    'Фрукты',
    'Овощи',
    'Напитки',
    'Другое',
  ];

  /** Единица отображения количества (из настроек). */
  protected readonly unit = signal<WeightUnit>('g');
  protected readonly unitLabel = computed(() => weightUnitLabel(this.unit()));
  protected readonly step = computed(() => quantityStep(this.unit()));

  /** true, пока настройки (единица веса) не загружены: количество и отправка заблокированы. */
  protected readonly unitLoading = signal(true);

  protected readonly form = new FormGroup({
    mealType: new FormControl<MealType>('breakfast', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true, validators: [requiredTrim(), productName()] }),
    quantity: new FormControl<number | string>(0, {
      nonNullable: true,
      validators: [positiveNumber()],
    }),
    calories: new FormControl<number | string>(0, {
      nonNullable: true,
      validators: [nonNegativeNumber()],
    }),
    protein: new FormControl<number | string>(0, {
      nonNullable: true,
      validators: [nonNegativeNumber()],
    }),
    fat: new FormControl<number | string>(0, {
      nonNullable: true,
      validators: [nonNegativeNumber()],
    }),
    carbs: new FormControl<number | string>(0, {
      nonNullable: true,
      validators: [nonNegativeNumber()],
    }),
    category: new FormControl('Мясо', { nonNullable: true }),
  });

  /** Живое значение формы для превью «Итог». */
  protected readonly formValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );

  protected readonly previewQuantityGrams = computed<number | null>(() =>
    this.unitLoading() ? null : toGrams(toNumber(this.formValue().quantity), this.unit()),
  );

  protected readonly previewNutrition = computed(() => {
    if (this.unitLoading()) {
      // Единица ещё не загружена — итог не считается, в шаблоне нейтральное «—».
      return null;
    }
    const value = this.formValue();
    const product: Product = {
      id: '',
      name: value.name,
      calories: toNumber(value.calories),
      protein: toNumber(value.protein),
      fat: toNumber(value.fat),
      carbs: toNumber(value.carbs),
      category: value.category,
    };
    return calculateNutrition(product, this.previewQuantityGrams() ?? 0);
  });

  private readonly today = todayIso();

  async ngOnInit(): Promise<void> {
    try {
      const settings = await firstValueFrom(this.settingsService.get());
      this.unit.set(settings.weightUnit);
    } catch {
      // Не удалось получить настройки — остаёмся на граммах по умолчанию.
    } finally {
      this.unitLoading.set(false);
    }
  }

  protected selectMeal(type: MealType): void {
    this.form.controls.mealType.setValue(type);
  }

  protected increment(): void {
    if (this.unitLoading()) {
      return;
    }
    const current = toNumber(this.form.controls.quantity.value);
    this.form.controls.quantity.setValue(round3(current + this.step()));
  }

  protected decrement(): void {
    if (this.unitLoading()) {
      return;
    }
    const current = toNumber(this.form.controls.quantity.value);
    this.form.controls.quantity.setValue(round3(Math.max(0, current - this.step())));
  }

  protected nameError(): string {
    return this.error('name');
  }

  protected quantityError(): string {
    return this.error('quantity');
  }

  protected caloriesError(): string {
    return this.error('calories');
  }

  protected proteinError(): string {
    return this.error('protein');
  }

  protected fatError(): string {
    return this.error('fat');
  }

  protected carbsError(): string {
    return this.error('carbs');
  }

  async handleAdd(): Promise<void> {
    if (this.unitLoading()) {
      // Единица ещё не загружена: перевод количества в граммы может быть неверным.
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.notifyError(INVALID_FORM_MESSAGE);
      return;
    }
    trimFormValues(this.form);
    const value = this.form.getRawValue();
    const quantity = toGrams(toNumber(value.quantity), this.unit());
    await this.submitState.run(async () => {
      try {
        await firstValueFrom(
          this.diary.addFood({
            date: this.today,
            mealType: value.mealType,
            product: {
              name: value.name,
              calories: toNumber(value.calories),
              protein: toNumber(value.protein),
              fat: toNumber(value.fat),
              carbs: toNumber(value.carbs),
              category: value.category,
            },
            quantity,
          }),
        );
        this.notifications.notifySuccess('Сохранено');
        this.form.reset();
        this.added.emit();
        this.close.emit();
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  private error(
    name: 'name' | 'quantity' | 'calories' | 'protein' | 'fat' | 'carbs',
  ): string {
    const control = this.form.controls[name];
    return control.touched ? firstErrorText(control.errors) ?? '' : '';
  }
}
