/**
 * Иконка-спиннер «кольцо» на чистом CSS: размеры sm/md/lg, доступный
 * aria-label. Внутри кнопок кольцо рисуется текущим цветом текста
 * (currentColor), вне них — акцентным цветом темы.
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Размеры спиннера: sm — 16px, md — 28px, lg — 44px. */
export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  /** Размер кольца. */
  readonly size = input<SpinnerSize>('md');

  /** Доступный текст индикатора. */
  readonly label = input('Загрузка');
}