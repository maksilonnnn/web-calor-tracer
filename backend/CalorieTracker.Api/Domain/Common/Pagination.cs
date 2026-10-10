using CalorieTracker.Api.Domain.Exceptions;

namespace CalorieTracker.Api.Domain.Common;

/// <summary>
/// Параметры пагинации: страница ≥ 1, размер страницы по умолчанию 20,
/// максимум 100. Некорректные значения дают 400 «Некорректные параметры
/// пагинации». Логика Skip/Take выполняется в репозитории.
/// </summary>
public sealed class Pagination
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public int Page { get; }

    public int PageSize { get; }

    private Pagination(int page, int pageSize)
    {
        Page = page;
        PageSize = pageSize;
    }

    /// <summary>Первый элемент страницы (0-based) для Skip.</summary>
    public int Skip => (Page - 1) * PageSize;

    /// <summary>
    /// Нормализует входные параметры: page = null → 1, pageSize = null → 20.
    /// Выход за границы → 400.
    /// </summary>
    public static Pagination Create(int? page, int? pageSize)
    {
        var resolvedPage = page ?? 1;
        var resolvedPageSize = pageSize ?? DefaultPageSize;

        if (resolvedPage < 1 || resolvedPageSize < 1 || resolvedPageSize > MaxPageSize)
        {
            throw new DomainValidationException(Messages.InvalidPagination);
        }

        return new Pagination(resolvedPage, resolvedPageSize);
    }
}
