import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleComponent {
  readonly checked = input(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly toggled = output<boolean>();
}
