import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent],
  template: `
    <div class="register-container">
      <app-card class="register-card">
        <div class="register-header">
          <h1 class="register-title">Создать аккаунт</h1>
          <p class="register-subtitle">Заполните форму для регистрации</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="register-form">
          <app-input
            label="Имя"
            type="text"
            placeholder="Введите ваше имя"
            [(ngModel)]="formData.name"
            name="name"
            [error]="errors.name"
          />

          <app-input
            label="Email"
            type="email"
            placeholder="example@mail.com"
            [(ngModel)]="formData.email"
            name="email"
            [error]="errors.email"
          />

          <app-input
            label="Пароль"
            type="password"
            placeholder="Минимум 6 символов"
            [(ngModel)]="formData.password"
            name="password"
            [error]="errors.password"
          />

          <app-input
            label="Повторите пароль"
            type="password"
            placeholder="Повторите пароль"
            [(ngModel)]="formData.confirmPassword"
            name="confirmPassword"
            [error]="errors.confirmPassword"
          />

          <app-button type="submit" size="lg" fullWidth>
            Зарегистрироваться
          </app-button>
        </form>

        <p class="register-footer">
          Уже есть аккаунт?
          <a href="/login" class="login-link">Войти</a>
        </p>
      </app-card>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 0;
    }
    .register-card {
      width: 100%;
      max-width: 440px;
      padding: 32px;
    }
    .register-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .register-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 0 0 6px 0;
    }
    .register-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .register-footer {
      text-align: center;
      font-size: 13px;
      color: var(--text-secondary);
      margin: 24px 0 0 0;
    }
    .login-link {
      color: var(--accent-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .login-link:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  errors = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  constructor(private router: Router) {}

  validate(): boolean {
    const newErrors = { name: '', email: '', password: '', confirmPassword: '' };

    if (!this.formData.name.trim()) {
      newErrors.name = 'Введите имя';
    }

    if (!this.formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(this.formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!this.formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (this.formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    this.errors = newErrors;
    return Object.values(newErrors).every((error) => !error);
  }

  onSubmit() {
    if (this.validate()) {
      // Заглушка: переход на главную
      this.router.navigate(['/']);
    }
  }
}
