namespace CalorieTracker.Api.Domain.Common;

/// <summary>
/// Страница выборки для «данных пачками». Форма ответа совпадает с
/// PagedResult фронтенда: { items, page, pageSize, totalCount, totalPages }.
/// </summary>
public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }

    public int Page { get; }

    public int PageSize { get; }

    public int TotalCount { get; }

    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);

    public PagedResult(IReadOnlyList<T> items, int page, int pageSize, int totalCount)
    {
        Items = items;
        Page = page;
        PageSize = pageSize;
        TotalCount = totalCount;
    }
}
