using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Exceptions;
using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Служба аутентификации: регистрация, вход, чтение текущего пользователя.</summary>
public interface IAuthService
{
    /// <summary>Регистрация: валидация полей → 409 при занятом email → создание и вход.</summary>
    Task<AuthResult> RegisterAsync(RegisterCommand command, CancellationToken cancellationToken = default);

    /// <summary>Вход: единый 401 без раскрытия существования аккаунта.</summary>
    Task<AuthResult> LoginAsync(LoginCommand command, CancellationToken cancellationToken = default);

    /// <summary>Текущий пользователь по id из токена; отсутствует → 401.</summary>
    Task<User> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
}

/// <summary>Результат успешной аутентификации: пользователь и выпущенный токен.</summary>
public sealed class AuthResult
{
    public User User { get; init; } = null!;

    public IssuedToken Token { get; init; } = null!;
}

/// <inheritdoc cref="IAuthService" />
public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthService(
        IUserRepository users,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _users = users;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<AuthResult> RegisterAsync(
        RegisterCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        // Порядок валидации совпадает с формой: name, email, password, confirmPassword.
        var errors = new ValidationErrors();
        errors.Add("name", DomainValidation.Name(command.Name));
        errors.Add("email", DomainValidation.Email(command.Email));
        errors.Add("password", DomainValidation.Password(command.Password));
        errors.Add("confirmPassword", DomainValidation.ConfirmPassword(command.ConfirmPassword, command.Password));
        errors.ThrowIfAny();

        var email = Email.Create(command.Email);
        if (await _users.ExistsByEmailAsync(email.Value, cancellationToken: cancellationToken))
        {
            throw new ConflictException(Messages.EmailTaken);
        }

        var user = User.Create(
            PersonName.Create(command.Name),
            email,
            _passwordHasher.Hash(command.Password));
        await _users.AddAsync(user, cancellationToken);

        // Выпуск токена — синхронный (без ввода-вывода), обёртка не нужна.
        return new AuthResult { User = user, Token = _tokenService.CreateToken(user) };
    }

    public async Task<AuthResult> LoginAsync(
        LoginCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        var email = (command.Email ?? string.Empty).Trim();
        var user = await _users.FindByEmailAsync(email, cancellationToken);
        if (user is null || !_passwordHasher.Verify(command.Password ?? string.Empty, user.PasswordHash))
        {
            throw new UnauthorizedException(Messages.WrongCredentials);
        }

        return new AuthResult { User = user, Token = _tokenService.CreateToken(user) };
    }

    public async Task<User> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new UnauthorizedException(Messages.Unauthorized);
        }

        return await _users.FindByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedException(Messages.Unauthorized);
    }
}
