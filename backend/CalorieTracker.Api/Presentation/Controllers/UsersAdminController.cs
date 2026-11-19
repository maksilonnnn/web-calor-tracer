using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Domain.Services;
using CalorieTracker.Api.Presentation.Contracts;
using CalorieTracker.Api.Presentation.Mapping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalorieTracker.Api.Presentation.Controllers;

/// <summary>
/// Админ-API пользователей. Доступ проверяется на бэкенде атрибутом
/// <see cref="AuthorizeAttribute"/> с ролью admin — скрытие пункта меню на
/// фронтенде не является защитой.
/// </summary>
[Route("api/v1/admin/users")]
[Authorize(Roles = UserRoles.Admin)]
public sealed class UsersAdminController : ApiControllerBase
{
    private readonly IUserAdminService _admin;

    public UsersAdminController(IUserAdminService admin) => _admin = admin;

    /// <summary>Постраничный список пользователей с поиском по имени/email.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResultDto<AdminUserDto>>> GetUsers(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var pagination = Pagination.Create(page, pageSize);
        var result = await _admin.GetUsersAsync(pagination, search, cancellationToken);
        return Ok(DtoMapper.ToDto(result, DtoMapper.ToAdminDto));
    }

    /// <summary>Заблокировать пользователя.</summary>
    [HttpPut("{id}/block")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminUserDto>> Block(
        string id,
        CancellationToken cancellationToken)
    {
        var user = await _admin.BlockAsync(CurrentUserId, ParseId(id), cancellationToken);
        return Ok(DtoMapper.ToAdminDto(user));
    }

    /// <summary>Разблокировать пользователя.</summary>
    [HttpPut("{id}/unblock")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminUserDto>> Unblock(
        string id,
        CancellationToken cancellationToken)
    {
        var user = await _admin.UnblockAsync(CurrentUserId, ParseId(id), cancellationToken);
        return Ok(DtoMapper.ToAdminDto(user));
    }
}
