using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Infrastructure.Options;
using CalorieTracker.Api.Presentation.Contracts;
using CalorieTracker.Api.Presentation.Mapping;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CalorieTracker.Api.Presentation.Controllers;

/// <summary>Профиль текущего пользователя: чтение, редактирование, пароль, удаление.</summary>
[Route("api/v1/me")]
public sealed class MeController : ApiControllerBase
{
    private readonly IProfileService _profile;
    private readonly AuthOptions _options;

    public MeController(IProfileService profile, IOptions<AuthOptions> options)
    {
        _profile = profile;
        _options = options.Value;
    }

    /// <summary>Профиль текущего пользователя.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public ActionResult<UserDto> Get() => Ok(DtoMapper.ToDto(_profile.GetProfile(CurrentUserId)));

    /// <summary>Обновление имени и email; занятый email → 409.</summary>
    [HttpPut]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public ActionResult<UserDto> Update([FromBody] ProfileUpdateRequest? request)
    {
        var body = Body(request);
        var user = _profile.UpdateProfile(CurrentUserId, new ProfileUpdateCommand
        {
            Name = body.Name ?? string.Empty,
            Email = body.Email ?? string.Empty,
        });
        return Ok(DtoMapper.ToDto(user));
    }

    /// <summary>Смена пароля. 204; неверный текущий пароль → 400.</summary>
    [HttpPut("password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public IActionResult ChangePassword([FromBody] ChangePasswordRequest? request)
    {
        var body = Body(request);
        _profile.ChangePassword(CurrentUserId, new ChangePasswordCommand
        {
            CurrentPassword = body.CurrentPassword ?? string.Empty,
            Password = body.Password ?? string.Empty,
            ConfirmPassword = body.ConfirmPassword ?? string.Empty,
        });
        return NoContent();
    }

    /// <summary>Удаление аккаунта вместе с данными. 204 + удаление cookie.</summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public IActionResult Delete()
    {
        _profile.DeleteAccount(CurrentUserId);
        AuthCookie.Delete(Response, _options);
        return NoContent();
    }
}
