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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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
