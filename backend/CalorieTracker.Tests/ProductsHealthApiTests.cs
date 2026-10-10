using System.Net;
using System.Net.Http.Json;

namespace CalorieTracker.Tests;

/// <summary>Интеграционные тесты каталога продуктов, health и утечек полей.</summary>
public sealed class ProductsHealthApiTests : IClassFixture<CalorieTrackerFactory>
{
    private readonly CalorieTrackerFactory _factory;

    public ProductsHealthApiTests(CalorieTrackerFactory factory) => _factory = factory;

    [Fact]
    public async Task Health_Returns200()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Products_DefaultPage_ContainsSeedCatalog()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.GetAsync("/api/v1/products");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.ReadAsync<PagedResponse<ProductResponse>>();
        Assert.Equal(1, page.Page);
        Assert.Equal(20, page.PageSize);
        Assert.True(page.TotalCount >= 8);
        Assert.True(page.Items.Count >= 8);

        // Сортировка по названию (без учёта регистра).
        var names = page.Items.Select(product => product.Name).ToList();
        Assert.Equal(names.OrderBy(name => name, StringComparer.OrdinalIgnoreCase).ToList(), names);
    }

    [Fact]
    public async Task Products_SecondPage_ReportsTotals()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.GetAsync("/api/v1/products?page=2&pageSize=5");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.ReadAsync<PagedResponse<ProductResponse>>();
        Assert.Equal(2, page.Page);
        Assert.Equal(5, page.PageSize);
        Assert.Equal(page.TotalCount - 5, page.Items.Count);
        Assert.True(page.TotalCount >= 8);
        Assert.Equal((int)Math.Ceiling(page.TotalCount / 5.0), page.TotalPages);
    }

    [Theory]
    [InlineData("/api/v1/products?page=0&pageSize=20")]
    [InlineData("/api/v1/products?page=1&pageSize=0")]
    [InlineData("/api/v1/products?page=1&pageSize=101")]
    public async Task Products_InvalidPagination_Returns400(string url)
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Некорректные параметры пагинации", error.Message);
    }

    [Fact]
    public async Task Products_WithoutAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/products");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuthResponses_DoNotExposePasswordHash()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "Безопасный",
            email = $"{Guid.NewGuid():N}@example.com",
            password = "Passw0rd!",
            confirmPassword = "Passw0rd!",
        });

        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("passwordHash", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"password\"", raw, StringComparison.OrdinalIgnoreCase);

        var me = await client.GetAsync("/api/v1/auth/me");
        var meRaw = await me.Content.ReadAsStringAsync();
        Assert.DoesNotContain("passwordHash", meRaw, StringComparison.OrdinalIgnoreCase);
    }
}
