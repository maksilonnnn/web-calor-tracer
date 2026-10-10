using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Presentation.Contracts;

namespace CalorieTracker.Api.Presentation.Mapping;

/// <summary>Преобразование доменных объектов в DTO контракта API.</summary>
public static class DtoMapper
{
    public static UserDto ToDto(User user) => new()
    {
        Id = user.Id,
        Name = user.Name.Value,
        Email = user.Email.Value,
    };

    public static ProductDto ToDto(Product product) => new()
    {
        Id = product.Id,
        Name = product.Name.Value,
        Calories = product.Calories,
        Protein = product.Protein,
        Fat = product.Fat,
        Carbs = product.Carbs,
        Category = product.Category,
    };

    public static MealItemDto ToDto(MealItem item) => new()
    {
        Id = item.Id,
        Product = ToDto(item.Product),
        Quantity = item.Quantity.Value,
    };

    public static MealDto ToDto(Meal meal) => new()
    {
        Id = meal.Id,
        Type = meal.Type,
        Items = meal.Items.Select(ToDto).ToList(),
    };

    public static DiaryEntryDto ToDto(DiaryEntry entry) => new()
    {
        Id = entry.Id,
        Date = DateParser.FormatDate(entry.Date),
        Meals = entry.Meals.Select(ToDto).ToList(),
    };

    public static SettingsDto ToDto(UserSettings settings) => new()
    {
        DailyCalories = settings.DailyCalories,
        DailyProtein = settings.DailyProtein,
        DailyFat = settings.DailyFat,
        DailyCarbs = settings.DailyCarbs,
        WeightUnit = settings.WeightUnit,
        NotificationsEnabled = settings.NotificationsEnabled,
    };

    public static DashboardGoalsDto ToDto(DashboardGoals goals) => new()
    {
        Calories = goals.Calories,
        Protein = goals.Protein,
        Fat = goals.Fat,
        Carbs = goals.Carbs,
    };

    public static DashboardDataDto ToDto(DashboardData data) => new()
    {
        Date = DateParser.FormatDate(data.Date),
        TotalCalories = data.TotalCalories,
        TotalProtein = data.TotalProtein,
        TotalFat = data.TotalFat,
        TotalCarbs = data.TotalCarbs,
        Meals = data.Meals
            .Select(summary => new DashboardMealDto
            {
                Type = summary.Type,
                Calories = summary.Calories,
                ItemsCount = summary.ItemsCount,
            })
            .ToList(),
        RecentProducts = data.RecentProducts.Select(ToDto).ToList(),
        Goals = ToDto(data.Goals),
    };

    public static DiaryHistoryItemDto ToDto(DiaryHistoryItem item) => new()
    {
        Id = item.Id,
        Date = DateParser.FormatDate(item.Date),
        TotalCalories = item.TotalCalories,
        TotalProtein = item.TotalProtein,
        TotalFat = item.TotalFat,
        TotalCarbs = item.TotalCarbs,
        ItemsCount = item.ItemsCount,
    };

    public static PagedResultDto<TDto> ToDto<TDomain, TDto>(
        PagedResult<TDomain> page,
        Func<TDomain, TDto> map) => new()
    {
        Items = page.Items.Select(map).ToList(),
        Page = page.Page,
        PageSize = page.PageSize,
        TotalCount = page.TotalCount,
        TotalPages = page.TotalPages,
    };
}
