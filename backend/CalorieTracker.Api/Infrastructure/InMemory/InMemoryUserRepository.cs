using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <inheritdoc cref="IUserRepository" />
public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly InMemoryDatabase _db;

    public InMemoryUserRepository(InMemoryDatabase db) => _db = db;

    public int Count
    {
        get
        {
            lock (_db.SyncRoot)
            {
                return _db.Users.Count;
            }
        }
    }

    public User? FindById(Guid id)
    {
        lock (_db.SyncRoot)
        {
            return _db.Users.GetValueOrDefault(id);
        }
    }

    public User? FindByEmail(string email)
    {
        lock (_db.SyncRoot)
        {
            return _db.Users.Values.FirstOrDefault(user =>
                string.Equals(user.Email.Value, email, StringComparison.OrdinalIgnoreCase));
        }
    }

    public bool ExistsByEmail(string email, Guid? exceptUserId = null)
    {
        lock (_db.SyncRoot)
        {
            return _db.Users.Values.Any(user =>
                (exceptUserId is null || user.Id != exceptUserId.Value)
                && string.Equals(user.Email.Value, email, StringComparison.OrdinalIgnoreCase));
        }
    }

    public void Add(User user)
    {
        lock (_db.SyncRoot)
        {
            _db.Users[user.Id] = user;
        }
    }

    public void Save(User user)
    {
        lock (_db.SyncRoot)
        {
            _db.Users[user.Id] = user;
        }
    }

    public void Remove(Guid id)
    {
        lock (_db.SyncRoot)
        {
            _db.Users.Remove(id);
        }
    }
}
