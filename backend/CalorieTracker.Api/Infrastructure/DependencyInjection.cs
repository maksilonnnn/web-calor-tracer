using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Infrastructure.InMemory;
using CalorieTracker.Api.Infrastructure.InMemory.Seed;
using CalorieTracker.Api.Infrastructure.Options;
using CalorieTracker.Api.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CalorieTracker.Api.Infrastructure;

/// <summary>
/// Регистрация инфраструктуры: in-memory заглушка БД, репозитории,
/// безопасность (PBKDF2 + JWT) и доменные службы. Хранилище — singleton,
/// поэтому данные живут на протяжении процесса.
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
        if (!string.Equals(persistence.Provider, "InMemory", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Persistence:Provider='{persistence.Provider}' не поддерживается. " +
                "Единственный доступный провайдер — 'InMemory' (заглушка БД). " +
                "Чтобы подключить реальную БД, зарегистрируйте вместо in-memory репозиториев " +
                "реализации поверх вашего DbContext.");
        }

        services.AddSingleton<InMemoryDatabase>();

        services.AddSingleton<IUserRepository, InMemoryUserRepository>();
        services.AddSingleton<IProductRepository, InMemoryProductRepository>();
        services.AddSingleton<IDiaryRepository, InMemoryDiaryRepository>();
        services.AddSingleton<ISettingsRepository, InMemorySettingsRepository>();

        services.AddSingleton<IPasswordHasher>(_ => new Pbkdf2PasswordHasher());
        services.AddSingleton<ITokenService, JwtTokenService>();

        services.AddSingleton<IAuthService, AuthService>();
        services.AddSingleton<IDiaryService, DiaryService>();
        services.AddSingleton<IDashboardService, DashboardService>();
        services.AddSingleton<ISettingsService, SettingsService>();
        services.AddSingleton<IProfileService, ProfileService>();
        services.AddSingleton<IProductService, ProductService>();

        services.AddSingleton<DatabaseSeeder>();

        return services;
    }
}
