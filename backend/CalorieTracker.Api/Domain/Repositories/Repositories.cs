using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;

namespace CalorieTracker.Api.Domain.Repositories;

/// <summary>Репозиторий пользователей (в инфраструктуре — in-memory заглушка).</summary>
public interface IUserRepository
{
    User? FindById(Guid id);

    /// <summary>Поиск по email без учёта регистра.</summary>
    User? FindByEmail(string email);

    /// <summary>Занят ли email кем-то, кроме указанного пользователя.</summary>
    bool ExistsByEmail(string email, Guid? exceptUserId = null);

    void Add(User user);

    void Save(User user);

    void Remove(Guid id);

    int Count { get; }
}

/// <summary>Репозиторий каталога продуктов.</summary>
public interface IProductRepository
{
    Product? FindById(Guid id);

    /// <summary>Постраничный каталог, отсортированный по названию (Skip/Take внутри).</summary>
    PagedResult<Product> GetPaged(Pagination pagination);

    void Add(Product product);

    int Count { get; }
}

/// <summary>Репозиторий дневника питания.</summary>
public interface IDiaryRepository
{
    DiaryEntry? Find(Guid userId, DateOnly date);

    /// <summary>Возвращает запись дня, создавая пустую при отсутствии.</summary>
    DiaryEntry GetOrCreate(Guid userId, DateOnly date);

    /// <summary>Запись, содержащая позицию с указанным id, в пределах пользователя.</summary>
    DiaryEntry? FindByItemId(Guid userId, Guid itemId);

    /// <summary>Все записи пользователя (данные уже отфильтрованы по владельцу).</summary>
    IReadOnlyList<DiaryEntry> GetAllForUser(Guid userId);

    /// <summary>Постраничная история по датам (по убыванию) с Skip/Take внутри.</summary>
    PagedResult<DiaryEntry> GetHistoryPage(Guid userId, Pagination pagination);

    void Save(DiaryEntry entry);

    void RemoveAllForUser(Guid userId);
}

/// <summary>Репозиторий настроек пользователя.</summary>
public interface ISettingsRepository
{
    UserSettings? Find(Guid userId);

    /// <summary>Возвращает настройки, создавая значения по умолчанию при отсутствии.</summary>
    UserSettings GetOrCreate(Guid userId);

    void Save(UserSettings settings);

    void Remove(Guid userId);
}
