using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Domain.ValueObjects;
using CalorieTracker.Api.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace CalorieTracker.Api.Infrastructure.InMemory.Seed;

/// <summary>
/// Начальное заполнение in-memory заглушки: демо-пользователь
/// (alex@example.com / Demo1234!), каталог продуктов, дневник за сегодня и
/// два предыдущих дня, настройки по умолчанию — как seed.ts мок-слоя.
/// Идемпотентно: повторный запуск при непустом хранилище ничего не делает.
/// </summary>
public sealed class DatabaseSeeder
{
    private const string DemoName = "Алексей";
    private const string DemoEmail = "alex@example.com";
    private const string DemoPassword = "Demo1234!";

    private readonly InMemoryDatabase _db;
    private readonly IUserRepository _users;
    private readonly IProductRepository _products;
    private readonly IDiaryRepository _diary;
    private readonly ISettingsRepository _settings;
    private readonly IPasswordHasher _passwordHasher;
    private readonly SeedOptions _options;

    public DatabaseSeeder(
        InMemoryDatabase db,
        IUserRepository users,
        IProductRepository products,
        IDiaryRepository diary,
        ISettingsRepository settings,
        IPasswordHasher passwordHasher,
        IOptions<SeedOptions> options)
    {
        _db = db;
        _users = users;
        _products = products;
        _diary = diary;
        _settings = settings;
        _passwordHasher = passwordHasher;
        _options = options.Value;
    }

    /// <summary>Заполняет заглушку, если сид включён и хранилище пусто.</summary>
    public void Seed()
    {
        if (!_options.Enabled)
        {
            return;
        }

        lock (_db.SyncRoot)
        {
            if (_db.Users.Count > 0)
            {
                return;
            }
        }

        var user = User.Create(
            PersonName.Create(DemoName),
            Email.Create(DemoEmail),
            _passwordHasher.Hash(DemoPassword));
        _users.Add(user);

        var catalog = ProductCatalog.CreateProducts();
        foreach (var product in catalog)
        {
            _products.Add(product);
        }

        _settings.Save(UserSettings.CreateDefault(user.Id));

        var today = DateParser.Today();
        for (var offset = 0; offset < SeedDiary.Length; offset++)
        {
            var date = today.AddDays(-offset);
            var entry = DiaryEntry.CreateEmpty(user.Id, date);
            foreach (var (mealType, items) in SeedDiary[offset])
            {
                foreach (var (productIndex, quantity) in items)
                {
                    var product = catalog[productIndex];
                    entry.AddItem(
                        mealType,
                        MealItem.Create(product, GramAmount.Create(quantity)));
                }
            }

            _diary.Save(entry);
        }
    }

    /// <summary>План дней: продукт каталога по индексу + количество в граммах.</summary>
    private static readonly (MealType Type, (int Product, double Quantity)[] Items)[][] SeedDiary =
    [
        // Сегодня.
        [
            (MealType.Breakfast, [(2, 100), (3, 50), (4, 200)]),
            (MealType.Lunch, [(0, 150), (1, 100)]),
            (MealType.Dinner, [(6, 150), (5, 150)]),
            (MealType.Snack, [(5, 100)]),
        ],
        // Вчера.
        [
            (MealType.Breakfast, [(7, 150), (4, 150)]),
            (MealType.Lunch, [(0, 180), (1, 150)]),
            (MealType.Dinner, [(6, 120)]),
            (MealType.Snack, [(5, 120)]),
        ],
        // Позавчера.
        [
            (MealType.Breakfast, [(2, 120), (3, 60)]),
            (MealType.Lunch, [(0, 150), (7, 150)]),
            (MealType.Dinner, [(1, 100), (6, 100)]),
        ],
    ];
}
