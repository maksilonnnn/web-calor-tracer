using CalorieTracker.Api.Domain;

namespace CalorieTracker.Api.Presentation.Contracts;

/// <summary>Тело запроса auth.register.</summary>
public sealed class RegisterRequest
{
    public string? Name { get; init; }

    public string? Email { get; init; }

    public string? Password { get; init; }

    public string? ConfirmPassword { get; init; }
}

/// <summary>Тело запроса auth.login.</summary>
public sealed class LoginRequest
{
    public string? Email { get; init; }

    public string? Password { get; init; }
}

/// <summary>Пищевая ценность продукта (на 100 г) в запросе добавления еды.</summary>
public sealed class FoodInputRequest
{
    public string? Name { get; init; }

    public double Calories { get; init; }

    public double Protein { get; init; }

    public double Fat { get; init; }

    public double Carbs { get; init; }

    public string? Category { get; init; }
}

/// <summary>Тело запроса diary.addFood.</summary>
public sealed class AddFoodRequest
{
    public string? Date { get; init; }

    public MealType MealType { get; init; }

    public FoodInputRequest? Product { get; init; }

    public double Quantity { get; init; }
}

/// <summary>
/// Тело запроса diary.updateItem: количество и опционально новые данные
/// продукта (на 100 г). Без product меняется только количество.
/// </summary>
public sealed class UpdateItemRequest
{
    public double Quantity { get; init; }

    public FoodInputRequest? Product { get; init; }
}

/// <summary>Тело запроса частичного обновления настроек.</summary>
public sealed class SettingsUpdateRequest
{
    public WeightUnit? WeightUnit { get; init; }

    public bool? NotificationsEnabled { get; init; }
}

/// <summary>Тело запроса обновления профиля.</summary>
public sealed class ProfileUpdateRequest
{
    public string? Name { get; init; }

    public string? Email { get; init; }
}

/// <summary>Тело запроса смены пароля.</summary>
public sealed class ChangePasswordRequest
{
    public string? CurrentPassword { get; init; }

    public string? Password { get; init; }

    public string? ConfirmPassword { get; init; }
}
