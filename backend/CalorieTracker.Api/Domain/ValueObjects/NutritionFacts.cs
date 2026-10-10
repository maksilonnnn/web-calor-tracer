using CalorieTracker.Api.Domain.Common;

namespace CalorieTracker.Api.Domain.ValueObjects;

/// <summary>
/// Пищевая ценность: калории, белки, жиры, углеводы. Значения неотрицательны;
/// ошибки раскладываются по полям формы (<c>calories</c>, <c>protein</c>,
/// <c>fat</c>, <c>carbs</c>).
///
/// Две фабрики с разными правилами:
///  - <see cref="Create"/> — значения «на 100 г» из формы: кап сверху
///    (<see cref="DomainValidation.MaxNutrientPer100g"/>) применяется;
///  - <see cref="CreateTotal"/> — вычисленная порция/итог дня: кап «на 100 г»
///    НЕ применяется, итог может законно превышать его.
/// </summary>
public sealed class NutritionFacts : IEquatable<NutritionFacts>
{
    public double Calories { get; }

    public double Protein { get; }

    public double Fat { get; }

    public double Carbs { get; }

    private NutritionFacts(double calories, double protein, double fat, double carbs)
    {
        Calories = calories;
        Protein = protein;
        Fat = fat;
        Carbs = carbs;
    }

    /// <summary>
    /// Значения «на 100 г» из формы добавления/редактирования: только
    /// неотрицательные и не выше верхней границы.
    /// </summary>
    public static NutritionFacts Create(double calories, double protein, double fat, double carbs)
    {
        var errors = new ValidationErrors();
        errors.Add("calories", DomainValidation.NonNegative(calories));
        errors.Add("protein", DomainValidation.NonNegative(protein));
        errors.Add("fat", DomainValidation.NonNegative(fat));
        errors.Add("carbs", DomainValidation.NonNegative(carbs));
        errors.ThrowIfAny();
        return new NutritionFacts(calories, protein, fat, carbs);
    }

    /// <summary>
    /// Вычисленная порция или итог дня: только неотрицательность. Верхняя
    /// граница «на 100 г» не применяется — порция/итог законно превышают её.
    /// </summary>
    public static NutritionFacts CreateTotal(double calories, double protein, double fat, double carbs)
    {
        var errors = new ValidationErrors();
        errors.Add("calories", DomainValidation.NonNegativeTotal(calories));
        errors.Add("protein", DomainValidation.NonNegativeTotal(protein));
        errors.Add("fat", DomainValidation.NonNegativeTotal(fat));
        errors.Add("carbs", DomainValidation.NonNegativeTotal(carbs));
        errors.ThrowIfAny();
        return new NutritionFacts(calories, protein, fat, carbs);
    }

    public static NutritionFacts Zero => new(0, 0, 0, 0);

    public bool Equals(NutritionFacts? other) =>
        other is not null
        && Calories.Equals(other.Calories)
        && Protein.Equals(other.Protein)
        && Fat.Equals(other.Fat)
        && Carbs.Equals(other.Carbs);

    public override bool Equals(object? obj) => Equals(obj as NutritionFacts);

    public override int GetHashCode() => HashCode.Combine(Calories, Protein, Fat, Carbs);
}
