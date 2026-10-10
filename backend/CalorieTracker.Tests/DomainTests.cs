using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Exceptions;
using CalorieTracker.Api.Domain.Nutrition;
using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Tests;

/// <summary>Юнит-тесты доменного слоя: валидация, VO, расчёт питания, пагинация.</summary>
public sealed class DomainTests
{
    [Fact]
    public void Name_Blank_ReturnsRequiredText()
    {
        Assert.Equal(new[] { ValidationTexts.Required }, DomainValidation.Name("   "));
    }

    [Fact]
    public void Name_TooLong_ReturnsLengthText()
    {
        var value = new string('Я', DomainValidation.NameMaxLength + 1);
        Assert.Equal(new[] { ValidationTexts.NameLength }, DomainValidation.Name(value));
    }

    [Fact]
    public void Email_InvalidFormat_ReturnsFormatText()
    {
        Assert.Equal(new[] { ValidationTexts.EmailFormat }, DomainValidation.Email("not-an-email"));
    }

    [Fact]
    public void Password_Weak_ReturnsAllViolations()
    {
        var texts = DomainValidation.Password("abc");
        Assert.Contains(ValidationTexts.PasswordMin, texts);
        Assert.Contains(ValidationTexts.PasswordDigit, texts);
        Assert.Contains(ValidationTexts.PasswordSpecial, texts);
        Assert.DoesNotContain(ValidationTexts.PasswordLetter, texts);
    }

    [Fact]
    public void Password_Valid_ReturnsNoErrors()
    {
        Assert.Empty(DomainValidation.Password("Demo1234!"));
    }

    [Fact]
    public void ConfirmPassword_Mismatch_ReturnsMismatch()
    {
        Assert.Equal(new[] { ValidationTexts.PasswordMismatch }, DomainValidation.ConfirmPassword("abc12345", "xyz12345"));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(double.NaN)]
    [InlineData(double.PositiveInfinity)]
    public void Quantity_NonPositiveOrNonFinite_ReturnsPositiveText(double value)
    {
        Assert.Equal(new[] { ValidationTexts.QuantityPositive }, DomainValidation.Quantity(value));
    }

    [Fact]
    public void Quantity_AboveUpperBound_ReturnsTooLargeText()
    {
        Assert.Equal(new[] { ValidationTexts.QuantityTooLarge }, DomainValidation.Quantity(DomainValidation.MaxQuantityGrams + 1));
    }

    [Fact]
    public void Email_ValueObject_TrimsAndComparesCaseInsensitively()
    {
        var a = Email.Create("  User@Example.com ");
        var b = Email.Create("user@example.com");
        Assert.Equal("User@Example.com", a.Value);
        Assert.True(a.Equals(b));
    }

    [Fact]
    public void NutritionFacts_Negative_ThrowsWithFieldErrors()
    {
        var exception = Assert.Throws<DomainValidationException>(
            () => NutritionFacts.Create(-1, 0, 0, 0));
        Assert.Equal(ValidationTexts.InvalidForm, exception.Message);
        Assert.True(exception.Errors.ContainsKey("calories"));
        Assert.Equal(ValidationTexts.NutritionNonNegative, exception.Errors["calories"][0]);
    }

    [Fact]
    public void GramAmount_Zero_ThrowsWithQuantityError()
    {
        var exception = Assert.Throws<DomainValidationException>(() => GramAmount.Create(0));
        Assert.True(exception.Errors.ContainsKey("quantity"));
    }

    [Fact]
    public void NutritionCalculator_RoundsLikeClient()
    {
        var product = Product.Create(
            ProductName.Create("Куриная грудка"),
            NutritionFacts.Create(165, 31, 3.6, 0));

        var value = NutritionCalculator.Calculate(product, 150);

        Assert.Equal(248, value.Calories); // 247.5 → 248
        Assert.Equal(46.5, value.Protein); // 46.5
        Assert.Equal(5.4, value.Fat); // 5.4
        Assert.Equal(0, value.Carbs);
    }

    [Fact]
    public void NutritionCalculator_Sum_RoundsPerItem()
    {
        var product = Product.Create(
            ProductName.Create("Яйцо"),
            NutritionFacts.Create(155, 13, 11, 1.1));
        var items = new[]
        {
            MealItem.Create(product, GramAmount.Create(50)),
            MealItem.Create(product, GramAmount.Create(50)),
        };

        var total = NutritionCalculator.Sum(items);

        Assert.Equal(156, total.Calories); // 78 + 78
        Assert.Equal(13.0, total.Protein);
    }

    [Fact]
    public void NutritionCalculator_Calculate_PortionAbovePer100gBound_IsAllowed()
    {
        // Питательность «на 100 г» — в пределах границы (3 000 < 10 000),
        // но порция (700 г) по калориям законно превышает её.
        var product = Product.Create(
            ProductName.Create("Каша"),
            NutritionFacts.Create(3_000, 100, 100, 100));

        var value = NutritionCalculator.Calculate(product, 700);

        Assert.Equal(21_000, value.Calories);
        Assert.Equal(700, value.Protein);
    }

    [Fact]
    public void NutritionCalculator_Sum_DailyTotalAbovePer100gBound_IsAllowed()
    {
        var product = Product.Create(
            ProductName.Create("Блюдо"),
            NutritionFacts.Create(1_500, 1_500, 1_500, 1_500));
        var items = new[]
        {
            MealItem.Create(product, GramAmount.Create(500)),
            MealItem.Create(product, GramAmount.Create(500)),
        };

        var total = NutritionCalculator.Sum(items);

        Assert.Equal(15_000, total.Calories); // итог дня выше 10 000 — это валидно
        Assert.Equal(15_000, total.Protein);
    }

    [Fact]
    public void NutritionFacts_CreateTotal_NegativeOrNonFinite_Throws()
    {
        Assert.Throws<DomainValidationException>(() => NutritionFacts.CreateTotal(-1, 0, 0, 0));
        Assert.Throws<DomainValidationException>(
            () => NutritionFacts.CreateTotal(0, double.PositiveInfinity, 0, 0));
    }

    [Fact]
    public void DiaryEntry_AlwaysHasFourMeals()
    {
        var entry = DiaryEntry.CreateEmpty(Guid.NewGuid(), new DateOnly(2026, 1, 1));
        Assert.Equal(4, entry.Meals.Count);
        Assert.Equal(
            new[] { MealType.Breakfast, MealType.Lunch, MealType.Dinner, MealType.Snack },
            entry.Meals.Select(meal => meal.Type).ToArray());
    }

    [Fact]
    public void Pagination_DefaultsAndBounds()
    {
        var defaults = Pagination.Create(null, null);
        Assert.Equal(1, defaults.Page);
        Assert.Equal(Pagination.DefaultPageSize, defaults.PageSize);

        Assert.Throws<DomainValidationException>(() => Pagination.Create(0, 20));
        Assert.Throws<DomainValidationException>(() => Pagination.Create(1, 0));
        Assert.Throws<DomainValidationException>(() => Pagination.Create(1, Pagination.MaxPageSize + 1));

        var max = Pagination.Create(2, Pagination.MaxPageSize);
        Assert.Equal(2, max.Page);
        Assert.Equal(Pagination.MaxPageSize, max.PageSize);
        Assert.Equal(100, max.Skip);
    }

    [Fact]
    public void UserSettings_DefaultsMatchClient()
    {
        var settings = UserSettings.CreateDefault(Guid.NewGuid());
        Assert.Equal(2500, settings.DailyCalories);
        Assert.Equal(150, settings.DailyProtein);
        Assert.Equal(83, settings.DailyFat);
        Assert.Equal(300, settings.DailyCarbs);
        Assert.Equal(WeightUnit.G, settings.WeightUnit);
        Assert.True(settings.NotificationsEnabled);
    }

    [Fact]
    public void UserSettings_Update_IsPartial()
    {
        var settings = UserSettings.CreateDefault(Guid.NewGuid());
        settings.Update(WeightUnit.Kg, null);
        Assert.Equal(WeightUnit.Kg, settings.WeightUnit);
        Assert.True(settings.NotificationsEnabled);
    }

    [Fact]
    public void PagedResult_TotalPagesRoundsUp()
    {
        var page = new PagedResult<int>([1, 2, 3], 1, 2, 5);
        Assert.Equal(3, page.TotalPages);
        Assert.Equal(0, new PagedResult<int>([], 1, 20, 0).TotalPages);
    }
}
