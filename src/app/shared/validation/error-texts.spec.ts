import { ERROR_TEXTS, INVALID_FORM_MESSAGE } from './error-texts';

describe('error-texts — словарь текстов ошибок', () => {
  it('содержит тексты обязательности и форматов', () => {
    expect(ERROR_TEXTS.required).toBe('Заполните поле');
    expect(ERROR_TEXTS.email).toBe('Введите корректный email');
    expect(ERROR_TEXTS['name']).toBe('Имя — от 1 до 100 символов');
    expect(ERROR_TEXTS['product.name']).toBe('Название — от 1 до 100 символов');
    expect(ERROR_TEXTS['quantity.positive']).toBe('Количество должно быть больше 0');
    expect(ERROR_TEXTS['nutrition.nonNegative']).toBe('Значение не может быть отрицательным');
  });

  it('содержит все правила пароля', () => {
    expect(ERROR_TEXTS['password.min']).toBeTruthy();
    expect(ERROR_TEXTS['password.digit']).toBeTruthy();
    expect(ERROR_TEXTS['password.letter']).toBeTruthy();
    expect(ERROR_TEXTS['password.special']).toBeTruthy();
    expect(ERROR_TEXTS['password.mismatch']).toBe('Пароли не совпадают');
  });

  it('текст невалидной формы — единый', () => {
    expect(INVALID_FORM_MESSAGE).toBe('Данные заполнены неверно');
  });
});
