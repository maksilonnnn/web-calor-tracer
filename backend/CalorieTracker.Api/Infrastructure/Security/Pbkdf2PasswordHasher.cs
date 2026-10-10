using System.Security.Cryptography;
using CalorieTracker.Api.Domain.Security;

namespace CalorieTracker.Api.Infrastructure.Security;

/// <summary>
/// Хеширование пароля PBKDF2-SHA256: случайная соль (16 байт), 210 000
/// итераций, 32-байтовый хеш. Формат строки:
/// <c>PBKDF2-SHA256$iterations$saltBase64$hashBase64</c>. Проверка — за
/// постоянное время (<see cref="CryptographicOperations.FixedTimeEquals"/>).
/// </summary>
public sealed class Pbkdf2PasswordHasher : IPasswordHasher
{
    public const int DefaultIterations = 210_000;
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const string Algorithm = "PBKDF2-SHA256";
    private const char Separator = '$';

    private readonly int _iterations;

    /// <summary>Итерации вынесены в параметр, чтобы юнит-тесты могли ускориться.</summary>
    public Pbkdf2PasswordHasher(int iterations = DefaultIterations)
    {
        if (iterations < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(iterations), "Число итераций должно быть положительным.");
        }

        _iterations = iterations;
    }

    public string Hash(string password)
    {
        ArgumentNullException.ThrowIfNull(password);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            _iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return string.Join(
            Separator,
            Algorithm,
            _iterations.ToString(System.Globalization.CultureInfo.InvariantCulture),
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public bool Verify(string password, string passwordHash)
    {
        if (password is null || string.IsNullOrEmpty(passwordHash))
        {
            return false;
        }

        var parts = passwordHash.Split(Separator);
        if (parts.Length != 4
            || !string.Equals(parts[0], Algorithm, StringComparison.Ordinal)
            || !int.TryParse(parts[1], System.Globalization.NumberStyles.Integer, System.Globalization.CultureInfo.InvariantCulture, out var iterations)
            || iterations < 1)
        {
            return false;
        }

        byte[] salt;
        byte[] expected;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expected = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expected.Length);

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
