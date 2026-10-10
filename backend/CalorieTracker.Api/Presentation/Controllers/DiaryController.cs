using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Presentation.Contracts;
using CalorieTracker.Api.Presentation.Mapping;
using Microsoft.AspNetCore.Mvc;

namespace CalorieTracker.Api.Presentation.Controllers;

/// <summary>Дневник питания: чтение дня, позиции, история.</summary>
[Route("api/v1/diary")]
public sealed class DiaryController : ApiControllerBase
{
    private readonly IDiaryService _diary;

    public DiaryController(IDiaryService diary) => _diary = diary;

    /// <summary>День за дату 'YYYY-MM-DD' (всегда четыре приёма пищи).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(DiaryEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<DiaryEntryDto>> GetDay(
        [FromQuery] string? date,
        CancellationToken cancellationToken) =>
        Ok(DtoMapper.ToDto(await _diary.GetDayAsync(CurrentUserId, DateParser.Parse(date), cancellationToken)));

    /// <summary>Добавление продукта в приём пищи. 201 + обновлённый день.</summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(DiaryEntryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<DiaryEntryDto>> AddFood(
        [FromBody] AddFoodRequest? request,
        CancellationToken cancellationToken)
    {
        var body = Body(request);
        var product = body.Product;
        var entry = await _diary.AddFoodAsync(CurrentUserId, new AddFoodCommand
        {
            Date = body.Date ?? string.Empty,
            MealType = body.MealType,
            Quantity = body.Quantity,
            Product = new ProductInput
            {
                Name = product?.Name ?? string.Empty,
                Calories = product?.Calories ?? 0,
                Protein = product?.Protein ?? 0,
                Fat = product?.Fat ?? 0,
                Carbs = product?.Carbs ?? 0,
                Category = product?.Category,
            },
        }, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, DtoMapper.ToDto(entry));
    }

    /// <summary>Изменение позиции: количество и/или данные продукта. 200 + обновлённый день; чужая позиция → 404.</summary>
    [HttpPut("items/{itemId}")]
    [ProducesResponseType(typeof(DiaryEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DiaryEntryDto>> UpdateItem(
        string itemId,
        [FromBody] UpdateItemRequest? request,
        CancellationToken cancellationToken)
    {
        var body = Body(request);
        var id = ParseId(itemId);
        var product = body.Product;
        return Ok(DtoMapper.ToDto(await _diary.UpdateItemAsync(CurrentUserId, id, new UpdateItemCommand
        {
            Quantity = body.Quantity,
            Product = product is null
                ? null
                : new ProductInput
                {
                    Name = product.Name ?? string.Empty,
                    Calories = product.Calories,
                    Protein = product.Protein,
                    Fat = product.Fat,
                    Carbs = product.Carbs,
                    Category = product.Category,
                },
        }, cancellationToken)));
    }

    /// <summary>Удаление позиции. 200 + обновлённый день; чужая позиция → 404.</summary>
    [HttpDelete("items/{itemId}")]
    [ProducesResponseType(typeof(DiaryEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DiaryEntryDto>> RemoveItem(
        string itemId,
        CancellationToken cancellationToken)
    {
        var id = ParseId(itemId);
        return Ok(DtoMapper.ToDto(
            await _diary.RemoveItemAsync(CurrentUserId, id, cancellationToken)));
    }

    /// <summary>Постраничная история дней (по убыванию даты).</summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(PagedResultDto<DiaryHistoryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResultDto<DiaryHistoryItemDto>>> GetHistory(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var history = await _diary.GetHistoryAsync(CurrentUserId, page, pageSize, cancellationToken);
        return Ok(DtoMapper.ToDto(history, DtoMapper.ToDto));
    }
}
