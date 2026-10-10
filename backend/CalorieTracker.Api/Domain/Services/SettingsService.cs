using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Служба настроек: чтение и частичное обновление.</summary>
public interface ISettingsService
{
    /// <summary>Настройки пользователя (значения по умолчанию при отсутствии записи).</summary>
    UserSettings Get(Guid userId);

    /// <summary>Частичное обновление: переданные поля накладываются на текущие.</summary>
    UserSettings Update(Guid userId, SettingsUpdateCommand command);
}

/// <inheritdoc cref="ISettingsService" />
public sealed class SettingsService : ISettingsService
{
    private readonly ISettingsRepository _settings;

    public SettingsService(ISettingsRepository settings)
    {
        _settings = settings;
    }

    public UserSettings Get(Guid userId) =>
        _settings.Find(userId) ?? UserSettings.CreateDefault(userId);

    public UserSettings Update(Guid userId, SettingsUpdateCommand command)
    {
        ArgumentNullException.ThrowIfNull(command);

        var settings = _settings.GetOrCreate(userId);
        settings.Update(command.WeightUnit, command.NotificationsEnabled);
        _settings.Save(settings);
        return settings;
    }
}
