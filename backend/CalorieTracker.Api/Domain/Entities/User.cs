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

    private User(
        Guid id,
        PersonName name,
        Email email,
        string passwordHash,
        DateTimeOffset createdAt)
    {
        Id = id;
        Name = name;
        Email = email;
        PasswordHash = passwordHash;
        CreatedAt = createdAt;
    }

    public static User Create(
        PersonName name,
        Email email,
        string passwordHash,
        Guid? id = null,
        DateTimeOffset? createdAt = null) =>
        new(id ?? Guid.NewGuid(), name, email, passwordHash, createdAt ?? DateTimeOffset.UtcNow);

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
