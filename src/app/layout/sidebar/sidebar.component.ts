import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { GlobalLoaderService } from '../../core/services/global-loader.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loader = inject(GlobalLoaderService);

  protected readonly user = this.auth.currentUser;
  protected readonly userInitial = computed(() => {
    const name = this.user()?.name.trim() ?? '';
    return name === '' ? '?' : name.charAt(0).toUpperCase();
  });

  protected async logout(): Promise<void> {
    this.loader.show();
    try {
      await firstValueFrom(this.auth.logout());
      await this.router.navigateByUrl('/login');
    } finally {
      this.loader.hide();
    }
  }
}
