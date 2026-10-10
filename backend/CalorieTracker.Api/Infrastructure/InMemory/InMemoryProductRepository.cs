using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <inheritdoc cref="IProductRepository" />
public sealed class InMemoryProductRepository : IProductRepository
{
    private readonly InMemoryDatabase _db;

    public InMemoryProductRepository(InMemoryDatabase db) => _db = db;

    public Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Products.Count);
        }
    }

    public Task<Product?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Products.GetValueOrDefault(id));
        }
    }

    public Task<PagedResult<Product>> GetPagedAsync(
        Pagination pagination,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(pagination);
        cancellationToken.ThrowIfCancellationRequested();

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

            return Task.FromResult(
                new PagedResult<Product>(items, pagination.Page, pagination.PageSize, ordered.Count));
        }
    }

    public Task AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            _db.Products[product.Id] = product;
        }

        return Task.CompletedTask;
    }
}
