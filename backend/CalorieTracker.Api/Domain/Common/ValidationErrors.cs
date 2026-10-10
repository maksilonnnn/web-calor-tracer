using CalorieTracker.Api.Domain.Exceptions;

namespace CalorieTracker.Api.Domain.Common;

/// <summary>
/// Сборщик ошибок валидации по полям. Доменные объекты и службы добавляют
/// тексты (из <see cref="ValidationTexts"/>), а затем одним вызовом
/// <see cref="ThrowIfAny"/> превращают их в 400 «Данные заполнены неверно».
/// </summary>
public sealed class ValidationErrors
{
    private readonly Dictionary<string, string[]> _errors = new(StringComparer.Ordinal);

    /// <summary>Признак наличия хотя бы одной ошибки.</summary>
    public bool HasErrors => _errors.Count > 0;

    /// <summary>Добавляет тексты ошибок поля (пустой список — ничего не делает).</summary>
    public void Add(string field, IReadOnlyList<string> texts)
    {
        if (texts.Count > 0)
        {
            _errors[field] = texts.ToArray();
        }
    }

    /// <summary>Снимок словаря ошибок для формирования тела ответа.</summary>
    public IReadOnlyDictionary<string, string[]> ToDictionary() => _errors;

    /// <summary>Выбрасывает 400 с накопленными ошибками, если они есть.</summary>
    public void ThrowIfAny()
    {
        if (HasErrors)
        {
            throw DomainValidationException.InvalidForm(_errors);
        }
    }
}
