using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Models;
using CalorieTracker.Api.Domain.Repositories;

namespace CalorieTracker.Api.Domain.Services;

/// <summary>Служба настроек: чтение и частичное обновление.</summary>
public interface ISettingsService
{
    /// <summary>Настройки пользователя (значения по умолчанию при отсутствии записи).</summary>
    Task<UserSettings> GetAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Частичное обновление: переданные поля накладываются на текущие.</summary>
    Task<UserSettings> UpdateAsync(
        Guid userId,
        SettingsUpdateCommand command,
        CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="ISettingsService" />
public sealed class SettingsService : ISettingsService
{
    private readonly ISettingsRepository _settings;

    public SettingsService(ISettingsRepository settings)
    {
        _settings = settings;
    }

    public async Task<UserSettings> GetAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await _settings.FindAsync(userId, cancellationToken)
        ?? UserSettings.CreateDefault(userId);

    public async Task<UserSettings> UpdateAsync(
        Guid userId,
        SettingsUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        var settings = await _settings.GetOrCreateAsync(userId, cancellationToken);
        settings.Update(command.WeightUnit, command.NotificationsEnabled);
        await _settings.SaveAsync(settings, cancellationToken);
        return settings;
    }
}
