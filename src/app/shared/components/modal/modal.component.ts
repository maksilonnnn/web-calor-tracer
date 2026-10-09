import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';

const CLOSE_ANIMATION_MS = 180;

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent implements OnDestroy {
  @Input() title = '';
  @Input() subtitle = '';
  /** CSS-ширина диалога, например '420px' или '580px' */
  @Input() width = '420px';
  @Output() close = new EventEmitter<void>();

  visible = false;
  closing = false;

  private open = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  @Input()
  set isOpen(value: boolean) {
    if (value) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.open = true;
      this.visible = true;
      this.closing = false;
    } else if (this.open) {
      this.open = false;
      this.closing = true;
      this.timer = setTimeout(() => {
        this.visible = false;
        this.closing = false;
        this.timer = null;
      }, CLOSE_ANIMATION_MS);
    }
  }

  get isOpen(): boolean {
    return this.open;
  }

  handleOverlayClick(): void {
    if (!this.closing) {
      this.close.emit();
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}
