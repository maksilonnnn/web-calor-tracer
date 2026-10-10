using CalorieTracker.Api.Presentation.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace CalorieTracker.Tests;

/// <summary>
/// Поведение ExceptionHandlingMiddleware при отмене запроса: оборванное
/// клиентом соединение не должно превращаться в 500.
/// </summary>
public sealed class ExceptionHandlingMiddlewareTests
{
    private static ExceptionHandlingMiddleware CreateMiddleware(
        RequestDelegate next) =>
        new(next, NullLogger<ExceptionHandlingMiddleware>.Instance);

    [Fact]
    public async Task AbortedRequest_OperationCanceled_NotWrittenAs500()
    {
        var context = new DefaultHttpContext
        {
            Response = { Body = new MemoryStream() },
        };
        context.Request.Method = "GET";
        context.Request.Path = "/api/v1/diary";

        using var cts = new CancellationTokenSource();
        cts.Cancel();
        context.RequestAborted = cts.Token;

        var middleware = CreateMiddleware(
            _ => throw new OperationCanceledException(cts.Token));

        await middleware.InvokeAsync(context);

        Assert.NotEqual(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.False(context.Response.HasStarted);
        Assert.Equal(0, context.Response.Body.Length);
    }

    [Fact]
    public async Task NonAbortedOperationCanceled_StillInternalError500()
    {
        var context = new DefaultHttpContext
        {
            Response = { Body = new MemoryStream() },
        };
        context.Request.Method = "GET";
        context.Request.Path = "/api/v1/diary";

        var middleware = CreateMiddleware(
            _ => throw new OperationCanceledException());

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Contains("application/json", context.Response.ContentType);
    }

    [Fact]
    public async Task NonAbortedOperationCanceled_WritesStandardErrorBody()
    {
        var context = new DefaultHttpContext
        {
            Response = { Body = new MemoryStream() },
        };
        context.Request.Method = "GET";
        context.Request.Path = "/api/v1/diary";

        var middleware = CreateMiddleware(
            _ => throw new OperationCanceledException());

        await middleware.InvokeAsync(context);
        context.Response.Body.Position = 0;

        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        Assert.Contains("message", body);
    }
}