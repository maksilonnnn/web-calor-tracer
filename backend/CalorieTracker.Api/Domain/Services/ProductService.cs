using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Служба каталога продуктов: постраничное чтение.</summary>
public interface IProductService
{
    /// <summary>Страница каталога, отсортированная по названию.</summary>
    Task<PagedResult<Product>> GetPagedAsync(
        int? page,
        int? pageSize,
        CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IProductService" />
public sealed class ProductService : IProductService
{
    private readonly IProductRepository _products;

    public ProductService(IProductRepository products)
    {
        _products = products;
    }

    public Task<PagedResult<Product>> GetPagedAsync(
        int? page,
        int? pageSize,
        CancellationToken cancellationToken = default) =>
        _products.GetPagedAsync(Pagination.Create(page, pageSize), cancellationToken);
}
