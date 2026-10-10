using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Служба каталога продуктов: постраничное чтение.</summary>
public interface IProductService
{
    /// <summary>Страница каталога, отсортированная по названию.</summary>
    PagedResult<Product> GetPaged(int? page, int? pageSize);
}

/// <inheritdoc cref="IProductService" />
public sealed class ProductService : IProductService
{
    private readonly IProductRepository _products;

    public ProductService(IProductRepository products)
    {
        _products = products;
    }

    public PagedResult<Product> GetPaged(int? page, int? pageSize) =>
        _products.GetPaged(Pagination.Create(page, pageSize));
}
