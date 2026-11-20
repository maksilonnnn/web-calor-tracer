using CalorieTracker.Api.Domain.Common;

namespace CalorieTracker.Api.Domain.ValueObjects;

/// <summary>
/// Логин пользователя — уникальный идентификатор для входа (как в эталонном
/// приложении преподавателя). Хранит значение после trim, сравнение — без
/// учёта регистра. Конструирование с некорректным значением даёт 400 с
/// ошибкой поля <c>login</c>. Логин не меняется после регистрации.
/// </summary>
public sealed class Login : IEquatable<Login>
{
    public string Value { get; }

    private Login(string value) => Value = value;

    public static Login Create(string? value)
    {
        var errors = new ValidationErrors();
        errors.Add("login", DomainValidation.Login(value));
        errors.ThrowIfAny();
        return new Login(value!.Trim());
    }

    public bool Equals(Login? other) =>
        other is not null && string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);

    public override bool Equals(object? obj) => Equals(obj as Login);

    public override int GetHashCode() => StringComparer.OrdinalIgnoreCase.GetHashCode(Value);

    public override string ToString() => Value;
}
