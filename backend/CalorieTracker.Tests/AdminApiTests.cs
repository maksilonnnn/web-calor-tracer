using System.Net;
using System.Net.Http.Json;
using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Domain.ValueObjects;
using Microsoft.Extensions.DependencyInjection;

namespace CalorieTracker.Tests;

/// <summary>Интеграционные тесты ролей, блокировки и админ-API.</summary>
public sealed class AdminApiTests : IClassFixture<CalorieTrackerFactory>
{
    private const string AdminLogin = "admin";
    private const string AdminEmail = "admin@example.com";
    private const string AdminPassword = "Admin1234!";

    private readonly CalorieTrackerFactory _factory;

    public AdminApiTests(CalorieTrackerFactory factory) => _factory = factory;

    [Fact]
    public async Task AdminSeed_HasAdminRole_AndCanReadUsers()
    {
        var client = await LoginAsync(AdminLogin, AdminPassword);

        var response = await client.GetAsync("/api/v1/admin/users");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.ReadAsync<PagedResponse<AdminUserResponse>>();
        Assert.Contains(page.Items, user => user.Email == AdminEmail && user.Role == UserRoles.Admin);
        Assert.Contains(page.Items, user => user.Email == "alex@example.com" && user.Role == UserRoles.User);
    }

    [Fact]
    public async Task RegularUser_Gets403_WithUnifiedErrorBody()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.GetAsync("/api/v1/admin/users");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Доступ запрещён", error.Message);
    }

    [Fact]
    public async Task Anonymous_Gets401_WithUnifiedErrorBody()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/admin/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Не авторизован", error.Message);
    }

    [Fact]
    public async Task Admin_CanBlockAndUnblock_User()
    {
        var admin = await LoginAsync(AdminLogin, AdminPassword);
        var (_, user) = await _factory.RegisterAsync();

        var block = await admin.PutAsync($"/api/v1/admin/users/{user.Id}/block", null);
        Assert.Equal(HttpStatusCode.OK, block.StatusCode);
        Assert.True((await block.ReadAsync<AdminUserResponse>()).IsBlocked);

        var list = await admin.GetAsync($"/api/v1/admin/users?search={Uri.EscapeDataString(user.Email)}");
        var page = await list.ReadAsync<PagedResponse<AdminUserResponse>>();
        var found = Assert.Single(page.Items);
        Assert.True(found.IsBlocked);

        var unblock = await admin.PutAsync($"/api/v1/admin/users/{user.Id}/unblock", null);
        Assert.Equal(HttpStatusCode.OK, unblock.StatusCode);
        Assert.False((await unblock.ReadAsync<AdminUserResponse>()).IsBlocked);

        list = await admin.GetAsync($"/api/v1/admin/users?search={Uri.EscapeDataString(user.Email)}");
        page = await list.ReadAsync<PagedResponse<AdminUserResponse>>();
        Assert.False(Assert.Single(page.Items).IsBlocked);
    }

    [Fact]
    public async Task BlockedUser_CannotLogin_AndOldTokenIsRejected()
    {
        var admin = await LoginAsync(AdminLogin, AdminPassword);
        var (oldSession, user) = await _factory.RegisterAsync();

        var block = await admin.PutAsync($"/api/v1/admin/users/{user.Id}/block", null);
        Assert.Equal(HttpStatusCode.OK, block.StatusCode);

        var freshClient = _factory.CreateClient();
        var login = await freshClient.PostAsJsonAsync("/api/v1/auth/login", new
        {
            login = user.Login,
            password = "Passw0rd!",
        });

        Assert.Equal(HttpStatusCode.Forbidden, login.StatusCode);
        var loginError = await login.ReadErrorAsync();
        Assert.Equal("Аккаунт заблокирован", loginError.Message);

        // Токен ещё не истёк, но проверка блокировки по БД на каждом запросе
        // превращает живую сессию в 401.
        var me = await oldSession.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
        var meError = await me.ReadErrorAsync();
        Assert.Equal("Не авторизован", meError.Message);
    }

    [Fact]
    public async Task Admin_CannotBlockSelf()
    {
        var admin = await LoginAsync(AdminLogin, AdminPassword);
        var me = await admin.GetAsync("/api/v1/auth/me");
        var current = await me.ReadAsync<UserResponse>();

        var response = await admin.PutAsync($"/api/v1/admin/users/{current.Id}/block", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Нельзя изменить блокировку собственного аккаунта", error.Message);
    }

    [Fact]
    public async Task Admin_CannotBlockAnotherAdmin()
    {
        var admin = await LoginAsync(AdminLogin, AdminPassword);
        var otherAdmin = await CreateAdminAsync();

        var response = await admin.PutAsync($"/api/v1/admin/users/{otherAdmin.Id}/block", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Нельзя изменить блокировку администратора", error.Message);
    }

    [Fact]
    public async Task Register_CommonPassword_Returns400WithPasswordError()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "Слабый Пароль",
            login = $"u{Guid.NewGuid():N}",
            email = $"{Guid.NewGuid():N}@example.com",
            password = "qwerty123",
            repeatPassword = "qwerty123",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.NotNull(error.Errors);
        Assert.Contains("password", error.Errors!.Keys);
        Assert.Contains("Пароль слишком простой", error.Errors["password"]);
    }

    [Fact]
    public async Task AdminList_DoesNotExposePasswordHash()
    {
        var admin = await LoginAsync(AdminLogin, AdminPassword);

        var response = await admin.GetAsync("/api/v1/admin/users");
        var raw = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain("passwordHash", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("password_hash", raw, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<HttpClient> LoginAsync(string login, string password)
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { login, password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return client;
    }

    /// <summary>Создаёт второго администратора напрямую через репозиторий (роль через API не выдаётся).</summary>
    private async Task<User> CreateAdminAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var admin = User.Create(
            Login.Create($"admin{Guid.NewGuid():N}"[..20]),
            PersonName.Create("Второй Администратор"),
            Email.Create($"{Guid.NewGuid():N}@example.com"),
            hasher.Hash(AdminPassword),
            role: UserRole.Admin);
        await users.AddAsync(admin);
        return admin;
    }
}

internal sealed record AdminUserResponse(
    Guid Id,
    string Name,
    string Email,
    string Role,
    bool IsBlocked,
    DateTimeOffset CreatedAt);
