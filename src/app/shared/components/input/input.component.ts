import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="input-wrapper">
      @if (label) {
        <label class="input-label">{{ label }}</label>
      }
      <div class="field-wrap" [class.has-unit]="unit">
        <input
          class="field"
          [type]="type"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="disabled"
          [class.has-error]="error"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />
        @if (unit) {
          <span class="field-unit">{{ unit }}</span>
        }
      </div>
      @if (error) {
        <span class="input-error">{{ error }}</span>
      }
    </div>
  `,
  styles: [`
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .field-wrap {
      position: relative;
    }
    .field {
      width: 100%;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 12px;
      color: var(--text-primary);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease,
        background-color 0.25s ease;
    }
    .field:hover:not(:disabled) {
      border-color: var(--text-muted);
    }
    .field:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-ring);
    }
    .field:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .field::placeholder {
      color: var(--text-muted);
    }
    .field.has-error,
    .field.has-error:hover {
      border-color: var(--accent-red);
    }
    .field.has-error:focus {
      box-shadow: 0 0 0 3px var(--accent-red-soft);
    }
    .has-unit .field {
      padding-right: 44px;
    }
    .field-unit {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 13px;
      color: var(--text-secondary);
      pointer-events: none;
    }
    .input-error {
      font-size: 12px;
      color: var(--accent-red);
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() value = '';
  @Input() error = '';
  /** Единица измерения справа внутри поля: «г», «ккал» и т.д. */
  @Input() unit = '';
  @Input({ transform: (v: unknown) => Boolean(v) }) disabled = false;
  @Output() valueChange = new EventEmitter<string>();

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(target.value);
    this.onChange(target.value);
  }

  writeValue(value: string | null | undefined): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
