import { Injectable, signal } from '@angular/core';

import { STORAGE_KEYS } from '../../shared/models';

export type Theme = 'light' | 'dark';

/**
 * Централизованная система тем.
 * Переключает класс на <body> и сохраняет выбор в localStorage.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(loadTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      /* localStorage может быть недоступен */
    }
    this.applyTheme(theme);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  private applyTheme(theme: Theme): void {
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }
}

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    /* localStorage может быть недоступен */
  }
  // Нет сохранённого выбора — берём системную тему
  if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}
