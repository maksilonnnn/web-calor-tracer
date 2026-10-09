import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app-container">
      <app-sidebar />
      <main class="main-content">
        <div class="main-container">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
      min-width: 0;
      margin-left: var(--sidebar-width);
      padding: 32px 40px;
    }
    .main-container {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
    }
  `]
})
export class AppComponent {}
