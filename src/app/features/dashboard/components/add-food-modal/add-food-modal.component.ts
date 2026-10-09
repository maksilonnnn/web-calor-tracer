import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

interface MealOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-add-food-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent, InputComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Добавить еду"
      subtitle="Добавьте продукт и укажите его пищевую ценность."
      width="580px"
      (close)="close.emit()"
    >
      <div class="add-food-form">
        <!-- Приём пищи -->
        <div class="form-group">
          <span class="group-label">Приём пищи</span>
          <div class="meal-selector">
            @for (meal of meals; track meal.value) {
              <button
                type="button"
                class="meal-option"
                [class.active]="selectedMeal === meal.value"
                (click)="selectedMeal = meal.value"
              >
                <span class="meal-emoji">{{ meal.icon }}</span>
                <span>{{ meal.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Название продукта -->
        <div class="form-group">
          <app-input
            label="Название продукта"
            placeholder="Например, Куриная грудка"
            [(ngModel)]="name"
          />
        </div>

        <!-- Количество -->
        <div class="form-group">
          <span class="group-label">Количество</span>
          <div class="stepper">
            <button type="button" class="stepper-btn" aria-label="Уменьшить" (click)="decrement()">−</button>
            <input
              class="stepper-input"
              type="number"
              min="0"
              [(ngModel)]="quantity"
              aria-label="Количество в граммах"
            />
            <span class="stepper-unit">г</span>
            <button type="button" class="stepper-btn" aria-label="Увеличить" (click)="increment()">+</button>
          </div>
        </div>

        <!-- Пищевая ценность -->
        <div class="form-group">
          <span class="group-label">Пищевая ценность</span>
          <div class="nutrition-grid">
            <app-input label="Калории" type="number" unit="ккал" [(ngModel)]="calories" />
            <app-input label="Белки" type="number" unit="г" [(ngModel)]="protein" />
            <app-input label="Жиры" type="number" unit="г" [(ngModel)]="fat" />
            <app-input label="Углеводы" type="number" unit="г" [(ngModel)]="carbs" />
          </div>
        </div>

        <!-- Категория -->
        <div class="form-group">
          <span class="group-label">Категория</span>
          <div class="select-wrap">
            <select class="select" [(ngModel)]="category" aria-label="Категория продукта">
              @for (item of categories; track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
            <span class="select-arrow">▾</span>
          </div>
        </div>

        <!-- Превью итога -->
        <div class="preview">
          <p class="preview-heading">Итог</p>
          <div class="preview-top">
            <div class="preview-info">
              <p class="preview-name">{{ name || 'Название продукта' }}</p>
              <p class="preview-quantity">{{ quantity || 0 }} г</p>
            </div>
            <p class="preview-calories">
              {{ calories || 0 }}
              <span class="preview-unit">ккал</span>
            </p>
          </div>
          <div class="preview-macros">
            <span class="preview-macro">Белки <strong>{{ protein || 0 }} г</strong></span>
            <span class="preview-macro">Жиры <strong>{{ fat || 0 }} г</strong></span>
            <span class="preview-macro">Углеводы <strong>{{ carbs || 0 }} г</strong></span>
          </div>
        </div>

        <!-- Действия -->
        <div class="modal-actions">
          <app-button variant="secondary" (click)="close.emit()">Отмена</app-button>
          <app-button (click)="handleAdd()">Добавить продукт</app-button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .add-food-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .group-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Выбор приёма пищи */
    .meal-selector {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    .meal-option {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 6px;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease,
        color 0.15s ease;
    }
    .meal-option:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    .meal-option.active {
      border-color: var(--accent-primary);
      background: var(--accent-soft);
      color: var(--accent-primary);
      font-weight: 600;
    }
    .meal-emoji {
      font-size: 14px;
      line-height: 1;
    }

    /* Количество */
    .stepper {
      display: flex;
      align-items: center;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .stepper:focus-within {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-ring);
    }
    .stepper-btn {
      width: 44px;
      height: 42px;
      flex-shrink: 0;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .stepper-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    .stepper-btn:active {
      background: var(--bg-surface-secondary);
    }
    .stepper-input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      outline: none;
      padding: 10px 4px;
      font-size: 14px;
      font-family: inherit;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
      -moz-appearance: textfield;
      appearance: textfield;
    }
    .stepper-input::-webkit-outer-spin-button,
    .stepper-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .stepper-unit {
      font-size: 13px;
      color: var(--text-secondary);
      padding-right: 4px;
    }

    /* Пищевая ценность */
    .nutrition-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    /* Категория */
    .select-wrap {
      position: relative;
    }
    .select {
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 36px 10px 12px;
      font-size: 14px;
      font-family: inherit;
      color: var(--text-primary);
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease,
        background-color 0.25s ease;
    }
    .select:hover {
      border-color: var(--text-muted);
    }
    .select:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-ring);
    }
    .select option {
      background-color: var(--bg-surface);
      color: var(--text-primary);
    }
    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: var(--text-secondary);
      pointer-events: none;
    }

    /* Превью */
    .preview {
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
    }
    .preview-heading {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin: 0 0 10px 0;
    }
    .preview-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .preview-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .preview-quantity {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 2px 0 0 0;
      font-variant-numeric: tabular-nums;
    }
    .preview-calories {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      margin: 0;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .preview-unit {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .preview-macros {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
    }
    .preview-macro {
      font-size: 13px;
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .preview-macro strong {
      color: var(--text-primary);
      font-weight: 600;
    }

    /* Действия */
    .modal-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding-top: 4px;
    }
  `]
})
export class AddFoodModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  meals: MealOption[] = [
    { value: 'breakfast', label: 'Завтрак', icon: '🌅' },
    { value: 'lunch', label: 'Обед', icon: '☀️' },
    { value: 'dinner', label: 'Ужин', icon: '🌙' },
    { value: 'snack', label: 'Перекус', icon: '🍎' },
  ];

  categories = [
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

  selectedMeal = 'breakfast';
  name = '';
  quantity = 0;
  calories: string | number = 0;
  protein: string | number = 0;
  fat: string | number = 0;
  carbs: string | number = 0;
  category = 'Мясо';

  increment(): void {
    this.quantity = this.numeric(this.quantity) + 10;
  }

  decrement(): void {
    this.quantity = Math.max(0, this.numeric(this.quantity) - 10);
  }

  handleAdd(): void {
    // Этап UI-прототипа: продукт пока не сохраняется, только закрываем окно.
    this.close.emit();
  }

  private numeric(value: string | number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
