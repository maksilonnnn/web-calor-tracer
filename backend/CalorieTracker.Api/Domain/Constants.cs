namespace CalorieTracker.Api.Domain;

/// <summary>
/// Тексты ошибок валидации. Дословно совпадают с клиентским словарём
/// shared/validation/error-texts.ts — сервер является источником истины,
/// а клиент использует те же формулировки для UX.
/// </summary>
public static class ValidationTexts
{
    public const string Required = "Заполните поле";
    public const string PasswordMin = "Пароль должен содержать не менее 8 символов";
    public const string PasswordDigit = "Пароль должен содержать хотя бы одну цифру";
    public const string PasswordLetter = "Пароль должен содержать хотя бы одну букву";
    public const string PasswordSpecial = "Пароль должен содержать хотя бы один специальный знак";
    public const string PasswordMismatch = "Пароли не совпадают";
    public const string PasswordCommon = "Пароль слишком простой";
    public const string EmailFormat = "Введите корректный email";
    public const string EmailLength = "Email — не более 254 символов";
    public const string LoginLength = "Логин — от 1 до 100 символов";
    public const string LoginCharset =
        "Логин может содержать только латинские буквы, цифры, точку, дефис и подчёркивание";
    public const string NameLength = "Имя — от 1 до 100 символов";
    public const string ProductNameLength = "Название — от 1 до 100 символов";
    public const string QuantityPositive = "Количество должно быть больше 0";
    public const string NutritionNonNegative = "Значение не может быть отрицательным";

    /// <summary>Общий текст 400 с ошибками по полям.</summary>
    public const string InvalidForm = "Данные заполнены неверно";

    // Дополнительные серверные ограничения (верхние границы чисел).
    public const string QuantityTooLarge = "Количество слишком велико";
    public const string NutritionTooLarge = "Значение слишком велико";
}

/// <summary>
/// Тексты отказов «бэкенда», не привязанные к одному полю. Совпадают с
/// MOCK_MESSAGES мок-слоя — пользователь видит их дословно.
/// </summary>
public static class Messages
{
    public const string Unauthorized = "Не авторизован";
    public const string Forbidden = "Доступ запрещён";
    public const string LoginTaken = "Пользователь с таким логином уже существует";
    public const string EmailTaken = "Пользователь с таким email уже существует";
    public const string WrongCredentials = "Неверный логин или пароль";
    public const string AccountBlocked = "Аккаунт заблокирован";
    public const string UserNotFound = "Пользователь не найден";
    public const string CannotChangeOwnBlock = "Нельзя изменить блокировку собственного аккаунта";
    public const string CannotChangeAdminBlock = "Нельзя изменить блокировку администратора";
    public const string WrongCurrentPassword = "Неверный текущий пароль";
    public const string NotFound = "Запись не найдена";
    public const string InvalidDate = "Некорректная дата";
    public const string InvalidId = "Некорректный идентификатор";
    public const string InvalidPagination = "Некорректные параметры пагинации";
    public const string InternalError = "Внутренняя ошибка сервера";
}
