using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Infrastructure.InMemory;

/// <inheritdoc cref="IDiaryRepository" />
public sealed class InMemoryDiaryRepository : IDiaryRepository
{
    private readonly InMemoryDatabase _db;

    public InMemoryDiaryRepository(InMemoryDatabase db) => _db = db;

    public Task<DiaryEntry?> FindAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(
                _db.Diary.FirstOrDefault(entry => entry.UserId == userId && entry.Date == date));
        }
    }

    public Task<DiaryEntry> GetOrCreateAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            var existing = _db.Diary.FirstOrDefault(entry => entry.UserId == userId && entry.Date == date);
            if (existing is not null)
            {
                return Task.FromResult(existing);
            }

            var created = DiaryEntry.CreateEmpty(userId, date);
            _db.Diary.Add(created);
            return Task.FromResult(created);
        }
    }

    public Task<DiaryEntry?> FindByItemIdAsync(
        Guid userId,
        Guid itemId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            return Task.FromResult(_db.Diary.FirstOrDefault(entry =>
                entry.UserId == userId && entry.FindItem(itemId) is not null));
        }
    }

    public Task<IReadOnlyList<DiaryEntry>> GetAllForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            IReadOnlyList<DiaryEntry> entries =
                _db.Diary.Where(entry => entry.UserId == userId).ToList();
            return Task.FromResult(entries);
        }
    }

    public Task<PagedResult<DiaryEntry>> GetHistoryPageAsync(
        Guid userId,
        Pagination pagination,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(pagination);
        cancellationToken.ThrowIfCancellationRequested();

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

            return Task.FromResult(
                new PagedResult<DiaryEntry>(items, pagination.Page, pagination.PageSize, ordered.Count));
        }
    }

    public Task SaveAsync(DiaryEntry entry, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            if (!_db.Diary.Any(candidate => candidate.Id == entry.Id))
            {
                _db.Diary.Add(entry);
            }
        }

        return Task.CompletedTask;
    }

    public Task RemoveAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_db.SyncRoot)
        {
            _db.Diary.RemoveAll(entry => entry.UserId == userId);
        }

        return Task.CompletedTask;
    }
}
