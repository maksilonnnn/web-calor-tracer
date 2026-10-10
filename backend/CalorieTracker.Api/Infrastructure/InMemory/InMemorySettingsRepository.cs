using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <inheritdoc cref="ISettingsRepository" />
public sealed class InMemorySettingsRepository : ISettingsRepository
{
    private readonly InMemoryDatabase _db;

    public InMemorySettingsRepository(InMemoryDatabase db) => _db = db;

    public Task<UserSettings?> FindAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Settings.GetValueOrDefault(userId));
        }
    }

    public Task<UserSettings> GetOrCreateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            if (_db.Settings.TryGetValue(userId, out var existing))
            {
                return Task.FromResult(existing);
            }

            var created = UserSettings.CreateDefault(userId);
            _db.Settings[userId] = created;
            return Task.FromResult(created);
        }
    }

    public Task SaveAsync(UserSettings settings, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            _db.Settings[settings.UserId] = settings;
        }

        return Task.CompletedTask;
    }

    public Task RemoveAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            _db.Settings.Remove(userId);
        }

        return Task.CompletedTask;
    }
}
