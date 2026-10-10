using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Presentation.Contracts;
using CalorieTracker.Api.Presentation.Mapping;
using Microsoft.AspNetCore.Mvc;

namespace CalorieTracker.Api.Presentation.Controllers;

/// <summary>Агрегат дня для дашборда.</summary>
[Route("api/v1/dashboard")]
public sealed class DashboardController : ApiControllerBase
{
    private readonly IDashboardService _dashboard;

    public DashboardController(IDashboardService dashboard) => _dashboard = dashboard;

    /// <summary>Итоги, разбивка по приёмам, недавние продукты и нормы за дату.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(DashboardDataDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public ActionResult<DashboardDataDto> GetDay([FromQuery] string? date) =>
        Ok(DtoMapper.ToDto(_dashboard.GetDay(CurrentUserId, DateParser.Parse(date))));
}
