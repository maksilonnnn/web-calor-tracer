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
    Task<DiaryEntry> GetDayAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);

    /// <summary>Добавление продукта: валидация → новая позиция (и запись дня при необходимости).</summary>
    Task<DiaryEntry> AddFoodAsync(
        Guid userId,
        AddFoodCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>Изменение позиции: количество и опционально данные продукта (снимка); чужая/несуществующая → 404.</summary>
    Task<DiaryEntry> UpdateItemAsync(
        Guid userId,
        Guid itemId,
        UpdateItemCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>Удаление позиции; чужая/несуществующая → 404.</summary>
    Task<DiaryEntry> RemoveItemAsync(
        Guid userId,
        Guid itemId,
        CancellationToken cancellationToken = default);

    /// <summary>Постраничная история дней пользователя (по убыванию даты).</summary>
    Task<PagedResult<DiaryHistoryItem>> GetHistoryAsync(
        Guid userId,
        int? page,
        int? pageSize,
        CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IDiaryService" />
public sealed class DiaryService : IDiaryService
{
    private readonly IDiaryRepository _diary;

    public DiaryService(IDiaryRepository diary)
    {
        _diary = diary;
    }

    public async Task<DiaryEntry> GetDayAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default) =>
        await _diary.FindAsync(userId, date, cancellationToken)
        ?? DiaryEntry.CreateEmpty(userId, date);

    public async Task<DiaryEntry> AddFoodAsync(
        Guid userId,
        AddFoodCommand command,
        CancellationToken cancellationToken = default)
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

        var entry = await _diary.GetOrCreateAsync(userId, date, cancellationToken);
        var item = MealItem.Create(product, quantity);
        entry.AddItem(command.MealType, item);
        await _diary.SaveAsync(entry, cancellationToken);
        return entry;
    }

    public async Task<DiaryEntry> UpdateItemAsync(
        Guid userId,
        Guid itemId,
        UpdateItemCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        var input = command.Product;

        // Все полевые ошибки собираются в один 400 в порядке формы:
        // name, quantity, calories, protein, fat, carbs. Продукт обновляется
        // целиком, поэтому без него проверяется только количество.
        var errors = new ValidationErrors();
        if (input is not null)
        {
            errors.Add("name", DomainValidation.ProductName(input.Name));
        }
        errors.Add("quantity", DomainValidation.Quantity(command.Quantity));
        if (input is not null)
        {
            errors.Add("calories", DomainValidation.NonNegative(input.Calories));
            errors.Add("protein", DomainValidation.NonNegative(input.Protein));
            errors.Add("fat", DomainValidation.NonNegative(input.Fat));
            errors.Add("carbs", DomainValidation.NonNegative(input.Carbs));
        }
        errors.ThrowIfAny();

        var entry = await _diary.FindByItemIdAsync(userId, itemId, cancellationToken)
            ?? throw new NotFoundException(Messages.NotFound);

        var item = entry.FindItem(itemId)
            ?? throw new NotFoundException(Messages.NotFound);

        item.ChangeQuantity(GramAmount.Create(command.Quantity));
        if (input is not null)
        {
            item.Product.UpdateDetails(
                ProductName.Create(input.Name),
                NutritionFacts.Create(input.Calories, input.Protein, input.Fat, input.Carbs),
                input.Category);
        }

        await _diary.SaveAsync(entry, cancellationToken);
        return entry;
    }

    public async Task<DiaryEntry> RemoveItemAsync(
        Guid userId,
        Guid itemId,
        CancellationToken cancellationToken = default)
    {
        var entry = await _diary.FindByItemIdAsync(userId, itemId, cancellationToken)
            ?? throw new NotFoundException(Messages.NotFound);

        if (!entry.RemoveItem(itemId))
        {
            throw new NotFoundException(Messages.NotFound);
        }

        await _diary.SaveAsync(entry, cancellationToken);
        return entry;
    }

    public async Task<PagedResult<DiaryHistoryItem>> GetHistoryAsync(
        Guid userId,
        int? page,
        int? pageSize,
        CancellationToken cancellationToken = default)
    {
        var pagination = Pagination.Create(page, pageSize);
        var paged = await _diary.GetHistoryPageAsync(userId, pagination, cancellationToken);
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
