import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { mockDiaryEntry } from '../../../../shared/utils/mock-data';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../../../../shared/models';
import { calculateNutrition, formatDate, sumNutrition } from '../../../../shared/calculations';
import { MealItem } from '../../../../shared/models';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, ModalComponent, InputComponent],
  templateUrl: './diary.component.html',
  styleUrl: './diary.component.css'
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
