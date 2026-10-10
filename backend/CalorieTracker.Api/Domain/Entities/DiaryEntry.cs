namespace CalorieTracker.Api.Domain.Entities;

/// <summary>
/// Дневник питания за дату. Всегда содержит четыре приёма пищи
/// (завтрак, обед, ужин, перекус) — даже если позиций нет, как в мок-слое.
/// </summary>
public sealed class DiaryEntry
{
    private static readonly MealType[] OrderedMealTypes =
    [
        MealType.Breakfast,
        MealType.Lunch,
        MealType.Dinner,
        MealType.Snack,
    ];

    private readonly List<Meal> _meals;

    public Guid Id { get; }

    /// <summary>Владелец записи. Используется для фильтрации по пользователю.</summary>
    public Guid UserId { get; }

    public DateOnly Date { get; }

    public IReadOnlyList<Meal> Meals => _meals;

    private DiaryEntry(Guid id, Guid userId, DateOnly date, List<Meal> meals)
    {
        Id = id;
        UserId = userId;
        Date = date;
        _meals = meals;
    }

    /// <summary>Пустой день: четыре приёма пищи без позиций.</summary>
    public static DiaryEntry CreateEmpty(Guid userId, DateOnly date, Guid? id = null) =>
        new(id ?? Guid.NewGuid(), userId, date, OrderedMealTypes.Select(type => Meal.Create(type)).ToList());

    public Meal? FindMeal(MealType type) => _meals.FirstOrDefault(meal => meal.Type == type);

    public void AddItem(MealType type, MealItem item)
    {
        var meal = FindMeal(type)
            ?? throw new InvalidOperationException($"Неизвестный приём пищи: {type}.");
        meal.AddItem(item);
    }

    /// <summary>Все позиции дня (плоский список) для подсчёта итогов.</summary>
    public IEnumerable<MealItem> AllItems => _meals.SelectMany(meal => meal.Items);

    /// <summary>Удаляет позицию по id; true — позиция была найдена и удалена.</summary>
    public bool RemoveItem(Guid itemId) => _meals.Any(meal => meal.RemoveItem(itemId));

    /// <summary>Находит позицию по id (или null).</summary>
    public MealItem? FindItem(Guid itemId) =>
        _meals.Select(meal => meal.FindItem(itemId)).FirstOrDefault(item => item is not null);
}
