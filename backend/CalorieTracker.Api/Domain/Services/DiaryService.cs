using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Exceptions;
using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Служба дневника питания: чтение дня, добавление, изменение и удаление позиций.</summary>
public interface IDiaryService
{
    /// <summary>День пользователя за дату 'YYYY-MM-DD'; всегда четыре приёма пищи.</summary>
    DiaryEntry GetDay(Guid userId, DateOnly date);

    /// <summary>Добавление продукта: валидация → новая позиция (и запись дня при необходимости).</summary>
    DiaryEntry AddFood(Guid userId, AddFoodCommand command);

    /// <summary>Изменение количества позиции; чужая/несуществующая → 404.</summary>
    DiaryEntry UpdateQuantity(Guid userId, Guid itemId, double quantity);

    /// <summary>Удаление позиции; чужая/несуществующая → 404.</summary>
    DiaryEntry RemoveItem(Guid userId, Guid itemId);

    /// <summary>Постраничная история дней пользователя (по убыванию даты).</summary>
    PagedResult<DiaryHistoryItem> GetHistory(Guid userId, int? page, int? pageSize);
}

/// <inheritdoc cref="IDiaryService" />
public sealed class DiaryService : IDiaryService
{
    private readonly IDiaryRepository _diary;

    public DiaryService(IDiaryRepository diary)
    {
        _diary = diary;
    }

    public DiaryEntry GetDay(Guid userId, DateOnly date) =>
        _diary.Find(userId, date) ?? DiaryEntry.CreateEmpty(userId, date);

    public DiaryEntry AddFood(Guid userId, AddFoodCommand command)
    {
        ArgumentNullException.ThrowIfNull(command);

        var date = DateParser.Parse(command.Date);
        var input = command.Product ?? new ProductInput();

        // Все полевые ошибки собираются в один 400 в порядке формы:
        // name, quantity, calories, protein, fat, carbs.
        var errors = new ValidationErrors();
        errors.Add("name", DomainValidation.ProductName(input.Name));
        errors.Add("quantity", DomainValidation.Quantity(command.Quantity));
        errors.Add("calories", DomainValidation.NonNegative(input.Calories));
        errors.Add("protein", DomainValidation.NonNegative(input.Protein));
        errors.Add("fat", DomainValidation.NonNegative(input.Fat));
        errors.Add("carbs", DomainValidation.NonNegative(input.Carbs));
        errors.ThrowIfAny();

        var quantity = GramAmount.Create(command.Quantity);
        var product = input.ToProduct();

        var entry = _diary.GetOrCreate(userId, date);
        var item = MealItem.Create(product, quantity);
        entry.AddItem(command.MealType, item);
        _diary.Save(entry);
        return entry;
    }

    public DiaryEntry UpdateQuantity(Guid userId, Guid itemId, double quantity)
    {
        var amount = GramAmount.Create(quantity);

        var entry = _diary.FindByItemId(userId, itemId)
            ?? throw new NotFoundException(Messages.NotFound);

        var item = entry.FindItem(itemId)
            ?? throw new NotFoundException(Messages.NotFound);
        item.ChangeQuantity(amount);
        _diary.Save(entry);
        return entry;
    }

    public DiaryEntry RemoveItem(Guid userId, Guid itemId)
    {
        var entry = _diary.FindByItemId(userId, itemId)
            ?? throw new NotFoundException(Messages.NotFound);

        if (!entry.RemoveItem(itemId))
        {
            throw new NotFoundException(Messages.NotFound);
        }

        _diary.Save(entry);
        return entry;
    }

    public PagedResult<DiaryHistoryItem> GetHistory(Guid userId, int? page, int? pageSize)
    {
        var pagination = Pagination.Create(page, pageSize);
        var paged = _diary.GetHistoryPage(userId, pagination);
        var items = paged.Items
            .Select(entry =>
            {
                var totals = Nutrition.NutritionCalculator.Sum(entry.AllItems);
                return new DiaryHistoryItem
                {
                    Id = entry.Id,
                    Date = entry.Date,
                    TotalCalories = totals.Calories,
                    TotalProtein = totals.Protein,
                    TotalFat = totals.Fat,
                    TotalCarbs = totals.Carbs,
                    ItemsCount = entry.AllItems.Count(),
                };
            })
            .ToList();

        return new PagedResult<DiaryHistoryItem>(items, paged.Page, paged.PageSize, paged.TotalCount);
    }
}
