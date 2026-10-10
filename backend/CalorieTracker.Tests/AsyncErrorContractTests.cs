using System.Net;
using System.Net.Http.Json;

namespace CalorieTracker.Tests;

/// <summary>
/// После перехода на async все коды и единый формат ошибок { message, errors? }
/// сохраняются: 400 валидации, 401 без сессии, 404 чужой/отсутствующей записи,
/// 409 занятого email.
/// </summary>
public sealed class AsyncErrorContractTests : IClassFixture<CalorieTrackerFactory>
{
    private readonly CalorieTrackerFactory _factory;

    public AsyncErrorContractTests(CalorieTrackerFactory factory) => _factory = factory;

    [Fact]
    public async Task ValidationError_KeepsMessageAndErrorsFormat()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = " ",
            email = "not-an-email",
            password = "1",
            confirmPassword = "2",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Данные заполнены неверно", error.Message);
        Assert.NotNull(error.Errors);
        Assert.Contains("name", error.Errors.Keys);
    }

    [Fact]
    public async Task Unauthorized_KeepsMessageFormat()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/diary");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Не авторизован", error.Message);
    }

    [Fact]
    public async Task NotFound_KeepsMessageFormat()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/diary/items/{Guid.NewGuid()}",
            new { quantity = 100 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Запись не найдена", error.Message);
    }

    [Fact]
    public async Task Conflict_KeepsMessageFormat()
    {
        var (client, user) = await _factory.RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "Другой Пользователь",
            email = user.Email,
            password = "Passw0rd!",
            confirmPassword = "Passw0rd!",
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Пользователь с таким email уже существует", error.Message);
    }
}