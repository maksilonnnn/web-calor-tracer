using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Infrastructure.Options;
using CalorieTracker.Api.Presentation.Contracts;
using CalorieTracker.Api.Presentation.Mapping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CalorieTracker.Api.Presentation.Controllers;

/// <summary>Регистрация, вход, выход и текущий пользователь.</summary>
[Route("api/v1/auth")]
public sealed class AuthController : ApiControllerBase
{
    private readonly IAuthService _auth;
    private readonly AuthOptions _options;
    private readonly IWebHostEnvironment _environment;

    public AuthController(
        IAuthService auth,
        IOptions<AuthOptions> options,
        IWebHostEnvironment environment)
    {
        _auth = auth;
        _options = options.Value;
        _environment = environment;
    }

    /// <summary>
    /// Регистрация нового пользователя (порядок отказов как в эталонном
    /// образце): 400 «Данные заполнены неверно» с ошибками по ВСЕМ невалидным
    /// полям сразу → 409 «Пользователь с таким логином уже существует»
    /// (проверяется раньше email) → 409 «Пользователь с таким email уже
    /// существует» → 201 + cookie с токеном. Роль в теле запроса отсутствует:
    /// регистрация всегда создаёт пользователя с базовой ролью, пароль
    /// сохраняется только в виде хеша PBKDF2.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserDto>> Register(
        [FromBody] RegisterRequest? request,
        CancellationToken cancellationToken)
    {
        var body = Body(request);
        var result = await _auth.RegisterAsync(new RegisterCommand
        {
            Name = body.Name ?? string.Empty,
            Login = body.Login ?? string.Empty,
            Email = body.Email ?? string.Empty,
            Password = body.Password ?? string.Empty,
            RepeatPassword = body.RepeatPassword ?? string.Empty,
        }, cancellationToken);
        AuthCookie.Write(Response, _options, _environment, result.Token);
        return StatusCode(StatusCodes.Status201Created, DtoMapper.ToDto(result.User));
    }

    /// <summary>
    /// Вход по логину. 200 + установка cookie с токеном; неверные данные →
    /// 401 «Неверный логин или пароль» (текст един для неизвестного логина и
    /// неверного пароля), заблокированный аккаунт → 403.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> Login(
        [FromBody] LoginRequest? request,
        CancellationToken cancellationToken)
    {
        var body = Body(request);
        var result = await _auth.LoginAsync(new LoginCommand
        {
            Login = body.Login ?? string.Empty,
            Password = body.Password ?? string.Empty,
        }, cancellationToken);
        AuthCookie.Write(Response, _options, _environment, result.Token);
        return Ok(DtoMapper.ToDto(result.User));
    }

    /// <summary>Выход: удаление cookie. Всегда 204.</summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Logout()
    {
        AuthCookie.Delete(Response, _options);
        return NoContent();
    }

    /// <summary>Текущий пользователь по токену. 401 без/с невалидным токеном.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken) =>
        Ok(DtoMapper.ToDto(await _auth.GetCurrentUserAsync(CurrentUserId, cancellationToken)));
}
