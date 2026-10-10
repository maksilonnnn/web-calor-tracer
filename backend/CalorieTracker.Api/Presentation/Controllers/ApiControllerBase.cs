using System.Security.Claims;
using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalorieTracker.Api.Presentation.Controllers;

/// <summary>
/// Базовый контроллер защищённого API: аутентификация, извлечение
/// идентификатора пользователя из токена и общие проверки тела/маршрута.
/// </summary>
[ApiController]
[Authorize]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>
    /// Идентификатор пользователя берётся ТОЛЬКО из claims токена — это
    /// исключает mass-assignment и подмену владельца через тело запроса.
    /// </summary>
    protected Guid CurrentUserId
    {
        get
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(value, out var id) || id == Guid.Empty)
            {
                throw new UnauthorizedException(Messages.Unauthorized);
            }

            return id;
        }
    }

    /// <summary>Пустое тело запроса → 400 «Данные заполнены неверно».</summary>
    protected static T Body<T>(T? body)
        where T : class =>
        body ?? throw DomainValidationException.InvalidForm(new Dictionary<string, string[]>());

    /// <summary>Разбор Guid из маршрута; некорректный формат → 400.</summary>
    protected static Guid ParseId(string? value)
    {
        if (!Guid.TryParse(value, out var id) || id == Guid.Empty)
        {
            throw new DomainValidationException(Messages.InvalidId);
        }

        return id;
    }
}
