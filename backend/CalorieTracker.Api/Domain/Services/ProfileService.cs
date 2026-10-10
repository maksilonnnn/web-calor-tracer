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
    User GetProfile(Guid userId);

    /// <summary>Обновление имени/email; занятый email → 409.</summary>
    User UpdateProfile(Guid userId, ProfileUpdateCommand command);

    /// <summary>Смена пароля; неверный текущий пароль → 400 «Неверный текущий пароль».</summary>
    void ChangePassword(Guid userId, ChangePasswordCommand command);

    /// <summary>Удаление аккаунта вместе с его дневником и настройками.</summary>
    void DeleteAccount(Guid userId);
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

    public User GetProfile(Guid userId) =>
        _users.FindById(userId) ?? throw new UnauthorizedException(Messages.Unauthorized);

    public User UpdateProfile(Guid userId, ProfileUpdateCommand command)
    {
        ArgumentNullException.ThrowIfNull(command);
        var user = GetProfile(userId);

        var errors = new ValidationErrors();
        errors.Add("name", DomainValidation.Name(command.Name));
        errors.Add("email", DomainValidation.Email(command.Email));
        errors.ThrowIfAny();

        var name = PersonName.Create(command.Name);
        var email = Email.Create(command.Email);
        if (_users.ExistsByEmail(email.Value, user.Id))
        {
            throw new ConflictException(Messages.EmailTaken);
        }

        user.UpdateProfile(name, email);
        _users.Save(user);
        return user;
    }

    public void ChangePassword(Guid userId, ChangePasswordCommand command)
    {
        ArgumentNullException.ThrowIfNull(command);
        var user = GetProfile(userId);

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
        _users.Save(user);
    }

    public void DeleteAccount(Guid userId)
    {
        _ = GetProfile(userId);
        _diary.RemoveAllForUser(userId);
        _settings.Remove(userId);
        _users.Remove(userId);
    }
}
