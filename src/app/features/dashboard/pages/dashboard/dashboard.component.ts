/**
 * Дашборд (/) — агрегат дня из DashboardService: итоги, разбивка по приёмам
 * пищи, недавние продукты и дневные нормы считает бэкенд. Приветствие и
 * подпись даты формируются на странице. Добавление еды — через модалку;
 * после успеха итоги перезагружаются.
 */
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { toApiError } from '../../../../shared/api-error';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { todayIso } from '../../../../shared/dates';
import { DashboardData, MEAL_TYPE_ICONS, MEAL_TYPE_LABELS } from '../../../../shared/models';
import { NotificationService } from '../../../../shared/notifications/notification-service';
import { AddFoodModalComponent } from '../../components/add-food-modal/add-food-modal.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    CardComponent,
    ProgressBarComponent,
    SpinnerComponent,
    AddFoodModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected readonly Math = Math;
  protected readonly mealLabels = MEAL_TYPE_LABELS;
  protected readonly mealIcons = MEAL_TYPE_ICONS;

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly isAddFoodModalOpen = signal(false);
  protected readonly today = new Date();

  protected readonly greeting = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return `${this.greetingPrefix(new Date().getHours())}, ${name} 👋`;
  });

  protected readonly caloriesPercentage = computed(() => {
    const data = this.data();
    if (data === null || data.goals.calories === 0) {
      return 0;
    }
    return Math.round((data.totalCalories / data.goals.calories) * 100);
  });

  protected readonly remainingCalories = computed(() => {
    const data = this.data();
    return data === null ? 0 : data.goals.calories - data.totalCalories;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected openAddFoodModal(): void {
    this.isAddFoodModalOpen.set(true);
  }

  protected closeAddFoodModal(): void {
    this.isAddFoodModalOpen.set(false);
  }

  protected onFoodAdded(): void {
    this.isAddFoodModalOpen.set(false);
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.data.set(await firstValueFrom(this.dashboard.getDay(todayIso())));
    } catch (error) {
      this.notifications.notifyError(toApiError(error).body.message);
    } finally {
      this.loading.set(false);
    }
  }

  private greetingPrefix(hour: number): string {
    if (hour >= 5 && hour < 12) {
      return 'Доброе утро';
    }
    if (hour >= 12 && hour < 18) {
      return 'Добрый день';
    }
    if (hour >= 18 && hour < 23) {
      return 'Добрый вечер';
    }
    return 'Доброй ночи';
  }
}
