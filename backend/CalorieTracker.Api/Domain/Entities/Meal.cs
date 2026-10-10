namespace CalorieTracker.Api.Domain.Entities;

/// <summary>Приём пищи: тип и список позиций.</summary>
public sealed class Meal
{
    private readonly List<MealItem> _items = [];

    public Guid Id { get; }

    public MealType Type { get; }

    public IReadOnlyList<MealItem> Items => _items;

    private Meal(Guid id, MealType type)
    {
        Id = id;
        Type = type;
    }

    public static Meal Create(MealType type, Guid? id = null) => new(id ?? Guid.NewGuid(), type);

    public void AddItem(MealItem item) => _items.Add(item);

    public bool RemoveItem(Guid itemId) => _items.RemoveAll(item => item.Id == itemId) > 0;

    public MealItem? FindItem(Guid itemId) => _items.FirstOrDefault(item => item.Id == itemId);
}
