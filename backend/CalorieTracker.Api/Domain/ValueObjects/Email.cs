using CalorieTracker.Api.Domain.Common;

namespace CalorieTracker.Api.Domain.ValueObjects;

/// <summary>
/// Email пользователя. Хранит значение после trim (регистр сохраняется,
/// как в мок-слое), сравнение — без учёта регистра. Конструирование с
/// некорректным значением даёт 400 с ошибкой поля <c>email</c>.
/// </summary>
public sealed class Email : IEquatable<Email>
{
    public string Value { get; }

    private Email(string value) => Value = value;

    public static Email Create(string? value)
    {
        var errors = new ValidationErrors();
        errors.Add("email", DomainValidation.Email(value));
        errors.ThrowIfAny();
        return new Email(value!.Trim());
    }

    public bool Equals(Email? other) =>
        other is not null && string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);

    public override bool Equals(object? obj) => Equals(obj as Email);

    public override int GetHashCode() => StringComparer.OrdinalIgnoreCase.GetHashCode(Value);

    public override string ToString() => Value;
}
