import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <aside class="sidebar">
      <!-- Логотип -->
      <div class="sidebar-header">
        <div class="logo-mark">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21c-4.5-2.5-7-6-7-10a7 7 0 0 1 14 0c0 4-2.5 7.5-7 10z" />
            <path d="M12 3v8" />
          </svg>
        </div>
        <span class="logo-title">CalorieTracker</span>
      </div>

      <!-- Навигация -->
      <nav class="sidebar-nav">
        <p class="nav-label">Меню</p>
        <ul class="nav-list">
          <li>
            <a
              routerLink="/"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5" />
              </svg>
              <span>Главная</span>
            </a>
          </li>
          <li>
            <a routerLink="/diary" routerLinkActive="active" class="nav-link">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <path d="M8 3v18" />
                <path d="M12 8h4" />
                <path d="M12 12h4" />
              </svg>
              <span>Дневник</span>
            </a>
          </li>
          <li>
            <a routerLink="/settings" routerLinkActive="active" class="nav-link">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 7h10" />
                <path d="M18 7h2" />
                <circle cx="16" cy="7" r="2" />
                <path d="M4 17h6" />
                <path d="M14 17h6" />
                <circle cx="12" cy="17" r="2" />
              </svg>
              <span>Настройки</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Низ sidebar: тема + профиль -->
      <div class="sidebar-footer">
        <app-theme-toggle />
        <div class="user-info">
          <div class="user-avatar">А</div>
          <div class="user-details">
            <p class="user-name">Алексей</p>
            <p class="user-email">alex&#64;example.com</p>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      padding: 24px 16px 16px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-color);
      transition: background-color 0.25s ease, border-color 0.25s ease;
      z-index: 100;
    }

    /* Логотип */
    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 8px;
      margin-bottom: 28px;
    }
    .logo-mark {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: var(--accent-primary);
      color: var(--text-on-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }

    /* Навигация */
    .sidebar-nav {
      flex: 1;
    }
    .nav-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin: 0 0 8px;
      padding: 0 10px;
    }
    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 9px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .nav-link:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    .nav-link.active {
      background: var(--nav-active-bg);
      color: var(--accent-primary);
      font-weight: 600;
    }
    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Низ sidebar */
    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: 10px;
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: var(--text-on-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .user-details {
      min-width: 0;
    }
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-email {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class SidebarComponent {}
