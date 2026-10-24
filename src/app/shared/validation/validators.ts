/**
 * Валидаторы реактивных форм — единый набор правил клиентской валидации
 * для всех форм приложения (регистрация, вход, настройки, добавление еды).
 *
 * Каждый валидатор возвращает ValidationErrors с ключами словаря
 * ERROR_TEXTS (shared/validation/error-texts.ts) — тексты ошибок полей
 * читаются из словаря и только из него. Те же правила продублированы в
 * мок-слое: обработчики импортируют этот файл как источник границ и словаря,
 * поэтому клиент и «бэкенд» валидируют одинаково.
 *
 * Принципы:
 *  - строковые правила проверяют значение после trim; обязательность —
 *    отдельный валидатор requiredTrim (форматный валидатор на пустом
 *    значении возвращает null, чтобы пустое обязательное поле показывало
 *    «Заполните поле», а не текст формата);
 *  - к моку уходят триммированные значения: перед построением DTO компонент
 *    вызывает trimFormValues(form);
 *  - пароли в правилах не триммятся и сравниваются дословно: пробел —
 *    легальный спецзнак.
 */
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { ERROR_TEXTS, FieldErrorKey } from './error-texts';

/** Ошибки одного поля: подмножество ключей словаря ERROR_TEXTS. */
export type FieldErrors = Partial<Record<FieldErrorKey, boolean>>;

/** Минимальная длина пароля. */
const PASSWORD_MIN_LENGTH = 8;
/** Максимальная длина email (включительно). */
const EMAIL_MAX_LENGTH = 254;
/** Максимальная длина имени пользователя (включительно). */
const NAME_MAX_LENGTH = 100;
/** Максимальная длина названия продукта (включительно). */
const PRODUCT_NAME_MAX_LENGTH = 100;

/** Цифра — ASCII 0–9. */
const DIGIT_PATTERN = /\d/;
/** Буква любого алфавита (латиница, кириллица, …) — \p{L}. */
const LETTER_PATTERN = /\p{L}/u;
/** Спецзнак — любой символ, не являющийся буквой или цифрой. */
const SPECIAL_CHAR_PATTERN = /[^\p{L}\d]/u;
/**
 * Email вида логин@домен.зона: без пробелов, «@» ровно одна, домен —
 * непустые метки через точку, зона после последней точки непустая.
 */
const EMAIL_PATTERN = /^[^\s@]+@([^\s@.]+\.)+[^\s@.]+$/;

/** Собирает ошибки поля из кодов словаря; пустой перечень — ошибок нет. */
function packErrors(keys: readonly FieldErrorKey[]): FieldErrors | null {
  return keys.length === 0
    ? null
    : (Object.fromEntries(keys.map((key) => [key, true])) as FieldErrors);
}

/** Строковое значение контроля либо null (отсутствует/нестроковое). */
function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Пустое ли значение: нет значения либо строка из одних пробелов. */
function isEmptyInput(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Числовое значение контроля (строка тримится, число берётся как есть)
 * либо null — если значение не является конечным числом.
 */
function numberValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Обязательность с тримом: null/undefined, пустая строка и строка из одних
 * пробелов → ошибка `required`; любое значащее значение валидно. Ключ
 * совпадает с ключом required встроенных валидаторов Angular — один текст
 * «Заполните поле».
 */
export function requiredTrim(): ValidatorFn {
  return (control: AbstractControl): FieldErrors | null => {
    return isEmptyInput(control.value) ? { required: true } : null;
  };
}

/**
 * Правила пароля: >= 8 символов, >= 1 цифра, >= 1 буква, >= 1 спецзнак
 * (любой символ, не буква и не цифра — пробел подходит). Возвращает ВСЕ
 * нарушенные правила одновременно. Пустое значение не проверяется —
 * обязательность задаёт requiredTrim. Пароль не триммится.
 */
export function passwordRules(): ValidatorFn {
  return (control: AbstractControl): FieldErrors | null => {
    const value = asString(control.value);
    if (value === null || value === '') {
      return null;
    }
    const violated: FieldErrorKey[] = [];
    if (value.length < PASSWORD_MIN_LENGTH) {
      violated.push('password.min');
    }
    if (!DIGIT_PATTERN.test(value)) {
      violated.push('password.digit');
    }
    if (!LETTER_PATTERN.test(value)) {
      violated.push('password.letter');
    }
    if (!SPECIAL_CHAR_PATTERN.test(value)) {
      violated.push('password.special');
    }
    return packErrors(violated);
  };
}

/**
 * Совпадение пароля и повтора — валидатор на всю FormGroup: ошибки
 * доступаются как form.hasError('password.mismatch') и показываются у поля
 * повтора. Пустой повтор не даёт mismatch (его ошибку показывает
 * requiredTrim); сравнение дословное, без трима.
 */
export function passwordMatch(
  passwordControlName: string,
  repeatControlName: string,
): ValidatorFn {
  return (group: AbstractControl): FieldErrors | null => {
    const password = group.get(passwordControlName);
    const repeat = group.get(repeatControlName);
    if (password === null || repeat === null || isEmptyInput(repeat.value)) {
      return null;
    }
    return password.value === repeat.value ? null : { 'password.mismatch': true };
  };
}

/** Email: формат логин@домен.зона и длина 1–254 символа после трима. */
export function emailFormat(): ValidatorFn {
  return (control: AbstractControl): FieldErrors | null => {
    const raw = asString(control.value);
    if (raw === null || raw.trim() === '') {
      return null;
    }
    const email = raw.trim();
    if (!EMAIL_PATTERN.test(email)) {
      return { email: true };
    }
    if (email.length > EMAIL_MAX_LENGTH) {
      return { 'email.length': true };
    }
    return null;
  };
}

/** Строковое поле с верхней границей длины по триммированному значению. */
function boundedText(errorKey: FieldErrorKey, maxLength: number): ValidatorFn {
  return (control: AbstractControl): FieldErrors | null => {
    const raw = asString(control.value);
    if (raw === null || raw.trim() === '') {
      return null;
    }
    return raw.trim().length > maxLength ? packErrors([errorKey]) : null;
  };
}

/** Имя пользователя: 1–100 символов после трима. */
export function name(): ValidatorFn {
  return boundedText('name', NAME_MAX_LENGTH);
}

/** Название продукта: 1–100 символов после трима. */
export function productName(): ValidatorFn {
  return boundedText('product.name', PRODUCT_NAME_MAX_LENGTH);
}

/** Количество: строго больше нуля (число либо строка с числом). */
export function positiveNumber(): ValidatorFn {
  return (control: AbstractControl): FieldErrors | null => {
    if (isEmptyInput(control.value)) {
      return null;
    }
    const parsed = numberValue(control.value);
    return parsed !== null && parsed > 0 ? null : { 'quantity.positive': true };
  };
}

/** Питательное значение: не отрицательное (число либо строка с числом). */
export function nonNegativeNumber(): ValidatorFn {
  return (control: AbstractControl): FieldErrors | null => {
    if (isEmptyInput(control.value)) {
      return null;
    }
    const parsed = numberValue(control.value);
    return parsed !== null && parsed >= 0 ? null : { 'nutrition.nonNegative': true };
  };
}

/**
 * Нормализация формы перед отправкой: рекурсивно триммит строковые значения
 * всех контролов. Вызывается компонентом в обработчике отправки ДО
 * построения DTO и вызова сервиса (после успешной клиентской валидации).
 * setValue с emitEvent: false — нормализация не порождает valueChanges.
 */
export function trimFormValues(form: AbstractControl): void {
  if (form instanceof FormGroup || form instanceof FormArray) {
    for (const child of Object.values(form.controls)) {
      trimFormValues(child);
    }
    return;
  }
  const value = form.value;
  if (typeof value === 'string' && value.trim() !== value) {
    form.setValue(value.trim(), { emitEvent: false });
  }
}

/**
 * Текст первой ошибки контроля из словаря ERROR_TEXTS (единственный
 * источник текстов полей): проход по ключам errors, первый ключ словаря
 * даёт текст, чужие ключи пропускаются. null → текст не показывается.
 */
export function firstErrorText(errors: ValidationErrors | null): string | null {
  if (errors === null) {
    return null;
  }
  for (const key of Object.keys(errors)) {
    const dictionary = ERROR_TEXTS as Record<string, string>;
    if (key in dictionary) {
      return dictionary[key];
    }
  }
  return null;
}

/** Все тексты ошибок контроля из словаря ERROR_TEXTS (в порядке ключей). */
export function controlErrorTexts(control: AbstractControl): string[] {
  const errors = control.errors;
  if (errors === null) {
    return [];
  }
  const dictionary = ERROR_TEXTS as Record<string, string>;
  const texts: string[] = [];
  for (const key of Object.keys(errors)) {
    const text = dictionary[key];
    if (text !== undefined) {
      texts.push(text);
    }
  }
  return texts;
}

/**
 * Прогоняет значение через набор валидаторов и возвращает тексты ошибок из
 * словаря. Используется мок-обработчиками: клиент и «бэкенд» валидируют
 * одним набором правил и одним словарём.
 */
export function validateValue(value: unknown, rules: readonly ValidatorFn[]): string[] {
  return controlErrorTexts(new FormControl(value, { validators: [...rules] }));
}
