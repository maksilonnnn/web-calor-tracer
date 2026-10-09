import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    @if (label || showPercentage) {
      <div class="progress-header">
        <span class="progress-label">{{ label }}</span>
        @if (showPercentage) {
          <span class="progress-value">{{ percentage }}%</span>
        }
      </div>
    }
    <div class="progress-track">
      <div class="progress-fill" [style.width.%]="percentage" [style.background-color]="color"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .progress-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }
    .progress-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .progress-track {
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-color);
      border-radius: 999px;
      overflow: hidden;
      height: 8px;
    }
    .progress-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.5s ease;
    }
  `]
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() max = 100;
  @Input() color = '#3b82f6';
  @Input() label = '';
  @Input({ transform: (v: unknown) => Boolean(v) }) showPercentage = true;

  get percentage(): number {
    if (this.max === 0) return 0;
    return Math.min(Math.round((this.value / this.max) * 100), 100);
  }
}
