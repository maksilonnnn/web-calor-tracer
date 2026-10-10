using CalorieTracker.Api.Domain.Entities;

namespace CalorieTracker.Api.Domain.Security;

/// <summary>
/// Хеширование и проверка пароля. Реализация в инфраструктуре — PBKDF2-SHA256,
/// 210 000 итераций, случайная соль, сравнение за постоянное время.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>Возвращает строковое представление хеша (соль + параметры + хеш).</summary>
    string Hash(string password);

    /// <summary>Проверяет пароль против сохранённого хеша за постоянное время.</summary>
    bool Verify(string password, string passwordHash);
}

/// <summary>Выпуск JWT для аутентифицированного пользователя.</summary>
public interface ITokenService
{
    /// <summary>Создаёт подписанный JWT с идентификатором и данными пользователя.</summary>
    IssuedToken CreateToken(User user);
}

/// <summary>Выпущенный токен и время его истечения.</summary>
public sealed class IssuedToken
{
    public string Token { get; init; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; init; }
}
