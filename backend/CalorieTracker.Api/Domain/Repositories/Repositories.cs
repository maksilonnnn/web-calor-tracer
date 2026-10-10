using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;

namespace CalorieTracker.Api.Domain.Repositories;

/// <summary>
/// Репозиторий пользователей (в инфраструктуре — in-memory заглушка).
/// Все операции асинхронны, чтобы замена на реальную БД (EF Core) не
/// потребовала менять интерфейс.
/// </summary>
public interface IUserRepository
{
    Task<User?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Поиск по email без учёта регистра.</summary>
    Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>Занят ли email кем-то, кроме указанного пользователя.</summary>
    Task<bool> ExistsByEmailAsync(
        string email,
        Guid? exceptUserId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(User user, CancellationToken cancellationToken = default);

    Task SaveAsync(User user, CancellationToken cancellationToken = default);

    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);

    Task<int> CountAsync(CancellationToken cancellationToken = default);
}

/// <summary>Репозиторий каталога продуктов.</summary>
public interface IProductRepository
{
    Task<Product?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Постраничный каталог, отсортированный по названию (Skip/Take внутри).</summary>
    Task<PagedResult<Product>> GetPagedAsync(
        Pagination pagination,
        CancellationToken cancellationToken = default);

    Task AddAsync(Product product, CancellationToken cancellationToken = default);

    Task<int> CountAsync(CancellationToken cancellationToken = default);
}

/// <summary>Репозиторий дневника питания.</summary>
public interface IDiaryRepository
{
    Task<DiaryEntry?> FindAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default);

    /// <summary>Возвращает запись дня, создавая пустую при отсутствии.</summary>
    Task<DiaryEntry> GetOrCreateAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default);

    /// <summary>Запись, содержащая позицию с указанным id, в пределах пользователя.</summary>
    Task<DiaryEntry?> FindByItemIdAsync(
        Guid userId,
        Guid itemId,
        CancellationToken cancellationToken = default);

    /// <summary>Все записи пользователя (данные уже отфильтрованы по владельцу).</summary>
    Task<IReadOnlyList<DiaryEntry>> GetAllForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>Постраничная история по датам (по убыванию) с Skip/Take внутри.</summary>
    Task<PagedResult<DiaryEntry>> GetHistoryPageAsync(
        Guid userId,
        Pagination pagination,
        CancellationToken cancellationToken = default);

    Task SaveAsync(DiaryEntry entry, CancellationToken cancellationToken = default);

    Task RemoveAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}

/// <summary>Репозиторий настроек пользователя.</summary>
public interface ISettingsRepository
{
    Task<UserSettings?> FindAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Возвращает настройки, создавая значения по умолчанию при отсутствии.</summary>
    Task<UserSettings> GetOrCreateAsync(Guid userId, CancellationToken cancellationToken = default);

    Task SaveAsync(UserSettings settings, CancellationToken cancellationToken = default);

    Task RemoveAsync(Guid userId, CancellationToken cancellationToken = default);
}
