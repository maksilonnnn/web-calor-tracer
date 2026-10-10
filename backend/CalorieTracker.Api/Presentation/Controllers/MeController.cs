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
    public async Task<ActionResult<UserDto>> Get(CancellationToken cancellationToken) =>
        Ok(DtoMapper.ToDto(await _profile.GetProfileAsync(CurrentUserId, cancellationToken)));

    /// <summary>Обновление имени и email; занятый email → 409.</summary>
    [HttpPut]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserDto>> Update(
        [FromBody] ProfileUpdateRequest? request,
        CancellationToken cancellationToken)
    {
        var body = Body(request);
        var user = await _profile.UpdateProfileAsync(CurrentUserId, new ProfileUpdateCommand
        {
            Name = body.Name ?? string.Empty,
            Email = body.Email ?? string.Empty,
        }, cancellationToken);
        return Ok(DtoMapper.ToDto(user));
    }

    /// <summary>Смена пароля. 204; неверный текущий пароль → 400.</summary>
    [HttpPut("password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest? request,
        CancellationToken cancellationToken)
    {
        var body = Body(request);
        await _profile.ChangePasswordAsync(CurrentUserId, new ChangePasswordCommand
        {
            CurrentPassword = body.CurrentPassword ?? string.Empty,
            Password = body.Password ?? string.Empty,
            ConfirmPassword = body.ConfirmPassword ?? string.Empty,
        }, cancellationToken);
        return NoContent();
    }

    /// <summary>Удаление аккаунта вместе с данными. 204 + удаление cookie.</summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(CancellationToken cancellationToken)
    {
        await _profile.DeleteAccountAsync(CurrentUserId, cancellationToken);
        AuthCookie.Delete(Response, _options);
        return NoContent();
    }
}
