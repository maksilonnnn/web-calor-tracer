using CalorieTracker.Api.Domain.Entities;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <summary>
/// Единое in-memory хранилище приложения (заглушка БД). Один экземпляр на
/// процесс (singleton); доступ сериализуется общим <see cref="SyncRoot"/>.
/// Замена на реальную БД — реализация тех же репозиториев поверх DbContext.
/// </summary>
public sealed class InMemoryDatabase
{
    /// <summary>Замок для потокобезопасного доступа к коллекциям.</summary>
    public object SyncRoot { get; } = new();

    public Dictionary<Guid, User> Users { get; } = [];

    public Dictionary<Guid, Product> Products { get; } = [];

    public List<DiaryEntry> Diary { get; } = [];

    public Dictionary<Guid, UserSettings> Settings { get; } = [];
}
