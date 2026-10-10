using System.Net;
using System.Net.Http.Json;

namespace CalorieTracker.Tests;

/// <summary>Интеграционные тесты настроек и профиля (/settings, /me).</summary>
public sealed class ProfileSettingsApiTests : IClassFixture<CalorieTrackerFactory>
{
    private readonly CalorieTrackerFactory _factory;

    public ProfileSettingsApiTests(CalorieTrackerFactory factory) => _factory = factory;

    [Fact]
    public async Task Settings_Get_ReturnsDefaults()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.GetAsync("/api/v1/settings");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var settings = await response.ReadAsync<SettingsResponse>();
        Assert.Equal(2500, settings.DailyCalories);
        Assert.Equal("g", settings.WeightUnit);
        Assert.True(settings.NotificationsEnabled);
    }

    [Fact]
    public async Task Settings_Update_ReturnsAndPersists()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PutAsJsonAsync("/api/v1/settings", new
        {
            weightUnit = "kg",
            notificationsEnabled = false,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.ReadAsync<SettingsResponse>();
        Assert.Equal("kg", updated.WeightUnit);
        Assert.False(updated.NotificationsEnabled);

        var persisted = await (await client.GetAsync("/api/v1/settings"))
            .ReadAsync<SettingsResponse>();
        Assert.Equal("kg", persisted.WeightUnit);
        Assert.False(persisted.NotificationsEnabled);
    }

    [Fact]
    public async Task Me_Get_ReturnsProfile()
    {
        var (client, user) = await _factory.RegisterAsync();

        var response = await client.GetAsync("/api/v1/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var me = await response.ReadAsync<UserResponse>();
        Assert.Equal(user.Id, me.Id);
    }

    [Fact]
    public async Task Me_Update_ReturnsUpdatedProfile()
    {
        var (client, _) = await _factory.RegisterAsync();
        var newEmail = $"{Guid.NewGuid():N}@example.com";

        var response = await client.PutAsJsonAsync("/api/v1/me", new
        {
            name = "Обновлённое Имя",
            email = newEmail,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var me = await response.ReadAsync<UserResponse>();
        Assert.Equal("Обновлённое Имя", me.Name);
        Assert.Equal(newEmail, me.Email);
    }

    [Fact]
    public async Task Me_Update_EmailTaken_Returns409()
    {
        var (_, taken) = await _factory.RegisterAsync();
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PutAsJsonAsync("/api/v1/me", new
        {
            name = "Кто-то",
            email = taken.Email,
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Пользователь с таким email уже существует", error.Message);
    }

    [Fact]
    public async Task Me_ChangePassword_WrongCurrent_Returns400()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PutAsJsonAsync("/api/v1/me/password", new
        {
            currentPassword = "wrong-password",
            password = "NewPass1!",
            confirmPassword = "NewPass1!",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Неверный текущий пароль", error.Message);
    }

    [Fact]
    public async Task Me_ChangePassword_Valid_AllowsLoginWithNewPassword()
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        var (client, _) = await _factory.RegisterAsync(email, password: "Passw0rd!");

        var change = await client.PutAsJsonAsync("/api/v1/me/password", new
        {
            currentPassword = "Passw0rd!",
            password = "BrandNew1!",
            confirmPassword = "BrandNew1!",
        });
        Assert.Equal(HttpStatusCode.NoContent, change.StatusCode);

        var fresh = _factory.CreateClient();
        var login = await fresh.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email,
            password = "BrandNew1!",
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    [Fact]
    public async Task Me_ChangePassword_WeakNew_Returns400WithFieldErrors()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PutAsJsonAsync("/api/v1/me/password", new
        {
            currentPassword = "Passw0rd!",
            password = "short",
            confirmPassword = "short",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.NotNull(error.Errors);
        Assert.Contains("password", error.Errors!.Keys);
    }

    [Fact]
    public async Task Me_Delete_Returns204AndRevokesAccess()
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        var (client, _) = await _factory.RegisterAsync(email);

        var response = await client.DeleteAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        client.DefaultRequestHeaders.Clear();
        var me = await client.GetAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);

        var login = await _factory.CreateClient().PostAsJsonAsync("/api/v1/auth/login", new
        {
            email,
            password = "Passw0rd!",
        });
        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }
}
