import { FormControl, FormGroup } from '@angular/forms';

import { ERROR_TEXTS } from './error-texts';
import {
  controlErrorTexts,
  emailFormat,
  firstErrorText,
  name,
  nonNegativeNumber,
  passwordMatch,
  passwordRules,
  positiveNumber,
  productName,
  requiredTrim,
  trimFormValues,
  validateValue,
} from './validators';

/** Ошибки контроля для значения. */
function errorsOf(control: FormControl): Record<string, boolean> | null {
  return control.errors as Record<string, boolean> | null;
}

describe('validators — правила клиентской валидации', () => {
  describe('requiredTrim', () => {
    it('пусто, пробелы и null невалидны', () => {
      expect(errorsOf(new FormControl('', { validators: requiredTrim() }))).toEqual({
        required: true,
      });
      expect(errorsOf(new FormControl('   ', { validators: requiredTrim() }))).toEqual({
        required: true,
      });
      expect(errorsOf(new FormControl(null, { validators: requiredTrim() }))).toEqual({
        required: true,
      });
    });

    it('значащее значение валидно', () => {
      expect(errorsOf(new FormControl('x', { validators: requiredTrim() }))).toBeNull();
    });
  });

  describe('passwordRules', () => {
    it('собирает все нарушенные правила одновременно', () => {
      const errors = errorsOf(new FormControl('abc', { validators: passwordRules() }));
      expect(errors).toEqual({
        'password.min': true,
        'password.digit': true,
        'password.special': true,
      });
    });

    it('сильный пароль проходит; пустой не проверяется', () => {
      expect(errorsOf(new FormControl('Demo1234!', { validators: passwordRules() }))).toBeNull();
      expect(errorsOf(new FormControl('', { validators: passwordRules() }))).toBeNull();
    });
  });

  describe('passwordMatch', () => {
    function group(password: string, confirm: string): FormGroup {
      const form = new FormGroup(
        { password: new FormControl(password), confirmPassword: new FormControl(confirm) },
        { validators: passwordMatch('password', 'confirmPassword') },
      );
      return form;
    }

    it('совпадение валидно, несовпадение — ошибка группы', () => {
      expect(group('abc', 'abc').errors).toBeNull();
      expect(group('abc', 'abd').hasError('password.mismatch')).toBeTrue();
    });

    it('пустой повтор не даёт mismatch', () => {
      expect(group('abc', '').errors).toBeNull();
    });
  });

  describe('emailFormat', () => {
    it('корректный email валиден', () => {
      expect(errorsOf(new FormControl('a@b.co', { validators: emailFormat() }))).toBeNull();
    });

    it('некорректный email помечается', () => {
      expect(errorsOf(new FormControl('не-почта', { validators: emailFormat() }))).toEqual({
        email: true,
      });
    });

    it('длинный email превышает лимит', () => {
      const long = `${'a'.repeat(250)}@ex.com`;
      expect(errorsOf(new FormControl(long, { validators: emailFormat() }))).toEqual({
        'email.length': true,
      });
    });

    it('пустой email не проверяется форматом', () => {
      expect(errorsOf(new FormControl('', { validators: emailFormat() }))).toBeNull();
    });
  });

  describe('boundedText-правила', () => {
    it('name: длиннее 100 символов — ошибка', () => {
      expect(errorsOf(new FormControl('И'.repeat(101), { validators: name() }))).toEqual({
        name: true,
      });
      expect(errorsOf(new FormControl('Иван', { validators: name() }))).toBeNull();
    });

    it('productName: длиннее 100 символов — ошибка', () => {
      expect(errorsOf(new FormControl('Я'.repeat(101), { validators: productName() }))).toEqual({
        'product.name': true,
      });
    });
  });

  describe('числовые правила', () => {
    it('positiveNumber: > 0 валидно, 0 и мусор — нет', () => {
      expect(errorsOf(new FormControl(5, { validators: positiveNumber() }))).toBeNull();
      expect(errorsOf(new FormControl('0', { validators: positiveNumber() }))).toEqual({
        'quantity.positive': true,
      });
      expect(errorsOf(new FormControl('abc', { validators: positiveNumber() }))).toEqual({
        'quantity.positive': true,
      });
      expect(errorsOf(new FormControl('', { validators: positiveNumber() }))).toBeNull();
    });

    it('nonNegativeNumber: 0 валидно, отрицательное — нет', () => {
      expect(errorsOf(new FormControl(0, { validators: nonNegativeNumber() }))).toBeNull();
      expect(errorsOf(new FormControl(-1, { validators: nonNegativeNumber() }))).toEqual({
        'nutrition.nonNegative': true,
      });
    });
  });

  describe('trimFormValues', () => {
    it('рекурсивно тримит строковые значения', () => {
      const form = new FormGroup({
        name: new FormControl('  Иван  '),
        nested: new FormGroup({ email: new FormControl('  a@b.co  ') }),
        count: new FormControl(5),
      });
      trimFormValues(form);
      expect(form.getRawValue()).toEqual({
        name: 'Иван',
        nested: { email: 'a@b.co' },
        count: 5,
      });
    });
  });

  describe('тексты ошибок', () => {
    it('firstErrorText возвращает первый известный текст', () => {
      expect(firstErrorText({ required: true })).toBe(ERROR_TEXTS.required);
      expect(firstErrorText(null)).toBeNull();
      expect(firstErrorText({ unknown: true })).toBeNull();
    });

    it('controlErrorTexts собирает все тексты словаря', () => {
      const control = new FormControl('abc', { validators: passwordRules() });
      expect(controlErrorTexts(control)).toEqual([
        ERROR_TEXTS['password.min'],
        ERROR_TEXTS['password.digit'],
        ERROR_TEXTS['password.special'],
      ]);
    });

    it('validateValue прогоняет значение через правила', () => {
      expect(validateValue('', [requiredTrim(), name()])).toEqual([ERROR_TEXTS.required]);
      expect(validateValue('Иван', [requiredTrim(), name()])).toEqual([]);
    });
  });
});
