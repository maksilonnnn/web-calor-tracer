using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Infrastructure.InMemory;
using CalorieTracker.Api.Infrastructure.InMemory.Seed;
using CalorieTracker.Api.Infrastructure.Options;
using CalorieTracker.Api.Infrastructure.Postgres;
using CalorieTracker.Api.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CalorieTracker.Api.Infrastructure;

/// <summary>
/// Регистрация инфраструктуры: PostgreSQL (по умолчанию) или in-memory
/// заглушка для тестов, репозитории, безопасность (PBKDF2 + JWT) и доменные
/// службы. Репозитории и зависящие от них службы — scoped: DbContext нельзя
/// держать в singleton.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Опции с валидацией на старте: отсутствие JwtKey роняет приложение
        // с понятным сообщением (значение задаётся через user-secrets/env).
        services.AddOptions<AuthOptions>()
            .Bind(configuration.GetSection(AuthOptions.SectionName))
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.JwtKey),
                "Auth:JwtKey не задан. Укажите секрет через user-secrets (Auth:JwtKey) или переменную окружения Auth__JwtKey.")
            .Validate(
                options => options.JwtKey.Length >= AuthOptions.MinJwtKeyLength,
                $"Auth:JwtKey короче {AuthOptions.MinJwtKeyLength} символов — используйте более длинный секрет.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.Issuer),
                "Auth:Issuer не задан.")
            .Validate(
                options => options.AccessTtlMinutes > 0,
                "Auth:AccessTtlMinutes должен быть больше нуля.")
            .ValidateOnStart();

        services.AddOptions<CorsOptions>().Bind(configuration.GetSection(CorsOptions.SectionName));
        services.AddOptions<SeedOptions>().Bind(configuration.GetSection(SeedOptions.SectionName));

        var persistence = configuration
            .GetSection(PersistenceOptions.SectionName)
            .Get<PersistenceOptions>() ?? new PersistenceOptions();

        if (string.Equals(persistence.Provider, "Postgres", StringComparison.OrdinalIgnoreCase))
        {
            // SQL (Npgsql) — продукты и дневник, EF Core — пользователи и настройки.
            services.AddPostgresPersistence(configuration);
        }
        else if (string.Equals(persistence.Provider, "InMemory", StringComparison.OrdinalIgnoreCase))
        {
            // Заглушка для тестов и локального запуска без базы данных.
            services.AddSingleton<InMemoryDatabase>();

            services.AddScoped<IUserRepository, InMemoryUserRepository>();
            services.AddScoped<IProductRepository, InMemoryProductRepository>();
            services.AddScoped<IDiaryRepository, InMemoryDiaryRepository>();
            services.AddScoped<ISettingsRepository, InMemorySettingsRepository>();

            // Сид работает через репозитории, поэтому тоже scoped и живёт
            // только в режиме InMemory (в Postgres каталог загружается SQL-скриптами).
            services.AddScoped<DatabaseSeeder>();
        }
        else
        {
            throw new InvalidOperationException(
                $"Persistence:Provider='{persistence.Provider}' не поддерживается. " +
                "Допустимые значения — 'Postgres' (реальная БД) и 'InMemory' (заглушка для тестов).");
        }

        services.AddSingleton<IPasswordHasher>(_ => new Pbkdf2PasswordHasher());
        services.AddSingleton<ITokenService, JwtTokenService>();

        // Службы домена зависят от репозиториев (scoped), поэтому не могут
        // быть singleton — иначе возникает captive dependency.
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IDiaryService, DiaryService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IProductService, ProductService>();

        return services;
    }
}
