import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
  booleanAttribute,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly type = input('text');
  readonly placeholder = input('');
  readonly error = input('');
  /** Единица измерения справа внутри поля: «г», «ккал» и т.д. */
  readonly unit = input('');
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Текущее значение контрола (для CVA — источник отображения поля). */
  protected readonly value = signal('');
  /** Состояние disabled из формы (setDisabledState) поверх input disabled. */
  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
