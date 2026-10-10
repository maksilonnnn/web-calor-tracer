using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Domain.Models;

/// <summary>Пищевая ценность нового продукта (на 100 г) из формы добавления еды.</summary>
public sealed class ProductInput
{
    public string Name { get; init; } = string.Empty;

    public double Calories { get; init; }

    public double Protein { get; init; }

    public double Fat { get; init; }

    public double Carbs { get; init; }

    public string? Category { get; init; }

    /// <summary>
    /// Валидирует поля и создаёт новый продукт (со своим id). Имена полей
    /// ошибок совпадают с формой: name, calories, protein, fat, carbs.
    /// </summary>
    public Product ToProduct(Guid? id = null)
    {
        var errors = new ValidationErrors();
        errors.Add("name", DomainValidation.ProductName(Name));
        errors.ThrowIfAny();

        var nutrition = NutritionFacts.Create(Calories, Protein, Fat, Carbs);
        return Product.Create(ProductName.Create(Name), nutrition, Category, id);
    }
}
