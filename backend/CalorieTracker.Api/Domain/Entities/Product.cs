using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Domain.Entities;

/// <summary>
/// Продукт: пищевая ценность указана на 100 г. Используется и как запись
/// каталога, и как снимок внутри позиции дневника (как в мок-слое: при
/// добавлении еды создаётся отдельный продукт с собственным id).
/// </summary>
public sealed class Product
{
    public Guid Id { get; }

    public ProductName Name { get; private set; }

    public NutritionFacts Nutrition { get; private set; }

    /// <summary>Необязательная категория (например «Мясо», «Крупы»).</summary>
    public string? Category { get; private set; }

    private Product(Guid id, ProductName name, NutritionFacts nutrition, string? category)
    {
        Id = id;
        Name = name;
        Nutrition = nutrition;
        Category = category;
    }

    public static Product Create(
        ProductName name,
        NutritionFacts nutrition,
        string? category = null,
        Guid? id = null) =>
        new(id ?? Guid.NewGuid(), name, nutrition, NormalizeCategory(category));

    public double Calories => Nutrition.Calories;

    public double Protein => Nutrition.Protein;

    public double Fat => Nutrition.Fat;

    public double Carbs => Nutrition.Carbs;

    public void UpdateDetails(ProductName name, NutritionFacts nutrition, string? category)
    {
        Name = name;
        Nutrition = nutrition;
        Category = NormalizeCategory(category);
    }

    private static string? NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return null;
        }

        return category.Trim();
    }
}
