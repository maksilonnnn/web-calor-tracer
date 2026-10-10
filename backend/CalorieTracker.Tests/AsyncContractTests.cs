using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Infrastructure.InMemory;
using CalorieTracker.Api.Presentation.Controllers;

namespace CalorieTracker.Tests;

/// <summary>
/// Асинхронный контракт: CancellationToken пробрасывается из контроллера
/// в репозиторий, а отменённый токен превращается в OperationCanceledException.
/// </summary>
public sealed class AsyncContractTests
{
    private static CancellationToken CanceledToken()
    {
        var cts = new CancellationTokenSource();
        cts.Cancel();
        return cts.Token;
    }

    [Fact]
    public async Task Repository_WithCanceledToken_ThrowsOperationCanceled()
    {
        var database = new InMemoryDatabase();
        var repository = new InMemoryUserRepository(database);

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => repository.FindByIdAsync(Guid.NewGuid(), CanceledToken()));
    }

    [Fact]
    public async Task Service_WithCanceledToken_PropagatesOperationCanceled()
    {
        var repository = new CapturingProductRepository();
        var service = new ProductService(repository);

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => service.GetPagedAsync(null, null, CanceledToken()));
    }

    [Fact]
    public async Task Controller_PassesCancellationToken_ToRepository()
    {
        var repository = new CapturingProductRepository();
        var controller = new ProductsController(new ProductService(repository));

        using var cts = new CancellationTokenSource();
        await controller.Get(null, null, cts.Token);

        Assert.Equal(cts.Token, repository.LastToken);
    }

    /// <summary>
    /// Fake-репозиторий каталога: фиксирует последний переданный токен,
    /// при отменённом токене бросает OperationCanceledException. Без внешних
    /// библиотек (Moq и т.п.).
    /// </summary>
    private sealed class CapturingProductRepository : IProductRepository
    {
        public CancellationToken LastToken { get; private set; }

        public Task<int> CountAsync(CancellationToken cancellationToken = default)
        {
            LastToken = cancellationToken;
            return Task.FromResult(0);
        }

        public Task<Product?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            LastToken = cancellationToken;
            return Task.FromResult<Product?>(null);
        }

        public Task<PagedResult<Product>> GetPagedAsync(
            Pagination pagination,
            CancellationToken cancellationToken = default)
        {
            LastToken = cancellationToken;
            cancellationToken.ThrowIfCancellationRequested();
            return Task.FromResult(
                new PagedResult<Product>([], pagination.Page, pagination.PageSize, 0));
        }

        public Task AddAsync(Product product, CancellationToken cancellationToken = default)
        {
            LastToken = cancellationToken;
            return Task.CompletedTask;
        }
    }
}