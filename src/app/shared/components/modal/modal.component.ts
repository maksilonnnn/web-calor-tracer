import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

/** Длительность анимации закрытия, мс. */
const CLOSE_ANIMATION_MS = 180;

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnDestroy {
  readonly isOpen = input(false);
  readonly title = input('');
  readonly subtitle = input('');
  /** CSS-ширина диалога, например '420px' или '580px'. */
  readonly width = input('420px');
  readonly close = output<void>();

  protected readonly visible = signal(false);
  protected readonly closing = signal(false);

  private wasOpen = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.clearTimer();
        this.wasOpen = true;
        this.visible.set(true);
        this.closing.set(false);
      } else if (this.wasOpen) {
        this.wasOpen = false;
        this.closing.set(true);
        this.timer = setTimeout(() => {
          this.visible.set(false);
          this.closing.set(false);
          this.timer = null;
        }, CLOSE_ANIMATION_MS);
      }
    });
  }

  protected handleOverlayClick(): void {
    if (!this.closing()) {
      this.close.emit();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
