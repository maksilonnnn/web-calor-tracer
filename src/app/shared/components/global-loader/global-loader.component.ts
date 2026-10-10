/**
 * Оверлей глобальной загрузки: полупрозрачный фон поверх всего приложения
 * и крупный спиннер. Управляется GlobalLoaderService (guards и выход) —
 * показывается только для длительных операций, чтобы не мигать.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { GlobalLoaderService } from '../../../core/services/global-loader.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-global-loader',
  imports: [SpinnerComponent],
  templateUrl: './global-loader.component.html',
  styleUrl: './global-loader.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalLoaderComponent {
  private readonly loader = inject(GlobalLoaderService);

  protected readonly visible = this.loader.visible;
}