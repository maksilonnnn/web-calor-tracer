using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <inheritdoc cref="IUserRepository" />
public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly InMemoryDatabase _db;

    public InMemoryUserRepository(InMemoryDatabase db) => _db = db;

    public Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Users.Count);
        }
    }

    public Task<User?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Users.GetValueOrDefault(id));
        }
    }

    public Task<User?> FindByLoginAsync(string login, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Users.Values.FirstOrDefault(user =>
                string.Equals(user.Login.Value, login, StringComparison.OrdinalIgnoreCase)));
        }
    }

    public Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Users.Values.FirstOrDefault(user =>
                string.Equals(user.Email.Value, email, StringComparison.OrdinalIgnoreCase)));
        }
    }

    public Task<bool> ExistsByEmailAsync(
        string email,
        Guid? exceptUserId = null,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Users.Values.Any(user =>
                (exceptUserId is null || user.Id != exceptUserId.Value)
                && string.Equals(user.Email.Value, email, StringComparison.OrdinalIgnoreCase)));
        }
    }

    public Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            _db.Users[user.Id] = user;
        }

        return Task.CompletedTask;
    }

    public Task SaveAsync(User user, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            _db.Users[user.Id] = user;
        }

        return Task.CompletedTask;
    }

    public Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            _db.Users.Remove(id);
        }

        return Task.CompletedTask;
    }

    public Task<PagedResult<User>> GetPagedAsync(
        Pagination pagination,
        string? search,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            var term = search?.Trim();
            var query = _db.Users.Values.AsEnumerable();
            if (!string.IsNullOrEmpty(term))
            {
                query = query.Where(user =>
                    user.Name.Value.Contains(term, StringComparison.OrdinalIgnoreCase)
                    || user.Login.Value.Contains(term, StringComparison.OrdinalIgnoreCase)
                    || user.Email.Value.Contains(term, StringComparison.OrdinalIgnoreCase));
            }

            var ordered = query
                .OrderByDescending(user => user.CreatedAt)
                .ThenBy(user => user.Id)
                .ToList();

            var items = ordered
                .Skip(pagination.Skip)
                .Take(pagination.PageSize)
                .ToList();

            return Task.FromResult(new PagedResult<User>(
                items,
                pagination.Page,
                pagination.PageSize,
                ordered.Count));
        }
    }
}
