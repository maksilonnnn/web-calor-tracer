using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.ValueObjects;
using CalorieTracker.Api.Infrastructure.Postgres;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace CalorieTracker.Tests;

/// <summary>
/// Регрессионный тест репозитория дневника на реальном PostgreSQL.
/// Проверяет, что при переносе существующей позиции в другой приём пищи
/// SaveAsync обновляет meal_id, а не оставляет старую привязку.
///
/// Запускается только при заданной переменной окружения CALORIE_TEST_CONNECTION
/// (строка подключения к базе со схемой из backend/database). Иначе — Skip.
/// </summary>
public sealed class PostgresDiaryRepositoryTests
{
    [PostgresFact]
    public async Task SaveAsync_MovingExistingItemToAnotherMeal_UpdatesMealId()
    {
        var connectionString = Environment.GetEnvironmentVariable("CALORIE_TEST_CONNECTION");

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CalorieTracker"] = connectionString!,
            })
            .Build();

        var services = new ServiceCollection();
        services.AddPostgresPersistence(configuration);

        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();

        var users = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var diary = scope.ServiceProvider.GetRequiredService<IDiaryRepository>();
        var dataSource = scope.ServiceProvider.GetRequiredService<NpgsqlDataSource>();

        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var itemId = Guid.NewGuid();
        var date = new DateOnly(2099, 1, 1);

        try
        {
            var user = User.Create(
                Login.Create($"lab4-{userId:N}"[..20]),
                PersonName.Create("Postgres integration test"),
                Email.Create($"lab4-{userId:N}@example.com"),
                "test-password-hash",
                userId);
            await users.AddAsync(user);

            var entry = await diary.GetOrCreateAsync(userId, date);
            var product = Product.Create(
                ProductName.Create("Переезд между приёмами"),
                NutritionFacts.Create(100, 10, 5, 20),
                "Другое",
                productId);
            entry.AddItem(
                MealType.Breakfast,
                MealItem.Create(product, GramAmount.Create(150), itemId));
            await diary.SaveAsync(entry);

            var loaded = await diary.FindAsync(userId, date);
            Assert.NotNull(loaded);

            var breakfast = loaded!.FindMeal(MealType.Breakfast);
            Assert.NotNull(breakfast);
            var movedItem = Assert.Single(breakfast!.Items, item => item.Id == itemId);

            Assert.True(loaded.RemoveItem(itemId));
            loaded.AddItem(MealType.Lunch, movedItem);
            await diary.SaveAsync(loaded);

            var reloaded = await diary.FindAsync(userId, date);
            Assert.NotNull(reloaded);

            var lunch = reloaded!.FindMeal(MealType.Lunch);
            Assert.NotNull(lunch);
            Assert.Contains(lunch!.Items, item => item.Id == itemId);

            var breakfastAfter = reloaded.FindMeal(MealType.Breakfast);
            Assert.NotNull(breakfastAfter);
            Assert.DoesNotContain(breakfastAfter!.Items, item => item.Id == itemId);
        }
        finally
        {
            await DeleteTestRowsAsync(dataSource, userId, productId);
        }
    }

    private static async Task DeleteTestRowsAsync(
        NpgsqlDataSource dataSource,
        Guid userId,
        Guid productId)
    {
        await using var connection = await dataSource.OpenConnectionAsync();

        await using (var command = new NpgsqlCommand(
            "DELETE FROM diary_entries WHERE user_id = @user",
            connection))
        {
            command.Parameters.AddWithValue("user", userId);
            await command.ExecuteNonQueryAsync();
        }

        await using (var command = new NpgsqlCommand(
            "DELETE FROM products WHERE id = @product",
            connection))
        {
            command.Parameters.AddWithValue("product", productId);
            await command.ExecuteNonQueryAsync();
        }

        await using (var command = new NpgsqlCommand(
            "DELETE FROM users WHERE id = @user",
            connection))
        {
            command.Parameters.AddWithValue("user", userId);
            await command.ExecuteNonQueryAsync();
        }
    }
}

/// <summary>
/// Факт, который пропускается на этапе discovery, если не задана строка
/// подключения к PostgreSQL. Так тест не падает в обычном InMemory-прогоне.
/// </summary>
internal sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
            Environment.GetEnvironmentVariable("CALORIE_TEST_CONNECTION")))
        {
            Skip = "CALORIE_TEST_CONNECTION не задан — тест PostgreSQL пропущен.";
        }
    }
}
