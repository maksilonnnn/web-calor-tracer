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

/// <summary>
/// Роль пользователя. В БД и JWT хранится строкой в нижнем регистре
/// (<c>user</c>/<c>admin</c>), см. <c>DbEnums</c> и <c>UserRoles</c>.
/// </summary>
public enum UserRole
{
    User = 0,
    Admin = 1,
}
