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
  templateUrl: './input.component.html',
  styleUrl: './input.component.css'
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
