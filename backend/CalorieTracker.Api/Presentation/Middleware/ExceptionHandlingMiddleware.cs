using System.Text.Json;
using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Exceptions;
using CalorieTracker.Api.Presentation.Contracts;

namespace CalorieTracker.Api.Presentation.Middleware;

/// <summary>
/// Глобальная обработка исключений: любые ошибки превращаются в единый
/// формат <c>{ message, errors? }</c>. Стек и внутренние детали наружу не
/// утекают — неизвестные исключения логируются и отдаются как 500.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainValidationException exception)
        {
            await WriteAsync(context, StatusCodes.Status400BadRequest, exception.Message, exception.Errors);
        }
        catch (UnauthorizedException exception)
        {
            await WriteAsync(context, StatusCodes.Status401Unauthorized, exception.Message);
        }
        catch (ForbiddenException exception)
        {
            await WriteAsync(context, StatusCodes.Status403Forbidden, exception.Message);
        }
        catch (NotFoundException exception)
        {
            await WriteAsync(context, StatusCodes.Status404NotFound, exception.Message);
        }
        catch (ConflictException exception)
        {
            await WriteAsync(context, StatusCodes.Status409Conflict, exception.Message);
        }
        catch (BadHttpRequestException)
        {
            // Некорректный/отсутствующий/слишком большой запрос — как ошибка формы.
            await WriteAsync(
                context,
                StatusCodes.Status400BadRequest,
                ValidationTexts.InvalidForm,
                new Dictionary<string, string[]>());
        }
        catch (JsonException)
        {
            // Некорректный JSON (в т.ч. недопустимое значение enum) — ошибка формы.
            await WriteAsync(
                context,
                StatusCodes.Status400BadRequest,
                ValidationTexts.InvalidForm,
                new Dictionary<string, string[]>());
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Клиент оборвал соединение: отвечать некому, и это не ошибка
            // сервера. Пишем не 500, а тихо завершаем на уровне Debug.
            _logger.LogDebug("Запрос {Method} {Path} отменён клиентом.",
                context.Request.Method,
                context.Request.Path);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Необработанная ошибка при обработке {Method} {Path}.",
                context.Request.Method,
                context.Request.Path);
            await WriteAsync(context, StatusCodes.Status500InternalServerError, Messages.InternalError);
        }
    }

    private static async Task WriteAsync(
        HttpContext context,
        int statusCode,
        string message,
        IReadOnlyDictionary<string, string[]>? errors = null)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json; charset=utf-8";

        var payload = new ErrorResponse(message, errors);
        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
