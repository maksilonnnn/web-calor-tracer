import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent, ToggleComponent, ModalComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  name = 'Алексей';
  email = 'alex@example.com';
  useCalories = false;
  showPasswordModal = false;
  showDeleteModal = false;
  passwordData = {
    current: '',
    new: '',
    confirm: '',
  };

  saveProfile() {
    // Заглушка: сохранение профиля
    console.log('Сохранить профиль:', { name: this.name, email: this.email });
  }

  changePassword() {
    // Заглушка: смена пароля
    console.log('Сменить пароль');
    this.showPasswordModal = false;
    this.passwordData = { current: '', new: '', confirm: '' };
  }

  deleteAccount() {
    // Заглушка: удаление аккаунта
    console.log('Удалить аккаунт');
    this.showDeleteModal = false;
  }
}
