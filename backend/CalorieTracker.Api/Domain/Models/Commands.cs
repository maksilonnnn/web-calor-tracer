namespace CalorieTracker.Api.Domain.Models;

/// <summary>Команда регистрации (поля формы регистрации).</summary>
public sealed class RegisterCommand
{
    public string Name { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    public string ConfirmPassword { get; init; } = string.Empty;
}

/// <summary>Команда входа.</summary>
public sealed class LoginCommand
{
    public string Email { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;
}

/// <summary>Команда обновления профиля (имя/email).</summary>
public sealed class ProfileUpdateCommand
{
    public string Name { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;
}

/// <summary>Команда смены пароля.</summary>
public sealed class ChangePasswordCommand
{
    public string CurrentPassword { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    public string ConfirmPassword { get; init; } = string.Empty;
}

/// <summary>Команда частичного обновления настроек.</summary>
public sealed class SettingsUpdateCommand
{
    public WeightUnit? WeightUnit { get; init; }

    public bool? NotificationsEnabled { get; init; }
}

/// <summary>Команда добавления продукта в дневник.</summary>
public sealed class AddFoodCommand
{
    public string Date { get; init; } = string.Empty;

    public MealType MealType { get; init; }

    public ProductInput Product { get; init; } = new();

    public double Quantity { get; init; }
}

/// <summary>
/// Команда изменения позиции дневника: количество и опционально новые данные
/// продукта (снимка). Без Product меняется только количество.
/// </summary>
public sealed class UpdateItemCommand
{
    public double Quantity { get; init; }

    public ProductInput? Product { get; init; }
}
