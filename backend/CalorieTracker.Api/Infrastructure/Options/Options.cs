namespace CalorieTracker.Api.Infrastructure.Options;

/// <summary>
/// Настройки аутентификации. JwtKey в репозитории — только плейсхолдер:
/// реальное значение задаётся через user-secrets или переменную окружения
/// <c>Auth__JwtKey</c>. Приложение падает на старте, если ключ не задан.
/// </summary>
public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    /// <summary>Секрет подписи JWT (HS256). Обязателен, минимум 32 символа.</summary>
    public string JwtKey { get; set; } = string.Empty;

    /// <summary>Издатель токена (iss).</summary>
    public string Issuer { get; set; } = string.Empty;

    /// <summary>Время жизни access-токена в минутах.</summary>
    public int AccessTtlMinutes { get; set; } = 60;

    /// <summary>Имя httpOnly-cookie с токеном.</summary>
    public string CookieName { get; set; } = "access_token";

    /// <summary>Минимальная длина секретного ключа.</summary>
    public const int MinJwtKeyLength = 32;
}

/// <summary>Настройки CORS: список разрешённых источников для браузерного UI.</summary>
public sealed class CorsOptions
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; set; } = [];
}

/// <summary>Провайдер хранилища. Сейчас поддерживается только InMemory-заглушка.</summary>
public sealed class PersistenceOptions
{
    public const string SectionName = "Persistence";

    /// <summary>Имя провайдера; единственное поддерживаемое значение — InMemory.</summary>
    public string Provider { get; set; } = "InMemory";
}

/// <summary>Настройки начального заполнения (сида).</summary>
public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    /// <summary>Заполнять ли in-memory заглушку демо-данными при старте.</summary>
    public bool Enabled { get; set; } = true;
}
