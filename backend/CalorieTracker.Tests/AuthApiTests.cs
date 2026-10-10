using System.Net;
using System.Net.Http.Json;

namespace CalorieTracker.Tests;

/// <summary>Интеграционные тесты домена Auth: регистрация, вход, выход, /me.</summary>
public sealed class AuthApiTests : IClassFixture<CalorieTrackerFactory>
{
    private readonly CalorieTrackerFactory _factory;

    public AuthApiTests(CalorieTrackerFactory factory) => _factory = factory;

    [Fact]
    public async Task Register_Valid_Returns201WithHttpOnlyStrictCookie()
    {
        var client = _factory.CreateClient();
        var email = $"{Guid.NewGuid():N}@example.com";

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "Новый Пользователь",
            email,
            password = "Passw0rd!",
            confirmPassword = "Passw0rd!",
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = await response.ReadAsync<UserResponse>();
        Assert.Equal("Новый Пользователь", user.Name);
        Assert.Equal(email, user.Email);

        var cookie = response.FindCookieHeader("access_token");
        Assert.NotNull(cookie);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", cookie.Replace(" ", string.Empty), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Register_InvalidFields_Returns400WithFieldErrors()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "",
            email = "bad",
            password = "short",
            confirmPassword = "different",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Данные заполнены неверно", error.Message);
        Assert.NotNull(error.Errors);
        Assert.Contains("name", error.Errors!.Keys);
        Assert.Contains("email", error.Errors.Keys);
        Assert.Contains("password", error.Errors.Keys);
        Assert.Contains("confirmPassword", error.Errors.Keys);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        var first = await _factory.RegisterAsync(email);
        Assert.NotEqual(Guid.Empty, first.User.Id);

        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "Дубль",
            email = email.ToUpperInvariant(),
            password = "Passw0rd!",
            confirmPassword = "Passw0rd!",
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Пользователь с таким email уже существует", error.Message);
    }

    [Fact]
    public async Task Login_DemoAccount_Returns200()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = "alex@example.com",
            password = "Demo1234!",
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var user = await response.ReadAsync<UserResponse>();
        Assert.Equal("alex@example.com", user.Email);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401WithGenericMessage()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = "alex@example.com",
            password = "wrong-password",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Неверный email или пароль", error.Message);
    }

    [Fact]
    public async Task Me_WithoutCookie_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Не авторизован", error.Message);
    }

    [Fact]
    public async Task Me_AfterRegister_ReturnsCurrentUser()
    {
        var (client, user) = await _factory.RegisterAsync();

        var response = await client.GetAsync("/api/v1/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var me = await response.ReadAsync<UserResponse>();
        Assert.Equal(user.Id, me.Id);
    }

    [Fact]
    public async Task Logout_Returns204AndClearsSession()
    {
        var (client, _) = await _factory.RegisterAsync();

        var logout = await client.PostAsync("/api/v1/auth/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

        client.DefaultRequestHeaders.Clear();
        var me = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
    }

    [Fact]
    public async Task Register_NoBody_Returns400Not500()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(string.Empty, System.Text.Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Данные заполнены неверно", error.Message);
    }
}
