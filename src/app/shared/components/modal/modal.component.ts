import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';

const CLOSE_ANIMATION_MS = 180;

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (visible) {
      <div class="modal-overlay" [class.closing]="closing" (click)="handleOverlayClick()">
        <div
          class="dialog"
          [class.closing]="closing"
          [style.width]="width"
          role="dialog"
          [attr.aria-label]="title"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <div class="header-text">
              <h2 class="modal-title">{{ title }}</h2>
              @if (subtitle) {
                <p class="modal-subtitle">{{ subtitle }}</p>
              }
            </div>
            <button type="button" class="close-btn" aria-label="Закрыть" (click)="close.emit()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: var(--overlay-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
      padding: 24px;
      animation: overlayIn 0.18s ease;
    }
    .modal-overlay.closing {
      animation: overlayOut 0.18s ease forwards;
      pointer-events: none;
    }
    .dialog {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      box-shadow: var(--shadow-pop);
      padding: 28px;
      width: 100%;
      max-width: calc(100vw - 48px);
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      animation: dialogIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
    }
    .dialog.closing {
      animation: dialogOut 0.18s ease forwards;
    }

    /* Header */
    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .modal-title {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      margin: 0;
    }
    .modal-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 4px 0 0 0;
    }
    .close-btn {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      margin: -4px -4px 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .close-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    .close-btn:active {
      background: var(--bg-surface-secondary);
    }

    /* Анимации */
    @keyframes overlayIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes overlayOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes dialogIn {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes dialogOut {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(6px) scale(0.97);
      }
    }
  `]
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
