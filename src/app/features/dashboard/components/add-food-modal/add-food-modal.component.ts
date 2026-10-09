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
  templateUrl: './add-food-modal.component.html',
  styleUrl: './add-food-modal.component.css'
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
