using System.Text.RegularExpressions;

namespace CalorieTracker.Api.Domain;

/// <summary>
/// Правила валидации, перенесённые из shared/validation/validators.ts.
/// Каждый метод возвращает список текстов нарушенных правил (пусто — валидно).
/// Порядок текстов совпадает с порядком валидаторов на клиенте.
/// </summary>
public static partial class DomainValidation
{
    public const int PasswordMinLength = 8;
    public const int EmailMaxLength = 254;
    public const int NameMaxLength = 100;
    public const int ProductNameMaxLength = 100;

    /// <summary>Верхняя граница количества, граммы.</summary>
    public const double MaxQuantityGrams = 100_000;

    /// <summary>Верхняя граница питательного значения на 100 г.</summary>
    public const double MaxNutrientPer100g = 10_000;

    public static bool IsBlank(string? value) => string.IsNullOrWhiteSpace(value);

    /// <summary>Имя: обязательность и не более 100 символов (после trim).</summary>
    public static IReadOnlyList<string> Name(string? value)
    {
        if (IsBlank(value))
        {
            return new[] { ValidationTexts.Required };
        }

        return value!.Trim().Length > NameMaxLength
            ? new[] { ValidationTexts.NameLength }
            : Array.Empty<string>();
    }

    /// <summary>Email: формат логин@домен.зона и длина 1–254 после trim.</summary>
    public static IReadOnlyList<string> Email(string? value)
    {
        if (IsBlank(value))
        {
            return new[] { ValidationTexts.Required };
        }

        var email = value!.Trim();
        if (!EmailPattern().IsMatch(email))
        {
            return new[] { ValidationTexts.EmailFormat };
        }

        return email.Length > EmailMaxLength
            ? new[] { ValidationTexts.EmailLength }
            : Array.Empty<string>();
    }

    /// <summary>Пароль: ≥ 8 символов, цифра, буква, спецзнак. Возвращает все нарушения.</summary>
    public static IReadOnlyList<string> Password(string? value)
    {
        if (value is null || value.Length == 0)
        {
            return new[] { ValidationTexts.Required };
        }

        var errors = new List<string>(4);
        if (value.Length < PasswordMinLength)
        {
            errors.Add(ValidationTexts.PasswordMin);
        }

        if (!value.Any(IsAsciiDigit))
        {
            errors.Add(ValidationTexts.PasswordDigit);
        }

        if (!value.Any(char.IsLetter))
        {
            errors.Add(ValidationTexts.PasswordLetter);
        }

        if (value.All(char.IsLetterOrDigit))
        {
            errors.Add(ValidationTexts.PasswordSpecial);
        }

        return errors;
    }

    /// <summary>Повтор пароля: обязательность + совпадение (дословно, без trim).</summary>
    public static IReadOnlyList<string> ConfirmPassword(string? confirm, string? password)
    {
        var value = confirm ?? string.Empty;
        var errors = new List<string>(2);
        if (IsBlank(value))
        {
            errors.Add(ValidationTexts.Required);
        }

        if (value.Length > 0 && !string.Equals(value, password, StringComparison.Ordinal))
        {
            errors.Add(ValidationTexts.PasswordMismatch);
        }

        return errors;
    }

    /// <summary>Название продукта: обязательность и не более 100 символов (после trim).</summary>
    public static IReadOnlyList<string> ProductName(string? value)
    {
        if (IsBlank(value))
        {
            return new[] { ValidationTexts.Required };
        }

        return value!.Trim().Length > ProductNameMaxLength
            ? new[] { ValidationTexts.ProductNameLength }
            : Array.Empty<string>();
    }

    /// <summary>Количество в граммах: строго больше нуля и не выше верхней границы.</summary>
    public static IReadOnlyList<string> Quantity(double value)
    {
        if (!double.IsFinite(value) || value <= 0)
        {
            return new[] { ValidationTexts.QuantityPositive };
        }

        return value > MaxQuantityGrams
            ? new[] { ValidationTexts.QuantityTooLarge }
            : Array.Empty<string>();
    }

    /// <summary>Питательное значение на 100 г: не отрицательное и в разумных границах.</summary>
    public static IReadOnlyList<string> NonNegative(double value)
    {
        if (!double.IsFinite(value) || value < 0)
        {
            return new[] { ValidationTexts.NutritionNonNegative };
        }

        return value > MaxNutrientPer100g
            ? new[] { ValidationTexts.NutritionTooLarge }
            : Array.Empty<string>();
    }

    /// <summary>
    /// Питательное значение вычисленной порции или итога дня: проверяется
    /// только неотрицательность и конечность. Верхняя граница «на 100 г»
    /// (<see cref="MaxNutrientPer100g"/>) к вычисленным значениям не
    /// применяется — порция или итог законно превышают её.
    /// </summary>
    public static IReadOnlyList<string> NonNegativeTotal(double value)
    {
        return !double.IsFinite(value) || value < 0
            ? new[] { ValidationTexts.NutritionNonNegative }
            : Array.Empty<string>();
    }

    private static bool IsAsciiDigit(char value) => value is >= '0' and <= '9';

    [GeneratedRegex(@"^[^\s@]+@([^\s@.]+\.)+[^\s@.]+$")]
    private static partial Regex EmailPattern();
}
