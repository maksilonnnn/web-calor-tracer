using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace CalorieTracker.Api.Infrastructure.Postgres.Ef;

// Модели хранения: плоские классы под таблицы. Доменные сущности остаются «чистыми»
// (приватные конструкторы, value objects), а маппинг делается в репозиториях.

internal sealed class UserRecord
{
    public Guid Id { get; set; }

    public string Login { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public string Role { get; set; } = UserRoles.User;

    public bool IsBlocked { get; set; }
}

internal sealed class UserSettingsRecord
{
    public Guid UserId { get; set; }

    public double DailyCalories { get; set; }

    public double DailyProtein { get; set; }

    public double DailyFat { get; set; }

    public double DailyCarbs { get; set; }

    public string WeightUnit { get; set; } = "g";

    public bool NotificationsEnabled { get; set; }
}

/// <summary>Контекст EF Core. Схема создана SQL-скриптами, поэтому миграции не используются.</summary>
internal sealed class CalorieTrackerDbContext(DbContextOptions<CalorieTrackerDbContext> options)
    : DbContext(options)
{
    public DbSet<UserRecord> Users => Set<UserRecord>();

    public DbSet<UserSettingsRecord> UserSettings => Set<UserSettingsRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserRecord>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<UserSettingsRecord>(entity =>
        {
            entity.ToTable("user_settings");
            entity.HasKey(x => x.UserId);
        });

        // CreatedAt -> created_at, DailyCalories -> daily_calories и т. д.
        foreach (var property in modelBuilder.Model.GetEntityTypes().SelectMany(t => t.GetProperties()))
        {
            property.SetColumnName(ToSnakeCase(property.Name));
        }
    }

    private static string ToSnakeCase(string name) =>
        string.Concat(name.Select((c, i) =>
            i > 0 && char.IsUpper(c) ? "_" + char.ToLowerInvariant(c) : char.ToLowerInvariant(c).ToString()));
}

/// <summary>Пользователи через Entity Framework Core.</summary>
internal sealed class EfUserRepository(CalorieTrackerDbContext db) : IUserRepository
{
    public async Task<User?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var record = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        return record is null ? null : ToDomain(record);
    }

    public async Task<User?> FindByLoginAsync(string login, CancellationToken cancellationToken = default)
    {
        var normalized = login.Trim().ToLower();
        var record = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Login.ToLower() == normalized, cancellationToken);
        return record is null ? null : ToDomain(record);
    }

    public async Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        var record = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized, cancellationToken);
        return record is null ? null : ToDomain(record);
    }

    public Task<bool> ExistsByEmailAsync(
        string email,
        Guid? exceptUserId = null,
        CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return db.Users.AsNoTracking().AnyAsync(
            u => u.Email.ToLower() == normalized && (exceptUserId == null || u.Id != exceptUserId),
            cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        db.Users.Add(ToRecord(new UserRecord(), user));
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(User user, CancellationToken cancellationToken = default)
    {
        var record = await db.Users.FirstOrDefaultAsync(u => u.Id == user.Id, cancellationToken);
        if (record is null)
        {
            db.Users.Add(ToRecord(new UserRecord(), user));
        }
        else
        {
            ToRecord(record, user);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public Task RemoveAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Users.Where(u => u.Id == id).ExecuteDeleteAsync(cancellationToken); // связанные строки удалит ON DELETE CASCADE

    public Task<int> CountAsync(CancellationToken cancellationToken = default) =>
        db.Users.CountAsync(cancellationToken);

    public async Task<PagedResult<User>> GetPagedAsync(
        Pagination pagination,
        string? search,
        CancellationToken cancellationToken = default)
    {
        IQueryable<UserRecord> query = db.Users.AsNoTracking();

        var term = search?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(term))
        {
            query = query.Where(u =>
                u.Name.ToLower().Contains(term)
                || u.Login.ToLower().Contains(term)
                || u.Email.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var records = await query
            .OrderByDescending(u => u.CreatedAt)
            .ThenBy(u => u.Id)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<User>(
            records.Select(ToDomain).ToList(),
            pagination.Page,
            pagination.PageSize,
            totalCount);
    }

    private static User ToDomain(UserRecord record) =>
        User.Create(
            Login.Create(record.Login),
            PersonName.Create(record.Name),
            Email.Create(record.Email),
            record.PasswordHash,
            record.Id,
            record.CreatedAt,
            DbEnums.UserRoleFromDb(
                string.IsNullOrWhiteSpace(record.Role) ? UserRoles.User : record.Role),
            record.IsBlocked);

    private static UserRecord ToRecord(UserRecord record, User user)
    {
        record.Id = user.Id;
        record.Login = user.Login.Value;
        record.Name = user.Name.Value;
        record.Email = user.Email.Value;
        record.PasswordHash = user.PasswordHash;
        record.CreatedAt = user.CreatedAt.ToUniversalTime(); // timestamptz принимает только UTC
        record.Role = DbEnums.ToDb(user.Role);
        record.IsBlocked = user.IsBlocked;
        return record;
    }
}

/// <summary>Настройки пользователя через Entity Framework Core.</summary>
internal sealed class EfSettingsRepository(CalorieTrackerDbContext db) : ISettingsRepository
{
    public async Task<UserSettings?> FindAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var record = await db.UserSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
        return record is null ? null : ToDomain(record);
    }

    public async Task<UserSettings> GetOrCreateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await FindAsync(userId, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = UserSettings.CreateDefault(userId);
        await SaveAsync(created, cancellationToken);
        return created;
    }

    public async Task SaveAsync(UserSettings settings, CancellationToken cancellationToken = default)
    {
        var record = await db.UserSettings.FirstOrDefaultAsync(s => s.UserId == settings.UserId, cancellationToken);
        if (record is null)
        {
            db.UserSettings.Add(ToRecord(new UserSettingsRecord(), settings));
        }
        else
        {
            ToRecord(record, settings);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public Task RemoveAsync(Guid userId, CancellationToken cancellationToken = default) =>
        db.UserSettings.Where(s => s.UserId == userId).ExecuteDeleteAsync(cancellationToken);

    private static UserSettings ToDomain(UserSettingsRecord record) =>
        UserSettings.Create(
            record.UserId,
            record.DailyCalories,
            record.DailyProtein,
            record.DailyFat,
            record.DailyCarbs,
            DbEnums.WeightUnitFromDb(record.WeightUnit),
            record.NotificationsEnabled);

    private static UserSettingsRecord ToRecord(UserSettingsRecord record, UserSettings settings)
    {
        record.UserId = settings.UserId;
        record.DailyCalories = settings.DailyCalories;
        record.DailyProtein = settings.DailyProtein;
        record.DailyFat = settings.DailyFat;
        record.DailyCarbs = settings.DailyCarbs;
        record.WeightUnit = DbEnums.ToDb(settings.WeightUnit);
        record.NotificationsEnabled = settings.NotificationsEnabled;
        return record;
    }
}
