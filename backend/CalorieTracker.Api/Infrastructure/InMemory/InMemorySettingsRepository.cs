using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <inheritdoc cref="ISettingsRepository" />
public sealed class InMemorySettingsRepository : ISettingsRepository
{
    private readonly InMemoryDatabase _db;

    public InMemorySettingsRepository(InMemoryDatabase db) => _db = db;

    public UserSettings? Find(Guid userId)
    {
        lock (_db.SyncRoot)
        {
            return _db.Settings.GetValueOrDefault(userId);
        }
    }

    public UserSettings GetOrCreate(Guid userId)
    {
        lock (_db.SyncRoot)
        {
            if (_db.Settings.TryGetValue(userId, out var existing))
            {
                return existing;
            }

            var created = UserSettings.CreateDefault(userId);
            _db.Settings[userId] = created;
            return created;
        }
    }

    public void Save(UserSettings settings)
    {
        lock (_db.SyncRoot)
        {
            _db.Settings[settings.UserId] = settings;
        }
    }

    public void Remove(Guid userId)
    {
        lock (_db.SyncRoot)
        {
            _db.Settings.Remove(userId);
        }
    }
}
