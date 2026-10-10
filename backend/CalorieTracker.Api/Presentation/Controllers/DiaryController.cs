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
    public ActionResult<DiaryEntryDto> GetDay([FromQuery] string? date) =>
        Ok(DtoMapper.ToDto(_diary.GetDay(CurrentUserId, DateParser.Parse(date))));

    /// <summary>Добавление продукта в приём пищи. 201 + обновлённый день.</summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(DiaryEntryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public ActionResult<DiaryEntryDto> AddFood([FromBody] AddFoodRequest? request)
    {
        var body = Body(request);
        var product = body.Product;
        var entry = _diary.AddFood(CurrentUserId, new AddFoodCommand
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
        });

        return StatusCode(StatusCodes.Status201Created, DtoMapper.ToDto(entry));
    }

    /// <summary>Изменение количества позиции. 200 + обновлённый день; чужая позиция → 404.</summary>
    [HttpPut("items/{itemId}")]
    [ProducesResponseType(typeof(DiaryEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public ActionResult<DiaryEntryDto> UpdateQuantity(
        string itemId,
        [FromBody] UpdateQuantityRequest? request)
    {
        var body = Body(request);
        var id = ParseId(itemId);
        return Ok(DtoMapper.ToDto(_diary.UpdateQuantity(CurrentUserId, id, body.Quantity)));
    }

    /// <summary>Удаление позиции. 200 + обновлённый день; чужая позиция → 404.</summary>
    [HttpDelete("items/{itemId}")]
    [ProducesResponseType(typeof(DiaryEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public ActionResult<DiaryEntryDto> RemoveItem(string itemId)
    {
        var id = ParseId(itemId);
        return Ok(DtoMapper.ToDto(_diary.RemoveItem(CurrentUserId, id)));
    }

    /// <summary>Постраничная история дней (по убыванию даты).</summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(PagedResultDto<DiaryHistoryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public ActionResult<PagedResultDto<DiaryHistoryItemDto>> GetHistory(
        [FromQuery] int? page,
        [FromQuery] int? pageSize)
    {
        var history = _diary.GetHistory(CurrentUserId, page, pageSize);
        return Ok(DtoMapper.ToDto(history, DtoMapper.ToDto));
    }
}
