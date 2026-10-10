using System.Globalization;
using CalorieTracker.Api.Domain.Exceptions;

namespace CalorieTracker.Api.Domain.Common;

/// <summary>
/// Разбор контрактной даты 'YYYY-MM-DD' (локальная дата, без UTC-сдвига).
/// Некорректная строка даёт 400 «Некорректная дата».
/// </summary>
public static class DateParser
{
    public const string Format = "yyyy-MM-dd";

    public static DateOnly Parse(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || !DateOnly.TryParseExact(
                value.Trim(),
                Format,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var date))
        {
            throw new DomainValidationException(Messages.InvalidDate);
        }

        return date;
    }

    /// <summary>Форматирует дату обратно в 'YYYY-MM-DD'.</summary>
    public static string FormatDate(DateOnly date) => date.ToString(Format, CultureInfo.InvariantCulture);

    /// <summary>Сегодняшняя локальная дата.</summary>
    public static DateOnly Today() => DateOnly.FromDateTime(DateTime.Now);
}
