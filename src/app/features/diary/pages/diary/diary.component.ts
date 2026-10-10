/**
 * Дневник питания (/diary): загрузка дня из DiaryService по выбранной дате,
 * итоги дня считаются по позициям. «Изменить» и «Удалить» работают через
 * сервис и обновляют день/итоги. В модалке редактирования меняются название,
 * количество (в текущих единицах, перед отправкой — в граммах) и пищевая
 * ценность продукта на 100 г.
 */
import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { DiaryService } from '../../../../core/services/diary.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { toApiError } from '../../../../shared/api-error';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { calculateNutrition, sumNutrition } from '../../../../shared/calculations';
import { formatDateLabel, todayIso } from '../../../../shared/dates';
import { submitting } from '../../../../shared/loading/submitting';
import {
  DiaryEntry,
  MealItem,
  MEAL_TYPE_ICONS,
  MEAL_TYPE_LABELS,
  WeightUnit,
} from '../../../../shared/models';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { formatQuantity, toDisplayQuantity, toGrams, weightUnitLabel } from '../../../../shared/units';
import { INVALID_FORM_MESSAGE } from '../../../../shared/validation/error-texts';
import {
  firstErrorText,
  nonNegativeNumber,
  positiveNumber,
  productName,
  requiredTrim,
  trimFormValues,
} from '../../../../shared/validation/validators';

/** Значение контрола как конечное число (иначе 0). */
function toNumber(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

@Component({
  selector: 'app-diary',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    ModalComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './diary.component.html',
  styleUrl: './diary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaryComponent implements OnInit {
  private readonly diary = inject(DiaryService);
  private readonly settingsService = inject(SettingsService);
  private readonly notifications = inject(NotificationService);

  protected readonly mealLabels = MEAL_TYPE_LABELS;
  protected readonly mealIcons = MEAL_TYPE_ICONS;

  protected readonly selectedDate = signal(todayIso());
  protected readonly entry = signal<DiaryEntry | null>(null);
  protected readonly loading = signal(true);
  protected readonly unit = signal<WeightUnit>('g');
  protected readonly unitLabel = computed(() => weightUnitLabel(this.unit()));

  protected readonly editItem = signal<MealItem | null>(null);
  protected readonly deletingItem = signal<MealItem | null>(null);

  /** Категории продукта — те же, что в модалке добавления еды. */
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

  protected readonly editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [requiredTrim(), productName()] }),
    quantity: new FormControl<number | string>(0, {
      nonNullable: true,
      validators: [requiredTrim(), positiveNumber()],
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

  protected readonly editState = submitting();
  protected readonly deleteState = submitting();

  protected readonly totals = computed(() => {
    const entry = this.entry();
    if (entry === null) {
      return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    }
    return sumNutrition(entry.meals.flatMap((meal) => meal.items));
  });

  async ngOnInit(): Promise<void> {
    try {
      const settings = await firstValueFrom(this.settingsService.get());
      this.unit.set(settings.weightUnit);
    } catch {
      // Не удалось получить настройки — остаёмся на граммах по умолчанию.
    }
    await this.load();
  }

  protected onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value !== '') {
      this.selectedDate.set(value);
      void this.load();
    }
  }

  protected formatDate(value: string): string {
    return formatDateLabel(value);
  }

  protected nutrition(item: MealItem): ReturnType<typeof calculateNutrition> {
    return calculateNutrition(item.product, item.quantity);
  }

  protected displayQuantity(item: MealItem): string {
    return formatQuantity(item.quantity, this.unit());
  }

  protected openEditModal(item: MealItem): void {
    this.editItem.set(item);
    this.editForm.setValue({
      name: item.product.name,
      quantity: toDisplayQuantity(item.quantity, this.unit()),
      calories: item.product.calories,
      protein: item.product.protein,
      fat: item.product.fat,
      carbs: item.product.carbs,
      category: item.product.category ?? 'Мясо',
    });
    this.editForm.markAsUntouched();
  }

  protected closeEditModal(): void {
    this.editItem.set(null);
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

  private error(
    name: 'name' | 'quantity' | 'calories' | 'protein' | 'fat' | 'carbs',
  ): string {
    const control = this.editForm.controls[name];
    return control.touched ? firstErrorText(control.errors) ?? '' : '';
  }

  async saveEdit(): Promise<void> {
    const item = this.editItem();
    if (item === null) {
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.notifications.notifyError(INVALID_FORM_MESSAGE);
      return;
    }
    trimFormValues(this.editForm);
    const value = this.editForm.getRawValue();
    const quantity = toGrams(toNumber(value.quantity), this.unit());
    await this.editState.run(async () => {
      try {
        this.entry.set(
          await firstValueFrom(
            this.diary.updateItem(item.id, {
              quantity,
              product: {
                name: value.name,
                calories: toNumber(value.calories),
                protein: toNumber(value.protein),
                fat: toNumber(value.fat),
                carbs: toNumber(value.carbs),
                category: value.category,
              },
            }),
          ),
        );
        this.notifications.notifySuccess('Сохранено');
        this.closeEditModal();
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  protected openDeleteModal(item: MealItem): void {
    this.deletingItem.set(item);
  }

  protected closeDeleteModal(): void {
    this.deletingItem.set(null);
  }

  async confirmDelete(): Promise<void> {
    const item = this.deletingItem();
    if (item === null) {
      return;
    }
    await this.deleteState.run(async () => {
      try {
        this.entry.set(await firstValueFrom(this.diary.removeItem(item.id)));
        this.notifications.notifySuccess('Удалено');
        this.closeDeleteModal();
      } catch (error) {
        this.notifications.notifyError(toApiError(error).body.message);
      }
    });
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.entry.set(await firstValueFrom(this.diary.getDay(this.selectedDate())));
    } catch (error) {
      this.notifications.notifyError(toApiError(error).body.message);
    } finally {
      this.loading.set(false);
    }
  }
}
