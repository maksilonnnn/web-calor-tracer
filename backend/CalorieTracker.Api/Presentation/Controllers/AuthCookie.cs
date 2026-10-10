using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Infrastructure.Options;
using Microsoft.AspNetCore.Http;

namespace CalorieTracker.Api.Presentation.Controllers;

/// <summary>
/// Запись/удаление httpOnly-cookie с JWT. SameSite=Strict; флаг Secure
/// включён вне окружения Development (в dev-режиме браузеры работают по http).
/// </summary>
internal static class AuthCookie
{
    public static void Write(
        HttpResponse response,
        AuthOptions options,
        IWebHostEnvironment environment,
        IssuedToken token)
    {
        response.Cookies.Append(
            options.CookieName,
            token.Token,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !environment.IsDevelopment(),
                SameSite = SameSiteMode.Strict,
                Path = "/",
                Expires = token.ExpiresAt,
            });
    }

    public static void Delete(HttpResponse response, AuthOptions options)
    {
        response.Cookies.Delete(options.CookieName, new CookieOptions { Path = "/" });
    }
}
