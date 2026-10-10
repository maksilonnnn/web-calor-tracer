using CalorieTracker.Api.Domain.Entities;

namespace CalorieTracker.Api.Domain.Models;

/// <summary>Дневные нормы для отображения на дашборде.</summary>
public sealed class DashboardGoals
{
    public double Calories { get; init; }

    public double Protein { get; init; }

    public double Fat { get; init; }

    public double Carbs { get; init; }

    public static DashboardGoals From(UserSettings settings) => new()
    {
        Calories = settings.DailyCalories,
        Protein = settings.DailyProtein,
        Fat = settings.DailyFat,
        Carbs = settings.DailyCarbs,
    };
}

/// <summary>Сводка по приёму пищи на дашборде: калории и число позиций.</summary>
public sealed class MealSummary
{
    public MealType Type { get; init; }

    public double Calories { get; init; }

    public int ItemsCount { get; init; }
}

/// <summary>Агрегат дня для дашборда: итоги, разбивка по приёмам, продукты, нормы.</summary>
public sealed class DashboardData
{
    public DateOnly Date { get; init; }

    public double TotalCalories { get; init; }

    public double TotalProtein { get; init; }

    public double TotalFat { get; init; }

    public double TotalCarbs { get; init; }

    public IReadOnlyList<MealSummary> Meals { get; init; } = [];

    public IReadOnlyList<Product> RecentProducts { get; init; } = [];

    public DashboardGoals Goals { get; init; } = new();
}

/// <summary>Строка истории дневника (для постраничного списка дат).</summary>
public sealed class DiaryHistoryItem
{
    public Guid Id { get; init; }

    public DateOnly Date { get; init; }

    public double TotalCalories { get; init; }

    public double TotalProtein { get; init; }

    public double TotalFat { get; init; }

    public double TotalCarbs { get; init; }

    public int ItemsCount { get; init; }
}
