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
    AuthResult Register(RegisterCommand command);

    /// <summary>Вход: единый 401 без раскрытия существования аккаунта.</summary>
    AuthResult Login(LoginCommand command);

    /// <summary>Текущий пользователь по id из токена; отсутствует → 401.</summary>
    User GetCurrentUser(Guid userId);
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

    public AuthResult Register(RegisterCommand command)
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
        if (_users.ExistsByEmail(email.Value))
        {
            throw new ConflictException(Messages.EmailTaken);
        }

        var user = User.Create(
            PersonName.Create(command.Name),
            email,
            _passwordHasher.Hash(command.Password));
        _users.Add(user);

        return new AuthResult { User = user, Token = _tokenService.CreateToken(user) };
    }

    public AuthResult Login(LoginCommand command)
    {
        ArgumentNullException.ThrowIfNull(command);

        var email = (command.Email ?? string.Empty).Trim();
        var user = _users.FindByEmail(email);
        if (user is null || !_passwordHasher.Verify(command.Password ?? string.Empty, user.PasswordHash))
        {
            throw new UnauthorizedException(Messages.WrongCredentials);
        }

        return new AuthResult { User = user, Token = _tokenService.CreateToken(user) };
    }

    public User GetCurrentUser(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new UnauthorizedException(Messages.Unauthorized);
        }

        return _users.FindById(userId) ?? throw new UnauthorizedException(Messages.Unauthorized);
    }
}
