import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { AddFoodModalComponent } from '../../components/add-food-modal/add-food-modal.component';
import { mockDashboardData, mockSettings } from '../../../../shared/utils/mock-data';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../../../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, CardComponent, ProgressBarComponent, AddFoodModalComponent],
  template: `
    <div class="dashboard-page">
      <!-- Заголовок страницы -->
      <header class="page-header">
        <div class="header-text">
          <h1 class="page-title">Доброе утро, Алексей 👋</h1>
          <p class="page-subtitle">{{ today | date: 'd MMMM, EEEE' }}</p>
        </div>
        <app-button size="lg" (click)="openAddFoodModal()">
          <span class="plus-icon">+</span>
          Добавить еду
        </app-button>
      </header>

      <!-- Статистика: калории + макронутриенты -->
      <section class="stats-grid">
        <app-card class="calories-card">
          <div class="calories-ring">
            <svg viewBox="0 0 160 160" class="progress-ring">
              <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border-color)" stroke-width="11" />
              <circle
                cx="80" cy="80" r="70" fill="none"
                stroke="var(--accent-primary)" stroke-width="11" stroke-linecap="round"
                [attr.stroke-dasharray]="2 * Math.PI * 70"
                [attr.stroke-dashoffset]="2 * Math.PI * 70 * (1 - caloriesPercentage / 100)"
                class="progress-ring-fill"
              />
            </svg>
            <div class="calories-percentage">
              <span class="percentage-value">{{ caloriesPercentage }}%</span>
              <span class="percentage-label">от цели</span>
            </div>
          </div>
          <div class="calories-info">
            <p class="calories-value">
              {{ data.totalCalories }}
              <span class="calories-unit">ккал</span>
            </p>
            <p class="calories-goal">из {{ settings.dailyCalories }} ккал</p>
            <p class="calories-remaining">Осталось {{ remainingCalories }} ккал</p>
          </div>
        </app-card>

        <app-card class="macros-card">
          <h2 class="card-title">Макронутриенты</h2>
          <div class="macros-list">
            <app-progress-bar
              label="Белки"
              [value]="data.totalProtein"
              [max]="settings.dailyProtein"
              color="var(--accent-green)"
            />
            <app-progress-bar
              label="Жиры"
              [value]="data.totalFat"
              [max]="settings.dailyFat"
              color="var(--accent-orange)"
            />
            <app-progress-bar
              label="Углеводы"
              [value]="data.totalCarbs"
              [max]="settings.dailyCarbs"
              color="var(--accent-purple)"
            />
          </div>
        </app-card>
      </section>

      <!-- Приёмы пищи -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Приёмы пищи сегодня</h2>
        </div>
        <div class="meals-grid">
          @for (meal of data.meals; track meal.type) {
            <app-card class="meal-card">
              <div class="meal-icon-wrap">{{ getMealIcon(meal.type) }}</div>
              <p class="meal-name">{{ getMealLabel(meal.type) }}</p>
              <p class="meal-count">{{ meal.itemsCount }} продуктов</p>
              <p class="meal-calories">
                {{ meal.calories }}
                <span class="meal-unit">ккал</span>
              </p>
            </app-card>
          }
        </div>
      </section>

      <!-- Недавние продукты -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Недавние продукты</h2>
          <a routerLink="/diary" class="section-link">Все продукты</a>
        </div>
        <app-card class="recent-card">
          <div class="recent-list">
            @for (product of data.recentProducts; track product.id) {
              <div class="recent-row">
                <div class="row-left">
                  <div class="product-icon">🍽️</div>
                  <div class="product-details">
                    <p class="product-name">{{ product.name }}</p>
                    <p class="product-category">{{ product.category || 'Продукт' }}</p>
                  </div>
                </div>
                <p class="product-calories">
                  {{ product.calories }}
                  <span class="product-unit">ккал</span>
                </p>
              </div>
            }
          </div>
        </app-card>
      </section>
    </div>

    <!-- Модальное окно добавления еды (UI-прототип) -->
    <app-add-food-modal
      [isOpen]="isAddFoodModalOpen"
      (close)="closeAddFoodModal()"
    />
  `,
  styles: [`
    .dashboard-page {
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
    .plus-icon {
      font-size: 17px;
      font-weight: 600;
      line-height: 1;
    }

    /* Статистика */
    .stats-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
      gap: 24px;
    }
    .calories-card {
      display: flex;
      align-items: center;
      gap: 28px;
      padding: 28px;
    }
    .calories-ring {
      position: relative;
      width: 168px;
      height: 168px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .progress-ring {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .progress-ring-fill {
      transition: stroke-dashoffset 1s ease;
    }
    .calories-percentage {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .percentage-value {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }
    .percentage-label {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .calories-info {
      min-width: 0;
    }
    .calories-value {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 0;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }
    .calories-unit {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .calories-goal {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 6px 0 0 0;
    }
    .calories-remaining {
      display: inline-block;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-green);
      background: var(--accent-green-soft);
      border-radius: 999px;
      padding: 4px 10px;
      margin: 12px 0 0 0;
    }
    .macros-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }
    .macros-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 12px;
    }

    /* Секции */
    .section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2px;
    }
    .section-title {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      margin: 0;
    }
    .section-link {
      font-size: 13px;
      font-weight: 500;
      color: var(--accent-primary);
      text-decoration: none;
    }
    .section-link:hover {
      text-decoration: underline;
    }

    /* Приёмы пищи */
    .meals-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }
    .meal-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 20px;
    }
    .meal-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--accent-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 14px;
    }
    .meal-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .meal-count {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 2px 0 0 0;
    }
    .meal-calories {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      margin: 14px 0 0 0;
      font-variant-numeric: tabular-nums;
      margin-top: auto;
      padding-top: 14px;
    }
    .meal-unit {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    /* Недавние продукты */
    .recent-card {
      padding: 8px 24px;
    }
    .recent-list {
      display: flex;
      flex-direction: column;
    }
    .recent-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .recent-row:last-child {
      border-bottom: none;
    }
    .row-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .product-icon {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: var(--accent-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      flex-shrink: 0;
    }
    .product-details {
      min-width: 0;
    }
    .product-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .product-category {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
    }
    .product-calories {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .product-unit {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    /* Широкие экраны: карточки калорий не мельчают */
    @media (max-width: 1200px) {
      .calories-card {
        flex-direction: column;
        text-align: center;
      }
      .calories-remaining {
        margin-left: auto;
        margin-right: auto;
      }
    }
  `]
})
export class DashboardComponent {
  protected readonly Math = Math;
  data = mockDashboardData;
  settings = mockSettings;
  today = new Date();

  isAddFoodModalOpen = false;

  openAddFoodModal(): void {
    this.isAddFoodModalOpen = true;
  }

  closeAddFoodModal(): void {
    this.isAddFoodModalOpen = false;
  }

  get caloriesPercentage(): number {
    return Math.round((this.data.totalCalories / this.settings.dailyCalories) * 100);
  }

  get remainingCalories(): number {
    return this.settings.dailyCalories - this.data.totalCalories;
  }

  getMealLabel(type: string): string {
    return MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS] || type;
  }

  getMealIcon(type: string): string {
    return MEAL_TYPE_ICONS[type as keyof typeof MEAL_TYPE_ICONS] || '🍽️';
  }
}
