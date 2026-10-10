using CalorieTracker.Api.Infrastructure;
using CalorieTracker.Api.Infrastructure.InMemory.Seed;
using CalorieTracker.Api.Presentation;
using CalorieTracker.Api.Presentation.Middleware;
using InfrastructureDi = CalorieTracker.Api.Infrastructure.DependencyInjection;
using PresentationDi = CalorieTracker.Api.Presentation.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPresentation(builder.Configuration, builder.Environment);

var app = builder.Build();

// Начальное заполнение in-memory заглушки (демо-данные).
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedAsync();
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
