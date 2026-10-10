using CalorieTracker.Api.Domain.Common;

namespace CalorieTracker.Api.Domain.ValueObjects;

/// <summary>
/// Количество в граммах: строго больше нуля и не выше верхней границы.
/// Некорректное значение даёт 400 с ошибкой поля <c>quantity</c>.
/// </summary>
public sealed class GramAmount : IEquatable<GramAmount>
{
    public double Value { get; }

    private GramAmount(double value) => Value = value;

    public static GramAmount Create(double value)
    {
        var errors = new ValidationErrors();
        errors.Add("quantity", DomainValidation.Quantity(value));
        errors.ThrowIfAny();
        return new GramAmount(value);
    }

    public bool Equals(GramAmount? other) => other is not null && Value.Equals(other.Value);

    public override bool Equals(object? obj) => Equals(obj as GramAmount);

    public override int GetHashCode() => Value.GetHashCode();

    public override string ToString() => Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
}
