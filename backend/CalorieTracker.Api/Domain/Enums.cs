namespace CalorieTracker.Api.Domain;

/// <summary>
/// Приём пищи. Порядок значений соответствует порядку отображения в UI
/// (завтрак, обед, ужин, перекус — MEAL_TYPES во фронтенде).
/// </summary>
public enum MealType
{
    Breakfast = 0,
    Lunch = 1,
    Dinner = 2,
    Snack = 3,
}

/// <summary>Единица отображения веса (в хранилище всегда граммы).</summary>
public enum WeightUnit
{
    G = 0,
    Kg = 1,
}
