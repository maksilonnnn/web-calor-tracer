using CalorieTracker.Api.Domain;

namespace CalorieTracker.Api.Presentation.Contracts;

/// <summary>Пользователь без пароля (ответ auth/profile).</summary>
public sealed class UserDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;
}

/// <summary>Продукт: пищевая ценность на 100 г.</summary>
public sealed class ProductDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public double Calories { get; init; }

    public double Protein { get; init; }

    public double Fat { get; init; }

    public double Carbs { get; init; }

    public string? Category { get; init; }
}

/// <summary>Позиция приёма пищи: продукт (снимок) и количество в граммах.</summary>
public sealed class MealItemDto
{
    public Guid Id { get; init; }

    public ProductDto Product { get; init; } = new();

    public double Quantity { get; init; }
}

/// <summary>Приём пищи с позициями.</summary>
public sealed class MealDto
{
    public Guid Id { get; init; }

    public MealType Type { get; init; }

    public IReadOnlyList<MealItemDto> Items { get; init; } = [];
}

/// <summary>Дневник питания за дату: всегда четыре приёма пищи.</summary>
public sealed class DiaryEntryDto
{
    public Guid Id { get; init; }

    public string Date { get; init; } = string.Empty;

    public IReadOnlyList<MealDto> Meals { get; init; } = [];
}

/// <summary>Дневные нормы дашборда.</summary>
public sealed class DashboardGoalsDto
{
    public double Calories { get; init; }

    public double Protein { get; init; }

    public double Fat { get; init; }

    public double Carbs { get; init; }
}

/// <summary>Сводка приёма пищи на дашборде.</summary>
public sealed class DashboardMealDto
{
    public MealType Type { get; init; }

    public double Calories { get; init; }

    public int ItemsCount { get; init; }
}

/// <summary>Агрегат дня для дашборда.</summary>
public sealed class DashboardDataDto
{
    public string Date { get; init; } = string.Empty;

    public double TotalCalories { get; init; }

    public double TotalProtein { get; init; }

    public double TotalFat { get; init; }

    public double TotalCarbs { get; init; }

    public IReadOnlyList<DashboardMealDto> Meals { get; init; } = [];

    public IReadOnlyList<ProductDto> RecentProducts { get; init; } = [];

    public DashboardGoalsDto Goals { get; init; } = new();
}

/// <summary>Настройки пользователя.</summary>
public sealed class SettingsDto
{
    public double DailyCalories { get; init; }

    public double DailyProtein { get; init; }

    public double DailyFat { get; init; }

    public double DailyCarbs { get; init; }

    public WeightUnit WeightUnit { get; init; }

    public bool NotificationsEnabled { get; init; }
}

/// <summary>Строка истории дневника.</summary>
public sealed class DiaryHistoryItemDto
{
    public Guid Id { get; init; }

    public string Date { get; init; } = string.Empty;

    public double TotalCalories { get; init; }

    public double TotalProtein { get; init; }

    public double TotalFat { get; init; }

    public double TotalCarbs { get; init; }

    public int ItemsCount { get; init; }
}

/// <summary>Страница выборки: { items, page, pageSize, totalCount, totalPages }.</summary>
public sealed class PagedResultDto<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];

    public int Page { get; init; }

    public int PageSize { get; init; }

    public int TotalCount { get; init; }

    public int TotalPages { get; init; }
}
