using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace CalorieTracker.Tests;

/// <summary>Вспомогательные методы для интеграционных тестов HTTP-контракта.</summary>
internal static class TestHttp
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>Читает тело ответа как типизированный DTO.</summary>
    public static async Task<T> ReadAsync<T>(this HttpResponseMessage response)
    {
        var value = await response.Content.ReadFromJsonAsync<T>(Json);
        return value ?? throw new InvalidOperationException("Пустое тело ответа.");
    }

    /// <summary>Читает единый формат ошибки { message, errors? }.</summary>
    public static async Task<ErrorBody> ReadErrorAsync(this HttpResponseMessage response)
    {
        var raw = await response.Content.ReadAsStringAsync();
        var value = JsonSerializer.Deserialize<ErrorBody>(raw, Json);
        Assert.NotNull(value);
        return value!;
    }

    /// <summary>Регистрирует пользователя и возвращает клиент с cookie сессии.</summary>
    public static async Task<(HttpClient Client, UserResponse User)> RegisterAsync(
        this CalorieTrackerFactory factory,
        string? email = null,
        string name = "Тест Тестов",
        string password = "Passw0rd!")
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name,
            email = email ?? $"{Guid.NewGuid():N}@example.com",
            password,
            confirmPassword = password,
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = await response.ReadAsync<UserResponse>();
        return (client, user);
    }

    /// <summary>Извлекает cookie access_token из Set-Cookie (для проверки флагов).</summary>
    public static string? FindCookieHeader(this HttpResponseMessage response, string name)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values))
        {
            return null;
        }

        return values.FirstOrDefault(value =>
            value.StartsWith($"{name}=", StringComparison.OrdinalIgnoreCase));
    }
}

internal sealed record UserResponse(Guid Id, string Name, string Email);

internal sealed record ErrorBody(string Message, Dictionary<string, string[]>? Errors);

internal sealed record ProductResponse(
    Guid Id,
    string Name,
    double Calories,
    double Protein,
    double Fat,
    double Carbs,
    string? Category);

internal sealed record MealItemResponse(Guid Id, ProductResponse Product, double Quantity);

internal sealed record MealResponse(Guid Id, string Type, List<MealItemResponse> Items);

internal sealed record DiaryResponse(Guid Id, string Date, List<MealResponse> Meals);

internal sealed record SettingsResponse(
    double DailyCalories,
    double DailyProtein,
    double DailyFat,
    double DailyCarbs,
    string WeightUnit,
    bool NotificationsEnabled);

internal sealed record DashboardResponse(
    string Date,
    double TotalCalories,
    double TotalProtein,
    double TotalFat,
    double TotalCarbs,
    List<DashboardMealResponse> Meals,
    List<ProductResponse> RecentProducts,
    DashboardGoalsResponse Goals);

internal sealed record DashboardMealResponse(string Type, double Calories, int ItemsCount);

internal sealed record DashboardGoalsResponse(double Calories, double Protein, double Fat, double Carbs);

internal sealed record PagedResponse<T>(List<T> Items, int Page, int PageSize, int TotalCount, int TotalPages);
