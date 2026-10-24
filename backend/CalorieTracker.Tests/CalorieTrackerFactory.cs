using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace CalorieTracker.Tests;

/// <summary>
/// Фабрика приложения для интеграционных тестов. Подменяет отсутствующий
/// секрет JWT тестовым значением и запускает приложение в окружении
/// Development (cookie без флага Secure — тестовый сервер работает по http).
/// </summary>
public sealed class CalorieTrackerFactory : WebApplicationFactory<Program>
{
    /// <summary>Валидный тестовый секрет (≥ 32 символов).</summary>
    public const string TestJwtKey = "test-secret-key-0123456789-0123456789-abcdef";

    static CalorieTrackerFactory()
    {
        // Провайдер выбирается при регистрации сервисов, то есть раньше, чем
        // WebApplicationFactory применяет ConfigureAppConfiguration. Переменная
        // окружения доступна уже в WebApplication.CreateBuilder, поэтому тесты
        // гарантированно идут на in-memory заглушке, а не на PostgreSQL.
        Environment.SetEnvironmentVariable("Persistence__Provider", "InMemory");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Auth:JwtKey"] = TestJwtKey,
                ["Auth:Issuer"] = "calorie-tracker-tests",
                ["Auth:AccessTtlMinutes"] = "60",
                ["Seed:Enabled"] = "true",
                ["Persistence:Provider"] = "InMemory",
            });
        });
    }
}
