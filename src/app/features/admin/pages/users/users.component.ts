/**
 * Страница «Пользователи» (/admin): админ-таблица с поиском, пагинацией и
 * блокировкой/разблокировкой. Доступ к маршруту даёт adminGuard, но реальная
 * защита — [Authorize(Roles = "admin")] на бэкенде.
 *
 * Все действия идут через AdminService; после block/unblock строка списка
 * обновляется ответом бэкенда, без повторной загрузки всей страницы.
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { GlobalLoaderService } from '../../../../core/services/global-loader.service';
import { toApiError } from '../../../../shared/api-error';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { AdminUser, UserRole } from '../../../../shared/models';
import { NotificationService } from '../../../../shared/notifications/notification-service';

/** Размер страницы админ-списка. */
const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-users',
  imports: [
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly loader = inject(GlobalLoaderService);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly search = signal('');
  protected readonly actionId = signal<string | null>(null);

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  /** id текущего пользователя: себя блокировать нельзя (и на бэкенде тоже). */
  private readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? '');

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  /** Загрузка страницы списка с текущими фильтрами. */
  protected async loadUsers(): Promise<void> {
    this.loading.set(true);
    this.loader.show();
    try {
      const result = await firstValueFrom(
        this.adminService.getUsers({
          page: this.page(),
          pageSize: PAGE_SIZE,
          search: this.search(),
        }),
      );
      this.users.set(result.items);
      this.totalCount.set(result.totalCount);
      this.totalPages.set(result.totalPages);
    } catch (error) {
      this.notifications.notifyError(toApiError(error).body.message);
    } finally {
      this.loader.hide();
      this.loading.set(false);
    }
  }

  /** Поиск по имени/email: сброс на первую страницу. */
  protected onSearch(): void {
    this.search.set(this.searchControl.value.trim());
    this.page.set(1);
    void this.loadUsers();
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
    this.search.set('');
    this.page.set(1);
    void this.loadUsers();
  }

  protected async goToPage(target: number): Promise<void> {
    if (target < 1 || target > this.totalPages() || target === this.page() || this.loading()) {
      return;
    }
    this.page.set(target);
    await this.loadUsers();
  }

  /** Кнопка доступна только для обычных пользователей и не для себя. */
  protected canChangeBlock(user: AdminUser): boolean {
    return user.role !== 'admin' && user.id !== this.currentUserId();
  }

  /** Блокировка/разблокировка выбранного пользователя. */
  protected async toggleBlock(user: AdminUser): Promise<void> {
    if (!this.canChangeBlock(user) || this.actionId() !== null) {
      return;
    }

    this.actionId.set(user.id);
    this.loader.show();
    try {
      const updated = await firstValueFrom(
        user.isBlocked
          ? this.adminService.unblock(user.id)
          : this.adminService.block(user.id),
      );
      this.users.update((list) =>
        list.map((item) => (item.id === updated.id ? updated : item)),
      );
      this.notifications.notifySuccess('Сохранено');
    } catch (error) {
      this.notifications.notifyError(toApiError(error).body.message);
    } finally {
      this.actionId.set(null);
      this.loader.hide();
    }
  }

  protected roleLabel(role: UserRole): string {
    return role === 'admin' ? 'Администратор' : 'Пользователь';
  }

  /** ISO-дата создания → привычная дата; некорректное значение — как есть. */
  protected createdAt(user: AdminUser): string {
    const date = new Date(user.createdAt);
    return Number.isNaN(date.getTime())
      ? user.createdAt
      : date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  }
}
