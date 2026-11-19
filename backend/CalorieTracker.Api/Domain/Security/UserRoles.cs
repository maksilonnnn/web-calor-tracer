using CalorieTracker.Api.Domain;

namespace CalorieTracker.Api.Domain.Security;

/// <summary>
/// Строковые имена ролей для атрибутов авторизации:
/// <c>[Authorize(Roles = UserRoles.Admin)]</c>. Значения совпадают с
/// колонкой <c>users.role</c> и claim'ом роли в JWT.
/// </summary>
public static class UserRoles
{
    public const string User = "user";

    public const string Admin = "admin";

    /// <summary>Роль домена → значение для БД/токена/атрибута.</summary>
    public static string FromRole(UserRole role) => role switch
    {
        UserRole.User => User,
        UserRole.Admin => Admin,
        _ => throw new ArgumentOutOfRangeException(nameof(role), role, null),
    };

    /// <summary>Строковое значение из БД/токена → роль домена (неизвестное → user).</summary>
    public static UserRole ToRole(string? value) =>
        string.Equals(value, Admin, StringComparison.OrdinalIgnoreCase)
            ? UserRole.Admin
            : UserRole.User;
}
