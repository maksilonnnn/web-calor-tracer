using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Infrastructure.InMemory.Seed;

/// <summary>
/// Каталог продуктов сида (значения на 100 г). Дословно совпадает с
/// PRODUCT_CATALOG мок-слоя (mock/seed.ts).
/// </summary>
internal static class ProductCatalog
{
    internal static readonly (string Name, double Calories, double Protein, double Fat, double Carbs, string Category)[] Entries =
    [
        ("Куриная грудка", 165, 31, 3.6, 0, "Мясо"),
        ("Рис белый", 130, 2.7, 0.3, 28, "Крупы"),
        ("Яйцо куриное", 155, 13, 11, 1.1, "Яйца"),
        ("Хлеб белый", 265, 9, 3.2, 49, "Выпечка"),
        ("Молоко 2.5%", 52, 2.8, 2.5, 4.7, "Молочные"),
        ("Яблоко", 52, 0.3, 0.2, 14, "Фрукты"),
        ("Творог 5%", 121, 17, 5, 1.8, "Молочные"),
        ("Гречка", 132, 4.2, 1.6, 25, "Крупы"),
    ];

    internal static IReadOnlyList<Product> CreateProducts()
    {
        var products = new List<Product>(Entries.Length);
        foreach (var (name, calories, protein, fat, carbs, category) in Entries)
        {
            products.Add(Product.Create(
                ProductName.Create(name),
                NutritionFacts.Create(calories, protein, fat, carbs),
                category));
        }

        return products;
    }
}
