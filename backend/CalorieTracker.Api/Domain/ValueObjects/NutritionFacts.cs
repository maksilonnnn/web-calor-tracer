using CalorieTracker.Api.Domain.Common;

namespace CalorieTracker.Api.Domain.ValueObjects;

/// <summary>
/// Пищевая ценность на 100 г: калории, белки, жиры, углеводы. Каждое
/// значение неотрицательно и ограничено сверху; ошибки раскладываются по
/// полям формы (<c>calories</c>, <c>protein</c>, <c>fat</c>, <c>carbs</c>).
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
