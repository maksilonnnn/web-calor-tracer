using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <inheritdoc cref="IProductRepository" />
public sealed class InMemoryProductRepository : IProductRepository
{
    private readonly InMemoryDatabase _db;

    public InMemoryProductRepository(InMemoryDatabase db) => _db = db;

    public int Count
    {
        get
        {
            lock (_db.SyncRoot)
            {
                return _db.Products.Count;
            }
        }
    }

    public Product? FindById(Guid id)
    {
        lock (_db.SyncRoot)
        {
            return _db.Products.GetValueOrDefault(id);
        }
    }

    public PagedResult<Product> GetPaged(Pagination pagination)
    {
        ArgumentNullException.ThrowIfNull(pagination);

        lock (_db.SyncRoot)
        {
            // Пагинация (Skip/Take) выполняется здесь, в репозитории, а не в контроллере.
            var ordered = _db.Products.Values
                .OrderBy(product => product.Name.Value, StringComparer.OrdinalIgnoreCase)
                .ThenBy(product => product.Id)
                .ToList();

            var items = ordered
                .Skip(pagination.Skip)
                .Take(pagination.PageSize)
                .ToList();

            return new PagedResult<Product>(items, pagination.Page, pagination.PageSize, ordered.Count);
        }
    }

    public void Add(Product product)
    {
        lock (_db.SyncRoot)
        {
            _db.Products[product.Id] = product;
        }
    }
}
