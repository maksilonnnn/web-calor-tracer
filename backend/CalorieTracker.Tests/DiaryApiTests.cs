using System.Net;
using System.Net.Http.Json;

namespace CalorieTracker.Tests;

/// <summary>Интеграционные тесты домена Diary: добавление, чтение, изменение, удаление.</summary>
public sealed class DiaryApiTests : IClassFixture<CalorieTrackerFactory>
{
    private readonly CalorieTrackerFactory _factory;

    public DiaryApiTests(CalorieTrackerFactory factory) => _factory = factory;

    private static string Today => DateOnly.FromDateTime(DateTime.Now).ToString("yyyy-MM-dd");

    private static object FoodPayload(string name = "Банан", double quantity = 120, double calories = 89) => new
    {
        date = Today,
        mealType = "breakfast",
        product = new
        {
            name,
            calories,
            protein = 1.1,
            fat = 0.3,
            carbs = 23,
            category = "Фрукты",
        },
        quantity,
    };

    [Fact]
    public async Task AddFood_Valid_Returns201WithFourMeals()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/v1/diary/items", FoodPayload());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var entry = await response.ReadAsync<DiaryResponse>();
        Assert.Equal(Today, entry.Date);
        Assert.Equal(4, entry.Meals.Count);
        var breakfast = entry.Meals.Single(meal => meal.Type == "breakfast");
        var item = Assert.Single(breakfast.Items);
        Assert.Equal(120, item.Quantity);
        Assert.Equal("Банан", item.Product.Name);
        Assert.Equal(89, item.Product.Calories);
    }

    [Fact]
    public async Task GetDay_NewDate_ReturnsFourEmptyMeals()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.GetAsync($"/api/v1/diary?date={Today}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var entry = await response.ReadAsync<DiaryResponse>();
        Assert.Equal(4, entry.Meals.Count);
        Assert.All(entry.Meals, meal => Assert.Empty(meal.Items));
    }

    [Fact]
    public async Task AddFood_Invalid_Returns400WithFieldErrors()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/v1/diary/items", new
        {
            date = Today,
            mealType = "lunch",
            product = new { name = "", calories = -5, protein = 0, fat = 0, carbs = 0 },
            quantity = 0,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Данные заполнены неверно", error.Message);
        Assert.NotNull(error.Errors);
        Assert.Contains("name", error.Errors!.Keys);
        Assert.Contains("quantity", error.Errors.Keys);
        Assert.Contains("calories", error.Errors.Keys);
    }

    [Fact]
    public async Task AddFood_InvalidDate_Returns400()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PostAsJsonAsync("/api/v1/diary/items", new
        {
            date = "10-10-2026",
            mealType = "lunch",
            product = new { name = "Тест", calories = 10, protein = 0, fat = 0, carbs = 0 },
            quantity = 100,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Некорректная дата", error.Message);
    }

    [Fact]
    public async Task UpdateQuantity_Valid_Returns200()
    {
        var (client, _) = await _factory.RegisterAsync();
        var added = await (await client.PostAsJsonAsync("/api/v1/diary/items", FoodPayload()))
            .ReadAsync<DiaryResponse>();
        var itemId = added.Meals.SelectMany(meal => meal.Items).Single().Id;

        var response = await client.PutAsJsonAsync(
            $"/api/v1/diary/items/{itemId}",
            new { quantity = 250 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var entry = await response.ReadAsync<DiaryResponse>();
        Assert.Equal(250, entry.Meals.SelectMany(meal => meal.Items).Single().Quantity);
    }

    [Fact]
    public async Task UpdateItem_WithProduct_Returns200AndUpdatesProductAndQuantity()
    {
        var (client, _) = await _factory.RegisterAsync();
        var added = await (await client.PostAsJsonAsync("/api/v1/diary/items", FoodPayload("Банан", 120, 89)))
            .ReadAsync<DiaryResponse>();
        var itemId = added.Meals.SelectMany(meal => meal.Items).Single().Id;

        var response = await client.PutAsJsonAsync($"/api/v1/diary/items/{itemId}", new
        {
            quantity = 200,
            product = new { name = "Груша", calories = 57, protein = 0.4, fat = 0.1, carbs = 15, category = "Фрукты" },
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var entry = await response.ReadAsync<DiaryResponse>();
        var item = entry.Meals.SelectMany(meal => meal.Items).Single();
        Assert.Equal(200, item.Quantity);
        Assert.Equal("Груша", item.Product.Name);
        Assert.Equal(57, item.Product.Calories);
        Assert.Equal(0.4, item.Product.Protein);
        Assert.Equal(0.1, item.Product.Fat);
        Assert.Equal(15, item.Product.Carbs);
    }

    [Fact]
    public async Task UpdateItem_InvalidProduct_Returns400WithFieldErrors()
    {
        var (client, _) = await _factory.RegisterAsync();
        var added = await (await client.PostAsJsonAsync("/api/v1/diary/items", FoodPayload()))
            .ReadAsync<DiaryResponse>();
        var itemId = added.Meals.SelectMany(meal => meal.Items).Single().Id;

        var response = await client.PutAsJsonAsync($"/api/v1/diary/items/{itemId}", new
        {
            quantity = 100,
            product = new { name = "", calories = -5, protein = 0, fat = 0, carbs = 0 },
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Данные заполнены неверно", error.Message);
        Assert.Contains("name", error.Errors!.Keys);
        Assert.Contains("calories", error.Errors.Keys);
    }

    [Fact]
    public async Task UpdateQuantity_UnknownItem_Returns404()
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
    public async Task UpdateQuantity_InvalidIdFormat_Returns400()
    {
        var (client, _) = await _factory.RegisterAsync();

        var response = await client.PutAsJsonAsync(
            "/api/v1/diary/items/not-a-guid",
            new { quantity = 100 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.ReadErrorAsync();
        Assert.Equal("Некорректный идентификатор", error.Message);
    }

    [Fact]
    public async Task RemoveItem_Valid_Returns200AndRemoves()
    {
        var (client, _) = await _factory.RegisterAsync();
        var added = await (await client.PostAsJsonAsync("/api/v1/diary/items", FoodPayload()))
            .ReadAsync<DiaryResponse>();
        var itemId = added.Meals.SelectMany(meal => meal.Items).Single().Id;

        var response = await client.DeleteAsync($"/api/v1/diary/items/{itemId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var entry = await response.ReadAsync<DiaryResponse>();
        Assert.Empty(entry.Meals.SelectMany(meal => meal.Items));
    }

    [Fact]
    public async Task UpdateQuantity_ForeignItem_Returns404()
    {
        var (owner, _) = await _factory.RegisterAsync();
        var (other, _) = await _factory.RegisterAsync();

        var added = await (await owner.PostAsJsonAsync("/api/v1/diary/items", FoodPayload()))
            .ReadAsync<DiaryResponse>();
        var itemId = added.Meals.SelectMany(meal => meal.Items).Single().Id;

        var response = await other.PutAsJsonAsync(
            $"/api/v1/diary/items/{itemId}",
            new { quantity = 100 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetHistory_IsPagedAndFilteredByUser()
    {
        var (client, _) = await _factory.RegisterAsync();
        await client.PostAsJsonAsync("/api/v1/diary/items", FoodPayload());

        var response = await client.GetAsync("/api/v1/diary/history?page=1&pageSize=20");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.ReadAsync<PagedResponse<Dictionary<string, object>>>();
        Assert.Equal(1, page.Page);
        Assert.Equal(20, page.PageSize);
        Assert.Equal(1, page.TotalCount);
    }

    [Fact]
    public async Task Diary_WithoutAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/v1/diary?date={Today}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Dashboard_ReflectsAddedFood()
    {
        var (client, _) = await _factory.RegisterAsync();
        await client.PostAsJsonAsync("/api/v1/diary/items", FoodPayload("Гречка", 100, 132));

        var response = await client.GetAsync($"/api/v1/dashboard?date={Today}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dashboard = await response.ReadAsync<DashboardResponse>();
        Assert.Equal(132, dashboard.TotalCalories);
        Assert.Equal(4, dashboard.Meals.Count);
        Assert.Contains(dashboard.RecentProducts, product => product.Name == "Гречка");
        Assert.Equal(2500, dashboard.Goals.Calories);
    }
}
