using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Exceptions;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Администрирование пользователей: список, блокировка, разблокировка.</summary>
public interface IUserAdminService
{
    /// <summary>Постраничный список с поиском по имени/email.</summary>
    Task<PagedResult<User>> GetUsersAsync(
        Pagination pagination,
        string? search,
        CancellationToken cancellationToken = default);

    /// <summary>Заблокировать пользователя. Себя и других админов — нельзя.</summary>
    Task<User> BlockAsync(Guid actorId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Разблокировать пользователя. Себя и других админов — нельзя.</summary>
    Task<User> UnblockAsync(Guid actorId, Guid userId, CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IUserAdminService" />
public sealed class UserAdminService : IUserAdminService
{
    private readonly IUserRepository _users;

    public UserAdminService(IUserRepository users) => _users = users;

    public Task<PagedResult<User>> GetUsersAsync(
        Pagination pagination,
        string? search,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(pagination);
        return _users.GetPagedAsync(pagination, search, cancellationToken);
    }

    public async Task<User> BlockAsync(
        Guid actorId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await FindAsync(userId, cancellationToken);
        EnsureCanChangeBlock(actorId, user);

        user.Block();
        await _users.SaveAsync(user, cancellationToken);
        return user;
    }

    public async Task<User> UnblockAsync(
        Guid actorId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await FindAsync(userId, cancellationToken);
        EnsureCanChangeBlock(actorId, user);

        user.Unblock();
        await _users.SaveAsync(user, cancellationToken);
        return user;
    }

    private async Task<User> FindAsync(Guid userId, CancellationToken cancellationToken) =>
        await _users.FindByIdAsync(userId, cancellationToken)
        ?? throw new NotFoundException(Messages.UserNotFound);

    /// <summary>
    /// Запрет на изменение блокировки самого себя и других администраторов.
    /// </summary>
    private static void EnsureCanChangeBlock(Guid actorId, User user)
    {
        if (user.Id == actorId)
        {
            throw new ConflictException(Messages.CannotChangeOwnBlock);
        }

        if (user.Role == UserRole.Admin)
        {
            throw new ConflictException(Messages.CannotChangeAdminBlock);
        }
    }
}
