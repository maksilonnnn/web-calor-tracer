using CalorieTracker.Api.Infrastructure;
using CalorieTracker.Api.Infrastructure.InMemory.Seed;
using CalorieTracker.Api.Infrastructure.Options;
using CalorieTracker.Api.Presentation;
using CalorieTracker.Api.Presentation.Middleware;
using InfrastructureDi = CalorieTracker.Api.Infrastructure.DependencyInjection;
using PresentationDi = CalorieTracker.Api.Presentation.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// В Development проверяем граф зависимостей на старте: captive dependency
// (например, singleton-служба поверх scoped-репозитория) падает сразу.
if (builder.Environment.IsDevelopment())
{
    builder.Host.UseDefaultServiceProvider(options =>
    {
        options.ValidateScopes = true;
        options.ValidateOnBuild = true;
    });
}

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPresentation(builder.Configuration, builder.Environment);

var app = builder.Build();

var persistenceProvider = builder.Configuration
    .GetSection(PersistenceOptions.SectionName)
    .Get<PersistenceOptions>()?.Provider
    ?? new PersistenceOptions().Provider;

if (string.Equals(persistenceProvider, "InMemory", StringComparison.OrdinalIgnoreCase))
{
    // Начальное заполнение in-memory заглушки (демо-данные). В Postgres
    // сид не выполняется: каталог продуктов уже загружен SQL-скриптами.
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedAsync();
}
else
{
    app.Logger.LogInformation(
        "Persistence:Provider={Provider} — сид InMemory пропущен.", persistenceProvider);
}

// Логирование — самым внешним, чтобы фиксировать итоговый код и время;
// обработка исключений — сразу под ним.
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(PresentationDi.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

/// <summary>Точка входа, доступная интеграционным тестам (WebApplicationFactory).</summary>
public partial class Program
{
}
