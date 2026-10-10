using System.Text.Json.Serialization;

namespace CalorieTracker.Api.Presentation.Contracts;

/// <summary>
/// Единый формат ошибки для всех неуспешных ответов:
/// <c>{ "message": "...", "errors": { "поле": ["текст"] } }</c>.
/// <c>errors</c> присутствует только у 400 «Данные заполнены неверно».
/// </summary>
public sealed class ErrorResponse
{
    public string Message { get; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string[]>? Errors { get; }

    public ErrorResponse(string message, IReadOnlyDictionary<string, string[]>? errors = null)
    {
        Message = message;
        Errors = errors;
    }
}
