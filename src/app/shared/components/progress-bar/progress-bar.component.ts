import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css'
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
