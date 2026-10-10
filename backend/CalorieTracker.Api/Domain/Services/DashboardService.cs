using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Nutrition;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Служба дашборда: агрегат дня по данным дневника и настроек.</summary>
public interface IDashboardService
{
    /// <summary>Агрегат дня за дату: итоги, разбивка по приёмам, недавние продукты, нормы.</summary>
    Task<DashboardData> GetDayAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IDashboardService" />
public sealed class DashboardService : IDashboardService
{
    private const int RecentProductsLimit = 4;

    private static readonly MealType[] OrderedMealTypes =
    [
        MealType.Breakfast,
        MealType.Lunch,
        MealType.Dinner,
        MealType.Snack,
    ];

    private readonly IDiaryRepository _diary;
    private readonly ISettingsRepository _settings;

    public DashboardService(IDiaryRepository diary, ISettingsRepository settings)
    {
        _diary = diary;
        _settings = settings;
    }

    public async Task<DashboardData> GetDayAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var entry = await _diary.FindAsync(userId, date, cancellationToken);
        var totals = entry is null
            ? ValueObjects.NutritionFacts.Zero
            : NutritionCalculator.Sum(entry.AllItems);

        var meals = OrderedMealTypes
            .Select(type =>
            {
                var items = entry?.FindMeal(type)?.Items ?? [];
                var calories = items.Sum(item =>
                    NutritionCalculator.Calculate(item.Product, item.Quantity.Value).Calories);
                return new MealSummary
                {
                    Type = type,
                    Calories = calories,
                    ItemsCount = items.Count,
                };
            })
            .ToList();

        var settings = await _settings.FindAsync(userId, cancellationToken)
            ?? UserSettings.CreateDefault(userId);

        return new DashboardData
        {
            Date = date,
            TotalCalories = totals.Calories,
            TotalProtein = totals.Protein,
            TotalFat = totals.Fat,
            TotalCarbs = totals.Carbs,
            Meals = meals,
            RecentProducts = await FindRecentProductsAsync(userId, cancellationToken),
            Goals = DashboardGoals.From(settings),
        };
    }

    /// <summary>
    /// Недавние продукты: уникальные по названию продукты дневника
    /// пользователя, записи — по убыванию даты, не более четырёх.
    /// </summary>
    private async Task<IReadOnlyList<Product>> FindRecentProductsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var records = (await _diary.GetAllForUserAsync(userId, cancellationToken))
            .OrderByDescending(record => record.Date);

        var seen = new HashSet<string>(StringComparer.Ordinal);
        var products = new List<Product>(RecentProductsLimit);

        foreach (var record in records)
        {
            foreach (var item in record.AllItems)
            {
                if (!seen.Add(item.Product.Name.Value))
                {
                    continue;
                }

                products.Add(item.Product);
                if (products.Count >= RecentProductsLimit)
                {
                    return products;
                }
            }
        }

        return products;
    }
}
