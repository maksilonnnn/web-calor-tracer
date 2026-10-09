import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { mockDiaryEntry } from '../../../../shared/utils/mock-data';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../../../../shared/models';
import { calculateNutrition, formatDate, sumNutrition } from '../../../../shared/utils/calculations';
import { MealItem } from '../../../../shared/models';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, ModalComponent, InputComponent],
  template: `
    <div class="diary-page">
      <!-- Заголовок страницы -->
      <header class="page-header">
        <div class="header-text">
          <h1 class="page-title">Дневник питания</h1>
          <p class="page-subtitle">{{ formatDate(selectedDate) }}</p>
        </div>
        <input type="date" [(ngModel)]="selectedDate" class="date-input" />
      </header>

      <div class="diary-content">
        <!-- Приёмы пищи -->
        <div class="meals-column">
          @for (meal of diaryEntry.meals; track meal.id) {
            <app-card class="meal-card">
              <div class="meal-header">
                <span class="meal-icon">{{ getMealIcon(meal.type) }}</span>
                <h2 class="meal-title">{{ getMealLabel(meal.type) }}</h2>
                <span class="meal-count">{{ meal.items.length }} продуктов</span>
              </div>

              <div class="meal-items">
                @for (item of meal.items; track item.id) {
                  <div class="meal-item">
                    <div class="item-info">
                      <p class="item-name">{{ item.product.name }}</p>
                      <p class="item-details">{{ item.quantity }} г • {{ getNutrition(item).calories }} ккал</p>
                    </div>
                    <div class="item-actions">
                      <app-button size="sm" variant="secondary" (click)="openEditModal(item)">
                        Изменить
                      </app-button>
                      <app-button size="sm" variant="danger" (click)="openDeleteModal(item)">
                        Удалить
                      </app-button>
                    </div>
                  </div>
                }
              </div>
            </app-card>
          }
        </div>

        <!-- Итого за день -->
        <aside class="summary-column">
          <app-card class="summary-card">
            <h2 class="summary-title">Итого за день</h2>
            <div class="summary-total">
              <p class="total-value">{{ totals.calories }}</p>
              <p class="total-label">ккал</p>
            </div>
            <div class="summary-macros">
              <div class="macro-item">
                <p class="macro-value protein">{{ totals.protein | number: '1.0-0' }}</p>
                <p class="macro-label">белки</p>
              </div>
              <div class="macro-item">
                <p class="macro-value fat">{{ totals.fat | number: '1.0-0' }}</p>
                <p class="macro-label">жиры</p>
              </div>
              <div class="macro-item">
                <p class="macro-value carbs">{{ totals.carbs | number: '1.0-0' }}</p>
                <p class="macro-label">углеводы</p>
              </div>
            </div>
          </app-card>
        </aside>
      </div>

      <!-- Модальное окно редактирования -->
      <app-modal [isOpen]="!!editItem" [title]="'Изменить количество'" (close)="closeEditModal()">
        <div class="modal-body">
          <p class="modal-product-name">{{ editItem?.product?.name }}</p>
          <app-input
            label="Количество (г)"
            type="number"
            [value]="editQuantity"
            (valueChange)="editQuantity = $event"
          />
          <div class="modal-actions">
            <app-button variant="secondary" fullWidth (click)="closeEditModal()">
              Отмена
            </app-button>
            <app-button fullWidth (click)="saveEdit()">
              Сохранить
            </app-button>
          </div>
        </div>
      </app-modal>

      <!-- Модальное окно подтверждения удаления -->
      <app-modal [isOpen]="!!deleteItem" [title]="'Удалить продукт?'" (close)="closeDeleteModal()">
        <div class="modal-body">
          <p class="modal-text">
            Вы уверены, что хотите удалить «{{ deleteItem?.product?.name }}»?
          </p>
          <div class="modal-actions">
            <app-button variant="secondary" fullWidth (click)="closeDeleteModal()">
              Отмена
            </app-button>
            <app-button variant="danger" fullWidth (click)="confirmDelete()">
              Удалить
            </app-button>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .diary-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Заголовок */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }
    .page-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 0;
    }
    .page-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 4px 0 0 0;
    }
    .date-input {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 12px;
      color: var(--text-primary);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .date-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-ring);
    }

    /* Сетка контента */
    .diary-content {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
      gap: 24px;
      align-items: start;
    }
    .meals-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    /* Карточка приёма пищи */
    .meal-card {
      padding: 20px 24px;
    }
    .meal-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-color);
    }
    .meal-icon {
      font-size: 20px;
      line-height: 1;
    }
    .meal-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .meal-count {
      margin-left: auto;
      font-size: 13px;
      color: var(--text-secondary);
    }
    .meal-items {
      display: flex;
      flex-direction: column;
    }
    .meal-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .meal-item:last-child {
      border-bottom: none;
      padding-bottom: 2px;
    }
    .item-info {
      min-width: 0;
    }
    .item-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .item-details {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 2px 0 0 0;
      font-variant-numeric: tabular-nums;
    }
    .item-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    /* Итоги */
    .summary-column {
      position: sticky;
      top: 32px;
    }
    .summary-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 16px 0;
    }
    .summary-total {
      text-align: center;
      padding: 12px 0 20px;
    }
    .total-value {
      font-size: 40px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--accent-primary);
      margin: 0;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .total-label {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 6px 0 0 0;
    }
    .summary-macros {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }
    .macro-item {
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px 8px;
      text-align: center;
    }
    .macro-value {
      font-size: 17px;
      font-weight: 700;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .macro-value.protein { color: var(--accent-green); }
    .macro-value.fat { color: var(--accent-orange); }
    .macro-value.carbs { color: var(--accent-purple); }
    .macro-label {
      font-size: 11px;
      color: var(--text-secondary);
      margin: 2px 0 0 0;
    }

    /* Модальные окна */
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-product-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .modal-text {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 4px;
    }
  `]
})
export class DiaryComponent {
  selectedDate = mockDiaryEntry.date;
  diaryEntry = mockDiaryEntry;
  editItem: MealItem | null = null;
  editQuantity = '';
  deleteItem: MealItem | null = null;

  protected readonly formatDate = formatDate;

  get totals() {
    const allItems = this.diaryEntry.meals.flatMap((meal) => meal.items);
    return sumNutrition(allItems);
  }

  getMealLabel(type: string): string {
    return MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS] || type;
  }

  getMealIcon(type: string): string {
    return MEAL_TYPE_ICONS[type as keyof typeof MEAL_TYPE_ICONS] || '🍽️';
  }

  getNutrition(item: MealItem) {
    return calculateNutrition(item.product, item.quantity);
  }

  openEditModal(item: MealItem) {
    this.editItem = item;
    this.editQuantity = item.quantity.toString();
  }

  closeEditModal() {
    this.editItem = null;
  }

  saveEdit() {
    // Заглушка: сохранение изменений
    console.log('Сохранить:', this.editItem?.id, this.editQuantity);
    this.closeEditModal();
  }

  openDeleteModal(item: MealItem) {
    this.deleteItem = item;
  }

  closeDeleteModal() {
    this.deleteItem = null;
  }

  confirmDelete() {
    // Заглушка: удаление
    console.log('Удалить:', this.deleteItem?.id);
    this.closeDeleteModal();
  }
}
