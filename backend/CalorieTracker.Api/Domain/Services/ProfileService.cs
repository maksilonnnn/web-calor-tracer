using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Exceptions;
using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Служба профиля: чтение/редактирование профиля, смена пароля, удаление аккаунта.</summary>
public interface IProfileService
{
    Task<User> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Обновление имени/email; занятый email → 409.</summary>
    Task<User> UpdateProfileAsync(
        Guid userId,
        ProfileUpdateCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>Смена пароля; неверный текущий пароль → 400 «Неверный текущий пароль».</summary>
    Task ChangePasswordAsync(
        Guid userId,
        ChangePasswordCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>Удаление аккаунта вместе с его дневником и настройками.</summary>
    Task DeleteAccountAsync(Guid userId, CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IProfileService" />
public sealed class ProfileService : IProfileService
{
    private readonly IUserRepository _users;
    private readonly IDiaryRepository _diary;
    private readonly ISettingsRepository _settings;
    private readonly IPasswordHasher _passwordHasher;

    public ProfileService(
        IUserRepository users,
        IDiaryRepository diary,
        ISettingsRepository settings,
        IPasswordHasher passwordHasher)
    {
        _users = users;
        _diary = diary;
        _settings = settings;
        _passwordHasher = passwordHasher;
    }

    public async Task<User> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await _users.FindByIdAsync(userId, cancellationToken)
        ?? throw new UnauthorizedException(Messages.Unauthorized);

    public async Task<User> UpdateProfileAsync(
        Guid userId,
        ProfileUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        var user = await GetProfileAsync(userId, cancellationToken);

        var errors = new ValidationErrors();
        errors.Add("name", DomainValidation.Name(command.Name));
        errors.Add("email", DomainValidation.Email(command.Email));
        errors.ThrowIfAny();

        var name = PersonName.Create(command.Name);
        var email = Email.Create(command.Email);
        if (await _users.ExistsByEmailAsync(email.Value, user.Id, cancellationToken))
        {
            throw new ConflictException(Messages.EmailTaken);
        }

        user.UpdateProfile(name, email);
        await _users.SaveAsync(user, cancellationToken);
        return user;
    }

    public async Task ChangePasswordAsync(
        Guid userId,
        ChangePasswordCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        var user = await GetProfileAsync(userId, cancellationToken);

        // Неверный текущий пароль проверяется ДО полевых ошибок нового пароля.
        if (!_passwordHasher.Verify(command.CurrentPassword ?? string.Empty, user.PasswordHash))
        {
            throw new DomainValidationException(Messages.WrongCurrentPassword);
        }

        var errors = new ValidationErrors();
        errors.Add("password", DomainValidation.Password(command.Password));
        errors.Add("confirmPassword", DomainValidation.ConfirmPassword(command.ConfirmPassword, command.Password));
        errors.ThrowIfAny();

        user.ChangePasswordHash(_passwordHasher.Hash(command.Password));
        await _users.SaveAsync(user, cancellationToken);
    }

    public async Task DeleteAccountAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        _ = await GetProfileAsync(userId, cancellationToken);
        await _diary.RemoveAllForUserAsync(userId, cancellationToken);
        await _settings.RemoveAsync(userId, cancellationToken);
        await _users.RemoveAsync(userId, cancellationToken);
    }
}
