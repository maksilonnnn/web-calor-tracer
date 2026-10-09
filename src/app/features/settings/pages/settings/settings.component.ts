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
  template: `
    <div class="settings-page">
      <header class="page-header">
        <div class="header-text">
          <h1 class="page-title">Настройки</h1>
          <p class="page-subtitle">Управление профилем и приложением</p>
        </div>
      </header>

      <div class="settings-column">
        <!-- Профиль -->
        <app-card class="settings-card">
          <div class="card-header">
            <h2 class="card-title">Профиль</h2>
            <p class="card-description">Эти данные отображаются в вашем профиле</p>
          </div>
          <div class="form-grid">
            <app-input
              label="Имя"
              type="text"
              [(ngModel)]="name"
            />
            <app-input
              label="Email"
              type="email"
              [(ngModel)]="email"
            />
          </div>
          <div class="card-actions">
            <app-button (click)="saveProfile()">
              Сохранить изменения
            </app-button>
          </div>
        </app-card>

        <!-- Отображение -->
        <app-card class="settings-card">
          <div class="card-header">
            <h2 class="card-title">Отображение</h2>
            <p class="card-description">Настройки вида данных в приложении</p>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <p class="setting-name">Показывать в калориях</p>
              <p class="setting-description">Вместо граммов показывать калорийность</p>
            </div>
            <app-toggle [checked]="useCalories" (onChange)="useCalories = $event" />
          </div>
        </app-card>

        <!-- Безопасность -->
        <app-card class="settings-card">
          <div class="card-header">
            <h2 class="card-title">Безопасность</h2>
            <p class="card-description">Управление паролем и доступом к аккаунту</p>
          </div>
          <div class="card-actions">
            <app-button variant="secondary" (click)="showPasswordModal = true">
              Сменить пароль
            </app-button>
          </div>
        </app-card>

        <!-- Опасная зона -->
        <app-card class="settings-card danger-card">
          <div class="card-header">
            <h2 class="card-title danger-title">Опасная зона</h2>
            <p class="card-description">
              Удаление аккаунта приведёт к потере всех данных без возможности восстановления.
            </p>
          </div>
          <div class="card-actions">
            <app-button variant="danger" (click)="showDeleteModal = true">
              Удалить аккаунт
            </app-button>
          </div>
        </app-card>
      </div>

      <!-- Модальное окно смены пароля -->
      <app-modal [isOpen]="showPasswordModal" [title]="'Сменить пароль'" (close)="showPasswordModal = false">
        <div class="modal-body">
          <app-input
            label="Текущий пароль"
            type="password"
            [(ngModel)]="passwordData.current"
          />
          <app-input
            label="Новый пароль"
            type="password"
            [(ngModel)]="passwordData.new"
          />
          <app-input
            label="Повторите новый пароль"
            type="password"
            [(ngModel)]="passwordData.confirm"
          />
          <div class="modal-actions">
            <app-button variant="secondary" fullWidth (click)="showPasswordModal = false">
              Отмена
            </app-button>
            <app-button fullWidth (click)="changePassword()">
              Сменить
            </app-button>
          </div>
        </div>
      </app-modal>

      <!-- Модальное окно удаления аккаунта -->
      <app-modal [isOpen]="showDeleteModal" [title]="'Удалить аккаунт?'" (close)="showDeleteModal = false">
        <div class="modal-body">
          <p class="modal-text">
            Это действие необратимо. Все ваши данные будут удалены.
          </p>
          <div class="modal-actions">
            <app-button variant="secondary" fullWidth (click)="showDeleteModal = false">
              Отмена
            </app-button>
            <app-button variant="danger" fullWidth (click)="deleteAccount()">
              Удалить
            </app-button>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Заголовок */
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

    /* Колонка карточек */
    .settings-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 800px;
    }
    .card-header {
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .card-title.danger-title {
      color: var(--accent-red);
    }
    .card-description {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 4px 0 0 0;
    }

    /* Профиль */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    /* Настройки-строки */
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 14px 16px;
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }
    .setting-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .setting-description {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 2px 0 0 0;
    }

    /* Действия в карточке */
    .card-actions {
      display: flex;
      gap: 12px;
    }

    /* Опасная зона */
    .danger-card {
      border-color: var(--accent-red-soft);
    }

    /* Модальные окна */
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
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
