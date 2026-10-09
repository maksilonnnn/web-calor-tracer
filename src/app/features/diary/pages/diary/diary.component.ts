/**
 * Дневник питания (/diary): загрузка дня из DiaryService по выбранной дате,
 * итоги дня считаются по позициям. «Изменить» и «Удалить» работают через
 * сервис и обновляют день/итоги; количество вводится в текущих единицах
 * отображения и перед отправкой переводится в граммы.
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

import { DiaryService } from '../../../../core/services/diary.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { toApiError } from '../../../../shared/api-error';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
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
  positiveNumber,
  requiredTrim,
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

  protected readonly editForm = new FormGroup({
    quantity: new FormControl<number | string>(0, {
      nonNullable: true,
      validators: [requiredTrim(), positiveNumber()],
    }),
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
      const settings = await this.settingsService.get();
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
    this.editForm.controls.quantity.setValue(toDisplayQuantity(item.quantity, this.unit()));
    this.editForm.controls.quantity.markAsUntouched();
  }

  protected closeEditModal(): void {
    this.editItem.set(null);
  }

  protected quantityError(): string {
    const control = this.editForm.controls.quantity;
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
    const quantity = toGrams(toNumber(this.editForm.controls.quantity.value), this.unit());
    await this.editState.run(async () => {
      try {
        this.entry.set(await this.diary.updateQuantity(item.id, quantity));
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
        this.entry.set(await this.diary.removeItem(item.id));
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
      this.entry.set(await this.diary.getDay(this.selectedDate()));
    } catch (error) {
      this.notifications.notifyError(toApiError(error).body.message);
    } finally {
      this.loading.set(false);
    }
  }
}
