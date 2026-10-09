import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="toggle-switch"
      [class.active]="checked"
      role="switch"
      [attr.aria-checked]="checked"
      (click)="onChange.emit(!checked)"
    ></button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    .toggle-switch {
      position: relative;
      width: 42px;
      height: 24px;
      padding: 0;
      border: 1px solid var(--border-color);
      border-radius: 999px;
      background: var(--bg-surface-secondary);
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease;
      outline: none;
    }
    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background: var(--bg-surface);
      border-radius: 50%;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.2);
      transition: transform 0.2s ease;
    }
    .toggle-switch.active {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
    }
    .toggle-switch.active::after {
      transform: translateX(18px);
      background: #ffffff;
    }
    .toggle-switch:focus-visible {
      box-shadow: 0 0 0 3px var(--accent-ring);
    }
  `]
})
export class ToggleComponent {
  @Input() checked = false;
  @Output() onChange = new EventEmitter<boolean>();
}
