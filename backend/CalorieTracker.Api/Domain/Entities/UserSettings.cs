namespace CalorieTracker.Api.Domain.Entities;

/// <summary>
/// Пользовательские настройки: дневные нормы, единица отображения веса и
/// флаг уведомлений. Совпадает с DEFAULT_SETTINGS фронтенда.
/// </summary>
public sealed class UserSettings
{
    public Guid UserId { get; }

    public double DailyCalories { get; private set; }

    public double DailyProtein { get; private set; }

    public double DailyFat { get; private set; }

    public double DailyCarbs { get; private set; }

    public WeightUnit WeightUnit { get; private set; }

    public bool NotificationsEnabled { get; private set; }

    private UserSettings(
        Guid userId,
        double dailyCalories,
        double dailyProtein,
        double dailyFat,
        double dailyCarbs,
        WeightUnit weightUnit,
        bool notificationsEnabled)
    {
        UserId = userId;
        DailyCalories = dailyCalories;
        DailyProtein = dailyProtein;
        DailyFat = dailyFat;
        DailyCarbs = dailyCarbs;
        WeightUnit = weightUnit;
        NotificationsEnabled = notificationsEnabled;
    }

    /// <summary>Настройки по умолчанию (DEFAULT_SETTINGS фронтенда).</summary>
    public static UserSettings CreateDefault(Guid userId) =>
        new(userId, 2500, 150, 83, 300, WeightUnit.G, true);

    public static UserSettings Create(
        Guid userId,
        double dailyCalories,
        double dailyProtein,
        double dailyFat,
        double dailyCarbs,
        WeightUnit weightUnit,
        bool notificationsEnabled) =>
        new(userId, dailyCalories, dailyProtein, dailyFat, dailyCarbs, weightUnit, notificationsEnabled);

    /// <summary>Частичное обновление: переданные поля накладываются на текущие.</summary>
    public void Update(WeightUnit? weightUnit, bool? notificationsEnabled)
    {
        if (weightUnit is not null)
        {
            WeightUnit = weightUnit.Value;
        }

        if (notificationsEnabled is not null)
        {
            NotificationsEnabled = notificationsEnabled.Value;
        }
    }
}
