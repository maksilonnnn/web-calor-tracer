using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using CalorieTracker.Api.Domain;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Infrastructure.Options;
using CalorieTracker.Api.Presentation.Contracts;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace CalorieTracker.Api.Presentation;

/// <summary>
/// Регистрация слоя представления: контроллеры с camelCase-сериализацией,
/// единый формат ошибок, CORS, JWT-аутентификация из cookie и Swagger.
/// </summary>
public static class DependencyInjection
{
    public const string CorsPolicyName = "frontend";

    /// <summary>Верхняя граница тела запроса — 1 МБ.</summary>
    public const long MaxRequestBodySize = 1_048_576;

    public static IServiceCollection AddPresentation(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        });

        // Валидацию выполняют контроллеры и доменные службы: отключаем
        // стандартный ProblemDetails, чтобы формат ошибок всегда был единым.
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.SuppressModelStateInvalidFilter = true;
        });

        services.Configure<KestrelServerOptions>(options =>
        {
            options.Limits.MaxRequestBodySize = MaxRequestBodySize;
        });

        AddSwagger(services, environment);
        AddCors(services, configuration);
        AddAuthentication(services, configuration);

        return services;
    }

    private static void AddCors(IServiceCollection services, IConfiguration configuration)
    {
        var corsOptions = configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>()
            ?? new CorsOptions();

        services.AddCors(options => options.AddPolicy(CorsPolicyName, policy =>
        {
            if (corsOptions.AllowedOrigins.Length == 0)
            {
                // В dev-frontend ходит через proxy (тот же origin) — CORS не нужен.
                return;
            }

            policy.WithOrigins(corsOptions.AllowedOrigins)
                .AllowCredentials()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }));
    }

    private static void AddSwagger(IServiceCollection services, IWebHostEnvironment environment)
    {
        if (!environment.IsDevelopment())
        {
            return;
        }

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Calorie Tracker API",
                Version = "v1",
                Description = "REST API трекера калорий (lab3). Аутентификация — JWT в httpOnly cookie access_token.",
            });

            var assembly = Assembly.GetExecutingAssembly();
            var xmlPath = Path.Combine(AppContext.BaseDirectory, $"{assembly.GetName().Name}.xml");
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }
        });
    }

    private static void AddAuthentication(IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options => ConfigureJwtBearer(options, configuration));
    }

    private static void ConfigureJwtBearer(JwtBearerOptions options, IConfiguration configuration)
    {
        var auth = configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>()
            ?? new AuthOptions();

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = auth.Issuer,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(auth.JwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue(auth.CookieName, out var token)
                    && !string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("CalorieTracker.Jwt");
                logger.LogWarning(context.Exception, "JWT-аутентификация не прошла.");
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                // Роль берётся из подписанного токена, но блокировку проверяем
                // по БД на каждом запросе: JWT отозвать нельзя, а забаненный
                // пользователь не должен ходить со старым живым токеном.
                var users = context.HttpContext.RequestServices.GetRequiredService<IUserRepository>();
                var value = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!Guid.TryParse(value, out var userId) || userId == Guid.Empty)
                {
                    context.Fail("В токене нет идентификатора пользователя.");
                    return;
                }

                var user = await users.FindByIdAsync(userId, context.HttpContext.RequestAborted);
                if (user is null)
                {
                    context.Fail("Пользователь из токена не найден.");
                    return;
                }

                if (user.IsBlocked)
                {
                    context.Fail("Аккаунт заблокирован.");
                }
            },
            OnChallenge = async context =>
            {
                context.HandleResponse();
                await WriteErrorAsync(context.HttpContext, StatusCodes.Status401Unauthorized, Messages.Unauthorized);
            },
            OnForbidden = async context =>
            {
                // По умолчанию ASP.NET отдаёт 403 с пустым телом — сохраняем
                // единый формат ошибок для всех кодов.
                await WriteErrorAsync(context.HttpContext, StatusCodes.Status403Forbidden, Messages.Forbidden);
            },
        };
    }

    /// <summary>Пишет единый JSON-ответ <c>{ message, errors? }</c>.</summary>
    private static async Task WriteErrorAsync(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json; charset=utf-8";
        var payload = new ErrorResponse(message);
        await context.Response.WriteAsync(
            JsonSerializer.Serialize(payload, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }
}
