import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <div class="theme-toggle" role="group" aria-label="Тема оформления">
      <button
        type="button"
        class="theme-option"
        [class.active]="themeService.theme() === 'light'"
        (click)="themeService.setTheme('light')"
      >
        <span class="theme-icon">☀️</span>
        <span>Светлая</span>
      </button>
      <button
        type="button"
        class="theme-option"
        [class.active]="themeService.theme() === 'dark'"
        (click)="themeService.setTheme('dark')"
      >
        <span class="theme-icon">🌙</span>
        <span>Тёмная</span>
      </button>
    </div>
  `,
  styles: [`
    .theme-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 4px;
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }
    .theme-option {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 8px;
      border: none;
      border-radius: 7px;
      background: transparent;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .theme-option:hover {
      color: var(--text-primary);
    }
    .theme-option.active {
      background: var(--bg-surface);
      color: var(--text-primary);
      box-shadow: var(--shadow-card);
    }
    .theme-icon {
      font-size: 13px;
      line-height: 1;
    }
  `]
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);
}
