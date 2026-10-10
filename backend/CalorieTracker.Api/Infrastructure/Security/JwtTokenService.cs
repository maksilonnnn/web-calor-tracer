using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Security;
using CalorieTracker.Api.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CalorieTracker.Api.Infrastructure.Security;

/// <summary>
/// Выпуск JWT (HS256) с идентификатором пользователя. Идентификатор кладётся
/// в стандартный claim <see cref="ClaimTypes.NameIdentifier"/>, имя и email —
/// в соответствующие claims, которые читают контроллеры.
/// </summary>
public sealed class JwtTokenService : ITokenService
{
    private readonly AuthOptions _options;
    private readonly JwtSecurityTokenHandler _handler = new();

    public JwtTokenService(IOptions<AuthOptions> options)
    {
        _options = options.Value;
    }

    public IssuedToken CreateToken(User user)
    {
        ArgumentNullException.ThrowIfNull(user);

        var issuedAt = DateTimeOffset.UtcNow;
        var expiresAt = issuedAt.AddMinutes(_options.AccessTtlMinutes);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name.Value),
            new Claim(ClaimTypes.Email, user.Email.Value),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.JwtKey)),
            SecurityAlgorithms.HmacSha256);

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _options.Issuer,
            IssuedAt = issuedAt.UtcDateTime,
            NotBefore = issuedAt.UtcDateTime,
            Expires = expiresAt.UtcDateTime,
            SigningCredentials = credentials,
        };

        var token = _handler.CreateToken(descriptor);
        return new IssuedToken
        {
            Token = _handler.WriteToken(token),
            ExpiresAt = expiresAt,
        };
    }
}
