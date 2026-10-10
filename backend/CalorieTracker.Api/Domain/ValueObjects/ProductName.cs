using CalorieTracker.Api.Domain.Common;

namespace CalorieTracker.Api.Domain.ValueObjects;

/// <summary>
/// Название продукта: 1–100 символов после trim. Некорректное значение даёт
/// 400 с ошибкой поля <c>name</c> (поле формы добавления еды).
/// </summary>
public sealed class ProductName : IEquatable<ProductName>
{
    public string Value { get; }

    private ProductName(string value) => Value = value;

    public static ProductName Create(string? value)
    {
        var errors = new ValidationErrors();
        errors.Add("name", DomainValidation.ProductName(value));
        errors.ThrowIfAny();
        return new ProductName(value!.Trim());
    }

    public bool Equals(ProductName? other) =>
        other is not null && string.Equals(Value, other.Value, StringComparison.Ordinal);

    public override bool Equals(object? obj) => Equals(obj as ProductName);

    public override int GetHashCode() => Value.GetHashCode(StringComparison.Ordinal);

    public override string ToString() => Value;
}
