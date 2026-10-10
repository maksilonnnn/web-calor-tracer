using CalorieTracker.Api.Domain.Common;

namespace CalorieTracker.Api.Domain.ValueObjects;

/// <summary>
/// Имя пользователя: 1–100 символов после trim. Некорректное значение даёт
/// 400 с ошибкой поля <c>name</c>.
/// </summary>
public sealed class PersonName : IEquatable<PersonName>
{
    public string Value { get; }

    private PersonName(string value) => Value = value;

    public static PersonName Create(string? value)
    {
        var errors = new ValidationErrors();
        errors.Add("name", DomainValidation.Name(value));
        errors.ThrowIfAny();
        return new PersonName(value!.Trim());
    }

    public bool Equals(PersonName? other) =>
        other is not null && string.Equals(Value, other.Value, StringComparison.Ordinal);

    public override bool Equals(object? obj) => Equals(obj as PersonName);

    public override int GetHashCode() => Value.GetHashCode(StringComparison.Ordinal);

    public override string ToString() => Value;
}
