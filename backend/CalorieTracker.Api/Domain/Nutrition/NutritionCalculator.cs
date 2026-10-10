using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Domain.Nutrition;

/// <summary>
/// Расчёт пищевой ценности по количеству. Повторяет округление клиентского
/// shared/calculations.ts: калории — до целого, БЖУ — до 0,1 (round-half-up;
/// для неотрицательных значений совпадает с Math.round).
///
/// Порции и суммы — вычисленные значения, поэтому верхняя граница «на 100 г»
/// (10 000) к ним не применяется: порция или итог дня законно превышают её.
/// </summary>
public static class NutritionCalculator
{
    /// <summary>Пищевая ценность порции продукта (quantity — в граммах).</summary>
    public static NutritionFacts Calculate(Product product, double quantityGrams)
    {
        var multiplier = quantityGrams / 100.0;
        return NutritionFacts.CreateTotal(
            RoundToInt(product.Calories * multiplier),
            RoundToTenth(product.Protein * multiplier),
            RoundToTenth(product.Fat * multiplier),
            RoundToTenth(product.Carbs * multiplier));
    }

    /// <summary>Сумма пищевой ценности по позициям (округление — по позиции).</summary>
    public static NutritionFacts Sum(IEnumerable<MealItem> items)
    {
        double calories = 0;
        double protein = 0;
        double fat = 0;
        double carbs = 0;

        foreach (var item in items)
        {
            var value = Calculate(item.Product, item.Quantity.Value);
            calories += value.Calories;
            protein += value.Protein;
            fat += value.Fat;
            carbs += value.Carbs;
        }

        return NutritionFacts.CreateTotal(calories, protein, fat, carbs);
    }

    private static double RoundToInt(double value) =>
        Math.Round(value, MidpointRounding.AwayFromZero);

    private static double RoundToTenth(double value) =>
        Math.Round(value * 10, MidpointRounding.AwayFromZero) / 10.0;
}
