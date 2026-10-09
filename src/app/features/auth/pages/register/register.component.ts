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
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
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
