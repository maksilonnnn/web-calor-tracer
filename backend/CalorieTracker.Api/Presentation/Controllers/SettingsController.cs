using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Presentation.Contracts;
using CalorieTracker.Api.Presentation.Mapping;
using Microsoft.AspNetCore.Mvc;

namespace CalorieTracker.Api.Presentation.Controllers;

/// <summary>Настройки пользователя: чтение и частичное обновление.</summary>
[Route("api/v1/settings")]
public sealed class SettingsController : ApiControllerBase
{
    private readonly ISettingsService _settings;

    public SettingsController(ISettingsService settings) => _settings = settings;

    /// <summary>Настройки пользователя (значения по умолчанию при отсутствии).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(SettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public ActionResult<SettingsDto> Get() =>
        Ok(DtoMapper.ToDto(_settings.Get(CurrentUserId)));

    /// <summary>Частичное обновление настроек → актуальные значения.</summary>
    [HttpPut]
    [ProducesResponseType(typeof(SettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public ActionResult<SettingsDto> Update([FromBody] SettingsUpdateRequest? request)
    {
        var body = Body(request);
        var updated = _settings.Update(CurrentUserId, new SettingsUpdateCommand
        {
            WeightUnit = body.WeightUnit,
            NotificationsEnabled = body.NotificationsEnabled,
        });
        return Ok(DtoMapper.ToDto(updated));
    }
}
