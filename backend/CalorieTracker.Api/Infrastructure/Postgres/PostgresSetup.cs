using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Infrastructure.Postgres.Ef;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CalorieTracker.Api.Infrastructure.Postgres;

/// <summary>Преобразование enum домена в текстовые значения столбцов БД и обратно.</summary>
internal static class DbEnums
{
    public static string ToDb(MealType type) => type switch
    {
        MealType.Breakfast => "breakfast",
        MealType.Lunch => "lunch",
        MealType.Dinner => "dinner",
        MealType.Snack => "snack",
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, null),
    };

    public static MealType MealTypeFromDb(string value) => value switch
    {
        "breakfast" => MealType.Breakfast,
        "lunch" => MealType.Lunch,
        "dinner" => MealType.Dinner,
        "snack" => MealType.Snack,
        _ => throw new InvalidOperationException($"Неизвестный тип приёма пищи в БД: {value}."),
    };

    public static string ToDb(WeightUnit unit) => unit switch
    {
        WeightUnit.G => "g",
        WeightUnit.Kg => "kg",
        _ => throw new ArgumentOutOfRangeException(nameof(unit), unit, null),
    };

    public static WeightUnit WeightUnitFromDb(string value) => value switch
    {
        "g" => WeightUnit.G,
        "kg" => WeightUnit.Kg,
        _ => throw new InvalidOperationException($"Неизвестная единица веса в БД: {value}."),
    };
}

public static class PostgresServiceCollectionExtensions
{
    /// <summary>
    /// Подключает PostgreSQL вместо in-memory заглушки:
    /// SQL (Npgsql) — продукты и дневник; Entity Framework Core — пользователи и настройки.
    /// Строка подключения: ConnectionStrings:CalorieTracker (user-secrets / переменные окружения).
    /// </summary>
    public static IServiceCollection AddPostgresPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("CalorieTracker")
            ?? throw new InvalidOperationException(
                "Не задана строка подключения ConnectionStrings:CalorieTracker.");

        // Фабрика, а не готовый экземпляр: контейнер сам освободит пул соединений
        // при остановке приложения.
        services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
        services.AddDbContext<CalorieTrackerDbContext>(options => options.UseNpgsql(connectionString));

        services.AddScoped<IProductRepository, SqlProductRepository>();
        services.AddScoped<IDiaryRepository, SqlDiaryRepository>();
        services.AddScoped<IUserRepository, EfUserRepository>();
        services.AddScoped<ISettingsRepository, EfSettingsRepository>();

        return services;
    }
}
