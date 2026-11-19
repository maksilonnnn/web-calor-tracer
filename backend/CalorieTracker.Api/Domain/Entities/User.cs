using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Domain.Entities;

/// <summary>
/// Пользователь системы. Пароль хранится только в виде хеша PBKDF2 —
/// открытый пароль нигде не сохраняется. Идентификатор — Guid (в API
/// отдаётся строкой uuid).
/// </summary>
public sealed class User
{
    public Guid Id { get; }

    public PersonName Name { get; private set; }

    public Email Email { get; private set; }

    /// <summary>Хеш пароля (формат PBKDF2). Наружу никогда не отдаётся.</summary>
    public string PasswordHash { get; private set; }

    public DateTimeOffset CreatedAt { get; }

    /// <summary>Роль пользователя. Меняется только SQL-скриптом/сидом, не через API.</summary>
    public UserRole Role { get; private set; }

    /// <summary>Заблокирован ли аккаунт. Заблокированный не входит и теряет живую сессию.</summary>
    public bool IsBlocked { get; private set; }

    private User(
        Guid id,
        PersonName name,
        Email email,
        string passwordHash,
        DateTimeOffset createdAt,
        UserRole role,
        bool isBlocked)
    {
        Id = id;
        Name = name;
        Email = email;
        PasswordHash = passwordHash;
        CreatedAt = createdAt;
        Role = role;
        IsBlocked = isBlocked;
    }

    public static User Create(
        PersonName name,
        Email email,
        string passwordHash,
        Guid? id = null,
        DateTimeOffset? createdAt = null,
        UserRole role = UserRole.User,
        bool isBlocked = false) =>
        new(
            id ?? Guid.NewGuid(),
            name,
            email,
            passwordHash,
            createdAt ?? DateTimeOffset.UtcNow,
            role,
            isBlocked);

    /// <summary>Заблокировать аккаунт (идемпотентно).</summary>
    public void Block() => IsBlocked = true;

    /// <summary>Разблокировать аккаунт (идемпотентно).</summary>
    public void Unblock() => IsBlocked = false;

    /// <summary>Обновление профиля (имя и email уже провалидированы).</summary>
    public void UpdateProfile(PersonName name, Email email)
    {
        Name = name;
        Email = email;
    }

    /// <summary>Установка нового хеша пароля (после проверки текущего пароля).</summary>
    public void ChangePasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new ArgumentException("Хеш пароля не может быть пустым.", nameof(passwordHash));
        }

        PasswordHash = passwordHash;
    }
}
