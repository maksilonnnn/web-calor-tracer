import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-button',
  imports: [SpinnerComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** true — кнопка «занята»: блокируется и показывает спиннер слева от текста. */
  readonly loading = input(false, { transform: booleanAttribute });
}
