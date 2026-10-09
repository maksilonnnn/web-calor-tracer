import { ChangeDetectionStrategy, Component, computed, input, booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  readonly value = input(0);
  readonly max = input(100);
  readonly color = input('#3b82f6');
  readonly label = input('');
  readonly showPercentage = input(true, { transform: booleanAttribute });

  protected readonly percentage = computed(() => {
    const max = this.max();
    if (max === 0) {
      return 0;
    }
    return Math.min(Math.round((this.value() / max) * 100), 100);
  });
}
