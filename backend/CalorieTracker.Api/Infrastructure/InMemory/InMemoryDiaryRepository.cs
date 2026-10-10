using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <inheritdoc cref="IDiaryRepository" />
public sealed class InMemoryDiaryRepository : IDiaryRepository
{
    private readonly InMemoryDatabase _db;

    public InMemoryDiaryRepository(InMemoryDatabase db) => _db = db;

    public DiaryEntry? Find(Guid userId, DateOnly date)
    {
        lock (_db.SyncRoot)
        {
            return _db.Diary.FirstOrDefault(entry => entry.UserId == userId && entry.Date == date);
        }
    }

    public DiaryEntry GetOrCreate(Guid userId, DateOnly date)
    {
        lock (_db.SyncRoot)
        {
            var existing = _db.Diary.FirstOrDefault(entry => entry.UserId == userId && entry.Date == date);
            if (existing is not null)
            {
                return existing;
            }

            var created = DiaryEntry.CreateEmpty(userId, date);
            _db.Diary.Add(created);
            return created;
        }
    }

    public DiaryEntry? FindByItemId(Guid userId, Guid itemId)
    {
        lock (_db.SyncRoot)
        {
            return _db.Diary.FirstOrDefault(entry =>
                entry.UserId == userId && entry.FindItem(itemId) is not null);
        }
    }

    public IReadOnlyList<DiaryEntry> GetAllForUser(Guid userId)
    {
        lock (_db.SyncRoot)
        {
            return _db.Diary.Where(entry => entry.UserId == userId).ToList();
        }
    }

    public PagedResult<DiaryEntry> GetHistoryPage(Guid userId, Pagination pagination)
    {
        ArgumentNullException.ThrowIfNull(pagination);

        lock (_db.SyncRoot)
        {
            var ordered = _db.Diary
                .Where(entry => entry.UserId == userId)
                .OrderByDescending(entry => entry.Date)
                .ToList();

            var items = ordered
                .Skip(pagination.Skip)
                .Take(pagination.PageSize)
                .ToList();

            return new PagedResult<DiaryEntry>(items, pagination.Page, pagination.PageSize, ordered.Count);
        }
    }

    public void Save(DiaryEntry entry)
    {
        lock (_db.SyncRoot)
        {
            if (!_db.Diary.Any(candidate => candidate.Id == entry.Id))
            {
                _db.Diary.Add(entry);
            }
        }
    }

    public void RemoveAllForUser(Guid userId)
    {
        lock (_db.SyncRoot)
        {
            _db.Diary.RemoveAll(entry => entry.UserId == userId);
        }
    }
}
