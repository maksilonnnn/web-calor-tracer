namespace CalorieTracker.Api.Domain.Exceptions;

/// <summary>Базовое доменное исключение. Переводится в HTTP-код в middleware.</summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message)
        : base(message)
    {
    }
}

/// <summary>
/// Ошибка валидации входа (HTTP 400). Для «Данные заполнены неверно» несёт
/// разбивку ошибок по полям — та же форма, что у мок-слоя.
/// </summary>
public sealed class DomainValidationException : DomainException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public DomainValidationException(string message, IReadOnlyDictionary<string, string[]>? errors = null)
        : base(message)
    {
        Errors = errors ?? new Dictionary<string, string[]>();
    }

    /// <summary>Создаёт 400 «Данные заполнены неверно» с ошибками по полям.</summary>
    public static DomainValidationException InvalidForm(IDictionary<string, string[]> errors)
        => new(ValidationTexts.InvalidForm, new Dictionary<string, string[]>(errors, StringComparer.Ordinal));
}

/// <summary>Нет сессии / неверные учётные данные (HTTP 401).</summary>
public sealed class UnauthorizedException : DomainException
{
    public UnauthorizedException(string message)
        : base(message)
    {
    }
}

/// <summary>Доступ запрещён (HTTP 403).</summary>
public sealed class ForbiddenException : DomainException
{
    public ForbiddenException(string message)
        : base(message)
    {
    }
}

/// <summary>Ресурс не найден либо принадлежит другому пользователю (HTTP 404).</summary>
public sealed class NotFoundException : DomainException
{
    public NotFoundException(string message)
        : base(message)
    {
    }
}

/// <summary>Конфликт уникальности (HTTP 409).</summary>
public sealed class ConflictException : DomainException
{
    public ConflictException(string message)
        : base(message)
    {
    }
}
